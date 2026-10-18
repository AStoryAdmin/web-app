# Bao's Standard: Family (/family) and Person (/family/:personId), round 4

**FAIL**

Five of the six round-3 findings are fixed, and Bond is now placed well on both pages. The page still fails for two reasons:

- The empty Person page, the most common case, is still mostly bare paper on a large screen. At 1366 the fix has made it worse: the empty state's text is now squeezed into a 191px column.
- The words plate on every Person page sets the kept line at body size inside a frame twice its width.

Three smaller faults also fail:

- The dating row puts its task after its secondary link.
- At 2560 the sample's grandchildren have slipped below the fold.
- The phone hero breaks "Born / 1972".

## Round 3, item by item

| # | Round-3 finding | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | Bond's head covers the review line | Fixed | Bond now sits behind the Invitations plate (`.fp-dog` z-index 0, plate z-index 1). The plate's edge hides his lowest 22px, so only his head shows above it, in clear space. I checked every text line's Range rects against Bond's box and found no overlap at any size. Measurements (Bond's box / bottom of the review line / top of the plate): 1366: y 1232–1326 / 1220 / 1304. 1920: 1104–1198 / 1092 / 1176. 2560: 1433–1555 / 1417 / 1527. 390: 2013–2093 / 1997 / 2073. |
| 2 | The keeping row leaves columns empty, and its cards end at different heights | Fixed | The review line is now a block above the cards. The cards have their own grid, with tracks 604 / 604 at 1366, 872 / 872 at 1920 (the two empty tracks collapse to 0) and 897 / 897 at 2560. Both cards are the same height: 269px at 1366, 268 at 1920, 347 at 2560. At 390 they stack. |
| 3 | "Give 4 memories a year" had the wrong number, time and route | Fixed | Person now renders the Archive's own `DateTask`. It reads "Give eight memories a year · about 2 minutes →" and links to `/write?edit=59632e67…&details=1`. The one secondary link is "The undated ones, in the archive →", pointing to `/archive#yundated`. A new ordering fault is finding 3. |
| 4 | The sample's generation row breaks at 1366 | Fixed | Rose's generation is one line (y 438–618), with Arthur Carey at x 1134, y 456. Margaret Doyle starts at x 240, inside her zone (which starts at 236). The tier is 202px tall, down from 333. |
| 5 | An empty Person page leaves a large screen bare | Not fixed, and regressed at 1366 | See finding 1. |
| 6 | Claire's "What Claire has told" repeated the plate | Fixed | That group is gone. Claire's page goes from the plate straight to "Memories with Claire" (Sunday dinner, 1980), at all four sizes. |

## Bond, judged at true size

I magnified the page with a temporary CSS scale (1.71× at 1366, 2.4× at 1920, 3.2× at 2560) so that the pane's screenshot showed device pixels 1:1. At 390 the pane renders at full scale, so no magnification was needed.

- **Family, behind the Invitations plate (curious): pass.**
  - Size: 112px wide at 1366 and 1920, 146px at 2560, 96px at 390.
  - Placement: he sits at the plate's right shoulder, about 26px in from the right edge.
  - Craft: the plate's top edge cuts him just under the chin, so he reads as a dog looking over the card rather than a sticker on it. The flat crop that round 3 objected to is now hidden behind the plate.
  - Clear space: 12–16px of paper separates his ears from the review line's bottom rule.
  - The `curious-paper.webp` art is a head-only cut-out with a transparent ground, and no halo shows on the paper.
- **Person empty state (sleep): pass for Bond himself, fail for the composition around him.**
  - Size: 128×102 at 1366 and 1920, 166×133 at 2560 (shown in zoomed CSS px, as 128×102 × 1.3), 104×83 at 390.
  - Craft: the ratio holds, and the pose fits "Nothing with Ty in it yet."
  - Placement: he covers nothing. He sits left of the headline on desktop and above it on the phone.
  - What fails is the room he sits in. See finding 1.

## Findings, worst first

