# Book, Plans, Account, Talk, Start and the Wall, round 11: Bao's Standard

**FAIL.** 7 findings.

What round 11 set out to fix holds:
- Round 10's Account name pair, and the invite sheet's pair.
- N30 for the free plan and the private wall.
- N31 from 761 to 1599px.
- The wall's arrival and the writer's book now run in layout effects.

Finding 1 is a regression from e3c7a42. Person's loading hero now holds two subline lines on a phone, but every person in the founder's family has one. So on a phone the sheet now jumps 23px on every cold load of a person, where round 10 measured 0. The fresh pass also found six older faults, which no earlier round measured:
- the wall's arrival: the paper flashes away and rises a second time;
- the wall's lone family note;
- a scrollbar that appears for under a second on Talk and Plans at 1600px and wider;
- Account's password section at 320–374px;
- Archive's figures on narrow phones;
- Talk's outline from 1600px.

## How I checked

- **Read first:**
  - BAOS-STANDARD.md and DESIGN.md's craft rules.
  - `book-r10-baos.md` and `book-r10-skills.md`.
  - The diffs of b69768c (astory.css) and e3c7a42: Archive.tsx, Home.tsx, Person.tsx, Wall.tsx, Write.tsx and book-account.css.
- **Signed-in pages, in my own pane tab (tab-191):**
  - The tab sat on `/book/closed-640.webp`. Each page was cold-loaded into a same-origin iframe of the test size, at 0.01 opacity.
  - A 4ms poll stepped the frame's GSAP ticker (`lagSmoothing(0)`). It recorded:
    - the cloth's height and the sheet's offset top at the **first** skeleton sample and after arrival (round 10's harness kept only the last skeleton sample, which can already hold the arrived words);
    - the sheet's opacity, for dips;
    - `documentElement.clientWidth` over time, for scrollbars.
  - A MutationObserver read the opacity of each sheet, `[data-rise]` item and `.w-book` as it was inserted.
- **Variants, in my own frames only:** in an arrived frame I swapped in each other state's real markup, both the held version and the arrived one, and measured the cloth (±2px):
  - Home's free-plan note;
  - Archive's private wall line and its three kinds of figure;
  - Person's one-, two- and three-part sublines;
  - the invite sheet's `.two` pair, built from Account's own Field markup inside a `.sheetbox.invite-sheet`.
- **The sweep:** after arrival, a scroll through the page, 300 GSAP steps, `__st.update()` and every animation finished, I checked:
  - `documentElement` and `body` scrollWidth, and each element's right edge;
  - text under 12px outside the book;
  - controls under 44px, and overlapping controls;
  - text in view under 0.9 opacity;
  - straight quotes;
  - clipped text;
  - images that hadn't loaded;
  - the Where to next rows.
- **Pages and sizes:**
  - **Swept:** Book, Plans, Account, Talk, `/start?another=1` and `?another=1&join=1`, Home, Archive, Person (5aa5), a memory page (5963) and /write, at 1366×768, 1920×1000, 2560×1300 (zoom 1.3), 800×1024 and 390×844.
  - **Cold loads (cloth, sheet top, dips):** Home, Archive, Person (all six people, and three sample-family people), the memory page and /write at 1366, 1920, 2560, 800 and 390.
  - **Edge widths:** 320, 340, 344, 360, 375 and 414 where a finding needed them.
- **The wall:** headless Playwright from `../09142026/node_modules/playwright`, in fresh signed-out contexts.
  - The real wall at 1366, 1920, 2560, 800, 390, 375, 3840×2160, and 1707×960 at deviceScaleFactor 0.8. The bad slug at five sizes.
  - The wait state (the function held back 4s) at 1366, 390 and 1920.
  - An init-script observer on 4 cold loads, and a requestAnimationFrame trace of the sheet's opacity and y.

## Round 10's finding, re-checked

| Item | Now |
|---|---|
| Account's First name and Last name ran past their column at 761–837 and 1101–1233 | **Fixed** (b69768c, `repeat(2, minmax(0, 1fr))`). The Last name field ends exactly on the column's right edge at every width I tried, and `body.scrollWidth` equals the window: <br>• 761: 721.6 / 721.6; <br>• 800: 759.1 / 759.1; <br>• 813: 772 / 772; <br>• 837: 795.2 / 795.2; <br>• 1101: 1050.8; <br>• 1161: 1108.8; <br>• 1233: 1178.5. <br>At 390 and 320 the pair stacks. |
| The invite sheet's pair, the same pattern | **Fixed.** Built from the same Field markup in a 640px `.sheetbox.invite-sheet`, the tracks are 290 + 290 and both fields end inside the box (632 < 656). At 390 it is one 310px track; at 320, 247px. I didn't open the real sheet: its button sits beside "Name them". |

## N30, N31 and the layout effects (e3c7a42), re-checked

**N30: what the loading heroes hold.** Cloth height / sheet top, held → arrived:

| Page and state | 1366 | 390 | 1920 | Verdict |
|---|---|---|---|---|
| Home, free plan (held note "3 of today’s three waiting.") | 386.7 → 386.7 | 624.1 → 624.1 | 394.8 → 394.8 | 0px |
| Home, paid (the founder; a real cold load) | 355.7 → 355.7 | 593.1 → 593.1 | 363.8 → 363.8 | 0px. Also 472.2 at 2560 and 484.1 at 800 |
| Archive, private line (held → arrived) | 384.1 → 384.1 | 360.8 → 360.8 | 384.1 → 384.1 | 0px. Also 0 at 320 and 800 |
| Archive, shared (the founder, whose key reads `public`) | 384.1 → 384.1 | 402.8 → 402.8 | 384.1 → 384.1 | 0px. Also 0 at 2560 (499.3) |
| Person, two-part subline (dated) | 256.9 → 256.9 | 215.9 → 215.9 | — | 0px |
| Person, **one-part subline (all six of the founder's people)** | 256.9 → 256.9 | **215.9 → 192.6** | 257.6 → 257.6 | **Moves 23px on a phone: finding 1** |
| Person, sample family (Rose, three parts) | — | 239.1 → 239.1 | — | 0px |
| Person, sample family (Walter, Edith, Peggy: "Name & Rose." wraps) | — | **239.1 → 274.5** | — | **Moves 35px: finding 1** |

**N31: Talk's outline against the card** (from the sheet's top; box height):

| Width | Outline | Card | Verdict |
|---|---|---|---|
| 1180, 1280, 1366, 1440 | top 78.5, height 301 | top 78.5, height 301 | **Bottoms within 0.1px** |
| 1100, 1001, 800 | height 253 | height 253 | Tops 1.2px apart (round 10's 1px). Pass |
| 390 | 66, height 245 | 66, height 245 | Pass |
| 1600, 1920, 2560 | height 301 | **height 313** | **12px short: finding 7** |

**Layout effects:**
- **Wall:** in 4 of 4 cold loads, at the moment of insertion the arrived `.wall-sheet` was at opacity 0, `translateY(56px)`, with its name already split. Nothing paints at rest.
- **Writer's book:** at 1366, 390 and 1920, the `.w-book` was at opacity 0 at insertion. The sheet rose once (0 dips), and the cloth held at 104 → 104 and 96 → 96.
- **The memory page:** 104 → 104 and 96 → 96, 0 dips, and every `[data-rise]` at 0 at insertion.
- No React warnings, and no active tweens once settled.

## Findings

1. **Person's loading hero now holds two subline lines on a phone. Every person in the founder's family has one, so every cold load of a person on a phone moves the sheet 23px up while it is fading in.** Round 10 measured 0 here.
   - **Where:** `pages/Person.tsx:125–133`. The skeleton maps `[" ", " "]` into two `.sub-part`s, and on a phone each part is its own line (`family-people.css:584`).
   - **Evidence (390×844, first skeleton sample → arrived; cloth / sheet top):**
     - **5aa5** (Storyteller), **36cf** (Nhi Tran’s parent), **517a**, **6f03** and **ff96** (Your friend): 215.9/188 → 192.6/165. The sheet goes up 23px, mid-rise: the trace shows it at opacity 0.5–0.8 when the subline changes.
     - **ada1** ("In the family"): 215.9 → 228, so 12px down, because its title runs to two lines.
     - **The sample family:** Walter, Edith and Peggy hold 239.1 and arrive at 274.5, so 35px down. "Walter Carey & Rose." wraps to two lines (71px), and the held title is one line.
     - At 800, 1366, 1920 and 2560 every person holds to 0px.
   - **Sizes:** 390, and every width up to 760.
   - **Rules:** 23a (nothing jumps) and 42; N27/N30's ±2px.
   - **Fix:** don't guess the count. On arrival, store each person's subline count and title line count under their id (a per-viewer convenience, as Archive does with `astory-archive-wall`). Hold that in the skeleton, defaulting to one part and one title line. Or let a phone's subline parts run inline and wrap whole, so one or two short parts take one line.

2. **On the public wall, "From the family" sets a single note in one half of a two-track grid: a 167px rounded, tinted box of one or two words a line, beside an empty track.**
   - **Where:** `book-account.css:818`, `.wall-notes { grid-template-columns: repeat(2, minmax(0, 1fr)) }`, inside the chapter's right-hand column (`.wall-chapter.wall-family`). The note computes `border-radius: 22px` on `--paper-tone`.
   - **Evidence:**
     - **800×1024:** grid 359px, note 167px, 8 lines ("TEST: I / remember / Grandpa’s / uniform / …"). Shot: `shots/book-r11-wall-notes-800.png`.
     - **1366:** note 219px of a 462px grid, 5 lines, and "Sunday." alone on the last. Shot: `shots/book-r11-wall-notes-1366.png`.
     - **390:** one full-width card, which reads well.
     - The hero says "1 from the family". One note is the common case for a new family.
   - **Sizes:** 761 and up.
   - **Rules:** 10 (a single card alone in a row), 17a (a measured column; no tinted bubbles or clipped rounded frames), 9.
   - **Fix:**
     - `.wall-notes:has(> :only-child) { grid-template-columns: minmax(0, 1fr); }`.
     - Stack the notes to one column below about 1100px, where the chapter's column is narrow.
     - Set the note as paper with a hairline and the book's square corner, not a 22px tinted bubble.

3. **On every cold visit to the wall, the waiting sheet shows at full strength, then vanishes for about a quarter-second and rises a second time from 56px down.**
   - **Where:** `pages/Wall.tsx:329–333`. WallWait (262) and the arrived bench are different trees, and `arrive(root.current)` runs the full sheet rise over the waiting paper.
   - **Evidence (requestAnimationFrame trace, headless, a normal fetch):**
     - **1366:** `551 wait op1 y0` → `2704 real op0` → `2944 real op0.01` → `3578 real op1`.
     - **390:** wait at 587 → `4543 real op0` → `5481 op1`.
     - So the paper is at full strength for 2.1–4s, then at or near 0 for about 240ms, then rises again. The signed-in pages fixed exactly this in rounds 9–10: they keep one sheet that rises once.
   - **Sizes:** all.
   - **Rules:** 23a ("Nothing jumps or flashes"), 25 and 42.
   - **Fix:** when the wall arrives after the wait has painted, call `arrive(root.current, { inside: true })`, so the sheet stays and only what is inside rises. Or render WallWait inside the same bench and sheet nodes, so the waiting sheet is the one that rose.

4. **On Talk and Plans at 1600px and wider, the arrival's 56px rise pushes the page 56px past one screen. A scrollbar then appears for 0.7–0.9s and goes, so the whole page shifts 7.5px sideways and back.**
   - **Where:** the Shell's arrival (`lib/arrive.ts`, the sheet's `y: 56` from-state) on pages that are exactly one screen. `html` has `scrollbar-gutter: auto` except on the wall (`html:has(.wall) { scrollbar-gutter: stable }`).
   - **Evidence** (`clientWidth` over time, cold load; `scrollHeight` during the rise):
     - **Talk 1920×1000:** 1920 → 1905 (scrollHeight 1056) at 1969ms → 1920 at 2801ms.
     - **Plans 1920:** 1920 → 1905 at 2283 → 1920 at 3089.
     - **Talk and Plans at 2560×1300:** 2545 → 2560. **Talk at 1600×900:** 1585 → 1600.
     - The centred columns move 7.6px. That is also why Talk's outline measured 7.6px left of the card at 1920.
     - Start doesn't do it, and neither do the long pages. Plans at 1440 scrolls anyway.
   - **Sizes:** 1600 and up, which is the founder's display.
   - **Rules:** 23a and 25; the checklist ("the ratio holds", no jump).
   - **Caveat:** this shows with classic scrollbars, which Chromium uses in this pane and Edge uses on Windows by default. With overlay scrollbars it wouldn't show.
   - **Fix:** give the signed-in `html` `scrollbar-gutter: stable`, as the wall has. Or clip the sheet's from-offset (`overflow-y: clip` on the Shell's main) so a transform never adds scrollable height.

