/**
 * The Book page's questions about the editions, and who a printed copy can
 * be sent to.
 *
 * checkBookOrder asks create-book-checkout's price check (the app's
 * src/data/book.js), now only for what the Digital Edition row says
 * (`member`): printing is ordered through create-book-order
 * (data/printOrder.ts), whose check alone says whether ordering is open
 * (P4-R8). The four-edition ordering that served create-book-checkout is gone
 * from the web; that function stays deployed, closed behind its own switch,
 * for the 1.1 app until it ages out. A printed book costs everybody the same: no plan
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

/** Where "Order a printed copy" goes: the three-step ordering page for this story (P4-R1). */
export function orderPath(storyId: string): string {
  return `/book/order?${new URLSearchParams({ story: storyId })}`;
}

/** "$69", or "$12.50", in the currency the checkout charges in. */
export function formatCents(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
}

/** One of the quick picks for an address card. A is the address shape the page keeps (printOrder.ts PrintAddress). */
export type ShipChoice<A = unknown> = { key: string; name: string; first: string; relation: string; address: A | null };

type ShipPerson = { id: string; givenName?: string; familyName?: string; storyId?: string; userId?: string; invitedAt?: string; email?: string; birthYear?: number; deathYear?: number };

/**
 * Who the book can be sent to, in order (bookShipping.js shipChoices): the
 * storyteller, the family who are grown and on A Story or invited, you, then
 * "Someone else". A child's bedroom isn't an address a parcel goes to.
 * `saved` is the addresses kept on this computer, by each choice's key.
 */
export function shipChoices<A = unknown>({
  story,
  people = [],
  me,
  saved = {},
  year = new Date().getFullYear(),
}: {
  story: { id: string; name: string } | null;
  people?: ShipPerson[];
  me?: { id: string; firstName: string; lastName: string } | null;
  saved?: Record<string, A>;
  year?: number;
}): ShipChoice<A>[] {
  const out: ShipChoice<A>[] = [];
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
