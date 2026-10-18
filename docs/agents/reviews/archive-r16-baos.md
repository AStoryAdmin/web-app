# Archive tidy, round 16 (Bao's Standard)

**FAIL, on two tidy defects.** No live memory triggers either one.

What passes:
- **Round 15.** Both of my round-15 defects are fixed for every string I reported. The round-15 skills gaps are closed.
- **17a after 19759fb.** The inch mark, the carry that needs a closing mark, and "any unit" all hold.
- **Live memories.** On every one, every cut is on the list. Said minus cuts equals shown, and the rendered words equal `cleanTranscript` at 320 and 1366.
- **Layout spot-check.** It is clean at 320 and 1366.
- **The "•••" button.** It sits inside the window at 320 on every memory page.

Two cuts are still outside 17a's text:
1. **(e)** A curly ’ after a letter closes a “ ” quotation, so a reaction later inside that quotation is cut. One example: `Mom said, “We stayed at the Nguyens’. Wow. It was big.”`.
2. **(b)** "A time or span" is a closed set in the code: midnight, noon, midday, "the/a whole …" and "all …". A hedging "like" before "last summer", "at sunrise", "at night", "tonight", "in the morning", "the next year", "that winter" or "a while" is still cut.

## How I checked

- **Reading.**
  - 17a as of 19759fb (with ec7c671 and 6c18b87 before it);
  - `archive-r15-skills.md`;
  - the 972d81a diff of `transcript.ts` and its test.

  The archive's source files in the working tree match HEAD. Other agents have uncommitted edits to fonts, `App.tsx`, `Wall.tsx` and `book-account.css`.
- **Tests.** `vitest run src/components/archive src/lib` passes: 9 files, 588 tests. `tsc --noEmit -p tsconfig.app.json` exits 0.
- **Strings.** I ran 972d81a's `transcript.ts` under Node 24.18 with `explain` on:
  - every string from archive-r15-baos.md and archive-r15-skills.md;
  - about 60 new strings aimed only at a cut outside the list or a change of meaning: quotation edges, inch marks, the carry, units and times.
- **Live words.** In my own tab (tab-215), I loaded the account read-only with `loadAccount`. Each memory went through MemoryPage's path (`paragraphsOf`, then `wasSpoken`/`soundsSpoken`, then `explainTranscript`). Then I checked:
  - each cut against its rule;
  - the said text less the cuts against the shown text;
  - the rendered `.mv-para` text against `cleanTranscript`.
- **Layout spot-check.** Only `transcript.ts` and its test changed in 972d81a, so I loaded these fresh in a same-origin frame at 320×700 (overlay scrollbar) and 1366×768:
  - Home, List and Prints;
  - all eight memory pages.

  I measured:
  - overflow at a 0.01px tolerance;
  - text under 12px, clipping and broken images;
  - targets under 44px;
  - each print against its cell, row level and typed words;
  - the rendered words;
  - where the "•••" button sits.

## Round 15, checked

**Bao's Standard, round 15: both defects fixed for the reported strings.**

| # | Round-15 defect | Now |
|---|---|---|
| 1 | A plural possessive closed a quotation | **Fixed before a space.** "“Our parents’ house. Wow. Big.”", "the kids’ room", "The kids’ toys" and "“Rock ’n’ roll. Wow. Yes.”" stand. A possessive before punctuation still closes one: that is defect 1 below. |
| 2 | Units | **Fixed.** "an acre", "a ton", "a hectare", "a foot", "a gallon", "a sack", "a century" and "a night" stand. |

**The skills review, round 15: both gaps closed.**

| # | Gap | Now |
|---|---|---|
| 1 | ‘The boys’ room’ / ‘the Nguyens’ house’ | **Closed.** Both stand. |
| 2 | Ten mutants | **Closed.** Each input behaves as the gap asks: «…», ‘It’s late’, 'We're home', a stray ”, the asked line's carry, "maybe, um, Lan", "Being, um, poor", the exact straight-quote takeaway, and the single-quoted tag question. |

## 17a as of 19759fb, checked

- **An inch mark after a digit never counts.** "He bought a 12" knife. Later Mom said, "Okay. Wow. Nice."" keeps "Wow.", and so does "The TV was 32" wide. Mom said, "Wow. That's amazing."". "He was 5'6" tall. Wow. That's amazing." loses both reactions, which is right: no quotation is open.
- **The carry needs a closing mark.**
  - `["He said, “We went.", "Wow. That's amazing.” Then we left."]` keeps both reactions.
  - `["He said, “We went.", "Wow. We stayed.", …]` cuts the "Wow.", because that paragraph holds no closing mark.
  - A stray "'90s" or 12" no longer switches (e) off for the rest of the text.
- **A curly ’ after a letter closes only before punctuation or the end.**
  - Before a space it never closes: "the boys’ room".
  - After `!`, `?`, `.` or a comma it closes: "She yelled ‘Go!’ Wow." loses the "Wow." outside the quotation, which is right.
- **"Any unit" and "times or spans".**
  - The units hold.
  - "At, like, midnight", "like, three o'clock", "like, the whole summer" and "like, all night" stand.
  - Other times do not: defect 2.
- **The cut before a closing mark leaves no space:** "«Wow. »" no longer appears.

## Every live memory against its exact words

Unchanged, and every cut meets its rule:
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

