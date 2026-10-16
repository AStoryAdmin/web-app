// The family tree as rows in supabase/family.sql (people, relationships),
// and what a save has to write. Pure, so it can be tested without a network
// — the Supabase half is data/family.js.
//
// The app has always drawn the tree from data.family ({ people, edges }),
// but nothing loaded it or saved it: only the demo fixtures ever filled it
// in. On a real account a relative added on the Family tab was there until
// the app closed and then gone, along with every tree imported from a
// GEDCOM file.

const yearOrNull = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 && n < 3000 ? n : null;
};

// What the family knows about somebody beyond their name and years
// (supabase/person_facts.sql): the Details tab of their page. Each is
// written only when the person has it as a field at all, so a tree that
// never touched them saves exactly the row it always did, and a database
// that hasn't run person_facts.sql yet is never sent a column it lacks.
export const PERSON_FACTS = [
  ["birthMonth", "birth_month", "day"],
  ["birthDay", "birth_day", "day"],
  ["birthPlace", "birth_place", "text"],
  ["deathMonth", "death_month", "day"],
  ["deathDay", "death_day", "day"],
  ["deathPlace", "death_place", "text"],
  ["restingPlace", "resting_place", "text"],
  ["grewUp", "grew_up", "text"],
  ["schools", "schools", "list"],
  ["work", "work", "text"],
  ["jobs", "jobs", "list"],
  ["knownFor", "known_for", "text"],
  ["faith", "faith", "text"],
  ["factSources", "fact_sources", "json"],
  ["sourceLinks", "source_links", "list"],
];
export const PERSON_FACT_COLUMNS = PERSON_FACTS.map(([, col]) => col);

const has = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);

function factToRow(kind, v) {
  if (kind === "day") {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= 1 && n <= 31 ? n : null;
  }
  if (kind === "json") return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  if (kind === "list") return Array.isArray(v) ? v.filter((x) => x && typeof x === "object" && !Array.isArray(x)) : [];
  const t = String(v ?? "").replace(/\s+/g, " ").trim();
  return t || null;
}

export function rowToPerson(row) {
  return {
    id: row.id,
    householdId: row.household_id || null,
    givenName: row.given_name || "",
    familyName: row.family_name || "",
    sex: row.sex || "",
    ...(row.email ? { email: row.email } : {}),
    // Their face on the tree. A family-photos URL, signed when shown.
    ...(row.avatar_url ? { photo: row.avatar_url } : {}),
    ...(row.birth_year ? { birthYear: row.birth_year } : {}),
    ...(row.death_year ? { deathYear: row.death_year } : {}),
    ...(row.story_id ? { storyId: row.story_id } : {}),
    ...(row.user_id ? { userId: row.user_id } : {}),
    ...(row.invited_at ? { invitedAt: row.invited_at } : {}),
    ...(row.external_ref ? { externalRef: row.external_ref } : {}),
    // When they were added — for "Bao joined the family tree" this week.
    ...(row.created_at ? { createdAt: row.created_at } : {}),
    // Who added them (people_permissions.sql). Read only, never written
    // back: the database sets it from the session, so nobody can claim to
    // have added somebody they didn't (lib/personRights.js).
    ...(row.created_by ? { createdBy: row.created_by } : {}),
    source: row.source || "manual",
    ...Object.fromEntries(
      PERSON_FACTS.filter(([, col, kind]) =>
        kind === "json"
          ? row[col] && Object.keys(row[col]).length
          : kind === "list"
            ? Array.isArray(row[col]) && row[col].length
            : row[col] !== null && row[col] !== undefined && row[col] !== ""
      ).map(([key, col]) => [key, row[col]])
    ),
  };
}

export function personToRow(person, householdId) {
  return {
    id: person.id,
    household_id: person.householdId || householdId,
    // Only ever carried through from a loaded row. Who has arrived is the
    // arriving person's to say (claim_people()), never somebody else's.
    user_id: person.userId || null,
    given_name: person.givenName || "",
    family_name: person.familyName || "",
    email: person.email ? String(person.email).trim().toLowerCase() : null,
    avatar_url: person.photo || null,
    birth_year: yearOrNull(person.birthYear),
    death_year: yearOrNull(person.deathYear),
    story_id: person.storyId || null,
    status: person.userId ? "active" : person.invitedAt ? "invited" : "listed",
    source: person.source || "manual",
    external_ref: person.externalRef || null,
    sex: person.sex || "",
    invited_at: person.invitedAt || null,
    ...Object.fromEntries(PERSON_FACTS.filter(([key]) => has(person, key)).map(([key, col, kind]) => [col, factToRow(kind, person[key])])),
  };
}

export function rowToEdge(row) {
  return { from: row.from_person, to: row.to_person, kind: row.kind, label: row.label || "" };
}

const edgeKey = (e) => `${e.from}|${e.to}|${e.kind}`;

