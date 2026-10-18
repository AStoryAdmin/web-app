# Archive, memory page and Home's prints, round 15 (Bao's Standard)

**FAIL, on two tidy defects. The layout passes.**

What passes:
- **Earlier rounds.** My round-14 defect (single quotes and guillemets) is fixed, and all eight round-14 skills gaps are closed.
- **Live memories.** On every one, every cut is on 17a's current list. The said words less the cuts equal the shown words, and the rendered body equals `cleanTranscript` at all eight sizes.
- **Layout.** Home, the Archive in List and Prints, all eight memory pages and the not-found page are clean from 320 to 2560. That covers:
  - the phone in-flow prints, now up to 760px;
  - the batched fit;
  - the measured running head, including a long book name;
  - the given-name cue.

What fails is held to 17a's text as it stands now, after 4d9630c, 6c18b87 and ec7c671. No live memory triggers either defect.
1. **(e) The plural-possessive guard is missing.** A curly ’ after a letter still closes a quotation before a space. So in "“Our parents’ house. Wow. Big.”" the "Wow." is cut, though it sits inside the quotation. ec7c671 rules that "the boys’ room" never closes one.
2. **(b) "A or an with a unit" knows only some units.** "like, a ton", "an acre", "a hectare", "a foot", "a metre", "a litre", "a gallon", "a gram", "an inch", "a bag", "a century" and others are cut.

Scope:
- `/archive` in Prints and List;
- `/archive/:id` for all eight memories in Bao's story, plus a missing id;
- Home's prints, the week ribbon and "From the book".

Nhi's memory was not opened.

## How I checked

- **Reading.** I read 17a fresh at HEAD, including ec7c671, which landed during this review and adds the plural-possessive and carry rules to (e). I also read `archive-r14-skills.md` and the 30d1997 diff:
  - `transcript.ts`;
  - `PrintCard.tsx` (the batched fit and the given-name cue);
  - `atmosphere.ts` (`.tight` and `.tight-page`);
  - `astory.css` and `archive-reading.css`.

  The archive files in the working tree match 30d1997. Other agents have since committed Book work that touches `Home.tsx` (the held question) and `astory.css` (the scrollbar track), and they have uncommitted edits to `App.tsx`, `Person.tsx`, `book-account.css` and `index.html`. The pages I measured include those.
- **Tests.** `vitest run src/components/archive src/lib` passes: 9 files, 535 tests. `tsc --noEmit -p tsconfig.app.json` exits 0.
- **Strings.** I ran 30d1997's `transcript.ts` under Node 24.18, with `explain`, on:
  - every string from archive-r14-baos.md and archive-r14-skills.md;
  - about 110 new strings, aimed only at a cut outside the list or a change of meaning.
- **Live words.** In my own tab (tab-205), I loaded the account read-only with `loadAccount`. Every memory went through MemoryPage's path: `paragraphsOf`, then `wasSpoken`/`soundsSpoken`, then `explainTranscript`. Then I checked:
  - each cut against its rule;
  - the said text less the cuts against the shown text, word for word;
  - the rendered `.mv-para` text against `cleanTranscript` at every size.
- **Layout.** I loaded each page fresh in a same-origin frame at the exact size:
  - Home, List and Prints at 320, 360, 375, 390, 414, 600, 760, 800, 1366, 1920 and 2560 (html zoom 1.3);
  - the eight memories at 320, 360, 375, 390, 800, 1366, 1920 and 2560;
  - the missing id at 320, 390, 800, 1366, 1920 and 2560.

  Phone widths used overlay scrollbars. On each load I stepped GSAP and ScrollTrigger, scrolled to the end and back three times, and finished animations. Then I measured:
  - overflow, text under 12px, clipping and broken images;
  - targets under 44px;
  - every print against its cell, the frame tops and bottoms in each row, typed words against their box, and the words' last line against the caption's title;
  - the cue against its frame and the words;
  - the running head at every 150px of scroll (each visible label whole, inside its row and not overlapping another, and no fading label set to an ellipsis);
  - title lines, size and the foil stop;
  - "Memory n of 8" and "Where to next";
  - card words against `takeaway`;
  - the ribbon days;
  - the not-found page's height.

  The running head was also tested with a 297px book name at 480 and 520.

## Round 14, checked

**Bao's Standard, round 14:** the one defect is fixed. All four single-quote strings and the guillemet string stand.

**The skills review, round 14: all eight gaps closed.**

