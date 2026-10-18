# Skills Steward: writer, round 6

**Verdict: GAPS (0 blockers, 1 ugly, 2 polish).** All seven round-5 gaps (N1 to N7) are fixed. The new sticky left page passes every check: it never reaches the bar, the cloth or the running head, at any size I measured. The fresh pass found three things:
- On a short window, the folio's descenders cross the foil frame.
- On a large window, the left page and the margin pin at two different heights.
- §46.7 still holds rules for the old writer that nothing uses.

**Scope:**
- `src/pages/Write.tsx`
- `src/styles/pages/writer.css`
- The writer rules in §46 of `src/styles/astory.css` (lines 3442–3461 now)

**Skills loaded:**
- taste-skill: SKILL.md (house rules, laws) and the critique reference.
- hallmark: the 58-gate slop test (gate 56 on sticky elements in particular), interaction-and-states, responsive.
- emil-design-eng.
- impeccable: SKILL.md, craft-floor, polish, layout.
- GSAP: react, timeline, performance, and the scrolltrigger refresh and cleanup rules.
- humanizer, for the error copy.

I also read `docs/BAOS-STANDARD.md` and `DESIGN.md`.

**How it was checked:** I read the code, then measured the page with JS in my own tab (`tab-89`, now closed, viewport reset). I stepped the GSAP ticker and reloaded after every resize.
- **The pane was hidden,** so screenshots came back blank. Everything below is measured, not seen.
- **The sticky sweep:** I scrolled from the top to the end in 10px steps. At each step I recorded the left page's content against the bar, the verso running head, the left page's foil frame and the keep bar.
- **Sizes for the sweep:** 1366×768, 1366×700, 1280×720, 1920×1000 (rail), 2560×1300 (`--zoom` 1.3) and 3840×2000 (`--zoom` 2).
- **A real long page:** at the start, a story-level draft from another session (803 characters, "We had a dog called Bond…") was in this browser. It gave a real long page at 1366×768. It wasn't mine and I didn't touch it; it was gone by the next load.
- **A simulated long page:** at the other sizes I injected `.wbody { min-height: 1600px }` and added the `writing` class in the DOM, then removed both.
- **Steps 1 and 2:** step 1 at 768×1024, 390×844 and 320×700 for N2, N4, N5 and N6. Step 2 wasn't reopened this round, because nothing in it changed.
- **Simulated in the DOM, then removed:** the phone keep error (N2) and two CSS injections, one for each fix proposed in G1 and G2.
- **Swapped, then restored:** the 320 headline, for one mid-length bank question.

I typed nothing, pressed nothing and saved nothing. I created no drafts and removed none.
- The `beeedb62…` draft was untouched.
- `astory-app-auth` was never read for anything but its presence.
- No console errors.

**Files changed while I worked:** `astory.css` and `Shell.tsx` carry an mtime of 00:26, during this review, and §46 moved up by five lines. I re-read §46 after that time, and the line numbers below are the current ones. `Write.tsx` (00:17) and `writer.css` (00:19) didn't change after I read them.

**Not verified:**
- Reduced motion. A global rule (`astory.css:515–516`) collapses every transition to 1ms, so gate 27 holds by code.
- Real Edge and a zoomed Edge window.
- 375 and 414 widths.
- A real failed Keep (simulated only).
- Typing into the page. The long page was a real draft at 1366 only and a CSS stand-in elsewhere.
- Anything visual: the pane was hidden.

## The sticky left page

`writer.css:199`: `.leaf-left > .leaf-left-in { position: sticky; top: calc(var(--top-h) + 16px) }`.

| Check | Result |
|---|---|
| **The bar** | **Clear at every size.** The pinned content stays 16px under the full 64px bar and 24px under the condensed 56px bar (`top.stuck`). At zoom 1.3 it is 21px of 83, and at zoom 2 it is 32px of 128. The bar is `z-index: 60` over the book's isolated context (`.w-book` is `isolation: isolate`). So at the end of the page, the content slides under the solid bar, never over it. |
| **The cloth** | **Never meets it.** The content only pins after the cloth has scrolled off: from scrollY 150–170 at 1366, 220 at 2560 and 330 at 3840. The cloth's bottom is at 104 CSS px. A sticky box can't leave its container (`.leaf-left`), and that container starts below the cloth. |
| **The running head** (verso, "THE VO BOOK · MEMORY NO. 9") | **Never overlapped.** It sits above the sticky box in the flow, and sticking only moves the box down. The closest the two come is their resting gap: 10px at 768 and taller, 6px at 700 and 720, 13px at zoom 1.3, 20px at zoom 2. Once the page moves, the head scrolls up under the bar and the question stays. The page has no sheet-level running head (`Shell.tsx:268` hides it on `/write`), so there's no second band to collide with. |
| **The left page's foil frame** | **Inside it.** At the end of a long page, the pinned block lands on the page's foot. At 1366×768 the pencil note (270–293) lines up with the right page's folio (267–293), and it sits 8px above the frame line. At 700 and 720 the last question's text is 7.4px above the frame; only its row padding crosses, by 4px. |
| **The keep bar** (sticky at the bottom while writing) | **Never reached.** The tightest gap is 36px, at 1366×700 and 1280×720. The pinned block is 295–375px tall, so pinned at 80px it ends at about 380–455, well above the bar's top (598 at 700, 667 at 768). |
| **Arrival** | **Fine.** The margins tween (`Write.tsx:704`) takes in `.leaf-left-in`. It moves `y` and opacity only, uses `clearProps`, and runs inside the matchMedia context that is reverted on unmount. |

