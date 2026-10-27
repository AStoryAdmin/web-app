/**
 * A family's printed-book orders, read from `book_orders` (phone schema.sql,
 * book_editions.sql, book_membership.sql, book_gift_note_2026_10_22.sql).
 * Read-only: only create-book-checkout and stripe-webhook write the table,
 * and its policy ("book_orders_select_own") shows each person their own rows.
 *
 * After Stripe's page the webhook can arrive after the person does, so the
 * return page asks the row itself until it stops being "pending", as the
 * phone does (bookOrderFlow.js waitForOrder: every 2 s, for 15 s).
 *
 * gift_note (book_gift_note_2026_10_22.sql) and "shipped" with its tracking
 * columns (book_fulfilment_2026_10_27.sql) come from owner items run by hand.
 * Until they have run they are asked for and, each time the database says it
 * has no such column, asked again with one set fewer.
 */
import { getSupabase } from "../lib/supabase";
import type { EditionId } from "./book";

export type BookOrderStatus = "pending" | "paid" | "fulfilled" | "shipped" | "canceled" | "refunded";

export type ShippingAddress = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

export type BookOrder = {
  id: string;
  storyId: string;
  status: BookOrderStatus;
  edition: Exclude<EditionId, "home" | "digital">;
  copies: number;
  amountCents: number;
  currency: string;
  /** A gift's credit paid for it (book_membership.sql `included`). */
  included: boolean;
  shippingName: string | null;
  shippingAddress: ShippingAddress | null;
  /** The two lines printed on the first page (gift_note). */
  note: string | null;
  createdAt: string | null;
  paidAt: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  /** The carrier's tracking page (https only), when the carrier is one we know. */
  trackingUrl: string | null;
  shippedAt: string | null;
};

// Only columns every deployed database has: a select naming a missing one fails whole.
const COLUMNS = "id, story_id, status, edition, copies, amount_cents, currency, included, shipping_name, shipping_address, created_at, paid_at";
// book_gift_note_2026_10_22.sql and book_fulfilment_2026_10_27.sql: asked for first, left out when missing
const WITH_NOTE = `${COLUMNS}, gift_note`;
const WITH_TRACKING = `${WITH_NOTE}, carrier, tracking_number, shipped_at`;
const NO_COLUMN = "42703";

const STATUSES: BookOrderStatus[] = ["pending", "paid", "fulfilled", "shipped", "canceled", "refunded"];

// The carriers' own tracking pages; anything else shows the number alone.
const TRACKING: Record<string, (n: string) => string> = {
  usps: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`,
  ups: (n) => `https://www.ups.com/track?tracknum=${n}`,
  fedex: (n) => `https://www.fedex.com/fedextrack/?trknbr=${n}`,
  dhl: (n) => `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${n}`,
  "canada post": (n) => `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${n}`,
};

/** The tracking page for a carrier and number, or null. Only https, and only a plain number. Pure. */
export function trackingUrlFor(carrier: string | null, number: string | null): string | null {
  if (!carrier || !number || !/^[A-Za-z0-9-]{4,40}$/.test(number)) return null;
  const make = TRACKING[carrier.trim().toLowerCase()];
  if (!make) return null;
  const url = make(encodeURIComponent(number));
  return url.startsWith("https://") ? url : null;
}
const EDITIONS = ["softcover", "hardcover", "heirloom", "legacy"] as const;

type Row = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" && v ? v : null);

/** A row as the pages read it. Anything the server sends that the web doesn't know reads as its default. Pure. */
export function orderFromRow(row: Row): BookOrder {
  const status = STATUSES.includes(row.status as BookOrderStatus) ? (row.status as BookOrderStatus) : "pending";
  const edition = EDITIONS.includes(row.edition as (typeof EDITIONS)[number]) ? (row.edition as BookOrder["edition"]) : "hardcover";
  const copies = Number(row.copies);
  const amount = Number(row.amount_cents);
  const address = row.shipping_address && typeof row.shipping_address === "object" ? (row.shipping_address as ShippingAddress) : null;
  return {
    id: String(row.id),
    storyId: String(row.story_id ?? ""),
    status,
    edition,
    copies: Number.isInteger(copies) && copies > 0 ? copies : 1,
    amountCents: Number.isFinite(amount) ? amount : 0,
    currency: str(row.currency) || "usd",
    included: row.included === true,
    shippingName: str(row.shipping_name),
    shippingAddress: address,
    note: str(row.gift_note),
    createdAt: str(row.created_at),
    paidAt: str(row.paid_at),
    carrier: str(row.carrier),
    trackingNumber: str(row.tracking_number),
    trackingUrl: trackingUrlFor(str(row.carrier), str(row.tracking_number)),
    shippedAt: str(row.shipped_at),
  };
}

