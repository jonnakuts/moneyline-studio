# Pipeline: stages, gates, and files

This pipeline is adapted from a proven Claude Code × Remotion process for art-directed lyric videos.
Its three rules carry over unchanged:

1. **Freeze what's been approved.** Later stages read approved files but never change them.
2. **Review a picture, not code.** Every gate ends with something to watch or read.
3. **Prove quality on a small piece first.** A short hero proof sets the bar before the full render.

Our difference: instead of a song plus lyrics, our inputs are **verified data plus our own script**, and the
core principle becomes **"the meaning of the data drives the visual."**

---

## Per-video folder

Create one folder per video: `videos/YYYY-MM-DD-slug/` (date = the day work started).

```
videos/2026-10-20-how-netflix-makes-money/
  status.md                 current stage, gate states, next action (always kept up to date)
  LOCK.json                 frozen files with SHA-256 per approved stage
  00-pitch/
    pitch.md                topic, angle, viewer, promise, title+thumbnail concept, data check
  01-research/
    facts.json              every fact with source, date, locator  (schema: SOURCES_AND_VERIFICATION.md)
    research.md             narrative notes, open questions, rejected claims and why
    raw/                    downloaded source files (git-ignored if large; keep URLs in facts.json)
  02-script/
    script.md               narration with [F:id] tags and [BEAT] markers
    spoken.txt              plain narration text for TTS (numbers spelled for speech)
    verify-report.md        output of verify-script (must be PASS)
  03-voice/
    audio/narration.wav     (git-ignored)
    word-timestamps.json    [{word, start, end, conf}]
    phrases.json            sentences/phrases with their words and timing
    timing-report.md        low-confidence spots
    visemes.json            host mouth shapes from Rhubarb (if the host speaks)
    renders/sync-test.mp4   (git-ignored)
  04-direction/
    creative-direction.md
    visual-screenplay.json
    emphasis-map.json       pauses, stresses, section boundaries, music cues
    asset-list.md           footage/photos/music/SFX needed, with candidate sources
  05-proof/
    renders/hero-proof.mp4  (git-ignored)
    frames/                 8 representative PNGs (git-ignored)
    implementation-notes.md
  06-render/
    renders/section-*.mp4, renders/final.mp4   (git-ignored)
    qa-report.md
    captions.srt            closed captions for YouTube, from phrases.json
    contact-sheets/         (git-ignored)
  07-shorts/
    shorts-plan.md
    renders/short-*.mp4     (git-ignored)
  08-package/
    titles.md               5–10 options with rationale
    thumbnail-brief.md      concept, text, colors
    renders/thumb-*.png     (git-ignored)
    description.md          description with sources, chapters, disclosures
    tags.txt
    pinned-comment.md
    upload-checklist.md
  credits.json              every external asset with license + attribution
```

## status.md format

```markdown
# <working title>
Stage: 3 Voice & timing
Gate C: waiting for owner (sync-test.mp4 ready)
Next action: owner watches renders/sync-test.mp4 with sound and approves or lists wrong spots
Log:
- 2026-10-20 Gate A approved
- 2026-10-21 Gate B approved (script v3)
```

---

## Stages

### Stage 0: Topic & pitch → **GATE A**
Skill: `/new-video`

