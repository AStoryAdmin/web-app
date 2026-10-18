# Archive, memory page and Home's prints, round 13 (Bao's Standard)

**FAIL**

The live memories pass:
- every cut on all eight live memories is on the closed list and meets its rule's exact condition;
- the words outside the cuts are exactly the shown words;
- the kept lines drop only what the list allows.

All seven round-12 defects are fixed as written, and so are all nine round-12 skills gaps. The memory pages, the Archive (both views) and the not-found page pass the full pass at all six sizes.

Six faults remain:
- **One layout regression at 320.** It comes from this round's typed-print fix. On Home, two photo prints run up to 51px wider than their column, past the right edge, and their titles are cut off.
- **Two cuts outside the list.** No live memory triggers either one.
  - (b) still takes a hedging "like" before most amounts: an hour, a mile, a year, sixteen, nineteen.
  - (e) cuts a reaction inside quotation marks when the quotation holds more than one sentence.
- **Three cuts on the list's letter that change what was meant.** No live memory triggers these either.
  - the feeling "like" after felt or looked;
  - a filler inside a list that goes on with commas;
  - the first of a later "Yeah, yeah,".

Scope:
- `/archive` in Prints and List;
- `/archive/:id` for all eight memories in Bao's story, plus a missing id;
- Home's prints, the week ribbon and "From the book".

Nhi's memory was not opened.

## How I checked

- **Reading.** I read these fresh:
  - `docs/BAOS-STANDARD.md`, with 17a's closed list as amended in bf50499, d123283 and a37eb12;
  - DESIGN.md's craft rules;
  - `archive-r12-baos.md` and `archive-r12-skills.md`;
  - commit 57c3d46: the `transcript.ts`, `astory.css` and `archive-reading.css` diffs, all of `transcript.ts`, and the round-13 fixtures and contract tests in `transcript.test.ts`.

  Uncommitted edits in the working tree touch only `bookFit.ts` and `signed-out.css`.
- **Tests.**
  - `vitest run src/components/archive src/lib` passes: 9 files, 417 tests.
  - `tsc --noEmit -p tsconfig.app.json` exits 0.
- **Strings.** I ran a copy of 57c3d46's `transcript.ts` under Node 24.18. I read every cut with `cleanSpeech(…, { explain: true })` and `explainTranscript`, and checked `takeaway` and `keptLine`, on:
  - every string from both round-12 reports;
  - about 70 new strings written only to find a cut outside the list or a change of meaning.
- **The live words.** In my own tab (tab-186), I loaded the account read-only with the app's `loadAccount`. Each memory went through MemoryPage's own path: `paragraphsOf`, then `wasSpoken`/`soundsSpoken`, then `explainTranscript`. Then I checked:
  - each cut against its rule;
  - the said text with the cuts taken out against each piece's shown text;
  - the rendered `.mv-para` text against `cleanTranscript`, at all six sizes.
- **The full pass.** I loaded each page fresh in a same-origin frame at the exact size:
  - 320×700 and 390×844, with overlay scrollbars as on a phone;
  - 800×1024, 1366×768 and 1920×1000, with classic scrollbars;
  - 2560×1300, where the app sets html zoom 1.3.

  On each load I:
  - waited for the page to load;
  - stepped GSAP and ScrollTrigger;
  - scrolled to the end and back three times;
  - finished CSS animations;
  - set lazy images to eager.

  Then I measured:
  - horizontal scroll, and anything past the right edge outside a clipping parent;
  - text under 12px (size × zoom), clipped or ellipsised text, and text left under half opacity;
  - broken images and targets under 44px;
  - grid columns, each print against its cell, and typed-print words;
  - title lines (Range line tops), size, the kept line, "Memory n of 8" and "Where to next";
  - the running head at every 150px of scroll;
  - card words against `takeaway`, and Home's quote;
  - the week ribbon's day widths;
  - the not-found page.

  Defect 1 was also confirmed in a screenshot.

## Round 12, checked

**Bao's Standard, round 12 (archive-r12-baos.md): all seven fixed as written.** Every string in that report comes out as its fix asks.

