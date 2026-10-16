// The chapters a life is told in.
//
// Its own module, with no imports, because the pure logic that reasons about
// chapters (lib/bookProgress.js, lib/timeline.js) shouldn't have to drag the
// Supabase client in behind it — and neither should the tests that cover that
// logic. data/store.js re-exports these, so the many `from "../data/store"`
// call sites keep working.
//
// Two things shaped this list. The archive reads years now, so chapters no
// longer have to carry *when* — the timeline does that, which frees them to
// carry what a life was actually made of. And a life story has two edges the
// old list had no room for: the people who came before (parents, the place
// the family started) and the people who came after, speaking for themselves.
// So the book runs from the generation before, through the life, to the
// children's own account of it.

export const ERAS = [
  // Before them: parents, grandparents, the place it all started.
  "Where we come from",
  "Childhood",
  // School, teens, first jobs, leaving home — one stretch, because for plenty
  // of lives schooling stopped at twelve and "School years" had nowhere to
  // put what happened next.
  "Growing up",
  "Love & family",
  // Not "Career": farms, shops, kitchens and caring for people are work, and
  // most of the women whose stories this app exists for never had a career.
  "Work & making a living",
  // War, leaving, arriving, the years that bent everything. Not the history —
  // what it was like on a Tuesday.
  "The world we lived through",
  // Every other chapter is a stretch of years. This one cuts across them: the
  // high point, the low point, and the day after which nothing was the same.
  // People don't file a life by decade, they file it by what turned — and a
  // book that never asks for the turns gets a chronicle, not a story.
  "When everything changed",
  // What somebody leaned on. Written so a lifelong worshipper and somebody who
  // drifted away at nineteen can both answer every question in it — "what
  // carried me" is a phrase they both use.
  "Faith & what carried me",
  // The view from the end. This was two chapters — "Later years" and "What
  // I've learned" — and they were half the same chapter already: both were
  // carrying regret, belief, pride and legacy. One holds the life as it is
  // now, the other what it taught, and nobody reading a book wants those
  // apart.
  "Looking back",
  // The other side of the same years: what the children and grandchildren
  // remember, and the photographs only they still have.
  "From the family",
  // Everything that doesn't fit. Every archive needs one.
  "Anything else",
];

// Chapters that arrive from somewhere other than the storyteller's own life
// story, or that not every life has.
export const FAMILY_CHAPTER = "From the family";
export const CATCH_ALL_CHAPTER = "Anything else";
export const FAITH_CHAPTER = "Faith & what carried me";

// What the book's progress is measured against: the storyteller's own account
// of their own life. Three chapters sit outside it. "From the family" is
// somebody else's voice and "Anything else" is a bucket, so you can't be short
// of either. And faith is not a hole in a life that doesn't have one —
// counting it would mean telling somebody without a faith, for months, that
// their book is missing a chapter. That is both untrue and rude.
export const CORE_CHAPTERS = ERAS.filter(
  (e) => e !== FAMILY_CHAPTER && e !== CATCH_ALL_CHAPTER && e !== FAITH_CHAPTER
);

// Chapter names this app used to write, and where they land now. Applied when
// memories are read (data/store.js), so an archive built last month opens
// under the new names without a database migration.
const RENAMED = {
  // Merged into "Looking back" — an archive written before that still opens.
  "Later years": "Looking back",
  "What I've learned": "Looking back",
  "School years": "Growing up",
  "Early adulthood": "Growing up",
  Career: "Work & making a living",
  Wisdom: "Looking back",
  Life: "Anything else",
  Other: "Anything else",
};

export function normaliseEra(era) {
  if (!era) return CATCH_ALL_CHAPTER;
  if (ERAS.includes(era)) return era;
  return RENAMED[era] || CATCH_ALL_CHAPTER;
}

// Which chapter a moment belongs to, by how old the person was. Rough on
// purpose: these are the boundaries a family would recognise, not a schema.
// Several chapters are never inferred from an age — "Where we come from" is
// mostly before they were born, "The world we lived through" can land in any
// decade, and faith and the turning points aren't stretches of years at all.
export function eraForAge(age) {
  if (age == null || age < 0 || age > 120) return null;
  if (age <= 12) return "Childhood";
  if (age <= 22) return "Growing up";
  if (age <= 45) return "Work & making a living";
  if (age <= 65) return "Love & family";
  return "Looking back";
}

// How far apart two chapters sit in a life. Used to tell "close enough"
// (work filed as family — both middle age) from "that can't be right"
// (age 30 filed under Childhood).
export function chapterDistance(a, b) {
  const i = CORE_CHAPTERS.indexOf(a);
  const j = CORE_CHAPTERS.indexOf(b);
  if (i < 0 || j < 0) return 0;
  return Math.abs(i - j);
}
