// "Their life, in short": the few sentences at the top of somebody's page,
// built only from what the family has written down — their years, who they
// were to the people around them, and how much the family has of them.
//
// Nothing here is invented. A year nobody entered isn't guessed, and a
// relation the tree doesn't hold isn't said. "He" and "she" only when the
// tree records it; "they" otherwise. Past tense once there's a year they
// died. Pure, so it's tested.

import { fullName } from "./familyGraph.js";
import { formatDate } from "./personFacts.js";

const YEAR = /\b(1[5-9]\d\d|20\d\d)\b/;

const join = (names) =>
  names.length <= 1 ? names[0] || "" : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

function words(person, isYou) {
  if (isYou) {
    const own = words(person, false);
    return { ...own, subj: "you", obj: "you", be: "were", is: "are" };
  }
  if (person?.sex === "M") return { subj: "he", obj: "him", be: "was", is: "is", child: "son", parent: "father", partner: "husband" };
  if (person?.sex === "F") return { subj: "she", obj: "her", be: "was", is: "is", child: "daughter", parent: "mother", partner: "wife" };
  return { subj: "they", obj: "them", be: "were", is: "are", child: "child", parent: "parent", partner: "partner" };
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/* The memories that are surely about them: their own story, what they
   told, and what they're tagged in — not the name-match guesses. */
export function memoriesOf(mems) {
  if (!mems) return [];
  const own = (mems.own?.memories || []).filter((m) => m.status !== "in_progress");
  return [...own, ...(mems.told || []).map((x) => x.memory), ...(mems.tagged || []).map((x) => x.memory)];
}

/* "on 12 March 1945 in Huế", "in March 1945", "in 1945", "in Huế", or "".
   `on` for a whole date, `in` for a month or a year. */
function when(d) {
  if (!d) return "";
  const date = formatDate(d.year, d.month, d.day);
  const parts = [];
  if (date) parts.push(`${d.day && d.month ? "on" : "in"} ${date}`);
  if (d.place) parts.push(`in ${d.place}`);
  return parts.join(" ");
}

/* { text, years: [from, to] | null, count }

   `dates` is lib/personFacts' lifeDates(person, story), for a birth date
   and place where the family has them; without it, the years alone.
   `isYou`: on your own page it speaks to you ("You were born in 1994."). */
export function lifeSummary({ person, index, mems, dates, isYou = false, storyHidden = false }) {
  if (!person) return { text: "", years: null, count: 0 };
  const name = isYou ? "You" : fullName(person) || person.givenName || "They";
  const first = isYou ? "You" : person.givenName || name;
  const w = words(person, isYou);
  const bornVerb = isYou ? "were born" : "was born";
  const passed = !!person.deathYear;
  const tense = passed ? w.be : w.is;
  const sentences = [];

  const born = when(dates?.born || (person.birthYear ? { year: person.birthYear } : null));
  const died = when(dates?.died || (person.deathYear ? { year: person.deathYear } : null));
  if (born && died) {
    sentences.push(`${name} ${bornVerb} ${born} and passed away ${died}.`);
  } else if (born) {
    sentences.push(`${name} ${bornVerb} ${born}.`);
  } else if (died) {
    sentences.push(`${name} passed away ${died}.`);
  }

  // Who they were to the people closest to them.
  const nameOf = (id) => index?.people?.get(id)?.givenName || "";
  const real = (ids) => (ids || []).map(nameOf).filter(Boolean);
  const partners = real(index?.spousesOf?.get(person.id));
  const children = real(index?.childrenOf?.get(person.id));
  const parents = real(index?.parentsOf?.get(person.id));
  const roles = [];
  if (partners.length) roles.push(`${join(partners)}'s ${w.partner}`);
  if (children.length) roles.push(`${join(children)}'s ${w.parent}`);
  const lead = sentences.length ? cap(w.subj) : first;
  if (roles.length) sentences.push(`${lead} ${tense} ${join(roles)}.`);
  if (parents.length) {
    const subject = roles.length || sentences.length ? cap(w.subj) : first;
    sentences.push(`${subject} ${tense} the ${w.child} of ${join(parents)}.`);
  }

  // How much the family has of them, and from when.
  const list = memoriesOf(mems);
  const years = list
    .map((m) => Number((String(m.period || "").match(YEAR) || [])[1]))
    .filter((y) => Number.isFinite(y) && y > 0)
    .sort((a, b) => a - b);
  const span = years.length ? [years[0], years[years.length - 1]] : null;
  // The guesses by name are counted apart, the way the page lists them,
  // so the summary and the Memories tab never disagree about how many.
  const maybe = (mems?.mentions || []).length;
  const more = `${maybe === 1 ? "one more" : `${maybe} more`} that may be about ${w.obj}`;
  if (!list.length && maybe) {
    sentences.push(`${maybe === 1 ? "One memory" : `${maybe} memories`} may be about ${w.obj}.`);
  } else if (!list.length && storyHidden) {
    // Somebody keeps their story and this account isn't one of them: the
    // memories exist, they just can't be read from here. "Nobody has
    // added a memory" told a relative something untrue.
    // Since family reading (family_reading.sql) a relative in the tree
    // can read the memories marked for the family from Home; joining is
    // for all of them. "Ask to join to read them" told them they could
    // read nothing.
    sentences.push(
      isYou
        ? "Somebody in the family keeps your stories. Ask to join to keep them with them."
        : `The family keeps ${first}'s stories. Read the ones shared with the family from Home, or ask to join for all of them.`
    );
  } else if (!list.length) {
    sentences.push(`Nobody has added a memory of ${w.obj} yet.`);
  } else {
    const n = list.length === 1 ? "one memory" : `${list.length} memories`;
    // When the memories are from, said as the memories' years. "From 1938
    // to 2011" right after a name read as a life's dates, on a woman born
    // in 1945 and still living.
    const range = !span
      ? ""
      : span[0] === span[1]
        ? ` ${list.length === 1 ? "It is" : "They are"} from ${span[0]}.`
        : ` They reach from ${span[0]} to ${span[1]}.`;
    sentences.push(`The family has ${n} of ${w.obj} so far${maybe ? `, and ${more}` : ""}.${range}`);
  }

  return { text: sentences.join(" "), years: span, count: list.length, maybe };
}
