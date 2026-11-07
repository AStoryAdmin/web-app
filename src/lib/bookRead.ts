/**
 * The printed book's codes (/read, T18): a code at every chapter opener and, in
 * older books, one beside each memory with a recording. The phone app prints
 * them (phone-app/src/lib/bookDesign.js chapterReadUrl and listenUrl):
 *
 *   /read?s=<story short id>&c=<chapter slug>&k=<listenKey>   a chapter
 *   /read?m=<memory short id>&k=<listenKey>                   one memory
 *
 * Whoever scans one has no account. The key printed in the book is the
 * credential; the server call is `book_read`
 * (phone-app/supabase/book_read_2026_11_06.sql), made as PostgREST's rpc with
 * the anon key the way the /m/ page calls memory_link_read: no supabase-js,
 * so the light app stays light.
 *
 *   POST /rest/v1/rpc/book_read {p_story_short, p_key, p_chapter, p_memory_short}
 *     → [{memory_short, title, body, era, period, photo_url, has_voice, teller_name, sides}]
 *     → []                 a wrong or unknown code (the server never says which)
 *     → 404 PGRST202       the SQL is not on the server yet
 *
 * The chapter in a code is a slug of the chapter's name (chapterSlug below,
 * copied from bookDesign.js at a8a3dcb1: app-core's copy predates it). The
 * server wants the name, so the slug is turned back into one here over the
 * chapters a book can have: data/eras.js's ERAS, and for a book arranged by
 * year, "The 1960s" and "Other memories" (legacyBook.js bookStructure). A
 * decade is not a column on the server, so a decade's code asks for the whole
 * book and groups it here with the same memoryDate the book printed with.
 *
 * The sample books on astoryapp.com/samples print codes too (plan 2026-11-07 D3). Their families are fictional,
 * so there is no story row and no key; a sample's code opens a static file bundled with this app instead:
 *
 *   /read?sample=<book id>&c=<chapter slug>     public/read-samples/<book id>.json, written by the site's
 *                                                scripts/samples-to-read.mjs from the sample book's own data
 *
 * Nothing is asked of Supabase for a sample. Its "Hear it" plays a clip bundled beside the file, a synthetic
 * voice, and the page says so.
 *
 * Pure apart from `fetch`, which the tests pass in.
 */
import { ERAS, CATCH_ALL_CHAPTER, FAMILY_CHAPTER } from "../app-core/data/eras.js";
import { memoryDate, sortByDate } from "../app-core/lib/timeline.js";
import { readableTranscript } from "../app-core/lib/quoteText.js";

