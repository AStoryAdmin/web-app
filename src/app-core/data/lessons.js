// What a life teaches (NORTH-STAR "Not only stories"; spec:
// docs/agents/session-habits/lessons-spec.md).
//
// A lesson is a span of her own words, beside the story it came from, that a
// person chose to keep as something she learned. The words are never typed,
// tidied or summed up: a lesson is only ever *found* in what she said, so
// every lesson is checked against its memory (quoteSpan) and one that isn't
// her exact words is refused when marked and dropped when read.
//
//   lesson = {
//     id, storyId, memoryId,
//     quote,                 her exact words, a span of memory.body or of
//                            one of her own transcript turns
//     source,                "body" | "transcript" (filled by quoteSpan)
//     clip,                  { audioId, start, end } in her voice, or null
//     theme,                 one of THEMES
//     markedBy,              { personId, name, role: teller|keeper|relative }
//     suggestedByAi,         true when A Story proposed the span
//     confirmedBy,           { personId, name } or null (still a suggestion)
//     date,                  "YYYY-MM-DD", when it was kept
//     revisits,              an earlier lesson's id: the self-recorder's
//                            "then → now", or null
//   }
//
// Private by default: a lesson is never a second way to see a memory.
// Whoever can't see the memory can't see its lessons (visibleLessons).
import { USES_FAKE_DATA } from "../lib/demoMode.js";
import { serverOffersOrDemo } from "../lib/serverFeatures.js";

/* The themes the family finds them by ("What Rose learned"), in the order a
   page lists them when two hold as many. `tags` are the question bank's tags
   that suggest the theme for a memory that answered a bank question. */
export const THEMES = [
  { id: "choices", label: "Hard choices", tags: ["choices", "change"] },
  { id: "work", label: "Work", tags: ["work", "skill", "retirement"] },
  { id: "love", label: "Love", tags: ["love", "marriage"] },
  { id: "money", label: "Money", tags: ["money"] },
  { id: "loss", label: "Loss", tags: ["loss", "mortality"] },
  { id: "children", label: "Raising children", tags: ["parenting", "children"] },
  { id: "hard", label: "Getting through", tags: ["hardship", "feelings"] },
  { id: "again", label: "Starting again", tags: ["migration", "dreams"] },
  { id: "values", label: "What matters", tags: ["values", "faith", "beliefs", "wisdom", "pass-on"] },
  { id: "health", label: "Health", tags: ["health", "body"] },
];
const THEME_BY_ID = new Map(THEMES.map((t) => [t.id, t]));
export const themeLabel = (id) => THEME_BY_ID.get(id)?.label || "";

/* The theme a bank question suggests, from its tags, most specific first
   (money before wisdom), or null. Only a suggestion: a person chooses. */
export function themeForQuestion(q) {
  const tags = q?.tags || [];
  for (const t of THEMES) if (t.tags.some((tag) => tags.includes(tag))) return t.id;
  return null;
}

/* ── The words ─────────────────────────────────────────────────────────── */

// Curly quotes and dashes as typeset, straight as typed: the same words.
const fold = (s) =>
  String(s || "")
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "—");

const isTeller = (turn) => turn && turn.speaker !== "assistant" && turn.speaker !== "interviewer";

/* Where her exact words sit: { source, start, end, turn? } or null. The
   body first (what the page and the book print), then her own turns on the
   call. A span of A Story's own turns is never hers. */
export function quoteSpan(memory, quote) {
  const q = fold(quote).trim();
  if (!memory || q.length < 3) return null;
  const body = fold(memory.body);
  const at = body.indexOf(q);
  if (at >= 0) return { source: "body", start: at, end: at + q.length };
  const turns = memory.transcript || [];
  for (let i = 0; i < turns.length; i++) {
    if (!isTeller(turns[i])) continue;
    const t = fold(turns[i].text);
    const j = t.indexOf(q);
    if (j >= 0) return { source: "transcript", turn: i, start: j, end: j + q.length };
  }
  return null;
}

/* Her words, whole: a span widened to the sentences it sits in, so a
   lesson is never a fragment (Daniel's standard §14, judges r2 hold 6).
   Exactly her words, from the first sentence's start to the last's end. */
