// The memories somebody marked with the heart, gathered from every story
// (TreasuredScreen, and the count on the You tab). Treasured is a rating of
// five — what the heart on RecordingScreen writes and what the card's
// "Treasured" badge reads (lib/memoryCard.js). Pure, so it's tested.

export const isTreasured = (memory) => (memory?.rating || 0) >= 5;

const yearOf = (m) => {
  const y = /\b(1[89]\d\d|20\d\d)\b/.exec(String(m?.period || ""));
  return y ? Number(y[1]) : Infinity;
};

/* [{ story, memories }] for each story with a treasured memory, in the
   order the stories are listed, each story's memories oldest first by when
   they happened — undated ones last, in the order they were written. */
export function treasuredByStory(stories) {
  return (stories || [])
    .map((story) => ({
      story,
      memories: (story?.memories || [])
        .filter(isTreasured)
        .map((m, i) => ({ m, i }))
        .sort((a, b) => yearOf(a.m) - yearOf(b.m) || a.i - b.i)
        .map(({ m }) => m),
    }))
    .filter((g) => g.memories.length);
}

export function treasuredCount(stories) {
  return (stories || []).reduce((n, s) => n + (s?.memories || []).filter(isTreasured).length, 0);
}
