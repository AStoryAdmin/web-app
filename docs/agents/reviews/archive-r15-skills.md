# Skills Steward: the Archive, the memory page, and Home's prints, round 15

**Verdict: GAPS.** One ugly gap and one polish gap.

What passes:
- **Tests and types.** `vitest run src/components/archive src/lib` passes: 9 files, 535 tests. `tsc --noEmit -p tsconfig.app.json` exits 0.
- **My round-14 gaps.** Seven of the eight are closed in full. Gap 2 is closed except for one case, which is gap 1 below.
- **Bao's round-14 defect** is closed for straight single quotes, curly single quotes and guillemets, with the same one case left.
- **The batched fit.** On every page at every size I measured, from 320 to 2560:
  - prints sit level in their cells;
  - no words are clamped, and nothing overlaps;
  - nothing scrolls sideways.
- **The measured running head** never clips or overlaps, at any size I measured from 320 to 2560, with "The Vo book" or with a long book name.

What does not pass:
- **Ugly: a plural possessive closes a curly single quotation.** In "the boys’ room" inside ‘…’, the ’ ends the quotation early, so a later "Wow." inside it is cut.
- **Polish: 10 mutants that would make a cut or a lift the list forbids still pass the suite.** Each needs one input.

## How this was checked

- **Read:**
  - 17a as it stands after 4d9630c and 6c18b87;
  - archive-r14-baos.md and my own archive-r14-skills.md;
  - the whole of 30d1997: `transcript.ts` and its test, `PrintCard.tsx`, `atmosphere.ts`, `astory.css` and `archive-reading.css`.

  Against 30d1997, the working tree differs only in `book-account.css`, which is not mine to review.
- **Skills held to:**
  - hallmark responsive: 320, 375, 414 and 768;
  - impeccable craft-floor: "fix what overflows";
  - gsap-performance: "Batch Reads and Writes";
  - emil-design-eng, for the crossfade.
- **Strings:** I ran 30d1997's `transcript.ts` under Node 24.18 on about 45 new strings, aimed at the quote tracker, the carry across paragraphs, the be/have list, the like-before-? rule, the amounts and `ASKER_GOES_ON`.
- **Mutants:** 88, run against a copy of the real suite in `scratchpad/mut15`, using a junction to `node_modules` that I removed afterwards:
  - my 56 from round 14, rewritten where the code moved, less the five list-window mutants whose code is gone;
  - 31 new ones:
    - V1–V11: `quotesAfter`;
    - W1–W4: the carry across paragraphs;
    - X1–X10: the be/have list;
    - Y1–Y7: like before ? or !, and the amounts;
    - Z1–Z5: `ASKER_GOES_ON`;
  - one control with the code unchanged.
- **Browser:** in my own tab (tab-207), I loaded each page fresh in a same-origin frame at each size:
  - 320, 360, 375, 390, 414, 480 and 560, with mobile emulation and overlay scrollbars;
  - 800, 1366 and 1920;
  - 2560, where html zoom is 1.3.

  I stepped GSAP and ScrollTrigger, finished CSS animations, and measured:
  - every print on the Archive (Prints) and on Home: its cell, frame ratio, row level, `.said` size, clamp, the gap from the words to the caption's text, and the cue against the frame and the words;
  - the fit's own sum against each frame's real height;
  - the running head on f9b0, at the top and in "What the family remembers", with "The Vo book" and with "Nguyen Thi Minh Khai’s book" (255px).

## Round 14, checked

| # | r14 skills gap | Now |
|---|---|---|
| 1 | Words ran into the caption at 360–365 | **Closed.** Up to 760px a typed print stacks the cue, the words and the caption in the flow. The smallest gap from the words to the caption's text is 13px at 320, 360 and 375; 25 at 390; 41 at 414; 120 at 480; 191 at 560. From 800 to 2560 it is 55px or more. |
| 2 | Reactions cut inside single quotes or guillemets | **Closed except gap 1.** These all keep "Wow.": `'Okay. Wow. That's amazing.'`, `‘Okay. Wow. That’s amazing.’`, `«Wow. That's amazing.»`, `'We went to the Nguyens' house. Wow…'`, `'We were goin' home. Wow…'`, and a quotation carried across a paragraph break. |
| 3 | A possessive 's read as "be" | **Closed.** "We ate at Lan's, um, Mai's, and Hoa's." → "We ate at Lan's, Mai's, and Hoa's." "There's, um, Lan…" still loses both commas, as 17a allows. |
| 4 | The fit left out the cue | **Closed.** `fitNeed` counts the cue when it is in the flow, and the fit's sum matches the real frame height: c21c at 320 needs 245 and is 244 tall; beee needs 162 against 164 of room and is exactly 3:4. The effect now depends on the words, the cue, the date and the chapter. |
| 5 | Forced layouts per card | **Closed** (read in the code; I could not time it). `fitPass` (`PrintCard.tsx`:105) writes each step to every waiting print and then reads them all, so it costs at most four layouts in all. One microtask, one `ResizeObserver` and one media query start a pass. |
| 6 | The running head clipped with a long book name | **Closed.** See the table below. |
| 7 | More amounts | **Closed.** These keep their "like": "in, like, fourth grade", "like, nothing", "like, about ten dollars" and "like, a second time". "Like, about everything" and "like, under the bridge" are still cut, as 17a allows. |
| 8 | Eleven surviving mutants | **8 of the 11 now fail.** T42, U20 and U23 still survive (gap 2). |

