/**
 * Laying a family out as a drawing: generations as rows, couples side by
 * side, children hung from the couple's midpoint, the storyteller in the
 * middle. Pure: people and edges in, positions and connector paths out.
 *
 * How it is done, in five lines:
 *   1. Everyone reachable from the focus gets a generation (parents −1,
 *      children +1, spouses 0) and a depth (how many steps away).
 *   2. Each generation is grouped into units: a person with their spouse(s)
 *      beside them (a second marriage puts the person in the middle).
 *   3. Each child's unit hangs from the first parent unit that claims it
 *      (nearest the focus first), which makes a tree of units; the tree
 *      holding the focus is laid out top-down, every unit centred over the
 *      children it hangs.
 *   4. Units left over (a spouse's parents, their siblings) are laid out as
 *      their own small trees and slid in above the person they attach to,
 *      the nearest gap that fits, never overlapping.
 *   5. Connectors are hairline paths with rounded elbows: a double rule
 *      between spouses, a stem from the couple's midpoint (or a lone
 *      parent) to a bus above the children's row, and a drop to each child.
 *
 * Cycles, self-edges, edges to unknown people and a child who is also a
 * parent of their parent are all ignored rather than drawn; nothing here
 * throws on bad data. People with no path to the focus come back as
 * `unplaced`.
 */

export type LayoutPerson = { id: string; birthYear?: number | null; deathYear?: number | null; sex?: string };
export type LayoutEdge = { from: string; to: string; kind: string; label?: string };

export type LayoutOptions = {
  /** One person's box: the print on top, the name and years under it. */
  nodeW: number;
  nodeH: number;
  /** The print is a square this tall at the top of the box, centred. */
  printH: number;
  /** Between units on a row, and between rows. */
  gapX: number;
  gapY: number;
  /** Between two spouses, where the double rule sits. */
  coupleGap: number;
  margin: number;
  maxUp: number;
  maxDown: number;
};

export const DESKTOP: LayoutOptions = { nodeW: 136, nodeH: 196, printH: 112, gapX: 40, gapY: 72, coupleGap: 34, margin: 32, maxUp: 4, maxDown: 4 };
export const PHONE: LayoutOptions = { nodeW: 108, nodeH: 172, printH: 92, gapX: 24, gapY: 64, coupleGap: 26, margin: 24, maxUp: 4, maxDown: 4 };

export type TreeNode = { id: string; x: number; y: number; gen: number; depth: number; focus: boolean; unit: number };
export type ConnectorKind = "couple" | "child" | "second";
export type Connector = { key: string; kind: ConnectorKind; d: string; depth: number; length: number };
export type TreeRow = { gen: number; y: number; ids: string[] };
export type TreeLayout = {
  nodes: TreeNode[];
  connectors: Connector[];
  rows: TreeRow[];
  width: number;
  height: number;
  focusId: string | null;
  unplaced: string[];
  opts: LayoutOptions;
};

type Unit = {
  i: number;
  gen: number;
  members: string[];
  depth: number;
  /** Every child of any member in the next generation, with where they hang (member index, or x.5 for a couple's midpoint). */
  children: { id: string; hang: number }[];
  treeParent: Unit | null;
  kids: Unit[];
  x: number;
};

const r1 = (n: number) => Math.round(n * 10) / 10;

/** A path from (x1,y1) down to a bus at busY, across to x2, down to (x2,y2), with rounded elbows. */
export function elbowPath(x1: number, y1: number, x2: number, y2: number, busY: number, radius = 12): string {
  if (Math.abs(x2 - x1) < 0.5) return `M${r1(x1)} ${r1(y1)}V${r1(y2)}`;
  const dir = x2 > x1 ? 1 : -1;
  const r = Math.max(0, Math.min(radius, Math.abs(x2 - x1) / 2, busY - y1, y2 - busY));
  return [
    `M${r1(x1)} ${r1(y1)}`,
    `V${r1(busY - r)}`,
    `Q${r1(x1)} ${r1(busY)} ${r1(x1 + dir * r)} ${r1(busY)}`,
    `H${r1(x2 - dir * r)}`,
    `Q${r1(x2)} ${r1(busY)} ${r1(x2)} ${r1(busY + r)}`,
    `V${r1(y2)}`,
  ].join("");
}

