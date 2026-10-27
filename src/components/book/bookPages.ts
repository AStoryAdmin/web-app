/**
 * The book as pages for the screen, the way astoryapp.com/samples prints
 * it: a keepsake cover, endpapers in the cover colour, the colophon facing
 * the title page, the dedication, the contents, a chapter opener with its
 * number, and every memory as a page with the chapter pill, the four marks
 * (Moment, Feeling, Meaning, Lesson), the title, the dateline, where it came
 * from, the question that was asked and who asked it, the words with a drop
 * cap, and, for a memory with a recording, the code that plays it. Then the
 * last page, the endpapers again and the back cover's dedication.
 *
 * One source of truth with the printed book: the chapters and their order
 * come from app-core's bookStructure and bookDesign (keepsakeWords,
 * keepsakePhotos, listenUrl), so what the family reads here is what arrives
 * on paper. A screen page cannot reflow like a printer's, so a memory is cut
 * into pages by a character budget. Pure, so it can be tested.
 *
 * The same page types are built from the three fictional families of the
 * samples page (buildSampleBook), so the front door shows the whole anatomy,
 * including the lines a real book only has when the data has them (a
 * summary, the deeper question, the lesson).
 */
import { bookStructure, attributionFor } from "../../app-core/lib/legacyBook.js";
import {
  normaliseDesign,
  printedChapterName,
  printedBody,
  pronounFor,
  keepsakeWords,
  keepsakePhotos,
  hasVoice,
  sidesInBook,
  effectiveCoverStyle,
  coverPhoto,
} from "../../app-core/lib/bookDesign.js";
import { memoryDate, ageLabel } from "../../app-core/lib/timeline.js";
import { FAMILY_CHAPTER } from "../../app-core/data/eras.js";
import { coverColour, materialColour, materialInks, type CoverColour } from "./coverColours";
import { archiveLink, listenLink, sampleLink } from "../../lib/qrLinks";
import { smarten } from "../../lib/typography";
import type { Memory, Story } from "../../data/stories";
import type { Contribution } from "../../data/contributions";
import type { SampleBook, SampleMemory } from "../../data/sampleBooks";

export type Side = { who: string; body: string };
/** The code block at the foot of a page: the link, the tabs line, the sentence, the recording line. */
export type Strip = { url: string; tabs: string; line: string; rec: string };
/** Where a memory came from, as the samples mark it ("Live conversation · 16 min"). */
export type Source = { kind: "live" | "little" | "family" | "written" | "memoir"; label: string };
export type Asked = { q: string; by: string };
export type Passed = [string, string];
export type ContentsEntry = { num: string; name: string; sub: string; page: number };

/** The four marks: 0 Moment, 1 Feeling, 2 Meaning, 3 Lesson. */
export const LAYERS = ["Moment", "Feeling", "Meaning", "Lesson"];

export type Page =
  | { kind: "blank"; key: string }
  | { kind: "cover"; key: string; title: string; line: string; names: string; motto: string; photos: string[]; bw: boolean; board?: Board }
  | { kind: "endpaper"; key: string }
  | { kind: "colophon"; key: string; title: string; lines: string[] }
  | { kind: "title"; key: string; t1: string; t2: string; t3: string; t4: string }
  | { kind: "dedication"; key: string; text: string; sig: string }
  | { kind: "contents"; key: string; entries: ContentsEntry[] }
  | { kind: "opener"; key: string; kicker: string; chapter: string; num: string; qlabel: string; line: string; folio: number }
  | {
      kind: "memory";
      key: string;
      memoryId: string;
      chapter: string;
      /** Only on the memory's first page. */
      title: string;
      dateline: string;
      layers: number[];
      source: Source | null;
      summary: string;
      asked: Asked | null;
      photos: string[];
      paragraphs: string[];
      /** The first paragraph opens with a drop cap. */
      drop: boolean;
      /** "Remembered by Linh, her daughter", on the last page of the memory. */
      credit: string;
      sides: Side[];
      strip: Strip | null;
      continued: boolean;
      folio: number;
    }
  | {
      kind: "deeper";
      key: string;
      memoryId: string;
      chapter: string;
      layers: number[];
      deepLabel: string;
      deepQ: string;
      deepA: string;
      lessonLabel: string;
      lesson: string;
      lessonVi: string;
      passed: Passed[];
      strip: Strip | null;
      folio: number;
    }
  | { kind: "little"; key: string; title: string; items: [string, string, string][]; note: string; url: string; folio: number }
  | { kind: "final"; key: string; text: string; url: string | null }
  | { kind: "back"; key: string; fam: string; quote: string };

