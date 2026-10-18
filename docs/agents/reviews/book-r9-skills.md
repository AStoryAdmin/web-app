# Skills Steward: Book, Plans, Account, Talk, Start and Wall, round 9

**Verdict: GAPS (0 blockers, 1 ugly, 2 polish).** N22 to N26 are fixed, and so are Bao's four round-8 findings. N22 is proven in node against app-core's own `printedBody`, and the new test fails on the round-8 code. The six pages in scope are clean.

This is not quite the passing round. The new skeleton frames stop the second rise on Home, Archive, Person and the memory page, but they bring in three gaps:
- **N27 (ugly):** three of those frames are shorter than the hero they stand in for, so the sheet drops when the page arrives. Archive drops 108px on a laptop and 196px on a phone, Home 74px on a phone, and Person 33px.
- **N28 (polish):** Shell's new bare-page key also keys `.hero-in`. On the memory page React now writes the chapter into the split title, and the splitter puts "Memory" back afterwards. The hero is `display: none` on a bare page, so nobody sees it.
- **N29 (polish, not seen):** both arrival effects run one or two tasks after React commits. In that gap the browser may paint the arrived words at full strength for a frame before they hide and rise.

Write still rises twice, as you said. It is noted below and not counted.

## How this was checked

- **Skills read:**
  - taste-skill: SKILL.md (house rules, laws) and critique.md.
  - hallmark: slop-test (all gates), responsive.md, interaction-and-states (the eight states), and the anti-patterns entry on spinners and skeletons.
  - emil-design-eng: the animation decision framework, performance, accessibility.
  - impeccable: craft-floor and polish.
  - GSAP: gsap-react (cleanup, context, effects), gsap-performance and gsap-timeline (position parameter). No ScrollTrigger is in scope.
  - Also BAOS-STANDARD.md (rules 1, 11, 12, 23, 23a, 25, 42 and the checklist) and DESIGN.md (Rules 2, Motion). find-skills: nothing further applies.
- **Code read:**
  - The whole of `d13b205` under `src/`: Shell.tsx, arrive.ts, printBook.ts and its new test, bookPages.ts, Book.tsx, Home.tsx, Archive.tsx, Person.tsx, Start.tsx, Write.tsx and book-account.css.
  - app-core's `printedBody` and `bodyHash` (bookDesign.js 266–280) and their `normaliseDesign` retold pass (153–160).
  - The arrived heroes of Home, Archive, Person and MemoryPage, and the Shell's hero render (360–370).
- **Node (N22):**
  - I imported `printBook.ts`, `typography.ts` and app-core with Node 24's type stripping, through a resolve hook that stubs `lib/photoUrls`.
  - I built a third-person story with two memories:
    - one with an apostrophe;
    - one with a ` -- ` dash, a line that starts `-- `, an ellipsis and quotes.
  - Then I ran `typeset`, `printedBody` and `buildLegacyHtml`.
  - I also ran round 8's `typeset` (the whole body smartened, retold untouched) against the same story, to see whether the new test can fail.
- **Vitest:** `src/components/book/printBook.test.ts` passes (3 of 3).
- **My own pane tab** (`tab-168`, now closed, viewport reset). The pane was hidden for the whole run.
  - Each page was cold-loaded in a same-origin iframe at the test size, at 0.01 opacity, from `/book/closed-640.webp`.
  - The frame was polled every 4ms. Its GSAP ticker was stepped every 16ms with `lagSmoothing(0)`.
  - **Recorded:**
    - the sheet's top (offset chain), opacity and transform, and the hero's height, just before arrival and at arrival;
    - for the hero `h1`: its text, its split lines and tweens, and `data-risen`;
    - the foil's tweens;
    - every hero and sheet `[data-rise]` with its opacity and tween start;
    - 2.6s after arrival: anything in view under 0.9 opacity, and active tweens.
  - A MutationObserver caught React's commit. A MessageChannel loop then counted the tasks until the start states were applied (N29).
  - **Sizes:**
    - Home: 1366, 390, 1920 and 2560 (zoom 1.3). Archive: 1366, 390, 1920 and 2560.
    - Person: 1366 and 390. Memory page: 1366 and 390, five loads.
    - Book: 375×667, 390×844, 320×568, 360×640, 414×896, 800×1024 and 1366×768.
    - Talk: 800, 900, 1000, 1100, 1366 and 390.
    - Account: 1366 and 390. Family: 1366 and 390. Write: 1366 and 390.
    - Start: `?another=1&join=1` at 1366 and 390, and `?another=1` at 1366.
  - **Plans:** one load, resized through 901, 950, 1000, 1050, 1080, 1090, 1100, 1101, 1180, 1280, 1300, 1340, 1341–1365 (every 3px), 1366, 900, 800 and 390.
