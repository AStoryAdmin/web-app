// The three ways to be in a story, and one person never twice (docs/PRD.md §3.3a).
import { describe, expect, it } from "vitest";
import { stateWords, storyGroups, storyGroupOf } from "./familyView";
import { duplicateFix, duplicateGroups, findPersonByEmail, sameNamePeople, type Family, type Person } from "../../data/family";
import type { Story } from "../../data/stories";

const story = (o: Partial<Story>): Story => ({ id: "s", ownerId: "me", name: "Rose", lastName: "Hartley", relationship: "Mother", memories: [], ...o }) as Story;
const person = (o: Partial<Person>): Person => ({ id: "p", householdId: "h", givenName: "Nhi", familyName: "Tran", sex: "", source: "manual", ...o }) as Person;
const fam = (people: Person[]): Family => ({ people, edges: [], households: [] });

describe("whose story: three groups, never mixed", () => {
  it("sorts yours, the ones you keep, and the ones you've joined", () => {
    const mine = story({ id: "a", relationship: "Myself" });
    const kept = story({ id: "b", relationship: "Mother" });
    const joined = story({ id: "c", ownerId: "nhi", relationship: "Myself", name: "Nhi" });
    expect(storyGroupOf(mine, "me")).toBe("own");
    expect(storyGroupOf(kept, "me")).toBe("kept");
    expect(storyGroupOf(joined, "me")).toBe("joined");
    const groups = storyGroups([joined, kept, mine], "me");
    expect(groups.map((g) => g.title)).toEqual(["Your story", "Stories you keep for someone", "Stories you've joined"]);
    expect(groups.find((g) => g.key === "joined")?.stories.map((s) => s.id)).toEqual(["c"]);
  });
  it("treats a story with no owner recorded as yours, and leaves empty groups out", () => {
    const legacy = story({ id: "a", ownerId: null, relationship: "Father" });
    expect(storyGroups([legacy], "me")).toHaveLength(1);
    expect(storyGroups([legacy], "me")[0].key).toBe("kept");
  });
});

describe("the three states, in the product's words", () => {
  it("names them exactly", () => {
    expect(stateWords("listed")).toBe("not on A Story yet");
    expect(stateWords("invited")).toBe("invited · waiting for them");
    expect(stateWords("joined")).toBe("on A Story");
    expect(stateWords("you")).toBe("on A Story");
    expect(stateWords("remembered")).toBe("");
  });
});

describe("one person, never twice", () => {
  it("finds the person already listed under an email, whatever the case", () => {
    const f = fam([person({ id: "1", email: "nhi@example.com" }), person({ id: "2", givenName: "Linh" })]);
    expect(findPersonByEmail(f, "  NHI@Example.com ")?.id).toBe("1");
    expect(findPersonByEmail(f, "")).toBeNull();
    expect(findPersonByEmail(f, "nobody@example.com")).toBeNull();
  });
  it("matches the same name with accents and spacing folded, but never somebody on A Story", () => {
    const f = fam([person({ id: "1", givenName: "Nhi", familyName: "Trần" }), person({ id: "2", givenName: "nhi ", familyName: "tran", userId: "u2" })]);
    expect(sameNamePeople(f, "Nhi", "Tran").map((p) => p.id)).toEqual(["1"]);
  });
  it("groups the copies, keeps the account's row, then the one bound to a story, and ignores placeholders", () => {
    const people = [
      person({ id: "a", createdAt: "2026-10-01" }),
      person({ id: "b", createdAt: "2026-10-02", storyId: "s1" }),
      person({ id: "c", createdAt: "2026-10-03" }),
      person({ id: "d", createdAt: "2026-10-04", userId: "u" }),
      person({ id: "e", source: "placeholder", givenName: "Nhi" }),
      person({ id: "f", givenName: "Linh" }),
    ];
    const groups = duplicateGroups(people);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe("Nhi Tran");
    expect(groups[0].keep.id).toBe("d");
    expect(groups[0].extras.map((p) => p.id)).toEqual(["a", "b", "c"]);
    expect(duplicateGroups(people.filter((p) => p.id !== "d"))[0].keep.id).toBe("b");
  });
  it("never offers two accounts as one person", () => {
    expect(duplicateGroups([person({ id: "a", userId: "u1" }), person({ id: "b", userId: "u2" })])).toHaveLength(0);
  });
  it("picks the way out that fits each extra row", () => {
    const account = person({ id: "me", userId: "u" });
    const teller = person({ id: "t", storyId: "s1" });
    const plain = person({ id: "p" });
    expect(duplicateFix(account, teller, ["s1"])).toBe("merge");
    expect(duplicateFix(teller, plain, ["s1"])).toBe("merge");
    expect(duplicateFix(teller, person({ id: "x", storyId: "s1" }), ["s1"])).toBe("remove");
    expect(duplicateFix(teller, person({ id: "x", storyId: "s2" }), ["s1", "s2"])).toBe("merge-stories");
    expect(duplicateFix(teller, person({ id: "x", storyId: "s2" }), ["s1"])).toBe("none");
  });
});
