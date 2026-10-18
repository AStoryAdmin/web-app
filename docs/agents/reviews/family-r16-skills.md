# Skills Steward: Family and Person, round 16

**Verdict: GAPS (0 blocker, 0 ugly, 1 polish).**

**2047f57 is APPLIED.** R15-1, R15-2, R15-3 and note 1 are all fixed. I checked them in the code and live:
- At 1366, 1920 and 800, the first Family visit of a session draws once, at the fresh-load size, with the state lines, and never refits.
- Later visits draw the same way.
- No page ever shows "20773 days left" or any four-digit day count. I logged the text from the click onward, 12 times.

**The one gap is in 65c4e2b**, the coordinator's addition. In the band (≤1099) the dot fix works at 320, 390 and 800. In the stack it doesn't, because the stack's `align-items: center` loses on specificity:
- **R16-1 (polish):** at 1100 the "+ Rose's grandparents" text rides 4.8px above "1910s" on the same line. The dot is 2.3px off its name, and the label is 2px taller than its neighbours. It's a one-line fix.

The hit area itself passes: 44px tall, no overlap with any face or control, and a visible focus ring.

**Scope:**
- **2047f57:**
  - `useMyCodes.ts:11–34`: `last`, `lastAt`, `gen`, `clearCodesCache()` (clears both and bumps `gen`) and `primeCodes()`.
  - `useMyCodes.ts:47`: `now` starts from `lastAt ?? new Date(0)`.
  - `useMyCodes.ts:51–58`: the fetch is gen-guarded and sets `lastAt` before `setCodes` and `setNow(lastAt)`.
  - `AccountProvider.tsx:14, 42`: `primeCodes()` in `reload()`, beside `loadAccount` and `loadFamily`.
  - `Person.tsx:248`: `mine.reload()` after `setSent(...)` in `sendCode`.
  - `FamilyTree.tsx:569`: `x.replace(/ /g, "\u00a0")`.
- **65c4e2b:** `family-people.css:255–257` (band) and `:685–687` (stack).
- **Read alongside them:**
  - `AuthProvider.tsx` 37–77.
  - `useHold.ts` 1–125.
  - `familyWrites.ts:143` (`listMyCodes`).
  - `Family.tsx` 51–118, 139, 189–192 and 248.
  - `Person.tsx` 78, 165–168 and 207–255.
  - `Account.tsx`, the only `signOut()` caller.
  - `family-people.css` 155–166 and 236–262.

**Skills loaded:**
- taste-skill: SKILL, house rules.
- hallmark: slop-test gates 33, 34 and 49–51, responsive, and interaction-and-states (loading, states, bans).
- emil-design-eng: the frequency table.
- impeccable: craft-floor (Verify: Type, States), harden (network failures, date/time, concurrent operations, race conditions), optimize (CLS).
- gsap-react and gsap-performance. Neither commit touches GSAP.

I also read BAOS-STANDARD.md (rule 29) and DESIGN.md (rule 6, targets of at least 44px; the "Honesty and the floor" rules). No other installed skill applies.

**How it was checked:**
- **Tests, at 2047f57:**
  - vitest on `components/family` and `components/person` passes: 5 files, 47 of 47 tests.
  - `tsc --noEmit` and eslint on the four changed source files print nothing.
  - `FamilyTree.tsx` has 0 literal `C2 A0` bytes, while the rendered `.tp-also` holds exactly one U+00A0 at every sweep width.
- **Live, in my own tab (tab-176):**
  - A MutationObserver logged `data-size`, plate height, the number of `.tp-state` lines, the first thread's start (or the tier bottoms at 800), the Invitations text, `.pp-why`, and a scan of `document.body.textContent` for `\d{4,} days? left`. Times are from the click.
  - Resource Timing gave the `family_codes` requests. The buffer was full at 250 entries in the first run; I raised it to 5000 and cleared it per run.
  - I took a screenshot after each step to force frames.
  - **First visit:** a force-reloaded `/`, then the Family pill.
  - **Later visits:** Home pill → Family pill, Family → Ty Ngo's page, and Ty → Family pill.
- **The 65c4e2b check:**
  - I force-reloaded the sample tree at 320, 390, 800 and 1100, and the founder's tree at 800.
  - Per label, I measured the dot's centre against the name's first line, the ask's text against "1910s" (same font, 13px, from Range rects), and the label height.
  - I measured the 44px hit rectangle against every face, node, ghost, link, button, `.tp-also`, `.tp-hint` and `.tp-name`.
  - `elementFromPoint` at the hit area's top and bottom edges returned the ask.
  - A real Tab keypress gave the keyboard focus ring.
  - I tested the specificity fix by injecting the corrected rule into my tab, measuring, then removing it.
