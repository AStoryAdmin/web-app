// Designing the book: what the page saves, how chapters move, and who can put a memory in or keep it out.
import { describe, expect, it } from "vitest";
import { newMemory, newStory } from "./memories";
import {
  cleanDesign,
  designChapters,
  designOf,
  designOver,
  inBookCount,
  memoryLocked,
  memoryWhy,
  moveChapter,
  ordersByChapter,
  patchCover,
  pressMemory,
  sameDesign,
  stateOf,
  withDesign,
} from "./bookDesign";

function story(bookDesign: unknown = null) {
  const s = newStory({ id: "s1", name: "Rose", relationship: "Grandmother" });
  s.bookDesign = bookDesign;
  s.memories = [
    newMemory({ id: "m1", title: "One bicycle", era: "Childhood", body: "We had one bicycle." }),
    newMemory({ id: "m2", title: "The bakery", era: "Work & making a living", body: "Up at four." }),
    newMemory({ id: "m3", title: "Our wedding", era: "Love & family", body: "It rained." }),
    { ...newMemory({ id: "m4", title: "Just for me", era: "Childhood", body: "A secret." }), privacy: "private" },
    { ...newMemory({ id: "m5", title: "Half told", era: "Childhood", body: "" }), status: "in_progress" },
  ];
  return s;
}

describe("designOf and saving", () => {
  it("gives a story nobody has designed A Story's picks", () => {
    const d = designOf(story());
    expect(d.cover.style).toBe("keepsake");
    expect(d.cover.color).toBe("navy");
    expect(d.paper).toBe("classic");
    expect(d.chapterOrder).toEqual([]);
    expect(d.dedication).toBe("");
  });

  it("keeps what the page never shows (the listening key, retold text, photographs) when it saves", () => {
    const s = story({ listenKey: "abcdefghijklmnop", narration: "third", retold: { m1: { h: "x", body: "She had one bicycle." } }, cover: { photos: ["a.jpg"] } });
    const saved = withDesign(s, patchCover(designOf(s), { title: "Rose’s Book" })).bookDesign as ReturnType<typeof designOf>;
    expect(saved.listenKey).toBe("abcdefghijklmnop");
    expect(saved.narration).toBe("third");
    expect(saved.retold.m1.body).toBe("She had one bicycle.");
    expect(saved.cover.photos).toEqual(["a.jpg"]);
    expect(saved.cover.title).toBe("Rose’s Book");
  });

  it("holds words as typed and trims them only on the way out", () => {
    const d = patchCover(designOf(story()), { title: "Rose " });
    expect(d.cover.title).toBe("Rose ");
    expect(cleanDesign(d).cover.title).toBe("Rose");
    expect(withDesign(story(), { ...d, dedication: "  For June.  " }).bookDesign).toMatchObject({ dedication: "For June." });
  });

  it("keeps a listening key written after the draft was taken, and whatever else the page doesn't edit", () => {
    const draft = patchCover(designOf(story()), { title: "Rose’s Book" });
    const later = story({ listenKey: "abcdefghijklmnop", sidesOut: ["v1"], cover: { photos: ["a.jpg"] } });
    const saved = withDesign(later, designOver(designOf(later), draft)).bookDesign as ReturnType<typeof designOf>;
    expect(saved.listenKey).toBe("abcdefghijklmnop");
    expect(saved.sidesOut).toEqual(["v1"]);
    expect(saved.cover.photos).toEqual(["a.jpg"]);
    expect(saved.cover.title).toBe("Rose’s Book");
    // a key arriving is not a change made on the page
    expect(sameDesign(designOf(story()), designOf(later))).toBe(true);
  });

  it("sees no change in a space typed at the end", () => {
    const d = designOf(story({ cover: { title: "Rose" } }));
    expect(sameDesign(d, patchCover(d, { title: "Rose " }))).toBe(true);
    expect(sameDesign(d, patchCover(d, { title: "Rosie" }))).toBe(false);
    expect(sameDesign(d, { ...d, paper: "ivory" })).toBe(false);
  });
});

