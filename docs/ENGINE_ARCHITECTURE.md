# Engine architecture

Technical design for the rendering engine and the tools around it. Built during the first video (Stage 5),
then extended video by video.

## Principles

- **Every visual is a pure function of the frame number** plus frozen data (timestamps, screenplay, facts).
- **Deterministic:** seeded randomness only (`utils/random.ts`), no `Date.now()`, no network during
  render. All assets are local files.
- **Data-driven, not hard-coded:** numbers on screen are read from `facts.json` by fact ID, never typed
  into components.
- **Light on the laptop:** SVG/CSS first; Canvas only when it clearly helps; Three.js only for a few hero
  moments; precompute paths and layouts.

## Toolchain

| Part | Tech |
|---|---|
| Engine | Remotion (React + TypeScript), Node 22 |
| Advanced tweens | GSAP, driven by seeking a paused timeline to `frame / fps` (never real time) |
| 3D hero moments | Three.js via `@remotion/three` (React Three Fiber) |
| Thumbnails | Satori (JSX → SVG) + `@resvg/resvg-js` (SVG → PNG) |
| Schemas | `zod`, shared by engine and tools |
| Audio tools | Python 3.11: Kokoro (prefer the ONNX build for CPU), faster-whisper (CPU int8), Rhubarb binary |
| Media | FFmpeg (concat, loudness normalization, audio mix) |

Remotion's license is free for individuals; confirm the current terms on remotion.dev before monetizing
and record the check in `docs/DECISIONS.md`.

## Folder layout

```
engine/
  package.json
  remotion.config.ts
  src/
    Root.tsx                    registers compositions (long-form, shorts, sync-test, hero-proof)
    schemas/                    zod: facts, wordTimestamps, phrases, screenplay, emphasisMap, credits
    timing/                     loads frozen JSON; narration clock; word/phrase lookup by frame
    theme/                      color tokens, fonts, spacing, safe zones (from CREATIVE_BIBLE.md)
    typography/                 kinetic text, odometer numbers, text-on-path, annotation
    graphics/                   Money Line system, original SVG assets (coins, receipts, notes, machines)
    charts/                     honest bar/line/area/flow charts with SourceCaption
    effects/                    grain, print misregistration, stamp impact, paper tear, ink bleed
    camera/                     2.5D camera over a large canvas, parallax layers
    backgrounds/                LEDGER, RECEIPT, STREET framing systems
    footage/                    FootageFrame: trims, grade, framing, annotation over real video
    host/                       HostOverlay: rig, visemes, blinks, poses
    sequences/<video-slug>/     one file per screenplay sequence for that video
    compositions/               LongForm.tsx, Short.tsx, SyncTest.tsx, HeroProof.tsx
    utils/                      easing families, physics springs, seeded random, geometry
  SCENES_USED.md                log of scene concepts per video (variation rules)
tools/
  research/                     sec-edgar.ts, fred.ts, worldbank.ts, imf.ts, oecd.ts, owid.ts
  verify/                       verify-facts.ts, verify-script.ts, freeze.ts, verify-lock.ts
  audio/                        tts.py, align.py, visemes.py, requirements.txt
  thumbnail/                    render-thumb.tsx (Satori)
  doctor.ts                     toolchain check
```

## Data contracts

### word-timestamps.json
```json
[{ "i": 0, "word": "Netflix", "start": 0.42, "end": 0.81, "conf": 0.97, "phrase": 0 }]
```

### phrases.json
```json
[{ "i": 0, "text": "Netflix made more money last year than…", "start": 0.42, "end": 3.10,
   "words": [0, 1, 2, 3], "factIds": ["nflx-rev-2025"], "section": "cold-open" }]
```

