# Bao's Standard: Family (/family) and Person (/family/:personId), round 10

**PASS**

The round-9 finding and the three round-9 skills gaps are fixed, and so is skills note 3. Note 4 is fixed for Family; the shell still has the gap (see note 1).

The stacked tree at 1100–1320 is right. It is the tablet's layout, measured to the pixel against 1099, and 1366 is unchanged. The fresh pass at 1366, 1920, 2560, 800 and 390 found nothing to count on Family or on any Person page.

Two things are written up as notes, not findings:
- **A shell gap at 760–761px.** It is in the shell's CSS, not on these pages, and it was there before this round.
- **32px of extra air under the stacked tree.**

The 2560 sample tree drawing no threads is ruled open for the founder and not counted.

## Round 9, item by item

| # | Round-9 item | Verdict | Evidence |
| --- | --- | --- | --- |
| Baos 1 | On a phone, a wrapped "+" ask sat 12px inside the heading's edge | **Fixed** | The ≤1099 label is now a wrapping flex row with `column-gap: 12px`, and the margins are gone (`family-people.css:244–253`). **At 390, sample tree:** the lifted "a child" is at x 50 with `margin-left: 0px`, under "1960s" at x 50. "Not placed yet" and "Say who they are to Rose." also start at 50. "Rose's grandparents" now fits on the heading's own line, at 207 (the heading ends at 195). **At 800:** "Rose's grandparents" is at 213, 12px after the heading (ends 201). On `/family`, "a child" is at 178. |
| Skills R9-1 | The sample tree's faces collided at 1100–1300 | **Fixed** | `collides()` plus `data-stack`. See the next section. |
| Skills R9-2 | Focus fell to `<body>` when the "+" moved | **Fixed** | I focused the in-row "Add a child" by script at 800, resized to 390 and forced a frame. The ring lifted ("Rose's children" has `data-ghost-up`), and `document.activeElement` became the `.tp-ask.tp-ask-alt` twin, labelled "Add a child", which is visible. |
| Skills R9-3 | The same control had two names | **Fixed** | All seven asks and rings on the sample tree carry `aria-label="Add …"`: "Add Rose's grandparents", "Add a sister or brother" ×2, "Add a child" ×2 and "Add a grandchild" ×2. |
| Skills note 3 | The wrapped ask's 12px indent | **Fixed** | The same fix and evidence as Baos 1. |
| Skills note 4 | Sub-pixel gaps at 760/761 and 1099/1100 | **Fixed for Family, open in the shell** | `family-people.css` now uses 760.98, 1099.98 and 1499.98, and `balance()` uses 1099.98. **In a 1099.5px iframe** the tree takes the band (threads `none`, size `t`) with 0 node overlaps. That is the R9-1 sub-pixel collision, now closed. The shell is note 1. |

## The stacked tree at 1100–1320

Each width below was measured after a fresh load, with `__gsap.ticker.tick()` stepped. All are on `/family?preview=tree` at a height of 800.

| Width | State | What it measures |
| --- | --- | --- |
| 1099 (the band, for reference) | no stack, size `t`, no threads | Frank 336–464, Rose 482–632 and Tom 650–778 on the storyteller's line. Margaret 280, Jim 426, Arthur 572 and "a sister or brother" 718–834 under them. Rose's children run 207–907 with the ring last, and the grandchildren 280–834. |
| 1100 | `data-stack="1"`, size `t`, 0 paths, threads `display: none` | The same layout within 1px: Frank 337, Rose 483 and Tom 651, then Margaret 281, Jim 427, Arthur 573 and the ring 719–834. The children run 208–907 and the grandchildren 281–834. Every row is centred on x 557.5. No node boxes overlap and no text overlaps. "Rose's grandparents" sits beside its heading, at 223 (y 283–327, heading 298–319). No ring is alone, so nothing is lifted. |
| 1180 | stacked, size `t`, 0 paths | The same composition, centred at about 597. No overlaps. |
| 1280 | stacked, size `t`, 0 paths | The same composition, centred at about 629. The widest row is 280–979 on a 1148px plate. No overlaps. Rose's tier is in the first screen (capture). |
| 1320 | stacked, size `t`, 0 paths | The same composition. **Stacking here is right.** With the stack lifted by script, Rose's centre unit needs 442px in a 415px track, the row needs 1021px of 994, and the Doyles' boxes would sit 6px from Frank's. |
| 1345 | stacked | — |
| 1355 | threaded, 11 paths | The smallest gap between boxes in Rose's generation is 18px. The first width that threads already has full spacing. |
| 1366 | threaded, 11 paths, size `t`, no stack, no snug | **Unchanged.** The zones need 274/278, 442/442 and 265/278, and the smallest gap is 18px in every generation. The plate is 292–1111, as in round 9. |

