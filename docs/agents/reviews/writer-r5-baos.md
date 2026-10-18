# Writer, round 5: Bao's Standard

**FAIL.** 4 findings, ranked worst first. All 8 round-4 items hold, and Bond now passes. He sleeps with his paws over the board, and once writing starts he hides his eyes from behind the book, cut exactly at the board line. One fault is left that matters, and it is new to this report, not a regression: on a long page the left page becomes a tall sheet of blank paper. Its only line, "A few lines is plenty.", sits alone at the foot, even beside a 293-word memory. The other three findings are small.

I checked in my own browser-pane tab at 1366×768, 1366×641, 1920×1000, 2560×1300 (html zoom 1.3), 390×844, 375×812 and 320×700. Pages: `/write`, `/write?q=faith-pray-now`, focus mode, `/write?edit=59632e67-1bf2-4bc9-b03a-1f9d6f1f628a` (step 1, editing), and Afterwards via `/write?edit=59632e67…&details=1` at 1366 and 390. I reloaded after every resize, so OneDrive and Vite could not serve a stale build. The served `writer.css` matched the file on disk (it has the `clip-path: inset(0 0 13px 0)` rule). I stepped GSAP by hand and measured with getBoundingClientRect, computed styles and scrollWidth. I read writer.css in full, the Dog, tools and context parts of Write.tsx, BOND.md and the alpha of every `-paper` file.

## Round-4 items, re-checked

| Round-4 item | Now |
|---|---|
| 1. Bond's arms end in a flat cut drawn over the board | **Fixed.** `cover-paper.webp` is re-cut to 738×630. Its last rows fade out (alpha 232 at row 566 down to 14 at row 626, with the last 4 rows clear). `.w-dog .awake` has `clip-path: inset(0 0 13px 0)`, 10px on a phone. Measured at 1366: the dog's bottom is 179.0, the clip is 13, so the drawing stops at 166.0, which is the board's top (`.w-book` top 166.0). At 390: the dog's bottom is 345.28 and the book's top 335.28, with a clip of 10. Nothing of him is drawn on the board, so his arms read as going behind the book. Verdict below. |
| 2. "Or something else" put its arrow on a line of its own | **Fixed.** `.w-q.own` is `flex-direction: row`. The text is one line (268×17), and the link is 44px tall at 1366 (62 device px, which is 48 CSS px, at 2560). The arrow sits on the line. |
| 3. The left page ran its sections together | **Fixed.** At 1366×768 the sub ends at 379 and "Or one of today’s questions" starts at 407, a 28px gap. At 1366×641 the heading ends at 315 and the kicker starts at 339, a 24px gap. Each kicker is still 6px above its own list, so the two levels now read apart. |
| 4. Ribbon a 12–16px red stub | **Fixed at 1366×768.** The ribbon is 26px (642–668). It shows a 14px notched tail below the book (654) and ends 2px above the bar (670). At 641 it is still only a 6px fork (finding 3). |
| 5. A 520ms crossfade makes two dogs | **Fixed going in.** Sleep fades out over 120ms. Cover fades in over 200ms from `scale(0.96)`, with a 60ms delay. The way back still overlaps (finding 2). |
| 6. Three grey help buttons with no word of why | **Fixed.** In the bar layout (1366×768 and ×641), an empty page shows "Speak instead" and the line "Write a line and these can help." in place of the three greyed buttons. Each disabled tool has `title="Write a line first"`. In the rail at 1920 and 2560 the line shows under the list. Once there are words, all four tools show (1366: 524–1208, 48px tall). |
| 7. At 375 and 320 the two starters sat alone on a row each | **Fixed** as suggested: under 380px only "It was the year…" shows (375: x44 y519, 320: x44 y515). Both show on one row at 390. |
| 8. Copy and housekeeping | **Fixed:** the editing page reads "Or one of today’s questions". **Fixed:** the dog `<img>` tags say 781×622 and 738×630, matching the files, and `.w-dog` is `aspect-ratio: 781 / 640`. The same sizes are in OpenLeaf, LedgeNote, Mosaic, Book, Family, Person, Placeholder and Wall. **Not done:** `sleep-paper.webp` is still byte-identical to `sleep.webp` (md5 ebefe564…), see finding 4. |
| Elsewhere: the flat-cut awake pose on OpenLeaf | Fixed in code (`.ol-dog .awake` has the same clip), but OpenLeaf is no longer imported anywhere, see finding 4. LedgeNote stands the dog on a foil hairline where his art fades out, which is right for a loose dog. |

