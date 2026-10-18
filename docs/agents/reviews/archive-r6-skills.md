# Skills Steward: the Archive, the memory page, and PrintCard, MemoryCard and Mosaic on Home, round 6

**Verdict: NOT APPLIED.** There are no blockers. Two gaps are ugly and six are polish. Of the 7 round-5 gaps, 4 are closed, 2 are partly closed (5 and 7), and 1 is closed for the List cards but the same fault has appeared on the photo prints (6).

## How this was checked

- **Skills read:**
  - taste-skill: SKILL.md, plus the layout, type and critique references.
  - hallmark: SKILL.md, plus the anti-patterns, slop-test, interaction-and-states and responsive references.
  - emil-design-eng.
  - impeccable: SKILL.md, plus the craft-floor, critique, polish and layout references.
  - gsap-scrolltrigger, gsap-timeline, gsap-react and gsap-performance.
  - Also read: BAOS-STANDARD.md, DESIGN.md and archive-r5-skills.md.
- **Code read:**
  - Everything in `components/archive/`, including the new `develop.ts` and `__fixtures__/calls.ts`, `LITTLE_RESTART`, `MEANT_TWICE` and `opensOn` in `transcript.ts`, `mayApplyTidy` in `serverTidy.ts`, `motion.ts` and `ArchiveGroups.tsx`.
  - `MemoryCard.tsx`, `PrintCard.tsx`, `Mosaic.tsx`, `pages/MemoryPage.tsx`, `pages/Archive.tsx`, and the bar in `Shell.tsx` and `lib/pillThumb.ts`.
  - All of `styles/pages/archive-reading.css`. In `astory.css`: the `.mem` and `.print-card` rules, every `.home-mem` rule, and §16 and §63.
- **Tools run:**
  - `vitest run src/components/archive` passes: 3 files, 42 tests. `tsc --noEmit` prints nothing.
  - taste-skill `lint.mjs` on the changed files reports 47 FAIL and 8 WARN. All but one are brand-exempt: the kickers, hairlines, book-material gradients and shadows, and the ✦ ornaments are book material by DESIGN.md. The exception is the ✓ glyph (gap 8).
- **Rendered:** in my own pane tab (tab-103), force-reloaded, at 1366×768, 1920×1000, 2560×1300 (html zoom 1.3) and 390×844. The bar was also checked at 761, 900, 901 and 1000. I stepped the frame clock with `__gsap.ticker.tick()`, measured with JavaScript, and took screenshots.
  - The Archive in both views.
  - All eight memory pages and a missing id.
  - Home's prints at 390 and 1366.
