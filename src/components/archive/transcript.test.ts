import { describe, expect, it } from "vitest";
import { cleanSpeech, cleanTranscript, soundsSpoken } from "./transcript";

describe("the clean transcript", () => {
  it("drops filler sounds and a slip word said twice, nothing else (closed list)", () => {
    // a doubled phrase is not on the closed list: "so I, so I" stays; "I I" is a slip word said twice
    expect(cleanSpeech("So I, so I took home um $50,000 and uh that lasted us for a year.")).toBe("So I, so I took home $50,000 and that lasted us for a year.");
    expect(cleanSpeech("I I went to New York City.")).toBe("I went to New York City.");
  });

  it("drops the other person's reactions from the set, and keeps every other line (closed list, e)", () => {
    expect(cleanSpeech("Thank you, dad. Yeah, right? So you have to think so.")).toBe("Thank you, dad. So you have to think so.");
    expect(cleanSpeech("Mm-hmm. For sure. We moved in 1975.")).toBe("Mm-hmm. For sure. We moved in 1975.");
  });

  it("keeps only the teller's turns when the words are labelled", () => {
    expect(cleanSpeech("You: How do I end the chat? AI: You can simply stop replying.")).toBe("How do I end the chat?");
  });

  it("leaves a paragraph of only back-channel out", () => {
    // "Yeah, right." (not the reaction "Yeah, right?") opens the teller's words: its first word goes (a), the rest stays
    expect(cleanTranscript(["Yeah, right.", "We lived by the river."])).toEqual(["Right.", "We lived by the river."]);
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
  it("drops the throat-clearing before the teller's first words, and a closing but yeah (closed list, a)", async () => {
    const { cleanSpeech } = await import("./transcript");
    // only the very first word, and only before a comma, a pronoun, "the" or a filler sound
    expect(cleanSpeech("Yeah well so my dad was an entrepreneur.", { opening: true })).toBe("Yeah well so my dad was an entrepreneur.");
    expect(cleanSpeech("Yeah, so my dad was an entrepreneur.", { opening: true })).toBe("So my dad was an entrepreneur.");
    expect(cleanSpeech("Yeah well so my dad was an entrepreneur.")).toBe("Yeah well so my dad was an entrepreneur.");
    expect(cleanSpeech("So that doesn't count what my parents did, but yeah.")).toBe("So that doesn't count what my parents did.");
    expect(cleanSpeech("They won everything. Wow, that's amazing. So I'm like that too.")).toBe("They won everything. So I'm like that too.");
  });
  it("keeps a question in the teller's words, with its answer, unless the asker plainly goes on (closed list)", async () => {
    const { cleanTranscript } = await import("./transcript");
    expect(cleanTranscript(["I won the challenge. Do they open to non-students as well? Yeah, definitely. They do."])).toEqual(["I won the challenge. Do they open to non-students as well? Yeah, definitely. They do."]);
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
  it("punctuates a run-on by sense, and keeps every word not on the closed list", async () => {
    const { cleanSpeech } = await import("./transcript");
    const out = cleanSpeech(
      "I started my career as a middle school teacher so I taught like teenagers which is a five and then my so my mom did that and my dad was an entrepreneur and so I learned from him and he is just very connected",
    );
    expect(out).toContain("taught like teenagers");
    expect(out).toContain("my so my mom did that");
    expect(out.split(". ").length).toBeGreaterThan(1);
    expect(out.endsWith("connected.")).toBe(true);
  });
  it("drops a reaction and keeps a short question in the teller's words", async () => {
    const { cleanTranscript, ASKED } = await import("./transcript");
    const out = cleanTranscript(["I was working a corporate job. Wait, were you? So I left."]);
    expect(out.join(" ")).not.toContain("Wait");
    expect(out.some((p) => p.startsWith(ASKED))).toBe(false);
  });
  it("never keeps a line that opens on a word pointing back, even with a feeling (round 8)", async () => {
    const { keptLine } = await import("./transcript");
    expect(keptLine("My co-founder has never jumped full time to another company. It's been challenging, but I think it's why we have the opportunity to get it.")).not.toMatch(/^It's/);
  });
});

describe("a card's words", () => {
  it("are whole: the first typed lines, or a short kept sentence", async () => {
    const { takeaway: cardLine } = await import("./transcript");
    expect(cardLine("We live in a small city\nIt's in Vietnam\nMom was a teacher, dad an engineer and I stay with grandmas")).toBe("We live in a small city · It's in Vietnam");
    // the comparing "like a …" is the speaker's (17a): a card that quotes this line keeps it
    const line = cardLine("He was like a really good fan of the team and he cheered every single week.");
    if (line.includes("good fan")) expect(line).toContain("like a really");
  });
});

describe("round five of the transcript rules", () => {
  it("keeps a sentence said twice, and keeps a clause that is not a true prefix (closed list)", async () => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech("I was working a corporate job, the eSports job. I was working a corporate job. So I left.")).toBe("I was working a corporate job, the eSports job. I was working a corporate job. So I left.");
    expect(cleanSpeech("That's how we got, that's how we built the company.")).toBe("That's how we got, that's how we built the company.");
    expect(cleanSpeech("We went to, we went to the market.")).toBe("We went to the market.");
  });
  it("keeps a start abandoned before 'so I': only filler sounds and exact repeats go (the ruling)", async () => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech("My dad so I started my career as a middle school teacher.")).toBe("My dad so I started my career as a middle school teacher.");
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
  it("keeps a reply that opens the words: an answer stays (closed list)", async () => {
    const { cleanTranscript } = await import("./transcript");
    expect(cleanTranscript(["No, I just lost my grandparents last year and it was really hard on all of us."])[0]).toMatch(/^No, I just lost/);
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
  it("drops a little word restarted across a filler sound, never across a word (the ruling)", async () => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech("And then my uh my mom worked at the plant.")).toBe("And then my mom worked at the plant.");
    expect(cleanSpeech("And then my so my mom worked at the plant.")).toBe("And then my so my mom worked at the plant.");
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
    expect(opensOn("I was close to them. I just lost my grandparents this year.", "I just lost my grandparents this year.")).toBe(true);
    const far = "We lived by the river for years. My father fished every morning before work. My mother sold the fish at the market by the old bridge in town. Everyone knew her stall. Then the floods came and the market closed. I just lost my grandparents this year.";
    expect(opensOn(far, "I just lost my grandparents this year.")).toBe(false);
  });
});

describe("round 7: tidying keeps what was meant", () => {
  it("keeps 'like' before a number, an amount or a negation", async () => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech("She took home like hundreds of thousands of dollars.")).toContain("like hundreds");
    expect(cleanSpeech("She was like ten years old.")).toContain("like ten");
    expect(cleanSpeech("We had like a thousand dollars.")).toContain("like a thousand");
    expect(cleanSpeech("It cost like 300 dollars.")).toContain("like 300");
    expect(cleanSpeech("It cost like nothing back then.")).toContain("like nothing");
    expect(cleanSpeech("Investing in Michigan is like not non-existent.")).toContain("is like not non-existent");
    // not on the closed list: it stays
    expect(cleanSpeech("I taught like teenagers in the city.")).toBe("I taught like teenagers in the city.");
    // on it: before an intensifier, set off by commas
    expect(cleanSpeech("It was hard, and like really hard.")).toBe("It was hard, and really hard.");
    expect(cleanSpeech("It was like really hard.")).toBe("It was like really hard.");
  });
  it("keeps 'like' before an amount in the real call", async () => {
    const { cleanTranscript } = await import("./transcript");
    const { PITCH } = await import("./__fixtures__/calls");
    expect(cleanTranscript(PITCH.split(/\n\s*\n/)).join(" ")).toContain("like hundreds of thousands");
  });
  it("never collapses a repeat across 'and'", async () => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech("We went faster and faster and then we stopped.")).toBe("We went faster and faster and then we stopped.");
    expect(cleanSpeech("We tried again and again and finally it worked.")).toBe("We tried again and again and finally it worked.");
    expect(cleanSpeech("More and more and more people came.")).toBe("More and more and more people came.");
    expect(cleanSpeech("It got worse and worse and then she left.")).toBe("It got worse and worse and then she left.");
    // a slip word said twice goes; a phrase said twice stays (closed list)
    expect(cleanSpeech("I, I went home and he was, he was tired.")).toBe("I went home and he was, he was tired.");
  });
  it("never cuts a 'not just … but also' thought", async () => {
    const { cleanSpeech } = await import("./transcript");
    const said =
      "My grandmother raised all of us in that house and it was not just about cooking and cleaning for her but also about teaching us how to read and write when nobody else would.";
    const out = cleanSpeech(said);
    expect(out).not.toMatch(/for her\. But also/);
    expect(out).toContain("for her but also about teaching");
  });
  it("keeps the teller's short answer after a 'We asked' line", async () => {
    const { cleanTranscript, ASKED } = await import("./transcript");
    const { PITCH } = await import("./__fixtures__/calls");
    const out = cleanTranscript(PITCH.split(/\n\s*\n/));
    const q = out.findIndex((p) => p.startsWith(ASKED));
    expect(q).toBeGreaterThan(-1);
    expect(out[q + 1]).toMatch(/^For sure\. Yeah, definitely\. That's what my friend Zanna/);
  });
});

