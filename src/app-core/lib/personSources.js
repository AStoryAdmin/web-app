// Where what the family knows about somebody came from: their page's
// Sources tab.
//
// Three kinds of source, kept apart because a family asks about each
// differently:
//
//   how they came into the tree   added by hand (by whom, and when), read
//                                 in from a family-tree file, joined from
//                                 an invitation, or named in a memory
//   what the family has kept      a press article, an obituary, a Facebook
//                                 or Instagram post, a WhatsApp chat, a
//                                 website, a record (a certificate, a
//                                 passport) — each a title, maybe a link,
//                                 and who added it (people.source_links)
//   where their memories came from  calls with A Story, written, a family
//                                 call, a memoir, sent in by family, a
//                                 WhatsApp import, counted
//
// Like everything on somebody's page, for the family only. Pure, so it's
// tested.

export const SOURCE_KINDS = [
  { key: "press", label: "Press article", icon: "book" },
  { key: "obituary", label: "Obituary", icon: "heart" },
  { key: "facebook", label: "Facebook", icon: "people" },
  { key: "instagram", label: "Instagram", icon: "photo" },
  { key: "tiktok", label: "TikTok", icon: "play" },
  { key: "linkedin", label: "LinkedIn", icon: "link" },
  { key: "x", label: "X (Twitter)", icon: "link" },
  { key: "youtube", label: "YouTube", icon: "play" },
  { key: "whatsapp", label: "WhatsApp", icon: "chat" },
  { key: "website", label: "Website", icon: "globe" },
  { key: "record", label: "Record or document", icon: "archive" },
  { key: "other", label: "Something else", icon: "link" },
];

const clean = (v) => String(v ?? "").replace(/\s+/g, " ").trim();

/* A link the family can open, or "" for anything that isn't one. */
export function cleanUrl(v) {
  const t = clean(v);
  if (!t) return "";
  const withScheme = /^https?:\/\//i.test(t) ? t : /^[\w-]+(\.[\w-]+)+(\/|$)/.test(t) ? `https://${t}` : "";
  if (!withScheme) return "";
  try {
    const u = new URL(withScheme);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : "";
  } catch {
    return "";
  }
}

/* The network a link is on, from its address: "linkedin" for
   linkedin.com/in/…, "" for anything that isn't a social profile. So a
   LinkedIn link added as "Website" or "Something else" still shows as
   LinkedIn under their name. */
const NETWORKS = [
  ["facebook", /(^|\.)(facebook\.com|fb\.com|fb\.me)$/],
  ["instagram", /(^|\.)(instagram\.com|instagr\.am)$/],
  ["tiktok", /(^|\.)tiktok\.com$/],
  ["linkedin", /(^|\.)(linkedin\.com|lnkd\.in)$/],
  ["x", /(^|\.)(x\.com|twitter\.com)$/],
  ["youtube", /(^|\.)(youtube\.com|youtu\.be)$/],
];
export function networkOf(url) {
  try {
    const host = new URL(cleanUrl(url)).hostname.toLowerCase();
    const hit = NETWORKS.find(([, re]) => re.test(host));
    return hit ? hit[0] : "";
  } catch {
    return "";
  }
}

/* A source someone typed, checked: { source } or { error }. */
export function cleanSource({ kind, title, url }) {
  let k = SOURCE_KINDS.some((x) => x.key === kind) ? kind : "other";
  const t = clean(title).slice(0, 120);
  const raw = clean(url);
  const u = cleanUrl(raw);
  // Filed as a website or "something else", but it's their LinkedIn (or
  // Facebook, X…): file it as what it is.
  if (u && (k === "website" || k === "other")) k = networkOf(u) || k;
  if (raw && !u) return { error: "That link doesn't look right. It should start with https://" };
  if (!t && !u) return { error: "Give it a name, or paste its link." };
  return { source: { kind: k, title: t, url: u } };
}

