/**
 * Asking the storyteller today's question by link: the web's side of the
 * phone's daily question (phone-app src/data/dailyQuestions.js, server in
 * supabase/daily_questions_2026_10_23.sql).
 *
 * daily_question_create puts the question on the story's rota (one a day:
 * today when the day is free, else the next free day) and hands back the
 * row's link token. The link (/a/<token>, AnswerPage) works the moment it
 * is made; on its day the question also waits on the storyteller's Home.
 * We only make the link: whoever asked sends it themselves, by text, email
 * or across the table. The web records no voice, so an ask goes as words.
 *
 *   askQuestion()  the ask → { ok, id, sendOn, today, linkUrl } or { error }
 *   storyRota()    who has which day → { today, next, days } or null
 *   canAsk()       whether this person can be asked from this account
 *   askDeck()      today's question for them, and the deck's others
 *   answerUrl() linkUrlFor()  the /a/ link
 *
 * Nothing here throws. The client is a parameter so the tests pass a mock.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Person } from "./family";
import { getSupabase } from "../lib/supabase";
import { localTz, todaysDeck, type Prompt } from "../lib/today";
import type { Story } from "./stories";
import { siteUrl } from "../components/family/familyView";

type Client = Pick<SupabaseClient, "rpc">;

export type AskError = "empty" | "not_ready" | "not_family" | "not_askable" | "too_many" | "failed";

export type AskResult =
  | { ok: true; id: string; sendOn: string; today: boolean; /** What day it is on the server, in the asker's time zone. */ day: string; linkUrl: string | null }
  | { ok?: false; error: AskError };

export type RotaDay = { sendOn: string; askerName: string; mine: boolean };
export type Rota = { today: string; next: string; days: RotaDay[] };

// The database without daily_questions.sql: a table or function that isn't there.
const MISSING = ["42P01", "42883", "PGRST202", "PGRST205"];

/** What the server's refusal means, the phone's errorOf word for word. */
export function askErrorOf(error: { code?: string; message?: string } | null | undefined): AskError {
  if (!error) return "failed";
  if (MISSING.includes(error.code || "")) return "not_ready";
  const m = String(error.message || "");
  if (/not in this family|sign in first/.test(m)) return "not_family";
  if (/write a question/.test(m)) return "empty";
  if (/too many/.test(m)) return "too_many";
  if (/that is you|not this story|not a living/.test(m)) return "not_askable";
  return "failed";
}

/** The storyteller's answer link for a token, on this app's own address. */
export function answerUrl(token: string | null | undefined, base: string = siteUrl()): string | null {
  const t = String(token || "").trim();
  return t ? `${base.replace(/\/+$/, "")}/a/${encodeURIComponent(t)}` : null;
}

/** The link for an ask the account made, when it has one. */
export function linkUrlFor(ask: { linkUrl?: string | null; linkToken?: string | null } | null | undefined, base?: string): string | null {
  if (!ask) return null;
  return ask.linkUrl || answerUrl(ask.linkToken, base);
}

const said = (text: string) => String(text || "").replace(/\s+/g, " ").trim();

/**
 * The ask: the question on the storyteller's rota and its link. `tellerPersonId` is the story's own person
 * (people.story_id), living and not the account asking; `questionId` the bank id, so the chapter follows the answer.
 */
export async function askQuestion(
  { storyId, tellerPersonId, text, questionId = null, tz = localTz() }: { storyId: string; tellerPersonId: string; text: string; questionId?: string | null; tz?: string },
  { client = getSupabase(), base }: { client?: Client | null; base?: string } = {},
): Promise<AskResult> {
  const words = said(text);
  if (words.length < 3) return { error: "empty" };
  if (!storyId || !tellerPersonId) return { error: "failed" };
  if (!client) return { error: "not_ready" };
  try {
    const { data, error } = await client.rpc("daily_question_create", {
      p_story: storyId,
      p_teller: tellerPersonId,
      p_text: words,
      p_ms: 0,
      p_tz: tz,
      p_ref: questionId || null,
    });
    if (error) return { error: askErrorOf(error) };
    const made = (data || null) as { id?: string; send_on?: string; link_token?: string; today?: string } | null;
    if (!made?.id) return { error: "failed" };
    const sendOn = made.send_on || "";
    return { ok: true, id: made.id, sendOn, today: !!sendOn && sendOn === made.today, day: made.today || "", linkUrl: answerUrl(made.link_token, base) };
  } catch {
    return { error: "failed" };
  }
}

