import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Slide = {
  id: string;
  section: string;
  title: string;
  subtitle?: string;
  /** One sentence to read out loud. Shown on the slide as a prompt. */
  say?: string;
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
  hideCaption = false,
  className,
}: {
  label: string;
  hint?: string;
  src?: string;
  badge?: string;
  badgeTone?: "yes" | "no" | "train";
  fit?: "cover" | "contain";
  hideCaption?: boolean;
  className?: string;
}) {
  const badgeClass =
    badgeTone === "yes"
      ? "bg-lime text-ink-950"
      : badgeTone === "no"
        ? "bg-coral text-ink-50"
        : "bg-white/15 text-ink-50";

  return (
    <figure
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl ring-1 ring-white/15",
        className,
      )}
    >
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
      {!hideCaption && (
        <figcaption className="shrink-0 bg-black/35 px-3 py-1.5 text-center text-xs text-ink-300">
          {label}
        </figcaption>
      )}
    </figure>
  );
}

function StackCard({ name, job }: { name: string; job: string }) {
  return (
    <div className="flex min-h-0 flex-col justify-start rounded-xl bg-white/5 px-4 py-4 ring-1 ring-white/10">
      <p className="font-display text-[clamp(1.05rem,2.2vh,1.35rem)] text-lime">{name}</p>
      <p className="mt-1.5 text-[clamp(0.8rem,1.5vh,0.95rem)] leading-snug text-ink-300">{job}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="flex min-h-0 gap-3 rounded-xl bg-white/5 px-4 py-2.5 ring-1 ring-white/10">
      <span className="font-display text-[clamp(1.4rem,3vh,2rem)] leading-none text-lime">{n}</span>
      <div className="min-w-0">
        <p className="font-display text-[clamp(1rem,2vh,1.2rem)] text-ink-50">{title}</p>
        <p className="mt-0.5 text-[clamp(0.8rem,1.45vh,0.95rem)] leading-snug text-ink-300">{body}</p>
      </div>
    </div>
  );
}

