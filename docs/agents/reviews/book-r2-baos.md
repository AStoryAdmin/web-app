# Book, Plans, Account, Talk, Start and the Wall, round 2: Bao's Standard

**FAIL.** 17 findings, ranked worst first. The pages are close. Every page has its own composition, the Book reader fits one screen at every size, the not-shared wall is done properly, and there is no horizontal scroll anywhere. What fails: the wall's ragged columns, a cascade bug that sets every section heading on these pages to the wrong size, Plans below the fold on a laptop, and the same words printed twice on the wall.

**How I checked.** I used my own browser-pane tab at 1366×768, 1920×1000, 2560×1300 (html zoom 1.3) and 390×844 (touch emulation, pointer: coarse). Pages: `/book` (closed cover, the endpapers spread, the Childhood opener, the Editions list, the end of the page), `/plans`, `/account`, `/talk`, `/start?another=1` (step 1, then step 2 for "Someone in my family"), `/start?join=1`, `/p/RNm1vTr2Gyqu` and `/p/zz-not-a-real-slug`. Routes are from `src/App.tsx`. I stepped GSAP where `__gsap` was exposed and measured with getBoundingClientRect, scrollWidth/scrollHeight, computed styles and the stylesheet cascade. I also measured the samples page (astoryapp.com/samples) at 1366×768. I read Book.tsx, BookSpread.tsx, Plans.tsx, Talk.tsx, Start.tsx, Wall.tsx, lib/tilt.ts, the relevant parts of Account.tsx and book-account.css, and the marketing site's pricing.ts plus phone-app/docs/deploy-2026-10.md (for the Free plan's one call).

## Round-1 report

There is no round-1 report for these pages in `web-app/docs/agents/reviews/`. The folder holds only `signed-out-r1-*` and `writer-r2-*`, and a search of the whole project found no `book-r1-*`. So I could not re-check round-1 items one by one. This is a full fresh pass, and it also judges each item the builder admitted.

## The builder's admissions, judged

| Admitted | Verdict |
|---|---|
| Plans at 1366×768 ends at y=911, with the book row and Choose below the fold | **A defect** (finding 3). Measured: the table ends at 909, the book row runs 676–820 and the Choose row 819–908. Most of the cause is finding 2. |
| Book spread at 1366×768 is 752×376, against the samples' 868×434 | **A defect, but a moderate one** (finding 5). Fitting the whole reader in one screen is right (rule 11). The size is lost to 141px of controls stacked in three rows under the book, not to the window. |
| The wall at 1920 has an uneven last column | **A defect, and it is not only at 1920** (finding 1). The columns are ragged at 1366, 1920 and 2560, and their tops are 10–12px out at 1920 and 2560. |
| Book empty state not seen | I could not see it either: the founder's only stories have memories, and switching story is off limits. I judged it from the code (finding 13). |
| Pointer tilt not seen | **It works.** At 1920 a synthetic pointermove up and to the right of the closed cover turned it from `matrix(1,0,0,1,0,0)` to a matrix3d of about 2.2° in Y and 2.0° in X, toward the pointer. The lean is computed from the viewport (dx / innerWidth), so it holds under html zoom. It uses a non-house ease (finding 15). |
| Wall photographs need signed URLs for anonymous visitors | A backend item, not judged. As the signed-in founder, all four prints loaded (naturalWidth 1122 and 1200). |

## Findings

1. **The wall's leaves are a CSS-columns masonry, so the columns end raggedly and their tops don't line up.**
   - Where: `.wall-chapter:not(.one) .wall-leaves` (`display: block; column-count: 3`, or 2 at 1366), in book-account.css. Wall.tsx `Leaf`.
   - Sizes: 1366, 1920 and 2560.
   - Evidence, "More stories" (7 leaves):
     - 1366: column 1 ends at y=2744. Column 2 holds 4 leaves and ends at 2998, so its last leaf (2767–2998) sits alone below the end of column 1.
     - 1920: the bottoms are at 2239, 2321 and 1803, so column 3 ends 518px short. The tops are at 870, 860 and 870.
     - 2560: the bottoms are at 2924, 3031 and 2321, so column 3 ends 710px short. The tops are at 1147, 1135 and 1147.
     - The reading order also runs down each column, so a reader going across a row reads the memories out of order.
   - Rules: 10 (no orphans; columns align and tops line up), checklist "aligned columns".
   - Fix: use a row-major grid with aligned tops, where a photograph leaf spans two rows and a words-only leaf one (`grid-auto-flow: row dense`). If the count leaves a gap, close the chapter with a full-width leaf. Remove the top margin that offsets column 2.

