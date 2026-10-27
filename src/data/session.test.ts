// The sign-in links: run once and shared, waited for briefly by the first load, and the contributions a
// visitor sent before they had an account claimed once there is one.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Answer = { data: unknown; error: { code: string; message: string } | null };
const calls: { name: string; args: unknown }[] = [];
let answers: Record<string, () => Promise<Answer>> = {};

vi.mock("../lib/supabase", () => ({
  getSupabase: () => ({
    rpc: (name: string, args?: unknown) => {
      calls.push({ name, args });
      return (answers[name] ?? (() => Promise.resolve({ data: 0, error: null })))();
    },
  }),
}));

import { afterSignIn, claimContributions, linkedAnything, linkPersonStory, pendingClaims, rememberClaim, settleSignIn } from "./session";

const ok = (data: unknown) => () => Promise.resolve({ data, error: null });

beforeEach(() => {
  calls.length = 0;
  answers = {};
  localStorage.clear();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("afterSignIn", () => {
  it("accepts invites, claims places and contributions, and says what it linked", async () => {
    rememberClaim({ id: "c1", name: "Rose", email: "Rose@Example.com " });
    answers = { accept_story_invites: ok(1), claim_people: ok(0), claim_contributions: ok(1) };
    const e = await afterSignIn("u1", "rose@example.com");
    expect(e).toEqual({ invitesAccepted: 1, placesClaimed: 0, contributionsClaimed: 1 });
    expect(linkedAnything(e)).toBe(true);
    expect(calls.find((c) => c.name === "claim_contributions")?.args).toEqual({ p_ids: ["c1"] });
  });

  it("is one run for everyone who asks while it is under way", async () => {
    const a = afterSignIn("u2");
    const b = afterSignIn("u2");
    expect(a).toBe(b);
    await a;
    expect(calls.filter((c) => c.name === "accept_story_invites")).toHaveLength(1);
  });

  it("never stops a sign-in: an older database is nothing linked", async () => {
    answers = { accept_story_invites: () => Promise.resolve({ data: null, error: { code: "PGRST202", message: "missing" } }) };
    const e = await afterSignIn("u3");
    expect(e.invitesAccepted).toBe(0);
    expect(linkedAnything(e)).toBe(false);
  });
});

describe("settleSignIn", () => {
  it("answers at once when no run is under way", async () => {
    expect(await settleSignIn("nobody", 10)).toEqual({ effects: null, late: null });
  });

  it("hands over the effects when they come in time", async () => {
    answers = { accept_story_invites: ok(2) };
    void afterSignIn("u4");
    const w = await settleSignIn("u4", 1000);
    expect(w.late).toBeNull();
    expect(w.effects?.invitesAccepted).toBe(2);
  });

  it("stops waiting at the cap and hands over the run still going, to reload from", async () => {
    let land!: (a: Answer) => void;
    answers = { claim_people: () => new Promise<Answer>((r) => (land = r)) };
    void afterSignIn("u5");
    const w = await settleSignIn("u5", 5);
    expect(w.effects).toBeNull();
    expect(w.late).not.toBeNull();
    land({ data: 1, error: null });
    expect((await w.late!).placesClaimed).toBe(1);
  });
});

describe("contributions waiting to be claimed", () => {
  it("holds each one once, and lets them go after a month", () => {
    rememberClaim({ id: "a" });
    rememberClaim({ id: "a" });
    rememberClaim({ id: "b" });
    expect(pendingClaims().map((c) => c.id)).toEqual(["a", "b"]);
    expect(pendingClaims(Date.now() + 31 * 24 * 60 * 60 * 1000)).toEqual([]);
    expect(pendingClaims()).toEqual([]);
  });

  it("asks the server only when something is waiting, and keeps them when it refused", async () => {
    expect(await claimContributions("a@example.com")).toBe(0);
    expect(calls).toHaveLength(0);
    rememberClaim({ id: "a", email: "a@example.com" });
    answers = { claim_contributions: () => Promise.resolve({ data: null, error: { code: "500", message: "down" } }) };
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await claimContributions("a@example.com")).toBe(0);
    expect(pendingClaims()).toHaveLength(1);
    answers = { claim_contributions: ok(1) };
    expect(await claimContributions("A@example.com")).toBe(1);
    expect(pendingClaims()).toHaveLength(0);
  });

  it("claims only what was sent under the signed-in address (a shared computer)", async () => {
    rememberClaim({ id: "mine", email: "bao@example.com" });
    rememberClaim({ id: "theirs", email: "hoa@example.com" });
    rememberClaim({ id: "nobody" });
    answers = { claim_contributions: ok(1) };
    expect(await claimContributions(null)).toBe(0);
    expect(calls).toHaveLength(0);
    expect(await claimContributions("Bao@Example.com")).toBe(1);
    expect(calls[0].args).toEqual({ p_ids: ["mine"] });
    expect(pendingClaims().map((c) => c.id)).toEqual(["theirs", "nobody"]);
  });
});

describe("linkPersonStory", () => {
  it("binds the place to the story", async () => {
    expect(await linkPersonStory("p", "s")).toBe(true);
    expect(calls[0]).toEqual({ name: "link_person_story", args: { pid: "p", sid: "s" } });
  });
  it("is nothing on an older database, and a refusal otherwise", async () => {
    answers = { link_person_story: () => Promise.resolve({ data: null, error: { code: "42883", message: "missing" } }) };
    expect(await linkPersonStory("p", "s")).toBe(false);
    answers = { link_person_story: () => Promise.resolve({ data: null, error: { code: "42501", message: "denied" } }) };
    await expect(linkPersonStory("p", "s")).rejects.toMatchObject({ code: "42501" });
  });
});
