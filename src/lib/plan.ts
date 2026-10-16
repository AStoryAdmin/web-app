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
