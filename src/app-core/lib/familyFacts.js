// The family's facts, counted once: how many memories, how many from the
// family and how many waiting, the years a life spans, how old somebody is,
// how many people are in the family and how many of them are on A Story.
//
// Every screen that says one of these numbers asks here (MASTER-PLAN §8,
// decision A10). A number typed into a screen drifts; two screens that each
// count "from the family" their own way end up saying 2 and 3 about one
// thing, which is the fault the owner found first (owner-critique §1).
//
// Pure, so scripts/test-truth.mjs reaches it.
import { memoryDate, parseYear } from "./timeline.js";
import { rosterOf, ROSTER_WORDS } from "./familyRoster.js";
import { familyMemories } from "./fromFamily.js";
import { buildIndex, relationshipBetween } from "./familyGraph.js";
import { CORE_CHAPTERS } from "../data/eras.js";

// The chapter for the people who came before. A memory in it, or dated
// before the teller was born, is family history: shown as "Before Rose ·
// 1938", never as the start of the span of her life.
export const ORIGINS_CHAPTER = "Where we come from";

const saved = (m) => m && m.status !== "in_progress";
const firstWord = (s) => String(s || "").trim().split(/\s+/)[0] || "";
const plural = (n, one, many) => (n === 1 ? one : many);

/* A contribution belongs to the story it names; one with no story id is
   the caller's (a list already read for one story). Henry's sides never
   count as Rose's (write-for-others-spec §5). */
const onStory = (c, story) => !c.storyId || !story?.id || c.storyId === story.id;

/* The memories kept in a story (anything not still being recorded). */
export function keptMemories(story) {
  return (story?.memories || []).filter(saved);
}

/* The memories the storyteller told themselves: not sent by the family,
   not told on a family call. "Rose told five stories this week" counts
   these; "13 memories in Rose's story" counts every kept one. */
export function toldByTeller(story) {
  const theirs = new Set(familyMemories(story).map((m) => m.id));
  return keptMemories(story).filter((m) => !theirs.has(m.id));
}

/* The storyteller's row in the family tree, or null. */
export function tellerOf(story, family) {
  if (!story?.id) return null;
  return (family?.people || []).find((p) => p && p.storyId === story.id) || null;
}

/* The storyteller's row in the tree, made from her story when the tree has
   none yet (a new account's tree starts empty: Family → "Carol's name and
   details" on day one). The same row useFamilyTree addPerson makes for the
   tree's first relative, bound to the story by id. Null when the story is
   missing or already has its row. */
export function subjectRowFor(story, family, newId) {
  if (!story?.id || tellerOf(story, family)) return null;
  const year = Number(story.birthYear) || 0;
  // "Mother" says she: her page reads "her book", never "their".
  const rel = String(story.relationship || "").toLowerCase();
  const sex = /^(grand)?(mother|daughter)$|^(aunt|sister|wife|niece)$/.test(rel) ? "F" : /^(grand)?(father|son)$|^(uncle|brother|husband|nephew)$/.test(rel) ? "M" : "";
  return {
    id: newId(),
    givenName: story.name || "",
    familyName: story.lastName || "",
    sex,
    storyId: story.id,
    ...(year ? { birthYear: year } : {}),
  };
}

/* When a person's page can't open: plain and warm, and never a word that
   could read as someone having been removed or having died (HABIT-REVIEW
   §6 item 10). `who` is a first name, when there is one. */
export function openTrouble(who = "") {
  const name = String(who || "").trim().split(/\s+/)[0];
  return name ? `We couldn’t open ${name}’s page just now. Try again.` : "We couldn’t open this page just now. Try again.";
}

/* The year the storyteller was born, from the story or the tree. */
export function birthYearOf(story, family) {
  const fromStory = parseYear(story?.birthYear);
  if (fromStory) return fromStory;
  const p = tellerOf(story, family);
  return p?.birthYear ? Number(p.birthYear) : null;
}

/* Is this memory from before the storyteller was born (family history)?
   A memory in "Where we come from" is, when it has a year before their
   birth or no birth year is known. */
