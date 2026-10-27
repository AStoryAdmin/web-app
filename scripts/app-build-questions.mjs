// Compiles content/questions.csv into src/data/interview.js.
//
//   npm run questions
//
// The question bank is content, not code: it gets written and rewritten by
// people who shouldn't have to open a JavaScript file, and reviewed by people
// who want to see it as a table. So it lives as a CSV — editable in Excel or
// Google Sheets, diffable line by line in git — and this turns it into the
// array the app ships with. The app never parses a spreadsheet at runtime.
//
// Nothing is generated silently: every row is checked first, and a bad row
// fails the build with the line to fix rather than quietly shipping a prompt
// that addresses somebody by their own name.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseCsvRows } from "../src/lib/importers.js";
import { ERAS } from "../src/data/eras.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "content", "questions.csv");
const TARGET = join(ROOT, "src", "data", "interview.js");

// The cap was 52, back when the picker clamped every question to one line and
// shrank the type to make it fit — past 52 characters an 80-year-old couldn't
// read it. The picker wraps now (components/QuestionPicker.js), so the real
// limit is what still reads as one question rather than two.
//
// 64 buys the clause that carries the context: "When did you leave school?" is
// a fact-check, "How old were you when you left school, and whose choice was
// it?" is a story. Past this, the second half belongs in follow_up.
export const MAX_QUESTION_LENGTH = 64;

const COLUMNS = [
  "id",
  "chapter",
  "topic",
  "question",
  "follow_up",
  "hint",
  "tags",
  "sensitive",
  "depth",
];

// Optional, last column. Every question is written to the storyteller, but
// a grandson opening his grandfather's story is not the one who grew up in
// that house — asking him "what did your father's hands look like?" asks
// about the wrong life. `about` is the same question turned around for a
// relative telling a memory about the storyteller, naming them as {name}:
// "What has {name} told you about the house they grew up in?". Blank means
// only the storyteller can answer it ("what do you regret?"), so the app
// leaves it out when a relative is the one talking.
const ABOUT_COLUMN = "about";

// Optional. What a question can't be answered without: "Where were you when
// your first child was born?" needs children. The app holds a row back from
// a storyteller the family tree says doesn't have it, and from anybody it
// doesn't know about yet while they are new (lib/questionVoice.js needsMet).
// Better an inclusive wording than a need; a need where the specific
// question is the good one.
const NEEDS_COLUMN = "needs";
export const NEEDS_KINDS = ["partner", "children", "grandchildren", "siblings", "faith", "work", "school", "moved", "loss"];

// Optional. Earlier wordings of a question, separated by "|". A memory's
// title is the question it answered, so rewording a row would offer it again
// to everyone who already told it; these keep counting as answered.
const WAS_COLUMN = "was";

// Words that only make sense after another question. Every row is dealt on
// its own, with nothing above it on Home, so "at that age" has no age.
const DANGLING = [
  /\bat that age\b/i, /\bthe two of you\b/i, /\binstead\?$/i,
  /\bthe hardest time\b/i, /\bback then\b/i, /\bthen\?$/i, /\btheir parent\b/i,
  /\bthe baby\b/i, /\bthe war\b/i,
];
// A memory test, not a question: someone with gaps hears "you should know this".
const MEMORY_TEST = /^(do you (know|remember)|what year\b)/i;
// How far in a question reaches. This is the difference between a bank and an
// interview: nobody's first question should be "what do you regret", and
// nobody eighty memories in still wants "where were you born". A real
// interviewer earns the right to ask, and the app can only do that if every
// question says how deep it goes.
//
//   1  warm-up    a fact, no stakes, answerable in the first minute
//   2  scene      one specific sensory episode
//   3  portrait   other people, and the things that repeated
//   4  stakes     conflict, cost, what it took
//   5  reckoning  judgement, regret, meaning, speaking to the reader
export const DEPTHS = {
  1: "warm-up",
  2: "scene",
  3: "portrait",
  4: "stakes",
  5: "reckoning",
};

// Questions that can open grief or shame, and shouldn't arrive unannounced on
// a Tuesday morning. The value names which kind, because "sensitive" on its
// own is a warning triangle — useless to a granddaughter deciding whether to
// put this one in front of her grandmother today. Blank for most of the bank:
// mark a quarter of it and the mark stops meaning anything.
export const SENSITIVE_KINDS = {
  loss: "touches on losing someone",
  hardship: "touches on hard years",
  rupture: "touches on a falling-out",
  private: "asks for something private",
};

