# Bao's Standard: signed-out pages, round 8

**Verdict: PASS.**

Round 7's finding is fixed. No photograph is drawn grey after a page change, with a cold cache and image latency at 0, 600 or 1000ms, and that includes a click 300ms after the page loads.

The Skills gap is fixed: Bond's fade now runs to its end on every page.

Bond v2 passes rule 27 at every size:
- one nose point per page, to 0.08px or better;
- the tilt held at ±1.5°;
- every pose standing on the plate or the rule as a whole dog, never a floating head.

The weave, the end of every page change, the fit and the resizes hold as in round 7.

I accept the builder's three judgement calls; the rulings are below. One unreproduced white frame is noted, not counted.

## How this was checked

- **Browser:** headless Chromium through Playwright (`09142026/node_modules/playwright`), against http://localhost:5180, at 679487e (with 41260ae and 4881e2f).
  - The working tree also has uncommitted Archive work (`PrintCard.tsx`, `transcript.ts`, `atmosphere.ts`, and running-head rules in `astory.css` and `archive-reading.css`). None of it applies to the signed-out pages.
  - Every run used a fresh context with no session.
  - 390×844 ran as a touch device at DPR 3, and 820×1180 at DPR 2.
- **Network guard:**
  - Every non-GET request to Supabase was aborted and logged.
  - The only one attempted was the read-only `POST rpc/get_contribute_info` on `/c/sample-slug`, aborted or answered by the local stub ("Margaret Hale").
  - Nothing was submitted.
  - The only fake value used was `reader@example.test`.
- **Grey prints:**
  - **Method:** an in-page rAF sampler flagged every frame in which a print `<img>` (door, album, Join, Contribute) was visible (effective opacity above 0.05) while its picture was not yet complete. A screencast check looked for flat, light print boxes after the turn.
  - **Conditions:** a cold cache, with 0, 600 and 1000ms added to every image request. Clicks came 1.6s after load (the normal case) and 300ms after load (an early click, which beats the pre-decode).
  - **Turns:**
    - Sign in, Verify, Join ABC and `/c` → front door;
    - Join → Create account and Join → Sign in;
    - front door → Sign in;
    - Verify's Change → Create account;
    - also under reduced motion.
- **Bond's fade:** I logged `transitionstart`, `transitioncancel` and `transitionend` on the pose `<img>`s, `.fitting` toggles on the root, and the shown pose's opacity in every frame.
  - **Pages:** Create account and Sign in at 1366×768, cold and warm (the sizes where round 7 cut the fade), and the front door at 1920×1000 and 3840×2000.
  - **Plus:** Join, Verify at 1440×900, Create account at 1920 as the control, and Create account with `/dog/` delayed 1s.
- **Bond v2 (rule 27):**
  - **Where:** all ten sizes, on every page that has him.
  - **Measured per mounted pose:**
    - the nose point and width, from the v2 art points in `Companion.tsx`, mapped to each pose's rendered box;
    - the foot, the lowest opaque row of the art, measured from the live picture, against the plate's printed rule;
    - the tilt at five pointer positions;
    - the pose for the password field and after Show;
    - anything layered on him.
  - **Crops:** each pose, in `shots/so-r8-bond-*`.
  - **The art:** the six poses side by side, to judge head size by eye.
- **Weave matrix:** as in round 7. The 15 turns at 1920, 2560 and 390, with normal and reduced motion: 90 changes, 2202 paused frames and 5003 real (screencast) frames, three runs each. That includes the ghost measure at the end of every turn.
- **Fresh pass:** 10 sizes × 11 routes (110 pairs) with the round 7 survey. There are screenshots of every pair (`so-r8-<route>-<size>.png`).
- **Resizes:** the 17 resizes and two 40-step drags of round 7, against fresh loads, with the per-frame recorder.

## Round 7 BAOS finding: grey prints after a turn

**Fixed.**

| Turn | Latency | Click after load | Turn held | Visible, undecoded frames |
| --- | --- | --- | --- | --- |
| Sign in → front door | 0 / 600 / 1000ms | 1.6s | 45–73ms | 0 / 0 / 0 |
| Join → Create account | 0 / 600 / 1000ms | 1.6s | 41–129ms | 0 / 0 / 0 |
| Sign in → front door | 1000ms | 300ms | 416ms | 0 |
| Join → Create account | 600 / 1000ms | 300ms | 411–464ms | 0 / 0 |
| Join → Sign in | 600 / 1000ms | 300ms | ≤ 470ms | 0 / 0 |
| Verify → front door (reduced motion) | 600 / 1000ms | 300ms | ≤ 464ms | 0 / 0 |
| `/c` → front door | 600 / 1000ms | 300ms | ≤ 476ms | 0 / 0 |
| front door → Sign in | 0 / 600 / 1000ms | 300ms / 1.6s | 8–101ms | 0 |
| Verify's Change → Create account | 600 / 1000ms | 300ms | 57–69ms | 0 |

