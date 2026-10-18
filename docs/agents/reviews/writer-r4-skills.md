# Skills Steward: writer, round 4

**Verdict: GAPS (0 blockers, 1 ugly, 6 polish).** Seven of the eight round-3 gaps are fixed where they were measured. N2 is better but not finished. The new gaps come mostly from the Bond art: on every desktop size his head runs into the top of the sheet, and the two poses are not drawn at one scale.

**Scope:**
- `src/pages/Write.tsx`
- `src/styles/pages/writer.css`
- `src/components/delight/OpenLeaf.tsx`
- The Bond images in `public/dog/` that these files use: `sleep-paper`, `cover-paper` and `curious-paper`.
- B6 is in `src/lib/arrive.ts`. It is outside the three files, but it runs on the writer's step-2 hero.

**Skills loaded:**
- taste-skill: SKILL.md, plus the type, layout, critique and imagery references.
- hallmark: SKILL.md disciplines, plus the slop-test, interaction-and-states and responsive references, and the anti-patterns index.
- emil-design-eng.
- impeccable: SKILL.md, plus craft-floor, polish, layout and critique.
- GSAP: react, timeline, performance and scrolltrigger.
- humanizer, for the error copy.

I also read `docs/BAOS-STANDARD.md`, `DESIGN.md` and `docs/mascot/BOND.md`.

**How it was checked:** I read the code. Then I rendered the page in my own tab (`tab-67`, now closed, viewport reset) and measured it with JS after stepping `__gsap.ticker`.
- **Step 1 (`/write`):** 320, 360, 375, 390, 768, 1366×768, 1366×700, 1920×1000 and 2560×1300. `--zoom` read 1 at 2560 in this pane.
- **Step 2 (`/write?edit=59632e67…&details=1`):** opened at 390 and 1366, without changing anything.
- **Headlines:** as in round 3, I swapped the h1 text for sample questions of 47–87 characters, set `data-len` by the page's own rule, measured, and restored it.
- **Errors:** I inserted the `.w-keep-error` and `.w-state` markup into the bar and the step-2 blocks for one measurement each, then removed it.
- **The padding fix in B1:** I injected the proposed CSS for one measurement, then removed it.
- **The dog's pixels:** I read the art's real sizes and alpha bounds from the files with a canvas.

I typed nothing, pressed nothing and saved nothing. I created no drafts and removed none. The only draft in storage, the `beeedb62…` one, is intact. No console errors.

**Not verified:**
- A real failed Keep or step-2 save (simulated in the DOM only), and the pressed stamp.
- Reduced motion.
- Real Edge and a zoomed Edge window.
- Desktop screenshots at native resolution. The pane scales desktop sizes down and was hidden for part of the session, so I judged the desktop dog from measurements. The phone screenshots are native (DPR 2).
- OpenLeaf on Home (code only).

## Round-3 gaps, re-checked

| # | Gap | Now |
|---|---|---|
| N1 | Mid-length questions in 3 lines at 375 and 360 | **Fixed.** Every sample of 47–71 characters now sets in 2 lines: mid / long are 23.7 / 20.0px at 375, 22.6 / 19.0px at 360 and 19.7 / 17.0px at 320 (`writer.css:433–435`). At 320 the 87-character `xlong` sample is 3 lines, which round 3 accepted. |
| N2 | Failed Keep squeezed into a 120px column in the phone bar | **Better, not finished (B4).** The error now sits in row 2, but it spans only the first column (x 33–298, 265px wide, 89px tall), and "Try again" drops to a third line. The bar grows from 77 to 172px (it was 197). |
| N3 | Step-2 state and errors off-screen | **Fixed.** Each block has its own state (`Write.tsx:342–365`), with "Try again" re-running that block's patch. The empty state is out of the flow (`writer.css:370`). At 390, a chapter error lands at y 1468, under the chips (1098–1454), and it has `role="alert"`. |
| N4 | Stepped sizes shrink tablet questions | **Fixed.** The steps are scoped to `.w-grid.spread` (`writer.css:71–73`). At 768 every sample sets at 32px in 2 lines or fewer. The spread is 28 / 25 / 23px in 2 lines at 1366, 1920 and 2560. |
| N5 | "(Failed to fetch)" in the copy | **Fixed.** `plainCause` (`Write.tsx:135–139`) is used at all three sites, and the raw error goes to `console.warn`. The help tools cannot throw, because `data/ai.ts` falls back locally. |
| N6 | Stamp lands on "Not now" | **Fixed (code).** `.w-keep-note.spent { visibility: hidden }` (`writer.css:229`) and `aria-hidden` while pressed (`Write.tsx:1069`). Not pressed. |
| N7 | Title placeholder cut at 320 | **Fixed.** At 320 the title is 22px, with `scrollHeight` 44 = height 44 (`writer.css:468`). |
| N8 | Hero breaks inside the book's name | **Fixed.** `bookNameIn` plus `.nw` (`Write.tsx:118–122`, `876–879`). At 390 it sets as "Kept in / the Vo book."; at 1366, one line. |

