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

export type Edition = {
  id: EditionId;
  priceCents: number;
  extraCents?: number | null;
  sale?: EditionSale;
  /** Copies the price already carries: the Full-Service Edition sends three Heirloom copies. */
  copiesIncluded?: number;
};

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
  { id: "legacy", priceCents: 49900, extraCents: 11900, sale: "stripe", copiesIncluded: 3 },
];

/** At most this many copies in one order (bookCatalog.js MAX_COPIES). */
export const MAX_COPIES = 10;

/** The printed editions' names, the line on the receipt for a further copy, and how long each takes (bookCatalog.js). */
export const EDITION_WORDS: Record<EditionId, { name: string; extra: string; delivery: string }> = {
  home: { name: "Print at home", extra: "", delivery: "" },
  digital: { name: "Digital Edition", extra: "", delivery: "" },
  softcover: { name: "Softcover", extra: "Softcover, extra copy", delivery: "Ships in 7–10 days" },
  hardcover: { name: "Classic Hardcover", extra: "Classic Hardcover, extra copy", delivery: "Ships in 7–10 days" },
  heirloom: { name: "Heirloom Edition", extra: "Heirloom Edition, extra copy", delivery: "Ships in 2–3 weeks" },
  legacy: { name: "Full-Service Edition", extra: "Extra Heirloom copy", delivery: "Ready in 6–8 weeks" },
};

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
 * Whether the web has its ordering page (/book/order, M5). It does, so Order shows once the server says ordering is
 * open (BOOK_ORDERING_OPEN lives on the server and is the founder's to set). Kept as a switch, so the page can be
 * taken away again without touching the editions.
 */
export const ORDER_PAGE = true;

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

export type OrderRequest = {
  edition: EditionId;
  copies?: number;
  /** Where it goes (orderShipping). Needed when a gift's credit pays: there is no Stripe page to ask for one. */
  shipTo?: ShipTo | null;
  /** Two lines for the first page; empty for none. */
  note?: string;
  /**
   * This site's return page (`${origin}/book/thanks`), so Stripe brings the buyer back here and not to the phone app.
   * The server checks its origin against an allow-list (400, reason 'bad_return', when it isn't on it) and returns to
   * {returnTo}?order_id={id}&session_id=…, or {returnTo}?order_id={id}&canceled=1 when they leave Stripe's page.
   */
  returnTo?: string;
};

/**
 * Starts an order of a printed edition, with the body the phone's
 * startBookOrder sends (storyId, edition, copies, shipTo, note) and the
 * web's returnTo. Stripe Checkout, and the page then goes to checkoutUrl;
 * or, when a gift's credit pays for it, an order already paid, with no
 * checkout (paidWithCredit, checkoutUrl null).
 */
export async function orderBook(storyId: string, order: OrderRequest): Promise<BookOrderStarted> {
  const { edition, copies = 1, shipTo, note, returnTo } = order;
  const body = { storyId, edition, copies, ...(shipTo ? { shipTo } : {}), ...(note ? { note } : {}), ...(returnTo ? { returnTo } : {}) };
  const { data, error } = await supabase().functions.invoke("create-book-checkout", { body });
  if (error) {
    const { message, reason } = await readError(error);
    throw Object.assign(new Error(message), { reason });
  }
  if (data?.paidWithCredit && data?.orderId) return { orderId: data.orderId, paidWithCredit: true, checkoutUrl: null };
  if (!data?.checkoutUrl || !data?.orderId) throw new Error("We couldn’t start the order. Please try again.");
  return { checkoutUrl: data.checkoutUrl, orderId: data.orderId };
}

/**
 * Whether a gift's hardcover credit pays for this order, as the server
 * decides it (_shared/giftOrder.js creditApplies): exactly one Classic
 * Hardcover, with a credit unspent. More copies or another edition pay
 * through Stripe and the credit keeps.
 */
export const giftCreditCovers = ({ credits, edition, copies }: { credits: number; edition: EditionId; copies: number }): boolean =>
  edition === "hardcover" && copies === 1 && credits > 0;

export type QuoteLine = { label: string; unitCents: number; qty: number };

/**
 * What an order costs, line by line (bookCatalog.js quoteBook): the edition,
 * then any further copies at the extra-copy price. The same for everybody.
 * `copies` counts the edition itself as one, so the Full-Service Edition's
 * fourth Heirloom copy is copies 2. Null for what the web can't sell.
 */
export function quoteOrder(edition: Edition, copies: number): { lines: QuoteLine[]; totalCents: number } | null {
  const n = Math.floor(copies);
  if (edition.sale !== "stripe" || !Number.isFinite(n) || n < 1 || n > MAX_COPIES) return null;
  const words = EDITION_WORDS[edition.id];
  const lines: QuoteLine[] = [{ label: words.name, unitCents: edition.priceCents, qty: 1 }];
  if (n > 1) {
    if (edition.extraCents == null) return null;
    lines.push({ label: words.extra, unitCents: edition.extraCents, qty: n - 1 });
  }
  return { lines, totalCents: lines.reduce((s, l) => s + l.unitCents * l.qty, 0) };
}

/* ── Where it goes ──────────────────────────────────────────────────────────
   The phone's lib/bookShipping.js, typed: the countries it ships to, the
   fields a courier needs, the note for the first page, and who it can be
   sent to. create-book-checkout reads the same rules (readShipTo, tidyNote),
   so a change goes in all three. */

export type ShipTo = { name: string; line1: string; line2: string; city: string; region: string; postal: string; country: string; phone: string };
export type ShipField = keyof ShipTo;

export const SHIP_COUNTRIES = [
  { code: "US", name: "United States", region: "State", postal: "ZIP" },
  { code: "CA", name: "Canada", region: "Province", postal: "Postal code" },
] as const;

/** Two lines on the first page, in the giver's words: short on purpose. */
export const NOTE_MAX = 140;
export const NOTE_LINES = 2;

export const blankAddress = (country = "US"): ShipTo => ({ name: "", line1: "", line2: "", city: "", region: "", postal: "", country, phone: "" });

const filled = (v: unknown) => String(v ?? "").trim() !== "";

/** The fields a courier needs that are still empty, so the form can point at them; [] when the address will do. */
export function missingFields(a: Partial<ShipTo> | null | undefined): ShipField[] {
  const out: ShipField[] = (["name", "line1", "city", "region", "postal"] as const).filter((k) => !filled(a?.[k]));
  return SHIP_COUNTRIES.some((c) => c.code === a?.country) ? out : [...out, "country"];
}

/** The address as the parcel's label prints it, one line per row, empty rows left out. */
export function addressLines(a: Partial<ShipTo> | null | undefined): string[] {
  if (!a) return [];
  const country = SHIP_COUNTRIES.find((c) => c.code === a.country);
  const town = [a.city, a.region].filter(filled).join(", ");
  return [a.name, a.line1, a.line2, [town, a.postal].filter(filled).join(" "), country && country.code !== "US" ? country.name : ""]
    .map((s) => String(s ?? "").trim())
    .filter(Boolean);
}

/** "Rose Miller, San Jose": the one line the summary and the thanks use. */
export const addressShort = (a: Partial<ShipTo> | null | undefined): string =>
  a ? [a.name, a.city].map((s) => String(s ?? "").trim()).filter(Boolean).join(", ") : "";

/** The note as it will be set: trimmed, at most two lines and NOTE_MAX letters. Extra lines fold into the last. */
export function tidyNote(text: string | null | undefined): string {
  const lines = String(text ?? "")
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const kept = lines.slice(0, NOTE_LINES);
  if (lines.length > NOTE_LINES) kept[NOTE_LINES - 1] = [kept[NOTE_LINES - 1], ...lines.slice(NOTE_LINES)].join(" ");
  return kept.join("\n").slice(0, NOTE_MAX).trim();
}

export function tidyAddress(a: Partial<ShipTo> | null | undefined): ShipTo {
  const out = blankAddress();
  for (const k of Object.keys(out) as ShipField[]) out[k] = String(a?.[k] ?? "").trim();
  if (!SHIP_COUNTRIES.some((c) => c.code === out.country)) out.country = "US";
  return out;
}

/** The address and the note as create-book-checkout takes them, or null while the address is not complete. */
export function orderShipping({ address, note }: { address: Partial<ShipTo>; note: string }): { shipTo: ShipTo; note: string } | null {
  const shipTo = tidyAddress(address);
  return missingFields(shipTo).length ? null : { shipTo, note: tidyNote(note) };
}

export type ShipChoice = { key: string; name: string; first: string; relation: string; address: ShipTo | null };

type ShipPerson = { id: string; givenName?: string; familyName?: string; storyId?: string; userId?: string; invitedAt?: string; email?: string; birthYear?: number; deathYear?: number };

/**
 * Who the book can be sent to, in order (bookShipping.js shipChoices): the
 * storyteller, the family who are grown and on A Story or invited, you, then
 * "Someone else". A child's bedroom isn't an address a parcel goes to.
 * `saved` is the addresses kept on this computer, by each choice's key.
 */
export function shipChoices({
  story,
  people = [],
  me,
  saved = {},
  year = new Date().getFullYear(),
}: {
  story: { id: string; name: string } | null;
  people?: ShipPerson[];
  me?: { id: string; firstName: string; lastName: string } | null;
  saved?: Record<string, ShipTo>;
  year?: number;
}): ShipChoice[] {
  const out: ShipChoice[] = [];
  const seen = new Set<string>();
  const add = (key: string, name: string, first: string, relation: string) => {
    if (seen.has(key) || !name) return;
    seen.add(key);
    out.push({ key, name, first: first || name.split(" ")[0], relation, address: saved[key] ?? null });
  };
  const nameOf = (p: ShipPerson) => [p.givenName, p.familyName].filter(Boolean).join(" ").trim();

  const teller = story ? people.find((p) => p.storyId === story.id) : undefined;
  if (teller && !teller.deathYear) add(`person:${teller.id}`, nameOf(teller), teller.givenName || "", `${story?.name || teller.givenName}’s own copy`);
  const mine = me ? people.find((p) => p.userId === me.id) : undefined;
  for (const p of people) {
    if (p.deathYear || p === teller || p === mine) continue;
    const grown = !p.birthYear || year - p.birthYear >= 18;
    if (!grown || !(p.userId || p.invitedAt || p.email)) continue;
    add(`person:${p.id}`, nameOf(p), p.givenName || "", p.userId ? "On A Story" : "Invited");
  }
  if (me) add("me", `${me.firstName} ${me.lastName}`.trim() || (mine ? nameOf(mine) : "") || "You", me.firstName || mine?.givenName || "", "You");
  out.push({ key: "other", name: "Someone else", first: "", relation: "A new address", address: saved.other ?? null });
  return out;
}
