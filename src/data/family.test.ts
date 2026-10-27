// The tree's admins and settling two stories about one person (answer, undo), as the phone does them.
import { beforeEach, describe, expect, it, vi } from "vitest";

type Answer = { data: unknown; error: { code?: string; message: string } | null };
const calls: { name: string; args: unknown }[] = [];
let answers: Record<string, () => Promise<Answer>> = {};
const query: string[] = [];

const builder = () => {
  const b = {
    select: (s: string) => (query.push(`select ${s}`), b),
    eq: (k: string, v: unknown) => (query.push(`eq ${k} ${v}`), b),
    gte: (k: string) => (query.push(`gte ${k}`), b),
    order: () => (answers.story_merges ?? (() => Promise.resolve({ data: [], error: null })))(),
  };
  return b;
};

vi.mock("../lib/supabase", () => ({
  supabase: () => ({
    rpc: (name: string, args?: unknown) => {
      calls.push({ name, args });
      return (answers[name] ?? (() => Promise.resolve({ data: null, error: null })))();
    },
    from: (table: string) => (query.push(`from ${table}`), builder()),
  }),
}));

import { rowToPerson } from "../app-core/data/familyRows.js";
import {
  answerStoryMerge,
  askedPairs,
  canRemoveAdmin,
  mergeWords,
  recentMerges,
  setTreeAdmin,
  storyPairs,
  treeAdmins,
  undoStoryMerge,
  type Family,
  type StoryPair,
} from "./family";

const ok = (data: unknown) => () => Promise.resolve({ data, error: null });
const fail = (code: string, message = "") => () => Promise.resolve({ data: null, error: { code, message } });

beforeEach(() => {
  calls.length = 0;
  query.length = 0;
  answers = {};
});

const person = (id: string, extra: Record<string, unknown> = {}) => rowToPerson({ id, given_name: id, household_id: "h1", ...extra });
const family = (admins: string[] = []): Family => ({
  people: [
    person("Linh", { user_id: "u-linh" }),
    person("Bao", { user_id: "u-bao" }),
    person("Sam", { user_id: "u-sam" }),
    person("Rose"),
    person("Elsewhere", { user_id: "u-far", household_id: "h2" }),
    person("Ghost", { user_id: "u-ghost", source: "placeholder" }),
  ],
  edges: [],
  households: [
    { id: "h1", createdBy: "u-linh", admins },
    { id: "h2", createdBy: "u-far", admins: [] },
  ],
});

describe("treeAdmins", () => {
  it("whoever started the tree is an admin, first and once", () => {
    const v = treeAdmins(family(["u-bao", "u-linh"]), "u-bao");
    expect(v.householdId).toBe("h1");
    expect(v.organizerId).toBe("u-linh");
    expect(v.adminIds).toEqual(["u-linh", "u-bao"]);
    expect(v.iAmAdmin).toBe(true);
  });
  it("offers only people in this tree with an account who aren't admins yet", () => {
    const v = treeAdmins(family(), "u-linh");
    expect(v.candidates.map((p) => p.userId)).toEqual(["u-bao", "u-sam"]);
  });
  it("somebody who isn't an admin may change nothing", () => {
    const v = treeAdmins(family(["u-bao"]), "u-sam");
    expect(v.iAmAdmin).toBe(false);
    expect(canRemoveAdmin(v, "u-bao")).toBe(false);
  });
  it("never the organizer, never the last admin", () => {
    const v = treeAdmins(family(["u-bao"]), "u-linh");
    expect(canRemoveAdmin(v, "u-linh")).toBe(false);
    expect(canRemoveAdmin(v, "u-bao")).toBe(true);
    expect(canRemoveAdmin(treeAdmins(family(), "u-linh"), "u-linh")).toBe(false);
  });
  it("copes with no family at all", () => {
    expect(treeAdmins(null, "u-linh")).toEqual({ householdId: null, organizerId: null, adminIds: [], iAmAdmin: false, candidates: [] });
  });
});

