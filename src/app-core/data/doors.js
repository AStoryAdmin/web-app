// The everyday doors into the question bank.
//
// The book's chapters are the right table of contents and the wrong front
// door: "The world we lived through" is where an answer lands, not what a
// person on a Tuesday wants to be asked. These eight are the doors a person
// actually walks through — the house, the food, the parents, the big days —
// each filed into the chapters its answers belong to, so the book still
// assembles itself and no new machinery is needed. The lead's TestFlight
// note ("the starting questions feel broad; it needs more practical
// chapters") is what this answers.
//
// Each door names the three questions in the bank that open it, shallowest
// first. They were chosen by hand: a scene somebody can walk into, nothing
// sensitive, nothing that asks what a life meant. After the first answer
// the bank's own follow-ups and depth ladder take over.
//
// Pure data, no imports — like data/eras.js, so the pure libs and their
// tests can reason about doors without dragging anything in behind them.

export const DOORS = [
  {
    id: "door-house",
    title: "The house you grew up in",
    chapters: ["Childhood"],
    questions: ["child-house-walk", "child-kitchen-smell", "roots-street"],
  },
  {
    id: "door-food",
    title: "Food and the kitchen",
    chapters: ["Childhood", "Anything else"],
    questions: ["child-weeknight-dinner", "child-treat", "else-recipe"],
  },
  {
    id: "door-parents",
    title: "Your parents",
    chapters: ["Where we come from"],
    questions: ["open-parents-did", "roots-parents-born", "roots-taught-hands"],
  },
  {
    id: "door-school",
    title: "School and friends",
    chapters: ["Childhood", "Growing up"],
    questions: ["child-walk-school", "child-first-friend", "child-teacher-still"],
  },
  {
    id: "door-jobs",
    title: "First jobs and money",
    chapters: ["Growing up", "Work & making a living"],
    questions: ["child-first-money", "grow-first-job", "grow-first-wage"],
  },
  {
    id: "door-big-days",
    title: "Big days and holidays",
    chapters: ["Love & family", "Anything else"],
    questions: ["faith-feast", "else-custom-baby", "else-custom-wedding"],
  },
  {
    id: "door-moves",
    title: "Moving and new places",
    chapters: ["The world we lived through", "When everything changed"],
    questions: ["turn-moves", "world-first-day-new", "grow-city"],
  },
  {
    id: "door-songs",
    title: "Songs, sayings and jokes",
    chapters: ["Anything else"],
    questions: ["else-saying", "else-song", "else-family-joke"],
  },
];

/* A door's questions, found in a rendered prompt list (either voice) and
   kept in the door's own order. A question already answered, or missing
   from this voice, simply isn't there — a door with nothing left behind it
   returns []. In the relative's voice a relay (`askThem`, "What has Rose
   told you about the house?") is not a door either: it asks for the
   storyteller's memory, and handing it to a relative as a way in is the
   thing the ask-them tag exists to stop. `answered` is a Set of memory
   titles (questionVoice.js answeredTitles). */
export function doorQuestions(door, prompts, answered = new Set()) {
  const byId = new Map((prompts || []).map((p) => [p.id, p]));
  return (door?.questions || [])
    .map((id) => byId.get(id))
    .filter(
      (p) =>
        p?.question &&
        !p.askThem &&
        !answered.has(p.question.trim()) &&
        !(p.alt && answered.has(p.alt.trim()))
    );
}

/* The doors that still have at least one unanswered question in this
   voice, each with what's behind it. What the pickers list. */
export function openDoors(prompts, answered = new Set()) {
  return DOORS.map((door) => ({
    ...door,
    items: doorQuestions(door, prompts, answered),
  })).filter((d) => d.items.length);
}