/**
 * A cover in one of the material styles (Clothbound, Heirloom, Photo plate, Photo wrap), drawn as the printed book's
 * board (app-core legacyBook coverHtml): the mark, the title in foil, a rule, the line and the years, with the
 * photograph set in where the style carries one. `photo` is null for a bare board. The keepsake cover has none.
 */
export type Board = { style: string; title: string; sub: string; span: string; photo: string | null; foil: string; soft: string };

export type Spread = { left: Page | null; right: Page | null };

export type Book = {
  key: string;
  name: string;
  fullName: string;
  title: string;
  subtitle: string;
  span: string;
  memories: number;
  photos: number;
  chapters: number;
  pronoun: string;
  cover: CoverColour;
  /** The cover style chosen in the book's design ("keepsake" unless somebody chose another). */
  coverStyle: string;
  /** The paper chosen in the book's design ("classic" unless somebody chose another). */
  paper: string;
  /** The samples' families are fictional; a real book is not. */
  fictional: boolean;
  pages: Page[];
};

type Chapter = { era: string; items: Memory[]; years: string; photos: number };
type Structure = {
  name: string;
  fullName: string;
  title: string;
  subtitle: string;
  design: { cover: { title: string; color: string; tone: string }; dedication: string; narration: string; paper: string };
  span: string;
  coverSpan: string;
  chapters: Chapter[];
  memories: number;
  photos: number;
  printedOn: Date;
};
type Words = { title: string; line: string; name: string; tagline: string; backName: string; backMessage: string };

/* ── The character budget of a page ─────────────────────────────────── */
/** A plain page of the samples' body type holds about this many characters; the pieces above it eat into that. */
const BUDGET = 1500;
const COST_HEAD = 280; // pill, marks, title, dateline
const COST_ASK = 160;
const COST_SOURCE = 40;
const COST_SUMMARY = 320;
const COST_PHOTO_ONE = 650;
const COST_PHOTO_MANY = 520;
const COST_STRIP = 420;
const COST_SIDE = 170;

function paragraphsOf(body: string): string[] {
  return String(body || "")
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Cuts one paragraph at a sentence end near `room`, so a page never ends mid-word. */
function splitParagraph(text: string, room: number): [string, string] {
  if (text.length <= room) return [text, ""];
  const slice = text.slice(0, room);
  let cut = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("! "), slice.lastIndexOf("? "));
  if (cut < room * 0.4) cut = slice.lastIndexOf(" ");
  if (cut <= 0) cut = room;
  return [text.slice(0, cut + 1).trim(), text.slice(cut + 1).trim()];
}

const WORDS = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
const chapterWord = (n: number) => (n <= WORDS.length ? `Chapter ${WORDS[n - 1]}` : `Chapter ${n}`);
const two = (n: number) => String(n).padStart(2, "0");

const SHORT_DATE: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
const fmtShort = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", SHORT_DATE);
};
const fmtMonth = (d: Date) => d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
export const fmtLong = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** "1966 · age 6", as the samples set the dateline; the period as typed when there is no year. */
export function datelineOf(story: Story, memory: Memory): string {
  const { text, year, dated } = memoryDate(memory) as { text: string; year: number | null; dated: boolean };
  const when = (text || "").trim();
  if (!dated || year == null) return when;
  const age = (ageLabel(story, year) as string) || "";
  return age ? `${when} · ${age}` : when;
}

