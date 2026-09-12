# Is it hennen?

CNN mini-project: **train once** on ~20–30 photos of Hennen, then the detector only answers **HENNEN / NOT HENNEN**. It does not train when you upload a test photo.

The UI uses a Cult-style dark stage (grain, magenta / lime / mint orbs). The detector draws the live neural net in the browser while the model is running.

## Run the slides

```bash
npm install
npm run dev -- --port 43123 --hostname 127.0.0.1
```

[http://127.0.0.1:43123](http://127.0.0.1:43123) — presentation  
[http://127.0.0.1:43123/detect](http://127.0.0.1:43123/detect) — detector + live net (needs the API below)

## Train the person CNN — once

1. Put **20–30 photos of Hennen** (jpg/png, face visible) in `data/hennen/`
2. Install Python deps: `python3 -m pip install -r cnn/requirements.txt`
3. Lock him in:

```bash
python3 -m cnn train
```

That writes `models/hennen.pt` (gallery + tiny classifier). Public “not Hennen” faces are downloaded automatically into `data/not_hennen/` if that folder is empty.

**Do not retrain for every photo.** After `hennen.pt` exists, detection is a forward pass only.

## Start the detector API

```bash
python3 -m cnn serve
```

API: [http://127.0.0.1:43124](http://127.0.0.1:43124)  
Predict a file: `python3 -m cnn predict path/to/photo.jpg`

## Live neural net

While train or detect is running, activations and weights are written to `models/viz.json`. The detector page polls that snapshot and lerps a canvas at 60 FPS:

- **Neurons** = circles. Size and brightness follow the forward-pass activation.
- **Weights** = lines. Thickness = `|w|`. Mint = positive, magenta = negative.

Desktop Pygame window (optional): `python -m cnn viz` · also `python -m cnn train --viz` and `python -m cnn serve --viz`.

## How it is “as good as possible” with few pics

- **FaceNet** (Inception-ResNet) already trained on **VGGFace2** (~3.3 million faces) — frozen
- **MTCNN** crops/aligns the face so memes and messy photos still work
- **512-d embeddings** + Hennen prototype (average fingerprint)
- Tiny neural **head trained once** on those embeddings
- Horizontal-flip **TTA** at detect time
- Same recipe is checked on a public LFW identity with 25 shots: **91% cosine accuracy**, **100% tiny-head accuracy** on held-out faces (`python -m cnn benchmark`)

## Layout

- `src/` — 6-slide deck + `/detect` UI
- `cnn/` — train / serve / predict
- `data/hennen/` — your photos (required for training)
- `models/hennen.pt` — saved model after the one-time train
