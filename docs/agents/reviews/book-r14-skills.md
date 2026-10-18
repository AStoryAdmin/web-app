# Skills Steward: Book, Plans, Account, Talk, Start and Wall, round 14

**Verdict: GAPS (0 blockers, 1 ugly, 1 polish).**

Fixed in 7fd905f:
- **N42 and N43:** both are fixed.
- **Bao's round-13 finding 2:** fixed. All nine sample people hold exactly at 320, 360 and 390.
- **The fresh sweep, founder's state:** held → arrived is 0.0px on every page at 320, 360, 375, 390, 1366, 1600, 1920 and 2560 once the faces are loaded. `clientWidth` is constant on every load.

Two things are left:
- **N44 (polish):** the Montserrat preload covers only the 700 weight. The self-hosted file is served under four URLs per range, so a first visit downloads the same latin file up to four times. 400 arrives about 260ms in, and 600 about 5s in, when the content first uses it. While a weight is missing, a held hero can sit in fallback metrics, and then it grows. I caught it in the pane on Archive (375/390, 21px) and Home (320, 32px).
- **N45 (ugly):** the public wall's waiting cloth holds a two-line counts line. At 320 and 360 the arrived counts line sets in three lines, so the cloth grows 19.8px. Since round 12 the wall's sheet arrives in place, so on those phones the standing sheet is pushed 20px down. 375 and up are exact. This is new to my measurements: I hadn't timed the wall at 320–360 before.

**On self-hosting the Google faces:** yes, it is worth a note to the lead. See the end of Notes.

## How this was checked

- **Read:**
  - The diff of 7fd905f: index.html, Person.tsx and book-account.css.
  - `public/fonts/montserrat.css` and `fonts.css`. I compared the woff2 files by md5.
  - Wall.tsx 238–300 and 395–405, the Start root, and `book-r13-baos.md`'s findings.
- **Skills:** as in rounds 11–13. Also impeccable polish's font-loading clause ("zoom, font loading… layout shift").
- **Static:** tsc and eslint are clean (r13 run; 7fd905f adds no hooks and no new imports).
- **My own pane tab** (`tab-211`, now closed, viewport reset), with classic scrollbars.
  - **The harness:** the round-13 one, plus a record of every distinct skeleton cloth height and, on a change, which faces were loaded.
  - **Storage:** the app's writes to the three page-memory keys were swallowed in my frames. The keys are unchanged.
- **Headless Edge** (Playwright, signed out, real scrollbars, fresh contexts, so the font cache is cold):
  - **Canvas and track:** computed values and right-edge shots on /p/nobody, /nope, the real wall and /sign-in.
  - **The wall's wait state** (the function held back 2.5–3s) at 320, 360, 375, 389, 390, 414 and 1366. I traced the cloth on each frame, and listed the font resources with their timings.

## Round-13 gaps and Bao's findings, checked

| # | Round 13 | Now |
|---|---|---|
| N42 / Bao r13-1 | Person's task ran 40px off the window at 320 and 340 | **Fixed.** At ≤400 the task is `display: block`. Its right edge sits inside the column: 285 at 320, 305 at 340, 325 at 360. It is 63px tall: two lines, "about 2 minutes →" moved whole. `body.scrollWidth` equals `clientWidth` at 320, 340, 360 and 400. At 400 it is one line (44px). |
| N43 | The transparent track showed a cream strip on chocolate pages | **Fixed.** On /p/nobody, /nope and both Start pages, `html` is `rgb(74, 51, 39)`, with `scrollbar-color` a 35% `--on-chocolate` thumb on a chocolate track. Shot `r14s/edge-pnobody-1920.png`: the cloth runs to the edge with a quiet track. The real wall and /sign-in keep the round-13 values (transparent; the locked page has no track). |
| Bao r13-2 | The sample family at 320 | **Fixed.** All nine people match held → arrived at 320, 360 and 390. At 320: Rose 251.2, Walter 309.8, Edith 274.5, Frank 309.8, Peggy 286.6, Tom 309.8, Daniel 286.6, Maya 309.8, Nora 251.2. |
| Preload | — | `montserrat-7.woff2` is fetched at 12–32ms on a cold load (headless). **But see N44.** |

**Fresh sweep, held → arrived (cloth), with the faces loaded:**
- **Home:** 662.6 / 593.1 ×3 / 355 / 363.8 ×2 / 523.8.
- **Archive:** 416.4 ×4 / 384.1 ×3 / 553.
- **Person 5aa5:** 192.6 ×4 / 256.3 / 257.6 ×2 / 370.9.
- **Talk:** 162 ×4 / 182.2 ×3 / 262.4.
- **Book:** 297.3 ×4 / 201.8 ×3 / 290.6.
- **Account and Write:** 96 ×4 / 104 ×3 / 149.8.

That is 0 dips, every sheet inserted at opacity 0 and y 56, and `body.scrollWidth` equal to the window everywhere.

## Gaps

### N44. POLISH: the Montserrat preload covers one weight of four, and the same file is fetched under four URLs, so the cloth's text can still set in fallback metrics on a first visit
**Skill:** impeccable polish ("test… font loading"; layout shift); emil (perceived performance); the ±2px aim of N27.

