# Bao's Standard: Family (/family) and Person (/family/:personId), round 14

**FAIL**, on one item. The item is old and small, but you can see it, and it is on the founder's own family on a phone.

Round 14's own work passes:
- **R12-1 is fixed** (34684a8, then 242612c and 2047f57). On an in-app visit, the tree now refits and rethreads, and it ends where a fresh load ends.
  - I checked 20 routes on 34684a8: Home, Ty's page, the sample tree, Archive and Book, each to Family, at 1366, 1920, 2560 and 800.
  - I checked 5 more on the session cache (Maya to Family, at all five sizes).
  - In every one, the size and the home generation's bottom match a fresh load, and both thread ends meet their faces.
  - The only difference is one 1px rounding at 1920. See note 1; it is not counted.
- **Long owner lists wrap in their own box** at 320 and 390 (5bfa37e and 242612c). They never pass the label's edge, never scroll the page sideways, and never touch the "+" asks. Since 242612c a line breaks only before "and".
- **The full pass** found nothing else. That is 40 fresh loads plus 45 in-app visits, on 8 pages at 1366, 1920, 2560, 800 and 390.

**The fail:** on the tablet band, the stacked layout and the phone, a generation's dot on the rail floats 17px above its name whenever a "+" ask sits on the name's line.

## Findings

1. **The generation dot sits 17px above the generation's name when a "+" ask shares its line.**
   - **What you see:**
     - The founder's own family at 390: the filled terracotta dot for "Your generation" sits half a line above the words, level with the tops of the capitals.
     - "Your parents" has no ask on its line, so its dot is level with its name, 0.3px off. The two dots on the same rail don't match.
     - The sample tree: the "1910s Rose's parents" ring floats the same way, with "+ Rose's grandparents" beside it.
   - **Where:** `src/styles/pages/family-people.css`.
     - In the `max-width: 1099.98px` block, `.tp-label` is `display: flex; align-items: baseline` (line 251), and every dot is pinned at `top: 3px` (line 253).
     - The stacked layout copies both rules at lines 677 and 680.
     - `.tp-ask` has `min-height: 44px` (line 159). When it sits on the first line, it makes that line 44–46px tall. The baseline alignment then drops the `h3` about 14px.
     - The dot stays at 3px from the label's top.
   - **Sizes:** 390×844, 800×1024 and 1100 (stacked), on any generation whose ask fits beside its name. At 320 the ask wraps below the name, so the dot is level (−0.3). At 1366, 1920 and 2560 the grid places the dot by design and is unaffected.
   - **Evidence**, as the dot's centre minus the centre of the title's first line, read from the page:

     | Page | Width | Tier | Offset | Ask on the line? | Other tiers |
     | --- | --- | --- | --- | --- | --- |
     | Real family | 390 | Your generation | −17.3 | yes | −0.3 |
     | Real family | 800 | Your generation | −17.3 | yes | −0.3 |
     | Sample tree | 390 | Rose's parents | −17.3 | yes | −0.3 |
     | Sample tree | 800 | Rose's parents | −17.3 | yes | −0.3 |
     | Sample tree | 1100 (stacked) | Rose's parents | −17.3 | yes | −0.3 |

     - At 800 on the sample: the dot spans y 350–364, the `h3` 363–385, and the ask 349–393.
     - At 390 on the real family: the label is 622–668 (46 tall), the dot 625–639, the `h3` 639–661, and the ask 624–668.
     - The same offset appears on in-app visits.
     - Captures:
       - `tool-results/mcp-Claude_Browser-blob-1792318618282-dcspfz.jpg` (real family, 390);
       - `tool-results/mcp-Claude_Browser-blob-1792318650487-hgd33b.png` (sample, 800, zoomed).
   - **Rules:**
     - rule 10 ("columns align and tops line up");
     - the checklist's "aligned columns";
     - rule 30: the rail and its dots are the register's spine, and a dot that misses its generation's name reads as a mistake;
     - rule 1: I checked every tier of both trees at 320, 390, 800, 1100, 1366, 1920 and 2560. Only the tiers listed above are affected.
   - **Fix:** in the band and stacked rules, keep the ask's 44px target but stop it setting the line's height: give `.tp-ask` `min-height: auto` there, with an absolutely placed `::after` hit area 44px tall. Alternatively, centre the dot on the `h3` line instead of pinning it at `top: 3px`.

## This round's brief, item by item

