# Skills Steward: Book, Plans, Account, Talk, Start and Wall, round 16

**Verdict: GAPS (0 blockers, 1 ugly, 1 polish).** It is close, but this isn't the final pass.

- **N46 is fixed.** At 320 and 360 every count stays whole. The wait and the arrival agree to 0.3px at 320, 360, 375, 390, 414, 500, 600 and 1024–1366.
- **The signed-in pages are done.** On the spot-check, every held hero equals its arrival across the group, with no sideways jog.

Two wall faults showed up when I widened the check past the phone and desktop widths:
- **N48 (ugly):** at the tablet widths the wall's counts line doesn't match what the waiting cloth holds, so the standing sheet moves about 20px. At 760 it moves up (406 → 386.7); at 800 it moves down (302 → 321.3). Round 15's fix pinned the line count below 375 only. Earlier rounds, mine included, timed the wait state at phone and desktop widths and never at 760 or 800.
- **N47 (polish):** at 375 and 390 the "·" before "shared by the family" ends the first line. It is the stranded separator that N39 removed from Person's subline.

## How this was checked

- **Read:** the diff of 6d0cb51 (Wall.tsx:398–408). Each count is now a `.nw` span carrying its own dot. The tail's dot (`.wall-counts-dot`) is still a separate inline " · ".
- **Headless Edge** (Playwright, signed out, fresh contexts, real scrollbars):
  - **The wait state:** the wall's function was held back 3s at 320, 360, 375, 390 and 1366, and 200ms at 414, 500, 600, 760, 800 and 1024. I traced the cloth on each frame.
  - **The counts' lines:** I grouped each text node's client rects by line top.
  - **Shot:** `r16s/wall-320-hero.png`.
- **My own pane tab** (`tab-218`, now closed, viewport reset): a held → arrived spot-check of 12 page and size pairs, then 21 repeat loads of Home at 320 and 390. The app's writes to the three page-memory keys were swallowed, and the keys are unchanged.

## N46, checked

**Fixed.** The counts' lines, measured:

| Width | Counts | Tail | Cloth, wait → real |
|---|---|---|---|
| 320 | "8 memories · 2 chapters", then "· 1 from the family" | its own line | 426 → 425.8 (58.8px, three lines) |
| 360 | "8 memories · 2 chapters · 1 from the family" | its own line | 426 → 425.8 |
| 375, 390 | one line | second line | 406 → 406.3 |
| 1366 | one line with the tail | — | 302 → 301.7 |

No count breaks inside itself at any width. `body.scrollWidth` equals the window throughout.

## The group, spot-checked (held → arrived, cloth)

| Page and size | Held → arrived |
|---|---|
| Home 320 | 662.6 → 662.6 (×9) |
| Home 390 | 593.1 → 593.1 (×14) |
| Home 1920 | 363.8 → 363.8 |
| Archive 390 | 416.4 → 416.4 |
| Archive 2560 | 553 → 553 |
| Person 5aa5 at 390 | 192.6 → 192.6 |
| Sample Edith at 320 | 274.5 → 274.5 |
| Talk 1600 | 182.2 → 182.2 |
| Talk 390 | 162 → 162 |
| Book 1366 | 201.8 → 201.8 |
| Account 360 | 96 → 96 |
| Write 1366 | 104 → 104 |

- `clientWidth` was constant during every load, and `body.scrollWidth` equals the window.
- **One unexplained event:** on the first Home 390 load the sheet's opacity read a dip. In 21 repeats (13 traced frame by frame), every load rose once (0 → 1 in about 470ms) with no dip. I couldn't reproduce it. Commits were landing in the repo at the time, so a dev reload is the likeliest cause. I note it rather than count it.

## Gaps

### N48. UGLY: at the tablet widths the wall's counts set a line more or less than the waiting cloth holds, so the standing sheet moves about 20px on arrival
**Skill:** hallmark (the skeleton is the page's shape); emil (jarring changes); BAOS 23a and 42. This is the same class as N45, at the widths between the phone and desktop rules.

**Measured** (headless, function held back, cloth wait → real; counts height):

| Width | Wait | Real | Counts | Sheet |
|---|---|---|---|---|
| 600 | 406 | 406.3 | 39.2 (two lines) | 0 |
| 760 | 406 | **386.7** | 19.6 (one line; the phone wait holds two) | **19px up** |
| 800 | 302 | **321.3** | 39.2 (two lines; the desktop wait holds one) | **19px down** |
| 1024 | 302 | 301.7 | 19.6 | 0 |

At 800 the line breaks inside the tail, before ", for anyone with the link". The 760 to 1000 band covers portrait tablets (768, 800, 820 and 834).

**Where:**
- `book-account.css`: the wait hero's hairlines, and `.wall-counts`, which only has the `@media (max-width: 374.98px)` rule.
- `pages/Wall.tsx:398–408`.

**Change:**

| Before | After | Why |
|---|---|---|
| The counts' line count is pinned only below 375 | Pin it in every band. Make the tail its own line wherever the counts and the tail can't share one (at least 375–1100), give `.wall-counts { min-height: 2lh }` there, and give the wait hero's counts hairline the same two lines (39px) in that band | Then the wait and real lines agree whatever the counts and the width |
| (check) | 600, 760, 768, 800, 834, 1024 and 1100, function held back: wait cloth equals real cloth | |

### N47. POLISH: at 375 and 390 the dot before the tail ends the first line ("… 1 from the family ·")
**Skill:** taste-skill critique pass 6 (line breaks), and the rule N39 settled: a separator travels with the part it introduces.

**Measured:**
- 375 and 390: line 1 is "8 memories · 2 chapters · 1 from the family ·" and line 2 is "shared by the family, for anyone with the link".
- 414 and 500 break inside the tail instead.

**Where:** `pages/Wall.tsx:405–407`. `.wall-counts-dot` (" · ") is a separate inline before "shared by the family".

**Change:**

| Before | After | Why |
|---|---|---|
| `<span className="wall-counts-dot"> · </span>shared by the family` | ` <span className="nw"><span className="wall-counts-dot">· </span>shared by the family</span>`, so the dot and the tail's first words wrap together. Below 375 the tail is its own line and the dot is already hidden. | No line ends on a separator |

## Final word

The signed-in Book group (Book, Plans, Account, Talk, Start, and the loading frames on Home, Archive, Person and Write) passes every skill this round:
- held equals arrived at every measured width;
- one rise;
- no sideways movement;
- no clipped or split text;
- fonts in before the first paint.

What's left is the public wall's counts line at the tablet widths (N48) and one stranded dot (N47). Both are small, local changes in Wall.tsx and its counts CSS. With them in, I'd expect APPLIED. The re-check needs only the wall's wait state at about eight widths.

## Housekeeping

- **Pane:** I worked only in `tab-218`. I removed every iframe and my helpers. I reset the viewport to desktop and closed the tab.
- **Nothing written:**
  - I didn't sign out, touch `astory-app-auth`, or press any control.
  - The page-memory keys are unchanged (`public`, `1`, today's question).
  - Loading /talk queued its usual view event.
- **Playwright:** headless, signed out, fresh contexts.
- **Scripts and shots:** in my scratchpad, `r16s/` (`w.mjs`, `w2.mjs` and `wall-320-hero.png`).
