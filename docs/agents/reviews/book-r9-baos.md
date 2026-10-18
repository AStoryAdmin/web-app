# Book, Plans, Account, Talk, Start and the Wall, round 9: Bao's Standard

**FAIL.** 4 findings, ranked worst first.

All four round-8 findings are fixed at the sizes they named. N22, N23 and N24 are fixed, and so is N26's double rise. The six pages in scope are clean at 1366×768, 1920×1000, 2560×1300, 800×1024 and 390×844 on every sweep line: no horizontal scroll, nothing under 12px, no target under 44px, no word cut in two, nothing left faded.

The faults are in the loading frames that this round added or changed:

1. **Archive, Person and Home (on a phone) now hold a hero that is shorter than the one that arrives.** The sheet still rises once, but at arrival it drops 33–196px while it is still rising. On the Archive that is 105px at 1366.
2. **Talk's tablet skeleton still misses from 1001 to 1030px.** In that band the lead sets in two lines, but the skeleton holds one. The card lands 26px below its outline.
3. **The arrival runs in `useEffect`, after the browser may already have painted.** On every cold load the sheet is in the DOM at full opacity for 11–25ms before `arrive()` hides it. On Talk's inside path the words and card show for 5–6ms. I could not watch a real paint (see the finding).
4. **The join link's skeleton is a blank sheet with a heart.** Its frame is the right size, but no hairline is drawn. Every other skeleton in the set draws its page in hairlines.

## How I checked