| Item | Verdict | Evidence |
| --- | --- | --- |
| In-app fit and threads (R12-1) | **Fixed** | See the in-app table below. |
| Long owner lists at 320 and 390 | **Holds** | I swapped the text in my tab only, applying the same no-break joins 242612c uses. **"and Margaret's and Eleanor's and Christopher's and Bartholomew's and Wilhelmina's":** at 320 it breaks "and Margaret's and Eleanor's" / "and Christopher's" / "and Bartholomew's and Wilhelmina's". At 390 it breaks after "Christopher's". The right edge is 290.9 at 320 (label edge 300) and 353.1 at 390 (label edge 370). **"and Nguyen Thi Thanh Huong's and Tran Van Minh's":** breaks only before "and", at both widths. **A hyphenated 50-letter name:** breaks at its hyphen. **One unbroken 50-letter name:** breaks inside the word at 299.6, within the label, the fallback `overflow-wrap: anywhere` gives. **Every case:** `scrollWidth` equals the viewport, there is no overlap with the "+" asks, and the wrapped lines start on the heading's own edge (x 50). **The real family at 390,** with three owners: two lines, x 50–347 at most (label edge 370). **The region's name:** each tier's `section` is now `aria-labelledby` its `h3`. |
| Cloth titles | Lead ruling | Bold Montserrat on the cloth (Standard 14, 82a9914). Not counted. |
| 2560 snug threads | Ruled open | The sample tree at 2560 is `data-snug="1"`, size `n`, 0 paths, fresh and in-app. Not counted. |

## In-app routes against a fresh load

**What I compared:** `data-size`, the home generation's bottom against the fold, and every thread's path `d`, checked against the nodes' layout boxes.

**First pass, on 34684a8:**
- **1366:** Home, Ty's page, the sample tree, Archive and Book, each to Family by the pill. All five are identical to a fresh load: size `n`, home 711 against a fold of 756, the same two paths.
  - A MutationObserver shows the fix working: the plate draws at `m` with 1 state line, then at about 400ms after the codes arrive it redraws at `n` with 5.
  - Round 12's case (Ty's thread starting inside his own "invited · waiting for them") is gone. Each thread starts 6px under its node and ends 6px above its face.
- **2560:** all five routes identical: size `l`, home 822, the same paths.
- **800:** all five routes refit `m` → `n` and end identical: home 984 against a fold of 1012, so Bao's three friends are above the fold.
- **1920:** size `l`, home 822, and the Ty-to-Nhi-Tran thread are identical on all five routes. The dotted thread from "a parent of yours" starts at x 776.5 instead of 777.5 on four of the five (Home matched). See note 1.

**Second pass, on 242612c and 2047f57:** the codes are now remembered for the session, so an in-app visit draws once, with every state line already present.
- Maya to Family at 1366, 2560, 800 and 390: identical.
- Maya to Family, and Ty's page to Family, at 1920: identical, except the same 1px.

## Fresh pass and in-app pass

**Pages:**
- `/family` (the real family, "The Vos.") and `/family?preview=tree` ("The Hartleys.").
- Person pages:
  - Bao Vo (`5aa5a1cf…`);
  - Ty Ngo (`36cfd520…`);
  - `sample-rose`, `sample-claire`, `sample-mark` and `sample-maya`, each with `?preview=tree`.

**Sizes:** 1366×768, 1920×1000, 2560×1300 (`--zoom` 1.3), 800×1024 and 390×844.

**Loads:** 40 fresh loads. Then, at every size, 9 in-app visits:
- tree → Rose;
- back to the tree;
- tree → Claire;
- tree → Mark;
- tree → Maya;
- Maya → Family pill;
- Family → Bao;
- back;
- Family → Ty.

| Check | Result, fresh and in-app |
| --- | --- |
| Horizontal scroll | None. `scrollWidth` equals `clientWidth` on every load. |
| Text under 12px (rendered, times the zoom) | None. |
| Targets under 44px (including `::after` hit areas) | None. |
| Clipped text | None. |
| Overlapping text (pairwise, excluding the bar, the tab bar and the clamped excerpts) | None. |
| Left half-faded after settling | None, except the sample's disabled "Invite someone" (0.65, `aria-disabled`), by design. |
| "Where to next" | Every page, every size. |
| Tree | **Real family:** `n` with 2 paths at 1366; `l` with 2 at 1920 and 2560; `n` with 0 at 800; `t` with 0 at 390. **Sample:** `t` with 11 paths at 1366 and 1920; snug `n` with 0 at 2560; `t` band at 800 and 390. In-app visits match. |
| Dot alignment | Finding 1 at 390 and 800. The grid sizes are by design. |
| Person pages at 1920 and 2560 | Mark and Maya fit one screen (`scrollHeight` equals the window). |

