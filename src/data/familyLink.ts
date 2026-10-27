/**
 * The family's link, opened by somebody with no account (phone
 * data/familyLinks.js, FB-326 item 4, DECISIONS S-PL8). It is the join
 * link itself, /join/RS4HNT: signed out, it opens the family's page to read
 * and add to; signed in, the code joins at once (Join.tsx). The calls are in
 * phone-app/supabase/collab_2026_10_22.sql:
 *
 *   readFamilyLink     the story the code opens and its shared memories,
 *                      each with its credit. Reading never uses the code up
 *   sendMemoryByLink   a visitor's own memory, with just a name and how they
 *                      knew them. Always waits for a keeper's yes
 *
 * What a visitor sent is attached to their account at sign-in by
 * claim_contributions (session.ts rememberClaim / claimContributions).
 *
 * Also here, the welcome a relative gets once the code has joined them
 * (/joined, the phone's JoinFamilyScreen "You're in"): who invited them,
 * carried from the join to the page, and the line of the newest memory.
 *
 * Nothing here throws; pure parts are exported and tested.
 */
import { getSupabase } from "../lib/supabase";
import { normaliseFamilyCode } from "../app-core/lib/familyCode.js";
import { readableMemory } from "../app-core/lib/familyStories.js";
import { keptLineOf } from "../app-core/lib/memorySides.js";
import { quoteFor } from "../app-core/lib/memoryCard.js";
import { classifySaveError } from "../app-core/lib/saveErrors.js";

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** One shared memory as the link reads it (app-core readableMemory). */
export type LinkMemory = {
  id: string;
  title: string;
  body: string;
  keptLine: string;
  era: string;
  period: string;
  createdAt: string | null;
  contributor: string;
  source: string;
  via: string;
  writtenDownBy: string;
};

export type FamilyLink = {
  code: string;
  storyId: string;
  name: string;
  lastName: string;
  photo: string | null;
  birthYear: string;
  /** Whoever made the code, by first name; "" when the server doesn't know. */
  senderName: string;
  memories: LinkMemory[];
};

export type LinkFailure = "not_found" | "not_ready" | "offline" | "failed";
export type FamilyLinkRead = FamilyLink | { error: LinkFailure };

const NOT_THERE = new Set(["PGRST202", "42883", "42P01", "PGRST205"]);

/** Why a call failed, in the four words the pages answer to. */
export function linkFailure(error: { code?: string; message?: string } | null | undefined): LinkFailure {
  if (error?.code && NOT_THERE.has(error.code)) return "not_ready";
  if (classifySaveError(error) === "offline" || /network|fetch/i.test(error?.message || "")) return "offline";
  return "failed";
}

/** family_link_read's answer as the page reads it; null when the code opens no story. */
export function linkFromRead(data: Row | null | undefined, code: string): FamilyLink | null {
  if (!data || typeof data !== "object" || !data.story_id) return null;
  return {
    code,
    storyId: String(data.story_id),
    name: String(data.name || "").trim(),
    lastName: String(data.last_name || "").trim(),
    photo: data.photo_url || null,
    birthYear: data.birth_year ? String(data.birth_year) : "",
    senderName: String(data.sender_name || "").trim(),
    memories: (Array.isArray(data.memories) ? (data.memories as Row[]) : []).filter((m) => m?.id).map((m) => readableMemory({ ...m, sides: [] }) as LinkMemory),
  };
}

/** The story a family code opens, for anyone holding it. Always settles: a throw reads as offline. */
export async function readFamilyLink(input: string): Promise<FamilyLinkRead> {
  const code = normaliseFamilyCode(input) as string;
  if (!code) return { error: "not_found" };
  const sb = getSupabase();
  if (!sb) return { error: "not_ready" };
  try {
    const { data, error } = await sb.rpc("family_link_read", { p_code: code });
    if (error) return { error: linkFailure(error) };
    return linkFromRead(data as Row | null, code) ?? { error: "not_found" };
  } catch {
    return { error: "offline" };
  }
}

export type SendByLink = { code: string; name: string; how?: string; body: string; title?: string };
export type SendByLinkResult = { ok: true; id: string | null; status: string } | { ok: false; error: string };

/** What the visitor typed, trimmed and cut to the server's lengths; a sentence instead when something is missing. */
export function linkMemoryArgs(input: SendByLink): Record<string, string> | { error: string } {
  const name = String(input.name || "").trim();
  const body = String(input.body || "").trim();
  if (!body) return { error: "Write what you remember first." };
  if (!name) return { error: "Your name, so the family knows who this is from." };
  return {
    p_code: normaliseFamilyCode(input.code) as string,
    p_name: name.slice(0, 120),
    p_how: String(input.how || "").trim().slice(0, 80),
    p_body: body.slice(0, 10000),
    p_title: String(input.title || "").trim().slice(0, 160),
  };
}

