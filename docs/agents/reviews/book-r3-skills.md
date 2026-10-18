# Skills Steward: Book, Plans, Account, Talk, Start and Wall, round 3

**Verdict: GAPS (0 blockers, 1 ugly, 3 polish).** Fourteen of the fifteen round-2 gaps are closed. The one still open is G4: the book's text is still small on a laptop and smaller on a phone. The lead's `:where()` change works: every heading size declared in book-account.css now renders at that size. The shared rule still overrides the line-heights, though (N2). The other new findings are two small alignment and target issues.

## How this was checked

- **Skills read:**
  - taste-skill: SKILL.md, type, layout and critique.
  - hallmark: SKILL.md, slop-test, interaction-and-states and responsive.
  - emil-design-eng.
  - impeccable: SKILL.md, craft-floor, polish and layout, plus the critique headings.
  - gsap-react, gsap-performance, gsap-scrolltrigger and gsap-timeline.
  - Also BAOS-STANDARD.md and DESIGN.md. humanizer applied to the copy. No other installed skill applies.
- **Code read:**
  - `pages/{Book,Plans,Talk,Start,Wall}.tsx` in full, and the Section, Profile and Whose-stories parts of Account.tsx.
  - `components/book/{BookSpread,Editions,WhereNext,CoverSwatches}.tsx`.
  - `styles/pages/book-account.css` in full.
  - The astory.css rules for sheet headings, `.bk-dot` and `bkfade`, and `lib/zoom.ts`.
- **Rendered:** in my own pane tab (now closed, viewport reset). I stepped `__gsap.ticker`, finished document-timeline CSS animations, and measured with `getBoundingClientRect` and computed styles. Under html zoom I divided by the zoom.
  - **1366×768:** every page.
  - **1920×1000:** Book, Talk and Wall.
  - **2560×1300, zoom 1.3:** every page.
  - **390×844:** every page.
  - **1180×820:** Plans.
  - **Routes:** `/book` (cover, chapter openers, memory spreads 4 and 5 through the contents rail and Turn page), `/talk`, `/plans`, `/account`, `/start?another=1` (step 1, and step 2 for "Someone in my family", left with "The three ways") and `/p/RNm1vTr2Gyqu`.
  - **Talk:** I measured the real question, then the deck's four longest questions (61–63 characters, from `app-core/data/interview.js`) by swapping the card's text in my tab only.
  - **Plans:** "Choose ↗" is hidden for this complimentary account, so I measured it by appending one button to a column in my tab and removing it.
- **Nothing written:** I saved, ordered, chose, sent and switched nothing.
  - Opening /plans and /talk and turning the book can queue the app's own usage events (`plans_viewed`, `talk_wall_shown`, `book_preview_opened`).
  - I set one throwaway localStorage key (`__steward_helpers`) by mistake and removed it in the next call. `astory-app-auth` was never read or touched.
- **Not verified:**
  - The Book's empty state (this account has 8 memories).
  - The editions' loading, fallback and order-error states, and every Account form's error and success states (each needs a write).
  - The join step and Ask to join.
  - A wall with family notes.
  - The gilt "your plan" column (complimentary account).
  - `/p/nobody` this round.
  - 3840 wide, a zoomed-out Edge window, and Edge itself.
- **astory.css was being edited during the review.** The h1/h2 `:not()` arguments are now inside `:where()` too (lines 2872–2873), so astory.css line numbers below may be off by one.

## Round-2 gaps, checked

