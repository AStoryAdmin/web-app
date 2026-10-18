# Book, Plans, Account, Talk, Start and the Wall, round 10: Bao's Standard

**FAIL.** 1 finding.

Everything this round set out to fix is fixed:
- Round 9's four findings.
- N27, N28 and N29.
- Write's double rise.
- The coordinator's f8c73d3 (in-app arrivals): moving between pages no longer slides the sheet a second time.

The fresh pass found one fault that has been there all along: Account's first-name and last-name fields run out of their column, and off the window, at 761–837px and 1101–1233px wide. That band includes 800×1024. Round 9 missed it because `overflow-x: clip` on `html` keeps `documentElement.scrollWidth` clean. This round I also measured `body.scrollWidth` and every element's right edge.

## How I checked

- **Read first:**
  - BAOS-STANDARD.md and DESIGN.md's craft rules.
  - `book-r9-baos.md` and `book-r9-skills.md`.
  - The source diff of 925d874: Shell.tsx, Archive.tsx, Home.tsx, Person.tsx, Write.tsx and book-account.css.
  - Then f8c73d3: Shell.tsx, arrive.ts and pageTransition.ts.
- **Signed-in pages, in my own pane tab (tab-181):**
  - The tab sat on `/book/closed-640.webp`. Each page was cold-loaded into a same-origin iframe of the test size, at 0.01 opacity.
  - The pane was hidden, so Chrome throttled `setInterval` to about once a minute. The poll ran on a MessageChannel loop every 4ms instead. It stepped the frame's GSAP ticker (with `lagSmoothing(0)`) about every 16ms.
  - On each change it recorded:
    - whether a skeleton was up;
    - the cloth's height;
    - the sheet's layout top (the offset chain) and its opacity.
  - A MutationObserver installed before the app mounted read the sheet's opacity, and every inserted `[data-rise]` item's, in the microtask right after React's commit. That is before the browser can paint.
- **The sweep:** after arrival, 300 GSAP steps and `__st.update()`, then:
  - `documentElement` and `body` scrollWidth, and every element's right edge;
  - text under 12px outside the book;
  - controls under 44px;
  - overlapping controls;
  - text in view under 0.9 opacity (the opacities of all its ancestors multiplied);
  - one-word last lines;
  - straight quotes;
  - words cut in two;
  - the Where to next rows.
- **Pages and sizes:** Book, Plans, Account, Talk, `/start?another=1` and `/start?another=1&join=1` at 1366×768, 1920×1000, 2560×1300 (zoom 1.3), 800×1024 and 390×844.
- **The wall:** headless Playwright from `../09142026/node_modules/playwright`, a fresh signed-out context every time.
  - The real wall at 1366, 1920, 2560, 800, 390, 770, 800×900, 900, 1000, 1100×900, 1180×900, 3840×2160, and 1707×960 at deviceScaleFactor 0.8.
  - The bad slug at seven sizes.
  - The wait state (the function held back 5s) at five sizes.
- **The join skeleton:** I could not screenshot the pane while it was hidden. I took a copy of the live skeleton's DOM and drew it headless against the dev server's own stylesheets (`?direct`). Its boxes match the live skeleton to 1px. I looked at it at 1366 and 390, and at 2× for the hairlines.

## Round-9 findings and N27–N29, re-checked

| # | Round 9 | Now |
|---|---|---|
| 1 / N27 | The loading heroes on Archive, Person and Home were shorter than the arrived ones | **Fixed, to 0px.** Cloth height and sheet top, skeleton → arrived (table below). Every load rose once, and the sheet's layout top never moved. |
| 2 | Talk's card landed 26px below its outline at 1001–1030 | **Fixed.** The 374px rule now starts at 1031. Outline top → card top, from the sheet: <br>• 1001, 1024 and 1030: 526 → 525; <br>• 1031: 495 → 494. <br>The words column is 405 → 404 up to 1030, and 374 → 373 from 1031. The heart sits inside the outline at every width. |
| 3 / N29 | The arrival ran in `useEffect`, so content could paint before it hid | **Fixed.** Both arrivals are `useLayoutEffect`. In the microtask right after the commit, the sheet already read opacity 0 on every cold load: <br>• Home, Archive, Person ×3, the memory page, Write, Talk, Book and Account, at every size. <br>On the inside path, every inserted `[data-rise]` item read 0 at insertion: <br>• Home, Person, the memory page and Talk. <br>Round 9 measured an 11–25ms gap at full opacity. There is none now. |
| 4 | The join link's skeleton drew only the heart | **Fixed.** Drawn in hairlines: <br>• a rule under the back link; <br>• one rule per line of the step line, the title and the five body lines (each `::after` repeats at the element's own `1lh`); <br>• the code field's underline; <br>• the button as a 107×48 outline. <br>Shots: `shots/book-r10-start-join-1366-skeleton.png` and `-390-skeleton.png`. The boxes are unchanged from round 9 and equal to the arrived page at all five sizes: <br>• sheet 1240×381 at 219.5; h1 at 365; body at 429; input at 287; button at 353 (1366). <br>"Opening the book…" is the status. |
| N28 | The bare page's key let React write into the split title | **Fixed.** On the memory page at 1366, 390 and 1920 the hidden hero ends as `<h1 class="hero-title" data-risen="1">Archive</h1>`, the chapter, and no longer the stale "Memory". |
| — | /write rose twice | **Fixed.** Cold loads ×2 at 1366, 390 and 1920: the sheet goes 0 → 0.73 → 1 with no dip, and the cloth (104 / 96) never changes. |

