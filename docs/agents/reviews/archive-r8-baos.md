# Archive, memory page and Home's prints, round 8 (Bao's Standard)

**FAIL**

Scope: `/archive` in the Prints and List views, `/archive/:id` including a missing id, and Home's prints, the "From the book" quote and the empty invite.

How I checked: I used my own tab (tab-127) in the Claude pane, with the founder signed in. I loaded every page fresh at 1366×768, 1920×1000, 2560×1300 (html zoom 1.3), 800×1024 and 390×844: Home, both Archive views, all eight memories in Bao's story and a missing id. On each page I stepped GSAP and ScrollTrigger, scrolled to the end and back, and finished pending animations. Then I measured with getBoundingClientRect:
- scrollWidth against clientWidth, and any box past the right edge;
- hidden-overflow clipping and text under 12px;
- target sizes, including `::before`/`::after` hit areas and wrapping labels;
- elements left under half opacity;
- the kept line's head, gold mark and coda positions;
- title line counts and the foil stop.

I read all nine memories through the app's own `loadAccount`, `cleanTranscript` and `takeaway` (read-only), and compared each exact text with its tidied text, line by line. I ran about 110 test strings through `cleanSpeech`, `cleanTranscript` and `takeaway`, importing `transcript.ts` directly under Node 24: every example from round 7 (both reviewers), plus new ones written against the lead's ruling in 17a. The archive tests pass (`vitest run src/components/archive`: 73 of 73). For Home's empty invite, I put the `InvitePrint` markup into Home's real `.home-mem .mosaic` in my own tab at every size. No data was touched. I pressed only the Prints/List switch. The stored view was "list" when I started and is "list" now. I reset the viewport and closed my tab.

## Round 7 defects, checked

| # | Round 7 defect | Now |
|---|---|---|
| 1 | Clauses that open like the next one dropped | **Fixed.** All eight strings stand: "We laughed, we cried, we sang all night", "We had nothing, we had each other", "I hoped, I prayed, I waited" and the rest. They are in `transcript.test.ts`. 342e's "That's how we got, that's how we built the company" now stays whole, since it is not a true prefix. |
| 2 | Quoting "like" dropped | **Fixed.** "she was like, you have to go home now", "He's like, why…", "we were like, we need…", "I was like oh my god", "I felt like, I was alone", "I go like, what…" and "She goes, like, no way" all stand. "It was, like, the hardest thing" loses the "like" and both commas. |
| 3 | Kept line set three times within one screen | **Fixed for the cases named.** 4592 and f6a7 now set it twice: the head quote, then the mark (4592 at 1366: 374 and 759; f6a7: 366 and 668). Neither has a coda. 342e, the one long memory (2,595 characters), keeps head, mark and coda as rule 32 describes. Its coda sits 1,440px or more below the mark at every size. |
| 4 | 4592's takeaway opened on "That's" | **Fixed.** `POINTS_BACK` now guards `keptLine`. The line is "The best way to learn finance is to build a business." |
| 5 | Short typed memory without a full stop had no takeaway | **Fixed.** "Poker night at 2315", "Dad taught me to fish" and "We moved to Saigon in 1975" each return whole. This is tested. Not seen on Nhi's card (see Not verified). |
| 6 | Memory title missing the house full stop | **Fixed.** `.mv-stop` is in foil (`rgb(201, 161, 90)`) on all eight titles at every size. It sits before the wax seal on 5963. The `?`/`.`/`!`/`…` guard is in place. |
| 7 | Straight apostrophes in shown copy | **Fixed.** `Problem` passes its message through `smarten`. The only straight apostrophes left in the four named files are in code comments. |
| 8 | Not-found page scrolled a few pixels | **Fixed, and the builder's explanation holds.** Settled, scrollHeight equals the window at all five sizes (768, 1000, 1300, 1024, 844). At 390 I also read it before stepping any animation: 844 in 844. |
| 9 | "Childhood…" had no gold mark | **Fixed.** "We live in a small city" and "It's in Vietnam" each carry `.mv-mark` (at 1366: y 486 and 519). |
| 10 | Stutters left in; runs of three lost one word | **Fixed.** 342e now reads "And then our engineers from El Salvador". "We we we moved" → "We moved". "and, and", "but, but" and "Then then" collapse. "no, no, no" stays whole. |

