/**
 * What a person's page lays along its rail, worked out from the memories
 * they are in or sent: the rail itself (oldest at the top, newest last),
 * the three related memories beside it, the family notes they wrote, and
 * the one line a card shows of the words. Pure helpers; the components in
 * this folder call them.
 */
import { memoryDate, sortByDate } from "../../app-core/lib/timeline.js";
import { quoteFor } from "../../app-core/lib/memoryCard.js";
import { opening } from "../../lib/resurface";
import { smarten } from "../../lib/typography";
import type { Contribution } from "../../data/contributions";
import type { Person } from "../../data/family";
import type { Memory, Story } from "../../data/stories";

export type Found = { story: Story; memory: Memory };

const fold = (s: string) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const saved = (m: Memory) => m.status !== "in_progress";

/**
 * The memories that hang off the rail: the ones this person told or sent
 * and the ones somebody said they are in, oldest first so the newest is
 * last, undated at the end. For the storyteller it is their own story.
 */
export function railFor(told: Found[], tagged: Found[], own: Story | null): Found[] {
  const items = own ? own.memories.filter(saved).map((memory) => ({ story: own, memory })) : [...told, ...tagged];
  const byId = new Map(items.map((f) => [f.memory.id, f]));
  const ordered = sortByDate([...byId.values()].map((f) => f.memory), 1) as Memory[];
  return ordered.map((m) => byId.get(m.id)!).filter(Boolean);
}

/** Memories in the story that share a chapter or a year with the rail and are not on it; newest first, at most `limit`. */
export function relatedFor(rail: Found[], story: Story | null, limit = 3): Found[] {
  if (!story || !rail.length) return [];
  const on = new Set(rail.map((f) => f.memory.id));
  const chapters = new Set(rail.map((f) => f.memory.era).filter(Boolean));
  const years = new Set(rail.map((f) => (memoryDate(f.memory) as { year: number | null }).year).filter((y): y is number => y != null));
  const picks = story.memories.filter((m) => {
    if (!saved(m) || on.has(m.id)) return false;
    const { year } = memoryDate(m) as { year: number | null };
    return (m.era && chapters.has(m.era)) || (year != null && years.has(year));
  });
  return (sortByDate(picks, -1) as Memory[]).slice(0, limit).map((memory) => ({ story, memory }));
}

/** A contribution this person sent: their tree row on it, or their name at the front of the credit. */
export function noteIsFrom(c: Contribution, person: Person): boolean {
  if (c.personId && c.personId === person.id) return true;
  const first = fold(person.givenName);
  if (!first) return false;
  const credit = fold(String(c.contributorName || "").split(",")[0]);
  const full = fold(`${person.givenName} ${person.familyName}`);
  return credit === first || credit.startsWith(`${first} `) || (!!full && credit === full);
}

/** "3 memories · 2014 to 2024", "1 memory · 1968", or "" when the rail is empty. */
export function spanLine(rail: Found[]): string {
  if (!rail.length) return "";
  const years = rail.map((f) => (memoryDate(f.memory) as { year: number | null }).year).filter((y): y is number => y != null);
  const n = `${rail.length} ${rail.length === 1 ? "memory" : "memories"}`;
  if (!years.length) return n;
  const from = Math.min(...years);
  const to = Math.max(...years);
  return from === to ? `${n} · ${from}` : `${n} · ${from} to ${to}`;
}

/** One line of the person's own words for a card on the rail: the first real sentence, cut on a word. */
export function oneLine(memory: Memory, max = 120): string {
  const body = (memory.body || "").trim();
  if (body) return smarten(quoteFor(opening(body) || body, max) as string);
  const ex = (memory.excerpt || "").trim();
  if (!ex || /^the (speaker|narrator|storyteller)\b/i.test(ex)) return "";
  return smarten(quoteFor(ex, max) as string);
}
