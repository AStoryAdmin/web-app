# Book, Plans, Account, Talk, Start and the Wall, round 5: Bao's Standard

**FAIL.** 2 findings, ranked worst first. All seven round-4 findings are fixed, and so are N5, N6 and N7 from the skills review. Nothing else on these pages breaks the checklist.

What still fails:
1. **The leftover the builder admitted.** On the wall, the short words-only leaf leaves about a third of itself as blank paper in a row set by photograph leaves. It happens at every three-column size, including the founder's own display, and it grows as the window grows.
2. **Single-word last lines.** Four lines of running text end on one word, on Plans, Account and the wall. Round 3 fixed the same fault in "Yours the moment it is paid for", so under rule 1 it is a fault here too.

If the builder fixes these two, this set passes.

**How I checked.**
- **Signed-in pages:** my own browser-pane tab (tab-100) at 1366×768, 1920×1000, 2560×1300 (where the app sets html zoom 1.3) and 390×844. I reloaded at each size and stepped GSAP 400–500 ticks with `__st.update()` before measuring.
- **The sweep:** on every page, a script checked:
  - scrollWidth against clientWidth, and scrollHeight;
  - text under 12px outside the book object;
  - controls under 44px (×zoom);
  - text under 0.9 opacity, with the opacity of every ancestor multiplied in;
  - one-word last lines, by measuring text-range line boxes.
- **Screenshots:** the pane composited at 1366 and 390 for part of the run and was hidden for the rest. So 1920 and 2560 rest on measurements.
- **The wall:** signed out, in headless Playwright 1.63 from `../09142026/node_modules/playwright`. I used a fresh context per size and per state, with no stored session. The script prints no URLs and no keys.
  - I checked the four sizes, plus three zoomed-out windows: 1707×960, 2400×1250 and 3200×1625, each at deviceScaleFactor 0.8.
  - Full-page screenshots are in `docs/agents/reviews/shots/book-r5-wall-{real,none,empty}-{1366,1920,2560,390}.png`.
- **The Book's empty state:** I injected a replica into the real `.book-page` under the real CSS (`.bk-empty`, `.bk-empty-desk`, `.bk-empty-object > .bk-object-in`, the real dog image and the real word blocks). I measured it at 1920, 2560 and 390, then removed it. This is a geometry check only. Round 4 judged the real BookObject.

## Round-4 findings, re-checked

| # | Round 4 | Now |
|---|---|---|
| 1 | "Read the whole thing" under a leaf whose whole text already shows | **Fixed.** Wall.tsx `useFill` now clamps each words leaf to fill its row and shows the button only when more than two lines are hidden. "Losing grandparents…" has no button at 1920 or 2560 (scrollHeight 346 = clientHeight 346). "Building Better Play…" opens to 17 lines (blank under its button: 8px at 1920, 23 at 2560). "Childhood…" shows all 10 lines with no button. Every leaf with a button really hides text: at 1366 the clamped leaves hide 144–819px each. The blank paper that remains is finding 1. |
| 2 | Book empty state in a narrow strip at large sizes | **Fixed.** At 1920 the book is 448px square (294 in round 4), and the composition spans 76% of a 1768px section. At 2560 it is 582px and spans 74%. At 390 the desk is 304×213 with the words below, and scrollWidth is 390. |
| 3 | Start step 2's last element touches the foil frame at 1366×768 | **Fixed.** `.start-sheet.step-2` now has 32px bottom padding in the short-window rule. "Someone in my family" ends 18px clear of the hairline, and "Someone already on A Story" and `?join=1` also end 18px clear. At 1920 the clearance is 18px, at 2560 it is 23px (screen), and at 390 it is 18px (6px frame inset). |
| 4 | The empty wall's Where to next has two rows | **Fixed.** It now has three rows: "Turn the pages of a sample", "How A Story works" and "What a family book costs", at all four sizes (`shots/book-r5-wall-empty-1920.png`). The pricing address answers HTTP 404, but the marketing SPA renders its real Pricing page there ("Everyone starts free. Only the calls are paid for."). The page is right; the status code belongs to the marketing site, not this app. |
| 5 | Start step 1 is 1px taller than 1366×768 | **Fixed.** scrollHeight is 768 and clientWidth is 1366, so no scrollbar. The heading block ends at 232.5 and the first card starts at 252.5, a 20px gap against 12px between cards. |
| 6 | "Digital Edition" squeezed to 133px on a phone | **Fixed.** At 390 every `.ed-row` name is 205px wide and one line (26px). Every description is 205px wide. `.ed-price small` is 129px wide, on two lines (three for Full-Service). |
| 7 | Plans shows a lone caption row for an access-code account | **Fixed.** `.pl-table.no-act` collapses the act row to its rule (1px) at 1366, 1920 and 2560. At 390 the Free card still closes on "Where every account starts", which reads fine there. |
| N5 | Start head padding and dead §19 styles | **Fixed.** `.start-head { padding: 0 var(--s-12) }`. The lockup starts at x=111, which is the sheet's content edge (63 + 48), and "Not now" ends at 1255, the content's right edge. Step 1 fits 768. |
| N6 | Account's paired fields with an icon on one only | **Fixed.** No leading icons on the fields. At 1920 "First name" and "Last name" both start their text at the box edge (padding 2px), and the password pair shares one 311px box at x=1157. |
| N7 | Book, Talk and Account load on an empty page | **Fixed in code.** `bk-skel` shows the rail's five ruled rows and a 2:1 block, with `100vh / var(--zoom)` as rule 12 asks. `talk-skel` shows two columns and a card block, and `acct-skel` shows an index and ruled sections. On a cold load of Account, my first measurement caught the busy skeleton at one screen high before the page arrived. I did not see it in a screenshot. |

