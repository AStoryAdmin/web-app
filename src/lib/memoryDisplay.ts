/** How a memory presents itself: the paper it sits on and who told it. */
import type { Memory, Story } from "../data/stories";

const PAPER_BY_CHAPTER: Record<string, string> = {
  Childhood: "sage",
  "Growing up": "sea",
  "Love & family": "blush",
  "Work & making a living": "butter",
  "The world we lived through": "periwinkle",
  "When everything changed": "apricot",
  "Faith & what carried me": "lilac",
  "Looking back": "periwinkle",
  "From the family": "apricot",
};

/** The family's chosen paper, else the chapter's tint, else plain. */
export function paperFor(memory: Memory): string {
  if (memory.color && memory.color !== "plain") return memory.color;
  return PAPER_BY_CHAPTER[memory.era] || "";
}

export function toldBy(memory: Memory, story: Story): string {
  if (memory.contributor) return `From ${memory.contributor.split(",")[0].trim()}`;
  if (memory.audio?.length) return `Told by ${story.name}`;
  return `Written by ${story.name}`;
}
