# Skills Steward: Family and Person, round 13

**Verdict: GAPS (0 blocker, 0 ugly, 1 polish).**

R12-1 is fixed, and I measured it live:
- At 320 the label now reads "1960s Rose's children / and Margaret's", with the wrapped "and" at x 50, on the decade's edge.
- The heading's accessible name is "Rose's children and Margaret's", with a real space.
- On one line the gap is 8.04px, the same as the old margin.

The change itself is clean at every width. It does not pass yet because of one older fault that this round's probe exposed (R13-1):
- The `.tp-also` run is `nowrap`, so it can never wrap.
- With three or more other owners ("and Margaret's and Arthur's and Frank's…") it runs past the label's edge at 320. With four at 320, or five at 390, the text is cut off at the screen edge.
- It came in with e9205dc, not with 80cf925. Round 12's long-owner probe only tried strings that happened to fit, so it said "no overflow". That was wrong for longer strings, and I'm correcting it here.

The fix is one declaration in two rules.

**Scope:**
- 80cf925:
  - `FamilyTree.tsx:566`: `<span className="tp-sp"> </span>` goes before `.tp-also`.
  - `family-people.css:248` (band) and `:679` (stack): `.tp-also` margin is now `0`.
  - `family-people.css:697–698`: `.tp-sp { word-spacing: 4px }` and its comment.
