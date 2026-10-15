# Project brief

## Goal

Build a personal system that produces **engaging, monetizable YouTube videos at zero cost, without any AI
image or AI video models**, and prove that this is possible.

- **Owner:** a single creator (this is not a product for others).
- **Output per video:** one long-form video (8–15 min, 16:9) plus 3–4 Shorts (9:16), a thumbnail, title
  options, a description with sources, tags, and chapters.
- **Automation level:** the system creates everything; the owner approves at each gate and uploads manually.
- **Main platform:** YouTube (long-form first, Shorts as a second format).

## Niche

**Money & Business, Explained with Data.** English, global audience.

Example topics: "How Netflix actually makes money", "What a ₹10 packet of noodles is really made of, in
money", "Why gold kept rising for 50 years", "How credit card companies profit from you".

Why this niche:
- Finance/business sits among the highest-paying advertiser categories on YouTube.
- Its natural visuals (charts, numbers, comparisons, maps, timelines) are what code animates best.
- Every video is built on different real data, so no two look alike. That is the strongest protection
  against YouTube's "inauthentic content" policy, which targets templated, mass-produced channels.
- Evergreen: explainers keep earning for years.

Guardrail: explain how money works. Never give investment advice.

## Constraints

| Constraint | Consequence |
|---|---|
| Zero cost | Only free/open-source tools and free API tiers. No trials, no cards. |
| No AI images/video | Visuals = code (Remotion/SVG/Three), real data, real licensed footage. |
| Every fact verified | Facts come from primary/official sources into `facts.json` before scripting. |
| Laptop: i3-1215U, 8 GB RAM, Intel UHD, Windows | Light toolchain; preview at 960×540; long renders overnight or in GitHub Actions. |
| Public GitHub repo | Secrets only in `.env` and GitHub Secrets; unlimited free Actions minutes. |
| English only | YouTube's auto-dubbing covers other languages. |

## What "engaging" means here

Engagement comes from, in order:
1. A strong script and hook (curiosity loops, specificity, value in the first 10 seconds).
2. Visuals driven by meaning, not templates: each number physically "does" what it means.
3. Constant visual change (a new visual idea every 2–4 seconds) without visual noise.
4. Sound: clear narration, purposeful SFX, a music bed with contrast.
5. A recognizable channel identity (the green Money Line, the host, the look).

## What's in

- Stage-gated pipeline with freezing, adapted from a proven Claude Code × Remotion lyric-video process
  (see `docs/PIPELINE.md` and the reference guide in `docs/DECISIONS.md` D-008).
- Fact sheet + automatic script verification.
- Remotion engine with reusable primitives and per-video bespoke scenes.
- Code-drawn host character with lip-sync.
- Satori thumbnails.

## What's out (for now)

- Auto-uploading to YouTube (owner uploads manually).
- Multi-language narration.
- AI image/video generation of any kind (permanent).
- A web dashboard (possible later on Cloudflare Pages + Supabase; see `docs/ROADMAP.md`).
- Selling the system to others.

## Success criteria for the first video

- Every number in it traces to a source in `facts.json`.
- Owner rates it "I'd watch this to the end" at the final gate.
- No frame looks like "AI animated some subtitles."
- Total spend: ₹0.