- **Read first:**
  - BAOS-STANDARD.md (including today's change to rule 14: the cloth title is bold Montserrat; every cloth `h1` I measured computes to Montserrat 700) and DESIGN.md's craft rules.
  - `book-r8-baos.md` and `book-r8-skills.md` (N22–N26).
  - The whole source diff of d13b205: Shell.tsx, arrive.ts, Book.tsx, Home.tsx, Archive.tsx, Person.tsx, Start.tsx, Write.tsx, printBook.ts, bookPages.ts and book-account.css.
- **Signed-in pages, in my own pane tab (tab-165):**
  - The tab sat on a same-origin image (`/book/closed-640.webp`). Each page was cold-loaded into a same-origin iframe of the test size, at 0.01 opacity, through the shared session.
  - The harness polled every 4ms. It stepped the frame's GSAP ticker with lag smoothing off and recorded the sheet's opacity and top on every poll, with whether a skeleton was up. A "dip" means the sheet's opacity went over 0.5 and then back under 0.2.
  - After arrival it waited 1.2–2.5s, stepped GSAP 300 times, updated ScrollTrigger, and ran round 8's sweep:
    - scrollWidth against clientWidth;
    - text under 12px outside the book;
    - controls under 44 CSS px;
    - overlapping controls;
    - text in view under 0.9 opacity;
    - one-word last lines;
    - straight quotes;
    - the pressed mark's box against text and rows;
    - plus the mid-word detector, now run on every page.
- **Pages and sizes:**
  - **The fresh pass:** Book, Plans, Account, Talk, `/start?another=1` and `/start?another=1&join=1` at 1366×768, 1920×1000, 2560×1300 (zoom 1.3), 800×1024 and 390×844.
  - **Plans names:** 901, 950, 1000, 1050, 1080, 1090, 1100, 1101, 1180, 1280, 1300, 1320, 1340 and 1341.
  - **Talk skeleton → arrived:** 761, 770, 800, 900, 1000, 1001, 1100×900, 1101×900, 1366 and 390. Then one arrived page was resized in 10px steps from 761 to 1101, and in 1px steps from 1021 to 1032.
  - **The join skeleton → arrived:** 1366, 1920, 2560, 800 and 390, with eleven boxes compared.
  - **The Book on a phone:** 375×667, 390×844, 360×640, 414×736 and 375×812, skeleton and arrived.
  - **Shell and arrive (rule 1):** Home, Archive, Person (`/family/5aa5…`), a memory (`/archive/5963…`) and Write, cold at 1366 and 390. Home was loaded nine times in all and Person three times at 390. The cloth and hero boxes were compared, skeleton to arrived, on Home 390 and 1366, Person 1366 and 390, the memory at 1366, and Archive at 1920 and 800.
  - **Paint timing:** a MutationObserver in the frame logged when the sheet, or Talk's content, entered the DOM and its opacity then. MessageChannel ticks sampled it after that until `arrive()` changed it. This ran on Home, Talk, Book, Account and Plans (sheet), on Talk ×4 and Account ×3 (inside path), and on six pages for the hero and `[data-rise]` items.
- **Screenshots I looked at:**
  - The join skeleton at 1366 (`book-r9-start-join-1366-skeleton.jpg`, a frozen copy with no scripts);
  - Plans at 1280 (`book-r9-plans-1280-names.jpg`);
  - Talk at 1000;
  - the Book at 1366, and its editions at 390;
  - Account's "Whose stories" at 390;
  - the wall at 1366 and its foot at 390.
- **The wall:** headless Playwright from `../09142026/node_modules/playwright`, a fresh context with no session every time.
  - The real wall at 1366, 1920, 2560, 800, 390, 770, 800×900, 900, 1000, 1100×900, 1180×900, 3840×2160, and 1707×960 at deviceScaleFactor 0.8.
  - The bad slug at 1366, 1920, 2560, 800, 390, 800×900 and 1000.
  - The wait state (the function held back 5s) at 1366, 1920, 2560, 800 and 390.
  - Shots are `docs/agents/reviews/shots/book-r9-wall-*`.
- **Code:** `npx vitest run src/components/book/printBook.test.ts` passes 3 of 3.

## Round-8 findings, re-checked

| # | Round 8 | Now |
|---|---|---|
| 1 | Plans cut "Individual" and "Monthly" mid-word at 901–1340 | **Fixed.** At all fourteen widths every plan name sets on one line, with its price on its own row below (135–178px tracks). The mid-word detector finds nothing on Plans, and no horizontal scroll (`book-r9-plans-1280-names.jpg`). |
| 2 | Talk's tablet skeleton was the wrong shape at 761–1100 | **Fixed from 761 to 1000 and from 1031 to 1100.** <br>• Words: 81/405 → 81/403.8. <br>• Outline → card: 526/261 → 521.7–520.8/259–261 (about 5px, see Notes). <br>• The heart sits inside the outline (628.5 in a 526–787 block). <br>**Not fixed from 1001 to 1030:** finding 2. |
| 3 | `?another=1&join=1` loaded over step 1's skeleton | **Fixed in shape.** At all five sizes the skeleton's sheet, recap, title, body, form, code field, input, buttons, back link and header are at the arrived boxes to 0.1px. For example, the sheet is 1240×381 at y 219.5 at 1366, and 374×562.5 at 163 at 390. The heart sits in the field's place, and "Opening the book…" is readable. **But nothing is drawn:** finding 4. |
| 4 | Talk's card stopped short of its column at 901–1100 | **Fixed.** The card spans the column: 829 against 827 at 900, 922.8 against 920.7 at 1000, 1016 against 1014 at 1100. |

## N22–N26, re-checked

| # | Skills gap | Now |
|---|---|---|
| N22 | Print at home lost the third-person retelling | **Fixed.** `typeset()` re-keys a matching retelling to the typeset body's hash and sets bodies paragraph by paragraph. A stale retelling stays stale. The new test proves "She said they didn’t have much…" prints, curled. Not checked in a printed PDF. |
| N23 | The book shrank to 229px on a short phone | **Fixed.** `useBookChrome` adds the tab bar, and the page has a 300px floor. <br>• **375×667:** the page is 300, and the skeleton is 300 at the same place (54px under the sheet's top in both). The row under it is at 627–725, below the tab bar at 598, and reached by scrolling, as N23 proposed. <br>• **390×844:** 330.7, the row ends at 756 above the tab bar at 775. <br>• **375×812:** 304, ends at 729 above 743. <br>• **360×640 and 414×736:** 300, the row scrolls. <br>No horizontal scroll at any of them. |
| N24 | The inside path left the sheet blank for 0.55s | **Fixed.** The rise of the sheet's `[data-rise]` items starts at 0.08 on Talk (all ten sizes), Account and Family. |
| N25 | Talk's skeleton between 761 and 1100 | As round-8 finding 2 above. Fixed except from 1001 to 1030. |
| N26 | Home and Archive raised the sheet twice | **Fixed as a double rise.** <br>• Archive 1366/390, Person 1366/390 (×3 at 390) and the memory 1366/390 rise once. <br>• Home rose once in 7 of 9 cold loads. The two dips (one at 1366, one at 390) did not come back in 4 more loads at 390 and 2 at 1366. Other agents were editing and committing during the run (transcript.ts, MemoryPage.tsx, AuthProvider.tsx), so I don't count them. <br>• **The held heroes don't hold the arrived height:** finding 1. <br>• Write still rises twice (a dip at 1366 and at 390). Known, not counted. |

## Findings

1. **The loading heroes on Archive, Person and Home (on a phone) are shorter than the heroes that arrive. The cloth grows on arrival and the sheet drops while it is still rising.**
   - **Where:**
     - Archive.tsx:243–262 holds the label, the title and a one-line `arc-wall`. The arrived hero (Archive.tsx:300+) adds the `hero-stats` row (61px) and sets the wall line at 44px (the line plus its button).
     - Person.tsx:120–126 holds one title line. The arrived `phero` adds the `phero-sub` line (Person.tsx:309).
     - Home.tsx:41–67 holds the label on one line and two buttons. On a phone the arrived label wraps to two lines (the teller pick), and "Ask me another" adds a row under the buttons (Home.tsx:138).
   - **Evidence:** cloth height, skeleton → arrived, and the sheet in the next 60ms sample:

     | Page | Window | Cloth | Sheet at arrival |
     |---|---|---|---|
     | Archive | 1366 | 275.9 → 384.1 | 251.1 → 357.9, at opacity 0.94 → 0.97 |
     | Archive | 1920, 800 | 275.9 → 384.1 | 284.8 / 262.3 → 356.1 |
     | Archive | 390 | 206.9 → 402.8 | 197.5 → 385.9, at opacity 0.67 → 0.80 |
     | Person | 1366 | 223.7 → 256.9 | 214 → 238.5 |
     | Person | 390 | 159.4 → 192.6 | 152.7 → 177.2 |
     | Home | 390 | 518.9 → 593.1 | settles at 565.1, against 493 for the skeleton |
     | Home | 1366 | 355.7 → 355.7 | holds |
     | Memory | 1366 and 390 | 104 → 104 | holds |

     The sheet is already nearly opaque when it lurches 24–188px down the window. Before this round the second rise hid the change. Now the jump shows.
   - **Sizes:** Archive and Person at every size I measured. Home at 390 only.
   - **Rules:** 23a ("Nothing jumps or flashes"), 42 (the skeleton is "the page's" shape), and rule 1. It is the same promise N26's fix made: "the arrived frame".
   - **Fix:** hold every arrived hero line at its size in the loading hero:
     - Archive: the `hero-stats` row, and the wall line at its 44px button height;
     - Person: a `phero-sub` line;
     - Home on a phone: the label's two lines and the third button's row.
     Then check that the cloth height matches, skeleton to arrived, to ±2px at 1366, 1920, 800 and 390.

2. **From 1001 to 1030px, Talk's card lands 26px below its skeleton outline.**
   - **Where:** book-account.css, `@media (min-width: 1001px) and (max-width: 1100.98px) { .talk-skel > .bka-sk-col { min-height: 374px; } }`. The lead ("A Story talks with you in the A Story app on the phone…") sets in two lines (62px) up to 1030 and in one line (31px) only from 1031.
   - **Evidence:**
     - Cold load at 1001×1024: words 81/374 → 81/403.8; outline 495/261 → card 520.8/260.9. The heart's settled top is 597.5, in the top 2px of the arrived card.
     - On a resized arrived page the lead is 62px tall at every width from 1001 to 1030, and 31px from 1031. The card's top is 520.7 up to 1030, and 489.7 from 1031.
   - **Sizes:** windows 1001–1030 wide (scrollbar included). A 1024-wide tablet in landscape falls in it.
   - **Rules:** 23a and 42, and N11's ±2px aim. This is the last band of round-8 finding 2.
   - **Fix:** move the 374px rule's lower edge to 1031px (`min-width: 1031px`), so 1001–1030 keep 405px. Better, size the column from the lead's own line count, so the boundary can't drift when the copy changes.

3. **The arrival runs in `useEffect`, so content sits at full opacity in the DOM before `arrive()` hides it. The browser may paint it in that gap, which would show the page at rest, blank it, then rise it.**
   - **Where:** Shell.tsx:295–307 (the arrival) and 313–323 (the inside path) are both `useEffect`.
   - **Evidence:**
     - **Every cold load:** the sheet enters the DOM at opacity 1. The first MessageChannel tick after insertion still reads 1. `arrive()` then sets it to 0. That was 19.5ms later on Home, 19.7 on Talk, 11.1 on the Book, 24.8 on Plans and 22.8 on Account. These are upper bounds, because the second tick ran after the effect's task.
     - **Talk's inside path:** in 4 of 4 loads the words and card are inserted at opacity 1, read 1 again 2ms later, and read 0 at 4.8–6.1ms.
     - **The poll caught it twice:** a Person load at 390 caught the sheet at opacity 1 (top 131.4) before it went to 0 (top 187.4), and the K-run caught Talk's blocks at opacity 1 at "arrival" at 900 and 1100.
     - **Account's inside path is clean:** its block is already 0 when it is inserted, because its commit flushes the effect in the same task.
   - **Not verified:** the pane is hidden and draws no frames, so I could not see whether Edge paints in these gaps. Rendering can happen between any two tasks once a frame is due, so a gap of 5–25ms that spans two tasks will often contain one, on a 120Hz display more often. One Edge performance recording of a cold load of /talk would settle it.
   - **Sizes:** all. It doesn't depend on size.
   - **Rules:** 23a ("Nothing jumps or flashes") and 25. gsap-react: `useGSAP` uses a layout effect for exactly this reason, so the from-state is set before the first paint.
   - **Fix:** run both arrival effects in `useLayoutEffect` (or `useGSAP`), so the sheet and the inside items take their from-state in the commit, before the browser can paint.

4. **The join link's skeleton draws nothing but the heart.**
   - **Where:** Start.tsx:199–230, with book-account.css `.start-skel .start-recap, .start-sk-hold { visibility: hidden; }`. The recap, the field and the buttons are all hidden, and no hairline replaces them.
   - **Evidence:** `book-r9-start-join-1366-skeleton.jpg` shows a 1240×381 empty ivory sheet with a heart at x 930 and nothing else. Step 1's skeleton draws its three way frames, and Talk, Account and the Book draw their columns and blocks. Here a person waits on a blank card.
   - **Sizes:** all five.
   - **Rules:** 42 ("Loading draws the mark on the sheet over the page's hairline skeleton") and rule 1.
   - **Fix:** draw the held frame in hairlines, as the other skeletons do:
     - the recap as `bka-sk-line`s (the back link, the step line, a tall title line, three body lines);
     - the code field as one 44px underlined row and the button as a hairline outline;
     - and keep the heart over the field.

## What passed

- **The fresh pass** (six pages at 1366, 1920, 2560, 800 and 390):
  - no horizontal scroll;
  - no text under 12px outside the book;
  - no control under 44 CSS px (the two 1×1 radios on Account at 2560 are visually hidden, and their labels are the targets);
  - no word cut in two;
  - no straight quotes.
- **Overlap:** the only overlaps are page rows sitting under the fixed phone tab bar at scroll 0 (the Book's contents rail, Account's index), which scroll clear.
- **Opacity:** nothing in view under 0.9 once arrived. The exception is Start's "My own story" specimen at 0.5, the designed disabled way.
- **One-word last lines:** three the detector flagged are designed rows:
  - "Order" (the Book's edition button on its own row at 390, seen);
  - "Chosen" (Account's state in the button slot at 390, seen);
  - "ABC123" (Start's family-code specimen, a label over a code).
- **The pressed mark:** 46×51 (59.8×66.3 at 2560) in the foot band on every page in scope, 53.3px under the last text (79.3 on a phone, 69.1 at 2560). It meets no text or row.
- **Where to next:** three rows on Book, Plans, Account and Talk at every size.
- **Plans and Talk** are one screen at 1920 and 2560.
- **The Book:**
  - Its skeleton matches the arrived stage on every phone size: the same top, size and row.
  - At 1366 the spread is unchanged from round 8, and the controls are above the fold.
- **Talk:**
  - The skeleton holds at 1101 and 1366: 78.5 → 78.5–79.
  - At 390 the card holds (66/245 → 66/244.9).
- **Start:** step 1 and the join page are one screen at 1366, 1920, 2560 and 800. At 390 the join page fits 844, and step 1 scrolls (1194).
- **The wall:**
  - The function answered 200 every time; the fallback RPC was never called; 4/4 photographs loaded; no auth keys in storage.
  - Every leaf title is one or two lines (at 2560 and 3840 the count was read with the zoom divided out).
  - The bad slug answers 404 and shows "This story isn’t shared." in exactly one screen at all seven sizes.
  - On a phone the mark now keeps the desktop's foot band (`bottom: 10px`), so the A sits at the sheet's foot under about 80px of paper, touching nothing (`book-r9-wall-real-390-foot.png`).
  - The wait state's status is readable, and its heart crosses no rule.
- **Rule 14 (changed today):** every cloth title I measured (Home, Archive, Person, the memory, Book, Plans, Talk) computes to Montserrat 700.

## Notes (not findings)

- **Talk at 761–1000:** the card lands 4.3–5.2px above its outline (526 → 521.7–520.8), with a 2px height difference. That is just outside N11's ±2px, and a 5px settle is hard to see. Matching the skeleton's row gap to the arrived one would close it.
- **Plans at 901–~990 and 1101–~1170:** Monthly's note sets as "no yearly / commitment". It is three words of 13px small print, and `balance` would give the same. Only the copy can change it, like Free's "One ten-minute / conversation".
- **Write** rose twice at 1366 and 390 (known, not counted).
- **Unreproduced dips:** single runs of Plans 1920, Talk 1001, Talk 1100 and the Book 414×736 logged a dip. Reruns of each were clean (Plans ×2, Talk ×2, Book ×2). I put them down to the concurrent edits and reloads, not the pages.
- **Talk's card** carries the index card's blue ruled line through the question line (`.talk-q` background). At 1000 it shows only to the right of the question, in two pieces. It is the card's design, but it reads as stray hairlines at a glance. I didn't count it.
- **Round-7 and round-8 notes still stand:** Account has two `h1`s ("Account", one `sr-only`), and the wall's wait state draws two leaves beside a one-memory chapter.

## Not verified

- **Real paints:** whether Edge paints in finding 3's gaps. The pane draws no frames.
- **A zoomed-out Edge window on the signed-in pages:** 2560 at zoom 1.3 and 1280–1340 stand in for it.
- **The signed-in pages at 3840×2160:** only the wall was run there.
- **Talk at 1920 and 2560 skeleton → arrived:** round 8 noted the card arrives 13.5px and 17px taller there. Not re-measured.
- **Live resize** of the Book's `--bk-chrome`, and hover, focus-visible, active and reduced-motion states: read in code, not exercised.
- **The printed PDF:** not opened. N22 was checked by the unit test and by code.
- **Controls I did not press, by instruction:** Save, Change, Remove, Send, Order, Open it, Choose, switching story, the printing-interest button, "Name them", "Delete my account…" and Sign out.

## Housekeeping

- **The pane:** I worked only in tab-165. Every measuring iframe and frozen copy was removed after use. My helpers lived on that tab's window and went with it. I reset its viewport to desktop and closed it.
- **What the loads did:** loading /talk and /plans queued their usual view events.
- **Not touched:** I didn't sign out, didn't read or touch `astory-app-auth`, submitted nothing and pressed none of the forbidden controls.
- **Playwright:** headless, fresh contexts with no session. The wait-state run only delayed the function's response inside that browser.
- **Saved:** scripts are in my scratchpad (`r9/`). Shots are in `docs/agents/reviews/shots/book-r9-*`: the wall set from Playwright, `book-r9-start-join-1366-skeleton.jpg` and `book-r9-plans-1280-names.jpg`.
