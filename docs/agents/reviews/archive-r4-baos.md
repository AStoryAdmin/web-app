# Archive, memory page and Home's prints, round 4 (Bao's Standard)

**FAIL**

Scope: `/archive` in both the Prints and List views, `/archive/:id` including the not-found page, and Home's prints and "From the book".

How I checked: I used my own tab in the Claude pane, with the founder signed in. I loaded each size fresh: 1366×768, 1920×1000, 2560×1300 (html zoom 1.3) and 390×844. At each one I stepped GSAP and ScrollTrigger, then measured with getBoundingClientRect, scrollHeight against clientHeight, computed styles and text ranges. I read the tidied text of 342e4b40, c21cf4d4, f6a734be, 459228bd, f9b0e6e9 ("Ending the chat"), 0ced62a7 and 59632e67, and the word-for-word text of 59632e67. I pressed only "Read it word for word" / "Read it tidied" (and put it back) and the Prints/List switch. I touched no writing control.

## Round 3 defects, checked

| # | Round 3 defect | Now |
|---|---|---|
| 1 | Tidied reading unreadable | **Better, still not client-ready.** Sentences now end with full stops, and "Wait, were you?" is gone. False starts, repeats and garbled clauses remain. See 1. |
| 2 | "Anything else" as a chapter | **Fixed.** No chip row. The hero says "1 Chapter". |
| 3 | Kept line and titles clipped on prints | **Fixed at 1366, 1920 and 2560.** **Still clipped at 390.** See 5. |
| 4 | Kept line small, highlighter band | **Fixed.** 25px at 1366, 26px at 1920 and 2560 (body 22 and 23), 21px on the phone. No clamp. The marker is a low stroke from 74% to 90%. |
| 5 | No takeaway on phone, no coda on desktop | **Fixed** where a kept line exists. At 390 it sits at y=310, and the coda shows at every size. But four of eight memories have no kept line at all. See 2. |
| 6 | Kept lines are plain facts | **Fixed where one is chosen.** 342e: "It's been challenging, but I think it's why we have the opportunity to get it." 4592: "And that's always been the dream because I love teaching." Home quotes the 4592 line. |
| 7 | Teller line contradicts itself | **Fixed.** "Told by Bao in conversation" on c21c, 0ced, 5963, 342e, 4592, f6a7 and f9b0, on the List cards and on Home. "Written by Bao" only on the typed Childhood memory. |
| 8 | Long paragraphs unsplit | **Partly.** c21c is 506 + 145 chars (9 lines + 3 at 1366) and f6a7 is 522 + 123 (9 + 2). Both are still lopsided, and one split cuts a sentence's thought in half. See 7. |
| 9 | A reaction lifted as "We asked" | **Fixed for 342e.** A new attribution fault on 5963. See 4. |
| 10 | Phone tools misaligned, dangling middot | **Tools fixed.** One row at 390: "Photograph" at x=10 with its icon at x=20, "Add words", then "•••", all 44px. **Middot now starts line 2.** See 11. |
| 11 | Straight apostrophes in titles | **Fixed for titles.** Interface copy is still straight. See 10. |
| 12 | Small prints and a ragged row at large sizes | **Fixed.** 4 columns at 1920 (375px) and at 2560 (488px under zoom), two even rows of four. |

## Is the tidied reading good enough to show a client?

**No.** The local cleaner now punctuates, which is a clear step up from round 3. But it cannot repair speech, and a client reading 342e or 5963 will think the product mangled their words. From the tidied view:

- 342e opens on the drop cap with "My dad so I started my career as a middle school teacher. So I taught teenagers which is a five and then my mom did that my dad was an entrepreneur."
- 342e also has: "he's just very connected I did not grow up in Michigan I'm from Wisconsin"; "I was working a corporate job, the eSports job. I was working a corporate job. So not today, but so I was working…"; "So we did like a, we built…"; "And so I got to like, and so they ended up…"; "That's how we got, that's how we built the company."
- c21c: "my dad was trying to. My grandfather was a police officer… Everyone's good. But he was trying to. He was a really good fan."
- 5963: "My dad wanted the tax. It's a job. Thank you, dad. So you have to think so."; "that was a free gift from I won a pitch competition".
- 4592 opens on "I specifically PhD of finance."
- f9b0 is four words: "How to end chay."

Short, single-speaker typed memories read well. f6a7 and 0ced are passable. Any long call does not. The local cleaner has reached its limit. Showing calls to a client needs the server tidy pass (once the CORS block on `/api/memory/help` is lifted), stored beside the raw text. Until then, the honest option for a demo is to lead with the typed memories and the two passable calls.

"Ending the chat" (f9b0) is a stray test call: four words with the mis-heard "chay". It is the first memory in the book order and a full print on the Archive. That is content, not the builder's defect. The founder may want to remove it before any client sees the Archive (I did not touch remove).

## Defects, worst first

