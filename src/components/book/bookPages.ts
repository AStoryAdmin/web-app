/**
 * The book as pages for the screen. One source of truth with the printed
 * book: the chapters and their order come from app-core's bookStructure,
 * the dateline and the credit line from the same functions the print HTML
 * uses, so what the family reads on screen is what arrives on paper.
 *
 * A screen page cannot reflow like a printer's, so a memory is cut into
 * pages here by a character budget: a plain page of 17px serif on a 500px
 * leaf holds about 1,400 characters; a title, a photograph or the family's
 * additions each take some of that. Pure, so it can be tested.
 */
import { bookStructure, datelineFor, attributionFor } from "../../app-core/lib/legacyBook.js";
import { printedChapterName, printedBody, pronounFor } from "../../app-core/lib/bookDesign.js";
import { FAMILY_CHAPTER } from "../../app-core/data/eras.js";
import type { Memory, Story } from "../../data/stories";
import type { Contribution } from "../../data/contributions";

export type Side = { who: string; body: string };

export type Page =
  | { kind: "blank"; key: string }
  | { kind: "cover"; key: string; title: string; name: string; span: string }
  | { kind: "title"; key: string; title: string; subtitle: string; span: string; recordedBy: string }
  | { kind: "contents"; key: string; entries: { chapter: string; count: number; page: number }[] }
  | { kind: "chapter"; key: string; eyebrow: string; chapter: string; years: string; count: number }
  | {
      kind: "memory";
      key: string;
      memoryId: string;
      chapter: string;
      /** Only on the memory's first page. */
      title: string;
      dateline: string;
      photos: string[];
      paragraphs: string[];
      /** "Remembered by Linh, her daughter", on the last page of the memory. */
      credit: string;
      sides: Side[];
      continued: boolean;
    }
  | { kind: "colophon"; key: string; memories: number; photos: number; span: string; printedOn: Date };

export type Spread = { left: Page | null; right: Page | null };

export type Book = {
  name: string;
  fullName: string;
  title: string;
  subtitle: string;
  span: string;
  memories: number;
  photos: number;
  chapters: number;
  pronoun: string;
  pages: Page[];
};

type Chapter = { era: string; items: Memory[]; years: string; photos: number };
type Structure = {
  name: string;
  fullName: string;
  title: string;
  subtitle: string;
  design: { cover: { title: string } };
  span: string;
  coverSpan: string;
  chapters: Chapter[];
  memories: number;
  photos: number;
  printedOn: Date;
};

/** How much text a page holds, in characters, and what eats into it. */
const BUDGET = 1400;
const COST_TITLE = 220;
const COST_PHOTO_ONE = 650;
const COST_PHOTO_MANY = 520;
const COST_SIDE = 160;

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

/** The family's additions to one memory: approved context, oldest first. */
export function sidesFor(contributions: Contribution[], memoryId: string): Side[] {
  return contributions
    .filter((c) => c.memoryId === memoryId && c.status === "approved" && (c.kind || "testimonial") === "testimonial" && c.body.trim())
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((c) => ({ who: [c.contributorName, c.relationship].filter(Boolean).join(", "), body: c.body.trim() }));
}

