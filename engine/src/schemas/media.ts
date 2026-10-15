import { z } from "zod";
import { IsoDate } from "./facts.js";

/** Licenses we accept. NonCommercial / NoDerivatives are deliberately absent. */
export const License = z.enum([
  "public-domain",
  "CC0",
  "CC BY 4.0",
  "CC BY 3.0",
  "CC BY 2.0",
  "CC BY-SA 4.0",
  "CC BY-SA 3.0",
  "Pexels License",
  "Pixabay Content License",
  "YouTube Audio Library",
  "NASA Media Usage Guidelines",
  "SIL OFL 1.1",
  "Apache-2.0",
  "MIT",
  "own-work",
]);

export const CreditAsset = z.object({
  file: z.string().min(1),
  sourceUrl: z.string().url(),
  author: z.string().min(1),
  license: License,
  licenseUrl: z.string().url().optional(),
  attribution: z.string().min(1).describe("exact credit text for the description"),
  usedIn: z.array(z.string()).default([]),
  checkedAt: IsoDate,
  notes: z.string().optional(),
});

export const CreditsFile = z.object({ assets: z.array(CreditAsset) });
export type CreditsFile = z.infer<typeof CreditsFile>;

/** Word-level narration timing (frozen at Gate C). */
export const WordTimestamp = z.object({
  i: z.number().int().nonnegative(),
  word: z.string().min(1),
  start: z.number().nonnegative(),
  end: z.number().nonnegative(),
  conf: z.number().min(0).max(1),
  phrase: z.number().int().nonnegative(),
});
export const WordTimestamps = z.array(WordTimestamp);

export const Phrase = z.object({
  i: z.number().int().nonnegative(),
  text: z.string().min(1),
  start: z.number().nonnegative(),
  end: z.number().nonnegative(),
  words: z.array(z.number().int().nonnegative()),
  factIds: z.array(z.string()).default([]),
  section: z.string().min(1),
});
export const Phrases = z.array(Phrase);

export const MouthCue = z.object({
  start: z.number().nonnegative(),
  end: z.number().nonnegative(),
  value: z.enum(["A", "B", "C", "D", "E", "F", "G", "H", "X"]),
});
export const Visemes = z.object({ mouthCues: z.array(MouthCue) });
