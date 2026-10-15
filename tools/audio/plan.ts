/**
 * npm run audio:plan -- <slug>
 * Pairs each line of spoken.txt (what the voice says) with its sentence in script.md (section, fact IDs,
 * host flag) and writes 03-voice/phrase-plan.json for tts.py / align.py / visemes.py.
 * spoken.txt must have exactly one line per script sentence.
 */
import fs from "node:fs";
import path from "node:path";
import { parseScript } from "../verify/script-parse.js";
import { videoDir } from "../lib/paths.js";

export interface PlannedPhrase {
  i: number;
  spoken: string;
  scriptText: string;
  section: string;
  factIds: string[];
  host: boolean;
  /** Pause after this phrase, in seconds (longer at a section change). */
  pauseAfter: number;
}

export const PAUSE_WITHIN = 0.35;
export const PAUSE_BETWEEN = 0.8;

export function buildPlan(scriptMd: string, spokenTxt: string): PlannedPhrase[] {
  const sentences = parseScript(scriptMd);
  const lines = spokenTxt.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length !== sentences.length) {
    throw new Error(
      `spoken.txt has ${lines.length} lines but script.md has ${sentences.length} sentences; they must match one to one`,
    );
  }
  return sentences.map((s, i) => {
    const next = sentences[i + 1];
    return {
      i,
      spoken: lines[i]!,
      scriptText: s.text,
      section: s.section,
      factIds: s.factIds,
      host: s.host,
      pauseAfter: !next ? 0 : next.section !== s.section ? PAUSE_BETWEEN : PAUSE_WITHIN,
    };
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]).endsWith(path.join("audio", "plan.ts"));
if (isMain) {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: npm run audio:plan -- <slug>");
    process.exit(1);
  }
  const dir = videoDir(slug);
  const plan = buildPlan(
    fs.readFileSync(path.join(dir, "02-script", "script.md"), "utf8"),
    fs.readFileSync(path.join(dir, "02-script", "spoken.txt"), "utf8"),
  );
  const out = path.join(dir, "03-voice", "phrase-plan.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(plan, null, 2) + "\n");
  console.log(`Wrote ${plan.length} phrases (${plan.filter((p) => p.host).length} host lines) to ${path.relative(process.cwd(), out)}`);
}
