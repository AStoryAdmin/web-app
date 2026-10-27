// The Family tab's roster and the "Add someone" sheet, as plain logic: who
// is in the family, which of the three states each person is in, who is
// missing beside the storyteller, and whether somebody being added is
// already listed. Pure (no React Native), so scripts/test-lib.mjs reaches it.
//
// The three state phrases are the product's own words (web PRD §3.3, the
// manual's "Get them in"), and the web's Family page uses the same three.
// Nothing here stores a status: it is read from the row every time, the
// way lib/familyTree's linkStateOf does, because a stored status drifts.
import { isPlaceholder } from "./familyTree.js";
import { buildIndex, relationshipBetween } from "./familyGraph.js";

export const ROSTER_WORDS = {
  joined: "on A Story",
  invited: "invited · waiting for them",
  listed: "not on A Story yet",
};

/* The state words as they're shown beside a name (PHILOSOPHY: a named
   person is never "them"): "invited · waiting for David". The bare state
   word stays "invited · waiting for them" only where nobody is named. */
export function stateWordsFor(state, person) {
  const first = String(person?.givenName || "").trim();
  if (state === "invited" && first) return `invited · waiting for ${first}`;
  return ROSTER_WORDS[state] || "";
}

/* One person's state on the roster: "joined", "invited" or "listed", or
   null for somebody who is never offered an invite (the remembered). */
export function rosterState(person) {
  if (!person || isPlaceholder(person)) return null;
  if (person.userId) return "joined";
  if (person.deathYear) return null;
  if (person.invitedAt) return "invited";
  return "listed";
}

const nameOf = (p) => [p?.givenName, p?.familyName].filter(Boolean).join(" ").trim();

/* The roster, in the order somebody reads a family: the storyteller, then
   you, then everybody on A Story, then the invited, then the rest, each
   group by name. The remembered come back separately, so a roster row
   always carries exactly one of the three phrases and a grandfather who
   died in 1979 is never shown as "not on A Story yet". */
export function rosterOf(family, { subjectId = null, youId = null } = {}) {
  const people = (family?.people || []).filter((p) => p && !isPlaceholder(p) && (p.givenName || p.familyName));
  const rank = { joined: 0, invited: 1, listed: 2 };
  const living = [];
  const remembered = [];
  for (const p of people) {
    const state = rosterState(p);
    if (!state) remembered.push(p);
    else living.push({ person: p, state, words: ROSTER_WORDS[state] });
  }
  const first = (row) => (row.person.id === subjectId ? 0 : row.person.id === youId ? 1 : 2);
  living.sort((a, b) => first(a) - first(b) || rank[a.state] - rank[b.state] || nameOf(a.person).localeCompare(nameOf(b.person)));
  remembered.sort((a, b) => (a.deathYear || 0) - (b.deathYear || 0) || nameOf(a).localeCompare(nameOf(b)));
  return { rows: living, remembered };
}

/* Somebody already listed under this email: adding them again would make a
   second row (and the database would quietly drop the email from it). */
export function findPersonByEmail(family, email) {
  const mail = String(email || "").trim().toLowerCase();
  if (!mail) return null;
  return (family?.people || []).find((p) => p && !isPlaceholder(p) && String(p.email || "").trim().toLowerCase() === mail) || null;
}

