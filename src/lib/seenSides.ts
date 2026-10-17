/**
 * Which of the family's sides of a memory this viewer has already seen.
 *
 * A print on Home says "New from Linh" when somebody added their side of
 * a memory since the viewer last opened it. "Seen" is kept in this
 * browser only: a map of memory id → how many sides had arrived the last
 * time the viewer tapped the print. Nothing is sent anywhere; a new
 * browser simply starts with everything new, which is honest.
 *
 * The sides themselves come from the story's approved contributions
 * (data/contributions.ts), grouped here by the memory they belong to with
 * the same rule the memory page uses (app-core/lib/memorySides.js).
 */
import { sidesFor } from "../app-core/lib/memorySides.js";
import type { Contribution } from "../data/contributions";

const KEY = "astory.seenSides";

type SeenMap = Record<string, number>;

function readMap(): SeenMap {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return parsed && typeof parsed === "object" ? (parsed as SeenMap) : {};
  } catch {
    return {};
  }
}

/** How many sides of this memory the viewer had seen when they last opened it. */
export function seenCount(memoryId: string): number {
  const n = readMap()[memoryId];
  return typeof n === "number" && n >= 0 ? n : 0;
}

/** The viewer has just opened the memory with `count` sides on it. */
export function markSeen(memoryId: string, count: number): void {
  try {
    const map = readMap();
    map[memoryId] = Math.max(0, Math.floor(count));
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* private mode, or storage full: the dot simply stays */
  }
}

/** The sides that arrived after the viewer last looked: everything past the seen count, oldest first. */
export function newSides<T>(sides: T[], seen: number): T[] {
  return sides.slice(Math.max(0, seen));
}

/**
 * Every memory's approved sides, grouped by the memory they belong to.
 * Sides the viewer wrote themselves are left out: their own words are
 * never news to them.
 */
export function groupSides(contributions: Contribution[], viewer?: { email?: string; firstName?: string } | null): Map<string, Contribution[]> {
  const email = (viewer?.email || "").trim().toLowerCase();
  const first = (viewer?.firstName || "").trim().toLowerCase();
  const mine = (c: Contribution) =>
    (email && (c.contributorEmail || "").trim().toLowerCase() === email) || (first && (c.contributorName || "").split(",")[0].trim().toLowerCase() === first);
  const out = new Map<string, Contribution[]>();
  const ids = new Set(contributions.map((c) => c.memoryId).filter((id): id is string => !!id));
  for (const id of ids) {
    const sides = (sidesFor(contributions, id) as Contribution[]).filter((c) => !mine(c));
    if (sides.length) out.set(id, sides);
  }
  return out;
}

/** The line a print shows for its unseen sides: "New from Linh", "New from Linh and Minh", or null. */
export function newFromLine(sides: Contribution[], seen: number): string | null {
  const fresh = newSides(sides, seen);
  if (!fresh.length) return null;
  const names = [...new Set(fresh.map((c) => (c.contributorName || "").split(",")[0].trim()).filter(Boolean))];
  if (!names.length) return "New from the family";
  if (names.length === 1) return `New from ${names[0]}`;
  if (names.length === 2) return `New from ${names[0]} and ${names[1]}`;
  return `New from ${names[0]} and ${names.length - 1} others`;
}
