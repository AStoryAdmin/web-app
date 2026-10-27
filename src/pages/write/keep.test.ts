import { describe, expect, it } from "vitest";
import { PHOTO_TITLE, answered, asksAbout, canKeep, keptTitle, writerCredit } from "./keep";
import type { Family } from "../../data/family";
import type { Story } from "../../data/stories";
import type { Prompt } from "../../lib/today";

const story = (over: Partial<Story> = {}): Story => ({ id: "s1", name: "Rose", relationship: "Grandmother", ownerId: "owner", memories: [], ...over }) as Story;

const q: Prompt = { id: "childhood-01", question: "Where did   you go as a child\nto be alone?", era: "Childhood" };

// Rose (the storyteller) and her granddaughter Jamie, joined through Jamie's mother Linh
const family = {
  people: [
    { id: "p-rose", givenName: "Rose", familyName: "", sex: "F", storyId: "s1", source: "manual" },
    { id: "p-linh", givenName: "Linh", familyName: "", sex: "F", source: "manual" },
    { id: "p-jamie", givenName: "Jamie", familyName: "", sex: "", userId: "u-jamie", source: "manual" },
  ],
  edges: [
    { kind: "parent", from: "p-rose", to: "p-linh", label: "" },
    { kind: "parent", from: "p-linh", to: "p-jamie", label: "" },
  ],
  households: [],
} as unknown as Family;

describe("asksAbout", () => {
  it("asks a relative about the storyteller, the owner who keeps her story too", () => {
    expect(asksAbout(story(), { id: "someone-else" })).toBe(true);
    expect(asksAbout(story(), { id: "owner" })).toBe(true);
    expect(asksAbout(story(), { id: "u-jamie" }, family.people)).toBe(true);
  });
  it("asks the storyteller directly: their own story, or the tree's subject is them", () => {
    expect(asksAbout(story({ relationship: "Myself", ownerId: "me" }), { id: "other" })).toBe(false);
    const people = family.people.map((p) => (p.id === "p-rose" ? { ...p, userId: "u-rose" } : p));
    expect(asksAbout(story(), { id: "u-rose" }, people)).toBe(false);
    expect(asksAbout(null, { id: "x" })).toBe(false);
  });
});

describe("answered", () => {
  it("keeps today's question with its words tidied and its id", () => {
    expect(answered(q)).toEqual({ prompt: "Where did you go as a child to be alone?", questionId: "childhood-01" });
  });
  it("keeps only the words of a question about someone", () => {
    expect(answered(q, { about: true })).toEqual({ prompt: "Where did you go as a child to be alone?" });
  });
  it("adds nothing for a page in your own words", () => {
    expect(answered(null)).toEqual({});
    expect(answered({ ...q, question: "  " })).toEqual({});
  });
});

describe("writerCredit", () => {
  it("is nothing on the storyteller's own story", () => {
    expect(writerCredit(story({ relationship: "Myself", ownerId: "u1" }), { id: "u1", firstName: "Rose" }, family)).toBeNull();
  });
  it("credits a relative with their place in the tree", () => {
    const credit = writerCredit(story(), { id: "u-jamie", firstName: "Jamie Tran" }, family);
    expect(credit?.authorPersonId).toBe("p-jamie");
    expect(credit?.contributor).toBe("Jamie, her grandchild");
  });
  it("credits by first name when the tree doesn't know them", () => {
    expect(writerCredit(story(), { id: "u-new", firstName: "Sam" }, family)).toEqual({ contributor: "Sam", authorPersonId: null });
    expect(writerCredit(story(), { id: "u-new", firstName: "Sam" }, null)).toEqual({ contributor: "Sam", authorPersonId: null });
  });
  it("is nothing when the writer has no name to give", () => {
    expect(writerCredit(story(), { id: "u-new", firstName: "" }, null)).toBeNull();
  });
});

describe("canKeep", () => {
  it("needs words, or a photograph on its own", () => {
    expect(canKeep("", 0)).toBe(false);
    expect(canKeep("  \n", 0)).toBe(false);
    expect(canKeep("A line.", 0)).toBe(true);
    expect(canKeep("", 1)).toBe(true);
  });
});

describe("keptTitle", () => {
  it("prefers the title (or caption) they gave it", () => {
    expect(keptTitle({ title: " At the lake ", question: "Q?", body: "Words.", photos: 1 })).toBe("At the lake");
  });
  it("falls back to the question, then the first sentence", () => {
    expect(keptTitle({ title: "", question: "Where?", body: "We swam. Then home.", photos: 0 })).toBe("Where?");
    expect(keptTitle({ title: "", body: "We swam all day. Then home.", photos: 0 })).toBe("We swam all day");
  });
  it("names a photograph kept with nothing written", () => {
    expect(keptTitle({ title: "", body: "", photos: 2 })).toBe(PHOTO_TITLE);
  });
});
