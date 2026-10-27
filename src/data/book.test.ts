import { beforeEach, describe, expect, it, vi } from "vitest";

const sb = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("../lib/supabase", () => ({ supabase: () => ({ functions: { invoke: sb.invoke } }) }));

import {
  CATALOG,
  ORDER_PAGE,
  addressLines,
  addressShort,
  checkBookOrder,
  editionTerms,
  formatCents,
  giftCreditCovers,
  missingFields,
  orderBook,
  orderingOpen,
  orderPath,
  orderShipping,
  quoteOrder,
  shipChoices,
  tidyNote,
  withEditions,
  type Edition,
} from "./book";

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

  it("orders once the server says so, now the web has its ordering page (M5), and nothing without the page", () => {
    expect(ORDER_PAGE).toBe(true);
    for (const id of ["softcover", "hardcover", "heirloom", "legacy"] as const) {
      expect(editionTerms(open, edition(id)).orderable).toBe(true);
      expect(editionTerms(open, edition(id), false).orderable).toBe(false);
    }
    expect(orderingOpen(open)).toBe(true);
    expect(orderingOpen(open, false)).toBe(false);
    expect(orderingOpen(closed)).toBe(false);
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
    await expect(orderBook("s-1", { edition: "hardcover" })).resolves.toEqual({ checkoutUrl: "https://checkout.example.test/c", orderId: "o-1" });
  });

  it("returns an order already paid with a gift, with no checkout", async () => {
    sb.invoke.mockResolvedValue({ data: { paidWithCredit: true, orderId: "o-2" }, error: null });
    await expect(orderBook("s-1", { edition: "hardcover" })).resolves.toEqual({ checkoutUrl: null, orderId: "o-2", paidWithCredit: true });
  });

  it("sends the phone's body, with the address, the note, the copies and the way back to this site", async () => {
    sb.invoke.mockResolvedValue({ data: { checkoutUrl: "https://checkout.example.test/c", orderId: "o-1" }, error: null });
    const shipTo = { name: "Rose Miller", line1: "1418 Almaden Road", line2: "", city: "San Jose", region: "CA", postal: "95125", country: "US", phone: "" };
    await orderBook("s-1", { edition: "heirloom", copies: 2, shipTo, note: "For Rose.", returnTo: "https://app.example.test" });
    expect(sb.invoke).toHaveBeenCalledWith("create-book-checkout", {
      body: { storyId: "s-1", edition: "heirloom", copies: 2, shipTo, note: "For Rose.", returnTo: "https://app.example.test" },
    });
  });

  it("leaves out what wasn't given", async () => {
    sb.invoke.mockResolvedValue({ data: { checkoutUrl: "https://checkout.example.test/c", orderId: "o-1" }, error: null });
    await orderBook("s-1", { edition: "softcover", note: "" });
    expect(sb.invoke).toHaveBeenCalledWith("create-book-checkout", { body: { storyId: "s-1", edition: "softcover", copies: 1 } });
  });

  it("fails plainly when the server returns no checkout", async () => {
    sb.invoke.mockResolvedValue({ data: {}, error: null });
    await expect(orderBook("s-1", { edition: "hardcover" })).rejects.toThrow("We couldn’t start the order");
  });

  it("carries the server's reason, so the page can say ordering isn't open", async () => {
    const context = new Response(JSON.stringify({ error: "Ordering printed books opens soon.", reason: "not_open" }));
    sb.invoke.mockResolvedValue({ data: null, error: { message: "non-2xx", context } });
    await expect(orderBook("s-1", { edition: "softcover" })).rejects.toMatchObject({ message: "Ordering printed books opens soon.", reason: "not_open" });
  });
});

