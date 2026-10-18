# Skills Steward: the Archive, the memory page, and PrintCard and MemoryCard on Home, round 4

**Verdict: NOT APPLIED.** There are no blockers. Five gaps are ugly and nine are polish. Of the 14 round-3 gaps, 11 are closed, two are partly closed (2 and 13) and one is still open (7).

## How this was checked

- **Skills read:**
  - taste-skill: SKILL.md, plus the layout, type and critique references.
  - hallmark: SKILL.md, plus the anti-patterns, slop-test, interaction-and-states and responsive references.
  - emil-design-eng.
  - impeccable: SKILL.md, plus the craft-floor, critique, polish and layout references.
  - gsap-scrolltrigger, gsap-timeline, gsap-react and gsap-performance.
  - humanizer, for the copy.
  - Also read: BAOS-STANDARD.md, DESIGN.md and archive-r3-skills.md.
- **Code read:**
  - Everything in `components/archive/`, including the new `serverTidy.ts` and its test.
  - `PrintCard.tsx`, `MemoryCard.tsx`, `Mosaic.tsx`, `lib/memoryDisplay.ts`, `pages/MemoryPage.tsx`, `pages/Archive.tsx`, and all of `styles/pages/archive-reading.css`.
  - The rules in `astory.css` for `.mem`, `.print-card`, `.rise` and reduced motion.
- **Rendered:** in my own pane tab (tab-70), at 1366×768, 1920×1000, 2560×1300 (zoom 1.3) and 390×844, force-reloaded. I stepped the frame clock with `__gsap.ticker.tick()` and measured with JavaScript; I also took screenshots.
  - The Archive in Prints view, and in List view at 390 and 1366.
  - Memory pages: 59632e67 (photo, treasured), 342e4b40 (long call, no photo), beeedb62 (typed lines, Vietnamese) and a missing id.
  - Home's print row at 1366 and 390.
- **Tests:** `vitest run src/components/archive` passes: 3 files, 23 tests, including `serverTidy.test.ts`. `tsc --noEmit` reports no errors.
- **Not verified:**
  - The decade rail and decade row: no memory is dated.
  - The chapter tabs: only one chapter, so the row is hidden, and the round-3 4px alignment could not be measured.
  - The empty states (`InvitePrint`, `.arc-empty`), the Archive load-failure state and the in-progress rows: checked in code only.
  - `serverTidy` is off (`VITE_TIDY_FROM_SERVER` unset), so it was checked in code and tests only.
  - Below-the-fold reveals: in this background tab, `window.scrollTo` fires no scroll event because no frames are drawn. Each reveal played once I dispatched a scroll event, so this is a harness artefact, not a page fault.

## The five deleted components

Nothing in `src` imports `ActionTiles`, `YearStrip`, `BookCard`, `ProfileCard` or `Photographs`, and there is no `arc-ytile` query. The only other mentions are in docs (`docs/audit/AUDIT-2026-10-17.md:46`, `docs/research/reading-2026.md:305`).

Their CSS is still shipped (gap 12): `.arc-book`, `.arc-profile`, `.arc-top`, `.arc-hint`, `.arc-viewrow` and `.ystrip` match no TSX.

## Round-3 gaps, checked

