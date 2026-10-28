/**
 * The admin view's side of admin-orders (phone repo,
 * supabase/functions/admin-orders; docs/PLAN_ORDERING.md, rulings P5-R8 and
 * P5-R9). Internal: its only user is Daniel. One function, six actions:
 *
 *   adminMe()                         is this account staff (the server reads the staff table; nothing here decides)
 *   listAdminOrders({ status, before }) newest first, 50 a page, with a cursor for the next
 *   getAdminOrder(id)                 the order, its shipments with full addresses, the event log, the issues
 *   retryAdminOrder(id, note?)        send to the printer again (submission_failed only)
 *   overrideAdminOrder(id, to, note)  change the status by hand: no money, no mail, no printer
 *   refundAdminOrder(id, note)        stop the printer where it can, refund the whole payment, mark it refunded
 *
 * Every error is an AdminError whose `code` is the server's (not_staff, needs_note, nothing_charged, refund_failed…)
 * or "network". The page shows a plain sentence for each.
 */
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export const ADMIN_FUNCTION = "admin-orders";

/** Mirrors OVERRIDE_TARGETS in admin-orders/admin.js (and the SQL's override-targets list). */
export const OVERRIDE_TARGETS = [
  "submitted_to_provider",
  "in_production",
  "shipped",
  "delivered",
  "submission_failed",
  "issue_reported",
  "canceled",
  "refunded",
] as const;
export type OverrideTarget = (typeof OVERRIDE_TARGETS)[number];

/** Every order status, in the machine's order (orderStatus.js STATUSES). */
export const ORDER_STATUSES = [
  "draft",
  "proof_ready",
  "approved",
  "payment_pending",
  "paid",
  "submitted_to_provider",
  "in_production",
  "shipped",
  "delivered",
  "payment_failed",
  "submission_failed",
  "canceled",
  "refunded",
  "issue_reported",
] as const;

export type AdminListRow = {
  id: string;
  createdAt: string | null;
  status: string;
  totalCents: number | null;
  quantity: number | null;
  customerEmail: string | null;
  paidAt: string | null;
  submitAttempts: number;
  nextAttemptAt: string | null;
};

export type AdminOrder = AdminListRow & {
  updatedAt: string | null;
  userId: string | null;
  storyId: string | null;
  bookVersionId: string | null;
  productSku: string | null;
  currency: string;
  subtotalCents: number | null;
  shippingCents: number | null;
  taxCents: number;
  discountCents: number;
  depositCreditCents: number;
  shippedAt: string | null;
  submitAfter: string | null;
  stripePaymentIntentId: string | null;
  providerName: string | null;
  reorderOf: string | null;
  charged: boolean;
};

export type AdminShipment = {
  id: string;
  quantity: number;
  name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string | null;
  email: string | null;
  status: string;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  providerOrderId: string | null;
  providerIssue: string | null;
};

export type AdminEvent = {
  id: string;
  at: string | null;
  actor: string;
  kind: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  data: unknown;
};

export type AdminIssue = {
  id: string;
  reason: string | null;
  description: string;
  photoUrl: string | null;
  createdAt: string | null;
  resolvedAt: string | null;
};

export type AdminDetail = { order: AdminOrder; shipments: AdminShipment[]; events: AdminEvent[]; issues: AdminIssue[] };

export class AdminError extends Error {
  code: string;
  status: number | null;
  constructor(code: string, status: number | null = null) {
    super(ADMIN_MESSAGES[code] ?? `Something went wrong (${code}).`);
    this.name = "AdminError";
    this.code = code;
    this.status = status;
  }
}

