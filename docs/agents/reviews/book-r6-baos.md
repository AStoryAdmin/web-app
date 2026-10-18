# Book, Plans, Account, Talk, Start and the Wall, round 6: Bao's Standard

**FAIL.** 4 findings, ranked worst first.

Both round-5 findings are fixed, and so are N8, N9 and N10 from the skills review. At the four sizes round 5 used, nothing else on these pages breaks the checklist. Round 5 said the set would pass once its two findings were fixed, and at those four sizes that holds.

This round adds an 800×1024 window, and three faults show there. The fourth is in the wall's new loading state:

1. **The Book's buttons overlap at tablet width.** Under the book, "Open the book" (or "Turn page") runs 15–46px into "Read this page", from 761px up to about 868px. The front door has the same row and the same fault: its two pills overlap by 2px at 800 and 1000.
2. **On Plans from 761 to 900px, the Monthly card is stretched across the full width.** It is 733px wide and 440px tall, its words reach only 291px across, and it keeps the "—" rows that the phone layout hides.
3. **One more single-word last line**, on Account at 800: "Keep someone else’s / story". It sits in a `strong`, which the round-5 `text-wrap` fix does not cover.
4. **The wall's loading mark is placed by the window, not by the page.** At 1366 it sits across the top hairline of the first leaf outline, and at 390 it sits across the third contents rule.

**How I checked.**
- **Signed-in pages:** my own pane tab (tab-120), at 1366×768, 1920×1000, 2560×1300 (html zoom 1.3), 800×1024 and 390×844. I reloaded at each size, moved between pages with the router's own history, stepped GSAP 400 ticks with `__st.update()`, and then ran one sweep per page:
  - scrollWidth against clientWidth, and the document height;
  - text under 12px outside the book object;
  - controls under 44px, in CSS px (screen ÷ zoom);
  - text in the viewport under 0.9 opacity, with every ancestor's opacity multiplied in;
  - one-word last lines, found by comparing the line boxes of the last two words. I tested the detector on a planted case first, and it catches them.
  - straight apostrophes in the app's own visible copy.
- **Screenshots:** the pane composited for this whole run. I saw every page at 1366, Book, Plans, Talk and Start at 1920, Start at 2560, and every page at 800 and 390. Values at 2560 are in CSS px unless I say screen.
- **The wall:** signed out, in headless Playwright 1.63 from `../09142026/node_modules/playwright`, with a fresh context and no stored session for each size and state. The script prints no URLs or keys.
  - Sizes: the five above, plus 3840×2160 (zoom 2.16) and three zoomed-out windows at deviceScaleFactor 0.8: 1707×960, 2400×1250 and 3200×1625.
  - For the loading state, I held the function's response back for 4 seconds, measured the skeleton, and measured again after arrival, at 1366, 1920 and 390.
  - Full-page shots are in `docs/agents/reviews/shots/book-r6-wall-{real,none}-{1366,1920,2560,800,390}.png`. Viewport shots of the wait state are in `book-r6-wall-wait-{1366,1920,390}.png`.
- **Skeletons:** a cold load in the pane never caught `account === undefined`. So, as the skills review did, I put the skeleton's exact markup in place of the live page under the real CSS, measured it, and removed it.
  - For the Book I cloned the live `.bkh` with `bkh-skel` and nbsp lines.
  - For Account I used the `acct-skel` markup from Account.tsx:797–827.

## Round-5 findings, re-checked

| # | Round 5 | Now |
|---|---|---|
| 1 | The short words-only leaf on the wall leaves 30% of itself blank | **Fixed.** `useFill` now sets a words-only leaf larger when all its words fit, up to 22px. For "Losing grandparents…", the blank paper under the words is now: 22px at 1920 (208 in round 5); 68 at 2560 (218); 23 at 2400×1250; 69 at 3200×1625; 42 at 3840 (set at 20px); 19 at 1707×960 (set at 19px). At 1366, 800 and 390 the leaf pairs with a clamped neighbour, and the blank is 1px. At its worst the gap is about 10% of the leaf, and it sits level with its neighbours' "Read the whole thing" row, so the row reads as finished (`book-r6-wall-real-2560.png`, chapter 2, row 1). Every other leaf ends within 1–18px of its floor, and the leaves that have a button really do hide text (115–1135px). |
| 2 | Four single-word last lines (wall, Plans, Account at 390) | **Fixed where named.** `.wall-words p` and `.pl-cell-value` use `text-wrap: pretty`, `.acct-plan b` uses `balance`, and line 41 of book-account.css now sets `pretty` across the six pages. The sweep finds no one-word last lines on the wall at any of its nine windows. On Plans, Account and Talk it finds none at 1366, 1920, 2560 or 390. At 1366 Plans now reads "A Classic Hardcover with / the pass". One new case shows at 800 (finding 3). |
| N8 | The Book's skeleton stood on a shorter cloth; Account's first skeleton row was a line | **Fixed.** The Book's skeleton cloth now matches the arrived cloth: 202 = 202 at 1366, 1920 and 2560, and 297 = 297 at 390. At desktop sizes the rail rows land within 1px, at 45px pitch. On Account at 1920 the skeleton's bookplate is 389/157, 300×372, the same as the real one, and the first ruled section starts at 561 = 561. |
| N9 | The wall and Start loaded on bare cloth | **Fixed.** The wall now waits on its own frame. At 1920, the cloth (302), the portrait ring (61/97, 136px), the contents column (61/324) and the main column (385/324) sit exactly where they sit after arrival. At 390 the cloth is 406 and the ring 96px, both the same as after arrival. Start's skeleton draws the head, the sheet and the three way frames under the mark (Start.tsx:182–222). I read that in code; a cold load never caught it. The mark's placement on the wall is finding 4. |
| N10 | Two apostrophes in one voice | **Fixed.** In scope (the six pages, `components/book/*` and Shell), the only `x'y` matches left are inside comments. In the rendered pages, at all five sizes, no straight apostrophe appears in the app's own copy. The members' own memory text keeps theirs, as it should. |

