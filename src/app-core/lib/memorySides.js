// Who told a memory, and what the family has added to it, for the line
// under its title and the "From the family" part of its page.
//
// The memory page said when and which chapter, and nothing about whose
// words they were or that anybody else remembered it too. It's the page
// the weekly email and shared links open, so it should say both, and ask
// the reader for their side.
//
// Pure, so it's tested.

/* "Rose told this", "From Linh, her daughter", "From Rose's memoir", or
   "In your words" on your own story. Never invents a teller: a memory with
   no story says nothing.

   "Myself" is the owner's word for the story, so "In your words" is only
   for the owner reading it (`meId`). A keeper reading Rose's own story
   sees "Rose told this". */
export function toldBy(story, memory, meId = null) {
  if (!story || !memory) return "";
  const contributor = String(memory.contributor || "").trim();
  if (contributor) return `From ${contributor}`;
  if (memory.source === "memoir") return `From ${story.name}'s memoir`;
  if (story.relationship === "Myself" && meId && story.ownerId === meId) return "In your words";
  const name = String(story.name || "").trim();
  return name ? `${name} told this` : "";
}

/* The family's sides of one memory: approved context sent for it, oldest
   first, the order they were added in. Only context (kind "testimonial"):
   a contribution of kind "memory" becomes a memory of its own when it's
   approved, and shown here too it would read twice. */
export function sidesFor(contributions = [], memoryId) {
  if (!memoryId) return [];
  return (contributions || [])
    .filter(
      (c) =>
        c &&
        c.memoryId === memoryId &&
        c.status === "approved" &&
        (c.kind || "testimonial") === "testimonial" &&
        String(c.body || "").trim()
    )
    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
}

/* Who can be asked for their side of a memory: the living people in the
   tree, not you, who are on A Story or have an email on their row. Those on
   A Story first (they are asked in the app), then by name. */
export function theirSideCandidates(people, me) {
  const myEmail = String(me?.email || "").toLowerCase();
  return (people || [])
    .filter((p) => p && p.source !== "placeholder" && !p.deathYear)
    .filter((p) => !(me?.id && p.userId === me.id) && !(p.email && myEmail && String(p.email).toLowerCase() === myEmail))
    .filter((p) => p.userId || p.email)
    .sort((a, b) => (!!b.userId - !!a.userId) || String(a.givenName || "").localeCompare(String(b.givenName || "")));
}

/* What to say once they're asked: in the app for somebody on A Story, by
   email for somebody who isn't. */
export function askedLine({ asked = 0, inApp = 0 } = {}, label, title) {
  if (!asked) return { title: "Already asked", body: `${label} ${label === "everyone" ? "were" : "was"} already asked about this one.` };
  const byMail = asked - inApp;
  const how =
    inApp && byMail
      ? "Those on A Story will see it in the app; the others get an email."
      : inApp
        ? "They'll see it in A Story."
        : "They'll get an email.";
  return { title: `Asked ${label}`, body: `${how} Their side of "${title}" lands here when they answer.` };
}

/* Who wrote somebody's side, and from where, for the line under it:
   "Linh, partner · written in A Story · 14 Oct 2026". (Daniel, TestFlight
   14 Oct: everyone should know who wrote it and from where.) */
const VIA = { app: "written in A Story", call: "said on a call with A Story", link: "sent from the family's link" };
export function sideCredit(c) {
  if (!c) return "";
  const who = [c.contributorName || "Someone in the family", c.relationship ? String(c.relationship).toLowerCase() : ""].filter(Boolean).join(", ");
  const t = c.createdAt ? new Date(c.createdAt) : null;
  const when = t && !Number.isNaN(t.getTime()) ? t.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
  return [who, VIA[c.via] || "", when].filter(Boolean).join(" · ");
}
