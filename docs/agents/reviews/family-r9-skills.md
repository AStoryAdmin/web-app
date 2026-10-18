# Skills Steward: Family and Person, round 9

**Verdict: GAPS (1 blocker, 0 ugly, 2 polish).**

The round-9 change holds, and so do both of Bao's round-8 findings. I measured both live.
- A "+" left alone on a row now moves up beside its generation's name.
- The rows rebalance on every redraw, after a resize as well as on a fresh load.
- The slim plate is no wider than its words, and the kept-line card shares the column's left edge.

Nothing the commit touched broke.

The two polish gaps are in the new code: keyboard focus on the moving ring, and the ring's two names. The blocker is **not from aee55a5**. It is a collision on the sample tree at 1100–1300px, just past the band the change uses. It has been in the code since the builders' round, and no review has measured that width before. I count it because the sample is the first tree every new family sees, and 1280×800 is the standard laptop check.

**Scope:**
- `components/family/tree/FamilyTree.tsx`: `liftLoneRings()` (lines 136–153), the redraw (435–440) and the header twin (544–552).
- `styles/pages/family-people.css`: the round-9 block (657–668), read against `.tp-ask` (159–164), the ≤1099 block (244–257) and rounds 7–8.

**Skills loaded:**
- taste-skill: SKILL (house rules and laws), layout, critique.
- hallmark: SKILL, interaction-and-states, responsive, slop-test gates and anti-patterns.
- emil-design-eng (whole).
- impeccable: craft-floor, layout, polish.
- gsap-scrolltrigger, gsap-react and gsap-performance (refresh, cleanup and layout reads).

I also read BAOS-STANDARD.md and DESIGN.md. No other installed skill applies.

**How it was checked:**
- **Tests:** vitest on `components/family` and `components/person` passes: 5 files, 47 of 47 tests. `tsc --noEmit` prints nothing.
- **taste-skill `lint.mjs`** on the two files finds the same sanctioned categories as rounds 2–8, none at or below line 657. The round-9 block adds nothing.
- **Live, in my own tab (tab-137)**, force-reloaded at each size, with `__gsap.ticker.tick()` stepped before each measurement.
  - `/family?preview=tree` at 320, 375, 390, 414, 520, 640, 760, 761, 790, 800, 900, 1024, 1099, 1100, 1180, 1280, 1320, 1366 and 2560×1300 (html zoom 1.3).
  - `/family` at 390, 800, 1100 and 1280.
  - `sample-rose`, `sample-claire`, `sample-mark` and `sample-maya` at 800.
  - Bao Vo's own page at 800.
- **A trap in the pane, worth knowing.** A background pane tab draws no frames (`requestAnimationFrame` never fires). So neither `ResizeObserver` nor `resize` reaches the page after an emulated resize, and the tree looks stale. Taking a screenshot forces a frame, and the redraw then runs. Every resize result below was read after a forced frame, and I logged the `data-size` and `data-ghost-up` mutations to confirm the redraw had run.
- **Clean-up.** I reset the viewport to desktop and closed the tab. I never signed out, never touched `astory-app-auth`, and wrote no data. I clicked nothing, and focused two buttons by script.

**Not verified:**
- A real pointer's hover and press on the moved ring (read from code: it is a `.tp-ask`).
- A real browser zoom (Ctrl +). I emulated widths instead. Below 1600×1000 `lib/zoom` keeps the html zoom at 1, so the band never runs zoomed.
- 3840 wide.
- The add flow behind the ring, because it would write.

## Round 9, item by item

| Change | Verdict | Evidence |
| --- | --- | --- |
| A lone "+" moves beside its generation's name (≤1099) | **Holds** | **Phone, sample tree:** "Rose's children" lifts at 375, 390 and 414, giving rows Anne & Mark / Daniel, Claire. "Rose's grandchildren" lifts at 520 (Maya, Leo, Sam). No tier at 320–760 ends on a lone ring; the generation and grandchildren tiers end "Arthur +" and "Sam +". **The lifted ring:** at 390, "+ a child" is 68×44 at x 62, on the line under "1960s Rose's children and Margaret's". At 520, "+ a grandchild" is 106×44 on the heading's own line, 12px after it. **Band:** `balance()` runs first, so nothing is ever left alone. At 761 and 790, "Rose's children" splits Daniel, Claire / Anne & Mark, "+". At 800 and up it is one row (58–757). **Real family:** "Your parents" is Ty, "+" and "Your generation" ends Nhi, "+" at 390 and 800, so it needs no lift. **Desktop:** at ≥1100 and at 2560 zoom 1.3, `data-ghost-up` is absent on every tier, no twin shows, and the three in-row rings show. |
| The rows rebalance on every redraw | **Holds** | Every `draw()` clears `data-ghost-up` (line 437) before it measures. **Resize test (my mutation log):** 800 → 390 set `ghostUp` on "Rose's children", and 390 → 800 removed it. Both match a fresh load at that size. After a lift in the band, `balance()` runs again with the hidden ring filtered out (its width is 0). |
| The slim plate has no 420 floor (761–1099) | **Holds** | Each card is now its words' width, with the 32px right padding kept. **Rose:** 26–409 (words end at 376). **Claire:** 26–404. **Mark:** 26–372 (words end at 339). **Maya:** 26–321. |
| The kept-line card is left-aligned (761–1099) | **Holds** | **Rose:** the plate starts at 26, and so do the kept line (26–519), "What Rose has told" and "Rose's family". **Claire:** the same, at 26. **Bao (not slim):** a 26–759 plate, the kept line at 26–519, and "What Bao has told" at 26. Outside the band the rule doesn't apply (it is inside the media query). No horizontal scroll at any width measured. |

