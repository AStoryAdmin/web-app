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
  DEFAULT_SUBTITLE,
  PAPERS,
  keepsakePhotos,
  keepsakeWords,
  effectiveArrangement,
  printedBody,
  printedChapterName,
  listenUrl,
  hasVoice,
} from "./bookDesign.js";
import { qrSvg } from "./qr.js";
import { BOOK_PRINT } from "../theme/index.js";
import {
  keepsakeFrontHtml,
  keepsakeBackHtml,
  keepsakeSpineHtml,
  keepsakeCss,
  SPINE_SHARE,
} from "./bookCase.js";
import { LOGO, MARK_PATH, BARS_PATH } from "../theme/logoPaths.js";
import { withFullSerif } from "./printFonts.js";

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
   the book always has. */
export function bookStructure(story, { now = new Date(), design = story?.bookDesign } = {}) {
  const d = normaliseDesign(design);
  const left = new Set(d.excluded);
  const memories = (story?.memories || []).filter(
    (m) => m && m.status !== "in_progress" && !left.has(m.id)
  );

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

  const years = filed
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
  };
}

function formatPrintDate(date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* Body text as paragraphs rather than one block with <br> in it. A memoir is
   read in paragraphs, and a page-break lands far better between them. */
function bodyHtml(body) {
  const paras = String(body || "")
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!paras.length) return "";
  return paras.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n            ");
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

function memoryHtml(story, memory, design, listenBase, ink) {
  const dateline = datelineFor(story, memory);
  const credit = attributionFor(memory);
  const title = (memory.title || "").trim();

  return `
          <article class="memory">
            ${title ? `<h3>${escapeHtml(title)}</h3>` : ""}
            ${dateline ? `<p class="dateline">${escapeHtml(dateline)}</p>` : ""}${photosHtml(memory)}
            ${bodyHtml(printedBody(design, memory))}
            ${credit ? `<p class="credit">${escapeHtml(credit)}</p>` : ""}${listenHtml(story, memory, design, listenBase, ink)}
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
  const photo = book.design.cover.photo;
  const title = escapeHtml(book.title);
  const sub = escapeHtml(book.subtitle);
  const span = book.coverSpan ? `<p class="cover-span">${escapeHtml(book.coverSpan)}</p>` : "";
  const c = BOOK_PRINT.covers[style];
  if (style === "wrap") {
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
  if (style === "tipped") {
    return `
  <section class="cover cover-tipped">
    <div class="cover-spine"></div>
    <h1 class="cover-title">${title}</h1>
    <p class="cover-sub">${sub}</p>
    <div class="cover-plate"><img src="${escapeHtml(photo)}" alt=""></div>
    ${span}
  </section>`;
  }
  // cloth and heirloom: a foil-blocked board.
  return `
  <section class="cover cover-${style}">
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

/* A Story's own cover, laid out as the design team's template: the title
   in spaced capitals and the date line at the top, the storyteller's name
   in script, up to three photographs as prints overlapping down the right,
   and a line in script at the foot. Every word and photo has a default
   from the story, so it is finished before anybody touches it. */
function keepsakeCoverHtml(book, story) {
  const w = keepsakeWords(book.design, book, story);
  const photos = keepsakePhotos(book.design, story);
  return `
  <section class="ks-page">
    ${keepsakeFrontHtml(w, photos, book.design.cover.tone)}
  </section>`;
}

/* The outside of the book, as one landscape page for the printer: back,
   spine, front, the way a case is laid flat. The keepsake cover only; the
   other styles are single boards. Square covers, as the template is;
   `coverMm` is the side and `spineMm` the spine, both the printer's to
   confirm (the spine depends on the page count and their paper). */
export function buildCoverWrapHtml(
  story,
  { design = story?.bookDesign, now = new Date(), coverMm = 216, spineMm = Math.round(216 * SPINE_SHARE) } = {}
) {
  const book = bookStructure(story, { now, design });
  const C = BOOK_PRINT.covers.keepsake[book.design.cover.color] || BOOK_PRINT.covers.keepsake.navy;
  const w = keepsakeWords(book.design, book, story);
  const photos = keepsakePhotos(book.design, story);
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
    ${keepsakeFrontHtml(w, photos, book.design.cover.tone)}
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
export function buildLegacyHtml(
  story,
  { recordedBy = "", now = new Date(), design = story?.bookDesign, listenBase = "" } = {}
) {
  const book = bookStructure(story, { now, design });
  const P = BOOK_PRINT.papers[book.design.paper] || BOOK_PRINT.papers.classic;
  const coverStyle = effectiveCoverStyle(book.design);
  // The keepsake cover comes in colourways; the others have one palette.
  const C =
    coverStyle === "keepsake"
      ? BOOK_PRINT.covers.keepsake[book.design.cover.color] || BOOK_PRINT.covers.keepsake.navy
      : BOOK_PRINT.covers[coverStyle];
  const paperName =
    book.design.paper === "classic" ? "" : PAPERS.find((p) => p.key === book.design.paper)?.name || "";

  if (!book.chapters.length) {
    return emptyBookHtml(book);
  }

  const contents = book.chapters
    .map(
      (c) => `
        <li>
          <span class="toc-chapter">${escapeHtml(printedChapterName(c.era))}</span>
          <span class="toc-dots"></span>
          <span class="toc-count">${c.items.length}</span>
        </li>`
    )
    .join("");

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
        ${c.items.map((m) => memoryHtml(story, m, book.design, listenBase, P.ink)).join("")}
      </section>`;
    })
    .join("");

  const credit = recordedBy
    ? `<p class="recorded">Recorded by ${escapeHtml(recordedBy)}</p>`
    : "";

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
  @page { margin: 20mm 18mm; }

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
  .memory p:last-of-type { margin-bottom: 0; }

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
</style>
</head>
<body>
${coverHtml(book, coverStyle, story)}

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
    <ol>${contents}
    </ol>
  </section>
${chapters}

  <section class="colophon">
    <div class="rule"></div>
    <p>${book.memories} ${book.memories === 1 ? "memory" : "memories"}${
      book.photos ? `, ${book.photos} ${book.photos === 1 ? "photograph" : "photographs"}` : ""
    }</p>
    ${book.span ? `<p>Spanning ${escapeHtml(book.span)}</p>` : ""}
    <p>Printed ${escapeHtml(formatPrintDate(book.printedOn))}${
      paperName ? ` on ${escapeHtml(paperName.toLowerCase())} paper` : ""
    }</p>
    <p class="line">Every life holds a story worth preserving.</p>
  </section>

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
