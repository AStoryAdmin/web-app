import { beforeEach, describe, expect, it, vi } from "vitest";

// A query builder that records what it was asked and answers with the next queued reply.
const sb = vi.hoisted(() => {
  const calls: { method: string; args: unknown[] }[] = [];
  const replies: { data: unknown; error: unknown }[] = [];
  const next = () => Promise.resolve(replies.shift() ?? { data: null, error: null });
  const q: Record<string, unknown> = {};
  for (const m of ["from", "select", "eq"]) q[m] = (...args: unknown[]) => (calls.push({ method: m, args }), q);
  q.order = (...args: unknown[]) => (calls.push({ method: "order", args }), next());
  q.maybeSingle = (...args: unknown[]) => (calls.push({ method: "maybeSingle", args }), next());
  return { calls, replies, client: q };
});
vi.mock("../lib/supabase", () => ({ getSupabase: () => sb.client }));

import { getOrder, isPaid, listOrders, orderFromRow, orderStatusLine, pollUntilPaid, trackingUrlFor } from "./bookOrders";

const row = (over: Record<string, unknown> = {}) => ({
  id: "o1",
  story_id: "s1",
  status: "pending",
  edition: "hardcover",
  copies: 2,
  amount_cents: 13800,
  currency: "usd",
  included: false,
  shipping_name: "Ana Reyes",
  shipping_address: { line1: "1 Elm St", city: "Austin", country: "US" },
  gift_note: "For Mum",
  created_at: "2026-10-27T10:00:00Z",
  paid_at: null,
  ...over,
});

beforeEach(() => {
  sb.calls.length = 0;
  sb.replies.length = 0;
});

