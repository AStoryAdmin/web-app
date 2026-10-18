/**
 * One earlier memory, brought back for today. A family album's best trick
 * is the same month coming round again, so a memory dated this month in an
 * earlier year comes first; then one written on this day a year or more
 * ago; otherwise any memory with words in it. The choice is seeded by the
 * date, so the page shows the same memory all day and a different one
 * tomorrow. The newest memories are left out: they are still on the page.
 */
import { dayKey } from "../app-core/lib/dailyQuestion.js";
import { ageAt, memoryDate, onThisMonth } from "../app-core/lib/timeline.js";
import { quoteFor } from "../app-core/lib/memoryCard.js";
import { ownWords, takeaway } from "../components/archive/transcript";
import type { Memory, Story } from "../data/stories";

export type Resurfaced = {
  memory: Memory;
  /** The small line above the words: "This month in 1975", "Written two years ago today", "From the book". */
  kicker: string;
  /** How old they were, when the story knows: "age 30". */
  age: string | null;
  quote: string;
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const pick = <T>(items: T[], seed: string): T => items[hash(seed) % items.length];

/** The person's own words: a call tidied to the teller's turns, typed lines kept apart; never the server's third-person summary. */
const words = (m: Memory) => {
  const own = ownWords(m.body || "");
  if (own) return own;
  const ex = (m.excerpt || "").trim();
  return /^the (speaker|narrator|storyteller)\b/i.test(ex) ? "" : ex;
};

/** The quote for the day: the memory's one takeaway, the line its page sets under the title (never cut). */
const quoteOf = (m: Memory) => takeaway(m.body || "") || quoteFor(opening(words(m)), 220);

const FILLER = /^(yeah|yes|so|um|uh|well|okay|ok|right|oh|and|but|like|you know)\b/i;

/**
 * Where to start quoting: the first sentence that reads like a sentence
 * (ten words or more, not opening on "Yeah, so…"), since a call's
 * transcript often clears its throat first. The whole text when nothing
 * qualifies.
 */
export function opening(text: string): string {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  const sentences = clean.split(/(?<=[.!?…][”’")]?)\s+/);
  let from = 0;
  for (const s of sentences) {
    const n = s.split(" ").length;
    if (n >= 10 && !FILLER.test(s) && /^[A-Z“"]/.test(s)) return clean.slice(from);
    from += s.length + 1;
  }
  return clean;
}

const yearsAgoLabel = (n: number) => (n === 1 ? "a year ago today" : n === 2 ? "two years ago today" : n === 3 ? "three years ago today" : `${n} years ago today`);

export function resurface(story: Story, now = new Date()): Resurfaced | null {
  const saved = story.memories.filter((m) => m.status !== "in_progress" && words(m).length >= 40);
  if (saved.length < 2) return null;

  // Leave the newest out; they are the "Recent memories" below.
  const byCreated = [...saved].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const keepOut = new Set(byCreated.slice(0, saved.length > 4 ? 2 : 1).map((m) => m.id));
  const pool = saved.filter((m) => !keepOut.has(m.id));
  if (!pool.length) return null;

  const seed = `${story.id}:${dayKey(now)}`;
  const ageOf = (m: Memory) => {
    const { year } = memoryDate(m) as { year: number | null };
    const age = ageAt(story, year) as number | null;
    return age == null ? null : age === 0 ? "the year they were born" : `age ${age}`;
  };

  const thisMonth = (onThisMonth(pool, now) as { memory: Memory; year: number }[]).filter(({ year }) => year < now.getFullYear());
  if (thisMonth.length) {
    const { memory, year } = pick(thisMonth, seed);
    return { memory, kicker: `${MONTHS[now.getMonth()]} ${year}`, age: ageOf(memory), quote: quoteOf(memory) };
  }

  const today = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const anniversaries = pool
    .map((m) => ({ memory: m, written: new Date(m.createdAt) }))
    .filter(({ written }) => !Number.isNaN(written.getTime()) && `${String(written.getMonth() + 1).padStart(2, "0")}-${String(written.getDate()).padStart(2, "0")}` === today && written.getFullYear() < now.getFullYear());
  if (anniversaries.length) {
    const { memory, written } = pick(anniversaries, seed);
    return { memory, kicker: `Written ${yearsAgoLabel(now.getFullYear() - written.getFullYear())}`, age: ageOf(memory), quote: quoteOf(memory) };
  }

  const memory = pick(pool, seed);
  const { dated, text } = memoryDate(memory) as { dated: boolean; text: string };
  return { memory, kicker: dated ? text.trim() : "From the book", age: ageOf(memory), quote: quoteOf(memory) };
}
