import { describe, expect, it } from "vitest";
import { aboutPrompt } from "./aboutPrompt";

describe("aboutPrompt", () => {
  it("resolves a bank id into its question about the person, by first name", () => {
    const p = aboutPrompt("roots-father-hands", "Mai");
    expect(p?.id).toBe("roots-father-hands");
    expect(p?.question).toBe("What kind of work did Mai's father do?");
    expect(p?.era).toBe("Where we come from");
  });
  it("says 'this person' when there is no first name", () => {
    expect(aboutPrompt("roots-father-hands", "")?.question).toBe("What kind of work did this person's father do?");
    expect(aboutPrompt("roots-father-hands", null)?.question).toBe("What kind of work did this person's father do?");
  });
  it("gives null for an unknown id, a missing id, or a question only the storyteller can answer", () => {
    expect(aboutPrompt("not-a-question", "Mai")).toBeNull();
    expect(aboutPrompt(null, "Mai")).toBeNull();
    expect(aboutPrompt("roots-mother-picture", "Mai")).toBeNull();
  });
});
