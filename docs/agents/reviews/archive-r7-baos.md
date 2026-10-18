# Archive, memory page and Home's prints, round 7 (Bao's Standard)

**FAIL**

Scope: `/archive` in the Prints and List views, `/archive/:id` including a missing id, and Home's prints, the "From the book" quote and the empty invite.

How I checked: I used my own tab (tab-116) in the Claude pane, with the founder signed in. I loaded every page fresh at 1366×768, 1920×1000, 2560×1300 (html zoom 1.3), 800×1024 and 390×844. On each page I stepped GSAP and ScrollTrigger and finished pending CSS transitions, then measured with getBoundingClientRect: scrollWidth against clientWidth, hidden-overflow clipping, computed font sizes, target sizes including `::before`/`::after` hit areas, and line counts. I read all nine memories (the eight in Bao's story, plus Nhi's one) through the app's own `loadAccount`, `cleanTranscript` and `takeaway`, read-only. I compared each exact text with its tidied text and with what the page shows. I also ran `cleanSpeech` and `takeaway` on about 80 test sentences under Node 24, importing `transcript.ts` directly. The archive tests pass (`vitest run src/components/archive`: 48 of 48). For Home's empty invite, I put the `InvitePrint` markup from `Mosaic.tsx` into Home's real `.home-mem .mosaic` in my own tab at every size. No data was touched. I pressed only the Prints/List switch. The stored view was "list" when I started and is "list" now. I reset my tab's viewport and closed the tab.

## Round 6 defects, checked

| # | Round 6 defect | Now |
|---|---|---|
| 1 | "like" before an amount dropped | **Fixed.** "like hundreds", "like ten", "like three hundred", "like a few", "like nothing", "like a year" and "like maybe five" all stay. 5963 now reads "She took home like hundreds of thousands of dollars". 342e's "is like not non-existent" stays too, so the founder's round 6 point is settled. |
| 2 | "X and X and…" collapsed | **Fixed.** "worse and worse and then", "again and again and finally" and "more and more and more" all stand. A side effect: a real stutter in that shape now stays, see 10. |
| 3 | White print titles on cream while loading | **Fixed.** Until `data-loaded`, the frame is `--album-black` (seen at 1366 on the Prints view, with white titles on dark). Then the photograph fades in. |
| 4 | Head quote and first sentence the same words | **Fixed for the first sentence.** c21c has no head quote, and its opening sentence carries the gold mark. **It comes back one sentence later.** See 3. |
| 5 | "not just… but also" cut | **Fixed.** "not just", "not merely" and "not simply" hold. No sentence breaks before "but also". |
| 6 | Straight apostrophes | **Fixed in the three named files.** Others remain, one of them on the memory page. See 7. |
| 7 | Targets under 44px | **Fixed.** The pills are 44 tall at rest. Condensed they are 38 tall, with a `::after` 4px above and below, so the target is 46. The ribbon steps and the phone's `.teller-pick` reach 44 through their hit areas. The audit found no target under 44 at any size. |
| 8 | Tablet quote half the card's height | **Fixed.** At 800 `.home-quote` and `.card.glance` are both 355×493. |
| 9 | Tablet tools pushed right | **Fixed.** At 800 "Treasure it · Public · Share" is its own row at x 110 (the text at 122, on the column edge). |
| 10 | List kicker lowers a title | **Fixed.** Every title starts 16px into its card at 1366 and 1920, and 21px at 2560. "Childhood" is now a chip in the card's bottom row. |
| 11 | "it was." widow | **Fixed.** `.ledge-text` is `balance`. At 390 the last line reads "rest of the archive is where it was." |

## Can the tidied reading be shown to a client, and did tidying change what anyone meant (rule 29)?

For the eight live memories, tidying no longer changes anyone's meaning. Both of the founder's round 6 points are settled: 342e keeps the "like" in "like not non-existent", and in 5963, "For sure. Yeah, definitely." now stays as the answer after the "We asked" line. But the cleaner still has two rules that change meaning on ordinary family speech (defects 1 and 2). They are latent: none of the current memories triggers them.