1. **The tidied reading of long calls is still not readable enough to show (see the verdict above).**
   - Where: `cleanTranscript`, `splitRunOn` in `src/components/archive/transcript.ts`; the `/api/memory/help` tidy pass.
   - Sizes: all.
   - Evidence: the quotes above.
   - Rule: 17a; reading-2026 §3.5.
   - Fix: once CORS allows the web origin, run the server "tidy" (punctuation, sentence case, filler, false starts and repeats, no rephrasing) once per memory, store it, and show it. Locally, at least drop an exact repeated clause ("I was working a corporate job." twice) and clause restarts of the form "X, X…" ("That's how we got, that's how we built").

2. **Four of eight memories have no takeaway on their page, and the cards fill the gap with three different line pickers that disagree.**
   - Where: `keptLine` (page, with `needFeeling`), `cardLine` (prints) and the List `MemoryCard` excerpt, in `transcript.ts`, `MemoryPage.tsx`, `PrintCard` and `MemoryCard`.
   - Sizes: all.
   - Evidence:
     - c21c, f6a7, 0ced and 5963 pages: `.mv-kept` and `.mv-coda` are absent.
     - The c21c print still shows "My grandfather was a police officer and he was a good man." in the kept-line style.
     - List view excerpts: 5963 "I mean, that was awesome."; 0ced "I mean FaceTime helps or whatever."; 4592 "I love to become a professor one day." (its page and Home say "And that's always been the dream because I love teaching."); f6a7 "…and I get…", cut by code and clamped 104/52 at 2560.
   - Rule: 32 (one kept line, used as the card's excerpt and repeated as the coda); 1.
   - Fix: compute one kept line per memory and use it on the page, the print, the List card and Home. When no sentence carries a feeling, fall back to the best whole sentence that does not start with filler ("I mean", "So"), and show it on the page too. Never use an excerpt the page doesn't show.

3. **The drop cap on a one-letter first word reads as one word: "Ispecifically".**
   - Where: 459228bd; `.mv-words p.drop::first-letter` (`initial-letter: 3`, 2 on the phone).
   - Sizes: all. Seen at 1366 and 390.
   - Evidence: the HTML is "I specifically…", but the space collapses against the initial letter. The page's `innerText` is "Ispecifically PhD of finance." and the screenshot shows the same.
   - Rule: 17a, 14.
   - Fix: when the first word is one letter ("I", "A"), drop-cap the whole word with a following gap, or skip the drop cap, as is already done for "And" and "No".

4. **After a lifted question, the asker's own next words are given to the teller.**
   - Where: 59632e67; `liftQuestions` in `transcript.ts`.
   - Sizes: all.
   - Evidence:
     - Word for word: "Do they open to non-students as well? Because our strategy right now is we're going to find a student in schools around this area to partner with them… For sure."
     - Tidied: "We asked Do they open to non-students as well?" and then, as the teller's paragraph, "Because our strategy right now is we're going to find a student…". That is the asker's plan, set as Bao's words.
   - Rule: 29 (nobody writes as somebody else); reading-2026 §3.5.
   - Fix: when the sentence after a lifted question opens on "Because/Our/We're going to" and comes before any answer marker ("Yeah", "For sure", "Definitely"), keep it with the question or drop it, and start the teller's paragraph at the answer.

5. **Text is still clipped on the phone and in the List view.**
   - Where: `.print-card.typed .said` (`-webkit-line-clamp: 3`); `.mv-turn` titles (clamp 2); the List `.excerpt` (clamp 2).
   - Sizes:
     - 390: the 342e print's kept line is 88/66, so it reads "…why we have the opportunity…". The Previous title on 342e is 62/42: "preserving a grandfather's…".
     - 2560 (List): the f6a7 excerpt is 104/52.
   - Rule: checklist (no clipped text); 32.
   - Fix: at ≤599px let the typed print grow, or step `.said` down to fit four lines. Let page-turn titles take three lines on the phone. In the List view use the shared kept line from defect 2, which is short enough never to clamp.

6. **On the wide memory page the running head says "What the family remembers" while you are reading the memory.**
   - Where: `SECTIONS` in `src/lib/atmosphere.ts` includes `.fv-head h2`, which sits at the top of the sticky right margin.
   - Sizes: 1366, 1920 and 2560 (any memory with the three-column layout, such as 342e and f9b0).
   - Evidence: at scrollY 0 at 1920 the right running head reads "WHAT THE FAMILY REMEMBERS". It reads "ARCHIVE" only on first paint.
   - Rule: 28 (a running head that knows where you are).
   - Fix: ignore the family head when it is in the side column (only count it when it is in the flow, as on the phone and on photo layouts), so the running head keeps the page's own name.

7. **Paragraph splits are lopsided and one breaks a thought.**
   - Where: `readableParagraphs` in `src/components/archive/photos.ts`.
   - Sizes: all. Measured at 1366.
   - Evidence:
     - c21c is 506 + 145 chars (9 + 3 lines) and f6a7 is 522 + 123 (9 + 2). 342e has a 95-char one-sentence paragraph ("And then our engineers from El Salvador…") between two of 404 and 466.
     - c21c breaks "you're not only are you caring for them." | "But then you're also not going to do this work…" across a paragraph.
   - Rule: 17a; reading-2026 §3.4.
   - Fix: balance the split (two halves of about 330 rather than 506 + 145). Never start a paragraph on "But then"/"And then" when it answers the previous sentence. Merge paragraphs under about 120 chars into a neighbour.

8. **"Give eight memories a year ·about 2 minutes": the space after the middot is lost.**
   - Where: `.arc-task` in `src/styles/pages/archive-reading.css` line 415 (`display: inline-flex; gap: 0`).
   - Sizes: all four.
   - Evidence: the text node " · " is 8px wide at 1920. The flex container collapses its trailing space, so the dot touches "about" (x 1588 to 1596).
   - Rule: 16 (small print quiet and correct); 14.
   - Fix: wrap the sentence in one inline span inside the flex item, or give `.arc-task-t` `margin-left: .3em` (and the same on Home's equivalent if it shares the class).

9. **The not-found memory page: Bond floats with a flat cut under his chest, and the page is set in the left third of the sheet.**
   - Where: `Missing()` in `src/pages/MemoryPage.tsx` lines 101–117; `.mv-missing-dog` in `archive-reading.css` line 560.
   - Sizes: all. Seen at 1366 and 390.
   - Evidence:
     - `curious-paper.webp` is the art "cut flat under the chest" (docs/mascot/BOND.md) so that it sits on a ledge. Here the cut hangs in the air about 20px above the headline, so he reads as a cropped picture.
     - At 1366 the dog, headline, line and button fill only x 114–660 of a 1250px sheet, with nothing on the right.
     - The headline "That memory isn't here." has a straight apostrophe and an ink full stop.
   - Rules: 21, 42, 33, 14, 8.
   - Fix: set Bond on a foil hairline (the ledge) or over the top edge of a small paper card holding the message, centre the group on the sheet at desktop sizes, curl the apostrophes and give the full stop the foil.

10. **Interface copy keeps straight apostrophes around the curled titles (rule 1 on round 3's item 11).**
    - Where:
      - `Archive.tsx` 214, 243, 244 and 482 ("Write today's memory", shown in Where to next).
      - `MemoryPage.tsx` 108, 109, 276, 309 and 438.
      - `Home.tsx` 44 and 113.
      - `AudioPlayer.tsx` 182, `FamilyVoices.tsx` 143 and 158, `ReadAloud.tsx` 139.
      - Elsewhere: `Person.tsx` 123, `Placeholder.tsx` 24, `Contribute.tsx` 58, `Shell.tsx` 121 and 125.
    - Sizes: all.
    - Rule: 14, 1.
    - Fix: curl them in the source (’), or pass static copy through `smarten`.

11. **On the phone the tidy note's middot starts its second line.**
    - Where: `.mv-tidy`.
    - Size: 390.
    - Evidence: the note is 62px tall in two lines: "Lightly tidied from the conversation" then "· Read it word for word".
    - Rule: 16.
    - Fix: hide the middot at ≤599px and let the link sit on its own line.

12. **When the kept line is in the last paragraph, the reader meets it three times in a short span.**
    - Where: 342e; `withMark` and `.mv-coda` in `MemoryPage.tsx`.
    - Sizes: all.
    - Evidence: at 1366 the marked sentence in the last paragraph and the coda carrying the same sentence are about 80px apart, after the same line under the title.
    - Rule: 19 (don't repeat the same thing twice on one page), weighed against 32.
    - Fix: when the kept sentence falls in the final paragraph, leave the in-body marker off (the coda is the repeat), or skip the coda.

13. **Small layout loose ends.**
    - List view at 2560: 8 cards in 3 columns leave a 3-3-2 ragged last row (rule 10). Use 4 columns at ≥1600, as the Prints view now does.
    - f9b0 at 1366: the Next title wraps to leave "Vietnam" alone on its line (rule 10). Add `text-wrap: balance` on `.mv-turn` titles.
    - The bar's brand link is 89×28 at 1366 and 115×36 at 2560, under the 44px target (checklist). This is site-wide.

## Not verified

- Home at 390×844 was not measured this round. The round 3 clamp fix on Home's prints is unconfirmed at phone width.
- After a programmatic scroll, the Archive's second row of prints stayed at opacity 0 for at least 800ms, even after 400 GSAP ticks. It showed within 4s. This is probably the pane's throttled frames, not a defect, but I did not prove it in Edge.
- Once mid-run a Vite overlay appeared from a parse error in `src/components/delight/Companion.tsx` (a duplicate `shown`), from a concurrent edit. It cleared on reload. It is outside this scope.
- The Archive view preference changed from Prints to List between my loads (another session). I pressed Prints once at 2560 to measure, then set it back to List as I last found it.
- Not exercised: reduced motion, hover, active and focus-visible appearance, the lightbox, View Transitions between memories, a live Edge resize, a zoomed-out window, and Bond on the other pages that use `curious-paper` (OpenLeaf, Family, Wall, Placeholder).
- Screenshots at 1920 and 2560 are scaled by the pane. Findings there are measured.
