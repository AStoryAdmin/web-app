/**
 * Ordering the printed book, the web's side of create-book-order (phone repo,
 * supabase/functions/create-book-order; docs/PLAN_ORDERING.md §7 and the
 * Phase 4 rulings P4-R3, P4-R9). One function, three questions:
 *
 *   checkPrintOrder({ pageCount })   is ordering open, and what one copy of a
 *                                     book this long costs (copyCents)
 *   previewPrintOrder({ versionId, shipments })
 *                                     the itemised total, read-only: no order,
 *                                     no reservation, no payment page
 *   placePrintOrder({ versionId, shipments, returnTo })
 *                                     the order itself, made only when Pay is
 *                                     pressed: a Checkout page to go to, or an
 *                                     order already paid by credits
 *
 * The body never carries a price: the server prices from its own catalog, the
 * approved version's page count and the family's credits. Shipments are always
 * [{ quantity, address: { name, line1, line2, city, state, postal, phone } }].
 *
 * The address rules mirror the server's readShipments (US only, a state from
 * the list, a 5- or 9-digit ZIP, phone optional, 1 to 10 copies an address,
 * at most 5 addresses), with the server's own sentences, so a family is told
 * the same thing before and after asking.
 *
 * Every error is a PrintOrderError: its message is a sentence for the family
 * (the server's words when it sent them), `reason` is for the page, and
 * `index` names the address card a refusal is about.
 */
import { supabase } from "../lib/supabase";

export const PRINT_ORDER_FUNCTION = "create-book-order";

/** One address, as create-book-order reads it. US only, so there is no country. */
export type PrintAddress = { name: string; line1: string; line2: string; city: string; state: string; postal: string; phone: string };
export type PrintField = keyof PrintAddress;
export type Shipment = { quantity: number; address: PrintAddress };

export type LineKind = "book" | "shipping" | "deposit" | "founding_copy" | "gift_copy" | "tax";
/** One line of the itemised total. Credits are negative. */
export type OrderLine = { kind: LineKind; label: string; amountCents: number; quantity?: number; unitCents?: number };
export type Delivery = { earliest: string; latest: string };

export type PrintProduct = { name: string; minPages: number | null; maxPages: number | null; maxCopiesPerShipment: number; maxShipments: number };

export type PrintCheck = {
  orderingOpen: boolean;
  product: PrintProduct | null;
  /** What the family already has, in the server's words ("Your deposit of $1.00"). */
  credits: { kind: string; label: string }[];
  /** One copy of a book of `pageCount` pages, or null when no page count was asked or it can't be bound. */
  copyCents: number | null;
};

export type PrintPreview = { totalCents: number; currency: "usd"; lines: OrderLine[]; delivery: Delivery | null; coveredByCredits: boolean };

export type PlacedOrder = {
  orderId: string;
  totalCents: number;
  lines: OrderLine[];
  delivery: Delivery | null;
  /** Credits covered it all: already paid, nothing to pay, no Checkout page. */
  paid: boolean;
  /** Stripe's Checkout page, when there is something to pay. */
  checkoutUrl: string | null;
};

/* ── Addresses ─────────────────────────────────────────────────────────── */

/** At most this many copies to one address, and this many addresses on one order (printCatalog.js). */
export const MAX_COPIES_PER_ADDRESS = 10;
export const MAX_ADDRESSES = 5;

/** The 50 states and DC (create-book-order/order.js US_STATES). */
export const US_STATES: Readonly<Record<string, string>> = Object.freeze({
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
  PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
});

const STATE_BY_NAME = Object.fromEntries(Object.entries(US_STATES).map(([code, name]) => [name.toLowerCase(), code]));

/** "ny", "New York" and "NY" are all NY; anything else is null (order.js stateCode). Pure. */
export function stateCode(raw: unknown): string | null {
  const s = String(raw ?? "").replace(/\s+/g, " ").trim();
  if (!s) return null;
  const up = s.toUpperCase().replace(/\./g, "");
  if (Object.prototype.hasOwnProperty.call(US_STATES, up)) return up;
  return STATE_BY_NAME[s.toLowerCase()] ?? null;
}

/** 12345, 12345-6789 or 123456789 (written back as 12345-6789); else null (order.js zipCode). Pure. */
export function zipCode(raw: unknown): string | null {
  const s = String(raw ?? "").replace(/\s+/g, "");
  const m = /^(\d{5})(?:-?(\d{4}))?$/.exec(s);
  if (!m) return null;
  return m[2] ? `${m[1]}-${m[2]}` : m[1];
}

