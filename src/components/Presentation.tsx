"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CultBackdrop } from "@/components/CultBackdrop";
import { slides } from "@/data/slides";
import { cn } from "@/lib/utils";

export function Presentation() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const slide = slides[index];
  const progress = ((index + 1) / slides.length) * 100;
  const accent = slide.tone === "accent";

  const go = useCallback(
    (next: number) => {
      setDirection(next > index ? 1 : -1);
      setIndex(Math.max(0, Math.min(slides.length - 1, next)));
    },
    [index],
  );

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(index + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === "Home") {
        go(0);
      } else if (e.key === "End") {
        go(slides.length - 1);
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, toggleFullscreen]);

  return (
    <div className="relative flex h-dvh max-h-dvh flex-col overflow-hidden text-ink-50">
      <CultBackdrop variant={accent ? "lime" : "default"} />

      <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 px-4 py-2 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="font-display text-sm italic tracking-wide text-lime">
            Is it hennen? · CNN
          </span>
          <span className="hidden truncate text-sm text-ink-400 sm:inline">
            {slide.section}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-200 hover:bg-white/10"
          >
            {isFullscreen ? "Exit" : "Full"} · F
          </button>
          <Link
            href="/detect"
            className="rounded-md bg-lime px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-ink-950"
          >
            Detector
          </Link>
          <span className="font-mono text-xs tabular-nums text-ink-400">
            {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </span>
        </div>
      </header>

      <div className="relative h-px w-full shrink-0 bg-white/10">
        <motion.div
          className="h-full bg-lime"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col px-4 py-3 sm:px-8 lg:px-12">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide.id}
            custom={direction}
            initial={{ opacity: 0, x: direction >= 0 ? 36 : -36 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction >= 0 ? -28 : 28 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col"
          >
            <p className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.22em] text-coral">
              {slide.section}
            </p>
            <h1
              className={cn(
                "mt-1 shrink-0 font-display leading-[1.05] tracking-tight italic",
                "text-[clamp(1.65rem,4.6vh,3.4rem)]",
                accent ? "text-lime" : "text-ink-50",
              )}
            >
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p className="mt-1.5 max-w-3xl shrink-0 text-[clamp(0.85rem,1.7vh,1.125rem)] leading-snug text-ink-300">
                {slide.subtitle}
              </p>
            )}
            <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden">
              {slide.content}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="relative z-10 flex shrink-0 items-center justify-between gap-3 px-4 py-2 sm:px-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          className="min-w-20 border-white/15 bg-white/5 text-ink-50 hover:bg-white/10"
        >
          Prev
        </Button>
        <div className="hidden items-center gap-1.5 sm:flex">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => go(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-6 bg-lime" : "w-1.5 bg-white/25 hover:bg-white/40",
              )}
            />
          ))}
        </div>
        <Button
          size="sm"
          onClick={() => go(index + 1)}
          disabled={index === slides.length - 1}
          className="min-w-20 bg-lime text-ink-950 hover:bg-lime/90"
        >
          Next
        </Button>
      </footer>
    </div>
  );
}