// The one chapter written in somebody else's voice. Everywhere else the
// person answering is the person whose life it is — whoever set the account
// up — so the question says "you". Here a daughter or a grandson is the one
// talking, so the question has to name who it's about. {name} is allowed in
// this chapter and nowhere else, and the checks below enforce it from both
// sides, because getting this wrong is how the app ends up asking Rose what
// Rose would have said.
const FAMILY_VOICE_CHAPTER = "From the family";

// A named person is never "they" (PHILOSOPHY §5; FB-174, "Who did Rose look
// up to when they were young?"). Wherever a wording names somebody with
// {name} and needs a pronoun for them, it says {they}, {them} or {their},
// and the app fills in she/her or he/his from the family tree. When the tree
// doesn't say, the name itself stands in ("Rose's mother"), never "they". A
// bare they/them/their in a named wording fails the build. It is still fine
// in the storyteller's own questions, where it means other people ("what
// were they like?").
export const PRONOUN_TOKENS = ["{they}", "{them}", "{their}"];
const BARE_THEY = /(^|[^{])\b(they|them|their|theirs|themselves|they're|they'd|they've|they'll)\b(?!\})/i;
const KNOWN_TOKEN = /\{(name|they|them|their)\}/g;
export function namedWordingProblem(text) {
  if (BARE_THEY.test(text)) return `"${text}" calls a named person "they": use {they}, {them} or {their}`;
  const unknown = text.replace(KNOWN_TOKEN, "").match(/\{[^}]*\}/);
  if (unknown) return `"${text}" has an unknown token ${unknown[0]}`;
  return null;
}

