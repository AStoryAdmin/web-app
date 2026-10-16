// What somebody's page says about them at a glance: the Details tab's
// infobox (born, died, resting place, school, work… then their family), the
// line of their own words under it, what's missing that the family could
// add, and the four things the header offers to do.
//
// The rule throughout: only what the family has written down. A row shows
// when it has something in it. A date says as much as was entered — "1912",
// "March 1912" or "12 March 1912" — and an age at death only when both dates
// are whole, because 1912 to 1979 could be 66 or 67. "Living" is said only
// of somebody with no year they died who was born within living memory (or
// whose birth nobody entered); the tree already treats them so for invites
// (lib/familyTree.js linkStateOf).
//
// Pure, so it's tested (scripts/test-lib.mjs).

import { fullName, relationshipBetween } from "./familyGraph.js";

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const LIVING_SPAN = 110;
const num = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};
const clean = (v) => String(v ?? "").replace(/\s+/g, " ").trim();

/* A month by its number (1–12) or its name ("March", "mar"). */
export function monthNumber(v) {
  const n = num(v);
  if (n && n <= 12) return n;
  const t = clean(v).toLowerCase();
  if (t.length < 3) return null;
  const i = MONTHS.findIndex((m) => m.toLowerCase().startsWith(t));
  return i >= 0 ? i + 1 : null;
}

/* "March 12, 1945", "March 1945", "1945", or "" — as much as is known,
   in American order: the app writes American English. */
export function formatDate(year, month, day) {
  const y = num(year);
  const m = num(month);
  const d = num(day);
  const month_ = m && m <= 12 ? MONTHS[m - 1] : "";
  if (month_ && d && d <= 31) return y ? `${month_} ${d}, ${y}` : `${month_} ${d}`;
  return [month_, y ? String(y) : ""].filter(Boolean).join(" ");
}

