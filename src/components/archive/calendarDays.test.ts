// What the archive's calendar puts on a day: kept memories, the tree's birthdays and death days, dated memories, the phone's kept days.
import { beforeEach, describe, expect, it, vi } from "vitest";

let answer: { data: unknown; error: { code?: string; message: string } | null } = { data: [], error: null };
const asked: string[] = [];
vi.mock("../../lib/supabase", () => ({
  getSupabase: () => ({
    from: (table: string) => ({
      select: (cols: string) => {
        asked.push(`${table}.${cols}`);
        return Promise.resolve(answer);
      },
    }),
  }),
}));

import { allMarks, dateOfKey, happenedMarks, keptByDay, keptDayMarks, loadKeptDays, marksOn, monthGrid, monthLine, storyBirthday, treeMarks } from "./calendarDays";
import type { Person } from "../../data/family";
import type { Memory, Story } from "../../data/stories";

const person = (over: Record<string, unknown>) => ({ id: "p", givenName: "", familyName: "", source: "manual", householdId: "h1", ...over }) as unknown as Person;
const memory = (over: Partial<Memory>) => ({ id: "m", title: "", body: "", period: "", status: "saved", createdAt: "2026-10-21T10:00:00", ...over }) as Memory;
const story = (over: Partial<Story> = {}) =>
  ({ id: "s1", name: "Rose", lastName: "Miller", householdId: "h1", birthDay: "", birthMonth: "", birthYear: "", memories: [], ...over }) as unknown as Story;

beforeEach(() => {
  answer = { data: [], error: null };
  asked.length = 0;
});

describe("treeMarks", () => {
  it("marks birthdays and the days somebody died, by first name, in this household only", () => {
    const marks = treeMarks(
      [
        person({ id: "w", givenName: "Walter Ray", birthDay: 3, birthMonth: 5, birthYear: 1920, deathDay: 24, deathMonth: 10, deathYear: 1990 }),
        person({ id: "x", givenName: "Bao", birthDay: 1, birthMonth: 1, householdId: "h2" }),
        person({ id: "y", givenName: "Nobody", birthDay: 9, birthMonth: 9, source: "placeholder" }),
        person({ id: "z", givenName: "Linh", birthDay: 31, birthMonth: 4 }),
      ],
      "h1",
    );
    expect(marks).toEqual([
      { id: "birthday-w", kind: "birthday", month: 4, day: 3, year: 1920, words: "Walter’s birthday", personId: "w" },
      { id: "remembrance-w", kind: "remembrance", month: 9, day: 24, year: 1990, words: "Remembering Walter", personId: "w" },
    ]);
  });
});

describe("storyBirthday", () => {
  const s = story({ birthDay: "14", birthMonth: "June", birthYear: "1941" });

  it("comes from the story when the tree has no birthday for the storyteller", () => {
    expect(storyBirthday([s], [], [])).toEqual([{ id: "birthday-s1", kind: "birthday", month: 5, day: 14, year: 1941, words: "Rose’s birthday" }]);
  });

  it("is each story's, by its own first name", () => {
    const walter = story({ id: "s2", name: "Walter", birthDay: "3", birthMonth: "May" });
    expect(storyBirthday([s, walter], [], []).map((m) => m.words)).toEqual(["Rose’s birthday", "Walter’s birthday"]);
  });

  it("is left to the tree when the storyteller's own row has one", () => {
    const people = [person({ id: "r", givenName: "Rose", storyId: "s1", birthDay: 14, birthMonth: 6 })];
    expect(storyBirthday([s], treeMarks(people), people)).toEqual([]);
  });
});

