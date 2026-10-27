/**
 * The web's side of a locked book version (R3, R10, R11): the book-version
 * edge function, called the way the rest of the book code calls its
 * functions (supabase.functions.invoke, data/book.ts).
 *
 *   1. prepareVersion(storyId): the server snapshots the story from the
 *      database (never this page's copy of it) into a new, unapproved
 *      book_versions row and answers with its id, the print profile to set
 *      the book with, the two paths to upload to and the book's listen key.
 *   2. The page makes the files with that profile (printPdf.ts
 *      prepareBookPdfs) and files them (uploadVersionPdfs) at uploadPaths.
 *   3. approveVersion(...): with the family's tick in the box, the server
 *      checks the files are there and the page count is one it can bind,
 *      and sets approved_at. From then on the version can't change.
 *
 * Body shapes ({ action: "prepare" | "approve", ... }) are the contract with
 * supabase/functions/book-version/index.ts in the phone repo. The print
 * profile's name always comes from the server, never from here.
 *
 * Every error is a BookVersionError whose message is a plain sentence for
 * the family; `reason` is for the page. The server answers a refusal with
 * { error: <code>, words: <a sentence> }; its words are used when it sends
 * them (they can name the page count), and ours otherwise.
 */
import { supabase } from "./supabase";

export const BOOK_VERSION_FUNCTION = "book-version";

/** The box the family ticks before a book is locked for printing. The same words as the server's. */
export const APPROVE_CHECKBOX_TEXT = "I've reviewed my book and it's ready to print.";

export type PreparedVersion = {
  versionId: string;
  /** 1 for a story's first approved book, then 2, 3… */
  version: number;
  /** legacyBook PRINT_PROFILES name to set the book with (printPdf.ts prepareBookPdfs's `profile`). */
  printProfile: string;
  /** Where the two files go in the book-versions bucket: [interior, cover]. */
  uploadPaths: [string, string];
  /** The key the book's listening codes carry, so a code opens this book's recordings. */
  listenKey: string | null;
  minPages: number;
  maxPages: number;
};

export type PreflightWarning = { kind: string; words: string; memoryId?: string | null; [k: string]: unknown };
/** What preflight.js found, as the server records it with the version. Opaque here apart from its warnings. */
export type PreflightResult = { ok?: boolean; warnings?: PreflightWarning[]; [k: string]: unknown };

export type ApproveRequest = {
  versionId: string;
  /** The interior's bound page count (printPdf bookPlan's `pages`). */
  pageCount: number;
  preflight: PreflightResult | null;
  /** The family ticked APPROVE_CHECKBOX_TEXT. Anything but true is refused before the server is asked. */
  confirmed: boolean;
};

export type ApprovedVersion = { versionId: string; approvedAt: string | null };

export type BookVersionReason =
  | "not_signed_in"
  | "not_allowed"
  | "not_found"
  | "empty_book"
  | "not_confirmed"
  | "bad_page_count"
  | "missing_file"
  | "already_approved"
  | "busy"
  | "unavailable"
  | "network"
  | "unknown";

/** A sentence a family can read for each reason. Never a status code, never a printer's word. */
export const BOOK_VERSION_MESSAGES: Record<BookVersionReason, string> = {
  not_signed_in: "Please sign in again, then try once more.",
  not_allowed: "Only the family of this story can prepare its book.",
  not_found: "We couldn’t find this book. Please go back and open it again.",
  empty_book: "The book has no memories yet. Add a memory and try again.",
  not_confirmed: "Please tick the box to say you’ve looked through the book.",
  bad_page_count: "The book’s pages didn’t come out the way the printer needs them. Please prepare the book again.",
  missing_file: "Your book’s pages didn’t finish saving. Please prepare the book again.",
  already_approved: "This book is already locked for printing. To make changes, edit the story and prepare the book again.",
  busy: "Your book is being prepared in another window. Please try again in a moment.",
  unavailable: "We can’t print books just now. Please try again later.",
  network: "We couldn’t reach A Story. Please check your connection and try again.",
  unknown: "Something went wrong while preparing your book. Please try again.",
};

/** What the server or the network says, in the words above. */
export class BookVersionError extends Error {
  reason: BookVersionReason;
  constructor(reason: BookVersionReason, words?: string | null) {
    super(words || BOOK_VERSION_MESSAGES[reason]);
    this.name = "BookVersionError";
    this.reason = reason;
  }
}

