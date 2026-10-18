/**
 * The family as an album: one row of photo cards per generation, placed
 * relative to the storyteller ("Rose’s parents", "Rose’s sister and
 * brother", "Rose’s children"), couples side by side, a ghost card where a
 * relation is missing, and a shelf of the people nobody has placed yet.
 * Pure; tree/plateModel orders it into the plate that FamilyTree draws. The generation of each person comes from the
 * same walk the phone app uses (app-core/lib/familyTree.js generationOf),
 * so the two products never disagree about who sits where.
 */
import type { Person } from "../../../data/family";
import { generationOf } from "../../../app-core/lib/familyTree.js";
import { relationshipBetween } from "../../../app-core/lib/familyGraph.js";
import { firstName, relationTo, type Index } from "../familyView";

/** The relations a ghost card can add: the four places beside somebody, and a grandchild through one of the children. */
export type AlbumKind = "parent" | "child" | "sibling" | "spouse" | "grandchild";

export type Ghost = { key: string; label: string; anchorId: string | null; kind: AlbumKind };
/** One or two people drawn together: a couple shares one card-group under a gold hairline with their names as its caption. */
export type Unit = { people: Person[]; caption: string };
export type AlbumRow = {
  level: number;
  /** "Rose’s parents", "Your children". */
  title: string;
  /** "· and Margaret’s": whose the people in the row are when they are not the storyteller’s own. */
  note: string;
  /** "1940s", from the row’s birth years; "" when none are known. */
  decade: string;
  units: Unit[];
  ghosts: Ghost[];
  /** Under a person’s years: "Margaret’s" for a niece, "cousin" for a cousin; nothing for the storyteller’s own. */
  sub: Map<string, string>;
};
export type Album = {
  teller: Person | null;
  spouses: Person[];
  rows: AlbumRow[];
  unplaced: Person[];
  /** How many people the drawing places, the storyteller included. */
  placed: number;
  /** Distinct generations placed, the storyteller’s included. */
  generations: number;
  /** Nobody is placed but the storyteller. */
  lone: boolean;
};

const WORDS = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight"];

const byBirth = (a: Person, b: Person) => (a.birthYear || 9999) - (b.birthYear || 9999) || String(a.givenName || "").localeCompare(String(b.givenName || ""));

/** "1940s" from the middle birth year of a group; "" when no year is known. */
export function decadeOf(people: { birthYear?: number | null }[]): string {
  const years = people.map((p) => p.birthYear).filter((y): y is number => typeof y === "number" && y > 0).sort((a, b) => a - b);
  if (!years.length) return "";
  return `${Math.floor(years[Math.floor((years.length - 1) / 2)] / 10) * 10}s`;
}

/** "Four generations, so far"; "One generation, so far". */
export function generationsLine(n: number): string {
  const k = Math.max(1, Math.min(n, WORDS.length - 1));
  return `${WORDS[k]} generation${k === 1 ? "" : "s"}, so far`;
}

/** "16 people, 2 not placed yet" or "16 people". */
export function peopleLine(total: number, unplaced: number): string {
  const people = `${total} ${total === 1 ? "person" : "people"}`;
  return unplaced ? `${people}, ${unplaced} not placed yet` : people;
}

/* The word for the people one generation holds, relative to the storyteller. */
const plural = (one: string, many: string, n: number) => (n === 1 ? one : many);

function siblingWord(sibs: Person[]): string {
  const sisters = sibs.filter((p) => p.sex === "F").length;
  const brothers = sibs.filter((p) => p.sex === "M").length;
  if (sisters + brothers < sibs.length) return "brothers and sisters";
  return [sisters ? plural("sister", "sisters", sisters) : "", brothers ? plural("brother", "brothers", brothers) : ""].filter(Boolean).join(" and ");
}

function parentWord(parents: Person[]): string {
  if (parents.length !== 1) return "parents";
  return parents[0].sex === "F" ? "mother" : parents[0].sex === "M" ? "father" : "parent";
}

function childWord(children: Person[]): string {
  if (children.length !== 1) return "children";
  return children[0].sex === "F" ? "daughter" : children[0].sex === "M" ? "son" : "child";
}

const greats = (n: number, base: string) => `${"great-".repeat(Math.max(0, n))}grand${base}`;

/**
 * "Rose’s parents", "Your sister and brother". `whose` is "Rose’s" or "Your".
 * A row beside the storyteller with no brother or sister in it is named by
 * what it holds: "Rose’s cousins", "Rose’s friends" (a relation the family
 * wrote in its own word), or "Rose’s family and friends" when mixed.
 */
