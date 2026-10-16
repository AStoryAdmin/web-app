// "From the family": the memories in a story that came from somebody other
// than the person keeping it — sent in by a relative and approved, told on
// a family call, or written by another account on the story.
//
// The Family tab shows these; the Archive shows the whole story. Before,
// the Family tab carried the Archive's own browser, so the two tabs showed
// the same list twice. Pure, so it's tested.

const saved = (m) => m && m.status !== "in_progress";

/* Why a memory counts as the family's, or null when it's the keeper's own. */
export function familySource(memory, ownerId) {
  if (!saved(memory)) return null;
  if (memory.familyCallId) return "call";
  if (memory.contributor || memory.authorPersonId) return "sent";
  if (memory.createdBy && ownerId && memory.createdBy !== ownerId) return "written";
  return null;
}

/* Newest first. `limit` keeps the tab short; the Archive has the rest. */
export function familyMemories(story, { limit = Infinity } = {}) {
  const owner = story?.ownerId || null;
  return (story?.memories || [])
    .filter((m) => familySource(m, owner))
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .slice(0, limit);
}
