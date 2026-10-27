/**
 * "Not yet told" (the phone's NotYetToldScreen, FB-313): the chapters of a life with nothing in them yet, each with
 * the bank's questions to start it, the easiest first. The phone's lib/notYetTold.js is not in app-core yet, so this
 * is the same walk built from the pieces that are: bookProgress's empty chapters and the bank in the voice the web's
 * Home and Write ask in (to the storyteller, or about them for a relative). Never called "missing", and gone once every
 * chapter has begun.
 */
import { findEmptyChapters } from "../../app-core/lib/bookProgress.js";
import { answeredTitles, isAnswered, voicePrompts } from "../../app-core/lib/questionVoice.js";
import type { Story } from "../../data/stories";
import type { Prompt } from "../../lib/today";

export type UntoldChapter = { era: string; questions: Prompt[] };

/** How many chapters show before "Show the others". */
export const NOT_YET_TOLD_LIMIT = 3;

/**
 * Every question the bank has for one chapter, easiest first: a first-week question if the chapter has one, else the
 * gentlest; then by depth, bank order breaking ties, so it is the same every day. Never one marked sensitive, never
 * one held back from every deck (voicePrompts drops those), never one already answered.
 */
export function chapterQuestions(story: Story, era: string, { relative = false } = {}): Prompt[] {
  const answered = answeredTitles(story.memories);
  const pool = (voicePrompts(story.name, { relative }) as Prompt[]).filter((p) => p.era === era && !p.sensitive && !isAnswered(p, answered));
  if (!pool.length) return [];
  const gentlest = (list: Prompt[]) => [...list].sort((a, b) => (a.depth || 9) - (b.depth || 9))[0];
  const week1 = pool.filter((p) => (p.tags || []).includes("week1"));
  const starter = gentlest(week1.length ? week1 : pool);
  const rank = (p: Prompt) => (p.id === starter.id ? -1 : p.depth || 9);
  return pool
    .map((p, i) => ({ p, i }))
    .sort((a, b) => rank(a.p) - rank(b.p) || a.i - b.i)
    .map(({ p }) => p);
}

/** The empty chapters in life order, each with its questions; a chapter the bank has nothing for is left out. */
export function notYetTold(story: Story | null | undefined, { relative = false } = {}): UntoldChapter[] {
  if (!story) return [];
  return (findEmptyChapters(story) as string[]).map((era) => ({ era, questions: chapterQuestions(story, era, { relative }) })).filter((c) => c.questions.length > 0);
}

/** "4 chapters still waiting for a first memory", the real count; null when every chapter has begun. */
export function untoldLine(count: number): string | null {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  if (!n) return null;
  return n === 1 ? "1 chapter still waiting for its first memory" : `${n} chapters still waiting for a first memory`;
}
