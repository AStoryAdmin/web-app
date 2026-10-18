# Skills Steward: Book, Plans, Account, Talk, Start and Wall, round 8

**Verdict: GAPS (1 blocker, 2 ugly, 2 polish).** All seven round-7 skills gaps (N15 to N21) are fixed, and so are Bao's four round-7 findings. The arrived pages are clean at 1366, 1920, 2560 and 390.

This is not the passing round, because of what this round's changes brought in:
- **N22 (blocker):** the new `typeset()` in printBook.ts breaks the third-person book. Print at home now prints the person's own first-person words wherever a memory holds an apostrophe, a quote, `--` or `...`. Proven in node against app-core's own `printedBody`.
- **N23 (ugly):** `useBookChrome` measures the chrome without the phone's tab bar. On a 375×667 phone the book shrinks from 316px to 229px and its controls are still under the tab bar.
- **N24 (polish):** on the inside-only path, the page's content waits 0.55s on blank paper after the skeleton goes (Talk, Account, Family).
- **N25 (polish):** Talk's skeleton is still the wrong shape between 761 and 1100px. The heart lands over the words, not inside the card.
- **N26 (ugly, not from this round):** in the spot-check you asked for, Home and Archive raise the sheet twice on a cold load. It is the same fault this round fixed on the Book, so rule 1 applies.

## How this was checked

- **Skills read:**
  - taste-skill: SKILL.md (house rules, laws) and critique.md.
  - hallmark: responsive and slop-test headings; interaction-and-states (Loading); the anti-patterns entry on spinners and skeletons.
  - emil-design-eng: SKILL.md (decision framework, easing, durations, performance, accessibility).
  - impeccable: craft-floor and polish.
  - GSAP: gsap-react (cleanup, context, revert), gsap-performance and gsap-timeline. No ScrollTrigger is in scope.
  - Also BAOS-STANDARD.md and DESIGN.md (Rules 2 and the Motion section). find-skills: nothing further applies.
- **Code read:**
  - The whole diff of `e2754e1` under `src/`, and `ec7661a` (astory.css).
  - `lib/arrive.ts` in full; `Shell.tsx` 252–420; `Book.tsx` 1–160 and 225–260; `Talk.tsx`; Account's skeleton (796–833); Start's skeleton; Wall's `WallWait`; `LoadingMark.tsx`; `lib/typography.ts`.
  - `printBook.ts`, and app-core's `legacyBook.js` (`memoryHtml`, `bodyHtml`) and `bookDesign.js` (`printedBody`, `bodyHash`).
  - book-account.css §7, and the `--bk-chrome` rules (101, 130–131, 233–239).
  - For the spot-check: the busy placeholders and Shell props of Home, Archive, Family, Write, Person and MemoryPage.
- **My own pane tab** (`tab-144`, now closed, viewport reset). The pane was hidden for the whole run.
  - Another agent's saves reloaded app pages twice, so I ran the harness from a same-origin image URL (`/book/closed-640.webp`).
  - **Cold loads.** Each page loaded into a same-origin iframe at the test size, at 0.01 opacity, polled every 4ms, with the frame's GSAP ticker stepped every 16ms and `lagSmoothing(0)`.
  - **Recorded:**
    - the skeleton: the heart, its block, the folio and keys hint, and whether the status line sits under `aria-hidden` or `aria-busy`;
    - 25ms after arrival: the tween count and start time on the sheet, the headband, the hero `h1` lines, the hero `[data-rise]` and the sheet `[data-rise]`;
    - 60ms after arrival: the sheet's opacity and transform;
    - after 2.6s: anything in view under 0.9 opacity, active tweens, and the folio and hint.
  - **Sizes:**
    - Book: 1366×768, 1920×1000, 2560×1300 (zoom 1.3), 800×1024, 1000×1024, 390×844 and 375×667.
    - Talk: the same, plus 900, 1000 and 1100.
    - Account: 1366, 1920, 2560, 800 and 390.
    - Start (`?another=1`): 1366, 1920, 800 and 390.
    - Spot-check: Home, Archive, Family and Write at 1366, and Home and Family at 390.
  - **Foot sweep.** Book, Plans, Talk and Account at 1000×1024, 800×1024, 390×844 and 1366×768. It checks:
    - the `.sheet-page::after` box against text, controls and ruled boxes;
    - one-word last lines in Where to next;
    - Plans' grid rows;
    - horizontal scroll.
  - **Book at 375×667:** looked at in a screenshot.
