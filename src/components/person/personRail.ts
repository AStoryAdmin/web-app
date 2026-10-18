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
import { keptLine, ownWords, tellerTurns } from "../archive/transcript";
import type { Contribution } from "../../data/contributions";
import type { Family, Person } from "../../data/family";
import { relationTo, type Index } from "../family/familyView";
import type { Memory, Story } from "../../data/stories";

export type Found = { story: Story; memory: Memory };

const fold = (s: string) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const saved = (m: Memory) => m.status !== "in_progress";

/**
 * The memories that hang off the rail: their own story when they have one,
 * the ones they told or sent, and the ones somebody said they are in;
 * oldest first so the newest is last, undated at the end. A person with a
 * story of their own is still in other people's memories, so all of it
 * goes on the one rail, each memory once.
 */
export function railFor(told: Found[], tagged: Found[], own: Story | null): Found[] {
  const items = [...(own ? own.memories.filter(saved).map((memory) => ({ story: own, memory })) : []), ...told, ...tagged];
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

/** How a memory's date reads in a span: "1968", or "the 2020s" when only the decade was given. */
function whenOf(m: Memory): { year: number; label: string } | null {
  const { year, text } = memoryDate(m) as { year: number | null; text: string };
  if (year == null) return null;
  return /\d{4}s/.test(text) ? { year, label: `the ${year}s` } : { year, label: String(year) };
}

/** "3 memories · 2014 to 2024", "1 memory · the 2020s", or "" when the rail is empty. Says the date as the cards do. */
export function spanLine(rail: Found[]): string {
  if (!rail.length) return "";
  const whens = rail.map((f) => whenOf(f.memory)).filter((w): w is { year: number; label: string } => !!w);
  const n = `${rail.length} ${rail.length === 1 ? "memory" : "memories"}`;
  if (!whens.length) return n;
  const first = whens.reduce((a, b) => (b.year < a.year ? b : a));
  const last = whens.reduce((a, b) => (b.year > a.year ? b : a));
  return first.label === last.label ? `${n} · ${first.label}` : `${n} · ${first.label} to ${last.label}`;
}

/**
 * The rail in two groups, never mixed (BAOS rule 29): what this person told themselves (their own story's
 * memories, and what they sent in for somebody else's), and what other people told with them in it, each of
 * those carrying its teller. Each oldest first.
 */
export function splitRail(told: Found[], tagged: Found[], own: Story | null): { theirs: Found[]; others: Found[] } {
  const all = railFor(told, tagged, own);
  const mine = new Set([...(own ? own.memories.filter((m) => saved(m) && !m.contributor).map((m) => m.id) : []), ...told.map((f) => f.memory.id)]);
  return { theirs: all.filter((f) => mine.has(f.memory.id)), others: all.filter((f) => !mine.has(f.memory.id)) };
}

/**
 * One line of the person's own words for a card on the rail: the first real sentence, cut on a word. From a
 * call or a chat only the teller's own turns count, tidied and with no "You:" or "AI:" labels; a memory with no
 * words of theirs gets no line at all.
 */
export function oneLine(memory: Memory, max = 120): string {
  const body = (memory.body || "").trim();
  if (body) {
    const own = ownWords(tellerTurns(body)).trim();
    if (!own) return "";
    return smarten(quoteFor(opening(own) || own, max) as string);
  }
  const ex = (memory.excerpt || "").trim();
  if (!ex || /^the (speaker|narrator|storyteller)\b/i.test(ex)) return "";
  return smarten(quoteFor(ex, max) as string);
}

/** The line a page quotes from a memory: its kept line (one whole sentence of theirs, verbatim) when it has one, else the opening of their own words. */
export function saidLine(memory: Memory, max = 190): string {
  const kept = keptLine(memory.body || "");
  return kept ? smarten(kept) : oneLine(memory, max);
}

const byBirth = (a: Person, b: Person) => (a.birthYear || 9999) - (b.birthYear || 9999);

/**
 * The people the tree joins to a person, nearest first: parents, partners, brothers and sisters, children,
 * then the in-laws the tree joins through them (a partner's parents, a child's or a sibling's partner), then
 * friends and anyone joined by a word of the family's own. Each once, with what they are to the person.
 */
export function kinOf(person: Person, family: Family | null, index: Index): { person: Person; rel: string }[] {
  const byId = new Map((family?.people || []).map((p) => [p.id, p]));
  const ids = (m: Map<string, string[]>, id: string) => (m.get(id) || []).filter((x) => byId.has(x));
  const parents = ids(index.parentsOf, person.id);
  const partners = ids(index.spousesOf, person.id);
  const siblings = [...new Set(parents.flatMap((pid) => ids(index.childrenOf, pid)))].filter((x) => x !== person.id);
  const children = ids(index.childrenOf, person.id);
  const inLaws = [...partners.flatMap((id) => ids(index.parentsOf, id)), ...children.flatMap((id) => ids(index.spousesOf, id)), ...siblings.flatMap((id) => ids(index.spousesOf, id))];
  const others = ((index.otherOf.get(person.id) || []) as { id: string; label: string }[]).map((o) => o.id).filter((x) => byId.has(x));
  const seen = new Set<string>([person.id]);
  const out: { person: Person; rel: string }[] = [];
  for (const group of [parents, partners, siblings, children, inLaws, others]) {
    for (const p of group
      .map((x) => byId.get(x)!)
      .filter((p) => p && !p.id.startsWith("story:"))
      .sort(byBirth)) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      out.push({ person: p, rel: relationTo(index, p.id, person.id) });
    }
  }
  return out;
}
