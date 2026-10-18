# Skills Steward: Book, Plans, Account, Talk, Start and Wall, round 2

**Verdict: GAPS (1 blocker, 5 ugly, 9 polish).** Every round-1 finding for these six pages is fixed except two: the page dots' hit area and Talk's line about the app. The new problems are mostly typographic. A shared heading rule in astory.css overrides this file's heading sizes, the Talk question runs to three lines, and the book's text is 9px on a laptop.

**Round-1 baseline:** there is no `book-r1-skills.md` in `docs/agents/reviews/`. The only round-1 record for these pages is `docs/audit/AUDIT-2026-10-17.md` §5 (Book), §6 (Talk), §8 (Account), §9 (Plans), §10 (Start) and §14 (Wall). I re-checked those findings below.

**Scope:** `src/pages/{Book,Plans,Account,Talk,Start,Wall}.tsx`, `src/components/book/*` and `src/styles/pages/book-account.css`, plus the parts of `astory.css`, `lib/arrive.ts`, `lib/motionWatchdog.ts` and `lib/analytics.ts` they depend on.

**How it was checked:** I read the code, then rendered every page in my own tab (now closed, viewport reset) at 1366×768, 1920×1000, 2560×1300 (html zoom 1.3) and 390×844, plus 1180 and 1024 for Plans. I stepped `__gsap.ticker` and finished CSS animations by hand, then measured with `getBoundingClientRect` and computed styles. The routes were `/book` (closed cover, then spreads 1, 3 and 4 via the arrow key and the contents rail), `/plans`, `/talk`, `/account`, `/start?another=1` (step 1, and step 2 for "Someone in my family", left without submitting), `/p/RNm1vTr2Gyqu` and `/p/nobody`. Nothing was saved, ordered, chosen, sent or switched. Opening `/plans` and `/talk`, and turning the book, can queue the app's own usage events (`plans_viewed`, `talk_wall_shown`, `book_preview_opened`) if "Help improve A Story" is on. No account data was written.

**Not verified:**
- The Book's empty state. This account has 8 memories.
- The editions' loading, fallback and order-error states.
- Every Account form's error and success states. Each needs a write.
- The join step and Ask to join on Start.
- A wall with family notes. This one has none.
- The gilt "your plan" column, because this account is complimentary.
- 3840 wide, a zoomed-out window, and Edge.

## Round-1 findings, re-checked (AUDIT-2026-10-17)

| Page | Finding | Now |
|---|---|---|
| Book §5.1 | Crash on `BookObject` | Fixed. It renders at every size. |
| Book §5.2 | Reader rendered 3–4 times | Fixed. One reader at every size I opened. |
| Book §5.3 | "Memories from 1970" | Fixed. Cover says 2026; hero line "Bao Vo · 2 chapters · 24 pages". |
| Book §5.4 | Controls on the fold at 2560 | Fixed. The note ends at y=1277 of 1300. The spread and controls fit at 1366×768 (bottom 752) and 1920×1000 (bottom 984). |
| Book §5.5 | Count repeated in the hero | Fixed. Shown once ("8 memories so far"). |
| Book §5.6 | Back at 0.35, dots 22×3 | Half fixed. Back is full-opacity faint ink (hidden on the phone). The dots still have a 24×44 hit area. See G12. |
| Book §5.7 | Own gutter | Fixed. Cloth and sheet share `--bka-gutter`: H1 and rail both at x=44 at 1366. |
| Talk §6.1 | Small card on an empty sheet | Fixed. A split: words 543 and card 627 wide at 1366; 832 and 1232 at 2560. |
| Talk §6.2 | Two H1s | Fixed. One H1 plus an h2. |
| Talk §6.3 | Dead end | Fixed. The card's primary action is "Write it instead", and the page ends with Where to next. |
| Talk §6.4 | "the hour you chose in the app" | Not changed (copy; for the BAOS reviewer). |
| Account §8.1 | PDF button three times | Fixed. A radio list of storytellers and one button. |
| Account §8.2–8.4 | Misaligned rows, "Switch" twice, masonry | Fixed. Settings rows beside a sticky index; "Switch to Nhi". |
| Account §8.5 | Email twice | Fixed. |
| Account §8.6–8.7 | 11px uppercase labels, 28px inputs | Fixed. Labels 13px sentence case; inputs 44px in a 48px field. |
| Plans §9.1 | Orphan fifth card | Fixed. One five-column table. |
| Plans §9.2 | Price over its unit | Fixed. No overlaps at 1366, 2560 or 390. |
| Plans §9.3 | Two H1s | Fixed. |
| Plans §9.4 | 11px uppercase units | Fixed. 14px sentence case. |
| Plans §9.5 | Tall cards | Fixed. The table is 625px tall at 1366. |
| Start §10.1–10.4 | Strip, other world, no way back, H1 wraps | Fixed. Sheet 1240px at 1366, cloth and sheet, "Not now", H1 on one line. Now 27px over one screen; see G13. |
| Wall §14.1–14.3 | Bare dead end, slogan, grey body | Fixed. Bench, sheet and dog; "worth keeping"; 18px full ink. |

