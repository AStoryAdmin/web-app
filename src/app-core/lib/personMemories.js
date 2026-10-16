// The memories a person in the family tree is part of, for their page.
//
// Four kinds, kept apart so the page can say which is which:
//
//   own       their own story, when this account can read it: every memory
//   told      memories they told or sent in — the memory's author is their
//             tree row, or its credit line starts with their name
//             ("Linh, her daughter", "Hưng & Jamie, on a family call")
//   tagged    memories somebody said they're in ("Who's in this memory?",
//             memories.person_ids — lib/memoryPeople.js)
//   mentions  only for memories nobody has been asked about yet (saved
//             before tagging, so no personIds at all): the ones that name
//             them — their full name,
//             or their first name as a word when it's long enough not to
//             catch everything ("Bao" yes, "Al" no) — or, in the story of
//             somebody they're the one father, mother or partner of, the
//             way that storyteller says it: Rose's "my father" is Hưng.
//             relationIn(story) gives what they are to that story's teller.
//             A guess, and the page says so. Once a memory has been
//             tagged, even with nobody, its tags are the answer: a name in
//             the text never puts it on anybody's page.
//
// A memory appears once, in the first kind that claims it. Newest first
// within each kind. Pure, so it's tested.

import { fullName } from "./familyGraph.js";

const MIN_FIRST_NAME = 3;

const fold = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const saved = (m) => m && m.status !== "in_progress";

/* How a storyteller says the one person they have of each kind. Only the
   relations a person has one of: "my brother" could be any of three. */
const SAID = {
  father: ["my father", "my dad", "my papa", "my pa"],
  mother: ["my mother", "my mum", "my mom", "my mama", "my ma"],
  husband: ["my husband"],
  wife: ["my wife"],
};
function saidAs(label) {
  const words = SAID[String(label || "").toLowerCase()];
  if (!words) return null;
  return new RegExp(`(^|[^\\p{L}])(${words.map(escape).join("|")})($|[^\\p{L}])`, "u");
}

const newestFirst = (a, b) =>
  String(b.memory.createdAt || "").localeCompare(String(a.memory.createdAt || ""));

export function personMemories(person, stories = [], { relationIn } = {}) {
  const empty = { own: null, told: [], tagged: [], mentions: [], total: 0 };
  if (!person) return empty;

  const own = (stories || []).find((s) => s && person.storyId && s.id === person.storyId) || null;
  const seen = new Set();
  const mark = (m) => seen.add(m.id);

  if (own) for (const m of own.memories || []) if (saved(m)) mark(m);

  const first = String(person.givenName || "").trim();
  const full = fullName(person).trim();
  const firstFolded = fold(first);
  const nameWord =
    first.length >= MIN_FIRST_NAME ? new RegExp(`(^|[^\\p{L}])${escape(firstFolded)}($|[^\\p{L}])`, "u") : null;
  const fullFolded = fold(full);

  const told = [];
  const tagged = [];
  const mentions = [];
  for (const story of stories || []) {
    if (!story || story === own) continue;
    const said = relationIn ? saidAs(relationIn(story)) : null;
    for (const m of story.memories || []) {
      if (!saved(m) || seen.has(m.id)) continue;
      const credit = fold(String(m.contributor || "").split(",")[0]);
      const byThem =
        (m.authorPersonId && m.authorPersonId === person.id) ||
        (!!firstFolded && (credit === firstFolded || credit.startsWith(`${firstFolded} `) || credit === fullFolded));
      if (byThem) {
        mark(m);
        told.push({ story, memory: m });
        continue;
      }
      if (Array.isArray(m.personIds)) {
        if (m.personIds.includes(person.id)) {
          mark(m);
          tagged.push({ story, memory: m });
        }
        continue;
      }
      const text = fold(`${m.title || ""} ${m.body || ""} ${m.excerpt || ""}`);
      const named =
        (fullFolded && fullFolded.includes(" ") && text.includes(fullFolded)) ||
        (nameWord && nameWord.test(text)) ||
        (said && said.test(text));
      if (named) {
        mark(m);
        mentions.push({ story, memory: m });
      }
    }
  }
  told.sort(newestFirst);
  tagged.sort(newestFirst);
  mentions.sort(newestFirst);
  const ownCount = own ? (own.memories || []).filter(saved).length : 0;
  return { own, told, tagged, mentions, total: ownCount + told.length + tagged.length + mentions.length };
}

/* The tree's word for somebody ("grandfather", "great-aunt", "wife") as
   the relationship a new story records (RELATIONSHIPS in data/store.js),
   so starting their story from the tree doesn't ask what the tree already
   knows. Anything without its own entry is "Other", in the tree's words. */
const STORY_REL = {
  grandmother: "Grandmother",
  grandfather: "Grandfather",
  mother: "Mother",
  father: "Father",
  wife: "Spouse",
  husband: "Spouse",
  spouse: "Spouse",
  partner: "Spouse",
  sister: "Sibling",
  brother: "Sibling",
  sibling: "Sibling",
  aunt: "Aunt",
  uncle: "Uncle",
};

export function relationshipForStory(label) {
  const word = String(label || "").trim();
  if (!word) return null;
  const known = STORY_REL[word.toLowerCase()];
  if (known) return { relationship: known, relationshipOther: "" };
  return { relationship: "Other", relationshipOther: word.charAt(0).toUpperCase() + word.slice(1) };
}

/* "Born 1912 · Passed away 1979", "Born 1945", or "" when nobody knows. */
export function lifeLine(person) {
  if (!person) return "";
  const parts = [];
  if (person.birthYear) parts.push(`Born ${person.birthYear}`);
  if (person.deathYear) parts.push(`Passed away ${person.deathYear}`);
  return parts.join(" · ");
}

/* A short line for the sheet: "13 memories in her story · in 3 more · named in 2". */
export function memorySummaryLine(res, whose = "their") {
  if (!res) return "";
  const n = (k, one, many) => `${k} ${k === 1 ? one : many}`;
  const parts = [];
  if (res.own) parts.push(`${n((res.own.memories || []).filter(saved).length, "memory", "memories")} in ${whose} story`);
  if (res.told.length) parts.push(`told ${n(res.told.length, "memory", "memories")}`);
  const tags = (res.tagged || []).length;
  if (tags) parts.push(parts.length ? `in ${tags} more` : `in ${n(tags, "memory", "memories")}`);
  if (res.mentions.length) parts.push(`named in ${n(res.mentions.length, "memory", "memories")}`);
  const line = parts.join(" · ");
  return line ? line.charAt(0).toUpperCase() + line.slice(1) : "";
}
