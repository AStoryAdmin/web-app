/**
 * The family as one engraved plate, the way the front of a family book
 * draws it: one tier per generation relative to the storyteller, oldest at
 * the top, and down the middle of every tier the storyteller's own line
 * (their parents above them, their children and grandchildren below), so
 * the storyteller always sits on the plate's axis. Everyone else hangs to
 * the left or the right of that line, on the side of the person they are
 * joined to: brothers and sisters either side by age, a niece under her
 * mother, a friend's father above the friend. A fine thread runs from every
 * couple down to each of their children, and because each person sits on
 * the side of whoever they are joined to, the threads do not cross.
 *
 * Under each face, what they are to the storyteller in plain words
 * ("mother", "Daniel's son", "Nhi's parent", "friend"), so the plate also
 * reads on a phone, where the threads are left out. At most one dashed
 * ring per tier, where a relation is missing: a parent above the
 * storyteller, the grandparents above the parents, a sister or brother
 * beside them, a child below. Pure; FamilyTree draws it.
 *
 * The generations come from buildAlbum (and through it from the phone
 * app's generationOf), so the two products never disagree about who sits
 * where; this module only arranges the tiers and works out the threads.
 */
import type { Person } from "../../../data/family";
import { buildAlbum, codeOf, decadeOf, isMain, rowTitle, type AlbumKind, type AlbumRow } from "../album/albumModel";
import { firstName, personName, relationTo, type Index } from "../familyView";

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
/** Where something sits in its tier: left of the storyteller's line, on it, or right of it. */
export type Zone = "left" | "centre" | "right";
export type PlateItem = { key: string; unit?: PlateUnit; ghost?: PlateGhost };
export type PlateTier = {
  key: string;
  level: number;
  /** "Rose's parents", "Your generation", "Rose's children, and Margaret's". */
  title: string;
  /** "1910s", from the tier's birth years; "" when none are known. */
  decade: string;
  /** Everyone in the tier, left to right. */
  units: PlateUnit[];
  /** At most one. */
  ghosts: PlateGhost[];
  /** The tier in three parts, each left to right; the centre is the storyteller's own line. */
  zones: Record<Zone, PlateItem[]>;
  /** The storyteller's own tier. */
  home: boolean;
};
/** A thread from one or two parents (node ids, or a ring's) down to a child (a node id, or a ring's). */
export type PlateLink = { key: string; from: string[]; to: string; dashed: boolean };
export type Plate = {
  teller: Person | null;
  tiers: PlateTier[];
  links: PlateLink[];
  unplaced: Person[];
  /** Tiers with at least one person in them: the generations the plate actually draws. */
  generations: number;
  placed: number;
  /** Nobody is placed but the storyteller. */
  lone: boolean;
};

const ZONES: Zone[] = ["left", "centre", "right"];
const childWord = (p: Person) => (p.sex === "F" ? "daughter" : p.sex === "M" ? "son" : "child");
const parentWord = (p: Person) => (p.sex === "F" ? "mother" : p.sex === "M" ? "father" : "parent");

/** Brothers and sisters either side of the storyteller: older on the left, younger on the right, then evened out. */
export function aroundTeller<T>(units: T[], born: (u: T) => number, tellerBorn: number): { left: T[]; right: T[] } {
  const sorted = units.slice().sort((a, b) => born(a) - born(b));
  const left = sorted.filter((u) => tellerBorn && born(u) && born(u) < tellerBorn);
  const right = sorted.filter((u) => !left.includes(u));
  while (right.length - left.length > 1) left.push(right.shift()!);
  while (left.length - right.length > 1) right.unshift(left.pop()!);
  return { left, right };
}

