# Book, Plans, Account, Talk, Start and the Wall, round 4: Bao's Standard

**FAIL.** 7 findings, ranked worst first. Eight of the nine round-3 findings are fixed, and finding 3 is mostly fixed. All three rule-1 items in Shell.tsx are fixed too.

The two Bond placements that failed in round 3 now pass:
- On the not-shared wall he looks over the sheet's edge, and the paper hides his cut.
- In the Book's empty state he sleeps beside the closed book on the desk line, clear of the lettering. On a phone the desk no longer collapses.

What still fails:
- On the wall, "Read the whole thing" sits under a leaf whose whole text is already showing, above 176–242px of blank paper.
- On a large window, the Book's empty state sits in a narrow centred strip.
- Two small Start faults appear only at 1366×768: step 2's last element touches the foil frame, and step 1 overflows by one pixel.
- Three smaller faults: the empty wall's Where to next has only two rows, the Editions name column is squeezed on a phone, and Plans shows a lone caption row for an access-code account.

**How I checked.** I used my own browser-pane tab (tab-83) and reloaded it at every size: 1366×768, 1920×1000, 2560×1300 (where the app sets html zoom 1.3) and 390×844. Before measuring, I stepped GSAP 300–600 ticks and called `__st.update()`. I measured with getBoundingClientRect, scrollWidth/scrollHeight, computed styles and text-range line boxes. I swept each page in script for:
- text under 12px outside the book object;
- controls under 44px (×zoom);
- opacity under 0.9;
- clipped text.

The pane composited at 1366 and 390 for most of the run. It refused screenshots at 2560 (pane hidden) and later returned cropped frames, so the 1920 and 2560 judgements on signed-in pages rest on measurements.

Pages:
- `/book`: the cover, Childhood (spread 3 of 12), the Editions and the end.
- `/plans`, `/account` and `/talk`.
- `/start?another=1`: step 1, and step 2 for both "Someone in my family" and "Someone already on A Story", at 1366, 2560 and 390. Nothing was submitted.
- `/start?join=1`.
- The wall, `/p/RNm1vTr2Gyqu` and `/p/zz-not-a-real-slug`, signed out. I used headless Playwright 1.63 from `../09142026/node_modules/playwright`, with a fresh context per size and per state and no stored session. The script prints no URLs and no keys.

**The Book's empty state, judged on the real component this round.** In my own tab I built an empty story with the real `buildBook`. I rendered the real `BookObject` into `.book-page`, using the dev server's own React instance, under the real classes and CSS. The words are Book.tsx's markup, and the swatches are an inert clone. So the geometry is real, and the cover is the real cover. Only the data is mocked. Round 3 used a hand-built replica.

## Round-3 findings, re-checked

