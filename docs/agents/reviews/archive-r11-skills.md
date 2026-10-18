# Skills Steward: the Archive, the memory page, and PrintCard, MemoryCard and Mosaic on Home, round 11

**Verdict: NOT APPLIED.** No blocker, four ugly, four polish.

What passes:
- Every live cut is on the narrowed list, and every round-10 gap and defect is closed.
- The rule checker catches the three mutants the brief names: a cut "like" after a pronoun, a cut "her" in "her her", and a cut "So" before "many".

What does not pass:
- **The checker does not fail every mutant.** Of 28 mutants that cut words, 5 pass the whole suite. Three of its rule checks are looser than the list's own wording.
- **Two new removals outside the list** come from this commit: a capital "A" collapsed as an article, and a "Yes, …" reply that moves the teller's own sentence into "We asked".
- **The new 320px rule for the head's tools pushes the "Link copied" message off the screen.**

## How this was checked

- **Skills read:**
  - taste-skill: house rules.
  - hallmark: responsive (320 non-negotiable, gate 34), interaction-and-states (the success state) and slop-test.
  - emil-design-eng: easing, 300ms and frequency.
  - impeccable: craft-floor ("Run the real copy at every breakpoint and fix what overflows") and harden.
  - GSAP skills: no motion changed, so I checked for regressions only.
- **Standards read:** BAOS-STANDARD.md 17a, read fresh, including the narrowed closed list (a) to (e), the "We asked" sentence and the kept-line joint. I judged against the list only.
- **Reviews read:** archive-r10-skills.md and archive-r10-baos.md.
- **Code read:** all of 1909a5b: `transcript.ts` (642 lines), `transcript.test.ts` (837) and the archive-reading.css diff.
- **Tools run:**
  - `vitest run src/components/archive src/lib`: 9 files, 283 tests pass. `tsc --noEmit` exits 0.
  - **Mutation testing:** I copied `transcript.ts`, its test and fixtures to my scratchpad and ran the real vitest there. I wrote 30 mutants (28 that cut words, plus 2 controls: the "We asked" lift and the kept-line joint) and ran the contract tests and then the whole suite against each one.
  - **Direct probes:** I appended a probe block that calls the test's own `breaksRule` on hand-made cuts, and I ran this commit's code and 1909a5b^ under Node 24.18 on about 40 strings.
- **Live words:** in my own tab (tab-169) I imported the page's `transcript.ts` through Vite. For each memory I pressed the page's own "Read it word for word" and back, then ran `explainTranscript` on the exact words. The tidied page matches `cleanTranscript` word for word on all three memories that show a "We asked" line or split paragraphs.
- **Rendered:**
  - All eight memories at 320×700: the head's tools, the title seal, and the copy-status labels set in the DOM.
  - Home and the Archive at 320 and 1366, and 342e at 1366: text under 12px and anything past the right edge.

## The things asked

**Does the rule checker enforce each item's exact condition? Mostly.** Every mutant below "fails" when the contract test (`round 11: the contract`) fails on it.

| Mutant | Contract | Caught by |
|---|---|---|
| (b) "like" after I/we/they/you/she/he | fails (486 lines) | `breaksRule`: "the word before is not and/but/so or a comma" |
| (c) "her her" collapsed | fails | `breaksRule`: "its first copy does not open the clause" |
| (c) any pronoun twice, no clause check | fails | `breaksRule` |
| (a) "So" before "many" | fails | `breaksRule`: "no comma, pronoun, the or filler after it" |
| (a) opening word before anything / in every sentence / in any paragraph | all fail | `breaksRule` |
| (a) "ER", "UM" taken / "8 mm" taken | both fail | `breaksRule` |
| (a) later "yeah," that answers / closing ", yeah" before "?" | both fail | `breaksRule` |
| (a) all of "Yeah well so" taken | fails | `breaksRule` |
| (b) "like" before any word / after any word / the verb before "-ed" / after feels, looks | all fail | `breaksRule` |
| (c) "big big", "hot hot hot" | fails | `breaksRule`: "not a slip word" |
| (c) "So, so happy" | fails | the crossed check only (the letter of (c) allows it) |
| (d) a short clause restarted with no break-off | fails | `breaksRule`: "does not break off" |
| (d) a prefix that does not break off ("Every day, every day") | fails | **the keep-context check only**; `breaksRule` accepts it |
| (d) "an A," read as a break | fails | `breaksRule` |
| (e) the teller's "Really." / "Definitely." | fails | `breaksRule` |
| A word dropped with no cut recorded | fails | `onlyCutsRemoved` |
| (c) an article repeated inside a word ("the theater", "an anthem") | **passes the whole suite** | no input; `breaksRule` accepts it too |
| (e) a "Yeah." after any earlier reaction | **passes the whole suite** | no input; `breaksRule` accepts it too |
| (e) the reaction words cut from a longer sentence ("That's great news…") | **passes the whole suite** | no input; `breaksRule` accepts it too |
| (a) a later "yeah," in mid-sentence | **passes the whole suite** | no input; `breaksRule` rejects it once one is added |
| (c) "that's, that's" that does not open its clause | **passes the whole suite** | no input; `breaksRule` rejects it once one is added |
| Control: a first-person question lifted as "We asked" | passes the whole suite | not a cut; nothing tests `FIRST_PERSON` (gap 2) |
| Control: kept line drops "You know," or "Like," | contract passes | a fixture catches it |

