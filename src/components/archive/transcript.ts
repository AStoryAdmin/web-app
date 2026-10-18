/**
 * The house transcript style (docs/research/reading-2026.md §3.5): words
 * that came from a call are set as a clean transcript at display time.
 * Their words, in their order: the "um"s and "uh"s, stutters, false starts
 * ("So I, so I took home" → "So I took home"), and other people's
 * back-channel ("Yeah, right?", "Mm-hmm") go; nothing is rephrased,
 * reordered or translated. The stored text is never touched, and the page
 * always offers the exact words beside the tidied ones.
 */

const FILLER = /(^|[\s,;(—–])(?:u+m+|u+h+|uhm|erm|er|e+h|hmm+|mm+)(?=[\s,.;:!?)—–]|$)[,]?/gi;
const BACKCHANNEL_WORD = "(?:yeah|yes|yep|yup|right|okay|ok|oh|ah|mm-?hmm|uh-?huh|for sure|sure|exactly|totally|definitely|absolutely|of course|really|true|i see|got it|nice|wow|cool)";
const BACKCHANNEL = new RegExp(`^${BACKCHANNEL_WORD}(?:[,\\s]+${BACKCHANNEL_WORD})*[.!?…]*$`, "i");
/** Labels a chat or call transcript puts in front of each turn. */
const TURN = /(?:^|\s)(You|Me|AI|Assistant|A Story|Interviewer|Narrator|Q|A):\s+/g;
const OTHER = /^(AI|Assistant|A Story|Interviewer|Q)$/i;

/** True when a memory's words read as speech (a call or a chat) rather than typed prose. */
export function soundsSpoken(text: string): boolean {
  const t = String(text || "");
  if (!t.trim()) return false;
  TURN.lastIndex = 0;
  if (TURN.test(t)) return true;
  const markers = (t.match(/\b(?:yeah|um+|uh+|you know|i mean|right\?|kind of|like,|so yeah|okay so)\b/gi) || []).length;
  return markers >= 2 && markers / Math.max(1, t.length / 1000) >= 1.5;
}

/** Keeps only the teller's turns when the words carry speaker labels. */
function tellerTurns(text: string): string {
  TURN.lastIndex = 0;
  if (!TURN.test(text)) return text;
  const out: string[] = [];
  const parts = text.split(TURN);
  // split with a capture group: [before, label, words, label, words, …]
  if (parts[0].trim()) out.push(parts[0].trim());
  for (let i = 1; i < parts.length; i += 2) {
    const who = parts[i];
    const words = (parts[i + 1] || "").trim();
    if (words && !OTHER.test(who)) out.push(words);
  }
  return out.join(" ");
}

const cap = (s: string) => s.replace(/^(["“‘(]?)([a-z])/, (_, q: string, c: string) => q + c.toUpperCase());

/** One paragraph of speech, tidied. */
export function cleanSpeech(text: string): string {
  const turns = tellerTurns(String(text || ""));
  const sentences = turns.match(/[^.!?…]+(?:[.!?…]+["”’)]*|$)\s*/g) || [turns];
  const t = sentences
    .map((s) => s.trim())
    // back-channel sentences go whole
    .filter((s) => s && !BACKCHANNEL.test(s.replace(/["“”]/g, "").trim()))
    .map((s) =>
      s
        .replace(FILLER, "$1")
        // stutters and false starts: a word or a short phrase said twice ("I, I", "so I, so I")
        .replace(/\b((?:[\w'’]+\s+){0,2}[\w'’]+),?\s+\1\b/gi, "$1")
        .replace(/^[\s,;:]+/, ""),
    )
    .filter((s) => /[\p{L}\p{N}]/u.test(s))
    .map(cap)
    .join(" ");
  return t
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([,;:])\s*([,.;:!?])/g, "$2")
    .replace(/^[\s,;:]+/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Every paragraph tidied; a paragraph that was only back-channel disappears. */
export function cleanTranscript(paragraphs: string[]): string[] {
  return paragraphs.map((p) => cleanSpeech(p.replace(/\s*\n\s*/g, " "))).filter(Boolean);
}

/**
 * The kept line (Bao's Standard rule 32): one sentence of the person's own
 * words, verbatim, that a skimming reader should remember. It is set large
 * under the title, used as the card's excerpt and repeated as the closing
 * coda. Until a teller chooses one, it is suggested here: a sentence of
 * their own (never the other person's turn, never a question, never one
 * that tidying would change, so it is exactly what they said), 50 to 170
 * characters, preferring "I", "we", "my", "our" and a line from later in
 * the telling over the opening (which the page already begins with).
 */
export function keptLine(text: string): string {
  const all = String(text || "").replace(/\s+/g, " ").trim();
  if (!all) return "";
  const own = tellerTurns(all);
  const sentences = (own.match(/[^.!?…]+[.!?…]+["”’)]*/g) || []).map((s) => s.trim());
  let best = "";
  let bestScore = -Infinity;
  sentences.forEach((s, i) => {
    const len = s.length;
    if (len < 50 || len > 170 || /\?["”’)]*$/.test(s) || !/^[A-Z“"‘]/.test(s)) return;
    if (cleanSpeech(s) !== s) return;
    let score = 0;
    if (/\b(I|we|my|our|me|us)\b/i.test(s)) score += 3;
    if (len >= 70 && len <= 140) score += 2;
    if (i > 0) score += 1;
    if (/\b(love|miss|remember|never|always|proud|home|family|mother|father|mom|dad|grand\w+)\b/i.test(s)) score += 2;
    if (/\d{3,}/.test(s)) score -= 1;
    score -= i * 0.05;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  });
  return best;
}
