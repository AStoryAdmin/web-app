import { describe, expect, it } from "vitest";
import { keepsTheirWords } from "./serverTidy";

describe("the server's tidy is checked before it is shown", () => {
  it("accepts full stops and capitals", () => {
    expect(keepsTheirWords("i taught teenagers and then i moved to seattle", "I taught teenagers. And then I moved to Seattle.")).toBe(true);
  });
  it("refuses a rewrite", () => {
    expect(keepsTheirWords("i taught teenagers and then i moved to seattle", "After years of teaching young people, I relocated to Seattle.")).toBe(false);
  });
});