export function isBeforeTeller(memory, story, family) {
  const { year } = memoryDate(memory);
  const born = birthYearOf(story, family);
  if (year != null && born && year < born) return true;
  return memory?.era === ORIGINS_CHAPTER && (year == null || !born || year < born);
}

/* "Before Rose · 1938" for a family-history page, or "" for a memory in
   the storyteller's own life. */
export function beforeLabel(memory, story, family) {
  if (!isBeforeTeller(memory, story, family)) return "";
  const name = firstWord(story?.name) || "them";
  const { year } = memoryDate(memory);
  return year != null ? `Before ${name} · ${year}` : `Before ${name}`;
}

/* The years of a life the memories cover: { from, to } or null. Only the
   storyteller's own lifetime: family history before their birth is left
   out, so Rose's archive says 1951–2011, never 1938–2011. */
export function lifeSpan(story, family) {
  const years = [];
  for (const m of keptMemories(story)) {
    if (isBeforeTeller(m, story, family)) continue;
    const { year } = memoryDate(m);
    if (year != null) years.push(year);
  }
  if (!years.length) return null;
  return { from: Math.min(...years), to: Math.max(...years) };
}

/* "1951–2011", "1951", or "" with no dates. */
export function spanLabel(span) {
  if (!span) return "";
  return span.from === span.to ? String(span.from) : `${span.from}–${span.to}`;
}

/* The core chapters a story has begun (the eight a life is told in; "From
   the family" and "Anything else" are never counted as chapters). */
export function chaptersBegun(story) {
  const eras = new Set(keptMemories(story).map((m) => m.era));
  return CORE_CHAPTERS.filter((c) => eras.has(c)).length;
}

/* Was this memory kept from a recording somebody brought in (ways-in §5)?
   It counts as a recording with the teller's voice, never as a
   conversation: nobody talked with A Story to make it. */
export function isBroughtIn(memory) {
  return memory?.source === "recording" || memory?.source === "upload";
}

/* The conversations the storyteller has had with A Story ("6
   conversations"). An upload never adds one. */
export function conversationsHad(story) {
  return Math.max(0, Number(story?.sessionsCompleted) || 0);
}

/* Every count a screen says about one story's archive. */
export function archiveFacts(story, family) {
  const kept = keptMemories(story);
  const span = lifeSpan(story, family);
  return {
    kept: kept.length,
    toldByTeller: toldByTeller(story).length,
    familyMemories: familyMemories(story).length,
    withPhoto: kept.filter((m) => (m.photos || []).length).length,
    withoutPhoto: kept.filter((m) => !(m.photos || []).length).length,
    voiced: kept.filter((m) => (m.audio || []).length).length,
    broughtIn: kept.filter(isBroughtIn).length,
    conversations: conversationsHad(story),
    undated: kept.filter((m) => memoryDate(m).year == null).length,
    beforeTeller: kept.filter((m) => isBeforeTeller(m, story, family)).length,
    chapters: chaptersBegun(story),
    coreChapters: CORE_CHAPTERS.length,
    span,
    spanLabel: spanLabel(span),
  };
}

/* What the family has sent for a story, as one pair:
     kept     in the archive: their own memories (memories with a
              contributor, or told on a family call) plus the sides they
              added that the keeper said yes to;
     waiting  sent, still waiting for the keeper's yes.
   `contributions` is data/contributions.js listContributions(storyId).
   Archive, Family and Home all say this pair, and never a third number. */
export function fromFamily(story, contributions = []) {
  const memoryIds = new Set(familyMemories(story).map((m) => m.id));
  const all = (contributions || []).filter((c) => c && onStory(c, story));
  // An approved memory became a memory (its id is the contribution's id),
  // so it is already counted above; an approved side or note is not.
  const keptSides = all.filter((c) => c.status === "approved" && !memoryIds.has(c.id) && (c.kind || "testimonial") !== "memory");
  const waiting = all.filter((c) => c.status === "pending").length;
  const kept = memoryIds.size + keptSides.length;
  return { kept, waiting, sent: kept + waiting };
}