| # | Round-2 gap | Now |
|---|---|---|
| G1 | Talk question 3–4 lines | **Fixed.** `data-len` steps 44/36/30 (52/42/34 at ≥1600, 36/32/28 under 1100, 28/24/21 on a phone), and the `20ch` cap is gone. The real question and the 47-, 61-, 62- and 63-character questions all set in **2 lines** at 1366 (478px measure), 2560 (663 CSS px) and 390 (304px). |
| G2 | astory.css overrode the page headings | **Fixed for size.** Declared and rendered sizes now match: Talk h2 40px (44 at ≥1600, 28 on a phone), plan names 26, Account h2s 26, `acct-sub` 26, bookplate h1 32 (26 on a phone), Editions h2 34 and wall chapter h2 36 (28 on a phone). The empty-book h2's 40px wins by specificity (0,2,1 against 0,0,1), but I couldn't render it. Line-height still drifts (N2). |
| G3 | H1 smallest on Plans/Talk | **Fixed.** Plans, Talk and Book H1s are all 44px/700 Montserrat (32 on a phone), above the 34px prices and the 40px Talk h2. |
| G4 | Book text 9px on a laptop | **Partly.** `--bk-chrome` went from 392 to 316. At 1366×768 the page is now 442px (was 376) and the memory text 10.8px (was 9.2). Still under the 13px aim, and 8.4px on a phone. See N1. |
| G5 | Wall printed the opening twice | **Fixed.** No `.wall-chapter-quote`. A one-memory chapter is head left, leaf in the 2fr track (600px at 1366, 945 at 1920). |
| G6 | Three-ways copy contradicted itself | **Fixed.** "nobody ever signs as somebody else" (Start.tsx:241, Account.tsx:311). "You write it down for them, as told to you" and "You keep it for them, as they tell it". |
| G7 | Italic question | **Fixed.** Roman, Cormorant 500. |
| G8 | Editions leaders ragged | **Fixed.** Every row is 269 / 179 / 200 / 116, and the leaders start at x=740 at 1366. |
| G9 | "Choose Individual ↗" overran | **Fixed.** "Choose ↗" is 104px in a 188px column at 1180 (ends at 473 of 525). The plan name stays in `sr-only`. |
| G10 | Keepsake made cells ragged | **Fixed.** Hidden below 1600. At ≥1600 it is a 30px block on its own line (all "The book" cells 66px at 1366). |
| G11 | Phone leaf titles 3 lines | **Fixed.** 24px on a phone; all eight titles are 1–2 lines at 390. |
| G12 | Small targets | **Fixed on the desk.** The desk's dashes are now an `aria-hidden`, pointer-less hairline (the contents rail is the jump). The phone teller picker is 161×44. `cursor: not-allowed` on disabled controls. The front door's dashes are still 24×44 (N4). |
| G13 | Start 27px over a screen | **Fixed.** docH 768 at 1366×768 (with the `max-height: 800px` block), 1300 at 2560. |
| G14 | Book fade could stay at 0 | **Fixed.** The single-page and reduced fade is now `gsap.fromTo` with `clearProps` (BookSpread.tsx:165–173), and `bkfade` is off on `.samples`. On the phone the new page went from 0 to 1 when GSAP was stepped. |
| G15 | Literal colours, font name | **Fixed.** Everything is lifted into the `:root` block (`--bka-cloth-ground`, `--bka-object-shadow`, `--bka-board-shade`, `--bka-vignette`, `--bka-script` …). The only `#000` left is inside masks (alpha, not colour). The fourth face is the book cover's own script (`.sb-cv-names` and `.sb-cv-motto` set in Mrs Saint Delafield), so its one use on Start is the cover's language. Accepted. |

Also re-checked: `Start.tsx:180` now depends on `[who, loaded]` only (the round-2 nit). No horizontal scroll at 390, 1180, 1366, 1920 or 2560.

## Gaps

### N1. UGLY: the book's words are still under reading size on a laptop and a phone (G4, carried)
**Skill:** impeccable craft floor ("run the real copy at every breakpoint"); taste-skill layout §9 (body text at 9–13px is the commonest fault of good sites); DESIGN.md "Body text at least 16px"; BAOS 17a.

**Where:**
- `book-account.css:95` (`--bk-chrome: 316px`)
- `:124–125` (spread sized to `100vh − chrome`)
- `:216` (phone 250px)

**Measured** (memory text, labels):

| Window | Page | Text | Labels |
|---|---|---|---|
| 1366×768 | 442px | **10.8px** | kicker and folio 7.5, pill 6.2, date 5.1 |
| 390×844 | 346px, one page | **8.4px** | folio 5.8, pill 4.8, date 4.0 |
| 1920×1000 | | 16.7px | |
| 2560×1300 | | 16.7 CSS px (21.7 screen px) | |

**Cause:** at 1366 the spread is held by the window's height ((768 − 316) × 2 = 904) and by the column beside the 300px rail (883). Moving the rail would give about 11.1px. Trimming chrome cannot reach 13px. The samples' square page is simply small on these screens.

**Change:** add the reading state that round 2 suggested. Next to "Read this page", a "Read it large" control opens the current page alone at full column width, with the memory text at 16–18px. On a phone, a tap on the page could do it, and the edge-swipe keeps turning. Keep the fitted spread as the default (samples parity, BAOS 22). If the founder prefers strict parity with no reading state, record it in BAOS-STANDARD.md as a deliberate exception so it stops coming back.

### N2. POLISH: the shared sheet-heading rule still overrides the page headings' line-height
**Skill:** impeccable polish §1 (classify the drift and fix it at the narrowest level); hallmark gate 48 spirit (the declared system is the rendered one).

**Where:** `astory.css:2870`. `.sheet-page .page :is(h1, h2):not(…)` is still (0,3,1) and sets `line-height: 1.08` and `letter-spacing: -0.005em`. That beats every `.sheet-page .X h2` (0,2,1) in book-account.css. Only the size rules (2872–2873) moved into `:where()`.

**Measured** (declared → rendered):

| Element | Line | Line-height | At its size |
|---|---|---|---|
| Plan names | `book-account.css:397` | 1.05 → 1.08 | |
| Account section h2 | `:266` | 1.1 → 1.08 | |
| `.acct-sub` | `:283` | 1.1 → 1.08 | |
| Bookplate h1 | `:281` | 1.05 → 1.08 | 34.56px against 33.6 |