- **Sweep:** the sample tree at 320×800, 390×844, 800×900, 800×1024, 1100×900, 1366×900 and 2560×1440.
- **Clean-up:**
  - I reset the viewport to desktop and closed my tab. The other tabs (9, 73, 158, 174, 180) are untouched.
  - I never signed out, never touched `astory-app-auth`, wrote no data, and clicked only nav pills and face links.
- **Noise:**
  - Other agents edited the working tree throughout: `Shell.tsx`, `Home.tsx`, `Person.tsx`, `Write.tsx`, `Archive.tsx` and `book-account.css`, now landed as 925d874 and bf50499. Once, a `Write.tsx` parse error put Vite's overlay up for a few seconds. None of these files touch the codes path.
  - Every number below comes from a run with no reload in it. I checked `performance.timeOrigin` against the step.

**Not verified:**
- A production build.
- 3840.
- A real Edge zoom.
- Live frames: the pane was hidden.
- Revoking or adding a code live, because both would write. They were checked by reading the code, as asked.

## Round 15, item by item

| Item | Verdict | Evidence |
| --- | --- | --- |
| **R15-1** The first Family visit drew without the state lines, then refit | **Fixed** | `primeCodes()` runs in `AccountProvider.reload()`. On every force-reloaded Home, one `family_codes` request went out with the family load: 1964–2301ms at 1366, 1909–2224ms at 1920, 2880–3170ms at 800. By the time of the click, `last` and `lastAt` are filled, and the first visit draws once at the fresh-load size (table below). |
| **R15-2** Cached codes counted from 1970 ("20773 days left") | **Fixed** | `now` starts from `lastAt`, which the fetch that filled `last` set (`useMyCodes.ts:47`, 30 and 55). Invitations reads "for Ty Ngo · 29 days left" from its first frame on every visit. Ty's page reads "Invited with a code, 29 days left; nothing here reaches Ty until they accept." from its first frame at all three widths. The four-digit scan was false in all 12 logs. **If the refetch fails,** it shows the count from the last good fetch, which is right to within the session's age. No invented number. |
| **R15-3** A code made on the person page never reached `last` | **Fixed (code reading)** | `Person.tsx:248`: `mine.reload()` → `setVersion` → a fresh `listMyCodes()` → `setCodes(list)` writes `last` and `lastAt`. Because `coded` now includes the person, `shownState` turns the page's state line to "invited · waiting for them" beside the new CodeCard. The next in-app Family visit draws them as invited. |
| **Note 1** The NBSP was a literal invisible character | **Fixed** | `FamilyTree.tsx:569` reads `"\u00a0"`. There are 0 literal NBSP bytes in the file. The rendered label is `"and\u00a0Margaret’s"` at all widths, and the R14-1 numbers are unchanged (sweep below). |

## In-app visits (2047f57)

The founder's family, with one code out (Ty Ngo, 29 days). The times are from the click.

