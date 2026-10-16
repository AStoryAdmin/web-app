/**
 * What runs once at every sign-in, as the app's AppContext does:
 *
 * - accept_story_invites(): links any story_managers rows waiting on this
 *   email and makes them active, so a co-manager sees the story they were
 *   invited to (collaborators.sql).
 * - claim_people(): takes the place in a family tree that was made with this
 *   email (family.sql); answers how many places were claimed.
 * - touch_active(): stamps profiles.last_active_at, which the letters
 *   release reads (letters.sql).
 *
 * All best-effort. A database without one of these functions answers
 * PGRST202/42883 and is simply older; nothing here may stop a sign-in.
 */
import { getSupabase } from "../lib/supabase";

const NOT_THERE = new Set(["PGRST202", "42883"]);

async function rpcQuietly(name: string): Promise<unknown> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc(name);
  if (error) {
    if (!NOT_THERE.has(error.code)) console.warn(`${name}:`, error.message || error);
    return null;
  }
  return data;
}

export type SignInEffects = { invitesAccepted: number; placesClaimed: number };

export async function afterSignIn(): Promise<SignInEffects> {
  const [invites, places] = await Promise.all([
    rpcQuietly("accept_story_invites"),
    rpcQuietly("claim_people"),
  ]);
  void rpcQuietly("touch_active");
  return { invitesAccepted: Number(invites) || 0, placesClaimed: Number(places) || 0 };
}
