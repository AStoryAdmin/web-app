/**
 * The holiday gift's words and small rules, apart from the pages so vitest
 * reads them (gift.test.ts). The owner's ruling (23 Oct 2026): $99 once, one
 * year of A Story that doesn't renew, a Classic Hardcover credit, a
 * printable card, a delivery date. Sold here on the web through Stripe,
 * never in the app's store. The server checks everything again
 * (supabase/functions/_shared/giftOrder.js readGiftForm); these rules only
 * say what is wrong before a round trip.
 */

export const GIFT_PRICE = "$99";

/** What the $99 is, in plain words, in the order the page lists it. */
export const GIFT_INCLUDES: { head: string; line: string }[] = [
  { head: "A year of A Story", line: "Questions about a life, answered in their own words and voice. It doesn’t renew: nothing is charged again." },
  { head: "A Classic Hardcover", line: "The book their answers make, printed and posted when the stories are in." },
  { head: "A card to give", line: "Print it or send it. The code on it opens the gift." },
  { head: "The day it arrives", line: "Today, Christmas morning, or a day you choose. We email it that morning." },
];

/** First questions to offer, as the app's Give page does. */
export const QUESTION_IDEAS = [
  "What was the house you grew up in like?",
  "How did you two meet?",
  "What did a holiday look like when you were small?",
];

export type Arrival = "today" | "christmas" | "day";

const pad = (n: number) => String(n).padStart(2, "0");
/** "2026-11-20" for a local date. */
export function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** The choices for when it arrives; Christmas only while it's still ahead (or today). */
export function arrivalChoices(now = new Date()): { key: Arrival; label: string; date: string | null }[] {
  const xmas = `${now.getFullYear()}-12-25`;
  const out: { key: Arrival; label: string; date: string | null }[] = [{ key: "today", label: "As soon as it’s paid", date: isoLocal(now) }];
  if (isoLocal(now) <= xmas) out.push({ key: "christmas", label: "Christmas morning", date: xmas });
  out.push({ key: "day", label: "Another day", date: null });
  return out;
}

/** The day it arrives, as the server takes it, or "" when "Another day" has no day yet. */
export function arrivalDate(choice: Arrival, other: string, now = new Date()): string {
  if (choice === "day") return /^\d{4}-\d{2}-\d{2}$/.test(other) ? other : "";
  return arrivalChoices(now).find((c) => c.key === choice)?.date || isoLocal(now);
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** "25 December" for "2026-12-25". */
export function dayMonth(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]}` : "";
}

const CODE_RE = /^[A-HJKMNP-Z2-9]{8}$/;
export const normaliseGiftCode = (raw: string) => String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
export const looksLikeGiftCode = (raw: string) => CODE_RE.test(normaliseGiftCode(raw));
/** "K7M2 QX9P". */
export function spacedGiftCode(raw: string): string {
  const c = normaliseGiftCode(raw);
  return CODE_RE.test(c) ? `${c.slice(0, 4)} ${c.slice(4)}` : c;
}

export const firstName = (s: string) => String(s || "").trim().split(/\s+/)[0] || "";

export type GiftForm = {
  recipientName: string;
  recipientEmail: string;
  note: string;
  firstQuestion: string;
  arrival: Arrival;
  otherDay: string;
  buyerName: string;
  buyerEmail: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** The first thing wrong with the form, said for the field, or null. */
export function checkGiftForm(f: GiftForm, now = new Date()): { field: keyof GiftForm; error: string } | null {
  if (!f.recipientName.trim()) return { field: "recipientName", error: "Who is it for? A first name is enough." };
  if (f.recipientEmail.trim() && !EMAIL_RE.test(f.recipientEmail.trim())) {
    return { field: "recipientEmail", error: "That doesn’t look like an email. Leave it empty to hand the card over yourself." };
  }
  if (f.arrival === "day") {
    const d = arrivalDate("day", f.otherDay, now);
    if (!d) return { field: "otherDay", error: "Choose the day it arrives." };
    if (d < isoLocal(now)) return { field: "otherDay", error: "Choose today or a day ahead." };
  }
  if (!f.buyerName.trim()) return { field: "buyerName", error: "Your name goes on the card." };
  if (!EMAIL_RE.test(f.buyerEmail.trim())) return { field: "buyerEmail", error: "Your email, for the receipt and the card." };
  return null;
}

/** "Hien’s", or "their" before a name is typed. */
export const whose = (name: string) => (firstName(name) ? `${firstName(name)}’s` : "their");

/** What happens next, on the thanks page, for the card's recipient. */
export function nextLines({ recipientName, deliverOn, emailed }: { recipientName: string; deliverOn: string; emailed: boolean }): string[] {
  const name = firstName(recipientName) || "They";
  const day = dayMonth(deliverOn);
  return [
    emailed
      ? `We email ${name} on the morning of ${day}, with your note and the code.`
      : `Print the card, or send a photo of it, and give it to ${name} on ${day}.`,
    `${name} opens the gift with the code, makes an account, and the first question waits there.`,
    "The year starts the day it’s opened, and ends on its own. Nothing renews.",
    "When the stories are in, the hardcover is printed and posted.",
  ];
}

/* Promotion codes (FB-531): "Ilovemyfamily2026", a free month. On the web they are ours to redeem
   (redeem_promo); the iPhone app sends them to Apple's offer-code sheet instead. */
const PROMO_RE = /^[A-Z0-9]{4,40}$/;
/** "gift" for an 8-character gift code, "promo" for any other code, "bad" otherwise. */
export function codeKind(raw: string): "gift" | "promo" | "bad" {
  const c = normaliseGiftCode(raw);
  if (CODE_RE.test(c)) return "gift";
  return PROMO_RE.test(c) ? "promo" : "bad";
}

const LONG_MONTHS = MONTHS;
/** "23 November 2026" from a timestamp. */
export function longDay(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : `${d.getUTCDate()} ${LONG_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export const PROMO_LINES = {
  kicker: "Try A Story",
  title: "A free month of A Story",
  lead: "A Story asks about a life, one question at a time, and keeps what is said in your own words. No card needed. It ends on its own, with a note from us a week before.",
};

/** What a promo answer says when it can't be used. */
export const PROMO_REFUSALS: Record<string, string> = {
  not_found: "That code doesn’t open anything. Check it against the message.",
  expired: "That code has ended. Everything free stays open.",
  used_up: "That code has been used as many times as it can be. Everything free stays open.",
  already_used: "This account has had its free month already.",
  already_paid: "You’re on a plan already, so there’s nothing to add.",
};