export function wholeQuote(memory, quote) {
  const q = String(quote || "").trim();
  const span = quoteSpan(memory, q);
  if (!span) return q;
  const text = span.source === "body" ? String(memory.body || "") : String(memory.transcript[span.turn].text || "");
  const ss = sentencesOf(text);
  const first = ss.find((x) => x.end > span.start) || null;
  const last = [...ss].reverse().find((x) => x.start < span.end) || null;
  return first && last ? text.slice(first.start, last.end) : q;
}

/* Her words as shown: always whole sentences. */
export function quoteShown(lesson, memory) {
  return wholeQuote(memory, lesson?.quote);
}

/* ── Marking ───────────────────────────────────────────────────────────── */

const ROLES = new Set(["teller", "keeper", "relative"]);
let counter = 0;
const newId = () => `les-${Date.now().toString(36)}-${(counter++).toString(36)}`;
const today = () => new Date().toISOString().slice(0, 10);

/* A new lesson, or null when it can't be one: not her exact words, no
   theme, nobody marking it. A person marking it confirms it; an AI
   suggestion waits for a person (`confirmedBy: null`). */
export function markLesson(memory, { quote, theme, markedBy, suggestedByAi = false, confirmedBy, date, id, clip = null, revisits = null } = {}) {
  const span = quoteSpan(memory, quote);
  if (!span || !THEME_BY_ID.has(theme)) return null;
  // Kept whole: a fragment (an AI suggestion, a tap mid-sentence) widens
  // to the sentences it sits in.
  quote = wholeQuote(memory, quote);
  if (!markedBy || !ROLES.has(markedBy.role) || !markedBy.name) return null;
  const who = { personId: markedBy.personId || null, name: markedBy.name, role: markedBy.role };
  return {
    id: id || newId(),
    storyId: memory.storyId || null,
    memoryId: memory.id,
    quote: String(quote).trim(),
    source: span.source,
    clip,
    theme,
    markedBy: who,
    suggestedByAi: !!suggestedByAi,
    confirmedBy: confirmedBy !== undefined ? confirmedBy : suggestedByAi ? null : { personId: who.personId, name: who.name },
    date: date || today(),
    revisits,
  };
}

/* A person says yes to A Story's suggestion. */
export function confirmLesson(lesson, by) {
  if (!lesson || !by?.name) return lesson;
  return { ...lesson, confirmedBy: { personId: by.personId || null, name: by.name } };
}

export const isConfirmed = (l) => !!(l && l.confirmedBy && l.confirmedBy.name);

/* ── Reading ───────────────────────────────────────────────────────────── */

/* The lessons a viewer may see: confirmed, on a kept memory the viewer has,
   still her exact words. A private memory's lessons only when the viewer
   may see private memories (the teller, the keeper). */
export function visibleLessons(lessons, memories, { includePrivate = false } = {}) {
  const byId = new Map((memories || []).filter(Boolean).map((m) => [m.id, m]));
  return (lessons || []).filter((l) => {
    const m = byId.get(l?.memoryId);
    if (!m || !isConfirmed(l) || !THEME_BY_ID.has(l.theme)) return false;
    if (m.status && m.status !== "saved") return false;
    if (m.privacy === "private" && !includePrivate) return false;
    return !!quoteSpan(m, l.quote);
  });
}

const yearOf = (m) => {
  const y = String(m?.period || "").match(/\b(1[89]\d\d|20\d\d)\b/);
  return y ? Number(y[1]) : null;
};

/* "What Rose learned": the visible lessons by theme, each with its memory.
   Themes with none are left out; the fullest first, THEMES' order on a tie.
   Inside a theme, in the order of her life (undated last), then as kept. */