## Findings

1. **Under the book, "Open the book" / "Turn page" overlaps "Read this page" at tablet widths.**
   - Where: `.bk-under.bk-row` (book-account.css:140). The row is `minmax(0,1fr) auto minmax(0,1fr)`. The read pill is 171px wide, but its side column narrows to about 120px. With `justify-self: end`, the pill spills left over the controls.
   - Sizes: from 761px to about 868px.

     | Window | State | "Open the book" / "Turn page" | "Read this page" | Overlap |
     |---|---|---|---|---|
     | 770 | front cover | x 435–605 | x 559–730 | 46px |
     | 800 | front cover | 450–620 | 588–759 | 32px |
     | 800 | open, "Turn page" | 467–603 | 588–759 | 15px |
     | 1000 | front cover | ends 720 | starts 782 | clear by 62px |

     Below 761 the phone layout puts the read pill on its own row, and it is clear.
   - **Rule 1, the front door:** `.door .bk-under` (signed-out.css:560) uses the same three-column row. Headless at 800, "Open the book" spans 389–577 and "Read this page" 575–760. At 1000 they span 489–677 and 675–860. The two pills touch with a 2px overlap, with no gap between them, in a crop of the shot at 800.
   - Rules: checklist (no clipped or overlapping text; every page at every size), 12 (nothing collapses), 26.
   - Fix: on the Book page, apply the phone's arrangement (`"cap read" / "ctrl ctrl"`) up to `max-width: 900px`, not 760. On the door, stack the read pill under the controls up to 1100px, or keep the side columns at least as wide as the pill (`minmax(max-content, 1fr)`).