function memoryPages(story: Story, memory: Memory, chapter: string, design: unknown, sides: Side[]): Page[] {
  const title = (memory.title || "").trim();
  const dateline = datelineFor(story, memory) as string;
  const credit = (attributionFor(memory) as string | null) || "";
  const photos = Array.isArray(memory.photos) ? memory.photos.filter(Boolean) : [];
  const paras = paragraphsOf(printedBody(design, memory) as string);

  const pages: Page[] = [];
  const queue = [...paras];
  let first = true;
  let n = 0;
  while (first || queue.length) {
    let room = BUDGET;
    if (first) {
      room -= title || dateline ? COST_TITLE : 0;
      room -= photos.length === 1 ? COST_PHOTO_ONE : photos.length > 1 ? COST_PHOTO_MANY : 0;
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
        // A paragraph longer than the room left: take the part that fits.
        if (room > 300) {
          const [head, tail] = splitParagraph(next, room);
          if (head) {
            taken.push(head);
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
      key: `m-${memory.id}-${n}`,
      memoryId: memory.id,
      chapter,
      title: first ? title : "",
      dateline: first ? dateline : "",
      photos: first ? photos : [],
      paragraphs: taken,
      credit: last ? credit : "",
      sides: last ? sides : [],
      continued: !first,
    });
    first = false;
    n += 1;
    if (n > 40) break; // a runaway body never hangs the page
  }

  // The family's additions may not fit on the memory's last page; give them their own.
  const tail = pages[pages.length - 1];
  if (tail.kind === "memory" && tail.sides.length) {
    const used = tail.paragraphs.reduce((s, p) => s + p.length + 40, 0) + (tail.title ? COST_TITLE : 0) + (tail.photos.length ? COST_PHOTO_MANY : 0);
    const need = tail.sides.reduce((s, x) => s + x.body.length + COST_SIDE, 0);
    if (used + need > BUDGET) {
      const sides = tail.sides;
      tail.sides = [];
      pages.push({ ...tail, key: `${tail.key}-sides`, title: "", dateline: "", photos: [], paragraphs: [], credit: "", sides, continued: true });
    }
  }
  return pages;
}

/**
 * Every page of the book, in order: the cover alone, then the title page,
 * the contents, each chapter's opener and its memories, the colophon.
 * `recordedBy` is the account holder, as on the printed title page.
 */
export function buildBook(story: Story, { contributions = [], recordedBy = "", now = new Date() }: { contributions?: Contribution[]; recordedBy?: string; now?: Date } = {}): Book {
  const s = bookStructure(story, { now }) as unknown as Structure;
  const design = s.design;
  const pages: Page[] = [];

  pages.push({ kind: "cover", key: "cover", title: s.title, name: s.fullName, span: s.coverSpan });
  pages.push({ kind: "title", key: "title", title: s.title, subtitle: s.subtitle, span: s.coverSpan, recordedBy });

  // The contents page needs page numbers, so the chapters are laid out first.
  const body: Page[] = [];
  const entries: { chapter: string; count: number; page: number }[] = [];
  // Page numbers: the cover is unnumbered; the title page is 1.
  const firstBodyPage = 3; // title=1, contents=2
  for (const c of s.chapters) {
    const chapter = printedChapterName(c.era) as string;
    entries.push({ chapter, count: c.items.length, page: firstBodyPage + body.length });
    body.push({ kind: "chapter", key: `c-${c.era}`, eyebrow: c.era === FAMILY_CHAPTER ? "In their own words" : "Chapter", chapter, years: c.years, count: c.items.length });
    for (const m of c.items) body.push(...memoryPages(story, m, chapter, design, sidesFor(contributions, m.id)));
  }
  pages.push({ kind: "contents", key: "contents", entries });
  pages.push(...body);
  pages.push({ kind: "colophon", key: "colophon", memories: s.memories, photos: s.photos, span: s.span, printedOn: s.printedOn });

  return {
    name: s.name,
    fullName: s.fullName,
    title: s.title,
    subtitle: s.subtitle,
    span: s.span,
    memories: s.memories,
    photos: s.photos,
    chapters: s.chapters.length,
    pronoun: pronounFor(story, design) as string,
    pages,
  };
}

/** Pages as facing pairs: the cover sits alone on the right, as a book opens. */
export function spreadsOf(pages: Page[]): Spread[] {
  if (!pages.length) return [];
  const out: Spread[] = [{ left: null, right: pages[0] }];
  for (let i = 1; i < pages.length; i += 2) out.push({ left: pages[i], right: pages[i + 1] ?? null });
  return out;
}

/** The printed page number for a page index (the cover has none). */
export const pageNumber = (index: number): number | null => (index === 0 ? null : index);

/** The spread that holds a page. */
export const spreadOfPage = (index: number): number => (index === 0 ? 0 : Math.ceil(index / 2));

/** "14 memories · 6 chapters · 1945–2011" */
export function bookLine(book: Book): string {
  const parts = [`${book.memories} ${book.memories === 1 ? "memory" : "memories"}`, `${book.chapters} ${book.chapters === 1 ? "chapter" : "chapters"}`];
  if (book.span) parts.push(book.span);
  return parts.join(" · ");
}
