# Skills Steward: the Archive, the memory page, and Home's prints, round 14

**Verdict: GAPS.** Three ugly gaps and five polish gaps.

What passes:
- **Tests and types.** `vitest run src/components/archive src/lib` passes: 9 files, 478 tests. `tsc --noEmit -p tsconfig.app.json` exits 0.
- **The round-13 skills gaps.** Seven of the eight are closed in full. Gap 6 is mostly closed: 21 of its 25 surviving mutants now fail.
- **The round-13 Bao defects.** All six are closed as written.
- **The lead's rulings.** All five hold, measured or probed:
  - "Yeah, right." stays whole as the opening.
  - "A Story:" mid-sentence stays as words.
  - A question holding I, me, my, we, us or our is never lifted.
  - The running head's crossfade has no ellipsis.
  - At 320 the prints stay level and in their cells, and no words are clamped.
- **The live words.** 5963 and f9b0 still show their one "We asked" line each.

What does not pass:
- **At 360–365px, a typed print's words run into its caption.** The new "New from" spacing pushes the words down 16px, and the size-fitting only works below 360. On c21c the last line of words sits 15px into the title on both the Archive and Home.
- **(e) still cuts a reaction inside single quotation marks or guillemets** when the quotation holds more than one sentence.
- **(a) reads a possessive 's as "is".** A list after a possessive loses both commas, and two items run together ("Lan's Mai's").
- **Five polish gaps:**
  - the fit leaves out the cue's height;
  - the fit forces layout in a read-write loop on every card;
  - the running head still clips with a long book name;
  - (b) still takes a hedge before a few more kinds of amount;
  - 11 of 57 mutants pass the suite.

## How this was checked

- **Read:**
  - BAOS-STANDARD.md in full, with 17a read fresh;
  - DESIGN.md and BUILDER-BRIEF.md;
  - archive-r13-skills.md and archive-r13-baos.md;
  - the skills: taste-skill, hallmark (responsive: "render flawlessly at 320, 375, 414 and 768"; states), emil-design-eng, impeccable (craft-floor: "Run the real copy at every breakpoint and fix what overflows"), and gsap-performance ("Batch Reads and Writes").
- **Code:** the whole diff of ff82ea0 (`transcript.ts` and its test, `PrintCard.tsx`, `archive-reading.css`, `astory.css`), and `transcript.ts` in full at ff82ea0. The working tree matches ff82ea0 for these files.
- **Strings:** I ran ff82ea0's `transcript.ts` under Node 24.18 on about 75 new strings: `cleanSpeech` with explain, `cleanTranscript`, `keptLine` and `takeaway`.
- **Mutants:** 57 in all, run against a copy of the real suite in `scratchpad/mut14`, using a junction to `node_modules` that I removed afterwards:
  - the 25 that survived round 13, rewritten for ff82ea0;
  - U1–U31, new against round 14;
  - one control with the code unchanged.
- **Browser:** in my own tab (tab-199), I loaded each page fresh in a same-origin frame at the exact size:
  - 320×700, 360, 366, 372, 375, 380, 390×844 and 414;
  - 800×1024, 1366×768 and 1920×1000;
  - 2560×1300, where html zoom is 1.3.

  On each load I stepped GSAP and ScrollTrigger and finished CSS animations. Then I measured:
  - every print: its cell, frame ratio, row level, `.said` font and line height, clamp, the gap from the last line of words to the caption's first text, and the cue's box against the frame and the words;
  - the running head: its steady state at 320–560, and its crossfade, by pausing each CSS transition and seeking it to 0, 60, 120, 160, 200, 240, 300 and 400ms in both directions;
  - the cost of the fit's forced layouts.

  I confirmed the 360 overlap in a screenshot.

## Round 13, checked

