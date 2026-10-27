/**
 * A family's printed-book orders, read from `book_orders` and
 * `order_shipments` (phone repo, print_ordering_2026_10_28.sql,
 * print_checkout_2026_10_28.sql, print_status_2026_10_28.sql). Read-only:
 * only create-book-order, the Stripe webhook and the submission cron write
 * them. Their policies (book_orders_select_own, order_shipments_select_own)
 * show each person their own rows, so the status page needs no endpoint of its
 * own (P4-R6): two plain selects, never an embedded join.
 *
 * `select("*")` on purpose: a database that hasn't run a later SQL file yet
 * simply has fewer columns, and a missing one reads as its default here.
 *
 * After Stripe's page the webhook can arrive after the person does, so the
 * status page asks the order until it is paid (pollUntilPaid: every 2 s, for
 * 30 s), then says the email will follow.
 */
import { getSupabase } from "../lib/supabase";
import { customerStage, type CustomerStage } from "./orderStage";

export type BookOrder = {
  id: string;
  storyId: string;
  /** The server's status (orderStatus.js STATUSES, or an old row's pending/fulfilled). */
  status: string;
  /** What the family reads: Approved, Printing, Shipped, Delivered, Canceled, Refunded or Needs attention. */
  stage: CustomerStage;
  /** Copies across every address. */
  copies: number;
  totalCents: number;
  subtotalCents: number | null;
  shippingCents: number | null;
  taxCents: number;
  /** Copies covered by a gift or a Founding Family place. */
  discountCents: number;
  depositCents: number;
  currency: string;
  createdAt: string | null;
  paidAt: string | null;
  deliveryEarliest: string | null;
  deliveryLatest: string | null;
};

export type OrderShipment = {
  id: string;
  orderId: string;
  quantity: number;
  name: string;
  city: string;
  state: string;
  status: string;
  carrier: string | null;
  trackingNumber: string | null;
  /** The parcel's tracking page (https only). */
  trackingUrl: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
};

type Row = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" && v ? v : null);
const int = (v: unknown) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isSafeInteger(n) ? n : null;
};
const isoDay = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null);

// The carriers' own tracking pages, for a parcel that has a number but no link.
const TRACKING: Record<string, (n: string) => string> = {
  usps: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`,
  ups: (n) => `https://www.ups.com/track?tracknum=${n}`,
  fedex: (n) => `https://www.fedex.com/fedextrack/?trknbr=${n}`,
  dhl: (n) => `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${n}`,
};

/** The tracking page for a carrier and number, or null. Only https, and only a plain number. Pure. */
export function trackingUrlFor(carrier: string | null, number: string | null): string | null {
  if (!carrier || !number || !/^[A-Za-z0-9-]{4,40}$/.test(number)) return null;
  const make = TRACKING[carrier.trim().toLowerCase()];
  if (!make) return null;
  const url = make(encodeURIComponent(number));
  return url.startsWith("https://") ? url : null;
}

