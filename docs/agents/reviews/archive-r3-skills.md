# Skills Steward: the Archive and the memory page, round 3 (plus PrintCard and MemoryCard on Home)

**Verdict: NOT APPLIED.** There are no blockers left. Six ugly gaps and eight polish gaps remain, listed below.

## How this was checked

- **Skills read:** taste-skill (SKILL.md, layout, type, critique), hallmark (SKILL.md, anti-patterns, slop-test, interaction-and-states, responsive), emil-design-eng, impeccable (SKILL.md, craft-floor, critique, polish, layout), and gsap-scrolltrigger, gsap-timeline, gsap-react and gsap-performance. Also read: BAOS-STANDARD.md, DESIGN.md and reading-2026.md §3. The other installed skill that applies is humanizer, for the copy.
- **Code read:** every file in the round-3 list, plus Mosaic.tsx, WaxSeal.tsx, lib/arrive.ts, lib/memoryDisplay.ts and the astory.css rules for `.print-card`, `.mem` and `.rise`.
- **Rendered:** in my own pane tab, at 1366×768, 1920×1000, 2560×1300 and 390×844. I stepped the frame clock with `__gsap.ticker.tick()` and measured with JavaScript.
  - Archive in Prints view.
  - Memory pages: 342e4b40 (long call, no photo), 59632e67 (photo, treasured), beeedb62 (typed lines, no photo) and f9b0e6e9 (chat).
  - Home's print row.
- **Not verified:**
  - Screenshots: the pane returned cropped or timed-out captures, so the findings rest on measurements, not pictures.
  - The List view: I did not switch to it, to leave the founder's stored view preference alone.
  - The decade rail and decade row: no memory is dated, so neither renders.
  - `lang="vi"`: no rendered memory contains Vietnamese, so it was checked in code only.
- **Tests:** `vitest run src/components/archive` passes (16 tests).
- **Earlier reports:** none are saved in `docs/agents/reviews/` (only signed-out and writer reports are there). I checked the round-2 Skills Steward list as the coordinator relayed it to the builder.

## Round-2 gaps, checked

| # | Round-2 gap | Now |
|---|---|---|
| B1 | `ownWords()` in both cards | Done in PrintCard, MemoryCard and `resurface.opening`. Leftover: the teller credit (gap 3 below). |
| B2 | Phone typed print: the title overlapped the quote | Fixed. At 390 the smallest gap between the quote and the caption is 29px on the Archive and 41px on Home. On the deviation, see gap 2. |
| B3 | Archive cards hidden by `.rise` plus the scroll hook | Fixed. With frames frozen, every Archive print reached opacity 1 after scrolling. Home still has the double entrance (gap 1). |
| U4 | `realChapter` in PrintCard and the Shell title | Done |
| U5/6 | 44px targets; the inline `minHeight: 40` | Prints/List and the chapter tabs measure 44px, and the inline height is gone. The decade row is set to 44px in CSS but could not be seen. |
| U7 | Phone chapter chips | They wrap now; none is hidden. |
| U8 | Year task in two ragged columns | Now one run under the heading, but the text reads "a year· about" (gap 7). |
| U9 | Phone hero | Three figures on one row; the hero is 295px. |
| U10 | Words start too low; kept line set three times | Words start at y=480 at 1366 (was 522) and y=488 at 390 (was 575). The kept line is the coda only on a phone, and 2 lines at 20px at 1366. |
| U11 | Titles running to 3 lines | At 1920 without a photo the head column is 440px and the title 36px, so 2 lines. The phone seal sits inline. |
| U12 | Duplicate back link | "Ask the family" replaces it. |
| P13 | DecadeNav marker tweened `height` | Now `y` only, 0.24s on MOVE, with the tween killed on cleanup. |
| P14 | Three hooks on the year row | Split by the fold; `.arc-year` is excluded from the rise. |
| P15 | Filter replays the arrival | Now a 150ms opacity crossfade. |
| P16 | Glint took 900ms | Now 300ms. |
| P17 | Hovers not gated | Gated in archive-reading.css. `.mem` is still ungated in astory.css §9 (gap 4). |
| P18 | Treasure specks | Start at scale 0.5. They use `gsap.context` + `ctx.add` in `useEffect`, which gsap-react accepts when `@gsap/react` isn't installed (it isn't). Accepted. |
| P19 | States | `not-allowed` on disabled controls; a solid 2px textarea ring; "Try again" is 44px; the ToolMenu opens upward near the foot (measured: "mv-menu up" at y 530–680, button at 688). |
| P20 | Raw values into tokens | Partly done (gap 8). |
| P21 | Faces in cards | Face.tsx is used in both cards. MemoryLead keeps its own copy (gap 9). |
| P22 | Drop cap and highlight band | Plain `--chocolate`, no fill, `initial-letter: 3`. The band runs 38% to 88%. |
| P23 | Copy | "Told by" on the page, better kept lines, "but yeah" dropped. The stale FamilyVoices comment is still there (gap 9). |
| P24 | Two menu items went to one place | Merged into "When, chapter and who's in it". |

