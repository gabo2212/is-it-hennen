import type { ReactNode } from "react";

export type Slide = {
  id: string;
  section: string;
  title: string;
  subtitle?: string;
  content: ReactNode;
  tone?: "hero" | "dark" | "accent" | "demo";
};

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-lime/30 bg-lime/10 px-2.5 py-1 text-xs font-medium tracking-wide text-lime">
      {children}
    </span>
  );
}

function GridList({ items }: { items: { label: string; text: string }[] }) {
  return (
    <ul className="mt-6 grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item.label}
          className="border-l-2 border-lime/60 pl-4"
        >
          <p className="font-display text-lg text-ink-50">{item.label}</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-300">{item.text}</p>
        </li>
      ))}
    </ul>
  );
}

export const slides: Slide[] = [
  {
    id: "title",
    section: "Entrevue ML",
    title: "CNN",
    subtitle: "Convolutional Neural Networks — from pixels to predictions",
    tone: "hero",
    content: (
      <div className="mt-8 max-w-2xl space-y-6">
        <p className="text-lg leading-relaxed text-ink-200 sm:text-xl">
          Interview briefing + mini-project pitch:{" "}
          <span className="text-lime">MemeNet</span> — a CNN that recognizes
          viral meme templates from images.
        </p>
        <div className="flex flex-wrap gap-2">
          <Pill>Deep Learning</Pill>
          <Pill>Computer Vision</Pill>
          <Pill>Mini-projet</Pill>
        </div>
        <p className="text-sm text-ink-400">
          Use ← → or click controls · Press F for fullscreen
        </p>
      </div>
    ),
  },
  {
    id: "agenda",
    section: "Roadmap",
    title: "What we’ll cover",
    content: (
      <ol className="mt-8 space-y-4 text-lg text-ink-200">
        {[
          "Why CNNs beat plain neural nets on images",
          "Core layers: convolution, activation, pooling, dense",
          "How training actually works",
          "Interview-ready talking points",
          "Mini-project: build your own CNN on meme pics",
        ].map((item, i) => (
          <li key={item} className="flex gap-4">
            <span className="font-display text-2xl text-lime tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="pt-1">{item}</span>
          </li>
        ))}
      </ol>
    ),
  },
  {
    id: "what",
    section: "Concept",
    title: "What is a CNN?",
    content: (
      <div className="mt-6 space-y-6">
        <p className="max-w-3xl text-lg leading-relaxed text-ink-200">
          A Convolutional Neural Network is a deep learning model built for
          grid-like data (images). Instead of flattening every pixel into one
          giant vector, it scans local patches with learnable filters and
          builds a hierarchy of visual features.
        </p>
        <GridList
          items={[
            {
              label: "Low-level",
              text: "Edges, colors, textures — early layers",
            },
            {
              label: "Mid-level",
              text: "Shapes, faces, text blocks — middle layers",
            },
            {
              label: "High-level",
              text: "Objects, scenes, meme layouts — deep layers",
            },
            {
              label: "Output",
              text: "Class scores (e.g. Drake / Distracted Boyfriend)",
            },
          ]}
        />
      </div>
    ),
  },
  {
    id: "why",
    section: "Motivation",
    title: "Why not a normal neural net?",
    content: (
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <p className="text-lg leading-relaxed text-ink-200">
            A fully connected network on a 224×224 RGB image would need millions
            of weights just for the first layer — and it would ignore that nearby
            pixels are related.
          </p>
          <p className="text-ink-300">
            CNNs fix that with three inductive biases that match vision:
          </p>
        </div>
        <ul className="space-y-5">
          {[
            {
              t: "Local connectivity",
              d: "Each neuron looks at a small patch, not the whole image.",
            },
            {
              t: "Weight sharing",
              d: "The same filter slides everywhere — one edge detector works on the whole photo.",
            },
            {
              t: "Translation equivariance",
              d: "A cat on the left still looks like a cat on the right.",
            },
          ].map((x) => (
            <li key={x.t} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="font-display text-xl text-lime">{x.t}</p>
              <p className="mt-1 text-sm text-ink-300">{x.d}</p>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "conv",
    section: "Architecture",
    title: "Convolution layer",
    content: (
      <div className="mt-6 space-y-6">
        <p className="max-w-3xl text-lg text-ink-200">
          A filter (kernel) slides across the image. At each position it
          computes a weighted sum → one value in a feature map. Stack many
          filters → many feature maps.
        </p>
        <div className="overflow-x-auto rounded-xl bg-black/40 p-4 font-mono text-sm text-lime ring-1 ring-lime/20 sm:p-6">
          <pre className="whitespace-pre leading-relaxed">{`output[i,j] = Σ  input[i+u, j+v] × kernel[u,v]
                 u,v

Hyperparams you must know in interviews:
  • kernel size  (3×3, 5×5…)
  • stride       (how far the filter jumps)
  • padding      (same / valid)
  • # of filters (output channels)`}</pre>
        </div>
      </div>
    ),
  },
  {
    id: "pool-act",
    section: "Architecture",
    title: "Activation + pooling",
    content: (
      <GridList
        items={[
          {
            label: "ReLU",
            text: "max(0, x). Cheap non-linearity; kills dying-ReLU risk with careful init / LeakyReLU.",
          },
          {
            label: "Max pooling",
            text: "Keep the strongest activation in a 2×2 window. Shrinks maps, adds slight shift tolerance.",
          },
          {
            label: "Avg / GAP",
            text: "Global Average Pooling replaces huge dense layers in modern nets (ResNet-style).",
          },
          {
            label: "BatchNorm",
            text: "Stabilizes training by normalizing activations; lets you use higher learning rates.",
          },
        ]}
      />
    ),
  },
  {
    id: "pipeline",
    section: "Architecture",
    title: "Typical CNN pipeline",
    content: (
      <div className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {[
            "Image",
            "Conv + ReLU",
            "Pool",
            "Conv + ReLU",
            "Pool",
            "Flatten / GAP",
            "Dense",
            "Softmax",
          ].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-3">
              <div className="rounded-lg bg-lime px-3 py-2 font-display text-sm text-ink-950">
                {step}
              </div>
              {i < arr.length - 1 && (
                <span className="hidden text-ink-500 sm:inline">→</span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-2xl text-ink-300">
          Early blocks extract local patterns. Later blocks combine them. The
          classifier head turns the final embedding into class probabilities.
        </p>
      </div>
    ),
  },
  {
    id: "train",
    section: "Training",
    title: "How a CNN learns",
    content: (
      <ol className="mt-8 space-y-5">
        {[
          {
            t: "Forward pass",
            d: "Image → predicted class probabilities.",
          },
          {
            t: "Loss",
            d: "Cross-entropy compares prediction vs true label.",
          },
          {
            t: "Backpropagation",
            d: "Gradients flow backward; shared filters get updates from every spatial location.",
          },
          {
            t: "Optimizer",
            d: "Adam / SGD+momentum step the weights. Watch train vs val curves for overfitting.",
          },
        ].map((s, i) => (
          <li key={s.t} className="grid gap-1 sm:grid-cols-[4rem_1fr]">
            <span className="font-display text-lime">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <p className="font-display text-xl text-ink-50">{s.t}</p>
              <p className="text-ink-300">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
    ),
  },
  {
    id: "archs",
    section: "History",
    title: "Architectures worth naming",
    content: (
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead>
            <tr className="border-b border-white/15 text-ink-400">
              <th className="py-3 pr-4 font-medium">Model</th>
              <th className="py-3 pr-4 font-medium">Idea</th>
              <th className="py-3 font-medium">Why it matters</th>
            </tr>
          </thead>
          <tbody className="text-ink-200">
            {[
              ["LeNet", "First practical CNN", "Digits / classic baseline"],
              ["AlexNet", "Deep + GPU + ReLU", "2012 ImageNet breakthrough"],
              ["VGG", "Stacks of 3×3 convs", "Simple transfer-learning backbone"],
              ["ResNet", "Skip connections", "Train 100+ layers without collapse"],
              ["EfficientNet", "Compound scaling", "Accuracy vs compute tradeoff"],
            ].map(([a, b, c]) => (
              <tr key={a} className="border-b border-white/10">
                <td className="py-3 pr-4 font-display text-lime">{a}</td>
                <td className="py-3 pr-4">{b}</td>
                <td className="py-3">{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: "interview",
    section: "Entrevue",
    title: "Questions you’re likely to get",
    content: (
      <ul className="mt-6 space-y-4">
        {[
          "Why parameter sharing? → fewer weights, better generalization on vision.",
          "Stride vs pooling — both downsample; pooling is fixed, stride is learned via filter placement.",
          "What is vanishing gradient? How do ResNets help?",
          "When transfer learning? → small dataset, similar domain to ImageNet.",
          "CNN vs Vision Transformer? → CNN wins with limited data; ViT needs scale.",
        ].map((q) => (
          <li
            key={q}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-ink-200"
          >
            {q}
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: "meme-idea",
    section: "Mini-projet",
    title: "Yes — you can build a CNN on meme pics",
    tone: "accent",
    content: (
      <div className="mt-6 max-w-3xl space-y-5">
        <p className="text-lg leading-relaxed text-ink-950/80">
          Memes are perfect CNN fuel: strong visual layouts, repeated templates,
          and tons of free images online. The trick is picking a{" "}
          <strong>clear supervised task</strong> — not “make it funny.”
        </p>
        <p className="text-xl font-display text-ink-950">
          Pitch: <span className="underline decoration-ink-950/30">MemeNet</span>{" "}
          — classify which viral template a meme uses.
        </p>
        <p className="text-ink-950/70">
          Examples: Drake Hotline Bling · Distracted Boyfriend · Expanding Brain ·
          Woman Yelling at a Cat · This Is Fine · Surprised Pikachu…
        </p>
      </div>
    ),
  },
  {
    id: "why-memenet",
    section: "Mini-projet",
    title: "What MemeNet actually does",
    content: (
      <GridList
        items={[
          {
            label: "Input",
            text: "A meme image (JPG/PNG), resized to 224×224.",
          },
          {
            label: "Output",
            text: "Template class + confidence (softmax).",
          },
          {
            label: "Why it works",
            text: "Templates share layout, characters, and composition — CNN heaven.",
          },
          {
            label: "Demo wow",
            text: "Upload any meme → instant “this is a Drake format” prediction.",
          },
        ]}
      />
    ),
  },
  {
    id: "alt-ideas",
    section: "Mini-projet",
    title: "Other meme-CNN ideas (ranked)",
    content: (
      <div className="mt-6 space-y-4">
        {[
          {
            rank: "Best for TP",
            title: "Template classifier (MemeNet)",
            why: "Clear labels, visual patterns, easy metrics (accuracy / F1).",
          },
          {
            rank: "Cool+",
            title: "Meme vs not-meme detector",
            why: "Binary classification; good starter if dataset is messy.",
          },
          {
            rank: "Harder",
            title: "Emotion / reaction of the face in the meme",
            why: "Closer to FER datasets; labels can be noisy.",
          },
          {
            rank: "Avoid for now",
            title: "“Is this funny?” scorer",
            why: "Humor is subjective — bad ground truth for a short mini-project.",
          },
        ].map((x) => (
          <div
            key={x.title}
            className="grid gap-2 border-b border-white/10 pb-4 sm:grid-cols-[8rem_1fr]"
          >
            <span className="text-sm font-medium uppercase tracking-wider text-lime">
              {x.rank}
            </span>
            <div>
              <p className="font-display text-lg text-ink-50">{x.title}</p>
              <p className="text-sm text-ink-300">{x.why}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "dataset",
    section: "Plan",
    title: "Dataset plan (realistic for a TP)",
    content: (
      <ul className="mt-6 space-y-4 text-ink-200">
        <li>
          <span className="text-lime">8–12 templates</span> · ~150–300 images
          each (scraped / Kaggle meme datasets / Imgflip).
        </li>
        <li>
          Split <span className="text-lime">70 / 15 / 15</span> train · val ·
          test. Keep templates balanced.
        </li>
        <li>
          Augment: flip, slight crop, color jitter, JPEG noise — memes are
          compressed and messy in the wild.
        </li>
        <li>
          Start with <span className="text-lime">transfer learning</span>{" "}
          (ResNet18 / MobileNet) — fine-tune the head, then unfreeze late
          blocks.
        </li>
      </ul>
    ),
  },
  {
    id: "arch-meme",
    section: "Plan",
    title: "Suggested model",
    tone: "demo",
    content: (
      <div className="mt-6 space-y-6">
        <div className="overflow-x-auto rounded-xl bg-ink-950/80 p-5 font-mono text-xs leading-relaxed text-lime sm:text-sm">
          <pre>{`# PyTorch sketch
backbone = resnet18(weights=IMAGENET1K_V1)
backbone.fc = nn.Linear(512, num_templates)

# or a tiny CNN from scratch for the interview story:
Conv(3→32) → ReLU → MaxPool
Conv(32→64) → ReLU → MaxPool
Conv(64→128) → ReLU → AdaptiveAvgPool
Linear(128→num_templates)`}</pre>
        </div>
        <p className="max-w-2xl text-ink-200">
          For the entrevue: explain you could train from scratch to prove you
          understand layers, but transfer learning is the smart move when the
          dataset is small.
        </p>
      </div>
    ),
  },
  {
    id: "metrics",
    section: "Plan",
    title: "How you’ll prove it works",
    content: (
      <GridList
        items={[
          {
            label: "Accuracy + F1",
            text: "Overall and per-template (some memes look alike).",
          },
          {
            label: "Confusion matrix",
            text: "Show which templates the model mixes up — great slide for oral defense.",
          },
          {
            label: "Grad-CAM",
            text: "Heatmap of what the CNN “looks at” — faces, panels, text bars.",
          },
          {
            label: "Live demo",
            text: "Upload 5 memes live; predict template + confidence.",
          },
        ]}
      />
    ),
  },
  {
    id: "stack",
    section: "Deliverables",
    title: "Stack & deliverables",
    content: (
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="font-display text-xl text-lime">Build with</p>
          <ul className="mt-3 space-y-2 text-ink-200">
            <li>Python + PyTorch (or TensorFlow/Keras)</li>
            <li>Google Colab or local GPU</li>
            <li>Matplotlib / Seaborn for plots</li>
            <li>Optional Gradio demo UI</li>
          </ul>
        </div>
        <div>
          <p className="font-display text-xl text-lime">Turn in</p>
          <ul className="mt-3 space-y-2 text-ink-200">
            <li>Notebook or repo with training code</li>
            <li>Short report: data, architecture, results</li>
            <li>This presentation for the entrevue</li>
            <li>3–5 demo screenshots / live predict</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "close",
    section: "Wrap",
    title: "Takeaways",
    tone: "hero",
    content: (
      <div className="mt-8 max-w-2xl space-y-6">
        <ul className="space-y-3 text-lg text-ink-200">
          <li>CNNs exploit spatial structure — that’s the interview core.</li>
          <li>Know conv / pool / ReLU / softmax / backprop / ResNet.</li>
          <li>
            Meme pics →{" "}
            <span className="text-lime">template classification</span> is a
            legit, demable mini-project.
          </li>
        </ul>
        <p className="font-display text-2xl text-ink-50 sm:text-3xl">
          Questions?
        </p>
      </div>
    ),
  },
];