## Gaps

### G1. BLOCKER: the Talk question runs to three and four lines
**Skill:** taste-skill house rule ("Headlines: two lines or fewer, at every width"; a statement over 36px counts as a headline). Same root cause as writer-r2 G1.

**Where:**
- `book-account.css:417` (`.talk-q { … 44px … max-width: 20ch }`)
- `book-account.css:427` (52px at ≥1600)
- `book-account.css:430` and `:437` (36px and 28px)
- `Talk.tsx:274`

**Measured:**
- At 2560×1300, today's question "What do you say when you pray?" (30 characters) is **3 lines** at 52px, with max-width 458 CSS px.
- With a real 62-character question ("Walk me through an ordinary Tuesday when you were thirty-five.") it is 3 lines at 1366 (44px), **4 lines** at 2560, and 3 lines at 390 (28px).

**Cause:** the `ch` max-width scales with the font size, so it never removes a line. The card has about 530px of measure at 1366, but the question uses 388px of it.

**Change:**
1. Drop `max-width: 20ch` and let the card's padding set the measure.
2. Give the `<p className="talk-q">` a `data-len` (≤34 / 35–50 / >50 characters), as the writer does, and step the size per bracket: about 44/36/30px on desktop (52/42/34 at ≥1600) and 28/24/21px on the phone.
3. Re-measure the 62-character question at 1366, 2560 and 390 until it is two lines.

### G2. UGLY: a shared astory.css rule overrides this file's headings
**Skill:** impeccable polish §1 ("classify each drift: missing token / one-off / local defect") and craft floor (type scale); hallmark gate 48 spirit (the declared system must be the rendered one).

**Where:** `astory.css:2873`. `.sheet-page .page h2:not(.bk-reader *, .leaf-one *, .mem *, .print-card *) { font-size: 34px }` has specificity (0,3,1), because `:not()` takes the specificity of its strongest argument. That beats every `.sheet-page .X h2` (0,2,1) in book-account.css. `astory.css:2872` does the same to h1 (and uses `3vw` without `/ var(--zoom)`). `astory.css:3015/3017` repeat both on the phone.

**Measured** (declared → rendered):

| Element | Line | Declared | Rendered |
|---|---|---|---|
| Talk h2 | `:404` | 48px | 34px |
| Talk h2, ≥1600 | `:427` | 56px | 34px |
| Talk h2, phone | `:436` | 32px | 28px |
| Plans plan names | `:344` | 26px | 34px, in 177px columns |
| Account section h2s | `:231` | 26px | 34px |
| Account "Your name" | `:248` | 26px | 34px |
| Bookplate h1 | `:246` | 32px | 40px |
| Wall chapter h2 | `:602` | 36px | 34px |
| Book empty-state h2 | `:143` | 40px | 34px (from code) |

At 34px, "Who looks after this if I can't" wraps to two lines in Account's 285px name column.

**Change:** prefix this file's heading rules with `.sheet-page .page`, for example `.sheet-page .page .talk-words h2` (0,3,1, and later in the cascade). Or ask the lead to wrap the astory.css rules' heads in `:where()` so pages can set their own sizes. Then re-measure each heading in the table above.

### G3. UGLY: on Plans and Talk the H1 is the smallest headline on the page
**Skill:** taste-skill type (one dominant size per screen; "a confident hero followed by section headings almost as large" is a named mistake); hallmark pre-emit Hierarchy.

