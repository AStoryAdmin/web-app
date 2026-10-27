// Trust after the first yes (DECISIONS S-PL5, write-for-others-spec §3.1).
//
// The keeper says yes to each person once: their first version waits for
// "Keep both" or "Keep it", as it always has (the filmed moment). From
// then on that person's sides and new memories go straight onto the
// storyteller's memory, with their name, and any keeper can take one off.
// The storyteller can say "Not in my story". Taking one off never deletes
// it: it goes back to its writer, square and unpasted.
//
// Trust is per story, per person: Linh trusted on Rose's story is not
// trusted on Walter's. Friends (a friend's link) and anyone without an
// account always wait.
//
// Pure, so scripts/test-truth.mjs reaches it.

// The status a version has once it's off the memory: still its writer's,
// never "rejected" (that is a keeper's no to a first send).
export const TAKEN_OFF = "withdrawn";

const first = (s) => String(s || "").trim().split(/\s+/)[0] || "";
const whose = (name) => (name ? `${name}’s` : "the");

/* Whose account sent it: the server's created_by, the demo's userId. */
export function senderOf(c) {
  return (c && (c.createdBy || c.userId)) || null;
}

/* May this sender ever be trusted? A joined family member writing in the
   app (or said on a call). Never a friend's link, never no account. */
export function mayEarnTrust(c) {
  if (!c || !senderOf(c)) return false;
  if (c.friend || c.via === "link" || c.via === "friend") return false;
  return true;
}

/* Is this person trusted on this story? `trust` is the story_trusted rows:
   [{ storyId, userId, grantedBy, grantedAt }]. */
export function isTrusted(trust, storyId, userId) {
  if (!storyId || !userId) return false;
  return (trust || []).some((t) => t && t.storyId === storyId && t.userId === userId);
}

/* Does what this person sends go straight on? Trusted after a first yes
   on a storyteller's story; on a remembered person's story (Henry,
   write-for-others-spec §5.2) from the first word, since there is no
   storyteller to protect and a queue would only make the grieving wait.
   A friend never: they wait for any organiser's yes everywhere. */
export function goesStraightOn({ trust, storyId, userId, remembered = false, friend = false } = {}) {
  if (!storyId || !userId || friend) return false;
  return !!remembered || isTrusted(trust, storyId, userId);
}

/* The rows after a keeper's yes to `c`: the sender is trusted from now on
   (once; a second yes adds nothing). Returns { trust, granted }. */
export function grantTrust(trust, c, { storyId, by = null, at = new Date().toISOString() } = {}) {
  const list = Array.isArray(trust) ? trust : [];
  const sid = storyId || c?.storyId || null;
  const uid = senderOf(c);
  if (!sid || !mayEarnTrust(c) || c?.trusted || isTrusted(list, sid, uid)) return { trust: list, granted: false };
  return { trust: [...list, { storyId: sid, userId: uid, grantedBy: by, grantedAt: at }], granted: true };
}

/* Every person a set of contributions has already earned trust for: one
   keeper's yes each (an approved row that didn't go straight on itself).
   The demo's seed, and what the server's backfill does. */
export function trustFrom(contributions, { defaultStoryId = "story-1" } = {}) {
  let trust = [];
  for (const c of contributions || []) {
    if (!c || c.status !== "approved" || c.trusted) continue;
    trust = grantTrust(trust, c, { storyId: c.storyId || defaultStoryId, at: c.reviewedAt || c.createdAt }).trust;
  }
  return trust;
}

/* How a send lands: straight on (approved, marked trusted) for someone
   trusted on this story, else waiting for a keeper's yes. */
export function landing(row, { trusted = false } = {}) {
  const on = !!trusted && !(row?.friend || row?.via === "link" || row?.via === "friend");
  return { ...row, status: on ? "approved" : "pending", trusted: on };
}

/* Taken off by a keeper ("Take it off") or the storyteller ("Not in my
   story"). Nothing in it changes but where it is: the words, the name and
   the date stay with the writer. */
