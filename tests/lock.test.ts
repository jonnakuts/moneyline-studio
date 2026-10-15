import { describe, expect, it, beforeEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { freezeStage, unfreezeStage, verifyLock } from "../tools/verify/lock.js";

let dir: string;
const put = (rel: string, body: string) => {
  const p = path.join(dir, ...rel.split("/"));
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, body);
};

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "lock-"));
  put("status.md", "# t\nLog:\n");
  put("01-research/facts.json", '{"video":"t","facts":[]}');
  put("02-script/script.md", "Hello.");
  put("02-script/spoken.txt", "Hello.");
});

describe("lock", () => {
  it("freezes, detects edits, and unfreezes with a log line", () => {
    expect(freezeStage(dir, "B-script").files).toHaveLength(3);
    expect(verifyLock(dir).ok).toBe(true);
    expect(freezeStage(dir, "B-script").already).toBe(true);

    put("02-script/script.md", "Hello, changed.");
    const r = verifyLock(dir);
    expect(r.ok).toBe(false);
    expect(r.changed).toEqual([{ stage: "B-script", file: "02-script/script.md", problem: "modified" }]);
    expect(() => freezeStage(dir, "B-script")).toThrow(/already frozen/);

    expect(unfreezeStage(dir, "B-script", "owner asked for a new hook")).toEqual(["B-script"]);
    expect(fs.readFileSync(path.join(dir, "status.md"), "utf8")).toMatch(/UNFROZE B-script: owner asked/);
    expect(freezeStage(dir, "B-script").already).toBe(false);
  });

  it("ignores CRLF vs LF line endings (Windows checkouts)", () => {
    put("02-script/script.md", "line one\nline two\n");
    freezeStage(dir, "B-script");
    put("02-script/script.md", "line one\r\nline two\r\n");
    expect(verifyLock(dir).ok).toBe(true);
  });

  it("refuses to skip stages or freeze missing files", () => {
    expect(() => freezeStage(dir, "D-direction")).toThrow(/earlier stage/);
    fs.rmSync(path.join(dir, "02-script", "spoken.txt"));
    expect(() => freezeStage(dir, "B-script")).toThrow(/missing 02-script\/spoken.txt/);
  });

  it("treats optional files as optional", () => {
    freezeStage(dir, "B-script");
    put("03-voice/audio/narration.wav", "RIFF");
    put("03-voice/word-timestamps.json", "[]");
    put("03-voice/phrases.json", "[]");
    expect(freezeStage(dir, "C-voice").files).not.toContain("03-voice/visemes.json");
  });
});
