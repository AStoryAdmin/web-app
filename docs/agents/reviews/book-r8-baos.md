# Book, Plans, Account, Talk, Start and the Wall, round 8: Bao's Standard

**FAIL.** 4 findings, ranked worst first.

All four round-7 findings are fixed, and so are N15 to N21. The sheet's A-mark now stays small in the foot band on every page that ends on Where to next, and covers no text or control at any size. At 1366×768, 1920×1000 and 2560×1300 every page in scope is clean. The four faults sit in the tablet and small-laptop widths, or in a cold load:

1. **Plans cuts two plan names in the middle of the word**, "Individu / al" and "Month / ly", from 901 to 1340px wide (except 1090–1100). That includes 1280, a laptop or a zoomed-out large window.
2. **Talk's tablet skeleton is the wrong shape.** From 761 to 1100px the card's outline sits 124–155px above where the card lands, and is up to 267px wider and 47px taller. The card jumps on arrival.
3. **`/start?another=1&join=1` loads over the wrong skeleton.** It draws step 1 (three way cards, a 627px sheet) and then arrives as step 2's join form (a 381px sheet, 123px lower). The heart draws in a card that never comes.
4. **Talk's card stops short of its column from 901 to 1100px.** The card is capped at 762px, but the steps' rules above it and the Where to next rows below run 842–1015px. That leaves 80–254px of bare paper beside it.

## How I checked

- **Read first:** BAOS-STANDARD.md, DESIGN.md, `book-r7-baos.md`, `book-r7-skills.md`, and the diffs of ec7661a and e2754e1 (Shell.tsx, arrive.ts, Book.tsx, Talk.tsx, Account.tsx, Start.tsx, Wall.tsx, bookPages.ts, printBook.ts, astory.css, book-account.css).
- **Signed-in pages:** in my own pane tab (tab-142).
  - Every page and size was cold-loaded into a same-origin iframe of that size, at 0.01 opacity, signed in through the shared session. I waited for the skeleton to leave and then 2.5s more. Then I stepped GSAP with lag smoothing off and ran one sweep. I checked that this gives the same numbers as the tab itself at 1366 and 2560 (the Book's stage, controls and mark matched to 0.1px).
  - **Pages and sizes:**
    - Book, Plans, Account, Talk, `/start?another=1` and `/start?another=1&join=1`, at 1366×768, 1920×1000, 2560×1300 (zoom 1.3), 800×1024 and 390×844.
    - All six again at 770×1024, 900×1024, 1000×1024 and 1100×900. The Book, Plans, Account and Talk also at 800×900.
    - Plans at 901, 950, 1050, 1080, 1090, 1101, 1180, 1280, 1290, 1300, 1320 and 1340 as well.
  - **The sweep checks:**
    - scrollWidth against clientWidth;
    - text under 12px outside the book object;
    - controls under 44 CSS px (screen ÷ zoom);
    - overlapping controls;
    - text in view under 0.9 opacity, with ancestors multiplied in;
    - one-word last lines. I proved the detector on a planted paragraph first, and it caught it;
    - **new this round:** words cut across two lines. It caught "Individual" and "Monthly" on a live page;
    - straight quotes;
    - the `.sheet-page::after` mark's box (its computed left, bottom, width and height on the sheet's rect, times the zoom), with every text run and row box it meets, and its distance to the nearest text above.
- **The mark, rule 1:** the same mark sweep ran on every other page that ends on Where to next: Home, Write, Archive, a memory, Family and a person. Sizes were 1366, 1920, 2560, 1000, 900, 800 and 390. The mid-word sweep ran on those pages at 1000, 1180, 1280, 900, 800 and 390.
- **Skeleton → arrived:**
  - Each page was cold-loaded into an iframe and polled every 4ms while the skeleton showed. That gives positions relative to the sheet's top, the heart's box, its container, any skeleton rule it crosses, where it sits once the sheet settles, whether the status line is inside an `aria-hidden` or `aria-busy` region, and whether the folio and keys hint are present.
  - Then the arrived counterparts were measured at arrival and 2.5s later.
  - For N18 a second probe sampled for 900ms after arrival: the hero `h1`'s split lines, the tweens on them, the `[data-rise]` items that are tweening, and the sheet's lowest opacity.
  - Sizes: Book, Talk, Account and Start at 1366, 1920, 2560, 800 and 390, and Talk also at 770, 900, 1000, 1100 and 1200.
  - For pictures, I froze the skeleton's DOM into a sandboxed iframe with no scripts and took a screenshot of it.
