/**
 * Narration clock: pure lookups from time (seconds) to the frozen phrases and words.
 * Binary search, no state, so any frame can be rendered on its own.
 */
import type { z } from "zod";
import type { Phrase, WordTimestamp } from "../schemas/media.js";

export type PhraseT = z.infer<typeof Phrase>;
export type WordT = z.infer<typeof WordTimestamp>;

/** Index of the last item whose start <= t, or -1. Items must be sorted by start. */
export function lastStartedAt<T extends { start: number }>(items: readonly T[], t: number): number {
  let lo = 0;
  let hi = items.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (items[mid]!.start <= t) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans;
}

/** The phrase being spoken at t; during a pause, the one that just finished (so text doesn't flicker). */
export function phraseAt(phrases: readonly PhraseT[], t: number): PhraseT | undefined {
  const i = lastStartedAt(phrases, t);
  return i >= 0 ? phrases[i] : phrases[0];
}

/** The word being spoken at t, or undefined between words. */
export function wordAt(words: readonly WordT[], t: number): WordT | undefined {
  const i = lastStartedAt(words, t);
  const w = i >= 0 ? words[i] : undefined;
  return w && t < w.end ? w : undefined;
}

export function mmss(t: number): string {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${String(m).padStart(2, "0")}:${s.toFixed(3).padStart(6, "0")}`;
}
