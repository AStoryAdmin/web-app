# Book, Plans, Account, Talk, Start and the Wall, round 13: Bao's Standard

**FAIL.** 2 findings, both on a person page at the narrowest phones (320–340px).

7bbb84b fixes the signed-out strip. Measured with real scrollbars, the cloth reaches the window's edge on every locked page.

548b0ca holds everywhere else:
- Home is exact at every width from 320 to 2560.
- The sample family is exact at 360–390.
- Sheets fit the window under zoom.
- Book, Plans, Account, Talk and Start pass the sweep.

What is left:
1. The fix for the "Give eight memories a year" task on a person page wraps the words, but the arrow still runs off the window at 320 and 340.
2. At 320 only, three of the four sample-family people still move on arrival.

## How I checked

- **Read first:** the diffs of 7bbb84b and 548b0ca, my round-12 report, and N37–N41 in `book-r12-skills.md`.
- **Signed-out pages, with real scrollbars:** headless Chromium from `../09142026/node_modules/playwright`, launched with `ignoreDefaultArgs: ['--hide-scrollbars']` so classic 15px scrollbars draw, in fresh signed-out contexts.
  - Pages: `/welcome`, `/sign-in`, `/create-account`, `/verify`, `/forgot-password`, `/reset-password`, `/join/ABCDEF`, `/c/zz-fake`, the real wall and the bad slug.
  - Sizes: 1366×768, 1920×1000, 2560×1300, 1280×1024 (5:4), 800×1024 and 390×844.
  - At each I measured:
    - `overflow-y` and `scrollbar-gutter` on `html`;
    - `clientWidth` against the window, and the right edge of `body` and of the page's root;
    - the element at the window's right edge.
  - I also saved right-edge screenshots.
- **Signed-in pages, in my own pane tab (tab-209):** cold loads in same-origin iframes at the test size.
  - A 4ms poll recorded the first skeleton sample and the arrived values (cloth / sheet top), dips, and every `clientWidth` change.
  - In arrived frames, in my own DOM only, I set a dated person's two-part subline with the new markup and checked where each dot falls.
  - I opened the shortcuts sheet (`?`) with 5000px of filler appended, to test its height under zoom.

## Round 12's findings, re-checked