describe("happenedMarks and keptDayMarks", () => {
  it("marks a memory dated to the day, every year, under its title", () => {
    const marks = happenedMarks([
      memory({ id: "a", title: "The wedding", period: "24 October 1966" }),
      memory({ id: "b", period: "June 1975" }),
      memory({ id: "c", period: "4 June 1980", status: "in_progress" }),
    ]);
    expect(marks).toEqual([{ id: "happened-a", kind: "happened", month: 9, day: 24, year: 1966, words: "“The wedding”", memoryId: "a" }]);
  });

  it("says the phone's kept days in words, an anniversary by first name", () => {
    const marks = keptDayMarks(
      [
        { id: "1", storyId: "s1", kind: "anniversary", label: "Wedding", day: 24, month: 10, year: 1966 },
        { id: "2", storyId: "s1", kind: "birthday-ish", label: "", day: 2, month: 2, year: null },
        { id: "3", storyId: "other", kind: "anniversary", label: "Not ours", day: 1, month: 1, year: null },
      ],
      [story()],
    );
    expect(marks.map((m) => [m.kind, m.month, m.day, m.words])).toEqual([
      ["anniversary", 9, 24, "Rose’s wedding anniversary"],
      ["other", 1, 2, "A day kept for Rose"],
    ]);
  });

  it("puts birthdays first on a day", () => {
    const s = story({ birthDay: "24", birthMonth: "10", memories: [memory({ id: "a", title: "Rain", period: "24 October 1966" })] });
    expect(marksOn(allMarks(s, [], []), new Date(2026, 9, 24)).map((m) => m.kind)).toEqual(["birthday", "happened"]);
  });

  it("shows the family's days marked on another story, under that story's name", () => {
    const rose = story();
    const walter = story({ id: "s2", name: "Walter", lastName: "Miller", birthDay: "3", birthMonth: "May" });
    const rows = [{ id: "9", storyId: "s2", kind: "anniversary", label: "Wedding", day: 24, month: 10, year: 1966 }];
    const marks = allMarks(rose, [], rows, [rose, walter]);
    expect(marksOn(marks, new Date(2026, 9, 24)).map((m) => m.words)).toEqual(["Walter’s wedding anniversary"]);
    expect(marksOn(marks, new Date(2026, 4, 3)).map((m) => m.words)).toEqual(["Walter’s birthday"]);
  });
});

describe("the grid and the days", () => {
  it("draws a month Sunday first, as many weeks as it needs", () => {
    const weeks = monthGrid(2026, 1); // February 2026 starts on a Sunday and fills four weeks
    expect(weeks).toHaveLength(4);
    expect(weeks[0][0].getDate()).toBe(1);
    const oct = monthGrid(2026, 9); // 1 October 2026 is a Thursday
    expect(oct[0][0].getMonth()).toBe(8);
    expect(oct[0][4].getDate()).toBe(1);
    expect(oct).toHaveLength(5);
  });

  it("keeps a 29 February birthday on the 28th in other years", () => {
    const marks = treeMarks([person({ id: "l", givenName: "Leap", birthDay: 29, birthMonth: 2 })]);
    expect(marksOn(marks, new Date(2026, 1, 28))).toHaveLength(1);
    expect(marksOn(marks, new Date(2028, 1, 28))).toHaveLength(0);
    expect(marksOn(marks, new Date(2028, 1, 29))).toHaveLength(1);
  });

  it("counts kept memories by the day they were written down, and says the month plainly", () => {
    const byDay = keptByDay([
      memory({ id: "a", createdAt: "2026-10-21T09:00:00" }),
      memory({ id: "b", createdAt: "2026-10-21T18:00:00" }),
      memory({ id: "c", createdAt: "2026-10-02T09:00:00" }),
      memory({ id: "d", createdAt: "2026-10-03T09:00:00", status: "in_progress" }),
    ]);
    expect(byDay.get("2026-10-21")?.map((m) => m.id)).toEqual(["b", "a"]);
    expect(byDay.has("2026-10-03")).toBe(false);
    expect(monthLine(byDay, 2026, 9)).toBe("3 memories kept on 2 days this month");
    expect(monthLine(byDay, 2026, 8)).toBe("Nothing kept this month yet");
  });

  it("reads a day key, and nothing that isn't one", () => {
    expect(dateOfKey("2026-09-14")?.getDate()).toBe(14);
    expect(dateOfKey("2026-02-31")).toBeNull();
    expect(dateOfKey("")).toBeNull();
  });
});

describe("loadKeptDays", () => {
  it("reads every row the account can see, not one story's", async () => {
    answer = { data: [{ id: "1", story_id: "s1", kind: "anniversary", label: "Wedding", day: 24, month: 10, year: 1966 }], error: null };
    expect(await loadKeptDays()).toEqual([{ id: "1", storyId: "s1", kind: "anniversary", label: "Wedding", day: 24, month: 10, year: 1966 }]);
    expect(asked).toEqual(["story_milestones.*"]);
  });

  it("is empty when the table isn't there", async () => {
    answer = { data: null, error: { code: "42P01", message: "missing" } };
    expect(await loadKeptDays()).toEqual([]);
  });
});
