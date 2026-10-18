/**
 * The family tree: people, how they are related, and the household (tree)
 * they belong to. Mirrors phone-app/src/data/family.js loadFamily(); the
 * row mappers are the app's own (app-core/data/familyRows.js).
 *
 * Row-level security lets anyone on one of a household's stories read and
 * add to its tree, which is what lets co-managers see the same people.
 *
 * Below the loader: the rules that keep one person from being listed twice
 * (an email or a name already in the household, merge_people), and the two
 * kinds of asking that wait for somebody's yes: asking to join a story
 * (story_join_requests) and suggesting a change to somebody's details
 * (person_suggestions). docs/PRD.md §3.3a.
 */
import { supabase } from "../lib/supabase";
import { rowToPerson, rowToEdge } from "../app-core/data/familyRows.js";

export type Person = ReturnType<typeof rowToPerson>;
export type Edge = ReturnType<typeof rowToEdge>;

export type Household = { id: string; createdBy: string | null; admins: string[] };

export type Family = { people: Person[]; edges: Edge[]; households: Household[] };

// The table isn't there: family.sql hasn't been run on this database.
const missingTable = (e: { code?: string } | null) => !!e && ["42P01", "PGRST205"].includes(e.code || "");
const missingFunction = (e: { code?: string } | null) => !!e && ["PGRST202", "42883"].includes(e.code || "");
const notThere = (e: { code?: string } | null) => missingTable(e) || missingFunction(e);

type Row = Record<string, unknown>;

/** Null when the family tables are absent, so the Family page keeps its empty state. */
export async function loadFamily(): Promise<Family | null> {
  const sb = supabase();
  const [people, edges, households, admins] = await Promise.all([
    sb.from("people").select("*").order("created_at", { ascending: true }),
    sb.from("relationships").select("*"),
    sb.from("households").select("id, created_by"),
    // A database without tree_admins.sql answers with an error; the organizer alone is admin.
    sb.from("household_admins").select("household_id, user_id"),
  ]);
  const err = people.error || edges.error;
  if (err) {
    if (!missingTable(err)) console.warn("loadFamily:", err.message || err);
    return null;
  }
  type AdminRow = { household_id: string; user_id: string };
  const adminRows = (admins.data || []) as AdminRow[];
  return {
    people: (people.data || []).map(rowToPerson),
    edges: (edges.data || []).map(rowToEdge),
    households: ((households.data || []) as { id: string; created_by: string | null }[]).map((h) => ({
      id: h.id,
      createdBy: h.created_by || null,
      admins: adminRows.filter((a) => a.household_id === h.id).map((a) => a.user_id),
    })),
  };
}

/* ── One person, never twice ───────────────────────────────────────────── */

/** Lower-case, accents off, one space: the way two typed names are compared. */
export const foldName = (s: string | null | undefined): string =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const notPlaceholder = (p: Person) => p.source !== "placeholder";

/**
 * The person already in the household with this email, if any. The
 * database keeps one email per household (people_household_email_key), and
 * savePerson answers a clash by dropping the email rather than failing, so
 * this must be asked BEFORE a row is written or the family gets a second
 * copy with no email on it.
 */
export function findPersonByEmail(family: Family | null, email: string, householdId?: string | null): Person | null {
  const mail = email.trim().toLowerCase();
  if (!mail) return null;
  return (
    (family?.people || []).find(
      (p) => notPlaceholder(p) && String(p.email || "").trim().toLowerCase() === mail && (!householdId || !p.householdId || p.householdId === householdId),
    ) || null
  );
}

/** People with the same given and family name who are not on A Story (a likely second copy). */
export function sameNamePeople(family: Family | null, givenName: string, familyName: string): Person[] {
  const g = foldName(givenName);
  const f = foldName(familyName);
  if (!g) return [];
  return (family?.people || []).filter((p) => notPlaceholder(p) && !p.userId && foldName(p.givenName) === g && foldName(p.familyName) === f);
}

export type DuplicateGroup = { name: string; keep: Person; extras: Person[] };

