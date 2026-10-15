import { z } from "zod";

export const World = z.enum(["LEDGER", "RECEIPT", "STREET"]);

export const Sequence = z.object({
  id: z.string().regex(/^seq-\d{2,3}$/),
  phrases: z.array(z.number().int().nonnegative()).min(1),
  start: z.number().nonnegative(),
  end: z.number().nonnegative(),
  meaning: z.string().min(5),
  heroWords: z.array(z.string()).default([]),
  factIds: z.array(z.string()).default([]),
  visualConcept: z.string().min(5),
  semanticMetaphor: z.string().min(3),
  /** Name of the semantic scene concept, for variation counting (e.g. "ReceiptBreakdownScene"). */
  sceneConcept: z.string().min(3),
  world: World,
  typographyTreatment: z.string().default(""),
  graphics: z.array(z.string()).default([]),
  footage: z.array(z.string()).default([]),
  host: z
    .object({
      on: z.boolean(),
      pose: z.string().optional(),
      placement: z.string().optional(),
    })
    .default({ on: false }),
  camera: z.string().default(""),
  transitionIn: z.string().min(3),
  transitionOut: z.string().min(3),
  sound: z.array(z.string()).default([]),
  intensity: z.number().int().min(1).max(10),
  customAssetsNeeded: z.array(z.string()).default([]),
  notes: z.string().default(""),
});

export const Screenplay = z.object({
  concept: z.string().min(20),
  worlds: z.array(World).min(1),
  sequences: z.array(Sequence).min(1),
});
export type Screenplay = z.infer<typeof Screenplay>;

export const EmphasisMap = z.object({
  sections: z.array(z.object({ id: z.string(), start: z.number(), end: z.number() })),
  pauses: z.array(z.object({ at: z.number(), length: z.number() })).default([]),
  stress: z.array(z.object({ word: z.number().int(), strength: z.number().min(0).max(1) })).default([]),
  music: z.array(z.object({ at: z.number(), cue: z.string() })).default([]),
});
