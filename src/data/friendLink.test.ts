// A friend link (/friend/:token): the token, the read and the take, and the page's words.
import { beforeEach, describe, expect, it, vi } from "vitest";

type Answer = { data: unknown; error: { code?: string; message: string } | null };
const calls: { name: string; args: unknown }[] = [];
let answers: Record<string, () => Promise<Answer>> = {};

vi.mock("../lib/supabase", () => ({
  supabase: () => ({
    rpc: (name: string, args?: unknown) => {
      calls.push({ name, args });
      return (answers[name] ?? (() => Promise.resolve({ data: null, error: null })))();
    },
  }),
}));

import { acceptFriendLink, friendLinkNames, friendLinkTrouble, normaliseFriendToken, readFriendLink } from "./friendLink";

const ok = (data: unknown) => () => Promise.resolve({ data, error: null });
const fail = (code: string, message = "") => () => Promise.resolve({ data: null, error: { code, message } });

beforeEach(() => {
  calls.length = 0;
  answers = {};
});

describe("normaliseFriendToken", () => {
  it("keeps eight letters and numbers, upper case", () => {
    expect(normaliseFriendToken("rm7q2kwd")).toBe("RM7Q2KWD");
    expect(normaliseFriendToken(" RM7Q-2KWD ")).toBe("RM7Q2KWD");
  });
  it("refuses anything else, a family code included", () => {
    expect(normaliseFriendToken("RS4HNT")).toBe("");
    expect(normaliseFriendToken("RM7Q2KWDX")).toBe("");
    expect(normaliseFriendToken(undefined)).toBe("");
  });
});

describe("readFriendLink", () => {
  it("reads the link the phone does", async () => {
    answers.friend_link_read = ok([{ teller_name: "Rose", teller_last_name: "Miller", sender_name: "Jamie", friend_name: "Peggy", story_id: "s1" }]);
    const r = await readFriendLink("rm7q2kwd");
    expect(calls).toEqual([{ name: "friend_link_read", args: { p_token: "RM7Q2KWD" } }]);
    expect(r).toEqual({ ok: true, link: { tellerName: "Rose", tellerLastName: "Miller", senderName: "Jamie", friendName: "Peggy", storyId: "s1" } });
  });
  it("a token that can't be one never reaches the server", async () => {
    expect(await readFriendLink("abc")).toEqual({ ok: false, error: "not_found" });
    expect(calls).toHaveLength(0);
  });
  it("no row is a link that doesn't work", async () => {
    answers.friend_link_read = ok([]);
    expect(await readFriendLink("RM7Q2KWD")).toEqual({ ok: false, error: "not_found" });
  });
  it("tells a database without friends from a dropped connection", async () => {
    answers.friend_link_read = fail("PGRST202");
    expect(await readFriendLink("RM7Q2KWD")).toEqual({ ok: false, error: "not_ready" });
    answers.friend_link_read = fail("", "Failed to fetch");
    expect(await readFriendLink("RM7Q2KWD")).toEqual({ ok: false, error: "offline" });
    answers.friend_link_read = () => Promise.reject(new TypeError("Failed to fetch"));
    expect(await readFriendLink("RM7Q2KWD")).toEqual({ ok: false, error: "offline" });
  });
});

describe("acceptFriendLink", () => {
  it("takes it and answers with the story", async () => {
    answers.friend_link_accept = ok("s1");
    expect(await acceptFriendLink("RM7Q2KWD")).toEqual({ ok: true, storyId: "s1" });
    expect(calls[0]).toEqual({ name: "friend_link_accept", args: { p_token: "RM7Q2KWD" } });
  });
  it("a used or expired link reads as not found", async () => {
    answers.friend_link_accept = fail("P0001", "not found or expired");
    expect(await acceptFriendLink("RM7Q2KWD")).toEqual({ ok: false, error: "not_found" });
  });
});

describe("the page's words", () => {
  it("names the teller, the sender and the friend", () => {
    const n = friendLinkNames({ tellerName: "Rose", tellerLastName: "Miller", senderName: "Jamie", friendName: "Peggy", storyId: "s1" }, "Margaret");
    expect(n).toEqual({ teller: "Rose", tellerFull: "Rose Miller", sender: "Jamie", keeper: "Jamie", you: "Peggy" });
  });
  it("falls back to plain words, never a made-up name", () => {
    const n = friendLinkNames({ tellerName: "", tellerLastName: "", senderName: "The family", friendName: "", storyId: "s1" }, "Margaret");
    expect(n).toEqual({ teller: "them", tellerFull: "them", sender: "", keeper: "the family", you: "Margaret" });
  });
  it("says what to do for each way a link fails", () => {
    expect(friendLinkTrouble("offline")).toMatch(/connected/);
    expect(friendLinkTrouble("not_ready")).toMatch(/switched on/);
    expect(friendLinkTrouble("not_found")).toMatch(/new one/);
  });
});