| # | Round-12 defect | Now |
|---|---|---|
| 1 | (b) removed the quoting "like" | **Fixed.** `LIKE_QUOTES_AFTER` keeps ", like," after be, go or say. All three strings stand. |
| 2 | (b) removed a hedge before an amount | **Fixed for the words listed.** All four strings stand. Other amounts are still cut (defect 2). |
| 3 | A filler took a list's comma | **Fixed.** "Tuan, Minh and Long", "Hue, Saigon and then Houston", "rice, fish and beans" and "1975, April" all come out right, and "We were poor." still loses both commas. A list that goes on with commas is still merged (defect 5). |
| 4 | A typed print clamped at 320 | **Fixed in the Archive.** Every typed print's words are whole at 320, with no overflow on Home or in Prints. The same rule widens Home's photo prints (defect 1). |
| 5 | The running head cut the book's name at 320 | **Fixed.** At 320, out of a section the head reads "The Vo book" (101/101px) and the page name (90/90). In the family section the book's name steps aside and "What the family remembers" is whole (231/231, at x 20–251). At 390 and up nothing is clipped in any steady state. |
| 6 | (e) cut a quoted "Wow." | **Fixed** for a quotation that is one sentence. All four strings stand. A quotation of several sentences is still cut (defect 3). |
| 7 | Home's ribbon days were 40px at 320 | **Fixed.** All 83 days are 46.7px or wider. They are 50px at 390 and 54px from 800 up. |

**The skills review, round 12 (archive-r12-skills.md): all nine gaps closed.**

| # | Gap | Now |
|---|---|---|
| 1 | "Yeah," after a reaction question | **Closed.** "Wait, were you? Yeah, I was there…" keeps "Yeah,", and "Wait, were you? Yeah. So I left." still loses the "Yeah." (e). |
| 2 | A quoted reaction cut | **Closed** for a quotation of one sentence. The rest is defect 3. |
| 3 | Nine surviving mutants | **Closed.** There are inputs for N4, N8, N15, N17, N20, N21, N28 and N34, and a word-equality run-on test for N30. |
| 4 | The kept line could be the asker's sentence | **Closed.** `keptLine` and `takeaway` skip lifted sentences, and there is a test for it. |
| 5 | A why question lifted | **Closed.** `ASK` covers yes-or-no questions only, so "Why did Grandpa leave Hue?…" and "Why did Dad stay?…" stand. |
| 6 | The opening word dropped before its double | **Closed.** "So, so", "Well, well, well" and "Okay, okay" stand. |
| 7 | Straight closing quotes | **Closed.** All three strings stand. |
| 8 | "A:" inside a labelled sentence | **Closed.** "Me: We had plan A: we go north." gives "We had plan A: we go north." |
| 9 | The `takeaway` comment and `cap` | **Closed.** "iPhone" and "eBay" stay as written. |

## Every live memory against its exact words

Every cut below meets its rule's exact condition. On every piece, the said text with the cuts taken out equals the shown text, word for word. The rendered body equals `cleanTranscript` at all six sizes, ignoring curly apostrophes and paragraph splits.

- **342e4b40:**
  - "Wait, were you?" (e), and the "Yeah." straight after it (e).
  - Nothing else goes.
- **59632e67:**
  - "Yeah, " before "gaming and mental health…" (a-later). The sentence before it, "So we did all these cool things.", is not a question.
  - "Yeah, right?" and "Wow, that's amazing." (e).
  - The one "We asked" line is "Do they open to non-students as well? Because our strategy…", answered by exactly "For sure.". That is a yes-or-no question with no first person.
- **f6a734be:**
  - The opening "Yeah, " (a-opening).
  - "Yeah, " before "it was different though." and "So yeah, " before "if you heard of…" (a-later). Neither follows a question.
  - "That's awesome." (e).
- **0ced62a7, c21cf4d4, 459228bd:** nothing is cut.
- **beeedb62:** typed, so it is not tidied.
- **f9b0e6e9:** nothing is cut. The labels "You:" and "AI:" go, and the AI's reply is set as "We asked", which is accepted.

No live text holds ", like,", a filler between commas, "yeah, yeah", "A Story:" or a reaction inside quotation marks.

