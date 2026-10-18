# Archive, memory page and Home's prints, round 10 (Bao's Standard)

**FAIL**

The pages pass at every size, and every round-9 defect and skills gap is closed. Every live memory's tidied words keep what was meant, and every live removal is on the closed list. The tidy still removes words outside the list in seven ways, and each one changes what a teller meant. No live memory triggers any of them yet. The worst is the verb "like": "I'd like just one more day with him" becomes "I'd just one more day with him", and "I like fried rice" becomes "I fried rice". The rest are below, proven on test strings.

Scope: `/archive` in Prints and List, `/archive/:id` for all eight memories in Bao's story plus a missing id, and Home's prints and "From the book".

## How I checked

- **Reading.** I read `docs/BAOS-STANDARD.md` fresh, including the closed list in 17a, and DESIGN.md's craft rules. I read `archive-r9-baos.md` and `archive-r9-skills.md`, the whole of commit fef2402, and all of `transcript.ts`.
- **Tests.** `vitest run src/components/archive src/lib` passes 9 files and 235 tests. `tsc --noEmit` exits 0.
- **The basis.** I tested the list, not every possible sentence. A removal counts here only when it is outside items (a) to (e), or when it changes what was meant. A filler the list misses is not counted.
- **Test strings.** I ran a copy of the current `transcript.ts` under Node 24.18. The strings were:
  - every string from both round-9 reports;
  - about 60 new ones, written only to find removals outside the list.
- **The live words.** I loaded the account read-only with the app's own `loadAccount` in my tab. I ran each memory the way `MemoryPage` does: `paragraphsOf`, then `wasSpoken`/`soundsSpoken`, then `cleanTranscript`. Then I diffed the exact words against the tidied words, word by word, with an LCS.
- **Browser setup.** I used my own tab (tab-151), with the founder signed in. The sizes were 1366×768, 1920×1000, 2560×1300 (html zoom 1.3), 800×1024 and 390×844. For the titles I added 320×700, 360×800 and 375×812, force-loading the page at each width.
  - The pane's emulated resize fires no `resize` event, so at 2560 I dispatched one to apply the page zoom.
  - On each page I stepped GSAP and ScrollTrigger, scrolled to the end and back with 160ms pauses, finished pending animations, and set lazy images to eager.
  - Then I measured, with getBoundingClientRect and computed styles:
    - horizontal scroll and anything past the right edge;
    - text under 12px;
    - clipped text;
    - anything left under half opacity;
    - images not loaded;
    - targets under 44px;
    - title lines and size;
    - the kept line's head, mark and coda;
    - "Memory n of 8" and "Where to next";
    - grid columns;
    - the natural size of every print's photograph against its frame.

## Round 9, checked

**Bao's Standard round 9 (archive-r9-baos.md): all six fixed under the closed list.**

| # | Round 9 defect | Now |
|---|---|---|
| 1 | An answer opening "Because / Our / We were" handed to the asker | **Fixed.** All three strings and the spoken memory keep the answer in the teller's words. A question is lifted only when the asker goes on and a back-channel follows, as in 5963. |
| 2 | A comparing "like" before a bare noun dropped | **Fixed.** All twelve strings stand, from "We were like brothers" to "They were like family to me, like brothers". |
| 3 | The quoting "like" after "I'm", "we're" or "just" dropped | **Fixed.** All six stand. A comma on one side keeps the "like". |
| 4 | A teller's own question lifted as "We asked" | **Fixed** for all five strings. A new shape of it is defect 3. |
| 5 | Emphasis collapsed without a comma, and repeated sentences dropped | **Fixed.** All nine stand: "a big big house", "hot hot hot", "No. No. No.", "I loved her. I loved her." and the rest. |
| 6 | "Like" before a year or a stretch of time dropped | **Fixed.** "like in 1980", "like forever", "like ages ago", "like for a year", "like until midnight" and the rest stand. |

**The skills review, round 9 (archive-r9-skills.md):**

