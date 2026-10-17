import { describe, expect, it } from "vitest";
import { chunksOf } from "./readAloud";

describe("chunksOf", () => {
  it("keeps short paragraphs whole and remembers the paragraph", () => {
    const c = chunksOf(["One short line.", "Another one. With two sentences."]);
    expect(c.map((x) => x.text)).toEqual(["One short line.", "Another one. With two sentences."]);
    expect(c.map((x) => x.paragraph)).toEqual([0, 1]);
  });
  it("splits a long paragraph on sentences at about 220 characters", () => {
    const s = "The kitchen had a blue door and the radio was always on, and my mother sang along to everything, badly, which we loved more than anything. ";
    const c = chunksOf([s.repeat(4)]);
    expect(c.length).toBe(4);
    expect(c.every((x) => x.text.length <= 230 && x.paragraph === 0)).toBe(true);
    expect(c[0].words).toBe(26);
  });
  it("skips empty paragraphs", () => {
    expect(chunksOf(["", "   ", "Words."])).toHaveLength(1);
  });
});
