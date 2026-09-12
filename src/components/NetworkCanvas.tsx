"use client";

import { useEffect, useRef, useState } from "react";
import { IDLE_VIZ, type VizPayload } from "@/lib/viz";
import { cn } from "@/lib/utils";

const LIME = { r: 173, g: 250, b: 30 };
const MAGENTA = { r: 237, g: 64, b: 179 };
const MINT = { r: 110, g: 247, b: 204 };
const CORAL = { r: 255, g: 107, b: 74 };

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function mixArr(cur: Float32Array, nxt: number[], a: number) {
  const n = Math.min(cur.length, nxt.length);
  for (let i = 0; i < n; i++) cur[i] += a * (nxt[i] - cur[i]);
}

function rgb(c: { r: number; g: number; b: number }, alpha = 1) {
  return `rgba(${c.r},${c.g},${c.b},${alpha})`;
}

export function NetworkCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef<VizPayload>(IDLE_VIZ);
  const shownRef = useRef({
    input: new Float32Array(512),
    hidden: new Float32Array(64),
    output: new Float32Array([0.5, 0.5]),
  });
  const lastSeqRef = useRef(0);
  const liveUntilRef = useRef(0);
  const [hud, setHud] = useState({
    phase: IDLE_VIZ.phase,
    subtitle: IDLE_VIZ.subtitle,
    loss: null as number | null,
    epoch: null as number | null,
    epochs: null as number | null,
    live: false,
  });

  useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      try {
        const res = await fetch("/api/viz", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as VizPayload;
        targetRef.current = data;
        if (data.seq && data.seq !== lastSeqRef.current) {
          lastSeqRef.current = data.seq;
          if ((data.phase ?? "idle") !== "idle") {
            liveUntilRef.current = performance.now() + 2200;
          }
        }
        if (!cancelled) {
          const next = {
            phase: data.phase ?? "idle",
            subtitle: data.subtitle ?? "",
            loss: data.loss ?? null,
            epoch: data.epoch ?? null,
            epochs: data.epochs ?? null,
            live: performance.now() < liveUntilRef.current,
          };
          setHud((prev) =>
            prev.phase === next.phase &&
            prev.subtitle === next.subtitle &&
            prev.loss === next.loss &&
            prev.epoch === next.epoch &&
            prev.epochs === next.epochs &&
            prev.live === next.live
              ? prev
              : next,
          );
        }
      } catch {
        /* API / file missing — keep last frame */
      }
    };
    void pull();
    const id = window.setInterval(() => void pull(), 50);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const draw = () => {
      const target = targetRef.current;
      const shown = shownRef.current;
      mixArr(shown.input, target.input ?? [], 0.22);
      mixArr(shown.hidden, target.hidden ?? [], 0.22);
      mixArr(shown.output, target.output ?? [], 0.22);

      const live = performance.now() < liveUntilRef.current;
      const idle = (target.phase ?? "idle") === "idle" && !live;
      if (idle) {
        const t = performance.now() / 900;
        for (let i = 0; i < shown.hidden.length; i++) {
          shown.hidden[i] = 0.12 + 0.1 * Math.sin(t + i * 0.22);
        }
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = canvas.clientWidth || 640;
      const cssH = canvas.clientHeight || 420;
      if (canvas.width !== Math.floor(cssW * dpr) || canvas.height !== Math.floor(cssH * dpr)) {
        canvas.width = Math.floor(cssW * dpr);
        canvas.height = Math.floor(cssH * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      const pad = 18;
      const top = 28;
      const bottom = cssH - 22;
      const gridX = pad;
      const gridW = cssW * 0.34;
      const gridH = bottom - top;
      const hidX = cssW * 0.56;
      const outX = cssW * 0.88;

      const inPts = drawInput(ctx, shown.input, gridX, top, gridW, gridH);
      const hidPts = drawHidden(ctx, shown.hidden, hidX, top, bottom);
      const outPts = drawOutputs(ctx, shown.output, outX, cssH);

      drawEdges(ctx, inPts, hidPts, target.e1 ?? [], 5);
      drawEdges(ctx, hidPts, outPts, target.e2 ?? [], null);

      ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
      ctx.fillStyle = "rgba(173,250,30,0.85)";
      ctx.fillText("FaceNet 512", gridX, top - 10);
      ctx.fillText("hidden 64", hidX - 28, top - 10);
      ctx.fillText("out", outX - 8, top - 10);

      raf = window.requestAnimationFrame(draw);
    };

    raf = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  return (
    <section
      className={cn(
        "relative flex min-h-[22rem] flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-1">
        <div className="min-w-0">
          <p className="font-display text-lg italic text-ink-50">Live net</p>
          <p className="truncate text-[11px] uppercase tracking-[0.16em] text-ink-400">
            {hud.subtitle || hud.phase}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-ink-400">
          <span
            className={cn(
              "inline-block size-1.5 rounded-full",
              hud.live ? "bg-lime shadow-[0_0_10px_#adfa1e]" : "bg-white/25",
            )}
            aria-hidden
          />
          {hud.live ? "running" : "idle"}
          {hud.epoch != null ? ` · ep ${hud.epoch}/${hud.epochs ?? "?"}` : null}
          {hud.loss != null ? ` · loss ${hud.loss.toFixed(3)}` : null}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="h-[min(52vh,28rem)] w-full flex-1"
        role="img"
        aria-label="Live neural network: FaceNet embeddings into a 64-neuron head and two outputs"
      />
    </section>
  );
}

function drawInput(
  ctx: CanvasRenderingContext2D,
  act: Float32Array,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const cols = 16;
  const rows = 32;
  const gw = w / cols;
  const gh = (h - 4) / rows;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < rows * cols; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const px = x + c * gw + gw / 2;
    const py = y + r * gh + gh / 2;
    const raw = Math.tanh(act[i] ?? 0);
    const v = Math.abs(raw);
    const shade = 18 + 200 * v;
    if (raw >= 0) {
      ctx.fillStyle = `rgb(${shade / 3},${shade * 0.95},${shade / 4})`;
    } else {
      ctx.fillStyle = `rgb(${shade},${shade / 3},${shade / 4})`;
    }
    ctx.fillRect(px - gw / 2 + 0.6, py - gh / 2 + 0.6, Math.max(1, gw - 1.2), Math.max(1, gh - 1.2));
    pts.push({ x: px, y: py });
  }
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.strokeRect(x, y, w, h - 4);
  return pts;
}

function drawHidden(
  ctx: CanvasRenderingContext2D,
  act: Float32Array,
  x: number,
  y: number,
  bottom: number,
) {
  const pts: { x: number; y: number }[] = [];
  let mx = 1e-6;
  for (let i = 0; i < 64; i++) mx = Math.max(mx, Math.max(act[i] ?? 0, 0));
  const n = 64;
  const gap = (bottom - y) / n;
  for (let i = 0; i < n; i++) {
    const py = y + gap * i + gap / 2;
    const v = clamp((Math.max(act[i] ?? 0, 0) / mx) || 0, 0, 1);
    const rad = 2.2 + 5.4 * v;
    ctx.beginPath();
    ctx.arc(x, py, rad, 0, Math.PI * 2);
    ctx.fillStyle = rgb(LIME, 0.22 + 0.78 * v);
    ctx.fill();
    ctx.strokeStyle = "rgba(60,80,110,0.7)";
    ctx.lineWidth = 1;
    ctx.stroke();
    pts.push({ x, y: py });
  }
  return pts;
}

function drawOutputs(ctx: CanvasRenderingContext2D, act: Float32Array, x: number, h: number) {
  const labels = ["NOT", "HENNEN"];
  const colors = [CORAL, LIME];
  const ys = [h * 0.34, h * 0.66];
  const pts: { x: number; y: number }[] = [];
  for (let cls = 0; cls < 2; cls++) {
    const v = clamp(act[cls] ?? 0, 0, 1);
    const py = ys[cls];
    const rad = 14 + 22 * v;
    const c = colors[cls];
    ctx.beginPath();
    ctx.arc(x, py, rad, 0, Math.PI * 2);
    ctx.fillStyle = rgb(c, 0.22 + 0.7 * v);
    ctx.fill();
    ctx.strokeStyle = rgb(c, 0.95);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = "600 12px ui-sans-serif, system-ui, sans-serif";
    ctx.fillStyle = rgb(c, 0.95);
    ctx.fillText(`${labels[cls]}  ${Math.round(v * 100)}%`, x + rad + 10, py + 4);
    pts.push({ x, y: py });
  }
  return pts;
}

function drawEdges(
  ctx: CanvasRenderingContext2D,
  src: { x: number; y: number }[],
  dst: { x: number; y: number }[],
  edges: { s: number; d: number; w: number }[],
  topK: number | null,
) {
  if (!src.length || !dst.length || !edges.length) return;
  let scale = 1e-6;
  for (const e of edges) scale = Math.max(scale, Math.abs(e.w));
  const grouped = new Map<number, typeof edges>();
  for (const e of edges) {
    const list = grouped.get(e.d) ?? [];
    list.push(e);
    grouped.set(e.d, list);
  }
  ctx.lineCap = "round";
  for (const [, list] of grouped) {
    const ranked = [...list].sort((a, b) => Math.abs(b.w) - Math.abs(a.w));
    const pick = topK == null ? ranked : ranked.slice(0, topK);
    for (const e of pick) {
      const a = src[e.s];
      const b = dst[e.d];
      if (!a || !b) continue;
      const mag = e.w / scale;
      const alpha = clamp(0.08 + 0.42 * Math.abs(mag), 0.06, 0.5);
      ctx.strokeStyle = mag >= 0 ? rgb(MINT, alpha) : rgb(MAGENTA, alpha);
      ctx.lineWidth = clamp(0.6 + 2.4 * Math.abs(mag), 0.6, 3);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
}