/* "1 from the family · 2 waiting for you", "2 from the family", "2
   waiting for you", or "" when the family hasn't sent anything. */
export function fromFamilyLine({ kept = 0, waiting = 0 } = {}) {
  const parts = [];
  if (kept) parts.push(`${kept} from the family`);
  if (waiting) parts.push(`${waiting} waiting for you`);
  return parts.join(" · ");
}

/* What waits for the keeper's yes, said once, by the people who sent it
   (judge-user night r1 #3, judge-design fault 5): the faces shown are the
   names said, and the number is fromFamily's `waiting`. Home, the memory
   page, Memories, Family and Keeping read this, never their own count or
   their own order (judge-user night r3, issue 2: Home led with a version
   that Keeping didn't list).
     { count, items, first, names: ["Linh", "Sam"], who: "Linh and Sam",
       line: "Waiting for your yes: Linh’s two notes and a photograph from Sam" }
   `items` are the waiting ones, newest first (the server's own order), so
   Home's lead, Keeping's first card and the line's first name are one
   thing; `first` is items[0], or null.
   `contributions`: listContributions(storyId), any statuses. */
export function waitingForYes(contributions = []) {
  const waiting = (contributions || [])
    .filter((c) => c && c.status === "pending")
    .map((c, i) => ({ c, i }))
    .sort((a, b) => new Date(b.c.createdAt || 0) - new Date(a.c.createdAt || 0) || a.i - b.i)
    .map(({ c }) => c);
  const by = new Map();
  for (const c of waiting) {
    const name = firstWord(c.contributorName) || "Someone in the family";
    const e = by.get(name) || { words: 0, photos: 0 };
    if (c.kind === "photo") e.photos++;
    else e.words++;
    by.set(name, e);
  }
  const names = [...by.keys()];
  const parts = names.map((name) => {
    const { words, photos } = by.get(name);
    // "from Sam" is one unit: a name never wraps alone onto a line of its
    // own (judges night r4, A7/Y16: "…a photograph from / Sam").
    if (!words) return photos === 1 ? `a photograph from${NB}${name}` : `${countWord(photos)} photographs from${NB}${name}`;
    if (!photos) return words === 1 ? `${name}’s note` : `${name}’s ${countWord(words)}${NB}notes`;
    return `${countWord(words + photos)} from${NB}${name}`;
  });
  return {
    count: waiting.length,
    items: waiting,
    first: waiting[0] || null,
    names,
    who: andList(names),
    line: waiting.length ? `Waiting for your yes: ${andList(parts)}` : "",
  };
}
const NB = "\u00A0";
const andList = (xs) => (xs.length <= 1 ? xs[0] || "" : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
// Small counts in words, as a person says them ("two notes"); figures
// past nine.
const COUNT_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const countWord = (n) => COUNT_WORDS[n] || String(n);

/* The memory Home leads with while something waits for the keeper's yes,
   for lane H to read, so Home's print, Family's and Memories' line and
   Keeping's first card start with the same thing: the newest waiting side
   in words, on a memory kept in this story. { memory, side } or null. */
export function waitingLead(story, contributions = []) {
  const kept = new Map(keptMemories(story).map((m) => [m.id, m]));
  const side = waitingForYes(contributions).items.find((c) => c.memoryId && kept.has(c.memoryId) && (c.kind || "testimonial") === "testimonial");
  return side ? { memory: kept.get(side.memoryId), side } : null;
}

/* The family's headcount, read from the roster (lib/familyRoster.js):
     inTree     everybody in the tree, the remembered too;
     living     the people on the roster (the dead are never counted as
                "not on A Story yet");
     onAStory   living people with an account;
     invited    asked, not joined yet;
     notYet     neither.
   `line` is "6 people · 4 on A Story". */
export function headcount(family) {
  const { rows, remembered } = rosterOf(family);
  const count = (state) => rows.filter((r) => r.state === state).length;
  const living = rows.length;
  const onAStory = count("joined");
  return {
    inTree: living + remembered.length,
    living,
    onAStory,
    invited: count("invited"),
    notYet: count("listed"),
    remembered: remembered.length,
    line: `${living} ${plural(living, "person", "people")} · ${onAStory} on A Story`,
  };
}

/* How old somebody is on `now`, from the tree's birth year (and month and
   day, when known), or null. Nobody who died has an age now. */
export function ageOf(person, now = new Date()) {
  const y = Number(person?.birthYear);
  if (!y || person?.deathYear) return null;
  let age = now.getFullYear() - y;
  const m = Number(person.birthMonth) || 0;
  const d = Number(person.birthDay) || 0;
  if (m && (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && d && now.getDate() < d))) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

/* Whole years since `year` on `now` ("60 years ago" for the 1966 wedding
   in 2026), or null. */
export function yearsSince(year, now = new Date()) {
  const y = Number(year);
  if (!y) return null;
  const n = now.getFullYear() - y;
  return n >= 0 ? n : null;
}

/* The requests for "your side" of a memory a person should see. Never
   their own request, and never one about a memory in their own story:
   Linh doesn't see "Linh asked for your side", and Rose isn't asked for
   her side of what she told. `viewer` is { userId, name, stories }. */
export function requestsFor(requests, viewer = {}) {
  const me = viewer.userId || null;
  const myName = firstWord(viewer.name).toLowerCase();
  const own = new Set(
    (viewer.stories || [])
      .filter((s) => s && s.relationship === "Myself" && (!s.ownerId || !me || s.ownerId === me))
      .map((s) => s.id)
  );
  return (requests || []).filter((r) => {
    if (!r) return false;
    if (me && r.requestedBy && r.requestedBy === me) return false;
    if (!r.requestedBy && myName && firstWord(r.requesterName).toLowerCase() === myName) return false;
    if (r.storyId && own.has(r.storyId)) return false;
    return true;
  });
}

/* "13 memories", "1 memory". */
export function memoriesLine(n) {
  return `${n} ${plural(n, "memory", "memories")}`;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/* The one way a day is written in the app's copy (DECISIONS B33): short
   "19 Oct" on stamps, seals and small print; long "Monday 19 October" in
   sentences. The year only when it isn't this year: "31 Dec 2023". ""
   for no date. `when` is a Date or anything Date can read. */
export function stampDate(when, { now = new Date(), long = false } = {}) {
  if (when == null || when === "") return "";
  const d = when instanceof Date ? when : new Date(when);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear() === now.getFullYear() ? "" : ` ${d.getFullYear()}`;
  if (long) return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}${year}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}${year}`;
}

/* Who let the family read a memory, and when, for its page (wave 1 r2,
   judge-design): the review tells Rose "Only you and Jamie will see it,
   until you share it" (M-J1-9), so a page Linh can read says that Rose
   did: "Rose shared it with the family · today"; on Rose's own phone "You
   shared it with the family · today". `memory.sharedBy` is "teller" (the
   storyteller, named by `tellerName`) or the sharer's name; the day is
   "today", "yesterday" or stampDate's. "" for a private memory, or a
   shared one with no record of who shared it: the page keeps its own
   line then ("The family can read it"). */
export function sharedLine(memory, { tellerName = "", viewer = "other", now = new Date() } = {}) {
  if (!memory || memory.privacy !== "shared" || !memory.sharedAt || !memory.sharedBy) return "";
  const byTeller = memory.sharedBy === "teller";
  const name = firstWord(byTeller ? tellerName : memory.sharedBy);
  const who = byTeller && viewer === "teller" ? "You" : name;
  if (!who) return "";
  const d = new Date(memory.sharedAt);
  if (Number.isNaN(d.getTime())) return "";
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86400000);
  const when = diff === 0 ? "today" : diff === 1 ? "yesterday" : stampDate(d, { now });
  return `${who} shared it with the family · ${when}`;
}

/* ── A relative's view (j3-spec §13, T-J3-4) ──────────────────────────── */

const DAY_MS = 24 * 60 * 60 * 1000;
// "Linh, her daughter" → "linh".
const firstOf = (s) => firstWord(s).replace(/[,.;:]+$/, "").toLowerCase();
const readable = (m) => saved(m) && m.privacy !== "private";

/* Did this person send it? A memory signed "Linh, her daughter", one tied
   to their person row, or a contribution from their account. */
function isTheirs(item, viewer) {
  if (!item || !viewer) return false;
  if (viewer.userId && (item.userId === viewer.userId || item.createdBy === viewer.userId)) return true;
  if (viewer.personId && item.authorPersonId === viewer.personId) return true;
  const name = firstOf(viewer.name);
  return !!name && (firstOf(item.contributor) === name || firstOf(item.contributorName) === name);
}

/* "your mother", "your daughter", or "" for yourself or a stranger: what
   somebody is to the viewer, from the tree. `viewer` is { personId };
   `family` the tree, or an index built from it (lib/familyGraph). */
export function relationWords(viewer, person, family) {
  if (!viewer?.personId || !person?.id || person.id === viewer.personId || !family) return "";
  const index = family.people instanceof Map ? family : buildIndex(family);
  const label = relationshipBetween(index, person.id, viewer.personId)?.label || "";
  return label ? `your ${label}` : "";
}

/* What the viewer sent to one story, kept and waiting, each counted once:
   their own memories in it, and the sides and photos they sent. A filter
   of fromFamily (DECISIONS H38). */
export function sentBy(viewer, story, contributions = []) {
  const theirs = (contributions || []).filter((c) => c && onStory(c, story) && isTheirs(c, viewer));
  const memories = familyMemories(story).filter((m) => isTheirs(m, viewer));
  const asMemory = new Set(memories.map((m) => m.id));
  const kept = [...memories, ...theirs.filter((c) => c.status === "approved" && !asMemory.has(c.id))];
  const waiting = theirs.filter((c) => c.status === "pending");
  return { kept, waiting, count: kept.length + waiting.length };
}

/* What a relative's Home offers next, or null:
     1. an open request to them for their side (never their own request,
        never one about their own story: requestsFor);
     2. else the newest family-readable memory, kept by `now`, that they
        didn't send and haven't added to yet.
   → { kind: "asked" | "new" | "from", kicker, storyId, memoryId, memory,
       request }. The kicker is sentence case; the screen sets it in caps.
   `viewer` is { userId, personId, name, stories }; `stories` the stories
   they can read; `requests` listOpenRequests; `contributions` what they
   sent (for "already added to"); `skip` memory ids to pass over. */
export function relativeNext(viewer, { stories = [], requests = [], contributions = [], now = new Date(), skip = [] } = {}) {
  const passed = new Set(skip || []);
  const asked = requestsFor(requests, viewer).find((r) => !passed.has(r.memoryId));
  if (asked) {
    const story = (stories || []).find((s) => s.id === asked.storyId) || null;
    return {
      kind: "asked",
      kicker: `${firstWord(asked.requesterName) || "Your family"} asked what you remember`,
      storyId: asked.storyId,
      memoryId: asked.memoryId,
      memory: story?.memories?.find((m) => m.id === asked.memoryId) || null,
      request: asked,
    };
  }
  const nowMs = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const added = new Set((contributions || []).filter((c) => isTheirs(c, viewer) && c.memoryId).map((c) => c.memoryId));
  let best = null;
  for (const story of stories || []) {
    for (const m of story?.memories || []) {
      if (!readable(m) || passed.has(m.id) || added.has(m.id) || isTheirs(m, viewer)) continue;
      const at = new Date(m.createdAt || 0).getTime();
      if (!Number.isFinite(at) || at > nowMs) continue;
      if (!best || at > best.at) best = { story, memory: m, at };
    }
  }
  if (!best) return null;
  const whose = `${firstWord(best.story.name) || "the family"}'s story`;
  const fresh = nowMs - best.at <= 7 * DAY_MS;
  return {
    kind: fresh ? "new" : "from",
    kicker: fresh ? `New in ${whose}` : `From ${whose}`,
    storyId: best.story.id,
    memoryId: best.memory.id,
    memory: best.memory,
    request: null,
  };
}