| # | Round 3 | Now |
|---|---|---|
| 1 | Book empty state collapses to 0×0 on a phone | **Fixed.** At 390 the desk is 304×213, the book 213 square and Bond 104×82 beside it. The words start at y=600, and scrollWidth is 390. Seen in a screenshot. |
| 2 | Not-shared wall: Bond's hard cut floats on the paper | **Fixed.** He now sits above the sheet in `.wall-none-wrap` (96px top padding, dog at top 0). His lower 29px (38px at 2560) lies under the sheet, which paints over him, so the cut is hidden. Screenshots `shots/book-r4-wall-none-{1366,390}.png` and `book-r4-wall-none-bond-*.png` show him looking over the edge at every size. |
| 3 | Three-column wall rows half blank | **Mostly fixed.** Every print is now 3:2, so titles line up across a row: 1261/1261 and 2612/2612 at 1366, 1259/1259 at 1920, 1649/1649 at 2560. Words-only leaves now open to 15 lines in a chapter with photographs, so the blank fell from about 400px to 176px at 1920 and 242px at 2560. What remains is finding 1. |
| 4 | Start's three cards don't line up their tops | **Fixed.** The "who writes" lines are at 576/576/576 at 1920 and 748/748/748 at 2560. The titles are level too (599, and 779). |
| 5 | Empty wall repeats "Keep your own story" and says "0 memories" | **Fixed.** No count line, and Where to next drops the duplicate row. A new fault is finding 4. |
| 6 | Talk's Where to next off the pair's edges | **Fixed.** 233–1673 against the pair's 233–1674 at 1920, and 336–2208 against 336–2209 at 2560. |
| 7 | Bond covers the cover's lettering in the Book empty state | **Fixed.** He lies beside the book on the desk line and overlaps the fore-edge by 8px at its lower right. The script line and the name at the lower left are clear. Seen at 1366 and 390. |
| 8 | Start step-2 fleuron 4px above the first label | **Fixed.** 20px at 1366 ("Their first name": fleuron 182–194, label 214; "Their family code": 255–267 against 287) and 26px at 2560. The bottom edge now has the same fault (finding 3). |
| 9 | "for" alone in "Yours the moment it is paid for" | **Fixed.** `text-wrap: balance` sets "Yours the moment / it is paid for" at 1366, 1920 and 2560. |
| Rule 1 | Bar brand link 28px | **Fixed.** 44px (57 at 2560) on every Shell page I opened. |
| Rule 1 | Teller seal shows one initial | **Fixed.** "BV" in the bar, matching the avatar and Account. |
| Rule 1 | Watermark "A" behind the third Where to next arrow | **Fixed** on Book, Plans, Account and the wall. It now sits at the bottom left, clear of every control. |

## Bond, judged where these pages use him (placement and craft only; his painterly style is the founder's ruling)

- **Book, empty:** `sleep-paper` asleep against the book's fore-edge, on the desk line, at 34% of the desk (143px at 1366, 104px at 390). His pose suits a book waiting to be written, and he covers no words. **Passes.**
- **Wall, not shared:** `curious-paper` looking over the top edge of the sheet. The paper hides the cut, and his chin rests on the edge. **Passes** at all four sizes.
- **Wall, empty** (mocked response, headless): `sleep-paper` at 180px (234 at 2560) above the headline. **Passes**, as in round 3.

## Findings

1. **On the wall, "Read the whole thing" sits under a leaf whose whole text is already showing, and pressing it reveals nothing. Below it are 176–242px of blank leaf.**
   - Where: Wall.tsx `Leaf`. `const long = m.body.length > 420 || paras.length > 3` decides the button by character count. book-account.css §6 then lets a words-only leaf in a chapter with photographs open to 15 lines.
   - Sizes: 1366, 1920 and 2560 (the 15-line clamp applies from 761px).
   - Evidence, measured in headless Chromium:
     - "Losing grandparents and preserving…": `.wall-words.closed` is 346px tall with scrollHeight 346 (12 lines, one paragraph), so nothing is clipped, yet the button is shown. The leaf has 111px (1366), 176px (1920) and 242px (2560) of empty paper under the button. See `shots/book-r4-wall-real-1920.png`, row 1, right.
     - "Building Better Play Studios…": clamped at 15 lines (432 of 1222px), while 89px (1920) and 129px (2560) of the leaf stay blank under it, room for 3–4 more lines.
     - The chapter-of-one "Childhood…" leaf: a 6-line clamp hides 41px of 277 (one short line) behind the button, in a 955px-wide leaf with room to spare.
   - Rules: 9 (no card large for little information), 19 (no needless control), the checklist's states line and the craft rule on execution.
   - Fix:
     - Show the button only when the words actually overflow: after layout, test `scrollHeight > clientHeight + 1` and drop the `.closed` class when they fit.
     - Let a words-only leaf's clamp fill its row (compute the line count from the row height, or make `.wall-words` a flex-grow block and clamp by height).