## The admitted leftover, judged

**It is a defect, and finding 1 below.** The measurements:

| Window | Leaf | Blank paper under the words |
|---|---|---|
| 1366 | two columns | none: the leaf pairs with "Building…", 363px tall, button shown |
| 1920 | 687px | 208px |
| 2560 | 906px screen | 283px |
| 2400×1250, zoomed out | 858px | 260px |
| 3200×1625, zoomed out | 1132px | 354px |

At every three-column size that is 30–31% of the leaf.

It sits in the first row of the main chapter, the first thing a visitor reads after the contents. Its two neighbours each carry a print, a title, eight lines and a button down to the same baseline, so the third leaf reads as unfinished, not as a rest. See `shots/book-r5-wall-real-1920.png` and `book-r5-wall-real-2560.png`, chapter 2, row 1, right.

Rule 17 is explicit: a memory without a photograph is the person's words on paper, "never a blank box". A third of a leaf left empty is part of a blank box.

## Findings

1. **On the wall, a short words-only leaf in a row of photograph leaves leaves 30% of itself as blank paper, at every three-column size.**
   - Where: Wall.tsx `Leaf` and `useFill`, and book-account.css §6 (`.wall-leaves` `align-items: stretch`). The fill logic can clamp long words to the row, but it can't fill a row with words that are already all showing.
   - Sizes: 1920, 2560 and every zoomed-out large window. Not at 1366 or 390.
   - Evidence: the "Losing grandparents and preserving a grandfather's story" figures in the table above (`.wall-words` 346px, 12 lines, no button).
   - Rules: 17 (words on paper, never a blank box), 9 (no card large for little information) and the craft rule that a mostly empty ground is an underbuilt section.
   - Fix: when a words-only leaf's whole text fits with room to spare, set its words as a letter that fills the leaf. In `measure()`, step `.wall-words` font-size up 1px at a time from 18px to at most 22px (line height 1.6) while the words still sit inside the floor. At 1920 that takes 12 lines at 18px (346px) to about 15 lines at 22px (about 530px of the 554 available), and the words stay the person's own and lead (rule 17a).

2. **Four lines of running text end on a single word.** Round 3's "for" fix is not applied across the site (rule 1).
   - **Wall, 2560:** "Losing grandparents…" ends "…busy taking / care.". At 1920 the first paragraph of "Building Better Play…" ends on "year.", and at 390 a visible paragraph of "Pausing a PhD…" ends on "study.". `.wall-words p` has `text-wrap: wrap`.
   - **Plans, "The book" row:** at 1366 the Express cell reads "A Classic Hardcover with the / pass" (207px cell). At 1920 the Family cell reads "A Classic Hardcover for each storyteller, each / year" (282px). `.pl-cell-value` has `text-wrap: wrap`.
   - **Account at 390, "Your plan":** the 26px line `.acct-plan b` reads "Full access, through an access / code.".
   - Rules: 1 (apply a ruling everywhere), the craft rule on execution, and rule 17a (reading comes first).
   - Fix: add `text-wrap: pretty` to `.wall-words p` and `.pl-cell-value`, and `text-wrap: balance` to `.acct-plan b`.

