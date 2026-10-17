// The family as a drawing: rows by generation, couples beside each other,
// children under the couple's midpoint, nothing overlapping, nothing thrown.
import { describe, expect, it } from "vitest";
import { DESKTOP, elbowPath, layoutFamily, neighbourOf, type LayoutEdge, type LayoutPerson, type TreeLayout } from "./familyLayout";

const p = (id: string, birthYear?: number, sex?: string): LayoutPerson => ({ id, birthYear, sex });
const parent = (from: string, to: string): LayoutEdge => ({ from, to, kind: "parent" });
const spouse = (a: string, b: string): LayoutEdge => ({ from: a, to: b, kind: "spouse" });

const node = (l: TreeLayout, id: string) => l.nodes.find((n) => n.id === id)!;
const cx = (l: TreeLayout, id: string) => node(l, id).x + l.opts.nodeW / 2;

/** No two people on one row overlap, and every row is ordered by x. */
function expectTidy(l: TreeLayout) {
  for (const row of l.rows) {
    const xs = row.ids.map((id) => node(l, id).x);
    for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(l.opts.nodeW + l.opts.coupleGap - 0.01);
  }
  for (const n of l.nodes) {
    expect(n.x).toBeGreaterThanOrEqual(l.opts.margin - 0.01);
    expect(n.x + l.opts.nodeW).toBeLessThanOrEqual(l.width - l.opts.margin + 0.01);
  }
  expect(new Set(l.nodes.map((n) => n.id)).size).toBe(l.nodes.length);
}

describe("one person, two people", () => {
  it("draws nobody from nothing", () => {
    const l = layoutFamily([], [], null);
    expect(l.nodes).toHaveLength(0);
    expect(l.focusId).toBeNull();
  });
  it("puts a lone storyteller in the margin with no lines", () => {
    const l = layoutFamily([p("rose")], [], "rose");
    expect(l.nodes).toHaveLength(1);
    expect(node(l, "rose").focus).toBe(true);
    expect(l.connectors).toHaveLength(0);
    expect(l.unplaced).toEqual([]);
    expect(l.width).toBe(DESKTOP.nodeW + DESKTOP.margin * 2);
  });
  it("draws a couple side by side with a double rule, the storyteller on the left", () => {
    const l = layoutFamily([p("frank", 1938, "M"), p("rose", 1941, "F")], [spouse("rose", "frank")], "rose");
    expect(l.rows).toHaveLength(1);
    expect(node(l, "rose").x).toBeLessThan(node(l, "frank").x);
    expect(node(l, "frank").x - node(l, "rose").x).toBe(DESKTOP.nodeW + DESKTOP.coupleGap);
    expect(l.connectors.map((c) => c.kind)).toEqual(["couple"]);
    expect(l.connectors[0].d.split("M")).toHaveLength(3);
  });
  it("keeps someone with no edges off the drawing", () => {
    const l = layoutFamily([p("rose"), p("nora")], [], "rose");
    expect(l.nodes.map((n) => n.id)).toEqual(["rose"]);
    expect(l.unplaced).toEqual(["nora"]);
  });
});

