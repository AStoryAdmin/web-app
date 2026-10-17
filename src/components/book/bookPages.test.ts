import { describe, expect, it } from "vitest";
import { buildBook, buildSampleBook, pageText, spreadsOf, datelineOf, sourceOf } from "./bookPages";
import { SAMPLE_BOOKS } from "../../data/sampleBooks";
import { newMemory, newStory } from "../../data/memories";

function story() {
  const s = newStory({ id: "s1", name: "Nora", lastName: "Whitfield", relationship: "Grandmother", birthYear: "1941" });
  s.bookDesign = { cover: { color: "forest" }, listenKey: "abcdefghijklmnop" };
  s.memories = [
    newMemory({ id: "m1", title: "One bicycle", era: "Childhood", period: "1949", body: "We had one bicycle between the four of us.\n\nIt was never my turn.", createdAt: "2026-09-01T10:00:00.000Z" }),
    newMemory({
      id: "11111111-2222-3333-4444-555555555555",
      title: "He asked me three times",
      era: "Love & family",
      period: "June 1962",
      body: "Your grandfather asked me three times. ".repeat(60),
      audio: [{ id: 1, bucket: "memory-audio", path: "a/b.m4a", speaker: "narrator", duration: 130, transcript: "" }],
      createdAt: "2026-09-03T10:00:00.000Z",
    }),
  ];
  return s;
}

describe("buildBook", () => {
  it("opens with the cover and endpapers, ends with endpapers and the back cover, an even count", () => {
    const b = buildBook(story(), { recordedBy: "June", asked: { m1: { q: "What did you ride?", by: "June" } } });
    const kinds = b.pages.map((p) => p.kind);
    expect(kinds.slice(0, 5)).toEqual(["cover", "endpaper", "endpaper", "colophon", "title"]);
    expect(kinds.slice(-3)).toEqual(["endpaper", "endpaper", "back"]);
    expect(b.pages.length % 2).toBe(0);
    expect(b.cover.key).toBe("forest");
  });
  it("gives every chapter an opener and numbers the contents from the openers", () => {
    const b = buildBook(story());
    const contents = b.pages.find((p) => p.kind === "contents");
    const openers = b.pages.filter((p) => p.kind === "opener");
    expect(openers).toHaveLength(2);
    if (contents?.kind !== "contents") throw new Error("no contents");
    expect(contents.entries.map((e) => e.name)).toEqual(["Childhood", "Love & family"]);
    expect(contents.entries[0].page).toBe(b.pages.indexOf(openers[0]) - 1);
    if (openers[0].kind === "opener") expect(openers[0].folio).toBe(contents.entries[0].page);
  });
  it("prints the question and who asked it only when the data has it, and the code only with a recording", () => {
    const b = buildBook(story(), { asked: { m1: { q: "What did you ride?", by: "June" } } });
    const first = b.pages.find((p) => p.kind === "memory" && p.memoryId === "m1");
    if (first?.kind !== "memory") throw new Error("no memory page");
    expect(first.asked).toEqual({ q: "What did you ride?", by: "June" });
    expect(first.strip).toBeNull();
    expect(first.summary).toBe("");
    const voiced = b.pages.filter((p) => p.kind === "memory" && p.memoryId !== "m1");
    const last = voiced[voiced.length - 1];
    if (last?.kind !== "memory") throw new Error("no voiced page");
    expect(last.strip?.url).toMatch(/^https:\/\/astoryapp\.com\/l\?m=[A-Za-z0-9_-]{22}&k=abcdefghijklmnop$/);
    expect(last.strip?.rec).toBe("Recorded Sep 3, 2026 · 2 min");
    const head = voiced[0];
    if (head.kind === "memory") expect(head.source?.label).toBe("Live conversation · 2 min");
  });
  it("cuts a long memory into pages at sentence ends", () => {
    const b = buildBook(story());
    const pages = b.pages.filter((p) => p.kind === "memory" && p.memoryId !== "m1");
    expect(pages.length).toBeGreaterThan(1);
    for (const p of pages) if (p.kind === "memory") for (const para of p.paragraphs) expect(para.endsWith(".")).toBe(true);
  });
});

describe("the samples' families", () => {
  it("build with the whole anatomy: summary, question, deeper page, lesson and code", () => {
    for (const s of SAMPLE_BOOKS) {
      const b = buildSampleBook(s);
      expect(b.fictional).toBe(true);
      expect(b.pages.length % 2).toBe(0);
      const mem = b.pages.find((p) => p.kind === "memory");
      if (mem?.kind !== "memory") throw new Error("no memory");
      expect(mem.summary).not.toBe("");
      expect(mem.asked?.by).toBeTruthy();
      const deeper = b.pages.find((p) => p.kind === "deeper");
      if (deeper?.kind !== "deeper") throw new Error("no deeper page");
      expect(deeper.lesson).toBeTruthy();
      expect(deeper.strip?.tabs).toContain("Full transcript");
    }
  });
  it("takes a chosen cover colour", () => {
    expect(buildSampleBook(SAMPLE_BOOKS[0], "mustard").cover.name).toBe("Mustard");
    expect(buildSampleBook(SAMPLE_BOOKS[0]).cover.key).toBe("navy");
  });
});

describe("spreads and words", () => {
  it("puts the cover alone on the right and the back cover alone on the left", () => {
    const b = buildSampleBook(SAMPLE_BOOKS[1]);
    const s = spreadsOf(b.pages);
    expect(s[0].left).toBeNull();
    expect(s[0].right?.kind).toBe("cover");
    expect(s[s.length - 1].left?.kind).toBe("back");
    expect(s[s.length - 1].right).toBeNull();
  });
  it("reads a page aloud in order", () => {
    const b = buildSampleBook(SAMPLE_BOOKS[0]);
    const mem = b.pages.find((p) => p.kind === "memory");
    const lines = pageText(mem ?? null).filter(Boolean);
    expect(lines[0]).toBe("Where we come from");
    expect(lines[1]).toBe("Bread and the lake");
    expect(lines.some((l) => l.startsWith("The question:"))).toBe(true);
  });
  it("sets the dateline as the samples do", () => {
    const s = story();
    expect(datelineOf(s, s.memories[0])).toBe("1949 · age 8");
    expect(sourceOf(s, s.memories[0])).toBeNull();
  });
});
