# Archive, memory page and Home's prints, round 14 (Bao's Standard)

**FAIL, on one defect.**

**What holds.**
- All six round-13 defects are fixed, and so are all eight round-13 skills gaps.
- The lead's four rulings are in the code and hold.
- On every live memory, every cut is on the closed list and the shown words are exactly the said words less those cuts.
- The full pass is clean at all six sizes, and at 375 for the running head: Home, the Archive in List and Prints, all eight memory pages, and the not-found page.
- Home at 320 behaves as the lead ruled: rows stay level and every print stays in its cell.

**The defect.** (e) still cuts a reaction inside a quotation when the quotation is in single quotes ('…' or ‘…’) and holds more than one sentence. The new quotation test counts only double quotes. This is round-13 defect 3 in its remaining form. No live memory triggers it.

Scope:
- `/archive` in Prints and List;
- `/archive/:id` for all eight memories in Bao's story, plus a missing id;
- Home's prints, the week ribbon and "From the book".

Nhi's memory was not opened.

## How I checked

- **Reading.** I read these fresh:
  - 17a as it stands after c3990db;
  - `archive-r13-skills.md`;
  - the ff82ea0 diff: `transcript.ts`, `PrintCard.tsx`, `astory.css`, `archive-reading.css` and the round-14 tests.

  The working tree matches ff82ea0 for every file in scope.
- **Tests.**
  - `vitest run src/components/archive src/lib` passes: 9 files, 478 tests.
  - `tsc --noEmit -p tsconfig.app.json` exits 0.
- **Strings.** I ran ff82ea0's `transcript.ts` under Node 24.18 with `explain`. I covered:
  - every string from archive-r13-baos.md and archive-r13-skills.md;
  - about 60 new strings aimed only at a cut outside the list or a change of meaning;
  - the lead's rulings.
- **Live words.** In my own tab (tab-197), I loaded the account read-only with `loadAccount`. Each memory went through MemoryPage's path: `paragraphsOf`, then `wasSpoken`/`soundsSpoken`, then `explainTranscript`. Then I checked:
  - each cut against its rule;
  - the said text with the cuts taken out against the shown text;
  - the rendered `.mv-para` text against `cleanTranscript` at every size.
- **The full pass.** I loaded each page fresh in a same-origin frame at the exact size:
  - 320×700, 375×812 and 390×844, with overlay scrollbars;
  - 800×1024, 1366×768 and 1920×1000;
  - 2560×1300, where the app sets html zoom 1.3.

  On each load I waited for the page, stepped GSAP and ScrollTrigger, scrolled to the end and back three times, and finished animations. Then I measured:
  - horizontal scroll, and anything past the right edge;
  - text under 12px, clipped text and broken images;
  - targets under 44px;
  - every mosaic print against its cell, the frame tops and bottoms in each row, typed words against their box, and the "New from…" cue against the frame and the words;
  - title lines (text line tops), size and the foil stop;
  - "Memory n of 8" and "Where to next";
  - the running head at every 150px of scroll: each visible label whole, inside the row and not overlapping another, and the fading label never set to an ellipsis;
  - card and print words against `takeaway`;
  - the ribbon days;
  - the not-found page's height.

  Home at 320 was also checked in a screenshot (`tool-results/mcp-Claude_Browser-blob-1792341639194-ida5j1.png`).

## Round 13, checked

**Bao's Standard, round 13 (archive-r13-baos.md): all six fixed.**

| # | Round-13 defect | Now |
|---|---|---|
| 1 | Home's photo prints ran past the edge at 320 | **Fixed.** Every print is its cell's width (123px frames in 135px cells), and every row is level. Row 2 is 230px tall, because the c21c typed print cannot fit at 13px; the photo beside it shows a taller crop (`object-fit: cover`, img 230 = frame 230). The lead allows this. Nothing leaves its cell and no words are cut. |
| 2 | A hedge before an amount | **Fixed.** All seven strings stand: sixteen, nineteen, an hour, a mile, a year, a week, a quarter. So do the skills strings: fifteen years, nineteen seventy-five, several hundred. |
| 3 | A reaction inside a quotation | **Fixed for double quotes,** curly and straight. All three strings stand. Single quotes are the defect below. |
| 4 | The feeling "like" after felt or looked | **Fixed.** All three strings stand. |
| 5 | A list that goes on with commas | **Fixed.** "We sold pho, banh mi, che." and "We had rice, beans, fish, everything." keep their list comma. |
| 6 | The later "Yeah, yeah," | **Fixed.** Both strings stand, and so does "Yeah, yeah, yeah, we know." as the opening. |

