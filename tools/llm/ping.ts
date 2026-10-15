/** npm run llm:ping — checks that the configured LLM provider, key, and model work. */
import { chat, llmConfig } from "./nvidia.js";

try {
  const cfg = llmConfig();
  const reply = await chat([{ role: "user", content: "Reply with exactly: OK, ready to help write." }], { maxTokens: 20, temperature: 0 });
  console.log(`${cfg.provider} · model ${cfg.model} replied: ${reply.trim()}`);
} catch (e) {
  console.error(`LLM check failed: ${(e as Error).message}`);
  process.exit(1);
}
