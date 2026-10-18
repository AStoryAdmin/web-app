# Writer, round 3: Bao's Standard

**FAIL.** 9 findings, ranked worst first. All 8 round-2 items are fixed where round 2 measured them. What is left: a draft that comes back after you delete it, the failed-Keep message on a phone, the editing page saying things twice, and the 1366×641 laptop window.

I checked in my own browser-pane tab at 1366×768, 1366×641 (Edge with its bars), 1920×1000, 2560×1300 (zoom 1.3) and 390×844 (touch, pointer: coarse). I also checked 1280×720, 800×900 and 3840×2000 (zoom 2), which stands in for a zoomed-out window. Pages: `/write`, `/write?q=faith-pray-now` (opened from Home's "Write it"), focus mode, `/write?edit=59632e67…` (step 1, editing), and Afterwards via `/write?edit=59632e67…&details=1` and `/write?edit=beeedb62…&details=1`. I stepped GSAP by hand and measured with getBoundingClientRect, computed styles and scrollWidth. To test question lengths, I swapped the h1 text in the DOM for strings of 34 to 90 characters. I read Write.tsx, writer.css and stamp.ts.

## Round-2 items, re-checked

| Round-2 item | Now |
|---|---|
| 1. Running head clipped | Fixed. The recto shows only the chapter ("FAITH & WHAT CARRIED ME" or "A PAGE FOR TODAY"). scrollWidth equals clientWidth at all sizes. The date and part of day are in the folio: "Oct 17, late at night · 0 words · …". |
| 2. Reassurance said twice | Fixed. The Keep note holds only the keyboard hint and "Not now". "A few lines is plenty." appears once, in pencil. On a phone the sub says it once. |
| 3. Rail note wraps, "Not now" orphaned | Fixed. One line, 20px tall at 1920 and 25px at 2560. |
| 4. No Where to next on step 1 | Fixed. The Archive, The book and Home sit 120px under the book. They are absent in focus mode. |
| 5. Phone title field 60px | Fixed. It is 44px while empty, with title 414–458 and "Dear family," at 478. |
| 6. Empty Kept status takes space on a phone | Fixed. `.w-state:empty` is absolute and 1px. The note ends at 360 and the first choice starts at 388, a 28px gap. |
| 7. Number twice in Afterwards | Fixed in Afterwards. Only the hero's "Memory No. 8" remains, and the rows read "Write another / A new page, in your own words" and "Read it in the book". **Still twice on the editing page** (finding 3). |
| 8. Keep slip over the book on arrival | Fixed. The slip is `position: relative` until there are words. At 1366×768 it sits at 641–730, under the book (142–625). With words it follows the scroll, as intended. **At 1366×641 it is now entirely below the fold** (finding 4). |
| Builder: questions two lines or fewer | Holds for every real question. The longest in the bank is 64 characters. Synthetic strings stay at 2 lines up to 80 characters at 390, 800, 1280, 1366, 1920, 2560 and 3840. At 90 characters they reach 3 lines everywhere, which only an edit title can do (finding 3). |
| Builder: Afterwards cloth title in Montserrat | Holds. Montserrat 700 at 56px on one line on desktop, and 36px on 2 lines at 390. |
| Builder: stamp beside the button, which reads Kept | Holds on desktop, measured from the code's geometry. **On a phone it lands on "Not now"** (finding 5). |

## Findings

1. **Clearing the page does not clear the draft, and the folio says it does.** I typed a line on `/write`, then selected all and deleted it. The folio read "0 words · Draft kept in this browser". localStorage still held the deleted words (`"body":"Review test line, to be cleared."`), so a reload brings them back. Opening `/write?edit=59632e67…` writes a draft on mount without any change, so every memory you only look at in the editor leaves a stale draft behind.
   - Where: Write.tsx, the autosave effect (`if (!(d.body || d.title)) return;` leaves the old key in place and `draftState` at "saved").
   - Sizes: all (data, not layout). Seen at 390 and 1366.
   - Evidence: the localStorage key `astory-draft-<story>` after the clear, and the key `astory-draft-<story>-59632e67…` created on load with nothing typed.
   - Rules: 25 (nothing left half-done), 20 (honest copy) and the checklist's designed states.
   - Fix: when the title and the body are both empty, remove the key and set `draftState` to ""; and when editing, autosave only once `d` differs from the memory as saved.

2. **On a phone, a failed Keep squeezes its message into a 120px middle column.** `.w-keep-seal` there is a one-row grid (`grid-auto-flow: column`), so `.w-keep-error` becomes a third column between the seal and "Not now". The message wraps to about 7 lines (122px), the row grows from 60px to 180px, and the seal drops to the middle. It does not sit under the seal.
   - Where: writer.css `@media (max-width: 760px) .w-grid:not(.rail) .w-keep-seal` with `.w-keep-error`.
   - Size: 390.
   - Evidence: I inserted the real error markup. The grid columns were 145 / 120 / 60px, the error was at x178 with width 120 and height 170, and the seal moved from y1029 to y1089.
   - Rules: checklist (no clipped or cramped text; error states designed), 42 (failure wears the house style).
   - Fix: on a phone, give `.w-keep-error` `grid-column: 1 / -1; grid-row: 2` (or make the row `flex-wrap: wrap` with the error at `flex-basis: 100%`).

3. **The editing page says the title twice and the number twice, and calls an old memory "a page for today".** On `/write?edit=…` at 1366, the left page's heading is the memory's title, and the title line on the right page holds the same title. The kicker reads "EDITING MEMORY NO. 8" directly under the verso running head "MEMORY NO. 8". The recto running head reads "A PAGE FOR TODAY" for a memory kept weeks ago. Because the heading is the title, a long title also triggers the phone's fourth step: 19px for titles over 72 characters, smaller than the 20px words under it, and 3 lines from about 90 characters at every size.
   - Where: Write.tsx `kicker`, `heading` (`editing.title`), the verso `running-head` and the recto fallback `chapterName(d.era) || (spread ? "A page for today" : bookName)`.
   - Sizes: all four (on a phone the heading sits above the book and the title is in it).
   - Evidence: DOM at 1366×768: `.w-question` = "Funding a startup through pitch competitions", `.wtitle` value = the same, `.w-qkick` = "EDITING MEMORY NO. 8", verso = "THE VO BOOK / MEMORY NO. 8", recto = "A PAGE FOR TODAY".
   - Rules: 19 (nothing twice), 28 (a running head that knows where you are), 33 (the headline hierarchy).
   - Fix: when editing, set the kicker to "Editing" and the heading to the memory's question, or a fixed line such as "Change what you like", never its title. Put the book's name, or the memory's period, on the recto when there is no chapter.

4. **At 1366×641 (Edge with its bars), nothing under the book is in the first screen.** The Keep bar starts at y641, exactly the bottom of the window. The seal is at 650 and "Speak instead" at 685. Speaking is the one way to begin without typing, and no hint shows that it or the seal exists. Once there are words the bar follows, but an empty page never shows it.
   - Where: `.spread` desk spacing: `.sheet-page .page.w-desk` padding-top 56px, the book's top at 142, `.spread .w-keep` margin-top 16.
   - Size: 1366×641, and any laptop window under about 735px tall. It fits at 1366×768.
   - Evidence: book 142–625, `.w-keep` 641–730, `.w-tool.speak` 685–733, innerHeight 641.
   - Rules: 9 and the checklist ("the main content within one screen"), 11 in spirit.
   - Fix: add a `(max-height: 740px)` step that brings the bar's top above about 540px. Cut the desk's padding-top to about 20px, hide `.w-sub` on the left page, and tighten the left page's gap and padding by about 60px.

5. **On a phone the "Kept" stamp lands on "Not now".** The stamp starts 16px right of the seal button (x194) and is 148px wide ("KEPT · 17 OCT"), so it runs to x342. "Not now" sits at x298–358 in the same row.
   - Where: Write.tsx `inkStamp(right, …, { offsetX: 16, align: "start" })` with the phone's one-row keep.
   - Size: 390.
   - Evidence: the seal button is at 33–178. I measured a real `.ink-stamp` element at 148px and the `.w-keep-note` link at 298–358.
   - Rules: 44 (decoration never covers words), checklist (no overlapping).
   - Fix: once `pressed`, hide `.w-keep-note`, since "Not now" means nothing after a keep. Or on a phone, land the stamp above the seal.

6. **Today's question links are 41px tall on a laptop's height.** The `(max-height: 900px)` step sets `.spread .leaf-left .w-q { padding: 8px 0 }`, so each row is 41px.
   - Where: writer.css, the max-height 900 block.
   - Sizes: 1366×768 and 1366×641 (49px at 1920×1000).
   - Evidence: all three `a.w-q` measure 41×410.
   - Rule: checklist (touch target at least 44px).
   - Fix: `min-height: 44px` with `display: flex; align-items: center` on `.w-q`, keeping the 8px padding.

7. **"2020s" sits alone on the third row of the decade chips.** The When column wraps the 9 decades 4, 4, 1.
   - Where: Afterwards, `.w-choice` "When it was", `.chiprow`.
   - Sizes: 1366, 1920 and 2560 (rows of 4/4/1 at each).
   - Evidence: chip tops grouped by row gave [4, 4, 1] at all three sizes.
   - Rule: 10 (no orphans).
   - Fix: set that row as a three-column grid (3/3/3), or let the date-in-words field share the last row.

8. **The hero reads "Kept in The Vo book."** The capital T is set mid-sentence. A story without a last name would read "Kept in Your book."
   - Where: Write.tsx Afterwards hero, using `bookNameOf` (OpenLeaf.tsx line 35 builds the same name; check its uses too, per rule 1).
   - Sizes: all.
   - Evidence: h1 innerText "Kept in The Vo book." on both Afterwards pages.
   - Rule: 20 (honest, careful copy) and the book's typography.
   - Fix: give `bookNameOf` a mid-sentence form ("the Vo book", "your book") for use inside a sentence.

9. **Small print and type details.**
   - On `/write?q=faith-pray-now` the sub has a straight apostrophe ("you're"), next to curly ones everywhere else ("Today’s"). It comes from the question bank.
   - At 390 the `/write` sub leaves "radio." alone on its second line.
   - Rules: 10 and 16.
   - Fix: smart-quote the question text when it is rendered, and add `text-wrap: pretty` to `.w-sub`.

## Same fault elsewhere (rule 1, outside the writer's files)

- Companion, InkDot and Prints no longer use GSAP's built-in easings. They remain in `src/lib/atmosphere.ts:48` (power3.out), `src/lib/pillThumb.ts:39` (power3.inOut) and `src/lib/tilt.ts:18–19` (power3.out). Rule 23.
- "Press ? for shortcuts" (rule 43) still appears nowhere in `src`.

## Not verified

- Pressing Keep, the seal, the stamp and the "Kept" label: not pressed, by instruction. I checked the stamp's place from the code's geometry and a measured stand-in element, the error with the real markup inserted by hand, and "Kept" by reading the code.
- Reduced motion: checked in the code only. The pane cannot emulate it.
- A real zoomed-out Edge window: 3840×2000 at zoom 2 stood in for it.
- Speak, Tidy, Suggest a title, "What am I not saying?" and the photo upload states.
- Hover and focus-visible: read in writer.css (every control has them) and not seen in screenshots. Pane screenshots at large sizes are too scaled to judge detail.

## Housekeeping

- On `/write` (own words) I typed one line, cleared it, and removed the draft that created (`astory-draft-f6a9b0de-…83e3`).
- Opening `/write?edit=59632e67…` created a draft on load (finding 1). I removed that key.
- The draft for beeedb62 was 370 characters before and after. I opened only its Afterwards view, which writes nothing.
- No daily-question counter exists in localStorage, so opening `/write?q=…` counted nothing (the account appears to be on a paid plan).
- I pressed Focus and Escape, and nothing else that acts.
- I did not sign out or touch auth.
- I reset my tab's viewport and closed it.
