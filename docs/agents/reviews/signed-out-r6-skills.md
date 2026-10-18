# Signed-out pages, round 6: skills review

**Verdict: GAPS. There is 1 gap, and it is polish** (0 blockers, 0 ugly).

Every gap from round 5 is fixed, and so is every BAOS round 5 finding. I measured each fix and each one holds. The only new gap is the rule-12 trap from BAOS finding 4: it was fixed in `signed-out.css`, but two older lines in `astory.css` still carry it on the same pages. If the lead counts polish as passing, this round passes.

**The brief's checks, in short:**
- **Bond, cold and warm, on Create account and Join:** he fades in on every run. His first frame is at 0.31 and he is at full opacity about 160 ms later. The rest pose is never torn down. That is 0 removals in 23 runs (round 5: a pop on every visit).
- **Join's success with `watch` still loading:** Bond is never blank (round 5: blank for 2418 ms).
- **Resizes:** 18 resizes and 2 drags all end exactly where a fresh load does.
  - No frame mixes the new fit with the old zoom (round 5 had 1 or 2 per shrink).
  - In 40 of 40 first loads at 3840×2000, the fit is right.
- **Reduced-motion page changes:** no wrong-scale frames in 24 changes (18 with reduced motion, 6 at normal motion). Round 5 had them in 9 of 9.
- **The cloth through both turns to and from the front door:** the weave is drawn in every frame.
- **GSAP cleanup:** holds.
- **develop.ts (the Archive):** it still steps up on `ZOOM_EVENT`. ZOOM_EVENT fires before `RESIZED_EVENT`, and the step never goes back down.

**Scope.** Commit 0697e57 changed:
- `src/styles/pages/signed-out.css`: `door-bench`, `.fitting`, the order of Join's note, `vw / --zoom`, the lockup on stacked pages, the × press;
- `src/pages/auth/bookFit.ts`: the inline zoom, `lastFit`/`seedFit`, `.fitting`, `RESIZED_EVENT`;
- `src/pages/auth/AuthFrame.tsx` and `Welcome.tsx`;
- `src/components/delight/Companion.tsx`: the `flatMap` keys, and `held` added to `more`;
- `src/lib/zoom.ts`: `RESIZED_EVENT`.

I checked every signed-out route again for regressions.

**Skills loaded:**
- taste-skill: SKILL, layout, type, critique.
- hallmark: SKILL, anti-patterns, slop-test, interaction-and-states, responsive.
- emil-design-eng: the whole SKILL.
- impeccable: craft-floor, polish, layout.
- gsap-react, gsap-performance, gsap-core (matchMedia) and gsap-timeline. gsap-scrolltrigger has nothing to check here: these pages use no ScrollTrigger.
- `docs/BAOS-STANDARD.md` and `DESIGN.md`.
- No other installed skill applies.
- DESIGN.md §Motion now says what the code does: signed-in pages change with no animation under reduced motion, and the signed-out pages cross their words in 150 ms. That settles round 5's third note.

## How it was checked

**Setup:**
- Playwright 1.63 (`09142026/node_modules/playwright`), chromium-1243 headless, against `http://localhost:5180`.
- The working tree is clean at 0697e57, so the dev server serves the committed code.
- Every context was new, with no session.
- Only fake values were used: `reader@example.test` and K7M2QX.

**Network guard:**
- Most runs aborted and logged every non-GET request that left localhost.
- The warm runs could not use request interception, because interception turns off the HTTP cache. They ran with `--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost` instead, which blocks every outside host.
- The only request ever attempted was Contribute's read-only `POST rpc/get_contribute_info` on `/c/sample-slug`, and it was aborted. Nothing was submitted.

**Bond: 23 runs, each recording every frame.** A sampler ran on every frame. It recorded:
- the box's opacity through all of its ancestors;
- each pose's opacity, and whether it had pixels;
- each pose `<img>` added or removed, through a MutationObserver.

The cold runs were 14 fresh contexts:
- **Create account:** on a normal line, then with `/dog/` delayed 1 s, 2.5 s with the ritual, 1 s with reduced motion, and 1 s at 390 touch.
- **`?code=K7M2QX`:** 1 s, three times, and on a normal line once.
- **Join `K7M2QX`:** on a normal line, 1 s, 2.5 s with the ritual, and 1 s with reduced motion.
- **Join `ABC`:** at 2560.
- **Sign in:** as the control.