Talk's h2 (0,3,1, later in the cascade) is the one that wins.

**Change:** put the head of `astory.css:2870` in `:where()` as well (`:where(.sheet-page .page) :is(h1, h2):where(:not(…))`), so it supplies defaults and page rules set their own leading. Then re-check the bookplate name on two lines at 390.

### N3. POLISH: on a wide window Talk's Where to next does not line up with the pair above it
**Skill:** taste-skill critique pass 4 ("follow the left edge of every block … two or three, reused on purpose"); impeccable polish (optical and mathematical alignment).

**Where:** `book-account.css:488` (`.sheet-page.wide .talk-next { max-width: 1440px }`). `.page` pads by `--gutter` inside that 1440, but `.talk-page`'s grid is 1440 of content.

**Measured at 1920:**
- The words start at x=233 and the card ends at 1674.
- Where to next runs from 301 to 1604, so it is 68px in on each side.
- At 2560 the inset is 69 CSS px.
- (At 1366 both sit at x=44.)

**Change:** `.sheet-page.wide .talk-next { max-width: calc(1440px + 2 * var(--gutter)); }`, so the rows span the same 1440px box. Re-measure at 1920 and 2560.

### N4. POLISH: the front door's page dashes are still 24×44 targets
**Skill:** hallmark interaction-and-states ("Minimum 44×44"); DESIGN.md (targets at least 44px). Round-2 G12 change 1 fixed this only on the desk.

**Where:**
- `BookSpread.tsx:360–364`: without `rail`, the dashes are buttons.
- `astory.css:2015–2016`: 22×3 with `::before { inset: -20px -1px }`, so 24×44.
- Used by `pages/auth/Welcome.tsx:199`.

**Change:** widen the hit area to 44 (`inset: -20px -11px`, with the row's `gap` at least 0 so the areas don't overlap). Or show the chapter chips there as the jump control, as the desk now does with its contents, and make the dashes the same quiet `aria-hidden` hairline.

## Skill by skill

- **taste-skill:**
  - Gaps: N1 (reading size), N3 (edges).
  - Passes:
    - Every heading is two lines or fewer at every width I measured, including the Talk question with the deck's longest questions.
    - One dominant size per screen: the 44px H1 leads on Plans and Talk.
    - The book is the one live thing on its page, and today's question on Talk.
    - No near-empty screens at 1366 or 2560.
    - Start is one screen.
    - Running text is full ink at 16–20px.
    - No eyebrows beyond the brand's small-caps kickers and the step line.
- **hallmark:**
  - Gap: N4.
  - Passes:
    - Gate 38a: no italic headings, and the Talk question is roman. The chapter numerals stay italic as the printed book's own.
    - Gate 48: tokens only. The masks' `#000` is alpha.
    - Gate 49: no two-line buttons, and "Choose ↗" fits.
    - Gate 50: `minmax(0, …)` tracks.
    - Gate 34: no horizontal scroll.
    - Gate 37: the script face is the cover's.
    - Disabled controls are full-ink faint with `not-allowed` and a reason.
    - Every listed target is 44px or more on the desk, Account (none under 44 at 390), Start and the Wall.
- **emil-design-eng:**
  - Passes:
    - No `transition: all`, no ease-in on UI.
    - Hovers gated behind `(hover: hover) and (pointer: fine)`.
    - Presses 0.9–0.985 in 120–200ms.
    - The one-page fade is 240ms, 150ms reduced.
  - Accepted as in round 2:
    - The 0.9s leaf turn (BAOS 22, the samples' own; keyboard turns in 250ms, presses queued).
    - The 900ms plan glint (a material on your own gilt column, fine pointer, motion allowed).
- **impeccable:**
  - Gap: N2 (cascade).
  - Passes:
    - The copy now holds the three ways without contradiction (G6).
    - The editions list aligns.
    - Failure and loading wear the house style.
    - No banned scaffolds.
  - Nit, not a gap: four inline `style={{ margin… }}` on Account.tsx (227, 229, 368, 540) use tokens but belong in CSS.
- **GSAP (core, react, timeline, performance, scrolltrigger):**
  - Passes:
    - The leaf turn is a `fromTo` in `gsap.context`, reverted on cleanup.
    - The single-page fade is a `fromTo` with `clearProps`, killed on cleanup.
    - The cover sweep is a clip-path tween, killed on cleanup.
    - Start rises in `gsap.matchMedia(MOTION_OK)` with `clearProps` and `mm.revert()`.
    - The Wall hands its arrival to `lib/arrive` and its leaves use a transform-only CSS view-timeline behind `@supports` and reduced motion.
    - No ScrollTrigger in scope.
    - Only transform, opacity and clip-path are animated.
    - Every rise I froze reached opacity 1 once the clock was stepped.
- **Also checked:**
  - humanizer: on the G6 copy.
  - gsap-core: on `fromTo` and `clearProps`.
  - find-skills: nothing further applies.
