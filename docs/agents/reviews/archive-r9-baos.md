# Archive, memory page and Home's prints, round 9 (Bao's Standard)

**FAIL**

The pages pass. All six round-8 defects are fixed, and every live memory's tidied words keep what was meant. The tidy still breaks the reworded rule 17a in six ways that no live memory triggers yet. The worst is that an answer can be credited to the asker and drop out of the teller's words. Each one is proven on test strings below.

Scope: `/archive` in the Prints and List views, `/archive/:id` including a missing id, and Home's prints and "From the book".

## How I checked

- **Reading.** I read `docs/BAOS-STANDARD.md` fresh, including the reworded 17a, plus DESIGN.md's craft rules, `archive-r8-baos.md` and `archive-r8-skills.md`. I also read all of `transcript.ts`, `develop.ts` and `photoUrls.ts`, and the round-9 fixtures in `transcript.test.ts`.
- **Tests.** `vitest run src/components/archive src/lib` passes 9 files and 138 tests. `tsc --noEmit` exits 0.
- **Browser setup.** I used my own tab (tab-139) in the Claude pane, with the founder signed in, at 1366×768, 1920×1000, 2560×1300 (html zoom 1.3), 800×1024 and 390×844. At each size I force-loaded Home, then measured:
  - Home;
  - the Archive in Prints, then in List;
  - all eight memories in Bao's story;
  - a missing id.
- **Settling each page.** On every page I:
  - stepped GSAP and ScrollTrigger;
  - scrolled to the end and back with real pauses longer than `onEnterSafe`'s 120ms timer;
  - finished pending CSS transitions;
  - set lazy images to eager, because a background tab never loads lazy images.
- **Measurements, with getBoundingClientRect and computed styles:**
  - horizontal scroll and anything past the right edge;
  - text under 12px;
  - hidden-overflow clipping;
  - elements left under half opacity;
  - images not loaded or left transparent;
  - targets under 44px, counting pseudo-element hit areas and wrapping labels;
  - title line counts and the foil stop;
  - the kept line's head, gold mark and coda positions;
  - Previous/Next and "Where to next";
  - grid columns;
  - the rendition each print asked for, decoded from its signed token.
- **The live words.** I loaded the account read-only with the app's own `loadAccount`, then ran every memory through `soundsSpoken`, `cleanTranscript` and `takeaway`. For each one I diffed the exact words against the tidied words, word by word.
- **New test strings.** I imported `src/components/archive/transcript.ts` directly under Node 24.18 and ran about 110 new strings against each clause of the reworded 17a, plus every round-8 string from both reviewers.
- **Screenshots** are in `docs/agents/reviews/shots/`:
  - `archive-r9-baos-prints-1366.jpg`
  - `archive-r9-baos-342e-1920.jpg`
  - `archive-r9-baos-c21c-390.jpg`
  - `archive-r9-baos-missing-1366.jpg`

## Round 8 defects, checked

| # | Round 8 defect | Now |
|---|---|---|
| 1 | Comparing "like a really/very/little/kind of" dropped | **Fixed.** All six strings stand ("He was like a really good fan", "She was like a little sister to me"…). Live c21c now reads "He was like a really good fan." They are in `RULE_17A_SPEECH`. |
| 2 | A clause ending on "to" dropped | **Fixed.** `BREAKS_OFF` is now articles and possessives only. A restart also needs the next clause to reopen on the same subject and not on "but/and/so". All six strings stand, and so does "We gave the flowers to, the old lady next door." |
| 3 | An answer to a short question dropped | **Fixed.** `isQuestion` keeps any back-channel after a real question whole. "Were you happy there? Yes. We were.", "Did she cry? Yeah. A lot." and the rest stand. |
| 4 | "Like" before around/over/once/halfway dropped | **Fixed.** All four stand. |
| 5 | Emphatic doubling at the start of a clause collapsed | **Fixed.** "Never, never again", "So, so good", "Yes, yes I remember" and the rest stand. A comma-doubled word that is not a slip word ("a big, big house", "Run, run, run!") stands too. |
| 6 | The c21c title ran to three lines at 390 | **Fixed.** `data-long` (over 52 characters) steps it to 27px below 600px. It is now 2 lines at 390. Every other title is 2 lines (1 for "Ending the chat.") at all five sizes. |

