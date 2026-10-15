---
name: package-video
description: Stages 7 and 8. Create 3–4 Shorts re-composed for 9:16, render thumbnail variants with Satori, and write titles, description with sources and chapters, tags, pinned comment, and the upload checklist for Gate G. Use after Gate F.
argument-hint: "[video-slug]"
---

# Shorts + package → GATE G

Read first: `docs/SCRIPT_GUIDE.md` § Shorts, `docs/CREATIVE_BIBLE.md` §8 and §10, `docs/COMPLIANCE.md`.
If installed, use the user-level skills **/yt-shorts**, **/yt-package**, **/yt-seo**, **/yt-chapters**, and
**content-principles** (for Short hooks).

## Stage 7: Shorts

1. Pick **3–4 moments** that stand alone: one idea, one payoff, ≤60 s, strong first line. Write
   `07-shorts/shorts-plan.md` (time range, hook line, why it works alone).
2. If a Short needs a new opening line: write it, add `[F:id]` tags, run verify-script on it, voice it with
   the same Kokoro voice, and align it as a **separate** clip. Never edit the frozen narration.
3. **Re-compose for 9:16** (don't crop the 16:9 render): reuse the same sequences with vertical layouts,
   Shorts safe zones, and word-by-word burned captions (active word in green).
4. Render `07-shorts/renders/short-N.mp4` (1080×1920, 30 fps). Inspect a contact sheet for each.

## Stage 8: Package

1. **Titles** (`08-package/titles.md`): 5–10 options, each paired with a thumbnail concept; check
   truncation (~60 chars), no duplication between title and thumbnail text, no clickbait the video doesn't
   pay. Mark a recommended pair.
2. **Thumbnail:** write `thumbnail-brief.md` (concept, text, colors, focal object), then render 3 variants
   with `tools/thumbnail/` (Satori → PNG, 1280×720): one big number or 2–4 words in Archivo, LEDGER or
   RECEIPT world, one accent color, a code-drawn graphic, a frame from our render, or the host. Check
   readability at 160×90. No AI images, no third-party logos.
3. **Description** (`description.md`):
   - First 2 lines: the hook and the promise (shown before "more")
   - Short summary
   - **Chapters** from `emphasis-map.json` sections (first at 0:00, ≥3 chapters, each ≥10 s)
   - **Sources**: every fact source from `facts.json` (name + URL), deduplicated
   - **Credits**: from `credits.json`, with exact attribution text where required
   - "Narration uses a synthetic voice. All visuals are original motion graphics and licensed footage."
   - "For education only. Not financial advice."
4. **Tags** (`tags.txt`): 5–10 relevant ones (tags matter little; don't stuff).
5. **Pinned comment** (`pinned-comment.md`): a question that invites a real reply.
6. **Upload checklist** (`upload-checklist.md`): copy the checklist from `docs/COMPLIANCE.md` and tick what
   is already verified.
7. **GATE G:** present the recommended title + thumbnail pair (and alternatives), the Shorts list with
   paths, and the description. Ask for approval. **Stop and wait.** The owner uploads manually.

On approval: `npm run freeze -- <slug> G-package`, set `status.md` to "Ready to upload", and add a short
"what we learned" note to `docs/DECISIONS.md` if anything in the process should change.
