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

/* The line under the Talk button on Home, or null for none: said while the
   conversation is still unused or part-used, and nothing once it's gone
   (the blocked screen says the rest when they tap). */
export function firstCallLabel(budget) {
  if (!budget?.firstCall || budget.remainingSeconds <= 0) return null;
  const mins = Math.max(1, Math.floor(budget.remainingSeconds / 60));
  return budget.remainingSeconds >= FREE_FIRST_CALL_MINUTES * 60
    ? `Your first conversation is on us: ${FREE_FIRST_CALL_MINUTES} minutes`
    : `${mins} free ${mins === 1 ? "minute" : "minutes"} left in your first conversation`;
}
