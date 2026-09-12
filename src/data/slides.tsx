import type { ReactNode } from "react";

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
}: {
  label: string;
  hint?: string;
  src?: string;
  badge?: string;
  badgeTone?: "yes" | "no" | "train";
}) {
  const badgeClass =
    badgeTone === "yes"
      ? "bg-lime text-ink-950"
      : badgeTone === "no"
        ? "bg-coral text-ink-50"
        : "bg-white/15 text-ink-50";

  return (
    <figure className="relative flex flex-col overflow-hidden rounded-xl ring-1 ring-white/15">
      <div className="relative aspect-[4/3] bg-ink-900">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={label} className="h-full w-full object-cover" />
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
      <figcaption className="bg-black/35 px-3 py-2 text-center text-xs text-ink-300">
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
    subtitle: "A face CNN. Trained once. Then it only answers the question.",
    tone: "hero",
    content: (
      <div className="mt-8 space-y-6">
        <div className="grid max-w-4xl gap-4 sm:grid-cols-3">
          <PicSlot
            label="20–30 Hennen pics"
            src="/pics/dude-1.svg"
            badge="once"
            badgeTone="train"
          />
          <PicSlot
            label="Saved model"
            src="/pics/result-yes.svg"
            badge="hennen.pt"
            badgeTone="yes"
          />
          <PicSlot
            label="New photo → verdict"
            src="/pics/query.svg"
            badge="no train"
            badgeTone="train"
          />
        </div>
        <a
          href="/detect"
          className="inline-flex rounded-lg bg-lime px-4 py-2 font-display text-ink-950"
        >
          Open detector
        </a>
      </div>
    ),
  },
  {
    id: "cnn",
    section: "The CNN",
    title: "FaceNet, already trained",
    content: (
      <div className="mt-6 grid max-w-4xl gap-8 lg:grid-cols-2">
        <div className="space-y-4 text-lg text-ink-200">
          <p>
            We use <span className="text-lime">Inception-ResNet FaceNet</span>{" "}
            pretrained on <span className="text-lime">VGGFace2</span> (~3.3M
            face photos). Those millions of weights stay frozen.
          </p>
          <p className="text-base text-ink-300">
            Same recipe on a public identity (25 photos, held-out test):{" "}
            <span className="text-lime">91% cosine</span>,{" "}
            <span className="text-lime">100% tiny head</span>. Watch it live:{" "}
            <span className="text-lime">python -m cnn viz</span> — neurons glow
            with activations, lines are weights (blue +, coral −).
          </p>
        </div>
        <div className="rounded-xl bg-black/40 p-5 font-mono text-sm leading-relaxed text-lime ring-1 ring-lime/25">
          {`photo
  → MTCNN (crop face)
  → FaceNet CNN (512-d)
  → saved Hennen gallery
  → HENNEN / NOT HENNEN`}
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
      <div className="mt-6 max-w-3xl space-y-4 text-lg text-ink-950/85">
        <p>
          Drop ~<strong>20–30 photos of Hennen</strong> in{" "}
          <code>data/hennen/</code>. Run <code>python -m cnn train</code>{" "}
          <strong>once</strong>. That writes <code>models/hennen.pt</code>.
        </p>
        <p>
          After that, the detector only <strong>loads</strong> the file. New
          uploads are inference — no fitting, no epochs, no “train” button.
        </p>
        <p className="text-sm text-ink-950/60">
          Need variety: different angles, lighting, memes. Not 30 copies of the
          same screenshot.
        </p>
      </div>
    ),
  },
  {
    id: "data",
    section: "How we lock him in",
    title: "Gallery + tiny head",
    content: (
      <div className="mt-6 space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <PicSlot
            label="Hennen"
            src="/pics/dude-1.svg"
            badge="YES"
            badgeTone="yes"
          />
          <PicSlot
            label="Hennen"
            src="/pics/dude-2.svg"
            badge="YES"
            badgeTone="yes"
          />
          <PicSlot
            label="Random"
            src="/pics/random-1.svg"
            badge="NO"
            badgeTone="no"
          />
          <PicSlot
            label="Random"
            src="/pics/random-2.svg"
            badge="NO"
            badgeTone="no"
          />
        </div>
        <p className="max-w-2xl text-ink-300">
          Each face becomes a 512-number fingerprint. We save Hennen’s average
          fingerprint plus a small classifier trained on those fingerprints
          (and public “not him” faces). Flip-test at detect time for a bit more
          accuracy.
        </p>
      </div>
    ),
  },
  {
    id: "card",
    section: "Model card",
    title: "What’s in the box",
    tone: "demo",
    content: (
      <div className="mt-6 grid max-w-4xl gap-4 sm:grid-cols-2">
        {[
          ["Backbone", "Inception-ResNet FaceNet · VGGFace2"],
          ["Input", "Aligned face 160×160"],
          ["Output", "HENNEN / NOT HENNEN + confidence"],
          ["Train cost", "Once · ~20–30 Hennen photos"],
          ["Detect cost", "Load .pt · one forward pass"],
          ["Live viz · 60 FPS", "python -m cnn viz  (Pygame neurons + weights)"],
          ["LFW check · 25 shots", "91% cosine · 100% saved head"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
            <p className="text-xs uppercase tracking-wider text-ink-400">{k}</p>
            <p className="mt-1 font-display text-lg text-ink-50">{v}</p>
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
      <div className="mt-8 max-w-2xl space-y-5 text-lg text-ink-200">
        <ol className="space-y-3">
          <li>
            <span className="text-lime">1.</span> CNN reads the face (FaceNet,
            already trained)
          </li>
          <li>
            <span className="text-lime">2.</span> We lock Hennen in once from
            20–30 pics
          </li>
          <li>
            <span className="text-lime">3.</span> After that it’s only{" "}
            <span className="text-lime">Is it hennen?</span>
          </li>
        </ol>
        <a
          href="/detect"
          className="inline-flex rounded-lg bg-lime px-4 py-2 font-display text-ink-950"
        >
          Try a photo
        </a>
      </div>
    ),
  },
];
