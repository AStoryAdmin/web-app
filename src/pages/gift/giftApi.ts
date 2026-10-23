/**
 * The gift's calls to the server. create-gift-checkout is called with plain
 * fetch (the buyer needs no account; a signed-in buyer's token is sent so
 * the order is theirs), so a test can stand the function in with a route.
 * The recipient's preview and redeem are database functions
 * (supabase/gift_2026_10_23.sql: gift_preview, redeem_gift).
 */
import { getSupabase } from "../../lib/supabase";
import { PROMO_REFUSALS, arrivalDate, normaliseGiftCode, type GiftForm } from "./giftWords";

const BASE = String(import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const ANON = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "");

export type CheckoutAnswer = { ok: true; checkoutUrl: string } | { ok: false; error: string; field?: string; reason?: string };
export type GiftStatus =
  | { status: "paid"; code: string; recipientName: string; buyerName: string; note: string; firstQuestion: string; deliverOn: string; emailed: boolean }
  | { status: "pending" | "canceled" | "refunded" }
  | { status: "error"; error: string };

const OFFLINE = "That didn’t go through. Check the connection and try again.";

async function token(): Promise<string> {
  try {
    const s = await getSupabase()?.auth.getSession();
    return s?.data.session?.access_token || ANON;
  } catch {
    return ANON;
  }
}

async function call(body: Record<string, unknown>): Promise<{ status: number; data: Record<string, unknown> }> {
  if (!BASE) throw new Error("not configured");
  const res = await fetch(`${BASE}/functions/v1/create-gift-checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${await token()}` },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: res.status, data };
}

export async function startGiftCheckout(f: GiftForm): Promise<CheckoutAnswer> {
  try {
    const { status, data } = await call({
      action: "checkout",
      recipientName: f.recipientName,
      recipientEmail: f.recipientEmail,
      note: f.note,
      firstQuestion: f.firstQuestion,
      deliverOn: arrivalDate(f.arrival, f.otherDay),
      buyerName: f.buyerName,
      buyerEmail: f.buyerEmail,
    });
    if (status === 200 && typeof data.checkoutUrl === "string") return { ok: true, checkoutUrl: data.checkoutUrl };
    if (data.reason === "not_open") return { ok: false, reason: "not_open", error: "The holiday gift opens soon. Nothing was charged." };
    return { ok: false, error: String(data.error || OFFLINE), field: typeof data.field === "string" ? data.field : undefined };
  } catch {
    return { ok: false, error: OFFLINE };
  }
}

export async function giftStatus(sessionId: string): Promise<GiftStatus> {
  try {
    const { status, data } = await call({ action: "status", sessionId });
    if (status !== 200) return { status: "error", error: String(data.error || OFFLINE) };
    return data as GiftStatus;
  } catch {
    return { status: "error", error: OFFLINE };
  }
}

export type GiftPreview = { fromName: string; toName: string; note: string; firstQuestion: string; deliverOn: string; redeemed: boolean };

/** What a code opens, or null when no paid gift has it; throws when the server can't be reached. */
export async function giftPreview(code: string): Promise<GiftPreview | null> {
  const sb = getSupabase();
  if (!sb) throw new Error("not configured");
  const { data, error } = await sb.rpc("gift_preview", { p_code: normaliseGiftCode(code) });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    fromName: row.from_name || "Your family",
    toName: row.to_name || "",
    note: row.note || "",
    firstQuestion: row.first_question || "",
    deliverOn: row.deliver_on || "",
    redeemed: !!row.redeemed,
  };
}

export type RedeemAnswer = { ok: true; already: boolean; endsAt: string; fromName: string } | { ok: false; reason: "not_found" | "already_redeemed" | "signed_out" | "failed"; error: string };

export async function redeemGift(code: string): Promise<RedeemAnswer> {
  const sb = getSupabase();
  if (!sb) return { ok: false, reason: "failed", error: OFFLINE };
  const { data, error } = await sb.rpc("redeem_gift", { p_code: normaliseGiftCode(code) });
  if (error) {
    const m = error.message || "";
    if (/already_redeemed/.test(m)) return { ok: false, reason: "already_redeemed", error: "This gift has been opened on another account. If that wasn’t you, write to contact@astoryapp.com." };
    if (/not_found/.test(m)) return { ok: false, reason: "not_found", error: "That code doesn’t open a gift. Check it against the card." };
    if (/sign in/.test(m)) return { ok: false, reason: "signed_out", error: "Sign in first, then open the gift." };
    return { ok: false, reason: "failed", error: OFFLINE };
  }
  const d = (data || {}) as { already?: boolean; ends_at?: string; from_name?: string };
  return { ok: true, already: !!d.already, endsAt: d.ends_at || "", fromName: d.from_name || "Your family" };
}

export type PromoPreview = { valid: boolean; reason: string | null; months: number };

/** Whether a promo code can be used, before an account exists; throws when the server can't be reached. */
export async function promoPreview(code: string): Promise<PromoPreview> {
  const sb = getSupabase();
  if (!sb) throw new Error("not configured");
  const { data, error } = await sb.rpc("promo_preview", { p_code: normaliseGiftCode(code) });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return { valid: !!row?.valid, reason: row?.reason || (row?.valid ? null : "not_found"), months: Number(row?.months) || 0 };
}

export type PromoAnswer = { ok: true; endsAt: string; months: number } | { ok: false; reason: string; error: string };

export async function redeemPromo(code: string): Promise<PromoAnswer> {
  const sb = getSupabase();
  if (!sb) return { ok: false, reason: "failed", error: OFFLINE };
  const { data, error } = await sb.rpc("redeem_promo", { p_code: normaliseGiftCode(code) });
  if (error) {
    const m = error.message || "";
    for (const k of Object.keys(PROMO_REFUSALS)) if (m.includes(k)) return { ok: false, reason: k, error: PROMO_REFUSALS[k] };
    if (/sign in/.test(m)) return { ok: false, reason: "signed_out", error: "Sign in first, then use the code." };
    return { ok: false, reason: "failed", error: OFFLINE };
  }
  const d = (data || {}) as { ends_at?: string; months?: number };
  return { ok: true, endsAt: d.ends_at || "", months: Number(d.months) || 1 };
}
