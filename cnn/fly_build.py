"""Download FlyWire FAFB v783 and cut the mushroom body + soma cloud."""

from __future__ import annotations

import csv
import gzip
import json
import re
import urllib.request
from collections import defaultdict
from pathlib import Path

import numpy as np

from cnn.config import (
    FLY_MB_PATH,
    FLY_PUBLIC,
    FLYWIRE_DIR,
    SOMAS_BIN,
    SOMAS_META,
)
from cnn.fly_mb import save_circuit

CODEX = "https://storage.googleapis.com/flywire-data/codex/data/fafb/783"
FILES = (
    "classification.csv.gz",
    "coordinates.csv.gz",
    "connections.csv.gz",
    "consolidated_cell_types.csv.gz",
)

SUPER_CLASSES = [
    "optic",
    "central",
    "sensory",
    "visual_projection",
    "visual_centrifugal",
    "descending",
    "ascending",
    "motor",
    "endocrine",
]
KC_KEEP = 1200

_PN_TYPE = re.compile(r"(ALPN|uPN|lPN|mPN|adPN|vPN|tPN|ilPN|lvPN)", re.I)
_KC_TYPE = re.compile(r"^KC", re.I)
_MBON_TYPE = re.compile(r"^MBON", re.I)
_PAM_TYPE = re.compile(r"^PAM", re.I)
_PPL_TYPE = re.compile(r"^PPL1", re.I)


def _download(name: str, dest: Path) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 1000:
        print(f"  have {dest.name} ({dest.stat().st_size:,} bytes)")
        return dest
    url = f"{CODEX}/{name}"
    print(f"  downloading {url}")
    tmp = dest.with_suffix(dest.suffix + ".part")
    req = urllib.request.Request(url, headers={"User-Agent": "hennen-fly-build/1.0"})
    with urllib.request.urlopen(req, timeout=600) as resp, tmp.open("wb") as out:
        total = int(resp.headers.get("Content-Length") or 0)
        copied = 0
        last_mark = 0
        while True:
            chunk = resp.read(1024 * 1024)
            if not chunk:
                break
            out.write(chunk)
            copied += len(chunk)
            if copied - last_mark >= 20 * 1024 * 1024:
                last_mark = copied
                if total:
                    print(f"    {name} {copied / 1e6:.0f}/{total / 1e6:.0f} MB", flush=True)
                else:
                    print(f"    {name} {copied / 1e6:.0f} MB", flush=True)
    tmp.replace(dest)
    print(f"  saved {dest} ({dest.stat().st_size:,} bytes)")
    return dest


def _gz_dicts(path: Path):
    with gzip.open(path, "rt", newline="", encoding="utf-8") as handle:
        yield from csv.DictReader(handle)


def _is_pn(klass: str, ptype: str) -> bool:
    return klass == "ALPN" or bool(_PN_TYPE.search(ptype))


def _is_kc(klass: str, ptype: str) -> bool:
    return klass in {"Kenyon_Cell", "Kenyon cell", "KenyonCell"} or bool(_KC_TYPE.match(ptype))


def _is_mbon(klass: str, ptype: str) -> bool:
    return klass == "MBON" or bool(_MBON_TYPE.match(ptype))


def parse_xyz(raw: str) -> tuple[float, float, float] | None:
    parts = raw.strip().strip("[]").split()
    if len(parts) != 3:
        return None
    try:
        return float(parts[0]), float(parts[1]), float(parts[2])
    except ValueError:
        return None


