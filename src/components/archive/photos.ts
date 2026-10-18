import type { Memory } from "../../data/stories";

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

/**
 * Paragraphs a reader can take in: a transcribed call often arrives as one
 * block of a thousand words. A block longer than `max` characters is set
 * as several paragraphs, broken only where a sentence ends, each about
 * `target` characters. The words are never changed; only where the
 * paragraph breaks fall.
 */
export function readableParagraphs(paragraphs: string[], { max = 560, target = 380 }: { max?: number; target?: number } = {}): string[] {
  const out: string[] = [];
  for (const p of paragraphs) {
    if (p.length <= max || p.includes("\n")) {
      out.push(p);
      continue;
    }
    const sentences = p.match(/[^.!?…]+(?:[.!?…]+["”’)\]]*|$)\s*/g) || [p];
    let run = "";
    for (const s of sentences) {
      run += s;
      if (run.length >= target) {
        out.push(run.trim());
        run = "";
      }
    }
    const rest = run.trim();
    if (rest) {
      // a short tail joins the paragraph before it rather than standing alone
      if (rest.length < 140 && out.length) out[out.length - 1] = `${out[out.length - 1]} ${rest}`;
      else out.push(rest);
    }
  }
  return out;
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

/** The book's drop cap only where it can rest: a first paragraph of 200 characters or more, no line breaks, opening on a letter. */
export const takesDropCap = (p: string) => !p.includes("\n") && p.length >= 200 && /^[A-Za-z]/.test(p);