## Did tidying change what anyone meant? Every memory against its exact words

- **342e4b40, "Building Better Play Studios through bootstrapping": meaning intact.**
  - Gone: "Yeah well so", filler "like" before verbs and adverbs ("taught like teenagers", "be like networking", "like right out of the gate", "like really really hard", "and like worked like as"), the repeated "I was working a corporate job.", "Wait, were you? Yeah.", the "and then and then" and "that's, that's" stutters, and the trailing "Yeah."
  - "So we did like a, we built" → "We built" (a clause broken off on an article).
  - Kept: "like not non-existent", "owns like an NBA team", "That's how we got, that's how we built", "I got to like, and so".
- **459228bd, "Choosing a startup over finance graduate study": unchanged.** The tidy changes nothing, so no "Lightly tidied" line shows. That is correct.
- **0ced62a7, "Wanting to preserve grandparents' stories": unchanged.**
- **c21cf4d4, "Losing grandparents and preserving a grandfather's story": one change of meaning.**
  - Gone: the opening "No," (a reply to an unseen question) and "documented like for my children" (filler).
  - "He was like a really good fan" → "He was a really good fan". The "like" compares, and the code drops it on purpose (defect 1).
- **59632e67, "Funding a startup through pitch competitions": meaning intact.** Gone: "Yeah," before "gaming and mental health", "Yeah, right?", "Wow, that's amazing.", and ", but yeah". Kept: "For sure. Yeah, definitely." stays as the answer under "We asked". "like hundreds of thousands" and "So I'm like that too" stay.
- **f6a734be, "Pausing a PhD to support startup ventures": meaning intact.** Gone: "Yeah," twice, "So yeah,", and the other person's "That's awesome.". Kept: "it's like a lifetime opportunity".
- **beeedb62 "Childhood…" (typed) and 79929344 "What did Nhi teach you to do?" (typed): untouched**, as they should be. **f9b0e6e9 "Ending the chat"** keeps only the teller's turn. This is founder test content, as known.

So the live words are safe except c21c's "like". But the cleaner still has four rules outside the lead's ruling in 17a (it "may remove filler sounds, an exact adjacent stutter, and a clause that is a true prefix of the next… never a hedge before an amount, never an answer. When in doubt it keeps the words"). They are defects 1 to 4.

## The three changed kept lines

- **4592, "The best way to learn finance is to build a business."**
  - Yes. This is the line to remember.
  - It is her reason for the choice in the title, in her own words, and it stands alone.
  - "So" is dropped at the front, and the mark in the words starts after it.
- **342e, "I thought we were gonna raise money right out of the gate."**
  - Yes, acceptable. Under "…through bootstrapping", the expectation reads as the turn the memory is about. On Home's "From the book", the title line under the quote carries that turn too.
  - Two notes, neither counted:
    - The line comes from the tidied reading. The teller said "like right out of the gate and then COVID hit…", so the full stop after "gate" is the tidy's own.
    - The stronger line ("It's been challenging, but I think it's why we have the opportunity to get it.") opens on "It's" and is rightly barred.
- **0ced, "When I heard that idea, I think at least for myself, it's also very memorable because I have very tight bondings with my grandparents back then."**
  - Yes, with a reservation. It holds the heart of the memory, her bond with her grandparents.
  - But it opens on "that idea", which the card never names. At 147 characters it is three lines in the head (104px tall at 1366, 140 at 2560).
  - The only other candidate, "I really want to make this happen.", points back harder. So this is the best line these words hold, and I do not count it.

## Defects, worst first

