// The guided first run (FB-367, DECISIONS T-15 (b), first-run-spec.md §4):
// a new account's first minutes, taught on the real screens, one practice
// each: write one line (with a ready example) → say one out loud → your
// picture. A short celebration page between the steps, "Later" on every
// step (Back is Later too), and a quiet line on Home to carry on.
//
// This file is the pure part: the step machine, who gets it, the talk
// budget's fallback to Record (T-9 a), and every word the guide says, for
// the keeper (Jamie) and the storyteller (Rose). No React, no storage, no
// navigation, so scripts/tests/guide.mjs holds it to the spec. The hook
// that reads and writes it on the phone is components/guide/useGuide.js.
//
// The state, kept on the device per account (`firstRunGuide:<user id>`):
//   { v, startedAt, storyId, again,
//     done: { write?: { at, via }, talk?: { at, via }, you?: { at, via } },
//     shown: { write?: ms, talk?: ms, you?: ms },   first time each was seen
//     laterAt, laterStep,                           paused by "Later"
//     notNowAt,                                     Home's line long-pressed away
//     finishedAt,
//     steps,                                        the walk's steps (below)
//     skipped: { <step>: ms },                      passed by "Skip"
//     rooms: [ "home", "tree", … ] }                the walk round's rooms seen
//
// The hands-on walk (FB-404, session 8–9): the owner wants the first run
// to take a new person through each tab, their own details, the basics,
// and A Story's call, with a Skip on every step. So T-15's three steps
// grow into the walk (WALK_STEPS): write one line → say one out loud →
// A Story calls you (the storyteller only: on a story kept for somebody
// else, that person turns the call on, T-10) → you (picture, name, then a
// few lines about you) → a walk round the four rooms, done by tapping the
// real tabs. A state made without `steps` is T-15's three (GUIDE_STEPS),
// so an account part-way through keeps its own walk.

// The three steps, in order. The ids are the analytics' `step` labels.
export const GUIDE_STEPS = ["write", "talk", "you"];

// The hands-on walk's steps, by whose guide it is (FB-404).
export const WALK_STEPS = {
  teller: ["write", "talk", "call", "you", "rooms"],
  keeper: ["write", "talk", "you", "rooms"],
};
export function walkSteps(role) {
  return WALK_STEPS[role] || WALK_STEPS.keeper;
}

// The four rooms of the walk round, in the bar's order (navigation/tabs).
export const ROOMS = ["home", "tree", "collab", "book"];
export const ROOM_OF_ROUTE = { Dashboard: "home", Tree: "tree", FamilyStory: "tree", Collaborate: "collab", LegacyBook: "book" };

// What a guided screen can be showing (its `guide` route param): a step,
// or "record", Step 2 in the writer's recorder when there is no talk.
export const GUIDE_PAGES = ["write", "record", "talk", "you"];

/* This state's steps: its own walk, or T-15's three. */
export function stepsOf(state) {
  return isGuide(state) && Array.isArray(state.steps) && state.steps.length ? state.steps : GUIDE_STEPS;
}

// The page between steps and the talk's introduction.
export const GUIDE_ROUTE = "FirstRunGuide";

// Home's carry-on line lasts this long after the guide starts.
export const GUIDE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export const guideKey = (userId) => `firstRunGuide:${userId}`;

/* The step a page belongs to. "picture" is accepted for "you". */
export function stepOfPage(page) {
  if (page === "record") return "talk";
  if (page === "picture" || page === "about") return "you";
  if (page === "call" || page === "rooms") return page;
  return GUIDE_STEPS.includes(page) ? page : null;
}

/* How a step was done, when the caller doesn't say (analytics `via`). */
function defaultVia(page) {
  if (page === "record") return "record";
  if (page === "talk") return "talk";
  if (page === "write") return "write";
  return "picture";
}

