// What a person’s page lays along its rail: oldest first, the newest last; related by chapter or year; their own notes.
import { describe, expect, it } from "vitest";
import { fitsPerson, noteIsFrom, oneLine, promptsAbout, railFor, relatedFor, spanLine, splitRail } from "./personRail";
import type { Contribution } from "../../data/contributions";
import type { Person } from "../../data/family";
import type { Memory, Story } from "../../data/stories";

const mem = (o: Partial<Memory>): Memory => ({ id: "m", title: "A day", body: "", excerpt: "", era: "Childhood", period: "", rating: 0, ratingNote: "", privacy: "shared", status: "saved", photos: [], cover: null, audio: [], color: "", contributor: "", authorPersonId: null, createdBy: null, familyCallId: null, createdAt: "2026-01-01", ...o }) as Memory;
const story = (memories: Memory[]): Story => ({ id: "s", ownerId: "me", name: "Leo", lastName: "", relationship: "Myself", memories }) as Story;
const person = (o: Partial<Person>): Person => ({ id: "p", householdId: "h", givenName: "Bao", familyName: "Nguyen", sex: "", source: "manual", ...o }) as Person;

describe("the rail", () => {
  it("puts the oldest at the top and the newest last, undated at the end, each memory once", () => {
    const s = story([]);
    const a = mem({ id: "a", period: "2014" });
    const b = mem({ id: "b", period: "Summer 1968" });
    const c = mem({ id: "c", period: "" });
    const rail = railFor([{ story: s, memory: a }], [{ story: s, memory: b }, { story: s, memory: a }], null);
    expect(rail.map((f) => f.memory.id)).toEqual(["b", "a"]);
    expect(railFor([], [{ story: s, memory: c }, { story: s, memory: a }], null).map((f) => f.memory.id)).toEqual(["a", "c"]);
  });
  it("is the storyteller’s own story when it is theirs, without what is still being written up", () => {
    const own = story([mem({ id: "x", period: "1990" }), mem({ id: "y", period: "1980", status: "in_progress" })]);
    expect(railFor([], [], own).map((f) => f.memory.id)).toEqual(["x"]);
  });

  it("keeps the memories they are in beside their own story, each once", () => {
    const own = story([mem({ id: "x", period: "1990" })]);
    const other = story([mem({ id: "t", period: "2001" }), mem({ id: "x", period: "1990" })]);
    const tagged = [{ story: other, memory: other.memories[0] }, { story: other, memory: other.memories[1] }];
    expect(railFor([], tagged, own).map((f) => f.memory.id)).toEqual(["x", "t"]);
  });
  it("says how many and the years they span", () => {
    const s = story([]);
    expect(spanLine([{ story: s, memory: mem({ period: "2014" }) }, { story: s, memory: mem({ id: "z", period: "2024" }) }])).toBe("2 memories · 2014 to 2024");
    expect(spanLine([{ story: s, memory: mem({ period: "1968" }) }])).toBe("1 memory · 1968");
    expect(spanLine([{ story: s, memory: mem({}) }])).toBe("1 memory");
    expect(spanLine([])).toBe("");
    expect(spanLine([{ story: s, memory: mem({ period: "the 2020s" }) }])).toBe("1 memory · the 2020s");
  });
  it("keeps what they told apart from what others told with them in it", () => {
    const own = story([mem({ id: "x", period: "1990" }), mem({ id: "d", period: "1961", contributor: "Daniel Hartley" })]);
    const other = story([mem({ id: "t", period: "2001" })]);
    const { theirs, others } = splitRail([], [{ story: other, memory: other.memories[0] }], own);
    expect(theirs.map((f) => f.memory.id)).toEqual(["x"]);
    expect(others.map((f) => f.memory.id)).toEqual(["d", "t"]);
  });
});

describe("related memories", () => {
  it("shares a chapter or a year with the rail, is not on it, newest first, three at most", () => {
    const on = mem({ id: "on", era: "Childhood", period: "1968" });
    const sameYear = mem({ id: "y", era: "Work & making a living", period: "1968" });
    const sameChapter = mem({ id: "c", era: "Childhood", period: "1972" });
    const other = mem({ id: "o", era: "Looking back", period: "2001" });
    const s = story([on, sameYear, sameChapter, other]);
    const picks = relatedFor([{ story: s, memory: on }], s);
    expect(picks.map((f) => f.memory.id)).toEqual(["c", "y"]);
    expect(relatedFor([], s)).toEqual([]);
  });
});

