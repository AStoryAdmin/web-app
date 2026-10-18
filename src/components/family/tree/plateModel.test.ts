// The plate orders a family into generations around the storyteller and
// works out the threads: children under their parents, the storyteller in
// the middle of their own tier, what each person is to them in words.
import { describe, expect, it } from "vitest";
import { buildIndex } from "../../../app-core/lib/familyGraph.js";
import type { Person } from "../../../data/family";
import { realPeople, type Index } from "../familyView";
import { sampleFamily } from "./sampleFamily";
import { aroundTeller, buildPlate, generationTitle } from "./plateModel";

const id = (k: string) => `sample-${k}`;

function sample() {
  const { family, story, meId } = sampleFamily();
  const index = buildIndex(family) as Index;
  const people = realPeople(family);
  const teller = people.find((p) => p.storyId === story.id)!;
  return buildPlate({ people, index, tellerId: teller.id, meId });
}

describe("the sample family on the plate", () => {
  const plate = sample();
  const tier = (level: number) => plate.tiers.find((t) => t.level === level)!;
  const ids = (level: number) => tier(level).units.map((u) => u.nodes.map((n) => n.id.replace("sample-", "")).join("&"));

  it("draws four generations, oldest first, and names them", () => {
    expect(plate.tiers.map((t) => t.level)).toEqual([-1, 0, 1, 2]);
    expect(plate.tiers.map((t) => t.title)).toEqual(["Rose's parents", "Rose's generation", "Children's generation", "Rose's grandchildren"]);
    expect(plate.tiers.map((t) => t.decade)).toEqual(["1910s", "1940s", "1960s", "2000s"]);
  });

  it("puts Rose between her husbands, her sister and brother either side", () => {
    expect(ids(0)).toEqual(["peggy&jim", "frank&rose&tom", "arthur"]);
    expect(tier(0).home).toBe(true);
    expect(tier(0).units[1].nodes[1].teller).toBe(true);
  });

  it("hangs children under their parents", () => {
    expect(ids(1)).toEqual(["claire", "daniel", "anne&mark"]);
    expect(ids(2)).toEqual(["maya", "leo", "sam"]);
  });

  it("threads every child to the couple above", () => {
    const to = (k: string) => plate.links.filter((l) => l.to === id(k) && !l.dashed).map((l) => l.from.map((f) => f.replace("sample-", "")).join("+"));
    expect(to("rose")).toEqual(["walter+edith"]);
    expect(to("daniel")).toEqual(["rose+frank"]);
    expect(to("claire")).toEqual(["peggy+jim"]);
    expect(to("sam")).toEqual(["anne+mark"]);
    expect(to("mark")).toEqual([]);
  });

  it("says what each person is to Rose", () => {
    const rel = (k: string) => plate.tiers.flatMap((t) => t.units.flatMap((u) => u.nodes)).find((n) => n.id === id(k))!.rel;
    expect(rel("walter")).toBe("father");
    expect(rel("claire")).toBe("Margaret's daughter");
    expect(rel("maya")).toBe("Daniel's daughter");
    expect(rel("rose")).toBe("");
  });

  it("offers rings only where a relation is missing", () => {
    expect(plate.tiers.map((t) => t.ghosts.map((g) => g.label))).toEqual([["Walter's parents", "Edith's parents"], ["a sister or brother"], ["a child"], ["a grandchild"]]);
    expect(plate.links.filter((l) => l.dashed).map((l) => l.to)).toEqual(["ghost:sibling", "ghost:child"]);
    expect(plate.unplaced.map((p) => p.id)).toEqual([id("nora")]);
  });
});

describe("a friend's father (the founder's own shape)", () => {
  const mk = (pid: string, givenName: string, extra: Partial<Person> = {}) => ({ id: pid, givenName, familyName: "", sex: "", source: "manual", householdId: "h", ...extra }) as Person;
  const people = [mk("bao", "Bao", { storyId: "s1", userId: "me" }), mk("nhi", "Nhi"), mk("ty", "Ty"), mk("gbao", "GBao")];
  const edges = [
    { from: "nhi", to: "bao", kind: "other", label: "Friend" },
    { from: "gbao", to: "bao", kind: "other", label: "Friend" },
    { from: "ty", to: "nhi", kind: "parent", label: "" },
  ];
  const plate = buildPlate({ people, index: buildIndex({ people, edges }) as Index, tellerId: "bao", meId: "me", own: true });

  it("never calls a friend's father the storyteller's parent", () => {
    expect(plate.tiers.map((t) => t.title)).toEqual(["Parents' generation", "Your generation", "Your children"]);
    const ty = plate.tiers[0].units[0].nodes[0];
    expect(ty.rel).toBe("Nhi's parent");
    expect(plate.links.find((l) => l.to === "nhi")?.from).toEqual(["ty"]);
  });

  it("keeps a ring for a parent and threads it to the storyteller", () => {
    expect(plate.tiers[0].ghosts.map((g) => g.label)).toEqual(["a parent of yours"]);
    expect(plate.links.some((l) => l.from[0] === "ghost:parent" && l.to === "bao" && l.dashed)).toBe(true);
    expect(plate.tiers[1].units[0].nodes[0].teller).toBe(true);
  });

  it("counts only the storyteller's own generations", () => {
    expect(plate.generations).toBe(1);
  });
});

describe("a storyteller alone", () => {
  it("is drawn with the three rings around them", () => {
    const bao = { id: "bao", givenName: "Bao", familyName: "", sex: "", source: "manual", storyId: "s1" } as Person;
    const plate = buildPlate({ people: [bao], index: buildIndex({ people: [bao], edges: [] }) as Index, tellerId: "bao", own: true });
    expect(plate.lone).toBe(true);
    expect(plate.tiers.map((t) => [t.title, t.ghosts.map((g) => g.label)])).toEqual([
      ["Your parents", ["a parent of yours"]],
      ["Your generation", ["a sister or brother"]],
      ["Your children", ["a child"]],
    ]);
  });
});

describe("the words", () => {
  it("names a generation that holds more than one line", () => {
    expect(generationTitle(-1, "Your")).toBe("Parents' generation");
    expect(generationTitle(-3, "Rose's")).toBe("Great-grandparents' generation");
    expect(generationTitle(2, "Rose's")).toBe("Grandchildren's generation");
    expect(generationTitle(0, "Rose's")).toBe("Rose's generation");
  });
  it("seats brothers and sisters either side, evened out", () => {
    const r = aroundTeller([1944, 1947, 1950], (y) => y, 1941);
    expect(r).toEqual({ left: [1944], right: [1947, 1950] });
    expect(aroundTeller([1930, 1935], (y) => y, 1941)).toEqual({ left: [1930], right: [1935] });
  });
});
