"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { slides } from "@/data/slides";
import { cn } from "@/lib/utils";

const toneClass: Record<NonNullable<(typeof slides)[number]["tone"]>, string> = {
  hero: "bg-ink-950 text-ink-50",
  dark: "bg-ink-950 text-ink-50",
  accent: "bg-lime text-ink-950",
  demo: "bg-ink-900 text-ink-50",
};

export function Presentation() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const slide = slides[index];
  const progress = ((index + 1) / slides.length) * 100;

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

  const bg =
    toneClass[slide.tone ?? "dark"] ?? toneClass.dark;

  return (
    <div className={cn("relative flex min-h-dvh flex-col overflow-hidden", bg)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            slide.tone === "accent"
              ? "radial-gradient(ellipse 80% 60% at 10% 20%, rgba(11,18,32,0.12), transparent), radial-gradient(ellipse 50% 40% at 90% 80%, rgba(255,255,255,0.25), transparent)"
              : "radial-gradient(ellipse 70% 50% at 15% 10%, rgba(200,245,66,0.14), transparent), radial-gradient(ellipse 60% 45% at 85% 90%, rgba(255,107,74,0.12), transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <header className="relative z-10 flex items-center justify-between gap-4 px-5 py-4 sm:px-10">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "font-display text-sm font-semibold tracking-[0.18em] uppercase",
              slide.tone === "accent" ? "text-ink-950" : "text-lime",
            )}
          >
            Is it hennen? · CNN
          </span>
          <span
            className={cn(
              "hidden text-sm sm:inline",
              slide.tone === "accent" ? "text-ink-950/60" : "text-ink-400",
            )}
          >
            {slide.section}
          </span>
        </div>
        <div
          className={cn(
            "font-mono text-xs tabular-nums",
            slide.tone === "accent" ? "text-ink-950/70" : "text-ink-400",
          )}
        >
          {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </div>
      </header>

      <div
        className={cn(
          "relative h-0.5 w-full",
          slide.tone === "accent" ? "bg-ink-950/15" : "bg-white/10",
        )}
      >
        <motion.div
          className={cn(
            "h-full",
            slide.tone === "accent" ? "bg-ink-950" : "bg-lime",
          )}
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
              className={cn(
                "text-xs font-semibold uppercase tracking-[0.22em]",
                slide.tone === "accent" ? "text-ink-950/55" : "text-coral",
              )}
            >
              {slide.section}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className={cn(
                "mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl",
                slide.tone === "accent" ? "text-ink-950" : "text-ink-50",
              )}
            >
              {slide.title}
            </motion.h1>
            {slide.subtitle && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.18 }}
                className={cn(
                  "mt-4 max-w-2xl text-lg sm:text-xl",
                  slide.tone === "accent" ? "text-ink-950/70" : "text-ink-300",
                )}
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
          className={cn(
            "min-w-24",
            slide.tone === "accent"
              ? "border-ink-950/20 bg-ink-950/5 text-ink-950 hover:bg-ink-950/10"
              : "border-white/15 bg-white/5 text-ink-50 hover:bg-white/10",
          )}
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
                i === index
                  ? slide.tone === "accent"
                    ? "w-6 bg-ink-950"
                    : "w-6 bg-lime"
                  : slide.tone === "accent"
                    ? "w-1.5 bg-ink-950/25 hover:bg-ink-950/40"
                    : "w-1.5 bg-white/25 hover:bg-white/40",
              )}
            />
          ))}
        </div>
        <Button
          size="lg"
          onClick={() => go(index + 1)}
          disabled={index === slides.length - 1}
          className={cn(
            "min-w-24",
            slide.tone === "accent"
              ? "bg-ink-950 text-lime hover:bg-ink-950/90"
              : "bg-lime text-ink-950 hover:bg-lime/90",
          )}
        >
          Next
        </Button>
      </footer>
    </div>
  );
}
