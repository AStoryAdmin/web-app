/**
 * A question about a person in the family, from the interview bank's "about" wordings ("What kind of work did
 * Mai's father do?"), resolved from the id a person's page links with: /write?with=<personId>&about=<promptId>.
 * The writer uses it as the page's question exactly as it uses ?q=. With no first name the wording says
 * "this person" (the bank's own fallback). An id the bank does not know gives null, and the writer falls back to
 * its usual page. The wording is set with curly quotes and apostrophes.
 * It carries no hint: the bank's hints speak to the storyteller, not about the person.
 */
import { getAboutPrompts } from "../app-core/data/interview.js";
import type { Prompt } from "./today";
import { smarten } from "./typography";

export function aboutPrompt(promptId: string | null | undefined, firstName?: string | null): Prompt | null {
  if (!promptId) return null;
  const name = String(firstName || "").trim() || undefined;
  const found = getAboutPrompts(name).find((p) => p.id === promptId);
  if (!found) return null;
  return {
    id: found.id,
    question: smarten(found.question), // the bank writes straight quotes: "Ty's" is set as "Ty’s"
    followUp: undefined,
    // the bank's hint is written for the storyteller's own question ("The job you were given too young."), so under a
    // question about someone else it would make the writer the subject; the question stands alone until the bank
    // has a hint written for each "about" wording
    hint: undefined,
    topic: found.topic,
    sensitive: found.sensitive,
    depth: found.depth,
    era: found.era,
    tags: found.tags,
  };
}
