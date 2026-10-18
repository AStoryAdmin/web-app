# Book, Plans, Account, Talk, Start and the Wall, round 3: Bao's Standard

**FAIL.** 9 findings, ranked worst first. All 17 round-2 findings are fixed, and most are fixed well. The heading cascade is gone, Plans fits a laptop, the Talk question sits on its rules, and Account pairs its short sections. The wall now shows signed photographs to a visitor with no account. What still fails: Bond is placed badly in two of his three appearances, and the Book's empty state loses both the book and the dog on a phone. The wall's three-column rows are half blank paper at 1920 and 2560. Start's three cards don't line up their tops.

**How I checked.** I used my own browser-pane tab (tab-71), force-reloaded, at 1366×768, 1920×1000, 2560×1300 (the app sets html zoom 1.3) and 390×844. I stepped GSAP 400–600 ticks before measuring and measured with getBoundingClientRect, scrollWidth/scrollHeight, computed styles and text-range line boxes. Pane screenshots stopped compositing partway through (the pane was hidden, and later screenshots came back cropped), so every signed-in judgement at 1920, 2560 and 390 rests on measurements, not pictures.

Pages:
- `/book`: the closed cover, Childhood, spread 4, the Editions and the end.
- `/plans`, `/account` and `/talk`.
- `/start?another=1`: step 1, then step 2 for "Someone in my family" at 1366 and 2560. Nothing was submitted.
- `/start?join=1`.
- The wall: `/p/RNm1vTr2Gyqu` and `/p/zz-not-a-real-slug`, signed out, with headless Playwright 1.63 from `../09142026/node_modules/playwright`. Each size got a fresh context with no storage, and the script prints no URLs and no keys.

I measured astoryapp.com/samples at 1366×768 (read only). I read Book.tsx, Wall.tsx, Plans.tsx, Talk.tsx, BookObject.tsx, lib/tilt.ts, book-account.css in full, the `:where()` rule in astory.css and docs/mascot/BOND.md. I also checked every `public/dog` file these pages use.

## Round-2 findings, re-checked

| # | Round 2 | Now |
|---|---|---|
| 1 | Wall masonry, ragged columns | **Fixed.** A row grid in reading order: tops on one line in every row at 1366, 1920 and 2560 (for example 912/912, 1683/1683, 2070/2070 at 1366), and a last leaf alone takes the row. A new fault in the 3-column rows is finding 3. |
| 2 | astory.css cascade forcing 34px headings | **Fixed.** astory.css:2874 is now `:where(.sheet-page .page) h2…`. Measured: Talk 40px (44 from 1600px), Account 26, Plans 26, wall chapter heads 36. |
| 3 | Plans below the fold at 768 | **Fixed.** The table runs 290–697, so the book row and the act row are on screen. At 1920 it ends at 720, and at 2560 the page is exactly 1300 tall. |
| 4 | Wall chapter of one prints its opening twice | **Fixed.** The quote is gone. The head sits on the left and the leaf on the right. |
| 5 | Book spread 752×376 at 1366 | **Fixed.** 883×441 at 1366, one row under the book (caption, Back · Spread n of 12 · Turn page, Read this page). The dots end at y=750 of 768. 1920: 1368×684, ends at 987 of 1000. 2560: 1778×889, ends at 1283 of 1300. |
| 6 | Account a single stack | **Fixed.** From 1560px the wall, export, plan, privacy, trusted and delete sections are paired. Sign out is a part of Signing in. scrollHeight: 2769 at 1920 (was 3303) and 3595 at 2560 (was 4287). |
| 7 | Start step 1 scrolls 27px at 1366 | **Fixed.** scrollHeight 768. |
| 8 | Start ways as very wide rows on a large window | **Fixed**, three cards side by side from 1500px. Their tops don't align: finding 4. |
| 9 | Talk card 1232 wide at 2560 | **Fixed.** 762 CSS px at 1920 and 991 rendered px at 2560 (762 × 1.3). The pair is centred. |
| 10 | Talk question off its rules | **Fixed.** At 1366 the rules fall at 39.9 and 91.9px in the 52px pitch, on the baselines (Cormorant at 44px puts the baseline at about 40px). |
| 11 | "Full access" said twice | **Fixed.** Account says "Full access, through an access code." once. Plans says it once in the note, and its Choose cells are empty for a code account. |
| 12 | Monogram seals disagree on Account | **Fixed on Account** (BV, GV, N). The Shell's storyteller seal still shows "B" (see "Same fault elsewhere"). |
| 13 | Book empty state: two actions and a repeat | **Fixed in the code.** One action, "Write the first memory". Where to next opens with "Turn the pages of a sample" when the book is empty. A new fault is finding 1. |
| 14 | Wall brand link 28px | **Fixed.** 44px at every size (57 at 2560). |
| 15 | Tilt on `power3.out` | **Fixed.** `OUT` from lib/ease. A grep of components and pages finds no built-in GSAP eases left. |
| 16 | Start has no Where to next | **Fixed** on step 1 ("See a sample book first", 44px). Step 2 is a form and needs none. |
| 17 | 1200px keepsake in a 36px slot | **Fixed.** Drawn in CSS, shown from 1600px only. |

