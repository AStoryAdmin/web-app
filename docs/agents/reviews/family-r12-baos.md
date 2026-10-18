# Bao's Standard: Family (/family) and Person (/family/:personId), round 12

**FAIL**, on one item. It is old, and it is in Family's own code.

Round 12's work passes:
- **Round-11 finding 1 is fixed.** After scrolling, the condensed bar's four place links are 44px tall at 1366, 1920 and 800 on every signed-in page, and 57.2px at 2560.
- **Round-11 note 1 is fixed.** At 80cf925 the tree label breaks between phrases at 320. The fix landed during this run (see note 1).
- **Round-11 note 2 is fixed.** `.tp-name` is a `div`.
- **The fresh-load pass** at 1366, 1920, 2560, 800 and 390 found nothing on Family or on any Person page.

**The fail:** the tree is fitted and threaded before its faces have their state lines. It never measures again, so the gold threads are left where the faces used to be. This happens whenever you reach Family inside the app: from Home with the Family pill, or from a person's page. Those are the founder's ordinary ways in. A fresh load is correct, which is why rounds 10 and 11 missed it: I loaded every page by URL.

## Findings

1. **Reached inside the app, the family tree keeps a stale fit and stale gold threads.**
   - **What you see:**
     - At 1366, Ty Ngo's thread starts on his own "invited · waiting for them" line.
     - It stops 43px above Nhi Tran's portrait, and the dotted thread from "a parent of yours" stops 43px above Bao's.
     - The plate also stays one face size too large (`m` instead of `n`), so the storyteller's generation ends at 767, past the 756 fold.
   - **Where:** `src/components/family/tree/FamilyTree.tsx`.
     - `draw` (423–479) sets `data-size` and measures the threads. It reruns only when `plate.links`, `start` or `drawn` change (479), when the plate's width changes, when the window's height changes, or on the first `document.fonts.ready` (483–518).
     - The comment at 493 says "height changes follow from those". They don't. The faces' state lines come from `coded` (`Family.tsx:248`, `useMyCodes`). It is `"unknown"` while the codes load, and `FamilyTree.tsx:160–162` then prints no state line.
     - On an in-app visit the family is already cached, so the plate draws at once with `coded = "unknown"`. When the codes arrive, the state lines appear. At 1366, Ty's node and the three friends' nodes each grow by 28px, and at 800 the first generation grows by 37px. Nothing redraws.
     - On a fresh load the family and the codes arrive together, so the first draw is already right.
   - **Sizes:** 1366×768, 1920×1000 and 2560×1300 (the threads), and 800×1024 (the fit). At 390 the plate is already at the smallest size, `t`, and draws no threads, so nothing shows.
   - **Evidence**, on the real family, with the page settled 2.5–4s after the click:
     - **1366, Home → Family pill:** size `m`. The threads span y 472–504 and 461–484. Ty's node is 292–503 (ring at 294). Nhi Tran's ring starts at 547 and Bao's at 527. Ty's thread therefore starts 31px inside his own label and ends 43px short of Nhi Tran. The home generation ends at 767 against a fold of 756.
       - Capture: `tool-results/mcp-Claude_Browser-blob-1792317368482-4v248s.jpg`.
       - The same state from Ty Ngo's page → Family pill: `tool-results/mcp-Claude_Browser-blob-1792317305228-9ofzsv.jpg`.
       - The threads were unchanged 4s later.
     - **1366, fresh load of /family:** size `n`. The threads span 481–513 and 433–493. Ty's node ends at 475, and the rings start at 519 and 499. Each thread meets its portrait 6px short, as designed. Capture: `tool-results/mcp-Claude_Browser-blob-1792317326668-xtzcyq.jpg`.
     - **1920, Home → Family:** the size (`l`) and the node positions are identical to a fresh load. The threads still end at 541 and 521, against rings at 566 and 546 (fresh: 560 and 540). Ty's thread starts at 509, inside his node, which ends at 522.
     - **2560 (zoom 1.3), Home → Family:** the threads end at 629 and 609. A fresh load ends them at 648 and 628. The nodes are identical.
     - **800, from the sample tree to /family** (by URL and by the Family pill, three of three tries): size `m`. The home generation ends at 1068 against a fold of 1012, so Bao's three friends are cut by the window's edge.
       - Read from the moment of the click: at 188ms the plate is `m` and the home generation ends at 1011. At 543ms it ends at 1068, and nothing redraws.
       - Changing the window height by 1px forces the redraw. It gives `n`, with the generation ending at 984.
       - From /archive, or after a reload of /family, the plate is `n` every time.
   - **Rules:**
     - the section 6 checklist ("no clipped or overlapping text": the thread runs through "invited");
     - rule 25 (the page depends on a redraw that never comes);
     - rule 30 (the threads are the register's relations, and here they point at nobody);
     - rule 5 (the founder reaches Family from Home, not by reloading it);
     - rule 1: I checked the other in-app routes. Home, Ty's page and the sample tree all reproduce it.
   - **Fix:** make the draw react to the faces' content. Either add `coded` (or a key built from it) to `draw`'s dependencies at line 479, or let the ResizeObserver at 493 also call `later()` when a tier's height changes.

## Round 11, item by item

| # | Round-11 item | Verdict | Evidence |
| --- | --- | --- | --- |
| Finding 1 | The condensed bar's place links were 38.4px | **Fixed** | e9205dc removed `.top.stuck .pillnav { transform: scale(0.96) }` and `.top.stuck .pillnav a { min-height: 40px }` (`astory.css` 3452 and 3718). No other `stuck`/`pillnav` rule scales or shrinks the links. Each page was scrolled to min(600, max) with a dispatched scroll event, and the bar read `top on-dark stuck` (`teal stuck` on Book), with the pill's transform `none`. **Links:** Home, Archive, Family and Book are 44.0 tall at 1366, 1920 and 800 on `/`, `/write`, `/talk`, `/archive`, `/archive/:id`, `/book`, `/plans`, `/account`, `/family` and all six Person pages. `/start` redirects to `/` for this account. At 1920, `/talk`, `/plans`, Mark and Maya fit one screen, so their bar never condenses. **The other controls** (wordmark, Storyteller, Add, Account) are 44 everywhere. **At 2560** every link is 57.2. **At 390** the tab bar items are 77.5×56.6. **With frames drawn** at 1366, the bar settles at 56.2px, and the pill (51.3px) sits 2.4px inside it, centred. The pill's highlight lines up with the Family link: 682.4–762.4 against 682.7–762.9. Capture: `tool-results/mcp-Claude_Browser-blob-1792316554058-oztway.jpg`. |
| Note 1 | At 320 the label broke inside "and Margaret's" | **Fixed in 80cf925** | e9205dc alone moved the break, not removed it. At 320 it measured "1960s Rose's" / "children and Margaret's". There was no space before the span (only an 8px margin), so "children" and the nowrap phrase made one run. 80cf925 added `<span class="tp-sp"> </span>` with `word-spacing: 4px` and set the margin to 0. The live copy now has `.tp-also { display: inline-block; max-width: 100% }`. Measured on both, they agree. **320:** "1960s" 50–89, "Rose's children" 99–203, then "and Margaret's" 50–146 on line 2, at the heading's edge. The space hangs at the wrap (width 0). **390:** one line, with the title ending at 203 and "and Margaret's" at 211–307 (8.0px gap). **800:** one line, 209 → 217. **1100 (stacked):** one line, 218 → 226. **Real family, 320–800:** "Your parents" 50–138, then "and Nhi Tran's" 146–237 (8px). **1366 and 2560 (grid):** "and Margaret's" stays a block under the name at the same left edge, unchanged. The heading's text is now "Rose's children and Margaret's". It was "childrenand". |
| Note 2 | `<span class="tp-name">` wrapped an `<h3>` | **Fixed in 34b2cc4** | It is now `DIV`, with a line-height of 19.55px (1.15). The decade sits above the name on the grid at 1366 (302 → 321), as in round 11. |
| Note 3 | 2560 snug threads | **Open, ruled for the founder** | `/family?preview=tree` at 2560 is `data-snug="1"`, size `n`, 0 paths. Not counted. |

## Fresh pass

**Pages:**
- `/family` and `/family?preview=tree`.
- Person pages: Bao Vo (5aa5a1cf…) and Ty Ngo (36cfd520…), plus `sample-rose`, `sample-claire`, `sample-mark` and `sample-maya`, each with `?preview=tree`.

**Sizes:** 1366×768, 1920×1000, 2560×1300 (`--zoom` 1.3000), 800×1024 and 390×844. That is 40 fresh loads. The tree labels were also read at 320 and 1100.

| Check | Result |
| --- | --- |
| Horizontal scroll | None. scrollWidth equals clientWidth on every page and size. |
| Overlapping text | None among the text itself. A pairwise check of text ranges, excluding clamped excerpts and the bar, gave 0 hits on all 40 loads. The thread crossing Ty's label (finding 1) happens only on in-app visits. |
| Clipped text | None, except the cloth's `aria-hidden` `.lamp` light, which the cloth crops by design. |
| Text under 12px | None. |
| Targets under 44px | None at rest or condensed. |
| Faded after the motion settled | Only the sample's disabled "Invite someone" (0.65, `aria-disabled`), by design. Everything else measures 1 once its rise has run in real time. A first read, taken while the tweens were still running in the background tab, showed values of 0–0.5. All of them reached 1 on a reread after 1.6s of real time with ticks. |
| "Where to next" | Every page ends with it. |
| Tree, fresh loads | **Sample:** threaded, size `t`, 11 paths at 1366 and 1920. Snug, `n`, 0 paths at 2560 (ruled open). Stacked at 1100. Band at 800 and 390. **Real family:** `n` with 2 paths at 1366, `l` with 2 at 1920 and 2560, `n` at 800, and `t` at 390. |
| Person pages | Unchanged from round 11. Mark and Maya fit one screen at 1920 and 2560 (scrollHeight equals the viewport). |

Rules 32–46 hold as in round 11: the kept line, Bond's empty states, "Where to next", and the cloth hero with its foil full stop.

## Notes, not counted

1. **Work landed while I reviewed.** 80cf925 (the `tp-sp` space) landed mid-run and caused two HMR reloads. My 1366 and 1920 Family passes ran on e9205dc. I re-read the label on 80cf925 at 320, 390, 800, 1100, 1366 and 2560, and on the uncommitted `inline-block` / `aria-labelledby` copy at 320 and 390.
   - At 05:58, uncommitted edits also appeared in `Shell.tsx`, `lib/arrive.ts`, `Home.tsx`, `Person.tsx`, `Archive.tsx`, `Book.tsx`, `Start.tsx` and `Write.tsx`, after my measurements. I did not review them.
2. **The condensed pill nearly fills the bar.** It is 51.3px tall in a 56.2px bar, with 2.4px above and below. It is centred and reads fine in the capture. I note it only because the bar now condenses around a pill that keeps its full size.
3. **The 2560 snug threads.** Ruled open for the founder.
4. **Known:** the founder's test content (Ty Ngo as "Nhi Tran's parent", the two Nhis, friends in "Your generation") and Bond's painterly style.
5. **A frameless pane.**
   - Captures in my tab came back blank until forced.
   - One 800 capture drew the scrolled page offset by its scroll position. The DOM showed the bar at 0–56, with `elementFromPoint(400, 20)` landing on the Family link.
   - The condensed bar's height reads 64 until frames run, because of the 200ms height transition. The links measure 44 either way.

## How I checked

- **My own pane tabs:** tab-155, plus tab-163 for the last label read. I loaded every page by URL, sized the tab per width, and scrolled through each page with dispatched scroll events. I stepped `__gsap.ticker.tick()` with real-time waits, then read at the top.
- **Measured:**
  - scrollWidth;
  - pairwise text-range overlap;
  - overflow clipping;
  - font sizes;
  - target sizes;
  - opacity chains;
  - "Where to next";
  - the tree's `data-size` / `data-stack` / `data-snug` and paths;
  - `.tp-name` / `.tp-dec` / `h3` / `.tp-also` line boxes;
  - the condensed bar after scrolling.
- **Finding 1:**
  - in-app visits by clicking the Family nav link from `/`, from Ty Ngo's page and from the sample tree;
  - a MutationObserver log of `data-size` and the home generation's bottom from the click onward;
  - the thread `getBBox()` against each node's and ring's rect;
  - a 1px window-height change to force the redraw.
- **Code read:**
  - the e9205dc, 34b2cc4 and 80cf925 diffs;
  - `astory.css` `stuck` / `pillnav` rules;
  - FamilyTree `draw` and its redraw triggers;
  - `treeMotion.ts`;
  - `lib/arrive.ts`;
  - `Family.tsx` `coded` / `useMyCodes`.
- **What I touched:**
  - I clicked only navigation links and wrote no data.
  - I kept my audit script in one `sessionStorage` key of my own (`bao-r12-audit`) and removed it.
  - I read only whether `astory-app-auth` exists (it does). I never wrote it, removed it or signed out.
  - I reset both tabs to desktop and closed them.

**Not verified:**
- A real pointer's hover and press.
- Reduced motion.
- 3840 wide.
- A real Edge zoom.
- The failure states (unchanged).
- vitest and tsc (not run by me).
- Whether finding 1 also follows other in-app routes, such as Archive, Book or the back chevron.

## Score (taste floor)

Philosophy 4, hierarchy 4, execution 3, specificity 4, restraint 4, variety 4.

Everything this round set out to fix is fixed. The bar's links are 44px on every signed-in page, and the label breaks between phrases. The fail is the tree's fit and threads, which go stale on the way the founder actually reaches Family. Redraw the plate when the codes arrive and this round passes.
