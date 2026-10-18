# Archive, memory page and Home's prints, round 11 (Bao's Standard)

**FAIL**

The pages pass at every size. All seven round-10 defects are fixed, and so are the round-10 skills gaps. On the live memories, every cut is on the narrowed list, meets its rule's exact condition, and keeps what was meant. The page shows exactly the local tidy, and the 320 "Share" row holds on one line.

The tidy still makes six kinds of cut outside the narrowed list, and two more on the list's letter that change what was meant. No live memory triggers any of them. The worst is the lifted line:
- "But for my mother, we would never have made it here." is shown under the title, on the card, on Home and in the coda as "For my mother, we would never have made it here." That reverses what the teller meant.
- 17a lets that line drop "one opening joint word". The "But" in "but for" is not a joint.

There is also one new layout fault, from this round's 320 fix. Share's fallback label runs 67px off the screen at 320.

Scope: `/archive` in Prints and List, `/archive/:id` for all eight memories in Bao's story plus a missing id, and Home's prints and "From the book". Nhi's memory was not opened.

## How I checked

- **Reading.** I read `docs/BAOS-STANDARD.md` fresh, with 17a's closed list as narrowed for this round, and DESIGN.md's craft rules. I read `archive-r10-baos.md`, `archive-r10-skills.md`, commit 1909a5b (`transcript.ts`, `transcript.test.ts`, `archive-reading.css`), and the whole of the current `transcript.ts`, including the contract test's `breaksRule`.
- **Tests.** `vitest run src/components/archive src/lib`: 9 files, 283 tests pass. `tsc --noEmit` exits 0.
- **The basis.** I judged against the list only:
  - A cut outside items (a) to (e), or outside the "We asked" and lifted-line sentences, is a defect.
  - A filler the list misses is not.
  - A cut on the list's letter counts only when it changes what was meant. 17a opens with "Tidying a spoken memory never changes what was meant."
- **Test strings.** I ran a copy of the current `transcript.ts` under Node 24.18 and read every cut with `cleanSpeech(text, { explain: true })` and `explainTranscript`. The strings were:
  - all 38 strings from both round-10 reports;
  - about 45 new ones, written only to find a cut outside the list or a change of meaning.
- **The live words.** In my own tab I loaded the account read-only with the app's own `loadAccount`. I ran each memory the way `MemoryPage` does: `paragraphsOf`, then `wasSpoken`/`soundsSpoken`, then `explainTranscript`.
  - I checked every recorded cut against its rule's exact condition.
  - I checked that the words outside the cuts are exactly the shown words.
  - I diffed the rendered `.mv-para` text against `cleanTranscript`, word by word, at all five sizes.
  - The server tidy is off (`VITE_TIDY_FROM_SERVER` is unset), so the page shows the local tidy.
- **Browser setup.** My own tab (tab-162), with the founder signed in. The sizes were 1366×768, 1920×1000, 2560×1300 (html zoom 1.3), 800×1024 and 390×844 (dpr 2), plus 320×700 for the state row.
  - I loaded fresh after each resize and also dispatched a `resize` event.
  - On each page I stepped GSAP and ScrollTrigger, scrolled to the end and back with 250ms pauses and a 1.2s rest, finished CSS animations, and set lazy images to eager.
- **What I measured,** with getBoundingClientRect and computed styles:
  - horizontal scroll, and anything past the right edge not inside a clipping parent;
  - text under 12px, clipped text, and text left under half opacity;
  - images that failed to load, and targets under 44px (pseudo-element hit areas checked by hand);
  - title lines (height ÷ line height ÷ zoom) and size, and the foil stop;
  - the kept line's head, mark and coda;
  - "Memory n of 8", Previous and Next, and "Where to next";
  - the state row's lines, the grid columns, and each photograph's natural size against its frame.

## Round 10, checked

**Bao's Standard round 10 (archive-r10-baos.md): all seven fixed.** Every string from that report now comes out unchanged, apart from the filler in "We were, uh, poor.", which (a) allows.

