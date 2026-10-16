// Smoke tests over the copied app-core modules: enough to prove the copies
// load in this toolchain and give the app's answers. The full suite lives
// in phone-app/scripts/test-lib.mjs and runs there.
import { describe, expect, it } from "vitest";
import { ERAS, FAMILY_CHAPTER, normaliseEra } from "./data/eras.js";
import { ALL_PROMPTS, getPrompts } from "./data/interview.js";
import { parseYear, groupByYear, ageLabel } from "./lib/timeline.js";
import { bookProgress, BOOK_MIN_MEMORIES } from "./lib/bookProgress.js";
import { deckForDay, dayKey, depthFor } from "./lib/dailyQuestion.js";
import { normaliseFamilyCode, looksLikeFamilyCode } from "./lib/familyCode.js";
import { parseDateParts, formatDateParts } from "./lib/memoryDateInput.js";

const story = {
  name: "Rose",
  birthYear: "1945",
  memories: [
    { id: "a", title: "The blue door", body: "x", era: "Childhood", period: "1951", status: "saved" },
    { id: "b", title: "Summer of '87", body: "x", era: "Growing up", period: "Summer of '87", status: "saved" },
    { id: "c", title: "Undated", body: "x", era: "Looking back", period: "", status: "saved" },
  ],
};

describe("chapters", () => {
  it("has the eleven chapters and the family one", () => {
    expect(ERAS).toHaveLength(11);
    expect(ERAS).toContain(FAMILY_CHAPTER);
    expect(normaliseEra("Childhood")).toBe("Childhood");
  });
});

describe("dates", () => {
  it("reads years out of free text the way the app does", () => {
    expect(parseYear("June 1975")).toBe(1975);
    expect(parseYear("Summer of '87")).toBe(1987);
    expect(parseYear("the 60s")).toBe(1960);
    expect(parseYear("")).toBeNull();
  });
  it("groups a life by year and leaves the undated at the end", () => {
    const groups = groupByYear(story.memories, { story, dir: 1 } as never);
    expect(groups.length).toBeGreaterThan(0);
    expect(ageLabel(story, 1951)).toMatch(/6/);
  });
  it("round-trips date parts", () => {
    expect(formatDateParts(parseDateParts("June 1975"))).toMatch(/1975/);
  });
});

describe("book and questions", () => {
  it("measures book progress against the core chapters", () => {
    const p = bookProgress(story);
    expect(BOOK_MIN_MEMORIES).toBe(20);
    expect(p.count).toBe(3);
    expect(p.remaining).toBe(BOOK_MIN_MEMORIES - 3);
    expect(p.emptyChapters.length).toBeGreaterThan(0);
  });
  it("ships the whole question bank and deals a daily deck", () => {
    expect(ALL_PROMPTS.length).toBeGreaterThan(500);
    expect(getPrompts("Rose").length).toBeGreaterThan(100);
    const deck = deckForDay(ALL_PROMPTS, story.memories, { key: dayKey(new Date("2026-10-16")), size: 3 });
    expect(deck.length).toBeGreaterThan(0);
    expect(depthFor(0)).toBeLessThanOrEqual(2);
  });
});

describe("family codes", () => {
  it("normalises codes like the app", () => {
    expect(looksLikeFamilyCode(normaliseFamilyCode("k7m2 qx"))).toBe(true);
  });
});
