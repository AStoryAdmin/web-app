# Skills Steward: Book, Plans, Account, Talk, Start and Wall, round 17

**Verdict: APPLIED.**

285535a fixes N47 and N48:
- The wall's waiting cloth now equals the arrived cloth to 0.0px at all 15 widths, for the real counts and for four stand-in sets of counts, from the fewest to the largest I could set.
- No line ends on a separator, and no count splits.

With round 16's spot-check of the signed-in pages, the Book group (Book, Plans, Account, Talk, Start, the wall, and the shared loading frames on Home, Archive, Person and Write) now meets every skill I check: taste-skill, hallmark, emil-design-eng, impeccable and the GSAP skills.

## How this was checked

- **Read:**
  - The diff of 285535a.
  - `WallCounts` (Wall.tsx:254–285), used by both the arrived hero and the waiting hero.
  - The waiting hero's held words (Wall.tsx:305–316).
  - The counts' bands in book-account.css: two lines up to 760, one line from 761 to 1100, and the tail inline with its dot glued from 1101. The ruled held words are at 1009–1012.
- **Headless Edge** (Playwright, signed out, fresh contexts, real scrollbars, the wall's function held back 3s):
  - **15 widths:** 320, 360, 375, 390, 414, 500, 600, 760, 761, 800, 1024, 1100, 1101, 1366 and 1920.
  - **The trace:** the cloth and the sheet's opacity on each frame, from the waiting hero to the arrived one.
  - **After arrival:** I measured the cloth with the real counts (8 memories, 2 chapters, 1 from the family). Then I put four other sets into `.wall-counts-nums` in my own page's DOM:
    - **worst:** 120 memories, 12 chapters, 14 from the family;
    - **big:** 999 / 99 / 99;
    - **min:** "1 memory" alone;
    - **two:** 8 / 2 / 0.
  - **The lines:** each text node's client rects, grouped by line, checked for a line ending in "·".
  - **Shots of the waiting hero:** `r17s/wait-390.png` and `wait-1366.png`.
  - Accessibility of the held words.

## N47 and N48

**Cloth, wait → arrived**, with the real counts and each stand-in set:

| Width | Wait | Real | Worst | Big | Min | Two | Lines (real / worst) |
|---|---|---|---|---|---|---|---|
| 320 | 425.8 | 425.8 | 425.8 | 425.8 | 425.8 | 425.8 | 3 / 3 |
| 360 | 425.8 | 425.8 | 425.8 | 425.8 | 425.8 | 425.8 | 2 / 3 |
| 375 | 425.8 | 425.8 | 425.8 | 425.8 | 425.8 | 425.8 | 2 / 3 |
| 390 | 425.8 | 425.8 | 425.8 | 425.8 | 425.8 | 425.8 | 2 / 2 |
| 414 | 425.8 | 425.8 | 425.8 | 425.8 | 425.8 | 425.8 | 2 / 2 |
| 500 | 425.8 | 425.8 | 425.8 | 425.8 | 425.8 | 425.8 | 2 / 2 |
| 600 | 425.8 | 425.8 | 425.8 | 425.8 | 425.8 | 425.8 | 2 / 2 |
| 760 | 425.8 | 425.8 | 425.8 | 425.8 | 425.8 | 425.8 | 2 / 2 |
| 761 | 321.3 | 321.3 | 321.3 | 321.3 | 321.3 | 321.3 | 2 / 2 |
| 800 | 321.3 | 321.3 | 321.3 | 321.3 | 321.3 | 321.3 | 2 / 2 |
| 1024 | 321.3 | 321.3 | 321.3 | 321.3 | 321.3 | 321.3 | 2 / 2 |
| 1100 | 321.3 | 321.3 | 321.3 | 321.3 | 321.3 | 321.3 | 2 / 2 |
| 1101 | 301.7 | 301.7 | 301.7 | 301.7 | 301.7 | 301.7 | 1 / 1 |
| 1366 | 301.7 | 301.7 | 301.7 | 301.7 | 301.7 | 301.7 | 1 / 1 |
| 1920 | 301.7 | 301.7 | 301.7 | 301.7 | 301.7 | 301.7 | 1 / 1 |

- **N48 (ugly), fixed.** The counts hold a fixed number of lines in every band, whatever the numbers. Round 16's misses at 760 (406 → 386.7) and 800 (302 → 321.3) now hold exactly.
  - On every load the trace reads `wait … op1.0` → `real … op1.0` with the same height: one sheet, no movement.
  - `body.scrollWidth` equals the window at all 15 widths.
- **N47 (polish), fixed.** No line ends in "·" at any width or with any counts.
  - Below 1101 the tail is its own line, without its dot: "shared by the family, for anyone with the link", or "shared by the family" below 375.
  - From 1101 the tail's dot is glued to "shared by the family", and the line reads whole: "120 memories · 12 chapters · 14 from the family · shared by the family, for anyone with the link" on one line at 1101.
  - At 320 the worst case reads "120 memories · 12 chapters", then "· 14 from the family", then "shared by the family". Every count stays whole.
- **The waiting hero's held words** are inside an `aria-hidden` hero, so the page still has one `h1` for a screen reader. They draw as hairlines on the cloth under the ring: one under the name, one under the line about them, and one per counts line.

## Notes (not gaps)

- **The name and the line about them** aren't known until the story arrives. The waiting hero holds a one-line name and "A life, in their own words.". A long name that wraps to two lines would still grow the cloth on arrival. That is the same unknowable as a person's two-line name, and the founder's wall ("Bao Vo.") holds exactly.
- **At 390 the hairline under the held intro barely shows.** Its 1px rule falls on a half pixel (a 27.55px line box) and splits into two faint rows at 1x. The name's and the counts' rules show. This is a 0.5–3s loading state and nothing moves, so it isn't counted. Rounding the rule's offset to a whole pixel would make it as clear as the others.
- **Still standing from earlier rounds, all minor:**
  - Talk's phone words column (351 against 342.9 held);
  - Home at 320 holding its sample question on the day's first load;
  - the sample family's preview being development only.
- **Self-hosting the Google faces** waits on the founder's OK, as agreed, and isn't counted.

## Skill by skill

- **taste-skill:** passes.
  - Every held hero equals its arrival at every width measured.
  - The wall's phone hero reads in whole phrases.
  - No headline runs past two lines.
- **hallmark:** passes.
  - Every skeleton is the page's shape, the wall at 15 widths included.
  - No horizontal scroll.
  - No clipped or split text.
  - No two-line buttons.
- **emil-design-eng:** passes.
  - One rise, with no sheet movement or sideways jog on arrival.
  - Ease-out throughout, and nothing new on a frequent action.
- **impeccable:** passes.
  - Fonts are in before the first paint.
  - Browser surfaces (scrollbar track, canvas) are themed.
  - Storage is wrapped, with safe defaults.
  - tsc and eslint are clean (round 16).
- **GSAP:** passes.
  - Layout-effect arrivals with `mm.revert()` cleanup.
  - From-states at insertion, 0 dips and no tween left running.

## Housekeeping

- **No pane tab was needed this round.** Everything here is the public wall, measured headless.
- **Nothing written:** I didn't sign in or out, and I wrote no storage. The stand-in counts changed only my own headless page's DOM.
- **Playwright:** headless, signed out, fresh contexts.
- **Scripts and shots:** in my scratchpad, `r17s/` (`w.mjs`, `shot.mjs`, `dbg.mjs`, `wait-390.png` and `wait-1366.png`).
