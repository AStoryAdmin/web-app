# Book, Plans, Account, Talk, Start and the Wall, round 12: Bao's Standard

**FAIL.** 2 findings.

15487fc fixes six of my seven round-11 findings outright, and N32–N36 all hold. The scrollbar track app-wide does what it was for: no signed-in page moves sideways on arrival any more.

Two things are still wrong:
- **The new app-wide scrollbar rule has a side effect on the signed-out desktop pages.** The front door's book and the sign-in ritual lock their scroll with `overflow: hidden`. `scrollbar-gutter: stable` still reserves the track's 15px there, so the bookcloth stops 15px short of the window's right edge and a flat brown strip shows. Those pages still don't scroll.
- **The sample family's people still move on a phone.** That is the remainder of round 11's finding 1. The founder's own people now hold to 0px.

## How I checked

- **Read first:**
  - The 15487fc diff (Archive, Home, Person, Talk, Wall and book-account.css).
  - My `book-r11-baos.md` and the Skills Steward's `book-r11-skills.md` (N32–N36).
  - The lead rulings in the brief.
- **Signed-in pages, in my own pane tab (tab-203):**
  - Cold loads ran in same-origin iframes of the test size, at 0.01 opacity, with Chromium's classic 15px scrollbars.
  - A 4ms poll stepped GSAP and recorded:
    - the first skeleton sample and the arrived values (cloth height / sheet top);
    - dips in the sheet's opacity;
    - every change of `documentElement.clientWidth`.
  - Variants were swapped into arrived frames, in my own DOM only.
- **The fresh sweep:** Book, Plans, Account, Talk, `/start?another=1` and `?another=1&join=1`, at 1366×768, 1920×1000, 2560×1300 (zoom 1.3), 800×1024 and 390×844. After a scroll-through and every animation finished, I checked:
  - `documentElement` and `body` scrollWidth;
  - text under 12px;
  - faded text;
  - straight quotes;
  - controls under 44px;
  - Where to next.
  - Account, Home, Book, Plans, Talk and Archive also ran at 320, 340 and 360.
- **The scrollbar rule (headless Playwright from `../09142026/node_modules/playwright`, signed out and fresh):**
  - Pages: `/welcome`, `/sign-in`, `/create-account`, `/verify`, `/forgot-password`, `/join/ABCDEF`, `/c/zz-fake`, the real wall and the bad slug.
  - Sizes: 1366, 1920, 2560, 800 and 390.
  - Each page was measured as it is now, and again with `:where(html){overflow-y:visible;scrollbar-gutter:auto}` appended, which emulates the rule before this commit.
- **Modal sheets:** I opened the shortcuts sheet (`?`, which writes nothing) on Talk 1920×1000, Talk 2560×1300, Account 1366×768, Account 390×844 and Plans 1366×600.
- **The wall:** the full sweep at eight sizes, the bad slug at five, and the wait state at three. A requestAnimationFrame trace followed the sheet's opacity and y from the first frame. The notes were measured at seven widths, including 1100 and 1101.

## Round 11's findings, re-checked

| # | Round 11 | Now |
|---|---|---|
| 1 | Person's phone hero held two subline lines; the founder's people move 23px | **Fixed for the founder.** At 390 all six people go from first skeleton sample to arrived as: <br>• 5aa5, 36cf, 517a, 6f03, ff96: 192.6/165 → 192.6/165, 0px, 0 dips. The subline runs inline as one 23px line. <br>• ada1: 192.6 → 228, 12px down. Its name runs to two lines, which no skeleton can know (the same note as round 11). <br>**The sample family still moves: finding 2.** |
| 2 | The wall's lone family note | **Fixed.** One note now takes the whole measure between two hairlines: <br>• `border-radius: 0`, no fill; <br>• 462px wide at 1366, two lines; <br>• 359px at 800 and 338 at 1101, two lines; <br>• 721 at 1920 and 335 at 390. <br>Shots: `shots/book-r12-wall-notes-{1366,800}.png`. |
| 3 | The wall's paper flashed away and rose again after the wait | **Fixed.** The trace reads `533 wait op1 y0` → `real op1 y0` at 1366 and 390. The sheet never leaves full strength; only what is inside rises. |
| 4 | The scrollbar came and went on arrival (Talk and Plans, 1600+) | **Fixed.** `clientWidth` never changed during a cold load: <br>• Talk at 1366×768, 1366×900, 1600, 1920, 2560, 1101, 1031, 1030, 800 and 390; <br>• Plans at 1600, 1920 and 2560; <br>• Person at 1366×900; <br>• Home, Book, Account, /write and Family. <br>**But see finding 1.** |
| 5 | Archive's figures wrapped on narrow phones | **Fixed.** The arrived cloth is the same for all three kinds of second figure (photographs, "The years it reaches", "The one year dated"): <br>• 416.4 at 320, 344, 360, 375, 390, 414 and 760; <br>• 384.1 at 800 and 1366. <br>The founder's cold load holds 416.4 → 416.4 at every phone width. The three figures stay on one row, with "Chapters" at x 215–256. |
| 6 | Account's Password section overran at 320–374 | **Fixed.** `body.scrollWidth` equals the window at 320, 340 and 360 on Account, Home, Book, Plans, Talk and Archive. Home's greeting now wraps at 320 rather than running off: see Notes. |
| 7 | Talk's outline at 1600+ | **Fixed.** Outline and card from the sheet's top, top / bottom: <br>• 1600 and 1920: 77.7 / 397.3 against 77.7 / 397.2; <br>• 2560: 101 / 516.5 against 101 / 516; <br>• 1366: 78.5 / 384.5 against 384.4. <br>The held words column now matches the arrived one exactly at every desktop width (for example 81 / 484.8 at 1366, and 81 / 489 at 1920). |

