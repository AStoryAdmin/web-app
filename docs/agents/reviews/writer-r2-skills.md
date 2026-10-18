# Skills Steward: writer, round 2

**Verdict: GAPS (1 blocker, 3 ugly, 4 polish).** 13 of the 16 round-1 gaps are fixed. The headline gap is not fixed, and the stamp offset is only half fixed.

**Scope:** `src/pages/Write.tsx`, `src/lib/stamp.ts`, `src/styles/pages/writer.css`, `src/components/delight/{OpenLeaf,WeekInk}.tsx`, and how they use `lib/ease.ts`, `lib/arrive.ts` and `lib/zoom.ts`.

**How it was checked:** I read the code and rendered the page in my own tab (since closed) at 1366×768, 1920×1000 and 390×844, measuring with JS after stepping `__gsap.ticker`. I checked step 1 (`/write`, `/write?q=else-recipe-wrong`), focus mode, and step 2 (`/write?edit=59632e67…&details=1`, opened without changing anything). Nothing was saved and Keep was never pressed.

**Not verified:**
- Live help responses (Tidy, Title, Ask). They need words on the page, which would write a draft.
- The real save path and its error.
- 2560×1300 and a zoomed-out window.

The help slip and the error placement are reviewed from code only.

## Round-1 gaps, re-checked

