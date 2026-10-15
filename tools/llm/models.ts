/**
 * npm run llm:models [filter]
 * Lists chat model IDs offered by the configured provider (NVIDIA by default, or LLM_BASE_URL).
 */
import { optionalEnv } from "../lib/env.js";

const generic = optionalEnv("LLM_API_KEY");
const base = (generic ? optionalEnv("LLM_BASE_URL") ?? "" : optionalEnv("NVIDIA_BASE_URL") ?? "https://integrate.api.nvidia.com/v1").replace(/\/+$/, "");
const key = generic ?? optionalEnv("NVIDIA_API_KEY");
const filter = process.argv.slice(2).join(" ").toLowerCase();

// Non-chat models (embeddings, safety classifiers, vision-only, image/audio generators, etc.) are hidden.
const NOT_CHAT = /embed|guard|safety|reward|retriever|parse|clip|deplot|kosmos|fuyu|vila|neva|detector|translate|calibration|vision|vl-|-vl|starcoder|codegemma|code-|coder|codellama|codestral|diffusion|imagen|veo|tts|audio|whisper|image|aqa|omni|live|veo/;

try {
  if (!base) throw new Error("LLM_BASE_URL is empty");
  const res = await fetch(`${base}/models`, key ? { headers: { Authorization: `Bearer ${key}` } } : undefined);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { data: Array<{ id: string }> };
  const ids = data.data.map((m) => m.id.replace(/^models\//, "")).sort();
  const chat = ids.filter((id) => !NOT_CHAT.test(id) && (!filter || id.includes(filter)));
  console.log(`Chat models on ${base} (${chat.length} of ${ids.length}):\n`);
  for (const id of chat) console.log(`  ${id}`);
  console.log(`\nPut one in .env as ${generic ? "LLM_MODEL" : "NVIDIA_MODEL"}=<id>, then run: npm run llm:ping`);
} catch (e) {
  console.error(`Could not list models: ${(e as Error).message}`);
  process.exit(1);
}