| # | Round-3 gap | Now |
|---|---|---|
| 1 | Home's prints arrived twice | **Done.** PrintCard's `rise` defaults to false, and Mosaic passes `rise={false}`. On Home, 0 of 6 prints carry `.rise` or a keyframe; only the cell's `data-rise` arrival runs. |
| 2 | Typed print's words cut | **Partly done.** At 1366 the whole sentence shows (2 of 3 lines). Two cases remain: phones still cut a 78-character sentence (gap 2), and from 1600px the words are small in a mostly empty card (gap 1). |
| 3 | Teller credit disagreed | **Done.** `tellerParts` and `wasSpoken` are now shared. List cards and "From the book" say "Told by Bao in conversation", as the memory page does. |
| 4 | `.mem` hover, resting shadow, no `:active` | **Done.** No shadow at rest; one 2px lift under `(hover:hover) and (pointer:fine)`; `:active` scales to 0.98 at 120ms on `.mem` and `.print-card`. The new transform transition clashes with the GSAP rise, though (gap 3). |
| 5 | Phone tool row orphaned "•••" | **Done.** At 390, "Photograph", "Add words" and "•••" sit on one 54px row. |
| 6 | Pending row's side stripe | **Done.** It is now a tone step (`--paper-tone`) with padding all round. |
| 7 | "a year· about" | **Not done on a laptop** (gap 6). |
| 8 | Bar alignment; raw values | The margin reset is present, but the alignment could not be measured (no chapter row). Raw values are now named, but in the page sheet and partly duplicated (gap 13). |
| 9 | Dead code and stale comments | **Done in TSX**: the motion hooks, the five components, the `Cards` prints branch, the `.arc-ytile` query, the duplicate Face and the "tile above" comment are all gone. The CSS remains (gap 12). |
| 10 | Raw error text | **Done.** AudioPlayer, FamilyVoices and Archive now say what failed and what to do. |
| 11 | Blank loading; dog on Missing | **Done.** There is a skeleton under Shell's drawn mark (`aria-busy`). Missing shows `/dog/curious-paper.webp`, measured loaded at 390. |
| 12 | Phone titles ending in an ellipsis | **Done.** Titles run whole, and titles over 45 characters are set at 16px. "Losing grandparents and preserving a grandfather's story" is 3 lines at 390. |
| 13 | First print too low at 390 | **Done, with a side effect.** Prints/List sit in the search row, and 162px of the first print shows above the tab bar (was 66px). The search placeholder is now clipped (gap 5). |
| 14 | "40% Of the way" | **Done.** It reads "40% toward the first edition". |

## Gaps, skill by skill

### Ugly

1. **Taste (substance; every screen a composed poster), BAOS 8 and 17.** On large screens, the typed card is mostly empty paper with small words.
   - **Where:** archive-reading.css:366 (17px) and :576 (3 lines). No rule above 1600px enlarges the card's words.
   - **Measured at 1920:**
     - The card is 375px square, and the person's words are 17px on 25px lines.
     - 179px of empty ruled lines sit between the words and the caption.
     - The title under them is 21px, larger than the words.
   - **Measured at 2560:** the same proportions (a 472px frame).
   - **Change:** add `@media (min-width: 1600px) { .arc-prints .print-card.typed .frame { --lh: 30px; --top: 36px } .arc-prints .print-card .typed-in .said { font-size: 22px; -webkit-line-clamp: 5 } }`. The words are the card's picture, so they should be at least the size of the title.
2. **Taste (full content), BAOS 17; round-3 gap 2 on the phone.** A typed card's sentence is still cut on phones, on the Archive and on Home.
   - **Where:** archive-reading.css:603 (3 lines) and transcript.ts:320 (`cardLine` falls back to sentences of up to 90 characters).
   - **Measured at 390:** "It's been challenging, but I think it's why we have the opportunity to get it." needs 4 lines and shows 3, ending "…have the opportunity…". There is 43px of clear space under it on the Archive and 53px on Home; a fourth line needs 22px.
   - **Change:** on phones, allow 4 lines when the caption has no kicker or date (keep `:has(.cap .kicker, .cap .dateline.dated)` at 2). Or have `cardLine` take a phone maximum of about 60 characters.
