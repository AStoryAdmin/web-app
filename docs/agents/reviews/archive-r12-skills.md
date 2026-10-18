# Skills Steward: the Archive, the memory page, and PrintCard, MemoryCard and Mosaic on Home, round 12

**Verdict: NOT APPLIED.** No blockers, two ugly gaps, seven polish gaps.

What passes:
- All 30 mutants from archive-r11-skills.md now fail the suite: the 28 that cut words and the 2 controls.
- Every r11 skills gap and every r11 BAOS defect is closed. The one exception is r11 gap 7, which is closed only for unlabelled text (see gap 8 below).
- On all eight live memories, every cut is on the final list.
- The Share button keeps its width at 320, and the result is announced.

What does not pass:
- **Two kinds of removal break the list, or keep to its letter but change the meaning.** No live memory triggers either one.
  - A sentence-opening "Yeah," is cut even when it answers "Wait, were you?" or "Yeah, right?".
  - A reaction the teller quotes (`"Wow."`) is cut as if it were the other person's.
- **Nine of the 35 new mutants pass the whole suite.** The checker rejects each one once it is given the input, so the gap is in the corpus, not in `breaksRule`.

## How this was checked

- **Skills read:**
  - taste-skill: the house rules (two-line headlines).
  - hallmark: responsive (320 is non-negotiable; single-line affordances), interaction-and-states (success and loading), slop-test.
  - emil-design-eng: easing, 300ms, frequency, `:active`.
  - impeccable: craft-floor ("Run the real copy at every breakpoint and fix what overflows"; states), harden.
  - GSAP skills: no motion changed this round, so I checked for regressions only.
- **Standards read:** BAOS-STANDARD.md 17a, read fresh in its final form: (a), (b), (c) and (e); the "We asked" sentence; and the kept line's joint before a comma, a pronoun or "the". I judged against that list only.
- **Reviews read:** archive-r11-skills.md and archive-r11-baos.md.
- **Code read:** commit 606f1d3: all of `transcript.ts` (584 lines), the round-12 part of `transcript.test.ts` (fixtures, `breaksRule`, `breaksKeptLine`, `onlyCutsRemoved`, `keepCorpus`, the mutants test), and the MemoryPage.tsx and archive-reading.css diffs.
- **Tools run:**
  - `vitest run src/components/archive src/lib`: 9 files, 366 tests pass.
  - `tsc --noEmit -p tsconfig.app.json` fails, but only in `src/pages/Write.tsx` (`Help` not found, three errors). That file has another agent's uncommitted edits; none of 606f1d3's files has an error.
  - **Mutation testing:** I copied `transcript.ts`, its test and the fixtures to my scratchpad and ran the real vitest there through a junction to `node_modules`. I ran 65 mutants against the whole suite: the 30 from round 11, rewritten for the final code, and 35 new ones (N1 to N35; N35 is the unchanged code, kept as a control).
  - **Direct probes:**
    - I appended a probe block that calls the test's own `breaksRule` on the cuts the surviving mutants make.
    - I ran 606f1d3's `transcript.ts` under Node 24.18 on about 60 strings.
- **Live words:** in my own tab (tab-178), for each memory, I:
  - pressed the page's own "Read it word for word" and then "Read it tidied";
  - imported the page's `transcript.ts` through Vite;
  - ran `explainTranscript` and `cleanTranscript` on the exact words;
  - diffed the result against the rendered `.mv-para` text, leaving out the "We asked" label.
- **Rendered:**
  - All eight memories at 320×700: the head's tools, the title lines, and the Share, Copied, "Copy the address bar" and Saving… states, with the labels set in the DOM only.
  - Home and the Archive at 320 and 1366: text under 12px, anything past the right edge, and horizontal scroll.

## The things asked

### The mutation harness

**Every round-11 mutant now fails.**

