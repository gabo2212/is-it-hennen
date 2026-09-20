"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { CultBackdrop } from "@/components/CultBackdrop";
import { NetworkCanvas } from "@/components/NetworkCanvas";
import { SiteNav } from "@/components/SiteNav";
import { cn } from "@/lib/utils";
import type { VizPayload } from "@/lib/viz";

const FlyBrain3D = dynamic(() => import("@/components/FlyBrain3D"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[22rem] items-center justify-center rounded-2xl bg-black/50 text-sm text-ink-400 ring-1 ring-white/10">
      Chargement du cerveau…
    </div>
  ),
});

type Health = {
  ready: boolean;
  fly_ready?: boolean;
  n_hennen?: number;
  n_other?: number;
  metrics?: {
    backbone?: string;
    cosine?: { accuracy?: number; f1?: number };
    head_train_acc?: number;
  };
};

type FlyVote = {
  is_hennen: boolean;
  label: string;
  confidence: number;
  valence: number;
  sparsity: number;
  lit: number[];
};

type Prediction = {
  is_hennen: boolean;
  label: string;
  confidence: number;
  cosine: number;
  face_found: boolean;
  detail: string;
  viz?: VizPayload;
  fly?: FlyVote | null;
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
        setHealthError("L'API du détecteur est éteinte. Lance : npm run api");
        return;
      }
      const data = (await res.json()) as Health;
      setHealth(data);
      setHealthError(data.ready ? null : "Fichier modèle manquant. Entraîne une fois : python -m cnn train");
    } catch {
      setHealth({ ready: false });
      setHealthError("L'API du détecteur est éteinte. Lance : npm run api");
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
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/hennen/predict", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Échec de la prédiction");
      }
      setResult(data as Prediction);
      if (data.viz) setVizSnap(data.viz as VizPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la prédiction");
    } finally {
      setBusy(false);
    }
  }

  const ready = Boolean(health?.ready);
  const fly = result?.fly ?? null;

  return (
    <div className="relative min-h-dvh text-ink-50">
      <CultBackdrop />
      <SiteNav eyebrow="Détecteur" />

      <main className="relative z-10 mx-auto flex w-full max-w-none flex-col gap-6 px-4 pb-8 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-coral">
            Inférence seulement
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-tight italic sm:text-5xl">
            C'est Hennen ?
          </h1>
          <p className="mt-3 max-w-2xl text-ink-300">
            Le CNN FaceNet est déjà entraîné. Cette page n'entraîne jamais —
            elle compare une photo à la galerie Hennen. La mouche vote en
            parallèle : le nez est FaceNet, le champignon est le vrai
            câblage Kenyon de FlyWire.
          </p>
        </div>

        {!ready && (
          <div className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-ink-200">
            {healthError}
            <p className="mt-2 text-ink-400">
              Mets 20–30 photos de Hennen dans <code className="text-lime">data/hennen/</code>,
              lance <code className="text-lime">python -m cnn train</code> une fois, puis{" "}
              <code className="text-lime">npm run api</code>.
            </p>
            <Button variant="outline" className="mt-3" onClick={() => void refreshHealth()}>
              Revérifier
            </Button>
          </div>
        )}

        {ready && health && (
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
            <Stat label="Photos Hennen" value={String(health.n_hennen ?? "—")} />
            <Stat label="Pas Hennen" value={String(health.n_other ?? "—")} />
            <Stat
              label="Précision tête"
              value={
                health.metrics?.head_train_acc != null
                  ? `${Math.round(health.metrics.head_train_acc * 100)}%`
                  : "—"
              }
            />
            <Stat label="Backbone" value="FaceNet" />
            <Stat label="Mouche" value={health.fly_ready ? "prête" : "absente"} />
          </dl>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div className="flex flex-col gap-4">
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
                  alt="Aperçu de l'envoi"
                  className="max-h-80 w-full rounded-lg object-contain"
                />
              ) : (
                <div className="text-center">
                  <p className="font-display text-xl italic text-lime">Dépose une photo</p>
                  <p className="mt-1 text-sm text-ink-400">jpg / png · un visage, c'est mieux</p>
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
                {busy ? "Vérification…" : "C'est Hennen ?"}
              </Button>
              {file && (
                <Button variant="outline" size="lg" onClick={() => onPick(null)}>
                  Effacer
                </Button>
              )}
            </div>

            {error && (
              <p className="rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm">
                {error}
              </p>
            )}

            {result && (
              <div className="grid gap-3 sm:grid-cols-2">
                <VerdictCard
                  kicker="CNN · FaceNet"
                  label={result.label}
                  yes={result.is_hennen}
                  faceFound={result.face_found}
                  detail={result.detail}
                  meta={
                    result.face_found
                      ? `${Math.round(result.confidence * 100)} % · cosinus ${result.cosine.toFixed(3)}`
                      : null
                  }
                />
                {fly ? (
                  <VerdictCard
                    kicker="Avis de la mouche"
                    label={fly.label}
                    yes={fly.is_hennen}
                    faceFound={result.face_found}
                    detail="La mouche ne le voit pas. Elle le sent."
                    meta={`${Math.round(fly.confidence * 100)} % · Kenyon ${(fly.sparsity * 100).toFixed(1)} % allumés`}
                  />
                ) : (
                  <div className="rounded-2xl bg-white/5 px-6 py-6 ring-1 ring-white/10">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                      Avis de la mouche
                    </p>
                    <p className="mt-2 font-display text-2xl italic text-ink-200">Indisponible</p>
                    <p className="mt-2 text-sm text-ink-400">
                      Lance <code className="text-lime">python -m cnn fly_build</code> puis{" "}
                      <code className="text-lime">python -m cnn fly_train</code>.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-mint">
              Câblage : mouche réelle · Nez : FaceNet
            </p>
            <h2 className="font-display text-2xl italic sm:text-3xl">
              La mouche ne le voit pas. Elle le sent.
            </h2>
            <FlyBrain3D
              className="h-[min(72vh,38rem)]"
              lit={fly?.lit ?? []}
              yes={fly?.is_hennen ?? null}
            />
          </div>
        </div>

        <NetworkCanvas snapshot={vizSnap} scanning={busy} className="w-full" />
      </main>
    </div>
  );
}

function VerdictCard({
  kicker,
  label,
  yes,
  faceFound,
  detail,
  meta,
}: {
  kicker: string;
  label: string;
  yes: boolean;
  faceFound: boolean;
  detail: string;
  meta: string | null;
}) {
  const missing = label === "PAS DE VISAGE" || !faceFound;
  return (
    <div
      className={cn(
        "rounded-2xl px-6 py-6",
        missing ? "bg-white/10" : yes ? "bg-lime text-ink-950" : "bg-coral text-ink-50",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{kicker}</p>
      <p className="mt-1 text-xs uppercase tracking-wider opacity-70">{detail}</p>
      <p className="font-display text-2xl italic leading-tight sm:text-3xl">{label}</p>
      {meta && <p className="mt-2 text-sm opacity-80">{meta}</p>}
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