export function layoutFamily(people: LayoutPerson[], edges: LayoutEdge[], focusId: string | null | undefined, options: Partial<LayoutOptions> = {}): TreeLayout {
  const o: LayoutOptions = { ...DESKTOP, ...options };
  const byId = new Map<string, LayoutPerson>();
  for (const p of people) if (p && p.id && !byId.has(p.id)) byId.set(p.id, p);

  const parentsOf = new Map<string, string[]>();
  const childrenOf = new Map<string, string[]>();
  const spousesOf = new Map<string, string[]>();
  const add = (m: Map<string, string[]>, k: string, v: string) => {
    const list = m.get(k) || [];
    if (!list.includes(v)) list.push(v);
    m.set(k, list);
  };
  for (const e of edges || []) {
    if (!e || !e.from || !e.to || e.from === e.to || !byId.has(e.from) || !byId.has(e.to)) continue;
    if (e.kind === "parent") {
      add(parentsOf, e.to, e.from);
      add(childrenOf, e.from, e.to);
    } else if (e.kind === "spouse") {
      add(spousesOf, e.from, e.to);
      add(spousesOf, e.to, e.from);
    }
  }

  const empty: TreeLayout = { nodes: [], connectors: [], rows: [], width: 0, height: 0, focusId: null, unplaced: [...byId.keys()], opts: o };
  const focus = focusId && byId.has(focusId) ? focusId : [...byId.keys()][0];
  if (!focus) return empty;

  /* 1. Generations and depth, breadth-first from the focus. */
  const gen = new Map<string, number>([[focus, 0]]);
  const depth = new Map<string, number>([[focus, 0]]);
  let frontier = [focus];
  for (let d = 1; frontier.length; d++) {
    const next: string[] = [];
    for (const id of frontier) {
      const g = gen.get(id)!;
      const step = (other: string, delta: number) => {
        if (gen.has(other)) return;
        const ng = g + delta;
        if (ng < -o.maxUp || ng > o.maxDown) return;
        gen.set(other, ng);
        depth.set(other, d);
        next.push(other);
      };
      for (const p of parentsOf.get(id) || []) step(p, -1);
      for (const c of childrenOf.get(id) || []) step(c, 1);
      for (const s of spousesOf.get(id) || []) step(s, 0);
    }
    frontier = next;
  }

  /* 2. Blood: the focus's ancestors, and everyone descended from one of them (or from the focus).
     Decides who sits on the left of a couple: the family's own side, with the in-law beside them. */
  const blood = new Set<string>([focus]);
  frontier = [focus];
  while (frontier.length) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const n of parentsOf.get(id) || []) {
        if (!gen.has(n) || blood.has(n)) continue;
        blood.add(n);
        next.push(n);
      }
    }
    frontier = next;
  }
  frontier = [...blood];
  while (frontier.length) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const n of childrenOf.get(id) || []) {
        if (!gen.has(n) || blood.has(n)) continue;
        blood.add(n);
        next.push(n);
      }
    }
    frontier = next;
  }

  const birth = (id: string) => byId.get(id)?.birthYear ?? 9999;
  const byDepth = (a: string, b: string) => depth.get(a)! - depth.get(b)! || birth(a) - birth(b) || a.localeCompare(b);
  const placedIds = [...gen.keys()].sort(byDepth);

  /* 3. Units: a person with their spouse(s) on the same row. */
  const units: Unit[] = [];
  const unitOf = new Map<string, Unit>();
  const leftFirst = (a: string, b: string): [string, string] => {
    if (blood.has(a) !== blood.has(b)) return blood.has(a) ? [a, b] : [b, a];
    const sa = byId.get(a)?.sex, sb = byId.get(b)?.sex;
    if (sa === "M" && sb !== "M") return [a, b];
    if (sb === "M" && sa !== "M") return [b, a];
    return birth(a) <= birth(b) ? [a, b] : [b, a];
  };
  for (const id of placedIds) {
    if (unitOf.has(id)) continue;
    const g = gen.get(id)!;
    const sps = (spousesOf.get(id) || []).filter((s) => gen.get(s) === g && !unitOf.has(s)).sort((a, b) => birth(a) - birth(b) || a.localeCompare(b));
    let members: string[];
    if (sps.length >= 2) members = [sps[0], id, sps[1]];
    else if (sps.length === 1) members = leftFirst(id, sps[0]);
    else members = [id];
    const u: Unit = { i: units.length, gen: g, members, depth: Math.min(...members.map((m) => depth.get(m)!)), children: [], treeParent: null, kids: [], x: 0 };
    units.push(u);
    for (const m of members) unitOf.set(m, u);
  }

  /* 4. Children hang from their parents' unit; the unit nearest the focus claims a child's unit for the tree. */
  const unitsByDepth = [...units].sort((a, b) => a.depth - b.depth || a.i - b.i);
  /** The parent unit a child's unit was hung from, through that child. */
  const claimedVia = new Map<string, Unit>();
  for (const u of unitsByDepth) {
    const kids = new Map<string, number[]>();
    u.members.forEach((m, mi) => {
      for (const c of childrenOf.get(m) || []) {
        if (gen.get(c) !== u.gen + 1) continue;
        kids.set(c, [...(kids.get(c) || []), mi]);
      }
    });
    u.children = [...kids]
      .map(([id, mis]) => {
        const sorted = [...mis].sort((a, b) => a - b);
        const adjacent = sorted.length >= 2 && sorted[1] - sorted[0] === 1;
        return { id, hang: adjacent ? (sorted[0] + sorted[1]) / 2 : sorted[0] };
      })
      .sort((a, b) => a.hang - b.hang || birth(a.id) - birth(b.id) || a.id.localeCompare(b.id));
    for (const c of u.children) {
      const cu = unitOf.get(c.id)!;
      if (cu === u || cu.treeParent) continue;
      cu.treeParent = u;
      claimedVia.set(c.id, u);
      u.kids.push(cu);
    }
  }

  /* 5. Blocks: each unit centred over the children it hangs. */
  const pitch = o.nodeW + o.coupleGap;
  const unitW = (u: Unit) => u.members.length * o.nodeW + (u.members.length - 1) * o.coupleGap;
  const hangOffset = (hang: number) => hang * pitch + o.nodeW / 2;
  const nodeX = new Map<string, number>();
  const blockW = new Map<Unit, number>();
  /** A unit's own x, and each kid block's left, relative to the block's left edge. */
  const relX = new Map<Unit, number>();
  const kidRel = new Map<Unit, number>();
  const measure = (u: Unit): number => {
    const uw = unitW(u);
    if (!u.kids.length) {
      relX.set(u, 0);
      blockW.set(u, uw);
      return uw;
    }
    const kidLeft = new Map<Unit, number>();
    let x = 0;
    for (const k of u.kids) {
      measure(k);
      kidLeft.set(k, x);
      x += blockW.get(k)! + o.gapX;
    }
    const kidsW = x - o.gapX;
    // Where the unit wants to be so its hang points sit over the children hung from them.
    const wants = u.children
      .filter((c) => unitOf.get(c.id)!.treeParent === u)
      .map((c) => {
        const ku = unitOf.get(c.id)!;
        const childCx = kidLeft.get(ku)! + relX.get(ku)! + ku.members.indexOf(c.id) * pitch + o.nodeW / 2;
        return childCx - hangOffset(c.hang);
      });
    const want = wants.length ? (Math.min(...wants) + Math.max(...wants)) / 2 : (kidsW - uw) / 2;
    const left = Math.min(0, want);
    const right = Math.max(kidsW, want + uw);
    relX.set(u, want - left);
    for (const k of u.kids) kidRel.set(k, kidLeft.get(k)! - left);
    blockW.set(u, right - left);
    return right - left;
  };
  const setUnitX = (u: Unit, x: number) => {
    u.x = x;
    u.members.forEach((m, mi) => nodeX.set(m, x + mi * pitch));
  };
  const place = (u: Unit, left: number) => {
    setUnitX(u, left + relX.get(u)!);
    for (const k of u.kids) place(k, left + kidRel.get(k)!);
  };

  const roots = units.filter((u) => !u.treeParent);
  let spine = unitOf.get(focus)!;
  while (spine.treeParent) spine = spine.treeParent;
  for (const r of roots) measure(r);
  place(spine, 0);

  /* Attached blocks slide in beside what is already there, nearest the person they hang. */
  const occupied = new Map<number, [number, number][]>();
  const occupy = (u: Unit) => {
    occupied.set(u.gen, [...(occupied.get(u.gen) || []), [u.x, u.x + unitW(u)]]);
    for (const k of u.kids) occupy(k);
  };
  const shift = (u: Unit, dx: number) => {
    setUnitX(u, u.x + dx);
    for (const k of u.kids) shift(k, dx);
  };
  const spans = (u: Unit, out: { gen: number; x0: number; x1: number }[] = []) => {
    out.push({ gen: u.gen, x0: u.x, x1: u.x + unitW(u) });
    for (const k of u.kids) spans(k, out);
    return out;
  };
  occupy(spine);
  const pending = roots.filter((r) => r !== spine).sort((a, b) => a.depth - b.depth || a.i - b.i);
  while (pending.length) {
    let at = pending.findIndex((r) => r.children.some((c) => unitOf.get(c.id)!.treeParent !== r && nodeX.has(c.id)));
    if (at < 0) at = 0;
    const r = pending.splice(at, 1)[0];
    place(r, 0);
    const attach = r.children.find((c) => unitOf.get(c.id)!.treeParent !== r && nodeX.has(c.id));
    let want: number;
    if (attach) want = nodeX.get(attach.id)! + o.nodeW / 2 - (r.x + hangOffset(attach.hang));
    else {
      const row = occupied.get(r.gen) || [];
      want = row.length ? Math.max(...row.map(([, b]) => b)) + o.gapX - r.x : 0;
    }
    const mine = spans(r);
    const fits = (dx: number) => mine.every((s) => (occupied.get(s.gen) || []).every(([a, b]) => s.x1 + dx + o.gapX <= a + 0.01 || s.x0 + dx >= b + o.gapX - 0.01));
    let best = want;
    if (!fits(want)) {
      const cands: number[] = [];
      for (const s of mine) for (const [a, b] of occupied.get(s.gen) || []) cands.push(b + o.gapX - s.x0, a - o.gapX - s.x1);
      cands.sort((p, q) => Math.abs(p - want) - Math.abs(q - want));
      best = cands.find(fits) ?? Math.max(...cands);
    }
    shift(r, best);
    occupy(r);
  }

  /* 6. Rows, then everything shifted into the margin. */
  const gens = [...new Set(units.map((u) => u.gen))].sort((a, b) => a - b);
  const rowY = new Map<number, number>();
  gens.forEach((g, i) => rowY.set(g, o.margin + i * (o.nodeH + o.gapY)));
  const minX = Math.min(...units.map((u) => u.x));
  const dx = o.margin - minX;
  for (const r of roots) shift(r, dx);

  const nodes: TreeNode[] = placedIds
    .map((id) => ({ id, x: r1(nodeX.get(id)!), y: rowY.get(gen.get(id)!)!, gen: gen.get(id)!, depth: depth.get(id)!, focus: id === focus, unit: unitOf.get(id)!.i }))
    .sort((a, b) => a.gen - b.gen || a.x - b.x);
  const node = new Map(nodes.map((n) => [n.id, n]));
  const rows: TreeRow[] = gens.map((g) => ({ gen: g, y: rowY.get(g)!, ids: nodes.filter((n) => n.gen === g).map((n) => n.id) }));
  const width = r1(Math.max(...nodes.map((n) => n.x + o.nodeW)) + o.margin);
  const height = r1(o.margin * 2 + gens.length * o.nodeH + (gens.length - 1) * o.gapY);

  /* 7. Connectors. */
  const connectors: Connector[] = [];
  const cx = (id: string) => node.get(id)!.x + o.nodeW / 2;
  // The one solid line into a child: from the unit that hung them, else the first unit that has them.
  const primaryOf = new Map<string, Unit>(claimedVia);
  for (const u of unitsByDepth) for (const c of u.children) if (!primaryOf.has(c.id)) primaryOf.set(c.id, u);
  for (const u of units) {
    const y = rowY.get(u.gen)!;
    for (let mi = 0; mi < u.members.length - 1; mi++) {
      const a = u.members[mi], b = u.members[mi + 1];
      if (!(spousesOf.get(a) || []).includes(b)) continue;
      const x1 = r1(node.get(a)!.x + (o.nodeW + o.printH) / 2 + 6);
      const x2 = r1(node.get(b)!.x + (o.nodeW - o.printH) / 2 - 6);
      const ry = r1(y + o.printH / 2);
      connectors.push({ key: `couple:${a}:${b}`, kind: "couple", d: `M${x1} ${ry - 3}H${x2}M${x1} ${ry + 3}H${x2}`, depth: Math.min(depth.get(a)!, depth.get(b)!), length: 2 * (x2 - x1) });
    }
    for (const c of u.children) {
      const couple = c.hang % 1 !== 0;
      const hx = u.x + hangOffset(c.hang);
      const hy = couple ? y + o.printH / 2 + 3 : y + o.nodeH;
      const childTop = rowY.get(u.gen + 1)!;
      const busY = childTop - o.gapY / 2;
      const tx = cx(c.id);
      const d = elbowPath(hx, hy, tx, childTop, busY);
      const kind: ConnectorKind = primaryOf.get(c.id) === u ? "child" : "second";
      const dep = Math.min(depth.get(c.id)!, ...u.members.map((m) => depth.get(m)!));
      connectors.push({ key: `${kind}:${u.i}:${c.id}`, kind, d, depth: dep, length: r1(busY - hy + Math.abs(tx - hx) + (childTop - busY)) });
    }
  }

  const unplaced = [...byId.keys()].filter((id) => !gen.has(id));
  return { nodes, connectors, rows, width, height, focusId: focus, unplaced, opts: o };
}

/** The neighbour to move to with an arrow key: along the row, or the nearest by x in the row above or below. */
export function neighbourOf(layout: TreeLayout, id: string, dir: "left" | "right" | "up" | "down"): string | null {
  const node = layout.nodes.find((n) => n.id === id);
  if (!node) return null;
  const ri = layout.rows.findIndex((r) => r.gen === node.gen);
  const row = layout.rows[ri];
  if (dir === "left" || dir === "right") {
    const at = row.ids.indexOf(id);
    return row.ids[at + (dir === "left" ? -1 : 1)] || null;
  }
  const other = layout.rows[ri + (dir === "up" ? -1 : 1)];
  if (!other) return null;
  const x = node.x;
  let best: string | null = null;
  let bestD = Infinity;
  for (const oid of other.ids) {
    const d = Math.abs(layout.nodes.find((n) => n.id === oid)!.x - x);
    if (d < bestD) {
      bestD = d;
      best = oid;
    }
  }
  return best;
}
