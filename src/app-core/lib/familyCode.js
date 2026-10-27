// Family codes: six letters that put somebody into their family on A Story
// (supabase/family_codes.sql). The pure part: reading a code out of what
// people type and the links they tap, and the words around it.
//
// Before this, the invite said "use code JAMIE24 when you sign up", and that
// code connected nobody; only signing up with the invited email did. A
// tester typed the code, used a different email, and never found the family.

// What the server makes: no I, L, O, 0 or 1, so nothing reads two ways.
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const FAMILY_CODE_LENGTH = 6;

/* What somebody typed, as the server will read it: capitals, nothing but
   letters and digits. Somebody reading "k7m 2qx" off a text, or "K7M-2QX",
   gets the same code. */
export function normaliseFamilyCode(input) {
  return String(input || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);
}

/* Six of the right characters: worth sending to the server. */
export function looksLikeFamilyCode(input) {
  const c = normaliseFamilyCode(input);
  return c.length === FAMILY_CODE_LENGTH && [...c].every((ch) => CODE_CHARS.includes(ch));
}

/* "K7M2QX" → "K7M 2QX": easier to read out over the phone. */
export function spacedCode(code) {
  const c = normaliseFamilyCode(code);
  return c.length === FAMILY_CODE_LENGTH ? `${c.slice(0, 3)} ${c.slice(3)}` : c;
}

/* The code in a link somebody tapped, or null:
     astory://signup?ref=K7M2QX       (the app's own link)
     astory://join/K7M2QX, astory://join?code=K7M2QX
     https://astoryapp.com/?ref=K7M2QX, …/join/K7M2QX
   A family call link (?join=<call>.<token>) is something else entirely and
   is never read as a code. */
export function codeFromLink(url) {
  const s = String(url || "");
  if (!s) return null;
  const pick = (v) => {
    const c = String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    return c.length >= 4 && c.length <= 12 ? c : null;
  };
  // astory://join/K7M2QX parses with "join" as the host; https://…/join/K7M2QX
  // with it as the first path segment. Either way it's "join/" then the code.
  const path = s.match(/(?:\/\/|\/)join\/([A-Za-z0-9-]{4,14})(?=[/?#]|$)/i);
  if (path) return pick(path[1]);
  const q = s.indexOf("?");
  if (q < 0) return null;
  const params = new URLSearchParams(s.slice(q + 1).split("#")[0]);
  return pick(params.get("code") || params.get("ref") || "");
}

/* What the join came to, in words: j3-spec §2's copy deck, exactly (R-Y4).
   `result` is join_family()'s answer, or { ok: false, reason: 'offline' |
   'not_ready' | 'short', filled } from the app. A refusal carries the
   deck's title too, "That didn't work."
   Success says where the story is now, on Home (J3: a reader's Home leads
   with the story she joined); the screen writes the rest of the welcome
   from the family's own facts (headcount, the newest kept memory). */
export const JOIN_FAILED_TITLE = "That didn't work.";
export function joinOutcome(result) {
  if (result?.ok) {
    const who = result.inviter_name;
    const story = result.story_name;
    if (result.already) {
      return { ok: true, title: "You're already in", body: story ? `${story}'s story is on your Home.` : "Your family's stories are on your Home." };
    }
    const body = [
      who ? `Welcome to ${who}'s family.` : "Welcome to the family.",
      story ? `${story}'s story is on your Home.` : "Your family's stories are on your Home.",
      // Their own tree came with them (family_join_merge.sql).
      result.moved > 0 ? "Everyone you had added is in the family tree now." : "",
    ].filter(Boolean).join(" ");
    return { ok: true, title: result.person_name ? `You're in, ${result.person_name}` : "You're in", body };
  }
  const no = (body) => ({ ok: false, title: JOIN_FAILED_TITLE, body });
  switch (result?.reason) {
    case "not_found":
      return no("That code isn't one we know. Check it against the message.");
    case "expired":
      return no("That code has run out. Ask whoever sent it for a new one.");
    case "used":
    case "taken":
      return no("That code has been used. Ask whoever sent it for a new one.");
    case "too_many":
      return no("That's a lot of tries for one hour. Wait a little, then try again.");
    case "signed_out":
      return no("Sign in first, then type the code again. It's kept for you.");
    case "not_ready":
      return no("Joining with a code isn't switched on yet. Ask them to invite you by email for now.");
    case "short": {
      const n = Number(result?.filled);
      return no(n > 0 && n < FAMILY_CODE_LENGTH ? `That's ${n} of the ${FAMILY_CODE_LENGTH}. The rest are in the message.` : `A family code is ${FAMILY_CODE_LENGTH} letters and numbers. They're all in the message.`);
    }
    default:
      // Offline, or no answer in 8 s.
      return no("That didn't go through. Your code is kept, so try again in a moment.");
  }
}

/* The deck's tree note, said before the code goes in, only when her own
   place in a tree would move to where the family put her. */
export const JOIN_TREE_NOTE = "Your place in the family tree may move to where they put you.";
export function joinTreeNote({ people = [], meId = null } = {}) {
  const mine = (people || []).some((p) => p && meId && p.userId === meId && p.source !== "placeholder");
  return mine ? JOIN_TREE_NOTE : null;
}

/* What joining does to a tree this account already made, said before the
   code goes in. Null when there is nothing of their own to move. What the
   lead asked (2026-10-13): two people each start a tree, one joins with the
   other's code, who is the organizer and what happens to the rest?
   family_join_merge.sql answers: their own tree moves into the family,
   whoever sent the code stays organizer, and their own row becomes the
   place made for them. This says so in words. */
export function joinPreviewLine({ people = [], meId = null } = {}) {
  // Somebody else with an account in the tree means it is a family's tree,
  // not one of your own, and joining another family moves nothing
  // (family_join_merge.sql is_solo_household).
  if ((people || []).some((p) => p && p.userId && meId && p.userId !== meId)) return null;
  const own = (people || []).filter((p) => p && p.source !== "placeholder");
  const others = own.filter((p) => !(meId && p.userId === meId)).length;
  if (!others) return null;
  return (
    `You already have ${others} ${others === 1 ? "person" : "people"} in a tree of your own. Joining moves them into the family you join, ` +
    "and whoever sent the code stays its organizer. Your own place keeps what you added."
  );
}

/* The link a code travels in: opens the app with the code filled in, or
   the website for somebody who hasn't got it yet. */
export function joinLink(siteUrl, code) {
  const base = String(siteUrl || "").replace(/\/+$/, "");
  const c = normaliseFamilyCode(code);
  return c ? `${base}/?ref=${c}` : base;
}

/* One plain sentence, next to the code wherever it's shown. */
export const CODE_HOW_TO = "They type these six letters and numbers into A Story, under \"I have a code from family\".";
export const LINK_HOW_TO = "Tapping it opens A Story with the code already filled in.";

/* The whole message, for Share or a text. Short enough to read on a lock
   screen, with the code on its own line so it can be read out. */
export function inviteMessage({ code, link, senderName, storyName } = {}) {
  const c = spacedCode(code);
  const opener = storyName
    ? `I'm keeping ${storyName}'s stories on A Story. Come and hear them, and add yours.`
    : "Our family is on A Story. Come and join us.";
  return [
    opener,
    "",
    `Your family code: ${c}`,
    "",
    `Tap here: ${link}`,
    `Or open A Story, tap "I have a code from family" and type ${c}.`,
    ...(senderName ? ["", `— ${senderName}`] : []),
  ].join("\n");
}
