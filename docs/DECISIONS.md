# Decision log

Short records of why things are the way they are. Add new entries at the bottom; don't rewrite old ones.
If a decision is reversed, add a new entry that supersedes it.

Format: **D-NNN · date · title**: decision. *Why.* (Alternatives considered.)

---

**D-001 · 2026-10-15 · Purpose**: A personal system that makes engaging YouTube videos at zero cost with
no AI image or video models. *The core question is whether code-rendered, data-driven video can be
engaging without generative visuals.*

**D-002 · 2026-10-15 · Niche**: Money & Business, Explained with Data; English; global audience. *Among
the highest-paying ad categories; visuals suit code animation; unique data per video protects against the
inauthentic-content policy; evergreen.* (Runners-up: tech & AI explained; psychology with stickman stories.)

**D-003 · 2026-10-15 · No generative visuals, ever**: No AI images or AI video, including as fallback.
Allowed AI: LLM (writing help), TTS (narration), ASR (timing). *The owner's explicit goal.*

**D-004 · 2026-10-15 · Rendering engine**: Remotion (React/TS), plus GSAP for advanced tweens and
Three.js/React Three Fiber for a few 3D moments. *Mature, deterministic, renders headless with FFmpeg;
the reference lyric-video process used it.* (Motion Canvas and anime.js dropped as overlapping; HyperFrames
not needed as a separate engine.)

**D-005 · 2026-10-15 · Narration voice**: Kokoro, local on CPU. *Free, runs on the laptop, good English,
permissive license.* VibeVoice was evaluated: its long-form TTS code was removed from Microsoft's repo,
the remaining Realtime-0.5B model needs a GPU (Colab only for us), and Microsoft doesn't recommend it for
commercial use without further testing. Kept as an optional Colab A/B test.

**D-006 · 2026-10-15 · Where things run**: Build, preview, Shorts, and audio on the laptop; long final
renders overnight on the laptop or in GitHub Actions. Vercel/Cloudflare and Supabase are only for an
optional later dashboard. *Serverless free tiers can't run multi-minute Chrome+FFmpeg renders.*

**D-007 · 2026-10-15 · Public repo**: The repo is public. *Unlimited free GitHub Actions minutes for
standard runners.* Consequence: strict secrets hygiene; media and `.env` git-ignored; outside skills
without licenses (content-principles) are installed at user level, not committed.

**D-008 · 2026-10-15 · Process**: Adopt the staged, gated process from the owner's reference guides
("How we made a motion-designed lyric video with AI", Claude Code × Remotion; and the code-rendered
music-video pattern from nonunsaram/feel-the-agi-video and mexicat/pdoom-video). Kept: stage gates,
freezing with checksums, sync test, creative direction before code, hero proof, frame self-review, design
anti-patterns, a signature device. Changed: our own narration instead of a song; simple alignment on
known text; English only; bespoke direction on a reusable engine. *Per-video direction is what makes
videos engaging and keeps them clearly not templated.*

**D-009 · 2026-10-15 · Visual identity**: "Data editorial": LEDGER / RECEIPT / STREET worlds, navy
`#0A1020` base, Money Line green `#1FD67A`, loss red `#FF4D4F`. The Money Line is the signature device.
*Premium, readable, recognizable; green has an obvious money meaning.*

**D-010 · 2026-10-15 · Host character**: Yes, a code-drawn original host using the approach of
kevinbadi/claude-codes-influencers (code-drawn rig + Rhubarb lip-sync), moved into Remotion as an overlay.
Design TBD (see `HOST_CHARACTER.md`). *Personality and channel identity at zero cost.*

**D-011 · 2026-10-15 · Editing**: No separate editing tool. The edit is the code; Remotion renders the
finished video. Mastershot.app was evaluated: it's a set of manual browser tools with no automation, so
it's optional for manual trims only.

**D-012 · 2026-10-15 · Agent**: Instruction files written for Claude Code (`CLAUDE.md`, `.claude/skills/`).
`AGENTS.md` and `.github/copilot-instructions.md` let GitHub Copilot follow the same rules. *Claude Code
requires a paid Claude plan; Copilot (student pack) is the ₹0 option.*

**D-013 · 2026-10-15 · Facts discipline**: No number from memory; `facts.json` with sources; `[F:id]` tags;
automatic verify-script before Gate B; source captions on screen and full source list in descriptions.
*Trust is the channel's main asset.*
