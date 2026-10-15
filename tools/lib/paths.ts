import path from "node:path";
import fs from "node:fs";

/** Root of the repo (where package.json lives). Tools are always run from the repo root via npm. */
export function repoRoot(): string {
  return process.cwd();
}

/** Folder that holds all videos. Overridable for tests with VIDEOS_DIR. */
export function videosRoot(): string {
  return process.env.VIDEOS_DIR ? path.resolve(process.env.VIDEOS_DIR) : path.join(repoRoot(), "videos");
}

export function videoDir(slug: string): string {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    throw new Error(`Invalid video slug "${slug}". Use lowercase letters, digits, and dashes.`);
  }
  const dir = path.join(videosRoot(), slug);
  if (!fs.existsSync(dir)) {
    throw new Error(`Video folder not found: ${dir}`);
  }
  return dir;
}

export function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function writeJson(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

/** Today's date as YYYY-MM-DD in the machine's local time zone. */
export function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local ISO timestamp with offset, e.g. 2026-10-21T15:04:00+05:30. */
export function nowLocalIso(): string {
  const d = new Date();
  const pad = (n: number) => String(Math.abs(n)).padStart(2, "0");
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? "+" : "-";
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `${sign}${pad(Math.trunc(off / 60))}:${pad(off % 60)}`
  );
}
