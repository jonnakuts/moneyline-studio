---
name: research-facts
description: Stage 1. Gather verified facts for an approved video pitch into facts.json, from primary and official sources only. Use after Gate A is approved, or whenever a script needs a new fact.
argument-hint: "[video-slug]"
---

# Research → facts.json

Read first: `docs/SOURCES_AND_VERIFICATION.md` (tiers, schema, never-use list).

## Steps

1. Read `videos/<slug>/00-pitch/pitch.md` and list every fact the story needs (numbers, dates, history,
   definitions). Put the list at the top of `01-research/research.md`.
2. For each fact, go to the **highest tier available**:
   - Company financials (US-listed) → SEC EDGAR:
     `npm run research -- sec concepts <TICKER> <words>` to find the right XBRL concept, then
     `npm run research -- sec annual <TICKER> <Concept> --slug <slug>`. Non-US companies → annual report.
   - Macro → `npm run research -- worldbank <COUNTRY> <INDICATOR> --slug <slug>` or
     `npm run research -- fred <SERIES> --slug <slug>`; else IMF, OECD, BLS/BEA, national statistics office.
   - Fetchers cache raw responses in `01-research/raw/` and write drafts to `01-research/candidates.json`.
     Review each draft (is the concept the thing the script will claim? which period?) and copy only the
     ones you need into `facts.json`, editing the `claim` wording to be exact.
   - History and qualitative claims → primary documents first; else two independent Tier-3 outlets.
   Use WebSearch/WebFetch to *find* sources, but record the primary URL, not a search result or summary.
3. Write each fact into `01-research/facts.json` with every required field: `period`, `asOf`, `tier`,
   `source.url`, `source.locator`, `retrievedAt`, and a `quote` for qualitative facts.
4. Computations (per-user, per-day, growth %, conversions, inflation-adjusted) become `derived` facts with
   `formula` + `inputs`. Exchange rates and CPI series are their own facts.
5. Note in `research.md`: claims you **rejected** and why (no source, conflicting sources, Tier-3 only),
   surprising findings that might change the angle, and open questions.
6. Run `npm run verify -- <slug> --facts` (verify-facts). Fix until OK. Remember: `value` is in base
   units (39001000000, not 39.0), percentages as percent numbers, spaces around `-` in formulas.
7. If the research changes the story's angle materially (e.g. the cold-open fact turns out false), tell
   the owner before scripting. Otherwise continue to `/write-script`.

## Rules

- The LLM (NVIDIA API or you) may summarize documents to help you **find** facts. It is never the source.
  Every number is copied from the source document or API response.
- Prefer the latest complete period (full fiscal year over trailing quarters) unless the story needs recency.
- Keep definitions exact ("paid memberships" ≠ "users"; "revenue" ≠ "profit").
- If a fact can't be sourced to the standard, it doesn't go in. Say so in `research.md`.
- Update `status.md` when done.