/**
 * People listed twice: the same given and family name. Two accounts are two
 * people (two Lindas), so a group never holds more than one row with an
 * account. The account's own row stays if there is one, else the oldest
 * row bound to a story, else the one added first (`keep`); the rest are
 * `extras`, each with its own way out (duplicateFix). This is how the
 * founder's own row (account, no story) and the storyteller row (story, no
 * account) come back together as one person.
 */
export function duplicateGroups(people: Person[]): DuplicateGroup[] {
  const groups = new Map<string, Person[]>();
  for (const p of people) {
    if (!notPlaceholder(p) || !foldName(p.givenName)) continue;
    const key = `${foldName(p.givenName)}|${foldName(p.familyName)}`;
    groups.set(key, [...(groups.get(key) || []), p]);
  }
  const out: DuplicateGroup[] = [];
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    if (list.filter((p) => p.userId).length > 1) continue;
    const sorted = [...list].sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
    const keep = sorted.find((p) => p.userId) || sorted.find((p) => p.storyId) || sorted[0];
    out.push({ name: [keep.givenName, keep.familyName].filter(Boolean).join(" "), keep, extras: sorted.filter((p) => p.id !== keep.id) });
  }
  return out;
}

export type DuplicateFix = "merge" | "merge-stories" | "remove" | "none";

/**
 * How one extra row comes back into `keep`:
 * - "merge": merge_people folds it in (edges, tags, credits, a story only one has).
 * - "merge-stories": each has a story of its own, both kept by this account
 *   (the founder's three "Nhi Tran"s were three stories): propose_story_merge
 *   first, which also points both rows at the story that stays.
 * - "remove": both rows already point at one story, so merge_people refuses
 *   and taking the extra out of the tree loses nothing.
 * - "none": each has a story and one is kept by somebody else; only they can merge.
 */
export function duplicateFix(keep: Person, extra: Person, myStoryIds: string[]): DuplicateFix {
  if (keep.storyId && extra.storyId) {
    if (keep.storyId === extra.storyId) return "remove";
    return myStoryIds.includes(keep.storyId) && myStoryIds.includes(extra.storyId) ? "merge-stories" : "none";
  }
  return "merge";
}

/**
 * Two stories about one person become one (propose_story_merge). Done at
 * once when this account owns both; otherwise proposed, and the other
 * owner's yes finishes it. Memories, keepers and the tree move to `keep`.
 */
export async function proposeStoryMerge(keep: string, fold: string): Promise<{ ok: true; done: boolean } | { ok: false; error: string }> {
  const { data, error } = await supabase().rpc("propose_story_merge", { keep, fold });
  if (error) {
    if (missingFunction(error)) return { ok: false, error: "Merging stories isn't switched on for this family yet." };
    if (error.code === "42501") return { ok: false, error: "Only the owner of one of these stories can ask." };
    return { ok: false, error: "That didn't go through. Please try again." };
  }
  return { ok: true, done: data === "done" };
}

/**
 * Folds `fold` into `keep` (merge_people): edges, tags and credits move
 * across; `keep` keeps its id. The database refuses two accounts or two
 * stories in one pair. { ok } or { ok: false, error }.
 */
export async function mergePeople(keep: string, fold: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await supabase().rpc("merge_people", { keep, fold });
  if (error) {
    if (missingFunction(error)) return { ok: false, error: "Merging isn't switched on for this family yet." };
    return { ok: false, error: "That didn't go through. Please try again." };
  }
  return data ? { ok: true } : { ok: false, error: "Only somebody who looks after both of them can merge them." };
}

/* ── Asking to join a story (story_join_requests) ──────────────────────── */

export type JoinRequest = {
  id: string;
  storyId: string;
  requester: string;
  requesterName: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
};

const rowToJoinRequest = (r: Row): JoinRequest => ({
  id: r.id as string,
  storyId: r.story_id as string,
  requester: r.requester as string,
  requesterName: (r.requester_name as string) || "",
  status: ((r.status as string) || "pending") as JoinRequest["status"],
  createdAt: r.created_at as string,
});

/** What's been asked of one story, for its keepers. Empty on a database without the table. */
export async function listJoinRequests(storyId: string): Promise<JoinRequest[]> {
  const { data, error } = await supabase().from("story_join_requests").select("*").eq("story_id", storyId).eq("status", "pending").order("created_at", { ascending: false });
  if (error) {
    // a database without the table has nothing to ask; any other failure is a failure, and the page says so
    if (notThere(error)) return [];
    console.warn("listJoinRequests:", error.message || error);
    throw error;
  }
  return (data || []).map(rowToJoinRequest);
}

