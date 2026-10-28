/**
 * What a family can do with a paid printed-book order, the web's side of book-order-help (phone repo,
 * supabase/functions/book-order-help; docs/PLAN_ORDERING.md, Phase 5 rulings P5-R12, R13, R16):
 *
 *   cancelOrder(orderId)              during the hour's hold only: the server refunds a charged order in full, or
 *                                      cancels one credits covered, and gives the credits back
 *   reportProblem({ orderId, reason, description, photoPath })
 *                                      once the book has shipped: what happened, and an optional photo
 *   uploadIssuePhoto(orderId, file)    the photo first, shrunk in the browser to a JPEG of at most 2000 px, into the
 *                                      private order-issues bucket at <orderId>/<uuid>.jpg; returns its path
 *
 * The server's own sentence is what the family reads (P5-R16), whether it says yes or no. Every error is an
 * OrderHelpError: its message is a sentence for the family, never a code, and `code` is the server's (too_late,
 * not_yet…) for the page.
 */
import { supabase } from "../lib/supabase";

export const ORDER_HELP_FUNCTION = "book-order-help";
export const ISSUE_BUCKET = "order-issues";
/** The photo's longest side once shrunk, and its JPEG quality. */
export const ISSUE_PHOTO_EDGE = 2000;
export const ISSUE_PHOTO_QUALITY = 0.85;
export const MAX_DESCRIPTION = 2000;

export type IssueReason = "not_arrived" | "damaged" | "wrong" | "other";

/** The four reasons, in the words of the form (P5-R16). */
export const ISSUE_REASONS: readonly { id: IssueReason; label: string }[] = Object.freeze([
  { id: "not_arrived", label: "It hasn’t arrived" },
  { id: "damaged", label: "It arrived damaged" },
  { id: "wrong", label: "Something in the book is wrong" },
  { id: "other", label: "Something else" },
]);

export type HelpAnswer = { status: string; words: string };

/** A sentence for each thing that can go wrong, when the server sends none. Never a code, never the printer. */
export const ORDER_HELP_MESSAGES: Record<string, string> = {
  not_signed_in: "Please sign in again, then try once more.",
  not_found: "We couldn’t find that order.",
  too_late: "Your book has already gone to print, so it can’t be canceled here. Write to us at daniel@astoryapp.com and we’ll help.",
  refund_failed: "We couldn’t cancel just now. Nothing has changed. Please try again in a minute.",
  needs_help: "We couldn’t cancel this order here. Write to us at daniel@astoryapp.com and we’ll help.",
  not_yet: "You can report a problem once your book has shipped.",
  needs_description: "Please tell us a little about what happened.",
  bad_photo: "That photo didn’t upload. Please try adding it again.",
  unreadable_photo: "That photo couldn’t be read. Please choose a different one.",
  too_many: "We already have your reports for this order. We’ll write to you by email.",
  network: "We couldn’t reach A Story. Please check your connection and try again.",
  unknown: "Something went wrong on our side. Please try again in a moment.",
};

const BY_STATUS: Record<number, string> = { 401: "not_signed_in", 404: "not_found", 429: "too_many" };

export class OrderHelpError extends Error {
  /** The server's code (too_late, not_yet…), or network / unknown / unreadable_photo. */
  code: string;
  constructor(code: string, words?: string | null) {
    super(words || ORDER_HELP_MESSAGES[code] || ORDER_HELP_MESSAGES.unknown);
    this.name = "OrderHelpError";
    this.code = code;
  }
}

/** The server's own sentence: a short line of plain words, never a code (printOrder.ts wordsOf). */
const wordsOf = (v: unknown) => (typeof v === "string" && /^[A-Z][^_<>{}]{5,240}$/.test(v.trim()) ? v.trim() : null);

function refusal(body: unknown, status?: number): OrderHelpError {
  const b = (body && typeof body === "object" ? body : {}) as { error?: unknown; words?: unknown };
  const named = typeof b.error === "string" && /^[a-z_]{2,40}$/.test(b.error) ? b.error : null;
  const code = named ?? (status ? BY_STATUS[status] : undefined) ?? "unknown";
  return new OrderHelpError(code, wordsOf(b.words));
}