/** "Your parents", "Rose's grandchildren": the storyteller's own line at a level. */
function lineTitle(level: number, whose: string): string {
  if (level === 0) return `${whose} generation`;
  return rowTitle(level, [], [], whose);
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
  const main = (level: number, id: string) => id === teller.id || isMain(level, codeOf(index, id, teller.id));

  // "Nhi's" names a person by their first name, unless two people in the family share it ("Nhi" and "Nhi Tran"):
  // then the one meant is named in full, so a thread and its words never disagree.
  const shared = (first: string) => people.filter((q) => firstName(q) === first).length > 1;
  const possessive = (p: Person, row: AlbumRow | null): string => {
    const sub = row?.sub.get(p.id) || "";
    if (!/'s$/.test(sub)) return sub;
    const first = sub.slice(0, -2);
    if (!shared(first)) return sub;
    const near = [...parentsOf(p.id), ...childrenOf(p.id)].map((id) => byId.get(id)!).find((q) => firstName(q) === first);
    return near ? `${personName(near)}'s` : sub;
  };
  const node = (p: Person, row: AlbumRow | null): PlateNode => {
    if (p.id === teller.id) return { id: p.id, person: p, rel: "", teller: true };
    const sub = possessive(p, row);
    const level = row?.level ?? 0;
    // "Daniel's" means through Daniel: his son, or (above the storyteller) Nhi's father.
    const rel = /'s$/.test(sub) ? `${sub} ${level < 0 ? parentWord(p) : childWord(p)}` : relationTo(index, p.id, teller.id) || sub;
    return { id: p.id, person: p, rel, teller: false };
  };
  const unitOf = (ps: Person[], row: AlbumRow | null): PlateUnit => ({ key: ps.map((p) => p.id).join("+"), nodes: ps.map((p) => node(p, row)) });

  // The people of each generation, from the album's rows; the storyteller and their partners make one unit in tier 0.
  const rows = new Map(album.rows.map((r) => [r.level, r]));
  const levels = [...new Set([...rows.keys(), 0])].sort((a, b) => a - b);
  type Draft = { level: number; row: AlbumRow | null; units: PlateUnit[]; zone: Map<string, Zone>; order: Map<string, number> };
  const drafts: Draft[] = levels.map((level) => {
    const row = rows.get(level) || null;
    const units = row ? row.units.map((u) => unitOf(u.people, row)) : [];
    if (level === 0) units.unshift(unitOf([...album.spouses.slice(0, 1), teller, ...album.spouses.slice(1)], row));
    return { level, row, units, zone: new Map(), order: new Map() };
  });
  const draftAt = (level: number) => drafts.find((d) => d.level === level) || null;
  const unitHolding = (d: Draft | null, id: string) => d?.units.find((u) => u.nodes.some((n) => n.id === id)) || null;
  const born = (u: PlateUnit) => Math.min(...u.nodes.map((n) => n.person.birthYear || 9999));
  // The lighter side counts faces, not units: a couple weighs two.
  const lighter = (d: Draft): Zone => {
    let l = 0;
    let r = 0;
    for (const u of d.units) {
      const z = d.zone.get(u.key);
      if (z === "left") l += u.nodes.length;
      else if (z === "right") r += u.nodes.length;
    }
    return l <= r ? "left" : "right";
  };

  // Tier 0: the storyteller in the centre, brothers and sisters either side by age, everyone else on the lighter side.
  const home = draftAt(0)!;
  const tellerUnit = home.units[0];
  home.zone.set(tellerUnit.key, "centre");
  const others = home.units.slice(1);
  const sibling = (u: PlateUnit) => u.nodes.some((n) => parentsOf(n.id).some((pid) => tellerParents.includes(pid)));
  const { left, right } = aroundTeller(others.filter(sibling), born, teller.birthYear || 0);
  left.forEach((u, i) => (home.zone.set(u.key, "left"), home.order.set(u.key, i)));
  right.forEach((u, i) => (home.zone.set(u.key, "right"), home.order.set(u.key, i)));
  for (const u of others.filter((x) => !sibling(x))) {
    const z = lighter(home);
    home.zone.set(u.key, z);
    // the left side grows outwards to the left, the right side outwards to the right
    home.order.set(u.key, z === "left" ? -100 - home.order.size : 100 + home.order.size);
  }

  // Every other tier takes its sides from the tier next to it, nearer the storyteller: a unit sits on the side,
  // and in the order, of the people it is joined to. The storyteller's own line is the centre.
  const place = (d: Draft, near: Draft, joined: (u: PlateUnit) => string[]) => {
    for (const u of d.units) {
      if (u.nodes.some((n) => main(d.level, n.id))) {
        d.zone.set(u.key, "centre");
      }
      const linked = joined(u)
        .map((id) => unitHolding(near, id))
        .filter((x): x is PlateUnit => !!x);
      const first = linked[0];
      if (!d.zone.has(u.key)) d.zone.set(u.key, first ? near.zone.get(first.key) || "centre" : lighter(d));
      const z = d.zone.get(u.key)!;
      const nearOrder = (x: PlateUnit) => (near.order.get(x.key) ?? 0) * 100 + near.units.indexOf(x);
      const key = first ? Math.min(...linked.map(nearOrder)) : z === "left" ? -1e6 : 1e6;
      d.order.set(u.key, key + born(u) / 1e5);
    }
  };
  const zero = drafts.indexOf(home);
  for (let i = zero - 1; i >= 0; i--) place(drafts[i], drafts[i + 1], (u) => u.nodes.flatMap((n) => childrenOf(n.id)));
  for (let i = zero + 1; i < drafts.length; i++) place(drafts[i], drafts[i - 1], (u) => u.nodes.flatMap((n) => parentsOf(n.id)));

  // The tiers, each in its three parts, left to right.
  const tiers: PlateTier[] = drafts.map((d) => {
    const zones: Record<Zone, PlateItem[]> = { left: [], centre: [], right: [] };
    for (const z of ZONES) {
      zones[z] = d.units
        .filter((u) => d.zone.get(u.key) === z)
        .sort((a, b) => (d.order.get(a.key) ?? 0) - (d.order.get(b.key) ?? 0))
        .map((u) => ({ key: u.key, unit: u }));
    }
    const members = d.units.flatMap((u) => u.nodes.map((n) => n.person));
    const hasMain = members.some((p) => p.id !== teller.id && main(d.level, p.id));
    // whose the others are ("and Margaret's"), when they are not the storyteller's own
    const owners = d.row ? [...new Set(d.units.flatMap((u) => u.nodes.filter((n) => !main(d.level, n.id)).map((n) => possessive(n.person, d.row))).filter((s) => /'s$/.test(s)))] : [];
    let title = lineTitle(d.level, whose);
    if (d.level !== 0 && hasMain && d.row) title = d.row.title;
    if (d.level !== 0 && owners.length) title = `${title}, and ${owners.join(" and ")}`;
    return { key: `tier:${d.level}`, level: d.level, title, decade: decadeOf(members), units: ZONES.flatMap((z) => zones[z].map((x) => x.unit!)), ghosts: [], zones, home: d.level === 0 };
  });

  // The threads: every person to their parents in the tier straight above.
  const levelOf = new Map<string, number>();
  for (const t of tiers) for (const u of t.units) for (const n of u.nodes) levelOf.set(n.id, t.level);
  const links: PlateLink[] = [];
  for (const t of tiers) {
    const above = tiers.find((x) => x.level === t.level - 1);
    if (!above) continue;
    for (const u of t.units) {
      for (const n of u.nodes) {
        const ps = parentsOf(n.id).filter((pid) => levelOf.get(pid) === t.level - 1);
        if (!ps.length) continue;
        // Two parents drawn as one couple send one thread; parents drawn apart send one each.
        const together = above.units.find((x) => ps.every((pid) => x.nodes.some((m) => m.id === pid)));
        if (together || ps.length === 1) links.push({ key: `${ps.join("+")}>${n.id}`, from: ps, to: n.id, dashed: false });
        else for (const pid of ps) links.push({ key: `${pid}>${n.id}`, from: [pid], to: n.id, dashed: false });
      }
    }
  }

  // The rings that invite: at most one per tier, on the storyteller's line, where a relation is missing.
  const tierAt = (level: number) => {
    let t = tiers.find((x) => x.level === level);
    if (!t) {
      t = { key: `tier:${level}`, level, title: lineTitle(level, whose), decade: "", units: [], ghosts: [], zones: { left: [], centre: [], right: [] }, home: false };
      tiers.push(t);
      tiers.sort((a, b) => a.level - b.level);
    }
    return t;
  };
  const ring = (level: number, zone: Zone, at: "start" | "end", key: string, label: string, kind: AlbumKind, from: string[] | null, to: string[] | null) => {
    const t = tierAt(level);
    const g: PlateGhost = { key, node: `ghost:${key}`, label, anchorId: teller.id, kind };
    t.ghosts.push(g);
    const item = { key: g.node, ghost: g };
    if (at === "start") t.zones[zone].unshift(item);
    else t.zones[zone].push(item);
    if (from?.length) links.push({ key: `${from.join("+")}>${g.node}`, from, to: g.node, dashed: true });
    for (const id of to || []) links.push({ key: `${g.node}>${id}`, from: [g.node], to: id, dashed: true });
  };
  const tellerFirst = firstName(teller);
  const parentsPlaced = tellerParents.filter((pid) => levelOf.get(pid) === -1);
  if (parentsPlaced.length < 2) {
    ring(-1, "centre", "end", "parent", parentsPlaced.length ? "a parent" : o.own ? "a parent of yours" : `a parent of ${tellerFirst}`, "parent", null, [teller.id]);
  } else if (!levels.some((l) => l < -1)) {
    // Both parents are here and nobody above them yet: one quiet ring for the grandparents, threaded to each parent.
    ring(-2, "centre", "end", "grandparents", o.own ? "your grandparents" : `${tellerFirst}'s grandparents`, "parent", null, parentsPlaced);
  }
  const home0 = tiers.find((t) => t.home)!;
  const faces = (z: Zone) => home0.zones[z].reduce((n, i) => n + (i.unit ? i.unit.nodes.length : 1), 0);
  const sideFor: Zone = faces("left") <= faces("right") ? "left" : "right";
  ring(0, sideFor, sideFor === "left" ? "end" : "start", "sibling", "a sister or brother", "sibling", parentsPlaced.length ? parentsPlaced : null, null);
  ring(1, "centre", "end", "child", "a child", "child", [teller.id], null);
  const children = tiers.find((t) => t.level === 1)?.units.some((u) => u.nodes.some((n) => parentsOf(n.id).includes(teller.id)));
  if (children) ring(2, "centre", "end", "grandchild", "a grandchild", "grandchild", null, null);

  const generations = tiers.filter((t) => t.units.length).length;
  return { teller, tiers, links, unplaced: album.unplaced, generations, placed: album.placed, lone: album.lone };
}