/* Their own profiles, for the row of seals under their name: the
   Facebook, Instagram, TikTok, LinkedIn, X, YouTube and website links kept
   on their page, the first of each kind, in that order. Only ones with a
   link. A link filed under another kind still counts for the network its
   address is on. (TestFlight 14 Oct: "tap and it opens, if filled in".) */
export const PROFILE_KINDS = [
  // No brand colour: the marks are ink (DECISIONS A4, PL-J4-b).
  // `prefix` is what sits greyed before the cursor when the mark is tapped
  // (FB-331: ask only for the username); `handle` is what a username may
  // be; `like` the example in the error.
  { key: "facebook", label: "Facebook", short: "f", prefix: "facebook.com/", handle: /^[A-Za-z0-9.]{5,50}$/, like: "rose.miller" },
  { key: "instagram", label: "Instagram", short: "ig", prefix: "instagram.com/", handle: /^[A-Za-z0-9._]{1,30}$/, like: "rosemiller" },
  { key: "tiktok", label: "TikTok", short: "tt", prefix: "tiktok.com/@", handle: /^[A-Za-z0-9._]{2,24}$/, like: "rosemiller" },
  { key: "linkedin", label: "LinkedIn", short: "in", prefix: "linkedin.com/in/", handle: /^[A-Za-z0-9%_-]{3,100}$/, like: "rose-miller" },
  { key: "x", label: "X", short: "x", prefix: "x.com/", handle: /^[A-Za-z0-9_]{1,15}$/, like: "rosemiller" },
  { key: "youtube", label: "YouTube", short: "yt", prefix: "youtube.com/@", handle: /^[A-Za-z0-9._-]{3,30}$/, like: "rosemiller" },
  { key: "website", label: "Website", short: "www", prefix: "", handle: null, like: "millerbakery.com" },
];
const kindInfo = (kind) => PROFILE_KINDS.find((k) => k.key === kind) || null;

/* The page a username is on: pageFor("instagram", "@rosemiller") →
   "https://instagram.com/rosemiller"; "" when it isn't a username. */
export function pageFor(kind, handle) {
  const k = kindInfo(kind);
  if (!k || !k.handle) return "";
  const h = clean(handle).replace(/^@+/, "");
  return k.handle.test(h) ? `https://${k.prefix}${h}` : "";
}