| r11 mutant | Now |
|---|---|
| (b) "like" after a pronoun; before any word; after any word; the verb before "-ed"; after feels/looks | all fail (4 to 13 tests each, the contract among them) |
| (c) "her her"; any pronoun twice; "big big"/"hot hot hot"; "So, so happy" | all fail |
| (c) an article inside a word ("the theater"); "that's, that's" not opening its clause | both fail |
| (a) "So" before "many"; the opening word before anything, in every sentence, in any paragraph; "ER/UM"; "mm"; a later "Yeah," that answers; a closing ", yeah"; all of "Yeah well so"; a mid-sentence "yeah," | all fail |
| (d) a restarted clause cut (as d-restart, and labelled c-slip); "an A," read as a break | all fail (11 to 45 tests) |
| (e) the teller's "Really." / "Definitely."; a "Yeah." after any earlier reaction; reaction words cut from a longer sentence | all fail |
| A word dropped with no cut recorded | fails (10, the contract among them) |
| Control: a first-person question lifted | fails (the R12 "Why did we leave Hue?" fixture) |
| Control: the kept line drops "You know," or "Like," | fails |

**New mutants against the final list: 26 of 34 fail.** These fail:
- (a): "ah" and "oh" as filler; no word boundary on either side; a capital "Um,"; a later "Okay," or "Well,"; a later "Yeah" with no comma; tag questions no longer counted.
- (b): the cut leaves the comma after "like".
- (c): we/he/my/a/it added; a slip after ";" or ":"; no comma between the copies; the first copy after and/but/so.
- (e): the set grown by "That's great", "Of course", "Right" and "Okay"; (e) applied to the teller's named turn; a reaction cut that runs into the next word.
- The lift: a reply that only starts with "Yes".
- The kept line: the joint dropped before anything, before many/much/for/long, or "I mean" dropped.
- Words: a cut that eats one character more than it records; a typed takeaway losing its ", like,"; "Plan A:" split as a label.

**Nine pass the whole suite (gap 3).** Two more are equivalent to the code and not counted:
- ", Like," in any case;
- a lower-case "i, i". `breaksRule` rejects this one by the list's letter, but a transcript's "i" is the word "I".

### The tidy against the final list

**Every live cut is on the list, and every page shows exactly `cleanTranscript`.**
- **342e:**
  - Cut: "Wait, were you?" and the "Yeah." straight after it (e).
  - Kept: "So we did like a, we built…" stays now that (d) is gone. "So that's, that's" stays, because its first copy follows "So", not a comma.
  - The opening "Yeah well so" stays.
- **5963:**
  - Cut: "Yeah, " opening "gaming and mental health" (a, after "So we did all these cool things."), "Yeah, right?" and "Wow, that's amazing." (e).
  - The closing ", but yeah" stays.
  - The one "We asked" line is the 5963 shape.
- **f6a7:**
  - Cut: the opening "Yeah, " (a).
  - Cut: a later "Yeah, ", and a "So yeah, " opening paragraph 2. Paragraph 1 ends "…work with startups.", not a question.
  - Cut: "That's awesome." (e).
- **4592, 0ced, c21c:** nothing cut, and no toggle shown.
- **beee:** typed and untouched, with no toggle.
- **f9b0:** set as "We asked", as the lead accepted.
- **Kept lines:**
  - 4592: "The best way to learn finance is to build a business." The joint goes before "the".
  - 5963: "You always have to…"
  - f6a7: "I want to help…"
  - 342e, c21c and 0ced: verbatim.
  - Home's "From the book" quotes 342e's line.
- **Through the toggle:** the tidied view comes back identical on every page after "Read it word for word" and "Read it tidied".

### Share at 320 (labels and attributes set in the DOM only; nothing pressed)