/* Whole years between two whole dates, or null when either is partial. */
export function ageBetween(a, b) {
  if (!a?.year || !a?.month || !a?.day || !b?.year || !b?.month || !b?.day) return null;
  let age = b.year - a.year;
  if (b.month < a.month || (b.month === a.month && b.day < a.day)) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

/* When they were born and died, from their own row — or, for the
   storyteller of a story whose row has no birth date, from the date their
   story was started with (stories keep day, month and year). */
export function lifeDates(person, story) {
  if (!person) return { born: null, died: null };
  const own = { year: num(person.birthYear), month: num(person.birthMonth), day: num(person.birthDay) };
  let born = own.year || own.month ? { ...own, place: clean(person.birthPlace), from: "" } : null;
  if (story && person.storyId && story.id === person.storyId) {
    const sy = num(story.birthYear);
    const sm = monthNumber(story.birthMonth);
    const sd = num(story.birthDay);
    // The story's date fills in only what the row lacks, and only when the
    // years agree: a row saying 1946 isn't overruled by a story saying 1945.
    if (sy && (!own.year || own.year === sy) && sm && !own.month) {
      born = { year: sy, month: sm, day: sd, place: clean(person.birthPlace), from: "story" };
    }
  }
  if (!born && clean(person.birthPlace)) born = { year: null, month: null, day: null, place: clean(person.birthPlace), from: "" };
  const dy = num(person.deathYear);
  const died = dy || clean(person.deathPlace)
    ? { year: dy, month: num(person.deathMonth), day: num(person.deathDay), place: clean(person.deathPlace) }
    : null;
  return { born, died };
}

/* Whether the page speaks of them as living. */
export function isLiving(person, now = new Date()) {
  if (!person || person.deathYear) return false;
  if (person.userId) return true;
  const by = num(person.birthYear);
  return !by || now.getFullYear() - by <= LIVING_SPAN;
}

/* The facts the Details tab can hold beyond dates, in the order Wikipedia
   would list them, with how each is asked for. */
export const FACTS = [
  { key: "restingPlace", label: "Resting place", ask: (n) => `Where ${n.subj} ${n.rests}` },
  { key: "grewUp", label: "Grew up in", ask: () => "Grew up in" },
  { key: "work", label: "Work", ask: () => "Work" },
  { key: "knownFor", label: "Known for", ask: () => "Known for" },
  { key: "faith", label: "Faith", ask: () => "Faith" },
];

/* Schools, as many as a life has, each at a level. */
export const SCHOOL_LEVELS = [
  { key: "primary", label: "Primary school" },
  { key: "secondary", label: "High school" },
  { key: "university", label: "College or university" },
  { key: "graduate", label: "Graduate school" },
  { key: "other", label: "Other" },
];
const levelLabel = (k) => SCHOOL_LEVELS.find((l) => l.key === k)?.label || "";

/* Their schools, cleaned: named ones only, a known level, at most twelve.
   "Other" may say what kind (kindergarten, a trade school, night classes),
   in the person's own words. */
export function schoolsOf(person) {
  const list = Array.isArray(person?.schools) ? person.schools : [];
  return list
    .map((x) => {
      const level = SCHOOL_LEVELS.some((l) => l.key === x?.level) ? x.level : "other";
      return {
        level,
        name: clean(x?.name).slice(0, 120),
        years: clean(x?.years).slice(0, 20),
        kind: level === "other" ? clean(x?.kind).slice(0, 40) : "",
      };
    })
    .filter((x) => x.name)
    .slice(0, 12);
}

/* "College or university · 1963–1967" — the line under a school's name. */
export function schoolNote(x) {
  return [x.level === "other" ? x.kind || "" : levelLabel(x.level), x.years].filter(Boolean).join(" · ");
}

/* "university: Reed College (1972)" ↔ { level, name, years }: a school as
   one line of text, the way a suggestion carries it. An "other" school
   carries its kind after a middle dot: "other: Lycée Pasteur (1961) · trade school". */
export function schoolToText(x) {
  return `${x.level}: ${x.name}${x.years ? ` (${x.years})` : ""}${x.kind ? ` · ${x.kind}` : ""}`;
}
export function schoolFromText(t) {
  const [main, ...rest] = clean(t).split(" · ");
  const kind = rest.join(" · ").trim().slice(0, 40);
  const m = main.match(/^([a-z]+):\s*(.+?)(?:\s*\(([^)]{1,20})\))?$/);
  if (!m) return clean(t) ? { level: "other", name: clean(t).slice(0, 120), years: "", kind: "" } : null;
  const level = SCHOOL_LEVELS.some((l) => l.key === m[1]) ? m[1] : "other";
  return { level, name: m[2].slice(0, 120), years: m[3] || "", kind: level === "other" ? kind : "" };
}

/* Their work, as many jobs as a life has: what they did, where, and the
   years, all but the first optional. At most eight. The old one-line
   `work` text is kept beside it for the book, the summary and older
   phones (factPatch writes both). */
export function jobsOf(person) {
  const list = Array.isArray(person?.jobs) ? person.jobs : [];
  return list
    .map((x) => ({
      title: clean(x?.title).slice(0, 80),
      place: clean(x?.place).slice(0, 80),
      from: clean(x?.from).slice(0, 4),
      to: clean(x?.to).slice(0, 4),
    }))
    .filter((x) => x.title)
    .slice(0, 8);
}

/* "The shipyard · 1961–1975" — the line under a job. */
export function jobNote(x) {
  const years = x.from && x.to ? `${x.from}–${x.to}` : x.from ? `from ${x.from}` : x.to ? `until ${x.to}` : "";
  return [x.place, years].filter(Boolean).join(" · ");
}

