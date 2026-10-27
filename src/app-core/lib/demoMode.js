// Is this the ?demo=1 walkthrough?
//
// App.js already branches on this to swap the data layer (see dev/DemoApp.js),
// but the collaborative screens don't read their data through AppContext —
// they call data/contributions.js and data/collaborators.js directly, which go
// straight to Supabase. With no backend behind the demo those calls hang, and
// Collaborate sits on a spinner forever.
//
// So this is the seam: one flag, read once from the URL, that lets those two
// modules answer from dev/fakeCollab.js instead. It can only ever be true on
// web with ?demo=1 in the address bar — on a device there is no `window`, so a
// shipped build can't take the branch at all.

// The parameter itself, not a substring: "groupcall=1" used to switch on
// "call=1" too.
function readFlag(name) {
  if (typeof window === "undefined" || !window.location) return false;
  return new URLSearchParams(window.location.search || "").get(name) === "1";
}

function readValue(name) {
  if (typeof window === "undefined" || !window.location) return "";
  return new URLSearchParams(window.location.search || "").get(name) || "";
}

export const IS_DEMO = readFlag("demo");
export const IS_SCREENSHOT = readFlag("screenshot");

// The screenshot harness mounts one screen against dev/fakeData.js too, so it
// wants the same fake answers — otherwise every collaborative screen
// photographs as a spinner.
export const USES_FAKE_DATA = IS_DEMO || IS_SCREENSHOT;

// Which plan the demo account is on: Individual by default (night r2,
// judges: the demo films the daily call, and a free plan beside "A Story
// calls Rose again tomorrow" contradicted itself), so Account, call minutes,
// Home and the book agree. `?demo=1&plan=free` shows the free plan and its
// limits; `&plan=premium` the family plan.
// `premium` is the demo's old word for the Family plan, the plan the hero
// film runs on, so it reads as "family" everywhere: 200 minutes a month,
// never "Calls without a monthly limit" (FB-059). Any real plan name passes
// through.
const PLAN_ALIASES = { premium: "family" };
const planValue = readValue("plan");
export const DEMO_PLAN = PLAN_ALIASES[planValue] || planValue || "family";

// The book's ordering state in the walkthrough, where there is no server to
// ask: `&book=used` or `&book=bought` to see those, `&book=open` to see
// ordering switched on (it's off until a print company is set up).
export const DEMO_BOOK = readValue("book");

// Opens the demo straight onto the incoming daily call — `?demo=1&call=1`.
//
// The call is reached in the real app by tapping a local notification, and
// expo-notifications never fires on web. Without this seam the one screen
// whose whole job is the moment somebody decides whether to pick up can
// only ever be looked at in the screenshot harness, where the navigator is
// a single screen and "Answer" therefore goes nowhere. Same shape as the
// other flags here: demo-only, and impossible in a shipped build because a
// device has no `window.location`.
export const DEMO_INCOMING_CALL = IS_DEMO && readFlag("call");

// A family on its first day — `?demo=1&fresh=1`: no memories saved yet and
// nobody else in the family invited, so the first-week Home (lib/homeStage.js)
// can be walked through. Demo-only, like the flags above.
// A newcomer (&start=1, below) is a family on its first day too.
export const DEMO_FRESH = IS_DEMO && (readFlag("fresh") || readFlag("start"));

// A newcomer's first minutes — `?demo=1&start=1` (S-E2, FB-325): signed out
// on Welcome, nothing on the phone. "Start your family’s story", whose
// story, the account (any name and email; any six numbers sign in, since
// nothing is sent), the story's first question, a first memory kept, then
// the family link. Demo-only, like the flags above.
export const DEMO_START = IS_DEMO && readFlag("start");

// A visitor with no account — `?demo=1&visitor=1` with `&code=RS4HNT` (the
// family's link) or `&memlink=mem-10` (one memory's link), FB-326 item 4:
// the link's page as someone outside the app sees it. They read what is
// shared, add what they remember with just their name, and are offered
// "Claim your place in the family", never forced. The demo stays signed in
// underneath; the page alone treats the reader as a stranger. Demo-only.
export const DEMO_VISITOR = IS_DEMO && readFlag("visitor");

