import { beforeEach, describe, expect, it, vi } from "vitest";

const sb = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("../lib/supabase", () => ({ supabase: () => ({ functions: { invoke: sb.invoke } }) }));

import {
  AdminError,
  OVERRIDE_TARGETS,
  adminMe,
  codeOf,
  getAdminOrder,
  listAdminOrders,
  noteOk,
  overrideAdminOrder,
  readDetail,
  refundAdminOrder,
  retryAdminOrder,
  safeHttps,
} from "./adminOrders";

beforeEach(() => {
  sb.invoke.mockReset();
});

const httpError = (status: number, body: unknown) => ({ name: "FunctionsHttpError", message: "non-2xx", context: new Response(JSON.stringify(body), { status }) });
const ORDER = "0b7a3f5e-1c2d-4e5f-8a9b-0c1d2e3f4a5b";

describe("codeOf", () => {
  it("reads the server's code from the error's body", async () => {
    expect(await codeOf(httpError(409, { error: "nothing_charged" }))).toEqual({ code: "nothing_charged", status: 409 });
  });
  it("reads a 403 with no body as not_staff, and a dropped connection as network", async () => {
    expect(await codeOf({ name: "FunctionsHttpError", context: new Response("nope", { status: 403 }) })).toEqual({ code: "not_staff", status: 403 });
    expect(await codeOf({ name: "FunctionsFetchError" })).toEqual({ code: "network", status: null });
    expect(await codeOf(null)).toEqual({ code: "network", status: null });
  });
});

describe("adminMe", () => {
  it("is true only when the server says staff: true", async () => {
    sb.invoke.mockResolvedValueOnce({ data: { staff: true }, error: null });
    expect(await adminMe()).toBe(true);
    expect(sb.invoke).toHaveBeenCalledWith("admin-orders", { body: { action: "me" } });
    sb.invoke.mockResolvedValueOnce({ data: { staff: "yes" }, error: null });
    expect(await adminMe()).toBe(false);
  });
  it("throws not_staff on a 403", async () => {
    sb.invoke.mockResolvedValueOnce({ data: null, error: httpError(403, { error: "not_staff" }) });
    const e = await adminMe().catch((x) => x);
    expect(e).toBeInstanceOf(AdminError);
    expect(e.code).toBe("not_staff");
    expect(e.message).toBe("This page isn’t available.");
  });
  it("throws network when invoke itself throws", async () => {
    sb.invoke.mockRejectedValueOnce(new Error("offline"));
    expect((await adminMe().catch((x) => x)).code).toBe("network");
  });
});

describe("listAdminOrders", () => {
  it("sends the filter and the cursor, and drops rows it can't read", async () => {
    sb.invoke.mockResolvedValueOnce({
      data: {
        orders: [
          { id: "o1", createdAt: "2026-11-01T10:00:00.000Z", status: "paid", totalCents: 8799, quantity: 1, customerEmail: "a@example.com", paidAt: null, submitAttempts: 0, nextAttemptAt: null },
          { status: "paid" },
          "junk",
        ],
        next: "2026-11-01T10:00:00.000Z",
      },
      error: null,
    });
    const r = await listAdminOrders({ status: "needs_look", before: "2026-11-02T00:00:00.000Z" });
    expect(sb.invoke).toHaveBeenCalledWith("admin-orders", { body: { action: "list", status: "needs_look", before: "2026-11-02T00:00:00.000Z" } });
    expect(r.orders).toHaveLength(1);
    expect(r.orders[0]).toMatchObject({ id: "o1", totalCents: 8799, submitAttempts: 0 });
    expect(r.next).toBe("2026-11-01T10:00:00.000Z");
  });
  it("sends no status for All", async () => {
    sb.invoke.mockResolvedValueOnce({ data: { orders: [], next: null }, error: null });
    await listAdminOrders();
    expect(sb.invoke).toHaveBeenCalledWith("admin-orders", { body: { action: "list" } });
  });
});

