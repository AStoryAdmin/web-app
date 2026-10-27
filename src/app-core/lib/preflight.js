/* The checks a book passes before a family pays to print it (ruling R12).

   Plain words only: a family sees "this photo may look blurry", never the
   printer's terms. Photos never stop an order; they warn. The one thing
   that blocks is a book longer than one volume binds. Short books are
   padded with empty pages at the back to a count the printer binds.

   The safe zone and the listening codes are checked by construction: the
   layout's margins (the print profile) must sit at or inside the safe zone,
   and every code must point to a memory in this version, with a recording,
   under this version's key, printed large enough to scan. Real scanning is
   done on the physical proof copy.

   Pure: imports only ./legacyBook.js, so the app, the web (app-core copy)
   and node tests all run the same file. The page rules come from the
   profile, which a test holds equal to printCatalog.js. */
import { PRINT_PROFILES, paddedPageCount, PHOTO_PLACED_IN } from "./legacyBook.js";

// Pixels per inch at the placed size. At or above SHARP_PPI a photo prints
// sharp; below SOFT_PPI it will likely look blurry.
export const SHARP_PPI = 300;
export const SOFT_PPI = 150;
// The smallest a listening code is printed and still scans easily.
export const MIN_QR_IN = 0.8;

export const PREFLIGHT_WORDS = {
  tooLong: "This book is longer than we can bind in one volume. Please remove a few pages and try again.",
  layout: "Something in the book's layout needs fixing on our side before it can print. Please try again later.",
  blurry: (label) => `This photo may look blurry in print: ${label}.`,
  veryBlurry: (label) => `This photo will likely look blurry in print: ${label}. A larger copy of it would print better.`,
  silentCode: (title) => `The listening code for "${title}" won't play anything yet.`,
};

const asProfile = (p) => (typeof p === "string" ? PRINT_PROFILES[p] : p);

/* Every margin of the layout is at least the printer's safe zone, so no
   words can land where the trim might cut. A profile with no safeIn has
   no known safe zone, and is not passed. */
export function safeZoneOk(profile) {
  const p = asProfile(profile);
  if (!p || typeof p.safeIn !== "number" || !p.marginsIn) return false;
  return ["top", "bottom", "inside", "outside"].every((side) => typeof p.marginsIn[side] === "number" && p.marginsIn[side] >= p.safeIn);
}

/* Pixels per inch of a photo at its placed size: the smaller of the two
   sides. Without a placed size, the full width of the text block, fitted to
   the photo's shape. null when the photo's size isn't known. */
export function photoPpi(photo, profile) {
  const w = Number(photo?.pixelsW);
  const h = Number(photo?.pixelsH);
  if (!(w > 0) || !(h > 0)) return null;
  let pw = Number(photo.placedWIn);
  let ph = Number(photo.placedHIn);
  if (!(pw > 0) || !(ph > 0)) {
    const block = PHOTO_PLACED_IN(profile);
    pw = Math.min(block.widthIn, block.heightIn * (w / h));
    ph = pw * (h / w);
  }
  return Math.min(w / pw, h / ph);
}

const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

// The 22-character short form of a uuid back to the uuid (bookDesign.js's
// longId, kept here so this file imports only legacyBook.js).
function fromShortId(short) {
  if (!/^[A-Za-z0-9_-]{22}$/.test(String(short || ""))) return null;
  let bits = "";
  for (const ch of short) bits += ABC.indexOf(ch).toString(2).padStart(6, "0");
  const hex = Array.from({ length: 32 }, (_, i) => parseInt(bits.slice(i * 4, i * 4 + 4), 2).toString(16)).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/* A listening code's url, read back: its base, the memory it opens and the
   key it carries. null when it isn't one of ours in shape. */
export function readListenUrl(url) {
  const s = String(url || "");
  const q = s.indexOf("?");
  if (q < 0) return null;
  const params = new URLSearchParams(s.slice(q + 1));
  const m = params.get("m");
  const k = params.get("k");
  if (!m || !k) return null;
  return { base: s.slice(0, q).replace(/\/$/, ""), memoryIds: [fromShortId(m), m].filter(Boolean), key: k };
}

function codeProblem(qr, memories, listenBase, listenKey) {
  const read = readListenUrl(qr?.url);
  if (!read) return true;
  if (listenBase && read.base !== String(listenBase).replace(/\/$/, "")) return true;
  if (!listenKey || read.key !== listenKey) return true;
  const target = memories.find((m) => read.memoryIds.includes(m.id));
  if (!target || !target.hasAudio) return true;
  if (qr.memoryId && target.id !== qr.memoryId) return true;
  if (!(Number(qr.sizeIn) >= MIN_QR_IN)) return true;
  return false;
}

export function preflightBook({ profile, pageCount, photos = [], qrCodes = [], memories = [], listenBase, listenKey } = {}) {
  const p = asProfile(profile);
  if (!p) throw new Error("preflightBook needs a print profile");
  const blocking = [];
  const warnings = [];

  const padded = paddedPageCount(p, pageCount);
  if (padded.tooMany) blocking.push({ kind: "too_long", words: PREFLIGHT_WORDS.tooLong });
  if (!safeZoneOk(p)) blocking.push({ kind: "layout", words: PREFLIGHT_WORDS.layout });

  for (const photo of photos || []) {
    const ppi = photoPpi(photo, p);
    if (ppi == null || ppi >= SHARP_PPI) continue;
    const label = photo.label || "a photo";
    const soft = ppi < SOFT_PPI;
    warnings.push({
      kind: soft ? "photo_very_blurry" : "photo_blurry",
      words: soft ? PREFLIGHT_WORDS.veryBlurry(label) : PREFLIGHT_WORDS.blurry(label),
      memoryId: photo.memoryId ?? null,
      photoId: photo.id ?? null,
    });
  }

  const list = (memories || []).filter((m) => m && m.id);
  for (const qr of qrCodes || []) {
    if (!codeProblem(qr, list, listenBase, listenKey)) continue;
    const read = readListenUrl(qr?.url);
    const named =
      list.find((m) => m.id === qr?.memoryId) || (read ? list.find((m) => read.memoryIds.includes(m.id)) : null);
    warnings.push({
      kind: "listening_code",
      words: PREFLIGHT_WORDS.silentCode(named?.title || "one memory"),
      memoryId: qr?.memoryId ?? named?.id ?? null,
      photoId: null,
    });
  }

  return { ok: blocking.length === 0, blocking, warnings, paddedPages: padded.pages, blanks: padded.blanks };
}