2. **On Plans from 761 to 900px, the fifth plan sits alone in a full-width card that is mostly empty paper.**
   - Where: book-account.css:460–462. Below 900 the table becomes two columns, so `.pl-table > .pl-col:last-child { grid-column: 1 / -1 }` stretches Monthly across both. Its head and five label/value rows still stack in one narrow column.
   - Size: 800×1024. The card is 733px wide and 440px tall, and its longest value reaches 291px from its left edge, so about 60% of the card is blank. It also prints "Storytellers —", where the 390 layout drops a row with nothing in it. The other 2-up cards show their "—" rows too.
   - Rules: 9 (no card huge for a small amount of information), 10 (a lone card in a row), 1 (the wall's lone last leaf already sets head left and words right, at 1fr / 2fr).
   - Fix: in the ≤900px rule, lay the last card out as the wall's lone leaf. Put the head in a left column (`minmax(0,1fr)`) and the rows in two columns on the right (`minmax(0,2fr)`), which brings it to about 220px tall. Hide "—" rows at this width, as the phone does.

3. **One more single-word last line: "Keep someone else’s / story" on Account at 800.**
   - Where: Account.tsx `.acct-way strong`, the title of the first "add a story" link under Whose stories. The element is 221px wide. The `text-wrap: pretty` rule at book-account.css:41 lists `p, li, small, span, b, label, blockquote` but not `strong`. Other elements that set their own text are also missing: headings, `a`, `dt` and `dd`.
   - Size: 800×1024. At 1366, 1920, 2560 and 390 no one-word last line shows.
   - Rules: 1 (round 3's "for" ruling, applied everywhere) and 17a.
   - Fix: add `strong, a, dt, dd, h2, h3` to the line-41 selector, or set `text-wrap: balance` on `.acct-way strong`.

4. **The wall's loading mark lands on its own hairlines.**
   - Where: book-account.css:893 `.wall-sk-mark { position: absolute; left: 0; right: 0; top: 0 }` inside `.wall-page`. The mark is centred on the window's width at the top of the page, not on the skeleton it draws over.
   - Sizes and evidence:
     - **1366:** the heart straddles the top border of the first leaf outline (`book-r6-wall-wait-1366.png`, at x 650–700, y 418–458).
     - **390:** it sits across the third ruled contents row (`book-r6-wall-wait-390.png`, y 530–570).
     - **1920:** it lands in the top-left corner of the middle leaf outline (`book-r6-wall-wait-1920.png`).
   - Rules: 42 (the mark draws on the sheet over the skeleton, not through it), and the checklist's "no overlapping".
   - Fix: make `.wall-skel .wall-main` `position: relative` and put the mark there with `inset: 0; display: grid; place-items: center`, as `.start-sk-mark` does. It will then sit in the middle of the leaf outlines at every size, on clear paper.

## What passed

- **No horizontal scroll** on any page at any of the five sizes, signed in or out, nor on the wall at 3840 and the three zoomed-out windows.
- **Small print:** no text under 12px outside the book object, and no control under 44px CSS anywhere. Account's two 1×1 inputs are the export radios inside 570×52 rows.
- **Opacity:** nothing in view under 0.9 once motion settles. The disabled "My own story" specimen is aria-hidden, and its reason sits beside it in words.
- **Book:**
  - The reader fits one screen at 1366 (spread 883×442, controls end at 732), 1920 (1420×684), 2560 and 390 (346 square, controls end at 771, with the tab bar at 775).
  - The rail rows run at a 45px pitch.
  - Editions and Where to next (three rows) are as in round 5.
- **Plans:**
  - Exactly one screen at 1920 and 2560 (document 1000 CSS px). At 1366, Where to next starts at 710.
  - At 390 there is one card per plan, and empty rows are dropped.
  - At 1366 "Monthly" and "$19.99" sit 10px apart. That is tight but clean, so it is a note, not a finding.
- **Account:**
  - The page is 3411 CSS px tall at 1366, 2777 at 1920, 2772 at 2560 and 5342 at 390.
  - The bookplate and the paired fields line up as in round 5.
  - "Full access, through an access code." no longer orphans at 390.
- **Talk:** one screen at 1920 and 2560. At 1366 Where to next starts at 688. The question sits on its 44px ruled pitch at 1366, as two lines.
- **Start:**
  - Step 1, both step-2 views and `?join=1` are each exactly one screen at 1366, 1920, 2560 and 800.
  - The last element sits 16–40px clear of the sheet's foil frame.
  - Titles line up at 575/575/575 and the "who writes" lines at 552/552/552, at 1920 and 2560.
  - On `?join=1` the code field takes focus.
  - At 390, step 1 scrolls (1196) as a phone page should, and `?join=1` fits 844.
- **The wall:**
  - At every size the function answered 200, the RPC fallback was never called, all four photographs loaded, there were no page errors, and localStorage held 0 auth keys.
  - The bad slug answered 404 and shows the not-shared sheet in exactly one screen at all nine windows, with Bond behind its top edge.
  - Where to next has three rows.
  - The lone last leaf ("Ending the chat") spans the row with its words beside the title.

## Notes (not findings)

- On Account the bookplate's "Bao Vo." is a second `h1` after the hero's "Account". Make the plate's name a `p` or an `h2`.
- The Book's skeleton block is a strict 2:1 (1368 wide), so it is 52px narrower than the real spread at 1920 and 103px narrower at 2560. The cloth, the rail and the top edge all hold, so nothing jumps. The block could take the spread's own aspect.
- On a cold load in a pane that draws no frames, `/start?join=1` showed its words at opacity 0 for about 3 seconds, then showed them without any help from me, since `__gsap` was not on that page to step. That is consistent with rule 25 (nothing stays hidden), but it is slow under a stalled frame clock.

## Not verified

- **A zoomed-out Edge window on the signed-in pages:** the pane can't set browser zoom. Only the wall was checked zoomed out (headless, deviceScaleFactor 0.8).
- **Start's skeleton and the Book's and Account's loading in a real cold load:** I judged Book and Account on a replica under the real CSS, and Start in code.
- **The Book's empty state:** switching story is off limits.
- **Hover, focus-visible, active and reduced-motion states:** read in the CSS, not exercised.
- **The 761–900px range of the wall and Start:** only 800 was measured. Plans and the Book were also measured at 770, 1000 and 1100.
- **Controls I did not press, by instruction:** Save, Change, Remove, Send, Order, Open it, Sign out, Choose, Switch to…, the printing interest button and Begin their story.

## Housekeeping

- I worked only in tab-120. I turned the book's pages once at 800, which is local state. On Start I opened step 2 for two ways and went back with "← The three ways". I submitted nothing.
- I kept five helper scripts in that tab's sessionStorage (`__r6*`) so they survived reloads. I removed them, reset the viewport to desktop and closed the tab.
- The replica skeletons lived in the page for under a second each and were removed.
- Midway, another agent's save left Vite serving an empty transform of `src/components/archive/develop.ts`, so every page mounted blank. The file on disk was whole. I ran `touch` on it, which changed its mtime only (md5 the same before and after), so Vite re-read it. I changed no content.
- Playwright ran headless in fresh contexts with no session. The loading-state run only delayed the function's response inside that browser, and nothing was written anywhere.
- I did not sign out, did not read or touch `astory-app-auth`, and pressed none of the forbidden controls.