**Live resize, with a frame forced after each:** 1366 → 1280 set `data-stack` (threads `none`, 0 paths), and 1280 → 1366 cleared it (threads `block`, 11 paths).

**The real family** is not stacked at 1100: it is threaded with 2 paths at size `n`, and the closest boxes are 22px apart.

**Why I call it right:**
- The stacked tree is the band's composition: the storyteller's unit first, everyone balanced and centred, and the "+" last.
- It reads as a register, not a squeezed chart (rule 30). It also matches what a laptop at 1099 already shows, so the layout doesn't jump at 1100.
- The tree keys on fit, not on a breakpoint. A larger family will stack at 1366 rather than collide. That is the behaviour round 9 asked for.

## Fresh pass

**Pages:**
- `/family` (the real family) and `/family?preview=tree`.
- Person pages: Bao Vo (5aa5a1cf…) and Ty Ngo (36cfd520…), plus `sample-rose`, `sample-claire`, `sample-mark` and `sample-maya`, all with `?preview=tree`.

**Sizes:** 1366×768, 1920×1000, 2560×1300 (`--zoom` 1.3), 800×1024 and 390×844. Every page was checked at every size.

| Check | Result |
| --- | --- |
| Horizontal scroll | None. scrollWidth equals clientWidth on every page and size. |
| Overlapping text | None, by a pairwise check of every visible text leaf. On the phone, the only hits were page text passing under the fixed tab bar, which is correct. |
| Clipped text | None. |
| Text under 12px | None. |
| Targets under 44px | None. "Press ? for shortcuts" measures exactly 44.0 at 1920. |
| Faded after the motion settled | Only `.tp-cap` (the hover captions) and the sample's disabled "Invite someone" (0.65, `aria-disabled`), both by design. `.tp-amp` read 0 on the first 2560 load, mid-arrival in a frameless tab, and was 1 on all five a second later. |
| "Where to next" | Every page ends with it. |
| Tree, 1366 and 1920 | Threaded, size `t`, 11 paths, no stack. |
| Tree, 2560 | Snug, size `n`, 0 paths. This is the ruled-open item. Faces don't overlap. |
| Tree, 800 | Band, 0 paths. Rose's children are one row (58–757) with the ring last, and "Rose's grandparents" is beside its heading. |
| Tree, 390 | "Rose's children" lifts "a child" onto the heading's edge at x 50. Rows are Anne & Mark, then Daniel and Claire. |
| Person pages, 1366, 1920 and 2560 | The plate is in the side column and the kept line heads the main column: Rose at 615–1108 in 448–1275 at 1366, and 883–1593 at 2560. On the wide sizes, the family list stands in the right-hand column. |
| Person pages, 800 | The slim plates are as wide as their words, and every framed card starts at x 26: Rose 26–409, Claire 26–404, Mark 26–372 and Maya 26–321. The kept line is 26–519. Bao's and Ty's plates are full width (26–759), as noted in round 9. |
| Person pages, 390 | The plate and the kept line share x 24–370, and the sections start at 24. |

**Rules 32–46 hold as in round 9:**
- The kept line as the takeaway.
- Bond's empty state on Mark, Maya and Ty, with the minutes and one action.
- "Where to next" on every page.
- The cloth hero with its foil full stop.

## Notes, not counted

1. **The shell drops all navigation between 760 and 761px.**
   - **Where:** `styles/astory.css`.
     - `.pillnav` is hidden at `max-width: 900px` (line 538).
     - The `.tabbar` only appears at `max-width: 760px` (line 553).
   - **Measured in a 760.5px iframe of `/family/sample-rose?preview=tree`:**
     - `.pillnav` is `display: none` and so is `.tabbar`: no Home, Archive, Family or Book anywhere.
     - Family's own phone rules (760.98) do apply.
     - Capture: `tool-results/mcp-Claude_Browser-blob-1792314828716-tsb4kr.jpg` (left half).
   - **How reachable:** an Edge window of 951 device px at 125% gives 760.8 CSS px.
   - **Why it isn't counted against this round:**
     - The gap is not on the Family or Person pages' own code.
     - It was there before 1a3faab, which didn't touch `astory.css`.
     - It is one pixel wide and none of the five sizes reaches it.
   - **It is skills note 4 left half done.** Rule 1 asks for the fix everywhere. 46 queries in `astory.css` still end at `max-width: 760px`. So do 7 in `archive-reading.css`, 12 in `book-account.css`, 3 in `writer.css` and 1 in `signed-out.css`, plus the `matchMedia("(max-width: 760px)")` calls in `pages/Archive.tsx:43/47` and `components/book/BookSpread.tsx:82`.
   - **Fix:** a site-wide sweep to `760.98px` (and `1099.98px` / `1100px` pairs where they meet), or range syntax (`width < 761px`). At the least, make the shell's tab bar and pill nav share one boundary.
