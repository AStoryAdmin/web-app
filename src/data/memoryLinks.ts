/**
 * One memory, many people (phone data/memoryLinks.js and lib/memoryLink.js,
 * FB-322, DECISIONS S-K2): the link to ONE memory that anybody who was
 * there can be sent. It opens that memory and nothing else, and lets
 * whoever holds it add what they remember; it waits for a keeper's yes.
 * It never joins anybody to anything.
 *
 *   memoryLinkFor      a keeper (or the storyteller) makes the link, named
 *                      for one person or for "someone else"
 *   memoryLinkMessage  the words that carry it, in the asker's own voice
 *   askablePeople      who in the tree could be asked, for the name field
 *
 * The asker sends the link themselves (a text, an email): nothing here
 * sends anything. The calls are in phone-app/supabase/memory_links_2026_10_22.sql.
 *
 * Three link lengths, so no link is ever mistaken for another: the family
 * …/join/RS4HNT (six), a friend …/friend/RM7Q2KWD (eight), a memory
 * …/m/K7PX2QHM4D (ten). Nothing here throws; the pure parts are tested.
 */
import { getSupabase } from "../lib/supabase";
import { linkFailure, type LinkFailure } from "./familyLink";
import type { Person } from "./family";

export const MEMORY_TOKEN_LENGTH = 10;

/**
 * Where a memory's link opens: the site the phone app's links use
 * (phone-app/src/lib/links.js SITE_URL), so a link made here is the link
 * the phone would make. VITE_MEMORY_LINK_URL points a build elsewhere.
 */
const SITE = "https://astoryapp.com";
export function memoryLinkBase(): string {
  const env = String(import.meta.env.VITE_MEMORY_LINK_URL || "").trim();
  return (/^https?:\/\/\S+$/.test(env) ? env : SITE).replace(/\/+$/, "");
}

/** Upper case, letters and digits only; "" unless it is ten long. */
export function normaliseMemoryToken(input: unknown): string {
  const t = String(input || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return t.length === MEMORY_TOKEN_LENGTH ? t : "";
}

/** The link a person is sent: …/m/<token>; "" for a token that isn't one. */
export function memoryLink(siteUrl: string, token: string): string {
  const base = String(siteUrl || "").replace(/\/+$/, "");
  const t = normaliseMemoryToken(token);
  return t ? `${base}/m/${t}` : "";
}

const firstOf = (s: unknown) =>
  String(s || "")
    .trim()
    .split(/\s+/)[0] || "";

/**
 * The message that carries it, in the sender's own voice: short enough for
 * a lock screen, the memory named, both ways of answering said. The
 * phone's lib/memoryLink.js memoryLinkMessage, word for word.
 */
export function memoryLinkMessage({
  link,
  title = "",
  tellerName = "",
  senderName = "",
  toName = "",
  senderIsTeller = false,
}: {
  link: string;
  title?: string;
  tellerName?: string;
  senderName?: string;
  toName?: string;
  senderIsTeller?: boolean;
}): string {
  const hi = firstOf(toName);
  const whose = senderIsTeller ? "my" : `${String(tellerName || "").trim() || "our family"}’s`;
  const what = String(title || "").trim();
  return [
    `${hi ? `${hi}, ` : ""}I’m keeping ${whose} stories on A Story. ${what ? `Were you there for “${what}”?` : "Were you there for this one?"}`,
    "",
    `Add what you remember, written or in your own voice: ${link}`,
    ...(senderName ? ["", `— ${firstOf(senderName)}`] : []),
  ].join("\n");
}

/** memory_link_create's answer (a bare token, a row or a one-row table) as the token, or "". */
export function tokenFrom(data: unknown): string {
  const r = Array.isArray(data) ? data[0] : data;
  const raw = r && typeof r === "object" ? (r as { token?: unknown }).token : r;
  return normaliseMemoryToken(raw);
}

export type MemoryLinkMade = { token: string; link: string } | { error: LinkFailure };

/**
 * The link for one memory. `forName` and the person it is for are kept
 * with it on the server, so the memory can say who was asked. Always
 * settles: a throw reads as offline.
 */
export async function memoryLinkFor({ memoryId, forName = "", personId = null }: { memoryId: string; forName?: string; personId?: string | null }): Promise<MemoryLinkMade> {
  if (!memoryId) return { error: "failed" };
  const sb = getSupabase();
  if (!sb) return { error: "not_ready" };
  try {
    const { data, error } = await sb.rpc("memory_link_create", {
      p_memory: memoryId,
      p_for_name: String(forName || "")
        .trim()
        .slice(0, 120),
      p_person: personId,
      p_friend: null,
    });
    if (error) {
      console.warn("memoryLinkFor:", error.message || error);
      return { error: linkFailure(error) };
    }
    const token = tokenFrom(data);
    return token ? { token, link: memoryLink(memoryLinkBase(), token) } : { error: "failed" };
  } catch {
    return { error: "offline" };
  }
}

/** What a failed link says, in the phone sheet's words. */
export function linkProblem(error: LinkFailure): string {
  if (error === "not_ready") return "Links to one memory aren’t switched on yet.";
  if (error === "offline") return "You’re offline. Try again once you’re connected.";
  return "The link couldn’t be made just now. Try once more.";
}

export type Askable = { id: string; name: string };

/**
 * Who in the tree could be asked about a memory (phone lib/memoryLink.js
 * askPeople, the family half): anyone living in this story's household but
 * the asker and the storyteller, never a placeholder. Named, A to Z.
 */
export function askablePeople(
  people: Person[] | null | undefined,
  { householdId = null, tellerStoryId = null, meId = null, meEmail = "" }: { householdId?: string | null; tellerStoryId?: string | null; meId?: string | null; meEmail?: string } = {},
): Askable[] {
  const mail = String(meEmail || "").toLowerCase();
  return (people || [])
    .filter((p) => p && p.source !== "placeholder" && !p.deathYear && (p.givenName || p.familyName))
    .filter((p) => !householdId || !p.householdId || p.householdId === householdId)
    .filter((p) => !(tellerStoryId && p.storyId === tellerStoryId))
    .filter((p) => !(meId && p.userId === meId) && !(mail && p.email && String(p.email).toLowerCase() === mail))
    .map((p) => ({ id: p.id, name: `${p.givenName || ""} ${p.familyName || ""}`.trim() }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** The person a typed name means, when it is exactly one of the askable (case and spacing aside). */
export function personForName(list: Askable[], typed: string): Askable | null {
  const fold = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const t = fold(typed);
  if (!t) return null;
  const hits = list.filter((p) => fold(p.name) === t);
  return hits.length === 1 ? hits[0] : null;
}
