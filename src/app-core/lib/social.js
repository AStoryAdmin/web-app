// The social layer behind the Sept 2026 "Settings & Help" designs — the
// Family/Others directory, the privacy switches and the milestone calendar.
//
// This used to keep most of it on the device, because the columns did not
// exist. They do now (supabase/accounts.sql): the privacy and general
// switches live on profiles and arrive as currentUser.settings, the
// nickname and directory live on stories, and friend requests are real rows
// between real accounts in data/friends.js. What is left here is the pure
// part — how to decide a directory, how to read a birthday out of a person
// — which never needed a server.

/* ── The Family / Others directory ────────────────────────────────────
   Edit People lets a person be filed by hand ("Companions directory");
   when nobody has, their relationship decides it. */

export const DIRECTORIES = ["Family", "Others"];

const FAMILY_RELATIONSHIPS = [
  "Myself",
  "Grandmother",
  "Grandfather",
  "Mother",
  "Father",
  "Spouse",
  "Sibling",
  "Aunt",
  "Uncle",
  "Relative",
];

// Which of the two People directories somebody belongs to. A directory
// chosen by hand on Edit People wins; otherwise the relationship decides,
// so a new person lands somewhere sensible without anybody filing them.
export function directoryFor(story) {
  const chosen = story?.directory;
  if (chosen && DIRECTORIES.includes(chosen)) return chosen;
  return FAMILY_RELATIONSHIPS.includes(story?.relationship) ? "Family" : "Others";
}

// → [{ title: "Family", people: [...] }, { title: "Others", people: [...] }]
export function groupByDirectory(stories = []) {
  return DIRECTORIES.map((title) => ({
    title,
    people: stories.filter((s) => directoryFor(s) === title),
  }));
}

// The label under a name in every people list: "Grandmother · 12 memories".
export function relationshipLabel(story) {
  if (!story) return "";
  return story.relationship === "Other" && story.relationshipOther
    ? story.relationshipOther
    : story.relationship || "";
}

/* The line under a storyteller's name: who they are, not an account.
   "Grandmother · born 1945", "Your own story · born 1990". It used to be
   an email, and when the storyteller had none it fell back to the email of
   whoever was signed in — Jamie's address under Rose's name. */
export function storySubtitle(story) {
  if (!story) return "";
  const rel = relationshipLabel(story);
  const who = rel === "Myself" ? "Your own story" : rel;
  const born = story.birthYear ? `born ${story.birthYear}` : "";
  return [who, born].filter(Boolean).join(" · ");
}

/* ── Milestones ───────────────────────────────────────────────────────
   Two sources, one list. Birthdays are derived from each person's saved
   birth date — they need no row of their own. Everything else a family
   marks (a wedding, a remembrance) is a stored row; see data/milestones.js
   and supabase/milestones.sql. */

export const MONTHS = [
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

export function monthIndex(month) {
  if (month == null || month === "") return -1;
  const asNumber = Number(month);
  if (Number.isFinite(asNumber) && asNumber >= 1 && asNumber <= 12) {
    return asNumber - 1;
  }
  return MONTHS.findIndex(
    (m) => m.toLowerCase() === String(month).trim().toLowerCase()
  );
}

const pad = (n) => String(n).padStart(2, "0");

// Every person with a birth day+month, as a milestone entry.
export function milestonesFor(stories = []) {
  return stories
    .map((s) => {
      const mi = monthIndex(s.birthMonth);
      const day = Number(s.birthDay);
      if (mi < 0 || !Number.isFinite(day) || day < 1) return null;
      return {
        id: `birthday-${s.id}`,
        storyId: s.id,
        name: [s.name, s.lastName].filter(Boolean).join(" ").trim() || s.name,
        photo: s.photo || null,
        kind: "birthday",
        month: mi,
        day,
        year: Number(s.birthYear) || null,
        title: "",
        label: `${pad(day)}/${pad(mi + 1)}`,
      };
    })
    .filter(Boolean);
}

// Stored milestones, in the same shape milestonesFor returns, so the
// calendar can hold both without knowing which is which. `stories` is
// needed for the name and the face — a milestone row carries neither.
export function storedMilestones(rows = [], stories = []) {
  return rows
    .map((r) => {
      const story = stories.find((s) => s.id === r.storyId);
      if (!story) return null;
      return {
        id: `milestone-${r.id}`,
        recordId: r.id,
        storyId: r.storyId,
        name: [story.name, story.lastName].filter(Boolean).join(" ").trim() || story.name,
        photo: story.photo || null,
        kind: r.kind,
        month: r.month - 1, // stored 1-12; the calendar counts from 0
        day: r.day,
        year: r.year || null,
        title: r.label || "",
        label: `${pad(r.day)}/${pad(r.month)}`,
      };
    })
    .filter(Boolean);
}

// The milestones falling on one day of the calendar.
export function milestonesOn(milestones, date) {
  const m = date.getMonth();
  const d = date.getDate();
  return milestones.filter((x) => x.month === m && x.day === d);
}

// "24th September" — the heading under the calendar.
const ORDINAL = (n) => {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] || "th"}`;
};

export function formatLongDate(date) {
  return `${ORDINAL(date.getDate())} ${MONTHS[date.getMonth()]}`;
}

