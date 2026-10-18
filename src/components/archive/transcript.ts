/**
 * The house transcript style (docs/research/reading-2026.md §3.5): words
 * that came from a call or a conversation are set as a clean transcript at
 * display time. Their words, in their order: the "um"s and "uh"s, the
 * throat-clearing at the start ("Yeah well so"), stutters, false starts
 * ("So I, so I took home" → "So I took home"), a trailing "but yeah", and
 * the other person's back-channel ("Yeah, right?", "Wow, that's amazing")
 * go; the other person's questions stand apart as the book's "We asked"
 * line; nothing is rephrased, reordered or translated. The stored text is
 * never touched, and the page always offers the exact words beside the
 * tidied ones.
 */

const FILLER = /(^|[\s,;(—–])(?:u+m+|u+h+|uhm|erm|er|e+h|hmm+|mm+)(?=[\s,.;:!?)—–]|$)[,]?/gi;
const BACKCHANNEL_WORD = "(?:yeah|yes|yep|yup|right|okay|ok|oh|ah|wait|mm-?hmm|uh-?huh|for sure|sure|exactly|totally|definitely|absolutely|of course|really|true|i see|got it|nice|wow|cool)";
const REACTION = "(?:that'?s|that’s|so) (?:amazing|awesome|great|cool|so cool|incredible|wild|interesting|fun|nice)";
const BACKCHANNEL = new RegExp(`^(?:${BACKCHANNEL_WORD}|${REACTION})(?:[,\\s]+(?:${BACKCHANNEL_WORD}|${REACTION}))*[.!?…]*$`, "i");
/** A paragraph's throat-clearing: "Yeah well so", "Okay, so", "Um, like". A lone "So" is left alone. */
const LEAD_FILLER = /^(?:(?:(?:yeah|yes|well|okay|ok|oh|um+|uh+|like|so|you know)[,.]?\s+){2,}|(?:yeah|well|okay|ok|oh|um+|uh+)[,.]?\s+)/i;
/** A trailing "but yeah", "so yeah", "and yeah" at the end of a sentence. */
const TRAIL_YEAH = /,?\s+(?:but|so|and)\s+yeah(?=[.!?…]|$)/gi;
/** A short question that reads as the other person's ("Wait, were you?", "Do they open to non-students as well?"), not a tag ("…, right?"). */
const ASK = /^(?:wait,?\s+|and\s+|so\s+)?(?:do|did|does|is|are|was|were|how|what|why|when|where|who|which|can|could|would|will|have|has)\b[^?]{0,80}\?["”’]*$/i;
const TAG = /\b(?:right|you know|isn't it|wasn't it|okay|yeah|huh)\?["”’]*$/i;
/** The mark that begins a paragraph holding the other person's question, set as the book's "We asked" line. */
export const ASKED = "⁣";
/** Labels a chat or call transcript puts in front of each turn. */
const TURN = /(?:^|\s)(You|Me|AI|Assistant|A Story|Interviewer|Narrator|Q|A):\s+/g;
const OTHER = /^(AI|Assistant|A Story|Interviewer|Q)$/i;
/** Where a run-on block of speech can be broken when it has no full stop: before "and then", "so", "but"… */
const CLAUSE = /\s(?=(?:and then|and so|so then|so|and|but|because)\s)/gi;

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
export function tellerTurns(text: string): string {
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
const sentencesOf = (s: string) => s.match(/[^.!?…]+(?:[.!?…]+["”’)]*|$)\s*/g) || [s];

/** One paragraph of speech, tidied. */
export function cleanSpeech(text: string): string {
  const turns = tellerTurns(String(text || ""));
  const t = sentencesOf(turns)
    .map((s) => s.trim())
    // back-channel sentences go whole
    .filter((s) => s && !BACKCHANNEL.test(s.replace(/["“”]/g, "").trim()))
    .map((s) =>
      s
        .replace(LEAD_FILLER, "")
        .replace(TRAIL_YEAH, "")
        .replace(FILLER, "$1")
        // stutters and false starts: a word or a short phrase said twice ("I, I", "so I, so I")
        .replace(/\b((?:[\w'’]+\s+){0,2}[\w'’]+),?\s+\1\b/gi, "$1")
        .replace(/^[\s,;:]+/, ""),
    )
    .filter((s) => /[\p{L}\p{N}]/u.test(s) && !BACKCHANNEL.test(s.trim()))
    .map(cap)
    .join(" ");
  return t
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([,;:])\s*([,.;:!?])/g, "$2")
    .replace(/^[\s,;:]+/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** The other person's questions in an unlabelled transcript, lifted out of the teller's paragraph onto lines of their own. */
function liftQuestions(paragraph: string): string[] {
  const out: string[] = [];
  let run = "";
  for (const raw of sentencesOf(paragraph)) {
    const s = raw.trim();
    if (!s) continue;
    if (ASK.test(s) && !TAG.test(s)) {
      if (run.trim()) out.push(run.trim());
      out.push(ASKED + s);
      run = "";
    } else run += `${s} `;
  }
  if (run.trim()) out.push(run.trim());
  return out;
}

/** Every paragraph tidied; a paragraph that was only back-channel disappears; the other person's questions stand apart. */
export function cleanTranscript(paragraphs: string[]): string[] {
  return paragraphs
    .flatMap((p) => liftQuestions(tellerTurns(p.replace(/\s*\n\s*/g, " "))))
    .map((p) => (p.startsWith(ASKED) ? p : cleanSpeech(p)))
    .filter((p) => p.replace(ASKED, "").trim());
}

/**
 * Breaks a block that runs on without a full stop: before "and then", "so",
 * "but" or "because", at the clause boundary nearest `target` characters.
 * With `punctuate` (the tidied reading) the piece before the break ends
 * with a full stop and the next begins with a capital: punctuation by
 * sense, the house style allows it; the words themselves never change.
 */
export function splitRunOn(text: string, target = 380, punctuate = false): string[] {
  const out: string[] = [];
  let rest = text.trim();
  while (rest.length > target * 1.45) {
    let best = -1;
    let bestGap = Infinity;
    CLAUSE.lastIndex = 0;
    for (let m = CLAUSE.exec(rest); m; m = CLAUSE.exec(rest)) {
      const at = m.index;
      if (at < target * 0.55) continue;
      const gap = Math.abs(at - target);
      if (gap < bestGap) {
        bestGap = gap;
        best = at;
      }
      if (at > target * 1.4) break;
    }
    if (best < 0) break;
    let head = rest.slice(0, best).trim();
    let tail = rest.slice(best).trim();
    if (punctuate) {
      head = /[.!?…,;:]$/.test(head) ? head.replace(/[,;:]$/, ".") : `${head}.`;
      tail = cap(tail);
    }
    out.push(head);
    rest = tail;
  }
  if (rest) out.push(rest);
  return out;
}

/**
 * The person's own words, for a card or a quote: what was said is tidied
 * and only the teller's turns are kept; what was typed keeps its line
 * breaks as " · " so "We live in a small city / It's in Vietnam" never
 * runs together.
 */
export function ownWords(text: string): string {
  const t = String(text || "").replace(/\r\n?/g, "\n").trim();
  if (!t) return "";
  if (soundsSpoken(t)) {
    return cleanTranscript(t.split(/\n\s*\n/))
      .filter((p) => !p.startsWith(ASKED))
      .join(" ");
  }
  return t
    .split(/\n\s*\n/)
    .map((p) =>
      p
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join(" · "),
    )
    .join(" ");
}

const OPENS_WEAK = /^["“‘]?(?:so|no|like|yeah|well|and|but|okay|ok|oh|um|uh|because|then|that'?s|it'?s|this|there|you)\b/i;
/**
 * A "like" that is filler ("she took home like hundreds", "and like worked"), not the verb ("I'd like to")
 * or a comparison ("like a teacher").
 */
function fillerLike(s: string): boolean {
  for (const m of s.matchAll(/\blike\b/gi)) {
    const before = s.slice(0, m.index).trim().split(/\s+/).pop()?.toLowerCase() || "";
    const after = s.slice((m.index ?? 0) + 4).trim().split(/[\s,.!?]+/)[0]?.toLowerCase() || "";
    const verb = /^(i|we|they|you|he|she|would|'d|i'd|we'd|really|to|did|didn't|don't|do|not|feel|felt|looks?|looked|sounds?|liked?)$/.test(before);
    const compare = /^(a|an|the|this|that|it|my|his|her|our|their|your|me|him|us|them|home|family)$/.test(after) && !/,$/.test(s.slice(0, m.index).trim());
    if (!verb && !compare) return true;
  }
  return false;
}

const DANGLES =/\b(?:to|the|a|an|of|and|but|so|with|for|that|was|is|my|our|your|their|in|on|at|from|like)[.!…]["”’)]*$/i;

/**
 * The kept line (Bao's Standard rule 32): one sentence of the person's own
 * words, verbatim, that a skimming reader should remember. It is set under
 * the title, used as the card's excerpt and repeated as the closing coda.
 * Until a teller chooses one, it is suggested here: a whole sentence of
 * their own (never the other person's turn, never a question, never one
 * that tidying would change, so it is exactly what they said), 50 to 170
 * characters, never opening on throat-clearing ("So", "Like", "Yeah"),
 * never with a "like," in it and never trailing off ("…was trying to.").
 * It prefers a first-person sentence with a feeling in it, or "remember".
 * Empty when nothing qualifies: no line is better than a poor one.
 */
export function keptLine(text: string): string {
  const all = String(text || "").replace(/\r\n?/g, "\n").trim();
  if (!all) return "";
  // a line break ends a sentence too: typed lines never run together into one
  const own = tellerTurns(all.replace(/[ \t]+/g, " "));
  const sentences = own
    .split(/\n+/)
    .flatMap((line) => line.match(/[^.!?…]+[.!?…]+["”’)]*/g) || [])
    .map((s) => s.trim());
  let best = "";
  let bestScore = -Infinity;
  sentences.forEach((s, i) => {
    const len = s.length;
    if (len < 50 || len > 170 || /\?["”’)]*$/.test(s) || !/^[A-Z“"‘]/.test(s)) return;
    if (OPENS_WEAK.test(s) || DANGLES.test(s) || fillerLike(s)) return;
    if (cleanSpeech(s) !== s) return;
    let score = 0;
    if (/\b(I|we|my|our|me|us)\b/.test(s)) score += 3;
    if (/^(?:I|We|My|Our)\b/.test(s)) score += 1;
    if (len >= 70 && len <= 140) score += 2;
    if (i > 0) score += 1;
    if (/\b(love|loved|miss|missed|remember|never|always|proud|happy|hard|scared|grateful|home|family|mother|father|mom|dad|grand\w+)\b/i.test(s)) score += 3;
    if (/\d{3,}/.test(s)) score -= 1;
    score -= i * 0.05;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  });
  return best;
}