/** Minutes of their voice on a memory, at least one when there is any. */
export function voiceMinutes(memory: Memory): number {
  const secs = (memory.audio || []).reduce((s, c) => s + (Number(c.duration) || 0), 0);
  return secs > 0 ? Math.max(1, Math.round(secs / 60)) : 0;
}

/** Where a memory came from, from what the data says; nothing is guessed. */
export function sourceOf(story: Story, memory: Memory): Source | null {
  if (hasVoice(memory)) return { kind: "live", label: `Live conversation · ${voiceMinutes(memory)} min` };
  if (memory.source === "memoir") return { kind: "memoir", label: `From ${story.name}’s memoir` };
  if (memory.contributor) return { kind: "family", label: "From the family" };
  return null;
}

/** The family's additions to one memory: approved context, oldest first. */
export function sidesFor(contributions: Contribution[], memoryId: string): Side[] {
  return contributions
    .filter((c) => c.memoryId === memoryId && c.status === "approved" && (c.kind || "testimonial") === "testimonial" && c.body.trim())
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((c) => ({ who: [c.contributorName, c.relationship].filter(Boolean).join(", "), body: smarten(c.body.trim()) }));
}

function stripFor(story: Story, memory: Memory): Strip | null {
  const url = listenLink(story, memory);
  if (!url) return null;
  const mins = voiceMinutes(memory);
  const when = fmtShort(memory.createdAt);
  return {
    url,
    tabs: "Voice recording",
    line: `Scan with a phone camera to hear ${story.name || "them"} tell this.`,
    rec: `Recorded${when ? ` ${when}` : ""}${mins ? ` · ${mins} min` : ""}`,
  };
}

type MemoryHead = { chapter: string; title: string; dateline: string; source: Source | null; summary: string; asked: Asked | null; photos: string[] };

/** A memory as one or more pages: the head on the first, the code and the family's additions on the last. */
function memoryPages(id: string, head: MemoryHead, paras: string[], credit: string, sides: Side[], strip: Strip | null): Page[] {
  const pages: Page[] = [];
  const queue = [...paras];
  let first = true;
  let n = 0;
  while (first || queue.length) {
    let room = BUDGET;
    if (first) {
      room -= COST_HEAD;
      if (head.asked) room -= COST_ASK;
      if (head.source) room -= COST_SOURCE;
      if (head.summary) room -= COST_SUMMARY;
      room -= head.photos.length === 1 ? COST_PHOTO_ONE : head.photos.length > 1 ? COST_PHOTO_MANY : 0;
    }
    const taken: string[] = [];
    while (queue.length) {
      const next = queue[0];
      if (next.length <= room) {
        taken.push(next);
        room -= next.length + 40;
        queue.shift();
        if (room <= 120) break;
      } else {
        if (room > 300) {
          const [headPart, tail] = splitParagraph(next, room);
          if (headPart) {
            taken.push(headPart);
            queue[0] = tail;
            if (!tail) queue.shift();
          }
        }
        break;
      }
    }
    const last = queue.length === 0;
    pages.push({
      kind: "memory",
      key: `m-${id}-${n}`,
      memoryId: id,
      chapter: head.chapter,
      title: first ? head.title : "",
      dateline: first ? head.dateline : "",
      layers: first ? [0, 1] : [],
      source: first ? head.source : null,
      summary: first ? head.summary : "",
      asked: first ? head.asked : null,
      photos: first ? head.photos : [],
      paragraphs: taken,
      drop: first,
      credit: last ? credit : "",
      sides: last ? sides : [],
      strip: last ? strip : null,
      continued: !first,
      folio: 0,
    });
    first = false;
    n += 1;
    if (n > 40) break; // a runaway body never hangs the page
  }

  // The code and the family's additions may not fit on the last page; give them their own.
  const tail = pages[pages.length - 1];
  if (tail.kind === "memory" && (tail.sides.length || tail.strip)) {
    const used =
      tail.paragraphs.reduce((s, p) => s + p.length + 40, 0) +
      (tail.title ? COST_HEAD : 0) +
      (tail.asked ? COST_ASK : 0) +
      (tail.summary ? COST_SUMMARY : 0) +
      (tail.photos.length ? COST_PHOTO_MANY : 0);
    const need = tail.sides.reduce((s, x) => s + x.body.length + COST_SIDE, 0) + (tail.strip ? COST_STRIP : 0);
    if (used + need > BUDGET) {
      const { sides, strip } = tail;
      tail.sides = [];
      tail.strip = null;
      pages.push({ ...tail, key: `${tail.key}-tail`, title: "", dateline: "", layers: [], source: null, summary: "", asked: null, photos: [], paragraphs: [], drop: false, credit: "", sides, strip, continued: true });
    }
  }
  return pages;
}