describe("parents and children", () => {
  it("hangs two children from the midpoint of their parents, the couple centred over them", () => {
    const l = layoutFamily([p("rose", 1941, "F"), p("frank", 1938, "M"), p("dan", 1966), p("anne", 1969)], [spouse("rose", "frank"), parent("rose", "dan"), parent("frank", "dan"), parent("rose", "anne"), parent("frank", "anne")], "rose");
    expectTidy(l);
    expect(l.rows.map((r) => r.gen)).toEqual([0, 1]);
    expect(l.rows[1].ids).toEqual(["dan", "anne"]);
    const mid = (cx(l, "rose") + cx(l, "frank")) / 2;
    const kids = (cx(l, "dan") + cx(l, "anne")) / 2;
    expect(Math.abs(mid - kids)).toBeLessThan(0.6);
    const drops = l.connectors.filter((c) => c.kind === "child");
    expect(drops).toHaveLength(2);
    // Both stems start at the couple's midpoint, just under the double rule.
    for (const c of drops) expect(c.d.startsWith(`M${Math.round(mid * 10) / 10} `)).toBe(true);
  });
  it("hangs a child with one parent from that parent alone, from the bottom of their box", () => {
    const l = layoutFamily([p("rose"), p("tom", 1944, "M"), p("kid")], [spouse("rose", "tom"), parent("rose", "kid")], "rose");
    expectTidy(l);
    const drop = l.connectors.find((c) => c.kind === "child")!;
    const y = node(l, "rose").y + DESKTOP.nodeH;
    expect(drop.d.startsWith(`M${cx(l, "rose")} ${y}`)).toBe(true);
    expect(Math.abs(cx(l, "rose") - cx(l, "kid"))).toBeLessThan(0.6);
  });
  it("puts parents above and grandparents above them, both sides, without overlap", () => {
    const people = [p("rose", 1941, "F"), p("walt", 1912, "M"), p("edie", 1915, "F"), p("wf", 1880, "M"), p("wm", 1884, "F"), p("ef", 1888, "M"), p("em", 1890, "F"), p("peg", 1944, "F")];
    const edges = [
      spouse("walt", "edie"), parent("walt", "rose"), parent("edie", "rose"), parent("walt", "peg"), parent("edie", "peg"),
      spouse("wf", "wm"), parent("wf", "walt"), parent("wm", "walt"),
      spouse("ef", "em"), parent("ef", "edie"), parent("em", "edie"),
    ];
    const l = layoutFamily(people, edges, "rose");
    expectTidy(l);
    expect(l.rows.map((r) => r.gen)).toEqual([-2, -1, 0]);
    expect(node(l, "walt").x).toBeLessThan(node(l, "edie").x);
    // Walter's parents sit left of Edith's parents, as their children do.
    expect(node(l, "wm").x).toBeLessThan(node(l, "ef").x);
    expect(l.unplaced).toEqual([]);
    // One solid line per child from the couple they came from: Rose, Peggy, Walter, Edith.
    expect(l.connectors.filter((c) => c.kind === "child")).toHaveLength(4);
    expect(l.connectors.filter((c) => c.kind === "second")).toHaveLength(0);
  });
});

