/**
 * npm run new -- <short title words>
 * Creates videos/YYYY-MM-DD-slug/ with the standard folders, status.md, and credits.json.
 */
import fs from "node:fs";
import path from "node:path";
import { today, videosRoot, writeJson } from "../lib/paths.js";

const words = process.argv.slice(2).join(" ").trim();
if (!words) {
  console.error("Usage: npm run new -- <short title words>   e.g. npm run new -- how netflix makes money");
  process.exit(2);
}

const slugPart = words
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 60)
  .replace(/-+$/, "");
const slug = `${today()}-${slugPart}`;
const dir = path.join(videosRoot(), slug);

if (fs.existsSync(dir)) {
  console.error(`Already exists: ${dir}`);
  process.exit(1);
}

const folders = [
  "00-pitch",
  "01-research/raw",
  "02-script",
  "03-voice/audio",
  "03-voice/renders",
  "04-direction",
  "05-proof/renders",
  "05-proof/frames",
  "06-render/renders",
  "06-render/contact-sheets",
  "07-shorts/renders",
  "08-package/renders",
];
for (const f of folders) fs.mkdirSync(path.join(dir, ...f.split("/")), { recursive: true });

fs.writeFileSync(
  path.join(dir, "status.md"),
  `# ${words}\nStage: 0 Topic & pitch\nGate A: not started\nNext action: write 00-pitch/pitch.md (see /new-video)\nLog:\n- ${today()} folder created\n`,
  "utf8",
);
writeJson(path.join(dir, "credits.json"), { assets: [] });
writeJson(path.join(dir, "01-research", "facts.json"), { video: slug, facts: [] });

console.log(`Created videos/${slug}`);