export function loadQuestions(csv) {
  const rows = parseCsvRows(csv);
  if (!rows.length) throw new Error("questions.csv is empty");

  const header = rows[0].map((h) => h.trim());
  for (const col of COLUMNS) {
    if (!header.includes(col)) {
      throw new Error(`questions.csv is missing the "${col}" column`);
    }
  }
  const at = (row, col) => (row[header.indexOf(col)] || "").trim();

  const problems = [];
  const seen = new Set();
  const asked = new Map();
  const askedAbout = new Map();
  const questions = [];
  const hasAbout = header.includes(ABOUT_COLUMN);
  const hasNeeds = header.includes(NEEDS_COLUMN);
  const hasWas = header.includes(WAS_COLUMN);

  rows.slice(1).forEach((row, i) => {
    const line = i + 2; // 1-indexed, plus the header
    if (!row.some((cell) => cell.trim())) return; // blank spacer row

    const q = Object.fromEntries(COLUMNS.map((c) => [c, at(row, c)]));
    q.about = hasAbout ? at(row, ABOUT_COLUMN) : "";
    q.needs = hasNeeds ? at(row, NEEDS_COLUMN) : "";
    q.was = hasWas ? at(row, WAS_COLUMN) : "";
    const fail = (msg) => problems.push(`line ${line} (${q.id || "no id"}): ${msg}`);

    if (!q.id) fail("no id");
    else if (seen.has(q.id)) fail(`duplicate id "${q.id}"`);
    seen.add(q.id);

    // Two rows with different ids and the same words. Caught by hand twice
    // while the bank was being written — once across chapters, once inside
    // one — and both times it meant a deck could offer the same question
    // twice in a row. A unique id was never the thing that mattered.
    const words = q.question.toLowerCase().replace(/\s+/g, " ").trim();
    if (words && asked.has(words)) {
      fail(`same question as "${asked.get(words)}"`);
    }
    if (words) asked.set(words, q.id);

    if (!ERAS.includes(q.chapter)) {
      fail(`chapter "${q.chapter}" isn't one of the ten in src/data/eras.js`);
    }
    if (!q.topic) fail("no topic");
    const depth = Number(q.depth);
    if (!DEPTHS[depth]) {
      fail(`depth "${q.depth}" isn't 1-5 (${Object.values(DEPTHS).join(", ")})`);
    }
    // A question that can open grief is never a warm-up, whatever the
    // spreadsheet says — that pairing is how somebody gets asked who they
    // lost in their first minute using this.
    if (q.sensitive && depth < 4) {
      fail(`marked "${q.sensitive}" at depth ${q.depth} — those belong at 4 or 5`);
    }
    if (!q.question) fail("no question");
    if (q.sensitive && !SENSITIVE_KINDS[q.sensitive]) {
      fail(
        `sensitive "${q.sensitive}" isn't one of: ${Object.keys(SENSITIVE_KINDS).join(", ")}`
      );
    }
    if (!q.follow_up) fail("no follow_up");
    if (!q.hint) fail("no hint");
    for (const re of DANGLING) {
      if (re.test(q.question)) fail(`"${q.question.match(re)[0]}" needs another question above it to mean anything`);
    }
    if (MEMORY_TEST.test(q.question)) fail("reads as a memory test; ask for the thing itself");
    for (const [col, text] of [["question", q.question], ["follow_up", q.follow_up], ["hint", q.hint], ["about", q.about]]) {
      if (text.includes("\u2014")) fail(`em-dash in ${col}`);
    }
    const plain = (t) => t.toLowerCase().replace(/[^a-z ]/g, "").trim();
    if (plain(q.follow_up) === plain(q.question)) fail("follow_up repeats the question");
    if (plain(q.hint) === plain(q.question)) fail("hint repeats the question");
    for (const need of q.needs ? q.needs.split(";").map((t) => t.trim()).filter(Boolean) : []) {
      if (!NEEDS_KINDS.includes(need)) fail(`needs "${need}" isn't one of: ${NEEDS_KINDS.join(", ")}`);
    }

    const isFamilyVoice = q.chapter === FAMILY_VOICE_CHAPTER;
    if (q.question.includes("{name}") && !isFamilyVoice) {
      fail(`{name} only belongs in "${FAMILY_VOICE_CHAPTER}" — say "you" here`);
    }
    if (isFamilyVoice && !q.question.includes("{name}")) {
      fail(`"${FAMILY_VOICE_CHAPTER}" questions must name who they're about`);
    }
    if (isFamilyVoice && namedWordingProblem(q.question)) fail(namedWordingProblem(q.question));
    if (!isFamilyVoice && /\{(they|them|their)\}/.test(q.question)) {
      fail("a pronoun token only belongs beside {name}");
    }

    if (q.question.length > MAX_QUESTION_LENGTH) {
      fail(`question is ${q.question.length} chars, over ${MAX_QUESTION_LENGTH}`);
    }
    if (!/[?.]$/.test(q.question)) fail("question should end in a question mark");

    // The relative's wording. It has to say who it's about, read as one
    // question, and never ask a relative to tell somebody else's secret or
    // take a side in somebody else's falling-out. "From the family" is the
    // exception: there the relative is telling their own side of their own
    // relationship ("did you and {name} ever fall out?").
    if (q.about) {
      if (!q.about.includes("{name}")) {
        fail(`about "${q.about}" must name who it's about with {name}`);
      }
      if (q.about.length > MAX_QUESTION_LENGTH) {
        fail(`about is ${q.about.length} chars, over ${MAX_QUESTION_LENGTH}`);
      }
      if (!/[?.]$/.test(q.about)) fail("about should end in a question mark");
      if (namedWordingProblem(q.about)) fail(`about ${namedWordingProblem(q.about)}`);
      if (!isFamilyVoice && (q.sensitive === "private" || q.sensitive === "rupture")) {
        fail(`marked "${q.sensitive}" — only the storyteller tells that, leave about blank`);
      }
      const aboutWords = q.about.toLowerCase().replace(/\s+/g, " ").trim();
      if (askedAbout.has(aboutWords)) {
        fail(`same about wording as "${askedAbout.get(aboutWords)}"`);
      }
      askedAbout.set(aboutWords, q.id);
    } else if (isFamilyVoice && hasAbout) {
      fail(`"${FAMILY_VOICE_CHAPTER}" is always a relative talking — fill in about`);
    }

    questions.push({
      id: q.id,
      era: q.chapter,
      topic: q.topic,
      question: q.question,
      followUp: q.follow_up,
      hint: q.hint,
      sensitive: q.sensitive || null,
      depth: Number(q.depth),
      tags: q.tags ? q.tags.split(";").map((t) => t.trim()).filter(Boolean) : [],
      about: q.about || null,
      needs: q.needs ? q.needs.split(";").map((t) => t.trim()).filter(Boolean) : [],
      was: q.was ? q.was.split("|").map((t) => t.trim()).filter(Boolean) : [],
    });
  });

  if (problems.length) {
    throw new Error(
      `questions.csv has ${problems.length} problem(s):\n  ` + problems.join("\n  ")
    );
  }
  return questions;
}

