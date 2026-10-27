import { describe, expect, it, vi } from "vitest";

// the print path signs photographs through the app's storage client; these stories have none
vi.mock("../../lib/photoUrls", () => ({ photoUrl: async (u: string) => u }));
// every code the printed book draws, so a test can read where it points (the SVG itself carries no text)
const codes = vi.hoisted(() => [] as string[]);
vi.mock("../../app-core/lib/qr.js", async (orig) => {
  const real = (await orig()) as { qrSvg: (t: string, c?: string) => string };
  return { ...real, qrSvg: (t: string, c?: string) => (codes.push(t), real.qrSvg(t, c)) };
});

import { printableHtml, typeset } from "./printBook";
import { bodyHash } from "../../app-core/lib/bookDesign.js";
import { newMemory, newStory } from "../../data/memories";

function retoldStory() {
  const s = newStory({ id: "s1", name: "Nora", lastName: "Whitfield", relationship: "Grandmother", birthYear: "1941" });
  const body = "We didn't have much, but we had each other.";
  s.memories = [newMemory({ id: "m1", title: "Nora's kitchen", era: "Childhood", period: "1949", body, createdAt: "2026-09-01T10:00:00.000Z" })];
  s.bookDesign = {
    cover: { color: "forest", subtitle: "Nora's years" },
    narration: "third",
    pronoun: "she",
    retold: { m1: { h: bodyHash(body), body: "She said they didn't have much, but they had each other." } },
  };
  return s;
}

describe("Print at home", () => {
  it("keeps a third-person retelling when the memory's words hold an apostrophe, and sets it curled", async () => {
    const html = await printableHtml(retoldStory());
    expect(html).toContain("She said they didn’t have much, but they had each other.");
    expect(html).not.toContain("We didn’t have much");
    expect(html).not.toContain("didn't");
  });
  it("re-keys only a retelling that matched the words it was made from", () => {
    const s = retoldStory();
    (s.bookDesign as { retold: Record<string, { h: string; body: string }> }).retold.m1.h = "stale";
    const set = typeset(s);
    const retold = (set.bookDesign as { retold: Record<string, { h: string }> }).retold;
    expect(retold.m1.h).toBe("stale");
    expect(set.memories[0].body).toBe("We didn’t have much, but we had each other.");
  });
  it("sets a body paragraph by paragraph, so a dash rule never joins two lines", () => {
    const s = retoldStory();
    s.memories[0].body = "First line\n-- second line";
    const set = typeset(s);
    expect(set.memories[0].body.split("\n")).toHaveLength(2);
  });
});

describe("Print at home follows the book's design", () => {
  function designed() {
    const s = newStory({ id: "s1", name: "Nora", lastName: "Whitfield", relationship: "Grandmother", birthYear: "1941" });
    s.memories = [
      newMemory({ id: "m1", title: "One bicycle", era: "Childhood", period: "1949", body: "We had one bicycle between the four of us.", createdAt: "2026-09-01T10:00:00.000Z" }),
      newMemory({ id: "m2", title: "The dance hall", era: "Love & family", period: "1962", body: "He asked me three times.", createdAt: "2026-09-02T10:00:00.000Z" }),
      newMemory({
        id: "11111111-2222-3333-4444-555555555555",
        title: "The garden",
        era: "Love & family",
        period: "1970",
        body: "The roses came every June.",
        audio: [{ id: 1, bucket: "memory-audio", path: "a/b.m4a", speaker: "narrator", duration: 130, transcript: "" }],
        createdAt: "2026-09-03T10:00:00.000Z",
      }),
    ];
    s.bookDesign = {
      cover: { style: "cloth", title: "Nora's kitchen", subtitle: "Stories from Leeds" },
      paper: "antique",
      dedication: "For the grandchildren",
      chapterOrder: ["Love & family", "Childhood"],
      excluded: ["m2"],
      listenKey: "abcdefghijklmnop",
    };
    return s;
  }

  it("leaves out a held-back memory and keeps the title, dedication and chapter order", async () => {
    const html = await printableHtml(designed());
    expect(html).not.toContain("The dance hall");
    expect(html).toContain("One bicycle");
    expect(html).toContain("Nora’s kitchen");
    expect(html).toContain("Stories from Leeds");
    expect(html).toContain("For the grandchildren");
    expect(html).toContain("cover-cloth");
    expect(html.indexOf("The garden")).toBeLessThan(html.indexOf("One bicycle"));
  });
  it("points a listening code at astoryapp.com/l, never at a functions URL", async () => {
    codes.length = 0;
    const html = await printableHtml(designed());
    expect(codes.filter((c) => /^https:\/\/astoryapp\.com\/l\?m=[A-Za-z0-9_-]{22}&k=abcdefghijklmnop$/.test(c))).toHaveLength(1);
    expect(codes.every((c) => !c.includes("functions/v1"))).toBe(true);
    expect(html).not.toContain("functions/v1");
  });
  it("prints the family's sides the design lets in", async () => {
    const side = { id: "c1", kind: "testimonial", contributorName: "Linh", relationship: "Daughter", title: "", body: "It was blue, and it squeaked.", photos: [], memoryId: "m1", contributorEmail: "", personId: null, personIds: null, via: null, status: "approved", createdAt: "2026-09-05T10:00:00.000Z" };
    expect(await printableHtml(designed(), { sides: [side] })).toContain("It was blue, and it squeaked.");
    const s = designed();
    s.bookDesign = { ...(s.bookDesign as object), sidesOut: ["c1"] };
    expect(await printableHtml(s, { sides: [side] })).not.toContain("It was blue, and it squeaked.");
  });
});