3. **GSAP (one owner per property; do not let a CSS transition fight a tween), BAOS 25.** In the List view, the rise is tweened on an element that also carries a CSS transform transition.
   - **Where:**
     - archive-reading.css:584 gives `.arc-page .mem` `transition: transform 160ms`.
     - `useRiseOnScroll(listRef, ".arc-cards > *, …")` (Archive.tsx:176, motion.ts:318–336) tweens `y` on that same `.mem`.
   - **Measured at 1366 in List view:** after GSAP finished and cleared its props, the second card stayed at `translateY(15.66px)`: the CSS transition took over the cleared transform. With live frames, the card trails every GSAP frame by 160ms and settles late, out of line with its neighbour.
   - **Change:** declare the transform transition only where it is used, `.arc-page .mem:is(:hover, :active) { transition: transform 160ms … }`, so the resting card has no transform transition. Or rise a wrapper and leave `.mem` to the hover and press.
4. **Hallmark (clickable affordances read whole), taste (no cut text).** On a phone, the search field clips its own placeholder.
   - **Where:** Archive.tsx:376, archive-reading.css:569.
   - **Measured at 390:** moving Prints/List into the row (round-3 gap 13) left the input 126px wide. "Search your memories" in 18px EB Garamond italic is 151px, so it shows as "Search your mem".
   - **Change:** below 760px, use the placeholder "Search", or "Search memories" at 16px. The label already carries the full sentence for screen readers.
