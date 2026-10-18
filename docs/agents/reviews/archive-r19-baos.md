# Archive tidy, round 19 (Bao's Standard)

**PASS.** The tidy now does what 17a says, case for case.

- **Round 18.** My round-18 defect is fixed, and so is the round-18 lead note.
- **Strings.** Every string I tried against 17a (e) and (b) as of 7c5006a behaves as the text says.
- **Live memories.** On all eight, every cut is on the list, said minus cuts equals shown, and the rendered words equal `cleanTranscript`.

One ruling-level case is left for the lead below; it is on the letter.

## How I checked

- **Reading.** 17a (b) and (e) as of 7c5006a, and the 7c5006a diff of `transcript.ts`. The working tree matches HEAD for the archive files.
- **Tests.** `vitest run src/components/archive src/lib` passes: 9 files, 629 tests. `tsc --noEmit -p tsconfig.app.json` exits 0.
- **Strings.** I ran 7c5006a's `transcript.ts` under Node 24.18 on:
  - the round-17 and round-18 strings;
  - the (e) cases from rounds 15 to 18;
  - new cases aimed at the two changes:
    - marks walked in order from the carried count, with clamping;
    - a ’ after a letter before a space counting as an apostrophe.

  The new cases included a closing ’ before a space, a ’ used as an opening mark, a straight " after a number inside a quotation, guillemets that close and reopen, and nested single quotes inside double.
- **Live words.** In my own tab (tab-222), I loaded the account read-only with `loadAccount`. Each memory went through MemoryPage's path. Then I checked:
  - each cut against its rule;
  - the said text less the cuts against the shown text;
  - the rendered `.mv-para` text against `cleanTranscript` on all eight memory pages at 1366×768.
- **Layout.** No layout file changed, so I did not re-measure it. Rounds 15 and 16 were clean.

## Round 18, checked

| # | Round 18 | Now |
|---|---|---|
| Defect | A stray ” before a real “ cancelled it | **Fixed.** `["Mom said ” ok. He said, “We went.", "Wow. We stayed.", "Then we left.”"]` keeps "Wow.". The walk clamps the stray close at zero, then counts the open. |
| Lead note | A possessive ’ inside an open ‘…’ closed it | **Fixed before a space.** `["He wrote, ‘Dear Mom, the boys’ room is cold.", "Wow. It's cold here.", "Love, Lan.’"]` keeps "Wow.". |

## 17a (e) as of 7c5006a, checked

- **Kept** (a mark is in the paragraph, or a quotation is still open):
  - "‘Wow’ she said. Wow." The closing ’ before a space is skipped, but the opening ‘ marks the paragraph.
  - "He said ’Wow. That's it’ and left."
  - "Mom said, “We stayed at the Nguyens’. Wow. It was big.”"
  - "She said, ‘Okay. The boys’ room was full. Wow. That’s amazing.’"
  - "Rock ’n’ roll. Wow."
  - "He said "We paid 50" and left. Wow."
  - Across paragraphs: the “…” versions with "boys’ room" and "Nguyens’."; "“Mom said ‘no’." with the double still open; the «…» pair; "‘Wow’ she said." and ""We paid 50"" (each leaves a mark open, so the next paragraph keeps its words); the asked line inside an open quotation.
- **Cut, as the list says** (no mark, and nothing left open):
  - "The boys’ room was full. Wow." (the ’ is an apostrophe, as the lead ruled);
  - "It’s ours. Wow.";
  - "He was 5'6" tall. Wow.";
  - "Mom opened the letter. Wow.";
  - "He said, “We went.” / Wow. We stayed.";
  - the paragraph after "…Then.»".

None of these removes a reaction that sits inside an open quotation.

**(b)** is unchanged from round 18: the next word alone decides, "never" included. "He, like, never came." stands, and "We, like, loved it." loses its "like", as the list says.

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

- **A possessive ’ before punctuation still closes an open ‘, as the text says.**
  - `["He wrote, ‘We went to the Nguyens’.", "Wow. It's cold here.", "Love, Lan.’"]` → the middle paragraph loses "Wow.", though the letter is still open.
  - 17a's "a ’ only ever closes a ‘, and never after a letter before a space" allows this close.

  This needs a single-quoted quotation that runs across paragraphs and has a plural possessive at a sentence's end, so it is very rare. Telling that ’ from a real close needs more than punctuation, so I would leave it unless you want every ’ after a letter treated as an apostrophe. That would only ever keep more.

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
- **My tab.** My frames are removed and tab-222 is closed. I set no viewport.
- **Nhi's memory** was not opened.
