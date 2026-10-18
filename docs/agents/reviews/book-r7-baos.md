# Book, Plans, Account, Talk, Start and the Wall, round 7: Bao's Standard

**FAIL.** 4 findings, ranked worst first.

All four round-6 findings are fixed where they were written, and so are N11 to N14 from the skills review. At 1366×768, 1920×1000, 2560×1300 and 390×844 the Book, Plans, Account, Talk and Start sweeps are clean, as they were last round. The sheet's pressed mark (finding 1) also sits under text at 390. The other three faults show only between 761 and 1100px wide, the band this round adds at 770, 800, 900, 1000 and 1100:

1. **The sheet's pressed A-mark sits under the "Where to next" rows** from 761 to 1100px and on a phone. This happens on the Book, Plans and Talk, and on the wall. At 1000 it is a 160×176 watermark behind "Write the next page / One question, or anything you remember.", and a row hairline runs through it.
2. **Round 6's fix for the Book's buttons pushed them below the fold in tall tablet windows.** The row under the book now stacks to 116px, but the page's height budget (`--bk-chrome`) still assumes 56px. At 800×1024 the controls end at 1033 in a 1024 window. At 800×900 "Open the book", "Back" and the dashes are wholly off-screen.
3. **"Where to next" leaves a single word on the last line** from 1000 to 1100px: "…anything you / remember." and "…with the / photographs." on the Book, and "Today’s question is / waiting." on Account. The component is shared by eleven pages.
4. **Plans keeps seven grid rows at tablet and phone widths.** The four empty ones add 64px of blank paper under the Monthly card at 761–900px, and 32px at 390.

## How I checked

- **Signed-in pages:** in my own pane tab (tab-130), cold-loaded at each size: 1366×768, 1920×1000, 2560×1300 (html zoom 1.3), 800×1024 and 390×844. For the under-book row I added 770×1024, 868×900, 900×1024, 1000×1024, 1100×900 and 800×900. After each load I waited 4–7s (the dev server is slow to fetch), stepped GSAP 400 ticks with `__st.update()`, and ran one sweep per page:
  - scrollWidth against clientWidth, and the document height;
  - text under 12px outside the book object;
  - controls under 44 CSS px (screen ÷ zoom, with a 0.5px float tolerance);
  - controls whose boxes overlap;
  - text in view under 0.9 opacity, with every ancestor multiplied in;
  - one-word last lines, found by comparing the line boxes of the last two words. I tested the detector on a planted case first, and it catches it;
  - straight apostrophes in visible copy;
  - for this round, where the `.sheet-page::after` mark sits, and which text and controls it covers.
- **Screenshots:** I saw the Book at 1366, 800×1024, 800×900 and 1000; Start step 1 and `?join=1` at 1366; Plans at 800; Account at 1000; and Talk at 900 and 390. They are saved in `docs/agents/reviews/shots/book-r7-*.jpg`.
- **Skeletons (N11):** I loaded each page cold into a same-origin iframe at the test size and polled it every 4ms while the skeleton was up. I measured the first block against the sheet's top, then measured the arrived page after stepping that frame's ticker.
- **The wall:** signed out, in headless Playwright 1.63 from `../09142026/node_modules/playwright`, with a fresh context and no stored session for each size and state. The scripts print no URLs or keys.
  - The real wall and the bad slug at 1366, 1920, 2560, 800, 900, 1000, 390 and 3840×2160, plus one zoomed-out window (1707×960 at deviceScaleFactor 0.8).
  - The wait state: I held the function's answer back for 4s and measured at 1366, 1920, 800 and 390.
  - A second pass checked whether the one-word last lines it found are visible or clipped.
  - Shots are in `shots/book-r7-wall-{real,none}-{1366,800,1000,390}.png`, `book-r7-wall-real-{800,1000}-foot.png` and `book-r7-wall-wait-{1366,1920,800,390}.png`.
- **The front door:** headless, at 800, 900, 1000, 1100, 1180, 1200, 1366 and 390, for rule 1 on round 6's finding 1.

## Round-6 findings, re-checked

