/**
 * Finds numeric mentions in narration text ("$4.2 billion", "23%", "1997", "two million")
 * and turns them into comparable values.
 */

export type MentionKind = "money" | "percent" | "year" | "number";
export type Hedge = "exact" | "approx" | "nearly" | "under" | "over" | "just-over";

export interface Mention {
  raw: string;
  index: number;
  kind: MentionKind;
  /** Value in base units (dollars, rupees, people…); percent mentions keep the percent number. */
  value: number;
  /** Size of the last significant digit, in the same units as `value` (for rounding tolerance). */
  unit: number;
  currency?: "USD" | "INR" | "EUR" | "GBP";
  hedge: Hedge;
}

export const SCALE_WORDS: Record<string, number> = {
  thousand: 1e3,
  k: 1e3,
  lakh: 1e5,
  lakhs: 1e5,
  million: 1e6,
  mn: 1e6,
  m: 1e6,
  crore: 1e7,
  crores: 1e7,
  billion: 1e9,
  bn: 1e9,
  b: 1e9,
  trillion: 1e12,
  tn: 1e12,
  t: 1e12,
};

const SMALL: Record<string, number> = {
  zero: 0, a: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

const CURRENCY_PREFIX = String.raw`(?<cur>US\$|\$|₹|€|£|Rs\.?\s?|INR\s|USD\s|EUR\s|GBP\s)?`;
const NUMBER = String.raw`(?<num>\d{1,3}(?:,\d{2,3})+(?:\.\d+)?|\d+(?:\.\d+)?)`;
const SCALE = String.raw`(?:\s?(?<scale>thousand|lakhs?|million|mn|crores?|billion|bn|trillion|tn)\b|(?<scale1>[kKmMbBtT])\b)?`;
const PCT = String.raw`(?:\s?(?<pct>%|percent\b|per\s?cent\b))?`;
const CUR_SUFFIX = String.raw`(?:\s(?<cur2>dollars?|rupees?|euros?|pounds?)\b)?`;

const DIGIT_RE = new RegExp(CURRENCY_PREFIX + NUMBER + SCALE + PCT + CUR_SUFFIX, "g");

const WORD_NUM = String.raw`(?:(?:${[...Object.keys(TENS)].join("|")})(?:[-\s](?:${Object.keys(SMALL).filter((w) => w !== "a" && w !== "zero").join("|")}))?|${Object.keys(SMALL).join("|")}|half\sa|a\shalf)`;
const WORD_RE = new RegExp(
  String.raw`\b(?<w>${WORD_NUM}(?:\s(?:hundred))?)\s(?<scale>thousand|lakhs?|million|crores?|billion|trillion|percent\b|per\scent\b)(?:\s(?<cur2>dollars?|rupees?|euros?|pounds?)\b)?`,
  "gi",
);

const HEDGES: Array<[RegExp, Hedge]> = [
  [/\bjust\s+over\s*$/i, "just-over"],
  [/\b(?:nearly|almost|just\s+under|close\s+to|shy\s+of)\s*$/i, "nearly"],
  [/\b(?:under|less\s+than|below|up\s+to|fewer\s+than)\s*$/i, "under"],
  [/\b(?:over|more\s+than|above|at\s+least|upwards\s+of)\s*$/i, "over"],
  [/\b(?:about|around|roughly|approximately|some|an\s+estimated|estimated|almost\s+exactly|~)\s*$/i, "approx"],
];

function hedgeBefore(text: string, index: number): Hedge {
  const before = text.slice(Math.max(0, index - 30), index);
  for (const [re, h] of HEDGES) if (re.test(before)) return h;
  return "exact";
}

function currencyOf(cur?: string, cur2?: string): Mention["currency"] {
  const c = (cur ?? cur2 ?? "").toLowerCase().trim();
  if (!c) return undefined;
  if (c.includes("$") || c.startsWith("usd") || c.startsWith("dollar")) return "USD";
  if (c.includes("₹") || c.startsWith("rs") || c.startsWith("inr") || c.startsWith("rupee")) return "INR";
  if (c.includes("€") || c.startsWith("eur")) return "EUR";
  if (c.includes("£") || c.startsWith("gbp") || c.startsWith("pound")) return "GBP";
  return undefined;
}

function wordValue(w: string): number | null {
  const s = w.toLowerCase().replace(/-/g, " ").trim();
  if (s === "half a" || s === "a half") return 0.5;
  let total = 0;
  let found = false;
  for (const part of s.split(/\s+/)) {
    if (part in SMALL) {
      total += SMALL[part]!;
      found = true;
    } else if (part in TENS) {
      total += TENS[part]!;
      found = true;
    } else if (part === "hundred") {
      total = (total || 1) * 100;
      found = true;
    } else {
      return null;
    }
  }
  return found ? total : null;
}

/**
 * Extract numeric mentions. Digits attached to letters (Q3, 4K, G20, 1st, COVID-19) are ignored:
 * they are names or ordinals, not quantities. Use [[...]] in the script for other literal names.
 */
export function extractMentions(text: string): Mention[] {
  const out: Mention[] = [];

  for (const m of text.matchAll(DIGIT_RE)) {
    const g = m.groups!;
    const start = m.index!;
    const numStart = start + m[0].indexOf(g.num!);
    const numEnd = numStart + g.num!.length;
    const prev = text[numStart - 1] ?? "";
    const prev2 = text.slice(Math.max(0, numStart - 2), numStart);
    const next = text[numEnd] ?? "";
    const scaleWord = g.scale ?? g.scale1;

    // Attached to letters → a name/ordinal (but allow FY2025 and k/m/bn style scales).
    const isFY = /fy$/i.test(text.slice(Math.max(0, numStart - 2), numStart));
    if (!isFY && /[A-Za-z]/.test(prev) && !g.cur) continue;
    if (/^[A-Za-z]-$/.test(prev2) || (prev === "-" && /[A-Za-z]/.test(text[numStart - 2] ?? ""))) continue;
    if (!scaleWord && /[A-Za-z]/.test(next) && !g.pct) continue;

    const numStr = g.num!.replace(/,/g, "");
    const base = Number(numStr);
    const decimals = numStr.includes(".") ? numStr.split(".")[1]!.length : 0;
    const scale = scaleWord ? SCALE_WORDS[scaleWord.toLowerCase()] ?? 1 : 1;
    const currency = currencyOf(g.cur, g.cur2);
    const isPct = Boolean(g.pct);

    let kind: MentionKind = "number";
    if (isPct) kind = "percent";
    else if (currency) kind = "money";
    else if (!scaleWord && !numStr.includes(".") && !g.num!.includes(",") && /^\d{4}$/.test(numStr)) {
      const y = Number(numStr);
      if (y >= 1500 && y <= 2100) kind = "year";
    }

    let unit: number;
    if (decimals > 0) unit = Math.pow(10, -decimals);
    else {
      const trailing = /0+$/.exec(numStr)?.[0].length ?? 0;
      unit = kind === "year" ? 1 : Math.pow(10, Math.min(trailing, Math.max(0, numStr.length - 1)));
    }

    out.push({
      raw: m[0].trim(),
      index: start,
      kind,
      value: isPct ? base : base * scale,
      unit: isPct ? unit : unit * scale,
      currency,
      hedge: hedgeBefore(text, start),
    });
  }

  for (const m of text.matchAll(WORD_RE)) {
    const g = m.groups!;
    const v = wordValue(g.w!);
    if (v === null) continue;
    const scaleWord = g.scale!.toLowerCase().replace(/\s+/g, " ");
    const isPct = scaleWord.startsWith("per");
    const scale = isPct ? 1 : SCALE_WORDS[scaleWord] ?? 1;
    const currency = currencyOf(undefined, g.cur2);
    out.push({
      raw: m[0].trim(),
      index: m.index!,
      kind: isPct ? "percent" : currency ? "money" : "number",
      value: v * scale,
      unit: (v >= 1 ? 1 : 0.5) * scale,
      currency,
      hedge: hedgeBefore(text, m.index!),
    });
  }

  return out.sort((a, b) => a.index - b.index);
}

/** Does a mention agree with a stated fact value (same units), given rounding and hedge words? */
export function valueMatches(m: Mention, factValue: number): { ok: boolean; note?: string } {
  const v = factValue;
  const x = m.value;
  const halfUnit = m.unit / 2;
  switch (m.hedge) {
    case "exact":
      return { ok: Math.abs(v - x) <= halfUnit + 1e-9 * Math.max(1, Math.abs(x)) };
    case "approx": {
      const tol = Math.max(halfUnit, Math.abs(x) * 0.05);
      return { ok: Math.abs(v - x) <= tol };
    }
    case "nearly":
      return { ok: v <= x + 1e-9 * Math.abs(x) && v >= x * 0.9, note: v > x ? '"nearly" but the real value is higher' : undefined };
    case "under":
      if (!(v < x)) return { ok: false, note: '"under/less than" but the real value is not lower' };
      return { ok: true, note: v < x * 0.8 ? '"under" is technically true but the real value is much lower' : undefined };
    case "just-over":
      return { ok: v >= x && v <= x * 1.05 + halfUnit };
    case "over":
      if (!(v > x || Math.abs(v - x) <= 1e-9)) return { ok: false, note: '"over/more than" but the real value is not higher' };
      return { ok: true, note: v > x * 1.2 ? '"over" is technically true but the real value is much higher' : undefined };
  }
}