- **342e4b40, "Building Better Play Studios through bootstrapping": No, and the meaning is intact.** What goes is "Yeah well so my dad so", "like" before verbs, "Wait, were you? Yeah.", the repeated "I was working a corporate job.", and true restarts ("That's how we got, that's how we built" → "That's how we built"; "So we did like a, we built" → "We built"). It still reads as broken at the source: "which is a five", "And then my mom did that my dad was an entrepreneur", "I got to like, and so they ended up winning…", "His manufacturing job got laid off". One stutter is left in: "And then and then our engineers…" (defect 10).
- **c21cf4d4, "Losing grandparents and preserving a grandfather's story": No, and the meaning is intact.** The tidy drops the opening "No," and two "like"s ("He was like a really good fan" → "He was a really good fan"; "documented like for my children" → "documented for my children"). "trying to like tell his story" keeps its "like". That is inconsistent but harmless. The transcript is still broken: "because my dad was trying to.", "But he was trying to."
- **f6a734be, "Pausing a PhD to support startup ventures": Yes, passable, and the meaning is intact.** The tidy drops "Yeah", "So yeah" and the other person's "That's awesome."
- **459228bd, "Choosing a startup over finance graduate study": No. The tidy keeps the meaning, but the takeaway taken from it misleads.** The tidy only drops "And yeah,". The transcript is broken ("I specifically PhD of finance.", "People use this to solve my pain."). Its takeaway, "That's always been the dream because I love teaching.", sits under a title about choosing a startup. Out of context, the "that" reads as the startup (defect 4).
- **59632e67, "Funding a startup through pitch competitions": No, and the meaning is now intact.** "like hundreds" stays, and the "We asked" line has its answer. The words are still broken at the source ("non-delivered funding", "My dad wanted the tax. It's a job.", "So you have to think so.").
- **0ced62a7, "Wanting to preserve grandparents' stories": Nearly passable, and the meaning is unchanged.** The tidy changes nothing.
- **beeedb62 "Childhood…" and f9b0e6e9 "Ending the chat": founder test content, as known.** The typed one is untouched. "Ending the chat" keeps only "How to end chay."
- **79929344, "What did Nhi teach you to do?" (Nhi's story, not the active one): typed and untouched.** Its takeaway is empty (defect 5).

## Defects, worst first

1. **Tidying deletes whole clauses that start like the next one, so a list of actions loses all but its last item, and "nothing / each other" loses its first half.**
   - Where: `dropRestarts` in `src/components/archive/transcript.ts`. It treats any comma-clause of six words or fewer as a false start when the next clause opens on the same word.
   - Sizes: all. No current memory triggers it. Its only live hits are true restarts in 342e. But this is how families talk.
   - Evidence (`cleanSpeech`):
     - "We laughed, we cried, we sang all night" → "We sang all night."
     - "We had nothing, we had each other" → "We had each other."
     - "I thought, I would never see her again" → "I would never see her again."
     - "My mom cooked, my dad cleaned" → "My dad cleaned."
     - "The war came, the house was gone" → "The house was gone."
     - "He loved her, he really did" → "He really did."
     - "I hoped, I prayed, I waited" → "I waited."
     - "I was scared, I was alone" → "I was alone."
   - Rule: 29 (their words, never changed in meaning), 17.
   - Fix: drop a clause as a restart only when it is a true prefix of the next one ("that's how we got, that's how we built": the next clause repeats the same words, then goes on), or when it breaks off on a little word ("we did a,"). Never drop it only because both clauses open on the same word. Add the eight strings above to `transcript.test.ts`, unchanged.

2. **The quoting "like" is dropped as filler, so reported speech becomes the teller's own statement, often ungrammatical.**
   - Where: `dropFillerLike` / `isFillerLike` (a "like" after "was", "were", "is" or "'s" counts as filler), and `dropRestarts` for the "felt like," case.
   - Sizes: all. No current memory triggers it.
   - Evidence:
     - "And she was like, you have to go home now" → "And she was you have to go home now."
     - "He's like, why would you do that" → "He's why would you do that."
     - "So we were like, we need to raise money" → "So we were we need to raise money."
     - "I was like oh my god" → "I was oh my god."
     - "I felt like, I was alone" → "I was alone." (a feeling becomes a fact)
     - "It was, like, the hardest thing I ever did" → "It was, the hardest thing I ever did." (a stray comma is left behind)
   - Rule: 29, 17a.
   - Fix: keep "like" when it follows a form of "be" or "go" ("was/were/is/'s/am/are/been like") and comes before a comma, a pronoun or a quote, and keep it after "felt/feel/seemed". When a ", like," goes, remove both commas. Add these strings to the tests.

3. **On a short spoken memory, the kept line is set three times within one screen: the head quote, the gold mark one sentence into the words, and the coda.**
   - Where: `MemoryPage.tsx` 207–215. `opens` only catches a kept line that is the first sentence. `coda` is dropped for a short memory only when it opens.
   - Sizes: all.
   - Evidence:
     - 459228bd: the head quote is at y 310, and the same words are marked at y 505, right after "I specifically PhD of finance." (390). The coda repeats them at y 1489. Screenshot at 390 shows the head quote and the mark eight lines apart.
     - f6a734be at 1366: head 388, mark 677, coda 1009. At 1920: 379, 689, 1032. At 2560: 493, 896, 1341. All three fall within one window height.
     - Compare: 0ced, 342e and 5963 set it twice (head and mark), because their words end on the paragraph that holds it.
   - Rule: 19 (never the same thing twice on a page), 32. The code's own comment, "twice at most, never twice in a row", is broken.
   - Fix: treat the kept line as opening the words when it falls within the first two sentences or the first 200 characters. Drop the coda whenever the words are under about 1,200 characters, or when the mark is already on screen with the head.

4. **459228bd's takeaway opens on a "That's" that points back to something the reader never sees, and under its title it reads as the opposite.**
   - Where: `keptLine` in `transcript.ts`. `OPENS_SOFT` lets "That's" through when the sentence has a feeling. The `POINTS_BACK` guard only runs in `takeaway`'s fallback.
   - Sizes: all. It shows on the head, the print, the List card and the coda.
   - Evidence: the title is "Choosing a startup over finance graduate study". The line is "That's always been the dream because I love teaching." In the words, "that" is the finance PhD. On the card and the head, it reads as the startup.
   - Rule: 32 (the takeaway is what a skimming reader should remember), 29.
   - Fix: apply `POINTS_BACK` in `keptLine` too, so a sentence opening on "That", "This", "It" or "They" is never the kept line. For 4592, "I love teaching." is too short, so the next best line takes its place.

5. **A short typed memory with no closing full stop has no takeaway, so its print and List card fall back to the excerpt or show no words.**
   - Where: `takeaway` in `transcript.ts`. When there is no newline and no `[.!?]`, no sentence matches and `first` is "". This breaks the function's own promise: "Empty only when there are no words." `PrintCard.words` and `MemoryCard` then use `memory.excerpt`.
   - Sizes: all.
   - Evidence: `takeaway("Poker night at 2315")` returns "", and that is live data (Nhi's 79929344). So do `takeaway("Dad taught me to fish")` and `takeaway("We moved to Saigon in 1975")`. I did not switch the active story to see the card, because switching saves the choice.
   - Rule: 17 (a memory without a photograph is the person's words on paper, never a blank box), 32.
   - Fix: when no sentence qualifies, return the whole text, trimmed, if it is 140 characters or fewer. Add these three strings to the tests.

6. **Ruling on the memory title's missing house full stop: the stop is required, and its absence is a defect.**
   - Where: `MemoryHead` in `src/components/archive/MemoryLead.tsx` 64–70 (`.mv-title`).
   - Sizes: all.
   - Evidence:
     - The memory title is the page's one display title: an h1, Cormorant at 44px (36 at 1920, scaled at 2560).
     - Every other display title on the site carries the foil or terracotta stop: "The Archive.", "Good morning, Bao.", "Nothing here yet.", "Sign in.", "Thank you.".
     - So does this same route's not-found headline, "That memory isn't here." (`.ledge-stop`).
     - The memory page is the only display head without one.
   - Rule: 33 ("Display titles end with the house full stop in foil or terracotta"), 1.
   - Fix: after the title, add `<span className="mv-stop" aria-hidden="true">.</span>` in foil, placed before the wax seal. Skip it when the title already ends in ".", "?", "!" or "…" ("What did Nhi teach you to do?"). The person's title text is unchanged; the dot is ornament. Do not add it to prints, List cards, Previous/Next or "From the book": those are captions in a set, and a dot on each would be noise.

7. **Straight apostrophes are still in shown copy, one of them on the memory page (round 6 item 6, rule 1).**
   - Where:
     - `src/state/AccountProvider.tsx` 46, 108, 123, 132, 141 and 151 ("Couldn't", "hasn't", "wasn't"). `MemoryPage` shows these through `<Problem>`, which does not smarten.
     - `src/pages/Contribute.tsx` 58, 153, 297 and 342.
     - `src/pages/Join.tsx` 233 ("You're in").
     - `src/pages/auth/CreateAccount.tsx` 58.
   - Sizes: all.
   - Rule: 14, 1.
   - Fix: pass `message` through `smarten` inside `Problem`, and curl the literals.

8. **The not-found page scrolls a few pixels with nothing below.**
   - Where: `/archive/<missing id>` (`.mv-missing-page` in `Shell bare`).
   - Sizes: 1366 (scrollHeight 781 in a 768 window), 2560 (1307 in 1300), 390 (853 in 844). It is exact at 800.
   - Evidence: no element's box extends past the window bottom (checked every element at 390), so the extra height comes from padding or a margin.
   - Rule: 11 (one screen when it should be one screen), checklist.
   - Fix: find the extra bottom margin or padding on the bare sheet and remove it, so a one-screen failure page never scrolls.

9. **The typed "Childhood…" memory has no gold mark anywhere: no head quote (it opens on the line) and no mark in the words.**
   - Where: `withMark` is applied line by line. The kept line, "We live in a small city · It's in Vietnam", spans two typed lines, so it never matches.
   - Sizes: all.
   - Rule: 32 (every page says what to remember). The code's own comment says "the opening sentence carries the gold mark".
   - Fix: when the kept line is a `JOIN` of typed lines, mark each of those opening lines.

10. **Some stutters are now left in, and a run of three loses only one word.**
    - Where: the stutter rule plus `JOINED` and `MEANT_TWICE` in `cleanSpeech`.
    - Sizes: all.
    - Evidence:
      - Live 342e: "And then and then our engineers from El Salvador". `JOINED` sees x = "and then" ending in "then" and keeps it.
      - Test strings: "We we we moved to Saigon" → "We we moved to Saigon"; "no, no, no, you can't go" → "no, no, you can't go".
    - Rule: 29 (no meaning lost here, but a client reads it as a slip), 17a.
    - Fix: apply `JOINED` only when the conjunction joins two copies ("X and X"), not when the repeated phrase is itself a conjunction. Collapse a run of three or more of the same little word to one. Keep a `MEANT_TWICE` run whole, at its full length.

## What holds

- No horizontal scroll on any page in scope at any of the five sizes, in both Archive views and with the invite injected. No clipped text, and no text under 12px, at any size.
- Memory pages: the words are 22px at 1366, 23px at 1920 and 2560, 21px at 800 and 20px at 390. At 1920 there are three columns on a no-plate memory (head 190–630, words 710–1294, margin 1374–1714, tops within 4px). There is a plate layout on photograph memories. The tools sit on the column edge.
- Prints are 4 columns at 1366 (266px), 1920 (375px) and 2560 (488px), 3 at 800 (232px) and 2 at 390 (170px). Every `.said` fits at 390 (84/84, 84/84, 42/42, 21/21). List is two columns of 535, 754 and 980px cards, and one column at 800 and 390.
- Loading prints show the album black with readable white titles, and the photograph fades in over it.
- The not-found page has the cloth, one sheet, Bond, the foil stop, one balanced line and one action at every size.
- Home's empty invite holds at all five sizes. The headline is 40px (30 at 390), the line 20px (17 at 390), balanced. Bond never overlaps the words (at 390 the dog ends at y 1072 and the headline starts at 1090).
- Home's "From the book" quote is the same line as 342e's head and print. Every page ends with "Where to next", and every memory with Previous, Next and "Memory n of 8".

## Not verified

- Defects 1, 2, 5 and 10 were proven on test strings under Node 24, importing `transcript.ts` directly. The live memories only trigger defect 10. Defect 5 was not seen on a card, because switching the active story to Nhi's saves the choice.
- Home's empty invite was measured with its markup placed into Home's real grid in my own tab, not on a real empty account. The pen icon in my copy was a blank SVG. The Archive's empty state was not rendered.
- In the hidden pane, a client-side move to a memory changed the URL, but the View Transition never rendered the new page. I used fresh loads for every page and count this as the hidden pane, as in rounds 5 and 6. Scroll reveals below the fold also wait for a scroll, which I triggered by hand.
- Not exercised: reduced motion; hover, active and focus-visible states; the lightbox; View Transitions; a zoomed-out Edge window; a live resize.
- Screenshots at 1920 and 2560 are scaled by the pane, so those findings are measured, not seen.
