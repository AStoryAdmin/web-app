/**
 * The house transcript style (docs/research/reading-2026.md §3.5) and the
 * closed list of rule 17a (lead ruling, 2026-10-18, round 10). Words that
 * came from a call or a conversation are set as a clean transcript at
 * display time, and the local tidy removes only:
 * (a) filler sounds (um, uh, er, hmm), and an opening "yeah / well / okay /
 *     so" before the teller's first words;
 * (b) a "like" set off by commas on both sides, or one directly before an
 *     intensifier or adverb (really, so, very, just, kind of, sort of, -ly)
 *     or before a verb after its subject ("and like worked");
 * (c) a slip word said twice in a row (I, I / the the / and, and /
 *     that's, that's);
 * (d) a broken-off clause the speaker restarts in their own next words
 *     ("So we did like a, we built an app");
 * (e) the other person's back-channel lines ("Wow, that's amazing.",
 *     "Wait, were you?"), never a reply that answers a question.
 * Everything else stays, word for word. The other person's question is set
 * as "We asked" only when the transcript names the speaker, or when the
 * asker plainly goes on and the teller answers with a back-channel ("For
 * sure."). The stored text is never touched, and the page always offers
 * the exact words beside the tidied ones.
 */

const FILLER = /(^|[\s,;(—–])(?:u+m+|u+h+|uhm|erm|er|e+h|hmm+|mm+)(?=[\s,.;:!?)—–]|$)[,]?/gi;
const BACKCHANNEL_WORD = "(?:yeah|yes|yep|yup|right|okay|ok|oh|ah|wait|mm-?hmm|uh-?huh|for sure|sure|exactly|totally|definitely|absolutely|of course|really|true|i see|got it|nice|wow|cool)";
const REACTION = "(?:that'?s|that’s|so) (?:amazing|awesome|great|cool|so cool|incredible|wild|interesting|fun|nice)";
const BACKCHANNEL = new RegExp(`^(?:${BACKCHANNEL_WORD}|${REACTION})(?:[,\\s]+(?:${BACKCHANNEL_WORD}|${REACTION}))*[.!?…]*$`, "i");
/**
 * (a) An opening "yeah / well / okay / so" (with any filler sound) before the teller's first words: "Yeah well so I
 * started…" → "I started…". Only at the start of the teller's words, never inside them.
 */
