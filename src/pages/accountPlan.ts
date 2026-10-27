/**
 * What the account page says about the plan, worked out apart from the page so
 * it can be tested: what it is, where it came from (planSource in lib/plan),
 * how to change or stop it there, and whether deleting the account leaves a
 * subscription running. Plans are only sold in the iPhone app, so a paid plan
 * that isn't a gift is run by Apple and is cancelled in iPhone Settings, never
 * here (the phone's CancelSubscriptionScreen and DeleteAccountScreen).
 */
import { CANCELABLE_PLANS, PLAN_LABELS, planSource, type GiftYear, type Plan, type PlanSource } from "../lib/plan";

export const APP_STORE_STEPS = "iPhone Settings > your name > Subscriptions";

/** "12 November 2027", or "" for a date that can't be read. */
export function longDate(iso: string | null | undefined): string {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
}

export type PlanWords = {
  source: PlanSource;
  /** The plan's name, as the card shows it in bold. */
  name: string;
  /** How to change or stop it, or when it ends; each one a sentence. */
  lines: string[];
};

/** The plan card's words, by where the plan came from. */
export function planWords(plan: Plan, giftYear: GiftYear | null, cancelAt: string | null): PlanWords {
  const source = planSource(plan, giftYear);
  const label = PLAN_LABELS[plan];
  if (source === "free") return { source, name: label, lines: ["Nothing to pay and nothing to cancel."] };

  if (source === "gift" || source === "promo") {
    const ends = longDate(giftYear?.endsAt);
    const from = giftYear?.fromName?.trim();
    if (plan === "complimentary" || !giftYear) {
      return { source, name: "Full access, through an access code.", lines: ["Nothing renews and nothing is charged."] };
    }
    const what = source === "gift" ? (from ? `A gift from ${from}.` : "A gift.") : "A month on us.";
    return {
      source,
      name: `${label}. ${what}`,
      lines: [ends ? `It ends on ${ends}, then the account returns to Free.` : "It ends on its own, then the account returns to Free.", "Nothing renews and nothing is charged."],
    };
  }

  // The App Store: a subscription renews until it's cancelled there; Express is bought once and simply ends.
  if (!CANCELABLE_PLANS.has(plan)) {
    return { source, name: label, lines: ["Bought once in the A Story app on iPhone. It ends on its own and nothing renews."] };
  }
  const ends = longDate(cancelAt);
  if (ends) {
    return { source, name: label, lines: [`It’s cancelled and ends on ${ends}, then the account returns to Free.`, `To turn it back on: ${APP_STORE_STEPS}.`] };
  }
  return { source, name: label, lines: ["Bought in the A Story app on iPhone, and it renews through the App Store.", `To change or cancel it: ${APP_STORE_STEPS}.`] };
}

/**
 * Whether deleting the account would leave an App Store subscription billing: Apple runs it, so deleting
 * the account here does not stop it. A plan already cancelled, a gift, or Express has nothing to stop.
 */
export function keepsBilling(plan: Plan, giftYear: GiftYear | null, cancelAt: string | null): boolean {
  return planSource(plan, giftYear) === "app_store" && CANCELABLE_PLANS.has(plan) && !longDate(cancelAt);
}

/** "Why are you leaving?" (the phone's DeleteAccountScreen REASONS). */
export const LEAVING_REASONS = [
  "I don’t need this anymore",
  "I’m worried about privacy or my data",
  "It’s too expensive",
  "I found it difficult to use",
  "I made another account",
] as const;

/** The reasons ticked and anything typed, as one line for the feedback table (the phone's reasonsText). */
export function reasonsText(picked: readonly string[], more: string): string {
  const said = more.trim();
  return [...picked, ...(said ? [said] : [])].join("; ");
}