/* ── A person's page (j5-spec T row, j4-spec T-J4-3/5) ─────────────────── */

/* The memories in somebody's own story, kept: the count their page says
   ("14 memories in her story"). 0 with no story. */
export function memoriesInStory(person, stories = []) {
  const own = (stories || []).find((s) => s && person?.storyId && s.id === person.storyId);
  return own ? keptMemories(own).length : 0;
}

/* The memories somebody is in, from "Who's in it" (personIds) only, never
   a guess from a name in the text, in anybody's story: [{ story, memory }],
   newest first. */
export function memoriesAbout(person, stories = []) {
  const id = typeof person === "string" ? person : person?.id;
  if (!id) return [];
  const out = [];
  for (const story of stories || []) {
    for (const memory of keptMemories(story)) {
      if (Array.isArray(memory.personIds) && memory.personIds.includes(id)) out.push({ story, memory });
    }
  }
  return out.sort((a, b) => String(b.memory.createdAt || "").localeCompare(String(a.memory.createdAt || "")));
}

/* "In 2 of Rose's memories" when they all sit in one story, "In 3 of the
   family's memories" across several, "" for none. */
export function memoriesAboutLine(person, stories = []) {
  const list = memoriesAbout(person, stories);
  if (!list.length) return "";
  const ids = new Set(list.map((x) => x.story?.id));
  const whose = ids.size === 1 ? `${firstWord(list[0].story?.name) || "the family"}'s` : "the family's";
  return `In ${list.length === 1 ? "one" : list.length} of ${whose} memories`;
}

