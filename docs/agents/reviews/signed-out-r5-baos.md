# Bao's Standard: signed-out pages, round 5

**Verdict: FAIL.**

Every round 4 finding is fixed, and so are all six skills gaps, the zoom-step resize included. Bond passes rule 27 on every page at every size.

Three things still fail, and one small rule-12 slip:

1. **Back to the front door, the cloth goes flat.** For about 100ms the woven cloth disappears into flat brown, with only the lockup left on it. The round 4 fix I recommended caused this. It fades the root (which holds the cloth) out before fading it back in.
2. **Under reduced motion, every page change draws the book at the wrong scale for 2 to 4 frames.** The canvas loses its `zoom: var(--fit)`, so the album and the plate visibly shrink (or grow) and snap back.
3. **On a stacked Join page, the sample-photo disclosure is hidden under the invitation card.** The photograph above it is a stranger's family with no label.
4. **The new lockup position uses `vw` without dividing by `--zoom`** (rule 12).

## How this was checked

- **Browser:** headless Chromium 1243 through Playwright 1.63 (`09142026/node_modules/playwright`), against http://localhost:5180.
  - Each run had a fresh context with no session. The ritual flag was set unless the ritual was the subject.
  - 390×844 and 820×1180 ran as touch devices (DPR 3 and 2). The others ran as mouse windows.
  - The app set html zoom to 1.3 at 2560×1300, 2 at 3840×2000 and 2.56 at 5120×2560.
- **Network guard:** every non-GET request to Supabase was aborted and logged. The only one ever attempted was `POST rpc/get_contribute_info`, the read-only lookup `/c/sample-slug` makes on load. It was aborted, which gives the "didn't open" state. A second run answered it locally with a stub ("Margaret Hale"), so the leaf could be seen. Nothing reached the server. Only fake values were typed (`reader@example.test`, "Test Reader", "abcdef").
- **Fresh pass:** 10 routes at 8 sizes, plus the stubbed `/c` (88 page-size pairs). The routes were `/welcome`, `/sign-in`, `/create-account`, `/create-account?code=K7M2QX`, `/forgot-password`, `/verify?email=reader@example.test`, `/verify`, `/join/K7M2QX`, `/join/ABC` and `/c/sample-slug`. The sizes were 1366×768, 1366×641, 1920×1000, 2560×1300, 800×1024, 820×1180, 390×844 and 5120×2560. Measured with JavaScript on every pair:
  - **Scroll:** the scroll range.
  - **Scale:** the layout, `--fit` and html zoom.
  - **Text:** the smallest visible text in screen pixels (font-size × `currentCSSZoom`), heading line counts, and text-on-text overlaps from range rects.
  - **Containment:** text outside its leaf or plate.
  - **Targets:** every target's hit extent, by stepping `elementFromPoint` out from its centre.
  - **Leftovers:** anything left part-faded after arrival.
  - **Lockup:** its rect and its clearance from the book.
  - **Bond:** his mood, the poses mounted and the pose files fetched.
  - **The plate:** the room at its foot.
  - **Console errors.**
- **Screenshots:** a separate, untouched screenshot pass. The probe's `scrollIntoView` shifts the book's overflow box, so the probe's own shots were discarded and the pages shot again.
- **Page changes, frame by frame:** `startViewTransition` was wrapped, every animation paused on `ready`, and the computed opacity of each `::view-transition-*` pseudo read at each seek time.
  - **Seek times:** 0 to 600ms in normal motion (19 frames) and 0 to 200ms in reduced motion (12 frames).
  - **Normal motion, 1920:** Sign in → Create account, Sign in → Forgot password, Create account → Sign in, Welcome → Sign in, Welcome → Create account, Sign in → Welcome, Verify → Welcome, Verify's "Change", and Join → Create account.
  - **Normal motion, other sizes:** at 390, 1366×641, 2560, 5120 and 820: Sign in → Create account, Welcome → Sign in and Sign in → Welcome.
  - **Reduced motion:** at 1920, 390 and 2560: Sign in → Create account, Welcome → Sign in, Sign in → Welcome and Change.
  - **Checks on the paused frames:**
    - real frames from a CDP screencast;
    - a per-frame sampler (`requestAnimationFrame`) of the live page's canvas zoom against its `--fit`, over 18 changes.
