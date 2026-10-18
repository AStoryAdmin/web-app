# Writer, round 4: Bao's Standard

**FAIL.** 8 findings, ranked worst first. All 9 round-3 items hold. Two of the round-3 fixes left new faults: the 44px fix put an arrow on a line of its own, and the 641px fix squeezed the left page. The worst new fault is Bond himself. Asleep he is lovely. Once he covers his eyes, his arms end in a straight cut drawn on top of the board.

I checked in my own browser-pane tab at 1366×768, 1366×641, 1920×1000, 2560×1300 (html zoom 1.3), 390×844 (touch, pointer: coarse), 375×812 and 320×700. Pages: `/write`, `/write?q=faith-pray-now`, focus mode, `/write?edit=59632e67…` (step 1, editing), and Afterwards via `/write?edit=59632e67…&details=1` and `/write?edit=beeedb62…&details=1`. I stepped GSAP by hand and measured with getBoundingClientRect, computed styles and scrollWidth. I read Write.tsx, writer.css, stamp.ts, docs/mascot/BOND.md and the dog files. To see Bond at true pixel size, I made 4× composites of `sleep-paper.webp` and `cover-paper.webp` at the writer's real box sizes and offsets. I checked the awake pose in the page by setting `data-awake` on `.w-dog`, and once for real by typing.

Note: when I started, Vite was showing a parse error in `Companion.tsx` (`shown` declared twice), so the app was blank. Someone saved a fix at 23:42:54, and after a reload everything I measured came from the fixed build.

## Round-3 items, re-checked

| Round-3 item | Now |
|---|---|
| 1. Clearing the page keeps the draft | Fixed. I typed a line on `/write`, and the key `astory-draft-<story>` appeared with "Draft kept in this browser". After Ctrl+A and Delete, the key is gone and the folio reads "Nothing written yet". Opening `/write?edit=59632e67…` writes no draft. |
| 2. Phone: failed Keep in a 120px column | Fixed. With the real error markup inserted at 390, the error sits on row 2 under the seal (x33, y1091, 265×89). "Try again" is 44px tall. The seal stays at y1029. |
| 3. Editing page says things twice | Fixed. Kicker "EDITING", heading "Change what you like.", title only on the page, recto "KEPT AUGUST 18". Small copy slip in finding 8. |
| 4. 1366×641: nothing under the book in view | Fixed. The book is at 126–519 and the bar at 531–621, so the seal (540) and "Speak instead" (552–600) are in the first screen. **The left page got too tight** (finding 3). |
| 5. Phone: stamp lands on "Not now" | Fixed in code. `.w-keep-note.spent { visibility: hidden }` once pressed. Not pressed, by instruction. |
| 6. Question links 41px | Fixed. All three are 44px at 1366×768 and 1366×641, and 49px at 1920. **The fix put the "→" of "Or something else" on its own line** (finding 2). |
| 7. "2020s" alone on a row | Fixed. The When rows are 4/4/2 at 1366, 2560 and 390, with the date field beside 2020s. |
| 8. "Kept in The Vo book." | Fixed. "Kept in the Vo book.", with the name held together. On a phone it breaks as "Kept in / the Vo book." |
| 9. Straight apostrophe; "radio." alone | Fixed. "if you’re willing" is curly. `.w-sub` has `text-wrap: pretty`, so the 390 sub ends "…a song on / the radio." |
| Elsewhere: GSAP built-in easings | Fixed. No `power3` remains in `src`. |
| Elsewhere: "Press ? for shortcuts" | Fixed site-wide. `Shell.tsx` has it, and it skips `/write` on purpose (see notes). |

## Bond on the writer: the verdict

- **Size.** The box is 104 CSS px on two pages (98×78 drawn), 84px at 1366×641, and 104px on a phone. That is about 9% of the book's width on desktop: a small charm, which suits the bench. At 2560 it is 135 device px. On a phone it is 28–38% of the book, prominent but charming. The size holds.
- **Placement.** Bond sits at the right of the board (`right: 56px`), chin on the edge. His bottom is 13px into the board on desktop and 10px on a phone. He never covers a word or the Focus button: his paws end at y155, and the page starts at y160 at 1366.
- **The sleep pose reads well at every size.** You can see the closed eyes, the black nose and the paws hanging over the edge. The file has no light halo on the #F3EBDD sheet: in sampling, 0 opaque pixels were near-white. The painterly fur matches the rest of the Bond set.
- **The cover pose does not work** (finding 1).

## Findings

