# Signed-out pages, round 10: skills review

**Verdict: GAPS. There are 3 gaps, all polish** (0 blockers, 0 ugly).

Both of Bao's round 9 defects are fixed:
- **The code field:** `PlateCode` keeps the code inside the plate's frame at every width from 320 to 760, and its focus ring clears the paper's edge by 2 px.
- **The headings:** every heading on every signed-out route is two lines or fewer at ten widths from 320 to 760. The front door's headline holds two lines from 320 (28.2 px) up.
- **The placeholders:** none is clipped.
- **The basics of the field:** its accessible name, `aria-invalid`, focus ring, `one-time-code`, the numeric keypad, paste of a formatted code and Backspace at the end all work.

Three small things remain in the new field:
1. Its caret is invisible but still moves. A tap on a slot, or an arrow key, puts the next digit or Backspace in the middle of the code, while the slots show the end as next.
2. Pasting text with no digits erases the digits already typed.
3. The digits are set in Cormorant's old-style figures, so 3, 4, 7 and 9 drop below the line. A code is data, so it wants lining, tabular figures.

**Scope.** Commit b6ed7c5:
- `PlateCode.tsx` (new), used on Verify and on Forgot password's code step;
- `useCodeAria.ts` (the comment only);
- the `.plate-code` rules in `signed-out.css` (§2 and the phone block), and the phone heading clamps (`.promise-line`, the plate titles, `.cb-q`, `.door-leaf h1`);
- shorter placeholders on Create account, Forgot password and Contribute.

Account's `CodeInput` (signed in) is unchanged and out of scope.

## How it was checked

**Setup:**
- Headless Playwright (`09142026/node_modules/playwright`) against `http://localhost:5180` at b6ed7c5.
- Every context was new, with no session.
- Only fake values were used: `reader@example.test`, K7M2QX and digits.
- **Network guard:** every non-GET request to Supabase was aborted. 0 were attempted in the field tests.

**Never submitted.** Verify submits on its own at six digits, so on Verify I typed at most five digits. Every six-digit case (a paste of a formatted code, a seventh digit, Backspace when full, select-all and delete, and an OS one-time-code fill) ran on `PlateCode` mounted alone through Vite, with no form around it.

**What was measured:**
- **The field's behaviour,** at 1920×1000 (mouse) and 390×844 (touch, DPR 3). After each step I read the value, the caret, which slot is marked next, what the slots show, focus and `:focus-visible`, `aria-invalid` and `aria-describedby`.
- **The accessibility tree:** Playwright's `ariaSnapshot` of the input.
- **Geometry,** at 320, 340, 360, 375, 390, 430, 600, 760, 1366 and 1920: the row, its focus ring and the plate's inner frame, the slot and hit sizes, and horizontal scroll.
- **Headings:** every `h1`, `h2`, `.promise-line`, `.cb-q` and `.plate-head` at ten widths (320–760), on 11 route states. That includes `/join/ABC`, and `/c` stubbed with a person, with a failure and with a missing link: 110 renders. The same renders checked every `input` placeholder against its box.
- **Regression spot-check:**
  - the 280-render sweep;
  - Bond's ear against the door's "Sign in" pill (360–760);
  - rule 27 at 360;
  - per-frame fit under reduced motion at 1366;
  - the weave on two turns at 1920;
  - 30 resizes and 2 drags;
  - GSAP cleanup.

**Screenshots,** in `shots/`:
- `signed-out-r10-skills-{320,360,390,1920}-verify-code.png`;
- `-320-door-head.png`;
- `-1920-code-figures.png` and `-1920-code-figures-lining.png`.

## What holds

**Bao's round 9 finding 1 is fixed: the code sits inside the plate.**
- **The row and its ring:** at every phone width the row and its focus ring stay inside the paper. The ring clears the frame's inner edge by 2 px at 320, 340, 360, 375, 390, 430, 600 and 760. The row runs from 61 to 259 at 320, inside a paper of 55–265, with no horizontal scroll.
- **The hit area:** the whole row, 52 px tall, at every width. It is 47 px at 1366 (fit 0.9), against a floor of 44.
- **The slots:**
  - 29 px wide at 320, 37 px at 390, 71 px at 1920;
  - the digits 24 px on a phone and 28 px on the spread;
  - the input's own text is 16 px, so iOS doesn't zoom on focus.
- **By eye** (`-320-verify-code.png`): six slots inside the engraved frame, the next one outlined, and the ochre ring round the whole row.