## The builder's phone typed-print deviation

The ask was a 3-line title and 128px padding. The builder chose a 3-line title, 108px padding and a one-line quote.

- **The 3-line title and the 108px reserve are right.** I measured no overlap anywhere. The tightest case is the Childhood card with its kicker: 29px clear at 390.
- **The one-line quote is not right.** It is what the typed card has instead of a photograph, and at 15.5px in a 130px column one line holds about 20 characters: "My grandfather was a…", "My co-founder has never…". That is a stub, not the person's words (taste: substance; BAOS 17). There is room for a second line: 44px clear on the Archive and 41px on Home once titles run 3 lines, and a second line needs 22px.

Ruling: keep 108px and the 3-line title, and allow 2 lines of quote. Use 1 line only on a card whose caption also carries a kicker or a date (`.typed:has(.cap .kicker, .cap .dateline.dated)`). See gap 2.

## Gaps, skill by skill

### Ugly

1. **Emil (frequency, one entrance), impeccable craft floor (one authored moment), hallmark (animate-on-scroll on everything), BAOS 25.** Home's prints arrive twice.
   - **Where:** `Mosaic.tsx:76–77` puts `data-rise` on each cell for `lib/arrive`, but never passes its `rise` prop to PrintCard. So PrintCard keeps its default `rise = true` (`PrintCard.tsx:69, 105, 108`) and each card also runs the CSS `.rise` keyframe (astory.css:501). On Home at 390, all 6 cards carry `animation-name: rise` inside cells held at opacity 0 by GSAP: two entrances on one element, and the CSS one depends on the frame clock.
   - **Change:** in Mosaic, render `<PrintCard … rise={false} />` whenever the cell carries `data-rise`. Better still, default PrintCard's `rise` to false so only one hook owns each entrance.
2. **Taste (substance, full content), BAOS 17.** The typed print's picture is a cut sentence at every size.
   - **Where:** archive-reading.css:367 (2 lines at 1366), :526 and :529 (1 line on phones).
   - **Measured:** at 1366 the 60-character kept line "My grandfather was a police officer and he was a good man." shows as "…and he was…", even though 38px sit free under it. On phones it is one line (see the deviation above).
   - **Change:**
     - Phone: clamp to 2 lines unless the caption carries a kicker or a date.
     - 1366 Archive: clamp to 3 lines (a third 25px line fits in the 38px).
     - Or have `keptLine` take a `max` and prefer a whole sentence of 45 characters or fewer for cards, so the card shows a whole sentence.
3. **Impeccable (consistency, copy), BAOS 1 and round-2 #8 applied everywhere.** The teller credit disagrees between surfaces.
   - **Where:** `lib/memoryDisplay.ts:22–26` (`toldBy`) checks `memory.audio` only. Home's "From the book" therefore prints "Choosing a startup over finance graduate study · Written by Bao", while that memory's page says "Told by Bao in conversation". The same function feeds `FromTheBook.tsx:30` and MemoryCard's `title` and screen-reader text (`MemoryCard.tsx:100–102`).
   - **Change:** use the memory page's rule (`audio || familyCallId || soundsSpoken(body)` gives "Told by"), in one shared helper.
4. **Hallmark gates 13 and 26 (one hover signal; active state), Emil (gate hovers; press feedback), taste (no shadows at rest).** The list-view card `.mem` breaks these, and the List view is the phone default.
   - **Where:** `.mem` is styled in astory.css §9 (lines 413–422):
     - an ungated `:hover` that lifts, deepens the shadow, and turns and scales the inner print;
     - a box shadow on the card at rest;
     - no `:active` state.

     PrintCard (astory.css 2459–2522) also has no `:active`.
   - **Change:** override in archive-reading.css:
     - wrap `.arc-page .mem:hover` in `(hover:hover) and (pointer:fine)` with one signal (the 2px lift);
     - drop the resting shadow for a tone step;
     - add `.mem:active, .print-card:active { transform: scale(0.98) }` at 120ms.
5. **BAOS 10 (no orphans), hallmark (clickable rows reflow, not orphan).** On a phone, the memory page's tool row leaves "•••" alone on a second line.
   - **Where:** `MemoryPage.tsx:391–411` and archive-reading.css `.mv-tools`.
   - **Measured:** at 390, "Add a photograph" (179px) and "Add to the words" (171px) fill the row. "•••" sits alone at y=1502 and the row is 99px tall.
   - **Change:** under 600px, use short labels ("Photograph", "Add words"), or `flex-wrap: nowrap` with a smaller gap, so all three stay on one 44px row.
6. **Impeccable craft floor (a coloured `border-left` above 1px on list items is refused), hallmark (side-stripe).**
   - **Where:** archive-reading.css:251, `.mv .fv-row.pending { border-left: 2px solid var(--foil) }`.
   - **Change:** mark a waiting line by its "Waiting for you" label and a tone step (`background: var(--paper-tone)`, padding all round), not a stripe.

### Polish