## The builder's claims and exceptions, judged

| Claim | Verdict |
|---|---|
| The Book's words are 10.8px at 1366×768, as a samples-parity exception (spread 883×441 against the samples' 868×434) | **Accepted.** I measured the samples page at 1366×768: stage 868×434, memory text in EB Garamond at 9.8–10.8px (most at 9.8 and 10.6), Montserrat labels at 5.0–7.6px. The app's spread is 883×441 with memory text at 10.8px and labels at 5.1–7.5px, so it matches or slightly exceeds the samples (rule 22). "Read this page" is beside it at 44px for anyone who needs the words larger, which satisfies rule 17a. Rule 16's 12px floor doesn't apply to the printed page's own type, as in round 2. |
| "Who looks after this if I can't" sets in two lines on Account | **Accepted.** At 1366 it breaks "Who looks after / this if I can't", balanced (`text-wrap: balance`, 285px column, 56px tall). At 1920 and 2560 it is one line (28px) in the paired layout. Two balanced lines are within the craft rule (two lines or fewer). |
| The wall loads from the public-story Edge Function, and signed-out visitors see signed photographs | **Verified signed out**, at all four sizes in a fresh headless context with no stored session (0 auth keys in localStorage). The function answered 200, and every photograph request went to a signed storage address and returned 200. All four prints decoded (naturalWidth 1122 and 1200) and rendered (for example 261×324 and 382×257 at 1366). The RPC fallback was never called. The bad slug got 404 from the function and showed the not-shared page. The dev build calls the function twice per load (StrictMode). No URL, key or token was printed. |

## Bond, judged where these pages use him

- **Wall, empty** (seen by serving a mocked empty story to the headless page, a client-side route only): `sleep-paper`, 180px (234 at 2560), above the headline. His pose suits the moment, he sits well on the paper and has a natural edge at his paws. **Passes.**
- **Wall, not shared:** wrong placement (finding 2).
- **Book, empty:** collapses on a phone and covers the cover's lettering on a desktop (findings 1 and 7).
- Asset note: `public/dog/sleep-paper.webp` is byte-identical to `sleep.webp` (`cmp`), so the "-paper" variant BOND.md describes was never made. It does no harm here, because the sleeping pose has no cut edge.
- Not judged as a defect, for the founder: the new art is a glossy, near-photographic digital painting. Rule 21 and BOND.md ask for soft coloured pencil and watercolour. On the cream paper he reads heavier than the rest of the house's drawn ornaments. It is the founder's own art, so it is the founder's call.

## Findings

