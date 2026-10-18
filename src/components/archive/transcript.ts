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
/** After a lifted question, the asker's own next words, before any answer ("Because our strategy…", "We're going to…"). */
const ASKER_GOES_ON = /^(?:because|our|we're|we’re|we are|we'll|we’ll|we will|we want|we were|and our|so our)\b/i;
/** The mark that begins a paragraph holding the other person's question, set as the book's "We asked" line. */
export const ASKED = "⁣";
/** Marks, inside the cleaner only, the teller's words straight after a lifted question: they open on the answer. */
const ANSWER = "\u2064";
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
    .replace(/,\s*like,\s*/gi, (m: string, at: number, all: string) => (HEDGES_AMOUNT.test(all.slice(at + m.length)) || quotesOrFeels(all.slice(0, at), all.slice(at + m.length)) ? m : " "))
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
    let m = re.exec(rest);
    // "not only are you caring for them but then…", "not just about cooking but also…" are one thought: their "but"
    // is never a sentence break, and neither is a "but also"
    while (m && (/^\s*but also\b/i.test(rest.slice(m.index)) || (/^\s*but\b/i.test(rest.slice(m.index)) && /\bnot (?:only|just|merely|simply)\b/i.test(rest.slice(0, m.index))))) m = re.exec(rest);
    if (!m || rest.length - m.index < 40) break;
    out.push(`${rest.slice(0, m.index).replace(/[,;:]$/, "")}.`);
    rest = cap(rest.slice(m.index + 1));
  }
  out.push(rest);
  return out;
}

/**
 * A clause said and then restarted, dropped only when that is certain (the founder's ruling on rule 29):
 * - it is a true prefix of the next clause ("we went to, we went to the market" → "we went to the market");
 * - it is short (six words or fewer) and breaks off on a little word ("So we did a, we built…" → "we built…").
 * A clause is never dropped because it opens on the same word as the next: "We laughed, we cried, we sang",
 * "We had nothing, we had each other" and "I felt like, I was alone" are all said, and all stay.
 */
function dropRestarts(s: string): string {
  const parts = s.split(/,\s+/);
  if (parts.length < 2) return s;
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const a = parts[i];
    const b = parts[i + 1];
    if (b) {
      const na = norm(a);
      const nb = norm(b);
      const prefix = !!na && nb.length > na.length && nb.startsWith(`${na} `);
      const brokeOff = a.trim().split(/\s+/).length <= 6 && BREAKS_OFF.test(a.trim());
      if (prefix || brokeOff) continue;
    }
    out.push(a);
  }
  return out.join(", ");
}

/** A clause that stops on a word that cannot end one: an article, "to", "of", a possessive ("we did a,"). */
const BREAKS_OFF = /\b(?:a|an|the|to|of|my|our|their|your)$/i;

/** A word said twice on purpose: emphasis ("very, very"), grammar ("had had", "that that"), a refusal ("no, no"). */
const MEANT_TWICE = /^(?:very|really|so|much|many|more|most|far|long|had|that|is|no|yes|bye|ha|again|over|round|on|now|go|come|well|never|ever|too)$/i;
/** A repeat joined by a conjunction is said on purpose ("worse and worse and then", "again and again and finally"). */
const JOINED = /\b(?:and|or|but|after|by|then|upon|over)$/i;
/** A phrase that is itself a conjunction ("and then and then") is a stammer, not "X and X". */
const CONJ_START = /^(?:and|or|but|so|then|after|by|because)\b/i;
/**
 * An exact adjacent repeat of a word or a phrase of up to three words, any number of times ("I, I", "we we we",
 * "and then and then", "he was, he was"): collapsed to one.
 */
