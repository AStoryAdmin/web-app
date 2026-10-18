# Bao's Standard: Family (/family) and Person (/family/:personId), round 5

**FAIL**

All eight round-4 findings are fixed or mostly fixed. The empty Person page is now a real composition: the sleeping Bond, one headline on one line, a two-line paragraph, the one action, and three ruled questions. At 1366 and 1920 it stands beside the portrait card. The words plate now sets the kept line in display type (Cormorant italic, 31px) inside a frame that fits it.

The page still fails, for two reasons:

- **The three questions are not real links to their questions.** All three, and "Write a memory with Ty →", point to the same URL, `/write?with=<id>`. Choosing "What does Ty always have in the fridge?" opens a blank writer, and the question is lost.
- **At 1280–1599px, the empty Person page drops the gap between sections.** "Ty's family" sits 8px under the last question's rule, while the gaps inside the empty state are 22px.

Six smaller faults also fail:

- The plate now leaves half its row bare.
- The question arrows sit up to 730px from their words.
- On the phone the dating row runs past the column.
- The leaf ornament sits inside the closing quote mark.
- A "·" dangles at the end of a line in three places.
- Two of the questions do not fit the person they are about.

## Round 4, item by item

| # | Round-4 finding | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | The empty Person page is bare paper on a large screen, and is squeezed at 1366 | Fixed at 1366 and 1920, with a small remainder at 2560 | **1366:** `.pp-main.bare` is now one column. The empty state's text runs 600–1275, the headline is one line (28px) and the paragraph is two lines in a 397px measure. "Ty's family" follows below it. **1920:** the empty state takes the 920px track, and both headlines start at y 319 (`.pp-none` padding-top is 0). Beside the portrait card, the bare band is now 238px tall (it was 453). **2560:** the headlines are level at y 414. The main column ends at 849 and the card at 1158, leaving 309px. On Mark Keller's sample page (four relatives) the same composition fills the window at 2560 with no bare band, so I accept the remainder. New faults in this block are findings 1, 2, 4 and 8. |
| 2 | The words plate sets body text inside a wide frame | Fixed inside the plate; a new placement fault | The line is Cormorant Garamond italic at 31px (25px on the phone, 26px for `.long`), at most 30ch, 3 lines. The plate fits its words: at 1920 on Bao's page the plate is 465–946 and the words 500–893. The plate now sits alone at the left of its row; see finding 3. |
| 3 | The dating row puts the task second and wraps it on the phone | Fixed on desktop, with a new phone fault | `.pp2 .pp-more .arc-task { order: -1 }`. The task leads the row and is one line at every size (at 1920: task 499–841, then the archive link 859–1093). At 390 it is one line too, but it now runs past the column; see finding 5. |
| 4 | At 2560 the sample's grandchildren fall below the fold | Fixed | **2560:** the tiers are 187, 271, 233 and 210px tall, plus a 181px shelf. Maya, Leo and Sam end at y 1276 in a 1300px window. **1920:** Maya ends at 967 in a 1000px window. |
| 5 | Two hairlines run 40px apart above the review line | Fixed | `.review-none` has a top border of 0 at all four sizes. The star rule opens the section and one rule closes the line (true size at 1366: `…/mcp-Claude_Browser-blob-1792298578275-h3ozro.jpg`). |
| 6 | The phone hero breaks "Born / 1972" | Fixed, with a new dangling "·" | Per-character line tops on Claire's page at 390: line 1 is "A sample family · Rose's niece ·", line 2 is "Born 1972". The year is now joined to "Born", but the dot is left at the end of line 1; see finding 7. |
| 7 | The running head reads "The Vo book" over the sample | Fixed | It reads "A sample family" on `/family?preview=tree`, `sample-rose`, `sample-claire` and `sample-mark`, at 1366, 1920, 2560 and 390. |
| 8 | Arrow links are underlined in two pieces | Fixed | The arrow span is inline, so the link's gilt underline runs under the words and the arrow as one line. Checked at true size at 1366: `…/mcp-Claude_Browser-blob-1792298650562-6bskhw.jpg`. |

## Bond, judged at true size

- **Family, behind the Invitations plate: pass.**
  - Box (x, y, width, height): 1366: 509, 1277, 112×94. 1920: 795, 1012. 2560: 1069, 1314, 146×122 (zoomed px). 390: 256, 1921, 96×80.
  - A Range-rect sweep of every text node found no overlap with Bond at any size.
- **Person empty state, sleeping: pass.**
  - Size: 128×102 to the left of the headline on desktop (166×133 zoomed at 2560), and 104×83 above it on the phone.
  - He covers nothing, and the pose suits "Nothing with Ty in it yet."

## Findings, worst first

