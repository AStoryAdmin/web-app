// Working out what one person is to another.
//
// The database stores exactly two kinds of edge — `parent` and `spouse` — and
// everything a family actually says out loud is derived here. See the long
// note in supabase/family.sql for why: a stored "grandmother" can disagree
// with the parent edges underneath it, has to be written twice for the two
// directions, and has nothing to say when somebody later fills in the
// generation in between. A derivation cannot disagree with itself.
//
// Pure, like everything in src/lib — no React Native imports, so
// scripts/test-lib.mjs can run it in plain node. The clock is injected.
//
// Vocabulary, because kinship terms are easy to get backwards:
//   "up"   — towards parents
//   "down" — towards children
//   A path of (up = dA, down = dB) from A to their common ancestor with B and
//   back down to B is enough to name every blood relation there is.

/* An adjacency index. Built once per graph and handed to everything else,
   because a family of four hundred (see gedcom.js) shouldn't be re-scanned
   for every label drawn on screen. */
export function buildIndex(graph = {}) {
  const people = new Map();
  for (const p of graph.people || []) people.set(p.id, p);

  const parentsOf = new Map(); // child  -> [parentId]
  const childrenOf = new Map(); // parent -> [childId]
  const spousesOf = new Map(); // person -> [spouseId]
  const otherOf = new Map(); // person -> [{ id, label }]

  const push = (map, key, value) => {
    if (!map.has(key)) map.set(key, []);
    if (!map.get(key).includes(value)) map.get(key).push(value);
  };

  for (const e of graph.edges || []) {
    if (!people.has(e.from) || !people.has(e.to)) continue;
    if (e.kind === "parent") {
      push(parentsOf, e.to, e.from);
      push(childrenOf, e.from, e.to);
    } else if (e.kind === "spouse") {
      push(spousesOf, e.from, e.to);
      push(spousesOf, e.to, e.from);
    } else {
      // 'other' is the escape hatch — a relation that genuinely isn't a parent
      // or a spouse. It carries its own words and is never derived from.
      if (!otherOf.has(e.from)) otherOf.set(e.from, []);
      if (!otherOf.has(e.to)) otherOf.set(e.to, []);
      otherOf.get(e.from).push({ id: e.to, label: e.label || "" });
      otherOf.get(e.to).push({ id: e.from, label: e.label || "" });
    }
  }

  return { people, parentsOf, childrenOf, spousesOf, otherOf };
}

/* Every ancestor of a person, with how many generations up they are.
   Breadth-first and cycle-safe: real exports contain loops, usually because
   somebody was entered twice and then linked to themselves. */
function ancestors(index, id, maxUp = 12) {
  const out = new Map([[id, 0]]);
  let frontier = [id];
  for (let up = 1; up <= maxUp && frontier.length; up++) {
    const next = [];
    for (const cur of frontier) {
      for (const parent of index.parentsOf.get(cur) || []) {
        if (out.has(parent)) continue;
        out.set(parent, up);
        next.push(parent);
      }
    }
    frontier = next;
  }
  return out;
}

const ORDINAL = ["", "first", "second", "third", "fourth", "fifth"];

function greats(n, base) {
  // n = 0 → "grandparent", 1 → "great-grandparent", 2 → "great-great-…"
  if (n <= 0) return `grand${base}`;
  if (n === 1) return `great-grand${base}`;
  return `${"great-".repeat(n)}grand${base}`;
}

/* Male / female / unknown, resolved to a word. Kept in one place so an
   unknown sex degrades to something a person would still say out loud
   rather than to an empty string. */
function gendered(sex, male, female, neutral) {
  if (sex === "M") return male;
  if (sex === "F") return female;
  return neutral;
}

/* What `fromId` is TO `toId`. Reads as: "<from> is <to>'s ___".
   Returns { code, label } — code is stable and testable, label is the word
   shown to a person. Null when the two aren't connected. */