describe("designChapters", () => {
  it("lists every kept memory by chapter in the book's order, the private one too, never a draft", () => {
    const s = story();
    const chapters = designChapters(s, designOf(s));
    expect(chapters.map((c) => c.era)).toEqual(["Childhood", "Love & family", "Work & making a living"]);
    expect(chapters[0].items.map((m) => m.id).sort()).toEqual(["m1", "m4"]);
  });

  it("follows a saved order", () => {
    const s = story({ chapterOrder: ["Work & making a living"] });
    expect(designChapters(s, designOf(s))[0].era).toBe("Work & making a living");
  });
});

describe("moveChapter", () => {
  const s = story();
  const d = designOf(s);
  const shown = designChapters(s, d).map((c) => c.era);

  it("swaps with the next chapter on the list, past the empty ones between", () => {
    const next = moveChapter(d, shown, "Love & family", 1);
    expect(designChapters(s, next).map((c) => c.era)).toEqual(["Childhood", "Work & making a living", "Love & family"]);
    // the whole sequence is kept, so the order seen is the order printed
    expect(next.chapterOrder.length).toBeGreaterThan(shown.length);
  });

  it("moves earlier", () => {
    const next = moveChapter(d, shown, "Childhood", 1);
    expect(designChapters(s, next).map((c) => c.era)[0]).toBe("Love & family");
    expect(designChapters(s, moveChapter(next, designChapters(s, next).map((c) => c.era), "Childhood", -1))[0].era).toBe("Childhood");
  });

  it("does nothing past either end, or for a chapter not shown", () => {
    expect(moveChapter(d, shown, "Childhood", -1)).toBe(d);
    expect(moveChapter(d, shown, "Work & making a living", 1)).toBe(d);
    expect(moveChapter(d, shown, "Looking back", 1)).toBe(d);
  });

  it("keeps words being typed", () => {
    const typing = patchCover(d, { title: "Rose " });
    expect(moveChapter(typing, shown, "Childhood", 1).cover.title).toBe("Rose ");
  });

  it("is offered only for a book set by chapter", () => {
    expect(ordersByChapter(d)).toBe(true);
    expect(ordersByChapter({ ...d, arrangement: "timeline" })).toBe(false);
  });
});

describe("pressMemory", () => {
  const s = story();
  const [m1, , , m4] = s.memories;

  it("lets a keeper leave a memory out and put it back", () => {
    const out = pressMemory(designOf(s), m1, false);
    expect(stateOf(out, m1)).toEqual({ in: false, why: "left" });
    expect(memoryWhy(out, m1, false, "Rose")).toBe("Left out");
    expect(stateOf(pressMemory(out, m1, false), m1).in).toBe(true);
  });

  it("keeps a private memory out until a keeper puts it in", () => {
    const d = designOf(s);
    expect(stateOf(d, m4)).toEqual({ in: false, why: "private" });
    expect(stateOf(pressMemory(d, m4, false), m4).in).toBe(true);
  });

  it("gives the storyteller the last word, which only they undo", () => {
    const held = pressMemory(designOf(s), m1, true);
    expect(held.heldBack).toEqual(["m1"]);
    expect(memoryWhy(held, m1, true, "Rose")).toBe("You kept this out");
    expect(memoryWhy(held, m1, false, "Rose")).toBe("Rose kept this out");
    expect(memoryLocked(held, m1, false)).toBe(true);
    expect(pressMemory(held, m1, false)).toBe(held);
    expect(stateOf(pressMemory(held, m1, true), m1).in).toBe(true);
  });

  it("changes only who is in, not words being typed", () => {
    const typing = { ...designOf(s), dedication: "For June " };
    expect(pressMemory(typing, m1, false).dedication).toBe("For June ");
  });

  it("counts a chapter's memories in the book", () => {
    const d = designOf(s);
    expect(inBookCount(d, [m1, m4])).toBe(1);
    expect(inBookCount(pressMemory(d, m4, false), [m1, m4])).toBe(2);
  });
});
