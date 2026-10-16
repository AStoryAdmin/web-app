import { storySubtitle } from "../app-core/lib/social.js";
import type { Story } from "../data/stories";

/** "Rose Hartley · Mother" in the family's words. */
export function storyLine(story: Story | null): string {
  if (!story) return "";
  const sub = storySubtitle(story) as string;
  return sub ? `${story.name} · ${sub}` : story.name;
}
