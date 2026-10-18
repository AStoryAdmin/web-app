import { describe, expect, it } from "vitest";
import { cleanSpeech, cleanTranscript, soundsSpoken } from "./transcript";

describe("the clean transcript", () => {
  it("drops fillers, stutters and false starts without rephrasing", () => {
    expect(cleanSpeech("So I, so I took home um $50,000 and uh that lasted us for a year.")).toBe("So I took home $50,000 and that lasted us for a year.");
    expect(cleanSpeech("I I went to New York City.")).toBe("I went to New York City.");
  });

  it("drops back-channel sentences and keeps the teller's", () => {
    expect(cleanSpeech("Thank you, dad. Yeah, right? So you have to think so.")).toBe("Thank you, dad. So you have to think so.");
    expect(cleanSpeech("Mm-hmm. For sure. We moved in 1975.")).toBe("We moved in 1975.");
  });

  it("keeps only the teller's turns when the words are labelled", () => {
    expect(cleanSpeech("You: How do I end the chat? AI: You can simply stop replying.")).toBe("How do I end the chat?");
  });

  it("leaves a paragraph of only back-channel out", () => {
    expect(cleanTranscript(["Yeah, right.", "We lived by the river."])).toEqual(["We lived by the river."]);
  });

  it("knows speech from typed prose", () => {
    expect(soundsSpoken("We live in a small city. It's in Vietnam. Mom was a teacher.")).toBe(false);
    expect(soundsSpoken("So yeah, I mean, it was, you know, the first time. Yeah, right? Um, so I went.")).toBe(true);
  });
});

describe("the kept line", () => {
  it("is one whole sentence of their own, verbatim", async () => {
    const { keptLine } = await import("./transcript");
    const text = "We live in a small city. My grandmother always kept the lamp on for us when we came home late from school. Yeah, right? Okay.";
    expect(keptLine(text)).toBe("My grandmother always kept the lamp on for us when we came home late from school.");
  });
  it("is empty when nothing fits", async () => {
    const { keptLine } = await import("./transcript");
    expect(keptLine("Short. Also short.")).toBe("");
  });
});

describe("round three of the transcript rules", () => {
  it("drops the throat-clearing at the start and a trailing but yeah", async () => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech("Yeah well so my dad was an entrepreneur.")).toBe("My dad was an entrepreneur.");
    expect(cleanSpeech("So that doesn't count what my parents did, but yeah.")).toBe("So that doesn't count what my parents did.");
    expect(cleanSpeech("They won everything. Wow, that's amazing. So I'm like that too.")).toBe("They won everything. So I'm like that too.");
  });
  it("lifts the other person's question onto its own line", async () => {
    const { cleanTranscript, ASKED } = await import("./transcript");
    expect(cleanTranscript(["I won the challenge. Do they open to non-students as well? Yeah, definitely. They do."])).toEqual(["I won the challenge.", `${ASKED}Do they open to non-students as well?`, "They do."]);
  });
  it("breaks a block with no full stop before a clause word", async () => {
    const { splitRunOn } = await import("./transcript");
    const block = Array.from({ length: 12 }, (_, i) => `we went to the city number ${i} and then we came home`).join(" ");
    const parts = splitRunOn(block, 200, true);
    expect(parts.length).toBeGreaterThan(2);
    for (const p of parts.slice(0, -1)) expect(p.endsWith(".")).toBe(true);
  });
  it("keeps typed line breaks apart in a card's words", async () => {
    const { ownWords } = await import("./transcript");
    expect(ownWords("We live in a small city\nIt's in Vietnam")).toBe("We live in a small city · It's in Vietnam");
    expect(ownWords("You: How to end the chat AI: If you'd like to end the chat, you can simply stop replying, yeah, you know.")).toBe("How to end the chat");
  });
  it("never keeps a weak line", async () => {
    const { keptLine } = await import("./transcript");
    expect(keptLine("So not today, but like, so I was working with this place called the centre. I wanted to help because my dad was trying to.")).toBe("");
    expect(keptLine("It was hard. I remember my grandmother kept the lamp on for us every single night we came home late.")).toBe("I remember my grandmother kept the lamp on for us every single night we came home late.");
  });
});

describe("a filler like", () => {
  it("never makes the kept line", async () => {
    const { keptLine } = await import("./transcript");
    expect(keptLine("She took home like hundreds of thousands of dollars in prize money that year.")).toBe("");
    expect(keptLine("My mother was like a lighthouse for all of us when we were small children.")).toBe("My mother was like a lighthouse for all of us when we were small children.");
  });
});