2. **Every page-specific heading size in book-account.css loses to a rule in astory.css, so the section headings on these pages render at 34px whatever the page asks for.**
   - Where: `astory.css:2873` `.sheet-page .page h2:not(.bk-reader *, .leaf-one *, .mem *, .print-card *) { font-size: 34px }`. Because `:not()` takes the specificity of its strongest argument, this rule is (0,3,1). It beats every `.sheet-page .x h2` rule (0,2,1) in book-account.css.
   - Sizes: all desktop sizes. On a phone, the 760px rule (28px) wins the same way.
   - Evidence (computed sizes):
     - Talk's "On the phone, for now." is 34px. The CSS asks for 48px, or 56 from 1600px up (lines 404 and 427). It ends up smaller than the 44–52px question beside it.
     - All eleven Account section headings are 34px against the intended 26 (line 231).
     - All five Plans plan names are 34px against 26 (line 344), nearly the size of the 40px price.
     - By the same cascade: Wall chapter heads are 34px, not 36 (line 602), and the Book empty-state heading is 34px, not 40 (line 143).
   - Rules: 16 (the big elements are bold, the minor ones quiet), the craft rule "two or three sizes do the visible work", and checklist execution.
   - Fix: add one class of specificity to each rule in book-account.css (for example `.sheet-page .page .talk-words h2`), or ask the lead to wrap astory.css's rule in `:where()`.

3. **On a laptop, Plans' book row and every Choose button are below the fold.**
   - Where: `.pl-table`, `.pl-head` and the book row's `.pl-cell`.
   - Size: 1366×768. 1920 and 2560 fit (the table ends at 792 of 1000 and at 1029 of 1300).
   - Evidence:
     - The table runs from 284 to 909. Book row 676–820, Choose row 819–908.
     - The heads are 151px tall, because the plan names are 34px (finding 2).
     - The book row is 144px, because Individual's book cell ("A Classic Hardcover each year, or its $69 toward a finer edition, plus the Digital Edition") runs four lines in a 177px column, beside a keepsake image.
   - Rules: 9 and the checklist ("main content visible within about one screen").
   - Fix: fix finding 2 (26px names), set the price beside the name on one line, and shorten the Individual book cell to two lines. Aim for the table to end by about y=740 at 768.

