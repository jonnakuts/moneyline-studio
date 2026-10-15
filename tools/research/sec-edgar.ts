/**
 * SEC EDGAR (US-listed companies). Free, no key, but SEC requires a descriptive User-Agent with
 * contact info (SEC_USER_AGENT in .env) and fair-access rate limits (we throttle to ~2.5 req/s).
 * Docs: https://www.sec.gov/search-filings/edgar-application-programming-interfaces
 */
import { getJson, type GetOptions } from "./http.js";
import { displayScale, slugId, type CandidateFact } from "./candidates.js";

export interface XbrlEntry {
  start?: string;
  end: string;
  val: number;
  accn: string;
  fy: number;
  fp: string;
  form: string;
  filed: string;
  frame?: string;
}

export interface CompanyFacts {
  cik: number;
  entityName: string;
  facts: Record<string, Record<string, { label: string | null; description: string | null; units: Record<string, XbrlEntry[]> }>>;
}

const ANNUAL_FORMS = new Set(["10-K", "10-K/A", "20-F", "20-F/A", "40-F", "40-F/A"]);

export function secHeaders(userAgent: string): Record<string, string> {
  if (!/@/.test(userAgent)) {
    throw new Error('SEC_USER_AGENT must include a contact email, e.g. "Your Name you@example.com"');
  }
  return { "User-Agent": userAgent, Accept: "application/json" };
}

export const pad10 = (cik: number | string) => String(cik).replace(/^0+/, "").padStart(10, "0");

export async function lookupCik(ticker: string, userAgent: string, opts: GetOptions = {}): Promise<{ cik: number; title: string }> {
  const { data } = await getJson<Record<string, { cik_str: number; ticker: string; title: string }>>(
    "https://www.sec.gov/files/company_tickers.json",
    { ...opts, headers: secHeaders(userAgent) },
  );
  const t = ticker.toUpperCase();
  const hit = Object.values(data).find((x) => x.ticker.toUpperCase() === t);
  if (!hit) throw new Error(`Ticker ${ticker} not found in SEC's ticker list`);
  return { cik: hit.cik_str, title: hit.title };
}

export async function companyFacts(cik: number, userAgent: string, opts: GetOptions = {}) {
  const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${pad10(cik)}.json`;
  const r = await getJson<CompanyFacts>(url, { ...opts, headers: secHeaders(userAgent) });
  return { facts: r.data, url: r.publicUrl };
}

/** Concepts whose name or label contains the search words. */
export function searchConcepts(cf: CompanyFacts, query: string): Array<{ taxonomy: string; concept: string; label: string; units: string[]; latestEnd?: string }> {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const out = [];
  for (const [taxonomy, concepts] of Object.entries(cf.facts)) {
    for (const [concept, c] of Object.entries(concepts)) {
      const hay = `${concept} ${c.label ?? ""}`.toLowerCase();
      if (words.every((w) => hay.includes(w))) {
        const all = Object.values(c.units).flat();
        const latestEnd = all.map((e) => e.end).sort().at(-1);
        out.push({ taxonomy, concept, label: c.label ?? concept, units: Object.keys(c.units), latestEnd });
      }
    }
  }
  return out.sort((a, b) => (b.latestEnd ?? "").localeCompare(a.latestEnd ?? ""));
}

const days = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 86_400_000;

export interface AnnualPoint extends XbrlEntry {
  /** "FY2025" (calendar-aligned) or "FY2025 (ends 06-30)". */
  periodLabel: string;
}

/**
 * Full-fiscal-year values from annual reports, one per period end. When a value was restated in a later
 * filing, the most recently filed figure wins.
 */
export function annualSeries(cf: CompanyFacts, concept: string, unit?: string, taxonomy?: string): AnnualPoint[] {
  const tax = taxonomy ?? Object.keys(cf.facts).find((t) => cf.facts[t]?.[concept]);
  const c = tax ? cf.facts[tax]?.[concept] : undefined;
  if (!c) throw new Error(`Concept ${concept} not found for ${cf.entityName}`);
  const u = unit ?? Object.keys(c.units)[0]!;
  const entries = c.units[u];
  if (!entries) throw new Error(`Unit ${u} not found for ${concept}; available: ${Object.keys(c.units).join(", ")}`);

  const isDuration = entries.some((e) => e.start);
  const annual = entries.filter((e) => {
    if (!ANNUAL_FORMS.has(e.form)) return false;
    if (isDuration) return e.start !== undefined && days(e.start, e.end) >= 350 && days(e.start, e.end) <= 380;
    return e.fp === "FY";
  });

  const byEnd = new Map<string, XbrlEntry>();
  for (const e of annual) {
    const prev = byEnd.get(e.end);
    if (!prev || e.filed > prev.filed) byEnd.set(e.end, e);
  }
  return [...byEnd.values()]
    .sort((a, b) => a.end.localeCompare(b.end))
    .map((e) => {
      const [y, mm, dd] = e.end.split("-");
      // Fiscal years ending in early January belong to the previous year (e.g. retailers).
      const fy = mm === "01" && Number(dd) <= 10 ? Number(y) - 1 : Number(y);
      const calendar = mm === "12" && Number(dd) >= 25;
      return { ...e, periodLabel: calendar ? `FY${fy}` : `FY${fy} (ends ${mm}-${dd})` };
    });
}

export function filingUrl(cik: number, accn: string): string {
  return `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accn.replace(/-/g, "")}/`;
}

function mapUnit(xbrlUnit: string): { unit: string; note?: string } {
  if (xbrlUnit === "USD") return { unit: "USD" };
  if (xbrlUnit === "USD/shares") return { unit: "USD", note: "per share" };
  if (xbrlUnit === "shares") return { unit: "count", note: "shares" };
  if (xbrlUnit === "pure") return { unit: "ratio" };
  if (/^[A-Z]{3}$/.test(xbrlUnit)) return { unit: xbrlUnit };
  return { unit: "count", note: `XBRL unit ${xbrlUnit}` };
}

export function toCandidates(
  cf: CompanyFacts,
  concept: string,
  points: AnnualPoint[],
  ticker: string,
  xbrlUnit: string,
  retrievedAt: string,
): CandidateFact[] {
  const { unit, note } = mapUnit(xbrlUnit);
  const tax = Object.keys(cf.facts).find((t) => cf.facts[t]?.[concept]) ?? "us-gaap";
  const label = cf.facts[tax]?.[concept]?.label ?? concept;
  return points.map((p) => ({
    id: slugId(ticker, concept, p.periodLabel.split(" ")[0]!),
    kind: "reported",
    claim: `${cf.entityName}: ${label}${note ? ` (${note})` : ""}, ${p.periodLabel}`,
    tier: 1,
    value: p.val,
    unit,
    scale: displayScale(p.val),
    period: p.periodLabel.split(" ")[0]!,
    asOf: p.end,
    source: {
      name: `${cf.entityName} Form ${p.form} filed ${p.filed}`,
      url: filingUrl(cf.cik, p.accn),
      locator: `XBRL ${tax}:${concept}${p.start ? `, ${p.start} to ${p.end}` : `, as of ${p.end}`}, accession ${p.accn}`,
      retrievedAt,
      method: "api:sec-companyfacts",
    },
    notes: `Check the definition in the filing before using (XBRL label: "${label}").`,
  }));
}