describe("setTreeAdmin", () => {
  it("adds and removes through the phone's functions", async () => {
    answers.add_tree_admin = ok(true);
    answers.remove_tree_admin = ok(true);
    expect(await setTreeAdmin("h1", "u-bao", true)).toEqual({ ok: true });
    expect(await setTreeAdmin("h1", "u-bao", false)).toEqual({ ok: true });
    expect(calls).toEqual([
      { name: "add_tree_admin", args: { hid: "h1", uid: "u-bao" } },
      { name: "remove_tree_admin", args: { hid: "h1", uid: "u-bao" } },
    ]);
  });
  it("says why the database said no", async () => {
    answers.add_tree_admin = ok(false);
    answers.remove_tree_admin = ok(false);
    expect(await setTreeAdmin("h1", "u-bao", true)).toEqual({ ok: false, error: "Only an admin can make another admin." });
    expect(await setTreeAdmin("h1", "u-linh", false)).toMatchObject({ ok: false, error: expect.stringMatching(/at least one admin/) });
  });
  it("a database without tree admins says so, and nobody to choose sends nothing", async () => {
    answers.add_tree_admin = fail("PGRST202");
    expect(await setTreeAdmin("h1", "u-bao", true)).toMatchObject({ ok: false, error: expect.stringMatching(/switched on/) });
    calls.length = 0;
    expect(await setTreeAdmin(null, "u-bao", true)).toMatchObject({ ok: false });
    expect(calls).toHaveLength(0);
  });
});

const pair = (extra: Partial<StoryPair> = {}): StoryPair => ({
  mine: "s1",
  other: "s2",
  name: "Rose",
  lastName: "Miller",
  otherKeeper: "Linh",
  mineMemories: 4,
  otherMemories: 2,
  mergeId: "mg1",
  mergeStatus: "proposed",
  proposedByMe: false,
  ...extra,
});

describe("two stories about one person", () => {
  it("reads my_duplicate_stories as the phone does", async () => {
    answers.my_duplicate_stories = ok([{ mine: "s1", other: "s2", name: "Rose", last_name: "Miller", other_keeper: "Linh", mine_memories: "4", other_memories: 2, merge_id: "mg1", merge_status: "proposed", proposed_by_me: false }]);
    expect(await storyPairs()).toEqual([pair()]);
  });
  it("a database without it has nothing to settle", async () => {
    answers.my_duplicate_stories = fail("PGRST202");
    expect(await storyPairs()).toEqual([]);
  });
  it("shows only pairs somebody has asked about", () => {
    const list = [pair(), pair({ mergeStatus: null, mergeId: null }), pair({ mergeStatus: "declined" })];
    expect(askedPairs(list)).toEqual([pair()]);
  });
  it("the words: theirs to answer, mine to wait on", () => {
    expect(mergeWords(pair())).toMatchObject({ title: "Linh asks to put Rose’s stories together", answer: true });
    expect(mergeWords(pair()).body).toMatch(/undo it for 30 days/);
    expect(mergeWords(pair({ proposedByMe: true }))).toMatchObject({ title: "Waiting for Linh", answer: false });
    // nobody named: they, never a guessed name
    expect(mergeWords(pair({ proposedByMe: true, otherKeeper: "" })).body).toMatch(/the next time they open A Story/);
  });
  it("answers yes and no through answer_story_merge", async () => {
    answers.answer_story_merge = ok("done");
    expect(await answerStoryMerge("mg1", true)).toEqual({ ok: true, status: "done" });
    expect(calls[0]).toEqual({ name: "answer_story_merge", args: { mid: "mg1", yes: true } });
    answers.answer_story_merge = fail("42501");
    expect(await answerStoryMerge("mg1", false)).toMatchObject({ ok: false });
  });
  it("lists the last 30 days' merges and undoes one", async () => {
    answers.story_merges = ok([{ id: "mg1", done_at: "2026-10-20T10:00:00Z", keep: { name: "Rose" }, fold: { name: "Rosie" } }]);
    expect(await recentMerges(Date.parse("2026-10-27T10:00:00Z"))).toEqual([{ id: "mg1", name: "Rose", doneAt: "2026-10-20T10:00:00Z" }]);
    expect(query).toContain("from story_merges");
    expect(query).toContain("eq status done");
    answers.undo_story_merge = ok(true);
    await expect(undoStoryMerge("mg1")).resolves.toBeUndefined();
    expect(calls.at(-1)).toEqual({ name: "undo_story_merge", args: { mid: "mg1" } });
    answers.undo_story_merge = ok(false);
    await expect(undoStoryMerge("mg1")).rejects.toThrow();
  });
});
