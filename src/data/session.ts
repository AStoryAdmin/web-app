/**
 * What runs once at every sign-in, as the app's AppContext does:
 *
 * - accept_story_invites(): links any story_managers rows waiting on this
 *   email and makes them active, so a co-manager sees the story they were
 *   invited to (collaborators.sql).
 * - claim_people(): takes the place in a family tree that was made with this
 *   email (family.sql); answers how many places were claimed.
 * - claim_contributions(p_ids): what this browser sent by a link before it
 *   had an account becomes this account's ("Claim your place",
 *   collab_2026_10_22.sql); answers how many were attached.
 * - touch_active(): stamps profiles.last_active_at, which the letters
 *   release reads (letters.sql).
 *
 * All best-effort. A database without one of these functions answers
 * PGRST202/42883 and is simply older; nothing here may stop a sign-in.
 *
 * The run is shared: whoever asks while it is under way (the auth listener,
 * the first account load) waits on the same one, so the first load can
 * hold for it, briefly, and show the story an invitation just opened.
 */
import { getSupabase } from "../lib/supabase";

const NOT_THERE = new Set(["PGRST202", "42883"]);

async function rpcQuietly(name: string, args?: Record<string, unknown>): Promise<unknown> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc(name, args);
  if (error) {
    if (!NOT_THERE.has(error.code)) console.warn(`${name}:`, error.message || error);
    return null;
  }
  return data;
}

export type SignInEffects = { invitesAccepted: number; placesClaimed: number; contributionsClaimed: number };

/** True when the sign-in linked anything, so the stories read before it are out of date. */
export const linkedAnything = (e: SignInEffects | null | undefined): boolean =>
  !!e && e.invitesAccepted + e.placesClaimed + e.contributionsClaimed > 0;

/* ── Contributions waiting to be claimed ──────────────────────────────────
   The app's lib/claims.js: the ids the server handed back for what a
   visitor sent without an account, held in this browser for a month (the
   server's claim window). Never forced: a visitor who never makes an
   account loses nothing; the keeper still has what they sent. */

const CLAIMS_KEY = "astory-pending-claims";
const CLAIM_KEEP_MS = 30 * 24 * 60 * 60 * 1000;

/** `email` is the address the visitor gave with it: only an account with that address claims it, so on a shared
 * computer one relative's memory is never credited to whoever signs in next. */
export type PendingClaim = { id: string; name?: string; storyName?: string; email?: string; at: string };

