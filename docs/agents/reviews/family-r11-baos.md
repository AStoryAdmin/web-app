# Bao's Standard: Family (/family) and Person (/family/:personId), round 11

**FAIL**, on one item, and it is not Family's own code.

Round 11's work passes:
- **Round-10 note 1 is fixed.** The shell keeps its navigation at 760.5px.
- **Round-10 note 2 is fixed.** The stacked tree now ends flush, and 1100 measures the same as 1099 to the pixel.
- **The `.tp-name` label is right** at 320, 390, 800, 1100 and 1366.
- **The fresh pass** at 1366, 1920, 2560, 800 and 390 found no regression on Family or on any Person page.

**The fail:** when the top bar condenses on scroll, its four place links shrink to 38.4px tall. That breaks the checklist's 44px floor at 1366, 1920 and 800, on every signed-in page, these two included. It predates this round (5a4c3c1, 17 October). Round 10 missed it because I measured the bar only at rest. It is a one-line fix in `astory.css`.

## Findings

1. **The condensed top bar's place links are 38.4px tall, under the 44px touch floor.**
   - **Where:** `src/styles/astory.css`, two rules that stack:
     - line 3718, `.top.stuck .pillnav a { min-height: 40px; }`;
     - line 3452, `.top.stuck .pillnav { transform: scale(0.96); }`.
     - At rest, line 3717 gives the links 44px.
   - **Sizes:** 1366×768, 1920×1000 and 800×1024. At 800 the pill nav is shown, so this is a touch tablet. At 2560 the html zoom of 1.3 lifts the links to about 50px, so that size passes.
   - **Evidence:**
     - On `/family/sample-maya?preview=tree`, scrolled to 600 with frames drawn, the bar is `top on-dark stuck`, 56px tall. The pill's transform is `matrix(0.96, …)`. Home, Archive, Family and Book each measure 38.4px tall.
     - At 800, scrolled to 500, the same four links measure 38.4px.
     - The bar's other controls stay at 44: Storyteller 44, Add 44, Account 44×44, and the wordmark 44.
     - Captures: `tool-results/mcp-Claude_Browser-blob-1792315806691-prltkh.png` (1366, condensed) and `tool-results/mcp-Claude_Browser-blob-1792316036258-epx4t6.png` (800, condensed).
   - **Rules:** the section 6 checklist (every interactive element has a touch target of at least 44px), and rule 24 (the bar follows you, so it is the bar people use mid-page). Rule 1 applies too: it is on every signed-in page.
   - **Fix:** delete line 3718 so the links keep 44px. Either drop the 0.96 scale on the condensed pill, or give the links `min-height: calc(44px / 0.96)`. The 56px bar has room for either.

## Round 10, item by item

| # | Round-10 note | Verdict | Evidence |
| --- | --- | --- | --- |
| Note 1 | The shell dropped all navigation between 760 and 761px | **Fixed** | The 661617f sweep moved the shell's bounds to `760.98px`, `900.98px` and `1100.98px` (`astory.css:531/536/541` and the rest). No integer `max-width` remains that meets a `min-width` one pixel above it. I probed same-origin iframes of `/family/sample-rose?preview=tree`, measuring the bar (`.tabbar`, `.pillnav`) at each width. **760:** tab bar 745×69, with Home, Archive, Family and Book. **760.5:** `(max-width: 760.98px)` matches, and the tab bar is 745×69 with all four places. **761:** the pill nav is 326×51 with all four. **850, 900.5 and 901:** the pill nav is 326×51. **1100.5:** the pill nav. Every width has one way to every place. |
| Note 2 | The stacked tree's last generation kept its 32px bottom padding | **Fixed** | `.tp[data-stack] .tp-tier:last-child { padding-bottom: 0; }` (`family-people.css:693`). Both widths were measured fresh, with fonts settled and `__gsap.ticker.tick()` stepped. **1100 (`data-stack="1"`, 0 paths):** the plate is 281–1539, the last tier ("Not placed yet") is 1356–1539 with `padding-bottom: 0px`, and Nora's node ends at 1539. The rail ends at 1515, 24px above her, and "Where to next" starts at 2119. **1099 (band):** plate 281–1539, rail 1515, Nora 1539, "Where to next" 2119. The two are identical. |
| Note 3 | 2560 snug threads | **Open, ruled for the founder** | `/family?preview=tree` at 2560 is `data-snug="1"`, size `n`, 0 paths. Not counted. |

