// The family's link for a visitor with no account (read, add), and the welcome after a join.
import { beforeEach, describe, expect, it, vi } from "vitest";

type Answer = { data: unknown; error: { code?: string; message: string } | null };
const calls: { name: string; args: unknown }[] = [];
let answers: Record<string, () => Promise<Answer>> = {};

vi.mock("../lib/supabase", () => ({
  getSupabase: () => ({
    rpc: (name: string, args?: unknown) => {
      calls.push({ name, args });
      return (answers[name] ?? (() => Promise.resolve({ data: null, error: null })))();
    },
  }),
}));

import { addedAnswer, holdJoined, joinedWords, linkFailure, linkFromRead, linkMemoryArgs, openingLine, readFamilyLink, readJoined, sendMemoryByLink } from "./familyLink";

const ok = (data: unknown) => () => Promise.resolve({ data, error: null });
const fail = (code: string, message = "") => () => Promise.resolve({ data: null, error: { code, message } });

const READ = {
  story_id: "s1",
  name: "Rose",
  last_name: "Miller",
  photo_url: null,
  birth_year: 1941,
  sender_name: "Jamie",
  memories: [
    { id: "m1", title: "The kitchen", body: "We had a blue kitchen on Elm Street. It smelled of bread.", created_at: "2026-10-01T10:00:00Z", via: "written" },
    { id: "m2", title: "The farm", body: "My father kept two cows and a very bad-tempered goose.", created_at: "2026-10-20T10:00:00Z", contributor: "Linh, her daughter", via: "link" },
    { title: "no id, never shown" },
  ],
};

beforeEach(() => {
  calls.length = 0;
  answers = {};
  sessionStorage.clear();
});

describe("linkFromRead", () => {
  it("reads the story, who sent it and its shared memories", () => {
    const link = linkFromRead(READ, "RS4HNT")!;
    expect(link).toMatchObject({ code: "RS4HNT", storyId: "s1", name: "Rose", lastName: "Miller", birthYear: "1941", senderName: "Jamie", photo: null });
    expect(link.memories.map((m) => m.id)).toEqual(["m1", "m2"]);
    expect(link.memories[1]).toMatchObject({ contributor: "Linh, her daughter", via: "link", createdAt: "2026-10-20T10:00:00Z" });
  });
  it("is null for a code that opens no story", () => {
    expect(linkFromRead(null, "RS4HNT")).toBeNull();
    expect(linkFromRead({ name: "Rose" }, "RS4HNT")).toBeNull();
  });
});

describe("readFamilyLink", () => {
  it("asks family_link_read with the code as the server reads it", async () => {
    answers = { family_link_read: ok(READ) };
    const r = await readFamilyLink("rs4-hnt");
    expect(calls).toEqual([{ name: "family_link_read", args: { p_code: "RS4HNT" } }]);
    expect("error" in r ? r.error : r.name).toBe("Rose");
  });
  it("says not_found, not_ready or offline, and never throws", async () => {
    expect(await readFamilyLink("")).toEqual({ error: "not_found" });
    answers = { family_link_read: ok(null) };
    expect(await readFamilyLink("RS4HNT")).toEqual({ error: "not_found" });
    answers = { family_link_read: fail("PGRST202") };
    expect(await readFamilyLink("RS4HNT")).toEqual({ error: "not_ready" });
    answers = { family_link_read: () => Promise.reject(new TypeError("Failed to fetch")) };
    expect(await readFamilyLink("RS4HNT")).toEqual({ error: "offline" });
  });
});

describe("linkFailure", () => {
  it("names the four kinds", () => {
    expect(linkFailure({ code: "42883" })).toBe("not_ready");
    expect(linkFailure({ message: "TypeError: Failed to fetch" })).toBe("offline");
    expect(linkFailure({ code: "P0001", message: "link not found" })).toBe("failed");
    expect(linkFailure(null)).toBe("failed");
  });
});

