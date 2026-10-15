/**
 * Parses script.md into narrated sentences with their fact tags.
 *
 * Script conventions (see docs/SCRIPT_GUIDE.md):
 *   [F:id] or [F:id1,id2]  fact tags (not spoken)
 *   [BEAT: …]              retention/visual beat marker (not spoken)
 *   [HOST]                 host speaks on camera (not spoken)
 *   [[S&P 500]]            literal name containing digits, exempt from the number check (spoken as written)
 *   <!-- … -->             notes (not spoken)
 *   # headings             section names (not spoken)
 */

export interface Sentence {
  index: number;
  section: string;
  /** Narration text as spoken (tags and markers removed, literals kept). */
  text: string;
  /** Same text with [[literals]] masked, used for the number check. */
  checkText: string;
  factIds: string[];
  /** True when the sentence was marked [HOST] (the host says it on camera). */
  host: boolean;
}

const TAG_RE = /\[F:\s*([a-z0-9][a-z0-9-]*(?:\s*,\s*[a-z0-9][a-z0-9-]*)*)\s*\]/g;
const ABBREVIATIONS = ["U.S.", "U.K.", "U.N.", "e.g.", "i.e.", "Inc.", "Ltd.", "Co.", "Corp.", "vs.", "etc.", "Mr.", "Mrs.", "Ms.", "Dr.", "St.", "No.", "approx.", "Rs."];
const DOT = "\u0000";

export function stripNonSpoken(md: string): string {
  return md.replace(/<!--[\s\S]*?-->/g, " ");
}

export function parseScript(md: string): Sentence[] {
  const clean = stripNonSpoken(md);
  const sentences: Sentence[] = [];
  let section = "intro";
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const para = paragraph.join(" ");
    paragraph = [];
    for (const raw of splitSentences(para)) {
      const factIds: string[] = [];
      for (const m of raw.matchAll(TAG_RE)) {
        for (const id of m[1]!.split(",")) factIds.push(id.trim());
      }
      const withoutMarkers = raw
        .replace(TAG_RE, "")
        .replace(/\[BEAT:[^\]]*\]/gi, "")
        .replace(/\[HOST\]/gi, "");
      const text = tidy(withoutMarkers.replace(/\[\[([^\]]+)\]\]/g, "$1"));
      const checkText = tidy(withoutMarkers.replace(/\[\[([^\]]+)\]\]/g, (_s, inner: string) => inner.replace(/\d/g, "x")));
      if (!text) continue;
      sentences.push({ index: sentences.length, section, text, checkText, factIds, host: /\[HOST\]/i.test(raw) });
    }
  };

  for (const line of clean.split(/\r?\n/)) {
    const heading = /^\s*#{1,6}\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      section = heading[1]!.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || section;
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      continue;
    }
    // list markers / quote markers are formatting, not words
    let text = line.replace(/^\s*(?:[-*+]|\d+[.)]|>)\s+/, "");
    // [HOST] covers every sentence on its line.
    if (/\[HOST\]/i.test(text)) text = text.replace(/([.!?])\s+(?=[^\s\[])/g, "$1 [HOST] ");
    paragraph.push(text);
  }
  flushParagraph();
  return sentences;
}

function tidy(s: string): string {
  return s
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

export function splitSentences(paragraph: string): string[] {
  let p = paragraph;
  for (const abbr of ABBREVIATIONS) p = p.split(abbr).join(abbr.replace(/\./g, DOT));
  // Keep tags attached to the sentence they follow: "…billion. [F:x]" → "…billion [F:x]."
  p = p.replace(/([.!?])\s*((?:\[F:[^\]]+\]\s*)+)/g, (_m, end: string, tags: string) => ` ${tags.trim()}${end} `);
  const parts = p.split(/(?<=[.!?…])["”’)]*\s+(?=["“‘(\[]*[A-Z0-9$₹€£])/);
  return parts.map((s) => s.split(DOT).join(".").trim()).filter(Boolean);
}

/** Narration text for the whole script, as spoken.txt should read before number spelling. */
export function narrationText(md: string): string {
  return parseScript(md).map((s) => s.text).join("\n");
}