| # | Round 10 defect | Now |
|---|---|---|
| 1 | The verb "like" dropped ("I'd like just…", "I like fried rice") | **Fixed.** All ten strings stand. |
| 2 | A comparing "like" after feels/looks, or before "Beverly" or "Sicily" | **Fixed.** All five stand. |
| 3 | A teller's own question lifted as "We asked" | **Fixed** for both strings. A new shape of it is defect 3. |
| 4 | "ER", "UM", "8 mm" taken as filler; the comma left behind | **Fixed.** "We were, uh, poor." → "We were poor." |
| 5 | "her her", "was was" collapsed | **Fixed.** All three stand. |
| 6 | "So many", "Well water" taken as an opening filler | **Fixed** in the tidy, under `opening: true` and through `cleanTranscript`. The lifted line still drops such a "So" (defect 1). |
| 7 | "an A," read as a broken-off clause | **Fixed.** "I got an A, I was so proud." stands. The same capital "A" is still taken for an article elsewhere (defect 7). |

**The skills review, round 10 (archive-r10-skills.md):**

| # | Gap | Now |
|---|---|---|
| 1 | The verb "like" before "-ed" words | **Closed.** All five rows stand. |
| 2 | Pronoun or "is/was" across a clause collapsed | **Closed.** All seven rows stand. |
| 3 | The property test checks which words, not why | **Closed in form.** Every cut carries `[start, end, rule]`, `breaksRule` checks it, and `onlyCutsRemoved` proves nothing else goes. But `breaksRule` copies the code's own stand-ins for the list's words, so it passes the cuts in defects 2, 4, 5 and 7. See the fixes below. |
| 4 | "ER", "UM", "mm" | **Closed.** |
| 5 | "So many", "Well water", and the "Yeah." answering a labelled question | **Closed.** `["Interviewer: Did you go to school there? Me: Yeah. I went for two years."]` keeps "Yeah.". |
| 6 | A labelled prompt with no question mark dropped | **Closed.** "Tell me about your mother." is set as "We asked". |
| 7 | The kept line drops its opening joint | **Closed by the lead's wording** ("one opening joint word (So, And, But, I mean)"). The code takes the word whether or not it is a joint (defect 1). |
| 8 | Stacked seal size on phones | **Closed.** The 32px rule is gone; the seal follows the type. |

## Every live memory against its exact words

Every cut below meets its rule's exact condition. The words outside the cuts equal the shown words in every piece (zero unrecorded removals). The rendered body equals `cleanTranscript` at all five sizes.

- **342e4b40.**
  - Removed: "Wait, were you?" (e), the "Yeah." straight after it (e), "So we did like a, " before "we built a psychometric…" (d, the 17a example), and "that's, " in "So that's, that's kind of why" (c; the first copy follows "So").
  - "like right out of the gate" and "but like," with a comma on one side stay, as the narrowed list says.
- **59632e67.**
  - Removed: "Yeah, " opening "gaming and mental health" (a; the sentence before is "So we did all these cool things.", not a question), "Yeah, right?" and "Wow, that's amazing." (e), and ", but yeah" closing "…what my parents did" (a).
  - The one "We asked" line is "Do they open to non-students as well? Because our strategy right now is…", answered with "For sure." That is the list's shape.