const tidy = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export const blankAddress = (): PrintAddress => ({ name: "", line1: "", line2: "", city: "", state: "", postal: "", phone: "" });

/** The address trimmed to the server's lengths. Pure. */
export function tidyAddress(a: Partial<PrintAddress> | null | undefined): PrintAddress {
  return {
    name: tidy(a?.name, 100),
    line1: tidy(a?.line1, 200),
    line2: tidy(a?.line2, 200),
    city: tidy(a?.city, 100),
    state: tidy(a?.state, 50),
    postal: tidy(a?.postal, 20),
    phone: tidy(a?.phone, 30),
  };
}

/**
 * An address kept on this computer before Phase 4 (book.ts ShipTo: region and country) as a PrintAddress. A
 * Canadian one comes back without its province and postal code, since books only go to the US now. Pure.
 */
export function fromSaved(raw: unknown): PrintAddress | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const country = String(r.country ?? "US").toUpperCase();
  const us = country === "US" || country === "";
  const a = tidyAddress({
    name: String(r.name ?? ""),
    line1: String(r.line1 ?? ""),
    line2: String(r.line2 ?? ""),
    city: String(r.city ?? ""),
    state: us ? String(r.state ?? r.region ?? "") : "",
    postal: us ? String(r.postal ?? "") : "",
    phone: String(r.phone ?? ""),
  });
  return a.name || a.line1 ? a : null;
}

export type AddressProblem = { error: string; index?: number; field?: PrintField | "quantity"; message: string };

/**
 * The shipments as create-book-order will read them, tidied (state as its code, ZIP as 12345 or 12345-6789), or the
 * first problem with the server's sentence and the index of the address it is about. Pure.
 */
export function validateShipments(raw: { quantity: unknown; address: Partial<PrintAddress> | null | undefined }[]): { ok: true; shipments: Shipment[] } | ({ ok: false } & AddressProblem) {
  const list = Array.isArray(raw) ? raw : [];
  if (list.length === 0) return { ok: false, error: "no_shipments", message: "Please add an address for the book." };
  if (list.length > MAX_ADDRESSES) return { ok: false, error: "too_many_shipments", message: `We can send one order to up to ${MAX_ADDRESSES} addresses.` };
  for (let i = 0; i < list.length; i++) {
    const q = list[i]?.quantity;
    if (typeof q !== "number" || !Number.isSafeInteger(q) || q < 1) return { ok: false, error: "bad_quantity", index: i, field: "quantity", message: "Please choose at least one copy for each address." };
    if (q > MAX_COPIES_PER_ADDRESS) return { ok: false, error: "too_many_copies", index: i, field: "quantity", message: `We can send up to ${MAX_COPIES_PER_ADDRESS} copies to one address.` };
  }
  const out: Shipment[] = [];
  for (let i = 0; i < list.length; i++) {
    const a = tidyAddress(list[i].address);
    const who = list.length > 1 ? ` for address ${i + 1}` : "";
    const bad = (error: string, field: PrintField, message: string) => ({ ok: false as const, error, index: i, field, message });
    if (!a.name) return bad("needs_name", "name", `Please add the name of the person receiving the book${who}.`);
    if (!a.line1) return bad("needs_street", "line1", `Please add the street address${who}.`);
    if (!a.city) return bad("needs_city", "city", `Please add the city${who}.`);
    const st = stateCode(a.state);
    if (!st) return bad("bad_state", "state", `Please choose a US state${who}.`);
    const zip = zipCode(a.postal);
    if (!zip) return bad("bad_zip", "postal", `Please check the ZIP code${who}. It should be 5 digits, like 10001.`);
    if (a.phone && !/^[0-9+().\- ]{7,30}$/.test(a.phone)) return bad("bad_phone", "phone", `Please check the phone number${who}, or leave it empty.`);
    out.push({ quantity: list[i].quantity as number, address: { ...a, state: st, postal: zip } });
  }
  return { ok: true, shipments: out };
}

/** Which field a server refusal is about, so the page can mark it. */
export const FIELD_OF_ERROR: Record<string, PrintField | "quantity"> = {
  needs_name: "name",
  needs_street: "line1",
  needs_city: "city",
  bad_state: "state",
  bad_zip: "postal",
  bad_phone: "phone",
  bad_quantity: "quantity",
  too_many_copies: "quantity",
};