- **The table's "turn held" values** are measured from the press (`pointerdown`) to `startViewTransition`. The early-click values over 400ms include the sampler's own pointer and frame overhead.
- **The screencast** flagged no grey box after any turn. Its only hits were the outgoing page's cream at the print positions before the cut, and I confirmed each by eye.
- **With 1000ms latency and a click 300ms after load,** Join → Create account ends its turn with the album, the lettered bookplate and Bond all in place (`so-r8-join-create-1000ms-early-click.png`). In round 7 the same turn ended with three grey boxes and no plate.
- **What makes it work:**
  - `useTurn` holds a press on a link for at most 400ms while the destination's pictures decode. Every AuthFrame page and the front door pre-decode them 250ms after arrival.
  - `holdUntilDecoded` keeps any print still undecoded at opacity 0 and fades it in. That is the fallback the early-click runs exercise.

## The Skills round 7 gap: Bond's fade cut by `.fitting`

**Fixed.**
- In all 13 runs, every pose fade ends in `transitionend` with no `transitioncancel`. No `.fitting` toggle fires after the first paint.
- The opacity rises 0 → 0.31 → … → 1 over 6–7 frames: 283ms cold at 1366×768, 297ms on Sign in and 259ms on the door at 1920.
- Round 7 measured a cancel at 0.31 → 1.00 in one frame at 1366×768, and at 0.85 on the door at 1920.
- At 3840×2000 the fade also ends with `transitionend` and no cancel. Headless draws only one or two frames inside it at that size, so the per-frame ramp there is a frame-rate limit of the test, not a cut.

## Bond v2 against rule 27

| Size | Nose spread across a page's poses | Nose width (watch) | Tilt | Feet vs the plate's rule |
| --- | --- | --- | --- | --- |
| 1366×768 | ≤ 0.03px | 9.4px | −1.50° / +1.41° | cover +0.5, peek +0.3, curious +2.5, watch +5.2 |
| 1366×641 | ≤ 0.03px | 7.0px | ±1.50° | watch +4.0 |
| 1280×1024 | ≤ 0.02px | 8.8px | −1.50° / +1.41° | watch +4.9 |
| 1200×1000 | ≤ 0.02px | 8.3px | −1.50° / +1.41° | watch +4.6 |
| 1920×1000 | ≤ 0.04px | 12.4px | −1.50° / +1.45° | watch +6.9 |
| 2560×1300 | ≤ 0.05px | 16.1px | −1.50° / +1.46° | watch +9.0 (6.9 CSS px) |
| 5120×2560 | ≤ 0.08px | 31.7px | −1.50° / +1.47° | watch +17.8 (7.0 CSS px) |
| 800×1024 | ≤ 0.03px | 10.4px | −1.21° / +1.50° | watch +5.8 |
| 820×1180, 390×844 | ≤ 0.03px | 10.4, 9.0px | touch: still | watch +5.8, +5.0 |

