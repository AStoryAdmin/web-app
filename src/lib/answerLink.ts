/**
 * The elder's answer link (/a/:token): the one server it talks to is the
 * `answer-link` Edge Function (phone-app/supabase/functions/answer-link,
 * lane S). No sign-in: the token in the link is the whole credential, and
 * the anon key goes in `apikey`/Authorization as every web call sends it.
 *
 *   GET  ?t=<token>                         → the question (or expired / answered)
 *   POST {t, step:"upload", mime, size}     → {uploadUrl, path, token, contentType}; PUT the recording
 *                                             there with exactly that Content-Type (the bucket refuses codecs)
 *   POST {t, step:"done", path, durationMs} → {ok, sentTo}
 *   POST {t, step:"done", text}             → {ok, sentTo}   (the written answer)
 *
 * Errors come back as {ok:false, error}: expired 410, answered 409, not_found 404, too_big 413, rate_limited 429,
 * bad_request 400, server 500 (lane S, phone-app docs/agents/session-ready/S-notes.md). An answered or expired
 * link may also come back ok:true with the flag set.
 *
 * Pure apart from `fetch`, which the tests pass in.
 */

export type AnswerQuestion = {
  askerName: string;
  askerPhotoUrl: string | null;
  question: string;
  voiceUrl: string | null;
  tellerName: string;
  language: string;
  answered: boolean;
  expired: boolean;
  /** Optional: how the asker addresses the teller in her language ("bà", "ông", "mẹ"). Neutral when absent. */
  tellerTitle: string | null;
  /** Optional, with tellerTitle: what the asker is to her, as Vietnamese names the asker ("cháu", "con"). */
  askerKin: string | null;
};

export type LoadResult =
  | { kind: "ready"; q: AnswerQuestion }
  | { kind: "expired"; q: AnswerQuestion | null }
  | { kind: "answered"; q: AnswerQuestion | null }
  | { kind: "notFound" }
  /** network: it never reached us (check the internet); server: 5xx or rate-limited (try again in a moment) */
  | { kind: "error"; reason: "network" | "server" };

export type SendResult = { sentTo: string | null };

/** Why a send did not land: the question closed meanwhile, or the request itself failed. */
export class SendError extends Error {
  kind: "expired" | "answered" | "failed";
  constructor(kind: "expired" | "answered" | "failed", message?: string) {
    super(message || kind);
    this.kind = kind;
  }
}

export type LinkOptions = {
  endpoint?: string;
  anonKey?: string;
  fetch?: typeof fetch;
};

export function answerEndpoint(base = import.meta.env.VITE_SUPABASE_URL): string {
  return base ? `${String(base).replace(/\/$/, "")}/functions/v1/answer-link` : "";
}

function resolve(opts: LinkOptions) {
  return {
    endpoint: opts.endpoint ?? answerEndpoint(),
    key: opts.anonKey ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
    doFetch: opts.fetch ?? ((...a: Parameters<typeof fetch>) => fetch(...a)),
  };
}

function headers(key: string, json = false): Record<string, string> {
  const h: Record<string, string> = {};
  if (key) {
    h.apikey = key;
    h.Authorization = `Bearer ${key}`;
  }
  if (json) h["Content-Type"] = "application/json";
  return h;
}

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const strOrNull = (v: unknown): string | null => str(v) || null;

/** The payload as the page uses it, or null when it is not a question at all. */
export function parseQuestion(body: unknown): AnswerQuestion | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const question = str(b.question);
  const askerName = str(b.askerName);
  if (!question && !askerName) return null;
  return {
    askerName,
    askerPhotoUrl: strOrNull(b.askerPhotoUrl),
    question,
    voiceUrl: strOrNull(b.voiceUrl),
    tellerName: str(b.tellerName),
    language: str(b.language) || "en",
    answered: b.answered === true,
    expired: b.expired === true,
    tellerTitle: strOrNull(b.tellerTitle),
    askerKin: strOrNull(b.askerKin),
  };
}