/* The jobs as one line of text: "Welder, the shipyard (1961–1975); Teacher (1976–1998)". */
export function jobsToText(jobs) {
  return (jobs || [])
    .map((x) => {
      const years = x.from && x.to ? `${x.from}–${x.to}` : x.from || x.to || "";
      return `${x.title}${x.place ? `, ${x.place}` : ""}${years ? ` (${years})` : ""}`;
    })
    .join("; ")
    .slice(0, 160);
}

export function pronouns(person, isYou = false) {
  if (isYou) return { subj: "you", obj: "you", poss: "your", was: "were", is: "are", rests: "rest" };
  if (person?.sex === "M") return { subj: "he", obj: "him", poss: "his", was: "was", is: "is", rests: "rests" };
  if (person?.sex === "F") return { subj: "she", obj: "her", poss: "her", was: "was", is: "is", rests: "rests" };
  return { subj: "they", obj: "them", poss: "their", was: "were", is: "are", rests: "rest" };
}

const real = (index, ids) =>
  (ids || []).filter((id) => {
    const p = index?.people?.get(id);
    return p && p.source !== "placeholder" && (p.givenName || p.familyName);
  });

/* Their closest family, by kind, as ids. */
export function closeFamily(index, personId) {
  const parents = real(index, index?.parentsOf?.get(personId));
  const partners = real(index, index?.spousesOf?.get(personId));
  const children = real(index, index?.childrenOf?.get(personId));
  const siblings = real(index, [
    ...new Set(parents.flatMap((p) => index.childrenOf.get(p) || []).filter((id) => id !== personId)),
  ]);
  return { parents, partners, children, siblings };
}

/* Everyone else in the tree, with what they are to this person
   ("granddaughter"), nearest first. Placeholders and the unnamed are left
   out; so is anybody the tree can only call "family". */
export function otherRelatives(index, personId, exclude = []) {
  const skip = new Set([personId, ...exclude]);
  const out = [];
  for (const [id, p] of index?.people || []) {
    if (skip.has(id) || p.source === "placeholder" || !(p.givenName || p.familyName)) continue;
    const rel = relationshipBetween(index, id, personId);
    if (!rel?.label || rel.label === "family") continue;
    out.push({ id, label: rel.label, steps: closeness(rel.code) });
  }
  return out.sort((a, b) => a.steps - b.steps || a.label.localeCompare(b.label));
}

// How near a relation is, from its code in lib/familyGraph: a grandparent
// (ancestor-2) before a great-grandparent (ancestor-3); aunts, cousins and
// in-laws after the straight lines.
function closeness(code = "") {
  if (["spouse", "parent", "child"].includes(code)) return 1;
  if (code === "sibling") return 2;
  const n = Number(String(code).match(/^(?:ancestor|descendant)-(\d+)$/)?.[1]);
  return Number.isFinite(n) ? n : 4;
}

const joinNames = (names) =>
  names.length <= 1 ? names[0] || "" : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

/* The infobox, as groups of rows. A row is { key, label, lines: [text],
   people?: [{ id, name, note }] } and only exists when it has something.

   ctx: { person, index, youId, story, words } — `words` from theirWords(). */
