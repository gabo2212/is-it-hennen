import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Slide = {
  id: string;
  section: string;
  title: string;
  subtitle?: string;
  content: ReactNode;
  tone?: "hero" | "dark" | "accent" | "demo";
};

function PicSlot({
  label,
  hint,
  src,
  badge,
  badgeTone = "yes",
  fit = "cover",
}: {
  label: string;
  hint?: string;
  src?: string;
  badge?: string;
  badgeTone?: "yes" | "no" | "train";
  fit?: "cover" | "contain";
}) {
  const badgeClass =
    badgeTone === "yes"
      ? "bg-lime text-ink-950"
      : badgeTone === "no"
        ? "bg-coral text-ink-50"
        : "bg-white/15 text-ink-50";

  return (
    <figure className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl ring-1 ring-white/15">
      <div className="relative min-h-0 flex-1 bg-ink-900">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={label}
            className={cn(
              "absolute inset-0 h-full w-full",
              fit === "contain" ? "object-contain object-center" : "object-cover object-center",
            )}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-lime/35 px-3 text-center">
            <span className="font-display text-sm text-lime">Add pic</span>
            <span className="max-w-[10rem] text-[11px] leading-snug text-ink-400">
              {hint ?? "data/hennen/"}
            </span>
          </div>
        )}
        {badge && (
          <span
            className={`absolute top-2 right-2 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badgeClass}`}
          >
            {badge}
          </span>
        )}
      </div>
      <figcaption className="shrink-0 bg-black/35 px-3 py-1.5 text-center text-xs text-ink-300">
        {label}
      </figcaption>
    </figure>
  );
}

