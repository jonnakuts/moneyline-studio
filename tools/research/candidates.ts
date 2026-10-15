import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson } from "../lib/paths.js";

/**
 * Candidate facts are drafts produced by fetchers. They are NOT facts yet: the research stage reviews
 * each one (claim wording, definition, rounding) and copies the ones it uses into facts.json.
 */
export interface CandidateFact {
  id: string;
  kind: "reported";
  claim: string;
  tier: 1 | 2;
  value: number;
  unit: string;
  scale: string;
  period: string;
  asOf: string;
  source: {
    name: string;
    url: string;
    locator: string;
    retrievedAt: string;
    method: string;
  };
  notes?: string;
}

export function slugId(...parts: Array<string | number>): string {
  return parts
    .map(String)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function displayScale(v: number): string {
  const a = Math.abs(v);
  if (a >= 1e12) return "trillion";
  if (a >= 1e9) return "billion";
  if (a >= 1e6) return "million";
  if (a >= 1e3) return "thousand";
  return "none";
}

/** Merge candidates into <video>/01-research/candidates.json (replacing same IDs). */
export function saveCandidates(videoFolder: string, items: CandidateFact[]): string {
  const file = path.join(videoFolder, "01-research", "candidates.json");
  const existing: CandidateFact[] = fs.existsSync(file) ? (readJson(file) as { candidates: CandidateFact[] }).candidates : [];
  const byId = new Map(existing.map((c) => [c.id, c]));
  for (const c of items) byId.set(c.id, c);
  writeJson(file, { note: "Drafts from fetchers. Review, then copy what you use into facts.json.", candidates: [...byId.values()] });
  return file;
}

export function formatValue(v: number, unit: string): string {
  const s = displayScale(v);
  const div = { trillion: 1e12, billion: 1e9, million: 1e6, thousand: 1e3, none: 1 }[s]!;
  const num = (v / div).toLocaleString("en-US", { maximumFractionDigits: 3 });
  return `${num}${s === "none" ? "" : " " + s} ${unit}`;
}