describe("round 7: the takeaway of 0ced", () => {
  it("is the line about the teller's own grandparents, not the product", async () => {
    const { takeaway } = await import("./transcript");
    const { FASTER } = await import("./__fixtures__/calls");
    expect(takeaway(FASTER)).toMatch(/very tight bondings with my grandparents/);
  });
});

/**
 * Round 8: the founder's ruling on rule 29. The cleaner removes only filler sounds, exact adjacent repeats (a stutter,
 * any length, to one; a doubling that means something is kept whole) and a clause that is a true prefix of the next
 * or breaks off on a little word. Every example from the round-7 reviews, with what the page shows.
 */
export const RULING_FIXTURES: [string, string][] = [
  // baos 1: clauses that open like the next one are said, and stay
  ["We laughed, we cried, we sang all night", "We laughed, we cried, we sang all night."],
  ["We had nothing, we had each other", "We had nothing, we had each other."],
  ["I thought, I would never see her again", "I thought, I would never see her again."],
  ["My mom cooked, my dad cleaned", "My mom cooked, my dad cleaned."],
  ["The war came, the house was gone", "The war came, the house was gone."],
  ["He loved her, he really did", "He loved her, he really did."],
  ["I hoped, I prayed, I waited", "I hoped, I prayed, I waited."],
  ["I was scared, I was alone", "I was scared, I was alone."],
  // baos 2: the quoting and the feeling "like" stay; ", like," goes with both commas
  ["And she was like, you have to go home now", "And she was like, you have to go home now."],
  ["He's like, why would you do that", "He's like, why would you do that."],
  ["So we were like, we need to raise money", "So we were like, we need to raise money."],
  ["I was like oh my god", "I was like oh my god."],
  ["I felt like, I was alone", "I felt like, I was alone."],
  ["It was, like, the hardest thing I ever did", "It was the hardest thing I ever did."],
  // baos 10: stutters collapse to one, a run of three too; a doubling that means something stays whole
  ["And then and then our engineers from El Salvador", "And then and then our engineers from El Salvador."],
  ["We we we moved to Saigon", "We moved to Saigon."],
  ["no, no, no, you can't go", "No, no, no, you can't go."],
  // skills 2: a stammered conjunction collapses, and nothing before it is lost
  // round 11: "and", "but" said twice go only when the first copy opens the clause; "then" is not on the list
  ["I went to the store and, and I bought bread.", "I went to the store and, and I bought bread."],
  ["We were poor but, but we were happy together.", "We were poor but, but we were happy together."],
  ["Then then we moved to Saigon", "Then then we moved to Saigon."],
  // still kept, from earlier rounds
  ["It got worse and worse and then she left.", "It got worse and worse and then she left."],
  ["We tried again and again and finally it worked.", "We tried again and again and finally it worked."],
];

