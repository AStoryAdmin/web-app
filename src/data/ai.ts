/**
 * The AI server (the app's EXPO_PUBLIC_API_URL, a Flask app). The web calls
 * the same endpoints with the same bearer token. Every call here has a
 * fallback on the page, because the server may not have the endpoint yet
 * (phone-app/docs/*-for-server.md) and nothing must break for that.
 */
import { getSupabase } from "../lib/supabase";
import { tidyText, titleFrom, followUps } from "../app-core/lib/writeHelper.js";
import { serverOffers } from "../app-core/lib/serverFeatures.js";

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

/* ── Permission to send their voice and words (phone lib/aiConsent.js) ──── */

// The phone's own words (App Store guideline 5.1.2(i)): who receives it, said plainly, before the first time.
export const AI_CONSENT_TITLE = "Talking with A Story";
export const AI_CONSENT_MESSAGE =
  "To listen, write down what's said and reply, A Story sends your voice, " +
  "your words and any photos or pages you share with it to OpenAI, the " +
  "company whose AI runs it. It's used only to run A Story. You can take " +
  "this back in Privacy settings. Our Privacy Policy has the details.";

// The phone's key for the answer, per account. The phone keeps it on the device, not in a profile column; the
// server's copy is a log written through record_ai_consent once serverFeatures "consent" is on.
const consentKey = (userId: string | null | undefined) => `astory-ai-consent:${userId || "anon"}`;

/** Whether this account has said yes in this browser. */
export function hasAiConsent(userId: string | null | undefined): boolean {
  try {
    return Boolean(localStorage.getItem(consentKey(userId)));
  } catch {
    return false;
  }
}

/**
 * Remembers the answer (a yes with the day it was given, as the phone keeps it; false takes it back, as Privacy
 * settings does on the phone, so the next use asks again) and writes it through to the server's log when the
 * server offers it. The server write is never waited on by the page and never fails the answer.
 */
export function recordAiConsent(userId: string | null | undefined, allow: boolean, now = new Date()): void {
  const at = now.toISOString();
  try {
    if (allow) localStorage.setItem(consentKey(userId), at);
    else localStorage.removeItem(consentKey(userId));
  } catch {
    /* storage blocked: the answer holds for this page only, and the next use asks again */
  }
  if (userId && serverOffers("consent")) {
    const sb = getSupabase();
    sb?.rpc("record_ai_consent", { p_value: allow, p_app_version: "web", p_client_at: at }).then(
      () => undefined,
      () => undefined,
    );
  }
}

/**
 * Asks the first time, remembers a yes, and resolves true when it is fine to send. `ask` is the page's own card
 * with AI_CONSENT_TITLE and AI_CONSENT_MESSAGE, "Not now" and "Allow"; it resolves true for Allow.
 */
export async function ensureAiConsent(userId: string | null | undefined, ask: () => Promise<boolean>): Promise<boolean> {
  if (hasAiConsent(userId)) return true;
  const ok = await ask().catch(() => false);
  if (ok) recordAiConsent(userId, true);
  return ok;
}

/** Thrown by transcribe when nobody has said yes: the page asks (ensureAiConsent) and keeps the voice either way. */
export class AiConsentNeeded extends Error {
  readonly code = "ai_consent";
  constructor() {
    super("Allow A Story to listen first.");
  }
}

/* ── Writing down what was said (the phone's /api/transcribe) ───────────── */

const AUDIO_EXT: Record<string, string> = { "audio/mp4": "m4a", "audio/m4a": "m4a", "audio/aac": "m4a", "audio/ogg": "ogg", "audio/mpeg": "mp3", "audio/wav": "wav" };

/**
 * The words in a recording, through the AI server's /api/transcribe (multipart, field `audio`, as the phone sends
 * it; `language` a BCP-47 tag the server may use as a hint). Only once this account has allowed it: otherwise it
 * throws AiConsentNeeded before anything is sent. Throws on a server or network failure too; the recording is
 * the memory, so the page keeps it and lets them type the words.
 */
export async function transcribe(blob: Blob, language = "", { userId }: { userId?: string | null } = {}): Promise<string> {
  if (!API_BASE) throw new Error("No AI server configured");
  const uid = userId === undefined ? await sessionUserId() : userId;
  if (!hasAiConsent(uid)) throw new AiConsentNeeded();
  const type = (blob.type || "audio/webm").split(";")[0].trim().toLowerCase();
  const form = new FormData();
  form.append("audio", blob, `recording.${AUDIO_EXT[type] || "webm"}`);
  if (language) form.append("language", language);
  // No Content-Type: the browser writes the multipart boundary.
  // bounded like the phone's fetchWithTimeout: a stalled transcription must not hold the Keep button forever
  const res = await fetch(`${API_BASE}/api/transcribe`, { method: "POST", headers: await authHeaders(), body: form, signal: AbortSignal.timeout(90_000) });
  const data = (await res.json().catch(() => ({}))) as { transcript?: string; error?: string };
  if (!res.ok) throw new Error(data.error || `Transcription failed (${res.status})`);
  return String(data.transcript || "").trim();
}

async function sessionUserId(): Promise<string | null> {
  try {
    const sb = getSupabase();
    const { data } = sb ? await sb.auth.getSession() : { data: null };
    return data?.session?.user?.id || null;
  } catch {
    return null;
  }
}
