// The album groups a family into generations relative to the storyteller:
// rows in order, couples together, nieces marked as somebody else's, ghosts
// only where a relation is missing, the unplaced on the shelf.
import { describe, expect, it } from "vitest";
import { buildIndex } from "../../../app-core/lib/familyGraph.js";
import type { Index } from "../familyView";
import { realPeople } from "../familyView";
import { sampleFamily } from "../tree/sampleFamily";
import { buildAlbum, decadeOf, generationsLine, loneGhosts, peopleLine, rowTitle, spousesLabel } from "./albumModel";
import type { Person } from "../../../data/family";

const id = (k: string) => `sample-${k}`;

function sample() {
  const { family, story, meId } = sampleFamily();
  const index = buildIndex(family) as Index;
  const people = realPeople(family);
  const teller = people.find((p) => p.storyId === story.id)!;
  return { family, story, meId, index, people, teller };
}

describe("the sample family", () => {
  const { index, people, teller, meId } = sample();
  const album = buildAlbum({ people, index, tellerId: teller.id, meId });

  it("puts the storyteller's layer apart, with both husbands", () => {
    expect(album.teller?.id).toBe(id("rose"));
    expect(album.spouses.map((p) => p.id)).toEqual([id("frank"), id("tom")]);
    expect(album.lone).toBe(false);
  });

  it("draws one row per generation, oldest first", () => {
    expect(album.rows.map((r) => r.level)).toEqual([-1, 0, 1, 2]);
    expect(album.rows.map((r) => r.title)).toEqual(["Rose's parents", "Rose's sister and brother", "Rose's children", "Rose's grandchildren"]);
    expect(album.generations).toBe(4);
  });

  it("sits couples together under one caption", () => {
    const parents = album.rows[0];
    expect(parents.units).toHaveLength(1);
    expect(parents.units[0].people.map((p) => p.id)).toEqual([id("walter"), id("edith")]);
    expect(parents.units[0].caption).toBe("Walter & Edith");
    const children = album.rows[2];
    const anne = children.units.find((u) => u.people.some((p) => p.id === id("anne")))!;
    expect(anne.people.map((p) => p.id)).toEqual([id("anne"), id("mark")]);
    expect(anne.caption).toBe("Anne & Mark");
  });

  it("says whose a niece is instead of calling her a daughter", () => {
    const children = album.rows[2];
    expect(children.sub.get(id("claire"))).toBe("Margaret's");
    expect(children.sub.has(id("daniel"))).toBe(false);
    expect(children.sub.has(id("mark"))).toBe(false);
    expect(children.note).toBe("· and Margaret's");
    expect(album.rows[3].sub.get(id("maya"))).toBe("Daniel's");
    expect(album.rows[3].sub.get(id("sam"))).toBe("Anne's");
  });

  it("offers a ghost only where a relation is missing", () => {
    expect(album.rows[0].ghosts.map((g) => g.label)).toEqual(["Walter's parents", "Edith's parents"]);
    expect(album.rows[0].ghosts[0]).toMatchObject({ anchorId: id("walter"), kind: "parent" });
    expect(album.rows[1].ghosts.map((g) => g.label)).toEqual(["a sister or brother"]);
    expect(album.rows[2].ghosts.map((g) => g.label)).toEqual(["a child"]);
    expect(album.rows[3].ghosts.map((g) => g.label)).toEqual(["a grandchild"]);
  });

  it("reads the decade off each row", () => {
    expect(album.rows.map((r) => r.decade)).toEqual(["1910s", "1940s", "1960s", "2000s"]);
  });

  it("shelves the one nobody has placed", () => {
    expect(album.unplaced.map((p) => p.id)).toEqual([id("nora")]);
    expect(album.placed).toBe(15);
  });
});

describe("a storyteller alone", () => {
  it("is lone with three places that invite, and nothing on the shelf", () => {
    const { people, teller } = sample();
    const alone = [teller];
    const album = buildAlbum({ people: alone, index: buildIndex({ people: alone, edges: [] }) as Index, tellerId: teller.id });
    expect(album.lone).toBe(true);
    expect(album.rows).toEqual([]);
    expect(album.unplaced).toEqual([]);
    expect(loneGhosts(teller.id).map((g) => g.label)).toEqual(["a parent", "a sister or brother", "a child"]);
    expect(people.length).toBeGreaterThan(1);
  });

  it("keeps unplaced people on the shelf even when nobody is placed", () => {
    const { people, teller } = sample();
    const index = buildIndex({ people, edges: [] }) as Index;
    const album = buildAlbum({ people, index, tellerId: teller.id });
    expect(album.lone).toBe(true);
    expect(album.unplaced).toHaveLength(people.length - 1);
    expect(album.unplaced.some((p) => p.id === teller.id)).toBe(false);
  });

  it("has no storyteller row to anchor when the story has no person yet", () => {
    const { people } = sample();
    const album = buildAlbum({ people, index: buildIndex({ people, edges: [] }) as Index, tellerId: null });
    expect(album.teller).toBeNull();
    expect(album.unplaced).toHaveLength(people.length);
  });
});