**The live memories: every cut is on the list.**
- **5963:**
  - "Yeah," opening a later sentence (a);
  - "Yeah, right?" and "Wow, that's amazing." (e);
  - ", but yeah" (a).
  - "We asked" is the asker's question with "Because our strategy…", in the 5963 shape.
- **342e:**
  - "Wait, were you?" and the "Yeah." straight after it (e);
  - "So we did like a," (d);
  - "that's," (c).
  - The opening "Yeah well so" now stays, because "well" is not a word the list lets follow it.
- **f6a7:**
  - the opening "Yeah," (a);
  - a later "Yeah," and "So yeah," (a), neither after a question;
  - "That's awesome." (e).
- **c21c, 0ced, 4592:** nothing cut, and no toggle.
- **beee:** typed, untouched.
- **f9b0:** the AI's reply is set as "We asked", as the lead accepted.
- **Takeaways:** they match round 10. 4592 and 5963 drop one opening "So", which the list now allows.

**archive-reading.css:**
- **The seal:** the stacked 32px rule is gone. On 5963 at 320, the seal computes 1.15em (31.04px at 27px type), and the title holds two lines.
- **The 320 head tools:** at rest, the row holds on one line on all eight memories ("Treasure it" 113, "Public" 84, "Share" 80; 3px to spare), and the first icon sits on the title's edge at x=20. The status the same button shows does not fit (gap 4).

## Round 10, checked

| # | Round-10 skills gap | Now |
|---|---|---|
| 1 | The verb "like" before "-ed" words | **Done.** (b) is narrowed, and all five rows are fixtures. |
| 2 | Pronoun and "is/was" doubles collapsed | **Done.** All seven rows are fixtures and stand. |
| 3 | The property test does not enforce the list | **Mostly done.** Cuts carry `[start, end, rule]`, and `breaksRule` is written from the list. The remaining holes are gap 1. |
| 4 | "ER", "UM", "mm" | **Done.** |
| 5 | Opening "So many" / "Well water", and an answer's "Yeah." | **Done.** |
| 6 | The other person's prompt or remark dropped | **Done.** It is set as "We asked". |
| 7 | The kept line drops its joint | **Done by ruling.** The list now allows one of So, And, But, I mean. "You know," and "Like," stay (fixture). |
| 8 | Stacked seal size | **Done.** |

Round-10 BAOS defects 1 to 7 (the verb "like", the comparing "like" after feels and before names, a first-person question lifted, "ER/UM/mm", "her her" and "was was", opening "So/Well", "an A,"): **all fixed**, and every string is a fixture. The 320 "Share" wrap the BAOS review raised for the lead is fixed at rest (gap 4 covers the status).

## Gaps, skill by skill

### Ugly

1. **The rule checker accepts cuts the list forbids, and five mutants pass the whole suite.**
   - **Rules:** the brief ("the checker fails every mutant"); BAOS 17a ("the tests check every cut against its rule"); impeccable harden.
   - **Where, and what to change:**
     - **(c), `transcript.test.ts`:719.** `after.startsWith(w)` has no word boundary. It accepts a cut "the " before "theater", "a " before "another", and "it, " before "it's". Require `w` followed by a non-letter: `new RegExp(\`^${w}(?![\\p{L}'’])\`, "iu")`.
     - **(e), :739.** It checks only that the cut starts the sentence. It accepts "Wow" cut from "Wow, we were lucky." and "That's great" cut from "That's great news for us." Also require `b` to be the sentence's end.
     - **(e), :741.** A "Yeah." passes after any earlier reaction in the paragraph. The list says "straight after one of them". Require the reaction cut to end at the sentence just before this one.
     - **(d), :731.** The prefix branch accepts a clause that does not break off: "Every day, every day she called." and "We laughed, we laughed and cried." Item (d) is "a broken-off clause". Require the clause to end where no clause can end, as the code does at `transcript.ts`:193.
     - **Coverage, :764–777 and :795–796.**
       - Add to `keepCorpus`: a word that starts with an article ("We went to the theater.", "She sang an anthem."), a mid-sentence "yeah," ("We were poor and yeah, we were happy."), a contraction twice inside a clause ("I think that's, that's why we left."), "That's great news for us.", "Wow, we were lucky." and "Wow. We left that night. Yeah.".
       - Run every corpus line with `opening: true` as well. Today "So many…", "Well water…", "Okay then…" and "Well done…" in the corpus are only ever checked with `opening: false`, so they never test (a)'s opening rule.
   - **Proof:** with the inputs added, the mid-sentence "yeah," and the contraction mutants fail in `breaksRule`. The article and "Yeah." mutants fail only through the keep-context check, and direct `breaksRule` probes return accepted for all five loose cases above.