/** What this account has asked and is still waiting on. */
export async function listMyJoinRequests(userId: string): Promise<JoinRequest[]> {
  const { data, error } = await supabase().from("story_join_requests").select("*").eq("requester", userId).eq("status", "pending").order("created_at", { ascending: false });
  if (error) {
    if (notThere(error)) return [];
    console.warn("listMyJoinRequests:", error.message || error);
    throw error;
  }
  return (data || []).map(rowToJoinRequest);
}

/** A keeper says yes or no (answer_story_join). Yes makes them an active keeper. */
export async function answerJoinRequest(id: string, yes: boolean): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await supabase().rpc("answer_story_join", { rid: id, yes });
  if (error) {
    if (missingFunction(error)) return { ok: false, error: "Answering isn't switched on for this family yet." };
    if (error.code === "42501") return { ok: false, error: "Only a keeper of this story can answer." };
    return { ok: false, error: "That didn't go through. Please try again." };
  }
  return data ? { ok: true } : { ok: false, error: "That request was already answered." };
}

/** "Ask to join": only somebody already in the story's family (request_story_join). */
export async function requestStoryJoin(storyId: string, myName: string): Promise<{ ok: true; already: boolean } | { ok: false; error: string }> {
  const { data, error } = await supabase().rpc("request_story_join", { sid: storyId, my_name: myName.slice(0, 60) });
  if (error) {
    if (missingFunction(error)) return { ok: false, error: "Asking isn't switched on for this family yet." };
    if (error.code === "42501") return { ok: false, error: "You can only ask to join a story kept in your own family. Ask them for their code instead." };
    return { ok: false, error: "That didn't send. Please try again." };
  }
  return { ok: true, already: data === "already" };
}

export type StoryCard = { id: string; name: string; lastName: string; keeperName: string; memories: number; isKeeper: boolean; asked: boolean };

/** What a relative may know about a story they can't open (story_card). Null when they may not. */
export async function storyCard(storyId: string): Promise<StoryCard | null> {
  const { data, error } = await supabase().rpc("story_card", { sid: storyId });
  if (error || !data) return null;
  const r = data as Row;
  return {
    id: r.id as string,
    name: (r.name as string) || "",
    lastName: (r.last_name as string) || "",
    keeperName: (r.keeper_name as string) || "",
    memories: Number(r.memories) || 0,
    isKeeper: !!r.is_keeper,
    asked: !!r.asked,
  };
}

/* ── Suggesting a change to somebody's details (person_suggestions) ───── */

export type Suggestion = {
  id: string;
  personId: string;
  householdId: string;
  field: string;
  value: string;
  note: string;
  by: string | null;
  byName: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
};

const rowToSuggestion = (r: Row): Suggestion => ({
  id: r.id as string,
  personId: r.person_id as string,
  householdId: r.household_id as string,
  field: r.field as string,
  value: r.value as string,
  note: (r.note as string) || "",
  by: (r.suggested_by as string) || null,
  byName: (r.suggested_by_name as string) || "Somebody in the family",
  status: ((r.status as string) || "pending") as Suggestion["status"],
  createdAt: r.created_at as string,
});

/** Every suggestion still waiting in the households this account can read. The caller sorts out who may answer which. */
export async function listPendingSuggestions(): Promise<Suggestion[]> {
  const { data, error } = await supabase().from("person_suggestions").select("*").eq("status", "pending").order("created_at", { ascending: false });
  if (error) {
    if (notThere(error)) return [];
    console.warn("listPendingSuggestions:", error.message || error);
    throw error;
  }
  return (data || []).map(rowToSuggestion);
}

/** Marks one accepted or declined. Accepting is the caller's to apply to the person first (savePerson). */
export async function resolveSuggestion(id: string, accepted: boolean, userId: string): Promise<void> {
  const { data, error } = await supabase()
    .from("person_suggestions")
    .update({ status: accepted ? "accepted" : "declined", resolved_by: userId, resolved_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("Only whoever looks after them can answer this.");
}
