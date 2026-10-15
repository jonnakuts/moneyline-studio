---
name: creative-direction
description: Stage 4, the most important stage. Design the video's concept, visual language, and full visual screenplay from the frozen script, facts, and timing, then self-review and present the top 10 moments for Gate D. Use after Gate C. Does not write render code.
argument-hint: "[video-slug]"
---

# Creative direction → GATE D

Read first: `docs/CREATIVE_BIBLE.md` (all of it), `engine/SCENES_USED.md` (what earlier videos used).

Act as a senior motion designer + data-journalism art director + creative developer. This is **not**
"add animations to a voiceover." The goal: a viewer should think a skilled motion designer and a data
journalist made it, not that "AI animated some subtitles."

> **The meaning of the data drives the visual.** For every phrase, ask: what is this actually saying, and
> how could that physically exist on screen?

Example of the thinking. Line: "Of every ₹649 you pay, about ₹X goes to licensing content."
- Not: number zooms in, then slides out.
- Instead: a RECEIPT prints the ₹649 line; the Money Line tears the receipt so the torn-off strip is
  exactly the licensing share, to scale; that strip curls up and becomes the film strip that carries us
  into the next scene about content spending.

## Steps

1. `npm run verify -- <slug>`: Gates B–C unchanged.
2. Read **all** of `script.md`, `facts.json`, `phrases.json`. Listen to the narration's pacing (use
   `phrases.json` timing and pauses).
3. Write `04-direction/creative-direction.md`:
   1. **Concept**: one framing idea for the whole video (e.g. "The Receipt Autopsy": the video dissects
      one receipt). One paragraph.
   2. Which **worlds** (LEDGER / RECEIPT / STREET) appear, where, and why
   3. **Money Line** arc: what it becomes across the video, and how it stays continuous
   4. Typography treatment within the system (hero words, scale, placement)
   5. Color use (where green and red carry meaning)
   6. Background/texture evolution by section
   7. **Intensity curve**: section by section, with deliberate quiet moments before big reveals
   8. Recurring motifs and the **payoff/callback** at the end
   9. Host appearances and their purpose
   10. Footage plan (what real footage proves or grounds; ≤25% runtime)
   11. Sound plan: music bed cues, SFX palette use
4. Write `04-direction/visual-screenplay.json` (schema in `docs/ENGINE_ARCHITECTURE.md`):
   - Group phrases into **sequences** (think phrase → sequence → section → video). Aim for one visual idea
     per ~2–4 seconds, but some phrases share one composition.
   - Every sequence states `meaning`, `visualConcept`, `semanticMetaphor`, `transitionIn/Out`, `factIds`,
     `intensity`.
   - Transitions are motivated: objects from one scene create the next.
5. Write `emphasis-map.json` (sections, pauses, stressed words, music cues) and `asset-list.md` (footage,
   photos, music, SFX needed, with candidate approved sources; original SVG to be drawn by us).
6. **Self-review before showing anything.** Reject and redesign sequences that are:
   generic · repetitive · just zoom/slide/fade · unrelated to the meaning · obvious template effects ·
   unreadable at narration speed · misleading as a chart (truncated axes, wrong scale) · repeats of an
   earlier sequence or of the previous video's opening. Count each scene concept: none more than 2×; at
   least 3 concepts new to the channel. Record the counts at the end of `creative-direction.md`.
7. **GATE D:** present: the concept paragraph, the **10 strongest visual moments** (one or two lines
   each, with timestamps), the intensity curve in one line per section, and the asset list summary. Ask:
   approve, or push back on anything generic. **Stop and wait.**

On approval: `npm run freeze -- <slug> D-direction`, update `status.md` and `engine/SCENES_USED.md`,
continue with `/build-and-render` (hero proof).

## Rules

- Don't write render code in this stage.
- Every on-screen number must reference a `factId`; don't introduce numbers the script doesn't say.
- Only plan assets from approved sources; original SVG/procedural graphics preferred. No AI imagery.
