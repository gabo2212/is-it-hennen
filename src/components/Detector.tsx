"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CultBackdrop } from "@/components/CultBackdrop";
import { NetworkCanvas } from "@/components/NetworkCanvas";
import { cn } from "@/lib/utils";
import type { VizPayload } from "@/lib/viz";

type Health = {
  ready: boolean;
  n_hennen?: number;
  n_other?: number;
  metrics?: {
    backbone?: string;
    cosine?: { accuracy?: number; f1?: number };
    head_train_acc?: number;
  };
};

type Prediction = {
  is_hennen: boolean;
  label: string;
  confidence: number;
  cosine: number;
  face_found: boolean;
  detail: string;
  viz?: VizPayload;
};

export function Detector() {
  const [health, setHealth] = useState<Health | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Prediction | null>(null);
  const [vizSnap, setVizSnap] = useState<VizPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/hennen/health", { cache: "no-store" });
      if (!res.ok) {
        setHealth({ ready: false });
        setHealthError("Detector API is off. Start it with: python -m cnn serve");
        return;
      }
      const data = (await res.json()) as Health;
      setHealth(data);
      setHealthError(data.ready ? null : "Model file missing. Train once: python -m cnn train");
    } catch {
      setHealth({ ready: false });
      setHealthError("Detector API is off. Start it with: python -m cnn serve");
    }
  }, []);

  useEffect(() => {
    void refreshHealth();
  }, [refreshHealth]);

  function onPick(next: File | null) {
    setFile(next);
    setResult(null);
    setVizSnap(null);
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(next ? URL.createObjectURL(next) : null);
  }

  async function onPredict() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/hennen/predict", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Predict failed");
      }
      setResult(data as Prediction);
      if (data.viz) setVizSnap(data.viz as VizPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Predict failed");
    } finally {
      setBusy(false);
    }
  }

  const ready = Boolean(health?.ready);

  return (
    <div className="relative min-h-dvh text-ink-50">
      <CultBackdrop />
      <header className="relative z-10 flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="font-display text-sm italic tracking-wide text-lime"
        >
          ← Slides
        </Link>
        <span className="text-xs uppercase tracking-[0.18em] text-ink-400">Detector</span>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-none flex-col gap-6 px-4 pb-8 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-coral">
            Inference only
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-tight italic sm:text-5xl">
            Is it hennen?
          </h1>
          <p className="mt-3 max-w-xl text-ink-300">
            The FaceNet CNN is already trained. This page never trains — it
            just checks a new photo against the saved Hennen gallery. The net
            below redraws from the live forward pass.
          </p>
        </div>

        {!ready && (
          <div className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-ink-200">
            {healthError}
            <p className="mt-2 text-ink-400">
              Put 20–30 Hennen pics in <code className="text-lime">data/hennen/</code>,
              run <code className="text-lime">python -m cnn train</code> once, then{" "}
              <code className="text-lime">python -m cnn serve</code>.
            </p>
            <Button variant="outline" className="mt-3" onClick={() => void refreshHealth()}>
              Recheck
            </Button>
          </div>
        )}

        {ready && health && (
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Stat label="Hennen shots" value={String(health.n_hennen ?? "—")} />
            <Stat label="Not-Hennen" value={String(health.n_other ?? "—")} />
            <Stat
              label="Head acc"
              value={
                health.metrics?.head_train_acc != null
                  ? `${Math.round(health.metrics.head_train_acc * 100)}%`
                  : "—"
              }
            />
            <Stat label="Backbone" value="FaceNet" />
          </dl>
        )}

        <label
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 transition",
            preview
              ? "border-lime/40 bg-white/5"
              : "border-white/15 bg-white/[0.03] hover:border-lime/40",
          )}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          />
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Upload preview"
              className="max-h-80 w-full rounded-lg object-contain"
            />
          ) : (
            <div className="text-center">
              <p className="font-display text-xl italic text-lime">Drop a photo</p>
              <p className="mt-1 text-sm text-ink-400">jpg / png · one face works best</p>
            </div>
          )}
        </label>

        <div className="flex flex-wrap gap-3">
          <Button
            size="lg"
            disabled={!ready || !file || busy}
            onClick={() => void onPredict()}
            className="bg-lime text-ink-950 hover:bg-lime/90"
          >
            {busy ? "Checking…" : "Is it hennen?"}
          </Button>
          {file && (
            <Button variant="outline" size="lg" onClick={() => onPick(null)}>
              Clear
            </Button>
          )}
        </div>

        {error && (
          <p className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm">
            {error}
          </p>
        )}

        {result && (
          <div
            className={cn(
              "rounded-2xl px-6 py-6",
              result.label === "NO FACE"
                ? "bg-white/10"
                : result.is_hennen
                  ? "bg-lime text-ink-950"
                  : "bg-coral text-ink-50",
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
              {result.detail}
            </p>
            <p className="font-display text-4xl italic sm:text-5xl">{result.label}</p>
            {result.face_found && (
              <p className="mt-2 text-sm opacity-80">
                {Math.round(result.confidence * 100)}% confidence · cosine{" "}
                {result.cosine.toFixed(3)}
              </p>
            )}
          </div>
        )}

        <NetworkCanvas snapshot={vizSnap} scanning={busy} className="w-full" />
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-3 py-3 ring-1 ring-white/10">
      <dt className="text-[11px] uppercase tracking-wider text-ink-400">{label}</dt>
      <dd className="mt-1 font-display text-lg italic text-ink-50">{value}</dd>
    </div>
  );
}
