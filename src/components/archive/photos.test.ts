import { describe, expect, it } from "vitest";
import { readableParagraphs } from "./photos";

describe("readableParagraphs", () => {
  it("leaves short paragraphs alone", () => {
    expect(readableParagraphs(["One. Two."])).toEqual(["One. Two."]);
  });

  it("breaks a long transcript only where a sentence ends, keeping every word", () => {
    const sentence = "So I went to the city and I spoke there, which was something.";
    const block = Array.from({ length: 30 }, () => sentence).join(" ");
    const out = readableParagraphs([block]);
    expect(out.length).toBeGreaterThan(2);
    for (const p of out) expect(p.endsWith(".")).toBe(true);
    expect(out.join(" ").replace(/\s+/g, " ")).toBe(block.replace(/\s+/g, " "));
  });

  it("keeps a paragraph with line breaks as it was typed", () => {
    const poem = `${"A line of a poem that goes on. ".repeat(30)}\nand the next line`;
    expect(readableParagraphs([poem])).toEqual([poem]);
  });
});