### visual-screenplay.json (one entry per phrase; sequences group them)
```json
{
  "concept": "One-paragraph concept of the whole video",
  "worlds": ["LEDGER", "RECEIPT", "STREET"],
  "sequences": [{
    "id": "seq-01",
    "phrases": [0, 1, 2],
    "start": 0.42, "end": 9.80,
    "meaning": "What this part is actually saying",
    "heroWords": ["more money"],
    "factIds": ["nflx-rev-2025"],
    "visualConcept": "…",
    "semanticMetaphor": "…",
    "world": "LEDGER",
    "typographyTreatment": "…",
    "graphics": ["MoneyLine→chart axis", "OdometerNumber"],
    "footage": [],
    "host": { "on": true, "pose": "shock", "placement": "bottom-left" },
    "camera": "push into the 0 of the revenue figure",
    "transitionIn": "…",
    "transitionOut": "Money Line extends to become the next chart's x-axis",
    "sound": ["odometer tick", "low drop on reveal"],
    "intensity": 7,
    "customAssetsNeeded": [],
    "notes": ""
  }]
}
```

### emphasis-map.json
```json
{ "sections": [{ "id": "cold-open", "start": 0, "end": 31.2 }],
  "pauses": [{ "at": 12.4, "length": 0.6 }],
  "stress": [{ "word": 14, "strength": 0.8 }],
  "music": [{ "at": 0, "cue": "bed-a-low" }, { "at": 31.2, "cue": "bed-a-rise" }] }
```

Narration has no musical beat, so the emphasis map replaces the reference process's beat map: sentence
boundaries, pauses, and stressed words drive secondary motion and cuts.

## Audio pipeline (tools/audio, Python 3.11, CPU only)

1. **TTS per phrase:** synthesize each sentence of `spoken.txt` separately with Kokoro (fixed voice and
   speed from `assets/voice.json`), then join them with fixed pauses. This gives exact phrase boundaries
   for free.
2. **Word timing:** run faster-whisper (`small.en` or `base.en`, `compute_type=int8`) with word timestamps
   on each phrase clip. Align its words to *our* known words (sequence alignment); interpolate any
   unmatched word inside its phrase. Our text is always kept.
3. **Confidence report:** flag phrases where many words were interpolated.
4. **Visemes:** Rhubarb on host lines (with the known text as dialog input).
5. **Mix (Stage 6):** FFmpeg mixes narration + music bed (ducked) + SFX, then normalizes to around −14 LUFS.

If faster-whisper is too slow on the laptop, use `base.en`. Both are free and local.

## Rendering

| Render | Settings | Where |
|---|---|---|
| Sync test | 1280×720, 30 fps, plain | Laptop |
| Previews | 960×540, 30 fps, `--concurrency=2`, single sections | Laptop |
| Hero proof | 1920×1080, 30 fps, ~10 s | Laptop |
| Final long-form | 1920×1080, 30 fps, sections of ~60–90 s, then FFmpeg concat | Laptop overnight, or GitHub Actions |
| Shorts | 1080×1920, 30 fps | Laptop |

- **Resumable:** each section renders to its own file; a section that already exists with a matching
  input hash is skipped. Concatenate with FFmpeg's concat demuxer.
- **Contact sheets:** after each section, extract one frame every ~2 s into a grid PNG for review.
- **Memory:** close Remotion Studio while rendering; one render at a time.

## GitHub Actions render (Phase 4)

A manually triggered workflow (`workflow_dispatch`, input: video slug) that installs Node + FFmpeg,
restores the frozen inputs, renders sections in parallel jobs, concatenates, and uploads `final.mp4` as a
workflow artifact. Narration audio and footage are passed as a release asset or artifact, not committed.
Public repo → standard runner minutes are free. Artifacts expire, so download promptly.

## Performance notes for the i3 / 8 GB laptop

- Prefer transforms and opacity over filters; avoid large blur filters on full-frame layers.
- Pre-render heavy static textures (grain, paper) once to image sequences or images.
- Keep Three.js scenes low-poly with simple materials; limit to a few seconds per video.
- If a preview is slow, render half resolution or every second frame for review.