export const ADMIN_MESSAGES: Record<string, string> = {
  network: "The server didn’t answer. Check the connection and try again.",
  not_signed_in: "Please sign in again.",
  not_staff: "This page isn’t available.",
  not_found: "There’s no order with that id.",
  needs_note: "Write a note of at least 3 characters.",
  bad_status: "That status can’t be set by hand.",
  terminal: "A canceled or refunded order can’t be moved.",
  not_retryable_status: "Only an order that failed to send can be retried.",
  nothing_charged: "Nothing was charged for this order. Use Change status to cancel it.",
  not_refundable_status: "This order can’t be refunded from its status.",
  refund_failed: "Stripe didn’t refund it. Nothing changed. Try again, or refund it in Stripe’s dashboard.",
  charged_use_refund: "This order was charged. Use Refund instead.",
  not_paid: "This order hasn’t been paid, so it can only be canceled.",
  sending_now: "This order is being sent to the printer right now. Try again in a few minutes.",
  server_error: "The server hit an error. Try again.",
};

/* ── reading answers ───────────────────────────────────────────────────── */

const str = (v: unknown) => (typeof v === "string" ? v : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const obj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const arr = (v: unknown) => (Array.isArray(v) ? v : []);

/** The error supabase-js hands back from invoke, read into the server's code. Exported for the tests. */
export async function codeOf(err: unknown): Promise<{ code: string; status: number | null }> {
  const e = err as { name?: string; context?: Response } | null;
  if (e?.name === "FunctionsFetchError" || e?.name === "FunctionsRelayError") return { code: "network", status: null };
  const ctx = e?.context;
  if (!ctx) return { code: "network", status: null };
  const status = Number(ctx.status) || null;
  let body: unknown = null;
  try {
    if (typeof ctx.json === "function") body = await ctx.json();
  } catch {
    /* not JSON */
  }
  const code = str(obj(body).error);
  return { code: code || (status === 403 ? "not_staff" : status === 401 ? "not_signed_in" : "server_error"), status };
}

async function call(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  let res: { data: unknown; error: unknown };
  try {
    res = await supabase().functions.invoke(ADMIN_FUNCTION, { body });
  } catch {
    throw new AdminError("network");
  }
  if (res.error) {
    const { code, status } = await codeOf(res.error);
    throw new AdminError(code, status);
  }
  const data = obj(res.data);
  if (typeof data.error === "string") throw new AdminError(data.error);
  return data;
}

export function readListRow(raw: unknown): AdminListRow | null {
  const r = obj(raw);
  const id = str(r.id);
  const status = str(r.status);
  if (!id || !status) return null;
  return {
    id,
    createdAt: str(r.createdAt),
    status,
    totalCents: num(r.totalCents),
    quantity: num(r.quantity),
    customerEmail: str(r.customerEmail),
    paidAt: str(r.paidAt),
    submitAttempts: num(r.submitAttempts) ?? 0,
    nextAttemptAt: str(r.nextAttemptAt),
  };
}

export function readDetail(raw: unknown): AdminDetail {
  const d = obj(raw);
  const o = obj(d.order);
  const row = readListRow(o);
  if (!row) throw new AdminError("server_error");
  const order: AdminOrder = {
    ...row,
    updatedAt: str(o.updatedAt),
    userId: str(o.userId),
    storyId: str(o.storyId),
    bookVersionId: str(o.bookVersionId),
    productSku: str(o.productSku),
    currency: str(o.currency) || "usd",
    subtotalCents: num(o.subtotalCents),
    shippingCents: num(o.shippingCents),
    taxCents: num(o.taxCents) ?? 0,
    discountCents: num(o.discountCents) ?? 0,
    depositCreditCents: num(o.depositCreditCents) ?? 0,
    shippedAt: str(o.shippedAt),
    submitAfter: str(o.submitAfter),
    stripePaymentIntentId: str(o.stripePaymentIntentId),
    providerName: str(o.providerName),
    reorderOf: str(o.reorderOf),
    charged: o.charged === true,
  };
  const shipments = arr(d.shipments).map((x): AdminShipment => {
    const s = obj(x);
    return {
      id: str(s.id) ?? "",
      quantity: num(s.quantity) ?? 1,
      name: str(s.name) ?? "",
      line1: str(s.line1) ?? "",
      line2: str(s.line2),
      city: str(s.city) ?? "",
      state: str(s.state) ?? "",
      postalCode: str(s.postalCode) ?? "",
      country: str(s.country) ?? "US",
      phone: str(s.phone),
      email: str(s.email),
      status: str(s.status) ?? "pending",
      carrier: str(s.carrier),
      trackingNumber: str(s.trackingNumber),
      trackingUrl: safeHttps(s.trackingUrl),
      providerOrderId: str(s.providerOrderId),
      providerIssue: str(s.providerIssue),
    };
  });
  const events = arr(d.events).map((x): AdminEvent => {
    const e = obj(x);
    return {
      id: String(e.id ?? ""),
      at: str(e.at),
      actor: str(e.actor) ?? "",
      kind: str(e.kind) ?? "",
      fromStatus: str(e.fromStatus),
      toStatus: str(e.toStatus),
      note: str(e.note),
      data: e.data ?? null,
    };
  });
  const issues = arr(d.issues).map((x): AdminIssue => {
    const i = obj(x);
    return {
      id: str(i.id) ?? "",
      reason: str(i.reason),
      description: str(i.description) ?? "",
      photoUrl: safeHttps(i.photoUrl),
      createdAt: str(i.createdAt),
      resolvedAt: str(i.resolvedAt),
    };
  });
  return { order, shipments, events, issues };
}

/** Only an https link is ever put in an href or src. */
export function safeHttps(v: unknown): string | null {
  if (typeof v !== "string") return null;
  try {
    return new URL(v).protocol === "https:" ? v : null;
  } catch {
    return null;
  }
}

/* ── the calls ─────────────────────────────────────────────────────────── */

export async function adminMe(): Promise<boolean> {
  const d = await call({ action: "me" });
  return d.staff === true;
}

export async function listAdminOrders({ status = "", before = null }: { status?: string; before?: string | null } = {}): Promise<{ orders: AdminListRow[]; next: string | null }> {
  const body: Record<string, unknown> = { action: "list" };
  if (status) body.status = status;
  if (before) body.before = before;
  const d = await call(body);
  return { orders: arr(d.orders).map(readListRow).filter((r): r is AdminListRow => !!r), next: str(d.next) };
}

export async function getAdminOrder(orderId: string): Promise<AdminDetail> {
  return readDetail(await call({ action: "detail", orderId }));
}

export async function retryAdminOrder(orderId: string, note = ""): Promise<{ words: string | null }> {
  const body: Record<string, unknown> = { action: "retry", orderId };
  if (note.trim()) body.note = note.trim();
  const d = await call(body);
  return { words: str(d.words) };
}

export async function overrideAdminOrder(orderId: string, to: OverrideTarget, note: string): Promise<{ changed: boolean; status: string | null }> {
  const d = await call({ action: "override", orderId, to, note: note.trim() });
  return { changed: d.changed === true, status: str(d.status) };
}

export async function refundAdminOrder(orderId: string, note: string): Promise<{ changed: boolean; status: string | null; alreadyRefunded: boolean }> {
  const d = await call({ action: "refund", orderId, note: note.trim() });
  return { changed: d.changed === true, status: str(d.status), alreadyRefunded: d.alreadyRefunded === true };
}

/** A note the server will take: 3 characters or more once trimmed. Pure. */
export const noteOk = (note: string) => note.trim().length >= 3 && note.trim().length <= 1000;

/** "submission_failed" → "submission failed". Pure. */
export const statusLabel = (s: string) => s.replace(/_/g, " ");

/**
 * Asks the server once whether this account is staff: "checking" first, then "staff" or "no". An error counts as
 * "no", so the page shows only "This page isn't available." and never a hint of order data.
 */
export function useStaffGate(): "checking" | "staff" | "no" {
  const [gate, setGate] = useState<"checking" | "staff" | "no">("checking");
  useEffect(() => {
    let live = true;
    adminMe()
      .then((ok) => live && setGate(ok ? "staff" : "no"))
      .catch(() => live && setGate("no"));
    return () => {
      live = false;
    };
  }, []);
  return gate;
}

/** "Nov 2, 2026, 3:42 PM" in the browser's zone, or "" for none. Pure. */
export function when(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
