/**
 * A friend link (FB-284; phone src/data/storyFriends.js and
 * src/lib/friendLink.js): how a friend of the storyteller comes in. The
 * phone shares https://astoryapp.com/friend/RM7Q2KWD (eight letters and
 * numbers, only ever in a link); /friend/:token on the web is where it
 * lands. It is never the family’s way in: taking it makes you one of
 * Rose’s friends, who can send what they remember (it waits for a
 * keeper’s yes), never a place in the tree.
 *
 * Reading and taking a link both need a signed-in account
 * (story_friends_2026_10_21.sql grants them to `authenticated` only).
 */
import { supabase } from "../lib/supabase";
import { classifySaveError } from "../app-core/lib/saveErrors.js";

export const FRIEND_TOKEN_LENGTH = 8;

/** The token as the server keeps it (upper case, letters and numbers only), or "" when it can’t be one. */
export function normaliseFriendToken(input: string | null | undefined): string {
  const t = String(input || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return t.length === FRIEND_TOKEN_LENGTH ? t : "";
}

export type FriendLinkError = "not_found" | "not_ready" | "offline" | "failed";

export type FriendLink = { tellerName: string; tellerLastName: string; senderName: string; friendName: string; storyId: string };

type Err = { code?: string; message?: string } | null;
const missingFunction = (e: Err) => !!e && ["PGRST202", "42883", "42P01"].includes(e.code || "");
const failure = (e: Err): FriendLinkError => (missingFunction(e) ? "not_ready" : classifySaveError(e) === "offline" ? "offline" : "failed");

/** What a friend link is for, before it’s taken (friend_link_read). */
export async function readFriendLink(input: string | null | undefined): Promise<{ ok: true; link: FriendLink } | { ok: false; error: FriendLinkError }> {
  const token = normaliseFriendToken(input);
  if (!token) return { ok: false, error: "not_found" };
  try {
    const { data, error } = await supabase().rpc("friend_link_read", { p_token: token });
    if (error) return { ok: false, error: failure(error) };
    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null | undefined;
    if (!row || !row.story_id) return { ok: false, error: "not_found" };
    return {
      ok: true,
      link: {
        tellerName: String(row.teller_name || ""),
        tellerLastName: String(row.teller_last_name || ""),
        senderName: String(row.sender_name || ""),
        friendName: String(row.friend_name || ""),
        storyId: String(row.story_id),
      },
    };
  } catch {
    // nothing came back at all: the page says so rather than spinning
    return { ok: false, error: "offline" };
  }
}

/** Take it (friend_link_accept): one use. Being a friend never joins the family. */
export async function acceptFriendLink(input: string | null | undefined): Promise<{ ok: true; storyId: string } | { ok: false; error: FriendLinkError }> {
  const token = normaliseFriendToken(input);
  if (!token) return { ok: false, error: "not_found" };
  try {
    const { data, error } = await supabase().rpc("friend_link_accept", { p_token: token });
    if (error) return { ok: false, error: /not found|expired|used/i.test(error.message || "") ? "not_found" : failure(error) };
    return { ok: true, storyId: String(data || "") };
  } catch {
    return { ok: false, error: "offline" };
  }
}

/** The page’s words when a link won’t open (the phone’s FriendLinkScreen). */
export function friendLinkTrouble(error: FriendLinkError): string {
  if (error === "offline") return "The connection dropped on the way. Open the link again once you’re connected.";
  if (error === "not_ready") return "Friend links aren’t switched on yet. Ask whoever sent it to try again in a little while.";
  return "It may have been used already, or taken back. Ask whoever sent it for a new one.";
}

/** "Rose" and "Jamie", or the plain words when the link has no name for them. */
export function friendLinkNames(link: FriendLink, myFirstName?: string | null) {
  const teller = link.tellerName.trim() || "them";
  // friend_link_read says "The family" when the sender has no first name: that is no name to send it to
  const sender = /^the family$/i.test(link.senderName.trim()) ? "" : link.senderName.trim();
  return {
    teller,
    tellerFull: [link.tellerName, link.tellerLastName].map((s) => s.trim()).filter(Boolean).join(" ") || teller,
    sender,
    keeper: sender || "the family",
    you: link.friendName.trim() || String(myFirstName || "").trim(),
  };
}
