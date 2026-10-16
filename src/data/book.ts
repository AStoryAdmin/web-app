/**
 * The printed book's two calls to create-book-checkout (the app's
 * src/data/book.js). What a book costs somebody (included with their
 * membership, already had, or bought) is decided on the server from their
 * plan and their orders; the web only shows it. Print at home is free and
 * never asks the server: the HTML is built on the page (app-core legacyBook).
 */
import { supabase } from "../lib/supabase";

export type EditionId = "home" | "digital" | "softcover" | "hardcover" | "heirloom" | "legacy";

export type Edition = { id: EditionId; priceCents: number; extraCents?: number | null; sale?: boolean };

export type BookOffer = {
  included: boolean;
  reason: string;
  member: boolean;
  plan?: string;
  orderingOpen: boolean;
  priceCents: number | null;
  shippingCents: number | null;
  creditCents: number;
  editions: Edition[];
};

// The catalog's own prices, shown when the server is from before editions
// (supabase/functions/_shared/bookCatalog.js; prices are proposals, deploy §3a).
export const CATALOG: Edition[] = [
  { id: "home", priceCents: 0 },
  { id: "digital", priceCents: 1900 },
  { id: "softcover", priceCents: 3900, extraCents: 2900 },
  { id: "hardcover", priceCents: 6900, extraCents: 4900 },
  { id: "heirloom", priceCents: 14900, extraCents: 11900 },
  { id: "legacy", priceCents: 49900 },
];

async function readError(err: unknown): Promise<{ message: string; reason: string | null }> {
  try {
    const ctx = (err as { context?: Response })?.context;
    if (ctx?.json) {
      const body = (await ctx.json()) as { error?: string; reason?: string };
      if (body?.error) return { message: body.error, reason: body.reason || null };
    }
  } catch {
    /* not JSON */
  }
  return { message: (err as Error)?.message || "Please try again.", reason: null };
}

function withEditions(offer: Partial<BookOffer> & { editions?: Edition[] }): BookOffer {
  const server = new Map((offer.editions || []).map((e) => [e.id, e]));
  const editions = CATALOG.map((e) => ({ ...e, ...(server.get(e.id) || {}) }));
  return {
    included: !!offer.included,
    reason: offer.reason || "not_member",
    member: !!offer.member,
    plan: offer.plan,
    orderingOpen: !!offer.orderingOpen,
    priceCents: offer.priceCents ?? null,
    shippingCents: offer.shippingCents ?? null,
    creditCents: offer.creditCents ?? (offer.included ? offer.priceCents || 6900 : 0),
    editions,
  };
}

export async function checkBookOrder(storyId: string): Promise<BookOffer> {
  const { data, error } = await supabase().functions.invoke("create-book-checkout", { body: { storyId, check: true } });
  if (error) throw new Error((await readError(error)).message);
  // An answer without a reason is from a server that doesn't know this question.
  if (!data || typeof data.reason !== "string") return withEditions({ included: false, orderingOpen: false });
  return withEditions(data as BookOffer);
}

/** Starts Stripe Checkout for a printed or digital edition; the page then goes to checkoutUrl. */
export async function orderBook(storyId: string, edition: EditionId, copies = 1): Promise<{ checkoutUrl: string; orderId: string; included: boolean }> {
  const { data, error } = await supabase().functions.invoke("create-book-checkout", { body: { storyId, edition, copies } });
  if (error) {
    const { message, reason } = await readError(error);
    throw Object.assign(new Error(message), { reason });
  }
  return data as { checkoutUrl: string; orderId: string; included: boolean };
}