- **Headless Edge** (Playwright 1.64.1 from web-app, `channel: msedge`, fresh signed-out contexts), on the wall:
  - **Leaf titles:** lines and size at 761, 780, 800, 820, 850, 880, 900, 1000, 1101, 1140, 1160, 1180, 1200, 1240, 1280, 1366 and 390.
  - **The wait state:** the function's answer held back 5s, at 1366, 1920, 800 and 390.
  - **The foot mark:** text ranges against the mark at 1000, 800, 390 and 1366.
- **Node:** app-core's `printedBody` with a raw and a typeset body (N22).
- **Nothing written:**
  - No Save, Change, Remove, Send, Order, Open it, Choose, story switch, printing or sign-out.
  - `astory-app-auth` was never read or touched.
  - I read the wall's slug from the Account page's link.
  - Loading /talk and /plans again queued more `talk_wall_shown` and `plans_viewed` events.
- **Not verified:**
  - **`useBookChrome`'s resize path, live.** The hidden pane draws no frames, so ResizeObserver and the window's resize event never fired after I resized the frame, and neither did zoom.ts's listener (zoom stayed 1 at 2560). Cold loads at every size measure correctly. I verified the resize path by reading the code, not by watching it.
  - Whether a `ResizeObserver loop` warning appears in a real window.
  - A screen reader.
  - Real frames on the signed-in pages.

## Round-7 skills gaps, checked

| # | Round 7 | Now |
|---|---|---|
| N15 | The heart landed below the fold or on a hairline | **Fixed.** Book, Talk and Account draw it inside their first block (`data-busy`, Shell draws no second one). Settled heart top vs block: <br>• Book 1366: 428 inside the spread, in a 768 window. 800: 554. 390: 460. 2560: 549 of 1000 CSS. <br>• Talk 1366: 358 inside the card (233–539). 390: 295 inside 200–445. <br>• Account 1366: 306 inside the bookplate (157–510). 2560: 315 inside 157–529. 800: 290 inside 157–479. <br>• Start: centred in the first specimen at 1366 (172/288 in 132/262 136×108), 1920, 800 and 390 (72×64 slot). <br>• Wall phone: the heart is 722–778 in an 844 window, inside the first outline. No rule crosses it at any of these sizes. |
| N16 | Start's status line hidden; the wall's under `aria-busy` | **Fixed.** On every skeleton measured, `[role=status]` has no `aria-hidden` or `aria-busy` ancestor, and Start and the wall carry no `aria-busy` at all. |
| N17 | Folio and keys hint under the skeleton | **Fixed.** Absent on every skeleton, present on every arrived page (Shell.tsx `runningHead && !busy`). |
| N18 | The Book's cloth words appeared without their rise | **Fixed on Book and Talk.** <br>• Book (skeleton title a `<p>`, page title a new `<h1>`): the h1 gets one split and one tween at 0.05, and `.label`, `.bkh-line` and `.bkh-edition` one tween each at 0.25. <br>• Talk (same `h1` node, `data-risen="1"`): no second split. Its two `[data-rise]` blocks rise once. <br>• The sheet keeps its single rise (one `y/opacity` tween plus its ScrollTrigger radius), and the headband is sewn once. <br>• Nothing stays faded and no tween is left active at 2.6s at any size. |
| N19 | Family notes, asked question and dedication raw; the PDF raw | **Fixed on screen** (bookPages.ts 201, 346–348, 359, 376). **In the PDF, the fix breaks third-person books: see N22.** |
| N20 | Talk's skeleton card 55px too tall on a phone | **Fixed.** Measured from the sheet's top: <br>• 390: block 66 and 245 tall → card 66 and 244.9 tall. <br>• 1366: block 78.5 and 306 tall → card 78.5 and 305.9 tall. <br>The 761–1100 band is still wrong: see N25. |
| N21 | Wall titles ran to three lines at 761–850 and near 1180 | **Fixed.** Headless, every leaf title is one or two lines at all 17 widths. It is 22px at 761–820 and 1101–1160, 24px at 850–900 and 1180–1240, and 28px elsewhere. |