export function takeOff(c, { by = "keeper", at = new Date().toISOString() } = {}) {
  if (!c) return c;
  return { ...c, status: TAKEN_OFF, withdrawnBy: by === "teller" ? "teller" : "keeper", withdrawnAt: at };
}

/* The quiet line under a version that went straight on, in the reader's
   own person: "Linh added this · kept with Rose’s", "You added this ·
   kept with Rose’s" (Linh), "Linh added this to your memory" (Rose). */
export function addedLine(c, { tellerName = "", viewer = "other" } = {}) {
  if (!c) return "";
  const her = first(tellerName);
  const name = first(c.contributorName) || "Someone in the family";
  if (viewer === "teller") return `${name} added this to your memory`;
  const who = viewer === "author" ? "You" : name;
  return her ? `${who} added this · kept with ${her}’s` : `${who} added this`;
}

/* What its writer reads once it's off the memory (J3-16, "on a no"):
   "Not on Rose’s memory. Your words stay with you." Nobody else sees it. */
export function takenOffLine(c, { tellerName = "", viewer = "other" } = {}) {
  if (!c || c.status !== TAKEN_OFF || viewer !== "author") return "";
  return `Not on ${whose(first(tellerName))} memory. Your words stay with you.`;
}

/* The gentle confirm, said on the page (never a modal): a keeper's "Take
   it off" or the storyteller's "Not in my story". */
export function takeOffAsk(c, { tellerName = "", by = "keeper" } = {}) {
  const name = first(c?.contributorName) || "their";
  const theirs = name === "their" ? "their side" : `${name}’s side`;
  const keepsIt = name === "their" ? "It stays with whoever wrote it" : `It stays with ${name}`;
  if (by === "teller") {
    return { line: `Take ${theirs} out of your story? ${keepsIt}. Nothing is deleted.`, yes: "Not in my story", no: "Leave it" };
  }
  return { line: `Take ${theirs} off ${whose(first(tellerName))} memory? ${keepsIt}. Nothing is deleted.`, yes: "Take it off", no: "Leave it on" };
}

/* Said once it's off, to whoever took it off. */
export function tookOffLine(c, { by = "keeper" } = {}) {
  const name = first(c?.contributorName);
  const stays = name ? `It stays with ${name}.` : "It stays with whoever wrote it.";
  return by === "teller" ? `Not in your story. ${stays}` : `Taken off. ${stays}`;
}

/* The leaf's foot for someone trusted (FamilyMemory): said before the send. */
export function trustedFoot(tellerName, { side = true } = {}) {
  const her = first(tellerName);
  return side
    ? `It goes straight onto ${whose(her)} memory with your name on it.`
    : `It goes straight into ${whose(her)} story with your name on it.`;
}

/* "The family is writing": who has added to one memory, by name, oldest
   first, once each. "Linh added her side", "Linh and Sam added their
   sides", "You and Sam added your sides". `sexOf(c)` gives "F"/"M" for one
   writer's her/his; a named person is never "they" (HANDOFF copy rules).
   "" when nobody has. */
export function writersLine(sides, { meId = null, sexOf = () => "" } = {}) {
  const seen = new Map();
  const list = [...(sides || [])].filter((c) => c && String(c.body || "").trim()).sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  for (const c of list) {
    const key = senderOf(c) || first(c.contributorName);
    if (!key || seen.has(key)) continue;
    const mine = !!(meId && senderOf(c) === meId) || !!c.mine;
    seen.set(key, { name: mine ? "You" : first(c.contributorName) || "Someone", mine, c });
  }
  const names = [...seen.values()].sort((a, b) => b.mine - a.mine);
  if (!names.length) return "";
  if (names.length === 1) {
    const one = names[0];
    if (one.mine) return "You added your side";
    const sex = String(sexOf(one.c) || "").toUpperCase();
    return `${one.name} added ${sex === "F" ? "her side" : sex === "M" ? "his side" : "a side"}`;
  }
  const said = names.length > 3 ? [...names.slice(0, 2).map((n) => n.name), `${names.length - 2} more`] : names.map((n) => n.name);
  const joined = `${said.slice(0, -1).join(", ")} and ${said[said.length - 1]}`;
  return `${joined} added ${names[0].mine ? "your" : "their"} sides`;
}

