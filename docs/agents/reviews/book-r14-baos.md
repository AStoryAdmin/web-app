# Book, Plans, Account, Talk, Start and the Wall, round 14: Bao's Standard

**PASS.**

7fd905f fixes both of my round-13 findings and the Skills Steward's N42 and N43. The Montserrat 700 preload is fetched first and used. A fresh full sweep found no defect at 320, 390, 800, 1366, 1920 or 2560. The sweep covered:
- Book, Plans, Account, Talk and both Start pages;
- the wall and its not-shared page;
- cold loads of Home, Archive, a person, a memory page and /write.

## How I checked

- **Read first:** the 7fd905f diff (index.html, Person.tsx and book-account.css), my round-13 report, and N42–N43 in `book-r13-skills.md`.
- **Signed-in pages, in my own pane tab (tab-212):** cold loads in same-origin iframes at the test size, with Chromium's classic 15px scrollbars.
  - A 4ms poll stepped GSAP and recorded:
    - the first skeleton sample and the arrived values (cloth height / sheet top);
    - dips in the sheet's opacity;
    - every change of `clientWidth`;
    - console errors and warnings, excluding the known `family_reader_stories` 404.
  - **The sweep**, after a scroll-through and every animation finished, checked:
    - `body.scrollWidth` against the window, and text running past it;
    - text under 12px outside the book;
    - faded text in view;
    - straight quotes;
    - controls under 44px, allowing for a `::before`/`::after` hit area;
    - the Where to next rows;
    - `html`'s background.
  - Start has no Shell sheet, so I waited for `.start` without `.start-skel` before sweeping it. My first pass swept it too early: the dev server takes 4.6–7.5s to mount the page in a fresh frame.
- **Signed-out pages:** headless Chromium from `../09142026/node_modules/playwright` with real scrollbars (`--hide-scrollbars` off), in fresh signed-out contexts.
  - Covered: the wall, the bad slug, `/nope`, the door and the five ritual pages, at 1366, 1920 and 390.
  - The wall sweep, the bad slug and the wait state were also run at all six sizes. I saved right-edge shots.

## Round 13's findings and N42–N43, re-checked

| # | Round 13 | Now |
|---|---|---|
| 1 / N42 | The memories task's arrow on a person page ran off the window at 320 and 340 | **Fixed.** The task is now a block, and "about 2 minutes →" moves down whole. <br>• 320: `body.scrollWidth` 305/305; the task spans 24…285 on two lines, 63px tall; the arrow ends at 151. <br>• 340: 325/325. <br>• 360: 345/345. <br>• 390: one line, 44px tall, arrow at 345 of 375. <br>The hero holds 192.6/165 → 192.6/165 at every width. |
| 2 | Three sample-family people moved at 320 | **Fixed.** The skeleton now builds each sample person's own title and subline, the same way the arrived hero does. At 320, first sample → arrived, all exact with 0 dips: <br>• Rose and Nora 251.2; <br>• Walter, Frank, Tom and Maya 309.8; <br>• Edith 274.5; <br>• Peggy and Daniel 286.6. |
| N43 | A cream track beside the chocolate cloth on the all-cloth pages | **Fixed.** On the not-shared wall and `/nope`, `html` computes `background: rgb(74, 51, 39)` and `scrollbar-color: <35% on-chocolate> rgb(74, 51, 39)` at 1366, 1920 and 390. With real scrollbars, the track is the cloth's own brown, with a faint thumb and arrows (`shots/book-r14-wall-none-track-1366.png`). <br>Start also takes the cloth canvas, at every size. <br>The long wall keeps the cream canvas and the soft ink thumb, because its paper runs to the foot (`shots/book-r14-wall-track-foot-1366.png`). |
| The Montserrat 700 preload | **Works.** `/fonts/montserrat-7.woff2` is the latin 700 face in `montserrat.css`. On Home, Plans and Start it is fetched by the `link` at about 7–9ms, at the same time as the stylesheet. There is one request for it, not two, and `document.fonts` reports the face loaded. The cloth titles on Home and Plans set in Montserrat 700. No preload warning appeared in the console. |
| The locked signed-out pages (round 12, rechecked) | Still clean with real scrollbars. The door at 1366 and 1920 and the ritual pages measure `overflow-y: hidden` and `clientWidth` equal to the window. At 390 they scroll as before. |

## The fresh sweep: 320, 390, 800, 1366, 1920 and 2560