const STUTTER = /\b((?:[\w'’]+\s+){0,2}[\w'’]+)(?:,?\s+\1\b)+/gi;
/** Kept whole, at its full length: a doubling that means something ("very, very", "no, no, no"), or "X and X and". */
const meantTwice = (x: string) => MEANT_TWICE.test(x) || (/\s/.test(x) && JOINED.test(x) && !CONJ_START.test(x));


const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();

/** One paragraph of speech, tidied. */
export function cleanSpeech(text: string, { answer = false }: { answer?: boolean } = {}): string {
  const turns = tellerTurns(String(text || ""));
  const kept: string[] = [];
  const all = sentencesOf(turns).map((s) => s.trim());
  // straight after a "We asked" line, the teller's short reply ("For sure. Yeah, definitely.") is the answer: it stays
  // whole, as said, so the page never shows a question with no answer
  let lead = 0;
  if (answer) while (lead < all.length && BACKCHANNEL.test(all[lead].replace(/["“”]/g, "").trim())) lead++;
  const reply = all.slice(0, lead).join(" ");
  for (const s0 of all
    .slice(lead)
    // back-channel sentences go whole
    .filter((s) => s && !BACKCHANNEL.test(s.replace(/["“”]/g, "").trim()))
    .map((s) =>
      s
        .replace(LEAD_FILLER, "")
        .replace(TRAIL_YEAH, "")
        .replace(FILLER, "$1")
        // stutters and false starts: a word or a short phrase said twice ("I, I", "so I, so I"); a doubling that
        // means something ("very, very", "had had", "that that", "no, no") is the speaker's and stays
        .replace(STUTTER, (m: string, x: string) => (meantTwice(x) ? m : x))
        // (a false start across a filler sound, "my uh my mom", is a stutter once the "uh" has gone; across a word such
        // as "so" or "and" nothing is dropped: "faster and faster" and "my dad so I started" are both said)
        .replace(/^[\s,;:]+/, ""),
    )
    .map(dropFillerLike)
    .map(dropRestarts)
    .flatMap(punctuateRunOn)
    .filter((s) => /[\p{L}\p{N}]/u.test(s) && !BACKCHANNEL.test(s.trim()))) {
    // a sentence said twice ("I was working a corporate job, the eSports job. I was working a corporate job.") is kept once
    const n = norm(s0);
    const prev = kept.length ? norm(kept[kept.length - 1]) : "";
    if (n && (n === prev || (prev && prev.startsWith(n)) || kept.some((k) => norm(k) === n))) continue;
    kept.push(cap(s0));
  }
  return [reply, ...kept]
    .filter(Boolean)
    .join(" ")
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
  let asking = false;
  for (const raw of sentencesOf(paragraph)) {
    const s = raw.trim();
    if (!s) continue;
    if (s.endsWith("?") && REACTION_Q.test(s) && !TAG.test(s)) continue; // the other person reacting: dropped
    // lifted only when it is a real question (five words or more); a short one stays in the teller's words
    if (ASK.test(s) && !TAG.test(s) && s.split(/\s+/).length >= 5) {
      if (run.trim()) out.push(run.trim());
      out.push(ASKED + s);
      asking = true;
      run = "";
      continue;
    }
    // the asker going on ("Because our strategy right now is…") is theirs, never the teller's: it stays with the question
    if (asking && ASKER_GOES_ON.test(s)) {
      out[out.length - 1] += ` ${s}`;
      continue;
    }
    // the first words after the question are the teller's answer
    if (asking && !run) run = ANSWER;
    asking = false;
    run += `${s} `;
  }
  if (run.trim()) out.push(run.trim());
  return out;
}

/** Every paragraph tidied; a paragraph that was only back-channel disappears; the other person's questions stand apart. */
export function cleanTranscript(paragraphs: string[]): string[] {
  const out = paragraphs
    .flatMap((p) => liftQuestions(tellerTurns(p.replace(/\s*\n\s*/g, " "))))
    .map((p) => (p.startsWith(ASKED) ? p : p.startsWith(ANSWER) ? cleanSpeech(p.slice(ANSWER.length), { answer: true }) : cleanSpeech(p)))
    .filter((p) => p.replace(ASKED, "").trim());
  // the words open on the teller, not on a reply to a question the page never shows ("No, I just lost my grandparents…")
  if (out.length && !out[0].startsWith(ASKED)) out[0] = cap(out[0].replace(OPENING_REPLY, ""));
  return out;
}

const OPENING_REPLY = /^(?:no|yes|yeah|yep|right|sure|exactly|definitely|absolutely)[,.]\s+(?=\S)/i;

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
        .join(JOIN),
    )
    .join(" ");
}

/** Typed lines run together as "city · It's": a no-break space before the dot, so the dot always ends its line. */
export const JOIN = " · ";

const OPENS_WEAK = /^["“‘]?(?:i mean|and then|and so|so|no|like|yeah|well|but|okay|ok|oh|um|uh|because|then|this|there|you)\b/i;
/** "It's", "That's", "And" open a kept line only when the sentence carries a feeling or a judgement. */
const OPENS_SOFT = /^["“‘]?(?:and(?! then| so)|that'?s|that’s|it'?s|it’s)\b/i;
/** The words that make a sentence worth remembering: a feeling, a judgement, a turn of a life. */
const FEELING = /\b(always|never|love|loved|loving|miss|missed|remember|remembered|never forget|forget|dream|dreams|wish|wished|proud|happy|happiest|sad|hard|hardest|challenging|struggle|scared|afraid|grateful|thankful|lucky|blessed|beautiful|worth|best|favou?rite|special|important|mattered|meant|learned|opportunity|heart|hope|grief|joy|fear|courage|kindness|memorable|bond|bonds|bonding|bondings)\b/i;

/**
 * A "like" that is filler ("she took home like hundreds", "and like worked"), not the verb ("I'd like to")
 * or a comparison ("like a teacher").
 */
function fillerLike(s: string): boolean {
  for (const m of s.matchAll(/\blike\b/gi)) if (isFillerLike(s, m.index ?? 0)) return true;
  return false;
}

/**
 * What follows a "like" that hedges rather than fills: a number or an amount ("like hundreds of thousands", "like ten",
 * "like a thousand", "like 300", "like nothing"), or a negation ("is like not non-existent"). Without the "like" a
 * guess reads as a fact, or the meaning flips, so it stays. When in doubt the word is kept.
 */
const HEDGES_AMOUNT = /^,?\s*(?:[$£€]?\d|(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundreds?|thousands?|millions?|billions?|dozens?|half|nothing|none|every|everything|everyone|all|almost|about|maybe|most|some|several|not|no|never|barely|hardly|only)\b|(?:a|an)\s+(?:few|couple|lot|hundred|thousand|million|billion|dozen|half|bunch|ton|year|month|week|day|hour|minute|mile)s?\b)/i;

/**
 * The words after which "like" quotes or feels, and stays: "she was like, you have to go", "he's like, why",
 * "I was like oh my god", "I felt like, I was alone", "it seemed like".
 */
const BE_OR_GO = /^(?:was|were|is|am|are|be|been|being|go|goes|went|going)$|['’]s$/i;
const FEELS = /^(?:felt|feel|feels|feeling|seemed|seem|seems|looked|look|looks|sounded|sound|sounds)$/i;
/** What opens a quote after "was like": a comma, a quotation mark, a pronoun or an exclamation ("oh my god"). */
const QUOTE_NEXT = /^\s*(?:,|["“‘']|(?:i|you|he|she|we|they|oh|wow|what|why|how|no|yes|yeah|okay|ok|hey|wait|um|uh)\b)/i;
const quotesOrFeels = (before: string, after: string) => FEELS.test(lastWord(before)) || (BE_OR_GO.test(lastWord(before)) && QUOTE_NEXT.test(after));
const lastWord = (s: string) => s.trim().split(/\s+/).pop()?.toLowerCase().replace(/[^\p{L}'’]/gu, "") || "";

/** Whether the "like" at `at` in `s` is filler: not the verb ("I'd like to"), a comparison ("like a teacher"), a hedge on an amount ("like ten"), nor a quote or a feeling ("she was like,", "I felt like"). */
function isFillerLike(s: string, at: number): boolean {
  if (HEDGES_AMOUNT.test(s.slice(at + 4))) return false;
  if (quotesOrFeels(s.slice(0, at), s.slice(at + 4))) return false;
  const before = s.slice(0, at).trim().split(/\s+/).pop()?.toLowerCase() || "";
  const after = s.slice(at + 4).trim().split(/[\s,.!?]+/)[0]?.toLowerCase() || "";
  const verb = /^(i|we|they|you|he|she|would|'d|i'd|we'd|really|to|did|didn't|don't|do|not|feel|felt|looks?|looked|sounds?|liked?)$/.test(before);
  // "like a teacher" compares; "like a really good fan" hedges
  const second = s.slice(at + 4).trim().split(/[\s,.!?]+/)[1]?.toLowerCase() || "";
  const hedge = /^(really|very|so|kind|sort|little|bit|whole|lot)$/.test(second);
  const compare = /^(a|an|the|this|that|it|my|his|her|our|their|your|me|him|us|them|home|family)$/.test(after) && !hedge && !/,$/.test(s.slice(0, at).trim()) && !/^,/.test(s.slice(at + 4));
  return !verb && !compare;
}

const DANGLES = /\b(?:to|the|a|an|of|and|but|so|with|for|that|was|is|my|our|your|their|in|on|at|from|like)[.!…]["”’)]*$/i;
/** A preposition that ends a sentence whole ("…every competition I've been in.", "…the town we lived in."). */
const ENDS_WHOLE = /\b(?:been|be|live|lived|living|grew up|born|stayed|stay|believe|believed|interested|involved|worked|work|came from|come from)\s+(?:in|on|at|from|for|with|to)[.!…]["”’)]*$/i;
/** A sentence that trails off ("…was trying to."), not one that ends on a preposition by grammar. */
const dangles = (s: string) => DANGLES.test(s) && !ENDS_WHOLE.test(s);
/** A general "you" ("You always have to look for every opportunity") is a takeaway when it carries a feeling. */
const GENERAL_YOU = /^["“‘]?you\s+(?:always|never|have to|has to|can|can't|can’t|should|just|need to|learn|realize|realise)\b/i;
const weakOpening = (s: string, feels: boolean) => OPENS_WEAK.test(s) && !(feels && GENERAL_YOU.test(s));
/** A sentence that points back at something the reader of a card never sees ("That paid for…", "It's a job."). */
const POINTS_BACK = /^["“‘]?(?:that|this|it|they|he|she|those|these|there)\b/i;

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
    // judged as it will be shown, without the joint ("So you always have to…" is shown "You always have to…")
    const shown = s.replace(OUT_OF_CONTEXT, "");
    // a takeaway carries a feeling or a judgement; a plain fact ("I've taken just under $300,000…") is not one, and
    // "always" or "never" alone feel only in a lesson ("You always have to…") or a life the teller is in ("I never…", "she always kept
    // the lamp on for us"), not in a fact about someone else ("My co-founder has never jumped…")
    const strong = FEELING.test(s.replace(/\b(?:always|never)\b/gi, ""));
    const feels = strong || (FEELING.test(s) && (GENERAL_YOU.test(shown) || /\b(?:I|we|us|me)\b/i.test(shown)));
    if (needFeeling && !feels) return;
    if (weakOpening(shown, feels) || (OPENS_SOFT.test(shown) && !feels) || dangles(s) || fillerLike(s)) return;
    // a line that points back ("That's always been the dream…", "It's been…") needs what came before it: under a
    // title, on a card, it can read as the opposite of what was meant, so it is never the kept line
    if (POINTS_BACK.test(shown)) return;
    if (cleanSpeech(s) !== s) return;
    // a feeling or a judgement outweighs who is speaking; a plain fact scores low
    let score = 0;
    // "always" and "never" alone often state a fact ("We never gave away equity"); a real feeling or a lesson weighs more
    if (feels) score += FEELING.test(s.replace(/\b(?:always|never)\b/gi, "")) ? 5 : 2;
    if (GENERAL_YOU.test(shown)) score += 3;
    if (i === sentences.length - 1) score += 1;
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

/** A line shown out of its context loses its throat-clearing: "I mean, that was awesome." → "That was awesome." */
const OUT_OF_CONTEXT = /^(?:i mean|so|and so|and|well|yeah|okay|ok|you know|like)[,]?\s+/i;

/**
 * The memory's takeaway (Bao's Standard rule 32), one function for every
 * place it is shown: the page sets it under the title and repeats it as
 * the coda, the print and the List card use it as their words, and Home
 * quotes it. In order:
 * 1. the kept line: a whole sentence of their own with a feeling in it;
 * 2. for words typed line by line, the first lines whole, joined by " · "
 *    ("We live in a small city · It's in Vietnam");
 * 3. the best whole sentence of their own that fits (30 to 140 characters,
 *    never a question, never trailing off), from the tidied words when it
 *    was said, with a leading "I mean" or "So" dropped.
 * Never cut, never an ellipsis. Empty only when there are no words.
 */
export function takeaway(text: string): string {
  const kept = keptLine(text);
  // lifted out of the talk, a line does not open on the joint that tied it to the last one ("And that's always been the dream…")
  if (kept) return cap(kept.replace(OUT_OF_CONTEXT, ""));
  const t = String(text || "").replace(/\r\n?/g, "\n").trim();
  if (!t) return "";
  const spoken = soundsSpoken(t);
  if (t.includes("\n") && !spoken) {
    const lines = t.split("\n").map((l) => l.trim()).filter(Boolean);
    let out = "";
    for (const l of lines) {
      const next = out ? `${out}${JOIN}${l}` : l;
      if (out && next.length > 60) break;
      out = next;
    }
    if (out) return out;
  }
  const words = spoken ? cleanTranscript(t.split(/\n\s*\n/)).filter((p) => !p.startsWith(ASKED)).join(" ") : t.replace(/\s+/g, " ");
  const sentences = (words.match(/[^.!?…]+[.!?…]+["”’)]*/g) || []).map((x) => cap(x.trim().replace(OUT_OF_CONTEXT, "")));
  let best = "";
  let bestScore = -Infinity;
  sentences.forEach((x, i) => {
    const len = x.length;
    if (len < 30 || len > 140 || /\?["”’)]*$/.test(x) || !/^[A-Z“"‘]/.test(x) || dangles(x) || fillerLike(x)) return;
    const feels = FEELING.test(x);
    if (weakOpening(x, feels)) return;
    // a line that points back ("That paid for an engineer…", "That's always been the dream…") needs what came before it
    if (POINTS_BACK.test(x)) return;
    let score = 0;
    if (feels) score += 2;
    if (/\b(I|we|my|our|me|us)\b/.test(x)) score += 2;
    // their own life, said in the first person, before a line about someone else
    if (/^["“‘]?(?:I|We|My|Our)\b/.test(x)) score += 2;
    if (len >= 45 && len <= 110) score += 2;
    if (/\$|\d{3,}/.test(x)) score -= 1;
    // a long run with no pause in it is a run-on of speech ("…he's just very connected I did not grow up in…"), and a
    // start broken off before "so I" ("My dad so I started…") stays in the words but is never set alone
    if (len > 70 && !/[,;:—–]/.test(x)) score -= 3;
    if (/^(?:[\w'’]+\s+){1,3}so\s+(?:I|we)\b/i.test(x)) score -= 6;
    score -= i * 0.1;
    if (score > bestScore) {
      bestScore = score;
      best = x;
    }
  });
  const first = sentences[0] ? cap(dropFillerLike(sentences[0])) : "";
  // a short memory with no full stop ("Poker night at 2315") is its own takeaway, whole
  const whole = t.replace(/\s+/g, " ");
  return best || (first.length <= 140 ? first : "") || (whole.length <= 140 ? whole : "");
}

/** Whether the shown paragraph holds the takeaway, ignoring case and punctuation (so it still matches once tidied). */
export function findTakeaway(paragraph: string, line: string): [number, number] | null {
  if (!line) return null;
  const want = norm(line);
  if (!want) return null;
  for (const m of paragraph.matchAll(/[^.!?…]+[.!?…]+["”’)]*\s*/g)) {
    if (norm(m[0]) === want || norm(m[0]).endsWith(want)) {
      // the mark starts where the takeaway does, past the joint it was lifted without ("So that paid…" marks "that paid…")
      const lead = norm(m[0]) === want ? 0 : (m[0].match(OUT_OF_CONTEXT)?.[0].length ?? 0);
      return [(m.index ?? 0) + lead, (m.index ?? 0) + m[0].trimEnd().length];
    }
  }
  return null;
}

/**
 * Whether the words open on the takeaway: it is in their first two sentences or first 200 characters, or, for words
 * typed line by line, it is their first lines. The page then sets nothing under the title and marks it in place.
 */
export function opensOn(words: string, line: string): boolean {
  if (!line || !words) return false;
  // within the first two sentences or the first 200 characters, the reader has only just read it
  const at = findTakeaway(words, line);
  const two = words.match(/^(?:[^.!?…]+[.!?…]+["”’)]*\s*){1,2}/)?.[0].length ?? 0;
  if (at && (at[0] <= 200 || at[0] < two)) return true;
  return norm(words).startsWith(norm(line));
}