- **Resize across the zoom step:** each page was loaded at one size, resized, then compared with a fresh load at the new size.
  - **Sign in:** 1600→2560, 2560→1366, 2560→3840, 1920→2560×1440, 1366→2560, 3840→1366×641, 2560→800 and 800→2560.
  - **Other pages:** the front door at 1600→2560, 2560→1366 and 2560→3840; Create account at 1600→2560 and 2560→1366; Join at 2560→1366; Verify at 1600→2560.
  - **Drags:** two drags of 21 steps, 1500→2560 and 2560→1366.
  - **First loads:** 60 first loads at 3840×2000 (Sign in, Welcome and Create account, with and without the ritual and reduced motion).
- **Bond against rule 27:** on Sign in, Create account (both steps), Forgot password, Verify, Join and the front door, at 1366×641, 1920, 2560, 5120, 390 and 820. I computed the nose from each pose's art nose point, the image's layout box and the head's live matrix and transform-origin. That gives its position, its size, the tilt, the pivot against the plate's rule, and the paws' corners under the largest tilt. States filmed:
  - rest;
  - the pointer at both edges, the top and the corner;
  - email focus and name focus;
  - cover (password focus) and peek (Show);
  - Create account's step 2, reached locally;
  - sleep.
- **Slow line:** every `/dog/` file was delayed 2.5s, with the ritual skipped and played, and with reduced motion on the phone. The pose opacity was sampled every frame.
- **Keyboard:** the Tab order and focus rings on six pages at 1920 and 1366×641.
- **Screenshots:** in `web-app/docs/agents/reviews/shots/`, all prefixed `so-r5-`. That is every page at every size (`-full` for stacked pages), the transition frames and contact sheets (`so-r5-vt-*`, `so-r5-cast-*`), the resize shots and the evidence crops named below.

## Round 4, finding by finding

| # | Round 4 finding | Now | Evidence |
| --- | --- | --- | --- |
| 1 | Going back to the door double-exposes two pages | **Fixed.** The book fades out in 120ms, and the door comes in from 140ms. No frame shows two dogs, two lockups or the form over the cover. **But the fix lets the cloth go flat** (finding 1 below). | `so-r5-vt-signin-welcome-1920x1000-contact.png` |
| 2 | Reduced motion moves the old words and blanks the door | **Fixed as reported.** Between book pages the old words are no longer drawn (`display: none`), and the new ones come in over 150ms, linear. To and from the door, root and book cross in 150ms with the cloth held, and there is no bare frame. **A new reduced-motion fault was found** (finding 2 below). | `so-r5-vt-signin-create-1920x1000-rm-contact.png`, `so-r5-vt-welcome-signin-1920x1000-rm-contact.png` |
| 3 | The lockup changes size and place between the door and the book | **Fixed.** One rect per size on all 11 pages, for example 114×36 at (56, 34) at 1920, (41, 29) at 1366×768, (16, 20) at 390 and 148×47 at 2560. It is one named layer (`brand`) with no animation, and holds through every turn. | survey |
| 4 | The lockup sits on the book at 1366×641 | **Fixed.** It is 89×28 at y 14, and its foot is 16px above the left page. | `so-r5-sign-in-1366x641.png` |
| 5 | The stacked family rows are 720px bars | **Fixed.** At 800 and 820 the families are one row of three chips with their subtitles, and the swatches share the left edge. On the phone they sit one under another, each as wide as its words. | `so-r5-welcome-800x1024-full.png`, `so-r5-welcome-390x844-full.png` |

## Round 4 skills gaps

