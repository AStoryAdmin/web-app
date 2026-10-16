// Reading a family out of a genealogy export.
//
// GEDCOM is the interchange format every genealogy product can write —
// Ancestry, MyHeritage, FamilySearch, Findmypast, Gramps, RootsMagic. It has
// been essentially unchanged since 1996, which is the reason to target it:
// one parser reaches the whole category.
//
// The strategic point, which shapes what this returns: genealogy products
// hold a graph of names and dates and almost nothing anybody said. A Story
// holds what people said and has no graph. Somebody who has spent three years
// building a tree has already done the work the Family tab was going to ask
// a newcomer to do from nothing — and the people in that tree who are still
// alive are exactly the people who should be recorded before they aren't.
//
// So this parser is not trying to import a tree. It is trying to find the
// handful of people in a tree who can still be asked something. A file with
// four hundred names usually holds five or six of those, and they are the
// entire value of the import.
//
// Pure, like everything in src/lib — no React Native imports, so
// scripts/test-lib.mjs can run it in plain node.

// A safety rail, same reasoning as MAX_ENTRIES in importers.js. Published
// trees run to tens of thousands of people; nobody reviews that, and the
// browser shouldn't try to hold it.
const MAX_PEOPLE = 5000;

// GEDCOM privacy convention: most products redact living people on export,
// writing a placeholder where the name should be. A row like this carries no
// information and should never become a person somebody is asked to record.
const REDACTED = /^(living|private|unknown|withheld|n\.?n\.?)$/i;

/* Does this look like a genealogy export? Checked before parsing so the
   import screen can route a file to the right reader — the existing
   importers.js handles files full of memories, this one handles files full
   of people, and they should never be handed each other's input. */
export function isGedcom(text = "", file = {}) {
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".ged") || name.endsWith(".gedcom")) return true;
  const head = text.slice(0, 2000);
  return /^\s*0\s+HEAD\b/m.test(head) && /\b(GEDC|INDI|SOUR)\b/.test(head);
}

/* One GEDCOM line: LEVEL [@XREF@] TAG [value].
   Returns null for blank lines and anything that isn't shaped like a record,
   because real files have trailing whitespace, stray blank lines and the
   occasional truncated last line. */
function parseLine(raw) {
  const line = raw.replace(/\r$/, "").trim();
  if (!line) return null;
  const m = line.match(/^(\d+)\s+(?:(@[^@]+@)\s+)?(\S+)(?:\s(.*))?$/);
  if (!m) return null;
  return { level: Number(m[1]), xref: m[2] || null, tag: m[3], value: m[4] || "" };
}

/* A GEDCOM date, reduced to the only part this product uses.

   Dates in the wild: "12 MAR 1920", "MAR 1920", "1920", "ABT 1920",
   "BET 1920 AND 1925", "BEF 1900", "1920/21". The app stores years and asks
   families for years, so a year is all that's taken — and the FIRST
   four-digit number is the right one in every form above. */
export function gedcomYear(value = "") {
  const m = String(value).match(/\b(\d{4})\b/);
  if (!m) return null;
  const year = Number(m[1]);
  // A plausibility window. Typos in these files are common and a birth year
  // of 190 or 12020 silently wrecks every age the app later prints.
  if (year < 1000 || year > 2200) return null;
  return year;
}

/* "John Fitzgerald /Smith/" → { givenName, familyName }.
   Surnames are delimited by slashes; everything outside them is given names.
   A name with no slashes is treated as given names only, which is what
   exports from handwritten data usually contain. */
