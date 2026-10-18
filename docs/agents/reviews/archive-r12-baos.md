# Archive, memory page and Home's prints, round 12 (Bao's Standard)

**FAIL**

The live memories pass:
- every cut on every live memory is on the final list and meets its rule's exact condition;
- the words outside the cuts are exactly the shown words;
- the kept lines drop only what the list allows.

All eight round-11 defects are fixed, and so are all eight round-11 skills gaps. The 320 Share row holds in every state.

Seven faults remain:
- **Three cuts are on the list's letter but change what was meant.** No live memory triggers them. 17a itself names two of them in its "never" sentence:
  - the quoting "like";
  - a hedge before an amount.
- **A quoted "Wow." is cut as the listener's reaction.**
- **Three layout faults at 320**, found by this round's first full pass at that width:
  - a typed print's words are clamped;
  - the memory page's running head is cut off;
  - Home's day buttons are 40px wide.

Scope:
- `/archive` in Prints and List;
- `/archive/:id` for all eight memories in Bao's story, plus a missing id;
- Home's prints and "From the book".

Nhi's memory was not opened.

## How I checked

- **Reading.** I read these fresh:
  - `docs/BAOS-STANDARD.md`, with 17a's final closed list;
  - DESIGN.md's craft rules;
  - `archive-r11-baos.md` and `archive-r11-skills.md`;
  - commit 606f1d3: `transcript.ts` in full, the new `breaksRule`, `keepCorpus` and the forbidden-cut list in `transcript.test.ts`, and the `MemoryPage.tsx` and `archive-reading.css` diff.

  The working tree is clean at 606f1d3.
- **Tests.** `vitest run src/components/archive src/lib` passes: 9 files, 366 tests. `tsc --noEmit` exits 0.
- **The basis.** I judged the tidy against the list only:
  - (a) the filler sounds, the opening word, and a "Yeah," or "So yeah," that does not follow a question;
  - (b) ", like,";
  - (c) I, the, and or that's said twice;
  - (e) the fixed set of reactions;
  - "We asked" in the named shape or the exact-reply shape;
  - the kept line's So, And or But before a comma, a pronoun or "the".

  A cut outside the list is a defect. So is a cut on its letter that changes what was meant. A filler or stutter the list keeps is the accepted trade.
- **Strings.** I ran a copy of `transcript.ts` under Node 24.18. I read every cut with `cleanSpeech(text, { explain: true })`, `explainTranscript`, `cleanTranscript`, `ownWords` and `takeaway`, on:
  - all 45 strings from both round-11 reports;
  - about 70 new strings written to find a cut outside the list or a change of meaning.
- **The live words.** In my own tab (tab-174), I loaded the account read-only with the app's own `loadAccount`. For each memory I ran the words through the same path as `MemoryPage`: `paragraphsOf`, then `wasSpoken`/`soundsSpoken`, then `explainTranscript`. Then I checked three things:
  - each recorded cut against its rule's exact condition;
  - the words outside the cuts against the shown words;
  - the rendered `.mv-para` text against `cleanTranscript`, word by word, at all six sizes.

  The server tidy is off, so the page shows the local tidy.
- **The full pass.** I covered Home, the Archive in List and Prints, the eight memories and the missing id, at all six sizes:
  - 1366×768, 1920×1000 and 800×1024;
  - 2560×1300, with html zoom 1.3;
  - 390×844 and 320×700, both at dpr 2.

  Each page got a fresh load in a same-origin frame at exactly that size. On each I:
  - dispatched a resize event;
  - stepped GSAP and ScrollTrigger;
  - scrolled to the end and back three times with pauses;
  - finished CSS animations and waited 1.2s;
  - set lazy images to eager.
- **What I measured,** with getBoundingClientRect and computed styles:
  - horizontal scroll, and anything past the right edge outside a clipping parent;
  - text under 12px (size × zoom);
  - clipped or ellipsised text, and text under half opacity;
  - broken and upscaled images;
  - targets under 44px (absolute `::before` and `::after` hit areas counted);
  - grid columns;
  - title lines (line tops through a Range), size and foil stop;
  - the kept line under the title, the gold marks and the coda;
  - "Memory n of 8", Previous and Next, and "Where to next";
  - the state row's lines and edges;
  - each card's words against `takeaway`;
  - the not-found page's height.

  Findings at 320 were confirmed again in the tab itself, with two screenshots.

## Round 11, checked

**Bao's Standard, round 11 (archive-r11-baos.md): all eight fixed.** Every string in that report now comes out whole, except "We were, uh, poor.", which (a) allows.