export function infobox({ person, index, youId, story, words, relativesShown = 5 }) {
  if (!person) return [];
  const { born, died } = lifeDates(person, story);
  const life = [];
  if (born) {
    const lines = [formatDate(born.year, born.month, born.day), born.place].filter(Boolean);
    life.push({ key: "born", label: "Born", lines, from: born.from === "story" ? "story" : "" });
  }
  if (died) {
    const age = born ? ageBetween(born, died) : null;
    const date = formatDate(died.year, died.month, died.day);
    const lines = [[date, age !== null ? `(aged ${age})` : ""].filter(Boolean).join(" "), died.place].filter(Boolean);
    life.push({ key: "died", label: "Died", lines });
  }
  for (const f of FACTS) {
    const v = clean(person[f.key]);
    if (f.key === "work") {
      // Each job on its own line when they are listed; the one-line text
      // as before when that is all there is.
      const jobs = jobsOf(person);
      if (jobs.length) life.push({ key: "work", label: "Work", items: jobs.map((x) => ({ title: x.title, note: jobNote(x) })) });
      else if (v) life.push({ key: f.key, label: f.label, lines: [v] });
      continue;
    }
    if (v) life.push({ key: f.key, label: f.label, lines: [v] });
    // Wikipedia's order: schools after where they grew up, before work.
    if (f.key === "grewUp") {
      const schools = schoolsOf(person);
      if (schools.length) {
        life.push({ key: "schools", label: "Education", items: schools.map((x) => ({ title: x.name, note: schoolNote(x) })) });
      }
    }
  }

  const nameOf = (id) => fullName(index?.people?.get(id)) || "Unnamed";
  const who = (id, note = "") => ({ id, name: nameOf(id), note: id === youId ? (note ? `${note} · you` : "you") : note });
  const fam = closeFamily(index, person.id);
  const family = [];
  if (fam.partners.length) {
    family.push({ key: "partners", label: fam.partners.length > 1 ? "Spouses" : "Spouse", people: fam.partners.map((id) => who(id)) });
  }
  if (fam.children.length) {
    const firsts = fam.children.map((id) => index.people.get(id)?.givenName || nameOf(id));
    family.push({
      key: "children",
      label: "Children",
      lines: [fam.children.length > 1 ? `${fam.children.length}: ${joinNames(firsts)}` : nameOf(fam.children[0])],
      people: fam.children.map((id) => who(id)),
    });
  }
  if (fam.parents.length) family.push({ key: "parents", label: "Parents", people: fam.parents.map((id) => who(id)) });
  if (fam.siblings.length) family.push({ key: "siblings", label: "Brothers and sisters", people: fam.siblings.map((id) => who(id)) });
  const close = [...fam.partners, ...fam.children, ...fam.parents, ...fam.siblings];
  const others = otherRelatives(index, person.id, close);
  if (others.length) {
    const shown = others.slice(0, relativesShown);
    family.push({
      key: "relatives",
      label: "Relatives",
      people: shown.map((r) => who(r.id, r.label)),
      more: others.length - shown.length,
    });
  }

  const groups = [];
  if (life.length) groups.push({ key: "life", title: "Life", rows: life });
  if (family.length) groups.push({ key: "family", title: "Family", rows: family });
  if (words) groups.push({ key: "words", title: `In ${pronouns(person, person.id === youId).poss} words`, rows: [{ key: "words", label: "", words }] });
  return groups;
}

/* What the family could still add, as the dashed "+" chips under the
   infobox: "Where she was born", "School"… Faith isn't offered as a chip;
   it's in the edit form for the families who want it. */
export function missingFacts(person, isYou = false) {
  if (!person) return [];
  const n = pronouns(person, isYou);
  const out = [];
  const passed = !!person.deathYear;
  if (!clean(person.birthPlace)) out.push({ key: "birthPlace", label: `Where ${n.subj} ${n.was} born` });
  if (!num(person.birthMonth)) out.push({ key: "birthDate", label: isYou ? "Your birthday" : "Birthday" });
  if (passed && !clean(person.deathPlace)) out.push({ key: "deathPlace", label: `Where ${n.subj} died` });
  if (passed && !clean(person.restingPlace)) out.push({ key: "restingPlace", label: "Resting place" });
  if (!clean(person.grewUp)) out.push({ key: "grewUp", label: "Grew up in" });
  if (!schoolsOf(person).length) out.push({ key: "schools", label: "School" });
  for (const k of ["work", "knownFor"]) {
    if (k === "work" && jobsOf(person).length) continue;
    if (!clean(person[k])) out.push({ key: k, label: FACTS.find((f) => f.key === k).label });
  }
  return out;
}

