// The next question, from the memory just kept.
//
// The bank asks what a life holds; a follow-up asks what this memory left
// out. Rose says "my father's tomatoes against the south wall", and the
// best next question isn't another chapter, it's "What else did your
// father grow against the south wall?" (owner, 20 Oct: "dig deeper and ask
// more about that experience"). So after a keep, the day's first question
// is one of these, on that memory; once it is answered, the day's arc
// resumes (lib/todayQuestion.js).
//
// Made here, on the phone, from the memory's own fields: who is tagged in
// it, the place and the thing it names, its year and season, its title,
// the line it was kept by, and what she said on the call. No server, so it
// works offline, in the demo, and on the first day. The AI server can do
// better (POST /api/memory/help, mode "questions"); fetchFollowUps asks it
// when SERVER_FEATURES.memoryHelp is on and falls back to these.
//
// The rules, the bank's own:
//   - one question, warm and plain, in Bao's voice; answerable on a call;
//   - a named person is never "they" (FB-174): she/he from the tree, or
//     the name again;
//   - "it" is never left pointing at nothing (FB-354: "How does Rose
//     remember it?" under a print that says no title): a question about
//     the memory names it ({it}: "the move", or its title in quotes), and
//     a memory with no title gets none of those questions;
//   - never the question the memory already answered, nor one A Story
//     already asked on that call (PF-1);
//   - every follow-up files into a chapter the book prints (the memory's
//     own, except a family memory, whose answer is the storyteller's);
//   - each wording is a whole sentence with {tokens}, kept in one table
//     (STRINGS), so a translation replaces the table, never the grammar.
//
// Pure, so node tests it (scripts/tests/questions.mjs).

import { normaliseEra, FAMILY_CHAPTER } from "../data/eras.js";
import { serverOffers } from "./serverFeatures.js";

// How long after a keep its follow-up leads: the day it was kept and the
// day after. Past that, the day's arc has the floor again.
export const FOLLOW_UP_DAYS = 2;
// Every follow-up's id starts with this, so a memory kept from one stores
// it as its questionId and the deck knows it was a follow-up's answer.
export const FOLLOW_UP_PREFIX = "fu:";

export const isFollowUpId = (id) => String(id || "").startsWith(FOLLOW_UP_PREFIX);

/* Every wording, by kind: `told` to the storyteller, `about` to a relative
   (who is asked it as "Ask Rose", the relay the bank's ask-them rows use).
   Tokens: {owner} "your father" / "Rose's father"; {at} "against the south
   wall"; {place} "the garden"; {thing} "tomatoes"; {who} "your husband";
   {name} the storyteller; {her} her/his/the name's; {age} "ten"; {season}
   "summer"; {year} "1955"; {other} a relative's given name; {title} the
   memory's title; {event} "the move"; {it} the memory, named: "the move",
   "your father's shop", or the title in quotes when it isn't a plain noun
   phrase ("“Lavender soap and onions frying”"). */
export const STRINGS = {
  sourceLine: "Following on from “{title}”",
  differently: {
    told: "{other} remembers {it} differently. What do you make of that?",
    about: "{other} remembers {it} differently. What does {name} make of that?",
  },
  grow_owner_at: {
    told: "What else did {owner} grow {at}?",
    about: "What else did {owner} grow {at}?",
  },
  grow_owner: {
    told: "What else did {owner} grow?",
    about: "What else did {owner} grow?",
  },
  family_side: {
    told: "{other} kept a memory of you: “{title}”. How do you remember it?",
    about: "{other} kept “{title}”. How does {name} remember {it}?",
  },
  place_walk: {
    told: "Walk me through {place}. What do you see first?",
    about: "What would {name} see first, walking into {place}?",
  },
  person: {
    told: "What else do you remember about {who} back then?",
    about: "What else does {name} remember about {who} back then?",
  },
  sense_song: {
    told: "Can you still sing a line of the song?",
    about: "Can {name} still sing a line of the song?",
  },
  sense_smell: {
    told: "What else could you smell there?",
    about: "What else could {name} smell there?",
  },
  sense_cold: {
    told: "How did you all keep warm?",
    about: "How did {name}'s family keep warm?",
  },
  food: {
    told: "Who made the {thing}, and how did {it} taste?",
    about: "Who made the {thing} {name} remembers, and how did {it} taste?",
  },
  grow_self: {
    told: "What did you grow after the {thing}?",
    about: "What did {name} grow after the {thing}?",
  },
  with_person: {
    told: "What would {other} remember about {it} that you don't?",
    about: "What would {other} remember about {it} that {name} doesn't?",
  },
  age_season: {
    told: "You were {age} that {season}. What else filled your days?",
    about: "{name} was {age} that {season}. What else filled {her} days?",
  },
  age_year: {
    told: "You were {age} in {year}. What else was going on for you?",
    about: "{name} was {age} in {year}. What else was going on then?",
  },
  year: {
    told: "What else do you remember from {year}?",
    about: "What else does {name} remember from {year}?",
  },
  after: {
    told: "What came after {event}?",
    about: "What came after {event}, for {name}?",
  },
  lesson: {
    told: "Who taught you that, or did you learn it the hard way?",
    about: "Who taught {name} that?",
  },
  who_else: {
    told: "Who else was there, and what do they remember?",
    about: "Who else was there with {name}?",
  },
  hint: "Whatever comes first. A name, a smell, a day.",
};