**Bao's round 8:**
- **Finding 1, the two framed cards on two axes at 800.** Fixed. See the last two rows.
- **Finding 2, the lone "a child" ring at 390.** Fixed. See the first row.

## Gaps

### R9-1. BLOCKER (pre-existing, not from aee55a5): from 1100 to about 1300px, the sample tree's faces collide
**Skill:**
- taste-skill critique pass 13 ("Is anything lying on top of… at any scroll position"), and its cap ("Anything covering… usability cannot exceed 6").
- impeccable layout ("Long text, empty states… dynamic content do not break the structure").
- hallmark responsive (the layout must hold at every width).

**Where:**
- The desktop grid (`family-people.css:168–169`, three zones with `min-width: 0`) takes over at 1100 (`@media (max-width: 1099px)` ends at line 244).
- `draw()` stops at the smallest size, `t`, even when `wraps(el)` (FamilyTree.tsx:350) still reports that a generation does not fit. Nothing falls back.
- The left zone's faces then run into the centre zone, and the centre zone's into the right.

**Measured on `/family?preview=tree`, "Rose's generation" at size `t`:**

| Width | Jim Doyle's box over Frank Hartley's | Tom Whitfield's box over the "a sister or brother" ring | What shows |
| --- | --- | --- | --- |
| 1100 | 79px | 79px | "Jim Doyle" (402–472) is printed across "Frank Hartley" (436–536). The two portraits overlap, and "Tom Whitfield" runs into "a sister or brother". |
| 1180 | 42px | 42px | The names touch (475 and 476). "brother-in-law" ends 9px from "husband". |
| 1280 | 13px | 13px | The text clears by about 30px, but nothing separates the Doyles from Frank, and the ring sits against Tom. |
| 1320 and 1366 | none | none | Clean. |

- A sub-pixel window, such as an emulated 1099 at DPR 1.5 (1099.33 CSS px), matches neither `max-width: 1099px` nor `min-width: 1100px`. It gets the same desktop grid, and the same collision, at 1099.
- The real family is clean at 1100 and 1280. It has fewer faces in a generation.

**Change:** when the smallest size still wraps on the grid, fall back to the band's layout instead of letting the zones overlap.
1. In `draw()`, after the size loop: `if (getComputedStyle(svg).display !== "none" && wraps(el)) el.dataset.stack = "1"; else delete el.dataset.stack;`. Run this before `balance()` and the lift.
2. In the CSS, make the ≤1099 tree rules (244–257), the band's tree rules (620–621 and 643–645) and the round-9 block also apply under `.tp[data-stack]`. That covers the threads hidden, the rows wrapping, the storyteller first and the ring last.
3. In `balance()`, key `band` on `matchMedia(...) || el.dataset.stack`, so the wrapped rows are balanced there too. `liftLoneRings` already keys on the hidden threads, so it follows.

Raising the breakpoint to 1320 would only move the edge: a larger family would collide at 1366.

### R9-2. POLISH: focus on the "+" falls to `<body>` when a redraw moves it
**Skill:**
- impeccable polish ("Preserve visible keyboard focus").
- hallmark 8 states (focus).
- emil ("unseen details compound").

The moved ring is a twin button, not the same node. One of the pair is always `display: none`.

**Where:** FamilyTree.tsx:437–439 toggle `data-ghost-up`, and family-people.css:660–662 hide the button that had focus.

**Measured:**
- I focused the in-row "Add a child" at 800, then resized to 390. The ring lifted and `document.activeElement` became `BODY`.
- I focused the header "a child" at 390, then resized to 800. Same result.

A keyboard user who zooms the browser (which changes the CSS width and fires the redraw) while on the "+" loses their place.

