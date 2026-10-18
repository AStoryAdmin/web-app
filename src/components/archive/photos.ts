import type { Memory } from "../../data/stories";
import { ASKED, splitRunOn } from "./transcript";

/** A memory's photographs in display order: the one the family chose first. */
export function orderedPhotos(memory: Memory): string[] {
  const all = memory.photos || [];
  const cover = memory.cover && all.includes(memory.cover) ? memory.cover : all[0];
  return cover ? [cover, ...all.filter((p) => p !== cover)] : [];
}

/** The body as paragraphs: split on blank lines, single breaks kept inside one. */
export function paragraphsOf(text: string): string[] {
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** "6 minutes", "under a minute". */
export function minutesLabel(seconds: number): string {
  if (!seconds || seconds < 45) return seconds > 0 ? "under a minute" : "";
  const m = Math.max(1, Math.round(seconds / 60));
  return `${m} ${m === 1 ? "minute" : "minutes"}`;
}

/** A sentence that answers the one before it ("But then you're also…") does not start a paragraph. */
const ANSWERS_PREVIOUS = /^(?:but then|and then|but also|and also|but|and so)\b/i;

/** Break `sentences` into `n` runs of about equal length, never before a sentence that answers the one before it. */
function balance(sentences: string[], n: number): string[] {
  const total = sentences.reduce((a, x) => a + x.length, 0);
  const out: string[] = [];
  let run = "";
  let acc = 0;
  let part = 1;
  sentences.forEach((x, i) => {
    const aim = (total * part) / n;
    const next = sentences[i + 1];
    run += x;
    acc += x.length;
    // break here when this is the boundary nearest the aim and the next sentence may begin a paragraph
    const here = Math.abs(acc - aim);
    const later = next ? Math.abs(acc + next.length - aim) : Infinity;
    if (part < n && next && here <= later && !ANSWERS_PREVIOUS.test(next.trim())) {
      out.push(run.trim());
      run = "";
      part += 1;
    }
  });
  if (run.trim()) out.push(run.trim());
  return out;
}

/**
 * Paragraphs a reader can take in: a transcribed call often arrives as one
 * block of a thousand words. A block longer than `max` characters is set
 * as several paragraphs of about equal length near `target` characters,
 * broken where a sentence ends and never before a sentence that answers the
 * one before it; a stretch that runs on with no full stop at all is broken
 * before a clause word ("and then", "so", "but"), with a full stop added
 * only when `punctuate` (the tidied reading of speech, where a paragraph
 * under 120 characters also joins its neighbour; typed paragraphs keep
 * their author's breaks). The words are never changed.
 */
export function readableParagraphs(paragraphs: string[], { max = 560, target = 380, punctuate = false }: { max?: number; target?: number; punctuate?: boolean } = {}): string[] {
  const out: string[] = [];
  for (const p of paragraphs) {
    if (p.length <= max || p.includes("\n") || p.startsWith(ASKED)) {
      out.push(p);
      continue;
    }
    const sentences = (p.match(/[^.!?…]+(?:[.!?…]+["”’)\]]*|$)\s*/g) || [p]).flatMap((x) => (x.length > max ? splitRunOn(x, target, punctuate).map((y) => `${y} `) : [x]));
    out.push(...balance(sentences, Math.max(2, Math.round(p.length / target))));
  }
  // a short paragraph (a sentence on its own) joins a neighbour, unless it is a typed line, the other person's question, or would make a block too long
  const merged: string[] = [];
  for (const p of out) {
    const prev = merged[merged.length - 1];
    const plain = (x: string) => !x.includes("\n") && !x.startsWith(ASKED);
    if (punctuate && prev !== undefined && plain(p) && plain(prev) && (p.length < 120 || prev.length < 120) && prev.length + p.length <= max) merged[merged.length - 1] = `${prev} ${p}`;
    else merged.push(p);
  }
  return merged;
}

/** "Anything else" is where a memory waits for a chapter; it is not one, so no pill says it. */
export const realChapter = (era: string) => (era && era.trim().toLowerCase() !== "anything else" ? era : "");

/** Three or more lines in a row under 40 characters: a list, a poem, words kept line by line. */
export const isRunOfLines = (p: string) => {
  let run = 0;
  for (const l of p.split("\n")) {
    run = l.trim().length > 0 && l.trim().length < 40 ? run + 1 : 0;
    if (run >= 3) return true;
  }
  return false;
};

/** The book's drop cap only where it can rest: a first paragraph of 200 to 600 characters (nine lines at most), no line breaks, opening on a letter (never a one-letter word: "I specifically" would read "Ispecifically") and not on throat-clearing. */
export const takesDropCap = (p: string) =>
  !p.includes("\n") && !p.startsWith(ASKED) && p.length >= 200 && p.length <= 600 && /^[A-Za-z]/.test(p) && !/^[A-Za-z][\s,]/.test(p) && !/^(?:yeah|yes|well|so|um|uh|okay|ok|oh|like|and|but)\b/i.test(p);