export function newGuide({ now = Date.now(), storyId = null, again = false, steps = null } = {}) {
  return {
    ...(Array.isArray(steps) && steps.length ? { steps: [...steps], skipped: {}, rooms: [] } : {}),
    v: 1,
    startedAt: now,
    storyId: storyId || null,
    again: !!again,
    done: {},
    shown: {},
    laterAt: null,
    laterStep: null,
    notNowAt: null,
    finishedAt: null,
  };
}

/* A stored value that is a guide state (anything else is treated as none). */
export function isGuide(state) {
  return !!state && typeof state === "object" && state.v === 1 && Number.isFinite(state.startedAt) && !!state.done;
}

/* The next step to do, or null when all three are done. */
const passed = (state, s) => !!state.done[s] || !!state.skipped?.[s];

export function currentStep(state) {
  if (!isGuide(state)) return GUIDE_STEPS[0];
  return stepsOf(state).find((s) => !passed(state, s)) || null;
}

export function doneCount(state) {
  if (!isGuide(state)) return 0;
  return stepsOf(state).filter((s) => state.done[s]).length;
}

/* Done or skipped: how far along the walk is. */
export function passedCount(state) {
  if (!isGuide(state)) return 0;
  return stepsOf(state).filter((s) => passed(state, s)).length;
}

export function isFinished(state) {
  return isGuide(state) && (!!state.finishedAt || passedCount(state) === stepsOf(state).length);
}

export function isExpired(state, now = Date.now()) {
  return isGuide(state) && now - state.startedAt >= GUIDE_DAYS * DAY_MS;
}

/* Still running: started, not finished, not put away, inside its 7 days. */
export function isOpen(state, now = Date.now()) {
  return isGuide(state) && !isFinished(state) && !state.notNowAt && !isExpired(state, now);
}

export function isPaused(state) {
  return isGuide(state) && !!state.laterAt;
}

/* The first time a step is shown (for `seconds` on guide_step_done). */
export function markShown(state, page, now = Date.now()) {
  const step = stepOfPage(page);
  if (!isGuide(state) || !step || state.shown[step]) return state;
  return { ...state, shown: { ...state.shown, [step]: now } };
}

/* A step done. Doing it ends a pause. A kept talk is a kept memory, so it
   finishes Step 1 too (Rose's "Talk instead", first-run-spec §4 Step 1).
   Done twice is done once. */
export function markDone(state, page, { via, now = Date.now() } = {}) {
  const step = stepOfPage(page);
  if (!isGuide(state) || !step) return state;
  const how = via || defaultVia(page);
  const done = { ...state.done };
  if (!done[step]) done[step] = { at: now, via: how };
  if (step === "talk" && !done.write) done.write = { at: now, via: how };
  const next = { ...state, done, laterAt: null, laterStep: null };
  if (!next.finishedAt && stepsOf(next).every((s) => passed(next, s))) next.finishedAt = now;
  return next;
}

/* "Skip" (FB-404): on to the next step, this one passed but not done.
   Skipping ends a pause; skipping the last step finishes the walk. */
export function skip(state, step, now = Date.now()) {
  const s = stepOfPage(step) || step;
  if (!isGuide(state) || !stepsOf(state).includes(s) || passed(state, s)) return state;
  const next = { ...state, skipped: { ...(state.skipped || {}), [s]: now }, laterAt: null, laterStep: null };
  if (!next.finishedAt && stepsOf(next).every((x) => passed(next, x))) next.finishedAt = now;
  return next;
}

/* A room of the walk round seen (its tab opened while the walk is on). */
export function seeRoom(state, room) {
  if (!isGuide(state) || !ROOMS.includes(room) || (state.rooms || []).includes(room)) return state;
  return { ...state, rooms: [...(state.rooms || []), room] };
}

/* The room the walk round names next: the first in the bar's order not
   yet seen and not the one you're in; null when all four are seen. */
export function nextRoom(state, here = null) {
  const seen = new Set([...(isGuide(state) ? state.rooms || [] : []), here]);
  return ROOMS.find((r) => !seen.has(r)) || null;
}

