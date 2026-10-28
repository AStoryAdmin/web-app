import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sb = vi.hoisted(() => {
  const upload = vi.fn();
  const from = vi.fn(() => ({ upload }));
  return { invoke: vi.fn(), upload, from };
});
vi.mock("../lib/supabase", () => ({ supabase: () => ({ functions: { invoke: sb.invoke }, storage: { from: sb.from } }) }));

import { ISSUE_REASONS, ORDER_HELP_MESSAGES, OrderHelpError, cancelOrder, helpErrorOf, reportProblem, uploadIssuePhoto } from "./orderHelp";

const ORDER = "0a0a0a0a-0000-4000-8000-000000000001";
const httpError = (status: number, body: unknown) => ({ name: "FunctionsHttpError", message: "non-2xx", context: new Response(JSON.stringify(body), { status }) });
const BANNED = /prodigi|\bdpi\b|bleed|preflight|\bsku\b|free/i;

const fetchSpy = vi.fn();
beforeEach(() => {
  sb.invoke.mockReset();
  sb.upload.mockReset();
  sb.from.mockClear();
  fetchSpy.mockReset();
  vi.stubGlobal("fetch", fetchSpy);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("cancelOrder", () => {
  it("asks book-order-help to cancel, and returns the server's status and words", async () => {
    const words = "Your order is canceled. We've refunded $86.99. Banks usually take 5 to 10 business days to show it.";
    sb.invoke.mockResolvedValue({ data: { ok: true, status: "refunded", words }, error: null });
    await expect(cancelOrder(ORDER)).resolves.toEqual({ status: "refunded", words });
    expect(sb.invoke).toHaveBeenCalledWith("book-order-help", { body: { action: "cancel", orderId: ORDER } });
  });

  it("reads a refusal's words: too late, refund failed", async () => {
    const late = "Your book has already gone to print, so it can't be canceled here. Write to us at daniel@astoryapp.com and we'll help.";
    sb.invoke.mockResolvedValue({ data: null, error: httpError(409, { error: "too_late", words: late }) });
    await expect(cancelOrder(ORDER)).rejects.toMatchObject({ name: "OrderHelpError", code: "too_late", message: late });
    sb.invoke.mockResolvedValue({ data: null, error: httpError(502, { error: "refund_failed" }) });
    await expect(cancelOrder(ORDER)).rejects.toMatchObject({ code: "refund_failed", message: ORDER_HELP_MESSAGES.refund_failed });
  });

  it("never shows a code as words, and a dropped connection says so", async () => {
    sb.invoke.mockResolvedValue({ data: null, error: httpError(500, { error: "help_failed", words: "help_failed" }) });
    await expect(cancelOrder(ORDER)).rejects.toMatchObject({ code: "help_failed", message: ORDER_HELP_MESSAGES.unknown });
    sb.invoke.mockResolvedValue({ data: null, error: { name: "FunctionsFetchError" } });
    await expect(cancelOrder(ORDER)).rejects.toMatchObject({ code: "network", message: ORDER_HELP_MESSAGES.network });
    sb.invoke.mockRejectedValue(new Error("offline"));
    await expect(cancelOrder(ORDER)).rejects.toMatchObject({ code: "network" });
  });

  it("falls back to the status when the body isn't JSON", async () => {
    await expect(helpErrorOf({ name: "FunctionsHttpError", context: new Response("oops", { status: 404 }) })).resolves.toMatchObject({ code: "not_found", message: ORDER_HELP_MESSAGES.not_found });
  });
});

describe("reportProblem", () => {
  it("sends the reason, the trimmed description and the photo's path", async () => {
    const words = "Thank you for telling us. We'll write to you by email.";
    sb.invoke.mockResolvedValue({ data: { ok: true, status: "issue_reported", words }, error: null });
    const photoPath = `${ORDER}/3c3c3c3c-1234-4abc-9def-0123456789ab.jpg`;
    await expect(reportProblem({ orderId: ORDER, reason: "damaged", description: "  Bent corner. ", photoPath })).resolves.toEqual({ status: "issue_reported", words });
    expect(sb.invoke.mock.calls[0][1].body).toEqual({ action: "report", orderId: ORDER, reason: "damaged", description: "Bent corner.", photoPath });
  });

  it("leaves the photo out when there is none", async () => {
    sb.invoke.mockResolvedValue({ data: { ok: true, status: "issue_reported", words: "Thank you for telling us. We'll write to you by email." }, error: null });
    await reportProblem({ orderId: ORDER, reason: "not_arrived", description: "Nothing yet.", photoPath: null });
    expect(sb.invoke.mock.calls[0][1].body).not.toHaveProperty("photoPath");
  });

  it("asks for a description before asking the server", async () => {
    await expect(reportProblem({ orderId: ORDER, reason: "other", description: "   " })).rejects.toMatchObject({ code: "needs_description", message: "Please tell us a little about what happened." });
    expect(sb.invoke).not.toHaveBeenCalled();
  });

  it("reads the server's refusals in its own words", async () => {
    sb.invoke.mockResolvedValue({ data: null, error: httpError(409, { error: "not_yet", words: "You can report a problem once your book has shipped." }) });
    await expect(reportProblem({ orderId: ORDER, reason: "other", description: "x" })).rejects.toMatchObject({ code: "not_yet", message: "You can report a problem once your book has shipped." });
    sb.invoke.mockResolvedValue({ data: null, error: httpError(429, {}) });
    await expect(reportProblem({ orderId: ORDER, reason: "other", description: "x" })).rejects.toMatchObject({ code: "too_many", message: ORDER_HELP_MESSAGES.too_many });
    sb.invoke.mockResolvedValue({ data: null, error: httpError(400, { error: "bad_photo" }) });
    await expect(reportProblem({ orderId: ORDER, reason: "other", description: "x" })).rejects.toMatchObject({ code: "bad_photo", message: ORDER_HELP_MESSAGES.bad_photo });
  });
});

describe("uploadIssuePhoto", () => {
  it("a file that won't decode (HEIC in Chrome) asks for a different one, and uploads nothing", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn(() => Promise.reject(new DOMException("bad", "InvalidStateError"))));
    const err = await uploadIssuePhoto(ORDER, new Blob(["x"], { type: "image/heic" })).catch((e) => e);
    expect(err).toBeInstanceOf(OrderHelpError);
    expect(err).toMatchObject({ code: "unreadable_photo", message: "That photo couldn’t be read. Please choose a different one." });
    expect(sb.upload).not.toHaveBeenCalled();
  });

  it("shrinks to at most 2000 px, encodes a JPEG at 0.85 and uploads it to order-issues/<orderId>/<uuid>.jpg, never over another", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn(() => Promise.resolve({ width: 4000, height: 3000, close: vi.fn() })));
    const drawn: number[][] = [];
    const ctx = { fillStyle: "", fillRect: vi.fn(), drawImage: vi.fn((_b: unknown, ...a: number[]) => drawn.push(a)) };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (this: HTMLCanvasElement, cb: BlobCallback) {
      cb(new Blob(["jpeg"], { type: "image/jpeg" }));
    });
    sb.upload.mockResolvedValue({ data: { path: "x" }, error: null });

    const path = await uploadIssuePhoto(ORDER, new Blob(["png"], { type: "image/png" }));
    expect(path).toMatch(new RegExp(`^${ORDER}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.jpg$`));
    expect(drawn[0]).toEqual([0, 0, 2000, 1500]);
    expect(toBlob.mock.calls[0].slice(1)).toEqual(["image/jpeg", 0.85]);
    expect(sb.from).toHaveBeenCalledWith("order-issues");
    expect(sb.upload).toHaveBeenCalledWith(path, expect.any(Blob), { contentType: "image/jpeg", upsert: false });
  });

  it("an upload that fails says the photo didn't upload", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn(() => Promise.resolve({ width: 10, height: 10 })));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ fillRect: vi.fn(), drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((cb: BlobCallback) => cb(new Blob(["j"], { type: "image/jpeg" })));
    sb.upload.mockResolvedValue({ data: null, error: { message: "new row violates row-level security policy" } });
    await expect(uploadIssuePhoto(ORDER, new Blob(["p"]))).rejects.toMatchObject({ code: "bad_photo", message: ORDER_HELP_MESSAGES.bad_photo });
  });
});

describe("the words", () => {
  it("are plain: no printer, no 'free', no code", () => {
    for (const w of [...Object.values(ORDER_HELP_MESSAGES), ...ISSUE_REASONS.map((r) => r.label)]) {
      expect(w).not.toMatch(BANNED);
      expect(w).not.toMatch(/_/);
    }
    expect(ISSUE_REASONS.map((r) => r.label)).toEqual(["It hasn’t arrived", "It arrived damaged", "Something in the book is wrong", "Something else"]);
  });
});
