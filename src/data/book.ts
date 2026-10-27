/**
 * The printed book's two calls to create-book-checkout (the app's
 * src/data/book.js). A printed book costs everybody the same: no plan
 * includes one (bookAllowance.js, 2026-10-19), so `included` is always
 * false here, whatever an older server says. What a family may already
 * have is a holiday gift's Classic Hardcover (`credits`, gift_2026_10_23.sql)
 * and, on a year-long plan or Express, the Digital Edition (`member`).
 * Print at home never asks the server: the HTML is built on the page
 * (app-core legacyBook).
 */
import { supabase } from "../lib/supabase";

export type EditionId = "home" | "digital" | "softcover" | "hardcover" | "heirloom" | "legacy";

/** How the server sells an edition (bookCatalog.js): only "stripe" can be ordered from the web. */
export type EditionSale = "free" | "iap" | "stripe";

export type Edition = { id: EditionId; priceCents: number; extraCents?: number | null; sale?: EditionSale };

export type BookOffer = {
  /** Always false: no plan includes a printed book. Kept for the server's shape. */
  included: false;
  reason: string;
  /** The running plan carries the Digital Edition (a year-long plan or Express). */
  member: boolean;
  plan?: string;
  orderingOpen: boolean;
  priceCents: number | null;
  /** Unspent gift hardcover credits; each pays for one Classic Hardcover. */
  credits: number;
  editions: Edition[];
};

// The catalog's own prices and how each is sold, used when the server is
// from before editions (supabase/functions/_shared/bookCatalog.js; prices
// are proposals, deploy §3a).
export const CATALOG: Edition[] = [
  { id: "home", priceCents: 0, sale: "free" },
  { id: "digital", priceCents: 1900, sale: "iap" },
  { id: "softcover", priceCents: 3900, extraCents: 2900, sale: "stripe" },
  { id: "hardcover", priceCents: 6900, extraCents: 4900, sale: "stripe" },
  { id: "heirloom", priceCents: 14900, extraCents: 11900, sale: "stripe" },
  { id: "legacy", priceCents: 49900, extraCents: 11900, sale: "stripe" },
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

type ServerOffer = Partial<Omit<BookOffer, "included" | "editions">> & { included?: boolean; editions?: Partial<Edition>[] };

/** The server's answer, laid over the catalog. Exported for the tests. */
export function withEditions(offer: ServerOffer): BookOffer {
  const server = new Map((offer.editions || []).map((e) => [e.id, e]));
  // The server's price, never its idea of how an edition is sold: that is a
  // rule of the catalog, not a setting (bookCatalog.js).
  const editions = CATALOG.map((e) => {
    const s = server.get(e.id);
    return {
      ...e,
      ...(Number.isFinite(s?.priceCents) ? { priceCents: s!.priceCents as number } : {}),
      ...(e.extraCents != null && Number.isFinite(s?.extraCents) ? { extraCents: s!.extraCents as number } : {}),
    };
  });
  const credits = Number(offer.credits);
  return {
    included: false,
    reason: offer.reason || "not_member",
    member: !!offer.member,
    plan: offer.plan,
    orderingOpen: !!offer.orderingOpen,
    priceCents: offer.priceCents ?? null,
    credits: Number.isFinite(credits) && credits > 0 ? Math.floor(credits) : 0,
    editions,
  };
}

export async function checkBookOrder(storyId: string): Promise<BookOffer> {
  const { data, error } = await supabase().functions.invoke("create-book-checkout", { body: { storyId, check: true } });
  if (error) throw new Error((await readError(error)).message);
  // An answer without a reason is from a server that doesn't know this question: closed.
  if (!data || typeof data.reason !== "string") return withEditions({ orderingOpen: false });
  return withEditions(data as ServerOffer);
}

/**
 * Whether the web has its ordering page (/book/order, M5). Until it does, the editions stay as they are while
 * ordering is closed even if the server says it is open (ORDERING_ENABLED lives on the server), so Order never
 * leads to a missing page. M5 sets it true.
 */
export const ORDER_PAGE = false;

/** Whether the editions may be ordered here: the server says so and the ordering page exists. */
export const orderingOpen = (offer: BookOffer | null | undefined, orderPage = ORDER_PAGE): boolean => orderPage && !!offer?.orderingOpen;

/**
 * What one edition's row may show this family. A price and Order go
 * together, and only once the server says ordering is open (DECISIONS.md:
 * prices hidden while closed). An edition the web can't sell (the Digital
 * Edition is an in-app purchase, never Stripe) gets neither: its price is
 * the store's, not ours to quote.
 */
export function editionTerms(offer: BookOffer | null, edition: Edition, orderPage = ORDER_PAGE): { orderable: boolean; giftCredit: boolean } {
  return {
    orderable: orderingOpen(offer, orderPage) && edition.sale === "stripe",
    // A gift's credit pays for exactly one Classic Hardcover (giftOrder.js creditApplies).
    giftCredit: edition.id === "hardcover" && (offer?.credits ?? 0) > 0,
  };
}

/** Where Order goes: the ordering page (M5), with the story and the chosen edition. */
export function orderPath(storyId: string, edition: EditionId): string {
  return `/book/order?${new URLSearchParams({ story: storyId, edition })}`;
}

/** "$69", or "$12.50", in the currency the checkout charges in. */
export function formatCents(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
}

export type BookOrderStarted = { checkoutUrl: string | null; orderId: string; paidWithCredit?: boolean };

/**
 * Starts an order of a printed edition. Stripe Checkout, and the page then
 * goes to checkoutUrl; or, when a gift's credit pays for it, an order
 * already paid, with no checkout (paidWithCredit, checkoutUrl null).
 */
export async function orderBook(storyId: string, edition: EditionId, copies = 1): Promise<BookOrderStarted> {
  const { data, error } = await supabase().functions.invoke("create-book-checkout", { body: { storyId, edition, copies } });
  if (error) {
    const { message, reason } = await readError(error);
    throw Object.assign(new Error(message), { reason });
  }
  if (data?.paidWithCredit && data?.orderId) return { orderId: data.orderId, paidWithCredit: true, checkoutUrl: null };
  if (!data?.checkoutUrl || !data?.orderId) throw new Error("We couldn’t start the order. Please try again.");
  return { checkoutUrl: data.checkoutUrl, orderId: data.orderId };
}
