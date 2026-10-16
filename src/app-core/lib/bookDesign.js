// How somebody has designed their printed book: the cover, the paper, the
// order of the chapters, which memories go in, and a dedication. Stored on
// the story (stories.book_design) and read by the book itself
// (legacyBook.js), so the preview in the app and the PDF that is printed
// are built from the same choices. Pure, so it can be tested.

import { ERAS, CATCH_ALL_CHAPTER, FAMILY_CHAPTER } from "../data/eras.js";

export const DESIGN_VERSION = 1;

// Cover styles. "keepsake" is A Story's own cover (coverbook.pdf, the
// design team's template, front, spine and back) and what every book gets unless somebody
// chooses otherwise: the title in capitals, a date line, the storyteller's
// name in script, up to three of their photographs set as prints, and a
// line in script at the foot. It fills itself in from the story, so a book
// nobody has touched is already finished. The others are for families who
// want something different. Two need a photograph; without one they fall
// back to the cloth board, so a design never prints a hole.
export const COVER_STYLES = [
  { key: "keepsake", name: "Keepsake", note: "Our cover: their name, their photos", needsPhoto: false },
  { key: "cloth", name: "Clothbound", note: "Deep brown cloth, the title in gold foil", needsPhoto: false },
  { key: "heirloom", name: "Heirloom", note: "Teal cloth with a foil frame and the mark", needsPhoto: false },
  { key: "tipped", name: "Photo plate", note: "A photograph set into a linen board", needsPhoto: true },
  { key: "wrap", name: "Photo wrap", note: "Their photograph across the whole cover", needsPhoto: true },
];

// Paper and ink for the pages inside. The colours themselves are in the
// theme (BOOK_PRINT); these are the choices and their names.
// "classic" is the book as it has always printed, so a story nobody has
// designed prints exactly as before.
export const PAPERS = [
  { key: "classic", name: "Classic", note: "White pages, teal and terracotta" },
  { key: "ivory", name: "Ivory", note: "Warm cream pages, brown and terracotta" },
  { key: "antique", name: "Antique", note: "Deeper, older paper, brown and gold" },
];

// The keepsake cover's colourways, as the template has them. The colours
// are BOOK_PRINT.covers.keepsake in the theme.
export const KEEPSAKE_COLORS = [
  { key: "navy", name: "Navy" },
  { key: "cream", name: "Cream" },
  { key: "forest", name: "Forest" },
  { key: "slate", name: "Slate" },
  { key: "charcoal", name: "Charcoal" },
  { key: "mustard", name: "Mustard" },
  { key: "black", name: "Black" },
];
// The cover photographs in black and white, as the template sets them, or
// as they are. Black and white by default: it is the template's look, and
// it makes photographs from six decades and as many cameras sit together.
export const PHOTO_TONES = [
  { key: "bw", name: "Black & white", note: "As our cover sets them; old and new photos sit together" },
  { key: "colour", name: "In colour", note: "The photos as they are" },
];

// How the pages read. "first" is the memories as they were told, in the
// storyteller's own words; "third" is the same memories retold as a
// biography ("She grew up..."), written by A Story's server and kept on the
// design (`retold`) so the book prints exactly what was read.
export const NARRATIONS = [
  { key: "first", name: "In their own words", note: "As they told it: \"I grew up above the bakery...\"" },
  { key: "third", name: "As their life story", note: "Told about them: \"She grew up above the bakery...\"" },
];
export const PRONOUNS = [
  { key: "she", name: "She" },
  { key: "he", name: "He" },
  { key: "they", name: "They" },
];

/* The book's chapters, in the order a book should tell a life.

   Not the app's list order: that's for filing a memory, this is for
   reading one life from beginning to end. The shape is a memoir's:

     roots          Where we come from     the people and place before them
     the life       Childhood              who they were first
                    Growing up             school, first jobs, leaving home
                    Love & family          who they chose, and who came
                    Work & making a living how they kept it all going
     the tests      The world we lived through   history, as it was on a Tuesday
                    When everything changed      the turn their own life took
     what held      Faith & what carried me      what they leaned on
                    More stories                 everything else (the app's
                                                 "Anything else", named for a
                                                 reader)
     the ending     Looking back           their own last word on it
                    From the family        the family answering

   It ends on the family's voice on purpose: the book is dedicated to them
   on its back cover, and the last pages are theirs, so it closes the
   circle rather than trailing off into a catch-all. */
