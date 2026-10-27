import { describe, expect, it, vi } from "vitest";
import { newStory } from "./memories";
import type { Story } from "./stories";
import { answerUrl, askDeck, askErrorOf, askMessage, askQuestion, canAsk, dayWords, linkUrlFor, rotaFrom, shareLinks, storyRota, takenToday } from "./dailyQuestions";

const BASE = "https://app.example.test";
const TOKEN = "AbCdEfGhIjKlMnOpQrStUvWxYz0";

function story(): Story {
  return newStory({ id: "s1", name: "Rose", relationship: "Grandmother", ownerId: "u1" });
}

const client = (answer: { data?: unknown; error?: unknown } | Error) => ({
  rpc: vi.fn(async () => {
    if (answer instanceof Error) throw answer;
    return { data: answer.data ?? null, error: answer.error ?? null };
  }),
});
// The mock answers rpc() only, which is all these calls use.
const as = (c: ReturnType<typeof client>) => c as never;

describe("askQuestion (daily_question_create)", () => {
  it("sends the phone's arguments and builds the /a/ link", async () => {
    const c = client({ data: { id: "d1", send_on: "2026-10-27", link_token: TOKEN, today: "2026-10-27" } });
    const res = await askQuestion({ storyId: "s1", tellerPersonId: "p1", text: "  What did your  mother sing? ", questionId: "q-song", tz: "Europe/London" }, { client: as(c), base: BASE });
    expect(c.rpc).toHaveBeenCalledWith("daily_question_create", { p_story: "s1", p_teller: "p1", p_text: "What did your mother sing?", p_ms: 0, p_tz: "Europe/London", p_ref: "q-song" });
    expect(res).toEqual({ ok: true, id: "d1", sendOn: "2026-10-27", today: true, day: "2026-10-27", linkUrl: `${BASE}/a/${TOKEN}` });
  });

  it("says when the rota put it on a later day", async () => {
    const c = client({ data: { id: "d2", send_on: "2026-10-29", link_token: TOKEN, today: "2026-10-27" } });
    const res = await askQuestion({ storyId: "s1", tellerPersonId: "p1", text: "Where did you grow up?" }, { client: as(c), base: BASE });
    expect(res).toMatchObject({ ok: true, today: false, sendOn: "2026-10-29", day: "2026-10-27" });
  });

  it("refuses an empty question without calling the server", async () => {
    const c = client({ data: null });
    expect(await askQuestion({ storyId: "s1", tellerPersonId: "p1", text: " hi " }, { client: as(c) })).toEqual({ error: "empty" });
    expect(c.rpc).not.toHaveBeenCalled();
  });

  it("reads the server's refusals and never throws", async () => {
    const ask = (c: ReturnType<typeof client>) => askQuestion({ storyId: "s1", tellerPersonId: "p1", text: "What did you cook?" }, { client: as(c) });
    expect(await ask(client({ error: { code: "PGRST202", message: "no function" } }))).toEqual({ error: "not_ready" });
    expect(await ask(client({ error: { code: "42501", message: "not in this family" } }))).toEqual({ error: "not_family" });
    expect(await ask(client({ error: { code: "22023", message: "not a living storyteller" } }))).toEqual({ error: "not_askable" });
    expect(await ask(client({ error: { code: "54000", message: "too many today" } }))).toEqual({ error: "too_many" });
    expect(await ask(client({ data: { send_on: "2026-10-27" } }))).toEqual({ error: "failed" });
    expect(await ask(client(new Error("offline")))).toEqual({ error: "failed" });
    expect(await askQuestion({ storyId: "s1", tellerPersonId: "p1", text: "What did you cook?" }, { client: null })).toEqual({ error: "not_ready" });
  });
});

describe("askErrorOf", () => {
  it("matches the phone's words", () => {
    expect(askErrorOf(null)).toBe("failed");
    expect(askErrorOf({ message: "sign in first" })).toBe("not_family");
    expect(askErrorOf({ message: "that is you" })).toBe("not_askable");
    expect(askErrorOf({ message: "not this story's person" })).toBe("not_askable");
    expect(askErrorOf({ message: "write a question" })).toBe("empty");
    expect(askErrorOf({ message: "something else" })).toBe("failed");
  });
});