export function parseName(value = "") {
  const raw = String(value).trim();
  const m = raw.match(/\/([^/]*)\//);
  const familyName = m ? m[1].trim() : "";
  const givenName = raw.replace(/\/[^/]*\//, " ").replace(/\s+/g, " ").trim();
  return { givenName, familyName };
}

/* Group the flat line list into top-level records, each with its own nested
   lines. GEDCOM nesting is by level number, so a record runs from one level-0
   line to the next. */
function records(text) {
  const out = [];
  let current = null;
  for (const raw of String(text).split("\n")) {
    const line = parseLine(raw);
    if (!line) continue;
    if (line.level === 0) {
      if (current) out.push(current);
      current = { xref: line.xref, tag: line.tag, value: line.value, lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) out.push(current);
  return out;
}

/* The value of a nested tag, optionally inside a parent tag.
   `sub("BIRT", "DATE")` reads the DATE line that follows a BIRT line, which
   is how GEDCOM attaches a date to an event. */
function sub(lines, parentTag, childTag) {
  let inParent = false;
  let parentLevel = 0;
  for (const l of lines) {
    if (l.tag === parentTag) {
      inParent = true;
      parentLevel = l.level;
      continue;
    }
    if (inParent) {
      if (l.level <= parentLevel) inParent = false;
      else if (l.tag === childTag) return l.value;
    }
  }
  return "";
}

function first(lines, tag) {
  const l = lines.find((x) => x.tag === tag);
  return l ? l.value : "";
}

function all(lines, tag) {
  return lines.filter((x) => x.tag === tag).map((x) => x.value).filter(Boolean);
}

/* Parse a GEDCOM file into the shape src/lib/familyGraph.js works on:
   people, plus `parent` and `spouse` edges. Nothing else is derived here —
   grandparents, cousins and in-laws are all computed from these two.

   Returns { people, edges, stats, truncated }. `stats` is what the import
   screen reports back, and every number in it is counted from the file rather
   than estimated. */
export function parseGedcom(text = "", { maxPeople = MAX_PEOPLE, now = new Date() } = {}) {
  const recs = records(text);
  const people = [];
  const edges = [];
  const byXref = new Map();
  let skippedRedacted = 0;

  for (const rec of recs) {
    if (rec.tag !== "INDI" || !rec.xref) continue;
    if (people.length >= maxPeople) break;

    const nameValue = first(rec.lines, "NAME");
    const { givenName, familyName } = parseName(nameValue);

    // A redacted row is a person the export refused to describe. Keeping it
    // would put "Living Smith" in a family roster, which is worse than an
    // absence because somebody has to work out it means nothing.
    if (!familyName && (!givenName || REDACTED.test(givenName))) {
      skippedRedacted++;
      continue;
    }

    const sexRaw = (first(rec.lines, "SEX") || "").trim().toUpperCase();
    const person = {
      id: rec.xref,
      externalRef: rec.xref,
      givenName,
      familyName,
      sex: sexRaw === "M" || sexRaw === "F" ? sexRaw : "",
      birthYear: gedcomYear(sub(rec.lines, "BIRT", "DATE")),
      deathYear: gedcomYear(sub(rec.lines, "DEAT", "DATE")),
      source: "gedcom",
    };

    // Some exports record a burial but no death date. For the only question
    // this product asks of the data — can this person still be asked
    // anything? — a burial is an answer.
    if (!person.deathYear) {
      const buried = gedcomYear(sub(rec.lines, "BURI", "DATE"));
      if (buried) person.deathYear = buried;
    }

    people.push(person);
    byXref.set(rec.xref, person);
  }

  for (const rec of recs) {
    if (rec.tag !== "FAM" || !rec.xref) continue;

    const parents = [...all(rec.lines, "HUSB"), ...all(rec.lines, "WIFE")].filter((x) =>
      byXref.has(x)
    );
    const children = all(rec.lines, "CHIL").filter((x) => byXref.has(x));

    for (const parent of parents) {
      for (const child of children) {
        edges.push({ from: parent, to: child, kind: "parent", label: "" });
      }
    }

    // A spouse edge only when both halves survived the redaction filter —
    // otherwise it points at somebody who isn't in the graph.
    if (parents.length === 2) {
      edges.push({ from: parents[0], to: parents[1], kind: "spouse", label: "" });
    }
  }

  const year = now.getFullYear();
  const living = people.filter(
    (p) => !p.deathYear && p.birthYear && year - p.birthYear <= 110
  );
  const remembered = people.filter((p) => p.deathYear && year - p.deathYear <= 70);

  return {
    people,
    edges,
    truncated: people.length >= maxPeople,
    stats: {
      people: people.length,
      families: recs.filter((r) => r.tag === "FAM").length,
      living: living.length,
      remembered: remembered.length,
      withoutDates: people.filter((p) => !p.birthYear && !p.deathYear).length,
      skippedRedacted,
      // What the file says it came from, so the import screen can say "your
      // Ancestry export" rather than "your file".
      source: sourceName(recs),
    },
  };
}

function sourceName(recs) {
  const head = recs.find((r) => r.tag === "HEAD");
  if (!head) return "";
  const sour = first(head.lines, "SOUR");
  const name = sub(head.lines, "SOUR", "NAME");
  return (name || sour || "").trim();
}

/* Who this import is actually for.
 *
 * The whole point of reading a tree is to find the people in it who can still
 * be asked something, and the people just out of reach whom somebody alive
 * still remembers first-hand. Everyone else is context — kept, so the family
 * roster is complete, but never put in front of somebody as a suggestion.
 *
 * Sorted oldest first, because that is the order the offer should be made in
 * and the product should not need to be told twice why.
 */
export function importPriorities(parsed, { now = new Date() } = {}) {
  const year = now.getFullYear();
  const living = [];
  const remembered = [];
  for (const p of parsed.people || []) {
    if (!p.deathYear && p.birthYear && year - p.birthYear <= 110) {
      living.push({ ...p, age: year - p.birthYear });
    } else if (p.deathYear && year - p.deathYear <= 70) {
      remembered.push({ ...p, diedAgo: year - p.deathYear });
    }
  }
  living.sort((a, b) => b.age - a.age);
  remembered.sort((a, b) => a.diedAgo - b.diedAgo);
  return { living, remembered };
}
