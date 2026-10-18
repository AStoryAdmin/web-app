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

describe("a long spoken paragraph", () => {
  it("is broken before the sentence that would carry it past the target", () => {
    const t =
      "You met me during the business take last year. It was different though. I was doing a PhD back then, but halfway in I realized I want to do a bit on the business side because I do consulting on the side projects and I get hooked to it. So I want to help growing ventures because I get to work with startups. If you heard of Miley Consulting, it’s like a lifetime opportunity. Currently I’m on a project with a professor from MSU who’s trying to commercialize his products and I want to help ventures growing that business. So that’s why I want to give a quick pause to determine my main interest in this before determining to pursue higher study.";
    const out = readableParagraphs([t]);
    expect(out.length).toBeGreaterThan(1);
    for (const p of out) expect(p.length).toBeLessThan(560);
  });
});
