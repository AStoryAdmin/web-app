# Skills Steward: Book, Plans, Account, Talk, Start and Wall, round 10

**Verdict: GAPS (0 blockers, 1 ugly, 1 polish).** Every item you asked me to verify holds:
- N27, N28 and N29 are fixed.
- Bao's four round-9 findings are fixed.
- f8c73d3's view-transition fix holds.
- The Write hoist is sound.
- Every cloth matches its skeleton to 0px, at every size and with every account state I could load.

It is not the passing round yet. Two things are left:
- **N30 (ugly):** the loading heroes hold the founder's own state. A free-plan user, an archive that isn't shared, and a person with life dates (on a phone) each arrive in a taller or shorter hero, so the sheet still moves 21–46px. The founder is on a paid plan, his archive is shared, and his people have one subline part, so he never sees it.
- **N31 (polish):** Talk's skeleton outline is now tilted like the card, but it kept heights tuned for the untilted box. It stands 5–9px taller than the card it stands in for.

## How this was checked

- **Skills read:**
  - gsap-react: whole SKILL.md (useGSAP's layout effect, context cleanup, StrictMode).
  - gsap-performance and gsap-timeline. No ScrollTrigger is in scope.
  - impeccable: craft-floor, and polish (layout shift, runtime warnings).
  - hallmark: interaction-and-states (loading and skeletons), the anti-patterns on loaders, slop-test and responsive gates.
  - emil-design-eng: performance, interruptibility, preventing jarring changes.
  - taste-skill: critique passes 1–14.
  - Also BAOS-STANDARD rules 1, 23a, 25 and 42, and DESIGN.md's Motion. find-skills: nothing else applies.
- **Code read:**
  - 925d874 under `src/`: Shell.tsx, Home.tsx, Archive.tsx, Person.tsx, Write.tsx and book-account.css.
  - f8c73d3: Shell.tsx and arrive.ts.
  - `lib/arrive.ts` and `lib/pageTransition.ts` in full, `App.tsx` (`lazyPage`) and `main.tsx` (StrictMode).
  - The whole of `Writer` (Write.tsx 483–1265) for hook order, effects and focus.
  - Wall.tsx's arrival (329–332) and Start.tsx's rise (174–184).
- **Static:** `tsc --noEmit -p tsconfig.app.json` and eslint (with react-hooks) on Shell, Write, Home, Archive, Person and arrive are both clean.
- **My own pane tab** (`tab-182`, now closed, viewport reset). The pane was hidden for the whole run.
  - **Setup:** each page was cold-loaded into a same-origin iframe at the test size, at 0.01 opacity. The iframe's `console.error` and `console.warn` were patched before React's first render.
  - **Insertion check:** a MutationObserver on the frame's document recorded, in its callback (the microtask after the commit, before any paint can happen):
    - the opacity of every new `.sheet-page`;
    - every new hero `h1` (whether it was already split, and its first line's transform);
    - every `[data-rise]`, whether it was inserted or had the attribute added to a kept node;
    - Write's `.w-book`.
  - **Frame check:** a 4ms poll stepped the frame's GSAP ticker (lagSmoothing 0). It recorded the cloth's height and the sheet's offset top while a skeleton was up and after arrival, counted dips, and then listed active tweens and faded items.
  - **Sizes:**
    - Home: 1366, 390 and 1920. Archive: 1366, 1920, 800, 390 and 2560×1300 (zoom 1.3).
    - Person (two people): 1366, 390, 1920 and 2560. Two more people at 390. Memory page: 1366 and 390.
    - Family: 1366. Write: 1366, 390 and 1920. Talk: 1366, 1001 and 390.
    - Book: 1366, 390 and 375×667. Account: 1366 and 390. Plans: 1366 and 390.
  - **Talk skeleton against the card:** 800, 1001, 1015, 1030, 1031, 1100, 1366 and 390, plus the arrived card's own box at seven widths.
  - **The join link:** skeleton against arrived, eight boxes at 1366, 390 and 2560. A frozen, script-free copy of the 1366 skeleton was screenshotted at 2.2×.
  - **In-app navigation (view transitions):** Home → Archive (first visit, lazy chunk), Family → Ty, Ty → Family, Archive → Home, Home → Talk, and Home → /write. All ran after force-loading f8c73d3.
  - **Variants of the arrived heroes:** in arrived frames I swapped in the private wall line, the free plan's note line, a longer question, a longer teller pick, and two- and three-part person sublines, then measured the cloth. These changes were in my own iframe's DOM only.
- **Headless Edge** (Playwright, fresh signed-out contexts):
  - The wall at 390, 375, 760, 761, 1366 and 2560.
  - A MutationObserver init script on the wall: 4 cold loads at 1366 and 390.

## Round-9 skills gaps, checked

| # | Round 9 | Now |
|---|---|---|
| N27 | Archive, Home (phone) and Person frames were shorter than the hero, so the sheet dropped 33–196px | **Fixed for the founder's state.** Cloth skeleton → arrived, with the drop of the sheet's top: <br>• Archive: 384.1 → 384.1 at 1366, 1920 and 800; 499.3 → 499.3 at 2560 (zoom 1.3); 402.8 → 402.8 at 390. Drop 0 everywhere. <br>• Home: 355.7 → 355.7 at 1366; 593.1 → 593.1 at 390. Drop 0. <br>• Person: 256.9 → 256.9 at 1366; 192.6 → 192.6 at 390; 257.6 at 1920; 334.8 at 2560. Drop 0. The same for three more people. <br>• Memory page: 104 → 104 and 96 → 96. <br>No dips anywhere. **Other states still move: see N30.** |
| N28 | The bare-page key let React write into the split title, and the splitter restored "Memory" | **Fixed.** On the memory page the "Memory" `h1` is replaced by a fresh "Archive" node (key `b:Archive`). At 2.6s it ends as `<h1 class="hero-title" data-risen="1">Archive</h1>` at 1366 and 390. The arrival key stays `b`, so the sheet rises once (0 dips). |
| N29 | The arrival ran a task or two after the commit | **Fixed, proven at insertion.** In the MutationObserver callback after the commit task, on every cold load of every page: <br>• the sheet was at opacity 0 (y 56); <br>• every hero `h1` was already split, its lines at `translate(0, 110%)`; <br>• every `[data-rise]` was at 0. That covers Home (13), Talk (2), the Book (3, attribute-added), Archive (3, attribute-added), Person (`phero-sub`), Plans (3) and Account. <br>Nothing arrived at full strength in any load. No React warning was logged on any load. The only console lines were the auth client's "couldn't reach Auth, keeping the session" warnings, which came from my removing frames mid-fetch. |

## Bao's round-9 findings, checked

| # | Finding | Now |
|---|---|---|
| 1 | Archive, Person and Home (phone) heroes shorter than the arrived ones | **Fixed for these states** (as N27 above). |
| 2 | Talk's card landed 26px below its outline at 1001–1030 | **Fixed.** Outline → card top: 522 → 520.8 at 1001, 521.9 → 520.7 at 1015, 521.9 → 520.7 at 1030, 490.9 → 489.7 at 1031, and 490.6 → 489.4 at 1100. The words column is 405 → 403.8 up to 1030 and 374 → 372.8 from 1031. **But the outline is now taller than the card: see N31.** |
| 3 | The arrival ran in `useEffect` | **Fixed** (as N29 above). |
| 4 | The join link's skeleton was a blank sheet with a heart | **Fixed.** Hairlines are drawn: <br>• a short rule under the back link; <br>• one rule under the step line and one under the title; <br>• a rule under each line of the recap's body; <br>• the code field's underline; <br>• the button's outline. <br>The heart sits over the field. Every box matches the arrived page to 0.1px at 1366, 390 and 2560 (sheet 1240×381 at 219.5; field 560.7×44 at 287; button 106.7×48 at 353). The held input is visible as a rule, but it has `tabIndex -1` and `pointer-events: none` inside an `aria-hidden` wrapper, so it can't be reached. The button is `disabled`. On arrival the real field takes focus. |

## The other changes, checked

- **Layout effects and StrictMode:**
  - Both arrivals now run in `useLayoutEffect` (Shell.tsx 302–308 and 323–333). The scroll and the atmosphere stay in a passive effect, which is right because they only listen.
  - There is no SSR, so no layout-effect warning. Eslint's hooks rules pass.
  - StrictMode's mount re-run: the arrival is reverted (`mm.revert()`) and re-created from stated values, so the end state is the same. The inside path's refs stop it re-running on the mount pass, and a busy flip is an update, which StrictMode doesn't double.
- **GSAP cleanup on both effects:**
  - Each returns `arrive()`'s `() => mm.revert()`. That kills the timeline and reverts the SplitText, the inline from-states and the `onEnter` observers.
  - At 2.6s after arrival: 0 active tweens on every page measured.
  - Nothing in view is faded except designed states: the ribbon's disabled step at 0.6, the week dots at 0.55, a 0.35 rim, and lazy prints not yet loaded in a 0.01-opacity frame.
- **f8c73d3 (the view-transition flag):**
  - `via` is a ref keyed by `pathname|ready`, so the flag is read once per arrival. StrictMode's dev re-run reuses it instead of reading a spent flag.
  - `inside` still short-circuits before the flag. The Wall's own `arrive(root)` keeps the old fallback.
  - **Measured after force-reload:** the sheet never went to `y 56` / opacity 0 after the click on any of these routes:
    - Home → Archive, first visit (the lazy chunk): it did go to `y 56` before this commit;
    - Family → Ty and Ty → Family;
    - Archive → Home and Home → Talk.
  - Production behaviour is unchanged: no double invoke, and one read.
- **The Write hoist** (by reading the code, and in the frame):
  - **Writer behaviour is unchanged.**
    - Every Writer hook is still above `if (kept)` (no early return before line 923).
    - The two frames pass the same Shell props as before: `bare wide`, or `back="/" wide` with the same `whero`.
    - The kept hero uses `keptNumber ?? number`, as `n` did.
  - **Focus:** the body textarea takes focus on a cold load (1366, 390, 1920) and on an in-app move to /write. In every case `activeElement` is `TEXTAREA.wbody`.
  - **The WriteFrame context:** its value is the `useState` setter, whose identity never changes, so consumers never re-render through the context. `setFrame` with an unchanged value bails out. A kept change costs one extra Write render, and there is no loop: the effect's deps (`setFrame`, `keptAs`) don't change on that render.
  - **No state is lost across kept/unkept:**
    - Write's tree is `<Shell><WriteFrame.Provider><Writer key=…/></WriteFrame.Provider></Shell>` in both frames.
    - Shell renders `{children}` in the same slot of `<main>` whatever `hero`, `bare` and `back` are. The running head slot before it is `false` on /write both times, and `.shell`'s key is the pathname.
    - So Writer is reconciled, not remounted, and `kept`, `keptNumber` and the draft survive.
    - Writer's own root stays a `div.page.desk.w-desk`; only its class and inner subtree change, as before.
  - **The keep commit:**
    - It first renders Afterwards in the bare frame. Writer's layout effect then sets the frame, and React re-renders synchronously before paint, so the bare frame is never painted around the kept page.
    - The key goes `b` → `h`, and the kept page arrives once, as it did when Writer owned the Shell.
    - Unmount cleanup (`setFrame(null)`) resets the frame for a re-keyed Writer.
  - **Rises once:** 0 dips at 1366, 390 and 1920 (round 9 had a dip at both sizes). The cloth is 104 → 104 and 96 → 96.
  - Writer's own book timeline still runs in a `useEffect`. At insertion, the book was at opacity 0 in all four loads (three cold, one in-app). See Notes.
- **The wall:**
  - In 4 of 4 cold loads, its sheet was at opacity 0 (y 56) and its name already split in the insertion callback, although its arrival is still a `useEffect`. See Notes.
  - The foot mark has no hits at any of the six widths, and there is no horizontal scroll.

## Gaps

### N30. UGLY: the loading heroes hold the founder's state, so a free user, an unshared archive and a dated person still move the sheet on arrival
**Skill:** the same rules as N27: hallmark interaction-and-states (a skeleton is the page's shape), impeccable polish (layout shift), BAOS 23a and 42, and N27's ±2px.

**Measured:** in an arrived frame I put in the other state's real markup and measured the cloth.

| Page | State | Width | Cloth, held → arrived | Sheet moves |
|---|---|---|---|---|
| Home | Free plan (the note "N of today's three waiting." shows for every free user) | 1366 / 390 / 1920 | 356 → 387 / 593 → 624 / 364 → 395 | **31 down** at every width |
| Archive | The wall isn't shared ("Only the family can read this. Share it by link") | 390 / 320 / 1366 | 403 → 361 / 403 → 382 / 384 → 384 | **42 up** / 21 up / 0 |
| Person | Relation and life dates (two subline parts; on a phone each part is its own line, `family-people.css:584`) | 390 / 1366 | 193 → 216 / 257 → 257 | **23 down** / 0 |
| Person | The sample family (three parts: "A sample family", relation, dates) | 390 | 193 → 239 | **46 down** |

**Where:**
- `pages/Home.tsx:65–79`: the held `.ask` has no `p.meta.note`. The arrived one adds it at 158–162 when `!unlimited`.
- `pages/Archive.tsx:259–262`: it holds the shared wall's line. A phone sets that line in two rows (86px); the private line fits in one (44px). The comment there names the trade-off.
- `pages/Person.tsx:122–127`: it holds one subline row. The arrived subline has 1–3 parts (Person.tsx:190, 309–316).

**Change:**

| Before | After | Why |
|---|---|---|
| Home's held `.ask` ends at `.acts` | Add `{!isPaid(user?.plan ?? "free") && <p className="meta note">3 of today’s three waiting.</p>}` inside the held `.ask` | The plan is known from auth before the account, as the greeting already is |
| Archive holds the shared line | Hold the variant this viewer last saw: write `story.isPublic` to localStorage on arrival (try/catch, a per-viewer convenience), and read it in the skeleton. A first visit holds the private line, which is how a story starts | The phone's line count then matches. 1366 already matches both |
| Person holds one `phero-sub` row | When `preview`, hold three parts: `<p className="phero-sub hold-words"><span className="sub-part">A sample family</span><span className="sub-part">&nbsp;</span><span className="sub-part">&nbsp;</span></p>`. For a real person, hold two parts on a phone (relation and dates is the common case) | Each part is its own line on a phone. Only a phone is affected |
| (check) | Re-measure free and private states at 1366 and 390 (a free test account, or a story with sharing off) | ±2px |

### N31. POLISH: Talk's skeleton outline is tilted now, but its heights are still tuned for the untilted box, so it stands 5–9px taller than the card
**Skill:** hallmark (the skeleton is the page's shape); the ±2px aim of N11 and N20; impeccable polish §5.

**Where:** `styles/pages/book-account.css:903` (`min-height: 306px`) and `:920` (`min-height: 261px`, up to 1100px). Round 9 tuned these numbers against the card's bounding box, which already included the card's own half-degree tilt. 925d874 then gave the outline the same `rotate(-0.5deg)`, so the outline now adds the tilt a second time.

**Measured:**
- **The card's own height is 253px at every width from 800 to 1100.** On the 1366×768 load it is about 301px (a 305.9 box less the tilt's 5px).
- **Tablet:** the outline's box is 267.4 (800), 269 (1001) and 269.8 (1100), against the card's 259.3–261.7. The outline's bottom edge sits 9.3px below the card's at 800.
- **1366:** the outline's box is 311, against the card's 305.9. Its bottom sits 5.6px below.
- The tops land within 1.2px at every width.

**Change:**

| Before | After | Why |
|---|---|---|
| `.talk-skel .bka-sk-block { min-height: 306px; … }` | `min-height: 301px` | The card's untilted height. With the tilt, both boxes are then the same |
| `@media (max-width: 1100.98px) { .talk-skel .bka-sk-block { min-height: 261px; … } }` | `min-height: 253px` | The same, for 761–1100 |

## Notes (not gaps)

- **Two arrivals still run in `useEffect`, but measured clean:** Writer's book timeline (Write.tsx 745–766) and the Wall's arrival (Wall.tsx 329–332). In every load the from-state was already set in the insertion callback (Write 4 of 4, the wall 4 of 4), because React flushed those passive effects in the commit's own task. That depends on React's scheduling, not on the code. Moving both to `useLayoutEffect`, as the Shell and Start now do, would make it certain.
- **A cold load of `/write?edit=…&details=1`** (the "add details" link, refreshed) mounts Writer already kept. The frame then goes bare → kept in one commit, so the whole arrival runs again over the skeleton's rise. The same was true before the hoist. I didn't measure it, because it needs a kept memory open for editing. In-app navigation to it has no skeleton, so it rises once.
- **Home's question length** isn't knowable before the account. A three-line question would add about 70px at 1366 and 60px at 390 against the held two-line one. Most questions are one or two lines.
- **A lazy route's first visit** (Archive, the Book and others in `App.tsx`) shows `lazyPage`'s fallback during the view transition. The page then arrives after the transition with its sheet in place and no motion. This was so before both commits, and now it doesn't dip in development either.
- **Not reviewed:** b69768c and e092062 landed during this review. Account's invite name pairs are in scope, but that commit is someone else's change, made after 925d874.
- **Round-9 notes still stand:**
  - the wall's phone foot keeps about 100px of bare paper above the mark (101–102px measured);
  - Talk's phone words column is 8px off (351 → 342.9);
  - "Monthly" sits close to its price at 1341–1360.

## Skill by skill

- **taste-skill:**
  - Gap: N30 (critique pass 13: the sheet moves under the reader during arrival, for most real users).
  - Passes:
    - No headline over two lines.
    - Every hero holds its exact shape in the founder's state, at every width up to 2560.
    - The join link reads as a page, not a blank card.
- **hallmark:**
  - Gaps: N30 and N31 (the skeleton isn't the page's shape).
  - Passes:
    - The join skeleton now draws its page in hairlines.
    - Its held field can't be reached by keyboard or pointer.
    - The status line is readable on every skeleton.
    - No horizontal scroll (wall, every width).
    - No two-line button.
- **emil-design-eng:**
  - Gap: N30 (a jarring change mid-arrival).
  - Passes:
    - The flash risk is gone: from-states are in the commit.
    - The view-transition re-slide is gone.
    - Transform and opacity only, with the house ease-out.
    - Nothing new on a frequent action.
- **impeccable:**
  - Gaps: N30 and N31 (polish §5: layout shift).
  - Passes:
    - No runtime or React warnings.
    - tsc and eslint are clean.
    - N28's stale hidden DOM is gone.
- **GSAP:**
  - No gap.
  - Passes:
    - Both arrivals are layout effects with `mm.revert()` cleanup, as `useGSAP` does.
    - StrictMode re-runs are idempotent, and f8c73d3 makes the transition flag idempotent too.
    - No tween is left active.
    - SplitText never sees React write into its lines (N28).
  - The two passive arrivals in the Notes are the only place where the gsap-react rule (layout effect before paint) isn't yet followed in code.
- **Other:** find-skills: nothing further applies. The new comments read plainly; humanizer needs no change.

## Housekeeping

- **Pane:** I worked only in `tab-182`. Every iframe and the frozen copy were removed, and my window helpers were deleted. I reset the viewport to desktop and closed the tab.
- **Nothing written:**
  - I didn't sign out, read or touch `astory-app-auth`, write sessionStorage or localStorage, press Copy link, keep, save or send, or open a `?q=` question link (it counts a prompt).
  - Loading /talk and /plans queued their usual view events.
  - The variant measurements changed only my own iframe's DOM.
- **Playwright:** headless and signed out, in fresh contexts, on the public wall only.
- **Scripts:** in my scratchpad, `r10/p.js` (the insertion and frame harness) and `r10/wallpaint.mjs`. I reused `r9/wall9.mjs`. No screenshots were saved to `docs/agents/reviews/shots/`.
