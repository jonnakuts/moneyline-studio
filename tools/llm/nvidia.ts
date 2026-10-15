/**
 * NVIDIA hosted models (build.nvidia.com), OpenAI-compatible chat completions.
 * Used ONLY for drafting help (hook ideas, rewrites, summarizing a document to find facts).
 * It is never a source of facts: see docs/SOURCES_AND_VERIFICATION.md.
 *
 * Free tier is rate-limited (about 40 requests/minute); we space calls ≥1.6 s apart.
 * Switching provider later = change NVIDIA_BASE_URL / NVIDIA_MODEL / key; the API shape is the same.
 */
import { optionalEnv, requireEnv } from "../lib/env.js";
import type { FetchLike } from "../research/http.js";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  fetchImpl?: FetchLike;
  apiKey?: string;
  baseUrl?: string;
  retries?: number;
}

const MIN_INTERVAL_MS = 1600;
let last = 0;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
  const apiKey = opts.apiKey ?? requireEnv("NVIDIA_API_KEY");
  const baseUrl = (opts.baseUrl ?? optionalEnv("NVIDIA_BASE_URL") ?? "https://integrate.api.nvidia.com/v1").replace(/\/+$/, "");
  const model = opts.model ?? requireEnv("NVIDIA_MODEL");
  const doFetch = opts.fetchImpl ?? fetch;
  const retries = opts.retries ?? 3;

  for (let attempt = 0; ; attempt++) {
    const wait = last + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();

    const res = await doFetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        model,
        messages,
        temperature: opts.temperature ?? 0.6,
        max_tokens: opts.maxTokens ?? 1024,
        stream: false,
      }),
    });

    if ((res.status === 429 || res.status >= 500) && attempt < retries) {
      const ra = Number(res.headers.get("retry-after"));
      await sleep(Number.isFinite(ra) && ra > 0 ? ra * 1000 : 2000 * 2 ** attempt);
      continue;
    }
    if (!res.ok) {
      // Never include the key; the response body is the provider's message.
      const text = (await res.text()).slice(0, 300).trim();
      const hint =
        res.status === 404
          ? ` (model "${model}" not found: check NVIDIA_MODEL; run "npm run llm:models" to list valid names)`
          : res.status === 410
            ? ` (model "${model}" is retired: pick another with "npm run llm:models")`
            : res.status === 401 || res.status === 403
              ? " (key rejected: check NVIDIA_API_KEY was copied completely)"
              : "";
      throw new Error(`NVIDIA API HTTP ${res.status}: ${text}${hint}`);
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("NVIDIA API returned no message content");
    return content;
  }
}