- **Not verified:**
  - The pane was hidden, so its CSS transitions and animations stay frozen until a frame is drawn. Some opacity fades were caught partway through (a print photo, the running head, From the book's opening quote). I counted only what the code and the measured state confirm.
  - Reduced motion and keyboard order were checked in code only.
  - The decade rail and the chapter tabs: no memory is dated, and there is only one chapter.
  - The Archive's load failure, the empty archive, `InvitePrint` and the in-progress rows: checked in code only.
  - `serverTidy` is still off: checked in code and tests only.
  - The impeccable detector was not run.

## Round-5 gaps, checked

| # | Round-5 gap | Now |
|---|---|---|
| 1 | Search placeholder clipped on the phone | **Done.** Below 760px the placeholder is "Search": 125px of 125px, whole. The label keeps the full sentence. |
| 2 | Fallback takeaway points back ("That paid for…") | **Done.** `POINTS_BACK`, the first-person ranking, `ENDS_WHOLE` and a test with the real 59632e67 text are all in. That memory now reads "You always have to just look for every opportunity." on the page, the List card, the print and Home. It is marked in its last paragraph, so it has no coda. |
| 3 | "about 2 / minutes →" breaks | **Done.** At 390, "about 2 minutes →" is one line box (y=597). The arrow is inside `.arc-task-t`. |
| 4 | Typesetting: the joining dot, orphans | **Done.** `JOIN` is a no-break space, a middle dot and a space. Typed lines are not quoted under the title. `text-wrap: pretty` is on the List excerpt and the typed print. No excerpt ends on an orphan at 1366. |
| 5 | Prints as grey boxes while loading; full-size photographs | **Partly done.** The photograph and the veil now wait for `data-loaded`. But the caption stays and becomes unreadable while it waits (gap 1). The photographs are still full size (gap 7). |
| 6 | List card's hover lift snaps back | **Done for the List.** The resting `.mem` transitions transform for 160ms. GSAP sets `transition: none` while it rises and clears it after. **The same fault now hits the photo prints** (gap 3). |
| 7 | Stale comments, dead and stacked CSS | **Partly done.** The archive-reading header comment and DESIGN.md are correct, and the dead three-column rule is gone. Stacked and dead rules remain (gap 6), and one of them sets a 10px kicker on Home (gap 4). |

Round-5 "also noted":
- **Done:**
  - `mayApplyTidy` treats words in view as being read, and it has a test.
  - `findTakeaway`, `opensOn` and `balance` have tests.
  - Shell's straight apostrophe is fixed.
- **Unchanged:**
  - The memory title has no house full stop.
  - The words still start at y=525 on 342e4b40 at 1366.

## Gaps, skill by skill

### Ugly

1. **Hallmark (contrast gates 40–41; loading is a designed state), impeccable craft floor (contrast; states: loading), taste critique pass 8.** While a photograph loads, its print shows the white caption straight on cream paper. The title cannot be read.
   - **Where:** archive-reading.css:469–470 hides the `.pic` and the `.veil` until `data-loaded`. The `.cap` stays: white with a text-shadow (astory.css:2406), on `.frame`'s cream (`rgb(234,224,207)`, astory.css:2400). Contrast is about 1.3:1.
   - **Measured:** at 1920 on a fresh load, the four photographs took 0.7–1.3s. At 1366 and 1920, Home and the Archive showed "Funding a startup through pitch competitions" and the other three titles as faint white on cream (screenshots). This affects all four photo prints, on both pages, on every cold visit.
   - **Change:** give the print a dark developing ground while it waits, so the caption always reads. For example, `.print-card:has(.pic:not([data-loaded])) .frame { background: var(--album-black) }` with the veil left on, then fade the photograph over it. Or fade `.cap` and `.marks` in with the veil: `.print-card .pic:not([data-loaded]) ~ .cap { opacity: 0 }`, on the same 240ms transition. The print's `aria-label` already carries the title.
2. **Impeccable polish (no duplication), taste (substance: every line earns its place), BAOS 19 and 32.** When the spoken words open on the takeaway, the page sets the same sentence twice in a row: large under the title, then again as the first words about 100px below.
   - **Where:** MemoryPage.tsx:212–214. `keptHead` is dropped only when the words open on it *and* were typed (`opens && !spoken`). For speech it stays, and `markIn` is turned off.
   - **Measured at 1366:**
     - On c21cf4d4, the line under the title is "I just lost my grandparents, both on my dad's side, my grandparents this year." The words then open with the same sentence (screenshot).
     - 0ced62a7 does the same with "I think Daniel's story is a very good idea…".
     - That is two of the eight memories, both on the first screen. The code's own comment says "said twice at most, never twice in a row".
   - **Change:** when `opens` is true, set nothing under the title for speech as well, and mark the opening sentence in place with the gold marker (`markIn = !!kept`, `withMark` on paragraph 0). The coda rule can stay as it is. Add a case to the transcript tests or a small unit test with the GRANDPARENTS fixture.

### Polish

3. **Emil (exit never a jump; specify the properties), round-5 gap 6 in a new place.** A photo print's slow hover zoom snaps back when the pointer leaves.
   - **Where:** archive-reading.css:469 sets `.print-card .pic { transition: opacity 240ms … }`. Because this file loads later, that replaces astory.css:2402's `transition: transform 600ms`. On hover, astory.css:2456 scales to 1.04 over 4s. On leave, the resting rule has no transform transition, so 1.04 jumps to 1.
   - **Measured:** the computed `transition` of a resting `.pic` at 1366 is `opacity 0.24s cubic-bezier(0.23, 1, 0.32, 1)` only.
   - **Change:** `.print-card .pic { transition: opacity 240ms var(--ease-out), transform 600ms var(--ease-out); }`. Keep the reduced-motion `none`.
4. **BAOS 16 (nothing under 12px), impeccable polish (obsolete styles).** On Home, a photo print with a chapter or a date sets its kicker at 10px and its dateline at 11px.
   - **Where:** astory.css:3427–3428 (`.home-mem .print-card:not(.invite) .cap .kicker { font-size: 10px }`, `.dateline { 11px }`). Their specificity is 0,5,0, so they beat the floors at astory.css:3704–3705 and archive-reading.css:477–478 (0,4,0).
   - **Measured at 390:** I added a kicker and a dateline to a cloned photo print (removed afterwards) and they computed 10px and 11px. Today no photo print on Home has a chapter or a date, so this is latent, but the first dated memory will show it.
   - **Change:** delete astory.css:3427–3428. The floors already set 12px and 13px.
5. **Hallmark (one clear affordance per purpose; gate 36), impeccable layout (adaptation).** The bar from §63, between 761 and 900px:
   - **The good:** it holds:
     - At 761 and 900 the four places are present, 44px tall, and none wrap.
     - The pill is centred, with 46px and 108px gaps on each side.
     - The tab bar is off, and there is no horizontal scroll.
     - The thumb sits under "Archive" after a resize.
   - **The two seals:** with the storyteller's words gone, the bar shows two identical "BV" seals, the storyteller and the account, with only the Add button between them. A reader cannot tell the picker from the account.
   - **Just past the range:** from 901 to about 952px, the name returns and the right column outgrows its `1fr`. At 901 the pill sits 16px from the storyteller and 143px from the lockup, 20px off centre.
   - **Where:** astory.css:3780–3784 (§63), with astory.css:220 (`grid-template-columns: 1fr auto 1fr`).
   - **Change:** between 761 and 900, show the storyteller's given name ("Bao ⌄") in place of their seal. That is about the seal's width, and it is the clue the seal loses. Extend the range to `max-width: 960px`.
6. **Impeccable polish (no obsolete styles or duplication; comments say what renders), hallmark gate 50; round-5 gap 7, the rest.**
   - **`.home-mem .mosaic`** is declared seven times in astory.css: :3422, :3452, :3456, :3602–3603 and :3748–3749. The one at :3602 is dead, and it holds images in a bare `minmax(200px, 1fr)` track.
   - **Stacked in archive-reading.css:**
     - `.arc-page .mem .excerpt` at :380 and :430.
     - `.arc-prints .mosaic` at :357, :364 and :545.
     - `.arc-task` at :412, :420–425 and :510.
     - The List card's hover and transition at :555–560 and :602.
     - The "Round 3" and "Round 4" sections (:486, :514) are patches, not sections.
   - **Stale comment:** Mosaic.tsx:2–7 still describes a large lead print, "three across (two on a phone)", and the quote taking the large frame. Home renders `mosaic even`, three across at 1366.
   - **Change:** fold each selector into one rule in the section it belongs to, delete the dead ones (and the 10px and 11px rules from gap 4), and correct the Mosaic comment.
7. **Impeccable optimize (image size), emil (perceived performance); round-5 gap 5, second half.** The photographs are still full size.
   - **Measured:** the images are 1122–1200px wide, for prints of 244px (Home at 1366) to 375px (the Archive at 1920). They took 0.7–1.3s to load at 1920. No `width=` is passed (PrintCard.tsx:216, MemoryCard.tsx:63).
   - **Change:** request a rendition of about twice the print's width from storage (Supabase image transform, `?width=`), or add a `srcset`. This also shortens how long gap 1 shows.
8. **Impeccable craft floor (no Unicode glyph standing in for an icon).** The Public/Private menu marks the chosen option with a "✓" character.
   - **Where:** ToolMenu.tsx:118.
   - **Change:** use the existing `CheckIcon` (icons.tsx:45) at 16px in `--mv-terra`.

### Also noted (not counted as gaps)

- **A weak fallback takeaway.** 0ced62a7's line, "I think Daniel's story is a very good idea in terms of generation and legacy keeping as well.", is about the product rather than the teller's life. The better sentence, about "very tight bondings with my grandparents", is just over the 140-character cap, and `FEELING` lacks "memorable" and "bond". This is worth a look when the takeaway rules are next touched.
- **The memory title still has no house full stop** (MemoryLead.tsx:64–73). I leave this to the BAOS review, as in round 5.
- **The List at 1920 and 2560 is two columns of wide row cards.** A short line such as "How to end chay." leaves most of a card empty. This is a documented choice (archive-reading.css:367–370), so it is not counted.
- **Latent:**
  - An archival print (`data-era="archival"`, before 1975) is masked for its scalloped edge (archive-reading.css:461–463). The mask also clips the global focus outline. No memory is dated yet.
  - The pill thumb is measured only on `resize`. Under device emulation, which fires no resize, it stayed 0px wide when the page grew from 390 to 761, leaving "Archive" chocolate on chocolate. A real resize corrects it, so this is not counted. A fallback background on `[aria-current]` would make it robust.

### Emil's review table

| Before | After | Why |
| --- | --- | --- |
| `.print-card .pic { transition: opacity 240ms }` (archive-reading.css:469) replaces the 600ms transform | `transition: opacity 240ms var(--ease-out), transform 600ms var(--ease-out)` | The 1.04 hover zoom snaps to 1 on pointer-out |
| Waiting print: the veil hidden, the white caption on cream | A dark ground (or a caption that fades with the veil) until `data-loaded` | 1.3:1 text for up to 1.3s on every cold visit |
| 1122–1200px photographs for 244–375px prints | A rendition at about twice the print's width | The wait in gap 1 shortens with the bytes |

## Brand rulings applied (the brand wins over the skill)

- The small-caps kickers, the hairline rules, the foil ✦ ornaments, the print lift and the photo corners are the printed book's language. They are book material by DESIGN.md, so taste-lint's FAILs on them are not counted.
- The cream and terracotta palette is the brand's own.

## Clean on this pass

- **The takeaway:** every place agrees for all eight memories:
  - the line under the title (where it is set), the gold mark, the coda, the List card, the print, and Home's "From the book".
  - There is no coda when the mark is in the last paragraph (59632e67, 342e4b40). A memory that is only its takeaway (f9b0e6e9) is set once.
- **Transcript rules:**
  - "faster and faster" and "not only … but then" survive (fixture tests).
  - `LITTLE_RESTART` touches only little words.
  - `MEANT_TWICE` keeps "very, very" and "had had".
- **Motion:**
  - Every hook is inside `gsap.matchMedia` with a revert, and uses `fromTo` with `clearProps` that includes `transition`.
  - After stepped scrolling at 1366, all eight List cards ended at opacity 1 with the CSS transition back.
  - Only transform and opacity animate.
- **Layout:**
  - No horizontal scroll at 390, 761, 900, 1366, 1920 or 2560 (zoom 1.3).
  - Prints are four across from 1100px, two on the phone, and three on Home at 1366.
  - Typed prints are whole at every width: 22px at 1920, and 15px with nothing clipped at 390.
  - Nothing overflows on the memory page at 390.
- **The not-found page:** one headline with the foil stop, one line of cause and remedy, one action, and curled apostrophes.

## Shared state

- When I opened my tab, the stored view was "prints".
- I switched to List at 1366 and back to Prints at 390. At 761 it read "prints".
- At 2560 it read "list", which another tab had set (I made no click in between). It still read "list" when I left, and I left it so as not to undo another agent's choice.
- I did not touch `astory-app-auth` (still present), did not sign out, and wrote no data. The clone used in gap 4 was a hidden copy added to the page in my tab only and removed at once.
- Tab-103 is closed and its viewport reset.