export const BOOK_CHAPTER_ORDER = [
  "Where we come from",
  "Childhood",
  "Growing up",
  "Love & family",
  "Work & making a living",
  "The world we lived through",
  "When everything changed",
  "Faith & what carried me",
  CATCH_ALL_CHAPTER,
  "Looking back",
  FAMILY_CHAPTER,
];
// What a chapter is called in print, where it differs from the app.
export const PRINTED_CHAPTER_NAMES = { [CATCH_ALL_CHAPTER]: "More stories" };
export const printedChapterName = (era) => PRINTED_CHAPTER_NAMES[era] || era;

// The order of the book. By chapter of life is the default.
export const ARRANGEMENTS = [
  { key: "chapters", name: "By chapter of life", note: "Childhood, love & family, work... each its own chapter" },
  { key: "timeline", name: "By year", note: "From the earliest memory to the latest, decade by decade" },
];

export const KEEPSAKE_TITLE = "Moments & Memories";
// The back cover's defaults. Neutral in voice, because the storyteller may
// or may not be the one ordering.
export const BACK_MESSAGE =
  "The stories of a life, in the words it was lived in, kept for the family who will carry them on.";
export const BACK_MESSAGE_MAX = 280;
export const BACK_NAME_MAX = 40;
export const KEEPSAKE_TAGLINE = "Family is everything to me.";
export const COVER_PHOTOS_MAX = 3;
export const TAGLINE_MAX = 60;

export const DEFAULT_SUBTITLE = "A Life, In Their Words";
export const DEDICATION_MAX = 400;
export const TITLE_MAX = 60;
export const SUBTITLE_MAX = 80;

const clip = (s, n) => String(s ?? "").slice(0, n);

// Whatever was stored (or nothing) as a complete, valid design. Unknown
// keys and values are dropped rather than trusted: this is read straight
// out of a jsonb column that any member of the story can write.
export function normaliseDesign(raw) {
  const d = raw && typeof raw === "object" ? raw : {};
  const cover = d.cover && typeof d.cover === "object" ? d.cover : {};
  const style = COVER_STYLES.some((c) => c.key === cover.style) ? cover.style : "keepsake";
  const color = KEEPSAKE_COLORS.some((c) => c.key === cover.color) ? cover.color : "navy";
  // Empty means "choose for me": the story's first photographs, at print time.
  const photos = Array.isArray(cover.photos)
    ? [...new Set(cover.photos.filter((p) => typeof p === "string" && p))].slice(0, COVER_PHOTOS_MAX)
    : [];
  const paper = PAPERS.some((p) => p.key === d.paper) ? d.paper : "classic";
  const order = Array.isArray(d.chapterOrder)
    ? d.chapterOrder.filter((e, i, a) => ERAS.includes(e) && a.indexOf(e) === i)
    : [];
  const excluded = Array.isArray(d.excluded)
    ? [...new Set(d.excluded.filter((id) => typeof id === "string" && id))]
    : [];
  // Retold text, by memory id, each with the hash of the words it was
  // retold from, so an edited memory is never printed from stale text.
  // The book's own key for its listening codes (see listenUrl).
  const listenKey = typeof d.listenKey === "string" && /^[A-Za-z0-9_-]{12,40}$/.test(d.listenKey) ? d.listenKey : "";
  const retold = {};
  if (d.retold && typeof d.retold === "object") {
    for (const [id, r] of Object.entries(d.retold)) {
      if (r && typeof r.body === "string" && typeof r.h === "string") retold[id] = { h: r.h, body: r.body };
    }
  }
  return {
    version: DESIGN_VERSION,
    cover: {
      style,
      color,
      photos,
      tone: PHOTO_TONES.some((t) => t.key === cover.tone) ? cover.tone : "bw",
      tagline: clip(cover.tagline, TAGLINE_MAX).trim(),
      backName: clip(cover.backName, BACK_NAME_MAX).trim(),
      backMessage: clip(cover.backMessage, BACK_MESSAGE_MAX).trim(),
      photo: typeof cover.photo === "string" && cover.photo ? cover.photo : null,
      title: clip(cover.title, TITLE_MAX).trim(),
      subtitle: clip(cover.subtitle, SUBTITLE_MAX).trim(),
    },
    paper,
    chapterOrder: order,
    excluded,
    dedication: clip(d.dedication, DEDICATION_MAX).trim(),
    narration: NARRATIONS.some((n) => n.key === d.narration) ? d.narration : "first",
    pronoun: PRONOUNS.some((p) => p.key === d.pronoun) ? d.pronoun : "",
    retold,
    arrangement: ARRANGEMENTS.some((a) => a.key === d.arrangement) ? d.arrangement : "chapters",
    // Codes that play their voice, beside every memory with a recording.
    qr: d.qr !== false,
    listenKey,
  };
}

