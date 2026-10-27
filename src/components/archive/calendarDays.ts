/**
 * What the archive's calendar puts on a day (phone ArchiveCalendarScreen
 * and lib/social.js): the days a memory was kept (a dot), and the days the
 * family keeps every year (a mark):
 *
 *   birthday      from the tree (people.birth_day, birth_month), or each
 *                 story's own date when the tree has none for them
 *   remembrance   the day somebody in the tree died
 *   happened      a memory dated to the day ("14 June 1975")
 *   anniversary,  the days marked on the phone (story_milestones), read
 *   other         only here
 *
 * Birthdays and kept days are the whole family's, every story the account
 * can see, as the phone's useMilestones(data.stories) reads them; the dots
 * and dated memories are the story on screen.
 *
 * Kept days are counted on createdAt, the day it was written down, as the
 * phone counts them. Pure but for loadKeptDays, which always settles.
 */
import { getSupabase } from "../../lib/supabase";
import { dayKeyOf } from "../../app-core/lib/weekStrip.js";
import { milestonesFor, storedMilestones, MONTHS } from "../../app-core/lib/social.js";
import { parseDateParts } from "../../app-core/lib/memoryDateInput.js";
import type { Person } from "../../data/family";
import type { Memory, Story } from "../../data/stories";

export type MarkKind = "birthday" | "remembrance" | "happened" | "anniversary" | "other";

/** A day the family keeps every year. `month` counts from 0, as Date does. */
export type DayMark = { id: string; kind: MarkKind; month: number; day: number; year: number | null; words: string; memoryId?: string; personId?: string };

/** A story_milestones row, as data/milestones.js toMilestone reads it (month 1–12). */
export type KeptDayRow = { id: string; storyId: string; kind: string; label: string; day: number; month: number; year: number | null };

const first = (name: string) =>
  String(name || "")
    .trim()
    .split(/\s+/)[0] || "";
const num = (v: unknown) => {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : NaN;
};
const realDay = (month: number, day: number) => month >= 0 && month <= 11 && day >= 1 && day <= new Date(2024, month + 1, 0).getDate();
const yearOf = (v: unknown) => (num(v) > 0 ? num(v) : null);

/** Birthdays and the days they died, for the living and the remembered in this story's household. */
export function treeMarks(people: Person[] | null | undefined, householdId: string | null = null): DayMark[] {
  const out: DayMark[] = [];
  for (const p of people || []) {
    if (!p || p.source === "placeholder") continue;
    if (householdId && p.householdId && p.householdId !== householdId) continue;
    // the facts columns (familyRows.js PERSON_FACTS) are spread in by name, so the inferred type does not list them
    const facts = p as Person & { birthDay?: unknown; birthMonth?: unknown; deathDay?: unknown; deathMonth?: unknown };
    const name = first(p.givenName) || first(p.familyName);
    if (!name) continue;
    const bm = num(facts.birthMonth) - 1;
    const bd = num(facts.birthDay);
    if (realDay(bm, bd)) out.push({ id: `birthday-${p.id}`, kind: "birthday", month: bm, day: bd, year: yearOf(p.birthYear), words: `${name}’s birthday`, personId: p.id });
    const dm = num(facts.deathMonth) - 1;
    const dd = num(facts.deathDay);
    if (realDay(dm, dd)) out.push({ id: `remembrance-${p.id}`, kind: "remembrance", month: dm, day: dd, year: yearOf(p.deathYear), words: `Remembering ${name}`, personId: p.id });
  }
  return out;
}

/** Each story's own birthday, from the story, unless the tree already has one for that story's person. */
export function storyBirthday(stories: Story[], tree: DayMark[], people: Person[] | null | undefined): DayMark[] {
  const marked = new Set(tree.map((m) => m.id));
  const inTree = new Set((people || []).filter((p) => p?.storyId && marked.has(`birthday-${p.id}`)).map((p) => p.storyId));
  return (milestonesFor(stories.filter((s) => !inTree.has(s.id))) as { id: string; month: number; day: number; year: number | null; name: string }[])
    .filter((m) => realDay(m.month, m.day))
    .map((m) => ({ id: m.id, kind: "birthday" as const, month: m.month, day: m.day, year: m.year, words: `${first(m.name) || "Their"}’s birthday` }));
}

/** The days marked on the phone, in the calendar's shape, each by the story it was marked on. */
export function keptDayMarks(rows: KeptDayRow[], stories: Story[]): DayMark[] {
  return (storedMilestones(rows, stories) as { id: string; kind: string; month: number; day: number; year: number | null; title: string; name: string }[])
    .filter((m) => realDay(m.month, m.day))
    .map((m) => {
      const name = first(m.name);
      const kind: MarkKind = m.kind === "anniversary" || m.kind === "remembrance" ? m.kind : "other";
      if (!m.title && kind === "other") return { id: m.id, kind, month: m.month, day: m.day, year: m.year, words: name ? `A day kept for ${name}` : "A day the family keeps" };
      let what = m.title || (kind === "anniversary" ? "Anniversary" : kind === "remembrance" ? "Remembrance" : "");
      if (kind === "anniversary" && m.title && !/anniversary/i.test(m.title)) what = `${m.title} anniversary`;
      // by first name, the way the family says it: "Rose’s wedding anniversary"
      const words = name ? `${name}’s ${what.charAt(0).toLowerCase()}${what.slice(1)}` : what;
      return { id: m.id, kind, month: m.month, day: m.day, year: m.year, words };
    });
}

