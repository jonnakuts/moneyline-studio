import type { Fact } from "../../engine/src/schemas/facts.js";
import { extractMentions, valueMatches, type Mention } from "./numbers.js";
import { parseScript, narrationText, type Sentence } from "./script-parse.js";
import { compareSpoken } from "./spoken.js";

export interface SentenceResult {
  sentence: Sentence;
  ok: boolean;
  problems: string[];
  warnings: string[];
  matched: Array<{ mention: string; factId: string }>;
}

export interface ScriptResult {
  ok: boolean;
  sentences: SentenceResult[];
  spoken: { ok: boolean; errors: string[]; warnings: string[] };
  unusedTags: string[];
  wordCount: number;
  estMinutes: number;
}

const CURRENCY_UNITS = new Set(["USD", "INR", "EUR", "GBP", "JPY", "CNY"]);

function factMatches(m: Mention, f: Fact): { ok: boolean; note?: string } {
  if (m.kind === "year") {
    const y = String(m.value);
    if (f.unit === "year" && f.value === m.value) return { ok: true };
    if (typeof f.value === "string" && f.value.includes(y)) return { ok: true };
    if ("period" in f && f.period && f.period.includes(y)) return { ok: true };
    if ("asOf" in f && f.asOf && f.asOf.startsWith(y)) return { ok: true };
    if (f.kind === "qualitative" && f.quote.includes(y)) return { ok: true };
    return { ok: false };
  }
  if (typeof f.value !== "number") return { ok: false };
  if (m.kind === "percent") {
    if (f.unit === "percent") return valueMatches(m, f.value);
    if (f.unit === "ratio") return valueMatches(m, f.value * 100);
    return { ok: false };
  }
  if (f.unit === "percent" || f.unit === "ratio" || f.unit === "year" || f.unit === "date") return { ok: false };
  if (m.kind === "money") {
    if (!f.unit || !CURRENCY_UNITS.has(f.unit)) return { ok: false };
    if (m.currency && m.currency !== f.unit) return { ok: false, note: `currency ${m.currency} vs fact ${f.unit}` };
  }
  return valueMatches(m, f.value);
}

export function verifyScript(scriptMd: string, spokenTxt: string | null, facts: Fact[]): ScriptResult {
  const byId = new Map(facts.map((f) => [f.id, f]));
  const sentences = parseScript(scriptMd);
  const usedTags = new Set<string>();
  const results: SentenceResult[] = [];

  for (const s of sentences) {
    const problems: string[] = [];
    const warnings: string[] = [];
    const matched: SentenceResult["matched"] = [];

    for (const id of s.factIds) {
      usedTags.add(id);
      if (!byId.has(id)) problems.push(`unknown fact [F:${id}]`);
    }
    const tagged = s.factIds.map((id) => byId.get(id)).filter((f): f is Fact => Boolean(f));
    const mentions = extractMentions(s.checkText);

    if (mentions.length && !s.factIds.length) {
      problems.push(`untagged number(s): ${mentions.map((m) => `"${m.raw}"`).join(", ")}`);
    } else {
      for (const m of mentions) {
        let hit: Fact | undefined;
        const notes: string[] = [];
        for (const f of tagged) {
          const r = factMatches(m, f);
          if (r.note) notes.push(`${f.id}: ${r.note}`);
          if (r.ok) {
            hit = f;
            break;
          }
        }
        if (hit) {
          matched.push({ mention: m.raw, factId: hit.id });
          for (const n of notes) warnings.push(n);
        } else if (tagged.length) {
          const vals = tagged.map((f) => `${f.id}=${String(f.value)}${f.unit ? " " + f.unit : ""}`).join("; ");
          problems.push(`"${m.raw}" doesn't match any tagged fact (${vals})${notes.length ? " — " + notes.join("; ") : ""}`);
        }
      }
    }

    for (const f of tagged) {
      if (f.isEstimate && !/\b(estimat\w*|about|around|roughly|approximately|projected|expected|forecast\w*)\b/i.test(s.text)) {
        warnings.push(`${f.id} is an estimate; say so ("about", "estimated", …)`);
      }
      if (f.tier === 3 && !/\b(according to|reported|reports|says|said|estimates?)\b/i.test(s.text)) {
        warnings.push(`${f.id} is Tier 3; attribute it aloud ("according to …")`);
      }
    }

    results.push({ sentence: s, ok: problems.length === 0, problems, warnings, matched });
  }

  let spoken = { ok: true, errors: [] as string[], warnings: [] as string[] };
  if (spokenTxt !== null) {
    const diffs = compareSpoken(narrationText(scriptMd), spokenTxt);
    spoken = {
      ok: !diffs.some((d) => d.level === "error"),
      errors: diffs.filter((d) => d.level === "error").map((d) => d.message),
      warnings: diffs.filter((d) => d.level === "warning").map((d) => d.message),
    };
    for (const line of spokenTxt.split(/\r?\n/)) {
      if (/[\[\]{}<>#*_/\\|~^]/.test(line)) {
        spoken.ok = false;
        spoken.errors.push(`spoken.txt contains markup or symbols the voice may read aloud: "${line.trim().slice(0, 80)}"`);
      }
    }
  }

  const wordCount = narrationText(scriptMd).split(/\s+/).filter(Boolean).length;
  return {
    ok: results.every((r) => r.ok) && spoken.ok,
    sentences: results,
    spoken,
    unusedTags: facts.map((f) => f.id).filter((id) => !usedTags.has(id)),
    wordCount,
    estMinutes: Math.round((wordCount / 150) * 10) / 10,
  };
}

export function scriptReport(slug: string, r: ScriptResult): string {
  const lines: string[] = [];
  const failed = r.sentences.filter((s) => !s.ok);
  lines.push(`# verify-script: ${slug}`);
  lines.push("");
  lines.push(`**Result: ${r.ok ? "PASS" : "FAIL"}**`);
  lines.push("");
  lines.push(`- Sentences: ${r.sentences.length} (${failed.length} failing)`);
  lines.push(`- Words: ${r.wordCount} (≈ ${r.estMinutes} min at 150 wpm)`);
  lines.push(`- spoken.txt: ${r.spoken.ok ? "matches" : "MISMATCH"}`);
  if (r.unusedTags.length) lines.push(`- Facts not used in the script (fine, just FYI): ${r.unusedTags.join(", ")}`);
  lines.push("");
  if (failed.length) {
    lines.push("## Problems");
    lines.push("");
    for (const s of failed) {
      lines.push(`- **#${s.sentence.index}** (${s.sentence.section}): ${s.sentence.text}`);
      for (const p of s.problems) lines.push(`  - ❌ ${p}`);
    }
    lines.push("");
  }
  if (r.spoken.errors.length) {
    lines.push("## spoken.txt differences");
    lines.push("");
    for (const e of r.spoken.errors) lines.push(`- ❌ ${e}`);
    lines.push("");
  }
  const warns = r.sentences.flatMap((s) => s.warnings.map((w) => `#${s.sentence.index}: ${w}`)).concat(r.spoken.warnings);
  if (warns.length) {
    lines.push("## Warnings");
    lines.push("");
    for (const w of warns) lines.push(`- ⚠️ ${w}`);
    lines.push("");
  }
  lines.push("## Every numeric claim and its fact");
  lines.push("");
  lines.push("| # | Said | Fact |");
  lines.push("|---|---|---|");
  for (const s of r.sentences) for (const m of s.matched) lines.push(`| ${s.sentence.index} | ${m.mention} | ${m.factId} |`);
  lines.push("");
  return lines.join("\n");
}
