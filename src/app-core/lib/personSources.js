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

/* A source someone typed, checked: { source } or { error }. */
export function cleanSource({ kind, title, url }) {
  const k = SOURCE_KINDS.some((x) => x.key === kind) ? kind : "other";
  const t = clean(title).slice(0, 120);
  const raw = clean(url);
  const u = cleanUrl(raw);
  if (raw && !u) return { error: "That link doesn't look right. It should start with https://" };
  if (!t && !u) return { error: "Give it a name, or paste its link." };
  return { source: { kind: k, title: t, url: u } };
}

/* Their own profiles, for the row of buttons under their name: the
   Facebook, Instagram, TikTok, LinkedIn and website links kept on their
   page, the first of each kind, in that order. Only ones with a link.
   (TestFlight 14 Oct: "tap and it opens, if filled in".) */
export const PROFILE_KINDS = [
  { key: "facebook", label: "Facebook", short: "f", color: "#1877F2" },
  { key: "instagram", label: "Instagram", short: "ig", color: "#C13584" },
  { key: "tiktok", label: "TikTok", short: "tt", color: "#111111" },
  { key: "linkedin", label: "LinkedIn", short: "in", color: "#0A66C2" },
  { key: "website", label: "Website", short: "www", color: "#5B6B73" },
];
export function profileLinks(person) {
  const list = Array.isArray(person?.sourceLinks) ? person.sourceLinks : [];
  return PROFILE_KINDS.map((k) => {
    const hit = list.find((x) => x && x.kind === k.key && cleanUrl(x.url));
    return hit ? { ...k, url: cleanUrl(hit.url) } : null;
  }).filter(Boolean);
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
