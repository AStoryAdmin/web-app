# Skills Steward: Family and Person, round 10

**Verdict: GAPS (0 blocker, 0 ugly, 2 polish).**

All three round-9 gaps, notes 3 and 4, and Bao's round-9 finding are fixed, and I measured each one live.
- From 1100 to about 1346px the sample tree now stacks instead of colliding.
- A ring that wraps under its heading now starts on the heading's edge.
- Focus follows the moved ring both ways.
- Both rings are named "Add …".

Both polish gaps come from 1a3faab:
- In stack mode the last generation keeps 32px of padding that the band takes away.
- At 320 the new flex label puts "1960s" alone on a line above "Rose's children and Margaret's".

**Scope:**
- `components/family/tree/FamilyTree.tsx`:
  - `collides()` (lines 373–393).
  - The `draw()` changes (433–436 and 463–472).
  - `balance()`'s `band` (92).
  - The two `aria-label`s (569 and 579).
- `styles/pages/family-people.css`:
  - The ≤1099.98 label block (244–259).
  - Every `.98` bound.
  - The round-10 block (671–689), read against the band rules at 610–656.

**Skills loaded:**
- taste-skill: SKILL (house rules and laws), layout, critique.
- hallmark: SKILL, interaction-and-states, responsive, slop-test gates and anti-patterns.
- emil-design-eng: the animation framework, performance, accessibility and the review checklist.
- impeccable: SKILL, craft-floor, layout, polish.
- gsap-react and gsap-performance (cleanup, layout reads), and gsap-scrolltrigger (refresh).

I also read BAOS-STANDARD.md and DESIGN.md. No other installed skill applies.

**How it was checked:**
- **Tests:**
  - vitest on `components/family` and `components/person` passes: 5 files, 47 of 47 tests.
  - `tsc --noEmit` prints nothing.
  - taste-skill `lint.mjs` finds the same sanctioned categories as rounds 2–9. The round-10 block (671–689) has no shadow, border, gradient or 1px line.
- **Served code:** Vite served `collides` and the `data-stack` rules.
- **Live, in my own tab (tab-146).** I force-reloaded at each size and stepped `__gsap.ticker.tick()` before each measurement.
  - `/family?preview=tree` at 320, 390, 800, 1099, 1100, 1180, 1280, 1320 and 1366.
  - `/family` (the founder's real family) at 1100 and 1280.
- **The resize redraw:** I resized one page through 1366 → 1280 → 1366 → 1320 → 1180 → 1099 → 1366 → 1280 → 800 → 390 → 800.
  - A background tab draws no frames, so I took a screenshot after each resize to force one.
  - I logged the `data-stack`, `data-size` and `data-snug` mutations to confirm that each redraw ran.
- **Band against stack:** I compared 22 computed properties of all 231 elements inside `.tp` at 1099 (the band) and at 1100 (stacked). These include display, the four paddings and margins, order, flex-basis, gaps, position, max-width and font-size.
- **Clean-up:**
  - I reset the viewport to desktop and closed the tab.
  - I never signed out, never touched `astory-app-auth`, and wrote no data.
  - I kept my measuring scripts in three `sessionStorage` keys of my own and removed them.
  - I clicked nothing. I focused one ring by script and pressed Shift+Tab and Tab once each to give the twin keyboard focus.
- **Heads-up for the next reviewer:** Vite reloaded my tab several times mid-run, because another agent was editing `archive/transcript.ts`. Each time I waited for `.tp` to exist before measuring.

**Not verified:**
- A real pointer's hover and press on the stacked tree (the CSS is the band's).
- A fractional window width such as 1099.5 (read from code only).
- The Person page at the new bounds. It is unchanged at whole-pixel widths; read from code.
- 2560 and 3840. Snug mode is ruled open for the founder, so I did not count it.
- The add flow behind the rings, because it would write.

## Round 9, item by item

