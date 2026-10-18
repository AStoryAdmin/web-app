# Bao's Standard: signed-out pages, round 11

**Verdict: PASS.**

Round 11 (3bc46e0) fixes both round 10 findings:
- the code field's caret stays at the end;
- the digits are set in lining tabular figures.

A paste with no digits now changes nothing. The round 9 fixes hold: the code inside the plate at every width, headings at two lines or fewer, no clipped placeholder.

The full sweep at 14 sizes (154 page-size pairs) found no defect.

## How this was checked

- **Browser:** headless Chromium through Playwright, against http://localhost:5180, at dc403e4 (round 11's code is 3bc46e0).
- **Network:**
  - every non-GET request to Supabase was aborted;
  - Forgot password's `recover` was answered locally;
  - `/c` was aborted or stubbed.
  - Nothing reached the server, and no six-digit code was completed on Verify.
- **The code field:** the round 10 tests again (`code10.mjs`, `mid.mjs`), plus a caret and paste test on Forgot password's code step (`mid2.mjs`) at 390 (touch) and 1920 (mouse and keyboard).
- **The phone door's foot:** at 320, 360, 390, 600, 759, 760 and 761.
- **Sweep:** the survey at 1366×768, 1366×641, 1280×1024, 1200×1000, 1920×1000, 2560×1300, 800×1024, 820×1180, 390×844, 5120×2560, 360×780, 320×640, 600×960 and 760×1024, on all eleven routes.
  - **Measured:**
    - scroll;
    - fit;
    - the smallest text;
    - heading lines;
    - overlaps;
    - every control's hit extent;
    - part-faded leftovers;
    - Bond;
    - console errors.
  - **Also:** the headings and placeholders on every view, from round 10.
- **Screenshots:** `shots/so-r11-*`.

## Round 10 findings

| # | Round 10 finding | Now |
| --- | --- | --- |
| 1 | A tap or click on a slot moved the hidden caret into the code | **Fixed.** |
| 2 | Old-style figures in the code | **Fixed.** |

**Finding 1, the caret:**
- With "123456", a tap or click on the 1st, 3rd or 5th slot leaves the caret at 6 on the phone and at 1920. Backspace removes the last digit ("12345"), and typing 7 gives "123457".
- ArrowLeft and Home leave it at the end too. So every edit happens where the slots say it will.
- Select all (Ctrl+A, or a double-click on a pointer device) still selects the whole code, and Backspace clears it. That is the intended exception.

**Finding 2, the figures:**
- `.slot` computes `lining-nums tabular-nums`.
- "98765" sits on one line, at one width per digit (`so-r11-code-error-1920x1000.png`, `so-r11-code-pasted-390x844.png`).

**A paste with no digits:**
- "hello" leaves "12345" as it was.
- "code: 98 76" gives "9876".

## Holds (fresh)

- **The code field's fit:** the row sits 6px inside the paper on phones and 31–80px inside the plate's frame at every width (320: 61–259 inside 30–290; 360: 68–292 inside 33–327). Forgot password's step is the same.
- **The code field's states:** one target 52px tall (47px at 1366×768, 62 at 1920).
  - **Error:** the plate's line, red borders, `aria-invalid` and `aria-describedby`.
  - **Focus:** an ochre ring, with the next slot ringed.
  - **Hover:** darker borders.
- **Headings and placeholders:** two lines or fewer, with no clipped placeholder, on every view from 320 to 760.
- **Sweep, with nothing found:**
  - no horizontal scroll anywhere, and no vertical scroll at any book size;
  - every book and bench inside the window;
  - the smallest text 13px or more (the sample cover date at 12px on phones is known);
  - every hit area 44px or more at every size, 320 included;
  - no console errors;
  - only designed tones part-faded.
  - **Fits, book:** 0.9000, 0.7792, 0.8444, 0.7917 and 1.1875.
  - **Fits, door:** 0.8231, 0.7716, 0.7713, 0.7231, 1.1590 and 1.1892.
- **The phone door:** Bond's ears are 6.5–8.2px below the Sign in pill, with none of his pixels inside it. His paws are on the foil rule (0.0px) from 320 to 760.

## Notes for the lead (not counted)

- **`.codeseal` (Join's code) declares `font-variant-numeric` twice in one rule.** The later `lining-nums` wins, so `tabular-nums` is dropped. It shows letters and digits ("K7M 2QX") and is unaffected visually. Delete the second declaration for tidiness.
- **While the whole code is selected,** the transparent selection shows no highlight on the slots. A select-all is deliberate, so this is not counted.
- **Reduced-motion turns were not re-run this round.** Rounds 10 and 11 did not touch the transition CSS (§3), and round 9's run passed.

## Not verified

- **Edge itself, a real phone and its one-time-code suggestion, and a real network.**
- **A completed code on Verify,** which would be sent.
- **Screen-reader output.**