// The phone's text size, pretended — `?demo=1&textScale=2`. A browser has no
// Dynamic Type, so without this the layouts that change at large text sizes
// (lib/useLargeText.js) can't be looked at outside a phone. Demo-only.
//
// ?fontScale=2 does that and also sets the type at that size, the way iOS
// multiplies every Text (dev/demoFontScale.js): the truthful one for large-
// text checks. ?textScale stays as the layout-only switch.
export const DEMO_FONT_SCALE = (USES_FAKE_DATA && Number(readValue("fontScale"))) || 0;
export const DEMO_TEXT_SCALE = DEMO_FONT_SCALE || (USES_FAKE_DATA && Number(readValue("textScale"))) || 0;

// A group family call on, that the demo account was asked onto —
// `?demo=1&groupcall=1` — so Home's "join the call in progress" banner and
// the group call screen can be walked through (data/groupCalls.js
// DEMO_GROUP_CALL). Off otherwise, so it doesn't sit on every demo Home.
export const DEMO_GROUP_CALL_ON = IS_DEMO && readFlag("groupcall");

// &same=1: two people started the same person's story. The Family tab shows
// Sam asking to join Rose's story, and Linh's second "Rose" to merge
// (data/sameStory.js, SamePersonCards).
export const DEMO_SAME_PERSON = IS_DEMO && readFlag("same");

// &dupes=1: a relative's own small tree has just been folded into this one
// (family_join_merge.sql), bringing a second David Miller with his son, so
// Requests offers the two Davids to merge.
export const DEMO_DUPES = IS_DEMO && readFlag("dupes");

// &as=linh: the demo seen by Linh, Rose's daughter, who is on A Story but
// keeps no story and looks after nobody's details but her own, so the person page
// offers "Suggest" instead of "Edit" (lib/personRights.js). &as=rose is
// Rose herself, the storyteller: her Home, her call, her large-text
// experience (dev/DemoApp.js asRose). The demo is otherwise always Jamie,
// the account that keeps Rose's and Walter's stories and organizes the
// tree.
// `as=linda` was the relative's old name in the demo; an old link still
// opens Linh's view.
const AS_ALIASES = { linda: "linh" };
const asValue = readValue("as").toLowerCase();
// The screenshot harness honours it too, so Linh's view of a page can be
// photographed on its own (lane P's request).
export const DEMO_AS = USES_FAKE_DATA ? AS_ALIASES[asValue] || asValue : "";

// &pick=jamie | linh: the photo picker answers with that demo portrait
// (dev/fakeFaces.js DEMO_PICKS) instead of opening a file chooser, so the
// "set in the plate" moment can be filmed (j4-spec T-J4-2). "" otherwise.
export const DEMO_PICK = USES_FAKE_DATA ? readValue("pick") : "";

// &picker=demo: the photo library answers with a photograph from the
// brand's own archive (lib/pickPicture.js demoLibraryPick) instead of a
// file chooser, so adding a photo to a memory can be walked and filmed on
// the web build (judge-user night r4, four rounds unseen). Demo only.
export const DEMO_PICKER = IS_DEMO && readValue("picker") === "demo";

// &hero: the hero path's states (hero-spec §6 T3), demo only:
//   &hero=kept   Rose's "Summer: cut grass and tomatoes" is kept, the 14th
//                memory, with no side on it yet;
//   &hero=loose  and Linh's version is sent, waiting for Jamie's yes;
//   &hero=1      and Jamie said yes: "Linh remembers it differently…" is on
//                the memory, kept today.
// (dev/fakeData.js heroMemory, dev/fakeCollab.js LINH_HERO_SIDE.) Under any
// of them today's question is the hero's (dev/fakeData.js HERO_QUESTION).
const HERO_STATES = new Set(["kept", "loose", "1"]);
const heroValue = readValue("hero");
export const DEMO_HERO = IS_DEMO && HERO_STATES.has(heroValue) ? heroValue : "";

