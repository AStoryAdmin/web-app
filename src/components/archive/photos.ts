import type { Memory } from "../../data/stories";

/** A memory's photographs in display order: the one the family chose first. */
export function orderedPhotos(memory: Memory): string[] {
  const all = memory.photos || [];
  const cover = memory.cover && all.includes(memory.cover) ? memory.cover : all[0];
  return cover ? [cover, ...all.filter((p) => p !== cover)] : [];
}

/** The body as paragraphs: split on blank lines, single breaks kept inside one. */
export function paragraphsOf(text: string): string[] {
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** "6 minutes", "under a minute". */
export function minutesLabel(seconds: number): string {
  if (!seconds || seconds < 45) return seconds > 0 ? "under a minute" : "";
  const m = Math.max(1, Math.round(seconds / 60));
  return `${m} ${m === 1 ? "minute" : "minutes"}`;
}