describe("quoteOrder", () => {
  it("adds further copies at the extra-copy price", () => {
    expect(quoteOrder(edition("hardcover"), 3)).toEqual({
      lines: [
        { label: "Classic Hardcover", unitCents: 6900, qty: 1 },
        { label: "Classic Hardcover, extra copy", unitCents: 4900, qty: 2 },
      ],
      totalCents: 6900 + 2 * 4900,
    });
  });

  it("counts the Full-Service Edition's fourth copy as one extra Heirloom", () => {
    expect(quoteOrder(edition("legacy"), 2)?.lines[1]).toEqual({ label: "Extra Heirloom copy", unitCents: 11900, qty: 1 });
  });

  it("quotes nothing the web can't sell, and no more than ten copies", () => {
    expect(quoteOrder(edition("digital"), 1)).toBeNull();
    expect(quoteOrder(edition("hardcover"), 11)).toBeNull();
    expect(quoteOrder(edition("hardcover"), 0)).toBeNull();
  });
});

describe("giftCreditCovers", () => {
  it("pays for exactly one Classic Hardcover", () => {
    expect(giftCreditCovers({ credits: 1, edition: "hardcover", copies: 1 })).toBe(true);
    expect(giftCreditCovers({ credits: 1, edition: "hardcover", copies: 2 })).toBe(false);
    expect(giftCreditCovers({ credits: 1, edition: "heirloom", copies: 1 })).toBe(false);
    expect(giftCreditCovers({ credits: 0, edition: "hardcover", copies: 1 })).toBe(false);
  });
});

describe("the address and the note", () => {
  const rose = { name: " Rose Miller ", line1: "1418 Almaden Road", line2: "", city: "San Jose", region: "CA", postal: "95125", country: "US", phone: "" };

  it("names the fields a courier still needs", () => {
    expect(missingFields({ ...rose, city: " ", postal: "" })).toEqual(["city", "postal"]);
    expect(missingFields({ ...rose, country: "FR" })).toEqual(["country"]);
    expect(missingFields(rose)).toEqual([]);
  });

  it("sends a complete address trimmed, and nothing while one is missing", () => {
    expect(orderShipping({ address: rose, note: "  For Rose.  " })).toEqual({ shipTo: { ...rose, name: "Rose Miller" }, note: "For Rose." });
    expect(orderShipping({ address: { ...rose, line1: "" }, note: "" })).toBeNull();
  });

  it("keeps the note to two lines and 140 letters", () => {
    expect(tidyNote("one\n\ntwo\nthree")).toBe("one\ntwo three");
    expect(tidyNote("x".repeat(200))).toHaveLength(140);
  });

  it("prints the label and the short line", () => {
    expect(addressLines({ ...rose, country: "CA", region: "ON", city: "Toronto" })).toEqual(["Rose Miller", "1418 Almaden Road", "Toronto, ON 95125", "Canada"]);
    expect(addressShort(rose)).toBe("Rose Miller, San Jose");
  });
});

describe("shipChoices", () => {
  const people = [
    { id: "p-rose", givenName: "Rose", familyName: "Miller", storyId: "s-1" },
    { id: "p-me", givenName: "Sam", familyName: "Miller", userId: "u-1" },
    { id: "p-dad", givenName: "Tom", familyName: "Miller", userId: "u-2" },
    { id: "p-kid", givenName: "Ada", familyName: "Miller", email: "ada@example.test", birthYear: 2020 },
    { id: "p-gone", givenName: "Walt", familyName: "Miller", userId: "u-3", deathYear: 1990 },
  ];

  it("offers the storyteller, the grown family, you, then someone else", () => {
    const out = shipChoices({ story: { id: "s-1", name: "Rose" }, people, me: { id: "u-1", firstName: "Sam", lastName: "Miller" }, saved: {}, year: 2026 });
    expect(out.map((c) => c.key)).toEqual(["person:p-rose", "person:p-dad", "me", "other"]);
    expect(out[0].relation).toBe("Rose’s own copy");
  });

  it("carries an address kept for a choice", () => {
    const kept = { name: "Tom Miller", line1: "1 Main St", line2: "", city: "Austin", region: "TX", postal: "78701", country: "US", phone: "" };
    const out = shipChoices({ story: null, people, me: null, saved: { "person:p-dad": kept }, year: 2026 });
    expect(out.find((c) => c.key === "person:p-dad")?.address).toEqual(kept);
  });
});