describe("storyRota", () => {
  it("reads who has which day", async () => {
    const c = client({ data: { today: "2026-10-27", next: "2026-10-28", days: [{ send_on: "2026-10-27", asker_name: "Jamie", mine: false }] } });
    const rota = await storyRota("s1", { client: as(c), tz: "UTC" });
    expect(c.rpc).toHaveBeenCalledWith("story_rota", { sid: "s1", tz: "UTC" });
    expect(rota).toEqual({ today: "2026-10-27", next: "2026-10-28", days: [{ sendOn: "2026-10-27", askerName: "Jamie", mine: false }] });
    expect(takenToday(rota)).toEqual({ askerName: "Jamie", mine: false });
  });

  it("is null on a refusal, no client or no connection", async () => {
    expect(await storyRota("s1", { client: as(client({ error: { message: "not in this family" } })) })).toBeNull();
    expect(await storyRota("s1", { client: null })).toBeNull();
    expect(await storyRota("s1", { client: as(client(new Error("offline"))) })).toBeNull();
  });

  it("treats a free day as free", () => {
    expect(takenToday(rotaFrom({ today: "2026-10-27", next: "2026-10-27", days: [{ send_on: "2026-10-28", asker_name: "Linh" }] }))).toBeNull();
    expect(takenToday(null)).toBeNull();
    expect(rotaFrom("nope")).toBeNull();
  });
});

describe("links", () => {
  it("builds the answer link on the given base", () => {
    expect(answerUrl(TOKEN, `${BASE}/`)).toBe(`${BASE}/a/${TOKEN}`);
    expect(answerUrl("", BASE)).toBeNull();
    expect(linkUrlFor({ linkToken: TOKEN }, BASE)).toBe(`${BASE}/a/${TOKEN}`);
    expect(linkUrlFor({ linkUrl: "https://x.test/a/1", linkToken: TOKEN }, BASE)).toBe("https://x.test/a/1");
    expect(linkUrlFor(null)).toBeNull();
  });

  it("fills a text and an email the asker sends themselves", () => {
    const message = askMessage({ question: "What did you cook?", link: `${BASE}/a/${TOKEN}`, tellerName: "Rose" });
    expect(message).toContain("Rose, a question for your story");
    expect(message).toContain("“What did you cook?”");
    expect(askMessage({ question: "Q?", link: "L" })).toMatch(/^A question/);
    const { mail, sms } = shareLinks(message, { email: "rose@example.test" });
    expect(mail).toMatch(/^mailto:rose@example\.test\?subject=/);
    expect(decodeURIComponent(mail.split("body=")[1])).toBe(message);
    expect(sms).toBe(`sms:?&body=${encodeURIComponent(message)}`);
    expect(shareLinks("x", { email: "not an email?cc=a@b.c" }).mail).toMatch(/^mailto:\?subject=/);
  });
});

describe("canAsk", () => {
  it("only a living person who isn't the account itself", () => {
    expect(canAsk({ id: "p1" }, "u1")).toBe(true);
    expect(canAsk({ id: "p1", userId: "u2" }, "u1")).toBe(true);
    expect(canAsk({ id: "p1", userId: "u1" }, "u1")).toBe(false);
    expect(canAsk({ id: "p1", deathYear: 1998 }, "u1")).toBe(false);
    expect(canAsk(null, "u1")).toBe(false);
  });
});

describe("dayWords", () => {
  it("says the day plainly", () => {
    expect(dayWords("2026-10-27", "2026-10-27")).toBe("today");
    expect(dayWords("2026-10-28", "2026-10-27")).toBe("tomorrow");
    expect(dayWords("2026-10-29", "2026-10-27", "en-GB")).toBe("on Thursday");
    expect(dayWords("2026-11-05", "2026-10-27", "en-GB")).toBe("on Thursday 5 November");
    expect(dayWords("garbage", "2026-10-27")).toBe("soon");
  });
});

describe("askDeck", () => {
  it("leads with today's question and never offers a sensitive one", () => {
    const { today, others } = askDeck(story(), { key: "2026-10-27" });
    expect(today?.question).toBeTruthy();
    expect(today?.sensitive).toBeFalsy();
    expect(others.length).toBeGreaterThan(3);
    expect(others.some((p) => p.id === today?.id)).toBe(false);
    expect(others.every((p) => !p.sensitive)).toBe(true);
  });

  it("is the same all day", () => {
    const a = askDeck(story(), { key: "2026-10-27" });
    const b = askDeck(story(), { key: "2026-10-27" });
    expect(b.today?.id).toBe(a.today?.id);
    expect(b.others.slice(0, 3).map((p) => p.id)).toEqual(a.others.slice(0, 3).map((p) => p.id));
  });
});
