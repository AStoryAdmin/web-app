// The stories somebody in the family could add to, for a Home that has no
// story of its own yet.
//
// A relative who joins through the tree (a family code, an invite to a
// person) often keeps no story at first. Their Home used to say "It starts
// with a collection" and offer to start one, while their mother's and
// father's stories sat one tab away. This picks out the people whose
// stories somebody in the family keeps, so Home can offer "Add what you
// remember" and "Ask to join" for each, and leave starting a new story as
// the smaller choice.
//
// Pure, so it's tested.

/* People with a story this account doesn't keep, oldest first, the living
   before the dead: the ones somebody is likeliest to want to add to now.
   Never yourself, never a placeholder box. */
export function storiesToAddTo({ people = [], meId = null, myStoryIds = [] } = {}) {
  const mine = new Set(myStoryIds || []);
  return (people || [])
    .filter(
      (p) =>
        p &&
        p.storyId &&
        !mine.has(p.storyId) &&
        p.source !== "placeholder" &&
        !(meId && p.userId === meId) &&
        String(p.givenName || "").trim()
    )
    .sort((a, b) => {
      const da = a.deathYear ? 1 : 0;
      const db = b.deathYear ? 1 : 0;
      if (da !== db) return da - db;
      const ya = Number(a.birthYear) || 9999;
      const yb = Number(b.birthYear) || 9999;
      if (ya !== yb) return ya - yb;
      return String(a.givenName).localeCompare(String(b.givenName));
    });
}

/* "The Nguyen family", from your own place in the tree; "Your family"
   when the tree doesn't know your family name. */
export function familyTitle({ people = [], meId = null } = {}) {
  const me = (people || []).find((p) => p && meId && p.userId === meId);
  const last = String(me?.familyName || "").trim();
  return last ? `The ${last} family` : "Your family";
}

/* The story that is this account's own life, if there is one: the story
   bound to their own row in the tree (a place somebody made for them, with
   a story about them that they keep since joining), else a "Myself" story
   they own. Without the first, joining at a place that already had a story
   about you gave you a second, empty one beside it. */
export function myOwnStory(data, userId) {
  if (!userId) return null;
  const stories = data?.stories || [];
  const me = (data?.family?.people || []).find((p) => p && p.userId === userId);
  const bound = me?.storyId ? stories.find((s) => s.id === me.storyId) : null;
  if (bound) return bound;
  return stories.find((s) => s.relationship === "Myself" && s.ownerId === userId) ||
    stories.find((s) => s.relationship === "Myself" && !s.ownerId) ||
    null;
}
