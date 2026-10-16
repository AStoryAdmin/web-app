// Laying a family out as generations, for the Family tab.
//
// The tree people picture when they say "family tree" is a canvas: nodes,
// connecting lines, pinch to zoom. That is the expensive way to build this
// and the worst way to read it on a phone — and the phone is the whole
// product. The person most likely to be looking at this screen is the one
// whose life is being recorded, and pinch-zoom on a node graph is close to
// the least usable gesture that could be handed to them.
//
// So: no geometry. A family is banded by generation and each band is a row.
// That is still a tree in the only sense a family means it — it says who
// belongs where — and it needs no layout engine, no collision handling and
// no hit-testing, because `familyGraph` already knows how far apart two
// people are. This file is the small amount of arithmetic left over.
//
// Pure, like everything in src/lib, so scripts/test-lib.mjs can run it.

import { buildIndex, relationshipBetween, fullName } from "./familyGraph.js";

/* How many generations each person sits from the subject: negative upwards
   (parents, grandparents), 0 alongside them, positive downwards.

   Breadth-first over both edge kinds at once. A parent edge steps one
   generation; a spouse edge steps none, which is what makes an in-law land
   in the band their partner is in rather than floating. Cycle-safe by the
   visited set — real family data contains loops, usually a person entered
   twice and then married to themselves. */
export function generationOf(index, subjectId) {
  const gen = new Map();
  if (!index?.people?.has(subjectId)) return gen;
  gen.set(subjectId, 0);

  let frontier = [subjectId];
  while (frontier.length) {
    const next = [];
    for (const id of frontier) {
      const g = gen.get(id);
      const step = (otherId, delta) => {
        if (gen.has(otherId) || !index.people.has(otherId)) return;
        gen.set(otherId, g + delta);
        next.push(otherId);
      };
      // Up to parents, down to children, level across spouses.
      for (const p of index.parentsOf.get(id) || []) step(p, -1);
      for (const c of index.childrenOf.get(id) || []) step(c, +1);
      for (const s of index.spousesOf.get(id) || []) step(s, 0);
      // 'other' is a relation nobody could name in parent/spouse terms, so
      // it carries no generation. Kept beside its anchor rather than
      // guessed at — see the note on otherOf in familyGraph.
      for (const o of index.otherOf.get(id) || []) step(o.id, 0);
    }
    frontier = next;
  }
  return gen;
}

/* What to call a band.
 
   Not "Rose's children", which is what this said first and is wrong: the
   band one step down holds everybody one generation below Rose, and that
   includes her sister's children. Calling the row "Rose's children" labels a
   niece as a daughter — the exact class of mistake the derived-not-stored
   rule exists to prevent, reintroduced in a heading.
 
   So the band names a generation and the chip under each face names the
   person: "Children's generation", and inside it "daughter", "niece". */
export function bandTitle(level, subjectName = "") {
  if (level === 0) return subjectName ? `${subjectName}'s generation` : "This generation";
  if (level === -1) return "Parents' generation";
  if (level === -2) return "Grandparents' generation";
  if (level === -3) return "Great-grandparents' generation";
  if (level < -3) return `${Math.abs(level)} generations back`;
  if (level === 1) return "Children's generation";
  if (level === 2) return "Grandchildren's generation";
  if (level === 3) return "Great-grandchildren's generation";
  return `${level} generations on`;
}

/* A band, grouped into the units a family is actually drawn in: couples
   together, everybody else on their own.
 
   Two people side by side under one border is the whole of the "this is a
   tree" drawing. Lines between every related pair is what a canvas does and
   it is unreadable at four people to a row on a phone; a couple sharing a
   card carries the same information for nothing.
 
   The subject's own unit is moved to the front of their band, so the person
   whose story this is anchors the row rather than sorting into it by age. */
export function coupleRows(people, index, subjectId) {
  const used = new Set();
  const rows = [];
  for (const entry of people) {
    if (used.has(entry.id)) continue;
    used.add(entry.id);
    const spouseId = (index.spousesOf.get(entry.id) || []).find(
      (s) => !used.has(s) && people.some((p) => p.id === s)
    );
    if (spouseId) {
      used.add(spouseId);
      const spouse = people.find((p) => p.id === spouseId);
      // Within a couple the storyteller sits on the left, whoever is older.
      // Age orders the band; being the person this archive is about orders
      // the pair.
      rows.push(spouse.isSubject ? [spouse, entry] : [entry, spouse]);
    } else {
      rows.push([entry]);
    }
  }
  const anchor = rows.findIndex((r) => r.some((p) => p.id === subjectId));
  if (anchor > 0) rows.unshift(rows.splice(anchor, 1)[0]);
  return rows;
}

