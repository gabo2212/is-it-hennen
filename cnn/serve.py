"""Inference-only API. Loads models/hennen.pt — does not train."""

from __future__ import annotations

import io

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError

from cnn.config import ARTIFACT_PATH
from cnn.predict import HennenDetector

app = FastAPI(title="Is it hennen?", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_detector: HennenDetector | None = None


def get_detector() -> HennenDetector:
    global _detector
    if _detector is None:
        if not ARTIFACT_PATH.exists():
            raise HTTPException(
                status_code=503,
                detail="Model not trained yet. Put Hennen photos in data/hennen and run python -m cnn.train once.",
            )
        _detector = HennenDetector()
    return _detector


@app.get("/health")
def health() -> dict:
    ready = ARTIFACT_PATH.exists()
    info: dict = {"ready": ready, "artifact": str(ARTIFACT_PATH)}
    if ready:
        det = get_detector()
        info.update(
            {
                "n_hennen": det.n_hennen,
                "n_other": det.n_other,
                "metrics": det.metrics,
            }
        )
    return info


@app.post("/predict")
async def predict(file: UploadFile = File(...)) -> dict:
    raw = await file.read()
    try:
        img = Image.open(io.BytesIO(raw)).convert("RGB")
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="Not a readable image.") from exc
    result = get_detector().predict_image(img)
    return {
        "is_hennen": result.is_hennen,
        "label": result.label,
        "confidence": round(result.confidence, 4),
        "cosine": round(result.cosine, 4),
        "face_found": result.face_found,
        "detail": result.detail,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("cnn.serve:app", host="127.0.0.1", port=43124, log_level="info")
