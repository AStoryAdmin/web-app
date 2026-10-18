/**
 * What the family album and the place-somebody flow share: the four
 * relations a person can be placed as, the words for them, the years under
 * a name, and the storyteller’s own row when the family has none yet. Pure.
 */
import type { Family, Person } from "../../../data/family";
import type { Story } from "../../../data/stories";

export type GhostKind = "parent" | "child" | "sibling" | "spouse";

export const PLACE_KINDS: GhostKind[] = ["parent", "child", "sibling", "spouse"];
/** "Add as Rose’s parent" */
export const placeWord = (kind: GhostKind, anchorFirst: string) => `Add as ${anchorFirst}’s ${kind}`;

/** "1941 –", "1912 – 1979", "– 2001", or "". */
export function yearsOf(p: { birthYear?: number | null; deathYear?: number | null }): string {
  if (p.birthYear && p.deathYear) return `${p.birthYear} – ${p.deathYear}`;
  if (p.birthYear) return `${p.birthYear} –`;
  if (p.deathYear) return `– ${p.deathYear}`;
  return "";
}

/**
 * The storyteller’s own row when the family has none yet: the story’s name
 * and years, drawn so the page is never empty, never written anywhere.
 */
export function virtualTeller(story: Story): Person {
  const year = parseInt(String(story.birthYear || ""), 10);
  const own = story.relationship === "Myself" && story.ownerId;
  return { id: `story:${story.id}`, householdId: null, givenName: story.name, familyName: story.lastName, sex: "", source: "manual", storyId: story.id, ...(own ? { userId: story.ownerId } : {}), ...(story.photo ? { photo: story.photo } : {}), ...(year > 0 ? { birthYear: year } : {}) } as Person;
}

/** The people the album draws: everyone real, plus the storyteller’s own row when the family has none. */
export function treePeople(people: Person[], story: Story | null): Person[] {
  if (!story || people.some((p) => p.storyId === story.id)) return people;
  return [virtualTeller(story), ...people];
}

export const isFamilyPerson = (f: Family | null, id: string) => !!f?.people.some((p) => p.id === id);
