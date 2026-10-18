# Skills Steward: Book, Plans, Account, Talk, Start and Wall, round 13

**Verdict: GAPS (0 blockers, 1 ugly, 1 polish).**

Fixed in 548b0ca, 7bbb84b and 32c7b6a:
- **N37–N41:** all five are fixed.
- **Bao's round-12 findings:** both are fixed.
- **Held → arrived, founder's state:** every page holds to 0.0px at 320, 360, 375, 390, 1366, 1600, 1920 and 2560. That is 64 cold loads plus 9 repeats.
- **Scrollbar:** `clientWidth` never changed during a load.
- **The locked pages:** the sign-in book and the door's book reach the window's edge again.

Two things are left:
- **N42 (ugly):** Person's task fix doesn't take. At 320 and 340, "about 2 minutes →" still runs 40px off the window and is cut. Bao's round-13 finding 1 measures the same.
- **N43 (polish):** the themed track is `transparent`, so on a one-screen page it shows the canvas cream. On the chocolate not-found and unshared-wall pages, a 15px cream strip runs the height of the window.

The sample family (development only) still moves at 320. That is Bao's round-13 finding 2. I list it under Notes, because no user sees it.

## How this was checked

- **Read:**
  - The diffs of 548b0ca (Home, Person, astory.css, book-account.css), 7bbb84b and 32c7b6a (the scrollbar rule).
  - `book-r12-baos.md` and `book-r13-baos.md`'s findings.
  - archive-reading.css:447–464 and ArchiveGroups.tsx:38–55.
- **Skills:** as in rounds 11–12: taste-skill critique, hallmark states and responsive gates, emil (jarring changes), impeccable craft-floor and polish §5, gsap-react and gsap-performance.
- **Static:** tsc, and eslint on Home and Person, are clean.
- **My own pane tab** (`tab-208`, now closed, viewport reset), with classic 15px scrollbars.
  - **The harness:** the round-12 one. It keeps the first skeleton sample, uses a MessageChannel sleep, and logs `clientWidth` every time it changes.
  - **Storage:** the app's writes to `astory-archive-wall`, `astory-home-paid` and `astory-home-question` were swallowed in my frames. Reads were real, or set per test. All three keys are unchanged.
- **Headless Edge** (Playwright, signed out, real scrollbars via `ignoreDefaultArgs: ['--hide-scrollbars']`):
  - **Pages:** /welcome, /sign-in, /create-account, /join/…, /p/nobody, /nope and the real wall.
  - **Sizes:** 1366, 1920, 2560, 1280×1024 and 390.
  - **Shots:** right-edge shots at 1920.
  - **32c7b6a:** I re-ran 1366 after it landed.

## Round-12 gaps and Bao's findings, checked

| # | Round 12 | Now |
|---|---|---|
| N37 / Bao 1 | The locked signed-out pages reserved a 15px gutter | **Fixed.** `overflow-y: hidden` and `scrollbar-gutter: auto`. `scrollWidth` equals the window at every size: 1366, 1920, 2560 and 1280. That covers /welcome (book layout), /sign-in, /create-account and /join. `.spread-wrap` ends at 0px from the right edge. Shot `r13s/sb-signin-1920.png`: the cloth runs to the edge. Same under 32c7b6a. |
| N38 | An unthemed white track on one-screen pages | **Themed.** `scrollbar-color` computes as `--ink-soft` at 55% on a transparent track, and the one-screen pages keep their gutter (1351 of 1366). **But the transparent track shows the cream canvas: N43.** |
| N39 | At 320, "·" was stranded at a line's end | **Fixed.** Each dot is glued inside its part's nowrap span. Across nine sample people at 320 and 390, every wrapped dot starts its line, and none ends one. The founder's people hold 192.6 → 192.6 at all four phone widths. |
| N40 | A paid user's first visit held the free note | **Fixed** (the plan comes from sign-in first). The founder holds exactly at every size. |
| N41 | Home at 320 held a two-line question | **Fixed for a reload the same day.** 662.6 → 662.6 at 320 with today's question remembered, in 3 of 3 repeats. With the key absent, throwing, or from yesterday: 630.8 → 662.6, the same 32px as before. That is the stated fallback, for a first load of the day. |
| Bao r12-2 | The sample family moved on a phone | **Fixed at 390 and 1366.** All nine sample people hold exactly (251.2, or 215.9 for Rose, and 256.3 at 1366). **At 320, 5 of 9 still move:** Rose 23, Edith 36, Peggy 23, Daniel 23 and Nora 59px up. That is development only: see Notes. |

**Full sweep, held → arrived (cloth):**
- **Home:** 662.6 / 593.1 / 593.1 / 593.1 / 355 / 363.8 / 363.8 / 523.8.
- **Archive:** 416.4 ×4 / 384.1 ×3 / 553.
- **Person 5aa5:** 192.6 ×4 / 256.3 / 257.6 / 257.6 / 370.9.
- **Talk:** 162 ×4 / 182.2 ×3 / 262.4.
- **Book:** 297.3 ×4 / 201.8 ×3 / 290.6.
- **Account and Write:** 96 ×4 / 104 ×3 / 149.8.

All of them are 0 dips, and the sheet is inserted at opacity 0 and y 56. Plans has no account skeleton.