/* Who chose somebody's picture, when the row proves it: their first name,
   or "" (no photo, no photoBy, they chose it themselves, or the chooser
   isn't in the tree). The caption "Jamie chose this picture of you" shows
   only with this proof (j4-spec PL-J4-c). */
export function photoChooser(person, people = []) {
  if (!person?.photo || !person.photoBy) return "";
  if (person.userId && person.photoBy === person.userId) return "";
  const by = (people || []).find((p) => p && p.userId === person.photoBy);
  return by?.givenName || "";
}

/* The family as a register of portraits by generation (PHILOSOPHY §5),
   relative to the storyteller: her parents' generation, her own, her
   children's, her grandchildren's. Each group keeps the roster's order
   (the storyteller, you, then on A Story, invited, the rest) and its rows
   (lib/familyRoster: one of the three state phrases each). Somebody the
   tree doesn't connect to her yet goes last, under "Also in the family".
   The remembered stay apart, as the roster keeps them.
     [{ key, gen, label, rows }]                                          */
export function familyByGeneration(family, { subjectId = null, youId = null, name = "", you = false } = {}) {
  const { rows, remembered } = rosterOf(family, { subjectId, youId });
  const gen = generationsFrom(family, subjectId);
  const groups = new Map();
  for (const row of rows) {
    const g = gen.has(row.person.id) ? gen.get(row.person.id) : null;
    const key = g == null ? "apart" : String(g);
    if (!groups.has(key)) groups.set(key, { key, gen: g, label: generationLabel(g, { name, you }), rows: [] });
    groups.get(key).rows.push(row);
  }
  const list = [...groups.values()].sort((a, b) => (a.gen == null) - (b.gen == null) || (a.gen ?? 0) - (b.gen ?? 0));
  return { groups: list, remembered };
}