2. **On a large window, the Book's empty state sits in a narrow centred strip, and its book is no bigger at 1920 than at 1366.**
   - Where: `.bk-empty { grid-template-columns: minmax(240px, 420px) minmax(0, 560px) }` with `.bk-empty-object { width: 70% }` (book-account.css §1.5).
   - Sizes: 1920 and 2560.
   - Evidence:
     - At 1920 the section is 1768px wide and its content spans x 423–1467 (1044px, 59%). The book is 294×294, exactly its 1366 size, and the section is 372px tall in a 1000px window.
     - At 2560 the content spans 585–1943 of a 2364px section (57%), and the book is 382px.
     - The populated Book at the same sizes fills the sheet: the stage is 1420px wide at 1920.
   - Rule: 8 (use the screen; nothing in a narrow strip with empty margins).
   - Fix: from 1600px, widen the two tracks (for example `minmax(0, 640px) minmax(0, 620px)`), so the book reaches about 440px at 1920 and the composition fills about three quarters of the sheet.

3. **On Start's step 2 at 1366×768, the last element touches the sheet's foil frame.**
   - Where: `.start-sheet` under `@media (min-width: 861px) and (max-height: 800px)`. Its padding-bottom is 16px, but its `::before` foil frame sits 14px inside the edge.
   - Size: 1366×768. Both step-2 views, and `/start?join=1`.
   - Evidence:
     - "Someone in my family": "Begin their story" ends at y=670.0, and the frame hairline is at 671.6.
     - "Someone already on A Story" and `?join=1`: the last line box of `.start-recap-body` ends at 597.0, and the hairline is at 598.5.
     - The sheet ends at 685 and 612 respectively, so the window has room.
   - Rules: 15a (an ornament placed with restraint) and the craft rule on execution.
   - Fix: under the short-window rule, give `.start-sheet.step-2` `padding-bottom: var(--s-8)`, as at other sizes. At 2560 and 390 the clearance is already 18px or more.

4. **The empty wall's Where to next has two rows, not three.**
   - Where: Wall.tsx `wall-next`. The fix for round-3 finding 5 drops "Keep your own story" when the wall is empty and puts nothing in its place.
   - Sizes: all four (headless, mocked empty story). Rows: "Turn the pages of a sample" and "How A Story works". See `shots/book-r4-wall-empty-1920.png`.
   - Rules: 38 (three ruled rows) and 10 (a row of two in a three-track rule).
   - Fix: add an honest third destination that isn't the button's action, for example "What a family book costs" linking to the marketing site's pricing.

5. **Start step 1 is 1.14px taller than a 1366×768 window, so Edge shows a scrollbar and the page scrolls one pixel.**
   - Where: `.start` at `(max-height: 800px)`. The padding is 12px on top and 24px at the bottom, and the sheet is 629px.
   - Size: 1366×768. scrollHeight is 769 (body 769.14) and clientWidth 1351. In round 3 this measured exactly 768.
   - Same view: the h1 box ends at 251.5 and the first card starts at 263.5. That 12px gap between the heading block and the cards equals the 12px gap between cards, which breaks the craft rule that the gap between sections is larger than any gap inside one.
   - Rules: 11 (one screen) and the craft rule on spacing.
   - Fix: in the short-window rule, take the bottom padding of `.start` to `var(--s-4)`, and trim each `.start-way` to 8px vertical padding. That frees about 14px, enough to open the heading-to-cards gap to 16–20px and still fit 768.

6. **On a phone, the Editions list squeezes "Digital Edition" into a 133px column, so its name breaks onto two lines. Every other row gets 191px.**
   - Where: `.ed-row` at ≤760px (`grid-template-columns: minmax(0, 1fr) auto`). The one-line `.ed-price small`, "Yours the moment it is paid for", takes 201px of the `auto` track.
   - Size: 390. The h3 is 53px (two lines) against 26px on the other rows. Its description runs three or four words a line, and the left edges of the descriptions no longer share a width.
   - Rules: 10 (columns align) and the craft rule on headlines.
   - Fix: at ≤760px give `.ed-price small` `max-width: 16ch` (it balances to two lines on the right), or move the note under the name, full width.

