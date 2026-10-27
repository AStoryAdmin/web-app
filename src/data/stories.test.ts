import { describe, expect, it } from "vitest";
import { rowToMemory } from "./stories";
import { answeredBy, isAnswered } from "../app-core/lib/dailyQuestion.js";

const base = { id: "m1", title: "A title", body: "x", created_at: "2026-10-01T00:00:00Z" };

describe("rowToMemory", () => {
  it("reads question_text as the question and the prompt the decks read", () => {
    const m = rowToMemory({ ...base, question_text: "Where did you grow up?" });
    expect(m.questionText).toBe("Where did you grow up?");
    expect(m.prompt).toBe("Where did you grow up?");
    expect(isAnswered({ id: "q", question: "Where did you grow up?" }, answeredBy([m]))).toBe(true);
  });

  it("leaves an old memory without a question", () => {
    const m = rowToMemory(base);
    expect(m).not.toHaveProperty("questionText");
    expect(m).not.toHaveProperty("prompt");
  });

  it("reads how it came, who wrote it down, who asked and its language, as the phone does", () => {
    const m = rowToMemory({
      ...base,
      via: "recorded",
      written_down_by_name: "Jamie",
      written_down_by: "u1",
      asked_by_name: "Sam",
      words_pending: true,
      language: "vi",
      contributor: "Jamie, her granddaughter",
      author_person_id: "p1",
    });
    expect(m).toMatchObject({ via: "recorded", writtenDownBy: "Jamie", writtenDownById: "u1", writtenDownByPersonId: null, askedBy: "Sam", wordsPending: true, language: "vi", contributor: "Jamie, her granddaughter", authorPersonId: "p1" });
  });

  it("drops a language tag the database would refuse", () => {
    expect(rowToMemory({ ...base, language: "not a tag!" })).not.toHaveProperty("language");
  });
});