1. **Tidying drops a comparing "like" when "a really / very / little / kind of" follows, so a likeness becomes a fact.**
   - Where:
     - `isFillerLike` in `src/components/archive/transcript.ts`, where the `hedge` test (`really|very|so|kind|sort|little|bit|whole|lot` as the second word) cancels `compare`.
     - `transcript.test.ts` line 106 asserts this behaviour.
   - Sizes: all.
   - Evidence:
     - Live, c21c: "He was like a really good fan" → "He was a really good fan".
     - `cleanSpeech` test strings:
       - "Our neighbor was like a very close aunt to me" → "Our neighbor was a very close aunt to me."
       - "She was like a little sister to me" → "She was a little sister to me."
       - "He was like a really big brother to us" → "He was a really big brother to us."
       - "She was like a really good mother to me" → "She was a really good mother to me."
       - "He was like a kind of father to me" → "He was a kind of father to me."
     - "He was like a mother to me" stands, so this is the `hedge` exception alone.
   - Rule: 17a ("Tidying a spoken memory never changes what was meant… When in doubt it keeps the words"), 17.
   - Fix: treat "like" before "a/an/the" as a comparison whatever follows, and delete the `hedge` exception. Invert the test at line 106, and add the five strings above, unchanged.

2. **A clause that ends on "to" is dropped as a false start, so the first half of a thought disappears.**
   - Where: `dropRestarts` → `brokeOff` with `BREAKS_OFF` (`a|an|the|to|of|my|our|their|your`). The ruling in 17a allows only the true prefix.
   - Sizes: all. No live memory triggers it. 342e's "So we did like a, we built" is the article case, which changes no meaning.
   - Evidence (`cleanSpeech`):
     - "I wanted to, but I couldn't" → "But I couldn't."
     - "She never got to, she died before the war ended" → "She died before the war ended."
     - "We had nowhere to go to, no family, no money" → "No family, no money."
     - "I tried to, I really did" → "I really did."
     - "I always wanted to, and then I finally did" → "And then I finally did."
     - "We wanted to, we just couldn't" → "We just couldn't."
   - Rule: 17a.
   - Fix: remove "to" and "of" from `BREAKS_OFF`. An infinitive's "to" ends a whole clause by ellipsis. Never drop a broken-off clause when the next one opens on "but", "and" or "so". Add the six strings to the tests, unchanged.

3. **An answer to a short question is dropped as back-channel, so the question is left with half its answer or none.**
   - Where:
     - `liftQuestions` lifts a question only at five words or more. A shorter one stays in the teller's paragraph.
     - `cleanSpeech` then drops the "Yes." or "Yeah, of course." after it, because `answer: true` is never set.
   - Sizes: all. No live memory triggers it.
   - Evidence (`cleanTranscript`):
     - "Were you happy there? Yes. We were." → "Were you happy there? We were."
     - "Did she cry? Yeah. A lot." → "Did she cry? A lot."
     - "Did you love him? Yeah, of course. He was my whole life." → "Did you love him? He was my whole life."
     - "Were you scared? Yes. Very scared, we had nothing." → "Were you scared? Very scared, we had nothing."
   - Rule: 17a ("never an answer").
   - Fix: after any sentence that ends in "?" and is not a tag or a reaction, keep the back-channel sentences that follow whole, as the answer (the same rule as `answer: true`), whatever the question's length. Add the four strings.

4. **"Like" before an amount is dropped when the amount opens on "around", "over", "once" or "halfway", so a guess reads as a fact.**
   - Where: `HEDGES_AMOUNT` in `transcript.ts`.
   - Sizes: all. No live memory triggers it.
   - Evidence:
     - "It took like around fifty days" → "It took around fifty days."
     - "It was like over a hundred people" → "It was over a hundred people."
     - "We went like once a week" → "We went once a week."
     - "We were like halfway there" → "We were halfway there."
     - "like twenty-five", "like two or three", "like a third" and "like eighty" all stand.
   - Rule: 17a ("never a hedge before an amount").
   - Fix: add `around|over|under|more|less|nearly|close|once|twice|halfway|double` to `HEDGES_AMOUNT`, and the four strings to the tests.

