// Who is in a memory: the people in the family tree somebody said were
// there (memories.person_ids, supabase/memory_people.sql).
//
// Asked once, as the memory is saved — "Who's in this memory?" — with the
// likeliest people offered first, so a grandparent taps two faces rather
// than scrolling a roster:
//
//   1. anybody the memory names: their full name, their first name as a
//      word (long enough not to catch everything, and only when one person
//      in the tree has it), or how the storyteller says the one person
//      they have of that kind ("my father", "my wife");
//   2. the storyteller's closest family: partners, parents, children,
//      brothers and sisters;
//   3. whoever told it, when it isn't the storyteller;
//   4. and then everyone else, under "Everyone in the family".
//
// The ones the memory names are ticked to begin with; a name is a strong
// hint, and taking a wrong tick off is one tap. Nobody else is ever ticked
// for the person. Pure, so it's tested.

import { fullName } from "./familyGraph.js";

const MIN_FIRST_NAME = 3;
const SUGGESTED = 6;

const fold = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const word = (w) => new RegExp(`(^|[^\\p{L}])${escape(w)}($|[^\\p{L}])`, "u");

/* Somebody who's only a box on the tree (no name yet) can't be in a memory. */
const named = (p) => !!p && !!String(p.givenName || p.familyName || "").trim();

/* How a storyteller says the one person they have of each kind, and how to
   find that person from them. Only kinds a person has one of. */
const SAID = [
  { words: ["my father", "my dad", "my papa", "my pa"], find: (ix, id) => parent(ix, id, "M") },
  { words: ["my mother", "my mum", "my mom", "my mama", "my ma"], find: (ix, id) => parent(ix, id, "F") },
  { words: ["my husband"], find: (ix, id) => partner(ix, id, "M") },
  { words: ["my wife"], find: (ix, id) => partner(ix, id, "F") },
];
function only(ids) {
  return ids.length === 1 ? ids[0] : null;
}
function parent(ix, id, sex) {
  return only((ix.parentsOf.get(id) || []).filter((p) => ix.people.get(p)?.sex === sex));
}
function partner(ix, id, sex) {
  return only((ix.spousesOf.get(id) || []).filter((p) => ix.people.get(p)?.sex === sex));
}

/* The people a memory's words point at, in the order they first appear. */
export function namedIn(text, index, storytellerId = null) {
  const t = fold(text);
  if (!t.trim() || !index?.people) return [];
  const people = [...index.people.values()].filter(named);

  // A first name only counts when it's nobody else's too.
  const firstCount = new Map();
  for (const p of people) {
    const f = fold(p.givenName).trim();
    if (f) firstCount.set(f, (firstCount.get(f) || 0) + 1);
  }

  const hits = [];
  const hit = (id, at) => {
    if (at < 0 || !id) return;
    const was = hits.find((h) => h.id === id);
    if (!was) hits.push({ id, at });
    else if (at < was.at) was.at = at;
  };

  for (const p of people) {
    const full = fold(fullName(p)).trim();
    if (full.includes(" ")) hit(p.id, t.indexOf(full));
    const first = fold(p.givenName).trim();
    if (first.length >= MIN_FIRST_NAME && firstCount.get(first) === 1) {
      const m = word(first).exec(t);
      if (m) hit(p.id, m.index);
    }
  }

  if (storytellerId && index.people.has(storytellerId)) {
    for (const { words, find } of SAID) {
      const at = Math.min(
        ...words.map((w) => {
          const m = word(w).exec(t);
          return m ? m.index : Infinity;
        })
      );
      if (at !== Infinity) hit(find(index, storytellerId), at);
    }
  }

  return hits
    .filter((h) => h.id !== storytellerId)
    .sort((a, b) => a.at - b.at)
    .map((h) => h.id);
}

/* The storyteller's closest family, nearest first. */
function closest(index, id) {
  if (!id) return [];
  const parents = index.parentsOf.get(id) || [];
  const siblings = [
    ...new Set(parents.flatMap((p) => index.childrenOf.get(p) || []).filter((x) => x !== id)),
  ];
  return [
    ...(index.spousesOf.get(id) || []),
    ...parents,
    ...(index.childrenOf.get(id) || []),
    ...siblings,
  ];
}

/* What the "Who's in this memory?" step shows.

   { suggested, others, preselected } — person ids. `suggested` are the
   faces offered first (at most six, then anybody already tagged on the
   memory), `others` everyone else in the tree, `preselected` the ones to
   tick when nothing has been chosen yet. The storyteller is never offered:
   a memory in Rose's story is already on Rose's page.

   `chosen` is what the memory was tagged with when the step opened, not
   what's ticked now: the faces mustn't move under somebody's finger. */
export function whoSuggestions({ text = "", index, storytellerId = null, authorId = null, chosen = [] }) {
  if (!index?.people) return { suggested: [], others: [], preselected: [] };
  const ok = (id) => id && id !== storytellerId && named(index.people.get(id));
  const names = namedIn(text, index, storytellerId).filter(ok);

  const order = [];
  const add = (id) => {
    if (ok(id) && !order.includes(id)) order.push(id);
  };
  names.forEach(add);
  closest(index, storytellerId).forEach(add);
  add(authorId);

  const suggested = order.slice(0, SUGGESTED);
  for (const id of chosen || []) if (ok(id) && !suggested.includes(id)) suggested.push(id);
  const others = [...index.people.values()]
    .filter((p) => ok(p.id) && !suggested.includes(p.id))
    .sort((a, b) => fullName(a).localeCompare(fullName(b)))
    .map((p) => p.id);
  return { suggested, others, preselected: names };
}

/* Tick or untick one person. */
export function togglePerson(ids, id) {
  const list = Array.isArray(ids) ? ids : [];
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/* The ids still in the tree, in the order given — somebody removed from
   the tree since drops off quietly rather than showing as "Unknown". */
export function peopleIn(ids, index) {
  return (Array.isArray(ids) ? ids : []).filter((id) => named(index?.people?.get(id)));
}

/* "Hưng", "Hưng and Mai", "Hưng, Mai and Rose", "Hưng, Mai and 3 more". */
export function whoLine(ids, index, max = 3) {
  const names = peopleIn(ids, index).map((id) => index.people.get(id).givenName || fullName(index.people.get(id)));
  if (!names.length) return "";
  if (names.length === 1) return names[0];
  if (names.length <= max) return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return `${names.slice(0, max - 1).join(", ")} and ${names.length - (max - 1)} more`;
}