**Skills N32–N36:** N32 is my finding 1 (founder fixed, sample family is finding 2). N33 is my finding 5, fixed. N34: Talk and Person at 1366×900 hold their scrollbar (`clientWidth` 1351 throughout). N35 is my finding 7, fixed. N36: the held hero now reads the remembered plan (`astory-home-paid`, "1" for the founder) and today's skips; the founder's Home holds 355/327 → 355/327 at 1366 and 363.8 → 363.8 at 1920.

## Findings

1. **The app-wide `scrollbar-gutter: stable` reserves an empty 15px track on the signed-out pages that lock their scroll. At desktop sizes the bookcloth on the front door and on every ritual page stops 15px short of the right edge, over a flat brown strip.**
   - **Where:** `book-account.css:722`, `:where(html) { overflow-y: scroll; scrollbar-gutter: stable; }`. It is combined with the locks at `astory.css:3178` (`html:has(.auth.ritual) { overflow: hidden }`) and `signed-out.css:476` (`html:has(.door[data-layout="book"]) { overflow: hidden }`). Those locks win on `overflow`, as intended. But `scrollbar-gutter: stable` also applies to an `overflow: hidden` box, so the track's space stays reserved with no scrollbar in it.
   - **Evidence (headless, 1366 and 1920):**
     - `/welcome` (book layout), `/sign-in`, `/create-account`, `/verify`, `/forgot-password`, `/join/ABCDEF` and `/c/zz-fake` all measure `overflow-y: hidden` and no scroll. That is right: `scrollHeight − clientHeight` is 0.
     - But `body` is 1351 wide in a 1366 window, and 1905 in a 1920 window. `elementFromPoint(innerWidth − 5, …)` finds nothing.
     - With the old rule emulated, `body` is the full 1366 and 1920.
     - 2560 shows the same 11px difference in zoomed units.
     - Shots: `shots/book-r12-door-right-edge-1366.png` (the cloth texture ends, and a flat strip runs the height of the window) and `shots/book-r12-signin-right-edge-1920.png`.
     - At 800 and 390 these pages scroll (`overflow-y: visible` from signed-out.css:628/668), so nothing changes there.
   - **Sizes:** every desktop size where the door opens the book or the ritual is locked: 1366, 1920, 2560 and the 5:4 desktops.
   - **Rules:** 11 (the signed-out pages are one screen, edge to edge), 14 (the cloth is the top of every page), 25; the brief's "must still not scroll" holds, but the frame doesn't.
   - **Fix:** add `scrollbar-gutter: auto` to the two lock rules (`html:has(.auth.ritual)` and `html:has(.door[data-layout="book"])`). Or scope the app-wide rule to the signed-in shell, `:where(html:has(.shell, .start, .wall))`.

2. **The sample family's people still move on a phone. The held hero is one subline line and one title line, but each sample person arrives with a two-line subline, and most with a two-line title.**
   - **Where:** `pages/Person.tsx:125–133`. With `preview`, it holds `["A sample family", " ", " "]`, and inline that is one line. The arrived parts are "A sample family · Rose’s father · Born 1912 · Passed away 1979" (47px, two lines at 390). The titles "Walter Carey & Rose." and "Margaret Doyle & Rose." are 71px, two lines.
   - **Evidence (390×844, first skeleton sample → arrived):**
     - sample-rose: 192.6 → 215.9, **23px down**;
     - sample-walter: 192.6 → 251.2, **58.6px down**;
     - sample-peggy: 192.6 → 251.2, **58.6px down**.
     - Round 11 had Rose at 0 and Walter at 35; the inline subline moved the problem rather than removing it.
   - **Sizes:** 390, and other phones.
   - **Rules:** 23a and 42; N27's ±2px.
   - **Fix:** the sample family is fixed content, so hold its real shape. With `preview`, hold "A sample family · Rose’s mother · Born 1912 · Passed away 1979" (a long relation and the dated form) and a two-word name with "& Rose.", both `hold-words`. Or keep a per-person line count, as round 11 suggested, which also covers ada1's two-line name.

