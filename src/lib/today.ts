/**
 * Today's question for a story, the way the app deals it: the bank in the
 * right voice, the deck for the day with a depth ceiling the archive has
 * earned, and the skips this browser has made today.
 */
import { voicePrompts } from "../app-core/lib/questionVoice.js";
import { dayKey, deckForDay, depthFor, questionAt } from "../app-core/lib/dailyQuestion.js";
import { sensitiveNote } from "../app-core/lib/sensitivity.js";
import type { Story } from "../data/stories";

export type Prompt = {
  id: string;
  question: string;
  followUp?: string;
  hint?: string;
  topic?: string;
  sensitive?: string | null;
  depth?: number;
  era: string;
  tags?: string[];
};

const skipKey = (storyId: string) => `astory-skips-${storyId}-${dayKey()}`;

export function skipsToday(storyId: string): number {
  try {
    return Number(localStorage.getItem(skipKey(storyId)) || 0);
  } catch {
    return 0;
  }
}

export function recordSkip(storyId: string): number {
  const n = skipsToday(storyId) + 1;
  try {
    localStorage.setItem(skipKey(storyId), String(n));
  } catch {
    /* fine */
  }
  return n;
}

/** The deck for today: three on Free, the whole walk when the plan is paid. */
export function todaysDeck(story: Story, { relative = false, unlimited = false } = {}): Prompt[] {
  const prompts = voicePrompts(story.name, { relative }) as Prompt[];
  return deckForDay(prompts, story.memories, {
    key: dayKey(),
    size: unlimited ? prompts.length : 3,
    maxDepth: depthFor(story.memories.length),
  }) as Prompt[];
}

export function todaysQuestion(story: Story, opts?: { relative?: boolean; unlimited?: boolean }): Prompt | null {
  const deck = todaysDeck(story, opts);
  return (questionAt(deck, skipsToday(story.id)) as Prompt | null) ?? deck[0] ?? null;
}

export const noteFor = (p: Prompt | null) => (p?.sensitive ? (sensitiveNote(p.sensitive) as string | null) : null);

export function greeting(name: string, now = new Date()): string {
  const h = now.getHours();
  const part = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return name ? `${part}, ${name}` : part;
}
