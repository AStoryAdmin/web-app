/**
 * What each print on the tree says about its person: the name in the book's
 * face, the years, the state in the product's exact words (docs/PRD.md
 * §3.3a), the storyteller's ribbon, the tinted paper behind an initial, and
 * the quiet caption that appears under the pointer. Pure; the tree draws it.
 */
import type { Family, Person } from "../../../data/family";
import type { Story } from "../../../data/stories";
import { firstName, linkState, memoriesBy, memoriesWith, personName, relationTo, stateWords, type Index, type LinkState } from "../familyView";
import type { LayoutEdge, LayoutPerson } from "../../../lib/familyLayout";

export type NodeState = LinkState["key"];
export type GhostKind = "parent" | "child" | "sibling" | "spouse";

export type NodeInfo = {
  id: string;
  name: string;
  initial: string;
  years: string;
  state: NodeState;
  /** "not on A Story yet", "invited · waiting for them", "on A Story"; "" for somebody who has passed. */
  stateWord: string;
  teller: boolean;
  photo: string | null;
  /** The paper behind an initial: one of the memory papers, chosen by the name. */
  tint: string;
  /** Under the pointer: "Rose's sister · What they remember: 2". */
  caption: string;
  /** Where a click goes; null for a place that is not a person yet. */
  href: string | null;
  ghost?: GhostKind;
};

export const PLACE_KINDS: GhostKind[] = ["parent", "child", "sibling", "spouse"];
export const GHOST_WORDS: Record<GhostKind, string> = { parent: "a parent", child: "a child", sibling: "a sibling", spouse: "a spouse" };
export const ADD_WORDS: Record<GhostKind, string> = { parent: "Add a parent", child: "Add a child", sibling: "Add a sibling", spouse: "Add a spouse" };
/** "Add as Rose's parent" */
export const placeWord = (kind: GhostKind, anchorFirst: string) => `Add as ${anchorFirst}'s ${kind}`;

const PAPERS = ["blush", "periwinkle", "sage", "lilac", "apricot", "butter", "sea"];
export function paperFor(name: string): string {
  let h = 7;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 1000003;
  return `var(--paper-${PAPERS[h % PAPERS.length]})`;
}

/** "1941 –", "1912 – 1979", "– 2001", or "". */
export function yearsOf(p: { birthYear?: number | null; deathYear?: number | null }): string {
  if (p.birthYear && p.deathYear) return `${p.birthYear} – ${p.deathYear}`;
  if (p.birthYear) return `${p.birthYear} –`;
  if (p.deathYear) return `– ${p.deathYear}`;
  return "";
}

const n = (k: number, one: string, many = `${one}s`) => `${k} ${k === 1 ? one : many}`;

/** The family's own word for an 'other' relation to the storyteller ("godmother", "neighbour"), or "". */
function otherWord(index: Index, personId: string, tellerId: string | null): string {
  if (!tellerId) return "";
  const list = (index.otherOf.get(personId) || []) as { id: string; label: string }[];
  return list.find((o) => o.id === tellerId)?.label || "";
}

export type ModelContext = { story: Story | null; index: Index; tellerId: string | null; meId: string | null | undefined };

/** The caption under the pointer. The storyteller's counts their memories; everyone else's says what they are and what they gave. */
export function captionFor(person: Person, ctx: ModelContext): string {
  const teller = !!ctx.story && person.storyId === ctx.story.id;
  if (teller && ctx.story) {
    const kept = ctx.story.memories.filter((m) => m.status !== "in_progress");
    if (!kept.length) return "No memories kept yet";
    const written = kept.filter((m) => !m.audio?.length && !m.familyCallId).length;
    return `${n(kept.length, "memory", "memories")}${written && written < kept.length ? ` · Written ${written} of them` : written === kept.length && written > 1 ? " · All written" : ""}`;
  }
  const tellerPerson = ctx.tellerId ? (ctx.index.people.get(ctx.tellerId) as Person | undefined) : undefined;
  const who = tellerPerson ? firstName(tellerPerson) : ctx.story?.name || "";
  const rel = relationTo(ctx.index, person.id, ctx.tellerId) || otherWord(ctx.index, person.id, ctx.tellerId);
  const by = memoriesBy(person, ctx.story).length;
  const within = memoriesWith(person, ctx.story).length;
  return [rel && who ? `${who}'s ${rel}` : "", by ? `What they remember: ${by}` : "", within ? `In ${n(within, "memory", "memories")}` : ""].filter(Boolean).join(" · ");
}

