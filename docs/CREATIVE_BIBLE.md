# Creative bible

The channel's visual and sonic identity. Every video follows the **system** in this file, and every video
gets its own **concept** on top of it (Stage 4). The system is what makes the channel recognizable; the
per-video concept is what keeps it from looking templated.

> **Core principle: the meaning of the data drives the visual.**
> For every line, ask: "What is this number or idea actually saying, and how could that exist on screen?"
> Don't zoom one number and slide the next. Make a 30% fee physically take 30% of something.

---

## 1. Look: "data editorial"

Premium, calm, confident. Closer to a well-designed newspaper graphic than a flashy ad.

### Three visual worlds

| World | Used for | Look |
|---|---|---|
| **LEDGER** (default) | The argument: data, charts, the business model | Deep navy-black, faint ledger ruling (thin horizontal lines, one margin line), subtle film grain, soft light falloff from one corner |
| **RECEIPT** | "Your money" moments: what the viewer pays, everyday prices | Warm off-white thermal-paper texture, black mono print, torn/perforated edges, slight print misregistration |
| **STREET** | The real world: stores, cities, factories, history | Real licensed footage, gently graded (lifted blacks, slight desaturation), framed by LEDGER elements so it never feels like stock filler |

A video can move between worlds, but transitions must be motivated (see §4). Each world is a **system**
(texture, light, materials), never a flat background color.

### Color tokens

| Token | Value | Role |
|---|---|---|
| `bg.ledger` | `#0A1020` | LEDGER background |
| `ink.primary` | `#EAF0F7` | Main text on dark |
| `ink.muted` | `#8A97AD` | Labels, axes, secondary text |
| `rule` | `#EAF0F7` at 6% | Ledger lines, gridlines |
| `money` | `#1FD67A` | **The Money Line** and the one key number per scene |
| `loss` | `#FF4D4F` | Losses, drops, costs. Use sparingly. |
| `paper` | `#F4F1EA` | RECEIPT background |
| `paper.ink` | `#1B1B1B` | RECEIPT print |
| `highlight` | `#FFC24B` | Rare third accent (≤1 use per minute) |

At most **three colors** carry meaning in any frame. Green means "the money we're following," never
decoration.

### Typography (all SIL OFL, from Google Fonts)

| Job | Font | Notes |
|---|---|---|
| Headlines, hero words | **Archivo** (variable: weight + width) | Expanded width for impact, condensed for long phrases |
| Labels, body, captions | **Inter** | Clean, highly legible at small sizes |
| Numbers & data | **IBM Plex Mono** | Tabular figures so counting numbers don't jitter |
| RECEIPT print | **Space Mono** | Thermal-printer feel |
| Hand annotations | **Caveat** | Circling, arrows, "this →" notes |

Before the first video's engine build, render a **font test sheet** with the hardest strings from the
script (long numbers, ₹/$/€, %, fractions) and confirm every glyph looks right.

Hierarchy comes from scale, weight, width, position, and negative space. **Do not center everything.** Try
edge-aligned text, text sitting on the Money Line, numbers partly outside frame, one tiny word in huge
negative space.

## 2. Signature device: the Money Line

A single continuous **green line** is the channel's main character (inspired by the red pen line in the
reference process). It follows the money through every video.

It can become: an underline · a chart line · a price tag's string · a receipt's tear line · a timeline ·
a road or trade route on a map · a pipe in a "money machine" · a scale's beam · a stock ticker · a
signature on a contract · a crack when value breaks · a thread pulling a product apart.

Rules:
- **Continuity:** whenever possible, morph or extend the existing line rather than spawning a new one.
  Its identity across the whole video is the point.
- It draws like ink (along its path, with pen-pressure easing), never fades in.
- It is green only. A red line means a loss, and should feel like a wound or crack in the green one.

## 3. Motion system

Motion must feel designed. Different materials move with different physics:

| Material | Feel |
|---|---|
| Coins, cash, gold | Heavy: fast fall, hard impact, small damped bounce, settle |
| Paper, receipts, notes | Light: drift, flutter, curl at edges, air resistance |
| Numbers | Mechanical odometer roll; digits land with a tiny settle; tabular so they don't jitter |
| Ink, the Money Line | Draws along a path; pressure-like ease in and out |
| UI cards, glass panels | Snappy spring, slight overshoot, crisp |
| Rubber stamps ("APPROVED", "LOSS") | Fast drop → impact → compress → rebound → ink residue left behind |
| Bars and charts | Grow from the baseline with weight; lines draw left to right; values land on the beat of the narration |

Required qualities: anticipation, overshoot where it fits, follow-through, stagger, weight, inertia,
hierarchy, continuity.

**Banned (the "AI-coded motion graphics" look):** linear translateX slides · scale-from-zero pops ·
the same spring on every element · constant opacity fades · everything centered · every word entering
separately · random rotation · random glitch · hard scene resets · one easing curve for everything.

### Camera

A virtual 2.5D camera over a larger canvas. Scenes live on one continuous "ledger table." The camera can
push into a number, pull back to reveal it was part of a bigger chart, travel along the Money Line, or
pass through a digit into the next scene. Avoid "37 PowerPoint slides."

### Pacing

- A meaningful visual change roughly every **2–4 seconds**, but not noise: some moments deliberately go
  still and minimal so the next reveal hits harder.