## The `.tp-name` label (97d3524)

The decade and the generation's name are now one `.tp-name` item. On the grid (1366 and up) it is a block, with the decade above the name. Wherever the label wraps (≤1099.98, and stacked), it flows as one line of text, with the decade 10px before the name.

| Width | Layout | What it measures (sample tree) |
| --- | --- | --- |
| 1366 | Grid column, threaded, 11 paths, size `t` | "1910s" 74–220 (y 304–317) sits above "Rose's parents" (y 321), and "Rose's grandparents" is below at y 344–388. Every generation follows the same order: decade, name, then "and Margaret's" under "Rose's children". Unchanged from round 10. |
| 1100 | Stacked, 0 paths | "1910s" 65–101, then "Rose's parents" 111–209 (10px gap). "Rose's grandparents" follows at 221 (12px gap) on the same line. "1960s Rose's children and Margaret's" runs 65–323 on one line. |
| 800 | Band | "1910s" 56–92, then "Rose's parents" 102–199 (10px). "Rose's grandparents" follows at 211 (12px) on the same line. |
| 390 | Band, phone | "1910s" 50–86 and "Rose's parents" 96–193, with "Rose's grandparents" at 205 on the same line. "1960s Rose's children and Margaret's" runs 50–307 on one line, and "a child" wraps under it at x 50. |
| 320 | Band, phone | "1910s Rose's parents" stays on one line (50–193), and "Rose's grandparents" wraps under it at x 50. No decade is ever alone. "1960s Rose's children and" fills line 1 (50–236), and "Margaret's" wraps back to x 50. See note 1. |

The real family has no decades. `.tp-name` holds only the name there: at 320, "Your parents and Nhi Tran's" is one line, and "Your generation" has "a child" beside it at 172.

## Fresh pass

**Pages:**
- `/family` (the real family) and `/family?preview=tree`.
- Person pages: Bao Vo (5aa5a1cf…) and Ty Ngo (36cfd520…), plus `sample-rose`, `sample-claire`, `sample-mark` and `sample-maya`, all with `?preview=tree`.

**Sizes:** 1366×768, 1920×1000, 2560×1300 (`--zoom` 1.3000), 800×1024 and 390×844. Every page was checked at every size: 40 loads, each fresh.

| Check | Result |
| --- | --- |
| Horizontal scroll | None. scrollWidth equals clientWidth on every page and size. |
| Overlapping text | None that shows. The pairwise check of text ranges flagged hits only on phone Person pages (Bao, Rose and Claire at 390). Each one was a two-line clamped excerpt (`.pp-words`, `-webkit-line-clamp: 2`, `overflow: hidden`) whose hidden third line lies under the next title or "Told by". The visible box ends first: "The waltz" excerpt ends at 1919 and "Told by Claire Doyle" starts at 1935, which the capture confirms. |
| Clipped text | None. The only clip is the cloth's `.lamp` light, an `aria-hidden` decoration 1100px wide that the cloth crops by design, plus the sr-only loading line. |
| Text under 12px | None. |
| Targets under 44px | None at rest. Condensed bar: finding 1. |
| Faded after the motion settled | Only `.tp-cap` (the hover captions), the sample's disabled "Invite someone" (0.65, `aria-disabled`) and `.rh-sec` on Claire (the running head's section word, which crosses in on scroll). All are by design. Below-fold `[data-rise]` rows rise when scrolled into view: "Rose, as the family remembers" went from 0 to 1 once in view, without frames (`lib/arrive` heartbeat). |
| "Where to next" | Every page ends with it. |
| Tree, 1366 and 1920 | Sample: threaded, size `t`, 11 paths, no stack. Real family: 2 paths, size `n` at 1366 and `l` at 1920. |
| Tree, 2560 | Sample: snug, size `n`, 0 paths (ruled open). Real family: size `l`, 2 paths. |
| Tree, 800 and 390 | Band, 0 paths. At 390, "a child" lifts to the heading's edge at x 50, and the rows are Anne & Mark, then Daniel and Claire. |
| Person pages, 1366, 1920 and 2560 | The plate is in the side column and the kept line heads the main column. **1366:** Rose 615–1108 in 448–1275, plate 44–384. **1920:** Rose 652–1198 in 465–1829. **2560:** Rose and Bao 883–1592 in 607–2446. Mark and Maya fit one screen at 1920 and 2560 (scrollHeight = viewport). |
| Person pages, 800 | The slim plates are as wide as their words, and every card starts at x 26: Rose 26–408, Claire 26–403, Mark 26–371 and Maya 26–320. The kept line is 26–518. Bao's and Ty's plates are full width (26–759), as before. |
| Person pages, 390 | The plate and the kept line share x 24–370. |

