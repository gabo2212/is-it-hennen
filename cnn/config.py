from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
HENNEN_DIR = DATA_DIR / "hennen"
NOT_HENNEN_DIR = DATA_DIR / "not_hennen"
MODELS_DIR = ROOT / "models"
ARTIFACT_PATH = MODELS_DIR / "hennen.pt"

IMAGE_SIZE = 160
EMBED_DIM = 512
MIN_HENNEN_SHOTS = 8
RECOMMENDED_SHOTS = 25
NEGATIVE_TARGET = 40
HEAD_EPOCHS = 80
HEAD_LR = 3e-3
NOISE_AUGMENTS = 7
TTA_FLIP = True
