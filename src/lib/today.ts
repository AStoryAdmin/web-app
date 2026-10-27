/**
 * Today's question for a story, the way the app deals it.
 *
 * First, a question somebody in the family asked for today (phone
 * data/dailyQuestions.js: a `daily_questions` row on the story's rota), so
 * the phone and the web put the same question in front of the storyteller.
 * Otherwise the deck: with the signed-in account, the phone's own rule
 * (app-core todayQuestion.js: the doors, the arc, the family's question of
 * the day, a follow-up on what was just kept); without it, the bank in the
 * right voice with a depth ceiling the archive has earned. Either way a
 * question a kept memory already answers (its words or its id) is left out,
 * and "Ask me another" walks on through the skips this browser made today.
 */
import { voicePrompts } from "../app-core/lib/questionVoice.js";
import { answeredBy, dayKey, deckForDay, depthFor, isAnswered, questionAt } from "../app-core/lib/dailyQuestion.js";
import { todaysDeck as phoneTodaysDeck } from "../app-core/lib/todayQuestion.js";
import { sensitiveNote } from "../app-core/lib/sensitivity.js";
import { getSupabase } from "./supabase";
import type { Story } from "../data/stories";

export type Prompt = {
  id: string;
  question: string;
  followUp?: string;
  hint?: string;
  topic?: string;
  sensitive?: string | null;
  depth?: number;
  era: string;
  tags?: string[];
  /** The other voice's wording ("…when Rose was small?" beside "…when you were small?"). */
  alt?: string | null;
  /** "about": asked of a relative, about the storyteller. */
  voice?: string;
  /** A question only the storyteller can answer: the relative asks them rather than writing it. */
  askThem?: boolean;
};

/** A question somebody in the family asked for today: what the storyteller's Home leads with on the phone too. */
export type SharedQuestion = Prompt & {
  /** The daily_questions row, for marking it answered once a memory keeps it. */
  dailyId: string;
  /** Who asked, by first name, as the row has it ("" when the row doesn't say). */
  askedBy: string;
  sendOn: string;
};

// Free accounts are dealt three a day (the phone's FREE_DAILY_PROMPTS).
const PER_DAY = 3;

const skipKey = (storyId: string) => `astory-skips-${storyId}-${dayKey()}`;

export function skipsToday(storyId: string): number {
  try {
    return Number(localStorage.getItem(skipKey(storyId)) || 0);
  } catch {
    return 0;
  }
}

export function recordSkip(storyId: string): number {
  const n = skipsToday(storyId) + 1;
  try {
    localStorage.setItem(skipKey(storyId), String(n));
  } catch {
    /* fine */
  }
  return n;
}

type Person = Record<string, unknown>;

// todayQuestion.js's defaults (`people = []`, `family = null`) read to TypeScript as never[] and null; this is
// the shape it actually takes.
const phoneDeck = phoneTodaysDeck as unknown as (args: {
  story: Story;
  user: { id: string; firstName?: string };
  people: readonly Person[];
  family: DeckOptions["family"];
  key: string;
  unlimited: boolean;
  perDay: number;
}) => Prompt[];

export type DeckOptions = {
  relative?: boolean;
  unlimited?: boolean;
  /**
   * The signed-in account. With it the deck is the phone's (todayQuestion.js), and whether this is a relative
   * remembering the storyteller is worked out from the story and the tree (teller.js), so `relative` is not read.
   */
  user?: { id: string; firstName?: string } | null;
  /** The family tree's people and edges (useAccount's family), for the voice and the follow-ups. */
  family?: { people: readonly Person[]; edges: readonly unknown[] } | null;
  key?: string;
};

