import { describe, expect, it, vi } from "vitest";

// the print path signs photographs through the app's storage client; these stories have none
vi.mock("../../lib/photoUrls", () => ({ photoUrl: async (u: string) => u }));

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
    const html = await printableHtml(retoldStory(), "June");
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
