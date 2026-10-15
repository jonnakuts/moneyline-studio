---
name: build-and-render
description: Stages 5 and 6. Build or extend the Remotion engine, render a ~10-second hero proof for Gate E, then implement and render the full video in sections with frame-level QA for Gate F. Use after Gate D, or when the owner asks to render a time range.
argument-hint: "[video-slug] [proof | section <from> <to> | final]"
---

# Build & render → GATE E, GATE F

Read first: `docs/ENGINE_ARCHITECTURE.md`, `docs/CREATIVE_BIBLE.md` (§3 motion, §8 safe zones, §11 QA).
Treat `creative-direction.md` and `visual-screenplay.json` as the creative source of truth. Don't redesign
the screenplay unless implementation reveals a real technical problem (then explain and ask).

## Stage 5: hero proof (`proof`)

1. `npm run verify -- <slug>`: Gates B–D unchanged.
2. **Engine:** if this is the first video, build the engine skeleton per `ENGINE_ARCHITECTURE.md`
   (theme, timing, camera, Money Line, typography, charts with SourceCaption, textures, utils with seeded
   random and easing families). Otherwise reuse it and add only what this screenplay needs.
3. Choose the **most important ~10 seconds** (the hook or the biggest reveal). Tell the owner which and why
   in one line.
4. Implement it **fully**: final typography, worlds/textures, original SVG graphics, the Money Line,
   camera, transitions, host (if present), footage (if present), SFX + music bed, timing synced to
   `word-timestamps.json`. No placeholders, no "polish later."
5. Render `05-proof/renders/hero-proof.mp4` (1920×1080, 30 fps, with audio). Export **8 representative
   frames** to `05-proof/frames/`.
6. **Look at the frames yourself** (Read the PNGs). Run the QA checklist. Fix what looks weak, especially
   anything that looks like a coding demo, then re-render.
7. Write `05-proof/implementation-notes.md`: architecture/components built, SVG assets created,
   deviations from the screenplay and why, known weaknesses, render time and performance notes.
8. **GATE E:** give the file path, the 8 frames, and 3 lines on what to judge (look, motion feel,
   readability). **Stop and wait.** If the owner asks for something faster or smaller, cut scope rather
   than quality.

## Stage 6: full video (`section <from> <to>` / `final`)

1. Implement the screenplay **section by section** (~60–90 s each), one file per sequence in
   `engine/src/sequences/<slug>/`.
2. For each section: preview render at 960×540 (`--concurrency=2`), make a contact sheet (one frame every
   ~2 s), inspect it, fix issues (clipping, overlaps, unreadable frames, teleporting objects, unmotivated
   transitions, wrong numbers), then move on. Log fixes in `06-render/qa-report.md`.
3. Check every on-screen number against `facts.json` (by factId) and every chart for a source caption.
4. **Final:** render 1920×1080 30 fps in resumable sections; skip sections whose input hash hasn't
   changed; concatenate with FFmpeg; mix narration + music (ducked) + SFX; normalize to ≈−14 LUFS
   integrated, true peak < −1 dBTP. Output `06-render/renders/final.mp4`. For long renders, offer the
   GitHub Actions workflow or an overnight local run.
5. Export captions: `06-render/captions.srt` from `phrases.json` (≤42 chars per line, ≤2 lines).
6. **GATE F:** give the path, the QA report summary, and the runtime. **Stop and wait.** Fixes re-render
   only affected sections.

On approval: `npm run freeze -- <slug> F-render`, update `status.md`, continue with `/package-video`.

## Rules

- Deterministic: seeded random only, no `Date.now()`, no network in render.
- Respect the laptop: close Studio while rendering, one render at a time.
- Inspect pictures, not just code. If it technically works but looks like a demo, it isn't finished.
- Every external asset used must already be in `credits.json` with a license.
