# Sources & verification

**Rule zero: the model's memory is not a source.** No number, date, name, or factual claim enters a script
unless it is in the video's `facts.json` with a source a human can click and check.

This channel's value is trust. One wrong number in a finance video costs more than a week of uploads earns.

---

## Source tiers

### Tier 1: primary and official (preferred for every number)

**Companies**
- **SEC EDGAR** (US-listed companies): 10-K (annual), 10-Q (quarterly), 8-K (events), 20-F (foreign
  filers). Free JSON APIs at `data.sec.gov`, e.g. `companyfacts` (all XBRL-tagged financials for a company)
  and `submissions` (filing list). No key, but every request **must** send a descriptive `User-Agent` with
  contact info (`SEC_USER_AGENT` in `.env`). Keep requests well under SEC's fair-access rate limit
  (currently about 10 per second; throttle to 2–3).
- **Company investor-relations pages**: annual reports, shareholder letters, earnings releases and slides.
- **Stock-exchange filings** for non-US companies, e.g. NSE/BSE (India), LSE RNS (UK).

**Economy**
- **FRED** (Federal Reserve Bank of St. Louis): hundreds of thousands of US and international series.
  Free API key (`FRED_API_KEY`).
- **World Bank Open Data** (API v2): GDP, population, income, prices by country. No key.
- **IMF Data** (World Economic Outlook, IFS) and **OECD Data Explorer**: cross-country comparisons.
- **US BLS** (inflation/CPI, wages, jobs) and **US BEA** (GDP, spending; free key).
- **Central banks and statistics offices**, e.g. RBI DBIE, MOSPI, and data.gov.in (India); ECB; Bank of
  England; ONS.

### Tier 2: curated, cited aggregators

- **Our World in Data**: clean datasets with full citations, mostly CC BY. Always also record the
  *original* source that OWID cites.
- Official international reports (UN, WTO, BIS, IEA) when they are the primary publisher of the figure.

### Tier 3: reputable reporting (context, history, quotes; never the only source for a number)

