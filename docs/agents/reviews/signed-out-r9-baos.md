# Bao's Standard: signed-out pages, round 9

**Verdict: FAIL, on two phone-width defects.** Neither is new in round 9. Both turned up when this round added 360 to the sizes I check, and I missed them in earlier rounds.

**Both round 9 changes pass:**
- **The phone door's foot.** Bond's ears now clear the Sign in pill by 6.5–8.2px at 320, 360, 390, 600 and 760. His paws sit exactly on the leaf's foil rule (0.0px) at every one of those widths. He touches nothing.
- **Held prints under reduced motion.** They cross in over 150ms, linear, in 8 steps, never as a pop.

The reduced-motion turns, the fit and everything else in the sweep hold.

**The two failures:**
1. On a phone, Verify's six code boxes run across the bookplate's frame. At 390 they reach it, at 360 they cross it, and at 320 they leave the screen.
2. On the front door, the headline breaks into three lines at every width from 320 to 374.

## How this was checked

- **Browser:** headless Chromium through Playwright (`09142026/node_modules/playwright`), against http://localhost:5180, at 240c7aa.
  - The working tree also has uncommitted Archive work (`transcript.ts` and its test), which does not touch the signed-out pages.
  - Every run used a fresh context with no session.
- **Network guard:** every non-GET request to Supabase was aborted. Only the read-only `rpc/get_contribute_info` was ever attempted (aborted, or answered by the local stub). Nothing was submitted, and the only fake value used was `reader@example.test`.
- **The phone door (`door9.mjs`):**
  - **Sizes:** 320, 360, 390, 600, 759, 760 and 761 wide, as touch devices at DPR 2.
  - **Measured from the shown pose's own opaque pixels:**
    - the gap between his ears and the Sign in pill;
    - any of his pixels inside the pill or the family-code line;
    - his feet against the leaf's foil rule (`.door-leaf::before`, 14px in);
    - his clearance from the rule's right corner.
  - **Crops:** `shots/so-r9-door-foot-<size>.png`.
- **Reduced-motion turns:**
  - **Weave matrix:** the round 7 sampler on all 15 turns at 1920×1000 and 390×844 under reduced motion (30 changes, 780 paused and 1076 real frames). Four runs were re-run because the dev server reloaded under them (see the notes).
  - **Held prints:** the transition computed on `.loose`, `.print-face`, `.print-cap` and `.inv-print`. A per-frame opacity trace followed each print that was held at `data-wait` after a cold, early turn (image latency 600ms and 1500ms, click 300ms after load). The traced turns were Sign in → front door (the loose prints) and Join → Create account (the album).
- **Sweep:**
  - **Sizes:** the survey at 1366×768, 1920×1000, 2560×1300, 390×844, 360×780 and 600×960, plus 320×640 as an edge.
  - **Routes:** all eleven.
  - **Measured:** scroll, fit, the smallest text, heading lines, overlaps, every control's hit extent, part-faded leftovers, Bond and console errors.
  - **Close checks:** Verify's code row at 320–390, and the door's headline at 320–760 with and without a candidate fix.

## Round 9 changes

### The phone door: Bond against the Sign in pill

**Passes.**

| Width | Ears below the pill | His pixels in the pill | Feet vs the foil rule | Gap to "Use it here" | Right of him to the rule's corner |
| --- | --- | --- | --- | --- | --- |
| 320 | 8.2px | 0 | 0.0px | 7.1px | 26.5px |
| 360 | 8.2px | 0 | 0.0px | 7.1px | 26.5px |
| 390 | 6.5px | 0 | 0.0px | 7.1px | 26.5px |
| 600 | 6.5px | 0 | 0.0px | 7.1px | 26.5px |
| 760 | 6.5px | 0 | 0.0px | 7.1px | 26.5px |
| 761 (pills in one row) | beside the row | 0 | 0.0px | 7.4px | 47px |

- **On the rule:** the crops show him lying on the foil rule with his paws on it, clear of the corner bracket and of the family-code line (`so-r9-door-foot-360x780.png`, `-390x844.png`).
- **The 759/760/761 boundary:** at 760 and below, the row gap applies and the pills stack. At 761 the pills sit in one row and he sits far to the right, nowhere near them.

### Held prints under reduced motion

**Passes.**
- `.loose`, `.print-face`, `.print-cap` and `.inv-print` compute `opacity 0.15s linear`. On `.inv-print` that replaces the hover rule's transform transition, so nothing tilts under reduced motion.
- **Traced:** each held print stayed at 0 while waiting (59–67 frames at 1500ms latency, 5–6 at 600ms). It then went 0.11 → 0.22 → … → 0.89 → 1 over 150ms, for the door's three loose prints and the album's three faces alike.
- No print was ever visible before its picture was decoded.

## Reduced-motion turns

**Pass.**