/** Memories dated to the day: each marks that day every year, under its title. */
export function happenedMarks(memories: Memory[]): DayMark[] {
  const out: DayMark[] = [];
  for (const m of memories) {
    if (m.status === "in_progress") continue;
    const { day, month, year } = parseDateParts(m.period) as { day: number | null; month: number | null; year: number | null };
    if (!day || !month || !realDay(month - 1, day)) continue;
    const title = String(m.title || "").trim() || "A memory";
    out.push({ id: `happened-${m.id}`, kind: "happened", month: month - 1, day, year, words: `“${title}”`, memoryId: m.id });
  }
  return out;
}

/** Everything the calendar marks: the family's days across `stories`, and the dated memories of the story on screen. Birthdays first on any day. */
export function allMarks(story: Story, people: Person[] | null | undefined, rows: KeptDayRow[] = [], stories: Story[] = []): DayMark[] {
  const all = stories.some((s) => s.id === story.id) ? stories : [story, ...stories];
  const tree = treeMarks(people, story.householdId);
  const order: Record<MarkKind, number> = { birthday: 0, anniversary: 1, remembrance: 2, other: 3, happened: 4 };
  return [...tree, ...storyBirthday(all, tree, people), ...keptDayMarks(rows, all), ...happenedMarks(story.memories)].sort((a, b) => order[a.kind] - order[b.kind]);
}

const leap = (y: number) => new Date(y, 1, 29).getMonth() === 1;

/** The marks that fall on a date. A 29 February keeps its day on the 28th in other years. */
export function marksOn(marks: DayMark[], date: Date): DayMark[] {
  const m = date.getMonth();
  const d = date.getDate();
  const feb28 = m === 1 && d === 28 && !leap(date.getFullYear());
  return marks.filter((x) => x.month === m && (x.day === d || (feb28 && x.day === 29)));
}

/** Memories kept on each local day ("2026-10-21"), newest first; half-finished ones aren't something anyone kept. */
export function keptByDay(memories: Memory[]): Map<string, Memory[]> {
  const map = new Map<string, Memory[]>();
  for (const m of memories) {
    if (m.status === "in_progress") continue;
    const key = dayKeyOf(m.createdAt) as string | null;
    if (!key) continue;
    const list = map.get(key);
    if (list) list.push(m);
    else map.set(key, [m]);
  }
  for (const list of map.values()) list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return map;
}

/** The weeks a month is drawn on, Sunday first (the phone's MonthCalendar), with the edges of the months either side. */
export function monthGrid(year: number, month: number): Date[][] {
  const lead = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const weeks = Math.ceil((lead + days) / 7);
  return Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, i) => new Date(year, month, 1 - lead + w * 7 + i)));
}

/** The line under the month: how much of it has anything in it, never a target. */
export function monthLine(byDay: Map<string, Memory[]>, year: number, month: number): string {
  const last = new Date(year, month + 1, 0).getDate();
  let total = 0;
  let days = 0;
  for (let d = 1; d <= last; d++) {
    const n = byDay.get(dayKeyOf(new Date(year, month, d)) as string)?.length || 0;
    total += n;
    if (n) days++;
  }
  if (!total) return "Nothing kept this month yet";
  return `${total} ${total === 1 ? "memory" : "memories"} kept on ${days} ${days === 1 ? "day" : "days"} this month`;
}

/** "21 October". */
export const dayMonth = (d: Date) => `${d.getDate()} ${(MONTHS as string[])[d.getMonth()]}`;

/** "October 2026". */
export const monthTitle = (d: Date) => `${(MONTHS as string[])[d.getMonth()]} ${d.getFullYear()}`;

/** "2026-09-14" → that day, local; null for anything that isn't one. */
export function dateOfKey(key: string | null | undefined): Date | null {
  const [y, m, d] = String(key || "")
    .split("-")
    .map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return date.getMonth() === m - 1 ? date : null;
}

type Row = Record<string, unknown>;

/** Every day marked on the phone that the account can see (data/milestones.js listMilestones). [] when the table isn't there or the read fails. */
export async function loadKeptDays(): Promise<KeptDayRow[]> {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const { data, error } = await sb.from("story_milestones").select("*");
    if (error) {
      if (!["42P01", "PGRST205"].includes(error.code || "")) console.warn("loadKeptDays:", error.message || error);
      return [];
    }
    return ((data || []) as Row[]).map((r) => ({
      id: String(r.id),
      storyId: String(r.story_id),
      kind: String(r.kind || "other"),
      label: String(r.label || ""),
      day: Number(r.day),
      month: Number(r.month),
      year: r.year ? Number(r.year) : null,
    }));
  } catch {
    return [];
  }
}
