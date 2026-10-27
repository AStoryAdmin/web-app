// Which questions the app puts in front of somebody today.
//
// Two rules shaped this. A question has to hold still: drawing one at random
// on every render makes the home screen a slot machine, and somebody who put
// the phone down halfway through an answer comes back to find it gone. And a
// free account gets a few a day rather than the whole bank, so the deck has
// to walk the 146 questions without ever handing back one it handed back
// yesterday.
//
// Both come out of the same trick: a stable shuffle of the bank, walked
// `size` at a time by the day's number. No storage, no server, and the same
// three questions whichever device you open — because nothing is remembered,
// only derived.

import { DOORS, doorQuestions } from "../data/doors.js";
import { CORE_CHAPTERS, FAMILY_CHAPTER, CATCH_ALL_CHAPTER, FAITH_CHAPTER, normaliseEra } from "../data/eras.js";

/* "2026-09-09", in local time — the day should turn over where the person
   is, not in Greenwich. */
export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/* A stable number in [0, 1) from a string — FNV-1a. Any hash would do; this
   one is four lines and drags nothing in behind it. */
export function hashUnit(str) {
  const s = String(str);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h / 0x100000000;
}

/* Days since the epoch — the integer that ticks over at midnight and makes
   tomorrow's deck different from today's. */
