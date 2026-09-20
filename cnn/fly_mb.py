"""Connectome-constrained mushroom body (fly-blackjack math, FlyWire IDs).

MEASURED: PN→KC, KC→MBON, DAN→MBON, MBON→MBON edges from the connectome.
INVENTED: rate units, k-winners-take-all, 512-d → PN odour map, learning rate.

Ported from WilliamJones/fly-blackjack flybrain/mb/model.py (MIT).
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np

from cnn.config import EMBED_DIM, FLY_GAINS_PATH, FLY_MB_PATH

KC_SPARSITY = 0.06
LEARNING_RATE = 0.55
DECAY = 0.012
GAIN_FLOOR = 0.0
LATERAL = 0.25
ODOR_SEED = 20260920


def _dense(z: np.lib.npyio.NpzFile, name: str) -> np.ndarray:
    shape = tuple(int(x) for x in z[f"{name}_shape"])
    mat = np.zeros(shape, dtype=np.float64)
    row = z[f"{name}_row"]
    col = z[f"{name}_col"]
    val = z[f"{name}_val"]
    if len(row):
        mat[row, col] = val
    return mat


def _normalise(weights: np.ndarray) -> np.ndarray:
    scale = weights.sum(axis=0, keepdims=True)
    scale[scale == 0] = 1.0
    return weights / scale


def _coo_arrays(mat: np.ndarray, name: str) -> dict[str, np.ndarray]:
    row, col = np.nonzero(mat)
    return {
        f"{name}_row": row.astype(np.int32),
        f"{name}_col": col.astype(np.int32),
        f"{name}_val": mat[row, col].astype(np.float32),
        f"{name}_shape": np.array(mat.shape, np.int32),
    }


def synthetic_circuit(seed: int = 0) -> tuple[dict[str, np.ndarray], dict]:
    """Tiny dense-enough circuit for tests. Cortex somas exist so lit-index checks bite."""
    rng = np.random.default_rng(seed)
    n_pn, n_kc, n_mbon, n_dan = 16, 32, 8, 8
    n_cortex = 24
    pn_kc = (rng.random((n_pn, n_kc)) > 0.45).astype(np.float64)
    kc_mbon = (rng.random((n_kc, n_mbon)) > 0.4).astype(np.float64)
    dan_mbon = (rng.random((n_dan, n_mbon)) > 0.35).astype(np.float64)
    mbon_mbon = (rng.random((n_mbon, n_mbon)) > 0.85).astype(np.float64)
    np.fill_diagonal(mbon_mbon, 0)
    valence = np.array([1, 1, 1, 1, -1, -1, -1, -1], dtype=np.int8)
    punish = np.array([0, 0, 0, 0, 1, 1, 1, 1], dtype=np.int8)
    pn_soma = np.arange(n_pn, dtype=np.int32)
    kc_soma = np.arange(n_pn, n_pn + n_kc, dtype=np.int32)
    mbon_soma = np.arange(n_pn + n_kc, n_pn + n_kc + n_mbon, dtype=np.int32)
    dan_soma = np.arange(
        n_pn + n_kc + n_mbon,
        n_pn + n_kc + n_mbon + n_dan,
        dtype=np.int32,
    )
    n_somas = int(dan_soma[-1] + 1 + n_cortex)
    info = {
        "mbon_valence": valence,
        "dan_is_punishment": punish,
        "pn_soma": pn_soma,
        "kc_soma": kc_soma,
        "mbon_soma": mbon_soma,
        "dan_soma": dan_soma,
        "n_somas": n_somas,
    }
    blocks = {
        "pn_kc": pn_kc,
        "kc_mbon": kc_mbon,
        "dan_mbon": dan_mbon,
        "mbon_mbon": mbon_mbon,
    }
    return blocks, info


def save_circuit(
    blocks: dict[str, np.ndarray],
    info: dict,
    path: Path,
) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    arrays: dict[str, np.ndarray] = {}
    for name, mat in blocks.items():
        arrays.update(_coo_arrays(np.asarray(mat, dtype=np.float64), name))
    arrays["mbon_valence"] = np.asarray(info["mbon_valence"], dtype=np.int8)
    arrays["dan_is_punishment"] = np.asarray(info["dan_is_punishment"], dtype=np.int8)
    arrays["pn_soma"] = np.asarray(info["pn_soma"], dtype=np.int32)
    arrays["kc_soma"] = np.asarray(info["kc_soma"], dtype=np.int32)
    arrays["mbon_soma"] = np.asarray(info["mbon_soma"], dtype=np.int32)
    arrays["dan_soma"] = np.asarray(info["dan_soma"], dtype=np.int32)
    arrays["n_somas"] = np.array([int(info["n_somas"])], dtype=np.int32)
    np.savez_compressed(path, **arrays)


class MushroomBody:
    def __init__(self, path: Path | str = FLY_MB_PATH, sparsity: float = KC_SPARSITY) -> None:
        z = np.load(path)
        self.W_pn_kc = _normalise(_dense(z, "pn_kc"))
        self.W_kc_mbon_raw = _dense(z, "kc_mbon")
        self.W_dan_mbon = _normalise(_dense(z, "dan_mbon"))
        self.W_mbon_mbon = _normalise(_dense(z, "mbon_mbon"))
        self.valence = z["mbon_valence"].astype(np.float64)
        self.punish_mask = z["dan_is_punishment"].astype(bool)
        self.W_kc_mbon = _normalise(self.W_kc_mbon_raw)
        self.n_kc, self.n_mbon = self.W_kc_mbon.shape
        self.n_pn = int(self.W_pn_kc.shape[0])
        self.n_dan = int(self.W_dan_mbon.shape[0])
        self.k = max(1, int(round(sparsity * self.n_kc)))
        self.lr = LEARNING_RATE
        self.decay = DECAY
        self.lateral = LATERAL
        self.pn_soma = z["pn_soma"].astype(np.int32)
        self.kc_soma = z["kc_soma"].astype(np.int32)
        self.mbon_soma = z["mbon_soma"].astype(np.int32)
        self.dan_soma = z["dan_soma"].astype(np.int32)
        self.n_somas = int(z["n_somas"][0]) if "n_somas" in z.files else int(self.mbon_soma.max() + 1)
        self.reset()

    def reset(self) -> None:
        self.gain = np.ones((self.n_kc, self.n_mbon))

    def load_gain(self, path: Path | str) -> None:
        blob = np.load(path)
        gain = blob["gain"]
        if gain.shape != self.gain.shape:
            raise ValueError(f"gain shape {gain.shape} != {self.gain.shape}")
        self.gain = gain.astype(np.float64)

    def pn_drive(self, pn_activity: np.ndarray) -> np.ndarray:
        return self.W_pn_kc.T @ pn_activity

    def kenyon(self, pn_activity: np.ndarray) -> np.ndarray:
        return self.kenyon_from_drive(self.pn_drive(pn_activity))

    def kenyon_from_drive(self, drive: np.ndarray) -> np.ndarray:
        if drive.max() <= 0:
            return np.zeros(self.n_kc)
        cut = np.partition(drive, -self.k)[-self.k]
        kc = np.where(drive >= cut, drive, 0.0)
        top = kc.max()
        return kc / top if top > 0 else kc

    def dopamine(self, punish: float, reward: float) -> np.ndarray:
        dan = np.zeros(self.n_dan)
        dan[self.punish_mask] = punish
        dan[~self.punish_mask] = reward
        return self.W_dan_mbon.T @ dan

    def present(
        self,
        pn_activity: np.ndarray,
        punish: float = 0.0,
        reward: float = 0.0,
        learn: bool = True,
    ) -> dict:
        kc = self.kenyon(pn_activity)
        mbon = (self.W_kc_mbon * self.gain).T @ kc
        mbon = mbon + self.lateral * (self.W_mbon_mbon.T @ mbon)
        da = self.dopamine(punish, reward)
        if learn and (punish or reward):
            self.gain -= self.lr * np.outer(kc, da)
        if learn:
            self.gain += self.decay * (1.0 - self.gain)
            np.clip(self.gain, GAIN_FLOOR, 1.0, out=self.gain)
        return {
            "kc": kc,
            "mbon": mbon,
            "dopamine": da,
            "pn": np.asarray(pn_activity, dtype=np.float64),
            "valence": float(mbon @ self.valence),
            "sparsity": float((kc > 0).mean()),
        }

    def valence_of(self, pn_activity: np.ndarray) -> float:
        return float(self.present(pn_activity, learn=False)["valence"])


def odor_projection(n_pn: int, dim: int = EMBED_DIM, seed: int = ODOR_SEED, k: int = 12) -> np.ndarray:
    """Sparse excitatory map: each PN sniffs a few FaceNet channels (fixed seed)."""
    rng = np.random.default_rng(seed)
    proj = np.zeros((dim, n_pn), dtype=np.float64)
    take = min(k, dim)
    for j in range(n_pn):
        idx = rng.choice(dim, size=take, replace=False)
        proj[idx, j] = np.abs(rng.standard_normal(take))
    return proj


def embed_to_pn(emb: np.ndarray, proj: np.ndarray) -> np.ndarray:
    vec = np.asarray(emb, dtype=np.float64).reshape(-1)
    nrm = float(np.linalg.norm(vec))
    if nrm > 0:
        vec = vec / nrm
    driven = np.maximum(0.0, vec @ proj)
    peak = driven.max()
    return driven / peak if peak > 0 else driven


def lit_soma_indices(mb: MushroomBody, pn_activity: np.ndarray, step: dict, cap: int = 400) -> list[int]:
    """Soma indices of active PNs, winning Kenyon cells, and strong MBONs."""
    pn = np.asarray(step.get("pn", pn_activity), dtype=np.float64)
    kc = np.asarray(step["kc"])
    mbon = np.asarray(step["mbon"])
    lit: list[int] = []
    if pn.size:
        cut = max(float(pn.max()) * 0.25, 1e-9)
        lit.extend(int(i) for i in mb.pn_soma[pn >= cut])
    lit.extend(int(i) for i in mb.kc_soma[kc > 0])
    if mbon.size:
        order = np.argsort(-np.abs(mbon))
        top = order[: max(1, min(8, mb.n_mbon))]
        lit.extend(int(mb.mbon_soma[i]) for i in top if abs(mbon[i]) > 0)
    uniq: list[int] = []
    seen: set[int] = set()
    for idx in lit:
        if 0 <= idx < mb.n_somas and idx not in seen:
            seen.add(idx)
            uniq.append(idx)
        if len(uniq) >= cap:
            break
    return uniq


@dataclass
class FlyVote:
    is_hennen: bool
    label: str
    confidence: float
    valence: float
    sparsity: float
    lit: list[int]


class FlyMushroom:
    """Frozen mushroom body used at detect time. Missing files → None from try_load()."""

    def __init__(self, circuit: Path = FLY_MB_PATH, gains: Path = FLY_GAINS_PATH) -> None:
        self.mb = MushroomBody(circuit)
        blob = np.load(gains)
        self.mb.load_gain(gains)
        self.proj = blob["proj"].astype(np.float64)
        raw_t = blob["threshold"] if "threshold" in blob.files else 0.0
        self.threshold = float(np.asarray(raw_t).reshape(-1)[0])

    @classmethod
    def try_load(cls) -> FlyMushroom | None:
        if not FLY_MB_PATH.exists() or not FLY_GAINS_PATH.exists():
            return None
        try:
            return cls()
        except Exception:
            return None

    def vote(self, emb) -> FlyVote:
        pn = embed_to_pn(np.asarray(emb, dtype=np.float64), self.proj)
        step = self.mb.present(pn, learn=False)
        valence = float(step["valence"])
        is_hennen = valence > self.threshold
        # squash valence into a 0–1 confidence
        conf = float(1.0 / (1.0 + np.exp(-3.0 * abs(valence - self.threshold))))
        return FlyVote(
            is_hennen=is_hennen,
            label="HENNEN" if is_hennen else "PAS HENNEN",
            confidence=conf,
            valence=valence,
            sparsity=float(step["sparsity"]),
            lit=lit_soma_indices(self.mb, pn, step),
        )