/** The error supabase-js hands back from invoke, read into an OrderHelpError with the server's words. Exported for the tests. */
export async function helpErrorOf(err: unknown): Promise<OrderHelpError> {
  const e = err as { name?: string; context?: Response } | null;
  if (e?.name === "FunctionsFetchError" || e?.name === "FunctionsRelayError") return new OrderHelpError("network");
  const ctx = e?.context;
  if (!ctx) return new OrderHelpError("network");
  let body: unknown = null;
  try {
    if (ctx.json) body = await ctx.json();
  } catch {
    /* not JSON */
  }
  return refusal(body, Number(ctx.status));
}

async function call(body: Record<string, unknown>): Promise<HelpAnswer> {
  let res: { data: unknown; error: unknown };
  try {
    res = await supabase().functions.invoke(ORDER_HELP_FUNCTION, { body });
  } catch {
    throw new OrderHelpError("network");
  }
  if (res.error) throw await helpErrorOf(res.error);
  const d = res.data as Record<string, unknown> | null;
  if (!d || typeof d !== "object") throw new OrderHelpError("unknown");
  if (typeof d.error === "string" || d.ok !== true) throw refusal(d);
  const words = wordsOf(d.words);
  if (typeof d.status !== "string" || !words) throw new OrderHelpError("unknown");
  return { status: d.status, words };
}

/** Cancels the order during the hold. Resolves with its new status (refunded or canceled) and the server's sentence. Throws OrderHelpError. */
export function cancelOrder(orderId: string): Promise<HelpAnswer> {
  if (!orderId) return Promise.reject(new OrderHelpError("not_found"));
  return call({ action: "cancel", orderId });
}

/** Tells A Story what went wrong with a book that has shipped. Throws OrderHelpError (needs_description, bad_photo, too_many…). */
export function reportProblem({ orderId, reason, description, photoPath }: { orderId: string; reason: IssueReason; description: string; photoPath?: string | null }): Promise<HelpAnswer> {
  if (!orderId) return Promise.reject(new OrderHelpError("not_found"));
  const text = description.trim();
  if (!text || text.length > MAX_DESCRIPTION) return Promise.reject(new OrderHelpError("needs_description"));
  return call({ action: "report", orderId, reason, description: text, ...(photoPath ? { photoPath } : {}) });
}

/** The photo, decoded and drawn at most ISSUE_PHOTO_EDGE px on its longest side, as a JPEG. Throws unreadable_photo. */
async function shrinkToJpeg(file: Blob): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // HEIC in Chrome, a file that isn't a picture: the family is asked for another (follow-up: HEIC on web)
    throw new OrderHelpError("unreadable_photo");
  }
  const scale = Math.min(1, ISSUE_PHOTO_EDGE / Math.max(bitmap.width, bitmap.height, 1));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new OrderHelpError("unreadable_photo");
  // a transparent PNG would turn black as a JPEG: paper white underneath
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", ISSUE_PHOTO_QUALITY));
  if (!blob) throw new OrderHelpError("unreadable_photo");
  return blob;
}

/**
 * The photo of the problem, shrunk and uploaded to the private order-issues bucket at <orderId>/<uuid>.jpg (the
 * bucket's policy lets the order's owner add one once the book has shipped, and nobody read it back). Returns the
 * path to send with reportProblem. Throws OrderHelpError: unreadable_photo, or bad_photo when the upload fails.
 */
export async function uploadIssuePhoto(orderId: string, file: Blob): Promise<string> {
  const jpeg = await shrinkToJpeg(file);
  const path = `${orderId}/${crypto.randomUUID()}.jpg`;
  let error: unknown;
  try {
    ({ error } = await supabase().storage.from(ISSUE_BUCKET).upload(path, jpeg, { contentType: "image/jpeg", upsert: false }));
  } catch {
    throw new OrderHelpError("bad_photo");
  }
  if (error) throw new OrderHelpError("bad_photo");
  return path;
}
