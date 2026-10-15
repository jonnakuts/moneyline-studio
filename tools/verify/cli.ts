/**
 * npm run verify   -- <slug> [--facts] [--script] [--lock]   (no flag = all that apply)
 * npm run freeze   -- <slug> <stage>                        stage: B-script | C-voice | D-direction | F-render | G-package
 * npm run unfreeze -- <slug> <stage> --yes "reason"
 */
import fs from "node:fs";
import path from "node:path";
import { StageId, STAGE_ORDER } from "../../engine/src/schemas/lock.js";
import { readJson, videoDir } from "../lib/paths.js";
import { verifyFacts } from "./verify-facts.js";
import { verifyScript, scriptReport } from "./verify-script.js";
import { freezeStage, unfreezeStage, verifyLock } from "./lock.js";

const [cmd, slug, ...rest] = process.argv.slice(2);

function usage(): never {
  console.error(
    [
      "Usage:",
      "  npm run verify -- <slug> [--facts] [--script] [--lock]",
      `  npm run freeze -- <slug> <${STAGE_ORDER.join("|")}>`,
      `  npm run unfreeze -- <slug> <stage> --yes "reason"`,
    ].join("\n"),
  );
  process.exit(2);
}

function runVerify(dir: string, s: string, flags: Set<string>): boolean {
  const all = !flags.has("--facts") && !flags.has("--script") && !flags.has("--lock");
  let ok = true;

  if (all || flags.has("--lock")) {
    const r = verifyLock(dir);
    if (!r.frozenStages.length) console.log("lock:   nothing frozen yet");
    else if (r.ok) console.log(`lock:   OK (${r.frozenStages.join(", ")})`);
    else {
      ok = false;
      console.log("lock:   FAIL — frozen files changed:");
      for (const c of r.changed) console.log(`        ${c.stage}  ${c.file}  (${c.problem})`);
    }
  }

  const factsPath = path.join(dir, "01-research", "facts.json");
  const hasFacts = fs.existsSync(factsPath);
  let facts: ReturnType<typeof verifyFacts>["facts"] = [];

  if (all || flags.has("--facts") || flags.has("--script")) {
    if (!hasFacts) {
      if (flags.has("--facts") || flags.has("--script")) {
        console.log("facts:  FAIL — 01-research/facts.json not found");
        return false;
      }
    } else {
      const r = verifyFacts(readJson(factsPath));
      facts = r.facts;
      const errors = r.findings.filter((f) => f.level === "error");
      const warns = r.findings.filter((f) => f.level === "warning");
      console.log(`facts:  ${r.ok ? "OK" : "FAIL"} (${r.facts.length} facts, ${errors.length} errors, ${warns.length} warnings)`);
      for (const f of r.findings) console.log(`        ${f.level === "error" ? "✗" : "!"} ${f.factId ?? ""} ${f.message}`);
      if (!r.ok) ok = false;
    }
  }

  const scriptPath = path.join(dir, "02-script", "script.md");
  if ((all && fs.existsSync(scriptPath)) || flags.has("--script")) {
    if (!fs.existsSync(scriptPath)) {
      console.log("script: FAIL — 02-script/script.md not found");
      return false;
    }
    const spokenPath = path.join(dir, "02-script", "spoken.txt");
    const spoken = fs.existsSync(spokenPath) ? fs.readFileSync(spokenPath, "utf8") : null;
    const r = verifyScript(fs.readFileSync(scriptPath, "utf8"), spoken, facts);
    if (spoken === null) {
      r.ok = false;
      r.spoken = { ok: false, errors: ["02-script/spoken.txt not found"], warnings: [] };
    }
    const report = scriptReport(s, r);
    fs.writeFileSync(path.join(dir, "02-script", "verify-report.md"), report, "utf8");
    const bad = r.sentences.filter((x) => !x.ok).length;
    console.log(
      `script: ${r.ok ? "PASS" : "FAIL"} (${r.sentences.length} sentences, ${bad} failing, spoken.txt ${r.spoken.ok ? "matches" : "MISMATCH"}, ≈${r.estMinutes} min)`,
    );
    for (const x of r.sentences.filter((y) => !y.ok)) {
      console.log(`        ✗ #${x.sentence.index}: ${x.problems.join(" | ")}`);
    }
    for (const e of r.spoken.errors.slice(0, 10)) console.log(`        ✗ spoken: ${e}`);
    if (r.spoken.errors.length > 10) console.log(`        … ${r.spoken.errors.length - 10} more in verify-report.md`);
    console.log("        report: 02-script/verify-report.md");
    if (!r.ok) ok = false;
  }
  return ok;
}

try {
  if (!cmd || !slug) usage();
  const dir = videoDir(slug);

  if (cmd === "verify") {
    const ok = runVerify(dir, slug, new Set(rest));
    process.exit(ok ? 0 : 1);
  } else if (cmd === "freeze") {
    const stage = StageId.parse(rest[0]);
    const r = freezeStage(dir, stage);
    console.log(r.already ? `${stage} already frozen with identical files.` : `Froze ${stage}: ${r.files.join(", ")}`);
  } else if (cmd === "unfreeze") {
    const stage = StageId.parse(rest[0]);
    const yes = rest.includes("--yes");
    const reason = rest.filter((x) => x !== "--yes" && x !== rest[0]).join(" ").trim();
    if (!yes || !reason) {
      console.error('Unfreezing needs the owner\'s OK. Re-run with --yes "reason for the change".');
      process.exit(2);
    }
    const removed = unfreezeStage(dir, stage, reason);
    console.log(`Unfroze: ${removed.join(", ") || "(nothing was frozen)"}. Redo from ${stage}.`);
  } else {
    usage();
  }
} catch (e) {
  console.error(`Error: ${(e as Error).message}`);
  process.exit(1);
}
