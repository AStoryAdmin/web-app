/**
 * Copied verbatim from the phone repo: supabase/functions/_shared/orderStatus.js
 * (customerStage, its STAGES table and CUSTOMER_STAGES), with TypeScript types
 * added. That file is the source; change it there first and copy it here
 * again (ruling P4-R6). The phone imports the original; the web cannot reach
 * across repos, so it keeps this copy.
 */

// The four steps a family follows on the status page, plus the three ways
// an order can leave them. Plain words, never the printer's name.
// A submission that failed and is being retried is still "Printing" to the
// family: it is ours to fix, and we do. A failed payment or a reported
// problem asks something of them, so it reads "Needs attention".
const STAGES: Record<string, CustomerStage> = {
  draft: "Needs attention",
  proof_ready: "Needs attention",
  approved: "Approved",
  payment_pending: "Approved",
  payment_failed: "Needs attention",
  paid: "Printing",
  submission_failed: "Printing",
  submitted_to_provider: "Printing",
  in_production: "Printing",
  shipped: "Shipped",
  delivered: "Delivered",
  issue_reported: "Needs attention",
  canceled: "Canceled",
  refunded: "Refunded",
  // Rows from before this flow.
  pending: "Approved",
  fulfilled: "Shipped",
};

export const CUSTOMER_STAGES = Object.freeze(["Approved", "Printing", "Shipped", "Delivered", "Canceled", "Refunded", "Needs attention"] as const);

export type CustomerStage = (typeof CUSTOMER_STAGES)[number];

const has = (obj: object, key: unknown): key is string => typeof key === "string" && Object.prototype.hasOwnProperty.call(obj, key);

export function customerStage(status: unknown): CustomerStage {
  return has(STAGES, status) ? STAGES[status] : "Needs attention";
}
