from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image
from sklearn.datasets import fetch_lfw_people

from cnn.config import NEGATIVE_TARGET, NOT_HENNEN_DIR


def fetch_negative_faces(n: int = NEGATIVE_TARGET, seed: int = 7) -> list[Path]:
    """Download public LFW faces as the NOT HENNEN class (one-time)."""
    NOT_HENNEN_DIR.mkdir(parents=True, exist_ok=True)
    existing = sorted(
        p
        for p in NOT_HENNEN_DIR.iterdir()
        if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
    )
    if len(existing) >= n:
        return existing[:n]

    print("Downloading LFW faces for the NOT HENNEN class (one-time)…")
    bundle = fetch_lfw_people(
        min_faces_per_person=5,
        resize=1.0,
        color=True,
        download_if_missing=True,
    )
    rng = np.random.default_rng(seed)
    order = rng.permutation(len(bundle.images))
    saved: list[Path] = list(existing)
    for idx in order:
        if len(saved) >= n:
            break
        arr = bundle.images[idx]
        # LFW sklearn images are float in 0–1.
        pix = np.clip(arr * 255.0, 0, 255).astype(np.uint8)
        name = bundle.target_names[bundle.target[idx]].replace(" ", "_")
        path = NOT_HENNEN_DIR / f"lfw_{name}_{idx}.jpg"
        if path.exists():
            saved.append(path)
            continue
        Image.fromarray(pix).save(path, quality=92)
        saved.append(path)
    print(f"Saved {len(saved)} negative faces → {NOT_HENNEN_DIR}")
    return saved