| # | Round-11 defect | Now |
|---|---|---|
| 1 | The kept line dropped a non-joint "But"/"So" ("But for my mother…") | **Fixed.** `OUT_OF_CONTEXT` drops So, And or But only before a comma, a pronoun or "the". All four strings keep their first word. |
| 2 | A restart cut took an earlier clause | **Fixed.** (d) is gone, and all three strings stand. |
| 3 | "We asked" set when the reply only started with "Yes"/"For sure" | **Fixed.** `TELLER_ANSWERS` must match the whole reply. All three strings stay in the teller's words. |
| 4 | The verb "like" after but/and | **Fixed.** Only ", like," goes. Both strings stand. |
| 5 | A quoted ", yeah" answer removed | **Fixed.** The closing "yeah" is no longer on the list. Both strings stand. |
| 6 | A comparing "like so many" | **Fixed.** All four strings stand. |
| 7 | A capital "A" read as an article; "My, my" | **Fixed.** Articles and "my" are not on (c). All five strings stand. |
| 8 | Share's fallback label ran 67px off at 320 | **Fixed.** See the Share row below. |

The smaller items are fixed too: "eight mm" stands, and (c) no longer acts after ";" or ":". The three items for the lead are no longer cut either:
- "Really?" is gone from (e);
- "you, you" is not on (c);
- "So it goes," has no comma after "So".

**The skills review, round 11 (archive-r11-skills.md): all eight gaps closed.**

| # | Gap | Now |
|---|---|---|
| 1 | The checker accepted forbidden cuts | **Closed.** (c) needs a word boundary, and (e) needs the whole sentence and a "Yeah." straight after a reaction. The forbidden-cut test holds all 18 named mutants. `keepCorpus` holds "the theater", "an anthem", the mid-sentence "yeah," and "That's great news", and every corpus line now runs with `opening` both true and false. |
| 2 | A "Yes, …" reply completed the shape | **Closed.** Both strings stand, and a first-person-question fixture exists (test line 756). |
| 3 | Capital "A" followed by "a" | **Closed.** |
| 4 | The 320 Share status ran off the screen | **Closed.** Measured below. |
| 5 | A "Yeah," after a tag question | **Closed.** `isQuestion` counts tags, so "It was good, right? Yeah, it was." stands. |
| 6 | The teller's own named "Wow." | **Closed.** `named` skips (e). |
| 7 | "Plan A:" read as a label | **Closed.** A text counts as labelled only when it opens on a label. |
| 8 | A typed takeaway lost ", like," | **Closed.** |

## Every live memory against its exact words

Every cut below meets its rule's exact condition. On every piece, the words outside the cuts equal the shown words (zero unrecorded removals). The rendered body equals `cleanTranscript` at all six sizes.

- **342e4b40:**
  - "Wait, were you?" (e), and the "Yeah." straight after it (e).
  - Nothing else goes. "So we did like a, we built…" and "So that's, that's kind of why" now stay whole. The second is right: its first "that's" follows "So", not a comma or a sentence start.
- **59632e67:**
  - "Yeah, " opening "gaming and mental health…" (a). The sentence before is "So we did all these cool things.", which is not a question.
  - "Yeah, right?" and "Wow, that's amazing." (e).
  - ", but yeah" now stays.
  - Its one "We asked" line is "Do they open to non-students as well? Because our strategy right now is…", answered by exactly "For sure.". That is the exact-reply shape.
- **f6a734be:**
  - The opening "Yeah, " (a): it is the teller's first word, and a comma follows.
  - "Yeah, " before "it was different though." and "So yeah, " before "if you heard of…" (a). Neither follows a question.
  - "That's awesome." (e).
- **0ced62a7, c21cf4d4, 459228bd:** nothing is cut.
- **beeedb62:** typed, so it is not tidied. Its lines keep their breaks.
- **f9b0e6e9:** nothing is cut. The labels "You:" and "AI:" go. The AI's reply is set as "We asked", which is accepted.

**The kept lines.** Each one is a sentence of the shown words, less at most one joint word the list allows:
- 459228bd: "So the best way…" becomes "The best way to learn finance is to build a business." The joint is before "the".
- 59632e67: "So you always…" becomes "You always have to just look for every opportunity." The joint is before a pronoun.
- f6a734be: "So I want…" becomes "I want to help growing ventures because I get to work with startups." The joint is before a pronoun.
- 342e4b40: "…networking constantly so I thought…" is split by sense at "so". The line is "I thought we were gonna raise money like right out of the gate.", with the joint before a pronoun. Home's "From the book" quotes it.
- c21cf4d4: "My grandfather was a police officer and he was a good man." Verbatim.
- 0ced62a7: the "When I heard that idea…" line. Verbatim.
- beeedb62: "We live in a small city · It's in Vietnam".
- f9b0e6e9: "How to end chay.", the teller's own words.

