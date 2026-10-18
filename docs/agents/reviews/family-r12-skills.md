# Skills Steward: Family and Person, round 12

**Verdict: GAPS (0 blocker, 0 ugly, 1 polish).**

R11-1, R11-2 and Bao's round-11 finding are fixed, and I measured all three live:
- **R11-1:** every wrapped label line is now 20.7px, the heading's own leading.
- **R11-2:** the label is a `div`.
- **Bao's finding:** the condensed bar keeps its four place links at 44px.

The condensed bar passes emil's review. The condense still reads, and nothing is left behind from the removed pill scale.

This is not the passing round, because of one thing the `.tp-also` nowrap brought in (R12-1):
- There is no space in the source between "children" and the `.tp-also` span. With `nowrap` on the span, the line has no break point between them.
- So at 320 the heading now breaks inside the generation's name: "1960s Rose's / children and Margaret's".
- The same missing space makes the heading's text "Rose's childrenand Margaret's".

The fix is one space in the TSX and one margin in two CSS rules.

**Scope:**
- 34b2cc4:
  - `FamilyTree.tsx` 562–568: `.tp-name` is now a `div`.
  - `family-people.css` 696: `line-height: 1.15`.
- e9205dc:
  - `astory.css` 3445–3460, section 50: the pill's scale, its transition and its reduced-motion lines are removed.
  - `astory.css` 3715: the 40px condensed `min-height` is removed.
  - `family-people.css` 248 and 679: `.tp-also { white-space: nowrap }` in the band and in the stack.
- Read alongside them:
  - `lib/scrollShell.ts`, which toggles `.stuck`;
  - `lib/pillThumb.ts`, which measures the pill;
  - `astory.css` 218–227, 1726, 3491–3495 and 3765, the other `.pillnav` and `.top` rules.

**Skills loaded:**
- taste-skill: SKILL (house rules), critique.
- hallmark: interaction-and-states, responsive.
- emil-design-eng: the decision framework (frequency, purpose, easing, duration), the performance rules, the touch hover rule and the review checklist.
- impeccable: SKILL, craft-floor.
- gsap-react (cleanup), gsap-performance, gsap-scrolltrigger (refresh).

I also read BAOS-STANDARD.md (rule 24, the bar follows) and DESIGN.md. No other installed skill applies.

**How it was checked:**
- **Tests:**
  - vitest on `components/family` and `components/person` passes: 5 files, 47 of 47 tests.
  - `tsc --noEmit` prints nothing.
- **Live, in my own tab (tab-156):**
  - **Sample tree:** I force-reloaded `/family?preview=tree` at 320, 390, 800, 1099, 1100, 1366 and 2560 (html zoom 1.3). Each time I took screenshots to force frames and stepped `__gsap.ticker.tick()` before measuring.
  - **Extra widths:** 340 and 360, to find where the R12-1 break stops.
  - **Condensed bar:** measured at rest and condensed at 1366, 800 and 2560, after real frames.
  - **Real family:** `/family` at 320.
  - **Person page:** `/family/sample-rose?preview=tree` at 320 and 1366.
- **Clean-up:**
  - The pane was hidden twice during the run. The 320 real-family read, the 340 and 360 reads, the R12-1 probe and the Person reads are layout-only measurements, which need no frames. Every transition reading was taken after captured frames.
  - **One probe:** a single text node (" ") inserted before `.tp-also` plus one injected style (`.tp-also { margin-left: 0 }`), to test the R12-1 fix. I removed both straight away and reloaded the page afterwards.
  - I also swapped the `.tp-also` text in my own tab to test longer owner names, then put it back.
  - I kept my measuring functions on `window` only, with no storage.
  - I reset the viewport to desktop and closed my tab. The founder's tabs are untouched.
  - I never signed out, never touched `astory-app-auth`, wrote no data and clicked nothing.

**Not verified:**
- A real pointer's hover and press on the bar.
- A real Edge zoom, as opposed to emulated widths.
- 3840.
- The add flow, because it would write.

## Round 11, item by item

