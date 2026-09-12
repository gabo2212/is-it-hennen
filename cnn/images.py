from __future__ import annotations

from pathlib import Path

from PIL import Image

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".heic", ".heif"}

_HEIF_READY = False


def register_openers() -> None:
    global _HEIF_READY
    if _HEIF_READY:
        return
    try:
        from pillow_heif import register_heif_opener

        register_heif_opener()
    except Exception:
        pass
    _HEIF_READY = True


def open_rgb(path: Path | str) -> Image.Image:
    register_openers()
    img = Image.open(path)
    return img.convert("RGB")


def list_images(folder: Path, *, recursive: bool = True) -> list[Path]:
    if not folder.exists():
        return []
    iterator = folder.rglob("*") if recursive else folder.iterdir()
    return sorted(
        p
        for p in iterator
        if p.is_file() and p.suffix.lower() in IMAGE_EXTS and not p.name.startswith(".")
    )