/* How many generations from the storyteller each person stands (her
   parents -1, her children 1), along parent and partner lines only. */
export function generationsFrom(family, subjectId) {
  const out = new Map();
  if (!subjectId) return out;
  const edges = family?.edges || [];
  out.set(subjectId, 0);
  const queue = [subjectId];
  while (queue.length) {
    const id = queue.shift();
    const g = out.get(id);
    for (const e of edges) {
      let next = null;
      let ng = g;
      if (e.kind === "parent" && e.from === id) [next, ng] = [e.to, g + 1];
      else if (e.kind === "parent" && e.to === id) [next, ng] = [e.from, g - 1];
      else if (e.kind === "spouse" && (e.from === id || e.to === id)) next = e.from === id ? e.to : e.from;
      if (next && !out.has(next)) {
        out.set(next, ng);
        queue.push(next);
      }
    }
  }
  return out;
}

const GENERATION_WORDS = { "-2": "grandparents", "-1": "parents", 1: "children", 2: "grandchildren", 3: "great-grandchildren" };

/* A generation's name, carrying the storyteller's own name ("Rose's
   generation", "Rose's children"), never a pronoun for her. On her own
   phone: "Your generation", "Your children". */
export function generationLabel(gen, { name = "", you = false } = {}) {
  if (gen == null) return "Also in the family";
  const whose = you ? "Your" : `${firstWord(name) || "Their"}'s`;
  if (gen === 0) return `${whose} generation`;
  const word = GENERATION_WORDS[gen];
  return word ? `${whose} ${word}` : gen < 0 ? "Further back" : "Further down the family";
}

