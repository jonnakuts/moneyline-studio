# Instructions for AI coding agents

This repo's full operating contract is in **`CLAUDE.md`**. Read it first and follow it exactly. That applies
to every agent (Claude Code, GitHub Copilot, Codex, Cursor, and others).

The short version:

1. Zero cost: no paid APIs, services, or libraries.
2. No AI-generated images or video. Visuals are code, original SVG, real data, or real licensed footage.
3. No number or claim from memory. Every fact comes from the video's `facts.json`, with its source.
4. Stop at every stage gate and wait for the owner's approval (`docs/PIPELINE.md`).
5. Never modify files recorded in a video's `LOCK.json`.
6. Never commit or print secrets. The repo is public.
7. The machine is a low-power Windows laptop (i3, 8 GB RAM, no GPU). Keep it light.

Stage-by-stage instructions live in `.claude/skills/*/SKILL.md`. They are plain Markdown, so agents that
don't load skills automatically can still read and follow them.
