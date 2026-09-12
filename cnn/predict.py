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


@dataclass
class PredictResult:
    is_hennen: bool
    label: str
    confidence: float
    cosine: float
    face_found: bool
    detail: str


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

    def _head_prob(self, emb: torch.Tensor) -> float:
        x = (emb - self.scaler_mean) / self.scaler_std
        with torch.inference_mode():
            logits = self.head(x.unsqueeze(0))
            return float(torch.softmax(logits, dim=1)[0, 1])

    def predict_image(self, img: Image.Image) -> PredictResult:
        from cnn.faces import embed_image

        emb = embed_image(img, tta_flip=TTA_FLIP)
        if emb is None:
            return PredictResult(
                is_hennen=False,
                label="NO FACE",
                confidence=0.0,
                cosine=0.0,
                face_found=False,
                detail="The CNN needs a visible face in the photo.",
            )
        cosine = float(torch.nn.functional.cosine_similarity(emb, self.proto, dim=0))
        head_p = self._head_prob(emb)
        # Same score the detector card uses (not head-softmax alone).
        cosine_p = 1 / (1 + np.exp(-12 * (cosine - self.threshold)))
        p_hennen = float(0.55 * head_p + 0.45 * float(cosine_p))
        is_hennen = p_hennen >= 0.5
        label = "HENNEN" if is_hennen else "NOT HENNEN"
        confidence = p_hennen if is_hennen else 1.0 - p_hennen
        try:
            from cnn.visual import last_conv_maps, push_active, snapshot_from_head

            x = ((emb - self.scaler_mean) / self.scaler_std).unsqueeze(0)
            snap = snapshot_from_head(
                self.head,
                x,
                phase="detect · forward pass",
                subtitle=f"{label}  {confidence:.0%}",
                conv_maps=last_conv_maps(),
            )
            snap.output_act = np.array([1.0 - p_hennen, p_hennen], dtype=np.float32)
            snap.epoch = None
            snap.epochs = None
            snap.loss = None
            push_active(snap)
        except Exception:
            pass
        return PredictResult(
            is_hennen=is_hennen,
            label=label,
            confidence=confidence,
            cosine=cosine,
            face_found=True,
            detail="Matched Hennen gallery" if is_hennen else "Different person",
        )

    def predict_path(self, path: Path | str) -> PredictResult:
        return self.predict_image(open_rgb(path))


def save_artifact(payload: dict, path: Path = ARTIFACT_PATH) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(payload, path)
    # sklearn-free pickle companion for debugging
    meta = {k: payload[k] for k in ("threshold", "metrics", "n_hennen", "n_other") if k in payload}
    (path.with_suffix(".meta.pkl")).write_bytes(pickle.dumps(meta))
