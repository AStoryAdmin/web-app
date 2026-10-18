import { describe, expect, it } from "vitest";
import { cleanSpeech, cleanTranscript, soundsSpoken } from "./transcript";

describe("the clean transcript", () => {
  it("drops filler sounds and a slip word said twice, nothing else (closed list)", () => {
    // a doubled phrase is not on the closed list: "so I, so I" stays; "I I" is a slip word said twice
    expect(cleanSpeech("So I, so I took home um $50,000 and uh that lasted us for a year.")).toBe("So I, so I took home $50,000 and that lasted us for a year.");
    expect(cleanSpeech("I I went to New York City.")).toBe("I I went to New York City.");
  });

  it("drops the other person's reactions from the set, and keeps every other line (closed list, e)", () => {
    expect(cleanSpeech("Thank you, dad. Yeah, right? So you have to think so.")).toBe("Thank you, dad. So you have to think so.");
    expect(cleanSpeech("Mm-hmm. For sure. We moved in 1975.")).toBe("Mm-hmm. For sure. We moved in 1975.");
  });

  it("keeps only the teller's turns when the words are labelled", () => {
    expect(cleanSpeech("You: How do I end the chat? AI: You can simply stop replying.")).toBe("How do I end the chat?");
  });

  it("leaves a paragraph of only back-channel out", () => {
    // "Yeah, right." (not the reaction "Yeah, right?") opening the teller's words stays whole (lead ruling, round 14)
    expect(cleanTranscript(["Yeah, right.", "We lived by the river."])).toEqual(["Yeah, right.", "We lived by the river."]);
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
    expect(cleanSpeech("So that doesn't count what my parents did, but yeah.")).toBe("So that doesn't count what my parents did, but yeah.");
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
    // the turns are labelled at the start and at a line break, as the live chat is ("You: …\nAI: …")
    expect(ownWords("You: How to end the chat\nAI: If you'd like to end the chat, you can simply stop replying, yeah, you know.")).toBe("How to end the chat.");
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
    expect(cleanSpeech("We went to, we went to the market.")).toBe("We went to, we went to the market.");
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
    expect(takeaway("I mean, that was awesome and we did all these cool things together that year.")).toBe("I mean, that was awesome and we did all these cool things together that year.");
    expect(takeaway("And that's always been the dream because I love teaching kids every single day.")).toMatch(/^And that's always/); // "And" stays: a pronoun or a comma does not follow it (17a)
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
    expect(cleanSpeech("And then my uh my mom worked at the plant.")).toBe("And then my my mom worked at the plant.");
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
    expect(p.slice(at![0], at![1])).toBe("So that paid for an engineer, that got the licenses.");
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
    expect(cleanSpeech("It was hard, and like really hard.")).toBe("It was hard, and like really hard.");
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
    // the answer runs on through its short replies, so "Yeah, definitely." still follows the question and keeps its "Yeah"
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
  ["It was, like, the hardest thing I ever did", "It was, like, the hardest thing I ever did."], // after "was": (b) keeps it
  // baos 10: stutters collapse to one, a run of three too; a doubling that means something stays whole
  ["And then and then our engineers from El Salvador", "And then and then our engineers from El Salvador."],
  ["We we we moved to Saigon", "We we we moved to Saigon."],
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
  ["So we did like a, we built an app", "So we did like a, we built an app."],
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
  ["So that's, that's kind of why we chose to do that.", "So that's, that's kind of why we chose to do that."],
  // baos 6: a hedge before a time stays
  ["We came here like in 1980.", "We came here like in 1980."],
  ["It took like forever.", "It took like forever."],
  ["It was like ages ago.", "It was like ages ago."],
  // on the list, and removed
  ["It was, like, the hardest thing I ever did", "It was, like, the hardest thing I ever did."],
  ["It was hard, and like really hard", "It was hard, and like really hard."],
  ["And like worked a corporate job", "And like worked a corporate job."],
  ["We um went to the uh market", "We went to the market."],
  ["We we we moved to Saigon", "We we we moved to Saigon."],
  ["So we did like a, we built an app", "So we did like a, we built an app."],
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
  ["I've taken just under $300,000. So that doesn't count what my parents did, but yeah.", "I've taken just under $300,000. So that doesn't count what my parents did, but yeah."],
  ["We built the company. Yeah, it was different though.", "We built the company. It was different though."],
  ["It's a big firm. So yeah, if you heard of Miley Consulting, it's like a lifetime opportunity.", "It's a big firm. If you heard of Miley Consulting, it's like a lifetime opportunity."],
  // a closing ", yeah"
  ["We moved to Seattle that winter, yeah.", "We moved to Seattle that winter, yeah."],
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
  ["We were, uh, poor.", "We were poor."], // between two commas both go, as no list goes on
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
  ["It was hard, and like really hard.", "It was hard, and like really hard."],
  ["It was, like, really hard.", "It was, like, really hard."],
  ["The the house was gone.", "The the house was gone."],
  ["I, I went home.", "I went home."],
  ["So that's, that's kind of why we chose to do that.", "So that's, that's kind of why we chose to do that."],
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
  ["So I started my career as a teacher.", "So I started my career as a teacher."],
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
    expect(takeaway("I mean, I loved this country more than anything in the world, always.")).toMatch(/^I mean, I loved this country/);
    expect(takeaway("And I will always remember the smell of my mother's kitchen in Hue.")).toMatch(/^I will always remember/);
    expect(takeaway("You know, I always wished my father could have seen this house.")).toMatch(/^You know, I always wished/);
    expect(takeaway("Like, I always loved the river behind our house in the summer.")).toMatch(/^Like, I always loved/);
  });
});

/* ───────── Round 12: the list in its final, small form, every reviewer string from round 11 ───────── */

/** Speech the final list leaves exactly as said (apart from a capital and a closing full stop). */
export const R12_KEEP: string[] = [
  // baos 2: broken-off clauses stay (d is gone)
  "I left and I took my, I took my sister.",
  "We met and we had our, we had a small wedding.",
  "I cried and I said a, I said a prayer.",
  "So we did like a, we built an app.",
  // baos 4 / skills, for the lead: the verb "like" after and / but stays (only ", like," goes)
  "My kids hate vegetables but like really spicy food.",
  "We never drank but like really strong coffee.",
  "I cook and like really spicy food.",
  // baos 5: a quoted ", yeah" stays (the closing yeah is gone)
  "My father asked my mother to marry him, and she said, yeah.",
  "We asked if we could stay. Dad said, yeah.",
  "And she asked if I would marry her, and I said, yeah.",
  // baos 6: "like so" stays
  "We came here with nothing, like so many others.",
  "We came by boat, like so many families did.",
  "And like so many Vietnamese families, we lost everything.",
  "You fold the dough, like so.",
  // baos 7 / skills 3: a capital A is a grade, "My, my" is an interjection
  "I got an A, a B and two Cs.",
  "We had a plan A, a plan B and a plan C.",
  "In school I got an A a lot.",
  "My, my, how times have changed.",
  "My, my, my, look at you.",
  "We had plan A, a backup plan and a prayer.",
  "She got an A, a real A.",
  // baos, smaller: "mm" is no longer a filler; ";" and ":" do not open a slip
  "It was eight mm film.",
  "We shot it on 8 mm film.",
  "I said: you, you are my son.",
  "I said; I, I was afraid.",
  // skills 1: the checker's coverage
  "We went to the theater.",
  "She sang an anthem.",
  "We were poor and yeah, we were happy.",
  "I think that's, that's why we left.",
  "That's great news for us.",
  "Wow, we were lucky.",
  // skills 5: after a tag question, "Yeah," answers it
  "It was good, right? Yeah, it was.",
  // skills 7: "Plan A:" is not a speaker label
  "Plan A: we go north. Plan B: we stay.",
  // stutters the list does not name
  "We we we moved to Saigon.",
  "I I went to New York City.",
  "The the house was gone.",
  "He was, he was a good man.",
  "And then and then we left.",
  "So that's, that's kind of why we chose to do that.",
  "Every day, every day she called.",
  // the teller's own one-word lines
  "We were poor. Really. We had nothing.",
  "It was hard. Definitely. But we made it.",
  "She was gone. Of course.",
  "Really? I didn't know that.",
  "That's great. That's cool.",
];

/** Speech the final list changes, and what it shows. */
export const R12_CUT: [string, string][] = [
  ["We were, uh, poor.", "We were poor."],
  ["We um went to the uh market.", "We went to the market."],
  ["Well, hmm, it was a long time ago.", "Well, it was a long time ago."], // between two commas one always stays (round 14 ruling)
  ["It was, like, the hardest thing I ever did.", "It was, like, the hardest thing I ever did."],
  ["I, I went home.", "I went home."],
  ["The, the house was gone.", "The house was gone."],
  ["We left, and, and then we came back.", "We left, and then we came back."],
  ["That's, that's kind of why we chose to do that.", "That's kind of why we chose to do that."],
  ["It was hard, I, I, I couldn't sleep.", "It was hard, I couldn't sleep."],
  ["They won everything. Wow, that's amazing. She took home a lot.", "They won everything. She took home a lot."],
  ["Wait, were you? Yeah. So I left.", "So I left."],
  ["Wow. That's awesome. Yeah. We moved.", "We moved."],
  ["Wow. We left that night. Yeah.", "We left that night. Yeah."],
  ["We moved. Yeah, it was hard.", "We moved. It was hard."],
  ["We moved. So yeah, it was hard.", "We moved. It was hard."],
];

/** The teller's first words (a): the opening word goes only before a comma. */
export const R12_OPENING: [string, string][] = [
  ["Yeah, so my dad was an entrepreneur.", "So my dad was an entrepreneur."],
  ["Well, the house was gone.", "The house was gone."],
  ["Okay, we lived in Hue.", "We lived in Hue."],
  ["So, we left.", "We left."],
  ["So I started my career as a teacher.", "So I started my career as a teacher."],
  ["So many people died.", "So many people died."],
  ["Well water was all we had.", "Well water was all we had."],
  ["Yeah well so my dad was an entrepreneur.", "Yeah well so my dad was an entrepreneur."],
];

/** Transcripts: "We asked" only with named speakers, or the 5963 shape with a reply exactly "For sure." or "Yes.". */
export const R12_TRANSCRIPT: [string[], string[]][] = [
  // baos 3 / skills 2: a reply that only starts with "Yes" or "For sure" is the teller's answer
  [
    ["We lived by the river in Hue. Why did Grandpa leave Hue? Because our village was burned. Yes, it was terrible. We had one night to pack."],
    ["We lived by the river in Hue. Why did Grandpa leave Hue? Because our village was burned. Yes, it was terrible. We had one night to pack."],
  ],
  [["What did they do in Saigon? Because our family had a shop there. Yes, my father sold rice, I think."], ["What did they do in Saigon? Because our family had a shop there. Yes, my father sold rice, I think."]],
  [["How did they meet? And our grandmother always said it was at the market. For sure it was the market."], ["How did they meet? And our grandmother always said it was at the market. For sure it was the market."]],
  [["Was it hard? Because our family had nothing. Yes, it was very hard for all of us."], ["Was it hard? Because our family had nothing. Yes, it was very hard for all of us."]],
  [["Did they let you stay? Because our visas ran out that spring. Yes, we stayed two more years."], ["Did they let you stay? Because our visas ran out that spring. Yes, we stayed two more years."]],
  // a first-person question with the exact reply is still the teller's own
  [["Why did we leave Hue? Because our village was burned. Yes. We had one night."], ["Why did we leave Hue? Because our village was burned. Yes. We had one night."]],
  // the 5963 shape lifts
  [
    ["I won the challenge. Do they open to non-students as well? Because our strategy is to find a student. For sure. We did that."],
    ["I won the challenge.", "⁣Do they open to non-students as well? Because our strategy is to find a student.", "For sure. We did that."],
  ],
  // skills 6: in a labelled transcript the teller's own "Wow." stays
  [["Interviewer: What happened? Me: Wow. It was a long time ago."], ["⁣What happened?", "Wow. It was a long time ago."]],
  // the other person's reaction from the set goes in their turn
  [["Interviewer: Wow. What happened next? Me: We left that night."], ["⁣What happened next?", "We left that night."]],
  // skills 7: "Plan A:" in the words is not a label
  [["Plan A: we go north. Plan B: we stay."], ["Plan A: we go north. Plan B: we stay."]],
];

describe("round 12: the final list, every reviewer string", () => {
  it.each(R12_KEEP)("keeps %s", async (said) => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech(said)).toBe(said);
  });
  it.each(R12_CUT)("%s", async (said, shown) => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech(said)).toBe(shown);
  });
  it.each(R12_OPENING)("%s (the teller's first words)", async (said, shown) => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech(said, { opening: true })).toBe(shown);
  });
  it.each(R12_TRANSCRIPT)("%s", async (said, shown) => {
    const { cleanTranscript } = await import("./transcript");
    expect(cleanTranscript(said)).toEqual(shown);
  });
  it("the kept line drops an opening So / And / But only before a comma or a pronoun (baos 1)", async () => {
    const { takeaway } = await import("./transcript");
    expect(takeaway("But for my mother, we would never have made it here.")).toMatch(/^But for my mother/);
    expect(takeaway("So many of us never saw our families again, and I think about it.")).toMatch(/^So many of us/);
    expect(takeaway("So much of what I know, I learned from her kitchen.")).toMatch(/^So much of what I know/);
    expect(takeaway("So long as we were together, we were happy, all of us.")).toMatch(/^So long as/);
    expect(takeaway("And I will always remember the smell of my mother's kitchen in Hue.")).toMatch(/^I will always remember/);
    expect(takeaway("I mean, I loved this country more than anything in the world, always.")).toMatch(/^I mean, I loved/);
  });
  it("the kept line drops an opening So / And / But before \"the\" too (17a, round 12)", async () => {
    const { takeaway } = await import("./transcript");
    // 4592's own line, from its words "So the best way to learn finance is to build a business."
    expect(takeaway("I specifically PhD of finance. So the best way to learn finance is to build a business. I love to become a professor one day.")).toBe("The best way to learn finance is to build a business.");
    // the counter-cases keep the word: "But for" and "So many" are not joints
    expect(takeaway("But for my mother, we would never have made it here.")).toMatch(/^But for my mother/);
    expect(takeaway("So many of us never saw our families again, and I think about it.")).toMatch(/^So many of us/);
  });
  it("a typed memory keeps its ', like,' in its takeaway (skills 8)", async () => {
    const { takeaway } = await import("./transcript");
    expect(takeaway("It was, like, so cold that winter in Hanoi.")).toBe("It was, like, so cold that winter in Hanoi.");
  });
});