5. **On a narrow phone the Archive's three figures wrap onto two rows. "Chapters" is left alone on the second row, and the loading hero then holds the wrong height.**
   - **Where:** `archive-reading.css:331` (`flex-wrap: wrap; gap: 10px 22px`) with the second figure's label (Archive.tsx:395–404). The skeleton holds "1949–2026 · The years it reaches" (292–303).
   - **Evidence** (arrived cloth for each kind of second figure; held 402.8):

     | Width | Photographs (the founder) | "The years it reaches" | "The one year dated so far" |
     |---|---|---|---|
     | 390 | 402.8 | 402.8 | 402.8 |
     | 375, 360 | 402.8 | 402.8 | **460.9** |
     | 344, 320 | 402.8 | **460.9** | **460.9** |

     - So a story with one dated year wraps at 360–375, two of the commonest phone widths: "Chapters" is orphaned and the sheet moves 58px down on arrival.
     - At 320–344, the held "years" figure wraps but the founder's photographs figure doesn't. His cold load measured 460.9 → 402.8, so the sheet moves 58px up.
   - **Rules:** 10, 23a, 12.
   - **Fix:**
     - On a phone, set the three figures as `grid-template-columns: repeat(3, minmax(0, auto))`, with each label allowed to wrap within its own cell, so they never wrap as a row.
     - Shorten "The one year dated so far" (for example "Dated so far").
     - Hold the same grid in the skeleton.