// Preference, best first: the most specific question a memory can carry.
const ORDER = [
  "grow_owner_at",
  "family_side",
  "differently",
  "place_walk",
  "grow_owner",
  "person",
  "sense_song",
  "sense_smell",
  "sense_cold",
  "grow_self",
  "after",
  "with_person",
  "age_season",
  "age_year",
  "year",
  "food",
  "lesson",
  "who_else",
];
// How far in each kind reaches, on the bank's ladder (build-questions.mjs).
const DEPTH = { person: 3, with_person: 3, differently: 3, family_side: 3, lesson: 4 };

const RELATIONS = "father|mother|dad|mom|mum|mama|papa|grandmother|grandfather|grandma|grandpa|husband|wife|aunt|uncle|brother|sister|son|daughter";
const PLANTS = new Set("tomatoes tomato beans apples apple roses flowers vegetables potatoes corn peppers strawberries peas lettuce cabbages herbs plums cherries peaches pumpkins squash cucumbers onions".split(" "));
const FOODS = new Set("oatmeal chicken bread pie soup cake stew cookies biscuits jam pancakes rice noodles dumplings porridge fish".split(" "));
const PLACES = "garden|kitchen|sink|stove|porch|yard|shop|store|street|lake|field|farm|church|school|market|table|tree|door|window|river|beach|room|house|plot|wall|corner|attic|barn|orchard";
// The places a person can be walked through, room by room.
const WALKABLE = /\b(garden|kitchen|porch|yard|shop|store|farm|church|school|market|room|house|plot|attic|barn|orchard)\b/i;
const SEASONS = /\b(summer|winter|spring|autumn|fall)\b/i;
const YEAR = /\b(1[89]\d\d|20\d\d)\b/;

const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const fillIn = (t, v) => t.replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? v[k] : m));

/* 1–99 in words, for "You were ten that summer"; digits past that. */
const ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" ");
const TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split(" ");
export function ageWords(n) {
  if (!Number.isInteger(n) || n < 0) return "";
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : "");
  return String(n);
}

/* What she said: the kept line, the body and her own turns on the call. */
function saidText(m) {
  const turns = (m.transcript || []).filter((t) => t && t.speaker !== "assistant").map((t) => t.text);
  return clean([m.keptLine, m.body, ...turns].filter(Boolean).join(" "));
}

/* What A Story already asked on that call, and the question it answered. */
function askedAlready(m) {
  return [m.prompt, ...(m.transcript || []).filter((t) => t?.speaker === "assistant").map((t) => t.text)].filter(Boolean);
}