describe("second marriages and odd data", () => {
  it("puts a person with two spouses in the middle, each child under the right pair", () => {
    const people = [p("rose", 1941, "F"), p("frank", 1938, "M"), p("tom", 1944, "M"), p("dan", 1966), p("liv", 1980)];
    const edges = [spouse("rose", "frank"), spouse("rose", "tom"), parent("rose", "dan"), parent("frank", "dan"), parent("rose", "liv"), parent("tom", "liv")];
    const l = layoutFamily(people, edges, "rose");
    expectTidy(l);
    expect(l.rows[0].ids).toEqual(["frank", "rose", "tom"]);
    expect(l.connectors.filter((c) => c.kind === "couple")).toHaveLength(2);
    // Two hang points a node's pitch apart, two children a node and a gap apart: the compromise is split evenly.
    const slack = (DESKTOP.gapX - DESKTOP.coupleGap) / 2 + 0.1;
    expect(Math.abs((cx(l, "frank") + cx(l, "rose")) / 2 - cx(l, "dan"))).toBeLessThan(slack);
    expect(Math.abs((cx(l, "rose") + cx(l, "tom")) / 2 - cx(l, "liv"))).toBeLessThan(slack);
  });
  it("draws the other parent's line dashed when the parents are not together", () => {
    const people = [p("rose", 1941, "F"), p("frank", 1938, "M"), p("jill", 1950, "F"), p("dan", 1966)];
    const edges = [spouse("frank", "jill"), parent("rose", "dan"), parent("frank", "dan")];
    const l = layoutFamily(people, edges, "rose");
    expectTidy(l);
    expect(l.connectors.filter((c) => c.kind === "child")).toHaveLength(1);
    expect(l.connectors.filter((c) => c.kind === "second")).toHaveLength(1);
  });
  it("hangs a spouse's parents above the spouse, beside the storyteller's own parents", () => {
    const people = [p("rose", 1941, "F"), p("frank", 1938, "M"), p("walt", 1912, "M"), p("edie", 1915, "F"), p("ff", 1910, "M"), p("fm", 1912, "F")];
    const edges = [spouse("rose", "frank"), spouse("walt", "edie"), parent("walt", "rose"), parent("edie", "rose"), spouse("ff", "fm"), parent("ff", "frank"), parent("fm", "frank")];
    const l = layoutFamily(people, edges, "rose");
    expectTidy(l);
    expect(l.rows[0].ids).toEqual(["walt", "edie", "ff", "fm"]);
    const inlaw = l.connectors.find((c) => c.kind === "child" && c.key.endsWith(":frank"))!;
    expect(inlaw).toBeTruthy();
    expect(inlaw.d.endsWith(`V${node(l, "frank").y}`)).toBe(true);
  });
  it("survives a cycle, a self-edge and an edge to nobody", () => {
    const people = [p("a"), p("b"), p("c")];
    const edges = [parent("a", "b"), parent("b", "a"), spouse("a", "a"), parent("c", "zz"), parent("b", "c")];
    const l = layoutFamily(people, edges, "a");
    expectTidy(l);
    expect(l.nodes.map((n) => n.id).sort()).toEqual(["a", "b", "c"]);
    // The first path wins: b is reached as a's parent, so a's claim to be b's parent is dropped.
    expect(node(l, "b").gen).toBe(-1);
    expect(node(l, "c").gen).toBe(0);
    expect(l.connectors.filter((c) => c.kind === "child")).toHaveLength(2);
    expect(l.connectors.filter((c) => c.kind === "second")).toHaveLength(0);
  });
  it("falls back to the first person when the focus is unknown, and stays within the generation limits", () => {
    const people = [p("a"), p("b"), p("c"), p("d"), p("e"), p("f"), p("g")];
    const edges = [parent("b", "a"), parent("c", "b"), parent("d", "c"), parent("e", "d"), parent("f", "e"), parent("g", "f")];
    const l = layoutFamily(people, edges, "nobody", { maxUp: 2 });
    expect(l.focusId).toBe("a");
    expect(l.rows.map((r) => r.gen)).toEqual([-2, -1, 0]);
    expect(l.unplaced.sort()).toEqual(["d", "e", "f", "g"]);
  });
});

describe("the drawing's geometry", () => {
  it("rounds every elbow and goes straight when the two ends line up", () => {
    expect(elbowPath(10, 0, 10, 100, 50)).toBe("M10 0V100");
    const d = elbowPath(10, 0, 110, 100, 50, 12);
    expect(d).toContain("Q10 50 22 50");
    expect(d).toContain("H98");
    expect(d.endsWith("V100")).toBe(true);
  });
  it("rows sit one generation apart and the height covers them", () => {
    const l = layoutFamily([p("a"), p("b"), p("c")], [parent("a", "b"), parent("b", "c")], "b");
    expect(l.rows.map((r) => r.y)).toEqual([DESKTOP.margin, DESKTOP.margin + DESKTOP.nodeH + DESKTOP.gapY, DESKTOP.margin + 2 * (DESKTOP.nodeH + DESKTOP.gapY)]);
    expect(l.height).toBe(DESKTOP.margin * 2 + 3 * DESKTOP.nodeH + 2 * DESKTOP.gapY);
    expect(l.nodes.map((n) => n.depth)).toEqual([1, 0, 1]);
  });
  it("moves between people with the arrows", () => {
    const l = layoutFamily([p("rose"), p("frank"), p("dan"), p("anne")], [spouse("rose", "frank"), parent("rose", "dan"), parent("frank", "dan"), parent("rose", "anne"), parent("frank", "anne")], "rose");
    expect(neighbourOf(l, "rose", "right")).toBe("frank");
    expect(neighbourOf(l, "rose", "left")).toBeNull();
    // Without years, children sort by name: Anne left, Dan right.
    expect(neighbourOf(l, "rose", "down")).toBe("anne");
    expect(neighbourOf(l, "dan", "up")).toBe("frank");
    expect(neighbourOf(l, "anne", "down")).toBeNull();
  });
});