/* Whether the walk round is on now: its step is the one to do, and the
   walk isn't paused, put away or over. */
export function roomsOn(state, now = Date.now()) {
  return isOpen(state, now) && !state.laterAt && currentStep(state) === "rooms";
}

/* "Later" (or Back, or a swipe): Home, with the progress kept. */
export function later(state, page, now = Date.now()) {
  if (!isGuide(state)) return state;
  return { ...state, laterAt: now, laterStep: stepOfPage(page) || currentStep(state) };
}

/* "Carry on →" from Home. */
export function resume(state) {
  if (!isGuide(state)) return state;
  return { ...state, laterAt: null, laterStep: null };
}

/* Home's line long-pressed away ("Not now"): the guide is over. */
export function notNow(state, now = Date.now()) {
  if (!isGuide(state)) return state;
  return { ...state, notNowAt: now };
}

/* Seconds from a step first being shown to now (0 if never shown). */
export function stepSeconds(state, page, now = Date.now()) {
  const step = stepOfPage(page);
  const at = isGuide(state) && step ? state.shown[step] : null;
  return at ? Math.max(0, Math.round((now - at) / 1000)) : 0;
}

const kept = (m) => m && m.status !== "in_progress";
const timeOf = (m) => {
  const t = Date.parse(m?.createdAt || m?.savedAt || "");
  return Number.isFinite(t) ? t : 0;
};

/* The newest kept memory of a story, or null: the one the "kept" page
   celebrates, and whose privacy its line follows (FB-383). */
export function latestKept(story) {
  const list = (story?.memories || []).filter(kept);
  if (!list.length) return null;
  return [...list].sort((a, b) => timeOf(b) - timeOf(a))[0];
}

/* A step done outside the guide counts (first-run-spec §4 "Never
   trapped"): a memory kept from Home finishes Step 1; a picture already
   set finishes Step 3. Walked through again from Help, only what is done
   after it started counts. */
export function reconcile(state, { memories = [], hasPicture = false, now = Date.now() } = {}) {
  if (!isGuide(state)) return state;
  let next = state;
  if (!next.done.write) {
    const since = (memories || []).filter(kept).filter((m) => !state.again || timeOf(m) >= state.startedAt);
    if (since.length) next = markDone(next, "write", { via: "write", now });
  }
  if (!next.done.you && hasPicture && !state.again) next = markDone(next, "you", { via: "picture", now });
  return next;
}

/* Whose guide it is: "teller" (Rose, her own story), "keeper" (Jamie,
   the story's owner), or null (a relative who only joined to add their
   side, who never gets it). */
export function guideRole({ isStoryteller = false, story = null, userId = null } = {}) {
  if (!story || !userId) return null;
  if (isStoryteller) return "teller";
  if (story.ownerId && story.ownerId === userId) return "keeper";
  return null;
}

/* May the guide start for this account now?
     enabled   false in the demo without &guide=1 (useGuide decides)
     role      guideRole(…)
     stories   every story the account keeps or tells
     state     what is stored for the account (null: never started)
     again     Help's "Walk me through it again →"
   It runs once per account, and never for an account that already has
   memories, unless walked through again. */
export function eligible({ enabled = true, role = null, story = null, stories = [], state = null, again = false, joined = false } = {}) {
  if (!enabled || !role || !story) return false;
  if (again) return true;
  if (isGuide(state)) return false;
  // A storyteller who has just joined (JoinFamily) is new however many
  // memories the family kept before her: Jamie's own Step 1 is normal.
  if (joined && role === "teller") return true;
  const all = [story, ...(stories || [])];
  return !all.some((s) => (s?.memories || []).some(kept));
}

/* Step 2 talks, or records (T-9 a, T-11). Talk needs live minutes: an
   unlimited plan or call_seconds_left above 0. A budget that couldn't be
   read, none at all, or a remembered person's story records instead, in
   the writer's recorder (free, FB-333). `demoBudget` is ?budget=. */
