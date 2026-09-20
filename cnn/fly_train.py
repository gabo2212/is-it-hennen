"""Train mushroom-body gains once on FaceNet gallery embeddings. Never at detect time."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import torch

from cnn.config import ARTIFACT_PATH, FLY_GAINS_PATH, FLY_MB_PATH, NOT_HENNEN_DIR
from cnn.fly_mb import MushroomBody, embed_to_pn, odor_projection
from cnn.images import list_images


def train_fly(artifact: Path = ARTIFACT_PATH, epochs: int = 6) -> None:
    if not FLY_MB_PATH.exists():
        raise SystemExit("Missing models/fly_mb.npz. Run: python -m cnn fly_build")
    if not artifact.exists():
        raise SystemExit("Missing models/hennen.pt. Run: python -m cnn train first")

    blob = torch.load(artifact, map_location="cpu", weights_only=False)
    hennen = blob["hennen_embeddings"].float().numpy()
    other = None
    if "other_embeddings" in blob:
        other = blob["other_embeddings"].float().numpy()
    elif NOT_HENNEN_DIR.exists() and list_images(NOT_HENNEN_DIR):
        from cnn.train import _stack_embeddings

        other = _stack_embeddings(list_images(NOT_HENNEN_DIR), "not-Hennen").numpy()
    if other is None or len(other) == 0:
        raise SystemExit("Need not-Hennen embeddings (data/not_hennen or other_embeddings in hennen.pt)")

    mb = MushroomBody(FLY_MB_PATH)
    proj = odor_projection(mb.n_pn, dim=hennen.shape[1])
    print(f"Mushroom body train: {len(hennen)} Hennen · {len(other)} others · {mb.n_pn} PN")
    for _ in range(epochs):
        for vec in hennen:
            mb.present(embed_to_pn(vec, proj), reward=1.0, learn=True)
        for vec in other:
            mb.present(embed_to_pn(vec, proj), punish=1.0, learn=True)

    pos = [mb.valence_of(embed_to_pn(v, proj)) for v in hennen]
    neg = [mb.valence_of(embed_to_pn(v, proj)) for v in other]
    # Conservative cut: keep every gallery Hennen, reject as many others as possible.
    threshold = float(np.min(pos) - 1e-6)
    scores = np.concatenate([np.asarray(pos, dtype=np.float64), np.asarray(neg, dtype=np.float64)])
    labels = np.concatenate([np.ones(len(pos)), np.zeros(len(neg))])
    best_acc = float(((scores > threshold) == labels).mean())
    # If that overlap is ugly, fall back to max-accuracy sweep.
    if best_acc < 0.9:
        best_acc = -1.0
        for cut in np.unique(scores):
            acc_cut = float(((scores > cut) == labels).mean())
            if acc_cut > best_acc:
                best_acc = acc_cut
                threshold = float(cut)
    FLY_GAINS_PATH.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(
        FLY_GAINS_PATH,
        gain=mb.gain.astype(np.float32),
        proj=proj.astype(np.float32),
        threshold=np.array([threshold], dtype=np.float32),
        pos_mean=np.array([np.mean(pos)], dtype=np.float32),
        neg_mean=np.array([np.mean(neg)], dtype=np.float32),
    )
    acc = (sum(v > threshold for v in pos) + sum(v <= threshold for v in neg)) / (len(pos) + len(neg))
    print(f"Saved {FLY_GAINS_PATH}")
    print(f"  valence Hennen {np.mean(pos):.3f} · other {np.mean(neg):.3f} · cut {threshold:.3f}")
    print(f"  gallery acc {acc:.3f}")
    print("Detect time will ONLY load this file — no mushroom-body retraining.")


if __name__ == "__main__":
    train_fly()
