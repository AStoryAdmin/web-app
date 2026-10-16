/**
 * Changing the family: adding a person, inviting them, codes, and who keeps
 * a story. Mirrors phone-app/src/data/family.js, familyCodes.js and
 * collaborators.js, one record at a time.
 *
 * The rule decided on 2026-10-13 (phone-app LEAD-TODO): an invitation, by
 * email or by code, joins the FAMILY TREE. It never makes somebody a keeper
 * of a story; keepers are added only from "Who can edit", with
 * inviteManager(). Never promise story access from a code.
 */
import { supabase } from "../lib/supabase";
import { uuid } from "../lib/uuid";
import { personToRow, PERSON_FACT_COLUMNS } from "../app-core/data/familyRows.js";
import { writeDroppingMissing, classifySaveError } from "../app-core/lib/saveErrors.js";
import { normaliseFamilyCode, looksLikeFamilyCode } from "../app-core/lib/familyCode.js";
import type { Account } from "./stories";
import type { Family, Person } from "./family";

const missingFunction = (e: { code?: string } | null) => !!e && ["PGRST202", "42883"].includes(e.code || "");

type Row = Record<string, unknown>;

/* ── The household ─────────────────────────────────────────────────────── */

let householdCache: { userId: string | null; id: string | null } = { userId: null, id: null };

/**
 * The household new people go into: the one the active story is in, else
 * one anybody in the tree is already in, else one this account made, else
 * a new one (the app's householdFor).
 */
export async function householdFor(userId: string, account: Account | null, family: Family | null): Promise<string> {
  const stories = account?.stories ?? [];
  const active = stories.find((s) => s.id === account?.activeStoryId);
  const known =
    active?.householdId || stories.find((s) => s.householdId)?.householdId || family?.people.find((p) => p.householdId)?.householdId;
  if (known) return known;
  if (householdCache.userId === userId && householdCache.id) return householdCache.id;

  const sb = supabase();
  const { data: mine, error: findErr } = await sb
    .from("households")
    .select("id")
    .eq("created_by", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (findErr) throw findErr;
  let id: string | undefined = mine?.id;
  if (!id) {
    const lastName = stories.find((s) => s.lastName)?.lastName || "";
    const { data: made, error: makeErr } = await sb.from("households").insert({ name: lastName, created_by: userId }).select("id").single();
    if (makeErr) throw makeErr;
    id = made.id as string;
  }
  householdCache = { userId, id: id! };

  // Every story on this account belongs to the household, so the people on
  // those stories can see the tree. Only fills a gap.
  const loose = stories.filter((s) => !s.householdId).map((s) => s.id);
  if (loose.length) {
    const { error } = await sb.from("stories").update({ household_id: id }).in("id", loose).is("household_id", null);
    if (error) console.warn("householdFor: stories:", error.message);
  }
  return id!;
}

/* ── People ────────────────────────────────────────────────────────────── */

// Newer columns a database a migration behind may not have (the app's list).
const OPTIONAL_PEOPLE_COLUMNS = ["sex", "invited_at", "avatar_url", "external_ref", "source", "death_year", ...PERSON_FACT_COLUMNS];

export function newPerson(input: { givenName: string; familyName?: string; email?: string; birthYear?: string | number; sex?: string }): Person {
  return {
    id: uuid(),
    householdId: null,
    givenName: input.givenName.trim(),
    familyName: (input.familyName || "").trim(),
    sex: input.sex || "",
    ...(input.email ? { email: input.email.trim().toLowerCase() } : {}),
    ...(input.birthYear ? { birthYear: Number(input.birthYear) } : {}),
    source: "manual",
  } as Person;
}

/** Writes one person's row; an email already in the household gives up the email rather than failing. */
export async function savePerson(person: Person, householdId: string): Promise<void> {
  const sb = supabase();
  const row = personToRow(person, householdId) as Row;
  const upsert = (r: Row | Row[]) => sb.from("people").upsert(r, { onConflict: "id" });
  try {
    await writeDroppingMissing(row, upsert, OPTIONAL_PEOPLE_COLUMNS, OPTIONAL_PEOPLE_COLUMNS.length);
  } catch (err) {
    if ((err as { code?: string })?.code !== "23505") throw err;
    await writeDroppingMissing({ ...row, email: null }, upsert, OPTIONAL_PEOPLE_COLUMNS, OPTIONAL_PEOPLE_COLUMNS.length);
  }
}

export type EdgeKind = "parent" | "spouse" | "other";

/** from is the PARENT OF to for kind "parent" (relationships.sql fixes the direction). */
export async function saveEdge(householdId: string, from: string, to: string, kind: EdgeKind, label = ""): Promise<void> {
  const { error } = await supabase()
    .from("relationships")
    .upsert({ household_id: householdId, from_person: from, to_person: to, kind, label }, { onConflict: "from_person,to_person,kind", ignoreDuplicates: true });
  if (error) throw error;
}

export async function removePerson(personId: string): Promise<void> {
  const { error } = await supabase().from("people").delete().eq("id", personId);
  if (error) throw error;
}

/**
 * Marks somebody in the tree as invited and records their email
 * (people_permissions.sql invite_person); anyone in the family may. The
 * email itself goes by sendInviteEmail with a family code.
 */
export async function invitePerson(personId: string, email: string): Promise<void> {
  const { error } = await supabase().rpc("invite_person", { pid: personId, mail: email.trim().toLowerCase() });
  if (error && !missingFunction(error)) throw error;
}

/* ── Family codes ──────────────────────────────────────────────────────── */

export type CodeResult = { code: string } | { error: "already" | "not_ready" | "offline" | "failed" | "nothing" };

/** A code for a place in the tree (personId), a story's keepers (storyId), or both. */
export async function familyCodeFor({ personId = null, storyId = null }: { personId?: string | null; storyId?: string | null }): Promise<CodeResult> {
  if (!personId && !storyId) return { error: "nothing" };
  const { data, error } = await supabase().rpc("family_code_for", { pid: personId, sid: storyId });
  if (error) {
    console.warn("familyCodeFor:", error.message || error);
    if (missingFunction(error)) return { error: "not_ready" };
    if (/already on A Story/i.test(error.message || "")) return { error: "already" };
    return { error: classifySaveError(error) === "offline" ? "offline" : "failed" };
  }
  return { code: String(data) };
}

export type MyCode = { code: string; personId: string | null; storyId: string | null; usesLeft: number; expiresAt: string };

export async function listMyCodes(): Promise<MyCode[]> {
  const { data, error } = await supabase()
    .from("family_codes")
    .select("code, person_id, story_id, max_uses, uses, expires_at")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) {
    if (!missingFunction(error) && error.code !== "42P01") console.warn("listMyCodes:", error.message || error);
    return [];
  }
  return (data || [])
    .map((r) => ({
      code: r.code as string,
      personId: (r.person_id as string) || null,
      storyId: (r.story_id as string) || null,
      usesLeft: Math.max(0, ((r.max_uses as number) || 1) - ((r.uses as number) || 0)),
      expiresAt: r.expires_at as string,
    }))
    .filter((r) => r.usesLeft > 0);
}

