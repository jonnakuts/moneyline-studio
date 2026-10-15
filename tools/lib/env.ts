import fs from "node:fs";
import path from "node:path";

let loaded = false;

/** Load .env from the repo root once (Node 22's built-in loader). Never logs values. */
export function loadEnv(): void {
  if (loaded) return;
  loaded = true;
  const file = path.join(process.cwd(), ".env");
  if (fs.existsSync(file)) {
    process.loadEnvFile(file);
  }
}

/** Read a required env var, failing with a message that names the variable but never its value. */
export function requireEnv(name: string): string {
  loadEnv();
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`${name} is not set. Add it to .env (see .env.example).`);
  }
  return v.trim();
}

export function optionalEnv(name: string): string | undefined {
  loadEnv();
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}