## Round-5 gaps, re-checked

| # | Gap | Now |
|---|---|---|
| N1 | Bond's ears 5–6px under the foil frame at 1366×700 | **Fixed.** Padding is now 72px (`writer.css:164`). The frame line is at y 90; the sleeping dog's top is at 104.1 and the awake dog's at 106, so 14–16px clear. The keep bar ends at 640 of 700. |
| N2 | "Try again" on its own line on the phone | **Fixed.** `writer.css:463–464`. At 390 the error is 2 lines (1091–1132), with "Try again" at the end of line 2. The button is 44px tall, and the bar went from 173 to 125px. |
| N3 | "try again" said twice | **Fixed.** `Write.tsx:850` now reads `` `${plainCause(err)} Your words are still here.` ``, and the button is the one recovery. |
| N4 | The title outranking a mid question at 320 | **Fixed.** The title is 19px at 340px and below (`writer.css:493`). A mid bank question sets in 2 lines at 19.7px. It is only 0.7px larger, but the placeholder is italic 500 in pencil grey, so the question still leads. |
| N5 | A lone pill on a tablet | **Fixed.** `writer.css:78`. At 768 three pills share one row (586–630). |
| N6 | Bond 8px under the subtitle on a tablet | **Fixed.** `writer.css:77`, 112px. The subtitle ends at 256 and the dog's top is at 279, so 23px. |
| N7 | OpenLeaf left behind | **Fixed.** `OpenLeaf.tsx` is deleted, no `.open-leaf` or `.ol-*` rule remains in `src/`, and `writer.css:500–505` is now the "Kept" stamp. |

## Gaps

### G1. UGLY: on a short window, the folio's descenders cross the right page's foil frame
**Skill:** taste-skill critique pass 13 (collisions); impeccable craft floor ("run the real copy at every breakpoint"); BAOS checklist ("no clipped or overlapping text").

**Where:** `writer.css:167`. Inside `@media (max-height: 740px)`, this rule sets `padding-bottom: 8px` on `.sheet-page .spread .w-book .leaf-one`, and the frame sits at `inset: 12px` (`:113`). So the folio's line box ends 4px *below* the frame line.

**Measured** (the folio reads "Oct 18, late at night", Montserrat 13px):
- **1366×700:** the baseline is at 509.8 and the frame line at 510.3, so the text sits 0.5px above the hairline. The descent runs 2.8px past it, so the "g" and the comma cut through the foil.
- **1280×720:** the same, 0.5px and 2.8px.
- **768 and taller:** clear, with padding 20px (`:154`). The baseline is 12.5px above the frame at 1920×1000.

**Change:** use 16px in the short block for both pages, so the two feet match:
```css
@media (max-height: 740px) {
  .spread .leaf-left, .spread .leaf-left-in, .sheet-page .spread .w-book .leaf-one { …; padding-bottom: 16px; } /* :167 */
  .spread .leaf-left { padding-bottom: 16px; }                                                                /* :176 */
  .spread .leaf-left-in { padding: 0; }                                                                       /* :168, unchanged */
}
```
I injected 16px on both pages at 1366×700:
- The folio's baseline moved to 8.5px above the frame, with the descenders 5.2px clear.
- The left page's last line moved from 7.4 to 15.4px above its frame.
- The keep bar's bottom moved from 640 to 648, still inside 700.

### G2. POLISH: on a large window, the left page and the margin pin at two different heights
**Skill:** BAOS rule 10 ("columns align and tops line up"); taste-skill critique pass 4 (edges); hallmark gate 56 (sticky offsets from one token).

**Where:**
- `writer.css:199` pins `.leaf-left-in` at `--top-h + 16px`.
- `writer.css:55` pins `.w-grid.rail .w-side` at `--top-h + 40px`.

Both are in view side by side at 1560px and wider.

**Measured at 1920×1000, scrolled into a long page:**
- The left page's block pins at 80 and the margin at 104.
- At rest it's the other way round: the margin's top is at 166, level with the book, and the left page's block is at 238.
- So as the page scrolls, the two columns cross and settle 24px apart.

