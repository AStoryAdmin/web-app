# Archive tidy, round 17 (Bao's Standard)

**FAIL, on one narrow defect.** No live memory triggers it.

What passes:
- **Round 16.** Both of my round-16 defects are gone under the new closed tests.
- **(b), the next-word list.** The code matches 17a's list word for word.
- **(e), within one paragraph.** The "no quotation mark in the paragraph" test holds on every single-paragraph string I tried.
- **Live memories.** On every one, every cut is on the list, said minus cuts equals shown, and the rendered words equal `cleanTranscript`.

**The defect is in (e)'s carry across paragraphs.** A plural possessive ’ is counted as a closing mark, so it cancels an open “. The quotation is still open, but the next paragraph is treated as clear, and its reaction is cut.

## How I checked

- **Reading.** 17a (a), (b) and (e) as of 3d16eea (from 7bf431a, a085c29 and 6d0cb51), and the 3d16eea diff of `transcript.ts` and its test. The working tree matches HEAD for the archive files.
- **Tests.** `vitest run src/components/archive src/lib` passes: 9 files, 624 tests. `tsc --noEmit -p tsconfig.app.json` exits 0.
- **Strings.** I ran 3d16eea's `transcript.ts` under Node 24.18 with `explain` on:
  - every string from archive-r16-baos.md;
  - about 50 new strings aimed only at a cut outside 17a's new tests or a change of meaning.

  For (e), the new strings covered marks inside and at the edge of words, inch marks, a dash before a quote, and quotations that run across paragraphs. For (b), they covered next words on and off the list.
- **Live words.** In my own tab (tab-220), I loaded the account read-only with `loadAccount`. Each memory went through MemoryPage's path (`paragraphsOf`, then `wasSpoken`/`soundsSpoken`, then `explainTranscript`). Then I checked:
  - each cut against its rule;
  - the said text less the cuts against the shown text;
  - the rendered `.mv-para` text against `cleanTranscript` on all eight memory pages at 1366×768.
- **Layout.** No layout file changed in 3d16eea, and round 16's spot-check at 320 and 1366 was clean, so I did not repeat it.

## Round 16, checked

| # | Round-16 defect | Now |
|---|---|---|
| 1 | A curly ’ closed a “ ” quotation | **Fixed within a paragraph.** "Mom said, “We stayed at the Nguyens’. Wow. It was big.”" and "“We visited the Vos’! Wow. Nice.”" stand: a paragraph with any quotation mark keeps its reactions. The same miscount survives across paragraphs (the defect below). |
| 2 | Times and spans | **Fixed.** "last summer", "at sunrise", "at night", "tonight", "in the morning", "the next year", "that winter", "a while" and "forever" all keep their "like". The next word is on the list. |

## 17a as of 3d16eea, checked

**(b): the next word alone decides.**
- `LIKE_HEDGES_NEXT` holds exactly 17a's list: digits, the number words, teens, ordinals, and every word from "a" to "sunset", including the six times of day added this round.
- "like" stays before a dog, a story, home (via the be/go/say rule), nothing, twice, the best and ten hours.
- "like" goes before "loved", "so", "rice", "never", "right", "there" and "knew". None of those is on the list, so each cut is on the letter.
- The quoting, feeling and ?/! exceptions are unchanged and hold.

**(e): only a paragraph with no quotation mark, and none left open before it.**
- Every one of these single-paragraph strings stands, because each has a mark:
  - "She said—'Wow. That's it' and left."
  - "He said 'go home'. Wow."
  - "(‘Wow.’) Wow."
  - "The boys’ room. Wow."
  - "Rock ’n’ roll. Wow."
  - "Back in the '90s. Wow."
  - "She said "go". Wow."
  - "We were all 'Wow.' Wow."

  "The boys’ room", "Rock ’n’ roll" and "'90s" keep more than they need to, which 17a allows ("when in doubt the words stay").
- With no mark, the reaction goes, as the list says:
  - "It’s ours. Wow." (an apostrophe inside a word);
  - "He was 5'6" tall. Wow." and "The TV was 32" wide. Wow." (inch marks after a digit);
  - "Mom opened the letter. Wow. That was all she said."
- **Across paragraphs:**
  - `["He said, “We went.", "Wow. We stayed.", "Then we left.”"]` keeps the middle "Wow.".
  - `["He said, “We went.”", "Wow. We stayed."]` cuts it, which is right: the quotation closed.
  - A letter quoted in ‘…’ or '…' across three paragraphs keeps its "Wow.".
  - An asked line inside an open quotation keeps its reaction.

## Every live memory against its exact words

Unchanged, and every cut meets its rule. None of the paragraphs that lose a reaction holds a quotation mark, and none follows an open one.
- **342e4b40** (3 paragraphs): "Wait, were you?" and the "Yeah." after it (e).
- **59632e67** (2 paragraphs):
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

No live text holds ", like,". On every piece, the said text less the cuts equals the shown text. The rendered body equals `cleanTranscript` on all eight memory pages at 1366. The takeaways are unchanged.

## Defect

1. **(e) A plural possessive ’ counts as a closing mark, so it cancels an open “. A reaction in the next paragraph, still inside the quotation, is cut.**
   - **Where:** `quoteMarks`, `transcript.ts`.
     - A curly ’ that is not between two letters and not at a word's start adds to `closes`.
     - `reactionsAllowed` keeps one running count, `opens − closes`, for all kinds of mark together.
     - So "boys’" (or "Nguyens’.") closes the “ that opened the paragraph, and the count drops to 0. The quotation actually closes two paragraphs later.
   - **Sizes:** all.
   - **Evidence** (`explainTranscript`):
     - `["He said, “We went to the boys’ room.", "Wow. We stayed.", "Then we left.”"]`: the second paragraph shows "We stayed." (e-reaction "Wow.").
     - `["He said, “We went to the Nguyens’.", "Wow. We stayed.", "Then we left.”"]`: the same cut.
     - Without the possessive, `["He said, “We went.", "Wow. We stayed.", "Then we left.”"]` keeps "Wow.".
   - **Rule:** 17a (e): reactions go "nor in any paragraph after one whose marks are left open, until a paragraph that closes them", and "when in doubt the words stay". The “ is still open, because a ’ can only close a ‘, never a “.
   - **Fix:**
     - Count each kind of mark separately: “ against ”, « against », ‘ against ’, and the straight " and '.
     - Let a ’ reduce only an open ‘; with no ‘ open, it changes nothing.
     - A paragraph is clear only when every count is zero.
     - Add both strings to the transcript fixtures, with "Wow." kept.

## For the lead (not counted)

- **"never" is not on (b)'s list, though "always" is.**
  - "He, like, never came." → "He never came."
  - "She, like, always cooked." stands.

  "Like never" often means "almost never", so the cut can make a hedge absolute. The code follows the list exactly, so this is a ruling question. Adding "never", and perhaps "everyone", "everything" and "no one", would make the pair symmetric.
- **"I sort of, like, knew." → "I sort of knew."** This is on the letter: "sort of" counts only after be, go, say or think.

## Not verified

- **Strings only.** The defect is proven on strings under Node only.
- **Layout** was not re-measured this round, since no layout file changed.
- **Not exercised:**
  - hover and focus states;
  - reduced motion;
  - the server tidy.

## Shared state

- **Archive view.** The stored view (`astory.archiveView`) was "list" at the start and is "list" now. I pressed nothing in the Archive this round.
- **Sign-in.** `astory-app-auth` is present and untouched. I did not sign out and wrote no data.
- **My tab.** My frames are removed and tab-220 is closed. I set no viewport.
- **Nhi's memory** was not opened.
