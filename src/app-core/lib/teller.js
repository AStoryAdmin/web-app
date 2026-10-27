// Who is telling a story's memories right now: the storyteller, or somebody
// remembering them.
//
// Every conversation used to assume the storyteller. A grandchild who kept
// Grandpa Henry's story and tapped Talk was greeted "Let's talk, Henry", and
// A Story spoke to them as if they were him. Now the app works it out, and
// lets them say otherwise: the phone may well be handed to Grandpa, which
// is why it's a choice on the screen and not only a guess here.
//
// Pure, so it's tested.

/* What the story's person is to the account holder ("Grandfather") turned
   round: what the account holder is to them. */
const INVERSE = {
  Grandmother: "grandchild",
  Grandfather: "grandchild",
  Mother: "child",
  Father: "child",
  Spouse: "spouse",
  Sibling: "sibling",
  Friend: "friend",
};

const firstWord = (s) => String(s || "").trim().split(/\s+/)[0] || "";

/* { isStoryteller, name, personId, relation, storytellerName }
     story   the story being told
     user    the signed-in account ({ id, firstName })
     people  the family tree's people
   The storyteller is telling when the story is their own ("Myself"), or
   the account is that person in the tree. Otherwise it's a relative. */
export function tellerFor({ story, user, people = [] } = {}) {
  const storytellerName = firstWord(story?.name) || "them";
  const subject = (people || []).find((p) => p?.storyId && p.storyId === story?.id) || null;
  const me = (people || []).find((p) => p?.userId && p.userId === user?.id) || null;
  const isStoryteller =
    story?.relationship === "Myself" || (!!subject?.userId && subject.userId === user?.id);
  const ownStory = !!story?.ownerId && story.ownerId === user?.id;
  return {
    isStoryteller,
    name: firstWord(user?.firstName) || firstWord(me?.givenName) || "",
    personId: me?.id || null,
    // Only the owner's word for the relationship is theirs; a keeper who
    // isn't the owner is "family" unless the tree says more.
    relation: ownStory ? INVERSE[story?.relationship] || "relative" : "relative",
    storytellerName,
  };
}

/* The line in the middle of the Talk screen. */
export function talkHeadline(teller, { storytellerHere = false } = {}) {
  const name = teller?.storytellerName || "them";
  if (teller?.isStoryteller || storytellerHere) return `Let’s talk, ${name}`;
  return `Tell A Story about ${name}`;
}

/* What A Story is told, as a note the person never sees, about who it's
   talking with. Null when it's the storyteller: that's what the session
   already assumes. */
export function tellerNote(teller, { storytellerHere = false } = {}) {
  if (!teller || teller.isStoryteller) return null;
  const them = teller.storytellerName;
  const who = teller.name ? `${teller.name}, ${them}'s ${teller.relation}` : `one of ${them}'s family`;
  if (storytellerHere) {
    return (
      `${them} is here now and talking with you, with ${who} beside them. ` +
      `Ask ${them} directly, as you would on their own call.`
    );
  }
  return (
    `You are talking with ${who}, not with ${them}. They are telling you what they remember about ${them}. ` +
    `Ask about ${them} in the third person: what they saw ${them} do, what ${them} said, ` +
    `what they were told, and their own moments with ${them}. Never call them ${them}. ` +
    `If they don't know something, that's fine; ask what they do remember.`
  );
}

/* The day's question, when it was written to the storyteller and a
   relative is the one answering: A Story asks it about them instead, in
   its own words. */
export function questionForTeller(question, teller, { storytellerHere = false } = {}) {
  const q = String(question || "").trim();
  if (!q) return null;
  if (!teller || teller.isStoryteller || storytellerHere) return null;
  const them = teller.storytellerName;
  return (
    `They opened this conversation from the question "${q}", which was written to ${them}. ` +
    `Start by asking it about ${them} instead, in your own words, in one short question.`
  );
}

/* A conversation, with each of the relative's lines marked as theirs, so
   the summary is written as their memory of the storyteller ("Jamie
   remembers Henry…") rather than in the storyteller's own voice. */
export function conversationForTeller(conversation, teller, { storytellerHere = false } = {}) {
  if (!teller || teller.isStoryteller || storytellerHere || !teller.name) return conversation || [];
  return (conversation || []).map((t) =>
    t?.role === "user" ? { ...t, content: `${teller.name} (about ${teller.storytellerName}): ${t.content}` } : t
  );
}

/* How a memory a relative told is credited on the card and in the book:
   "Jamie, her granddaughter" when the tree says what they are to the
   storyteller (`relation`, lib/credit relationTo), else the name alone
   (FB-326 item 1: a keeper's credit carries their relationship too). */
export function tellerCredit(teller, { storytellerHere = false, relation = "" } = {}) {
  if (!teller || teller.isStoryteller || storytellerHere || !teller.name) return null;
  const rel = String(relation || "").trim();
  return { contributor: rel ? `${teller.name}, ${rel}` : teller.name, authorPersonId: teller.personId || null };
}