const VOICE_MIN = 1;
const firstSentences = (text, max = 200) => {
  const t = clean(text);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return end > 40 ? cut.slice(0, end + 1) : `${cut.replace(/\s+\S*$/, "")}…`;
};

/* A line of their own, for "In her words": from a memory in their own
   story that they told (no other contributor), preferring one with their
   voice recorded, then the ones the family marked best, then the newest.
   `mems` is lib/personMemories' result. Null when there's nothing they
   said themselves. */
export function theirWords(mems) {
  const own = mems?.own;
  if (!own) return null;
  const said = (own.memories || []).filter(
    (m) => m && m.status !== "in_progress" && !clean(m.contributor) && clean(m.body).length > 20
  );
  if (!said.length) return null;
  const voiced = (m) => ((m.audio || []).length >= VOICE_MIN ? 1 : 0);
  const best = [...said].sort(
    (a, b) =>
      voiced(b) - voiced(a) ||
      (b.rating || 0) - (a.rating || 0) ||
      String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
  )[0];
  return { storyId: own.id, memoryId: best.id, title: best.title || "", quote: firstSentences(best.body), voiced: !!voiced(best) };
}

/* ── Changing one fact, in place ──────────────────────────────────────────
   Tapping a line on Details (or a "+" chip) opens it right there: a date
   as day, month and year with a place under it, anything else as one line
   of text. The chips' keys come to the line they fill. */
const LIMITS = { restingPlace: 120, grewUp: 120, work: 160, knownFor: 240, faith: 80 };

export function editorFor(key) {
  if (key === "born" || key === "birthDate" || key === "birthPlace") return "born";
  if (key === "died" || key === "deathDate" || key === "deathPlace") return "died";
  if (key === "schools" || key === "education") return "schools";
  if (key === "work" || key === "jobs") return "jobs";
  return FACTS.some((f) => f.key === key) ? key : null;
}

/* Which form the editor shows, and its title. Work is a list of jobs:
   opened as plain text, what was typed never reached the list and an empty
   one was saved (TestFlight 14 Oct, "Add work: saved, not shown"). */
export function editorShape(key) {
  const k = editorFor(key);
  if (k === "born") return { kind: "date", title: "Born" };
  if (k === "died") return { kind: "date", title: "Died" };
  if (k === "schools") return { kind: "schools", title: "Education" };
  if (k === "jobs") return { kind: "jobs", title: "Work" };
  return { kind: "text", title: FACTS.find((f) => f.key === k)?.label || "" };
}

/* What the editor starts with. A date from their story counts as theirs. */
export function factDraft(person, key, dates) {
  const k = editorFor(key);
  if (!k || !person) return null;
  if (k === "born" || k === "died") {
    const d = (k === "born" ? dates?.born : dates?.died) || {};
    const p = k === "born" ? "birth" : "death";
    return {
      day: String(num(person[`${p}Day`]) || d.day || ""),
      month: MONTHS[(num(person[`${p}Month`]) || d.month || 0) - 1] || "",
      year: String(num(person[`${p}Year`]) || d.year || ""),
      place: clean(person[`${p}Place`]),
    };
  }
  if (k === "schools") {
    const list = schoolsOf(person);
    return { schools: list.length ? list : [{ level: "primary", name: "", years: "", kind: "" }] };
  }
  if (k === "jobs") {
    const list = jobsOf(person);
    // The one-line text from before the list existed becomes the first job.
    const legacy = clean(person.work);
    return { jobs: list.length ? list : [{ title: legacy, place: "", from: "", to: "" }] };
  }
  return { text: clean(person[k]) };
}

/* The draft as a change to the person: { patch } or { error } in words a
   person can act on. Blank means "nobody knows", and clears it. */
