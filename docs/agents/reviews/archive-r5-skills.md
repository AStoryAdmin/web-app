# Skills Steward: the Archive, the memory page, and PrintCard and MemoryCard on Home, round 5

**Verdict: NOT APPLIED.** There are no blockers. Two gaps are ugly and five are polish. Of the 14 round-4 gaps, 11 are closed, two are partly closed (4 and 12) and one is still open (7).

## How this was checked

- **Skills read:**
  - taste-skill: SKILL.md, plus the layout, type and critique references.
  - hallmark: SKILL.md, plus the anti-patterns, slop-test, interaction-and-states and responsive references.
  - emil-design-eng.
  - impeccable: SKILL.md, plus the craft-floor, critique, polish and layout references.
  - gsap-scrolltrigger, gsap-timeline, gsap-react and gsap-performance.
  - Also read: BAOS-STANDARD.md, DESIGN.md, archive-r4-skills.md and archive-r4-baos.md.
- **Code read:**
  - Everything in `components/archive/`: the new `LedgeNote.tsx`, `takeaway()` and `findTakeaway()` in `transcript.ts`, `balance()` in `photos.ts`, and `serverTidy.ts` (still off).
  - `MemoryCard.tsx`, `PrintCard.tsx`, `Mosaic.tsx`, `lib/resurface.ts`, `lib/atmosphere.ts`, `pages/MemoryPage.tsx` and `pages/Archive.tsx`.
  - All of `styles/pages/archive-reading.css`, plus §1 and the `.mem`, `.print-card` and `.home-mem` rules of `astory.css`.
- **Rendered:** in my own pane tab (tab-88), at 1366×768, 1920×1000, 2560×1300 (html zoom 1.3) and 390×844, force-reloaded. I stepped the frame clock with `__gsap.ticker.tick()`, measured with JavaScript, and took screenshots.
  - The Archive in both views at all four sizes.
  - All eight memory pages, compared with their List card, their print and Home's "From the book".
  - A missing id (`/archive/59632e67`), to see the not-found page.
  - Home's prints at 390 and 1366.
- **Tests:** `vitest run src/components/archive` passes: 3 files, 28 tests. `tsc --noEmit` prints nothing.
- **Not verified:**
  - The decade rail and decade row: no memory is dated.
  - The chapter tabs: there is only one chapter.
  - The Archive's load failure and empty archive (both `LedgeNote`), `InvitePrint`, FamilyVoices' failed load and the in-progress rows: checked in code only.
  - `serverTidy` is off (`VITE_TIDY_FROM_SERVER` unset): checked in code and tests only.
  - Reduced motion, keyboard focus order and the lightbox were not exercised this round.

## Round-4 gaps, checked

| # | Round-4 gap | Now |
|---|---|---|
| 1 | Typed card mostly empty at 1600+ | **Done.** At 1920 and 2560 the words are 22px on 30px lines (title 21px), with up to five lines. |
| 2 | Typed sentence cut on phones | **Done.** At 390 the 78-character line shows whole in four lines (84/84px), on the Archive and on Home. |
| 3 | CSS transition fighting the GSAP rise | **Done.** The resting `.mem` transitions only `background-color`. After the List rise, all eight cards read `transform: none` and opacity 1. |
| 4 | Search placeholder clipped on the phone | **Partly done.** The placeholder is now "Search memories", but it is still 18px italic and clipped (gap 1). |
| 5 | Card and page choose different lines | **Done.** One `takeaway()` feeds the page, the coda, the List card, the print and Home. All eight memories agree. The fallback now picks poor lines, though (gap 2). |
| 6 | "a year ·about" | **Done.** At 1366 and 1920 there is a 4–5px gap between " · " and "about". |
| 7 | Task link breaks "about 2 / minutes →" | **Not done** (gap 3). |
| 8 | Tidy note's dot starts line 2 | **Done.** At 390 "Read it word for word" has its own line and the dot is gone (`::before` is `none`). |
| 9 | Failure states not designed | **Done in code.** FamilyVoices says "Couldn’t load what the family added." and offers a 44px "Try again". The Archive's failure is a `LedgeNote`. |
| 10 | Straight apostrophes | **Done in scope.** No straight apostrophes remain in the copy of these files (only in comments). |
| 11 | Empty states without the dog or the time | **Done.** `InvitePrint` shows Bond asleep, "about five minutes" and one action. The empty Archive is a `LedgeNote` with the sleep pose, the minutes and one button. |
| 12 | Dead and stacked CSS | **Partly done.** The rules for the deleted components are gone. Stale comments and stacked overrides remain (gap 7). |
| 13 | Tokens in the page sheet | **Done.** They are in astory.css §1, with dark values for the lifts and `--danger-deep`. `--night-*` stay as raw values because the full view is night in both themes. |
| 14 | Chapter tint computed but unseen | **Done.** The tint is dropped. The MemoryCard comment and DESIGN.md both say "never tinted". |

