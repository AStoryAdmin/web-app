# Bao's Standard: Family (/family) and Person (/family/:personId), round 3

**FAIL**

The round-2 defects are almost all fixed, and the pages are close. Four things still fail:

- Bond covers words.
- The keeping row leaves half the sheet empty on a large screen.
- The "Give N memories a year" row gives the wrong number and goes to the wrong place.
- The sample's middle generation breaks at 1366.

## Round 2, item by item

| # | Round-2 finding | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | Ty Ngo's invite state told three ways | Fixed | Tree: "invited · waiting for them". Person: "Invited with a code, 29 days left…", TTC JP2, "Send the code again" and "Take back". |
| 2 | Plate sentence repeated on the rail | Fixed | Rose's "Today" card and Claire's "The waltz" card show title and date only. New, smaller issue: finding 6. |
| 3 | "No date yet" / "Anything else" on every card | Fixed on the cards | Bao's `.pp-date` now reads only "Childhood". The row that replaces them is wrong: finding 3. |
| 4 | Bao's family column empty and contradicting the tree | Fixed | Kin lists Nhi Tran, Nhi and GBao Vo as "friend". The third column appears only with 3 or more entries (1920: 380×253 beside an 820px story). |
| 5 | Tree past the fold | Fixed for the real family; holds for the sample except finding 4 | Real family plate: 1366: 292–714, storyteller fully above 768. 1920: 293–825. 2560 (zoom 1.3): 381–1073. Sample: 1920: 293–1113, only the "Not placed yet" shelf is below 1000. 2560: only the shelf is below 1300. |
| 6 | Ring-only tiers | Fixed | "+ Rose's grandparents" and "+ a child" are now lines in the margin label. The sample's top tier now holds Walter & Edith (146px). |
| 7 | Tall keeping cards | Partly | The review is one ruled line now. The card row under it has a new fault: finding 2. |
| 8 | Voices 1000px from their postmarks at 1366 | Fixed | Three columns at 1366, each with its stamp beside the words. |
| 9 | Prints left half-developed | Fixed | `arrive.ts` develops with GSAP `fromTo` and `clearProps`. Bao's rail prints measure opacity 1, filter none. |
| 10 | Chat transcript with an "AI:" excerpt | Partly | The "AI:" turn is gone. The card still reads "Ending the chat / 'How to end chay'". See the notes. |
| 11 | Two "Where to next" components | Fixed | Family and Person both import `components/book/WhereNext`. |
| 12 | Phone couple broken by a dangling "&" | Fixed | At 390, Frank & Rose & Tom are a column. Rows are pairs, and an odd ring is centred. |
| 13 | 42px fields; empty state with no action | Fixed | The Keepers input is 44px. The storyteller column's empty state ends "Send someone a link →". |
| 14 | Ty's subline "In the family" | Fixed | The hero reads "Ty Ngo & Bao. / Nhi Tran's parent". |

## The builder's two admissions, judged

- **"The 16-person sample does not fit one 1366×768 screen; the storyteller's tier does." Accepted.**
  - At 1366×768 only 476px of window sit under the top of the tree. Four generations and a shelf cannot fit there at a face size anyone can read.
  - The storyteller's node is fully visible (Rose's node runs y 438–618). At 1920×1000 the whole sample fits except the shelf, which is the bar I set in round 2.
  - The admission does not cover the broken middle row at 1366. That is finding 4.
- **"Give N memories a year links to /archive because there is no dating route." Rejected.**
  - The route exists. The Archive's own `DateTask` (`components/archive/ArchiveGroups.tsx`) links to `/write?edit=<first undated id>&details=1`, which opens that memory at its "when" step.
  - The Archive's "Not dated yet" group also has an anchor, `#yundated`, and Archive.tsx scrolls to the hash.
  - See finding 3.

## Bond, judged

- **Person empty states (sleep): pass.**
  - Size: 128×102 at 1366 and 1920, 166×133 at 2560 (zoom 1.3), 104×83 at 390.
  - About four times the 28px headline's height. Sized like a vignette, not a hero.
  - Placement: left of the headline on desktop and above it on the phone. He covers nothing, and the sleeping pose fits "Nothing with Ty in it yet".
  - The image ratio holds (781×622 drawn at 128×102).
- **Family invitations (curious): size and pose pass, placement fails.**
  - At 104px wide (135 at 2560) he is the right size for a margin ornament on a 394–448px card.
  - But he hangs 74% above the card's top edge, into the 24px gap under the "Nothing waiting for your review" line, and covers it. See finding 1.
  - The flat crop across his chest also lands 23px inside the card, so he reads as a sticker on the paper rather than a dog behind the card's edge.