/* ── Same moment? (write-for-others-spec §3.1 rule 5) ──────────────────
   A new memory that looks like one already kept: a simple, honest match,
   never a block. The same year (in the words, or the memory's period)
   with the same people or a word of its title or place; or two words of
   its title. A memory the writer chose wins outright. */
const STOP = new Set(
  "about after again along always another around because before being could every first going little might never other really should since still their there these thing things those though three through under until where which while whole would years later right maybe often memory remember remembered when what with from that this they them were your yours dear family story".split(" ")
);
const stem = (w) => w.toLowerCase().replace(/['’]s$/, "").replace(/(oes|es|s)$/, (m) => (m === "oes" ? "o" : ""));
const wordsIn = (s) => (String(s || "").match(/[\p{L}'’]+/gu) || []).filter((w) => w.length >= 5 && !STOP.has(w.toLowerCase()));
const yearsIn = (s) => new Set((String(s || "").match(/\b(1[89]\d\d|20\d\d)\b/g) || []).map(Number));
// Capitalised words inside a sentence (not its first word): places and
// names, "Dayton", "Fifth Street".
const placesIn = (s) => {
  const out = [];
  for (const sentence of String(s || "").split(/[.!?…\n]+/)) {
    const ws = sentence.trim().split(/\s+/).slice(1);
    for (const w of ws) {
      const clean = w.replace(/[^\p{L}'’]/gu, "");
      if (clean.length >= 4 && /^\p{Lu}/u.test(clean) && !STOP.has(clean.toLowerCase())) out.push(clean);
    }
  }
  return out;
};

export function sameMoment(draft = {}, memories = [], { chosenId = null, skip = [] } = {}) {
  const live = (memories || []).filter((m) => m && m.id && (m.status || "saved") !== "in_progress" && !skip.includes(m.id));
  if (chosenId) {
    const chosen = live.find((m) => m.id === chosenId);
    if (chosen) return chosen;
  }
  const text = [draft.title, draft.body].filter(Boolean).join("\n");
  if (!text.trim()) return null;
  const years = yearsIn(text);
  if (draft.year) years.add(Number(draft.year));
  const words = new Set(wordsIn(text).map(stem));
  const places = new Set(placesIn(text).map((w) => w.toLowerCase()));
  const people = new Set(Array.isArray(draft.personIds) ? draft.personIds : []);
  let best = null;
  for (const m of live) {
    const sameYear = [...yearsIn(`${m.period || ""} ${m.title || ""}`)].some((y) => years.has(y));
    const titleWords = new Set(wordsIn(m.title).map(stem));
    const shared = [...titleWords].filter((w) => words.has(w)).length;
    const samePlace = placesIn(m.body).some((w) => places.has(w.toLowerCase()));
    const samePeople = (m.personIds || []).some((id) => people.has(id));
    const match = (sameYear && (samePeople || shared >= 1 || samePlace)) || shared >= 2 || (samePeople && shared >= 1);
    if (!match) continue;
    const score = (sameYear ? 2 : 0) + shared + (samePeople ? 1 : 0) + (samePlace ? 1 : 0);
    if (!best || score > best.score) best = { memory: m, score };
  }
  return best ? best.memory : null;
}

/* The one quiet line offering it: "Is this the same as ‘Summer: cut grass
   and tomatoes’? Add your side there →". */
export function sameMomentLine(memory) {
  const t = String(memory?.title || "").trim();
  return t ? `Is this the same as ‘${t}’? Add your side there` : "";
}