The warm runs were 9:
- After a reload with a warm cache: Create account and Join, each with and without reduced motion.
- Within one document, by the link: Sign in → Create account, with and without reduced motion; Create account → Sign in; Join → Create account, with and without reduced motion; Create account `?code` → Sign in.

**Join's success:** it needs a session, so I mounted `Companion.tsx` alone through Vite with Join's props (`poses={["curious","watch"]}`), and switched `rest` from `curious` to `watch` in three cases:
- with `watch` held 3 s on the wire;
- with `watch` already loaded;
- with both poses on the wire, switching before `curious` arrived.

**Resize:** each page was loaded at one size, resized to another, and compared with a fresh load at the new size. 18 pairs:

| Page | Resizes |
| --- | --- |
| Sign in | 1600×1000→2560×1300, 2560×1300→1366×768, 1920×1000→2560×1440, 3840×2000→1600×1000, 1366×768→800×1024, 800×1024→2560×1300, 3840×2000→1366×641 |
| The front door | 2560×1300→3840×2000, 3840×2000→1366×768, 1600×1000→2560×1300, 1366×768→800×1024, 800×1024→1920×1000, 1280×1024→1300×1024 |
| Create account | 1366×768→3840×2000 |
| Verify | 1920×1080→2560×1600 |
| Join | 2560×1300→1920×1000 |
| Forgot password | 1300×1000→1200×1000 |
| `/c` | 1920×1000→3840×2000 |

- **The probe:** on every frame it read the html zoom, `--fit`, the canvas's computed `zoom`, the layout, the book's rectangle and the scroll.
- **Drags:** 31 sizes, 16 ms apart, from 1500×950 to 2700×1550, on Sign in and the front door.
- **First loads:** 40 at 3840×2000, across five routes, mixing the ritual played and skipped, with and without reduced motion.

**Page changes, per frame:** a sampler of each canvas's computed `zoom` against the expected fit for its size, and against its own `--fit`. It covered six changes:
- Sign in → Create account;
- Sign in → Welcome (the lockup);
- Welcome → Sign in;
- Create account → Sign in;
- Verify's Change;
- Join → Create account.

Each ran with reduced motion at 1920×1000, 1366×768 and 2560×1300, and at normal motion at 1920. One more case kept a stale seed: the window was resized on the front door, then the visitor went into the book.

**View transitions:**
- **The pause:** I wrapped `startViewTransition`, paused every animation on `ready`, and stepped to 0, 40, 80, 110, 125, 140, 160, 200, 260, 340 and 460 ms.
- **The readings at each step:** the opacity of each `::view-transition-*` pseudo, plus the standard deviation and mean of the luminance in a strip of bare cloth (it reads 0 standard deviation when the weave is lost).
- **The turns:** Sign in → door, door → Sign in, Verify → door, door → Create account and Sign in → Create account, at 1920 with both normal and reduced motion. Sign in → door and door → Sign in again at 390 touch.

**GSAP:** I patched `gsap.context`, `quickTo` and `matchMedia` through the Vite module. The route:
- the front door → Sign in;
- 20 pointer moves;
- the email typed;
- the password focused;
- then off to Forgot password.

I ran it with the ritual played and with it skipped. Afterwards: `getTweensOf` on the old prints, head, dog and board; the global timeline; the old inline transforms; and a stack trace for each `matchMedia` left unreverted.

**develop.ts:** I mounted `usePrintPhoto` on a 250 px frame through Vite and read its `width` state. Two tests:
- **(a)** set the html zoom to 2 with no event, then dispatch `ZOOM_EVENT` alone;
- **(b)** a real resize from 1600×1000 to 3840×2000, then back.

**Fresh sweep: 120 renders.**
- **The 10 routes:**
  - `/welcome`, `/sign-in`, `/create-account`, `/create-account?code=K7M2QX`, `/forgot-password`;
  - `/verify?email=reader@example.test`, `/verify`;
  - `/join/K7M2QX`, `/join/ABC`, `/c/sample-slug`.