2. **In stack mode the last generation keeps its 32px bottom padding.**
   - **Cause:** `.tp[data-stack] .tp-tier` (0,3,0) outranks `.tp-tier:last-child { padding-bottom: 0 }` (0,2,0, line 146). The band's unscoped `.tp-tier` loses to it.
   - **Effect:** at 1100 the plate ends at 1571 against 1539 at 1099. The rail ends 6px above Nora's bottom, where at 1099 it ends 24px above. Everything below moves down 32px ("Where to next" is at 2151, against 2118).
   - **Visible?** Not as a fault; it is a little more paper.
   - **Fix:** add `.tp[data-stack] .tp-tier:last-child { padding-bottom: 0; }`.
3. **At 2560 the sample tree draws no gold threads in snug mode.** The lead has ruled this open for the founder (0 paths at `data-snug="1"`).
4. **Known:** the founder's test content (Ty Ngo as "Nhi Tran's parent", the two Nhis, friends in "Your generation", "Ty Ngo & Bao.") and Bond's painterly style.
5. **Prints in a frameless tab.** Rose's family prints and Bao's memory print showed blank in a first capture and filled on the next. This is the same decode lag as rounds 6–9.
6. **Bao's plate at 800 is still full width** (round 9's note: `slim` is keyed on "no actions"). It holds under rule 10.

## How I checked

- **My own pane tab (tab-145).** I sized it per width, reloaded it fresh for every tree measurement, and stepped `window.__gsap.ticker.tick()` ×300 with `__st.update()` before each measurement.
- **The pane was hidden for part of the run.** Another session had the panel, so screenshots timed out for a while. The 1920 Mark/Maya/Bao/Ty, 2560 and 390 measurements were taken by script without captures. Captures resumed for 390 and 800.
- **Another session's edits reloaded my tab** (`components/archive/transcript.ts`, Vite full reload) three times mid-script. Each of those measurements was rerun.
- **Served code confirmed:** Vite served `function collides`, the focus-twin comment and `.tp[data-stack] .tp-threads`. `git status` shows FamilyTree.tsx and family-people.css unchanged since 1a3faab.
- **Code read:**
  - The 1a3faab diff (FamilyTree.tsx: `collides`, `draw`, `balance`, the twin focus and the aria-labels; family-people.css: the round-10 block and the .98 bounds).
  - `astory.css:531–560` (the shell's 900 and 760 rules).
- **Measured:**
  - getBoundingClientRect for every tree unit, ring and ask by tier and row, plus a pairwise overlap check of node boxes.
  - Zone needs against tracks with the stack lifted by script (`__why`, which restores the attribute).
  - A pairwise overlap check of all visible text, overflow clipping, font sizes, target heights, opacity, scrollWidth, and the plate, words, side and main column rects.
  - Two same-origin iframes at 760.5 and 1099.5 for the sub-pixel bounds. I removed them afterwards.
- **What I touched:**
  - I clicked nothing that writes. I moved by URL only.
  - I focused one ring by script.
  - I kept my scripts in three `sessionStorage` keys of my own and removed them.
  - I read only whether `astory-app-auth` exists (it does). I never wrote it, removed it or signed out.
  - I reset the viewport to desktop and closed tab-145.

**Not verified:**
- A real pointer's hover and press on the rings (the code is unchanged: the `.tp-ask` states).
- Reduced motion (nothing new moves).
- 3840 wide.
- A real Edge zoom, as opposed to emulated widths and iframes.
- The failure states (unchanged).
- vitest and tsc (not run by me).

## Score (taste floor)

Philosophy 4, hierarchy 4, execution 4, specificity 4, restraint 4, variety 4.

Family and Person pass this standard at 1366, 1920, 2560, 800 and 390. They also pass across the 1100–1355 band where the tree now stacks. Note 1 belongs to the shell and should be the next site-wide sweep.