export function factPatch(key, draft, now = new Date()) {
  const k = editorFor(key);
  if (!k || !draft) return { error: "Nothing to save." };
  if (k === "born" || k === "died") {
    const yearTxt = clean(draft.year);
    const year = yearTxt ? Number(yearTxt) : null;
    if (yearTxt && (!/^\d{4}$/.test(yearTxt) || year < 1700 || year > now.getFullYear())) {
      return { error: "A year has four numbers, like 1913." };
    }
    const monthTxt = clean(draft.month);
    const month = monthTxt ? monthNumber(monthTxt) : null;
    if (monthTxt && !month) return { error: "Write the month as a word, like March." };
    const dayTxt = clean(draft.day);
    const day = dayTxt ? Number(dayTxt) : null;
    if (dayTxt && (!/^\d{1,2}$/.test(dayTxt) || day < 1 || day > 31)) return { error: "A day is a number from 1 to 31." };
    if (day && !month) return { error: "A day needs its month too." };
    const place = clean(draft.place).slice(0, 120) || null;
    const p = k === "born" ? "birth" : "death";
    return { patch: { [`${p}Year`]: year, [`${p}Month`]: month, [`${p}Day`]: day, [`${p}Place`]: place } };
  }
  if (k === "schools") {
    const rows = (draft.schools || []).map((x) => ({ level: x.level, name: clean(x.name), years: clean(x.years), kind: clean(x.kind) }));
    if (rows.some((x) => !x.name && (x.years || x.kind))) return { error: "Each school needs its name." };
    if (rows.some((x) => x.name.length > 120)) return { error: "That school's name is a little long." };
    return { patch: { schools: schoolsOf({ schools: rows }) } };
  }
  if (k === "jobs") {
    // One line of text (a suggestion, an older draft) is one job.
    const list = draft.jobs || (clean(draft.text) ? [{ title: draft.text }] : []);
    const rows = list.map((x) => ({ title: clean(x.title), place: clean(x.place), from: clean(x.from), to: clean(x.to) }));
    if (rows.some((x) => !x.title && (x.place || x.from || x.to))) return { error: "Each job needs a name, like Teacher or The bakery." };
    const year = (y) => !y || (/^\d{4}$/.test(y) && Number(y) >= 1700 && Number(y) <= now.getFullYear() + 1);
    if (rows.some((x) => !year(x.from) || !year(x.to))) return { error: "A year has four numbers, like 1961." };
    if (rows.some((x) => x.from && x.to && Number(x.to) < Number(x.from))) return { error: "The years are the wrong way round." };
    if (rows.some((x) => x.title.length > 80 || x.place.length > 80)) return { error: "That's a little long. Keep each under 80 letters." };
    const jobs = jobsOf({ jobs: rows });
    return { patch: { jobs, work: jobsToText(jobs) || null } };
  }
  const text = clean(draft.text);
  if (text.length > LIMITS[k]) return { error: `That's a little long. Keep it under ${LIMITS[k]} letters.` };
  return { patch: { [k]: text || null } };
}

/* The four buttons in the header of their page, most used first. Every one
   of them is also in the tab it belongs to, so nothing lives only here.

   ctx: { isYou, living, joined, canAdd, canInvite, canRecordTogether,
          storyId, storyMine, keptElsewhere } */
export function headerActions(ctx = {}) {
  const list = [];
  const add = (k) => list.push(k);
  if (ctx.isYou) {
    add(ctx.storyMine ? "addMemory" : "tellStory");
    add("inviteFamily");
    add("addFamily");
    add("tree");
    return list.slice(0, 4);
  }
  if (ctx.canAdd) add("addMemory");
  // A question for them, waiting on their Home (family_questions.sql).
  if (ctx.living && ctx.canAsk) add("ask");
  if (ctx.joined) {
    add("call");
    add("video");
  }
  if (ctx.living && ctx.canRecordTogether) add("recordTogether");
  if (ctx.canInvite) add("invite");
  add("addFamily");
  add("tree");
  if (!ctx.storyId) add("startStory");
  else if (ctx.keptElsewhere) add("askToJoin");
  return list.slice(0, 4);
}