**Cloth height and sheet top, skeleton → arrived (CSS px):**

| Page | 1366 | 1920 | 800 | 390 |
|---|---|---|---|---|
| Archive | 384.1 → 384.1, top 356 | 384.1 → 384.1, 356 | 384.1 → 384.1, 356 | 402.8 → 402.8, 375 |
| Home | 355.7 → 355.7, 328 | 363.8 → 363.8, 336 | 484.1 → 484.1, 456 | 593.1 → 593.1, 565 |
| Person (5aa5) | 256.9 → 256.9, 229 | 257.6 → 257.6, 230 | 232.6 → 232.6, 205 | 192.6 → 192.6, 165 |
| Person (36cf, ff96) | 256.9 → 256.9 | — | — | 192.6 → 192.6 |
| Memory page | 104 → 104 | 104 → 104 | — | 96 → 96 |

I re-ran Archive 1366 and 390, Home 390, Person 1366 and Write 1366 after f8c73d3 landed, and got the same numbers.

## The writer, now under one Shell

- **The desk renders as before:**
  - `w-grid spread` at 1366;
  - the hero is `display: none` on the bare cloth (104px);
  - three question links and three Where to next rows;
  - nothing faded once settled. The one element under 0.9 is Bond's `awake` frame at 0, a designed cross-fade state.
- **Switching questions:**
  - Clicking "Where do you go when you need to be quiet?" moves to `/write?q=faith-where-quiet`. The keyed Writer remounts with the new question, and the book is laid on the desk again (0 → 1). The sheet stays at opacity 1 and is the same node: it does not rise a second time, and that is right.
  - I shimmed `startViewTransition` to run its update at once, because a hidden pane never resolves a real one.
- **Hooks:** the new `useContext` and layout effects in `Writer` sit before its `if (kept)` return, so the hook order is stable.
- **The kept page (code only, as asked):**
  - Writer sets `keptAs` in a layout effect, so Write re-renders the Shell with the "Memory No. n / Kept in …" hero before the browser paints.
  - `ready` changes from `b` to `h`, so the arrival runs once for the kept page, as it did when it was its own Shell.
  - The unmount cleanup resets the frame to the desk.
  - **Not verified:** a cold load of `?edit=…` with details goes skeleton (`b`) → kept (`h`), which re-runs the whole arrival. That is the same as before this change.

## In-app arrivals after f8c73d3 (coordinator's question)

**In-app changes now rise once.** Each in-app page change moved through the app's own capture-phase link handler, with `startViewTransition` shimmed. I sampled the sheet every 8ms for 2.2s after each click:

| Change | Sheet opacity, lowest | Sheet's largest y | Dips |
|---|---|---|---|
| Book → Archive → Family → Home → Book (the pill nav) | 1 | 0 | 0 |
| Home → /write (Write it) → Archive → a memory → Account | 1 | 0 | 0 |

- Family and the Book showed their skeleton after the change and still held.
- After the last change nothing in view was under 0.9, and no tween was still running.
- StrictMode is on in `main.tsx`, so this is the dev double-run the commit addresses.
- **Not verified:** the browser's own snapshot animation, because the pane draws no frames.

## Findings

1. **Account's First name and Last name fields run past their column, past the sheet's edge and off the window, from 761 to 837px and from 1101 to 1233px wide.**
   - **Where:** astory.css:1286, `.acct-two { grid-template-columns: 1fr 1fr; }` (Account.tsx:137, the profile form). A bare `1fr` track has an `auto` minimum, so each track stays at the field's intrinsic width (247.3px) when the column is narrower than 2 × 247 + the gap.
   - **Evidence:**
     - **800×1024:** the column is 473px wide and ends at 759. The tracks are 247.3 + 247.3. "Last name" ends at 796.3, so it runs 36px past its column. The window's content edge is 785, so 10–11px of the field is cut off, and `body.scrollWidth` is 796 against 785.
     - **Across the bands** (iframe width; overrun past the column / cut at the window):
       - 761: 73 / 49;
       - 801: 36 / 10;
       - 813–837: inside the window, but still over the column and onto the sheet's margin;
       - 1101: 84 / 49;
       - 1161: 47 / 10;
       - 1177–1233: over the column only.
     - Clean at 390–760, 850–1100 and 1280 and up.
     - Round 9 called Account at 800 clean because `html { overflow-x: clip }` hides it from `documentElement.scrollWidth`.
   - **Sizes:** 800×1024 among the review sizes. A 768–834px tablet in portrait, and a 1101–1233px laptop window.
   - **Rules:** the checklist ("no horizontal scroll, no clipped or overlapping text"), rule 12 (nothing stretches or collapses), and DESIGN.md's phone floor ("grid tracks `minmax(0, 1fr)`").
   - **Fix:** set `.acct-two` to `grid-template-columns: repeat(2, minmax(0, 1fr))`. Under rule 1, do the same for the identical pattern `.invite-sheet .two` (astory.css:1054, InviteSheet.tsx:388), which I did not open, because the button that opens it writes nothing but sits beside "Name them". Then check every form at 761–840 and 1101–1240 with `body.scrollWidth` and the fields' right edges, not only the document's.

