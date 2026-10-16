// Reading memories out of everything a person has already written.
//
// Most people preserving a life have been writing it down for years — a
// journal app, notes on their phone, a decade of Facebook posts. Making them
// retype that into a new app is the fastest way to lose them. So: hand us the
// file, and we'll find the memories in it.
//
// Every platform worth importing from offers an export (that's what GDPR
// bought us), and an export is a file. So this module takes a filename plus
// the text of a file, works out what it is, and returns a flat list of
// candidate memories for a person to review. Nothing is written to the
// archive here — the review screen decides that.
//
// Adding a format means: a detector, a parser that returns entries, and a
// test in scripts/test-lib.mjs.

import { parseYear, parseMonth } from "./timeline.js";
import { looksLikeWhatsApp, parseWhatsApp, whatsAppEntries } from "./whatsapp.js";
import { yearFromText } from "./spokenDate.js";
import { eraForAge, CATCH_ALL_CHAPTER } from "../data/eras.js";
import { looksLikeX, parseX } from "./socialArchive.js";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// A safety rail. Exports can hold ten years of posts; a review list of ten
// thousand rows helps nobody, and the newest entries are the ones people
// recognise.
const MAX_ENTRIES = 400;

/* ── the sources we can read, in the order they're offered ──
   `how` is what the person actually has to do — the honest instructions,
   not a promise of a one-tap OAuth we don't have a server for. */
export const SOURCES = [
  {
    key: "facebook",
    url: "https://www.facebook.com/dyi",
    label: "Facebook",
    icon: "collab",
    social: true,
    blurb: "Years of posts, with their dates and photos.",
    how:
      "On facebook.com/dyi (or the app: Settings → Your information → Download your information): " +
      "choose Posts, format JSON, media quality High, all time. Facebook emails you a .zip within a day or two. " +
      "Save it to Files, then pick it here: we read the posts and the photos out of it.",
  },
  {
    key: "instagram",
    url: "https://accountscenter.instagram.com/info_and_permissions/dyi/",
    label: "Instagram",
    icon: "photo",
    social: true,
    blurb: "Every photo you captioned, already a memory.",
    how:
      "Instagram → Settings → Accounts Centre → Your information and permissions → Download your information → " +
      "Some of your information → Posts, format JSON, all time. Save the .zip they send to Files, then pick it here.",
  },
  {
    key: "x",
    url: "https://x.com/settings/download_your_data",
    label: "X (Twitter)",
    icon: "chat",
    social: true,
    blurb: "What you said, year by year. Replies and reposts are left out.",
    how:
      "x.com/settings/download_your_data → Request archive (it asks for your password). " +
      "A day or so later X emails a link; save the .zip to Files and pick it here, or pick data/tweets.js from inside it.",
  },
  {
    key: "whatsapp",
    url: "https://faq.whatsapp.com/1180414079177245",
    label: "WhatsApp",
    icon: "chat",
    blurb: "Years of family messages, and the voice notes, which may be the only recordings there are.",
    how:
      "Open the chat → tap the name at the top (iPhone) or ⋮ → More (Android) → Export chat → " +
      "Include media. Save the .zip to Files, then pick it here. Without media works too, as a .txt.",
  },
  {
    key: "dayone",
    url: "https://dayoneapp.com/guides/settings/importing-and-exporting-entries/",
    label: "Day One",
    icon: "book",
    diary: true,
    blurb: "Every entry, dated, with its photos.",
    how:
      "Day One → Settings → Import/Export → Export → JSON. Share the .zip to Files and pick it here: " +
      "the entries and their photos come in together.",
  },
  {
    key: "journey",
    url: "https://help.journey.cloud/en/article/how-do-i-export-my-journal-entries",
    label: "Journey",
    icon: "book",
    diary: true,
    blurb: "Entries and photos, by day.",
    how: "Journey → Settings → Export → JSON (with photos). Save the .zip to Files and pick it here.",
  },
  {
    key: "applejournal",
    url: null,
    label: "Apple Journal",
    icon: "book",
    diary: true,
    blurb: "The Journal app on iPhone.",
    how:
      "Journal → ⋯ → Settings → Export Journal (iOS 18.4 or later) gives a PDF: pick it with \"Already wrote some of it?\" above, " +
      "and each entry is read as its own memory. On an older iPhone, open an entry → Share → Copy, and paste it below.",
  },
  {
    key: "daylio",
    url: "https://daylio.net/",
    label: "Daylio",
    icon: "book",
    diary: true,
    blurb: "The notes under each day's mood.",
    how: "Daylio → More → Export entries → CSV. Save it to Files and pick it here. Days with a note become memories.",
  },
  {
    key: "diarium",
    url: null,
    label: "Diarium, Penzu, Grid Diary and others",
    icon: "book",
    diary: true,
    blurb: "Most diary apps export text, Word or JSON.",
    how:
      "Look for Export in the app's settings. A .txt, .md, .json or .csv file: pick it here. " +
      "A Word file or PDF: use \"Already wrote some of it?\" above. A blank line between entries keeps them apart.",
  },
  {
    key: "notes",
    // Apple Notes only (the lead, 2026-10-13: the phone's own notes; Keep
    // was a second set of steps nobody here uses).
    label: "Apple Notes",
    icon: "book",
    blurb: "The notes app on the phone.",
    how:
      "Open the note, tap Share, then Save to Files, and pick that file here.",
  },
  {
    key: "tree",
    url: "https://support.ancestry.com/s/article/Creating-a-GEDCOM-File",
    label: "Ancestry / MyHeritage / FamilySearch",
    icon: "people",
    blurb:
      "A family tree you've already built. We'll find who's still here to ask.",
    how:
      "Ancestry: Trees → Tree Settings → Export tree. " +
      "MyHeritage: Family tree → Manage trees → Export to GEDCOM. " +
      "FamilySearch and most others: look for \"Export GEDCOM\". " +
      "Then pick the .ged file.",
  },
  {
    key: "file",
    label: "Any file",
    icon: "download",
    blurb: ".txt, .md, .json or .csv from anywhere else.",
    how: "If it holds words and dates, we'll do our best with it.",
    urlLabel: null,
  },
];