/* What's left of a link once the tracking is off: "instagram.com/rosemiller". */
export function linkDisplay(url) {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/$/, "")}${u.search}`;
  } catch {
    return "";
  }
}

// Query strings that only say where a link was copied from. A profile's
// own address never needs them; a website might need the rest of its
// query, so only these go.
const TRACKING = /^(utm_\w*|igsh|igshid|fbclid|gclid|mc_cid|mc_eid|si|ref|ref_src|ref_url|refsrc|feature|_r|mibextid|rdid|share_url|is_from_webapp|sender_device|sender_web_id|web_id|_t|t|s|lang|hl|locale|source|trk|original_referer|checkpoint_src|sub_confirmation)$/i;
const stripTracking = (u, keep = null) => {
  const params = [...u.searchParams.keys()];
  for (const p of params) if (keep ? !keep.includes(p) : TRACKING.test(p)) u.searchParams.delete(p);
  u.hash = "";
};
// The first segments of a path that aren't a username on each network.
const RESERVED = {
  facebook: ["share", "groups", "pages", "photo", "photo.php", "watch", "events", "permalink.php", "story.php", "reel", "reels", "stories", "marketplace", "gaming", "login", "login.php", "sharer", "sharer.php", "dialog", "hashtag", "help", "policies"],
  instagram: ["p", "reel", "reels", "stories", "explore", "tv", "accounts", "direct", "share"],
  tiktok: ["video", "music", "tag", "discover", "foryou", "following", "search", "embed", "upload", "live"],
  linkedin: ["posts", "feed", "pulse", "jobs", "learning", "events", "groups", "search", "help", "legal", "login", "signup", "uas", "checkpoint"],
  x: ["i", "home", "search", "explore", "intent", "hashtag", "settings", "notifications", "messages", "compose", "login", "signup", "share"],
  youtube: ["watch", "shorts", "playlist", "results", "feed", "embed", "live", "hashtag", "premium", "account", "post", "redirect", "attribution_link", "oembed", "s", "t"],
};
// Short links and other shapes that are somebody's page without a username
// in them: kept whole, the tracking off.
const KEEP_WHOLE = {
  facebook: (host, seg) => host === "fb.me" || seg[0] === "profile.php" || seg[0] === "people" || seg[0] === "pg",
  instagram: (host) => host === "instagr.am",
  tiktok: (host, seg) => /^v[mt]\.tiktok\.com$/.test(host) || seg[0] === "t",
  linkedin: (host, seg) => host === "lnkd.in" || ["company", "school", "pub", "showcase"].includes(seg[0]),
  x: () => false,
  youtube: (host, seg) => ["channel", "c", "user"].includes(seg[0]),
};
const CANON_HOST = {
  facebook: /(^|\.)(facebook\.com|fb\.com)$/,
  instagram: /(^|\.)instagram\.com$/,
  tiktok: /^(www\.|m\.)?tiktok\.com$/,
  linkedin: /(^|\.)linkedin\.com$/,
  x: /(^|\.)(x\.com|twitter\.com)$/,
  youtube: /(^|\.)youtube\.com$/,
};
const NOT_A_PAGE = {
  facebook: "a Facebook post",
  instagram: "an Instagram post",
  tiktok: "a TikTok video",
  linkedin: "a LinkedIn post",
  x: "a post on X",
  youtube: "a YouTube video",
};
const an = (word) => (/^([aeiou]|x$)/i.test(word) ? "an" : "a"); // an Instagram page, an X page
const notPage = (k) => `That doesn’t look like ${an(k.label)} ${k.label} page — try the username, like ${k.like}.`;
const notAPage = (k, what) => `That’s ${what}, not a page — try the username, like ${k.like}.`;

/* A link on a network, settled: the host as the network writes it, the
   tracking off, the username read out of the path. { url, handle } or
   { error } (a post, a video: not a page). */
function settleLink(url, net) {
  const k = kindInfo(net);
  const u = new URL(url);
  const host = u.hostname.toLowerCase().replace(/^(www|m|mobile|mbasic|web|touch)\./, "");
  const seg = u.pathname.split("/").filter(Boolean).map((s) => decodeURIComponent(s));
  const canon = CANON_HOST[net]?.test(host);
  if (KEEP_WHOLE[net]?.(host, seg)) {
    stripTracking(u, seg[0] === "profile.php" ? ["id"] : null);
    u.hostname = canon ? k.prefix.split("/")[0] : host;
    return { url: u.toString().replace(/\/$/, ""), handle: "" };
  }
  let first = seg[0] || "";
  if (RESERVED[net]?.includes(first) || host === "youtu.be") {
    // x.com/rosemiller/status/… is still her page; the rest are posts.
    return { error: notAPage(k, NOT_A_PAGE[net]) };
  }
  if ((net === "linkedin" && first === "in") || ((net === "tiktok" || net === "youtube") && first.startsWith("@"))) first = net === "linkedin" ? seg[1] || "" : first.slice(1);
  else if (net === "linkedin") return { error: notPage(k) };
  else if (net === "tiktok" || net === "youtube") return { error: notPage(k) };
  first = first.replace(/^@+/, "");
  if (!first) return { error: notPage(k) };
  if (!k.handle.test(first)) return { error: notPage(k) };
  return { url: `https://${k.prefix}${first}`, handle: first };
}

