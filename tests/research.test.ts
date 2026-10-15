import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { annualSeries, toCandidates, type CompanyFacts } from "../tools/research/sec-edgar.js";
import { fredUnit, fredSeries } from "../tools/research/fred.js";
import { getText } from "../tools/research/http.js";
import { chat } from "../tools/llm/nvidia.js";
import { verifyFacts } from "../tools/verify/verify-facts.js";

// Fictional company; shapes mirror SEC's companyfacts JSON.
const cf: CompanyFacts = {
  cik: 123,
  entityName: "ACME INC",
  facts: {
    "us-gaap": {
      Revenues: {
        label: "Revenues",
        description: null,
        units: {
          USD: [
            { start: "2024-01-01", end: "2024-12-31", val: 100, accn: "0000000123-25-000001", fy: 2024, fp: "FY", form: "10-K", filed: "2025-01-20" },
            { start: "2024-01-01", end: "2024-12-31", val: 101, accn: "0000000123-26-000001", fy: 2025, fp: "FY", form: "10-K", filed: "2026-01-20" },
            { start: "2025-01-01", end: "2025-12-31", val: 120, accn: "0000000123-26-000001", fy: 2025, fp: "FY", form: "10-K", filed: "2026-01-20" },
            { start: "2025-07-01", end: "2025-09-30", val: 30, accn: "0000000123-25-000009", fy: 2025, fp: "Q3", form: "10-Q", filed: "2025-10-20" },
            { start: "2025-01-01", end: "2025-09-30", val: 90, accn: "0000000123-25-000009", fy: 2025, fp: "Q3", form: "10-K", filed: "2025-10-20" },
          ],
        },
      },
    },
  },
};

describe("SEC annualSeries", () => {
  it("keeps full fiscal years only and prefers the latest restatement", () => {
    const s = annualSeries(cf, "Revenues", "USD");
    expect(s.map((p) => [p.periodLabel, p.val])).toEqual([
      ["FY2024", 101],
      ["FY2025", 120],
    ]);
  });
  it("makes candidates that pass verify-facts once copied", () => {
    const c = toCandidates(cf, "Revenues", annualSeries(cf, "Revenues", "USD"), "ACME", "USD", "2026-10-15");
    expect(c[1]!.source.url).toBe("https://www.sec.gov/Archives/edgar/data/123/000000012326000001/");
    const r = verifyFacts({ video: "t", facts: c }, "2026-10-15");
    expect(r.findings.filter((f) => f.level === "error")).toEqual([]);
  });
});

describe("FRED", () => {
  it("converts scaled units to base units", () => {
    expect(fredUnit("Billions of Dollars")).toEqual({ unit: "USD", multiplier: 1e9 });
    expect(fredUnit("Percent")).toEqual({ unit: "percent", multiplier: 1 });
    expect(fredUnit("Index 1982-1984=100")).toEqual({ unit: "index", multiplier: 1 });
  });
  it("never puts the API key in the cache or public URL", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fred-"));
    const fake = async (url: string) => {
      const body = url.includes("/observations")
        ? { observations: [{ date: "2025-01-01", value: "1.5" }, { date: "2025-02-01", value: "." }] }
        : { seriess: [{ id: "GDP", title: "Gross Domestic Product", units: "Billions of Dollars", frequency: "Quarterly", last_updated: "2026-09-25" }] };
      return new Response(JSON.stringify(body), { status: 200 });
    };
    const r = await fredSeries("GDP", "SECRET123", undefined, undefined, { cacheDir: dir, fetchImpl: fake });
    expect(r.points).toEqual([{ date: "2025-01-01", rawValue: 1.5, value: 1.5e9 }]);
    const cached = fs.readdirSync(dir, { recursive: true }).map(String).filter((f) => f.endsWith(".json"));
    for (const f of cached) expect(fs.readFileSync(path.join(dir, f), "utf8")).not.toContain("SECRET123");
  });
});

describe("http cache", () => {
  it("serves the second call from cache", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "http-"));
    let calls = 0;
    const fake = async () => {
      calls++;
      return new Response("hello", { status: 200 });
    };
    await getText("https://example.org/a", { cacheDir: dir, fetchImpl: fake });
    const second = await getText("https://example.org/a", { cacheDir: dir, fetchImpl: fake });
    expect(calls).toBe(1);
    expect(second.fromCache).toBe(true);
  });
});

describe("NVIDIA client", () => {
  it("sends an OpenAI-style request and returns the text; errors never echo the key", async () => {
    let seen: { url?: string; body?: any; auth?: string } = {};
    const ok = async (url: string, init?: RequestInit) => {
      seen = { url, body: JSON.parse(String(init?.body)), auth: (init?.headers as Record<string, string>).Authorization };
      return new Response(JSON.stringify({ choices: [{ message: { content: "hi" } }] }), { status: 200 });
    };
    const out = await chat([{ role: "user", content: "x" }], { apiKey: "nvapi-SECRET", model: "m", baseUrl: "https://h/v1", fetchImpl: ok });
    expect(out).toBe("hi");
    expect(seen.url).toBe("https://h/v1/chat/completions");
    expect(seen.body.model).toBe("m");
    expect(seen.auth).toBe("Bearer nvapi-SECRET");

    const bad = async () => new Response("invalid key", { status: 401 });
    await expect(chat([{ role: "user", content: "x" }], { apiKey: "nvapi-SECRET", model: "m", baseUrl: "https://h/v1", fetchImpl: bad, retries: 0 }))
      .rejects.toThrow(/^NVIDIA API HTTP 401: invalid key$/);
  });
});
