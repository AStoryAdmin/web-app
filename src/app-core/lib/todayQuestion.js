// Today's question: the one rule Home and the widgets both ask.
//
// A new story (fewer than three memories) opens on the doors the new-story
// flow promised, seeded the same way, so the question somebody saw when the
// story was made is the one Home opens on. After that, the day's deck,
// derived from the date: the same questions all day however often it is
// asked, three on Free and the whole bank on a paid plan, with depth earned
// by how much has been kept (lib/dailyQuestion.js depthFor). Faith is
// unmetered and has its own way in, so a Free deck leaves it out.
//
// Pure (no React Native), so node can check it. The plan's rule lives in
// lib/usage.js, which touches storage; callers pass what it says:
//
//   const deck = todaysDeck({ story, user, people, key, unlimited: hasUnlimitedWriting(plan), perDay: FREE_DAILY_PROMPTS });
//   const q = questionForDay({ ...same, skips });
//
// A question pinned on the story for the day (`story.pinnedQuestion`, the
// demo's hero question under &hero or &call=1, hero-spec §6 T2) leads the
// storyteller's deck, so Home, the door and the call ask the same thing.
// Once a kept memory carries it (its `prompt` or `questionId`, H19), it is
// answered and drops out like any other: Home after the keep moves on to
// the next question instead of offering the one just answered (PF-1).
//
// Past the doors, every deck of a story leads with the family's question
// of the day (familyLead): the same question for the storyteller, the
// door and the people keeping the story, each in their own voice.
//
// The arc (20 Oct; the owner: first the life summary, then deeper): past
// the doors the day's walk is lib/dailyQuestion.js arcDeck, the chapter
// with least in it first. Once the life summary is filled (her profile and
// most of a life's chapters, lifeSummaryFilled below) it opens the deeper
// chapters: what she'd pass on, what it taught her. And the day a memory
// is kept and the day after, the first question is a follow-up on it
// (lib/followUps.js), for the storyteller and the family alike; once that
// is answered, the arc resumes.

import { dayKey, deckForDay, doorDeck, questionAt, depthFor, answeredBy, isAnswered, arcDeck, chapterCounts, LIFE_CHAPTERS } from "./dailyQuestion.js";
import { voicePrompts, storytellerGone, pronounOf } from "./questionVoice.js";
import { tellerFor } from "./teller.js";
import { leadFollowUp } from "./followUps.js";
import { schoolsOf, jobsOf, closeFamily } from "./personFacts.js";
import { buildIndex } from "./familyGraph.js";
import { FAITH_CHAPTER } from "../data/eras.js";

// Opened on the doors until a story has this many memories.
export const OPENER_UNTIL = 3;
// The life summary is filled, and the questions may go deeper, once her
// profile says when and where she was born or grew up, her schooling and
// her work, and this many of the seven chapters of a life have something
// in them. With no profile to read, the chapters alone: this many.
export const DEEPER_WITH_PROFILE = 4;
export const DEEPER_WITHOUT_PROFILE = 6;

const kept = (story) => (story?.memories || []).filter((m) => m && m.status !== "in_progress");

/* The story's pinned question while it is still unanswered, else null.
   It is in the storyteller's own words, so only their deck carries it. */
export function pinnedQuestion(story) {
  const p = story?.pinnedQuestion;
  if (!p?.question) return null;
  return isAnswered(p, answeredBy(story.memories)) ? null : p;
}

/* The family's question of the day: the first of the day's three, in the
   storyteller's walk, that can be asked in both voices. It depends only on
   the story and the date, never on who is looking or their plan, so the
   storyteller and everyone keeping the story are asked the same thing on
   the same day, each in their own words (truth check 1, T2): Rose "Which
   place changed your life?", Jamie "Which place changed Rose's life?".
   null while the story is new (its doors lead), or when nothing fits
   this voice (a relative's first week asks only what they witnessed). */
function familyLead({ story, people, saved, key, askable, phase, pronoun, facts, strict }) {
  if (saved.length < OPENER_UNTIL) return null;
  const own = voicePrompts(story.name, { gone: storytellerGone(story, people), pronoun, facts, strict }).filter((p) => p.era !== FAITH_CHAPTER);
  const day = arcDeck(own, story.memories, { key, size: 3, maxDepth: depthFor(saved.length), phase, preferShared: true });
  for (const q of day) {
    if (!q.alt) continue;
    const mine = askable.find((p) => p.id === q.id);
    if (mine) return mine;
  }
  return null;
}