**The field, against hallmark's interaction states and accessibility.**
- **Its name:** `aria-label="6-digit code"`. The accessibility tree reads `textbox "6-digit code" [invalid]: "1234"`, and the slots are `aria-hidden`.
- **The error:** Continue with four digits sets `aria-invalid="true"` and `aria-describedby="plate-say"`. The plate's line reads "Type all six digits from the email." with `role="alert"` and `aria-live="polite"`, and every slot's border turns `--danger`.
- **Input:**
  - `inputMode="numeric"`, `autocomplete="one-time-code"`, `pattern="[0-9]*"` and `maxLength=6`.
  - A letter typed is dropped (`x4` gives `…4`).
  - A pasted "Your code: 123-456-78" gives `123456`, and "12 34" gives `1234`.
  - A seventh digit is ignored.
  - An OS one-time-code fill, which arrives as an input event, shows all six.
  - Backspace at the end deletes the last digit, and select-all then Backspace clears the field.
- **Focus:** the field takes focus on arrival and is `:focus-visible` at once. It shows the 2 px ochre outline round the whole row, which appears instantly with no transition, as hallmark gate 15 asks, and the next slot is marked in chocolate.
- **States present:** default, hover (fine pointers only), focus-visible, next, filled and error. The slots' borders and shadows ease over 160 ms ease-out. Under reduced motion the house rule makes that 1 ms.
- **Emil:** the press is answered at once, nothing animates on typing except the next-slot border (160 ms, ease-out), no property is `all`, and nothing eases in.

**Bao's round 9 finding 2 is fixed: every heading is two lines or fewer from 320.**
- **The test:** 110 renders, 0 headings over two lines, 0 off-screen, and no horizontal scroll.
- **The front door's headline** (`clamp(28px, calc(8.8vw / var(--zoom, 1)), 38px)`):

  | Width | Size | Lines |
  | --- | --- | --- |
  | 320 | 28.2 px | 2 |
  | 360 | 31.7 px | 2 |
  | 390 | 34.3 px | 2 |
  | 430 | 37.8 px | 2 |
  | 600 | 38 px | 2 |
  | 760 | 38 px | 1 |

- **The plate titles** run from 22 px at 320 to 27 px from 414. "Forgot your password?", "This code doesn't look right." and both of `/c`'s failure titles take 2 lines below 414.
- **`/c`'s question,** "What do you remember about Margaret?", takes 2 lines from 23 px at 320, and one from 600.
- **Rule 12:** every new clamp divides `vw` by `--zoom`.

**Bao's round 9 placeholders:** none of the inputs' placeholders is clipped at any of the ten widths. They now read, for example, "8+ characters", "So they know who it's from" and "Neighbour, niece, old friend". The textarea's long prompt wraps inside its box, which is what a textarea does.

**Regressions: none.**
- **The sweep:** 280 renders.
  - no scroll in the book layout and no horizontal scroll anywhere;
  - every target 44 px or more;
  - nothing under 13 px except the phone cover's date (rule 22);
  - no errors.

  Its 28 flags are all the known "Read this page" false positive.
- **The door's Bond:** his ear still clears the "Sign in" pill by 8.0 px at 360 and 6.3 px at 390–760.
- **Rule 27 at 360:** the nose spread is 0.0 px on every page, and every pose stands on its rule.
- **The fit under reduced motion:** 0 wrong frames in 615 at 1366×768.
- **The weave at 1920:** lowest 0.978 on Sign in → door, and 0.994 on Verify's Change under reduced motion.
- **Resize:** 30 resizes and 2 drags, 0 differences from a fresh load.
- **GSAP cleanup:** the same counts as rounds 6–9.

## Not verified

- A real screen reader. The accessibility tree stands in for it.
- A real phone's code suggestion (iOS or Android). An input event carrying all six digits stands in for it.
- A real submit: Verify at six digits, and Forgot password's code step, which needs a sent email.

---

## Bao's round 9, finding by finding