describe("round 8: the ruling on tidying, every reviewer example", () => {
  it.each(RULING_FIXTURES)("%s", async (said, shown) => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech(said)).toBe(shown);
  });
});

describe("round 8: the takeaway", () => {
  it("is never a line that points back ('That's always been the dream…')", async () => {
    const { takeaway } = await import("./transcript");
    const said = "I specifically PhD of finance. And that's always been the dream because I love teaching. I love to become a professor one day. That was the original goal.";
    expect(takeaway(said)).not.toMatch(/^That's always/);
  });
  it("is a short typed memory with no full stop, whole", async () => {
    const { takeaway } = await import("./transcript");
    expect(takeaway("Poker night at 2315")).toBe("Poker night at 2315");
    expect(takeaway("Dad taught me to fish")).toBe("Dad taught me to fish");
    expect(takeaway("We moved to Saigon in 1975")).toBe("We moved to Saigon in 1975");
  });
  it("opens the words when it is in their first two sentences (4592's opening)", async () => {
    const { opensOn } = await import("./transcript");
    expect(opensOn("I specifically PhD of finance. And that's always been the dream because I love teaching. I love to become a professor one day.", "That's always been the dream because I love teaching.")).toBe(true);
  });
});

/**
 * Round 9: rule 17a as reworded. A broken-off clause goes only when the speaker restarts it in their own next words;
 * never a clause that ends on a little word, a refrain, a question the teller asks themselves, a word doubled for
 * emphasis, a comparing "like", a hedge before an amount, or an answer. Every example from the round-8 reviews.
 */
export const RULE_17A_SPEECH: [string, string][] = [
  // baos 1: the comparing "like a …" stays, whatever follows the article
  ["He was like a really good fan", "He was like a really good fan."],
  ["Our neighbor was like a very close aunt to me", "Our neighbor was like a very close aunt to me."],
  ["She was like a little sister to me", "She was like a little sister to me."],
  ["He was like a really big brother to us", "He was like a really big brother to us."],
  ["She was like a really good mother to me", "She was like a really good mother to me."],
  ["He was like a kind of father to me", "He was like a kind of father to me."],
  // baos 2: a clause that ends on "to" is whole by ellipsis
  ["I wanted to, but I couldn't", "I wanted to, but I couldn't."],
  ["She never got to, she died before the war ended", "She never got to, she died before the war ended."],
  ["We had nowhere to go to, no family, no money", "We had nowhere to go to, no family, no money."],
  ["I tried to, I really did", "I tried to, I really did."],
  ["I always wanted to, and then I finally did", "I always wanted to, and then I finally did."],
  ["We wanted to, we just couldn't", "We wanted to, we just couldn't."],
  // baos 4: a hedge before an amount
  ["It took like around fifty days", "It took like around fifty days."],
  ["It was like over a hundred people", "It was like over a hundred people."],
  ["We went like once a week", "We went like once a week."],
  ["We were like halfway there", "We were like halfway there."],
  // baos 5: a doubling at the start of a clause is emphasis
  ["Never, never again", "Never, never again."],
  ["Very, very hard times", "Very, very hard times."],
  ["Long, long ago there was a village", "Long, long ago there was a village."],
  ["No, no you can't", "No, no you can't."],
  ["So, so good", "So, so good."],
  ["Yes, yes I remember", "Yes, yes I remember."],
  // skills 2: a clause ending on a little word, a refrain, emphasis on any word
  ["We gave the flowers to, the old lady next door.", "We gave the flowers to, the old lady next door."],
  ["We were happy. We had a garden and a dog. We were happy.", "We were happy. We had a garden and a dog. We were happy."],
  ["I loved her more than anything in the world. I loved her.", "I loved her more than anything in the world. I loved her."],
  ["We had a big, big house", "We had a big, big house."],
  ["Run, run, run!", "Run, run, run!"],
  ["Very, very, very good.", "Very, very, very good."],
  ["a long, long, long road", "A long, long, long road."],
  // still tidied: the true restart, the slip, the exact repeat
  ["So we did like a, we built an app", "We built an app."],
  ["I, I went home", "I went home."],
  ["I was working a corporate job, the eSports job. I was working a corporate job. So I left.", "I was working a corporate job, the eSports job. I was working a corporate job. So I left."],
];

/** Round 9: answers and the teller's own questions, through the whole transcript. */
export const RULE_17A_TRANSCRIPT: [string, string][] = [
  // baos 3: an answer to a short question stays
  ["Were you happy there? Yes. We were.", "Were you happy there? Yes. We were."],
  ["Did she cry? Yeah. A lot.", "Did she cry? Yeah. A lot."],
  ["Did you love him? Yeah, of course. He was my whole life.", "Did you love him? Yeah, of course. He was my whole life."],
  ["Were you scared? Yes. Very scared, we had nothing.", "Were you scared? Yes. Very scared, we had nothing."],
  // skills 2: the teller's own question, a long "Oh" question, an answer after "?"
  ["Why did I leave Vietnam that year? Because my father was sick.", "Why did I leave Vietnam that year? Because my father was sick."],
  ["Oh, how could I ever forget that day? It was the day my son was born.", "Oh, how could I ever forget that day? It was the day my son was born."],
  ["Was it hard? Yes. It was very hard.", "Was it hard? Yes. It was very hard."],
];

describe("round 9: rule 17a, every reviewer example", () => {
  it.each(RULE_17A_SPEECH)("%s", async (said, shown) => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech(said)).toBe(shown);
  });
  it.each(RULE_17A_TRANSCRIPT)("%s", async (said, shown) => {
    const { cleanTranscript } = await import("./transcript");
    expect(cleanTranscript([said]).join(" ")).toBe(shown);
  });
});