7. **On Plans for an access-code account, the last row holds only "Where every account starts" under Free, with four empty cells beside it.**
   - Where: Plans.tsx `.pl-act`. When `current === "complimentary"` the Choose cells render `null`, and only Free's `.pl-quiet` caption remains.
   - Sizes: 1366, 1920 and 2560 (at 1366 it sits alone at y≈680, after the table's last rule). At 390 it closes the Free card, where it reads fine.
   - Rules: 10 (no lone element on a row) and 19 (no scattered captions). Free already says "no card, no clock" in its head.
   - Fix: when the account is on an access code, don't render the act row at all on desktop.

## What passed

- **Scrolling and type:**
  - No horizontal scroll on any page at any size, signed in or signed out (scrollWidth equals clientWidth everywhere).
  - No text under 12px outside the book object.
  - No control under 44px. The only hits were 1×1 visually hidden toggle inputs on Account and sr-only spans.
  - Nothing left below 0.9 opacity after stepping GSAP. The Book's running head crossfades "Editions" in and settles at opacity 0 or 1.
- **Book:**
  - The reader fits one screen: the stage is 883×441 at 1366, with controls ending at 744 of 768. It is 1420 wide at the cover at 1920 (ends 987 of 1000), 1912 at 2560 (ends 1283 of 1300) and 346 square at 390 (ends 771 of 844).
  - The contents rail jumps to "Spread 3 of 12" for Childhood.
  - Where to next has three rows.
- **Plans:**
  - Fits a laptop: the table runs to the book row on the first screen at 1366. At 1920 and 2560 the page is exactly one screen.
  - Cells are 16px, labels 13px, plan names 26px and prices 34px.
  - At 390 it becomes one card per plan.
- **Account:**
  - The pairs hold from 1560px (wall/export, plan/privacy, trusted/delete, each pair on one top line).
  - scrollHeight is 2777 at 1920 and 3604 at 2560 (the round-3 figures were 2769 and 3595).
  - On a phone the index is a jump menu. The ex libris plate shows "BV".
- **Talk:**
  - One screen at 1920 and 2560.
  - The question is in a 36/44 cut with its rules on the baselines (33.34px in the 44px pitch).
  - At 390 the card comes first, and Where to next is three rows.
- **Start:**
  - Step 1 at 1920 and 2560 and both step-2 views fit one screen.
  - The name field and the code field take focus.
  - "Who writes" is on every card (rule 29), and the taken way is disabled with its reason.
- **The wall:**
  - Works signed out at every size, with 0 auth keys in localStorage. The function answered 200 twice per load (StrictMode in dev). All four photograph requests returned 200, and the RPC fallback was never called.
  - The bad slug got 404 and showed the not-shared page in one screen at every size.
  - Leaf tops line up in every row. A last leaf alone takes the row, with title left and words right.
  - The brand link is 44px (57 at 2560).

## Not verified

- **The Book's empty state** with real data: switching story is off limits. It was judged on the real BookObject with a mocked empty story (see "How I checked").
- **The wall's empty state:** only with a mocked function response in headless Chromium.
- **Signed-in pages at 1920 and 2560:** the pane would not composite at 2560 and returned cropped frames later, so these are judged on measurements. The signed-out wall was seen in full-page headless screenshots at all four sizes.
- **Reduced motion:** code only.
- **Hover, focus-visible and active states:** read in the CSS, not seen.
- **A zoomed-out Edge window:** only the app's own 1.3 zoom at 2560 was observed.
- **Controls not pressed, by instruction:** Save, Change, Remove, Send, Order, Open it, Sign out, Choose, Switch to…, the printing interest button, the cover colours, Print at home and Begin their story.

## Housekeeping

I worked only in tab-83. I reset its viewport to desktop, cleared the helper scripts I had put in its sessionStorage, and closed it. The empty-book render lived only in that tab's page and went with it.
- On `/book` I used the contents rail, which is read only.
- On `/start` I opened step 2 for two ways, used "← The three ways", and submitted nothing.
- Viewing `/plans` and `/talk` sends their view events.

Playwright ran headless in fresh contexts with no session. The empty-wall run only replaced the function's response inside that browser, and nothing was written anywhere. Evidence screenshots are in `docs/agents/reviews/shots/book-r4-wall-*.png`.

I did not sign out, did not read or touch `astory-app-auth`, and pressed none of the forbidden controls.
