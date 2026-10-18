# Skills Steward: Family and Person, round 11

**Verdict: GAPS (0 blocker, 0 ugly, 2 polish).**

R10-1 and R10-2 are fixed, and I measured both live.
- At 1100 the stacked plate now ends flush. Across all 235 elements in `.tp`, the band at 1099 and the stack at 1100 match on all 22 properties plus height.
- At 320, "1960s" now starts the heading's line: "1960s Rose's children and / Margaret's".

My round-10 note on fractional bounds is closed by 661617f.

Both polish gaps come from the new `.tp-name` wrapper in 97d3524:
- It inherits the body's 1.55 line height, so in the band, the stack and on a phone each label line is 5.6px taller than the heading's own line.
- It is a `span` holding an `h3`.

Each is a one-line fix.

**Scope:**
- `components/family/tree/FamilyTree.tsx` 558–568: the `.tp-name` wrapper.
- `styles/pages/family-people.css` 690–700: the round-11 block, read against the ≤1099.98 block (244–259), the stack block (674–689) and the snug rule (593).
- 661617f: every media bound in `src/styles` and every width `matchMedia` in `src`.

**Skills loaded:**
- taste-skill: SKILL (house rules), critique.
- hallmark: interaction-and-states, responsive.
- emil-design-eng: the review checklist, performance and accessibility.
- impeccable: SKILL, craft-floor.
- gsap-react (cleanup), gsap-performance (layout reads), gsap-scrolltrigger (refresh).

I also read BAOS-STANDARD.md and DESIGN.md, including 661617f's reduced-motion ruling. No other installed skill applies.

**How it was checked:**
- **Tests:**
  - vitest on `components/family` and `components/person` passes: 5 files, 47 of 47 tests.
  - `tsc --noEmit` prints nothing.
  - taste-skill `lint.mjs` finds the same sanctioned categories as rounds 2–10. The round-11 block has no line, border, shadow or gradient.
- **Live, in my own tab (tab-152):**
  - **Sample tree:** I force-reloaded `/family?preview=tree` at 320, 390, 800, 1099, 1100, 1366 and 2560, took a screenshot each time to force a frame, and stepped `__gsap.ticker.tick()` before measuring.
  - **Real family:** `/family` at 1280.
  - **Person page:** `/family/sample-rose?preview=tree` at 320 and 1366.
  - **Focus:** 800 → 390 → 800, using real Shift+Tab and Tab.
- **Clean-up:**
  - I kept my measuring script in two `sessionStorage` keys of my own and removed them.
  - I injected one probe style (`.tp-name { line-height: 1.15 }`) for a single measurement and removed it at once. The page was reloaded after that.
  - I reset the viewport to desktop and closed my tab. The founder's tabs are untouched.
  - I never signed out, never touched `astory-app-auth` (still present), wrote no data and clicked nothing.

**Not verified:**
- A real fractional window width, such as browser zoom landing on 760.5. I checked that from the code (see the note below).
- A real pointer's hover and press on the stacked tree.
- The add flow behind the rings, because it would write.
- 3840. At 2560, snug mode is ruled open for the founder, so I did not count it.

## Round 10, item by item