/* ── Assembling the volume ───────────────────────────────────────────── */

/** Pages as facing pairs: the cover sits alone on the right, as a book opens; the back cover alone on the left. */
export function spreadsOf(pages: Page[]): Spread[] {
  if (!pages.length) return [];
  const out: Spread[] = [{ left: null, right: pages[0] }];
  for (let i = 1; i < pages.length; i += 2) out.push({ left: pages[i], right: pages[i + 1] ?? null });
  return out;
}

/** The spread that holds a page. */
export const spreadOfPage = (index: number): number => (index === 0 ? 0 : Math.ceil(index / 2));

/**
 * Front matter, body, end matter, as one volume: the folios are written,
 * the contents gets its page numbers, and a blank is slipped in before the
 * closing endpapers when the count is odd, so the back cover closes alone.
 * The numbering is the samples': the second endpaper is page 1.
 */
function assemble(front: Page[], body: Page[], contents: ContentsEntry[], end: Page[]): Page[] {
  const contentsPage: Page = { kind: "contents", key: "contents", entries: contents };
  const pages: Page[] = [front[0], { kind: "endpaper", key: "ep-1" }, { kind: "endpaper", key: "ep-2" }, ...front.slice(1), contentsPage];
  const start = pages.length;
  body.forEach((p, i) => {
    if (p.kind === "opener" || p.kind === "memory" || p.kind === "deeper" || p.kind === "little") p.folio = start + i - 1;
  });
  for (const e of contents) e.page += start - 2;
  pages.push(...body);
  const closing: Page[] = [...end.slice(0, -1), { kind: "endpaper", key: "ep-3" }, { kind: "endpaper", key: "ep-4" }, end[end.length - 1]];
  if ((pages.length + closing.length) % 2 === 1) pages.push({ kind: "blank", key: "pad" });
  pages.push(...closing);
  return pages;
}

/**
 * Every page of a family's book, in order. `asked` is the question a
 * relative sent in and who sent it, by memory id (family_questions), for
 * the memories that answered one. `recordedBy` is the account holder, who
 * is named in the colophon.
 */
