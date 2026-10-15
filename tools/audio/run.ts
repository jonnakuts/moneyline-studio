/**
 * Cross-platform launcher for the Python audio tools.
 *
 *   npm run audio:setup                 create tools/audio/.venv, install requirements, download Kokoro
 *   npm run tts -- <slug>               plan + narration (Kokoro)
 *   npm run align -- <slug>             word timing (faster-whisper)
 *   npm run visemes -- <slug>           host mouth shapes (Rhubarb)
 *   npm run voice -- <slug>             all three, in order
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { repoRoot } from "../lib/paths.js";

const here = path.join(repoRoot(), "tools", "audio");
const venv = path.join(here, ".venv");
const venvPython = process.platform === "win32" ? path.join(venv, "Scripts", "python.exe") : path.join(venv, "bin", "python");

const MODEL_BASE = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0";
const MODEL_FILES = ["kokoro-v1.0.onnx", "voices-v1.0.bin"];

function run(cmd: string, args: string[]): void {
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: repoRoot() });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function findPython311(): [string, string[]] {
  const candidates: Array<[string, string[]]> =
    process.platform === "win32" ? [["py", ["-3.11"]], ["python", []]] : [["python3.11", []], ["python3", []]];
  for (const [cmd, pre] of candidates) {
    const r = spawnSync(cmd, [...pre, "--version"], { encoding: "utf8" });
    if (r.status === 0 && /3\.11\./.test(r.stdout + r.stderr)) return [cmd, pre];
  }
  console.error("Python 3.11 not found. Install it (see docs/SETUP_WINDOWS.md).");
  process.exit(1);
}

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          download(res.headers.location, dest).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const total = Number(res.headers["content-length"] ?? 0);
        let got = 0;
        let lastPct = -1;
        const tmp = dest + ".part";
        const out = fs.createWriteStream(tmp);
        res.on("data", (c: Buffer) => {
          got += c.length;
          const pct = total ? Math.floor((got / total) * 100) : 0;
          if (pct % 10 === 0 && pct !== lastPct) {
            lastPct = pct;
            process.stdout.write(`\r  ${path.basename(dest)} ${pct}%`);
          }
        });
        res.pipe(out);
        out.on("finish", () => {
          out.close();
          fs.renameSync(tmp, dest);
          process.stdout.write("\n");
          resolve();
        });
        out.on("error", reject);
      })
      .on("error", reject);
  });
}

async function setup(): Promise<void> {
  if (!fs.existsSync(venvPython)) {
    const [cmd, pre] = findPython311();
    console.log("Creating tools/audio/.venv …");
    run(cmd, [...pre, "-m", "venv", venv]);
  }
  run(venvPython, ["-m", "pip", "install", "--upgrade", "pip"]);
  run(venvPython, ["-m", "pip", "install", "-r", path.join(here, "requirements.txt")]);
  const models = path.join(here, "models");
  fs.mkdirSync(models, { recursive: true });
  for (const f of MODEL_FILES) {
    const dest = path.join(models, f);
    if (fs.existsSync(dest)) continue;
    console.log(`Downloading ${f} (one time) …`);
    await download(`${MODEL_BASE}/${f}`, dest);
  }
  console.log("Audio tools ready. (The speech-recognition model downloads itself on the first `npm run align`.)");
}

function py(script: string, args: string[]): void {
  if (!fs.existsSync(venvPython)) {
    console.error("Audio tools aren't set up yet. Run: npm run audio:setup");
    process.exit(1);
  }
  run(venvPython, [path.join(here, script), ...args]);
}

function plan(slug: string): void {
  run(process.execPath, [path.join(repoRoot(), "node_modules", "tsx", "dist", "cli.mjs"), path.join(here, "plan.ts"), slug]);
}

const [cmd, ...rest] = process.argv.slice(2);
const slug = rest.find((a) => !a.startsWith("-"));
const needSlug = () => {
  if (!slug) {
    console.error(`Usage: npm run ${cmd} -- <video-slug>`);
    process.exit(1);
  }
  return slug;
};

switch (cmd) {
  case "setup":
    await setup();
    break;
  case "tts":
    plan(needSlug());
    py("tts.py", rest);
    break;
  case "align":
    needSlug();
    py("align.py", rest);
    break;
  case "visemes":
    needSlug();
    py("visemes.py", rest);
    break;
  case "voice":
    plan(needSlug());
    py("tts.py", [slug!]);
    py("align.py", [slug!]);
    py("visemes.py", [slug!]);
    break;
  default:
    console.error("Unknown command. Use: setup | tts | align | visemes | voice");
    process.exit(1);
}
