from __future__ import annotations

import shutil
from pathlib import Path

import numpy as np
from PIL import Image

from cnn.config import NEGATIVE_TARGET, NOT_HENNEN_DIR
from cnn.images import IMAGE_EXTS, list_images

KAGGLE_DATASETS = (
    "ashwingupta3012/human-faces",
    "kaustubhdhote/human-faces-dataset",
    "ashwingupta3012/male-and-female-faces-dataset",
)


def fetch_negative_faces(n: int = NEGATIVE_TARGET, seed: int = 7) -> list[Path]:
    """Fill data/not_hennen with random people. Prefers Kaggle, falls back to LFW."""
    NOT_HENNEN_DIR.mkdir(parents=True, exist_ok=True)
    existing = list_images(NOT_HENNEN_DIR)
    if len(existing) >= n:
        return existing[:n]
    try:
        got = fetch_kaggle_faces(n=n, seed=seed)
        if len(got) >= min(n, 30):
            return got
    except Exception as exc:
        print(f"Kaggle faces download skipped ({exc}). Falling back to LFW.")
    return fetch_lfw_faces(n=n, seed=seed)


def fetch_kaggle_faces(n: int = 100, seed: int = 7) -> list[Path]:
    """Download a Kaggle human-faces dataset and copy a random subset here."""
    import kagglehub

    last_err: Exception | None = None
    src_root: Path | None = None
    used = ""
    for slug in KAGGLE_DATASETS:
        try:
            print(f"Downloading Kaggle dataset {slug} …")
            raw = kagglehub.dataset_download(slug)
            src_root = Path(raw)
            used = slug
            break
        except Exception as exc:
            last_err = exc
            print(f"  {slug} failed: {exc}")
    if src_root is None:
        raise RuntimeError(f"Could not download a Kaggle faces dataset: {last_err}")

    candidates = [
        p
        for p in src_root.rglob("*")
        if p.is_file() and p.suffix.lower() in IMAGE_EXTS
    ]
    if not candidates:
        raise RuntimeError(f"No images inside Kaggle download {src_root}")

    rng = np.random.default_rng(seed)
    rng.shuffle(candidates)
    NOT_HENNEN_DIR.mkdir(parents=True, exist_ok=True)
    saved: list[Path] = list_images(NOT_HENNEN_DIR)
    for src in candidates:
        if len(saved) >= n:
            break
        dest = NOT_HENNEN_DIR / f"kaggle_{src.stem[:40]}_{len(saved):04d}{src.suffix.lower()}"
        if dest.exists():
            saved.append(dest)
            continue
        try:
            shutil.copy2(src, dest)
            saved.append(dest)
        except OSError:
            continue
    print(f"Copied {len(saved)} random-people faces from Kaggle ({used}) → {NOT_HENNEN_DIR}")
    return saved


def fetch_lfw_faces(n: int = 100, seed: int = 7) -> list[Path]:
    from sklearn.datasets import fetch_lfw_people

    print("Downloading LFW faces for the NOT HENNEN class…")
    bundle = fetch_lfw_people(
        min_faces_per_person=5,
        resize=1.0,
        color=True,
        download_if_missing=True,
    )
    rng = np.random.default_rng(seed)
    order = rng.permutation(len(bundle.images))
    saved = list_images(NOT_HENNEN_DIR)
    NOT_HENNEN_DIR.mkdir(parents=True, exist_ok=True)
    for idx in order:
        if len(saved) >= n:
            break
        pix = np.clip(bundle.images[idx] * 255.0, 0, 255).astype(np.uint8)
        name = bundle.target_names[bundle.target[idx]].replace(" ", "_")
        path = NOT_HENNEN_DIR / f"lfw_{name}_{idx}.jpg"
        if not path.exists():
            Image.fromarray(pix).save(path, quality=92)
        saved.append(path)
    print(f"Saved {len(saved)} negative faces → {NOT_HENNEN_DIR}")
    return saved