| # | r13 skills gap | Now |
|---|---|---|
| 1 | At 320 a typed print widened the photo print beside it, or left rows uneven | **Closed.** At 320 every print on the Archive (8) and Home (6) sits at 20–155 or 165–300, and every row is level: 164/164, 230/230, 173/173. Photographs take the taller crop with `object-fit: cover` (123×230), and `scrollWidth` is 320. New gap 1 is at 360. |
| 2 | Running head clipped at 360–389 | **Closed for "The Vo book".** In the family section from 320 to 479, the book's name is hidden and "What the family remembers" shows whole (231px of text in 231px). At 480 and up both show: 20–121 and 229–460. A longer name is gap 6. |
| 3 | The "New from" cue covered the words and was cut off | **Closed.** The cue is 22px clear of the words at 1366, 1920 and 2560, 8px clear at 360–414, and 14px clear at 320. Below 761px it shows "New from Bao" in 117×22, inside the frame. The accessible name carries the full line. |
| 4 | "Yeah," answering a question in single quotes was cut | **Closed** (U19 fails) |
| 5 | Hedges before teens, years and units | **Closed** for every string. The rest is gap 7. |
| 6 | 25 surviving mutants | **21 closed.** N26, T15, T17 and T42 still survive (gap 8). |
| 7 | Stale header comment | **Closed.** The header now states the list as the code applies it. |
| 8 | "Yeah, yeah" lost a word later in the text | **Closed** (U8 fails). The capitalised "Yeah, Yeah" is untested (U31). |

| # | r13 Bao defect | Now |
|---|---|---|
| 1 | Home's photo prints ran off the screen at 320 | **Closed** (see gap 1 above) |
| 2 | Hedges before amounts | **Closed** for all seven strings |
| 3 | Reactions inside a quotation of several sentences | **Closed for “…” and "…".** Single quotes and guillemets are gap 2. |
| 4 | The feeling "like" after feel or look | **Closed.** Seem and sound are covered too. |
| 5 | A filler in a list that goes on with commas | **Closed.** The possessive case is gap 3. |
| 6 | A later "Yeah, yeah," | **Closed** |

## The mutation harness: 57 run, 35 fail, 22 survive (11 counted)

**Round 13's 25 survivors, rewritten for ff82ea0: 21 fail now.** These four still survive:
- **N26.** The typed-takeaway test picks "I loved my mother more than anything.", so the ", like," sentence is never the takeaway.
- **T15 and T17.** Both inputs follow "had", and the be/have ruling now takes both commas anyway.
- **T42.** The test only checks lines that start "I remember".

**Round 14 (U1–U31): 20 fail.** These fail:
- U1, U3 and U4: the quote tracking;
- U5, U6 and U7: the be/have test and the comma window;
- U8 and U9: the "Yeah, yeah" and "Yeah, right" guards;
- U10–U15: the feeling words, all/just/kind of, think, the teens, a/an + unit, and several/once/twice;
- U16 and U17: "A Story" anywhere, and a bare "Our";
- U19: `isQuestion` with the straight quote;
- U27: a few / a couple;
- U28: the straight-quote parity;
- U30: we're and the like.

**These 11 survive:**
- **Counted (7):**
  - U2: a quoted reaction cut on the asked line;
  - U18: a question holding only us or our is lifted;
  - U24: a question holding only "me" is lifted;
  - U20: `TAG` without the straight quote;
  - U23: the takeaway's question test without the straight quote;
  - U26: "zero" dropped from the amounts;
  - U31: the "Yeah, Yeah" guard made case-sensitive.
- **Not counted (4):** each of these keeps more than the list, or affects only the choice of the kept line.
  - U21: the teller's answer without the straight quote;
  - U22: `DANGLES` without the straight quote;
  - U25: "does" dropped, which lifts less;
  - U29: 's dropped from the be/have test, which keeps a comma.

**The control** survives, as it should.

## Gaps, skill by skill

### Ugly

1. **At 360–365px, a typed print's last line of words runs into its caption's title. This is worst on a print with the "New from" cue, on both the Archive and Home.**
   - **Rules:**
     - hallmark responsive: flawless at 320, 375 and 414, and 360 is the most common Android width;
     - impeccable craft-floor: "fix what overflows";
     - the checklist: no overlapping text.
   - **Where:**
     - `archive-reading.css`:665 sets `--top: 38px` on a cue print below 761px. That moves the words 16px down.
     - The words still sit in an absolutely placed `.typed-in` (`astory.css`:2417), over a fixed bottom reserve of 96px (`archive-reading.css`:577). That reserve cannot hold a four-line title at 143px wide.
     - The in-flow layout (`archive-reading.css`:677) and `useFitWords` (`PrintCard.tsx`:59, `SMALLEST = "(max-width: 359.98px)"`) start only below 360.
   - **Measurement:** the gap from the last line of words to the title's first text, on c21c ("My grandfather was a police officer…", with the cue). A negative gap is an overlap.

     | Width | Archive | Home |
     |---|---|---|
     | 360 | −15px | −15px |
     | 366 | +10 | — |
     | 372 | +14 | — |
     | 380 | +37 | — |

     - 342e has no cue and is +1px at 360, so its last line touches its title.
     - In the screenshot at 360, "good man." is printed over "Losing".
   - **Change:**
     - Raise the in-flow block and `SMALLEST` to the whole phone range, `(max-width: 760.98px)`, or at least `(max-width: 419.98px)`. The words and the caption then always stack, and the fit steps 15→13px before anything grows.
     - Then re-measure at 360, 375 and 414 on both pages, with and without the cue.

