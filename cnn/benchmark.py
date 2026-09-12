"""Validate the few-shot CNN on a public identity (LFW), ~25 shots — same recipe as Hennen."""

from __future__ import annotations

import json
from collections import defaultdict

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from sklearn.datasets import fetch_lfw_people

from cnn.config import MODELS_DIR, RECOMMENDED_SHOTS
from cnn.faces import embed_image
from cnn.train import _pick_threshold, _train_head


def run(shots: int = RECOMMENDED_SHOTS, seed: int = 0) -> dict:
    print("Loading LFW (one-time download)…")
    bundle = fetch_lfw_people(
        min_faces_per_person=max(shots + 8, 30),
        resize=1.0,
        color=True,
        download_if_missing=True,
    )
    by_person: dict[int, list[int]] = defaultdict(list)
    for i, lab in enumerate(bundle.target):
        by_person[int(lab)].append(i)
    person_id = max(by_person, key=lambda k: len(by_person[k]))
    name = bundle.target_names[person_id]
    idxs = by_person[person_id]
    rng = np.random.default_rng(seed)
    rng.shuffle(idxs)
    train_idx, test_idx = idxs[:shots], idxs[shots: shots + 40]
    if len(test_idx) < 5:
        raise RuntimeError("Not enough held-out photos for this identity.")

    def to_pil(i: int) -> Image.Image:
        pix = np.clip(bundle.images[i] * 255.0, 0, 255).astype(np.uint8)
        return Image.fromarray(pix)

    def embed_many(indices: list[int], tag: str) -> torch.Tensor:
        vecs = []
        for i in indices:
            vec = embed_image(to_pil(i), tta_flip=True)
            if vec is not None:
                vecs.append(vec)
        print(f"  {tag}: {len(vecs)}/{len(indices)} faces")
        if len(vecs) < 3:
            raise RuntimeError(f"Too few faces for {tag}")
        return torch.stack(vecs)

    pos_train = embed_many(list(train_idx), f"{name} train")
    pos_test = embed_many(list(test_idx), f"{name} test")

    other_idx = [i for i, lab in enumerate(bundle.target) if lab != person_id]
    rng.shuffle(other_idx)
    neg_train = embed_many(other_idx[:40], "neg train")
    neg_test = embed_many(other_idx[40:80], "neg test")

    proto = F.normalize(pos_train.mean(0), dim=0)
    pos_scores = F.cosine_similarity(pos_test, proto.unsqueeze(0), dim=1).numpy()
    neg_scores = F.cosine_similarity(neg_test, proto.unsqueeze(0), dim=1).numpy()
    loo = []
    for i in range(len(pos_train)):
        p = F.normalize((pos_train.sum(0) - pos_train[i]) / (len(pos_train) - 1), dim=0)
        loo.append(float(F.cosine_similarity(pos_train[i], p, dim=0)))
    neg_train_scores = F.cosine_similarity(neg_train, proto.unsqueeze(0), dim=1).numpy()
    threshold, _ = _pick_threshold(np.array(loo), neg_train_scores)

    tp = int((pos_scores >= threshold).sum())
    fn = int((pos_scores < threshold).sum())
    fp = int((neg_scores >= threshold).sum())
    tn = int((neg_scores < threshold).sum())
    acc = (tp + tn) / max(tp + tn + fp + fn, 1)

    head, mean, std = _train_head(pos_train, neg_train)
    with torch.inference_mode():
        xt = torch.cat([pos_test, neg_test])
        yt = torch.cat(
            [
                torch.ones(len(pos_test), dtype=torch.long),
                torch.zeros(len(neg_test), dtype=torch.long),
            ]
        )
        pred = head((xt - mean) / std).argmax(1)
        head_acc = float((pred == yt).float().mean())

    report = {
        "identity": str(name),
        "shots": shots,
        "test_pos": len(pos_test),
        "test_neg": len(neg_test),
        "cosine_threshold": float(threshold),
        "cosine_accuracy": float(acc),
        "head_accuracy": head_acc,
        "backbone": "InceptionResnetV1-VGGFace2",
    }
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    out = MODELS_DIR / "benchmark.json"
    out.write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))
    return report


if __name__ == "__main__":
    run()
