# Skills Steward: Book, Plans, Account, Talk, Start and Wall, round 4

**Verdict: GAPS (0 blockers, 0 ugly, 3 polish).** All four round-3 gaps are closed: N1 is the ruled exception (BAOS 22), and N2, N3 and N4 measure fixed. The GSAP fade that replaced `bkfade` finishes at full opacity and leaves no inline style. The fresh pass found three small things:
- Start is 1px taller than a 1366×768 window, so a scrollbar shows (this undoes round-2 G13).
- Account puts an icon on one field of a pair and not the other.
- Book, Talk and Account load on an empty page, with no skeleton.

## How this was checked

- **Skills read:**
  - taste-skill: SKILL.md, critique, type and layout.
  - hallmark: slop-test (all 58 gates), interaction-and-states and responsive, plus the head of SKILL.md.
  - emil-design-eng: easing, duration, frequency, press, hover and reduced motion.
  - impeccable: SKILL.md, craft-floor, polish and layout.
  - GSAP: gsap-react, gsap-performance, gsap-core (fromTo, clearProps, matchMedia), and the scrolltrigger and timeline cleanup rules.
  - Also BAOS-STANDARD.md (rules 11, 22, 25, 38, 41 and 42) and DESIGN.md. humanizer applied to the copy. find-skills: nothing further applies.
- **Code read:**
  - `pages/{Book,Plans,Account,Talk,Start,Wall,Placeholder}.tsx` in full.
  - `components/book/{BookSpread,Editions,WhereNext,CoverSwatches}.tsx` in full, and BookPage's class use.
  - `styles/pages/book-account.css` in full.
  - In astory.css: the sheet-heading rules (2842–2847, 2988–2990), `.bk-dot` (1996–2000), §19 Start (713–723) and the busy placeholder (2343, 3862).
  - `lib/zoom.ts`, and the door's `.bk-dot` and `.chip` rules in signed-out.css.
- **Rendered:** in my own pane tab (`tab-84`, now closed, viewport reset). I stepped `__gsap.ticker`, finished document-timeline animations, and measured with `getBoundingClientRect` and computed styles. Under html zoom I divided by the zoom.
  - **1366×768:** Book, Start (step 1) and the placeholder (`/no-such-page`).
  - **1920×1000:** Talk, Plans and Account.
  - **2560×1300, zoom 1.3:** Book, Talk and the wall.
  - **390×844:** Book (two page turns), Talk, Start, Account, Plans and `/p/RNm1vTr2Gyqu`.
  - **Front door:** `/welcome` (signed out), headless in Playwright with Edge at 1366, 1920, 2560 and 390.
- **Nothing written:** no Save, Change, Remove, Send, Order, Open it, Choose, story switch or printing-interest press.
  - I pressed "Open the book" and "Turn page" on the phone, which can queue `book_preview_opened`. Opening /plans and /talk queues `plans_viewed` and `talk_wall_shown`.
  - localStorage was not read or written, and `astory-app-auth` was never touched.
- **Not verified:**
  - The Book's empty state (this account has 8 memories).
  - The editions' loading, fallback and order-error states.
  - Every Account form's error and success states, and the join step with Ask to join (each needs a write or a press I may not make).
  - A wall with family notes.
  - The gilt "your plan" column (complimentary account).
  - The brief loading placeholders, read in code only.
  - 3840 wide, a zoomed-out Edge window, and Edge in the pane.

## Round-3 gaps, checked

| # | Round-3 gap | Now |
|---|---|---|
| N1 | Book text under reading size | **Accepted exception** (BAOS 22): the reader matches the samples page, and "Read this page" is how you read a page large. Not reopened. At 1366×768 the spread is still 883×442. |
| N2 | Sheet-heading rule overrode line-height | **Fixed.** `astory.css:2844` is now `:where(.sheet-page .page) :is(h1, h2):where(:not(…))`, so it is only a default; the face, weight and colour rule at 2842 sets no size or leading. Measured below. |
| N3 | Talk's Where to next inset 68px | **Fixed.** `book-account.css:494` gives `.talk-next` the pair's own two tracks (600 + 760, gap `--s-20`). At 1920: words at x=233, card ends at 1674, rows 233–1673. At 2560: 258 / 1699 / 258–1698 CSS px. The 1px is the card's −0.5° tilt. |
| N4 | Front-door dashes 24×44 | **Fixed.** `BookSpread.tsx:353–357`: the dashes are an `aria-hidden` row of spans with `pointer-events: none` (`book-account.css:142`), on the desk and the door alike. The door jumps by the chapter chips (`BookSpread.tsx:392–400`). Headless /welcome confirms both, chips "Where we come from" and "Love & family". The chips are 44px tall in layout; see the note on the door's zoom. |