## Gaps, skill by skill

### Ugly

1. **Hallmark (clickable affordances read whole), taste (no cut text); round-4 gap 4, still open.** On a phone, the search field still clips its placeholder: "Search memorie".
   - **Where:** Archive.tsx:394; archive-reading.css:540 (`.arc-search { flex: 1 1 0 }`, beside Prints/List).
   - **Measured at 390:** the input is 126px wide (122px of content), and "Search memories" in 18px EB Garamond italic is 132px (`scrollWidth` 132 > `clientWidth` 126). The screenshot shows "Search memorie".
   - **Change:** below 760px, either set `.arc-search input::placeholder { font-size: 16px }` (about 117px), or use the placeholder "Search". The label keeps the full sentence.
2. **BAOS 32 (the thing a skimming reader should remember), taste (substance).** When there is no kept line, `takeaway()` can choose a sentence that points back to something the reader never sees. That sentence is then set large in gold, marked in the words, repeated as the coda, and used on the List card and the print.
   - **Where:** transcript.ts:388–406 (step 3 of `takeaway`). `OUT_OF_CONTEXT` (:356) strips "So", leaving "That paid…"; `OPENS_WEAK` (:278) does not cover "That", "This", "It", "They" or "He". `DANGLES` (:305) also rejects a sentence ending "…I’ve been in.", because it reads the final "in" as dangling.
   - **Measured:** on 59632e67 (the Archive's first memory), the line under the title, the gold mark in the first paragraph, the coda, the List card and the print all read "That paid for an engineer that got all of the licenses for our games on the Cozy platform." The "that" is the $50,000 from two sentences earlier. The opening sentence, "The first time I won, I’ve won every pitch competition I’ve been in.", was passed over because of `DANGLES`.
   - **Change:**
     - In the fallback, skip a sentence that opens on a pointing word ("That", "This", "It", "They", "He", "She", "Those") unless it carries a `FEELING` word.
     - Rank first-person sentences ("I", "We", "My") above third-person ones.
     - Let `DANGLES` pass a final preposition after "been", "live", "grew up" and the like ("…I’ve been in.").
     - Add a test with the 59632e67 text.

### Polish

3. **Hallmark gate 49 (clickable text never wraps); round-4 gap 7, still open.** In the List view on a phone, the task link still breaks as "about 2 / minutes →".
   - **Where:** the cause is specificity. `.sheet-page .arc-page .arc-year .arc-task span { white-space: inherit }` (archive-reading.css:471) beats the new `.arc-task .arc-task-t, .arc-task .arc-task-arrow { white-space: nowrap }` (:616). The phone rule at :502 sets the link to `white-space: normal`, so the spans inherit `normal`.
   - **Measured at 390:** `.arc-task-t` has three line boxes: "about" and "2" at y=576, then "minutes" at x=42, y=597.
   - **Change:**
     - Delete `white-space: inherit` from :471, or raise :616 to `.sheet-page .arc-page .arc-year .arc-task :is(.arc-task-t, .arc-task-arrow)`.
     - Put a no-break space before the arrow, or put the arrow inside `.arc-task-t`, so that "about 2 minutes →" moves to the next line as one piece.
4. **Taste type §7–8 (set type, not typed text: no orphan word, no separator starting a line).** Three small typesetting faults in the shared words:
   - **The joined typed lines.** `takeaway()` joins them with " · " (transcript.ts:382).
     - On the phone print, the dot starts line 2: "We live in a small city / · It’s in Vietnam".
     - Under the memory's title, the same dot sits inside quotation marks, as if the person had typed it.
     - **Change:** join with " · " so the dot stays at the end of its line. For the quotation under the title, consider the verse convention " / ".
   - **The List excerpt.** It ends on an orphan: at 1366 the c21cf4d4 excerpt ends with "year." alone on line 2.
     - **Where:** astory.css:447 and archive-reading.css:423/604 set no `text-wrap`.
     - **Change:** add `text-wrap: pretty` to `.arc-page .mem .excerpt` and to `.print-card .typed-in .said` (which already has it in astory.css; keep it in the archive overrides).
5. **Impeccable (states: loading; optimize: image size), taste critique pass 8 ("anything a grey box").** While their photographs load, the photo prints are grey boxes under the dark caption scrim. The photographs are also full size.
   - **Where:**
     - astory.css:2441 gives `.frame` the `--sheet` background, :2445 shows the veil at once, and :2443 shows the `.pic` with no fade. The image is set in PrintCard.tsx:111 and in MemoryCard.tsx:61.
   - **Measured at 2560 on a fresh load:** the four images were requested 9.2s after navigation and took 1.2–2.1s each. For that time the prints read as grey tiles with a brown gradient (seen at 1366, 1920 and 2560). The images are 1122–1200px wide for prints of 170–488px.
   - **Change:**
     - Do as the plate already does: hide the `.veil` and the `.pic` until `onLoad`, then fade them in over about 240ms.
     - Request a rendition near twice the print's width, if storage offers one (for example Supabase's `?width=`).