7. **Taste (set type, not typed text).** The year task reads "Give eight memories a year· about 2 minutes".
   - **Where:** `.arc-task` is a flex container, so the leading space of `<span className="arc-task-t"> · about…` is dropped (`ArchiveGroups.tsx:50–51`). Measured: " a year" ends at x=1092 and the span starts at 1092.
   - **Change:** put the separator outside the span (`{" · "}<span>…`), or use `display: inline` on the task.
8. **Hallmark gate 36 (bars centred), gate 48 (locked tokens).**
   - **Alignment:** Prints/List sit 4px lower than the chapter tabs (y=449 against 445 at 1366 and at 1920). astory.css:2943 (`.sheet-page .chiprow.scroll:is(.arc-chips…) { margin-bottom: var(--s-2) }`, specificity 0,4,0) beats archive-reading.css:344 (`margin: 0`, 0,3,0). Raise the selector or reset that margin.
   - **Raw values left:**
     - archive-reading.css:81: the photo corners are a 3-stop gradient with an rgba drop shadow;
     - :215: the menu shadow;
     - :317, :319, :332: cloth hairlines in `rgba(246,240,230,…)` and a black drop shadow;
     - :444: the seal shadow;
     - the `var(--x, #hex)` fallbacks, now redundant since the lead defined the tokens.

     Name them in `:root` once.
9. **Impeccable polish (remove dead code and duplication; comments true).**
   - `motion.ts`: `useHeroArrival` and `usePolaroidArrival` are unused, and both use `"power3.out"` instead of the house OUT.
   - `components/archive/{ActionTiles,YearStrip,BookCard,ProfileCard,Photographs}.tsx` are imported nowhere.
   - `ArchiveGroups.tsx` `Cards`: its prints branch (Mosaic) is unreachable.
   - `Archive.tsx:144` queries a stale `.arc-ytile`.
   - `MemoryLead.tsx:20` duplicates the new `Face.tsx`.
   - `FamilyVoices.tsx:116` still says "opened from the tile above" (round-2 #23).
10. **Impeccable copy (errors name the problem and the recovery, never the technical detail), the Riley persona.** Raw error text reaches people:
    - `AudioPlayer.tsx:376`: "({failed})" can be a storage message;
    - `FamilyVoices.tsx:142, 156`: `err.message`;
    - `Archive.tsx:228`: `${loadError}`.

    Say what failed and what to do; log the detail.
11. **Hallmark (skeleton over blank), BAOS 42.**
    - `Archive.tsx:223` and `MemoryPage.tsx:154–159` render an empty `.page` while the account loads. Draw the hairline skeleton with the mark.
    - `Missing()` (MemoryPage.tsx:87) has a headline, a cause and an action, but not the dog that BAOS 42 asks for.
12. **Taste (headlines whole, no orphan words), hallmark gate 51.** On phones, "Losing grandparents and preserving a grandfather's story" ends in an ellipsis after 3 lines, on the Archive and on Home (17px in a 170px card). Allow 4 lines when the card has no kicker, or 16px for titles over 45 characters.
13. **Taste (the first screen shows the work), BAOS 9.**
    - **Measured at 390:** the tools take 153px (search, then chapters, then Prints/List, each on its own row), and the first print starts at y=715. Only 66px of it shows above the floating tab bar at 781.
    - **Change:** put Prints/List at the end of the search row on phones (the field can give up 140px). That saves 56px.
14. **Humanizer (sentence case for running text).** On a phone the book share reads inline as "40% Of the way to the first edition" (`Archive.tsx:244`).
    - **Change:** lower-case "of" when it runs inline, or write "40% toward the first edition".

### Emil's review table

| Before | After | Why |
| --- | --- | --- |
| PrintCard `.rise` keyframe inside a `data-rise` cell (Home) | One entrance: the cell's GSAP rise only | Two entrances on one element; the keyframe depends on the frame clock |
| `.mem:hover` lift + shadow + print rotate/scale, ungated | `(hover:hover) and (pointer:fine)`, one 2px lift | Taps stick on phones; one signal per element |
| No `:active` on `.mem` / `.print-card` | `transform: scale(0.98)` at 120ms | Pressable things must answer the press |
| `useHeroArrival` / `usePolaroidArrival` on `"power3.out"` | Delete them, or use `OUT` | Dead code, and not the house curve |

### Clean on this pass

- **Hallmark gates:** no `transition: all`, no ease-in, no italic headings, no horizontal scroll at 390, 1366, 1920 or 2560, and image tracks use `minmax(0, 1fr)`.
- **Focus:** a terracotta focus ring on every tool.
- **Reduced motion:** covers the menu, the photo corners and the transitions.
- **GSAP:** every hook is in `gsap.matchMedia` with a revert; tweens use `fromTo` with `clearProps`; transform and opacity only.
- **Reading spec:** 22px at 1366, 23px at 1920, a 25.4em measure, no paragraph over 8 lines on the long call, and the drop cap only on a first paragraph of 600 characters or fewer.
- **Photograph:** the plate is a straight print, sticky, never cropped, with portraits centred in their column.
- **Toggles:** "Lightly tidied" switches to the exact words.
