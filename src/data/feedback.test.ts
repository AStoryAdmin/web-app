// "Write to us": the feedback row, as the phone inserts it.
import { beforeEach, describe, expect, it, vi } from "vitest";

const inserts: { table: string; row: unknown }[] = [];
let answer: () => Promise<{ error: { code?: string; message: string } | null }> = () => Promise.resolve({ error: null });

vi.mock("../lib/supabase", () => ({
  getSupabase: () => ({
    from: (table: string) => ({
      insert: (row: unknown) => {
        inserts.push({ table, row });
        return answer();
      },
    }),
  }),
}));

import { feedbackRow, submitFeedback } from "./feedback";

beforeEach(() => {
  inserts.length = 0;
  answer = () => Promise.resolve({ error: null });
});

describe("feedbackRow", () => {
  it("trims the message and the address, and keeps the kind", () => {
    expect(feedbackRow({ userId: "u1", type: "bug", message: "  The book won’t open.  ", contactEmail: " sam@example.com " })).toEqual({
      user_id: "u1",
      type: "bug",
      message: "The book won’t open.",
      contact_email: "sam@example.com",
    });
  });
  it("is \"other\" with no kind, and answers to the account's email when none is typed", () => {
    expect(feedbackRow({ userId: "u1", message: "Hello", contactEmail: "  ", accountEmail: "me@example.com" })).toEqual({
      user_id: "u1",
      type: "other",
      message: "Hello",
      contact_email: "me@example.com",
    });
  });
  it("leaves the address empty when there is none at all", () => {
    expect(feedbackRow({ userId: "u1", type: "suggestion", message: "An idea" }).contact_email).toBe("");
  });
});

describe("submitFeedback", () => {
  it("inserts one row into feedback", async () => {
    await expect(submitFeedback({ userId: "u1", type: "suggestion", message: "More questions about school", accountEmail: "me@example.com" })).resolves.toEqual({ ok: true });
    expect(inserts).toEqual([{ table: "feedback", row: { user_id: "u1", type: "suggestion", message: "More questions about school", contact_email: "me@example.com" } }]);
  });
  it("sends nothing for an empty message, or with no account", async () => {
    await expect(submitFeedback({ userId: "u1", message: "   " })).resolves.toEqual({ error: "empty" });
    await expect(submitFeedback({ userId: "", message: "Hi" })).resolves.toEqual({ error: "signed_out" });
    expect(inserts).toHaveLength(0);
  });
  it("tells a dropped connection from a refusal, and never throws", async () => {
    answer = () => Promise.resolve({ error: { code: "PGRST001", message: "connection" } });
    await expect(submitFeedback({ userId: "u1", message: "Hi" })).resolves.toEqual({ error: "offline" });
    answer = () => Promise.resolve({ error: { code: "42501", message: "row-level security" } });
    await expect(submitFeedback({ userId: "u1", message: "Hi" })).resolves.toEqual({ error: "failed" });
    answer = () => Promise.reject(new TypeError("Failed to fetch"));
    await expect(submitFeedback({ userId: "u1", message: "Hi" })).resolves.toEqual({ error: "offline" });
  });
});
