# Book, Plans, Account, Talk, Start and the Wall, round 17: Bao's Standard

**PASS.**

Round 17 (285535a, after 5418b49 and 6d0cb51) holds everywhere I measured.

**The wall, with the function held back 8s:** at seventeen widths from 320 to 1920, the waiting hero and the arrived hero are the same height to the tenth of a pixel. The sheet stays at full strength from the wait through arrival.

**The counts:** the arrived counts keep that height for every count I tried, from "1 memory" to "999 memories · 24 chapters · 120 from the family". No count ever splits on a wrap.

**Montserrat:** it is now one variable file. It renders four distinct real weights from 400 to 700, is fetched once and preloaded with Source Serif, and no preload warning appeared.

**The group sweep** at 320, 390, 800, 1366, 1920 and 2560 is clean.

This round replaces round 16, which I didn't finish reporting: round 17 landed while I was measuring 16. The round-16 numbers I had are superseded by those below.

## How I checked

- **Read first:** the diffs of 5418b49 (fonts, wall counts), 6d0cb51 (whole counts) and 285535a (WallCounts, held markup, per-band line counts).
- **The wall:** headless Chromium from `../09142026/node_modules/playwright`, with real scrollbars drawn, in fresh signed-out contexts.
  - `public-story` was held back 8s by a route.
  - **Waiting frame:** I measured the cloth's height, the sheet's top, and the held counts, name and intro.
  - **Arrived page:** I measured the same boxes, plus the lines of the counts and of the tail, and any `.nw` count split across lines.
  - **Count variants:** I swapped the arrived counts for four sets, using the component's own markup, and re-measured the cloth:
    - "1 memory";
    - "37 · 5 · 3";
    - "120 · 12 · 14" (the stated worst case);
    - "999 · 24 · 120".
  - A requestAnimationFrame trace followed the sheet's opacity.
  - Widths: 320, 340, 360, 374, 375, 390, 414, 500, 600, 760, 761, 800, 900, 1100, 1101, 1366 and 1920.
- **Fonts, headless:** on the wall, the bad slug, `/sign-in` and `/welcome` at 1366 I checked:
  - every request under `/fonts/`;
  - `document.fonts` after load;
  - the canvas width of the same Montserrat string at 400, 500, 600 and 700, against a Segoe UI fallback;
  - console messages about preloads.
- **Signed-in group, in my own pane tab (tab-223):** I cold-loaded Book, Plans, Account, Talk, `/start?another=1` and `?another=1&join=1` into same-origin iframes at 320, 390, 800, 1366, 1920 and 2560 (zoom 1.3).
  - **During the load:** the cloth and sheet top from the first skeleton sample to arrival, dips, and every `clientWidth` change.
  - **After a scroll-through and every animation finished:** overflow past the window, text under 12px outside the book, controls under 44px (allowing for a `::before`/`::after` hit area) and the Where to next rows.

## The wall's counts and waiting hero

Cloth height, waiting → arrived (sheet top in brackets). The variant columns give the arrived cloth with each count set swapped in.

| Width | Waiting | Arrived | 1 memory | 37 · 5 · 3 | 120 · 12 · 14 | 999 · 24 · 120 | Counts lines (nums + tail) |
|---|---|---|---|---|---|---|---|
| 320, 340 | 425.8 (398) | 425.8 (398) | 425.8 | 425.8 | 425.8 | 425.8 | 2 + 1 |
| 360, 374 | 425.8 (398) | 425.8 (398) | 425.8 | 425.8 | 425.8 | 425.8 | 1 (held to 2) + 1 |
| 375–760 | 425.8 (398) | 425.8 (398) | 425.8 | 425.8 | 425.8 | 425.8 | 1 (held to 2) + 1 |
| 761–1100 | 321.3 (293) | 321.3 (293) | 321.3 | 321.3 | 321.3 | 321.3 | 1 + 1 |
| 1101, 1366, 1920 | 301.7 (274) | 301.7 (274) | 301.7 | 301.7 | 301.7 | 301.7 | one line |

- **No split:** no `.nw` count is split across lines at any width with any count set.
- **The tail:**
  - Below 375 it reads "shared by the family".
  - From 375 to 1100 it reads "shared by the family, for anyone with the link" on its own line.
  - From 1101 it follows the counts on one line, with its dot.