- **The 12 sizes:** 1366×768, 1366×641, 1920×1000, 2560×1300, 3840×2000, 800×1024, 390×844 (touch, DPR 3), 820×1180 (touch, DPR 2), 1280×1024 and 1200×1000, plus reduced motion at 390 and 1920.
- **Measured on each render:**
  - horizontal scroll, and vertical scroll in the book layout;
  - headings over two lines;
  - the smallest visible text in screen pixels (`currentCSSZoom`);
  - each control's real hit, by stepping `elementFromPoint` out from its centre;
  - links and buttons that wrap;
  - anything left part-faded;
  - console errors.

**Layout probes:** at 800, 820, 390, 1280×1024, 1200×1000, 1366×768, 1700×1100, 1866×1200 and 1920. They read:
- the lockup against the column;
- Join's note: hit-tested, and its gap below the card;
- the front door's subtitles;
- the computed side padding of `.auth .spread-wrap`;
- the inset of `.auth.ritual::after`.

**Mechanical scans:**
- `impeccable detect`: 0 anti-patterns and 59 advisories, as in rounds 4 and 5.
- taste `lint.mjs`: 2 FAIL and 8 WARN, as in round 5. The 2 FAIL are Contribute's running head, accepted since round 1. The 8 WARN are outline buttons and the kind toggle.

**Screenshots** are in `docs/agents/reviews/shots/`, named `signed-out-r6-skills-*`:
- the turns at 40, 110, 140 and 200 ms (`-vt-*`);
- `-820x1180-signin-top`, `-800x1024-signin-top`;
- `-390x844-join-note`, `-800x1024-join-note`, `-820x1180-join-note`;
- `-1280x1024-door`, `-820x1180-door`.

### What holds

**Round 5 gap 1 is fixed: Bond keeps his own element, so he fades in on Create account and Join.**
- Every cold run drew his first frame at 0.31 (0.11 under reduced motion, the 150 ms linear fade), and he was at full opacity 134–167 ms later.
- The MutationObserver shows `curious` added once and never removed. For example, Create account went `+curious@649`, then `+cover +peek@1670`. Before the fix, `curious` was removed and re-added at that same moment.

| Run | First frame | Full |
| --- | --- | --- |
| Create account, normal line | 0.74 (the sampler missed the first step) | +134 ms |
| Create account, 1 s | 0.311 | +167 ms |
| Create account, 2.5 s with the ritual | 0.309 | +160 ms |
| Create account, 1 s, reduced motion | 0.111 | +134 ms |
| Create account, 390 touch, 1 s | 0.309 | +167 ms |
| Create account `?code`, 1 s (×2) and normal line | 0.31 | +158 to +167 ms |
| Join, normal line / 1 s / 2.5 s with the ritual | 0.311 / 0.311 / 0.309 | +163 / +165 / +166 ms |
| Join, 1 s, reduced motion | 0.111 | +133 ms |
| Join `ABC` at 2560, 1 s | 0.311 | +166 ms |
| Sign in, 1 s (the control) | 0.31 | +166 ms |
| Warm reload: Create account / Join | 0.31 / 0.56 | +167 / +147 ms |
| Warm reload, reduced motion: Create account / Join | 0.111 / 0.111 | +124 / +124 ms |

- **Arriving by the link, in one document,** the new dog is mounted at 0 and fades. The first drawn frame is 0.22–0.85, depending on where the irregular headless frames fell, and he is full 90–150 ms later. That held in all six changes. None draws him at 1 in one frame.
- **One stray run.** In the first cold `?code=K7M2QX` run, no pose had arrived after 4 s: one `curious` request stalled under interception. It did not recur in 5 further runs of that route. A request that never returns only leaves the plate without the dog. It is not something the code does.

**Round 5 gap 2 is fixed: Join's success never blanks Bond.**
- **With `watch` 3 s on the wire and the switch at 0.6 s:** `curious` stays mounted and at 1.00 in every frame until `watch` lands, and then the two cross. Blank for 0 ms.
- **With `watch` already loaded:** a crossfade whose lowest point is 0.56.
- **With both poses on the wire and the switch before `curious` arrived:** nothing had been drawn, so there is nothing to blank. `watch` fades in when it arrives.

