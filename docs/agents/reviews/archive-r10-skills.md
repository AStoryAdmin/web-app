# Skills Steward: the Archive, the memory page, and PrintCard, MemoryCard and Mosaic on Home, round 10

**Verdict: NOT APPLIED.** No blocker, three ugly, five polish. The pages pass:
- Titles hold two lines at every phone width and refit when the window is resized, in both directions.
- The rendition steps up on a zoom-only change and never steps down.
- Every round-9 gap and defect is closed.

The tidy does not pass when judged against 17a's closed list. It still removes words the list does not name. One of these is new this round: the verb "like" before any word ending in "-ed" ("I like fried rice" → "I fried rice"). The property test in `transcript.test.ts` does not enforce the list. It checks which words were removed, not why they were removed, so every removal outside the list that I found passes it.

## How this was checked

- **Skills read:**
  - taste-skill: SKILL.md (house rules, the headline rule: "Cut words. Then widen the measure. Size last.").
  - hallmark: responsive (320, 375 and 414 non-negotiable), slop-test (gates 10, 14, 26, 27, 34, 49 to 51) and interaction-and-states.
  - emil-design-eng: easing, the 300ms rule and frequency.
  - impeccable: craft-floor, polish and optimize (proper sizing).
  - GSAP skills: no motion changed, so I checked for regressions only.
- **Standards read:** BAOS-STANDARD.md 17a, read fresh with the closed list. Note that fef2402 itself widened (a) to the later "yeah," and the closing ", yeah". I judged against the text as it stands.
- **Reviews read:** archive-r9-skills.md and archive-r9-baos.md.
- **Code read:** all of fef2402 under `src/`, and the whole of `transcript.ts` (590 lines) and `transcript.test.ts` (594).
- **Tools run:**
  - `vitest run src/components/archive src/lib`: 9 files, 235 tests pass. `tsc --noEmit` exits 0.
  - Copies of `transcript.ts` from fef2402 and from fef2402^ under Node 24.18 in my scratchpad: about 70 new probes against each clause of the list, plus the test's own `offList` check run on my probes.
- **Live words:** for six memories (342e, 5963, f6a7, c21c, 0ced, 4592) I read the page's tidied text, pressed the page's own "Read it word for word", and diffed word by word. That button keeps no stored state. A read through `loadAccount` was refused by the permission system, so I used the page instead.
- **Rendered:** my own pane tab (tab-153), dpr 1.5.
  - Titles: all eight memories measured at 320, 360, 375 and 390, then one page resized live 375 → 320 → 599 → 800 → 375, with a font swap simulated in the tab.
  - Renditions: the Archive List at 1600×1000, then 2400×1500 (a zoom-only change), then back.
  - Home at 1366×768 and 390×844, the Archive and c21c at 390: text under 12px and anything past the right edge.

## The three things asked

**The tidy, judged against the closed list: it removes words the list does not name.** Gaps 1, 2, 4, 5, 6 and 7 below. On the six live memories, every removal is on the list, with one exception: the kept line drops its opening "So" (gap 7). In detail:
- 342e loses the opening "Yeah well so", the "like" in "like really really hard" and "and like worked" (b), "Wait, were you? Yeah." and the closing "Yeah." (e), "So we did like a," (d) and "that's, that's" (c).
- 5963 loses "Yeah," before "gaming", ", but yeah" (a), "Yeah, right?" and "Wow, that's amazing." (e).
- f6a7 loses the opening, later and "so yeah" (a), and "That's awesome." (e).
- c21c, 0ced and 4592 are now untouched: no toggle, the words as said. c21c keeps its opening "No".

**Does the property test enforce the list? No (gap 3).**

