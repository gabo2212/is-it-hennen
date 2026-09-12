"""CLI: python -m cnn train | serve | predict <image> | benchmark"""

from __future__ import annotations

import sys


def main() -> None:
    cmd = sys.argv[1] if len(sys.argv) > 1 else "help"
    if cmd in {"train", "enroll"}:
        from cnn.train import train

        train()
    elif cmd == "serve":
        import uvicorn

        uvicorn.run("cnn.serve:app", host="127.0.0.1", port=43124, log_level="info")
    elif cmd == "predict":
        if len(sys.argv) < 3:
            raise SystemExit("usage: python -m cnn predict path/to/photo.jpg")
        from cnn.predict import HennenDetector

        result = HennenDetector().predict_path(sys.argv[2])
        print(f"{result.label}  ({result.confidence:.0%} · cosine {result.cosine:.3f})")
        if not result.face_found:
            print(result.detail)
    elif cmd == "benchmark":
        from cnn.benchmark import run

        run()
    else:
        print("python -m cnn train       # once, after dropping Hennen photos in data/hennen")
        print("python -m cnn serve       # inference API on :43124")
        print("python -m cnn predict img.jpg")
        print("python -m cnn benchmark   # LFW few-shot check")


if __name__ == "__main__":
    main()