- **Headless Edge** (Playwright from web-app, `channel: msedge`, fresh signed-out contexts): the wall's foot mark at 390, 375, 760, 761, 1366 and 2560. I looked at a screenshot of the phone foot.
- **Nothing written:**
  - I pressed no control, saved nothing, switched no story, printed nothing and did not sign out.
  - `astory-app-auth` was never read or touched.
  - Loading /talk and /plans again queued more `talk_wall_shown` and `plans_viewed` events.

## Round-8 skills gaps, checked

| # | Round 8 | Now |
|---|---|---|
| N22 | Print at home dropped the retelling whenever a memory had an apostrophe | **Fixed, proven in node.** `typeset` keeps each body paragraph by paragraph, and re-keys a retelling only while it matches the raw body. <br>• `printedBody(typeset)` gives "She said they didn’t have much, but they had each other.": the retelling, curled. <br>• `retold.m1.h === bodyHash(typeset body)` holds for both memories. <br>• The printed HTML has the retold words curled, no "We didn’t have much" and no straight `didn't`. The subtitle and title are curled too. <br>• Print and screen agree. `paras(printedBody(raw))` equals `printedBody(typeset)` for both memories, so the dash line stays its own paragraph. <br>• A stale retelling stays stale and prints the person's words. A first-person book prints the person's words. |
| N22 test | — | **Covers it.** Run on round 8's typeset: <br>• test 1's two assertions fail (`false`, `false`); <br>• test 3 fails (the dash joins the two lines). <br>Test 2 covers the stale hash. |
| N23 | The book shrank to 229px on a short phone, its row under the tab bar | **Fixed.** `--bk-chrome` now counts the tab bar (507 at 375×667, 508 elsewhere, the stylesheet's 508 for the skeleton). The 300px floor holds. <br>• 375×667 and 360×640: the page is 300×300. <br>• 320×568: 260.7 (width-bound). <br>• 390×844: 330.7. 414×896: 354.7. <br>• At 375×667, "Read this page" and "Open the book" (627–725) start under the tab bar (598). The page scrolls 2263px, so they come up above it. This is the trade-off round 8 asked for. <br>• The skeleton's block equals the arrived page at every size: 300, 330.7, 602 and 883×441.5. |
| N24 | The inside path left the sheet blank for 0.55s | **Fixed.** The sheet's `[data-rise]` items start at 0.08 on Talk, Account, Family, Person, Home and the memory page. On Talk at 1366 both blocks are tweening from 0.08 at arrival. |
| N25 | Talk's tablet skeleton was the wrong shape | **Fixed.** The outline → the arrived card, from the sheet's top: <br>• 800: 526, 733.5×261 → 521.6, 735.7×259.3. <br>• 900: 526 → 521.2. <br>• 1000: 526 → 520.8. <br>• 1100: 495 → 489.4. <br>The words column is 405 → 403.8 (374 → 372.8 at 1100). The 4–6px is mostly the card's `rotate(-0.5deg)` bounding box (6.4px taller). The heart (628–684) is inside the card. |
| N26 | Home and Archive raised the sheet twice | **Fixed for the rise.** The sheet carries on through arrival on every page in scope: <br>• Home 1366: 0.979 → 0.996. Home 390: 0.961 → 0.991. <br>• Archive 1366: 0.718 → 0.836. Archive 390: 0.55 → 0.78. <br>• Person 1366: 0.679 → 0.852. <br>• Memory page: 0.991 → 0.997. <br>The title isn't split twice: Home and Archive keep the same `h1` with `data-risen`, and Person's `h1` is new and is split once. Home's foil keeps its one stamp (p 0.44 → 0.84, no second tween). **But the frames don't hold the hero's height: see N27.** |

## Bao's round-8 findings, checked

| # | Finding | Now |
|---|---|---|
| 1 | Plans cut "Individu / al" and "Month / ly" | **Fixed.** Every plan name is one line at all 30 widths. No mid-word break, and no horizontal scroll. From 1341 the price returns to the name's line. "Monthly" then sits 6.1px from its price at 1341, 7.6 at 1350 and 10.3 at 1365 (see Notes). |
| 2 | Talk's tablet skeleton in the wrong place | **Fixed** (as N25 above). |
| 3 | `/start?another=1&join=1` loaded over step 1's skeleton | **Fixed.** Skeleton → settled, at 1366: <br>• sheet 1240×381 at 219 → the same; <br>• h1 365 → 365; recap 429 → 429; <br>• field 287 → 287; button 353 → 353. <br>At 390 the sheet is 374×562 at 163, and every part lands at the same place. The heart is over the field. "Opening the book…" is readable, and the field takes focus on arrival. `?another=1` holds too: 627 → 623. |
| 4 | Talk's card stopped short of its column at 901–1100 | **Fixed.** The card is as wide as the steps and Where to next: 735.7 against 733.5 at 800, 829.3 against 827.1 at 900, 922.8 against 920.7 at 1000, and 1016.4 against 1014.3 at 1100. |

## Gaps

### N27. UGLY: the new skeleton frames on Archive, Home and Person are shorter than the hero, so the sheet drops on arrival
**Skill:** hallmark anti-patterns and interaction-and-states (a skeleton keeps the page's shape); BAOS 23a ("Nothing jumps or flashes") and 42; impeccable polish §5 (layout shift); the ±2px aim of N11 and N20. Rule 1: the Book, Talk, Account and Start frames all hold, and these three should too.

**Where and why:**
- **Archive** (`pages/Archive.tsx:243–262`). The frame holds the label, the title and the wall line. It leaves out the `dl.hero-stats.arc-stats-hero` row that the arrived hero carries (Archive.tsx:332): Memories, the years, Chapters and the book bar.
- **Home** (`pages/Home.tsx:38–71`), on a phone only.
  - The frame's `.acts` holds two buttons. The arrived one holds three ("Ask me another", Home.tsx:140), which wrap to a third row.
  - The frame's label is one `&nbsp;` line. The arrived label (the date · "Your story" and the teller pick) sets in two.
- **Person** (`pages/Person.tsx:116–128`). The frame holds one title line. The arrived hero adds the `p.phero-sub` line (Person.tsx:308).

**Measured:** sheet top and hero height, skeleton → arrived, CSS px.

| Page | Width | Hero | Sheet top | Drop |
|---|---|---|---|---|
| Archive | 1366 | 144 → 252 | 248 → 356 | **108** |
| Archive | 1920 | 144 → 252 | 248 → 356 | **108** |
| Archive | 2560 (zoom 1.3) | 187 → 328 screen px | 248 → 356 | **108** (141 on screen) |
| Archive | 390 | 99 → 295 | 179 → 375 | **196** |
| Home | 390 | 411 → 485 (acts 106 → 160, greet 132 → 152) | 491 → 565 | **74** |
| Person | 1366 | 92 → 125 | 196 → 229 | **33** |
| Person | 390 | 51 → 85 | 131 → 165 | **34** |
| Home | 1366, 1920, 2560 | 224, 232, 301: unchanged | unchanged | 0 |

The sheet is still rising when this happens (opacity 0.5–0.98), so the drop shows as a lurch in the middle of the arrival. Round 8's dip is gone, but the page still jumps.

**Change:**

| Before | After | Why |
|---|---|---|
| Archive's frame: label, h1, wall line | Add the stats row as it will be: `<dl className="hero-stats arc-stats-hero hold-words">` with the same four cells (`<div><b>&nbsp;</b><span>&nbsp;</span></div>` × 3, and the `arc-hs-book` cell with its bar) | The arrived hero's height on every width, so the sheet doesn't move |
| Home's frame: two `span.btn` in `.acts`, a one-`&nbsp;` label | Hold the third act (`<span className="btn quiet small">Ask me another</span>`), and hold the label's real words (`{longDate()} · Your story`, which needs no account) under `hold-words` | On a phone the label and the acts wrap as they will. 1366 to 2560 already match |
| Person's frame: one `p.phero-title` | Add `<p className="phero-sub hold-words">&nbsp;</p>` | The subline's line is held (only a person with no facts arrives without one) |
| (check) | Re-measure the sheet's top before and after at 1366, 390 and 2560 | ±2px, as on the Book and Talk |

### N28. POLISH: the bare-page key lets React write into the split title, and the splitter puts the old title back
**Skill:** gsap-react (targets React owns are changed only by React; cleanup must not restore stale DOM); impeccable polish §5 (code: no hidden stale state). This is the hazard Shell.tsx's own comment at line 366 warns about.

**Where:** `components/Shell.tsx:295` and `:367`.
- `ready` drops the title for a bare page, which is right for the arrival key.
- The same `ready` also keys `<div className="hero-in" key={ready}>`. That key was there "so a changed hero is a fresh node, never React writing into split lines".
- On the memory page, the skeleton's title is "Memory" and the arrived title is the chapter ("Archive" when it has none). The first arrival splits "Memory". React then sets the h1's text while it is split, and `split.revert()` restores "Memory" when the tween ends.

**Measured** (memory page, three cold loads at 1366 and 390 in which the account arrived while the title was split):
- skeleton: `Memory`, 1 line, 1 tween;
- at arrival: `Archive`, 0 lines;
- at 2.6s: `<h1 class="hero-title" data-risen="1">Memory</h1>`.

In two loads where the account came after the split had reverted, it ends correctly as `Archive`. The hero is `display: none` on a bare page (astory.css:3525), so nothing shows and nothing is read. The running head and folio say "Archive".

**Change:**

| Before | After | Why |
|---|---|---|
| `<div className="hero-in" key={ready}>` | `<div className="hero-in" key={bare ? `${ready}:${title ?? ""}` : ready}>` (the arrival key stays `ready`) | A changed title is a fresh node again, and the arrival still runs once |
| (or) | Render no title `h1` in a bare hero at all: `hero ?? (title && !bare ? <h1 …> : null)` | It is never shown or read |

### N29. POLISH (not seen): the arrival runs a task or two after React commits, so the browser can paint the arrived words before they hide
**Skill:**
- gsap-react: prefer `useGSAP`, which runs in a layout effect so the start state is set before the first paint.
- React's own guidance on `useEffect`: it lets the browser paint before it runs, and for a visual change that flickers, use `useLayoutEffect`.
- emil-design-eng (preventing jarring changes); BAOS 23a.

**Where:** `components/Shell.tsx:296` (the arrival) and `:315` (the inside path) are both `useEffect`.

**Measured:**
- On /talk at 1366, the sheet got its start opacity 18.3ms and 2 tasks after it was inserted (the cold mount). The rising blocks got theirs 6.1ms and 2 tasks after the skeleton was swapped (the inside path).
- In the probes, when the commit's task ended:
  - on Book, Talk, Person, the memory page and Family, 0 of the rising items had their start state;
  - on Home and Archive, all of them had it in the same task (15/15, 3/3).
- So the timing varies. When it falls after a task, the browser may paint first, and an arrived `h1` or block shows at full strength for a frame, then drops to 0 and rises.
- The pane draws no frames, so **I could not see whether Edge paints in that gap.** Treat this as a risk, not a sighting.

**Change:**

| Before | After | Why |
|---|---|---|
| `useEffect(() => { … arrive(el) … }, [location.pathname, ready])` and `useEffect(() => { … return arrive(el, { inside: true }) }, [busy, ready])` | The same bodies in `useLayoutEffect` (scrollShell and atmosphere can stay in a `useEffect`) | The start states are set before the first paint, as `useGSAP` does. A view-transition navigation already flushes its effects in the same commit (a sync update), so it doesn't change |
| (check) | One look at a real Edge window: cold-load /person and /book at 1366 with the cache warm | Confirms the flicker is gone, or was never there |

## Spot-checks you asked for

- **Family** (inside path, key `b`): at 1366 and 390 the sheet carries on (0.753 → 0.847, 0.751 → 0.845). Its block rises from 0.08. Nothing is faded and no tween is active at 2.6s.
- **Write:** still rises twice. At 1366 the sheet goes 0.967 → 0 at arrival, and at 390 it goes 0.966 → 1 → 0 by 60ms. Nothing is left faded and no tween is active at 2.6s at either size. Not counted here, as you said.
- **Arrive's inside path:**
  - The title guard holds on Home, Archive, Book and Talk: one split per title.
  - The foil guard holds on Home: the foil keeps its first stamp and gets no second tween.
  - Hero `[data-rise]` items rise once from 0.25, and sheet items from 0.08.
  - The headband is untouched.
  - After arrival every `hold-words` and `aria-hidden` wrapper in the hero is gone (Home, Archive, Person), so the arrived words are visible and read.
- **GSAP cleanup:**
  - The inside run is reverted by `mm.revert()` when `busy` or `ready` changes and on unmount.
  - A revert leaves `data-risen` set but clears the tweens, so nothing is left hidden.
  - The guard applies only to the inside path, so a full re-run (StrictMode, a key change) still splits and stamps.

## Notes (not gaps)

- **Plans at 1341–1360:** "Monthly" sits 6–8px from its price on the shared line, inside the 8px column gap. It doesn't touch, but it is tight. Ending the stacked band at about 1380 would give it room. Bao's call.
- **The wall's phone foot:** the mark now sits at `bottom: 10px` with no hits at 390, 375 and 760. But the wall's sheet keeps `padding-bottom: 80px` on a phone, which is room for a tab bar the wall doesn't have. So about 100px of bare paper sits between the last rule and the mark (desktop: 22px). Setting the wall sheet's phone padding to the desktop's would close it.
- **Talk's phone skeleton:** the first words line is still 8px off (351 → 342.9), as round 8 noted.
- **`overflow-wrap: normal` on `.pl-head h2`** sets aside hallmark gate 51 for plan names. That is fine, because the names are fixed and fit at every width measured.
- **A dash at the start of a line** (`-- second line`) stays a straight double hyphen on screen and in print. smarten's rule needs a space before it. Screen and print agree, so this is a typography edge, not a fault of this round.
- **Bao's earlier Home `.omark` note stands:** it is a CSS keyframe the frameless pane never runs.

## Skill by skill

- **taste-skill:**
  - Gap: N27 (critique pass 13: the sheet moves under the reader during arrival).
  - Passes:
    - No headline over two lines on the six pages.
    - Plan names are whole at every width.
    - The book stays a readable size on a short phone.
- **hallmark:**
  - Gap: N27 (the skeleton isn't the page's shape).
  - Passes:
    - Gate 34: no horizontal scroll anywhere measured.
    - Gate 49: no two-line button.
    - Start's join frame is step 2's exact shape.
    - The held field and button are inside `visibility: hidden`, so they can't take focus.
    - The status line is read on every skeleton.
- **emil-design-eng:**
  - Gaps: N27 (a jarring change mid-arrival), N29 (a possible one-frame flash).
  - Passes:
    - No `transition: all`, no ease-in, and nothing new on a frequent action.
    - The inside rise is 0.6s on the house ease-out.
    - Transform and opacity only.
- **impeccable:**
  - Gaps: N27 (polish §5), N28 (stale hidden DOM).
  - Passes:
    - N22 was fixed at the narrowest level (re-key only a matching retelling, paragraph by paragraph), with a test that fails on the old code.
    - Bao's four round-8 findings are gone.
- **GSAP:**
  - Gaps: N28 (React writing into split lines), N29 (layout effect, as `useGSAP`).
  - Passes:
    - The 0.08 position parameter.
    - The foil and title guards.
    - `mm.revert()` cleanup.
    - Nothing is faded and no tween is active at 2.6s on any page measured.
- **Other:** find-skills: nothing further applies. The new comments and copy needed no humanizer changes.

## Housekeeping

- **I worked only in `tab-168`.**
  - One early `navigate` was sent to a tab id that didn't exist (`tab-170`). It failed and touched nothing.
  - I removed every iframe and my window helpers, reset the viewport to desktop, and closed the tab.
  - I wrote no sessionStorage or localStorage.
- **Node and Playwright scripts** are in my scratchpad (`r9/`): `n22.mjs`, `n22old.mjs`, `hooks.mjs`, `wall9.mjs` and `wallfoot.mjs`. The wall foot screenshots are there too, not in `docs/agents/reviews/shots/`, so none of Bao's shots were touched.
- **Playwright:** headless and signed out, in fresh contexts. It only loaded the public wall.
- **Not touched:** I did not sign out, did not read or touch `astory-app-auth`, and wrote no data.
