# Bao's Standard: signed-out pages, round 10

**Verdict: FAIL, on the new code field.** Round 11 has since fixed both findings; see `signed-out-r11-baos.md`.

Both round 9 findings are fixed:
- Verify's code now sits inside the plate's frame at every width.
- Every heading is two lines or fewer from 320 to 760.
- No placeholder clips.

The new `PlateCode` field fits and looks right, but it had two faults:
1. **Tapping or clicking a slot moved the hidden caret into the middle of the code.** Backspace then deleted the wrong digit, and typing inserted one there, while the slots gave no sign of it.
2. **The digits were set in Cormorant's old-style figures,** so a code bounced above and below its line. The "1" also read like a small-capital I.

## How this was checked

- **Browser:** headless Chromium through Playwright, against http://localhost:5180, at b6ed7c5.
- **Network:**
  - every non-GET request to Supabase was aborted;
  - Forgot password's `auth/v1/recover` was answered locally with `{}`, to open its code step;
  - `/c` was stubbed as before.
  - Nothing reached the server. No six-digit code was ever completed on Verify, because that sends it.
- **The code field (`code10.mjs`, `mid.mjs`):**
  - **Fit:** the row's and the input's rects against the plate's frame and paper at 320, 360, 390, 600, 760, 1366×768, 1920 and 2560.
  - **States at 390 (touch) and 1920 (mouse and keyboard):**
    - focus;
    - typing, including letters and a hyphen;
    - Backspace;
    - a tap or click on a slot, then typing;
    - a noisy paste (" 98-76 5 ");
    - the error (Continue with five digits, checked on the page);
    - aria;
    - Tab focus;
    - hover.
  - **Forgot password's code step** at 320, 360, 390 and 1920, with full six-digit caret tests (that step does not send on six).
- **Headings and placeholders (`phx.mjs`):** every view, at 320, 340, 360, 375, 390, 414, 480, 600, 700 and 760. That includes the views reached on the page without sending anything: Create account's password step, Forgot's code step, and `/c`'s "who it's from" and testimonial views. Each placeholder's text width was compared with its field's inner width.
- **Sweep:** the survey at 14 sizes. It stopped at the 75th of 154 pairs (`/join/ABC` at 600×960) when the dev server did not answer within 30s; I re-ran it in full on round 11.

## Round 9 findings

| # | Round 9 finding | Now |
| --- | --- | --- |
| 1 | Verify's six boxes cross the plate's frame | **Fixed.** See below. |
| 2 | The door's headline takes three lines below 375 | **Fixed.** See below. |

**Finding 1:**
- One `one-time-code` input (numeric, 16px text so iOS doesn't zoom, labelled "6-digit code") spans the paper, with six slots drawn behind it.
- The row sits 6px inside the paper on phones and 31–80px inside the plate's frame at every width:

  | Width | Row | Plate frame | Slot width |
  | --- | --- | --- | --- |
  | 320 | 61–259 | 30–290 | 29px |
  | 360 | 68–292 | 33–327 | 33px |
  | 390 | 73–317 | 35–355 | 37px |
  | 1920 | 1152–1623 | 1091–1684 | 71px |

- The whole row is one target, 52px tall on phones (47px at 1366×768 under the book's 0.9 scale; 62 at 1920).
- Forgot password's code step is the same at every width.

**Finding 2:**
- At every width from 320 to 760, every view has no heading over two lines and no clipped placeholder. That includes the door, the plates, Join, Join with a bad code and all of `/c`.
- The tightest placeholders are "6+ characters" (113 of 144px at 320) and "Neighbour, niece, old friend" (236 of 252px).

## Findings, worst first

1. **A tap or click on a slot moved the hidden caret into the middle of the code.**
   - **What happened,** with "123456" in Forgot password's field:
     - a tap on the first slot put the caret at 2 on the phone, and a click put it at 3 at 1920;
     - Backspace then deleted the 2nd or 3rd digit ("13456", "12456");
     - typing 7 inserted it there ("173456");
     - throughout, the slots still marked the end as where the next digit goes.
   - **Rules:** the checklist (every control's states), rule 17a (reading comes first), and the Hallmark and Emil standard for input feedback.
   - **Fix:** keep the caret at the end (`onSelect` → `setSelectionRange(n, n)`).
2. **The digits were set in old-style figures.** In Cormorant, 3, 5, 7 and 9 hang below the line, 6 and 8 rise, and 1 and 2 are small. A code read in six cells bounced, and its "1" looked like a small-capital I (`so-r10-code-error-1920x1000.png`).
   - **Fix:** `font-variant-numeric: lining-nums tabular-nums` on `.slot`.

## What holds

- **Error state:** "Type all six digits from the email." goes in the plate's line, the slots' borders turn danger red, and the input is `aria-invalid` with `aria-describedby="plate-say"`.
- **Focus:** an ochre ring around the row, with the next slot ringed in chocolate.
- **Hover:** the borders darken on a pointer device.
- **Typing letters:** does nothing.
- **A noisy paste:** keeps the digits ("98765").
- **The phone door's foot:** as in round 9.

## Not verified

- **Edge itself, a real phone, and the system's own one-time-code suggestion.**
- **A completed code on Verify,** which would be sent.