1. **An empty Person page is still mostly bare paper on a large screen, and at 1366 the side-by-side layout squeezes the empty state into a 191px column.** This is the page for 4 of the 5 people in the founder's family.
   - Where: `Person.tsx` `.pp-main.bare` (two tracks), `.pp-none`. Styles in `family-people.css` lines 453–455.
   - Sizes:
     - 1366: the tracks are 343px and 420px, so the empty state gets 343px. Bond (128px) and the 24px gap leave 191px for the words. The 28px headline breaks into "Nothing with / Ty in it yet.", and the 104-character paragraph runs to 6 lines of about 22 characters. Meanwhile "Ty's family" gets the wider 420px track for one row. In round 3 this size was acceptable; this is a regression.
     - 1920: the content ends at y 491, but the portrait card beside it runs to y 944. That leaves a 1364×453px band of bare paper beside the card, about 72% of the column's height.
     - 2560: the main column is 1839px wide. The content occupies y 414–639; the portrait card runs to 1225. The tracks are 930px and 420px, so 425px of leftover width sits between them, and the empty state's text ends at x 1321 while "Ty's family" starts at x 1900.
     - The two 28px headlines do not share a top line. "Nothing with Ty…" starts at y 338 and "Ty's family" at y 318 at 1366 (339 against 319 at 1920), because `.pp-none` has 20px of top padding.
   - Evidence: `…/tool-results/mcp-Claude_Browser-blob-1792296798040-rj9rk0.jpg` (1366), `…/mcp-Claude_Browser-blob-1792296811176-oponim.jpg` (1366 at true size), `…/mcp-Claude_Browser-blob-1792296975494-e8nr74.jpg` (1920), `…/mcp-Claude_Browser-blob-1792297129289-4165um.jpg` (2560).
   - Rules: 8 and DESIGN.md ("a screen that is mostly empty ground is an underbuilt section"), 17a (a measured column, not a 22-character one), 10 (tops line up), 41.
   - Fix: let the empty state take the wide track (for example `minmax(0, 1.6fr) minmax(300px, 420px)`, with no leftover width) and remove `.pp-none`'s top padding so both headlines start on one line. Then give the empty state enough real content to stand beside the portrait card at full height. For example, a ruled list of two or three real prompts to write about this person, each opening `/write` with them named, under the one sentence and the one action.

2. **On every Person page the kept line on the words plate is set at body size (18px) inside a plate that spans the whole story column, so a third to nearly half of each gilt frame is empty.**
   - Where: `Person.tsx` `figure.pp-words-plate` (its `p` has `max-width: 518px`). Styles in `family-people.css`.
   - Sizes:
     - 2560 (Bao): the plate spans x 607–1869 and the words end at x 1301, so 45% of the plate is blank.
     - 1366 (Claire): the plate spans 448–1275 and the words end at about 1007.
     - 1920: the plate is 920px wide, with the same shape. The phone is fine.
   - Evidence: measured with Range rects. Screenshots: `…/mcp-Claude_Browser-blob-1792297155960-1d303z.jpg` (2560, Bao) and `…/mcp-Claude_Browser-blob-1792297022547-fijag2.jpg` (1920, Claire).
   - Rules: 32 (the kept line is "set large"), 9 (no card huge for a small amount of information), 8.
   - Fix: set the line at display size (Cormorant at about 30–34px, up to about 32 characters a line) so the words fill the frame. Alternatively, keep 18px and size the plate to its words (`width: fit-content`), with the attribution beside them.

3. **The dating row on Bao's page shows the secondary link first and the task second, and on the phone the task wraps onto two lines with the "·" left dangling.**
   - Where: `Person.tsx` `.pp-more`. The cause is `.arc-task { order: 3 }` in `archive-reading.css` line 403 (`order: 4` at the phone breakpoint, line 416). That rule was written for the Archive's year rows and now applies inside Person.
   - Sizes:
     - 1366: "The undated ones, in the archive →" at x 492–730, then the task at x 758–1128. The DOM order is the reverse, so keyboard focus moves right-to-left across what the eye reads left-to-right.
     - 1920 and 2560: the same order.
     - 390: the archive link is at y 1512–1556 and the task below it at y 1556–1609, set as two lines ("Give eight memories a year ·" / "about 2 minutes →").
   - Evidence: computed `order` values of 3 and 0. Screenshot: `…/mcp-Claude_Browser-blob-1792297305392-w5hqj6.jpg`.
   - Rules: 32 and 34 (the small task leads the row), DESIGN.md phones ("no two-line buttons").
   - Fix: add `.pp2 .pp-more .arc-task { order: -1 }`. On the phone, break before the "·" so "about 2 minutes →" moves down as a unit, or keep the task to one line by dropping the dot.

4. **At 2560×1300 the sample's grandchildren tier now falls across the fold. In round 3 only the "Not placed yet" shelf was below 1300.**
   - Where: `FamilyTree.tsx` tiers on `/family?preview=tree`.
   - Size: 2560.
   - Evidence: the four generation tiers are 221, 307, 269 and 247px tall, plus a 192px shelf. Maya, Leo and Sam Keller's nodes run from y 1178 to 1396 in a 1300px window, so their names and part of their faces are cut off. The real family (1920 and 2560) and the sample at 1920 still meet the bar.
   - Rule: 9.
   - Fix: at that width, take 16–24px out of each tier's vertical padding (or step the non-storyteller faces down one size) until the 2000s tier ends above 1300.

5. **Above the review line, two hairlines run 40px apart with nothing between them.** The section rule with the star is `.fp-keep::before`. The second is `.review-none`'s own top border, 40px lower.
   - Where: `family-people.css` lines 257–258 and the `.review-none` rule.
   - Sizes: all four.
   - Evidence: true-size screenshots `…/mcp-Claude_Browser-blob-1792297054946-mgs8mp.jpg` (2560) and `…/mcp-Claude_Browser-blob-1792297240170-std4ko.jpg` (390).
   - Rules: 15a (ornament placed with restraint), DESIGN.md ("the gap between sections is clearly larger than any gap inside one").
   - Fix: drop `.review-none`'s top border when it is the first thing in `.fp-keep`, so that the star rule opens the section and one rule closes the line.