def build(raw_dir: Path | None = None) -> None:
    raw = Path(raw_dir) if raw_dir else FLYWIRE_DIR
    raw.mkdir(parents=True, exist_ok=True)
    print("FlyWire FAFB v783")
    paths = {name: _download(name, raw / name) for name in FILES}

    types: dict[str, str] = {}
    for row in _gz_dicts(paths["consolidated_cell_types.csv.gz"]):
        rid = row.get("root_id") or next(iter(row.values()), "")
        types[rid] = (row.get("primary_type") or "").strip()

    klass: dict[str, tuple[str, str]] = {}
    for row in _gz_dicts(paths["classification.csv.gz"]):
        rid = row.get("root_id") or next(iter(row.values()), "")
        klass[rid] = (row.get("super_class") or "", row.get("class") or "")

    pos: dict[str, tuple[float, float, float]] = {}
    for row in _gz_dicts(paths["coordinates.csv.gz"]):
        rid = row.get("root_id") or next(iter(row.values()), "")
        if rid in pos:
            continue
        xyz = parse_xyz(row.get("position") or "")
        if xyz:
            pos[rid] = xyz
    print(f"  classification {len(klass)} · coordinates {len(pos)} · types {len(types)}")

    pn, kc_all, mbon, pam, ppl = [], [], [], [], []
    for rid in pos:
        super_c, cell_c = klass.get(rid, ("", ""))
        ptype = types.get(rid, "")
        if _is_pn(cell_c, ptype):
            pn.append(rid)
        if _is_kc(cell_c, ptype):
            kc_all.append(rid)
        if _is_mbon(cell_c, ptype):
            mbon.append(rid)
        if _PAM_TYPE.match(ptype) or (cell_c == "DAN" and ptype.upper().startswith("PAM")):
            pam.append(rid)
        if _PPL_TYPE.match(ptype) or (cell_c == "DAN" and "PPL1" in ptype.upper()):
            ppl.append(rid)

    pn, kc_all, mbon = sorted(set(pn)), sorted(set(kc_all)), sorted(set(mbon))
    pam, ppl = sorted(set(pam)), sorted(set(ppl))
    print(f"  populations PN={len(pn)} KC={len(kc_all)} MBON={len(mbon)} PAM={len(pam)} PPL1={len(ppl)}")
    if len(pn) < 8 or len(kc_all) < 8 or len(mbon) < 4:
        raise RuntimeError("Could not identify mushroom-body cell types in Codex dumps.")

    ordered = sorted(pos)
    soma_index = {rid: i for i, rid in enumerate(ordered)}
    pn_set, kc_set, mbon_set = set(pn), set(kc_all), set(mbon)
    dan = pam + ppl
    dan_set = set(dan)
    mb_ids = pn_set | kc_set | mbon_set | dan_set

    # Sparse edge buckets among MB cells only.
    buckets: dict[str, list[tuple[int, int, float]]] = defaultdict(list)
    pn_idx = {rid: i for i, rid in enumerate(pn)}
    kc_idx = {rid: i for i, rid in enumerate(kc_all)}
    mbon_idx = {rid: i for i, rid in enumerate(mbon)}
    dan_idx = {rid: i for i, rid in enumerate(dan)}
    pn_to_kc = np.zeros(len(kc_all), dtype=np.float64)
    kc_to_mbon = np.zeros(len(kc_all), dtype=np.float64)
    pam_mbon = np.zeros(len(mbon), dtype=np.float64)
    ppl_mbon = np.zeros(len(mbon), dtype=np.float64)
    n_edges = 0
    scanned = 0
    pam_set = set(pam)
    for row in _gz_dicts(paths["connections.csv.gz"]):
        scanned += 1
        if scanned % 2_000_000 == 0:
            print(f"  connections scanned {scanned:,} · MB edges {n_edges:,}", flush=True)
        pre = row.get("pre_root_id") or row.get("pre") or ""
        post = row.get("post_root_id") or row.get("post") or ""
        if not pre or not post:
            keys = list(row.keys())
            pre = row.get(keys[0], "") if keys else ""
            post = row.get(keys[1], "") if len(keys) > 1 else ""
        if pre not in mb_ids or post not in mb_ids:
            continue
        try:
            syn = float(row.get("syn_count") or 1.0)
        except ValueError:
            syn = 1.0
        n_edges += 1
        if pre in pn_idx and post in kc_idx:
            buckets["pn_kc"].append((pn_idx[pre], kc_idx[post], syn))
            pn_to_kc[kc_idx[post]] += syn
        elif pre in kc_idx and post in mbon_idx:
            buckets["kc_mbon"].append((kc_idx[pre], mbon_idx[post], syn))
            kc_to_mbon[kc_idx[pre]] += syn
        elif pre in dan_idx and post in mbon_idx:
            buckets["dan_mbon"].append((dan_idx[pre], mbon_idx[post], syn))
            if pre in pam_set:
                pam_mbon[mbon_idx[post]] += syn
            else:
                ppl_mbon[mbon_idx[post]] += syn
        elif pre in mbon_idx and post in mbon_idx:
            buckets["mbon_mbon"].append((mbon_idx[pre], mbon_idx[post], syn))
    print(f"  MB edges kept {n_edges}")

    live = (pn_to_kc > 0) & (kc_to_mbon > 0)
    live_idx = np.flatnonzero(live)
    if live_idx.size == 0:
        live_idx = np.arange(len(kc_all))
    if KC_KEEP and live_idx.size > KC_KEEP:
        score = pn_to_kc[live_idx] + kc_to_mbon[live_idx]
        order = np.argsort(-score, kind="stable")
        pick = np.sort(order[np.linspace(0, len(order) - 1, KC_KEEP).astype(int)])
        live_idx = live_idx[pick]
    kc = [kc_all[i] for i in live_idx]
    old_to_new = {int(old): new for new, old in enumerate(live_idx)}

    def _mat(name: str, shape: tuple[int, int], remap_col: dict[int, int] | None = None) -> np.ndarray:
        mat = np.zeros(shape, dtype=np.float64)
        for r, c, v in buckets[name]:
            if remap_col is not None:
                if c not in remap_col:
                    continue
                c = remap_col[c]
            mat[r, c] += v
        return mat

    n_kc = len(kc)
    pn_kc = _mat("pn_kc", (len(pn), n_kc), old_to_new)
    kc_mbon = np.zeros((n_kc, len(mbon)), dtype=np.float64)
    for r, c, v in buckets["kc_mbon"]:
        if r not in old_to_new:
            continue
        kc_mbon[old_to_new[r], c] += v
    dan_mbon = _mat("dan_mbon", (len(dan), len(mbon)))
    mbon_mbon = _mat("mbon_mbon", (len(mbon), len(mbon)))
    np.fill_diagonal(mbon_mbon, 0)

    valence = np.where(ppl_mbon > pam_mbon, 1, -1).astype(np.int8)
    valence[(pam_mbon == 0) & (ppl_mbon == 0)] = 0
    if not dan:
        # No DANs labelled: split MBONs so sugar/choc still have two pools.
        valence = np.array([1 if i % 2 == 0 else -1 for i in range(len(mbon))], dtype=np.int8)
        dan_mbon = np.ones((2, len(mbon)), dtype=np.float64)
        punish = np.array([0, 1], dtype=np.int8)
        dan_soma = np.array([0, 0], dtype=np.int32)
    else:
        punish = np.array([0] * len(pam) + [1] * len(ppl), dtype=np.int8)
        dan_soma = np.array([soma_index[r] for r in dan], dtype=np.int32)

    info = {
        "mbon_valence": valence,
        "dan_is_punishment": punish,
        "pn_soma": np.array([soma_index[r] for r in pn], dtype=np.int32),
        "kc_soma": np.array([soma_index[r] for r in kc], dtype=np.int32),
        "mbon_soma": np.array([soma_index[r] for r in mbon], dtype=np.int32),
        "dan_soma": dan_soma,
        "n_somas": len(ordered),
    }
    blocks = {
        "pn_kc": pn_kc,
        "kc_mbon": kc_mbon,
        "dan_mbon": dan_mbon,
        "mbon_mbon": mbon_mbon,
    }
    save_circuit(blocks, info, FLY_MB_PATH)
    print(f"  wrote {FLY_MB_PATH}  PN {len(pn)} KC {n_kc} MBON {len(mbon)}")

    xs = [p[0] for p in pos.values()]
    ys = [p[1] for p in pos.values()]
    zs = [p[2] for p in pos.values()]
    cx, cy, cz = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, (min(zs) + max(zs)) / 2
    extent = max(max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs)) or 1.0
    scale = 20.0 / extent
    sc_idx = {name: i for i, name in enumerate(SUPER_CLASSES)}
    FLY_PUBLIC.mkdir(parents=True, exist_ok=True)
    packed = np.zeros(len(ordered), dtype=np.dtype([("x", "<f4"), ("y", "<f4"), ("z", "<f4"), ("c", "u1"), ("p", "V3")]))
    for i, rid in enumerate(ordered):
        x, y, z = pos[rid]
        packed[i]["x"] = (x - cx) * scale
        packed[i]["y"] = -(y - cy) * scale
        packed[i]["z"] = -(z - cz) * scale
        packed[i]["c"] = sc_idx.get(klass.get(rid, ("central", ""))[0], 1)
    packed.tofile(SOMAS_BIN)
    meta = {
        "n": len(ordered),
        "bytes_per": 16,
        "classes": SUPER_CLASSES,
        "source": "FlyWire Codex FAFB v783 coordinates.csv + classification.csv",
        "citation": "Dorkenwald et al. Nature 634, 124-138 (2024). CC BY-NC 4.0.",
        "mb": {"pn": len(pn), "kc": n_kc, "mbon": len(mbon), "dan": int(dan_mbon.shape[0])},
    }
    SOMAS_META.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"  wrote {SOMAS_BIN} ({len(ordered)} somas)")


if __name__ == "__main__":
    build()