## Bond on the writer: crisp, and in proportion?

**Crisp: yes.**
- **The files:** `sleep-paper.webp` is 781×622 and `cover-paper.webp` is 738×640. Both are tightly cropped (alpha bounds start at row 0).
- **Desktop:** he is drawn at 98×78 CSS px. On the phone he is 98×78 at DPR 2. Even at 2560 the art is scaled down, never up.
- **Phone screenshots (390, DPR 2):** the sepia linework, closed eyes, paws and nose are clean in both poses.

**In proportion: not quite.** Two things are off. The intrinsic sizes in the code belong to the old samoyed, so the poses don't share a scale (B2). The cut-flat cover pose sits on the cloth board (B3). The placement on desktop collides with the sheet (B1).

On the phone he is 28% of the book's width and reads well. On the desktop spread he is 98px on a 1122–1163px book (8.5%), which reads small. Once B1 gives him room, consider 120–128px on `.w-grid.spread.rail`. This is a judgement, not a gap.

## Gaps

### B1. UGLY: on every desktop size, Bond's head runs into the headband and crosses the sheet's foil frame
**Skill:**
- impeccable craft floor ("Spacing: tight groups, generous separation"; check the rendered result).
- taste-skill critique pass 13 (collisions: is anything lying on another element at any position).
- hallmark layout safety.

**Where:**
- `writer.css:38`: `.sheet-page .page.w-desk { padding-top: 56px }`.
- `writer.css:157`: 40px at `max-height: 740px`.
- With `.w-dog { bottom: calc(100% - 13px) }` (`writer.css:99`).

**Measured:**

| Window | Dog top | Sheet top | Headband | Foil frame |
|---|---|---|---|---|
| 1366×768 | 77 | 76 | 74–79 | y 90 |
| 1366×700 | 76 (dog 63 tall) | 76 | 74–79 | y 90 |

At 1366×768 the top 13px of his head stand above the frame line, and his ears touch the headband. At 1366×700 there is no gap at all. 1920×1000 and 2560×1300 measure exactly as 1366×768.

**Cause:** the new art is cut tight to his ears, and the old samoyed box was never re-placed.

On the phone it is clean: there are 18px or more between the question and his ears at 320, and he sits on the board.

**Change (measured):**
```css
.sheet-page .page.w-desk:has(.w-grid.spread) { padding-top: 80px; }
@media (max-height: 740px) { .sheet-page .page.w-desk:has(.w-grid.spread) { padding-top: 64px; } }
```
I injected it at 1366×768:
- The dog's top moves to 101, 11px below the frame.
- The keep bar's bottom moves from 736 to 756, still inside 768.

At 1366×700, 56px put the dog's top at 92, only 2px clear, so use 64px. That gives about 100 for the dog, and the bar's bottom moves from 610 to about 634 (computed from the 56px run).

### B2. POLISH: the two poses are not drawn at one scale, and the sizes in code are the old dog's
**Skill:**
- taste-skill imagery ("same crop ratios, same treatment").
- impeccable polish ("prevent image layout shift; use correct aspect ratios").
- `BOND.md` ("all … at one scale").