## Round-7 Bao findings, checked

| # | Finding | Now |
|---|---|---|
| 1 | The pressed mark under Where to next | **Fixed** (ec7661a). It is 46×51 in the foot band at every width. No text range or control meets it on the wall at 1000, 800, 390 or 1366 (headless). On Book, Plans, Talk and Account the only box it touches is the folio's full-width line, whose text is centred well clear of it. |
| 2 | The book's buttons below the fold at 761–900 | **Fixed at the tablet sizes.** <br>• 800×1024: `--bk-chrome` measured 422, stage 602, the row ends at 1011 of 1024. <br>• 1000×1024: 316, row ends 763 + rail. <br>• 1366: 744/768. 1920: 987/1000. 2560: 987/1000 CSS. <br>The phone is a new fault: N23. |
| 3 | Where to next one-word last lines | **Fixed.** `text-wrap: balance` on `.wn-words span`. None on Book, Plans, Talk or Account at 1000, 800, 390 or 1366. |
| 4 | Plans' seven grid rows on a tablet | **Fixed.** At 800 the rows are 462, 440 and 168. At 390 there are five card rows. No empty row. |

## Gaps

### N22. BLOCKER: Print at home loses the third-person narration whenever a memory has an apostrophe
**Skill:** impeccable polish §3 (broken task and misleading state come first); impeccable polish §4 (factual copy); hallmark honest copy. The fix for N19 introduced this.

**Where:**
- `components/book/printBook.ts:75`: `typeset()` replaces each `memory.body` with `smarten(memory.body)` before `buildLegacyHtml` (line 81).
- app-core's `printedBody` (bookDesign.js:275–279) prints the retold, third-person words only while `retold[id].h === bodyHash(memory.body)`. That hash was taken over the raw body.
- Once the body is smartened, the hash no longer matches. The PDF falls back to the person's own first-person words, while the colophon still says "told as a story".

**Proven in node:**
- raw body: `She said they had little, but they had each other.`
- typeset body: `We didn’t have much, but we had each other.`

Any memory with `'`, `"`, `--` or `...` is affected, which is nearly all of them. The screen book is unaffected, because bookPages.ts smartens after `printedBody`.

A smaller difference sits in the same place. `typeset` smartens the whole body at once, and `bodyHtml` splits the paragraphs afterwards. The screen splits first, then smartens each paragraph. smarten's `\s*---\s*` and `\s+--\s+` rules can join across a line break, so a `---` line or a line starting `-- ` prints differently from the screen.

**Change:**

| Before | After | Why |
|---|---|---|
| `body: set(m.body)` before `buildLegacyHtml` | Leave `m.body` raw. Typeset the retold entries instead: for each `design.retold[id]` whose `h === bodyHash(raw body)`, set `{ h: bodyHash(typesetBody), body: paras(r.body) }`, and set the memory's `body` to `paras(m.body)`, where `paras = (t) => t.split("\n").map(smarten).join("\n")` | The hash and the body move together, so the retelling still prints. Paragraph by paragraph, as the screen sets it |
| (no check) | One unit test: a third-person design with a retold memory whose body has an apostrophe. `printableHtml` must contain the retold words, curled | This regression is silent: nothing on screen shows it |

