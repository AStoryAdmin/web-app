// The plate puts the storyteller's own line down the middle of every tier,
// everyone else on the side of whoever they are joined to (so threads never
// cross), at most one ring per tier, and what each person is to the
// storyteller in words.
import { describe, expect, it } from "vitest";
import { buildIndex } from "../../../app-core/lib/familyGraph.js";
import type { Person } from "../../../data/family";
import { realPeople, type Index } from "../familyView";
import { sampleFamily } from "./sampleFamily";
import { aroundTeller, buildPlate, type Plate } from "./plateModel";

const id = (k: string) => `sample-${k}`;
const short = (s: string) => s.replace("sample-", "").replace("ghost:", "+");

function sample() {
  const { family, story, meId } = sampleFamily();
  const index = buildIndex(family) as Index;
  const people = realPeople(family);
  const teller = people.find((p) => p.storyId === story.id)!;
  return buildPlate({ people, index, tellerId: teller.id, meId });
}
/** A tier as "left | centre | right", each item its people joined by & (rings as +key). */
const draw = (plate: Plate, level: number) => {
  const t = plate.tiers.find((x) => x.level === level)!;
  return (["left", "centre", "right"] as const).map((z) => t.zones[z].map((i) => (i.unit ? i.unit.nodes.map((n) => short(n.id)).join("&") : short(i.key))).join(" ")).join(" | ");
};

describe("the sample family on the plate", () => {
  const plate = sample();

  it("draws four generations of people, oldest first, under the storyteller's words for them", () => {
    expect(plate.tiers.map((t) => t.level)).toEqual([-2, -1, 0, 1, 2]);
    expect(plate.generations).toBe(4);
    expect(plate.tiers.map((t) => t.title)).toEqual(["Rose's grandparents", "Rose's parents", "Rose's generation", "Rose's children, and Margaret's", "Rose's grandchildren"]);
    expect(plate.tiers.map((t) => t.decade)).toEqual(["", "1910s", "1940s", "1960s", "2000s"]);
  });

  it("keeps Rose's own line on the axis, everyone else on the side they belong to", () => {
    expect(draw(plate, -2)).toBe(" | +grandparents | ");
    expect(draw(plate, -1)).toBe(" | walter&edith | ");
    expect(draw(plate, 0)).toBe("peggy&jim | frank&rose&tom | +sibling arthur");
    expect(draw(plate, 1)).toBe("claire | daniel anne&mark +child | ");
    expect(draw(plate, 2)).toBe(" | maya leo sam +grandchild | ");
  });

  it("threads every child to the couple above, and the rings with dashes", () => {
    const to = (k: string) => plate.links.filter((l) => l.to === id(k) && !l.dashed).map((l) => l.from.map(short).join("+"));
    expect(to("rose")).toEqual(["walter+edith"]);
    expect(to("daniel")).toEqual(["rose+frank"]);
    expect(to("claire")).toEqual(["peggy+jim"]);
    expect(to("sam")).toEqual(["anne+mark"]);
    expect(to("mark")).toEqual([]);
    expect(plate.links.filter((l) => l.dashed).map((l) => `${l.from.map(short).join("+")}>${short(l.to)}`)).toEqual(["+grandparents>walter", "+grandparents>edith", "walter+edith>+sibling", "rose>+child"]);
  });

  it("says what each person is to Rose", () => {
    const rel = (k: string) => plate.tiers.flatMap((t) => t.units.flatMap((u) => u.nodes)).find((n) => n.id === id(k))!.rel;
    expect(rel("walter")).toBe("father");
    expect(rel("claire")).toBe("Margaret's daughter");
    expect(rel("maya")).toBe("Daniel's daughter");
    expect(rel("rose")).toBe("");
  });

  it("offers at most one ring a tier", () => {
    expect(plate.tiers.every((t) => t.ghosts.length <= 1)).toBe(true);
    expect(plate.unplaced.map((p) => p.id)).toEqual([id("nora")]);
  });
});

describe("a friend's father (the founder's own shape)", () => {
  const mk = (pid: string, givenName: string, extra: Partial<Person> = {}) => ({ id: pid, givenName, familyName: "", sex: "", source: "manual", householdId: "h", ...extra }) as Person;
  const people = [mk("bao", "Bao", { storyId: "s1", userId: "me" }), mk("gbao", "GBao"), mk("nhi", "Nhi"), mk("nhit", "Nhi", { familyName: "Tran" }), mk("ty", "Ty")];
  const edges = [
    { from: "gbao", to: "bao", kind: "other", label: "Friend" },
    { from: "nhi", to: "bao", kind: "other", label: "Friend" },
    { from: "nhit", to: "bao", kind: "other", label: "Friend" },
    { from: "ty", to: "nhit", kind: "parent", label: "" },
  ];
  const plate = buildPlate({ people, index: buildIndex({ people, edges }) as Index, tellerId: "bao", meId: "me", own: true });

  it("keeps the storyteller on the axis and the friends either side", () => {
    expect(draw(plate, 0).split(" | ")[1]).toBe("bao");
    const [l, , r] = draw(plate, 0).split(" | ");
    expect(Math.abs(l.split(" ").filter(Boolean).length - r.split(" ").filter(Boolean).length)).toBeLessThanOrEqual(1);
  });

  it("puts a friend's father above the friend, apart from the storyteller's own parent ring", () => {
    const [l0, , r0] = draw(plate, 0).split(" | ");
    const [l1, c1, r1] = draw(plate, -1).split(" | ");
    expect(c1).toBe("+parent");
    expect(l0.includes("nhit") ? l1 : r1).toBe("ty");
    expect(r0.includes("nhit") ? l1 : r1).toBe("");
    expect(plate.tiers[0].title).toBe("Your parents, and Nhi Tran's");
    expect(plate.tiers[0].units[0].nodes[0].rel).toBe("Nhi Tran's parent");
  });

  it("counts the generations that hold people", () => {
    expect(plate.generations).toBe(2);
    expect(plate.tiers.map((t) => t.level)).toEqual([-1, 0, 1]);
  });
});

describe("a storyteller alone", () => {
  it("is drawn on the axis with three rings around them", () => {
    const bao = { id: "bao", givenName: "Bao", familyName: "", sex: "", source: "manual", storyId: "s1" } as Person;
    const plate = buildPlate({ people: [bao], index: buildIndex({ people: [bao], edges: [] }) as Index, tellerId: "bao", own: true });
    expect(plate.lone).toBe(true);
    expect(plate.tiers.map((t) => [t.title, t.ghosts.map((g) => g.label)])).toEqual([
      ["Your parents", ["a parent of yours"]],
      ["Your generation", ["a sister or brother"]],
      ["Your children", ["a child"]],
    ]);
    expect(plate.generations).toBe(1);
  });
});

describe("brothers and sisters", () => {
  it("sit either side by age, evened out", () => {
    expect(aroundTeller([1944, 1947, 1950], (y) => y, 1941)).toEqual({ left: [1944], right: [1947, 1950] });
    expect(aroundTeller([1930, 1935], (y) => y, 1941)).toEqual({ left: [1930], right: [1935] });
  });
});