/* The whole tab's data in one call: the bands, oldest generation first,
   each person carrying the word this family would actually use for them.

   The relation label is derived, never stored — `relationshipBetween` reads
   it off the edges every time, so it cannot drift out of step with them the
   way a written-down "grandmother" does the moment somebody fills in the
   generation in between. */
export function familyBands(index, subjectId, { graph } = {}) {
  const gen = generationOf(index, subjectId);
  const byLevel = new Map();

  for (const [id, level] of gen) {
    const person = index.people.get(id);
    // Placeholders hold the tree's shape and are never drawn — see
    // planRelative.
    if (!person || isPlaceholder(person)) continue;
    const rel = id === subjectId ? null : relationshipBetween(index, id, subjectId);
    if (!byLevel.has(level)) byLevel.set(level, []);
    byLevel.get(level).push({
      id,
      person,
      name: fullName(person) || "Unnamed",
      isSubject: id === subjectId,
      // "Rose's daughter" reads better on a chip than "daughter" alone, but
      // only for other people — the subject is not their own anything.
      relation: rel ? rel.label : "",
      relationCode: rel ? rel.code : "",
    });
  }

  // Anyone in the graph the subject has no path to at all. They exist —
  // somebody added them — so they are shown rather than silently dropped.
  const loose = (graph?.people || [])
    .filter((p) => !gen.has(p.id) && !isPlaceholder(p))
    .map((p) => ({
      id: p.id,
      person: p,
      name: fullName(p) || "Unnamed",
      isSubject: false,
      relation: "",
      relationCode: "",
    }));

  const bands = [...byLevel.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([level, people]) => ({
      level,
      people: people.sort(byAge),
    }));

  return { bands, loose };
}

/* Oldest first inside a band, then by name. Birth year is missing more often
   than not in a family somebody is typing in from memory, so a person
   without one sorts after those who have one rather than to the top. */
function byAge(a, b) {
  const ya = a.person.birthYear || 0;
  const yb = b.person.birthYear || 0;
  if (ya && yb && ya !== yb) return ya - yb;
  if (ya && !yb) return -1;
  if (!ya && yb) return 1;
  return a.name.localeCompare(b.name);
}

/* The gaps worth drawing. A family tree that only shows what is already in
   it is a record; one that shows where it could go next is a thing somebody
   finishes. Genealogy apps do this with an empty "Add Parent" card sitting
   in the slot where a parent would be, and it is the best idea in them: the
   tree teaches you what is missing and puts the action exactly in the gap,
   so nobody has to find a button and then explain who it is for.
 
   Only the three slots that hang off the storyteller, and only while they
   are genuinely open. Deeper in the tree "add a parent" would have to ask
   whose, which is the question the per-person sheet already answers by
   being opened from a person. */
export function openSlots(index, subjectId) {
  const real = (ids) => (ids || []).filter((id) => !isPlaceholder(index.people.get(id)));
  if (!index?.people?.has(subjectId)) return { parent: false, spouse: false, child: false };
  return {
    // Two is the number of parents a person row can hold; one is a gap
    // worth offering, two is a full slot.
    // A placeholder parent is a gap with a shape, not a parent: adding the
    // real one fills it.
    parent: real(index.parentsOf.get(subjectId)).length < 2,
    spouse: real(index.spousesOf.get(subjectId)).length < 1,
    // Never "full". A family keeps having children and the row costs
    // nothing when it is not wanted.
    child: true,
  };
}

/* Where a person stands with the app itself, derived rather than stored —
   the same rule the kinship words follow. A stored status drifts: somebody
   accepts an invite and three rows now disagree about whether they did.
 
   Five states, and the two that are easy to get wrong are the ones that
   matter most:
 
   - "remembered" — a person with a death year. Never offered an invite.
     Sending an email to a great-grandfather who died in 1979 is the kind of
     thing an app does once and a family never forgets.
   - "listed" — alive, no account, not invited, and that is a complete and
     permanent answer. A grandmother who will never install anything still
     belongs in the family; this state is not a to-do.
 */