2. **(e) cuts a reaction inside a quotation in single marks or guillemets.**
   - **Rules:**
     - 17a (e), "never inside quotation marks";
     - r13 Bao defect 3, which applies to every kind of quotation mark (rule 1).
   - **Where:** `insideQuote`, `transcript.ts`:68, counts only “ ” and the straight ". `breaksRule`'s mirror (`transcript.test.ts`, the "inside a quotation" lines) has the same blind spot.
   - **Evidence:**
     - `She said, 'Okay. Wow. That's amazing.' Then he left.` → `She said, 'Okay. That's amazing.' Then he left.` (e-reaction "Wow.")
     - `She said, ‘Okay. Wow. That's amazing.’ Then he left.` → the same cut.
     - `She said, ‘Really? Wait, were you? I never knew.’` → `She said, ‘Really? I never knew.’`
     - `He said, «Wow. That's amazing.» And left.` → `He said, «Wow. » And left.` This one also leaves a stray space before the closing mark.
     - Across a paragraph break: `["He said, “We went.", "Wow. That's amazing.” Then we left."]` → the second paragraph loses "Wow."
   - **Change:**
     - Count an opening ‘ (and « ») the way “ is counted.
     - Count a straight ' as an opening quote only after a space, a comma, a colon or the start of the text, and as a closing quote only after `.`, `!`, `?` or `,` (so the apostrophes in "That's" and "Lan's" never count).
     - Mirror this in `breaksRule`.
     - Add the four strings to `R14_KEEP`.