- **f6a734be.**
  - Removed: the opening "Yeah, " (a; it is the teller's first word, and a comma follows).
  - Also removed: "Yeah, " and "So yeah, " opening later sentences that answer nothing (a), and "That's awesome." (e).
- **c21cf4d4, 0ced62a7, 459228bd.** Nothing is removed.
- **beeedb62.** Typed and untouched. The lines keep their breaks.
- **f9b0e6e9.** No cuts. The AI's reply is set as a "We asked" line, which the lead has accepted as founder test content.
- **Takeaways:**
  - 4592: "The best way to learn finance is to build a business." It drops "So", which is a joint here.
  - 5963: "You always have to just look for every opportunity." It drops "So", also a joint.
  - c21c: "My grandfather was a police officer and he was a good man."
  - 342e: "I thought we were gonna raise money like right out of the gate." Home's "From the book" quotes it.
  - f6a7: "I want to help growing ventures because I get to work with startups."
  - 0ced: its long "When I heard that idea…" line.

## Defects, worst first

Defects 1 to 7 are proven on strings under Node, importing `transcript.ts` directly. No live memory triggers them. Each is a cut the narrowed list does not name, or one that changes what was meant. Defect 8 is measured live.

1. **The lifted line drops an opening "But" or "So" that is not a joint, and the meaning reverses or breaks.**
   - Where: `OUT_OF_CONTEXT` (`/^(?:so|and|but|i mean),?\s+/i`) in `src/components/archive/transcript.ts`, used by `takeaway` and `findTakeaway`. It takes the word before anything.
   - Sizes: all. The line is shown under the title, on the print and List card, in Home's "From the book" and as the coda.
   - Evidence (`takeaway`, Node):
     - "But for my mother, we would never have made it here." → "For my mother, we would never have made it here." The same happens for a typed memory.
     - "So many of us never saw our families again, and I think about it." → "Many of us never saw our families again, and I think about it."
     - "So much of what I know, I learned from her kitchen." → "Much of what I know, I learned from her kitchen."
     - "So long as we were together, we were happy, all of us." → "Long as we were together, we were happy, all of us."
   - Rule: 17a, which allows the lifted line to drop "one opening joint word (So, And, But, I mean) and nothing else". A "But" in "but for", or a "So" before many, much or long, is not a joint, and (a) itself keeps "So many people died". Also rule 32.
   - Fix:
     - Drop the word only when a comma, a pronoun, "the", "then" or "that's" follows it.
     - Never drop "but" before "for", and never drop "so" before many, much, few, little, long, far or that.
     - Add the four strings.

2. **A restart cut takes a whole earlier clause with it: "I left and I took my, I took my sister." → "I took my sister."**
   - Where: `restartCuts` in `transcript.ts`, the `restart` branch. The cut runs from the previous comma, so everything since then goes, not only the broken-off clause.
   - Sizes: all.
   - Evidence (`cleanSpeech`, explain):
     - "I left and I took my, I took my sister." → "I took my sister." The cut is `d-restart "I left and I took my, "`.
     - "We met and we had our, we had a small wedding." → "We had a small wedding."
     - "I cried and I said a, I said a prayer." → "I said a prayer."
   - "I left", "we met" and "I cried" were said whole and never restarted. The contract test passes these cuts, because `breaksRule` accepts the whole comma-part.
   - Rule: 17a (d), "a broken-off clause the speaker restarts in their own next words". "Everything not on this list stays."
   - Fix:
     - Cut only from the last clause opening inside the part (after its last and/but/so/then/because, or its start) to the comma. "So we did like a, " still goes whole.
     - Make `breaksRule` require the cut to start there.
     - Add the three strings.

3. **"We asked" is set when the reply only starts with "Yes" or "For sure", so a teller's answer is credited to the interviewer and leaves the card.**
   - Where: `TELLER_ANSWERS` (`/^(?:for sure|yes)\b/i`) in `liftQuestions`.
   - Sizes: all.
   - Evidence (`cleanTranscript`, and `ownWords` for the card):
     - "…lived by the river in Hue. Why did Grandpa leave Hue? Because our village was burned. Yes, it was terrible. We had one night to pack." → "[We asked] Why did Grandpa leave Hue? Because our village was burned." The card reads "…by the river in Hue. Yes, it was terrible. We had one night to pack."
     - "What did they do in Saigon? Because our family had a shop there. Yes, my father sold rice, I think." is lifted the same way.
     - "How did they meet? And our grandmother always said it was at the market. For sure it was the market." is lifted the same way.
   - Rule: 17a, "in the shape where the asker goes on and the teller answers with 'For sure.' or 'Yes.'", and "never an answer".
   - Fix:
     - Lift only when the reply sentence is exactly "For sure." or "Yes." (`/^(?:for sure|yes)[.!]*$/i`). 5963's "For sure." still lifts.
     - Add the three strings, with 5963 as the counter-case.

4. **The verb "like" goes after "but" or "and" before an intensifier, and the sentence reverses.**
   - Where: `likeCuts` in `transcript.ts`. Any "and/but/so" before "like" passes, even when "like" is the verb of a second predicate.
   - Sizes: all.
   - Evidence:
     - "My kids hate vegetables but like really spicy food." → "My kids hate vegetables but really spicy food."
     - "We never drank but like really strong coffee." → "We never drank but really strong coffee."
   - Rule: 17a (b), "the verb 'like' never goes".
   - Fix:
     - After and/but, keep "like" when the intensifier is followed by an adjective and a noun ("really spicy food"), or when the clause before has a verb with no object.
     - Simpler: after and/but, take "like" only when a verb or a verb-ending word follows the intensifier ("and like really worked", "but like just went").
     - Add the two strings.

5. **", yeah" closing a sentence is removed when it is someone's quoted answer.**
   - Where: `CLOSING_YEAH` in `transcript.ts`.
   - Sizes: all.
   - Evidence:
     - "My father asked my mother to marry him, and she said, yeah." → "…and she said."
     - "We asked if we could stay. Dad said, yeah." → "Dad said."
   - This is on (a)'s letter. It drops an answer and leaves a broken sentence.
   - Rule: 17a, "never changes what was meant… never an answer".
   - Fix:
     - Never take ", yeah" or ", but yeah" after said, says, asked, answered, told, replied or went.
     - Add the two strings.

6. **A comparing "like" before "so many", and the "like so" of "in this way", are removed.**
   - Where: `likeCuts`, which takes ", like" before "so".
   - Sizes: all.
   - Evidence:
     - "We came here with nothing, like so many others." → "We came here with nothing, so many others."
     - "We came by boat, like so many families did." → "We came by boat, so many families did."
     - "And like so many Vietnamese families, we lost everything." → "And so many Vietnamese families, we lost everything."
     - "You fold the dough, like so." → "You fold the dough, so."
   - This is on (b)'s letter, and the comparison is lost. These are likely sentences in an immigrant family's story.
   - Rule: 17a, "never changes what was meant".
   - Fix:
     - Take "like" before "so" only when an adjective or adverb follows "so" ("like so tired").
     - Never take it before "so many", "so much" or "so" ending the clause.
     - Add the four strings.

7. **A capital "A" (a grade or a letter) is taken for an article, and "My, my" for a stammer.**
   - Where: `ARTICLE_TWICE` (case-insensitive) and `OPENER_TWICE` (holds "my"), with `restartCuts`, in `transcript.ts`.
   - Sizes: all.
   - Evidence:
     - "I got an A, a B and two Cs." → "I got an a B and two Cs."
     - "We had a plan A, a plan B and a plan C." → "We had a plan a plan B and a plan C."
     - "In school I got an A a lot." → "In school I got an a lot."
     - "My, my, how times have changed." → "My, how times have changed."
     - "My, my, my, look at you." → "My, look at you."
   - Rule: 17a (c), which names an article and a pronoun said twice, not a grade or the interjection "my"; and "never a word doubled for emphasis". Rule 1: round 10's defect 7 fixed the capital "A" in `BREAKS_OFF` only.
   - Fix:
     - Match a capital "A" or "An" as an article only at a sentence start.
     - Collapse "my" only when a noun follows the second copy ("my, my mother"), never before a comma.
     - Add the five strings.

8. **At 320, Share's fallback label runs 67px off the screen, because the row no longer wraps.**
   - Where: `archive-reading.css`, the new `@media (max-width: 359.98px) { .mv-state { flex-wrap: nowrap; … } }`. `MemoryPage.tsx` sets "Link copied" or "Copy the address bar" in place of "Share" for 3s.
   - Size: 320×700.
   - Evidence: I set the status span's text in my tab on 5963 (Treasured, so the widest row) and measured. Nothing was clicked.
     - "Share": the row ends at 285 to 289.
     - "Link copied": the text ends at 319, 1px from the edge.
     - "Copy the address bar": the text ends at 387, against a 320 viewport. No scrollbar appears, because html clips, so the words are cut off.
   - Rule: checklist (no clipped text; error and success states designed); 17a.
   - Fix:
     - Keep the button's width fixed and show the result as the icon's state plus a shorter word ("Copied", "Copy the URL").
     - Or let the row wrap only while a result shows.

**Smaller, not ranked:**
- "It was eight mm film." loses "mm" (a). The list's own "8 mm" guard skips only digits.
- (c) also collapses after ";" and ":" ("I said: you, you are my son." → "…you are my son."). The list names only a sentence start, a comma and and/but/so/then/because.
- Fix `OPENS_CLAUSE` and `breaksRule` to the list's words, or have the lead add the two marks.

**The contract test.** `breaksRule` is meant to be "written from the list, not from the code". It still mirrors the code in four places:
- (d) accepts a cut of the whole comma-part;
- (c) accepts any case of "a";
- (b) accepts any and/but before "like";
- the lift accepts any reply that starts with "Yes".

Each fix above should come with the matching check in `breaksRule` and the strings in `keepCorpus`.

## What holds

- **Overflow and type.** At 1366, 1920, 2560, 800 and 390, on Home, both Archive views, all eight memories and the missing id:
  - `scrollWidth` equals `clientWidth`, and nothing sits past the right edge outside a clipping parent;
  - no clipped text;
  - no text under 12px;
  - no image failed to load.
- **Targets.** None under 44px. Home's week arrows are 36px boxes with a 48px `::before` hit area. On phones, the Archive and Home "Bao · Your own story" picker is 20px tall with a 44px `::before`, and elementFromPoint hits it 12px above and below.
- **Motion settles.** After the stepped scroll with rests, no text anywhere was left under half opacity, at any size.
- **Titles.** Every title has the foil stop (`rgb(201, 161, 90)`).
  - Two lines or fewer at every size: "Ending the chat." takes 1; the rest take 2.
  - Sizes: 44px at 1366 and 800; 50px with a plate and 36px without one at 1920 and 2560 (the long-standing three-column no-plate layout); 28 to 32px at 390.
  - At 320: 23 to 32px, two lines.
- **The 320 "Share" row.** On all eight memories, at 320×700, the state row holds one line:
  - "Treasure it" or "Treasured" 110 to 113px, "Public" 84px and "Share" 80px, all 44px tall;
  - the row ends at 285 to 289px, with `scrollWidth` equal to `clientWidth`;
  - the first icon sits on the title's left edge (0px offset).
  At 390 and up the row is one line too.
- **Memory pages.**
  - Every memory has "Memory n of 8", named Previous and Next (none at the ends), and "Where to next".
  - The kept line is set under the title on 4592, 5963, 0ced, c21c, 342e and f6a7, with one gold mark, and as a coda only on 342e.
  - beee marks its first lines (two marks). f9b0 is set once, as its words.
- **Prints.**
  - Columns: 4 at 1366 (266px), 1920 (375) and 2560 (488); 3 at 800 (232); 2 at 390 (170).
  - No `.said` overflows.
  - No photograph is upscaled at any size, at dpr 1, or dpr 2 at 390. For example, at 390 a 158×211 frame gets the 1122×1402 original.
- **List.** 2 columns at 1366 (535px), 1920 (754) and 2560 (980); 1 at 800 (697) and 390 (328). Thumbnails are never upscaled.
- **Home.**
  - Prints: 3 columns at 1366, 1920, 2560 and 800, and 2 at 390.
  - "From the book" quotes 342e's kept line, with its title and "Told by Bao in conversation".
- **Not-found page.**
  - Bond (`curious-paper.webp`), one line of cause and remedy, and "Back to the archive".
  - It fills exactly one window at all five sizes: 768, 1000, 1300, 1024 and 844.

## For the lead (not counted)

These are on the list's letter. I would not change them without a ruling.
- **(e) holds "Really?", so a teller's own disbelieving question goes.** "They told us we could stay. Really? We could not believe it." → "They told us we could stay. We could not believe it." 17a also says "never a question the teller asks themselves".
- **(c) takes a doubled pronoun after and/but even when it is emphasis.** "And you, you were always there for me." → "And you were always there for me."
- **(a)'s opening rule takes "So it goes" as throat-clearing.** As a teller's first words, "So it goes, we never saw him again." → "It goes, we never saw him again."

## Not verified

- **Defects 1 to 7** are proven on strings under Node only. No live memory triggers them.
- **Defect 8** was simulated by setting the label's text in my tab. I did not press Share.
- **Not exercised:** hover, active and focus-visible states, reduced motion, the lightbox, View Transitions, the density listener, and the server tidy (it is off).
- **The pane was hidden** and my tab drew no frames (`requestAnimationFrame` never fired). Reveals were completed by stepping GSAP and ScrollTrigger and by waiting. Page zoom at 2560 was applied on a fresh load, with a dispatched `resize`.
- **No screenshots** were taken. Every finding is a measurement or a string.

## Shared state

- The stored Archive view (`astory.archiveView`) was "list" when I started. At each size I pressed Prints and then List with the page's own buttons, and it reads "list" now.
- `astory-app-auth` is present and untouched. I did not sign out and wrote no data.
- My helper code lived in my tab's `sessionStorage` under `baos-boot-r11`, which I removed.
- tab-162's viewport was reset to desktop, and the tab is closed.
