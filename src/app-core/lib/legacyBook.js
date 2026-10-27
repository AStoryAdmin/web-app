// The printed book.
//
// This is the thing somebody actually pays for, and the only artefact of this
// app that outlives the app. It was 60 lines buried in a screen component,
// untested, and it threw away most of what a memory carries: every
// photograph, the age the person was, and the name of the relative who sent
// it in. A book of a life with the photographs left out is not the product.
//
// So it lives here, pure and tested, and the preview on screen is built from
// the same structure the printed page is — one source of truth, so what you
// are shown and what you receive cannot drift apart.
//
// Two exports:
//   bookStructure()   the book as data — used by the preview and the contents
//   buildLegacyHtml() the printable HTML, handed to expo-print

import { sortByDate, memoryDate, ageLabel } from "./timeline.js";
import { isBeforeTeller } from "./familyFacts.js";
import {
  ERAS,
  CATCH_ALL_CHAPTER,
  FAMILY_CHAPTER,
  normaliseEra,
} from "../data/eras.js";
import {
  normaliseDesign,
  chapterSequence,
  effectiveCoverStyle,
  coverBare,
  coverPhoto,
  DEFAULT_SUBTITLE,
  PAPERS,
  keepsakePhotos,
  keepsakeWords,
  effectiveArrangement,
  printedBody,
  printedChapterName,
  listenUrl,
  hasVoice,
  includesMemory,
  sidesInBook,
  VERSIONS_IN_FULL,
  readUrl,
} from "./bookDesign.js";
import { qrSvg } from "./qr.js";
import { BOOK_PRINT } from "../theme/index.js";
import {
  keepsakeFrontHtml,
  keepsakeBackHtml,
  keepsakeSpineHtml,
  keepsakeCss,
  SPINE_SHARE,
  coverPrints,
} from "./bookCase.js";
import { LOGO, MARK_PATH, BARS_PATH } from "../theme/logoPaths.js";
import { withFullSerif } from "./printFonts.js";
import { bookLessons, lessonsForStory, quoteShown, sourceLine } from "../data/lessons.js";
import { printedSides, bookLeaf } from "./bookPages.js";

const SUBTITLE = DEFAULT_SUBTITLE;

export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* A memory's dateline: what it says under the title on the page.
   "June 1975 · she was 30" reads like a book; "June 1975" reads like a form,
   and the age is the thing that turns a date into a life. Third person
   because a printed book is read by somebody else, years later. */
export function datelineFor(story, memory) {
  const { text, year, dated } = memoryDate(memory);
  const when = (text || "").trim();
  if (!dated) return when;
  const age = ageLabel(story, year);
  if (!age) return when;
  // ageLabel gives "age 30" / "the year they were born"; on the page it wants
  // to read as a sentence fragment beside the date.
  const said = age.startsWith("age ") ? `aged ${age.slice(4)}` : age;
  return `${when} · ${said}`;
}

/* "Remembered by Linh, her daughter" — the line under a memory that somebody
   else sent in. Without it the family's chapter reads as though the
   storyteller wrote it, which is the one thing that chapter is not. */
export function attributionFor(memory) {
  const who = String(memory?.contributor || "").trim();
  return who ? `Remembered by ${who}` : null;
}

/* The book as data. Chapters in the order the book prints them, each with the
   years it spans, and every memory carrying what the page needs.
   `design` is how somebody has designed the book (lib/bookDesign.js); it
   defaults to the one saved on the story, and a story with none prints as
   the book always has.
   `sides` are the story's contributions (data/contributions): each memory
   carries the versions the keeper said yes to (bookDesign sidesInBook:
   never pending or taken off, never on a memory out of the book, none when
   the book is her words only), printed right after hers as "Linh remembers
   it too" (FB-371, DECISIONS T-16); `people` (the tree) gives their
   writers' full names and the storyteller's her or his. */
export function bookStructure(story, { now = new Date(), design = story?.bookDesign, sides = [], people = [], keepers = null, everything = false } = {}) {
  const d = normaliseDesign(design);
  const teller = (people || []).find((p) => p && story?.id && p.storyId === story.id) || null;
  // What prints (S-PL8; bookDesign bookState): every kept memory but the
  // storyteller's "Not for the book", Private ones nobody put in, and the
  // ones a keeper left out. `everything` is every kept memory, for the
  // screen that chooses.
  const memories = (story?.memories || [])
    .filter((m) => m && m.status !== "in_progress" && (everything || includesMemory(d, m)))
    .map((m) => withVersions(m, sides?.length ? printedSides(m, sidesInBook(d, m, sides), { people, teller }).map(inBookVoice) : []));

  // Chapters have been merged and renamed twice, and data/store.js only
  // rewrites a name on its way out of the database. Anything that reaches
  // here another way — a demo fixture, an import, a memory held in memory
  // since before a rename — would otherwise print under a chapter heading
  // that no longer exists, or fall into the catch-all as an orphan. The book
  // is the one artefact that has to survive the app's own history, so it
  // normalises for itself rather than trusting what it was handed.
  const filed = memories.map((m) => ({ ...m, era: normaliseEra(m.era) }));

  const known = new Set(ERAS);
  const arrangement = effectiveArrangement(d);
  let chapters;
  if (arrangement === "timeline") {
    // By year: a chapter per decade, earliest first, and the memories with
    // no year yet together at the end rather than guessed into a decade.
    const byDecade = new Map();
    const undated = [];
    for (const m of filed) {
      const y = memoryDate(m).year;
      if (y == null) undated.push(m);
      else {
        const dec = Math.floor(y / 10) * 10;
        if (!byDecade.has(dec)) byDecade.set(dec, []);
        byDecade.get(dec).push(m);
      }
    }
    chapters = [...byDecade.keys()]
      .sort((a, b) => a - b)
      .map((dec) => ({ era: `The ${dec}s`, items: sortByDate(byDecade.get(dec)) }));
    if (undated.length) chapters.push({ era: "Other memories", items: undated });
  } else {
    chapters = chapterSequence(d).map((era) => ({
      era,
      items: sortByDate(filed.filter((m) => m.era === era)),
    })).filter((g) => g.items.length);

    // Anything normaliseEra couldn't place still gets printed, in the
    // catch-all, rather than vanishing out of somebody's book.
    const orphans = sortByDate(filed.filter((m) => !known.has(m.era)));
    if (orphans.length) {
      const bucket = chapters.find((c) => c.era === CATCH_ALL_CHAPTER);
      if (bucket) bucket.items = sortByDate([...bucket.items, ...orphans]);
      else chapters.push({ era: CATCH_ALL_CHAPTER, items: orphans });
    }
  }

  // The years of the storyteller's own life: family history from before
  // they were born ("Before Rose · 1938") is printed, but never starts the
  // span (lib/familyFacts.js, MASTER-PLAN §8.2), so Archive, Book and
  // cover all say 1951–2011.
  const years = filed
    .filter((m) => !isBeforeTeller(m, story))
    .map((m) => memoryDate(m).year)
    .filter((y) => y != null)
    .sort((a, b) => a - b);

  const span = years.length
    ? years[0] === years[years.length - 1]
      ? String(years[0])
      : `${years[0]}–${years[years.length - 1]}`
    : "";
  // What a cover or title page says about the years. Bare years after a
  // name ("Rose Miller 1938–2011") are how a book gives somebody's life;
  // these are the memories' years, so it says so, and a living woman born
  // in 1945 isn't given a death date.
  const coverSpan = years.length
    ? years[0] === years[years.length - 1]
      ? `Memories from ${years[0]}`
      : `Memories from ${years[0]} to ${years[years.length - 1]}`
    : "";

  // Each chapter gets its own range, which is what makes a chapter opener
  // page worth having — "Childhood, 1945–1957" places the reader.
  const withRanges = chapters.map((c) => {
    const ys = c.items
      .map((m) => memoryDate(m).year)
      .filter((y) => y != null)
      .sort((a, b) => a - b);
    return {
      ...c,
      years: ys.length
        ? ys[0] === ys[ys.length - 1]
          ? String(ys[0])
          : `${ys[0]}–${ys[ys.length - 1]}`
        : "",
      photos: c.items.reduce((n, m) => n + (m.photos?.length || 0), 0),
    };
  });

  const name = (story?.name || "").trim() || "A Story";
  const fullName = [name, (story?.lastName || "").trim()]
    .filter(Boolean)
    .join(" ");

  return {
    name,
    fullName,
    // What the cover and title page say: the design's words, or the
    // person's name and the book's own line.
    title: d.cover.title || fullName,
    subtitle: d.cover.subtitle || SUBTITLE,
    design: d,
    span,
    coverSpan,
    chapters: withRanges,
    memories: filed.length,
    photos: filed.reduce((n, m) => n + (m.photos?.length || 0), 0),
    printedOn: now,
    // The colophon's two credits (S-PL8): the story's keepers, owner
    // first (never whoever has the book open), and everyone whose words
    // print, most first.
    keepers: Array.isArray(keepers) ? keepers : bookKeepers({ story, people }),
    contributors: bookContributors(filed, { people, teller, story }),
  };
}