**Where:** `Plans.tsx:94` and `Talk.tsx:242` use the compact `hero-title`, which renders 28px Montserrat (24px on the phone). Book's compact H1 is 44px (`book-account.css:67`).

**Measured at 1366:** Plans H1 "Plans." 28px under five 34px plan names. Talk H1 "Talk." 28px over a 34px h2 and a 44px question.

**Change:** give `.shell:has(:is(.plans-page, .talk-page)) .cloth.compact .hero h1.hero-title` the Book's 44px/700/-0.02em (32px under 760px), so the three compact pages share one H1 size. Keep the plan names at their intended 26px (after G2).

### G4. UGLY: the book's words are 9px on a laptop
**Skill:** impeccable craft floor ("run the real copy at every breakpoint"); taste-skill critique pass 6 and "How pages fail" (text too small is the commonest usability loss); DESIGN.md "Body text at least 16px"; BAOS rule 17a ("Reading comes first").

**Where:** `book-account.css:77` (`--bk-chrome: 392px`) and `:106`. The spread is sized to `100vh − 392px`.

**Measured:**

| Window | Page size | Memory text | Labels |
|---|---|---|---|
| 1366×768 | 376px square | 9.2px | 4.3px kickers, 6.4px folio |
| 1920×1000 | 608px | about 14.8px | |

**Change:** keep the fit-to-window rule (BAOS 11, samples parity) but take back height on short windows. For example, under `@media (max-height: 860px)`, cut `--bk-chrome` to about 300px. Do that by tightening `.cloth.compact` padding and moving the note beside the controls on one row. Also consider giving a page a "Read it large" state that sets the visible page at reading size: `.bk-read` already exists; a sibling that opens the current page alone at full column width would do. Measure the memory text at 1366×768 afterwards and aim for at least 13px. If the founder prefers exact samples parity, record it as a deliberate exception.

### G5. UGLY: the Wall prints a one-memory chapter's opening twice, side by side
**Skill:** taste-skill (no repeated content; "when a section looks empty, make the main element bigger, or cut"); BAOS rule 19 ("Don't repeat the same promise or action twice on one page").

**Where:** `Wall.tsx:263–267` (`wall-chapter-quote` from `leadOf`, lines 51–58) and `book-account.css:604–607` and `:628–633`.

**Measured at 1366:** "We live in a small city. It's in Vietnam. Mom was a teacher, dad an engineer and I stay with grandmas" is set in 30px italic at x≈400. The same three lines open the leaf 450px to its right.

**Change:** drop the quote. For `.wall-chapter.one` on wide windows, put the leaf in the larger track (`minmax(0,1fr) minmax(0,2fr)`) so the row is the memory itself. If a large line is wanted, use the memory's own kept line (BAOS 32) when it exists and differs from the first paragraph. Never use the paragraph the leaf already starts with.

### G6. UGLY: the copy contradicts itself on the three ways
**Skill:** impeccable craft floor ("Copy: the product's own language"); humanizer (a sentence must not undo the one before it). It touches BAOS 29, which the founder calls a critical bug.

**Where:**
- `Start.tsx:240` says "nobody ever writes as somebody else". Directly below it, `Start.tsx:100` says "You write, in their name".
- `Account.tsx:295` says "nobody ever writes as somebody else". `Account.tsx:330` says "You do the typing, in their name".

**Change:** keep the model and change the words. Something like "Nobody ever signs as somebody else" in the leads. For the first way: "You write it down for them, as told to you" (Start), and "You keep it for them, as they tell it" (Account). Confirm the final wording with the BAOS reviewer and PRD §3.3a.

### G7. POLISH: the Talk question is italic display type
**Skill:** hallmark gate 38a (no italic display type); DESIGN.md ("No italic headings. Italic lives in body emphasis and in the book's captions only").

**Where:** `book-account.css:417` (`font: italic 500 44px/1.18`).

**Change:** set it roman (Cormorant 500/600). Italic is for what a person said, and this is our question. Do it together with G1.

### G8. POLISH: the editions' leaders and price column don't line up
**Skill:** taste-skill (shared edges; "follow the left edge of every block"); impeccable polish (optical and mathematical alignment).

**Where:** `book-account.css:159`. Each `.ed-row` is its own grid with a `minmax(150px, auto)` price track.

**Measured at 1366:** the Digital row's price track is 201px against 150px for the others. Its dotted leader starts at x=739 against 769, and its name column is 269px against 299px.

