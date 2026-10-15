# Moneyline Studio — instructions for Claude Code

> Read this file at the start of every session. It is the contract for how work happens in this repo.
> "Moneyline Studio" is a working name; rename freely.

## What this repo is

A personal, zero-cost pipeline that turns a money/business topic into a finished, upload-ready YouTube
package: an 8–15 minute long-form video (16:9), 3–4 Shorts (9:16), a thumbnail, and title/description/tags/
chapters. Videos are **code-rendered** (Remotion + React + TypeScript): data, typography, original SVG
graphics, and real licensed footage. **No AI-generated images or video, ever.**

The owner reviews and approves each stage, then uploads to YouTube manually.

**Niche:** Money & Business, Explained with Data, in English, for a global audience. YouTube's own
auto-dubbing handles other languages; we build nothing for that.

## Read these before doing related work

| When you are… | Read |
|---|---|
| Starting any video | `docs/PIPELINE.md` (stages, gates, file layout) |
| Researching or writing any number or claim | `docs/SOURCES_AND_VERIFICATION.md` |
| Writing a script, hook, or Short | `docs/SCRIPT_GUIDE.md` |
| Designing scenes, typography, color, motion | `docs/CREATIVE_BIBLE.md` |
| Building engine code or rendering | `docs/ENGINE_ARCHITECTURE.md` |
| Touching the host character | `docs/HOST_CHARACTER.md` |
| Packaging/uploading, music, footage rights | `docs/COMPLIANCE.md` |
| Unsure why something was decided | `docs/DECISIONS.md`, `docs/PROJECT_BRIEF.md` |
| Setting up the machine | `docs/SETUP_WINDOWS.md` |

Each pipeline stage also has a skill in `.claude/skills/` (`/new-video`, `/research-facts`, `/write-script`,
`/voice-and-timing`, `/creative-direction`, `/build-and-render`, `/package-video`).

## Non-negotiable rules

1. **Zero cost.** Never add a paid API, paid library, trial service, or anything that needs a payment card.
   If a task seems to need one, stop and tell the owner; propose a free alternative.
2. **No AI images or AI video.** Do not call, install, or wire up any image- or video-generation model or
   provider (no Stable Diffusion, FLUX, Veo, Kling, Sora, Runway, Gemini Omni, etc.), not even as a
   fallback. Allowed AI: an LLM for research help and writing (NVIDIA free API), text-to-speech for narration
   (Kokoro), speech recognition for timing (faster-whisper). Every visual is code, original SVG, real data,
   or real licensed footage/photos.
3. **No number or factual claim from memory.** Every number and non-obvious claim in a script must come from
   the video's `facts.json`, with a source URL and retrieval date, and be tagged `[F:id]` in the script.
   `verify-script` must pass before the script is shown for approval. If a fact can't be sourced, cut it.
4. **Stop at every gate.** Each stage ends at a gate (see `docs/PIPELINE.md`). Present the gate artifact,
   say exactly what the owner should check, then stop. Never start the next stage without explicit approval.
5. **Frozen means frozen.** Once a gate is approved, its artifacts are recorded with SHA-256 hashes in the
   video's `LOCK.json`. Never edit, regenerate, or "fix" a frozen file. If one must change, explain why and
   ask; on approval, unfreeze that stage and everything after it.
6. **Secrets never enter git.** This repo is public. Keys live only in `.env` (git-ignored) locally and in
   GitHub Actions Secrets. Never print a key, paste it in a file, a log, a commit, or an error message.
7. **Respect the machine.** The owner's laptop: Intel i3-1215U, 8 GB RAM, integrated graphics, Windows.
   Keep one heavy process at a time. No PyTorch/GPU-only models unless the owner asks. Preview renders at
   960×540; Remotion `--concurrency=2`. Long renders run overnight or in GitHub Actions.
8. **Deterministic renders.** No `Math.random()` without a seed, no `Date.now()`, no network calls during
   render. Same inputs must give the same frames.
9. **Meaning drives the visual.** Never cycle stock animations (zoom/slide/fade) per sentence. Every scene
   must answer: "what is this data saying, and how could that exist on screen?" See `docs/CREATIVE_BIBLE.md`.
