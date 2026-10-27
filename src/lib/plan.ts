/**
 * Which plan an account is really on. A typed port of resolveEffectivePlan
 * in phone-app/src/lib/subscriptions.js (that file also talks to RevenueCat,
 * so it is not copied whole). Keep the two in step.
 */
export type Plan = "free" | "individual" | "family" | "express" | "monthly" | "complimentary";

export const COMPLIMENTARY_PLAN: Plan = "complimentary";

export const PLAN_LABELS: Record<Plan, string> = {
  free: "Free",
  individual: "Individual",
  family: "Family",
  express: "Express",
  monthly: "Monthly",
  complimentary: "Full access",
};

/** Plans a person can cancel from the account page (the rest run out or are free). */
export const CANCELABLE_PLANS = new Set<Plan>(["individual", "family", "monthly"]);

export function resolveEffectivePlan(
  plan: string | null | undefined,
  expressExpiresAt: string | null | undefined,
  compAccessAt: string | null | undefined,
): Plan {
  // A redeemed access code outranks whatever the plan column says, including
  // "free": that is the point of it. It does not replace a real subscription
  // either; profiles.plan is left alone, so if the comp is withdrawn later the
  // paid plan underneath is still there.
  if (compAccessAt) return COMPLIMENTARY_PLAN;
  if (plan === "express") {
    return expressExpiresAt && new Date(expressExpiresAt) > new Date() ? "express" : "free";
  }
  return (plan as Plan) || "free";
}

export const isPaid = (plan: Plan) => plan !== "free";

/**
 * A year of A Story given as a gift, or a promo month (my_gift_year() in
 * gift_2026_10_23.sql / promo_2026_10_23.sql). It does not renew, so it has
 * no cancel date; it simply ends.
 */
export type GiftYear = {
  plan: Plan;
  endsAt: string;
  fromName: string;
  kind: "gift" | "promo";
};

/**
 * The my_gift_year() row as a GiftYear, or null when there is none, it has
 * ended, or the row is not one we understand. Port of myGiftYear in
 * phone-app/src/lib/subscriptions.js.
 */
const GIFTABLE = new Set<Plan>(["individual", "family", "express", "monthly"]);

export function parseGiftYear(data: unknown, now: Date = new Date()): GiftYear | null {
  const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null | undefined;
  const plan = typeof row?.plan === "string" ? row.plan : "";
  const endsAt = typeof row?.ends_at === "string" ? row.ends_at : "";
  // Only a plan someone could buy: a row saying "free" or "complimentary" gives nothing.
  if (!GIFTABLE.has(plan as Plan) || !endsAt || !(new Date(endsAt) > now)) return null;
  return {
    plan: plan as Plan,
    endsAt,
    fromName: typeof row?.from_name === "string" ? row.from_name : "",
    kind: row?.kind === "promo" ? "promo" : "gift",
  };
}

/** A gift year's plan while it runs, never over a plan the person pays for (planWithGiftYear in the phone). */
export function planWithGiftYear(ownPlan: Plan, giftYear: GiftYear | null): Plan {
  return ownPlan === "free" && giftYear ? giftYear.plan : ownPlan;
}

/**
 * Where the plan came from, so the account page can say how to manage or
 * stop it. Plans are only sold in the iPhone app, so anything paid that is
 * not a gift is the App Store's. An access code is a promo too: nothing to
 * cancel, it simply runs.
 */
export type PlanSource = "app_store" | "gift" | "promo" | "free";

export function planSource(plan: Plan, giftYear: GiftYear | null): PlanSource {
  if (plan === "free") return "free";
  if (plan === COMPLIMENTARY_PLAN) return "promo";
  if (giftYear && giftYear.plan === plan) return giftYear.kind;
  return "app_store";
}