1. **Once writing starts, Bond's arms end in a straight horizontal cut, drawn on top of the board.** `cover-paper.webp` is cropped flat at the ledge: its last row is opaque across 631 of its 738px. `.w-dog` has `z-index: 3`, above the board and the pages, and it reaches 13px into the board (10px on a phone). So the cut is in plain view. At 1366 it is a 77px straight edge on the chocolate cloth, 5px above the gilt edge of the page. On a phone it runs 4px into the ivory page. He looks like a cut-out sticker pasted onto the book, not a dog behind it hiding his eyes. The same pose shows from the first second on every editing page, because the body is not empty there.
   - Where: `Write.tsx` `Dog`, and `writer.css` `.w-dog` (line 99) with the phone override (line 453).
   - Sizes: all. The cut is 77px wide at 1366 and 1920, 63px at 1366×641, and 77px at 390.
   - Evidence: `docs/agents/reviews/shots/writer-r4-dog-1366-sleep-cover-4x.png` and `writer-r4-dog-390-sleep-cover-4x.png` (true-size composites at 4×), `writer-r4-390-cover-pose.jpg` (in the page), `writer-r4-1366-edit.jpg` (the editing page). Alpha of the last row, measured: cover-paper 631/738 opaque, sleep-paper 0/781.
   - Rules: 21 and 15a (real assets, placed with restraint and craft), 27 (delight, earned), and the checklist's "could sit beside Kiyo or Shiori".
   - Fix: hide the cut behind the board's top edge. Clip the awake image at the board line, for example `.w-dog .awake { clip-path: inset(0 0 13px 0) }` (10px on a phone), so his arms go behind the book. Or put the dog under the board and draw the board's top strip over him.

2. **"Or something else, in your own words" puts its arrow on a line of its own.** Round 3's fix made `.w-q` `display: flex; flex-direction: column`. Now the `::after` " →" of `.w-q.own` is a separate flex item, stacked under the text. The row grows to 59px, while the others are 44.
   - Where: `writer.css` `.w-q` (line 195) with `.w-q.own::after`. It shows on `/write?q=…` and `/write?edit=…`.
   - Sizes: all. 59px tall at 1366, and 67px at 375 and 390.
   - Evidence: the text's own client rect is a single line, 268×17 at y477. The anchor is 59px tall, and the arrow shows under "Or" in `writer-r4-1366-edit.jpg`.
   - Rule: 10 (no lone icon on a row).
   - Fix: give `.w-q.own` `flex-direction: row; align-items: center; gap: 6px` (or `display: block`, keeping `min-height: 44px`), so the arrow stays on the line.

3. **On a laptop's height the left page runs its sections together.** At 1366×768 the sub ends at y365, and "Or one of today’s questions" starts at 375, a 10px gap. At 1366×641 the heading ends at 299 and the next heading starts at 305, a 6px gap. The gap between that heading and its own list is also 6px, so a new section looks like the next line of the question.
   - Where: `writer.css` `.leaf-left { gap: 10px }`, and the `(max-height: 740px)` block's `gap: 6px`.
   - Sizes: 1366×768 and 1366×641. At 1920 it holds, because the ornament is still there.
   - Evidence: tops and bottoms of `.w-qhead` / `.w-qs` / `.w-kick` / `ul`: 299 → 305, then 330 → 336 (641); 365 → 375, then 400 → 406 (768).
   - Rule: DESIGN.md's craft rules ("the gap between sections is clearly larger than any gap inside one"), and 32 (the hierarchy is read at a glance).
   - Fix: give `.spread .leaf-left .w-qs` its own `margin-top` of about 18px, even in the short step. Take the room back from the left page's padding-bottom and the gap above the kicker, which the short step already squeezes.

4. **On a laptop the ribbon shows as a 12–16px red stub.** The ribbon's tail is 74px long, but `.w-keep` (z-index 2, opaque paper) starts 16px under the book and covers the rest. Only the rail layout (1560px and up) shows the notched tail.
   - Where: `writer.css` `.w-ribbon` and `.spread .w-keep { margin-top: 16px }` (12px in the short step).
   - Sizes: 1366×768 (16px visible: ribbon 618–692, bar from 646) and 1366×641 (12px visible). Fine at 1920 and 2560.
   - Evidence: the measured ribbon and bar rects above.
   - Rule: 15a (each decoration earned and placed with restraint; a cut-off tail is neither).
   - Fix: where the bar sits under the book, shorten the ribbon so its notched tail ends just above the bar (about 26px), or let the tail hang to the left of the bar's rounded corner.

5. **Bond's change of pose is a 520ms crossfade between two different silhouettes, so for a moment there are two dogs.** The sleeping dog is wide and low. The covering dog is narrow and tall, 8px narrower and centred. Mid-fade, both show at about 50%, a ghosted double exposure (seen in a screenshot taken mid-fade).
   - Where: `writer.css` `.w-dog img { transition: opacity 520ms }`. `OpenLeaf` (`.ol-dog`) does the same.
   - Sizes: all (motion).
   - Rule: 23, and the craft rules' motion section (feedback under 300ms; nothing appears from nothing).
   - Fix: let the sleep image go in about 120ms, and bring the cover in over about 200ms from `scale(0.96)` with the strong ease-out. Or run the two fades one after the other rather than together.

