// What the app tells us about how it's used — and, as importantly, what it
// never does.
//
// Analytics here is ours: first-party, into our own database
// (supabase/analytics.sql), read by the team and nobody else. It exists to
// answer a handful of questions the product can't answer any other way: do
// people get to a first memory, how long it takes them, do they come back,
// and does a second person in the family ever arrive.
//
// It never carries what anybody said or wrote. No titles, no bodies, no
// names, no questions, no emails. An event is a name, a few numbers and
// flags, and short fixed labels (a chapter, a relationship, a source) —
// enforced here, by cleanProps, rather than trusted to every call site. This
// is an archive of people's lives, often told by people in their eighties;
// "we know you opened the app on Tuesday" is fine and "we read your
// grandmother's story to see how the funnel performs" is not.
//
// Pure, so scripts/test-lib.mjs can hold it to that.

// Every event the app sends. A name not on this list is dropped, so a typo
// at a call site is a missing event, not a new column of junk in the data.
export const EVENTS = [
  "app_open",
  "signed_up",
  "story_created",
  "story_created_first_memory",
  "memory_saved",
  // A conversation's review card left with "Throw it away" (flow-spec item 3).
  "call_discarded",
  "question_skipped",
  "person_added",
  "person_invited",
  // A visitor with no account sent a memory by the family's link, and
  // tapped "Claim your place in the family" (FB-326 item 4).
  "contribution_sent",
  "claim_place_tapped",
  "person_photo_added",
  "family_call_dialled",
  "family_call_answered",
  "family_call_ended",
  "family_call_unanswered",
  "memory_shared",
  "friend_told",
  "room_recorded",
  "link_call_sent",
  "whatsapp_imported",
  "pricing_viewed",
  // The plan sheet every wall opens (components/PlanSheet.js), with its reason.
  "plan_sheet_viewed",
  "book_ordered",
  // "Tell me when printing opens" on a printed edition, before ordering exists.
  "book_interest",
  "digital_edition",
  // Added 2026-10-08. The first six were already being sent and dropped,
  // because nobody added them here.
  "family_code_used",
  "group_call_started",
  "group_call_joined",
  "group_call_ended",
  "group_call_link_sent",
  "photo_memory_started",
  "photo_memory_finished",
  // How a conversation went, in numbers (lib/conversationContext.js), and
  // the one tap after it (components/HowWasIt.js).
  "conversation_depth",
  "conversation_feedback",
  // One story per person (data/sameStory.js) and memoirs (lib/memoir.js).
  "story_person_picked",
  "story_join_asked",
  "story_join_answered",
  "story_merge",
  "story_merge_undone",
  "memoir_read",
  // Added 2026-10-09, for analytics_growth.sql: calls that start and fail
  // (against conversation_depth at the end), the out-of-minutes wall, and
  // a subscription the store confirmed.
  "call_started",
  "call_failed",
  "call_wall_shown",
  "subscription_started",
  // Added 2026-10-10: posts read out of a Facebook, Instagram, X or diary
  // archive, and how many became memories. Platform names only.
  "posts_read",
  "posts_imported",
  // Added 2026-10-22 (FB-319): photos brought in from the camera roll,
  // and how many were kept. Counts only.
  "photos_brought_in",
  "photos_kept",
  // Added 2026-10-18. Sent for weeks and dropped, because the test that
  // guards this list never awaited its own failure.
  "family_question_asked",
  // The Family tab's ask sheet opened the recorder (owner note #3, 26 Oct; lane Q).
  "family_question_voice_opened",
  "family_memory_from_question",
  "conversation_feedback_note",
  "about_you_skipped",
  "about_you_basics_saved",
  "parent_added",
  "parent_invite_shared",
  "tour_opened",
  "call_invite_shared",
  // The one offer to be told about asks (lib/pushOffer.js): yes or no.
  "push_offer",
  // The weekly family rhythm (weekly-rhythm-spec §4.3, FB-309): a tapped
  // notification (kind, cold start, minutes old), a kind's setting
  // changed, and the Sunday letter opened (from the push, Home or a link).
  "notification_opened",
  "notification_setting",
  "letter_opened",
  // Giving A Story (GiveScreen): whether they had joined, how many questions.
  "gift_given",
  // A storyteller's friends (FB-284): a friend link sent, and taken.
  "friend_invited",
  "friend_joined",
  // The guided first run (FB-367, first-run-spec §4 "Analytics";
  // components/guide/useGuide.js): a step seen (step, role), done (step,
  // seconds, via), put off; "Start me off" used; carried on from Home;
  // and the guide's end (done: 0 to 3).
  "guide_step_shown",
  "guide_step_done",
  "guide_later",
  "guide_starter_used",
  "guide_resumed",
  "guide_finished",
  "gift_revealed",
  "gift_card_printed",
  "gift_dated",
];

// The short fixed labels allowed through as strings. Anything else that's a
// string is dropped — the safest way to keep free text out is to not let
// free-form strings in at all.
const LABEL = /^[A-Za-z0-9 &'_:.,-]{1,40}$/;
const MAX_KEYS = 12;

/* Keeps numbers, booleans and short labels; drops everything else. Keys
   are kept as written (they're ours, not the user's). */
export function cleanProps(props) {
  const out = {};
  let n = 0;
  for (const [k, v] of Object.entries(props || {})) {
    if (n >= MAX_KEYS) break;
    // camelCase allowed: the call sites and analytics SQL use it (firstCall,
    // fromFree, talkShare), and a lower-case-only rule was dropping them.
    if (!/^[a-z][A-Za-z0-9_]{0,30}$/.test(k)) continue;
    if (typeof v === "boolean" || (typeof v === "number" && Number.isFinite(v))) {
      out[k] = v;
      n++;
    } else if (typeof v === "string" && LABEL.test(v)) {
      out[k] = v;
      n++;
    }
  }
  return out;
}

export function isKnownEvent(name) {
  return EVENTS.includes(name);
}
