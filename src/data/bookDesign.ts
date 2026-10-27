/**
 * Designing the book: the family's choices for the printed book (title and
 * line, dedication, cover style and colour, paper, the order of the chapters,
 * which memories go in), kept on the story as stories.book_design.
 *
 * The rules are app-core bookDesign.js's, the phone's own; this file only
 * gives them types and the few steps the web page needs. The design is saved
 * as the phone saves it (BookDesignScreen save, BookContents save): the whole
 * normalised design on the story, written by saveStory with the rest of the
 * row. Only the choices the page offers are laid over the design as it is
 * saved now (designOver), so a key the web page never shows (the listening
 * key, the retold text, the cover photographs, the family's sides) goes back
 * as it stands, even one written while the page was open.
 *
 * Text is never normalised while it is typed (normaliseDesign trims, which
 * would eat the space between two words): the draft holds what was typed,
 * and it is normalised on the way out, and to tell whether anything changed.
 */
import {
  bookState,
  bookStateLine,
  chapterSequence,
  holdBack,
  letBack,
  normaliseDesign,
  printedChapterName,
  toggleMemory,
} from "../app-core/lib/bookDesign.js";
import { bookStructure } from "../app-core/lib/legacyBook.js";
import type { Memory, Story } from "./stories";

export type BookCover = {
  style: string;
  color: string;
  photos: string[];
  tone: string;
  tagline: string;
  backName: string;
  backMessage: string;
  photo: string | null;
  noPhoto: boolean;
  title: string;
  subtitle: string;
};

/** normaliseDesign's shape (app-core bookDesign.js), every key always there. */
export type BookDesign = {
  version: number;
  cover: BookCover;
  paper: string;
  chapterOrder: string[];
  excluded: string[];
  included: string[];
  heldBack: string[];
  familySides: boolean;
  sidesOut: string[];
  dedication: string;
  narration: string;
  pronoun: string;
  retold: Record<string, { h: string; body: string }>;
  arrangement: string;
  qr: boolean;
  listenKey: string;
};

/** What bookState says about one memory: in the book, or why not ("teller", "private", "left"). */
export type BookState = { in: boolean; why: "" | "teller" | "private" | "left" };

/** A chapter as the page lists it: its era (the key the order is kept by), its printed name, every kept memory in it. */
export type DesignChapter = { era: string; name: string; items: Memory[] };

/** The design a story has, complete: A Story's pick for every choice nobody has made. */
export const designOf = (story: Pick<Story, "bookDesign"> | null | undefined): BookDesign => normaliseDesign(story?.bookDesign) as BookDesign;

/** The design as it is saved: trimmed, clipped and stripped of anything unknown. */
export const cleanDesign = (design: BookDesign): BookDesign => normaliseDesign(design) as BookDesign;

/** The choices /book/design offers, cleaned: the rest of a design belongs to other screens. */
export function choicesOf(design: BookDesign) {
  const d = cleanDesign(design);
  const { style, color, photo, title, subtitle } = d.cover;
  return { cover: { style, color, photo, title, subtitle }, paper: d.paper, dedication: d.dedication, chapterOrder: d.chapterOrder, excluded: d.excluded, included: d.included, heldBack: d.heldBack };
}

/** The page's choices laid over the design as it is saved now, so nothing written meanwhile is lost. */
export function designOver(saved: BookDesign, draft: BookDesign): BookDesign {
  const c = choicesOf(draft);
  return { ...saved, ...c, cover: { ...saved.cover, ...c.cover } };
}

/** Whether two designs would save the same choices (a space typed at the end is no change). */
export const sameDesign = (a: BookDesign, b: BookDesign): boolean => JSON.stringify(choicesOf(a)) === JSON.stringify(choicesOf(b));

/** The story with its design, ready for updateStory (the phone's `s.bookDesign = next`). */
export const withDesign = (story: Story, design: BookDesign): Story => ({ ...story, bookDesign: cleanDesign(design) });

/** One change to the cover's words or look, kept as typed. */
export const patchCover = (design: BookDesign, patch: Partial<BookCover>): BookDesign => ({ ...design, cover: { ...design.cover, ...patch } });

/**
 * Every kept memory, chapter by chapter, in the order the book prints them, the ones out of the book included so
 * they can be put back (the phone's `bookStructure(story, { design, everything: true })`). Drafts are not listed:
 * they never print.
 */
export function designChapters(story: Story, design: BookDesign): DesignChapter[] {
  const s = bookStructure(story, { design, everything: true }) as unknown as { chapters: { era: string; items: Memory[] }[] };
  return s.chapters.map((c) => ({ era: c.era, name: printedChapterName(c.era) as string, items: c.items }));
}

/** Whether the chapters can be put in another order: a book set by year (chosen on the phone) follows the calendar. */
export const ordersByChapter = (design: BookDesign): boolean => cleanDesign(design).arrangement === "chapters";

/**
 * One chapter a step earlier (-1) or later (+1) among the chapters shown, the phone's moveVisible: moving past a
 * chapter with nothing in it would look as if nothing happened, so the step is to the next chapter on the list. The
 * whole sequence is kept, so the order somebody sees is the order that prints.
 */
export function moveChapter(design: BookDesign, shown: string[], era: string, step: -1 | 1): BookDesign {
  const i = shown.indexOf(era);
  const j = i + step;
  if (i < 0 || j < 0 || j >= shown.length) return design;
  const seq = chapterSequence(design) as string[];
  const a = seq.indexOf(era);
  const b = seq.indexOf(shown[j]);
  if (a < 0 || b < 0) return design;
  [seq[a], seq[b]] = [seq[b], seq[a]];
  return { ...design, chapterOrder: seq };
}

export const stateOf = (design: BookDesign, memory: Memory): BookState => bookState(design, memory) as BookState;

/**
 * A press on a memory's In or Out (the phone's BookContents press). The storyteller's press is their own say: out of
 * the book, and only they put it back. Anyone else's is a keeper's switch, on everything but what the storyteller
 * kept out. Only the three lists change, so words being typed elsewhere on the page are left as they are.
 */
export function pressMemory(design: BookDesign, memory: Memory, asStoryteller: boolean): BookDesign {
  const state = stateOf(design, memory);
  let next: BookDesign;
  if (asStoryteller) next = (state.why === "teller" ? letBack(design, memory.id) : holdBack(design, memory.id)) as BookDesign;
  else if (state.why === "teller") return design;
  else next = toggleMemory(design, memory) as BookDesign;
  return { ...design, excluded: next.excluded, included: next.included, heldBack: next.heldBack };
}

/** Whether the press does anything: a keeper can't undo the storyteller's "Not for the book". */
export const memoryLocked = (design: BookDesign, memory: Memory, asStoryteller: boolean): boolean =>
  !asStoryteller && stateOf(design, memory).why === "teller";

/** The words beside a memory's In or Out: why it is out, or nothing. */
export function memoryWhy(design: BookDesign, memory: Memory, asStoryteller: boolean, tellerName: string): string {
  const state = stateOf(design, memory);
  if (asStoryteller && state.why === "teller") return "You kept this out";
  return bookStateLine(state, tellerName) as string;
}

/** How many of a chapter's memories are in the book. */
export const inBookCount = (design: BookDesign, items: Memory[]): number => items.filter((m) => stateOf(design, m).in).length;