2. **A reply that opens "Yes, …" completes the 5963 shape, so the teller's own reason is set as "We asked" and leaves their words. This is new in 1909a5b.**
   - **Rules:** 17a ("in the shape where the asker goes on and the teller answers with 'For sure.' or 'Yes.'"; "never a question the teller asks themselves… never an answer").
   - **Where:** `transcript.ts`:69, `TELLER_ANSWERS = /^(?:for sure|yes)\b/i`. It matches any sentence that starts with "Yes". At 1909a5b^ these strings were kept whole.
   - **Evidence** (`cleanTranscript`):

     | Said | Shown |
     |---|---|
     | "Was it hard? Because our family had nothing. Yes, it was very hard for all of us." | "We asked: Was it hard? Because our family had nothing." / "Yes, it was very hard…" |
     | "Did they let you stay? Because our visas ran out that spring. Yes, we stayed two more years." | "We asked: … Because our visas ran out that spring." |

     In both, `ownWords` (the card's words) loses the teller's "Because…" sentence.
   - **Change:**
     - Match the whole reply: `/^(?:for sure|yes)[.!]["”’)]*$/i`. 5963's "For sure." still lifts.
     - Add both strings.
     - Add a first-person question whose reply is "Yes.", because no test exercises `FIRST_PERSON` (the control mutant that drops it passes all 247 tests).

3. **A capital "A" followed by the article "a" is collapsed as "an article said twice".**
   - **Rules:** 17a (c), "an article said twice ('the the', 'a, a')". A grade or a plan letter is not an article. This is the round-10 "an A," defect in a new place.
   - **Where:** `transcript.ts`:44, `ARTICLE_TWICE` is `/gi`.
   - **Evidence:**
     - "We had plan A, a backup plan and a prayer." → "We had plan a backup plan and a prayer."
     - "She got an A, a real A." → "She got an a real A."
   - **Change:**
     - Take a capital "A" as an article only where it opens a sentence or clause ("A, a man came in"). Elsewhere, match lowercase only.
     - Mirror the rule in `breaksRule`'s (c).
     - Add both strings.

4. **At 320 the head's tools can no longer wrap, so the Share button's status runs off the screen.**
   - **Rules:**
     - impeccable craft-floor ("Run the real copy at every breakpoint and fix what overflows");
     - hallmark responsive (320 is non-negotiable; nothing past the edge);
     - hallmark states (the success state must read).
   - **Where:** archive-reading.css:647–650 (`.mv-state { flex-wrap: nowrap }` below 360px), with the labels in `MemoryPage.tsx`:245–247.
   - **Evidence** (all eight memories at 320×700; the label set in the DOM):
     - "Link copied" makes the button 121px wide, ending at x=331 on a 320 viewport. A screenshot shows "Link copiec" cut at the edge.
     - "Copy the address bar" ends at x=399.
     - The row at rest has 3px to spare, so any label longer than "Share" overflows.
   - **Change:**
     - Below 360px, keep the label "Share" and show the result as the icon turning to a check, with the status text visually hidden but still announced.
     - Or allow wrapping again only while a status is shown.
     - Measure "Link copied", "Copy the address bar" and "Saving…" at 320.

### Polish

5. **After a tag question, the code cuts a "Yeah," that the checker says answers a question.**
   - **Rules:** 17a (a), "that does not answer a question"; "When in doubt it keeps the words."
   - **Where:** `transcript.ts`:61 and :252. `isQuestion` excludes tags, so `answering` stays false.
   - **Evidence:** "It was good, right? Yeah, it was." → "It was good, right? It was." `breaksRule` rejects the cut ("answers a question"). Add this string as a fixture and the contract fails today.
   - **Change:** treat a tag question as a question for `answering` (keep the "Yeah,"). Add the fixture.

6. **In a labelled transcript, the teller's own "Wow." is cut as the other person's reaction.**
   - **Rules:** 17a (e), "the other person's reactions". When the turns are named, the code knows who spoke.
   - **Where:** `transcript.ts`:223. `tidyParagraph` applies (e) to the teller's own turns from `namedTurns`.
   - **Evidence:** "Interviewer: What happened? Me: Wow. It was a long time ago." → "We asked: What happened?" / "It was a long time ago."
   - **Change:** pass a flag from `namedTurns` so the teller's pieces skip (e). Add the string.

7. **"A:" or "Q:" inside a sentence is read as a speaker label, and the letter goes.**
   - **Rules:** 17a ("Everything not on this list stays").
   - **Where:** `transcript.ts`:73 (`TURN`). This predates the round (ded62f3).
   - **Evidence:** "Plan A: we go north. Plan B: we stay." → "Plan we go north. Plan B: we stay.", in `cleanTranscript` and `ownWords` alike.
   - **Change:**
     - Accept a label only at the start of a line or after a sentence's end.
     - Or require one label from the other person's set somewhere in the text.
     - Add the string.

8. **A typed memory's fallback takeaway loses its ", like,".**
   - **Rules:** 17a (the tidy is for spoken memories; typed words stay as typed).
   - **Where:** `transcript.ts`:610, where `dropFillerLike` runs on typed text too.
   - **Evidence:** typed "It was, like, so cold that winter in Hanoi." → its takeaway is "It was so cold that winter in Hanoi."
   - **Change:** apply `dropFillerLike` only when `spoken`. Add the string.

### For the lead, not counted

These cuts follow the letter of the list but change what was meant:
- **(a)'s closing ", yeah" takes a quoted answer.** "And she asked if I would marry her, and I said, yeah." → "…and I said."
- **(b) after "and" takes the verb when the subject is dropped.** "I cook and like really spicy food." → "I cook and really spicy food." The list also says "the verb 'like' never goes".
- **The server tidy:** `serverTidy.ts` is off (`VITE_TIDY_FROM_SERVER`). If it is turned on, `keepsTheirWords` allows "a few" words dropped beyond the list.

### Emil's review table

| Before | After | Why |
| --- | --- | --- |
| `TELLER_ANSWERS = /^(?:for sure\|yes)\b/i` | `/^(?:for sure\|yes)[.!]["”’)]*$/i` | "Yes, it was hard" is the teller's answer, not the 5963 shape |
| `ARTICLE_TWICE` with `/gi` | Lowercase, or a capital "A" only where it opens a clause | "plan A, a backup plan" is not "a, a" |
| `.mv-state { flex-wrap: nowrap }` at 320 | A check icon plus a hidden status, or wrap while a status shows | "Link copied" runs off the screen |
| `after.startsWith(w)` in the checker | `w` and then a non-letter | "the theater" is not "the the" |

## Brand rulings applied (the brand wins over the skill)

- The kickers, foil stop, wax seal and print veil are book material by DESIGN.md. Impeccable's eyebrow ban is not counted against them.
- The lead accepted f9b0's AI reply as a "We asked" line, and I did not count it.
- The kept line's single joint word (So, And, But, I mean) is allowed by 17a now, and I did not count it.

## Clean on this pass

- **Motion:** none changed. There is no `transition: all` or ease-in, and no new GSAP.
- **Sizes and edges:** no text under 12px and nothing past the right edge on:
  - Home and the Archive at 320 and 1366;
  - 342e at 1366;
  - all eight memories at rest at 320.
- **Home:** "From the book" quotes 342e's kept line.

## Not verified

- **Labels:** "Saving…" and "Private" in the head row at 320. The label span was not found by my selector.
- **Cold load:** a cold font load, the density listener and the real-ratio step-up, unchanged this round.
- **Prints view:** the Archive Prints view. I did not press its button, to leave the stored view alone.
- **Nhi's memory:** not opened.
- **Other agents' edits:** the working tree has uncommitted edits by other agents (Archive.tsx, Home.tsx and others). The rendered pages include them. I reviewed 1909a5b's code only.

## Shared state

- **Archive view:** the stored view was "list" when I opened my tab, and it reads "list" now.
- **Sign-in:** `astory-app-auth` is present and I did not touch it. I did not sign out and wrote no data.
- **My writes:** all in my tab's memory:
  - the "Read it word for word" toggle, pressed and pressed back on each page;
  - the Share and Public label text set in the DOM to measure, then restored;
  - in-tab history navigation.
- **My tab:** tab-169's viewport was reset to desktop, and the tab is closed. tab-158 was the active tab before and after.
- **Scratchpad:** my mutation harness used a junction to `node_modules` there. I removed the junction with `rmdir`, and `node_modules` is intact.
