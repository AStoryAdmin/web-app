// The book as pages, for reading it on the phone one page at a time (the
// Book tab's "Open the book"). Built from lib/legacyBook's bookStructure,
// the same structure the printed PDF is set from, so what is read here and
// what arrives in the post cannot drift. Every memory gets a page of its
// own: never "and 12 more" (flow spec item 8).
//
// Pure, so scripts/test-lib.mjs reaches it.
import { FAMILY_CHAPTER } from "../data/eras.js";
import { sidesFor, anchorOf, keptLineOf, differentlyLine, possessive } from "./memorySides.js";

/* [{ key, kind, folio, chapter?, … }]:
     title     the title page
     contents  every chapter and the page it starts on
     chapter   a chapter's opening page
     memory    one memory */
export function bookPages(book, { recordedBy = "" } = {}) {
  if (!book) return [];
  const pages = [];
  pages.push({ key: "title", kind: "title", title: book.title, subtitle: book.subtitle, span: book.coverSpan || "", recordedBy });
  const contents = { key: "contents", kind: "contents", rows: [] };
  pages.push(contents);
  (book.chapters || []).forEach((c, ci) => {
    const start = pages.length + 1;
    contents.rows.push({ era: c.era, years: c.years || "", folio: start, count: c.items.length });
    pages.push({ key: `ch-${ci}`, kind: "chapter", number: ci + 1, era: c.era, years: c.years || "", count: c.items.length, chapter: c.era });
    for (const m of c.items) pages.push({ key: `m-${m.id}`, kind: "memory", memory: m, chapter: c.era });
  });
  return pages.map((p, i) => ({ ...p, folio: i + 1 }));
}

/* The page the ribbon marks: the newest kept memory's page, so "Open the
   book" opens where the book last grew (hero-spec H5b), never page one.
   The title page (0) when the book has no memory yet. Two kept at the same
   moment go to the one kept last in the story (its memories are in the
   order they were kept); without the story, to the later page. */
export function ribbonIndex(pages, story) {
  const kept = new Map((story?.memories || []).map((m, i) => [m?.id, i]));
  let best = -1;
  let bestAt = "";
  let bestOrder = -1;
  (pages || []).forEach((p, i) => {
    if (p.kind !== "memory") return;
    const at = String(p.memory?.createdAt || "");
    const order = kept.has(p.memory?.id) ? kept.get(p.memory.id) : i;
    if (best < 0 || at > bestAt || (at === bestAt && order >= bestOrder)) {
      best = i;
      bestAt = at;
      bestOrder = order;
    }
  });
  return Math.max(0, best);
}

/* The page block under the cover, as many hairlines as the book has
   sheets (a leaf is two pages; one line per eight pages reads as paper,
   not as a count) and a thickness to match: 3 lines and 3 pt for a thin
   first book, 14 and 10 pt for a full one. */
export const BLOCK = { minLines: 3, maxLines: 14, minPt: 3, maxPt: 10, pagesPerLine: 8, leafPt: 1.5 };
export function pageBlock(pageCount) {
  const n = Math.max(0, Number(pageCount) || 0);
  const lines = Math.min(BLOCK.maxLines, Math.max(BLOCK.minLines, Math.round(n / BLOCK.pagesPerLine)));
  const share = (lines - BLOCK.minLines) / (BLOCK.maxLines - BLOCK.minLines);
  const thickness = Math.round((BLOCK.minPt + share * (BLOCK.maxPt - BLOCK.minPt)) * 10) / 10;
  return { lines, thickness };
}

/* The Book tab's one line, in the book's own terms (PHILOSOPHY §3.5,
   critique §4): "13 memories in 5 chapters. Nothing yet in When everything
   changed". No percentage, no bar, no claim about other families. `next`
   is the first chapter nothing has been told in yet (lib/bookProgress
   emptyChapters), said as empty: "Next chapter: When everything changed"
   named a chapter found in neither the contents nor Memories (FB-356).
   `chapters`, the chapters the book has, when known. With every chapter
   begun the line is the count alone. */