describe("orderFromRow", () => {
  it("reads the phone's columns", () => {
    expect(orderFromRow(row())).toEqual({
      id: "o1",
      storyId: "s1",
      status: "pending",
      edition: "hardcover",
      copies: 2,
      amountCents: 13800,
      currency: "usd",
      included: false,
      shippingName: "Ana Reyes",
      shippingAddress: { line1: "1 Elm St", city: "Austin", country: "US" },
      note: "For Mum",
      createdAt: "2026-10-27T10:00:00Z",
      paidAt: null,
      carrier: null,
      trackingNumber: null,
      trackingUrl: null,
      shippedAt: null,
    });
  });

  it("reads a shipped order's carrier and tracking page", () => {
    const o = orderFromRow(row({ status: "shipped", carrier: "UPS", tracking_number: "1Z999", shipped_at: "2026-11-02T09:00:00Z" }));
    expect([o.status, o.trackingUrl, o.shippedAt]).toEqual(["shipped", "https://www.ups.com/track?tracknum=1Z999", "2026-11-02T09:00:00Z"]);
    expect(isPaid(o)).toBe(true);
    expect(orderStatusLine(o)).toBe("Shipped with UPS. Tracking number 1Z999.");
    expect(orderStatusLine({ status: "shipped" })).toBe("Shipped. It’s in the post.");
  });

  it("links only a known carrier and a plain number", () => {
    expect(trackingUrlFor("Pigeon", "123456")).toBeNull();
    expect(trackingUrlFor("usps", "12 34\"><x")).toBeNull();
    expect(trackingUrlFor("USPS", "9400100000000000000000")).toMatch(/^https:\/\/tools\.usps\.com\//);
  });

  it("reads anything it doesn't know as the default, never as a crash", () => {
    const o = orderFromRow({ id: "o2", status: "lost", edition: "scroll", copies: "x", amount_cents: null, shipping_address: "nope" });
    expect([o.status, o.edition, o.copies, o.amountCents, o.currency, o.shippingAddress, o.note]).toEqual(["pending", "hardcover", 1, 0, "usd", null, null]);
  });
});

describe("status", () => {
  it("counts a fulfilled order as paid", () => {
    expect(isPaid({ status: "paid" })).toBe(true);
    expect(isPaid({ status: "fulfilled" })).toBe(true);
    expect(isPaid({ status: "pending" })).toBe(false);
    expect(isPaid(null)).toBe(false);
  });
  it("says each state in a short plain line", () => {
    expect(orderStatusLine({ status: "pending" })).toBe("Waiting for the payment to come through.");
    expect(orderStatusLine({ status: "paid" })).toBe("Paid. The book is being made.");
  });
});

describe("listOrders and getOrder", () => {
  it("lists newest first, and only one story's when asked", async () => {
    sb.replies.push({ data: [row(), row({ id: "o0" })], error: null });
    const orders = await listOrders({ storyId: "s1" });
    expect(orders.map((o) => o.id)).toEqual(["o1", "o0"]);
    expect(sb.calls).toContainEqual({ method: "from", args: ["book_orders"] });
    expect(sb.calls).toContainEqual({ method: "eq", args: ["story_id", "s1"] });
    expect(sb.calls).toContainEqual({ method: "order", args: ["created_at", { ascending: false }] });
  });

  it("asks again without the tracking columns when the database doesn't have them yet", async () => {
    sb.replies.push({ data: null, error: { code: "42703", message: "column book_orders.carrier does not exist" } }, { data: [row()], error: null });
    expect((await listOrders()).map((o) => o.id)).toEqual(["o1"]);
    const selects = sb.calls.filter((c) => c.method === "select").map((c) => String(c.args[0]));
    expect(selects[0]).toContain("tracking_number");
    expect(selects[1]).not.toContain("tracking_number");
  });

  it("asks again without gift_note too when that column is missing as well", async () => {
    const missing = (c: string) => ({ data: null, error: { code: "42703", message: `column book_orders.${c} does not exist` } });
    sb.replies.push(missing("carrier"), missing("gift_note"), { data: row({ gift_note: undefined, status: "paid" }), error: null });
    const o = await getOrder("o1");
    expect(o?.status).toBe("paid");
    expect(o?.note).toBeNull();
    const selects = sb.calls.filter((c) => c.method === "select").map((c) => String(c.args[0]));
    expect(selects).toHaveLength(3);
    expect(selects[1]).toContain("gift_note");
    expect(selects[1]).not.toContain("tracking_number");
    expect(selects[2]).not.toContain("gift_note");
  });

  it("says so when the list can't be read", async () => {
    sb.replies.push({ data: null, error: { message: "boom" } });
    await expect(listOrders()).rejects.toThrow("We couldn’t load your orders");
  });

  it("gets one order by id, and null when there is none", async () => {
    sb.replies.push({ data: row({ status: "paid" }), error: null }, { data: null, error: null });
    expect((await getOrder("o1"))?.status).toBe("paid");
    expect(sb.calls).toContainEqual({ method: "eq", args: ["id", "o1"] });
    expect(await getOrder("o9")).toBeNull();
  });
});

describe("pollUntilPaid", () => {
  const clock = () => {
    let t = 0;
    return { now: () => t, sleep: async (ms: number) => void (t += ms) };
  };

  it("asks until the webhook has marked the order paid", async () => {
    sb.replies.push({ data: row(), error: null }, { data: null, error: { message: "flaky" } }, { data: row({ status: "paid" }), error: null });
    const c = clock();
    const o = await pollUntilPaid("o1", c);
    expect(o?.status).toBe("paid");
    expect(c.now()).toBe(4000);
  });

  it("stops at the timeout with the last row it read", async () => {
    for (let i = 0; i < 20; i++) sb.replies.push({ data: row(), error: null });
    const c = clock();
    const o = await pollUntilPaid("o1", { ...c, intervalMs: 2000, timeoutMs: 15000 });
    expect(o?.status).toBe("pending");
    expect(c.now()).toBeLessThanOrEqual(15000);
  });

  it("stops when the page closes", async () => {
    const ac = new AbortController();
    ac.abort();
    expect(await pollUntilPaid("o1", { signal: ac.signal })).toBeNull();
  });
});
