# Bao's Standard: signed-out pages, round 7

**Verdict: FAIL, on one finding.**

Both round 6 findings are fixed, and so is the skills gap from round 6. The weave holds on every page change at 1920, 2560 and 390, with normal and reduced motion. No frame goes flat, and the old page never shows through at the end. In the fresh pass, Bond passes rule 27 at every size, every resize settles where a fresh load does, and the fit holds at all ten sizes.

The one thing that fails is new this round. When a page change lands on a page whose photographs have not been fetched yet, the prints arrive as grey boxes and fill in afterwards.
- This happens on the way to the front door from any book page, and on the way from Join to Create account or Sign in.
- The front door already guards against this when it turns into the book: `Welcome.tsx` waits for the album "so its prints never arrive as grey boxes". The other turns have no such guard.
- The founder often uses a private window, where the cache always starts cold.

## How this was checked

- **Browser:** headless Chromium through Playwright (`09142026/node_modules/playwright`), against http://localhost:5180, at commit e092062.
  - The working tree differs from that commit only in `src/data/contributions.ts`, a signed-in insert the signed-out pages do not use.
  - Every run used a fresh context with no session, with the ritual flag set.
  - 390×844 ran as a touch device at DPR 3, and 820×1180 at DPR 2. The other sizes ran as mouse windows at DPR 1.
- **Network guard:**
  - Every non-GET request to Supabase was aborted and logged.
  - The only one ever attempted was `POST rpc/get_contribute_info`, the read-only lookup on `/c/sample-slug`. It was aborted, except in the `/c` "stub" pass, where a local stub answered it with "Margaret Hale".
  - Nothing reached the server, and nothing was submitted.
  - The only fake value used was `reader@example.test`, which came in through the Verify URL.
- **The weave sampler:**
  - **Patches:** 12 bare-cloth patches of 16 CSS px per change. A patch qualifies only if it is cloth with the same pixels on both pages, clear of the lockup.
  - **Measured per patch:** the luminance std as a share of rest, the mean shift and the correlation.
  - **Ghost measure:** how much of the old page is left in a frame, estimated over every pixel where the two pages differ by more than 40 levels (0 means the new page, 1 means the old).
  - **Paused frames:** every 20ms, or every 10ms under reduced motion, from 0 to the transition's last animation end, with all animations paused on `ready` and seeked.
  - **Real frames:** a CDP PNG screencast, three runs per change.
  - **Turns, 15 of them:**
    - Sign in → front door;
    - front door → Sign in, Create account and Create account with a code;
    - Sign in ↔ Create account;
    - Sign in ↔ Forgot password;
    - Verify's Change → Create account;
    - Verify → front door;
    - bare Verify → Sign in;
    - Join → Create account and → Sign in;
    - Join ABC → front door;
    - `/c` → front door.
  - **Matrix:** each turn at 1920×1000, 2560×1300 and 390×844, with normal and reduced motion. That is 90 changes, 2202 paused frames and 4517 real frames.
  - **Repeats:** six extra screencast runs each of Sign in → front door at 2560 and 1920 (the round 6 flash), and four more of three door turns at 2560 under reduced motion.
- **The fresh pass:**
  - **Sizes (10):** 1366×768, 1366×641, 1280×1024, 1200×1000, 1920×1000, 2560×1300, 800×1024, 820×1180, 390×844 and 5120×2560.
  - **Routes (11):** the ten in the brief, plus `/c` both aborted and stubbed. That makes 110 page-size pairs.
  - **Measured on each pair:**
    - layout, `--fit` and html zoom;
    - scroll range both ways;
    - the book's rect against the window;
    - the smallest text in screen px, as font-size × `currentCSSZoom`;
    - heading line counts;
    - text-on-text overlaps;
    - text outside its leaf;
    - every control's hit extent, by stepping `elementFromPoint` out from its centre;
    - anything left part-faded;
    - Bond's shown pose and anything layered on him;
    - console errors.
- **Bond:** measured at nine of the ten sizes, all but 1920×1000, on every page that has him.
  - The nose of each mounted pose, from its art point.
  - The nose width.
  - The tilt at five pointer positions.
  - The pivot against the plate's printed rule.
  - The pose for the email field, the password field and Show.
  - Pseudo-elements and children over the painting.
- **Resizes:** 17 resizes and two 40-step drags, each compared with a fresh load at the new size. A rAF recorder tracked (html zoom, `--fit`, canvas zoom) in every frame.
- **The images:** the arrival of photographs after a turn, by screencast. Each run used a cold cache, with image latency at 0, 150, 600 and 1000ms.

Screenshots are in `web-app/docs/agents/reviews/shots/`, prefixed `so-r7-`: every route at every size (`-full` for pages that scroll), plus the evidence named below.

## Round 6 BAOS findings

| # | Round 6 finding | Now | Evidence |
| --- | --- | --- | --- |
| 1 | The weave dims to about 70% on every turn and goes flat at 2560 | **Fixed.** See below. | Weave sampler |
| 2 | 1280×1024 stacks and scrolls | **Fixed.** See below. | Survey, `so-r7-*-1280x1024.png`, `so-r7-*-1200x1000.png` |