export function talkMode({ budget = null, failed = false, remembered = false, demoBudget = "" } = {}) {
  if (remembered) return "record";
  if (String(demoBudget) === "0") return "record";
  if (failed || !budget || budget.unchecked) return "record";
  if (budget.unlimited) return "talk";
  return Number(budget.remainingSeconds) > 0 ? "talk" : "record";
}

/* Where a page of the guide is, as { name, params } for navigate().
   Step 1 carries the question at its head (first-run-spec §4, FB-385):
   `question` (today's, in the reader's own voice) and its bank id
   `questionId`, so the writer shows it under the slip and keeping the
   memory answers it. */
export function guideRoute(page, { storyId = null, question = null, questionId = null } = {}) {
  const story = storyId ? { storyId } : {};
  if (page === "write") {
    const asked = question ? { question, ...(questionId ? { questionId } : {}) } : {};
    return { name: "CreateMemory", params: { ...story, ...asked, guide: "write" } };
  }
  if (page === "record") return { name: "CreateMemory", params: { ...story, guide: "record" } };
  if (page === "talk") return { name: "LiveTalk", params: { ...story, guide: "talk" } };
  if (page === "you") return { name: "ProfilePicture", params: { guide: "you" } };
  // The guide's own pages: "kept" (after Step 1), "intro" (before Step 2),
  // "talked" (after Step 2), "call" (A Story calls you), "about" (a few
  // lines about you, after the picture), "done" (the walk's end).
  return { name: GUIDE_ROUTE, params: { page } };
}

/* Where "Carry on →" (or the start) goes for the next step. Step 2 opens
   on its introduction, which knows whether it talks or records; A Story's
   call on its own page; the walk round on Home, where its slip waits. */
export function resumeRoute(state, opts = {}) {
  const step = currentStep(state);
  if (!step) return null;
  if (step === "talk") return guideRoute("intro", opts);
  if (step === "call") return guideRoute("call", opts);
  if (step === "rooms") return { name: "Dashboard", params: undefined };
  return guideRoute(step, opts);
}

/* "Start me off" typed the opening and nothing more (FB-483): the writer
   keeps Keep quiet until she has added her own words to it. */
export function starterOnly(text, starter) {
  const norm = (x) => String(x || "").replace(/\s+/g, " ").trim();
  const t = norm(text);
  const st = norm(starter);
  return !t || (!!st && st.startsWith(t)) || t === st;
}

/* Where a step's "done" goes next. */
export function afterDone(page) {
  const step = stepOfPage(page);
  if (step === "write") return guideRoute("kept");
  if (step === "talk") return guideRoute("talked");
  return { name: "Dashboard", params: undefined };
}

/* ── Words ──────────────────────────────────────────────────────────────
   Bao's voice: warm, plain, short. A named person is always named, never
   "they"; nothing says the first talk is free (A13, E2); no plan words on
   the storyteller's phone (FB-350). Curly quotes throughout. */

const first = (s) => String(s || "").trim().split(/\s+/)[0] || "";

function forms(pronoun) {
  if (pronoun === "she") return { subj: "she", obj: "her", poss: "her", own: "hers" };
  if (pronoun === "he") return { subj: "he", obj: "him", poss: "his", own: "his" };
  return null;
}

export const LATER = "Later";
export const LATER_A11Y = "Later, finish this from Home";
export const SHOW_EXAMPLE = "Show me an example";
export const AGAIN = "Walk me through it again →";
export const NOT_NOW = "Not now";
// Every step can be skipped (FB-404): on to the next one.
export const SKIP = "Skip";
export const SKIP_A11Y = "Skip this step";

/* Who can read a private memory, in one wording everywhere (usability
   U-9: three wordings of one fact, one of them "keepers"). Your own story:
   "Only you can read it, until you share it." Someone else's: the other
   reader named ("Just you and Jamie can read it."), else said plainly. */
