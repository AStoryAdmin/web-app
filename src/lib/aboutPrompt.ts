/**
 * A question about a person in the family, from the interview bank's "about" wordings ("What kind of work did
 * Mai's father do?"), resolved from the id a person's page links with: /write?with=<personId>&about=<promptId>.
 * The writer uses it as the page's question exactly as it uses ?q=. With no first name the wording says
 * "this person" (the bank's own fallback). An id the bank does not know gives null, and the writer falls back to
 * its usual page.
 */
import { getAboutPrompts } from "../app-core/data/interview.js";
import type { Prompt } from "./today";

export function aboutPrompt(promptId: string | null | undefined, firstName?: string | null): Prompt | null {
  if (!promptId) return null;
  const name = String(firstName || "").trim() || undefined;
  const found = getAboutPrompts(name).find((p) => p.id === promptId);
  if (!found) return null;
  return {
    id: found.id,
    question: found.question,
    followUp: undefined,
    hint: found.hint,
    topic: found.topic,
    sensitive: found.sensitive,
    depth: found.depth,
    era: found.era,
    tags: found.tags,
  };
}
