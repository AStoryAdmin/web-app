/**
 * Where a relative lands after joining with a family code. The phone makes
 * no story of their own for them (DECISIONS: no empty "Myself" for every
 * joiner), so Home opens on the family's story the code named, kept or read.
 * With none named, Home's own choice stands: a story they keep, else one
 * they read, else "Whose story is this?".
 *
 * Pure, so it's tested.
 */
import type { JoinResult } from "./familyWrites";

/** The story the join named, when this account can now open it. */
export function joinedStoryId(result: JoinResult | null, stories: { id: string }[]): string | null {
  if (!result?.ok || !result.story_id) return null;
  return stories.some((s) => s.id === result.story_id) ? result.story_id : null;
}

/**
 * The line under "You're in", in the phone's words (lib/familyCode.js
 * joinOutcome): the family's stories are on Home, and nothing promises a
 * story of the joiner's own. With nothing shared with them yet (Home would
 * open on "Whose story is this?"), it says so.
 */
export function joinedLine(result: Extract<JoinResult, { ok: true }>, hasStories = true): string {
  const story = result.story_name;
  const where = !hasStories
    ? "Nobody has shared a story with you yet. You can start your own now, and theirs will be on your Home when they share one."
    : story
      ? `${story}’s story is on your Home.`
      : "Your family’s stories are on your Home.";
  if (result.already) return where;
  return [
    result.inviter_name ? `Welcome to ${result.inviter_name}’s family.` : "Welcome to the family.",
    where,
    // their own tree came with them (family_join_merge.sql)
    result.moved ? "Everyone you had added is in the family tree now." : "",
  ]
    .filter(Boolean)
    .join(" ");
}