/** Read what the server said into one of the page's outcomes. Exported for the tests. */
export function classifyLoad(status: number, body: unknown): LoadResult {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const q = parseQuestion(body);
  const err = str(b.error);
  if (b.expired === true || err === "expired" || status === 410) return { kind: "expired", q };
  if (b.answered === true || err === "answered" || status === 409) return { kind: "answered", q };
  if (status >= 500 || status === 429 || err === "server" || err === "rate_limited") return { kind: "error", reason: "server" };
  if (status >= 400 || b.ok === false) return { kind: "notFound" };
  if (!q || !q.question) return { kind: "error", reason: "server" };
  return { kind: "ready", q };
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function loadQuestion(token: string, opts: LinkOptions = {}): Promise<LoadResult> {
  const { endpoint, key, doFetch } = resolve(opts);
  if (!token || !/^[A-Za-z0-9_-]{6,200}$/.test(token)) return { kind: "notFound" };
  if (!endpoint) return { kind: "error", reason: "server" };
  try {
    const res = await doFetch(`${endpoint}?t=${encodeURIComponent(token)}`, { headers: headers(key) });
    return classifyLoad(res.status, await readJson(res));
  } catch {
    return { kind: "error", reason: "network" };
  }
}

async function post(token: string, body: Record<string, unknown>, opts: LinkOptions): Promise<Record<string, unknown>> {
  const { endpoint, key, doFetch } = resolve(opts);
  if (!endpoint) throw new SendError("failed", "no server");
  let res: Response;
  try {
    res = await doFetch(endpoint, { method: "POST", headers: headers(key, true), body: JSON.stringify({ t: token, ...body }) });
  } catch (e) {
    throw new SendError("failed", (e as Error)?.message);
  }
  const json = ((await readJson(res)) || {}) as Record<string, unknown>;
  const err = str(json.error);
  if (json.expired === true || err === "expired" || res.status === 410) throw new SendError("expired");
  if ((json.answered === true && json.ok !== true) || err === "answered" || res.status === 409) throw new SendError("answered");
  if (!res.ok || json.ok === false) throw new SendError("failed", `status ${res.status}`);
  return json;
}

/** "audio/webm;codecs=opus" → "audio/webm": the server picks the file's ending from the plain type. */
export function plainMime(mime: string | undefined | null): string {
  const m = String(mime || "").split(";")[0].trim().toLowerCase();
  return /^audio\/[a-z0-9.+-]+$/.test(m) ? m : "audio/webm";
}

/** The three steps of a spoken answer: ask where to put it, put it there, say it is done. */
export async function sendVoice(token: string, blob: Blob, durationMs: number, opts: LinkOptions = {}): Promise<SendResult> {
  const mime = plainMime(blob.type);
  const up = await post(token, { step: "upload", mime, size: blob.size }, opts);
  const uploadUrl = str(up.uploadUrl);
  const path = str(up.path);
  const contentType = str(up.contentType) || mime;
  if (!uploadUrl || !path) throw new SendError("failed", "no upload url");
  const { doFetch } = resolve(opts);
  let put: Response;
  try {
    put = await doFetch(uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: blob });
  } catch (e) {
    throw new SendError("failed", (e as Error)?.message);
  }
  if (!put.ok) throw new SendError("failed", `upload ${put.status}`);
  const done = await post(token, { step: "done", path, durationMs: Math.max(0, Math.round(durationMs)) }, opts);
  return { sentTo: strOrNull(done.sentTo) };
}

/** The written answer, when the microphone is refused or missing. */
export async function sendText(token: string, text: string, opts: LinkOptions = {}): Promise<SendResult> {
  const t = text.trim();
  if (!t) throw new SendError("failed", "empty");
  const done = await post(token, { step: "done", text: t }, opts);
  return { sentTo: strOrNull(done.sentTo) };
}
