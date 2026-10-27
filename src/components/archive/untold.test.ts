import { describe, expect, it } from "vitest";
import { chapterQuestions, notYetTold, untoldLine } from "./untold";
import { CORE_CHAPTERS } from "../../app-core/data/eras.js";
import type { Memory, Story } from "../../data/stories";

const memory = (over: Partial<Memory>): Memory =>
  ({ id: crypto.randomUUID(), title: "", body: "x", excerpt: "", era: "Childhood", period: "", status: "saved", photos: [], audio: [], createdAt: "2026-10-01T10:00:00Z", ...over }) as Memory;

const story = (memories: Memory[] = []): Story => ({ id: "s1", name: "Rose", lastName: "", relationship: "Mother", memories }) as unknown as Story;

describe("notYetTold", () => {
  it("lists every core chapter of an empty story, in life order, each with a question", () => {
    const out = notYetTold(story());
    expect(out.map((c) => c.era)).toEqual((CORE_CHAPTERS as string[]).filter((era) => out.some((c) => c.era === era)));
    expect(out.length).toBeGreaterThan(3);
    for (const c of out) {
      expect(c.questions.length).toBeGreaterThan(0);
      for (const q of c.questions) {
        expect(q.era).toBe(c.era);
        expect(q.sensitive).toBeFalsy();
        expect(q.question).not.toMatch(/\{name\}/);
      }
    }
  });

  it("leaves out a chapter once it has a kept memory, but not for one still in progress", () => {
    const kept = notYetTold(story([memory({ era: "Childhood" })])).map((c) => c.era);
    expect(kept).not.toContain("Childhood");
    const draft = notYetTold(story([memory({ era: "Childhood", status: "in_progress" })])).map((c) => c.era);
    expect(draft).toContain("Childhood");
  });

  it("is empty once every chapter has begun, and for no story", () => {
    const all = (CORE_CHAPTERS as string[]).map((era) => memory({ era }));
    expect(notYetTold(story(all))).toEqual([]);
    expect(notYetTold(null)).toEqual([]);
  });
});

describe("chapterQuestions", () => {
  it("starts with the gentlest question and is the same every time", () => {
    const a = chapterQuestions(story(), "Childhood");
    const b = chapterQuestions(story(), "Childhood");
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id));
    const [first, ...rest] = a;
    const week1 = a.filter((q) => (q.tags || []).includes("week1"));
    if (week1.length) expect((first.tags || []).includes("week1")).toBe(true);
    // after the starter, by depth
    for (let i = 1; i < rest.length; i++) expect(rest[i].depth || 9).toBeGreaterThanOrEqual(rest[i - 1].depth || 9);
  });

  it("drops a question already answered (its title is the question), so it does not come back", () => {
    const [first] = chapterQuestions(story(), "Childhood");
    // an answered question in another chapter's memory still counts: the memory's title is what the question became
    const after = chapterQuestions(story([memory({ era: "Growing up", title: first.question })]), "Childhood");
    expect(after.map((q) => q.id)).not.toContain(first.id);
  });

  it("asks a relative about the storyteller, in the words the writer will use", () => {
    const about = chapterQuestions(story(), "Childhood", { relative: true });
    expect(about.length).toBeGreaterThan(0);
    expect(about.some((q) => q.question.includes("Rose"))).toBe(true);
    expect(notYetTold(story(), { relative: true })[0].questions[0].question).not.toBe(notYetTold(story())[0].questions[0].question);
  });
});

describe("untoldLine", () => {
  it("says the real count, and nothing at zero", () => {
    expect(untoldLine(0)).toBeNull();
    expect(untoldLine(1)).toBe("1 chapter still waiting for its first memory");
    expect(untoldLine(4)).toBe("4 chapters still waiting for a first memory");
  });
});
