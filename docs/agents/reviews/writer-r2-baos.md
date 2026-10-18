# Writer, round 2: Bao's Standard

**FAIL.** 8 findings, ranked worst first. Most of round 1 is fixed. What is left is mostly small print, but the running head is still broken at all four sizes.

Checked in my own browser-pane tab at 1366×768, 1920×1000, 2560×1300 (--zoom 1.3) and 390×844 (touch emulation, pointer: coarse). Pages: `/write`, `/write?q=faith-pray-now` (the link in Home's hero), and Afterwards via `/write?edit=59632e67…&details=1` and `/write?edit=beeedb62…&details=1`. I stepped GSAP by hand and measured with getBoundingClientRect, computed styles and scrollWidth. I also read Write.tsx, writer.css, stamp.ts, OpenLeaf.tsx and WeekInk.tsx.

## Round-1 items, re-checked

| Round-1 item | Now |
|---|---|
| Dog peeking, not covering | Fixed. `cover-paper.webp` (a paw over the eyes) fades in once there are words: sleep 0, awake 1. |
| Question's hint repeated as a starter | Fixed. The starters are generic ("It was the year…"). The hint stays under the question. |
| Running head wrapped | **Not fixed. Now it is clipped instead** (finding 1). |
| Disabled seal at 0.36 | Fixed. Opacity is 1 and the colour is ink-soft (rgb 107,98,91). Enabled, it is #9A4320. |
| Focus mode lost the measure | Fixed. The body is 559px at 22px (25.4em), the question comes onto the page and the top bar is hidden. |
| Afterwards repeated title, number and "Anything else" | Partly fixed. The title is shown once, and "Anything else" is gone from the kept page's head. The number still appears twice (finding 7). |
| Phone Afterwards choices below the fold | Fixed. The choices come first. The first decade chip is at y=442 of 844. |
| Keyboard hint on touch | Fixed. `.w-kbd-hint` shows only under (hover:hover) and (pointer:fine). At 390 the note reads "Not now" only. |
| Raw vw | Fixed. writer.css has no vw or vh that is not divided by --zoom. |
| Built-in easings | Fixed in the writer files: OUT and MOVE only. The one exception is `ease: "none"` on stamp.ts's reduced-motion crossfade, which is acceptable. |
| 36px title field | Fixed on desktop (44px). **Still wrong on a phone** (finding 5). |
| No Where to next | Fixed on Afterwards. **Step 1 still has none** (finding 4). |
| Initials circles | Fixed. Monogram seal: Cormorant 600 in terracotta inside a double foil ring. |
| Orphaned folio dot | Fixed. On a phone the folio stacks and the dot is hidden. |
| SS: headline 3 lines | Fixed. The question is 2 lines at every size. The Afterwards h1 is 1 line (48px). |
| SS: kept title lost the cascade | Fixed. Cormorant Garamond 28px/600. |
| SS: Keep bar over the left page at 1920 | Fixed. From 1560px up, the seal is in the rail. |

## Findings

1. **The running head on the right page is cut off with an ellipsis at all four sizes.**
   - Where: `.leaf-one .running-head .rh-chapter` (Write.tsx line 1010; writer.css: `white-space: nowrap`, `overflow: hidden`, `text-overflow: ellipsis`, `padding: 0 44px`).
   - Sizes: 1366, 1920, 2560 and 390.
   - Evidence: `scrollWidth > clientWidth` is true at every size. On screen, 1366/1920/2560 read "FAITH & WHAT CARRIED … ✦ OCT 17 · LATE AT NIGHT", and 390 reads "FAITH & WH… ✦ OCT 17 · LATE AT NIGHT".
   - Rules: checklist "no clipped text", 14 (the running head), 28 ("a running head that knows where you are").
   - Fix: do what a printed book does and set only the chapter on the recto. Move the date and part of day to the folio line, where there is room.

2. **The same reassurance is said twice on step 1.** The pencil note says "A few lines is plenty." and the Keep note under the seal says "A line or two is enough to keep". On `/write` the sub also says "Anything at all…".
   - Where: `.w-pencil` (left page) and `.w-keep-note > span` (Write.tsx lines 863 and 955).
   - Sizes: 1366, 1920 and 2560. On a phone the Keep note's sentence is hidden and there is no pencil, so it is said once.
   - Evidence: read from the DOM on `/write` and `/write?q=faith-pray-now`.
   - Rule: 19 (don't repeat the same promise twice).
   - Fix: delete the Keep note's sentence and keep the pencil note, which is the more characterful of the two.

3. **In the rail, the Keep note wraps and leaves "Not now" alone on a second line, after a dangling "·".**
   - Where: `.w-keep.in-rail .w-keep-note`.
   - Sizes: 1920 and 2560.
   - Evidence: the note is 252px wide and 39px tall (2 lines at 19.5px). The span is on line 1 (top 583), and the link starts line 2 (top 589.7, x 1473). It is 2 lines at 2560 too.
   - Rule: 10 (no orphans).
   - Fix: finding 2 removes the sentence, so "Not now" sits alone on one line. Or set "Not now" as its own quiet row under the seal.

4. **Step 1 of the writer does not end with "Where to next".** It ends at the seal and "Not now".
   - Where: Write.tsx, the step-1 return (no `<WhereNext>`).
   - Sizes: all four.
   - Evidence: `document.querySelector('.where-next')` is null on `/write` and `/write?q=…`.
   - Rules: 38 and the checklist ("ends with Where to next").
   - Fix: at the very bottom of the desk, after the book, add the three ruled rows (Archive, Home, the next of today's questions) where they can't compete with the page. Or have the founder rule the writer exempt and record that in the standard.

5. **On a phone, the empty title field is 60px tall (two lines) for a one-line placeholder.** That leaves an empty line between "A title, if one comes to mind" and "Dear family,".
   - Where: `.wtitle` auto-height (Write.tsx lines 576–581).
   - Size: 390.
   - Evidence: `style.height` is 60px, scrollHeight is 60 and line-height is 29.9px. The placeholder shows on one line, with title top at 389.6 and "Dear family," at 469.6.
   - Rules: checklist "no empty screens or holes", 17a.
   - Fix: while the value is empty, set the height to one line-height and not to scrollHeight. Chrome counts the wrapped placeholder in scrollHeight.

6. **On a phone, the empty "Kept" status still takes space in Afterwards.** The gap from the explanation to the first rule is 64px, where the head's spacing intends about 28px.
   - Where: `.w-state` (min-height 24px plus the column gap) inside `.w-choices-head` at max-width 760px.
   - Size: 390.
   - Evidence: note bottom 319, empty `.w-state` 331–355, first `.w-choice` top 383.
   - Rule: 9 (no wasted ground) and the craft rule "the gap inside a section is smaller than between sections".
   - Fix: on a phone, position `.w-state` absolutely at the head's top right, or give it zero height while it is empty. Keep it in the DOM for aria-live.

7. **Afterwards shows the memory number twice.** It is in the hero's "Memory No. 8" and again in "Read memory No. 8" under Where to next. When editing, the first row's line ("Write another / The changes are in the book") describes what just happened, not where the row goes.
   - Where: Write.tsx lines 313–318 and 770.
   - Sizes: all four.
   - Evidence: `.where-next` innerText at 1366 is "Write another | The changes are in the book | Read memory No. 8 | As it is set in the book | Home…"
   - Rules: 19 and 38 (a title and one line about the destination).
   - Fix: title the row "Read it in the book", and give "Write another" a line about where it goes ("A new page, in your own words").

8. **At 1366×768, the sticky Keep slip floats over the open book as the page arrives.** It covers the lower ruled lines of the right page and the left page's pencil note. At 390 it covers the page below the first ruled line.
   - Where: `.w-grid:not(.rail) .w-keep` (sticky, bottom).
   - Sizes: 1366 and 390.
   - Evidence: at 1366 the book runs from y170 to y1066 and the slip from y667 to y756, over both pages. At 390 the slip runs from 686 to 763, and the body starts at 573.
   - Rule: checklist "no overlapping".
   - Fix: at a laptop height, reduce the page's minimum lines (10 down to about 7 when the window is under 820px tall) so the book and slip fit together on arrival. Or let the slip stick only once the caret goes below the fold.

## Same fault elsewhere (rule 1, outside the writer's files)

- GSAP's built-in easings are still used in `src/components/delight/Companion.tsx` (power3.out, power2.in), `InkDot.tsx` (power3.out, and `power1.in`, an ease-in on UI) and `Prints.tsx` (power2.out). Rule 23 asks for the house curves.
- "Press ? for shortcuts" (rule 43) appears nowhere in `src`.

## Not verified

- Reduced motion: checked in the code only (gsap.matchMedia no-preference, the CSS reduce block, stamp.ts's quiet branch). The pane cannot emulate prefers-reduced-motion.
- A zoomed-out Edge window: only the 1.3 --zoom at 2560 was observed.
- Pressing Keep, the seal and the stamp, Speak, Tidy, Suggest a title and "What am I not saying?": not pressed, by instruction.
- Error banners and the photo upload states.
- Hover and focus-visible: checked by reading writer.css (every control has them, and touch targets are at least 44px by measurement) but not seen in screenshots.

## Housekeeping

I typed into `/write?q=faith-pray-now` to check the dog, the seal and focus mode, then cleared it and removed only the draft that created (`astory-draft-…-q-faith-pray-now`). One draft was already there before I started (`astory-draft-…-beeedb62-…`). I left it alone. Opening `/write?q=…` runs the Free plan's daily-question count (Write.tsx line 535). If the founder's account is on Free, that page view may have used one of today's questions. I clicked nothing on Afterwards, and I did not sign out or touch auth.