| # | Gap | Now |
|---|---|---|
| 1 | Headline to 3 lines (blocker) | **NOT FIXED.** See G1. |
| 2 | `.w-kept-title` losing the cascade (blocker) | Fixed. Cormorant 28/600, `--sheet-ink`, 2 lines at 390. |
| 3 | Sticky Keep bar over the left page at 1920 (blocker) | Fixed. At 1920 the grid is `spread rail`, and Keep sits in the margin (`position: static`, x 1405–1725), clear of the book. |
| 4 | Phone layout | Fixed. One page under the question, two ways to begin (44px), Keep and "Not now" in one row, no horizontal scroll. |
| 5 | Columns (Afterwards) | Fixed. Container queries give 1 column at 390, 2 at 1366 (photo and chapter full width) and 3 at 1920. |
| 6 | Uppercase sentences | Fixed. Margin headings and folio are in sentence case. Uppercase remains only on the kicker and running heads (the book's small caps, ≥12px). |
| 7 | Arrival length | Fixed. The last margin item ends at about 1.05s and the ribbon at 1.05s, both under 1.2s. Inside `matchMedia`, `fromTo` with `clearProps`, nothing left at opacity < 1 after ticking. |
| 8 | Cleanup | Fixed. Keep timers cleared and `pressCtx.revert()` on unmount, `mm.revert()` on the arrival, `tl.kill()` in WeekInk, `st.kill()` and `mm.revert()` in OpenLeaf. |
| 9 | Stamp offset | **Half fixed.** It is now in CSS px after `pageZoom()` and holds at any zoom, but it still lands on the button label. See G4. |
| 10 | Raw hex | Mostly fixed. Moved to `.w-desk` tokens, with a few literals left. See G7. |
| 11 | Raw vw | Fixed. Every `vw`/`vh` in writer.css is divided by `--zoom`. (The step-2 cloth headline inherits an undivided one from astory.css; see G3.) |
| 12 | Hover gating | Fixed. The one transform hover (the seal) is inside `@media (hover: hover) and (pointer: fine)`. The rest are colour-only. |
| 13–16 | Remaining polish items from round 1 | No regressions seen. |

## Gaps

### G1. BLOCKER: real questions still set in 3 lines
**Skill:** taste-skill house rule ("Headlines: two lines or fewer, at every width"), DESIGN.md craft rules.

**Where:** `writer.css:66–67` (`max-width: 26ch` / `30ch` on `[data-len]`), `writer.css:71` (`.w-grid.single .w-question { max-width: 24ch }`), and `writer.css:380` (the phone rule includes `[data-len]` in the 7.4vw size).

**Measured:** "Walk me through an ordinary Tuesday when you were thirty-five." (62 characters) and "Which minister, priest, rabbi, imam or elder do you remember?" (61) set in **3 lines** at 1366 (28.7px) and at 1920 (31px). At 390, every question of 61–63 characters is 3 lines at 28.9px.

**Cause:** the `ch` max-widths shrink with the font size, so stepping the size down never removes a line. On the phone, line 71 (0,5,0) beats the phone rule's `max-width: none` (0,4,0).

**Measured fix:**
- With `max-width: none`, 1366 sets the 62-character question in 2 lines (the left page's own 410px measure).
- At 390, `max-width: none` plus 25px sets all four real long questions in 2 lines.

**Change:**
1. Drop the `ch` max-width on `[data-len="mid"]` and `[data-len="long"]` inside `.leaf-left`. Let the page padding be the measure.
2. In `@media (max-width: 760px)`, set `.w-grid.single .w-question { max-width: none }` with enough specificity to beat line 71.
3. On the phone, use `[data-len="mid"] { font-size: 25px }` and `[data-len="long"] { font-size: 21px }`.
4. Re-measure an edited title of 75–80 characters (the `long` case). At 22px it is still 3 lines.

### G2. UGLY: a failed Keep is invisible where Keep was pressed
**Skill:** hallmark 8 states (error); impeccable craft floor ("errors name the problem and the recovery"); Bao's checklist ("error … states are designed").

**Where:** `Write.tsx:978` renders the save `Problem` at the top of `.w-desk`. `Write.tsx:748–750` sets it. The seal, though, is in the sticky bar at the bottom (or in the rail).

**What goes wrong:** once someone has written past one screen, a failed save just turns "Keeping…" back into "Keep it", and the banner is off-screen.

**Change:** render the save error beside the seal, as a line in `.w-keep-note` in the terracotta ink with `role="alert"`. Or scroll the banner into view and focus it. Either way, pass `onRetry={save}` so the recovery is one press. Apply the same to `dictation.problem` (line 979).

### G3. UGLY: the step-2 headline on the cloth is off-system
**Skill:** taste-skill ("Two typefaces at most"); DESIGN.md (cloth set in the deck's bold Montserrat; "Source Serif is retired"); BAOS rule 12 (vw ÷ zoom).

**Where:** `Write.tsx:773` `<h1 className="story-q wq">` picks up astory.css `.story-q` and `.hero .wq`.

**Measured:** "Kept in The Vo book." renders in **Source Serif 4, 500**, at `clamp(30px, 3.6vw, 48px)` (the vw is not divided by `--zoom`) and in raw `#FBF6EC`. Every other cloth headline uses `.hero h1` (Montserrat 700, `--on-chocolate`).

**Change:** drop `story-q wq` and use the cloth's own h1 (as Plans and Talk do with `hero-title`). If the serif is a deliberate exception for this moment, set it in `writer.css` under `.whero h1` with `--book-display`, `--on-chocolate` and `calc(3.6vw / var(--zoom, 1))`.

### G4. UGLY: the stamp lands on the button label, which still says "Keeping…"
**Skill:** emil (one idea per moment, state indication); DESIGN.md rule 4 ("Keeping a memory gets the ink stamp and the word 'Kept'"); the lib/stamp doc ("lands beside the seal").

**Where:** `Write.tsx:735` (`offsetX` fixed at 150) and `Write.tsx:951` (label while `busy === "save"`).

**Measured at 1366:** seal centre 137, button right edge 252, simulated stamp 213–361. The stamp covers about 40px of "Keep it", and more of the wider "Keeping…" shown at that moment. For about 1.3s the button reads "Keeping…" while the stamp reads "KEPT".

**Change:**
1. Measure the offset from the button's right edge: `(btn.right - sealCentre)/z + stampHalfWidth + 12`, or anchor the stamp with `xPercent: 0` at `btn.right/z + 12`.
2. Once saved (`pressed`), set the label to "Kept", or hide it, so the button's success state agrees with the stamp.

### G5. POLISH: the title line's height goes stale
**Skill:** impeccable craft floor (run the real copy at every breakpoint).

**Where:** `Write.tsx:576–581` re-measures only on `[d.title, focus, kept]`.

**Measured at 390:** `style.height` is 60px where `scrollHeight` is 44px. That leaves a 16px hole between the title and "Dear family,", because the line was measured before EB Garamond/Cormorant loaded. A window resize also never re-measures it.

**Change:** re-run both autosizers on `document.fonts.ready` and in a `ResizeObserver` on the leaf.

### G6. POLISH: a dead 700ms transition on the dog
**Skill:** emil ("transition only what changes").

**Where:** `writer.css:93`. `.w-dog { transition: transform 700ms … }`, but nothing ever changes the dog's transform.

**Change:** remove it, and remove it from the reduced-motion list at line 413.

### G7. POLISH: literal colours left in page rules
**Skill:** hallmark gate 48 (token discipline); DESIGN.md ("pages never write a raw hex").

**Where:**
- `writer.css:75, 77` (cloth tint and book shadows)
- `writer.css:129` (`rgba(201,161,90,.14)`)
- `writer.css:151` (`rgba(60,50,40,.14)`)
- `writer.css:252` (`rgba(111,102,93,.3)`)

**Change:**
- Fold these into the `.w-desk` token block, for example `--w-hover-foil`, `--w-fold-line`, `--w-pencil-rule`, `--w-board-tint` and `--w-board-shadow`.
- `--w-pencil` (#6F665D) and `--w-gilt-b` (#E6C77E) are new colours. Ask the lead to add them to astory.css §1 beside `--terracotta-ink` (#9A4320, which `--w-red` duplicates).

### G8. POLISH: the open leaf's pencil arrow can blink
**Skill:** GSAP (never a visible jump; `immediateRender` and from-state); BAOS rule 25.

**Where:** `OpenLeaf.tsx:57–63`. The trigger is the leaf at "top 70%". The tween has `delay: 0.5` and `immediateRender: false`.

**What goes wrong:** if the arrow is already on screen when the trigger fires (a tall window, or a restored scroll), it shows drawn for 0.5s, vanishes, then draws again.

**Change:** trigger on the arrow itself (`trigger: arrow`, `start: "top bottom-=40"`), drop the delay, and keep `immediateRender: false`. The arrow then stays drawn if the trigger never fires, and starts drawing as it enters.

## Skill by skill

- **taste-skill:**
  - Gaps: G1 (headline lines) and G3 (third face on the cloth).
  - Passes:
    - One live thing: the dog wakes with the words, and the seal and stamp mark the keep.
    - The first screen is not empty at 1366 or 1920.
    - Fullness: Afterwards fits about one screen at 1920 (doc height 1095).
- **hallmark:**
  - Gaps: G2 (error state placement) and G7 (tokens).
  - Passes:
    - No `transition: all`.
    - Focus-visible, active and disabled states on every control.
    - 44px targets.
    - No two-line buttons in the 1366 bar (all four tools are one line, 48px).
    - Grid tracks are `minmax(0, 1fr)`.
    - No horizontal scroll at any of the three sizes.
- **emil-design-eng:**
  - Gaps: G4 (stamp and label disagree) and G6 (dead transition).
  - Passes:
    - House curves everywhere; no ease-in.
    - Press is 0.97 in 120ms.
    - Hovers gated.
    - No animation on W, Esc or Ctrl+Enter.
    - Seal press 280ms.
    - Reduced-motion branches present in CSS, GSAP and the stamp.
- **impeccable:**
  - Gaps: G2 and G5.
  - Passes:
    - Caret, selection (`--foil-pale`) and focus rings are themed.
    - Body text is EB Garamond 22/36 at about 66 characters per line.
    - No banned scaffolds.
- **GSAP (react, timeline, performance, scrolltrigger):**
  - Gap: G8.
  - Passes:
    - Every tween is in `gsap.matchMedia()`, scoped to refs, with `fromTo` and `clearProps`, and reverted on unmount.
    - Only transform, opacity and clip-path are animated.
    - The OpenLeaf ScrollTriggers are killed or reverted on unmount.
    - No refresh is needed.