export function privateReaders({ own = false, other = "" } = {}) {
  if (own) return "Only you can read it, until you share it.";
  const who = first(other);
  return who ? `Just you and ${who} can read it.` : "Just you and the person who keeps this story can read it.";
}

/* Home's quiet line while the guide is open (lane H, FirstDayLine). */
export function homeLine(state, now = Date.now()) {
  if (!isOpen(state, now)) return null;
  // The walk round has its own slip on Home; the line would say it twice.
  if (roomsOn(state, now)) return null;
  const done = passedCount(state);
  const total = stepsOf(state).length;
  return {
    done,
    total,
    text: `Your first day · ${done} of ${total} done · Carry on →`,
    a11y: `Your first day. ${done} of ${total} done. Carry on`,
  };
}

/* "2 of 5 · Talking": the step's place in this walk, in words. */
function placeOf(step, steps) {
  const list = Array.isArray(steps) && steps.length ? steps : GUIDE_STEPS;
  const i = list.indexOf(step);
  return i < 0 ? "" : `${i + 1} of ${list.length}`;
}

/* The walk round's words for one room (FB-404): what the room is for, in
   one line, and the tab to tap next, named as the bar names it. */
export const ROOM_NAMES = { home: "Home", tree: "Memories", collab: "Family", book: "Book" };
export const ROOM_ICONS = { home: "home", tree: "archive", collab: "collab", book: "book" };
export function roomCopy(room, { steps = null, next = null, role = "keeper", name = "" } = {}) {
  const who = first(name);
  const lines = {
    home: role === "keeper" && who ? `Home is today: one question for ${who}, and the ways to answer it.` : "Home is today: one small question, and the ways to answer it.",
    // Never "your first one is here" to somebody who skipped it (FB-486).
    tree: "Memories keeps everything that is kept, by year.",
    collab: "Family is everyone in the story. Ask them what they remember.",
    book: "Book is the story as pages, ready to print. The + adds a memory from any room.",
  };
  // One short line each, for the slip that rides on the cloth band, where
  // it never covers a room's question or its button (judges s89 r2).
  const short = {
    home: "Home: today’s question",
    tree: "Memories: all that’s kept, by year",
    collab: "Family: everyone in the story",
    book: "Book: the story as pages",
  };
  return {
    kicker: `${placeOf("rooms", steps || WALK_STEPS[role] || WALK_STEPS.keeper)} · A walk round`,
    line: lines[room] || lines.home,
    short: short[room] || short.home,
    place: placeOf("rooms", steps || WALK_STEPS[role] || WALK_STEPS.keeper),
    tapLead: next ? "Now tap" : null,
    tapTail: next ? "below" : null,
    endLine: next ? null : "The + adds a memory from any room.",
    next,
    nextName: next ? ROOM_NAMES[next] : null,
    nextIcon: next ? ROOM_ICONS[next] : null,
    // Two short words, one line at the largest text (the lead, s89).
    done: next ? null : "All done",
    skip: "Skip the walk",
  };
}

/* Every line the guide says on one page.
     page     "write" | "record" | "talk" | "you"  (a slip on a real screen)
              "kept" | "intro" | "talked"          (FirstRunGuide's pages)
     role     "keeper" | "teller"
     name     the storyteller's first name (Rose)
     pronoun  "she" | "he" | null (lib/questionVoice.js pronounOf)
     giver    the keeper's first name, for the storyteller ("Jamie"), or ""
     keeper   the story's keeper as the writer names it ("Just you and
              Jamie can read this"), or "" ("the keepers")
     privacy  the kept memory's: "private" (just her and the keepers) or
              "shared" (the family; also when it doesn't say)
     mode     "talk" | "record" (talkMode)
     tellerOnApp  the storyteller is on A Story already */
