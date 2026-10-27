// What a person said, fit to quote (FB-511). A memory's body may be a raw
// transcript ("Storyteller: Um thì với mình nói chuyện với cái này nhé.");
// a quote on a page is never a speaker label, a filler opening or a
// fragment. Pure, so it's tested (scripts/test-P-hab.mjs).
//
//   quoteText(text, { title, max, min })  the first real sentence of
//       substance in `text`, labels and fillers off; else `title`; else "".
//   quoteOf(memory, { max, min })          the memory's kept line when it
//       stands as a quote, else quoteText(body), else its title.
//   cleanSpeech(text)                      the whole text with the speaker
//       labels off and the interviewer's turns dropped (for a sentence
//       that is set whole, never cut).
//
// The rules:
//   - A label at the start of a line (or after a sentence's end) is one to
//     three capitalised words and a colon: "Storyteller:", "Interviewer:",
//     "AI:", "A Story:", "Rose Miller:". The asker's turns (Interviewer,
//     AI, A Story, Assistant, Q, Host, Người phỏng vấn) are dropped whole.
//   - Fillers at a sentence's start go, as many as there are: um, uh, er,
//     hmm, mm, ừ, ừm, ờ, ờm, à, ừa, ơ, thì, dạ… always; so, well, okay,
//     yeah, like, you know, I mean, vâng, kiểu, nói chung (là) only when a
//     comma or a pause follows ("So many years" stays).
//   - A sentence of substance has enough words (5; 7 when it is written
//     with Vietnamese tones, whose words are single syllables), isn't a
//     question, and isn't about the recording ("can you hear me", "nói
//     chuyện với cái này").
//   - Too long for `max`: cut at the last clause (",", ";", " – ") that
//     still has substance, else at a word, with "…". Never mid-word.

const clean = (v) => String(v ?? "").replace(/\s+/g, " ").trim();

// The asker's labels: their turns aren't the teller's words.
const ASKER = /^(interviewer|interview|ai|a story|astory|assistant|q|question|host|người phỏng vấn|phỏng vấn viên|phỏng vấn|hỏi|câu hỏi)$/i;
// One to three words that start with a capital (or "AI", "Q"), then a colon.
const LABEL = /^((?:[A-ZÀ-ỸĐ][\p{L}'’.-]*)(?:\s+[A-Za-zÀ-ỹĐđ][\p{L}'’.-]*){0,2})\s*:\s+/u;

const NOISE = "um+|umm+|uh+|uhm+|uh-huh|er+|erm+|hmm+|hm+|mm+|mhm|ah+|ahh+|ừ+|ừm+|ừa|ờ+|ờm+|ơ+|à+|ạ|ừ thì|à thì|ờ thì|thì|dạ|ùm+|hừm+|ừ ừ";
const SOFT = "so|well|okay|ok|yeah|yes|like|right|alright|you know|i mean|anyway|vâng|kiểu|kiểu như|nói chung|nói chung là|thế|vậy|rồi|ừ được";
const NOISE_RE = new RegExp(`^(?:${NOISE})(?:[\\s,.…!-]+|$)`, "iu");
const SOFT_RE = new RegExp(`^(?:${SOFT})(?:\\s*[,…]+\\s*|\\s*\\.{2,}\\s*|\\s+-+\\s+)`, "iu");
const SOFT_BARE_RE = new RegExp(`^(?:${SOFT})\\s+`, "iu");
// "Thì ra" means "so it turns out": a real start, not a filler.
const KEEP_RE = /^thì ra\b/iu;

