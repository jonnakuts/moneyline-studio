---
name: new-video
description: Start a new video or resume one in progress. Use when the owner gives a topic, asks for topic ideas, says "new video", or asks to continue a video. Creates the video folder, runs Stage 0 (topic and pitch) up to Gate A, and routes to the right stage skill.
argument-hint: "[topic or video-slug]"
---

# New video / resume video

Input: `$ARGUMENTS` (a topic, a slug of an existing video, or empty).

## If it's an existing slug (resume)

1. Read `CLAUDE.md`, then `videos/<slug>/status.md`.
2. Run `npm run verify -- <slug>` (once it exists). If anything frozen changed, stop and report it.
3. Continue from the "Next action" line using the matching stage skill:
   research → `/research-facts`, script → `/write-script`, voice → `/voice-and-timing`,
   direction → `/creative-direction`, proof/render → `/build-and-render`, shorts/package → `/package-video`.

## If it's a topic or empty (new video): Stage 0

1. If empty, propose **5 topics** in the niche (Money & Business, Explained with Data). Favor topics where:
   - the viewer already touches the product or money (subscriptions, EMIs, cards, groceries, apps),
   - Tier-1 data exists (SEC filings, annual reports, FRED, World Bank…),
   - a clear "how does that even make money?" or "where does my money go?" question exists,
   - the visual metaphor is strong.
   If `/yt-viral` is installed, use it to check what's overperforming in the niche (public listings only).
2. For the chosen topic, write `videos/YYYY-MM-DD-slug/00-pitch/pitch.md`:
   - **Promise** (one sentence): what the viewer will understand by the end
   - **The one viewer** and what they already know
   - **Cold-open idea**: the first surprising, concrete fact (marked "to verify"; no numbers as fact yet)
   - **Curiosity chain**: 3–5 questions the video will open and pay
   - **Data check**: which approved sources likely hold the numbers (`docs/SOURCES_AND_VERIFICATION.md`),
     and any risk that they don't
   - **Working title + thumbnail concept** (package first; use `/yt-package` if installed)
   - **Visual hunch**: one strong metaphor (per `docs/CREATIVE_BIBLE.md`)
   - **Target length** (8–15 min)
3. Create `status.md` (format in `docs/PIPELINE.md`) and `credits.json` (`{"assets": []}`).
4. **GATE A:** show the pitch briefly (promise, title + thumbnail concept, data check). Ask the owner to
   approve, change the angle, or pick another topic. **Stop and wait.**

On approval: update `status.md` (Gate A approved, date), then continue with `/research-facts`.

## Rules

- No numbers stated as facts in the pitch; anything numeric is a lead "to verify".
- Don't start research before Gate A is approved.
