import { afterEach, describe, expect, it, vi } from "vitest";
import { newMemory, newStory } from "../data/memories";
import type { Story } from "../data/stories";

const sb = vi.hoisted(() => ({ client: null as unknown }));
vi.mock("./supabase", () => ({ getSupabase: () => sb.client }));

import { dailyIdOf, dayIn, findQuestion, loadSharedQuestion, markSharedAnswered, openShared, questionWithShared, rememberShown, sharedFromRows, todaysDeck, type Prompt } from "./today";
import { voicePrompts } from "../app-core/lib/questionVoice.js";

const TODAY = "2026-10-26";

function story(memories: ReturnType<typeof newMemory>[] = []): Story {
  const s = newStory({ id: "s1", name: "Rose", relationship: "Grandmother", ownerId: "u1" });
  s.memories = memories;
  return s;
}

const bank = (voicePrompts("Rose", {}) as Prompt[])[0];
const row = (over: Record<string, unknown> = {}) => ({
  id: "d1",
  text: "What did your mother sing?",
  question_ref: null,
  asker_name: "Jamie Lee",
  send_on: TODAY,
  answered_at: null,
  ...over,
});

describe("sharedFromRows", () => {
  it("leads with the family's question for today, in the asker's words", () => {
    const q = sharedFromRows([row()], story(), { today: TODAY });
    expect(q).toMatchObject({ id: "daily:d1", question: "What did your mother sing?", dailyId: "d1", askedBy: "Jamie", sendOn: TODAY, era: "Anything else" });
  });

  it("takes the bank's chapter and id when the row came from the bank", () => {
    const q = sharedFromRows([row({ question_ref: bank.id, text: "In Jamie's own wording?" })], story(), { today: TODAY });
    expect(q).toMatchObject({ id: bank.id, question: "In Jamie's own wording?", era: bank.era });
  });

  it("skips another day, an answered row, and one a kept memory already answers", () => {
    expect(sharedFromRows([row({ send_on: "2026-10-25" })], story(), { today: TODAY })).toBeNull();
    expect(sharedFromRows([row({ answered_at: "2026-10-26T09:00:00Z" })], story(), { today: TODAY })).toBeNull();
    const kept = Object.assign(newMemory({ title: "Lullabies" }), { prompt: "What did your mother sing?" });
    expect(sharedFromRows([row()], story([kept]), { today: TODAY })).toBeNull();
    const byId = Object.assign(newMemory({ title: "x" }), { questionId: bank.id });
    expect(sharedFromRows([row({ question_ref: bank.id })], story([byId]), { today: TODAY })).toBeNull();
  });

  it("gives a relative the bank's wording about them, and nothing for a question written for the storyteller", () => {
    expect(sharedFromRows([row()], story(), { today: TODAY, relative: true })).toBeNull();
    const about = (voicePrompts("Rose", { relative: true }) as Prompt[])[0];
    const q = sharedFromRows([row({ question_ref: about.id })], story(), { today: TODAY, relative: true });
    expect(q).toMatchObject({ id: about.id, question: about.question, dailyId: "d1" });
  });
});

describe("questionWithShared", () => {
  const deck: Prompt[] = [
    { id: "a", question: "A?", era: "Childhood" },
    { id: "b", question: "B?", era: "Childhood" },
  ];
  const shared = { id: "a", question: "A?", era: "Childhood", dailyId: "d1", askedBy: "", sendOn: TODAY };

  it("is the deck alone with no shared question", () => {
    expect(questionWithShared(null, deck, 1)?.id).toBe("b");
    expect(questionWithShared(null, deck, 9)?.id).toBe("a");
  });

  it("puts the shared question first and never deals it twice", () => {
    expect(questionWithShared(shared, deck, 0)).toBe(shared);
    expect(questionWithShared(shared, deck, 1)?.id).toBe("b");
    expect(questionWithShared(shared, deck, 2)?.id).toBe("b");
  });
});

describe("todaysDeck", () => {
  it("leaves out a question a kept memory answered, by its words", () => {
    const first = todaysDeck(story())[0];
    const kept = Object.assign(newMemory({ title: "Something else" }), { prompt: first.question });
    expect(todaysDeck(story([kept])).map((q) => q.id)).not.toContain(first.id);
  });

  it("deals the phone's deck when the account is known, the same all day", () => {
    const user = { id: "u1", firstName: "Jamie" };
    const a = todaysDeck(story(), { user, key: TODAY });
    const b = todaysDeck(story(), { user, key: TODAY });
    expect(a.length).toBe(3);
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id));
    const kept = Object.assign(newMemory({ title: "x" }), { prompt: a[0].question, questionId: a[0].id });
    expect(todaysDeck(story([kept]), { user, key: TODAY }).map((q) => q.id)).not.toContain(a[0].id);
  });
});

describe("dayIn", () => {
  it("is the date where they are", () => {
    const at = new Date("2026-10-26T23:30:00Z");
    expect(dayIn("UTC", at)).toBe("2026-10-26");
    expect(dayIn("Asia/Ho_Chi_Minh", at)).toBe("2026-10-27");
  });
});

