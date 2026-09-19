# Is it hennen?

School mini-project: a **tiny CNN head** on a frozen FaceNet backbone that answers **HENNEN / NOT HENNEN**.

The network trains **once**. Detection never retrains. The trained file `models/hennen.pt` (~176 KB) is **already in this repo**, so a clone on another PC is enough.

## On another computer

Need **Git** and **Node 20+**. The trained model `models/hennen.pt` is already in the clone.

```bash
git clone https://github.com/gabo2212/is-it-hennen.git
cd is-it-hennen
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123). Press **F** for fullscreen, arrows / space to present.

To use the detector too, need **Python 3.10+**. First `npm run setup` downloads PyTorch (large, once). Then in a **second** terminal:

```bash
npm run setup
npm run api
```

Then open `/detect` and drop a photo. You do **not** need the original Hennen album. First `npm run api` also downloads FaceNet (~100 MB, once).

## What you get

- `/` — 8-slide deck (press **F** for fullscreen). Arrow keys / space to present.
  Each slide has a **Say** line you can read out loud.
- `/detect` — drop a photo, live scan through MTCNN → conv1 → 512-d → 64 hidden → HENNEN / NOT HENNEN
- `models/hennen.pt` — the trained artifact (~176 KB). This is what you copy if you want someone else to run *your* person.

Personal training photos stay **out of git** (`data/hennen/` except a README). The committed `hennen.pt` is the gallery + tiny head, not the pictures.

---

## Run the app

```bash
npm install
npm run setup    # Python venv + pip (skip if you only need slides)
```

Two processes:

```bash
# terminal 1 — detector API (loads models/hennen.pt)
npm run api
```

```bash
# terminal 2 — Next.js UI
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123). Detect talks to FastAPI on **43124**.

CLI check (after `npm run setup`):

```bash
# Unix
PYTHONPATH=. .venv/bin/python -m cnn predict path/to/photo.jpg
# Windows
.venv\Scripts\python -m cnn predict path\to\photo.jpg
```

---

## Train your own person (once)

You are swapping who “Hennen” is. Same pipeline.

### 1. Collect photos

Need **at least 8** clear face shots of **one person**. **20–30** is better.

- Front / 3/4, different rooms and light
- One face per photo
- `.jpg` `.jpeg` `.png` `.webp` `.heic`

Put them here:

```text
data/hennen/
  photo1.jpg
  photo2.jpg
  …
```

Or keep them anywhere and pass `--hennen-dir`.

Git ignores `data/hennen/*` so you do not commit private photos.

### 2. Train (once)

```bash
PYTHONPATH=. python3 -m cnn train
```

Custom folder:

```bash
PYTHONPATH=. python3 -m cnn train --hennen-dir /path/to/photos
```

This:

1. Crops faces (MTCNN)
2. Embeds with frozen FaceNet (VGGFace2)
3. Fits a tiny 2-layer head on those 512-d vectors
4. Writes **`models/hennen.pt`**

First FaceNet download is ~100 MB into `~/.cache`. Later runs are local.

Hold-out photos of that person should print `HENNEN`. Random other faces should print `NOT HENNEN`. If they do not, add more varied photos and train **once more**. Then stop.

### 3. Restart the API

`cnn serve` loads the `.pt` at start. After a new train:

```bash
# stop the old npm run api, then:
npm run api
```

Refresh `/detect` and drop photos. Detect **does not** train.

---

## Upload / move your model

`models/hennen.pt` is the whole custom model: gallery embeddings, tiny head weights, and the HENNEN / NOT HENNEN thresholds.

**You do not need the training photos on the machine that only detects.**

### Same laptop, new clone

```bash
git clone https://github.com/gabo2212/is-it-hennen.git
cd is-it-hennen
# hennen.pt is already in the repo
```

### Another computer / classmate / USB

1. Train on machine A (steps above).
2. Copy the file:

```bash
# from the project that trained
cp models/hennen.pt /somewhere/safe/hennen.pt
```

3. On machine B:

```bash
git clone https://github.com/gabo2212/is-it-hennen.git
cd is-it-hennen
mkdir -p models
cp /somewhere/safe/hennen.pt models/hennen.pt
npm install
npm run setup
npm run api
npm run dev
```

Drop photos on `/detect`. It is still **your** person, without sharing the original album.

### Put it in git (optional)

If the person is OK with a public gallery embedding (not the raw photos):

```bash
git add models/hennen.pt
git commit -m "Train custom person into hennen.pt"
git push
```

Do **not** `git add data/hennen/`. That folder is gitignored on purpose.

### Replace the person later

1. Delete or overwrite `models/hennen.pt`
2. Replace photos in `data/hennen/`
3. `python3 -m cnn train` **once**
4. Restart `cnn serve`

---

## Layout

```text
cnn/            train / predict / FastAPI / live viz JSON
models/hennen.pt
src/app/        Next.js pages
src/components/ Detector, live NetworkCanvas
data/hennen/    your photos — gitignored
```

The live canvas is **visualization**, not a second trainer.
