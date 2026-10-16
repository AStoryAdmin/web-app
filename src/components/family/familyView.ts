/**
 * What the Family pages say about a person, worked out from the tree and
 * the story: who they are to the storyteller, whether they have arrived,
 * what one line under their name should read, and who may change them.
 * Pure helpers; the components in this folder call them.
 */
import qrcode from "qrcode-generator";
import type { Family, Person } from "../../data/family";
import type { Memory, Story } from "../../data/stories";
import { buildIndex, relationshipBetween, fullName } from "../../app-core/lib/familyGraph.js";
import { isPlaceholder, linkStateOf } from "../../app-core/lib/familyTree.js";
import { canEditPerson } from "../../app-core/lib/personRights.js";
import { normaliseFamilyCode } from "../../app-core/lib/familyCode.js";

/** Where a family code opens. The web's own join page, which App.tsx wires. */
export const SITE_URL = "https://app.astoryapp.com";
export const joinUrl = (code: string) => `${SITE_URL}/join/${normaliseFamilyCode(code)}`;

export type Index = ReturnType<typeof buildIndex>;
export type LinkState = { key: "you" | "joined" | "remembered" | "invited" | "listed"; label: string; canInvite: boolean };

export const personName = (p: Person | null | undefined): string => (p ? (fullName(p) as string) || "Somebody" : "");
export const firstName = (p: Person | null | undefined): string => String(p?.givenName || "").trim() || "them";

/** The people a page shows: never the placeholder rows the tree keeps for shape. */
export const realPeople = (family: Family | null): Person[] => (family?.people || []).filter((p) => !isPlaceholder(p));

export const storytellerOf = (family: Family | null, story: Story | null): Person | null =>
  (story && family?.people.find((p) => p.storyId === story.id)) || null;

export const meOf = (family: Family | null, userId: string | null | undefined): Person | null =>
  (userId && family?.people.find((p) => p.userId === userId)) || null;

export const linkState = (p: Person, meId: string | null | undefined): LinkState => linkStateOf(p, meId || null) as LinkState;

/** "The Hartleys", or "Rose's family" when the story has no family name. */
export function familyTitle(story: Story): string {
  const last = String(story.lastName || "").trim();
  if (!last) return `${story.name}'s family`;
  return /s$/i.test(last) ? `The ${last} family` : `The ${last}s`;
}

/* ── Rights ────────────────────────────────────────────────────────────── */

export function rightsContext(family: Family | null, userId: string | null | undefined) {
  const households = family?.households || [];
  return {
    userId: userId || null,
    adminsOf: (hid: string | null) => households.find((h) => h.id === hid)?.admins || [],
    organizerOf: (hid: string | null) => households.find((h) => h.id === hid)?.createdBy || null,
  };
}

/** The organiser (whoever started the tree), the person themselves, or anyone while they have no account. */
export function canEdit(person: Person, family: Family | null, userId: string | null | undefined): boolean {
  if (!userId) return false;
  if (!person.userId) return true;
  return canEditPerson(person, rightsContext(family, userId)) as boolean;
}

export const isOrganiser = (family: Family | null, userId: string | null | undefined): boolean =>
  !!userId && (family?.households || []).some((h) => h.createdBy === userId);

/* ── Relations ─────────────────────────────────────────────────────────── */

/** What `person` is to `to` ("son", "wife", "first cousin"), or "". */
export function relationTo(index: Index, personId: string, toId: string | null): string {
  if (!toId || personId === toId) return "";
  const r = relationshipBetween(index, personId, toId) as { code: string; label: string } | null;
  return r?.label || "";
}

/* ── Memories ──────────────────────────────────────────────────────────── */

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Memories a person sent in or told (credited to them), within one story. */
export function memoriesBy(person: Person, story: Story | null): Memory[] {
  if (!story) return [];
  const first = fold(person.givenName || "");
  const full = fold(fullName(person) as string);
  return story.memories.filter((m) => {
    if (m.status === "in_progress") return false;
    if (m.authorPersonId && m.authorPersonId === person.id) return true;
    const credit = fold(String(m.contributor || "").split(",")[0]);
    return !!first && (credit === first || credit.startsWith(`${first} `) || (!!full && credit === full));
  });
}

/** Memories somebody said this person is in. */
export function memoriesWith(person: Person, story: Story | null): Memory[] {
  if (!story) return [];
  return story.memories.filter((m) => m.status !== "in_progress" && Array.isArray(m.personIds) && m.personIds.includes(person.id));
}

const n = (k: number, one: string, many = `${one}s`) => `${k} ${k === 1 ? one : many}`;

/** The one line under a name on the tree and in the list. */
export function personLine(
  person: Person,
  o: { story: Story | null; index: Index; tellerId: string | null; meId: string | null | undefined; organiser: boolean },
): string {
  const teller = !!o.story && person.storyId === o.story.id;
  const rel = relationTo(o.index, person.id, o.tellerId);
  if (teller) {
    const count = o.story!.memories.filter((m) => m.status !== "in_progress").length;
    const born = person.birthYear || o.story!.birthYear;
    return [born ? `born ${born}` : "", n(count, "memory", "memories")].filter(Boolean).join(" · ");
  }
  if (person.deathYear) {
    const years = person.birthYear ? `${person.birthYear}–${person.deathYear}` : `passed away ${person.deathYear}`;
    const within = memoriesWith(person, o.story).length;
    return [years, within ? `in ${n(within, "memory", "memories")}` : ""].filter(Boolean).join(" · ");
  }
  const state = linkState(person, o.meId);
  if (state.key === "you") return ["you", o.organiser ? "organiser" : rel].filter(Boolean).join(" · ");
  const by = memoriesBy(person, o.story).length;
  if (state.key === "joined") return [rel, by ? n(by, "memory", "memories") : "on A Story"].filter(Boolean).join(" · ");
  if (state.key === "invited") return [rel, "invited · waiting"].filter(Boolean).join(" · ");
  return [rel, by ? n(by, "memory", "memories") : "not on A Story yet"].filter(Boolean).join(" · ");
}

/** The chip beside a row: arrived / invited / listed. Nothing for somebody who has passed. */
export function statusChip(person: Person, meId: string | null | undefined): { label: string; tone: "green" | "gold" | "outline" } | null {
  if (person.deathYear) return null;
  const s = linkState(person, meId);
  if (s.key === "you" || s.key === "joined") return { label: "arrived", tone: "green" };
  if (s.key === "invited") return { label: "invited", tone: "gold" };
  return { label: "listed", tone: "outline" };
}

/* ── Dates ─────────────────────────────────────────────────────────────── */

/** "Today", "Yesterday", "Sunday" within the week, else "12 June". */
export function whenLabel(iso: string, now: Date): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const days = Math.floor((new Date(now).setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { day: "numeric", month: "long", ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}) });
}

export function expiresLabel(iso: string, now: Date): string {
  const days = Math.ceil((new Date(iso).getTime() - now.getTime()) / 86400000);
  if (days <= 0) return "expires today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

/* ── QR ─────────────────────────────────────────────────────────────────── */

/** An SVG string for a link. Black on white in every theme: a QR is for a camera, not a reader. */
export function qrSvg(url: string): string {
  const qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
}