**The title fit and the step-up: both hold.**
- **Titles:** two lines for all eight at every width. Font size at each width:

  | Memory | 320 | 360 | 375 | 390 |
  |---|---|---|---|---|
  | c21c | 23 | 26 | 27 | 28 |
  | 342e | 25 | 29 | 30 | |
  | 5963 | 27 | 31 | 31 | |
  | f6a7 | 29 | 32 | 32 | |

  - "Ending the chat." takes one line. No title reached the 22px floor.
  - The treasured seal follows the type (1.15em, 35.6px at 31px).
  - Resized live from 375 to 320, c21c refit from 27px to 23px. At 599 it went back up to 32px; at 800 the inline size cleared to the stylesheet's 44px.
  - Each resize ran exactly two fits, and then it settled.
  - With the title's font swapped in the tab, it refit (to 22px). Restored, it went back to 27px and two lines.
- **Step-up:** at 1600×1000 the four List thumbnails were on 400. At 2400×1500 one `astory:zoom` fired with the frames unchanged at 168×170 CSS px, and all four swapped to 600 in place. Back at 1600 they stayed on 600.

## Round 9, checked

| # | Round-9 skills gap | Now |
|---|---|---|
| 1 | Comparing and hedging "like" dropped | **Done.** All 27 rows are fixtures and stand. |
| 2 | Refrains and emphasis collapsed | **Done.** Refrains, "So, so, so happy" and "Okay, okay" stand. 342e's "that's, that's" collapses live. The wider slip list over-reaches, though (gap 2). |
| 3 | Titles at three lines on phones | **Done.** See the measurements above. `data-long` is gone. |
| 4 | Answer after a paragraph break | **Done.** `afterQuestion` carries across paragraphs (fixture). |
| 5 | Step-up on zoom, density and real ratio | **Done for zoom (measured).** Density: `matchMedia(resolution)` is wired and matches at 1.5, not exercised live. Real ratio: `onLoad` checks cover at `naturalWidth/naturalHeight` and steps through `larger()`. That is correct by reading, but no photograph wider than 3:2 exists to test it live. |
| 6 | Guard and CSS leftovers | **Done.** The `catch` returns `null` across generations, `inflight` deletes only its own job, archive-reading.css:518 is gone, and the kicker computes 12px on Home. |

Round-9 BAOS defects 1 to 6 (answer handed to the asker, comparing like, quoting like, self-questions, emphasis, hedges before a time): **all fixed.** Every string is a fixture and stands. 5963's question is still the only "We asked" line.

## Gaps, skill by skill

### Ugly

1. **The verb "like" is dropped before any word ending in "-ed", and the list never names the verb. This regressed in round 10.**
   - **Rules:** BAOS 17a closed list (b), "before a verb after its subject", and "a removal outside the list is a defect"; `transcript.ts`:95–96, the code's own contract ("Every other 'like' stays… or is the verb").
   - **Where:** `transcript.ts`:412. `PAST_VERB` opens with `[a-z]+ed`, so "red", "Fred", "fried", "grilled" and "boiled" all count as verbs. :424 then drops the verb "like" after I/we/you.
   - **Evidence** (`cleanSpeech`; round 9 kept all of them):

     | Said | Shown |
     |---|---|
     | I like red cars. | I red cars. |
     | You like Fred, don't you? | You Fred, don't you? |
     | I like fried rice. | I fried rice. |
     | We like grilled fish on Sundays. | We grilled fish on Sundays. |
     | I like boiled eggs. | I boiled eggs. |

     Fried, grilled and boiled are adjectives here, and red is not a verb at all. "I like fried rice" becomes something the teller did, not something they enjoy.
   - **Change:**
     - Drop the `[a-z]+ed` catch-all. Keep only the closed irregular list, plus "-ed" words that are not followed by a noun.
     - Or require the verb to end its phrase or take an object pronoun, article or preposition: "and like worked a…", "we like went to…".
     - Add the five rows as fixtures.