| State, 5963 (the widest row) | Row | Share button | Right edge |
|---|---|---|---|
| Rest: Treasured / Public / Share | 1 line | 205–298 | 298 |
| "Copied" with the check icon | 1 line | 205–298 (no change in width) | text ends at 287 |
| "Copy the address bar" (`data-result="fail"`) | wraps to 2 lines | 12–201 on line 2 | 292 |
| "Saving…" with `aria-busy="true"` | wraps to 2 lines | Share moves to line 2 | 292 |
| "Treasure it" / "Private" / "Copied" | 1 line | 214–306 | text ends about 296 |

Across all eight memories at rest:
- the row holds one line, ending at 298 to 302, with `scrollWidth` 320;
- the titles take 2 lines (f9b0 takes 1).

The live region is an empty `role="status"` span present from mount, so "Link copied" is announced. The accessible name "Share this memory" contains the visible "Share". At 1366 the min-width leaves 15px after "Share" against 12px before the icon, which is not visible.

**Not checked:** a real press (the clipboard write).

## Round 11, checked

| # | r11 skills gap | Now |
|---|---|---|
| 1 | The checker accepts forbidden cuts; five mutants pass | **Done.** Word boundary in (c), whole sentence and "straight after" in (e), (d) gone, corpus added and run with opening both ways. All five fail now. |
| 2 | "Yes, …" completes the 5963 shape | **Done.** `TELLER_ANSWERS` is exact; all five strings are fixtures; `FIRST_PERSON` is now tested (the R29 control fails). |
| 3 | A capital "A" collapsed as an article | **Done.** Articles are off the list; all strings are kept. |
| 4 | "Link copied" runs off at 320 | **Done.** See the table above. |
| 5 | A "Yeah," after a tag question | **Done.** `isQuestion` includes tags (N7 fails). A new form of the same fault is gap 1. |
| 6 | The teller's "Wow." in a named turn | **Done** (`named`, N18 fails). |
| 7 | "A:" or "Q:" inside a sentence | **Done for unlabelled text** (the `LABELLED` gate, N27 fails). It still happens inside a labelled transcript (gap 8). |
| 8 | A typed takeaway loses ", like," | **Done** (N26 fails). |

**r11 BAOS defects 1 to 8 are all closed:**
- The lifted line keeps "But for" and "So many".
- (d) is gone.
- The lift needs the exact reply.
- (b) is ", like," only.
- The closing ", yeah" is gone.
- "like so" stays.
- The capital "A" and "My, my" stay.
- "Copy the address bar" wraps at 320.

The smaller items are closed too: "mm" stays, and ";" and ":" do not open a slip. The three "for the lead" items ("Really?", "And you, you", "So it goes") are off the list now and stay.

## Gaps, skill by skill

### Ugly

1. **A sentence-opening "Yeah," that answers a reaction question is cut. The list forbids this.**
   - **Rules:**
     - 17a (a): a sentence-opening "Yeah," "that does not follow a question";
     - 17a: "never an answer";
     - impeccable harden.
   - **Where:** `transcript.ts`:168. After an (e) cut, `afterQuestion = false`, even when the cut sentence was a question ("Wait, were you?", "Yeah, right?").
   - **Evidence:** from `cleanSpeech`, explain:
     - "Wait, were you? Yeah, I was there the whole time." → "I was there the whole time." The cuts are e-reaction "Wait, were you?" and a-later "Yeah, ".
     - "Yeah, right? Yeah, it was crazy." → "It was crazy."
   - **The checker:** `breaksRule` rejects both cuts ("follows a question"). Neither string is in the corpus, so the suite passes. Across a paragraph break the code is right: `["Wait, were you?", "Yeah, I was there."]` keeps "Yeah,".
   - **Change:**
     - At :168, set `afterQuestion = isQuestion(s);`.
     - Add both strings to `R12_CUT` with the "Yeah," kept: "Wait, were you? Yeah, I was there the whole time." → "Yeah, I was there the whole time." The (e) "Yeah." rule is unchanged ("Wait, were you? Yeah. So I left." → "So I left.").