| # | Gap | Now |
|---|---|---|
| 1 | Words into the caption at 360–365 | **Closed.** Typed prints stack cue, words and caption up to 760px. At 360 no word line reaches the title on Home or the Archive, and c21c fits at 13px. |
| 2 | Single quotes and guillemets | **Closed** (see above). |
| 3 | A possessive 's read as "is" | **Closed.** "Lan's, Mai's, and Hoa's", "Lan's, Minh's and Long's" and "my uncle's, my aunt's" each keep a comma. |
| 4 | The fit left out the cue | **Closed.** `fitNeed` adds the cue in the flow, and the fit reruns when the cue, the date, the chapter or the title changes. |
| 5 | Layout forced per card | **Closed.** One pass for all typed prints: write a step to every waiting print, then read them all. At most four layouts. |
| 6 | The running head with a long book name | **Closed.** With "The Nguyen-Tran Montgomery book" (297px) at 480 and 520, the head is `.tight`. At the top it shows the book's name (20–317) and "Archive", both whole. In the family section it shows "What the family remembers" alone and whole (229–460 at 480). |
| 7 | More amounts | **Closed.** "fourth grade", "nothing", "about ten", "maybe ten" and "zero money" all stand. |
| 8 | Surviving mutants | **Closed.** I re-ran the listed inputs. For example, `takeaway("We were so poor, like, really poor in those years.")` returns that sentence exactly, and "Yeah, Yeah," and "'Was it good, right?'" stand. |

## 17a's current text against the code, checked

- **(a) One comma always stays, unless a form of be or have comes before the filler.**
  - The be/have list is exact: be, been, am, is, are, was, were, have, has, had, or 's, 'm, 're, 've, 'd after a pronoun or after what, who, where, how, there, here or that.
  - "It's, um, a long story", "That's, um, my brother", "What's, um, the word", "He'd, um, go" and "We have, um, two kids" lose both commas.
  - "The car's, um, red", "My mom's, um, cooking", "Let's, um, go", "Being, um, poor" and "It, um, was hard" keep one. These are on the letter, and a spare comma never changes what was meant.
- **(b)**
  - "standing there, like, what is going on?", "Do you, like, cook?" and "It was, like, the best day!" stand: the words after "like" run to a ? or !.
  - "It felt, like, a dream" stands, and so do the amounts named above.
  - "I sort of, like, knew" loses its "like", which matches the letter: "sort of" counts only after be, go, say or think.
- **"A Story:" counts as a label only at a start.**
  - "…called A Story: it keeps memories." stays in the teller's words.
  - "…I love it. A Story: Tell me more." is set as "We asked".
- **The asker's going-on never opens on a first-person word.**
  - These stay in the teller's words: "Did they like it? We want to know. Yes.", "Did they open to students? Because we'd love that. Yes.", "Is it good for us?…" and "Did they call me?…".
  - 5963's "Do they open… Because our strategy…" is still lifted. It opens on "Because".

## Every live memory against its exact words

Every cut meets its rule's exact condition. On every piece, the said text less the cuts equals the shown text. None of the cut memories holds a quotation mark.
- **342e4b40:** "Wait, were you?" and the "Yeah." after it (e).
- **59632e67:**
  - "Yeah, " after a statement (a-later).
  - "Yeah, right?" and "Wow, that's amazing." (e).
  - One "We asked" line, which matches the exact-reply shape.
- **f6a734be:**
  - The opening "Yeah, " (a-opening).
  - "Yeah, " and "So yeah, " after statements (a-later).
  - "That's awesome." (e).
- **0ced62a7, c21cf4d4, 459228bd:** nothing is cut.
- **beeedb62:** typed, so it is not tidied.
- **f9b0e6e9:** the labels go, and the AI's reply is "We asked", which is accepted.

The rendered body equals `cleanTranscript` on all 64 memory-page loads. Every card and print's words equal `takeaway`, and Home's "From the book" quotes 342e's kept line.

## Defects

1. **(e) A plural possessive with a curly apostrophe closes a quotation, and a reaction later in the same quotation is cut.**
   - **Where:** `quotesAfter`, `transcript.ts`. A curly ’ closes when `curly > 0` and the character before it is a letter and the character after it is not a letter, so a space counts. 17a (ec7c671) says a curly ’ after a letter closes only before punctuation or the end.
   - **Sizes:** all.
   - **Evidence** (`cleanSpeech`, explain `e-reaction "Wow."`):
     - `“Our parents’ house. Wow. Big.” Mom said.` → `“Our parents’ house. Big.” Mom said.`
     - `Inside “the kids’ room. Wow. Nice.” we said.` → `…“the kids’ room. Nice.” We said.`
     - `“The kids’ toys. Wow. Really.” She smiled.` → `“The kids’ toys. Really.” She smiled.`
     - `“Rock ’n’ roll. Wow. Yes.”` → `“Rock ’n’ roll. Yes.”`

     The app's own typography turns ' into ’, so this form will reach typed and edited words.
   - **Rule:** 17a (e), "never inside quotation marks of any kind … a curly ’ after a letter closes only before punctuation or the end, so 'the boys’ room' never closes one". This cut is outside the list.
   - **Fix:**
     - Close on ’ after a letter only when the next character is punctuation (`.,;:!?…` or a closing mark) or the end.
     - Mirror the change in `breaksRule`.
     - Add the four strings, kept.