- **No overflow:** `body.scrollWidth` equals the window everywhere.
- **The name and the intro** hold their arrived boxes: 40 and 28px on a phone, 58 and 32px from 761.
- **One sheet:** the trace reads `wait op1.0 > real op1.0` at every width.
- **Shots:** `shots/book-r17-wall-{320,375,800,1366}-hero.png`.

## Fonts

- **One variable Montserrat:** `montserrat.css` now has two faces, latin-ext and latin, each `font-weight: 400 700`.
  - The latin file carries HVAR, MVAR and STAT tables, so it is a variable font.
  - The canvas widths of one string are 411.4 (400), 417.8 (500), 425 (600) and 432.7 (700), against 361.5 for Segoe UI. Each weight is drawn from the file, not synthesised or substituted.
  - The cloth's titles set at 700, the wall's counts at 400, and the ritual and door labels at 600.
- **Requests:** on the wall, the bad slug, `/sign-in` and `/welcome`, the font requests are only:
  - `montserrat-1.woff2` and `c1df4596be502923.woff2`, the two preloads;
  - the two stylesheets;
  - on the wall, one book face.

  Neither preloaded file was requested twice.
- **Loaded faces:** `document.fonts` reports Montserrat (400–700) and Source Serif 4 400 loaded on all four pages. The Source Serif preload is used.
- **No preload warnings** were logged.

## The group sweep: 320, 390, 800, 1366, 1920 and 2560

**Book, Plans, Account, Talk and both Start pages:**
- The loading hero held the arrived height exactly at every size.
- `clientWidth` never changed during a load.
- Nothing overflows the window.
- No text under 12px outside the book, and no control under 44px.
- Three Where to next rows on Book, Plans, Account and Talk.

One run recorded a single opacity dip on Plans and on Talk at 320. They were the second and fourth loads of the batch. Six further cold loads of the two pages at 320 recorded none. As with round 12's one-off on the Archive, I count it as a dev-server artefact, not the page.

## Notes (not findings)

- **A blank line in the counts on phones.** From 360 to 760 the counts take one line but hold two (`--wc-lines: 2`). So for an ordinary story the tail sits one empty line below the counts: 19.6px of extra space between "8 memories · 2 chapters · 1 from the family" and "shared by the family…" (`shots/book-r17-wall-375-hero.png`). At 320 and from 761 there is no gap. It reads as a deliberate break, so I don't count it. If the founder wants the two lines together, put the reserved height below the tail instead: `min-height` on `.wall-counts` rather than on `.wall-counts-nums`. The heights stay equal and the empty room becomes cloth.
- **The held name and intro** are one line each, as the founder's are. A long name that wraps to two lines on a phone would make the arrival move once. That is the same known limit as Home's question and Person's two-line names.
- **Only the not-shared wall takes the cloth canvas.** The real wall's root is `.wall`, not `.wall-bench`, so `html:has(.wall-bench, .start)` matches only the not-shared page and Start. The real wall keeps its cream canvas, which suits its paper running to the foot.
- **Notes from earlier rounds that still stand:**
  - Talk's phone words column is 8px off;
  - the wall's phone foot keeps about 100px of bare paper above the mark;
  - Home's greeting is three lines at 320.

## Not verified

- **Real Edge:** the evidence is from headless Chromium with its scrollbars drawn, and from the pane's iframes, not from a real Edge window. Pane screenshots time out, so the signed-in evidence is measured, not seen.
- **Hover, focus-visible, active and reduced-motion states**, and a zoomed-out Edge window, weren't exercised this round.
- **Commits that landed during the review:** HEAD moved to 862fac7 (Archive round 20, the tidy) during the review. It doesn't touch the wall, fonts or the group's pages, and the working tree was clean.

## Housekeeping

- **The pane:** I worked only in tab-223. I removed every iframe and helper, reset the viewport to desktop and closed the tab.
- **What the loads did:** loading /talk and /plans queued their usual view events. Nothing was typed or kept.
- **Not touched:** I didn't sign out and didn't read or touch `astory-app-auth`. I pressed none of Save, Keep, Change, Remove, Send, Order, Open it, Choose, switch story, the printing-interest button, "Name them" or "Delete my account…".
- **Playwright:** headless and signed out. The function was held back by a route in my own contexts only.
- **Saved:**
  - Scripts are in my scratchpad (`r16b/` and `r17b/`).
  - Shots: `docs/agents/reviews/shots/book-r17-wall-{320,375,800,1366}-hero.png`.