**Where:**
- `Write.tsx:147–148`: `width={762} height={640}` and `width={849} height={640}`. The real sizes are 781×622 and 738×640.
- `writer.css:99`: `aspect-ratio: 849 / 640`.
- OpenLeaf has the same problem: `OpenLeaf.tsx:79–80` says 762×640 for both, the real sizes are 781×622 and 755×640, and `astory.css:3500` uses `aspect-ratio: 762 / 640`.

**Measured:** in the writer, `object-fit: contain` draws sleep at a scale of 0.126 and cover at 0.1225. So Bond changes size by 2.9% when he covers his eyes, and his head shifts sideways. In OpenLeaf, sleep is limited by width and drawn at 0.192, while curious is drawn at 0.197 (2.6%).

**Change:**
1. Give every `<img>` its file's real `width` and `height`.
2. Make the box the tallest pose's ratio: `.w-dog { aspect-ratio: 781 / 640 }`, and `.ol-dog { aspect-ratio: 781 / 640 }`.
3. Draw the shorter sleep pose at its true height on the shared scale: `.w-dog .sleep, .ol-dog .sleep { top: auto; height: calc(100% * 622 / 640); }`. Both images keep `object-position: 50% 100%`.

### B3. POLISH: the cover pose's flat-cut chest is drawn over the cloth board
**Skill:** taste-skill imagery ("nothing is a sticker"; treatment); BAOS rule 21 (real assets, used well).

**Where:** `writer.css:99` (`bottom: calc(100% - 13px)`) and `writer.css:453` (10px on the phone).

**Measured:**
- `sleep-paper` tapers at the bottom (1 opaque pixel in its last row), so its paws rest on the edge naturally.
- `cover-paper` is cut flat: its last row is opaque across 662 of 738px. When he wakes, a straight edge of fur 13px tall (17% of him at 1366, 10px on the phone) lies on the chocolate band and ends 5px above the page. This was seen at 390.

**Change:** clip the awake pose at the board's edge, so he peeks from behind the book:
- `.w-dog .awake { clip-path: inset(0 0 13px 0); }`
- `inset(0 0 10px 0)` in the 760px block.

The sleeping pose stays as it is.

### B4. POLISH (N2 residual): the phone error spans one column, not the bar
**Skill:** hallmark 8 states (error) and responsive; impeccable craft floor ("run the real copy at every breakpoint").

**Where:** `writer.css:445` and `457`.
- The seal row is `grid-auto-flow: column` with no explicit columns, so `grid-column: 1 / -1` resolves to the first column only.
- Measured at 390: the error is x 33–298 and 89px tall, and "Try again" is on a third line. The bar is 172px tall.

**Change:**
```css
@media (max-width: 760px) {
  .w-grid:not(.rail) .w-keep-seal { grid-auto-flow: row; grid-template-columns: minmax(0, 1fr) auto; }
  .w-grid:not(.rail) .w-keep-seal .w-keep-note { grid-column: 2; grid-row: 1; }
}
```
The error keeps `grid-column: 1 / -1; grid-row: 2` and then runs the bar's full 325px width.

### B5. POLISH: on a phone, the title line outranks the question
**Skill:** taste-skill type §8 ("keep one size dominant per screen"); DESIGN.md (the question is the display, the title line a sheet-heading).

**Where:** `writer.css:446`, `.w-book .leaf-one .wtitle { font-size: 26px }` at 760px and below.

**Measured:** the placeholder "A title, if one comes to mind" is set at 26px. The question above it is smaller at every phone width:

| Width | Mid question | Long question |
|---|---|---|
| 390 | 24.7px | 20.8px |
| 375 | 23.7px | 20.0px |
| 360 | 22.6px | 19.0px |

The h1 is the second-largest line on the screen.

**Change:** set the phone title to 21px. Then the 320 rule (`writer.css:468`) can go, or stay at 21px. The headline stays the largest thing for every mid question.

### B6. POLISH: the hero's split lines are frozen at the width the page loaded (`src/lib/arrive.ts:153`)
**Skill:** GSAP (SplitText; refresh on layout change, `gsap-scrolltrigger`/`gsap-performance` "refresh when layout changes"); BAOS rule 12 (the founder zooms Edge).

**Where:** `SplitText.create(title, { type: "lines", mask: "lines" })` is never reverted after the arrival.