**N2, declared → rendered** (all now match):

| Element | Size | Line-height |
|---|---|---|
| Plan names | 26px | 27.3 (1.05) |
| Account section h2 | 26px | 28.6 (1.1) |
| `.acct-sub` | 26px | 28.6 (1.1) |
| Bookplate h1 | 32px | 33.6 (1.05) |
| Bookplate h1, phone | 26px | 27.3, one line |
| Account part h3 | 22px | 25.3 (1.15) |
| Talk h2 | 44px | 46.2 (1.05) |
| Wall leaf h3 | 24px | 25.92 (1.08) |

**The old `bkfade` is gone.** No `bkfade` is left in astory.css, and `.bk-reader.samples .bk-spread { animation: none }` (book-account.css:166).
- **The fade:** `BookSpread.tsx:164–173` is `gsap.fromTo(el, {opacity: 0}, {opacity: 1, 0.24s (0.15s reduced), OUT, clearProps: "opacity"})`. The cleanup kills the tween and clears the props.
- **Measured at 390, one turn in:** opacity 0 at 30ms, 0.45 partway, then 1 with an empty `style` attribute once the clock was stepped.

## Gaps

### N5. POLISH: Start step 1 is 1px taller than a 1366×768 window, so a scrollbar shows (round-2 G13 regressed)
**Skill:** taste-skill critique pass 4 ("follow the left edge of every block"); impeccable polish §4 ("remove … obsolete styles", "fix optical as well as mathematical alignment"); BAOS 11 (one screen, never scrolls).

**Where:**
- `astory.css:715`: the old §19 rule `.start-head { padding: var(--s-6) var(--gutter); }` still applies. book-account.css:531 never resets the padding.
- `astory.css:716–723`: `.start-body` and `.choice*` are no longer used by any TSX.

**Measured at 1366×768 (`/start?another=1`):**
- `.start` is 769.14px tall, so docH is 769 and a 15px scrollbar appears (clientWidth 1351).
- The head is 92px tall for 44px of content, because of that 24px top and bottom padding.
- Its 40px side padding puts the lockup at x=94.6. That is neither the sheet's edge (54.6) nor its content edge (102.6).

