import { beforeEach, describe, expect, it, vi } from "vitest";

// A query builder that records what it was asked and answers with the next queued reply.
const sb = vi.hoisted(() => {
  const calls: { method: string; args: unknown[] }[] = [];
  const replies: { data: unknown; error: unknown }[] = [];
  const next = () => Promise.resolve(replies.shift() ?? { data: null, error: null });
  const q: Record<string, unknown> = {};
  for (const m of ["from", "select", "eq", "not"]) q[m] = (...args: unknown[]) => (calls.push({ method: m, args }), q);
  q.order = (...args: unknown[]) => (calls.push({ method: "order", args }), next());
  q.maybeSingle = (...args: unknown[]) => (calls.push({ method: "maybeSingle", args }), next());
  return { calls, replies, client: q };
});
vi.mock("../lib/supabase", () => ({ getSupabase: () => sb.client }));

import { getOrder, isPaid, listOrders, listShipments, orderFromRow, pollUntilPaid, safeHttps, shipmentFromRow, trackingUrlFor } from "./bookOrders";

const row = (over: Record<string, unknown> = {}) => ({
  id: "o1",
  user_id: "u1",
  story_id: "s1",
  status: "payment_pending",
  quantity: 3,
  subtotal_cents: 23700,
  shipping_cents: 1800,
  tax_cents: 0,
  discount_cents: 0,
  deposit_credit_cents: 100,
  total_cents: 25400,
  amount_cents: 25400,
  currency: "usd",
  created_at: "2026-10-27T10:00:00Z",
  paid_at: null,
  delivery_earliest: "2026-11-10",
  delivery_latest: "2026-11-13",
  ...over,
});

const ship = (over: Record<string, unknown> = {}) => ({
  id: "sh1",
  order_id: "o1",
  quantity: 2,
  name: "Rose Hartley",
  line1: "1 Elm Street",
  city: "San Jose",
  state: "CA",
  postal_code: "95112",
  status: "pending",
  carrier: null,
  tracking_number: null,
  tracking_url: null,
  created_at: "2026-10-27T10:00:00Z",
  ...over,
});

beforeEach(() => {
  sb.calls.length = 0;
  sb.replies.length = 0;
});

describe("orderFromRow", () => {
  it("reads the new columns: copies, the money lines, the delivery days and the stage", () => {
    expect(orderFromRow(row())).toEqual({
      id: "o1",
      storyId: "s1",
      status: "payment_pending",
      stage: "Approved",
      copies: 3,
      totalCents: 25400,
      subtotalCents: 23700,
      shippingCents: 1800,
      taxCents: 0,
      discountCents: 0,
      depositCents: 100,
      currency: "usd",
      createdAt: "2026-10-27T10:00:00Z",
      paidAt: null,
      deliveryEarliest: "2026-11-10",
      deliveryLatest: "2026-11-13",
    });
  });

  it("reads each status as the family's stage, never the printer's word", () => {
    const stage = (status: string) => orderFromRow(row({ status })).stage;
    expect(["paid", "submitted_to_provider", "in_production", "submission_failed"].map(stage)).toEqual(["Printing", "Printing", "Printing", "Printing"]);
    expect(["shipped", "delivered", "refunded", "canceled", "payment_failed", "nonsense"].map(stage)).toEqual(["Shipped", "Delivered", "Refunded", "Canceled", "Needs attention", "Needs attention"]);
  });

  it("reads an old row (copies, amount_cents, no new columns) and anything odd as its default", () => {
    const old = orderFromRow({ id: "o0", story_id: "s1", status: "fulfilled", copies: 2, amount_cents: 6900, paid_at: "2026-10-01T00:00:00Z" });
    expect(old).toMatchObject({ stage: "Shipped", copies: 2, totalCents: 6900, subtotalCents: null, depositCents: 0, deliveryEarliest: null });
    expect(orderFromRow({ id: "o9", quantity: -1, total_cents: "x", delivery_latest: "soon" })).toMatchObject({ copies: 1, totalCents: 0, deliveryLatest: null, stage: "Approved" });
  });
});

