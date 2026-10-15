/**
 * OpenAI-compatible chat completions for drafting help. Default provider: NVIDIA (build.nvidia.com).
 * Any OpenAI-compatible free provider works instead: set LLM_BASE_URL, LLM_API_KEY, LLM_MODEL in .env
 * (e.g. Google AI Studio's Gemini or Groq). When LLM_API_KEY is set it takes priority over NVIDIA_*.
 * Used ONLY for drafting help (hook ideas, rewrites, summarizing a document to find facts).
 * It is never a source of facts: see docs/SOURCES_AND_VERIFICATION.md.
 *
 * Free tier is rate-limited (about 40 requests/minute); we space calls ≥1.6 s apart.
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

export interface LlmConfig {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

/** Resolve which provider to use. LLM_* (generic) wins over NVIDIA_* when LLM_API_KEY is set. */
export function llmConfig(): LlmConfig {
  if (optionalEnv("LLM_API_KEY")) {
    const baseUrl = requireEnv("LLM_BASE_URL").replace(/\/+$/, "");
    return { provider: new URL(baseUrl).hostname, baseUrl, apiKey: requireEnv("LLM_API_KEY"), model: requireEnv("LLM_MODEL") };
  }
  return {
    provider: "integrate.api.nvidia.com",
    baseUrl: (optionalEnv("NVIDIA_BASE_URL") ?? "https://integrate.api.nvidia.com/v1").replace(/\/+$/, ""),
    apiKey: requireEnv("NVIDIA_API_KEY"),
    model: requireEnv("NVIDIA_MODEL"),
  };
}

export async function chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
  const cfg = opts.apiKey && opts.baseUrl && opts.model ? undefined : llmConfig();
  const apiKey = opts.apiKey ?? cfg!.apiKey;
  const baseUrl = (opts.baseUrl ?? cfg!.baseUrl).replace(/\/+$/, "");
  const model = opts.model ?? cfg!.model;
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
          ? ` (model "${model}" not found: check the model name in .env; run "npm run llm:models" to list valid names)`
          : res.status === 410
            ? ` (model "${model}" is retired: pick another with "npm run llm:models")`
            : res.status === 401 || res.status === 403
              ? " (key rejected by the provider: check the key, or the account may not be activated for API use)"
              : "";
      throw new Error(`LLM API HTTP ${res.status}: ${text}${hint}`);
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("LLM API returned no message content");
    return content;
  }
}
