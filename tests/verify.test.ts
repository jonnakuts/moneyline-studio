import { describe, expect, it } from "vitest";
import { extractMentions, valueMatches } from "../tools/verify/numbers.js";
import { evaluate } from "../tools/verify/formula.js";
import { verifyFacts } from "../tools/verify/verify-facts.js";
import { verifyScript } from "../tools/verify/verify-script.js";
import { parseScript } from "../tools/verify/script-parse.js";
import { compareSpoken, parseSpoken } from "../tools/verify/spoken.js";

// All numbers below are FICTIONAL test fixtures ("Acme Streaming"), not real data.
const src = (name: string) => ({
  name,
  url: "https://example.com/acme-10k",
  locator: "p. 1",
  retrievedAt: "2026-10-01",
  method: "document",
});

const factsRaw = {
  video: "test",
  facts: [
    { id: "acme-rev-2025", kind: "reported", claim: "Acme revenue FY2025", tier: 1, value: 39_210_000_000, unit: "USD", scale: "billion", period: "FY2025", asOf: "2025-12-31", source: src("Acme 10-K FY2025") },
    { id: "acme-members-2025", kind: "reported", claim: "Acme paid members end of 2025", tier: 1, value: 301_600_000, unit: "count", scale: "million", period: "FY2025", asOf: "2025-12-31", source: src("Acme 10-K FY2025") },
    { id: "acme-rev-per-member", kind: "derived", claim: "Acme revenue per member FY2025", tier: 1, value: 130.0066, unit: "USD", formula: "acme-rev-2025 / acme-members-2025", inputs: ["acme-rev-2025", "acme-members-2025"] },
    { id: "acme-margin-2025", kind: "reported", claim: "Acme operating margin FY2025", tier: 1, value: 26.7, unit: "percent", period: "FY2025", asOf: "2025-12-31", source: src("Acme 10-K FY2025") },
    { id: "acme-founded", kind: "qualitative", claim: "Acme was founded in 1997 as a DVD-by-mail service", tier: 1, value: "1997", unit: "year", source: src("Acme 10-K FY2025"), quote: "Acme was founded in 1997 and began as a DVD-by-mail service." },
  ],
};

describe("formula", () => {
  it("evaluates arithmetic over ids", () => {
    expect(evaluate("a-1 / (b-2 - 3) * 2", (id) => ({ "a-1": 10, "b-2": 8 })[id]!)).toBe(4);
  });
  it("rejects junk", () => {
    expect(() => evaluate("process.exit()", () => 1)).toThrow();
  });
});

describe("extractMentions", () => {
  it("parses money, scales, percents, years, words", () => {
    const m = extractMentions("In 2025 Acme made about $39.2 billion, a 26.7% margin, from two million fans in Q3.");
    expect(m.map((x) => [x.kind, x.value, x.hedge])).toEqual([
      ["year", 2025, "exact"],
      ["money", 39.2e9, "approx"],
      ["percent", 26.7, "exact"],
      ["number", 2e6, "exact"],
    ]);
  });
  it("handles rupees, crore, Indian grouping, and ignores names", () => {
    const m = extractMentions("It costs ₹649, or Rs. 1,00,000 a year, roughly ₹500 crore in COVID-19 times for the G20.");
    expect(m.map((x) => [x.currency, x.value])).toEqual([
      ["INR", 649],
      ["INR", 100000],
      ["INR", 500e7],
    ]);
  });
  it("respects hedges", () => {
    const [m] = extractMentions("nearly $40 billion");
    expect(valueMatches(m!, 39.21e9).ok).toBe(true);
    expect(valueMatches(m!, 41e9).ok).toBe(false);
    const [o] = extractMentions("more than 300 million");
    expect(valueMatches(o!, 301.6e6).ok).toBe(true);
    expect(valueMatches(o!, 290e6).ok).toBe(false);
  });
  it("treats 'added up to' as an exact amount, not 'under'", () => {
    const [m] = extractMentions("the fees added up to $5.9 billion");
    expect(m!.hedge).toBe("exact");
    expect(valueMatches(m!, 5.907e9).ok).toBe(true);
  });
});

describe("splitSentences with tags", () => {
  it("keeps a space after a tag that ends a sentence before the next line", () => {
    const s = parseScript("It came from that card. [F:a]\nBut it was big. [F:b]");
    expect(s.map((x) => [x.text, x.factIds])).toEqual([
      ["It came from that card.", ["a"]],
      ["But it was big.", ["b"]],
    ]);
  });
});