export const slides: Slide[] = [
  {
    id: "title",
    section: "Mini-projet",
    title: "Is it hennen?",
    subtitle:
      "22 real photos. FaceNet frozen. Tiny head trained once. Then it only answers HENNEN / NOT HENNEN.",
    tone: "hero",
    content: (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-3">
          <PicSlot
            label="Dashcam, memes, metro…"
            src="/slides/hennen-dashcam.jpg"
            badge="22 pics"
            badgeTone="train"
          />
          <PicSlot
            label="Rally mic"
            src="/slides/hennen-mic.jpg"
            badge="YES"
            badgeTone="yes"
          />
          <PicSlot
            label="Pool selfie"
            src="/slides/hennen-pool.jpg"
            badge="YES"
            badgeTone="yes"
          />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-ink-400">
          <span className="rounded-md bg-white/10 px-2 py-1 text-lime">hennen.pt · 176 KB</span>
          <span className="rounded-md bg-white/10 px-2 py-1">18 train / 4 hold-out</span>
          <span className="rounded-md bg-white/10 px-2 py-1">cosine cut 0.61</span>
          <span className="rounded-md bg-white/10 px-2 py-1">detect never trains</span>
          <a
            href="/detect"
            className="ml-auto inline-flex rounded-lg bg-lime px-3 py-1.5 font-display italic text-ink-950"
          >
            Open detector
          </a>
        </div>
      </div>
    ),
  },
  {
    id: "cnn",
    section: "The CNN",
    title: "FaceNet, already trained",
    content: (
      <div className="grid min-h-0 flex-1 gap-5 overflow-hidden lg:grid-cols-2">
        <div className="space-y-3 text-[clamp(0.95rem,1.8vh,1.125rem)] leading-snug text-ink-200">
          <p>
            Backbone is <span className="text-lime">Inception-ResNet FaceNet</span>{" "}
            on <span className="text-lime">VGGFace2</span> (~3.3M faces). Those
            weights stay frozen. We only fit a tiny 512→64→2 head on Hennen’s
            fingerprints.
          </p>
          <p className="text-ink-300">
            MTCNN crops messy shots (car screen, crowd, subway). Identity is
            the FaceNet cosine vs the saved gallery — cut{" "}
            <span className="text-lime">0.61</span>. The head cannot override a
            miss (that 57% false Hennen).
          </p>
        </div>
        <div className="flex min-h-0 items-stretch">
          <pre className="h-full w-full overflow-hidden rounded-xl bg-black/40 p-5 font-mono text-[clamp(0.75rem,1.5vh,0.95rem)] leading-relaxed text-lime ring-1 ring-lime/25">
            {`photo
  → MTCNN crop / align
  → FaceNet conv1 (live maps)
  → 512-d embedding
  → cosine vs Hennen proto
  → tiny head 64 → 2
  → HENNEN / NOT HENNEN`}
          </pre>
        </div>
      </div>
    ),
  },
  {
    id: "once",
    section: "Training",
    title: "Train once. Never again.",
    tone: "accent",
    content: (
      <div className="max-w-3xl space-y-3 text-[clamp(0.95rem,1.9vh,1.15rem)] leading-snug text-ink-200">
        <p>
          We put <strong>22 photos of Hennen</strong> in{" "}
          <code className="text-lime">data/hennen/</code> and ran{" "}
          <code className="text-lime">python -m cnn train</code>{" "}
          <strong>once</strong>. That wrote <code className="text-lime">models/hennen.pt</code>{" "}
          (176 KB).
        </p>
        <ul className="space-y-1 text-ink-300">
          <li>18 train / 4 hold-out</li>
          <li>Hold-out Hennen: <span className="text-lime">4/4</span></li>
          <li>Gallery cosine F1 ≈ 0.94 · tiny-head train acc 100%</li>
          <li>94 public “not him” faces for the head</li>
        </ul>
        <p>
          After that, <code>python -m cnn serve</code> only <strong>loads</strong>{" "}
          the file. Dropping a photo on /detect is a forward pass — no fitting.
        </p>
      </div>
    ),
  },
  {
    id: "data",
    section: "How we lock him in",
    title: "Gallery + tiny head",
    content: (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-2 gap-2.5">
          <PicSlot label="Hennen" src="/slides/hennen-close.jpg" badge="YES" badgeTone="yes" />
          <PicSlot label="Hennen" src="/slides/hennen-hoodie.jpg" badge="YES" badgeTone="yes" />
          <PicSlot label="Hennen" src="/slides/hennen-metro.jpg" badge="YES" badgeTone="yes" />
          <PicSlot label="Hennen" src="/slides/hennen-mic.jpg" badge="YES" badgeTone="yes" />
          <PicSlot label="Random" src="/slides/not-longhair.jpg" badge="NO" badgeTone="no" />
          <PicSlot label="Random" src="/slides/not-bw.jpg" badge="NO" badgeTone="no" />
        </div>
        <p className="shrink-0 max-w-3xl text-[clamp(0.8rem,1.5vh,1rem)] leading-snug text-ink-300">
          Each face is a 512-number fingerprint. We save Hennen’s average
          vector plus the tiny classifier. At detect time we flip-test the
          crop. If cosine is under 0.61, it is <span className="text-coral">NOT HENNEN</span> —
          even if the head is loud.
        </p>
      </div>
    ),
  },
  {
    id: "live",
    section: "Detector",
    title: "Live net on /detect",
    tone: "demo",
    content: (
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="min-h-0 flex-1">
          <PicSlot
            fit="contain"
            label="Same photo: MTCNN crop → conv1 → 512-d → 64 hidden → HENNEN 89%"
            src="/slides/detect-live.jpg"
            badge="inference"
            badgeTone="train"
          />
        </div>
        <p className="shrink-0 max-w-3xl text-xs text-ink-400">
          Stats on that page are the trained artifact: 18 Hennen shots, 94
          others, 100% head acc, FaceNet backbone. The canvas is visualization
          — it does not train.
        </p>
      </div>
    ),
  },
  {
    id: "card",
    section: "Model card",
    title: "What’s in the box",
    content: (
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2.5 overflow-hidden sm:grid-cols-2">
        {[
          ["Backbone", "FaceNet Inception-ResNet · VGGFace2 · frozen"],
          ["Input", "MTCNN-aligned face 160×160"],
          ["Tiny head", "Linear 512 → 64 → 2"],
          ["Artifact", "models/hennen.pt · 176 KB"],
          ["Train set", "22 Hennen pics · 18 / 4 split"],
          ["Hold-out", "Hennen 4/4 · cosine F1 0.94"],
          ["Identity cut", "cosine ≥ 0.61 vs gallery proto"],
          ["Detect", "Load .pt · one forward pass · /detect"],
        ].map(([k, v]) => (
          <div key={k} className="flex min-h-0 flex-col justify-center rounded-xl bg-white/5 px-4 py-2 ring-1 ring-white/10">
            <p className="text-[11px] uppercase tracking-wider text-ink-400">{k}</p>
            <p className="mt-0.5 font-display text-[clamp(0.95rem,2vh,1.2rem)] leading-snug text-ink-50">
              {v}
            </p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "close",
    section: "That’s it",
    title: "Easy takeaways",
    tone: "hero",
    content: (
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-5">
        <ol className="max-w-2xl space-y-3 text-[clamp(1rem,2.1vh,1.25rem)] text-ink-200">
          <li>
            <span className="text-lime">1.</span> FaceNet already reads the face.
            We don’t train that CNN.
          </li>
          <li>
            <span className="text-lime">2.</span> We locked Hennen in once from
            22 messy pics → <span className="text-lime">hennen.pt</span>
          </li>
          <li>
            <span className="text-lime">3.</span> After that it’s only{" "}
            <span className="text-lime">Is it hennen?</span> — cosine vs the
            gallery, live net on the side.
          </li>
        </ol>
        <a
          href="/detect"
          className="inline-flex w-fit rounded-lg bg-lime px-4 py-2 font-display italic text-ink-950"
        >
          Try a photo
        </a>
      </div>
    ),
  },
];