## Did tidying change what anyone meant? Every live memory against its exact words

- **342e4b40: meaning intact.**
  - Gone:
    - the opening "Yeah well so";
    - the filler "like" in "taught like teenagers", "be like networking", "like right out of the gate", "like really really hard", "but like, so", "and like with the family office", "and like worked like as", "just like trying", "fundraise, like they" and "is like for sure";
    - the repeated "I was working a corporate job.";
    - "Wait, were you? Yeah.";
    - the "and then and" stutter and the trailing "Yeah.".
  - "So we did like a, we built" → "We built". This is now the 17a example word for word.
  - Kept: "like not non-existent", "owns like an NBA team", "That was like the IP issue", "like one person" (twice) and "I got to like, and so".
  - Full stops are added by sense. No words are reordered.
- **c21cf4d4: meaning intact.** Gone: the opening "No," and "documented like for my children". "He was like a really good fan" and "trying to like tell his story" stay.
- **59632e67: meaning intact.**
  - Gone: "Yeah," before "gaming", "Yeah, right?", "Wow, that's amazing." and ", but yeah".
  - The asker's "Do they open to non-students as well? Because our strategy right now is…" stands as the one "We asked" line. "For sure. Yeah, definitely." stays as the answer.
- **f6a734be: meaning intact.** Gone: "Yeah," twice, "So yeah," and the other person's "That's awesome.".
- **459228bd and 0ced62a7: unchanged.** The tidy removes nothing.
- **beeedb62: typed, untouched.**
- **f9b0e6e9** keeps only the teller's turn ("How to end chay."). This is founder test content, as known.
- **Nhi's memory (79929344)** was not opened, by instruction.

## Defects, worst first

All six are latent: no live memory triggers any of them today. Each one changes or removes what a teller meant, which 17a forbids.

1. **A teller's answer that opens on "Because", "Our" or "We were…" is handed to the asker, so it leaves the teller's words, the card and the takeaway.**
   - Where: `liftQuestions` → `ASKER_GOES_ON` in `src/components/archive/transcript.ts`.
   - Sizes: all.
   - Evidence (`cleanTranscript`, Node):
     - "We lived by the river. Why did your family leave Hanoi in 1954? Because the soldiers came for my father." → the answer is set inside the "We asked" line.
     - "What did your parents do for a living? We were rice farmers, all of us." → the same.
     - "What happened to the house after the war? Our cousins took it, and we never got it back." → the same.
     - In a spoken memory ("Yeah so um we lived by the river… Why did your family leave Hanoi in 1954? Because the soldiers came for my father and we had one night to go. Yeah. I mean, I remember the boat."), the card's words and the takeaway both lose the answer.
     - The one live use, 5963, is correct: the asker's own "Because our strategy right now is…", followed by the teller's "For sure."
   - Rule: 17a ("never an answer"), 17.
   - Fix: hand the next sentence to the asker only when a back-channel answer ("For sure.", "Yes.") follows it, as in 5963. Otherwise the first sentence after the question is the teller's answer. Add the three strings, with 5963's pitch as the counter-case.

2. **A comparing "like" before a bare noun, a name or "nobody" is dropped as filler, so a likeness becomes a fact, or the sentence breaks.**
   - Where: `isFillerLike` in `transcript.ts`. `compare` protects only an article, a pronoun or possessive, "home" and "family". Every other word after "like" counts as filler unless it is an amount.
   - Sizes: all.
   - Evidence (`cleanSpeech`):
     - "We were like brothers." → "We were brothers."
     - "We were like strangers after that." → "We were strangers after that."
     - "It was like magic." → "It was magic."
     - "It was like yesterday." → "It was yesterday."
     - "I remember it like yesterday." → "I remember it yesterday."
     - "We lived like kings." → "We lived kings."
     - "They treated us like animals." → "They treated us animals."
     - "The kitchen smelled like jasmine." → "The kitchen smelled jasmine."
     - "It tasted like candy." → "It tasted candy."
     - "She cooked like nobody else." → "She cooked nobody else."
     - "Cities like Saigon were full." → "Cities Saigon were full."
     - "They were like family to me, like brothers." → "…family to me, brothers."
   - Rule: 17a ("never changes what was meant… When in doubt it keeps the words"), 17.
   - Fix: keep "like" after any form of "be", after a verb of sense or manner (smelled, tasted, lived, treated, cooked, ran, sang, remember… it) and after a noun ("cities like"). Drop it only before a verb, an adverb or a preposition, as in the live 342e cases. Add the twelve strings, and keep the live removals as counter-cases.