export function rowTitle(level: number, main: Person[], extras: Person[], whose: string, extraCodes: string[] = [], owners: string[] = []): string {
  if (level !== 0 && !main.length && extras.length) {
    // Nobody here is the storyteller’s own: a friend’s father, a sister-in-law’s children. Say whose they are.
    if (!owners.length) return `${whose} wider family`;
    const who = owners.join(" and ");
    if (level === -1) return `${who} ${parentWord(extras)}`;
    if (level <= -2) return `${who} ${greats(-level - 2, "parents")}`;
    if (level === 1) return `${who} ${childWord(extras)}`;
    return `${who} ${greats(level - 2, "children")}`;
  }
  if (level === -1) return `${whose} ${parentWord(main)}`;
  if (level <= -2) return `${whose} ${greats(-level - 2, "parents")}`;
  if (level === 1) return `${whose} ${childWord(main)}`;
  if (level >= 2) return `${whose} ${greats(level - 2, "children")}`;
  if (main.length) return `${whose} ${siblingWord(main)}`;
  if (!extras.length) return `${whose} generation`;
  if (extraCodes.length === extras.length && extraCodes.every((c) => c.startsWith("cousin-"))) return `${whose} cousins`;
  const stated = extraCodes.map((c) => (c.startsWith("stated:") ? c.slice(7) : ""));
  if (stated.length === extras.length && stated[0] && stated.every((w) => w === stated[0])) return `${whose} ${stated[0]}s`;
  return `${whose} family and friends`;
}

/** Whether a relation label puts somebody in the storyteller’s own line at this level. */
export function isMain(level: number, code: string): boolean {
  if (level === -1) return code === "parent";
  if (level === 1) return code === "child";
  if (level === 0) return code === "sibling";
  if (level <= -2) return code === `ancestor-${-level}`;
  return code === `descendant-${level}`;
}

/** What `from` is to `to`, as the stable code ("parent", "sibling", "cousin-1-0"), or "". */
export function codeOf(index: Index, fromId: string, toId: string): string {
  const r = relationshipBetween(index, fromId, toId) as { code: string; label: string } | null;
  if (!r) return "";
  return r.code === "stated" ? `stated:${r.label}` : r.code;
}

