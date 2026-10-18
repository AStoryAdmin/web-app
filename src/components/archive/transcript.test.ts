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
    expect(ownWords("We live in a small city\nIt's in Vietnam")).toBe("We live in a small city · It's in Vietnam");
    expect(ownWords("You: How to end the chat AI: If you'd like to end the chat, you can simply stop replying, yeah, you know.")).toBe("How to end the chat.");
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
    expect(keptLine("My mother was like a lighthouse for all of us, and we loved her for it.")).toBe("My mother was like a lighthouse for all of us, and we loved her for it.");
  });
});

describe("round four of the transcript rules", () => {
  it("punctuates a run-on by sense, drops filler like and a false start across a joining word", async () => {
    const { cleanSpeech } = await import("./transcript");
    const out = cleanSpeech(
      "I started my career as a middle school teacher so I taught like teenagers which is a five and then my so my mom did that and my dad was an entrepreneur and so I learned from him and he is just very connected",
    );
    expect(out).not.toMatch(/\blike\b/);
    expect(out).toContain("my mom did that");
    expect(out.split(". ").length).toBeGreaterThan(1);
    expect(out.endsWith("connected.")).toBe(true);
  });
  it("drops a reaction and keeps a short question in the teller's words", async () => {
    const { cleanTranscript, ASKED } = await import("./transcript");
    const out = cleanTranscript(["I was working a corporate job. Wait, were you? So I left."]);
    expect(out.join(" ")).not.toContain("Wait");
    expect(out.some((p) => p.startsWith(ASKED))).toBe(false);
  });
  it("lets a feeling carry an It's opener", async () => {
    const { keptLine } = await import("./transcript");
    expect(keptLine("My co-founder has never jumped full time to another company. It's been challenging, but I think it's why we have the opportunity to get it.")).toBe(
      "It's been challenging, but I think it's why we have the opportunity to get it.",
    );
  });
});

describe("a card's words", () => {
  it("are whole: the first typed lines, or a short kept sentence", async () => {
    const { takeaway: cardLine } = await import("./transcript");
    expect(cardLine("We live in a small city\nIt's in Vietnam\nMom was a teacher, dad an engineer and I stay with grandmas")).toBe("We live in a small city · It's in Vietnam");
    expect(cardLine("He was like a really good fan of the team and he cheered every single week.")).not.toContain("like a really");
  });
});

describe("round five of the transcript rules", () => {
  it("keeps a sentence said twice once, and drops a restarted clause", async () => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech("I was working a corporate job, the eSports job. I was working a corporate job. So I left.")).toBe("I was working a corporate job, the eSports job. So I left.");
    expect(cleanSpeech("That's how we got, that's how we built the company.")).toBe("That's how we built the company.");
  });
  it("drops a start abandoned before so I", async () => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech("My dad so I started my career as a middle school teacher.")).toBe("I started my career as a middle school teacher.");
  });
  it("never credits the asker's words to the teller after a lifted question", async () => {
    const { cleanTranscript, ASKED } = await import("./transcript");
    const out = cleanTranscript([
      "I won the challenge. Do they open to non-students as well? Because our strategy right now is we're going to find a student in schools around here. For sure. They do open it to everyone.",
    ]);
    const asked = out.find((p) => p.startsWith(ASKED)) || "";
    expect(asked).toContain("Because our strategy right now");
    expect(out.filter((p) => !p.startsWith(ASKED)).join(" ")).not.toContain("our strategy");
  });
  it("opens the words on the teller, not on a reply to an unseen question", async () => {
    const { cleanTranscript } = await import("./transcript");
    expect(cleanTranscript(["No, I just lost my grandparents last year and it was really hard on all of us."])[0]).toMatch(/^I just lost/);
  });
  it("gives every memory a whole takeaway, without its throat-clearing", async () => {
    const { takeaway } = await import("./transcript");
    expect(takeaway("I mean, that was awesome and we did all these cool things together that year.")).toBe("That was awesome and we did all these cool things together that year.");
    expect(takeaway("And that's always been the dream because I love teaching kids every single day.")).toMatch(/^That's always/);
  });
});

describe("tidying never changes what was meant (rule 29)", () => {
  it("keeps a doubling that says something", async () => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech("More and more people came, again and again, over and over.")).toBe("More and more people came, again and again, over and over.");
    expect(cleanSpeech("It was very, very hard and he had had enough.")).toBe("It was very, very hard and he had had enough.");
  });
  it("keeps 'faster and faster' in the real call", async () => {
    const { cleanTranscript } = await import("./transcript");
    const { FASTER } = await import("./__fixtures__/calls");
    expect(cleanTranscript([FASTER]).join(" ")).toContain("faster and faster");
  });
  it("still drops a little word restarted across a filler", async () => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech("And then my so my mom worked at the plant.")).toBe("And then my mom worked at the plant.");
  });
  it("never cuts a 'not only … but' thought into a fragment", async () => {
    const { cleanTranscript } = await import("./transcript");
    const { GRANDPARENTS } = await import("./__fixtures__/calls");
    const out = cleanTranscript([GRANDPARENTS]).join(" ");
    expect(out).toMatch(/not only are you caring for them,? but then you're also/);
    expect(out).not.toMatch(/caring for them\. But/);
  });
});

describe("the takeaway from the real calls", () => {
  it("takes the line a reader should remember over a plain fact that points back", async () => {
    const { takeaway } = await import("./transcript");
    const { PITCH } = await import("./__fixtures__/calls");
    expect(takeaway(PITCH)).toBe("You always have to just look for every opportunity.");
  });
  it("lets a sentence end on a preposition by grammar", async () => {
    const { takeaway } = await import("./transcript");
    expect(takeaway("The first time I won, I've won every pitch competition I've been in. So that paid for an engineer.")).toBe("The first time I won, I've won every pitch competition I've been in.");
  });
  it("never opens the fallback on a word that points back", async () => {
    const { takeaway } = await import("./transcript");
    expect(takeaway("So that paid for an engineer that got all of the licenses for our games. I went to New York City and spoke at the UN.")).toBe("I went to New York City and spoke at the UN.");
  });
  it("joins typed lines so the dot never starts a line", async () => {
    const { takeaway, ownWords } = await import("./transcript");
    expect(takeaway("We live in a small city\nIt's in Vietnam\nMom was a teacher")).toBe("We live in a small city · It's in Vietnam");
    expect(ownWords("We live in a small city\nIt's in Vietnam")).toBe("We live in a small city · It's in Vietnam");
  });
});

describe("finding the takeaway in the words", () => {
  it("finds it ignoring case and punctuation, and marks from where it starts", async () => {
    const { findTakeaway } = await import("./transcript");
    const p = "I mean, that was awesome. So that paid for an engineer, that got the licenses. I went to New York City.";
    const at = findTakeaway(p, "That paid for an engineer that got the licenses.");
    expect(at).not.toBeNull();
    expect(p.slice(at![0], at![1])).toBe("that paid for an engineer, that got the licenses.");
    expect(findTakeaway(p, "Something never said.")).toBeNull();
  });
  it("knows when the words open on it", async () => {
    const { opensOn } = await import("./transcript");
    expect(opensOn("I just lost my grandparents this year. And I was very close to them.", "I just lost my grandparents this year.")).toBe(true);
    expect(opensOn("We live in a small city\nIt’s in Vietnam\nMom was a teacher", "We live in a small city · It’s in Vietnam")).toBe(true);
    expect(opensOn("I was close to them. I just lost my grandparents this year.", "I just lost my grandparents this year.")).toBe(false);
  });
});
