# Archive tidy, round 18 (Bao's Standard)

**FAIL, on one contrived input; the fix is one line.** No live memory comes near it.

What passes:
- **Round 17.** My round-17 defect is fixed: double and single marks are now counted apart.
- **"never".** It is on (b)'s list in 17a and in the code.
- **Live memories.** On every one, every cut is on the list, said minus cuts equals shown, and the rendered words equal `cleanTranscript`.

**What remains.** A paragraph's marks are netted as a whole, not counted in order. So a stray closing mark before a real opening one cancels it. The paragraph's “ is left open, yet the next paragraph is treated as clear, and its reaction is cut.

## How I checked

- **Reading.** 17a (b) and (e) as of 7cbe288, and the 7cbe288 diff of `transcript.ts` and its test. The working tree matches HEAD for the archive files.
- **Tests.** `vitest run src/components/archive src/lib` passes: 9 files, 627 tests. `tsc --noEmit -p tsconfig.app.json` exits 0.
- **Strings.** I ran 7cbe288's `transcript.ts` under Node 24.18 on:
  - the round-17 strings;
  - every (e) case from rounds 15 to 17;
  - new multi-paragraph cases: possessives inside double and single quotations, nested ‘…’ inside “…”, guillemets, a stray mark, and quotations that close and reopen.
- **Live words.** In my own tab (tab-221), I loaded the account read-only with `loadAccount`. Each memory went through MemoryPage's path. Then I checked:
  - each cut against its rule;
  - the said text less the cuts against the shown text;
  - the rendered `.mv-para` text against `cleanTranscript` on all eight memory pages at 1366×768.
- **Layout.** No layout file changed, so I did not re-measure it.

## Round 17, checked

| # | Round-17 defect | Now |
|---|---|---|
| 1 | A possessive ’ closed an open “ for the next paragraph | **Fixed.** `["He said, “We went to the boys’ room.", "Wow. We stayed.", "Then we left.”"]` and the "Nguyens’." version both keep "Wow.". A ’ now changes only the single count. |
| Lead note | "never" missing from (b) | **Added.** "He, like, never came." stands, as "She, like, always cooked." does. |

## 17a as of 7cbe288, checked

**(e): double and single marks counted apart, and a ’ only ever closes a ‘.**
- **Kept** (a mark is in the paragraph, or a quotation is still open):
  - "He said, “We went. / Wow. We stayed. / Then we left.”"
  - "«We went. / Wow. … / …»"
  - a letter quoted in ‘…’ or '…' across three paragraphs;
  - "He said, “Mom said ‘no’. / Wow. We stayed. / Then we left.”" (the single pair closes, the double stays open);
  - "She said, “Our kids’ toys, / Wow. That's amazing. / were everywhere.”";
  - "Back in the '90s we moved. / Wow." (when in doubt the words stay);
  - the asked line inside an open quotation.
- **Cut, as the list says** (no mark, and nothing left open):
  - "He said, “We went.” / Wow. We stayed.";
  - "…She said “go”. / Wow. We left.";
  - "Mom opened the letter. Wow.";
  - "It’s ours. Wow." (an apostrophe inside a word);
  - "He was 5'6" tall. Wow." (an inch mark).

**(b).** The code's list matches 17a word for word, "never" included. The other strings behave as in round 17.

## Every live memory against its exact words

Unchanged, and every cut meets its rule. None of the paragraphs that lose a reaction holds a quotation mark. Only f9b0 has marks, and it loses no reaction.
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

## Defect

1. **(e) A paragraph's marks are summed, not counted in order, so a stray closing mark cancels a real opening mark after it.**
   - **Where:** `quoteMarks` and `reactionsAllowed`, `transcript.ts`.
     - `quoteMarks` returns each paragraph's net `double` and `single`.
     - `reactionsAllowed` adds the net to the running count and clamps at zero only afterwards.
     - A ” before a “ in the same paragraph therefore nets to 0, though the “ is left open at the paragraph's end.
   - **Sizes:** all.
   - **Evidence:** `["Mom said ” ok. He said, “We went.", "Wow. We stayed.", "Then we left.”"]`. The second paragraph shows "We stayed." (e-reaction "Wow."), though it sits inside “We went. … Then we left.”.
   - **Rule:** 17a (e): reactions never go "in any paragraph after one whose marks are left open, until a paragraph that closes them", and "when in doubt the words stay".
   - **How likely:** it needs a stray closing mark typed before a real quotation in the same paragraph. That is close to impossible in a spoken transcript, but it is outside the list as written.
   - **Fix:** in `quoteMarks`, walk the marks in order from the carried count and clamp at zero after each close, rather than netting the paragraph. Mirror this in the checker, and add the string with "Wow." kept.

## For the lead (not counted)

- **A possessive ’ inside an open ‘…’ closes it, as the text allows, and the next paragraph can lose a reaction:**
  - `["He wrote, ‘Dear Mom, the boys’ room is cold.", "Wow. It's cold here.", "Love, Lan.’"]` → the second paragraph shows "It's cold here.".

  17a says "a ’ only ever closes a ‘", and a ‘ is open here, so this is on the letter. But the letter is still open. If you want this kept too: a ’ after a letter and before a space or a letter is a possessive and never closes. That was round 15's rule, and it would only ever keep more.

## Not verified

- **Strings only.** The defect is proven on strings under Node only.
- **Layout** was not re-measured, since no layout file changed.
- **Not exercised:**
  - hover and focus states;
  - reduced motion;
  - the server tidy.

## Shared state

- **Archive view.** The stored view (`astory.archiveView`) was "list" at the start and is "list" now. I pressed nothing in the Archive.
- **Sign-in.** `astory-app-auth` is present and untouched. I did not sign out and wrote no data.
- **My tab.** My frames are removed and tab-221 is closed. I set no viewport.
- **Nhi's memory** was not opened.