## What passed

- **The fresh sweep:** Book, Plans, Account, Talk and both Start pages at 1366, 1920, 2560, 800 and 390.
  - `body.scrollWidth` equals the window everywhere.
  - No text under 12px, no straight quotes and no controls under 44px (except Account's visually hidden radios at 2560).
  - The only faded text is Start's "Dear family," specimen (0.5).
  - Where to next has three rows on Book, Plans, Account and Talk.
  - 0 dips, and `clientWidth` never changed during any load.
  - Step 1 and the join page stay one screen at 1366, 1920, 2560 and 800 (docH equals the window).
- **The scrollbar rule on the signed-out pages,** except finding 1:
  - Nothing that should be one screen scrolls.
  - The ritual and the door at desktop sizes keep `overflow-y: hidden` and 0 overflow.
  - At 800 and 390 they scroll as before (`overflow-y: visible`).
- **Modal sheets:**
  - The shortcuts sheet doesn't double-scroll: its `scrollHeight` equals its `clientHeight` (435 at 1920, 1366 and 1366×600; 473 at 390). Behind it there is the page's own scrollbar, which long pages always had.
  - On the one-screen Talk at 1920, the page's track is there but has nothing to scroll.
  - Neither the app nor this commit locks the page's scroll under a sheet. That behaviour is unchanged.
- **The wall:**
  - The function answered 200 and the fallback RPC was never called.
  - No auth keys are in storage.
  - No horizontal scroll at the eight sizes.
  - Photographs 4/4 loaded, except 3/4 at 375 at the moment of the sweep (a lazy print, the same as round 11).
  - The mark sits 21.6px clear (27.2 at 2560).
  - The bad slug shows "This story isn’t shared." in exactly one screen at five sizes.
  - The wait state's cloth holds 302 → 301.7 (1366, 1920) and 406 → 406.3 (390).
- **Cold loads, held → arrived:**
  - Home 355 at 1366 and 363.8 at 1920.
  - Archive 384.1 at 800 (three loads, 0 dips) and 416.4 on phones.
  - Book 201.8 at 1920.
  - Account, /write and Family 104.
  - Person 256.3 at 1366×900.
  - Talk and Plans hold their sheet top.

## Notes (not findings)

- **Home at 320:** the greeting now wraps to three lines ("Good / afternoon, / Bao.", 113px), against DESIGN.md's two-line ceiling. Today's question also runs to three lines there against the held two, so that cold load moves 32px. Both happen only at 320. Stepping the greeting down to fit two lines would fix the first; the second is the known question-length limit.
- **A paid user's first visit** holds the free shape once, before `astory-home-paid` is written, so the sheet moves 31px once. That is the same per-viewer trade-off as the Archive's wall line.
- **The one Archive dip at 800** in my variant run didn't recur in three further cold loads (0, 0, 0). I count it as a harness or HMR artefact.
- **`.sheetbox { max-height: 86vh }`** isn't divided by `--zoom`. At 2560 (zoom 1.3) that is 1118 CSS px, taller than the window. No sheet I opened came near it, and it predates this commit (rule 12).
- **Start and Talk** now show an empty scrollbar track at desktop sizes, by the lead's ruling.
- **Round 11's notes still stand:**
  - Talk's phone words column is 8px off (351 against 342.9);
  - the wall's phone foot keeps about 100px of bare paper above the mark.

## Not verified

- **The signed-out strip in a real Edge window:** measured headless only, because the pane is signed in and redirects `/welcome` to Home. Headless Chromium keeps the 15px gutter even with its scrollbars hidden, and Edge's classic scrollbars reserve the same track, so I expect the same strip there.
- **The invite sheet with real overflow:** I didn't open it, because its button sits beside "Name them".
- **Hover, focus-visible, active and reduced-motion states**, and a zoomed-out Edge window.

## Housekeeping

- **The pane:** I worked only in tab-203 (a first navigate to a mistyped tab id was refused and did nothing). I removed every iframe and helper, reset the viewport to desktop and closed the tab.
- **What the loads did:**
  - The page's own storage now reads `astory-archive-wall = public` (unchanged) and `astory-home-paid = 1`, written by Home's arrival.
  - Loading /talk and /plans queued their usual view events.
  - The shortcuts sheet was opened and closed with `?` and Escape.
- **Not touched:** I didn't sign out and didn't read or touch `astory-app-auth`. I pressed none of Save, Keep, Change, Remove, Send, Order, Open it, Choose, switch story, the printing-interest button, "Name them" or "Delete my account…".
- **Playwright:** headless, signed out and fresh.
- **Saved:**
  - Scripts are in my scratchpad (`r12b/`).
  - Shots: `docs/agents/reviews/shots/book-r12-*`. They are the wall at 1366 and 390 (real, foot, bad slug), the wall's notes at 800 and 1366, and the right edges of the door (1366) and sign-in (1920).