/* Facebook (and a few others) export UTF-8 that's been through a latin-1
   round trip, so "don't" arrives as "donâ€™t". Undo it when we see it. */
export function fixMojibake(text) {
  if (!text || !/[Ã¢â€]/.test(text)) return text;
  try {
    const bytes = Uint8Array.from([...text].map((c) => c.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder("utf-8").decode(bytes);
    // Only take the repair if it actually removed the tell-tale sequences.
    return /[Ã¢â€]/.test(decoded) ? text : decoded;
  } catch {
    return text;
  }
}

function clean(text) {
  return fixMojibake(String(text || ""))
    .replace(/\r\n/g, "\n")
    .replace(/ /g, " ")
    .trim();
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/* ── what kind of file is this ── */
export function detectFormat(text, file = {}) {
  const name = String(file.name || "").toLowerCase();
  const body = String(text || "");
  if (looksLikeWhatsApp(body)) return "whatsapp";
  if (looksLikeX(body)) return "x";
  const json = body.trim().startsWith("{") || body.trim().startsWith("[")
    ? safeJson(body)
    : null;

  if (json) {
    if (json && !Array.isArray(json) && Array.isArray(json.entries)) return "dayone";
    if (json && !Array.isArray(json) && json.date_journal != null) return "journey";
    if (Array.isArray(json) && json.length) {
      const first = json[0] || {};
      if (Array.isArray(first.media) || first.creation_timestamp) return "instagram";
      if (Array.isArray(first.data) || first.timestamp) return "facebook";
      return "json";
    }
    if (!Array.isArray(json) && (json.textContent != null || json.listContent))
      return "keep";
    return "json";
  }

  if (name.endsWith(".csv") || looksLikeCsv(body)) return "csv";
  if (name.endsWith(".md") || name.endsWith(".markdown") || /^#{1,3}\s+\S/m.test(body))
    return "markdown";
  return "text";
}

function looksLikeCsv(body) {
  const lines = body.trim().split("\n").slice(0, 3);
  if (lines.length < 2) return false;
  const commas = lines.map((l) => (l.match(/,/g) || []).length);
  return commas[0] >= 1 && commas.every((c) => c === commas[0]);
}

/* ── dates ── */

function fromTimestamp(value) {
  if (value == null || value === "") return null;
  let ms;
  const numeric =
    typeof value === "number" || /^\d+$/.test(String(value).trim());

  if (numeric) {
    ms = Number(value);

    // A bare four-digit number in a date column is a year, not an epoch —
    // "1990" as seconds-since-1970 lands in January 1970 and quietly files
    // half an archive under the wrong decade.
    // From 1600, the same floor as lib/timeline.js — ancestors included.
    if (ms >= 1600 && ms <= 2100) {
      return { year: ms, month: null, text: String(ms) };
    }

    // Otherwise units vary by exporter: Facebook and Instagram write
    // seconds, Google Keep writes microseconds, JavaScript writes
    // milliseconds. Magnitude is the only thing that tells them apart.
    if (ms >= 1e14) ms /= 1000;
    else if (ms < 1e12) ms *= 1000;
  } else {
    // A date string ("1975-06-14", "June 1975") is already in ms once
    // parsed — scaling it by magnitude would send the 1970s to the 8th
    // millennium.
    const parsed = Date.parse(String(value));
    if (Number.isNaN(parsed)) return null;
    ms = parsed;
  }
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getUTCFullYear();
  if (year < 1900 || year > new Date().getFullYear() + 1) return null;
  return {
    year,
    month: d.getUTCMonth() + 1,
    text: `${MONTH_NAMES[d.getUTCMonth()]} ${year}`,
  };
}

/* A date for an entry: the export's own timestamp if it has one, otherwise
   whatever the words say — including an age, when the story knows a birth
   year ("when I was twenty" is a date if you know when they were born). */
function dateFor(body, timestamp, story) {
  const stamped = fromTimestamp(timestamp);
  if (stamped) return stamped;

  const spoken = yearFromText(body, story);
  if (!spoken) return { year: null, month: null, text: "" };

  const month = spoken.from === "year" ? parseMonth(body) : null;
  return {
    year: spoken.year,
    month,
    text: month ? `${MONTH_NAMES[month - 1]} ${spoken.year}` : String(spoken.year),
  };
}

/* ── titles ── */

export function guessTitle(body) {
  const text = clean(body)
    .replace(/^#+\s*/gm, "")
    .replace(/[*_`>]/g, "")
    .trim();
  if (!text) return "Untitled memory";

  const firstLine = text.split("\n")[0].trim();
  // A short first line is almost always a title someone already wrote.
  if (firstLine.length <= 70 && text.includes("\n")) return firstLine;

  const sentence = firstLine.split(/(?<=[.!?])\s/)[0].replace(/[.!?]+$/, "");
  if (sentence.length <= 70) return sentence || "Untitled memory";
  return sentence.slice(0, 67).trimEnd() + "…";
}

/* ── chapters ──
   With a birth year we can put an entry in the right chapter by how old they
   were; without one, everything lands in the catch-all and the person
   sorts it. */
export function guessEra(story, year) {
  const birth = parseYear(story?.birthYear);
  if (!birth || year == null) return CATCH_ALL_CHAPTER;
  return eraForAge(year - birth) || CATCH_ALL_CHAPTER;
}

/* ── per-format parsers ──
   Each returns [{ title, body, timestamp }] and lets the shared tail below
   handle dates, titles, dedupe and capping. */

function parseText(body) {
  const text = clean(body);
  if (!text) return [];
  const blocks = text
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter(Boolean);
  // One unbroken wall of text is one memory, not one line each.
  return (blocks.length ? blocks : [text]).map((b) => ({ body: b }));
}

function parseMarkdown(body) {
  const text = clean(body);
  if (!text) return [];
  const lines = text.split("\n");
  const out = [];
  let current = null;

  for (const line of lines) {
    const heading = line.match(/^#{1,3}\s+(.*)$/);
    if (heading) {
      if (current && (current.body.trim() || current.title)) out.push(current);
      current = { title: heading[1].trim(), body: "" };
    } else if (current) {
      current.body += line + "\n";
    } else if (line.trim()) {
      current = { title: "", body: line + "\n" };
    }
  }
  if (current && (current.body.trim() || current.title)) out.push(current);

  return out
    .map((e) => ({ title: e.title, body: e.body.trim() }))
    .filter((e) => e.body || e.title);
}

function parseDayOne(json) {
  return (json.entries || [])
    .map((e) => ({
      body: clean(e.text || e.richText || ""),
      timestamp: e.creationDate || e.modifiedDate,
    }))
    .filter((e) => e.body);
}

// Journey (journey.cloud): one entry per file, the text as HTML.
function parseJourney(json) {
  const ms = Number(json?.date_journal || json?.date_modified || 0);
  return [{ body: clean(String(json?.text || "").replace(/<[^>]+>/g, " ")), timestamp: ms ? Math.floor(ms / 1000) : undefined }];
}

function parseFacebook(json) {
  const posts = Array.isArray(json) ? json : json.status_updates || json.posts || [];
  return posts
    .map((p) => {
      const fromData =
        (p.data || [])
          .map((d) => d.post || d.text || "")
          .filter(Boolean)
          .join("\n\n") || "";
      const attachmentText = (p.attachments || [])
        .flatMap((a) => a.data || [])
        .map((d) => d.media?.description || d.note?.text || "")
        .filter(Boolean)
        .join("\n\n");
      return {
        body: clean(fromData || attachmentText),
        timestamp: p.timestamp,
      };
    })
    .filter((e) => e.body);
}

function parseInstagram(json) {
  const items = Array.isArray(json) ? json : json.photos || json.media || [];
  return items
    .map((p) => {
      const media = p.media || [];
      const caption =
        p.title || media.map((m) => m.title).filter(Boolean).join("\n\n") || "";
      return {
        body: clean(caption),
        timestamp: p.creation_timestamp || media[0]?.creation_timestamp,
      };
    })
    .filter((e) => e.body);
}

function parseKeep(json) {
  const notes = Array.isArray(json) ? json : [json];
  return notes
    .map((n) => ({
      title: clean(n.title || ""),
      body: clean(
        n.textContent ||
          (n.listContent || [])
            .map((i) => `${i.isChecked ? "✓" : "•"} ${i.text}`)
            .join("\n")
      ),
      timestamp: n.userEditedTimestampUsec || n.createdTimestampUsec,
    }))
    .filter((e) => e.body || e.title);
}

/* A generic array of objects: find the wordiest string field and treat it as
   the body. Covers the long tail of "my app exports JSON" without a parser
   each. */
function parseGenericJson(json) {
  const items = Array.isArray(json) ? json : [json];
  const textKeys = ["text", "body", "content", "note", "entry", "message", "description"];
  const titleKeys = ["title", "name", "subject", "heading"];
  const dateKeys = ["date", "created", "createdAt", "creationDate", "timestamp", "time"];

  return items
    .map((item) => {
      if (typeof item === "string") return { body: clean(item) };
      if (!item || typeof item !== "object") return null;
      const key = textKeys.find((k) => typeof item[k] === "string" && item[k].trim());
      const longest = key
        ? item[key]
        : Object.values(item)
            .filter((v) => typeof v === "string")
            .sort((a, b) => b.length - a.length)[0];
      const titleKey = titleKeys.find((k) => typeof item[k] === "string");
      const dateKey = dateKeys.find((k) => item[k] != null);
      return {
        title: titleKey ? clean(item[titleKey]) : "",
        body: clean(longest || ""),
        timestamp: dateKey ? item[dateKey] : undefined,
      };
    })
    .filter((e) => e && e.body);
}

/* CSV, quoted fields and all. Small enough to hand-roll, and a dependency
   for this would be a dependency in the app bundle. */
export function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim()));
}

function parseCsv(text) {
  const rows = parseCsvRows(clean(text));
  if (!rows.length) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const looksLikeHeader = header.some((h) =>
    ["date", "full_date", "title", "body", "text", "note", "note_title", "content", "when", "story"].includes(h)
  );
  const dataRows = looksLikeHeader ? rows.slice(1) : rows;

  const col = (...names) =>
    looksLikeHeader ? header.findIndex((h) => names.includes(h)) : -1;
  // "full_date" and "note_title"/"note" are Daylio's columns.
  const dateAt = col("full_date", "date", "when", "year", "period");
  const titleAt = col("title", "note_title", "name", "heading");
  const bodyAt = col("body", "text", "story", "note", "content", "memory");

  return dataRows
    .map((r) => {
      const body =
        bodyAt >= 0
          ? r[bodyAt]
          : r.filter((_, i) => i !== dateAt && i !== titleAt).join(" ");
      return {
        title: titleAt >= 0 ? clean(r[titleAt]) : "",
        body: clean(body),
        timestamp: dateAt >= 0 ? r[dateAt] : undefined,
      };
    })
    .filter((e) => e.body || e.title);
}

/* The same words, imported twice.
   People run an export again a year later, or paste a note they already
   pasted. Matching on the opening of the text catches both without needing
   anything stored: it's the same fingerprint the parser already uses to
   drop repeats inside one file. */
export function fingerprint(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

export function markDuplicates(entries, existingMemories = []) {
  const seen = new Set(
    existingMemories.map((m) => fingerprint(m.body || m.excerpt || ""))
  );
  return entries.map((e) =>
    seen.has(fingerprint(e.body))
      ? { ...e, duplicate: true, include: false }
      : e
  );
}

/* ── the one entry point ── */
export function parseImport(text, file = {}, options = {}) {
  const format = detectFormat(text, file);
  const story = options.story;
  let raw = [];

  try {
    if (format === "whatsapp") {
      raw = whatsAppEntries(parseWhatsApp(text), { senders: options.whatsappSenders || [] });
    } else if (format === "text") raw = parseText(text);
    else if (format === "markdown") raw = parseMarkdown(text);
    else if (format === "csv") raw = parseCsv(text);
    else if (format === "x") raw = parseX(text);
    else {
      const json = safeJson(text) || {};
      if (format === "dayone") raw = parseDayOne(json);
      else if (format === "journey") raw = parseJourney(json);
      else if (format === "facebook") raw = parseFacebook(json);
      else if (format === "instagram") raw = parseInstagram(json);
      else if (format === "keep") raw = parseKeep(json);
      else raw = parseGenericJson(json);
    }
  } catch {
    // A malformed export should never take the screen down with it — fall
    // back to reading it as text and let the person see what we got.
    raw = parseText(text);
  }

  if (!raw.length && format !== "text") raw = parseText(text);

  return shapeEntries(raw, { story, format });
}

/* The shared tail: dates, titles, chapters, dedupe and the cap, for raw
   [{ title?, body, timestamp?, voiceNotes?, photos?, platform? }] from any
   reader, the social archives included (lib/socialArchive.js). */
export function shapeEntries(raw, options = {}) {
  const story = options.story;
  const format = options.format || "text";
  const seen = new Set();
  const entries = [];

  for (const item of raw) {
    if (!item) continue;
    const voiceNotes = item.voiceNotes || [];
    const photos = item.photos || [];
    // A day that was only voice messages is still a day worth keeping: the
    // words come when the recordings are transcribed on import. A photo
    // with a short caption is a memory too.
    const body = clean(item.body) || (voiceNotes.length ? "Voice messages" : "");
    // A fragment isn't a memory, unless a photo or a voice note carries it.
    const minimum = photos.length ? 3 : 12;
    if (body.length < minimum && !voiceNotes.length) continue;
    const fingerprint = `${body.slice(0, 120).toLowerCase()}|${item.timestamp || ""}`;
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);

    // The date can live in the heading a person wrote ("## Vermont, 1975")
    // just as easily as in the body.
    const date = dateFor(
      [item.title, body].filter(Boolean).join("\n"),
      item.timestamp,
      story
    );
    entries.push({
      id: `imp-${entries.length}-${Date.now().toString(36)}`,
      title: clean(item.title) || guessTitle(body),
      body,
      year: date.year,
      month: date.month,
      dateText: date.text,
      era: guessEra(story, date.year),
      include: true,
      ...(voiceNotes.length ? { voiceNotes } : {}),
      ...(photos.length ? { photos } : {}),
      ...(item.platform ? { platform: item.platform } : {}),
    });

    if (entries.length >= MAX_ENTRIES) break;
  }

  // Oldest first — the order a life reads — but only when the file actually
  // carries dates. A pasted note whose paragraphs are undated is already in
  // the order its author meant, and reshuffling it would be rude.
  const dated = entries.filter((e) => e.year != null).length;
  if (dated > entries.length / 2) {
    entries.sort((a, b) => {
      if ((a.year == null) !== (b.year == null)) return a.year == null ? 1 : -1;
      if (a.year !== b.year) return (a.year || 0) - (b.year || 0);
      return (a.month || 13) - (b.month || 13);
    });
  }

  const marked = story ? markDuplicates(entries, story.memories || []) : entries;

  return {
    format,
    entries: marked,
    truncated: raw.length > MAX_ENTRIES,
    duplicates: marked.filter((e) => e.duplicate).length,
  };
}