Every List card's words equal `takeaway` for all eight memories.

## Defects, worst first

Defects 1, 2, 3 and 6 are proven on strings under Node, importing `transcript.ts` directly. No live memory triggers them. Defects 4, 5 and 7 are measured live at 320.

1. **(b) removes a quoting "like", and the sentence loses who said what.**
   - **Where:** `COMMA_LIKE` and `likeCuts` in `src/components/archive/transcript.ts`.
   - **Sizes:** all. The words show on the page, on the cards and in Home's quote.
   - **Evidence** (`cleanSpeech`, explain: `b-like ", like,"`):
     - "She was, like, you can't marry him." → "She was you can't marry him."
     - "And my dad was, like, no way, you stay here." → "And my dad was no way, you stay here."
     - "My mom was, like, “You are not going.”" → "My mom was “You are not going.”"
   - **Rule:** 17a, "never the quoting or feeling 'like'", and "Tidying a spoken memory never changes what was meant". The cut is on (b)'s letter.
   - **Fix:**
     - Keep ", like," when it follows a form of be or go (was, were, is, 's, went, goes) and a quote mark or a new clause follows it.
     - Add the three strings to `keepCorpus`.
     - Add the matching check to `breaksRule`'s (b).

2. **(b) removes a hedging "like" before an amount, so an estimate becomes a fact.**
   - **Where:** `COMMA_LIKE` in `transcript.ts`.
   - **Sizes:** all.
   - **Evidence:**
     - "We paid, like, two hundred dollars for the boat." → "We paid two hundred dollars for the boat."
     - "There were, like, twenty of us in one room." → "There were twenty of us in one room."
     - "We stayed there for, like, three years." → "We stayed there for three years."
     - "It cost, like, $50 back then." → "It cost $50 back then."
   - **Rule:**
     - 17a, "never a hedge before an amount";
     - "never changes what was meant";
     - rule 20 in spirit: the family's book should not state a number the teller only guessed.
   - **Fix:**
     - Keep ", like," when a number follows. That means a digit, a currency sign, a number word (one to twelve, the tens, hundred, thousand, million, dozen), or "a few", "a couple", "half" or "a hundred".
     - Add the four strings.
     - Add the check to `breaksRule`.

3. **A filler set off by two commas takes both commas, so the items of a list run together. Two names become one.**
   - **Where:** `FILLER_SOUND` (`(,\s*)?…(,)?`) with `applyCuts`, in `transcript.ts`. `COMMA_LIKE` does the same with ", like,".
   - **Sizes:** all.
   - **Evidence:**
     - "My brothers were Tuan, um, Minh and Long." → "My brothers were Tuan Minh and Long." Three brothers now read as two, one of them called "Tuan Minh".
     - "We moved to Hue, uh, Saigon and then Houston." → "We moved to Hue Saigon and then Houston."
     - "We had rice, uh, fish and beans." → "We had rice fish and beans."
     - "It was 1975, um, April." → "It was 1975 April."
   - **Rule:** 17a, "never changes what was meant". (a) allows "a comma that sets one off" to go; the first comma here separates two items, it does not set off the filler. This is likely in this family's stories, which are full of Vietnamese names and places.
   - **Fix:**
     - When the cut runs from one comma to the next, leave one comma if the word after the filler starts with a capital or a digit, or if a list goes on ("and" or "or" within the next three words).
     - "We were, uh, poor." still becomes "We were poor.".
     - Add the four strings.

4. **At 320, a typed print in the Archive's Prints view cuts its words off with an ellipsis.**
   - **Where:** `archive-reading.css`:580, inside `@media (max-width: 760.98px)`: `.arc-prints .print-card.typed:has(.cap .kicker, .cap .dateline.dated) .typed-in .said { -webkit-line-clamp: 2; }`. This is the beeedb62 print, which has the "Childhood" kicker.
   - **Size:** 320×700. At 390 the two lines fit.
   - **Evidence:**
     - `.said` is 63px of text in a 42px box (15px type, 21px lines, 135px column).
     - It shows "We live in a small city · It's…". See the screenshot `tool-results/mcp-Claude_Browser-blob-1792320492107-ysn8qx.jpg`.
   - **Rule:**
     - the checklist: no clipped text;
     - DESIGN.md, the memory card: "the person's own words … whole and never clamped";
     - rule 32: the takeaway is the card's words.
   - **Fix:**
     - Below 360px, let the typed print's words take the lines they need: drop the clamp, or set it to 4 and let the frame grow.
     - Or fit the size to the box by measurement, as the titles already do.
     - Check Home's typed print with a dated line under the same rule.

5. **At 320, every memory page's running head cuts off the book's name, and it cuts off the section name in the family section.**
   - **Where:** `astory.css`:2784 (`.running-head-sheet span { … text-overflow: ellipsis }`) with :3356–3358.
     - `.rh-right` is a one-cell grid holding both `.rh-page` and `.rh-sec`.
     - The hidden `.rh-sec` ("What the family remembers", at opacity 0) still sizes the cell, at 183px of the 280px row.
   - **Size:** 320×700. Nothing is clipped at 390 and up.
   - **Evidence** (f9b0e6e9, scrolling from the top to the end in 150px steps):
     - At every step, the left span shows "THE VO B…" (101px of text in 81px). See `tool-results/mcp-Claude_Browser-blob-1792320426702-5mdpqh.png`.
     - From 750px on, in the family section, the right span shows "WHAT THE FAMILY REMEM…" (231px in 183px).
     - At the top, the right side reads "ARCHIVE" with an empty gap of about 100px beside it, yet the book's name is still cut.
     - On the other memories, the same happens once the family section has set `.rh-sec`.
   - **Rule:**
     - the checklist: no clipped text;
     - rule 28, "a running head that knows where you are";
     - rule 1, the same span on every sheet page.
   - **Fix:**
     - Size `.rh-right` to the label that shows (for example `.rh-sec` `position: absolute; right: 0` while it is hidden), so the book's name keeps its room.
     - Below 360px, use a short section name ("The family"), or drop the book's name while a section shows.

6. **(e) cuts a quoted "Wow." that is someone in the story speaking, not the listener reacting.**
   - **Where:** `tidyParagraph` in `transcript.ts`. `bare` strips the quote marks before `REACTION` is tested, and `breaksRule`'s (e) does the same.
   - **Sizes:** all.
   - **Evidence:** "Mom opened the letter. “Wow.” That was all she said." → "Mom opened the letter. That was all she said." Now "That was all she said" points at nothing.
   - **Rule:**
     - (e) names "the other person's reactions"; quote marks show it is a person in the story speaking;
     - "never changes what was meant".
   - **Fix:**
     - Test `REACTION` on the sentence as written, so a sentence inside quote marks never matches.
     - Make `breaksRule` the same.
     - Add the string.

7. **At 320, Home's week ribbon days are 40px wide, under the 44px target.**
   - **Where:** `astory.css`:3579, `.ribbon-day { flex-basis: calc((100vw / var(--zoom, 1) - 40px) / 7); }`. The 280px track divides into 40px buttons, edge to edge, with no wider hit area.
   - **Size:** 320×700 (all 83 days). At 390 they are 50px.
   - **Evidence:** `BUTTON.ribbon-day`, 40×81 at a 40px pitch, with no `::before` or `::after` hit area.
   - **Rule:** the checklist (every target at least 44px); DESIGN.md rule 6. This is outside Home's prints, but it is on Home at a size this round checks, so it is listed under rule 1.
   - **Fix:** below 360px, show six days to the track (46px), or give each day a 44px-wide absolute `::before`. The track already scrolls.

## For the lead (not counted)

These cuts follow the list's letter and can change meaning, but the list chose them. I would not change them without a ruling.

- **The "We asked" shape cannot tell who goes on.** "Why did Dad stay? Because our family was here. Yes. He loved the city." sets "Why did Dad stay? Because our family was here." as "We asked". The teller's own answer leaves their words.
- **(a) turns a sarcastic "Yeah, right." into agreement.** "He said he would pay us back. Yeah, right. We never saw a cent." → "…Right. We never saw a cent." A test fixture accepts the opening case.
- **(e) cannot tell the teller's own "That's amazing." or "Wow." from the listener's.**
  - "She walked again after a year. That's amazing." → "She walked again after a year."
  - "Mom opened the letter. Wow. That was all she said." → "Mom opened the letter. That was all she said." (unquoted)

## What holds

- **Overflow and type.** On every page in scope, at all six sizes and in both Archive views:
  - `scrollWidth` equals `clientWidth`, and nothing sits past the right edge outside a clipping parent;
  - no text is under 12px;
  - no image failed, and none is upscaled at dpr 1, 1.5 or 2;
  - nothing is clipped apart from defects 4 and 5;
  - no text is left under half opacity after the settle. The only exception is the hidden `.rh-sec` label, which by design crossfades with the page name.
- **Targets.** None is under 44px apart from defect 7.
  - The Archive's search input is 33px tall (43px at 2560), inside a 44px (57px) `label.input`.
  - At 320 the field is 56px wide, with the placeholder shortened to "Search".
- **Titles.** Every title has the foil stop (`rgb(201, 161, 90)`).
  - They take two lines or fewer at every size: "Ending the chat." takes one line, the rest take two. On 59632e67 at 390 and 320, Range line tops confirm two lines; the seal makes the box 2.17 line-heights tall.
  - Sizes: 44px at 1366 and 800; 50px with a plate and 36px without one at 1920; 65px and 46.8px at 2560; 28 to 32px at 390; 23 to 32px at 320.
- **Memory pages.**
  - Every memory has "Memory n of 8", named Previous and Next (none at the ends), and "Where to next".
  - The kept line is set under the title with one gold mark on 0ced62a7, c21cf4d4, 342e4b40, 459228bd, f6a734be and 59632e67.
  - A coda appears only on 342e4b40.
  - beeedb62 has two marks, one per first line. f9b0e6e9 is set once, as its words.
- **The 320 Share row.** I measured all eight memories at 320×700, setting the label in the DOM only. Share was never pressed.

  | State | Lines | Row | Share button | Text ends | Page width |
  |---|---|---|---|---|---|
  | At rest: "Share" | 1 | 12–302 | 92×44 | 281 | 320 |
  | "Copied", with `data-result="ok"` | 1 | 12–302 | 92×44, unchanged | 291 | 320 |
  | "Copy the address bar", with `data-result="fail"` | 2 | 12–292 | 189×44, on its own line at 12–201 | 193 | 320 |
  | "Saving…" on the privacy tool, with `aria-busy` | 2 | 12–292 | 92×44, moves to the second line | n/a | 320 |
  | Restored | 1 | 12–302 | 92×44 | 281 | 320 |

  - 59632e67 ("Treasured") ends 4px earlier, at 298.
  - The first icon sits on the title's edge at x=20.
  - The live region is a separate `sr-only` `role="status"`, and the button's name stays "Share this memory".
- **Prints.** Home's prints and Archive Prints have the same columns at 1920 and 2560 (2560 is under zoom 1.3).

  | Size | Archive Prints | Home |
  |---|---|---|
  | 1366 | 4 columns, 266px | 3 columns, 244px |
  | 1920 | 4 columns, 375px | 3 columns, 346px |
  | 2560 | 4 columns, 375px | 3 columns, 346px |
  | 800 | 3 columns, 232px | 3 columns, 234px |
  | 390 | 2 columns, 170px | 2 columns, 170px |
  | 320 | 2 columns, 135px | 2 columns, 135px |

  No `.said` overflows except defect 4.
- **List.**

  | Size | Columns |
  |---|---|
  | 1366 | 2, 535px |
  | 1920 | 2, 754px |
  | 2560 | 2, 754px |
  | 800 | 1, 697px |
  | 390 | 1, 328px |
  | 320 | 1, 258px |
- **Home.** "From the book" quotes 342e4b40's kept line, with its title and "Told by Bao in conversation", at every size.
- **Not-found page.** It shows Bond (`curious-paper.webp`), "That memory isn't here.", one line of cause and remedy, and "Back to the archive". It fills exactly one window at all six sizes.

## Not verified

- **String-only defects.** Defects 1, 2, 3 and 6 are proven on strings under Node only. No live memory triggers them.
- **Share and Saving.** The Share and Saving states were simulated by setting the label text and the `data-result`/`aria-busy` attributes in my tab. The CheckIcon was not rendered: the link icon stood in, at the same 17px. I did not press Share or change privacy.
- **Not exercised:**
  - hover, active and focus-visible states;
  - reduced motion and View Transitions;
  - the lightbox and the density listener;
  - the server tidy, which is off.
- **The pane was hidden,** so pages were settled by stepping GSAP and ScrollTrigger and by waiting. The size passes ran in a same-origin frame at the exact size, with the top document's zoom held at 1. I checked the frame's numbers against the tab directly at 1366 (59632e67) and at 320 (f9b0e6e9, the Archive and Home).

## Shared state

- **Archive view.** The stored view (`astory.archiveView`) was "list" when I started. For each Prints check I pressed Prints and then List with the page's own buttons, and it reads "list" now.
- **Sign-in.** `astory-app-auth` is present and untouched. I did not sign out and wrote no data.
- **My helpers.** My helper code lived in my tab's `sessionStorage` under `baos-*-r12`. All of it is removed.
- **My tab.** tab-174's viewport is reset to desktop, and the tab is closed.