export function lessonsByTheme(lessons, memories, opts) {
  const byId = new Map((memories || []).filter(Boolean).map((m) => [m.id, m]));
  const groups = new Map();
  for (const l of visibleLessons(lessons, memories, opts)) {
    if (!groups.has(l.theme)) groups.set(l.theme, []);
    groups.get(l.theme).push({ ...l, memory: byId.get(l.memoryId) });
  }
  const order = THEMES.map((t) => t.id);
  const life = (a, b) => {
    const ya = yearOf(a.memory) ?? 9999;
    const yb = yearOf(b.memory) ?? 9999;
    return ya - yb || String(a.date).localeCompare(String(b.date));
  };
  return [...groups.entries()]
    .map(([theme, list]) => ({ theme, label: themeLabel(theme), lessons: list.sort(life) }))
    .sort((a, b) => b.lessons.length - a.lessons.length || order.indexOf(a.theme) - order.indexOf(b.theme));
}

/* The book's chapter (lane B): only with 3 or more, by theme. */
export const BOOK_CHAPTER_MIN = 3;
export function bookLessons(lessons, memories, opts) {
  const groups = lessonsByTheme(lessons, memories, opts);
  const n = groups.reduce((s, g) => s + g.lessons.length, 0);
  return n >= BOOK_CHAPTER_MIN ? groups : [];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function shortDate(iso) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]}` : "";
}

/* Who kept it, in a line: "Rose kept this · 19 Oct", "Marked by Jamie ·
   19 Oct", "Found by A Story, kept by Jamie · 19 Oct". `you` is the
   viewer's person id, so her own phone says "You kept this". */
export function keptLine(lesson, { you = null } = {}) {
  if (!lesson) return "";
  const by = lesson.confirmedBy || lesson.markedBy || {};
  const mine = you && by.personId === you;
  const name = mine ? "you" : by.name;
  const when = shortDate(lesson.date);
  let who;
  if (lesson.suggestedByAi) who = `Found by A Story, kept by ${name}`;
  else if (lesson.markedBy?.role === "teller") who = mine ? "You kept this" : `${by.name} kept this`;
  else who = `Marked by ${mine ? "you" : by.name}`;
  return when ? `${who} · ${when}` : who;
}

/* Where it came from: "from “The move” · 1985". */
export function sourceLine(memory) {
  if (!memory) return "";
  const title = String(memory.title || "").trim();
  const y = yearOf(memory);
  return [title ? `from “${title}”` : "", y ? String(y) : ""].filter(Boolean).join(" · ");
}

/* ── The self-recorder's questions (Mai, recording a change as it happens).
   Present tense, so they stay out of the bank: Rose is never asked "since
   this began". Tagged like the bank so a picker reads them the same way. */
export const JOURNEY_QUESTIONS = [
  { id: "now-in-middle", question: "What are you in the middle of right now?", followUp: "How do you think it will turn out?", hint: "A change, a choice, a hard stretch. Say today's date.", tags: ["now", "change", "lesson"], depth: 2 },
  { id: "now-trying-decide", question: "What are you trying to decide at the moment?", followUp: "Who have you talked to about it?", hint: "Both sides, as they look today.", tags: ["now", "choices", "lesson"], depth: 3 },
  { id: "now-know-since", question: "What do you know now that you didn't when this began?", followUp: "When did you first notice it?", hint: "Date it. You'll want to read this later.", tags: ["now", "lesson"], depth: 3 },
  { id: "now-surprised", question: "What has surprised you since the change began?", followUp: "Was it a good surprise?", hint: "The thing nobody warned you about.", tags: ["now", "change", "lesson"], depth: 3 },
  { id: "now-then", question: "Read back what you said at the start. What's different now?", followUp: "What would you tell yourself back then?", hint: "Then, and now. Both are true.", tags: ["now", "lesson"], depth: 4 },
];

/* ── The demo: Rose's lessons, from her demo memories (dev/fakeData.js).
   Every quote is a real span of her words there; the test checks each one. */
const ROSE = { personId: "p-rose", name: "Rose", role: "teller" };
const JAMIE = { personId: "p-jamie", name: "Jamie", role: "keeper" };
const asPerson = ({ personId, name }) => ({ personId, name });

export const DEMO_LESSONS_SPEC = [
  { id: "les-permission", memoryId: "mem-9", quote: "Nobody is coming to give you permission.", theme: "choices", markedBy: ROSE, days: 0 },
  { id: "les-sundays", memoryId: "mem-9", quote: "Do the thing, apologize later if you have to, and call your mother on Sundays.", theme: "values", markedBy: JAMIE, days: 1 },
  { id: "les-box", memoryId: "mem-8", quote: "I have thought about that box every day since — it is the only thing I would go back into a fire for.", theme: "values", markedBy: ROSE, suggestedByAi: true, confirmedBy: asPerson(ROSE), days: 1 },
  { id: "les-quiet-quick", memoryId: "mem-7b", quote: "You learned to be quiet and to be quick.", theme: "hard", markedBy: JAMIE, suggestedByAi: true, confirmedBy: asPerson(JAMIE), days: 0 },
  { id: "les-certain", memoryId: "mem-5", quote: "I remember thinking: I have no idea what I am doing, and I have never been more certain of anything.", theme: "children", markedBy: ROSE, days: 0 },
  { id: "les-third-try", memoryId: "mem-7", quote: "I passed on the third try and drove myself to the market that afternoon to prove it.", theme: "again", markedBy: ROSE, days: 0 },
  { id: "les-garden", memoryId: "mem-10", quote: "Tomatoes the first year, badly. Everything else after that, well.", theme: "again", markedBy: JAMIE, days: 0 },
  { id: "les-forgave", memoryId: "mem-3", quote: "He was late to the dance, which annoyed me at first, but he brought flowers he'd picked himself on the walk over, so I forgave him quickly.", theme: "love", markedBy: ROSE, days: 2 },
  { id: "les-aunt", memoryId: "mem-4", quote: "My aunt sang the wrong song and we let her finish it.", theme: "love", markedBy: JAMIE, days: 1 },
  // Still a suggestion: nobody has said yes, so no page shows it.
  { id: "les-complained", memoryId: "mem-2", quote: "My mother made oatmeal every morning and nobody complained once, which never happened before or since.", theme: "hard", markedBy: JAMIE, suggestedByAi: true, confirmedBy: null, days: 0 },
];

const plusDays = (iso, n) => {
  const d = new Date(iso || Date.now());
  if (Number.isNaN(d.getTime())) return today();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

/* Rose's demo lessons, dated from when each memory was kept. */
export function demoLessons(story) {
  if (!story || story.id !== "story-1") return [];
  const byId = new Map((story.memories || []).map((m) => [m.id, m]));
  return DEMO_LESSONS_SPEC.map(({ memoryId, days, ...rest }) => {
    const m = byId.get(memoryId);
    if (!m) return null;
    return markLesson({ ...m, storyId: story.id }, { ...rest, date: plusDays(m.createdAt, days) });
  }).filter(Boolean);
}

/* Lessons are on where the family can share them: in the demo, and on a
   device once lessons.sql is live (SERVER_FEATURES.lessons). Until then a
   lesson kept on one phone would never reach the family, so a device shows
   none of it (release review H2, ruling (a)). */
export const lessonsLive = () => serverOffersOrDemo("lessons");

/* The lessons kept on a story: the story's own (from the server), else in
   the demo, Rose's. None while lessons are off: every page, row and the
   book read through here. */
export function lessonsForStory(story) {
  if (!story || !lessonsLive()) return [];
  if (Array.isArray(story.lessons)) return story.lessons;
  return USES_FAKE_DATA ? demoLessons(story) : [];
}

/* ── Marking on a memory (the memory page's sheet) ─────────────────────── */

/* Her words in sentences, for choosing a lesson by tapping, never typing:
   [{ text, start, end }] over memory.body. A sentence ends at . ! or ?
   (and a closing quote after it); what's left at the end is one too. */
export function sentencesOf(text) {
  const s = String(text || "");
  const out = [];
  const re = /[^.!?]+(?:[.!?]+["”’']?|$)/g;
  let m;
  while ((m = re.exec(s))) {
    if (!m[0]) { re.lastIndex++; continue; }
    const lead = m[0].length - m[0].trimStart().length;
    const t = m[0].trim();
    if (t) out.push({ text: t, start: m.index + lead, end: m.index + lead + t.length });
  }
  return out;
}

/* The words from sentence i to sentence j (inclusive), exactly as she said
   them, spaces and all, so the quote is always a real span. */
export function spanOf(text, sentences, i, j) {
  const a = sentences[Math.min(i, j)];
  const b = sentences[Math.max(i, j)];
  return a && b ? String(text).slice(a.start, b.end) : "";
}

/* The lessons on one memory: the confirmed ones, and the one AI suggestion
   still waiting for a person (not dismissed), if any. */
export function lessonsOnMemory(lessons, memoryId) {
  const here = (lessons || []).filter((l) => l && l.memoryId === memoryId && !l.dismissed);
  return {
    kept: here.filter(isConfirmed),
    suggestion: here.find((l) => l.suggestedByAi && !isConfirmed(l)) || null,
  };
}

/* The story's lessons after a change, for a mutate: the demo's seeds are
   written into the story the first time anything changes, so nothing
   already kept disappears. `fn(list) → list`. */
export function changeLessons(story, fn) {
  if (!story) return;
  story.lessons = fn([...(Array.isArray(story.lessons) ? story.lessons : lessonsForStory(story))]);
}

export const addLesson = (lesson) => (list) => (lesson ? [...list.filter((l) => l.id !== lesson.id), lesson] : list);
export const removeLesson = (id) => (list) => list.filter((l) => l.id !== id);
export const confirmLessonIn = (id, by) => (list) => list.map((l) => (l.id === id ? confirmLesson(l, by) : l));
/* "Not this one": kept as dismissed, so A Story never offers it again. */
export const dismissLesson = (id) => (list) => list.map((l) => (l.id === id ? { ...l, dismissed: true } : l));

/* ── Moving the phone's lessons to the server, once ──────────────────────
   Before lessons_2026_10_25.sql, a lesson lived only on the phone that kept
   it (astory-lessons-<userId>). The day the server offers lessons, each one
   goes up once, by its own id, so nothing kept is lost and nothing is sent
   twice. After that the server is read first: a lesson this phone already
   sent that the server no longer has was removed by someone (a keeper, or
   the storyteller's veto), and is never sent again.

   `uploaded` is the set of ids this phone has seen land (store.js keeps it
   under lessonsUploadedKey), from this move and from every ordinary save,
   plus every id it has ever seen come FROM the server, plus a
   `moved:<storyId>` marker once a story's move is done. The phone's cache
   (astory-lessons-<userId>) holds the story's whole list, other people's
   server lessons included; without those two, a lesson a keeper or the
   storyteller deleted on another phone would be re-uploaded from here and
   her veto undone. Only lessons made on this phone before the server had
   them ever go up this way. */
export const lessonsUploadedKey = (userId) => `astory-lessons-${userId}:uploaded`;
export const movedMarker = (storyId) => `moved:${storyId}`;

const sendable = (l) =>
  !!(l && typeof l.id === "string" && l.id && l.memoryId && THEME_BY_ID.has(l.theme) && String(l.quote || "").trim().length >= 3 && l.markedBy && l.markedBy.name);

/* Which of the phone's lessons still need to go up: [{ storyId, lessons }].
   Only for stories the server answered for (their `lessons` is an array),
   only on a memory the server holds, never one already there or already sent,
   and never for a story whose move is done (movedMarker). */
export function lessonsToUpload(stories, cached, uploaded) {
  const sent = uploaded instanceof Set ? uploaded : new Set(uploaded || []);
  const out = [];
  if (!cached || typeof cached !== "object") return out;
  for (const s of stories || []) {
    if (!s || !Array.isArray(s.lessons) || !Array.isArray(cached[s.id])) continue;
    if (sent.has(movedMarker(s.id))) continue;
    const there = new Set(s.lessons.map((l) => l && l.id));
    const mems = new Set((s.memories || []).map((m) => m && m.id));
    const picked = cached[s.id].filter((l) => sendable(l) && !there.has(l.id) && !sent.has(l.id) && mems.has(l.memoryId));
    // "Then → now" only to a lesson the server has or that goes with it;
    // else the link is dropped rather than the lesson refused.
    const going = new Set(picked.map((l) => l.id));
    const lessons = picked.map((l) => (l.revisits && !there.has(l.revisits) && !going.has(l.revisits) ? { ...l, revisits: null } : l));
    if (lessons.length) out.push({ storyId: s.id, lessons });
  }
  return out;
}

const behind = (err) => ["42P01", "PGRST205", "42703", "PGRST204"].includes(String(err?.code || ""));
// Row-level security said no: this account may not add lessons to this story
// (a relative's phone holding the story's list). Asking again lesson by
// lesson, on every load, only gets the same answer.
const refusedByServer = (err) => String(err?.code || "") === "42501";

/* What this phone must remember after a load, so nothing removed comes back:
   every lesson id the server sent, and `moved:<storyId>` for each story whose
   move is done (the server answered, and nothing of the phone's is still
   waiting to go). After that the move never runs for the story again. */
export function lessonsSeen(stories, cached, uploaded, { landed = [], held = new Set() } = {}) {
  const sent = new Set([...(uploaded instanceof Set ? uploaded : uploaded || []), ...landed]);
  const out = [];
  for (const s of stories || []) {
    if (!s || !Array.isArray(s.lessons)) continue;
    for (const l of s.lessons) if (l && typeof l.id === "string" && l.id) out.push(l.id);
    if (held.has(s.id) || sent.has(movedMarker(s.id))) continue;
    const there = new Set(s.lessons.map((l) => l && l.id));
    const mine = Array.isArray(cached?.[s.id]) ? cached[s.id] : [];
    // A sendable lesson not there yet and not landed (its memory isn't on
    // the server yet, or it was refused) keeps the move open.
    if (mine.some((l) => sendable(l) && !there.has(l.id) && !sent.has(l.id))) continue;
    out.push(movedMarker(s.id));
  }
  return out;
}

/* Sends them: one statement per story, and lesson by lesson if that one is
   refused, so one bad lesson never holds back the rest. "Insert, or leave
   the server's alone" (ignoreDuplicates): a lesson already there, edited on
   another phone, is never overwritten by this phone's older copy.
   Returns { stories, sent, seen, refused }: the stories with what landed
   added to their lessons (so it shows at once), the ids that landed, what to
   remember besides (lessonsSeen: the server's ids and finished-story
   markers), and the stories the server refused (42501) so store.js leaves
   them alone until the app starts again. Never throws: a lesson that didn't
   go stays on the phone and goes on the next load.
     client  a Supabase client (from("lessons").upsert(rows, opts) → { error })
     toRow   lessonToRow (lib/lessonsStore.js)
     skip    story ids not to try this time (refused earlier this app run) */
export async function uploadLocalLessons({ client, stories, cached, uploaded, toRow, skip }) {
  const skipped = skip instanceof Set ? skip : new Set(skip || []);
  const plan = lessonsToUpload(stories, cached, uploaded).filter((p) => !skipped.has(p.storyId));
  const sent = [];
  const refused = [];
  const held = new Set(skipped);
  const landed = new Map();
  const send = async (rows) => {
    try {
      const res = await client.from("lessons").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
      return res?.error || null;
    } catch (err) {
      return err || new Error("upload failed");
    }
  };
  let stopped = false;
  for (const { storyId, lessons } of plan) {
    const ok = [];
    const error = await send(lessons.map((l) => toRow(l, storyId)));
    if (!error) ok.push(...lessons);
    else if (behind(error)) { stopped = true; break; } // the table isn't there: try again another day
    else if (refusedByServer(error)) { refused.push(storyId); held.add(storyId); continue; }
    else {
      for (const l of lessons) {
        const e = await send([toRow(l, storyId)]);
        if (!e) ok.push(l);
        else if (refusedByServer(e)) { refused.push(storyId); break; }
      }
      held.add(storyId); // something didn't go: the move stays open
    }
    if (ok.length) {
      landed.set(storyId, ok.map((l) => ({ ...l, storyId })));
      sent.push(...ok.map((l) => l.id));
    }
  }
  const next = (stories || []).map((s) => (landed.has(s?.id) ? { ...s, lessons: [...s.lessons, ...landed.get(s.id)] } : s));
  // Stopped early ("behind"): the stories not reached aren't finished either.
  if (stopped) for (const p of plan) if (!landed.has(p.storyId)) held.add(p.storyId);
  const seen = lessonsSeen(stories, cached, uploaded, { landed: sent, held });
  return { stories: next, sent, seen, refused };
}