| # | Gap | Now |
|---|---|---|
| 1 | A comparing or hedging "like" dropped | **Closed.** Every row stands. |
| 2 | Doubled words and repeated sentences | **Closed.** The refrains stand. 342e's "that's, that's" collapses again, as item (c) allows. |
| 3 | Titles at three lines on phones | **Closed.** Every title takes two lines or fewer at 320, 360, 375 and 390 (table below). |
| 4 | An answer in the next paragraph dropped | **Closed.** `["Were you scared there?", "Yes. We had nothing."]` keeps "Yes." |
| 5 | The rendition misses a change of zoom or density | **Closed for zoom, measured.** I loaded the List at 1600×1000 (zoom 1, density 1.5, all 400s), then resized to 2400×1500 (zoom 1.5). The same four `<img>` nodes swapped in place to 600 (600×400 and 600×750), with no remount. The density listener and the real-ratio check in `onLoad` are read from the code, not exercised. |
| 6 | Leftovers in the guard and the CSS | **Closed.** `photoUrls.ts` returns `null` before touching `transformsOff` when the generation has moved, and deletes only its own in-flight entry. The duplicate `.cue` rule is gone. `.print-card .cap .kicker` is 12px. |

## Every live memory against its exact words

Every removal below is on the list. Nhi's memory was not opened.

- **342e4b40.** Removed:
  - the opening "Yeah well so" (a);
  - "like" before "really" and in "and like worked" (b);
  - "that's, [that's]" (c);
  - "So we did like a, we" (d), the 17a example;
  - "Wait, were you? Yeah." (e), the 17a example;
  - a lone "Yeah." between "chose to do that." and "It's been challenging" (e).

  Kept: every comparing or hedging "like" ("like right out of the gate", "like one person", "owns like an NBA team"). The repeated "I was working a corporate job." also stays, as the list says it must.
- **59632e67.** Removed:
  - "Yeah," opening a later sentence (a);
  - "but yeah" closing a sentence (a);
  - "Yeah, right?" and "Wow, that's amazing." (e).

  The one "We asked" line is the asker's question with "Because our strategy right now is…". "For sure. Yeah, definitely." stays as the answer.
- **f6a734be.** Removed: "Yeah," twice and "So yeah," opening later sentences (a), and the other person's "That's awesome." (e).
- **c21cf4d4.** Nothing is removed now. The opening "No," that round 9 dropped stays, because the list doesn't name it.
- **0ced62a7 and 459228bd.** Nothing is removed.
- **beeedb62.** Typed, untouched.
- **f9b0e6e9.** Only the teller's labelled turn is kept. This is founder test content, as known.
- **Takeaways:**
  - 4592: "The best way to learn finance is to build a business."
  - 5963: "You always have to just look for every opportunity."
  - c21c: "My grandfather was a police officer and he was a good man."
  - 342e: "I thought we were gonna raise money like right out of the gate." It is quoted the same in "From the book".
  - f6a7: "I want to help growing ventures because I get to work with startups."

## Defects, worst first

All seven are latent: no live memory triggers them today. Each one removes words that items (a) to (e) do not name, and each changes what was meant. 17a reads: "Everything not on this list stays, word for word."

