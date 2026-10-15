/**
 * FRED (Federal Reserve Bank of St. Louis). Free API key: FRED_API_KEY in .env.
 * Series search: https://fred.stlouisfed.org (e.g. CPIAUCSL = US CPI, all urban consumers).
 */
import { getJson, type GetOptions } from "./http.js";
import { slugId, type CandidateFact } from "./candidates.js";

interface FredSeriesInfo {
  seriess: Array<{ id: string; title: string; units: string; frequency: string; last_updated: string; seasonal_adjustment_short?: string }>;
}
interface FredObs {
  observations: Array<{ date: string; value: string }>;
}

export interface FredPoint {
  date: string;
  /** Value converted to base units where FRED states a scale ("Billions of Dollars" → ×1e9). */
  value: number;
  rawValue: number;
}

/** FRED reports values in scaled units; convert to base units and map to our Unit enum. */
export function fredUnit(units: string): { unit: string; multiplier: number } {
  const u = units.toLowerCase();
  const multiplier = u.startsWith("trillions") ? 1e12 : u.startsWith("billions") ? 1e9 : u.startsWith("millions") ? 1e6 : u.startsWith("thousands") ? 1e3 : 1;
  if (u.includes("percent")) return { unit: "percent", multiplier: 1 };
  if (u.includes("index")) return { unit: "index", multiplier: 1 };
  if (u.includes("dollars")) return { unit: "USD", multiplier };
  if (u.includes("persons") || u.includes("people")) return { unit: "people", multiplier };
  return { unit: "count", multiplier };
}

export async function fredSeries(seriesId: string, apiKey: string, from?: string, to?: string, opts: GetOptions = {}) {
  const base = "https://api.stlouisfed.org/fred";
  const common = `api_key=${encodeURIComponent(apiKey)}&file_type=json`;
  const redact = { ...opts, redactParams: ["api_key"] };
  const info = await getJson<FredSeriesInfo>(`${base}/series?series_id=${encodeURIComponent(seriesId)}&${common}`, redact);
  const s = info.data.seriess?.[0];
  if (!s) throw new Error(`FRED series ${seriesId} not found`);
  let url = `${base}/series/observations?series_id=${encodeURIComponent(seriesId)}&${common}`;
  if (from) url += `&observation_start=${from}`;
  if (to) url += `&observation_end=${to}`;
  const obs = await getJson<FredObs>(url, redact);
  const { unit, multiplier } = fredUnit(s.units);
  const points: FredPoint[] = obs.data.observations
    .filter((o) => o.value !== "." && o.value !== "")
    .map((o) => ({ date: o.date, rawValue: Number(o.value), value: Number(o.value) * multiplier }));
  return { info: s, unit, multiplier, points };
}

export function fredCandidates(
  info: FredSeriesInfo["seriess"][number],
  unit: string,
  points: FredPoint[],
  retrievedAt: string,
): CandidateFact[] {
  return points.map((p) => ({
    id: slugId("fred", info.id, p.date),
    kind: "reported",
    claim: `${info.title}, ${p.date} (${info.frequency}${info.seasonal_adjustment_short ? ", " + info.seasonal_adjustment_short : ""})`,
    tier: 1,
    value: p.value,
    unit,
    scale: "none",
    period: p.date,
    asOf: p.date,
    source: {
      name: `FRED, Federal Reserve Bank of St. Louis: ${info.title}`,
      url: `https://fred.stlouisfed.org/series/${info.id}`,
      locator: `Series ${info.id}, observation ${p.date}, units "${info.units}" (last updated ${info.last_updated})`,
      retrievedAt,
      method: "api:fred",
    },
    notes: "FRED is the distributor; the original source (e.g. BLS, BEA) is named on the series page. Record it in notes.",
  }));
}