| Item | Verdict | Evidence |
| --- | --- | --- |
| **R9-1** The faces collide at 1100–1300 (`collides()` falls back to `data-stack`) | **Fixed** | **Fresh load, sample tree:** at 1100, 1180, 1280 and 1320, `data-stack="1"`, size `t`, the threads `display: none` with 0 paths, and no two face or ring boxes overlap in any tier (I tested every pair). At 1366 the grid stays: no stack, 11 paths, no overlap. **1320, which R9 called clean, now stacks, and rightly so.** On the grid, the generation's centre zone needs 442px in a 415px track, so its unit spills 13.5px into each 20px zone gap. `collides()` counts the gaps, and so the switch comes at about 1346. **Parity with the band:** the 1099/1100 comparison differs in exactly one value (R10-1 below). The 1100 plate is 1290px tall against the band's 1258, and the 32px is that value. **`balance()`** keys on `data-stack`. At 1100–1320 every row fits on one line, so `--tp-row-w` stays empty, as it should. **Real family:** at 1100 (size `n`) and 1280 (size `m`) it stays on the grid with its 2 threads. |
| **The redraw across widths** | **Holds** | Every `draw()` deletes `data-stack` before the size loop and measures on the grid again, so nothing sticks. **My mutation log:** 1366 → 1280 set the stack. 1280 → 1366 removed it, and 11 threads came back with the SVG at 1231×818, the plate's own size. 1366 → 1320 and 1320 → 1180 set it. 1180 → 1099 removed it, and the band took over (plate 1258 tall). Each result matched a fresh load at that width. |
| **R9-2** Focus falls to `<body>` when the ring moves | **Fixed** | **800 → 390:** focus on the in-row "Add a child" `.tp-ghost`. After the resize, `activeElement` is the `.tp-ask-alt` in "Rose's children" (`data-ghost-up="1"`), with client rects. **390 → 800, after real Shift+Tab and Tab:** the twin matched `:focus-visible` with the 2px terracotta outline. After the resize, the in-row `.tp-ghost` holds focus, still matches `:focus-visible`, and shows a solid outline. **The fallback (1366 → 1280 → 800):** the ring is the same node on the grid and in the stack, so focus simply stays. `activeElement` was "Add a child" (`.tp-ghost`) at 1280, stacked, and again at 800. **One ghost per tier** (`plateModel.ts` `ring()`: one per level), so the "first twin in the tier" lookup cannot pick the wrong button. |
| **R9-3** Two names for one control | **Fixed** | `aria-label="Add …"` on both `.tp-ask` (569) and `.tp-ask-alt` (579). **Measured:** "Add a child" for both twins, and "Add Rose's grandparents" for the margin ask. The visible words stay inside the name, which satisfies label-in-name. |
| **Note 3 / Bao's finding** A wrapped ask sits 12px in | **Fixed** | The label is a flex row with `column-gap: 12px`, and the margin is gone. **390:** the lifted "a child" starts at x 50, where "1960s" starts. "Rose's grandparents" now fits beside its heading, at 207, 12px after the h3's end at 195. **320:** "Rose's grandparents" wraps and starts at 50, like "1910s" above it. "Not placed yet" and its hint sit at 50. Computed `margin-left` on every ask is 0. |
| **Note 4** Sub-pixel gaps at the bounds | **Fixed in this sheet** | Every upper bound in `family-people.css` is now `.98` (760.98, 1099.98, 1499.98), and so is the `matchMedia` in `balance()`. Nothing at 760, 1099 or 1499 is left in the sheet. Global sheets are a note below. |

## Gaps

### R10-1. POLISH: in stack mode the last generation keeps 32px of bottom padding that the band takes away
**Skill:**
- impeccable polish ("Fix the cause at the narrowest correct level"; "Align to the… spacing scale").
- taste-skill layout ("The gap between sections is clearly larger than any gap inside one", which is broken when the gap depends on the width).

**Where:** `family-people.css:676`.
- `.tp[data-stack] .tp-tier { padding: 0 0 32px 30px; }` has specificity 0,3,0. It beats `.tp-tier:last-child { padding-bottom: 0; }` (line 146, specificity 0,2,0).
- In the band, the ≤1099 rule (`.tp-tier`, 0,1,0) loses to `:last-child`, so the band's last tier has no bottom padding.

**Measured:**
- The shelf ("Not placed yet") has `padding-bottom` 0px at 1099 and 32px at 1100, 1180, 1280 and 1320.
- The plate is 1258 against 1290 tall.
- This is the only difference among the 22 properties I compared across all 231 elements.
- On a family with no unplaced person, it falls on its youngest generation instead.

**Change:** one line after 676, as `data-snug` already does at 593:

```css
.tp[data-stack] .tp-tier:last-child { padding-bottom: 0; }
```

### R10-2. POLISH: at 320 the decade stands alone above the heading on one tier
**Skill:**
- impeccable craft-floor, Refuse ("A kicker or eyebrow above a heading. This one is a ban"). On a phone this tier's decade now reads as a kicker.
- taste-skill critique pass 4 (edges and consistency): the other tiers set the decade and the name on one line.
- hallmark responsive (320 is a non-negotiable width).

**Where:**
- `FamilyTree.tsx:561–565`: `.tp-dec` and `<h3>` are separate flex items.
- `family-people.css:251` and `:677`: `.tp-label` is now `display: flex; flex-wrap: wrap`.

A flex container blockifies the h3, so `.sheet-page .tp-label h3 { display: inline }` no longer applies. If the heading's max-content doesn't fit beside the decade, the whole h3 drops to the next line. Before 1a3faab its words wrapped inline after the decade.

**Measured on `/family?preview=tree` at 320:**
- **"Rose's children":** "1960s" is at 50–89 (y 1579–1592), alone. "Rose's children and Margaret's" is 208px wide, so it moves to the next line at 50 (y 1592), with no space between the two lines.
- **The other tiers:** "1910s Rose's parents", "1940s Rose's generation" and "2000s Rose's grandchildren" each keep the decade and name on one line.
- **The range:** at 360, 375 and 390 the decade and name fit (259px needed), so this shows from 320 to about 338px.

**Change:** make the decade and the name one flex item, and keep the asks as its siblings.

