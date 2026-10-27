// When a memory happened, and how to lay a life out in order.
//
// A memory's date is free text the family typed into `period` — "June 1975",
// "Summer of '68", "1970-1998", "early 80s". That's deliberate: nobody
// remembers their childhood in ISO 8601. But an archive that can't sort by
// when things happened isn't an archive, it's a pile. So everything that
// needs an order goes through here.
//
// `createdAt` is never used as the date of a memory — that's when it was
// *recorded*, which for a story about 1952 is off by seventy years. A memory
// with no readable year is undated, and the UI asks for one rather than
// pretending.

import { eraForAge, chapterDistance } from "../data/eras.js";
import { isTreasured } from "./treasured.js";
import { pronounOf } from "./questionVoice.js";

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

// Rough seasons → the middle month, so "Summer 1968" sorts between spring and
// autumn of the same year instead of falling to January.
const SEASONS = { winter: 1, spring: 4, summer: 7, fall: 10, autumn: 10 };

// The earliest year read as a date — the same floor as memoryDateInput. A typo guard, not a judgement about
// history: A Story is also used to write down ancestors, and family trees
// built from parish records reach back into the 1600s. It still refuses the
// slips that matter — "1069" typed for 1960 — which a floor any lower would
// let through as a real date.
const YEAR_MIN = 1600;
const YEAR_MAX = new Date().getFullYear() + 1;

/* Two-digit years: "'68" is 1968, "'05" is 2005. The cut-off is the current
   two-digit year — nobody writes "'47" meaning 2047 in a life story. */
function expandTwoDigitYear(n) {
  const cutoff = new Date().getFullYear() % 100;
  return n <= cutoff ? 2000 + n : 1900 + n;
}

function inRange(y) {
  return y >= YEAR_MIN && y <= YEAR_MAX;
}