const looksLikeLink = (t) => /^(https?:\/\/|www\.)/i.test(t) || t.includes("/") || !!networkOf(t);
export function profileLinks(person) {
  const list = Array.isArray(person?.sourceLinks) ? person.sourceLinks : [];
  return PROFILE_KINDS.map((k) => {
    const hit = list.find((x) => {
      if (!x || !cleanUrl(x.url)) return false;
      if (k.key === "website") return x.kind === "website" && !networkOf(x.url);
      return x.kind === k.key || ((x.kind === "website" || x.kind === "other") && networkOf(x.url) === k.key);
    });
    return hit ? { ...k, url: cleanUrl(hit.url) } : null;
  }).filter(Boolean);
}

/* "Elsewhere" on their page (DECISIONS A4, j5-spec §2.1, P4): every kept
   source that has a link, one word each, in the order the family added
   them. A network by its own name ("Facebook"); a press cutting by its year
   ("The 2011 newsletter"); anything else by its title. The album and the
   family chat have no link, so they live in Sources only. */
export function elsewhereLinks(person) {
  const list = Array.isArray(person?.sourceLinks) ? person.sourceLinks : [];
  const seen = new Set();
  const out = [];
  for (const x of list) {
    const url = cleanUrl(x?.url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const net = networkOf(url) || (PROFILE_KINDS.some((k) => k.key === x.kind && k.key !== "website") ? x.kind : "");
    const title = clean(x.title);
    let word;
    if (net) word = PROFILE_KINDS.find((k) => k.key === net).label;
    else if (x.kind === "press" || x.kind === "obituary") {
      const year = (title.match(/\b(1[89]\d\d|20\d\d)\b/) || [])[1];
      const noun = (title.match(/\b(newsletter|obituary|article|newspaper|magazine)\b/i) || [])[1];
      word = year && noun ? `The ${year} ${noun.toLowerCase()}` : title || linkSite(url);
    } else word = title || linkSite(url);
    out.push({ key: `${x.kind || "link"}-${out.length}`, kind: net || x.kind || "website", word, title: title || word, url, net: !!net });
  }
  // Their own pages first, in the networks' order, then what was written about them.
  const rank = (l) => (l.net ? PROFILE_KINDS.findIndex((k) => k.key === l.kind) : PROFILE_KINDS.length);
  return out.map((l, i) => ({ l, i })).sort((a, b) => rank(a.l) - rank(b.l) || a.i - b.i).map(({ l }) => l);
}

/* What a pasted link is, said plainly (j4-spec §2.7): { kind, url, line }.
   "That's Instagram." for a network, "That's a website." for any other real
   link, "" for something that isn't one yet. */
export function recognise(text, kind = "") {
  const t = clean(text);
  const none = { kind: "", url: "", handle: "", line: "", error: "" };
  const chosen = kindInfo(kind);
  if (!t) return none;
  // The mark was tapped (FB-331): a username is enough. "rosemiller",
  // "@rosemiller" and the whole address all land on the same page.
  if (chosen && chosen.handle && !looksLikeLink(t)) {
    const url = pageFor(chosen.key, t);
    if (!url) return { ...none, kind: chosen.key, error: notPage(chosen) };
    return { kind: chosen.key, url, handle: t.replace(/^@+/, ""), line: `That’s ${chosen.label}.`, error: "" };
  }
  const url = cleanUrl(t);
  if (!url) {
    if (chosen && !chosen.handle) return { ...none, kind: "website", error: `That doesn’t look like a web address — try the whole thing, like ${chosen.like}.` };
    return chosen ? { ...none, kind: chosen.key, error: notPage(chosen) } : none;
  }
  const net = networkOf(url);
  if (chosen && chosen.handle && net !== chosen.key) {
    // Instagram was tapped and a Facebook link pasted: say so, plainly.
    return { ...none, kind: chosen.key, error: notPage(chosen) };
  }
  if (!net) {
    const u = new URL(url);
    stripTracking(u);
    return { kind: "website", url: u.toString(), handle: "", line: "That’s a website.", error: "" };
  }
  const settled = settleLink(url, net);
  const label = kindInfo(net).label;
  if (settled.error) return { ...none, kind: net, error: settled.error };
  return { kind: net, url: settled.url, handle: settled.handle, line: `That’s ${label}.`, error: "" };
}

/* Add a page elsewhere to `links` (a person's sourceLinks). A page on a
   network that already has one takes its place, in the same write.
   `kind` is the mark that was tapped, if one was. { links, added, replaced }
   or { error }. */
export function addElsewhere(links = [], text, { by = "", at = "", kind = "" } = {}) {
  const r = recognise(text, kind);
  if (r.error) return { error: r.error };
  if (!r.url) return { error: "That link doesn’t look right. Paste the whole address, starting with https://" };
  const label = PROFILE_KINDS.find((k) => k.key === r.kind)?.label || linkSite(r.url);
  const added = { kind: r.kind, title: label, url: r.url, by, at };
  const same = (x) => cleanUrl(x?.url) && (x.kind === r.kind || networkOf(x.url) === r.kind) && r.kind !== "website";
  const replaced = (links || []).find(same) || null;
  const kept = (links || []).filter((x) => !same(x));
  return { links: [...kept, added], added, replaced };
}

/* Take one page off by its link. { links, removed, index } (removed is
   null when it wasn't there), so Undo can put it back in its place. */
export function takeOffElsewhere(links = [], url) {
  const i = (links || []).findIndex((x) => cleanUrl(x?.url) === cleanUrl(url));
  if (i < 0) return { links: links || [], removed: null, index: -1 };
  return { links: links.filter((_, j) => j !== i), removed: links[i], index: i };
}

/* "press|Title|https://…" ↔ a source: how a suggestion carries one. */
export function sourceToText(x) {
  return [x.kind, String(x.title || "").replace(/\|/g, "/"), x.url || ""].join("|").slice(0, 240);
}
export function sourceFromText(t) {
  const [kind, title, url] = String(t || "").split("|");
  const res = cleanSource({ kind, title, url });
  return res.source || null;
}

/* The site a link is on, for the line under its title: "nytimes.com". */
export function linkSite(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

const ORIGIN = {
  manual: (by) => (by ? `Added to the family tree by ${by}` : "Added to the family tree"),
  gedcom: () => "Read in from a family-tree file",
  invite: (by) => (by ? `Invited by ${by}` : "Joined from an invitation"),
  contribution: () => "Named in a memory sent in by family",
};

/* How they came into the tree: "Added to the family tree by Jamie · 3
   September 2026". `by` is a first name or "you"; `when` a date string. */
export function originLine(person, by = "", when = "") {
  const f = ORIGIN[person?.source] || ORIGIN.manual;
  const date = (() => {
    const d = when ? new Date(when) : null;
    return d && !Number.isNaN(d.getTime())
      ? d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : "";
  })();
  return [f(by), date].filter(Boolean).join(" · ");
}

const MEMORY_SOURCE = [
  ["app", "Told or written in A Story"],
  ["call", "Told to A Story on a call"],
  ["write", "Written in the app"],
  ["room", "Recorded in the room"],
  ["family_call", "From a family call"],
  ["group_call", "From a family call"],
  ["memoir", "From a memoir"],
  ["whatsapp", "From a WhatsApp chat"],
  ["family", "Sent in by family"],
];

/* Where their memories came from, counted: [{ key, label, count }], the
   most first. A memory credited to somebody else counts as sent in by
   family. One with no source recorded (most of them: only memoirs are
   marked so far, memory_source.sql) is said to be told or written in A
   Story, which is all that's known about it. */
export function memorySources(memories = []) {
  const counts = new Map();
  for (const m of memories) {
    if (!m || m.status === "in_progress") continue;
    let k = m.source || "";
    if (!k && clean(m.contributor)) k = "family";
    if (k === "family_call") k = "group_call";
    if (!MEMORY_SOURCE.some(([key]) => key === k)) k = clean(m.contributor) ? "family" : "app";
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  return [...counts]
    .map(([key, count]) => ({ key, label: MEMORY_SOURCE.find(([k]) => k === key)[1], count }))
    .sort((a, b) => b.count - a.count);
}