| Item | Verdict | Evidence |
| --- | --- | --- |
| **R10-1** The stacked last tier keeps 32px | **Fixed** | `.tp[data-stack] .tp-tier:last-child { padding-bottom: 0 }` (693, specificity 0,4,0) beats 676 (0,3,0). **Shelf `padding-bottom`:** 0px at 1099 and 0px at 1100. **Plate height:** 1274.8 at both widths. **The full comparison** of 22 computed properties plus height, across all 235 elements in `.tp`, at 1099 against 1100: **zero differences**. One reading of `.tp-rail` differed, but that was its reveal tween mid-flight. After ticking, it reads 1240.75 at both widths. |
| **R10-2** "1960s" alone above its heading at 320 | **Fixed** | Inside `.tp-name` the h3 is no longer a flex item, so `.sheet-page .tp-label h3 { display: inline }` applies again. **At 320:** the h3 is inline, and every tier keeps its decade on the heading's first line (bottoms within 6px). The heading starts 10px after the decade (`margin-right: 10px`; 698 at 0,2,0 beats 254, and 700 at 0,4,0 beats 681). "Rose's children and Margaret's" wraps inline after "1960s", as asked. **The asks:** at 390, "Rose's grandparents" sits beside the name at x 205.5, 12px after its end at 193.5. The lifted "a child" wraps to x 50, the heading's edge. **On the grid** (1366 and 2560), `.tp-name` is a block, the decade is a block 4px (6px at 2560) above the name, and the name's height is exactly decade + gap + h3 (37.7 = 13 + 4 + 20.7), so the desktop label is unchanged. |
| **Round-10 note 1** Whole-pixel bounds across the site | **Closed by 661617f** | Every paired bound now ends in `.98` against its `N+1` partner: 599.98/600, 760.98/761, 860.98/861, 900.98/901, 1023.98/1024, 1099.98/1100, 1100.98/1101, 1180.98/1181, 1279.98/1280, 1499.98/1500 and 1599.98/1600. Ten whole-pixel `max-width` queries remain (340, 359, 380, 520, 820, 870, 960, 1000, 1160, 1240), and none has a complementary `min-width` rule, so no fractional width can fall between two layouts. The width `matchMedia` calls agree with their CSS partners: Archive and BookSpread at 760.98, MemoryLead at 599.98, bookFit at 1180.98, and FamilyTree's `balance()` at 761–1099.98. `astory.css:586` now switches `.desk-only` and `.mobile-only` on the same 760.98/761 pair as Family's body. |

## The ring lift and focus with the new wrapper

- **800, before the resize:** focus was on the in-row "Add a child" `.tp-ghost`. Real Shift+Tab and Tab gave it `:focus-visible`.
- **800 → 390:** focus moved to `.tp-ask-alt` in "Rose's children" (`data-ghost-up="1"`), which still matches `:focus-visible`.
  - The ring is a 2px solid terracotta outline, rgb(154, 67, 32), offset 2px.
  - It is drawn in full. The screenshot shows it clear of the name above.
  - The ask sits at x 50, 44px tall, directly under `.tp-name` (name bottom 999, ask top 1001).
- **390 → 800:** focus came back to the in-row `.tp-ghost`, which still matches `:focus-visible`, has one client rect and a solid 2px outline.
- `liftLoneRings` and the focus hand-off query `.tp-row` and `.tp-ask-alt` only, never the label's children, so the wrapper cannot mislead them.

## Regression sweep

| Width | Layout | Threads | Faces overlapping | Horizontal scroll | Notes |
| --- | --- | --- | --- | --- | --- |
| 320 | phone, size `t` | none | 0 | none | Every decade on its heading's line |
| 390 | phone | none | 0 | none | Ask beside the name; the lifted ask on the heading's edge |
| 800 | band | none | 0 | none | Labels on one line |
| 1099 | band | none | 0 | none | Plate 1274.8 |
| 1100 | stack | none | 0 | none | Plate 1274.8; identical to 1099 |
| 1366 | grid | 11 | 0 | none | Plate 818, as in round 10 |
| 2560 | grid, html zoom 1.44 | 11 | 0 | none | Desktop label unchanged; snug threads ruled open |

- **Real family at 1280:** on the grid, size `m`, 2 threads. Its labels have no decade, and its last tier ends at 0.
- **Person page:** renders at 320 and at 1366 with no horizontal scroll.

## Gaps

### R11-1. POLISH: the wrapper sets each label line at the body's line height, not the heading's
**Skill:**
- impeccable craft-floor, Verify ("Spacing… Read the computed values"; "balanced headings").
- taste-skill critique pass 6 (type).

**Where:** `family-people.css:696`. `.tp-name { display: block; min-width: 0; }` sets no line height, so it inherits the body's 1.55 (26.35px at 17px).

