// What somebody has already told the world: their Facebook, Instagram and
// X posts, read out of the archive each of them sends when asked.
//
// Fifteen years of posts are fifteen years of memories already written,
// with their dates and photographs on them, by the person whose life it
// is. Making them retell any of that is how a family loses them on day
// one. There is no way to read a profile from outside (none of the three
// allows it, and anything that scrapes one breaks within the month), but
// every one of them hands the person their own archive as a .zip within a
// day or two. This reads that .zip.
//
// Pure: given the names in the zip and the text of its post files, it
// returns the posts that read as memories, with the paths of their photos
// in the zip. ImportScreen unpacks the zip and the photos; lib/importers
// shapes the entries like every other import.

import { fixMojibake } from "./importers.js";

const POST_FILES = {
  // Day One's export zip: Journal.json (one per journal) and photos/<md5>.
  dayone: /(^|\/)[^/]*journal[^/]*\.json$/i,
  // Journey's: one .json per entry, named <ms timestamp>-<hex id>.json,
  // photos beside them.
  journey: /(^|\/)\d{10,13}-[0-9a-f]{8,}[^/]*\.json$/i,
  facebook: /(^|\/)your_posts[^/]*\.json$|(^|\/)posts\/your_posts.*\.json$|(^|\/)your_facebook_activity\/posts\/your_posts.*\.json$/i,
  instagram: /(^|\/)posts_\d+\.json$/i,
  // tweets.js, and the tweets-part1.js… a large archive is split into.
  x: /(^|\/)(tweets?|tweet)(-part\d+)?\.js$/i,
};

/* The platform a zip's file list belongs to, and the post files to read,
   or null when it isn't one of the three. */
