---
name: voice-and-timing
description: Stage 3. Generate narration with Kokoro from the frozen spoken.txt, create word-level timestamps aligned to the known text, render a plain sync-test video, and present for Gate C. Use after Gate B.
argument-hint: "[video-slug]"
---

# Voice & timing → GATE C

Read first: `docs/ENGINE_ARCHITECTURE.md` § Audio pipeline.

`spoken.txt` is the source of truth for the **words**. The audio is the source of truth for the **timing**.
Never replace our words with a transcription.

## Steps

1. `npm run verify -- <slug>`: Gate B files must be unchanged.
2. **TTS per phrase:** run `tools/audio/tts.py` to synthesize each line of `spoken.txt` with the voice
   and speed in `assets/voice.json`. Join clips with fixed pauses (default 0.35 s within a section, 0.8 s
   between sections) into `03-voice/audio/narration.wav` (48 kHz mono). Record each phrase's start/end.
3. **Align:** run `tools/audio/align.py`: faster-whisper (`small.en`, int8, CPU; fall back to `base.en` if
   too slow) with word timestamps per phrase clip, then map onto our known words by sequence alignment;
   interpolate unmatched words within their phrase. Write `word-timestamps.json` and `phrases.json`
   (schemas in `ENGINE_ARCHITECTURE.md`, validated by zod), carrying each phrase's `factIds` from the script.
4. **Report:** `timing-report.md` listing phrases with low confidence or many interpolated words, plus any
   word Kokoro mispronounced (listen to the flagged spots; check numbers especially).
5. **Visemes:** if the script has `[HOST]` lines, run Rhubarb on those spans (with the text as dialog) →
   `03-voice/visemes.json`.
6. **Sync test:** render the `SyncTest` composition: 1280×720, 30 fps, plain `#0A1020` background,
   current phrase centered, active word highlighted in green, debug text at the bottom (time `mm:ss.mmm`,
   phrase number, current word, `start → end`). **No design, no effects.** Output
   `03-voice/renders/sync-test.mp4`.
7. **GATE C:** tell the owner the exact file path and what to check: words lighting up early/late, wrong
   pronunciations (especially numbers), awkward pauses, the flagged spots from the report. **Stop and wait.**

If pronunciation is wrong: fix the spelling in `spoken.txt` (ask first: it's frozen) or adjust phoneme
hints in the TTS tool, then regenerate. If timing is slightly off but audio is fine: adjust the alignment
code, never hand-edit timestamps silently.

On approval: `npm run freeze -- <slug> C-voice` (narration.wav, word-timestamps.json, phrases.json,
visemes.json), update `status.md`, continue with `/creative-direction`.

## Rules

- CPU only; one heavy process at a time (8 GB RAM).
- Don't start any visual design in this stage.
