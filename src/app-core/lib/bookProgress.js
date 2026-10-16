// How close this story is to being a book, and what's missing.
//
// The printed book is what the whole app is for, and progress toward it is
// the only honest measure of whether the archive is working. A count of
// memories doesn't say that — twenty memories all from one afternoon in 1998
// is not a life. So progress here is about *coverage*: the chapters that have
// something in them, and the decades that don't.
//
// It also answers the question the home screen should always be able to
// answer: what's the single most useful thing to ask about next.

import { CORE_CHAPTERS, normaliseEra } from "../data/eras.js";
import { memoryDate, decadeOf, ageAt } from "./timeline.js";

// A first edition needs enough to be worth binding. Below this the book
// reads as a pamphlet; past it, more is better but the shape is there.
export const BOOK_MIN_MEMORIES = 20;

export { CORE_CHAPTERS };

// What to ask when a chapter is empty. Phrased as the thing you'd actually
// say out loud, because that's what the Talk screen opens with.
// A line under each empty chapter saying what it would hold — the thing that
// turns "nothing from Childhood yet" into something somebody can act on.
//
// Every chapter in CORE_CHAPTERS needs one. When a chapter was added without
// one the fallback printed the same sentence the label already said, and the
// card stuttered: "Nothing from When everything changed yet" twice over. A
// test now fails if a core chapter is missing its line.
const CHAPTER_PROMPTS = {
  "Where we come from": "Their parents, and the place the family started",
  Childhood: "What the house they grew up in was like",
  "Growing up": "School, friends, and who they were at sixteen",
  "Love & family": "How they met, and the family that followed",
  "Work & making a living": "The work they did, and what it cost them",
  "The world we lived through": "What was happening around them, and what it meant",
  "When everything changed": "The turns their life took, and the best of it",
  "Looking back": "What they make of it now, and what they would pass on",
  "Faith & what carried me": "What they believed, and what held them up",
};

function savedMemories(story) {
  return (story?.memories || []).filter((m) => m.status !== "in_progress");
}

/* A gap is a stretch of a life the archive says nothing about. Only gaps
   inside the range the archive already covers count — the years before the
   first memory and after the last aren't holes, they're edges. */
export function findDecadeGaps(story) {
  const dated = savedMemories(story)
    .map((m) => memoryDate(m).year)
    .filter((y) => y != null)
    .sort((a, b) => a - b);
  if (dated.length < 2) return [];

  const covered = new Set(dated.map(decadeOf));
  const first = decadeOf(dated[0]);
  const last = decadeOf(dated[dated.length - 1]);

  const gaps = [];
  for (let d = first + 10; d < last; d += 10) {
    if (covered.has(d)) continue;
    // Merge consecutive empty decades into one stretch — "1970s and 1980s"
    // is one hole in a life, not two.
    const prev = gaps[gaps.length - 1];
    if (prev && prev.to + 10 === d) prev.to = d;
    else gaps.push({ from: d, to: d });
  }

  return gaps.map((g) => ({
    ...g,
    label: g.from === g.to ? `${g.from}s` : `${g.from}s–${g.to}s`,
    ages:
      ageAt(story, g.from) != null
        ? `they were ${ageAt(story, g.from)}–${ageAt(story, g.to + 9)}`
        : null,
  }));
}

/* Chapters with nothing in them, in the order a life runs. */
export function findEmptyChapters(story) {
  const used = new Set(savedMemories(story).map((m) => normaliseEra(m.era)));
  return CORE_CHAPTERS.filter((c) => !used.has(c));
}

/* The whole picture, for the home screen and the book screen. */
export function bookProgress(story) {
  const saved = savedMemories(story);
  const count = saved.length;
  const emptyChapters = findEmptyChapters(story);
  const chaptersCovered = CORE_CHAPTERS.length - emptyChapters.length;
  const gaps = findDecadeGaps(story);

  const ratio = Math.min(1, count / BOOK_MIN_MEMORIES);
  // Coverage matters as much as volume: a book of one chapter isn't ready
  // however many memories it holds.
  const coverage = chaptersCovered / CORE_CHAPTERS.length;

  let state = "empty";
  if (count === 0) state = "empty";
  else if (count < BOOK_MIN_MEMORIES) state = "started";
  else if (coverage < 0.6) state = "lopsided";
  else state = "ready";

  return {
    count,
    remaining: Math.max(0, BOOK_MIN_MEMORIES - count),
    ratio,
    coverage,
    chaptersCovered,
    chaptersTotal: CORE_CHAPTERS.length,
    emptyChapters,
    gaps,
    state,
    headline: {
      empty: "Not started yet",
      // What's there, not what's missing: a count down to a goal reads as
      // homework, and this book has no finish line.
      started: `${count} ${count === 1 ? "memory" : "memories"} so far`,
      lopsided: "Enough memories, but the life is uneven",
      ready: "Ready to print whenever you are",
    }[state],
  };
}

/* The single best thing to ask about next, and a couple of runners-up.
   Empty chapters first (a missing chapter is a missing part of the book),
   then decades the archive skips over. */
export function nextPrompts(story, limit = 3) {
  const out = [];

  for (const chapter of findEmptyChapters(story)) {
    out.push({
      key: `chapter-${chapter}`,
      kind: "chapter",
      era: chapter,
      label: chapter,
      // Never the label again. The old fallback repeated the chapter name,
      // which is the line directly above it on the card.
      reason: CHAPTER_PROMPTS[chapter] || "A whole part of the life, still blank",
    });
    if (out.length >= limit) return out;
  }

  for (const gap of findDecadeGaps(story)) {
    out.push({
      key: `gap-${gap.from}`,
      kind: "decade",
      era: null,
      label: gap.label,
      reason: gap.ages
        ? `Nothing from these years, ${gap.ages}`
        : "Nothing from these years yet",
    });
    if (out.length >= limit) return out;
  }

  return out;
}