6. **On the phone, the Person hero's subline breaks "Born" from its year.** Claire's subline reads "A sample family · Rose's niece · Born" / "1972", and Rose's reads "… · Born" / "1941".
   - Where: `.phero-sub` in `Person.tsx`.
   - Size: 390.
   - Evidence: per-character line tops: line 1 is "A sample family · Rose's niece · Born ", line 2 is "1972". Screenshot: `…/mcp-Claude_Browser-blob-1792297351717-rh6qc4.jpg`.
   - Rule: 10 (no orphans).
   - Fix: join "Born" and the year (and any "age N") with a no-break space.

7. **The running head reads "The Vo book" over the sample Hartley family.** This happens on `/family?preview=tree`, `sample-rose` and `sample-claire`, while the hero says "The Hartleys." and "A sample family".
   - Where: the Shell's running head on preview pages.
   - Sizes: all.
   - Rules: 28 ("a running head that knows where you are"), 20.
   - Fix: on preview pages, set the running head to "A sample family" or "The Hartley book".

8. **Each arrow link on Person is underlined in two pieces, one under the words and a separate one under the arrow, with a gap between them.** Examples: "Write a memory with Ty →" and "The undated ones, in the archive →".
   - Where: `.pp-write` (the arrow is its own underlined span).
   - Sizes: all. The fault is clearest at true size.
   - Evidence: `…/mcp-Claude_Browser-blob-1792296811176-oponim.jpg`, `…/mcp-Claude_Browser-blob-1792297267315-ur7g3o.jpg`.
   - Rule: 16 (quiet small print: one hairline, one arrow).
   - Fix: take the underline off the arrow span (`text-decoration: none` on it), or underline the whole link as one run.

## Notes, not counted against this round

- **"Ending the chat / 'How to end chay'"** is the founder's known test memory. As briefed, I did not count it. It also carries the "latest" terracotta ribbon (D10), because it is the last item on Bao's rail.
- **Bond's painterly style** is the founder's ruling. I judged only placement and craft.
- **Blank page on a cold load.** Twice, a fresh navigation showed an empty cream page for 8–11 seconds: `#root` was empty and React had not yet mounted. This looks like the dev server serving modules under load from other agents, not the app. I did not check a production build, so I am not counting it.
- **Inspection artefacts I caused and discarded.** One pane screenshot at 390 was captured mid-transition and appeared zoomed. Once at 2560, the nav highlight landed on the account pill: it had re-measured while my temporary scale was applied. After a reload the highlight sat exactly under "Family" (x 1282–1386 for both).
- **The rule-1 sweep for Bond covering words** on other pages (`.ol-dog`, `.w-dog`, `.bk-empty-dog`) was not needed this round, because Bond covers nothing here.

## How I checked

- My own pane tab (tab-81). At the end I reset its viewport to desktop and closed it.
- Sizes: 1366×768, 1920×1000, 2560×1300 (html zoom 1.3, confirmed) and 390×844.
- Pages:
  - `/family` and `/family?preview=tree`.
  - Person: Bao (storyteller, 8 undated memories), Ty Ngo (invited, no memories), `sample-rose?preview=tree` and `sample-claire?preview=tree`.
- Measurements: getBoundingClientRect, computed grid tracks and `order`, scrollWidth against clientWidth, Range rects for text lines and for Bond overlap, per-character line tops, image `complete`, natural size, opacity and filter, and the `curious-paper.webp` source art.
- The `__gsap` and `__st` hooks were not exposed, so I waited 4–6 seconds after each load and scroll. Every tree node, rail card, print and related thumbnail measured opacity 1 with filter none.
- At every size and page:
  - No horizontal scroll.
  - No text under 12px.
  - Uppercase only in the running head and folio (12px).
  - Nothing past the right edge.
  - Every link, button and input at 390 is 44px or taller.
- Nothing was clicked (I moved between pages by URL only), and nothing was written. I checked once that `astory-app-auth` exists, when the first load came up blank, and never changed it.

**Not verified:**

- Hover captions, focus-visible rings and active states. Programmatic focus did not trigger `:focus-visible` in a background tab.
- The pointer thread.
- Reduced motion.
- The live loading sketch.
- Error states.
- A 3840 zoom-2 pass.
- The invite, place, merge, take-back and send flows (out of bounds).

## Score (taste floor)

Philosophy 4, hierarchy 3, execution 4, specificity 4, restraint 4, variety 4. No dimension is under 3. The page fails on findings 1–4, which break rules 8, 9, 10, 17a, 32, 34 and 41 at the sizes listed, and on the smaller findings 5–8.