export function linkStateOf(person, youId) {
  if (!person) return { key: "listed", label: "", canInvite: false };
  if (youId && person.id === youId) return { key: "you", label: "you", canInvite: false };
  if (person.userId) return { key: "joined", label: "Joined", canInvite: false };
  if (person.deathYear) return { key: "remembered", label: "", canInvite: false };
  if (person.invitedAt) return { key: "invited", label: "Invite sent", canInvite: false };
  return { key: "listed", label: "", canInvite: true };
}

/* The one question the add-a-person sheet asks. Two stored edge kinds means
   three things a person can be to someone already in the tree, and every
   other word — aunt, nephew, cousin, in-law — falls out of those three
   without anybody being asked to choose it. */
export const LINK_KINDS = [
  { key: "child", label: "their child", edge: (anchorId, newId) => ({ from: anchorId, to: newId, kind: "parent" }) },
  { key: "parent", label: "their parent", edge: (anchorId, newId) => ({ from: newId, to: anchorId, kind: "parent" }) },
  { key: "spouse", label: "their partner", edge: (anchorId, newId) => ({ from: anchorId, to: newId, kind: "spouse" }) },
];

/* ── Every other relation, still stored as parent and spouse edges ────────

   Three choices was the right model and the wrong menu. Nobody adding their
   cousin thinks "my parent's sibling's child", and making them add two
   people they don't care about first — a parent, then that parent's
   sibling — to reach the one they do is how a tree stays at four people.

   So the menu names the relation people actually say, and each one is a
   path of the three primitive steps the graph already understands. The
   people in between that nobody has named yet are made as placeholders:
   real rows that hold the shape of the tree (they are why a cousin comes
   out as "first cousin" and not "family"), never drawn, and filled in —
   not duplicated — the moment somebody adds the real person in that place.

   Steps, from the person the sheet was opened on:
     up      to a parent
     down    to a child
     spouse  to a partner
     side    to a sibling — someone sharing their parents */
export const RELATIVE_KINDS = [
  { key: "parent", steps: ["up"], words: ["parent", "father", "mother"] },
  { key: "child", steps: ["down"], words: ["child", "son", "daughter"] },
  { key: "spouse", steps: ["spouse"], words: ["partner", "husband", "wife"] },
  { key: "sibling", steps: ["side"], words: ["brother or sister", "brother", "sister"] },
  { key: "grandparent", steps: ["up", "up"], words: ["grandparent", "grandfather", "grandmother"] },
  { key: "grandchild", steps: ["down", "down"], words: ["grandchild", "grandson", "granddaughter"] },
  { key: "pibling", steps: ["up", "side"], words: ["aunt or uncle", "uncle", "aunt"] },
  { key: "nibling", steps: ["side", "down"], words: ["niece or nephew", "nephew", "niece"] },
  { key: "cousin", steps: ["up", "side", "down"], words: ["cousin", "cousin", "cousin"] },
  { key: "parentInLaw", steps: ["spouse", "up"], words: ["parent-in-law", "father-in-law", "mother-in-law"] },
  { key: "siblingInLaw", steps: ["spouse", "side"], words: ["brother- or sister-in-law", "brother-in-law", "sister-in-law"] },
  { key: "childInLaw", steps: ["down", "spouse"], words: ["son- or daughter-in-law", "son-in-law", "daughter-in-law"] },
  // Godmother, the neighbour who raised them, a best friend of sixty years.
  // Not a path at all: an 'other' edge carrying the family's own word.
  { key: "other", steps: [], words: ["someone close", "someone close", "someone close"] },
];

/* How the menu is laid out. Grouped because thirteen rows in one list is a
   form; four short groups are a question somebody can answer at a glance. */
export const RELATIVE_GROUPS = [
  { title: "Close family", keys: ["parent", "child", "spouse", "sibling"] },
  { title: "Grandparents, aunts, cousins", keys: ["grandparent", "grandchild", "pibling", "nibling", "cousin"] },
  { title: "Through marriage", keys: ["parentInLaw", "siblingInLaw", "childInLaw"] },
  { title: "Not by blood", keys: ["other"] },
];

export const relativeKind = (key) => RELATIVE_KINDS.find((k) => k.key === key) || null;

/* The word for the relation, in the sex given when there is one. */
export function relativeWord(kind, sex = "") {
  const k = typeof kind === "string" ? relativeKind(kind) : kind;
  if (!k) return "";
  return sex === "M" ? k.words[1] : sex === "F" ? k.words[2] : k.words[0];
}