6. **Emil (exit faster than enter, but never a jump).** A List card's hover lift snaps back when the pointer leaves.
   - **Where:** archive-reading.css:591–592. The transform transition exists only on `:is(:hover, :active)`, so on leaving, the resting state's transition (background only) applies and `translateY(-2px)` jumps to 0.
   - **Change:** let GSAP own the transition while it owns the rise. In `useRiseOnScroll` (motion.ts:89–90), `gsap.set(items, { transition: "none" })` before the tween and include `transition` in `clearProps`. The resting `.mem` can then carry `transition: transform 160ms var(--ease-out), background-color 160ms` again.
7. **Impeccable polish (no obsolete styles or duplication; comments and docs say what renders); round-4 gap 12, the rest.**
   - **Stale comment:** archive-reading.css:305–309 still says the prints are "six or so across" and the list "two columns on a wide screen". It is four prints from 1100px, and the list has four columns from 1600px.
   - **Dead rule:** :481–482 ("three columns from 1680") is always overridden by :597 (four from 1600).
   - **Stacked list rules:** the list grid is declared at :368–374 and again at :593–603.
   - **Stacked line clamps:** Home's typed card sets its line clamp in two files: astory.css:3487 and :3664, then archive-reading.css:566, :567, :576, :584 and :586.
   - **The cause of gap 3:** :471 is itself one of these stacked overrides.
   - **DESIGN.md (Components, the memory card)** still says "two lines of the person's own words". The excerpt is now whole: up to four lines at 390.
   - **Change:** fold each selector into one rule in the section it belongs to, delete :481–482, and correct the comment and DESIGN.md.

### Also noted (not counted as gaps)