/** The server's reasons (and their older spellings) in our words. Unknown reasons fall back to the HTTP status. */
const REASONS: Record<string, BookVersionReason> = {
  unauthorized: "not_signed_in",
  not_signed_in: "not_signed_in",
  forbidden: "not_allowed",
  not_yours: "not_allowed",
  not_member: "not_allowed",
  not_allowed: "not_allowed",
  not_found: "not_found",
  no_story: "not_found",
  empty: "empty_book",
  empty_book: "empty_book",
  no_memories: "empty_book",
  not_confirmed: "not_confirmed",
  bad_page_count: "bad_page_count",
  page_count: "bad_page_count",
  too_many_pages: "bad_page_count",
  too_few_pages: "bad_page_count",
  odd_pages: "bad_page_count",
  uneven_pages: "bad_page_count",
  missing_file: "missing_file",
  missing_files: "missing_file",
  files_missing: "missing_file",
  empty_file: "missing_file",
  missing_interior: "missing_file",
  missing_cover: "missing_file",
  already_approved: "already_approved",
  approved: "already_approved",
  locked: "already_approved",
  busy: "busy",
  no_product: "unavailable",
};

const BY_STATUS: Record<number, BookVersionReason> = { 401: "not_signed_in", 403: "not_allowed", 404: "not_found", 503: "unavailable" };

/** The server's own sentence, when it sent one: a short line of plain words, never a code. */
const wordsOf = (v: unknown) => (typeof v === "string" && /^[A-Z][^_<>{}]{5,240}$/.test(v.trim()) ? v.trim() : null);

/**
 * The error supabase-js hands back from invoke, read into one of our reasons and, when the server sent them, its
 * words. Exported for the tests.
 */
export async function reasonOf(err: unknown): Promise<{ reason: BookVersionReason; words: string | null }> {
  const e = err as { name?: string; context?: Response } | null;
  if (e?.name === "FunctionsFetchError" || e?.name === "FunctionsRelayError") return { reason: "network", words: null };
  const ctx = e?.context;
  let code: string | null = null;
  let words: string | null = null;
  try {
    if (ctx?.json) {
      const body = (await ctx.json()) as { error?: unknown; reason?: unknown; words?: unknown };
      code = [body?.error, body?.reason].find((c): c is string => typeof c === "string" && Object.hasOwn(REASONS, c)) ?? null;
      words = wordsOf(body?.words);
    }
  } catch {
    /* not JSON */
  }
  const reason = (code && REASONS[code]) || BY_STATUS[Number(ctx?.status)] || (ctx ? "unknown" : "network");
  return { reason, words };
}

async function call(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  let res: { data: unknown; error: unknown };
  try {
    res = await supabase().functions.invoke(BOOK_VERSION_FUNCTION, { body });
  } catch {
    throw new BookVersionError("network");
  }
  if (res.error) {
    const { reason, words } = await reasonOf(res.error);
    throw new BookVersionError(reason, words);
  }
  const data = res.data as Record<string, unknown> | null;
  if (!data || typeof data !== "object") throw new BookVersionError("unknown");
  if (data.ok === false || (typeof data.error === "string" && !data.versionId)) {
    const code = [data.error, data.reason].find((c): c is string => typeof c === "string" && Object.hasOwn(REASONS, c));
    throw new BookVersionError(code ? REASONS[code] : "unknown", wordsOf(data.words));
  }
  return data;
}

const text = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v : null);
const whole = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v > 0 ? v : null);

/**
 * Snapshots the story into a new, unapproved book version (server-side, from the database) and says how to make
 * and where to file its two files. Throws BookVersionError.
 */
export async function prepareVersion(storyId: string): Promise<PreparedVersion> {
  if (!storyId) throw new BookVersionError("not_found");
  const d = await call({ action: "prepare", storyId });
  const versionId = text(d.versionId);
  const printProfile = text(d.printProfile);
  const version = whole(d.version);
  const minPages = whole(d.minPages);
  const maxPages = whole(d.maxPages);
  const paths = Array.isArray(d.uploadPaths) ? d.uploadPaths : [];
  const [interior, cover] = paths.map(text);
  // An answer missing any of these is a server this page doesn't understand: stop rather than guess.
  if (!versionId || !printProfile || !version || !minPages || !maxPages || paths.length !== 2 || !interior || !cover) throw new BookVersionError("unknown");
  return { versionId, version, printProfile, uploadPaths: [interior, cover], listenKey: text(d.listenKey), minPages, maxPages };
}

/**
 * Locks the version for printing: the family's tick, the bound page count and what preflight found. Refuses
 * without asking the server when the box isn't ticked or the count isn't a page count. Throws BookVersionError.
 */
export async function approveVersion({ versionId, pageCount, preflight, confirmed }: ApproveRequest): Promise<ApprovedVersion> {
  if (confirmed !== true) throw new BookVersionError("not_confirmed");
  if (!versionId) throw new BookVersionError("not_found");
  if (!whole(pageCount)) throw new BookVersionError("bad_page_count");
  const d = await call({ action: "approve", versionId, pageCount, preflight: preflight ?? null, confirmed: true });
  return { versionId: text(d.versionId) ?? versionId, approvedAt: text(d.approvedAt) };
}