export const PLACEHOLDER = "placeholder";
export const isPlaceholder = (p) => p?.source === PLACEHOLDER;

/* Who one step away from `id` is, for the step being taken. */
function stepCandidates(index, id, step) {
  if (step === "up") return [...(index.parentsOf.get(id) || [])];
  if (step === "down") return [...(index.childrenOf.get(id) || [])];
  if (step === "spouse") return [...(index.spousesOf.get(id) || [])];
  if (step === "side") {
    const out = new Set();
    for (const p of index.parentsOf.get(id) || []) {
      for (const c of index.childrenOf.get(p) || []) if (c !== id) out.add(c);
    }
    return [...out];
  }
  return [];
}

/* Plans adding somebody as `kindKey` of `anchorId`.

   family  — { people, edges }
   via     — the answers so far to "through whom?", one per step before the
             last: a person id, or NEW_VIA for somebody not in the tree yet
   person  — { givenName, familyName, sex, email, … } for the new person
   newId   — makes ids; injected so the tests can predict them
   label   — the family's own word, for kind 'other'

   Returns one of:
     { need: { step, through, candidates, allowNew } }
         a choice the sheet has to ask before anything can be written
     { error }
     { id, people, edges, updates }
         the rows to add, and placeholders being filled in (updates) */
export const NEW_VIA = "__new__";

export function planRelative(family, anchorId, kindKey, { via = [], person = {}, newId, label = "" } = {}) {
  const kind = relativeKind(kindKey);
  const index = buildIndex(family || {});
  if (!kind) return { error: "unknown-kind" };
  if (!index.people.has(anchorId)) return { error: "no-anchor" };

  const people = [];
  const edges = [];
  const updates = [];
  // A working copy of the adjacency, so placeholders made earlier in this
  // plan count as there for the steps after them.
  const parentsOf = (id) => index.parentsOf.get(id) || [];
  const link = (e) => {
    edges.push(e);
    if (e.kind === "parent") {
      if (!index.parentsOf.has(e.to)) index.parentsOf.set(e.to, []);
      index.parentsOf.get(e.to).push(e.from);
      if (!index.childrenOf.has(e.from)) index.childrenOf.set(e.from, []);
      index.childrenOf.get(e.from).push(e.to);
    } else if (e.kind === "spouse") {
      for (const [a, b] of [[e.from, e.to], [e.to, e.from]]) {
        if (!index.spousesOf.has(a)) index.spousesOf.set(a, []);
        index.spousesOf.get(a).push(b);
      }
    }
  };
  const make = (fields) => {
    const p = { id: newId(), givenName: "", familyName: "", sex: "", ...fields };
    people.push(p);
    index.people.set(p.id, p);
    return p.id;
  };
  const placeholder = () => make({ source: PLACEHOLDER });

  /* Puts `who` one `step` from `from`. A sibling needs parents to share, so
     a person with none gets a placeholder parent first — which the next
     sibling added then shares too. */
  const attach = (from, step, who) => {
    if (step === "up") link({ from: who, to: from, kind: "parent" });
    else if (step === "down") link({ from, to: who, kind: "parent" });
    else if (step === "spouse") link({ from, to: who, kind: "spouse" });
    else if (step === "side") {
      let parents = parentsOf(from);
      if (!parents.length) {
        const pid = placeholder();
        link({ from: pid, to: from, kind: "parent" });
        parents = [pid];
      }
      for (const pid of [...parents]) link({ from: pid, to: who, kind: "parent" });
    }
  };

  if (kind.key === "other") {
    const id = make({ ...person });
    edges.push({ from: anchorId, to: id, kind: "other", label: String(label || "").trim() });
    return { id, people, edges, updates };
  }

  let current = anchorId;
  const steps = kind.steps;
  for (let i = 0; i < steps.length - 1; i++) {
    const step = steps[i];
    const candidates = stepCandidates(index, current, step);
    // Two parents is a full slot; anywhere else there is always room for
    // somebody not drawn yet.
    const allowNew = !(step === "up" && candidates.length >= 2);
    const answer = via[i];
    if (answer === undefined) {
      if (!candidates.length) {
        const pid = placeholder();
        attach(current, step, pid);
        current = pid;
        continue;
      }
      return { need: { step, index: i, through: current, candidates, allowNew } };
    }
    if (answer === NEW_VIA) {
      if (!allowNew) return { error: "two-parents" };
      const pid = placeholder();
      attach(current, step, pid);
      current = pid;
    } else {
      if (!candidates.includes(answer)) return { error: "not-a-candidate" };
      current = answer;
    }
  }

  const last = steps[steps.length - 1];
  // Somebody's parent or partner already held by a placeholder: that row
  // *is* this person, waiting for a name. Fill it rather than making a
  // second parent the tree would then have to reconcile.
  if (last === "up" || last === "spouse") {
    const held = stepCandidates(index, current, last).filter((id) =>
      isPlaceholder(index.people.get(id))
    );
    if (held.length) {
      const id = held[0];
      updates.push({ id, patch: { ...person, source: "manual" } });
      return { id, people, edges, updates };
    }
    if (last === "up" && parentsOf(current).length >= 2) return { error: "two-parents" };
  }
  const id = make({ ...person });
  attach(current, last, id);
  return { id, people, edges, updates };
}

