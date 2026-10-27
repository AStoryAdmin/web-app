// The shape a story and a memory take as database rows, and what a save has
// to write. Kept apart from store.js, which talks to Supabase, so the part
// that decides what gets written can be tested without a network.

import { normaliseEra } from "./eras.js";

export function storyToRow(story, ownerId) {
  return {
    id: story.id,
    // Keep the story's original owner if known (a co-manager editing a shared
    // story must not become its owner); fall back to the caller for new stories.
    owner_id: story.ownerId || ownerId,
    name: story.name || "",
    last_name: story.lastName || "",
    relationship: story.relationship || "Relative",
    relationship_other: story.relationshipOther || "",
    nickname: story.nickname || "",
    directory: story.directory || null,
    birth_day: story.birthDay || "",
    birth_month: story.birthMonth || "",
    birth_year: story.birthYear || "",
    has_account: story.hasAccount || null,
    connected_email: story.connectedEmail || "",
    photo_url: story.photo || null,
    cover_url: story.cover || null,
    intro: story.intro || "",
    is_public: !!story.isPublic,
    public_slug: story.publicSlug || null,
    contributions_open: !!story.contributionsOpen,
    contribute_slug: story.contributeSlug || null,
    sessions_completed: story.sessionsCompleted || 0,
    streak_days: story.streakDays || 0,
    last_memory_date: story.lastMemoryDate || null,
    done_topics_today: story.doneTopicsToday || { date: "", eras: [] },
    created_at: story.createdAt || new Date().toISOString(),
    // Only once somebody has designed the book: until book_design.sql has
    // been run the column isn't there, and a story that never had a design
    // shouldn't fail its save over it. store.js drops it if it's refused.
    ...(story.bookDesign ? { book_design: story.bookDesign } : {}),
    // The same, for how this storyteller's calls sound (call_style.sql).
    ...(story.callStyle ? { call_style: story.callStyle } : {}),
  };
}

/* The language a memory's words are in, as a BCP-47 tag the database takes
   ('vi', 'en', 'zh-Hant'), or null. Anything else is dropped rather than
   sent: a tag the database refuses would fail the whole memory's save. */
export function cleanLanguage(tag) {
  const t = String(tag || "").trim().replace(/_/g, "-");
  if (!t) return null;
  const [base, ...rest] = t.split("-");
  const out = [base.toLowerCase(), ...rest].join("-");
  return /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(out) ? out : null;
}

/* The question a memory answers, as it was asked: its own questionText, else
   the prompt the screens already keep on it (mem.prompt = question), or "". */
export function questionTextOf(memory) {
  const q = memory?.questionText || memory?.prompt;
  const text = typeof q === "string" ? q : q && typeof q.question === "string" ? q.question : "";
  return text.replace(/\s+/g, " ").trim().slice(0, 2000);
}

/* The language a new memory is in when it doesn't say: the language its
   story's calls are in (callStyle.language, "the language the memory is
   written in"), else the phone's, else unknown (null). */
export function languageFor(story, deviceLanguage = null) {
  return cleanLanguage(story?.callStyle?.language) || cleanLanguage(deviceLanguage);
}

/* `fallbackLanguage`: the language to stamp when the memory doesn't carry
   one (planSave passes it only for a memory new to the server). */
