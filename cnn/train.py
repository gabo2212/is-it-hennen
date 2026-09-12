"""Train once: lock Hennen's face into models/hennen.pt. Never train at detect time."""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
from tqdm import tqdm

from cnn.config import (
    ARTIFACT_PATH,
    HEAD_EPOCHS,
    HEAD_LR,
    HENNEN_DIR,
    MIN_HENNEN_SHOTS,
    NOISE_AUGMENTS,
    NOT_HENNEN_DIR,
    RECOMMENDED_SHOTS,
)
from cnn.faces import embed_path
from cnn.fetch_negatives import fetch_negative_faces
from cnn.predict import HennenHead, list_images, save_artifact


def _stack_embeddings(paths: list[Path], label: str) -> torch.Tensor:
    vecs: list[torch.Tensor] = []
    skipped = 0
    for path in tqdm(paths, desc=f"CNN embed {label}", unit="img"):
        vec = embed_path(path, tta_flip=True)
        if vec is None:
            skipped += 1
            continue
        vecs.append(vec)
    if skipped:
        print(f"  skipped {skipped} {label} image(s) with no detectable face")
    if not vecs:
        raise RuntimeError(f"No faces found in {label} images.")
    return torch.stack(vecs)


def _train_head(
    hennen: torch.Tensor, other: torch.Tensor
) -> tuple[HennenHead, torch.Tensor, torch.Tensor]:
    x = torch.cat([hennen, other], dim=0)
    y = torch.cat(
        [torch.ones(len(hennen), dtype=torch.long), torch.zeros(len(other), dtype=torch.long)]
    )
    mean = x.mean(0)
    std = x.std(0).clamp_min(1e-6)
    x_n = (x - mean) / std

    # Embedding-space augmentation so 20–30 photos still train a stable head.
    extra_x = []
    extra_y = []
    for _ in range(NOISE_AUGMENTS):
        extra_x.append(x_n + 0.04 * torch.randn_like(x_n))
        extra_y.append(y)
    x_aug = torch.cat([x_n, *extra_x], dim=0)
    y_aug = torch.cat([y, *extra_y], dim=0)

    n_pos, n_neg = len(hennen), len(other)
    w = torch.tensor([n_pos / (n_pos + n_neg), n_neg / (n_pos + n_neg)])
    # Inverse-frequency weights: minority class gets a boost.
    weight = torch.tensor(
        [(n_pos + n_neg) / (2 * n_neg), (n_pos + n_neg) / (2 * n_pos)], dtype=torch.float32
    )

    head = HennenHead()
    opt = torch.optim.AdamW(head.parameters(), lr=HEAD_LR, weight_decay=1e-3)
    head.train()
    for _ in range(HEAD_EPOCHS):
        perm = torch.randperm(len(x_aug))
        logits = head(x_aug[perm])
        loss = F.cross_entropy(logits, y_aug[perm], weight=weight)
        opt.zero_grad()
        loss.backward()
        opt.step()
    head.eval()
    _ = w
    return head, mean, std


def _loo_cosine_scores(hennen: torch.Tensor) -> np.ndarray:
    n = len(hennen)
    scores = np.zeros(n, dtype=np.float64)
    for i in range(n):
        proto = F.normalize((hennen.sum(0) - hennen[i]) / (n - 1), dim=0)
        scores[i] = float(F.cosine_similarity(hennen[i], proto, dim=0))
    return scores


def _pick_threshold(pos: np.ndarray, neg: np.ndarray) -> tuple[float, dict]:
    """Max F1 on cosine(query, Hennen prototype)."""
    extra = np.array([(float(pos.min()) + float(pos.mean())) / 2])
    cands = np.unique(np.concatenate([pos, neg, extra]))
    best_t, best_f1 = float(np.median(pos) - 0.05), -1.0
    best_stats = {}
    for t in cands:
        if t >= 0.995:
            continue
        tp = (pos >= t).sum()
        fn = (pos < t).sum()
        fp = (neg >= t).sum()
        tn = (neg < t).sum()
        prec = tp / max(tp + fp, 1)
        rec = tp / max(tp + fn, 1)
        f1 = 2 * prec * rec / max(prec + rec, 1e-9)
        acc = (tp + tn) / max(tp + tn + fp + fn, 1)
        if f1 > best_f1:
            best_f1 = f1
            best_t = float(t)
            best_stats = {
                "f1": float(f1),
                "accuracy": float(acc),
                "precision": float(prec),
                "recall": float(rec),
                "tp": int(tp),
                "fp": int(fp),
                "tn": int(tn),
                "fn": int(fn),
            }
    return best_t, best_stats


def train() -> Path:
    HENNEN_DIR.mkdir(parents=True, exist_ok=True)
    hennen_paths = list_images(HENNEN_DIR)
    if len(hennen_paths) < MIN_HENNEN_SHOTS:
        raise SystemExit(
            f"Need at least {MIN_HENNEN_SHOTS} photos of Hennen in {HENNEN_DIR} "
            f"(recommended ~{RECOMMENDED_SHOTS}). Found {len(hennen_paths)}."
        )

    other_paths = list_images(NOT_HENNEN_DIR)
    if len(other_paths) < 15:
        other_paths = fetch_negative_faces()

    print(f"Hennen shots: {len(hennen_paths)} · not Hennen: {len(other_paths)}")
    print("Backbone: Inception-ResNet FaceNet (VGGFace2) — already fully trained, frozen.")

    hennen = _stack_embeddings(hennen_paths, "Hennen")
    other = _stack_embeddings(other_paths, "not-Hennen")
    proto = F.normalize(hennen.mean(0), dim=0)

    pos = _loo_cosine_scores(hennen) if len(hennen) >= 2 else np.array([1.0])
    neg = torch.nn.functional.cosine_similarity(other, proto.unsqueeze(0), dim=1).numpy()
    threshold, cosine_stats = _pick_threshold(pos, neg)

    head, mean, std = _train_head(hennen, other)

    # Head accuracy on the (non-augmented) embeddings we actually have.
    with torch.inference_mode():
        x = torch.cat([hennen, other], dim=0)
        y = torch.cat(
            [torch.ones(len(hennen), dtype=torch.long), torch.zeros(len(other), dtype=torch.long)]
        )
        pred = head((x - mean) / std).argmax(1)
        head_acc = float((pred == y).float().mean())

    metrics = {
        "cosine": cosine_stats,
        "head_train_acc": head_acc,
        "mean_loo_cosine": float(pos.mean()) if len(pos) else None,
        "mean_neg_cosine": float(neg.mean()),
        "backbone": "InceptionResnetV1-VGGFace2",
        "embed_dim": 512,
        "tta": "horizontal_flip",
    }
    save_artifact(
        {
            "proto": proto,
            "hennen_embeddings": hennen,
            "threshold": threshold,
            "head": head.state_dict(),
            "scaler_mean": mean,
            "scaler_std": std,
            "metrics": metrics,
            "n_hennen": len(hennen),
            "n_other": len(other),
        }
    )
    print(f"\nSaved {ARTIFACT_PATH}")
    print(f"  gallery faces : {len(hennen)} Hennen · {len(other)} others")
    print(f"  cosine F1     : {cosine_stats.get('f1', 0):.3f}")
    print(f"  cosine acc    : {cosine_stats.get('accuracy', 0):.3f}")
    print(f"  head acc      : {head_acc:.3f}")
    print(f"  threshold     : {threshold:.3f}")
    print("Detect time will ONLY load this file — no retraining.")
    return ARTIFACT_PATH


if __name__ == "__main__":
    try:
        train()
    except KeyboardInterrupt:
        sys.exit(130)