/** The deck for today: three on Free, the whole walk when the plan is paid. */
export function todaysDeck(story: Story, { relative = false, unlimited = false, user = null, family = null, key = dayKey() }: DeckOptions = {}): Prompt[] {
  if (user) {
    return phoneDeck({ story, user, people: family?.people || [], family, key, unlimited, perDay: PER_DAY });
  }
  const prompts = voicePrompts(story.name, { relative }) as Prompt[];
  return deckForDay(prompts, story.memories, {
    key,
    size: unlimited ? prompts.length : PER_DAY,
    maxDepth: depthFor(story.memories.length),
  }) as Prompt[];
}

export function todaysQuestion(story: Story, opts?: DeckOptions): Prompt | null {
  const deck = todaysDeck(story, opts);
  return (questionAt(deck, skipsToday(story.id)) as Prompt | null) ?? deck[0] ?? null;
}

const SHOWN = "astory-question-shown";

/**
 * Home remembers the question it is showing, whole, for the page that answers it. Links go through the view
 * transition (lib/pageTransition), which carries no router state, so it is handed over here: in this tab only.
 */
export function rememberShown(storyId: string, q: Prompt | null): void {
  try {
    if (q) sessionStorage.setItem(SHOWN, JSON.stringify({ storyId, q }));
  } catch {
    /* storage refused: the page looks the question up in the deck instead */
  }
}

function shown(storyId: string, qid: string): Prompt | null {
  try {
    const seen = JSON.parse(sessionStorage.getItem(SHOWN) || "null") as { storyId?: string; q?: Partial<SharedQuestion> } | null;
    const h = seen?.storyId === storyId ? seen.q : null;
    if (!h || h.id !== qid || typeof h.question !== "string" || !h.question.trim()) return null;
    return { ...h, id: h.id, question: h.question, era: h.era || "Anything else" };
  } catch {
    return null;
  }
}

/**
 * The question a page was opened on (/write?q=, /record?q=). The one Home showed comes first: it may be the family's
 * shared question (with its dailyId) or a follow-up the deck no longer deals once something is kept. Then today's
 * whole deck, then the bank in this voice, so a question from "Not yet told" (or one dealt yesterday) is still found
 * and saved with the memory.
 */
export function findQuestion(story: Story, qid: string | null | undefined, opts: DeckOptions = {}): Prompt | null {
  if (!qid) return null;
  const held = shown(story.id, qid);
  if (held) return held;
  const dealt = todaysDeck(story, { ...opts, unlimited: true }).find((p) => p.id === qid);
  if (dealt) return dealt;
  return ((voicePrompts(story.name, { relative: !!opts.relative }) as Prompt[]).find((p) => p.id === qid) as Prompt | undefined) ?? null;
}

/** The shared question while nothing kept answers it yet (a memory kept since it was read off the server). */
export const openShared = (shared: SharedQuestion | null, story: Story): SharedQuestion | null =>
  shared && !isAnswered(shared, answeredBy(story.memories)) ? shared : null;

/** The daily_questions row a question came from, when it is the family's shared one. */
export const dailyIdOf = (q: Prompt | null | undefined): string | null => (q && typeof (q as Partial<SharedQuestion>).dailyId === "string" ? (q as SharedQuestion).dailyId : null) || null;

/**
 * The question in front of them after `skips` taps of "Ask me another": the family's question for today first,
 * then the deck without it. Past the end of the deck, the deck's first, as todaysQuestion does.
 */
export function questionWithShared(shared: SharedQuestion | null, deck: Prompt[], skips = 0): Prompt | null {
  if (!shared) return (questionAt(deck, skips) as Prompt | null) ?? deck[0] ?? null;
  if (skips === 0) return shared;
  const rest = deck.filter((q) => q.id !== shared.id && q.question !== shared.question);
  return (questionAt(rest, skips - 1) as Prompt | null) ?? rest[0] ?? shared;
}

/** The deck's own prompt for a bank id, in the voice this page asks in, so a shared question keeps its chapter. */
function bankPrompt(story: Story, ref: string | null, relative: boolean): Prompt | null {
  if (!ref) return null;
  return ((voicePrompts(story.name, { relative }) as Prompt[]).find((p) => p.id === ref) as Prompt | undefined) ?? null;
}