- **Feet:** + means below the rule (behind the plate's top moulding). Every other pose is within 0.6px of the rule at 1920. Sleep on Verify is at −0.1px, and Join's happy at −0.1px.
- **Nose width varies with the drawing:** watch and peek 56.4 art px, cover 60.7, curious 62.9, happy 75.2. The head is cut at one scale, and the larger noses are the snout turned toward you. Side by side, the heads are one size, and on each page the noses land on one point. Rule 27's "one head size and position" holds.
- **The pose per moment:**
  - watch at rest;
  - cover on the password field;
  - peek after Show;
  - curious on Create account, Join and `/c`;
  - sleep on Verify.
  Nothing is layered over the painting, and the box has `pointer-events: none`.
- **A whole dog, never a floating head:**
  - Every ledge pose shows chest, paws and tail standing on the plate's rail (`so-r8-bond-*-rest-*.png`).
  - Sleep lies with chin on paws across the rail, as the art is drawn.
  - On the front door he sits on the leaf's inner foil rule, at the phone size too (`so-r8-bond-welcome-rest-390x844.png`).

## Rulings on the builder's judgement calls

1. **Watch's paws 5–9px below the rule on Sign in and Forgot password, so peek's paw stays on it: accepted.**
   - Rule 27 asks for one head position across a page's poses and for paws that never lift. Lowering watch to peek's nose height keeps the face still when he covers and peeks, which is the moment people watch.
   - At every size watch reads as a dog sitting just behind the moulding with his paws on it (`so-r8-bond-sign-in-rest-5120x2560.png`). He never floats.
   - The alternative, every foot on the rule, would move his face 5–9px between poses.
   - The tips of his toes are hidden by the moulding. That is acceptable at this size.
2. **Bond is small, with a nose of about 9.4px at 1366: accepted.**
   - His box is 94×107px at 1366×768, 124×141 at 1920 and 161×183 CSS px at 2560 (×1.3). He reads clearly as a dog with an expression at every size, including 70×80px at 1366×641 (`so-r8-sign-in-1366x768.png`).
   - He sits on a 410px plate as an earned, small moment (rule 27 "Small, earned moments"; rule 44 "never covers words"), and he scales with the book.
   - Rule 8 is about the layout using the screen, and the book does. It does not ask the companion to grow.
3. **Verify's "Change" turns at once (`data-turn="now"`): accepted.**
   - The link carries router state (`{ email }`), which `useTurn`'s own `navigate` would drop.
   - Its destination, Create account, needs nothing Verify has not already decoded, apart from the lettered bookplate, and that is pre-decoded 250ms after Verify arrives.
   - Measured: 0 grey prints at 600 and 1000ms latency.
   - The only gap is a click on a very slow line before Verify's own pictures have arrived. Then Create account shows its prints held at 0 and its plate not yet drawn, the same as Verify itself at that moment (`so-r8-verify-change-1000ms-click-before-load.png`). That is page load, not a grey turn.

## Weave and the end of every turn (round 7 checks, re-run)

- **Lowest weave as a share of rest:**

  | Size | Normal motion (paused / real) | Reduced motion (paused / real) |
  | --- | --- | --- |
  | 1920 | 0.991 | 0.994 / 0.994 |
  | 2560 | 0.986 / 0.985 | 0.994 / 0.994 |
  | 390 | real 1.00 | real 1.00 |

  At 390 there are two exceptions:
  - The paused first frame is 0.77. That is Chromium's capture of the old root at DPR 3, as noted in round 7.
  - Reduced-motion real frames on Sign in ↔ Forgot password dip to 0.93. The cause is the one patch that lands on Bond, as in round 7, not the cloth.
- **No real frame on the bare cloth is under 0.95** on any desktop turn.
- **The old page at the end:**
  - The ghost measure at the last paused frame is at most 0.03, and 0 on every settled page.
  - In real frames after the turn ends, it is at most 0.09 on turns to the front door (the bench still settling, no old content, checked by eye) and at most 0.02 on book ↔ book.
- **Root pseudos:** the old root computes `opacity 1 / normal / none`. The new root is `vt-appear` over 260ms, or 150ms under reduced motion.

## Fresh pass

The fresh pass is unchanged from round 7 on every measure:
- **Scroll:** no horizontal scroll on any of the 110 pairs, and no vertical scroll at any book-layout size.
- **Fits:**
  - the book: 0.9000, 0.7792, 0.8444, 0.7917 and 1.1875;
  - the door: 0.8231, 0.7716, 0.7713, 0.7231, 1.1590 and 1.1892.
- **Text:** the smallest text is 13px or more, apart from the known sample cover date at 12px on the phone. Headings are two lines or fewer.
- **Targets:** every hit area is 44px or more.
- **Console errors:** none.
- **Leftovers:**
  - The leaf (`Leaf.tsx`) now rests at 0.97 over words, and at 0.73–0.82 at 5120. That is its designed fade, which the Skills report raised in round 7.
  - The other part-faded items are the designed tones listed in round 7.
- **Resizes:** all 17 resizes and both drags match a fresh load, with 0 frames mixing the old and new (zoom, fit) pairs.

## Notes for the lead (not counted)

- **One fully white frame pair, not reproduced.**
  - In one of three screencast runs of Join ABC → front door at 1920×1000, two frames, 829ms and 1120ms after the press, were entirely white, cloth included (`so-r8-white-frame-join-abc-door-1920x1000.png`).
  - 36 further runs of that turn, Sign in → front door and `/c` → front door, two of them under parallel load, drew none.
  - The app never paints white there, since the cloth sits on the body's chocolate. A dropped compositor frame in headless software rendering is the likely cause.
  - Watch for it on Edge.
- **The two weave flat frames in the totals are this white pair.**
- **At 390 under reduced motion, one paused "settled" capture of Verify → front door read as off the destination (0.66).** Two re-runs gave 0, as did round 7's three. It was a capture timing artefact.

## Not verified

- **Microsoft Edge itself, a GPU compositor, a real touch device, real browser zoom and a real network.** The latency here is injected per image request on localhost.
- **Join's real success (happy) and anything behind a submit.** In the fresh pass happy is mounted on Join, nose-aligned to curious (0.01px), with its foot at −0.1px. His switch to happy on success needs a session, and I did not see it.
- **Screen-reader output and contrast:** not re-measured.