In the band, the stack and on a phone, `.tp-name` is a block whose line holds the inline decade and the inline h3. Its strut (26.35px) is taller than the h3's own 1.15 (20.7px), so every line of the label grows to 26.35px. On the desktop grid the decade and h3 are blocks with their own line heights, so the grid is not affected.

**Measured:**
- **1099 and 1100:** every label without an ask is 26.3px tall instead of 20.7.
  - The plate is 1274.8 tall. Round 10 measured the same band at 1258.
  - Live, with `.tp-name { line-height: 1.15 }` injected, the labels went back to 20.7 and the plate to 1257.8.
- **320:** the two lines of "1960s Rose's children and / Margaret's" are 30px apart (line tops at 1590 and 1620) for an 18px heading. That is a leading of about 1.67 on a display line, so "Margaret's" hangs loose under its heading.
- **Every width up to 1099, and the stack:** the gap from the name to its row of faces grows by about 5.6px.

**Change:** one declaration.

```css
.tp-name { display: block; min-width: 0; line-height: 1.15; }
```

### R11-2. POLISH: a `span` holds the `h3`
**Skill:** impeccable craft-floor, Verify (working, correct markup under "States… real content"). This is also the reason R10-2 specified a `div` ("a `span` cannot hold an `h3`").

**Where:** `FamilyTree.tsx:562` and `:568`. `<span className="tp-name">` wraps `<h3>`. A `span` may only hold phrasing content, and a heading is not phrasing content.

Neither React nor the HTML parser changes the tree, and nothing renders differently. It is invalid markup, and a validator or an accessibility checker will report it.

**Change:** make it a `<div className="tp-name">`, with `</div>` at 568. `header` may hold a `div`, and the CSS already says `display: block`, so nothing else changes.

## Emil's review table

| Before | After | Why |
| --- | --- | --- |
| The stacked plate ended 32px lower than the band (R10-1) | Both end flush; 235 elements identical at 1099 and 1100 | Nothing under the tree moves at the stack's switch |
| At 320, "1960s" stood alone above its heading (R10-2) | The decade starts the heading's line, and the words wrap after it | No kicker shape on a phone |
| Each label line is 26.35px, the body's leading (R11-1) | `line-height: 1.15` on `.tp-name`, the heading's own | A two-line heading reads as one heading; the label sits as close to its row as before |
| A `span` holds the `h3` (R11-2) | A `div` | Valid markup, with no visual change |

## Skill by skill

- **taste-skill:** applied, with R11-1 open.
  - No headline runs past two lines at any width I measured. "Rose's children and Margaret's" is the longest at two lines, at 320 and on the grid.
  - No face lies on another (pass 13).
  - Left edges: label text and wrapped asks share one x per width (pass 4).
- **hallmark:** applied.
  - **No horizontal scroll** at 320, 390, 800, 1099, 1100, 1366 and 2560, nor on the Person page at 320 and 1366.
  - **The moved and handed-off rings keep their states:** focus-visible confirmed live in both directions, `:active` scale 0.97, hover only on a fine pointer, and the 44px target.
  - **No control label wraps.**
- **emil-design-eng:** applied.
  - Nothing new moves.
  - No `transition: all` and no ease-in.
  - The focus hand-off is instant.
- **impeccable:** applied, with R11-1 and R11-2 open.
  - The decade no longer reads as a kicker on any phone width.
  - DOM order and focus order still agree with what you see.
- **GSAP (react, performance, scrolltrigger):** no gaps.
  - `treeMotion.ts` is unchanged (matchMedia, `mm.revert()`, transform and opacity).
  - The round-11 CSS changes no height that a trigger depends on at load. The label growth in R11-1 is present before the first `draw()` and the first reveal check.

## Notes, not counted

1. **The 2560 snug-mode threads** are ruled open for the founder. At 2560 (html zoom 1.44) the sample stays on the grid with 11 threads and no overlap, and I did not count snug mode.
2. **Round-10 notes 2–4 stand as written:** the scroll padding under the running head, no threads on the sample from 1100 to about 1346, and the stacked faces kept at 72px. Round 11 does not change them.
