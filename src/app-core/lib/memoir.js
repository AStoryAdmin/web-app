// A memoir somebody already wrote, read into memories.
//
// Most of the people we're for didn't start with us. Some typed forty pages
// in Word years ago, some printed a family booklet, some filled a notebook
// by hand. Asking them to tell it all again to an app is how we lose them.
// So: hand us the memoir, and it comes in as memories, one per chapter,
// marked as theirs ("From Hưng's memoir"); A Story then reads them before
// every conversation (lib/conversationContext.js) and asks to go deeper
// instead of asking again.
//
// What's here is the reading that can happen on the phone: a Word file
// (.docx is a zip of XML; ImportScreen unzips it with fflate and hands the
// XML here), plain text and Markdown. PDFs and photographed pages need the
// AI server to read them (data/api.js readMemoirPages); what comes back is
// text, and goes through the same splitting.
//
// Pure, so it's tested.

import { guessTitle, guessEra } from "./importers.js";

/* Which way a picked file can be read. */
export function memoirKind(file = {}) {
  const name = String(file.name || "").toLowerCase();
  const mime = String(file.mimeType || "").toLowerCase();
  if (name.endsWith(".docx") || mime.includes("wordprocessingml")) return "docx";
  if (name.endsWith(".pdf") || mime === "application/pdf") return "pdf";
  if (name.endsWith(".doc") || mime === "application/msword") return "doc";
  if (/\.(txt|md|markdown|text)$/.test(name) || mime.startsWith("text/")) return "text";
  if (/\.(jpe?g|png|heic|heif|webp)$/.test(name) || mime.startsWith("image/")) return "image";
  return null;
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decode = (s) =>
  String(s || "").replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (m, e) => {
    if (e[0] === "#") return String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENTITIES[e.toLowerCase()] ?? m;
  });

/* word/document.xml → [{ text, heading }]. heading is 1-6 for a Word
   heading or title style, 0 for body text. Empty paragraphs are dropped. */
export function docxParagraphs(xml) {
  const out = [];
  const paras = String(xml || "").match(/<w:p[\s>][\s\S]*?<\/w:p>/g) || [];
  for (const p of paras) {
    const style = (p.match(/<w:pStyle\s+w:val="([^"]+)"/) || [])[1] || "";
    const outline = (p.match(/<w:outlineLvl\s+w:val="(\d)"/) || [])[1];
    let heading = 0;
    const h = style.match(/^(?:Heading|heading|Kop|Titre|berschrift)\s*(\d)$/);
    if (h) heading = Number(h[1]);
    else if (/^(Title|Titel|Titre)$/i.test(style)) heading = 1;
    else if (outline != null) heading = Number(outline) + 1;
    // The words are the <w:t> runs, in order; a tab or a line break is a
    // run of its own. Everything else in the XML is formatting.
    const runs = p
      .replace(/<w:tab\s*\/>/g, "<w:t> </w:t>")
      .replace(/<w:br\s*\/>/g, "<w:t>\n</w:t>")
      .match(/<w:t(?:\s[^>]*)?>[\s\S]*?<\/w:t>/g) || [];
    const text = decode(runs.map((r) => r.replace(/^<w:t(?:\s[^>]*)?>|<\/w:t>$/g, "")).join("")).trim();
    if (text) out.push({ text, heading });
  }
  return out;
}

const CHAPTER_LINE = /^(chapter|part|book|ch\.)\s+([0-9ivxlc]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|[a-z]+teen|twenty[a-z-]*)\b[\s:.\-–—]*(.*)$/i;

/* Plain text or Markdown → [{ text, heading }]. A heading is a Markdown
   "#" line, a "Chapter 3: Leaving" line, or a short line in capitals on
   its own. */
