/** npm run llm:ping — checks that NVIDIA_API_KEY and NVIDIA_MODEL work. Prints the model's short reply. */
import { chat } from "./nvidia.js";
import { requireEnv } from "../lib/env.js";

try {
  const model = requireEnv("NVIDIA_MODEL");
  const reply = await chat(
    [{ role: "user", content: "Reply with exactly: OK, ready to help write." }],
    { maxTokens: 20, temperature: 0 },
  );
  console.log(`Model ${model} replied: ${reply.trim()}`);
} catch (e) {
  console.error(`LLM check failed: ${(e as Error).message}`);
  process.exit(1);
}
