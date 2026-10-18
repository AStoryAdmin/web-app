# Bao's Standard: signed-out pages, round 2

**Verdict: FAIL.**

Round 1 is mostly fixed. Moving between pages is now a clean turn, the book holds one size, the ritual no longer flashes a mirrored lockup, the plates sit centred, `/join` tells the truth, `/c` has one action and Verify has a way back. Twelve of the sixteen round 1 findings are closed and two are partly closed.

What fails now is Bond. His blink is two flat brown discs that don't read as fur. The catchlights double the ones already painted in his eyes. On a phone the catchlights land on his fur and the lids miss his eyes. His head changes size by up to 30% between poses. Two layout regressions also need fixing. A 1366×768 laptop in Edge now gets the phone column, and the stacked ritual shows a square board over half a page.

## How this was checked

- **Browser:** headless Chromium 1243 through Playwright (`09142026/node_modules/playwright`), with a fresh context per size, no session and no sign-in. Dev server at http://localhost:5180. The founder's browser pane was not touched.
- **Sizes:** 1366×768, 1366×641, 1920×1000, 1920×950, 2560×1300, 390×844, 820×1180 and 5120×2560. The last one stands in for a zoomed-out Edge: html zoom was 2.56 there.
- **Pages:** `/welcome`, `/sign-in`, `/create-account`, `/create-account?code=K7M2QX`, `/forgot-password`, `/verify`, `/verify?email=reader@example.com`, `/join/K7M2QX`, `/join/bad` and `/c/nobody`. That is 80 page-size pairs.
- **Measured with JavaScript on every pair:**
  - scrollWidth and scrollHeight against the window;
  - the layout (book or stacked), `--fit` and html zoom;
  - the smallest visible text in screen pixels (font-size × `currentCSSZoom`);
  - targets by real hit testing (`elementFromPoint` stepped out from each control's centre), not by the rect alone;
  - the plate's space above and below, and anything overflowing the plate;
  - the dog's box and each pose's rendered rect and scale;
  - heading line counts and console errors.
- **Bond:**
  - every pose cropped at 2× (1× at 2560 and 5120) at all eight sizes: watch with the pointer at the top-left and the bottom-right corners, email focus, cover (password focused), peek (Show pressed), curious (create account), sleep (verify) and join;
  - the blink stepped at lid scaleY 0, 0.3, 0.6 and 1 (`r2-blink-*-sequence.png`);
  - the art itself analysed with PIL: pupil and nose blobs, eye positions against `ART`, fur colour around the eyes.
- **Transitions, frame by frame:** I hooked `document.startViewTransition`, paused every `::view-transition-*` animation on `ready` and stepped `currentTime` through 0, 40, 80, 110, 130, 160, 200, 240, 280, 320, 380 and 460ms, then the end.
  - Moves: Sign in → Create account, Sign in → Forgot password, Welcome → Sign in and Create account → Sign in, at 1920×1000.
  - Sign in → Create account again under reduced motion.
- **The opening ritual, frame by frame:** I paused the 2.49s timeline (`gsap.globalTimeline` child) and seeked to 0 through 2.4s in 17 steps on desktop. On the stacked version (1.29s) I seeked at 390×844, 1366×641 and 820×1180.
- **Also checked:** the Tab order and focus rings on four pages, and opening Raymond Ortiz's forest book on `/welcome`.
- **No form was submitted.** Typing went into the email and password fields only ("reader@exa", "abcdef"), and I pressed Show. I never pressed Sign in, Continue, Send the code, Create an account or any join action. `reader@example.com` appears only in the `/verify` query string.
- **Screenshots:** in `web-app/docs/agents/reviews/shots/`, all prefixed `r2-`.

## Round 1, finding by finding

| # | Round 1 finding | Now | Evidence |
| --- | --- | --- | --- |
| 1 | Transitions double-expose two forms | **Fixed** with normal motion: the old words leave by 110ms, then book, title page and dog cut at 120ms, and the new words rise from 130ms. Never two forms at once. Welcome → Sign in clears the bench for about 100ms, then the open book fades in with its album decoded (no grey boxes). Under reduced motion the double exposure is still there (new finding 13). | `r2-vt-signin-to-create-contact-1920x1000.png`, `r2-vt-signin-to-forgot-contact-…`, `r2-vt-create-to-signin-contact-…`, `r2-vt-welcome-to-signin-contact-…` |
| 2 | The book changes size between pages | **Fixed.** `--fit` is identical on every AuthFrame page: 0.9000 at 1366×768, 1.1875 at 1920×1000 and 2560×1300 and 5120×2560, 1.1281 at 1920×950. | static measurements |
| 3 | Controls shrink to 9–11px on laptops and tablets | **Fixed** for the controls. Buttons and fields are 44px tall with text of 16px or more at every size, and 820×1180 is now a clean stacked page. The fix, stacking at `max-height: 690px`, causes new finding 5. | `r2-sign-in-820x1180.png` |
| 4 | Mirrored gold lockup in the ritual at 1.75–1.95s | **Fixed** on desktop: the frames at 1650, 1750, 1850 and 1950ms are clean. The stacked ritual has its own ghost lockup (new finding 6). | `r2-ritual-contact-1920x1000.png` |
| 5 | Plates pinned under the rule, with empty cream below | **Fixed.** Plates are centred between the rule and the page foot: at 1920×1000, `/verify` 113px above and 143px below, and `/c/nobody` 99 and 129. | `r2-verify-1920x1000.png` |
| 6 | `/join` promises things that aren't true | **Fixed.** `/join/bad` uses the default promise. `/join/K7M2QX` says "If it is right, it puts you in their family tree", with Step 1 and Step 2 spelled out. | `r2-join-valid-1920x1000.png`, `r2-join-bad-1920x1000.png` |
| 7 | "Nan…" caption, no sample label | **Fixed.** No captions on the invitation prints, and "Photographs from a sample family's book." is present. | `r2-join-valid-1920x1000.png` |
| 8 | Targets under 44px | **Mostly fixed.** Three collisions and two small targets remain (new finding 8). | probe log |
| 9 | Front door columns misaligned, book small | **Half fixed.** Tops align (leaf at 137, picks at 140). The sample book is still about 505×505px at 1920×1000, 13% of the window, and the reader row is off by 11px (new findings 11 and 12). | `r2-welcome-1920x1000.png` |
| 10 | Dark open book has no edges | **Fixed.** Raymond Ortiz's forest endpapers show the gutter and the gilt page block. | `r2-welcome-open-raymond-1920x1000.png` |
| 11 | Dog's ledge hangs in the air | **Fixed** on the plate: the new art has no ledge, and on watch and sleep his paws end exactly on the plate's rule (box bottom = rule y at every size). On `/welcome` he floats (new finding 10). | `r2-dog-watch-ptr-topleft-5120x2560.png` |
| 12 | Closed board is chocolate on chocolate | **Fixed.** The board is a step deeper, with a tooled frame and a gilt fore-edge. | `r2-ritual-0800ms-1920x1000.png` |
| 13 | Phone family names centred | **Fixed.** | `r2-welcome-390x844-full.png` |
| 14 | Browser-blue focus ring on the lockup | **Fixed.** The ring is brass, rgb(239, 199, 94), 2px. | Tab log |
| 15 | `/c/nobody` offers two actions | **Fixed.** "What is A Story?" is the one action. | `r2-c-nobody-1920x1000.png` |
| 16 | Verify has no way back | **Fixed.** "The code went to … · Change" is there. | `r2-verify-email-1920x1000.png` |

## What holds (fresh pass)

- **No horizontal scroll** on any of the 80 page-size pairs (scrollWidth = innerWidth everywhere).
- **No vertical scroll** on every book-layout desktop size (1366×768, 1920×1000, 1920×950, 2560×1300, 5120×2560): scrollHeight = innerHeight.
- **Text size:** the smallest text is 13px or more everywhere, except the sample cover's "APRIL 23, 2026" at 12.0px on a phone, which is the book's own printing and at the floor.
- **Headings** are two lines or fewer.
- **No console errors.**
- **Bond's states fire correctly:**
  - watch on Sign in and Forgot;
  - curious on Create account, Join and `/c/nobody`;
  - sleep on Verify, both variants;
  - cover on password focus;
  - peek on Show.
  - The head tilts toward the email field.
- **One scale:** every pose renders at the same scale on a page (for example 0.2221 for all five at 1920×1000).
- **The ritual finishes:** stage "open", and nothing is left half-faded apart from the captions' intended 0.9 opacity.

## Findings, worst first

1. **On a phone, Bond's catchlights sit on his fur and his blinking lids miss his eyes.**
   - **Where:** `.auth .companion` box.
     - `astory.css` §33 (lines 2288 and 2309) sets `--cw` on the companion itself: `clamp(150px, 15cqw + 60px, 200px)` on desktop, and `170px` with `margin-left: -85px` on a phone. That overrides the `--cw` that `signed-out.css` sets on `.plate-wrap`.
     - The box is therefore 170×89 (ratio 1.91) at 390×844, while the drawing is 112px wide.
     - `Companion.tsx` `at()` places the glints and lids in percent of the box width, so every eye's x offset from centre is stretched ×1.52.
   - **Sizes:** 390×844, so every phone.
     - On desktop the same cause gives a box of 1.296 against 1.253: about 1px, not visible.
     - At 1366×641 and 820×1180 the ratio is 1.308: about 1.5px.
   - **Evidence:** `r2-blink-watch-390x844-sequence.png`.
     - Frame 1, at rest: the right eye's catchlight is on the fur outside the eye, up and to the right.
     - Frame 4, closed: both lids sit above and to the right of the eyes, and the lower white of each eye still shows.
     - Measured box against drawing: 170×89 vs 112×89.
   - **Rules:** 27, 12 (the ratio must hold at every size).
   - **Fix:** Delete the companion's own `--cw` in astory.css §33 (both rules) so the box is exactly `--dogh × 802/640`, or place the glints and lids inside a wrapper sized to the drawn watch image rather than the box.

2. **A blink is two flat brown discs, not fur.**
   - **What happens:**
     - The lids are solid #96603A ovals with an inset shadow line. They are 25–30% darker than the fur around his eyes, which samples at rgb(216,151,93) and (183,127,79) on watch, and (184,129,83) and (199,137,85) on curious.
     - They have no fur strokes and no lash line.
     - They are level while the curious head is tilted about 20°.
     - They start above the eye (`margin-top: -4.6%`), so a third of the way through the blink a brown bar crosses his brow while the eye below is still open.
   - **Where:** `signed-out.css` `.auth .companion .lid` (`background: var(--bond-fur)`, `border-radius`, `margin: -4.6% 0 0 -6%`), and `Companion.tsx` (the lids use watch's eye positions with no angle).
   - **Sizes:** all, on every page where he is awake (Sign in, Forgot, Create account, Join, `/c`).
   - **Evidence:** `r2-blink-watch-1920x1000-sequence.png`, `r2-blink-curious-1920x1000-sequence.png` (scaleY 0, 0.3, 0.6 and 1), `r2-dog-watch-blink-closed-1920x1000.png`.
   - **Rules:** 27 (delight that is earned), 21 (the real drawing, in its style).
   - **Fix:**
     - Draw each lid from the drawing itself: a `background-image` of the same pose, offset so the fur just above the eye fills it, clipped to that eye's own ellipse and rotated to the eye's axis (curious about 20°), with a 1px sepia lash line on its lower edge.
     - Anchor its top at the eye's upper lid line, not above it.
     - The better fix is to ask the founder for closed-eye frames of watch and curious from the same chat (one prompt per pose: "exactly the same image, eyes gently closed") and cross-fade to them for 120ms.

3. **The catchlights double the ones already painted in his eyes, and the eyes don't really follow the pointer.**
   - **What happens:**
     - The watch and curious art already has white catchlights in every pupil. The added 5px glint sits next to or over the painted one, so each eye shows two white dots.
     - When the pointer goes to the bottom-right, the glint drops to the centre of the pupil while the painted one stays at the top.
     - The glint travels at most ±1.6px in the dog's own coordinates (about ±1.9 screen px at 1920, inside a 21px iris). The visible "following" is the whole head rotating ±4°.
   - **Where:** `Companion.tsx` (`gx`/`gy` clamps, the glints), `signed-out.css` `.glint`.
   - **Sizes:** all.
   - **Evidence:** `r2-dog-eyes-1920x1000-6x.png`. From left: pointer top-left, pointer bottom-right, half blink, closed.
   - **Rule:** 27 ("follows the pointer").
   - **Fix:**
     - Choose one catchlight. Either retouch the painted highlights out of watch.webp and curious.webp and let the moving glint be the only one, or drop the glints.
     - To make the gaze read, move a small pupil layer (the iris cut out of the art) by ±2–3px inside an eye-shaped clip.

4. **His head is a different size in every pose: up to 30% between peek and sleep.**
   - **What happens:** All five files are cut "at one shared scale", but the dog is not drawn at one size across the sheet.
     - Measured on the art at that scale, the nose is 106px wide on watch, 117 on sleep, 92 on curious, 91 on cover and 82 on peek; the iris is 97px on watch, 80 on curious and 75 on peek.
     - At 1920×1000 that is a nose of 23.5px on watch against 18.2px on peek.
     - The face also jumps sideways. The nose's centre, in units of the 802-wide box, is at 543 on watch, 441 on cover, 392 on peek and 346 on curious: 23px from watch to cover and 34px from watch to peek at 1920.
     - Password focus therefore swaps to a smaller head, shifted left; Show makes it smaller again.
   - **Where:** `Companion.tsx` `ART` (the same scale for every state, `sink` only).
   - **Sizes:** all.
   - **Evidence:** `r2-dog-poses-1920x1000.png` (watch, cover, peek, curious and sleep, cropped at the same place relative to the plate).
   - **Rules:** 27, craft.
   - **Fix:** Add a per-pose `scale` and `dx` to `ART`, normalised by nose width or the distance between the eyes: about ×1.17 for cover and curious, ×1.29 for peek and ×0.91 for sleep. Pick `dx` so the nose lands within 4px of watch's, then re-derive `sink` so the paws or chest still meet the rule.

5. **A 1366×768 laptop in Edge (a 1366×641 window) now gets the phone column.**
   - **What happens:**
     - A 720px strip sits in the middle with 323px of bare cloth on each side.
     - `/sign-in` scrolls to 1518px (2.4 screens) and the plate's foot is cut at the fold (plate bottom 712 in a 641 window).
     - `/welcome` scrolls to 1546px, and Bond is cut at the fold.
     - All ten pages stack at this size.
   - **Where:** `bookFit.ts` `STACKED` (`(max-height: 690px)`), mirrored in `signed-out.css` §7.
   - **Size:** 1366×641, and any short desktop window.
   - **Evidence:** `r2-sign-in-1366x641.png`, `r2-welcome-1366x641.png`. Measured scrollHeight 1518 and 1546.
   - **Rules:** 8, 11.
   - My round 1 fix asked for stacking below a fit of about 0.75. That has overshot now that `--ctl` and `--tap` floor the controls in screen pixels.
   - **Fix:** Drop `(max-height: 690px)` from `STACKED` for windows 1181px wide or more, and let the spread fit at about 0.70: the floors keep the controls at 16px and 44px. If the plate then overflows, give short windows a 1440×640 design height with less dog room.

6. **The stacked ritual (phones, tablets, short laptops) shows a square board over half a page, then a ghost lockup over "Sign in.".**
   - **What happens:**
     - At 390×844, from 0 to 550ms, the closed board covers only the title line. The plate's fields, the Sign in button and the links show beneath it.
     - From 550 to 650ms the board fades as a whole, and the foil "AStory" floats over the plate's heading.
     - At 1366×641 at 600ms the same ghost lockup sits over "Sign in.".
     - At 820×1180 the board is a 360px square at the top, with a sliver of page under it and empty cloth below.
   - **Where:** `AuthFrame.tsx`, the phone branch of the timeline; `.board` sizing in the stacked CSS.
   - **Sizes:** 390×844, 820×1180, 1366×641.
   - **Evidence:** `r2-ritual-contact-390x844.png` (frames 0–550, and 650 with the ghost), `r2-ritual-stacked-1366x641-820x1180.png`.
   - **Rules:** 25, 23a.
   - **Fix:** On stacked layouts size the board to the whole title page, or hide the page beneath until the board has gone. Fade the foil title out (by about 0.45s) before the board's faces fade, so there is never a lockup over a form.

7. **The desktop ritual swaps the endpaper's pattern size under the arriving prints.**
   - **What happens:**
     - The back of the board, lying open as the left page, draws the A pattern at about twice the scale of the real left page's endpaper: four large As per row against eight small ones.
     - It also has a cream hairline frame.
     - When the board's back fades at 1.75–2.0s, the large As visibly turn into small ones and the frame vanishes, just as the prints land.
   - **Where:** `.board-back .ep-pattern` against `.leaf-l .ep-pattern` (the board is not a size container, so its `cqmin` tile differs).
   - **Sizes:** desktop (1920×1000 verified).
   - **Evidence:** `r2-ritual-leftpage-1350-1750-1850-2050-end-1920x1000.png`.
   - **Rules:** 23a, 25.
   - **Fix:** Give `.board-back` `container-type: size` (or the same pixel tile size and origin as `.leaf-l`) so the two endpapers match, and drop the board-back hairline.

8. **Hit areas still collide or fall short.**
   - **What happens:**
     - At 1366×768 the bottom 6px of the Sign in button belong to "Forgot your password?". `elementFromPoint` at the button's centre + 20px returns the link, so a press on the button's lower edge opens Forgot password. The button's own hit is 38px.
     - On a 390 phone the "Create an account" hit area covers the lower half of "Forgot your password?", whose hit is 31px tall.
     - Other short targets:

       | Size | Target | Rect | Hit area |
       | --- | --- | --- | --- |
       | 1366×768 | Front door's 17 spread dashes | 19×3 | 33×38 |
       | 1366×641 | "Use it here" | 77×18 | 39 tall |
       | 1366×641, 820×1180, 390×844 | Continue, Send the code, "I already have an account" | 44 | 40 |

   - **Where:** `.auth.ritual .plate-links a::before` (`inset: calc((var(--tap) - 1.3em) / -2 - 1px) -6px`, which runs past the 10px gap into the button), the stacked `.plate-links` rows, and the `.door` reader dashes.
   - **Rule:** checklist (44px targets, no overlapping targets).
   - **Fix:** Give `.plate-links` a margin-top at least as large as the pad, or cap the `::before` at the gap. On phones give each stacked link its own 44px row with no overlap. Give the dashes a 44px-tall hit strip.

9. **On `/create-account?code=`, the family-code line sits 2px above the Continue button at every size.**
   - **Measured** (field to line, then line to button): 7 and 2 at 1366×768, 10 and 2 at 1920×1000, 8 and 2 at 390×844.
   - **Where:** `.auth.ritual .given` inside `CreateAccount`.
   - **Evidence:** `r2-create-account-code-1366x768.png`.
   - **Rule:** craft (the gap inside a group). It reads as a caption stuck to the button.
   - **Fix:** Move "With the family code K7M 2QX" up under the name hint (it belongs to who you are joining as), or give it `margin: 10px 0 14px`.

10. **On `/welcome` Bond lies on nothing.**
    - **What happens:** His paws end 16–17px above the leaf's inner foil rule, and his body crowds the corner bracket. On every other page his paws rest on a printed rule.
    - **Where:** `.door .companion` (`align-self: end; margin-bottom: -12px`).
    - **Sizes:** 1920×1000, 1366×768, and the phone.
    - **Evidence:** `r2-welcome-dog-1920-1366-2x.png`.
    - **Rule:** 27 (he sits naturally on an edge).
    - **Fix:** Set his bottom so his paws touch the inner foil rule (`margin-bottom` equal to the rule's inset), and move him left of the corner bracket.

11. **The front door's control rows don't line up, and a button sits alone.**
    - **What happens:**
      - "Open the book" (top 846) and "Read this page" (top 835) are 11px apart at 1920×1000 and 7px apart at 1366×768. With a book open, "Read this page" still sits higher than Back and Turn page.
      - At 1366×768, "Sign in" wraps under "Begin a book" and sits alone on its row.
      - On a phone, "Read this page" sits alone on a second row.
    - **Where:** `signed-out.css` §6 (`.bk-under`, `.door-acts`).
    - **Evidence:** `r2-welcome-1920x1000.png`, `r2-welcome-1366x768.png`, `r2-welcome-open-raymond-1920x1000.png`, `r2-welcome-390x844-full.png`.
    - **Rule:** 10.
    - **Fix:** One height and `align-items: center` for the reader row. Keep "Begin a book" and "Sign in" on one line at 1181px and wider. On phones, make the reader row a two-by-two grid or full-width buttons.

12. **The sample book on the front door is still small** (round 1 finding 9, second half).
    - **Measured:** about 505×505px at 1920×1000 (13% of the window), and about 360×360px at 1366×768.
    - **Where:** `.door-book`.
    - **Rule:** 8.
    - **Fix:** As in round 1: give the book the height the picks and swatches row now wastes. For example, set the swatches beside the family picks and let the book grow by about 120px.

13. **Reduced motion still double-exposes two forms.**
    - **What happens:** Sign in → Create account under `prefers-reduced-motion` crossfades both plates in 150ms. At 75ms two dogs (watch and curious), two frames, two button stacks and two sets of labels are superimposed.
    - **Where:** `signed-out.css` §3, the reduced-motion block (`vt-fade` and `vt-appear` together, `plus-lighter`).
    - **Evidence:** `r2-vt-signin-to-create-reduced-contact-1920x1000.png` (0, 75 and 149ms).
    - **Rules:** 23a, 25.
    - **Fix:** Keep the same order without movement: old words out in 75ms, then new words in over the next 75ms (opacity only, `animation-delay: 75ms` on `::view-transition-new`).

14. **Peek loses the paw that should rest on the edge, and his open eye has no light.**
    - **What happens:** Peek's `sink` (0.13) puts the bottom 19px of the drawing behind the plate at 1920. The paw that rests on the edge in the art is reduced to a tan sliver at the plate's top. The glints are off whenever he isn't "awake", so his one open eye is the only eye with no catchlight from the site's own layer.
    - **Where:** `Companion.tsx` `ART` (peek `sink: 0.13`; no peek entry in `eyes`).
    - **Evidence:** `r2-dog-peek-1920x1000.png`.
    - **Rule:** 27.
    - **Fix:** Lower peek's sink to about 0.05 so the paw lies on the rule. If the glints stay (see finding 3), give peek its open eye's coordinate and one glint.

15. **Two small collisions in the printed matter.**
    - On a phone the porch print's photo corner covers the lower half of "The cake, June 1957", hiding the comma.
    - On the front door's sample cover the script "Finish the parade." crosses the cover's double inner frame at its left edge (1920 and phone).
    - **Where:** the phone positions of `.auth .print` in astory.css §33; the sample cover's script line in Welcome.
    - **Evidence:** `r2-sign-in-390x844-caption-zoom.png`, `r2-welcome-cover-script-zoom-1920x1000.png`.
    - **Rules:** checklist (no clipped or overlapping text), 22.
    - **Fix:** Give the phone's third print 12px more top offset. Inset the cover script inside the frame. If astoryapp.com/samples sets the script the same way, keep it as it is; I did not compare it.

## Not verified

- **Microsoft Edge itself, and a real touch device.** Everything ran in headless Chromium.
- **Anything behind a submit:** error states after a submit, Create account step 2, Forgot password step 2, the code-confirmed state of `/join`, and the signed-in `/join`. The brief said not to submit.
- **A `/c/:slug` with a real slug.** Only the not-available state was seen.
- **The reduced-motion ritual and the dog under reduced motion.** I did not re-run them this round. Round 1 found them correct, and the code paths are unchanged in shape.
- **The live 220ms crossfade between poses.** Slowed to 2.2s it showed only a faint ghost (`r2-dog-xfade-pair-1920x1000.png`), so I have not counted it. The jump in head size and position (finding 4) is the visible part.
- **The sample cover script** was not compared against astoryapp.com/samples (finding 15).
