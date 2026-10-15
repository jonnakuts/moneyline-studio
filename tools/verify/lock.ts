import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { LockFile, STAGE_ORDER, type StageId } from "../../engine/src/schemas/lock.js";
import { nowLocalIso, readJson, writeJson } from "../lib/paths.js";

/** Files each gate freezes. `?` suffix = optional (frozen only if present). Paths use "/" and are relative to the video folder. */
export const STAGE_FILES: Record<StageId, string[]> = {
  "B-script": ["01-research/facts.json", "02-script/script.md", "02-script/spoken.txt"],
  "C-voice": [
    "03-voice/audio/narration.wav",
    "03-voice/word-timestamps.json",
    "03-voice/phrases.json",
    "03-voice/visemes.json?",
  ],
  "D-direction": [
    "04-direction/creative-direction.md",
    "04-direction/visual-screenplay.json",
    "04-direction/emphasis-map.json",
    "04-direction/asset-list.md",
  ],
  "F-render": ["06-render/renders/final.mp4", "06-render/qa-report.md", "06-render/captions.srt"],
  "G-package": [
    "08-package/titles.md",
    "08-package/description.md",
    "08-package/tags.txt",
    "08-package/pinned-comment.md",
    "08-package/upload-checklist.md",
    "08-package/thumbnail-brief.md",
  ],
};

export function sha256File(file: string): string {
  const hash = crypto.createHash("sha256");
  const fd = fs.openSync(file, "r");
  try {
    const buf = Buffer.allocUnsafe(1 << 20);
    let n: number;
    while ((n = fs.readSync(fd, buf, 0, buf.length, null)) > 0) hash.update(buf.subarray(0, n));
  } finally {
    fs.closeSync(fd);
  }
  return "sha256:" + hash.digest("hex");
}

function lockPath(dir: string): string {
  return path.join(dir, "LOCK.json");
}

export function readLock(dir: string): LockFile {
  const p = lockPath(dir);
  if (!fs.existsSync(p)) return { stages: {} };
  return LockFile.parse(readJson(p));
}

export function freezeStage(dir: string, stage: StageId): { files: string[]; already: boolean } {
  const lock = readLock(dir);
  const idx = STAGE_ORDER.indexOf(stage);
  const missingEarlier = STAGE_ORDER.slice(0, idx).filter((s) => !lock.stages[s]);
  if (missingEarlier.length) {
    throw new Error(`Can't freeze ${stage}: earlier stage(s) not frozen yet: ${missingEarlier.join(", ")}`);
  }

  const files: Record<string, string> = {};
  const missing: string[] = [];
  for (const spec of STAGE_FILES[stage]) {
    const optional = spec.endsWith("?");
    const rel = optional ? spec.slice(0, -1) : spec;
    const abs = path.join(dir, ...rel.split("/"));
    if (fs.existsSync(abs)) files[rel] = sha256File(abs);
    else if (!optional) missing.push(rel);
  }
  if (missing.length) throw new Error(`Can't freeze ${stage}: missing ${missing.join(", ")}`);

  const existing = lock.stages[stage];
  if (existing) {
    const same =
      Object.keys(existing.files).length === Object.keys(files).length &&
      Object.entries(files).every(([k, v]) => existing.files[k] === v);
    if (same) return { files: Object.keys(files), already: true };
    throw new Error(`${stage} is already frozen and its files have changed since. Run unfreeze first (with the owner's OK).`);
  }

  lock.stages[stage] = { approvedAt: nowLocalIso(), files };
  writeJson(lockPath(dir), lock);
  return { files: Object.keys(files), already: false };
}

export interface LockCheck {
  ok: boolean;
  changed: Array<{ stage: StageId; file: string; problem: "modified" | "missing" }>;
  frozenStages: StageId[];
}

export function verifyLock(dir: string): LockCheck {
  const lock = readLock(dir);
  const changed: LockCheck["changed"] = [];
  const frozenStages: StageId[] = [];
  for (const stage of STAGE_ORDER) {
    const s = lock.stages[stage];
    if (!s) continue;
    frozenStages.push(stage);
    for (const [rel, hash] of Object.entries(s.files)) {
      const abs = path.join(dir, ...rel.split("/"));
      if (!fs.existsSync(abs)) changed.push({ stage, file: rel, problem: "missing" });
      else if (sha256File(abs) !== hash) changed.push({ stage, file: rel, problem: "modified" });
    }
  }
  return { ok: changed.length === 0, changed, frozenStages };
}

/** Remove a stage and every later stage from LOCK.json, and log it in status.md. */
export function unfreezeStage(dir: string, stage: StageId, reason: string): StageId[] {
  const lock = readLock(dir);
  const idx = STAGE_ORDER.indexOf(stage);
  const removed = STAGE_ORDER.slice(idx).filter((s) => lock.stages[s]);
  for (const s of removed) delete lock.stages[s];
  writeJson(lockPath(dir), lock);
  const status = path.join(dir, "status.md");
  if (fs.existsSync(status)) {
    fs.appendFileSync(
      status,
      `- ${nowLocalIso().slice(0, 10)} UNFROZE ${removed.join(", ") || "(nothing frozen)"}: ${reason}\n`,
      "utf8",
    );
  }
  return removed;
}