- Propose 3–5 topics (or take the owner's). For each: the one-sentence promise, who the one viewer is, why
  it's interesting now, and **whether the data exists** in our approved sources (`SOURCES_AND_VERIFICATION.md`).
- Package first: draft a working title and a thumbnail concept *before* scripting. If you can't make a
  title and thumbnail that someone would click, the topic is weak.
- Output: `00-pitch/pitch.md`.
- **Gate A:** owner picks the topic and approves the angle.

### Stage 1: Research → facts.json (no gate, automatic check)
Skill: `/research-facts`

- Fetch data from approved sources with the tools in `tools/research/`; save raw responses or documents
  to `01-research/raw/`.
- Record each fact in `facts.json` with source URL, retrieval date, locator (page/table/series ID), and tier.
- Run `verify-facts`: schema valid, every fact has a source, no Tier-3-only numbers, dates present.
- Output: `facts.json`, `research.md`. Continue straight to Stage 2 if verification passes.

### Stage 2: Script → **GATE B**
Skill: `/write-script`

- Write `script.md` following `docs/SCRIPT_GUIDE.md`. Every number and factual claim carries `[F:id]`.
- Derive `spoken.txt`: the same words written for the voice (numbers spelled out where TTS stumbles, no tags).
- Run `verify-script`: every number in `script.md` maps to a fact; values match (allowing stated rounding);
  no untagged numbers; `spoken.txt` matches `script.md` word-for-word except for number spelling.
- **Gate B:** present the script with each claim's source beside it, plus estimated length
  (≈150 words/minute). Owner approves or requests edits. On approval: **freeze** `facts.json`, `script.md`,
  `spoken.txt`.

### Stage 3: Voice & timing → **GATE C**
Skill: `/voice-and-timing`

- Generate narration with Kokoro from `spoken.txt` (voice and speed fixed in `assets/voice.json`).
- Align: `spoken.txt` is the source of truth for the **words**; the audio is the source of truth for the
  **timing**. Use faster-whisper word timestamps, then map them onto our known words. Never replace our
  words with the transcription.
- Output `word-timestamps.json`, `phrases.json`, `timing-report.md` (flag low-confidence words).
- Render a **sync-test video**: plain dark background, current phrase in the middle, the spoken word
  highlighted, and debug text at the bottom (time, phrase number, word, start→end). No design, no effects.
- **Gate C:** owner watches it with sound and approves or lists wrong spots. On approval: **freeze**
  narration audio, `word-timestamps.json`, `phrases.json`.

### Stage 4: Creative direction → **GATE D** (the most important stage)
Skill: `/creative-direction`

- Behave like a senior motion designer + data-journalism art director.
- Read the whole script and fact sheet. Design the video's **concept** (one idea that frames the story),
  its sections, intensity curve, and where the Money Line, the host, footage, and 3D appear.
- Write `creative-direction.md` and `visual-screenplay.json` (one entry per phrase, grouped into sequences;
  schema in `ENGINE_ARCHITECTURE.md`). Write `emphasis-map.json` (pauses, stressed words, section breaks,
  music cues). Write `asset-list.md`.
- **Self-review before showing:** reject generic, repetitive, template, unreadable, or misleading-chart
  ideas; count how often each visual idea repeats; redesign overused ones.
- **Gate D:** present the concept in one paragraph plus the **10 strongest visual moments** and the asset
  list. Owner approves or pushes back. On approval: **freeze** the direction files.

### Stage 5: Engine + hero proof → **GATE E**
Skill: `/build-and-render`

- First video: build the engine (`ENGINE_ARCHITECTURE.md`). Later videos: reuse it and add only the new
  primitives/scenes this screenplay needs.
- Pick the **most important ~10 seconds** (usually the hook or the biggest reveal). Implement it fully:
  final typography, backgrounds, graphics, transitions, camera, sound, timing. No placeholders.
- Render `hero-proof.mp4` and export 8 representative frames. Inspect the frames yourself and fix problems
  before showing them. Write `implementation-notes.md` (what was built, deviations, known weaknesses).
- **Gate E:** owner approves the quality bar or asks for changes. Keep this proof short: a polished 10
  seconds gets a decision faster than a rough minute.

### Stage 6: Full render → **GATE F**
Skill: `/build-and-render`

- Implement the rest section by section (≈60–90 s each). For each section: preview render at 960×540,
  generate a contact sheet (one frame every ~2 s), inspect it, fix issues, then move on.
- Run the QA checklist (`CREATIVE_BIBLE.md` § QA) on every section.
- Final render at 1920×1080, 30 fps, in resumable sections, then concatenate with FFmpeg and normalize
  audio loudness. Long renders: overnight locally, or the GitHub Actions workflow.
- Write `qa-report.md`.
- **Gate F:** owner watches the full video. Fixes re-render only affected sections.

### Stage 7: Shorts (part of **GATE G**)
Skill: `/package-video`

- Pick 3–4 moments that stand alone (one idea, one payoff, under 60 s).
- **Re-compose for 9:16, don't crop**: same scene logic, vertical layout, Shorts safe zones, word-by-word
  burned-in captions.
- If a Short needs a new first line for its hook, write it, run it through verify-script, generate and align
  it as a separate audio clip. Never edit the frozen long-form narration.

### Stage 8: Package → **GATE G**
Skill: `/package-video`

- `titles.md`: 5–10 title options, each paired with the thumbnail concept, checked for truncation and
  duplication with the thumbnail text.
- Thumbnail: 3 variants rendered with Satori (bold number/text, brand colors, a frame from the video or a
  code-drawn graphic). No AI images, no third-party logos.
- `description.md`: hook line, summary, chapters (validated: first at 0:00, at least 3, each ≥10 s), full
  source list from `facts.json`, credits from `credits.json`, disclosures (see `COMPLIANCE.md`).
- `tags.txt` (few and relevant), `pinned-comment.md`, `upload-checklist.md`.
- **Gate G:** owner reviews the whole package, then uploads manually.

---

## Freezing (LOCK.json)

On each gate approval, run `npm run freeze -- <slug> <stage>`. It writes:

```json
{
  "stages": {
    "B-script": {
      "approvedAt": "2026-10-21T15:04:00+05:30",
      "files": {
        "01-research/facts.json": "sha256:…",
        "02-script/script.md": "sha256:…",
        "02-script/spoken.txt": "sha256:…"
      }
    }
  }
}
```

`npm run verify -- <slug>` re-hashes every frozen file and fails loudly if anything changed. Run it at the
start of every stage.

**Unfreezing:** only with the owner's explicit OK. Remove that stage and every later stage from LOCK.json,
note why in `status.md`, and redo from that stage. (Changing the script means re-recording and re-timing
the narration, so Stages 3+ redo.)

## Starting a new session mid-video

1. Read `CLAUDE.md`, then `videos/<slug>/status.md`.
2. Run `npm run verify -- <slug>`.
3. Continue from the "Next action" line. Don't redo approved stages.