| # | Round 6 | Now |
|---|---|---|
| 1 | Under the book, the controls overlapped "Read this page" at 761–868px; the door's two pills touched | **Fixed: no overlap anywhere.** At ≤900 "Read this page" now sits on the note's row and the controls take the next one. At 770, 800, 868 and 900 the boxes are clear, at the front cover and open ("Turn page"). At 1000 the three-across row is back, with a 60px gap (open the book ends at 721, read starts at 781). On the door, the pills are 16px apart at every tablet width I tried, and they stack at 390. The stacked row brings a new fault (finding 2). |
| 2 | Monthly stretched to 733×440 at 761–900, with "—" rows | **Fixed.** At 800 the card is 733×168, at 900 it is 827×168. Its head is on the left and its four rows sit in two columns on the right (`book-r7-plans-800-monthly.jpg`). No "—" row is shown at 800. The empty grid rows under it are finding 4. |
| 3 | "Keep someone else’s / story" on Account at 800 | **Fixed.** It now reads "Keep someone / else’s story". The line-41 selector includes `strong, a, dt, dd, h2, h3`. |
| 4 | The wall's loading mark sat on its own hairlines | **Fixed.** The heart now draws in the middle of the first leaf outline. At 1366 that is a 56px mark at 569/615 inside a leaf at 368/433, 458×420. It crosses no line at 1366, 1920, 800 or 390 (`book-r7-wall-wait-1366.png`). |
| N11 | Shell pages dropped 39px on arrival; the Book's phone rail was 124px high | **Fixed.** The running head now stands over every skeleton (39px, 38 on a phone). Measured from the sheet's top, skeleton to arrived: <br>• Book at 1366: spread block 61 → 61 (883×441.5 both), rail 61 → 61. <br>• Book at 390: block 54 → 54, rail 518.7 → 518.7. <br>• Account at 1920: bookplate 81 → 81 (300×371.7 both). <br>• Talk: 81 → 78.5 at 1366 and 81 → 77.7 at 1920. The card is tipped, so its box rises about 3px. |
| N12 | People’s own words not typeset; the load-error line said things twice | **Fixed in code and on screen.** <br>• Wall.tsx uses `smarten()` on the title, the alt text, the intro and every paragraph. bookPages.ts uses it on the titles and the body. <br>• The data errors read "We couldn’t load the account: …", and the pages pass `loadError` alone to `Problem`. <br>• In scope, the only `x'y` matches left are in comments. <br>• On the rendered wall at all nine windows, and on every signed-in page at every size, no straight apostrophe shows. |
| N13 | The wall mark sat on a hairline; the phone chapter head was 16px tall | **Fixed** (see 4). At ≤760 `.wall-sk-head.tall` is 32px. |
| N14 | No loading state spoke to a screen reader | **Fixed.** LoadingMark renders `<span class="sr-only" role="status">Opening the book…</span>` beside the hidden drawing. The wall's wait frame carries it at all four sizes I held it. |

## Findings