/* "A", "A and B", "A, B and C". */
export function namesLine(names) {
  const n = (names || []).filter(Boolean);
  if (n.length <= 1) return n[0] || "";
  return `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`;
}

/* A kept version as the book says it (FB-371, T-16): named, in the book's
   voice, never the app's ("Linh added to this memory…"), never "they":
   "Linh remembers it too", then her words, then who she is to the
   storyteller ("Linh Miller, her daughter"). */
export function inBookVoice(side) {
  const who = side.name === "Someone in the family" ? side.name : side.first || side.name || "Someone in the family";
  return { ...side, heading: `${who} remembers it too` };
}

/* A memory with its kept versions: the first three in full, oldest first,
   each credited; past three, the rest as one line, "Also remembered by
   Sam and Peggy", with a code to read them in the app (S-PL8). */
function withVersions(m, theirs) {
  if (!theirs.length) return m;
  const out = { ...m, sides: theirs.slice(0, VERSIONS_IN_FULL) };
  const more = theirs.slice(VERSIONS_IN_FULL);
  if (more.length) {
    const names = [...new Set(more.map((s) => s.first || s.name))];
    out.alsoRemembered = { names, line: `Also remembered by ${namesLine(names)}`, versions: more };
  }
  return out;
}

const fullNameOf = (p) => (p ? [p.givenName, p.familyName].filter(Boolean).join(" ").trim() : "");

/* The story's keepers as the colophon names them, owner first: the
   owner (the story's, else whoever put the storyteller in the tree), then
   each co-keeper whose invitation was taken up (story_managers, active).
   Full names from the tree; never the person reading. */
export function bookKeepers({ story, people = [], managers = [] } = {}) {
  const list = people || [];
  const subject = story?.id ? list.find((p) => p && p.storyId === story.id) : null;
  const ownerId = story?.ownerId || subject?.createdBy || null;
  const names = [];
  const add = (n) => {
    const s = String(n || "").trim();
    if (s && !names.includes(s)) names.push(s);
  };
  const byUser = (id) => (id ? list.find((p) => p && p.userId === id) : null);
  if (ownerId) add(fullNameOf(byUser(ownerId)) || story?.ownerName);
  for (const row of managers || []) {
    if (!row || row.status !== "active" || !row.user_id || row.user_id === ownerId) continue;
    const person = byUser(row.user_id);
    add(fullNameOf(person) || row.name || row.display_name || "");
  }
  return names;
}

/* Everyone whose own words print in the book, most words first: the
   family's own memories ("Linh, her daughter") and their kept versions,
   in or past the three. Never the storyteller herself. */
export function bookContributors(memories, { people = [], teller = null, story = null } = {}) {
  const list = people || [];
  const tellerName = fullNameOf(teller) || [story?.name, story?.lastName].filter(Boolean).join(" ");
  const tellerFirst = String(teller?.givenName || story?.name || "").trim().split(/\s+/)[0];
  const words = new Map();
  const count = (name, body) => {
    const n = String(name || "").trim();
    if (!n || n === tellerName || n === tellerFirst) return;
    words.set(n, (words.get(n) || 0) + String(body || "").length);
  };
  const fromSigned = (signed) => {
    const first = String(signed || "").split(",")[0].trim();
    const matches = list.filter((p) => p && p.givenName && p.givenName === first.split(/\s+/)[0]);
    return matches.length === 1 && first.split(/\s+/).length === 1 ? fullNameOf(matches[0]) : first;
  };
  for (const m of memories || []) {
    if (m?.contributor) count(fromSigned(m.contributor), m.body);
    for (const s of [...(m?.sides || []), ...(m?.alsoRemembered?.versions || [])]) count(s.name, s.body);
  }
  return [...words.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([n]) => n);
}

/* The colophon's credit lines: "Kept by Jamie Miller." and "With memories
   from Linh Miller and Sam Miller." Either is left out with nobody to name. */
export function creditLines(book) {
  const out = [];
  const kept = namesLine(book?.keepers || []);
  if (kept) out.push(`Kept by ${kept}.`);
  const from = namesLine(book?.contributors || []);
  if (from) out.push(`With memories from ${from}.`);
  return out;
}