- Build an **intensity curve** per video (Stage 4): quiet → build → reveal → breathe → bigger reveal.
  Never maximum intensity for ten minutes.

## 4. Transitions must have motivation

Avoid: scene → random wipe/zoom/glitch → next scene.

Instead, objects from scene A create scene B, for example:
- the Money Line extends from one number and becomes the next chart's axis
- a coin drops, and its ripple becomes a world map's ocean
- a receipt tears, and the tear line becomes a timeline
- the camera travels into the "0" of a number and emerges inside a vault/map/factory
- a bar from a chart rises until it becomes a skyscraper in STREET footage

## 5. Scenes vs primitives

Build reusable **primitives** (tools): `InkLine`, `CountUp`, `OdometerNumber`, `BarGrow`, `LineDraw`,
`StampImpact`, `ReceiptPrint`, `PaperTear`, `MaskReveal`, `CameraPush`, `Parallax`, `ParticleCoins`,
`Annotate` (hand-drawn circle/arrow), `FootageFrame`, `SourceCaption`, `HostOverlay`.

Then compose **semantic scenes** on top of them, chosen because the content justifies them, for example
(these are examples, not a menu):
- **ReceiptBreakdownScene:** where every rupee of a price actually goes, printed line by line
- **MoneyMachineScene:** a business model as a machine; inputs, gears, outputs, leaks
- **ScaleCompareScene:** two amounts on a balance or as physical stacks at true scale
- **FlowScene:** money literally flowing through pipes, sized by value (an honest Sankey)
- **TimelineTrackScene:** the Money Line as a timeline the camera rides
- **ShrinkingNoteScene:** a banknote shrinking over decades to show inflation

Never select a primitive at random per sentence. The screenplay picks scenes; primitives serve them.

### Variation rules (protects against "inauthentic content")

- No scene concept appears more than **twice** in one video.
- Every video introduces **at least 3 bespoke scene concepts** the channel hasn't used before.
- Consecutive videos must not open with the same scene type.
- Keep a log of scenes used per video in `engine/SCENES_USED.md`.

## 6. Data honesty on screen

- Bar charts start at zero. Axes and units are labeled. No 3D pie charts, no truncated axes for drama.
- Every chart or on-screen number shows a small **source caption** (`SourceCaption`): "Source: Netflix
  10-K, FY2025".
- Physical metaphors must be to scale when they claim to be ("this stack is 30% of that stack" must be
  30%).
- Estimates are visually marked (dashed line, "est." label).

## 7. Real footage (STREET)

- Only from approved sources with the license recorded (`SOURCES_AND_VERIFICATION.md`).
- Footage is evidence or texture, never filler: it should show the real thing being discussed.
- Always integrate it: framed, annotated, or interacting with the Money Line or typography.
- Max ~25% of total runtime as full-frame footage.

## 8. Captions and safe zones

**Long-form (16:9, 1920×1080):**
- No full burned-in captions. Upload an accurate SRT/VTT generated from `phrases.json` as YouTube closed
  captions.
- Key words appear as designed kinetic typography as part of scenes.
- Keep critical text out of the bottom ~12% (player controls and progress bar) and leave the last 10–20 s
  clear for end-screen elements.

**Shorts (9:16, 1080×1920):**
- Word-by-word burned captions in the brand style (Inter/Archivo, active word in `money` green).
- Critical text and numbers stay out of: bottom ~20% (title, channel, caption UI), right ~12%
  (like/comment/share buttons), top ~8%. Decoration may bleed.

## 9. Sound

- **Narration:** Kokoro voice fixed per channel (`assets/voice.json`); light EQ and compression; no
  reverb.
- **Music bed:** licensed (YouTube Audio Library, Pixabay); sits well under the voice (roughly 18–24 dB
  lower while speaking), rises in pauses and reveals. Change bed or intensity per section to support the
  intensity curve.
- **SFX palette (consistent across videos):** coin clink, odometer tick (on counts), paper rustle, receipt
  printer, stamp thud, ink scratch, soft whoosh on camera moves, low "drop" for loss moments. SFX support
  motion; they don't decorate silence.
- **Loudness:** final mix around −14 LUFS integrated, true peak below −1 dBTP.

## 10. Thumbnails

- One big number or 2–4 bold words (Archivo Expanded), one green or red accent, LEDGER or RECEIPT world.
- One clear focal object: a code-drawn graphic, a frame from our own render, or the host reacting.
- Must read at phone size. Text complements the title, never repeats it.
- No AI images, no third-party logos, no misleading claims.

## 11. QA checklist (every section, Stage 5–6)

Inspect rendered frames, not just code:

1. Narration sync: visuals land on the words they illustrate
2. Every on-screen number matches `facts.json`; every chart has a source caption
3. Text clipping, frame-edge cut-offs, accidental overlaps
4. Unreadable frames (too fast, too small, low contrast)
5. Safe zones respected (long-form controls/end screen; Shorts UI)
6. Weak or unmotivated transitions; objects teleporting between states
7. Repetitive movement; mechanically linear motion
8. Chart honesty (zero baselines, labels, scale)
9. Too much happening for the time available
10. Audio: voice clarity, music level, SFX timing, loudness
11. Determinism: re-rendering a frame gives the same pixels

> Don't optimize for "technically complete." Optimize for: *"Would a viewer believe a skilled motion
> designer and a data journalist made this?"* If a scene works but looks like a coding demo, it isn't done.
