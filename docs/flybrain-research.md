# Fruit-fly brain as a neural net: research + how to plug it into *C'est Hennen ?*

*Generated: 2026-09-20 · Sources: 25+ · Confidence: **High** on the science and public repos, **Medium** on Windows/CPU runtime of the heavy whole-brain sims*

This file is the working note so we do not lose the thread.

## What we actually built (2026-09-20)

Shipped on `/detect`: FaceNet stays the nose (512-d). The fly is a **second HENNEN / PAS HENNEN classifier** using FlyWire FAFB **v783** mushroom-body wiring (PN → k-WTA Kenyon → MBON), trained once with sugar on Hennen embeddings and choc on others. The UI is a full rotating soma point-cloud (`public/fly/somas.bin`); predict returns `fly.lit` soma indices of the PN / Kenyon / MBON cells that actually fired — those points go lime (OUI) or coral (NON). Math is a MIT port of fly-blackjack `MushroomBody`, not GPL Eon. Missing `models/fly_mb.npz` + `models/fly_mb_gains.npz` → `fly: null`; the CNN still answers.

Commands: `python -m cnn fly_build` then `python -m cnn fly_train`. Tests: `python cnn/test_fly_mb.py`.

Out of scope (still below): Doom, blackjack table, webcam looming, live sugar clicks, flyvis optic lobe.

## Executive summary

Nothing online is plugging a *living* fruit-fly brain into an app. What went viral in 2024–2026 is this:

1. Scientists mapped one real adult fly with electron microscopy (**FlyWire** female brain, **MaleCNS** male brain+cord).
2. They published the **connectome** (who synapses onto whom, with synapse counts and predicted excitatory/inhibitory sign).
3. You load that graph as a neural network (usually leaky integrate-and-fire, sometimes a PyTorch “mechanistic CNN”), stimulate sensory neurons, and read motor/descending neurons.

That *is* a real brain’s wiring, run as software. It is **not** a wet lab, and it is **not** a fly that knows Hennen.