/* ── Errors ────────────────────────────────────────────────────────────── */

export type PrintOrderReason = "not_signed_in" | "not_open" | "not_found" | "not_allowed" | "needs_review" | "address" | "unavailable" | "network" | "unknown";

/** A sentence a family can read for each reason, when the server sends none. Never a code, never a printer's name. */
export const PRINT_ORDER_MESSAGES: Record<PrintOrderReason, string> = {
  not_signed_in: "Please sign in again, then try once more.",
  not_open: "Printed books aren’t ready to order yet.",
  not_found: "We couldn’t find this book. Please go back and open it again.",
  not_allowed: "Only the family looking after this story can order its book.",
  needs_review: "Please look through the book and approve it again.",
  address: "Please check the address.",
  unavailable: "We can’t take book orders just now. Nothing was charged. Please try again later.",
  network: "We couldn’t reach A Story. Please check your connection and try again.",
  unknown: "Something went wrong on our side. Nothing was charged. Please try again in a moment.",
};

const REASONS: Record<string, PrintOrderReason> = {
  not_signed_in: "not_signed_in",
  unauthorized: "not_signed_in",
  not_open: "not_open",
  not_found: "not_found",
  not_yours: "not_allowed",
  forbidden: "not_allowed",
  not_approved: "needs_review",
  product_changed: "needs_review",
  page_count: "needs_review",
  no_shipments: "address",
  too_many_shipments: "address",
  bad_quantity: "address",
  too_many_copies: "address",
  country_not_supported: "address",
  needs_name: "address",
  needs_street: "address",
  needs_city: "address",
  bad_state: "address",
  bad_zip: "address",
  bad_phone: "address",
  not_configured: "unavailable",
  price_check: "unavailable",
  quote_failed: "unavailable",
  payment_unavailable: "unavailable",
  bad_request: "unknown",
  bad_return: "unknown",
  check_failed: "unknown",
  order_failed: "unknown",
};

const BY_STATUS: Record<number, PrintOrderReason> = { 401: "not_signed_in", 403: "not_allowed", 404: "not_found", 503: "unavailable" };

export class PrintOrderError extends Error {
  reason: PrintOrderReason;
  /** The server's own code (bad_zip, not_open…), when it sent one. */
  code: string | null;
  /** The address card the refusal is about, when it is about one. */
  index: number | null;
  constructor(reason: PrintOrderReason, words?: string | null, { code = null, index = null }: { code?: string | null; index?: number | null } = {}) {
    super(words || PRINT_ORDER_MESSAGES[reason]);
    this.name = "PrintOrderError";
    this.reason = reason;
    this.code = code;
    this.index = index;
  }
}

/** The server's own sentence, when it sent one: a short line of plain words, never a code (bookVersion.ts). */
const wordsOf = (v: unknown) => (typeof v === "string" && /^[A-Z][^_<>{}]{5,240}$/.test(v.trim()) ? v.trim() : null);
const indexOf = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : null);

type Refusal = { reason: PrintOrderReason; words: string | null; code: string | null; index: number | null };

function readRefusal(body: unknown, status?: number): Refusal {
  const b = (body && typeof body === "object" ? body : {}) as { error?: unknown; reason?: unknown; words?: unknown; index?: unknown };
  const code = [b.error, b.reason].find((c): c is string => typeof c === "string" && Object.hasOwn(REASONS, c)) ?? null;
  const reason = (code && REASONS[code]) || (status ? BY_STATUS[status] : undefined) || "unknown";
  return { reason, words: wordsOf(b.words), code, index: indexOf(b.index) };
}

/** The error supabase-js hands back from invoke, read into a reason, the server's words and the address index. Exported for the tests. */
export async function reasonOf(err: unknown): Promise<Refusal> {
  const e = err as { name?: string; context?: Response } | null;
  if (e?.name === "FunctionsFetchError" || e?.name === "FunctionsRelayError") return { reason: "network", words: null, code: null, index: null };
  const ctx = e?.context;
  if (!ctx) return { reason: "network", words: null, code: null, index: null };
  let body: unknown = null;
  try {
    if (ctx.json) body = await ctx.json();
  } catch {
    /* not JSON */
  }
  return readRefusal(body, Number(ctx.status));
}