/**
 * Round 10: the closed list (rule 17a, lead ruling of 2026-10-18, round 10). Every example from the round-9 reviews,
 * with what the closed list leaves: everything that is not (a) to (e) stays, word for word.
 */
export const CLOSED_LIST_SPEECH: [string, string][] = [
  // baos 2 / skills 1: the comparing and hedging "like" stays
  ["We were like brothers.", "We were like brothers."],
  ["We were like strangers after that.", "We were like strangers after that."],
  ["It was like magic.", "It was like magic."],
  ["It was like yesterday.", "It was like yesterday."],
  ["I remember it like yesterday.", "I remember it like yesterday."],
  ["We lived like kings.", "We lived like kings."],
  ["They treated us like animals.", "They treated us like animals."],
  ["The kitchen smelled like jasmine.", "The kitchen smelled like jasmine."],
  ["It tasted like candy.", "It tasted like candy."],
  ["She cooked like nobody else.", "She cooked like nobody else."],
  ["Cities like Saigon were full.", "Cities like Saigon were full."],
  ["They were like family to me, like brothers.", "They were like family to me, like brothers."],
  ["Our village was like paradise", "Our village was like paradise."],
  ["It was like heaven", "It was like heaven."],
  ["It was like war", "It was like war."],
  ["They were like children", "They were like children."],
  ["We were like ghosts", "We were like ghosts."],
  ["He was like Superman", "He was like Superman."],
  ["It smelled like jasmine", "It smelled like jasmine."],
  ["We fought like cats and dogs", "We fought like cats and dogs."],
  ["We stayed like for a year", "We stayed like for a year."],
  ["We walked like for hours", "We walked like for hours."],
  ["I was like in my twenties", "I was like in my twenties."],
  ["He came home like at six", "He came home like at six."],
  ["We left like in 1975", "We left like in 1975."],
  ["We waited like until midnight", "We waited like until midnight."],
  ["It happened like right after the war", "It happened like right after the war."],
  // baos 3: the quoting "like" stays
  ["I'm like, why would you do that?", "I'm like, why would you do that?"],
  ["We're like, let's go home.", "We're like, let's go home."],
  ["My mom was just like, go home.", "My mom was just like, go home."],
  ["He was all like, whatever.", "He was all like, whatever."],
  ["I was kind of like, okay.", "I was kind of like, okay."],
  // baos 5 / skills 2: doubles and refrains stay, unless a slip word
  ["We had a big big house.", "We had a big big house."],
  ["It was a tiny tiny room.", "It was a tiny tiny room."],
  ["She was a sweet sweet girl.", "She was a sweet sweet girl."],
  ["It was hot hot hot.", "It was hot hot hot."],
  ["Never again. Never again.", "Never again. Never again."],
  ["No. No. No.", "No. No. No."],
  ["I loved her. I loved her.", "I loved her. I loved her."],
  ["Thank you, thank you.", "Thank you, thank you."],
  ["Every day, every day she called.", "Every day, every day she called."],
  ["I miss her. I miss her.", "I miss her. I miss her."],
  ["I'm sorry. I'm sorry.", "I'm sorry. I'm sorry."],
  ["We were happy. We were happy.", "We were happy. We were happy."],
  ["I love you, I love you", "I love you, I love you."],
  ["So, so, so happy", "So, so, so happy."],
  ["Okay, okay, I'll go", "Okay, okay, I'll go."],
  // live 342e: a slip word said twice goes (c)
  ["So that's, that's kind of why we chose to do that.", "So that's kind of why we chose to do that."],
  // baos 6: a hedge before a time stays
  ["We came here like in 1980.", "We came here like in 1980."],
  ["It took like forever.", "It took like forever."],
  ["It was like ages ago.", "It was like ages ago."],
  // on the list, and removed
  ["It was, like, the hardest thing I ever did", "It was the hardest thing I ever did."],
  ["It was hard, and like really hard", "It was hard, and really hard."],
  ["And like worked a corporate job", "And like worked a corporate job."],
  ["We um went to the uh market", "We went to the market."],
  ["We we we moved to Saigon", "We moved to Saigon."],
  ["So we did like a, we built an app", "We built an app."],
  ["They won everything. Wow, that's amazing. She took home a lot.", "They won everything. She took home a lot."],
];

export const CLOSED_LIST_TRANSCRIPT: [string[], string[]][] = [
  // baos 1: an answer that opens on "Because", "We were", "Our" is the teller's
  [["We lived by the river. Why did your family leave Hanoi in 1954? Because the soldiers came for my father."], ["We lived by the river. Why did your family leave Hanoi in 1954? Because the soldiers came for my father."]],
  [["What did your parents do for a living? We were rice farmers, all of us."], ["What did your parents do for a living? We were rice farmers, all of us."]],
  [["What happened to the house after the war? Our cousins took it, and we never got it back."], ["What happened to the house after the war? Our cousins took it, and we never got it back."]],
  [
    ["Yeah so um we lived by the river. Why did your family leave Hanoi in 1954? Because the soldiers came for my father and we had one night to go. Yeah. I mean, I remember the boat."],
    ["Yeah so we lived by the river. Why did your family leave Hanoi in 1954? Because the soldiers came for my father and we had one night to go. Yeah. I mean, I remember the boat."],
  ],
  // baos 4: the teller's own questions stay in their words
  [["My father left us. What would become of us now? Nobody knew."], ["My father left us. What would become of us now? Nobody knew."]],
  [["Who would take care of our children? My sister did."], ["Who would take care of our children? My sister did."]],
  [["She died young. Why does God take the good ones? I still ask that."], ["She died young. Why does God take the good ones? I still ask that."]],
  [["How do you forget something like that? You don't. You carry it."], ["How do you forget something like that? You don't. You carry it."]],
  [["The war came. What could anyone do about it? Nothing. We waited."], ["The war came. What could anyone do about it? Nothing. We waited."]],
  // skills 4: an answer across a paragraph break
  [["Were you scared there?", "Yes. We had nothing."], ["Were you scared there?", "Yes. We had nothing."]],
];

