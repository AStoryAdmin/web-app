// The link to one memory: its shape, its message, who can be asked, and the call that makes it.
import { beforeEach, describe, expect, it, vi } from "vitest";

type Answer = { data: unknown; error: { code?: string; message: string } | null };
const calls: { name: string; args: unknown }[] = [];
let answer: () => Promise<Answer> = () => Promise.resolve({ data: null, error: null });
let configured = true;

vi.mock("../lib/supabase", () => ({
  getSupabase: () =>
    configured
      ? {
          rpc: (name: string, args?: unknown) => {
            calls.push({ name, args });
            return answer();
          },
        }
      : null,
}));

import { askablePeople, linkProblem, memoryLink, memoryLinkFor, memoryLinkMessage, normaliseMemoryToken, personForName, tokenFrom } from "./memoryLinks";
import type { Person } from "./family";

beforeEach(() => {
  calls.length = 0;
  configured = true;
  answer = () => Promise.resolve({ data: null, error: null });
});

describe("the token and the link", () => {
  it("keeps ten letters and digits, upper case, and nothing else", () => {
    expect(normaliseMemoryToken("k7px-2qhm 4d")).toBe("K7PX2QHM4D");
    expect(normaliseMemoryToken("RS4HNT")).toBe("");
    expect(normaliseMemoryToken("RM7Q2KWD")).toBe("");
    expect(normaliseMemoryToken(null)).toBe("");
  });

  it("writes …/m/<token>, never a link for a token that isn't one", () => {
    expect(memoryLink("https://astoryapp.com/", "k7px2qhm4d")).toBe("https://astoryapp.com/m/K7PX2QHM4D");
    expect(memoryLink("https://astoryapp.com", "short")).toBe("");
  });

  it("reads the token from a bare string, a row or a one-row table", () => {
    expect(tokenFrom("K7PX2QHM4D")).toBe("K7PX2QHM4D");
    expect(tokenFrom({ token: "K7PX2QHM4D" })).toBe("K7PX2QHM4D");
    expect(tokenFrom([{ token: "K7PX2QHM4D" }])).toBe("K7PX2QHM4D");
    expect(tokenFrom(null)).toBe("");
  });
});

describe("memoryLinkMessage", () => {
  const link = "https://astoryapp.com/m/K7PX2QHM4D";

  it("names the memory and whose story it is, signed with the asker's first name", () => {
    const m = memoryLinkMessage({ link, title: "The wedding, in the rain", tellerName: "Rose", senderName: "Jamie Miller", toName: "Linh Tran" });
    expect(m).toBe(
      ["Linh, I’m keeping Rose’s stories on A Story. Were you there for “The wedding, in the rain”?", "", `Add what you remember, written or in your own voice: ${link}`, "", "— Jamie"].join("\n"),
    );
  });

  it("says 'my' when the asker is the storyteller, and has no greeting or sign-off without names", () => {
    const m = memoryLinkMessage({ link, senderIsTeller: true });
    expect(m).toBe(["I’m keeping my stories on A Story. Were you there for this one?", "", `Add what you remember, written or in your own voice: ${link}`].join("\n"));
  });
});

describe("askablePeople", () => {
  const p = (over: Partial<Person> & { id: string }) => ({ givenName: "", familyName: "", source: "manual", householdId: "h1", ...over }) as unknown as Person;
  const people = [
    p({ id: "a", givenName: "Linh", familyName: "Tran" }),
    p({ id: "b", givenName: "Rose", familyName: "Miller", storyId: "s1" }),
    p({ id: "c", givenName: "Jamie", userId: "me" }),
    p({ id: "d", givenName: "Walter", deathYear: 1990 }),
    p({ id: "e", givenName: "Unknown", source: "placeholder" }),
    p({ id: "f", givenName: "Bao", householdId: "h2" }),
    p({ id: "g", givenName: "Peggy", email: "ME@example.com" }),
    p({ id: "h", givenName: "Anh" }),
  ];

  it("leaves out the asker, the storyteller, the dead, placeholders and other households", () => {
    const list = askablePeople(people, { householdId: "h1", tellerStoryId: "s1", meId: "me", meEmail: "me@example.com" });
    expect(list).toEqual([
      { id: "h", name: "Anh" },
      { id: "a", name: "Linh Tran" },
    ]);
  });

  it("matches a typed name to exactly one person, or none", () => {
    const list = [
      { id: "a", name: "Linh Tran" },
      { id: "b", name: "Anh" },
      { id: "c", name: "Anh" },
    ];
    expect(personForName(list, "  linh   TRAN ")).toEqual({ id: "a", name: "Linh Tran" });
    expect(personForName(list, "Anh")).toBeNull();
    expect(personForName(list, "")).toBeNull();
  });
});

describe("memoryLinkFor", () => {
  it("asks memory_link_create for the memory, named for the person, and builds the link", async () => {
    answer = () => Promise.resolve({ data: "K7PX2QHM4D", error: null });
    const made = await memoryLinkFor({ memoryId: "m1", forName: "  Linh Tran ", personId: "a" });
    expect(calls).toEqual([{ name: "memory_link_create", args: { p_memory: "m1", p_for_name: "Linh Tran", p_person: "a", p_friend: null } }]);
    expect(made).toEqual({ token: "K7PX2QHM4D", link: "https://astoryapp.com/m/K7PX2QHM4D" });
  });

  it("says 'not ready' when the server half isn't there, and offline when the call throws", async () => {
    answer = () => Promise.resolve({ data: null, error: { code: "PGRST202", message: "no function" } });
    expect(await memoryLinkFor({ memoryId: "m1" })).toEqual({ error: "not_ready" });
    answer = () => Promise.reject(new Error("Failed to fetch"));
    expect(await memoryLinkFor({ memoryId: "m1" })).toEqual({ error: "offline" });
    configured = false;
    expect(await memoryLinkFor({ memoryId: "m1" })).toEqual({ error: "not_ready" });
  });

  it("fails without a memory or without a token back, and never calls for no memory", async () => {
    expect(await memoryLinkFor({ memoryId: "" })).toEqual({ error: "failed" });
    expect(calls).toHaveLength(0);
    answer = () => Promise.resolve({ data: null, error: null });
    expect(await memoryLinkFor({ memoryId: "m1" })).toEqual({ error: "failed" });
  });

  it("has a plain sentence for every failure", () => {
    expect(linkProblem("not_ready")).toMatch(/switched on/);
    expect(linkProblem("offline")).toMatch(/offline/);
    expect(linkProblem("failed")).toMatch(/Try once more/);
  });
});