export function detectSocialArchive(names = []) {
  const list = (names || []).map(String);
  for (const platform of ["facebook", "instagram", "x", "dayone"]) {
    const postFiles = list.filter((n) => POST_FILES[platform].test(n) && !/\/(albums|comments|stories|reels|messages)\//i.test(n));
    if (postFiles.length) return { platform, postFiles };
  }
  // Journey: a zip of nothing but entry .json files (and their photos).
  const jsons = list.filter((n) => /\.json$/i.test(n));
  if (jsons.length && jsons.length === list.filter((n) => /\.json$/i.test(n) && !/\//.test(n.replace(/^[^/]*\//, ""))).length && jsons.every((n) => POST_FILES.journey.test(n))) {
    return { platform: "journey", postFiles: jsons };
  }
  return null;
}

/* A single tweets.js picked on its own. */
export function looksLikeX(text) {
  return /^\s*window\.YTD\.tweets?\.part\d+\s*=/.test(String(text || ""));
}

const PLATFORM_LABEL = { facebook: "Facebook", instagram: "Instagram", x: "X", dayone: "Day One", journey: "Journey" };
export function platformLabel(platform) {
  return PLATFORM_LABEL[platform] || "Your posts";
}

// t.co and bare links say nothing on a printed page.
const URL_RE = /https?:\/\/\S+/gi;
function stripUrls(text) {
  return String(text || "")
    .replace(URL_RE, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function unescapeHtml(s) {
  return String(s || "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

/* The zip entry a post's media path points at. Exports write paths like
   "your_facebook_activity/posts/media/Timeline/123.jpg" or
   "media/posts/202107/abc.jpg"; the zip may hold them under one more
   folder. Matched on the longest shared tail. */
function resolver(names) {
  const byBase = new Map();
  for (const n of names) {
    const base = n.split("/").pop().toLowerCase();
    if (!byBase.has(base)) byBase.set(base, []);
    byBase.get(base).push(n);
  }
  return (uri) => {
    const clean = String(uri || "").replace(/^\.?\//, "");
    if (!clean) return null;
    const base = clean.split("/").pop().toLowerCase();
    const options = byBase.get(base) || [];
    if (!options.length) return null;
    const hit = options.find((n) => n.toLowerCase().endsWith(clean.toLowerCase())) || options.find((n) => clean.toLowerCase().endsWith(n.toLowerCase()));
    return hit || options[0];
  };
}

const PHOTO = /\.(jpe?g|png|webp|heic|gif)$/i;

function words(text) {
  return String(text || "").split(/\s+/).filter(Boolean).length;
}

/* A post that reads as a memory: enough of their own words, or a photo
   with a caption. Not a shared link with nothing said, not "updated their
   profile picture", not a one-word check-in. */
function keep(entry) {
  const n = words(entry.body);
  if (entry.platform === "dayone" || entry.platform === "journey") return n >= 1 || entry.photos.length > 0;
  if (entry.photos.length) return n >= 2;
  return n >= 6;
}

function parseFacebook(json, resolve) {
  const posts = Array.isArray(json) ? json : json.status_updates || json.posts || [];
  return posts.map((p) => {
    const title = String(p.title || "");
    if (/profile picture|cover photo|is now friends with|likes a|was tagged in|shared a link\.?$/i.test(title) && !(p.data || []).some((d) => d.post)) {
      return null;
    }
    const text = (p.data || [])
      .map((d) => d.post || d.text || "")
      .filter(Boolean)
      .join("\n\n");
    const media = (p.attachments || []).flatMap((a) => a.data || []).map((d) => d.media).filter(Boolean);
    const captions = media.map((m) => m.description || "").filter(Boolean);
    const photos = media.map((m) => resolve(m.uri)).filter((n) => n && PHOTO.test(n));
    const place = (p.attachments || []).flatMap((a) => a.data || []).map((d) => d.place?.name).filter(Boolean)[0];
    const body = fixMojibake(stripUrls([text, ...captions.filter((c) => c !== text)].filter(Boolean).join("\n\n")));
    return { body: place && body ? `${body}\n\n${place}` : body, timestamp: p.timestamp, photos, platform: "facebook" };
  });
}

function parseInstagram(json, resolve) {
  const items = Array.isArray(json) ? json : json.photos || json.media || [];
  return items.map((p) => {
    const media = p.media || [];
    const caption = p.title || media.map((m) => m.title).filter(Boolean).join("\n\n") || "";
    const photos = media.map((m) => resolve(m.uri)).filter((n) => n && PHOTO.test(n));
    return {
      body: fixMojibake(stripUrls(caption)).replace(/(^|\s)#\w+/g, "").trim(),
      timestamp: p.creation_timestamp || media[0]?.creation_timestamp,
      photos,
      platform: "instagram",
    };
  });
}

// "Wed Oct 10 20:19:24 +0000 2018", read by hand: Date.parse's view of it
// differs between engines.
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
export function xTimestamp(createdAt) {
  const m = /^\w{3} (\w{3}) (\d{1,2}) (\d\d):(\d\d):(\d\d) ([+-])(\d\d)(\d\d) (\d{4})$/.exec(String(createdAt || "").trim());
  if (!m) return null;
  const month = MONTHS.indexOf(m[1].toLowerCase());
  if (month < 0) return null;
  const offset = (Number(m[7]) * 60 + Number(m[8])) * (m[6] === "-" ? -1 : 1);
  return Math.floor((Date.UTC(Number(m[9]), month, Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5])) - offset * 60000) / 1000);
}

export function parseX(text, resolve = () => null) {
  const raw = String(text || "").replace(/^\s*window\.YTD\.tweets?\.part\d+\s*=\s*/, "");
  let list;
  try {
    list = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(list)) return [];
  return list.map((row) => {
    const t = row.tweet || row;
    const full = unescapeHtml(t.full_text || t.text || "");
    if (/^RT @/.test(full)) return null;
    if (t.in_reply_to_status_id_str || t.in_reply_to_user_id_str || /^@/.test(full)) return null;
    let body = full;
    for (const u of t.entities?.urls || []) {
      if (u.url && u.expanded_url && !/t\.co|twitter\.com|x\.com|pic\.twitter/i.test(u.expanded_url)) body = body.replace(u.url, u.expanded_url);
    }
    const mediaUrls = (t.extended_entities?.media || t.entities?.media || []).map((m) => m.media_url_https || m.media_url || "").filter(Boolean);
    const photos = mediaUrls
      .map((url) => {
        const base = url.split("/").pop();
        return resolve(`${t.id_str || t.id || ""}-${base}`) || resolve(base);
      })
      .filter((n) => n && PHOTO.test(n));
    return { body: stripUrls(body).replace(/(^|\s)#(\w+)/g, "$1$2"), timestamp: xTimestamp(t.created_at), photos, platform: "x" };
  }).filter(Boolean);
}

// Day One: the text carries its photos as "![](dayone-moment://MD5)", and
// the zip holds them as photos/MD5.jpeg.
function parseDayOne(json, resolve) {
  return (json.entries || []).map((e) => {
    const text = String(e.text || e.richText || "");
    const ids = [...text.matchAll(/dayone-moment:\/\/([0-9a-f]+)/gi)].map((m) => m[1].toLowerCase());
    const photos = [...new Set([...(e.photos || []).map((p) => String(p.md5 || p.identifier || "").toLowerCase()), ...ids])]
      .filter(Boolean)
      .map((md5) => resolve(`${md5}.jpeg`) || resolve(`${md5}.jpg`) || resolve(`${md5}.png`) || resolve(`${md5}.heic`))
      .filter((n) => n && PHOTO.test(n));
    const body = text.replace(/!\[[^\]]*\]\(dayone-moment:\/\/[^)]*\)/gi, "").trim();
    const when = e.creationDate || e.modifiedDate;
    return { body, timestamp: when ? Math.floor(new Date(when).getTime() / 1000) : null, photos, platform: "dayone" };
  });
}

// Journey: one file per entry, { date_journal: ms, text, photos: ["x.jpg"] }.
function parseJourney(json, resolve) {
  const e = json || {};
  const photos = (e.photos || []).map((p) => resolve(String(p))).filter((n) => n && PHOTO.test(n));
  const body = String(e.text || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/[ \t]{2,}/g, " ").trim();
  const ms = Number(e.date_journal || e.date_modified || 0);
  return [{ body, timestamp: ms ? Math.floor(ms / 1000) : null, photos, platform: "journey" }];
}

/* Everything in the archive that reads as a memory, oldest first:
   [{ body, timestamp (seconds), photos: [zip paths], platform }]. */
export function parseSocialArchive(platform, texts = {}, names = []) {
  const resolve = resolver(names);
  const out = [];
  for (const [name, text] of Object.entries(texts)) {
    let raw = [];
    try {
      if (platform === "x") raw = parseX(text, resolve);
      else {
        const json = JSON.parse(String(text || "").trim() || "[]");
        raw =
          platform === "facebook"
            ? parseFacebook(json, resolve)
            : platform === "instagram"
              ? parseInstagram(json, resolve)
              : platform === "dayone"
                ? parseDayOne(json, resolve)
                : parseJourney(json, resolve);
      }
    } catch (e) {
      console.warn(`social archive ${name}:`, e?.message || e);
    }
    out.push(...raw.filter((r) => r && keep(r)));
  }
  return out.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
}

/* The zip paths of the photos these entries carry, in order, each once,
   capped: an export can hold ten thousand pictures and a phone can't hold
   them all in memory at once. */
export function socialPhotoPaths(entries, cap = 400) {
  const seen = new Set();
  for (const e of entries) {
    for (const p of e.photos || []) {
      if (seen.size >= cap) return [...seen];
      seen.add(p);
    }
  }
  return [...seen];
}

/* "Facebook · 2009 to 2024 · 83 posts, 41 with photos" */
export function archiveSummary(platform, entries) {
  const years = entries.map((e) => e.year).filter((y) => y != null);
  const span = years.length ? (Math.min(...years) === Math.max(...years) ? String(years[0]) : `${Math.min(...years)} to ${Math.max(...years)}`) : "";
  const withPhotos = entries.filter((e) => e.photos?.length).length;
  return [platformLabel(platform), span, `${entries.length} ${entries.length === 1 ? "post" : "posts"}${withPhotos ? `, ${withPhotos} with photos` : ""}`].filter(Boolean).join(" · ");
}
