/**
 * World Bank Open Data, API v2. Free, no key.
 * Indicator codes: https://data.worldbank.org/indicator (e.g. NY.GDP.MKTP.CD = GDP, current US$).
 */
import { getJson, type GetOptions } from "./http.js";
import { displayScale, slugId, type CandidateFact } from "./candidates.js";

interface WbRow {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  countryiso3code: string;
  date: string;
  value: number | null;
  unit: string;
}
type WbResponse = [{ page: number; pages: number; total: number; lastupdated?: string; message?: unknown }, WbRow[] | null];

export interface WbPoint {
  year: number;
  value: number;
  indicatorName: string;
  countryName: string;
  countryId: string;
  lastUpdated?: string;
}

export async function worldBankSeries(country: string, indicator: string, from: number, to: number, opts: GetOptions = {}) {
  const url = `https://api.worldbank.org/v2/country/${encodeURIComponent(country)}/indicator/${encodeURIComponent(indicator)}?format=json&per_page=1000&date=${from}:${to}`;
  const { data, publicUrl } = await getJson<WbResponse>(url, opts);
  if (!Array.isArray(data) || data.length < 2) {
    throw new Error(`World Bank returned no data for ${country}/${indicator} (check the codes)`);
  }
  const meta = data[0];
  const rows = data[1] ?? [];
  const points: WbPoint[] = rows
    .filter((r) => r.value !== null)
    .map((r) => ({
      year: Number(r.date),
      value: r.value as number,
      indicatorName: r.indicator.value,
      countryName: r.country.value,
      countryId: r.country.id,
      lastUpdated: meta.lastupdated,
    }))
    .sort((a, b) => a.year - b.year);
  return { points, apiUrl: publicUrl };
}

function guessUnit(name: string): string {
  if (/current US\$|constant .*US\$|\(US\$\)|US\$/.test(name)) return "USD";
  if (/%/.test(name)) return "percent";
  if (/population|people|persons/i.test(name)) return "people";
  return "index";
}

export function wbCandidates(points: WbPoint[], indicator: string, retrievedAt: string): CandidateFact[] {
  return points.map((p) => {
    const unit = guessUnit(p.indicatorName);
    return {
      id: slugId("wb", p.countryId, indicator, p.year),
      kind: "reported",
      claim: `${p.countryName}: ${p.indicatorName}, ${p.year}`,
      tier: 1,
      value: p.value,
      unit,
      scale: unit === "percent" ? "none" : displayScale(p.value),
      period: String(p.year),
      asOf: `${p.year}-12-31`,
      source: {
        name: `World Bank, World Development Indicators: ${p.indicatorName}`,
        url: `https://data.worldbank.org/indicator/${indicator}?locations=${p.countryId}`,
        locator: `Indicator ${indicator}, ${p.countryName}, ${p.year}${p.lastUpdated ? ` (dataset updated ${p.lastUpdated})` : ""}`,
        retrievedAt,
        method: "api:worldbank",
      },
      notes: `Unit guessed as ${unit} from the indicator name; confirm. Recent years may be revised.`,
    };
  });
}