**Finding 1, the weave:**
- `::view-transition-old(root)` now computes `opacity 1 / normal / none`. The new root is `vt-appear` over 260ms, or 150ms under reduced motion, with `normal` blending, so nothing is added up.
- **Lowest weave as a share of rest:**

  | Size and motion | Paused frames | Real frames |
  | --- | --- | --- |
  | 1920, normal | 0.991 | 0.991 |
  | 1920, reduced | 0.994 | 0.993 |
  | 2560, normal | 0.986 | 0.986 |
  | 2560, reduced | 0.999 | 0.999 |
  | 390, either | (note 1) | 1.00 |

- No real frame on the bare cloth is below 0.95 anywhere. The real-frame entries counted under 0.95 were all one patch over Bond on the stacked phone pages, which the patch filter wrongly took for cloth.
- **0 flat frames** in 270 screencast turns. That includes 9 runs of Sign in → front door at 2560, where round 6 drew 0.07.
- **The old page at the end:**
  - The ghost measure at the last paused frame (end − 0.5ms) is at most 0.03 on every turn at 1920 and 2560, and 0.08 at 390. It is 0 on every settled page.
  - The one 0.08 is Verify's Change → Create account at 390 with reduced motion. I looked at that frame: there is no trace of Verify in it. The difference is the new page's own last arrival.
  - In real frames from 60ms after the transition ends, the old page is at most 0.02 on every book ↔ book turn.
  - The larger values on turns to the front door are the door's own prints filling in, not the old page (finding 1 below).
  - Under reduced motion, door ↔ book is the designed 150ms crossfade, which DESIGN.md asks for (`so-r7-rm-door-create-crossfade-2560x1300.png`).

**Finding 2, 1280×1024:**
- `STACKED` is now `(max-width: 1180.98px), (max-aspect-ratio: 1/1)`, in `bookFit.ts` and in signed-out.css §7.
- At 1280×1024 every page opens the book, with no scroll either way:
  - the book's fit is 0.8444, with the book at 1216×608;
  - the front door's fit is 0.7713.
- At 1200×1000 the book's fit is 0.7917 and the door's is 0.7231.
- At both sizes:
  - the smallest text is 13.0px;
  - headings are two lines or fewer;
  - every control's hit area is 44px or more.
- Portrait windows stack. 1200×1300 and 1024×1280 both stacked and scrolled as designed.
- The family subtitles are hidden on the book layout below 1600px. That is deliberate (`signed-out.css:530`) and keeps the 13px floor, the same as at 1366.

## The round 6 skills gap (ddc912e)

**Fixed.**
- `.spread-wrap`'s side padding is 2.500% of the window at 1366, 1600, 1700×1100 (zoom 1.0625), 1866×1200 and 1200×1000. Above that it is held at its 48px cap, which scales with the zoom: 2.44% at 2560 and 2.40% at 5120.
- The tooled frame's inset is 1.600% at the same sizes, then held at its 28px cap.
- No unguarded `vw` or `vh` is left in `signed-out.css`. The legacy `.auth` rules in astory.css still use bare `vw` (gap, `.said`, `.sheet-wrap`), but none of them takes effect on these pages:
  - `.auth` is `flow-root`, so its gap does nothing (positions are identical with `gap: 0`);
  - `.said` and `.sheet-wrap` are not rendered;
  - `.paper`'s padding is overridden to 0.

## What holds (fresh pass)

- **Scroll:**
  - No horizontal scroll on any of the 110 pairs.
  - No vertical scroll at any book-layout size: 1366×768, 1366×641, 1280×1024, 1200×1000, 1920, 2560 and 5120. The book or bench is fully inside the window at every one.
  - The stacked layouts (800, 820, 390) scroll by design.
- **One scale:**
  - The book's `--fit` is 0.9000 at 1366×768, 0.7792 at 1366×641, 0.8444 at 1280×1024, 0.7917 at 1200×1000, and 1.1875 at 1920, 2560 and 5120.
  - The door's is 0.8231, 0.7716, 0.7713, 0.7231, 1.1590, 1.1892 and 1.1892.
- **Text:**
  - The smallest text is 13.0px at every desktop size up to 1366. It is 15.4px at 1920, 20.1px at 2560 and 39.5px at 5120, and 13px or more on the stacked pages.
  - The only text under 13px is the sample cover's date, at 12px on the phone (known, not counted).