1. In the TSX, wrap the two in a `<div className="tp-name">`. A `div`, because a `span` cannot hold an `h3`:

   ```tsx
   <div className="tp-name">
     {tier.decade && <span className="tp-dec">{tier.decade}</span>}
     <h3>…</h3>
   </div>
   ```

2. In the ≤1099.98 block and the stack block:

   ```css
   .tp-name { min-width: 0; }
   .tp-name .tp-dec { margin-right: 10px; }
   .sheet-page .tp-name h3 { display: inline; }
   ```

   The words then wrap inline ("1960s Rose's children and / Margaret's"). An ask that doesn't fit still wraps to the heading's edge.

3. On the desktop grid, `.tp-name` is a plain block, and the decade stays above the name as it is now.

## Emil's review table

| Before | After | Why |
| --- | --- | --- |
| At 1100–1320 the sample's faces ran into each other on the grid | The plate stacks generation by generation, as the band does, and returns to the grid with its threads once the tier fits with its gaps | No collision at any width; the layout decides by measurement, not by a breakpoint |
| A hidden ring took keyboard focus with it | Focus goes to the twin in the same tier, with no scroll | The keyboard keeps its place through a resize or a zoom |
| "Add a child" or "a child", depending on the width | "Add …" on every ask | One control, one name |
| A wrapped ask started 12px in from the heading | The flex label's gap spaces the heading and its asks, and a wrapped ask starts on the edge | One left edge per label |
| The stacked last tier keeps 32px of padding (R10-1) | `.tp[data-stack] .tp-tier:last-child { padding-bottom: 0 }` | The space under the tree should not change between 1099 and 1100 |
| At 320, "1960s" stands alone above its heading (R10-2) | The decade and heading form one flex item | No kicker shape on a phone; the decade reads as part of the name |

## Skill by skill

- **taste-skill:** applied, with R10-1 and R10-2 open.
  - No face lies on another at any width I measured, so critique pass 13 is met.
  - The stacked tree is the band's composition. It adds no ornament, and the storyteller still leads on the axis.
- **hallmark:** applied, with R10-2 open.
  - **No horizontal scroll** at 320, 390, 800, 1099, 1100, 1180, 1280, 1320 or 1366.
  - **The stack adds no new control.**
  - **The moved and handed-off rings keep their states:** focus-visible (2px terracotta, offset 2, confirmed live), `:active` scale 0.97, hover only on a fine pointer, and the 44px target.
  - **Not counted:** "a sister or brother" breaking across two lines is the ghost's caption, not a button label, as ruled in round 8.
- **emil-design-eng:** applied.
  - The switch to the stack is not animated. That is right for a layout change on resize.
  - The handed-off focus appears instantly.
  - No `transition: all`, no ease-in, and nothing new moves.
- **impeccable:** applied, with R10-1 and R10-2 open.
  - DOM order and focus order agree with what you see in the stack, as they do in the band.
  - The ring's name now matches its action.
  - "Long … dynamic content do not break the structure" now holds on the sample at every width.
- **GSAP (react, performance, scrolltrigger):** no gaps.
  - `treeMotion.ts` is unchanged (matchMedia, `mm.revert()`, transform and opacity, `clearProps`).
  - The tiers reveal through `onEnter`'s rect checks, not through ScrollTrigger start positions. A stack flip that changes the plate's height therefore leaves no trigger stale.
  - `collides()` only reads layout, inside the debounced `draw()` (40ms), never per frame.
  - Every redraw toggles `data-stack` off and on inside one task. The mutation log shows no frame painted between the two.

## Notes, not counted

1. **The rest of the site still uses whole-pixel bounds.**
   - `astory.css` still writes `max-width: 760px` and `1100px` (for example 457, 586 and 1101).
   - At a fractional 760.33, Family's body now takes its phone layout while the shell takes its tablet one. `.desk-only` and `.mobile-only` at `astory.css:586` don't switch.
   - This is outside the Family sheet. Closing it means the same `.98` pass on `astory.css` and the other page sheets.
2. **A focused control near the top can sit partly under the running head.**
   - At 800 the sticky stack (the bar, 0–56, and the running head, 56–95) reaches lower than `html { scroll-padding-top }` (80px, `astory.css:3456`).
   - After 390 → 800, the handed-off ring sat at 83–136, so its top 12px were under the running head. The hand-off uses `preventScroll`, as R9 asked, so nothing corrects it.
   - The same shortfall affects any Tab into a control near the top of a sheet page. Raising the scroll padding to the full sticky height (the bar plus the running head) would fix both.
3. **The sample draws no threads on the standard laptop widths.**
   - From 1100 to about 1346 the sample loses its threads, at 1280 and 1320 included, because it stacks.
   - At 1280×800 the storyteller's own tier runs past the fold (its second row of Margaret, Jim, Arthur and the ring), just as the band does at 1099.
   - This is the trade R9-1 asked for. The real family stays on the grid with its threads at 1100 and 1280.
4. **The stacked faces stay at the smallest size** (72px). That matches the band at 1099, so there is no jump at 1100. A stacked plate has the width for the next size up, if the founder wants larger faces on a laptop.