const content = (s) =>
  new Set(
    String(s || "")
      .toLowerCase()
      .replace(/[’']/g, "")
      .split(/[^a-z]+/)
      .filter((w) => w.length >= 4 && !/^(what|when|where|which|with|that|there|this|your|else|they|them|have|from|then|about|remember)$/.test(w))
      .map((w) => w.slice(0, 5))
  );
/* The same question in other words: the same kind of question (what, why,
   who…) and nearly all of each in the other. "What else did your father
   grow against the south wall?" isn't "Your father's tomatoes, against the
   south wall. Why there?", though it shares most of its words. */
const WH = /\b(what|why|who|whose|where|when|which|how|did|do|does|can|could|was|were|is|are)\b/i;
function whOf(s) {
  const asked = String(s || "").split(/(?<=[.!?])\s+/).filter((x) => /\?\s*$/.test(x));
  return ((asked[asked.length - 1] || String(s || "")).match(WH)?.[1] || "").toLowerCase();
}
function sameQuestion(a, b) {
  // Word for word, or one is the end of the other ("Why there?" closes
  // "Your father's tomatoes, against the south wall. Why there?").
  const flat = (s) => String(s || "").toLowerCase().replace(/[^a-z]+/g, " ").trim();
  const [fa, fb] = [flat(a), flat(b)];
  if (fa && fb && (fa === fb || fa.endsWith(fb) || fb.endsWith(fa))) return true;
  if (whOf(a) !== whOf(b)) return false;
  const x = content(a);
  const y = content(b);
  if (!x.size || !y.size) return false;
  let hit = 0;
  for (const w of x) if (y.has(w)) hit += 1;
  return hit / x.size >= 0.75 && hit / y.size >= 0.75;
}

/* The family, read once: people by id and who is whose parent or spouse. */
function familyIndex(family) {
  const people = new Map((family?.people || []).filter(Boolean).map((p) => [p.id, p]));
  const parents = new Map();
  const spouses = new Map();
  for (const e of family?.edges || []) {
    if (!e) continue;
    if (e.kind === "parent") parents.set(e.to, [...(parents.get(e.to) || []), e.from]);
    if (e.kind === "spouse") {
      spouses.set(e.from, [...(spouses.get(e.from) || []), e.to]);
      spouses.set(e.to, [...(spouses.get(e.to) || []), e.from]);
    }
  }
  return { people, parents, spouses };
}

/* What `id` is to the teller, as a word: "father", "husband",
   "daughter"… or "" when the tree doesn't connect them simply. */
function relationWord(ix, tellerId, id) {
  const p = ix.people.get(id);
  if (!p || !tellerId) return "";
  const sex = p.sex;
  const pick = (f, m, n) => (sex === "F" ? f : sex === "M" ? m : n);
  const parentsOf = (x) => ix.parents.get(x) || [];
  if (parentsOf(tellerId).includes(id)) return pick("mother", "father", "parent");
  if (parentsOf(id).includes(tellerId)) return pick("daughter", "son", "child");
  if ((ix.spouses.get(tellerId) || []).includes(id)) return pick("wife", "husband", "partner");
  if (parentsOf(tellerId).some((x) => parentsOf(x).includes(id))) return pick("grandmother", "grandfather", "grandparent");
  if (parentsOf(id).some((x) => parentsOf(x).includes(tellerId))) return pick("granddaughter", "grandson", "grandchild");
  return "";
}

/* The memory's title as something to say after "What came after…":
   "The move" → "the move", "My father's shop, before any of us" → "your
   father's shop". Null when the title isn't a plain noun phrase. */
function eventPhrase(title, voice) {
  const head = clean(String(title || "").split(/[:,;—–]/)[0]);
  const m = head.match(/^(the|my|our)\s+(.+)$/i);
  if (!m || head.split(" ").length > 6) return null;
  // Titles are in sentence case: the first word was the capital, so the
  // rest keeps its own ("the summer in Vermont").
  const rest = m[2];
  const det = m[1].toLowerCase();
  if (det === "the") return `the ${rest}`;
  if (det === "our") return `the family's ${rest}`;
  return `${voice.my} ${rest}`;
}

/* A memory's title, or "" when it is a sentence left unfinished (FB-452):
   it ends on a word a phrase can't end on ("of", "the", "and", "my") or on
   a verb still waiting for its object ("made", "smelled", "was"). Such a
   title is never quoted back in a question. */
const UNFINISHED = /^(the|a|an|of|to|in|on|at|by|for|from|and|or|but|with|my|our|her|his|their|your|its|she|he|they|we|i|that|this|was|were|is|had|made|smelled|smelt|felt|said|kept|took|gave|wore|cooked|baked|sang|loved|used|would|could|always|never|like|about|into|when|while|because|so|than)$/i;
export function wholeTitle(title) {
  const t = clean(title);
  if (!t) return "";
  if (/[.!?…”"]$/.test(t)) return t;
  const last = (t.split(" ").pop() || "").replace(/[^A-Za-z’']/g, "");
  return UNFINISHED.test(last) ? "" : t;
}

/* The memory as the thing a question asks about ({it}, FB-354): its title
   as a phrase ("the move", "your father's shop"), else the title itself in
   quotes, else null, and the questions that need it are skipped. */
function itPhrase(title, voice) {
  const t = clean(title);
  if (!t) return null;
  return eventPhrase(t, voice) || `“${t.replace(/[.!?]+$/, "")}”`;
}

/* "against the south wall": a preposition and a place the memory names. */
function placeAt(text) {
  const m = text.match(new RegExp(`\\b(against|by|at|in|on|under|behind|near|outside|beside|along) the ((?:[a-z]+ )?(?:${PLACES}))\\b`, "i"));
  if (!m) return null;
  const place = `the ${m[2].toLowerCase()}`;
  return { at: `${m[1].toLowerCase()} ${place}`, place, walkable: WALKABLE.test(place) };
}

/* "the garden", "the house with the blue door": a place the title names. */
function titlePlace(title, voice) {
  const ev = eventPhrase(title, voice);
  return ev && WALKABLE.test(ev) ? ev : null;
}

/* "my father's tomatoes" → { owner: "father", thing: "tomatoes" }. */
function ownedThing(text) {
  const re = new RegExp(`\\bmy (${RELATIONS})['’]s ([a-z]+)`, "gi");
  let m;
  while ((m = re.exec(text))) {
    const thing = m[2].toLowerCase();
    if (PLANTS.has(thing) || FOODS.has(thing)) return { owner: m[1].toLowerCase(), thing };
  }
  return null;
}

function firstWord(text, set) {
  for (const w of text.toLowerCase().split(/[^a-z]+/)) if (set.has(w)) return w;
  return null;
}

/* The storyteller, from the story and the tree. */
function tellerOf(story, ix) {
  const person = [...ix.people.values()].find((p) => story?.id && p.storyId === story.id) || null;
  const name = clean(story?.name) || person?.givenName || "";
  const sex = person?.sex || null;
  const born = Number(person?.birthYear || story?.birthYear) || null;
  return { id: person?.id || null, name, sex, born };
}

/* One memory's follow-ups, best first. Each is a question the deck can
   carry like one from the bank:
     { id, question, alt, about, era, depth, sensitive: null, tags, topic,
       hint, followUp: null, kind, followsFrom: { memoryId, title },
       voice, askThem }
   ctx: { story, family: { people, edges }, voice: "storyteller" | "about",
          pronoun: "she" | "he" | null, sides: [{ name }] } */
export function followUpsFor(memory, ctx = {}) {
  if (!memory || !memory.id) return [];
  const ix = familyIndex(ctx.family);
  const teller = tellerOf(ctx.story, ix);
  const name = teller.name || "them";
  const pronoun = ctx.pronoun !== undefined ? ctx.pronoun : teller.sex === "F" ? "she" : teller.sex === "M" ? "he" : null;
  const her = pronoun === "she" ? "her" : pronoun === "he" ? "his" : `${name}'s`;
  const told = { my: "your", name };
  const about = { my: her, name };

  // A title that is the start of a sentence never finished ("Rose's house
  // smelled of", "On Sundays my mother made": the guide's starter kept
  // as it was typed) is never quoted or named (FB-452): the questions that
  // need the memory named are skipped, and no "Following on from" line.
  const title = wholeTitle(memory.title);
  const text = saidText(memory);
  const era = normaliseEra(memory.era);
  const family = era === FAMILY_CHAPTER || !!clean(memory.contributor);
  const year = Number((String(memory.period || "").match(YEAR) || [])[1]) || null;
  const season = (String(memory.period || "").match(SEASONS) || title.match(SEASONS) || [])[1]?.toLowerCase() || null;
  const age = year && teller.born && year >= teller.born ? year - teller.born : null;

  // The values each kind needs, in each voice, or null when this memory
  // doesn't carry what that kind asks about.
  const make = {};
  const owned = ownedThing(text);
  const at = placeAt(text);
  if (owned && PLANTS.has(owned.thing)) {
    const v = { owner: `your ${owned.owner}` };
    const a = { owner: `${name}'s ${owned.owner}` };
    if (at) make.grow_owner_at = [{ ...v, at: at.at }, { ...a, at: at.at }];
    make.grow_owner = [v, a];
  }
  const contributorName = clean(memory.contributor).split(/[,(]/)[0].trim();
  // The memory named, in each voice: null without a title (FB-354).
  const it = [itPhrase(title, told), itPhrase(title, about)];
  if (family && contributorName && it[1]) make.family_side = [{ other: contributorName, title, it: it[0] }, { other: contributorName, title, name, it: it[1] }];
  const side = (ctx.sides || memory.sides || []).map((s) => clean(s?.name || s?.author || s?.givenName)).find(Boolean);
  if (side && !family && it[0]) make.differently = [{ other: side, it: it[0] }, { other: side, name, it: it[1] }];
  const place = titlePlace(title, told) ? [titlePlace(title, told), titlePlace(title, about)] : at?.walkable && !owned ? [at.place, at.place] : null;
  if (place) make.place_walk = [{ place: place[0] }, { place: place[1], name }];

  // The people tagged in it, nearest first; the teller never.
  const tagged = (memory.personIds || []).map((id) => ix.people.get(id)).filter((p) => p && p.id !== teller.id);
  const rel = tagged.map((p) => ({ p, word: relationWord(ix, teller.id, p.id) }));
  const nearest = rel.find((r) => r.word) || rel[0];
  if (nearest && !family) {
    const who = nearest.word ? `your ${nearest.word}` : nearest.p.givenName;
    const whoAbout = nearest.word ? `${her} ${nearest.word}` : nearest.p.givenName;
    make.person = [{ who }, { who: whoAbout, name }];
  }
  const living = tagged.find((p) => !p.deathYear && p.givenName);
  if (living && !family && it[0]) make.with_person = [{ other: living.givenName, it: it[0] }, { other: living.givenName, name, it: it[1] }];

  if (/\b(sang|sing|singing|song|hymn|hummed)\b/i.test(`${title} ${text}`)) make.sense_song = [{}, { name }];
  if (/\b(smell|smelled|smelt|scent)\b/i.test(text)) make.sense_smell = [{}, { name }];
  if (/\b(froze|frozen|freezing|snowed|blizzard)\b/i.test(`${title} ${text}`) || /\bwinter\b/i.test(title)) make.sense_cold = [{}, { name }];
  const food = firstWord(text, FOODS);
  // "how did they taste" for pancakes, "how did it taste" for the soup.
  const they = (t) => (/s$/.test(t) && !/(ss|us)$/.test(t) ? "they" : "it");
  if (food) make.food = [{ thing: food, it: they(food) }, { thing: food, name, it: they(food) }];
  const plant = !owned ? firstWord(text, PLANTS) : null;
  if (plant && /\bgarden|grew|grow|plot\b/i.test(text + title)) make.grow_self = [{ thing: plant }, { thing: plant, name }];

  if (age != null && season) make.age_season = [{ age: ageWords(age), season }, { age: ageWords(age), season, name, her }];
  else if (age != null) make.age_year = [{ age: ageWords(age), year }, { age: ageWords(age), year, name }];
  else if (year) make.year = [{ year }, { year, name }];
  const event = eventPhrase(title, told);
  if (event && !family && !place) make.after = [{ event }, { event: eventPhrase(title, about), name }];
  if (era === "Looking back") make.lesson = [{}, { name }];
  make.who_else = [{}, { name }];

  const already = askedAlready(memory);
  const out = [];
  for (const kind of ORDER) {
    if (!make[kind]) continue;
    const [tv, av] = make[kind];
    const question = fillIn(STRINGS[kind].told, tv);
    const aboutQ = fillIn(STRINGS[kind].about, { ...av, name: av.name || name });
    if (/\{\w+\}/.test(question) || /\{\w+\}/.test(aboutQ)) continue;
    if (already.some((q) => sameQuestion(q, question))) continue;
    const id = `${FOLLOW_UP_PREFIX}${memory.id}:${kind}`;
    const relative = ctx.voice === "about";
    out.push({
      id,
      question: relative ? aboutQ : question,
      alt: relative ? question : aboutQ,
      about: aboutQ,
      // A family memory's follow-up is answered by the storyteller about
      // her own family life: filed there, never under somebody else's name.
      era: family ? "Love & family" : era,
      depth: DEPTH[kind] || 2,
      sensitive: null,
      tags: ["follow-up"],
      topic: "follow-up",
      hint: STRINGS.hint,
      followUp: null,
      kind,
      followsFrom: { memoryId: memory.id, title },
      voice: relative ? "about" : "storyteller",
      // To a relative it is Rose's memory to tell: "Ask Rose" (the bank's
      // ask-them relay), never a blank page asking for what Jamie can't know.
      askThem: relative,
    });
  }
  return out;
}

/* The quiet line above a follow-up: "Following on from “The garden,
   finally”". "" for a question from the bank. */
export function followUpSource(question, strings = STRINGS) {
  const title = clean(question?.followsFrom?.title);
  return title ? fillIn(strings.sourceLine, { title }) : "";
}

const dayIndex = (d) => {
  const t = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(t.getTime())) return null;
  return Math.floor(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) / 86400000);
};
const keyIndex = (key) => {
  const [y, m, d] = String(key || "").split("-").map(Number);
  return y && m && d ? Math.floor(Date.UTC(y, m - 1, d) / 86400000) : null;
};

/* The memory whose follow-up leads today, or null: the newest kept memory,
   kept today or yesterday (FOLLOW_UP_DAYS), that wasn't itself the answer
   to a follow-up (one follow-up per keep, then the arc resumes). `key` is
   the day, "2026-10-20". */
export function memoryToFollow(memories, { key, days = FOLLOW_UP_DAYS, story = null, family = null } = {}) {
  const today = keyIndex(key) ?? dayIndex(new Date());
  const kept = (memories || [])
    .filter((m) => m && m.id && m.status !== "in_progress" && m.createdAt)
    .slice()
    .map((m) => ({ m, t: Date.parse(m.createdAt) }))
    .filter((x) => Number.isFinite(x.t))
    .sort((a, b) => b.t - a.t)
    .map((x) => x.m);
  const newest = kept[0];
  if (!newest || isFollowUpId(newest.questionId)) return null;
  // A voice note kept without its words yet (QW6/QW7: the uploader's note,
  // an empty body) has nothing to follow on from.
  if (newest.note || !saidText(newest)) return null;
  // A follow-up answered in writing may carry only its words (Home's
  // "or write it" doesn't pass the id yet): known by matching them against
  // the follow-ups of the memories just before it.
  const asked = clean(newest.prompt);
  if (asked && kept.slice(1, 6).some((m) => followUpsFor(m, { story, family }).some((q) => clean(q.question) === asked || clean(q.about) === asked))) {
    return null;
  }
  const at = dayIndex(newest.createdAt);
  if (at == null || today - at < 0 || today - at >= days) return null;
  return newest;
}

/* What was already answered, by id or by the words asked (PF-1). */
function answered(memories) {
  const ids = new Set();
  const texts = new Set();
  for (const m of memories || []) {
    if (!m) continue;
    if (m.questionId) ids.add(String(m.questionId));
    if (m.prompt) texts.add(clean(m.prompt));
    if (m.title) texts.add(clean(m.title));
  }
  return (q) => ids.has(q.id) || texts.has(clean(q.question)) || texts.has(clean(q.alt));
}

/* Today's follow-up for `story`, in `voice`, or null. The one the deck
   leads with after a keep. `server`: questions the AI server already gave
   for this memory (fetchFollowUps), used ahead of the local ones. */
export function leadFollowUp({ story, family, key, voice = "storyteller", pronoun, server = null } = {}) {
  const memories = story?.memories || [];
  const m = memoryToFollow(memories, { key, story, family });
  if (!m) return null;
  const done = answered(memories);
  const local = followUpsFor(m, { story, family, voice, pronoun });
  const fromServer = server && server.memoryId === m.id ? server.questions || [] : [];
  return [...fromServer, ...local].find((q) => !done(q)) || null;
}

/* The server's follow-ups for one memory, shaped like the local ones, or
   the local ones when the server is off, offline or wrong. `help` is
   data/api.js helpWrite (passed in, so this file stays pure); `offers` is
   lib/serverFeatures.js serverOffers. Resolves to { memoryId, questions }. */
export async function fetchFollowUps(memory, ctx = {}, { help, offers = serverOffers } = {}) {
  const local = followUpsFor(memory, ctx);
  if (!memory || !help || !offers("memoryHelp")) return { memoryId: memory?.id || null, questions: local, source: "local" };
  try {
    const teller = clean(ctx.story?.name);
    const res = await help({ mode: "questions", text: saidText(memory) || clean(memory.title), about: ctx.voice === "about" ? teller : "" });
    const asked = askedAlready(memory);
    const qs = (res?.questions || [])
      .map(clean)
      .filter((q) => q && q.length <= 120 && /\?$/.test(q) && !asked.some((a) => sameQuestion(a, q)))
      .slice(0, 3)
      .map((q, i) => ({
        ...(local[0] || {}),
        id: `${FOLLOW_UP_PREFIX}${memory.id}:server${i}`,
        question: q,
        alt: null,
        about: null,
        kind: "server",
        depth: 2,
        askThem: ctx.voice === "about",
        followsFrom: { memoryId: memory.id, title: clean(memory.title) },
        era: local[0]?.era || normaliseEra(memory.era),
      }));
    return qs.length ? { memoryId: memory.id, questions: [...qs, ...local], source: "server" } : { memoryId: memory.id, questions: local, source: "local" };
  } catch {
    return { memoryId: memory.id, questions: local, source: "local" };
  }
}
