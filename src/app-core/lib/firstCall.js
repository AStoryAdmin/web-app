// The free first conversation.
//
// A free account gets one conversation with A Story, ten minutes, once —
// so the first thing somebody hears after installing is A Story asking
// Grandma a question, not a price list. "Minutes from install to first
// memory" is the number the first week is judged by, and a paywall in
// front of the first call was the wall in front of it.
//
// Not a trial: nothing renews, nothing converts, and the purchase sheet is
// never involved (App Review 3.1.2 is about subscriptions offered as
// trials). It is ten minutes of the paid feature, given once, counted in
// the same profiles.call_seconds_used a paid plan uses; a free account's
// count is never reset (callUsage.js only resets periods of paid plans).
//
// Pure, so it's tested.

export const FREE_FIRST_CALL_MINUTES = 10;

/* The budget shape callUsage.getCallBudget() returns, for a free account
   that has used `usedSeconds` of its one conversation. */
export function freeFirstCallBudget(usedSeconds) {
  const used = Math.max(0, Math.round(Number(usedSeconds) || 0));
  return {
    remainingSeconds: Math.max(0, FREE_FIRST_CALL_MINUTES * 60 - used),
    unlimited: false,
    plan: "free",
    allowanceMinutes: FREE_FIRST_CALL_MINUTES,
    resetAt: null,
    firstCall: true,
  };
}

/* Whether this budget is the free first conversation, not yet started:
   what "a first call" means for counting. freeFirstCallBudget() marks
   every Free budget `firstCall`, used up or not. */
export function isUntouchedFirstCall(budget) {
  return !!budget?.firstCall && budget.remainingSeconds >= FREE_FIRST_CALL_MINUTES * 60;
}

/* The line under the Talk button on Home for a free account: none. The
   promise of a free first conversation, and the minutes left in it, are
   cut until they are a confirmed product fact (DECISIONS A13, D3, E2;
   FB-007). Kept as a function so Home asks one place. */
export function firstCallLabel() {
  return null;
}