**The kept lines.**
- 459228bd: "The best way to learn finance is to build a business." "So" goes before "the".
- 59632e67: "You always have to just look for every opportunity." "So" goes before a pronoun.
- f6a734be: "I want to help growing ventures because I get to work with startups."
- 342e4b40: "I thought we were gonna raise money like right out of the gate." Home's "From the book" quotes this line at all six sizes.
- c21cf4d4 and 0ced62a7: verbatim.
- beeedb62: "We live in a small city · It's in Vietnam".
- f9b0e6e9: "How to end chay."

Every List card and every print's words equal `takeaway`.

## Defects, worst first

Defect 1 is measured live. Defects 2 to 6 are proven on strings under Node, importing 57c3d46's `transcript.ts`; no live memory triggers them.

1. **At 320 on Home, two photo prints run past the right edge, and their titles are cut off.**
   - **Where:** `archive-reading.css`:657–664, the new `@media (max-width: 359.98px)` block for typed prints.
     - In `.home-mem .mosaic`, a typed print now grows in the flow: "My grandfather…" is 232px tall, "We live in a small city…" 178px.
     - This stretches its grid row.
     - The photo print beside it keeps `.frame { height: 100%; aspect-ratio: 3 / 4 }` (`astory.css`:2391 with `archive-reading.css`:573), so the taller row makes it wider.
   - **Size:** 320×700 only. Nothing overflows at 390 and up, and nothing overflows in Archive Prints, where the typed prints happen to pair with each other.
   - **Evidence:**
     - "Choosing a startup over finance graduate study" is 186px wide in a 135px cell, and its right edge is at 351 on a 320 page.
     - "Pausing a PhD to support startup ventures" is 146px in 135.
     - `html` clips the overflow, so `scrollWidth` stays 320 but the print and its caption are cut ("Choosing a startup ov / finance graduate stud"). See `tool-results/mcp-Claude_Browser-blob-1792338508484-dfl0c7.png`.
   - **Rule:**
     - the checklist: no clipped text, aligned columns;
     - rule 12: the ratio holds;
     - rule 1: the fix for one print broke its neighbour.
   - **Fix:** in the same block, let a photo print keep its own width:
     - give `.home-mem .print-card:not(.typed) .frame` and `.arc-prints .print-card:not(.typed) .frame` `width: 100%; height: auto`, keeping the 3:4;
     - or set `align-self: start` on the mosaic cells;
     - then check every row at 320 in both places.

2. **(b) still takes a hedging "like" before most amounts, so an estimate becomes a fact.**
   - **Where:** `LIKE_AMOUNT_NEXT`, `transcript.ts`:41, and its mirror in `breaksRule`. It knows only the digits, one to twelve, the tens, hundred, thousand, million, dozen, half, and "a few/couple/hundred/thousand/million/dozen".
   - **Sizes:** all. The words show on the page, the cards and Home's quote.
   - **Evidence** (`cleanSpeech`, explain `b-like ", like,"`):
     - "I left home at, like, sixteen." → "I left home at sixteen."
     - "I got married at, like, nineteen." → "I got married at nineteen."
     - "We waited, like, an hour for the bus." → "We waited an hour for the bus."
     - "We walked, like, a mile every day." → "We walked a mile every day."
     - "We lived there for, like, a year." → "We lived there for a year."
     - "It took, like, a week to get there." → "It took a week to get there."
     - "We had, like, a quarter of the rice left." → "We had a quarter of the rice left."

     Ages said as words ("at, like, sixteen") are common in a life story.
   - **Rule:** 17a (b), "and before an amount, where it hedges … stays"; 17a's "never a hedge before an amount". This cut is outside the list.
   - **Fix:**
     - Add thirteen to nineteen, zero, and "a" or "an" before a unit of measure or time (second, minute, hour, day, week, month, year, mile, kilometre, quarter, third, pound, kilo, dollar and the like) to `LIKE_AMOUNT_NEXT` and to `breaksRule`.
     - Add the seven strings to the keep corpus.