### N23. UGLY: on a short phone, the book shrinks to a stamp and its controls are still under the tab bar
**Skill:** BAOS 11 ("the book scales up and down to fit") and 12 (the ratio holds); taste-skill critique pass 10 (Phone) and pass 13 (Collisions: nothing lying on a button); hallmark responsive non-negotiables; impeccable polish §5 (every supported viewport).

**Where:** `pages/Book.tsx:48–59`, `useBookChrome`.
- The hook counts everything above the stage and the row below it, plus 13px of paper.
- On a phone the fixed `.tabbar` (70px) covers the bottom of the window, and the hook doesn't count it.

**Measured** at 375×667 (screenshot seen):

| | Before this round (stylesheet 250px) | Now (measured 438px) |
|---|---|---|
| The page | 316px square (width-bound) | **229px square** |
| The row under it | ended below the fold; scroll to reach it | 556–654. "Open the book" and the page dashes are at 610–654, **under the tab bar at 597**. "Read this page" is cut by it |
| Skeleton → arrived | the same | the skeleton block is 316 square and the page arrives 229: an 87px jump |

At 390×844 the page is width-bound, so it is unaffected (330.7, the row ends at 756 above the tab bar at 775).

**Change:**

| Before | After | Why |
|---|---|---|
| `top + below + 13` | `top + below + 13 + tabbarHeight`, counted when `.tabbar` is displayed | The fit is honest about the paper you can actually see |
| The single page has no floor: `min(100%, 100vh/zoom − chrome, 640px)` (book-account.css:131) | Give it one: `max(min(100%, 300px), min(100%, calc(100vh / var(--zoom, 1) - var(--bk-chrome)), 640px))`, and the same in the skeleton rule (908) | On a short phone the book stays a readable size, and the row scrolls into view above the tab bar instead of shrinking the book to 159px |

### N24. POLISH: after the skeleton goes, the inside-only path leaves the sheet blank for 0.55s
**Skill:** emil-design-eng (purpose "Preventing jarring changes"; perceived performance: "the perception of speed matters as much as actual speed"); hallmark anti-patterns (skeleton to content without a gap); BAOS 23a ("Nothing jumps or flashes"); DESIGN.md Motion (arrival under 1.2s).

**Where:** `lib/arrive.ts:178`. The sheet's in-view `[data-rise]` items start at 0.55 on the timeline. That offset waits for the sheet's own rise (0.3 to 1.2), or for a view transition's settle. On the `inside` path neither is running. These are `fromTo` tweens, so they render their `opacity: 0` at once.

**Measured** 25ms after arrival:
- **Talk:** both blocks at opacity 0, starting at 0.55.
- **Account:** its one block at 0, starting at 0.55.
- **Family:** the same, now that its key matches.
- **The Book** has no sheet `[data-rise]`, so its stage shows at once.

On Talk and Account nothing else moves in that window, because the hero `h1` already rose. The skeleton and its heart vanish, then there is half a second of empty paper, then the content rises. Talk's last block lands at about 1.2s after the skeleton went.

**Change:**

| Before | After | Why |
|---|---|---|
| `tl.fromTo(now, …, 0.55)` on every path | `tl.fromTo(now, …, inside ? 0.08 : 0.55)` | Skeleton out, content rising in the same breath. The long offset belongs only where the sheet is still arriving |

### N25. POLISH: between 761 and 1100px, Talk's skeleton is the wrong shape, and the heart lands over the words
**Skill:** hallmark interaction-and-states ("Skeleton screens… predictable shape"); impeccable polish §5 (layout shift); the ±2px aim of N11 and N20; taste-skill critique pass 13.

**Where:** `styles/pages/book-account.css:904` stacks `.talk-skel` at ≤1100px. The six-line column is 248px tall, but the arrived words are 404px (373 at 1100). The block is full width and 306px tall, but the arrived card is 762px wide and 259.5px tall.

