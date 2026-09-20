"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CultBackdrop } from "@/components/CultBackdrop";
import { SiteNav } from "@/components/SiteNav";
import { slides } from "@/data/slides";
import { cn } from "@/lib/utils";

function slideFromQuery(raw: string | null) {
  const n = Number(raw) - 1;
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(slides.length - 1, n));
}

export function Presentation() {
  const searchParams = useSearchParams();
  const [index, setIndex] = useState(() => slideFromQuery(searchParams.get("s")));
  const [direction, setDirection] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ultraWide, setUltraWide] = useState(false);
  const slide = slides[index];
  const progress = ((index + 1) / slides.length) * 100;
  const accent = slide.tone === "accent";
  const wide = isFullscreen || ultraWide;

  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(slides.length - 1, next));
      setDirection(clamped > index ? 1 : -1);
      setIndex(clamped);
      const url = new URL(window.location.href);
      url.searchParams.set("s", String(clamped + 1));
      window.history.replaceState(null, "", url);
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
    const mq = window.matchMedia("(min-width: 1800px), (min-aspect-ratio: 2/1)");
    const onWide = () => setUltraWide(mq.matches);
    onFs();
    onWide();
    document.addEventListener("fullscreenchange", onFs);
    mq.addEventListener("change", onWide);
    return () => {
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
      document.removeEventListener("fullscreenchange", onFs);
      mq.removeEventListener("change", onWide);
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
    <div
      className={cn(
        "relative flex h-dvh max-h-dvh flex-col overflow-hidden text-ink-50",
        wide && "slides-wide",
      )}
    >
      <CultBackdrop variant={accent ? "lime" : "default"} />

      <SiteNav
        eyebrow={slide.section}
        className={
          wide
            ? "px-[clamp(1.5rem,4.5vw,6rem)] py-2"
            : "px-4 py-2 sm:px-8"
        }
        right={
          <>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-200 hover:bg-white/10"
            >
              {isFullscreen ? "Quitter" : "Plein"} · F
            </button>
            <span className="font-mono text-xs tabular-nums text-ink-400">
              {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
            </span>
          </>
        }
      />

      <div className="relative h-px w-full shrink-0 bg-white/10">
        <motion.div
          className="h-full bg-lime"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      <main className="relative z-10 min-h-0 flex-1">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={slide.id}
            custom={direction}
            initial={{ opacity: 0, x: direction >= 0 ? 36 : -36 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction >= 0 ? -28 : 28 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "absolute inset-0 mx-auto flex w-full flex-col",
              wide
                ? "max-w-none px-[clamp(1.5rem,4.5vw,6rem)] py-[clamp(0.75rem,1.6vh,1.5rem)]"
                : "max-w-6xl px-4 py-3 sm:px-8 lg:px-12",
            )}
          >
            <p className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.22em] text-coral">
              {slide.section}
            </p>
            <h1
              className={cn(
                "mt-1 shrink-0 font-display leading-[1.05] tracking-tight italic",
                "text-[clamp(1.65rem,4.6vh,3.4rem)]",
                wide && "text-[clamp(2rem,5vh_+_0.6vw,4.5rem)]",
                accent ? "text-lime" : "text-ink-50",
              )}
            >
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p
                className={cn(
                  "mt-1.5 shrink-0 leading-snug text-ink-300",
                  "text-[clamp(0.85rem,1.7vh,1.125rem)]",
                  wide ? "max-w-[min(72rem,70%)]" : "max-w-3xl",
                )}
              >
                {slide.subtitle}
              </p>
            )}
            {slide.say && (
              <p
                className={cn(
                  "mt-2 shrink-0 border-l-2 border-lime pl-3 leading-snug text-ink-50",
                  "text-[clamp(0.88rem,1.7vh,1.08rem)]",
                  wide
                    ? "max-w-[min(80rem,78%)] text-[clamp(1rem,1.8vh_+_0.2vw,1.25rem)]"
                    : "max-w-4xl",
                )}
              >
                <span className="mr-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-lime">
                  Dire
                </span>
                {slide.say}
              </p>
            )}
            <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden">
              {slide.content}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer
        className={cn(
          "relative z-10 flex shrink-0 items-center justify-between gap-3 py-2",
          wide
            ? "px-[clamp(1.5rem,4.5vw,6rem)]"
            : "px-4 sm:px-8",
        )}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          className="min-w-20 border-white/15 bg-white/5 text-ink-50 hover:bg-white/10"
        >
          Préc.
        </Button>
        <div className="hidden items-center gap-1.5 sm:flex">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Aller à la diapo ${i + 1}`}
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
          Suiv.
        </Button>
      </footer>
    </div>
  );
}