/* A storyteller's friends: their own circle, never in the family tree or
   its headcount (FB-284). Each in one of the three state phrases, read
   from the row the way the roster reads a relative's: on A Story once they
   took the friend link, invited · waiting for them while it is unanswered,
   not on A Story yet otherwise. Joined first, then invited, then the rest. */
export function friendsOf(family, storyId) {
  const rank = { joined: 0, invited: 1, listed: 2 };
  const nameOf = (p) => [p?.givenName, p?.familyName].filter(Boolean).join(" ");
  return (family?.friends || [])
    .filter((f) => f && (!storyId || f.storyId === storyId) && (f.givenName || f.familyName))
    .map((f) => {
      const state = f.userId ? "joined" : f.invitedAt ? "invited" : "listed";
      return { person: f, state, words: ROSTER_WORDS[state] };
    })
    .sort((a, b) => rank[a.state] - rank[b.state] || nameOf(a.person).localeCompare(nameOf(b.person)));
}

/* ── Who keeps a story (FB-326 item 3, S-PL8) ───────────────────────── */

/* The story's keepers, owner first, each as the tree knows them: the
   owner (the story's, else whoever put the storyteller in the tree), then
   every co-keeper whose "Can they edit?" was taken up (story_managers,
   active). The book's colophon (lib/legacyBook bookKeepers) and the Family
   tab read the same rows, so a truth test can hold them to one answer.
   → [{ userId, givenName, familyName, name, owner }] */
export function keepersOf(story, people = [], managers = []) {
  const list = people || [];
  const subject = story?.id ? list.find((p) => p && p.storyId === story.id) : null;
  const ownerId = story?.ownerId || subject?.createdBy || null;
  const out = [];
  const add = (userId, owner) => {
    if (!userId || out.some((k) => k.userId === userId)) return;
    const p = list.find((x) => x && x.userId === userId) || null;
    const name = [p?.givenName, p?.familyName].filter(Boolean).join(" ").trim() || (owner ? String(story?.ownerName || "").trim() : "");
    if (!name && !p) return;
    out.push({ userId, givenName: p?.givenName || firstWord(name), familyName: p?.familyName || "", name, owner });
  };
  add(ownerId, true);
  for (const m of managers || []) if (m && m.status === "active" && m.user_id && m.user_id !== ownerId) add(m.user_id, false);
  return out;
}

/* "Jamie keeps Rose's story", "Jamie and Linh keep Rose's story". */
export function keepersLine(story, keepers = []) {
  const names = (keepers || []).map((k) => k.givenName).filter(Boolean);
  if (!names.length) return "";
  const who = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  const whose = firstWord(story?.name) ? `${firstWord(story.name)}’s` : "the";
  return `${who} ${names.length === 1 ? "keeps" : "keep"} ${whose} story`;
}
