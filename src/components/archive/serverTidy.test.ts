import { describe, expect, it } from "vitest";
import { keepsTheirWords, mayApplyTidy } from "./serverTidy";

describe("the server's tidy is checked before it is shown", () => {
  it("accepts full stops and capitals", () => {
    expect(keepsTheirWords("i taught teenagers and then i moved to seattle", "I taught teenagers. And then I moved to Seattle.")).toBe(true);
  });
  it("refuses a rewrite", () => {
    expect(keepsTheirWords("i taught teenagers and then i moved to seattle", "After years of teaching young people, I relocated to Seattle.")).toBe(false);
  });
});

describe("a tidy that arrives late never reflows words being read", () => {
  it("counts words in view as being read, scrolled or not", () => {
    expect(mayApplyTidy(525, 768, 1500)).toBe(false);
  });
  it("applies while the words are below the fold, or within the first 600ms", () => {
    expect(mayApplyTidy(900, 768, 5000)).toBe(true);
    expect(mayApplyTidy(525, 768, 400)).toBe(true);
  });
});
