import { z } from "zod";

/** ISO date (YYYY-MM-DD). */
export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

export const Tier = z.union([z.literal(1), z.literal(2), z.literal(3)]);

/**
 * Units are deliberately few. Money is always in base units of its currency (e.g. 39000000000 for
 * "$39 billion"); `scale` only says how to display it. Percentages are stored as the percent number
 * (23.5 means 23.5%). "ratio" is a plain fraction (0.235).
 */
export const Unit = z.enum([
  "USD", "INR", "EUR", "GBP", "JPY", "CNY",
  "percent", "ratio",
  "count", "people", "years", "days", "hours", "minutes",
  "tonnes", "kg", "km", "barrels",
  "date", "year",
  "index",
  "text",
]);
export type Unit = z.infer<typeof Unit>;

export const Scale = z.enum(["none", "thousand", "lakh", "million", "crore", "billion", "trillion"]);

export const Source = z.object({
  name: z.string().min(3),
  url: z.string().url(),
  locator: z.string().min(1).describe("page, table, series ID, XBRL concept, etc."),
  retrievedAt: IsoDate,
  method: z.string().min(1).describe("api:sec-companyfacts | api:fred | api:worldbank | document | page"),
});
export type Source = z.infer<typeof Source>;

const Base = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "lowercase letters, digits, and dashes"),
  claim: z.string().min(5),
  tier: Tier,
  notes: z.string().optional(),
  rounding: z.string().optional().describe("how narration may round it, e.g. '1 decimal place'"),
  isEstimate: z.boolean().optional(),
  /** Required true for numeric Tier-3 facts: narration and screen must attribute the source aloud. */
  attributeAloud: z.boolean().optional(),
  correction: z.string().optional(),
});

export const ReportedFact = Base.extend({
  kind: z.literal("reported"),
  value: z.number(),
  unit: Unit,
  scale: Scale.default("none"),
  period: z.string().min(2).describe("FY2025, Q3 2025, 2024, 1997…"),
  asOf: IsoDate,
  source: Source,
  quote: z.string().optional(),
});

export const DerivedFact = Base.extend({
  kind: z.literal("derived"),
  value: z.number(),
  unit: Unit,
  scale: Scale.default("none"),
  period: z.string().min(2).optional(),
  formula: z.string().min(1).describe("arithmetic over fact IDs, e.g. 'rev-2025 / members-2025'"),
  inputs: z.array(z.string()).min(1),
});

export const QualitativeFact = Base.extend({
  kind: z.literal("qualitative"),
  value: z.union([z.string(), z.number()]).optional(),
  unit: Unit.optional(),
  period: z.string().optional(),
  asOf: IsoDate.optional(),
  source: Source,
  /** Second independent source, required when tier is 3. */
  source2: Source.optional(),
  quote: z.string().min(5),
});

export const Fact = z.discriminatedUnion("kind", [ReportedFact, DerivedFact, QualitativeFact]);
export type Fact = z.infer<typeof Fact>;

export const FactsFile = z.object({
  video: z.string().min(1),
  facts: z.array(Fact),
});
export type FactsFile = z.infer<typeof FactsFile>;