**The skills review, round 13 (archive-r13-skills.md): all eight gaps closed.**

| # | Gap | Now |
|---|---|---|
| 1 | Prints at 320 | **Closed.** See defect 1 above. The Archive's Prints are level too. |
| 2 | The running head from 360 to 479px | **Closed.** Below 480 the book's name steps aside in a section. At 320, 375 and 390, in every steady state, each visible label is whole and inside its row. |
| 3 | The "New from" cue | **Closed.** Below 761px the cue reads "New from Bao": 113×22 at 320 and 117×22 at 390. Above that it reads "New from Bao Ngo Gia Vo" (197×24). At every size it sits inside its frame and above the words, never over them. The card's name carries the full line. |
| 4 | A "Yeah," after a question in single quotes | **Closed.** "He asked me, 'Were you there?' Yeah, I was there…" keeps "Yeah,", within a paragraph and across a paragraph break. |
| 5 | Amounts | **Closed.** See defect 2 above. |
| 6 | Surviving mutants | **Closed.** Inputs exist, and the T41 straight-quote kept line keeps its quote in `keptLine`, `takeaway` and `findTakeaway`. |
| 7 | The header comment | **Closed.** It now states the list as applied. |
| 8 | "Yeah, yeah" | **Closed.** |

The skills report's lead items are settled by c3990db and hold in the code:
- "We were, uh, poor and hungry." → "We were poor and hungry." (a form of be before the filler).
- "We had, um, 20 dollars." → "We had 20 dollars."
- "She was all, like, no." and "She was just, like, get out." stand.

## The lead's rulings, checked

- **"Yeah, right." stays whole.**
  - The opening "Yeah, right. He never paid us." stands.
  - `cleanTranscript(["Yeah, right.", "We lived by the river."])` returns both paragraphs unchanged.
  - The later "…Yeah, right. We never saw a cent." stands.
  - The (e) reaction "Yeah, right?" still goes.
- **"A Story:" is a label only at a line or sentence start.**
  - "Me: I started a company called A Story: it keeps memories." stays whole in the teller's words.
  - "…I work at A Story. A Story: Tell me more." and "\nA Story: What do you remember?" are set as "We asked".
- **First person in a lifted question.**
  - "Did my dad stay?…" and "Was it hard for us?…" are never lifted.
  - "Did Mom like it? Our house was tiny. Yes." stays in the teller's words: the asker going on now needs "Because/And/So our…" or "We're/We are/We'll/We want".
  - 5963's live line is still lifted.
- **No ellipsis during the running head's crossfade.** The label leaving is `position: absolute; max-width: none; overflow: visible; text-overflow: clip`. At no scroll step on any page or size was a fading label set to an ellipsis. Below 480, the book's name fades out over 160ms and back in after a 120ms delay; it no longer jumps.

## Every live memory against its exact words

Unchanged from round 13, and each cut is still on the list:
- **342e4b40:** "Wait, were you?" and the "Yeah." after it (e).
- **59632e67:**
  - "Yeah, " after a statement (a-later).
  - "Yeah, right?" and "Wow, that's amazing." (e).
  - One "We asked" line, the yes-or-no "Do they open to non-students as well?", answered by exactly "For sure.".
- **f6a734be:**
  - The opening "Yeah, " (a-opening).
  - "Yeah, " and "So yeah, " after statements (a-later).
  - "That's awesome." (e).
- **0ced62a7, c21cf4d4, 459228bd:** nothing is cut.
- **beeedb62:** typed, so it is not tidied.
- **f9b0e6e9:** only the labels go. The AI's reply is "We asked", which is accepted.

On every piece, the said text less its cuts equals the shown text. The rendered body equals `cleanTranscript` at all seven sizes. Every card and print's words equal `takeaway`, and Home's "From the book" quotes 342e's kept line at every size.

## Defect