3. **(a) treats a possessive 's as a form of "be", so a list after it loses both commas and two items merge.**
   - **Rules:**
     - 17a (a): one comma stays where a list goes on, "unless the word before the filler is a form of be or have". A possessive is neither.
     - "never changes what was meant".
   - **Where:** `BE_HAVE_BEFORE`, `transcript.ts`:151: `…|['’]s|['’]m|['’]re|['’]ve|['’]d)\s*$`. The checker copies it (`transcript.test.ts`:849), so the contract accepts the cut.
   - **Evidence** (`cleanSpeech`, explain `a-filler ", um,"`):
     - "We ate at Lan's, um, Mai's, and Hoa's." → "We ate at Lan's Mai's, and Hoa's."
     - "We visited Hue, Lan's, um, Minh's and Long's." → "…Lan's Minh's and Long's."
     - "It was my uncle's, um, my aunt's, and my mother's house." → "…my uncle's my aunt's, and…"
   - **Change:**
     - Accept 's only after a pronoun or a question word: `\b(?:it|he|she|that|there|here|what|who|where|how)['’]s`.
     - Accept 'd only after a pronoun: `\b(?:i|you|he|she|we|they)['’]d`.
     - Mirror both in `breaksRule`.
     - Add the three strings, each keeping one comma.

### Polish

4. **`useFitWords` leaves the in-flow cue out of its sum, so a cue print grows past 3:4 even when its words fit. It also never re-fits when the cue or the caption changes.**
   - **Rules:**
     - impeccable craft-floor;
     - the ruling at 320: the print grows only "when it can't fit at 13px".
   - **Where:** `PrintCard.tsx`:78–82. `room` is compared with the padding plus the words plus the caption. Below 360, though, `.cues` is in the flow (`order: -1; margin: 6px 4px 0`, `archive-reading.css`:684).
   - **Measurement:** c21c at 320 is 230px tall. That is 92 (words block) + 22 (cue) + 6 (cue margin) + 110 (caption), and the fit only counted 202. Here 13px fails anyway, but any cue print whose words fit by that sum is still 28px taller than its 3:4, and its row rises by 28px. The effect also depends only on `[text]`, so marking the cue seen, or adding a date to the caption, never re-fits.
   - **Change:**
     - Add `cues.offsetHeight + parseFloat(getComputedStyle(cues).marginTop)` to the sum.
     - Depend on `[text, show.has("new"), dated, kicker]`, or observe the caption's size.

5. **The fit writes a style and then forces a layout for each step on each card in turn: up to four synchronous layouts per typed print, at mount and on every width change.**
   - **Rules:** gsap-performance, "Batch Reads and Writes … avoid interleaving reads and writes"; impeccable optimize.
   - **Where:** `PrintCard.tsx`:80–84 (`setProperty` and then `offsetHeight` inside the loop), with one hook instance per card.
   - **Measurement:**
     - With 8 prints on the Archive at 320 (4 typed), each forced layout cost 0.23ms here.
     - That is small now, but the cost is the number of typed prints × 4 × the layout cost of the whole page. An archive of 100 memories on a slow phone would stall on mount and on rotation.
   - **Change:** fit every typed print in a mosaic in one pass:
     - set step 1 on all of them, then read all;
     - set step 2 only on those that failed, then read again;
     - repeat for steps 3 and 4.

     That is at most four layouts in all, whatever the number of prints. One `ResizeObserver` on the mosaic can trigger the pass.

6. **The running head's 480px breakpoint assumes a short book name. A long one clips both labels from 480 to about 530.**
   - **Rules:**
     - hallmark responsive;
     - r13 gap 2's own change: "or hide the book's name whenever the two labels do not fit, measured once in Shell … Test … with a longer book name";
     - the checklist: no clipped text.
   - **Where:** `astory.css`:3368 `@media (max-width: 479.98px)`. `Shell.tsx`:274 builds `${headStory.name}’s book` when there is no last name, so a full name can be long.
   - **Measurement:** f9b0 in the family section, with a 244px book name:
     - At 480: the book's name box is 20–238 for 244px of text, clipped. "What the family remembers" runs to 485 in a box that ends at 460, ellipsised.
     - At 560 and up, both fit.

     "The Nguyen-Tran book" (186px) and "The Montgomery book" fit at 480.
   - **Change:** in Shell, measure once per name and width: add `.tight` to the head when the book's name, the section's name and a 24px gap do not fit the inner width. Hide the book's name under `.tight.in-section`, instead of using the fixed 480 query.

7. **(b) still takes the hedge "like" before a few more kinds of amount.**
   - **Rule:** 17a (b): "before an amount, where it hedges … stays".
   - **Where:** `LIKE_AMOUNT_NEXT`, `transcript.ts`:55.
   - **Evidence:**
     - "I was in, like, fourth grade." → "I was in fourth grade."
     - "We had, like, nothing." → "We had nothing."
     - "We had, like, about ten dollars." → "We had about ten dollars."
     - "We had, like, maybe ten dollars." → "We had maybe ten dollars."

     The last two keep a hedge of their own, so the change in meaning is slight. The first two turn a guess into a fact.
   - **Change:**
     - Add the ordinals: `first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|\w+teenth|\w+tieth`.
     - Add `nothing|none`, and `(?:about|around|almost|nearly|maybe|over|under|at least) ` followed by a number.
     - Mirror the list in `breaksRule`, and add the four strings to `R14_KEEP`.

8. **Eleven mutants survive. Seven are counted, and each needs one input.**
   - **Rules:**
     - the brief: every mutant fails;
     - 17a: "the tests check every cut against its rule".
   - **What survives, and the input that would catch it:**

     | Mutant | Add |
     |---|---|
     | N26 | A typed takeaway whose best line holds ", like,". `takeaway("We were so poor, like, really poor in those years.")` must be exactly that sentence. |
     | T15 | "We ate rice, um, fresh fish and beans." → "We ate rice, fresh fish and beans." |
     | T17 | "We had three: rice, um, 2 kinds of beans." → "We had three: rice, 2 kinds of beans." |
     | T42, U23 | `expect(takeaway(said)).toBe("I remember she said, 'I will always love you, my dear little one.'")`, with the exact string instead of the "I remember" filter. |
     | U2 | `["Interviewer: He said, “Okay. Wow. That's amazing.” Did he?", "Me: Yes."]` keeps "Wow." on the asked line. |
     | U18, U24 | "Is it good for us? Because our plan is to find a student. Yes." and "Did they call me? Because our plan is to find a student. Yes." are kept, not lifted. |
     | U20 | A tag question in single quotes, "'Was it good, right?' Because our school was small. Yes.", is not lifted. |
     | U26 | "We had, like, zero money." is kept. |
     | U31 | "We moved. Yeah, Yeah, it was hard." is kept. |

## For the lead (not counted)

- **17a's text and the code have drifted apart in two places.** 17a does not name either, and both keep more than the list.
  - The code also counts a comma within three words as a list going on. That leaves a stray comma after a verb: "We went, um, there, and then home." → "We went, there, and then home."; "She told me, um, go home, and rest." → "She told me, go home, and rest."
  - (b) also keeps the "like" after feel, look, seem and sound, and after "sort of".

  Write both into 17a, or narrow the code.
- **A two-item list without "and" merges, on the list's letter:** "We had rice, um, fish." → "We had rice fish."
- **The lift still takes a teller's question with no first person** when "We want…" or "We're…" follows and then "Yes.": "Did they like it? We want to know. Yes." This fits the shape the ruling allows.
- **The cue's first name is the first word of the name.** In Vietnamese order, "Nguyen Thi Lan" gives "New from Nguyen", which every Nguyen in a family shares.
- **Entering the family section at 320–479,** "What the family remembers" (109–340 at 360) fades in over the fading book's name (20–121). They overlap by 12px for the first 60ms or so, with the book's name at 0.09 opacity by 60ms. Leaving shows no overlap. There is no ellipsis at any point, as the ruling asks.

## Clean on this pass

- **Sizes:**
  - `scrollWidth` equals the width at every size, on the Archive and on Home.
  - No print is off screen and no words are clamped. Rows are level from 320 to 2560.
  - At 1366 the cue is 197×24, and 256×31 at 2560 zoom 1.3. It is clear of the words at every size.
  - On desktop the cue straddles the terracotta top rule like a tab. That is acceptable book material.
- **The prints from 375 to 2560:**
  - words to caption: at least 8px on every typed print (Home is 63/102 at 800, 177/240 at 1920 and 231/312 at 2560);
  - columns: 2 × 151–170px on phones, 3 × 225–227 at 800, 4 × 254 / 3 × 232 at 1366, 4 × 363 / 3 × 334 at 1920, and 4 × 472 / 3 × 434 at 2560.
- **Motion:**
  - The head's book-name fade has a reduced-motion rule (`astory.css`, the `prefers-reduced-motion` block).
  - The fit is synchronous, in `useLayoutEffect`, so the first paint is already fitted. No GSAP changed.
  - No `transition: all` and no ease-in were added.
- **The running head,** steady state from 320 to 560 for "The Vo book": in the family section the book's name is hidden below 480 and both names are whole from 480. At the top, "The Vo book" and "Archive" are whole.

## Not verified

- **Resizing under a live clock.** The pane was hidden, so `requestAnimationFrame`, `ResizeObserver` and `matchMedia` change events never fired. After I widened a frame from 320 to 390, the inline `--lh: 18px` stayed, and the words were 15px on 18px lines. In a live browser the change listener should clear it, by the code, but I could not see that happen.
- **Not checked:**
  - Nhi's memory;
  - the word-for-word comparison of all eight live memories (I re-checked only 5963 and f9b0's "We asked" lines);
  - 3840, and the founder's zoomed Edge window;
  - a real "New" cue being marked seen.

## Shared state

- **Archive view.** The stored view (`astory.archiveView`) was "list" when I began. I pressed Prints with the page's own button, and it later read "list" again because another tab changed it. For the timing check I pressed Prints and then List straight away in my frame. It reads "list" now.
- **Sign-in.** `astory-app-auth` is present and untouched. I did not sign out and wrote no data.
- **My tab.** My helpers and frames are removed, tab-199's viewport is reset to desktop, and the tab is closed.
- **Scratchpad.** The probes are in `scratchpad/sk14` and the mutants in `scratchpad/mut14`. The `node_modules` junction is removed, and the project's `node_modules` is intact.
