// How the app talks about a question that might land hard.
//
// Some of the best questions in the bank are the ones somebody could cry at:
// who they lost, what they went without, what they have never told anybody.
// They belong in a memoir — they are often the whole point of one — but they
// should not arrive unannounced on a Tuesday morning, and a granddaughter
// choosing one to put in front of her grandmother deserves to know which is
// which before she taps it.
//
// So the mark names the kind rather than raising a flag. "Sensitive" on its
// own is a warning triangle, which tells nobody anything and makes every
// marked question look equally alarming. "Touches on losing someone" is a
// thing a person can actually make a decision about.
//
// The kinds are set in content/questions.csv and validated at build time
// (scripts/build-questions.mjs). Everything else in the bank is unmarked.

export const SENSITIVE_LABEL = {
  loss: "Touches on losing someone",
  hardship: "Touches on hard years",
  rupture: "Touches on a falling-out",
  private: "Asks for something private",
};

/* The line shown under the question of the day when it's one of these. It
   gives permission rather than a warning: the point isn't to steer anybody
   away, it's to make putting it down again feel like a choice they were
   offered rather than a thing they failed at. */
export function sensitiveNote(kind) {
  if (!kind || !SENSITIVE_LABEL[kind]) return null;
  return `${SENSITIVE_LABEL[kind]}. Leave it for another day if today isn't the day.`;
}
