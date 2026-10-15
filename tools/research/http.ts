import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

const lastCall = new Map<string, number>();

/** Minimum spacing between requests per host (polite rate limiting). */
const MIN_INTERVAL_MS: Record<string, number> = {
  "data.sec.gov": 400,
  "www.sec.gov": 400,
  "api.stlouisfed.org": 250,
  "api.worldbank.org": 250,
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface GetOptions {
  headers?: Record<string, string>;
  /** Folder to cache raw responses in. Cached responses are reused, so research is reproducible. */
  cacheDir?: string;
  /** Hide secrets (e.g. api_key) from the cache file name and saved URL. */
  redactParams?: string[];
  fetchImpl?: FetchLike;
  retries?: number;
}

export interface GetResult {
  body: string;
  fromCache: boolean;
  cacheFile?: string;
  /** URL with secret parameters removed, safe to store in facts.json. */
  publicUrl: string;
}

export function redactUrl(url: string, params: string[] = []): string {
  if (!params.length) return url;
  const u = new URL(url);
  for (const p of params) u.searchParams.delete(p);
  return u.toString();
}

export async function getText(url: string, opts: GetOptions = {}): Promise<GetResult> {
  const publicUrl = redactUrl(url, opts.redactParams);
  let cacheFile: string | undefined;
  if (opts.cacheDir) {
    const host = new URL(url).hostname;
    const key = crypto.createHash("sha1").update(publicUrl).digest("hex").slice(0, 16);
    cacheFile = path.join(opts.cacheDir, host, `${key}.json`);
    if (fs.existsSync(cacheFile)) {
      const cached = JSON.parse(fs.readFileSync(cacheFile, "utf8")) as { url: string; body: string };
      return { body: cached.body, fromCache: true, cacheFile, publicUrl };
    }
  }

  const doFetch = opts.fetchImpl ?? fetch;
  const host = new URL(url).hostname;
  const retries = opts.retries ?? 3;
  let attempt = 0;
  for (;;) {
    const wait = (lastCall.get(host) ?? 0) + (MIN_INTERVAL_MS[host] ?? 200) - Date.now();
    if (wait > 0) await sleep(wait);
    lastCall.set(host, Date.now());

    let res: Response;
    try {
      res = await doFetch(url, { headers: opts.headers });
    } catch (e) {
      if (attempt++ < retries) {
        await sleep(1000 * 2 ** attempt);
        continue;
      }
      throw new Error(`Network error for ${publicUrl}: ${(e as Error).message}`);
    }
    if (res.status === 429 || res.status >= 500) {
      if (attempt++ < retries) {
        const ra = Number(res.headers.get("retry-after"));
        await sleep(Number.isFinite(ra) && ra > 0 ? ra * 1000 : 1000 * 2 ** attempt);
        continue;
      }
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${publicUrl}`);
    }
    const body = await res.text();
    if (cacheFile) {
      fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
      fs.writeFileSync(
        cacheFile,
        JSON.stringify({ url: publicUrl, retrievedAt: new Date().toISOString(), body }),
        "utf8",
      );
    }
    return { body, fromCache: false, cacheFile, publicUrl };
  }
}

export async function getJson<T = unknown>(url: string, opts: GetOptions = {}): Promise<{ data: T } & GetResult> {
  const r = await getText(url, opts);
  try {
    return { ...r, data: JSON.parse(r.body) as T };
  } catch {
    throw new Error(`Response from ${r.publicUrl} was not JSON`);
  }
}