/* ───────── The contract: each cut the tidy makes must satisfy its own rule, exactly as the list words it ───────── */

type Cut = [number, number, string];
const REACTION_SET = /^(?:wow|wow, that['’]s amazing|that['’]s amazing|that['’]s awesome|wait, were you\?|yeah, right\?)[.!]*$/i;

/** The sentences of `said`: [start, end] of each, trimmed. */
function sentenceSpans(said: string): [number, number][] {
  const spans: [number, number][] = [];
  for (const m of said.matchAll(/[^.!?…]+(?:[.!?…]+["”’)']*|$)/g)) {
    const lead = m[0].length - m[0].trimStart().length;
    const end = (m.index ?? 0) + m[0].trimEnd().length;
    if (end > (m.index ?? 0) + lead) spans.push([(m.index ?? 0) + lead, end]);
  }
  return spans;
}

/** Why a cut breaks the list's own words for its rule, or "" when it keeps to them. Written from 17a, not from the code. */
/**
 * 17a (e), written from its text: the quotation marks in a paragraph. “ ” " ‘ ’ « », and a straight ' that opens (after a
 * space, a comma, a colon or the start) or closes (after . ! ? or a comma); never an apostrophe inside a word, never an
 * inch mark after a digit. Returns the marks with whether each opens.
 */
function marksIn(paragraph: string): { opens: boolean; single: boolean }[] {
  const out: { opens: boolean; single: boolean }[] = [];
  const push = (opens: boolean, single: boolean) => out.push({ opens, single });
  const chars = [...paragraph];
  chars.forEach((c, i) => {
    const prev = chars[i - 1] ?? "";
    const next = chars[i + 1] ?? "";
    const word = /\p{L}/u.test(prev) && /\p{L}/u.test(next);
    const opensHere = prev === "" || /[\s([{“‘«—–-]/.test(prev);
    if ("“«".includes(c)) push(true, false);
    else if ("”»".includes(c)) push(false, false);
    else if (c === "‘" && !word) push(true, true);
    else if (c === "’" && !word && !(/\p{L}/u.test(prev) && /\s/.test(next))) push(opensHere, true);
    else if (c === '"' && !/\d/.test(prev)) push(opensHere && next !== "" && !/\s/.test(next), false);
    else if (c === "'") {
      if ((prev === "" || /[\s,:]/.test(prev)) && next !== "" && !/\s/.test(next)) push(true, true);
      else if (/[.!?,]/.test(prev)) push(false, true);
    }
  });
  return out;
}
/** 17a (e): the reactions may go from a paragraph only when it holds no mark and no earlier paragraph left one open. */
function reactionsMayGo(paragraph: string, before: string[]): string {
  if (marksIn(paragraph).length) return "a paragraph with a quotation mark";
  // a ’ only ever closes a ‘: the double and single marks are counted apart
  // walked in order, a close never below zero, so a stray close can't cancel a later open
  let double = 0;
  let single = 0;
  for (const p of before) {
    for (const m of marksIn(p)) {
      if (m.single) single = m.opens ? single + 1 : Math.max(0, single - 1);
      else double = m.opens ? double + 1 : Math.max(0, double - 1);
    }
  }
  return double > 0 || single > 0 ? "after a paragraph that leaves a quotation open" : "";
}

function breaksRule(said: string, [a, b, rule]: Cut, ctx: { opening: boolean; answer: boolean; named: boolean; cuts: Cut[]; paragraph?: string; prior?: string | string[] }): string {
  const text = said.slice(a, b);
  const before = said.slice(0, a);
  const after = said.slice(b);
  const spans = sentenceSpans(said);
  const si = spans.findIndex(([x, y]) => a >= x && a < Math.max(y, x + 1));
  const [start, end] = spans[si] ?? [0, said.length];
  const prev = si > 0 ? said.slice(spans[si - 1][0], spans[si - 1][1]) : "";
  switch (rule) {
    case "a-filler": {
      // um, uh, er, erm, hmm: lower case, a word of its own, with a comma that sets it off
      const m = text.match(/^(,\s*)?(um|uh|er|erm|hmm)(,)?$/);
      if (!m) return `not a lower-case filler sound: "${text}"`;
      const wordBefore = said.slice(0, a + (m[1]?.length ?? 0));
      if (/[\p{L}\p{N}'’-]$/u.test(wordBefore) || /^[\p{L}\p{N}'’-]/u.test(after)) return `inside a word: "${text}"`;
      // between two commas one comma always stays, unless the word before is a form of be or have: be, been, am, is, are,
      // was, were, have, has, had, or 's 'm 're 've 'd after a pronoun or what / who / where / how / there / here / that
      const beHave = /(?:\b(?:be|been|am|is|are|was|were|have|has|had)|\b(?:i|you|he|she|it|we|they|what|who|where|how|there|here|that)['’](?:s|m|re|ve|d))\s*$/i.test(said.slice(0, a + (m[1]?.length ?? 0)).replace(/,\s*$/, ""));
      if (m[1] && m[3] && !beHave) return "both commas taken: one always stays";
      if (m[3] && !m[1] && /,\s*$/.test(before) && beHave) return "a comma left after a form of be or have";
      return "";
    }
    case "a-opening": {
      // yeah, well, okay or so as the very first word of the teller's first paragraph, when a comma follows it
      if (!ctx.opening || a !== 0) return "not the very first word of the teller's first paragraph";
      if (!/^(yeah|well|okay|so),\s*$/i.test(text)) return `not yeah/well/okay/so with a comma: "${text}"`;
      // never before its own double ("So, so happy")
      if (new RegExp(`^${text.match(/^\w+/)![0]}\\b`, "i").test(after)) return "the word is said again: emphasis";
      if (/^right\b/i.test(after)) return `"Yeah, right" stays whole`;
      return "";
    }
    case "a-later": {
      // a sentence-opening "Yeah," or "So yeah," that does not follow a question
      if (a !== start) return "not at a sentence start";
      if (!/^(?:[Yy]eah|[Ss]o yeah),\s*$/.test(text)) return `not "Yeah," or "So yeah,": "${text}"`;
      if (/\?["”’)']*$/.test(prev) || (si === 0 && ctx.answer)) return "follows a question";
      if (/^right\b/i.test(after)) return `"Yeah, right" stays`;
      if (/^yeah\b/i.test(after)) return `"Yeah, yeah" stays`;
      return "";
    }
    case "b-like": {
      // "like" with a comma on both sides
      if (!/^,\s*like,$/.test(text)) return `not ", like,": "${text}"`;
      // after a form of be, go or say it quotes; before an amount it hedges: both stay
      if (/\b(?:am|is|are|was|were|be|been|being|['’]s|['’]m|['’]re|go|goes|went|going|gone|say|says|said|saying|think|thinks|thought|thinking)(?:,?\s+(?:all|just|kind of|sort of))?\s*$/i.test(before)) return "after be / go / say / think: it quotes";
      if (/\b(?:feel|feels|felt|feeling|look|looks|looked|looking|seem|seems|seemed|sound|sounds|sounded)\s*$/i.test(before)) return "after feel / look / seem / sound: it feels";
      // a thought being quoted: the words after it run to a ? or ! in the same sentence
      if (/^[^.!?…]*[?!]/.test(after)) return "before a quoted thought";
      // where it may hedge, decided by the next word alone: a number, a teen, an ordinal, or 17a's closed list
      const nextWord = (after.match(/^\s*([^\s,.;:!?…"“”‘’']+)/u)?.[1] ?? "").toLowerCase();
      const numberWords = "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred hundreds thousand thousands million millions dozen dozens".split(" ");
      const ordinals = "first second third fourth fifth sixth seventh eighth ninth tenth eleventh twelfth hundredth thousandth".split(" ");
      const closedList = "a an the this that these those last next every each all some any half whole few couple several most nothing none zero once twice forever always never about around almost nearly maybe over under at in on for since until till from by during tonight today yesterday tomorrow midnight noon midday dawn sunrise sunset".split(" ");
      if (/^[$£€¥]?\d/.test(nextWord) || numberWords.includes(nextWord) || ordinals.includes(nextWord) || /(?:teenth|tieth)$/.test(nextWord) || closedList.includes(nextWord)) return "before a word where it may hedge";
      return "";
    }
    case "c-slip": {
      // "I", "the", "and" or "that's" said twice with a comma between, the first copy opening the sentence or after a comma
      const m = text.match(/^(I|[Tt]he|[Aa]nd|[Tt]hat['’]s)(?:,\s*\1)*,\s*$/iu);
      if (m && !/^(?:I|[Tt]he|[Aa]nd|[Tt]hat['’]s)$/u.test(m[1])) return `"${m[1]}" is not the word as the list writes it`;
      if (!m) return `not I / the / and / that's said again with a comma: "${text}"`;
      if (!new RegExp(`^${m[1].replace(/['’]/g, "['’]")}(?![\\p{L}'’])`, "iu").test(after)) return "the next word is not the same word";
      if (!/(?:^["“‘(]?|,\s*)$/.test(said.slice(start, a))) return "its first copy neither opens the sentence nor follows a comma";
      return "";
    }
    case "e-reaction": {
      // a whole sentence from the fixed set, or a "Yeah." straight after one; never in the teller's own named turn
      if (ctx.named) return "the teller's own turn";
      if (a !== start || b !== end) return "not a whole sentence";
      // only in a paragraph with no quotation mark at all, and none after a paragraph that leaves its marks open
      const bare = text.trim();
      const prior = typeof ctx.prior === "string" ? [ctx.prior] : (ctx.prior ?? []);
      const why = reactionsMayGo(ctx.paragraph ?? said, prior);
      if (why) return why;
      if (REACTION_SET.test(bare)) return "";
      const prevSpan = spans[si - 1];
      const prevIsReaction = !!prevSpan && ctx.cuts.some((c) => c[2] === "e-reaction" && c[0] === prevSpan[0] && c[1] === prevSpan[1] && REACTION_SET.test(said.slice(c[0], c[1]).trim()));
      if (/^yeah[.!]*$/i.test(bare) && prevIsReaction) return "";
      return `not a reaction from the set: "${bare}"`;
    }
    default:
      return `not on the list: ${rule}`;
  }
}

/**
 * Why a kept line breaks 17a's kept-line rule, or "" when it keeps to it: the line is a sentence of the words as shown,
 * or that sentence less one opening "So", "And" or "But" that a comma, a pronoun or "the" follows. Written from 17a.
 */
function breaksKeptLine(words: string, line: string): string {
  if (!line) return "";
  const n = (x: string) => x.toLowerCase().replace(/[’]/g, "'").replace(/[^\p{L}\p{N}'\s]/gu, " ").replace(/\s+/g, " ").trim();
  const sentences = (words.match(/[^.!?…]+[.!?…]+["”’)']*/g) || [words]).map((x) => x.trim());
  for (const s of sentences) {
    if (n(s) === n(line)) return "";
    const joint = s.match(/^(so|and|but)(,\s*|\s+)(?=(i|you|he|she|we|they|it|the)\b|)/i);
    if (joint && (joint[2].includes(",") || joint[3]) && n(s.slice(joint[0].length)) === n(line)) return "";
  }
  return `not a sentence of the words, nor one less a joint word: "${line}"`;
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

/** Each word on the list in the contexts that must keep it (generated), for the contract and the crossings. */
function keepCorpus(): string[] {
  const out: string[] = [...R12_KEEP];
  for (const subj of ["I", "We", "They", "You", "She", "Mom"]) for (const i of ["really", "so", "very", "just", "literally"]) out.push(`${subj} like ${i} good food.`);
  for (const lead of ["and", "but", "so", "It was hard,"]) out.push(`${lead} like really hard.`, `${lead} like so many others.`);
  for (const f of ["ER", "UM", "Er", "Hmm", "mm", "8 mm", "her", "umbrella", "uhuru", "Erm"]) out.push(`They took it to the ${f} that day.`);
  for (const w of ["the", "and", "I", "that's", "a", "an", "my", "he", "we", "it"]) out.push(`We saw ${w} ${w} there.`, `We said; ${w}, ${w} was there.`, `We said: ${w}, ${w} was there.`);
  for (const w of ["The", "And", "That's", "A", "My", "He", "We"]) out.push(`${w} ${w.toLowerCase()} was there.`);
  for (const g of ["an A", "a B", "Plan A", "plan A"]) out.push(`I got ${g}, a prize and a cake.`);
  for (const r of ["Really.", "Definitely.", "Of course.", "Right.", "Okay.", "Yes.", "Sure.", "That's great.", "That's cool.", "Really?", "Wow, we were lucky."]) out.push(`We were poor. ${r} We had nothing.`);
  for (const y of ["and yeah,", "but yeah,", "so, yeah,", "oh yeah,"]) out.push(`We were poor ${y} we were happy.`);
  for (const q of ["Was it hard?", "It was good, right?", "You know?"]) out.push(`${q} Yeah, it was.`);
  for (const w of ["So many", "Well water", "Okay then", "Yeah well so", "So much", "Well done", "So I", "Yeah so"]) out.push(`${w} was all we knew.`);
  out.push("We left. Yeah.", "That's great news for us.");
  return out;
}

describe("round 12: the contract, every cut checked against its rule", () => {
  it("holds for every fixture and the generated corpus, each line with and without opening, and their crossings", async () => {
    const { cleanSpeech } = await import("./transcript");
    const corpus = keepCorpus();
    const lines = [
      ...corpus,
      ...R12_CUT.map(([s]) => s),
      ...R12_OPENING.map(([s]) => s),
      ...[...R11_SPEECH, ...CLOSED_LIST_SPEECH, ...RULE_17A_SPEECH, ...RULING_FIXTURES, ...LATER_YEAH_SPEECH].map(([s]) => s),
    ];
    const failures: string[] = [];
    for (const said of lines) {
      for (const opening of [false, true]) {
        const { said: base, out, cuts } = cleanSpeech(said, { opening, explain: true });
        for (const cut of cuts) {
          const why = breaksRule(base, cut, { opening, answer: false, named: false, cuts });
          if (why) failures.push(`${said} (opening ${opening}) :: ${cut[2]} "${base.slice(cut[0], cut[1])}" :: ${why}`);
        }
        if (!onlyCutsRemoved(base, out, cuts)) failures.push(`${said} (opening ${opening}) :: words changed outside the cuts: "${out}"`);
      }
    }
    // every keep line comes out with all its words, alone and after every cut fixture
    for (const k of corpus) {
      const alone = cleanSpeech(k);
      if (alone.replace(/[.!?]$/, "") !== cap1(k).replace(/[.!?]$/, "")) failures.push(`kept line changed: "${k}" → "${alone}"`);
      for (const [said, shown] of R12_CUT) {
        const crossed = cleanSpeech(`${said} ${k}`);
        if (crossed !== `${shown} ${alone}`) failures.push(`crossed: "${said}" + "${k}" → "${crossed}"`);
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
      const paragraphs = call.split(/\n\s*\n/);
      for (const piece of explainTranscript(paragraphs)) {
        const here = { paragraph: paragraphs[piece.para], prior: paragraphs.slice(0, piece.para) };
        if (piece.asked) {
          if (!/^Do they open to non-students as well\? Because our strategy/.test(piece.said)) failures.push(`lifted outside the 5963 shape: ${piece.said}`);
          afterQuestion = true;
          first = false;
          continue;
        }
        for (const cut of piece.cuts) {
          const why = breaksRule(piece.said, cut as Cut, { opening: first, answer: afterQuestion, named: false, cuts: piece.cuts as Cut[], ...here });
          if (why) failures.push(`${cut[2]} "${piece.said.slice(cut[0], cut[1])}" :: ${why}`);
        }
        if (!onlyCutsRemoved(piece.said, piece.out, piece.cuts as Cut[])) failures.push(`words changed outside the cuts in: ${piece.said.slice(0, 60)}`);
        first = false;
        afterQuestion = /\?["”’)]*$/.test(piece.said.trim());
      }
    }
    expect(failures).toEqual([]);
  });
  it("every kept line keeps to 17a: a sentence of the words, less at most one joint word before a comma, pronoun or 'the'", async () => {
    const { keptLine, takeaway, cleanTranscript } = await import("./transcript");
    const { PITCH, GRANDPARENTS, FASTER } = await import("./__fixtures__/calls");
    const failures: string[] = [];
    const texts = [PITCH, GRANDPARENTS, FASTER, ...R12_KEEP, ...R12_CUT.map(([x]) => x), ...R11_SPEECH.map(([x]) => x),
      "I specifically PhD of finance. So the best way to learn finance is to build a business. I love to become a professor one day.",
      "But for my mother, we would never have made it here.", "So many of us never saw our families again, and I think about it."];
    for (const t of texts) {
      const words = cleanTranscript(t.split(/\n\s*\n/)).filter((p) => !p.startsWith("⁣")).join(" ");
      for (const line of [keptLine(t), takeaway(t)]) {
        // a line taken from the raw words (keptLine) or the tidied words (takeaway): either may be its source
        const why = breaksKeptLine(words, line) && breaksKeptLine(t, line);
        if (why) failures.push(`${t.slice(0, 50)} :: ${why}`);
      }
    }
    // the mutants: a joint dropped before "for" or "many", or two words dropped, must fail
    expect(breaksKeptLine("But for my mother, we would never have made it here.", "For my mother, we would never have made it here.")).not.toBe("");
    expect(breaksKeptLine("So many of us never saw our families again.", "Many of us never saw our families again.")).not.toBe("");
    expect(breaksKeptLine("I mean, I loved this country.", "I loved this country.")).not.toBe("");
    expect(breaksKeptLine("So the best way to learn finance is to build a business.", "The best way to learn finance is to build a business.")).toBe("");
    expect(failures).toEqual([]);
  });
  it("catches the mutants of the round-11 review: a checker that accepts a forbidden cut fails here", () => {
    // each of these cuts is forbidden by the list; breaksRule must name a reason for every one
    const forbidden: [string, Cut, { opening?: boolean; answer?: boolean; named?: boolean }][] = [
      ["We went to the theater.", [11, 15, "c-slip"], {}], // "the " before "theater"
      ["She sang an anthem.", [9, 12, "c-slip"], {}], // "an " before "anthem"
      ["I think it, it's fine.", [8, 12, "c-slip"], {}], // "it, " before "it's"
      ["Wow, we were lucky.", [0, 5, "e-reaction"], {}], // "Wow," is not a whole sentence
      ["That's great news for us.", [0, 12, "e-reaction"], {}], // not the whole sentence, and not in the set
      ["Wow. We left that night. Yeah.", [25, 30, "e-reaction"], {}], // "Yeah." not straight after a reaction
      ["Every day, every day she called.", [0, 11, "d-restart"], {}], // (d) is gone
      ["We laughed, we laughed and cried.", [0, 12, "d-restart"], {}],
      ["We were poor and yeah, we were happy.", [17, 23, "a-later"], {}], // not at a sentence start
      ["I think that's, that's why we left.", [8, 16, "c-slip"], {}], // the first copy does not open the sentence
      ["It was good, right? Yeah, it was.", [20, 26, "a-later"], {}], // follows a (tag) question
      ["We had plan A, a backup plan and a prayer.", [12, 15, "c-slip"], {}], // a capital A is not on the list
      ["My kids hate vegetables but like really spicy food.", [28, 33, "b-like"], {}], // only ", like,"
      ["Dad said, yeah.", [8, 14, "a-closing"], {}], // the closing yeah is gone
      ["We shot it on 8 mm film.", [15, 18, "a-filler"], {}], // "mm" is no longer a filler
      ["So many people died.", [0, 3, "a-opening"], { opening: true }], // no comma after "So"
      ["Okay, we left.", [0, 6, "a-opening"], { opening: false }], // not the teller's first words
      ["Interviewer: What happened? Me: Wow. It was a long time ago.", [0, 4, "e-reaction"], { named: true }], // the teller's own turn
    ];
    for (const [said, cut, ctx] of forbidden) {
      expect(breaksRule(said, cut, { opening: !!ctx.opening, answer: !!ctx.answer, named: !!ctx.named, cuts: [cut] }), `${said} :: ${cut[2]}`).not.toBe("");
    }
  });
});

/** The first letter as a sentence shows it. */
function cap1(s: string): string {
  return s.replace(/^(["“‘(]?)([a-z])/, (_, q: string, c: string) => q + c.toUpperCase());
}

/* ───────── Round 13: the rulings added to 17a, every reviewer string, and the inputs that catch the surviving mutants ───────── */

export const R13_KEEP: string[] = [
  // baos 1: the quoting ", like," after be / go / say
  "She was, like, you can't marry him.",
  "And my dad was, like, no way, you stay here.",
  "My mom was, like, “You are not going.”",
  "I was, like, wow.",
  // baos 2: the hedging ", like," before an amount
  "We paid, like, two hundred dollars for the boat.",
  "There were, like, twenty of us in one room.",
  "We stayed there for, like, three years.",
  "It cost, like, $50 back then.",
  "We had, like, a few dollars left.",
  // baos 6 / skills 2: a reaction in quotation marks is someone in the story speaking
  "Mom opened the letter. “Wow.” That was all she said.",
  'My mother opened the door. "Wow." That was all she said.',
  'She saw the ring. "That\'s amazing." Then she cried.',
  "“Wow.” That was all.",
  // for the lead: "Yeah, right." stays
  "He said he would pay us back. Yeah, right. We never saw a cent.",
  // skills 7: a straight closing quote stays with its sentence
  "He said 'go home.' Then he left.",
  "She said, 'I love you.'",
  "And he was, like, 'Get out of my house.'",
  // skills 9: a word written with a capital inside keeps it
  "iPhone was new then. eBay too.",
  // skills 3: the corpus inputs that catch the surviving mutants
  "I, I'm not sure.",
  "And, Andrew came.",
];

export const R13_CUT: [string, string][] = [
  // baos 3: a filler between two commas leaves one comma
  ["My brothers were Tuan, um, Minh and Long.", "My brothers were Tuan, Minh and Long."],
  ["We moved to Hue, uh, Saigon and then Houston.", "We moved to Hue, Saigon and then Houston."],
  ["We had rice, uh, fish and beans.", "We had rice, fish and beans."],
  ["It was 1975, um, April.", "It was 1975, April."],
  ["We had rice, um, beans and fish.", "We had rice, beans and fish."],
  ["We were, uh, poor.", "We were poor."],
  ["Tuan, um, Minh and Long were my brothers.", "Tuan, Minh and Long were my brothers."],
  ["We ate rice, um, beans and fish.", "We ate rice, beans and fish."],
  // skills 1: a "Yeah," that answers a reaction question stays
  ["Wait, were you? Yeah, I was there the whole time.", "Yeah, I was there the whole time."],
  ["Yeah, right? Yeah, it was crazy.", "Yeah, it was crazy."],
  // the (e) "Yeah." rule is unchanged
  ["Wait, were you? Yeah. So I left.", "So I left."],
  // skills 3: N17, N34
  ["Wow. Yes. We moved.", "Yes. We moved."],
  ["Wow. Yeah. Yeah. We moved.", "Yeah. We moved."],
  // for the lead: the teller's own unquoted reaction is on the list
  ["She walked again after a year. That's amazing.", "She walked again after a year."],
  ["Mom opened the letter. Wow. That was all she said.", "Mom opened the letter. That was all she said."],
];

export const R13_OPENING: [string, string][] = [
  // skills 6: the first word before its own double is emphasis
  ["So, so happy we were.", "So, so happy we were."],
  ["Well, well, well, look at you.", "Well, well, well, look at you."],
  ["Okay, okay, I'll tell you.", "Okay, okay, I'll tell you."],
  // skills 3: N4, only yeah / well / okay / so
  ["Like, I loved it.", "Like, I loved it."],
  ["And, we left.", "And, we left."],
];

export const R13_TRANSCRIPT: [string[], string[]][] = [
  // skills 5 / for the lead: only a yes-or-no question is lifted
  [["Why did Grandpa leave Hue? Because our village was burned. Yes. We had one night."], ["Why did Grandpa leave Hue? Because our village was burned. Yes. We had one night."]],
  [["Why did Dad stay? Because our family was here. Yes. He loved the city."], ["Why did Dad stay? Because our family was here. Yes. He loved the city."]],
  // skills 3: N8 the answer across a paragraph break, N28 the opening only in the first paragraph
  [["Did you go back?", "Yeah, we went in 1990."], ["Did you go back?", "Yeah, we went in 1990."]],
  [["We lived in Hue.", "So, we left in 1975."], ["We lived in Hue.", "So, we left in 1975."]],
  // skills 3: N20 no asker going on, N21 a tag question
  [["Did they stay long? They stayed two years. Yes. It was good."], ["Did they stay long? They stayed two years. Yes. It was good."]],
  [["They were open to everyone, right? Because our school was small. Yes. It was good."], ["They were open to everyone, right? Because our school was small. Yes. It was good."]],
  // skills 8: "A:" inside a sentence of a labelled transcript is not a label
  [["Me: We had plan A: we go north."], ["We had plan A: we go north."]],
  // the 5963 shape still lifts
  [
    ["I won the challenge. Do they open to non-students as well? Because our strategy is to find a student. For sure. We did that."],
    ["I won the challenge.", "⁣Do they open to non-students as well? Because our strategy is to find a student.", "For sure. We did that."],
  ],
];

describe("round 13: the rulings added to 17a, every reviewer string", () => {
  it.each(R13_KEEP)("keeps %s", async (said) => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech(said)).toBe(/[.!?…]["”’)']*$/.test(said) ? said : `${said}.`);
  });
  it.each(R13_CUT)("%s", async (said, shown) => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech(said)).toBe(shown);
  });
  it.each(R13_OPENING)("%s (the teller's first words)", async (said, shown) => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech(said, { opening: true })).toBe(shown);
  });
  it.each(R13_TRANSCRIPT)("%s", async (said, shown) => {
    const { cleanTranscript } = await import("./transcript");
    expect(cleanTranscript(said)).toEqual(shown);
  });
  it("never sets the asker's going-on as the teller's kept line (skills 4)", async () => {
    const { keptLine, takeaway } = await import("./transcript");
    // the asker goes on with "Because our…" (a going-on that opens on "We…" is the teller's own, round 15)
    const said = "I had a company. Do you take on students? Because our school wants people who love the work and never give up on it. For sure. I said that.";
    expect(keptLine(said)).not.toMatch(/^Because our school/);
    expect(takeaway(said)).not.toMatch(/^Because our school/);
  });
  it("a run-on keeps every word when it is punctuated by sense (skills 3, N30)", async () => {
    const { cleanSpeech } = await import("./transcript");
    const said = "we went to the market every morning before school and then we came home and so my mother cooked the rice and the fish and then we ate together and so the whole family sat at the one table and then we went to sleep";
    const { said: base, out, cuts } = cleanSpeech(said, { explain: true });
    expect(cuts).toEqual([]);
    expect(out.split(". ").length).toBeGreaterThan(1);
    expect(onlyCutsRemoved(base, out, cuts)).toBe(true);
  });
  it("the contract holds on every round-13 string, with and without opening", async () => {
    const { cleanSpeech } = await import("./transcript");
    const failures: string[] = [];
    for (const said of [...R13_KEEP, ...R13_CUT.map(([x]) => x), ...R13_OPENING.map(([x]) => x)]) {
      for (const opening of [false, true]) {
        const { said: base, out, cuts } = cleanSpeech(said, { opening, explain: true });
        for (const cut of cuts) {
          const why = breaksRule(base, cut, { opening, answer: false, named: false, cuts });
          if (why) failures.push(`${said} (opening ${opening}) :: ${cut[2]} "${base.slice(cut[0], cut[1])}" :: ${why}`);
        }
        if (!onlyCutsRemoved(base, out, cuts)) failures.push(`${said} :: words changed outside the cuts: "${out}"`);
      }
    }
    // the checker rejects the forbidden cuts these strings were written to catch
    const forbidden: [string, Cut, { opening?: boolean }][] = [
      ["She was, like, you can't marry him.", [7, 14, "b-like"], {}],
      ["We paid, like, two hundred dollars for the boat.", [7, 14, "b-like"], {}],
      ["My brothers were Tuan, um, Minh and Long.", [21, 26, "a-filler"], {}],
      ["We were, uh, poor.", [9, 12, "a-filler"], {}], // one comma left where no list goes on
      ['Mom opened the letter. “Wow.” That was all she said.', [23, 29, "e-reaction"], {}],
      ["Wait, were you? Yeah, I was there the whole time.", [16, 22, "a-later"], {}],
      ["He said he would pay us back. Yeah, right. We never saw a cent.", [30, 36, "a-later"], {}],
      ["So, so happy we were.", [0, 4, "a-opening"], { opening: true }],
      ["Like, I loved it.", [0, 6, "a-opening"], { opening: true }],
      ["I, I'm not sure.", [0, 3, "c-slip"], {}],
      ["And, Andrew came.", [0, 5, "c-slip"], {}],
      ["Wow. Yes. We moved.", [5, 9, "e-reaction"], {}],
    ];
    for (const [said, cut, ctx] of forbidden) {
      if (!breaksRule(said, cut, { opening: !!ctx.opening, answer: false, named: false, cuts: [[0, 4, "e-reaction"], cut] })) failures.push(`the checker accepts a forbidden cut: ${said} :: ${cut[2]} "${said.slice(cut[0], cut[1])}"`);
    }
    expect(failures).toEqual([]);
  });
});

/* ───────── Round 14: the rulings of c3990db, every reviewer string, and the inputs for the 25 surviving mutants ───────── */

export const R14_KEEP: string[] = [
  // baos 2 / skills 5: a hedging "like" before an amount, ages and units included
  "I left home at, like, sixteen.",
  "I got married at, like, nineteen.",
  "We waited, like, an hour for the bus.",
  "We walked, like, a mile every day.",
  "We lived there for, like, a year.",
  "It took, like, a week to get there.",
  "We had, like, a quarter of the rice left.",
  "We stayed there for, like, fifteen years.",
  "We left in, like, nineteen seventy-five.",
  "We stayed, like, a year in the camp.",
  "We had, like, several hundred dollars.",
  "We went, like, twice a year.",
  // baos 3: a reaction inside a quotation of several sentences
  "He read it and said, “Okay. Wow. That's amazing.” Then he left.",
  "She said, “Really? Wait, were you? I never knew.”",
  'He said, "Oh. Wow. Yeah. I see." And he left.',
  // baos 4: the feeling "like" after feel / look
  "It felt, like, a dream.",
  "It felt, like, home to us.",
  "It looked, like, a palace to me.",
  // baos 6 / skills 8: "Yeah, yeah" stays
  "We had to leave everything. Yeah, yeah, it was hard.",
  "So yeah, yeah, that was it.",
  "Yeah, yeah, I remember.",
  // for the lead, ruled: the quoting "like" with all / just / kind of, and after think
  "I was just, like, wow.",
  "She was all, like, no.",
  "She was just, like, get out.",
  "I was kind of, like, okay.",
  "I thought, like, this is it.",
  // skills 6: T3–T6 the quoting "like" after go / say / 'm / are; T9–T10 the amounts; T21 a single-quoted reaction
  "She goes, like, no way.",
  "He said, like, get out.",
  "I'm, like, so tired.",
  "They are, like, the best.",
  "We paid, like, thirty dollars.",
  "We had, like, half a bowl.",
  "We walked, like, a thousand miles.",
  "'Wow.' That was all.",
];

export const R14_CUT: [string, string][] = [
  // baos 5: a list that goes on with commas keeps one comma
  ["We sold pho, um, banh mi, che.", "We sold pho, banh mi, che."],
  ["We had rice, um, beans, fish, everything.", "We had rice, beans, fish, everything."],
  // skills 6: T15 / T17 / T18, the list window; after have the words go on (both commas go)
  ["We had, um, rice beans and fish.", "We had rice beans and fish."],
  ["We had, um, 20 dollars.", "We had 20 dollars."],
  ["We had tea, um, coffee or milk.", "We had tea, coffee or milk."],
  ["We were, uh, poor and hungry.", "We were poor and hungry."],
  // still cut
  ["It was, like, the hardest thing. And then, like, we left.", "It was, like, the hardest thing. And then we left."],
];

export const R14_OPENING: [string, string][] = [
  ["Yeah, yeah, yeah, we know.", "Yeah, yeah, yeah, we know."],
  ["Yeah, right. We never got it back.", "Yeah, right. We never got it back."],
  ["Yeah, I remember.", "I remember."],
];

export const R14_TRANSCRIPT: [string[], string[]][] = [
  // skills 4: a question in single quotes is answered
  [["He asked me, 'Were you there?' Yeah, I was there the whole time."], ["He asked me, 'Were you there?' Yeah, I was there the whole time."]],
  [["He asked me, 'Were you there?'", "Yeah, I was there the whole time."], ["He asked me, 'Were you there?'", "Yeah, I was there the whole time."]],
  // lead: a teller's question followed by "Our…" is never lifted
  [["Did Mom like it? Our house was tiny. Yes. She loved it anyway."], ["Did Mom like it? Our house was tiny. Yes. She loved it anyway."]],
  // lead: "A Story:" mid-sentence is the founder's company, not a label
  [["Me: I started a company called A Story: it keeps memories. AI: What do you remember?"], ["I started a company called A Story: it keeps memories.", "⁣What do you remember?"]],
  // skills 6: R29 first person, N21 a tag, T28 "should", T27 words that only mention a label
  [["Do I need to apply? Because our plan is to find a student. Yes. We did."], ["Do I need to apply? Because our plan is to find a student. Yes. We did."]],
  [["Was it good, right? Because our school was small. Yes. It was."], ["Was it good, right? Because our school was small. Yes. It was."]],
  [["Should they open to everyone? Because our plan is to find a student. Yes."], ["Should they open to everyone? Because our plan is to find a student. Yes."]],
  [["I asked the AI: should we go? It said nothing."], ["I asked the AI: should we go? It said nothing."]],
  // skills 6: T23 a quoted reaction on the asker's line, T32 a "Me:" mid-sentence, T33/T45 a line break, T34 mid-line, T35 after a comma
  [["Interviewer: 'Wow.' Really?"], ["⁣'Wow.' Really?"]],
  [["AI: Tell Me: what happened?"], ["⁣Tell Me: what happened?"]],
  [["AI: What did you eat\nMe: Rice and fish every day."], ["⁣What did you eat", "Rice and fish every day."]],
  [["You: Hi there AI: Hello. What do you remember?"], ["Hi there.", "⁣Hello. What do you remember?"]],
  [["Me: We went there, Me: the north road."], ["We went there, Me: the north road."]],
];

describe("round 14: the rulings of c3990db, every reviewer string", () => {
  it.each(R14_KEEP)("keeps %s", async (said) => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech(said)).toBe(said);
  });
  it.each(R14_CUT)("%s", async (said, shown) => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech(said)).toBe(shown);
  });
  it.each(R14_OPENING)("%s (the teller's first words)", async (said, shown) => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech(said, { opening: true })).toBe(shown);
  });
  it.each(R14_TRANSCRIPT)("%s", async (said, shown) => {
    const { cleanTranscript } = await import("./transcript");
    expect(cleanTranscript(said)).toEqual(shown);
  });
  it("a typed takeaway is a sentence as typed, its ', like,' kept (N26)", async () => {
    const { takeaway } = await import("./transcript");
    const typed = "We were poor, like, really poor. I loved my mother more than anything.";
    const line = takeaway(typed);
    expect(line).not.toBe("");
    expect(typed).toContain(line);
  });
  it("the kept line is never a sentence the tidy would change (N31)", async () => {
    const { keptLine } = await import("./transcript");
    const said = "So yeah I mean it was hard. I loved my grandmother more than anything, um, in the whole wide world, always. Yeah, right? Um, so I went home and I never forgot it.";
    expect(keptLine(said)).not.toMatch(/\bum\b/);
  });
  it("the kept line, the takeaway and the mark keep a straight closing quote (T41–T43)", async () => {
    const { keptLine, takeaway, findTakeaway } = await import("./transcript");
    const said = "I remember she said, 'I will always love you, my dear little one.' Then she left and we never saw her again.";
    for (const line of [keptLine(said), takeaway(said)].filter((l) => l.startsWith("I remember"))) {
      expect(line.endsWith("one.'")).toBe(true);
      const at = findTakeaway(said, line);
      expect(at && said.slice(at[0], at[1]).endsWith("'")).toBe(true);
    }
    expect(takeaway(said)).not.toBe("");
  });
  it("the contract holds on every round-14 string, with and without opening, and the checker rejects the forbidden cuts", async () => {
    const { cleanSpeech } = await import("./transcript");
    const failures: string[] = [];
    for (const said of [...R14_KEEP, ...R14_CUT.map(([x]) => x), ...R14_OPENING.map(([x]) => x)]) {
      for (const opening of [false, true]) {
        const { said: base, out, cuts } = cleanSpeech(said, { opening, explain: true });
        for (const cut of cuts) {
          const why = breaksRule(base, cut, { opening, answer: false, named: false, cuts });
          if (why) failures.push(`${said} (opening ${opening}) :: ${cut[2]} "${base.slice(cut[0], cut[1])}" :: ${why}`);
        }
        if (!onlyCutsRemoved(base, out, cuts)) failures.push(`${said} :: words changed outside the cuts: "${out}"`);
      }
    }
    // each forbidden cut is placed exactly on the words it would take, and each is one the code once made
    const at = (said: string, piece: string, rule: string, from = 0): Cut => {
      const i = said.indexOf(piece, from);
      if (i < 0) throw new Error(`"${piece}" not in "${said}"`);
      return [i, i + piece.length, rule];
    };
    const forbidden: [string, Cut, { opening?: boolean }][] = [
      ["I left home at, like, sixteen.", at("I left home at, like, sixteen.", ", like,", "b-like"), {}],
      ["We waited, like, an hour for the bus.", at("We waited, like, an hour for the bus.", ", like,", "b-like"), {}],
      ["It felt, like, a dream.", at("It felt, like, a dream.", ", like,", "b-like"), {}],
      ["I was just, like, wow.", at("I was just, like, wow.", ", like,", "b-like"), {}],
      ["I thought, like, this is it.", at("I thought, like, this is it.", ", like,", "b-like"), {}],
      ["He read it and said, “Okay. Wow. That's amazing.” Then he left.", at("He read it and said, “Okay. Wow. That's amazing.” Then he left.", "Wow.", "e-reaction"), {}],
      ['He said, "Oh. Wow. Yeah. I see." And he left.', at('He said, "Oh. Wow. Yeah. I see." And he left.', "Wow.", "e-reaction"), {}],
      ["We sold pho, um, banh mi, che.", at("We sold pho, um, banh mi, che.", ", um,", "a-filler"), {}],
      ["We had, um, 20 dollars.", at("We had, um, 20 dollars.", "um,", "a-filler"), {}],
      ["We had to leave everything. Yeah, yeah, it was hard.", at("We had to leave everything. Yeah, yeah, it was hard.", "Yeah, ", "a-later"), {}],
      ["Yeah, right. We never got it back.", at("Yeah, right. We never got it back.", "Yeah, ", "a-opening"), { opening: true }],
      ["Yeah, yeah, yeah, we know.", at("Yeah, yeah, yeah, we know.", "Yeah, ", "a-opening"), { opening: true }],
    ];
    for (const [said, cut, ctx] of forbidden) {
      if (!breaksRule(said, cut, { opening: !!ctx.opening, answer: false, named: false, cuts: [cut] })) failures.push(`the checker accepts a forbidden cut: ${said} :: ${cut[2]} "${said.slice(cut[0], cut[1])}"`);
    }
    // and accepts the allowed ones, so the rejections above are for the rule, not for a misplaced span
    const allowed: [string, Cut, { opening?: boolean }][] = [
      ["It was hard, and, like, really hard.", at("It was hard, and, like, really hard.", ", like,", "b-like"), {}],
      ["We were, uh, poor.", at("We were, uh, poor.", ", uh,", "a-filler"), {}],
      ["We sold pho, um, banh mi, che.", at("We sold pho, um, banh mi, che.", "um,", "a-filler"), {}],
      ["We moved. Yeah, it was hard.", at("We moved. Yeah, it was hard.", "Yeah, ", "a-later"), {}],
      ["Wow. We moved.", at("Wow. We moved.", "Wow.", "e-reaction"), {}],
    ];
    for (const [said, cut, ctx] of allowed) {
      const why = breaksRule(said, cut, { opening: !!ctx.opening, answer: false, named: false, cuts: [cut] });
      if (why) failures.push(`the checker refuses an allowed cut: ${said} :: ${cut[2]} "${said.slice(cut[0], cut[1])}" :: ${why}`);
    }
    expect(failures).toEqual([]);
  });
});

/* ───────── Round 15: 17a after 4d9630c and 6c18b87, every reviewer string, the mutant inputs ───────── */

export const R15_KEEP: string[] = [
  // Bao 1 / Skills 2: a reaction inside a quotation of several sentences, in single marks or guillemets
  "He read it and said, 'Okay. Wow. That's amazing.' Then he left.",
  "He read it and said, ‘Okay. Wow. That's amazing.’ Then he left.",
  "She said, 'Really? Wait, were you? I never knew.'",
  "He said, 'Oh. Wow. Yeah. I see.' And he left.",
  "She said, 'Okay. Wow. That's amazing.' Then he left.",
  "She said, ‘Okay. Wow. That's amazing.’ Then he left.",
  "She said, ‘Really? Wait, were you? I never knew.’",
  "He said, «Wow. That's amazing.» And left.",
  // (b) a thought being quoted, running to a ? or !
  "And I'm standing there, like, what is going on?",
  "I was sitting there, like, no way!",
  // (b) the amounts 17a now names (Skills 7, U26)
  "I was in, like, fourth grade.",
  "It was, like, his twentieth birthday.",
  "We had, like, nothing.",
  "We had, like, none left.",
  "We had, like, zero money.",
  "We had, like, about ten dollars.",
  "We had, like, maybe ten dollars.",
  "We had, like, around 20 dollars.",
  "We waited, like, at least two hours.",
  "We paid, like, over a hundred dollars.",
  "It took, like, a few days.",
  "We had, like, a couple of bowls.",
  // (b) the comparing "like", and "sort of" between
  "It seemed, like, forever.",
  "It sounded, like, thunder.",
  "I was sort of, like, no.",
  // U31: "Yeah, Yeah" in capitals stays too
  "We moved. Yeah, Yeah, it was hard.",
];

export const R15_CUT: [string, string][] = [
  // (a) between two commas one always stays (Skills 3: a possessive is not "is")
  ["We ate at Lan's, um, Mai's, and Hoa's.", "We ate at Lan's, Mai's, and Hoa's."],
  ["We visited Hue, Lan's, um, Minh's and Long's.", "We visited Hue, Lan's, Minh's and Long's."],
  ["It was my uncle's, um, my aunt's, and my mother's house.", "It was my uncle's, my aunt's, and my mother's house."],
  ["We went to Lan's, um, Mai's.", "We went to Lan's, Mai's."],
  ["We had rice, um, fish.", "We had rice, fish."],
  ["We went, um, there, and then home.", "We went, there, and then home."],
  // T15 / T17
  ["We ate rice, um, fresh fish and beans.", "We ate rice, fresh fish and beans."],
  ["We had three: rice, um, 2 kinds of beans.", "We had three: rice, 2 kinds of beans."],
  // after a form of be or have both commas go, a contraction after a pronoun or "that" / "there" included
  ["We were, uh, poor.", "We were poor."],
  ["It's, um, hard.", "It's hard."],
  ["That's, um, the house.", "That's the house."],
  ["There's, um, a river.", "There's a river."],
  ["I'd, um, gone home.", "I'd gone home."],
  // still cut: a reaction outside the quotation, a plain ", like,"
  // a paragraph with a quotation mark keeps every reaction (round 16 ruling)
  ["She said it, 'Wow.' Wow. We moved.", "She said it, 'Wow.' Wow. We moved."],
  ["It was dad's. Wow. We moved.", "It was dad's. We moved."],
  ["And then, like, we left.", "And then we left."],
];

export const R15_TRANSCRIPT: [string[], string[]][] = [
  // a quotation running across a paragraph break
  [["He said, “We went.", "Wow. That's amazing.” Then we left."], ["He said, “We went.", "Wow. That's amazing.” Then we left."]],
  [["She said, 'We went.", "Wow. That's amazing.' Then we left."], ["She said, 'We went.", "Wow. That's amazing.' Then we left."]],
  // the asker's going-on never opens on a first-person word
  [["Did they like it? We want to know. Yes. They did."], ["Did they like it? We want to know. Yes. They did."]],
  [["Did they go back? We'll see. Yes. They went."], ["Did they go back? We'll see. Yes. They went."]],
  [["Were they happy? We're not sure. Yes."], ["Were they happy? We're not sure. Yes."]],
  // U18 / U24: a question holding us or me is the teller's
  [["Is it good for us? Because our plan is to find a student. Yes."], ["Is it good for us? Because our plan is to find a student. Yes."]],
  [["Did they call me? Because our plan is to find a student. Yes."], ["Did they call me? Because our plan is to find a student. Yes."]],
  // U20: a tag question in single quotes
  [["'Was it good, right?' Because our school was small. Yes."], ["'Was it good, right?' Because our school was small. Yes."]],
  // U2: a quoted reaction on the asker's line stays
  [["Interviewer: He said, “Okay. Wow. That's amazing.” Did he?", "Me: Yes."], ["⁣He said, “Okay. Wow. That's amazing.” Did he?", "Yes."]],
  // still lifted: the 5963 shape, "does" included (U25)
  [["Do they open to non-students as well? Because our strategy is to grow. For sure. We did."], ["⁣Do they open to non-students as well? Because our strategy is to grow.", "For sure. We did."]],
  [["Does it open to everyone? Because our plan is to grow. Yes. It does."], ["⁣Does it open to everyone? Because our plan is to grow.", "Yes. It does."]],
  // "A Story:" mid-sentence is the company
  [["Me: I started a company called A Story: it keeps memories. AI: What do you remember?"], ["I started a company called A Story: it keeps memories.", "⁣What do you remember?"]],
];

describe("round 15: 17a after 4d9630c and 6c18b87, every reviewer string", () => {
  it.each(R15_KEEP)("keeps %s", async (said) => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech(said)).toBe(said);
  });
  it.each(R15_CUT)("%s", async (said, shown) => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech(said)).toBe(shown);
  });
  it.each(R15_TRANSCRIPT)("%s", async (said, shown) => {
    const { cleanTranscript } = await import("./transcript");
    expect(cleanTranscript(said)).toEqual(shown);
  });
  it("a typed takeaway whose best line holds ', like,' is that sentence, as typed (N26)", async () => {
    const { takeaway } = await import("./transcript");
    expect(takeaway("We were so poor, like, really poor in those years.")).toBe("We were so poor, like, really poor in those years.");
  });
  it("the kept line and the takeaway keep the straight closing quote, exactly (T42, U23)", async () => {
    const { keptLine, takeaway } = await import("./transcript");
    const said = "I remember she said, 'I will always love you, my dear little one.' Then she left and we never saw her again.";
    expect(takeaway(said)).toBe("I remember she said, 'I will always love you, my dear little one.'");
    expect(keptLine(said)).toBe("I remember she said, 'I will always love you, my dear little one.'");
  });
  it("the contract holds on every round-15 string, across paragraphs too, and the checker refuses the old cuts", async () => {
    const { cleanSpeech, explainTranscript } = await import("./transcript");
    const failures: string[] = [];
    for (const said of [...R15_KEEP, ...R15_CUT.map(([x]) => x)]) {
      for (const opening of [false, true]) {
        const { said: base, out, cuts } = cleanSpeech(said, { opening, explain: true });
        for (const cut of cuts) {
          const why = breaksRule(base, cut, { opening, answer: false, named: false, cuts });
          if (why) failures.push(`${said} (opening ${opening}) :: ${cut[2]} "${base.slice(cut[0], cut[1])}" :: ${why}`);
        }
        if (!onlyCutsRemoved(base, out, cuts)) failures.push(`${said} :: words changed outside the cuts: "${out}"`);
      }
    }
    for (const [paragraphs] of R15_TRANSCRIPT) {

      for (const piece of explainTranscript(paragraphs)) {
        if (!piece.asked) {
          for (const cut of piece.cuts as Cut[]) {
            const why = breaksRule(piece.said, cut, { opening: false, answer: false, named: false, cuts: piece.cuts as Cut[], paragraph: paragraphs[piece.para], prior: paragraphs.slice(0, piece.para) });
            if (why) failures.push(`${piece.said} :: ${cut[2]} :: ${why}`);
          }
        }
      }
    }
    const at = (said: string, piece: string, rule: string): Cut => {
      const i = said.indexOf(piece);
      if (i < 0) throw new Error(`"${piece}" not in "${said}"`);
      return [i, i + piece.length, rule];
    };
    // each of these is a cut the code made in round 14
    const forbidden: [string, Cut, string?][] = [
      ["He read it and said, 'Okay. Wow. That's amazing.' Then he left.", at("He read it and said, 'Okay. Wow. That's amazing.' Then he left.", "Wow.", "e-reaction")],
      ["She said, ‘Really? Wait, were you? I never knew.’", at("She said, ‘Really? Wait, were you? I never knew.’", "Wait, were you?", "e-reaction")],
      ["He said, «Wow. That's amazing.» And left.", at("He said, «Wow. That's amazing.» And left.", "That's amazing.", "e-reaction")],
      ["Wow. That's amazing.” Then we left.", at("Wow. That's amazing.” Then we left.", "Wow.", "e-reaction"), "He said, “We went. "],
      ["We ate at Lan's, um, Mai's, and Hoa's.", at("We ate at Lan's, um, Mai's, and Hoa's.", ", um,", "a-filler")],
      ["We had rice, um, fish.", at("We had rice, um, fish.", ", um,", "a-filler")],
      ["And I'm standing there, like, what is going on?", at("And I'm standing there, like, what is going on?", ", like,", "b-like")],
      ["I was in, like, fourth grade.", at("I was in, like, fourth grade.", ", like,", "b-like")],
      ["We had, like, nothing.", at("We had, like, nothing.", ", like,", "b-like")],
      ["We had, like, about ten dollars.", at("We had, like, about ten dollars.", ", like,", "b-like")],
      ["We had, like, zero money.", at("We had, like, zero money.", ", like,", "b-like")],
    ];
    for (const [said, cut, prior] of forbidden) {
      if (!breaksRule(said, cut, { opening: false, answer: false, named: false, cuts: [cut], prior })) failures.push(`the checker accepts a forbidden cut: ${said} :: ${cut[2]} "${said.slice(cut[0], cut[1])}"`);
    }
    const allowed: [string, Cut][] = [
      ["We were, uh, poor.", at("We were, uh, poor.", ", uh,", "a-filler")],
      ["It's, um, hard.", at("It's, um, hard.", ", um,", "a-filler")],
      ["We had rice, um, fish.", at("We had rice, um, fish.", "um,", "a-filler")],
      ["It was dad's. Wow. We moved.", at("It was dad's. Wow. We moved.", "Wow.", "e-reaction")],
      ["And then, like, we left.", at("And then, like, we left.", ", like,", "b-like")],
    ];
    for (const [said, cut] of allowed) {
      const why = breaksRule(said, cut, { opening: false, answer: false, named: false, cuts: [cut] });
      if (why) failures.push(`the checker refuses an allowed cut: ${said} :: ${cut[2]} :: ${why}`);
    }
    expect(failures).toEqual([]);
  });
});

/* ───────── Round 16: 17a at ec7c671 and after (the apostrophe, the carry, the inch mark, every unit), the r15 mutants ───────── */

const R16_UNITS = ["a ton of rice", "an acre of rice", "a hectare of land", "a foot of water", "a metre of cloth", "a litre of milk", "a gallon of water", "a gram of gold", "an ounce of gold", "an inch of snow", "a bag of rice", "a sack of rice", "a bucket of fish", "a plate of noodles", "a box of letters", "a basket of fruit", "a pot of pho", "a bottle of wine", "a century ago", "a night or two", "a semester there", "a pint of beer", "a yard of silk", "a tonne of rice"];

export const R16_KEEP: string[] = [
  // Bao 1 / Skills 1: a curly ’ after a letter closes only before punctuation or the end
  "“Our parents’ house. Wow. Big.” Mom said.",
  "Inside “the kids’ room. Wow. Nice.” We said.",
  "“The kids’ toys. Wow. Really.” She smiled.",
  "“Rock ’n’ roll. Wow. Yes.”",
  "She said, ‘Okay. The boys’ room was full. Wow. That’s amazing.’",
  "She said, ‘We went to the Nguyens’ house. Wow. That’s amazing.’",
  // the inch mark never counts, so a later quotation in the paragraph is still read as one
  'He bought a 12" knife. Later Mom said, "Okay. Wow. Nice."',
  'He is 5\'6" tall. She said, "Okay. Wow. Nice."',
  // Bao 2: a or an with any unit of time, length, area, weight, volume or a container
  ...R16_UNITS.map((u) => `We had, like, ${u}.`),
  // a time or a span, where the next word is on 17a's closed list
  "We left at, like, three o'clock.",
  "We were there, like, the whole summer.",
  "We worked, like, all day.",
  // the r15 mutants: V2, V3, V5, V10
  "He said, «Okay. Wow. That's amazing.» And left.",
  "She said, ‘Okay. It’s late. Wow. That’s amazing.’",
  "She said, 'We're home. Wow. That's amazing.'",
  "I said ” then. She said, “Okay. Wow. That's amazing.”",
];

export const R16_CUT: [string, string][] = [
  // an inch mark opens nothing: the reaction after it is the listener's
  ['The table was 32" wide. Wow. We moved.', 'The table was 32" wide. We moved.'],
  // the next word alone decides (round 16 ruling); a time of day is on the closed list
  ["At, like, midnight we left.", "At, like, midnight we left."],
  ["We met at, like, noon.", "We met at, like, noon."],
  // a ’ that is not inside a word is a quotation mark: the paragraph keeps its reactions
  ["The boys’ room was full. Wow. We moved.", "The boys’ room was full. We moved."], // round 19: a possessive ’ is not a quotation mark
  // X7: "maybe" is not "be"; X10: "being" is not on the be list
  ["It was maybe, um, Lan, Mai and Hoa.", "It was maybe, Lan, Mai and Hoa."],
  ["Being, um, poor, hungry, we left.", "Being, poor, hungry, we left."],
];

export const R16_TRANSCRIPT: [string[], string[]][] = [
  // W2: the asker's line carries the quotation from their line before, which it closes
  [["Interviewer: He said, “Okay.", "Interviewer: Wow. That's amazing.” Did he?"], ["⁣He said, “Okay.", "⁣Wow. That's amazing.” Did he?"]],
  // the carry happens only into a paragraph that holds a closing mark
  [["He said, “We went.", "Wow. That's amazing.” Then we left."], ["He said, “We went.", "Wow. That's amazing.” Then we left."]],
  // a paragraph after one that leaves its marks open keeps its reactions, until one closes them
  [["He said, “We went.", "Wow. We moved."], ["He said, “We went.", "Wow. We moved."]],
  [["She was 5'6\" tall.", "Wow. We moved."], ["She was 5'6\" tall.", "We moved."]],
  [["It was the ’90s, “a hard time.", "Wow. We moved.", "Then he said, “Okay. Wow. Nice.”"], ["It was the ’90s, “a hard time.", "Wow. We moved.", "Then he said, “Okay. Wow. Nice.”"]],
  // after the paragraph that closes the quotation, a plain paragraph loses its reaction again
  [["He said, “We went.", "We came back.” Then we ate.", "Wow. We moved."], ["He said, “We went.", "We came back.” Then we ate.", "We moved."]],
  // U20: a tag question closing a straight single quotation is never lifted
  [["She said, 'It was hard. Was it good, right?' Because our school was small. Yes."], ["She said, 'It was hard. Was it good, right?' Because our school was small. Yes."]],
];

describe("round 16: 17a at ec7c671 and after, every reviewer string and the r15 mutants", () => {
  it.each(R16_KEEP)("keeps %s", async (said) => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech(said)).toBe(said);
  });
  it.each(R16_CUT)("%s", async (said, shown) => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech(said)).toBe(shown);
  });
  it.each(R16_TRANSCRIPT)("%s", async (said, shown) => {
    const { cleanTranscript } = await import("./transcript");
    expect(cleanTranscript(said)).toEqual(shown);
  });
  it("the takeaway keeps a straight closing quote and never picks a question in straight quotes (T42, U23)", async () => {
    const { takeaway } = await import("./transcript");
    expect(takeaway("I remember she said, 'We will go to the market by the river tomorrow.' Then the rain came.")).toBe("I remember she said, 'We will go to the market by the river tomorrow.'");
    expect(takeaway("We asked her, 'Will you always remember the little house by the river?' The house stood by the river for many long years.")).toBe("The house stood by the river for many long years.");
  });
  it("the contract holds on every round-16 string, and the checker refuses the cuts round 15 made", async () => {
    const { cleanSpeech, explainTranscript } = await import("./transcript");
    const failures: string[] = [];
    for (const said of [...R16_KEEP, ...R16_CUT.map(([x]) => x)]) {
      for (const opening of [false, true]) {
        const { said: base, out, cuts } = cleanSpeech(said, { opening, explain: true });
        for (const cut of cuts) {
          const why = breaksRule(base, cut, { opening, answer: false, named: false, cuts });
          if (why) failures.push(`${said} (opening ${opening}) :: ${cut[2]} "${base.slice(cut[0], cut[1])}" :: ${why}`);
        }
        if (!onlyCutsRemoved(base, out, cuts)) failures.push(`${said} :: words changed outside the cuts: "${out}"`);
      }
    }
    for (const [paragraphs] of R16_TRANSCRIPT) {

      for (const piece of explainTranscript(paragraphs)) {
        if (!piece.asked) {
          for (const cut of piece.cuts as Cut[]) {
            const why = breaksRule(piece.said, cut, { opening: false, answer: false, named: false, cuts: piece.cuts as Cut[], paragraph: paragraphs[piece.para], prior: paragraphs.slice(0, piece.para) });
            if (why) failures.push(`${piece.said} :: ${cut[2]} :: ${why}`);
          }
        }
      }
    }
    const at = (said: string, piece: string, rule: string): Cut => {
      const i = said.indexOf(piece);
      if (i < 0) throw new Error(`"${piece}" not in "${said}"`);
      return [i, i + piece.length, rule];
    };
    const forbidden: [string, Cut, string?][] = [
      ["“Our parents’ house. Wow. Big.” Mom said.", at("“Our parents’ house. Wow. Big.” Mom said.", "Wow.", "e-reaction")],
      ["She said, ‘Okay. The boys’ room was full. Wow. That’s amazing.’", at("She said, ‘Okay. The boys’ room was full. Wow. That’s amazing.’", "Wow.", "e-reaction")],
      ["“Rock ’n’ roll. Wow. Yes.”", at("“Rock ’n’ roll. Wow. Yes.”", "Wow.", "e-reaction")],
      ['He bought a 12" knife. Later Mom said, "Okay. Wow. Nice."', at('He bought a 12" knife. Later Mom said, "Okay. Wow. Nice."', "Wow.", "e-reaction")],
      ["Wow. That's amazing.” Then we left.", at("Wow. That's amazing.” Then we left.", "Wow.", "e-reaction"), "He said, “We went. "],
      ...R16_UNITS.slice(0, 6).map((u): [string, Cut] => [`We had, like, ${u}.`, at(`We had, like, ${u}.`, ", like,", "b-like")]),
      ["We were there, like, the whole summer.", at("We were there, like, the whole summer.", ", like,", "b-like")],
      ["We left at, like, three o'clock.", at("We left at, like, three o'clock.", ", like,", "b-like")],
    ];
    for (const [said, cut, prior] of forbidden) {
      if (!breaksRule(said, cut, { opening: false, answer: false, named: false, cuts: [cut], prior })) failures.push(`the checker accepts a forbidden cut: ${said} :: ${cut[2]} "${said.slice(cut[0], cut[1])}"`);
    }
    forbidden.push(
      // a paragraph after one that leaves a quotation open
      ["Wow. We moved.", at("Wow. We moved.", "Wow.", "e-reaction"), "He said, “We went. "],
    );
    for (const [said, cut, prior] of forbidden.slice(-2)) {
      if (!breaksRule(said, cut, { opening: false, answer: false, named: false, cuts: [cut], prior })) failures.push(`the checker accepts a forbidden cut: ${said} :: ${cut[2]} "${said.slice(cut[0], cut[1])}"`);
    }
    const allowed: [string, Cut, string?][] = [
      ['The table was 32" wide. Wow. We moved.', at('The table was 32" wide. Wow. We moved.', "Wow.", "e-reaction")],
      ["It’s late. Wow. We moved.", at("It’s late. Wow. We moved.", "Wow.", "e-reaction")],
      ["We ate, like, really fast.", at("We ate, like, really fast.", ", like,", "b-like")],
      // a quotation closed in the paragraph before: the reactions go again
      ["Wow. We moved.", at("Wow. We moved.", "Wow.", "e-reaction"), "He said, “We went.”"],
    ];
    for (const [said, cut, prior] of allowed) {
      const why = breaksRule(said, cut, { opening: false, answer: false, named: false, cuts: [cut], prior });
      if (why) failures.push(`the checker refuses an allowed cut: ${said} :: ${cut[2]} :: ${why}`);
    }
    expect(failures).toEqual([]);
  });
});

/* ───────── Round 17: 17a (b) and (e) as the closed tests of 6d0cb51 and a085c29, every r16 reviewer string ───────── */

export const R17_KEEP: string[] = [
  "He, like, never came.",
  // Bao r16 1: a plural possessive inside a “ ” quotation
  "Mom said, “We stayed at the Nguyens’. Wow. It was big.”",
  "“We visited the Vos’! Wow. Nice.”",
  "“That was my parents’. Wow. Really.” He smiled.",
  "“Mom said ‘no’. Wow. Okay.”",
  // Skills r16, not counted: a possessive before punctuation in a ‘ ’ quotation
  "‘We cleaned the boys’, the girls’ rooms. Wow. That’s amazing.’",
  "‘It was the Nguyens’. Wow. That’s amazing.’",
  // Bao r16 2: a hedge before a time or a span, decided by the next word
  "We left, like, last summer.",
  "We arrived, like, at sunrise.",
  "We ate, like, at night.",
  "We came back, like, tonight.",
  "We left, like, in the morning.",
  "We moved, like, the next year.",
  "We left, like, that winter.",
  "We stayed, like, a while.",
  "We walked, like, the whole way.",
  // Skills r16 P20
  "We had, like, a half bowl of rice.",
  // the rest of the closed list
  "We waited, like, forever.",
  "We stayed, like, until dawn.",
  "We cooked, like, every day.",
  "We went, like, yesterday.",
];

export const R17_CUT: [string, string][] = [
  // a plain paragraph still loses its reactions, an apostrophe inside a word or an inch mark included
  ["Wow. We moved.", "We moved."],
  ["It’s late. Wow. We moved.", "It’s late. We moved."],
  ["We didn't know. That's amazing. We stayed.", "We didn't know. We stayed."],
  ['The table was 32" wide. Wow. That’s awesome. We moved.', 'The table was 32" wide. We moved.'],
  // a ", like," before a word off the closed list goes
  ["We drove, like, home.", "We drove home."],
  // the next word must be the listed word itself, not a word that starts like one ("an" in "anywhere")
  ["We drove, like, anywhere.", "We drove anywhere."],
  ["It was hard, and, like, really hard.", "It was hard, and really hard."],
];

export const R17_TRANSCRIPT: [string[], string[]][] = [
  // round 19: marks walked in order (a stray close never cancels a later open), and a possessive ’ never closes a ‘
  [["Mom said ” ok. He said, “We went.", "Wow. We stayed.", "Then we left.”"], ["Mom said ” ok. He said, “We went.", "Wow. We stayed.", "Then we left.”"]],
  [["He wrote, ‘Dear Mom, the boys’ room is cold.", "Wow. It's cold here.", "Love, Lan.’"], ["He wrote, ‘Dear Mom, the boys’ room is cold.", "Wow. It's cold here.", "Love, Lan.’"]],
  // round 18: a ’ only ever closes a ‘, so a plural possessive never closes an open “ for the next paragraph
  [["He said, “We went to the boys’ room.", "Wow. We stayed.", "Then we left.”"], ["He said, “We went to the boys’ room.", "Wow. We stayed.", "Then we left.”"]],
  [["She said, “We slept at the Nguyens’.", "Wow. It was big.", "Then we left.”"], ["She said, “We slept at the Nguyens’.", "Wow. It was big.", "Then we left.”"]],
  // Skills r16 1: a stray straight " in one paragraph, a quotation opened in the next
  [["He said \"hi and left.", "\"Okay. Wow. That's amazing.\" Then we left."], ["He said \"hi and left.", "\"Okay. Wow. That's amazing.\" Then we left."]],
  [["He said “hi and left.", "“Okay. Wow. That's amazing.” Then we left."], ["He said “hi and left.", "“Okay. Wow. That's amazing.” Then we left."]],
  // P9 / P10: a quotation closing at the end of the next paragraph
  [["He said, \"We went.", "Wow. That's amazing. Then we left.\""], ["He said, \"We went.", "Wow. That's amazing. Then we left.\""]],
  [["She said, ‘We went.", "Wow. That’s amazing. Then we left.’"], ["She said, ‘We went.", "Wow. That’s amazing. Then we left.’"]],
  // Skills r16, not counted: a middle paragraph of a quotation that runs on
  [["She said, “We went home.", "We ate. Wow. That's amazing.", "Then we slept.” Wow."], ["She said, “We went home.", "We ate. Wow. That's amazing.", "Then we slept.” Wow."]],
  // and a plain paragraph after the quotation has closed loses its reaction
  [["She said, “We went home.", "Then we slept.”", "Wow. We moved."], ["She said, “We went home.", "Then we slept.”", "We moved."]],
  // a plain transcript still loses its reactions, on the asker's line too
  [["Interviewer: Wow. Tell me more.", "Me: We went home. Wow."], ["⁣Tell me more.", "We went home. Wow."]],
];

describe("round 17: (b) and (e) as closed tests, every r16 reviewer string", () => {
  it.each(R17_KEEP)("keeps %s", async (said) => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech(said)).toBe(said);
  });
  it.each(R17_CUT)("%s", async (said, shown) => {
    const { cleanSpeech } = await import("./transcript");
    expect(cleanSpeech(said)).toBe(shown);
  });
  it.each(R17_TRANSCRIPT)("%s", async (said, shown) => {
    const { cleanTranscript } = await import("./transcript");
    expect(cleanTranscript(said)).toEqual(shown);
  });
  it("the contract holds on every round-17 string, paragraph by paragraph", async () => {
    const { cleanSpeech, explainTranscript } = await import("./transcript");
    const failures: string[] = [];
    for (const said of [...R17_KEEP, ...R17_CUT.map(([x]) => x)]) {
      for (const opening of [false, true]) {
        const { said: base, out, cuts } = cleanSpeech(said, { opening, explain: true });
        for (const cut of cuts) {
          const why = breaksRule(base, cut, { opening, answer: false, named: false, cuts });
          if (why) failures.push(`${said} (opening ${opening}) :: ${cut[2]} "${base.slice(cut[0], cut[1])}" :: ${why}`);
        }
        if (!onlyCutsRemoved(base, out, cuts)) failures.push(`${said} :: words changed outside the cuts: "${out}"`);
      }
    }
    for (const [paragraphs] of R17_TRANSCRIPT) {
      for (const piece of explainTranscript(paragraphs)) {
        if (piece.asked) continue;
        for (const cut of piece.cuts as Cut[]) {
          const why = breaksRule(piece.said, cut, { opening: false, answer: false, named: false, cuts: piece.cuts as Cut[], paragraph: paragraphs[piece.para], prior: paragraphs.slice(0, piece.para) });
          if (why) failures.push(`${piece.said} :: ${cut[2]} :: ${why}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });
});