| # | Round 12 | Now |
|---|---|---|
| 1 | A 15px empty gutter on the locked signed-out pages | **Fixed (7bbb84b).** With real scrollbars, at 1366, 1920, 2560 and 1280×1024, all eight locked pages (the door's book and the seven ritual pages) measure: <br>• `overflow-y: hidden`; <br>• `scrollbar-gutter: auto`; <br>• `clientWidth` equal to the window; <br>• `body` and the page's root ending at the window's edge. <br>The element at the right edge is `door-wrap`, `spread-wrap` or the plate. Shots: `shots/book-r13-door-right-edge-1366.png` and `shots/book-r13-signin-right-edge-1920.png`, with the cloth's texture to the last pixel. <br>At 800 and 390 these pages scroll as before. |
| 2 | The sample family moved on a phone | **Fixed at 360, 375 and 390.** Rose, Walter, Edith and Peggy hold exactly: 215.9 → 215.9 for Rose, and 251.2 → 251.2 for the other three, with 0 dips. **At 320 three of them still move: finding 2.** |

## Skills N37–N41 and the coordinator's items

| Item | Now |
|---|---|
| N37 (the gutter strip) | Fixed, as finding 1 above. |
| N38 (a white, disabled track) | **Themed.** `scrollbar-color` is a 55% `--ink-soft` thumb on a clear track. With real scrollbars, the long wall shows a soft thumb over the cream canvas (`shots/book-r13-wall-track-1366.png`). On the one-screen bad-slug page, a clear 15px track with a disabled arrow stands beside the chocolate cloth (`shots/book-r13-wall-none-track-1366.png`). That follows from the lead's ruling to keep the track; see Notes. |
| N39 (a dot left at a line's end) | **Fixed.** Each dot is now glued inside its part's nowrap span. With "Your grandfather · Born 1931 · Passed away 2019" set in an arrived frame at 320, 360 and 390, the dot always shares a line with the part it introduces. |
| N40 (Home's held plan) | **Fixed in code:** the skeleton takes `user.plan` when sign-in knows it, and memory is only the fallback. The founder's cold loads are exact. I didn't delete `astory-home-paid` to test the fallback, because that would write to storage. |
| N41 (Home's question at 320) | **Fixed.** Home's cold load, first skeleton sample → arrived: <br>• 320: 662.6/635 → 662.6/635; <br>• 360 and 390: 593.1; <br>• 800: 484.1; <br>• 1366: 355; <br>• 1920: 363.8; <br>• 2560: 472.2. <br>0 dips, a constant `clientWidth`, and no overflow. The page stores `astory-home-question` with today's day key. |
| The `.arc-task` at 320 | **Words fixed, arrow not: finding 1.** On the Archive at 320 the task ends at 285 of 305, and `body.scrollWidth` equals the window. |
| `.sheetbox` under zoom | **Fixed.** `max-height: calc(86vh / var(--zoom))`. With the sheet forced to overflow, it scrolls inside a box that stays within the window: <br>• 2560×1300 (zoom 1.3): 104 → 1222; <br>• 3840×2160 (zoom 2.16): 173 → 2030; <br>• 1366×768: 64 → 724; <br>• 1920×1000: 80 → 940; <br>• 390×844: 112 → 838. <br>That is 86% of the window each time. |

## Findings

1. **On a person page at 320 and 340px, the arrow of the "Give eight memories a year · about 2 minutes" task still runs off the window.**
   - **Where:**
     - book-account.css:739, `@media (max-width: 400.98px) { .pp2 .arc-task { white-space: normal; flex-wrap: wrap; … } }`.
     - The words now end inside the column (24…285 at 320). But `.arc-task-t` keeps `white-space: nowrap` (archive-reading.css:453), and the arrow, `.arc-task-arrow` with its 8px margin, stays on the same flex line.
   - **Evidence** (person 5aa5; `body.scrollWidth` against the window):
     - **320:** 345 against 305. `SPAN.arc-task-arrow` ends at 345, so the arrow is cut 40px off the window by `overflow-x: clip`.
     - **340:** 345 against 325, cut by 20px.
     - Clean from 360 (345/345), and on 36cf and the sample family, which don't show the task.
   - **Rules:** the checklist (no clipped text), 12, and DESIGN.md's phone floor.
   - **Fix:** in that query, set the task as a block, as the Archive's own phone rule does (archive-reading.css:464, `display: block; white-space: normal` with an inline arrow), and let `.arc-task-t` wrap.

2. **At 320, three of the four sample-family people still move on arrival. The held name and subline wrap differently from the arrived ones at that width.**
   - **Where:** `pages/Person.tsx:125–140`. The skeleton holds "Rose Hartley." for Rose and "Walter Carey & Rose." for everyone else, over the long dated subline "A sample family · Rose’s mother · Born 1912 · Passed away 1979".
   - **Evidence** (320×844, first skeleton sample → arrived):
     - **sample-rose:** 274.5 → 251.2, **23px up**. Rose's real subline, "… · Storyteller · Born 1941", is two lines, but the held one is three.
     - **sample-edith:** 309.8 → 274.5, **35px up**. "Edith Carey & Rose." is two lines, but the held "Walter Carey & Rose." is three.
     - **sample-peggy:** 309.8 → 286.6, **23px up**.
     - **sample-walter:** exact (309.8).
     - Exact at 360, 375 and 390.
   - **Rules:** 23a and 42; N27's ±2px at a must-render width.
   - **Fix:** hold each sample person's own name and subline. The four are fixed content, so key them by `personId` in a small map, rather than one shared stand-in.

## What passed

- **The sweep, at 1366, 1920, 2560 (zoom 1.3), 800 and 390:**
  - Book, Plans, Account and Talk held their cloth and sheet top exactly, with 0 dips.
  - `clientWidth` was constant during every load.
  - `body.scrollWidth` equals the window.
  - Three Where to next rows on each.
- **Start (`?another=1` and `&join=1`):** `body.scrollWidth` equals the window at every size. Both pages are one screen at 1366, 1920, 2560 and 800.
- **Signed-out pages, real scrollbars:** see round 12's finding 1 above.
  - The locked pages have no track and no gutter, and nothing scrolls.
  - The wall, the bad slug and the stacked door keep a constant track.
- **The founder's six people:** they still hold exactly at 320–390 (192.6/165; ada1's two-line name as noted before).

## Notes (not findings)

- **The new `html` rule has weight now.** `:where(html):not(:has(.auth.ritual, .door[data-layout="book"]))` takes `:not()`'s specificity of (0,2,0). That beats signed-out.css:668's `html:has(.door)` (0,1,1).
  - So the stacked door at 800 and 390 now computes `overflow-y: scroll` rather than `visible`. Those pages scroll anyway, so nothing visible changed.
  - But the comment's "no weight" no longer holds. Wrapping the whole selector in `:where()` restores it.
- **A real person with a long dated subline** ("Your grandfather · Born 1931 · Passed away 2019") wraps to two lines even at 390 (215.9 against the held 192.6). That is the one-line ruling's known trade-off; the founder's people have one part.
- **Home's greeting at 320** is still three lines ("Good / afternoon, / Bao."). Held and arrived agree, but DESIGN.md asks for two at most.
- **The bad slug's track** is a clear strip with a disabled arrow beside the full-height cloth, the cost of the kept track on a one-screen page.

## Not verified

- **Real Edge:** the scrollbar evidence is headless Chromium with its scrollbars drawn, not a real Edge window.
- **N40's fallback:** not exercised, because it would mean removing `astory-home-paid`.
- **Hover, focus-visible, active and reduced-motion states**, and a zoomed-out Edge window.

## Housekeeping

- **The pane:** I worked only in tab-209. I removed every iframe and helper, reset the viewport to desktop and closed the tab.
- **What the loads did:** loading Home stored its own `astory-home-question` and `astory-home-paid`. The shortcuts sheet was opened with `?`, and the filler I appended to it was removed.
- **Not touched:** I didn't sign out and didn't read or touch `astory-app-auth`. I pressed none of Save, Keep, Change, Remove, Send, Order, Open it, Choose, switch story, the printing-interest button, "Name them" or "Delete my account…".
- **Playwright:** headless, signed out and fresh, with scrollbars drawn.
- **Saved:**
  - Scripts are in my scratchpad (`r13b/`).
  - Shots: `docs/agents/reviews/shots/book-r13-door-right-edge-1366.png`, `book-r13-signin-right-edge-1920.png`, `book-r13-wall-track-1366.png` and `book-r13-wall-none-track-1366.png`.