/** family_link_add_memory's answer, a row or a one-row table: the new contribution's id. */
export function addedAnswer(data: unknown): { id: string | null; status: string } {
  const r = (Array.isArray(data) ? data[0] : data) as Row | null | undefined;
  return { id: r && typeof r === "object" && r.id ? String(r.id) : null, status: (r && typeof r === "object" && r.status) || "pending" };
}

/** A visitor's own memory, sent to the family's keeper. It lands as pending, under the name they gave. */
export async function sendMemoryByLink(input: SendByLink): Promise<SendByLinkResult> {
  const args = linkMemoryArgs(input);
  if ("error" in args) return { ok: false, error: args.error };
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Sending by this link isn’t switched on yet." };
  try {
    const { data, error } = await sb.rpc("family_link_add_memory", args);
    if (error) {
      console.warn("sendMemoryByLink:", error.message || error);
      const why = linkFailure(error);
      return {
        ok: false,
        error:
          why === "offline"
            ? "You’re offline. Your words are still here; try again once you’re connected."
            : why === "not_ready"
              ? "Sending by this link isn’t switched on yet."
              : /not found/i.test(error.message || "")
                ? "This link has run out. Ask whoever sent it for a new one; your words are still here."
                : "That didn’t go through. Your words are still here; try once more.",
      };
    }
    return { ok: true, ...addedAnswer(data) };
  } catch {
    return { ok: false, error: "That didn’t go through. Your words are still here; try once more." };
  }
}

/* ── After the join: the welcome ───────────────────────────────────────── */

/** What the join said, carried to /joined: whose family, who invited them. */
export type JoinedWelcome = { storyId: string | null; storyName: string; inviterName: string; personName: string };

const JOINED_KEY = "astory-joined";

function parseWelcome(v: unknown): JoinedWelcome | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Row;
  if (!("inviterName" in o) && !("storyId" in o)) return null;
  const s = (x: unknown) => (typeof x === "string" ? x.trim() : "");
  return { storyId: s(o.storyId) || null, storyName: s(o.storyName), inviterName: s(o.inviterName), personName: s(o.personName) };
}

/** From join_family's answer. A copy stays in this tab, so a reload of /joined still knows who invited them. */
export function holdJoined(result: { story_id?: string | null; story_name?: string | null; inviter_name?: string | null; person_name?: string | null }): JoinedWelcome {
  const w: JoinedWelcome = {
    storyId: result.story_id || null,
    storyName: String(result.story_name || "").trim(),
    inviterName: String(result.inviter_name || "").trim(),
    personName: String(result.person_name || "").trim(),
  };
  try {
    window.sessionStorage.setItem(JOINED_KEY, JSON.stringify(w));
  } catch {
    /* storage refused: the router state still carries it */
  }
  return w;
}

/** The router's state first, then this tab's copy; null when /joined was opened on its own. */
export function readJoined(state: unknown): JoinedWelcome | null {
  const fromState = parseWelcome(state);
  if (fromState) return fromState;
  try {
    const raw = window.sessionStorage.getItem(JOINED_KEY);
    return raw ? parseWelcome(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

const firstOf = (s: string | null | undefined) => String(s || "").trim().split(/\s+/)[0] || "";

/**
 * The welcome's words, in the phone's ("You're in, Linh", "Rose Miller's family", JoinFamilyScreen): the title by
 * their own first name, the kicker by whose family it is, and one line naming who invited them. Anyone the join
 * doesn't name stays unnamed.
 */
export function joinedWords({ welcome, firstName, teller }: { welcome: JoinedWelcome | null; firstName?: string | null; teller?: string | null }): {
  kicker: string;
  title: string;
  line: string;
} {
  const me = firstOf(firstName) || firstOf(welcome?.personName);
  const whose = String(teller || welcome?.storyName || "").trim();
  const inviter = firstOf(welcome?.inviterName);
  return {
    kicker: whose ? `${whose}’s family` : "Your family",
    title: me ? `You’re in, ${me}` : "You’re in",
    line: inviter ? `${inviter} invited you. You read what the family shares, and add what you remember under your own name.` : "You read what the family shares, and add what you remember under your own name.",
  };
}

/** The line a memory is shown by on a welcome or a link: the storyteller's kept line, else its opening, cut on a word. */
export function openingLine(memory: { keptLine?: string; body?: string; title?: string } | null | undefined, max = 180): string {
  if (!memory) return "";
  const line = String(keptLineOf(memory) || "").trim() || String(memory.body || "").split(/\n/).map((s) => s.trim()).find(Boolean) || "";
  return quoteFor(line, max) as string;
}