export function dayNumber(key = dayKey()) {
  const [y, m, d] = String(key).split("-").map(Number);
  if (!y || !m || !d) return 0;
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

/* The bank in a fixed, arbitrary order — the same for everybody, forever,
   but not the order the spreadsheet happens to be in (which runs chapter by
   chapter, so a plain walk would spend a fortnight on Childhood). */
function shuffled(prompts) {
  return [...(prompts || [])]
    .map((p, i) => ({ p, k: hashUnit(p.id || p.question || i) }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.p);
}

/* How deep the app has earned the right to go.
 *
 * Nobody's first question should be "what do you regret", and nobody eighty
 * memories in still wants "where were you born". This is the difference
 * between conducting an interview and handing out questions: an interviewer
 * opens with facts, moves to scenes, then to the people, then to what things
 * cost, and only then asks what it all meant. The archive's size is the only
 * honest measure of how far in we've got — somebody who has written thirty
 * memories has shown us they mean it.
 *
 * It's a ceiling, not a floor: a deep archive still gets easy questions, it
 * just also gets the hard ones. Answered questions are already filtered out,
 * so the shallow end drains itself.
 */
export function depthFor(memoryCount = 0) {
  const n = Number(memoryCount) || 0;
  if (n < 5) return 2; // a fact or a scene, nothing that asks anything of them
  if (n < 15) return 3; // now the people, and what repeated
  if (n < 30) return 4; // now what it cost
  return 5; // everything, including what they made of it
}

/* Today's questions.
   prompts  — the rendered list from getPrompts()
   memories — the story's memories, for what's already been answered
   key      — the day it is
   maxDepth — how far in to reach; see depthFor above
   size     — how many to offer. Three on a free account; the whole bank on
              a paid one, which is the same walk with no lid on it.

   Questions already answered are dropped before the walk, so a bank that's
   been half worked through doesn't start serving up blanks. Answers are
   matched on what a memory stores of the question it answered (its
   `prompt` and `questionId`, H19), and on its title, which is what an
   older memory's question became (answeredBy, below). */

/* What a story has already answered, read off its memories once (PF-1,
   DECISIONS H19). A memory kept from a question stores the words it was
   asked (`prompt`) and, for a question from the bank or the day's pinned
   one, its id (`questionId`). An older memory has only its title, which
   is what its question used to become, so the title still counts.
   → { texts: Set, ids: Set } */
export function answeredBy(memories = []) {
  const texts = new Set();
  const ids = new Set();
  for (const m of memories || []) {
    if (!m) continue;
    const title = String(m.title || "").trim();
    const prompt = String(m.prompt || "").trim();
    if (title) texts.add(title);
    if (prompt) texts.add(prompt);
    if (m.questionId) ids.add(String(m.questionId));
  }
  return { texts, ids };
}

/* Whether `q` is among them, in either wording: a question asked of a
   relative carries the storyteller's wording as `alt`, and the other way
   round (lib/questionVoice.js), so answering it in one voice answers both. */
export function isAnswered(q, answered) {
  if (!q || !answered) return false;
  if (q.id && answered.ids.has(String(q.id))) return true;
  const text = String(q.question || "").trim();
  if (text && answered.texts.has(text)) return true;
  if (q.alt && answered.texts.has(String(q.alt).trim())) return true;
  // An earlier wording of a reworded row (the bank's `was` column).
  return (q.was || []).some((t) => answered.texts.has(String(t).trim()));
}

export function deckForDay(
  prompts,
  memories = [],
  { key = dayKey(), size = 3, maxDepth = 5 } = {}
) {
  const answered = answeredBy(memories);
  let pool = shuffled(prompts).filter((q) => q?.question && !isAnswered(q, answered));

  // Hold back anything deeper than we've earned. If that empties the pool —
  // a shallow archive that has already answered every warm-up — the ladder
  // gets out of the way rather than handing back nothing.
  const shallow = pool.filter((q) => (q.depth || 1) <= maxDepth);
  if (shallow.length) pool = shallow;

  // While the archive is new (maxDepth 2 is exactly that regime — see
  // depthFor), the walk stays on the rows hand-tagged `week1` in the bank:
  // a first week that feels chosen, not dealt. The tag drains itself — once
  // every week1 row is answered the filter matches nothing and the walk
  // opens out to the whole shallow pool.
  if (maxDepth <= 2) {
    const chosen = pool.filter((q) => (q.tags || []).includes("week1"));
    if (chosen.length) pool = chosen;
  }

  if (!pool.length) return [];

  const take = Math.min(size, pool.length);
  // Consecutive days start `size` apart, so yesterday's three and today's
  // three never overlap until the whole pool has been round once.
  //
  // Stepped by `take`, not by `size`, because `size` is Infinity for anybody
  // with unlimited writing — and `Infinity % n` is NaN. That made `start`
  // NaN, and `pool[NaN + i]` undefined, so the deck came back with the right
  // *length* and nothing in it: 504 entries, every one undefined. Every
  // caller then read `questionAt(deck, 0)` as falsy while `deck.length > 0`,
  // which is exactly the shape of `outOfQuestions` — so the home screen told
  // every paid, trial and complimentary account "that's today's 3 questions"
  // on their first morning and every morning after, and offered them a link
  // to buy the plan they were already on. Nothing about it looked like a
  // crash, which is why it lasted.
  //
  // When the whole bank is on offer there is nothing to stagger — take ===
  // pool.length, so this lands on 0 and the deck is the whole shuffle in
  // order, which is the right answer for "no lid on it".
  const step = Number.isFinite(size) ? size : take;
  const start = ((dayNumber(key) * step) % pool.length + pool.length) % pool.length;
  const out = [];
  for (let i = 0; i < take; i++) out.push(pool[(start + i) % pool.length]);
  return out;
}

/* The very first question, asked the moment a story exists.

   The first memory decides whether there is a second, so this one has to
   be the easiest question in the bank to say yes to: a fact or a scene
   (depth 1), nothing sensitive, from Childhood — where every life has
   something, and nobody has to decide what their life "meant" before
   they've said a word into it. Chosen by the story, so it's stable if they
   leave and come back, and two siblings starting stories don't get the
   same one. */
/* The openers: a scene somebody can walk into and keep talking. The
   easiest depth-1 questions were facts ("What do the grandchildren call
   Grace?", "How did you get to school?"), answered in a word, and the free
   first conversation is ten minutes long. A relative is asked for their own
   memory of the storyteller, not the storyteller's facts, which they
   mostly don't know. */
export const OPENERS = {
  storyteller: [
    "child-house-walk",
    "child-kitchen-smell",
    "roots-street",
    "child-summer-smell",
    "child-hiding",
    "child-game-gone",
    "child-treat",
    "day-at-ten",
  ],
  about: [
    "family-first-memory",
    "family-favorite-story",
    "family-cooked",
    "family-picture",
    "family-laughed",
    "family-taught",
    "family-house-smell",
  ],
};

/* The first days on Home, before the deck. Until a story has a few memories,
   the home screen's card comes from the same eight openers the new-story
   flow promises — "Walk me in through your front door", not "Which place
   changed Rose's life?". Ordered by the same seeded sort as
   firstMemoryQuestion, so the question somebody was shown when the story
   was made is the question Home opens on. Returns null once every opener
   is answered (or none fit this voice), and the caller falls back to
   deckForDay. */
export function openerDeck(prompts, memories = [], { seed = "", size = 3 } = {}) {
  const answered = answeredBy(memories);
  const list = prompts || [];
  const voice = list.some((p) => p?.voice === "about") ? "about" : "storyteller";
  const wanted = new Set(OPENERS[voice]);
  const open = list.filter(
    (p) => p?.question && wanted.has(p.id) && !p.sensitive && !isAnswered(p, answered)
  );
  if (!open.length) return null;
  const sorted = [...open].sort(
    (a, b) => hashUnit(`${seed}:${a.id}`) - hashUnit(`${seed}:${b.id}`)
  );
  return Number.isFinite(size) ? sorted.slice(0, size) : sorted;
}

/* The first days' walk for "Change": one door at a time. The opener the
   new-story flow promised still leads, and each skip after it steps to the
   NEXT door — the house, then food, then the parents — rather than
   reshuffling the same first-week pool (review of 15 Oct). Behind each
   door, its shallowest unanswered question; a door the opener already
   belongs to is skipped, and a drained door simply isn't there. Null when
   nothing is left to offer, and the caller falls back to deckForDay. */
export function doorDeck(prompts, memories = [], { seed = "", size = 3 } = {}) {
  const answered = answeredBy(memories);
  const first = (openerDeck(prompts, memories, { seed, size: 1 }) || [])[0] || null;
  const steps = DOORS.filter((door) => !first || !door.questions.includes(first.id))
    .map((door) => doorQuestions(door, prompts, answered.texts).find((q) => !isAnswered(q, answered)))
    .filter(Boolean);
  const out = first ? [first, ...steps] : steps;
  if (!out.length) return null;
  return Number.isFinite(size) ? out.slice(0, size) : out;
}

export function firstMemoryQuestion(prompts, seed = "") {
  const list = prompts || [];
  const voice = list.some((p) => p?.voice === "about") ? "about" : "storyteller";
  const wanted = new Set(OPENERS[voice]);
  const openers = list.filter((p) => p?.question && wanted.has(p.id) && !p.sensitive);
  if (openers.length) {
    return [...openers].sort((a, b) => hashUnit(`${seed}:${a.id}`) - hashUnit(`${seed}:${b.id}`))[0];
  }
  const easy = list.filter(
    (p) => p?.question && !p.sensitive && (p.depth || 1) <= 1 && p.era === "Childhood"
  );
  const pool = easy.length
    ? easy
    : (prompts || []).filter((p) => p?.question && !p.sensitive && (p.depth || 1) <= 2);
  if (!pool.length) return null;
  return [...pool].sort((a, b) => hashUnit(`${seed}:${a.id}`) - hashUnit(`${seed}:${b.id}`))[0];
}

/* The single question the home screen leads with, and what "ask me another"
   moves to. `skips` walks the deck and stops at its end rather than wrapping
   — on a free account running out is the point, and it's what the screen
   needs to know to say so. Returns null when the deck is spent. */
export function questionAt(deck, skips = 0) {
  if (!deck || !deck.length) return null;
  return skips < deck.length ? deck[skips] : null;
}

/* ── The arc (20 Oct) ──────────────────────────────────────────────────

   The old product had a shape the new one lost: a person filled in their
   own profile first, the life summary, and only then did the questions go
   deeper, into what they think and what they'd pass on. The new product
   asks one question a day, on Home, on the call and on the widget, so the
   shape has to live in which question that is. Three stretches:

     first   the doors (data/doors.js): gentle and concrete, a scene to
             walk into. Until a story has OPENER_UNTIL memories
             (todayQuestion.js).
     life    the broad chapters of a life, the seven in LIFE_CHAPTERS.
     deeper  once the life summary is filled (todayQuestion.js
             lifeSummaryFilled): the same chapters, plus what she'd pass
             on, what it taught her and, offered gently and never first,
             what she'd do differently ("Looking back"; "Faith & what
             carried me" where the plan opens it).

   The order comes from what's already kept: the chapter with the fewest
   memories goes first, ties in the order a life runs, so the deck never
   asks a chapter twice before the others are begun. "Ask me another"
   steps to the next chapter, never deeper into the same one. Inside a
   chapter the walk is the same stable, day-numbered shuffle as
   deckForDay: the same all day, a different one tomorrow. */


// The chapters of a life as it was lived: every core chapter but the one
// that looks back on it. Seven, the Book's count of a life's chapters.
export const REFLECTION_CHAPTER = "Looking back";
export const LIFE_CHAPTERS = CORE_CHAPTERS.filter((c) => c !== REFLECTION_CHAPTER);
// What "deeper" adds.
export const DEEPER_CHAPTERS = [REFLECTION_CHAPTER, FAITH_CHAPTER];
// Tags that only ever arrive in the deeper stretch: nobody's second week
// asks what they regret.
export const DEEPER_TAGS = new Set(["regret", "pass-on", "wisdom", "mortality", "secrets", "forgiveness"]);
export const ARC_PHASES = ["first", "life", "deeper"];
export const DEEPER_HEAD_START = 2;
// The sensitive kinds that ask for a secret or a falling-out.
export const INTRUSIVE = new Set(["private", "rupture"]);

/* Kept memories per chapter. → Map(chapter → count) */
export function chapterCounts(memories = []) {
  const counts = new Map();
  for (const m of memories || []) {
    if (!m || m.status === "in_progress") continue;
    const era = normaliseEra(m.era);
    counts.set(era, (counts.get(era) || 0) + 1);
  }
  return counts;
}

/* The chapters this stretch opens, thinnest first, ties in life order.
   A relative's own chapter ("From the family") is theirs to answer in
   every stretch; "Anything else" (songs, recipes, sayings) comes last on
   a tie, since it is the book's catch-all. */
export function arcChapters(phase, counts = new Map(), { relative = false } = {}) {
  const open = [
    ...(relative ? [FAMILY_CHAPTER] : []),
    ...LIFE_CHAPTERS,
    ...(phase === "deeper" ? DEEPER_CHAPTERS : []),
    CATCH_ALL_CHAPTER,
  ];
  const deeper = new Set(phase === "deeper" ? DEEPER_CHAPTERS : []);
  return open
    .map((era, i) => {
      const n = counts.get(era) || 0;
      // Not begun yet goes first. The catch-all is never "not begun": it
      // is a bucket, not a part of the life.
      const begun = n > 0 || era === CATCH_ALL_CHAPTER ? 1 : 0;
      // Past the life summary, what she'd pass on leans in: counted as if
      // it held DEEPER_HEAD_START fewer memories than it does.
      const weight = deeper.has(era) ? n - DEEPER_HEAD_START : n;
      return { era, i, begun, weight };
    })
    .sort((a, b) => a.begun - b.begun || (a.begun ? a.weight - b.weight : 0) || a.i - b.i)
    .map((x) => x.era);
}

/* The day's deck along the arc.
   prompts  — one voice of the bank (questionVoice.js voicePrompts)
   memories — the story's memories: what's answered, and how full each
              chapter is
   phase    — "life" or "deeper" ("first" is the doors' job; given it, this
              behaves as "life")
   maxDepth — the ceiling (depthFor); deeper lifts it to 4 at least
   size     — 3 on Free, Infinity on a paid plan
   The first question is never sensitive: a question that could open grief
   is offered after "Ask me another", never as the day's question. */
export function arcDeck(prompts, memories = [], { key = dayKey(), size = 3, maxDepth = 5, phase = "life", relative = false, preferShared = false } = {}) {
  const answered = answeredBy(memories);
  const deeper = phase === "deeper";
  const ceiling = deeper ? Math.max(maxDepth, 4) : maxDepth;
  const open = (prompts || []).filter(
    (q) =>
      q?.question &&
      !isAnswered(q, answered) &&
      (deeper || !(q.tags || []).some((t) => DEEPER_TAGS.has(t)))
  );
  if (!open.length) return [];

  const byChapter = new Map();
  for (const q of open) {
    const era = normaliseEra(q.era);
    if (!byChapter.has(era)) byChapter.set(era, []);
    byChapter.get(era).push(q);
  }
  const day = dayNumber(key);
  // Each chapter's walk for today: within the ceiling (or its shallowest
  // when the ceiling empties it), shuffled once, turned by the day.
  const walks = arcChapters(phase, chapterCounts(memories), { relative })
    .filter((era) => byChapter.has(era))
    .map((era) => {
      const all = byChapter.get(era);
      const within = all.filter((q) => (q.depth || 1) <= ceiling);
      const floor = Math.min(...all.map((q) => q.depth || 1));
      const pool = shuffled(within.length ? within : all.filter((q) => (q.depth || 1) <= floor));
      const turn = (list) => {
        const start = list.length ? ((day % list.length) + list.length) % list.length : 0;
        return list.map((_, i) => list[(start + i) % list.length]);
      };
      // The family's question of the day has to be one the family can be
      // asked too: those first, each part turned by the day.
      const walk = preferShared ? [...turn(pool.filter((q) => q.alt)), ...turn(pool.filter((q) => !q.alt))] : turn(pool);
      // Nothing intrusive by default: a question marked private or a
      // falling-out ("What could you never forgive?") comes after every
      // other question in its chapter, so a three-question day never
      // reaches it while there is anything gentler to ask.
      return [...walk.filter((q) => !INTRUSIVE.has(q.sensitive)), ...walk.filter((q) => INTRUSIVE.has(q.sensitive))];
    });
  if (!walks.length) return [];

  // Round the chapters: one from each, thinnest first, then round again.
  const out = [];
  const total = walks.reduce((n, w) => n + w.length, 0);
  const want = Math.min(Number.isFinite(size) ? size : total, total);
  for (let round = 0; out.length < want; round++) {
    let took = false;
    for (const w of walks) {
      if (round < w.length) {
        out.push(w[round]);
        took = true;
        if (out.length >= want) break;
      }
    }
    if (!took) break;
  }
  // Never a sensitive question first.
  const gentle = out.findIndex((q) => !q.sensitive);
  if (gentle > 0) out.unshift(...out.splice(gentle, 1));
  return out;
}