export type DailyRow = {
  id: string;
  text?: string | null;
  question_ref?: string | null;
  asker_name?: string | null;
  send_on?: string | null;
  answered_at?: string | null;
};

/**
 * Today's shared question from the story's daily_questions rows, or null. Only a row on `today`, not yet
 * answered, and not already answered by a kept memory (the server may not have caught up). The words are the
 * asker's, addressed to the storyteller; a relative is shown the bank's wording about them instead, and only when
 * the row came from the bank: a question somebody wrote in their own words is the storyteller's to answer.
 */
export function sharedFromRows(rows: readonly DailyRow[], story: Story, { today, relative = false }: { today: string; relative?: boolean }): SharedQuestion | null {
  const answered = answeredBy(story.memories);
  for (const r of rows) {
    if (!r?.id || r.answered_at || r.send_on !== today) continue;
    const text = String(r.text || "").replace(/\s+/g, " ").trim();
    if (!text) continue;
    const bank = bankPrompt(story, r.question_ref || null, relative);
    if (relative && !bank) continue;
    const q: Prompt = relative && bank ? bank : { ...(bank || {}), id: r.question_ref || `daily:${r.id}`, question: text, era: bank?.era || "Anything else" };
    if (isAnswered(q, answered)) continue;
    return { ...q, dailyId: r.id, askedBy: String(r.asker_name || "").trim().split(/\s+/)[0] || "", sendOn: today };
  }
  return null;
}

/** The browser's time zone, the way the phone sends its own to the rota. */
export function localTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** "2026-10-26" in `tz`, for when the rota can't say what day it is there. */
export function dayIn(tz: string, now = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  } catch {
    return dayKey(now);
  }
}

const DAILY_COLUMNS = "id, text, question_ref, asker_name, send_on, answered_at";

/**
 * Reads today's shared question for the story: the rota (story_rota) says what day it is in this time zone, then
 * the day's daily_questions rows (RLS shows the storyteller the delivered ones, keepers all of them). Never throws:
 * a database without the tables, a refusal or no connection all mean "no shared question", and the deck leads.
 */
export async function loadSharedQuestion(story: Story, { relative = false, tz = localTz(), now = new Date() }: { relative?: boolean; tz?: string; now?: Date } = {}): Promise<SharedQuestion | null> {
  const sb = getSupabase();
  if (!sb || !story?.id || story.readOnly) return null;
  try {
    const rota = await sb.rpc("story_rota", { sid: story.id, tz });
    const today = (!rota.error && (rota.data as { today?: string } | null)?.today) || dayIn(tz, now);
    const { data, error } = await sb
      .from("daily_questions")
      .select(DAILY_COLUMNS)
      .eq("story_id", story.id)
      .eq("send_on", today)
      .is("answered_at", null)
      .order("created_at", { ascending: true })
      .limit(10);
    if (error || !Array.isArray(data)) return null;
    return sharedFromRows(data as DailyRow[], story, { today, relative });
  } catch {
    return null;
  }
}

/**
 * Tells the server a kept memory answers the family's question (daily_question_answer), so the asker hears it
 * and the rota moves on. The memory is kept either way: false only means the server didn't take the link.
 */
export async function markSharedAnswered(dailyId: string, memoryId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb || !dailyId || !memoryId) return false;
  try {
    const { data, error } = await sb.rpc("daily_question_answer", { p_id: dailyId, p_memory: memoryId });
    return !error && data !== false;
  } catch {
    return false;
  }
}

export const noteFor = (p: Prompt | null) => (p?.sensitive ? (sensitiveNote(p.sensitive) as string | null) : null);

export function greeting(name: string, now = new Date()): string {
  const h = now.getHours();
  const part = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return name ? `${part}, ${name}` : part;
}