3. **(e) cuts a reaction inside quotation marks when the quotation holds more than one sentence.**
   - **Where:** `tidyParagraph`, `transcript.ts`:186–189 (and :308 for the asked line). `REACTION` is tested on each sentence alone. A sentence in the middle of a quotation carries no quote mark, so it matches. `breaksRule`'s "inside quotation marks" test has the same blind spot.
   - **Sizes:** all.
   - **Evidence:**
     - `He read it and said, “Okay. Wow. That's amazing.” Then he left.` → `He read it and said, “Okay. That's amazing.” Then he left.` (e-reaction "Wow.")
     - `She said, “Really? Wait, were you? I never knew.”` → `She said, “Really? I never knew.”`
     - `He said, "Oh. Wow. Yeah. I see." And he left.` → `He said, "Oh. I see." And he left.` (two cuts)
   - **Rule:** 17a (e), "whole sentences from this set only, never inside quotation marks". This cut is outside the list.
   - **Fix:**
     - Track whether a sentence starts inside an open quotation (count the unclosed “ and " marks from the start of the paragraph), and skip (e) there.
     - Mirror this in `breaksRule`.
     - Add the three strings.

4. **(b) takes the feeling "like" after feel or look, so a comparison becomes a broken sentence.**
   - **Where:** `LIKE_QUOTES_AFTER`, `transcript.ts`:39. Its exceptions are be, go and say only.
   - **Sizes:** all.
   - **Evidence:**
     - "It felt, like, a dream." → "It felt a dream."
     - "It felt, like, home to us." → "It felt home to us."
     - "It looked, like, a palace to me." → "It looked a palace to me."
   - **Rule:** 17a, "never the quoting or feeling 'like'" and "never changes what was meant". The test file names "It feels like just yesterday…" as the feeling "like" (`transcript.test.ts`:553). This is the same pattern as round-12 defect 1: on (b)'s letter, against 17a's "never".
   - **Fix:**
     - Add feel, feels, felt, feeling, look, looks, looked, seem, seems, seemed, sound, sounds and sounded to the words before ", like," that keep it.
     - Mirror them in `breaksRule`.
     - Add the three strings.

5. **A filler between commas inside a list that goes on with commas takes both commas, and two items run together.**
   - **Where:** `LIST_GOES_ON`, `transcript.ts`:125. It knows a list goes on only by a capital, a number, or "and"/"or" within three words.
   - **Sizes:** all.
   - **Evidence:**
     - "We sold pho, um, banh mi, che." → "We sold pho banh mi, che." Two dishes now read as one.
     - "We had rice, um, beans, fish, everything." → "We had rice beans, fish, everything."
   - **Rule:** 17a, "never changes what was meant". This is round-12 defect 3 in the one form the parenthesis does not name.
   - **Fix:**
     - Count a comma within the next three words as a list going on too. "We were, uh, poor." still loses both commas.
     - Mirror this in `breaksRule`.
     - Add both strings.

6. **A later "Yeah, yeah," loses its first "yeah", though the opening rule now keeps a doubled word.**
   - **Where:** `LATER_YEAH`, `transcript.ts`:35. `OPENING_WORD` (:33) gained `(?!\s*\1\b)` this round; `LATER_YEAH` did not.
   - **Sizes:** all.
   - **Evidence:**
     - "We had to leave everything. Yeah, yeah, it was hard." → "…Yeah, it was hard."
     - "So yeah, yeah, that was it." → "Yeah, that was it."
   - **Rule:**
     - 17a, "never a word doubled for emphasis";
     - rule 1: the fix made for the opening word belongs on its sibling.
   - **Fix:**
     - Add `(?!\s*yeah\b)` to `LATER_YEAH`.
     - Mirror it in `breaksRule`'s a-later check.
     - Add both strings.

## For the lead (not counted)

These follow a ruling's exact letter and can change meaning. I would not change them without a ruling.

- **An opening "Yeah, right." becomes "Right."** The "is not 'Yeah, right'" exception sits on the later "Yeah," only. A fixture expects this (`transcript.test.ts`:21–22, `["Yeah, right.", …]` → `["Right.", …]`). It contradicts d123283's own summary, "'Yeah, right' stays".
- **"A Story:" counts as a label anywhere in a labelled text, and A Story is the founder's company.** "Me: I started a company called A Story: it keeps memories. AI: …" sets "I started a company called." as the teller's words. Then "it keeps memories." is set as "We asked", and the company's name is gone.
- **A teller's own yes-or-no question can still be lifted** when their next sentence opens on "Our" or "We want": "Did Mom like it? Our house was tiny. Yes. She loved it anyway." sets "Did Mom like it? Our house was tiny." as "We asked". The list's shape allows it, and 17a says "never a question the teller asks themselves".
- **A quoting "like" after a word between it and the verb is cut:** "I was just, like, wow." → "I was just wow."; "And I'm standing there, like, what is going on?" → "…standing there what is going on?".
- **The running head's crossfade.** For the 240ms of the fade, the outgoing label is already `position: absolute` in the incoming label's cell. Leaving the family section, "What the family remembers" fades out ellipsised in a 75–90px cell. At 320, the book's name also returns with no fade. It is never visible at rest.

## What holds

- **Overflow and type.** On every page in scope, at all six sizes and in both Archive views:
  - `scrollWidth` equals `clientWidth`;
  - nothing sits past the right edge, apart from defect 1;
  - no text is under 12px;
  - no image is broken;
  - no steady-state text is clipped;
  - nothing stays under half opacity once scrolled into view. The cards and prints reveal to opacity 1.
- **Targets.** None is under 44px. The search input (33px tall) sits inside its 44px `label.input`, as in round 12.
- **Titles.**
  - "Ending the chat." takes one line and the rest take two. On 59632e67 the seal adds a third rect, but the text has two line tops.
  - Sizes: 44px at 800 and 1366; 50px or 36px at 1920; 65px or 46.8px at 2560; 28 to 32px at 390; 23 to 32px at 320.
- **Memory pages.** Every memory has "Memory n of 8" and "Where to next" at every size. The kept line sits under the title on 0ced, c21c, 342e, 4592, f6a7 and 5963.
- **Prints and List.**

  | Size | Archive Prints | Home | List |
  |---|---|---|---|
  | 320 | 2 × 135px | 2 × 135px | 1 column |
  | 390 | 2 × 170px | 2 × 170px | 1 column |
  | 800 | 3 × 232px | 3 × 234px | 1 column |
  | 1366 | 4 × 266px | 3 × 244px | 2 columns |
  | 1920 | 4 × 375px | 3 × 346px | 2 columns |
  | 2560 (zoom 1.3) | 4 × 375px | 3 × 346px | 2 columns |

  No print's words are clipped at any size.
- **The ribbon.** All 83 days are 46.7px at 320, 50px at 390 and 54px from 800 up.
- **Not-found page.** It shows Bond (`/dog/curious-paper.webp`), "That memory isn't here", one line of cause and remedy, and "Back to the archive" (198×48). It is exactly one window tall at all six sizes.

## Not verified

- **Strings only.** Defects 2 to 6 are proven on strings under Node only.
- **Not exercised:**
  - hover, active and focus-visible states;
  - reduced motion and View Transitions;
  - the lightbox;
  - the server tidy, which is off.
- **No real pointer or frame clock.** The pane was hidden, so CSS transitions did not advance by themselves. I settled pages by stepping GSAP and ScrollTrigger and by finishing animations. The running-head crossfade above is read from the CSS, not watched in real time.
- **Scrollbars and touch.** The 320 and 390 runs hid the frame's scrollbar to match a phone's overlay scrollbar. Device pixel ratio and the touch user agent were not emulated in the frame.
- **3840 and the founder's zoomed Edge window** were not checked.

## Shared state

- **Archive view.** The stored view (`astory.archiveView`) was "list" when I started. For each Prints check I pressed Prints and then List with the page's own buttons inside my frame, and it reads "list" now.
- **Sign-in.** `astory-app-auth` is present and untouched. I did not sign out and wrote no data.
- **My helpers.** My helper code lived in my tab's `sessionStorage` under `baos-r13*`. All of it is removed, and my frames are removed.
- **My tab.** tab-186's viewport is reset to desktop, and the tab is closed.