**Measured** (from the sheet's top, skeleton → arrived):

| Width | Words | Block → card | Heart (settled) |
|---|---|---|---|
| 800 | 81, 248 tall → 81, 404 | 366.5, 734×306 → **521.6**, 736×259 | 646, in the words' last lines, 30px above the card |
| 900 | 81, 248 → 81, 404 | 366.5, 827×306 → **521.5**, 762×260 | 646 |
| 1000 | 81, 248 → 81, 404 | 366.5, 921×306 → **521.5**, 762×260 | 646 |
| 1100 | 81, 248 → 81, 373 | 366.5, 1014×306 → **490.5**, 762×260 | 646 |

**Change:**

| Before | After | Why |
|---|---|---|
| In the ≤1100 block: `.talk-skel { grid-template-columns: minmax(0, 1fr); row-gap: var(--s-10) }` only | Add `.talk-skel > .bka-sk-col { min-height: 404px }` (373 above 1000 if you want it exact), and `.talk-skel .bka-sk-block { width: min(100%, 762px); min-height: 260px; margin-top: 0 }`. The ≤760 rule already resets this for the phone | The card's outline is where the card lands, so the heart draws inside it, as at 1366 and 390 |

### N26. UGLY (not from this round): Home and Archive raise the sheet twice on a cold load
**Skill:** BAOS 23a ("Nothing jumps or flashes") and rule 1 (apply a comment everywhere); emil-design-eng (jarring changes); DESIGN.md Rules 2 ("Each page arrives once"); gsap-react (revert is right, but here it reverts a nearly finished arrival).

**Where:**
- `Shell.tsx:293` keys the arrival on `ready`.
- Home's placeholder is `<Shell compact>` (Home.tsx:38), key `c`. The page is `<Shell hero={hero}>` (Home.tsx:134), key `h`.
- Archive's skeleton is `<Shell compact title="The Archive">` (Archive.tsx:243), key `cThe Archive`. The page is `<Shell hero={…}>` (282), key `h`.
- The changed key re-runs the whole arrival: `mm.revert()`, then the sheet is set back to `y: 56, opacity: 0` and rises again. This round fixed exactly this on the Book by matching the keys.

**Measured** (the sheet just before → 60ms after arrival):

| Page | Before arrival | After |
|---|---|---|
| Home 1366 | opacity 0.97, 1.9px | **0, translate 56px** |
| Home 390 | 0.98, 1.2px | **0, 56px** |
| Archive 1366 | 0.61, 22px | **0, 56px** |

The other two spot-checked pages are clean:
- **Family:** keys match. The sheet carried on, 0.56 → 0.86, and the page's one block rose once on the inside path.
- **Write:** the sheet was still at 0 when its page arrived, so there was nothing to see twice.

Nothing was left hidden on any of the four at 2.6s. The exception is Home's `.omark`, a CSS keyframe that a frameless pane never runs; it is not a GSAP fault.

**Change:**

| Before | After | Why |
|---|---|---|
| Home: `<Shell compact><div className="page" aria-busy="true" /></Shell>` | `<Shell hero={<div className="home-hero-hold" aria-hidden="true" />}>` holding the hero's height, with no h1 and no `data-rise`; the page's `data-busy` skeleton, or the empty placeholder | The key stays `h`, so the sheet rises once and the hero's words rise on the inside path, as on the Book |
| Archive: skeleton `compact title="The Archive"` | Pass the arrived frame: `hero` holding the label, title and wall line invisible at their size, as `.bkh-skel` does | The same |
| (Person, MemoryPage and Write have the same key change) | Check each the same way. Write measured clean only because of its timing | Rule 1 |

## Notes (not gaps)

- **GSAP cleanup on the new path is sound.**
  - Shell's second effect returns `arrive(el, { inside: true })`, whose cleanup is `mm.revert()`. It runs when `busy` or `ready` changes and on unmount.
  - If `ready` changes later, the first effect re-runs the whole arrival, and the second reverts its own run and returns early.
  - Under StrictMode the mount runs twice, but both see `busy` unchanged and return early.
  - `data-risen` only guards the `inside` path, so a full re-run still splits the title.
  - Only the hero `h1` is guarded. If a page ever keeps a hero `[data-rise]`, `.foil` or `.object` node across its skeleton, that node would rise twice. No page in scope does today: the Book's skeleton hero has no `data-rise`, and Talk and Account have no hero extras.
- **`useBookChrome` resize, read in code:**
  - It observes `.book-page`, `.bk-under` and `.hero`, and re-queries the stage on each measure.
  - `below` doesn't depend on the stage's height, so the value settles after one pass, with no loop.
  - It reads `offsetTop` (CSS px, transform-free), so the rising sheet and the 1.3 zoom don't skew it. Measured 316 at 2560 with the row ending at 987 of 1000 CSS px.
  - It relies on ResizeObserver alone. zoom.ts already keeps a timer for views that draw no frames. If that matters here, add a `resize` and `ZOOM_EVENT` listener with a 60ms timer.
- **Start at 800:** the arrived sheet sits 25px lower than the skeleton, because "My own story" is 50px shorter for the founder. It is the same known case as round 7's note.
- **The status line** says "Opening the book…" on Account too. That is the house metaphor, so it can stay.
- **The wall's horizontal scroll** reads −15 (scrollWidth under clientWidth) because of `scrollbar-gutter: stable`. There is no horizontal scroll.

## Skill by skill

- **taste-skill:**
  - Gaps: N23 (pass 10 and pass 13: the phone's controls under the tab bar), N25 (pass 13: the heart over the words).
  - Passes:
    - Every wall title is now two lines or fewer at every width I tried (N21).
    - No headline over two lines on the six pages.
    - The pressed mark lies on nothing.
- **hallmark:**
  - Gaps: N25 (skeleton shape), N24 (skeleton to content).
  - Passes:
    - Loading's label is readable on every skeleton, with no `aria-hidden` or `aria-busy` ancestor.
    - Gate 34 holds: no horizontal scroll on the swept pages.
    - No one-word last line in Where to next.
- **emil-design-eng:**
  - Gaps: N24 (the blank half second), N26 (the sheet dips twice).
  - Passes:
    - The hero's words rise once, in the house ease-out.
    - Nothing new on a high-frequency action.
    - Transform, opacity and clip-path only.
- **impeccable:**
  - Gaps: N22 (polish §3 and §4: the printed book's words), N23 and N25 (polish §5).
  - Passes:
    - The fixes for N15 to N17 and N20 were made at the narrowest level (`data-busy`, one heart per skeleton, one flag on the foot).
    - Bao's four round-7 findings are gone.
- **GSAP:**
  - Gap: N24, a position-parameter choice on the new path.
  - Passes:
    - The inside path is created in the effect that owns the nodes and reverted on cleanup.
    - No tween is left active and nothing is left faded at 2.6s on any page measured.
    - No ScrollTrigger in scope.
- **Other:** find-skills: nothing further applies. The new comments and copy needed no humanizer changes.

## Housekeeping

- **I worked only in `tab-144`.** I removed my sessionStorage helpers (`__r8*`, `__rs`) and every iframe, reset the viewport to desktop, and closed the tab.
- **My Playwright wait-state run overwrote shots.** It saved to `docs/agents/reviews/shots/book-r8-wall-wait-{1366,1920,800,390}.png` at 05:15. Bao's round-8 run had already used those names (their 2560 shot is from 05:09), so their four are replaced by mine. Mine show the same wait state at the same widths: 1366×768, 1920×1000, 800×1024 and 390×844. Bao may want to shoot them again under their own names.
- **Playwright:** headless and signed out, in fresh contexts. It held one function response for 5s and wrote nothing.
- **Not touched:** I did not sign out, did not read or touch `astory-app-auth`, and wrote no data.
