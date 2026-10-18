# Skills Steward: writer, round 3

**Verdict: GAPS (0 blockers, 3 ugly, 5 polish).** All eight round-2 gaps are fixed where round 2 measured them. Three of the fixes stop short: the headline fix fails on narrower phones, the error-beside-the-seal fix breaks the phone bar, and the error rule was never applied to step 2.

**Scope:** `src/pages/Write.tsx`, `src/styles/pages/writer.css`, `src/lib/stamp.ts` (`inkStamp(x, y, word, { offsetX, align })`) and `src/components/delight/OpenLeaf.tsx`.

**Skills loaded:**
- taste-skill: SKILL.md, plus the layout, type and critique references.
- hallmark: SKILL.md disciplines, plus the slop-test, interaction-and-states and responsive references, and the anti-patterns index.
- emil-design-eng
- impeccable: SKILL.md, plus craft-floor, polish, layout and critique.
- GSAP: react, timeline, performance and scrolltrigger.
- humanizer, for the new error copy.

I also read `docs/BAOS-STANDARD.md` and `DESIGN.md`.

**How it was checked:** I read the code, then rendered the page in my own tab (`tab-54`, now closed, viewport reset) and measured it with JS after stepping `__gsap.ticker`:
- **Step 1 (`/write`):** 320, 360, 375, 390, 768, 1024, 1280×800, 1366×768, 1920×1000, and 2560×1300 (where `--zoom` is 1.3).
- **Step 2 (`/write?edit=59632e67…&details=1`):** opened without changing anything, at 390 and 1366.

To test the headlines, I swapped the h1's text for sample questions of 41 to 81 characters, setting `data-len` by the page's own rule, then restored it. To test the stamp, I placed a copy of `.ink-stamp` exactly where `lib/stamp` puts it, measured it and removed it. To test the phone error, I inserted the `.w-keep-error` markup into the bar for one measurement, then removed it.

I typed nothing, pressed nothing, saved nothing, and created and removed no drafts.

**Seen in storage, not caused by me:**
- On first load, `/write` held another agent's own-words draft ("Review test line, to be cleared.").
- That key and the `59632e67…` edit draft were both removed from localStorage by someone else during the session. Only Keep removes drafts (`Write.tsx:751–753`), and I never pressed it.
- The `beeedb62…` draft is intact.

**Not verified:**
- A real failed Keep (simulated in the DOM only).
- Live help responses.
- Reduced motion (not re-run this round).
- Real Edge, and a zoomed-out Edge window. The 2560 run at `--zoom` 1.3 is the nearest check.
- OpenLeaf on Home (code only).

## Round-2 gaps, re-checked

| # | Gap | Now |
|---|---|---|
| G1 | Real questions set in 3 lines (blocker) | **Fixed at 390 and up.** Every sample of 41–81 characters sets in 2 lines at 390, 1280, 1366, 1920 and 2560 (left-page measure 381–410 CSS px). It still fails at 375 and 360 (see N1) and is too small on tablets (see N4). |
| G2 | Failed Keep invisible where Keep was pressed | **Fixed on desktop.** `.w-keep-error`, with `role="alert"` and "Try again", now sits under the seal (`Write.tsx:995–1004`), and the retry is hidden on an empty page. `dictation.problem` stays beside Speak, which is where it was pressed, so that is accepted. It breaks the phone bar (N2), and step 2 still has the old problem (N3). |
| G3 | Step-2 headline off-system | **Fixed.** `.whero h1` is Montserrat 700, `rgb(246,240,230)` (`--on-chocolate`), 56px at 1366 and 36px at 390. The line break needs one touch (N8). |
| G4 | Stamp on the label, which still said "Keeping…" | **Fixed.** Pressed, the label reads "Kept" (`Write.tsx:993`). The stamp starts 16px right of the button (`align: "start"`, `Write.tsx:771–775`). Measured: 1366 button right edge 252, stamp 267–424; 1920 (rail) 1565–1716, inside the 1725 column; 2560 at z 1.3, button 2051, stamp 2070–2273. On the phone it lands on "Not now" (N6). |
| G5 | Stale title height | **Fixed.** Re-measured on `document.fonts.ready` and by a `ResizeObserver` on the book (`Write.tsx:594–618`). Title 44/44 and body 108/108 at 1366, title 44/44 at 360. No ResizeObserver loop errors in the console. |
| G6 | Dead 700ms transition on the dog | **Fixed.** `.w-dog` has no transition. Only the image cross-fade remains, and it is in the reduced-motion list (`writer.css:448`). |
| G7 | Literal colours in page rules | **Fixed.** `--w-board-tint`, `--w-board-shadow`, `--w-hover-foil`, `--w-fold-line` and `--w-pencil-rule` are in the `.w-desk` token block (`writer.css:25–29`). `--w-pencil` and `--w-gilt-b` are in astory.css `:root` (line 3875) beside `--terracotta-ink`. No raw colour is left in a page rule. |
| G8 | OpenLeaf arrow can blink | **Fixed (code).** The trigger is the arrow, at `start: "top bottom-=40"`, `once`, with no delay and `immediateRender: false` (`OpenLeaf.tsx:93–106`). It is not rendered on Home this round. |