6. **Account's Password section runs past its column below 375px, and off the window below about 356px.**
   - **Where:** `book-account.css:367`. `.acct-part` is `display: grid` with no track, so the implicit `auto` track takes the password field's min-content: 314.8px, the input's `size=20` plus the Show button.
   - **Evidence:**
     - **320×700:** the column ends at 285. The h3, the lead, the field and "At least 6 characters." end at 339, and `body.scrollWidth` is 339 against 305: 34px cut off.
     - **340:** cut by 14px.
     - **360:** 14px over the column, onto the sheet's margin.
     - Clean at 375 and up.
     - **Rule 1:** I swept Book, Plans, Talk, both Start pages, Home and Archive at 320. Only Home also overruns: "Good afternoon," (`.nw`) ends at 312 against 305.
   - **Sizes:** 320–374. 360 is a common Android width.
   - **Rules:** the checklist (no clipped text), 12, and DESIGN.md's phone floor (grid tracks `minmax(0, 1fr)`).
   - **Fix:**
     - `.acct-part { grid-template-columns: minmax(0, 1fr); }`.
     - `min-width: 0` on the field's input row.
     - On Home, let the greeting wrap below about 340px, or step its size down.

7. **From 1600px Talk's skeleton outline is 12px shorter than the card it stands in for.**
   - **Where:** `book-account.css:903` (`min-height: 301px`). From 1600 the question sets at `--qs: 52px` (`:543–546`), so the card is 313px.
   - **Evidence:** outline 301 against card 313 at 1600, 1920 and 2560. Bottoms 385.3 against 397.2 at 1920.
   - **Rules:** 42; N31's ±2px.
   - **Fix:** add `@media (min-width: 1600px) { .talk-skel .bka-sk-block { min-height: 313px; } }`.