export function buildAlbum(o: { people: Person[]; index: Index; tellerId: string | null; meId?: string | null; own?: boolean }): Album {
  const { people, index, tellerId } = o;
  const byId = new Map(people.map((p) => [p.id, p]));
  const teller = (tellerId && byId.get(tellerId)) || null;
  const whose = o.own ? "Your" : `${firstName(teller)}’s`;

  if (!teller) {
    return { teller: null, spouses: [], rows: [], unplaced: people.slice().sort(byBirth), placed: 0, generations: 0, lone: true };
  }

  const gen = generationOf(index, teller.id) as Map<string, number>;
  const parentsOf = (id: string) => ((index.parentsOf.get(id) || []) as string[]).filter((pid) => byId.has(pid));
  const childrenOf = (id: string) => ((index.childrenOf.get(id) || []) as string[]).filter((cid) => byId.has(cid));
  const spousesOf = (id: string) => ((index.spousesOf.get(id) || []) as string[]).filter((sid) => byId.has(sid));

  const spouses = spousesOf(teller.id)
    .map((id) => byId.get(id)!)
    .sort(byBirth);
  const spouseIds = new Set(spouses.map((s) => s.id));
  const placedPeople = people.filter((p) => gen.has(p.id));
  const unplaced = people.filter((p) => !gen.has(p.id)).sort(byBirth);

  // One row per generation, the storyteller’s own layer (them and their spouses) left out of the rows.
  const levels = new Map<number, Person[]>();
  for (const p of placedPeople) {
    if (p.id === teller.id || spouseIds.has(p.id)) continue;
    const g = gen.get(p.id)!;
    levels.set(g, [...(levels.get(g) || []), p]);
  }
  const sortedLevels = [...levels.keys()].sort((a, b) => a - b);
  const topLevel = sortedLevels.length ? sortedLevels[0] : 0;

  const rows: AlbumRow[] = sortedLevels.map((level) => {
    const members = levels.get(level)!.sort(byBirth);
    const mainIds = new Set(members.filter((p) => isMain(level, codeOf(index, p.id, teller.id))).map((p) => p.id));
    const main = members.filter((p) => mainIds.has(p.id));
    // Everyone else: a spouse of somebody in the row sits beside them; the rest are "Margaret’s" or "cousin".
    const sub = new Map<string, string>();
    const extras: Person[] = [];
    for (const p of members) {
      if (mainIds.has(p.id)) continue;
      if (spousesOf(p.id).some((sid) => mainIds.has(sid))) continue;
      extras.push(p);
      // Whose they are: through a parent in the row above, or, for an ancestor, a child in the row below.
      const ancestor = level < 0;
      const nearerLevel = ancestor ? level + 1 : level - 1;
      const nearer = levels.get(nearerLevel) || [];
      const pool = (ancestor ? childrenOf(p.id) : parentsOf(p.id)).map((id) => byId.get(id)!);
      // Only somebody who is something to the storyteller can say whose a person is; a friend’s father is "friend", not "Ty’s".
      const related = (q: Person) => !!codeOf(index, q.id, teller.id);
      const via = pool.find((q) => nearer.includes(q) && isMain(nearerLevel, codeOf(index, q.id, teller.id))) || pool.find((q) => nearer.includes(q) && related(q)) || pool.find(related);
      sub.set(p.id, via ? `${firstName(via)}’s` : relationTo(index, p.id, teller.id));
    }
    // Two generations away and further, the storyteller’s own carry the line they came through: "Maya · Daniel’s".
    if (Math.abs(level) >= 2) {
      for (const p of main) {
        const step = level > 0 ? parentsOf(p.id) : childrenOf(p.id);
        const nearer = levels.get(level > 0 ? level - 1 : level + 1) || [];
        const via = step.map((pid) => byId.get(pid)!).find((q) => nearer.includes(q));
        if (via) sub.set(p.id, `${firstName(via)}’s`);
      }
    }
    // Couples together, under one caption.
    const used = new Set<string>();
    const units: Unit[] = [];
    for (const p of members) {
      if (used.has(p.id)) continue;
      used.add(p.id);
      const partnerId = spousesOf(p.id).find((sid) => members.some((m) => m.id === sid) && !used.has(sid));
      if (partnerId) {
        used.add(partnerId);
        const partner = byId.get(partnerId)!;
        const pair = mainIds.has(partner.id) && !mainIds.has(p.id) ? [partner, p] : [p, partner];
        units.push({ people: pair, caption: `${firstName(pair[0])} & ${firstName(pair[1])}` });
      } else units.push({ people: [p], caption: "" });
    }
    const ghosts: Ghost[] = [];
    if (level === -1 && main.length < 2) ghosts.push({ key: "parent", label: main.length ? "a parent" : o.own ? "a parent of yours" : `a parent of ${firstName(teller)}`, anchorId: teller.id, kind: "parent" });
    if (level < 0 && level === topLevel) for (const p of main) if (!parentsOf(p.id).length) ghosts.push({ key: `parents:${p.id}`, label: `${firstName(p)}’s parents`, anchorId: p.id, kind: "parent" });
    if (level === 0) ghosts.push({ key: "sibling", label: "a sister or brother", anchorId: teller.id, kind: "sibling" });
    if (level === 1) ghosts.push({ key: "child", label: "a child", anchorId: teller.id, kind: "child" });
    if (level === 2) ghosts.push({ key: "grandchild", label: "a grandchild", anchorId: teller.id, kind: "grandchild" });
    const names = [...new Set(extras.map((p) => sub.get(p.id) || "").filter((s) => /['’]s$/.test(s)))];
    const extraCodes = extras.map((p) => codeOf(index, p.id, teller.id)).filter(Boolean);
    const title = rowTitle(level, main, extras, whose, extraCodes, names);
    // The note names whose the others are; when the title already does, it is left out.
    const note = names.length && (main.length || level === 0) ? `· and ${names.join(" and ")}` : "";
    return { level, title, note, decade: decadeOf(members), units, ghosts, sub };
  });

  const placed = placedPeople.length;
  const generations = new Set([0, ...sortedLevels]).size;
  return { teller, spouses, rows, unplaced, placed, generations, lone: placed <= 1 };
}

/** The three places that invite when the storyteller is alone. */
export function loneGhosts(tellerId: string | null): Ghost[] {
  return [
    { key: "parent", label: "a parent", anchorId: tellerId, kind: "parent" },
    { key: "sibling", label: "a sister or brother", anchorId: tellerId, kind: "sibling" },
    { key: "child", label: "a child", anchorId: tellerId, kind: "child" },
  ];
}

/** "Rose’s husband", "Rose’s husbands", "Your wife", "Rose’s partners". */
export function spousesLabel(index: Index, spouses: Person[], tellerId: string, whose: string): string {
  const words = [...new Set(spouses.map((s) => relationTo(index, s.id, tellerId) || "partner"))];
  if (words.length === 1) {
    const w = words[0];
    return `${whose} ${spouses.length === 1 ? w : w === "wife" ? "wives" : `${w}s`}`;
  }
  return `${whose} partners`;
}