// &upload: a recording Jamie brought in (ways-in §5, DECISIONS QW12), the
// voice memo "Thanksgiving at Grandma's", 27 Nov 2025:
//   &upload=kept  A Story listened, and Rose's "Lights on the lemon tree"
//                 (December 1985) is kept, the 14th memory, her voice on it;
//   &upload=note  the server is off, so the same file is kept as a voice
//                 note, "Thanksgiving, 2025", with Jamie's note as hers.
// (dev/fakeData.js uploadMemory, uploadNote.) Never with &hero: both make
// the 14th memory, so &hero wins and this is ignored.
const UPLOAD_STATES = new Set(["kept", "note"]);
const uploadValue = readValue("upload");
export const DEMO_UPLOAD = IS_DEMO && !DEMO_HERO && UPLOAD_STATES.has(uploadValue) ? uploadValue : "";

// &asked=1 (with &as=linh): Jamie has asked Linh for her side of a memory
// in Rose's story, a story Linh reads but doesn't keep, so the request's
// path for a relative can be walked: her Home's card opens the composer
// for that memory, never the keeper's review (FB-030). Demo only.
export const DEMO_ASKED = IS_DEMO && readFlag("asked");

// &join=1 (with &as=linh): the evening Linh joins, the demo's today, the
// day Rose kept "Summer: cut grass and tomatoes" (judges night r4, Y15: the
// landing lives in the film's time, so her "latest" is the hero, kept
// today, as Home and the invite card say). Linh is "invited · waiting for
// them" until the join resolves, the code RS4HNT is hers, and what she's
// offered is only what was kept by then (dev/fakeData.js adds the hero).
export const DEMO_JOIN = IS_DEMO && readFlag("join");
const joinDay = new Date();
export const DEMO_JOIN_AT = new Date(joinDay.getFullYear(), joinDay.getMonth(), joinDay.getDate(), 18, 0, 0);

/* The demo's "now": that evening under &join=1, else the real clock. */
export function demoNow() {
  return DEMO_JOIN ? new Date(DEMO_JOIN_AT) : new Date();
}

// &ax=3: force the largest accessibility layouts (AX3 and above) on the
// web, where there is no Dynamic Type (DECISIONS H34). theme/index.js reads
// it. 0 when absent.
export const DEMO_AX = (USES_FAKE_DATA && Number(readValue("ax"))) || 0;

// The walkthrough reopens an unreviewed call's review on load only when
// asked — `?demo=1&resume=1` (lib/useCallDraftResume.js). Calls now save as
// they go, and a crawl that reloads mid-call would otherwise land every
// later page under yesterday's review.
export const DEMO_RESUME = IS_DEMO && readFlag("resume");

// The guided first run (FB-367, first-run-spec §4 "Demo"), demo only; a
// real build runs it from the account's state (lib/firstRunGuide.js):
//   ?demo=1&start=1&guide=1   the whole run from Welcome
//   ?demo=1&fresh=1&guide=1   day one, signed in, straight onto Step 1
//   add &as=rose              the storyteller's guide
//   add &budget=0             no talk minutes: Step 2 records instead
// Without &guide=1 the demo never starts the guide, so every other walk
// and crawl opens as it always has.
export const DEMO_GUIDE = IS_DEMO && readFlag("guide");
// &budget=0: the talk budget read as empty, for the guide's Record
// fallback (T-9 a). "" when absent.
export const DEMO_BUDGET = IS_DEMO ? readValue("budget") : "";
// &gift=reveal: Rose's gift reveal (FB-369) in the demo. Off otherwise, so
// every other walk, the smoke run and the store shots open on Home as
// they always have. Pair it with &as=rose&plan=family (a covered Rose).
export const DEMO_GIFT_REVEAL = IS_DEMO && readValue("gift") === "reveal";
// &gift=card: the card that came with no plan, opened (FB-514): pair it
// with &as=rose&plan=free (Rose uncovered, Jamie's question waiting); she
// joined today, invited by Jamie. &gift=nostore: a build whose store sells
// no plans and whose server hasn't plan_covers.sql (the owner's
// TestFlight); Give still sends the card. Web demo only, both.
export const DEMO_GIFT_CARD = IS_DEMO && readValue("gift") === "card";
export const DEMO_GIFT_NOSTORE = IS_DEMO && readValue("gift") === "nostore";
// &all=1: every built feature in the demo, including the ones switched off
// for 1.1's review until their server pieces are live (friends, links to one
// memory, co-keepers, family calls — lib/serverFeatures.js). Web demo only.
export const DEMO_ALL = IS_DEMO && readFlag("all");
