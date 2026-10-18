/**
 * Reading a story you don't keep: somebody else's story in your family
 * tree, its Public, written-up memories and the sides its keepers kept, as
 * family_story_read() returns them (phone-app/supabase/family_reading.sql).
 * Mirrors phone-app/src/data/familyReading.js, and makes each one a Story
 * flagged readOnly, so the pages that show a story can show it without
 * offering anything that changes it.
 *
 * The table policies stay keepers-only (a wider SELECT would make the phone
 * app load and save these stories as its own). Photographs come once
 * family_readers.sql extends the function with them; until then a reader's
 * pages have the words and no pictures.
 */
import { supabase } from "../lib/supabase";
import { rowToStory, type Account, type FamilySide, type Story } from "./stories";
import type { Family } from "./family";

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const notThere = (code?: string) => ["PGRST202", "42883", "42P01", "PGRST205"].includes(code || "");

/**
 * family_story_read()'s answer as a read-only Story; null for a story outside the family. The function doesn't
 * say whose account keeps it, so `ownerId` is the best the tree knows (the storyteller's own account, else the
 * family's organiser): never this account, which is what the pages read as "somebody else's story".
 */
export function storyFromFamilyRead(data: Row | null, householdId: string | null, ownerId: string | null = null): Story | null {
  if (!data?.id) return null;
  const memories = ((data.memories || []) as Row[]).map((m) => ({
    id: m.id,
    title: m.title,
    body: m.body,
    era: m.era,
    period: m.period,
    created_at: m.created_at,
    contributor: m.contributor,
    source: m.source,
    cover_url: m.cover_url,
    person_ids: m.person_ids,
    // the function only returns what the family may read: shared, written up
    privacy: "shared",
    status: "saved",
    memory_photos: ((m.photos || []) as Row[]).filter((p) => p.public_url).map((p, i) => ({ public_url: p.public_url, sort_order: p.sort_order ?? i })),
    sides: m.sides,
  }));
  const story = rowToStory({ id: data.id, name: data.name, last_name: data.last_name, photo_url: data.photo_url, cover_url: data.cover_url, household_id: householdId, memories });
  const sidesOf = new Map(memories.map((m) => [m.id, (m.sides || []) as Row[]]));
  return {
    ...story,
    ownerId,
    // nobody's own relation to them is known here; "Relative" would read as the viewer's
    relationship: "",
    readOnly: true,
    memories: story.memories.map((m) => ({
      ...m,
      familySides: (sidesOf.get(m.id) || []).map(
        (c): FamilySide => ({ body: c.body || "", contributorName: c.contributor_name || "", relationship: c.relationship || "", createdAt: c.created_at || null }),
      ),
    })),
  };
}

/**
 * The stories in this account's family trees that it neither owns nor keeps: one family_story_read() each, for
 * the stories bound to somebody in a household the account has its own row in. A story the function won't open
 * (not this family, or the function not on the database yet) is left out; nothing here throws.
 */
export async function loadFamilyReading(userId: string, account: Account, family: Family | null): Promise<Story[]> {
  if (!family) return [];
  const homes = new Set(family.people.filter((p) => p.userId === userId).map((p) => p.householdId));
  const have = new Set(account.stories.map((s) => s.id));
  const organiser = (hid: string | null) => family.households.find((h) => h.id === hid)?.createdBy || null;
  const wanted = new Map<string, { hid: string | null; owner: string | null }>();
  for (const p of family.people) {
    if (!p.storyId || have.has(p.storyId) || !homes.has(p.householdId) || p.source === "placeholder") continue;
    const owner = [p.userId, organiser(p.householdId)].find((id) => id && id !== userId) || null;
    wanted.set(p.storyId, { hid: p.householdId, owner });
  }
  if (!wanted.size) return [];
  const sb = supabase();
  const read = await Promise.all(
    [...wanted].map(async ([sid, { hid, owner }]) => {
      const { data, error } = await sb.rpc("family_story_read", { sid });
      if (error) {
        if (!notThere(error.code)) console.warn("family_story_read:", error.message);
        return null;
      }
      return storyFromFamilyRead(data as Row | null, hid, owner);
    }),
  );
  return read.filter((s): s is Story => !!s).sort((a, b) => a.name.localeCompare(b.name));
}