| Item | Verdict | Evidence |
| --- | --- | --- |
| **R11-1** The wrapper set label lines at the body's 1.55 | **Fixed** | `.tp-name` computes `line-height: 19.55px` (1.15 at 17px). Every one-line `.tp-name` is 20.7px tall at 390, 800, 1099 and 1100, down from 26.3. **Plate:** 1257.8 at 800, 1099 and 1100, the same value round 11 got with the injected probe. It was 1274.8 in round 11. **At 320:** the two lines of "Rose's children…" have tops 20.7px apart (1575.5 and 1596.2), down from 30. **The grid is unchanged:** at 1366 the name is 37.7 = 13 + 4 + 20.7, and at 2560 it is 49 = 16.9 + 5.2 + 26.9. The plate is 818.2 at 1366, as in round 11. |
| **R11-2** A `span` held the `h3` | **Fixed** | `FamilyTree.tsx:562` is `<div className="tp-name">`, and the live tag is `DIV` on all four labelled tiers. `header` may hold a `div`. The CSS already said `display: block`, so nothing renders differently. |
| **Bao R11, finding 1** The condensed bar's place links were 38.4px | **Fixed** | `.top.stuck .pillnav { transform: scale(0.96) }` and `.top.stuck .pillnav a { min-height: 40px }` are both gone. A walk of every live stylesheet rule finds no `.pillnav` or `.top` rule left with a transform, a scale or a transition, other than `.shell > .top` itself and its reduced-motion `transition: none`. **Condensed, after frames:** at 1366 and 800 the bar is 56px, the pill's transform is `none`, and Home, Archive, Family and Book are each 44px tall. At 2560 (zoom 1.3) the bar is 72.8 and the links 57.2. The bar's other controls stay at 44: Storyteller, Add, Account and the wordmark. |
| **Bao R11, note 1** `.tp-also` nowrap | **Applied, with a new break fault** | It is set in the band (248) and in the stack (679). On the grid `.tp-also` stays `display: block; white-space: normal`. See R12-1. |

## The condensed bar, through emil

**Is the condense still felt? Yes.** Three cues still change together when the page moves:
- **Height:** 64 to 56px, 200ms on the strong ease-out `cubic-bezier(0.23, 1, 0.32, 1)`.
- **Cloth:** it turns from transparent to the solid strip.
- **Edge:** a hairline and a soft shadow appear below it.

The 0.96 pill scale was a fourth cue, and the weakest one. A 2px shrink on a pill people use all day is the kind of motion emil's frequency rule says to drop ("its links never animate", as `scrollShell.ts` says). Removing it makes the bar more consistent with its own documentation, not less.

**Is any transition left dangling? No.**
- `.top .pillnav { transition: transform 200ms; transform-origin }` is deleted, and so is its reduced-motion pair. The live pill reports `transition: all 0s` and `transform: none`, both at rest and condensed.
- The `.shell > .top` transition lists exactly height, background-color and box-shadow. Its reduced-motion rule now names only that selector, which is correct.
- `pillThumb.ts` measures the pill with `getBoundingClientRect`. While the pill scaled, a measure taken on a condensed bar was 4% short. Now it is exact: at 800, at rest and condensed, the thumb reads 335.7 / 80 against the current link's 336 / 80.3.
- **The condensed fit:**
  - The pill is 51.3px tall in the 56px bar, 2.3px clear above and below. The captures at 1366 and 800 read as a capsule inside the strip, not one touching its edges.
  - Each link's `::after` hit area (−4px) stays inside the bar.

| Before | After | Why |
| --- | --- | --- |
| `.top.stuck .pillnav { transform: scale(0.96) }` with a 200ms transform transition | No scale, no transition on the pill | Place links people use all day do not animate (frequency rule), and the target keeps its 44px |
| `.top.stuck .pillnav a { min-height: 40px }` | Removed: the links stay at 44 | The 44px floor holds on the bar people actually use mid-page |
| Reduced motion named `.top .pillnav` and its transform | Names only `.shell > .top` | Nothing is left over for a rule that no longer exists |
| `.tp-name` at the body's 1.55 (R11-1) | `line-height: 1.15` | A wrapped heading reads as one heading |
| `{tier.title}<span class="tp-also">` with no space, now `nowrap` (R12-1) | `{tier.title}{" "}<span class="tp-also">`, with the wrapped margin at 0 | Gives the line a break point between the name and "and Margaret's", and a real word space in the heading's text |

## Regression sweep

| Width | Layout | Threads | Faces overlapping | Horizontal scroll | Notes |
| --- | --- | --- | --- | --- | --- |
| 320 | phone, size `t` | none | 0 of 16 | none | **R12-1:** "1960s Rose's / children and Margaret's". Line pitch 20.7. "Rose's grandparents" wraps to x 50, 44px. |
| 390 | phone | none | 0 | none | Each label is one line, 20.7px. "Rose's grandparents" sits beside the name at x 205.5, and the lifted "a child" is at x 50. |
| 800 | band | none | 0 | none | Plate 1257.8. Bar condensed to 56 with 44px links. |
| 1099 | band | none | 0 | none | Plate 1257.8. |
| 1100 | stack | none | 0 | none | Plate 1257.8, identical to 1099. The last tier's `padding-bottom` is 0. |
| 1366 | grid | 11 | 0 | none | Plate 818.2, as in round 11. Bar 56 with 44px links. |
| 2560 | grid, snug, html zoom 1.3 | 0 | 0 | none | The desktop label is unchanged. Bar 72.8 with 57.2px links. The snug threads are ruled open. |