1. **The verb "like" is removed as if it were filler, so a liking becomes an action, or the sentence breaks.**
   - Where: `isFillerLike` in `src/components/archive/transcript.ts`. It never looks at the word before "like" when the next word is an intensifier or ends in "-ly". `PAST_VERB` counts any word ending in "ed" ("fried", "used", "red"), and "cut", "set" and "left", after I, we, they or you.
   - Sizes: all.
   - Evidence (`cleanSpeech`, Node):
     - "I'd like just one more day with him." → "I'd just one more day with him."
     - "I would like very much to go back to Hue someday." → "I would very much to go back to Hue someday."
     - "I like really spicy food." → "I really spicy food."
     - "Mom didn't like oily food." → "Mom didn't oily food."
     - "I like fried rice." / "We like fried rice and fish sauce." → "I fried rice." / "We fried rice and fish sauce."
     - "I like used books." → "I used books."
     - "I like cut flowers." → "I cut flowers."
     - "They like boiled eggs." → "They boiled eggs."
     - "I like red roses." → "I red roses."
   - Rule: 17a, where (b) is a filler "like" and the code's own comment says the verb stays; 17.
   - Fix:
     - Never drop "like" after would, 'd, to, do, does, did, don't, didn't, doesn't, never, also, will, 'll, can or could.
     - After I, we, they or you, count only the irregular past forms that are never adjectives (went, came, said, told, took, saw, knew, thought, gave, ran, sat, stood, began, grew, wrote, spoke, heard, sent, spent, taught, caught, fought, sold, drove, flew, ate, fell, sang, swam, woke).
     - Keep the "-ed" pattern only after "and" or "then". 342e's "and like worked" still goes.
     - Add these nine strings as fixtures.

2. **A comparing "like" is dropped before a name ending in "-ly", or after "feels", "looks" or "seems", so a likeness becomes a fact or the sentence breaks.**
   - Where: `isFillerLike`. A name such as "Beverly" or "Sicily" passes the "-ly adverb" test because `NOT_ADVERB` lists only some names. And "like" after a verb of seeming is dropped before "just" or "really".
   - Sizes: all.
   - Evidence:
     - "It feels like just yesterday we came to America." → "It feels just yesterday we came to America."
     - "He looked like just another kid." → "He looked just another kid."
     - "It looked like really bad weather." → "It looked really bad weather."
     - "My grandmother had friends like Beverly and Holly." → "My grandmother had friends Beverly and Holly."
     - "Places like Sicily were far away." → "Places Sicily were far away."
   - The first three follow the letter of (b) (before an intensifier). They are still a change of meaning, and keeping more is always allowed under the closed list. The names are outside (b): they are not adverbs.
   - Rule: 17a ("never changes what was meant… never… the… feeling 'like'").
   - Fix:
     - Keep "like" after look, looks, looked, feel, feels, felt, seem, seems, seemed, sound, sounds, sounded, smell, smells, smelled, taste, tastes and tasted.
     - Count an "-ly" word as an adverb only when it is lowercase.
     - Add the five strings.