10. **Rights are logged.** Every external asset (footage, photo, music, SFX, font) goes into the video's
    `credits.json` with source URL, license, and attribution text. No NonCommercial (NC) licenses, ever:
    a monetized channel is commercial use.
11. **Education, not advice.** Explain how money and businesses work. Never tell viewers to buy, sell, or
    invest in anything specific.

## Repo layout

```
CLAUDE.md, AGENTS.md, README.md
docs/                 Reference docs (read the table above)
.claude/skills/       One skill per pipeline stage
scripts/doctor.ps1    Phase 0 toolchain check (Windows PowerShell)
engine/               Remotion project (React/TS): primitives, scenes, compositions   [Phase 1+]
engine/SCENES_USED.md Log of scene concepts per video (variation rules)
tools/
  research/           Data fetchers (SEC EDGAR, FRED, World Bank…), facts.json helpers   [Phase 1]
  verify/             verify-facts, verify-script, freeze/verify-lock                    [Phase 1]
  audio/              Kokoro TTS, faster-whisper alignment, Rhubarb visemes (Python)    [Phase 2]
  thumbnail/          Satori thumbnail renderer                                          [Phase 4]
videos/<YYYY-MM-DD-slug>/   One folder per video (layout in docs/PIPELINE.md)
assets/               Shared fonts, SFX, music beds, host rig, with LICENSES.md
.github/workflows/    Render-in-the-cloud workflow                                       [Phase 4]
```

Folders marked with a phase do not exist yet; create them in that phase, following
`docs/ENGINE_ARCHITECTURE.md`.

## Commands

Only `scripts/doctor.ps1` exists so far (run it with
`powershell -ExecutionPolicy Bypass -File .\scripts\doctor.ps1`). As each command is created, add it here with one line on what it does, so future sessions
can rely on this list. Target set:

```
npm run doctor             check toolchain (node, python, ffmpeg, kokoro, whisper)
npm run studio             open Remotion Studio to preview scenes
npm run verify -- <slug>   run verify-facts + verify-script + verify-lock for one video
npm run freeze -- <slug> <stage>   hash a stage's approved files into LOCK.json
npm run render:preview -- <slug> <from> <to>   960×540 preview of a time range
npm run render:final -- <slug>   1920×1080 final, rendered in resumable sections
npm run shorts -- <slug>   render the approved Shorts
npm run thumb -- <slug>    render thumbnail variants with Satori
```

## Coding conventions

- TypeScript `strict`, Node 22 or newer (LTS), ES modules. Python 3.11 only for `tools/audio/`.
- Cross-platform scripts: write tooling in Node (or Python), not bash. The owner runs Windows; use
  `path.join`, never hard-coded `/` paths. If a shell snippet is unavoidable, give a PowerShell version.
- Small, named, pure functions of `frame` for animation. No global mutable state in compositions.
- Data contracts (facts, script, timestamps, screenplay) are JSON validated with `zod`; keep schemas in
  `engine/src/schemas/` and reuse them in `tools/`.
- Prefer SVG/CSS/Remotion-native techniques; use Three.js (`@remotion/three`) only for hero moments.
- Commit small and often. Commit messages say what changed and why. Never commit media files
  (`.mp4`, `.wav`, `.mp3`, renders): they are git-ignored.

## Working with the owner

- The owner is a student building this to learn and to earn. Explain in plain language; avoid jargon or
  define it in the same sentence.
- At a gate, show **pictures and short summaries, not code**: a sync-test video, contact sheets of frames,
  a top-10 list of visual moments, a script with sources beside each claim.
- Ask one clear question when a choice is genuinely theirs. Otherwise take the sensible default and say so.
- When something is uncertain (a source, a license, a policy), say so plainly rather than guessing.
- Keep `videos/<slug>/status.md` updated after every step so a new session can resume.

## Current status

- Phase 0 (machine setup): **not started**. Follow `docs/SETUP_WINDOWS.md`.
- Engine: not built. First video will build the engine (see `docs/ROADMAP.md`).
- Update this section whenever a phase completes.
