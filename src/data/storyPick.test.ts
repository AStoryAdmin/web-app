// Starting a story from the family tree: who a typed name matches, and what choosing each one does.
import { describe, expect, it } from "vitest";
import type { Family, Person } from "./family";
import { myUnboundPlace, relationFromTree, storyFieldsFrom, storyPicks } from "./storyPick";

const person = (p: Partial<Person> & { id: string; givenName: string }): Person => ({ familyName: "", source: "manual", ...p }) as Person;

const me = person({ id: "me", givenName: "Bao", familyName: "Vo", userId: "u-me" });
const rose = person({ id: "rose", givenName: "Rose", familyName: "Vo", birthYear: 1945, sex: "F" });
const rosa = person({ id: "rosa", givenName: "Rosa", familyName: "Le", storyId: "s-rosa" });
const ron = person({ id: "ron", givenName: "Ron", familyName: "Vo", userId: "u-ron" });
const ross = person({ id: "ross", givenName: "Ross", storyId: "s-ross" });
const box = person({ id: "box", givenName: "Ro", source: "placeholder" });
const people = [me, rose, rosa, ron, ross, box];

describe("storyPicks", () => {
  it("waits for two letters", () => {
    expect(storyPicks({ people, meId: "u-me", myStoryIds: [], typed: "R" })).toEqual([]);
  });

  it("offers a start, an open and a join, the ones a story is for first, never yourself or a placeholder", () => {
    const picks = storyPicks({ people, meId: "u-me", myStoryIds: ["s-ross"], typed: " ro" });
    expect(picks.map((p) => [p.person.id, p.kind])).toEqual([
      ["rose", "start"],
      ["ross", "open"],
      ["rosa", "join"],
      ["ron", "join"],
    ]);
  });

  it("matches the full name and ignores accents and case", () => {
    const zoe = person({ id: "z", givenName: "Zoë", familyName: "Tran" });
    expect(storyPicks({ people: [zoe], meId: null, myStoryIds: [], typed: "zoe t" }).map((p) => p.person.id)).toEqual(["z"]);
    expect(storyPicks({ people: [zoe], meId: null, myStoryIds: [], typed: "zoe x" })).toEqual([]);
  });
});

describe("myUnboundPlace", () => {
  it("is your place with no story yet", () => {
    expect(myUnboundPlace(people, "u-me")?.id).toBe("me");
    expect(myUnboundPlace([{ ...me, storyId: "s" }], "u-me")).toBeNull();
    expect(myUnboundPlace(people, null)).toBeNull();
  });
});

describe("storyFieldsFrom", () => {
  it("starts from what the tree knows", () => {
    expect(storyFieldsFrom(rose)).toEqual({ name: "Rose", lastName: "Vo", birthYear: "1945", hasAccount: null });
    expect(storyFieldsFrom(person({ id: "g", givenName: "Gus", deathYear: 1979 })).hasAccount).toBe("cannot");
  });
});

describe("relationFromTree", () => {
  const family = { people, edges: [{ from: "rose", to: "me", kind: "parent" }], households: [] } as unknown as Family;
  const offered = ["Mother", "Father", "Partner", "Sibling"];
  it("names who they are to you, in the form's words", () => {
    expect(relationFromTree(family, "rose", "u-me", offered)).toBe("Mother");
  });
  it("is nothing when the tree doesn't know, or has no chip for it", () => {
    expect(relationFromTree(family, "ross", "u-me", offered)).toBeNull();
    expect(relationFromTree(family, "rose", "u-me", ["Father"])).toBeNull();
    expect(relationFromTree(family, "rose", null, offered)).toBeNull();
  });
});