export const slides: Slide[] = [
  {
    id: "title",
    section: "Mini-projet",
    title: "Is it hennen?",
    subtitle: "One photo in. One answer out.",
    say: "This app looks at a picture and answers one question: is this Hennen, or not?",
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
          <span className="rounded-md bg-white/10 px-2 py-1 text-lime">memory file · 176 KB</span>
          <span className="rounded-md bg-white/10 px-2 py-1">taught once</span>
          <span className="rounded-md bg-white/10 px-2 py-1">never learns on new photos</span>
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
    id: "idea",
    section: "The idea",
    title: "We did not teach a computer to see",
    say: "Seeing faces is already a solved problem. We borrowed that skill, then taught it who Hennen is — once.",
    content: (
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <div className="flex min-h-0 flex-col gap-3">
          <div className="space-y-3 text-[clamp(0.9rem,1.7vh,1.1rem)] leading-snug text-ink-200">
            <p>
              Training a network to understand faces from zero would need millions of
              pictures and a huge computer. We skipped that.
            </p>
            <p>
              Other people already trained a face expert called{" "}
              <span className="text-lime">FaceNet</span> on about{" "}
              <span className="text-lime">3.3 million faces</span>. We download those
              brains and <span className="text-lime">freeze</span> them — we never
              change that part.
            </p>
            <p className="text-ink-300">
              Our job is tiny: show it 22 photos of Hennen, save a memory file, then
              only ask “him or not?”
            </p>
          </div>
          <div className="grid shrink-0 grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
              <p className="text-[10px] uppercase tracking-wider text-coral">Not this</p>
              <p className="mt-0.5 font-display text-sm">Build a face AI from scratch</p>
            </div>
            <div className="rounded-xl bg-lime/15 px-3 py-2 ring-1 ring-lime/40">
              <p className="text-[10px] uppercase tracking-wider text-lime">This</p>
              <p className="mt-0.5 font-display text-sm">Borrow an expert, teach one person</p>
            </div>
            <div className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
              <p className="text-[10px] uppercase tracking-wider text-ink-400">Result</p>
              <p className="mt-0.5 font-display text-sm">HENNEN or NOT HENNEN</p>
            </div>
          </div>
        </div>
        <div className="grid min-h-0 grid-rows-2 gap-3">
          <PicSlot label="Hennen" src="/slides/hennen-hoodie.jpg" badge="YES" />
          <PicSlot label="Hennen" src="/slides/hennen-metro.jpg" badge="YES" />
        </div>
      </div>
    ),
  },
  {
    id: "stack",
    section: "The stack",
    title: "Three programs, one job",
    say: "The website shows stuff. Python does the math. A small file is the memory of Hennen’s face.",
    content: (
      <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-2 gap-3">
        <StackCard
          name="The website"
          job="Next.js — the slides you are looking at, and the page where you drop a photo. It does not do the face math."
        />
        <PicSlot
          label="One of the 22"
          src="/slides/hennen-pool.jpg"
          badge="Hennen"
        />
        <StackCard
          name="The brain"
          job="Python + FastAPI — finds the face, turns it into numbers, compares it to Hennen. This is the CNN part."
        />
        <PicSlot
          label="Face finder crops this"
          src="/slides/hennen-dashcam.jpg"
          badge="MTCNN"
          badgeTone="train"
        />
        <StackCard
          name="The memory"
          job="hennen.pt — a 176 KB file. It holds Hennen’s average fingerprint plus a tiny extra network we trained once."
        />
        <PicSlot
          label="FaceNet reads this"
          src="/slides/hennen-close.jpg"
          badge="512 numbers"
          badgeTone="train"
        />
      </div>
    ),
  },
  {
    id: "flow",
    section: "How it works",
    title: "What happens to one photo",
    say: "Find the face. Turn it into a fingerprint. Compare it to Hennen’s saved one. Then say yes or no.",
    content: (
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="grid min-h-0 gap-2">
          <Step
            n="1"
            title="Find the face"
            body="MTCNN looks through the photo and cuts out the head. Car buttons, a pool, a crowd — all thrown away."
          />
          <Step
            n="2"
            title="Turn it into a fingerprint"
            body="FaceNet reads the crop and writes 512 numbers. Same person → similar numbers. Different person → different numbers."
          />
          <Step
            n="3"
            title="Compare to Hennen"
            body="We already saved Hennen’s average fingerprint from the 22 photos. We measure how close this new one is (cosine similarity)."
          />
          <Step
            n="4"
            title="The safety rule"
            body="If the match is under 0.61, it is NOT Hennen. Period. The tiny extra network is not allowed to talk us into a yes."
          />
          <Step
            n="5"
            title="Answer"
            body="HENNEN or NOT HENNEN. The live picture later is just a movie of these steps — it is not training."
          />
        </div>
        <div className="grid min-h-0 grid-rows-3 gap-2.5">
          <PicSlot label="1. Find this face" src="/slides/hennen-dashcam.jpg" badge="crop" badgeTone="train" />
          <PicSlot label="2. Fingerprint" src="/slides/hennen-close.jpg" badge="512-d" badgeTone="train" />
          <PicSlot label="5. HENNEN" src="/slides/hennen-mic.jpg" badge="YES" />
        </div>
      </div>
    ),
  },
  {
    id: "once",
    section: "Training",
    title: "Teach once. Then lock it.",
    say: "We showed it 22 photos of Hennen, hit train once, and saved a file. New photos never change the model.",
    tone: "accent",
    content: (
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <div className="flex min-h-0 flex-col gap-3">
          <div className="space-y-3 text-[clamp(0.88rem,1.65vh,1.05rem)] leading-snug text-ink-200">
            <p>
              Folder of pictures → one command → one file. That is the whole training
              story.
            </p>
            <p>
              18 photos for teaching, 4 held back as a test. The test Hennen shots all
              came back <span className="text-lime">HENNEN (4/4)</span>. We also showed
              it 94 random other faces so it knows what “not him” looks like.
            </p>
            <p className="text-ink-300">
              After that, detect only <span className="text-lime">loads</span> the file
              and does a forward pass — like looking up a name, not studying.
            </p>
          </div>
          <ul className="grid min-h-0 grid-cols-2 gap-2 text-[clamp(0.8rem,1.45vh,0.95rem)]">
            {[
              ["22 photos", "messy real pics"],
              ["Train once", "→ hennen.pt"],
              ["176 KB", "fits on a USB"],
              ["Detect never trains", "drop a photo, stop"],
            ].map(([k, v]) => (
              <li key={k} className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
                <span className="text-lime">{k}</span>
                <span className="mt-0.5 block text-ink-300">{v}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid min-h-0 grid-cols-2 grid-rows-2 gap-2.5">
          <PicSlot label="Train" src="/slides/hennen-hoodie.jpg" badge="YES" />
          <PicSlot label="Train" src="/slides/hennen-metro.jpg" badge="YES" />
          <PicSlot label="Train" src="/slides/hennen-pool.jpg" badge="YES" />
          <PicSlot label="Hold-out" src="/slides/hennen-mic.jpg" badge="4/4" badgeTone="train" />
        </div>
      </div>
    ),
  },
  {
    id: "data",
    section: "The memory",
    title: "Hennen’s fingerprint vs anyone else",
    say: "Green is Hennen. Pink is a stranger. Each face becomes 512 numbers. We keep Hennen’s average.",
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
        <p className="shrink-0 text-[clamp(0.8rem,1.45vh,0.95rem)] leading-snug text-ink-300">
          Why the safety rule exists: a stranger once scored 57% Hennen because the
          tiny add-on was overconfident. His fingerprint was only 0.30 vs the 0.61
          cut — so now fingerprint wins. If it is not close, we say{" "}
          <span className="text-coral">NOT HENNEN</span>.
        </p>
      </div>
    ),
  },
  {
    id: "live",
    section: "Detector",
    title: "The live picture is a movie, not a teacher",
    say: "This screen is the same five steps drawn live. Pretty wires. No learning is happening.",
    tone: "demo",
    content: (
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="min-h-0 flex-1">
          <PicSlot
            fit="contain"
            label="Crop → first FaceNet layer → 512 fingerprint → 64 hidden → HENNEN 89%"
            src="/slides/detect-live.jpg"
            badge="looking, not learning"
            badgeTone="train"
          />
        </div>
        <p className="shrink-0 text-[clamp(0.8rem,1.4vh,0.9rem)] text-ink-400">
          Website (Next.js) draws this. Python already finished the answer and sent
          the numbers over. Refreshing the page does not retrain anything.
        </p>
      </div>
    ),
  },
  {
    id: "close",
    section: "That’s it",
    title: "What to remember if they ask",
    say: "Borrowed a face expert. Taught it Hennen once. Locked the file. Now it only answers him or not.",
    tone: "hero",
    content: (
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
        <div className="flex min-h-0 flex-col gap-3">
          <ol className="space-y-2.5 text-[clamp(0.9rem,1.7vh,1.1rem)] text-ink-200">
            <li>
              <span className="text-lime">1.</span> FaceNet already knows faces. We
              froze it. We do not train that CNN.
            </li>
            <li>
              <span className="text-lime">2.</span> We trained a tiny add-on on 22
              messy photos and saved <span className="text-lime">hennen.pt</span>{" "}
              (176 KB).
            </li>
            <li>
              <span className="text-lime">3.</span> A new photo is: find face →
              fingerprint → compare → HENNEN / NOT HENNEN.
            </li>
            <li>
              <span className="text-lime">4.</span> If the fingerprint is not close
              enough, the answer is no. The add-on cannot cheat.
            </li>
          </ol>
          <div className="rounded-xl bg-white/5 px-4 py-3 text-[clamp(0.8rem,1.45vh,0.95rem)] leading-snug text-ink-300 ring-1 ring-white/10">
            <p className="text-[11px] uppercase tracking-wider text-lime">If someone asks “CNN?”</p>
            <p className="mt-1 text-ink-50">
              Convolutional neural net = a network that looks at pixels in small
              patches. FaceNet is that. Ours is a frozen copy plus a tiny extra
              layer.
            </p>
          </div>
          <a
            href="/detect"
            className="inline-flex w-fit rounded-lg bg-lime px-4 py-2 font-display italic text-ink-950"
          >
            Try a photo
          </a>
        </div>
        <div className="grid min-h-0 grid-cols-2 grid-rows-2 gap-2.5">
          <PicSlot label="Hennen" src="/slides/hennen-pool.jpg" badge="YES" />
          <PicSlot label="Hennen" src="/slides/hennen-mic.jpg" badge="YES" />
          <PicSlot label="Hennen" src="/slides/hennen-hoodie.jpg" badge="YES" />
          <PicSlot label="Hennen" src="/slides/hennen-metro.jpg" badge="YES" />
        </div>
      </div>
    ),
  },
];
