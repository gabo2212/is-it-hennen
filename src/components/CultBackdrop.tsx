"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "lime";

/** Cult landing-page atmosphere: dark stage, color orbs, column guides, film grain. */
export function CultBackdrop({ variant = "default" }: { variant?: Variant }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const paint = () => {
      const w = 160;
      const h = 110;
      canvas.width = w;
      canvas.height = h;
      const img = ctx.createImageData(w, h);
      const data = img.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = 110 + Math.random() * 90;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 36;
      }
      ctx.putImageData(img, 0, 0);
    };

    paint();
    if (reduced) return;
    const id = window.setInterval(paint, 90);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#070708]"
      aria-hidden
    >
      <div
        className={cn("absolute inset-0", variant === "lime" && "opacity-95")}
        style={{
          background: [
            "radial-gradient(ellipse 90% 55% at 74% 6%, rgba(237,64,179,0.30), transparent 58%)",
            "radial-gradient(ellipse 55% 48% at 10% 92%, rgba(173,250,30,0.16), transparent 52%)",
            "radial-gradient(ellipse 42% 36% at 92% 78%, rgba(110,247,204,0.14), transparent 50%)",
          ].join(","),
        }}
      />
      {variant === "lime" ? (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 46% at 50% -8%, rgba(173,250,30,0.22), transparent 58%)",
          }}
        />
      ) : null}
      <div className="absolute inset-0 flex">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-full flex-1 border-r border-white/[0.055] last:border-r-0"
          />
        ))}
      </div>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full scale-110 opacity-50 mix-blend-overlay"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 32%, rgba(0,0,0,0.64) 100%)",
        }}
      />
    </div>
  );
}