- Read alongside them:
  - `family-people.css` 145–165 (the grid label, `.tp-also { display: block }`, the h3's `text-wrap: balance; overflow-wrap: anywhere`), 244–262, and 670–702.
  - `plateModel.ts` 193–208, where `also` is built as `and ${owners.join(" and ")}`.
  - `FamilyTree.tsx` 555–575, where the section takes `aria-label={tier.title}`.

**Skills loaded:**
- taste-skill: SKILL (house rules), critique.
- hallmark: responsive, typography.
- emil-design-eng: the review checklist, the frequency rule, and the hover, press and reduced-motion rules.
- impeccable: SKILL, craft-floor, typeset.
- gsap-react, gsap-performance, gsap-scrolltrigger.

I also read BAOS-STANDARD.md and DESIGN.md. No other installed skill applies to a one-space type change.

**How it was checked:**
- **Tests:**
  - vitest on `components/family` and `components/person` passes: 5 files, 47 of 47 tests.
  - `tsc --noEmit` prints nothing.
- **Live, in my own tab (tab-160):**
  - **Sample tree:** I force-reloaded `/family?preview=tree` at 320, 340, 390, 800, 1100, 1366 and 2560, and stepped `__gsap.ticker.tick()` before every read.
  - **Two heights at 2560:** 2560×1440 (html zoom 1.44, the grid) and 2560×1300 (html zoom 1.3, snug). `lib/zoom.ts` takes the smaller of w/1600 and h/1000, which is why round 11 and round 12 saw different 2560 layouts.
  - **Frames:** I took screenshots to force frames at 320, 390, 800, 1100, 1366 and 2560×1440. After that the pane was hidden, so the 2560×1300, real-family, R13-1 and Person reads are layout-only measurements, which need no frames.
  - **Real family:** `/family` at 320.
  - **Person page:** `/family/sample-rose?preview=tree` at 320 and 1366.
- **Probes:**
  - In my tab I swapped the `.tp-also` text to longer owner lists, then put it back.
  - Once, I injected `.tp .tp-label .tp-also { display: inline-block; max-width: 100%; white-space: normal }` to test the R13-1 fix. I removed it in the same call and checked that it was gone.
- **Clean-up:**
  - I reset the viewport to desktop and closed my tab. The founder's tabs are untouched.
  - I never signed out, never touched `astory-app-auth`, wrote no data and clicked nothing.
- **Concurrent work:**
  - The dev server is also serving another builder's uncommitted edits (`Shell.tsx`, `lib/arrive.ts`, `Person.tsx`, `Home.tsx` and others).
  - Mid-run, Vite showed a transient parse-error overlay for `arrive.ts:190`. It was gone on reload, and the diff on disk parses.
  - None of those files touch the tree label. The Person-page reads include that work in progress.

**Not verified:**
- A real screen reader's speech: I read the accessibility tree, not VoiceOver or NVDA.
- A real Edge zoom, as opposed to emulated widths.
- 3840.
- The add flow, because it would write.

## Round 12, item by item

| Item | Verdict | Evidence |
| --- | --- | --- |
| **R12-1** No break point before "and Margaret's"; the 320 heading split "Rose's / children" | **Fixed** | **At 320:** line 1 is "1960s Rose's children", with the h3 text at x 99.3–203. Line 2 is "and Margaret's" from x 50 to 146.4: the wrapped "and" starts on the heading's own edge, the decade's left. The `.tp-sp` space has no client rect there, so it hangs at the line end and adds no indent or overflow. The h3 is 42.7 tall (two lines at 20.7 leading). **At 340, 390, 800 and 1100** the label is one line, and the gap from "children" to "and" is **8.04px**: the space at 18px Cormorant (~4px) plus the 4px `word-spacing`. That is the old 8px margin. **Heading text:** `textContent` and the accessibility tree both give "Rose's children and Margaret's", at 1366 and at 2560. The "childrenand" is gone. **Margins:** `.tp-also` computes `margin: 0px` in the band and the stack. |

## The grid label and the names

**The grid label is unchanged.**
- **At 1366:** the plate is 818.2 with 11 threads, the same as rounds 11 and 12.
  - The plain tiers' `.tp-name` is 37.7 tall (13 + 4 + 20.7).
  - On "Rose's children" the h3 is 40.2 tall: the title line (20.7), plus the 2px `margin-top`, plus the block "and Margaret's" (17.5). It sits at x 73.7, flush under the title.
  - `.tp-sp` has no client rect: the space collapses at the end of the anonymous line before the block, so it adds no width and no extra line.
- **2560×1300 (zoom 1.3):** `data-size=n data-snug`, 0 threads, and `.tp-name` 49 tall, all as in round 12. The children h3 is 52.3 tall.
- **2560×1440 (zoom 1.44):** grid, 11 threads, `.tp-name` 54.3 tall (37.7 × 1.44), as in round 11.

**The names:**
- **Heading:** "Rose's children and Margaret's" at every width.
- **Section region:** "Rose's children", from `aria-label={tier.title}` on the `<section>` (`FamilyTree.tsx:558`). This round did not change it. See note 1.

## Regression sweep

| Width | Layout | Threads | Faces overlapping | Horizontal scroll | Label |
| --- | --- | --- | --- | --- | --- |
| 320 | phone, size `t` | none | 0 of 16 | none | "1960s Rose's children / and Margaret's", wrap at x 50. Plate 2466.3. |
| 340 | phone | none | 0 | none | One line, gap 8.04. Plate 2445.6. |
| 390 | phone | none | 0 | none | One line, gap 8.04. "Rose's grandparents" beside the name at x 205.5, 44px. "a child" at x 50, 44px. Plate 2152.5. |
| 800 | band | none | 0 | none | One line, gap 8.04. Plate 1257.8, as in round 12. |
| 1100 | stack | none | 0 | none | One line, gap 8.04. Plate 1257.8; the last tier's `padding-bottom` is 0. |
| 1366 | grid | 11 | 0 | none | Unchanged; see above. Plate 818.2. |
| 2560 | grid (zoom 1.44) / snug (zoom 1.3) | 11 / 0 | 0 / 0 | none | Unchanged. The snug threads are ruled open. |

- **Real family at 320:** "Your parents and Nhi Tran's" stays on one line, 22px tall, with no horizontal scroll.
- **Person page (Rose):** renders at 320 and 1366 with no horizontal scroll and ends with "Where to next". At 1366 its four place links are 44px.

## Gaps

### R13-1. POLISH: a long owner list can't wrap, and runs off a phone's edge
**Skill:**
- hallmark responsive (no content past the viewport at 320; "display headers wrap… via `overflow-wrap: anywhere`").
- taste-skill critique pass 13 ("Does any element run off the edge of the phone screen?").
- impeccable craft-floor, Verify ("Run the real copy at every breakpoint and fix what overflows").

**Where:**
- `family-people.css:248`: `.tp-also { display: inline; margin: 0; white-space: nowrap; }`.
- `family-people.css:679`: the same rule under `.tp[data-stack]`.
- `plateModel.ts:207`: `also` is `and ${owners.join(" and ")}`, one possessive for each other parent in the tier. Cousins from three siblings give three.

**Why:** `nowrap` turns the whole list into one unbreakable run. The h3's `overflow-wrap: anywhere` can't help, because it only acts where wrapping is allowed.

**Measured (text swapped in my tab, sample tree):**

| Width | "and Margaret's and Arthur's and Frank's" | "+ and Jim's" | "+ and Jim's and Ann's" |
| --- | --- | --- | --- |
| 320 (label edge 300) | ends at 306.7, 6.7px into the gutter | ends at 370.6, cut off at 320 | (cut off) |
| 390 (label edge 370) | fits | ends at 370.6 | ends at 437.6, cut off at 390 |

`html` and `body` clip on x, so the page never scrolls sideways. The words just get cut off.

Up to two owners fit at every width, so the sample and the founder's real family look fine today. A family where three or more of Rose's siblings have children doesn't.

**The fix, live:** with `.tp-also { display: inline-block; max-width: 100%; white-space: normal }`:
- The list still moves as one unit after the space: "and" starts at x 50.
- When it is longer than the line, it wraps inside its own box and stops at the label's edge (300 at 320, 370 at 390).
- The one-owner case is identical at 320 and 390: same positions, same 8.04 gap, same h3 height.

**Change:**

```css
/* family-people.css:248 and :679 (keep the grid's display: block at :157 as it is) */
.tp-also { display: inline-block; max-width: 100%; margin: 0; }
```

Drop `white-space: nowrap` from both rules. The inline-block already keeps "and Margaret's" together, because an atomic inline only breaks before itself, at the `.tp-sp` space.

## Skill by skill

- **taste-skill:** applied, with R13-1 open.
  - No headline runs past two lines at any width I measured.
  - No face lies on another (pass 13).
  - At 320 the wrapped "and" shares x 50 with the decade and the asks (pass 4, edges).
- **hallmark:** applied, with R13-1 open.
  - No horizontal scroll at 320, 340, 390, 800, 1100, 1366 or 2560 (both heights), nor on the Person page.
  - No control label wraps, and the asks stay 44px.
  - The "Rose's children / and Margaret's" break now falls between phrases, not inside the generation's name.
- **emil-design-eng:** nothing to review in motion.
  - The change has no transition, no hover and no animation.
  - The 8px gap is now a word space, so it scales with the heading's font and zoom instead of being a fixed margin.
- **impeccable:** applied, with R13-1 open.
  - typeset "Stress" (long headings, narrow containers): the one-owner case is right at every width. The long-owner case is R13-1.
  - The accessible name is now real words.
  - DOM order and focus order are unchanged.
- **GSAP (react, performance, scrolltrigger):** no gaps.
  - No tween, split or ScrollTrigger touches `.tp-label`. `treeMotion.ts` and `scrollShell.ts` are unchanged.
  - The label's height is unchanged in every layout, so no refresh is needed.

## Notes, not counted

1. **The tier's region is named "Rose's children",** while its heading says "Rose's children and Margaret's". The region holds Claire, Margaret's daughter. This was there before this round. If you want the landmark list to match, replace `aria-label={tier.title}` with `aria-labelledby` pointing at the h3's id. It costs one id per tier.
2. **Hidden hover captions at 320:** `.tp-cap` reaches x 338.5 at opacity 0 inside `.tp-face`, so `body.scrollWidth` reads 338 while the page itself is 320 and clipped. This was there before, it's invisible, and it doesn't scroll. If a caption is ever shown on touch, check its edge.
3. **The 2560 snug threads** are ruled open for the founder. Snug at zoom 1.3: 0 paths, no overlap.