// Talk about the recording itself, never a quote.
const META = [
  /\b(can you hear me|is (this|it)( thing)? (on|recording)|are we recording|testing,? testing|hello\??$|let'?s (start|begin|talk)|start(ed)? recording)\b/i,
  /(nghe (được|rõ) không|có nghe không|ghi âm|nói chuyện với cái này|nói với cái (này|máy)|bắt đầu (nhé|nha|thôi)|a lô|alô|alo\b)/iu,
];

const VI_TONES = /[ạảãàáâậầấẩẫăắằặẳẵẹẻẽèéêếềệểễịỉĩìíọỏõòóôốồộổỗơớờợởỡụủũùúưứừựửữỵỷỹỳýđ]/iu;

function upFirst(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/* The text with the labels off and the asker's turns dropped. */
export function cleanSpeech(text) {
  const raw = String(text ?? "").replace(/\r/g, "");
  if (!raw.trim()) return "";
  // Each line (or sentence after a full stop) may open with a label.
  const parts = raw
    .split(/\n+|(?<=[.!?…])\s+(?=(?:[A-ZÀ-ỸĐ][\p{L}'’.-]*)(?:\s+[A-Za-zÀ-ỹĐđ][\p{L}'’.-]*){0,2}\s*:\s)/u)
    .map((p) => p.trim())
    .filter(Boolean);
  const out = [];
  let asker = false;
  for (const p of parts) {
    const m = LABEL.exec(p);
    if (m) {
      asker = ASKER.test(m[1].trim());
      if (!asker) out.push(p.slice(m[0].length));
    } else if (!asker) out.push(p);
  }
  return clean(out.join(" "));
}

/* A recorded transcript, set as her words on the memory's page (QA Q-1,
   FB-511): the teller's turns as paragraphs with their labels off and an
   opening filler off (the closed list above); the asker's turns dropped;
   a turn that is only talk about the recording ("is this thing
   recording?") dropped. Text that isn't a transcript comes back exactly
   as it was. Never stored: the body keeps every word. */
export function readableTranscript(text) {
  const raw = String(text ?? "").replace(/\r/g, "");
  const parts = raw
    .split(/\n+|(?<=[.!?…])\s+(?=(?:[A-ZÀ-ỸĐ][\p{L}'’.-]*)(?:\s+[A-Za-zÀ-ỹĐđ][\p{L}'’.-]*){0,2}\s*:\s)/u)
    .map((p) => p.trim())
    .filter(Boolean);
  const labelled = parts.map((p) => LABEL.exec(p)).filter(Boolean);
  const known = labelled.some((m) => ASKER.test(m[1].trim()) || /^(storyteller|teller|narrator|người kể)$/i.test(m[1].trim()));
  if (!known && labelled.length < 2) return raw.trim();
  const out = [];
  let asker = false;
  for (const p of parts) {
    const m = LABEL.exec(p);
    if (m) asker = ASKER.test(m[1].trim());
    if (asker) continue;
    const said = clean(m ? p.slice(m[0].length) : p);
    const kept = sentences(said)
      .map((s, i) => (i === 0 ? stripFiller(s) : s))
      .filter((s) => s && !META.some((re) => re.test(stripFiller(s))));
    const para = kept.join(" ").trim();
    if (para && /[\p{L}\p{N}]/u.test(para)) out.push(para);
  }
  return out.join("\n\n");
}

/* The fillers off the start of a sentence, as many as there are. */
export function stripFiller(sentence) {
  let s = clean(sentence).replace(/^[-–—…,.\s]+/, "");
  let noise = false;
  for (let i = 0; i < 8; i++) {
    if (KEEP_RE.test(s)) break;
    const quiet = s.replace(NOISE_RE, "");
    if (quiet !== s) noise = true;
    // Right after an "um", a soft word is filler too: "um so we moved".
    const next = quiet.replace(SOFT_RE, "").replace(noise ? SOFT_BARE_RE : /^$/, "").replace(/^[-–—…,.\s]+/, "");
    if (next === s) break;
    s = next;
  }
  return upFirst(s);
}

const wordsIn = (s) => clean(s).split(" ").filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
const minWords = (s, min) => (min != null ? min : VI_TONES.test(s) ? 7 : 5);

/* Is this sentence worth quoting? */
export function hasSubstance(sentence, min) {
  const s = clean(sentence);
  if (!s) return false;
  if (/\?\s*["”’]?$/.test(s)) return false;
  if (META.some((re) => re.test(s))) return false;
  return wordsIn(s) >= minWords(s, min);
}

/* Sentences, with their stops. Unpunctuated speech is one sentence. */
function sentences(text) {
  const t = clean(text);
  if (!t) return [];
  return (t.match(/[^.!?…]+(?:[.!?…]+["”’)]*|$)/gu) || [t]).map((s) => s.trim()).filter(Boolean);
}

/* Cut a long sentence at a clause that still says something, or a word. */
function fit(s, max, min) {
  if (s.length <= max) return s;
  const head = s.slice(0, max);
  const clause = Math.max(head.lastIndexOf(", "), head.lastIndexOf("; "), head.lastIndexOf(" – "), head.lastIndexOf(" — "));
  if (clause > 0 && hasSubstance(head.slice(0, clause), min)) return `${head.slice(0, clause).replace(/[,;\s–—]+$/, "")}…`;
  return `${head.replace(/\s+\S*$/, "").replace(/[,;:\s–—-]+$/, "")}…`;
}

/* The first real sentence of substance, else the title, else "". */
export function quoteText(text, { title = "", max = 220, min = null } = {}) {
  const said = cleanSpeech(text);
  const list = sentences(said).map(stripFiller).filter(Boolean);
  const pick = list.find((s) => hasSubstance(s, min));
  if (pick) return fit(pick, max, min);
  return clean(title);
}

/* A kept line, if it stands as a quote; else the body's first real
   sentence; else the title. */
export function quoteOf(memory, { max = 220, min = null } = {}) {
  if (!memory) return "";
  const line = stripFiller(cleanSpeech(memory.keptLine));
  if (line && hasSubstance(line, Math.min(minWords(line, min), 4))) return fit(line, max, min);
  return quoteText(memory.body, { title: memory.title || "", max, min });
}

/* Is `quote` the memory's own words (so it may wear quotation marks), or
   only its title (the fallback)? */
export function isTitleFallback(quote, memory) {
  return !!quote && clean(quote) === clean(memory?.title) && !clean(memory?.body).startsWith(clean(quote));
}