describe("readDetail", () => {
  it("reads the order, the shipments, the events and the issues, and keeps only https links", () => {
    const d = readDetail({
      order: { id: ORDER, status: "issue_reported", totalCents: 8799, charged: true, subtotalCents: 7900, shippingCents: 899 },
      shipments: [{ id: "s1", name: "Rose", line1: "1 Elm", city: "San Jose", state: "CA", postalCode: "95112", status: "shipped", trackingUrl: "javascript:alert(1)", providerOrderId: "ord_1" }],
      events: [{ id: 7, at: "2026-11-01T10:00:00.000Z", actor: "stripe", kind: "status", fromStatus: "payment_pending", toStatus: "paid", data: { a: 1 } }],
      issues: [{ id: "i1", reason: "damaged", description: "Torn", photoUrl: "https://signed.example/x.jpg" }],
    });
    expect(d.order.charged).toBe(true);
    expect(d.order.taxCents).toBe(0);
    expect(d.shipments[0].trackingUrl).toBeNull();
    expect(d.shipments[0].providerOrderId).toBe("ord_1");
    expect(d.events[0]).toMatchObject({ id: "7", fromStatus: "payment_pending", toStatus: "paid", data: { a: 1 } });
    expect(d.issues[0].photoUrl).toBe("https://signed.example/x.jpg");
  });
  it("refuses an answer with no order", () => {
    expect(() => readDetail({})).toThrow(AdminError);
  });
  it("safeHttps", () => {
    expect(safeHttps("https://a.example/x")).toBe("https://a.example/x");
    expect(safeHttps("http://a.example/x")).toBeNull();
    expect(safeHttps(3)).toBeNull();
  });
});

describe("the actions", () => {
  it("detail asks for the order", async () => {
    sb.invoke.mockResolvedValueOnce({ data: { order: { id: ORDER, status: "paid" } }, error: null });
    const d = await getAdminOrder(ORDER);
    expect(d.order.id).toBe(ORDER);
    expect(sb.invoke).toHaveBeenCalledWith("admin-orders", { body: { action: "detail", orderId: ORDER } });
  });
  it("retry sends the note only when there is one, and returns the server's words", async () => {
    sb.invoke.mockResolvedValueOnce({ data: { ok: true, words: "Ordering is closed." }, error: null });
    expect(await retryAdminOrder(ORDER, "  ")).toEqual({ words: "Ordering is closed." });
    expect(sb.invoke).toHaveBeenCalledWith("admin-orders", { body: { action: "retry", orderId: ORDER } });
  });
  it("override sends the target and the trimmed note", async () => {
    sb.invoke.mockResolvedValueOnce({ data: { changed: true, status: "shipped" }, error: null });
    expect(await overrideAdminOrder(ORDER, "shipped", "  printer emailed ")).toEqual({ changed: true, status: "shipped" });
    expect(sb.invoke).toHaveBeenCalledWith("admin-orders", { body: { action: "override", orderId: ORDER, to: "shipped", note: "printer emailed" } });
  });
  it("refund sends the note, and a refusal carries its code", async () => {
    sb.invoke.mockResolvedValueOnce({ data: { refunded: true, changed: true, status: "refunded" }, error: null });
    expect(await refundAdminOrder(ORDER, "family asked")).toEqual({ changed: true, status: "refunded", alreadyRefunded: false });
    expect(sb.invoke).toHaveBeenCalledWith("admin-orders", { body: { action: "refund", orderId: ORDER, note: "family asked" } });
    sb.invoke.mockResolvedValueOnce({ data: null, error: httpError(502, { error: "refund_failed" }) });
    const e = await refundAdminOrder(ORDER, "family asked").catch((x) => x);
    expect(e.code).toBe("refund_failed");
    expect(e.status).toBe(502);
  });
  it("a note needs 3 characters once trimmed; the targets never include paid", () => {
    expect(noteOk(" ab ")).toBe(false);
    expect(noteOk("abc")).toBe(true);
    expect(OVERRIDE_TARGETS).not.toContain("paid");
  });
});
