/**
 * Research fetchers. Results print as a table; with --slug they are also cached in the video's
 * 01-research/raw/ and saved as drafts in 01-research/candidates.json (never straight into facts.json).
 *
 *   npm run research -- sec ticker NFLX
 *   npm run research -- sec concepts NFLX revenue
 *   npm run research -- sec annual NFLX Revenues [--unit USD] [--slug <video-slug>]
 *   npm run research -- worldbank IND NY.GDP.MKTP.CD [--from 2000] [--to 2025] [--slug <video-slug>]
 *   npm run research -- fred CPIAUCSL [--from 2000-01-01] [--to 2025-12-31] [--slug <video-slug>]
 */
import path from "node:path";
import { requireEnv } from "../lib/env.js";
import { repoRoot, today, videoDir } from "../lib/paths.js";
import { annualSeries, companyFacts, lookupCik, searchConcepts, toCandidates } from "./sec-edgar.js";
import { wbCandidates, worldBankSeries } from "./worldbank.js";
import { fredCandidates, fredSeries } from "./fred.js";
import { formatValue, saveCandidates, type CandidateFact } from "./candidates.js";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const positional = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
const slug = flag("--slug");
const videoFolder = slug ? videoDir(slug) : undefined;
const cacheDir = videoFolder ? path.join(videoFolder, "01-research", "raw") : path.join(repoRoot(), ".cache", "research");

function finish(cands: CandidateFact[]) {
  for (const c of cands) console.log(`  ${c.period.padEnd(12)} ${formatValue(c.value, c.unit).padEnd(28)} ${c.id}`);
  const latest = cands.at(-1);
  if (latest) console.log(`\nLatest source: ${latest.source.name}\n               ${latest.source.url}`);
  if (videoFolder) {
    const file = saveCandidates(videoFolder, cands);
    console.log(`\nSaved ${cands.length} draft(s) to ${path.relative(repoRoot(), file)}. Review before copying into facts.json.`);
  } else {
    console.log("\n(Add --slug <video-slug> to save these as drafts for a video.)");
  }
}

async function main() {
  const [source, a, b] = positional;
  if (source === "sec") {
    const ua = requireEnv("SEC_USER_AGENT");
    if (a === "ticker" && b) {
      const r = await lookupCik(b, ua, { cacheDir });
      console.log(`${b.toUpperCase()}: CIK ${r.cik} — ${r.title}`);
      return;
    }
    const ticker = a === "concepts" || a === "annual" ? b : undefined;
    if (!ticker) throw new Error("Usage: sec ticker|concepts|annual <TICKER> …");
    const { cik } = await lookupCik(ticker, ua, { cacheDir });
    const { facts: cf } = await companyFacts(cik, ua, { cacheDir });
    if (a === "concepts") {
      const q = positional.slice(3).join(" ");
      const hits = searchConcepts(cf, q).slice(0, 25);
      for (const h of hits) console.log(`  ${h.taxonomy}:${h.concept.padEnd(60)} latest ${h.latestEnd ?? "?"}  [${h.units.join(", ")}]  ${h.label}`);
      if (!hits.length) console.log("  no matching concepts");
      return;
    }
    const concept = positional[3];
    if (!concept) throw new Error("Usage: sec annual <TICKER> <Concept>");
    const unit = flag("--unit");
    const tax = Object.keys(cf.facts).find((t) => cf.facts[t]?.[concept]);
    const xbrlUnit = unit ?? (tax ? Object.keys(cf.facts[tax]![concept]!.units)[0]! : "USD");
    const points = annualSeries(cf, concept, xbrlUnit);
    console.log(`${cf.entityName} — ${concept} (${xbrlUnit}), full fiscal years from annual reports:\n`);
    finish(toCandidates(cf, concept, points, ticker, xbrlUnit, today()));
    return;
  }

  if (source === "worldbank") {
    if (!a || !b) throw new Error("Usage: worldbank <COUNTRY> <INDICATOR>");
    const from = Number(flag("--from") ?? 2000);
    const to = Number(flag("--to") ?? new Date().getFullYear());
    const { points } = await worldBankSeries(a, b, from, to, { cacheDir });
    console.log(`${points[0]?.countryName ?? a} — ${points[0]?.indicatorName ?? b}:\n`);
    finish(wbCandidates(points, b, today()));
    return;
  }

  if (source === "fred") {
    if (!a) throw new Error("Usage: fred <SERIES_ID>");
    const key = requireEnv("FRED_API_KEY");
    const r = await fredSeries(a, key, flag("--from"), flag("--to"), { cacheDir });
    console.log(`${r.info.title} (${r.info.units}, ${r.info.frequency}):\n`);
    finish(fredCandidates(r.info, r.unit, r.points, today()));
    return;
  }

  throw new Error("Usage: npm run research -- <sec|worldbank|fred> …  (see the header of tools/research/cli.ts)");
}

main().catch((e) => {
  console.error(`Error: ${(e as Error).message}`);
  process.exit(1);
});