export function storyLine(count, next = "", chapters = 0) {
  const n = Math.max(0, Number(count) || 0);
  // "memories", the one noun the Book tab, the title page and Home use
  // (judge-investor B4).
  const head = `${n} ${n === 1 ? "memory" : "memories"}${chapters > 1 ? ` in ${chapters} chapters` : ""}`;
  const ch = String(next || "").trim();
  // A sentence, not a code (judges night r2: "· next, When everything
  // changed" left Rose asking "Next what?").
  return ch && n ? `${head}. Nothing yet in ${ch}` : head;
}

/* "The book grew by a leaf": set once by whatever keeps a memory (lane K,
   when the seal lands: noteBookLeaf(storyId)), taken once by the Book tab
   on its next visit, which thickens the block by a leaf, glints the gilt
   and turns "13 memories" into "14 memories" (hero-spec H5a). In memory
   only: a keep the app was closed after is simply there, already thicker,
   on the next launch. */
const grownLeaves = new Set();
export function noteBookLeaf(storyId) {
  if (storyId) grownLeaves.add(String(storyId));
}
export function takeBookLeaf(storyId) {
  const id = String(storyId || "");
  if (!id || !grownLeaves.has(id)) return false;
  grownLeaves.delete(id);
  return true;
}

/* "The book" line under its cover: "13 memories in 7 chapters". "From the
   family" is printed but never counted as a chapter (MASTER-PLAN §8.3 row
   36), so this agrees with "7 of 8 chapters begun" and the Archive. */
export function bookLine(book) {
  const m = book?.memories || 0;
  const c = (book?.chapters || []).filter((ch) => ch?.era !== FAMILY_CHAPTER).length;
  if (!m) return "No pages yet";
  return `${m} ${m === 1 ? "memory" : "memories"} in ${c} ${c === 1 ? "chapter" : "chapters"}`;
}

/* ── Both versions on one page (hero-spec H5b, DECISIONS H10, H11) ───── */