/* A chainable stand-in for supabase-js: records what was asked, answers what it is told. */
function fakeClient({ rota, rows, rowsError = null, answer = { data: true, error: null } }: { rota: unknown; rows: unknown[]; rowsError?: unknown; answer?: unknown }) {
  const calls: { rpc: [string, unknown][]; filters: unknown[][] } = { rpc: [], filters: [] };
  const query = {
    select: (...a: unknown[]) => (calls.filters.push(["select", ...a]), query),
    eq: (...a: unknown[]) => (calls.filters.push(["eq", ...a]), query),
    is: (...a: unknown[]) => (calls.filters.push(["is", ...a]), query),
    order: (...a: unknown[]) => (calls.filters.push(["order", ...a]), query),
    limit: (...a: unknown[]) => (calls.filters.push(["limit", ...a]), Promise.resolve({ data: rowsError ? null : rows, error: rowsError })),
  };
  return {
    calls,
    rpc: (name: string, args: unknown) => {
      calls.rpc.push([name, args]);
      return Promise.resolve(name === "story_rota" ? rota : answer);
    },
    from: (table: string) => (calls.filters.push(["from", table]), query),
  };
}

describe("loadSharedQuestion", () => {
  afterEach(() => {
    sb.client = null;
  });

  it("asks the rota what day it is there, then reads that day's questions", async () => {
    const c = fakeClient({ rota: { data: { today: TODAY, next: "", days: [] }, error: null }, rows: [row()] });
    sb.client = c;
    const q = await loadSharedQuestion(story(), { tz: "Europe/London" });
    expect(q?.dailyId).toBe("d1");
    expect(c.calls.rpc[0]).toEqual(["story_rota", { sid: "s1", tz: "Europe/London" }]);
    expect(c.calls.filters).toContainEqual(["from", "daily_questions"]);
    expect(c.calls.filters).toContainEqual(["eq", "send_on", TODAY]);
    expect(c.calls.filters).toContainEqual(["is", "answered_at", null]);
  });

  it("uses the local date when the rota isn't there", async () => {
    const now = new Date("2026-10-26T12:00:00Z");
    sb.client = fakeClient({ rota: { data: null, error: { code: "PGRST202" } }, rows: [row()] });
    expect((await loadSharedQuestion(story(), { tz: "UTC", now }))?.sendOn).toBe(TODAY);
  });

  it("is null without a server, without the table, or for a story read as family", async () => {
    expect(await loadSharedQuestion(story())).toBeNull();
    sb.client = fakeClient({ rota: { data: null, error: null }, rows: [], rowsError: { code: "42P01" } });
    expect(await loadSharedQuestion(story())).toBeNull();
    sb.client = fakeClient({ rota: { data: { today: TODAY }, error: null }, rows: [row()] });
    expect(await loadSharedQuestion({ ...story(), readOnly: true })).toBeNull();
  });

  it("marks the question answered by the kept memory, and never throws", async () => {
    const c = fakeClient({ rota: null, rows: [] });
    sb.client = c;
    expect(await markSharedAnswered("d1", "m1")).toBe(true);
    expect(c.calls.rpc).toContainEqual(["daily_question_answer", { p_id: "d1", p_memory: "m1" }]);
    sb.client = fakeClient({ rota: null, rows: [], answer: { data: null, error: { message: "no" } } });
    expect(await markSharedAnswered("d1", "m1")).toBe(false);
    sb.client = null;
    expect(await markSharedAnswered("d1", "m1")).toBe(false);
  });
});

describe("findQuestion", () => {
  afterEach(() => sessionStorage.clear());

  it("finds the question Home showed, whole, with a shared one's dailyId", () => {
    const shared = sharedFromRows([row()], story(), { today: TODAY });
    rememberShown("s1", shared);
    const q = findQuestion(story(), "daily:d1");
    expect(q).toMatchObject({ question: "What did your mother sing?", dailyId: "d1" });
    expect(dailyIdOf(q)).toBe("d1");
    // only for its own story and id
    expect(findQuestion(Object.assign(story(), { id: "s2" }), "daily:d1")).toBeNull();
  });

  it("falls back to the bank in the voice asked, beyond today's deck", () => {
    const deep = (voicePrompts("Rose", {}) as Prompt[]).at(-1)!;
    expect(findQuestion(story(), deep.id)).toMatchObject({ id: deep.id, question: deep.question });
    const about = (voicePrompts("Rose", { relative: true }) as Prompt[]).at(-1)!;
    expect(findQuestion(story(), about.id, { relative: true })?.question).toBe(about.question);
    expect(dailyIdOf(findQuestion(story(), deep.id))).toBeNull();
    expect(findQuestion(story(), null)).toBeNull();
    expect(findQuestion(story(), "no-such-question")).toBeNull();
  });
});

describe("openShared", () => {
  it("drops the shared question once a kept memory answers it", () => {
    const shared = sharedFromRows([row()], story(), { today: TODAY });
    expect(openShared(shared, story())).toBe(shared);
    const kept = Object.assign(newMemory({ title: "Lullabies" }), { prompt: "What did your mother sing?" });
    expect(openShared(shared, story([kept]))).toBeNull();
    expect(openShared(null, story())).toBeNull();
  });
});