describe("shipmentFromRow", () => {
  it("keeps the first name's row and the city, and follows only an https tracking link", () => {
    expect(shipmentFromRow(ship({ status: "shipped", tracking_url: "https://track.example.test/1Z999" }))).toMatchObject({
      quantity: 2,
      name: "Rose Hartley",
      city: "San Jose",
      status: "shipped",
      trackingUrl: "https://track.example.test/1Z999",
    });
    expect(shipmentFromRow(ship({ tracking_url: "javascript:alert(1)" })).trackingUrl).toBeNull();
    expect(shipmentFromRow(ship({ tracking_url: "http://track.example.test/1" })).trackingUrl).toBeNull();
  });

  it("makes the carrier's own link from a plain number when there is no link", () => {
    expect(shipmentFromRow(ship({ carrier: "USPS", tracking_number: "9400111" })).trackingUrl).toBe("https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111");
    expect(trackingUrlFor("Pigeon", "123456")).toBeNull();
    expect(trackingUrlFor("ups", "12 34")).toBeNull();
    expect(safeHttps("not a url")).toBeNull();
  });
});

describe("the reads", () => {
  it("lists only paid orders, newest first, with one plain select", async () => {
    sb.replies.push({ data: [row({ id: "o2", paid_at: "2026-10-27T11:00:00Z" }), row({ id: "o3", paid_at: null })], error: null });
    const out = await listOrders();
    expect(out.map((o) => o.id)).toEqual(["o2"]);
    expect(sb.calls).toEqual([
      { method: "from", args: ["book_orders"] },
      { method: "select", args: ["*"] },
      { method: "not", args: ["paid_at", "is", null] },
      { method: "order", args: ["created_at", { ascending: false }] },
    ]);
  });

  it("narrows to one story when asked, and says so plainly when it can't read", async () => {
    sb.replies.push({ data: [], error: null });
    await listOrders({ storyId: "s1" });
    expect(sb.calls).toContainEqual({ method: "eq", args: ["story_id", "s1"] });
    sb.replies.push({ data: null, error: { message: "boom" } });
    await expect(listOrders()).rejects.toThrow("We couldn’t load your orders. Please try again.");
  });

  it("gets one order by id, and null when there is none", async () => {
    sb.replies.push({ data: row(), error: null });
    await expect(getOrder("o1")).resolves.toMatchObject({ id: "o1" });
    expect(sb.calls).toContainEqual({ method: "eq", args: ["id", "o1"] });
    sb.replies.push({ data: null, error: null });
    await expect(getOrder("nope")).resolves.toBeNull();
    await expect(getOrder("")).resolves.toBeNull();
  });

  it("reads the shipments with a second select, never an embedded join", async () => {
    sb.replies.push({ data: [ship(), ship({ id: "sh2", name: "Ana Reyes", city: "Austin" })], error: null });
    const out = await listShipments("o1");
    expect(out.map((s) => s.city)).toEqual(["San Jose", "Austin"]);
    expect(sb.calls.slice(0, 3)).toEqual([
      { method: "from", args: ["order_shipments"] },
      { method: "select", args: ["*"] },
      { method: "eq", args: ["order_id", "o1"] },
    ]);
  });

  it("counts an order as paid once paid_at is set", () => {
    expect(isPaid(orderFromRow(row({ paid_at: "2026-10-27T11:00:00Z" })))).toBe(true);
    expect(isPaid(orderFromRow(row()))).toBe(false);
    expect(isPaid(null)).toBe(false);
  });
});

describe("pollUntilPaid", () => {
  const clock = () => {
    let t = 0;
    return { now: () => t, sleep: async (ms: number) => void (t += ms) };
  };

  it("asks every 2 s until the webhook has marked the order paid, telling the page each read", async () => {
    sb.replies.push({ data: row(), error: null }, { data: row(), error: null }, { data: row({ status: "paid", paid_at: "2026-10-27T11:00:00Z" }), error: null });
    const seen: (string | undefined)[] = [];
    const out = await pollUntilPaid("o1", { ...clock(), onRead: (o) => seen.push(o?.status) });
    expect(out?.stage).toBe("Printing");
    expect(seen).toEqual(["payment_pending", "payment_pending", "paid"]);
  });

  it("stops after 30 s with the last row it read", async () => {
    for (let i = 0; i < 40; i++) sb.replies.push({ data: row(), error: null });
    const c = clock();
    const out = await pollUntilPaid("o1", c);
    expect(out?.paidAt).toBeNull();
    expect(c.now()).toBeLessThanOrEqual(30000);
    expect(sb.calls.filter((x) => x.method === "maybeSingle").length).toBe(16);
  });

  it("stops at once for an order that left the flow, and when the page closes", async () => {
    sb.replies.push({ data: row({ status: "canceled" }), error: null });
    await expect(pollUntilPaid("o1", clock())).resolves.toMatchObject({ stage: "Canceled" });
    const stop = new AbortController();
    stop.abort();
    await expect(pollUntilPaid("o1", { ...clock(), signal: stop.signal })).resolves.toBeNull();
  });
});
