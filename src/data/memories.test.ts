import { describe, expect, it } from "vitest";
import { createMemory } from "./memories";
import { memoryToRow } from "../app-core/data/rows.js";

const jamie = { isStoryteller: false, name: "Jamie", personId: "p-jamie", storytellerName: "Rose" };
const rose = { isStoryteller: true, name: "Rose", personId: "p-rose", storytellerName: "Rose" };

describe("createMemory", () => {
  it("keeps the question it answers, in words and id, as the phone does", () => {
    const m = createMemory({ title: "The blue door", body: "We lived by the sea.", era: "Childhood", prompt: { id: "q-1", question: "Where  did you\ngrow up?" } });
    expect(m.questionText).toBe("Where did you grow up?");
    expect(m.prompt).toBe("Where did you grow up?");
    expect(m.questionId).toBe("q-1");
    const row = memoryToRow(m, "s1") as Record<string, unknown>;
    expect(row.question_text).toBe("Where did you grow up?");
    expect(row).not.toHaveProperty("question_id");
  });

  it("takes the question as plain words, or questionText and questionId", () => {
    expect(createMemory({ body: "x", prompt: "What was your first job?" }).questionText).toBe("What was your first job?");
    const m = createMemory({ body: "x", questionText: "Who taught you to cook?", questionId: "q-9" });
    expect([m.prompt, m.questionId]).toEqual(["Who taught you to cook?", "q-9"]);
  });

  it("has no question, and no id, when none was asked", () => {
    const m = createMemory({ body: "x", questionId: "q-1" });
    expect(m.questionText).toBeUndefined();
    expect(m.questionId).toBeUndefined();
    expect(memoryToRow(m, "s1")).not.toHaveProperty("question_text");
  });

  it("credits a relative, with their relationship, and never the storyteller", () => {
    const m = createMemory({ body: "x", teller: jamie, relation: "her granddaughter" });
    expect([m.contributor, m.authorPersonId]).toEqual(["Jamie, her granddaughter", "p-jamie"]);
    const row = memoryToRow(m, "s1") as Record<string, unknown>;
    expect([row.contributor, row.author_person_id]).toEqual(["Jamie, her granddaughter", "p-jamie"]);
    expect(createMemory({ body: "x", teller: rose }).contributor).toBe("");
    expect(createMemory({ body: "x", teller: jamie, storytellerHere: true }).contributor).toBe("");
  });

  it("lets an explicit credit win over the teller's", () => {
    expect(createMemory({ body: "x", teller: jamie, contributor: "Sam" }).contributor).toBe("Sam");
  });

  it("is the family's to read unless they chose only me", () => {
    expect(createMemory({ body: "x" }).privacy).toBe("shared");
    expect(createMemory({ body: "x", privacy: "private" }).privacy).toBe("private");
  });

  it("carries its voice, photos, how it came and its language into the row", () => {
    const clip = { id: "c1", bucket: "memory-audio", path: "s1/m1/voice.webm", speaker: "narrator", duration: 12, transcript: "Hello" };
    const m = createMemory({ body: "Hello", audio: [clip], photos: ["https://x/p.jpg"], via: "recorded", language: "vi_VN" });
    expect(m.audio).toEqual([clip]);
    expect(m.photos).toEqual(["https://x/p.jpg"]);
    const row = memoryToRow(m, "s1") as Record<string, unknown>;
    expect([row.via, row.language]).toEqual(["recorded", "vi-VN"]);
  });

  it("files it under a real chapter and gives it a card line", () => {
    const m = createMemory({ body: "So. We had one bicycle between four of us. It was never my turn.", era: "nonsense" });
    expect(m.era).toBe("Anything else");
    expect(m.excerpt.length).toBeGreaterThan(0);
    expect(m.excerpt.length).toBeLessThanOrEqual(141);
  });
});