**Change:** in `draw()`, note the tier of the focused twin before line 437:
```ts
const had = document.activeElement?.closest(".tp-tier") && document.activeElement.matches(".tp-ghost, .tp-ask-alt") ? document.activeElement : null;
```
After the lift, if `had` has no client rects, focus the other twin in the same tier (`.tp-ask-alt` or `.tp-row .tp-ghost`) with `{ preventScroll: true }`.

### R9-3. POLISH: the same control has two names, "Add a child" in the row and "a child" by the heading
**Skill:**
- impeccable craft-floor ("Controls name their action").
- impeccable polish ("Keep terminology… consistent").

**Where:**
- `Ring` sets `aria-label={`Add ${ghost.label}`}` (line 209).
- The new twin (546) and the existing header asks (536) have only their visible words. The "+" is `aria-hidden`.

A screen reader hears "Add a child, button" or "a child, button", depending on the width.

**Change:** give both `.tp-ask` buttons `aria-label={`Add ${label}`}`. This also fixes the older "Rose's grandparents" ask.

## Emil's review table

| Before | After | Why |
| --- | --- | --- |
| On a phone, a "+" stood alone on a 113px row of its own | It moves up as the small ring by the generation's name, 44px tall | No lone icon on a row, and the family stays the larger thing |
| The lift was decided once per layout | Every redraw clears it, measures, and balances again | The ring follows a rotated phone or a resized window |
| The slim plate kept a 420px floor | The card is its words' width | No bare paper inside a frame |
| The kept-line card was centred under a left card | It starts on the column's edge | One left edge for every framed card in the band |
| Focus is dropped when the twin hides (R9-2) | Hand focus to the twin in the same tier | The keyboard's place survives a resize or a zoom |

## Skill by skill

- **taste-skill:** applied to the change.
  - No lone ring from 320 to 1099, and one left edge for the person page's cards in the band.
  - The move adds no ornament: it reuses the margin ask that empty generations already use.
  - R9-1 is the one collision, and it is outside the change.
- **hallmark:** applied, with R9-2 open.
  - The twin is a `.tp-ask`, so it has hover (only on a fine pointer), `:focus-visible` (2px terracotta, offset 2), `:active` scale 0.97, and a 44px target (68×44 and 106×44 measured).
  - It stays on one line at 320 to 520.
  - No horizontal scroll at 320, 390, 800 or 2560.
- **emil-design-eng:** applied.
  - The ring's move is not animated. That is right for a layout change on resize.
  - The twin's transitions name their properties (color, decoration and transform at 120–160ms on the house ease-out), with none under reduced motion.
  - No `transition: all` and no ease-in.
- **impeccable:** applied, with R9-2 and R9-3 open.
  - DOM order matches what you see: the twin sits in the header, before the faces.
  - The structure reorders by importance.
  - No craft-floor ban.
- **GSAP (react, performance, scrolltrigger):** no gaps.
  - `treeMotion.ts` is unchanged (matchMedia, `mm.revert()`, transform and opacity, `clearProps`).
  - The hidden in-row ring's tween runs while it is hidden and clears, so it shows correctly if it returns.
  - `liftLoneRings` reads layout between two `balance()` passes, but only inside the debounced `draw()` (40ms), never per frame.

## Notes, not counted

1. **At 2560×1300 the sample tree draws no gold threads.**
   - Zoom is 1.3, so `draw()` sets `data-snug` (line 429), and css:587 cuts each generation's padding to 4px.
   - `measure()` then skips every link because `yt <= yb` (line 336). There are 0 `path` elements on a fresh load, against 11 at 1366.
   - The words under each face still say whose, so nothing is lost, but the founder's screen shows a different tree from the laptop's.
   - This has been the case since round 5, and no review flagged it. If the threads should stay, keep about 24px of air in snug mode, or let the threads cross the tier padding.
2. **At 320 the sample tree sets one face per row** where two 128px faces don't fit (Daniel / Claire, "+"; Maya / Leo / Sam, "+"). No ring is alone, and it reads as a column, but hallmark's 320 floor would want the phone faces a step smaller below about 340px.
3. **On a phone, a margin ask that wraps under its heading starts 12px in from the heading's edge** (62 against 50). Two asks do this: "Rose's grandparents" and the lifted "a child". The cause is the `h3 + .tp-ask` 12px margin from round 3. Moving that spacing to a `column-gap` on a flex-wrap label would put a wrapped ask on the heading's edge.
4. **Fractional widths.** `max-width: 760px` against `min-width: 761px`, and 1099 against 1100, leave a sub-pixel gap that a zoomed Edge window can land in (seen at 1099.33). Writing the upper bounds as `max-width: 1099.98px` and `760.98px`, or using range syntax (`width < 1100px`), would close it everywhere.
