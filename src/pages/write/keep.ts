/**
 * What the writer puts on a memory beyond its words, worked out the way the
 * phone's CreateMemoryScreen does, so a page kept on the web reads the same
 * in the app:
 *
 * - the question it answers (mem.prompt, and its questionId when it came
 *   from today's deck), so the deck leaves it out once written;
 * - who wrote it, when a relative writes in the storyteller's story
 *   ("Jamie, her granddaughter", lib/teller.js tellerCredit);
 * - whether there is enough to keep: words, or a photograph on its own.
 *
 * Pure, so it's tested.
 */
import { tellerCredit, tellerFor } from "../../app-core/lib/teller.js";
import { possessive } from "../../app-core/lib/memorySides.js";
import { buildIndex } from "../../app-core/lib/familyGraph.js";
import { relationTo, storytellerOf } from "../../components/family/familyView";
import type { Family } from "../../data/family";
import type { Story } from "../../data/stories";
import type { Prompt } from "../../lib/today";

/** The title of a photograph kept with no caption and no words (the phone's CreateMemory says the same). */
export const PHOTO_TITLE = "A photograph";

type Teller = { id?: string | null; firstName?: string | null } | null | undefined;

/**
 * Whether today's questions are asked about the storyteller rather than to them: anyone who isn't the storyteller,
 * by the phone's rule (teller.js: the story is "Myself", or the tree's subject is this account), owner or not. Home,
 * the writer, the recorder and the credit must agree, or the question chosen on Home isn't found here.
 */
export function asksAbout(story: Story | null | undefined, user: Teller, people: Family["people"] = []): boolean {
  if (!story) return false;
  return !tellerFor({ story, user: user || undefined, people } as unknown as Parameters<typeof tellerFor>[0]).isStoryteller;
}

/**
 * The question a memory answers, as it was asked. Today's questions keep their id too; a question about someone in
 * the family (from their page) is not one of the deck's, so only its words go with it.
 */
export function answered(question: Prompt | null | undefined, { about = false } = {}): { prompt?: string; questionId?: string } {
  const prompt = String(question?.question || "").replace(/\s+/g, " ").trim();
  if (!prompt) return {};
  return about || !question?.id ? { prompt } : { prompt, questionId: question.id };
}

type Writer = Teller;

/**
 * Who wrote it, when that isn't the storyteller: "Jamie, her granddaughter" when the tree says what they are to the
 * storyteller, else the first name alone. Null for the storyteller's own page (or a writer with no name to give).
 */
export function writerCredit(story: Story, user: Writer, family: Family | null | undefined): { contributor: string; authorPersonId: string | null } | null {
  const people = family?.people || [];
  // the shared module infers its argument from defaults alone ({ people?: never[] }), so it is handed over as such
  const teller = tellerFor({ story, user: user || undefined, people } as unknown as Parameters<typeof tellerFor>[0]);
  const subject = storytellerOf(family || null, story);
  let relation = "";
  if (family && teller.personId && subject) {
    const label = relationTo(buildIndex(family), teller.personId, subject.id);
    // unnamed or unknown sex reads "their", never a guess
    if (label) relation = `${possessive(subject.sex)} ${label}`;
  }
  return tellerCredit(teller, { relation }) as { contributor: string; authorPersonId: string | null } | null;
}

/** Enough to keep: a line of words, or a photograph with or without them. */
export const canKeep = (body: string, photos: number) => body.trim().length > 0 || photos > 0;

/**
 * The page's title: the one they gave it (a caption, on a photograph), else the question it answers, else its first
 * sentence, else, for a photograph kept on its own, "A photograph".
 */
export function keptTitle({ title, question, body, photos }: { title: string; question?: string | null; body: string; photos: number }): string {
  const own = title.trim();
  if (own) return own;
  if (question) return question;
  const first = body.trim().split(/[.!?\n]/)[0].trim().slice(0, 80);
  if (first) return first;
  return photos > 0 ? PHOTO_TITLE : "";
}
