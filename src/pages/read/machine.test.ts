import { describe, expect, it } from "vitest";
import { headline, initialState, isEnd, pageTitle, reduce, startState, type Event, type State } from "./machine";
import type { ReadMemory, ReadQuery } from "../../lib/bookRead";

const memory: ReadMemory = {
  id: "QAAAAAAAAAAAAAAAAAAAEQ",
  title: "The Sunday pot roast",
  period: "the 1960s",
  body: "Margaret never measured anything.",
  era: "Childhood",
  photoUrl: null,
  hasVoice: true,
  tellerName: "Rose",
  sides: [],
};
const chapterQ: ReadQuery = { kind: "chapter", story: "MAAAAAAAAAAAAAAAAAAAAQ", chapter: { kind: "era", era: "Childhood", name: "Childhood" }, key: "Ab3_dE-fGh1jKlM9" };
const memoryQ: ReadQuery = { kind: "memory", memory: memory.id, key: "Ab3_dE-fGh1jKlM9" };
const run = (s: State, ...events: Event[]) => events.reduce(reduce, s);

describe("read page machine", () => {
  it("starts loading, and lands in shown with the chapter's memories", () => {
    expect(initialState.phase).toBe("loading");
    expect(startState(chapterQ).phase).toBe("loading");
    const s = run(initialState, { type: "LOADED", result: { kind: "shown", memories: [memory] } });
    expect(s.phase).toBe("shown");
    expect(s.memories).toHaveLength(1);
    expect(isEnd(s.phase)).toBe(false);
  });

  it("a code it cannot read starts, and stays, at not found", () => {
    const s = startState({ kind: "invalid" });
    expect(s.phase).toBe("notFound");
    expect(run(s, { type: "LOADED", result: { kind: "shown", memories: [memory] } })).toBe(s);
    expect(isEnd("notFound")).toBe(true);
    expect(isEnd("notReady")).toBe(true);
  });

  it("not found and not ready are end states with nothing to read", () => {
    expect(run(initialState, { type: "LOADED", result: { kind: "notFound" } })).toMatchObject({ phase: "notFound", memories: [] });
    expect(run(initialState, { type: "LOADED", result: { kind: "notReady" } })).toMatchObject({ phase: "notReady", memories: [] });
  });

  it("a failed load says why and can be tried again; a late answer changes nothing", () => {
    const failed = run(initialState, { type: "LOADED", result: { kind: "error", reason: "server" } });
    expect(failed.phase).toBe("loadError");
    expect(failed.loadReason).toBe("server");
    const again = run(failed, { type: "RETRY_LOAD" });
    expect(again.phase).toBe("loading");
    expect(run(again, { type: "LOADED", result: { kind: "shown", memories: [memory] } }).phase).toBe("shown");
    const shown = run(initialState, { type: "LOADED", result: { kind: "shown", memories: [memory] } });
    expect(run(shown, { type: "LOADED", result: { kind: "notFound" } })).toBe(shown);
    expect(run(shown, { type: "RETRY_LOAD" })).toBe(shown);
  });

  it("names the chapter and whose book it is, and titles the page", () => {
    expect(headline(chapterQ, [memory])).toBe("Childhood, from Rose’s book");
    expect(headline(chapterQ, [])).toBe("Childhood");
    expect(headline(memoryQ, [memory])).toBe("From Rose’s book");
    expect(headline(memoryQ, [])).toBe("From the book");
    expect(pageTitle(chapterQ, [memory])).toBe("Childhood · A Story");
    expect(pageTitle(memoryQ, [memory])).toBe("The Sunday pot roast · A Story");
    expect(pageTitle(memoryQ, [])).toBe("A Story");
  });

  it("a sample's chapter is named by its file and titled as a sample", () => {
    const sampleQ: ReadQuery = { kind: "sample", book: "carolyn", slug: "love-family" };
    const m = { ...memory, era: "Love & family", tellerName: "Carolyn" };
    expect(startState(sampleQ).phase).toBe("loading");
    expect(headline(sampleQ, [m])).toBe("Love & family, from Carolyn’s book");
    expect(headline(sampleQ, [])).toBe("From the book");
    expect(pageTitle(sampleQ, [m])).toBe("Love & family · Sample book · A Story");
    expect(pageTitle(sampleQ, [])).toBe("A Story");
  });
});
