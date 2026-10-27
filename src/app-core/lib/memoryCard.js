// What a memory card says about itself.
//
// The home screen, the archive and the search results all draw the same card,
// and all three used to work its three lines out for themselves — which is
// how one of them ended up showing a raw "1970-1998" while another showed
// "1970". Worked out once, here, off nothing but the memory and the story.

import { memoryDate, ageLabel } from "./timeline.js";
import { beforeLabel } from "./familyFacts.js";
import { rowCredit } from "./credit.js";

/* "Linh, her daughter" → "Linh". A contributor line is written by whoever
   sent the memory in, so it's free text; the chip only has room for the name
   at the front of it. */
function contributorName(raw) {
  const first = String(raw || "").split(",")[0].trim();
  return first.length > 22 ? `${first.slice(0, 21)}…` : first;
}

/* The terracotta line under the title: when it happened, and how old they
   were. Undated memories say so rather than showing an empty line — being
   asked for a date is the point. Family history from before the
   storyteller was born says so: "Before Rose · 1938" (MASTER-PLAN §8.2). */
export function dateLine(story, memory) {
  const { text, year, dated } = memoryDate(memory);
  const before = story?.birthYear ? beforeLabel(memory, story) : "";
  if (before) return before;
  if (!dated) return text.trim() || "No date yet";
  // A memory the family sent is their own childhood or their own day, not
  // the storyteller's: "the 1970s", never "the 1970s · age 25".
  const age = memory?.contributor ? null : ageLabel(story, year);
  return age ? `${text} · ${age}` : text;
}

/* The second chip, when there's something true to put in it. One only: two
   competing badges on a card is noise, so they're ranked — who told it beats
   how it was rated, and both beat a nag about a missing date.
   → { kind, label } or null */
export function memoryBadge(memory, story = null) {
  // A memory with a voice on it outranks the rest: it's the only badge that
  // says there is something here to *listen* to rather than read, and the
  // card is the one place that can offer it.
  if (memory?.audio?.length) return { kind: "recording", label: "Recording" };
  if (memory?.contributor) {
    return { kind: "contributor", label: `From ${contributorName(memory.contributor)}` };
  }
  // Read in from a memoir they wrote (lib/memoir.js): their own words,
  // which is worth knowing on the card.
  if (memory?.source === "memoir") {
    const first = String(story?.name || "").trim().split(/\s+/)[0];
    return { kind: "memoir", label: first ? `From ${contributorName(first)}'s memoir` : "From the memoir" };
  }
  if ((memory?.rating || 0) >= 5) return { kind: "treasured", label: "Treasured" };
  if (!memoryDate(memory).dated) return { kind: "undated", label: "Add a date" };
  return null;
}

/* The one quiet line under a print's title (FB-268), the same on Home's
   Recent and every Archive row: when it was, or who sent it and when; the
   chapter only when there is no date. "No date yet" is never said on a
   print: the date is asked for once, on the memory (PHILOSOPHY §3.7).
     "2011 · age 66" · "From Linh · the 1970s" · "Love & family" */
export function metaLine(story, memory) {
  const date = dateLine(story, memory);
  const when = date === "No date yet" ? "" : date;
  // Who it is from, with what they are to her, and from where when that is
  // known (FB-326 item 2, lib/credit): "From Linh, her daughter · the
  // 1970s", "Told to Jamie · 1979" for her words typed by Jamie.
  const from = rowCredit(memory);
  if (from) return [from, when].filter(Boolean).join(" · ");
  return when || memory?.era || "";
}

/* Everything a card renders, in one object. */
/* The card sets the excerpt in quotation marks, so it can't be cut off by
   the text box the way an unquoted line can — "…that was mine. Tomatoes the
   first year, badly. Everything else after that, wel" with a closing quote
   after it reads as a bug. Cut on a word, mark the cut, then quote it. */
export function quoteFor(text, max = 130) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;

  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const trimmed = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  // Nothing should be left dangling before the ellipsis — a comma or a
  // half-finished clause reads as a glitch rather than as a cut.
  return `${trimmed.replace(/[\s,;:.]+$/, "")}…`;
}

export function cardMeta(story, memory) {
  const excerpt = (memory?.excerpt || memory?.body || "").trim();
  return {
    title: (memory?.title || "").trim() || "Untitled",
    chapter: memory?.era || "",
    date: dateLine(story, memory),
    line: metaLine(story, memory),
    badge: memoryBadge(memory, story),
    excerpt,
    quote: quoteFor(excerpt),
    // The cover the family chose on "Memory Saved", when there is one. The
    // first photo is only the fallback — a memory can gather photographs
    // afterwards, and the newest one arriving shouldn't quietly change the
    // face of the card.
    photo: memory?.cover || memory?.photos?.[0] || null,
    photoCount: memory?.photos?.length || 0,
  };
}
