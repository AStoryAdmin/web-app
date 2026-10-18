# Writer, round 6: Bao's Standard

**FAIL, on two small findings.** All four round-5 findings are fixed. The big one is fixed well. On a long page the question, today's other questions and the note now travel down the left page with the writing. They stop at the page's foot, and the note sits under the list where it belongs. On the editing page the note is gone. Bond still passes. What is left is two alignment details on the left page. Each one is a one-line fix.

I checked in my own browser-pane tab (tab-87) at 1366×768, 1366×641, 1920×1000, 2560×1300 (the app's own zoom, 1.3), 768×1024, 390×844, 375×812 and 320×700. I reloaded after every resize. The served `writer.css` matched the file on disk (it has the `.leaf-left-in` rule and the "better none than a nick" ribbon rule). I stepped GSAP by hand and measured with getBoundingClientRect, computed styles and scrollWidth.

Pages:
- `/write`, empty, and with a typed test page of 167 words (11 lines) to make it long. I cleared it afterwards.
- `/write?q=faith-pray-now`.
- `/write?edit=59632e67-1bf2-4bc9-b03a-1f9d6f1f628a` (293 words), scrolled from the top to the foot at 1366×768, 1366×641 and 1920×1000.
- Afterwards, via `…&details=1`, at 1366×768 and 390×844.

I read writer.css in full, the left-page, note and Dog parts of Write.tsx, and BOND.md.

## Round-5 items, re-checked

| Round-5 item | Now |
|---|---|
| 1. On a long page the left page became a screen of blank paper with "A few lines is plenty." alone at its foot | **Fixed.** The head, the ornament, the list and the note are wrapped in `.leaf-left-in` with `position: sticky; top: calc(var(--top-h) + 16px)`. The note lost its `margin-top: auto`. The figures below are from the editing page at 1366×768. The block is 303px tall. It starts at 238 and sticks at y80 (16px under the 64px bar) from a scroll of 200 to 1150. At 1260 it parks at the page's foot: the block ends at 353 and the leaf at 373, inside its padding. The running head stays at the top of the page, as a running head should. On the editing page there is no note at all (`note = editing ? ""`). On a new page the note follows how far the page has come. At 167 words it read "Take all the time you need." and sat 18px under the list (list ends 572, note 590 on `?q=`). See verdict below. |
| 2. Going back to sleep was a double exposure | **Fixed.** Leaving: `.awake` fades over 100ms with no delay, and `.sleep` returns over 120ms after a 100ms delay. Computed: `opacity 0.1s` and `opacity 0.12s … 0.1s`. The cover is gone before the sleeping dog comes back. Going in is unchanged: sleep out over 120ms, cover in over 200ms from scale 0.96 after 60ms. |
| 3. At 1366×641 the ribbon was a 6px fork | **Fixed** by taking it away. In the `max-height: 740px` block `.spread:not(.rail) .w-ribbon` is `display: none` (computed `none`). At 1366×768 it is still the 26px ribbon with a notched tail (646–672 on `?q=`), ending 2px above the bar (674). |
| 4. Housekeeping | **Fixed.** `src/components/delight/OpenLeaf.tsx` is deleted, and no `.open-leaf` or `.ol-` rule is left in any stylesheet. `sleep-paper.webp` is still byte-identical to `sleep.webp` (md5 ebefe564…). BOND.md now says so on purpose ("Sleep tapers to its paws on its own"), which is what I asked for. |

## The left page now travelling with the writing: the verdict

**It works, and it reads as a book.** Scroll a long page and the left page keeps its question, its list and its note at the top of the window, on the paper, beside the words being written. The empty paper is now below the list, the natural rest at the foot of a page. It is no longer a screen with one line in its corner.
- At the end of the page the block parks at the foot and leaves with the book. It never runs past the leaf or over the board.
- The block never meets the bar that follows the scroll. At 1366×768, with words on the page, it is 80–455 and the bar starts at 667. At 1366×641 it is 80–379 and the bar starts at 541.
- At 1920 and 2560 it travels beside the rail (1920: block 80–532, rail 104–506).
- Evidence: `shots/writer-r6-baos-1366-edit-scrolled.jpg` (editing, scrolled to 800), `writer-r6-baos-1366-write-long-scrolled.jpg` (`/write` with 167 words, scrolled to 500), `writer-r6-baos-1920-edit-scrolled.jpg`.

## Bond: still passes

Nothing about him changed except the way back to sleep (item 2), which is now cleaner.
- **Asleep** at 1366, on `?q=`, he sits on the board's top edge at the right. The box is 96px, 1068–1164 by 100–179, and the board's top is 166.
- **Awake** on `/write` with words, he covers his eyes, cut at the board line. `clip-path: inset(0 0 13px 0)`, so the drawing stops at 166, the board's top. I zoomed the pane at true size: paws over his eyes, nose showing, arms going behind the book, no hard edge on the cloth.
- At 641 he is 84px, and at 390 and below 104px, with `bottom: calc(100% - 10px)` and a 10px clip.
- He never covers a word or the Focus button. At 1366 the dog ends at 179 and Focus starts at 200.
- On a tablet he no longer touches the subtitle: the question head ends at 256 and the dog starts at 276.
- Clearing the page took `data-awake` away again.

## Findings

1. **On a large window the left page's block and the rail's block stick at different heights.** Once you scroll, the question block sticks at `--top-h + 16px` and the rail at `--top-h + 40px`. So "Editing" / "In your own words" floats about 18px above "If you'd like a hand", across the same screen.
   - Where: `writer.css` `.leaf-left > .leaf-left-in { top: calc(var(--top-h) + 16px) }` against `.w-grid.rail .w-side { top: calc(var(--top-h) + 40px) }`.
   - Sizes: 1920×1000 and 2560×1300 (every rail layout), whenever the page is scrolled.
   - Evidence: editing page at 1920, scroll 500. The left kicker's top is at 90 and the rail heading's top at 108. At 2560 they are at 117 and 140 device px. See `shots/writer-r6-baos-1920-edit-scrolled.jpg`.
   - Rule: 10 (columns align and tops line up), and the checklist's "aligned columns".
   - Fix: give both the same sticky top, so the first line of each sits on one line. The simplest is `top: calc(var(--top-h) + 40px)` on `.leaf-left-in` inside `.rail`, which still clears the bar at 1366×641.

2. **On a laptop the left page's running head sits on top of the kicker, as close as the kicker sits to the question.** "THE VO BOOK · MEMORY NO. 9" in grey small caps, then "TODAY'S QUESTION" in terracotta small caps, read as one two-line label. Page furniture should stand apart from the page's text, as it does on the right page.
   - Where: `writer.css`. The `(max-height: 900px)` block sets `.spread .leaf-left .w-qhead { margin-top: 0 }`, so only the leaf's 10px flex gap (6px under 740px) separates the head from `.leaf-left-in`.
   - Sizes: 1366×768, where the running head ends at 228, the kicker starts at 238 (10px) and the kicker-to-question gap is also 10px. 1366×641, where the head ends at 208 and the kicker starts at 214 (6px). At 1920×1000 (over 900px tall) the gap is 20px, which is right.
   - Evidence: `shots/writer-r6-baos-1366-question.jpg`. On the right page the running head ends at 231 and the title line starts at 249.
   - Rules: the craft rules ("the gap between sections is clearly larger than any gap inside one"), 14 (set like the printed book).
   - Fix: give `.leaf-left-in` a top margin in the short-window blocks, about 12px at ≤900px tall and 8px at ≤740px. That gives an 18–22px step, which the 1366×768 first screen has room for (the bar ends at 764).

## Fresh pass: what holds

- **No horizontal scroll** at any of the eight sizes. scrollWidth is 1351 at 1366 (the scrollbar), 1905 at 1920, 2545 at 2560, 753 at 768, and exactly 390, 375 and 320 on phones. No element in `.w-desk` crosses the edge at 768, 390, 375 or 320.
- **First screen.** At 1366×768 on `?q=`, the book is 166–658 and the bar 674–764. At 1366×641 the book is 158–546 and the bar 550–640, with no ribbon. At 1920 and 2560 the rail holds the help and the seal beside the book.
- **Small print and targets.** No visible text under 12px on step 1 at 768, 390, 375 and 320, on `?q=` at 1366, or on Afterwards at 1366 and 390. No control under 44px tall. The photo's remove button draws at 25px, but its `::before` makes it 45px to press.
- **The phone and tablet bar** follows once there are words (`position: sticky`, 685–763 at 390×844 above the tab bar). "Not now" is 44px tall.
- **Afterwards** (1366 and 390) is unchanged from round 5: "Kept in the Vo book.", the choices beside the kept page at 1366 and first on a phone, no overflow.
- **Tablet (768×1024).** One page under the question, with the questions and the help side by side under it, then "Where to next".

## Not verified

- Bond's fades and the sticky block playing in real time. The pane draws frames only for screenshots, so the timings come from the computed CSS. The sticky positions are measured at each scroll.
- Reduced motion: read in the CSS (`transition: none` on both dog images), not emulated.
- Keep, the seal, the stamp and the help buttons (Speak, Tidy, Suggest a title, What am I not saying?): not pressed, by instruction. So I did not see a pencilled question from the help in the travelling block. Its `max-width: 24em` should keep it to two or three lines.
- Hover and focus-visible: read in writer.css, not seen.
- The founder's Edge at 3840: not run headless, because these signed-in pages cannot be opened headless without touching auth. I used 2560×1300 with the app's 1.3 zoom.

## Housekeeping

- On `/write` (own words) I typed a test page of 167 words at 1366×641. With it in place I measured at 1366×768, 1920, 2560, 768, 390, 375 and 320. At 320 I cleared it with Ctrl+A and Delete. The page removed its own draft: the only `astory-draft-*` key left is the beeedb62 one, and the folio read "Nothing written yet".
- The draft for beeedb62 was 370 characters before and after. I did not open its writer or its Afterwards.
- Opening the editing page and its Afterwards wrote nothing. I typed nothing there.
- I did not press Keep, the seal or any help button. I did not sign out or touch `astory-app-auth`.
- I reset my tab's viewport to desktop and closed it (tab-87).
- New pictures: `shots/writer-r6-baos-1366-edit-scrolled.jpg`, `writer-r6-baos-1366-write-long-scrolled.jpg`, `writer-r6-baos-1920-edit-scrolled.jpg`, `writer-r6-baos-1366-question.jpg`.
