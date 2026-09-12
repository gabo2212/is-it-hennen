from __future__ import annotations

from pathlib import Path

import torch
from PIL import Image
from facenet_pytorch import InceptionResnetV1, MTCNN
from torchvision import transforms

from cnn.config import IMAGE_SIZE

_DEVICE = torch.device("cpu")
_mtcnn: MTCNN | None = None
_cnn: InceptionResnetV1 | None = None


def device() -> torch.device:
    return _DEVICE


def mtcnn() -> MTCNN:
    global _mtcnn
    if _mtcnn is None:
        _mtcnn = MTCNN(
            image_size=IMAGE_SIZE,
            margin=24,
            min_face_size=20,
            thresholds=[0.6, 0.7, 0.7],
            keep_all=False,
            post_process=True,
            device=_DEVICE,
        )
    return _mtcnn


def cnn() -> InceptionResnetV1:
    """Fully trained face CNN (Inception-ResNet, VGGFace2). Frozen at inference."""
    global _cnn
    if _cnn is None:
        _cnn = InceptionResnetV1(pretrained="vggface2", classify=False)
        _cnn.eval()
        _cnn.to(_DEVICE)
        for p in _cnn.parameters():
            p.requires_grad = False
    return _cnn


def load_rgb(path: Path | str) -> Image.Image:
    return Image.open(path).convert("RGB")


_FALLBACK = transforms.Compose(
    [
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5]),
    ]
)


def _as_face_tensor(img: Image.Image) -> torch.Tensor | None:
    """MTCNN crop. If that fails on a small already-cropped portrait, resize the frame."""
    face = mtcnn()(img)
    if face is not None:
        return face
    w, h = img.size
    if min(w, h) <= 220:
        return _FALLBACK(img)
    return None


@torch.inference_mode()
def embed_image(img: Image.Image, *, tta_flip: bool = True) -> torch.Tensor | None:
    """Return L2-normalized 512-d embedding, or None if no face is found."""
    net = cnn()
    face = _as_face_tensor(img.convert("RGB"))
    if face is None:
        return None
    face = face.to(_DEVICE)
    vec = net(face.unsqueeze(0))
    if tta_flip:
        flipped = torch.flip(face, dims=[2])
        vec = (vec + net(flipped.unsqueeze(0))) / 2
    return torch.nn.functional.normalize(vec, dim=1).squeeze(0).cpu()


def embed_path(path: Path | str, *, tta_flip: bool = True) -> torch.Tensor | None:
    return embed_image(load_rgb(path), tta_flip=tta_flip)
