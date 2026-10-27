/**
 * The way to a first edition, on the Book's teal cloth: the headline over the rule and how full the rule is.
 * What is there, never what is missing (DECISIONS: the gauge is kept, with no "N left"): app-core's bookProgress
 * already says "13 memories so far"; the rule's label says how far along, never how far to go. Pure, so it is tested.
 */
import { bookProgress } from "../../app-core/lib/bookProgress.js";
import type { Story } from "../../data/stories";

type Progress = { count: number; ratio: number; headline: string };

/** Words that count down to a goal. A headline that carries one is replaced by the plain count. */
export const COUNTDOWN = /\b(to go|left|remaining|more to|until|away from|countdown)\b/i;

export type Gauge = { headline: string; pct: number; label: string };

export function bookGauge(story: Pick<Story, "memories">): Gauge {
  const p = bookProgress(story) as Progress;
  const pct = Math.round(Math.min(1, Math.max(0, p.ratio)) * 100);
  const count = `${p.count} ${p.count === 1 ? "memory" : "memories"} so far`;
  const headline = COUNTDOWN.test(p.headline) ? count : p.headline;
  return { headline, pct, label: `${pct}% of the way to a first edition` };
}
