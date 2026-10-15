/**
 * Compares script.md narration with spoken.txt. They must be the same words, except that numbers
 * may be spelled out for the voice ("$4.2 billion" → "four point two billion dollars").
 */

import { SCALE_WORDS } from "./numbers.js";

const CARDINALS: Record<string, number> = {
  zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const MULT: Record<string, number> = {
  hundred: 100, thousand: 1e3, lakh: 1e5, lakhs: 1e5, million: 1e6, crore: 1e7, crores: 1e7,
  billion: 1e9, trillion: 1e12,
};
/** Words that can appear inside a spoken number without carrying value. */
const CONNECTORS = new Set([
  "and", "a", "point", "percent", "per", "cent", "dollar", "dollars", "rupee", "rupees", "euro",
  "euros", "pound", "pounds", "cents", "paise", "us", "usd", "inr", "fiscal", "fy", "half",
]);

export function isNumberWord(w: string): boolean {
  return w in CARDINALS || w in MULT || CONNECTORS.has(w);
}

function isNumericToken(t: string): boolean {
  return /\d/.test(t) || /^[$₹€£%]+$/.test(t);
}

/** Lowercase word tokens; hyphens split; punctuation stripped except inside numbers. */
export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[“”"‘’'`*_>#]/g, (c) => (c === "'" || c === "’" ? "'" : " "))
    .replace(/(\d),(\d)/g, "$1$2")
    .split(/[\s–—-]+/)
    .map((t) => t.replace(/^[^\w$₹€£%]+|[^\w%]+$/g, "").replace(/'s$/, ""))
    .filter((t) => t.length > 0);
}

export type Item = { kind: "word"; text: string } | { kind: "num"; parts: string[] };

/** Collapse runs of numeric tokens / number words into single NUM items. */
export function collapse(toks: string[]): Item[] {
  const out: Item[] = [];
  let run: string[] = [];
  const flush = () => {
    // trim connectors at the edges that aren't part of a number ("and", lone "a")
    while (run.length && (run[0] === "and" || run[0] === "per")) out.push({ kind: "word", text: run.shift()! });
    const tail: string[] = [];
    while (run.length && ["and", "a", "point", "per"].includes(run[run.length - 1]!)) tail.unshift(run.pop()!);
    const hasValue = run.some((t) => isNumericToken(t) || t in CARDINALS || t in MULT || t === "half");
    if (run.length && hasValue) out.push({ kind: "num", parts: run });
    else for (const t of run) out.push({ kind: "word", text: t });
    for (const t of tail) out.push({ kind: "word", text: t });
    run = [];
  };
  for (const t of toks) {
    const numericish = isNumericToken(t) || isNumberWord(t) || t in SCALE_WORDS;
    // "a" only counts as numeric when it starts a run that continues ("a billion")
    if (numericish) run.push(t);
    else {
      flush();
      out.push({ kind: "word", text: t });
    }
  }
  flush();
  // A lone "a" run is a word, already handled by hasValue check.
  return out;
}

/** Parse a spoken number run ("four point two billion dollars", "nineteen ninety-seven"). */
export function parseSpoken(parts: string[]): number | null {
  const ws = parts.filter((p) => !["dollar", "dollars", "rupee", "rupees", "euro", "euros", "pound", "pounds", "us", "usd", "inr", "fiscal", "fy", "percent", "per", "cent", "and"].includes(p));
  if (!ws.length) return null;
  if (ws.every((w) => /^\d+(\.\d+)?$/.test(w)) && ws.length === 1) return Number(ws[0]);

  // Year style: two groups of 10–99 with no multipliers ("twenty twenty five", "nineteen oh five").
  if (!ws.some((w) => w in MULT || w === "point")) {
    const groups: number[] = [];
    let cur: number | null = null;
    for (const w of ws) {
      const v = CARDINALS[w];
      if (v === undefined) return null;
      if (cur !== null && cur >= 20 && cur % 10 === 0 && v < 10 && w !== "oh") {
        cur += v;
      } else {
        if (cur !== null) groups.push(cur);
        cur = v;
      }
    }
    if (cur !== null) groups.push(cur);
    if (groups.length === 2 && groups[0]! >= 10 && groups[1]! < 100) return groups[0]! * 100 + groups[1]!;
    if (groups.length === 1) return groups[0]!;
    if (groups.length > 2 || groups.length === 0) return null;
  }

  let total = 0;
  let current = 0;
  let decimal = "";
  let inDecimal = false;
  for (const w of ws) {
    if (w === "point") {
      inDecimal = true;
      continue;
    }
    if (w === "a") {
      current = current || 1;
      continue;
    }
    if (w === "half") {
      current = (current || 1) * 0.5;
      continue;
    }
    if (/^\d+(\.\d+)?$/.test(w)) {
      current += Number(w);
      continue;
    }
    if (inDecimal && w in CARDINALS && CARDINALS[w]! < 10) {
      decimal += String(CARDINALS[w]);
      continue;
    }
    if (w in CARDINALS) {
      current += CARDINALS[w]!;
    } else if (w === "hundred") {
      current = (current || 1) * 100;
    } else if (w in MULT) {
      const base = current + (decimal ? Number("0." + decimal) : 0);
      total += (base || 1) * MULT[w]!;
      current = 0;
      decimal = "";
      inDecimal = false;
    } else {
      return null;
    }
  }
  total += current + (decimal ? Number("0." + decimal) : 0);
  return total;
}

/** Parse a written number run from the script ("$4.2", "billion") into a value. */
export function parseWritten(parts: string[]): number | null {
  let value: number | null = null;
  let mult = 1;
  const wordParts: string[] = [];
  for (const p of parts) {
    const m = /(\d+(?:\.\d+)?)/.exec(p);
    if (m && value === null) {
      value = Number(m[1]);
      const suffix = p.slice(p.indexOf(m[1]!) + m[1]!.length).replace(/[%$₹€£]/g, "");
      if (suffix && suffix in SCALE_WORDS) mult *= SCALE_WORDS[suffix]!;
    } else if (p in SCALE_WORDS) {
      mult *= SCALE_WORDS[p]!;
    } else if (!/\d/.test(p)) {
      wordParts.push(p);
    }
  }
  if (value === null) return wordParts.length ? parseSpoken(wordParts) : null;
  return value * mult;
}

export interface SpokenDiff {
  level: "error" | "warning";
  message: string;
}

/** Compare narration text from the script with spoken.txt. */
export function compareSpoken(scriptText: string, spokenText: string): SpokenDiff[] {
  const a = collapse(tokens(scriptText));
  const b = collapse(tokens(spokenText));
  const key = (it: Item) => (it.kind === "word" ? "w:" + it.text : "#NUM");

  // LCS table
  const n = a.length;
  const m = b.length;
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i]![j] = key(a[i]!) === key(b[j]!) ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }

  const diffs: SpokenDiff[] = [];
  const ctx = (items: Item[], i: number) =>
    items
      .slice(Math.max(0, i - 4), i + 4)
      .map((it) => (it.kind === "word" ? it.text : it.parts.join(" ")))
      .join(" ");

  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && key(a[i]!) === key(b[j]!)) {
      const ai = a[i]!;
      const bj = b[j]!;
      if (ai.kind === "num" && bj.kind === "num") {
        const va = parseWritten(ai.parts);
        const vb = parseSpoken(bj.parts);
        if (va !== null && vb !== null) {
          const denom = Math.max(Math.abs(va), 1e-9);
          if (Math.abs(va - vb) / denom > 0.005) {
            diffs.push({
              level: "error",
              message: `number differs: script "${ai.parts.join(" ")}" (${va}) vs spoken "${bj.parts.join(" ")}" (${vb})`,
            });
          }
        } else if (ai.parts.join(" ") !== bj.parts.join(" ")) {
          diffs.push({
            level: "warning",
            message: `couldn't compare number: script "${ai.parts.join(" ")}" vs spoken "${bj.parts.join(" ")}"`,
          });
        }
      }
      i++;
      j++;
    } else if (j < m && (i >= n || dp[i]![j + 1]! >= dp[i + 1]![j]!)) {
      diffs.push({ level: "error", message: `spoken.txt has extra "${bj(b[j]!)}" near: …${ctx(b, j)}…` });
      j++;
    } else {
      diffs.push({ level: "error", message: `spoken.txt is missing "${bj(a[i]!)}" near: …${ctx(a, i)}…` });
      i++;
    }
  }
  return diffs;
}

function bj(it: Item): string {
  return it.kind === "word" ? it.text : it.parts.join(" ");
}
