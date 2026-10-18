# Bao's Standard: signed-out pages, round 6

**Verdict: FAIL.**

All four round 5 findings are fixed, and so are the five skills gaps and the zoom-step note. Bond passes rule 27 on every page at every size. The fit holds through every page change, under reduced motion too, and through every resize across the zoom step.

Two things still fail:

1. **The cloth still loses its weave during page changes.** The sampling the brief asked for found it. On every turn the weave dims to about 70% of its contrast for about 60ms, under reduced motion as well. On Sign in → front door at 2560×1300 it goes completely flat in real frames, the round 5 picture again. The cause is one CSS rule, and the fix was tested by injection: it holds the weave at 97% or more in every frame.
2. **At 1280×1024, a 5:4 desktop, every signed-out page uses the phone/tablet layout and scrolls** (rule 11). This size is new to the list this round.

## How this was checked

- **Browser:** headless Chromium 1243 through Playwright (`09142026/node_modules/playwright`), against http://localhost:5180, commit 0697e57.
  - Every run used a fresh context with no session. The ritual flag was set unless the ritual was the subject.
  - 390×844 and 820×1180 ran as touch devices (DPR 3 and 2). The other sizes ran as mouse windows.
  - The app set html zoom to 1.3 at 2560×1300 and 2.56 at 5120×2560.
- **Network guard:**
  - Every non-GET request to Supabase was aborted and logged. The only one ever attempted was `POST rpc/get_contribute_info`, the read-only lookup `/c/sample-slug` makes. It was aborted in one run and answered by a local stub ("Margaret Hale") in another.
  - Nothing reached the server.
  - Only fake values were typed: `reader@example.test`, "Test Reader", "abcdef", "abcdefgh1".
- **Fresh pass:**
  - **Sizes (9):** 1366×768, 1366×641, 1280×1024, 1920×1000, 2560×1300, 800×1024, 820×1180, 390×844 and 5120×2560.
  - **Routes:** `/welcome`, `/sign-in`, `/create-account` with and without `?code=K7M2QX`, `/forgot-password`, `/verify?email=reader@example.test`, `/verify`, `/join/K7M2QX`, `/join/ABC`, and `/c/sample-slug` both aborted and stubbed. That makes 99 page-size pairs.
  - **Measured on every pair:**
    - the scroll range;
    - the layout, `--fit` and html zoom;
    - the smallest visible text in screen pixels;
    - heading line counts;
    - text-on-text overlaps;
    - text outside its leaf;
    - every target's hit extent, by stepping `elementFromPoint` out from its centre;
    - anything left part-faded;
    - the lockup's rect against the book;
    - Bond's mood, mounted poses and fetched files;
    - console errors.
  - **Screenshots:** a separate, untouched pass.
- **The cloth's weave, frame by frame:**
  - **Method:** the cloth is sampled in 12 bare-cloth patches per frame. A patch is chosen only if it is cloth on both pages, clear of every object and of the lockup. For each patch I recorded the luminance mean, the luminance std (the weave) and the correlation with the same patch before the turn.
  - **Paused frames:** every 20ms from 0 to 600ms, or every 10ms from 0 to 200ms under reduced motion, with all animations paused on `ready` and seeked.
  - **Real frames:** a PNG CDP screencast of each change.
  - **Normal motion:** Sign in → front door and front door → Sign in at all 9 sizes. Also front door → Create account, Verify → front door at 1920 and 390, Sign in → Create account at 1920, 390, 2560 and 1366×641, Create account → Sign in, and Join → Create account.
  - **Reduced motion:** Sign in → front door, front door → Sign in, Sign in → Create account and Verify's "Change", at 1920, 390, 2560 and 1366×768.
  - **Repeat runs:** five or six screencast runs per change, counting flat frames: Sign in → front door at 2560 (twice) and 1920, front door → Sign in at 2560, and Sign in → Create account at 2560.