describe("a friend's father (the founder's own shape)", () => {
  const mk = (id: string, givenName: string, extra: Partial<Person> = {}) => ({ id, givenName, familyName: "", sex: "", source: "manual", householdId: "h", ...extra }) as Person;
  const people = [mk("bao", "Bao", { storyId: "s1", userId: "me" }), mk("nhi", "Nhi"), mk("ty", "Ty"), mk("gbao", "GBao")];
  const edges = [
    { from: "nhi", to: "bao", kind: "other", label: "Friend" },
    { from: "gbao", to: "bao", kind: "other", label: "Friend" },
    { from: "ty", to: "nhi", kind: "parent", label: "" },
  ];
  const index = buildIndex({ people, edges }) as Index;
  const album = buildAlbum({ people, index, tellerId: "bao", meId: "me", own: true });

  it("never calls a friend's father the storyteller's parent", () => {
    expect(album.rows.map((r) => r.title)).toEqual(["Nhi's parent", "Your friends"]);
    expect(album.rows[0].sub.get("ty")).toBe("Nhi's");
    expect(album.rows[0].note).toBe("");
    expect(album.rows[0].ghosts.map((g) => g.label)).toEqual(["a parent of yours"]);
    expect(album.rows[1].sub.get("nhi")).toBe("friend");
    expect(album.rows[1].note).toBe("");
  });
});

describe("the words", () => {
  const f = (sex: "M" | "F" | "") => ({ id: sex || "x", givenName: "A", familyName: "", sex, source: "manual" }) as unknown as Person;
  it("says your when the viewer is the storyteller", () => {
    expect(rowTitle(-1, [f("F"), f("M")], [], "Your")).toBe("Your parents");
    expect(rowTitle(-1, [f("F")], [], "Rose's")).toBe("Rose's mother");
    expect(rowTitle(1, [f("M")], [], "Rose's")).toBe("Rose's son");
    expect(rowTitle(0, [f("F"), f("F")], [], "Rose's")).toBe("Rose's sisters");
    expect(rowTitle(0, [f("F"), f("M")], [], "Rose's")).toBe("Rose's sister and brother");
    expect(rowTitle(0, [f("")], [], "Rose's")).toBe("Rose's brothers and sisters");
    expect(rowTitle(-2, [], [], "Rose's")).toBe("Rose's grandparents");
    expect(rowTitle(-3, [], [], "Rose's")).toBe("Rose's great-grandparents");
    expect(rowTitle(3, [], [], "Rose's")).toBe("Rose's great-grandchildren");
    expect(rowTitle(0, [], [f("F"), f("M")], "Rose's", ["cousin-1-0", "cousin-1-0"])).toBe("Rose's cousins");
    expect(rowTitle(0, [], [f("F"), f("M")], "Your", ["stated:friend", "stated:friend"])).toBe("Your friends");
    expect(rowTitle(0, [], [f("F"), f("M")], "Your", ["stated:friend", "cousin-1-0"])).toBe("Your family and friends");
    expect(rowTitle(0, [], [], "Your")).toBe("Your generation");
  });
  it("counts generations and people", () => {
    expect(generationsLine(4)).toBe("Four generations, so far");
    expect(generationsLine(1)).toBe("One generation, so far");
    expect(peopleLine(16, 2)).toBe("16 people, 2 not placed yet");
    expect(peopleLine(7, 0)).toBe("7 people");
    expect(peopleLine(1, 0)).toBe("1 person");
  });
  it("reads a decade from the middle birth year", () => {
    expect(decadeOf([{ birthYear: 1941 }, { birthYear: 1944 }, { birthYear: 1966 }])).toBe("1940s");
    expect(decadeOf([{}, { birthYear: null }])).toBe("");
  });
  it("names the storyteller's spouses", () => {
    const { index, teller, people } = sample();
    const spouses = people.filter((p) => [id("frank"), id("tom")].includes(p.id));
    expect(spousesLabel(index, spouses, teller.id, "Rose's")).toBe("Rose's husbands");
    expect(spousesLabel(index, spouses.slice(0, 1), teller.id, "Your")).toBe("Your husband");
  });
});
