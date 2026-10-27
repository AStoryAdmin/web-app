import { beforeEach, describe, expect, it, vi } from "vitest";

const sb = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("./supabase", () => ({ supabase: () => ({ functions: { invoke: sb.invoke } }) }));

import { APPROVE_CHECKBOX_TEXT, BOOK_VERSION_MESSAGES, BookVersionError, approveVersion, prepareVersion, reasonOf } from "./bookVersion";

const fetchSpy = vi.fn();
beforeEach(() => {
  sb.invoke.mockReset();
  fetchSpy.mockReset();
  vi.stubGlobal("fetch", fetchSpy);
});

const prepared = {
  versionId: "v-1",
  version: 2,
  printProfile: "square-8x8-layflat",
  uploadPaths: ["v-1/interior.pdf", "v-1/cover.pdf"],
  listenKey: "k-abc",
  minPages: 24,
  maxPages: 300,
};

// supabase-js's FunctionsHttpError: the response rides on `context`
const httpError = (status: number, body: unknown) => ({ name: "FunctionsHttpError", message: "non-2xx", context: new Response(JSON.stringify(body), { status }) });

describe("prepareVersion", () => {
  it("asks book-version to prepare the story and hands back the server's profile and paths", async () => {
    sb.invoke.mockResolvedValue({ data: prepared, error: null });
    await expect(prepareVersion("s-1")).resolves.toEqual(prepared);
    expect(sb.invoke).toHaveBeenCalledWith("book-version", { body: { action: "prepare", storyId: "s-1" } });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sends only the story id: the snapshot is the server's, built from the database", async () => {
    sb.invoke.mockResolvedValue({ data: prepared, error: null });
    await prepareVersion("s-1");
    expect(Object.keys(sb.invoke.mock.calls[0][1].body).sort()).toEqual(["action", "storyId"]);
  });

  it("keeps a missing listen key as null", async () => {
    sb.invoke.mockResolvedValue({ data: { ...prepared, listenKey: null }, error: null });
    await expect(prepareVersion("s-1")).resolves.toMatchObject({ listenKey: null });
  });

  it("stops rather than guess when the answer is missing a part", async () => {
    for (const broken of [{ ...prepared, printProfile: "" }, { ...prepared, uploadPaths: ["v-1/interior.pdf"] }, { ...prepared, versionId: undefined }, { ...prepared, maxPages: "300" }, null]) {
      sb.invoke.mockResolvedValue({ data: broken, error: null });
      await expect(prepareVersion("s-1")).rejects.toMatchObject({ reason: "unknown", message: BOOK_VERSION_MESSAGES.unknown });
    }
  });

  it("turns the server's codes into plain sentences, using the server's own words when it sends them", async () => {
    sb.invoke.mockResolvedValue({ data: null, error: httpError(403, { error: "not_yours", words: "Only the family looking after this story can do that." }) });
    await expect(prepareVersion("s-1")).rejects.toMatchObject({ reason: "not_allowed", message: "Only the family looking after this story can do that." });
    sb.invoke.mockResolvedValue({ data: null, error: httpError(503, { error: "no_product" }) });
    await expect(prepareVersion("s-1")).rejects.toMatchObject({ reason: "unavailable", message: BOOK_VERSION_MESSAGES.unavailable });
    sb.invoke.mockResolvedValue({ data: null, error: httpError(409, { error: "busy", words: "Your book is being prepared in another window. Please try again in a moment." }) });
    await expect(prepareVersion("s-1")).rejects.toMatchObject({ reason: "busy" });
  });

  it("never shows a code or a developer's message, and ignores a code shaped like an object key", async () => {
    sb.invoke.mockResolvedValue({ data: null, error: httpError(500, { error: "read_failed", words: "relation_x does not exist" }) });
    await expect(prepareVersion("s-1")).rejects.toMatchObject({ reason: "unknown", message: BOOK_VERSION_MESSAGES.unknown });
    sb.invoke.mockResolvedValue({ data: null, error: httpError(400, { error: "toString" }) });
    await expect(prepareVersion("s-1")).rejects.toMatchObject({ reason: "unknown" });
  });

  it("says the connection failed when the function can't be reached", async () => {
    sb.invoke.mockResolvedValue({ data: null, error: { name: "FunctionsFetchError", message: "Failed to send a request" } });
    await expect(prepareVersion("s-1")).rejects.toMatchObject({ reason: "network" });
    sb.invoke.mockRejectedValue(new TypeError("fetch failed"));
    await expect(prepareVersion("s-1")).rejects.toBeInstanceOf(BookVersionError);
  });
});