**Change:** give the price track a fixed width (`200px`), or make `.ed-list` the grid and the rows `grid-template-columns: subgrid`.

### G9. POLISH: "Choose Individual ↗" overruns its column below 1280
**Skill:** hallmark gate 49 and responsive §"Clickable text" (fix order: shorten the label first).

**Where:** `Plans.tsx:162`, and `book-account.css:355` (`.pl-choose { white-space: nowrap }`).

**Measured:** the button ends at x=559 in a column ending at 551 (1180 wide), and at 411 against 405 (1024).

**Change:** label it "Choose ↗". The column heading already names the plan. Keep "Choose Individual" in the `sr-only` text.

### G10. POLISH: the keepsake icon makes "The book" cells ragged
**Skill:** impeccable polish (same-role content consistent); taste-skill (no ornament that gets in the way of reading).

**Where:** `book-account.css:359` (`.pl-keepsake { float: left; 36px }`) and `Plans.tsx:150`.

**Measured at 1366:** the cell is 144px tall. "A Classic Hardcover each year, or its $69 toward…" wraps around the 36px float in a 177px column.

**Change:** put the keepsake on its own line above the words (`display: block; margin-bottom: 6px`), or show it only at ≥1600.

### G11. POLISH: three-line leaf titles on the phone Wall
**Skill:** taste-skill headline rule.

**Where:** `book-account.css:616` (`.wall-leaf h3 28px`). The phone block at `:684–700` doesn't reduce it.

**Measured at 390:** "Losing grandparents and preserving a grandfather's story" (56 characters) is 3 lines. At 24px all eight real titles set in 2 lines (measured).

**Change:** add `.sheet-page .wall-leaf h3 { font-size: 24px }` inside `@media (max-width: 760px)`.

### G12. POLISH: two targets under 44px
**Skill:** hallmark interaction-and-states ("Minimum 44×44"); DESIGN.md (targets at least 44px).

**Where:**
- `.bk-dot`: `astory.css:2017–2018` gives it a 24×44 hit area (`::before inset: -20px -1px`).
- The phone hero's storyteller picker: `Book.tsx:147–149`, `TellerPick` inside `p.label.mobile-only`, renders 161×18.
- Related: `.bk-reader.samples .bk-controls .btn[disabled]` uses `cursor: default` (`book-account.css:113`) where the rest of the file uses `not-allowed`.

**Change:**
1. Widen the dots' hit area to 44 (`inset: -20px -10px`, with the dots' gap ≥ 0 so the areas don't overlap). Or let the contents rail be the jump control and drop the dots on desktop, as the phone already does.
2. Give the hero picker `min-height: 44px; display: inline-flex; align-items: center`.

### G13. POLISH: Start scrolls by 27px at 1366×768
**Skill:** taste-skill fullness; BAOS rule 11 (one screen). The file's own comment says "One screen on a desktop".

**Where:** `book-account.css:445–466`.

**Measured:** `.start-head` is 92px tall for a 32px lockup, and docH is 795.

**Change:** trim the head to its 44px control row, or the sheet's top padding to `var(--s-8)`. Re-measure at 1366×768 and 1920×950.

### G14. POLISH: the book's fade can stay at opacity 0
**Skill:** taste-skill step 9 ("never content that stays hidden if the script fails"); BAOS rule 25; gsap-core (prefer tweens the app can drive).

**Where:** `astory.css:1226–1227`: `.bk-reader .bk-spread { animation: bkfade 240ms … both }` with `from { opacity: 0 }`.

**What happened:** `lib/motionWatchdog.ts` ticks GSAP when frames stop, but it can't advance a CSS animation. In my background tab the whole spread sat at opacity 0 (`currentTime` 0) until I finished the animation by hand. A real foreground window plays it. A frozen or embedded view does not.

**Change:** drive the fade with `gsap.fromTo(spread, {opacity: 0}, {opacity: 1, duration: 0.24, ease: OUT, clearProps: "opacity"})` inside `gsap.matchMedia()` in `BookSpread.tsx`, so the watchdog covers it. Or drop the `both` fill and start from `opacity: 0.001` so a stalled clock shows the page.

### G15. POLISH: literal colours and a font name in page rules
**Skill:** hallmark gate 48 (token discipline); DESIGN.md ("pages never write a raw hex").