## Gaps

### N1. UGLY: mid-length questions are 3 lines at 375 and 360
**Skill:** taste-skill house rule ("two lines or fewer, at every width"); hallmark responsive (320/375/414 are non-negotiable widths); BAOS rule 12.

**Where:** `writer.css:413–414`. The phone steps are fixed pixels: `[data-len="mid"] { font-size: 25px }` and `[data-len="long"] { font-size: 21px }`.

**Measured:**
- **375** (iPhone X/12 mini/SE2): "Walk me through an ordinary Tuesday when you were thirty-five." (62 characters) and a 64-character question set in 3 lines at 25px.
- **360** (the commonest Android width): 61, 62 and 64 characters are all 3 lines.
- **320:** 61–67 characters are 3 lines.

**Cause:** 25px is right for the 346px measure at 390 only. The measure shrinks with the phone, and the size does not.

**Change (measured):** scale the steps with the width, divided by the zoom.
```css
.sheet-page .page.w-desk .w-grid .w-question[data-len="mid"]  { font-size: clamp(19px, calc((100vw / var(--zoom, 1) - 44px) / 14), 25px); }
.sheet-page .page.w-desk .w-grid .w-question[data-len="long"] { font-size: clamp(17px, calc((100vw / var(--zoom, 1) - 44px) / 16.6), 21px); }
```
Injected at 375, 360 and 320, this sets every sample of 41–67 characters in 2 lines (23.7, 22.6 and 19.7px for mid). The 73–81-character `xlong` case still sets in 3 lines at 320. Only edited titles are that long (the question bank's longest is 67), so that is acceptable.

### N2. UGLY: on a phone, a failed Keep squeezes into a 120px column inside the bar
**Skill:** hallmark 8 states (error) and responsive; impeccable craft floor ("run the real copy at every breakpoint").

**Where:**
- `writer.css:436`: `.w-grid:not(.rail) .w-keep-seal { grid-auto-flow: column; justify-content: space-between }`.
- `Write.tsx:995`: the error `<p>` is a child of `.w-keep-seal`, so it becomes a third column.

**Measured at 390:** the error box is x 178–298 and 170px tall, between "Keep it" and "Not now". The sticky bar grows to 197px and covers the page while the person is writing. The text wraps to five lines and "Try again" sits under them.

**Change:**
```css
@media (max-width: 760px) {
  .w-grid:not(.rail) .w-keep-seal .w-keep-error { grid-column: 1 / -1; grid-row: 2; margin: 2px 0 0; max-width: none; }
}
```
The error then runs under the seal row, across the bar's full width.

### N3. UGLY: step 2's "Keeping…", "Kept" and its errors are off-screen when a chapter or photograph is chosen
**Skill:** hallmark 8 states (error, success); impeccable craft floor ("errors name the problem and the recovery"). Also BAOS rule 1: this is G2's rule, never applied to step 2.

**Where:** `Write.tsx:395` (the `Problem` at the top of `.w-after`) and `Write.tsx:407` (the `.w-state` beside the heading).

**Measured:**
- **1366:** the banner and the state sit at y 281. The chapter chips are at 937–1145, so choosing one means scrolling past both.
- **390:** both sit at 280. "A photograph" is at 872 and "The chapter" at 1139, and the document is 2681 tall.

**What goes wrong:** `keep()` calls `onKept` only on success, so a failed save leaves the chip unpressed with no visible message. A failed or capped upload ("Five photographs a week on Free…") also shows only at the top.

**Change:** show the state and the error where the press happened.
- Keep the last block that saved in state (`keep(patch, "chapter")`). Render `<p className="w-keep-error" role="alert">` with a "Try again" that re-runs that patch, under that block's chips or the attach button.
- Do the same for the "Keeping… / Kept" mark.
- Alternatively, one `position: sticky; bottom: 12px` status line at the foot of `.w-choices`.

### N4. POLISH: the stepped headline sizes shrink questions on tablets, and long ones fall below the words' size
**Skill:** taste-skill type ("keep one size dominant per screen"; "size last"); DESIGN.md (two or three sizes do the visible work).

**Where:** `writer.css:71–72` apply `[data-len]` 28px and 22px to every layout. The comment there says they were sized for the left page.

**Measured:**
- **Tablet, 761–1279px:** the single-page question has a 760px measure. Mid questions drop from 32px to 28px and long ones to 22px, and run as one long line.
- **Bigger sizes still fit:** at 768 and 1024, 32px and 36px set every sample of 41–81 characters in 2 lines.
- **Desktop spread:** 22px Cormorant for `long` and `xlong` reads smaller than the 22–23px EB Garamond words below it. At 1366, 25px still sets 67–81 characters in 2 lines (26px breaks at 81).

**Change:**
1. Scope the steps to the spread: `.sheet-page .page.w-desk .w-grid.spread .w-question[data-len="mid"]` (and long and xlong).
2. Let the single layout from 761px keep the default `clamp(32px, 2.7vw/zoom, 44px)` with `max-width: none` for `[data-len]`.
3. Raise `long` and `xlong` on the spread to 25px.

### N5. POLISH: errors print the browser's words, "(Failed to fetch)"
**Skill:** impeccable craft floor ("Copy: the product's own language… errors name the problem and the recovery"); humanizer.

**Where:** `Write.tsx:789` (Keep), `Write.tsx:251` (step 2 save) and `Write.tsx:296` (upload). Each interpolates `err.message`.

**Change:** map the cause to words:
- Offline or a `TypeError` from fetch: "There's no connection just now."
- Anything else: "Something went wrong on our side."

Then add the recovery that is already written ("Your words are still here; try again."). Keep the raw message for `console.warn` or `track`.

### N6. POLISH: on a phone the stamp lands on "Not now", which is stale after the keep anyway
**Skill:** emil (one idea per moment); DESIGN.md rule 4.

**Where:** `Write.tsx:1005–1017` stays rendered while `pressed`. On the phone, "Not now" shares the seal's row.

**Measured at 390:** stamp x 193–350 and y 702–747; the link is x 298–357 and y 703–746. They overlap for about 1.3s. On desktop the stamp clears the note line by 0–1px (1366: stamp bottom 698, note text from 697).

**Change:** once `pressed`, hide `.w-keep-note` with `visibility: hidden`, so the row keeps its height. "Ctrl + Enter keeps it" and "Not now" mean nothing after the page is kept, and the stamp then lands on clear paper at every size.

### N7. POLISH: the title placeholder is cut in half at 320
**Skill:** impeccable craft floor (run the real copy at every breakpoint); hallmark responsive (320).

**Where:** `Write.tsx:584–587` forces the empty title to 44px. At 320, "A title, if one comes to mind" wraps at 26px in 234px, so "mind" shows only its top half (`scrollHeight` 60). It holds at 360 and up.

**Change:** add `@media (max-width: 359px) { .w-book .leaf-one .wtitle { font-size: 22px; } }`, or shorten the placeholder to "A title, if one comes".

### N8. POLISH: the step-2 hero breaks inside the book's name
**Skill:** taste-skill type §8 ("a break that splits a phrase… Author the break").

**Where:** `Write.tsx:813–816`. At 390 it sets as "Kept in The / Vo book.".

**Change:** join the book's name with non-breaking spaces in the hero (`bookName.replace(/ /g, "\u00a0")`), so it breaks as "Kept in / The Vo book." It stays two lines at 390. Longer surnames fall to the second line whole.

## Before and after (emil's review format)

| Before | After | Why |
| --- | --- | --- |
| `[data-len="mid"] { font-size: 25px }` on the phone | `clamp(19px, calc((100vw / var(--zoom,1) - 44px) / 14), 25px)` | Fixed px fit only 390; 375 and 360 set in 3 lines |
| `.w-keep-error` as a third auto-flow column | `grid-column: 1 / -1; grid-row: 2` on the phone | The error is a line under the seal, not a 120px tower |
| Step-2 `Problem` and `.w-state` at the top of `.w-after` | Error and state beside the block that saved | State shows where the press happened |
| `[data-len]` 28/22px on every layout | Scoped to `.w-grid.spread`; long and xlong at 25px | The headline stays the largest thing; tablets keep 32px |
| `(${err.message})` in the copy | Plain cause plus the existing recovery line | "Failed to fetch" is not the product's language |
| `.w-keep-note` shown while `pressed` | `visibility: hidden` once pressed | One idea per moment: the stamp, on clear paper |

## Skill by skill

- **taste-skill:**
  - Gaps: N1 (headlines at 375 and 360), N4 (size hierarchy) and N8 (authored break).
  - Passes:
    - Two lines at 390, 1280, 1366, 1920 and 2560 for every sample length.
    - The step-2 cloth headline is now the house Montserrat (G3).
    - One live thing: the dog wakes with the words, and the seal and stamp mark the keep.
    - The seal is in the first screen at 1366×768 (bottom at 713).
- **hallmark:**
  - Gaps: N2 (error state on the phone), N3 (error and success states in step 2) and N7 (320).
  - Passes:
    - No horizontal scroll at 320–2560 (`scrollWidth` equals the viewport).
    - The four tools in the 1366 bar are one line each, 48px tall.
    - Tokens are locked (G7).
    - No `transition: all`.
    - Focus-visible, active and disabled styles on every control, including the new `.w-retry`.
    - 44px targets.
- **emil-design-eng:**
  - Gap: N6.
  - Passes:
    - The label and stamp agree ("Kept").
    - The press is 0.97 in 120ms.
    - The seal press is 280ms on `OUT`.
    - No animation on W, Esc or Ctrl+Enter.
    - Hovers gated.
    - No ease-in.
    - Transitions are 120–200ms on UI. The 520ms cross-fade is on the dog, a material.
- **impeccable:**
  - Gaps: N3 and N5 (copy), N7.
  - Passes:
    - Caret, selection and focus rings themed.
    - Both autosizers re-run on fonts and resize (G5).
    - No console errors.
    - No banned scaffolds.
- **GSAP (react, timeline, performance, scrolltrigger):**
  - Passes:
    - The arrival is inside `gsap.matchMedia()` with `fromTo` and `clearProps`. Nothing is left below opacity 1 once the clock runs (checked after 1.5s of real ticks).
    - The press tween is in a `gsap.context` reverted on unmount.
    - Keep timers are cleared.
    - The stamp is a self-removing timeline with a reduced-motion branch.
    - OpenLeaf: `st.kill()` and `mm.revert()`, and the arrow triggers on itself (G8).
  - One note, not a gap: OpenLeaf's arrow tween is created in `onEnter`, outside the matchMedia context, so an unmount during its 0.9s runs it on a detached node. Wrapping it in the context is enough if the file is touched again.
- **humanizer:** the new copy reads plainly ("Your words are still here; try again."). The exception is the interpolated `err.message` (N5).