3. **The quoting "like" is dropped after "I'm", "we're", or a word between the verb and "like", so the quote runs into the sentence.**
   - Where: `BE_OR_GO` and `quotesOrFeels` in `transcript.ts`. `BE_OR_GO` knows `'s` but not `'m` or `'re`, and it looks only at the word straight before "like".
   - Sizes: all.
   - Evidence:
     - "I'm like, why would you do that?" → "I'm why would you do that?"
     - "We're like, let's go home." → "We're let's go home."
     - "My mom was just like, go home." → "My mom was just go home."
     - "He was all like, whatever." → "He was all whatever."
     - "I was kind of like, okay." → "I was kind of okay."
     - "They're like, no way." stands only because "no" is in the amount list.
   - Rule: 17a ("never the quoting or feeling 'like'").
   - Fix: add `['’](?:m|re)$` to `BE_OR_GO`, and look back past "just", "all", "kind of", "sort of", "totally", "literally" and "so" to the verb. Add the five strings.

4. **A question the teller asks themselves is lifted as "We asked" when it holds "us", "our", a general "you" or a third person, so the page credits it to the interviewer and the cards lose it.**
   - Where: the pronoun guard in `liftQuestions` (`\b(?:I|my|me|we)\b`).
   - Sizes: all.
   - Evidence (`cleanTranscript`), each set as "[We asked] …" with the teller's reply after it:
     - "My father left us. What would become of us now? Nobody knew."
     - "Who would take care of our children? My sister did."
     - "She died young. Why does God take the good ones? I still ask that."
     - "How do you forget something like that? You don't. You carry it."
     - "The war came. What could anyone do about it? Nothing. We waited."
   - Rule: 17a ("never a question the teller asks themselves… When in doubt it keeps the words").
   - Fix: add `us|our|ours|mine|myself|ourselves` to the guard. In an unlabelled transcript, lift a question only when a back-channel answer or the asker going on follows it; otherwise it stays in the teller's words. 5963's question still lifts. Add the five strings.

5. **Emphasis collapses when the transcript has no comma, or when a whole sentence or a phrase is said twice.**
   - Where:
     - `STUTTER` and `meantTwice`: without a comma, only the closed `MEANT_TWICE` list is protected, and a doubled phrase is always collapsed.
     - The sentence de-duplication in `cleanSpeech` (`n === norm(prev)`).
   - Sizes: all.
   - Evidence (`cleanSpeech`):
     - "We had a big big house." → "We had a big house." (the 17a example without its comma; speech-to-text often leaves the comma out)
     - "It was a tiny tiny room." → "a tiny room"
     - "She was a sweet sweet girl." → "a sweet girl"
     - "It was hot hot hot." → "It was hot."
     - "Never again. Never again." → "Never again."
     - "No. No. No." → "No." ("no, no, no" stands)
     - "I loved her. I loved her." → "I loved her."
     - "Thank you, thank you." → "Thank you."
     - "Every day, every day she called." → "Every day she called."
   - Rule: 17a ("never a word doubled for emphasis", "never a sentence that repeats one said earlier for emphasis"; only "an exact adjacent stutter" may go).
   - Fix:
     - Treat a doubled single word that is not a `SLIP_WORD` as emphasis, with or without a comma.
     - Never drop a whole sentence that repeats the one before. Keep only the eSports shape: the first clause of a sentence with an aside, repeated.
     - Keep a doubled phrase that is the whole sentence or ends on a noun.
     - Add the nine strings.

