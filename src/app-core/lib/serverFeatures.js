// The AI-server features the app may offer, in one place (FB-012).
//
// Each of these routes answers 404 on the AI server today (release-review
// Gate-AR-6), so every control that leads to one is hidden while its flag
// is false: a reviewer, or Rose, never taps a feature that can't work. The
// owner deploys the route, checks it answers, and turns its flag on here.
// That is the only change needed; each screen asks this file.
//
//   importRead    POST /api/import/read      Import: a PDF, or photos of the
//                                             pages (Word and text files are
//                                             read on the phone and stay)
//   bookRetell    POST /api/book/retell      Book design: "As her life story"
//   memoryHelp    POST /api/memory/help      Writing: the server's help (the
//                                             phone's own help stays)
//   voicePreview  POST /api/voice/preview    Call voice: "Hear it"
//   recordingRead POST /api/transcribe-conversation
//                                             Record in the room and "Bring in
//                                             a recording": A Story listens and
//                                             writes down the words (QW6). While
//                                             it's off, an upload is kept as a
//                                             voice note with the uploader's own
//                                             note, never sent (QW7)
//   familyCall    the many-person family call (FamilyCall, GroupCall, and
//                 GuestCall by link), hidden for 1.1 (QW2). It needs TURN,
//                 /api/realtime/transcription-session and ring-family
//                 deployed, and docs/two-iphone-test.md passed. The code
//                 stays; no screen, sheet, ring or notification leads to it
//                 while this is false
//   friends       friend links and the Friends circle (FB-284). Needs
//                 supabase/story_friends_2026_10_21.sql, the web page
//                 /friend/<token> and the AASA file. Off for 1.1's review
//                 (DECISIONS S-PL10): the RPCs aren't live and the link
//                 lands on a 404
//   memoryLinks   a link to one memory (FB-322, /m/<token>). Needs
//                 supabase/memory_links_2026_10_22.sql, the web page and the
//                 AASA file. Off for 1.1's review; asking the family in the
//                 app still works
//   coKeepers     a co-keeper made at once, by the story_keeper_add RPC
//                 ("Can they edit?" for someone already on A Story, or
//                 with no email). Needs supabase/collab_2026_10_22.sql.
//                 While it's off, the switch is offered only with an email,
//                 where the invitation (story_managers) carries it; without
//                 one it answered "couldn't be made a keeper" (H2)
//   answerLink    the elder's answer page by link (app.astoryapp.com/a/<token>,
//                 "Send Rose the link"). The web app's main doesn't serve
//                 it yet (it's on the web repo's elder-link branch), so a
//                 link sent now would be dead. While it's off no screen
//                 shows or shares one, and "How will Rose answer?" offers
//                 the call and the app. Turn it on when elder-link is
//                 merged and /a/<token> answers on app.astoryapp.com
//
// The server's own docs: docs/memoir-import-for-server.md,
// docs/book-retell-for-server.md, docs/memory-help-for-server.md,
// docs/call-voice-for-server.md, docs/voice-question-for-server.md, docs/lessons-for-server.md.
import { USES_FAKE_DATA, DEMO_ALL } from "./demoMode.js";

export const SERVER_FEATURES = Object.freeze({
  importRead: false,
  bookRetell: false,
  memoryHelp: false,
  voicePreview: false,
  recordingRead: false,
  familyCall: false,
  friends: false,
  memoryLinks: false,
  coKeepers: false,
  answerLink: false,
  // The daily voice question: audio upload, delivery and push (docs/voice-question-for-server.md).
  voiceQuestion: true,
  // A story's lessons kept on the server (docs/lessons-for-server.md); until then on the phone.
  lessons: false,
  // "Read in English" under a teller's words (supabase/functions/translate; needs OPENAI_API_KEY as a function secret).
  translate: false,
  // A story's consent answers and their log on the server (supabase/archive_consent_2026_10_25.sql); until then on the phone.
  consent: false,
});

/* Whether the app may offer `feature` (a key above). Unknown keys are off. */
export function serverOffers(feature) {
  // ?demo=1&all=1 previews every built feature on the web (DEMO_ALL); a
  // device build never runs the demo, so the flags above still decide there.
  return SERVER_FEATURES[feature] === true || (DEMO_ALL && feature in SERVER_FEATURES);
}

/* The same, except that the ?demo=1 walkthrough on the web shows every
   built feature, so the team can still see it while the server catches up.
   A device build never runs the demo (lib/demoMode.js). */
export function serverOffersOrDemo(feature) {
  return serverOffers(feature) || USES_FAKE_DATA;
}

/* The elder's link (answerLink): whether the app may show or share it.
   The ?demo=1 walkthrough shows it, as before. */
export function answerLinkOn() {
  return serverOffersOrDemo("answerLink");
}

/* The link to show and share, or "" while answerLink is off: a link that
   would land on a 404 is never surfaced. Pure given `on`. */
export function offeredAnswerLink(url, on = answerLinkOn()) {
  const u = typeof url === "string" ? url.trim() : "";
  return on && /^https:\/\//.test(u) ? u : "";
}

/* "How will Rose answer?": the ways offered. While answerLink is off the
   link way isn't one of them; the call and the app still reach her.
   Pure given `on`. */
export function offeredAnswerWays(ways, on = answerLinkOn()) {
  const list = Array.isArray(ways) ? ways : [];
  return on ? list : list.filter((w) => w && w.id !== "link");
}

/* The error a gated call rejects with, so a caller that reaches one anyway
   gets the same "not ready" the 404 used to give, without a request. */
export function notReady(feature) {
  return Object.assign(new Error("That isn't switched on yet."), { code: "not_ready", feature });
}