- Major outlets with corrections policies (e.g. Reuters, AP, Financial Times, The Economist, Bloomberg,
  WSJ, BBC, The Hindu, Mint). Use for history and qualitative claims ("Netflix began as a DVD-by-mail
  service in 1997").
- A Tier-3 claim needs **two independent Tier-3 sources** or one Tier-1/2 confirmation.
- A Tier-3 number is allowed only if it's attributed on screen and in narration ("according to
  Reuters…"), and only when no Tier-1/2 figure exists.

### Never use

- AI-generated answers or summaries (including our own LLM's output) as a source.
- Blogs, content farms, SEO "statistics" pages, unsourced infographics, social posts, forums.
- Wikipedia as a citation. Use it only to find the primary source it cites, then cite that.
- Paywalled data we can't legally access or redistribute; unofficial stock-price scrapers.

---

## facts.json schema

```json
{
  "video": "2026-10-20-how-netflix-makes-money",
  "facts": [
    {
      "id": "nflx-rev-2025",
      "claim": "Netflix total revenue in fiscal year 2025",
      "value": 0,
      "unit": "USD",
      "scale": "billion",
      "period": "FY2025",
      "asOf": "2025-12-31",
      "kind": "reported",
      "tier": 1,
      "source": {
        "name": "Netflix, Inc. Form 10-K for fiscal year 2025",
        "url": "https://www.sec.gov/…",
        "locator": "Consolidated Statements of Operations, p. 45",
        "retrievedAt": "2026-10-20",
        "method": "api:sec-companyfacts"
      },
      "quote": "exact text or table cell copied from the source, when available",
      "notes": "Calendar-aligned fiscal year.",
      "rounding": "1 decimal place in narration"
    },
    {
      "id": "nflx-rev-per-sub-2025",
      "claim": "Netflix revenue per paid membership, FY2025",
      "kind": "derived",
      "formula": "nflx-rev-2025 / nflx-paid-members-2025",
      "inputs": ["nflx-rev-2025", "nflx-paid-members-2025"],
      "value": 0,
      "unit": "USD",
      "tier": 1,
      "notes": "Uses year-end memberships; say 'roughly' in narration."
    }
  ]
}
```

(The `0` values above are placeholders, not real figures.)

The schema is enforced by `engine/src/schemas/facts.ts` (zod). `npm run verify -- <slug> --facts` checks it.

Field rules:
- **`value` is always in base units**: `39001000000` for "$39.0 billion", `301600000` for "301.6 million".
  `scale` only says how to display it. Percentages are stored as the percent number (`15.85` = 15.85%);
  `ratio` is a plain fraction (`0.1585`).
- `unit` is one of: USD, INR, EUR, GBP, JPY, CNY, percent, ratio, count, people, years, days, hours,
  minutes, tonnes, kg, km, barrels, date, year, index, text.
- In `formula`, put spaces around minus signs (`a - b`), because fact IDs contain dashes.
- Tier-3 numbers need `"attributeAloud": true`; Tier-3 qualitative claims need a second, independent
  `source2` from a different site.
- `kind`: `reported` (copied from the source), `derived` (computed from other facts; `formula` + `inputs`
  required; the verifier recomputes it), or `qualitative` (a non-numeric claim; `value` may be a short
  string; needs a `quote`).
- `period` and `asOf` are always filled. A number without a date is not a fact.
- **Currency conversions** are themselves facts: the exchange rate with its date and source (e.g. RBI
  reference rate or FRED series), then a `derived` fact for the converted value.
- **Inflation adjustment** is a `derived` fact that cites the CPI series and base year used.
- Projections and estimates get `"kind": "reported"` plus `"isEstimate": true` and must be said as estimates.

---

## How the script uses facts

```markdown
In 2025, Netflix brought in about $X billion [F:nflx-rev-2025], roughly $Y from every paying
member [F:nflx-rev-per-sub-2025].
```

- Every number, date, percentage, rank, and named fact carries `[F:id]`.
- Rounding in narration must match the fact's `rounding` note. "About", "roughly", and "nearly" are used
  honestly (rounding down → "nearly"/"just under"; rounding up → "just over" is wrong).
- Comparisons must be like-for-like: same currency, same period type, same metric definition. If not,
  say so or don't compare.

## Verification steps (automatic)

`verify-facts` (Stage 1) checks:
- Schema valid; IDs unique; every fact has `source.url`, `retrievedAt`, `period`/`asOf`, and `tier`.
- Every `derived` fact recomputes to its stated value (within 0.5%).
- No number rests only on Tier 3 without the attribution flag.

How the fetchers help (Stage 1): `npm run research -- sec|worldbank|fred …` downloads data, caches
the raw response in `01-research/raw/`, and writes **draft** facts with full source fields to
`01-research/candidates.json`. Drafts are reviewed and only the ones the story needs are copied into
`facts.json`. Fetched API data still needs a human-readable check: open the filing or data page once and
confirm the definition matches what the script will claim.

`verify-script` (Stage 2) checks:
- Every numeric token in `script.md` (digits, written numbers, %, ₹/$/€, "billion", years) sits inside a
  sentence that carries an `[F:id]` tag, and the tagged fact's value matches after rounding.
- Every `[F:id]` exists in `facts.json`.
- `spoken.txt` equals `script.md` minus tags, except for allowed number spellings.
- Output: `02-script/verify-report.md` with PASS/FAIL per sentence. **Only PASS goes to Gate B.**

On-screen checks (Stage 6 QA): every on-screen number matches its fact; every chart shows its source
caption ("Source: Netflix 10-K, FY2025"); bar charts start at zero; axes and units are labeled.

## Human verification (Gate B)

The owner sees each claim next to its source link. Spot-check at least the 3 most important numbers by
opening the source. Anything that looks surprising gets checked first: surprising numbers are where
errors hide.

## Corrections policy

If an error is found after upload: pin a correction comment, add a correction note to the description,
fix `facts.json` with a `correction` field, and note the cause in `docs/DECISIONS.md` if it reveals a
process gap.

---

## Footage, photo, and music sources (no AI)

Record every asset in `credits.json`:

```json
{ "assets": [ {
  "file": "footage/nyc-street-01.mp4",
  "sourceUrl": "https://…",
  "author": "…",
  "license": "Pexels License",
  "licenseUrl": "https://www.pexels.com/license/",
  "attribution": "Video by … on Pexels",
  "usedIn": ["seq-04"],
  "checkedAt": "2026-10-22"
} ] }
```

| Source | Typical license | Notes |
|---|---|---|
| NASA images/video | Generally not copyrighted | Follow NASA's media usage guidelines: no implied endorsement; don't use NASA insignia/logos as branding. |
| Library of Congress | Varies per item | Use only items marked "no known restrictions" or public domain; record the rights statement. |
| Wikimedia Commons | Per file (PD, CC0, CC BY, CC BY-SA…) | Check each file page. Prefer PD/CC0/CC BY; avoid CC BY-SA unless the owner agrees; never NC/ND. |
| Archive.org | Per item; **much is not public domain** | Use only items with an explicit PD or CC license (not NC) on the item page. |
| Pexels / Pixabay | Free for commercial use, no attribution required | Credit anyway. Respect their restrictions: no implied endorsement by identifiable people, no trademark misuse. |
| Music: YouTube Audio Library | Free for YouTube videos, monetizable | Some tracks require attribution text; copy it exactly. |
| Music/SFX: Pixabay | Pixabay Content License | Check the track page; record it. |
| SFX: Kenney, freesound.org (CC0 only) | CC0 | Filter freesound to CC0 to avoid attribution/NC traps. |
| Fonts: Google Fonts | SIL OFL / Apache | Record each font in `assets/LICENSES.md`. |

**Never:** NonCommercial (NC) or NoDerivatives (ND) licenses, rips from YouTube/TV/films, Google Images,
company logos as decoration or in thumbnails, or any AI-generated asset.
