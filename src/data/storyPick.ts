/**
 * Starting a story for somebody the family tree already knows, as the
 * app's NewStoryScreen picks a person: the name typed on "Someone in my
 * family" is looked for in the tree, and a match is offered before a second
 * Rose is made beside the first. What each match leads to:
 *
 * - "start": in the tree, no story and no account. Their story starts from
 *   what the tree knows, and their place is bound to it (link_person_story).
 * - "open": a story this account keeps already. It opens; nothing is made.
 * - "join": a story somebody else keeps, or a person on A Story who starts
 *   their own. Joined with their family code, never started a second time.
 *
 * Pure, so it's tested.
 */
import type { Family, Person } from "./family";
import { buildIndex, relationshipBetween } from "../app-core/lib/familyGraph.js";
import { relationshipForStory } from "../app-core/lib/personMemories.js";

export type StoryPick = { person: Person; kind: "start" | "open" | "join" };

/** Your own place in the tree when no story is bound to it yet. */
export function myUnboundPlace(people: Person[] | null | undefined, userId: string | null | undefined): Person | null {
  if (!userId) return null;
  return (people || []).find((p) => p.userId === userId && !p.storyId) ?? null;
}

const MIN_TYPED = 2;
const MAX_PICKS = 4;
const fold = (s: unknown) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

/** People in the tree whose name starts with what was typed, with what choosing each one does. */
export function storyPicks({
  people,
  meId,
  myStoryIds,
  typed,
}: {
  people: Person[] | null | undefined;
  meId: string | null | undefined;
  myStoryIds: string[];
  typed: string;
}): StoryPick[] {
  const q = fold(typed);
  if (q.length < MIN_TYPED) return [];
  const mine = new Set(myStoryIds);
  return (people || [])
    .filter((p) => {
      if (!p || p.source === "placeholder" || (meId && p.userId === meId)) return false;
      const given = fold(p.givenName);
      if (!given) return false;
      return given.startsWith(q) || `${given} ${fold(p.familyName)}`.startsWith(q);
    })
    .map((person): StoryPick => ({
      person,
      kind: person.storyId ? (mine.has(person.storyId) ? "open" : "join") : person.userId ? "join" : "start",
    }))
    .sort((a, b) => {
      // the ones a new story is for first, then the living before the remembered, oldest first
      const order = { start: 0, open: 1, join: 2 };
      if (order[a.kind] !== order[b.kind]) return order[a.kind] - order[b.kind];
      const da = a.person.deathYear ? 1 : 0;
      const db = b.person.deathYear ? 1 : 0;
      if (da !== db) return da - db;
      return (Number(a.person.birthYear) || 9999) - (Number(b.person.birthYear) || 9999);
    })
    .slice(0, MAX_PICKS);
}

/**
 * What the tree already says about who they are to you, as one of the
 * relationships the form offers (`offered`); null when the tree doesn't
 * know, or knows a word the form has no chip for.
 */
export function relationFromTree(family: Family | null, personId: string, meId: string | null | undefined, offered: readonly string[]): string | null {
  if (!family || !meId) return null;
  const me = family.people.find((p) => p.userId === meId);
  if (!me) return null;
  const rel = relationshipBetween(buildIndex(family), personId, me.id) as { label?: string } | null;
  const story = relationshipForStory(rel?.label || "") as { relationship: string } | null;
  if (!story) return null;
  // the app's words for these two, in the web's list
  const word = story.relationship === "Spouse" ? "Partner" : story.relationship;
  return offered.includes(word) ? word : null;
}

/** The new story's fields from their place in the tree (the app's choosePerson). */
export function storyFieldsFrom(person: Person): { name: string; lastName: string; birthYear: string; hasAccount: string | null } {
  return {
    name: String(person.givenName || "").trim(),
    lastName: String(person.familyName || "").trim(),
    birthYear: person.birthYear ? String(person.birthYear) : "",
    hasAccount: person.deathYear ? "cannot" : person.userId ? "yes" : null,
  };
}