On every piece, the said text less the cuts equals the shown text. The rendered body equals `cleanTranscript` on all 16 memory-page loads (eight memories at 320 and 1366). The takeaways are unchanged.

## Defects

1. **(e) A curly ’ closes a “ ” quotation, so a reaction later inside it is cut.**
   - **Where:** `quotesAfter`, `transcript.ts`. One `curly` depth counts “ and ‘ together. A ’ after a letter and before punctuation (a plural possessive ending a sentence) therefore decrements an open “, though a ’ can only ever close a ‘.
   - **Sizes:** all.
   - **Evidence** (`cleanSpeech`, explain `e-reaction "Wow."`):
     - `Mom said, “We stayed at the Nguyens’. Wow. It was big.”` → `…“We stayed at the Nguyens’. It was big.”`
     - `“We visited the Vos’! Wow. Nice.”` → `“We visited the Vos’! Nice.”`
     - `“That was my parents’. Wow. Really.” He smiled.` → `“That was my parents’. Really.” He smiled.`
     - The same quotations with no possessive keep "Wow.", and so does `“Mom said ‘no’. Wow. Okay.”`, where a real ‘ is open.
   - **Rule:** 17a (e), "never inside quotation marks of any kind". The "Wow." sits between “ and ”. This cut is outside the list.
   - **Fix:**
     - Keep a separate depth for ‘ and ’. A ’ closes only when a ‘ is open (and then by the 17a rules); it never touches the “ ” depth. With no ‘ open, a ’ is always an apostrophe.
     - Mirror this in `breaksRule`.
     - Add the three strings, kept.

2. **(b) Only a closed set of times and spans keeps a hedging "like". 17a says "a time or span".**
   - **Where:** `LIKE_AMOUNT_NEXT`, `transcript.ts`:69. The time branch is `midnight|noon|midday`, "the/a whole …" and "all …". Clock times are covered through "o'clock" after a number.
   - **Sizes:** all.
   - **Evidence** (`cleanSpeech`, explain `b-like ", like,"`):
     - "We left, like, last summer." → "We left last summer."
     - "We arrived, like, at sunrise." → "We arrived at sunrise."
     - "We ate, like, at night." → "We ate at night."
     - "We came back, like, tonight." → "We came back tonight."
     - "We left, like, in the morning." → "We left in the morning."
     - "We moved, like, the next year." → "We moved the next year."
     - "We left, like, that winter." → "We left that winter."
     - "We stayed, like, a while." → "We stayed a while."

     Each turns a guess about when into a fact. This family's stories are full of these: the year they left, the night they crossed.
   - **Rule:** 17a (b), "before an amount, where it hedges: … a time or span (midnight, noon, three o'clock, the whole summer)". The examples are given as examples, not as the list. These cuts are outside it.
   - **Fix:**
     - Widen the time branch to the forms a life story uses:
       - `(?:last|next|that|this|the next|the following) (?:day|night|week|weekend|month|year|summer|winter|spring|fall|autumn|season|semester|term)`;
       - `(?:at|by|around|before|after) (?:dawn|dusk|sunrise|sunset|night|noon|midnight|daybreak)`;
       - `(?:in|during) the (?:morning|afternoon|evening|night|war|summer|winter|spring|fall|autumn)`;
       - `tonight|today|tomorrow|yesterday|a while|ages`.
     - Or keep ", like," before any time word from a small lexicon.
     - Mirror this in `breaksRule`, and add the eight strings.

## For the lead (not counted)

- **"Forever" is not a time or span on the letter.** "We waited, like, forever." → "We waited forever." This is hyperbole either way, so the meaning barely moves.
- **A capital after a closing quote.** "Inside “the kids’ room. Wow. Nice.” we said." shows "…Nice.” We said.": the tidy capitalises a sentence that starts after a quote's full stop. No word is cut, but "we" changes case. This happens with or without a cut.

## The layout spot-check, and the "•••" button

- **320×700 and 1366×768: clean on every page checked.** That covers Home, List, Prints and all eight memory pages:
  - nothing is past the right edge, even at a 0.01px tolerance;
  - no text is under 12px, nothing visible is clipped, and no image is broken;
  - no target is under 44px;
  - no print leaves its cell, every row is level, and no typed words are cut.
- **The "•••" button** (`.mv-tool.mv-more-btn`, "More") sits at 261.66–305.66px in a 320px window on all eight memories, 14.3px inside the edge. The 0.7px overflow from the round-14 note does not reproduce on this build, at rest with the overlay scrollbar. At 1366 it sits at 708.73–752.73 or 1185.77–1229.77, depending on the layout.

## Not verified

- **Strings only.** Both defects are proven on strings under Node only.
- **Layout.** I checked only 320 and 1366 this round, as briefed. 360 to 2560 passed in round 15, and no layout file has changed since.
- **The "•••" button** was not measured under the pane's own mobile emulation with a touch user agent, which may be where the round-14 0.7px came from.
- **Not exercised:**
  - hover and focus states;
  - reduced motion;
  - the server tidy.

## Shared state

- **Archive view.** The stored view (`astory.archiveView`) was "list" at the start and is "list" now. Each Prints check pressed Prints and then List with the page's own buttons.
- **Sign-in.** `astory-app-auth` is present and untouched. I did not sign out and wrote no data.
- **My helpers and tab.** My helper keys (`baos-r16*`) and my frames are removed. tab-215's viewport is reset to desktop, and the tab is closed.
- **Nhi's memory** was not opened.