| Size | Lowest weave, paused | Lowest weave, real | Old page at the last frame | Old page on the settled page | Flat frames |
| --- | --- | --- | --- | --- | --- |
| 1920×1000 | 0.994 | 0.993 | ≤ 0.024 | 0 | 0 |
| 390×844 | (0.77, note) | 1.00 on cloth | ≤ 0.015 | 0 | 0 |

The 390 exceptions are the same as in rounds 7 and 8:
- the old root captured at DPR 3 in the first paused frame;
- one patch that lands on Bond on Sign in ↔ Forgot password (0.93), not the cloth.

## Sweep: what holds

- **Scroll:** no horizontal scroll at any size, and no vertical scroll at any book-layout size.
- **Fits:**
  - the book: 0.9000, 1.1875 and 1.1875;
  - the door: 0.8231, 1.1590 and 1.1892.
- **Text:** the smallest text is 13px or more, apart from the known sample cover date, 12px on phones.
- **Targets:** every hit area is 44px or more at every swept size from 360 up. The one exception is at 320 (finding 1).
- **Console errors:** none.
- **Leftovers:** only the designed tones.
- **Bond:** shown on every page with the right pose, as in round 8.

## Findings, worst first

1. **On a phone, Verify's six code boxes run across the bookplate's ornamental frame. At 360 the sixth box sits over the frame's lines, and at 320 it runs off the screen.**
   - **The measurements:** the row is always 279px wide (six 44px boxes and 3px gaps, `margin-inline: −10px`), whatever the width.

     | Width | Code row (left–right) | Plate frame | What happens |
     | --- | --- | --- | --- |
     | 390 | 57–336 | 35–355 | The first box's focus ring and the sixth box meet the frame's inner lines |
     | 360 | 52–331 | 33–327 | The sixth box crosses the frame's lines |
     | 320 | 45–324 | 30–290 | The sixth box runs 34px past the frame and 4px off a 320px screen. Its hit area is only 30×52px |

   - **Evidence:** `so-r9-verify-digits-390x780.png`, `so-r9-verify-digits-360x780.png`, `so-r9-verify-digits-320x640.png`.
   - **Where:** `signed-out.css`, the phone block (`.auth.ritual .form .code { gap: 3px; margin-inline: -10px; }` and `.code input { min-width: 44px }`), on `/verify` and on Forgot password's code step, which uses the same row.
   - **Sizes:** 360 and 320 overlap. At 375 and 390 the row touches the frame.
   - **Rules:**
     - the checklist ("no clipped or overlapping text", 44px targets);
     - rule 10;
     - rule 14 (the plate is the book's object, and nothing should sit over its engraving);
     - the coordinator's "nothing touching".
   - **Why it can't simply shrink:** six separate 44px targets cannot fit inside the frame's roughly 250px inner width at 360.
   - **Fix:** below about 420px, draw the code as one `autocomplete="one-time-code"` input across the paper's width, showing six slots (letter-spaced digits over six drawn cells). It is one full-width target 52px tall, and it fits inside the frame at 320. The alternative is to drop the paper's side padding for the code row and accept 40px cells, but that breaks the 44px rule.

2. **On the front door, the headline "Every life holds a story worth keeping." breaks into three lines at every width from 320 to 374.**
   - **What was measured:** at 38px the line "Every life holds a" no longer fits under 375. The result is "Every life / holds a story / worth keeping." (`so-r9-welcome-head-360x780.png`).
   - **The same fault at 320:**
     - the title on Join with a bad code ("This code doesn't look right.");
     - `/c`'s "What do you remember about Margaret?" (stubbed);
     - `/c`'s failure title.

     Each of these also takes three lines at 320.
   - **Sizes:** 320–374. That includes 360, the commonest Android width and one of this round's sizes. At 375 and up it holds at two lines.
   - **Rules:** DESIGN.md's craft rules ("Headlines two lines or fewer at every width"), and rule 1.
   - **Fix, tested by injection:** in the phone block, set `.door-leaf h1 { font-size: clamp(30px, calc(9.4vw / var(--zoom, 1)), 38px); }`.
     - It gives two lines at 320 (30.1px), 340, 360 (33.8px), 375 and 390, holds 38px from 405 up, and gives one line at 760.
     - Give the plate titles the same treatment below 340: about 24–25px, or a `vw` clamp divided by the zoom.

## Notes for the lead (not counted)

- **Round 8's white frames are explained.** The dev server does full page reloads while other agents save files.
  - A passive probe logged an unprompted `LOAD` at 14:48:03 with nobody using the page.
  - In this round's runs, three page changes died with "Execution context was destroyed … navigation", and one drew two white frames at the same moment. Run again, all four were clean.
  - It is the test environment, not the app.
- **Bond's size, his paw tuck and Change turning at once** are as ruled in round 8.

## Not verified

- **Microsoft Edge itself, a real phone, a GPU and a real network.**
- **Forgot password's code step itself.** It sits behind a send, so I did not render it. I am inferring from the shared CSS that its code row behaves like Verify's.
- **Screen-reader output and contrast:** not re-measured.