2. **A reaction the teller quotes is cut as the other person's, and the next sentence loses what it points at.**
   - **Rules:**
     - 17a (e): "the other person's reactions";
     - 17a: "Tidying a spoken memory never changes what was meant";
     - the brief: a cut on the letter that changes meaning is a defect.
   - **Where:**
     - `transcript.ts`:163–165: `bare = s.replace(/["“”]/g, "")` strips the quotation marks before `REACTION` is tested.
     - :286 does the same for the asked line.
     - The checker mirrors it at `transcript.test.ts`:875, so it is not caught.
   - **Evidence:**
     - `My mother opened the door. "Wow." That was all she said.` → `My mother opened the door. That was all she said.`
     - `She saw the ring. "That's amazing." Then she cried.` → `She saw the ring. Then she cried.`
     - `“Wow.” That was all.` → `That was all.`
   - **Change:**
     - Test `REACTION` on the sentence as said. A sentence in quotation marks is the teller quoting someone, and it stays.
     - Make `breaksRule`'s (e) reject a quoted sentence.
     - Add the three strings to `R12_KEEP`.

### Polish

3. **Nine new mutants pass the whole suite. The checker rejects each cut once given the input, so the gap is in the corpus.**
   - **Rules:**
     - the brief: every mutant fails;
     - 17a: "the tests check every cut against its rule";
     - impeccable harden.
   - **Where:** `keepCorpus`, `transcript.test.ts`:918–931, and the transcript fixtures.
   - **What survives, and the input that would catch it:**

     | Mutant | Add |
     |---|---|
     | N4 (a) the opening words grow to like/and/but | `R12_OPENING`: "Like, I loved it." and "And, we left." kept (`breaksRule`: "not yeah/well/okay/so with a comma") |
     | N8 the answer flag dropped across paragraphs | `R12_TRANSCRIPT`: `["Did you go back?", "Yeah, we went in 1990."]` kept |
     | N28 the opening rule applied to every teller paragraph | `R12_TRANSCRIPT`: `["We lived in Hue.", "So, we left in 1975."]` kept |
     | N15 (c) no boundary after the second copy | corpus: "I, I'm not sure.", "And, Andrew came." |
     | N17 (e) "Yes."/"Right." after a reaction | corpus: "Wow. Yes. We moved." keeps "Yes." |
     | N34 (e) a chain of "Yeah."s after one reaction | `R12_CUT`: "Wow. Yeah. Yeah. We moved." → "Yeah. We moved." |
     | N20 the lift without the asker going on | `R12_TRANSCRIPT`: "Did they stay long? They stayed two years. Yes. It was good." kept |
     | N21 a tag question lifted | `R12_TRANSCRIPT`: a question ending ", right?" followed by "Because our…" and then "Yes.", kept |
     | N30 a run-on full stop that eats a word | the run-on test (`transcript.test.ts`:85) checks only that a ". " appears. Add `onlyCutsRemoved`-style word equality on a 200-character run-on. |

   - **Proof:** direct `breaksRule` probes reject N4, N8, N15, N17, N28 and N34 with the reasons quoted above. N20, N21 and N30 have no checker; the fixtures are the check.

4. **The kept line can be the asker's sentence that the body sets as "We asked".**
   - **Rules:**
     - rule 32: one sentence of the person's own words;
     - 17a: the "We asked" shape;
     - impeccable harden.
   - **Where:** `keptLine`, `transcript.ts`:439–465. It reads `tellerTurns(all)`, which drops named turns only. It never runs `liftQuestions`, so it can choose the asker's going-on sentence.
   - **Evidence:**
     - Said: "I had a company. Do you take on students? We want people who love the work and never give up on it. For sure. I said that."
     - The body sets "We asked: Do you take on students? We want people…".
     - But `keptLine` returns "We want people who love the work and never give up on it.", which goes under the title, on the print and in Home's "From the book" as the teller's line.
     - `ownWords` leaves it out, so the card and the title disagree.
     - 5963 is safe today, because its going-on sentence opens on "Because", which `OPENS_WEAK` refuses.
   - **Change:** build the candidate sentences from the pieces `explainTranscript` marks `asked: false`, or skip any sentence `liftQuestions` lifts. Add the string.

