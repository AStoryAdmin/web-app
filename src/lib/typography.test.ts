import { describe, expect, it } from "vitest";
import { smarten } from "./typography";

describe("smarten", () => {
  it("curls double quotes by their side", () => {
    expect(smarten('She said "come in" and we did.')).toBe("She said “come in” and we did.");
    expect(smarten('"Hello."')).toBe("“Hello.”");
  });
  it("keeps apostrophes closing and opens a quote at a word start", () => {
    expect(smarten("don't, Rose's, the '60s")).toBe("don’t, Rose’s, the ’60s");
    expect(smarten("she called it 'home'")).toBe("she called it ‘home’");
  });
  it("sets dashes and ellipses", () => {
    expect(smarten("then -- after a while -- we left...")).toBe("then – after a while – we left…");
    expect(smarten("Mother--she never said")).toBe("Mother—she never said");
  });
  it("leaves plain text and empty strings alone", () => {
    expect(smarten("")).toBe("");
    expect(smarten("A kitchen, a road.")).toBe("A kitchen, a road.");
  });
});