**BAOS round 5 finding 2 is fixed: no page change draws the book at the wrong scale.**
- 0 wrong-scale frames in 24 page changes. That is 18 with reduced motion at 1920, 1366×768 and 2560×1300, and 6 at normal motion. Round 5 had them in 9 of 9 reduced-motion changes.
- On every frame the canvas's `zoom` equals both its `--fit` and the expected fit.
- A stale seed is corrected before paint. I kept 1.1875 from a 1920 window, resized on the front door to 1366×768, then went into the book. Every frame read 0.9, with and without reduced motion.

**Round 5 note 1 is fixed: a resize never mixes the new fit with the old zoom.**
- All 18 resizes and both drags end identical to a fresh load: fit, html zoom, canvas zoom, layout, and the book's size and place to the pixel.
- 0 frames show the new fit under the old zoom, or the reverse. For example, 3840→1600 went straight from (zoom 2, fit 1.1875) to (zoom 1, fit 1.0556).
- They settle 90–168 ms after the resize.
- No resize ends in a scroll, and none leaves the canvas `zoom` different from `--fit`.
- **First loads at 3840×2000:** 40 of 40 land on one fit per route, with nothing overflowing:
  - 1.1590 on the front door;
  - 1.1875 on Sign in, Create account, Join and Verify.

**BAOS round 5 finding 1 is fixed: the cloth holds in both turns to and from the door.**
- **The order:** root keeps the house crossfade: old 200 ms, new 260 ms, concurrent. The book (`auth-*`) or the bench (`door-bench`) leaves in 120 ms. Then what comes settles in 320 ms from 140 ms.
- **The weave:** the cloth strip's standard deviation never falls below 11.8 in any paused frame of any turn at 1920 or 390. At rest it is 15.5–17.3. Round 5's flat brown read near 0.
- **The 140 ms frame of Sign in → door** is the woven cloth with only the lockup on it (`-vt-signin-to-door-140ms.jpg`): the book has gone and the bench has not come. It is the mirror of the forward turn, and the comment in §3 describes it.
- **Under reduced motion,** all four layers cross in 150 ms linear, and the weave holds: standard deviation 11.8 or more.
- **Book to book** (Sign in → Create account) is unchanged: the words leave by 110 ms, the cut comes at 120 ms, and the new words come by 460 ms.

**BAOS round 5 finding 3 is fixed: Join's note shows on stacked pages.** At 390, 800, 820, 1200×1000 and 1280×1024:
- "Photographs from a sample family's book." sits 7–11 px under the card's foot;
- a hit test at its centre returns the note itself;
- it is set at 13 px, at full opacity (`-390x844-join-note.jpg`).

**BAOS round 5 finding 4 is fixed in `signed-out.css`.** The lockup sits at 3% of the window under the zoom: 51 px at 1700×1100 and 56 px at 1866×1200, where round 5 measured 54 and 65. The same is true of `.door-wrap`'s side padding. The same trap remains in `astory.css`: see the gap.

**Round 5 gap 3 is fixed.** At 1280×1024 the stacked front door shows the families' subtitles, because the rule now keys on `.door[data-layout="book"]`. The chips are 166, 167 and 211 px wide, the same as at 1200×1000 (`-1280x1024-door.jpg`). The 1366×768 spread still keeps the names only.

**Round 5 gap 4 is fixed.** On stacked pages the lockup starts on the column, on the front door and on every book page:

| Width | Lockup | Column |
| --- | --- | --- |
| 800 | 40 | 40 |
| 820 | 50 | 50 |
| 1200×1000 | 240 | 240 |
| 1280×1024 | 280 | 280 |
| 390 | 16 | 10 (the phone keeps 16 px, as asked) |

**Round 5 gap 5 is fixed (checked in code).** The ×'s disc eases its transform in 120 ms and its fill and border in 160 ms, all on `--ease-out`. The press is `scale(0.96)`. An upload needs the server, so it was not seen live.

**`.fitting` costs nothing visible.** I focused the password and resized the window 30 ms later, so the fit lands mid-crossfade:
- the cover pose's fade read 0.31 → 0.56 → 0.74 → 0.91 → 0.97 → 1;
- without the resize it read 0.31 → 0.56 → 0.74 → 0.85 → 0.91 → 0.95 → 0.97 → 1, so the fade is essentially unchanged.

`paint` returns early when nothing changed, so the fonts arriving doesn't toggle `.fitting` either.

