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
        if (!document.fullscreenElement) {
          void document.documentElement.requestFullscreen();
        } else {
          void document.exitFullscreen();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden text-ink-50">
      <CultBackdrop variant={accent ? "lime" : "default"} />

      <header className="relative z-10 flex items-center justify-between gap-4 px-5 py-4 sm:px-10">
        <div className="flex items-center gap-3">
          <span className="font-display text-sm italic tracking-wide text-lime">
            Is it hennen? · CNN
          </span>
          <span className="hidden text-sm text-ink-400 sm:inline">{slide.section}</span>
        </div>
        <div className="flex items-center gap-3">
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

      <div className="relative h-px w-full bg-white/10">
        <motion.div
          className="h-full bg-lime"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      <main className="relative z-10 flex flex-1 flex-col justify-center px-5 py-8 sm:px-10 sm:py-12 lg:px-16">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide.id}
            custom={direction}
            initial={{ opacity: 0, x: direction >= 0 ? 48 : -48, filter: "blur(6px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: direction >= 0 ? -36 : 36, filter: "blur(4px)" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-5xl"
          >
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-xs font-semibold uppercase tracking-[0.22em] text-coral"
            >
              {slide.section}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className={cn(
                "mt-3 font-display text-4xl leading-[1.05] tracking-tight italic sm:text-5xl lg:text-6xl",
                accent ? "text-lime" : "text-ink-50",
              )}
            >
              {slide.title}
            </motion.h1>
            {slide.subtitle && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.18 }}
                className="mt-4 max-w-2xl text-lg text-ink-300 sm:text-xl"
              >
                {slide.subtitle}
              </motion.p>
            )}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
            >
              {slide.content}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="relative z-10 flex items-center justify-between gap-3 px-5 py-4 sm:px-10">
        <Button
          variant="outline"
          size="lg"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          className="min-w-24 border-white/15 bg-white/5 text-ink-50 hover:bg-white/10"
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
          size="lg"
          onClick={() => go(index + 1)}
          disabled={index === slides.length - 1}
          className="min-w-24 bg-lime text-ink-950 hover:bg-lime/90"
        >
          Next
        </Button>
      </footer>
    </div>
  );
}