function render(questions) {
  const byChapter = ERAS.map((era) => ({
    era,
    items: questions.filter((q) => q.era === era),
  })).filter((g) => g.items.length);

  const body = byChapter
    .map(
      (g) =>
        `  // ── ${g.era} (${g.items.length}) ──\n` +
        g.items
          .map(
            (q) => `  {
    id: ${JSON.stringify(q.id)},
    question: ${JSON.stringify(q.question)},
    followUp: ${JSON.stringify(q.followUp)},
    hint: ${JSON.stringify(q.hint)},
    topic: ${JSON.stringify(q.topic)},
    sensitive: ${JSON.stringify(q.sensitive)},
    depth: ${JSON.stringify(q.depth)},
    tags: ${JSON.stringify(q.tags)},
    era: ${JSON.stringify(q.era)},
    about: ${JSON.stringify(q.about)},
    needs: ${JSON.stringify(q.needs)},
    was: ${JSON.stringify(q.was)},
  },`
          )
          .join("\n")
    )
    .join("\n\n");

  const header = [
    "// GENERATED FILE — do not edit by hand.",
    "//",
    "// The question bank lives in content/questions.csv, which opens in Excel or",
    "// Google Sheets. Edit it there, then run:",
    "//",
    "//   npm run questions",
    "//",
    `// ${questions.length} questions across ${byChapter.length} chapters.`,
    "//",
    "// Every question is asked of the storyteller, in the second person. The",
    "// person answering is the person whose life it is, whoever set the account",
    '// up — so a grandmother is asked "what did you do when it rained?", never',
    '// "what did Rose do when it rained?". The one exception is "From the',
    '// family", where a relative is the one talking, so those name who they are',
    "// about with {name}.",
    "//",
    "// `followUp` digs one layer deeper once they have started; `hint` is the",
    '// line under the box saying what a good answer looks like — the difference',
    '// between "tell me about your childhood home" and a paragraph somebody',
    "// actually writes. `topic` is the sub-subject within a chapter, which is",
    "// what stops a day's questions all landing on the same thing.",
    "//",
    "// `sensitive` is null for most questions. Where it is set it names what",
    "// the question could open — loss, hardship, rupture or private — so the",
    "// app can warn gently and by name rather than with a warning triangle.",
    "//",
    "// `about` is the question turned around for a relative telling a memory",
    "// about the storyteller ({name}). null means only the storyteller can",
    "// answer it. getAboutPrompts() returns the relative's version of the bank.",
  ].join("\n");

  return `${header}

const RAW_PROMPTS = [
${body}
];

// {name} and the pronoun tokens, filled. \`pronoun\` is "she", "he" or null,
// from the family tree (lib/questionVoice.js pronounOf). Without one the
// name stands in for the pronoun, because a named person is never "they"
// (FB-174): "What has Rose told you about Rose's mother?" is plain and true.
// With no name at all, the person is unnamed, and they/them is right.
const PRONOUNS = {
  she: { they: "she", them: "her", their: "her" },
  he: { they: "he", them: "him", their: "his" },
  unnamed: { they: "they", them: "them", their: "their" },
};
function fill(text, personName, fallback, pronoun) {
  const name = personName || fallback;
  const p = !personName ? PRONOUNS.unnamed : PRONOUNS[pronoun] || { they: name, them: name, their: \`\${name}'s\` };
  return text
    .replace(/\\{name\\}/g, name)
    .replace(/\\{they\\}/g, p.they)
    .replace(/\\{them\\}/g, p.them)
    .replace(/\\{their\\}/g, p.their);
}

// \`personName\` fills the {name} in "From the family" questions. Everywhere
// else the text is already addressed to the storyteller and passes straight
// through — there is no longer a voice to get wrong.
export function getPrompts(personName, { era, tag, pronoun = null } = {}) {
  let pool = RAW_PROMPTS;
  if (era) pool = pool.filter((p) => p.era === era);
  if (tag) pool = pool.filter((p) => p.tags.includes(tag));
  const source = pool.length ? pool : RAW_PROMPTS;

  return source.map((p) => ({
    id: p.id,
    question: fill(p.question, personName, "them", pronoun),
    followUp: fill(p.followUp, personName, "them", pronoun),
    hint: fill(p.hint, personName, "them", pronoun),
    topic: p.topic,
    sensitive: p.sensitive,
    depth: p.depth,
    tags: p.tags,
    era: p.era,
    about: p.about ? fill(p.about, personName, ABOUT_FALLBACK, pronoun) : null,
    needs: p.needs,
    was: p.was.map((t) => fill(t, personName, ABOUT_FALLBACK, pronoun)),
  }));
}

// With no name to hand, the about wordings say "this person": {name} sits in
// subject and possessive places ("Where was {name} born?", "{name}'s
// mother"), where "them" would not read as English.
const ABOUT_FALLBACK = "this person";

// The same bank for a relative telling a memory about the storyteller:
// only the questions a relative can answer, each in its \`about\` wording,
// naming the storyteller. \`followUp\` is left out — the follow-ups are
// written to the storyteller ("do you still make it?") and would ask the
// relative about their own life. \`hint\` is kept; hints show what a good
// answer looks like and read the same from either side.
export function getAboutPrompts(personName, { era, tag, pronoun = null } = {}) {
  let pool = RAW_PROMPTS.filter((p) => p.about);
  if (era) pool = pool.filter((p) => p.era === era);
  if (tag) pool = pool.filter((p) => p.tags.includes(tag));

  return pool.map((p) => ({
    id: p.id,
    question: fill(p.about, personName, ABOUT_FALLBACK, pronoun),
    followUp: null,
    hint: fill(p.hint, personName, ABOUT_FALLBACK, pronoun),
    topic: p.topic,
    sensitive: p.sensitive,
    depth: p.depth,
    tags: p.tags,
    era: p.era,
    about: null,
    needs: p.needs,
    was: p.was.map((t) => fill(t, personName, ABOUT_FALLBACK, pronoun)),
  }));
}

// Every question, unrendered — for counting, exporting and tests.
export const ALL_PROMPTS = RAW_PROMPTS;
`;
}

