/**
 * The family as one engraved plate, the way the front of a family book
 * draws it: one tier per generation relative to the storyteller, oldest at
 * the top, the storyteller in the middle of their own tier between their
 * partners, brothers and sisters either side by age, children under their
 * parents, and a fine thread from every couple down to each of their
 * children. Under each face, what they are to the storyteller in plain
 * words ("mother", "Daniel's son", "friend"), so the plate reads on a phone
 * where the threads are left out. A dashed ring where a relation is
 * missing. Pure; FamilyTree draws it.
 *
 * The generations come from buildAlbum (and through it from the phone
 * app's generationOf), so the two products never disagree about who sits
 * where; this module only orders the tiers and works out the threads.
 */
import type { Person } from "../../../data/family";
import { buildAlbum, codeOf, decadeOf, isMain, type AlbumKind, type AlbumRow } from "../album/albumModel";
import { firstName, relationTo, type Index } from "../familyView";

export type PlateNode = {
  id: string;
  person: Person;
  /** What they are to the storyteller: "mother", "Daniel's son", "friend"; "" when nothing can be said. */
  rel: string;
  teller: boolean;
};
/** A couple (or the storyteller between their partners) drawn together, joined by an ampersand. */
export type PlateUnit = { key: string; nodes: PlateNode[] };
export type PlateGhost = { key: string; node: string; label: string; anchorId: string | null; kind: AlbumKind };
export type PlateTier = {
  key: string;
  level: number;
  /** "Rose's parents", "Your generation", "Rose's children". */
  title: string;
  /** "1910s", from the tier's birth years; "" when none are known. */
  decade: string;
  units: PlateUnit[];
  ghosts: PlateGhost[];
  /** The storyteller's own tier. */
  home: boolean;
};
/** A thread from one or two parents (node ids) down to a child (a node id, or a ghost's). */
export type PlateLink = { key: string; from: string[]; to: string; dashed: boolean };
export type Plate = {
  teller: Person | null;
  tiers: PlateTier[];
  links: PlateLink[];
  unplaced: Person[];
  /** Distinct generations drawn, the storyteller's included. */
  generations: number;
  placed: number;
  /** Nobody is placed but the storyteller. */
  lone: boolean;
};

const childWord = (p: Person) => (p.sex === "F" ? "daughter" : p.sex === "M" ? "son" : "child");
const parentWord = (p: Person) => (p.sex === "F" ? "mother" : p.sex === "M" ? "father" : "parent");

/**
 * The name of a tier that holds more than the storyteller's own line (a niece among the children, a friend's
 * father among the parents): the generation, as the phone app names it (familyTree.js bandTitle), so a niece is
 * never filed under "Rose's children". The words under each face say who each person is.
 */
export function generationTitle(level: number, whose: string): string {
  if (level === 0) return `${whose} generation`;
  const greats = (n: number) => "great-".repeat(Math.max(0, n));
  const word = level === -1 ? "Parents'" : level < -1 ? `${greats(-level - 2)}grandparents'` : level === 1 ? "Children's" : `${greats(level - 2)}grandchildren's`;
  return `${word.charAt(0).toUpperCase()}${word.slice(1)} generation`;
}

/** Brothers and sisters either side of the storyteller: older on the left, younger on the right, then evened out so the storyteller sits near the middle. */
export function aroundTeller<T>(units: T[], born: (u: T) => number, tellerBorn: number): { left: T[]; right: T[] } {
  const sorted = units.slice().sort((a, b) => born(a) - born(b));
  const left = sorted.filter((u) => tellerBorn && born(u) && born(u) < tellerBorn);
  const right = sorted.filter((u) => !left.includes(u));
  while (right.length - left.length > 1) left.push(right.shift()!);
  while (left.length - right.length > 1) right.unshift(left.pop()!);
  return { left, right };
}