- **Real family at 320:** "Your parents and Nhi Tran's" stays on one line, with no horizontal scroll.
- **Person page (Rose):** renders at 320 and at 1366 with no horizontal scroll and ends with "Where to next". At 1366 its place links are 44px.

## Gaps

### R12-1. POLISH: with no break point before "and Margaret's", the 320 heading splits "Rose's / children"
**Skill:**
- impeccable craft-floor, Verify ("balanced headings"; "real content").
- taste-skill critique pass 6 (type).
- hallmark responsive (no orphaned or broken phrases at the small phone).

**Where:**
- `FamilyTree.tsx:566`: `{tier.title}` is followed directly by `{tier.also && <span className="tp-also">…}`, with no whitespace between them.
- `family-people.css:248` and `:679`: `.tp-also { …; margin: 0 0 0 8px; white-space: nowrap; }`.

The 8px gap is a margin, not a space. Before e9205dc, the line could break inside the span ("…and / Margaret's"). Now the span cannot break inside, and there is no break point at its start, so "children" and "and Margaret's" form one unbreakable run. The browser breaks at the last space it has, between "Rose's" and "children".

**Measured:**
- **At 320,** per-character line reads of the label give:
  - line 1: "1960s Rose's", with the h3 at x 99–142;
  - line 2: "children and Margaret's", from x 50 to 212.
  - The generation's name is split across the lines, the opposite of what the nowrap was for.
- **At 340, 360 and 390** the whole label fits on one line, so this only shows from 320 to about 335. That is under the four sizes, but it is the width Bao's note was about.
- **Longer owners:** the h3's `overflow-wrap: anywhere` prevents overflow. I tried "and Nhi Tran's and Margaret's" and "and Elizabeth Montgomery-Hartley's" in my tab. Each reads "Rose's / children / and …" on three lines, with no horizontal scroll.
- **The heading's text** is "Rose's childrenand Margaret's" (`textContent`). The pane's accessibility read reports the heading under that name at 360 and at 2560. A screen reader may say "childrenand". This predates the round, and the same space fixes it.
- **The fix, live:** with a " " text node before the span and `margin-left: 0`, 320 reads "1960s Rose's children / and Margaret's". The wrapped "and" starts at x 50, the heading's own edge and the decade's left. I removed the probe and reloaded.

**Change:**

```tsx
{tier.title}
{tier.also && <>{" "}<span className="tp-also">{tier.also}</span></>}
```

```css
/* family-people.css:248 and :679 */
.tp-also { display: inline; margin: 0; white-space: nowrap; }
```

On the grid, `.tp-also` is `display: block`, so the space before it collapses and the desktop label is unchanged.

On one line, the gap becomes the heading's word space: about 4px at 18px, against 8px today. If that reads tight against the smaller UI type, put the space in its own `<span className="tp-sp"> </span>` with `word-spacing: 4px`. That gives 8px on one line, and the space still hangs invisibly at a wrap. Do not keep the 8px left margin: a wrapped "and" would then start 8px inside the heading's edge.

## Skill by skill

- **taste-skill:** applied, with R12-1 open.
  - No headline runs past two lines at any width I measured.
  - No face lies on another (pass 13).
  - Left edges: decade, wrapped asks and wrapped lines share x 50 at 320 and 390 (pass 4). R12-1's fix keeps that.
- **hallmark:** applied.
  - **No horizontal scroll** at 320, 340, 360, 390, 800, 1099, 1100, 1366 and 2560, nor on the Person page at 320 and 1366.
  - **The bar's places keep 44px** at rest and condensed, and the hit area stays inside the bar.
  - **No control label wraps.**
- **emil-design-eng:** applied.
  - The condense is three cues on one 200ms strong ease-out. The place links no longer animate.
  - No `transition: all` on the bar, no ease-in, and no dangling transition or reduced-motion rule.
- **impeccable:** applied, with R12-1 open.
  - R11-1 and R11-2 are closed.
  - DOM order and focus order are unchanged.
- **GSAP (react, performance, scrolltrigger):** no gaps.
  - `scrollShell.ts` and `treeMotion.ts` are unchanged (matchMedia, `mm.revert()`, refresh on load and on fonts).
  - Removing the pill scale also removes the one transform `pillThumb` could misread.

## Notes, not counted

1. **The bar's condense animates `height`,** a layout property. It has been there since 4dc8334. Because the bar is fixed, the layout stays inside the bar, and it runs once each time you scroll away from the top, for 200ms. With the scale gone, the pill and links still ride the bar's re-centering 4px up (pill top 6.3 → 2.3) over those 200ms. That is layout following the bar, not a link animation of its own. If it ever needs to move to the compositor, shrink a background layer with `scaleY` and leave the content still. I don't think it needs to.
2. **The 2560 snug threads** are ruled open for the founder. Snug, size `n`, 0 paths, no overlap.
3. **The pane was hidden twice** during the run, as noted above. The bar's transition values were read only after captured frames.