2. **A pronoun or "is/was" that ends one clause and opens the next is collapsed as a slip, so two words become one and the sentence changes.**
   - **Rules:** 17a closed list (c), "a slip word said twice in a row (I, I / the the / and, and / that's, that's)". A grammatical double is not a slip.
   - **Where:** `transcript.ts`:172–173 (`SLIP`, `SLIP_TWICE`), applied at :224. It collapses any two adjacent copies, across a comma too. Some of these collapsed in round 9 as well; "is is" is new, from `was|is` joining the list.
   - **Evidence:**

     | Said | Shown |
     |---|---|
     | I'll never forget it, it was the best day. | I'll never forget it was the best day. |
     | That was it, it was over. | That was it was over. |
     | I love you, you know. | I love you know. |
     | Thank you, you saved us. | Thank you saved us. |
     | Then I saw her, her face was white. | Then I saw her face was white. |
     | I gave her her book. | I gave her book. |
     | What it is is a gift. | What it is a gift. |

   - **Change:**
     - Collapse an article ("the the", "a, a") anywhere.
     - Collapse any other slip word only when its first copy opens its clause: at the start of the sentence, after a comma, or after and/but/so/then/because. "I, I went", "And, and then" and "So that's, that's" still collapse.
     - Never collapse "her her", "is is" or "was was" with no comma between them.
     - Add the seven rows.

3. **The property test does not enforce the list: it checks which words were removed, not why.**
   - **Rules:** the brief ("check that the property test really enforces the list"); impeccable harden (tests prove the contract).
   - **Where:** `transcript.test.ts`:506–513 (`REMOVABLE`), :515–527 (`offList`), :529–551 (`WIDE`).
   - **Evidence:**
     - `REMOVABLE` is one flat set. It holds every slip word, "like", "so", "well", "is", "was", "were", "for", "of" (from "for sure" and "of course"), and "great", "fun", "wild", "nice", "true", "right", "see", "got" and "really".
     - Any of them may vanish from any position and the test passes. Every out-of-list output above passes `offList` with `[]`: "I red cars.", "That was it was over.", "Thank you saved us.", "I gave her book.", and gap 4's "in the for thirty years".
     - So do four mutants I wrote, any of which would be a defect:
       - "We were brothers" (the comparison gone);
       - "We stayed a year" ("like for" gone);
       - "It was a time and a one" ("wild" and "great" gone);
       - "Were you happy there? We." (the answer gone).
     - `WIDE` is 20 hand-written sentences, and it generates nothing.
   - **Change:**
     - Check where each removed word sat, not only which word it was. Have the tidy record the rule behind each cut in a test-only form, for example `cleanSpeech(text, { explain: true })` returning `[start, end, rule]` spans. Then assert that each span meets its rule:
       - (a) at the paragraph opening, or "yeah,"/"so yeah," opening a sentence, or ", (but) yeah" closing it;
       - (b) commas on both sides, or the next word an intensifier or "-ly" word, or after a subject and before a verb;
       - (c) equal to the next kept word, with the first copy opening its clause;
       - (d) a span the next clause restarts;
       - (e) a whole sentence.
     - Drop "for", "of", "see", "got", "great", "fun", "wild", "nice", "true", "were" and "is"/"was" from any free list.
     - Generate the corpus: each list word × the contexts that must keep it ("I like ___", "like ___" after be/sense verbs, "___, ___" across a clause, "So many", "the ER"), and cross it with the fixtures.

### Polish

4. **The filler pattern takes the letters out of real words: "ER", "UM", "mm".**
   - **Rules:** 17a closed list (a), "filler sounds (um, uh, er, hmm)". The ward and the unit are not sounds.
   - **Where:** `transcript.ts`:24 (`FILLER`, `/gi`). This predates round 10.
   - **Evidence:**
     - "She was a nurse in the ER for thirty years." → "She was a nurse in the for thirty years."
     - "He studied at UM." → "He studied at."
     - "We shot it on 8 mm film." → "We shot it on 8 film."
   - **Change:** skip a match written in capitals (`/\b[A-Z]{2,}\b/` in the source) and an "mm" after a digit. Add the three fixtures.