describe("round 10: the closed list, every reviewer example", () => {
  it.each(CLOSED_LIST_SPEECH)("%s", async (said, shown) => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech(said)).toBe(shown);
  });
  it.each(CLOSED_LIST_TRANSCRIPT)("%s", async (said, shown) => {
    const { cleanTranscript } = await import("./transcript");
    expect(cleanTranscript(said)).toEqual(shown);
  });
  it("sets 'We asked' in the 5963 shape only: the asker goes on, the teller answers with a back-channel", async () => {
    const { cleanTranscript, ASKED } = await import("./transcript");
    const { PITCH } = await import("./__fixtures__/calls");
    const out = cleanTranscript(PITCH.split(/\n\s*\n/));
    expect(out.filter((p) => p.startsWith(ASKED))).toEqual([
      `${ASKED}Do they open to non-students as well? Because our strategy right now is we're going to find a student in schools around this area to partner with them with the competition and get some money.`,
    ]);
  });
});

/**
 * Round 10, (a) extended: a "yeah," or "so yeah," opening a later sentence that is not answering a question goes, and
 * so does a closing ", but yeah" or ", yeah". An answer keeps its "yeah".
 */
export const LATER_YEAH_SPEECH: [string, string][] = [
  // the four live cases (5963, f6a7)
  ["It's a global thing. Yeah, gaming and mental health, right?", "It's a global thing. Gaming and mental health, right?"],
  ["I've taken just under $300,000. So that doesn't count what my parents did, but yeah.", "I've taken just under $300,000. So that doesn't count what my parents did."],
  ["We built the company. Yeah, it was different though.", "We built the company. It was different though."],
  ["It's a big firm. So yeah, if you heard of Miley Consulting, it's like a lifetime opportunity.", "It's a big firm. If you heard of Miley Consulting, it's like a lifetime opportunity."],
  // a closing ", yeah"
  ["We moved to Seattle that winter, yeah.", "We moved to Seattle that winter."],
  // an answer keeps its yeah
  ["Did you go? Yeah, I went.", "Did you go? Yeah, I went."],
  ["Did you love her? Yeah, yeah.", "Did you love her? Yeah, yeah."],
];

describe("round 10: a later yeah, and a closing but yeah (closed list, a)", () => {
  it.each(LATER_YEAH_SPEECH)("%s", async (said, shown) => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech(said)).toBe(shown);
  });
});

/**
 * Round 11: the closed list as narrowed (rule 17a). Every string from the round-10 reports, with what the list leaves.
 */
export const R11_SPEECH: [string, string][] = [
  // baos 1 / skills 1: the verb "like" never goes
  ["I'd like just one more day with him.", "I'd like just one more day with him."],
  ["I would like very much to go back to Hue someday.", "I would like very much to go back to Hue someday."],
  ["I like really spicy food.", "I like really spicy food."],
  ["Mom didn't like oily food.", "Mom didn't like oily food."],
  ["I like fried rice.", "I like fried rice."],
  ["We like fried rice and fish sauce.", "We like fried rice and fish sauce."],
  ["I like used books.", "I like used books."],
  ["I like cut flowers.", "I like cut flowers."],
  ["They like boiled eggs.", "They like boiled eggs."],
  ["I like red roses.", "I like red roses."],
  ["I like red cars.", "I like red cars."],
  ["You like Fred, don't you?", "You like Fred, don't you?"],
  ["We like grilled fish on Sundays.", "We like grilled fish on Sundays."],
  ["I like boiled eggs.", "I like boiled eggs."],
  // baos 2: the comparing and feeling "like"
  ["It feels like just yesterday we came to America.", "It feels like just yesterday we came to America."],
  ["He looked like just another kid.", "He looked like just another kid."],
  ["It looked like really bad weather.", "It looked like really bad weather."],
  ["My grandmother had friends like Beverly and Holly.", "My grandmother had friends like Beverly and Holly."],
  ["Places like Sicily were far away.", "Places like Sicily were far away."],
  // baos 4 / skills 4: filler sounds are lower-case words of their own
  ["They rushed him to the ER.", "They rushed him to the ER."],
  ["Grandpa was a doctor in the ER.", "Grandpa was a doctor in the ER."],
  ["I went to UM for college.", "I went to UM for college."],
  ["We shot it on 8 mm film.", "We shot it on 8 mm film."],
  ["We were, uh, poor.", "We were poor."],
  ["She was a nurse in the ER for thirty years.", "She was a nurse in the ER for thirty years."],
  ["He studied at UM.", "He studied at UM."],
  // baos 5 / skills 2: a double that is grammar, or does not open its clause, stays
  ["I told her her father was gone.", "I told her her father was gone."],
  ["I gave her her first doll.", "I gave her her first doll."],
  ["What it was was a miracle.", "What it was was a miracle."],
  ["I'll never forget it, it was the best day.", "I'll never forget it, it was the best day."],
  ["That was it, it was over.", "That was it, it was over."],
  ["I love you, you know.", "I love you, you know."],
  ["Thank you, you saved us.", "Thank you, you saved us."],
  ["Then I saw her, her face was white.", "Then I saw her, her face was white."],
  ["I gave her her book.", "I gave her her book."],
  ["What it is is a gift.", "What it is is a gift."],
  // baos 7: "an A" is a grade, not a broken-off article
  ["I got an A, I was so proud.", "I got an A, I was so proud."],
  ["My mom got a B, she cried.", "My mom got a B, she cried."],
  // skills, for the lead: (b) only after and / but / so or a comma; (e) the fixed set only
  ["We like very simple things.", "We like very simple things."],
  ["Do it like so.", "Do it like so."],
  ["We were poor. Really. We had nothing.", "We were poor. Really. We had nothing."],
  ["It was hard. Definitely. But we made it.", "It was hard. Definitely. But we made it."],
  ["She was gone. Of course.", "She was gone. Of course."],
  ["My father came home. Right.", "My father came home. Right."],
  ["Wow. I couldn't believe it.", "I couldn't believe it."],
  ["Okay. That's the story.", "Okay. That's the story."],
  ["We were happy, yeah?", "We were happy, yeah?"],
  // on the list
  ["It was hard, and like really hard.", "It was hard, and really hard."],
  ["It was, like, really hard.", "It was really hard."],
  ["The the house was gone.", "The house was gone."],
  ["I, I went home.", "I went home."],
  ["So that's, that's kind of why we chose to do that.", "So that's kind of why we chose to do that."],
  ["Wait, were you? Yeah. So I left.", "So I left."],
];