async function call(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  let res: { data: unknown; error: unknown };
  try {
    res = await supabase().functions.invoke(PRINT_ORDER_FUNCTION, { body });
  } catch {
    throw new PrintOrderError("network");
  }
  if (res.error) {
    const r = await reasonOf(res.error);
    throw new PrintOrderError(r.reason, r.words, r);
  }
  const data = res.data as Record<string, unknown> | null;
  if (!data || typeof data !== "object") throw new PrintOrderError("unknown");
  if (typeof data.error === "string") {
    const r = readRefusal(data);
    throw new PrintOrderError(r.reason, r.words, r);
  }
  return data;
}

/* ── The answers, read defensively ─────────────────────────────────────── */

const cents = (v: unknown) => (typeof v === "number" && Number.isSafeInteger(v) ? v : null);
const whole = (v: unknown) => (typeof v === "number" && Number.isSafeInteger(v) && v > 0 ? v : null);
const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const KINDS: LineKind[] = ["book", "shipping", "deposit", "founding_copy", "gift_copy", "tax"];
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The server's lines as the page shows them; a line this page doesn't know, or without an amount, is left out. Pure. */
export function readLines(raw: unknown): OrderLine[] {
  if (!Array.isArray(raw)) return [];
  const out: OrderLine[] = [];
  for (const l of raw) {
    if (!l || typeof l !== "object") continue;
    const r = l as Record<string, unknown>;
    const kind = KINDS.includes(r.kind as LineKind) ? (r.kind as LineKind) : null;
    const amountCents = cents(r.amountCents);
    const label = text(r.label);
    if (!kind || amountCents === null || !label) continue;
    const line: OrderLine = { kind, label, amountCents };
    const q = whole(r.quantity);
    const u = cents(r.unitCents);
    if (q !== null) line.quantity = q;
    if (u !== null) line.unitCents = u;
    out.push(line);
  }
  return out;
}

/** { earliest, latest } as ISO days, or null. Pure. */
export function readDelivery(raw: unknown): Delivery | null {
  const d = raw as { earliest?: unknown; latest?: unknown } | null;
  const earliest = typeof d?.earliest === "string" ? d.earliest.slice(0, 10) : "";
  const latest = typeof d?.latest === "string" ? d.latest.slice(0, 10) : "";
  return ISO_DAY.test(earliest) && ISO_DAY.test(latest) ? { earliest, latest } : null;
}

function readProduct(raw: unknown): PrintProduct | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const name = text(p.name);
  if (!name) return null;
  return {
    name,
    minPages: whole(p.minPages),
    maxPages: whole(p.maxPages),
    maxCopiesPerShipment: Math.min(MAX_COPIES_PER_ADDRESS, whole(p.maxCopiesPerShipment) ?? MAX_COPIES_PER_ADDRESS),
    maxShipments: Math.min(MAX_ADDRESSES, whole(p.maxShipments) ?? MAX_ADDRESSES),
  };
}

/* ── The three questions ───────────────────────────────────────────────── */

/**
 * Whether ordering is open and, with `pageCount`, what one copy of a book that long costs. Answers while ordering is
 * closed too. A server too old to know the question counts as closed. Throws PrintOrderError.
 */
export async function checkPrintOrder({ pageCount }: { pageCount?: number | null } = {}): Promise<PrintCheck> {
  const body: Record<string, unknown> = { check: true };
  if (whole(pageCount)) body.pageCount = pageCount;
  const d = await call(body);
  const credits = Array.isArray(d.credits)
    ? (d.credits as unknown[]).flatMap((c) => {
        const r = c as { kind?: unknown; label?: unknown } | null;
        const label = text(r?.label);
        return label ? [{ kind: String(r?.kind ?? ""), label }] : [];
      })
    : [];
  const copy = cents(d.copyCents);
  return { orderingOpen: d.orderingOpen === true, product: readProduct(d.product), credits, copyCents: copy !== null && copy > 0 ? copy : null };
}

const shipmentsBody = (shipments: Shipment[]) =>
  shipments.map((s) => ({
    quantity: s.quantity,
    address: { name: s.address.name, line1: s.address.line1, line2: s.address.line2, city: s.address.city, state: s.address.state, postal: s.address.postal, phone: s.address.phone },
  }));

/** The itemised total for these addresses, read-only: the server writes nothing and starts no payment. Throws PrintOrderError. */
export async function previewPrintOrder({ versionId, shipments }: { versionId: string; shipments: Shipment[] }): Promise<PrintPreview> {
  if (!versionId) throw new PrintOrderError("needs_review");
  const d = await call({ preview: true, versionId, shipments: shipmentsBody(shipments) });
  const totalCents = cents(d.totalCents);
  const lines = readLines(d.lines);
  if (totalCents === null || totalCents < 0 || lines.length === 0) throw new PrintOrderError("unknown");
  return { totalCents, currency: "usd", lines, delivery: readDelivery(d.delivery), coveredByCredits: d.coveredByCredits === true || totalCents === 0 };
}