6. **"Like" before a year or a stretch of time is dropped, so a guess reads as a fact.**
   - Where: `HEDGES_AMOUNT` in `transcript.ts`. It does not look past a preposition, and it has no words for time.
   - Sizes: all.
   - Evidence:
     - "We came here like in 1980." → "We came here in 1980."
     - "It took like forever." → "It took forever."
     - "It was like ages ago." → "It was ages ago."
     - "like ten kids", "like maybe ten dollars", "like a week" and "like the late seventies" stand.
   - Rule: 17a ("never a hedge before an amount").
   - Fix: let `HEDGES_AMOUNT` look past one of "in", "at", "by", "since", "until" or "around" to a number. Add "forever", "ages", "ever", "early", "late" and "mid". Add the three strings.

## What holds

- **Overflow and type.** At all five sizes, on Home, both Archive views, all eight memories and the missing id:
  - no horizontal scroll and nothing past the right edge;
  - no clipped text (only `.sr-only` spans) and no text under 12px. The phone tab bar labels are 12px.
  - no element or photograph left faded once settled;
  - no target under 44px.
- **Memory pages.**
  - Every title ends in the foil stop (`rgb(201, 161, 90)`). The longest titles take 2 lines at every size.
  - The words are 22px at 1366, 23 at 1920 and 2560, 21 at 800, and 20 at 390.
  - Photo memories put the plate on the left page from 1366 up (0ced at 1920: plate 173–1053, words 1148–1732).
  - No-plate memories have three columns at 1920 and 2560.
  - Every memory has "Memory n of 8", named Previous and Next, and "Where to next".
- **The kept line.**
  - Set at most twice where it should be: 4592, f6a7, 0ced and 5963 each have the head and the mark, with no coda.
  - 342e (2,595 characters) has head, mark and coda. Its coda is at y 2233 against a mark at 792 at 1366.
  - c21c and beee open on it and set nothing under the title.
  - "Ending the chat" and "Childhood" fit one window at 1920 and 2560.
- **Prints.**
  - 4 columns at 1366 (266px), 1920 (375) and 2560 (488); 3 at 800 (232); 2 at 390 (170).
  - Every `.said` fits.
  - Renditions:
    - 600 `contain` for the 254px frame at 1366 (density 1.5). A 3:2 photo is 400 tall against the 381 device px the frame needs.
    - 600 for the 363px frame at 1920 (density 1).
    - 400 for the 220px frame at 800.
    - The original at 2560 and at 390.
  - The landscape upscale from round 8 is gone.
- **List.** 2 columns of 535, 754 and 980px; 1 column at 800 (697) and at 390 (328).
- **Home.**
  - Prints: 3 columns at 1366, 1920, 2560 and 800, and 2 at 390.
  - "From the book" quotes 342e's kept line, the same line as its head and List card.
  - The "Your book", "Family" and "Calls" cards reveal on scroll through the timer fallback.
- **The not-found page.**
  - The cloth, one sheet, Bond (`curious-paper.webp`), "That memory isn't here." with the foil stop, one line of cause and remedy, and "Back to the archive".
  - Settled, it fills exactly one window at all five sizes: 768, 1000, 1300, 1024 and 844.

## Not verified

- **Defects 1 to 6** are proven on strings under Node, importing `transcript.ts` directly. No live memory triggers them.
- **Nhi's memory and card** were not opened, by instruction.
- **The pane was hidden and my tab was in the background.** Lazy images never loaded and CSS transitions sat at time 0 until I forced them. One screenshot at 1920 caught the head column before it painted; a second, a moment later, was correct. Every finding here is measured.
- **The stored Archive view** was "list" when I started. Before I pressed anything at 1366, it read "prints", most likely from another agent's tab sharing localStorage. I pressed Prints and List at each size, and it reads "list" now, as I found it. No data was written. `astory-app-auth` was not touched. My tab's viewport was reset and the tab closed.
- **Not exercised:**
  - reduced motion;
  - hover, active and focus-visible states;
  - the lightbox and View Transitions;
  - a zoomed-out Edge window and a live resize;
  - the server tidy (off, as known);
  - Home's empty invite on a real empty account.