/** Round 11: the opening word (a), only as the teller's very first word and only before a comma, pronoun, "the" or filler. */
export const R11_OPENING: [string, string][] = [
  ["So many years have passed since we left Hue.", "So many years have passed since we left Hue."],
  ["So many people died.", "So many people died."],
  ["Well water was all we had.", "Well water was all we had."],
  ["So many people died in the war.", "So many people died in the war."],
  ["Well water was all we had in the village.", "Well water was all we had in the village."],
  ["Yeah, so my dad was an entrepreneur.", "So my dad was an entrepreneur."],
  ["So I started my career as a teacher.", "I started my career as a teacher."],
  ["Well, the house was gone.", "The house was gone."],
];

/** Round 11: transcripts, "We asked" and the answers. */
export const R11_TRANSCRIPT: [string[], string[]][] = [
  // baos 3: a question holding the first person is the teller's own, never lifted
  [
    ["Yeah so we lived by the river in Hanoi. Why did we leave Hanoi? Because our father said the soldiers were coming for him. Yeah. We had one night to pack everything we owned."],
    ["Yeah so we lived by the river in Hanoi. Why did we leave Hanoi? Because our father said the soldiers were coming for him. Yeah. We had one night to pack everything we owned."],
  ],
  [["Why did my parents come here? Because our village was burned. Yeah. Nothing was left."], ["Why did my parents come here? Because our village was burned. Yeah. Nothing was left."]],
  // skills 5: the answer to the opening question keeps its "Yeah."
  [["Interviewer: Did you go to school there? Me: Yeah. I went for two years."], ["⁣Did you go to school there?", "Yeah. I went for two years."]],
  // skills 6: a prompt and a remark from the other person are set as "We asked"
  [
    ["Interviewer: That must have been so hard for your family. Tell me about your mother. Me: She was strong, yeah."],
    ["⁣That must have been so hard for your family. Tell me about your mother.", "She was strong, yeah."],
  ],
  // the other person's reactions from the set go, in named turns too
  [["Interviewer: Wow. What happened next? Me: We left that night."], ["⁣What happened next?", "We left that night."]],
];

describe("round 11: the closed list as narrowed, every reviewer example", () => {
  it.each(R11_SPEECH)("%s", async (said, shown) => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech(said)).toBe(shown);
  });
  it.each(R11_OPENING)("%s (the teller's first words)", async (said, shown) => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech(said, { opening: true })).toBe(shown);
  });
  it.each(R11_TRANSCRIPT)("%s", async (said, shown) => {
    const { cleanTranscript } = await import("./transcript");
    expect(cleanTranscript(said)).toEqual(shown);
  });
  it("the kept line drops one opening joint word (So, And, But, I mean) and nothing else", async () => {
    const { takeaway } = await import("./transcript");
    expect(takeaway("I mean, I loved this country more than anything in the world, always.")).toMatch(/^I loved this country/);
    expect(takeaway("And I will always remember the smell of my mother's kitchen in Hue.")).toMatch(/^I will always remember/);
    expect(takeaway("You know, I always wished my father could have seen this house.")).toMatch(/^You know, I always wished/);
    expect(takeaway("Like, I always loved the river behind our house in the summer.")).toMatch(/^Like, I always loved/);
  });
});

/* ───────── The contract: each cut the tidy makes must satisfy its own rule, item by item ───────── */

type Cut = [number, number, string];
const FILLER_W = "um|uh|er|erm|hmm|mm";
const PRONOUN_W = "i|you|he|she|we|they|it|me|him|her|us|them|my|our|your|his|their";
const CONTRACTION_W = "that['’]s|it['’]s|i['’]m|we['’]re|they['’]re|he['’]s|she['’]s|there['’]s|i['’]ve|we['’]ve|i['’]d|you['’]re|i['’]ll|we['’]ll";
const REACTIONS = /^(?:wow|wow, that['’]s amazing|that['’]s (?:amazing|awesome|great|cool)|wait, were you\?|really\?|yeah, right\?)[.!]*$/i;

