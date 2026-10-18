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
const ASK = /^(?:and\s+|so\s+)?(?:do|did|does|is|are|was|were|how|what|why|when|where|who|which|can|could|would|will|have|has)\b[^?]{0,80}\?["”’]*$/i;
/** A reaction, not a question to answer ("Wait, were you?", "Really?"): it is the other person's, and dropped. */
const REACTION_Q = /^(?:wait|really|seriously|oh|huh)\b/i;
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
  // the marks of talk: fillers, hedges, and sentences that open the way speech does ("And I think…", "No, I just…")
  const markers =
    (t.match(/\b(?:yeah|um+|uh+|you know|i mean|i think|i guess|right\?|kind of|sort of|like,|so yeah|okay so)\b/gi) || []).length +
    (t.match(/(?:^|[.!?]\s+)(?:and|so|but|no|yes|well|because)\b[ ,]/gi) || []).length;
  return markers >= 2 && markers / Math.max(1, t.length / 1000) >= 2;
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

/** "Like" as filler goes ("I taught like teenagers" → "I taught teenagers"); the verb and the comparison stay. */
function dropFillerLike(s: string): string {
  return s
    .replace(/,\s*like,\s*/gi, ", ")
    .replace(/\blike\b,?\s*/gi, (m: string, at: number, all: string) => (isFillerLike(all, at) ? "" : m))
    .replace(/\s{2,}/g, " ");
}

/**
 * A spoken sentence that runs on past 160 characters with no full stop is
 * punctuated by sense: a full stop before "and then", "so", "but" or "and
 * so" once the piece before it holds 50 characters or more. The words and
 * their order never change.
 */
function punctuateRunOn(s: string): string[] {
  if (s.length <= 160) return [s];
  const out: string[] = [];
  let rest = s;
  const re = /\s(?=(?:and then|and so|so|but)\s)/gi;
  for (;;) {
    re.lastIndex = 50;
    const m = re.exec(rest);
    if (!m || rest.length - m.index < 40) break;
    out.push(`${rest.slice(0, m.index).replace(/[,;:]$/, "")}.`);
    rest = cap(rest.slice(m.index + 1));
  }
  out.push(rest);
  return out;
}

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
        // a false start across a joining word: "my so my mom" → "my mom"
        .replace(/\b([\w'’]+)\s+(?:so|and|uh|um)\s+\1\b/gi, "$1")
        .replace(/^[\s,;:]+/, ""),
    )
    .map(dropFillerLike)
    .flatMap(punctuateRunOn)
    .filter((s) => /[\p{L}\p{N}]/u.test(s) && !BACKCHANNEL.test(s.trim()))
    .map(cap)
    .join(" ");
  return t
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([,;:])\s*([,.;:!?])/g, "$2")
    .replace(/^[\s,;:]+/, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    // speech ends a thought with a full stop the transcript forgot
    .replace(/([\p{L}\p{N}])$/u, "$1.");
}

/** The other person's questions in an unlabelled transcript, lifted out of the teller's paragraph onto lines of their own. */
function liftQuestions(paragraph: string): string[] {
  const out: string[] = [];
  let run = "";
  for (const raw of sentencesOf(paragraph)) {
    const s = raw.trim();
    if (!s) continue;
    if (s.endsWith("?") && REACTION_Q.test(s) && !TAG.test(s)) continue; // the other person reacting: dropped
    // lifted only when it is a real question (five words or more); a short one stays in the teller's words
    if (ASK.test(s) && !TAG.test(s) && s.split(/\s+/).length >= 5) {
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

const OPENS_WEAK = /^["“‘]?(?:and then|and so|so|no|like|yeah|well|but|okay|ok|oh|um|uh|because|then|this|there|you)\b/i;
/** "It's", "That's", "And" open a kept line only when the sentence carries a feeling or a judgement. */
const OPENS_SOFT = /^["“‘]?(?:and(?! then| so)|that'?s|that’s|it'?s|it’s)\b/i;
/** The words that make a sentence worth remembering: a feeling, a judgement, a turn of a life. */
const FEELING = /\b(always|never|love|loved|loving|miss|missed|remember|remembered|never forget|forget|dream|dreams|wish|wished|proud|happy|happiest|sad|hard|hardest|challenging|struggle|scared|afraid|grateful|thankful|lucky|blessed|beautiful|worth|best|favou?rite|special|important|mattered|meant|learned|opportunity|heart|hope|grief|joy|fear|courage|kindness)\b/i;

/**
 * A "like" that is filler ("she took home like hundreds", "and like worked"), not the verb ("I'd like to")
 * or a comparison ("like a teacher").
 */
function fillerLike(s: string): boolean {
  for (const m of s.matchAll(/\blike\b/gi)) if (isFillerLike(s, m.index ?? 0)) return true;
  return false;
}

/** Whether the "like" at `at` in `s` is filler: neither the verb ("I'd like to") nor a comparison ("like a teacher"). */
function isFillerLike(s: string, at: number): boolean {
  const before = s.slice(0, at).trim().split(/\s+/).pop()?.toLowerCase() || "";
  const after = s.slice(at + 4).trim().split(/[\s,.!?]+/)[0]?.toLowerCase() || "";
  const verb = /^(i|we|they|you|he|she|would|'d|i'd|we'd|really|to|did|didn't|don't|do|not|feel|felt|looks?|looked|sounds?|liked?)$/.test(before);
  // "like a teacher" compares; "like a really good fan" hedges
  const second = s.slice(at + 4).trim().split(/[\s,.!?]+/)[1]?.toLowerCase() || "";
  const hedge = /^(really|very|so|kind|sort|little|bit|whole|lot)$/.test(second);
  const compare = /^(a|an|the|this|that|it|my|his|her|our|their|your|me|him|us|them|home|family)$/.test(after) && !hedge && !/,$/.test(s.slice(0, at).trim()) && !/^,/.test(s.slice(at + 4));
  return !verb && !compare;
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
export function keptLine(text: string, { max = 170, min = 50, needFeeling = true }: { max?: number; min?: number; needFeeling?: boolean } = {}): string {
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
    if (len < min || len > max || /\?["”’)]*$/.test(s) || !/^[A-Z“"‘]/.test(s)) return;
    const feels = FEELING.test(s);
    // a takeaway carries a feeling or a judgement; a plain fact ("I've taken just under $300,000…") is not one
    if (needFeeling && !feels) return;
    if (OPENS_WEAK.test(s) || (OPENS_SOFT.test(s) && !feels) || DANGLES.test(s) || fillerLike(s)) return;
    if (cleanSpeech(s) !== s) return;
    // a feeling or a judgement outweighs who is speaking; a plain fact scores low
    let score = 0;
    if (feels) score += 5;
    if (/\b(I|we|my|our|me|us)\b/.test(s)) score += 2;
    if (/^(?:I|We|My|Our)\b/.test(s)) score += 1;
    if (len >= 60 && len <= 140) score += 1;
    if (i > 0) score += 1;
    if (/\$|\d{3,}/.test(s)) score -= 2;
    score -= i * 0.05;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  });
  return best;
}

/**
 * A card's words, never cut mid-sentence: a whole kept sentence of 45
 * characters or fewer when there is one; for words typed line by line, the
 * first lines whole ("We live in a small city · It's in Vietnam"); else the
 * page's kept line. Empty when none of these exists (the card then quotes
 * the opening of their own words).
 */
export function cardLine(text: string): string {
  const short = keptLine(text, { max: 45, min: 18 });
  if (short) return short;
  const t = String(text || "").replace(/\r\n?/g, "\n").trim();
  if (t.includes("\n") && !soundsSpoken(t)) {
    const lines = t.split("\n").map((l) => l.trim()).filter(Boolean);
    let out = "";
    for (const l of lines) {
      const next = out ? `${out} · ${l}` : l;
      if (out && next.length > 60) break;
      out = next;
    }
    if (out) return out;
  }
  // no feeling to keep: the card still shows one whole sentence of their own, never a cut one
  return keptLine(text) || keptLine(text, { max: 90, min: 18, needFeeling: false });
}
