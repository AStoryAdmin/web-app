// "Not this one — show me another."
//
// A question deck needs a skip, and a skip needs an opinion about what comes
// next. Two rules:
//
//   Never hand back a question this person has already answered. Memories
//   keep the question as their title, so that's what's matched — which also
//   means a question answered in a live call counts as answered here.
//
//   Prefer the chapters with least in them. Skipping should quietly steer
//   toward the gaps in the book rather than wandering at random, without ever
//   announcing that it's doing so.

/* prompts: the rendered list from getPrompts()
   memories: the story's memories, for what's been answered and where
   current: the question on screen, which is the one thing it can't return
   random: injected so tests aren't a coin flip */
export function pickNextQuestion(prompts, memories = [], current = "", random = Math.random) {
  const answered = new Set(
    memories.map((m) => (m.title || "").trim()).filter(Boolean)
  );

  // In either wording (lib/questionVoice.js `alt`).
  const fresh = (prompts || []).filter(
    (q) => q.question !== current && !answered.has(q.question.trim()) && !(q.alt && answered.has(q.alt.trim()))
  );
  if (!fresh.length) return null;

  const counts = {};
  for (const m of memories) counts[m.era] = (counts[m.era] || 0) + 1;

  const thinnest = Math.min(...fresh.map((q) => counts[q.era] || 0));
  const pool = fresh.filter((q) => (counts[q.era] || 0) === thinnest);

  return pool[Math.floor(random() * pool.length)] || pool[0];
}