/** The sentence of `said` that holds position `at`, and the one before it. */
function sentenceAround(said: string, at: number): { start: number; end: number; prev: string } {
  const spans: [number, number][] = [];
  for (const m of said.matchAll(/[^.!?…]+(?:[.!?…]+["”’)]*|$)/g)) {
    const lead = m[0].length - m[0].trimStart().length;
    spans.push([(m.index ?? 0) + lead, (m.index ?? 0) + m[0].trimEnd().length]);
  }
  const i = spans.findIndex(([a, b]) => at >= a && at < Math.max(b, a + 1));
  const [start, end] = spans[Math.max(0, i)] || [0, said.length];
  const prev = i > 0 ? said.slice(spans[i - 1][0], spans[i - 1][1]) : "";
  return { start, end, prev };
}

/** Why a cut breaks its rule, or "" when it keeps to it. Written from the list, not from the code. */
function breaksRule(said: string, [a, b, rule]: Cut, ctx: { opening: boolean; answer: boolean; cuts: Cut[] }): string {
  const text = said.slice(a, b);
  const before = said.slice(0, a);
  const after = said.slice(b);
  const { start, prev } = sentenceAround(said, a);
  const prevIsQuestion = /\?["”’)]*$/.test(prev.trim()) || (start === sentenceAround(said, 0).start && ctx.answer);
  switch (rule) {
    case "a-filler": {
      const m = text.match(new RegExp(`^(,\\s*)?(${FILLER_W})(,)?$`));
      if (!m) return `not a lower-case filler sound: "${text}"`;
      // the sound itself stands alone: nothing of a word touches it on either side (a comma before it may go with it)
      const wordBefore = said.slice(0, a + (m[1]?.length ?? 0));
      if (/[\p{L}\p{N}'’-]$/u.test(wordBefore) || /^[\p{L}\p{N}'’-]/u.test(after)) return `inside a word: "${text}"`;
      if (m[2] === "mm" && /\d\s*$/.test(before)) return "mm after a number";
      return "";
    }
    case "a-opening": {
      if (!ctx.opening || said.slice(0, a).trim() !== "") return "not the teller's very first word";
      if (!/^(yeah|well|okay|so),?\s*$/i.test(text)) return `not yeah/well/okay/so: "${text}"`;
      const word = text.match(/^\w+/)![0];
      if (!new RegExp(`^${word}(?:,|\\s+(?:${PRONOUN_W}|the|${FILLER_W})\\b)`, "i").test(said.slice(a))) return "no comma, pronoun, the or filler after it";
      return "";
    }
    case "a-later": {
      if (a !== start) return "not at a sentence start";
      if (!/^(so\s+)?yeah,\s*$/i.test(text)) return `not "yeah," or "so yeah,": "${text}"`;
      if (prevIsQuestion) return "answers a question";
      return "";
    }
    case "a-closing": {
      if (!/^,\s*(but\s+)?yeah$/i.test(text)) return `not ", (but) yeah": "${text}"`;
      if (!/^[.!…]*["”’)]*(\s|$)/.test(after)) return "not closing a statement";
      return "";
    }
    case "b-like": {
      if (/^,\s*like,$/i.test(text)) return "";
      if (!/^like\s*$/i.test(text)) return `not "like": "${text}"`;
      if (!/^\s*(?:really|so|very|just|literally|actually|basically)\b/i.test(after)) return "no intensifier after it";
      if (!/(?:\b(?:and|but|so)\s+|,\s*)$/i.test(before)) return "the word before is not and/but/so or a comma";
      return "";
    }
    case "c-slip": {
      const w = text.match(/^[\p{L}'’]+/u)?.[0] || "";
      const isArticle = /^(?:a|an|the)$/i.test(w);
      if (!isArticle && !new RegExp(`^(?:${PRONOUN_W}|and|but|so|${CONTRACTION_W})$`, "i").test(w)) return `not a slip word: "${w}"`;
      if (!new RegExp(`^(?:${w.replace(/['’]/g, "['’]")}(?:,?\\s+(?:(?:${FILLER_W}),?\\s+)?))+$`, "i").test(text)) return `not the word said again: "${text}"`;
      if (!after.toLowerCase().replace(/’/g, "'").startsWith(w.toLowerCase().replace(/’/g, "'"))) return "the next word is not the same";
      if (!isArticle && !/(?:^["“‘(]?|[,;:]\s*|\b(?:and|but|so|then|because)\s+)$/i.test(said.slice(start, a))) return "its first copy does not open the clause";
      return "";
    }
    case "d-restart": {
      const clause = text.replace(/,\s*$/, "");
      if (!/,\s*$/.test(text)) return "not a whole clause";
      const next = after.split(/,\s+|[.!?…]/)[0];
      const n = (x: string) => x.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").trim();
      const prefix = n(clause).includes(" ") && n(next).startsWith(`${n(clause)} `);
      const article = /\b(?:a|an|the|my|our|their|your)$/.test(clause.trim()) && clause.trim().split(/\s+/).length <= 6;
      const subject = (x: string) => n(x).replace(/^(?:so|and|but|then)\s+/, "").split(" ")[0];
      if (prefix) return "";
      if (!article) return `does not break off: "${clause}"`;
      if (/^(?:but|and|so)\b/i.test(next.trim())) return "the next clause goes on from it";
      if (subject(clause) !== subject(next)) return "the next clause does not restart it";
      return "";
    }
    case "e-reaction": {
      const bare = text.replace(/["“”]/g, "").trim();
      if (a !== start) return "not a whole sentence";
      if (REACTIONS.test(bare)) return "";
      if (/^yeah[.!]*$/i.test(bare) && ctx.cuts.some((c) => c[2] === "e-reaction" && c[1] <= a && REACTIONS.test(said.slice(c[0], c[1]).replace(/["“”]/g, "").trim()))) return "";
      return `not a reaction from the set: "${bare}"`;
    }
    default:
      return `unknown rule ${rule}`;
  }
}

/** The words the tidy kept must be exactly the words outside its cuts, in order: nothing else removed or changed. */
function onlyCutsRemoved(said: string, out: string, cuts: Cut[]): boolean {
  const words = (s: string) => (s.toLowerCase().replace(/’/g, "'").match(/[\p{L}\p{N}'-]+/gu) || []).join(" ");
  let rest = "";
  let pos = 0;
  for (const [a, b] of [...cuts].sort((x, y) => x[0] - y[0])) {
    if (b <= pos) continue;
    rest += said.slice(pos, Math.max(pos, a)) + " ";
    pos = Math.max(pos, b);
  }
  rest += said.slice(pos);
  return words(rest) === words(out);
}

/** Each list word in the contexts that must keep it (generated), for the contract and for crossing with the fixtures. */
function keepCorpus(): string[] {
  const out: string[] = [];
  const intens = ["really", "so", "very", "just", "literally", "actually", "basically"];
  for (const subj of ["I", "We", "They", "You", "She", "He", "Mom"]) for (const i of intens) out.push(`${subj} like ${i} good food.`);
  for (const verb of ["feels", "looks", "seems", "sounds", "is", "was", "would", "'d", "didn't", "felt", "looked"]) for (const i of intens) out.push(`It ${verb} like ${i} yesterday.`);
  for (const adj of ["fried", "used", "cut", "red", "boiled", "grilled", "oily"]) out.push(`We like ${adj} things.`);
  for (const p of PRONOUN_W.split("|")) out.push(`We remember ${p}, ${p} was there.`, `I gave ${p} ${p} book.`);
  for (const f of ["ER", "UM", "Er", "Hmm-hmm", "mm-hmm", "8 mm", "her", "umbrella", "uhuru"]) out.push(`They took it to the ${f} that day.`);
  for (const w of ["So many", "Well water", "Okay then", "Yeah well so", "So much", "Well done"]) out.push(`${w} was all we knew.`);
  for (const r of ["Really.", "Definitely.", "Of course.", "Right.", "Okay.", "Yes.", "Sure."]) out.push(`We were poor. ${r} We had nothing.`);
  for (const g of ["an A", "a B", "Plan A", "the end", "my dad"]) out.push(`I got ${g}, then we went home.`);
  out.push("I wanted to, but I couldn't.", "Every day, every day she called.", "We laughed, we cried, we sang.", "We were happy, yeah?", "Did you go? Yeah, I went.", "Did you love her? Yeah, yeah.");
  return out;
}

describe("round 11: the contract, every cut checked against its rule", () => {
  const SPEECH: string[] = [];
  it("holds for every fixture, the generated corpus and their crossings", async () => {
    const { cleanSpeech } = await import("./transcript");
    const fixtures = [...R11_SPEECH, ...CLOSED_LIST_SPEECH, ...RULE_17A_SPEECH, ...RULING_FIXTURES, ...LATER_YEAH_SPEECH].map(([s]) => s);
    const corpus = keepCorpus();
    SPEECH.push(...fixtures, ...corpus);
    const failures: string[] = [];
    const check = (said: string, opening = false) => {
      const { said: base, out, cuts } = cleanSpeech(said, { opening, explain: true });
      for (const cut of cuts) {
        const why = breaksRule(base, cut, { opening, answer: false, cuts });
        if (why) failures.push(`${said} :: ${cut[2]} "${base.slice(cut[0], cut[1])}" :: ${why}`);
      }
      if (!onlyCutsRemoved(base, out, cuts)) failures.push(`${said} :: words changed outside the cuts: "${out}"`);
    };
    for (const s of SPEECH) check(s);
    for (const [s] of R11_OPENING) check(s, true);
    // every keep context must come out with all its words, and unchanged after any fixture
    for (const k of corpus) {
      const alone = cleanSpeech(k);
      if (alone.replace(/[.!?]$/, "").toLowerCase() !== k.replace(/[.!?]$/, "").toLowerCase()) failures.push(`kept context changed: "${k}" → "${alone}"`);
    }
    for (const [said, shown] of [...R11_SPEECH, ...CLOSED_LIST_SPEECH].filter(([s]) => !/\?\s*$/.test(s))) {
      // a fixture said without a closing stop ends where the next sentence starts
      const whole = /[.!?…]["”’)]*$/.test(said.trim()) ? said : `${said}.`;
      for (const k of corpus) {
        const crossed = cleanSpeech(`${whole} ${k}`);
        if (crossed !== `${shown} ${cleanSpeech(k)}`) failures.push(`crossed: "${whole}" + "${k}" → "${crossed}"`);
      }
    }
    expect(failures).toEqual([]);
  });
  it("holds on the real calls, piece by piece, and sets 'We asked' only in the 5963 shape", async () => {
    const { explainTranscript } = await import("./transcript");
    const { PITCH, GRANDPARENTS, FASTER } = await import("./__fixtures__/calls");
    const failures: string[] = [];
    for (const call of [PITCH, GRANDPARENTS, FASTER]) {
      let first = true;
      let afterQuestion = false;
      for (const piece of explainTranscript(call.split(/\n\s*\n/))) {
        if (piece.asked) {
          if (!/^Do they open to non-students as well\? Because our strategy/.test(piece.said)) failures.push(`lifted outside the 5963 shape: ${piece.said}`);
          afterQuestion = true;
          first = false;
          continue;
        }
        for (const cut of piece.cuts) {
          const why = breaksRule(piece.said, cut as Cut, { opening: first, answer: afterQuestion, cuts: piece.cuts as Cut[] });
          if (why) failures.push(`${cut[2]} "${piece.said.slice(cut[0], cut[1])}" :: ${why}`);
        }
        if (!onlyCutsRemoved(piece.said, piece.out, piece.cuts as Cut[])) failures.push(`words changed outside the cuts in: ${piece.said.slice(0, 60)}`);
        first = false;
        afterQuestion = /\?["”’)]*$/.test(piece.said.trim());
      }
    }
    expect(failures).toEqual([]);
  });
});