/** A link only if it is a real https address: a row's tracking_url is shown as a link, so nothing else is. Pure. */
export function safeHttps(v: unknown): string | null {
  if (typeof v !== "string") return null;
  try {
    const u = new URL(v.trim());
    return u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

/** A book_orders row as the pages read it. Anything the server sends that the web doesn't know reads as its default. Pure. */
export function orderFromRow(row: Row): BookOrder {
  const status = str(row.status) ?? "approved";
  const copies = int(row.quantity) ?? int(row.copies);
  const total = int(row.total_cents) ?? int(row.amount_cents);
  return {
    id: String(row.id),
    storyId: String(row.story_id ?? ""),
    status,
    stage: customerStage(status),
    copies: copies !== null && copies > 0 ? copies : 1,
    totalCents: total !== null && total >= 0 ? total : 0,
    subtotalCents: int(row.subtotal_cents),
    shippingCents: int(row.shipping_cents),
    taxCents: int(row.tax_cents) ?? 0,
    discountCents: int(row.discount_cents) ?? 0,
    depositCents: int(row.deposit_credit_cents) ?? 0,
    currency: str(row.currency) || "usd",
    createdAt: str(row.created_at),
    paidAt: str(row.paid_at),
    deliveryEarliest: isoDay(row.delivery_earliest),
    deliveryLatest: isoDay(row.delivery_latest),
  };
}

/** An order_shipments row: who it goes to by first name and city, never the street, and how to follow it. Pure. */
export function shipmentFromRow(row: Row): OrderShipment {
  const carrier = str(row.carrier);
  const number = str(row.tracking_number);
  const q = int(row.quantity);
  return {
    id: String(row.id),
    orderId: String(row.order_id ?? ""),
    quantity: q !== null && q > 0 ? q : 1,
    name: str(row.name) ?? "",
    city: str(row.city) ?? "",
    state: str(row.state) ?? "",
    status: str(row.status) ?? "pending",
    carrier,
    trackingNumber: number,
    trackingUrl: safeHttps(row.tracking_url) ?? trackingUrlFor(carrier, number),
    shippedAt: str(row.shipped_at),
    deliveredAt: str(row.delivered_at),
  };
}

/** Whether the order has been paid for, whatever has happened since. */
export const isPaid = (o: Pick<BookOrder, "paidAt"> | null | undefined): boolean => !!o?.paidAt;

/** This person's paid orders, newest first; only one story's with `storyId`. Unpaid ones are left out (P4-R6). */
export async function listOrders({ storyId }: { storyId?: string } = {}): Promise<BookOrder[]> {
  const sb = getSupabase();
  if (!sb) return [];
  let q = sb.from("book_orders").select("*").not("paid_at", "is", null);
  if (storyId) q = q.eq("story_id", storyId);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw new Error("We couldn’t load your orders. Please try again.");
  return ((data as Row[] | null) || []).map(orderFromRow).filter(isPaid);
}

/** One order, or null when there is none this person may see. */
export async function getOrder(id: string): Promise<BookOrder | null> {
  const sb = getSupabase();
  if (!sb || !id) return null;
  const { data, error } = await sb.from("book_orders").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("We couldn’t load the order. Please try again.");
  return data ? orderFromRow(data as Row) : null;
}

/** Where an order's copies go, one row per address, in the order they were entered. */
export async function listShipments(orderId: string): Promise<OrderShipment[]> {
  const sb = getSupabase();
  if (!sb || !orderId) return [];
  const { data, error } = await sb.from("order_shipments").select("*").eq("order_id", orderId).order("created_at", { ascending: true });
  if (error) throw new Error("We couldn’t load where the books are going. Please try again.");
  return ((data as Row[] | null) || []).map(shipmentFromRow);
}

export type PollOptions = {
  intervalMs?: number;
  timeoutMs?: number;
  /** Stops asking (the page closed). */
  signal?: AbortSignal;
  /** Each read, as it comes, so the page can show it. */
  onRead?: (order: BookOrder | null) => void;
  /** For the tests. */
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
};

/**
 * After checkout: the order as the webhook leaves it, asked every `intervalMs` until it is paid (or has left the
 * flow: canceled, refunded) or `timeoutMs` passes. Resolves with the last row read (still unpaid when the webhook
 * hasn't come yet; the page then says the email will follow). A failed read is asked again, not thrown.
 */
export async function pollUntilPaid(id: string, opts: PollOptions = {}): Promise<BookOrder | null> {
  const { intervalMs = 2000, timeoutMs = 30000, signal, onRead, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), now = Date.now } = opts;
  const deadline = now() + timeoutMs;
  let latest: BookOrder | null = null;
  for (;;) {
    if (signal?.aborted) return latest;
    try {
      latest = (await getOrder(id)) ?? latest;
      onRead?.(latest);
    } catch {
      /* asked again below */
    }
    if (latest && (isPaid(latest) || latest.stage === "Canceled" || latest.stage === "Refunded")) return latest;
    if (now() + intervalMs > deadline) return latest;
    await sleep(intervalMs);
  }
}
