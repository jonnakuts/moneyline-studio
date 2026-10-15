# Moneyline Studio

A personal, zero-cost pipeline for a faceless YouTube channel: **Money & Business, Explained with Data.**

Topic in → verified fact sheet → approved script → narration → code-rendered video (Remotion) → Shorts,
thumbnail, and upload metadata out. Every stage stops for human approval. No AI-generated images or video;
every visual is code, original SVG graphics, real data, or real licensed footage.

## How it works

```
 0 Topic & pitch ──► GATE A
 1 Research → facts.json (every number sourced)
 2 Script (numbers tagged to facts) ──► GATE B
 3 Narration (Kokoro) → word timing → sync-test video ──► GATE C → frozen
 4 Creative direction + visual screenplay ──► GATE D
 5 Engine + 10-second hero proof ──► GATE E
 6 Full render in sections + frame QA ──► GATE F
 7 Shorts + 8 Package (thumbnail, title, description w/ sources, tags, chapters) ──► GATE G
   → owner uploads manually
```

Details: [`docs/PIPELINE.md`](docs/PIPELINE.md).

## Stack (all free)

| Job | Tool |
|---|---|
| Rendering | Remotion (React/TS), GSAP, Three.js via React Three Fiber |
| Thumbnails | Satori |
| Script help | NVIDIA's free hosted LLM API (OpenAI-compatible) |
| Narration | Kokoro TTS (local, CPU) |
| Word timing | faster-whisper (local, CPU) |
| Host lip-sync | Rhubarb Lip Sync |
| Data | SEC EDGAR, FRED, World Bank, IMF, OECD, BLS, BEA, Our World in Data |
| Footage | NASA, Library of Congress, Wikimedia Commons, Archive.org, Pexels, Pixabay |
| Agent | Claude Code (or GitHub Copilot, via `AGENTS.md`) |

## Start here

1. Set up the machine: [`docs/SETUP_WINDOWS.md`](docs/SETUP_WINDOWS.md)
2. Read the operating contract: [`CLAUDE.md`](CLAUDE.md)
3. In Claude Code, run `/new-video` with a topic.

## Docs

- [Project brief](docs/PROJECT_BRIEF.md): goal, constraints, what's in and out
- [Pipeline](docs/PIPELINE.md): stages, gates, file layout, freezing
- [Sources & verification](docs/SOURCES_AND_VERIFICATION.md): where facts come from and how they're checked
- [Script guide](docs/SCRIPT_GUIDE.md): structure, hooks, voice
- [Creative bible](docs/CREATIVE_BIBLE.md): the channel's look, motion, and sound
- [Host character](docs/HOST_CHARACTER.md)
- [Engine architecture](docs/ENGINE_ARCHITECTURE.md)
- [Compliance](docs/COMPLIANCE.md): YouTube policy, rights, disclosures
- [Roadmap](docs/ROADMAP.md) · [Decisions](docs/DECISIONS.md) · [Repos used](docs/REPOS.md)

## Note on this public repo

The code is public. Secrets never are: keys live in `.env` (git-ignored) and in GitHub Actions Secrets.
Rendered media is git-ignored too.