## Gaps

### N42. UGLY: on a person page at 320 and 340, "about 2 minutes →" still runs past the window and is cut off
**Skill:** hallmark gate 34 and responsive non-negotiables (no clipped content at 320); taste-skill pass 13; DESIGN.md's phone floor.

**Measured** (5aa5 at 320):
- `.arc-task` ends at 285, inside the column.
- But its child `.arc-task-t` ("about 2 minutes→") runs from 218 to 345, and the arrow to 345.
- `body.scrollWidth` is 345 against 305, so 40px is cut by `overflow-x: clip`.
- Bao measured 20px at 340, and clean from 360.

**Where:** `book-account.css:739`. The new rule gives the flex container `flex-wrap: wrap`, but the leading text is an anonymous flex item that shrinks to its min-content instead of wrapping the line. `.arc-task-t` keeps `white-space: nowrap` (archive-reading.css:453), so it overflows its own container.

**Change:**

| Before | After | Why |
|---|---|---|
| `.pp2 .arc-task { white-space: normal; flex-wrap: wrap; max-width: 100%; margin-right: 0; }` | `@media (max-width: 400.98px) { .pp2 .arc-task { display: block; white-space: normal; padding-block: 12px; margin-right: 0; } }`, as the Archive's own phone rule does (archive-reading.css:464). Keep `.arc-task-t` nowrap, so "about 2 minutes →" moves to the next line whole. | Inline text wraps the line; flex items don't |
| (check) | 320 and 340: `body.scrollWidth` equals the window, and the target is still ≥44px tall | |

### N43. POLISH: the themed track is transparent, so on one-screen chocolate pages it shows the cream canvas as a 15px strip down the right edge
**Skill:** impeccable craft-floor (browser surfaces are themed from the palette, which they now are, but the track's colour comes from the canvas, not the cloth).

**Measured:**
- `r13s/sb-pnobody-1920.png`: the chocolate cloth stops 15px short of the edge, and a cream strip runs the full height, with the classic arrow at the top. /nope matches.
- On scrolling pages (the wall and every signed-in page) the strip sits beside the cloth band at the top, which was so before round 12 as well.

**Where:** `book-account.css`, `:where(html) { scrollbar-color: … transparent; }`. The canvas behind the track is the cream root background.

**Change:**

| Before | After | Why |
|---|---|---|
| The track is `transparent` | On the chocolate one-screen pages, give the track the cloth's colour: `html:has(.wall-none) { scrollbar-color: <thumb> var(--chocolate); }`, or set the canvas to the cloth there | The strip then reads as the cloth's edge |

## Notes (not gaps)

- **The sample family at 320** (`?preview=tree`, `import.meta.env.DEV` only):
  - Rose holds 274.5 against 251.2, Edith 309.8 against 274.5, Peggy and Daniel 309.8 against 286.6, and Nora 309.8 against 251.2.
  - The four with "Passed away" and long names (Walter, Frank, Tom, Maya) are exact.
  - It holds one shared stand-in. A small map keyed by `personId` would make it exact, as Bao suggests. No user ever sees it.
- **The first visit before the fonts are cached:**
  - In my first pass (a cold font cache), the first skeleton sample was taken in fallback metrics: Home at 320 measured 593.1 and Archive at 375–390 measured 395.4.
  - Once the faces were cached, 9 of 9 repeats held exactly.
  - The fonts load with `display=swap` from Google and `/fonts/*.css`, with no preload. Preloading the two display faces, or giving the fallbacks matched `size-adjust` metrics, would cover a first-ever visit. This is app-wide and outside this round.
- **A round 13 commit:** `.sheetbox { max-height: calc(86vh / var(--zoom, 1)) }` matches the zoom rule used elsewhere. No sheet was opened.

## Skill by skill

- **taste-skill:**
  - Gap: N42 (cut text on the smallest phone).
  - Passes:
    - The sign-in book and the door reach the window's edge.
    - Every held hero is exact at every width for real users.
- **hallmark:**
  - Gap: N42 (gate 34 at 320).
  - Passes:
    - No stranded separators.
    - The Archive's figures hold.
    - No two-line buttons.
- **emil-design-eng:**
  - No gap.
  - Passes:
    - No sideways jog: `clientWidth` is constant on every load.
    - One sheet, one rise.
- **impeccable:**
  - Gap: N43 (a browser surface coloured by the canvas, not the cloth).
  - Passes:
    - Storage is wrapped, with stated fallbacks.
    - tsc and eslint are clean.
- **GSAP:** no gap: 0 dips, layout-effect arrivals, and every sheet inserted at its from-state.

## Housekeeping

- **Pane:** I worked only in `tab-208`. I removed every iframe and my helpers. I reset the viewport to desktop and closed the tab.
- **Nothing written:**
  - I didn't sign out, touch `astory-app-auth`, or press any control.
  - The app's writes to the three page-memory keys were swallowed in my frames, and they read as before (`public`, `1`, today's question).
  - Loading /talk and /plans queued their usual view events.
- **Playwright:** headless, signed out, fresh contexts.
- **Scripts and shots:** in my scratchpad, `r13s/` (`so2.mjs`, `so3.mjs` and the 1920 right-edge shots). Nothing was saved to `docs/agents/reviews/shots/`.