function readClaims(): PendingClaim[] {
  try {
    const list = JSON.parse(localStorage.getItem(CLAIMS_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeClaims(list: PendingClaim[]) {
  try {
    if (list.length) localStorage.setItem(CLAIMS_KEY, JSON.stringify(list));
    else localStorage.removeItem(CLAIMS_KEY);
  } catch {
    /* storage blocked: nothing to hold, nothing lost on the server */
  }
}

/** Remember a contribution sent without an account, to attach once there is one. */
export function rememberClaim(entry: { id: string; name?: string; storyName?: string; email?: string }) {
  if (!entry?.id) return;
  const email = foldEmail(entry.email);
  if (email) entry = { ...entry, email };
  const list = readClaims();
  if (list.some((x) => x.id === entry.id)) return;
  writeClaims([...list, { ...entry, at: new Date().toISOString() }]);
}

/** What is waiting to be claimed, fresh ones only. */
export function pendingClaims(now = Date.now()): PendingClaim[] {
  const list = readClaims();
  const fresh = list.filter((x) => x && x.id && now - new Date(x.at || 0).getTime() < CLAIM_KEEP_MS);
  if (fresh.length !== list.length) writeClaims(fresh);
  return fresh;
}

const foldEmail = (email?: string | null) => (email || "").trim().toLowerCase();

/** claim_contributions for what this browser holds under the signed-in address (one sent with no address, or with
 * another, is never claimed here); the ids sent are let go once the server has answered. */
export async function claimContributions(userEmail?: string | null): Promise<number> {
  const mine = foldEmail(userEmail);
  if (!mine) return 0;
  const held = pendingClaims();
  const waiting = held.filter((x) => foldEmail(x.email) === mine);
  if (!waiting.length) return 0;
  const sb = getSupabase();
  if (!sb) return 0;
  const { data, error } = await sb.rpc("claim_contributions", { p_ids: waiting.map((x) => x.id) });
  if (error) {
    if (!NOT_THERE.has(error.code)) console.warn("claim_contributions:", error.message || error);
    return 0;
  }
  writeClaims(held.filter((x) => !waiting.includes(x)));
  return Number(data) || 0;
}

/* ── The sign-in run ─────────────────────────────────────────────────────── */

const ACTIVE_STAMP = "astory-active-stamp";
const DAY_MS = 24 * 60 * 60 * 1000;

/** profiles.last_active_at, at most once a day per account, as the app rations it. */
function touchIfDue(userId: string) {
  const key = `${ACTIVE_STAMP}:${userId}`;
  try {
    const last = Number(localStorage.getItem(key) || 0);
    if (Date.now() - last < DAY_MS) return;
    localStorage.setItem(key, String(Date.now()));
  } catch {
    /* storage blocked: stamp anyway */
  }
  void rpcQuietly("touch_active");
}

// The run under way for an account, so a second caller waits on it instead of starting another.
const running = new Map<string, Promise<SignInEffects>>();

export function afterSignIn(userId: string, email?: string | null): Promise<SignInEffects> {
  const now = running.get(userId);
  if (now) return now;
  const run = (async () => {
    const [invites, places, contributions] = await Promise.all([
      rpcQuietly("accept_story_invites"),
      rpcQuietly("claim_people"),
      claimContributions(email).catch(() => 0),
    ]);
    touchIfDue(userId);
    return {
      invitesAccepted: Number(invites) || 0,
      placesClaimed: Number(places) || 0,
      contributionsClaimed: Number(contributions) || 0,
    };
  })().finally(() => running.delete(userId));
  running.set(userId, run);
  return run;
}

/** How long the first load holds for the sign-in links (the app's CLAIMS_WAIT_MS). */
export const SIGN_IN_WAIT_MS = 3000;

export type SignInWait = {
  /** The sign-in's effects when they came in time; null when none was under way or it ran past the wait. */
  effects: SignInEffects | null;
  /** The run still under way after the wait, to reload from when it lands; null when there is nothing left to wait for. */
  late: Promise<SignInEffects> | null;
};

/**
 * For the first account load: the sign-in run under way for this account,
 * waited for at most `ms`. Starts nothing; with no run under way (it
 * finished already, or this is not a fresh sign-in) it answers at once.
 */
export async function settleSignIn(userId: string, ms = SIGN_IN_WAIT_MS): Promise<SignInWait> {
  const run = running.get(userId);
  if (!run) return { effects: null, late: null };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<"late">((resolve) => {
    timer = setTimeout(() => resolve("late"), Math.max(0, ms));
  });
  try {
    const first = await Promise.race([run.catch(() => null), timeout]);
    if (first === "late") return { effects: null, late: run };
    return { effects: first, late: null };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * On return to the tab: the same links again, cheaply. Returns true when
 * any landed, so the caller reloads the stories only then.
 */
export async function refreshShared(email?: string | null): Promise<boolean> {
  const [invites, places, contributions] = await Promise.all([
    rpcQuietly("accept_story_invites"),
    rpcQuietly("claim_people"),
    claimContributions(email).catch(() => 0),
  ]);
  return (Number(invites) || 0) + (Number(places) || 0) + (Number(contributions) || 0) > 0;
}

/**
 * Binds a place in the family tree to a story (link_person_story,
 * people_permissions.sql), so the tree and the story agree on who it is
 * about. Throws when the server refused; an older database without the
 * function is not an error.
 */
export async function linkPersonStory(personId: string, storyId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.rpc("link_person_story", { pid: personId, sid: storyId });
  if (error) {
    if (NOT_THERE.has(error.code)) return false;
    throw error;
  }
  return true;
}