## Findings, worst first

1. **On Family, Bond's head covers the words of the review line.** It reads "What the fa[Bond]ks or sends lands here first."
   - Where: `src/styles/pages/family-people.css` line 291 (`.fp-dog { position: absolute; right: 22px; top: 0; width: 104px; transform: translateY(-74%) }`) and `Family.tsx` `.fp-invites`.
   - Sizes:
     - 1366: Bond at x 311–415, y 1179–1267. The text line is x 44–561, y 1188–1204.
     - 1920: Bond at x 358–462, y 1051–1139. The line is x 61–579, y 1059–1075.
     - 2560: Bond at x 365–500, y 1365–1480. The line is x 82–754, y 1376–1396.
     - 390: his ears touch the first line (Bond's top y 1957, line bottom 1962), and his head breaks the review's bottom rule.
   - Evidence: `…/tool-results/mcp-Claude_Browser-blob-1792295029552-cxvv4b.png` (1366), `…/mcp-Claude_Browser-blob-1792295529821-qczriu.png` (1920), `…/mcp-Claude_Browser-blob-1792295231652-5y2tx0.jpg` (390).
   - Rules: 44 (the companion never covers words), 15a (decoration placed with restraint), 1.
   - Fix: give the card row at least Bond's visible height of clear space above (about 72px, not 24px), or seat him behind the card's top edge with a lower z-index, so the edge hides the chest crop and only head and paws show above it.

2. **The keeping row leaves whole columns of the sheet empty, and its two cards end at different heights.** `.fp-keep-review` spans `1 / -1` inside an `auto-fit` grid, so every track counts as filled and none collapses. Invitations and Keepers then take the first two tracks, and the rest stay blank.
   - Where: `family-people.css` lines 255 and 259 (`.fp-keep`, `.fp-keep-review`).
   - Sizes: 1366, 1920, 2560. At 390 the cards stack, so it is fine.
   - Evidence:
     - 1366: tracks 394 / 394 / 394; the third is empty.
     - 1920: four tracks of 424, of which 848px are empty.
     - 2560: five tracks of 344; three are empty.
     - Card heights are 211 and 287 at 1366, and 212 and 288 at 1920.
     - Screenshot: `…/mcp-Claude_Browser-blob-1792295160563-jxk803.jpg`.
   - Rules: 8 (use the screen), 10 (columns align, no hole in a row), 9.
   - Fix: take the review line out of the grid (a block above it), and set the cards in their own two-column grid that fills the width, with matching heights (`align-items: stretch`). Alternatively, let Invitations take the empty width with the codes as a ruled list.

3. **"Give 4 memories a year · about 2 minutes →" on Bao's page gives the wrong number, the wrong time and the wrong route, and sits beside a second link to the same page.**
   - The number: it counts only the four cards shown. The Archive, for the same story, says "Give eight memories a year · about 2 minutes", and all 8 of Bao's memories are undated.
   - The time: Person allows 30s a memory, `round(n / 2)`; the Archive allows 15s, `round(n × 15 / 60)`. The same task gets two different estimates.
   - The style: the Archive spells the number ("eight"), and Person uses a digit.
   - The route: it goes to `/archive` although `/write?edit=<id>&details=1` exists.
   - The duplicate: "All 8 with Bao, in the archive →" in the same row also goes to `/archive`.
   - Where: `Person.tsx` (`undated`, the `.pp-more` row) and `components/archive/ArchiveGroups.tsx` `DateTask`.
   - Sizes: all.
   - Evidence: `.pp-more a` hrefs are `/archive` and `/archive`. The Archive's `.arc-task` is "Give eight memories a year · about 2 minutes → /write?edit=59632e67…&details=1". Screenshot: `…/mcp-Claude_Browser-blob-1792295302038-ylkrzr.jpg`.
   - Rules: 20 (honest numbers), 35, 34, 19 (the same action twice in one row), 1.
   - Fix: count every undated memory on the person's full rail, not just the shown ones, and render the Archive's `DateTask` itself (same words, same minutes, same `/write?edit=…&details=1` target). If you keep an archive link, point it at `/archive#yundated` as the one secondary link.

4. **At 1366 the sample's generation row does not fit its zones. Arthur Carey drops onto a second line, alone under the "a sister or brother" ring, and the left pair spills into the margin label's column.**
   - Where: `FamilyTree.tsx` `.tp-row` (grid `259px 464px 259px`) and `.tp-zone.left/.right`.
   - Size: 1366. At 1920 and 2560 the row is one line.
   - Evidence:
     - Right zone: 259px wide, holding the ring (122) and Arthur (136) plus the gap, so it wraps. Arthur sits at y 605 while the row is at y 456.
     - Left zone: starts at x 244, but Margaret Doyle's node starts at x 213, which is inside the label column (it ends at x 228).
     - The tier is 333px tall instead of about 180.
     - Screenshot: `…/mcp-Claude_Browser-blob-1792295046264-kkc2p0.jpg`.
   - Rules: 10 (a lone face on a row), 9.
   - Fix: let the side zones take the width their content needs (for example `minmax(min-content, 1fr) auto minmax(min-content, 1fr)`), and in `draw()` step the faces down one size when any zone's content is wider than the zone, before letting it wrap.

5. **A Person page with no memories leaves most of a large screen as bare paper.** This is the common case: 4 of the 5 people in the founder's family have no memories.
   - Where: `Person.tsx` `.pp-none`, `.pp-main` (not `three`, so the story column takes the whole width).
   - Sizes:
     - 2560: measured. The main column is 1839px wide; the empty state's text is 517px and Kin one 44px row, so about 70% of the column is blank (`…/mcp-Claude_Browser-blob-1792295423639-ouclez.jpg`).
     - 1920: the same layout class, so the same fault; not measured.
     - 1366 is acceptable.
   - Rules: 8, DESIGN.md "a screen that is mostly empty ground is an underbuilt section".
   - Fix: when the rail is empty, set the empty state and "Ty's family" side by side as two halves of one row.

6. **On Claire's page, "What Claire has told the family" is a heading over one card that only repeats the title the plate above has just named.** The plate reads "Claire, in 'The waltz'", and the section's only content is "The waltz · 1990 · Family".
   - Where: `Person.tsx` `.pp-group.theirs` when `theirsShown` holds only the `quoted` memory.
   - Sizes: all.
   - Evidence: page text at 390. Screenshot: `…/mcp-Claude_Browser-blob-1792295493151-c8fnui.jpg`.
   - Rules: 19, 10.
   - Fix: when a group's only memory is the one the plate quotes, leave that group out. The plate's caption already links to it.

## Notes, not counted against this round

- **"Ending the chat / 'How to end chay'"** is still on Bao's rail.
  - It is now his own words, which meets round-2 item 10 to the letter, but it is not a memory.
  - It is real data, so this is for the founder: delete it, or the rail could skip memories with fewer than about six words of the person's own.
- **Bond's art** is a glossy, airbrushed digital painting, not the "soft hand-drawn coloured pencil and light watercolour" that rule 21 and `docs/mascot/BOND.md` ask for.
  - `sleep-paper.webp` is byte-identical to `sleep.webp`, so there is no separate paper version.
  - Both are the founder's art to regenerate, not builder defects.
- **A Vite error overlay** appeared once at 23:42, for a parse error in `components/delight/Companion.tsx` (`shown` declared twice). It cleared within a minute. That was another agent's edit in progress, not this builder's.
- **Rule 1 sweep for Bond covering text elsewhere** (`.ol-dog`, `.w-dog`, `.bk-empty-dog` are positioned the same way): I read the code only and did not look at those pages.

## How I checked

- My own pane tab (tab-65), closed afterwards with its viewport reset.
- Sizes: 1366×768, 1920×1000, 2560×1300 (html zoom 1.3, confirmed) and 390×844.
- Pages:
  - `/family` and `/family?preview=tree`.
  - Person: Bao (storyteller, 8 undated memories), Ty Ngo (invited, no memories), `sample-rose` and `sample-claire`.
  - `/archive`, to compare the dating task.
- Measurements: getBoundingClientRect, scrollWidth against clientWidth, computed grid tracks, Range rects for text lines, and image natural sizes.
- The `__gsap` and `__st` hooks were not exposed on these pages this session, so instead of stepping I waited 5–7s after each load and scroll. Every rise and every rail card finished on its own.
- At every size and page:
  - No horizontal scroll.
  - No text under 12px.
  - Uppercase only in the running head and folio (12px).
  - No element past the right edge.
  - Every link, button and input at 390 is 44px or taller.
- Nothing was clicked and nothing was written.

**Not verified:**

- Hover captions, focus-visible rings and the pointer thread (the pane was hidden).
- Reduced motion.
- The live loading sketch.
- Error states.
- A 3840 zoom-2 pass (not run this round).
- The invite, place, merge, take-back and send flows (out of bounds).

## Score (taste floor)

Philosophy 4, hierarchy 4, execution 3, specificity 4, restraint 4, variety 4. No dimension is under 3. The page fails on findings 1–4, which break rules 8, 10, 19, 20, 34, 35 and 44 at the sizes listed.