/* Her profile, the old product's life summary: born when, where she was
   born or grew up, her schooling, her work. The story's own birth year
   counts when the tree has none. */
export function profileFilled(person, story) {
  if (!person) return false;
  const born = Number(person.birthYear || story?.birthYear) > 0;
  const where = !!String(person.birthPlace || person.grewUp || "").trim();
  const school = schoolsOf(person).length > 0;
  const work = jobsOf(person).length > 0 || !!String(person.work || "").trim();
  return born && where && school && work;
}

/* Whether the life summary is filled: her profile, and most of a life's
   chapters begun. The point past which the questions may go deeper. */
export function lifeSummaryFilled({ story, people = [] } = {}) {
  if (!story) return false;
  const counts = chapterCounts(story.memories);
  const begun = LIFE_CHAPTERS.filter((c) => counts.get(c)).length;
  const person = (people || []).find((p) => p && p.storyId && p.storyId === story.id);
  return profileFilled(person, story) ? begun >= DEEPER_WITH_PROFILE : begun >= DEEPER_WITHOUT_PROFILE;
}

/* What the family has said about her life, for the bank's `needs` column
   (lib/questionVoice.js needsMet): each true, false, or null for not said.
   The family's own word for her says some of it: a grandmother has
   children and grandchildren. Nothing in the tree records a "no" yet,
   except a faith of "none". */
const KIN_OF = {
  Grandmother: ["children", "grandchildren"],
  Grandfather: ["children", "grandchildren"],
  Mother: ["children"],
  Father: ["children"],
  Spouse: ["partner"],
  Sibling: ["siblings"],
};
const NO_FAITH = /^(none|no|no religion|not religious|non-religious|atheist)$/i;
export function lifeFactsFor({ story, people = [], family = null } = {}) {
  const out = { partner: null, children: null, grandchildren: null, siblings: null, faith: null, work: null, school: null, moved: null, loss: null };
  for (const k of KIN_OF[story?.relationship] || []) out[k] = true;
  const person = (people || []).find((p) => p && p.storyId && p.storyId === story?.id);
  if (!person) return out;
  const index = buildIndex(family || { people, edges: [] });
  const fam = closeFamily(index, person.id);
  if (fam.partners.length) out.partner = true;
  if (fam.children.length) out.children = true;
  if (fam.siblings.length) out.siblings = true;
  if (fam.children.some((c) => (index.childrenOf.get(c) || []).length)) out.grandchildren = true;
  if (jobsOf(person).length || String(person.work || "").trim()) out.work = true;
  if (schoolsOf(person).length) out.school = true;
  const faith = String(person.faith || "").trim();
  if (faith) out.faith = !NO_FAITH.test(faith);
  // What the family has said she didn't have (people.life_no, set on her
  // edit page). The tree outranks it: a husband in the tree is a partner,
  // whatever an old "never married" says.
  for (const [k, v] of Object.entries(person.lifeNo || {})) {
    if (v === true && k in out && out[k] !== true) out[k] = false;
  }
  return out;
}

/* Where the story is on the arc: "first", "life" or "deeper". */
export function arcPhaseFor({ story, people = [] } = {}) {
  if (kept(story).length < OPENER_UNTIL) return "first";
  return lifeSummaryFilled({ story, people }) ? "deeper" : "life";
}

/* The day's questions for `story`, in order. [] with no story.
   `family` ({ people, edges }) lets a follow-up call Henry "your father";
   `serverFollowUps` is lib/followUps.js fetchFollowUps' answer, when the
   AI server is on (SERVER_FEATURES.memoryHelp). */
