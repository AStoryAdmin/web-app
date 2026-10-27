/**
 * "Write to us" (phone data/feedback.js, FeedbackScreen): one row in the
 * `feedback` table, exactly as the phone writes it. The table is insert-only
 * from the apps and its policy (phone-app/supabase/schema.sql
 * "feedback_insert_own") takes a signed-in person's own row only, so a
 * message needs an account; anyone else has the support address.
 *
 * Also for the "why are you leaving?" lines on deleting an account
 * (type "account_deletion") and cancelling a plan ("subscription_cancellation").
 *
 * Nothing here throws; the row shape is pure and tested.
 */
import { getSupabase } from "../lib/supabase";
import { classifySaveError } from "../app-core/lib/saveErrors.js";

/** The kinds the phone sends. Help offers the first three. */
export type FeedbackType = "bug" | "suggestion" | "other" | "account_deletion" | "subscription_cancellation";

export const FEEDBACK_TYPES: { key: Extract<FeedbackType, "bug" | "suggestion" | "other">; label: string }[] = [
  { key: "bug", label: "Something’s wrong" },
  { key: "suggestion", label: "An idea" },
  { key: "other", label: "Something else" },
];

/** The support address, for anyone who would rather use their own email (phone lib/links.js). */
export const SUPPORT_EMAIL = "contact@astoryapp.com";

export type FeedbackInput = {
  userId: string;
  type?: FeedbackType | null;
  message: string;
  /** The address to answer; the account's own when this is empty (as the phone does). */
  contactEmail?: string | null;
  accountEmail?: string | null;
};

export type FeedbackFailure = "empty" | "signed_out" | "offline" | "failed";

/** The row as the phone inserts it: trimmed, "other" when no kind is given, the account's email when none is typed. */
export function feedbackRow({ userId, type, message, contactEmail, accountEmail }: FeedbackInput) {
  return {
    user_id: userId,
    type: type || "other",
    message: (message || "").trim(),
    contact_email: ((contactEmail || "").trim() || (accountEmail || "").trim()),
  };
}

/** Send one message. `{ ok: true }`, or why it did not go. */
export async function submitFeedback(input: FeedbackInput): Promise<{ ok: true } | { error: FeedbackFailure }> {
  if (!(input.message || "").trim()) return { error: "empty" };
  if (!input.userId) return { error: "signed_out" };
  const sb = getSupabase();
  if (!sb) return { error: "offline" };
  try {
    const { error } = await sb.from("feedback").insert(feedbackRow(input));
    if (!error) return { ok: true };
    return { error: classifySaveError(error) === "offline" ? "offline" : "failed" };
  } catch (err) {
    return { error: classifySaveError(err) === "offline" ? "offline" : "failed" };
  }
}