| # | Round 9 finding | Now |
| --- | --- | --- |
| 1 | Verify's six boxes run across the plate's frame at 360 and off the screen at 320 | **Fixed.** One input with six slots, 2 px inside the frame at every width from 320 to 760. |
| 2 | Headlines take 3 lines at 320–374 (the door, Join's bad code, `/c`) | **Fixed.** 0 headings over two lines in 110 renders from 320 to 760. |
| (placeholders) | Clipped at 320 and 360 | **Fixed.** None clipped. |

---

## Gaps

### Polish

**1. The caret is invisible but still moves, so a tap or an arrow key edits the middle of the code while the slots point at its end.**
- **Skills and rules:**
  - hallmark interaction-and-states: the focus and next states must show where input goes;
  - emil-design-eng: the interface does what it shows, with no hidden state;
  - impeccable craft-floor ("working controls"; "the caret … ship[s] with browser defaults", here hidden).
- **Where:** `src/pages/auth/PlateCode.tsx`. `next` is always `value.length`, but the input's caret is wherever the press or the arrows put it. `signed-out.css` §2 sets `color: transparent; caret-color: transparent` on `.plate-code-input`, so that caret is never shown.
- **Measured at 390, touch, with the value `124`:**

  | Step | Caret | Value | Slots show | Marked next |
  | --- | --- | --- | --- | --- |
  | Tap on slot 1 | 2 | `124` | `124` | slot 4 |
  | Backspace | | `14` (the 2 is deleted, not the 4) | `14` | |
  | Type 9 | | `194` (inserted in the middle) | | slot 4 |

  At 1920 a click left the caret at the end, but End → ← → ← then 5 turned `129` into `1529`, with the slots still marking slot 5 as next.
- **Change:** keep the caret at the end, as the slots say. In `PlateCode`, add:

  ```tsx
  onSelect={(e) => { const i = e.currentTarget; const n = i.value.length; if (i.selectionStart !== n || i.selectionEnd !== n) i.setSelectionRange(n, n); }}
  ```

  This also covers clicks, taps and arrow keys. Select-all still works, because the selection is collapsed to the end and Backspace then deletes one digit; if select-all-and-delete is wanted, let a full selection through (`selectionStart === 0 && selectionEnd === n`). Re-run the tap and arrow cases: expect Backspace to take the last digit and a typed digit to land at the end.

**2. Pasting text with no digits erases the code already typed.**
- **Skills and rules:**
  - hallmark interaction-and-states (input never loses what the person entered);
  - emil (forgiving input).
- **Where:** `PlateCode.tsx`, `onPaste`: `if (!text) return; e.preventDefault(); onChange(text.replace(/\D/g, "").slice(0, length));`. A paste of "see email" calls `onChange("")`.
- **Measured:** with `1529` in the field, pasting "see email" left it empty, at both 1920 and 390.
- **Change:** ignore a paste that carries no digits:

  ```tsx
  const digits = text.replace(/\D/g, ""); if (!digits) return; e.preventDefault(); onChange(digits.slice(0, length));
  ```

**3. The code's digits are old-style figures. 3, 4, 7 and 9 drop below the line and 1 sits low, so a six-digit code reads unevenly.**
- **Skills and rules:**
  - impeccable craft-floor ("the numerals in tabular data … ship with browser defaults … Theme them");
  - taste-skill house rules ("Tabular figures where numbers align").
- **Where:** `signed-out.css` §2, `.auth.ritual .plate-code .slot { font-family: var(--book-display); … }`. Cormorant Garamond defaults to old-style figures, and `font-variant-numeric` is `normal`. The old `CodeInput` boxes had the same figures; this round rebuilt the field, so this is the place to set them.
- **Measured:** `-1920-code-figures.png` (now) against `-1920-code-figures-lining.png` (with the change injected). The lining figures sit on one baseline at one height, centred in their slots.
- **Change:** add `font-variant-numeric: lining-nums tabular-nums;` to `.auth.ritual .plate-code .slot`. Join's `.codeseal` sets the family code (K7M 2QX) in the same face, so give it the same figures.

## Notes for the lead (not counted)

- **The plate's prompt is not tied to the field until there is an error.** The field's description, "Six digits, from the email we just sent.", is linked only while the code is wrong (`aria-describedby` is set by `useCodeAria`). Pointing it at `plate-say` always would let a screen reader hear the prompt on arrival, and the error in the same place.
- **The field stays editable while Verify checks a code.** While `busy`, digits can still be typed. That is harmless, because the check uses the code it was given. `readOnly` while busy, or `aria-busy` on the form, would match hallmark's loading state.

### Motion and interaction, in Emil's format

| Before | After | Why |
| --- | --- | --- |
| An invisible caret moves on a tap or an arrow key | The caret pinned to the end (`onSelect`) | What the slots show next is where the digit goes (gap 1). |
| A paste of "see email" clears the code | A paste with no digits is ignored | Forgiving input (gap 2). |
| Old-style figures in the code slots | `lining-nums tabular-nums` | A code is data and should read level (gap 3). |

Every other motion rule I checked passes:
- **Easing:** the slots ease their border and shadow over 160 ms ease-out.
- **Focus:** the ring appears instantly.
- **Properties:** no `transition: all`.
- **Reduced motion:** 1 ms under reduced motion.

### Scores (taste-skill critique; hallmark self-critique)

```
ROUND 10
Seen in one second: the family book open on the cloth; on a phone, the plate with six slots inside its engraved frame.
Idea: the sign-in is the title page of the family's own book. It passes the competitor test.
Live thing: Bond on the plate; the next slot marked as you type.
Scores: design 8.5 · usability 9 · creativity 9 · content 8 → overall 8.7
Caps applied: none.
Top three: gap 1 (the hidden caret edits mid-code); gap 2 (a non-digit paste clears the code); gap 3 (old-style figures in the code).
Hallmark reading: P5 H4 E5 S5 R4 V4. Bao's two phone defects are closed; every mechanical floor passes.
```