5. **A teller's self-answered "why" question is lifted when "Yes." follows.**
   - **Rules:** 17a: "never a question the teller asks themselves"; "followed by the asker going on".
   - **Where:** `liftQuestions`, `transcript.ts`:231. `ASKER_GOES_ON` takes "Because our…" as the asker going on, even when it answers a why question.
   - **Evidence:** "Why did Grandpa leave Hue? Because our village was burned. Yes. We had one night." → "We asked: Why did Grandpa leave Hue? Because our village was burned." / "Yes. We had one night." The teller's answer leaves the card.
   - **Change:**
     - Lift only a yes/no question (do/did/is/are/can/could/would/will/have/has). 5963's "Do they open…?" is one.
     - Never lift a why/how/what question whose next sentence opens "Because".
     - Add the string, with 5963 as the counter-case.

6. **The teller's first word is dropped before its own double, which undoes the emphasis.**
   - **Rules:**
     - 17a: "never a word doubled for emphasis";
     - the brief: a cut on the list's letter that changes meaning is a defect.
   - **Where:** `OPENING_WORD`, `transcript.ts`:33.
   - **Evidence** (`opening: true`):
     - "So, so happy we were." → "So happy we were."
     - "Well, well, well, look at you." → "Well, well, look at you."
     - "Okay, okay, I'll tell you." → "Okay, I'll tell you."

     The same strings without `opening` are kept by the r9 and r10 fixtures.
   - **Change:**
     - Write the rule as `/^(yeah|well|okay|so),\s*(?!\1\b)/i`.
     - Mirror it in `breaksRule`'s a-opening.
     - Add the three strings to `R12_OPENING`, kept.

7. **A straight closing quote after a full stop is moved into the next sentence, or dropped.**
   - **Rules:**
     - 17a: "Everything not on this list stays";
     - impeccable craft-floor: real copy.
   - **Where:** `sentencesOf`, `transcript.ts`:97. Its closers are `["”’)]`, without the straight `'`. The stray `'` becomes a sentence of its own, and :188 drops it when it holds no letter.
   - **Evidence:**
     - "He said 'go home.' Then he left." → "He said 'go home. ' Then he left."
     - "She said, 'I love you.'" → "She said, 'I love you."
     - "And he was, like, 'Get out of my house.'" → "And he was 'Get out of my house."
   - **Change:**
     - Add `'` to the closers in `sentencesOf`, `sentenceSpans` (test) and the `[.!?…]+["”’)]*` patterns in `keptLine`, `takeaway` and `findTakeaway`.
     - Add the strings.

8. **Inside a labelled transcript, "A:" in mid-sentence is still read as a label, and the letter goes.**
   - **Rules:** 17a ("Everything not on this list stays"). This is r11 gap 7 in its remaining form.
   - **Where:** `TURN`, `transcript.ts`:63. It matches after any space.
   - **Evidence:** `["Me: We had plan A: we go north."]` → "We had plan we go north."
   - **Change:**
     - In `tellerTurns` and `namedTurns`, accept a label only at the start or after a sentence's end (`(?:^|[.!?…]["”’)]*\s+)`).
     - Add the string.