2. **(b) "A or an with a unit" keeps only some units, so a hedge before most units of measure is cut.**
   - **Where:** `LIKE_AMOUNT_NEXT`, `transcript.ts`:67. Its unit list is second, minute, hour, day, week, month, year, decade, mile, kilometre, quarter, third, pound, kilo, dollar, bowl and cup.
   - **Sizes:** all.
   - **Evidence** (`cleanSpeech`, explain `b-like ", like,"`): "We had, like, a ton / an acre / a hectare / a foot / a metre / a litre / a gallon / a gram / an ounce / an inch / a bag / a sack / a bucket / a plate / a century / a night / a semester of it." Each loses its "like", for example "We had, like, an acre of rice." → "We had an acre of rice." A guess about a family's land becomes a fact.
   - **Rule:** 17a (b), "before an amount, where it hedges: … a or an with a unit". This cut is outside the list.
   - **Fix:**
     - Widen the unit list to the measures a family story uses:
       - time: night, semester, term, season, century, lifetime;
       - length: inch, foot, yard, metre/meter, centimetre;
       - area: acre, hectare;
       - weight: gram, ounce, ton/tonne;
       - volume: litre/liter, gallon, pint;
       - containers: bag, sack, bucket, box, basket, plate, pot, bottle, can, glass, spoon.
     - Mirror the list in `breaksRule`.
     - Add the strings.

## For the lead (not counted)

- **A straight inch mark inside a paragraph flips the double-quote parity.** "He bought a 12" knife. Later Mom said, "Okay. Wow. Nice."" loses "Wow." inside Mom's words. The ec7c671 carry rule guards only across paragraphs. Within a paragraph, a `"` after a digit could be read as an inch mark and never toggle the quote.
- **The carry rule keeps more than the text.** The code carries an open quotation into every later paragraph, while 17a carries it only into one that holds a closing mark. After a stray "'90s", later reactions are kept rather than cut. That is a filler not caught, not a defect.
- **Hedges before a time or a span are cut, on the letter:** "At, like, midnight we left." → "At midnight we left."; "We were there, like, the whole summer." → "…the whole summer.". 17a names amounts, not times.
- **The phone cue reads "New from Bao Ngo Gia",** because the family record's given name is "Bao Ngo Gia" (family name "Vo"). The code takes the record's given name as ruled, so this is a data question.

## What holds

- **Overflow and type.** At every size, on Home, List, Prints, all eight memories and the missing id:
  - `scrollWidth` equals `clientWidth`, and nothing sits past the right edge;
  - no text is under 12px, nothing visible is clipped, and no image is broken;
  - no target is under 44px.
- **Prints.** No print leaves its cell, every row is level, no words are cut, no word line runs into a title, and every cue sits inside its frame above the words.
  - 320 Home: 2 × 135px columns. Rows are 164 / 244 / 164px tall: the c21c row grows, as the lead allows, with c21c at 13px and beee at 13.5px.
  - 320 Prints: rows are 164 / 244 / 164 / 173px.
  - 360: 155px columns, c21c at 13px.
  - 375 to 760: every typed print fits at 15px at 3:4, with 163, 170, 182, 275 and 355px columns.
  - 800: 3 columns. 1366: 3 (Home) and 4 (Prints). 1920 and 2560: 3 × 346px (Home) and 4 × 375px (Prints).
- **The cue.** It reads "New from Bao Ngo Gia" up to 760px, 115–166px wide and inside the frame. From 800 it reads "New from Bao Ngo Gia Vo" (197px). The card's accessible name carries the full line.
- **The ribbon.** Days are at least 44px everywhere: 46.7px at 320, 45.7 at 360, 47.9 at 375, 50 at 390 and 54 from 800 up.
- **The running head.** On every memory, at every 150px of scroll and every size:
  - no visible label is cut, outside its row or overlapping another;
  - no fading label is set to an ellipsis;
  - from 320 to 390 the head measures `.tight` and the book's name steps aside in the family section.
- **Titles.**
  - Every title has the foil stop and takes two lines or fewer.
  - Sizes: 23 to 32px from 320 to 390; 44px at 800 and 1366; 36 or 50px at 1920; 46.8 or 65px at 2560.
  - Every memory has "Memory n of 8" and "Where to next".
- **Not-found page.** At all six sizes it is exactly one window tall, with Bond (`curious-420.webp`), the headline and "Back to the archive".

## Not verified

- **Strings only.** Both defects are proven on strings under Node only.
- **Not exercised:**
  - hover, active and focus-visible states;
  - reduced motion;
  - the server tidy, which is off.
- **No live clock.** The pane was hidden, so CSS transitions did not run by themselves. I read the crossfade's styles at each step and finished it before measuring the steady state. I did not watch a live resize of the fit; `.tight` was set on load and after my book-name change.
- **A reload during the review.** My tab reloaded once, likely a dev-server reload from another agent's edit. My first memory pass was lost, so I ran it again in full and kept its results in `sessionStorage` as it went.
- **3840 and the founder's zoomed Edge window** were not checked.

## Shared state

- **Archive view.** The stored view (`astory.archiveView`) was "list" at the start and is "list" now. Each Prints check pressed Prints and then List with the page's own buttons.
- **Sign-in.** `astory-app-auth` is present and untouched. I did not sign out and wrote no data.
- **My helpers and tab.**
  - My helper keys (`baos-r15*` in `sessionStorage`) and my frames are removed.
  - The book-name change was made in a frame's DOM only, and the frame is gone.
  - tab-205's viewport is reset to desktop, and the tab is closed.
