import { FactsFile, type Fact } from "../../engine/src/schemas/facts.js";
import { evaluate, formulaIds } from "./formula.js";
import { today } from "../lib/paths.js";

export interface Finding {
  level: "error" | "warning";
  factId?: string;
  message: string;
}

export interface FactsResult {
  ok: boolean;
  findings: Finding[];
  facts: Fact[];
}

const DERIVED_TOLERANCE = 0.005; // 0.5%
const STALE_DAYS = 365;

/** Validate a parsed facts.json object. `todayIso` (local date, not UTC) is injectable for tests. */
export function verifyFacts(raw: unknown, todayIso = today()): FactsResult {
  const findings: Finding[] = [];
  const parsed = FactsFile.safeParse(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      findings.push({ level: "error", message: `schema: ${issue.path.join(".")}: ${issue.message}` });
    }
    return { ok: false, findings, facts: [] };
  }
  const facts = parsed.data.facts;
  const byId = new Map<string, Fact>();

  for (const f of facts) {
    if (byId.has(f.id)) findings.push({ level: "error", factId: f.id, message: "duplicate id" });
    byId.set(f.id, f);
  }

  for (const f of facts) {
    // Tier-3 rules
    if (f.tier === 3) {
      if (f.kind === "reported" && !f.attributeAloud) {
        findings.push({
          level: "error",
          factId: f.id,
          message: "Tier-3 number needs attributeAloud: true (or find a Tier-1/2 source)",
        });
      }
      if (f.kind === "qualitative" && !f.source2) {
        findings.push({
          level: "error",
          factId: f.id,
          message: "Tier-3 qualitative claim needs a second independent source (source2)",
        });
      }
      if (f.kind === "qualitative" && f.source2 && sameHost(f.source.url, f.source2.url)) {
        findings.push({
          level: "error",
          factId: f.id,
          message: "source and source2 are from the same site; they must be independent",
        });
      }
    }

    // Derived facts recompute
    if (f.kind === "derived") {
      let ids: string[] = [];
      try {
        ids = formulaIds(f.formula);
      } catch (e) {
        findings.push({ level: "error", factId: f.id, message: `formula: ${(e as Error).message}` });
        continue;
      }
      const missing = ids.filter((id) => !byId.has(id));
      if (missing.length) {
        findings.push({ level: "error", factId: f.id, message: `formula uses unknown fact(s): ${missing.join(", ")}` });
        continue;
      }
      const notListed = ids.filter((id) => !f.inputs.includes(id));
      if (notListed.length) {
        findings.push({ level: "error", factId: f.id, message: `formula uses ${notListed.join(", ")} not listed in inputs` });
      }
      if (ids.includes(f.id)) {
        findings.push({ level: "error", factId: f.id, message: "formula refers to itself" });
        continue;
      }
      try {
        const computed = evaluate(f.formula, (id) => {
          const src = byId.get(id)!;
          if (typeof src.value !== "number") throw new Error(`${id} has no numeric value`);
          return src.value;
        });
        const denom = Math.max(Math.abs(computed), 1e-12);
        if (Math.abs(computed - f.value) / denom > DERIVED_TOLERANCE) {
          findings.push({
            level: "error",
            factId: f.id,
            message: `stated value ${f.value} but formula gives ${round(computed)}`,
          });
        }
      } catch (e) {
        findings.push({ level: "error", factId: f.id, message: `formula: ${(e as Error).message}` });
      }
      if (f.inputs.some((id) => byId.get(id)?.isEstimate) && !f.isEstimate) {
        findings.push({ level: "warning", factId: f.id, message: "built from an estimate; mark isEstimate: true" });
      }
    }

    // Staleness and future dates
    if (f.kind !== "derived") {
      const retrieved = f.source.retrievedAt;
      if (retrieved > todayIso) {
        findings.push({ level: "error", factId: f.id, message: `retrievedAt ${retrieved} is in the future` });
      } else if (daysBetween(retrieved, todayIso) > STALE_DAYS) {
        findings.push({ level: "warning", factId: f.id, message: `retrieved over a year ago (${retrieved}); re-check` });
      }
    }
    if (f.kind === "reported" && f.asOf > todayIso && !f.isEstimate) {
      findings.push({ level: "error", factId: f.id, message: `asOf ${f.asOf} is in the future but not marked isEstimate` });
    }
  }

  return { ok: !findings.some((x) => x.level === "error"), findings, facts };
}

function sameHost(a: string, b: string): boolean {
  try {
    const h = (u: string) => new URL(u).hostname.replace(/^www\./, "");
    return h(a) === h(b);
  } catch {
    return false;
  }
}

function daysBetween(a: string, b: string): number {
  return (Date.parse(b) - Date.parse(a)) / 86_400_000;
}

function round(n: number): string {
  return Number(n.toPrecision(6)).toString();
}