## What passed

- **Fresh pass, at 1366, 1920, 2560, 800 and 390, except the findings above:**
  - Book, Plans, Account, Talk and both Start pages: `body.scrollWidth` equals the window, and nothing runs off the right edge.
  - No text under 12px outside the book.
  - No straight quotes in the interface.
  - Where to next has three rows on Book, Plans, Account, Talk, Archive, Person, the memory page and /write.
  - Start's only faded text is the designed "Dear family," specimen (0.5). Step 1 and the join page stay one screen at 1366, 1920, 2560 and 800. On a phone the join page fits 844, and step 1 scrolls to 1194, as in round 10.
- **Controls:**
  - Home's week arrows are 36px with a 46.7px `::before` hit area.
  - Archive's search input is 33px inside a 44px label.
  - Account's 1×1 radios at 2560 are visually hidden; their labels are the targets.
  - Plans' 1px cell labels are its visually hidden row labels.
  - The flagged running-head clip was a moment mid-transition. Settled, it reads `scrollWidth = clientWidth`.
- **Overlaps:** only rows under the fixed phone tab bar at scroll 0, which scroll clear, as in rounds 9 and 10. On /write, the "Not now" link's 44px target overlaps the bottom 19px of the seal button's transparent box at every size. Their visible words are 13px apart, and "Not now" wins in the overlap, so I don't count it.
- **Cold loads:** every page rose once (0 dips), and the cloth and sheet top held to 0px except where finding 1 or 5 says otherwise.
- **The wall:**
  - The function answered 200 every time, and the fallback RPC was never called.
  - No auth keys are in storage.
  - No horizontal scroll at the eight sizes, with `scrollbar-gutter: stable`.
  - Photographs: 4/4 loaded, except 3/4 at 375 at the moment of the sweep (a lazy print; not re-checked).
  - Leaf titles are 1–2 lines (up to 4 at 3840 at zoom 2.16, as before).
  - The mark sits 21.6px clear (27.2 at 2560).
  - The bad slug shows "This story isn’t shared." in exactly one screen at five sizes.
  - The wait state reads "Opening the book…", and the cloth holds 302 → 301.7 (1366, 1920) and 406 → 406.3 (390).