- **Headings:** two lines or fewer everywhere.
- **Overlaps:** the only text-on-text overlaps are Join's `dt` over `dd` line boxes (2–9px), which is leading, as in round 6.
- **Text outside its leaf:** the only text "outside" its leaf is each plate heading's line box, 2px above `.paper` (5px at 5120). That is the line box, not ink.
- **Targets:** every hit area is 44px or more in both directions on all 110 pairs. Nothing is covered.
- **Leftovers:** nothing is left part-faded except designed tones: the lamp, `ep-pattern` 0.085, `ep-linen` 0.35, `print-cap` 0.9, the 0.85 and 0.75 rules, `sb-linen` 0.9 and `sb-cv-frame` 0.35.
- **Console errors:** none.
- **Resizes:**
  - All 17 resizes match a fresh load: layout, fit, zoom, the canvas rect to the pixel, and the scroll. For example:
    - 1920→2560 gives 1.1875 at zoom 1.3, with the canvas at 2223×1112;
    - 5120→1280×1024 gives 0.8444 with the canvas at 1216×608;
    - 1280×1024→1200×1300 stacks;
    - 1200×1300→1200×1000 opens the book at 0.7917.
  - Both drags (1600×1000 → 2800×1500 → 1200×900) match a fresh load.
  - The frame recorder saw only the old and new (zoom, fit, canvas zoom) pairs in every resize, never a mixed frame.
- **Bond (rule 27):**
  - **One head per page:** the noses of all mounted poses land within 0.08px at 1366 to 2560 and 0.16px at 5120. The nose width is within 0.14%.
  - **Tilt:** −1.50° to +1.50°, never more, at every mouse size. On touch he does not follow the pointer.
  - **Pivot:** 0.25–0.58px from the plate's printed rule (1.15px at 5120, which is 0.45 CSS px).
  - **The pose per moment:** watch at rest, cover on the password field, peek after Show, watch again on the email field. Curious on Create account and Join, sleep on Verify.
  - **Layers:** nothing over the painting (no child, no `::before` or `::after`), and `pointer-events: none`.

## Findings, worst first

1. **After a page change into a page whose photographs are not yet decoded, the prints show as grey boxes and the photographs pop in afterwards.**
   - **Where it happens:**
     - every turn to the front door (Sign in, Verify, Join ABC and `/c` → `/welcome`): the door's loose prints, `/photos/30-1200.webp`, `12-1200.webp` and `33-1200.webp`;
     - Join → Create account and Join → Sign in: the album, `27/02/18-1200.webp`.
   - **What was seen:**
     - **On localhost, no added latency, cold cache:**
       - In the Sign in → front door screencasts, the third print is a grey box while the bench settles (`so-r7-door-print-grey-during-turn-1920x1000-local.png`).
       - In one run, two prints were still grey when the turn ended (`so-r7-door-prints-grey-at-turn-end-1920x1000-local.png`). They were still grey 113ms later, and in another run 191ms later.
     - **With 600ms image latency:**
       - Sign in → front door: the door stands complete with three grey prints until 215ms after the turn (`so-r7-door-prints-grey-after-turn-1920x1000-600ms.png`).
       - With 1000ms latency the grey lasts until 546ms after the turn, and under reduced motion until 331ms after.
       - Join → Create account ends its turn with three grey album prints (`so-r7-join-create-album-grey-at-turn-end-1920x1000-600ms.png`). The plate's ornate frame has not drawn either, so Bond's whole chest stands over the "Your name" field until it loads.
       - Join → Sign in: grey until 73ms after the turn.
   - **Why:**
     - `Welcome.tsx` decodes `ALBUM` and waits up to 400ms (`albumReady`) before the front door turns into the book.
     - Nothing does the same for the door's prints when a book page turns to the door.
     - Nothing does it for the album when Join, which shows other prints, turns into Create account or Sign in.
   - **Sizes:** every desktop size. On the stacked layouts the prints are mostly below the fold.
   - **Rules:** 23a ("nothing jumps or flashes"), 25, and rule 1 (the page's own guard applied in one direction only). DESIGN.md: "Nothing appears from nothing."
   - **Fix:** do what `Welcome.tsx` does on every signed-out page that can turn into another. Have AuthFrame decode the door's three prints, and Join and Contribute decode the album and the plate frame, while the visitor reads. Then wait up to 400ms before `navigate(…, { viewTransition: true })`. If it cannot wait, keep an undecoded print at opacity 0 and fade it in when its `decode()` resolves.

## Notes for the lead (not counted)

- **On the phone (DPR 3), the old page's snapshot carries about 77% of the cloth's device-pixel weave detail at the first paused frame.** It reaches 1.00 as the new root fades in. At CSS-pixel resolution the screencast frames hold 1.00 throughout. The softness is in Chromium's capture of the old root under emulated DPR 3, not in any CSS rule, and the eye would not see it. It needs checking on a real phone.
- **At 1200×1000 the front door is width-bound.** The bench, at 0.7231, takes 54% of the window's height, leaving about 260px of cloth above it and 200px below. The ratio holds and nothing scrolls, so this is the cost of opening the book at that aspect. It is noted, not counted.
- **The sample cover's date at 12px on phones, the sample cover script and Bond's painterly style** are known and not counted, as the brief asked.

## Not verified

- **Microsoft Edge itself, a GPU compositor, a real touch device and real browser zoom.** Headless Chromium with screencasts and resizes stands in for them.
- **A real network.** The image latencies above are injected per request on localhost. Real timings depend on the host and the CDN.
- **Anything behind a submit:**
  - Join's real success;
  - Forgot password step 2;
  - server errors;
  - a real `/c` slug;
  - an upload.
- **Screen-reader output and contrast:** not re-measured. The tokens have not changed.
