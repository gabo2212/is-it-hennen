"""End-to-end check: train on a public identity, then predict held-out photos.

Used when Desktop Hennen pics are missing so we can still debug the CNN stack.
If Hennen photos exist, this is skipped in favor of `python -m cnn train`.
"""

from __future__ import annotations

import json
import shutil
import tempfile
from collections import defaultdict
from pathlib import Path

import numpy as np
from PIL import Image
from sklearn.datasets import fetch_lfw_people

from cnn.config import MODELS_DIR
from cnn.faces import embed_path
from cnn.predict import HennenDetector, HennenHead, save_artifact
from cnn.train import _pick_threshold, _stack_embeddings, _train_head
import torch
import torch.nn.functional as F


def run() -> dict:
    print("Self-test: train a throwaway person-ID model and predict held-out faces.")
    bundle = fetch_lfw_people(
        min_faces_per_person=35,
        resize=1.0,
        color=True,
        download_if_missing=True,
    )
    by: dict[int, list[int]] = defaultdict(list)
    for i, lab in enumerate(bundle.target):
        by[int(lab)].append(i)
    pid = max(by, key=lambda k: len(by[k]))
    name = str(bundle.target_names[pid])
    idxs = by[pid]
    rng = np.random.default_rng(0)
    rng.shuffle(idxs)
    train_idx, test_idx = idxs[:20], idxs[20:32]
    other = [i for i, lab in enumerate(bundle.target) if lab != pid]
    rng.shuffle(other)

    tmp = Path(tempfile.mkdtemp(prefix="hennen-selftest-"))
    pos_dir = tmp / "pos"
    neg_dir = tmp / "neg"
    pos_dir.mkdir()
    neg_dir.mkdir()

    def dump(indices, dest: Path, prefix: str) -> list[Path]:
        paths = []
        for i in indices:
            pix = np.clip(bundle.images[i] * 255.0, 0, 255).astype(np.uint8)
            p = dest / f"{prefix}_{i}.jpg"
            Image.fromarray(pix).save(p, quality=92)
            paths.append(p)
        return paths

    train_pos = dump(train_idx, pos_dir, "pos")
    test_pos = dump(test_idx, pos_dir, "pos_test")
    train_neg = dump(other[:60], neg_dir, "neg")
    test_neg = dump(other[60:85], neg_dir, "neg_test")

    hennen = _stack_embeddings(train_pos, "selftest-pos")
    other_t = _stack_embeddings(train_neg, "selftest-neg")
    proto = F.normalize(hennen.mean(0), dim=0)
    pos = torch.nn.functional.cosine_similarity(hennen, proto.unsqueeze(0), dim=1).numpy()
    neg = torch.nn.functional.cosine_similarity(other_t, proto.unsqueeze(0), dim=1).numpy()
    threshold, stats = _pick_threshold(pos, neg)
    head, mean, std = _train_head(hennen, other_t, viz=False)
    artifact = MODELS_DIR / "selftest.pt"
    save_artifact(
        {
            "proto": proto,
            "hennen_embeddings": hennen,
            "threshold": threshold,
            "head": head.state_dict(),
            "scaler_mean": mean,
            "scaler_std": std,
            "metrics": {"cosine": stats, "identity": name},
            "n_hennen": len(hennen),
            "n_other": len(other_t),
        },
        path=artifact,
    )
    det = HennenDetector(artifact)
    tp = sum(int(det.predict_path(p).is_hennen) for p in test_pos)
    tn = sum(int(not det.predict_path(p).is_hennen) for p in test_neg)
    recall = tp / max(len(test_pos), 1)
    tnr = tn / max(len(test_neg), 1)
    report = {
        "identity": name,
        "train_pos": len(train_pos),
        "test_pos": f"{tp}/{len(test_pos)}",
        "test_neg": f"{tn}/{len(test_neg)}",
        "recall": recall,
        "true_negative_rate": tnr,
        "ok": recall >= 0.7 and tnr >= 0.7,
    }
    print(json.dumps(report, indent=2))
    shutil.rmtree(tmp, ignore_errors=True)
    if not report["ok"]:
        raise SystemExit(f"Self-test failed: {report}")
    print("Self-test passed.")
    return report


if __name__ == "__main__":
    run()