**GSAP cleanup holds.**
- **`quickTo` count:** 24 after Sign in mounted (8 from the door and 16 from Sign in, the same 16 as round 5). It stays 24 after 20 pointer moves, and 24 after typing.
- **On leaving:** `getTweensOf` is 0 on the old prints, head, dog and board, and no tween on the global timeline targets them. The old prints carry no inline transform. The old, detached head keeps an identity `translate(0px, 0px)`, which is harmless.
- **Contexts:** 10 made and 8 reverted. The 2 left belong to the page still open.
- **`matchMedia`:** 3 made and 2 reverted. The one left is ScrollTrigger's own, created when the plugin registers (from its stack trace), not the page's.
- The same holds after the ritual has played.

**develop.ts still steps up on `ZOOM_EVENT`.**
- **(a):** the 250 px frame asked for 400 at zoom 1. The html zoom was then set to 2 with no event, and it stayed at 400. With `ZOOM_EVENT` alone it stepped to 600, so the event, not a ResizeObserver, drives it.
- **(b):** 1600×1000 → 3840×2000 fired `zoom 2` then `resized`, and the frame stepped from 400 to 600. Going back down fired `zoom 1` then `resized`, and it stayed at 600 (never down).
- `apply()` still dispatches `ZOOM_EVENT` only when the zoom changes. `RESIZED_EVENT` comes after it, in the same task.

**The fresh sweep, 120 renders:**
- **Scroll:** no horizontal scroll, and no vertical scroll in the book layout.
- **Headings:** none runs over two lines.
- **Targets:** every control's real hit is at least 44 px both ways, and no link or button wraps.
- **Console:** no errors except the guard's own aborted request on `/c`.
- **Opacity:** the only things below full opacity are the designed 0.90 print captions.
- **Text:** nothing is under 13 px, except the sample cover's printed date at 12 px on a phone. That is rule 22, the same as rounds 4 and 5.

### Not verified

- Microsoft Edge itself, a real browser zoom (Ctrl −/+) and a real touch device. The resizes and touch emulation stand in for them.
- Join's real signed-in success. It was checked through the harness above.
- The Archive's real prints. `usePrintPhoto` was checked through a harness with no photograph URL.
- Create account step 2, the empty submits and server errors. None of them changed this round.
- Screen-reader output and contrast. The tokens have not changed since round 2.
- My first frame-by-frame probe of Sign in → Create account crashed the headless renderer, twice. The cause was `getComputedStyle(html, "::view-transition-old(door-bench)")` while no `door-bench` pseudo existed. Normal navigation through the same change never crashed in 30+ runs, and nothing in the app makes that call. The turn was measured with a narrower probe.

---

## Round 5, gap by gap

| # | Round 5 gap | Now |
| --- | --- | --- |
| 1 | Bond pops in on Create account and Join | **Fixed.** 0.31 → full in about 160 ms. 0 rest-pose removals in 23 runs. |
| 2 | Join's success blanks Bond while `watch` loads | **Fixed.** Blank for 0 ms with `watch` 3 s on the wire (was 2418 ms). |
| 3 | 1280×1024 hides the families' subtitles | **Fixed.** The rule follows `data-layout`. |
| 4 | The lockup sits off the column on stacked pages | **Fixed.** On the column at 800, 820, 1200 and 1280. 16 px on the phone. |
| 5 | The ×'s press snaps and squeezes too far | **Fixed** in code: 120/160 ms ease-out, `scale(0.96)`. |
| Note | Shrinking across the zoom step mixes the new fit and the old zoom | **Fixed.** 0 mixed frames in 18 resizes. |
| Note | Both turns to and from the door pass through bare cloth | **Fixed.** The weave is in every frame. |
| Note | DESIGN.md and the code disagree on reduced motion | **Fixed.** DESIGN.md §Motion now matches the code. |

| # | BAOS round 5 finding | Now |
| --- | --- | --- |
| 1 | The cloth goes flat on the way back to the door | **Fixed** (`door-bench`, with root on the house crossfade). |
| 2 | Under reduced motion the book is drawn unscaled for 2–4 frames | **Fixed.** 0 of 24 page changes. |
| 3 | Join's sample note is hidden under the card on stacked pages | **Fixed.** |
| 4 | The lockup's `vw` is not divided by `--zoom` | **Fixed in `signed-out.css`.** Still open in `astory.css`: gap 1. |

---

## Gaps

### Polish

