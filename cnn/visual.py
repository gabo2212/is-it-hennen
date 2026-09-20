"""Live 60 FPS neural-net visualizer (Pygame).

Neurons = circles (size / brightness = activation).
Weights = lines (thickness = |w|, blue = +, coral = −).
Call push() after loss.backward() + optimizer.step() with .detach().numpy().
"""

from __future__ import annotations

import json
import os
import threading
import time
from dataclasses import dataclass

import numpy as np
import torch
import torch.nn.functional as F

from cnn.config import EMBED_DIM, HEAD_EPOCHS, HEAD_LR, NOISE_AUGMENTS, VIZ_PATH
from cnn.predict import HennenHead

BG = (7, 7, 8)
INK = (244, 247, 251)
MUTED = (110, 130, 158)
LIME = (173, 250, 30)
CORAL = (237, 64, 179)
BLUE = (110, 247, 204)
PANEL = (18, 20, 24)

TOP_K = 5  # strongest weights drawn per neuron (keeps 60 FPS)


@dataclass
class Snapshot:
    input_act: np.ndarray
    hidden_act: np.ndarray
    output_act: np.ndarray
    w1: np.ndarray
    w2: np.ndarray
    conv_maps: np.ndarray | None = None
    maps: dict | None = None
    face: str | None = None
    loss: float | None = None
    epoch: int | None = None
    epochs: int | None = None
    phase: str = "forward"
    title: str = "C'est Hennen ?"
    subtitle: str = ""


def snapshot_from_head(
    head: HennenHead,
    x: torch.Tensor,
    *,
    loss: float | None = None,
    epoch: int | None = None,
    epochs: int | None = None,
    phase: str = "forward",
    title: str = "C'est Hennen ?",
    subtitle: str = "",
    conv_maps: np.ndarray | None = None,
    maps: dict | None = None,
    face: str | None = None,
) -> Snapshot:
    """Run a forward pass, then pack activations + weights as numpy (no grad)."""
    was_training = head.training
    head.eval()
    with torch.inference_mode():
        logits = head(x if x.dim() == 2 else x.unsqueeze(0))
    hidden = head.last_hidden
    inp = head.last_input
    if hidden.dim() == 2:
        hidden = hidden[0]
    if inp.dim() == 2:
        inp = inp[0]
    probs = torch.softmax(logits, dim=1)[0]
    if was_training:
        head.train()
    w1 = head.net[0].weight.detach().cpu().numpy()
    w2 = head.net[3].weight.detach().cpu().numpy()
    return Snapshot(
        input_act=inp.detach().cpu().numpy().reshape(-1)[:EMBED_DIM],
        hidden_act=hidden.detach().cpu().numpy().reshape(-1)[:64],
        output_act=probs.detach().cpu().numpy().reshape(-1)[:2],
        w1=w1,
        w2=w2,
        conv_maps=conv_maps,
        maps=maps,
        face=face,
        loss=loss,
        epoch=epoch,
        epochs=epochs,
        phase=phase,
        title=title,
        subtitle=subtitle,
    )


def snapshot_to_payload(snap: Snapshot) -> dict:
    """Compact JSON for the browser canvas (top-k weights, not the full tensors)."""
    w1 = np.asarray(snap.w1, dtype=np.float32)
    w2 = np.asarray(snap.w2, dtype=np.float32)

    def topk(mat: np.ndarray, k: int | None) -> list[dict]:
        if mat.size == 0:
            return []
        edges: list[dict] = []
        for j in range(mat.shape[0]):
            row = mat[j]
            if k is None:
                idxs = range(row.size)
            else:
                kk = min(k, row.size)
                idxs = np.argpartition(np.abs(row), -kk)[-kk:]
            for i in idxs:
                edges.append({"s": int(i), "d": int(j), "w": float(row[int(i)])})
        return edges

    return {
        "seq": 0,
        "input": np.asarray(snap.input_act, dtype=np.float32).reshape(-1)[:EMBED_DIM].tolist(),
        "hidden": np.asarray(snap.hidden_act, dtype=np.float32).reshape(-1)[:64].tolist(),
        "output": np.asarray(snap.output_act, dtype=np.float32).reshape(-1)[:2].tolist(),
        "e1": topk(w1, TOP_K),
        "e2": topk(w2, None),
        "loss": snap.loss,
        "epoch": snap.epoch,
        "epochs": snap.epochs,
        "phase": snap.phase,
        "title": snap.title,
        "subtitle": snap.subtitle,
        "maps": snap.maps,
        "face": snap.face,
    }