9. **Two small things in `transcript.ts`.**
   - **Rule:** impeccable harden.
   - **Where, evidence and change:**
     - **:503, the `takeaway` comment.** It still says the fallback drops a leading "I mean". `OUT_OF_CONTEXT` no longer does, so the comment should say "an opening So, And or But before a comma, a pronoun or 'the'".
     - **:96, `cap`.** It upper-cases a sentence's first letter even inside a word. "iPhone was new then. eBay too." → "IPhone was new then. EBay too." Only cap when the second letter is lower case too (`^(["“‘(]?)([a-z])(?=[a-z\s'’]|$)`).

### For the lead, not counted

These follow the list's letter. I would not change them without a ruling.
- **(b) takes the quoting "like" when commas set it off.** "I was, like, wow." → "I was wow." 17a's opening says "never the quoting or feeling 'like'", and (b) names ", like," without exception.
- **(a) takes both commas, including a list's own comma.**
  - "We had rice, um, beans and fish." → "We had rice beans and fish."
  - "Well, hmm, it was a long time ago." → "Well it was a long time ago." This one is a fixture.

  The list's example ("We were, uh, poor") takes both.
- **(e) takes the teller's own unquoted "That's amazing."** "My grandmother walked ten miles to school. That's amazing." → the judgement goes.

### Emil's review table

| Before | After | Why |
|---|---|---|
| `afterQuestion = false;` after an (e) cut | `afterQuestion = isQuestion(s);` | "Wait, were you? Yeah, I was there" is an answer |
| `bare = s.replace(/["“”]/g, "")` before `REACTION` | test the sentence as said | `"Wow."` in quotes is the teller quoting |
| `/^(yeah|well|okay|so),\s*/i` | `/^(yeah|well|okay|so),\s*(?!\1\b)/i` | "So, so happy" is emphasis |
| `[.!?…]+["”’)]*` | `[.!?…]+["”’)']*` | "…go home.' Then" keeps its quote |

## Brand rulings applied (the brand wins over the skill)

- The kickers, foil stop, wax seal and print veil are book material by DESIGN.md. Impeccable's eyebrow ban is not counted against them.
- f9b0's AI reply set as "We asked" is accepted by the lead and not counted.
- The kept line's joint before a comma, a pronoun or "the" is allowed by 17a, and I did not count it.

## Clean on this pass

- **Motion:** none changed. There is no `transition: all` or ease-in. The check icon swaps with no animation, which suits an action used this often. `:active` scale is kept.
- **States:** Share has rest, success (a check icon and "Copied" at a fixed width), failure (wrap plus the longer label) and an announced result. The privacy tool's Saving… is announced through `aria-busy` and wraps the row.
- **Sizes and edges:** nothing past the right edge, no text under 12px, and `scrollWidth` equal to the viewport on:
  - Home and the Archive at 320 and 1366;
  - all eight memories at 320.
- **Titles:** two lines or fewer at 320.
- **Home:** the prints show c21c's line, beee's typed lines and 342e's kept line. "From the book" quotes 342e.

## Not verified

- **Not pressed:** a real Share press and clipboard write, and the privacy menu.
- **Prints view:** the Archive Prints view. I did not press its button, to leave the stored view alone.
- **Other sizes:** 2560 and 3840 zoomed, and cold font loads, all unchanged this round.
- **Nhi's memory:** not opened.
- **Other agents' edits:** the working tree has uncommitted edits by other agents (Archive.tsx, Home.tsx, Shell.tsx, Write.tsx and others). The rendered pages include them, and so does the `tsc` failure in Write.tsx. I reviewed 606f1d3's code only.

## Shared state

- **Archive view:** the stored view (`astory.archiveView`) was "list" when I opened my tab, and it reads "list" now.
- **Sign-in:** `astory-app-auth` is present and I did not touch it. I did not sign out and wrote no data.
- **My writes:** all in my tab's memory:
  - the "Read it word for word" toggle, pressed and pressed back on 342e, 5963, f6a7 and f9b0;
  - the Share, privacy and Treasure label text and the `data-result` and `aria-busy` attributes set in the DOM to measure, then restored;
  - in-tab history navigation.
- **My tab:** tab-178's viewport was reset to desktop, and the tab is closed. The other tabs (tab-9, 73, 158, 167, 174, 176, 177) were not touched.
- **Scratchpad:** my mutation harness used a junction to `node_modules` there. I removed the junction with `rmdir`, and `node_modules` is intact.