**Where** (`book-account.css`):
- `:125–127` and `:133–135` (gutter shade and object shadows)
- `:449–451` and `:654–656` (the cloth ground, copied verbatim for `.start` and `.wall-bench`)
- `:464` (sheet vignette)
- `:494` (board shade)
- `:498` (`"Mrs Saint Delafield"` literal)

**Change:**
1. Lift these into the `:root` block, for example `--bka-gutter-shade`, `--bka-object-shadow`, `--bka-cloth-ground` (one value both pages use) and `--bka-board-shade`.
2. Reference the script face through a font token, or ask the lead whether a fourth face belongs on Start at all (the audit flagged Mrs Saint Delafield as an extra family).

## Skill by skill

- **taste-skill:**
  - Gaps:
    - G1, the Talk question over two lines
    - G3, H1 smaller than the section heads
    - G4, 9px reading text
    - G5, repeated content
    - G11, phone leaf titles
    - G13, Start one 27px over a screen
  - Passes:
    - One live thing per page: the book turns, with a cover-colour sweep; the Wall's leaves rise on the scroll's own timeline; Start's three specimens.
    - No screen of empty ground at 1366 or 2560: Talk is now a split, Plans a full-width table, the Account index plus rows.
    - Running text in full ink at 17–20px.
    - No eyebrow beyond the brand's own small-caps kickers and the step line (BAOS 39).
- **hallmark:**
  - Gaps:
    - G9, a clickable label overruns its column
    - G12, two small targets
    - G15, tokens
  - Passes:
    - No horizontal scroll at 390, 1024, 1180, 1366, 1920 or 2560.
    - Grid tracks are `minmax(0, …)`.
    - Disabled controls are full-opacity faint ink with `not-allowed` and a line saying why ("Change a field to save it", "Type their email first").
    - Inputs 44px in 48px fields.
    - Label above, error on blur ("These don't match yet").
    - The delete confirmation names who inherits and needs a tick.
    - `role="alert"`/`role="status"` beside each control that can fail.
    - Focus-visible rings on every control in this file.
- **emil-design-eng:**
  - Gaps: G14.
  - Passes:
    - House curves only.
    - No `transition: all`, no ease-in.
    - Press scales 0.9–0.985.
    - Hovers gated behind `(hover: hover) and (pointer: fine)`.
    - Every listed hover and press is 120–200ms.
    - Arrow-key page turns run in 250ms.
    - The 0.9s leaf turn on a button press is over the 300ms rule. I accept it because BAOS rule 22 requires the samples page's own turn, presses made during a turn are queued, and the keyboard path is fast.
    - The plan glint (900ms) only runs on your own gilt column with a fine pointer and motion allowed. It is a material, not a control.
- **impeccable:**
  - Gaps:
    - G2, the cascade
    - G4, copy at every breakpoint
    - G6, copy
    - G8 and G10, alignment
  - Passes:
    - Failure wears the house style (`/p/nobody` is the bench, one sheet, the dog, one line of cause and remedy, one action).
    - Loading is the mark on the bench.
    - No banned scaffolds (no icon-card rows, no hero metrics, no side-stripe cards).
    - Errors name the problem and the recovery.
- **GSAP (core, react, timeline, performance, scrolltrigger):**
  - Gap: G14.
  - Passes:
    - BookSpread: the leaf turn is a `fromTo` on a ref inside `gsap.context`, reverted on cleanup. The cover sweep is a clip-path tween killed on cleanup.
    - Start: rises in `gsap.matchMedia()`, `fromTo` with `clearProps`, `mm.revert()` on change.
    - Wall: hands its arrival to `lib/arrive` and returns its cleanup. The leaves use a CSS view-timeline (transform only, `@supports` and reduced-motion gated), so nothing waits on an observer.
    - No ScrollTrigger in these files, so nothing to refresh.
    - Only transform, opacity and clip-path are animated.
    - One nit: `Start.tsx:179` re-runs the rise whenever `account` changes identity. Depending on `[who]` alone would stop a reload of the account from replaying it.
- **Also checked:**
  - humanizer, for the copy in G6.
  - gsap-core: `immediateRender`/`fromTo`, matchMedia, reduced motion.
  - find-skills found nothing further that applies.