export function buildBook(
  story: Story,
  { contributions = [], recordedBy = "", asked = {}, now = new Date() }: { contributions?: Contribution[]; recordedBy?: string; asked?: Record<string, Asked>; now?: Date } = {},
): Book {
  const s = bookStructure(story, { now }) as unknown as Structure;
  const design = normaliseDesign(story.bookDesign) as Structure["design"];
  // the words a person typed for the book (its title, the motto, the back) are set like everything else they wrote
  const raw = keepsakeWords(design, s, story) as Words;
  const w: Words = { ...raw, title: smarten(raw.title), line: smarten(raw.line), tagline: smarten(raw.tagline), backMessage: smarten(raw.backMessage) };
  const her = pronounFor(story, design) as string;
  const possessive = her === "he" ? "his" : her === "she" ? "her" : "their";
  const style = effectiveCoverStyle(design) as string;
  const cover = materialColour(style) || coverColour(design.cover.color);
  const inks = materialInks(style);
  const board: Board | undefined = inks
    ? { style, title: smarten(s.title), sub: smarten(s.subtitle), span: s.coverSpan, photo: (coverPhoto(design) as string | null) || null, ...inks }
    : undefined;
  const allMemories = s.chapters.flatMap((c) => c.items);

  const front: Page[] = [
    { kind: "cover", key: "cover", title: w.title, line: w.line, names: w.name, motto: w.tagline, photos: keepsakePhotos(design, story) as string[], bw: design.cover.tone !== "colour", ...(board ? { board } : {}) },
    { kind: "colophon", key: "colophon", title: w.title, lines: colophonLines(story, s, design, possessive, recordedBy, allMemories) },
    { kind: "title", key: "title", t1: w.title, t2: `The life of ${s.fullName}`, t3: titleLine(s, design, possessive), t4: story.birthYear ? `born ${story.birthYear}` : s.coverSpan },
  ];
  if (design.dedication) front.push({ kind: "dedication", key: "dedication", text: smarten(design.dedication), sig: "" });

  const body: Page[] = [];
  const contents: ContentsEntry[] = [];
  s.chapters.forEach((c, i) => {
    const chapter = printedChapterName(c.era) as string;
    const titles = c.items.map((m) => smarten((m.title || "").trim())).filter(Boolean);
    const line = titles.length ? titles.slice(0, 3).join(" · ") + (titles.length > 3 ? ` and ${titles.length - 3} more` : "") : `${c.items.length} ${c.items.length === 1 ? "memory" : "memories"}`;
    contents.push({ num: two(i + 1), name: chapter, sub: c.years, page: body.length + 1 });
    body.push({ kind: "opener", key: `c-${c.era}`, kicker: c.era === FAMILY_CHAPTER ? "In their own words" : chapterWord(i + 1), chapter, num: two(i + 1), qlabel: "In this chapter", line, folio: 0 });
    for (const m of c.items) {
      const head: MemoryHead = {
        chapter,
        title: smarten((m.title || "").trim()),
        dateline: datelineOf(story, m),
        source: sourceOf(story, m),
        summary: "",
        asked: asked[m.id] ? { ...asked[m.id], q: smarten(asked[m.id].q) } : null,
        photos: Array.isArray(m.photos) ? m.photos.filter(Boolean) : [],
      };
      body.push(...memoryPages(m.id, head, paragraphsOf(printedBody(design, m) as string).map(smarten), (attributionFor(m) as string | null) || "", sidesFor(sidesInBook(design, m, contributions) as Contribution[], m.id), stripFor(story, m)));
    }
  });

  const end: Page[] = [
    { kind: "final", key: "final", text: `This book is one edition. ${s.name}’s archive keeps every memory and recording, and the family can keep adding to it.`, url: archiveLink() },
    { kind: "back", key: "back", fam: w.backName, quote: w.backMessage },
  ];

  return {
    key: story.id,
    name: s.name,
    fullName: s.fullName,
    title: w.title,
    subtitle: smarten(s.subtitle),
    span: s.span,
    memories: s.memories,
    photos: s.photos,
    chapters: s.chapters.length,
    pronoun: her,
    cover,
    coverStyle: style,
    paper: design.paper,
    fictional: false,
    pages: assemble(front, body, contents, end),
  };
}

function titleLine(s: Structure, design: Structure["design"], possessive: string): string {
  if (design.narration === "third") return "A life, as a story";
  const sub = s.subtitle.trim();
  return /^a life, in their words$/i.test(sub) ? `A life, in ${possessive} own words` : sub;
}

