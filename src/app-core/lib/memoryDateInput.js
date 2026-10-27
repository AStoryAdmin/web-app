// Day / Month / Year, for the one question every memory has to answer.
//
// The archive stores when a memory happened as free text (`period`) and
// reads a year and a month back out of it — see lib/timeline.js, which is
// emphatic about why: nobody remembers their childhood in ISO 8601, and a
// required date field would make half a life unrecordable.
//
// But "June 1975, or just 1975" as a placeholder puts the whole burden of
// format on the person typing, and the people this app is for are the ones
// least likely to enjoy that. So the form asks for the three parts
// separately, requires only the year, and writes an ordinary sentence back
// into the same free-text field. Nothing downstream changes: "14 June 1975"
// and "1975" both parse exactly as they did before.

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export { MONTHS };

// The earliest year a memory can carry. A typo guard, not a judgement about
// history: A Story is also used to write down ancestors, and family trees
// built from parish records reach back into the 1600s. It still refuses the
// slips that matter — "1069" typed for 1960 — which a floor any lower would
// let through as a real date.
// Year 1: families keep lineages back to a founding ancestor ("ông tổ")
// in the 900s, and a three-digit year is a real year (2026-10-13).
const YEAR_MIN = 1;

export function yearMax() {
  return new Date().getFullYear();
}

/* How many days a month has. February leans on the year when there is one,
   and assumes 29 when there isn't — refusing "29 February" to somebody who
   hasn't typed the year yet would be maddening. */
