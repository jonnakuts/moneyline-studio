/**
 * npm run render:sync -- <slug>
 * Renders the plain Gate C sync test (1280×720, 30 fps) to 03-voice/renders/sync-test.mp4.
 * Reads the frozen-to-be timing files; validates them with the zod schemas first.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { Phrases, WordTimestamps } from "../../engine/src/schemas/media.js";
import { readJson, repoRoot, videoDir } from "../lib/paths.js";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: npm run render:sync -- <video-slug>");
  process.exit(1);
}
const dir = videoDir(slug);
const voice = path.join(dir, "03-voice");
const phrases = Phrases.parse(readJson(path.join(voice, "phrases.json")));
const words = WordTimestamps.parse(readJson(path.join(voice, "word-timestamps.json")));
const manifest = readJson(path.join(voice, "tts-manifest.json")) as { duration: number };
if (!fs.existsSync(path.join(voice, "audio", "narration.wav"))) {
  console.error("03-voice/audio/narration.wav is missing. Run: npm run tts -- " + slug);
  process.exit(1);
}

const title = (fs.readFileSync(path.join(dir, "status.md"), "utf8").split(/\r?\n/)[0] ?? "").replace(/^#\s*/, "");
const cache = path.join(repoRoot(), ".cache", "render");
fs.mkdirSync(cache, { recursive: true });
const propsFile = path.join(cache, `${slug}-sync-props.json`);
fs.writeFileSync(propsFile, JSON.stringify({ title, duration: manifest.duration + 0.5, audio: "audio/narration.wav", phrases, words }));

const out = path.join(voice, "renders", "sync-test.mp4");
const cli = path.join(repoRoot(), "node_modules", "@remotion", "cli", "remotion-cli.js");
const args = [
  cli, "render", path.join("engine", "src", "index.ts"), "SyncTest", out,
  `--props=${propsFile}`,
  `--public-dir=${voice}`,
  `--config=${path.join("engine", "remotion.config.ts")}`,
  "--log=warn",
];
// Optional: use an already-installed Chromium instead of letting Remotion download one.
if (process.env.REMOTION_BROWSER_EXECUTABLE) args.push(`--browser-executable=${process.env.REMOTION_BROWSER_EXECUTABLE}`);

console.log(`Rendering sync test for ${slug} (${(manifest.duration / 60).toFixed(1)} min) …`);
const r = spawnSync(process.execPath, args, { stdio: "inherit", cwd: repoRoot() });
if (r.status !== 0) process.exit(r.status ?? 1);
console.log(`Done: ${path.relative(repoRoot(), out)}`);