**1. `astory.css` still sizes two book-page lengths in `vw` without dividing by `--zoom`.**
- **Skills and rules:**
  - BAOS 12 ("Never use `vh` or `vw` without dividing by `--zoom`");
  - BAOS 1 ("a note about one page is a rule for every page"), since BAOS round 5 finding 4 named this exact trap;
  - impeccable polish ("fix the cause at the narrowest correct level");
  - hallmark responsive.
- **Where:**
  - **`src/styles/astory.css:2154`:** `.auth .spread-wrap { … padding: clamp(62px, 8vh, 96px) clamp(12px, 2.5vw, 48px) clamp(16px, 3vh, 40px) }`. The top and bottom are overridden by `astory.css:3144` and `signed-out.css:85`, both divided by the zoom. The sides, `2.5vw`, are not overridden anywhere.
  - **`src/styles/astory.css:2152`:** `.auth.ritual::after { inset: clamp(10px, 1.6vw, 28px) }`. That is the blind-tooled frame drawn on the cloth around every book page.
- **Measured:**
  - **The padding:** 42.5 CSS px at 1700×1100 (zoom 1.0625), drawn as 45.2 screen px against an intended 42.5. At 1866×1200 (zoom 1.1663) it is 46.65 CSS px, drawn as 54.4 against an intended 46.65.
  - **The effect on the book:** `useFit` measures this padding, so the book stays inside the window. But it is width-limited there, so at 1866×1200 it fits at 1.0463 instead of 1.0556. That is about 16 px narrower, with 8 px more cloth on each side. Its left edge (54) then sits 2 px left of the lockup (56) instead of 9 px.
  - **The frame:** its inset is 27.2 CSS px at 1700×1100, against an intended 25.6, about 2 screen px off.
  - **Where it applies:** only windows 1600–1920 px wide and taller than 1000 px. At 2560 and 3840 both lengths are clamped to their maximums.
- **Change:** in signed-out.css §1, beside the existing top and bottom override, add:

  ```css
  .auth .spread-wrap { padding-left: clamp(12px, calc(2.5vw / var(--zoom)), 48px); padding-right: clamp(12px, calc(2.5vw / var(--zoom)), 48px); }
  .auth.ritual::after { inset: clamp(10px, calc(1.6vw / var(--zoom)), 28px); }
  ```

  Then re-run the resize and first-load probes, because the fit depends on this padding and every expected fit at 1600–1920 × >1000 moves a little. Also grep the rest of `astory.css` §34 for `vw` and `vh` on `.auth` rules. The ones I found apply only to the old non-ritual `.auth` pages, which no current route renders.

### Motion and interaction, in Emil's format

| Before | After | Why |
| --- | --- | --- |
| `.auth .spread-wrap` sides `clamp(12px, 2.5vw, 48px)` | `clamp(12px, calc(2.5vw / var(--zoom)), 48px)` | Under the html zoom, Chromium multiplies `vw`. The margin around the book then grows faster than the window between 1600 and 1920 px (gap 1). |

Every motion rule I checked passes:
- **Easing:** house ease-out for entrances, and ease-in-out only for on-screen movement. No ease-in anywhere in the change.
- **Durations:** none over 320 ms on a turn, and 120–160 ms on presses.
- **Properties:** no `transition: all`, and only transform and opacity are animated.
- **Reduced motion:** every turn has its 150 ms crossfade, and `.fitting` is held for one style pass only.

### Scores (taste-skill critique; hallmark self-critique)

```
ROUND 6
Seen in one second: the family book open on the cloth, Bond with his paws on the bookplate.
Idea: the sign-in is the title page of the family's own book (the Ex Libris plate is the form). It passes the competitor test.
Live thing: Bond watching, covering his eyes and peeking; on the front door, the sample book in three families and seven covers.
Layout words: door=bench+leaf / sign-in=spread+plate / join=card+plate / contribute=person+leaf
Scores: design 8.5 · usability 9 · creativity 9 · content 8 → overall 8.7
Caps applied: none.
Top three: gap 1 (vw without --zoom in astory.css on the book pages); nothing else a stranger would notice.
Hallmark reading: P5 H4 E5 S5 R4 V4. E rises to 5: Bond, the turns and the fit are each measured clean frame by frame. Every mechanical floor measured passes.
```
