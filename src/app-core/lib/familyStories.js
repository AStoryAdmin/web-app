// The stories somebody in the family could add to, for a Home that has no
// story of its own yet.
//
// A relative who joins through the tree (a family code, an invite to a
// person) often keeps no story at first. Their Home used to say "It starts
// with a collection" and offer to start one, while their mother's and
// father's stories sat one tab away. This picks out the people whose
// stories somebody in the family keeps, so Home can offer "Add what you
// remember" and "Ask to join" for each, and leave starting a new story as
// the smaller choice.
//
// Pure, so it's tested.

/* People with a story this account doesn't keep, oldest first, the living
   before the dead: the ones somebody is likeliest to want to add to now.
   Never yourself, never a placeholder box. */
export function storiesToAddTo({ people = [], meId = null, myStoryIds = [] } = {}) {
  const mine = new Set(myStoryIds || []);
  return (people || [])
    .filter(
      (p) =>
        p &&
        p.storyId &&
        !mine.has(p.storyId) &&
        p.source !== "placeholder" &&
        !(meId && p.userId === meId) &&
        String(p.givenName || "").trim()
    )
    .sort((a, b) => {
      const da = a.deathYear ? 1 : 0;
      const db = b.deathYear ? 1 : 0;
      if (da !== db) return da - db;
      const ya = Number(a.birthYear) || 9999;
      const yb = Number(b.birthYear) || 9999;
      if (ya !== yb) return ya - yb;
      return String(a.givenName).localeCompare(String(b.givenName));
    });
}

/* "The Nguyen family", from your own place in the tree; "Your family"
   when the tree doesn't know your family name. */
export function familyTitle({ people = [], meId = null } = {}) {
  const me = (people || []).find((p) => p && meId && p.userId === meId);
  const last = String(me?.familyName || "").trim();
  return last ? `The ${last} family` : "Your family";
}

/* The story that is this account's own life, if there is one: the story
   bound to their own row in the tree (a place somebody made for them, with
   a story about them that they keep since joining), else a "Myself" story
   they own. Without the first, joining at a place that already had a story
   about you gave you a second, empty one beside it. */
export function myOwnStory(data, userId) {
  if (!userId) return null;
  const stories = data?.stories || [];
  const me = (data?.family?.people || []).find((p) => p && p.userId === userId);
  const bound = me?.storyId ? stories.find((s) => s.id === me.storyId) : null;
  if (bound) return bound;
  return stories.find((s) => s.relationship === "Myself" && s.ownerId === userId) ||
    stories.find((s) => s.relationship === "Myself" && !s.ownerId) ||
    null;
}

/* One memory of a story you don't keep, as the family's read hands it to
   your Home and to FamilyMemory: from the server's row (snake_case) or a
   demo memory. It carries the keeper's `keptLine`, so the quote under
   "Rose said" and on a relative's Home is the line her own page quotes,
   never the body's first sentence (FB-222). Pure, so it's tested. */
export function readableMemory(m) {
  return {
    id: m.id,
    title: m.title || "",
    body: m.body || "",
    keptLine: m.kept_line ?? m.keptLine ?? "",
    era: m.era || "",
    period: m.period || "",
    createdAt: m.created_at || m.createdAt || null,
    contributor: m.contributor || "",
    source: m.source || "",
    // How it got here and who typed it, for the credit (lib/credit.js).
    via: m.via || "",
    writtenDownBy: m.written_down_by_name ?? m.writtenDownBy ?? "",
    // Its photographs and recordings, when the family's read carries them
    // (owner ruling 26 Oct, lane M: never a private memory's). Stored URLs and
    // paths, signed on the phone as the keeper's are (lib/photoUrls,
    // lib/memoryAudio). Empty until supabase/family_media_2026_10_26.sql runs.
    ...familyMediaOf(m),
    sides: (m.sides || []).map((c) => ({
      body: c.body || "",
      contributorName: c.contributor_name ?? c.contributorName ?? "",
      relationship: c.relationship || "",
      via: c.via || "",
      createdAt: c.created_at || c.createdAt || null,
    })),
  };
}

/* A memory's photos, cover and recordings, from a family_story_media row
   (snake_case) or a demo memory (camelCase). Only what can be shown or
   played: strings for photos, the storyteller's own recordings
   (memory-audio, never the interviewer's chat-audio turns) with a path. */
export function familyMediaOf(m) {
  const photos = (Array.isArray(m?.photos) ? m.photos : []).filter((u) => typeof u === "string" && u);
  const cover = typeof m?.cover === "string" && m.cover ? m.cover : null;
  const audio = (Array.isArray(m?.audio) ? m.audio : [])
    .filter((a) => a && a.path && (a.bucket || "memory-audio") === "memory-audio")
    .map((a) => ({
      id: a.id ?? a.path,
      bucket: "memory-audio",
      path: a.path,
      speaker: a.speaker || "narrator",
      duration: Number(a.duration ?? a.duration_seconds) || 0,
      transcript: a.transcript || "",
    }));
  return { photos, cover, audio };
}

/* The family's read with what family_story_media() returned laid on it:
   each memory's photos, cover and recordings, by memory id. A memory the
   media doesn't name keeps none (a private one is never in either list).
   No media (the function isn't there yet, or it failed): the words alone,
   as before. Pure, so it's tested. */
export function withFamilyMedia(memories = [], media = null) {
  const byId = new Map((Array.isArray(media) ? media : []).filter((r) => r && r.id).map((r) => [r.id, r]));
  return (memories || []).map((m) => {
    const row = byId.get(m.id);
    return row ? { ...m, ...familyMediaOf(row) } : m;
  });
}

/* Does what the family adds to this story go straight on, under the
   sender's name (owner ruling 26 Oct, DECISIONS T-114, lane F option B2)?
   Yes when the story's own teller is on A Story, so the teller can take it
   off from their own phone ("Not in my story"): their row in the tree has
   an account, or it is somebody's own "Myself" story. A story kept for
   someone who isn't on A Story still waits for the keeper's first yes; a
   friend always waits; your own story is yours to keep, not to send to.
   The server's rule is supabase/family_default_2026_10_26.sql; until it
   runs, a send it refuses waits for a yes (data/contributions). */
// `personId`: whose story it is, when the page was opened from their row
// (the switcher's "Your family on A Story") and their row doesn't carry it.
export function familyAddsStraightOn({ storyId = null, personId = null, people = [], stories = [], meId = null, friend = false } = {}) {
  if (!storyId || !meId || friend) return false;
  const real = (p) => p && p.source !== "placeholder";
  const teller =
    (people || []).find((p) => real(p) && p.storyId === storyId) ||
    (personId ? (people || []).find((p) => real(p) && p.id === personId && !p.deathYear) : null) ||
    null;
  if (teller?.userId === meId) return false;
  if (teller?.userId) return true;
  const story = (stories || []).find((s) => s && s.id === storyId) || null;
  return !!story && story.relationship === "Myself" && !!story.ownerId && story.ownerId !== meId;
}
