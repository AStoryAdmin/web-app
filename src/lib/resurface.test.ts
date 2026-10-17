import { describe, expect, it } from "vitest";
import { resurface } from "./resurface";
import type { Memory, Story } from "../data/stories";

const long = "The kitchen had a blue door and the radio was always on, and my mother sang along to everything, badly, which we loved.";

const mem = (over: Partial<Memory>): Memory =>
  ({
    id: "x",
    title: "",
    body: long,
    excerpt: "",
    era: "Childhood",
    period: "",
    rating: 0,
    ratingNote: "",
    privacy: "shared",
    status: "saved",
    photos: [],
    cover: null,
    audio: [],
    color: "",
    contributor: "",
    authorPersonId: null,
    createdBy: null,
    familyCallId: null,
    createdAt: "2024-03-10T10:00:00Z",
    ...over,
  }) as Memory;

const story = (memories: Memory[]): Story => ({ id: "s1", birthYear: "1945", memories, relationship: "Myself", name: "Rose" }) as unknown as Story;

const now = new Date(2026, 9, 16, 12); // 16 October 2026

describe("resurface", () => {
  it("needs two memories with words, and never shows the newest", () => {
    expect(resurface(story([mem({ id: "a" })]), now)).toBeNull();
    const s = story([mem({ id: "old", createdAt: "2024-01-01T00:00:00Z" }), mem({ id: "new", createdAt: "2026-10-15T00:00:00Z" })]);
    expect(resurface(s, now)?.memory.id).toBe("old");
  });
  it("prefers this month in an earlier year, with the age", () => {
    const s = story([mem({ id: "oct", period: "October 1975", createdAt: "2024-01-01T00:00:00Z" }), mem({ id: "jun", period: "June 1980", createdAt: "2024-01-02T00:00:00Z" }), mem({ id: "new", createdAt: "2026-10-15T00:00:00Z" })]);
    const r = resurface(s, now);
    expect(r?.memory.id).toBe("oct");
    expect(r?.kicker).toBe("October 1975");
    expect(r?.age).toBe("age 30");
  });
  it("then the day it was written, years ago", () => {
    const s = story([mem({ id: "ann", createdAt: "2025-10-16T09:00:00Z" }), mem({ id: "b", createdAt: "2024-05-05T00:00:00Z" }), mem({ id: "new", createdAt: "2026-10-15T00:00:00Z" })]);
    const r = resurface(s, now);
    expect(r?.memory.id).toBe("ann");
    expect(r?.kicker).toBe("Written a year ago today");
  });
  it("is the same all day and seeded by the date", () => {
    const s = story(Array.from({ length: 8 }, (_, i) => mem({ id: `m${i}`, createdAt: `2024-0${(i % 8) + 1}-01T00:00:00Z` })));
    const a = resurface(s, now)?.memory.id;
    expect(resurface(s, new Date(2026, 9, 16, 22))?.memory.id).toBe(a);
    const ids = new Set(Array.from({ length: 10 }, (_, d) => resurface(s, new Date(2026, 9, d + 1))?.memory.id));
    expect(ids.size).toBeGreaterThan(1);
  });
  it("skips calls still being written up and memories without words", () => {
    const s = story([mem({ id: "a", createdAt: "2024-01-01T00:00:00Z" }), mem({ id: "b", status: "in_progress", createdAt: "2024-02-01T00:00:00Z" }), mem({ id: "c", body: "short", createdAt: "2024-03-01T00:00:00Z" }), mem({ id: "new", createdAt: "2026-10-15T00:00:00Z" })]);
    expect(resurface(s, now)?.memory.id).toBe("a");
  });
});

describe("opening", () => {
  it("skips a transcript's throat-clearing and starts on a real sentence", async () => {
    const { opening } = await import("./resurface");
    const t = "Yeah well so my dad. So I started out. My mother kept a garden behind the house and we ate from it all summer long. Then we moved.";
    expect(opening(t)).toBe("My mother kept a garden behind the house and we ate from it all summer long. Then we moved.");
    expect(opening("Short.")).toBe("Short.");
  });
});
