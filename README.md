# Same Dude? — CNN Presentation

Short **6-slide** deck for presenting a meme/person CNN mini-project:

> Train on tons of pics of **one dude** → upload a new pic → model says **SAME DUDE** or **RANDOM DUDE**.

## Run

```bash
npm install
npm run dev -- --port 43123
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123)

**Controls:** ← → · Space · F fullscreen

## Put your real pics in

Replace the placeholders in `public/pics/`:

| File | Use |
|------|-----|
| `dude-1.svg` / `dude-2.svg` | Training examples of your person (use `.jpg` / `.png` and update paths in `src/data/slides.tsx`) |
| `random-1.svg` / `random-2.svg` | “Not him” examples |
| `query.svg` | The upload / test image |
| `result-yes.svg` | Optional result mock |

Point `src` on each `PicSlot` in `src/data/slides.tsx` at your files (e.g. `/pics/drake.jpg`).

## Slides (6)

1. Title + picture story  
2. What’s a CNN (30 sec)  
3. Project idea: one person, two answers  
4. Training pics with YES/NO slots  
5. Upload → verdict demo  
6. Takeaways + questions  