**Measured:** I loaded step 2 at 390, then widened to 1366. "Kept in / the Vo book." stayed on two lines in a 760px hero where it sets in one line (540px). Narrowing is safe: the line divs rewrap inside the mask, and nothing is clipped.

**Change:** revert the split when the arrival finishes, with `tl.eventCallback("onComplete", () => split.revert())`. Alternatively, create it with `autoSplit: true` and return the tween from `onSplit`. This applies to every page that uses `arrive`.

### B7. POLISH: OpenLeaf's arrow shows drawn, then blanks and redraws (code reading)
**Skill:** GSAP core (`immediateRender`); BAOS rule 25.

**Where:** `OpenLeaf.tsx:59–66`. The tween is a paused `fromTo` with `immediateRender: false`, so the arrow stays fully drawn until the trigger fires at `top bottom-=40`. For its first 40px in view it is drawn. Then it snaps blank and draws again.

**Change:** use `start: "top bottom"`. The cleanup is now correct: the tween and its trigger live in the matchMedia context, which fixes round 3's note.

## Before and after (emil's review format)

| Before | After | Why |
| --- | --- | --- |
| `.page.w-desk { padding-top: 56px }` (40 when short) on the spread | 80px (64 when short) | Bond's ears clear the foil frame by 11px; the seal is still in the first screen |
| `aspect-ratio: 849 / 640`, `width={762}` / `width={849}` | `781 / 640`, real sizes, sleep at `622/640` height | One scale for both poses; no 2.9% jump when he wakes |
| Cut-flat cover pose over the board's top band | `clip-path: inset(0 0 13px 0)` on `.awake` | He peeks from behind the book instead of sitting on it like a sticker |
| `grid-auto-flow: column` seal row on the phone | Explicit `minmax(0,1fr) auto` columns | The error runs the bar's width, two lines, not three |
| Phone title 26px | 21px | The question stays the largest line |
| SplitText kept after the arrival | `split.revert()` on complete | The hero rewraps when the window or zoom changes |
| Arrow trigger at `top bottom-=40` | `top bottom` | No drawn-then-blank flash |

## Skill by skill

- **taste-skill:**
  - Gaps: B1 (collision), B2 and B3 (imagery treatment), and B5 (one dominant size).
  - Passes:
    - Two-line headlines at every width from 320 to 2560, for every bank-length question.
    - The step-2 break is authored (N8).
    - One live thing: Bond wakes with the words.
- **hallmark:**
  - Gap: B4 (error state on the phone).
  - Passes:
    - No horizontal scroll at any measured width (`scrollWidth` equals the viewport).
    - Per-block error and success states with a retry in step 2 (N3).
    - Tokens locked in the page rules.
    - No `transition: all`.
    - Focus-visible, active and disabled states on every control.
    - 44px targets.
- **emil-design-eng:**
  - No new gaps.
  - Passes:
    - Press at 0.97 in 120ms.
    - The seal settles in 280ms on `OUT`.
    - No animation on W, Esc or Ctrl+Enter.
    - Hovers gated.
    - No ease-in.
    - The note hides with the stamp (N6).
  - On the material side, the 520ms cross-fade and OpenLeaf's 700ms lift are on the dog, not on UI, so they are within DESIGN.md rule 1.
- **impeccable:**
  - Gaps: B1 (spacing), B2 (aspect ratios) and B4 (real copy at a breakpoint).
  - Passes:
    - Errors now name the cause in the product's words, plus the recovery (N5).
    - Caret, selection and focus themed.
    - No console errors.
- **GSAP (react, timeline, performance, scrolltrigger):**
  - Gaps: B6 and B7.
  - Passes:
    - The writer's arrival is in `gsap.matchMedia()` with `fromTo`/`clearProps` and is reverted on unmount.
    - The press tween is in a reverted context, and the keep timers are cleared.
    - OpenLeaf's tween and trigger now sit inside the matchMedia context, and `st.kill()`/`mm.revert()` clean up.
- **humanizer:** the error lines read plainly: "There's no connection just now. Your words are still here; try again." and "Something went wrong on our side." Nothing to change.
