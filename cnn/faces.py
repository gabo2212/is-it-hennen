from __future__ import annotations

import base64
import io
from pathlib import Path

import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
from facenet_pytorch import InceptionResnetV1, MTCNN
from torchvision import transforms

from cnn.config import IMAGE_SIZE
from cnn.images import open_rgb

_DEVICE = torch.device("cpu")
_mtcnn: MTCNN | None = None
_cnn: InceptionResnetV1 | None = None
_conv_hook = None
_raw_maps: torch.Tensor | None = None
_LAST_VIZ: dict = {"face": None, "maps": None}
_on_stage = None
_allow_conv_stage = False


def set_embed_stage_cb(cb) -> None:
    """Called during embed (crop / conv / embedding) so the browser can paint live."""
    global _on_stage
    _on_stage = cb


def _emit_stage(stage: str, **payload) -> None:
    cb = _on_stage
    if cb is None:
        return
    try:
        cb(stage, **payload)
    except Exception:
        pass


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
        _attach_first_conv(_cnn)
    return _cnn


def _attach_first_conv(net: InceptionResnetV1) -> None:
    global _conv_hook
    if _conv_hook is not None:
        return

    def hook(_m, _i, out):
        global _raw_maps
        _raw_maps = out.detach()
        face_url = _LAST_VIZ.get("face")
        if face_url and _allow_conv_stage:
            _emit_stage(
                "conv",
                face=face_url,
                maps=_pack_maps(out),
                emb=None,
            )

    for name, mod in net.named_modules():
        if name == "conv2d_1a.conv" and isinstance(mod, nn.Conv2d):
            _conv_hook = mod.register_forward_hook(hook)
            return
    for _name, mod in net.named_modules():
        if isinstance(mod, nn.Conv2d):
            _conv_hook = mod.register_forward_hook(hook)
            return


def load_rgb(path: Path | str) -> Image.Image:
    return open_rgb(path)


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


def _face_data_url(face: torch.Tensor) -> str:
    arr = ((face.detach().cpu().permute(1, 2, 0).numpy() * 0.5 + 0.5).clip(0, 1) * 255).astype(
        "uint8"
    )
    im = Image.fromarray(arr).resize((80, 80), Image.BILINEAR)
    buf = io.BytesIO()
    im.save(buf, format="JPEG", quality=62)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def _pack_maps(raw: torch.Tensor | None, channels: int = 16, size: int = 14) -> dict | None:
    if raw is None:
        return None
    x = raw.detach()
    if x.ndim == 4:
        x = x[0]
    x = x[:channels].float()
    x = F.adaptive_avg_pool2d(x, size)
    packed: list[int] = []
    for i in range(x.shape[0]):
        m = x[i]
        m = m - m.min()
        peak = float(m.max())
        if peak > 1e-6:
            m = m / peak
        packed.extend((m * 255).clamp(0, 255).to(torch.uint8).reshape(-1).tolist())
    return {"c": int(x.shape[0]), "s": size, "px": packed}


def consume_facenet_viz() -> dict:
    return {"face": _LAST_VIZ.get("face"), "maps": _LAST_VIZ.get("maps")}


@torch.inference_mode()
def embed_image(img: Image.Image, *, tta_flip: bool = True) -> torch.Tensor | None:
    """Return L2-normalized 512-d embedding, or None if no face is found."""
    global _LAST_VIZ, _allow_conv_stage
    net = cnn()
    _allow_conv_stage = True
    _emit_stage("scan", face=None, maps=None, emb=None)
    face = _as_face_tensor(img.convert("RGB"))
    if face is None:
        _LAST_VIZ = {"face": None, "maps": None}
        return None
    face = face.to(_DEVICE)
    face_url = _face_data_url(face)
    _LAST_VIZ = {"face": face_url, "maps": None}
    _emit_stage("crop", face=face_url, maps=None, emb=None)
    vec = net(face.unsqueeze(0))
    _allow_conv_stage = False
    maps = _pack_maps(_raw_maps)
    _LAST_VIZ = {"face": face_url, "maps": maps}
    emb = torch.nn.functional.normalize(vec, dim=1).squeeze(0).cpu()
    _emit_stage("embed", face=face_url, maps=maps, emb=emb)
    if tta_flip:
        flipped = torch.flip(face, dims=[2])
        vec = (vec + net(flipped.unsqueeze(0))) / 2
        emb = torch.nn.functional.normalize(vec, dim=1).squeeze(0).cpu()
        _emit_stage("embed", face=face_url, maps=maps, emb=emb)
    return emb


def embed_path(path: Path | str, *, tta_flip: bool = True) -> torch.Tensor | None:
    return embed_image(load_rgb(path), tta_flip=tta_flip)