describe("verifyFacts", () => {
  it("passes a valid file", () => {
    const r = verifyFacts(factsRaw, "2026-10-15");
    expect(r.findings.filter((f) => f.level === "error")).toEqual([]);
    expect(r.ok).toBe(true);
  });
  it("catches a wrong derived value, duplicates, and tier-3 without attribution", () => {
    const bad = structuredClone(factsRaw) as any;
    bad.facts[2].value = 150;
    bad.facts.push({ ...bad.facts[0] });
    bad.facts.push({ id: "rumor", kind: "reported", claim: "A rumored number", tier: 3, value: 5, unit: "count", period: "2025", asOf: "2025-01-01", source: src("Some outlet") });
    const r = verifyFacts(bad, "2026-10-15");
    const msgs = r.findings.map((f) => `${f.factId}: ${f.message}`).join("\n");
    expect(r.ok).toBe(false);
    expect(msgs).toMatch(/acme-rev-per-member: stated value 150/);
    expect(msgs).toMatch(/duplicate id/);
    expect(msgs).toMatch(/rumor: Tier-3 number needs attributeAloud/);
  });
  it("reports schema errors", () => {
    const r = verifyFacts({ video: "x", facts: [{ id: "BAD ID", kind: "reported" }] });
    expect(r.ok).toBe(false);
  });
});

const goodScript = `# Cold open

Acme made about $39.2 billion in 2025 [F:acme-rev-2025]. That's roughly $130 from every paying member [F:acme-rev-per-member].

[BEAT: reveal]

## How

[HOST] It kept 26.7% of it as operating profit [F:acme-margin-2025]. Not bad for a company that started in 1997 mailing DVDs [F:acme-founded].
<!-- visual: receipt tears -->
Three things made that possible.
`;

const goodSpoken = `Acme made about thirty-nine point two billion dollars in twenty twenty-five.
That's roughly a hundred and thirty dollars from every paying member.
It kept twenty-six point seven percent of it as operating profit.
Not bad for a company that started in nineteen ninety-seven mailing DVDs.
Three things made that possible.
`;

describe("verifyScript", () => {
  const facts = verifyFacts(factsRaw, "2026-10-15").facts;

  it("parses sentences, sections, tags", () => {
    const s = parseScript(goodScript);
    expect(s.map((x) => [x.section, x.factIds])).toEqual([
      ["cold-open", ["acme-rev-2025"]],
      ["cold-open", ["acme-rev-per-member"]],
      ["how", ["acme-margin-2025"]],
      ["how", ["acme-founded"]],
      ["how", []],
    ]);
  });

  it("passes a correct script and spoken.txt", () => {
    const r = verifyScript(goodScript, goodSpoken, facts);
    const fails = r.sentences.filter((s) => !s.ok).map((s) => s.problems);
    expect(fails).toEqual([]);
    expect(r.spoken.errors).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.sentences[0]!.matched.map((m) => m.factId)).toEqual(["acme-rev-2025", "acme-rev-2025"]);
  });

  it("fails untagged and mismatched numbers", () => {
    const bad = goodScript
      .replace("$39.2 billion in 2025 [F:acme-rev-2025]", "$42 billion in 2025 [F:acme-rev-2025]")
      .replace("Three things", "3 things");
    const r = verifyScript(bad, null, facts);
    const problems = r.sentences.flatMap((s) => s.problems).join("\n");
    expect(problems).toMatch(/"\$42 billion" doesn't match/);
    expect(problems).toMatch(/untagged number\(s\): "3"/);
    expect(r.ok).toBe(false);
  });

  it("fails unknown tags", () => {
    const r = verifyScript("Acme grew [F:nope].", null, facts);
    expect(r.sentences[0]!.problems).toContain("unknown fact [F:nope]");
  });

  it("allows [[literal]] names with digits", () => {
    const r = verifyScript("It is not in the [[S&P 500]] yet.", null, facts);
    expect(r.ok).toBe(true);
  });

  it("catches spoken.txt drift", () => {
    const drift = goodSpoken.replace("every paying member", "every single member").replace("thirty-nine point two", "forty");
    const r = verifyScript(goodScript, drift, facts);
    expect(r.spoken.ok).toBe(false);
    const all = r.spoken.errors.join("\n");
    expect(all).toMatch(/number differs/);
    expect(all).toMatch(/single/);
  });
});

describe("spoken numbers", () => {
  it("parses common spoken forms", () => {
    expect(parseSpoken("four point two billion dollars".split(" "))).toBe(4.2e9);
    expect(parseSpoken("nineteen ninety seven".split(" "))).toBe(1997);
    expect(parseSpoken("twenty twenty five".split(" "))).toBe(2025);
    expect(parseSpoken("two thousand twenty five".split(" "))).toBe(2025);
    expect(parseSpoken("six hundred forty nine rupees".split(" "))).toBe(649);
    expect(parseSpoken("five hundred crore".split(" "))).toBe(500e7);
  });
  it("compares texts", () => {
    expect(compareSpoken("It costs ₹649 a month.", "It costs six hundred forty-nine rupees a month.")).toEqual([]);
  });
  it("doesn't merge a number with 'a' from the next sentence", () => {
    expect(compareSpoken("It was 2025. A year later it grew.", "It was twenty twenty-five. A year later it grew.")).toEqual([]);
  });
});