- **Zoom against `--fit`, frame by frame:**
  - **Method:** a rAF sampler compared the canvas's computed `zoom` with its `--fit`. It also compared the drawn width with design × fit × html zoom, and the first print's width with that element's own settled width. Each element instance was tracked separately.
  - **Changes:** 13 per run, in five click chains (book↔book, book↔door, Verify's Change, Join → Create), including a first visit with no seed (front door → Sign in).
  - **Runs:** reduced motion at 1920, 1366×768, 1366×641, 2560 and 5120, and normal motion at 1920, 1366×768 and 2560.
  - **Album still:** on top of that, a screencast diff of the album page through six book↔book changes, with and without reduced motion.
- **Resize across the zoom step:**
  - **Resizes:** 15, each compared with a fresh load at the new size.
  - **Drags:** two of 21 steps.
  - **First loads:** 60 at 3840×2000.
  - **Per frame:** a rAF recording of html zoom and fit through 10 resizes, looking for frames that mix the old and new pairs.
- **Bond (rule 27):**
  - **Where:** on Sign in, Create account (both steps), Forgot password, Verify, Join and the front door, at 1920, 1366×641, 1280×1024, 2560, 5120, 390 and 820.
  - **Measured:** the nose's position and size from each pose's art point through the head's live matrix, the tilt, the pivot against the plate's rule, the paws' corners, and anything layered over the painting.
  - **Slow line:** 11 runs on Create account, Join and Sign in, with a MutationObserver on the pose `<img>`s.
  - **In-app arrivals:** 6 arrivals from another page.
  - **Join's success:** Companion mounted alone with Join's props, `rest` switched while `watch` was on the wire.
- **Keyboard:** the Tab order and rings on six pages at 1920.

Screenshots are in `web-app/docs/agents/reviews/shots/`, prefixed `so-r6-`: every page at every size (`-full` for stacked pages), plus the evidence named below.

## Round 5 BAOS findings

| # | Round 5 finding | Now | Evidence |
| --- | --- | --- | --- |
| 1 | Back to the front door, the cloth goes flat for about 100ms | **Fixed as written, but not fully.** The `:root:has(.door)` root rules are gone, and the bench is its own `door-bench` layer delayed to 140ms. Paused frames no longer go flat; the lowest is 69% of the weave. But real frames at 2560 still go flat, and every turn dims the weave (finding 1 below). | `weave-*.json`, finding 1 |
| 2 | Under reduced motion the book is drawn unscaled for 2 to 4 frames | **Fixed.** Zoom equals `--fit` and the drawn width equals design × fit × zoom in every frame. That is 0 wrong frames out of 889 at 1920, 1439 at 1366×768, 1009 at 1366×641, 769 at 2560 and 88 at 5120, plus 1887 in normal motion. The first print's width never departs from its settled width. In real screencast frames the album's pixels do not change at all through four reduced-motion book changes (difference 0.00). | `zf2.mjs` output; `still.mjs` |
| 3 | On a stacked Join, the sample-photo note is hidden under the card | **Fixed.** The note now sits under the card (7px below at 800 and 820, 11px at 390). It is on top at its left, middle and right, at full opacity, 13px, in `--on-chocolate-soft`. On the spread it is unchanged and visible. | `so-r6-join-note-390x844.png`, `so-r6-join-note-800x1024.png` |
| 4 | The lockup's position uses `vw` without `/ var(--zoom)` | **Fixed.** The lockup is at 3.00% of the window at 1600×1000, 1700×1100 (zoom 1.0625), 1800×1150 and 1866×1200. In px that is 48, 51, 54 and 56, where round 5 measured 54 and 65 at the two zoomed sizes. `.door-wrap` is corrected too. No unguarded `vw` or `vh` is left in `signed-out.css`. | `vw.mjs` |

## Round 5 skills gaps

| # | Gap | Now |
| --- | --- | --- |
| 1 | Bond pops on Create account and Join (his rest pose is rebuilt) | **Fixed.** The list is flat and keyed. No pose `<img>` is removed in any of 17 runs. On a 1s line Create account and Join draw 0.31 on the first frame and are full about 115ms later, like the Sign in control. In-app, Sign in → Create account fades 0.31 → 0.56 → 0.74 → … on a slow line, and 0.11 a frame under reduced motion. Where the picture is already decoded he arrives with the page's own first frame, inside the turn's fade, which is correct. |
| 2 | Join's success blanks Bond while `watch` is on the wire | **Fixed.** In the harness, with `watch` delayed 3s and `rest` switched at 0.6s, he is blank for 0ms. `curious` is held until `watch` lands at 3029ms. |
| 3 | At 1280×1024 the stacked door hides the family subtitles | **Fixed.** The rule now keys on `data-layout="book"`, so 1280×1024 shows "A family memoir", "A founder's ledger" and "A veteran's homecoming". (The stacking itself at this size is finding 2.) |
| 4 | On stacked pages the lockup is off the column | **Fixed.** The lockup's left edge equals the column's: 40/40 at 800, 50/50 at 820 and 280/280 at 1280×1024, on the door and on every book page. On the phone it stays at 16, as the gap asked. |
| 5 | The photo-remove press snaps and squeezes too far | **Fixed in code** (120/160ms transitions, `scale(0.96)`). An upload needs the server, so it was not seen live. |
| Note | Shrinking across the zoom step mixes the old and new fit and zoom | **Fixed.** The fit now runs on `astory:resized`, after the zoom, in one task. There were 0 mixed frames in 10 resizes. The old pair is held for 26–69ms, the debounce, and then both change in the same frame. |

## What holds (fresh pass)

- **Scroll:**
  - No horizontal scroll on any of the 99 pairs.
  - No vertical scroll at any book-layout size.
  - The stacked layouts scroll by design. 1280×1024 is the exception (finding 2).
- **One scale:** `--fit` is one value per size on every AuthFrame page:
  - 0.9000 at 1366×768;
  - 0.7792 at 1366×641;
  - 1.1875 at 1920, 2560 and 5120.

  The door has its own: 0.8231, 0.7716, 1.1590, 1.1892 and 1.1892.
- **Text:**
  - The smallest text is 13px or more everywhere. It is 15.4px at 1920, 20.1px at 2560 and 39.5px at 5120.
  - The one exception is the sample cover's date at 12px on the phone (rule 22, not counted).
  - Every heading is two lines or fewer.
  - No text is outside its leaf.
  - The only range overlaps are Join's `dt` over `dd` glyph boxes (3–8px). That is leading, not ink, checked by eye at 390 and 800.
- **Targets:** every hit area is 44px or more in both directions at every size.
- **Leftovers:** only the designed 0.9 captions and the 0.85 and 0.75 rules.
- **Console errors:** only my own aborted request on `/c`.
- **Resizes:**
  - All 15 resizes and both drags settle identical to a fresh load. For example, 1600→2560 gives fit 1.1875, zoom 1.3 and the book at 2223×1112; 3840→1366×641 gives 0.7792, zoom 1 and 1122×561.
  - All 60 first loads at 3840×2000 are identical: Sign in at 1.1875/2/3420 twenty times, the front door at 1.1590/2/3616 twenty times, and Create account at 1.1875/2/3420 twenty times.
- **Bond (rule 27):**
  - **One head per page.** On each page the nose of every pose lands within 1.1px at 1920 and 2560, and within 2.1px at 5120 (zoom 2.56, so 0.8 CSS px). The nose width is within 0.7%.
  - **Height above the rule:** at 1920, 39.6–40.4px on Sign in and Create account, and 22.0px for Sleep on Verify.
  - **Tilt:** −1.50° to +1.50°, never more.
  - **Pivot:** 0.4–0.8px from the plate's printed rule (1.5px at 5120 = 0.6 CSS px), at the middle of the paws.
  - **Paws:** under the largest tilt the outer paw moves at most 1.3px at 1920 and 2.1px at 2560, about the middle, on the rule.
  - **Layers:** nothing is laid over the painting (no child, no `::before` or `::after`).
  - **Blink:** none, because no closed-eye frames exist.
  - **Touch:** he turns only toward a focused field.
- **Keyboard:** the order is unchanged from round 5 and logical. The field ring wraps the ruled line, and Verify starts on digit 1.

## Findings, worst first

1. **During every page change the cloth's weave dims to about 70%, and on Sign in → front door at 2560 it goes completely flat in real frames.**
   - **The dim, in every turn and at every size:**
     - `::view-transition-old(root)` and `-new(root)` both compute `mix-blend-mode: normal`, not the UA's `plus-lighter`.
     - They also run on different curves: old 200ms ease-out, new 260ms ease-out. Under reduced motion both run 150ms linear.
     - With normal blending the two never add up to a whole cloth. At 40ms the old root is at 0.32 under the new at 0.57, so 29% of a flat brown backdrop shows. Under reduced motion it is 0.50 over 0.50, so 25% shows.
     - **Measured in paused frames, the lowest weave as a share of rest:**

       | Turn | Normal motion | Reduced motion |
       | --- | --- | --- |
       | Book → door | 0.69 (every size, at 40ms) | 0.73–0.74 |
       | Door → book | 0.71–0.72 | 0.76 |
       | Book → book (Sign in → Create, Join → Create, Create → Sign in) | 0.71–0.78 | 0.76–0.81 |
       | Book → door, 390 | 0.61 | 0.65 |
       | Door → book, 390 | 0.62 | 0.67 |

     - Real frames match these within about 0.05.
   - **The flash:**
     - Sign in → front door at 2560×1300 drew real frames with the weave at **0.07, 0.13 and 0.07** of rest in 3 of 5 runs, and at 0.13 in 1 of 6 in a second batch. The cloth is a flat brown with only the lockup and a ghost of the old page, as round 5 reported.
     - At 1920 lesser dips appeared: Sign in → front door 0.40 (1 run of 5), Verify → front door 0.40, and front door → Create account 0.54.
     - Paused frames never go below 0.69, so in real time the new root's picture arrives late. Because the old root has already faded, nothing woven is left under it.
   - **The fix, tested:**
     - I injected `:root:has(.door, .auth)::view-transition-old(root) { animation: none !important; }`, which holds the old root at full opacity under the new one. The new root is opaque once it has faded in, so nothing of the old shows at the end.
     - Results:
       - **0 flat frames in 6 runs** at 2560, lowest 0.97;
       - paused and real frames at 1920 never below 0.967 (the door's own rest level) on Sign in → front door with and without reduced motion;
       - 0.994 on Sign in → Create account;
       - 0.999 on front door → Sign in.
   - **Where:** `src/styles/pages/signed-out.css` §3. The root uses the house crossfade from `astory.css:3505–3506`, and the reduced-motion block (the `:root:has(.door, .auth)::view-transition-old(root)` line) fades the old root.
   - **Sizes:** every size, as a dim. The full flash was seen at 2560×1300, partially at 1920×1000.
   - **Evidence:**
     - `so-r6-crop-signin-welcome-2560-flat.png`: at rest on the left, the real frame on the right;
     - `so-r6-flat-signin-welcome-2560x1300-run0-637ms.png`, `-run2-730ms.png`, `-run3-725ms.png`, `so-r6-flat-signin-welcome-1920x1000-run4-356ms.png`;
     - `so-r6-weave-*-low-*.png`;
     - the computed pseudo styles from `blend.mjs`.
   - **Rules:** 23a ("Nothing jumps or flashes"), 25, DESIGN.md "the cloth never goes", and §3's own line "its weave is drawn in every frame both ways".
   - **Fix:** in §3, outside and inside the reduced-motion block, set `:root:has(.door, .auth)::view-transition-old(root) { animation: none; }` (with `!important` and `display: block` inside the block). Keep the new root's fade as it is. Re-run the weave sampler and expect no frame below 0.95 of rest.
   - **Caveat:** the full flash was seen in headless software rendering. On Edge with a GPU it may be rarer. The 70% dim is deterministic CSS and happens everywhere.

2. **At 1280×1024 every signed-out page uses the stacked phone/tablet layout and scrolls, on a landscape desktop monitor.**
   - **What happens:**
     - `STACKED` is `(max-width: 1180.98px), (max-aspect-ratio: 5/4)`. A 5:4 window is exactly 5/4, so the book is never opened at that size.
     - The page is a 720px column in a 1280px window: 56% of the width, with 280px of empty cloth on each side.
     - The pages scroll by these amounts:
       - Sign in 623px;
       - Create account 565px;
       - Forgot password 544px;
       - Verify 588px (452px without the email);
       - Join 667px;
       - Contribute 452px;
       - the front door 323px.
     - The file's own comment says the pages stack "on a phone, a narrow window or a portrait screen". 1280×1024 is none of those.
     - The spread would fit: by the same arithmetic as 1366×768, the book would scale to about 0.84 and the door to about 0.77. Both are within the fits already accepted (1366×641 runs at 0.78 and 0.77).
   - **Where:** `src/pages/auth/bookFit.ts:30` (`STACKED`), and its mirror in `signed-out.css` §7 (`@media (max-width: 1180.98px), (max-aspect-ratio: 5/4)`).
   - **Sizes:** 1280×1024. The same happens to any window 1181px or wider with an aspect of 5:4 or less, for example 1200×1000.
   - **Evidence:** `so-r6-sign-in-1280x1024.png` and `-full.png`, `so-r6-welcome-1280x1024.png` and `-full.png`; the survey (`layout: stacked`, `sy` as above).
   - **Rules:** 11 ("the sign-in and the other signed-out pages fit the window on a desktop"), 8.
   - **Fix:** change the aspect clause to portrait only, `(max-aspect-ratio: 1/1)`, in both places. Check 1280×1024 and 1200×1000 for no scroll, text at 13px or more and 44px targets.
   - **Not verified:** the spread at this size was computed, not rendered.

## Notes for the lead (not counted)

- **At a book-to-book turn the album prints jump 1.4–3px back to rest** (1920: 1.4–2.5px; 2560: 1.8–3.1px). The old prints had drifted toward the pointer; the new page's start at rest, then drift back on the next move. It is the pointer parallax (`Prints.tsx`) and too small to count. Seeding the new movers from the last pointer position would remove it.
- **After a resize, the old fit and zoom stay for 26–69ms** (the 60ms debounce). On a shrink the book overhangs the window for those 3–5 frames, then both change in one frame. It always settles correctly.
- **On the phone the lockup is at 16px and the column at 10px,** as the round 5 gap asked.
- **The sample cover's date is 12px on the phone** (rule 22), and the known items listed in the brief were not counted.

## Not verified

- **Microsoft Edge itself, a GPU compositor, a real touch device and real browser zoom.** Headless Chromium with screencasts and resizes stands in for them. That is why finding 1's full flash carries the caveat above.
- **Anything behind a submit:**
  - Join's real success (the harness only);
  - Forgot password step 2;
  - server errors;
  - a `/c` with a real slug;
  - the photo-remove × (code only).
- **The fix for finding 2** was not rendered. The fit numbers are computed from the 1366×768 padding.
- **Screen-reader output and contrast** were not re-measured. The tokens have not changed.