export function memoryToRow(memory, storyId, { fallbackLanguage = null } = {}) {
  const question = questionTextOf(memory);
  const language = cleanLanguage(memory.language) || cleanLanguage(fallbackLanguage);
  return {
    id: memory.id,
    story_id: storyId,
    title: memory.title || "",
    body: memory.body || "",
    excerpt: memory.excerpt || "",
    era: normaliseEra(memory.era),
    period: memory.period || "",
    rating: memory.rating || 0,
    rating_note: memory.ratingNote || "",
    privacy: memory.privacy || "private",
    status: memory.status || "saved",
    cover_url: memory.cover || null,
    color: memory.color || "",
    contributor: memory.contributor || null,
    author_person_id: memory.authorPersonId || null,
    // Only when there is one: the column comes with family_calls.sql, and an
    // ordinary memory must still save on a database that doesn't have it.
    ...(memory.familyCallId ? { family_call_id: memory.familyCallId } : {}),
    // Who's in it (memory_people.sql). Only once somebody has been asked:
    // a memory that never was has no list at all, which is a different
    // answer from "nobody", and saves on a database without the column.
    ...(Array.isArray(memory.personIds) ? { person_ids: memory.personIds } : {}),
    // Where it came from, when that's worth saying ("memoir": read in from
    // something they wrote, memory_source.sql). Only when set.
    ...(memory.source ? { source: memory.source } : {}),
    // How it got here, and who wrote it down when it was told in the
    // storyteller's words (FB-326, collab_2026_10_22.sql). Only when set.
    ...(memory.via ? { via: memory.via } : {}),
    ...(memory.writtenDownBy
      ? { written_down_by: memory.writtenDownById || null, written_down_by_name: memory.writtenDownBy, written_down_by_person_id: memory.writtenDownByPersonId || null }
      : {}),
    // What was asked, and the language the words are in
    // (memories_question_language_2026_10_25.sql), for the archive the
    // family will search years from now. Only when known: an old memory is
    // never given a guess, and a database without the columns still saves.
    ...(question ? { question_text: question } : {}),
    ...(language ? { language } : {}),
    created_at: memory.createdAt || new Date().toISOString(),
  };
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* What a save has to write: the stories, memories, photo lists and clip
   lists that differ from `baseline`, the tree the server was last known to
   hold. With no baseline, everything.

   Writing only the difference is not an optimisation. The tree in memory is
   whatever this device loaded at sign-in, and in a shared story other people
   have been writing since. Sending the whole tree back put this device's
   stale copy of every memory over theirs — and because photo lists are
   rewritten by delete-then-insert, it deleted the photos a relative had just
   added to a memory this person never touched. */
export function planSave(userId, state, baseline, { deviceLanguage = null } = {}) {
  const stories = state?.stories || [];
  const before = new Map((baseline?.stories || []).map((s) => [s.id, s]));

  // `created`: stories this device has never seen the server hold. They are
  // inserted, not upserted (store.js saveState says why).
  const plan = { created: [], owned: [], shared: [], memories: [], photos: [], audio: [], profile: null };

  for (const story of stories) {
    const old = before.get(story.id);
    const row = storyToRow(story, userId);
    if (!old || !same(row, storyToRow(old, userId))) {
      // A story somebody else owns is theirs to create. Upserting it here
      // sends an INSERT … ON CONFLICT whose proposed row has their owner_id,
      // which the owner-only insert policy refuses — so a co-manager's save
      // failed outright. An UPDATE is all a member ever needs, and it never
      // names the owner at all.
      if (story.ownerId && story.ownerId !== userId) plan.shared.push(row);
      else if (!old) plan.created.push(row);
      else plan.owned.push(row);
    }

    const oldMems = new Map((old?.memories || []).map((m) => [m.id, m]));
    for (const memory of story.memories || []) {
      const was = oldMems.get(memory.id);
      if (!was || !same(memoryToRow(memory, story.id), memoryToRow(was, story.id))) {
        // A memory the server has never held takes its language now, from
        // the story's or the phone's setting. Only with a baseline: without
        // one every memory looks new, and an old one must not be guessed.
        const fresh = !was && !!baseline && !memory.language;
        plan.memories.push({ memory, storyId: story.id, ...(fresh ? { fallbackLanguage: languageFor(story, deviceLanguage) } : {}) });
      }
      if (!was || !same(memory.photos || [], was.photos || [])) plan.photos.push(memory);
      if (!was || !same(memory.audio || [], was.audio || [])) plan.audio.push(memory);
    }
  }

  const profile = {
    onboarding_complete: !!state?.onboardingComplete,
    active_story_id: state?.activeStoryId || null,
  };
  const oldProfile = baseline
    ? {
        onboarding_complete: !!baseline.onboardingComplete,
        active_story_id: baseline.activeStoryId || null,
      }
    : null;
  if (!oldProfile || !same(profile, oldProfile)) plan.profile = profile;

  return plan;
}
