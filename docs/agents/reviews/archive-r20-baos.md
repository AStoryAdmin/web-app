# Archive tidy, round 20 (Bao's Standard)

**PASS.**

- **Round 20's changes** match 17a as aligned in 2786e4b: hyphenated numbers, "billion", and the curly inch mark after a digit.
- **No cut is outside 17a's list.** Every string I tried keeps or loses exactly what (b) and (e) say. The one deviation keeps more than the text asks, which 17a does not count.
- **Live memories.** On all eight, every cut is on the list, said minus cuts equals shown, and the rendered words equal `cleanTranscript`.

## How I checked

- **Reading.** 17a (b) and (e) as of 2786e4b, and the 862fac7 diff of `transcript.ts`. The working tree matches HEAD for the archive files.
- **Tests.** `vitest run src/components/archive src/lib` passes: 9 files, 654 tests. `tsc --noEmit -p tsconfig.app.json` exits 0.
- **Strings.** I ran 862fac7's `transcript.ts` under Node 24.18 on:
  - the round-17 to round-19 strings;
  - new cases for this round's changes: hyphenated numbers, "billion", curly and straight inch and foot marks inside and outside quotations, and next words that start like a listed word but are not one ("ones", "oneself", "athletes", "theirs", "alls").
- **Live words.** In my own tab (tab-225), I loaded the account read-only with `loadAccount`. Each memory went through MemoryPage's path. Then I checked:
  - each cut against its rule;
  - the said text less the cuts against the shown text;
  - the rendered `.mv-para` text against `cleanTranscript` on all eight memory pages at 1366×768.
- **Layout.** No layout file changed, so I did not re-measure it. Rounds 15 and 16 were clean.

## 17a as of 2786e4b, checked

**(b): hyphenated numbers hedge, and "billion" is added.**
- These keep their "like":
  - "We paid, like, twenty-five dollars."
  - "We had, like, one-third left."
  - "We were, like, twenty-two."
  - "We had, like, thirty-something cousins."
  - "It cost, like, a billion."
  - "We had, like, billions."
  - "He, like, never came."
  - "We had, like, these."
- **Word boundaries hold.** "ones", "tenfold", "oneself", "athletes", "theirs" and "alls" are not read as listed words, so their "like" goes, as the list says.
- "another", "anything" and "everything" are not on the list, so their "like" goes too. That is on the letter.

**(e): a possessive ’ and an inch or foot mark are not quotation marks.**
- **Cut, as the list says** (no mark in the paragraph):
  - "The TV was 32” wide. Wow." (the curly inch mark after a digit is skipped);
  - "He was 5'6" tall. Wow.";
  - "The boys’ room was full. Wow.";
  - "Mom opened the letter. Wow.";
  - the paragraph after "He was 5’6” tall.".
- **Kept** (a real quotation is in the paragraph or still open):
  - "She said, “I’m 5’6”.” Wow."
  - "Mom said, “It was 32” wide. Wow. Huge.”" (the inch mark does not close the “)
  - `["He said, “It was 5’6”.", "Wow. We stayed.", "Then we left.”"]`
  - every round-17 to round-19 carry string: the possessive inside an open “, the stray ” before a “, and the possessive inside an open ‘ letter.

## Every live memory against its exact words

Unchanged, and every cut meets its rule. None of the paragraphs that lose a reaction holds a quotation mark.
- **342e4b40:** "Wait, were you?" and the "Yeah." after it (e).
- **59632e67:**
  - "Yeah, " after a statement (a-later).
  - "Yeah, right?" and "Wow, that's amazing." (e).
  - One "We asked" line, which matches the exact-reply shape.
- **f6a734be:**
  - The opening "Yeah, " (a-opening).
  - "Yeah, " and "So yeah, " after statements (a-later).
  - "That's awesome." (e).
- **0ced62a7, c21cf4d4, 459228bd:** nothing is cut.
- **beeedb62:** typed, so it is not tidied.
- **f9b0e6e9:** the labels go, and the AI's reply is "We asked", which is accepted.

On every piece, the said text less the cuts equals the shown text. The rendered body equals `cleanTranscript` on all eight memory pages at 1366. The takeaways are unchanged.

## For the lead (not counted)

- **A curly foot mark between digits still counts as a quotation mark, so the reaction stays.**
  - In "He was 5’6” tall. Wow.", the ” after a digit is skipped, but the ’ between "5" and "6" is not: the apostrophe test looks for letters on both sides, and digits are not letters. The paragraph then reads as holding a mark, and "Wow." stays.
  - 17a says that mark is not a quotation mark, so the list allows this cut and the code does not make it.

  It keeps more than the text, so it is not a defect: "a filler the list doesn't catch is not". To match the text exactly, skip a ’ between two digits.
- **Still on the letter, from round 19:** a possessive ’ before punctuation can close an open ‘ ("‘We went to the Nguyens’."). It needs a single-quoted quotation that runs across paragraphs.

## Not verified

- **Strings only.** The string cases are proven under Node only.
- **Layout** was not re-measured, since no layout file changed.
- **Not exercised:**
  - hover and focus states;
  - reduced motion;
  - the server tidy.

## Shared state

- **Archive view.** The stored view (`astory.archiveView`) was "list" at the start and is "list" now. I pressed nothing in the Archive.
- **Sign-in.** `astory-app-auth` is present and untouched. I did not sign out and wrote no data.
- **My tab.** My frames are removed and tab-225 is closed. I set no viewport.
- **Nhi's memory** was not opened.
