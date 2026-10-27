// Who told a memory, and what the family has added to it, for the line
// under its title and the "From the family" part of its page.
//
// The memory page said when and which chapter, and nothing about whose
// words they were or that anybody else remembered it too. It's the page
// the weekly email and shared links open, so it should say both, and ask
// the reader for their side.
//
// Pure, so it's tested.

import { stampDate } from "./familyFacts.js";
import { TAKEN_OFF, takenOffLine } from "./familyTrust.js";
import { cleanSpeech, stripFiller, hasSubstance } from "./quoteText.js";
import { privateReaders } from "./firstRunGuide.js";

/* "Rose told this", "From Linh, her daughter", "From Rose's memoir", or
   "In your words" on your own story. Never invents a teller: a memory with
   no story says nothing.

   "Myself" is the owner's word for the story, so "In your words" is only
   for the owner reading it (`meId`). A keeper reading Rose's own story
   sees "Rose told this". */
export function toldBy(story, memory, meId = null) {
  if (!story || !memory) return "";
  const contributor = String(memory.contributor || "").trim();
  if (contributor) return `From ${contributor}`;
  // Told in her words, typed by somebody else (FB-326, lib/credit): the
  // scribe is named, never shown as the teller.
  const scribe = firstName(memory.writtenDownBy);
  if (scribe) return `As told by ${firstName(story.name) || "them"} · written down by ${scribe}`;
  if (memory.source === "memoir") return `From ${story.name}'s memoir`;
  if (story.relationship === "Myself" && meId && story.ownerId === meId) return "In your words";
  const name = String(story.name || "").trim();
  return name ? `${name} told this` : "";
}

/* The family's sides of one memory: approved context sent for it, oldest
   first, the order they were added in. Only context (kind "testimonial"):
   a contribution of kind "memory" becomes a memory of its own when it's
   approved, and shown here too it would read twice. */
export function sidesFor(contributions = [], memoryId) {
  if (!memoryId) return [];
  return (contributions || [])
    .filter(
      (c) =>
        c &&
        c.memoryId === memoryId &&
        c.status === "approved" &&
        (c.kind || "testimonial") === "testimonial" &&
        String(c.body || "").trim()
    )
    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
}

/* Who can be asked for their side of a memory: the living people in the
   tree, not you, who are on A Story or have an email on their row. Those on
   A Story first (they are asked in the app), then by name. */
export function theirSideCandidates(people, me) {
  const myEmail = String(me?.email || "").toLowerCase();
  return (people || [])
    .filter((p) => p && p.source !== "placeholder" && !p.deathYear)
    .filter((p) => !(me?.id && p.userId === me.id) && !(p.email && myEmail && String(p.email).toLowerCase() === myEmail))
    .filter((p) => p.userId || p.email)
    .sort((a, b) => (!!b.userId - !!a.userId) || String(a.givenName || "").localeCompare(String(b.givenName || "")));
}

/* What to say once they're asked: in the app for somebody on A Story, by
   email for somebody who isn't. */
export function askedLine({ asked = 0, inApp = 0 } = {}, label, title) {
  if (!asked) return { title: "Already asked", body: `${label} ${label === "everyone" ? "were" : "was"} already asked about this one.` };
  const byMail = asked - inApp;
  const how =
    inApp && byMail
      ? "Those on A Story will see it in the app; the others get an email."
      : inApp
        ? "They'll see it in A Story."
        : "They'll get an email.";
  return { title: `Asked ${label}`, body: `${how} Their side of "${title}" lands here when they answer.` };
}

/* Who wrote somebody's side, and from where, for the line under it:
   "Linh, partner · written in A Story · 14 Oct 2026". (Daniel, TestFlight
   14 Oct: everyone should know who wrote it and from where.)

   Called with the storyteller (`teller: { name, sex }`), it is the hero's
   credit (hero-spec §2): "Linh, her daughter · kept with Rose's, 20 Oct",
   in the reader's own person ("Linh, your daughter · kept with yours, …"
   for Rose; "You, her daughter · …" for Linh), dated by stampDate (no
   year this year, B33). */