function formatPrintDate(date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* Photographs. They are the whole reason a family keeps a book on a shelf,
   and the old generator dropped them on the floor.
   `uri` may be a remote URL, a file:// path or a data: URI — all three are
   what the app actually stores, and print renders whichever it can reach. */
function photosHtml(memory) {
  const photos = Array.isArray(memory?.photos) ? memory.photos : [];
  if (!photos.length) return "";
  const cls = photos.length === 1 ? "plate plate-one" : "plate plate-many";
  return `
            <div class="${cls}">
              ${photos
                .map((uri) => `<img src="${escapeHtml(uri)}" alt="">`)
                .join("\n              ")}
            </div>`;
}

/* A code that plays their voice, for a memory with a recording. Beside the
   story rather than at the back of the book: the moment to hear her tell
   it is while reading it. */
function listenHtml(story, memory, design, listenBase, ink) {
  if (!design.qr || !hasVoice(memory)) return "";
  const url = listenUrl(listenBase, memory.id, design.listenKey);
  if (!url) return "";
  const name = String(story?.name || "").trim();
  return `
            <div class="listen">
              <div class="listen-code">${qrSvg(url, ink)}</div>
              <p>Scan with a phone camera to hear ${escapeHtml(name || "them")} tell this.</p>
            </div>`;
}

/* Body text as paragraphs rather than one block with <br> in it. A memoir is
   read in paragraphs, and a page-break lands far better between them.
   Her words with her kept line ruled in the margin and the marks that pair
   a version with its word (lib/bookPages bookLeaf). The rule is how print
   shows the marker (hero-spec §0 rule 2): a 2 pt foil rule in the left
   margin beside every line the kept line touches. Print can't measure
   lines, so each word of it carries a zero-size mark (.kr) that is set
   out of the flow, in the margin, on whatever line its word lands on;
   together they draw the rule over exactly those lines. */
function ruledHtml(text, last) {
  const parts = String(text).split(/(\s+)/);
  const rule = '<span class="kr"></span>';
  return parts.map((p) => (!p || /^\s+$/.test(p) ? p : `${rule}${escapeHtml(p)}`)).join("") + (last ? rule : "");
}
function proseHtml(paragraphs) {
  return paragraphs
    .map((runs) => {
      const lastKept = runs.reduce((at, r, i) => (r.kept && !r.mark ? i : at), -1);
      const inner = runs
        .map((r, i) =>
          r.mark
            ? `<sup class="mark">${escapeHtml(r.text)}</sup>`
            : r.kept
              ? `<span class="kept">${ruledHtml(r.text, i === lastKept)}</span>`
              : escapeHtml(r.text)
        )
        .join("");
      return `<p${lastKept >= 0 ? ' class="has-kept"' : ""}>${inner}</p>`;
    })
    .join("\n            ");
}

/* A version the keeper kept, printed at reading size right after her
   words, as the reader sets it (FB-371, T-16): a brass rule in the margin,
   no slip and no box, so the book reads as one book; its mark and "Linh
   remembers it too", her words, who she is. Never a footnote. */
function sideHtml(side) {
  const words = String(side.body || "")
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p class="side-words">${escapeHtml(p)}</p>`)
    .join("");
  return `
            <aside class="side">
              <p class="side-head">${side.mark ? `<sup class="mark">${escapeHtml(side.mark)}</sup> ` : ""}${escapeHtml(side.heading)}</p>
              ${words}
              <p class="side-by">${escapeHtml(side.byline || side.credit)}</p>
            </aside>`;
}

/* Past three versions, the rest as one line with a code to read them in
   the app (S-PL8); without the book's key, the line alone. */
function alsoHtml(memory, design, readBase, ink) {
  const also = memory.alsoRemembered;
  if (!also) return "";
  const url = readBase ? readUrl(readBase, memory.id, design.listenKey) : null;
  return `
            <div class="also">
              ${url ? `<div class="listen-code">${qrSvg(url, ink)}</div>` : ""}
              <p>${escapeHtml(also.line)}.${url ? " Scan to read their memories of it in A Story." : " Their memories of it are in A Story."}</p>
            </div>`;
}

/* The sides a page of the reader closes with, each with the mark its word
   carries in her words (FB-388): the ¹ after "measured" and the ¹ before
   "Linh remembers it too", as the PDF prints them (memoryHtml). The page's
   sides are the memory's own; bookLeaf is what pairs them, so a side keeps
   the mark bookLeaf gave it, and one whose word isn't on the page has
   none. Matched by id, else by her words. */
export function pairedSides(memory, design, sides) {
  if (!sides?.length) return sides || [];
  const all = memory?.sides || [];
  const marked = bookLeaf(memory, printedBody(design, memory), all).sides;
  const same = (a, b) => a === b || (a?.id ? a.id === b?.id : !!a?.body && a.body === b?.body);
  return sides.map((s) => {
    const i = all.findIndex((x) => same(x, s));
    return i >= 0 ? { ...s, mark: marked[i].mark, anchor: marked[i].anchor } : { ...s, mark: "", anchor: "" };
  });
}

function memoryHtml(story, memory, design, listenBase, ink, readBase = "") {
  const dateline = datelineFor(story, memory);
  const credit = attributionFor(memory);
  const title = (memory.title || "").trim();
  const leaf = bookLeaf(memory, printedBody(design, memory), memory.sides || []);
  // Who asked for it, when the family's daily question brought it (lane V;
  // the phone's page says the same, BookLeaf AskedBy). First name only.
  const askedRaw = typeof memory.askedBy === "string" ? memory.askedBy : memory.askedBy?.name || "";
  const asked = String(askedRaw).trim().split(/\s+/)[0] || "";

  return `
          <article class="memory">
            ${title ? `<h3>${escapeHtml(title)}</h3>` : ""}
            ${dateline ? `<p class="dateline">${escapeHtml(dateline)}</p>` : ""}${asked ? `<p class="asked">Asked by ${escapeHtml(asked)}</p>` : ""}${photosHtml(memory)}
            ${proseHtml(leaf.paragraphs)}
            ${credit ? `<p class="credit">${escapeHtml(credit)}</p>` : ""}${leaf.sides.map(sideHtml).join("")}${alsoHtml(memory, design, readBase, ink)}${listenHtml(story, memory, design, listenBase, ink)}
          </article>`;
}

/* The mark, as inline SVG in one colour, for the cover. The heart is a hole
   through the letter (even-odd), so the board shows through it as it does
   in the app; its bars are drawn in the same colour. */
function markSvg(color, sizeMm) {
  const [tx, ty] = LOGO.translate;
  return `<svg class="cover-mark" viewBox="0 0 ${LOGO.size} ${LOGO.size}" width="${sizeMm}mm" height="${sizeMm}mm" aria-hidden="true">
      <g transform="translate(${tx} ${ty}) scale(${LOGO.scale})">
        <path d="${MARK_PATH}" fill="${color}" fill-rule="evenodd"/>
        <path d="${BARS_PATH}" fill="${color}" fill-rule="evenodd"/>
      </g>
    </svg>`;
}

/* The front of the book, as its first page. A hardcover's case is printed
   separately from its pages, so this is drawn inside the page's margins as
   the cover's design, for the printer to set on the case and for anyone
   printing at home to have a front page. `photo` must already be a URL the
   printer can load (LegacyBookScreen signs it). */
function coverHtml(book, style, story) {
  if (style === "keepsake") return keepsakeCoverHtml(book, story);
  // The photograph set into the board, or none: "No photograph", or a photo
  // style with no photo to show, prints the bare board in the style's own
  // material (FB-329), never the cloth in its place and never a hole.
  const photo = coverPhoto(book.design);
  const bare = coverBare(book.design);
  const title = escapeHtml(book.title);
  const sub = escapeHtml(book.subtitle);
  const span = book.coverSpan ? `<p class="cover-span">${escapeHtml(book.coverSpan)}</p>` : "";
  const c = BOOK_PRINT.covers[style];
  if (style === "wrap" && !bare) {
    return `
  <section class="cover cover-wrap" style="background-image: url('${escapeHtml(photo)}')">
    <div class="cover-shade"></div>
    <div class="cover-foot">
      ${markSvg(c.foil, 12)}
      <h1 class="cover-title">${title}</h1>
      <p class="cover-sub">${sub}</p>
      ${span}
    </div>
  </section>`;
  }
  if (style === "tipped" && !bare) {
    return `
  <section class="cover cover-tipped">
    <div class="cover-spine"></div>
    <h1 class="cover-title">${title}</h1>
    <p class="cover-sub">${sub}</p>
    <div class="cover-plate"><img src="${escapeHtml(photo)}" alt=""></div>
    ${span}
  </section>`;
  }
  // Cloth and heirloom, and every style without a photograph: the family's
  // one foil-blocked board (BookCover.js FoilCover draws the same).
  return `
  <section class="cover cover-${style}${bare ? " cover-bare" : ""}">
    <div class="cover-spine"></div>
    <div class="cover-frame"></div>
    ${style === "heirloom" ? '<div class="cover-frame cover-frame-inner"></div>' : ""}
    ${markSvg(c.foil, style === "heirloom" ? 22 : 18)}
    <h1 class="cover-title">${title}</h1>
    <div class="cover-rule"></div>
    <p class="cover-sub">${sub}</p>
    ${span}
  </section>`;
}

/* A Story's own cover, as the phone draws it (BookCover.js, lane B B-2): the
   title in foil, the line, one photograph in a debossed window, her name
   written under it; the family's own line at the foot if they wrote one.
   Every word and photo has a default from the story, so it is finished
   before anybody touches it. */
function keepsakeCoverHtml(book, story) {
  const w = keepsakeWords(book.design, book, story);
  const photos = coverPrints(book.design, keepsakePhotos(book.design, story));
  return `
  <section class="ks-page">
    ${keepsakeFrontHtml(w, photos, book.design.cover.tone, book.design.cover.tagline || "")}
  </section>`;
}

/* ── Print profiles (L6, 25 Oct) ──────────────────────────────────────
   A print shop wants an exact page box, margins clear of the trim and the
   binding, a page count it can bind, and a cover laid flat to the
   millimetre. With no profile the book is what it always was (the screen,
   the phone's print dialog, the preview): nothing below runs. With one,
   the interior is set at the printer's page box with mirrored margins and
   the cover is one spread: wrap, back, spine, front, wrap.

   Every number here is the printer's, written down on 25 Oct 2026, and is
   to be checked against the template the printer generates for the exact
   page count before a real order (docs/book-fulfilment.md, Print specs).
   Margins are measured from the trim; the page box adds the bleed. */
export const PRINT_PROFILES = {
  // Lulu "US Trade" 6 × 9 in, Hardcover Casewrap. Interior with bleed:
  // 6.25 × 9.25 in. Lulu's safety margin is 0.5 in from the trim; a case
  // binding swallows more at the gutter, so the inside margin is wider.
  "lulu-6x9-hardcover": {
    printer: "Lulu",
    binding: "casewrap",
    trimIn: [6, 9],
    bleedIn: 0.125,
    marginsIn: { top: 0.75, bottom: 0.8, inside: 0.875, outside: 0.625 },
    pageMultiple: 2, // assumption: an even count (each leaf has two sides)
    minPages: 24, // Lulu's casewrap spine table starts at 24 pages
    maxPages: 800,
    spine: "lulu-casewrap",
    // Assumption (Lulu's template is the truth): the board stands 0.125 in
    // proud of the pages at head, foot and fore-edge, and the printed
    // cloth wraps 0.75 in round the board's edges.
    cover: { overhangIn: 0.125, wrapIn: 0.75 },
  },
  // The 8 × 8 in square lay-flat Daniel tried at PrestoPhoto (its sample
  // interior is 594 pt = 8.25 in square: 8 in trim and 0.125 in bleed all
  // round). The keepsake cover was drawn square, so it sits here as drawn.
  "square-8x8-layflat": {
    printer: "PrestoPhoto (or Blurb)",
    binding: "layflat",
    trimIn: [8, 8],
    bleedIn: 0.125,
    marginsIn: { top: 0.625, bottom: 0.7, inside: 0.75, outside: 0.625 },
    pageMultiple: 2, // assumption: an even count
    minPages: 20, // assumption: the usual photo-book minimum
    maxPages: 200, // assumption
    spine: "linear",
    cover: { overhangIn: 0.125, wrapIn: 0.75 },
  },
  // The book A Story sells (supabase/functions/_shared/printCatalog.js,
  // ASTORY-SQ-HC-8): Prodigi's square hardcover photo book, 8.27 in square,
  // PUR bound. TODO(sandbox): every number here is ours until checked
  // against Prodigi's print guide and a sandbox order (trim, bleed, safe
  // zone, margins, page rules, spine and the cover's wrap). PUR glue takes
  // more at the gutter, so the inside margin is the widest, and every
  // margin stays at or above safeIn (the catalog's safe zone).
  "prodigi-square-hc-8": {
    printer: "Prodigi",
    binding: "pur",
    trimIn: [8.27, 8.27],
    bleedIn: 0.125,
    safeIn: 0.375,
    marginsIn: { top: 0.625, bottom: 0.7, inside: 0.8, outside: 0.6 },
    pageMultiple: 2,
    minPages: 24,
    maxPages: 300,
    spine: "linear",
    cover: { overhangIn: 0.125, wrapIn: 0.75 },
  },
};

/* The text block (the trim less the margins), in inches: the placed size
   assumed for a full-width photo. No photo is drawn larger, so a check
   against it is the conservative one. */
export const PHOTO_PLACED_IN = (profile) => {
  const p = typeof profile === "string" ? PRINT_PROFILES[profile] : profile;
  const m = p.marginsIn;
  const r = (n) => Math.round(n * 10000) / 10000;
  return { widthIn: r(p.trimIn[0] - m.inside - m.outside), heightIn: r(p.trimIn[1] - m.top - m.bottom) };
};

// Lulu's Hardcover Casewrap spine table, [last page count, inches]
// (help.api.lulu.com, "How is spine width calculated?", read 25 Oct 2026).
// Below 24 pages Lulu won't bind a casewrap.
export const LULU_CASEWRAP_SPINE_IN = [
  [84, 0.25], [140, 0.5], [168, 0.625], [194, 0.6875], [222, 0.75], [250, 0.8125],
  [278, 0.875], [306, 0.9375], [334, 1], [360, 1.0625], [388, 1.125], [416, 1.1875],
  [444, 1.25], [472, 1.3125], [500, 1.375], [528, 1.4375], [556, 1.5], [582, 1.5625],
  [610, 1.625], [638, 1.6875], [666, 1.75], [694, 1.8125], [722, 1.875], [750, 1.9375],
  [778, 2], [799, 2.0625], [800, 2.125],
];

// For a printer with no table: one constant per page. 1/444 in is Lulu's
// own figure for its standard paper (paperback formula pages / 444 + 0.06),
// and its casewrap table climbs at the same rate (0.0625 in per 28 pages).
// The allowance is the boards and the hinge. Both are assumptions.
export const PAPER_IN_PER_PAGE = 1 / 444;
export const BOARD_ALLOWANCE_IN = 0.25;

const round4 = (n) => Math.round(n * 10000) / 10000;

export function printProfile(name) {
  if (!name) return null;
  const p = PRINT_PROFILES[name];
  if (!p) throw new Error(`Unknown print profile "${name}". Known: ${Object.keys(PRINT_PROFILES).join(", ")}`);
  return p;
}

const asProfile = (p) => (typeof p === "string" ? printProfile(p) : p);

/* The PDF's page box: the trim plus the bleed on every edge, in inches. */
export function pageBoxIn(profile) {
  const p = asProfile(profile);
  return [round4(p.trimIn[0] + 2 * p.bleedIn), round4(p.trimIn[1] + 2 * p.bleedIn)];
}

/* Margins from the page box's edges (the bleed added to the margin from
   the trim), mirrored: on a right-hand page (recto, odd, page 1) the
   binding is on the left; on a left-hand page (verso) it is on the right. */
export function pageMarginsIn(profile) {
  const p = asProfile(profile);
  const m = p.marginsIn;
  const b = p.bleedIn;
  const top = round4(m.top + b);
  const bottom = round4(m.bottom + b);
  const inside = round4(m.inside + b);
  const outside = round4(m.outside + b);
  return {
    recto: { top, bottom, left: inside, right: outside },
    verso: { top, bottom, left: outside, right: inside },
  };
}

/* The page count the printer will bind: at least its minimum, rounded up
   to its multiple. `blanks` is how many empty pages go at the back. */
export function paddedPageCount(profile, pages) {
  const p = asProfile(profile);
  const n = Math.max(0, Math.ceil(pages || 0));
  const padded = Math.max(p.minPages, Math.ceil(n / p.pageMultiple) * p.pageMultiple);
  return { pages: padded, blanks: padded - n, tooMany: padded > p.maxPages };
}

/* The spine's width in inches for a bound page count. */
export function spineWidthIn(profile, pages) {
  const p = asProfile(profile);
  if (p.spine === "lulu-casewrap") {
    const row = LULU_CASEWRAP_SPINE_IN.find(([upTo]) => pages <= upTo);
    return row ? row[1] : LULU_CASEWRAP_SPINE_IN[LULU_CASEWRAP_SPINE_IN.length - 1][1];
  }
  return round4(pages * PAPER_IN_PER_PAGE + BOARD_ALLOWANCE_IN);
}

/* The cover laid flat, in inches: wrap | back board | spine | front board
   | wrap across, wrap | board | wrap down. A board is the trim plus its
   overhang at the fore-edge (width) and at head and foot (height). */
export function coverSpreadIn(profile, pages, { spineIn } = {}) {
  const p = asProfile(profile);
  const spine = spineIn ?? spineWidthIn(p, pages);
  const { overhangIn, wrapIn } = p.cover;
  const faceW = round4(p.trimIn[0] + overhangIn);
  const faceH = round4(p.trimIn[1] + 2 * overhangIn);
  return {
    width: round4(2 * wrapIn + 2 * faceW + spine),
    height: round4(2 * wrapIn + faceH),
    spine,
    faceW,
    faceH,
    wrap: wrapIn,
  };
}

/* The interior's @page rules for a profile. */
export function printPageCss(profile) {
  const [w, h] = pageBoxIn(profile);
  const { recto, verso } = pageMarginsIn(profile);
  return `@page { size: ${w}in ${h}in; margin: ${recto.top}in ${recto.right}in ${recto.bottom}in ${recto.left}in; }
  @page :right { margin-left: ${recto.left}in; margin-right: ${recto.right}in; }
  @page :left { margin-left: ${verso.left}in; margin-right: ${verso.right}in; }`;
}

const SCREEN_PAGE_CSS = "@page { margin: 20mm 18mm; }";

// Only with a print profile. An empty page is empty: no "Notes", no
// lines, nothing of ours (their words, never our debris).
const PRINT_EXTRA_CSS = `
  .pad-page { page-break-before: always; break-before: page; height: 1px; }
`;

/* The outside of the book, as one landscape page for the printer: back,
   spine, front, the way a case is laid flat. The keepsake cover only; the
   other styles are single boards. Square covers, as the template is;
   `coverMm` is the side and `spineMm` the spine, both the printer's to
   confirm (the spine depends on the page count and their paper).
   With `print` (a profile's name) and `pages` (the bound count), the spread
   is the printer's: see printCoverWrapHtml. */
export function buildCoverWrapHtml(
  story,
  { design = story?.bookDesign, now = new Date(), coverMm = 216, spineMm = Math.round(216 * SPINE_SHARE), print = null, pages = 0, spineIn } = {}
) {
  const book = bookStructure(story, { now, design });
  const C = BOOK_PRINT.covers.keepsake[book.design.cover.color] || BOOK_PRINT.covers.keepsake.chocolate;
  const w = keepsakeWords(book.design, book, story);
  const photos = coverPrints(book.design, keepsakePhotos(book.design, story));
  if (print) return printCoverWrapHtml({ book, C, w, photos, profile: printProfile(print), pages, spineIn });
  return withFullSerif(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(w.title)}: cover</title>
<style>
  @page { size: ${coverMm * 2 + spineMm}mm ${coverMm}mm; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  .wrap { display: flex; width: ${coverMm * 2 + spineMm}mm; height: ${coverMm}mm; }
  .wrap > .ks-back, .wrap > .ks-front { width: ${coverMm}mm; height: ${coverMm}mm; }
  .wrap > .ks-spine { width: ${spineMm}mm; height: ${coverMm}mm; }
${keepsakeCss(C)}
</style>
</head>
<body>
  <div class="wrap">
    ${keepsakeBackHtml(w)}
    ${keepsakeSpineHtml(w, C)}
    ${keepsakeFrontHtml(w, photos, book.design.cover.tone, book.design.cover.tagline || "")}
  </div>
</body>
</html>`);
}

