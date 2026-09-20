from __future__ import annotations

import pickle
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from PIL import Image

from cnn.config import ARTIFACT_PATH, EMBED_DIM, TTA_FLIP
from cnn.images import list_images, open_rgb


class HennenHead(nn.Module):
    """Tiny classifier trained once on FaceNet embeddings. Not retrained at predict time."""

    def __init__(self, dim: int = EMBED_DIM) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(dim, 64),
            nn.ReLU(),
            nn.Dropout(0.25),
            nn.Linear(64, 2),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        z = self.net[0](x)
        hidden = self.net[1](z)
        logits = self.net[3](self.net[2](hidden))
        self.last_input = x.detach()
        self.last_hidden = hidden.detach()
        self.last_logits = logits.detach()
        return logits


def decide_hennen(cosine: float, head_p: float, threshold: float) -> tuple[bool, float]:
    """Gallery cosine is the identity check; the tiny head cannot override a miss.

    The 57% false-positive case was cosine 0.30 (cut ~0.61) with head_p ≈ 1.0.
    A 0.55/0.45 blend still crossed 0.5. If cosine is below the FaceNet cut,
    report the cosine probability only.
    """
    cosine_p = float(1.0 / (1.0 + np.exp(-12.0 * (cosine - threshold))))
    blend = 0.55 * head_p + 0.45 * cosine_p
    is_hennen = cosine >= threshold
    p_hennen = float(blend) if is_hennen else cosine_p
    return is_hennen, p_hennen


@dataclass
class PredictResult:
    is_hennen: bool
    label: str
    confidence: float
    cosine: float
    face_found: bool
    detail: str
    fly: dict | None = None