// A no-break space.
const NBSP = " ";
const VIA = { app: "written in A Story", call: "said on a call with A Story", link: "sent from the family's link" };
export function sideCredit(c, { teller, viewer = "other", now } = {}) {
  if (!c) return "";
  if (!teller) {
    const who = [c.contributorName || "Someone in the family", c.relationship ? String(c.relationship).toLowerCase() : ""].filter(Boolean).join(", ");
    const t = c.createdAt ? new Date(c.createdAt) : null;
    const when = t && !Number.isNaN(t.getTime()) ? t.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
    return [who, VIA[c.via] || "", when].filter(Boolean).join(" · ");
  }
  const tellerName = firstName(teller.name) || "them";
  const rel = String(c.relationship || "").trim().toLowerCase();
  const whose = viewer === "teller" ? "your" : possessive(teller.sex);
  const name = viewer === "author" ? "You" : firstName(c.contributorName) || "Someone in the family";
  const who = rel ? `${name}, ${whose} ${rel}` : name;
  const when = stampDate(c.reviewedAt || c.keptAt || c.createdAt, now ? { now } : undefined);
  const kept = viewer === "teller" ? "kept with yours" : `kept with ${tellerName}’s`;
  // "kept with Rose’s, 20 Oct" keeps together, so the date is never a
  // widow (H4c), and the "·" stays at the end of the line before it: a
  // line never starts with a dot (judges r3 read "· kept with…" opening a
  // line as a stray mark). It breaks after the dot, or not at all.
  const keep = (x) => x.replace(/ /g, NBSP);
  return `${who}${NBSP}· ${keep(when ? `${kept}, ${when}` : kept)}`;
}

/* ── The hero's two versions on one memory (hero-spec H3a, H4a–H4c) ──── */

function firstName(s) {
  return String(s || "").trim().split(/\s+/)[0] || "";
}

/* Her, his or their: the storyteller's possessive, from the tree's `sex`
   ("F", "M"); "their" for anyone the tree doesn't say. */
export function possessive(sex) {
  const s = String(sex || "").toUpperCase();
  return s === "F" ? "her" : s === "M" ? "his" : "their";
}

/* The one line of her own words the memory is kept by. The summariser's
   `keptLine` when there is one; otherwise a sentence of the body, verbatim
   (never a paraphrase): the first one of 4 to 24 words. "" when the body
   has none. */
