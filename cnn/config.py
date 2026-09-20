import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
HENNEN_DIR = DATA_DIR / "hennen"
NOT_HENNEN_DIR = DATA_DIR / "not_hennen"
MODELS_DIR = ROOT / "models"
ARTIFACT_PATH = MODELS_DIR / "hennen.pt"
VIZ_PATH = MODELS_DIR / "viz.json"
FLYWIRE_DIR = DATA_DIR / "flywire"
FLY_PUBLIC = ROOT / "public" / "fly"
SOMAS_BIN = FLY_PUBLIC / "somas.bin"
SOMAS_META = FLY_PUBLIC / "somas.json"
FLY_MB_PATH = MODELS_DIR / "fly_mb.npz"
FLY_GAINS_PATH = MODELS_DIR / "fly_mb_gains.npz"
# Original Linux training laptop. Prefer this only when it actually exists.
_LINUX_HENNEN_DIR = Path("/home/gablegoob/Desktop/hennen")


def default_hennen_src() -> Path:
    """Folder of training photos when --hennen-dir is omitted.

    Linux clones used a hardcoded home path. On Windows that becomes
    C:\\home\\gablegoob\\... — so pick Desktop/Bureau under the current user.
    """
    # On Windows this Path becomes C:\home\gablegoob\... — never prefer that.
    if os.name != "nt" and _LINUX_HENNEN_DIR.exists():
        return _LINUX_HENNEN_DIR
    home = Path.home()
    candidates = [
        home / "Desktop" / "hennen",
        home / "OneDrive" / "Desktop" / "hennen",
        home / "OneDrive" / "Bureau" / "hennen",
        home / "Bureau" / "hennen",
    ]
    for path in candidates:
        if path.exists():
            return path
    return home / "Desktop" / "hennen"

IMAGE_SIZE = 160
EMBED_DIM = 512
MIN_HENNEN_SHOTS = 8
RECOMMENDED_SHOTS = 25
NEGATIVE_TARGET = 120
HEAD_EPOCHS = 80
HEAD_LR = 3e-3
NOISE_AUGMENTS = 7
TTA_FLIP = True
