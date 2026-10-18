# Skills Steward: Family and Person, round 17

**Verdict: APPLIED (0 blocker, 0 ugly, 0 polish).**

**b9622c7 is APPLIED.** It closes R16-1:
- The stack's `:is()` rule at `family-people.css:681` now sets `align-items: center`.
- The dead `.tp[data-stack] .tp-label { align-items: center; }` line is gone.
- At 1100 and 1200 the stacked label computes `flex / center`. The dot reads −0.3 on every tier, the ask's words sit 1.5px from "1910s", and every label is 20.7 tall. These are exactly the numbers I got when I injected the fix in round 16.

**Nothing else regressed:**
- 320, 390, 800, 1366 and 2560 are clean.
- The in-app first visit still draws once, at the fresh-load size, at 1366 and at 800.
- 925d874 did not change how Family or Person arrive in production, either fresh or in-app.

**One thing to route to the Shell's owner (not counted, development server only):** under StrictMode, every in-app page change runs the arrival a second time. That second run slides the sheet up again after the view transition has already brought it in. See note 1. It isn't in Family or Person code, and a production build never sees it. But the founder judges on the development server, so he does see it.

**Scope:**
- **b9622c7:** `family-people.css:681` (the stack's label rule) and the removed former line 686.
- **Read alongside it:**
  - `family-people.css` 151–154 (dot), 245–262 (band) and 676–694 (stack).
  - `Shell.tsx` 290–328 (925d874: the arrival moved to `useLayoutEffect`, and the busy re-arrival).
  - `Person.tsx` 112–135 (925d874: the held `.phero-sub`).
  - `lib/arrive.ts` 1–192.
  - `lib/pageTransition.ts` 1–58.
  - `App.tsx` 24–36 (`lazyPage`).
  - `main.tsx` (StrictMode).

**Skills loaded:**
- taste-skill: SKILL, house rules.
- hallmark: the 8-state rule, touch targets, and responsive (gate 34).
- emil-design-eng: the frequency table, and no animation on keyboard actions.
- impeccable: craft-floor (Verify → Type, Motion, States, Browser surfaces).
- gsap-react and gsap-performance: from-states before paint, `matchMedia` and cleanup.

I also read BAOS-STANDARD.md and DESIGN.md (targets of at least 44px). No other installed skill applies.

**How it was checked:**
- **Live, in my own tab (tab-183).** I force-reloaded at each width and took screenshots to force frames.
- **Per label:**
  - the computed `display` and `align-items`;
  - the dot's centre against the centre of the name's first line;
  - the ask's text against "1910s", using Range rects (same 13px face);
  - the label height;
  - the 44px hit rectangle (`::after`) against every face, node, ghost, link, button, `.tp-also`, `.tp-hint` and `.tp-name`;
  - `elementFromPoint` 1px inside the hit area's top and bottom edges.
- **Focus:** a real click on the non-interactive name, then a real Tab keypress.
- **Arrivals:**
  - A MutationObserver logged the sheet's inline transform and opacity, `data-size`, plate height, `.tp-state` lines, the first thread, tier bottoms, the Invitations line, `.pp-why`, and a `\d{4,} days? left` scan. Times are from the click.
  - A layout-shift PerformanceObserver ran alongside.
  - For the second arrival, I wrapped `__gsap.matchMedia` to log the React stack of every `arrive()` call.
- **Clean-up:**
  - I reset the viewport to desktop and closed my tab. Tabs 9, 73, 158, 180, 181 and 182 are untouched.
  - I never signed out, never touched `astory-app-auth`, and wrote no data.
  - I clicked only nav pills, a face link, and one non-interactive heading (for the Tab test).
- **Noise:**
  - Other agents edited `astory.css`, `archive-reading.css`, `signed-out.css`, `bookFit.ts` and `transcript.ts` throughout. Vite reloaded my tab four times, and one pill click landed during a reload.
  - Every number below comes from a run whose `performance.timeOrigin` matched the start of the run. Runs cut by a reload were thrown away and re-run.

**Not verified:**
- A production build. The note 1 claim that production is clean comes from reading the code and from the React stack.
- 3840.
- A real Edge zoom.
- Live frames: the pane was hidden.

## R16-1, item by item

| Item | Verdict | Evidence |
| --- | --- | --- |
| **R16-1** In the stack, the ask rode 4.8px above the generation's name, because the stack's `align-items: center` lost on specificity | **Fixed** | `:681` now carries `align-items: center` inside the (0,5,0) `:is()` rule, and the (0,3,0) line is removed. **1100, sample:** computed `flex / center` on all 5 labels. Dot −0.3 on every tier (was −2.3 on the tier with an ask). The ask's words sit −1.5 from "1910s" (was −4.8). Label 20.7 (was 22.7). Plate 1232.5, 2px shorter than round 16's 1234.5, which is the label's 2px. **1200, sample (still stacked):** identical numbers. |

## The stack at 1100 and 1200 (b9622c7)

| Width | Layout | Label | Dot (tier with an ask / without) | Ask text vs "1910s" | Label height | Hit area | Overlap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1100×900, sample | stack, `t`, plate 1232.5 | flex / center | −0.3 / −0.3 | −1.5 | 20.7 (the "Not placed yet" label with its hint, 45.5) | 44 × 158.6. Top and bottom edges hit the ask | none; 2.4px clear of the row |
| 1200×900, sample | stack, `t`, plate 1232.5 | flex / center | −0.3 / −0.3 | −1.5 | 20.7 | 44 × 158.6. Both edges hit the ask | none; 2.4px clear |
| 1100 and 1200, founder's tree | grid, `n`, plate 419.3, 2 threads | block | dot rides the faces' axis by design (`:151`, `top: calc(var(--pz) / 2 - 7px)`); untouched by b9622c7 | no decades | — | "a child" 44 × 67.6, both edges hit | none |

- **Focus ring (1200, after a real Tab from the name):** "Add Rose's grandparents" matches `:focus-visible`. The ring is 2px solid terracotta (rgb 154, 67, 32) at offset 2. It spans x 220–386 and y 283–309, so it sits 8px clear of the name (right edge at 212). It follows the ask's rounded shape.
- **Press and hover:** unchanged from round 16. b9622c7 touches neither.

## Regression sweep (sample tree)

| Width | Layout | Threads | Faces overlapping | Horizontal scroll | Labels | Hidden in view |
| --- | --- | --- | --- | --- | --- | --- |
| 320×800 | phone, `t`, plate 2438.3 | 0 | 0 of 16 | none (320) | all `center`, dot −0.3. "+ Rose's grandparents" wraps to line 2: label 38.7, 44 × 158.6, both edges hit, 1.0px clear of the row. Children h3 42.7, "and Margaret's" ends at 146.4, 1 NBSP | none |
| 390×844 | phone, `t`, plate 2099.2 | 0 | 0 | none | ask −1.5 from "1910s", 2.4 clear. "a child" wraps to line 2 of its label: 44 × 67.6, both edges hit (scrolled into view), 1.0 clear. `.tp-also` ends at 307.4, h3 22 | none |
| 800×900 | band, `t`, plate 1232.5 (tiers 190.4/421.5/227.5/209.9/183.2) | 0 | 0 | none (785 + scrollbar) | dot −0.3, ask −1.5, label 20.7, 44 × 158.6, 2.4 clear. `.tp-also` ends at 313.0 | none |
| 1366×900 | grid, `t`, plate 818.2 | 11 (opacity 0.75–0.95) | 0 | none | `block / normal`. `.tp-also` is a block, h3 40.2, `.tp-name` 37.7/37.7/57.2/37.7 | none once arrived |
| 2560×1440 | grid, zoom 1.44, plate 1178 | 11 | 0 | none (2545 = client) | `.tp-name` 54.3/54.3/82.4/54.3, children h3 57.9 | none |

**1366 and 2560 match round 16 exactly.** b9622c7 has no rule outside `.tp[data-stack]`, and the stack is off at all five widths.

**The phone and 800 plates differ from round 16's table, and that comes from round 16, not from this commit:**
- Round 16's 320 and 390 plates (2466.3 and 2152.5) were round 15's, from before 65c4e2b. 65c4e2b stopped the band's ask from setting a 44px line (`:255`), which the phone shares.
  - 320 drops 28px: the wrapped ask's line goes from 44 to 18.
  - 390 drops 53px: two asks, one on the name's line and one wrapped.
- At 800×900 the plate is 1232.5. That's round 16's 800×1024 figure, 4px under its 800×900 figure, and the tiers sit inside round 16's own "190–194/421/227/210/183".
- No stack rule reaches these widths. `data-stack` is false at 320, 390 and 800, and the computed `align-items` there comes from `:256`.

**The 2560 snug threads are ruled open** and weren't judged.

## In-app and fresh arrivals after 925d874 (the founder's family, one code out: Ty Ngo, 29 days)

| Width | Fresh `/family` | First visit: fresh `/` → Family pill | Family → Ty (in-app) | Ty → Family pill | Fresh Ty |
| --- | --- | --- | --- | --- | --- |
| 1366×900 | `m`, 475.3, 5 lines, first thread 539,217 | primed codes 2975–3305ms after load. **465ms: `m`, 475.3, 5 lines, 539,217, "29 days left". No further change** (logged to 6.1s). 0 layout shifts | 85–133ms: "Ty Ngo & Bao.", hero 92.9, `.pp-why` "Invited with a code, 29 days left…". Settles at y 667.4. 0 layout shifts | 140–153ms: `m`, 475.3, 5 lines, 539,217. Never refits (logged to 1.35s). The three `aria-busy` placeholders clear in turn | `.pp-why` y 667.4, "29 days left", hero 92.9, subline "Nhi Tran's parent". 0 layout shifts in the buffer |
| 800×900 | `t`, 599.4, 5 lines, tier bottoms 227/599, "for Ty Ngo · 29 days left". Every label `center`, dot −0.3, "Add a child" on the name's line | primed 1102–1387ms. **463ms: `t`, 599.4, 5 lines, 227/599, "for Ty Ngo · 29 days left". No further change** (logged to 5.9s) | — | — | — |

- Every page passed the four-digit day-count scan.
- The 800 values sit 25px under round 16's in-app table (624.7, 227/625). That table was taken at 2047f57, before 65c4e2b took the "a child" ask off the line height. Fresh and in-app agree at 599.4.
- On the first visit, the Family chunk loads behind the routes' `LoadingMark` (the heart) for about 300ms. That's `lazyPage`, unchanged, and the tree still draws once when it lands.

## Skill by skill

- **taste-skill:** applied.
  - In the stack, the generation's name, decade, dot and "+ ask" now read as one level line, at 1100 and 1200.
  - The first impression on Family is a settled tree at every measured width.
- **hallmark:** applied.
  - Touch targets: every ask keeps a 44px hit area, at least 67.6px wide. Both edges hit at every width.
  - Gate 34: no horizontal scroll from 320 to 2560.
  - States: focus-visible is real and clear of the name, and press and hover are unchanged.
- **emil-design-eng:** applied. b9622c7 adds no motion. On the highest-frequency path into Family there's still no layout jump.
- **impeccable:** applied.
  - Craft floor, Type: same-line text shares a line (1.5px, the band's figure).
  - States: keyboard focus is visible.
  - optimize, CLS: 0 layout shifts on every logged arrival.
- **GSAP (react, performance):**
  - Family and Person: no gaps. In production, `arrive()` runs once per page, in the commit, with `tookTransition()` true after a view transition, so the sheet isn't slid twice.
  - No face or label is left hidden in view at any sweep width.
  - In development only, see note 1.

## Notes, not counted

1. **For the Shell's owner (925d874 and `lib/pageTransition.ts`): in development, every in-app page change slides the sheet a second time.**
   - **What happens:** `tookTransition()` is consumed on first read (`pageTransition.ts:29–32`). React 19's StrictMode re-runs the arrival's layout effect, and the logged stack shows the second call coming through `reappearLayoutEffects`. That second `arrive()` reads `false` and sets the sheet to `translate(0, 56px)` and `opacity: 0`, after the view transition already brought the sheet in.
   - **Measured on Family → Ty at 1366:**
     - 85ms: the sheet is at rest and the view transition's new view is live.
     - 102ms: the sheet drops to `y 56`, `opacity 0`, then rises over 0.9s.
     - A screenshot at about 200ms shows only the bar on blank cloth.
     - Ty → Family does the same: the sheet sits at `y 56`, `opacity 0` by 140–153ms.
   - **Why production is clean:** StrictMode doesn't double-invoke there, and the busy effect (`Shell.tsx:320–328`) only re-arrives `inside`, which never touches the sheet.
   - **Why it's not new:** before 925d874 the same double call ran in the passive phase. It was round 16's note 4 ("the screenshot showed only the bar").
   - **Why it matters:** the founder reviews on the development server, so he sees the page rise twice.
   - **Fix:** remember the answer per arrival key in a ref, which survives StrictMode's re-run, and pass it in:
     ```tsx
     // Shell.tsx
     const via = useRef<{ ready: string; took: boolean } | null>(null);
     useLayoutEffect(() => {
       const el = root.current;
       if (!el) return;
       if (via.current?.ready !== ready) via.current = { ready, took: tookTransition() };
       return arrive(el, { via: via.current.took });
     }, [location.pathname, ready]);
     // arrive.ts:142
     const viaTransition = inside || (via ?? tookTransition());
     ```
     Shell is keyed by pathname, so the ref starts empty on every page. A changed `ready` still re-reads the flag, as now.
2. **At 390, the wrapped "a child" hit area also reaches 13px up over the bottom of "Rose's children and Margaret's".** This is round 16's note 1 (seen there at 320), on a second label. There's no control under it, and the add menu it opens can't destroy anything. Same ruling as round 16.
3. **In the grid (≥1100 for the founder's small tree, 1366+ for the sample), the dot sits on the faces' axis, not on the name** (`:151`). It's 13.7 below the name's first line, by design, and untouched since before round 14.
4. **The 2560 snug threads are ruled open for the founder.**
