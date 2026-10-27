/** How a memory presents itself: the paper it sits on and who told it. */
import type { Memory, Story } from "../data/stories";
import { soundsSpoken, takeaway } from "../components/archive/transcript";
import { smarten } from "./typography";

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

/** Whether a memory's words were said (a call, a conversation) rather than typed: the recording, the family call, the source, or the words themselves. */
export function wasSpoken(memory: Memory): boolean {
  if (memory.audio?.length || memory.familyCallId) return true;
  if (memory.source && /call|talk|conversation|voice|interview/i.test(memory.source)) return true;
  const transcript = (memory.audio || []).map((c) => c.transcript).join(" ");
  return soundsSpoken(`${memory.body || ""} ${transcript}`);
}

const minutesOf = (memory: Memory) => {
  const s = (memory.audio || []).reduce((a, c) => a + (c.duration || 0), 0);
  if (!s) return "";
  if (s < 45) return "under a minute";
  const m = Math.max(1, Math.round(s / 60));
  return `${m} ${m === 1 ? "minute" : "minutes"}`;
};

/**
 * Who told it and how, in three parts so a page can set the name in bold:
 * "Told by" · "Bao" · " on a call · 6 minutes" / " in conversation";
 * "Written by" · "Bao" · ""; "From" · "Linh" · "". The one rule for the
 * memory page, the cards and "From the book".
 */
export function tellerParts(memory: Memory, story: Story): { verb: string; name: string; rest: string } {
  if (memory.contributor) return { verb: "From", name: memory.contributor.split(",")[0].trim(), rest: "" };
  if (memory.audio?.length) {
    const mins = minutesOf(memory);
    // a call is a call; a recording made on the writer or record page is just said out loud
    return { verb: "Told by", name: story.name, rest: `${memory.familyCallId ? " on a call" : " out loud"}${mins ? ` · ${mins}` : ""}` };
  }
  if (wasSpoken(memory)) return { verb: "Told by", name: story.name, rest: " in conversation" };
  return { verb: "Written by", name: story.name, rest: "" };
}

/** "Told by Bao in conversation", "Written by Bao", "From Linh". */
export function toldBy(memory: Memory, story: Story): string {
  const { verb, name, rest } = tellerParts(memory, story);
  return `${verb} ${name}${rest}`;
}

/**
 * The person's own words for a print or a List card: the memory's one takeaway, whole (the page sets the same line);
 * failing that, the first sentence of the excerpt, never the server's third-person summary ("The speaker…").
 */
export function cardWords(memory: Memory): string {
  const line = takeaway(memory.body || "");
  if (line) return smarten(line);
  const ex = (memory.excerpt || "").trim();
  return /^the (speaker|narrator|storyteller)\b/i.test(ex) ? "" : smarten(ex.split(/(?<=[.!?])\s/)[0] || "");
}