3. **A teller's question about their own family, followed by "Because our…" and a lone "Yeah." or "Really.", is set as "We asked", so their answer is credited to the interviewer and leaves their words.**
   - Where: `liftQuestions` in `transcript.ts`. The shape test (`ASK`, `ASKER_GOES_ON`, then `isBackchannel`) has no check on who the question is about.
   - Sizes: all.
   - Evidence (`cleanTranscript`):
     - "Yeah so we lived by the river in Hanoi. Why did we leave Hanoi? Because our father said the soldiers were coming for him. Yeah. We had one night to pack everything we owned." → "[We asked] Why did we leave Hanoi? Because our father said the soldiers were coming for him." `ownWords` (the card's words) loses the answer: "We lived by the river in Hanoi. Yeah. We had one night to pack everything we owned."
     - "Why did my parents come here? Because our village was burned. Yeah. Nothing was left." is lifted the same way.
   - Rule: 17a ("never a question the teller asks themselves… never an answer", and the list's "when the asker plainly goes on").
   - Fix:
     - Lift a question only when it holds no first person (I, me, my, we, us, our).
     - 5963's "Do they open to non-students as well?" still lifts.
     - Add both strings, with 5963's as the counter-case.

4. **The filler-sound pattern removes real words: "ER", "UM" and the unit "mm".**
   - Where: `FILLER` in `transcript.ts`. It is case-insensitive and has no guard for capitals or a number before it.
   - Sizes: all.
   - Evidence:
     - "They rushed him to the ER." → "They rushed him to the."
     - "Grandpa was a doctor in the ER." → "Grandpa was a doctor in the."
     - "I went to UM for college." → "I went to for college."
     - "We shot it on 8 mm film." → "We shot it on 8 film."
     - Punctuation only: "We were, uh, poor." → "We were, poor." The comma before the filler stays.
   - Rule: 17a (a) (filler sounds: um, uh, er, hmm).
   - Fix:
     - Match a filler only in lowercase or with only its first letter a capital, never in all capitals.
     - Never match "mm" after a number.
     - Take the comma before a removed filler along with it.
     - Add the five strings.

5. **"her her" and "was was" are collapsed when no comma is between them, though they are grammar, not a slip.**
   - Where: `SLIP_TWICE` in `transcript.ts` (the `,?` makes the comma optional for every slip word).
   - Sizes: all.
   - Evidence:
     - "I told her her father was gone." → "I told her father was gone."
     - "I gave her her first doll." → "I gave her first doll."
     - "What it was was a miracle." → "What it was a miracle."
   - Rule: 17a (c) ("a slip word said twice in a row").
   - Fix:
     - Without a comma, collapse only the articles and conjunctions (a, an, the, and, or, but, then, because, if).
     - Collapse a pronoun, a contraction, "is" or "was" only with a comma between them ("I, I", "that's, that's", "it was, was").
     - Add the three strings.

6. **An opening "So" or "Well" that is not throat-clearing is removed: an intensifier or a noun.**
   - Where: `OPENING_FILLER` in `transcript.ts`. It takes "so" or "well" before any word.
   - Sizes: all.
   - Evidence (`cleanSpeech` with `opening: true`, and `cleanTranscript`):
     - "So many years have passed since we left Hue." → "Many years have passed since we left Hue."
     - "So many people died." → "Many people died."
     - "Well water was all we had." → "Water was all we had."
   - Rule: 17a (a) (an opening "yeah/well/okay/so" before the teller's first words, meaning the throat-clearing).
   - Fix:
     - Take "so" or "well" only when a comma, a pronoun, an article, "and" or "then" follows.
     - Never take it before many, much, few, little, long, far, or a noun.
     - Add the three strings.

7. **"an A" reads as a clause broken off on an article, so a whole clause goes.**
   - Where: `BREAKS_OFF` in `transcript.ts` (`/\b(?:a|an|the|my|our|their|your)$/i`, case-insensitive), used by `dropRestarts`.
   - Sizes: all.
   - Evidence: "I got an A, I was so proud." → "I was so proud." The control "My mom got a B, she cried." stands.
   - Rule: 17a (d) (only "a broken-off clause the speaker restarts").
   - Fix:
     - Make `BREAKS_OFF` match only lowercase, so a capital "A" (a grade, "Plan A") never reads as a break.
     - Add the string.

## What holds

- **Overflow and type.** At all five sizes, on Home, both Archive views, all eight memories and the missing id:
  - no horizontal scroll (`scrollWidth` equals `clientWidth` everywhere). The only box past the right edge is the decorative `.lamp`, inside an `overflow: hidden` parent with `pointer-events: none`.
  - no clipped text;
  - no text under 12px;
  - no target under 44px. The search input is 33px tall inside its 44px label.
- **Motion settles.** Below-the-fold cells measured at opacity 0 after my stepped scroll. Every one reached opacity 1 and stayed there once scrolled into view, back at the top:
  - Home's second row at 1920, 2560 and 800;
  - the List's last three at 800;
  - the Prints at 390.
- **Titles.** Every title ends in the foil stop (`rgb(201, 161, 90)`).

  | Width | 5963 | 0ced | c21c | 342e | 4592 | f6a7 | beee | f9b0 |
  |---|---|---|---|---|---|---|---|---|
  | 320 | 2L 27px | 2L 32 | 2L 23 | 2L 25 | 2L 30 | 2L 29 | 2L 32 | 1L 32 |
  | 360 | 2L 31 | 2L 32 | 2L 26 | 2L 29 | 2L 32 | 2L 32 | 2L 32 | 1L 32 |
  | 375 | 2L 32 | 2L 32 | 2L 27 | 2L 30 | 2L 32 | 2L 32 | 2L 32 | 1L 32 |
  | 390 | 2L 32 | 2L 32 | 2L 28 | 2L 32 | 2L 32 | 2L 32 | 2L 32 | 1L 32 |

  - The 22px floor is never reached; the lowest is 23px at 320.
  - On a direct load at 320, 5963's treasured seal sits beside the second line, 35px wide, not on a line of its own.
  - At 1366 and up, every title is 2 lines (1 for "Ending the chat").
- **Memory pages.**
  - Every memory has "Memory n of 8", named Previous and Next, and "Where to next".
  - The kept line has a head and a mark on the six spoken memories, and a coda only on 342e.
  - beee marks its first lines. f9b0 sets no kept line.
- **Prints.**
  - Columns: 4 at 1366 (266px), 1920 (375) and 2560 (488); 3 at 800 (232); 2 at 390 (170).
  - No `.said` overflows.
  - No photograph is upscaled:
    - 400 for the 254px frame at density 1 (landscape 400×267 against 254 needed);
    - the original at 1920 and 2560;
    - 600 at 800;
    - the original at 390 (density 2).
- **List.** 2 columns at 1366 (535px), 1920 (754) and 2560 (980); 1 at 800 (697) and 390 (328). Thumbnails get 400, and 600 at 2560 and 800.
- **Home.**
  - Prints: 3 columns at 1366, 1920, 2560 and 800, and 2 at 390.
  - "From the book" quotes 342e's kept line.
- **Not-found page.**
  - The cloth, one sheet, Bond (`curious-paper.webp`), "That memory isn't here." with the foil stop, one line of cause and remedy, and "Back to the archive".
  - It fills exactly one window at all five sizes: 768, 1000, 1300, 1024 and 844.

## For the lead (not counted)

- **Item (e) says "in a transcript whose turns are known".** Apart from f9b0's test chat, no live spoken memory has speaker labels, a `source` or audio. Yet the list's own examples ("Wow, that's amazing.", "Wait, were you?") come from 5963 and 342e. I have therefore read (e) as the lead applies it, to any spoken memory.
  - On that reading, a teller's own short line is dropped as back-channel: "We were poor. Really. We had nothing." loses "Really.", "We swam in the river every summer. So fun." loses "So fun.", and "Of course." and "Exactly." go too.
  - If (e) is meant only for labelled turns, those removals, and 342e's lone "Yeah.", are outside the list.
- **Item (a) changed in fef2402.** It gained "a 'yeah,' or 'so yeah,' that opens any later sentence…" and "a closing ', but yeah' or ', yeah'". That commit is the builder's own round-10 commit, not 194c32d. I judged against the file as it stands. If the lead did not make that change, the "Yeah," and "but yeah" removals in 5963 and f6a7 rest on it.
- **Seen at 320 only:** on 5963 the state row wraps "Share" alone onto a second line ("Treasured", "Public", then "Share" 44px lower). At 360 and up all eight memories hold the row on one line.

## Not verified

- **Defects 1 to 7** are proven on strings under Node, importing `transcript.ts` directly. No live memory triggers them.
- **Not exercised:** the density listener, the real-ratio step-up in `onLoad`, reduced motion, hover, active and focus-visible states, the lightbox and View Transitions, and the server tidy.
- **The pane was hidden and my tab was in the background.** The pane's emulated resize fires no `resize` event, so the page zoom at 2560 and the 1600 → 2400 test needed a dispatched one. A real window fires it.
- **Screenshots** were taken in the pane for my own checks only (the 1366 memory head, and 5963 at 320). None are saved, because every finding is a measurement or a string.
- **Shared state.**
  - The stored Archive view was "list" when I started. I pressed Prints and List with the page's own buttons at each size, and it reads "list" now.
  - `astory-app-auth` was not touched, and no data was written.
  - My helper code lived in my tab's `sessionStorage` under `baos-boot-r10`, which I removed.
  - Tab-151's viewport was reset to desktop, and the tab is closed.
