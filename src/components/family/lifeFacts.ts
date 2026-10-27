/**
 * Somebody's details as the person page changes them: their name, the year
 * they were born and where, whether they have passed away (and when, and
 * where they rest), where they grew up, their work and what they were known
 * for. The phone's EditPersonScreen and FamilyPersonSheet write the same
 * fields; each one goes through app-core personFacts factPatch, so a date or
 * a line is checked, cleaned and stored exactly as the phone stores it.
 *
 * Somebody who has passed away is a person with a death year (the phone's
 * isRemembered): there is no other flag, so "passed away" asks for the year,
 * as near as anyone knows it. Only what was changed is written: a phone-made
 * list of jobs is never flattened into one line by a Save that never touched
 * the work line.
 */
import type { Person } from "../../data/family";
import { factDraft, factPatch, jobsOf, jobsToText, lifeDates } from "../../app-core/lib/personFacts.js";

export type LifeDraft = {
  given: string;
  last: string;
  birth: string;
  birthPlace: string;
  passed: boolean;
  death: string;
  deathPlace: string;
  grewUp: string;
  work: string;
  knownFor: string;
  restingPlace: string;
  email: string;
};

/** The one-line text facts, in the order the page asks for them. */
export const TEXT_FACTS = [
  { key: "grewUp", label: "Grew up in", placeholder: "Hue, then Saigon" },
  { key: "work", label: "Work", placeholder: "Teacher, then the bakery" },
  { key: "knownFor", label: "Known for", placeholder: "The garden, the Sunday soup" },
] as const;

/** The facts beyond a name and years (app-core familyRows PERSON_FACTS): on a row only once somebody gave them. */
type Facts = Person & Partial<Record<"birthPlace" | "deathPlace" | "restingPlace" | "grewUp" | "work" | "knownFor", string>>;

type DateDraft = { day: string; month: string; year: string; place: string };
type Patch = Record<string, unknown>;

const clean = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();

/** Their work as one line: the phone's list of jobs when there is one, else the old one-line text. */
function workLine(person: Facts): string {
  const jobs = jobsOf(person) as unknown[];
  return jobs.length ? (jobsToText(jobs) as string) : clean(person.work);
}

/** What the form starts with. */
export function lifeDraft(row: Person): LifeDraft {
  const person = row as Facts;
  const dates = lifeDates(person, null);
  const born = (factDraft(person, "born", dates) || {}) as Partial<DateDraft>;
  const died = (factDraft(person, "died", dates) || {}) as Partial<DateDraft>;
  return {
    given: person.givenName || "",
    last: person.familyName || "",
    birth: person.birthYear ? String(person.birthYear) : "",
    birthPlace: born.place || "",
    passed: !!person.deathYear,
    death: person.deathYear ? String(person.deathYear) : "",
    deathPlace: died.place || "",
    grewUp: clean(person.grewUp),
    work: workLine(person),
    knownFor: clean(person.knownFor),
    restingPlace: clean(person.restingPlace),
    email: person.email || "",
  };
}

/** One date (born or died): its year and place from the form, its month and day kept as they were. */
function datePatch(person: Person, key: "born" | "died", year: string, place: string, now: Date): { patch?: Patch; error?: string } {
  const base = (factDraft(person, key, lifeDates(person, null)) || {}) as Partial<DateDraft>;
  const draft = { day: base.day || "", month: base.month || "", year, place };
  // a year taken away takes its month and day with it: "12 March" with no year is not a date anybody gave
  if (!clean(year)) Object.assign(draft, { day: "", month: "" });
  return factPatch(key, draft, now) as { patch?: Patch; error?: string };
}

/**
 * The form as the person to save ({ person }), or the one thing to fix ({ error }), in words a person can act on.
 * `now` is for the years: nobody was born, or passed away, after this one.
 */
export function lifePatch(row: Person, draft: LifeDraft, now = new Date()): { person: Person } | { error: string } {
  const person = row as Facts;
  const given = clean(draft.given);
  if (!given) return { error: "A first name, at least." };
  const passed = draft.passed && !person.userId;
  if (passed && !clean(draft.death)) return { error: "The year they passed away, as near as anyone knows." };

  const patch: Patch = {};
  const was = lifeDraft(person);
  if (clean(draft.birth) !== was.birth || clean(draft.birthPlace) !== was.birthPlace) {
    const r = datePatch(person, "born", draft.birth, draft.birthPlace, now);
    if (r.error) return { error: `Born: ${r.error}` };
    Object.assign(patch, r.patch);
  }
  if (passed) {
    if (clean(draft.death) !== was.death || clean(draft.deathPlace) !== was.deathPlace) {
      const r = datePatch(person, "died", draft.death, draft.deathPlace, now);
      if (r.error) return { error: `Passed away: ${r.error}` };
      Object.assign(patch, r.patch);
    }
  } else if (person.deathYear || person.deathPlace) {
    // "passed away" taken off: the dates of a death nobody now says happened go with it
    Object.assign(patch, { deathYear: null, deathMonth: null, deathDay: null, deathPlace: null });
  }
  const born = Number(patch.birthYear !== undefined ? patch.birthYear : person.birthYear) || 0;
  const died = Number(patch.deathYear !== undefined ? patch.deathYear : passed ? person.deathYear : 0) || 0;
  if (born && died && died < born) return { error: "The year they passed away is before the year they were born. Check the two years." };

  const texts: [keyof LifeDraft, string][] = [
    ["grewUp", "grewUp"],
    ["work", "work"],
    ["knownFor", "knownFor"],
    ...(passed ? ([["restingPlace", "restingPlace"]] as [keyof LifeDraft, string][]) : []),
  ];
  for (const [field, key] of texts) {
    const text = clean(draft[field]);
    if (text === was[field]) continue;
    const r = factPatch(key, { text }, now) as { patch?: Patch; error?: string };
    if (r.error) return { error: r.error };
    Object.assign(patch, r.patch);
  }

  // an email is how somebody living is reached; somebody on A Story already has theirs, somebody remembered none
  const email = person.userId ? person.email : passed ? person.email : clean(draft.email).toLowerCase() || undefined;
  return {
    person: { ...person, ...patch, givenName: given, familyName: clean(draft.last), email } as Person,
  };
}

/** A typed year, checked: { year } (null when left empty) or the words to fix it. */
export function yearIn(text: string, what: "born" | "died", now = new Date()): { year: number | null } | { error: string } {
  const t = text.trim();
  if (!t) return { year: null };
  const y = Number(t);
  if (/^\d{4}$/.test(t) && y > 1800 && y <= now.getFullYear()) return { year: y };
  return { error: what === "born" ? "The year they were born, like 1952, or leave it empty." : "The year they passed away, like 1979." };
}