export function todaysDeck({ story, user, people = [], family = null, key = dayKey(), unlimited = false, perDay = 3, serverFollowUps = null } = {}) {
  if (!story) return [];
  const teller = tellerFor({ story, user, people });
  const saved = kept(story);
  const pronoun = pronounOf(story, people);
  const relative = !teller.isStoryteller;
  const facts = lifeFactsFor({ story, people, family });
  // While she is new (the ladder's first rung), a row that needs a partner,
  // children or a faith waits until the family has said she has one.
  const strict = depthFor(saved.length) <= 2;
  const askable = voicePrompts(story.name, {
    facts,
    strict,
    relative,
    gone: storytellerGone(story, people),
    // A relative's first week asks only what they could have witnessed.
    witnessable: saved.length < 5,
    pronoun,
  }).filter((p) => unlimited || p.era !== FAITH_CHAPTER);
  const size = unlimited ? Infinity : perDay;
  const phase = arcPhaseFor({ story, people });
  // Opened on the doors while the story is new; once they're spent (or
  // none fit this voice), the day's walk along the arc, never an empty deck.
  let deck =
    (phase === "first" && doorDeck(askable, story.memories, { seed: `${user?.id || ""}:${story.name || ""}`, size })) ||
    (phase === "first"
      ? deckForDay(askable, story.memories, { key, size, maxDepth: depthFor(saved.length) })
      : arcDeck(askable, story.memories, { key, size, maxDepth: depthFor(saved.length), phase, relative }));
  // The family's question of the day leads every deck of this story.
  const lead = familyLead({ story, people, saved, key, askable, phase, pronoun, facts, strict });
  if (lead) {
    // The lead takes its chapter's turn in the walk, so "Ask me another"
    // moves on to the next chapter instead of asking the same one twice.
    const rest = deck.filter((q) => q.id !== lead.id);
    const same = phase === "first" ? -1 : rest.findIndex((q) => q.era === lead.era);
    deck = [lead, ...rest.filter((_, i) => i !== same)];
  }
  // The day a memory is kept and the day after, a follow-up on it leads,
  // ahead of the family's question: the same one for everyone, in Rose's
  // words or, for the family, as "Ask Rose".
  const fu = leadFollowUp({
    story,
    family: family || { people, edges: [] },
    key,
    voice: relative ? "about" : "storyteller",
    pronoun,
    server: serverFollowUps,
  });
  if (fu) deck = [fu, ...deck.filter((q) => q.id !== fu.id)];
  // The question pinned for the day (the door's) leads before it, while it
  // is unanswered: in the storyteller's words, or, for anyone else, in its
  // `about` wording when it has one ("…when Rose was small?"), and as
  // hers to answer: "Ask Rose", never Talk (judges night r4, day one).
  const p = pinnedQuestion(story);
  const pinned = teller.isStoryteller ? p : p?.about ? { ...p, question: p.about, alt: p.question, voice: "about", askThem: true } : null;
  if (!pinned) return Number.isFinite(size) ? deck.slice(0, size) : deck;
  const same = (q) => (pinned.id && q.id === pinned.id) || q.question === pinned.question;
  const out = [pinned, ...deck.filter((q) => !same(q))];
  return Number.isFinite(size) ? out.slice(0, size) : out;
}

/* Today's daily call, once it has rung and been answered or declined: the
   door says so (IncomingCall's Answer and "Not today", CallKit's answer),
   and Home after it says "A Story calls you again tomorrow at 10", not
   "today at 10" (FB-223, H19). Kept for the app session; the clock covers
   the rest (by its time, today's call is over anyway). */
const callDays = new Map();
export function noteTodaysCall(storyId, now = new Date()) {
  callDays.set(storyId || "*", dayKey(now));
}

/* Has today's call for `story` happened? Noted by the door, or a memory
   kept today answers the question pinned for the day (the door's: the
   call that asked it was answered and kept). */
export function todaysCallDone(story, now = new Date()) {
  const today = dayKey(now);
  if (callDays.get(story?.id) === today || callDays.get("*") === today) return true;
  const p = story?.pinnedQuestion;
  if (!p?.question) return false;
  const todays = kept(story).filter((m) => m.createdAt && dayKey(new Date(m.createdAt)) === today);
  return isAnswered(p, answeredBy(todays));
}

/* The question after `skips` taps of "Ask me another"; null past the end. */
export function questionForDay({ skips = 0, ...args } = {}) {
  return questionAt(todaysDeck(args), skips) || null;
}

/* The question Home has on its plate right now, as Talk's params, so the
   "+" sheet's Talk opens on the same question Home's own Answer › Talk
   would (FB-351: Jamie's question on Home, the bank's in + › Talk). Home
   notes it while it is in front and clears it when it leaves, so a "+"
   opened anywhere else talks as before. */
const homeTalk = new Map();
export function noteHomeQuestion(storyId, params) {
  if (!storyId) return;
  if (params && params.question) homeTalk.set(storyId, params);
  else homeTalk.delete(storyId);
}
export function homeQuestion(storyId) {
  return (storyId && homeTalk.get(storyId)) || null;
}