1. **On a phone, the Book's empty state shows neither the book nor Bond: the desk collapses to 0×0.**
   - Where: `.bk-empty { justify-items: center }` at ≤760px (book-account.css §1.5) shrink-wraps `.bk-empty-desk`. Its only in-flow child is the BookObject, forced to `width: 100% !important` by `.bk-empty-object`. A percentage width inside a shrink-to-fit box resolves to 0, and the dog is sized at 56% of that 0. The inline `width: 300` from BookObject.tsx is overridden.
   - Size: 390 (any width ≤760).
   - Evidence: I could not reach a real empty book, because switching story is off limits. I rebuilt the section in my own tab with the real classes, BookObject's inline width and real CSS. At 390, `.bk-empty-desk`, `.bk-empty-object` and `.bk-empty-dog` all measured 0×0 at x=197, and the words started at y=387. At 1366 the same replica measured 420×420 for the book, so only the phone breaks.
   - Rules: 41 (an empty state has a pose), 21 and checklist "empty states designed, not blank".
   - Fix: at ≤760px give `.bk-empty-desk` a definite width (`width: min(300px, 80%)`), or set `.bk-empty { justify-items: stretch }` and centre the object with `margin-inline: auto`.

2. **On the not-shared wall, Bond's head ends in a hard horizontal cut across his chest, floating 56–64px down on the paper.**
   - Where: `.wall-none-dog` (`/dog/curious-paper.webp`, `margin: -96px 0 0 -8px`, 132px wide) in Wall.tsx `Bench`/`wall-none`.
   - Sizes: all four. At 1366 the dog runs y 215–327 and the sheet's top edge is at 263, so the cut lies 64px inside the sheet (56px at 390). At 2560 the dog is 145px tall and the cut lies about 83px inside.
   - Evidence: `docs/agents/reviews/shots/book-r3-wall-notshared-bond-crop.png` (the fur stops on a straight line on the paper, with no ledge under it) and `book-r3-wall-notshared-1366.png`. The asset's bottom row is opaque (alpha 253 at its centre), so the cut is the image's real edge.
   - Rules: 21 (real assets used well), 42 (failure wears the house style) and the craft rule on execution. This page is what every visitor with a stale link sees.
   - Fix: put the cut on an edge. Either set Bond behind the sheet's top edge (a wrapper with the sheet's paper painted above him, so the paper hides his chest), or raise him the full height (`margin-top: -112px`) so the cut sits exactly on the sheet's edge, as if he were looking over it.

3. **In the wall's three-column rows, a words-only leaf is stretched to the height of the photograph leaves beside it and is about half blank paper.**
   - Where: `.wall-leaves { align-items: stretch }` with three columns from 1600px (book-account.css §6).
   - Sizes: 1920 and 2560. At 1366 the two-column rows happen to pair photo with photo and words with words, so the problem doesn't show there.
   - Evidence:
     - 1920: "Losing grandparents…" and "Building Better Play Studios…" are each 667px tall, and their words and "Read the whole thing" end about 250px down, leaving roughly 400px of empty leaf. Screenshot: `docs/agents/reviews/shots/book-r3-wall-1920-full.png`.
     - 2560: both leaves are 867px tall, with the same proportion empty.
     - Smaller, at 1366: row 1 pairs a portrait print (281×364) with a landscape one (403×298), so the titles across that row sit 68px apart (y 1329 against 1261).
   - Rules: 9 (no card huge for a little information) and 10.
   - Fix: let a words-only leaf open further to fill its row (no clamp when its row has a photograph), or use `grid-auto-flow: row dense` so words-only leaves pair with each other and photo leaves with photo leaves. Give the prints in a row one height (`aspect-ratio` on `.wall-print img`) so the titles line up.