describe("approveVersion", () => {
  const ok = { versionId: "v-1", pageCount: 48, preflight: { ok: true, warnings: [] }, confirmed: true };

  it("sends the tick, the page count and what preflight found", async () => {
    sb.invoke.mockResolvedValue({ data: { versionId: "v-1", approvedAt: "2026-10-28T10:00:00.000Z" }, error: null });
    await expect(approveVersion(ok)).resolves.toEqual({ versionId: "v-1", approvedAt: "2026-10-28T10:00:00.000Z" });
    expect(sb.invoke).toHaveBeenCalledWith("book-version", { body: { action: "approve", versionId: "v-1", pageCount: 48, preflight: { ok: true, warnings: [] }, confirmed: true } });
  });

  it("refuses without asking the server when the box isn't ticked", async () => {
    for (const confirmed of [false, "true", 1, undefined]) {
      await expect(approveVersion({ ...ok, confirmed: confirmed as boolean })).rejects.toMatchObject({ reason: "not_confirmed", message: "Please tick the box to say you’ve looked through the book." });
    }
    expect(sb.invoke).not.toHaveBeenCalled();
  });

  it("refuses a page count that isn't one", async () => {
    for (const pageCount of [0, -2, 24.5, Number.NaN]) {
      await expect(approveVersion({ ...ok, pageCount })).rejects.toMatchObject({ reason: "bad_page_count" });
    }
    expect(sb.invoke).not.toHaveBeenCalled();
  });

  it("explains a version already locked, a missing file and a count out of range", async () => {
    // the server's shape (book-version index.ts): { error: <code>, words }
    sb.invoke.mockResolvedValue({ data: null, error: httpError(409, { error: "already_approved" }) });
    await expect(approveVersion(ok)).rejects.toMatchObject({ reason: "already_approved", message: BOOK_VERSION_MESSAGES.already_approved });
    sb.invoke.mockResolvedValue({ data: null, error: httpError(400, { error: "missing_cover", words: "The cover of your book didn't finish saving. Please go back and try again." }) });
    await expect(approveVersion(ok)).rejects.toMatchObject({ reason: "missing_file", message: "The cover of your book didn't finish saving. Please go back and try again." });
    sb.invoke.mockResolvedValue({ data: null, error: httpError(400, { error: "too_many_pages", words: "This book has 320 pages, and a printed book can have up to 300. Please write to us and we'll help." }) });
    await expect(approveVersion(ok)).rejects.toMatchObject({ reason: "bad_page_count", message: expect.stringContaining("320 pages") });
    // a code this page doesn't know falls back to the status, then to a plain "try again"
    sb.invoke.mockResolvedValue({ data: null, error: httpError(404, { error: "something_new" }) });
    await expect(approveVersion(ok)).rejects.toMatchObject({ reason: "not_found" });
    sb.invoke.mockResolvedValue({ data: null, error: httpError(500, "not json") });
    await expect(approveVersion(ok)).rejects.toMatchObject({ reason: "unknown" });
  });

  it("reads an ok: false answer the same way", async () => {
    sb.invoke.mockResolvedValue({ data: { ok: false, error: "locked" }, error: null });
    await expect(approveVersion(ok)).rejects.toMatchObject({ reason: "already_approved" });
  });
});

describe("the words", () => {
  it("has the checkbox's exact sentence", () => {
    expect(APPROVE_CHECKBOX_TEXT).toBe("I've reviewed my book and it's ready to print.");
  });

  it("never uses a printer's word, a code or a status number", () => {
    for (const m of Object.values(BOOK_VERSION_MESSAGES)) {
      expect(m).not.toMatch(/dpi|ppi|bleed|preflight|prodigi|presto|lulu|error|\d{3}|_/i);
      expect(m).toMatch(/^[A-Z].*\.$/);
    }
  });

  it("reasonOf without a response is a connection problem", async () => {
    await expect(reasonOf({ message: "x" })).resolves.toEqual({ reason: "network", words: null });
  });
});