1. **The pressed A-mark at the foot of the sheet sits under the last "Where to next" text, from 761 to 1100px and on a phone.**
   - **Where:** `astory.css:2779`. `.sheet-page::after` is 46×51 at `left: gutter + 8px; bottom: 10px`, which on a desktop is the empty band beside the folio. At `max-width: 1100px` (astory.css:2929) it grows to 160×176 without moving. Below 760 (astory.css:2935) it becomes 120×132 with `right: var(--gutter); bottom: 112px`, but `left` is never reset to `auto`, so `right` is ignored and the mark stays on the left. The rule's own comment says it "never sits under a control".
   - **Sizes and evidence:** the mark box against the text and links it covers.
     - **Book:** at 1000 and 1100, "Write the next page / One question, or anything you remember." (`book-r7-book-1000-wn.jpg`, bottom left). At 900 and 800, "Ask the family in / What they add prints under their own names."
     - **Talk:** at 1000, "Back to today". At 900 and 800, "Open the book / Every page, as it will print." (`book-r7-talk-900-mark.jpg`: the A runs behind both lines, and the row's bottom hairline cuts through it). At 390 the apex reaches the last row's text and its hairline (`book-r7-talk-390-mark.jpg`).
     - **Plans:** at 1100 and 1000, "See the book / Every page as it will print…". At 900 and 800, "Back to today / Today’s question is waiting." At 390, the same row.
     - **The wall:** at 1000, "Where to next" and "Keep your own story / Every life holds a story worth keeping.". At 900 and 800, "How A Story works / One small question a day…" (`book-r7-wall-real-800-foot.png`). At 390, the same row.
     - **Account** is clear at 1000, 900 and 800, because its body column starts right of the mark. At 390 the mark meets "Today’s question is waiting."
     - At 1366, 1920, 2560, 3840 and 1707×960 the mark is clear on every page.
   - **Rules:** 17a (no ornament that gets in the way of reading), 19, 10, and the checklist ("no clipped or overlapping text"). Rule 1: the rule is in the shared sheet, so every page that ends on Where to next at these widths has it.
   - **Fix:** keep the mark in the foot band at every width. Either drop the two enlargements so it stays 46×51 beside the folio, or reserve its room with `padding-bottom` on the sheet equal to its height. In the phone rule, set `left: auto` if the right-hand placement is wanted.

2. **The stacked row under the book now runs off the bottom of tall tablet windows.**
   - **Where:** book-account.css:131. The single page is `min(100%, 100vh / zoom − var(--bk-chrome), 640px)`, with `--bk-chrome: 316px` (line 101). Round 6's fix at line 228 stacks `.bk-under.bk-row` into three rows, 116px instead of 56, but the budget was not raised. Between 761 and about 870 the hero title also wraps to two lines (92px), so the page starts at 281 instead of 235.
   - **Sizes and evidence:** single-page mode (aspect under 9/10), 761–900 wide.

     | Window | Page | "Read this page" | "Open the book" / "Back" | Dashes | Fold |
     |---|---|---|---|---|---|
     | 800×1024 | 281–921 | 933–977 | 989–1033 | 1045 | 1024 |
     | 770×1024 | 281–921 | 933–977 | 989–1033 (also "Turn page" when open) | 1045 | 1024 |
     | 800×900 | 281–865 | 877–921 | 933–977 | 989 | 900 |
     | 900×1024 | 235–875 | 887–931 | 943–987 | 999 | 1024 (fits) |

     In round 6 the 56px row ended at about 977 at 800×1024, inside the window. The screenshots are `book-r7-book-800-fold.jpg`, where the buttons are cut by the fold, and `book-r7-book-800x900-fold.jpg`, where only the top of "Read this page" shows.
   - **Rules:** 11 (the book scales up and down to fit), 12, and the checklist (main content within one screen).
   - **Fix:** in the `max-width: 900px` block, set `.book-page { --bk-chrome: 376px; }` for the 60px taller row. Go to about 422px where the title wraps (≤870), or measure the hero instead of guessing. The skeleton reads the same variable, so it follows.

3. **The "Where to next" lines end on a single word between 1000 and 1100px.**
   - **Where:** `components/book/WhereNext.tsx`, `.wn-words span` (book-account.css:65). At these widths the three columns are 230px wide on the Book and 143px on Account. The span has the inherited `text-wrap: pretty`, and Chrome still leaves the last word alone.
   - **Sizes and evidence:**
     - **Book at 1000:** "One question, or anything you / remember." and "Every memory by year, with the / photographs." (`book-r7-book-1000-wn.jpg`). At 1100, "…with the / photographs."
     - **Account at 1000:** "Today’s question is / waiting." (`book-r7-account-1000-wn.jpg`).
     - None at 1366, 1920, 2560 or 390. At 900 and below the rows stack to full width.
   - **Rules:** 1 (round 3's "for" ruling, applied everywhere; WhereNext is used on eleven pages) and 17a.
   - **Fix:** `.wn-words span { text-wrap: balance; }`. For two-line lines this gives "One question, or / anything you remember."

4. **Plans' table keeps its seven desktop rows at tablet and phone widths, so empty rows add blank paper before "Where to next".**
   - **Where:** book-account.css:403 sets `grid-template-rows: auto repeat(5, auto) auto`. The ≤1100 block (line 459) never resets it.
     - At 761–900 the cards fill three rows, and `gap: var(--s-4)` adds 16px for each of the four empty rows.
     - At ≤760 there are two empty rows.
   - **Sizes and evidence:** the computed rows at 800 are `462 440 168 0 0 0 0`. The table ends 64px below the Monthly card, so the gap to "Where to next" is 128px, twice the 64px margin used everywhere else (`book-r7-plans-800-monthly.jpg`). At 390 the dead space is 32px. At 901–1100 there is no row gap, so there is no dead space.
   - **Rules:** 9 (compact layouts) and DESIGN.md ("the gap between sections" is the margin, not phantom rows).
   - **Fix:** add `grid-template-rows: none;` to `.pl-table` in the `max-width: 1100px` block.

## What passed

- **No horizontal scroll** on any page at any size: the five standard sizes, 770, 868, 900, 1000 and 1100, signed in or out, and on the wall also at 3840 and 1707×960.
- **Small print and targets:**
  - No text under 12px outside the book object.
  - No control under 44 CSS px. At 2560, every nav item is 44.0 once divided by the zoom.
  - No overlapping controls, apart from rail rows passing under the fixed phone tab bar while scrolling, as they should.
- **Opacity:** nothing in view stays under 0.9. Plans' cards and the join form were still mid-rise at 2.5s on a cold load (0.18 and 0.88). They reached 1 on their own by about 5s, without any help from me (rule 25).
- **Book:**
  - At 1366 the spread is 883×442 and the controls end at 732.
  - At 1920 it is 1420×684, with the controls at 931–975.
  - At 2560 it is 1912×889 screen px, with the controls ending at 1267 of 1300.
  - At 390 the page is 346 square, and the controls end at 771 above the tab bar at 775.
  - At 900×1024 and 868×900 the reader fits.
- **Plans:**
  - One screen at 1920 and 2560 (document 1000 and 1300).
  - At 1366, Where to next starts at 710.
- **Account:**
  - The document is 3403–3411 at 1366, 2777 at 1920, 3604 at 2560 (in screen px, so 2772 CSS) and 5333 at 390.
  - No one-word last lines at any size except finding 3.
- **Talk:** one screen at 1920 and 2560. At 1366 the document is 895.
- **Start:**
  - Step 1 and `?join=1` are exactly one screen at 1366, 1920, 2560, 800, 900 and 1000.
  - The way titles line up at 575/575/575 (1920) and 748/748/748 (2560, screen px).
  - At 1366 the three ways are 129/125/129 tall in one column, and the sheet ends at 723.
  - The code field takes focus on `?join=1`.
  - At 390, step 1 scrolls (1194) and `?join=1` fits 844.
- **The wall:**
  - At every size the function answered 200, the RPC fallback was never called, all four photographs loaded, there were no page errors, and localStorage held 0 auth keys.
  - The bad slug answered 404 and shows "This story isn’t shared." in exactly one screen at all nine windows.
  - Where to next has three rows.
  - The one-word last lines the sweep found (at 1920, 1000 and 390) all sit inside closed leaves, below the clip and behind "Read the whole thing", so none is visible.

## Notes (not findings)

- **When a wall leaf is opened,** a member's own paragraph can end on one word, for example "…pursue higher / study." at 1920. `text-wrap: pretty` is already set, and this is the person's own text, so I leave it as a note.
- **Plans' Free column at 1000–1100** reads "One ten-minute / conversation". At 154px no wrapping can do better, so only the copy could change it.
- **Account** has two `h1`s, both "Account": the hero's and an `sr-only` one. Round 6's note about the bookplate's name being an `h1` no longer applies. A screen reader now hears "Account" twice.
- **The status line is born with its text.** Some screen readers announce a live region only when it changes, not when it is inserted already filled. If N14 has to be certain, mount an empty `role="status"` once in Shell and set its text while busy.
- **Talk's running head** crossfades "Talk" and "On the phone, for now" in the same spot. One screenshot at 390 caught both at once, mid-fade. It settles to one, so this is a note.

## Not verified

- **A zoomed-out Edge window on the signed-in pages:** the pane can't set browser zoom. The wall was checked at deviceScaleFactor 0.8 only, which does not change CSS layout.
- **The Book's empty state:** switching story is off limits.
- **Hover, focus-visible, active and reduced-motion states:** read in the CSS, not exercised.
- **Real-frame timing of the skeletons on signed-in pages:** the pane draws no frames while hidden, and the skeletons lasted 1.8–4.7s on this dev server.
- **Controls I did not press, by instruction:** Save, Change, Remove, Send, Order, Open it, Sign out, Choose, switching story, the printing-interest button, and "Name them" or "Delete my account…" on Account.

## Housekeeping

- I worked only in tab-130. I turned the book open once at 770, which is local state. I submitted nothing and opened no step 2 on Start.
- I kept five helper scripts in that tab's sessionStorage (`__r7*`) so they survived reloads. I removed them, reset the viewport to desktop and closed the tab.
- **Iframes:** the cold-load iframes were same-origin, at 0.01 opacity, and removed after each measurement.
- **A stray reload:** once, at 1366 on Account, the page reloaded while my script ran. That looked like a hot reload from another agent's save. I reloaded and measured again; the document is 3403 now and was 3411 before.
- **Playwright:** it ran headless in fresh contexts with no session. The wait-state run only delayed the function's response inside that browser, and nothing was written anywhere.
- **Not touched:** I did not sign out, did not read or touch `astory-app-auth`, and pressed none of the forbidden controls.
