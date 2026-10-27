// Who a memory is from, who wrote it down, where it came from, and when it
// was kept: the one credit a memory carries wherever it is listed (FB-326
// items 1 and 2, DECISIONS S-PL8; collab-web-study §4 A1, A2).
//
// The web answers "who, from where, when" in one line under every version
// ("Linh, daughter · written in A Story · 14 Oct 2026"). The phone said
// only who, and lost two things on the way: a memory typed "In Rose's
// words" dropped who typed it, and a keeper's own memory lost how they are
// related ("From Jamie", never "From Jamie, her granddaughter"). Both are
// kept on the memory now:
//
//   contributor       "Jamie, her granddaughter": whose words, with what
//                     they are to the storyteller (memoryFrom and
//                     tellerCredit write it this way)
//   writtenDownBy     "Jamie": who typed a memory told in the storyteller's
//                     own words; writtenDownById their account,
//                     writtenDownByPersonId their row in the tree
//   via               how it got here: "written", "recorded", "call",
//                     "link" (the family's link), "memoir"
//
// Pure, so scripts/test-truth.mjs reaches it.
import { stampDate } from "./familyFacts.js";
import { buildIndex, relationshipBetween } from "./familyGraph.js";
import { possessive } from "./memorySides.js";

const firstName = (s) => String(s || "").trim().split(/\s+/)[0] || "";
const NBSP = " ";

/* "her granddaughter": what the writer is to the storyteller, from the
   tree. "" when the tree doesn't say (no row, no path, the same person). */
export function relationTo(writerPersonId, subjectPersonId, family, subjectSex = "") {
  if (!writerPersonId || !subjectPersonId || writerPersonId === subjectPersonId || !family) return "";
  const index = family.people instanceof Map ? family : buildIndex(family);
  const label = relationshipBetween(index, writerPersonId, subjectPersonId)?.label || "";
  if (!label) return "";
  const subject = index.people.get(subjectPersonId);
  return `${possessive(subjectSex || subject?.sex)} ${label}`;
}

/* "Jamie, her granddaughter": a credit as a memory stores it. */
export function signedCredit(name, relation = "") {
  const who = firstName(name);
  if (!who) return "";
  const rel = String(relation || "").trim();
  return rel ? `${who}, ${rel}` : who;
}

/* The scribe's fields for a memory typed in the storyteller's words
   (CreateMemoryScreen, "In Rose's words"). Null for a memory she wrote or
   told herself. */
export function writtenDownBy({ name, userId = null, personId = null } = {}) {
  const who = firstName(name);
  if (!who) return null;
  return { writtenDownBy: who, writtenDownById: userId || null, writtenDownByPersonId: personId || null };
}

/* How a memory got here, said in Bao's words. "" when nothing is known
   (an older memory saved before this was kept): the line says less rather
   than guessing. */
export const HOW = {
  written: "written in A Story",
  recorded: "recorded in A Story",
  call: "said on a call with A Story",
  link: "sent by the family’s link",
  memoir: "from the memoir",
  recording: "from a recording",
};
export function howKept(memory) {
  if (!memory) return "";
  if (memory.recording) return HOW.recording;
  if (memory.familyCallId) return HOW.call;
  if (memory.source === "memoir") return HOW.memoir;
  return HOW[memory.via] || "";
}

/* Is this reader the one credited? By account, by row in the tree, or by
   first name (a contributor line is free text). */
function isMine(memory, viewer = {}) {
  if (!memory || !viewer) return false;
  if (viewer.meId && (memory.createdBy === viewer.meId || memory.writtenDownById === viewer.meId) && !memory.contributor) return false;
  if (viewer.meId && memory.authorUserId && memory.authorUserId === viewer.meId) return true;
  if (viewer.personId && memory.authorPersonId && memory.authorPersonId === viewer.personId) return true;
  const me = firstName(viewer.firstName).toLowerCase();
  return !!me && firstName(memory.contributor).replace(/,$/, "").toLowerCase() === me;
}

/* The head's line for a memory somebody else typed in the storyteller's
   words: "As told by Rose · written down by Jamie", in the reader's own
   person ("As told by you · written down by Jamie" on Rose's phone;
   "… written down by you" on Jamie's), then when. "" when nobody wrote
   it down for her. */
export function scribeLine(memory, { tellerName = "", viewer = {}, when = "" } = {}) {
  const scribe = firstName(memory?.writtenDownBy);
  if (!scribe) return "";
  const her = viewer.isTeller ? "you" : firstName(tellerName) || "them";
  const by = viewer.meId && memory.writtenDownById === viewer.meId ? "you" : scribe;
  const line = `As told by ${her} · written down by ${by}`;
  return when ? `${line} · ${when}` : line;
}

/* The quiet credit under a memory's head, and the one line a row carries
   (FB-326 item 2): who, from where if known, when kept.

     "Linh, her daughter · sent by the family’s link · kept 14 Oct"
     "Jamie, her granddaughter · written in A Story · kept today"
     "Written down by Jamie · kept 14 Oct"           (Rose's words, typed)
     ""                                              (Rose's own: the head
                                                       says it already)

   `viewer` { meId, personId, firstName, isTeller }: the reader's own
   person ("You, her granddaughter"). `when` is kept with its word so the
   date is never a widow at a line's end (H4c). */
export function creditLine(memory, { viewer = {}, now = new Date(), when: withWhen = true } = {}) {
  if (!memory) return "";
  const contributor = String(memory.contributor || "").trim();
  const scribe = firstName(memory.writtenDownBy);
  let who = "";
  if (contributor) {
    who = isMine(memory, viewer) ? contributor.replace(/^[^,]+/, "You") : contributor;
  } else if (scribe) {
    who = `Written down by ${viewer.meId && memory.writtenDownById === viewer.meId ? "you" : scribe}`;
  }
  if (!who) return "";
  const how = howKept(memory);
  // `when: false` where the head already says when (the memory page).
  const day = withWhen ? stampDate(memory.createdAt, { now }) : "";
  const when = day ? `kept${NBSP}${day.replace(/ /g, NBSP)}` : "";
  return [who, how, when].filter(Boolean).join(" · ");
}

/* The row's version (cards, lists): who and from where, with the memory's
   own date put after it by lib/memoryCard. "From Linh, her daughter",
   "Told to Jamie" for a memory typed in Rose's words. "" for her own. */
export function rowCredit(memory) {
  if (!memory) return "";
  const contributor = String(memory.contributor || "").trim();
  if (contributor) {
    const how = memory.via === "link" ? "by the family’s link" : memory.familyCallId ? "on a call" : "";
    return [`From ${contributor}`, how].filter(Boolean).join(" · ");
  }
  const scribe = firstName(memory.writtenDownBy);
  return scribe ? `Told to ${scribe}` : "";
}