1. **(e) cuts a reaction inside a quotation in single quotes when the quotation holds more than one sentence.**
   - **Where:** `insideQuote`, `transcript.ts` (new in ff82ea0). It counts “ against ” and the parity of straight `"`. It never counts ‘…’ or straight `'…'`. The `breaksRule` mirror shares the gap.
   - **Sizes:** all. The words show on the page, the cards and Home's quote.
   - **Evidence** (`cleanSpeech`, explain `e-reaction`):
     - `He read it and said, 'Okay. Wow. That's amazing.' Then he left.` → `…said, 'Okay. That's amazing.' Then he left.`
     - `He read it and said, ‘Okay. Wow. That's amazing.’ Then he left.` → `…said, ‘Okay. That's amazing.’ Then he left.`
     - `She said, 'Really? Wait, were you? I never knew.'` → `She said, 'Really? I never knew.'`
     - `He said, 'Oh. Wow. Yeah. I see.' And he left.` → `He said, 'Oh. I see.' And he left.`

     A reaction alone in single quotes (`'Wow.' That was all.`) stands, because the sentence itself starts with the quote mark.
   - **Rule:** 17a (e), "never inside quotation marks". This cut is outside the list. Round-12 skills gap 7 already counts the straight single quote as a closing quote everywhere else.
   - **Fix:**
     - In `insideQuote`, count ‘ against ’ too, and count a straight `'` only where it opens or closes a quotation. An opening quote has no letter before it and a letter or digit after it. A closing quote has no letter after it and follows a letter or `.!?,`. That leaves the apostrophes in "That's" and "dad's" alone.
     - Mirror the change in `breaksRule`.
     - Add the four strings, kept, to the round-14 keep corpus.

## For the lead (not counted)

- **17a's text lags two of this round's rulings.**
  - It still says the other side's names, A Story among them, count as labels "anywhere once the text opens on a label". The code now counts "A Story:" only at a line or sentence start, as the lead ruled.
  - (b) names be, go, say and think. The code also keeps ", like," after feel, look, seem and sound. That keeping matches 17a's "never the feeling 'like'".

  Neither is a defect in the page; the standard's wording should catch up.
- **(b) still takes a quoting "like" after a word that is not on its list:** "And I'm standing there, like, what is going on?" → "…standing there what is going on?". This is on (b)'s letter as the lead wrote it this round.
- **A lifted question when the next sentence opens "We'll" or "We are":** "Did they go back? We'll see. Yes. They went." sets "Did they go back? We'll see." as "We asked". The shape allows it, but it can be the teller's own question.

## What holds

- **Overflow and type.** On every page in scope, at all seven sizes and in both Archive views:
  - `scrollWidth` equals `clientWidth`, and nothing sits past the right edge;
  - no text is under 12px;
  - no image is broken;
  - no visible text is clipped. The only "clips" are the 1px `sr-only` labels.
  - no target is under 44px. The search input sits in its 44px label, as before.
- **Prints.** No print leaves its cell, and every row's frames share a top and a bottom at every size. No typed word is cut. At 320, Home's c21c words step to 13px with an 18px line height, and beee's to 13.5px with 19px.

  | Size | Archive Prints | Home |
  |---|---|---|
  | 320 | 2 × 135px | 2 × 135px |
  | 390 | 2 × 170px | 2 × 170px |
  | 800 | 3 × 232px | 3 × 234px |
  | 1366 | 4 × 262px | 3 × 241px |
  | 1920 | 4 × 375px | 3 × 346px |
  | 2560 (zoom 1.3) | 4 × 375px | 3 × 346px |
- **List.** One column below 800px wide and two from 1366 up, as in round 13.
- **The ribbon.** Days are 46.7px at 320, 50px at 390 and 54px from 800 up.
- **Memory pages.**
  - Every title has the foil stop and takes two lines or fewer: "Ending the chat." takes one, the rest take two.
  - Sizes: 23 to 32px at 320; 27 to 32px at 375; 28 to 32px at 390; 44px at 800 and 1366; 36 or 50px at 1920; 46.8 or 65px at 2560.
  - Every memory has "Memory n of 8" and "Where to next".
- **Not-found page.** At all six sizes it is exactly one window tall, with Bond (curious-paper) loaded, the headline, one line of cause and remedy, and "Back to the archive".

## Not verified

- **Strings only.** The defect is proven on strings under Node only.
- **Not exercised:**
  - hover, active and focus-visible states;
  - reduced motion and View Transitions;
  - the lightbox;
  - the server tidy, which is off.
- **No real frame clock.** The pane was hidden, so CSS transitions did not run by themselves. I read the crossfade from its computed styles at every scroll step, then finished it before measuring the steady state. I did not watch it in real time.
- **3840 and the founder's zoomed Edge window** were not checked.

## Shared state

- **Archive view.** The stored view (`astory.archiveView`) was "list" when I started.
  - Partway through, before any Prints press of mine, it read "prints". Something outside my tab changed it, so my first 320 List check loaded in Prints. I re-ran 320 List afterwards.
  - Each of my Prints checks pressed Prints and then List with the page's own buttons.
  - It reads "list" now.
- **Sign-in.** `astory-app-auth` is present and untouched. I did not sign out and wrote no data.
- **My helpers and tab.** My helper keys (`baos-r14*` in `sessionStorage`) and my frames are removed. tab-197's viewport is reset to desktop, and the tab is closed.