- **Screenshots I looked at:**
  - Book at 1366 (top and foot), 800×900, 1000 (foot) and 390;
  - Talk at 800 (skeleton and arrived), 900 (foot) and 1100;
  - Plans at 1000 and 1280;
  - Start at 390, and `?join=1` at 1366 (skeleton and arrived);
  - Account at 1366;
  - Family at 390 (foot).
  - All are in `docs/agents/reviews/shots/book-r8-*`.
- **The wall:** headless Playwright 1.63 from `../09142026/node_modules/playwright`, a fresh context with no session for every run.
  - The real wall at 1366, 1920, 2560, 800, 390, 770, 800×900, 900, 1000, 1100×900, 1100×1024, 1180, 3840×2160 and 1707×960 at deviceScaleFactor 0.8.
  - The bad slug at 1366, 1920, 2560, 800, 390 and 1000.
  - The wait state (the function's answer held back 5s) at 1366, 1920, 2560, 800 and 390.
  - The mid-word sweep at eleven widths.

## Round-7 findings, re-checked

| # | Round 7 | Now |
|---|---|---|
| 1 | The A-mark grew to 160×176 under the last Where to next rows at 761–1100 and on a phone | **Fixed** (astory.css:2777, :2930). It is 46×51 at every width (59.8×66.3 screen px at 2560), at gutter + 8px, `bottom: 10px`, and `96px` on a phone beside the folio. <br>• **Book, Plans, Account, Talk:** at all fifteen sizes the drawn mark is 53.3px below the last line of text (79.3 on a phone), and it meets no text, link or row. <br>• **Rule 1, the other pages that end on Where to next:** Home 40–57px clear, Archive and the memory page 53–80, Family and Person 21–30, the wall 21.6 (27.2 at 2560, 46 at 3840). None covers text or a control. On a phone, Family, Person and the wall bring the last row's hairline 2.6–3px inside the mark's box, but the drawn A starts about 9px below the rule (`book-r8-family-390-foot.jpg`, `book-r8-wall-390-mark-zoom.png`). `/write` draws no mark. |
| 2 | The stacked row under the book ran below the fold in tall tablet windows | **Fixed.** Book.tsx now measures `--bk-chrome`: 422px at 770 and 800 (the title wraps to two lines), 376 at 900, and 316 from 1000 up. The controls end at: <br>• 1011 of 1024 at 770×1024 and 800×1024; <br>• 887 of 900 at 800×900 (`book-r8-book-800x900-fold.jpg`); <br>• 1003 of 1024 at 900×1024; <br>• 763 at 1000×1024 and 810 at 1100×900; <br>• 744 of 768 at 1366, 987 of 1000 at 1920, and 1283 of 1300 at 2560; <br>• 756 at 390, above the tab bar at 774. |
| 3 | Where to next left one word on its last line at 1000–1100 | **Fixed.** `text-wrap: balance` gives "One question, or / anything you remember." (`book-r8-book-1000-wn.jpg`). There is no one-word last line in any Where to next on the six pages or on the wall, at any size. |
| 4 | Plans kept seven grid rows at tablet and phone widths | **Fixed.** At 800 the rows are 462/440/168, at 900 they are 440/440/168, and at 390 there are five card rows. The last card is exactly 64px from Where to next at 800, 900, 1000 and 390. |

## N15–N21, re-checked

| # | Skills gap | Now |
|---|---|---|
| N15 | The heart landed off-screen or on a hairline | **Fixed.** There is one heart per page, inside the first block: the Book's spread outline, Talk's card, Account's bookplate, Start's first specimen slot, and the wall's first leaf. It crosses no rule at any size I measured. Its top, once the sheet settles: <br>• Book: 432 (1366), 549 (1920), 662 (2560), 554 (800), 468 (390); <br>• Talk: 358, 358, 419, 646 (800), 295 (390); <br>• Account: 309, 315, 387, 290, 343; <br>• Start: 288, 450, 520, 367, 304; <br>• the wall at 390: 722, so it ends at 778 of 844. <br>All are inside the window. |
| N16 | Start's status line was hidden; the wall's sat inside `aria-busy` | **Fixed.** "Opening the book…" is readable (no `aria-hidden` or `aria-busy` ancestor) on Book, Talk, Account, both Starts and the wall, at every size. |
| N17 | The folio and keys hint stood under the skeleton | **Fixed.** Neither is in the DOM while busy. The running head holds at 10/39 (4/38 on a phone, 13/50.7 at 2560) from skeleton to arrival. |
| N18 | The cloth's words appeared without their rise on a cold load | **Fixed.** Within 900ms of arrival, on Book, Talk and Account at 800 and 1366, and on the Book at 390, the hero `h1` is split into lines with its tween running. Every `[data-rise]` item tweens (3/3, 2/2 and 1/1). The sheet's opacity never drops below its value at arrival, so it doesn't dip. |
| N19 | The printed book and the PDF set family words raw | **Fixed in code.** bookPages.ts smartens the family notes, the asked question, the dedication, and the title, motto and back message. printBook.ts `typeset()` smartens each memory's title and body, the dedication, and the cover's title, motto and back message before `buildLegacyHtml`. I didn't open a PDF (see Notes for the subtitle). |
| N20 | Talk's phone skeleton card was 55px too tall | **Fixed at 390.** The card goes 245 → 244.9, and 78.5 → 78.5 at 1366. The tablet band is still wrong (finding 2). |
| N21 | Wall titles ran to three lines at 761–850 and near 1180 | **Fixed.** At 770, 800, 900, 1000, 1100, 1180 and every standard size, every leaf title is one or two lines. At 2560 and 3840 that is measured with the zoom divided out. |

## Findings

1. **Plans breaks "Individual" and "Monthly" in the middle of the word.**
   - **Where:** `book-account.css:417`. `.pl-head` is `minmax(0, 1fr) auto`, so the price takes its width first and the name gets the rest. The global `h1, h2, h3, h4 { overflow-wrap: anywhere }` (astory.css:146) then lets the browser cut the name.
   - **Evidence:** at 1000 "Individual" gets a 93px track and sets in two lines, 55px tall, as "Individu / al". "Monthly" gets 71px, as "Month / ly". See `book-r8-plans-1000-names.png` and `book-r8-plans-1280-names.png`.
   - **Sizes:**
     - Both names break at 901, 950, 1000, 1050, 1101, 1180, 1280, 1290 and 1300.
     - "Monthly" alone breaks at 1080, 1320 and 1340.
     - Neither breaks at 1090, 1100, 1366 and up, or at 900 and below.
     - 1280 to 1340 is a 1600–1680 window at 125%, the founder's zoomed-out case.
   - **Rules:** 5 (zoomed-out windows) and 12 (nothing squashes), and the checklist's first line ("no clipped… text"). A name cut in two is the first thing a buyer reads on the page that sells the plans.
   - **Fix:** wherever five columns share the width (901–1340), put the price on its own row under the name, and set `overflow-wrap: normal` on `.pl-head h2` so a plan name can never be cut.
     - For the first part: `.pl-head { grid-template-columns: minmax(0, 1fr) }` with `.pl-head > .pl-price b { grid-column: 1; grid-row: 2 }`.

2. **Talk's skeleton puts the card's outline in the wrong place at tablet widths, so the card jumps when the page arrives.**
   - **Where:** book-account.css:904. In the ≤1100 block, `.talk-skel` stacks a six-line column (245px) over a full-width block, `min-height: 306px`. The arrived page stacks the title, a two-line lead and three ruled steps (about 400px) over a card capped at 760px (`.talk-card { max-width: 760px }`, line 543).
   - **Evidence:** card outline → arrived card, from the sheet's top:

     | Window | Outline (top, width, height) | Arrived card (top, width, height) |
     |---|---|---|
     | 770×1024 | 366.5, 720.7, 306 | 521.7, 722.9, 259.2 |
     | 800×1024 | 366.5, 748.8, 306 | 521.5, 751, 259.4 |
     | 900×1024 | 366.5, 842.4, 306 | 521.5, 762.2, 259.5 |
     | 1000×1024 | 366.5, 936, 306 | 521.5, 762.2, 259.5 |
     | 1100×900 | 366.5, 1029.6, 306 | 490.5, 762.2, 259.5 |

     The heart's settled top is 645.5, where the arrived steps land. See `book-r8-talk-800-skeleton.jpg` against `book-r8-talk-800-arrived.jpg`. At 1200 it holds: 78.5 → 78.7. At 390 it holds: 66 → 66.
   - **Rules:** 23a ("Nothing jumps"), 42, and N11's ±2px aim. This is N20's fault, fixed at the phone but not at the tablet.
   - **Fix:** in the ≤1100 skeleton block, give the words column the arrived shape, and size the block to the arrived card (`max-width: 760px; min-height: 260px`).
     - For the column: the title line, two lead lines and three 52px ruled step rows, about 400px.

3. **`/start?another=1&join=1` shows step 1's skeleton, then arrives as step 2.**
   - **Where:** Start.tsx:182–216. The `account === undefined` branch always draws the Whose-story sheet: "Step 1 of 2", three way frames, and the heart in "Someone in my family"'s specimen. With `join`, `who` starts as `"join"` and the page arrives as "Join their story." (Step 2 of 2), a short two-column sheet.
   - **Evidence:** the skeleton's sheet against the arrived sheet:

     | Window | Skeleton sheet | Arrived sheet |
     |---|---|---|
     | 1366 | 1240×627 at y 96 | 1240×381 at y 219 |
     | 390 | 374×1137 at y 76 | 374×562 at y 163 |

     The sheet shrinks by 246px (575 at 390) and its top drops 123px (87). See `book-r8-start-join-1366-skeleton.jpg` against `book-r8-start-join-1366-arrived.jpg`.
     - Step 1 (`?another=1`) holds: the sheet is 627.2 → 623.1, and the first way is 155 → 155.
   - **Rules:** 23a and 42 (the skeleton is "the page's hairline skeleton", and this one is another page's). The join link is what a relative is sent, so a cold load is its normal case.
   - **Fix:** when `join` is set, draw step 2's frame at its arrived size: the title block on the left, one field and the button on the right, and "Not now" held. Put the heart in the field's place.

4. **Talk's card stops short of its column from 901 to 1100px, so its right edge doesn't line up with the rules above and below it.**
   - **Where:** book-account.css:543, `.talk-card { max-width: 760px }` inside `max-width: 1100.98px`.
   - **Evidence:**

     | Window | Card | Steps and Where to next | Bare paper beside the card |
     |---|---|---|---|
     | 900 | 762 | 842 | 80px |
     | 1000 | 762 | 936 | 174px |
     | 1100 | 762 (34–796) | 1015 (35–1050) | 254px |

     See `book-r8-talk-1100-card.jpg`. At 770 and 800 the card fills the column (751 against 749), so the fault starts at 901.
   - **Rules:** 10 ("Columns align") and 8.
   - **Fix:** drop the cap so the card spans the column like the steps and Where to next, or give the whole stacked column (steps, card and Where to next) the same 760px measure.

## What passed

- **No horizontal scroll** anywhere:
  - every page in scope at every size above;
  - the wall at fourteen windows, including 3840×2160 and 1707×960 at 0.8.
- **Small print:** no text under 12px outside the book object.
- **Targets:** no control under 44 CSS px. The two 1×1 inputs at 2560 on Account are visually hidden radios whose labels are the targets.
- **Overlap:** no overlapping controls, apart from rail rows and Account's list passing under the fixed phone tab bar while scrolling.
- **Opacity:** nothing in view under 0.9 once arrived. The one exception is the "My own story" specimen at 0.45 on Start, the designed disabled card, because the founder already keeps their own story (`book-r8-start-390.jpg`).
- **Book:**
  - At 1366 the spread is 883×442 and the controls end at 732.
  - The reader fits at every tablet size listed in round-7 finding 2.
  - The skeleton holds at every size: block top and height, rail label, and the row under the book. At 800 the outline is the 602px square page inside the arrived stage.
- **Plans:**
  - One screen at 1920 and 2560 (document 1000 and 1300).
  - Apart from finding 1, the tablet cards are as round 7 left them.
- **Account:**
  - The bookplate holds from skeleton to arrival at every size: 81 → 81 (105.3 → 105.3 screen px at 2560, 130 → 130 at 390).
  - No one-word last lines.
- **Talk:**
  - One screen at 1920 and 2560. At 1366 the document is 893.
  - The skeleton holds at 1200 and up, and at 390.
- **Start:**
  - Step 1 and `?join=1` are exactly one screen at 1366, 1920, 2560 and 800. I didn't record the document height at 770–1100.
  - At 390, step 1 scrolls (1194) and `?join=1` fits 844.
  - The code field takes focus on `?join=1`.
- **The wall:**
  - The function answered 200 every time, the RPC fallback was never called, and all four photographs loaded.
  - No page errors, and no auth keys in storage.
  - The bad slug answered 404 and shows "This story isn’t shared." in exactly one screen at six sizes.
  - Where to next has three rows.
  - The only one-word last lines are inside closed leaves, below their clip.
  - The mid-word sweep flags only "Yeah" under a drop cap. That is the cap's taller box, not a broken word.

## Notes (not findings)

- **The phone wall's foot:** the wall has no tab bar and no folio, but the phone rule still lifts the mark 96px. So the A sits under the last rule with about 95px of bare paper below it. It touches nothing, so it is a note. `bottom: 10px` on the wall would close it.
- **Talk at 1920 and 2560:** the card arrives 13.5px and 17px taller than its outline. Nothing below it in that column moves.
- **Talk's phone skeleton:** the first words line sits at 351 against the arrived title's 342.9, 8px apart.
- **The wall's wait state:** it draws two leaves under the first chapter head. The founder's first chapter has one memory, so it arrives as a head beside one leaf, and the heart's leaf has no counterpart. A skeleton can't know the chapter's size, so this is a note.
- **Plans' Free column** still reads "One ten-minute / conversation" at 901–1340. That is round 7's note, and only the copy can change it.
- **Account** still has two `h1`s, the hero's and an `sr-only` one, both "Account" (round 7's note).
- **N19, one more field:** the cover's subtitle (`w.line` in bookPages.ts, `book.subtitle` in legacyBook) is typed by a person and is still set raw, on screen and in the PDF.
- **The dev server:** from cold, the pane showed blank cream or the large lockup for 1–8s before the skeleton. This looks like dev-module loading, not the app's design.
- **Edits during the review:** another agent's edits (archive files, photoUrls.ts) caused about eight full Vite reloads while I measured. My queue kept its place in sessionStorage and re-ran any page a reload cut short. Every result above comes from a completed load.

## Not verified

- **A zoomed-out Edge window on the signed-in pages:** the pane can't set browser zoom. 1280–1340 stands in for it in finding 1.
- **The Book re-measuring `--bk-chrome` on a live resize:** the pane was hidden, so it drew no frames and ResizeObserver never fired. A page resized from 800 to 1000 kept 422px until it was reloaded. I checked by code (it observes the page, the row and the hero) and by a cold load at every width. In Edge this needs one real resize to confirm.
- **Hover, focus-visible, active and reduced-motion states:** read in the CSS, not exercised.
- **The printed PDF:** not opened. N19 is checked in code.
- **The Book's empty state:** switching story is off limits.
- **Controls I did not press, by instruction:** Save, Change, Remove, Send, Order, Open it, Choose, switching story, the printing-interest button, "Name them", "Delete my account…" and Sign out.

## Housekeeping

- **The pane:** I worked only in tab-142.
  - The measuring iframes were same-origin, at 0.01 opacity, and each was removed after its measurement.
  - The two skeleton pictures were sandboxed copies with no scripts, removed after the screenshot.
  - My helper scripts lived in that tab's sessionStorage (`__r8*`). I removed them, reset the viewport to desktop and closed the tab.
- **What the loads did:** loading /plans and /talk again will have queued their view events, as in round 7.
- **Not touched:** I didn't sign out, didn't read or touch `astory-app-auth`, submitted nothing and pressed none of the forbidden controls.
- **Playwright:** it ran headless in fresh contexts with no session. The wait-state run only delayed the function's response inside that browser.
- **Saved:** scripts in my scratchpad (`r8/`), shots in `docs/agents/reviews/shots/book-r8-*`.
