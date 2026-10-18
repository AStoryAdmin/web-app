# Writer, round 7: Bao's Standard

**FAIL, on three findings.** Both round-6 findings are fixed, and so are all three Skills gaps (G1, G2 and G3). The writer itself is very close to passing. What stops it:
- One regression, caused by the round-6 fix. The left page grew by 4px, which pushed the seal bar off the foot of the first screen at 1366×641. At 1366×768 the bar now sits on the window's bottom edge.
- A site-wide navigation hole that shows on the writer at 768×1024.
- One touch target half a pixel short.

Bond still passes.

I checked in my own browser-pane tab (tab-94) at 1366×768, 1366×641, 1920×1000, 2560×1300 (the app's own zoom, 1.3), 768×1024, 390×844, 375×812 and 320×700. I reloaded after every resize. Before measuring I stepped GSAP by hand (`__gsap.ticker.tick()` ×400). I measured with getBoundingClientRect, computed styles and scrollWidth. I read writer.css in full (515 lines, mtime 00:36), the §46 block of astory.css (00:34), and the `writing` condition in Write.tsx.

Pages:
- `/write?q=faith-pray-now`.
- `/write`, empty, and with a typed test page of 168 words. I cleared it afterwards.
- `/write?edit=59632e67-1bf2-4bc9-b03a-1f9d6f1f628a` (293 words). I swept it from the top to the foot at 1366×768, 1366×641, 1920×1000 and 2560×1300.
- Afterwards, via `…&details=1`, at 1366×768, 1920×1000 and 390×844.

## Round-6 items, re-checked

| Item | Now |
|---|---|
| Baos 1. On a large window, the left page's block and the rail's block stick at different heights | **Fixed.** `writer.css:57`: `.w-grid.rail .leaf-left > .leaf-left-in { top: calc(var(--top-h) + 40px) }`. On the editing page, both boxes pin at the same y. At 1920, scrolled to 500, both are at 104, with "Editing" at 114 and "If you'd like a hand" at 108. At 2560 both are at 135.2 (kicker 148, rail heading 140). The two text lines now differ only by their own leading. See `shots/writer-r7-baos-1920-edit-scrolled.jpg`. |
| Baos 2. The left running head sits on top of the kicker on a laptop | **Fixed.** `writer.css:179` and `:187` add a top margin to `.leaf-left-in`. At 1366×768 the running head ends at 228, the kicker starts at 250 (22px), and the kicker sits 8px above the question. At 1366×641 the gaps are 12px and 8px. At 1920 they are 20px and 10px. The head now reads as page furniture. On the right page the same step is 214→249. |
| Skills G1. The folio's descenders cross the foil frame under 740px | **Fixed.** `writer.css:169`: `padding-bottom: 16px` on both pages. At 1366×641 the folio's box ends at 510.3 and the frame line is at 514.3. The left page's last row also ends at 510.3. |
| Skills G2. The left page and the margin pin at different heights | **Fixed.** This is the same line as Baos 1. |
| Skills G3. §46.7 still styles the old writer | **Fixed.** No `.leaf-ribbon` or `.keeprow` rule is left in any stylesheet, and no TSX renders either. §46 keeps only the turned-down corner (`astory.css:3429–3431`). Its header comment now sends the reader to writer.css for the salutation, the ribbon and the folio. |

## Findings

1. **Between 761 and 900px wide, every signed-in page has no main navigation.** The pill nav is hidden at ≤900px and the tab bar only appears at ≤760px, so on a tablet the writer shows only the logo, the storyteller picker, Add and the account button. You can't reach Home, Archive, Family or Book except through "Where to next" at the bottom of the page.
   - Where: `astory.css:538` (`@media (max-width: 900px) { .pillnav { display: none } }`) against `astory.css:553` and `:3690` (the `.tabbar` exists only inside `@media (max-width: 760px)`). This is the Shell, outside the writer's files.
   - Sizes: every width from 761 to 900px. Measured at 768×1024 on `/write?q=` and on `/archive`, where `nav.pillnav` and `nav.tabbar` both compute to `display: none`.
   - Rules: rule 1 (it is on every page), rule 24 (the navigation follows you), and the checklist (designed states at every size).
   - Fix: raise the tab bar's breakpoint to 900px, so it and its sheet clearance run wherever the pill nav is hidden. Alternatively, hide the pill nav only at ≤760px and let it shrink between 761 and 900.

2. **The seal bar no longer fits the first screen on a short laptop, and on a 768px screen it touches the window's foot.** The round-6 margin above `.leaf-left-in` made the left page, and so the book, 4px taller. The bar under the book moved down by the same amount.
   - Measured on `/write?q=`, before any words. At **1366×641** the book is 158–550.3 and the bar is 554.3–643.8, so its lower 2.8px, the bottom border and both rounded corners, are cut off by the window. On `/write` the cut is 4.5px (556–645.5). In round 6 it was 550–640. At **1366×768** the bar is 678–766.3 on `?q=` and 678.1–767.6 on `/write`, so 0.4–1.7px from the edge, against 764 in round 6. On the screen it reads as cut.
   - Evidence: `shots/writer-r7-baos-1366x641-question.jpg` (no bottom edge on the bar) and `shots/writer-r7-baos-1366x768-question.jpg`.
   - Two of the short-window block's own savings never apply. In the `max-height: 740px` block, `.w-desk .spread .leaf-left .w-qkick { margin-bottom: 6px }` and `.sheet-page .page.w-desk .spread .leaf-left .w-kick { margin-bottom: 2px }` lose to the `max-height: 900px` block. That block is either more specific (`.sheet-page .w-desk …`) or equally specific and later in the file. At 641 they compute to 8px and 4px.
   - Rules: the checklist (no clipped elements; the main content in the first screen), rule 11 in spirit (one screen when it should be one), and rule 12 (the ratio holds).
   - Fix: take about 8–10px back out of the left page. Set `.spread .leaf-left .w-qs` to `margin-top: 8px` in both short blocks, and give the ≤740px block's `.w-qkick` and `.w-kick` rules the `.sheet-page .page.w-desk` prefix so their 6px and 2px win. That brings the bar to about 634 of 641 and 761 of 768, 6–8px clear, without touching the running-head step.

3. **"Not now" is 43.5px tall, half a pixel under the 44px floor.**
   - Where: `writer.css:250`. `.w-keep-note a` is `padding: 12px 2px` on a 13px × 1.5 line (19.5px), which adds up to 43.5.
   - Sizes: every size. Measured at 768×1024, 390×844 and 1366×768. On a phone it is the only way out of the writer apart from the tab bar.
   - Rule: the checklist (a touch target of at least 44px).
   - Fix: add `min-height: 44px` (with `box-sizing: border-box`), or use `padding: 12.25px 2px`.

## Bond: still passes

- **Asleep:** at 1366 his box is 1068–1164 by 100–179, on the board's top edge (166). At 641 he is 84px (102–171, board at 158). At 1920 he is 100–179, board at 166. At 2560 he is 130–233.
- **Awake:** on `/write` with 168 words, `data-awake` is set. The cover pose computes to `opacity: 1` and `clip-path: inset(0 0 13px)`, and the sleeping pose to `opacity: 0`. I zoomed the pane at true size: his paws are over his eyes, his nose shows, and the drawing stops at the board line.
- **Timings:** going in, the cover takes 200ms after a 60ms delay. Leaving, the cover takes 100ms with no delay, then sleep returns over 120ms after 100ms. There is no double exposure.
- **Clearance:** he never covers a word or the Focus button. On a tablet the subtitle ends at 256 and the dog starts at 276. At 390 it is 223 and 234; at 375, 247 and 258; at 320, 243 and 254.
- **Clearing the page** took `data-awake` away again.

## Fresh pass: what holds

- **No horizontal scroll** at any of the eight sizes. scrollWidth is 1351 at 1366 (the scrollbar), 1905 at 1920, 2545 at 2560, 753 at 768, and exactly 390, 375 and 320 on phones. No element in `.w-desk` crosses the edge at 768, 390, 375 or 320, on step 1 or on Afterwards.
- **The travelling left page.**
  - At 1366×768 on the editing page, it pins at 80–376 from a scroll of 300 to 1050, 16px under the bar. It parks at the leaf's foot by 1200, with the block ending at 353 and the leaf at 373.
  - At 641 it pins at 80–376 and parks the same way.
  - With 168 typed words at 1366×768, the block (80–447) never meets the following bar (667–756). The note "Take all the time you need." sits 18px under the list.
  - Evidence: `shots/writer-r7-baos-1366-write-long-scrolled.jpg`.
- **The bar follows once there are words.** It is 667–756 at 1366×768, 685–763 at 390×844, 653–731 at 375×812 and 541–619 at 320×700. On a phone it sits above the tab bar.
- **Large windows.** At 1920 the book is 166–733, the rail 166–599 and "Where to next" 853–964, all in the first screen. At 2560 the book and the rail span 250–2278, so the screen is used.
- **Small print.** No visible text under 12px on any page at any size.
- **Targets.** No control under 44px except "Not now" (finding 3). The photo's remove button on Afterwards draws at 25px, but its `::before` makes it 45px to press.
- **Phones.**
  - The headline sets at 28.9px (390), 27.8px (375) and 26px (320), with the title at 19px at 320.
  - Two ways to begin at 390. At 375 and below the line holds only "Start anywhere".
  - The question stays the largest line.
- **Afterwards.**
  - At 1366: "Kept in the Vo book." on the cloth. The kept page (281–732) sits beside the choices (281–1102).
  - At 1920: the choices are three columns of 334px, and the whole step fits one screen (881–992 is "Where to next").
  - At 390: the choices come first (224–1454), then the kept page, then "Where to next". No overflow.

## Not verified

- **Real-time motion.** The pane draws frames only for screenshots, so Bond's fades and the sticky block are taken from the computed CSS. The sticky positions are measured at each scroll step.
- **Reduced motion.** Read in the CSS (`writer.css:505–508` and the global rule), not emulated.
- **Pressed controls.** I did not press Keep, the seal, the stamp or any help button (Speak, Tidy, Suggest a title, What am I not saying?), by instruction. So the failed-Keep state and a pencilled help question in the travelling block were not seen this round.
- **Hover and focus-visible.** Read in writer.css (each control has both), not seen.
- **Edge at 3840.** Not run, because these signed-in pages cannot be opened headless without touching auth. I used 2560×1300 at the app's 1.3 zoom.
- **The editing page's bar at 1366.** It stays under the 1,600px book until something changes, because `writing` needs `changed` (`Write.tsx:1100`). So on arrival "Keep the changes" and the help are at the page's foot. I take this as deliberate (there is nothing to keep yet) and do not list it as a defect.

## Housekeeping

- **The test page.** On `/write` (own words) at 1366×768 I typed a test page of 168 words and measured it there, then at 390, 375 and 320. At 320 I cleared it with Ctrl+A and Delete. The page removed its own draft: the only `astory-draft-*` key left is the beeedb62 one, and the folio read "0 words · Nothing written yet".
- **The beeedb62 draft** was 370 characters before and after. I did not open its writer or its Afterwards.
- **The editing page** and its Afterwards: opening them wrote nothing, and I typed nothing there.
- **Other actions.** I did not press Keep, the seal or any help button. I did not sign out or touch `astory-app-auth`.
- **My tab.** I reset its viewport to desktop and closed it (tab-94).
- **New pictures:**
  - `shots/writer-r7-baos-1366x641-question.jpg`
  - `shots/writer-r7-baos-1366x768-question.jpg`
  - `shots/writer-r7-baos-1920-edit-scrolled.jpg`
  - `shots/writer-r7-baos-1366-write-long-scrolled.jpg`