export async function revokeCode(code: string): Promise<void> {
  const { error } = await supabase().from("family_codes").delete().eq("code", normaliseFamilyCode(code));
  if (error) throw error;
}

export type JoinResult =
  | { ok: true; person_id?: string; person_name?: string | null; story_id?: string | null; story_name?: string | null; inviter_name?: string | null; already?: boolean; moved?: boolean }
  | { ok: false; reason: "short" | "not_found" | "expired" | "used" | "taken" | "too_many" | "signed_out" | "not_ready" | "offline" | "failed" };

/** Join with a code (join_family). The caller reloads the account afterwards. */
export async function joinFamily(input: string): Promise<JoinResult> {
  const code = normaliseFamilyCode(input);
  if (!looksLikeFamilyCode(code)) return { ok: false, reason: code.length < 6 ? "short" : "not_found" };
  const { data, error } = await supabase().rpc("join_family", { code });
  if (error) {
    console.warn("joinFamily:", error.message || error);
    if (missingFunction(error)) return { ok: false, reason: "not_ready" };
    return { ok: false, reason: classifySaveError(error) === "offline" ? "offline" : "failed" };
  }
  return (data as JoinResult) || { ok: false, reason: "failed" };
}

/* ── Invitation email ──────────────────────────────────────────────────── */

/**
 * The invitation email (send-invite-email), carrying a family code. True
 * when it went. The function's INVITE_JOIN_URL decides where its button
 * lands; it must be set to this web app.
 */
export async function sendInviteEmail(input: { to: string; code: string; storyName?: string; senderName?: string }): Promise<boolean> {
  try {
    const { error } = await supabase().functions.invoke("send-invite-email", {
      body: { to: input.to.trim().toLowerCase(), storyName: input.storyName || "", referralCode: input.code, senderName: input.senderName || "" },
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn("sendInviteEmail:", (err as Error)?.message || err);
    return false;
  }
}

/* ── Who keeps a story ─────────────────────────────────────────────────── */

export type Manager = { id: string; invitedEmail: string; role: string; status: "pending" | "active"; userId: string | null; createdAt: string };

export async function listManagers(storyId: string): Promise<Manager[]> {
  const { data, error } = await supabase()
    .from("story_managers")
    .select("id, invited_email, role, status, user_id, created_at")
    .eq("story_id", storyId)
    .order("created_at", { ascending: true });
  if (error) {
    console.warn("listManagers:", error.message);
    return [];
  }
  return (data || []).map((r) => ({
    id: r.id as string,
    invitedEmail: r.invited_email as string,
    role: (r.role as string) || "manager",
    status: ((r.status as string) || "pending") as Manager["status"],
    userId: (r.user_id as string) || null,
    createdAt: r.created_at as string,
  }));
}

/**
 * Makes somebody a keeper of a story: a pending story_managers row that
 * accept_story_invites() links when they sign in with that email. Only the
 * owner may (42501 otherwise). Idempotent: already invited is a success.
 */
export async function inviteManager(input: { storyId: string; email: string; storyName?: string; senderName?: string; code?: string }): Promise<{ ok: true; emailed: boolean } | { ok: false; error: string }> {
  const to = input.email.trim().toLowerCase();
  if (!to) return { ok: false, error: "Missing email." };
  const { error } = await supabase().from("story_managers").insert({ story_id: input.storyId, invited_email: to, role: "manager", status: "pending" });
  if (error && error.code !== "23505") {
    if (error.code === "42501") return { ok: false, error: "Only the story's owner can invite people to it right now." };
    return { ok: false, error: "Could not save the invite." };
  }
  const emailed = await sendInviteEmail({ to, code: input.code || "", storyName: input.storyName, senderName: input.senderName });
  return { ok: true, emailed };
}

/** The owner removes a keeper, or a keeper removes themselves (RLS decides). */
export async function removeManager(id: string): Promise<void> {
  const { error } = await supabase().from("story_managers").delete().eq("id", id);
  if (error) throw error;
}