/** Whether the order has been paid for, whatever has happened since. */
export const isPaid = (o: Pick<BookOrder, "status"> | null | undefined) => o?.status === "paid" || o?.status === "fulfilled" || o?.status === "shipped";

/** One line for an order's state, in the order pages' voice. */
export function orderStatusLine(o: Pick<BookOrder, "status"> & Partial<Pick<BookOrder, "carrier" | "trackingNumber">>): string {
  switch (o.status) {
    case "shipped":
      return o.carrier && o.trackingNumber ? `Shipped with ${o.carrier}. Tracking number ${o.trackingNumber}.` : "Shipped. It’s in the post.";
    case "paid":
      return "Paid. The book is being made.";
    case "fulfilled":
      return "The book is on its way.";
    case "canceled":
      return "This order was cancelled.";
    case "refunded":
      return "This order was refunded.";
    default:
      return "Waiting for the payment to come through.";
  }
}

/** This person's orders, newest first; only one story's with `storyId`. Empty when the server can't be asked. */
export async function listOrders({ storyId }: { storyId?: string } = {}): Promise<BookOrder[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const ask = (columns: string) => {
    let q = sb.from("book_orders").select(columns);
    if (storyId) q = q.eq("story_id", storyId);
    return q.order("created_at", { ascending: false });
  };
  let { data, error } = await ask(WITH_TRACKING);
  if (error?.code === NO_COLUMN) ({ data, error } = await ask(WITH_NOTE));
  if (error?.code === NO_COLUMN) ({ data, error } = await ask(COLUMNS));
  if (error) throw new Error("We couldn’t load your orders. Please try again.");
  return ((data as Row[] | null) || []).map(orderFromRow);
}

/** One order, or null when there is none this person may see. */
export async function getOrder(id: string): Promise<BookOrder | null> {
  const sb = getSupabase();
  if (!sb || !id) return null;
  const ask = (columns: string) => sb.from("book_orders").select(columns).eq("id", id).maybeSingle();
  let { data, error } = await ask(WITH_TRACKING);
  if (error?.code === NO_COLUMN) ({ data, error } = await ask(WITH_NOTE));
  if (error?.code === NO_COLUMN) ({ data, error } = await ask(COLUMNS));
  if (error) throw new Error("We couldn’t load the order. Please try again.");
  return data ? orderFromRow(data as unknown as Row) : null;
}

export type PollOptions = {
  intervalMs?: number;
  timeoutMs?: number;
  /** Stops asking (the page closed). */
  signal?: AbortSignal;
  /** For the tests. */
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
};

/**
 * After checkout: the order as the webhook leaves it, asked every `intervalMs` until it stops being "pending" or
 * `timeoutMs` passes. Resolves with the last row read (still "pending" when the webhook hasn't come yet; the page
 * says the payment is on its way and the orders list will show it). A failed read is asked again, not thrown.
 */
export async function pollUntilPaid(id: string, opts: PollOptions = {}): Promise<BookOrder | null> {
  const { intervalMs = 2000, timeoutMs = 15000, signal, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), now = Date.now } = opts;
  const deadline = now() + timeoutMs;
  let latest: BookOrder | null = null;
  for (;;) {
    if (signal?.aborted) return latest;
    try {
      latest = (await getOrder(id)) ?? latest;
    } catch {
      /* asked again below */
    }
    if (latest && latest.status !== "pending") return latest;
    if (now() + intervalMs > deadline) return latest;
    await sleep(intervalMs);
  }
}