6. **On a laptop, the three help buttons are grey with no word of why.** On an empty page, "Tidy my words", "Suggest a title" and "What am I not saying?" are disabled. The line that explains it ("Write a line and these can help.") is hidden in the bar layout by `.w-tools-row .w-help-off { display: none }`. The buttons carry no `title` either.
   - Where: the `writer.css` tools-row rules, and `Write.tsx` `tools`.
   - Sizes: 1280–1559 wide (1366×768 and 1366×641). The rail at 1920 and 2560 shows the line, and the phone shows it under the list.
   - Rule: checklist (the disabled state is designed and understood).
   - Fix: give each disabled tool `title="Write a line first"`. Or, while the page is empty, show the line in the bar in place of the three greyed buttons.

7. **At 375 and 320 the two ways to begin stack, one alone on each row.** "It was the year…" (132px) and "We were living in…" (154px) need 294px with the gap. The page gives 289px at 375 and 234px at 320, so each pill sits alone, left-aligned, with empty paper to its right.
   - Where: `writer.css` `.w-begin-inpage` in the phone block.
   - Sizes: 375 and 320. One row at 390.
   - Evidence: both buttons at x44, y493 and y545 (375), and y515 and y567 (320).
   - Rule: 10.
   - Fix: under about 380px, show one starter. Or trim the pills to `padding: 0 12px; font-size: 16px`, which fits both on one row at 375.

8. **Small print, copy and housekeeping.**
   - The editing page lists "Or another of today’s questions" when no question is on the page. It should read "Or one of today’s questions" (rule 20). Where: `Write.tsx` `context`, `question || editing ? "Or another…"`.
   - The dog `<img>` tags still carry the old drawing's sizes: `width={762} height={640}` and `width={849} height={640}`. The files are 781×622 (sleep-paper) and 738×640 (cover-paper), and `.w-dog` keeps `aspect-ratio: 849 / 640`. Step 4 of BOND.md ("update widths in every `<img>` that names a dog file") was not done. There is no visible harm today, because of `object-fit: contain`, but the box is wider than either drawing, so `right: 56px` does not place him where it says (rule 25).
   - `sleep-paper.webp` is byte-identical to `sleep.webp` (same md5), so it is not a "-paper" variant. There is no halo, so nothing to fix on the sheet. Rename it or drop it so the asset list tells the truth.

## Same fault elsewhere (rule 1, outside the writer's files; from the code, not seen)

- **The flat-cut awake pose:** `OpenLeaf.tsx` (`.ol-dog`, Home and the Archive) wakes into `curious-paper.webp`. Its last row is opaque across 541 of its 755px. It sits at `z-index: 2` with its bottom 12px into the page, so the same straight cut is likely drawn over the open leaf. `curious-paper` is also placed loose on the sheet in `MemoryPage.tsx` (`.mv-missing-dog`), `Wall.tsx` and `Placeholder.tsx` (`.wall-none-dog`) and `Family.tsx` (`.fp-dog`). Each needs an edge drawn over the cut, or the ledge version of the drawing.
- **Old intrinsic sizes:** every `sleep-paper` and `curious-paper` `<img>` in `OpenLeaf.tsx`, `Book.tsx`, `Wall.tsx` and `Placeholder.tsx` says 762×640. `.ol-dog` keeps `aspect-ratio: 762 / 640`.
- **The 520ms crossfade:** also in `.ol-dog img`.

## Notes

- "Press ? for shortcuts" is left off `/write` on purpose (`Shell.tsx` line 268). On step 1 that is right: the page teaches its own keys (Ctrl+Enter, Esc). Afterwards has no writing field, so it could carry the line. That is a judgement for the builder, not a finding.
- The phone failed-Keep message spans only the seal's column (265px), because `grid-column: 1 / -1` on an implicit grid covers one track. It reads correctly under the seal, so this is not a finding.
- At 390 the chapter chips wrap ragged (2/2/1/1/1/2/2) because the names are long. That reads as a tag list, not as an orphan.

## Not verified

- Pressing Keep, the seal and the stamp: not pressed, by instruction. I checked the phone stamp fix in the code only.
- Bond's real fade timing: the pane draws no frames while it is hidden, so I saw the crossfade frozen at 48/52%. I read the timing from the CSS.
- Reduced motion: read in the code (`transition: none` on `.w-dog img`). The pane cannot emulate it.
- Speak, Tidy, Suggest a title, "What am I not saying?" and the photo upload states.
- Hover and focus-visible: read in writer.css, not seen. Pane screenshots at large sizes are too scaled to judge detail, which is why Bond was judged from true-size composites.
- The other pages that use Bond (see rule 1): from the code and the file alpha only.

## Housekeeping

- On `/write` (own words) I typed one line, then cleared it. The page removed the draft itself (`astory-draft-f6a9b0de-…83e3`), and no other key remained.
- Opening `/write?edit=59632e67…` created no draft.
- The draft for beeedb62 was 370 characters before and after. I opened only its Afterwards view, which writes nothing.
- No daily-question counter exists in localStorage, so opening `/write?q=…` counted nothing.
- I pressed Focus and Escape, set `data-awake` and a temporary transform on `.w-dog` in my own tab (then removed both), and inserted and removed a stand-in error paragraph. Nothing else that acts.
- I did not sign out or touch auth.
- I reset my tab's viewport and closed it.