**Bao's r14 defect** (single-quoted reactions) is closed. The one form it still takes is gap 1.

### The running head, measured

Each cell shows the labels on screen at that width. No label is clipped, outside the band, or overlapping another.

| Width | "The Vo book", top | "The Vo book", in section | Long name, top | Long name, in section |
|---|---|---|---|---|
| 320 | book + Archive | section alone (`tight`) | Archive alone (`tight-page`) | section alone |
| 360 / 375 / 390 | book + Archive | section alone | 360: Archive alone; 375 and 390: book 20–255 + Archive | section alone |
| 414 | book + Archive | book 20–121 + section 163–394 | book + Archive | section alone |
| 480 | book + Archive | book + section 229–460 | book 20–255 + Archive 395–460 | section alone |
| 560 | book + Archive | book + section | book + Archive | book 20–255 + section 309–540 |
| 800 | book + Archive | book + section | book 28–302 + Archive 682–757 | book + section 490–757 |
| 1366 / 1920 / 2560 | book + Archive, with 900px or more between them | not reached in my frames | the same | not reached |

## The mutation harness: 88 run, 64 fail, 24 survive (10 counted)

**The new mutants:**
- **These fail:**
  - V1, V4, V6: ‘ not counted; a straight ' opening anywhere or never;
  - W1, W3, W4: the carry;
  - X3–X6, X8, X9: the be/have forms and the comma choice;
  - Y1, Y2, Y4–Y6: like before ?/!, and the amounts;
  - Z1, Z2: `ASKER_GOES_ON`.
- **Survivors that make a forbidden cut or lift (counted, 7):**
  - V2: « not counted;
  - V3: ’ closes after any letter;
  - V5: a straight ' closes anywhere;
  - V10: the depth may go below zero;
  - W2: the asked line ignores the carry;
  - X7: the be/have test without a word boundary;
  - X10: "being" and "having" added to the list.
- **Survivors that only keep more, or are equivalent (not counted, 9):**
  - V7, V8 and V11: closes counted less;
  - V9: ‘ after a letter opens;
  - X1 and X2: forms dropped, so a comma stays;
  - Y3: a sentence holds no second end;
  - Y7: about + anything;
  - Z3: "and" dropped, which lifts less.
- **Z4 and Z5** add "my" and "I" to the asker's going-on, or drop its word boundary. 17a forbids only an opening first-person word, so neither is counted.

**Carried from round 14:**
- Still survive, counted: T42, U20 and U23.
- Still survive, not counted: U21 and U22.
- Everything else fails, including R29, N21, N26, N31, U2, U18, U24, U25, U26 and U31.

**The control** survives, as it should.

## Gaps

### Ugly

1. **A plural possessive closes a curly single quotation, and the reaction after it inside the quotation is cut.**
   - **Rules:**
     - 17a (e): "never inside quotation marks of any kind … so an apostrophe never counts";
     - Bao's r14 defect.
   - **Where:** `quotesAfter`, `transcript.ts`:98. It closes ’ on `/\p{L}/u.test(prev) && !/\p{L}/u.test(next)`: after a letter and before a space. That is also exactly how a plural possessive is written.
   - **Evidence** (`cleanSpeech`, explain `e-reaction "Wow."`):
     - `She said, ‘Okay. The boys’ room was full. Wow. That’s amazing.’` → `She said, ‘Okay. The boys’ room was full. That’s amazing.’`
     - `She said, ‘We went to the Nguyens’ house. Wow. That’s amazing.’` → "Wow." cut.

     The same string in straight quotes keeps "Wow.", because a straight ' closes only after . ! ? or a comma.
   - **Change:**
     - After a letter, let ’ close only when the next thing is punctuation or the end: `/\p{L}/u.test(prev) && /^\s*(?:[,.;:!?)—–]|$)/u.test(text.slice(i + 1))`.
     - Otherwise it is an apostrophe and changes nothing. That keeps more ("‘Wow’ she said" stays open), which is safe.
     - Mirror this in `breaksRule`, and add both strings to the keep list.

### Polish