export function relationshipBetween(index, fromId, toId, throughMarriage = false) {
  if (!fromId || !toId || fromId === toId) return null;
  const from = index.people.get(fromId);
  const to = index.people.get(toId);
  if (!from || !to) return null;
  const sex = from.sex;

  // Spouse first: it's the one relation that isn't a path through ancestors,
  // and it outranks any blood tie two people might also have.
  if ((index.spousesOf.get(toId) || []).includes(fromId)) {
    return { code: "spouse", label: gendered(sex, "husband", "wife", "spouse") };
  }

  const aFrom = ancestors(index, fromId);
  const aTo = ancestors(index, toId);

  // The common ancestor that makes the two of them closest.
  let best = null;
  for (const [id, up] of aFrom) {
    if (!aTo.has(id)) continue;
    const down = aTo.get(id);
    const score = up + down;
    if (!best || score < best.score || (score === best.score && Math.abs(up - down) < Math.abs(best.up - best.down))) {
      best = { id, up, down, score };
    }
  }

  if (best) {
    const { up, down } = best;

    // from is an ancestor of to
    if (up === 0) {
      if (down === 1) return { code: "parent", label: gendered(sex, "father", "mother", "parent") };
      const base = gendered(sex, "father", "mother", "parent");
      return { code: `ancestor-${down}`, label: greats(down - 2, base) };
    }

    // from is a descendant of to
    if (down === 0) {
      if (up === 1) return { code: "child", label: gendered(sex, "son", "daughter", "child") };
      const base = gendered(sex, "son", "daughter", "child");
      return { code: `descendant-${up}`, label: greats(up - 2, base) };
    }

    if (up === 1 && down === 1) {
      return { code: "sibling", label: gendered(sex, "brother", "sister", "sibling") };
    }

    // Parent's sibling, and further up: great-aunt and so on.
    if (up === 1) {
      const base = gendered(sex, "uncle", "aunt", "aunt or uncle");
      return {
        code: `pibling-${down}`,
        label: down === 2 ? base : `${"great-".repeat(down - 2)}${base}`,
      };
    }

    // Sibling's child, and further down.
    if (down === 1) {
      const base = gendered(sex, "nephew", "niece", "nephew or niece");
      return {
        code: `nibling-${up}`,
        label: up === 2 ? base : `${"great-".repeat(up - 2)}${base}`,
      };
    }

    // Cousins. Degree is how far the nearer of the two is from the shared
    // ancestor; "removed" is the generation gap between them.
    const degree = Math.min(up, down) - 1;
    const removed = Math.abs(up - down);
    const word = ORDINAL[degree] || `${degree}th`;
    return {
      code: `cousin-${degree}-${removed}`,
      label: removed === 0 ? `${word} cousin` : `${word} cousin ${removed === 1 ? "once" : removed === 2 ? "twice" : `${removed}×`} removed`,
    };
  }

  // No blood path. Try one step through a marriage before giving up — which
  // is where "son-in-law" and "sister-in-law" live, and they are most of what
  // a family calls the people it married into.
  //
  // Exactly one step: the call made through a marriage doesn't try another.
  // Without that, two partners asked about somebody related to neither of
  // them (a friend, a godparent) asked each other forever and overflowed
  // the stack.
  for (const spouse of throughMarriage ? [] : index.spousesOf.get(fromId) || []) {
    const r = relationshipBetween(indexWithoutSpouse(index, fromId), spouse, toId, true);
    if (r && (r.code === "child" || r.code === "sibling")) {
      return {
        code: `${r.code}-in-law`,
        label: r.code === "child"
          ? gendered(sex, "son-in-law", "daughter-in-law", "child-in-law")
          : gendered(sex, "brother-in-law", "sister-in-law", "sibling-in-law"),
      };
    }
  }
  for (const spouse of throughMarriage ? [] : index.spousesOf.get(toId) || []) {
    const r = relationshipBetween(index, fromId, spouse, true);
    if (r && (r.code === "parent" || r.code === "sibling")) {
      return {
        code: `${r.code}-in-law`,
        label: r.code === "parent"
          ? gendered(sex, "father-in-law", "mother-in-law", "parent-in-law")
          : gendered(sex, "brother-in-law", "sister-in-law", "sibling-in-law"),
      };
    }
  }

  // Finally, anything recorded as 'other' — the relation somebody typed in
  // their own words because it wasn't a parent or a spouse.
  for (const o of index.otherOf.get(fromId) || []) {
    if (o.id === toId && o.label) return { code: "stated", label: o.label.toLowerCase() };
  }

  return null;
}

/* Guards the one recursive call above against walking straight back out
   through the marriage it just came in by. */
function indexWithoutSpouse(index, id) {
  const spousesOf = new Map(index.spousesOf);
  spousesOf.set(id, []);
  return { ...index, spousesOf };
}

/* The label a screen should show, preferring what the family actually wrote
   over what the graph can work out. A stored label is somebody's own word for
   a person; the derivation is only ever a good guess at it. */
export function describeRelation(index, fromId, toId, storedLabel = "") {
  const stated = (storedLabel || "").trim();
  if (stated) return stated;
  const r = relationshipBetween(index, fromId, toId);
  return r ? r.label : "";
}

/* Who is probably still alive, and therefore who can still be asked anything.
   This is the only question the app needs to ask of an imported tree: a
   thousand names are a database, six living people are a product.

   Deliberately generous — no death year and a plausible birth year counts as
   living, because the cost of leaving somebody out is that nobody ever records
   them. `maxAge` is the far edge of plausibility, not a life expectancy. */
export function livingPeople(graph, { now = new Date(), maxAge = 110 } = {}) {
  const year = now.getFullYear();
  return (graph.people || []).filter((p) => {
    if (p.deathYear) return false;
    if (!p.birthYear) return false; // unknown birth AND no death says nothing
    return year - p.birthYear <= maxAge;
  });
}

/* People worth recording *about*, even though they're gone: somebody who died
   recently enough that a living relative still remembers them first-hand.
   These are the subjects a family should be offered after an import. */
export function rememberedPeople(graph, { now = new Date(), within = 70 } = {}) {
  const year = now.getFullYear();
  return (graph.people || []).filter(
    (p) => p.deathYear && year - p.deathYear <= within
  );
}

export function fullName(person) {
  if (!person) return "";
  return [person.givenName, person.familyName].filter(Boolean).join(" ").trim();
}