describe("a note from family", () => {
  const note = (o: Partial<Contribution>): Contribution => ({ id: "c", kind: "testimonial", contributorName: "", relationship: "", title: "", body: "I remember.", photos: [], memoryId: null, contributorEmail: "", personId: null, personIds: null, via: null, status: "approved", createdAt: "2026-01-01", ...o });
  it("is theirs by their tree row or by their name at the front of the credit", () => {
    const p = person({});
    expect(noteIsFrom(note({ personId: "p" }), p)).toBe(true);
    expect(noteIsFrom(note({ contributorName: "Bao, his friend" }), p)).toBe(true);
    expect(noteIsFrom(note({ contributorName: "Bảo Nguyen" }), p)).toBe(true);
    expect(noteIsFrom(note({ contributorName: "Baobao" }), p)).toBe(false);
    expect(noteIsFrom(note({ contributorName: "Linh" }), p)).toBe(false);
  });
});

describe("one line of the words", () => {
  it("takes the first real sentence and cuts on a word, never the server’s summary", () => {
    expect(oneLine(mem({ body: "Well. We planted tomatoes the first year and they came up badly, every one of them, but we kept going anyway." }), 60)).toMatch(/^We planted tomatoes.*…$/);
    expect(oneLine(mem({ excerpt: "The speaker recalls a garden." }))).toBe("");
    expect(oneLine(mem({}))).toBe("");
    const chat = oneLine(mem({ body: "You: How to end chay AI: If you’d like to end the chat, you can simply stop replying." }));
    expect(chat).not.toMatch(/AI:|You:|If you’d like/);
  });
});

describe("questions about somebody nobody has written about yet", () => {
  const who = (over: Partial<Person>) => ({ id: "p-1", givenName: "Maya", familyName: "Hartley", birthYear: 1998, deathYear: null, ...over }) as unknown as Person;
  it("are about the person, of their time of life, in their tense", () => {
    expect(fitsPerson("faith-house-had", who({}))).toBe(false);
    expect(fitsPerson("world-cost-remember", who({ birthYear: 1998 }))).toBe(false);
    expect(fitsPerson("world-cost-remember", who({ birthYear: 1941 }))).toBe(true);
    expect(fitsPerson("world-cost-remember", who({ birthYear: null }))).toBe(false);
    expect(fitsPerson("work-hours", who({ birthYear: 2004 }))).toBe(false);
    expect(fitsPerson("family-fridge", who({ birthYear: 1910, deathYear: 1990 }))).toBe(false);
    expect(fitsPerson("family-fridge", who({}))).toBe(true);
    // the living are asked in the present perfect where the bank has it, not as if their working life were over
    expect(fitsPerson("work-longest", who({ birthYear: 1960 }))).toBe(false);
    expect(fitsPerson("open-worked-where", who({ birthYear: 1960 }))).toBe(true);
    expect(fitsPerson("work-longest", who({ birthYear: 1920, deathYear: 1999 }))).toBe(true);
  });
  it("never ask about somebody who has died as if they were alive", () => {
    const walter = (id: string) => who({ id, givenName: "Walter", birthYear: 1936, deathYear: 1979 });
    for (const id of ["else-laugh-now", "family-in-charge", "else-holiday-kitchen", "else-sport", "open-worked-where"]) {
      expect(fitsPerson(id, walter("w"))).toBe(false);
      expect(fitsPerson(id, who({ birthYear: 1936 }))).toBe(true);
    }
    for (const id of ["w-1", "w-2", "36cfd520-c499-4771-b0e2-ffc64cabefb1", "walter", "x"]) {
      const asked = promptsAbout(walter(id), 40);
      expect(asked.length).toBeGreaterThan(0);
      for (const q of asked) expect(q.question).not.toMatch(/\b(does|do|has|is|loves?|makes) Walter\b|Walter (still|is|has|does) |these days/);
    }
  });
  it("are three, from three topics, the same three each time, and never say \"them’s\"", () => {
    for (const id of ["p-1", "36cfd520-c499-4771-b0e2-ffc64cabefb1", "sample-sam", "x"]) {
      const a = promptsAbout(who({ id }));
      expect(a).toHaveLength(3);
      expect(new Set(a.map((q) => q.id)).size).toBe(3);
      expect(promptsAbout(who({ id }))).toEqual(a);
    }
    const nameless = promptsAbout(who({ givenName: "" }), 40);
    expect(nameless.every((q) => !/them’s/.test(q.question))).toBe(true);
    expect(nameless.some((q) => /this person/.test(q.question))).toBe(true);
  });
});