5. **The opening tidy treats an intensifying "so" and the noun "well" as throat-clearing, and drops the "Yeah." that answers an opening question.**
   - **Rules:** 17a (a), "an opening yeah/well/okay/so before the teller's first words", and "never an answer"; the code's own line 218 ("an answer keeps its yeah").
   - **Where:**
     - `transcript.ts`:32 (`OPENING_FILLER`), applied at :194–199.
     - `cleanTranscript`:309–319: `first` stays true past a "We asked" piece, so the answer is tidied as the opening.
   - **Evidence:**
     - "So many people died in the war." → "Many people died in the war."
     - "Well water was all we had in the village." → "Water was all we had in the village."
     - `["Interviewer: Did you go to school there? Me: Yeah. I went for two years."]` → "Did you go to school there?" / "I went for two years."
   - **Change:**
     - Strip an opening word only when punctuation, a pronoun, a determiner, a conjunction or a filler sound follows it (`(?=[,.]|\s+(?:i|we|my|our|the|a|it|there|when|um|uh|and|but)\b)`).
     - Pass `opening: false` when the piece follows a "We asked" line.
     - Add the three fixtures.

6. **In a transcript with named turns, the other person's non-question lines are dropped, including a prompt without a question mark.**
   - **Rules:** 17a (e) names only "the other person's back-channel lines". "Everything not on this list stays."
   - **Where:** `transcript.ts`:283–290 (`namedTurns` keeps only the lines that end on "?") and :72–85 (`tellerTurns`).
   - **Evidence:** `["Interviewer: That must have been so hard for your family. Tell me about your mother. Me: She was strong, yeah."]` → `["She was strong."]`. "Tell me about your mother." is the question, and it is neither shown nor set as "We asked".
   - **Change:**
     - Set an imperative prompt ("Tell me…", "Describe…", "Talk about…") as "We asked", like a question.
     - Drop only the other person's back-channel lines.
     - Or have the lead add "the other person's remarks" to (e). Add the fixture either way.

7. **The kept line drops its opening "So", "And", "I mean", "You know" or "Like,". That is outside the list, and it shows live.**
   - **Rules:** 17a closed list (a) allows an opening word only before the teller's first words. BAOS 32: the kept line is "one line of the person's own words".
   - **Where:** `transcript.ts`:498 (`OUT_OF_CONTEXT`), used at :465, :516 and :531.
   - **Evidence, live:**
     - 4592's head, card and coda read "The best way to learn finance is to build a business." The words say "So the best way…" (the gold mark starts lowercase, at "the best way").
     - 5963's reads "You always have to just look for every opportunity." from "So you always have to…".
     - In probes, "I mean, I loved this country…", "And I will always remember…", "You know, I always wished…" and "Like, I always loved…" all lose their first word or words.
   - **Change:** this is the lead's call. Either add "the joint a lifted line opens on" to the list (the round-8 design), or prefer kept lines that need no cut and keep the joint when one does. Today the code and the list disagree.

8. **A stacked seal size on phones.**
   - **Rules:** impeccable polish (no dead or duplicated rules).
   - **Where:** archive-reading.css:106 `.mv-title .seal { width: 32px !important; height: 32px !important }` is overridden by :643 `.mv-title .mv-seal { width: 1.15em !important; … }` (same specificity, later). The seal computes 35.64px at 31px type.
   - **Change:** delete the width and height in :106. Keep its `svg { width: 100%; height: 100% }`.

### For the lead, not counted

These removals are on the list's letter, but they change the sentence. They need a ruling, not a builder fix.
- **(b) catches the verb "like" before an intensifier:**
  - "I like really spicy food." → "I really spicy food."
  - "We like very simple things." → "We very simple things."
  - "I'd like just one more day with him." → "I'd just one more day with him."
  - "I would like very much to thank you." → "I would very much to thank you."
  - "Do it like so." → "Do it so."
  - A cheap guard: after a subject pronoun or "would/'d", keep "like" unless a verb follows the intensifier.