**Change:**
- Delete the dead §19 block (713–723), or at least set `.start-head { padding: 0 var(--s-12); }` in book-account.css. That matches the sheet's own 48px inset, so the lockup and "Not now" share the sheet's content edges (`var(--s-8)` under 1100, matching `.start-sheet`'s padding there).
- Re-measure docH ≤ 768 at 1366×768, and check 2560.

### N6. POLISH: Account's paired fields wear an icon on one and not the other
**Skill:** impeccable polish §4 ("keep icon families … sizing, and optical alignment coherent"; "same-role typography consistent"); hallmark interaction-and-states (no geometry differences between sibling inputs).

**Where:** `Account.tsx`:
- 136 First name, with a person icon; 137 Last name and 139 Phone, with none.
- 280 New password, with a lock; 281 Once more, with none.
- 207 New email and 549 Their email, with a mail icon.

**Seen at 1920:** in the "Your name" row the value "Bao" starts about 30px right of "Vo" beside it. The password pair is ragged the same way.

**Change:** drop the leading icons from Account's fields. Each field has a visible label, and the page is set as the book's back matter. Or give every field in a group the same leading slot. Either way, a pair starts its text on one line.

### N7. POLISH: Book, Talk and Account load on an empty page, not the page's hairline skeleton
**Skill:** hallmark interaction-and-states ("Skeleton screens over spinners for content that has a predictable shape"); impeccable craft floor (states: loading); BAOS 42 ("Loading draws the mark on the sheet over the page's hairline skeleton").

**Where:**
- `Book.tsx:82`, `Talk.tsx:37` and `Account.tsx:796`: `<div className="page" aria-busy="true" />`.
- The Shell draws the mark over it (`Shell.tsx:370`). Archive, MemoryPage, Person and Family each ship a skeleton (`arc-skeleton`, `mv-skeleton`, `pp-skel`, `fp-skel`).

**Change:** give each a few hairlines in its own shape so the page doesn't jump when it arrives:
- **Book:** the rail's five ruled rows and a square page block.
- **Talk:** the two columns, three ruled steps and a card outline.
- **Account:** the index column and three ruled section rows.

Shown only on a cold load (the account context is shared), so I read this in code and did not see it.

## Notes (not gaps)

- **Out of this scope, for the door's owner:** the front door scales its whole canvas with CSS `zoom` (`door-canvas scaled`: 0.845 at 1366, 1.19 at 1920). The chapter chips and the door's Back and Turn page are 44px in layout but 37px on screen at 1366. N4's change is right; the door's fit-to-screen scale shrinks every control under 44 on a laptop. A `min-height: calc(44px / var(--door-scale))` on the door's controls, or a floor on the scale, would hold 44.
- **Nits:**
  - `BookSpread.tsx:5`: the header comment still says "a row of dashes to jump to any spread".
  - `Placeholder.tsx:25`: a straight apostrophe in "isn't", where the h1 and the wall's dead end use ’.
  - `astory.css:1997`: `.bk-dot { cursor: pointer }` now does nothing, since the dashes take no pointer.

## Skill by skill

- **taste-skill:**
  - Gap: N5 (edges, one screen).
  - Passes:
    - Every heading is two lines or fewer at every width I measured: Talk's question at 1920, 2560 and 390; all eight wall leaf titles at 390; plan names; Start's way titles.
    - One dominant size per screen (44px H1 on Book, Plans and Talk).
    - One live thing: the book on Book, today's question on Talk.
    - No near-empty screen.
    - Running text full ink at 16–20px.
    - No text under 12px outside the printed book (none found at 390).
    - Talk's three blocks now share one left edge and one right edge.
- **hallmark:**
  - Gaps: N6 and N7.
  - Passes:
    - Gate 34: no horizontal scroll at 390, 1366, 1920 or 2560 (scrollWidth equals clientWidth).
    - Gate 49: no two-line buttons.
    - Gate 50: `minmax(0, …)` tracks.
    - Gate 48: tokens only. The remaining `#000` is inside masks, and the inline styles are data (`--pct`, `--wn-n`, `--sw`, the sweep's board colour).
    - Gate 38a: no italic headings. The chapter numerals stay the printed book's own.
    - Gate 10: no `transition: all`.
    - Every touch target is 44px or more on Account, Talk, Start, the wall and Plans at 390, and on the desk.
    - Disabled controls are full-ink faint with `not-allowed` and a reason beside them.
- **emil-design-eng:**
  - Passes:
    - No ease-in on UI. Hovers sit behind `(hover: hover) and (pointer: fine)`.
    - Presses 0.9–0.985 in 120–200ms.
    - The one-page fade is 240ms (150ms reduced). Start's rise is 0.6s with a 60ms stagger, an arrival.
  - Accepted as before:
    - The 0.9s leaf turn (BAOS 22; keyboard 250ms, presses queued).
    - The 0.45s cover sweep, a material, pointer-started and skipped under reduced motion.
    - The 900ms gilt glint (fine pointer, motion allowed).
- **impeccable:**
  - Gaps: N5 (obsolete styles) and N6 (icon coherence).
  - Passes:
    - The N2 cascade is fixed at the narrowest level, a `:where()` default.
    - The three-ways copy holds without contradiction.
    - Failure wears the house style (the placeholder and the wall's dead end: cloth, sheet, Bond, one line, one action).
    - No banned scaffolds.
    - The round-3 inline-margin nit is cleared (`acct-gap-3`, `acct-gap-4`, `acct-acts-top`).
- **GSAP (core, react, timeline, performance, scrolltrigger):**
  - Passes:
    - The new fade is a ref-targeted `fromTo` with `clearProps`, killed and cleared on cleanup. It never leaves a page at 0, as measured.
    - The leaf turn is a `fromTo` in `gsap.context`, reverted on cleanup.
    - The cover sweep is a clip-path tween, killed on cleanup.
    - Start rises in `gsap.matchMedia(MOTION_OK)` with `clearProps` and `mm.revert()`. All six `[data-rise]` were at opacity 1 at 390.
    - The wall uses `lib/arrive` plus a transform-only CSS view-timeline behind `@supports` and reduced motion.
    - No ScrollTrigger in scope.
    - Only transform, opacity and clip-path are animated.