/** story_rota's answer as the sheet reads it, or null when it isn't one. */
export function rotaFrom(data: unknown): Rota | null {
  if (!data || typeof data !== "object") return null;
  const d = data as { today?: string; next?: string; days?: unknown };
  return {
    today: String(d.today || ""),
    next: String(d.next || ""),
    days: (Array.isArray(d.days) ? d.days : []).map((x: { send_on?: string; asker_name?: string; mine?: boolean }) => ({
      sendOn: String(x?.send_on || ""),
      askerName: String(x?.asker_name || ""),
      mine: !!x?.mine,
    })),
  };
}

/** Who has which day from today on, or null (no tables, not family, no connection). */
export async function storyRota(storyId: string, { client = getSupabase(), tz = localTz() }: { client?: Client | null; tz?: string } = {}): Promise<Rota | null> {
  if (!storyId || !client) return null;
  try {
    const { data, error } = await client.rpc("story_rota", { sid: storyId, tz });
    return error ? null : rotaFrom(data);
  } catch {
    return null;
  }
}

/** Somebody already has today: the first name of who asked it ("" when the row doesn't say), or null when it is free. */
export function takenToday(rota: Rota | null): { askerName: string; mine: boolean } | null {
  if (!rota?.today) return null;
  const day = rota.days.find((d) => d.sendOn === rota.today);
  return day ? { askerName: day.askerName.trim().split(/\s+/)[0] || "", mine: day.mine } : null;
}

/** Whether this person can be asked from this account: the story's person, living, and not the account itself. */
export function canAsk(person: Pick<Person, "id"> & { deathYear?: unknown; userId?: string | null } | null | undefined, userId: string | null | undefined): boolean {
  if (!person?.id) return false;
  if (person.deathYear) return false;
  return !(userId && person.userId === userId);
}

/**
 * The day an ask lands, in words: "today", "tomorrow", "on Thursday" within the week, else "on Thursday 5 November".
 * Both days are "2026-10-29"; read at noon, so no time zone moves them.
 */
export function dayWords(sendOn: string, today: string, locale?: string): string {
  if (!sendOn || sendOn === today) return "today";
  const at = (s: string) => new Date(`${s}T12:00:00`);
  const d = at(sendOn);
  if (Number.isNaN(d.getTime())) return "soon";
  const gap = today && !Number.isNaN(at(today).getTime()) ? Math.round((d.getTime() - at(today).getTime()) / 86400000) : 99;
  if (gap === 1) return "tomorrow";
  const weekday = d.toLocaleDateString(locale, { weekday: "long" });
  return gap > 1 && gap < 7 ? `on ${weekday}` : `on ${weekday} ${d.toLocaleDateString(locale, { day: "numeric", month: "long" })}`;
}

/** The words that go with the link, for the asker to send from their own phone or email. */
export function askMessage({ question, link, tellerName }: { question: string; link: string; tellerName?: string }): string {
  const hello = tellerName?.trim() ? `${tellerName.trim()}, a` : "A";
  return `${hello} question for your story:\n\n“${said(question)}”\n\nTap the link to answer. Talk or write, whichever is easier:\n${link}`;
}

/** mailto: and sms: links with the message filled in. The asker's own app sends it; we never do. */
export function shareLinks(message: string, { email = "", subject = "A question for your story" }: { email?: string; subject?: string } = {}): { mail: string; sms: string } {
  const body = encodeURIComponent(message);
  const to = /^[^\s@?&/:]+@[^\s@?&/:]+\.[^\s@?&/:]+$/.test(email.trim()) ? email.trim() : "";
  return {
    mail: `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${body}`,
    // "?&body=" is the form both iOS and Android Messages read.
    sms: `sms:?&body=${body}`,
  };
}

/**
 * What the sheet offers: the storyteller's own question for today (todaysDeck, in their "you"), then the rest of
 * the day's walk through the bank. Never a sensitive question: loss is theirs to open (the phone's suggestQuestions).
 */
export function askDeck(story: Story, { key }: { key?: string } = {}): { today: Prompt | null; others: Prompt[] } {
  const fits = (p: Prompt | null | undefined): p is Prompt => !!p && !!said(p.question) && !p.sensitive;
  const today = todaysDeck(story, { key }).find(fits) ?? null;
  const others = todaysDeck(story, { key, unlimited: true }).filter((p) => fits(p) && p.id !== today?.id && said(p.question) !== said(today?.question || ""));
  return { today, others };
}