1. **The three questions under an empty Person page do not carry their question.** Each opens the same blank writer as the action above them, so the list makes a promise it does not keep, and the page has four links to one URL.
   - Where: `Person.tsx`, the `.pp-prompts` links: ``to={preview ? "#" : `/write?with=${encodeURIComponent(person.id)}`}``. The writer resolves a question only from `?q=` against `todaysDeck(story)` (`Write.tsx` around line 505), and the "about" prompt ids are never passed.
   - Sizes: all.
   - Evidence: on Ty's page every href is `/write?with=36cfd520-c499-4771-b0e2-ffc64cabefb1`, including "Write a memory with Ty →". As briefed, I did not follow the links.
   - Rules: 19 (the same action repeated), 20 (honest copy: a link that names a question must open it), 41 (one action).
   - Fix: pass the prompt's id (for example `&about=<promptId>`), and have the writer open with that question on the cloth and the person named.
   - Note: `Write.tsx` was being edited during my review (saved at 00:53). For a few seconds the dev server showed a parse error, "Identifier `asked` has already been declared", at lines 511 and 541 (`…/mcp-Claude_Browser-blob-1792299222476-ql2cmt.jpg`). That may be this fix in progress. `Person.tsx` has not changed since 00:32.

2. **Between 1280px and 1599px, the empty Person page loses the gap between the empty state and "{Name}'s family".**
   - Where: `family-people.css`. Line 517–518 (inside `@media (min-width: 1280px)`) sets `.pp-main.bare .pp-extras > :first-child { margin-top: 0 }` for a grid. Line 559 then sets `.pp-main.bare { display: block }` at the same width, so the grid is gone but the zero margin stays.
   - Size: 1366. The same applies to any width from 1280 to 1599.
   - Evidence:
     - Mark Keller: the last question's rule is at y 644.4 and the "Mark's family" box starts at 652.4, an 8px gap.
     - Ty: the same, 646 against 654.
     - Inside the empty state, the gap from the action to the list is 22px.
     - The phone (60px gap) and 1600px and up (grid, 64px gutter) are correct.
     - Screenshot: `…/mcp-Claude_Browser-blob-1792299146231-08fu6o.jpg`.
   - Rules: DESIGN.md ("the gap between sections is clearly larger than any gap inside one"), 10.
   - Fix: move the line 518–519 overrides into the `min-width: 1600px` block, so the stacked layout keeps the `.pp-extras` top margin.

3. **The words plate now fits its words but sits alone at the left of a wide row, leaving half the row bare.**
   - Where: `.pp-words-plate { width: fit-content; min-width: min(100%, 440px) }` (`family-people.css` line 538) in `.pp-story`.
   - Sizes, as plate span within the column (blank width to its right):
     - 1366: 448–928 in 448–1275 (347px, 42%).
     - 1920: 465–946 in 465–1385 (439px, 48%).
     - 2560: 607–1231 in 607–1869 (638px, 51%).
     - The phone is fine.
   - Pages: Bao, `sample-rose` and `sample-claire`.
   - Evidence: `…/mcp-Claude_Browser-blob-1792298831977-agfk1s.jpg` (2560, Bao) and `…/mcp-Claude_Browser-blob-1792298901775-kz5sar.jpg` (2560, Claire). True size at 1920: `…/mcp-Claude_Browser-blob-1792298733175-dqmd4r.jpg`.
   - Rules: 10 (no single card alone in a row), 8.
   - Fix: centre the plate in the story column as an epigraph (`margin-inline: auto`), and at 1600px and up raise the line to about 36px so the plate grows with the column.

4. **The question rows span the whole story column, so each arrow sits far from its words. At large sizes the questions look like plain text.**
   - Where: `.pp-prompts a { justify-content: space-between }`, with the list as wide as `.pp-none > div`.
   - Sizes, as the gap from the end of each question to its arrow:
     - 1366: 270–380px.
     - 1920: 383–479px (questions end at 985, 889 and 855; arrow at 1368).
     - 2560: 564–733px (arrow at 1847).
   - Evidence: at true size at 2560 the arrows do not appear in the same 800-device-px view as the questions (`…/mcp-Claude_Browser-blob-1792298813140-4kh0gu.jpg`). There is no underline or colour on the questions themselves.
   - Rules: 16 (small print is one hairline and one arrow, read together), 17a (a measured column).
   - Fix: cap `.pp-prompts` at the paragraph's measure (`max-width: 46ch`, about 560–620px), so the arrow closes each row within reach of its words.

5. **On the phone, the dating task runs 9px past the text column, its arrow 2px from the sheet's foil frame, and it starts 10px left of the archive link below it.**
   - Where: `family-people.css` line 532, `.pp2 .pp-more .arc-task { white-space: nowrap; margin-left: -10px; margin-right: -10px }`.
   - Size: 390.
   - Evidence: the column is 24–370. The task is 58–379, and its text starts at x 58. "The undated ones, in the archive →" starts at 68. Screenshot: `…/mcp-Claude_Browser-blob-1792299034644-rrq9uw.jpg`.
   - Rules: 10 (columns align), the section-6 checklist (nothing clipped or past the edge).
   - Fix: drop the negative margins at the phone breakpoint, and let "about 2 minutes →" drop to its own line as a unit if the row cannot fit.