/** A chapter's name as a URL slug: "Where we come from" → where-we-come-from (bookDesign.js chapterSlug). */
export function chapterSlug(era: string): string {
  return String(era || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The catch-all chapter prints as "More stories" (bookDesign.js printedChapterName). */
export function printedChapterName(era: string): string {
  return era === CATCH_ALL_CHAPTER ? "More stories" : era;
}

const SHORT_ID = /^[A-Za-z0-9_-]{22}$/;
const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const KEY = /^[A-Za-z0-9_-]{12,40}$/;

/** A story's or memory's id as the code carries it: 22 base64url characters, or (a demo's) plain uuid. */
export const cleanId = (v: unknown): string => {
  const s = String(v || "").trim();
  return SHORT_ID.test(s) || UUID.test(s) ? s : "";
};
export const cleanKey = (v: unknown): string => {
  const s = String(v || "").trim();
  return KEY.test(s) ? s : "";
};

/** What a chapter code asks for: one of the book's chapters, a decade of a book by year, or the undated ones. */
export type Chapter =
  | { kind: "era"; era: string; name: string }
  | { kind: "decade"; decade: number; name: string }
  | { kind: "undated"; name: string };

/** The chapter a printed slug names, or null for one no book has (the family's own chapter is never a code). */
export function resolveChapter(slug: string): Chapter | null {
  const s = chapterSlug(slug);
  if (!s) return null;
  const era = (ERAS as string[]).find((e) => chapterSlug(e) === s);
  if (era) return era === FAMILY_CHAPTER ? null : { kind: "era", era, name: printedChapterName(era) };
  const dec = /^the-(1[6-9]\d0|20[0-4]0)s$/.exec(s);
  if (dec) return { kind: "decade", decade: Number(dec[1]), name: `The ${dec[1]}s` };
  if (s === "other-memories") return { kind: "undated", name: "Other memories" };
  return null;
}

export type ReadQuery =
  | { kind: "chapter"; story: string; chapter: Chapter; key: string }
  | { kind: "memory"; memory: string; key: string }
  /** a sample book's chapter: the site's fictional families, read from a bundled file (see the top) */
  | { kind: "sample"; book: string; slug: string }
  /** a code this page cannot read: missing or malformed parts, or a chapter no book has */
  | { kind: "invalid" };

const SAMPLE_BOOK = /^[a-z][a-z0-9-]{0,39}$/;

/** The query string of a code as what the page should ask for. */
export function parseReadQuery(search: string): ReadQuery {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (q.has("sample")) {
    const book = String(q.get("sample") || "").trim();
    const slug = String(q.get("c") || "").trim();
    // the slug exactly as chapterSlug prints it, nothing looser
    return SAMPLE_BOOK.test(book) && slug && chapterSlug(slug) === slug ? { kind: "sample", book, slug } : { kind: "invalid" };
  }
  const key = cleanKey(q.get("k"));
  if (!key) return { kind: "invalid" };
  const memory = cleanId(q.get("m"));
  if (memory) return { kind: "memory", memory, key };
  const story = cleanId(q.get("s"));
  const chapter = resolveChapter(q.get("c") || "");
  if (!story || !chapter) return { kind: "invalid" };
  return { kind: "chapter", story, chapter, key };
}

export type Side = { name: string; body: string };

export type ReadMemory = {
  /** the memory's short id: what the listen code carries, never the uuid */
  id: string;
  title: string;
  /** the words as the page sets them: a transcript cleaned by readableTranscript, prose as it was */
  body: string;
  era: string;
  period: string;
  photoUrl: string | null;
  hasVoice: boolean;
  tellerName: string;
  /** the family's kept sides, as the book prints them */
  sides: Side[];
  /** a sample's bundled clip (a real book's voice plays through the listen function: listenSrc) */
  voiceSrc?: string;
};

export type LoadResult =
  | { kind: "shown"; memories: ReadMemory[] }
  /** the server knows no book for this code, or the chapter has nothing to read */
  | { kind: "notFound" }
  /** the server has no book_read yet (the owner has not run the SQL) */
  | { kind: "notReady" }
  /** network: it never reached us; server: 5xx or rate-limited */
  | { kind: "error"; reason: "network" | "server" };

export type ReadOptions = {
  /** where the sample files are served from: the app's own base ("/") */
  sampleBase?: string;
  endpoint?: string;
  anonKey?: string;
  fetch?: typeof fetch;
};

const base = (b: unknown) => String(b || "").replace(/\/+$/, "");

export function readEndpoint(supabaseUrl = import.meta.env.VITE_SUPABASE_URL): string {
  return supabaseUrl ? `${base(supabaseUrl)}/rest/v1/rpc/book_read` : "";
}

/**
 * Where a memory's voice plays from: the listen function with the memory and the book's key, the very code the
 * older books print beside a recording (bookDesign.js listenUrl), which the function answers with no account.
 * "" without a server, a memory or a key.
 */
export function listenSrc(memoryId: string, key: string, supabaseUrl = import.meta.env.VITE_SUPABASE_URL): string {
  const m = cleanId(memoryId);
  const k = cleanKey(key);
  return m && k && supabaseUrl ? `${base(supabaseUrl)}/functions/v1/listen?m=${encodeURIComponent(m)}&k=${encodeURIComponent(k)}` : "";
}

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** One row of book_read as the page uses it, or null when it is not a memory. */
export function parseRow(row: unknown): ReadMemory | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const id = cleanId(r.memory_short);
  if (!id) return null;
  const title = str(r.title);
  const body = String(readableTranscript(str(r.body)) || "").trim();
  if (!title && !body) return null;
  const sides = Array.isArray(r.sides)
    ? (r.sides as unknown[])
        .map((s) => (s && typeof s === "object" ? { name: str((s as Record<string, unknown>).name), body: str((s as Record<string, unknown>).body) } : null))
        .filter((s): s is Side => Boolean(s && s.body))
    : [];
  return {
    id,
    title,
    body,
    era: str(r.era),
    period: str(r.period),
    photoUrl: str(r.photo_url) || null,
    hasVoice: r.has_voice === true,
    tellerName: str(r.teller_name),
    sides,
  };
}

/** A decade's memories, or the undated ones, out of the whole book, grouped as legacyBook.js bookStructure groups a book by year. */
export function inChapter(memories: ReadMemory[], chapter: Chapter): ReadMemory[] {
  if (chapter.kind === "era") return memories.filter((m) => m.era === chapter.era);
  const dated = memories.map((m) => ({ m, year: (memoryDate(m) as { year: number | null }).year }));
  if (chapter.kind === "undated") return dated.filter((d) => d.year == null).map((d) => d.m);
  return dated.filter((d) => d.year != null && Math.floor((d.year as number) / 10) * 10 === chapter.decade).map((d) => d.m);
}

/** Read what the server said into one of the page's outcomes. Exported for the tests. */
export function classifyLoad(status: number, body: unknown, chapter: Chapter | null = null): LoadResult {
  if (status >= 500 || status === 429) return { kind: "error", reason: "server" };
  if (status >= 400) {
    const code = body && typeof body === "object" ? str((body as Record<string, unknown>).code) : "";
    // PostgREST: no such function (PGRST202), or no such table under it (42P01)
    if (code === "PGRST202" || code === "42P01" || code === "42883") return { kind: "notReady" };
    return { kind: "notFound" };
  }
  const rows = Array.isArray(body) ? body : [];
  let memories = rows.map(parseRow).filter((m): m is ReadMemory => m !== null);
  if (chapter) memories = inChapter(memories, chapter);
  // the book's order: by date, the undated last (the server already has them oldest-kept first)
  memories = sortByDate(memories) as ReadMemory[];
  return memories.length ? { kind: "shown", memories } : { kind: "notFound" };
}

function resolve(opts: ReadOptions) {
  return {
    endpoint: opts.endpoint ?? readEndpoint(),
    key: opts.anonKey ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
    doFetch: opts.fetch ?? ((...a: Parameters<typeof fetch>) => fetch(...a)),
  };
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** A sample's file: public/read-samples/<book>.json under the app's base. */
export function sampleUrl(book: string, sampleBase: string = import.meta.env.BASE_URL || "/"): string {
  return `${base(sampleBase)}/read-samples/${encodeURIComponent(book)}.json`;
}

/** A sample's own files only: a path under /read-samples/, or (a photograph) an image already live on the site. */
function samplePath(v: unknown, live = false): string | null {
  const s = str(v);
  if (/^\/read-samples\/[A-Za-z0-9._/-]+$/.test(s) && !s.includes("..")) return s;
  if (live && /^https:\/\/astoryapp\.com\/[A-Za-z0-9._/-]+$/.test(s) && !s.includes("..")) return s;
  return null;
}

/** One memory of a sample file as the page uses it, or null when it is not one. */
export function parseSampleMemory(row: unknown, chapterName: string, teller: string): ReadMemory | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const id = str(r.id);
  const title = str(r.title);
  const body = str(r.body);
  if (!id || (!title && !body)) return null;
  const voiceSrc = samplePath(r.audio);
  const sides = Array.isArray(r.sides)
    ? (r.sides as unknown[])
        .map((s) => (s && typeof s === "object" ? { name: str((s as Record<string, unknown>).name), body: str((s as Record<string, unknown>).body) } : null))
        .filter((s): s is Side => Boolean(s && s.body))
    : [];
  return {
    id,
    title,
    body,
    era: chapterName,
    period: str(r.period),
    photoUrl: samplePath(r.photo, true),
    hasVoice: Boolean(voiceSrc),
    tellerName: teller,
    sides,
    ...(voiceSrc ? { voiceSrc } : {}),
  };
}

/** A sample file's answer for one chapter slug, its memories in the book's own order. Exported for the tests. */
export function classifySample(status: number, body: unknown, slug: string): LoadResult {
  if (status >= 500 || status === 429) return { kind: "error", reason: "server" };
  if (status >= 400 || !body || typeof body !== "object") return { kind: "notFound" };
  const b = body as Record<string, unknown>;
  const chapters = Array.isArray(b.chapters) ? (b.chapters as unknown[]) : [];
  const ch = chapters.find((c) => c && typeof c === "object" && str((c as Record<string, unknown>).slug) === slug) as Record<string, unknown> | undefined;
  if (!ch) return { kind: "notFound" };
  const name = str(ch.name);
  const teller = str(b.teller);
  const memories = (Array.isArray(ch.memories) ? (ch.memories as unknown[]) : [])
    .map((m) => parseSampleMemory(m, name, teller))
    .filter((m): m is ReadMemory => m !== null);
  return name && memories.length ? { kind: "shown", memories } : { kind: "notFound" };
}

async function loadSample(q: Extract<ReadQuery, { kind: "sample" }>, opts: ReadOptions): Promise<LoadResult> {
  const doFetch = opts.fetch ?? ((...a: Parameters<typeof fetch>) => fetch(...a));
  try {
    const res = await doFetch(sampleUrl(q.book, opts.sampleBase), { method: "GET", headers: { Accept: "application/json" } });
    // a file that is not there can come back as the app's index.html: not JSON, so not a book
    return classifySample(res.status, await readJson(res), q.slug);
  } catch {
    return { kind: "error", reason: "network" };
  }
}

/** The body book_read is called with for a code. A decade asks for the whole book (see the top). */
export function rpcBody(q: Exclude<ReadQuery, { kind: "invalid" } | { kind: "sample" }>): Record<string, string | null> {
  if (q.kind === "memory") return { p_story_short: null, p_key: q.key, p_chapter: null, p_memory_short: q.memory };
  return { p_story_short: q.story, p_key: q.key, p_chapter: q.chapter.kind === "era" ? q.chapter.era : null, p_memory_short: null };
}

export async function loadBook(q: ReadQuery, opts: ReadOptions = {}): Promise<LoadResult> {
  if (q.kind === "invalid") return { kind: "notFound" };
  if (q.kind === "sample") return loadSample(q, opts);
  const { endpoint, key, doFetch } = resolve(opts);
  if (!endpoint) return { kind: "error", reason: "server" };
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (key) {
    headers.apikey = key;
    headers.Authorization = `Bearer ${key}`;
  }
  try {
    const res = await doFetch(endpoint, { method: "POST", headers, body: JSON.stringify(rpcBody(q)) });
    return classifyLoad(res.status, await readJson(res), q.kind === "chapter" && q.chapter.kind !== "era" ? q.chapter : null);
  } catch {
    return { kind: "error", reason: "network" };
  }
}
