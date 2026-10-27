import { beforeEach, describe, expect, it, vi } from "vitest";

const sb = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("../lib/supabase", () => ({ supabase: () => ({ functions: { invoke: sb.invoke } }) }));

import { CATALOG, ORDER_PAGE, checkBookOrder, editionTerms, formatCents, orderBook, orderingOpen, orderPath, withEditions, type Edition } from "./book";

const edition = (id: Edition["id"]) => CATALOG.find((e) => e.id === id)!;

beforeEach(() => sb.invoke.mockReset());

describe("withEditions", () => {
  it("never says a plan includes a book, whatever an older server sends", () => {
    const offer = withEditions({ included: true, reason: "included", member: true, orderingOpen: true });
    expect(offer.included).toBe(false);
    expect(offer).not.toHaveProperty("creditCents");
  });

  it("keeps the server's gift credits as a whole count, and none when it sends nonsense", () => {
    expect(withEditions({ credits: 2 }).credits).toBe(2);
    expect(withEditions({}).credits).toBe(0);
    expect(withEditions({ credits: -1 }).credits).toBe(0);
    expect(withEditions({ credits: "x" as unknown as number }).credits).toBe(0);
  });

  it("lays the server's prices over the catalog, but never how an edition is sold", () => {
    const offer = withEditions({
      editions: [
        { id: "hardcover", priceCents: 7900, extraCents: 5900 },
        { id: "digital", priceCents: 2900, sale: "stripe" },
      ],
    });
    const hard = offer.editions.find((e) => e.id === "hardcover")!;
    expect([hard.priceCents, hard.extraCents, hard.sale]).toEqual([7900, 5900, "stripe"]);
    expect(offer.editions.find((e) => e.id === "digital")!.sale).toBe("iap");
    expect(offer.editions.find((e) => e.id === "softcover")!.priceCents).toBe(3900);
  });

  it("keeps the catalog price when the server sends none for an edition", () => {
    const offer = withEditions({ editions: [{ id: "heirloom", extraCents: null }] });
    const heir = offer.editions.find((e) => e.id === "heirloom")!;
    expect([heir.priceCents, heir.extraCents]).toEqual([14900, 11900]);
  });
});

describe("editionTerms", () => {
  const open = withEditions({ orderingOpen: true });
  const closed = withEditions({ orderingOpen: false, credits: 1 });

  it("prices and orders nothing while ordering is closed, or the server can't be asked", () => {
    for (const id of ["softcover", "hardcover", "heirloom", "legacy"] as const) {
      expect(editionTerms(closed, edition(id)).orderable).toBe(false);
      expect(editionTerms(null, edition(id)).orderable).toBe(false);
    }
  });

  it("orders the printed editions once it opens and the ordering page is here", () => {
    for (const id of ["softcover", "hardcover", "heirloom", "legacy"] as const) expect(editionTerms(open, edition(id), true).orderable).toBe(true);
  });

  it("orders nothing while the web has no ordering page, whatever the server says (until M5)", () => {
    expect(ORDER_PAGE).toBe(false);
    for (const id of ["softcover", "hardcover", "heirloom", "legacy"] as const) expect(editionTerms(open, edition(id)).orderable).toBe(false);
    expect(orderingOpen(open)).toBe(false);
    expect(orderingOpen(open, true)).toBe(true);
  });

  it("never orders the Digital Edition from the web, open or not", () => {
    expect(editionTerms(open, edition("digital"), true).orderable).toBe(false);
    expect(editionTerms(closed, edition("digital")).orderable).toBe(false);
  });

  it("says a gift has paid for one Classic Hardcover, and only that edition", () => {
    expect(editionTerms(closed, edition("hardcover")).giftCredit).toBe(true);
    expect(editionTerms(closed, edition("heirloom")).giftCredit).toBe(false);
    expect(editionTerms(open, edition("hardcover")).giftCredit).toBe(false);
    expect(editionTerms(null, edition("hardcover")).giftCredit).toBe(false);
  });
});

describe("orderPath", () => {
  it("goes to the ordering page with the story and the chosen edition", () => {
    expect(orderPath("s-1", "heirloom")).toBe("/book/order?story=s-1&edition=heirloom");
  });
});

describe("formatCents", () => {
  it("drops the cents from whole dollars", () => {
    expect([formatCents(6900), formatCents(1250), formatCents(0)]).toEqual(["$69", "$12.50", "$0"]);
  });
});

describe("checkBookOrder", () => {
  it("reads credits and the open flag from the server's answer", async () => {
    sb.invoke.mockResolvedValue({ data: { reason: "not_member", credits: 1, orderingOpen: true, member: false }, error: null });
    const offer = await checkBookOrder("s-1");
    expect(sb.invoke).toHaveBeenCalledWith("create-book-checkout", { body: { storyId: "s-1", check: true } });
    expect([offer.credits, offer.orderingOpen, offer.included]).toEqual([1, true, false]);
  });

  it("treats a server that doesn't know the question as closed", async () => {
    sb.invoke.mockResolvedValue({ data: { ok: true }, error: null });
    const offer = await checkBookOrder("s-1");
    expect([offer.orderingOpen, offer.credits]).toEqual([false, 0]);
  });

  it("throws the server's own words", async () => {
    const context = new Response(JSON.stringify({ error: "Add memories before ordering a book" }));
    sb.invoke.mockResolvedValue({ data: null, error: { message: "non-2xx", context } });
    await expect(checkBookOrder("s-1")).rejects.toThrow("Add memories before ordering a book");
  });
});

describe("orderBook", () => {
  it("returns Stripe's page to go to", async () => {
    sb.invoke.mockResolvedValue({ data: { checkoutUrl: "https://checkout.example.test/c", orderId: "o-1" }, error: null });
    await expect(orderBook("s-1", "hardcover")).resolves.toEqual({ checkoutUrl: "https://checkout.example.test/c", orderId: "o-1" });
  });

  it("returns an order already paid with a gift, with no checkout", async () => {
    sb.invoke.mockResolvedValue({ data: { paidWithCredit: true, orderId: "o-2" }, error: null });
    await expect(orderBook("s-1", "hardcover")).resolves.toEqual({ checkoutUrl: null, orderId: "o-2", paidWithCredit: true });
  });

  it("fails plainly when the server returns no checkout", async () => {
    sb.invoke.mockResolvedValue({ data: {}, error: null });
    await expect(orderBook("s-1", "hardcover")).rejects.toThrow("We couldn’t start the order");
  });

  it("carries the server's reason, so the page can say ordering isn't open", async () => {
    const context = new Response(JSON.stringify({ error: "Ordering printed books opens soon.", reason: "not_open" }));
    sb.invoke.mockResolvedValue({ data: null, error: { message: "non-2xx", context } });
    await expect(orderBook("s-1", "softcover")).rejects.toMatchObject({ message: "Ordering printed books opens soon.", reason: "not_open" });
  });
});