class HennenDetector:
    def __init__(self, artifact_path: Path = ARTIFACT_PATH) -> None:
        if not artifact_path.exists():
            raise FileNotFoundError(
                f"No trained model at {artifact_path}. Run: python -m cnn.train"
            )
        blob = torch.load(artifact_path, map_location="cpu", weights_only=False)
        self.proto = blob["proto"].float()
        self.threshold = float(blob["threshold"])
        self.metrics: dict = blob.get("metrics", {})
        self.n_hennen = int(blob.get("n_hennen", 0))
        self.n_other = int(blob.get("n_other", 0))
        self.head = HennenHead()
        self.head.load_state_dict(blob["head"])
        self.head.eval()
        self.scaler_mean = blob["scaler_mean"].float()
        self.scaler_std = blob["scaler_std"].float().clamp_min(1e-6)
        from cnn.fly_mb import FlyMushroom

        self.fly = FlyMushroom.try_load()
        self._fly_stamp = 0.0

    def _refresh_fly(self) -> None:
        from cnn.config import FLY_GAINS_PATH, FLY_MB_PATH
        from cnn.fly_mb import FlyMushroom

        stamp = 0.0
        if FLY_MB_PATH.exists():
            stamp += FLY_MB_PATH.stat().st_mtime
        if FLY_GAINS_PATH.exists():
            stamp += FLY_GAINS_PATH.stat().st_mtime
        if stamp == self._fly_stamp:
            return
        self._fly_stamp = stamp
        self.fly = FlyMushroom.try_load()

    def _head_prob(self, emb: torch.Tensor) -> float:
        x = (emb - self.scaler_mean) / self.scaler_std
        with torch.inference_mode():
            logits = self.head(x.unsqueeze(0))
            return float(torch.softmax(logits, dim=1)[0, 1])

    def _push_live(
        self,
        *,
        phase: str,
        subtitle: str,
        face,
        maps,
        emb: torch.Tensor | None = None,
        output: np.ndarray | None = None,
    ) -> None:
        from cnn.visual import push_active, snapshot_from_head

        if emb is None:
            x = torch.zeros(1, EMBED_DIM)
            snap = snapshot_from_head(
                self.head,
                x,
                phase=phase,
                subtitle=subtitle,
                maps=maps,
                face=face,
            )
            snap.input_act = np.zeros(EMBED_DIM, dtype=np.float32)
            snap.hidden_act = np.zeros(64, dtype=np.float32)
            snap.output_act = np.array([0.5, 0.5], dtype=np.float32)
        else:
            x = ((emb - self.scaler_mean) / self.scaler_std).unsqueeze(0)
            snap = snapshot_from_head(
                self.head,
                x,
                phase=phase,
                subtitle=subtitle,
                maps=maps,
                face=face,
            )
            if output is not None:
                snap.output_act = np.asarray(output, dtype=np.float32)
        snap.epoch = None
        snap.epochs = None
        snap.loss = None
        push_active(snap)

    def predict_image(self, img: Image.Image) -> PredictResult:
        from cnn.faces import embed_image, set_embed_stage_cb

        self._refresh_fly()

        def on_stage(stage: str, face=None, maps=None, emb=None) -> None:
            if stage == "scan":
                self._push_live(
                    phase="detect · scanning",
                    subtitle="analyse…",
                    face=None,
                    maps=None,
                )
            elif stage == "crop":
                self._push_live(
                    phase="detect · scanning",
                    subtitle="visage verrouillé · FaceNet…",
                    face=face,
                    maps=None,
                )
            elif stage == "conv":
                self._push_live(
                    phase="detect · scanning",
                    subtitle="FaceNet conv1 en direct",
                    face=face,
                    maps=maps,
                )
            elif stage == "embed" and emb is not None:
                self._push_live(
                    phase="detect · scanning",
                    subtitle="empreinte 512-d…",
                    face=face,
                    maps=maps,
                    emb=emb,
                )

        set_embed_stage_cb(on_stage)
        try:
            emb = embed_image(img, tta_flip=TTA_FLIP)
        finally:
            set_embed_stage_cb(None)

        if emb is None:
            return PredictResult(
                is_hennen=False,
                label="PAS DE VISAGE",
                confidence=0.0,
                cosine=0.0,
                face_found=False,
                detail="Le CNN a besoin d'un visage visible sur la photo.",
                fly=None,
            )
        cosine = float(torch.nn.functional.cosine_similarity(emb, self.proto, dim=0))
        head_p = self._head_prob(emb)
        is_hennen, p_hennen = decide_hennen(cosine, head_p, self.threshold)
        label = "HENNEN" if is_hennen else "PAS HENNEN"
        confidence = p_hennen if is_hennen else 1.0 - p_hennen
        try:
            from cnn.faces import consume_facenet_viz

            bundle = consume_facenet_viz()
            self._push_live(
                phase="detect · forward pass",
                subtitle=f"{label}  {confidence:.0%}",
                face=bundle.get("face"),
                maps=bundle.get("maps"),
                emb=emb,
                output=np.array([1.0 - p_hennen, p_hennen], dtype=np.float32),
            )
        except Exception:
            pass
        fly_payload = None
        if self.fly is not None:
            try:
                vote = self.fly.vote(emb.detach().cpu().numpy())
                fly_payload = {
                    "is_hennen": vote.is_hennen,
                    "label": vote.label,
                    "confidence": round(vote.confidence, 4),
                    "valence": round(vote.valence, 4),
                    "sparsity": round(vote.sparsity, 4),
                    "lit": vote.lit,
                }
            except Exception:
                fly_payload = None
        return PredictResult(
            is_hennen=is_hennen,
            label=label,
            confidence=confidence,
            cosine=cosine,
            face_found=True,
            detail="Correspond à la galerie Hennen" if is_hennen else "Autre personne",
            fly=fly_payload,
        )

    def predict_path(self, path: Path | str) -> PredictResult:
        return self.predict_image(open_rgb(path))


def save_artifact(payload: dict, path: Path = ARTIFACT_PATH) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(payload, path)
    # sklearn-free pickle companion for debugging
    meta = {k: payload[k] for k in ("threshold", "metrics", "n_hennen", "n_other") if k in payload}
    (path.with_suffix(".meta.pkl")).write_bytes(pickle.dumps(meta))
