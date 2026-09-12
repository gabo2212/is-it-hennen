import type { ReactNode } from "react";

export type Slide = {
  id: string;
  section: string;
  title: string;
  subtitle?: string;
  content: ReactNode;
  tone?: "hero" | "dark" | "accent" | "demo";
};

/** Drop your real meme pics in /public/pics/ and point src here */
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
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-lime/35 bg-[linear-gradient(135deg,rgba(200,245,66,0.06),transparent_55%)] px-3 text-center">
            <span className="font-display text-sm text-lime">Add pic</span>
            <span className="max-w-[10rem] text-[11px] leading-snug text-ink-400">
              {hint ?? "Drop image in /public/pics/"}
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
    title: "Same Dude?",
    subtitle: "A CNN that tells if a meme pic is your guy — or a random one.",
    tone: "hero",
    content: (
      <div className="mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
        <PicSlot
          label="Train on him"
          hint="meme face / your dude"
          src="/pics/dude-1.svg"
          badge="train"
          badgeTone="train"
        />
        <PicSlot
          label="New upload"
          hint="test image"
          src="/pics/query.svg"
          badge="?"
          badgeTone="train"
        />
        <PicSlot
          label="CNN says…"
          hint="SAME DUDE / NOPE"
          src="/pics/result-yes.svg"
          badge="SAME"
          badgeTone="yes"
        />
      </div>
    ),
  },
  {
    id: "cnn",
    section: "30-second CNN",
    title: "What’s a CNN?",
    content: (
      <div className="mt-6 grid max-w-4xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 text-lg text-ink-200">
          <p>
            A <span className="text-lime">Convolutional Neural Network</span>{" "}
            scans an image with small filters — edges → face parts → “this
            person.”
          </p>
          <ul className="space-y-2 text-base text-ink-300">
            <li>→ better than a normal net for photos</li>
            <li>→ learns looks from lots of examples</li>
            <li>→ outputs a yes/no (or a score)</li>
          </ul>
        </div>
        <div className="rounded-xl bg-black/40 p-5 font-mono text-sm leading-relaxed text-lime ring-1 ring-lime/25">
          <p className="mb-3 font-sans text-xs uppercase tracking-[0.2em] text-ink-400">
            Pipeline
          </p>
          {`pic → Conv → Pool → Conv → …
      → score
      → SAME DUDE / RANDOM`}
        </div>
      </div>
    ),
  },
  {
    id: "idea",
    section: "The project",
    title: "One person. Two answers.",
    tone: "accent",
    content: (
      <div className="mt-6 max-w-3xl space-y-5 text-ink-950/85">
        <p className="text-lg leading-relaxed sm:text-xl">
          Feed the model a pile of pics of <strong>the same dude</strong> (meme
          character, friend, celebrity face — whatever). Later you upload any
          photo and it answers:
        </p>
        <div className="flex flex-wrap gap-3">
          <span className="rounded-lg bg-ink-950 px-4 py-2 font-display text-lime">
            SAME DUDE
          </span>
          <span className="rounded-lg bg-ink-950/15 px-4 py-2 font-display text-ink-950">
            RANDOM DUDE
          </span>
        </div>
        <p className="text-sm text-ink-950/60">
          Binary person check — not “is it funny,” not 50 meme templates.
        </p>
      </div>
    ),
  },
  {
    id: "data",
    section: "How we train",
    title: "Pics in → labels out",
    content: (
      <div className="mt-6 space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <PicSlot
            label="Dude A"
            hint="swap for real meme"
            src="/pics/dude-1.svg"
            badge="YES"
            badgeTone="yes"
          />
          <PicSlot
            label="Dude A again"
            hint="different angle / meme"
            src="/pics/dude-2.svg"
            badge="YES"
            badgeTone="yes"
          />
          <PicSlot
            label="Random face"
            hint="someone else"
            src="/pics/random-1.svg"
            badge="NO"
            badgeTone="no"
          />
          <PicSlot
            label="Random face"
            hint="someone else"
            src="/pics/random-2.svg"
            badge="NO"
            badgeTone="no"
          />
        </div>
        <p className="max-w-2xl text-ink-300">
          Class 1 = your guy · Class 0 = everyone else. Aim for ~100+ pics of
          him + a mixed “not him” set. Drop real images into{" "}
          <code className="text-lime">public/pics/</code>.
        </p>
      </div>
    ),
  },
  {
    id: "demo",
    section: "Live idea",
    title: "Upload → verdict",
    tone: "demo",
    content: (
      <div className="mt-6 grid max-w-4xl items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <PicSlot
          label="You upload this"
          hint="new meme / selfie"
          src="/pics/query.svg"
        />
        <div className="flex justify-center font-display text-2xl text-lime">
          →
        </div>
        <div className="grid gap-3">
          <div className="rounded-xl bg-lime px-5 py-4 text-ink-950">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
              If it matches
            </p>
            <p className="font-display text-2xl">SAME DUDE · 94%</p>
          </div>
          <div className="rounded-xl bg-coral/90 px-5 py-4 text-ink-50">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
              If it doesn’t
            </p>
            <p className="font-display text-2xl">RANDOM DUDE · 88%</p>
          </div>
        </div>
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
            <span className="text-lime">1.</span> CNN = image brain (filters →
            face features)
          </li>
          <li>
            <span className="text-lime">2.</span> We train on{" "}
            <span className="text-lime">one person</span> vs random people
          </li>
          <li>
            <span className="text-lime">3.</span> New pic →{" "}
            <span className="text-lime">same dude / nope</span>
          </li>
        </ol>
        <p className="font-display text-3xl text-ink-50">Questions?</p>
      </div>
    ),
  },
];