4. **On the wall, a chapter of one memory prints the same opening words twice, side by side.**
   - Where: `.wall-chapter.one .wall-chapter-quote` (`leadOf(body)`) beside the chapter's only `.wall-leaf`. Wall.tsx lines 248–253.
   - Sizes: all four. On a phone the quote is stacked directly above the leaf (quote 630–755, leaf from 810).
   - Evidence: "Childhood" sets "We live in a small city. It's in Vietnam. Mom was a teacher, dad an engineer and I stay with grandmas" large, and the leaf next to it opens with exactly those three lines.
   - Rules: 19 (don't repeat on one page) and 32 (the large line is the kept line, the takeaway, not a reprint of the opening).
   - Fix: take the large line from beyond what the closed leaf shows (a sentence after its first four paragraphs, or the memory's kept line if the RPC can return it). Or drop the quote for a chapter of one and let the leaf run wider, with the photograph larger.

5. **At 1366×768 the Book spread is 13% smaller than the samples' (752×376 against 868×434), because 141px of controls stand in three rows under it.**
   - Where: `.bk-under` (`.bk-controls` 44px, `.bk-dots`, and `.bk-note` 45px with gaps), plus `--bk-chrome` in `.book-page .bk-reader.samples .bk-spread` (book-account.css line 106).
   - Size: 1366×768. The reader runs from 235 to 752 and fits. 1920 (1216×608) and 2560 (790 square at zoom 1.3) also fit.
   - Evidence: book 235–611, under-book 611–752. The samples page puts its stage at y=229, 868×434.
   - Rules: 22 (the book matches the samples) and 11 (the book scales to fit).
   - Fix: set the caption and "Read this page" on the same row as Back and Turn page (caption left, read button right), with the dots as a hairline between them. Then cut `--bk-chrome` by the 60–70px saved. That gives about 430px at 768.

6. **Account is a single stack of eleven full-width sections, 3.3 screens at 1920 and at 2560. Several are whole rows for one button.**
   - Where: `.acct-sec` in Account.tsx and book-account.css §Account.
   - Sizes: 1920 (scrollHeight 3303) and 2560 (4287, with a 1222px body column).
   - Evidence: the Email, Sign out, Your plan and Delete rows are each 217–247px tall at 2560 for one line and one control. Sign out also sits fourth, between Password and Whose stories.
   - Rules: 8 (use the screen), 9 ("how much scrolling effort I need") and 10.
   - Fix: from about 1560px, set the short sections two to a row (Email with Password, Your plan with Privacy, Who looks after this with Delete). Fold Sign out into a "Signing in" group with Email and Password, at the end of that group.

7. **Start, step 1, scrolls by 27px at 1366×768.**
   - Where: `.start`, `.start-sheet` and `.start-way` padding.
   - Size: 1366×768. 1920, 2560 and both step-2 views fit exactly.
   - Evidence: scrollHeight 795 at a height of 768. The sheet runs from 124 to 771, and the third way's card ends at 739.
   - Rule: 11. Start.tsx's own header also promises "one screen on a desktop".
   - Fix: under `(max-height: 800px)`, trim each way card's vertical padding by about 10px and the gap above "Step 1 of 2".

8. **On a large window each of Start's three ways is a very wide row, with an empty band between the words and the action.**
   - Where: `.start-way` (`grid-template-columns: 136px minmax(0,1fr) auto`).
   - Sizes: 1920 and 2560.
   - Evidence: at 1920 the rows are 1384px wide, the words end at x=969 and "Start their story →" starts at x=1486, a 517px hole in each card. At 2560 the rows are 1799px.
   - Rules: 8 and 39 ("set as large cards, each with an object…"). The file's header also says "the three ways… side by side".
   - Fix: from about 1500px, set the three ways as three tall cards side by side: object, the "who writes" line, the title, the body, then the action at the foot. Keep rows below that width.

9. **At 2560 the Talk index card is 1232×457 for a six-word question and one button. More than half of it is empty ruled lines.**
   - Where: `.talk-page` (`grid-template-columns: 1fr 1.15fr`) and `.talk-q` (`max-width: 20ch`).
   - Sizes: 2560 (card 1232 wide) and 1920 (922 wide).
   - Rule: 9 ("no card is huge for a small amount of information").
   - Fix: cap the card at about 760px and centre the pair, or make the columns equal and let the question run to about 26ch on large windows.

10. **On the Talk card, the question doesn't sit on the ruled lines: the text's pitch and the rules' pitch differ.**
    - Where: `.talk-card` background (rules every 36px on a phone, 44px on a desktop) and `.talk-q` line-height (33px on a phone, 52px at 44px × 1.18 on a desktop).
    - Size: measured at 390. On a desktop the same mismatch follows from the CSS.
    - Evidence: at 390 the rules fall at 79, 115 and 151 from the card's top, and the question's line boxes are 76–110 and 109–143. The rule at 115 runs through the ascenders of "when you pray?", and the "Write it instead" button sits across a rule.
    - Rule: 17a (reading comes first) and the craft rule on execution.
    - Fix: make `.talk-q` line-height equal to the rule pitch and set `background-position` so that each rule falls on a baseline. Start the button on a rule.

11. **Plans and Account each say "full access" twice. Plans then offers four Choose buttons to someone it has just told needs none of them.**
    - Where: `.pl-note` ("Your account has full access through an access code. Nothing below is needed.") above the Choose row, and Account's Your plan ("Full access" over "Full access through an access code.").
    - Sizes: all four.
    - Rule: 19.
    - Fix: on Account, say "Full access, through an access code." once. On Plans, when the plan is complimentary, set the Choose cells to the quiet "Not needed with your code" and keep the link only in the note.

12. **The monogram seals disagree.** Account's Whose stories shows one initial ("B" for Bao Vo, "G" for GBao Vo, "N"), while the ex libris, the bar's avatar and the wall show two ("BV").
    - Where: `.avatar.ph.acct-seal`, which gets `name={givenName}` only.
    - Sizes: all four.
    - Rule: 18 (a monogram seal of their initials).
    - Fix: pass the full name, so the seal shows two initials when there is a last name.

13. **The Book's empty state offers two actions, and "Where to next" repeats the first of them right below it** (read in the code; not seen, see above).
    - Where: Book.tsx lines 170–176 ("Write the first memory" and "Today's question") and the WhereNext row "Write the next page". The Editions price list also follows a book with no pages.
    - Rules: 41 (a pose, a sentence, the time, one action) and 19.
    - Fix: keep only "Write the first memory". When the book is empty, make WhereNext's first row "Turn the pages of a sample" (astoryapp.com/samples). Consider folding Editions to one line until there are pages.

14. **The wall's brand link is 28px tall, under the 44px target.**
    - Where: `.wall-top .brand` (Lockup height 28).
    - Sizes: all four (measured at 390).
    - Rule: the checklist (targets of at least 44px).
    - Fix: give the link `min-height: 44px` with `display: inline-flex; align-items: center`.

15. **The cover's tilt uses GSAP's built-in `power3.out`, not the house curve.**
    - Where: `src/lib/tilt.ts` lines 18–19, also used by the book object on the cloth.
    - Rule: 23.
    - Fix: use `OUT` from `lib/ease`.

16. **Start has no "Where to next".** Step 1 ends at the three ways and step 2 at its form.
    - Rules: 38 and the checklist.
    - Fix: either the founder rules onboarding steps exempt (record it in the standard, together with the writer's step 1 from writer-r2), or step 1 gets one quiet row, "See a sample book first →".

17. **Plans' keepsake thumbnails load a 1200px image into a 36px slot**, three times.
    - Where: `.pl-keepsake` (`/book/keepsake-closed.webp`, naturalWidth 1200).
    - Rule: execution (performance).
    - Fix: ship a 96px thumbnail, or use `srcset`.

## Same fault elsewhere (rule 1, outside these files)

- Finding 2's cascade also likely beats `.sheet-page .pp-missing h2` in `family-people.css:422` (Person's missing state). Measure it.
- On a phone the Shell puts the back chevron alone on its own row above the title, on Plans and Talk (and on every page that passes `back`). Rule 10, no lone icon on a row. This is in Shell.tsx, so it is for the lead: set the chevron inline before the title at 390, as at desktop.
- Built-in GSAP easings are still in `delight/Companion.tsx`, `InkDot.tsx` and `Prints.tsx` (carried over from writer-r2), now with `lib/tilt.ts` too.
- Asset, not this builder's defect: `public/dog/curious-paper.webp` and `sleep-paper.webp`, used on the wall's not-shared and empty states and the Book's empty state, are still the cream samoyed. Bond's art (rule 21, docs/mascot/BOND.md) is waiting on the founder.

## What passed

- No horizontal scroll on any of the six pages at any of the four sizes (scrollWidth equals the viewport minus the scrollbar).
- No text under 12px on the sheets. The one exception is the printed "2026" on the book's cover at 11px on a phone, which is the book object's own type.
- On a phone, every target on Book, Plans, Account, Talk and Start is at least 44px. The only exceptions are the visually hidden radio inputs inside labelled rows, and the wall brand link (finding 14).
- **Book:**
  - The reader fits one screen at 1366 (235–752), 1920 (235–984) and 2560 (305–1278). The cover is centred while closed.
  - Turning to the endpapers and to the Childhood opener worked. The caption and the "Spread n of 12" counter follow the page.
  - The rail's contents jump correctly. The running head changes to "Editions" on scroll.
- **Talk and Start:**
  - Talk fits one screen at 1920 (1000) and 2560 (1300).
  - Start's step 2 and the join step fit one screen at 1366. The name field takes focus on step 2.
  - The three ways keep "who writes" on every card (rule 29). The taken "My own story" card is disabled, with its reason in place.
- **The wall:**
  - The not-shared state wears the house style: the cloth, one sheet, the dog, a headline with the stop, a line of cause and remedy, and one action. It fits 768.
  - The contents column is sticky, and nothing was left half-faded.
- **Honesty:** the Free plan's "One ten-minute conversation" matches the phone app's deploy note (2026-10). Plans says once that plans are bought on astoryapp.com.

## Not verified

- Reduced motion: checked in the code only (`useMedia('(prefers-reduced-motion: reduce)')` in BookSpread, the tilt's guard, Start's `MOTION_OK`). The pane cannot emulate it.
- A zoomed-out Edge window: only the 1.3 zoom at 2560 was observed.
- The cover-colour sweep, Print at home, Order, "I'd like a printed copy", every Account control, Choose, switching story and "Open it": not pressed, by instruction.
- The Book empty state and the Book, Talk and Account load-error states (Problem) were not seen. The wall's empty state was read in the code only.
- Hover and focus-visible: checked in book-account.css (every control on these pages has a focus-visible rule), not seen in screenshots.
- `__gsap` is not exposed on a direct load of `/account` (only atmosphere, WeekInk, AuthFrame and Write expose it), so I could not step its arrival. Nothing on that page was below 0.9 opacity when measured.

## Housekeeping

I worked only in my own tab (tab-53), reset its viewport to desktop and closed it. Opening `/book` turned pages (read-only). On `/start?another=1` I opened step 2 for "Someone in my family" and submitted nothing. Viewing `/talk` and `/plans` sends their analytics view events (`talk_wall_shown`, `plans_viewed`). I did not sign out, did not touch `astory-app-auth`, and pressed none of the forbidden controls. I visited astoryapp.com/samples to measure its book, read-only.
