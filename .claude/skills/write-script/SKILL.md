---
name: write-script
description: Stage 2. Write the narration script from the verified facts, tag every fact, generate spoken.txt, verify, and present for Gate B. Use after research passes verification, or when the owner asks for script edits.
argument-hint: "[video-slug]"
---

# Script → GATE B

Read first: `docs/SCRIPT_GUIDE.md`. If installed, also use the user-level skills **content-principles**
(apply silently to the hook and every line) and **/yt-script** (hooks + retention beats).

## Steps

1. Read `pitch.md`, `facts.json`, `research.md`.
2. Draft 3–5 cold-open hooks (first ~15 seconds). Pick the strongest by the principles in the guide (is the
   gap big, concrete, legible in ten words?). Keep the alternatives in a note for the owner.
3. Write `02-script/script.md`:
   - Sections with headings (`## Cold open`, `## …`), short sentences, one idea per sentence.
   - Every number/date/claim tagged `[F:id]`. Nothing numeric without a tag.
   - `[BEAT: …]` markers for big reveals, loop openings, and the ~60–70% re-hook.
   - `[HOST]` before lines the host says on camera.
   - Optional `<!-- visual: … -->` hunches for Stage 4 (not binding).
4. Write `02-script/spoken.txt`: same words, no tags/markers/comments, numbers spelled for speech where
   Kokoro may misread them (see the guide). One sentence per line.
5. Run `npm run verify -- <slug> --script`. Fix until PASS. Save the report to `02-script/verify-report.md`.
6. Self-review with the checklist at the end of `docs/SCRIPT_GUIDE.md`. Fix anything that fails.
7. **GATE B:** present to the owner:
   - The hook (and the 2 runner-up hooks, one line each)
   - Estimated length (words ÷ 150)
   - The script, with each tagged claim shown beside its source name + link (a table works well)
   - The 3 most important numbers to spot-check
   Ask: approve, or list changes. **Stop and wait.**

On approval: `npm run freeze -- <slug> B-script` (freezes `facts.json`, `script.md`, `spoken.txt`), update
`status.md`, continue with `/voice-and-timing`.

## Rules

- No new facts while scripting. If you need one, go back to `/research-facts`, then re-verify.
- No investment advice; estimates said as estimates; Tier-3 numbers attributed aloud.
- Edits after Gate B unfreeze Stages B onward (ask first; see `docs/PIPELINE.md`).