**Change:** one line for both, on the rail only. That keeps 80 on a laptop, where the keep bar under the book needs the room:
```css
.w-grid.rail .leaf-left > .leaf-left-in { top: calc(var(--top-h) + 40px); }
```
Injected at 1920×1000, both pin at 104: the left page's kicker at 114 and the margin's heading at 108. The bar gap becomes 40px, and the 452px block ends at 556, with no bar beneath it on the rail.

### G3. POLISH: §46.7 still styles the old writer, and the rest is overridden
**Skill:** impeccable polish ("remove dead code, obsolete styles"); the same rule as round 5's N7.

**Where** (`astory.css`):
- **Dead:** `.leaf-one > .leaf-ribbon` at `:3451–3453`, `:3457` and `:3460`. The writer's ribbon is `.w-ribbon` now, and no TSX renders `.leaf-ribbon`.
- **Dead:** `.desk .leaf-one + .keeprow` at `:3454`. No TSX renders `.keeprow`, so the `.keeprow` rules at `:768–784`, `:815`, `:833–834`, `:1567`, `:1718`, `:1735` and `:1752` are dead too. Those are outside this scope, but they are the same leftover.
- **Overridden:** `.leaf-one .dear` at `:3450`, and `.leaf-one .folio` with its phone size at `:3455–3456` and `:3461`. `.leaf-one` exists only in `Write.tsx`, and `writer.css:118` and `:128–129` override every property they set.
- **Measured at 320:** the folio computes to 13px, weight 500, no tracking and no uppercase, which is writer.css. Neither §46.7's 11px or 10.5px small caps nor its padding wins. `.dear` computes to 20px, again writer.css.
- **The comment is wrong too:** §46's header (`:3396`) and §46.7's comment (`:3448–3449`) still promise "the folio in small caps". The folio ships in sentence case.

**Change:**
- Delete `:3450–3457` and `:3459–3462`, but keep `.leaf-ear` (§46.6, `:3444–3446`, which is live).
- Fix the comment so it names the turned-down corner only, and points to writer.css for the rest.
- Optionally, in a separate pass, delete the `.keeprow` block.

## Before and after (emil's review format)

| Before | After | Why |
| --- | --- | --- |
| `padding-bottom: 8px` on both pages under 740px tall | `16px` | The folio's "g" and comma no longer cut the foil frame; the keep bar still ends at 648 of 700 |
| `.leaf-left-in` pinned at `--top-h + 16px` beside a margin pinned at `+ 40px` | `+ 40px` on the rail | The left page and the margin pin on one line instead of crossing and settling 24px apart |
| `.leaf-ribbon`, `.keeprow` and small-caps folio rules in §46.7 | Deleted; the comment fixed | No styles for an old writer; the comments describe what ships |

## Skill by skill

- **taste-skill:**
  - Gaps: G1 (collision), G2 (edges).
  - Passes:
    - Headlines at two lines or fewer, including a mid question at 320.
    - One live thing: Bond wakes and covers his eyes.
    - No horizontal scroll at 320, 390, 768, 1280, 1366, 1920, 2560 or 3840.
    - The left page no longer leaves a screen of blank paper beside a long page, which is the point of the sticky.
- **hallmark:**
  - Gate 56 passes. The sticky block is offset by `--top-h`, and the bar out-paints it (`z-index` 60 over an isolated book).
  - Gate 10: no `transition: all`.
  - Gate 27: the global reduced-motion rule.
  - Gate 49: no two-line buttons.
  - Gate 50: `minmax(0, 1fr)` on every grid.
  - Gate 48: the writer's raw values are in its `.w-desk` token block. `--w-pencil` and `--w-gilt-b` are defined in `astory.css:3798`.
  - The error state on the phone is now right (N2).
  - The retry's 44px pad overlaps the lower 10px of line 1 between x 133 and 203, which is acceptable for an inline link.
- **emil-design-eng:**
  - No gaps.
  - Passes:
    - Round 5's note is resolved: the cover pose now leaves in 100ms and sleep returns after a 100ms delay (`writer.css:104–107`), so there's no double exposure on the way back to sleep.
    - Press is 0.97 in 120ms.
    - The seal is 200ms.
    - Hovers are gated.
    - No ease-in.
    - No animation on W, Esc or Ctrl+Enter.
- **impeccable:**
  - Gaps: G1 (real copy at a breakpoint), G3 (obsolete styles).
  - Passes:
    - The sticky block stays inside the page's frame at every size.
    - Caret, selection and focus are themed.
    - No console errors.
- **GSAP (react, timeline, performance, scrolltrigger):**
  - No gaps.
  - Passes:
    - The arrival timeline uses `fromTo`, with `clearProps` on transform, opacity and clipPath.
    - It sits inside `gsap.matchMedia()` and is reverted on unmount (`Write.tsx:694–715`).
    - The sticky block is only tweened on `y` and opacity.
    - There's no ScrollTrigger on the writer; the sticky is plain CSS, so there's nothing to refresh.
- **humanizer:** N3 is fixed. "There's no connection just now. Your words are still here." plus **Try again** reads plainly.
