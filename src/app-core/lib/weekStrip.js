// The strip of days across the top of the home screen, and which of them
// somebody actually recorded something on.
//
// Counted off `createdAt` rather than the memory's own date — everywhere else
// in the app that would be wrong (lib/timeline.js is emphatic about it), but
// this row isn't about when things happened. It's about the days somebody sat
// down and told one, so a memory of 1975 written on Tuesday belongs to
// Tuesday. It's the streak, drawn.

const LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* A local-time day key, "2026-09-09". Local because a memory saved at 11pm
   belongs to that evening, not to tomorrow in UTC. */
export function dayKeyOf(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/* How many memories were recorded on each local day → Map(key → count).
   Shared by the home strip and the Memory Milestones calendar, so both mark
   the same days. Half-finished memories aren't something anyone did. */
export function countsByDay(memories = []) {
  const counts = new Map();
  for (const m of memories || []) {
    if (!m || m.status === "in_progress") continue;
    const key = dayKeyOf(m.createdAt);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

/* Every day the strip can scroll through, oldest first, ending three days
   after today so that today can sit in the middle of the last seven.
   → [{ key, label, day, count, today, future, offset }, …]

   It starts at the first day anything was recorded — scrolling back past
   that would only show empty days — but never less than three days back,
   so the resting row is always full, and never more than `maxBack` days
   back, so a memory imported with a date years ago doesn't hand the strip
   a thousand empty days. `offset` is each day's distance from today, which
   is what its dot is weighted by. */
export const STRIP_MAX_BACK = 365;

export function stripDays(memories = [], now = new Date(), maxBack = STRIP_MAX_BACK) {
  const counts = countsByDay(memories);
  const todayKey = dayKeyOf(now);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let back = 3;
  const first = [...counts.keys()].sort()[0];
  if (first && first < todayKey) {
    const [y, m, d] = first.split("-").map(Number);
    // Whole days, rounded so a daylight-saving hour can't shave one off.
    back = Math.max(back, Math.round((today - new Date(y, m - 1, d)) / 86400000));
  }
  back = Math.min(back, Math.max(3, maxBack));

  const out = [];
  for (let offset = -back; offset <= 3; offset++) {
    // Built from the calendar date, not by adding 24h, so a daylight-saving
    // night doesn't land two entries on the same day.
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const key = dayKeyOf(d);
    out.push({
      key,
      label: LABELS[d.getDay()],
      day: d.getDate(),
      count: counts.get(key) || 0,
      today: key === todayKey,
      // Days that haven't happened yet are drawn faint — an empty Friday on
      // Wednesday isn't a day anybody missed.
      future: key > todayKey,
      offset,
    });
  }
  return out;
}

/* How strongly a day's dot is drawn, 0 to 1. Full for today and yesterday,
   thinning the further back it goes, so a run of days reads as momentum
   building towards now rather than as three identical marks. Zero for a
   day with nothing on it and for any day still to come.

   Nothing here counts a gap. A missed Tuesday is simply a day without a
   dot — never a broken chain, never a reset number. */
export function dotStrength(entry) {
  if (!entry || !entry.count || entry.future) return 0;
  const back = -entry.offset;
  if (back <= 1) return 1;
  if (back === 2) return 0.75;
  // Still clearly a dot: scrolled back through older weeks, a faint one
  // would read as nothing at all.
  return 0.55;
}

/* "Thursday 10 · 2 memories" — the line shown when a day is picked, and the
   screen-reader label for every day in the row. */
export function dayLabel(entry) {
  if (!entry) return "";
  const when = `${entry.today ? "Today" : entry.label} ${entry.day}`;
  if (entry.future) return `${when}, still to come`;
  if (!entry.count) return `${when}, nothing yet`;
  return `${when}, ${entry.count} ${entry.count === 1 ? "memory" : "memories"}`;
}