export function guideCopy(page, { role = "keeper", name = "", pronoun = null, giver = "", keeper = "", privacy = null, mode = "talk", tellerOnApp = false, steps = null, own = false, remind = false } = {}) {
  const teller = role === "teller";
  const who = first(name) || (teller ? "" : "your storyteller");
  const her = forms(pronoun);
  const at = (step) => placeOf(step, steps);
  const base = { page, step: stepOfPage(page), role, later: LATER, laterA11y: LATER_A11Y, skip: SKIP, skipA11y: SKIP_A11Y, showExample: SHOW_EXAMPLE };
  const walk = Array.isArray(steps) && steps.length ? steps : null;
  // What comes after the picture: the walk round, or Home.
  const afterYou = walk && walk.includes("rooms") ? "Next: a walk round" : "Done";
  const talkExample = teller ? "“The first house I remember had…”" : `“When I think of ${who}, I think of…”`;

  if (page === "write") {
    return {
      ...base,
      kicker: `${at("write")} · Your first memory`,
      line: "One line is enough. Write what comes first.",
      example: teller ? "“On Sundays my mother made…”" : `“${who}’s house smelled of coffee and cinnamon toast.”`,
      // Typed at the cursor by "Start me off →": an opening, never a memory.
      starter: teller ? "On Sundays my mother made " : `${who}’s house smelled of `,
      starterLabel: "Start me off →",
      talkInsteadLabel: teller ? "Rather say it out loud? Talk instead →" : null,
    };
  }

  if (page === "kept") {
    const next = mode === "record" ? "Next: say one out loud" : "Next: hear A Story listen";
    if (teller) {
      // Who can read it, as the writer said when she kept it (FB-383): a
      // private memory is hers and the keepers', never "your family".
      const body =
        privacy === "private"
          ? privateReaders({ own, other: first(keeper) || first(giver) })
          : giver
            ? `${first(giver)} can read it now.`
            : "Your family can read it now.";
      return { ...base, title: "Your first memory is kept.", body, next };
    }
    return {
      ...base,
      title: `${who}’s first memory is kept.`,
      body: "Every memory starts this way: one small question, one answer.",
      next,
    };
  }

  if (page === "intro") {
    const mic = walk ? "So A Story can hear you, your phone will ask once to use the microphone. Tap Allow." : "Your phone will ask to use the microphone. Tap Allow.";
    if (mode === "record") {
      return {
        ...base,
        step: "talk",
        kicker: `${at("talk")} · Your voice`,
        title: "Record a minute in your own voice.",
        body: "Say a few sentences, as you would to a friend. Your voice is kept with the memory, for the family to hear.",
        example: talkExample,
        mic,
        next: "Start recording",
        // The one plan word, and only on the keeper's phone (FB-350).
        planLine: teller ? null : "Talking with A Story comes with a plan. Recording your voice is free.",
      };
    }
    return {
      ...base,
      step: "talk",
      kicker: `${at("talk")} · Talking`,
      title: "Now say one out loud.",
      body: "A Story asks a question and listens, like a phone call. Say a few sentences. It writes them down and asks one more.",
      // The room asks its own question (FB-494): no opening here that the
      // room then doesn't ask.
      example: walk ? null : talkExample,
      mic,
      next: "Start talking",
      planLine: null,
    };
  }

  if (page === "talk") {
    return {
      ...base,
      kicker: `${at("talk")} · Talking`,
      line: "Talk as you would to a friend. Tap “That’s enough for now” when you’re done.",
      // At large text, under the room's header (FB-482): the one instruction.
      shortLine: "Tap “That’s enough for now” when you’re done.",
      example: null,
      // The slip folds away after this much speech (lane C).
      foldAfterSeconds: 10,
    };
  }

  if (page === "record") {
    return {
      ...base,
      kicker: `${at("talk")} · Your voice`,
      line: "A minute is plenty. Say it as you would to a friend.",
      example: talkExample,
    };
  }

  if (page === "talked") {
    if (mode === "record") {
      return {
        ...base,
        step: "talk",
        title: "Kept, in your own voice.",
        body: teller ? "Your family will hear it just as you said it." : "The family will hear it just as you said it.",
        next: "Next: your picture",
        schedule: null,
      };
    }
    if (teller) {
      return {
        ...base,
        step: walk && walk.includes("call") ? "call" : "talk",
        ...(walk && walk.includes("call") ? { kicker: `${at("call")} · ${remind ? "Your daily reminder" : "A Story calls you"}` } : {}),
        title: "That’s all it is.",
        // Nothing covers her calls yet (FB-480): the step is the daily
        // reminder she can set herself, never a call she can't turn on.
        body: remind ? "A Story can remind you each day that one small question is waiting." : "A Story can ring you like this every day.",
        schedule: remind ? "Choose an hour" : "Choose a time",
        remind,
        next: "Next: your picture",
      };
    }
    // T-10 (a): whose phone rings, and who turns it on (FB-343).
    const joins = tellerOnApp ? "" : her ? ` once ${her.subj} joins` : `, once ${who} joins`;
    return {
      ...base,
      step: "talk",
      title: her ? `That’s how ${who} will tell ${her.own}.` : `That’s how ${who} will tell a memory.`,
      body: her
        ? `A Story rings ${her.poss} phone and asks. ${who} turns ${her.poss} daily call on from ${her.poss} own phone${joins}.`
        : `A Story rings ${who}’s phone and asks. ${who} turns the daily call on from that phone${joins}.`,
      next: "Next: your picture",
      schedule: null,
    };
  }

  if (page === "call") {
    // A Story's call, when the talk was skipped or comes back to later.
    return {
      ...base,
      step: "call",
      kicker: `${at("call")} · ${remind ? "Your daily reminder" : "A Story calls you"}`,
      title: remind ? "A Story can remind you." : "A Story can call you.",
      body: remind
        ? "Choose an hour, and each day A Story reminds you that one small question is waiting. Answer it out loud or in writing."
        : "Choose a time, and A Story rings you each day with one small question. Pick up and talk, as you would to a friend.",
      schedule: remind ? "Choose an hour" : "Choose a time",
      remind,
      next: "Next: your picture",
    };
  }

  if (page === "about") {
    return {
      ...base,
      step: "you",
      // The step's second page: its place ("4 of 6") was said on the
      // picture, its first, and isn't said again (HABIT-REVIEW §6 item 13).
      kicker: "You · a little more",
      title: "A little about you.",
      body: "Where you were born, your work, your school. The family reads it on your page.",
      add: "Add a few lines",
      next: afterYou,
      // The slip on Edit profile itself (lane P, FB-484): what to do there,
      // and the way on from it.
      line: "Add where you were born, your work, your school. Each line saves as you finish it.",
      slipNext: `${afterYou} →`,
    };
  }

  if (page === "done") {
    return {
      ...base,
      step: null,
      title: "You’re all set.",
      body: "A new question waits on Home each day. Come back when you have a minute.",
      next: "Go to Home",
      // Your own first, then the people you love (FB-398); or the other way.
      other: own ? "Someone you love? Start their story too →" : "Your own story? Start yours too →",
      otherFor: own ? "someone" : "own",
    };
  }

  if (page === "you") {
    return {
      ...base,
      kicker: `${at("you")} · You`,
      // "Last thing" only when it is (T-15's three); the walk goes on (s89 r2).
      line: walk ? "Now, your picture." : "Last thing: your picture.",
      title: walk ? "Now, your picture." : "Last thing: your picture.",
      body: "The family sees it beside everything you keep and every question you ask.",
      example: null,
      fromPhotos: "From your phone’s photos",
      takeOne: "Take one now",
      // The keeper also says what the family calls them (EditProfile's field).
      nameLabel: teller ? null : "What the family calls you",
      done: "Done",
    };
  }

  return base;
}