The scientifically strongest fit for *this* photo app is **[TuragaLab/flyvis](https://github.com/TuragaLab/flyvis)** (Nature 2024): a connectome-constrained model of the fly **visual system** in PyTorch, with an official “feed it your own images” tutorial. The viral toys (Doom, desktop pet, Bitcoin) mostly run a **whole-brain LIF** of [Shiu et al., Nature 2024](https://www.nature.com/articles/s41586-024-07763-9) and invent a mapping from pixels/prices → photoreceptors.

**Recommended gag that is actually impressive:** keep FaceNet as the real “C’est Hennen ?” answer. The fly gets the **same photo**, and the UI hero is what every viral fly app shows: a **rotating 3D point-cloud of real FlyWire soma positions**, neurons lighting up where the optic lobe actually sits. Honest caption: *câblage d’une vraie mouche, dynamique modèle, la mouche n’a jamais appris Hennen.*

Do **not** reuse `NetworkCanvas` for this. That 2D layer graph is the CNN lesson. The fly has to look like a brain in space or it will not read as those projects.

---

## 1. What people actually mean by “real fruit fly brain”

| Layer | Real? | What it is |
|---|---|---|
| Electron-microscope volume of one fly | Yes | A dead fly, sliced and imaged (FAFB / MaleCNS) |
| Connectome graph (~140k neurons, tens of millions of synapses) | Yes | Published wiring + synapse counts + NT sign |
| Dynamics (LIF, flyvis voltages) | Model | Simple published neuron equations, not the living cell |
| Photo / webcam / BTC chart → fly eyes | Engineering | Project-defined retina mapping |
| “The fly recognizes faces / trades Bitcoin / plays Doom” | Joke / demo | Readout is chosen by the app author |

**Do not claim we uploaded a living animal.** The honest line (also used by FlyDrones, Doomfly, DesktopFly): *wiring is biological; dynamics and sensors are models.*

Two datasets everyone uses:

- **FlyWire FAFB v783** — adult *female* brain, **139,255** proofread neurons, 50M+ synapses. Nature 2024 (Dorkenwald et al.). Explore: [flywire.ai](https://flywire.ai/) · [codex.flywire.ai](https://codex.flywire.ai/).
- **MaleCNS v1.0** — adult *male* brain **and** ventral nerve cord (so real descending neurons to legs/wings). Cell 2026. Data **CC-BY 4.0**. [male-cns.janelia.org](https://male-cns.janelia.org/).

Two scientific models that turn those graphs into runnable nets:

- **Shiu et al. 2024, Nature** — whole-brain LIF. Activate/silence FlyWire IDs; spikes propagate. Reported ~91% match to some live-fly sensorimotor experiments. Code: [philshiu/Drosophila_brain_model](https://github.com/philshiu/Drosophila_brain_model) (MIT).
- **Lappalainen / Turaga et al. 2024, Nature** — optic-lobe **deep mechanistic network** in PyTorch. Each unit ↔ a real cell type / column. Predicts visual neuron activity. Code: [TuragaLab/flyvis](https://github.com/TuragaLab/flyvis) (MIT). Custom images: [notebook 07](https://github.com/TuragaLab/flyvis/blob/main/examples/07_flyvision_providing_custom_stimuli.ipynb).

Older cousin people mix up: **C. elegans** (302 neurons, OpenWorm / GoPiGo). The 2026 meme wave is the *fly*, not the worm.

---

## 2. Public repos that put the flybrain into apps

Master index (keep this bookmarked): **[cobanov/awesome-fly](https://github.com/cobanov/awesome-fly)** (~550★, updated continuously).

### Serious science (use these as the “real brain”)

| Repo | What it runs | License | Why it matters |
|---|---|---|---|
| [philshiu/Drosophila_brain_model](https://github.com/philshiu/Drosophila_brain_model) | Whole-brain LIF, FlyWire v630/v783 | MIT | Canonical Shiu model, Colab notebook |
| [TuragaLab/flyvis](https://github.com/TuragaLab/flyvis) | Optic lobe as PyTorch DMN | MIT | **Best for a photo app.** Custom stimuli, pretrained weights |
| [eonsystemspbc/fly-brain](https://github.com/eonsystemspbc/fly-brain) | Same LIF, Brian2 / PyTorch / NEST / chips | **GPL-2.0** | Fast, popular (~860★). **Avoid for this school repo** (GPL) |
| [chaobrain/drosophila_whole_brain_snn_simulation](https://github.com/chaobrain/drosophila_whole_brain_snn_simulation) | Reproduction of Shiu | ? | Small reproduction |
| [FlyBrainLab/FlyBrainLab](https://github.com/FlyBrainLab/FlyBrainLab) | Executable circuits from fly data | academic | Heavier lab platform, not a drop-in demo |
| [fruitflybrain/*](https://github.com/fruitflybrain) | Fruit Fly Brain Observatory | mixed | 3D viz + NLP over fly data, not a classifier |

### Viral apps (the stuff you saw online)

| Repo | Gag | How “real” |
|---|---|---|
| [DenisSergeevitch/desktop-fly](https://github.com/DenisSergeevitch/desktop-fly) (~1000★) | 3D fly lives on your macOS (Windows port in `windows/`) | FlyWire circuit extract (668 neurons + 23k soma positions) + MaleCNS legs. MIT code, FlyWire extract **CC BY-NC 4.0** |
| [nftechie/doomfly](https://github.com/nftechie/doomfly) (~370★) | Fly brain plays Doom | MaleCNS ~166k neurons, 25.6M edges; frames → R1–R6 / R8. They document the retina mapping is a proxy |
| [nftechie/stonkfly](https://github.com/nftechie/stonkfly) (~780★) | Same brain, crypto chart → buy/sell | Same MaleCNS graph; paper trading by default |
| [SpikeCalls/FlyDrones](https://github.com/SpikeCalls/FlyDrones) (~200★) | Camera → fly eyes → descending neurons → drone | Honest README: browser demo is an 850-neuron **MiniFly stand-in**; full MaleCNS is separate |
| [snedea/flybrain](https://github.com/snedea/flybrain) | Browser pet, food/touch/light | Claims 139,255 LIF neurons in a Web Worker (forked from a worm sim). Treat as a demo, not a paper reproduction |
| [vaibhavkedarisetti/fruit-fly-lab](https://github.com/vaibhavkedarisetti/fruit-fly-lab) | Interactive whole-brain lab in the browser | Explicit checksums against FlyWire v783 + Shiu LIF |
| [TropiFloAI/the_buzz](https://github.com/TropiFloAI/the_buzz) | BTC vs RandomForest vs fly ESN | Takes the **7,500 highest-degree** FlyWire nodes as an echo-state reservoir. Funny, scientifically a stretch |
| [SotoAlt/traderfly-brain](https://github.com/SotoAlt/traderfly-brain) | Token in, fly “eats” or not | MaleCNS + Shiu LIF |
| [evnsnclr/neurocraft-fly-public](https://github.com/evnsnclr/neurocraft-fly-public) | Fly in Minecraft | Connectome in a game |
| [Gary-XC/flywire-rl-engine](https://github.com/Gary-XC/flywire-rl-engine) | RL agent whose graph = fly synapses | Tiny / early |
| [A-Canelo/Insect-brain-connectome-based-DNN](https://github.com/A-Canelo/Insect-brain-connectome-based-DNN) | DNN shaped like a fly graph | 2021, pre-FlyWire complete brain |

Also in the awesome-fly list (not all deep-read here): Swat (browser escape circuit), connectome-fighter, fly-craftax, Fly Chess, The Fly’s Table (blackjack on mushroom body), Fly Dino, flycoinrh.

**Pattern every viral repo copies:** connectome graph + LIF (Shiu params) + a custom encoder from the app’s world (pixels, prices, cursor) onto named sensory neurons + a custom decoder from descending/motor neurons onto buttons + **a 3D anatomical brain window as the main UI**.

---

## 3. The 3D brain *is* the product UI

This is the thing you saw online. They do not lead with a 2D net diagram. They lead with a **slowly rotating cloud of real neuron coordinates**, spikes flashing at the soma.

| App | 3D view | What the points are |
|---|---|---|
| [DesktopFly](https://github.com/DenisSergeevitch/desktop-fly) | Live “brain window”, auto-rotate, hover pauses, click = optogenetic stim. Giant Fibers marked yellow. Screenshot: `assets/brain.png` | **23,210 real FlyWire v783 soma positions** (`data/brain_points.json`, ~637 KB). Colored by super-class. Circuit that actually spikes is 668 neurons / 18,968 synapses |
| [fruit-fly-lab](https://github.com/vaibhavkedarisetti/fruit-fly-lab) | Toggle “3D neurons / spike raster” | **All 139,255 neurons at true FAFB coordinates** (`coordinates.csv.gz` from Codex). They even test the bounding box is a real fly brain (~814 × 392 × 278 µm) |
| [fly-brain-vis](https://github.com/rndlabsoy/fly-brain-vis) | VTK gaussian-splat glow, free camera | Positions fetched from FlyWire L2 cache, then cached |
| [FlyDrones](https://github.com/SpikeCalls/FlyDrones) | “Live 3D demo in your browser” | MiniFly in the browser; full MaleCNS off-browser |
| [neu3D](https://github.com/fruitflybrain/neu3d) | JS engine for **meshes / SWC skeletons** | Too heavy for a whole brain; good for a few named cells (Giant Fiber) on top of the point cloud |
| Codex / Neuroglancer | Official FlyWire 3D | Not embeddable as a cute in-app widget |

Recipe they all share (copy this, don’t invent a new look):

1. Load `x,y,z` for each neuron from FlyWire Codex `coordinates.csv.gz`  
   `https://storage.googleapis.com/flywire-data/codex/data/fafb/783/coordinates.csv.gz`
2. Draw them as additive **points** (not full meshes). 20k–140k points is fine in the browser.
3. Slow auto-rotate. Dark background. Optic lobe / visual super-class in one color, rest dim.
4. On activity: brighten the points that spiked (lime here, to match the site). Optionally pulse the two Giant Fibers (`DNp01`).
5. Caption with neuron count + “positions from FlyWire v783”.

DesktopFly already did the ETL we would otherwise write: `etl.py` downloads Codex dumps and writes `brain_points.json`. We should **rebuild from Codex ourselves** (same public files, cite FlyWire) rather than vendor their JSON, because that file is **CC BY-NC 4.0**. School demo is fine; keep the citation on screen.

`NetworkCanvas` stays as the FaceNet 512→64→2 lesson. The fly is a **new** `FlyBrain3D` stage.

---

## 4. What would actually be impressive in *this* app

This repo already does:

- Frozen **FaceNet** + tiny 512→64→2 head (`cnn/predict.py`)
- FastAPI `/predict` (`cnn/serve.py`)
- Live activation viz (`cnn/visual.py` → `NetworkCanvas`)
- French slides (`src/data/slides.tsx`)

A fly does **not** have FaceNet and cannot name Hennen. Training the connectome to classify Hennen would be the *least* impressive version (just another tiny classifier wearing a fly costume).

The impressive version is the same joke the good viral repos tell, with the **same 3D brain window**, because our input is a photo:

```
photo
  ├─ existing path: MTCNN crop → FaceNet → cosine vs Hennen → OUI / NON
  │                 NetworkCanvas (2D CNN layers) stays under the verdict
  └─ fly path:     photo → optic-lobe / visual neurons in the real 3D brain
                   → FlyBrain3D: rotating soma cloud, visual regions light up
                   → joke vote from identified cells (motion, looming, flicker)
```

FaceNet stays the graded answer. The fly is the **big 3D panel**, not a second 2D chart.

Detector layout to copy (wide / ultrawide already exists):

```
┌──────────────────────┬─────────────────────────────────────────┐
│ drop photo           │  3D FlyWire brain (hero, ~60vh)         │
│ OUI / NON FaceNet    │  auto-rotate · optic lobe flashes lime  │
│ Avis de la mouche    │  “23 210 somas · FlyWire v783”          │
└──────────────────────┴─────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────┐
│ NetworkCanvas — the school CNN (smaller, below)                │
└────────────────────────────────────────────────────────────────┘
```

### Why `flyvis` rather than whole-brain LIF

- Input is an **image**. flyvis was built for that (hexagonal convolution over the optic lobe). Shiu’s paper is taste / sensorimotor, not “classify this JPEG”.
- Already **PyTorch**, like this project.
- Official custom-stimuli path: Cartesian image → `BoxEye` hex lattice → `NetworkView` → `LayerActivity`.
- MIT, Nature 2024, pretrained checkpoints.
- Whole-brain 140k LIF is slow on CPU, needs parquet connectome files, and Eon’s fast port is GPL. A school laptop running `npm run api` will hate it.
- If we later want spikes on the canvas, we can add a **small** Shiu subgraph (visual + descending), not the full 140k.

### Funny, honest UX (French)

Copy to steal later:

- Badge: `CÂBLAGE : mouche réelle · DYNAMIQUE : modèle`
- “FaceNet a appris Hennen une fois. La mouche, jamais. On lui met la photo dans les yeux quand même.”
- Fly vote examples (derived from cell types, not from a trained Hennen head):
  - T4/T5 motion high → `ÇA BOUGE — elle suit`
  - Looming / giant-fiber-ish OFF burst → `ÇA TOMBE DESSUS — elle fuit`
  - Static, mid contrast → `RIEN NE BOUGE — elle s’en fout`
- Never print `HENNEN` as if the fly knew the name. Print `approche` / `fuite` / `indifférente`. The human punchline is: *le CNN dit OUI, la mouche dit bof.*

### Concrete hook into this codebase (when we build it)

| Piece | Where |
|---|---|
| Soma cloud (the look) | `public/fly/brain-points.bin` built from Codex `coordinates.csv.gz` + `classification.csv.gz`. xyz + super-class. ~20k–50k points to start (DesktopFly’s 23,210 is the proven browser size) |
| 3D widget | `src/components/FlyBrain3D.tsx` — Three.js `Points`, additive lime/ink, auto-rotate, drag to orbit. **Do not** paint this on `NetworkCanvas` |
| Detector layout | `Detector.tsx` — two columns on `lg+`: photo+verdict \| 3D brain. `NetworkCanvas` full-width underneath |
| Activity | `POST /predict` returns `fly: { vote, lit: number[] }` — indices into the point cloud (optic-lobe / visual super-class, later real spike IDs) |
| Engine (the science) | `cnn/flyvis_path.py` and/or a Shiu visual+descending subset. 3D can light optic-lobe points even before the engine is wired |
| License footer | “Positions: FlyWire FAFB v783, Dorkenwald et al. Nature 2024. CC BY-NC 4.0.” |
| Slide | live-detector slide screenshot of the 3D brain, not a hex grid |
| Tests | point count + bounding box in µm matches a fly brain; missing `lit` → idle dim cloud still renders |

### Build order if we green-light it

1. **The window everyone recognizes (first):** Codex → compact point file → `FlyBrain3D` on `/detect`, auto-rotate, optic-lobe super-class already tinted. No flyvis yet. This *is* the real anatomy, not a fake UI.
2. **Light it from the photo:** map the upload onto visual/optic-lobe indices (flyvis or a brightness→R1–R6 encoder like Doomfly). Those points flash on predict.
3. **Engine:** flyvis or Shiu visual+Giant-Fiber subset so the flash is computed, not painted.
4. **Only if still hungry:** full 139k cloud, click-to-stim like DesktopFly, Giant Fiber markers.

### What we should not do

- Train the fly graph on Hennen photos (kills the joke and the science).
- Copy Eon Systems code (GPL-2.0 infects the repo).
- Claim 139,255 neurons on a laptop demo unless we actually load v783 and checksum it (fruit-fly-lab does this; snedea/flybrain probably does not).
- Use FlyWire extracts under **CC BY-NC** if the project is ever commercial. MaleCNS is **CC-BY 4.0** (easier). flyvis MIT is the cleanest start.
- Pretend photoreceptor mapping is “the fly seeing the photo the way it would in a kitchen.” It is a projector onto a hex eye.

### Runtime risk (this machine)

- App pins **PyTorch 2.2 CPU** and Python **3.12**. flyvis may want a newer torch / extra deps (`pip install flyvis`). Unknown until we try in `.venv`.
- If flyvis fights the pin: run it as an optional extra (`npm run api:fly`) or vendor a tiny frozen optic-lobe extract.
- Whole-brain LIF: plan on GB of RAM and a connectome download. Bad default for `npm run setup`.

---

## 5. Honest one-liner for the slides

> On a emprunté un expert des visages (FaceNet). En bonus, on envoie la même photo dans le **vrai câblage visuel d’une drosophile** publié en 2024. La mouche ne sait pas qui est Hennen. Elle sait si ça bouge, si ça contraste, si ça fonce sur elle.

That is the same honesty bar as FlyDrones / Doomfly, with a better scientific substrate for a photo detector.

---

## 6. Extra-crazy modes (games, tied to *this* app)

The blackjack thing you saw is **[The Fly’s Table](https://github.com/WilliamJones/fly-blackjack)** ([live](https://fly-blackjack.vercel.app/)). It is not “an AI that learned blackjack.” It is the fly’s **mushroom body**:

| Population | Cells | Job in a real fly | Job at the table |
|---|---|---|---|
| Antennal-lobe projection neurons | 682 | Odour identity in | Each *option* (hit / stand / double) is pretended to be a smell |
| Kenyon cells | 1,200 (of 3,811) | Sparse hash of that odour | Sparse code of the imagined move |
| MBONs | 97 | Approach vs avoid | Vote for the best-smelling move |
| PAM + PPL1 dopamine | 332 | Sugar reward / shock | Win → reward DANs, lose → punishment DANs |

**22,586 + 61,210 + 3,123 measured synapses.** Only Kenyon→MBON gains change. After 30,000 solo hands it learned “don’t bust” (stand on almost everything, hit 10–11). Poker was tried and **failed** (they published that). Dopamine disconnected → no learning. So the gag is scientifically real *and* already a game.

Do **not** bolt a random Doom clone onto Hennen. Steal the *circuits* and aim them at faces / Among Us / the frozen-CNN thesis.

### Ranked for this repo (crazy × on-theme × buildable)

**1. Same question as FaceNet, answered by the mushroom body (this is the one)**

You do **not** want a second random question (keep/eject, pick a photo). You want **HENNEN / PAS HENNEN**, same as now, but the path through the fly is the show.

Split the existing pipeline the way the slides already split FaceNet vs tiny head:

```
photo → MTCNN crop
         ├─ FaceNet 512-d  → cosine + tiny head     → OUI / NON   (the file)
         └─ same 512-d mapped as an *odour* onto the
            real mushroom body (682 PN → 1200 Kenyon → 97 MBON)
            trained once with sugar=Hennen, choc=pas Hennen
            → OUI / NON   (the fly)
```

The 512 numbers are the “smell.” Kenyon cells are a sparse hash (most stay dark, ~5% light up — that’s the real fly trick). MBONs vote approach = **HENNEN**, avoid = **PAS HENNEN**. Same 22 gallery photos + negatives as `cnn train`. Same drop-a-photo UI. Not a random meeting.

Why the answers will basically match:

- Same identity signal (FaceNet embedding), same labels.
- The fly graph is doing the job of the 64-unit head, with **measured** Kenyon synapses instead of `Linear(512, 64)`.
- Among Us / hasard photos land far away in embedding space → choc odour → NON, like FaceNet.
- A new Hennen photo lands near the gallery → sugar odour → OUI.

Funny, not random:

- On-screen copy: *« La mouche ne le voit pas. Elle le sent. »*
- 3D: antennal lobe flashes, then a sparse Kenyon firework, then two MBON piles (sucre vs choc).
- NON can wear an Among Us skin (impostor badge) because those photos are already your negatives — that’s costume, not a different vote.
- Giant Fiber is only theater (close-up = the fly flinches) and **must not override** the identity vote.

Impressive because you can point at the 3D cloud and say: these 1,200 dots are real Kenyon cells; only the ones that smell this face light up; the CNN head is 64 made-up units doing the same job.

Honest line on screen: *FaceNet = le nez (emprunté). Champignon = la mémoire (câblage de mouche). Le mapping 512 → 682 PN est à nous, comme les cartes→odeurs du blackjack.*

Do **not** let the fly pick among six random pics. One photo in, two OUI/NON out (CNN vs mouche). If they agree, lime. If they disagree, that’s a real demo, not a gag vote.

**2. The academic jump-scare: the CNN is frozen, the fly learns live**

The whole deck repeats “détecter n’entraîne jamais.” The mushroom body is the one circuit in the fly that *does* learn in seconds (dopamine-gated depression of Kenyon→MBON synapses — same rule as blackjack).

On stage:

1. Show Hennen. Click **SUCRE** → PAM dopamine. 3D Kenyon cells flash. The fly now “likes” that odour-pattern.
2. Show Among Us / hasard. Click **CHOC** → PPL1. The fly now avoids it.
3. Drop a *new* photo. FaceNet cosine is unchanged (frozen `hennen.pt`). The fly’s MBON vote has moved.

That is crazier than blackjack because it attacks your own thesis on purpose, with the real learning rule, in front of the class. Caption: *FaceNet est un fichier. La mouche, elle, a un champignon.*

**3. Blackjack, but the cards are faces**

Keep their table UI energy, swap chips for Hennen:

- Each card = a face crop. Rank/suit can stay, or Hennen = Ace (the card the fly is conditioning on).
- Hit / stand / double are still three odours through the same 682→1200→97 mushroom body.
- Win/lose still hits PAM/PPL1.
- 3D brain stays up the whole hand (they sit the fly at the table with the mushroom body floating above it — copy that).
- Optional: if FaceNet says OUI, the fly gets a sugar pulse regardless of the hand (“seeing Hennen is the reward”). Then it starts standing whenever the dealer “looks like Hennen.” Stupid, visible, honest.

Do this *after* 1 and 2. Standalone blackjack is someone else’s demo.

**4. Webcam looming during the talk (Giant Fiber)**

fruit-fly-lab’s “THROW ROCK” is 104 LC4 + 210 LPLC2 → Giant Fiber. Doomfly/Swat map pixels to those looming cells.

Put the laptop camera on during Q&A. If a head fills the frame, LC4/LPLC2 light up in the 3D cloud, Giant Fibers go yellow, overlay **FUITE**. Walk toward the webcam on purpose. Zero new game UI, maximum live “wait it actually panicked.”

**5. Swat / “attrape Hennen”**

[Swat](https://github.com/hrook1/Swat) runs 6,000 MaleCNS cells, LC16→MDN retreat, arcade flying. A tiny cousin: a photo drifts on the detector; the fly’s retreat circuit steers a cursor; you try to drop the file onto its head. Fun, less tied to the lesson than 1–4.

**6. Click-to-stim optogenetics (DesktopFly)**

The 3D brain is already interactive in those apps: click a region, ~60 nearest circuit neurons fire 400 ms, spikes walk the real graph. During the presentation: click *optic lobe* vs *mushroom body* vs *Giant Fiber* and tell the audience what they just did. This is the “lab bench” mode of the same widget.

### What not to steal

- **Doom / Dino / drones / BTC** — spectacular, zero link to “c’est Hennen ?”. Looks bolted on.
- Training the *whole* connectome with PPO to classify faces — that’s just a worse CNN.
- Claiming the fly “understands blackjack” or “knows Among Us.” Cards/faces as odours is an authored mapping; say so, like they do.

### If we only ship one extra

**Mushroom body as the second HENNEN/NON** (FaceNet = nose, Kenyon cells = memory, 3D sparse fireworks). Same photo in, same labels, Among Us only as the NON costume.

---

## Key takeaways

- The meme is **connectome-as-net**, not a jar of neurons.
- Canonical runnable brains: **Shiu LIF** (whole brain) and **flyvis** (eyes). Both Nature 2024, both public.
- Viral apps: [awesome-fly](https://github.com/cobanov/awesome-fly) — Doom, desktop pet, drones, crypto, Minecraft, blackjack.
- For *C’est Hennen ?*, the fly is a **3D FlyWire soma cloud** on `/detect` (same UI move as DesktopFly / fruit-fly-lab), FaceNet stays the identity answer, the fly vote is motion/looming/boredom.
- Extra modes that actually belong here: **mushroom body as a second HENNEN/NON classifier** (FaceNet embedding as odour, same gallery). Among Us is a badge on NON, not a random meeting. Live sugar/choc and blackjack-with-faces are later. Doom/Dino/BTC do not.
- Prefer **MIT** (flyvis, philshiu). Skip **GPL** Eon. Soma coordinates from FlyWire are **CC BY-NC 4.0** — cite on screen.
- Next decision: green-light **step 1** (`FlyBrain3D` + Codex points on `/detect`) before wiring flyvis or games.

---

## Sources

1. [FlyWire](https://flywire.ai/) — official whole-brain female connectome, 139,255 neurons.
2. [Dorkenwald et al., Nature 2024](https://doi.org/10.1038/s41586-024-07558-y) — neuronal wiring diagram of an adult brain.
3. [Shiu et al., Nature 2024](https://www.nature.com/articles/s41586-024-07763-9) — whole-brain LIF predicts sensorimotor processing.
4. [philshiu/Drosophila_brain_model](https://github.com/philshiu/Drosophila_brain_model) — MIT reference LIF code + FlyWire parquet.
5. [Lappalainen et al., Nature 2024](https://www.nature.com/articles/s41586-024-07939-3) — connectome-constrained fly visual system.
6. [TuragaLab/flyvis](https://github.com/TuragaLab/flyvis) — PyTorch implementation, custom stimuli notebook.
7. [flyvis docs](https://turagalab.github.io/flyvis/) — install, tutorials, pretrained models.
8. [Janelia: AI + connectome predict cell activity](https://www.janelia.org/news/researchers-combine-the-power-of-ai-and-the-connectome-to-predict-brain-cell-activity) — lab writeup of flyvis.
9. [MaleCNS](https://male-cns.janelia.org/) — male brain+cord, CC-BY 4.0, Cell 2026.
10. [cobanov/awesome-fly](https://github.com/cobanov/awesome-fly) — curated list of fly-connectome apps.
11. [eonsystemspbc/fly-brain](https://github.com/eonsystemspbc/fly-brain) — fast multi-backend LIF (GPL-2.0).
12. [Eon: “We've uploaded a fruit fly”](https://eon.systems/updates/weve-uploaded-a-fruit-fly) — 91% behavior accuracy claim, MuJoCo body.
13. [Eon embodied emulation](https://eon.systems/updates/embodied-brain-emulation) — Shiu LIF + flyvis + NeuroMechFly.
14. [DenisSergeevitch/desktop-fly](https://github.com/DenisSergeevitch/desktop-fly) — desktop pet; documents real vs modeled parts.
15. [nftechie/doomfly](https://github.com/nftechie/doomfly) — MaleCNS plays Doom; honest retina-proxy note.
16. [nftechie/stonkfly](https://github.com/nftechie/stonkfly) — same graph trades crypto.
17. [SpikeCalls/FlyDrones](https://github.com/SpikeCalls/FlyDrones) — camera → descending neurons → drone; MiniFly vs full connectome.
18. [snedea/flybrain](https://github.com/snedea/flybrain) — browser 139k LIF demo.
19. [vaibhavkedarisetti/fruit-fly-lab](https://github.com/vaibhavkedarisetti/fruit-fly-lab) — checksummed FlyWire v783 + Shiu in the browser.
20. [TropiFloAI/the_buzz](https://github.com/TropiFloAI/the_buzz) — 7.5k-node fly ESN vs RandomForest for BTC.
21. [SotoAlt/traderfly-brain](https://github.com/SotoAlt/traderfly-brain) — token tasting via MaleCNS.
22. [FlyBrainLab](https://github.com/FlyBrainLab/FlyBrainLab) — executable circuits from fly data.
23. [fruitflybrain GitHub org](https://github.com/fruitflybrain) — Fruit Fly Brain Observatory.
24. [flyconnectome/flywire_annotations](https://github.com/flyconnectome/flywire_annotations) — cell types for v783.
25. [Loihi 2 Drosophila sim, arXiv:2508.16792](https://arxiv.org/html/2508.16792v1) — whole fly connectome on neuromorphic hardware.
26. [FlyGM locomotion, arXiv:2602.17997](https://arxiv.org/html/2602.17997v3) — connectome graph as RL controller.
27. [DesktopFly `data/brain_points.json`](https://github.com/DenisSergeevitch/desktop-fly/blob/master/data/brain_points.json) — 23,210-soma 3D cloud, ~637 KB, CC BY-NC 4.0.
28. [DesktopFly ETL](https://github.com/DenisSergeevitch/desktop-fly/blob/master/etl.py) — Codex `coordinates.csv.gz` + `classification.csv.gz` → brain window.
29. [fruitflybrain/neu3d](https://github.com/fruitflybrain/neu3d) — JS SWC/mesh viewer (named neurons, not whole-brain points).
30. [rndlabsoy/fly-brain-vis](https://github.com/rndlabsoy/fly-brain-vis) — VTK gaussian-splat spikes on FlyWire coordinates.
31. Codex download: `https://storage.googleapis.com/flywire-data/codex/data/fafb/783/` — `coordinates.csv.gz`, `classification.csv.gz`.
32. [WilliamJones/fly-blackjack](https://github.com/WilliamJones/fly-blackjack) — mushroom body (682 PN, 1200 KC, 97 MBON, 332 DAN) plays blackjack; [live table](https://fly-blackjack.vercel.app/).
33. [cobanov/flyjump (Fly Dino)](https://github.com/cobanov/flyjump) — 80-cell MaleCNS circuit + learned readout on Chrome Dino; honest real-vs-model writeup.
34. [hrook1/Swat](https://github.com/hrook1/Swat) — 6k-cell LC16 retreat circuit as a swat arcade.

## Methodology

Firecrawl and Exa MCP were **not** configured in this Cursor session. Searched with Parallel `web_search` / `web_fetch` and GitHub `search_repositories` on 2026-09-20.

Sub-questions:

1. What is the scientific object behind “real fruit fly brain as a neural net”?
2. Which public repos actually run that graph inside an app?
3. What is real wiring vs demo mapping?
4. What can we add to *C’est Hennen ?* that is funny and still uses the real connectome?
5. How do the viral apps actually show the brain in 3D, and what data file is that point cloud?

Gaps: did not install flyvis against this repo’s torch 2.2 pin; did not re-run Shiu’s 91% figure; star counts move daily; some awesome-fly entries were only skimmed; did not rebuild `brain_points.json` from Codex in this repo yet.