## Bond on the writer: the verdict

**He passes, on placement and craft.** The painterly style is the founder's ruling, so I judged only placement and craft.

- **Asleep, on the board edge.** The box is 96 CSS px wide on a laptop (84 at 641, 104 on a phone, 125 device px at 2560). His chin and crossed paws hang 13px over the board's top edge (10px on a phone), and his paws end 5px above the page's gilt edge. The closed eyes, the black nose and the paws are all clear at true size. The fur has no light halo on the #F3EBDD sheet. He never covers a word or the Focus button: at 1366 the dog ends at y179, and the Focus button starts at y200.
- **Covering his eyes, clipped at the board line.** At true size (my 4× composites from the real files and the measured boxes, and the builder's own pictures), he reads as a dog standing behind the book with both paws over his eyes. His nose and the top of his mouth show above the board. His arms simply go behind it: there is no straight edge on the cloth, and no fade or halo at the cut. At 1366×641, where he is 84px wide but the cut is still 13px, the line passes just under the nose. That is still right: nose whole, arms behind the book.
- **The change.** Typing one line on `/write` sets `data-awake`. The cover image has `opacity: 1` and no transform, with the clip in place. Clearing the line takes `data-awake` away again.
- **Placement in the page.** He sits at the right of the board, 56px in from the corner, which is the quiet end of the spread. On a phone he is 30–38% of the book's width, as in round 4: prominent, but charming, and only above the book.
- Evidence: `shots/writer-r5-baos-1366-cover-4x.png`, `writer-r5-baos-641-cover-4x.png` and `writer-r5-baos-1366-sleep-4x.png` (my composites), and the builder's `writer-r5-1366-bond-*.png` and `writer-r5-390-bond-*.png`. My composites agree with the builder's pictures.

## Findings

1. **On a long page, the left page becomes a full screen of blank paper with one pencilled line at its foot, and that line is wrong for the page.** The two pages share one grid row, so the left page grows with the words. Its content ends at y542, while `.leaf-left .w-pencil { margin-top: auto }` pushes "A few lines is plenty." to the bottom, at y1526. On the editing page at 1366×768, that is 984px of empty paper: scroll one screen down and the whole left half is blank, except that lone line at its corner. The line is also wrong there: it tells the person a few lines is plenty while they edit a 293-word memory. The same happens on `/write` and `/write?q=…` once someone writes past one screen, at every spread size (1280 and up, rail included; from the CSS, since the row stretches the same way).
   - Where: `writer.css` `.leaf-left` (a column flex with the pencil at `margin-top: auto`), `.spread .w-pages` (the grid row), and `Write.tsx` `pencil` (the fixed copy).
   - Sizes: 1366×768, 1366×641, 1920, 2560, wherever the right page passes one screen. On a phone there is no left page.
   - Evidence: `shots/writer-r5-baos-1366-edit-blank-verso.jpg` (scrolled to 800). `.leaf-left` 120,184,492×1389; `.w-qs ul` ends at 542; `.w-pencil` 425,1526.
   - Rules: 10 (no orphans: a single line alone on an empty plane), 9 and the craft rules ("a screen that is mostly empty ground is an underbuilt section"), 20 (honest copy), 28 (an atmosphere that invites writing).
   - Fix: make the left page's content travel with the writing (wrap the head, list and note in a block with `position: sticky; top: calc(var(--top-h) + 24px)` inside `.leaf-left`), move the note up under the list, and on an editing page or after about five lines change "A few lines is plenty." to a line that fits (or drop it).

2. **Going back to sleep is still a double exposure.** When `data-awake` goes, the base rules run both fades at once: the sleeping dog comes back over 120ms while the covering dog leaves over 200ms, with no delay on either. For about 120ms both drawings show over each other. This happens when someone clears the page or stops dictation on an empty page.
   - Where: `writer.css` `.w-dog .sleep` and `.w-dog .awake` (the base, un-awake transitions).
   - Sizes: all (motion). Read from the CSS; the hidden pane draws no frames, so I could not see it play.
   - Rules: 23, and the motion section of the craft rules.
   - Fix: give the way back the same order as the way in. In the base state, set `transition-delay: 60ms` on `.w-dog .sleep` and keep `.awake` at 0, so the cover leaves first and the sleep returns after it.

3. **At 1366×641 the ribbon is still a 6px fork.** It is 18px long (527–545). The book ends at 539 and the bar starts at 547, so below the book you see only the two points of the 10px notch. At 1366×768 the 14px tail reads as a tail. At 641 it reads as a red nick in the board's edge.
   - Where: `writer.css`, the `(max-height: 740px)` block: `.spread:not(.rail) .w-ribbon { height: 18px }` and `.spread .w-keep { margin-top: 8px }`.
   - Size: 1366×641 (any laptop window under 740px tall).
   - Rule: 15a (each decoration earned and placed with care).
   - Fix: in the short step, either hide the ribbon (`display: none`) or give the bar a 14px margin and the ribbon 24px, so at least a 12px tail shows with its notch.

4. **Housekeeping.**
   - `public/dog/sleep-paper.webp` is still byte-identical to `sleep.webp` (md5 `ebefe5643b75afe515985c1dac276fae`). There is no halo, so nothing shows, but the asset list says a "-paper" variant exists that doesn't. Rename it, or note in BOND.md that sleep needs no paper variant (rule 21).
   - `src/components/delight/OpenLeaf.tsx` is no longer imported by any page, but its CSS (astory.css 3474–3519) still ships. If it comes back, `.open-leaf[data-awake] .ol-dog { transform: translateY(-3px) }` lifts the clipped dog 3px off the page edge, so the cut would float 3px above the leaf with sheet showing under it. Delete the component and its CSS, or remove the lift.

## Fresh pass: what holds

- **No horizontal scroll** at any of the seven sizes. scrollWidth 1351 at 1366 (the scrollbar), 1905 at 1920, 2545 at 2560, and exactly 390, 375 and 320 on phones. At 320 and 375 nothing in `.w-desk` runs past the right edge.
- **First screen.** At 1366×768 the spread (166–654) and the bar (670–760) are in view. At 1366×641, once the layout settles, the book is 150–539 and the bar 547–636, with the seal at 556–616 and "Speak instead" at 568–616. At 1920 and 2560 the rail holds the help and the seal beside the book, with "Where to next" at 852 (1920).
- **Small print and targets.** No text under 12px on step 1 or Afterwards. No link, button or field under 44px on step 1 (1366), and the question links are 44px (49 at 1920).
- **Afterwards** (1366 and 390): "Kept in the Vo book." in the hero. Choices beside the kept page at 1366, choices first on a phone. The When rows are 4/4/2 with the date field beside 2020s, and there is no horizontal scroll. "Who was there" wraps 3/1 at 390. It reads as a list of names, as in round 4's note, so it is not a finding.
- **Focus mode** at 1366: only the page, at the measure. The dog and the left page are hidden. Escape leaves it, and the `writing-focus` class is cleared.
- **The editing page** creates no draft. "Or one of today’s questions" is right. The bar follows only once something changes (`!empty && changed`), which is right, since there is nothing new to keep before that.

## Not verified

- Bond's fades playing in real time: the pane is hidden, so it draws frames only for screenshots. The timings come from the CSS.
- Reduced motion: read in the code (`transition: none` on `.w-dog img` and `.w-dog .awake`). The pane cannot emulate it.
- Keep, the seal, the stamp, and the help buttons (Tidy, Suggest a title, What am I not saying?, Speak): not pressed, by instruction.
- Hover and focus-visible: read in writer.css, not seen.
- The blank left page at 1920 and 2560 while editing: from the CSS (the same grid row and `margin-top: auto`). I saw it at 1366.
- The founder's real Edge zoom: I used html zoom 1.3 at 2560, the app's own lib/zoom. I did not run 3840 headless, because the signed-in pages cannot be opened headless without touching auth.

## Housekeeping

- On `/write` (own words) I typed "We had a dog." at 1366×768, saw Bond cover his eyes, then cleared it with Ctrl+A and Delete. The page removed its own draft (`astory-draft-f6a9b0de-…83e3`), and the folio read "Nothing written yet".
- The draft for beeedb62 was 370 characters before and after. I did not open its writer or its Afterwards this round.
- Opening `/write?edit=59632e67…` and its Afterwards wrote nothing.
- I pressed Focus and Escape. Nothing else that acts.
- I did not sign out or touch auth.
- I reset my tab's viewport to desktop and closed it (tab-77).
- New pictures: `shots/writer-r5-baos-1366-cover-4x.png`, `writer-r5-baos-641-cover-4x.png`, `writer-r5-baos-1366-sleep-4x.png`, `writer-r5-baos-1366-edit-blank-verso.jpg`.