Rules 32–46 hold as in round 13: the kept line, Bond's empty states, the cloth hero with its full stop, and "Where to next".

## Notes, not counted

1. **The 1px start at 1920.**
   - **What happens:** on an in-app visit at 1920, the dotted thread from the "a parent of yours" ring starts 1.1px left of the ring's true centre (776.5 against 777.61). A fresh load is 0.1px off (777.5).
   - **The cause:** `measure()` sums integer `offsetLeft` values. While the arrival tween runs, the transformed `.tp-ghost` becomes the ring's `offsetParent`, so two rounded values are added instead of one (689 + 30 + 57.5). The redraw that now follows the codes, or the one from `fonts.ready`, can land inside that tween.
   - **Where:** I saw it at 1920 only. It never appeared at 1366, 2560 or 800.
   - **Why it is not counted:** you can't see it. It is a 1px offset on a dotted line under a 115px ring.
   - **If you want it exact:** measure with `getBoundingClientRect()` relative to the plate, divided by `pageZoom()`.
2. **An "00a0" seen once.** One capture, taken during the view transition from Family to Bao's page at 390, showed the label as "and00a0Nhi00a0Tran's" (`tool-results/mcp-Claude_Browser-blob-1792319518965-lzp9zv.jpg`).
   - The live DOM holds real U+00A0 characters, and Vite serves `"\xA0"`.
   - Two retries of the same transition, and every other capture, drew "and Nhi Tran's".
   - It happened while the lead's edits were reloading the page. I could not reproduce it, so it is not counted. If it is ever seen again, look at the transition's snapshot of the no-break spaces.
3. **Work landed while I reviewed.**
   - 242612c (the codes cache and the "and" breaks) at 06:15, and 2047f57 (codes primed at sign-in) later. The in-app pass ran on those; the first route pass ran on 34684a8.
   - HMR reloads cut five of my audits. I reran each one.
   - At one point, after a hook was added to `useMyCodes`, HMR left the page on "Should have a queue". A reload cleared it. It is an HMR artifact, not a product bug.
   - Uncommitted edits to Shell, Home, Archive, Person, Write and book-account.css are in the tree now. I did not review them.
4. **Known:** the founder's test content (Ty Ngo as "Nhi Tran's parent", the two Nhis, friends in "Your generation") and Bond's painterly style.

## How I checked

- **Code read:**
  - the 34684a8, 5bfa37e and 242612c diffs;
  - `FamilyTree.tsx` (`draw`, `measure`, `balance`) and `treeMotion.ts`;
  - the `.tp-label`, `.tp-dot` and `.tp-ask` rules in `family-people.css`;
  - the Vite-served module, to confirm the NBSP.
- **My own pane tab (tab-167):**
  - I force-reloaded first, sized the tab per width, and took captures to force frames. When the pane was hidden, I waited for the route change and the page content instead.
  - Before measuring, I stepped `__gsap.ticker.tick()` and `__st.update()` while scrolling through each page with dispatched scroll events, then came back to the top.
- **Measured:**
  - the tree's `data-size`, `data-stack` and `data-snug`, and its path `d` strings;
  - the node and face layout boxes, and the home tier's bottom against the fold;
  - a MutationObserver log from the click onward;
  - dot and title-line centres;
  - Range `getClientRects` per character for the owner lines;
  - and, on every load, `scrollWidth`, font sizes, targets, clipping, opacity chains, pairwise text overlap and "Where to next".
- **What I touched:**
  - I clicked only navigation links (pill, nodes and history back) and wrote no data.
  - The owner swaps were `textContent` changes in my tab only.
  - I kept my scripts in `sessionStorage` keys `bao-r14*` and removed them all.
  - I only read whether `astory-app-auth` exists (it does). I never signed out.
  - I reset the viewport to desktop and closed tab-167.

**Not verified:**
- A real pointer's hover and press.
- Reduced motion.
- 3840 wide.
- A real Edge zoom.
- The failure and loading states.
- The other three real Person pages.
- The uncommitted edits in note 3.
- vitest and tsc (not run by me).

## Score (taste floor)

Philosophy 4, hierarchy 4, execution 3, specificity 4, restraint 4, variety 4.

What this round fixed is fixed. In-app visits now match a fresh load at every size, and long owner lists wrap cleanly between owners. One thing stops the pass: on a phone or tablet, the dot on the rail floats above a generation's name whenever its "+" ask sits beside it, and the founder's own "Your generation" is one of those tiers. Line that dot up and Family passes.