| Width | Fresh load | First visit: fresh `/` → Family pill | Home → Family pill | Ty's page (in-app) | Ty → Family pill |
| --- | --- | --- | --- | --- | --- |
| 1366×900 | `m`, 475.3, 5 lines, threads 539,217 (round 15's values; the same draw path) | **682ms: `m`, 475.3, 5 lines, 539,217, "29 days left". No further change.** The hook's codes requests (689–1034ms) changed nothing | 133ms: identical, never refits | 323ms: "29 days left", `.pp-why` at y 667–706 | 126ms: identical |
| 1920×1080 (zoom 1.08) | `m`, 513.2, 5 lines, threads 538,217 and 709.5,169 | **672ms: `m`, 513.2, 5 lines, 537,217, "29 days left". No further change** | 141ms: identical | 115ms: "29 days left" | 126ms: identical |
| 800×900 | `t`, 624.7, 5 lines, tier bottoms 227/625 | **608ms: `t`, 624.7, 5 lines, 227/625, "29 days left". No further change** | 122ms: identical | 128ms: "29 days left" | 96ms: identical |

**Two details in the table:**
- The 1920 thread start reads 537 in-app and 538 on one fresh load. Round 15 had 537 on a fresh load. It's sub-pixel rounding at zoom 1.08, not a refit: there's one draw, and `data-size` and height are equal.
- At 800, I ran at 900 tall. Round 15 used 1024 tall, which fits `n`/705.2. Each comparison here is fresh against in-app at the same size.

**Sign-out, by reading the code:**
- Both `AuthProvider` paths call `clearCodesCache()`: `onAuthStateChange` with no session (line 42, which also covers another tab's sign-out) and `signOut` (line 75). It nulls `last` and `lastAt` and bumps `gen`.
- A prime or hook fetch in flight then lands with `g !== gen` and is dropped (`useMyCodes.ts:28` and `:54`).
- With no `userId`, `reload()` returns before priming, so nothing re-primes for a signed-out tab.
- The next sign-in's `reload()` primes under the new `gen`.
- A hard reload starts all three at their initial values.

## The coordinator's addition: 65c4e2b (the dot and the ask)

| Width | Layout | Label `align-items` | Dot offset (tier with an ask / without) | Ask text vs "1910s" | Label height | Hit area | Overlap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 320 | band | center | −0.3 / −0.3 | ask wraps to line 2 | 38.7 (two lines) | 44, 158.6 wide; top and bottom edges hit the ask | no face or control. Bottom edge is 1.0px above the row. The top 13px reaches over the non-interactive `.tp-name` (note 1) |
| 390 | band | center | −0.3 / −0.3 | −1.5 | 20.7 | 44 × 158.6; "a child" wraps to line 2 of its label, 44 × 67.6 | none; 2.4 and 1.0px clear of the rows |
| 800 | band | center | −0.3 / −0.3 | −1.4 | 20.7 | 44 × 158.6 | none; 2.4px clear |
| 800, founder | band | center | −0.3 / −0.3 | — | 20.7 | "a child" 44 × 67.6 | none; 2.4px clear |
| 1100 | **stack** | **baseline** (the new rule loses) | **−2.3** / −0.3 | **−4.8** | **22.7** against 20.7 | 44 × 158.6, edges hit the ask | none; 5.7px clear |
| 1100, corrected rule injected | stack | center | −0.3 / −0.3 | −1.5 | 20.7 | 44 | none; 2.4px clear |

- **Focus ring (1100, after a real Tab):** `:focus-visible` is true. The ring is 2px solid terracotta (rgb 154,67,32) at offset 2, spanning x 217–383 and y 277–303. It's 8px clear of the name (right edge at 209). No ancestor clips it: the only clipping ancestors are `html` and `body` with `overflow-x: clip`.
- **Press and hover:** `:active` keeps `scale(0.97)` in 120ms. The hover colour is unchanged, and the 160ms transition is on `color` and `text-decoration-color` only (emil: no `transition: all`, nothing over 300ms).

## The sweep (sample tree)

| Width | Layout | Threads | Faces overlapping | Horizontal scroll | Label and names | Hidden in view |
| --- | --- | --- | --- | --- | --- | --- |
| 320×800 | phone, `t`, plate 2466.3 | 0 | 0 of 16 | none (320) | children h3 42.7, "and Margaret’s" ends at 146.4, 1 NBSP | none (`.tp-cap` hover captions excluded, by design) |
| 390×844 | phone, `t`, plate 2152.5 | 0 | 0 | none | ends at 307.4, h3 22 | none |
| 800×900 / ×1024 | band, `t`, plate 1236.5 / 1232.5 | 0 | 0 | none (785 + scrollbar) | one line, ends at 313.0 | none |
| 1100×900 | stack, `t`, plate 1234.5 | 0 | 0 | none | one line, ends at 322.6 | none |
| 1366×900 | grid, `t`, plate 818.2 | 11 (opacity 0.75–0.95) | 0 | none | `.tp-also` a block. h3 40.2, `.tp-name` 37.7/37.7/57.2/37.7 | none |
| 2560×1440 | grid, zoom 1.44, plate 1178 | 11 | 0 | none | `.tp-name` 54.3/54.3/82.4/54.3, children h3 57.9 | none |

320, 390, 1366 and 2560 match round 15 exactly.

800 and 1100 are 21–25px shorter than round 15's 1257.8. That's 65c4e2b working as intended: the first tier no longer grows to the ask's 44px. The tiers measure 190–194/421/227/210/183.

The 2560 snug threads are ruled open and weren't judged.

## Gaps

### R16-1. POLISH: in the stack, the ask still rides above the generation's name, because `align-items: center` never applies (65c4e2b)
**Skill:**
- impeccable craft-floor, Verify → Type: "obvious scale and weight steps", and type on one line shares a baseline.
- taste-skill critique, "Mistakes the inspector cannot see".
- BAOS round 14 (`family-r14-baos.md`), which named the stack as one of the two places to fix.

**Where:**
- `family-people.css:681`: `.tp[data-stack] :is(.tp-label, .tp-tier.home .tp-label, .tp-tier.rings .tp-label) { … align-items: baseline; … }`. Its specificity is (0,5,0), because `:is()` takes its most specific argument.
- `family-people.css:686`: `.tp[data-stack] .tp-label { align-items: center; }` is only (0,3,0). It is dead.

**Why:** with `min-height: 0`, the stacked ask now aligns by the baseline that the inline-flex synthesizes from its 18px circle. Measured at 1100:
- the ask's words sit 4.8px above "1910s", which is the same 13px Montserrat on the same line;
- the label is 22.7px tall against 20.7 for every other tier;
- the dot is 2.3px off its name, where every other tier reads −0.3.

That's much better than round 14's 17px, but it isn't level. The stack is what a large family gets in a wide window, at 1100–1365 and on zoomed screens.

**Change:** set the stack's alignment where the stack sets it. Then delete line 686:

```css
/* family-people.css:681 */
.tp[data-stack] :is(.tp-label, .tp-tier.home .tp-label, .tp-tier.rings .tp-label) { display: flex; flex-wrap: wrap; align-items: center; column-gap: 12px; padding: 0; margin-bottom: 14px; }
```

I injected this live at 1100: dot −0.3, label 20.7, the ask's words 1.5px from "1910s" (the band reads 1.4), and the hit area 2.4px clear of the row.

## Skill by skill

- **taste-skill:** applied, with R16-1 open.
  - The founder's way in (Home → Family) now draws once, complete, at every width. The first impression is a settled tree.
  - No headline runs past two lines, and no face lies on another.
- **hallmark:** applied.
  - Loading and states: a cached visit shows the real count ("29 days left") from its first frame. A failed refetch keeps the last real count, and a cold visit still shows its "Looking for…" line.
  - Gate 34: no horizontal scroll from 320 to 2560.
  - Gate 49: no new control wraps.
  - Touch targets: every label ask keeps a 44px hit area, at least 67.6px wide.
- **emil-design-eng:** applied.
  - Neither commit adds an animation or a transition.
  - On the highest-frequency path into Family, the layout jump is gone.
- **impeccable:** applied, with R16-1 open.
  - optimize, CLS: there's no refit on any measured path.
  - harden, date/time and network failure: the count is anchored to its fetch.
  - harden, race conditions: prime and hook fetches are gen-guarded against sign-out, and the prime never overwrites a list a mounted page already wrote (`last === null`).
  - harden, state consistency: R15-3 is closed.
  - Craft floor, States: focus is visible, and press and hover are kept.
- **GSAP (react, performance):** no gaps. `treeMotion.ts`, `scrollShell.ts` and `arrive.ts` aren't in either commit, and no face or label is left hidden in view at any sweep width.

## Notes, not counted

1. **At 320, the wrapped "+ Rose’s grandparents" hit area reaches 13px up over the bottom of "1910s Rose’s parents"** (x 50–208). There's no control there, so it collides with nothing. A tap on the lower half of the generation's name opens the add menu, which can't destroy anything. If the founder minds, `top: 0; height: max(44px, 100%)` plus a little `margin-top` on a wrapped ask would keep the area off the name. Don't do it at the cost of the dot fix.
2. **The `setCodes` wrapper isn't gen-guarded.** A take-back whose send lands after `clearCodesCache()` would write the old list into `last` through React's eager updater. That can only happen if another tab signs out within the ~0.3s of a send: `signOut()` lives only on `/account`, and leaving Family cancels held sends (`useHold.ts:71–74`). If wanted, capture `gen` in the hook and skip `last = value` when it has changed.
3. **The prime never refreshes a list already cached** (`last === null` guard). A tab back from 60s+ hidden reloads the family but not the codes. The next Family visit draws the older list, and its own fetch corrects it. An `afterWrite` or a `sendCode` with email also fires one extra discarded `family_codes` request through `reload()`. Neither is visible.
4. **Lost nav clicks in my tab.** Twice at 800, the Family pill click right after Home → Family → Home didn't navigate; the second click did. It happened while Home's arrival was mid-way (the screenshot showed only the bar) in a hidden pane that composites no frames. Neither commit touches navigation, and the view-transition and Shell arrival code was being edited by another agent at the time (now 925d874). Worth one check with the pane visible.
5. **`.tp-ask` keeps square focus-ring corners and the ring hugs the 18px visual box, not the 44px hit area.** That's standard and unchanged from before 65c4e2b. Noted only because the hit area is now invisible.
6. **The 2560 snug threads are ruled open for the founder.**
