import { describe, expect, it } from "vitest";
import { buildPlan, PAUSE_BETWEEN, PAUSE_WITHIN } from "../tools/audio/plan.js";
import { lastStartedAt, phraseAt, wordAt } from "../engine/src/timing/narration.js";

describe("phrase plan", () => {
  const md = "# Open\n\n[HOST] Hello there.\nIt costs $5. [F:x]\n\n# Next\n\n[HOST] Bye now. See you.\n";
  it("pairs spoken lines with script sentences, sections, tags, host flag, and pauses", () => {
    const p = buildPlan(md, "Hello there.\nIt costs five dollars.\nBye now.\nSee you.\n");
    expect(p.map((x) => [x.spoken, x.section, x.factIds, x.host, x.pauseAfter])).toEqual([
      ["Hello there.", "open", [], true, PAUSE_WITHIN],
      ["It costs five dollars.", "open", ["x"], false, PAUSE_BETWEEN],
      ["Bye now.", "next", [], true, PAUSE_WITHIN],
      ["See you.", "next", [], true, 0],
    ]);
  });
  it("refuses when line counts differ", () => {
    expect(() => buildPlan(md, "Hello there. It costs five dollars.\nBye now.")).toThrow(/must match/);
  });
});

describe("narration clock", () => {
  const words = [
    { i: 0, word: "a", start: 0.1, end: 0.3, conf: 1, phrase: 0 },
    { i: 1, word: "b", start: 0.5, end: 0.9, conf: 1, phrase: 0 },
  ];
  it("finds the active word and gaps", () => {
    expect(lastStartedAt(words, 0.05)).toBe(-1);
    expect(wordAt(words, 0.2)?.word).toBe("a");
    expect(wordAt(words, 0.4)).toBeUndefined();
    expect(wordAt(words, 0.6)?.word).toBe("b");
    const phrases = [{ i: 0, text: "a b", start: 0.1, end: 0.9, words: [0, 1], factIds: [], section: "s" }];
    expect(phraseAt(phrases, 5)?.i).toBe(0);
  });
});