export function textParagraphs(text) {
  const out = [];
  const blocks = String(text || "")
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n+/);
  for (const block of blocks) {
    const lines = block.split("\n");
    const first = lines[0].trim();
    const md = first.match(/^(#{1,6})\s+(.+)$/);
    const capsTitle = first.length <= 60 && /[A-Z]/.test(first) && first === first.toUpperCase() && !/[.!?,;]$/.test(first) && /\p{L}{2}/u.test(first);
    if (md || CHAPTER_LINE.test(first) || (capsTitle && lines.length >= 1 && first.split(/\s+/).length <= 8)) {
      out.push({ text: md ? md[2].trim() : first, heading: md ? md[1].length : 1 });
      const rest = lines.slice(1).join("\n").trim();
      if (rest) out.push({ text: rest, heading: 0 });
    } else if (block.trim()) {
      out.push({ text: block.trim(), heading: 0 });
    }
  }
  return out;
}

const YEAR = /\b(18[5-9]\d|19\d\d|20[0-4]\d)\b/;

/* A title that's only "Chapter 3" says nothing on a card; one with words
   after it keeps the words. */
function chapterTitle(heading, body) {
  const m = heading.match(CHAPTER_LINE);
  if (m && m[3] && m[3].trim()) return m[3].trim();
  if (m) return guessTitle(body);
  return heading;
}

/* [{ text, heading }] → entries for ImportReview, one per chapter. The
   highest heading level present is the chapter; lower ones stay inside it
   as lines of their own. Without any headings, the text is cut at
   paragraph breaks into pieces of a readable length. */
export function splitMemoir(paragraphs, { story = null, maxChars = 6000, chunkChars = 1800 } = {}) {
  const paras = (paragraphs || []).filter((p) => p && String(p.text || "").trim());
  if (!paras.length) return [];
  const levels = paras.filter((p) => p.heading > 0).map((p) => p.heading);
  const top = levels.length ? Math.min(...levels) : 0;
  const pieces = [];

  if (top) {
    let cur = null;
    for (const p of paras) {
      if (p.heading === top) {
        if (cur) pieces.push(cur);
        cur = { heading: p.text.trim(), parts: [] };
      } else {
        if (!cur) cur = { heading: "", parts: [] };
        cur.parts.push(p.text.trim());
      }
    }
    if (cur) pieces.push(cur);
  } else {
    let cur = { heading: "", parts: [] };
    let size = 0;
    for (const p of paras) {
      if (size && size + p.text.length > chunkChars) {
        pieces.push(cur);
        cur = { heading: "", parts: [] };
        size = 0;
      }
      cur.parts.push(p.text.trim());
      size += p.text.length;
    }
    if (cur.parts.length) pieces.push(cur);
  }

  const entries = [];
  for (const piece of pieces) {
    let body = piece.parts.join("\n\n").trim();
    if (!body && !piece.heading) continue;
    if (!body) continue; // a heading with nothing under it
    // A very long chapter is still one memory, cut at a paragraph so it
    // stays readable on a card; the rest follows as "(continued)".
    const chunks = [];
    while (body.length > maxChars) {
      const cut = body.lastIndexOf("\n\n", maxChars);
      const at = cut > maxChars / 2 ? cut : maxChars;
      chunks.push(body.slice(0, at).trim());
      body = body.slice(at).trim();
    }
    chunks.push(body);
    chunks.forEach((chunk, i) => {
      const title = piece.heading ? chapterTitle(piece.heading, chunk) : guessTitle(chunk);
      const year = Number((chunk.match(YEAR) || piece.heading.match(YEAR) || [])[1]) || null;
      entries.push({
        id: `memoir-${entries.length}`,
        title: i ? `${title} (continued)` : title,
        body: chunk,
        year,
        dateText: year ? String(year) : "",
        era: guessEra(story, year),
        include: true,
        source: "memoir",
      });
    });
  }
  return entries;
}

/* The import's name on the review screen: "Hưng's memoir". */
export function memoirLabel(storyName) {
  const n = String(storyName || "").trim().split(/\s+/)[0];
  return n ? `${n}'s memoir` : "The memoir";
}