- **(e) says "in a transcript whose turns are known", but both of its examples come from unlabelled calls (342e and 5963).** So the code drops any back-channel-shaped sentence anywhere, including the teller's own:
  - "We were poor. Really. We had nothing." → "We were poor. We had nothing."
  - "It was hard. Definitely. But we made it.", "She was gone. Of course.", "My father came home. Right.", "Wow. I couldn't believe it." and "Okay. That's the story." lose the same way.
  - So does 342e's closing "Yeah.".
  - Either reword (e) to cover unlabelled calls, or limit it to labelled ones.
- **(a)'s closing ", yeah" also takes a tag:** "We were happy, yeah?" → "We were happy?".

### Emil's review table

| Before | After | Why |
| --- | --- | --- |
| `PAST_VERB` = `[a-z]+ed` or irregulars | Irregulars, plus "-ed" only before an object, article or preposition | "I like fried rice" is not "I fried rice" |
| Any adjacent slip word collapses | Articles always; others only when the first copy opens its clause | "forget it, it was" is two words |
| `FILLER` case-insensitive | Skip capitals, and "mm" after a digit | "the ER" is a place |
| `offList`: a bag of allowed words | Each cut carries its rule and its position | The test passes "I red cars." |
| Opening "so/well" before anything | Only before a pronoun, determiner, conjunction or punctuation | "So many" is the teller's |

## Brand rulings applied (the brand wins over the skill)

- The kickers (12px now), the foil stop, the wax seal and the print veil are book material by DESIGN.md. Impeccable's eyebrow ban and taste-lint's flags on them are not counted.
- The lead ruled the 22px title floor at 320 acceptable. No title needs it today (the smallest is 23px). Taste-skill's order (cut words, widen, size last) is moot for generated memory titles.

## Clean on this pass

- **Title fit:**
  - `useLayoutEffect`, so the fit lands before first paint.
  - The ResizeObserver disconnects on unmount.
  - Above 600px the inline size clears.
  - `599.98px` in JS matches the CSS bounds since 661617f.
  - The work is bounded: at most 10 steps of forced layout per fit, and two fits per resize.
- **Step-up:**
  - The `ZOOM_EVENT` and density listeners are both removed on cleanup.
  - The density query is re-armed after each change.
  - `onLoad` sets `data-loaded` and checks the real ratio, which ends at the original.
  - Both cards pass `onLoad` from the hook.
- **Sizes and edges:** nothing under 12px and no horizontal scroll on Home at 1366 and 390, the Archive at 390, or c21c at 390. Home's prints at 1366 (232px frames, dpr 1.5) ask for 600, which covers 522 device px for a landscape.
- **Motion:** no motion changed. No `transition: all`, no ease-in, no new GSAP.

## Not verified

- A cold font load: the swap was simulated in my tab by changing the title's font. The `document.fonts.ready` path is right by reading. `fit()` forces layout, which starts the load before `ready` is read.
- A real density change and a photograph wider than 3:2, both covered by reading only.
- The Archive Prints view: I did not press its button, to leave the stored view alone. PrintCard was checked on Home.
- Live words of beee (typed) and f9b0 (founder test content), and Nhi's memory.
- **The pane:** it was hidden. A background tab draws no frames, so the ResizeObserver and CSS fades sat still until I fronted my tab once. Even fronted, frames stopped again later, and I finished the photograph fades in script to read their opacity.

## Shared state

- The stored Archive view was "list" when I opened my tab, and it reads "list" now. I never pressed Prints or List.
- `astory-app-auth` is present and I did not touch it. I did not sign out and wrote no data.
- The only writes, all in my tab's memory: the "Read it word for word" toggle (pressed and pressed back on each page), and in-tab history navigation.
- tab-142 was the active tab when I started. I fronted tab-153 to let it draw frames. When I closed it, tab-151 became active, so I fronted tab-142 again. Someone else had closed tab-152 meanwhile.
- tab-153's viewport was reset to desktop, and the tab is closed.