5. **An emphatic doubling at the start of a clause is collapsed, though the stutter rule protects the same word mid-sentence.**
   - Where:
     - `dropRestarts`: a one-word clause is a "true prefix" of the next ("Never" / "never again").
     - `LEAD_FILLER` takes "so, so" and "yes, yes" as throat-clearing.
     - Both run past `MEANT_TWICE`.
   - Sizes: all. No live memory triggers it.
   - Evidence:
     - "Never, never again" → "Never again."
     - "Very, very hard times" → "Very hard times."
     - "Long, long ago there was a village" → "Long ago…"
     - "No, no you can't" → "No you can't."
     - "So, so good" → "Good."
     - "Yes, yes I remember" → "I remember."
     - Mid-sentence, "It was very, very hard" and "I said yes, yes, yes" stand.
   - Rule: 17a ("When in doubt it keeps the words").
   - Fix: in `dropRestarts`, never treat a clause that is one `MEANT_TWICE` word as a prefix. In `LEAD_FILLER`, never strip a repeated `MEANT_TWICE` word ("so, so", "yes, yes"). Add the six strings.

6. **A long memory title runs to three lines on a phone.**
   - Where: `.mv-title` on `/archive/c21cf4d4…` ("Losing grandparents and preserving a grandfather's story.", 57 characters with the stop).
   - Sizes: 390 only. It is two lines at 800, 1366, 1920 and 2560.
   - Evidence: line tops 172, 207 and 242 at 32px in a 350px column. Every other title is two lines at 390.
   - Rule: DESIGN.md craft rules ("Headlines two lines or fewer at every width"), checklist.
   - Fix: below 600px, step `.mv-title` down to about 28px for titles over about 40 characters (`data-long` set from the length), so every title keeps two lines.

## What holds

- **Overflow and type.** No horizontal scroll on any page in scope at any of the five sizes, in both Archive views and with the invite injected. No clipped text, no text under 12px, no element left faded, and no target under 44px at any size. The search field's label is 44 tall around a 33px input.
- **Memory pages.**
  - The words are 22px at 1366, 23 at 1920 and 2560, 21 at 800, and 20 at 390.
  - On a photograph memory, the plate is the left page from 1366 up (4592 at 1920: plate 172–1052, head and words 1148–1732). Below 1280 it sits in the words after the first paragraph.
  - No-plate memories have three columns at 1920 (head 190–630, words 710–1294, margin 1374–1714).
  - Every memory has Previous/Next with "Memory n of 8", and "Where to next".
  - The two short ones (Childhood, Ending the chat) fit one 1000px window at 1920 and one 1300px window at 2560 with nothing below.
- **Prints.** 4 columns at 1366 (266px), 1920 (375px) and 2560 (488px), 3 at 800 (232px), 2 at 390 (170px). Every `.said` fits at every size. The photographs load (`data-loaded`, natural width 400).
- **List.** 2 columns of 535, 754 and 980px, and 1 column at 800 (697px) and 390 (328px). Every title starts 17px into its card (21px at 2560, 13px at 390).
- **Home.**
  - Prints are 3 columns at 1366, 1920, 2560 and 800, and 2 at 390.
  - "From the book" quotes 342e's kept line, the same line as its head and List card.
  - At 800, the quote and the glance card are both 355×493.
- **The empty invite.**
  - The headline is 40px (30 at 390), on one line, and the line under it is 20px (17 at 390).
  - Bond never overlaps the words: at 390 the dog ends at y 1072 and the headline starts at 1090.
  - The frame never clips (407/407; 353/353 at 390).
- **The not-found page.** It has the cloth, one sheet, Bond, the foil stop and one action. It fits one screen at every size.

## Not verified

- Defects 2 to 5 were proven on test strings under Node 24, importing `transcript.ts` directly. Of the live memories, only c21c triggers any of them (defect 1).
- Nhi's memory (79929344) was not opened and its card was not seen. Opening it switches and saves the active story.
- Home's empty invite was measured with its markup put into Home's real grid in my own tab, not on a real empty account. The pen icon in my copy was the first SVG on the page.
- The pane was hidden, so screenshots are stale or mid-transition. One at 390 caught the running head's crossfade frozen halfway: "Archive" and "What the family remembers" overlapping. Measured settled, one is at opacity 0 and the other at 1. I count it as the hidden pane. Every finding here is measured, not seen.
- After I pressed Prints at 1366, the stored view read "list" again at my next load at 1920, before I had pressed List. I did not trace why. It reads "list" now, as I found it.
- Not exercised:
  - reduced motion;
  - hover, active and focus-visible states;
  - the lightbox and View Transitions;
  - a zoomed-out Edge window and a live resize;
  - the server tidy (off, as known).