// Never a speaker label, a filler opening, a question or talk about the
// recording (FB-511, lib/quoteText).
export function keptLineOf(memory) {
  const kept = stripFiller(cleanSpeech(memory?.keptLine));
  if (kept) return kept;
  const body = cleanSpeech(
    String(memory?.body || "")
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p && !/^A Story asked:/i.test(p))
      .join("\n")
  );
  const sentences = body.match(/[^.!?…]+[.!?…]+["”’)]*|[^.!?…]+$/g) || [];
  for (const raw of sentences) {
    const s = stripFiller(raw.trim());
    const words = s.split(/\s+/).filter(Boolean).length;
    if (words >= 4 && words <= 24 && hasSubstance(s, 4)) return s;
  }
  return "";
}

/* The word a relative's version answers in the kept line (H4a, H43): the
   longest content word of five letters or more that both share, as it is
   written in the kept line. Computed at render, never stored. "" when
   they share none: then no ¹ anywhere, and the slip simply sits under the
   kept line. */
const ANCHOR_STOP = new Set(
  "about above after again against along among another around because before being below between could doesnt didnt every first going might never other quite really should since still their there these thing things think those though three through under until where which while whole would wasnt werent youre theyre years always maybe often later little right".split(" ")
);
const wordsOf = (s) =>
  (String(s || "").match(/[\p{L}\p{N}'’]+/gu) || []).map((w) => w.replace(/['’]s$/i, "").replace(/['’]/g, ""));
export function anchorOf(keptLine, body) {
  const theirs = new Set(wordsOf(body).map((w) => w.toLowerCase()));
  let best = "";
  for (const w of wordsOf(keptLine)) {
    const key = w.toLowerCase();
    if (key.length < 5 || ANCHOR_STOP.has(key) || !theirs.has(key)) continue;
    if (key.length > best.length) best = w;
  }
  return best;
}

/* The kept line split at its anchor, so a mark can sit after the word:
   ["And my father's ", "tomatoes", " against the south wall."]. The whole
   word only, its first time. [text, "", ""] without one. */
export function splitAtAnchor(text, word) {
  const t = String(text || "");
  if (!word) return [t, "", ""];
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = new RegExp(`(^|[^\\p{L}\\p{N}])(${esc})(?=[^\\p{L}\\p{N}]|$)`, "iu").exec(t);
  if (!m) return [t, "", ""];
  const at = m.index + m[1].length;
  return [t.slice(0, at), t.slice(at, at + m[2].length), t.slice(at + m[2].length)];
}

/* Who is reading, in the hero's three persons (hero-spec §0): "teller"
   (Rose: it's her story), "author" (Linh: it's her version), or "other"
   (Jamie, the keeper, and anyone else). */
export function viewerOf({ isTeller = false, side, me } = {}) {
  if (isTeller) return "teller";
  const mine =
    !!side &&
    (!!side.mine ||
      !!(me?.id && side.userId && side.userId === me.id) ||
      !!(me?.id && side.createdBy && side.createdBy === me.id));
  return mine ? "author" : "other";
}

/* A side's heading, whole, in the book's own words (T-16, lane K s89):
   "Linh remembers it too", or "You remember it too" on her own phone. It
   was "Linh added to this memory…", whose ellipsis read as a line cut off
   beside a "More"; "remembers it differently" read as a disagreement
   (owner, 22 Oct, FB-330), "too" says she is adding, not correcting. */
export function differentlyLine(side, viewer = "other") {
  if (viewer === "author") return "You remember it too";
  const name = firstName(side?.contributorName) || "Someone in the family";
  return `${name} remembers it too`;
}

/* The words under a slip that hasn't been kept yet, so its state is never
   only the material (bench risk 9, U1):
     the keeper:  "Waiting for your yes"
     its author:  "Sent to Jamie. It joins Rose's memory when Jamie says yes."
                  "Not added to Rose's memory" (after a no)
   "" when the reader shouldn't see a loose slip at all. */
export function slipState(c, { viewer = "other", keeper = "", tellerName = "", isKeeper = false } = {}) {
  if (!c) return "";
  const her = firstName(tellerName);
  const memoryOf = her ? `${her}’s memory` : "the memory";
  if (c.status === "rejected") return viewer === "author" ? `Not added to ${memoryOf}` : "";
  // Taken off by a keeper or the storyteller (S-PL5): its writer still
  // has it, and is told so; nobody else sees it.
  if (c.status === TAKEN_OFF) return takenOffLine(c, { tellerName, viewer });
  if (c.status !== "pending") return "";
  if (viewer === "author") {
    // Kept on this phone until it reaches the story (J3-10 "Failure").
    if (c.unsent) return "Not sent yet. It goes when you’re back online.";
    const k = firstName(keeper);
    return k ? `Sent to ${k}. It joins ${memoryOf} when ${k} says yes.` : `Sent. It joins ${memoryOf} once it’s kept.`;
  }
  return isKeeper ? "Waiting for your yes" : "";
}

/* The footer on Linh's leaf (H25), the slip's state said in advance:
   "Jamie keeps Rose's story. It joins Rose's memory when Jamie says yes." */
export function keeperFoot(keeper, tellerName) {
  const k = firstName(keeper);
  const her = firstName(tellerName);
  if (!k || !her) return "It joins the memory once whoever keeps the story says yes.";
  return `${k} keeps ${her}’s story. It joins ${her}’s memory when ${k} says yes.`;
}

/* How a relative opens her leaf to the storyteller (H4a): by what the
   storyteller is to her in the tree, the way she'd say it ("Dear Mom,"),
   and by name when the tree has no word a person would write (judge-
   investor r2: "Dear Rose," from a daughter read as a template).
   `relation` is the tree's word for the storyteller as seen from the
   writer (lib/familyGraph relationshipBetween(storyteller, writer)). */
const SALUTE = {
  mother: "Mom",
  father: "Dad",
  grandmother: "Grandma",
  grandfather: "Grandpa",
};
export function salutation(relation, name) {
  const rel = String(relation || "").trim().toLowerCase();
  const first = firstName(name);
  if (SALUTE[rel]) return SALUTE[rel];
  if ((rel === "aunt" || rel === "uncle") && first) return `${rel === "aunt" ? "Aunt" : "Uncle"} ${first}`;
  return first;
}

/* "today", "yesterday", or the stamp date ("12 Oct"), for "told today". */
export function toldWhen(when, now = new Date()) {
  if (!when) return "";
  const d = when instanceof Date ? when : new Date(when);
  if (Number.isNaN(d.getTime())) return "";
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  return stampDate(d, { now });
}

/* The line under a memory's title (hero-spec §2): "Rose told this ·
   today", "You told this · today" on her phone; once a version is kept
   beside hers, "Rose told this · Linh added to it". */
export function tellerLine({ tellerName = "", viewer = "other", when = "", side = null, verb = "told" } = {}) {
  const her = firstName(tellerName);
  // "wrote" for a memory she wrote rather than told (j1-spec J1-8).
  const told = viewer === "teller" ? `You ${verb} this` : her ? `${her} ${verb} this` : "";
  if (!told) return "";
  if (side && side.status === "approved") {
    const them = viewer === "author" ? "you added to it" : `${firstName(side.contributorName) || "family"} added to it`;
    return `${told} · ${them}`;
  }
  return when ? `${told} · ${when}` : told;
}

/* The review's kicker (hero-spec §2): "Here's what you said" to the
   storyteller, "Here's what Rose said" to anyone else. */
export function reviewKicker(isTeller, tellerName) {
  const her = firstName(tellerName);
  return isTeller || !her ? "Here’s what you said" : `Here’s what ${her} said`;
}

/* Who may read it, said in words on the review (FB-009, H31): the family's
   by default (DECISIONS T-114, 26 Oct; it was private until shared, L1);
   "shared" is the family on A Story, never public. "Only me" is one tap.
   { line, action }: the action is the quiet link that changes it. */
export const FAMILY_LINE = "Your family on A Story can see it, hear it, and add to it.";
export function privacyLine(privacy, { isTeller = false, keeper = "" } = {}) {
  const k = firstName(keeper);
  if (privacy === "shared") {
    // Never "Keep it…": the dock's one action is "Keep it", and two
    // controls of that name sent VoiceOver to the wrong one (judge-
    // investor r3 #12).
    return { line: FAMILY_LINE, action: isTeller ? "Only me →" : "Only the keepers →" };
  }
  // Said as the storyteller would say it. The keeper's own line names no
  // one else until it is confirmed that the storyteller can read a
  // keeper's private memory (M-J1-9).
  // One wording everywhere (lib/firstRunGuide privateReaders).
  if (isTeller && k) return { line: privateReaders({ other: k }), action: "Let the family read it →" };
  return { line: privateReaders({ own: true }), action: "Let the family read it →" };
}

/* One VoiceOver stop for a slip (H4c "After"): "Linh remembers it
   differently, about tomatoes. It wasn't tomatoes… Linh, her daughter,
   kept with Rose's, 20 Oct." */
export function slipSpeech({ heading = "", anchor = "", body = "", credit = "", state = "" } = {}) {
  const head = String(heading).replace(/…$/, "");
  return [anchor ? `${head}, about ${anchor}.` : head ? `${head}.` : "", String(body).trim(), String(credit || state).replace(/ · /g, ", ")]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/* The one version a memory page shows under the kept line, for this
   reader: a kept one for everyone; a waiting one only to the keeper; the
   reader's own sent one (waiting, or not added) only to its author. The
   storyteller never sees a loose slip (H4c acceptance 1). Oldest first.
   `sent` is what this phone sent (a sender can't read the story's queue
   back). */
export function slipFor(contributions = [], memoryId, { isKeeper = false, isTeller = false, me = null, sent = [] } = {}) {
  if (!memoryId) return null;
  const mine = (c) => !!c && (!!c.mine || !!(me?.id && (c.userId === me.id || c.createdBy === me.id)));
  const forThis = (c) => !!c && c.memoryId === memoryId && (c.kind || "testimonial") === "testimonial" && !!String(c.body || "").trim();
  const seen = new Set();
  const all = [...(contributions || []), ...(sent || [])].filter((c) => {
    if (!forThis(c) || (c.id && seen.has(c.id))) return false;
    if (c.id) seen.add(c.id);
    return true;
  });
  const byAge = (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  const kept = all.filter((c) => c.status === "approved").sort(byAge);
  if (kept.length) return kept[0];
  if (isTeller) return null;
  const waiting = all.filter((c) => c.status === "pending").sort(byAge);
  if (isKeeper && waiting.length) return waiting[0];
  const own = all.filter((c) => mine(c) && (c.status === "pending" || c.status === "rejected" || c.status === TAKEN_OFF)).sort(byAge);
  return own[0] || null;
}

/* ── A recording somebody brought in (ways-in §3.2, QW4, QW7) ─────────── */

// "2025-11-27" read as that day wherever the phone is (never shifted a
// day by the time zone), then set as the house sets a stamp.
function dayOf(recordedOn) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(recordedOn || ""));
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : recordedOn || null;
}

/* Who brought it in, and when it was recorded, for the review's sign-off
   and the memory's page: "From a recording Jamie brought in · 27 Nov 2025".
   The teller keeps the credit; the uploader is only who brought it in.
   "you" on the uploader's own phone. "" when there's no recording. */
export function recordingLine(recording, { meId = null, now = new Date() } = {}) {
  if (!recording) return "";
  const mine = !!meId && recording.broughtInById === meId;
  const who = mine ? "you" : firstName(recording.broughtInBy);
  const head = who ? `From a recording ${who} brought in` : "From a recording";
  const on = stampDate(dayOf(recording.recordedOn), { now });
  return on ? `${head} · ${on}` : head;
}

/* The uploader's few words on a voice note, always labelled as theirs and
   never as the teller's (QW7): "Jamie's note", or "Your note". */
export function noteLabel(note, { meId = null } = {}) {
  if (!note || !String(note.text || "").trim()) return "";
  if (meId && note.byId === meId) return "Your note";
  const who = firstName(note.by);
  return who ? `${who}’s note` : "A note from the family";
}
