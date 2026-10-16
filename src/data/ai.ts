/**
 * The AI server (the app's EXPO_PUBLIC_API_URL, a Flask app). The web calls
 * the same endpoints with the same bearer token. Every call here has a
 * fallback on the page, because the server may not have the endpoint yet
 * (phone-app/docs/*-for-server.md) and nothing must break for that.
 */
import { getSupabase } from "../lib/supabase";
import { tidyText, titleFrom, followUps } from "../app-core/lib/writeHelper.js";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const isAiConfigured = Boolean(API_BASE);

async function authHeaders(): Promise<Record<string, string>> {
  try {
    const sb = getSupabase();
    const { data } = sb ? await sb.auth.getSession() : { data: null };
    const token = data?.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  if (!API_BASE) throw new Error("No AI server configured");
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data as T;
}

/* ── Help me write (docs/memory-help-for-server.md) ─────────────────────── */

/** Spelling, capitals, full stops: their words, their order, nothing added. */
export async function tidy(text: string, about = ""): Promise<string> {
  try {
    const r = await postJson<{ text: string }>("/api/memory/help", { mode: "tidy", text, about });
    return r.text || text;
  } catch {
    return tidyText(text);
  }
}

/** A short title in their own words. */
export async function suggestTitle(text: string, about = ""): Promise<string> {
  try {
    const r = await postJson<{ title: string }>("/api/memory/help", { mode: "title", text, about });
    return r.title || titleFrom(text);
  } catch {
    return titleFrom(text);
  }
}

/** Two or three questions about what the memory doesn't say yet. */
export async function nextQuestions(text: string, about = "", opts: { topic?: string; followUp?: string } = {}): Promise<string[]> {
  try {
    const r = await postJson<{ questions: string[] }>("/api/memory/help", { mode: "questions", text, about });
    if (Array.isArray(r.questions) && r.questions.length) return r.questions;
  } catch {
    /* fall through to the page's own version */
  }
  return followUps(text, { about, ...opts });
}