2. **Ten mutants that would make a forbidden cut or lift pass the suite. Each needs one input.**
   - **Rules:** the brief, "every mutant fails"; 17a, "the tests check every cut against its rule".

     | Mutant | Add |
     |---|---|
     | V2 (« not counted) | `He said, «Okay. Wow. That's amazing.» And left.` kept |
     | V3 (’ closes after any letter) | `She said, ‘Okay. It’s late. Wow. That’s amazing.’` kept |
     | V5 (' closes anywhere) | `She said, 'We're home. Wow. That's amazing.'` kept |
     | V10 (depth below zero) | `I said ” then. She said, “Okay. Wow. That's amazing.”` kept |
     | W2 (asked line ignores the carry) | `["Interviewer: He said, “Okay.", "Interviewer: Wow. That's amazing.” Did he?"]` keeps "Wow." (it does today; no test holds it) |
     | X7 (no word boundary) | "It was maybe, um, Lan, Mai and Hoa." → "It was maybe, Lan, Mai and Hoa." |
     | X10 (being / having) | "Being, um, poor, hungry, we left." → "Being, poor, hungry, we left." (17a's be list has no "being") |
     | T42, U23 | `expect(takeaway(said)).toBe("I remember she said, 'I will always love you, my dear little one.'")`, exact, without the "I remember" filter |
     | U20 | "'Was it good, right?' Because our school was small. Yes." is not lifted |

## For the lead (not counted)

- **The cue now takes two lines on every phone.** The family record gives "Bao Ngo Gia" as the given name, so the short cue reads "New from Bao Ngo Gia":
  - 37px tall, from 320 to 414;
  - one line from 480;
  - at 320 it grows c21c to 1.98:1, where round 14's "New from Bao" gave 1.87.

  This is what 17a and the code ask for (the given name, from the family), so the record decides. If "Bao" is meant, the record or the rule is where to change it.
- **One stray quote mark turns (e) off for the rest of the transcript,** because the state now carries across paragraphs. An inch mark ("5'6\"", "32\" wide") leaves a quotation open, and every later "Wow." stays. This keeps more, which is safe, but a single typo now reaches every later paragraph.
- **The lift still takes questions whose going-on is plainly the teller,** since 17a forbids only a first-person opening word:
  - "Did they like it? Because we want to know. Yes."
  - "Did they like it? And our kids loved it. Yes."
- **With a long book name, the top of the page at 320–360 shows only the page's name.** The book's name steps aside (`tight-page`). Nothing is clipped, but at that width the band no longer says whose book it is.
- **Entering the family section in `tight`,** the section's name fades in over the fading book's name for about 60ms. The CSS timings are unchanged from round 14. There is no ellipsis.

## Clean on this pass

- **Prints:**
  - Rows are level at every size: 2 columns of 123/143/151/158/170/203/243px from 320 to 560; 3 × 225 at 800; 4 × 250 at 1366; 4 × 363 at 1920; 4 × 472 at 2560.
  - `scrollWidth` equals the width under mobile emulation, and is width − 15 (the classic scrollbar) on desktop.
  - The cue is clear of the words: by 14px on phones, 12px on desktop and 16px at 2560.
- **The fit's steps:** at 320 they run 13, 13.5 and 15px; at 360, 13 and 15px. A print grows only when its sum at 13px exceeds 3:4 (c21c: 245 against 164).
- **Reduced motion:** the `tight` and `tight-page` fades have a `transition: none` rule. Nothing else animates.
- **The asker's going-on:** "We want to know." without "Because" is no longer lifted.
- **Like before ? or !:** "I was standing there, like, what is going on?", "We were there, like, what, two years?" and "She looked at me, like, get out!" all keep their "like".

## Not verified

- **The time a fit pass takes.** It is read from the code: the pane draws no frames, so `ResizeObserver` and media-query change events never fired, and resizing could not be watched live.
- **The running head's section state at 1366, 1920 and 2560.** My frames never reached "in section" there (the page is barely taller than the frame). The band is over 900px wider than both labels together, so they cannot meet.
- **The live words** of the eight memories were not compared word for word this round.
- **Not opened:** Nhi's memory, 3840, and a real "New" cue being marked seen.

## Shared state

- **Archive view.** `astory.archiveView` was "list". In my frames I pressed Prints and then List each time, and it reads "list" now.
- **Sign-in.** `astory-app-auth` is present and untouched. I did not sign out and wrote no data.
- **My tab.** In tab-207 I set "Nguyen Thi Minh Khai’s book" only in my own frames' DOM. The frames are removed, the viewport is reset to desktop, and the tab is closed.
- **Scratchpad.** The mutants are in `scratchpad/mut15` and the probes in `scratchpad/sk14/p3.mts`. The `node_modules` junction is removed, and the project's `node_modules` is intact.