## What passed

- **Scrolling and type:**
  - No horizontal scroll on any page at any size, signed in or out, including the three zoomed-out wall windows.
  - No text under 12px outside the book object.
  - No control under 44px (×1.3 at 2560).
  - Nothing under 0.9 opacity once motion settles. The one exception is the disabled "My own story" card's specimen at 0.45, which is its disabled state, with its reason in words beside it.
- **Book:**
  - The reader fits one screen at every size:
    - 1366: stage 883×441, controls end at 732 of 768.
    - 1920: 1420×684, ends at 975 of 1000.
    - 2560: 1912×889 screen, ends at 1267 of 1300.
    - 390: 346 square, the book's controls end at 771 of 844.
  - The cover photographs load into their prints.
  - Where to next has three rows. The Editions names are 24px on one line.
- **Plans:**
  - At 1920 and 2560 the page is exactly one screen. At 1366 Where to next starts at 736.
  - At 390 it becomes one card per plan.
- **Account:**
  - The pairs hold at 1920 (x 389 / 1133) and 2560 (508 / 1508).
  - scrollHeight is 2777 at 1920 and 3604 at 2560, unchanged.
  - At 390 the page is 5343 tall and clean.
- **Talk:**
  - One screen at 1920 and 2560. Where to next spans 233–1673 at 1920.
  - At 390 Where to next has three rows. The question is two balanced lines.
- **Start:**
  - Step 1 is one screen at all three desktop sizes.
  - At 1920 the cards line up: titles at 575/575/575. At 2560 the "who writes" lines are at 717/717/717 and the titles at 748/748/748.
  - Both step-2 views and `?join=1` fit one screen at every desktop size, and `?join=1` fits 844 at 390. The code field takes focus.
- **The wall:**
  - Signed out at every size: the function answered 200 and all four photographs loaded. There are 0 auth keys in localStorage, and the RPC fallback was never called.
  - The bad slug answered 404 and shows the not-shared page in exactly one screen at all seven windows. Bond looks over the sheet's edge, with his lower 30px (38 at 2560) behind the paper.
  - The empty wall (mocked function response) has Bond asleep, one headline, the time it takes, one action and three rows.
  - Leaf tops and titles line up in every row. The contents rail is sticky.

## Not verified

- **The Book's empty state with real data:** switching story is off limits. I judged its geometry on a replica under the real CSS. Round 4 judged the real BookObject.
- **The wall's empty state:** only with a mocked function response in headless Chromium.
- **Signed-in pages at 1920 and 2560:** judged on measurements, because the pane was hidden for much of the run. I saw Start at 1366, and Start `?join=1` and Book at 390, in screenshots.
- **The loading skeletons:** I read them in code and caught one state in measurement. I did not see them in a screenshot. On a full page load the dev server shows a cream page for about a second before the app mounts. That is the unbundled dev build, not a view in-app navigation shows.
- **Reduced motion, hover, focus-visible and active states:** read in the CSS, not seen.
- **A zoomed-out Edge window on signed-in pages:** only the wall was checked at a zoomed-out scale (headless, deviceScaleFactor 0.8).
- **Controls not pressed, by instruction:** Save, Change, Remove, Send, Order, Open it, Sign out, Choose, Switch to…, the printing interest button, the cover colours and Begin their story.

## Housekeeping

I worked only in tab-100. I reset its viewport to desktop, removed the two helper scripts I had put in its sessionStorage, and closed it.
- The empty-book replica lived only in that tab's page for a few hundred milliseconds.
- On `/start` I opened step 2 for two ways, used "← The three ways", and submitted nothing.
- I moved between pages with the router's own history, which sends the pages' usual view events.
- Once, another agent's half-saved Write.tsx put Vite's error overlay over every page. I waited until the file parsed again and reloaded. I touched nothing.

Playwright ran headless in fresh contexts with no session. The empty-wall run only replaced the function's response inside that browser, and nothing was written anywhere.

I did not sign out, did not read or touch `astory-app-auth`, and pressed none of the forbidden controls.