_persist_lock = threading.Lock()


def persist_snapshot(snap: Snapshot) -> None:
    payload = snapshot_to_payload(snap)
    VIZ_PATH.parent.mkdir(parents=True, exist_ok=True)
    tmp = VIZ_PATH.with_suffix(".json.tmp")
    try:
        with _persist_lock:
            payload["seq"] = int(time.time() * 1000)
            tmp.write_text(json.dumps(payload, separators=(",", ":")))
            tmp.replace(VIZ_PATH)
    except OSError:
        return


def read_payload() -> dict:
    if VIZ_PATH.exists():
        try:
            return json.loads(VIZ_PATH.read_text())
        except json.JSONDecodeError:
            pass
    return {
        "seq": 0,
        "input": [0.0] * EMBED_DIM,
        "hidden": [0.0] * 64,
        "output": [0.5, 0.5],
        "e1": [],
        "e2": [],
        "loss": None,
        "epoch": None,
        "epochs": None,
        "phase": "idle",
        "title": "C'est Hennen ?",
        "subtitle": "en attente d'une passe avant",
        "maps": None,
        "face": None,
    }


class NetworkViz:
    """Pygame window. Safe to push() from a training thread."""

    def __init__(self, width: int = 1440, height: int = 820) -> None:
        self.width = width
        self.height = height
        self._lock = threading.Lock()
        self._target = Snapshot(
            input_act=np.zeros(EMBED_DIM),
            hidden_act=np.zeros(64),
            output_act=np.array([0.5, 0.5]),
            w1=np.zeros((64, EMBED_DIM)),
            w2=np.zeros((2, 64)),
        )
        self._shown = Snapshot(
            input_act=np.zeros(EMBED_DIM),
            hidden_act=np.zeros(64),
            output_act=np.array([0.5, 0.5]),
            w1=np.zeros((64, EMBED_DIM)),
            w2=np.zeros((2, 64)),
        )
        self.running = False
        self.paused = False
        self._fps = 0.0

    def push(self, snap: Snapshot, *, persist: bool = True) -> None:
        with self._lock:
            self._target = snap
        if persist:
            persist_snapshot(snap)

    def _lerp(self) -> Snapshot:
        with self._lock:
            t = self._target
        s = self._shown
        a = 0.22

        def mix(cur: np.ndarray, nxt: np.ndarray) -> np.ndarray:
            nxt = np.asarray(nxt, dtype=np.float64)
            cur = np.asarray(cur, dtype=np.float64)
            n = min(cur.size, nxt.size)
            out = cur.copy()
            out.reshape(-1)[:n] += a * (nxt.reshape(-1)[:n] - cur.reshape(-1)[:n])
            return out

        self._shown = Snapshot(
            input_act=mix(s.input_act, t.input_act),
            hidden_act=mix(s.hidden_act, t.hidden_act),
            output_act=mix(s.output_act, t.output_act),
            w1=mix(s.w1, t.w1),
            w2=mix(s.w2, t.w2),
            conv_maps=t.conv_maps,
            maps=t.maps,
            face=t.face,
            loss=t.loss,
            epoch=t.epoch,
            epochs=t.epochs,
            phase=t.phase,
            title=t.title,
            subtitle=t.subtitle,
        )
        return self._shown

    def loop(self, on_tick=None, max_frames: int | None = None) -> None:
        import pygame

        os.environ.setdefault("SDL_AUDIODRIVER", "dummy")
        pygame.init()
        pygame.display.set_caption("C'est Hennen ? · CNN en direct")
        screen = pygame.display.set_mode((self.width, self.height))
        clock = pygame.time.Clock()
        font = pygame.font.SysFont("figtree,dejavusans,sans", 18)
        font_sm = pygame.font.SysFont("figtree,dejavusans,sans", 14)
        font_big = pygame.font.SysFont("figtree,dejavusans,sans", 28, bold=True)
        self.running = True
        frame = 0
        while self.running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    self.running = False
                elif event.type == pygame.KEYDOWN:
                    if event.key in (pygame.K_ESCAPE, pygame.K_q):
                        self.running = False
                    elif event.key == pygame.K_SPACE:
                        self.paused = not self.paused
            if on_tick and not self.paused:
                on_tick()
            snap = self._lerp()
            self._draw(screen, snap, font, font_sm, font_big)
            pygame.display.flip()
            self._fps = clock.get_fps()
            clock.tick(60)
            frame += 1
            if max_frames is not None and frame >= max_frames:
                self.running = False
        pygame.quit()

    def _draw(self, screen, snap: Snapshot, font, font_sm, font_big) -> None:
        import pygame

        screen.fill(BG)
        # header
        screen.blit(font_big.render(snap.title, True, LIME), (28, 18))
        screen.blit(font.render(snap.subtitle or snap.phase, True, MUTED), (28, 54))
        hud = f"{self._fps:4.0f} FPS"
        if snap.epoch is not None:
            hud += f"   epoch {snap.epoch}/{snap.epochs or '?'}"
        if snap.loss is not None:
            hud += f"   loss {snap.loss:.4f}"
        hud += "   space pause · esc quit"
        screen.blit(font_sm.render(hud, True, MUTED), (28, 78))

        maps_x = 24
        grid_x = 310 if snap.conv_maps is not None else 40
        hidden_x = 760
        out_x = 1280
        top = 130
        bottom = self.height - 40

        if snap.conv_maps is not None:
            self._draw_maps(screen, snap.conv_maps, maps_x, top, font_sm)

        in_pts = self._draw_input_grid(
            screen, snap.input_act, grid_x, top, 220, bottom - top, font_sm
        )
        hid_pts = self._draw_hidden(screen, snap.hidden_act, hidden_x, top, bottom, font_sm)
        out_pts = self._draw_outputs(screen, snap.output_act, out_x, top, bottom, font_big)

        self._draw_weights(screen, in_pts, hid_pts, snap.w1, top_k=TOP_K)
        self._draw_weights(screen, hid_pts, out_pts, snap.w2, top_k=None)

        screen.blit(font_sm.render("mint +weight    magenta −weight    glow = activation", True, MUTED), (28, self.height - 28))

    def _draw_maps(self, screen, maps: np.ndarray, x: int, y: int, font_sm) -> None:
        import pygame

        screen.blit(font_sm.render("CNN conv · live", True, LIME), (x, y - 22))
        maps = np.asarray(maps)
        if maps.ndim == 4:
            maps = maps[0]
        n = min(16, maps.shape[0])
        cell = 58
        for i in range(n):
            tile = maps[i]
            tile = tile - tile.min()
            rng = tile.max() or 1.0
            tile = (tile / rng * 255).astype(np.uint8)
            surf = pygame.surfarray.make_surface(np.stack([tile.T] * 3, axis=-1))
            surf = pygame.transform.scale(surf, (cell - 4, cell - 4))
            gx, gy = x + (i % 4) * cell, y + (i // 4) * cell
            screen.blit(surf, (gx, gy))

    def _draw_input_grid(self, screen, act, x, y, w, h, font_sm):
        import pygame

        screen.blit(font_sm.render("FaceNet 512-d", True, LIME), (x, y - 22))
        cols, rows = 16, 32
        gw, gh = w / cols, (h - 8) / rows
        pts = []
        a = np.zeros(cols * rows)
        n = min(act.size, a.size)
        a[:n] = act.reshape(-1)[:n]
        a = np.tanh(a)
        for i in range(rows * cols):
            r, c = divmod(i, cols)
            px = x + c * gw + gw / 2
            py = y + r * gh + gh / 2
            v = abs(float(a[i]))
            shade = int(18 + 200 * v)
            col = (min(255, shade // 3), min(255, int(shade * 0.9)), min(255, shade // 4)) if a[i] >= 0 else (min(255, shade), min(255, shade // 3), min(255, shade // 4))
            pygame.draw.rect(screen, col, (px - gw / 2 + 1, py - gh / 2 + 1, max(1, gw - 2), max(1, gh - 2)))
            pts.append((px, py))
        pygame.draw.rect(screen, (40, 55, 80), (x, y, w, h - 8), 1)
        return pts

    def _draw_hidden(self, screen, act, x, y, bottom, font_sm):
        import pygame

        screen.blit(font_sm.render("hidden 64 · ReLU", True, LIME), (x - 40, y - 22))
        pts = []
        vals = np.zeros(64)
        vals[: min(64, act.size)] = np.maximum(act.reshape(-1)[:64], 0)
        mx = max(float(vals.max()), 1e-6)
        n = 64
        gap = (bottom - y) / n
        for i in range(n):
            py = y + gap * i + gap / 2
            v = float(vals[i]) / mx
            rad = int(3 + 7 * v)
            col = (
                int(LIME[0] * v + 30 * (1 - v)),
                int(LIME[1] * v + 40 * (1 - v)),
                int(LIME[2] * v + 50 * (1 - v)),
            )
            pygame.draw.circle(screen, col, (x, int(py)), rad)
            pygame.draw.circle(screen, (60, 80, 110), (x, int(py)), rad, 1)
            pts.append((x, py))
        return pts

    def _draw_outputs(self, screen, act, x, y, bottom, font_big):
        import pygame

        labels = ["NON", "HENNEN"]
        colors = [CORAL, LIME]
        pts = []
        probs = np.zeros(2)
        probs[: min(2, act.size)] = act.reshape(-1)[:2]
        # model is [not, hennen] = index 0, 1
        order = [(0, 180), (1, 420)]
        for cls, py in order:
            v = float(probs[cls])
            rad = int(18 + 28 * v)
            base = colors[cls]
            col = tuple(int(c * (0.25 + 0.75 * v)) for c in base)
            pygame.draw.circle(screen, col, (x, py), rad)
            pygame.draw.circle(screen, base, (x, py), rad, 2)
            screen.blit(font_big.render(f"{labels[cls]}  {v:.0%}", True, base), (x + rad + 16, py - 16))
            pts.append((x, float(py)))
        # pts must align with weight rows: index 0 = NOT, 1 = HENNEN
        return [pts[0], pts[1]]

    def _draw_weights(self, screen, src_pts, dst_pts, w, top_k):
        import pygame

        w = np.asarray(w, dtype=np.float64)
        if w.size == 0 or not src_pts or not dst_pts:
            return
        scale = np.percentile(np.abs(w), 95) + 1e-6
        for j, (dx, dy) in enumerate(dst_pts):
            if j >= w.shape[0]:
                break
            row = w[j]
            if top_k is None:
                idxs = range(min(len(src_pts), row.size))
            else:
                k = min(top_k, row.size, len(src_pts))
                idxs = np.argpartition(np.abs(row[: len(src_pts)]), -k)[-k:]
            for i in idxs:
                sx, sy = src_pts[int(i)]
                mag = float(row[int(i)]) / scale
                thick = max(1, min(4, int(round(1 + 3 * abs(mag)))))
                alpha = max(18, min(160, int(30 + 140 * abs(mag))))
                color = BLUE if mag >= 0 else CORAL
                col = tuple(min(255, int(c * alpha / 160)) for c in color)
                pygame.draw.line(screen, col, (int(sx), int(sy)), (int(dx), int(dy)), thick)


def _synthetic_batch(n: int = 32) -> tuple[torch.Tensor, torch.Tensor]:
    g = torch.Generator().manual_seed(7)
    proto = torch.nn.functional.normalize(torch.randn(2, EMBED_DIM, generator=g), dim=1)
    y = torch.randint(0, 2, (n,), generator=g)
    x = proto[y] + 0.35 * torch.randn(n, EMBED_DIM, generator=g)
    return x, y


def _prepare_real_or_fake() -> tuple[torch.Tensor, torch.Tensor, str]:
    from cnn.config import HENNEN_DIR, NOT_HENNEN_DIR
    from cnn.predict import list_images

    h_paths = list_images(HENNEN_DIR)
    o_paths = list_images(NOT_HENNEN_DIR)
    if len(h_paths) >= 8 and len(o_paths) >= 8:
        from cnn.faces import embed_path

        hv, ov = [], []
        for p in h_paths[:30]:
            v = embed_path(p, tta_flip=False)
            if v is not None:
                hv.append(v)
        for p in o_paths[:30]:
            v = embed_path(p, tta_flip=False)
            if v is not None:
                ov.append(v)
        if len(hv) >= 4 and len(ov) >= 4:
            x = torch.cat([torch.stack(hv), torch.stack(ov)])
            y = torch.cat([torch.ones(len(hv), dtype=torch.long), torch.zeros(len(ov), dtype=torch.long)])
            return x, y, "live train · real FaceNet embeddings"
    x, y = _synthetic_batch(48)
    return x, y, "live train · demo clusters (drop Hennen pics for the real net)"


def run_training_window(
    x: torch.Tensor | None = None,
    y: torch.Tensor | None = None,
    *,
    subtitle: str | None = None,
    epochs: int = HEAD_EPOCHS,
    loop_forever: bool = False,
) -> tuple[HennenHead, torch.Tensor, torch.Tensor]:
    """Train the head inside a 60 FPS Pygame loop. Weights redrawn after every step."""
    if x is None or y is None:
        x, y, auto = _prepare_real_or_fake()
        subtitle = subtitle or auto
    mean = x.mean(0)
    std = x.std(0).clamp_min(1e-6)
    x_n = (x - mean) / std
    extra_x = [x_n + 0.04 * torch.randn_like(x_n) for _ in range(NOISE_AUGMENTS)]
    x_aug = torch.cat([x_n, *extra_x])
    y_aug = torch.cat([y] * (1 + NOISE_AUGMENTS))
    n_pos = int((y == 1).sum())
    n_neg = int((y == 0).sum())
    weight = torch.tensor(
        [(n_pos + n_neg) / max(2 * max(n_neg, 1), 1), (n_pos + n_neg) / max(2 * max(n_pos, 1), 1)]
    )

    head = HennenHead()
    opt = torch.optim.AdamW(head.parameters(), lr=HEAD_LR, weight_decay=1e-3)
    viz = NetworkViz()
    set_active(viz)
    state = {"epoch": 0, "frames": 0, "loss": None, "done": False}

    def tick() -> None:
        nonlocal opt
        if state["done"] and not loop_forever:
            return
        state["frames"] += 1
        # one optimizer step every 8 frames → ~7.5 Hz updates, 60 FPS draw
        if state["frames"] % 8 != 0:
            return
        if state["epoch"] >= epochs:
            if loop_forever:
                state["epoch"] = 0
                head.net[0].reset_parameters()
                head.net[3].reset_parameters()
                opt = torch.optim.AdamW(head.parameters(), lr=HEAD_LR, weight_decay=1e-3)
            else:
                state["done"] = True
                return
        head.train()
        perm = torch.randperm(len(x_aug))
        xb, yb = x_aug[perm], y_aug[perm]
        logits = head(xb)
        loss = F.cross_entropy(logits, yb, weight=weight)
        opt.zero_grad()
        loss.backward()
        opt.step()
        loss_v = float(loss.detach().cpu())
        state["loss"] = loss_v
        state["epoch"] += 1
        # live activations from the sample we just trained on (first of shuffled batch)
        viz.push(
            snapshot_from_head(
                head,
                xb[:1],
                loss=loss_v,
                epoch=state["epoch"],
                epochs=epochs,
                phase="train · after backward()",
                title="C'est Hennen ?",
                subtitle=subtitle or "head 512 → 64 → 2",
            )
        )

    viz.loop(on_tick=tick)
    head.eval()
    return head, mean, std


def attach_conv_hook(net) -> tuple[dict, list]:
    import torch.nn as nn

    stored: dict = {"maps": None}

    def hook(_m, _i, out):
        stored["maps"] = out.detach().cpu().numpy()

    handles = []
    for _name, mod in net.named_modules():
        if isinstance(mod, nn.Conv2d):
            handles.append(mod.register_forward_hook(hook))
            break
    return stored, handles


_ACTIVE: NetworkViz | None = None
_CONV_HOLDER: dict | None = None


def set_active(viz: NetworkViz | None) -> None:
    global _ACTIVE
    _ACTIVE = viz


def push_active(snap: Snapshot) -> None:
    persist_snapshot(snap)
    if _ACTIVE is not None:
        _ACTIVE.push(snap, persist=False)


def last_conv_maps(holder: dict | None = None) -> np.ndarray | None:
    src = holder if holder is not None else _CONV_HOLDER
    if not src:
        return None
    return src.get("maps")


def start_background_window() -> NetworkViz:
    """Open the 60 FPS window on a thread (Linux). Prefer `python -m cnn viz` on macOS."""
    global _CONV_HOLDER
    viz = NetworkViz()
    set_active(viz)
    try:
        from cnn.faces import cnn as load_cnn

        _CONV_HOLDER, _ = attach_conv_hook(load_cnn())
    except Exception:
        _CONV_HOLDER = None
    thread = threading.Thread(target=viz.loop, daemon=True)
    thread.start()
    time.sleep(0.3)
    return viz


def run_detect_window() -> None:
    """Forward-pass visualizer: cycles samples (or dummy pulses) at 60 FPS."""
    from cnn.config import ARTIFACT_PATH, HENNEN_DIR, NOT_HENNEN_DIR
    from cnn.predict import HennenDetector, list_images

    viz = NetworkViz()
    holder: dict | None = None
    detector = None
    paths = list_images(HENNEN_DIR) + list_images(NOT_HENNEN_DIR)
    idx = {"i": 0, "frames": 0}

    if ARTIFACT_PATH.exists():
        detector = HennenDetector()
        from cnn.faces import cnn as load_cnn

        holder, _ = attach_conv_hook(load_cnn())

    def tick() -> None:
        idx["frames"] += 1
        if idx["frames"] % 45 != 0:
            return
        if detector is None or not paths:
            x, y = _synthetic_batch(1)
            dummy = HennenHead()
            viz.push(
                snapshot_from_head(
                    dummy,
                    x,
                    phase="demo forward",
                    subtitle="no hennen.pt yet — showing architecture",
                )
            )
            return
        from cnn.faces import embed_path

        path = paths[idx["i"] % len(paths)]
        idx["i"] += 1
        emb = embed_path(path, tta_flip=False)
        if emb is None:
            return
        x = ((emb - detector.scaler_mean) / detector.scaler_std).unsqueeze(0)
        result = detector.predict_path(path)
        viz.push(
            snapshot_from_head(
                detector.head,
                x,
                phase="detect · forward pass",
                subtitle=f"{path.name}  →  {result.label}  ({result.confidence:.0%})",
                conv_maps=last_conv_maps(holder),
                title="C'est Hennen ?",
            )
        )

    viz.loop(on_tick=tick)


def smoke(frames: int = 16) -> None:
    """Headless draw/train a few frames (SDL dummy)."""
    os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
    viz = NetworkViz(width=960, height=540)
    head = HennenHead()
    opt = torch.optim.SGD(head.parameters(), lr=0.05)
    x, y = _synthetic_batch(16)
    n = {"i": 0}

    def tick() -> None:
        n["i"] += 1
        if n["i"] % 2:
            return
        head.train()
        logits = head(x)
        loss = F.cross_entropy(logits, y)
        opt.zero_grad()
        loss.backward()
        opt.step()
        viz.push(
            snapshot_from_head(
                head,
                x[:1],
                loss=float(loss.detach().cpu()),
                epoch=n["i"],
                epochs=frames,
                phase="train · after backward()",
            )
        )

    viz.loop(on_tick=tick, max_frames=frames)


def run() -> None:
    """CLI entry: live train if we can, otherwise detect/demo."""
    from cnn.config import ARTIFACT_PATH, HENNEN_DIR
    from cnn.predict import list_images

    if list_images(HENNEN_DIR) or not ARTIFACT_PATH.exists():
        run_training_window(loop_forever=True, epochs=HEAD_EPOCHS)
    else:
        run_detect_window()