/* Pull a year out of free text. Returns null when there isn't one. */
export function parseYear(text) {
  if (!text) return null;
  const s = String(text);

  // A decade — "the 1960s", "early 1980s" — anchors on the decade's start.
  const decade = s.match(/\b(1[6-9]\d0|20[0-4]0)\s*'?s\b/);
  if (decade) {
    const y = Number(decade[1]);
    if (inRange(y)) return y;
  }

  // A plain four-digit year. The first one wins, so a range like "1970-1998"
  // sorts from where it started.
  const four = s.match(/\b(1[6-9]\d\d|20\d\d)\b/);
  if (four) {
    const y = Number(four[1]);
    if (inRange(y)) return y;
  }

  // An apostrophised two-digit year: "Summer of '68", "class of ’05".
  const two = s.match(/['’](\d{2})\b/);
  if (two) {
    const y = expandTwoDigitYear(Number(two[1]));
    if (inRange(y)) return y;
  }

  // Bare two-digit decade: "the 60s", "mid 90s".
  const bareDecade = s.match(/\b(\d0)\s*'?s\b/);
  if (bareDecade) {
    const y = expandTwoDigitYear(Number(bareDecade[1]));
    if (inRange(y)) return y;
  }

  return null;
}

/* A month number (1-12) for ordering inside a year, or null. Months beat
   seasons when both appear. */
export function parseMonth(text) {
  if (!text) return null;
  const s = String(text).toLowerCase();

  for (let i = 0; i < MONTHS.length; i++) {
    // Three-letter prefixes catch "Sept", "Jan.", "aug 1971".
    const m = MONTHS[i];
    if (new RegExp(`\\b${m.slice(0, 3)}[a-z]*\\.?\\b`).test(s)) {
      // "may" is also an ordinary English word; only take it when it looks
      // like a date (next to a number) or stands alone.
      if (m === "may" && !/\bmay\b\s*\d|\d\s*\bmay\b|^may$/.test(s)) continue;
      return i + 1;
    }
  }

  for (const [name, month] of Object.entries(SEASONS)) {
    if (s.includes(name)) return month;
  }

  return null;
}

/* Everything the timeline needs to know about when a memory happened. */
export function memoryDate(memory) {
  const text = memory?.period || "";
  const year = parseYear(text);
  const month = parseMonth(text);
  return { year, month, text, dated: year != null };
}

/* Age at the time of a memory, when the story knows a birth year. Returns
   null rather than a negative or absurd number — a memory dated before the
   birth year is a typo, not a fact to display. */
export function ageAt(story, year) {
  const birth = parseYear(story?.birthYear);
  if (!birth || year == null) return null;
  const age = year - birth;
  if (age < 0 || age > 120) return null;
  return age;
}

/* "age 30" — the line under a year heading. The year of the birth itself
   names the person the way the question bank does (FB-174, R-B3): "you"
   on your own story, "she" or "he" from the tree or the story's own word
   ("Grandmother"), else the name, and "they" only for nobody named.
   `people` is the family tree's people, when the caller has them. */
export function ageLabel(story, year, { people = [] } = {}) {
  const age = ageAt(story, year);
  if (age == null) return null;
  if (age === 0) {
    if (story?.relationship === "Myself") return "the year you were born";
    const pronoun = pronounOf(story, people);
    if (pronoun) return `the year ${pronoun} was born`;
    const name = String(story?.name || "").trim().split(/\s+/)[0];
    return name ? `the year ${name} was born` : "the year they were born";
  }
  return `age ${age}`;
}

/* Sort key: chronological, undated last. `dir` is 1 for oldest-first (the
   order a life is lived, and the order the book prints in) or -1 for newest
   first. */
function compareByDate(a, b, dir) {
  const da = memoryDate(a);
  const db = memoryDate(b);
  if (da.dated !== db.dated) return da.dated ? -1 : 1; // undated sink
  if (!da.dated) {
    // Among undated memories, most recently recorded first — that's the only
    // order there is for them.
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  }
  if (da.year !== db.year) return (da.year - db.year) * dir;
  const ma = da.month ?? 13;
  const mb = db.month ?? 13;
  if (ma !== mb) return (ma - mb) * dir;
  return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
}

export function sortByDate(memories, dir = 1) {
  return [...memories].sort((a, b) => compareByDate(a, b, dir));
}

/* Group a life by the year things happened.
   → [{ key, year, label, ageLabel, items }, …] with an "undated" group last.
   `dir` 1 = oldest first, -1 = newest first. */
export function groupByYear(memories, { story, dir = 1 } = {}) {
  const groups = new Map();
  const undated = [];

  for (const m of memories) {
    const { year } = memoryDate(m);
    if (year == null) {
      undated.push(m);
      continue;
    }
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year).push(m);
  }

  const out = [...groups.entries()]
    .sort((a, b) => (a[0] - b[0]) * dir)
    .map(([year, items]) => ({
      key: String(year),
      year,
      label: String(year),
      ageLabel: ageLabel(story, year),
      items: sortByDate(items, dir),
    }));

  if (undated.length) {
    out.push({
      key: "undated",
      year: null,
      label: "No date yet",
      ageLabel: null,
      undated: true,
      items: sortByDate(undated, dir),
    });
  }

  return out;
}

/* Does this memory's chapter match when it happened?
   A memory dated 1975 in a life that began in 1945 is not a childhood
   memory, however it got filed — usually because a chapter was picked in a
   hurry, or an import guessed with no birth year to go on. Only a clear
   mismatch counts (two chapters apart or more): "Career" filed as
   "Love & family" is a judgement call, not an error, and the app has no
   business second-guessing it. Returns null when there's nothing to say. */
export function chapterMismatch(story, memory) {
  const { year } = memoryDate(memory);
  const age = ageAt(story, year);
  if (age == null) return null;

  const filed = memory?.era;
  // Four chapters can't be wrong about an age: what someone learned isn't a
  // stretch of years, where they come from is mostly before they were born,
  // the world they lived through can land in any decade, and the catch-all is
  // a deliberate shrug.
  if (
    !filed ||
    [
      "Looking back",
      "Where we come from",
      "The world we lived through",
      "When everything changed",
      "Faith & what carried me",
      "From the family",
      "Anything else",
    ].includes(filed)
  ) {
    return null;
  }

  const suggested = eraForAge(age);
  if (!suggested || suggested === filed) return null;
  if (chapterDistance(filed, suggested) < 2) return null;

  return { age, year, filed, suggested };
}

/* The decade a year belongs to, for the rail's decade markers: 1975 → 1970. */
export function decadeOf(year) {
  return year == null ? null : Math.floor(year / 10) * 10;
}

/* Memories from this month in earlier years ("This month, 62 years ago").
   A family album's best trick: the same date coming round again. Only
   memories whose date says a month qualify — "1975" alone isn't "this
   month", and pretending otherwise would put the same entry in front of
   someone twelve times a year.

   At least ANNIVERSARY_MIN_YEARS back: last week is not an anniversary, and
   a memory dated this month this year used to read "happened this month in
   2026". The oldest first (the biggest gap is the one worth telling); in a
   tie, a treasured memory, then the newest made. Each hit carries
   `yearsAgo`. */
export const ANNIVERSARY_MIN_YEARS = 2;

export function onThisMonth(memories, now = new Date()) {
  const month = now.getMonth() + 1;
  const thisYear = now.getFullYear();
  const made = (m) => new Date(m.createdAt || 0).getTime() || 0;
  return (memories || [])
    .filter((m) => m && m.status !== "in_progress")
    .map((m) => ({ memory: m, date: memoryDate(m) }))
    .filter(({ date }) => date.dated && date.month === month && thisYear - date.year >= ANNIVERSARY_MIN_YEARS)
    .sort(
      (a, b) =>
        a.date.year - b.date.year ||
        Number(isTreasured(b.memory)) - Number(isTreasured(a.memory)) ||
        made(b.memory) - made(a.memory)
    )
    .map(({ memory, date }) => ({ memory, year: date.year, yearsAgo: thisYear - date.year }));
}

const SMALL_NUMBERS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

/* "This month, 62 years ago" / "This month, five years ago": numbers up to
   ten as words, above ten as digits. */
export function yearsAgoKicker(yearsAgo) {
  const n = Math.round(Number(yearsAgo));
  if (!Number.isFinite(n) || n < 1) return "This month";
  const said = n <= 10 ? SMALL_NUMBERS[n] : String(n);
  return `This month, ${said} ${n === 1 ? "year" : "years"} ago`;
}

/* The words for the anniversary wherever it shows (the Archive's card,
   Home's slot, the daily reminder): the oldest hit for this story, or
   null. `excerpt` is the memory's first line. */
export function anniversaryOf(story, now = new Date()) {
  const hit = onThisMonth(story?.memories, now)[0];
  if (!hit) return null;
  const m = hit.memory;
  const title = String(m.title || "").trim() || "A memory";
  const firstLine = String(m.body || "")
    .split(/\n+/)
    .map((l) => l.trim())
    .find(Boolean);
  return {
    memory: m,
    year: hit.year,
    yearsAgo: hit.yearsAgo,
    kicker: yearsAgoKicker(hit.yearsAgo),
    title,
    excerpt: firstLine || null,
    reminder: `“${title}” was this month, ${hit.yearsAgo} years ago. Tell it while it's in mind?`,
    talkQuestion: `Tell me more about “${title}”.`,
  };
}

/* Headline numbers for the archive header — the same three-stat rhythm the
   marketing site uses in its hero. */
export function archiveStats(story, extraCount = 0) {
  const saved = (story?.memories || []).filter((m) => m.status !== "in_progress");
  const years = new Set();
  let dated = 0;
  for (const m of saved) {
    const { year } = memoryDate(m);
    if (year != null) {
      years.add(year);
      dated += 1;
    }
  }
  const sorted = [...years].sort((a, b) => a - b);
  const chapters = new Set(saved.map((m) => m.era).filter(Boolean));

  return {
    memories: saved.length + extraCount,
    dated,
    undated: saved.length - dated,
    years: sorted,
    span: sorted.length
      ? { from: sorted[0], to: sorted[sorted.length - 1] }
      : null,
    chapters: chapters.size,
  };
}