/* Applies a plan from planRelative to a family, in place. */
export function applyRelative(family, plan) {
  if (!plan || plan.error || plan.need) return family;
  family.people = family.people || [];
  family.edges = family.edges || [];
  for (const p of plan.people) family.people.push(p);
  for (const u of plan.updates) {
    const p = family.people.find((x) => x.id === u.id);
    if (p) Object.assign(p, u.patch);
  }
  for (const e of plan.edges) family.edges.push(e);
  return family;
}

/* Taking somebody out of the tree.

   Somebody who connects other people — a parent whose children are
   siblings only through them — is turned back into a placeholder rather
   than deleted, so removing a name never quietly un-relates the cousins
   hanging off it. Then any placeholder left holding nothing together (one
   edge or none) goes too, repeatedly, because removing one can strand the
   next. Returns the family, changed in place. */
/* One row for the account holder.

   Two things used to make a person twice: starting a story about yourself
   ("Myself") makes a row for its subject, and "Add yourself" (or signing
   in with an email the tree holds) makes a row bound to the account. A
   tester ended up as "Me" and as "Daniel", with the relatives hung off one
   and the account on the other, so "About you" showed no family and the
   tree and the page disagreed about everything.

   This folds the account row into the story's subject row (which is where
   the relatives and the memories already are), carries over anything only
   the account row knew, re-points its edges, and removes it. Mutates
   `family`; returns { kept, removed } when something changed, else null.

   Only within one family. Somebody can have a place in two (their own
   tree, which other relatives are in, and the family they joined:
   family_join_merge.sql moves a tree only when it is theirs alone).
   Folding across took them out of the family they had just joined. */