4. **From 1500px, Start's three tall cards don't line up their tops: each "who writes" line starts at a different height.**
   - Where: `.start-way` (`grid-template-rows: auto 1fr auto`) with specimens of different heights. `.obj-book` is 104px, `.obj-leaf` 92 and `.obj-code` 74, and these classes sit on `.start-obj` itself, so they override its fixed 108px.
   - Sizes: 1920 and 2560.
   - Evidence: the "who writes" lines are at y 574, 562 and 544 at 1920 (30px of stagger), and at 746, 730 and 707 at 2560 (39px). The titles stagger the same way.
   - Rule: 10 (columns align and tops line up).
   - Fix: give the specimen a fixed slot (an inner wrapper, or `.start-obj { height: 108px }` that the obj-* classes can't override), centred on its foot, so the words start on one line in all three cards.

5. **The wall's empty state offers "Keep your own story" twice, and the cloth above it says "0 memories".**
   - Where:
     - The `.wall-empty` button "Keep your own story" sits directly above the first Where to next row, "Keep your own story" (Wall.tsx).
     - `.wall-counts` prints "0 memories · shared by the family, for anyone with the link".
   - Sizes: all four (headless, mocked empty story). Screenshot: `docs/agents/reviews/shots/book-r3-wall-empty-1920.png`.
   - Rules: 19 (don't repeat an action) and 35 (a number needs a meaning, or it goes).
   - Fix:
     - When the wall is empty, start Where to next with "Turn the pages of a sample" and drop the duplicate row.
     - Print no count line until there is at least one memory.

6. **On Talk, "Where to next" doesn't line up with the pair above it on a large window.**
   - Where: `.talk-next` (`max-width: 1440px`) under the centred `.talk-page` pair.
   - Sizes: 1920 and 2560. It aligns at 1366.
   - Evidence: at 1920 the words start at x=233 and the card ends at 1674, while Where to next runs 301–1604 (68px in on each side). At 2560: 336–2209 against 426–2117 (90px).
   - Rule: 10.
   - Fix: give `.talk-next` the same width and centring as the `.talk-page` grid (600 + gap + 760), so the rows share the pair's edges.

7. **In the Book's empty state on a desktop, Bond covers the lower-left corner of the cover, where its script line is printed.**
   - Where: `.bk-empty-dog { left: -18%; bottom: -6%; width: 56% }` over `.bk-empty-object`.
   - Sizes: 1366, 1920 and 2560 (judged on the same replica as finding 1, so the geometry is real CSS and the picture is not).
   - Evidence: at 1366 the book runs x 137–557, y 267–687 and Bond x 62–297, y 525–712. He covers the left 38% of the cover's bottom 38%, the area where the cover sets its "Family is everything to me." line and the name. The art is a head-on-paws pose facing the viewer, so he reads as laid on top of the book rather than asleep against it.
   - Rules: 21 and 44 (the companion never covers words).
   - Fix: set him beside the book on the desk line (`left: auto; right: -30%; bottom: 0`, beneath the book's contact shadow), or behind its fore-edge. Keep him off the lettering.

8. **On Start's step 2 at 1366, the sheet's foil fleuron sits 4px above the form's first label.**
   - Where: `.start-sheet::after` (top 8px, centred) against `.start-form`, whose column starts at the sheet's centre line, combined with the short-window rule's 24px top padding.
   - Size: 1366×768. Both step-2 views: the fleuron runs y 190–202 above the "Their first name" label at 206, and 263–275 above "Their family code" at 279. At 2560 the gap is 42px.
   - Rule: the craft rule on execution (an ornament placed with restraint, rule 15a).
   - Fix: on step 2 under `(max-height: 800px)`, keep `.start-sheet`'s top padding at `var(--s-10)`, or shift the form column down by 16px.

9. **In the Editions list, "Yours the moment it is paid for" leaves "for" alone on its second line.**
   - Where: `.ed-price small` in the fixed 200px price column (`.ed-row`).
   - Sizes: 1366, 1920 and 2560 (the column is fixed). It measures 200×34 at 1366.
   - Rule: 10 (no orphans).
   - Fix: shorten it to "Yours once paid", or add `text-wrap: balance` to `.ed-price small`.

## Same fault elsewhere (rule 1, outside these files)

- **The bar's brand link is 28px tall** (36px rendered at 2560) on every Shell page: Book, Plans, Account and Talk. This is the fault fixed on the wall as round-2 finding 14. It is in Shell.tsx, so it is for the lead: `min-height: 44px; display: inline-flex; align-items: center`.
- **The storyteller seal in the bar shows one initial** ("B"), while the avatar beside it and Account show "BV" (round-2 finding 12). The `.teller .avatar` in Shell.tsx needs the full name.
- **The sheet's large "A" watermark sits behind the third Where to next arrow** on Plans, Talk and the wall (bottom right). It is faint, but it is under a control. Lead: keep it clear of the last row, or below it.
- **Content, for the founder:** the public wall shows a memory titled "Ending the chat" whose words are an exchange with an AI ("You: How to end chay / AI: If you'd like to end the chat…"). It is test data in the founder's own story, and it is public to anyone with the link. Make it private, or delete it in the app.

## What passed

- **Scrolling and type:**
  - No horizontal scroll on any page at any size (scrollWidth equals clientWidth everywhere, signed in and signed out).
  - No text under 12px outside the book object.
  - Every control is at least 44px, except the bar brand above.
  - Nothing is left below 0.9 opacity after stepping GSAP.
- **Book:** the reader fits one screen at all four sizes. On a phone it is 346 square, with the controls ending at 771 of 844. The contents rail jumps correctly ("Spread 3 of 12" for Childhood).
- **Plans:**
  - Plan names at 26px with the price on the same line.
  - One note, with the access-code line once.
  - The gilt column marks the plan the account is on.
  - At 390 it becomes one card per plan.
- **Account:** the pairs, the sticky index and one seal style all hold. On a phone the index becomes a jump menu.
- **Talk:** fits one screen at 1920 and 2560. The question card comes first on a phone, and the back chevron now sits inline with the title at 390.
- **Start:** step 1 and both step-2 views fit one screen at 1366, 1920 and 2560. The name field takes focus on step 2. "Who writes" is on every card (rule 29). The taken way is disabled, with its reason given.
- **The wall:**
  - Signed out, it works fully.
  - The contents column is sticky on desktop and static on a phone.
  - The not-shared page has the cloth, one sheet, Bond, a headline with the stop, cause and remedy in one line, and one action. It fits one screen at every size.
  - The rise animation is scroll-driven and never holds a leaf faded.

## Not verified

- **The Book's empty state** was not seen with real data: switching story is off limits, and the founder's stories all have memories. Findings 1 and 7 come from a replica in my own tab built with the real classes and CSS.
- **The wall's empty state** was seen only with a mocked function response in headless Chromium.
- **Pane screenshots at 1920, 2560 and 390** failed: the pane stopped compositing and later returned cropped frames. Those sizes were judged from measurements. The signed-out wall was seen in full-page headless screenshots at all four sizes.
- **Reduced motion:** code only (`prefers-reduced-motion` guards in book-account.css, the tilt and BookSpread).
- **Hover, focus-visible and active states:** read in the CSS, not seen.
- **A zoomed-out Edge window:** only the app's own 1.3 zoom at 2560 was observed.
- **Controls not pressed, by instruction:** Save, Change, Remove, Send, Order, Open it, Sign out, Choose, the printing interest button, the cover colours and Print at home.

## Housekeeping

I worked only in tab-71, reset its viewport to desktop and closed it. The empty-state replica lived only in that tab and went with it. On `/book` I turned pages and used the contents rail, which is read only. On `/start?another=1` I opened step 2 for "Someone in my family" and submitted nothing. Viewing `/plans` and `/talk` sends their view events.

Playwright ran headless in fresh contexts with no session. The empty-wall run only replaced the function's response inside that browser; nothing was written anywhere. The evidence screenshots are in `docs/agents/reviews/shots/book-r3-*.png`. I did not sign out, did not read or touch `astory-app-auth`, and pressed none of the forbidden controls. I visited astoryapp.com/samples to measure its book, read only.
