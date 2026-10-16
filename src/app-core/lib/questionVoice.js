// Whose voice a question is asked in.
//
// The bank is written to the storyteller ("What did your father's hands
// look like?"). Most of the people using the app aren't the storyteller:
// they're the grandchild or the daughter keeping Grandpa's story. Since
// 2026-10-09 every question a relative can answer also has its turned-
// round wording in the bank's `about` column ("What did Hưng's father's
// hands look like?"), and this picks which one a person sees:
//
//   the storyteller  → the bank as written, without "From the family",
//                      which is written to relatives about the storyteller
//                      ("What's your first memory of {name}?") and would ask
//                      Grandpa about himself;
//   a relative       → the questions they can answer, in their wording.
//
// Each question carries its other wording (`alt`), so a question answered
// in either voice counts as answered in both: Grandpa telling "What kind
// of work did your father do?" on a call takes "What kind of work did
// Hưng's father do?" off Jamie's list too. Answers are matched on the
// memory's title, which is what a question becomes.
//
// Pure, so it's tested.

import { getPrompts, getAboutPrompts } from "../data/interview.js";
import { FAMILY_CHAPTER } from "../data/eras.js";

/* The bank in one voice. `relative` true: the relative's wording. Each
   prompt gains `alt` (the same question in the other voice, or null) and
   `voice` ("storyteller" | "about"). An era or tag with nothing in this
   voice falls back to the whole of it, as getPrompts does. */
/* Held back from every deck, in either voice: questions written as last
   words ("What do you want each of them to know you thought of them?",
   "Who do you picture reading this?"), which the house rule against
   framing anything around an ending rules out. They stay in the bank for
   the session reworking it (content/questions.csv) to rewrite. */
export const HELD = new Set([
  "later-think-about-dying",
  "reader-permission",
  "reader-proud-of-them",
  "reader-who-reading",
  "reader-not-born",
  "faith-blessing-write",
  "reader-forgive-me",
]);

/* Asked of a relative only once the family tree says the storyteller has
   died: "What do you miss about Rose?" about a grandmother who is alive
   would be the worst question in the bank. */
export const ONLY_WHEN_GONE = new Set(["family-last-thing", "family-miss"]);

/* Rows tagged `ask-them` in the bank are relays in their about wording —
   "What has {name} told you about the street she grew up on?" asks the
   grandchild for the storyteller's memory, not their own. In the relative's
   voice they are never a warm-up: their depth is lifted to 3 so they stay
   out of a new family's first week, and they carry `askThem` so a screen
   can offer "Ask Rose" instead of a blank composer. */
const ASK_THEM = "ask-them";

/* What a relative could actually have witnessed: the person's ways, food,
   voice, objects, rituals and places — not the facts of a life they weren't
   there for. A new relative's deck is held to these (plus the whole of
   "From the family", which is written to them) until the archive has a few
   memories in it. */
export const WITNESSABLE = new Set([
  "people",
  "food",
  "voice",
  "objects",
  "rituals",
  "place",
  "home",
  "sayings",
  "music",
  "customs",
  "skills",
  "family",
]);

/* Whether the family tree says this story's storyteller has died. Unknown
   counts as living: a loss question is never asked on a guess. */
export function storytellerGone(story, people = []) {
  if (!story) return false;
  const p = (people || []).find((x) => x && x.storyId && x.storyId === story.id);
  return !!p?.deathYear;
}

export function voicePrompts(name, { relative = false, era, tag, gone = false, firstWeek = false } = {}) {
  const fits = (p) => !HELD.has(p.id) && (gone || !ONLY_WHEN_GONE.has(p.id));
  const all = getPrompts(name).filter(fits);
  if (relative) {
    const told = new Map(all.map((p) => [p.id, p.question]));
    let list = getAboutPrompts(name, { era, tag }).filter(fits);
    if (!list.length) list = getAboutPrompts(name).filter(fits);
    let out = list.map((p) => {
      const askThem = (p.tags || []).includes(ASK_THEM);
      return {
        ...p,
        depth: askThem ? Math.max(p.depth || 1, 3) : p.depth,
        askThem,
        alt: told.get(p.id) || null,
        voice: "about",
      };
    });
    // A relative's first week: only what they remember themselves — "From
    // the family", and the everyday subjects they could have witnessed.
    // Never a relay (askThem) and never a fact only the storyteller knows.
    if (firstWeek) {
      out = out.filter(
        (p) =>
          !p.askThem &&
          (p.era === FAMILY_CHAPTER || (p.tags || []).some((t) => WITNESSABLE.has(t)))
      );
    }
    return out;
  }
  const own = (list) => list.filter((p) => p.era !== FAMILY_CHAPTER && fits(p));
  let list = own(getPrompts(name, { era, tag }));
  if (!list.length) list = own(all);
  return list.map((p) => ({ ...p, alt: p.about || null, voice: "storyteller" }));
}

/* A question somebody arrived holding (its words, from the question of
   the day or a notification), found in the bank in either voice, or null. */
export function findPrompt(question, name) {
  const q = String(question || "").trim();
  if (!q) return null;
  for (const relative of [false, true]) {
    const hit = voicePrompts(name, { relative }).find((p) => p.question.trim() === q);
    if (hit) return hit;
  }
  return null;
}

/* The same question in the other voice, when it has one: what the screen
   switches to when "Rose is telling me" is tapped. Null when the question
   can only be asked one way (a storyteller-only question has no relative
   wording), so the caller keeps what it has. */
export function inVoice(prompt, name, { relative = false } = {}) {
  if (!prompt) return null;
  const id = prompt.id || findPrompt(prompt.question, name)?.id;
  if (!id) return null;
  return voicePrompts(name, { relative }).find((p) => p.id === id) || null;
}

/* Has this question been answered, in either voice? `answered` is a Set of
   memory titles. */
export function isAnswered(prompt, answered) {
  if (!prompt?.question) return false;
  return answered.has(prompt.question.trim()) || (!!prompt.alt && answered.has(prompt.alt.trim()));
}

/* Memory titles, for isAnswered. */
export function answeredTitles(memories) {
  return new Set((memories || []).map((m) => (m?.title || "").trim()).filter(Boolean));
}