describe("sending a memory by the link", () => {
  it("needs words and a name, and trims them to the server's lengths", () => {
    expect(linkMemoryArgs({ code: "RS4HNT", name: "Linh", body: "  " })).toEqual({ error: "Write what you remember first." });
    expect(linkMemoryArgs({ code: "RS4HNT", name: " ", body: "The goose." })).toEqual({ error: "Your name, so the family knows who this is from." });
    expect(linkMemoryArgs({ code: "rs4hnt", name: " Linh ", how: " Her niece ", body: " The goose. " })).toEqual({ p_code: "RS4HNT", p_name: "Linh", p_how: "Her niece", p_body: "The goose.", p_title: "" });
    const long = linkMemoryArgs({ code: "RS4HNT", name: "x".repeat(200), how: "y".repeat(200), body: "z".repeat(20000) }) as Record<string, string>;
    expect([long.p_name.length, long.p_how.length, long.p_body.length]).toEqual([120, 80, 10000]);
  });
  it("reads the new row's id from a row or a table", () => {
    expect(addedAnswer([{ id: "c1", status: "pending" }])).toEqual({ id: "c1", status: "pending" });
    expect(addedAnswer({ id: "c2" })).toEqual({ id: "c2", status: "pending" });
    expect(addedAnswer(null)).toEqual({ id: null, status: "pending" });
  });
  it("sends it with family_link_add_memory and hands back the id to claim", async () => {
    answers = { family_link_add_memory: ok([{ id: "c1", status: "pending" }]) };
    const r = await sendMemoryByLink({ code: "RS4HNT", name: "Linh", how: "her niece", body: "The goose." });
    expect(r).toEqual({ ok: true, id: "c1", status: "pending" });
    expect(calls[0]).toEqual({ name: "family_link_add_memory", args: { p_code: "RS4HNT", p_name: "Linh", p_how: "her niece", p_body: "The goose.", p_title: "" } });
  });
  it("says what went wrong, keeping the visitor's words", async () => {
    expect(await sendMemoryByLink({ code: "RS4HNT", name: "", body: "x" })).toEqual({ ok: false, error: "Your name, so the family knows who this is from." });
    expect(calls).toEqual([]);
    const quiet = vi.spyOn(console, "warn").mockImplementation(() => {});
    answers = { family_link_add_memory: fail("P0001", "link not found") };
    const gone = await sendMemoryByLink({ code: "RS4HNT", name: "Linh", body: "x" });
    expect(gone.ok ? "" : gone.error).toMatch(/run out/);
    answers = { family_link_add_memory: fail("PGRST202") };
    const off = await sendMemoryByLink({ code: "RS4HNT", name: "Linh", body: "x" });
    expect(off.ok ? "" : off.error).toMatch(/switched on/);
    answers = { family_link_add_memory: () => Promise.reject(new Error("boom")) };
    const thrown = await sendMemoryByLink({ code: "RS4HNT", name: "Linh", body: "x" });
    expect(thrown.ok).toBe(false);
    quiet.mockRestore();
  });
});

describe("the welcome after a join", () => {
  it("carries who invited them through the router state, or this tab's copy after a reload", () => {
    const w = holdJoined({ story_id: "s1", story_name: "Rose", inviter_name: "Jamie", person_name: "Linh Tran" });
    expect(readJoined(w)).toEqual({ storyId: "s1", storyName: "Rose", inviterName: "Jamie", personName: "Linh Tran" });
    expect(readJoined(null)).toEqual(w);
    sessionStorage.clear();
    expect(readJoined(undefined)).toBeNull();
    expect(readJoined({ something: "else" })).toBeNull();
  });
  it("names them, whose family it is and who invited them", () => {
    const welcome = { storyId: "s1", storyName: "Rose", inviterName: "Jamie Lee", personName: "Linh" };
    expect(joinedWords({ welcome, firstName: "Linh", teller: "Rose Miller" })).toEqual({
      kicker: "Rose Miller’s family",
      title: "You’re in, Linh",
      line: "Jamie invited you. You read what the family shares, and add what you remember under your own name.",
    });
  });
  it("leaves anyone the join doesn't name unnamed", () => {
    const words = joinedWords({ welcome: null });
    expect(words).toEqual({ kicker: "Your family", title: "You’re in", line: "You read what the family shares, and add what you remember under your own name." });
  });
  it("shows a memory by its kept line, else its opening, cut on a word", () => {
    expect(openingLine({ keptLine: "We had a blue kitchen.", body: "Something else entirely here." })).toBe("We had a blue kitchen.");
    expect(openingLine({ body: "Yes.\n\nMy father kept two cows and a very bad-tempered goose." })).toBe("My father kept two cows and a very bad-tempered goose.");
    expect(openingLine({ body: "word ".repeat(80) }, 40).endsWith("…")).toBe(true);
    expect(openingLine(null)).toBe("");
  });
});
