/**
 * The link to one memory (/m/:token, T19): the page a person without A Story
 * opens from a message to see one memory and hear its voice, once. The one
 * server call is `memory_link_read` (phone-app/supabase/memory_links_2026_10_22.sql
 * and memory_links_2026_11_06.sql), made as PostgREST's rpc with the anon key,
 * the way answerLink.ts talks to its function: no supabase-js, so the light
 * app (LiteApp) stays light.
 *
 *   POST /rest/v1/rpc/memory_link_read {p_token}
 *     → [{title, period, body, photo_url, teller_name, sender_name, has_voice, audio_seconds, opened, …}]
 *     → [{opened: true, sender_name}]   it was opened before: say so, name the sender
 *     → []                              unknown, revoked, expired or full
 *     → 404 PGRST202                    the SQL is not on the server yet
 *
 * The voice is played by the `listen` Edge Function with ?t=<token>
 * (phone-app/supabase/functions/listen/index.ts), which signs that one
 * memory's recording: the page never sees a storage path or a key.
 *
 * Pure apart from `fetch`, which the tests pass in.
 */

/**
 * Upper case, letters and digits only; "" unless it is ten long (data/memoryLinks.ts
 * normaliseMemoryToken, kept apart from it so this page never loads supabase-js).
 */
export function cleanToken(input: unknown): string {
  const t = String(input || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return t.length === 10 ? t : "";
}

export type LinkedMemory = {
  title: string;
  period: string;
  body: string;
  photoUrl: string | null;
  tellerName: string;
  senderName: string;
  forName: string;
  hasVoice: boolean;
  audioSeconds: number | null;
};

export type LoadResult =
  | { kind: "shown"; memory: LinkedMemory }
  /** opened before (or just now by somebody else): the sender's first name when the server has it */
  | { kind: "opened"; senderName: string }
  | { kind: "notFound" }
  /** the server has no memory_link_read yet (the owner has not run the SQL) */
  | { kind: "notReady" }
  /** network: it never reached us; server: 5xx or rate-limited */
  | { kind: "error"; reason: "network" | "server" };

export type LinkOptions = {
  endpoint?: string;
  anonKey?: string;
  fetch?: typeof fetch;
};

const base = (b: unknown) => String(b || "").replace(/\/+$/, "");

export function readEndpoint(supabaseUrl = import.meta.env.VITE_SUPABASE_URL): string {
  return supabaseUrl ? `${base(supabaseUrl)}/rest/v1/rpc/memory_link_read` : "";
}

/** Where the memory's voice plays from: the listen function, keyed by the link itself. "" without a server or a token. */
export function listenSrc(token: string, supabaseUrl = import.meta.env.VITE_SUPABASE_URL): string {
  const t = cleanToken(token);
  return t && supabaseUrl ? `${base(supabaseUrl)}/functions/v1/listen?t=${t}` : "";
}

function resolve(opts: LinkOptions) {
  return {
    endpoint: opts.endpoint ?? readEndpoint(),
    key: opts.anonKey ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
    doFetch: opts.fetch ?? ((...a: Parameters<typeof fetch>) => fetch(...a)),
  };
}

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** One row of memory_link_read as the page uses it, or null when it is not a memory. */
export function parseMemory(row: unknown): LinkedMemory | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const title = str(r.title);
  const body = str(r.body);
  if (!title && !body && !str(r.photo_url)) return null;
  const secs = Number(r.audio_seconds);
  return {
    title,
    period: str(r.period),
    body,
    photoUrl: str(r.photo_url) || null,
    tellerName: str(r.teller_name),
    senderName: str(r.sender_name),
    forName: str(r.for_name),
    hasVoice: r.has_voice === true,
    audioSeconds: Number.isFinite(secs) && secs > 0 ? Math.round(secs) : null,
  };
}

/** Read what the server said into one of the page's outcomes. Exported for the tests. */
export function classifyLoad(status: number, body: unknown): LoadResult {
  if (status >= 500 || status === 429) return { kind: "error", reason: "server" };
  if (status >= 400) {
    const code = body && typeof body === "object" ? str((body as Record<string, unknown>).code) : "";
    // PostgREST: no such function (PGRST202), or no such table under it (42P01)
    if (code === "PGRST202" || code === "42P01" || code === "42883") return { kind: "notReady" };
    return { kind: "notFound" };
  }
  const row = Array.isArray(body) ? body[0] : body;
  if (!row || typeof row !== "object") return { kind: "notFound" };
  const r = row as Record<string, unknown>;
  if (r.opened === true) return { kind: "opened", senderName: str(r.sender_name) };
  const memory = parseMemory(row);
  return memory ? { kind: "shown", memory } : { kind: "notFound" };
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function loadMemory(token: string, opts: LinkOptions = {}): Promise<LoadResult> {
  const { endpoint, key, doFetch } = resolve(opts);
  const t = cleanToken(token);
  if (!t) return { kind: "notFound" };
  if (!endpoint) return { kind: "error", reason: "server" };
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (key) {
    headers.apikey = key;
    headers.Authorization = `Bearer ${key}`;
  }
  try {
    const res = await doFetch(endpoint, { method: "POST", headers, body: JSON.stringify({ p_token: t }) });
    return classifyLoad(res.status, await readJson(res));
  } catch {
    return { kind: "error", reason: "network" };
  }
}