- **`serverTidy` (off).** The round-4 notes are addressed: the requests run in sequence, and the gold mark is found by `findTakeaway` ignoring case and punctuation. One thing is left before switching it on:
  - The "already reading" test (serverTidy.ts:122–124) needs both "the words are in view" and `scrollY > 40`. At 1366 the words start at y=525, on the first screen, so a reader who has not scrolled is still treated as not reading, and the text can reflow under them.
  - **Fix:** count the words being in view as reading on their own, or apply a result only if it arrives within about 600ms of the first paint.
- **Tests.** There is no unit test for `findTakeaway` or `balance`. Both carry rules from round 4 (matching once tidied; never starting a paragraph on "But then").
- **The memory title has no house full stop** (MemoryLead.tsx:64–73). The Archive's h1 and every `LedgeNote` title have one. BAOS 33 asks for it on display titles; I leave the call to the BAOS review.
- **Outside this scope:** Shell.tsx:122 has "isn't" with a straight apostrophe. It shows in the TellerPick sheet, which opens from the Archive's phone hero.
- **First screen on the memory page.** As in round 4, the words of 342e4b40 start at y=525 at 1366, and "Add when it was" still takes its own 44px row.

### Emil's review table

| Before | After | Why |
| --- | --- | --- |
| `.arc-page .mem` resting `transition: background-color` only; transform transition only on `:hover`/`:active` | GSAP sets `transition: none` during its rise and clears it; the resting card transitions `transform 160ms` | The 2px lift snaps back on pointer-out instead of settling |
| Print `.pic` and `.veil` shown before the image loads | Hidden until `onLoad`, then a 240ms opacity fade, as on the memory page's plate | A grey tile under a brown scrim reads as broken for 1–2 seconds |
| `.arc-task-t` wraps inside "about 2 minutes" on the phone | `white-space: nowrap` that actually wins, with a no-break space before the arrow | Clickable text never breaks across lines |

## Brand rulings applied (the brand wins over the skill)

- The low gold marker under the kept line, the hairline-ruled cards, the small-caps kickers, and the cream and terracotta palette are the printed book's language (DESIGN.md and earlier rulings).
- The black album photo corners and the print lift are book material.
- Bond on a foil hairline (`LedgeNote`) is the house's own empty and failure language (BAOS 41 and 42).

## Clean on this pass

- **Layout:** no horizontal scroll at 390, 1366, 1920 or 2560 (zoom 1.3). Prints are four across from 1100px and two on the phone, in even rows. The List has four columns from 1600, with tops aligned.
- **One takeaway:** for all eight memories, the page, the coda, the List card, the print and Home's quote use the same line. The coda is left out when the line is in the last paragraph (342e4b40). A memory that is only its takeaway (f9b0e6e9) is not set twice.
- **Paragraphs:** `balance()` gives even splits: 321 + 326 (c21cf4d4), 307 + 338 (f6a734be) and 408 + 398 (459228bd).
- **The not-found page:** Bond sits on the foil hairline, centred on the sheet at 1366 (note 403–963 on a 1366 sheet). It has one h1 with the foil stop, one line of cause and remedy, one 48px action, and curled apostrophes.
- **Motion:** every GSAP hook is inside `gsap.matchMedia` with a revert, uses `fromTo` with `clearProps`, and animates only transform and opacity. After the List rise, no card is left offset or faded. The running head no longer follows the family heading in the side margin; it reads "Archive" at 1366 and 1920.
- **Phone:** the tool row is one row. The page-turn titles are whole (62/62 and 42/42). The typed prints are whole on the Archive and on Home.

## Shared state

- When I opened my tab, the stored view was "list".
- At 1920 it read "prints": another tab had changed it, not me. I switched to List to measure and back to Prints.
- At 390 it read "list" again. I switched to Prints and back to List.
- At 1366 I did the same, ending on List.
- When I closed the tab it read "list", as I found it at the start.
- I did not touch `astory-app-auth` (it is still present), did not sign out, and wrote no data. Tab-88 is closed and its viewport reset.