| # | Gap | Now |
| --- | --- | --- |
| 1 | The fit goes stale after a resize across the zoom step | **Fixed.** All 15 resizes and both drags settle identical to a fresh load (fit, zoom and book rect to the pixel). For example, 1600→2560 gives fit 1.1875, zoom 1.3 and the book at 2223×1112; 3840→1366×641 gives 0.7792, zoom 1 and 1122×561. All 60 first loads at 3840×2000 are identical (Sign in 1.1875/2/3420 px every time). A transient overflow lasts about 20ms between the fit's 40ms timer and the zoom's 60ms one, mid-resize only, and is not counted. |
| 2 | Pages without a password fetch the password poses | **Fixed.** Fetched: Verify `sleep` only, Join `curious` and `watch`, Contribute `curious`, the front door `watch`. |
| 3 | A new rest pose unmounts the held one | **Fixed in code.** `can` keeps `held` mounted (Companion.tsx). Join's success state was not reachable without a server. |
| 4 | A cold first picture pops in | **Fixed.** With 2.5s on the wire, `data-mood` is unset until the picture arrives. Then opacity goes 0 → 0.31 → 0.56 → 0.74 → 0.85 → 1 over about 150ms on Sign in, Verify (reduced, 150ms linear) and the front door. |
| 5 | Swatches hang right at 800 and 820 | **Fixed** (see round 4 #5). |
| 6 | The photo-remove × has no hover | **Fixed in code.** It inks and tones on hover (fine pointers) and scales to 0.94 when pressed. An upload needs the server, so it was not seen live. |

## What holds (fresh pass)

- **Scroll:**
  - No horizontal scroll on any of the 88 pairs.
  - No vertical scroll at any book-layout size.
  - The stacked pages scroll by design.
- **One scale:** `--fit` is the same on every AuthFrame page at each size (0.9000, 0.7792, 1.1875, 1.1875, 1.1875). The front door uses its own bench fit (0.8231, 0.7716, 1.1590, 1.1892).
- **Text:**
  - The smallest text is 13px or more everywhere. It is 15.4px at 1920, 20.1px at 2560 and 39.5px at 5120.
  - The one exception is the sample cover's printed date at 12px on the phone (rule 22, not counted).
  - Headings are two lines or fewer.
  - There is no text outside its leaf or plate.
- **Targets:** every target's real hit area is 44px or more in both directions at every size.
- **Leftovers and errors:**
  - Nothing is left part-faded except the designed 0.9 captions and the 0.85 and 0.75 rules.
  - The only console errors are my own aborted request on `/c`.
- **Page changes between book pages in normal motion** are one clean turn at every size filmed:
  - the old words are gone by 110ms;
  - the book and title page cut at 120ms;
  - the new words rise over 120 to 360ms;
  - the lockup is still throughout;
  - the cloth holds, because the root crossfade is concurrent.
- **Welcome → Sign in and Welcome → Create account in normal motion** hold the cloth (textured in every frame) and bring the open book in whole from 140ms (`so-r5-vt-welcome-signin-1920x1000-contact.png`).
- **Bond (rule 27):**
  - **One head size and position per page.** On each page every pose's nose lands within 1.1px of the others at 1920 and 2560, and within 1.4px at 5120 (2.56 zoom). Its width is within 0.7%.
    - At 1920 the nose stands 40.5px above the rule in watch, 40.2px in cover and 41.0px in peek on Sign in.
    - On Create account, both steps: 40.4px in curious, 40.2px in cover and 41.0px in peek.
    - The nose width is 20.35 to 20.49px.
  - **Tilt.** At most ±1.50° (measured −1.50 to +1.44).
  - **Pivot.** It is on the plate's printed rule, within 0.4 to 1.5px, at the middle of the paws. Under the largest tilt the paws' outer corners move 1.4px at 1920 and 0.8px at 1366×641, about the middle, and never leave the rule.
  - **Touch.** He holds still on touch except toward a focused field.
  - **No layers over the painting.** There is no `::before` or `::after`, and no other child, over it.
  - **Blink.** None: no closed-eye frames are supplied.
  - **Sleep** is the only pose on Verify (22.5px above the rule at 1920). That passes "every pose on one page".
- **Keyboard:**
  - The Tab order is logical on every page tested.
  - The field ring wraps the whole ruled line: ochre, `2px / fit` (`so-r5-focus-email-1920x1000.png`).
  - Verify starts on digit 1 by autofocus.

## Findings, worst first

1. **Going back to the front door, the bookcloth flashes to a flat brown fill for about 100ms.**
   - **What happens:**
     - On Sign in → Welcome (the lockup), and the same from Verify, `::view-transition-old(root)` fades to 0 in 120ms.
     - `::view-transition-new(root)` only starts at 140ms: 0.00 from 0 to 140ms, then 0.26 at 160 and 0.65 at 200.
     - The cloth lives in root on both pages. From about 60ms to 160ms neither is drawn, so what shows is the canvas: a flat #4A3327 with no weave, the lockup alone on it.
     - The forward direction keeps the cloth, because its root crossfade runs concurrently (old 200ms, new 260ms).
   - **Where:** `signed-out.css` §3, the two `:root:has(.door)::view-transition-old(root)` and `-new(root)` rules.
   - **Sizes:** every size filmed (1920, 1366×641, 2560, 5120, 390 and 820).
   - **Evidence:**
     - `so-r5-crop-signin-welcome-110.png`: before, on the left, and at 110ms, on the right;
     - `so-r5-vt-signin-welcome-1920x1000-contact.png`, `so-r5-vt-signin-welcome-390x844-contact.png`, `so-r5-vt-verify-welcome-1920x1000-contact.png`;
     - the opacities, from the pause log.
   - **Rules:** 23a ("Nothing jumps or flashes"), and the file's own line "The cloth around the book is the same on both sides and does not move."
   - **Fix:** Keep root on the house crossfade (drop both `:root:has(.door)` root rules). Give the bench its own name, then delay only that:
     - `.door-canvas { view-transition-name: door-bench; }`
     - `::view-transition-new(door-bench):only-child { animation: 320ms var(--ease-out) 140ms both vt-appear; }`
     - Then the book leaves first, the door's objects come after, and the cloth never goes.

2. **Under reduced motion, every page change draws the book (or the bench) unscaled for 2 to 4 frames.**
   - **What happens:**
     - A per-frame sampler of the live page shows the canvas's computed `zoom` at 1 while its `--fit` is 1.1875 (or 0.9).
     - This lasts 2 to 4 frames, about 20 to 60ms of rAF, in every reduced-motion change measured: 9 of 9.
       - At 1920, Sign in → Create account: 167 to 186ms.
       - Sign in → Welcome: 166 to 171ms.
       - Welcome → Sign in: 153 to 184ms.
       - The same at 1366×768 and 2560×1300.
     - In the same 9 changes with normal motion it is 0 of 9.
     - The album and plate visibly change size, then snap back:
       - at 1920 the first print goes 421 → 354 → 421px (−16%);
       - at 1366×768 it goes 319 → 354 → 287 → 319px.
     - Under reduced motion the new book is shown from the first frame, so the jump is on screen. It is caught in a real screencast frame and in the frame-0 capture.
     - It also happens with View Transitions switched off under reduced motion (one frame). So it is the page mounting, not the transition CSS. Changing the reduced-motion pseudo rules does not remove it (tried three variants).
     - `--fit` itself is already set on `.auth` in those frames. The zoom that reads it through `var()` is what lags. (Under reduced motion the links take React Router's own path, because `lib/pageTransition.ts` steps aside.)
   - **Where:**
     - `bookFit.ts` `paint()`, which only writes `--fit`;
     - `astory.css:3150` `.auth .spread.scaled { zoom: var(--fit, 1) }`;
     - `signed-out.css:475` `.door-canvas.scaled { zoom: var(--fit, 1) }`.
   - **Sizes:** every book-layout size. 1920, 1366×768 and 2560 were measured.
   - **Evidence:**
     - `so-r5-rm-book-shrinks-1920x1000.png`: a real screencast frame during the change on the left, settled on the right;
     - `so-r5-cast-signin-create-1920x1000-rm-contact.png` against the clean `so-r5-cast-signin-create-1920x1000-contact.png`;
     - `so-r5-vt-signin-create-1920x1000-rm-000.png`.
   - **Rules:** 12 (the ratio holds), 23a, 25, and DESIGN.md "Reduced motion collapses to a 150 ms crossfade" (nothing else may move).
   - **Fix:**
     - In `paint()`, also write the zoom inline on the canvas (`art.style.zoom = fit.toFixed(4)`, removed when stacked), so it never waits on the custom property.
     - Seed the first render with the last fit: a module-level `lastFit`, set as the inline style before the first paint. That is what AuthFrame's header comment already promises: "the scale is remembered across pages and applied before the first paint".
     - Re-run the per-frame probe (`zoom` against `--fit`) on 9 reduced-motion changes and expect 0 mismatched frames.

3. **On a stacked Join page, the one disclosure ("Photographs from a sample family's book.") is hidden under the invitation card.**
   - **What happens:**
     - In §7, `.inv` is a grid in DOM order: print, print two (hidden), note, card.
     - The card has `margin-top: -6%` and is painted later, so it covers the note completely:
       - at 390 the note is at (32, 1010, 326×18) inside the card's (27, 1005, 335×475);
       - at 800 the note is at y 1230 inside the card's 1203 to 1569.
     - The stranger's kitchen-table photograph above it is therefore shown on someone's family invitation with no "sample" label.
     - On the desktop spread the note is visible.
   - **Where:** `signed-out.css` §7: `.inv-note { position: static; margin: 16px 0 0; }` and `.inv-card { margin-top: -6%; }`.
   - **Sizes:** 390×844, 800×1024 and 820×1180.
   - **Evidence:** `so-r5-join-note-hidden-390x844.png` (the note's own box, empty), `so-r5-join-K7M2QX-800x1024-full.png`, and the survey's overlap of the note with "What joining means.".
   - **Rules:**
     - 20 (honest copy);
     - DESIGN.md "Sample content is labelled as sample" and "Never a borrowed scene presented as the family's own";
     - 19 (the one disclosure must be there).
   - **Fix:** In §7, put the note after the card: `.inv-card { order: 2 } .inv-note { order: 3; margin-top: 14px; }`. Or move it beside the print as its caption. Check it at 390, 800 and 820.

4. **The new lockup position uses `vw` without dividing by `--zoom`.**
   - **What happens:**
     - `top: clamp(16px, 1.8vw, 30px); left: clamp(16px, 3vw, 56px)` is new this round. The same `3vw` is in `.door-wrap`'s side padding, which predates this round.
     - Between 1600 and about 1870px wide on a window taller than 1000px, the zoom multiplies the `vw`. The lockup's left inset then grows from 3.00% to 3.50% of the window: 54px at 1700×1100 and 65px at 1866×1200, where the formula intends 51px and 56px.
     - The effect is at most 9px. It is the trap the founder's display already hit once.
   - **Where:** `signed-out.css:92` and `:473`.
   - **Sizes:** 1600 to 1870px wide with a height of 1000px or more.
   - **Evidence:** probe at 1600×1000, 1700×1100, 1800×1150, 1866×1200 and 1920×1000.
   - **Rule:** 12 ("Never use `vh` or `vw` without dividing by `--zoom`").
   - **Fix:** write `calc(1.8vw / var(--zoom))` and `calc(3vw / var(--zoom))` in both places.

## Notes for the lead (not counted)

- **Round 4's own recommendation caused finding 1.** I asked for the door's root to wait 140ms, without noticing that the root carries the cloth.
- **The sample cover's printed date is 12px on a phone** (rule 22). The §6 comment "the sample cover's date never under 13px on screen" still contradicts the phone rule two sections later.
- **At 1366×641 the ribbon marker runs about 9px past the window's foot.** It hangs from a book that fills the height. It is decoration, so it is not counted.
- **Reduced motion, to and from the door,** is a plain 150ms crossfade, so book and door are both half-drawn at 75ms. That is what DESIGN.md prescribes, so it is not counted.

## Not verified

- **Microsoft Edge itself, a real touch device and a real browser zoom** (Ctrl −/+). The resizes stand in for it.
- **Anything behind a submit:**
  - Join's success state, so gap 3 was checked in code only;
  - Forgot password step 2;
  - server errors;
  - a `/c` with a real slug;
  - the photo-remove × hover, in code only.
- **The root cause of finding 2 inside Chromium.** The symptom and its scope are measured, and the fix is a proposal to verify.
- **Screen-reader output and contrast.** Neither was re-measured this round.