export function daysInMonth(month, year) {
  if (!month) return 31;
  if (month === 2) {
    if (!year) return 29;
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/* Read the three parts back out of whatever is already in `period`, so
   editing a memory recorded before this form existed (or recorded by voice,
   or guessed from a photograph) fills the boxes in rather than blanking
   them.

   Anything the parts can't hold — "Summer of '68", "1970-1998", "the year we
   moved" — comes back as { free: <the original text> } instead, and the
   form keeps showing it as text rather than mangling it into a date it isn't.
   → { day, month, year, free } */
export function parseDateParts(period) {
  const text = String(period || "").trim();
  if (!text) return { day: null, month: null, year: null, free: "" };

  // "14 June 1975" · "June 14, 1975" · "June 1975" · "1975"
  const monthIndex = MONTHS.findIndex((m) =>
    new RegExp(`\\b${m.slice(0, 3)}[a-z]*\\.?\\b`, "i").test(text)
  );
  // A four-digit year first; else three digits, for an early ancestor ("999").
  const yearMatch = text.match(/\b(1[6-9]\d\d|20\d\d)\b/) || text.match(/\b([1-9]\d{2,3})\b/);
  const year = yearMatch ? Number(yearMatch[1]) : null;

  // A day is a 1–2 digit number that isn't part of the year.
  const withoutYear = yearMatch ? text.replace(yearMatch[0], " ") : text;
  const dayMatch = withoutYear.match(/\b([1-9]|[12]\d|3[01])\b/);
  const day = dayMatch ? Number(dayMatch[1]) : null;

  const month = monthIndex >= 0 ? monthIndex + 1 : null;

  // Rebuild what these parts would render as. If that isn't the text we
  // started from, the text is saying something the boxes can't — keep it.
  // Day first is how dates were written before 2026-10-10, and memories
  // saved then still say "14 June 1975".
  const rebuilt = formatDateParts({ day, month, year });
  const older = day && month ? `${day} ${MONTHS[month - 1]} ${year}` : rebuilt;
  const said = text.toLowerCase();
  if (!year || (rebuilt.toLowerCase() !== said && older.toLowerCase() !== said)) {
    return { day: null, month: null, year: null, free: text };
  }
  return { day, month, year, free: "" };
}

/* The parts, as the sentence that goes into `period`. A day without a month
   is meaningless ("the 14th" of what?), so it's dropped rather than written
   out — the form disables the day box until a month is picked, and this is
   the same rule enforced where it counts. */
export function formatDateParts({ day, month, year } = {}) {
  if (!year) return "";
  const name = month ? MONTHS[month - 1] : null;
  if (name && day) return `${name} ${day}, ${year}`;
  if (name) return `${name} ${year}`;
  return String(year);
}

/* What's wrong with these parts, in a sentence somebody would say out loud —
   or null when nothing is. `story` supplies the birth year, which is the
   only thing that makes "1935" wrong for a life that began in 1945.
   Deliberately quiet about a missing year: an undated memory is allowed,
   and the archive already has a gentler way of asking for one later. */
export function validateDateParts({ day, month, year }, story) {
  if (year != null) {
    if (year < YEAR_MIN || year > yearMax()) {
      return `A year between ${YEAR_MIN} and ${yearMax()}, if you can.`;
    }
    const birth = Number(String(story?.birthYear || "").match(/\d{4}/)?.[0]);
    if (birth && year < birth) {
      // Not an error for the chapter about where a family came from — those
      // memories are meant to predate the person.
      return `That's before ${story?.name || "they"} was born in ${birth}.`;
    }
  }
  if (day != null) {
    if (!month) return "Pick a month before the day.";
    const max = daysInMonth(month, year);
    if (day < 1 || day > max) {
      return `${MONTHS[month - 1]} only has ${max} days.`;
    }
  }
  return null;
}

/* The decades this life ran through, for the "not sure of the year?" chips.
   Bounded by the person rather than by history: offering 1890s to somebody
   born in 1945 is noise, and so is offering the 2020s on a life that ended.
   Falls back to the last nine decades when the story has no birth year —
   enough to cover anyone alive, without pretending to know more.

   "the 1950s" is a real answer, not a worse version of one. parseYear()
   already reads it as 1950 for sorting, and the card still shows the words,
   so the archive never claims a precision nobody offered. */
export function decadesForLife(story, now = new Date()) {
  const thisDecade = Math.floor(now.getFullYear() / 10) * 10;
  const birth = Number(String(story?.birthYear || "").match(/\d{4}/)?.[0]);
  const first = birth ? Math.floor(birth / 10) * 10 : thisDecade - 80;
  const out = [];
  for (let d = first; d <= thisDecade; d += 10) out.push(d);
  return out;
}

export function formatDecade(startYear) {
  return `the ${startYear}s`;
}

/* What the When sheet picked, as the composer holds it. A decade ("the
   1950s") stays a decade; a year, a month or a day goes into the date
   fields, so "Type the date instead" shows it rather than empty boxes. */
export function fileUnderPeriod(value) {
  const text = String(value || "").trim();
  if (/^the \d+s$/.test(text)) return { decade: text, dateParts: null };
  return { decade: "", dateParts: parseDateParts(text) };
}

/* "She was about twenty" — the other way people place a memory they can't
   date. Turns an age into a year the timeline can sort by, and says out loud
   that it's approximate rather than filing it as fact. */
export function yearForAge(story, age) {
  const birth = Number(String(story?.birthYear || "").match(/\d{4}/)?.[0]);
  // An empty box is not age zero, which is what Number("") would make it —
  // and age zero is a real answer ("the year they were born"), so this can't
  // lean on a falsy check either.
  const raw = String(age ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!birth || !Number.isFinite(n) || n < 0 || n > 120) return null;
  const year = birth + n;
  if (year > yearMax()) return null;
  return { year, text: `around ${year}` };
}

/* "She'd have been 6 to 12 — so somewhere in 1951–1957."
   The chapter a memory is filed under implies a stretch of years once the
   story knows a birth year, which is a far better starting point than a
   blank box. Offered, never applied: a chapter is a rough guess and the
   person writing knows better. Returns null when there's nothing to say. */
export function suggestYearsForEra(story, era) {
  const birth = Number(String(story?.birthYear || "").match(/\d{4}/)?.[0]);
  if (!birth || !era) return null;

  // Mirrors eraForAge() in data/eras.js, read the other way round. The four
  // chapters that aren't a stretch of years are absent on purpose.
  const AGES = {
    Childhood: [0, 12],
    "Growing up": [13, 22],
    "Work & making a living": [23, 45],
    "Love & family": [23, 65],
    "Later years": [66, 90],
  };
  const span = AGES[era];
  if (!span) return null;

  const from = birth + span[0];
  const to = Math.min(birth + span[1], yearMax());
  if (to <= from) return null;
  return { from, to, ages: span };
}

/* How old she was across a decade, said to her in her own person on the
   "Roughly when was this?" slip (j1-spec §2): "you were born in 1945",
   "you were 5 to 14", "you were 75 to 81" (to this year); to anyone else
   "Rose was 5 to 14". Replaces "age 5" and "the year they were born" on
   that slip. null when the story has no birth year, or the decade is
   wholly before it. */
export function decadeAgeLine(story, decade, { viewer = "teller", name = "", now = new Date() } = {}) {
  const birth = Number(String(story?.birthYear || "").match(/\d{4}/)?.[0]);
  const d = Number(decade);
  if (!birth || !Number.isFinite(d) || d + 9 < birth) return null;
  const who = viewer === "teller" ? "you" : String(name || story?.name || "").trim().split(/\s+/)[0] || "they";
  const were = who === "you" || who === "they" ? "were" : "was";
  // The figures keep to their words: "5 to 14" never breaks as "5 to" / "14".
  const nb = (x) => x.replace(/ /g, " ");
  if (birth >= d && birth <= d + 9) return `${who} ${were} ${nb(`born in ${birth}`)}`;
  const from = d - birth;
  const to = Math.min(d + 9, now.getFullYear()) - birth;
  return from === to ? `${who} ${were} ${from}` : `${who} ${were} ${nb(`${from} to ${to}`)}`;
}

/* The years of a decade she lived through, to this year: "the 1940s" for
   a woman born in 1945 offers 1945 to 1949 (fixes home-213, which offered
   1940 to 1944). */
export function yearsOfDecadeForLife(story, decade, now = new Date()) {
  const birth = Number(String(story?.birthYear || "").match(/\d{4}/)?.[0]);
  const out = [];
  for (let y = decade; y <= decade + 9 && y <= now.getFullYear(); y += 1) if (!birth || y >= birth) out.push(y);
  return out;
}
