/**
 * npm run llm:models [filter]
 * Lists model IDs currently offered on NVIDIA's hosted API, so NVIDIA_MODEL can be set to a valid one.
 * Shows chat-capable families first. Needs no key.
 */
import { optionalEnv } from "../lib/env.js";

const base = (optionalEnv("NVIDIA_BASE_URL") ?? "https://integrate.api.nvidia.com/v1").replace(/\/+$/, "");
const filter = process.argv.slice(2).join(" ").toLowerCase();

// Non-chat models (embeddings, safety classifiers, vision-only, etc.) are hidden.
const NOT_CHAT = /embed|guard|safety|reward|retriever|parse|clip|deplot|kosmos|fuyu|vila|neva|detector|translate|calibration|vision|vl-|-vl|starcoder|codegemma|code-|coder|codellama|codestral|diffusion/;

try {
  const res = await fetch(`${base}/models`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { data: Array<{ id: string }> };
  const ids = data.data.map((m) => m.id).sort();
  const chat = ids.filter((id) => !NOT_CHAT.test(id) && (!filter || id.includes(filter)));
  console.log(`Chat models on ${base} (${chat.length} of ${ids.length}):\n`);
  for (const id of chat) console.log(`  ${id}`);
  console.log(`\nPut one in .env as NVIDIA_MODEL=<id>, then run: npm run llm:ping`);
} catch (e) {
  console.error(`Could not list models: ${(e as Error).message}`);
  process.exit(1);
}