**Book, Plans, Account and Talk:**
- At all six sizes, the cloth and sheet top held exactly from the first skeleton sample to arrival, with 0 dips.
- `clientWidth` never changed during a load.
- `body.scrollWidth` equals the window.
- No text runs past the edge.
- No text under 12px outside the book.
- No faded text, no straight quotes, and no control under 44px.
- Three Where to next rows on each page.

**Start, `?another=1` and `&join=1`:**
- `body.scrollWidth` equals the window, and `html` is the cloth.
- Step 1 and the join page are one screen at 800, 1366, 1920 and 2560.
- At 390 the join page fits 844, and step 1 scrolls to 1194. At 320, the join page is 728 and step 1 is 1405.
- The only faded text is the designed "Dear family," specimen (0.5).

**Cold loads, first skeleton sample → arrived (cloth / sheet top):** all held exactly, with 0 dips, a constant `clientWidth` and no console errors.

| Page | 320 | 390 | 800 | 1366 | 1920 | 2560 |
|---|---|---|---|---|---|---|
| Home | 662.6/635 | 593.1/565 | 484.1/456 | 355/327 | 363.8/336 | 472.2/335 |
| Archive | 416.4/388 | 416.4/388 | 384.1/356 | 384.1/356 | 384.1/356 | 499.3/356 |
| Person (5aa5) | 192.6/165 | 192.6/165 | 232.6/205 | 256.3/228 | 257.6/230 | 334.8/230 |
| Memory page | 96/68 | 96/68 | 104/76 | 104/76 | 104/76 | 135.2/76 |
| /write | 96/68 | 96/68 | 104/76 | 104/76 | 104/76 | 135.2/76 |

**The wall (headless, fresh and signed out):**
- The function answered 200, and the fallback RPC was never called.
- No auth keys are in storage.
- No horizontal scroll at any of the six sizes.
- Photographs 4/4 loaded, except 3/4 at 320 at the moment of the sweep (a lazy print, as at 375 in rounds 11 and 12).
- Leaf titles are 1–3 lines.
- The mark sits 21.6px clear (27.2 at 2560). On a phone, the foot keeps its known 101.6px.
- The bad slug shows "This story isn’t shared." in exactly one screen at six sizes.
- The wait state's cloth holds 302 → 301.7 (1366), 406 → 406.3 (390) and 302 → 302 (1920).
- The one-word last lines the detector flagged are all inside clamped excerpts.

## Notes (not findings)

- **The memory page at 320:** the "•••" more button ends at 305.7 against a 305px window, 0.7px over at a sub-pixel. `overflow-x: clip` holds it, and nothing visible is cut. This is for the Archive builder, if they want it exact.
- **The 700 preload on pages that don't use it:** the sign-in ritual pages also fetch the 700 face. They set no Montserrat 700, so the face stays unloaded. It is one small cached file and no warning appeared, but the preload could be limited to the signed-in shell.
- **Lead rulings that stand:**
  - Home's greeting is three lines at 320, with held and arrived equal.
  - A real person with a long dated subline wraps to two lines on a phone (the one-line skeleton ruling).
  - One-screen signed-in pages carry the kept track.
- **Round 9–11 notes still stand:**
  - Talk's phone words column is 8px off (351 against 342.9);
  - the wall's phone foot.

## Not verified

- **Real Edge:** the scrollbar evidence is from headless Chromium with its scrollbars drawn and from the pane's iframes, not a real Edge window. Pane screenshots still time out, so signed-in evidence is measured, not seen.
- **Hover, focus-visible, active and reduced-motion states**, and a zoomed-out Edge window, weren't exercised this round.
- **The free-plan and private-wall cold loads end to end:** these were checked as markup variants in rounds 11 and 12, and their code is unchanged.

## Housekeeping

- **The pane:** I worked only in tab-212. I removed every iframe and helper, reset the viewport to desktop and closed the tab.
- **What the loads did:** loading Home and Archive rewrote their own `astory-home-*` and `astory-archive-wall` keys with the same values. Loading /talk and /plans queued their usual view events.
- **Not touched:** I didn't sign out and didn't read or touch `astory-app-auth`. I pressed none of Save, Keep, Change, Remove, Send, Order, Open it, Choose, switch story, the printing-interest button, "Name them" or "Delete my account…".
- **Playwright:** headless and signed out.
- **Saved:**
  - Scripts are in my scratchpad (`r14b/`).
  - Shots: `docs/agents/reviews/shots/book-r14-wall-*`, `book-r14-wall-none-track-1366.png` and `book-r14-wall-track-foot-1366.png`.