export function readBank() {
  return loadQuestions(readFileSync(SOURCE, "utf8"));
}

// Only writes when run directly. The tests import loadQuestions to check the
// CSV, and importing a module shouldn't rewrite a source file.
if ((process.argv[1] || "").endsWith("build-questions.mjs")) {
  const questions = readBank();
  writeFileSync(TARGET, render(questions));

  // Printed after every build, because a lopsided ladder is the failure mode
  // here: a bank that is all reckoning has no way in, and one that is all
  // warm-up never gets anywhere.
  const byDepth = Object.entries(DEPTHS)
    .map(([d, name]) => {
      const n = questions.filter((q) => q.depth === Number(d)).length;
      return `  ${String(n).padStart(4)}  ${d} ${name}`;
    })
    .join("\n");

  const counts = ERAS.map((era) => {
    const items = questions.filter((q) => q.era === era);
    const topics = new Set(items.map((q) => q.topic));
    return [era, items.length, topics.size];
  })
    .filter(([, n]) => n)
    .map(
      ([era, n, t]) =>
        `  ${String(n).padStart(3)}  ${era.padEnd(28)} ${t} topics`
    )
    .join("\n");
  const aboutCount = questions.filter((q) => q.about).length;
  const needsCount = questions.filter((q) => q.needs.length).length;
  const yesNo = questions.filter((q) => /^(is|was|were|did|do|does|have|has|are|can|could|would)\b/i.test(q.question));
  console.log(
    `${questions.length} questions → src/data/interview.js\n${counts}\n\n${byDepth}\n\n` +
      `  ${String(aboutCount).padStart(4)}  with a wording for relatives (about)\n` +
      `  ${String(needsCount).padStart(4)}  held back where they don't fit (needs)\n` +
      `  ${String(yesNo.length).padStart(4)}  open with yes/no${yesNo.length ? ": " + yesNo.map((q) => q.id).join(", ") : ""}`
  );
}