export function buildPlate(o: { people: Person[]; index: Index; tellerId: string | null; meId?: string | null; own?: boolean }): Plate {
  const { people, index } = o;
  const album = buildAlbum(o);
  const teller = album.teller;
  if (!teller) return { teller: null, tiers: [], links: [], unplaced: album.unplaced, generations: 0, placed: 0, lone: true };

  const whose = o.own ? "Your" : `${firstName(teller)}'s`;
  const byId = new Map(people.map((p) => [p.id, p]));
  const parentsOf = (id: string) => ((index.parentsOf.get(id) || []) as string[]).filter((pid) => byId.has(pid));
  const childrenOf = (id: string) => ((index.childrenOf.get(id) || []) as string[]).filter((cid) => byId.has(cid));
  const tellerParents = parentsOf(teller.id);

  const node = (p: Person, row: AlbumRow | null): PlateNode => {
    if (p.id === teller.id) return { id: p.id, person: p, rel: "", teller: true };
    const sub = row?.sub.get(p.id) || "";
    const level = row?.level ?? 0;
    // "Daniel's" means through Daniel: his son, or (above the storyteller) Nhi's father.
    const rel = /'s$/.test(sub) ? `${sub} ${level < 0 ? parentWord(p) : childWord(p)}` : relationTo(index, p.id, teller.id) || sub;
    return { id: p.id, person: p, rel, teller: false };
  };
  const unitOf = (people: Person[], row: AlbumRow | null): PlateUnit => ({ key: people.map((p) => p.id).join("+"), nodes: people.map((p) => node(p, row)) });

  // The tiers, from the album's rows, with the storyteller's own layer put back in the middle of tier 0.
  const rows = new Map(album.rows.map((r) => [r.level, r]));
  const levels = [...new Set([...rows.keys(), 0])].sort((a, b) => a - b);
  const tiers: PlateTier[] = levels.map((level) => {
    const row = rows.get(level) || null;
    const members = row ? row.units.flatMap((u) => u.people) : [];
    let units = row ? row.units.map((u) => unitOf(u.people, row)) : [];
    if (level === 0) {
      const spouses = album.spouses;
      const home = unitOf([...spouses.slice(0, 1), teller, ...spouses.slice(1)], row);
      // Brothers and sisters share a parent with the storyteller; everybody else in the tier (cousins, friends) follows.
      const sibling = (u: PlateUnit) => u.nodes.some((n) => parentsOf(n.id).some((pid) => tellerParents.includes(pid)));
      const born = (u: PlateUnit) => Math.min(...u.nodes.map((n) => n.person.birthYear || 9999));
      const { left, right } = aroundTeller(units.filter(sibling), born, teller.birthYear || 0);
      units = [...left, home, ...right, ...units.filter((u) => !sibling(u))];
    }
    const everyone = level === 0 ? [teller, ...album.spouses, ...members] : members;
    const onlyOwnLine = level === 0 || members.every((p) => isMain(level, codeOf(index, p.id, teller.id)) || (index.spousesOf.get(p.id) || []).some((sid: string) => members.some((m) => m.id === sid && isMain(level, codeOf(index, sid, teller.id)))));
    const title = level === 0 ? generationTitle(0, whose) : onlyOwnLine && row ? row.title : generationTitle(level, whose);
    return { key: `tier:${level}`, level, title, decade: decadeOf(everyone), units, ghosts: [], home: level === 0 };
  });

  // Order each tier so the threads cross as little as they can: above the storyteller by where a unit's children sit
  // in the tier below, under the storyteller by where its parents sit in the tier above.
  const position = (tier: PlateTier) => {
    const at = new Map<string, number>();
    tier.units.forEach((u, i) => u.nodes.forEach((n) => at.set(n.id, i)));
    return at;
  };
  const sortBy = (tier: PlateTier, place: (u: PlateUnit) => number | null) => {
    const keyed = tier.units.map((u, i) => ({ u, i, k: place(u) }));
    keyed.sort((a, b) => (a.k ?? Infinity) - (b.k ?? Infinity) || a.i - b.i);
    tier.units = keyed.map((x) => x.u);
  };
  const zero = tiers.findIndex((t) => t.level === 0);
  for (let i = zero - 1; i >= 0; i--) {
    const below = position(tiers[i + 1]);
    sortBy(tiers[i], (u) => {
      const at = u.nodes.flatMap((n) => childrenOf(n.id)).map((cid) => below.get(cid)).filter((x): x is number => x != null);
      return at.length ? at.reduce((a, b) => a + b, 0) / at.length : null;
    });
  }
  for (let i = zero + 1; i < tiers.length; i++) {
    const above = position(tiers[i - 1]);
    sortBy(tiers[i], (u) => {
      const at = u.nodes.flatMap((n) => parentsOf(n.id)).map((pid) => above.get(pid)).filter((x): x is number => x != null);
      return at.length ? Math.min(...at) : null;
    });
  }

  // The threads: every person to their parents in the tier straight above.
  const levelOf = new Map<string, number>();
  for (const t of tiers) for (const u of t.units) for (const n of u.nodes) levelOf.set(n.id, t.level);
  const links: PlateLink[] = [];
  for (const t of tiers) {
    for (const u of t.units) {
      for (const n of u.nodes) {
        const ps = parentsOf(n.id).filter((pid) => levelOf.get(pid) === t.level - 1);
        if (!ps.length) continue;
        // Two parents drawn as one couple send one thread; parents drawn apart send one each.
        const above = tiers.find((x) => x.level === t.level - 1)!;
        const together = above.units.find((x) => ps.every((pid) => x.nodes.some((m) => m.id === pid)));
        if (together || ps.length === 1) links.push({ key: `${ps.join("+")}>${n.id}`, from: ps, to: n.id, dashed: false });
        else for (const pid of ps) links.push({ key: `${pid}>${n.id}`, from: [pid], to: n.id, dashed: false });
      }
    }
  }

  // The rings that invite: a relation that is missing, in the tier it would sit in.
  const ghost = (tier: PlateTier, key: string, label: string, anchorId: string | null, kind: AlbumKind, from?: string[]) => {
    const g: PlateGhost = { key, node: `ghost:${key}`, label, anchorId, kind };
    tier.ghosts.push(g);
    if (from?.length) links.push({ key: `${from.join("+")}>${g.node}`, from, to: g.node, dashed: true });
    return g;
  };
  const tierAt = (level: number) => {
    let t = tiers.find((x) => x.level === level);
    if (!t) {
      t = { key: `tier:${level}`, level, title: rowTitleFor(level, whose), decade: "", units: [], ghosts: [], home: false };
      tiers.push(t);
      tiers.sort((a, b) => a.level - b.level);
    }
    return t;
  };
  const tellerFirst = firstName(teller);
  const parentsPlaced = tellerParents.filter((pid) => levelOf.get(pid) === -1);
  if (parentsPlaced.length < 2) {
    const label = parentsPlaced.length ? "a parent" : o.own ? "a parent of yours" : `a parent of ${tellerFirst}`;
    const t = tierAt(-1);
    const g = ghost(t, "parent", label, teller.id, "parent");
    links.push({ key: `${g.node}>${teller.id}`, from: [g.node], to: teller.id, dashed: true });
  }
  // The oldest of the storyteller's own line, when nobody is above them yet.
  const top = tiers[0];
  if (top.level < 0) {
    for (const u of top.units)
      for (const n of u.nodes)
        if (isMain(top.level, codeOf(index, n.id, teller.id)) && !parentsOf(n.id).length) ghost(top, `parents:${n.id}`, `${firstName(n.person)}'s parents`, n.id, "parent");
  }
  ghost(tierAt(0), "sibling", "a sister or brother", teller.id, "sibling", parentsPlaced.length ? parentsPlaced : undefined);
  ghost(tierAt(1), "child", "a child", teller.id, "child", [teller.id]);
  const children = tiers.find((t) => t.level === 1)?.units.some((u) => u.nodes.some((n) => parentsOf(n.id).includes(teller.id)));
  if (children) ghost(tierAt(2), "grandchild", "a grandchild", teller.id, "grandchild");

  // A generation counts when the storyteller's own line is in it: a friend's father makes no generation of theirs.
  const own = (t: PlateTier) => t.home || t.units.some((u) => u.nodes.some((n) => isMain(t.level, codeOf(index, n.id, teller.id))));
  const generations = tiers.filter((t) => t.units.length && own(t)).length;
  return { teller, tiers, links, unplaced: album.unplaced, generations, placed: album.placed, lone: album.lone };
}

/** The title of a tier that only holds rings so far: "Your parents", "Rose's children". */
function rowTitleFor(level: number, whose: string): string {
  if (level === -1) return `${whose} parents`;
  if (level === 1) return `${whose} children`;
  if (level === 2) return `${whose} grandchildren`;
  return generationTitle(level, whose);
}