**Measured:**
- **The files:** `montserrat-1/3/5/7.woff2` are byte-identical (md5 311d…), and so are `-0/2/4/6` (d16d…). Each pair is one variable font, declared once per weight under a different URL.
- **A cold headless load of the wall:** `-7` (preloaded) arrives at 12–32ms, `-1` (400) at 257–312ms, and `-5` (600) at 4888–5607ms, when the arrived wall first uses 600. That is the same bytes three times.
- **In the pane:** one sweep caught a skeleton in fallback metrics:
  - Archive at 375 and 390: 395.4 → 396.1 → 416.4, still in the skeleton. The stats labels are Montserrat 500 and two lines.
  - Home at 320: 630.8 → 662.6. The question is Source Serif 4.
  - On a re-run with every face already loaded at the first sample, both held exactly (416.4 and 662.6).
- **The hero's text is all self-hosted:** Montserrat 500/600/700 and Source Serif 4 (Home's question). No Google face is in a loading hero.

**Where:** `public/fonts/montserrat.css` (eight `@font-face` blocks) and `index.html:12`.

**Change:**

| Before | After | Why |
|---|---|---|
| Four `@font-face` per range, one per weight, each with its own URL | Two blocks, latin and latin-ext, each `font-weight: 400 700` with one URL (`montserrat-1.woff2` and `-0`). Delete the duplicates. | One download serves every weight, and the existing preload then covers all of them |
| Preload `montserrat-7.woff2` | Preload `montserrat-1.woff2` (the merged latin file), and Source Serif 4's latin regular (fonts.css) | Home's held question sets in Source Serif |
| (check) | A fresh-profile cold load of Home (320) and Archive (390): the first skeleton sample equals the arrived height | |

### N45. UGLY: at 320 and 360 the public wall's counts line arrives in three lines against the two the waiting cloth holds, so the standing sheet is pushed 20px down
**Skill:** hallmark (the skeleton is the page's shape; 320 and 360 are must-render widths); emil (jarring changes); BAOS 23a and 42.

**Measured** (headless, function held back 2.5s, cold and warm alike, cloth wait → real):
- 320: 406 → 425.8.
- 360: 406 → 425.8.
- 375, 389, 390 and 414: 406 → 406.3.
- 1366: 302 → 301.7.

The counts line is 59px (three lines) at 320 and 360, and 39px (two lines) from 375: "8 memories · 2 chapters · 1 from the family · shared by the family, for anyone with the link". The wait hero holds three fixed hairlines (`wall-sk-hl`), and since round 12 the sheet stays and only the inside rises, so the 20px shows as the sheet moving.

**Where:** `pages/Wall.tsx:274–278` (the held lines) and `:400–404` (the counts); `book-account.css:759`.

**Change:**

| Before | After | Why |
|---|---|---|
| The counts line wraps by its own length | Below 375px, set "shared by the family, for anyone with the link" as its own line (`display: block`), and give `.wall-counts` and the wait hero's counts line the same `min-height: 3lh` there | Both then hold three lines on the narrow phones, whatever the counts |
| (or) | Shorten the tail on phones ("shared by the family") so it stays two lines from 320 | |
| (check) | 320, 360, 375 and 390, held 3s: wait cloth equals real cloth | |

## Notes (not gaps)

- **The Start canvas:** `html:has(.wall-bench, .start)` also matches Start's own skeleton (`.start.start-skel`), so the canvas is cloth from the first paint. `.wall-bench` is used only by the not-shared and not-found bench (Wall.tsx:242, Placeholder.tsx:12), never by the real wall.
- **Self-hosting the Google faces** (Cormorant Garamond, EB Garamond, Mrs Saint Delafield, Caveat). Yes, a note to the lead is worth it, for four reasons:
  1. **They can't be preloaded:** the font URLs come from Google's CSS, which is itself a render-blocking stylesheet on a second origin.
  2. **They set the sheet's own headings:** the Account section heads, the plate name, Talk's card question and words heading, and the book. A late swap there reflows the sheet (not the cloth) on a first visit.
  3. **Privacy:** every visitor's address goes to Google on every first load. For a family archive and a public wall, keeping everything on our own origin is the cleaner promise.
  4. **Metrics:** with the files local, matched fallback metrics (`size-adjust`, `ascent-override`) can make a swap shift-free.

  This is not needed for the loading heroes, which use only self-hosted faces.
- **Earlier notes still standing:** Talk's phone words column (351 against 342.9); and, for a first load of the day, Home at 320 falls back to its sample question (630.8 against 662.6).

## Skill by skill

- **taste-skill:**
  - Gap: N45 (the public wall's first screen on a phone).
  - Passes:
    - The cloth reaches every edge, the 404s and Start included.
    - The task wraps whole.
- **hallmark:**
  - Gap: N45 (the skeleton isn't the shape at 320 and 360).
  - Passes:
    - No clipped text at 320–400.
    - The sample family is exact.
    - No two-line buttons.
- **emil-design-eng:**
  - Gap: N45.
  - Passes:
    - No sideways jog.
    - One sheet, one rise.
- **impeccable:**
  - Gap: N44 (font loading as a layout-shift source).
  - Passes:
    - The scrollbar track is themed from the palette on the cloth pages.
    - Storage is wrapped.
- **GSAP:** no gap: 0 dips, and from-states at insertion.

## Housekeeping

- **Pane:** I worked only in `tab-211`. I removed every iframe and my helpers. I reset the viewport to desktop and closed the tab.
- **Nothing written:**
  - I didn't sign out, touch `astory-app-auth`, or press any control.
  - The page-memory keys are unchanged (`public`, `1`, today's question).
  - Loading /talk and /plans queued their usual view events.
- **Playwright:** headless, signed out, fresh contexts.
- **Scripts and shots:** in my scratchpad, `r14s/` (`cold.mjs`, `warm.mjs`, `warm2.mjs` and the 1920 right-edge shots). Nothing was saved to `docs/agents/reviews/shots/`.
