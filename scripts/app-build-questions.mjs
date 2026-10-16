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

  rows.slice(1).forEach((row, i) => {
    const line = i + 2; // 1-indexed, plus the header
    if (!row.some((cell) => cell.trim())) return; // blank spacer row

    const q = Object.fromEntries(COLUMNS.map((c) => [c, at(row, c)]));
    q.about = hasAbout ? at(row, ABOUT_COLUMN) : "";
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

    const isFamilyVoice = q.chapter === FAMILY_VOICE_CHAPTER;
    if (q.question.includes("{name}") && !isFamilyVoice) {
      fail(`{name} only belongs in "${FAMILY_VOICE_CHAPTER}" — say "you" here`);
    }
    if (isFamilyVoice && !q.question.includes("{name}")) {
      fail(`"${FAMILY_VOICE_CHAPTER}" questions must name who they're about`);
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

// \`personName\` fills the {name} in "From the family" questions. Everywhere
// else the text is already addressed to the storyteller and passes straight
// through — there is no longer a voice to get wrong.
export function getPrompts(personName, { era, tag } = {}) {
  let pool = RAW_PROMPTS;
  if (era) pool = pool.filter((p) => p.era === era);
  if (tag) pool = pool.filter((p) => p.tags.includes(tag));
  const source = pool.length ? pool : RAW_PROMPTS;

  return source.map((p) => ({
    id: p.id,
    question: p.question.replace(/\\{name\\}/g, personName || "them"),
    followUp: p.followUp,
    hint: p.hint,
    topic: p.topic,
    sensitive: p.sensitive,
    depth: p.depth,
    tags: p.tags,
    era: p.era,
    about: p.about ? p.about.replace(/\\{name\\}/g, personName || ABOUT_FALLBACK) : null,
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
export function getAboutPrompts(personName, { era, tag } = {}) {
  let pool = RAW_PROMPTS.filter((p) => p.about);
  if (era) pool = pool.filter((p) => p.era === era);
  if (tag) pool = pool.filter((p) => p.tags.includes(tag));

  return pool.map((p) => ({
    id: p.id,
    question: p.about.replace(/\\{name\\}/g, personName || ABOUT_FALLBACK),
    followUp: null,
    hint: p.hint,
    topic: p.topic,
    sensitive: p.sensitive,
    depth: p.depth,
    tags: p.tags,
    era: p.era,
    about: null,
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
  console.log(
    `${questions.length} questions → src/data/interview.js\n${counts}\n\n${byDepth}\n\n` +
      `  ${String(aboutCount).padStart(4)}  with a wording for relatives (about)`
  );
}
