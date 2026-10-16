// Who may change what the family tree says about somebody: the same rule
// the database holds (supabase/tree_admins.sql, can_edit_person), so the
// app never offers an edit the server will refuse.
//
// A person's details (name, dates, work, school, photo, sources, taking
// them out of the tree) are changed by:
//
//   1. the person themselves, once they have their own account;
//   2. an admin of the family tree. Whoever started the tree is one, and
//      an admin can make others. Six months away hands the role on.
//
// Everybody else in the family can still add relatives, invite people,
// start somebody's story and write what they remember, and suggest a
// correction, which an admin accepts or declines (Daniel, TestFlight
// 14 Oct 2026). Being an admin opens nobody's private memories. Pure, so
// it's tested.

import { formatDate, schoolsOf, schoolFromText, schoolToText, SCHOOL_LEVELS } from "./personFacts.js";
import { sourceFromText, SOURCE_KINDS } from "./personSources.js";

/* The tree's admins for a household: its own list, with whoever started
   it always among them. */
export function adminsFor(ctx, householdId) {
  const list = ctx?.adminsOf ? ctx.adminsOf(householdId || null) || [] : [];
  const organizer = ctx?.organizerOf ? ctx.organizerOf(householdId || null) : null;
  return [...new Set([...(organizer ? [organizer] : []), ...list])];
}

/* `ctx`: { userId, adminsOf: (householdId) => [userId], organizerOf: (householdId) => userId|null } */
export function canEditPerson(person, ctx = {}) {
  const uid = ctx.userId;
  if (!person || !uid) return false;
  if (person.userId === uid) return true;
  return adminsFor(ctx, person.householdId).includes(uid);
}

/* Who looks after somebody's details, for their page's Sources tab and
   for the button that sends a suggestion ("Send to Jamie"), so nobody
   wonders where a correction went. The same order as canEditPerson.

   `ctx` as canEditPerson's, plus nameOf(userId) → a first name or "".
   { you, why: 'self'|'admin'|'admins', name } */
export function whoLooksAfter(person, ctx = {}) {
  if (!person) return null;
  const uid = ctx.userId;
  if (uid && person.userId === uid) return { you: true, why: "self", name: "" };
  const admins = adminsFor(ctx, person.householdId);
  if (uid && admins.includes(uid)) return { you: true, why: "admin", name: "" };
  const names = admins.map((a) => (ctx.nameOf ? ctx.nameOf(a) || "" : "")).filter(Boolean);
  return { you: false, why: "admins", name: names.length === 1 ? names[0] : names.length ? `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}` : "" };
}

/* The sentence for it. `first` is their first name, `poss` "his"/"her"/
   "their". */
export function looksAfterLine(w, first, poss = "their") {
  if (!w) return "";
  if (w.you) {
    if (w.why === "self") return "These are your own details. You and the tree's admins change them.";
    return `You're an admin of the family tree, so you look after ${first}'s details.`;
  }
  const own = "Suggest a change and an admin will say yes or no.";
  return w.name ? `${w.name} look${w.name.includes(" or ") ? "" : "s"} after ${first}'s details as the tree's admin. ${own}` : `The family tree's admins look after ${poss} details. ${own}`;
}

/* The fields a suggestion can be about, in the order they're offered, with
   how each reads in a sentence ("Linh suggests born 1913"). A date is sent
   as "1945", "1945-03" or "1945-03-12": as much as the sender knows. The
   database holds the same list (person_facts.sql). */
export const SUGGESTABLE = [
  { key: "givenName", label: "First name", say: (v) => `first name ${v}` },
  { key: "familyName", label: "Last name", say: (v) => `last name ${v}` },
  { key: "birthYear", label: "Year born", say: (v) => `born ${v}` },
  { key: "deathYear", label: "Year they passed away", say: (v) => `passed away ${v}` },
  { key: "birthDate", label: "Birthday", say: (v) => `born ${sayDate(v)}`, date: true },
  { key: "birthPlace", label: "Where they were born", say: (v) => `born in ${v}` },
  { key: "deathDate", label: "When they died", say: (v) => `died ${sayDate(v)}`, date: true },
  { key: "deathPlace", label: "Where they died", say: (v) => `died in ${v}` },
  { key: "restingPlace", label: "Resting place", say: (v) => `resting place ${v}` },
  { key: "grewUp", label: "Grew up in", say: (v) => `grew up in ${v}` },
  { key: "education", label: "School", say: (v) => saySchool(v) },
  { key: "work", label: "Work", say: (v) => `work ${v}` },
  { key: "knownFor", label: "Known for", say: (v) => `known for ${v}` },
  { key: "faith", label: "Faith", say: (v) => `faith ${v}` },
  { key: "sourceLink", label: "A source", say: (v) => saySource(v), list: true },
];

// One to four digits: a family's earliest ancestor can be in the 900s.
const YEAR = /^\d{1,4}$/;
const DATE = /^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?$/;
const LONG = new Set(["knownFor", "work", "education", "sourceLink"]);