function colophonLines(story: Story, s: Structure, design: Structure["design"], possessive: string, recordedBy: string, memories: Memory[]): string[] {
  const lines: string[] = [];
  lines.push(design.narration === "third" ? `The life of ${s.fullName}, told as a story.` : `The life of ${s.fullName}, in ${possessive} own words.`);
  const dates = memories.map((m) => new Date(m.createdAt)).filter((d) => !isNaN(d.getTime())).sort((a, b) => a.getTime() - b.getTime());
  if (dates.length) {
    const a = fmtMonth(dates[0]);
    const b = fmtMonth(dates[dates.length - 1]);
    const voiced = memories.filter((m) => hasVoice(m)).length;
    const parts = [`${s.memories} ${s.memories === 1 ? "memory" : "memories"}`];
    if (voiced) parts.push(`${voiced} of them in ${possessive} own voice`);
    if (s.photos) parts.push(`${s.photos} ${s.photos === 1 ? "photograph" : "photographs"}`);
    lines.push(`${a === b ? `Gathered in ${a}` : `Gathered between ${a} and ${b}`}: ${parts.join(", ")}.`);
  }
  if (recordedBy) lines.push(`Recorded by ${recordedBy}.`);
  lines.push(`This book is private to the ${story.lastName ? `${story.lastName} family` : "family"}.`);
  lines.push("Shaped, designed and printed by A Story.");
  lines.push(`Made ${fmtLong(s.printedOn)}.`);
  return lines;
}

/* ── The samples' three families ──────────────────────────────────────── */

function sampleStrip(book: SampleBook, m: SampleMemory): Strip {
  return {
    url: sampleLink(book.key),
    tabs: `${m.video ? "Video · " : ""}Full transcript · Voice highlight`,
    line: m.video ? `Scan to watch ${book.name} tell this story.` : `Scan to read the whole conversation and hear ${book.name} tell it.`,
    rec: `Recorded ${m.rec} · ${m.mins} min`,
  };
}

/** One of the samples' books, in the cover colour chosen (its own unless told otherwise). */
export function buildSampleBook(book: SampleBook, colour: string = book.coverColor): Book {
  const front: Page[] = [
    { kind: "cover", key: "cover", title: book.cover.title, line: book.cover.line, names: book.cover.names, motto: book.cover.motto, photos: [], bw: true },
    { kind: "colophon", key: "colophon", title: book.colophon.title, lines: book.colophon.lines },
    { kind: "title", key: "title", ...book.title },
    { kind: "dedication", key: "dedication", ...book.dedication },
  ];

  // Chapters in the order the memories first mention them.
  const chapters: string[] = [];
  for (const m of book.memories) if (!chapters.includes(m.ch)) chapters.push(m.ch);

  const body: Page[] = [];
  const contents: ContentsEntry[] = [];
  const littleUrl = sampleLink(book.key);
  chapters.forEach((ch, i) => {
    const entry = book.contents.find((e) => e.name === ch);
    const num = entry?.num || two(i + 1);
    contents.push({ num, name: ch, sub: entry?.sub || "", page: body.length + 1 });
    const opener = book.openers[ch];
    if (opener) body.push({ kind: "opener", key: `c-${ch}`, kicker: opener[0], chapter: ch, num, qlabel: opener[1], line: opener[2], folio: 0 });
    if (i === 0) body.push({ kind: "little", key: "little-1", title: book.little.title1, items: book.little.items.slice(0, 6), note: book.little.note1, url: littleUrl, folio: 0 });
    for (const m of book.memories.filter((x) => x.ch === ch)) {
      const head: MemoryHead = {
        chapter: ch,
        title: m.title,
        dateline: m.meta,
        source: { kind: "live", label: `Live conversation · ${m.mins} min` },
        summary: m.summary,
        asked: { q: m.q, by: m.asked },
        photos: [],
      };
      // The samples set a story on one page, however long; it is never cut.
      body.push({ kind: "memory", key: `m-${m.id}`, memoryId: m.id, chapter: ch, title: head.title, dateline: head.dateline, layers: [0, 1], source: head.source, summary: head.summary, asked: head.asked, photos: [], paragraphs: m.story, drop: true, credit: "", sides: [], strip: null, continued: false, folio: 0 });
      body.push({
        kind: "deeper",
        key: `d-${m.id}`,
        memoryId: m.id,
        chapter: ch,
        layers: [2, 3],
        deepLabel: m.deepQ ? (book.third ? "Maya asked" : "We asked") : "",
        deepQ: m.deepQ || "",
        deepA: m.deepA ? (book.third ? `“${m.deepA}”` : m.deepA) : "",
        lessonLabel: `The lesson ${book.pronoun} carries`,
        lesson: m.lesson,
        lessonVi: m.lessonVi || "",
        passed: m.passed,
        strip: sampleStrip(book, m),
        folio: 0,
      });
    }
  });
  body.push({ kind: "little", key: "little-2", title: book.little.title2, items: book.little.items.slice(6, 12), note: book.little.note2, url: littleUrl, folio: 0 });

  const end: Page[] = [
    { kind: "final", key: "final", text: book.final, url: littleUrl },
    { kind: "back", key: "back", fam: book.back.fam, quote: book.back.quote },
  ];

  return {
    key: book.key,
    name: book.name,
    fullName: book.full,
    title: book.colophon.title,
    subtitle: book.subtitle,
    span: "",
    memories: book.memories.length,
    photos: 0,
    chapters: chapters.length,
    pronoun: book.pronoun,
    cover: coverColour(colour),
    coverStyle: "keepsake",
    paper: "classic",
    fictional: true,
    pages: assemble(front, body, contents, end),
  };
}