export function mergeSelfRows(family, stories, userId) {
  if (!family?.people || !userId) return null;
  const mine = (stories || []).filter((s) => s?.relationship === "Myself" && (!s.ownerId || s.ownerId === userId));
  const subject = mine
    .map((s) => family.people.find((p) => p.storyId === s.id && (!p.userId || p.userId === userId)))
    .find(Boolean);
  if (!subject) return null;
  const accountRows = family.people.filter((p) => p.userId && p.userId === userId);
  const self =
    accountRows.find((p) => p.id === subject.id) ||
    accountRows.find((p) => !p.householdId || !subject.householdId || p.householdId === subject.householdId) ||
    null;
  if (!self) {
    // Their place is in another family; this one's subject gets the
    // account only when the account has no place in its family yet.
    if (accountRows.length) return null;
    subject.userId = userId;
    return { kept: subject.id, removed: null };
  }
  if (self.id === subject.id) return null;

  for (const k of Object.keys(self)) {
    if (["id", "householdId", "storyId", "source", "createdBy", "createdAt"].includes(k)) continue;
    const have = subject[k];
    if (have === undefined || have === null || have === "" || (Array.isArray(have) && !have.length)) subject[k] = self[k];
  }
  subject.userId = userId;
  if (subject.status === "listed") subject.status = "active";

  const seen = new Set();
  family.edges = (family.edges || [])
    .map((e) => ({
      ...e,
      from: e.from === self.id ? subject.id : e.from,
      to: e.to === self.id ? subject.id : e.to,
    }))
    .filter((e) => e.from !== e.to)
    .filter((e) => {
      const key = `${e.from}|${e.to}|${e.kind}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  family.people = family.people.filter((p) => p.id !== self.id);
  return { kept: subject.id, removed: self.id };
}

/* Same-name relatives who are probably one person, the way
   my_duplicate_people() (supabase/family_join_merge.sql) finds them: same
   first and last name (case and spacing aside), birth years that don't
   disagree, at most one with an account, at most one with a story, and
   this account may edit the one that goes (and the one that stays, unless
   it is somebody's own row). The one that stays: an account, else a story,
   else the older row. Used where there's no server (the demo); the app asks
   the database otherwise. [{ keep, fold, givenName, familyName, birthYear }] */
export function duplicatePeople(people, canEdit) {
  const norm = (s) => String(s || "").trim().replace(/\s+/g, " ").toLowerCase();
  const rank = (p) => (p.userId ? 2 : 0) + (p.storyId ? 1 : 0);
  const older = (a, b) => String(a.createdAt || "") < String(b.createdAt || "") || (String(a.createdAt || "") === String(b.createdAt || "") && a.id < b.id);
  const live = (people || []).filter((p) => norm(p.givenName) && p.source !== PLACEHOLDER);
  const out = [];
  for (const k of live) {
    for (const f of live) {
      if (k.id === f.id || f.userId) continue;
      if ((k.householdId || null) !== (f.householdId || null)) continue;
      if (norm(k.givenName) !== norm(f.givenName) || norm(k.familyName) !== norm(f.familyName)) continue;
      if (k.birthYear && f.birthYear && Number(k.birthYear) !== Number(f.birthYear)) continue;
      if (k.storyId && f.storyId) continue;
      const keeps = rank(k) > rank(f) || (rank(k) === rank(f) && older(k, f));
      if (!keeps) continue;
      if (!canEdit(f) || (!k.userId && !canEdit(k))) continue;
      out.push({ keep: k.id, fold: f.id, givenName: k.givenName, familyName: k.familyName || "", birthYear: k.birthYear || f.birthYear || null });
    }
  }
  return out;
}

/* One person folded into another, in place, as merge_people() does on the
   server: `keep` stays with its id and takes what only `fold` knew; edges
   move across without doubling; `fold` goes. Returns true when merged. */
export function foldPersonInto(family, keepId, foldId) {
  const keep = family?.people?.find((p) => p.id === keepId);
  const fold = family?.people?.find((p) => p.id === foldId);
  if (!keep || !fold || keep === fold) return false;
  const empty = (v) => v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length) || (typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length);
  for (const k of Object.keys(fold)) {
    if (["id", "householdId", "createdBy", "createdAt", "source", "externalRef", "email", "status"].includes(k)) continue;
    if (empty(keep[k])) keep[k] = fold[k];
  }
  const seen = new Set();
  family.edges = (family.edges || [])
    .map((e) => ({ ...e, from: e.from === foldId ? keepId : e.from, to: e.to === foldId ? keepId : e.to }))
    .filter((e) => e.from !== e.to)
    .filter((e) => {
      const key = `${e.from}|${e.to}|${e.kind}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  family.people = family.people.filter((p) => p.id !== foldId);
  return true;
}

export function removeFromFamily(family, personId) {
  if (!family?.people) return family;
  const person = family.people.find((p) => p.id === personId);
  if (!person) return family;

  const hasChildren = (family.edges || []).some((e) => e.kind === "parent" && e.from === personId);
  if (hasChildren) {
    for (const k of Object.keys(person)) if (k !== "id" && k !== "householdId") delete person[k];
    Object.assign(person, { givenName: "", familyName: "", sex: "", source: PLACEHOLDER });
    family.edges = (family.edges || []).filter(
      (e) => !(e.kind !== "parent" && (e.from === personId || e.to === personId))
    );
  } else {
    family.people = family.people.filter((p) => p.id !== personId);
    family.edges = (family.edges || []).filter((e) => e.from !== personId && e.to !== personId);
  }

  for (;;) {
    const degree = new Map();
    for (const e of family.edges) {
      degree.set(e.from, (degree.get(e.from) || 0) + 1);
      degree.set(e.to, (degree.get(e.to) || 0) + 1);
    }
    const stranded = family.people.filter((p) => isPlaceholder(p) && (degree.get(p.id) || 0) <= 1);
    if (!stranded.length) break;
    const gone = new Set(stranded.map((p) => p.id));
    family.people = family.people.filter((p) => !gone.has(p.id));
    family.edges = family.edges.filter((e) => !gone.has(e.from) && !gone.has(e.to));
  }
  return family;
}
