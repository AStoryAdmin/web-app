import { beforeEach, describe, expect, it, vi } from "vitest";

const sb = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("../lib/supabase", () => ({ supabase: () => ({ functions: { invoke: sb.invoke } }) }));

import { checkBookOrder, formatCents, orderPath, shipChoices, withEditions } from "./book";

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

describe("orderPath", () => {
  it("goes to the three-step ordering page with the story, and no edition (one book, P4-R1)", () => {
    expect(orderPath("s-1")).toBe("/book/order?story=s-1");
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
