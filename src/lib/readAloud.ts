/**
 * What the browser's voice is given: the words a sentence or two at a time
 * (long utterances stop early in some browsers), each piece remembering
 * which paragraph it came from so the page can mark it.
 */
export type Chunk = { text: string; paragraph: number; words: number };

const CHUNK = 220;

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";

export function chunksOf(paragraphs: string[]): Chunk[] {
  const out: Chunk[] = [];
  paragraphs.forEach((p, paragraph) => {
    const sentences = p.replace(/\s+/g, " ").trim().split(/(?<=[.!?…][”’")]?)\s+/);
    let cur = "";
    const push = () => {
      const text = cur.trim();
      if (text) out.push({ text, paragraph, words: text.split(/\s+/).length });
      cur = "";
    };
    for (const s of sentences) {
      if (cur && cur.length + s.length + 1 > CHUNK) push();
      cur += (cur ? " " : "") + s;
    }
    push();
  });
  return out;
}
