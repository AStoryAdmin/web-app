// A year out of what somebody actually said.
//
// People date their own lives by age far more often than by year — "when I
// was twenty", "in my thirties" — and with a birth year on the story that is
// just as good as a date. It's the difference between a call transcript
// landing in 1965 and landing in the undated pile at the end of the archive.
//
// An explicit year always wins. An age is only read when the story knows when
// they were born, and anything less solid than those two returns null: a
// wrong year files a memory in the wrong decade and prints it in the wrong
// chapter of the book.

import { parseYear } from "./timeline.js";

// Ages spoken as words.
const AGE_WORDS = {
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
};

// "in my thirties" — the start of that decade of a life, the same way "the
// 1930s" anchors on 1930.
const DECADE_WORDS = {
  teens: 13,
  twenties: 20,
  thirties: 30,
  forties: 40,
  fifties: 50,
  sixties: 60,
  seventies: 70,
  eighties: 80,
};

// "when I was", "when she was", "aged", "at the age of".
const AGE_LEAD = String.raw`(?:when (?:i|he|she|they) w(?:as|ere)|aged?|at the age of)`;
const AGE_NUMERIC = new RegExp(String.raw`\b${AGE_LEAD}\s+(\d{1,3})\b`);
const AGE_WORD = new RegExp(String.raw`\b${AGE_LEAD}\s+([a-z]+)\b`);
const LIFE_DECADE = /\bin (?:my|his|her|their)\s+([a-z]+)\b/;

export function yearFromText(text, story) {
  const explicit = parseYear(text);
  if (explicit != null) return { year: explicit, from: "year" };

  const birth = parseYear(story?.birthYear);
  if (!birth || !text) return null;
  const said = String(text).toLowerCase();

  const numeric = said.match(AGE_NUMERIC);
  if (numeric) {
    const age = Number(numeric[1]);
    if (age >= 0 && age <= 110) return { year: birth + age, from: "age", age };
  }

  const worded = said.match(AGE_WORD);
  if (worded && AGE_WORDS[worded[1]] != null) {
    const age = AGE_WORDS[worded[1]];
    return { year: birth + age, from: "age", age };
  }

  const decade = said.match(LIFE_DECADE);
  if (decade && DECADE_WORDS[decade[1]] != null) {
    const age = DECADE_WORDS[decade[1]];
    return { year: birth + age, from: "age-decade", age };
  }

  return null;
}