/**
 * The order, placed: for the web a Stripe Checkout page (`returnTo` is this site's /book/thanks, which the server
 * checks against its list), or, when credits cover it all, an order already paid with no page to go to. Throws
 * PrintOrderError.
 */
export async function placePrintOrder({ versionId, shipments, returnTo }: { versionId: string; shipments: Shipment[]; returnTo: string }): Promise<PlacedOrder> {
  if (!versionId) throw new PrintOrderError("needs_review");
  const d = await call({ versionId, shipments: shipmentsBody(shipments), client: "web", returnTo });
  const orderId = text(d.orderId);
  const totalCents = cents(d.totalCents);
  const paid = d.paid === true;
  const checkoutUrl = typeof d.checkoutUrl === "string" && /^https:\/\//.test(d.checkoutUrl) ? d.checkoutUrl : null;
  if (!orderId || totalCents === null || (!paid && !checkoutUrl)) throw new PrintOrderError("unknown");
  return { orderId, totalCents, lines: readLines(d.lines), delivery: readDelivery(d.delivery), paid, checkoutUrl: paid ? null : checkoutUrl };
}

/* ── Words ─────────────────────────────────────────────────────────────── */

/** "$79.00", or "−$1.00" for a credit: a receipt's amounts, always with cents. Pure. */
export function money(amountCents: number): string {
  const abs = Math.abs(amountCents);
  const s = `$${Math.floor(abs / 100).toLocaleString("en-US")}.${String(abs % 100).padStart(2, "0")}`;
  return amountCents < 0 ? `−${s}` : s;
}

/** "$79", or "$84.50": a price in a sentence. Pure. */
export function price(amountCents: number): string {
  return amountCents % 100 === 0 ? `$${(amountCents / 100).toLocaleString("en-US")}` : money(amountCents);
}

/** The label a line is shown with: "Your book × 2". Pure. */
export function lineLabel(l: OrderLine): string {
  return l.kind === "book" && l.quantity && l.quantity > 1 ? `${l.label} × ${l.quantity}` : l.label;
}

const day = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
};

/** "Arrives between Tue 10 Nov and Fri 13 Nov", or null without a date. Pure. */
export function arrivesWords(delivery: Delivery | null | undefined): string | null {
  if (!delivery) return null;
  const a = day(delivery.earliest).replace(",", "");
  const b = day(delivery.latest).replace(",", "");
  return a === b ? `Arrives ${a}` : `Arrives between ${a} and ${b}`;
}

/** What a $0 order says instead of a price: whose credit covered it. Never "free". Pure. */
export function coveredWords(lines: OrderLine[]): string {
  if (lines.some((l) => l.kind === "founding_copy")) return "Covered by your Founding Family place";
  if (lines.some((l) => l.kind === "gift_copy")) return "Covered by a gift";
  return "Covered by your credit";
}

export type PlainWarning = { kind: string; words: string; memoryId?: string | null };

/**
 * preflight.js's warnings as the family reads them: one line per memory for its photos ('A photo in "Our wedding" may
 * look blurry in print'), and every other warning in its own words. Pure.
 */
export function groupWarnings(warnings: PlainWarning[] | null | undefined, memories: { id: string; title: string }[]): string[] {
  const out: string[] = [];
  const photos = new Map<string, number>();
  for (const w of warnings || []) {
    if (!w || typeof w.words !== "string") continue;
    if (w.kind === "photo_blurry" || w.kind === "photo_very_blurry") {
      const key = w.memoryId || "";
      photos.set(key, (photos.get(key) ?? 0) + 1);
      if (photos.get(key) === 1) out.push(`photo:${key}`);
    } else if (!out.includes(w.words)) {
      out.push(w.words);
    }
  }
  return out.map((line) => {
    if (!line.startsWith("photo:")) return line;
    const key = line.slice("photo:".length);
    const n = photos.get(key) ?? 1;
    const title = memories.find((m) => m.id === key)?.title?.trim();
    const where = title ? ` in “${title}”` : "";
    return n > 1 ? `${n} photos${where} may look blurry in print.` : `A photo${where} may look blurry in print.`;
  });
}