function saySchool(v) {
  const x = schoolFromText(v);
  if (!x) return `school ${v}`;
  const level = SCHOOL_LEVELS.find((l) => l.key === x.level);
  return `${level && x.level !== "other" ? level.label.toLowerCase() : "school"} ${x.name}${x.years ? ` (${x.years})` : ""}`;
}
function saySource(v) {
  const x = sourceFromText(v);
  if (!x) return `a source: ${v}`;
  const kind = SOURCE_KINDS.find((k) => k.key === x.kind);
  return `a source, ${(kind?.label || "a link").toLowerCase()}: ${x.title || x.url}`;
}

/* "1945-03-12" → { year, month, day }, or null when it isn't a real date. */
export function parseDateValue(v) {
  const m = String(v || "").trim().match(DATE);
  if (!m) return null;
  const year = Number(m[1]);
  const month = m[2] ? Number(m[2]) : null;
  const day = m[3] ? Number(m[3]) : null;
  if (year < 1700 || year > 2100) return null;
  if (month !== null && (month < 1 || month > 12)) return null;
  if (day !== null && (day < 1 || day > 31)) return null;
  return { year, month, day };
}
const sayDate = (v) => {
  const d = parseDateValue(v);
  return d ? formatDate(d.year, d.month, d.day) : v;
};

/* A suggestion cleaned up, or null when there's nothing sensible to send. */
export function cleanSuggestion(field, value, note = "") {
  const f = SUGGESTABLE.find((x) => x.key === field);
  if (!f) return null;
  const v = String(value ?? "").replace(/\s+/g, " ").trim().slice(0, LONG.has(field) ? 240 : 120);
  if (!v) return null;
  if ((field === "birthYear" || field === "deathYear") && (!YEAR.test(v) || Number(v) < 1 || Number(v) > new Date().getFullYear())) {
    return null;
  }
  if (f.date && !parseDateValue(v)) return null;
  return { field, value: v, note: String(note || "").trim().slice(0, 300) };
}

/* "born 1913" — what a suggestion says, for the card an editor sees. */
export function suggestionLine(s) {
  const f = SUGGESTABLE.find((x) => x.key === s?.field);
  return f ? f.say(s.value) : "";
}

/* What a relative who can't edit sends from a fact's line on Details:
   the suggestions a change to that line makes, one per field that changed
   ("born 1946-03", "born in Huế"), each cleaned. `patch` is personFacts'
   factPatch, `person` how they are now. */
export function factSuggestions(patch, person, note = "") {
  if (!patch) return [];
  const out = [];
  const add = (field, value) => {
    const c = cleanSuggestion(field, value, note);
    if (c) out.push(c);
  };
  for (const p of ["birth", "death"]) {
    if (!(`${p}Year` in patch)) continue;
    const y = patch[`${p}Year`];
    const m = patch[`${p}Month`];
    const d = patch[`${p}Day`];
    const same = y === (person?.[`${p}Year`] || null) && m === (person?.[`${p}Month`] || null) && d === (person?.[`${p}Day`] || null);
    if (y && !same) {
      const pad = (n) => String(n).padStart(2, "0");
      add(`${p}Date`, `${y}${m ? `-${pad(m)}${d ? `-${pad(d)}` : ""}` : ""}`);
    }
    const place = patch[`${p}Place`];
    if (place && place !== (person?.[`${p}Place`] || null)) add(`${p}Place`, place);
  }
  if (patch.schools) {
    const had = new Set(schoolsOf(person).map((x) => schoolToText(x).toLowerCase()));
    for (const x of patch.schools) if (!had.has(schoolToText(x).toLowerCase())) add("education", schoolToText(x));
  }
  for (const [k, v] of Object.entries(patch)) {
    if (/^(birth|death)/.test(k) || k === "schools" || k === "sourceLinks") continue;
    if (v && v !== (person?.[k] || null)) add(k, v);
  }
  return out;
}

/* The patch accepting a suggestion makes to the person. */
/* `person`, as they are now, for a suggestion that adds to a list (a
   school, a source) rather than replacing a value. */
export function suggestionPatch(s, person = null) {
  if (!s) return null;
  if (s.field === "education") {
    const x = schoolFromText(s.value);
    return x ? { schools: [...schoolsOf(person), x] } : null;
  }
  if (s.field === "sourceLink") {
    const x = sourceFromText(s.value);
    if (!x) return null;
    const list = Array.isArray(person?.sourceLinks) ? person.sourceLinks : [];
    return { sourceLinks: [...list, { ...x, by: s.byName || "", at: String(s.createdAt || "").slice(0, 10) }] };
  }
  if (s.field === "birthYear" || s.field === "deathYear") return { [s.field]: Number(s.value) };
  if (s.field === "birthDate" || s.field === "deathDate") {
    const d = parseDateValue(s.value);
    if (!d) return null;
    const p = s.field === "birthDate" ? "birth" : "death";
    return { [`${p}Year`]: d.year, [`${p}Month`]: d.month, [`${p}Day`]: d.day };
  }
  return { [s.field]: s.value };
}