## Notes (not findings)

- **Home, free plan, last question:** at 390 the note "The last of today’s three. Three new ones tomorrow." takes two lines, which is 21px more than the held note. "Ask me another" also leaves at that point, so the net change is unmeasured.
- **Person's note link:** "Losing grandparents and preserving a grandfather's story" is an inline link 16px tall at 1366. That is inline-link exempt. The straight apostrophe is in the stored title.
- **Wall:** the phone foot still keeps about 100px of bare paper above the mark, and its copy is founder test content. Both are unchanged from round 10.
- **Rule 1 on finding 4:** /family at 1920 and 2560 gains its scrollbar at arrival and keeps it, because the page is longer than one screen, so it doesn't flicker.

## Not verified

- **Real paints and the browser's view-transition snapshot:** pane screenshots timed out, so all signed-in evidence is measured, not seen.
- **The invite sheet in place:** measured with its markup and class, not opened.
- **Free-plan and private-wall cold loads end to end:** measured as markup variants in arrived frames, as asked.
- **Edge with overlay scrollbars (finding 4), and a zoomed-out Edge window:** 2560 at zoom 1.3 stands in for the latter.
- **Hover, focus-visible, active and reduced-motion states:** not exercised this round.

## Housekeeping

- **The pane:** I worked only in tab-191. Every measuring iframe and my window helpers were removed. I reset the viewport to desktop and closed the tab.
- **What the loads did:**
  - Loading /archive wrote the page's own `astory-archive-wall` key, which was already `public` and still is.
  - Loading /talk and /plans queued their usual view events.
  - Nothing was typed or kept.
- **Not touched:** I didn't sign out and didn't read or touch `astory-app-auth`. I pressed none of Save, Keep, Change, Remove, Send, Order, Open it, Choose, switch story, the printing-interest button, "Name them" or "Delete my account…".
- **Playwright:** headless, signed out and fresh, on the public wall only.
- **Saved:**
  - Scripts are in my scratchpad (`r11b/`).
  - Shots: `docs/agents/reviews/shots/book-r11-wall-{real,none}-{1366,390}.png`, `book-r11-wall-real-{1366,390}-foot.png` and `book-r11-wall-notes-{800,1366}.png`.