/* The printer's cover spread. The whole sheet is the board's colour, so the
   wrap and any slip in the trim show cloth, never white; the spine's
   colour runs the full height for the same reason. The keepsake's square
   front and back are centred on each board's face (on a 6 × 9 board a
   square of the face's width, the board above and below it), and the
   spine's sprig, words and mark sit on the spine's face. No crop marks:
   print-on-demand shops want none. */
function printCoverWrapHtml({ book, C, w, photos, profile, pages, spineIn }) {
  const s = coverSpreadIn(profile, pages, { spineIn });
  const side = Math.min(s.faceW, s.faceH);
  const artTop = round4(s.wrap + (s.faceH - side) / 2);
  const backLeft = round4(s.wrap + (s.faceW - side) / 2);
  const spineLeft = round4(s.wrap + s.faceW);
  const frontLeft = round4(spineLeft + s.spine + (s.faceW - side) / 2);
  return withFullSerif(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(w.title)}: cover, ${escapeHtml(profile.printer)} ${profile.trimIn[0]} × ${profile.trimIn[1]} in, ${pages} pages</title>
<style>
  @page { size: ${s.width}in ${s.height}in; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  .wrap {
    position: relative; overflow: hidden;
    width: ${s.width}in; height: ${s.height}in;
    background: ${C.board};
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  /* Two classes deep, so keepsakeCss's position: relative (later, one
     class) can't pull the boards back into the flow. */
  .wrap > .spine-cloth, .wrap > .ks-back, .wrap > .ks-spine, .wrap > .ks-front { position: absolute; }
  .wrap > .spine-cloth { left: ${spineLeft}in; top: 0; width: ${s.spine}in; height: ${s.height}in; background: ${C.spine}; }
  .wrap > .ks-back { left: ${backLeft}in; top: ${artTop}in; width: ${side}in; height: ${side}in; }
  .wrap > .ks-spine { left: ${spineLeft}in; top: ${s.wrap}in; width: ${s.spine}in; height: ${s.faceH}in; }
  .wrap > .ks-front { left: ${frontLeft}in; top: ${artTop}in; width: ${side}in; height: ${side}in; }
${keepsakeCss(C)}
</style>
</head>
<body>
  <div class="wrap">
    <div class="spine-cloth"></div>
    ${keepsakeBackHtml(w)}
    ${keepsakeSpineHtml(w, C)}
    ${keepsakeFrontHtml(w, photos, book.design.cover.tone, book.design.cover.tagline || "")}
  </div>
</body>
</html>`);
}

/* The printable book, as one HTML document handed to expo-print.
   `recordedBy` is the account holder — the grandson who sat with her — which
   belongs on the title page of a book he will hand to his own children.
   `design` defaults to the one saved on the story; see bookStructure. */
// `listenBase` is where the listening codes point (the listen function, or
// a redirect on our own domain); without it the book prints no codes.
// `sides` and `people` print the family's kept versions; see bookStructure.
// `keepers` names the story's keepers for the title page and colophon
// (bookKeepers); without it they are worked out from the story and tree.
// `recordedBy` (whoever is printing) is no longer printed: "Kept by" is
// the story's keepers, never the reader (S-PL8). `readBase` is where the
// "Also remembered by" codes point.
export function buildLegacyHtml(
  story,
  { now = new Date(), design = story?.bookDesign, listenBase = "", readBase = "", sides = [], people = [], keepers = null, print = null, padPages = 0 } = {}
) {
  const book = bookStructure(story, { now, design, sides, people, keepers });
  // A print profile (PRINT_PROFILES): the printer's page box and mirrored
  // margins, no cover page (the case carries the cover), and `padPages`
  // empty pages at the back to reach a count the printer binds. Without
  // one, the book is exactly the screen's.
  const profile = printProfile(print);
  const P = BOOK_PRINT.papers[book.design.paper] || BOOK_PRINT.papers.classic;
  const coverStyle = effectiveCoverStyle(book.design);
  // The keepsake cover comes in colourways; the others have one palette.
  const C =
    coverStyle === "keepsake"
      ? BOOK_PRINT.covers.keepsake[book.design.cover.color] || BOOK_PRINT.covers.keepsake.chocolate
      : BOOK_PRINT.covers[coverStyle];
  const paperName =
    book.design.paper === "classic" ? "" : PAPERS.find((p) => p.key === book.design.paper)?.name || "";

  if (!book.chapters.length) {
    return emptyBookHtml(book);
  }

  // "What Rose learned" (lessons-spec §4; the phone's lessonsChapter): her
  // confirmed lessons from the memories this book prints, by theme, after
  // her chapters and before the family's. Only with three or more.
  const printedIds = new Set(book.chapters.flatMap((c) => c.items.map((m) => m.id)));
  const lessonGroups = bookLessons(lessonsForStory(story), (story?.memories || []).filter((m) => m && printedIds.has(m.id)), { includePrivate: true });
  const learnedTitle = `What ${book.name || story?.name || "she"} learned`;
  const learnedToc = lessonGroups.length
    ? `
        <li>
          <span class="toc-chapter">${escapeHtml(learnedTitle)}</span>
          <span class="toc-dots"></span>
          <span class="toc-count">${lessonGroups.reduce((n, g) => n + g.lessons.length, 0)}</span>
        </li>`
    : "";
  const learnedHtml = lessonGroups.length
    ? `
      <section class="chapter lessons">
        <header class="chapter-open">
          <p class="chapter-eyebrow">Chapter</p>
          <h2>${escapeHtml(learnedTitle)}</h2>
        </header>
        ${lessonGroups
          .map(
            (g) => `
        <div class="lesson-theme">
          <h3>${escapeHtml(g.label)}</h3>
          ${g.lessons
            .map(
              (l) => `<blockquote class="lesson"><p>“${escapeHtml(quoteShown(l, l.memory).replace(/^[“"]|[”"]$/g, ""))}”</p>${sourceLine(l.memory) ? `<p class="lesson-from">— ${escapeHtml(sourceLine(l.memory))}</p>` : ""}</blockquote>`
            )
            .join("")}
        </div>`
          )
          .join("")}
      </section>`
    : "";
  const withLearned = (list, isFamily, html) => {
    // Before the family's chapter, else at the end.
    const at = list.findIndex(isFamily);
    if (!html) return list.join("");
    if (at < 0) return list.join("") + html;
    return [...list.slice(0, at), html, ...list.slice(at)].join("");
  };

  const contents = book.chapters
    .map(
      (c) => `
        <li>
          <span class="toc-chapter">${escapeHtml(printedChapterName(c.era))}</span>
          <span class="toc-dots"></span>
          <span class="toc-count">${c.items.length}</span>
        </li>`
    );
  const contentsHtml = withLearned(contents, (_, i) => book.chapters[i].era === FAMILY_CHAPTER, learnedToc);

  const chapters = book.chapters
    .map((c) => {
      const isFamily = c.era === FAMILY_CHAPTER;
      return `
      <section class="chapter">
        <header class="chapter-open">
          <p class="chapter-eyebrow">${isFamily ? "In their own words" : "Chapter"}</p>
          <h2>${escapeHtml(printedChapterName(c.era))}</h2>
          ${c.years ? `<p class="chapter-years">${escapeHtml(c.years)}</p>` : ""}
        </header>
        ${c.items.map((m) => memoryHtml(story, m, book.design, listenBase, P.ink, readBase)).join("")}
      </section>`;
    });
  const chaptersHtml = withLearned(chapters, (_, i) => book.chapters[i].era === FAMILY_CHAPTER, learnedHtml);

  const credits = creditLines(book);
  const keptBy = book.keepers?.length ? `Kept by ${namesLine(book.keepers)}` : "";
  const credit = keptBy ? `<p class="recorded">${escapeHtml(keptBy)}</p>` : "";

  return withFullSerif(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(book.title)} — ${escapeHtml(book.subtitle)}</title>
<style>
  /* Print CSS, not app CSS. Custom faces don't reliably embed when WebKit
     renders HTML to a PDF, so this uses the serif stack every device has —
     a book that prints in the right font everywhere beats one that prints
     beautifully on the machine it was built on. */
  ${profile ? printPageCss(profile) : SCREEN_PAGE_CSS}

  * { box-sizing: border-box; margin: 0; padding: 0; }

  /* The paper's colour is not printed. A cream book is printed on cream
     stock, not in cream ink (and a tint printed on a page stops at its
     margins, leaving a white frame round every page), so the pages here are
     white, set in the chosen paper's inks, and the paper travels with the
     order as the stock to print on; the colophon names it. Backgrounds are
     asked for because the cover has them, and WebKit leaves backgrounds out
     of a print unless told otherwise. */
  html, body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    font-family: Georgia, "Iowan Old Style", "Times New Roman", serif;
    font-size: 11.5pt;
    line-height: 1.72;
    color: ${P.ink};
    -webkit-font-smoothing: antialiased;
    /* No single line of a paragraph stranded on its own page. */
    orphans: 2;
    widows: 2;
  }

  /* ── Title page ─────────────────────────────────────── */
  /* Every vertical drop below is in millimetres, never vh. A vh is a viewport
     height, and a printed page has no viewport — engines resolve it against
     whatever box they happen to be laying out, which is how the chapter
     openers once became eight near-blank pages with the year span orphaned
     onto the next one. Millimetres mean the same thing on paper as on screen.
     There is a test that fails if a vh ever comes back. */
  .title-page {
    page-break-after: always;
    text-align: center;
    padding-top: 46mm;
  }
  .title-rule {
    width: 54px;
    height: 3px;
    background: ${P.accent};
    margin: 0 auto 26px;
  }
  .title-page h1 {
    font-size: 34pt;
    font-weight: normal;
    line-height: 1.1;
    color: ${P.heading};
    letter-spacing: 0.01em;
  }
  .title-page .subtitle {
    margin-top: 10px;
    font-size: 13pt;
    font-style: italic;
    color: ${P.soft};
  }
  .title-page .span {
    margin-top: 30px;
    font-size: 12pt;
    letter-spacing: 0.22em;
    color: ${P.span};
  }
  .title-page .recorded {
    margin-top: 52px;
    font-size: 10pt;
    color: ${P.faint};
  }

  /* ── Contents ───────────────────────────────────────── */
  .contents { page-break-after: always; padding-top: 10mm; }
  .contents h2 {
    font-size: 16pt;
    font-weight: normal;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: ${P.accent};
    margin-bottom: 26px;
  }
  .contents ol { list-style: none; }
  .contents li {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 9px 0;
    border-bottom: 1px solid ${P.rule};
  }
  .toc-chapter { font-size: 12.5pt; }
  .toc-dots { flex: 1; border-bottom: 1px dotted ${P.dots}; }
  .toc-count { font-size: 10pt; color: ${P.faint}; }

  /* ── Chapter openers ────────────────────────────────── */
  .chapter { page-break-before: always; }
  .chapter-open {
    /* Both rules matter. break-inside keeps the chapter name and its year
       span on one page; break-after keeps the first memory from being pushed
       off the opener page, so a chapter opens and immediately begins, the way
       a trade hardback does, instead of spending a whole leaf on two words. */
    page-break-inside: avoid;
    page-break-after: avoid;
    padding: 24mm 0 30px;
    border-bottom: 2px solid ${P.accent};
    margin-bottom: 30px;
  }
  .chapter-eyebrow {
    font-size: 9pt;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: ${P.faint};
    margin-bottom: 10px;
  }
  .chapter-open h2 {
    font-size: 26pt;
    font-weight: normal;
    line-height: 1.12;
    color: ${P.heading};
  }
  .chapter-years {
    margin-top: 8px;
    font-size: 11pt;
    font-style: italic;
    color: ${P.soft};
  }

  /* ── A memory ───────────────────────────────────────── */
  /* A memory is allowed to run over a page turn — forcing it whole would
     push any long one to the next page and leave half a page blank. What is
     never allowed to split is the title from its dateline, the dateline from
     what follows, or a photograph from itself. */
  .memory { margin-bottom: 30px; }
  /* The gap under a memory's title belongs to the title, not to the dateline
     below it. Not every memory has a date — plenty of the best ones are
     "what I'd tell the grandchildren", with no year attached — and when the
     spacing lived on the dateline those memories printed with the first line
     of the story pressed against the title. The dateline pulls itself back up
     into that gap so a dated memory looks exactly as it did. */
  .memory h3 {
    font-size: 14pt;
    font-weight: normal;
    line-height: 1.3;
    margin-bottom: 13px;
    page-break-after: avoid;
  }
  .dateline {
    font-size: 9.5pt;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${P.accent};
    margin: -8px 0 13px;
    page-break-after: avoid;
  }
  .memory p { margin-bottom: 10px; text-align: justify; hyphens: auto; }
  .asked {
    font-size: 8.5pt; letter-spacing: 0.1em; text-transform: uppercase;
    color: ${P.faint}; margin: -8px 0 13px;
  }
  /* What she learned: her words in italic, where each came from under it. */
  .lesson-theme { margin-bottom: 18px; page-break-inside: auto; }
  .lesson-theme h3 { font-size: 15pt; font-weight: normal; color: ${P.heading}; margin-bottom: 8px; page-break-after: avoid; }
  .lesson { margin: 0 0 12px; padding-bottom: 10px; border-bottom: 0.5pt solid ${P.rule || "#ddd"}; page-break-inside: avoid; }
  .lesson p { font-style: italic; font-size: 13pt; line-height: 1.5; }
  .lesson .lesson-from { font-style: normal; font-size: 8.5pt; letter-spacing: 0.06em; color: ${P.faint}; margin-top: 4px; }
  .memory p:last-of-type { margin-bottom: 0; }

  /* Her kept line: a 2 pt foil rule in the left margin beside its lines
     (see proseHtml). Each .kr sits at its word's line, out of the flow, a
     full line tall, so neighbouring ones join into one rule. */
  .memory p.has-kept { position: relative; }
  .kr {
    position: absolute;
    left: -4.5mm;
    width: 0.7mm;
    height: 1.72em;
    margin-top: -0.36em;
    background: ${P.gold};
  }
  /* The mark that pairs a version with its word: terracotta, after the
     word, as the reader sets it (a foil speck was lost in print). */
  sup.mark {
    font-size: 0.8em;
    line-height: 0;
    vertical-align: super;
    margin-left: 0.04em;
    color: ${P.accent};
  }

  /* A version the keeper kept (FB-371, T-16): right after her words, on
     the page's own paper, a fine brass rule in the margin beside it, as
     the reader sets it. No slip, no box: one book. Her words at the same
     size as the storyteller's; "Linh remembers it too" in the italic; who
     she is in the dateline's small capitals. It never splits across a
     page. */
  .side {
    margin: 7mm 0 2mm;
    padding: 0.6mm 0 0.6mm 5mm;
    border-left: 0.6pt solid ${P.gold};
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .memory .side p { text-align: left; hyphens: manual; margin-bottom: 0; }
  .memory .side .side-head { font-style: italic; color: ${P.soft}; margin-bottom: 2.5mm; }
  .memory .side .side-words + .side-words { margin-top: 2mm; }
  .memory .side .side-by {
    margin-top: 3mm;
    font-size: 8pt;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${P.soft};
  }

  .credit {
    margin-top: 12px;
    font-size: 9.5pt;
    font-style: italic;
    color: ${P.soft};
    text-align: right;
  }

  /* ── Listening codes ──────────────────────────────────── */
  .listen {
    display: flex; align-items: center; gap: 4mm;
    margin-top: 5mm; padding-top: 3mm;
    border-top: 1px solid ${P.rule};
    page-break-inside: avoid;
  }
  /* 22mm: large enough for any phone camera at reading distance. */
  .listen-code { width: 22mm; height: 22mm; flex: none; }
  .listen-code svg { width: 100%; height: 100%; display: block; }
  .listen p { font-size: 9pt; font-style: italic; color: ${P.soft}; margin: 0; }
  .also {
    display: flex; align-items: center; gap: 4mm;
    margin-top: 5mm;
    page-break-inside: avoid;
  }
  .memory .also p { font-size: 9.5pt; font-style: italic; color: ${P.soft}; margin: 0; text-align: left; }

  /* ── Photographs ────────────────────────────────────── */
  .plate { page-break-inside: avoid; margin: 16px 0 18px; }
  .plate img {
    display: block;
    width: 100%;
    border: 1px solid ${P.rule};
  }
  .plate-one img { max-height: 108mm; object-fit: cover; }
  .plate-many {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .plate-many img {
    width: calc(50% - 4px);
    height: 42mm;
    object-fit: cover;
  }

  /* ── Colophon ───────────────────────────────────────── */
  .colophon {
    page-break-before: always;
    padding-top: 60mm;
    text-align: center;
    font-size: 10.5pt;
    color: ${P.soft};
  }
  .colophon .rule {
    width: 40px;
    height: 2px;
    background: ${P.gold};
    margin: 0 auto 20px;
  }
  .colophon p { margin-bottom: 7px; }
  .colophon .line { font-style: italic; color: ${P.span}; margin-top: 18px; }

  /* ── Cover ──────────────────────────────────────────── */
  /* Millimetres, for the reason given above the title page. 168mm is the
     height that fits inside the margins of both the A5 the book is printed
     at and the Letter a phone's print dialog defaults to. */
  .cover {
    page-break-after: always;
    position: relative;
    height: 168mm;
    overflow: hidden;
    border-radius: 1.5mm 4mm 4mm 1.5mm;
    background: ${C.board};
    color: ${C.text};
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 16mm 0 20mm;
  }
  .cover-spine {
    position: absolute; left: 0; top: 0; bottom: 0; width: 8mm;
    background: ${C.deep};
    box-shadow: inset -1.2mm 0 1.5mm rgba(0, 0, 0, 0.18);
  }
  .cover-frame {
    position: absolute; top: 9mm; bottom: 9mm; left: 14mm; right: 7mm;
    border: 0.5mm solid ${C.foil};
    opacity: 0.7;
  }
  .cover-frame-inner { top: 11.5mm; bottom: 11.5mm; left: 16.5mm; right: 9.5mm; border-width: 0.25mm; }
  .cover-mark { display: block; margin: 0 auto 7mm; }
  .cover-title {
    font-size: 27pt; font-weight: normal; line-height: 1.12; letter-spacing: 0.02em;
    color: ${C.foil};
  }
  .cover-rule { width: 16mm; height: 0.5mm; background: ${C.foil}; margin: 6mm auto 5mm; opacity: 0.85; }
  .cover-sub { font-size: 11.5pt; font-style: italic; color: ${C.soft}; }
  .cover-span { margin-top: 5mm; font-size: 9.5pt; letter-spacing: 0.3em; color: ${C.soft}; }

  .cover-heirloom .cover-title { font-size: 25pt; }
  .cover-heirloom .cover-mark { margin-bottom: 9mm; }

  /* A linen board: the title printed in ink rather than foil, and the
     photograph set into it like a tipped-in plate. Flat colour, on
     purpose: a translucent weave came out of the PDF as a pink board,
     and a print shop's RIP is no kinder to transparency than a viewer. */
  .cover-tipped {
    justify-content: flex-start;
    padding-top: 20mm;
  }
  .cover-tipped .cover-title { color: ${C.text}; font-size: 24pt; }
  .cover-tipped .cover-sub { margin-top: 3mm; }
  .cover-plate {
    margin-top: 10mm;
    padding: 2.5mm;
    background: ${C.frame};
    box-shadow: 0 0.6mm 2mm rgba(0, 0, 0, 0.22);
    transform: rotate(-1.2deg);
  }
  .cover-plate img { display: block; width: 72mm; height: 86mm; object-fit: cover; }
  .cover-tipped .cover-span { color: ${C.soft}; margin-top: 8mm; }

  /* The photograph across the whole cover, the words laid over its foot. */
  .cover-wrap {
    justify-content: flex-end;
    padding: 0 14mm 16mm;
    background-size: cover;
    background-position: center;
  }
  /* A band of shade behind the words, not a gradient into the photo, for
     the same reason as the linen board above. */
  .cover-shade {
    position: absolute; left: 0; right: 0; bottom: 0; height: 44%;
    background: ${C.shade};
  }
  .cover-foot { position: relative; }
  .cover-wrap .cover-title { color: ${C.text}; }
  .cover-wrap .cover-mark { margin-bottom: 5mm; }

  /* No photograph (FB-329): a photo style prints the family's bare board in
     its own material, the words centred and in foil as on the cloth. */
  .cover-bare { justify-content: center; padding: 0 16mm 0 20mm; }
  .cover-bare .cover-title { color: ${C.foil}; font-size: 27pt; }
  .cover-bare .cover-sub { margin-top: 0; }
  .cover-bare .cover-span { margin-top: 5mm; }

  /* ── Keepsake cover ─────────────────────────────────── */
  /* The front, square, as the first page: see lib/bookCase.js. */
  .ks-page { page-break-after: always; padding-top: 12mm; }
${coverStyle === "keepsake" ? keepsakeCss(C) : ""}

  /* The dedication page of a keepsake book, as the template's back cover. */
  .dedication-keepsake .ded-to {
    font-family: Georgia, serif; font-style: normal; font-size: 10pt;
    letter-spacing: 0.08em; color: ${P.faint};
  }
  .dedication-keepsake .ded-rule { width: 12mm; height: 1px; background: ${P.dots}; margin: 5mm auto; }
  .dedication-keepsake .ded-name {
    font-family: "AStoryScript", cursive; font-style: normal;
    font-size: 40pt; line-height: 1.1; color: ${P.heading}; margin-bottom: 8mm;
  }

  /* ── Dedication ─────────────────────────────────────── */
  .dedication {
    page-break-after: always;
    padding: 58mm 12mm 0;
    text-align: center;
  }
  .dedication p {
    font-size: 13pt;
    font-style: italic;
    line-height: 1.6;
    color: ${P.span};
    white-space: pre-line;
  }
${profile ? PRINT_EXTRA_CSS : ""}</style>
</head>
<body>
${profile ? "" : coverHtml(book, coverStyle, story)}

  <section class="title-page">
    <div class="title-rule"></div>
    <h1>${escapeHtml(book.title)}</h1>
    <p class="subtitle">${escapeHtml(book.subtitle)}</p>
    ${book.coverSpan ? `<p class="span">${escapeHtml(book.coverSpan)}</p>` : ""}
    ${credit}
  </section>
${coverStyle === "keepsake" ? `
  <section class="dedication dedication-keepsake">
    <p class="ded-to">Dedicated to</p>
    <div class="ded-rule"></div>
    <p class="ded-name">${escapeHtml(keepsakeWords(book.design, book, story).backName)}</p>
    ${book.design.dedication ? `<p>${escapeHtml(book.design.dedication)}</p>` : ""}
  </section>` : book.design.dedication ? `
  <section class="dedication">
    <p>${escapeHtml(book.design.dedication)}</p>
  </section>` : ""}

  <section class="contents">
    <h2>Contents</h2>
    <ol>${contentsHtml}
    </ol>
  </section>
${chaptersHtml}

  <section class="colophon">
    <div class="rule"></div>
    <p>${book.memories} ${book.memories === 1 ? "memory" : "memories"}${
      book.photos ? `, ${book.photos} ${book.photos === 1 ? "photograph" : "photographs"}` : ""
    }</p>
    ${book.span ? `<p>Spanning ${escapeHtml(book.span)}</p>` : ""}
    <p>Printed ${escapeHtml(formatPrintDate(book.printedOn))}${
      paperName ? ` on ${escapeHtml(paperName.toLowerCase())} paper` : ""
    }</p>
    ${credits.map((l) => `<p>${escapeHtml(l)}</p>`).join("\n    ")}
    <p class="line">Every life holds a story worth preserving.</p>
  </section>
${profile && padPages > 0 ? '  <div class="pad-page"></div>\n'.repeat(padPages) : ""}
</body>
</html>`);
}

function emptyBookHtml(book) {
  return withFullSerif(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(book.fullName)}</title>
<style>
  body {
    font-family: Georgia, "Times New Roman", serif;
    color: #2E1F17;
    padding: 25vh 18mm 0;
    text-align: center;
  }
  h1 { font-weight: normal; font-size: 26pt; color: #0F4A58; }
  p { margin-top: 14px; font-style: italic; color: #6B5546; }
</style>
</head>
<body>
  <h1>${escapeHtml(book.fullName)}</h1>
  <p>This book has no memories in it yet.</p>
  <p>Open A Story, answer one question, and print it again.</p>
</body>
</html>`);
}