6. **On every words plate, the leaf ornament sits inside the quotation: "…opportunity. 🍂" then the closing quote mark.**
   - Where: `Person.tsx` puts `<Leaf />` inside the `p`, and `.pp-words-plate p::after { content: "\201D" }` puts the closing mark after it.
   - Sizes: all.
   - Pages: Bao, Rose and Claire.
   - Evidence: `…/mcp-Claude_Browser-blob-1792298733175-dqmd4r.jpg`.
   - Rule: 15a (ornament placed with restraint, after the words, never inside the quote).
   - Fix: move the Leaf after the closing mark (outside the `p`, or render the marks in markup).

7. **A "·" dangles at the end of a line in three places.**
   - Where:
     - Person hero subline at 390: "A sample family · Rose's niece ·" / "Born 1972". Mark's page is the same: "… Rose's son-in-law ·".
     - Family hero at 390: "Your story · Two generations, so far ·" / "5 people".
     - Every invited node in the tree, at all sizes: "invited ·" / "waiting for them" (Ty Ngo on `/family`, Margaret Doyle and Anne Keller on the sample). The `span.nw` "invited ·" is 65px in a 156px label.
   - Evidence: per-character line tops, and `…/mcp-Claude_Browser-blob-1792299063507-x8i38c.jpg` and `…/mcp-Claude_Browser-blob-1792299083496-w843h3.jpg`.
   - Rules: 10 (no orphans), and rule 1 (round 4 asked for this on the dating row).
   - Fix:
     - On the phone, set the hero subline's segments on separate lines without separators, or bind each "·" to the segment after it with a no-break space.
     - Give the tree's state line the full slot width, so "invited · waiting for them" stays on one line.

8. **Two of the questions do not fit the person.**
   - "What did Ty's family believe in when they were young?" is about Ty's family, not Ty, and its "they" is ambiguous.
   - "What old prices does Maya still remember?" is asked about someone born in 1998.
   - Where: `personRail.ts` `promptsAbout` picks by a seed from the depth-1, non-sensitive pool (44 prompts) and ignores the person's birth year. None of the pool is held, gone-only or ask-them, which I checked against `questionVoice.js`.
   - Sizes: all.
   - Rules: 46 (the question knows the moment), 41 (a real action).
   - Fix: skip era-bound prompts ("old prices", "when they were young") for people born after about 1975, and skip prompts whose subject is not the person themself.

## Notes, not counted against this round

- **"Ending the chat / 'How to end chay'"** is the founder's known test memory. It still carries the "latest" ribbon on Bao's rail.
- **Bond's painterly style** is the founder's ruling. I judged only placement.
- **Prints blank on the first capture.** On Bao's and Rose's pages, the first pane capture after each load showed the rail's prints as empty cream squares. Seconds later the same images showed, and every image measured `complete`, with natural width 1122/1200, opacity 1 and filter none. This looks like background-tab paint deferral, not the app.
- **Preview inconsistency (dev only).** On an empty sample page, "Write a memory with Mark →" is live (`/write?with=sample-mark`), while the three questions are inert (`#`).
- **The Family storyteller plate** quotes the kept line at about 17px in its right half (`.st-said`). It fills its half, so this is not the round-4 fault, but rule 32 would prefer it larger.

## How I checked

- My own pane tab (tab-96). At the end I reset its viewport to desktop and closed it.
- Sizes: 1366×768, 1920×1000, 2560×1300 (html zoom 1.3, confirmed) and 390×844.
- Pages:
  - `/family` and `/family?preview=tree`.
  - Person, real family: Bao (storyteller, 8 memories), Ty Ngo (invited, no memories), GBao Vo (no memories), Nhi Tran and Nhi.
  - Person, sample family: `sample-rose`, `sample-claire`, `sample-mark` (no memories), and `sample-nora`, `sample-maya`, `sample-leo`, `sample-sam` and `sample-daniel` (questions and plate only).
- Measurements:
  - getBoundingClientRect and Range rects for text extents and line counts, plus per-character line tops.
  - Computed grid tracks, display, margins, order, decoration and colour.
  - scrollWidth against clientWidth, and image state.
  - True-size views made with a temporary transform on `#root`, removed afterwards.
- The `__gsap` and `__st` hooks were not exposed, so I waited 4–6 seconds after each load.
- At every size and page:
  - No horizontal scroll (the `.lamp` decoration extends past the edge but is clipped).
  - No text under 12px.
  - Uppercase only in the running head and folio (12px).
  - Every link, button and input at 390 is 44px or taller.
- Nothing was clicked: I moved between pages by URL and history only, and nothing was written. I did not touch `astory-app-auth`.

**Not verified:**

- Hover, focus-visible and active states on the questions (the CSS defines them).
- Reduced motion.
- The pointer thread.
- Error and loading states.
- A 3840 zoom-2 pass.
- What the writer actually shows from a question link. I judged that from the hrefs and `Write.tsx`, without opening `/write`, as briefed.
- The invite, place, merge, take-back and send flows (out of bounds).

## Score (taste floor)

Philosophy 4, hierarchy 4, execution 3, specificity 4, restraint 4, variety 4. No dimension is under 3.

The page fails on two findings:

- Finding 1 breaks rules 19, 20 and 41 at all sizes.
- Finding 2 breaks the section-gap rule from 1280 to 1599px.

Findings 3–8 must also be fixed before a pass.