const OPENING_FILLER = /^(?:(?:yeah|well|okay|ok|so|um+|uh+)[,.]?\s+)+/i;
/** (a) A "yeah," or "so yeah," that opens a later sentence: "Yeah, gaming and mental health, right?" → "Gaming…". */
const LATER_YEAH = /^(?:so\s+)?yeah,\s+(?=\S)/i;
/** (a) A closing ", but yeah" or ", yeah" at the end of a sentence: "…what my parents did, but yeah." → "…did." */
const CLOSING_YEAH = /,\s*(?:but\s+)?yeah(?=[.!?…]*["”’)]*$)/i;
/** A short question that reads as the other person's ("Wait, were you?", "Do they open to non-students as well?"), not a tag ("…, right?"). */
const ASK = /^(?:and\s+|so\s+)?(?:do|did|does|is|are|was|were|how|what|why|when|where|who|which|can|could|would|will|have|has)\b[^?]{0,80}\?["”’]*$/i;
/** A reaction, not a question to answer ("Wait, were you?", "Really?"): it is the other person's, and dropped. */
const REACTION_Q = /^(?:wait|really|seriously|oh|huh)\b/i;
const TAG = /\b(?:right|you know|isn't it|wasn't it|okay|yeah|huh)\?["”’]*$/i;
/**
 * The asker plainly going on after their question, about themselves ("Because our strategy right now is…", "We're
 * going to…"): it counts only when the teller then answers with a back-channel ("For sure."), as in 5963. "Because the
 * soldiers came…" or "We were rice farmers" with nothing after is the teller's answer.
 */
const ASKER_GOES_ON = /^(?:(?:because|and|so)\s+)?(?:our|we're|we’re|we are|we'll|we’ll|we will|we want)\b/i;
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

/**
 * (b) The "like" the closed list removes, and no other:
 * - set off by commas on both sides ("It was, like, the hardest thing" → "It was the hardest thing");
 * - directly before an intensifier or adverb ("like really good", "like kind of", "like totally");
 * - before a verb after its subject or "and" ("and like worked a corporate job").
 * Every other "like" stays: it compares ("like brothers"), hedges ("like for a year", "like ten"), quotes ("I'm like,
 * why"), or is the verb.
 */
function dropFillerLike(s: string): string {
  return s
    .replace(/,\s*like,\s*/gi, " ")
    .replace(/\blike\b\s*/gi, (m: string, at: number, all: string) => (isFillerLike(all, at) ? "" : m))
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
    // never a full stop after a word no sentence ends on ("…and then my. So my mom…"): the next clause word is tried
    while (m && /\b(?:a|an|the|my|our|their|your|his|her|its|to|of|and|or|then|in|on|at|for|with|from|but|so)$/i.test(rest.slice(0, m.index).trim())) m = re.exec(rest);
    if (!m || rest.length - m.index < 40) break;
    out.push(`${rest.slice(0, m.index).replace(/[,;:]$/, "")}.`);
    rest = cap(rest.slice(m.index + 1));
  }
  out.push(rest);
  return out;
}

/**
 * A clause said and then restarted, dropped only when that is certain (rule 17a):
 * - it is a true prefix of the next clause, of two words or more ("we went to, we went to the market");
 * - it breaks off on an article or a possessive and the speaker restarts it in their own next words, reopening on the
 *   same subject ("So we did like a, we built an app" → "we built an app").
 * Never otherwise: a clause that ends on "to" is whole by ellipsis ("I wanted to, but I couldn't"); one that opens like
 * the next is said ("We laughed, we cried"); a single word is emphasis ("Never, never again"); and a next clause that
 * opens on "but", "and" or "so" goes on from it rather than restarting it.
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
      // a true prefix that breaks off where no clause ends ("we went to, we went to the market"); one that is whole
      // ("Every day, every day she called") is emphasis and stays
      const prefix = na.includes(" ") && nb.length > na.length && nb.startsWith(`${na} `) && /\b(?:a|an|the|my|our|their|your|his|her|to|of|in|at|on|for|with|from|and|but|or|so|that|is|was|were)$/i.test(a.trim());
      const subject = (x: string) => x.replace(/^(?:so|and|but|then)\s+/, "").split(" ")[0];
      const restart = a.trim().split(/\s+/).length <= 6 && BREAKS_OFF.test(a.trim()) && !/^(?:but|and|so)\b/.test(nb) && !!subject(na) && subject(na) === subject(nb);
      if (prefix || restart) continue;
    }
    out.push(a);
  }
  return out.join(", ");
}

/** A clause that stops where no clause can end: on an article or a possessive ("we did a,"). Never "to" or "of". */
const BREAKS_OFF = /\b(?:a|an|the|my|our|their|your)$/i;

/**
 * (c) A slip word said twice or more in a row, collapsed to one: a pronoun, an article, a conjunction, or one of the
 * short contractions ("I, I went", "the the house", "and, and", "that's, that's", "we we we"). Any other word or
 * phrase said twice stays: it is emphasis or a refrain ("a big big house", "never, never again", "thank you, thank
 * you", "and then and then").
 */
const SLIP = "i|you|he|she|we|they|it|me|him|her|us|them|my|our|your|his|their|its|a|an|the|and|or|but|then|because|if|that['’]s|it['’]s|i['’]m|we['’]re|they['’]re|he['’]s|she['’]s|there['’]s|i['’]ve|we['’]ve|i['’]d|you['’]re|i['’]ll|we['’]ll|was|is";
const SLIP_TWICE = new RegExp(`\\b(${SLIP})(?:,?\\s+\\1)+\\b`, "gi");
/** Whether a sentence is the other person's back-channel ("Yeah, right?", "Wow, that's amazing"). */
const isBackchannel = (s: string) => {
  const t = s.replace(/["“”]/g, "").trim();
  // a reaction asked back ("Really?", "Wait, were you?"), three words or fewer, is back-channel too; a longer one may be
  // the teller's own ("Oh, how could I ever forget that day?") and stays
  return BACKCHANNEL.test(t) || (/\?$/.test(t) && REACTION_Q.test(t) && t.split(/\s+/).length <= 3);
};
/** A question (not a tag, "…, right?"): what follows it, however short, is the answer. */
const isQuestion = (s: string) => /\?["”’)]*$/.test(s.trim()) && !TAG.test(s.trim());


const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();

/**
 * One paragraph of speech, tidied by the closed list and nothing else. `answer`: the paragraph opens on the reply to a
 * question (lifted to "We asked", or ending the paragraph before), so its first short lines stay. `opening`: these
 * are the teller's first words, so an opening "yeah / well / okay / so" goes (a).
 */
export function cleanSpeech(text: string, { answer = false, opening = false }: { answer?: boolean; opening?: boolean } = {}): string {
  let turns = tellerTurns(String(text || ""));
  if (opening) {
    // (a) the opening throat-clearing; never a word doubled for emphasis ("So, so good", "Okay, okay, I'll go")
    const m = turns.match(OPENING_FILLER);
    const run = m ? m[0].toLowerCase().match(/[a-z]+/g) || [] : [];
    if (m && !(run.length > 1 && run.every((w) => w === run[0]))) turns = turns.slice(m[0].length);
  }
  const kept: string[] = [];
  // (e) the other person's back-channel goes; a reply straight after a question ("Yes.", "Yeah, of course.") is the
  // answer and stays whole, as said
  let answering = answer;
  for (const raw of sentencesOf(turns)) {
    const s = raw.trim();
    if (!s) continue;
    const back = isBackchannel(s);
    if (back && answering) {
      kept.push(s);
      continue;
    }
    if (back) {
      // a back-channel line that goes ("Wait, were you?") leaves nothing to answer
      answering = false;
      continue;
    }
    // (a) a "yeah," or "so yeah," opening a later sentence, and a closing ", but yeah" / ", yeah": throat-clearing,
    // except in an answer ("Did you go? Yeah, I went." keeps its "Yeah")
    const plain = answering ? s : s.replace(LATER_YEAH, "").replace(CLOSING_YEAH, "");
    answering = isQuestion(s);
    const tidied = [
      plain
        .replace(FILLER, "$1") // (a)
        .replace(SLIP_TWICE, "$1") // (c)
        .replace(/^[\s,;:]+/, ""),
    ]
      .map(dropFillerLike) // (b)
      .map(dropRestarts) // (d)
      .flatMap(punctuateRunOn) // punctuation by sense: the words never change
      .filter((x) => /[\p{L}\p{N}]/u.test(x));
    for (const x of tidied) kept.push(cap(x));
  }
  return kept
    .join(" ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([,;:])\s*([,.;:!?])/g, "$2")
    .replace(/^[\s,;:]+/, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    // speech ends a thought with a full stop the transcript forgot
    .replace(/([\p{L}\p{N}])$/u, "$1.");
}

/**
 * The other person's question in an unlabelled transcript, set as "We asked" only in the shape that leaves no doubt:
 * the question, the asker plainly going on ("Because our strategy right now is…"), then the teller answering with a
 * back-channel ("For sure."). Every other question stays in the teller's words, and so does the sentence after it.
 */
function liftQuestions(paragraph: string): string[] {
  const out: string[] = [];
  const all = sentencesOf(paragraph).map((x) => x.trim()).filter(Boolean);
  let run = "";
  for (let i = 0; i < all.length; i++) {
    const s = all[i];
    const goesOn = all[i + 1];
    const reply = all[i + 2];
    if (ASK.test(s) && !TAG.test(s) && goesOn && ASKER_GOES_ON.test(goesOn) && reply && isBackchannel(reply)) {
      if (run.trim()) out.push(run.trim());
      out.push(`${ASKED}${s} ${goesOn}`);
      run = ANSWER;
      i++;
      continue;
    }
    run += `${s} `;
  }
  if (run.replace(ANSWER, "").trim()) out.push(run.trim());
  return out;
}

/**
 * A paragraph with named speakers: the teller's turns are their words; the other person's question is set as "We
 * asked" (the transcript names the speaker); the other person's other lines are theirs, not the teller's memory.
 */
function namedTurns(paragraph: string): string[] | null {
  TURN.lastIndex = 0;
  if (!TURN.test(paragraph)) return null;
  const parts = paragraph.split(TURN);
  const out: string[] = [];
  let run = parts[0].trim() ? `${parts[0].trim()} ` : "";
  for (let i = 1; i < parts.length; i += 2) {
    const words = (parts[i + 1] || "").trim();
    if (!words) continue;
    if (OTHER.test(parts[i])) {
      const asked = sentencesOf(words).map((x) => x.trim()).filter((x) => isQuestion(x));
      if (asked.length) {
        if (run.replace(ANSWER, "").trim()) out.push(run.trim());
        out.push(`${ASKED}${asked.join(" ")}`);
        run = ANSWER;
      }
      continue;
    }
    run += `${words} `;
  }
  if (run.replace(ANSWER, "").trim()) out.push(run.trim());
  return out;
}

/**
 * Every paragraph tidied by the closed list; a paragraph that was only back-channel disappears; "We asked" stands
 * apart. A paragraph that follows a question (a "We asked" line, or a paragraph ending on one) opens on its answer,
 * which stays whole, across the paragraph break too.
 */
export function cleanTranscript(paragraphs: string[]): string[] {
  const pieces = paragraphs.flatMap((p) => {
    const one = p.replace(/\s*\n\s*/g, " ");
    return namedTurns(one) ?? liftQuestions(one);
  });
  const out: string[] = [];
  let first = true;
  let afterQuestion = false;
  for (const p of pieces) {
    if (p.startsWith(ASKED)) {
      out.push(p);
      afterQuestion = true;
      continue;
    }
    const answers = p.startsWith(ANSWER) || afterQuestion;
    const words = p.startsWith(ANSWER) ? p.slice(ANSWER.length) : p;
    const tidied = cleanSpeech(words, { answer: answers, opening: first });
    first = false;
    const last = sentencesOf(words).map((x) => x.trim()).filter(Boolean).pop() || "";
    afterQuestion = isQuestion(last);
    if (tidied.trim()) out.push(tidied);
  }
  return out;
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

/** Whether a sentence holds a "like" the closed list would remove (b): a kept line is never one that tidying changes. */
function fillerLike(s: string): boolean {
  if (/,\s*like,/i.test(s)) return true;
  for (const m of s.matchAll(/\blike\b/gi)) if (isFillerLike(s, m.index ?? 0)) return true;
  return false;
}

/** The intensifiers and adverbs a filler "like" stands before (b); "-ly" words count, except the common nouns and adjectives that end so. */
const INTENSIFIER = /^(?:really|so|very|just|kind of|sort of|kinda|sorta|super|totally|pretty|literally|actually|basically|honestly|seriously|definitely|absolutely)\b/i;
const NOT_ADVERB = /^(?:early|only|family|daily|weekly|monthly|yearly|holy|ally|italy|july|lily|emily|billy|sally|molly|kelly|belly|jelly|lovely|lonely|ugly|silly|friendly|elderly|likely|ugly|curly|chilly|bully|reply|supply|apply|rely|fly|july)$/i;
/** A verb after its subject, where "like" fills ("and like worked", "we like went"): a past form, regular or common. */
const PAST_VERB = /^(?:[a-z]+ed|went|got|had|did|said|told|took|made|came|saw|knew|thought|gave|ran|sat|stood|left|found|felt|kept|brought|bought|began|grew|wrote|spoke|lost|won|paid|met|heard|built|sent|spent|taught|caught|fought|sold|put|set|let|cut|quit|drove|flew|ate|fell|sang|swam|woke)$/i;
const SUBJECT = /^(?:and|then|i|we|they|he|she|you)$/i;

/** Whether the "like" at `at` in `s` is one the closed list removes (b), and only that. */
function isFillerLike(s: string, at: number): boolean {
  const before = s.slice(0, at);
  const after = s.slice(at + 4);
  if (/^,/.test(after.trim()) && /,\s*$/.test(before)) return true; // set off by commas on both sides
  if (/^\s*,/.test(after) || /,\s*$/.test(before)) return false; // a comma on one side only: a quote ("I'm like, why")
  const next = after.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^\p{L}'’]/gu, "") || "";
  const prev = before.trim().split(/\s+/).pop()?.toLowerCase().replace(/[^\p{L}'’]/gu, "") || "";
  if (INTENSIFIER.test(after.trim()) || (/ly$/.test(next) && next.length > 3 && !NOT_ADVERB.test(next))) return true;
  return SUBJECT.test(prev) && PAST_VERB.test(next);
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