5. **BAOS 32 (one takeaway: the card's excerpt, the line set large, and the coda are the same sentence), taste (substance).** The card and the page choose the kept line by different rules.
   - **Where:**
     - transcript.ts:305–321: `cardLine` looks for a sentence of 45 characters or fewer, then for joined typed lines.
     - MemoryPage.tsx:204: the page's `keptLine`.
     - MemoryCard.tsx:36–46: falls back to `quoteFor(…, 150)`.
   - **Measured:**
     - 59632e67: the list card shows "I mean, that was awesome.", but the page sets no kept line and no coda.
     - beeedb62: the card shows "We live in a small city · It's in Vietnam", and the page again sets none.
     - f6a734be's list card is cut mid-sentence at 2 lines: "I was doing a PhD back then, but halfway in I realized…" (it holds 157px of text in a 52px box).
   - **Change:**
     - Make one function return the takeaway, and use it on the page, the card and the coda. When the page has none, the card shows the first whole sentence that fits.
     - Give MemoryCard the same fallback as PrintCard, and never use `quoteFor` with an ellipsis.
     - Consider dropping a leading "I mean" from a card line, since the line is shown out of context.

### Polish

6. **Taste (set type, not typed text); round-3 gap 7, still open on a laptop.** The year task reads "Give eight memories a year ·about 2 minutes".
   - **Where:** ArchiveGroups.tsx:43–45 and archive-reading.css:415. `.arc-task` is an `inline-flex` box with `gap: 0`. The `{" · "}` text node is now outside the span, but it still ends an anonymous flex item, so its trailing space is trimmed.
   - **Measured at 1366 and 1920:** the " · " node ends at x=1100, and `.arc-task-t` starts at x=1100.
   - **Change:** set `.arc-task { column-gap: 0.3em }`. Or move the separator into the span (`<span className="arc-task-t">· about…</span>`), with the gap set on the flex box.
7. **Hallmark gate 49 (clickable text never wraps), BAOS 10.** In the List view on a phone, the task link breaks as "about 2 / minutes →".
   - **Where:** archive-reading.css:520 (`white-space: normal`).
   - **Change:** set `.arc-task-t, .arc-task-arrow { white-space: nowrap }`, so the time and arrow move to the second line together.
8. **Taste (set type).** On a phone, the tidy note's second line starts with a separator: "· Read it word for word".
   - **Where:** MemoryPage.tsx:376–384 and archive-reading.css:537 (`.mv-tidy-act { white-space: nowrap }` keeps the dot with the link).
   - **Change:** below 600px, hide the `aria-hidden` dot and set the button on its own line. Or draw the dot as `.mv-tidy-act::before` and hide it when the button wraps.
9. **Impeccable (states: an error is not an empty state), BAOS 42, the Riley persona.** Two failure states are not designed.
   - **The family's section:**
     - **Where:** FamilyVoices.tsx:103–110, where `.catch(() => live && setLoaded(true))` swallows a failed load.
     - **Problem:** a failed load shows "Nobody else has added their side yet."
     - **Change:** keep an error state: "Couldn't load what the family added. Try again" with a 44px retry.
   - **The Archive load failure:**
     - **Where:** Archive.tsx:239–247.
     - **Problem:** it is the generic accent banner, but Missing now has the dog.
     - **Change:** give it the same sheet as Missing: the dog, one headline, one line of cause and remedy, and one action.
10. **Taste type §7, hallmark (minor: straight quotes).** Copy that does not go through `smarten` renders straight apostrophes. Measured on Missing: "That memory isn't here.", "can't see".
    - **Where:**
      - MemoryPage.tsx:108–109, 276, 309, 404 and 438;
      - Archive.tsx:214 and 243–244;
      - ArchiveGroups.tsx:125;
      - AudioPlayer.tsx:182;
      - FamilyVoices.tsx:143 and 158;
      - ReadAloud.tsx:139;
      - Mosaic.tsx:113.
    - **Change:** type ’ in these strings, or pass them through `smarten`.
11. **BAOS 41, hallmark (empty states: a picture, why it is empty, an action).** Neither empty state has the dog or the time it takes.
    - **Where:** `InvitePrint` (Mosaic.tsx:104–125) and `.arc-empty` (Archive.tsx:349–358). `InvitePrint` also lays the sample family's picnic behind "Nothing here yet."
    - **Change:**
      - Use a Bond pose instead of the sample photograph.
      - Add one line with the minutes ("A few lines; about five minutes").
      - Keep one action.
12. **Impeccable polish (remove obsolete styles and duplication; comments true).** The CSS still carries dead and superseded rules.
    - **Dead rules for the deleted components:**
      - `.arc-book`, `.arc-profile`, `.arc-top`, `.arc-hint` and `.arc-viewrow`: astory.css 837–908, 1746, 2533, 2593, 2893, 2897, 2974–2975 and 3032;
      - `.ystrip`: astory.css 2620, 2699–2705 and 2817.
    - **Stacked overrides in archive-reading.css:**
      - `.typed-in .said` sets its line clamp at 366, 367, 373, 525, 528, 576, 578, 579, 593, 603 and 604.
      - `.arc-view .chip.big` is set to 36px at 348, then 44px at 490.
      - `.cap .title` is clamped at 476 and 486, then unset at 575.
      - The comment at 359 still says "six at 1920"; it is four from 1100px.
    - **Change:** delete the dead rules, and fold each selector into one rule in the section it belongs to.
13. **Hallmark gate 48 (locked tokens), DESIGN.md ("the tokens live in astory.css §1").** The new tokens are declared in the page sheet (archive-reading.css:13–15), and three duplicate existing values:
    - `--print-white` = `--paper-print` (#FFFDF8);
    - `--night-ink` = paper (#F3EBDD);
    - `--night-soft` = `--on-chocolate-soft` (#D9CFC2).

    None of them has a dark-theme value. `color-mix(… , black)` at :210 is a raw colour.

    **Change:** move the tokens to astory.css §1, reuse the three existing tokens, and add `--danger-deep`.
14. **Impeccable (comments and docs say what renders).** The chapter's paper tint is computed but never seen.
    - **Where:** MemoryCard adds `sage`, `apricot` and so on (`paperFor`), but `.sheet-page .mem { background: var(--paper-print) }` (astory.css:2923) wins.
    - **Measured:** "mem text sage" renders rgb(255, 253, 248).
    - **Claims that disagree:** the MemoryCard header comment and DESIGN.md (Components, the memory card) both say "paper tinted by the memory's colour or its chapter".
    - **Change:** decide either way. Let the tint show on the sheet (`.sheet-page .arc-page .mem.sage { background: var(--paper-sage) }`…), or drop `paperFor` from the card and correct both texts.

### Also noted (not counted as gaps)

- **`serverTidy` (off).** Fix these before switching it on:
  - When the server's paragraphs arrive, they replace the local ones with no transition, so a reader who has started gets the text reflowed under them. Emil's rule is to prevent jarring changes, and BAOS 23a says nothing jumps. Apply the result only before the reader scrolls into the words (otherwise use it next visit, from the cache), or crossfade at 150ms.
  - The gold mark in the body is found with `text.indexOf(kept)` against the raw kept line (MemoryPage.tsx:76–79, 204). The server's capitals and full stops will usually break that match, so the mark disappears when the tidy lands. Match ignoring case and punctuation, or take the kept line from the shown paragraphs.
  - `Promise.all` sends one request per teller run at once; a long call with many "We asked" breaks fires many. Run them in sequence or batch them.
  - The word check, the localStorage cache keyed by a hash, and the fallback to the local cleaner are sound, and the test covers accept and refuse.
- **Photograph size.** Print cards load full-size photographs (naturalWidth 1122–1200px for a 254px card at 1366). If storage offers resized renditions, request a width near twice the card's (hallmark responsive images; impeccable optimize).
- **First screen on the memory page.** At 1366, the words of 342e4b40 start at y=525 (round 3 measured 480). The kept line grew from 20px to 25px, which the BAOS review asked for, and "Add when it was" takes its own 44px row. Moving that link into the teller row would win back about 44px.

### Emil's review table

| Before | After | Why |
| --- | --- | --- |
| `.arc-page .mem { transition: transform 160ms }` on the element GSAP rises | Transition only on `.mem:is(:hover, :active)`, or rise a wrapper | A CSS transition chasing a tween lags it and can strand it mid-way |
| Server-tidied paragraphs swapped in mid-read | Apply before the reader reaches the words, or crossfade at 150ms | Text reflowing under the eye is a jarring change |
| Typed-card words at 17px under a 21px title at 1920 | 22px words on 30px lines, 5 lines | The words are the card's picture; the size should say so |

## Brand rulings applied (the brand wins over the skill)

- The kept line's low gold marker (74–90% of the line) is the marketing site's underline, which the round-3 BAOS review asked for. That overrides hallmark gate 35's x-height band.
- Hairline-ruled list cards, small-caps kickers, and the cream and terracotta palette are the printed book's language (DESIGN.md).
- The print's slow photo drift on hover follows DESIGN.md rule 1 ("materials move").

## Clean on this pass

- **Layout:** no horizontal scroll at 390, 1366, 1920 or 2560.
- **Targets:** every control I measured is 44px (Prints/List, the task link, the tools, "•••", the page turn and the back link).
- **Focus:** the global `:focus-visible` ring reaches the prints, and the page's own rings are on every tool.
- **Motion:**
  - Reduced motion is covered by the global 1ms rule, plus the explicit rules in the sheet.
  - Every GSAP hook is inside `gsap.matchMedia` with a revert, uses `fromTo` with `clearProps`, and animates only transform and opacity.
  - A filter is a 150ms crossfade.
  - The DecadeNav marker tweens `y` only.
- **Reading:** 22px at 1366 and 23px at 2560. Drop caps are 3 lines on a laptop and 2 on a phone. `lang="vi"` is now set on the Vietnamese run in beeedb62.
- **Prints:** no `.rise` on Home's prints. The typed card at 1366 shows the whole sentence. Titles run whole at every width.

## Shared state

- When I opened the tab, the stored view was "prints". I switched to List to check it, then switched back, and read "prints" back from `localStorage` at once.
- When I closed the tab, the key read "list". By then my tab had not been on the Archive since the restore, so another tab sharing the pane changed it. I did not overwrite it, in case that change was intended.
- I did not touch `astory-app-auth`, did not sign out, and wrote no data. Tab-70 is closed and its viewport is reset.