/* ── Listening codes ─────────────────────────────────────────────
   A QR code beside a memory with a recording: scan it, and hear them tell
   it. The code carries the memory's id (stable for the life of the memory;
   the recording rows are rewritten on every save, so they can't be linked
   to) and the book's own key, which is only ever printed in the book. The
   server (supabase/functions/listen) plays the memory's recording only if
   the key matches the one saved on the story, so a memory id seen anywhere
   else opens nothing. */

// 16 random URL-safe characters (96 bits).
export function makeListenKey(random = Math.random) {
  const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let k = "";
  for (let i = 0; i < 16; i++) k += abc[Math.floor(random() * 64)];
  return k;
}

// A uuid as 22 base64url characters rather than 36, so the code is smaller.
export function shortId(uuid) {
  const hex = String(uuid || "").replace(/-/g, "");
  if (!/^[0-9a-fA-F]{32}$/.test(hex)) return null;
  const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let bits = "";
  for (const ch of hex) bits += parseInt(ch, 16).toString(2).padStart(4, "0");
  bits += "0000"; // 128 bits → 132: 22 whole 6-bit characters
  let out = "";
  for (let i = 0; i < bits.length; i += 6) out += abc[parseInt(bits.slice(i, i + 6), 2)];
  return out;
}

export function longId(short) {
  const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  if (!/^[A-Za-z0-9_-]{22}$/.test(String(short || ""))) return null;
  let bits = "";
  for (const ch of short) bits += abc.indexOf(ch).toString(2).padStart(6, "0");
  const hex = Array.from({ length: 32 }, (_, i) => parseInt(bits.slice(i * 4, i * 4 + 4), 2).toString(16)).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function listenUrl(base, memoryId, key) {
  // Real memory ids are uuids, and go short. Anything else (the demo's
  // "mem-1") goes as it is, so the codes still draw.
  const m = shortId(memoryId) || (memoryId ? encodeURIComponent(memoryId) : null);
  if (!base || !m || !key) return null;
  return `${String(base).replace(/\/$/, "")}?m=${m}&k=${key}`;
}

// Whether a memory has a recording of their voice to link to.
export function hasVoice(memory) {
  return (memory?.audio || []).some((c) => c?.path && (c.bucket || "memory-audio") === "memory-audio");
}

/* ── A Story's picks ──────────────────────────────────────────────
   Every choice has a default that A Story makes, with the reason, so a
   family that decides nothing still gets a considered book, and one that
   wants to decide can see what they'd be changing. */

export function effectiveArrangement(design) {
  return normaliseDesign(design).arrangement;
}

// How the storyteller is referred to in a retold book: chosen, or guessed
// from their relationship, or "they".
const SHE = ["Grandmother", "Mother", "Mom", "Mum", "Aunt", "Sister", "Wife", "Daughter", "Grandma"];
const HE = ["Grandfather", "Father", "Dad", "Uncle", "Brother", "Husband", "Son", "Grandpa"];
export function pronounFor(story, design) {
  const d = normaliseDesign(design);
  if (d.pronoun) return d.pronoun;
  const rel = String(story?.relationship === "Other" ? story?.relationshipOther : story?.relationship || "");
  if (SHE.some((w) => rel.includes(w))) return "she";
  if (HE.some((w) => rel.includes(w))) return "he";
  return "they";
}

// A short, stable fingerprint of a memory's words (djb2), to tell whether
// retold text still matches what the memory says now.
export function bodyHash(text) {
  let h = 5381;
  const str = String(text || "");
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// The words a memory prints with: its own, or its retold version when the
// book is told in the third person and the retelling is current.
export function printedBody(design, memory) {
  const d = normaliseDesign(design);
  if (d.narration !== "third") return memory?.body || "";
  const r = d.retold[memory?.id];
  return r && r.h === bodyHash(memory?.body) ? r.body : memory?.body || "";
}

// The memories a third-person book still needs retold (new, or edited since).
// Memories somebody else sent in keep their own words and aren't retold.
export function needsRetelling(design, memories) {
  const d = normaliseDesign(design);
  if (d.narration !== "third") return [];
  return (memories || []).filter(
    (m) => m && !m.contributor && !d.excluded.includes(m.id) && d.retold[m.id]?.h !== bodyHash(m.body)
  );
}

// The cover style that will actually print: a photo style without a photo
// is the cloth board.
export function effectiveCoverStyle(design) {
  const d = normaliseDesign(design);
  const style = COVER_STYLES.find((c) => c.key === d.cover.style);
  return style?.needsPhoto && !d.cover.photo ? "cloth" : d.cover.style;
}

// The chapters in the order the book prints them: the ones somebody has
// placed, then every other chapter in its usual place. The catch-all
// chapter always closes the book unless it was placed by hand.
export function chapterSequence(design) {
  const d = normaliseDesign(design);
  const base = [...BOOK_CHAPTER_ORDER, ...ERAS.filter((e) => !BOOK_CHAPTER_ORDER.includes(e))];
  return [...d.chapterOrder, ...base.filter((e) => !d.chapterOrder.includes(e))];
}

// Whether a memory is in the book.
export function includesMemory(design, memoryId) {
  return !normaliseDesign(design).excluded.includes(memoryId);
}

// Moves one chapter a step up (-1) or down (+1) in the printed order, and
// returns the new design. The whole sequence is written, so the order
// somebody sees is the order that is kept.
export function moveChapter(design, era, step) {
  const d = normaliseDesign(design);
  const seq = chapterSequence(d);
  const i = seq.indexOf(era);
  const j = i + step;
  if (i < 0 || j < 0 || j >= seq.length) return d;
  [seq[i], seq[j]] = [seq[j], seq[i]];
  return { ...d, chapterOrder: seq };
}

export function toggleMemory(design, memoryId) {
  const d = normaliseDesign(design);
  const excluded = d.excluded.includes(memoryId)
    ? d.excluded.filter((id) => id !== memoryId)
    : [...d.excluded, memoryId];
  return { ...d, excluded };
}

// Photos the cover can use: every photograph in the story's memories, in
// the order they appear, without repeats.
export function coverPhotoChoices(story) {
  const seen = new Set();
  const out = [];
  for (const m of story?.memories || []) {
    for (const p of [m?.cover, ...(Array.isArray(m?.photos) ? m.photos : [])]) {
      if (typeof p === "string" && p && !seen.has(p)) {
        seen.add(p);
        out.push(p);
      }
    }
  }
  return out;
}

// The photographs a keepsake cover shows: the ones chosen, or, if none
// were, the story's first ones. `story` should be the one being printed
// (with signed URLs), so these load.
export function keepsakePhotos(design, story) {
  const d = normaliseDesign(design);
  return (d.cover.photos.length ? d.cover.photos : coverPhotoChoices(story)).slice(0, COVER_PHOTOS_MAX);
}

// The keepsake cover's words, front, spine and back, with every default
// filled in from the story.
export function keepsakeWords(design, book, story) {
  const d = normaliseDesign(design);
  const year = new Date(book?.printedOn || Date.now()).getFullYear();
  const last = String(story?.lastName || "").trim();
  const title = d.cover.title || KEEPSAKE_TITLE;
  const name = book?.fullName || book?.name || "";
  return {
    title,
    line: d.cover.subtitle || book?.coverSpan || String(year),
    name,
    tagline: d.cover.tagline || KEEPSAKE_TAGLINE,
    spine: [name, title].filter(Boolean).join("  |  "),
    backName: d.cover.backName || (last ? `The ${last} family` : "My family"),
    backMessage: d.cover.backMessage || BACK_MESSAGE,
  };
}
