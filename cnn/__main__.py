"""CLI: python -m cnn train | serve | predict | viz | benchmark"""

from __future__ import annotations

import sys
import time


def _split_flags(argv: list[str]) -> tuple[bool, list[str]]:
    viz = "--viz" in argv
    rest = [a for a in argv if a != "--viz"]
    return viz, rest


def main() -> None:
    viz, argv = _split_flags(sys.argv[1:])
    cmd = argv[0] if argv else "help"
    rest = argv[1:]

    if cmd in {"train", "enroll"}:
        from pathlib import Path

        hennen_dir = None
        if "--hennen-dir" in rest:
            i = rest.index("--hennen-dir")
            hennen_dir = Path(rest[i + 1])
            rest = rest[:i] + rest[i + 2 :]
        from cnn.train import train

        train(viz=viz, hennen_dir=hennen_dir)
    elif cmd == "serve":
        if viz:
            from cnn.visual import start_background_window

            print("Live network window on — predict calls will light it up.")
            start_background_window()
        import uvicorn

        uvicorn.run("cnn.serve:app", host="127.0.0.1", port=43124, log_level="info", reload=False)
    elif cmd == "predict":
        if not rest:
            raise SystemExit("usage: python -m cnn predict path/to/photo.jpg [--viz]")
        if viz:
            from cnn.visual import start_background_window

            window = start_background_window()
        from cnn.predict import HennenDetector

        result = HennenDetector().predict_path(rest[0])
        print(f"{result.label}  ({result.confidence:.0%} · cosine {result.cosine:.3f})")
        if result.fly:
            print(
                f"mouche {result.fly['label']}  "
                f"({result.fly['confidence']:.0%} · {len(result.fly['lit'])} somas allumés)"
            )
        if not result.face_found:
            print(result.detail)
        if viz:
            print("Close the network window to exit.")
            while window.running:
                time.sleep(0.05)
    elif cmd == "fly_build":
        from cnn.fly_build import build

        build()
    elif cmd == "fly_train":
        from cnn.fly_train import train_fly

        train_fly()
    elif cmd == "selftest":
        from cnn.selftest import run as selftest

        selftest()
    elif cmd == "benchmark":
        from cnn.benchmark import run

        run()
    elif cmd == "viz":
        if "--smoke" in sys.argv:
            from cnn.visual import smoke

            smoke()
        else:
            from cnn.visual import run as run_viz

            run_viz()
    else:
        print("python -m cnn viz                 # 60 FPS live network window")
        print("python -m cnn train [--viz] [--hennen-dir PATH]")
        print("python -m cnn fly_build            # FlyWire soma cloud + mushroom body")
        print("python -m cnn fly_train            # sugar/choc gains (after train + fly_build)")
        print("python -m cnn selftest            # train+predict dry run on public faces")
        print("python -m cnn serve [--viz]       # inference API on :43124")
        print("python -m cnn predict img.jpg [--viz]")
        print("python -m cnn benchmark           # LFW few-shot check")


if __name__ == "__main__":
    main()