/* ── Words ───────────────────────────────────────────────────────────── */

/** What a page says, for the voice that reads it: the lines in reading order. */
export function pageText(page: Page | null): string[] {
  if (!page) return [];
  switch (page.kind) {
    case "blank":
    case "endpaper":
      return [];
    case "cover":
      return [page.title, page.line, page.names, page.motto];
    case "colophon":
      return [page.title, ...page.lines];
    case "title":
      return [page.t1, page.t2, page.t3, page.t4];
    case "dedication":
      return [page.text, page.sig];
    case "contents":
      return ["Contents", ...page.entries.map((e) => `${e.num ? `${e.num}. ` : ""}${e.name}${e.sub ? `, ${e.sub}` : ""}, page ${e.page}`)];
    case "opener":
      return [page.kicker, page.chapter, page.qlabel, page.line];
    case "memory":
      return [
        page.title ? page.chapter : "",
        page.title,
        page.dateline,
        page.source?.label || "",
        page.summary ? `Summary. ${page.summary}` : "",
        page.asked ? `The question: ${page.asked.q} Asked by ${page.asked.by}.` : "",
        ...page.paragraphs,
        page.credit,
        ...page.sides.flatMap((s) => [s.body, s.who]),
        page.strip?.line || "",
      ];
    case "deeper":
      return [page.deepLabel, page.deepQ, page.deepA, page.lessonLabel, page.lesson, page.lessonVi, ...page.passed.map(([a, b]) => `${a}. ${b}`), page.strip?.line || ""];
    case "little":
      return [page.title, ...page.items.map(([d, q, a]) => `${d}. ${q} ${a}`), page.note];
    case "final":
      return ["A Story. Where life becomes legacy.", page.text];
    case "back":
      return ["Dedicated to", page.fam, page.quote];
  }
}

/** "14 memories · 6 chapters · 1945–2011" */
export function bookLine(book: Book): string {
  const parts = [`${book.memories} ${book.memories === 1 ? "memory" : "memories"}`, `${book.chapters} ${book.chapters === 1 ? "chapter" : "chapters"}`];
  if (book.span) parts.push(book.span);
  return parts.join(" · ");
}