/* What changed in the tree since `baseline`: the people whose row differs,
   the edges that are new, and what was taken out.

   Removal is only ever what somebody did on this phone — a row in the
   baseline that this phone's tree no longer has (lib/familyTree's
   removeFromFamily). Somebody another relative added since this phone
   loaded is in neither, so a save here can never delete their work. */
export function planFamilySave(family, baseline, householdId) {
  const people = family?.people || [];
  const edges = family?.edges || [];
  const before = new Map((baseline?.people || []).map((p) => [p.id, p]));
  const hadEdge = new Set((baseline?.edges || []).map(edgeKey));
  const nowPeople = new Set(people.map((p) => p.id));
  const nowEdge = new Set(edges.map(edgeKey));

  const changedPeople = people.filter((p) => {
    const old = before.get(p.id);
    return !old || JSON.stringify(personToRow(p, householdId)) !== JSON.stringify(personToRow(old, householdId));
  });
  const newEdges = edges.filter((e) => e?.from && e?.to && e.from !== e.to && !hadEdge.has(edgeKey(e)));
  const removedPeople = (baseline?.people || []).map((p) => p.id).filter((id) => !nowPeople.has(id));
  const gone = new Set(removedPeople);
  // An edge to a removed person goes with them (on delete cascade); only
  // edges between people who are both staying need deleting by hand.
  const removedEdges = (baseline?.edges || []).filter(
    (e) => !nowEdge.has(edgeKey(e)) && !gone.has(e.from) && !gone.has(e.to)
  );
  return { people: changedPeople, edges: newEdges, removedPeople, removedEdges };
}

/* A GEDCOM tree folded into the family already here. Somebody already in
   the roster from an earlier import of the same file (the same xref) is
   kept, not duplicated; everyone new gets a real id, because the database
   keys people by uuid and a GEDCOM xref ("@I12@") is only unique within its
   own file. Returns { family, idFor } — idFor maps the file's ids to ours,
   so the caller can find the people it picked. */
export function mergeImportedTree(family, tree, newId) {
  const people = [...(family?.people || [])];
  const edges = [...(family?.edges || [])];
  const byRef = new Map(people.filter((p) => p.externalRef).map((p) => [p.externalRef, p.id]));
  const idFor = new Map();

  for (const p of tree?.people || []) {
    const ref = p.externalRef || p.id;
    const existing = byRef.get(ref);
    if (existing) {
      idFor.set(p.id, existing);
      continue;
    }
    const id = newId();
    idFor.set(p.id, id);
    byRef.set(ref, id);
    people.push({ ...p, id, externalRef: ref, source: p.source || "gedcom" });
  }

  const seen = new Set(edges.map(edgeKey));
  for (const e of tree?.edges || []) {
    const next = { ...e, from: idFor.get(e.from), to: idFor.get(e.to) };
    if (!next.from || !next.to || next.from === next.to) continue;
    if (seen.has(edgeKey(next))) continue;
    seen.add(edgeKey(next));
    edges.push(next);
  }
  return { family: { ...(family || {}), people, edges }, idFor };
}

/* How a save's changed people reach the database, given who may edit whom
   (lib/personRights.js, people_permissions.sql).

   Somebody new, or somebody this account may edit, is written as a row.
   Somebody it may not edit can still be invited (their email and when) and
   have their story started (story_id, only while they have none) — growing
   the tree is open to the whole family — and those go through the two
   functions that allow exactly that. Any other change to them is refused
   here rather than sent to fail: the app doesn't offer it, so it only
   happens with a stale screen. */
export function routePeopleWrites(changed, baselinePeople, canEdit) {
  const before = new Map((baselinePeople || []).map((p) => [p.id, p]));
  const out = { rows: [], invites: [], links: [], refused: [] };
  for (const p of changed || []) {
    const old = before.get(p.id);
    if (!old || canEdit(old)) {
      out.rows.push(p);
      continue;
    }
    const a = personToRow(old, old.householdId);
    const b = personToRow(p, old.householdId);
    const diff = Object.keys(b).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
    const inviteKeys = ["email", "invited_at", "status"];
    const rest = diff.filter((k) => !inviteKeys.includes(k) && k !== "story_id");
    // Taking an invite back (the email cleared) is an editor's call too;
    // it used to fall between the two and vanish without a word.
    const uninvite = diff.some((k) => inviteKeys.includes(k)) && !b.email;
    if (rest.length || uninvite || (diff.includes("story_id") && (a.story_id || !b.story_id))) {
      out.refused.push(p.id);
      continue;
    }
    if (diff.some((k) => inviteKeys.includes(k)) && b.email) out.invites.push({ id: p.id, email: b.email });
    if (diff.includes("story_id")) out.links.push({ id: p.id, storyId: b.story_id });
  }
  return out;
}
