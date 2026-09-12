"use client";

import { useEffect, useRef, useState } from "react";
import { IDLE_VIZ, type ConvMaps, type VizPayload } from "@/lib/viz";
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

function ease(t: number) {
  const x = clamp(t, 0, 1);
  return 1 - (1 - x) * (1 - x) * (1 - x);
}

function isDetectPhase(phase: string | undefined) {
  return (phase ?? "").includes("detect");
}

export function NetworkCanvas({
  className,
  snapshot,
}: {
  className?: string;
  snapshot?: VizPayload | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef<VizPayload>(IDLE_VIZ);
  const shownRef = useRef({
    input: new Float32Array(512),
    hidden: new Float32Array(64),
    output: new Float32Array([0.5, 0.5]),
  });
  const lastSeqRef = useRef(0);
  const liveUntilRef = useRef(0);
  const waveStartRef = useRef(0);
  const faceImgRef = useRef<HTMLImageElement | null>(null);
  const faceSrcRef = useRef("");
  const [hud, setHud] = useState({
    phase: IDLE_VIZ.phase,
    subtitle: IDLE_VIZ.subtitle,
    loss: null as number | null,
    epoch: null as number | null,
    epochs: null as number | null,
    live: false,
  });

  function apply(data: VizPayload, snapOut: boolean, force = false) {
    if (!force && (data.seq ?? 0) < lastSeqRef.current) return;
    const newer = (data.seq ?? 0) > lastSeqRef.current;
    lastSeqRef.current = Math.max(lastSeqRef.current, data.seq ?? 0);
    targetRef.current = data;
    if (newer) waveStartRef.current = performance.now();
    if (snapOut && data.output?.length >= 2) {
      shownRef.current.output[0] = data.output[0];
      shownRef.current.output[1] = data.output[1];
    }
    if (data.face && data.face !== faceSrcRef.current) {
      faceSrcRef.current = data.face;
      const im = new Image();
      im.onload = () => {
        faceImgRef.current = im;
      };
      im.src = data.face;
    }
    if (isDetectPhase(data.phase) || (data.phase ?? "idle") !== "idle") {
      liveUntilRef.current = performance.now() + 5000;
    }
    const detect = isDetectPhase(data.phase);
    const live = performance.now() < liveUntilRef.current;
    const next = {
      phase: data.phase ?? "idle",
      subtitle: data.subtitle ?? "",
      loss: detect ? null : (data.loss ?? null),
      epoch: detect ? null : (data.epoch ?? null),
      epochs: detect ? null : (data.epochs ?? null),
      live,
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

  useEffect(() => {
    if (snapshot && (snapshot.seq ?? 0) > 0) apply(snapshot, true, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);

  useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      try {
        const res = await fetch("/api/viz", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as VizPayload;
        if (!cancelled) apply(data, isDetectPhase(data.phase));
      } catch {
        /* keep last frame */
      }
    };
    void pull();
    const id = window.setInterval(() => void pull(), 80);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const draw = () => {
      const now = performance.now();
      const target = targetRef.current;
      const shown = shownRef.current;
      const detect = isDetectPhase(target.phase);
      mixArr(shown.input, target.input ?? [], detect ? 0.4 : 0.22);
      mixArr(shown.hidden, target.hidden ?? [], detect ? 0.4 : 0.22);
      mixArr(shown.output, target.output ?? [], detect ? 0.55 : 0.22);

      const live = now < liveUntilRef.current;
      const idle = (target.phase ?? "idle") === "idle" && !live;
      if (idle) {
        const t = now / 900;
        for (let i = 0; i < shown.hidden.length; i++) {
          shown.hidden[i] = 0.12 + 0.1 * Math.sin(t + i * 0.22);
        }
      }

      const wave = ease((now - (waveStartRef.current || now)) / 1200);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = canvas.clientWidth || 640;
      const cssH = canvas.clientHeight || 420;
      if (canvas.width !== Math.floor(cssW * dpr) || canvas.height !== Math.floor(cssH * dpr)) {
        canvas.width = Math.floor(cssW * dpr);
        canvas.height = Math.floor(cssH * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      const pad = 16;
      const top = 30;
      const bottom = cssH - 24;
      const labelReserve = 128;
      const faceW = 84;
      const convW = Math.min(152, cssW * 0.22);
      const embedW = 70;
      const outX = Math.max(pad + 280, cssW - pad - labelReserve);
      const hidX = pad + faceW + 10 + convW + 12 + embedW + 28;
      const hidXClamped = Math.min(hidX, outX - 70);
      const faceX = pad;
      const convX = faceX + faceW + 10;
      const embedX = convX + convW + 12;

      drawScan(ctx, pad, top, cssW - pad * 2, bottom - top, wave, live || detect);

      drawFace(ctx, faceImgRef.current, faceX, top, faceW, 84, wave, now);
      drawConvMaps(ctx, target.maps, convX, top, convW, bottom - top - 8, wave, now);
      const inPts = drawEmbedding(ctx, shown.input, embedX, top, embedW, bottom - top, wave, now);
      const hidPts = drawHidden(ctx, shown.hidden, hidXClamped, top, bottom, wave, now);
      const outPts = drawOutputs(ctx, shown.output, outX, cssH, wave, now);

      ctx.globalAlpha = 0.35 + 0.65 * clamp((wave - 0.35) / 0.4, 0, 1);
      drawEdges(ctx, inPts, hidPts, target.e1 ?? [], 4);
      drawEdges(ctx, hidPts, outPts, target.e2 ?? [], null);
      drawParticles(ctx, inPts, hidPts, target.e1 ?? [], now, 36, MINT);
      drawParticles(ctx, hidPts, outPts, target.e2 ?? [], now, 18, MAGENTA);
      ctx.globalAlpha = 1;

      ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
      ctx.fillStyle = "rgba(173,250,30,0.85)";
      ctx.fillText("MTCNN crop", faceX, top - 10);
      ctx.fillText("FaceNet conv1", convX, top - 10);
      ctx.fillText("512-d", embedX, top - 10);
      ctx.fillText("hidden 64", hidXClamped - 28, top - 10);
      ctx.fillText("out", outX - 8, top - 10);

      raf = window.requestAnimationFrame(draw);
    };

    raf = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  return (
    <section
      className={cn(
        "relative flex min-h-[32rem] flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
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
        className="h-[min(62vh,40rem)] min-h-[28rem] w-full flex-1"
        role="img"
        aria-label="Live FaceNet: aligned face, conv maps, 512-d embedding, 64-neuron head, two outputs"
      />
    </section>
  );
}

function drawScan(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  wave: number,
  on: boolean,
) {
  if (!on) return;
  const sx = x + w * wave;
  const g = ctx.createLinearGradient(sx - 40, y, sx + 18, y);
  g.addColorStop(0, "rgba(110,247,204,0)");
  g.addColorStop(0.7, "rgba(110,247,204,0.10)");
  g.addColorStop(1, "rgba(173,250,30,0.18)");
  ctx.fillStyle = g;
  ctx.fillRect(sx - 40, y, 58, h);
}

function drawFace(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  wave: number,
  now: number,
) {
  ctx.save();
  ctx.globalAlpha = 0.25 + 0.75 * clamp(wave / 0.25, 0, 1);
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(173,250,30,0.35)";
  ctx.strokeRect(x, y, w, h);
  if (img && img.complete) {
    ctx.drawImage(img, x, y, w, h);
  }
  const scanY = y + ((now / 18) % h);
  ctx.fillStyle = "rgba(110,247,204,0.18)";
  ctx.fillRect(x, scanY, w, 2);
  const tick = 8;
  ctx.strokeStyle = rgb(LIME, 0.7);
  ctx.beginPath();
  ctx.moveTo(x, y + tick);
  ctx.lineTo(x, y);
  ctx.lineTo(x + tick, y);
  ctx.moveTo(x + w - tick, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + tick);
  ctx.stroke();
  ctx.restore();
}

let convScratch: HTMLCanvasElement | null = null;

function scratchConv(s: number) {
  if (!convScratch) convScratch = document.createElement("canvas");
  if (convScratch.width !== s || convScratch.height !== s) {
    convScratch.width = s;
    convScratch.height = s;
  }
  return convScratch.getContext("2d");
}

function drawConvMaps(
  ctx: CanvasRenderingContext2D,
  maps: ConvMaps | null | undefined,
  x: number,
  y: number,
  w: number,
  h: number,
  wave: number,
  now: number,
) {
  const cols = 4;
  const rows = 4;
  const gap = 3;
  const cell = Math.min((w - gap * (cols - 1)) / cols, (h - gap * (rows - 1)) / rows);
  const c = maps?.c ?? 0;
  const s = maps?.s ?? 0;
  const px = maps?.px ?? [];
  for (let i = 0; i < cols * rows; i++) {
    const r = Math.floor(i / cols);
    const col = i % cols;
    const dx = x + col * (cell + gap);
    const dy = y + r * (cell + gap);
    const appear = clamp((wave - 0.12 - i * 0.018) / 0.18, 0, 1);
    ctx.globalAlpha = 0.15 + 0.85 * appear;
    ctx.fillStyle = "rgba(8,10,12,0.9)";
    ctx.fillRect(dx, dy, cell, cell);
    if (c && s && i < c) {
      const pulse = 0.82 + 0.18 * Math.sin(now / 220 + i * 0.4);
      const off = i * s * s;
      const img = ctx.createImageData(s, s);
      for (let p = 0; p < s * s; p++) {
        const v = ((px[off + p] ?? 0) / 255) * pulse;
        const o = p * 4;
        img.data[o] = 20 + v * 153;
        img.data[o + 1] = 30 + v * 220;
        img.data[o + 2] = 18 + v * 40;
        img.data[o + 3] = 255;
      }
      const tctx = scratchConv(s);
      if (tctx) {
        tctx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(convScratch!, dx, dy, cell, cell);
        ctx.imageSmoothingEnabled = true;
      }
    }
    ctx.strokeStyle = "rgba(173,250,30,0.18)";
    ctx.strokeRect(dx, dy, cell, cell);
  }
  ctx.globalAlpha = 1;
}

function drawEmbedding(
  ctx: CanvasRenderingContext2D,
  act: Float32Array,
  x: number,
  y: number,
  w: number,
  h: number,
  wave: number,
  now: number,
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
    const reveal = clamp((wave - 0.28 - (r / rows) * 0.35) / 0.2, 0, 1);
    const raw = Math.tanh(act[i] ?? 0);
    const v = Math.abs(raw) * reveal;
    const flicker = 0.88 + 0.12 * Math.sin(now / 160 + i * 0.03);
    const shade = (18 + 200 * v) * flicker;
    if (raw >= 0) {
      ctx.fillStyle = `rgba(${shade / 3},${shade * 0.95},${shade / 4},${0.25 + 0.75 * reveal})`;
    } else {
      ctx.fillStyle = `rgba(${shade},${shade / 3},${shade / 4},${0.25 + 0.75 * reveal})`;
    }
    ctx.fillRect(px - gw / 2 + 0.5, py - gh / 2 + 0.5, Math.max(1, gw - 1), Math.max(1, gh - 1));
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
  wave: number,
  now: number,
) {
  const pts: { x: number; y: number }[] = [];
  let mx = 1e-6;
  for (let i = 0; i < 64; i++) mx = Math.max(mx, Math.max(act[i] ?? 0, 0));
  const n = 64;
  const gap = (bottom - y) / n;
  for (let i = 0; i < n; i++) {
    const py = y + gap * i + gap / 2;
    const reveal = clamp((wave - 0.5 - i * 0.004) / 0.25, 0, 1);
    const v = clamp((Math.max(act[i] ?? 0, 0) / mx) || 0, 0, 1) * reveal;
    const breath = 1 + 0.16 * Math.sin(now / 240 + i * 0.2);
    const rad = (2.2 + 5.4 * v) * breath;
    ctx.beginPath();
    ctx.arc(x, py, rad, 0, Math.PI * 2);
    ctx.fillStyle = rgb(LIME, 0.18 + 0.82 * v);
    ctx.fill();
    if (v > 0.35) {
      ctx.beginPath();
      ctx.arc(x, py, rad * 2.1, 0, Math.PI * 2);
      ctx.fillStyle = rgb(LIME, 0.08 * v);
      ctx.fill();
    }
    pts.push({ x, y: py });
  }
  return pts;
}

function drawOutputs(
  ctx: CanvasRenderingContext2D,
  act: Float32Array,
  x: number,
  h: number,
  wave: number,
  now: number,
) {
  const labels = ["NOT", "HENNEN"];
  const colors = [CORAL, LIME];
  const ys = [h * 0.34, h * 0.66];
  const pts: { x: number; y: number }[] = [];
  const reveal = clamp((wave - 0.72) / 0.22, 0, 1);
  for (let cls = 0; cls < 2; cls++) {
    const v = clamp(act[cls] ?? 0, 0, 1) * (0.15 + 0.85 * reveal);
    const py = ys[cls];
    const breath = 1 + 0.08 * Math.sin(now / 200 + cls);
    const rad = (14 + 22 * v) * breath;
    const c = colors[cls];
    ctx.beginPath();
    ctx.arc(x, py, rad * 1.85, 0, Math.PI * 2);
    ctx.fillStyle = rgb(c, 0.08 + 0.12 * v);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, py, rad, 0, Math.PI * 2);
    ctx.fillStyle = rgb(c, 0.22 + 0.7 * v);
    ctx.fill();
    ctx.strokeStyle = rgb(c, 0.95);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = "600 12px ui-sans-serif, system-ui, sans-serif";
    ctx.fillStyle = rgb(c, 0.95);
    ctx.fillText(`${labels[cls]}  ${Math.round((act[cls] ?? 0) * 100)}%`, x + rad + 10, py + 4);
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

function drawParticles(
  ctx: CanvasRenderingContext2D,
  src: { x: number; y: number }[],
  dst: { x: number; y: number }[],
  edges: { s: number; d: number; w: number }[],
  now: number,
  count: number,
  color: { r: number; g: number; b: number },
) {
  if (!src.length || !dst.length || !edges.length) return;
  const n = Math.min(count, edges.length);
  for (let i = 0; i < n; i++) {
    const e = edges[i];
    const a = src[e.s];
    const b = dst[e.d];
    if (!a || !b) continue;
    const u = (now / 900 + i * 0.07) % 1;
    const x = a.x + (b.x - a.x) * u;
    const y = a.y + (b.y - a.y) * u;
    ctx.beginPath();
    ctx.arc(x, y, 1.7, 0, Math.PI * 2);
    ctx.fillStyle = rgb(color, 0.35 + 0.45 * (1 - Math.abs(u - 0.5) * 2));
    ctx.fill();
  }
}