## What passed

- **The fresh pass,** at 1366, 1920, 2560, 800 and 390 on the six pages, except finding 1:
  - no horizontal scroll;
  - no text under 12px outside the book;
  - no word cut in two;
  - no straight quotes.
- **Controls under 44px:** only Account's two visually hidden 1×1 radios at 2560, whose labels are the targets.
- **Overlap:** the only overlaps are page rows under the fixed phone tab bar at scroll 0 (the Book's "The cover", an Account field). They scroll clear, as in round 9.
- **Faded text:** only Start's "Dear family," specimen at 0.45, the designed disabled way.
- **One-word last lines:**
  - the detector's running-head hits are its two spans, which are one line;
  - Account's "Chosen" at 1920 is the state in the button slot, as round 9 saw at 390.
- **Where to next:** three rows on Book, Plans, Account and Talk at every size.
- **One rise:** every cold load had no dip.
- **One screen:**
  - Plans is one screen at 1920 and 2560 (1000 / 1300), and so is Talk.
  - Start's step 1 and the join page are one screen at 1366, 1920, 2560 and 800. At 390 the join page fits 844, and step 1 scrolls (1194).
- **Talk, skeleton → arrived:**
  - At 1101, 1366, 1920 and 2560 the outline and the card share their top (81).
  - At 390 the outline is 66/245, and the card is 66/245.
- **The wall:**
  - The function answered 200 every time, the fallback RPC was never called, and 4/4 photographs loaded.
  - No auth keys are in storage, and there is no horizontal scroll at any of the thirteen sizes.
  - Leaf titles are 1–2 lines (up to 4 at 3840, with the zoom of 2.16 divided out, the same as round 9).
  - The bad slug answers 404 and shows "This story isn’t shared." in exactly one screen at seven sizes.
  - The wait state reads "Opening the book…", its heart crosses no rule, and the arrived cloth matches the wait cloth to 0.4px at all five sizes.
  - Two kinds of detector hit are not faults:
    - the mid-word hit on "Yeah" is the drop cap's `::first-letter`;
    - the one-word last lines it flagged are all inside clamped excerpts (CLIPPED).
  - Shots are in `shots/book-r10-wall-*`.

## Notes (not findings)

- **Talk at 761–1100:** the outline now takes the card's tilt and the tops agree to 1px. But the outline is 261px tall, and today's card is 253, so its foot lands 8px higher. The card's height follows the length of the day's question, so a fixed outline can't always match it. 253 would fit today's.
- **The join skeleton's step line:** its hairline falls on a half pixel at 1×, so it draws fainter than the others. At 2× it is clear.
- **The wall's phone foot:** about 100px of bare paper still sits above the mark at 390 (the skills round-9 note). It is unchanged.
- **Wall copy** ("Yeah well so my dad…") is founder test content and the tidy's business. Not counted.

## Not verified

- **Real paints and the browser's view-transition snapshot:** the pane was hidden and draws no frames. The layout-effect timing was proven in the commit's microtask instead.
- **The signed-in pages at 3840×2160 and in a zoomed-out Edge window:** 2560 at zoom 1.3 stands in for them.
- **Hover, focus-visible, active and reduced-motion states:** not exercised this round.
- **The kept page:** read in code only. I kept no memory, as instructed.

## Housekeeping

- **The pane:** I worked only in tab-181. Every measuring iframe and my window helpers were removed. I reset the viewport to desktop and closed the tab.
- **What the loads did:** loading /talk and /plans queued their usual view events. Clicking a question link in the writer only navigated: nothing was typed, and no draft was made.
- **Not touched:** I didn't sign out and didn't read or touch `astory-app-auth`. I pressed none of Save, Keep, Change, Remove, Send, Order, Open it, Choose, switch story, the printing-interest button, "Name them" or "Delete my account…".
- **Playwright:** headless, signed-out and fresh, against the wall and against a static copy of the join skeleton.
- **Saved:**
  - Scripts are in my scratchpad (`r10/`).
  - Shots are `docs/agents/reviews/shots/book-r10-start-join-{1366,390}-skeleton.png` and `book-r10-wall-*`.