const norm = (s) => String(s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/* People with this first name (and the same last name, when both have
   one) who are not on A Story yet: the ones to ask "Is this the same
   person?" about before making a second. */
export function sameNamePeople(family, givenName, familyName = "") {
  const g = norm(givenName);
  const f = norm(familyName);
  if (!g) return [];
  return (family?.people || []).filter((p) => {
    if (!p || isPlaceholder(p) || p.userId) return false;
    if (norm(p.givenName) !== g) return false;
    const pf = norm(p.familyName);
    return !f || !pf || pf === f;
  });
}

/* The chips the sheet shows first: what a storyteller's relatives say
   they are, in the order they are most often added (flow spec item 9).
   Each is a lib/familyTree RELATIVE_KINDS key, with the sex the word
   implies so the tree can say "daughter" rather than "child". "Someone
   else" is the free-word kind. A friend is never one of these: friends
   are their own circle, added by a friend link (AddFriend; FB-284). */
// The three likeliest, then everything else behind "Someone else ⌄"
// (judges night r1, Y8: eight pills were the heaviest thing on the sheet).
export const QUICK_RELATIONS = [
  { key: "daughter", label: "Daughter", kind: "child", sex: "F" },
  { key: "son", label: "Son", kind: "child", sex: "M" },
  { key: "grandchild", label: "Grandchild", kind: "grandchild", sex: "" },
  { key: "else", label: "Someone else ⌄", kind: null, sex: "" },
];

/* Who is missing right beside the storyteller, as at most three ghost
   rows: a mother and a father (or "parents" when neither is known), and a
   partner. Placeholders count as missing; they hold a shape, not a person. */
export function besideGaps(family, subjectId) {
  if (!subjectId) return [];
  const people = new Map((family?.people || []).map((p) => [p.id, p]));
  if (!people.has(subjectId)) return [];
  const real = (id) => people.has(id) && !isPlaceholder(people.get(id));
  const edges = family?.edges || [];
  const parents = edges.filter((e) => e.kind === "parent" && e.to === subjectId && real(e.from)).map((e) => people.get(e.from));
  const partners = edges.filter((e) => e.kind === "spouse" && (e.from === subjectId || e.to === subjectId) && real(e.from === subjectId ? e.to : e.from));
  const out = [];
  if (parents.length < 2) {
    const sexes = new Set(parents.map((p) => p.sex));
    if (!parents.length) {
      out.push({ key: "mother", word: "mother", kind: "parent", sex: "F" });
      out.push({ key: "father", word: "father", kind: "parent", sex: "M" });
    } else if (sexes.has("F")) out.push({ key: "father", word: "father", kind: "parent", sex: "M" });
    else if (sexes.has("M")) out.push({ key: "mother", word: "mother", kind: "parent", sex: "F" });
    else out.push({ key: "parent", word: "other parent", kind: "parent", sex: "" });
  }
  if (!partners.length) out.push({ key: "partner", word: "husband or wife", kind: "spouse", sex: "" });
  return out.slice(0, 3);
}

/* "20 days left", "1 day left", "ends today": a code's time, plainly. */
export function codeTimeLeft(expiresAt, now = Date.now()) {
  const end = Date.parse(expiresAt || "");
  if (!end) return "";
  const days = Math.ceil((end - now) / 864e5);
  if (days <= 0) return "ends today";
  return days === 1 ? "1 day left" : `${days} days left`;
}

/* The switcher's groups (flow spec item 13; the manual's Part 2): your own
   story, stories you keep for someone who isn't on A Story, the stories of
   the people the family remembers (kept together, write-for-others-spec
   §5.2), stories somebody else keeps that you've joined, and everyone else
   in the family on A Story (owner note #4, DECISIONS T-114). A story is
   "joined" when somebody else owns it. Empty groups are left out. Pass the
   tree as `family` so a remembered story loaded from the server, which
   carries no flag of its own yet, is placed by the person it's about.
   `storyOf` (person id -> their own story's id, from
   data/familyReading.familyStoryIds) fills in a relative's own story when
   their row in the tree doesn't carry it. */
export function storyGroups(stories, meId, family = null, { storyOf = null } = {}) {
  const own = [];
  const keep = [];
  const remembered = [];
  const joined = [];
  const people = family?.people || [];
  const rememberedStory = (s) =>
    !!s.remembered || people.some((p) => p && p.storyId === s.id && p.deathYear && !p.userId);
  for (const s of stories || []) {
    if (!s) continue;
    if (rememberedStory(s)) remembered.push(s);
    else if (s.ownerId && meId && s.ownerId !== meId) joined.push(s);
    else if (s.relationship === "Myself") own.push(s);
    else keep.push(s);
  }
  return [
    { key: "own", title: "Your story", line: "About you, in your words.", stories: own },
    { key: "keep", title: "Stories you keep for someone", line: "For someone who isn't on A Story. You do the typing.", stories: keep },
    { key: "remembered", title: "Remembered together", line: "The whole family adds what they remember, each under their own name.", stories: remembered },
    { key: "joined", title: "Stories you've joined", line: "Their story. You add what you remember, under your name.", stories: joined },
    {
      key: "family",
      title: "Your family on A Story",
      line: "Read their stories, and add what you remember, under your name.",
      stories: [],
      people: familyOnAStory(stories, meId, family, { storyOf }),
    },
  ].filter((g) => g.stories.length || g.people?.length);
}

/* Everyone in the family with an account who isn't already in "Whose
   story?" by a story on this account: one row each, never twice. Not you,
   not a placeholder, not the remembered. Oldest first, the order a family
   is read in. Each row: { id, personId, storyId, name, photo, relation,
   myRelation, words }: `relation` is what they are to you ("Your
   mother"), `myRelation` what you are to them (for the page they open),
   `storyId` null while their own story isn't known (their page opens). */
export function familyOnAStory(stories, meId, family = null, { storyOf = null } = {}) {
  const people = family?.people || [];
  const mine = (stories || []).filter(Boolean);
  const listed = new Set(mine.map((s) => s.id));
  const me = meId ? people.find((p) => p && p.userId === meId) : null;
  const index = me ? buildIndex(family) : null;
  const seen = new Set();
  const rows = [];
  for (const p of people) {
    if (!p || isPlaceholder(p) || !p.userId || p.userId === meId || p.deathYear || seen.has(p.userId)) continue;
    const name = String(p.givenName || "").trim();
    if (!name) continue;
    const storyId = p.storyId || (storyOf && storyOf[p.id]) || null;
    // Already under one of your stories: Rose, whose story you keep, or
    // Linh's own story you joined with her code.
    if (storyId && listed.has(storyId)) continue;
    if (mine.some((s) => s.relationship === "Myself" && s.ownerId === p.userId)) continue;
    seen.add(p.userId);
    const theirs = index ? relationshipBetween(index, p.id, me.id)?.label || "" : "";
    rows.push({
      id: `person:${p.id}`,
      personId: p.id,
      storyId,
      name,
      photo: p.photo || p.avatarUri || null,
      relation: theirs ? `Your ${theirs}` : "",
      myRelation: index ? relationshipBetween(index, me.id, p.id)?.label || "" : "",
      words: ROSTER_WORDS.joined,
      born: Number(p.birthYear) || 9999,
    });
  }
  rows.sort((a, b) => a.born - b.born || a.name.localeCompare(b.name));
  return rows.map(({ born, ...r }) => r); // eslint-disable-line no-unused-vars
}
