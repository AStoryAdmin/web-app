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
   matched on the memory's title, which is what the question becomes — so a
   question answered out loud in a call counts here too. */
export function deckForDay(
  prompts,
  memories = [],
  { key = dayKey(), size = 3, maxDepth = 5 } = {}
) {
  const answered = new Set(
    (memories || []).map((m) => (m?.title || "").trim()).filter(Boolean)
  );
  // In either wording: a question asked of a relative carries the
  // storyteller's wording as `alt`, and the other way round
  // (lib/questionVoice.js), so answering it in one voice answers both.
  let pool = shuffled(prompts).filter(
    (q) => q?.question && !answered.has(q.question.trim()) && !(q.alt && answered.has(q.alt.trim()))
  );

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
  const answered = new Set(
    (memories || []).map((m) => (m?.title || "").trim()).filter(Boolean)
  );
  const list = prompts || [];
  const voice = list.some((p) => p?.voice === "about") ? "about" : "storyteller";
  const wanted = new Set(OPENERS[voice]);
  const open = list.filter(
    (p) =>
      p?.question &&
      wanted.has(p.id) &&
      !p.sensitive &&
      !answered.has(p.question.trim()) &&
      !(p.alt && answered.has(p.alt.trim()))
  );
  if (!open.length) return null;
  const sorted = [...open].sort(
    (a, b) => hashUnit(`${seed}:${a.id}`) - hashUnit(`${seed}:${b.id}`)
  );
  return Number.isFinite(size) ? sorted.slice(0, size) : sorted;
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