export function nodeInfo(person: Person, ctx: ModelContext): NodeInfo {
  const name = personName(person);
  const state = linkState(person, ctx.meId).key;
  const teller = !!ctx.story && person.storyId === ctx.story.id;
  return {
    id: person.id,
    name,
    initial: (person.givenName || name || "?").trim()[0]?.toUpperCase() || "?",
    years: yearsOf(person),
    state,
    stateWord: stateWords(state),
    teller,
    photo: person.photo || null,
    tint: paperFor(name),
    caption: captionFor(person, ctx),
    href: person.id.startsWith("story:") ? null : `/family/${person.id}`,
  };
}

export function nodeInfos(people: Person[], ctx: ModelContext): Map<string, NodeInfo> {
  return new Map(people.map((p) => [p.id, nodeInfo(p, ctx)]));
}

/**
 * The storyteller's own row when the tree has none yet: the story's name
 * and years, drawn so the page is never empty, never written anywhere.
 */
export function virtualTeller(story: Story): Person {
  const year = parseInt(String(story.birthYear || ""), 10);
  return { id: `story:${story.id}`, householdId: null, givenName: story.name, familyName: story.lastName, sex: "", source: "manual", storyId: story.id, ...(story.photo ? { photo: story.photo } : {}), ...(year > 0 ? { birthYear: year } : {}) } as Person;
}

/** The four places around a lone storyteller that invite: a parent above, a sibling beside, a spouse beside, a child below. */
export function ghostFamily(focus: LayoutPerson): { people: LayoutPerson[]; edges: LayoutEdge[]; infos: Map<string, NodeInfo> } {
  const ids: Record<GhostKind, string> = { parent: "ghost:parent", sibling: "ghost:sibling", spouse: "ghost:spouse", child: "ghost:child" };
  const born = focus.birthYear || 1950;
  const people: LayoutPerson[] = [focus, { id: ids.parent, birthYear: born - 28 }, { id: ids.sibling, birthYear: born + 2 }, { id: ids.spouse, birthYear: born }, { id: ids.child, birthYear: born + 28 }];
  const edges: LayoutEdge[] = [
    { from: ids.parent, to: focus.id, kind: "parent" },
    { from: ids.parent, to: ids.sibling, kind: "parent" },
    { from: focus.id, to: ids.spouse, kind: "spouse" },
    { from: focus.id, to: ids.child, kind: "parent" },
    { from: ids.spouse, to: ids.child, kind: "parent" },
  ];
  const infos = new Map<string, NodeInfo>();
  for (const kind of PLACE_KINDS) {
    infos.set(ids[kind], { id: ids[kind], name: GHOST_WORDS[kind], initial: "", years: "", state: "listed", stateWord: "", teller: false, photo: null, tint: "transparent", caption: ADD_WORDS[kind], href: null, ghost: kind });
  }
  return { people, edges, infos };
}

/** The people a tree draws: everyone real, plus the storyteller's own row when the tree has none. */
export function treePeople(people: Person[], story: Story | null): Person[] {
  if (!story || people.some((p) => p.storyId === story.id)) return people;
  return [virtualTeller(story), ...people];
}

/** "Three generations, so far", or the words for one or two people. */
export function treeTitle(people: Person[], story: Story | null, own: boolean, rows: number): string {
  const real = people.filter((p) => !p.id.startsWith("story:"));
  if (real.length <= 1) return own ? "It's just you so far. Who else was there?" : `It's you and ${story?.name || "them"} so far. Who else was there?`;
  if (real.length === 2) return "The two of you, so far. Who else was there?";
  const words = ["One", "Two", "Three", "Four", "Five", "Six"];
  const k = Math.max(1, Math.min(rows, words.length));
  return `${words[k - 1]} generation${k === 1 ? "" : "s"}, so far`;
}

export const isFamilyPerson = (f: Family | null, id: string) => !!f?.people.some((p) => p.id === id);