// The marks a page can pair a version with, in the order they are given.
export const MARKS = ["¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];

/* The family's versions of one memory, as the book prints them: the ones
   the keeper said yes to (lib/memorySides sidesFor), oldest first, each
   with its heading and its byline in the third person a printed book is
   read in: "Linh remembers it differently…", "Linh Miller, her daughter".
   The full name comes from the tree when the writer is in it. `teller` is
   the storyteller's person in the tree, for her/his/their. */
export function printedSides(memory, contributions, { people = [], teller = null } = {}) {
  return sidesFor(contributions, memory?.id).map((c) => {
    const said = String(c.contributorName || "").trim();
    // By account; a side read from a story you don't keep carries no
    // account, so then by the one first name in the tree that matches.
    const byName = said ? (people || []).filter((p) => p && p.givenName && p.givenName === said.split(/\s+/)[0]) : [];
    const person = (people || []).find((p) => p && c.userId && p.userId === c.userId) || (byName.length === 1 ? byName[0] : null);
    const full = person ? [person.givenName, person.familyName].filter(Boolean).join(" ").trim() : "";
    const name = full || said || "Someone in the family";
    const rel = String(c.relationship || "").trim().toLowerCase();
    const byline = rel ? `${name}, ${possessive(teller?.sex)} ${rel}` : name;
    return {
      id: c.id || `${memory?.id}-${said}-${c.createdAt || ""}`,
      body: String(c.body || "").trim(),
      heading: differentlyLine(c, "other"),
      byline,
      // The page's credit for a version (S-PL8): "Remembered by Linh
      // Miller, her daughter". Never merged into her words.
      credit: `Remembered by ${byline}`,
      name,
      first: name.split(/\s+/)[0],
    };
  });
}

/* Curly and straight quotes read alike when a kept line is looked for in
   the words it came from; one character for one, so positions hold. */
const flatQuotes = (s) => String(s || "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"');

/* Where her kept line sits in the words printed on her page: [start, end)
   or null. The summariser's kept line is verbatim (H3a), so it is looked
   for as it is, then without regard to case; a kept line the page doesn't
   carry word for word (a retold book) is simply not marked. */
export function keptSpan(body, keptLine) {
  const b = flatQuotes(body);
  const k = flatQuotes(keptLine).trim().replace(/^["']+|["']+$/g, "").trim();
  if (k.length < 4) return null;
  let at = b.indexOf(k);
  if (at < 0) at = b.toLowerCase().indexOf(k.toLowerCase());
  return at < 0 ? null : [at, at + k.length];
}

/* Just after the anchor word on the page, where its mark goes: its first
   time inside the kept line if it is there, else its first time at all;
   -1 when the page never says it. A possessive keeps its "'s" before the
   mark ("father's¹"). */
export function anchorEnd(body, word, span = null) {
  const t = String(body || "");
  if (!word) return -1;
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${esc})(?=[^\\p{L}\\p{N}]|$)`, "giu");
  let first = -1;
  for (const m of t.matchAll(re)) {
    let end = m.index + m[1].length + m[2].length;
    if (/^['’]s(?![\p{L}\p{N}])/u.test(t.slice(end))) end += 2;
    if (span && end > span[0] && end <= span[1]) return end;
    if (first < 0) first = end;
  }
  return first;
}

/* Her words as the page sets them: paragraphs (one per line of the body,
   as the PDF prints them), each a list of runs { text, kept, mark }. `kept`
   is the stretch the margin rule stands beside; a mark run is the
   superscript after its anchor word. */
export function proseRuns(text, kept = null, marks = []) {
  const t = String(text || "");
  const out = [];
  for (const m of t.matchAll(/[^\n]+/g)) {
    const raw = m[0];
    const s = m.index + (raw.length - raw.trimStart().length);
    const e = m.index + raw.trimEnd().length;
    if (e <= s) continue;
    const cuts = new Set([s, e]);
    if (kept) for (const k of kept) if (k > s && k < e) cuts.add(k);
    for (const k of marks) if (k.at > s && k.at <= e) cuts.add(k.at);
    const pts = [...cuts].sort((a, b) => a - b);
    const runs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const inKept = !!kept && a >= kept[0] && b <= kept[1];
      runs.push({ text: t.slice(a, b), kept: inKept, mark: false });
      const mk = marks.filter((k) => k.at === b).map((k) => k.mark).join("");
      if (mk) runs.push({ text: mk, kept: inKept && b < kept[1], mark: true });
    }
    out.push(runs);
  }
  return out;
}

/* One memory's page, worked out once for the reader and the PDF alike, so
   the screen is what prints (hero-spec H5b): her words in paragraphs with
   the kept line marked for its margin rule, and each version the keeper
   kept, paired to the word it answers by one mark (¹ after "tomatoes" and
   before "Linh remembers it differently…"). A version whose word isn't on
   the page is printed without a mark: a mark is never left unpaired. The
   kept line is marked only when the memory has one of its own (a talked
   memory); the anchor is found as the memory page finds it (keptLineOf). */
export function bookLeaf(memory, body, sides = []) {
  const text = String(body ?? memory?.body ?? "");
  const kept = memory?.keptLine ? keptSpan(text, memory.keptLine) : null;
  const keptText = keptLineOf(memory);
  const marks = [];
  const printed = (sides || []).map((s) => {
    const anchor = keptText ? anchorOf(keptText, s.body) : "";
    const at = anchor ? anchorEnd(text, anchor, kept) : -1;
    if (at < 0 || marks.length >= MARKS.length) return { ...s, mark: "", anchor: "" };
    const mark = MARKS[marks.length];
    marks.push({ at, mark });
    return { ...s, mark, anchor };
  });
  return { paragraphs: proseRuns(text, kept, marks), kept: !!kept, sides: printed };
}