**Rules 32–46 hold as in round 10:**
- The kept line as the takeaway.
- Bond's empty state on Mark, Maya and Ty, with the minutes and one action.
- "Where to next" on every page.
- The cloth hero with its foil full stop.

## Notes, not counted

1. **At 320 the label breaks inside "and Margaret's".**
   - **What:** line 1 ends "…Rose's children and", and "Margaret's" starts line 2 alone at x 50. The `.tp-also` text is inline, so it wraps between its own words.
   - **Why not counted:** 320 is under the four sizes, it reads correctly, and at 390 the whole label fits on one line.
   - **Fix:** in the wrapping layouts (≤1099.98 and `[data-stack]`), set `.tp-also { white-space: nowrap; }` so the phrase moves as one piece.
2. **`<span class="tp-name">` wraps an `<h3>`.**
   - A span may only hold phrasing content. The browser and the accessibility tree are unaffected: the h3 is still a heading, and the span is `display: block`.
   - **Fix:** make it a `<div>` for valid markup.
3. **At 2560 the sample tree draws no gold threads in snug mode.** Ruled open for the founder.
4. **Known:** the founder's test content (Ty Ngo as "Nhi Tran's parent", the two Nhis, friends in "Your generation", "Ty Ngo & Bao.") and Bond's painterly style.
5. **A frameless tab.**
   - My first captures came back blank, and two Person loads at 800 were still on "Opening the book…" after 3.5s. Each was rerun and measured settled.
   - A first 1099/1100 read of the plate came out 17px longer at both widths (1556). It settled to 1539 at both on fresh loads with fonts ready. The two widths agreed in every read.
6. **Bao's plate at 800 is still full width** (round 9's note: `slim` is keyed on "no actions"). It holds under rule 10.
7. **Another session's uncommitted work was live during this review:** `src/lib/zoom.ts` (adds `RESIZED_EVENT`), the auth pages and `signed-out.css`. None of it touches Family or Person. The zoom at 2560 read 1.3000, as before.

## How I checked

- **My own pane tab (tab-150).** I sized it per width and loaded every page fresh. Before each measurement I stepped `window.__gsap.ticker.tick()` and `__st.update()`, scrolled through the page with a dispatched scroll event so below-fold rows rose, and returned to the top. Most loads also had a tiny capture to force frames.
- **Code read:**
  - the 97d3524 diff (FamilyTree.tsx `.tp-name`; family-people.css round-11 block);
  - the 661617f shell sweep: a grep of every integer `max-width` / `min-width` pair left in `src/`;
  - `astory.css:531–560`, `3445–3462` and `3717–3718`;
  - `lib/arrive.ts`;
  - FamilyTree's `draw` and redraw triggers.
- **Measured:**
  - getBoundingClientRect, and per-line `getClientRects` for the decade, the h3, `.tp-also` and the asks, tier by tier;
  - a pairwise overlap check of text ranges, overflow clipping, font sizes, target sizes and opacity chains;
  - scrollWidth, and the plate, kept line, side, main and "Where to next" rects;
  - the condensed bar after real frames;
  - same-origin iframes at 760, 760.5, 761, 850, 900.5, 901 and 1100.5, which I removed afterwards.
- **What I touched:**
  - I clicked nothing that writes. I moved by URL only.
  - I kept my audit script in one `sessionStorage` key of my own (`bao-r11-audit`) and removed it.
  - I read only whether `astory-app-auth` exists (it does). I never wrote it, removed it or signed out.
  - I reset the viewport to desktop and closed tab-150.

**Not verified:**
- A real pointer's hover and press.
- Reduced motion (nothing new moves).
- 3840 wide.
- A real Edge zoom, as opposed to emulated widths and iframes.
- The failure states (unchanged).
- vitest and tsc (not run by me).

## Score (taste floor)

Philosophy 4, hierarchy 4, execution 4, specificity 4, restraint 4, variety 4.

Family's round-11 changes pass, and so do both round-10 notes. The one fail is the shell's condensed bar, where the place links are 38.4px tall. Fix that line and this round is a pass.
