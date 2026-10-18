# Skills Steward: Book, Plans, Account, Talk, Start and Wall, round 15

**Verdict: GAPS (0 blockers, 0 ugly, 1 polish).**

5418b49 fixes N44 and N45:
- **N45:** the wall's waiting cloth now equals the arrived cloth at 320, 360, 375, 390 and 1366, to 0.3px, with the function held back 3s.
- **N44:** Montserrat is one file per range, loaded once, with every weight measuring exactly as before. The preloaded faces are in before the first skeleton paints. Home at 320 and the Archive at 375 and 390 held exactly on 12 of 12 loads, with Talk at 1366 on 4 of 4.

One small thing is left:
- **N46 (polish):** on the narrow phones the counts line now breaks inside a count. At 320 it reads "8 memories · 2 chapters · 1 from / the family / shared by the family". Each count should stay whole.

The Google faces aren't counted this round, as you asked.

## How this was checked

- **Read:**
  - The diff of 5418b49: index.html, montserrat.css, Wall.tsx:400–408 and book-account.css:760–767.
  - `fonts.css`, to map `c1df4596be502923.woff2`: Source Serif 4, latin, normal, used for both 400 and 500.
  - The deleted files' md5s against `montserrat-1.woff2`: all identical.
  - Every `font-weight` and `font:` weight in `src/styles`: only 400, 500, 600 and 700 are used, all inside the new `400 700` range.
- **Skills:** as in rounds 11–14, including impeccable polish's font-loading and line-break checks, and taste-skill pass 6 (line breaks).
- **Static:** tsc and eslint (Wall) are clean.
- **Headless Edge** (Playwright, signed out, fresh contexts with a cold cache, real scrollbars):
  - **Weights:** on the app's origin, I set the same string in the new range face and in a rebuilt old-style face (one weight per `@font-face`, the same bytes), at 400, 500, 600 and 700, and compared widths.
  - **The wall's wait state** (the function held back 3s) at 320, 360, 375, 390 and 1366. I traced the cloth on each frame, with the loaded faces and the font resources' timings. There is a hero shot at 320 (`r15s/wall-320-hero.png`).
- **My own pane tab** (`tab-217`, now closed, viewport reset):
  - **Loads:** Home at 320, the Archive at 390 and 375, and Talk at 1366, four times each, with a cache-buster on the page URL.
  - **At every distinct skeleton height:** I recorded the cloth and the load state of each Montserrat and Source Serif face, and listed the font resources.
  - **Storage:** the app's writes to the three page-memory keys were swallowed in my frames. The keys are unchanged.

## N44 and N45, checked

| # | Round 14 | Now |
|---|---|---|
| N45 | The wall's counts set three lines at 320–360 against two held, so the sheet moved 20px | **Fixed.** Wait → real: 426 → 425.8 at 320 and 360, 406 → 406.3 at 375 and 390, and 302 → 301.7 at 1366. Below 375 the counts are 59px (three lines) with the tail on its own line, and the held third hairline is 59px. `body.scrollWidth` equals the window at every width. **One typographic remainder: N46.** |
| N44 | The preload covered one weight; the same file was fetched under four URLs | **Fixed.** See below. |

**N44 in detail:**
- **Every weight renders as before.** The text widths in the new face match the old per-weight scheme to the hundredth of a pixel: 1152.41 at 400, 1169.28 at 500, 1188.67 at 600 and 1209.55 at 700, in both. The app uses no other weight.
- **One download.** On a cold headless load, `montserrat-1.woff2` and `c1df4596be502923.woff2` are fetched at 8–31ms, once each, and nothing else for Montserrat. Round 14 fetched `-1` at about 260ms and `-5` at about 5s, as well as `-7`. The latin-ext file isn't fetched, because nothing needs it.
- **Loaded before the first paint.** On the wall's first waiting frame (565–594ms) the Montserrat range face reads `loaded`, at every width.
- **Home and the Archive in the pane:**
  - **Home 320:** first skeleton 662.6 → arrived 662.6 on 4 of 4 loads. Montserrat latin and Source Serif's latin 400 (the question) are `loaded` at the first skeleton sample.
  - **Archive 390 and 375:** 416.4 → 416.4 on 4 of 4 each, Montserrat loaded at the first sample.
  - **Talk 1366:** 182.2 → 182.2 on 4 of 4.
  - Every load had one skeleton height and 0 dips.
- **What this can't prove:** a truly cold signed-in profile. In the pane the font files revalidate from cache (transfer size 300B), although the preload request still starts at 6–11ms. A fresh profile would need a sign-in, which I don't do. The headless cold loads cover the same files on the same origin and show them loaded by the first paint.

## Gap

### N46. POLISH: below 375px the wall's counts break inside a count ("1 from / the family")
**Skill:** taste-skill critique pass 6 (line breaks); impeccable polish ("test… wrapping"). The same rule as Person's subline: each part stays whole.

**Measured** (`r15s/wall-320-hero.png`, 320):
- The counts set as "8 memories · 2 chapters · 1 from", then "the family", then "shared by the family".
- At 360 the line is also three lines (59px).
- With bigger counts, a phrase could also push to a fourth line, past the 3lh the cloth holds.

**Where:** `pages/Wall.tsx:401–403`. The counts are plain text joined with " · ".

**Change:**

| Before | After | Why |
|---|---|---|
| `{memories(count)}{… ` · ${n} chapters`}{… ` · ${family} from the family`}` | Wrap each count in `<span className="nw">`, with the " · " outside it (or glued to the next count, as Person's subline does) | "1 from the family" never splits, and the counts take at most two lines above the tail |
| (check) | 320 and 360: wait equals real, and no count is split | |

## Notes (not gaps)

- **Below 375 the tail drops ", for anyone with the link"**, so it reads "shared by the family". The meaning holds, and the shorter line suits the phone.
- **Not counted this round, as asked:** self-hosting the Google faces (Cormorant Garamond, EB Garamond, Mrs Saint Delafield, Caveat). It waits on the founder's OK.
- **Earlier notes still standing:** Talk's phone words column (351 against 342.9), and Home at 320 falling back to its sample question on a day's first load.

## Skill by skill

- **taste-skill:**
  - Gap: N46 (a split phrase on the public wall's phone hero).
  - Passes: every held hero equals its arrival.
- **hallmark:**
  - No gap.
  - Passes:
    - The wall's wait state is the page's shape at 320–1366.
    - No clipped text.
    - No horizontal scroll.
- **emil-design-eng:**
  - No gap.
  - Passes:
    - No sheet movement on arrival.
    - Fonts are in before the first paint.
- **impeccable:**
  - Gap: N46.
  - Passes:
    - Font loading is no longer a layout-shift source for the loading heroes.
    - One file per range.
    - tsc and eslint are clean.
- **GSAP:** no gap: 0 dips, and from-states at insertion.

## Housekeeping

- **Pane:** I worked only in `tab-217`. I removed every iframe and my helpers. I reset the viewport to desktop and closed the tab.
- **Nothing written:**
  - I didn't sign out, touch `astory-app-auth`, or press any control.
  - The page-memory keys are unchanged (`public`, `1`, today's question).
  - Loading /talk queued its usual view event.
- **Playwright:** headless, signed out, fresh contexts.
- **Scripts and shots:** in my scratchpad, `r15s/` (`t.mjs` and `wall-320-hero.png`). Nothing was saved to `docs/agents/reviews/shots/`.
