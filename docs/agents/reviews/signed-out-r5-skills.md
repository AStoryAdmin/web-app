# Signed-out pages, round 5: skills review

**Verdict: GAPS.** 5 gaps: 0 blockers, 0 ugly, 5 polish. Round 4's blocker is fixed. The fit now holds through every resize across the zoom step, and in 60 first loads at 3840×2000. Of round 4's six gaps, four are fixed and two are half fixed:
- **Gap 4 (Bond pops in).** It is fixed on Sign in, Forgot password, Verify, Contribute and the front door. It is still open on Create account and Join, where it now happens on every visit, not only on a slow line (gap 1).
- **Gap 3 (Join's success blanks Bond).** The fix doesn't reach the case it was written for (gap 2).

Nothing found this round is worse than polish. If the lead accepts polish as passing, this round passes.

**The brief's checks, in short:**
- **Resizes across the zoom step:** 12 resizes and 2 drags all match a fresh load exactly.
- **First loads at 3840×2000:** 60 of 60 at the right fit (round 4: 2 of 22 failed).
- **Bond on a slow line, cold and warm:** never blank on Sign in. He fades in on the five pages above. He pops on Create account and Join.
- **Pose fetch:** every page now fetches only the poses it draws.
- **GSAP cleanup:** holds.
- **astory.css's scoped reduced-motion rule:** signed-in layers still get no animation at all under reduced motion. The signed-out pages get their 150 ms crossfade.

**Scope.** Commit 723faa3:
- `src/lib/zoom.ts` (`zoomFor`, `astory:zoom`)
- `src/pages/auth/{bookFit.ts, AuthFrame.tsx, Verify.tsx}`
- `src/pages/{Join.tsx, Contribute.tsx}`
- `src/components/delight/Companion.tsx`
- `src/styles/pages/signed-out.css`
- the one reduced-motion `::view-transition` rule in `src/styles/astory.css`

I re-checked the rest of the signed-out pages for regressions.

**Skills loaded.**
- taste-skill: SKILL, layout, type, critique.
- hallmark: SKILL, anti-patterns, slop-test, interaction-and-states, responsive.
- emil-design-eng.
- impeccable: SKILL, craft-floor, polish, layout, critique, adapt.
- gsap-react, gsap-performance, gsap-core (matchMedia), gsap-timeline. gsap-scrolltrigger has nothing to check: these pages use no ScrollTrigger.
- `docs/BAOS-STANDARD.md` and `DESIGN.md`.

No other installed skill applies.

## How it was checked

Playwright 1.63 (`09142026/node_modules/playwright`) ran chromium-1243 headless against `http://localhost:5180`. Every context was new, with no session. Only fake values were used ("abcdef", `reader@example.test`, K7M2QX).

**Network guard.** Every non-GET request to Supabase was aborted and logged. The only ones attempted were Contribute's read-only `get_contribute_info` lookup on `/c/sample-slug`, two per load. Nothing was submitted.

**The sweep: 180 renders.**
- **Sizes:**
  - 1366×768, 1366×641, 1920×1000, 2560×1300 (html zoom 1.3) and 3840×2000 (zoom 2);
  - 800×1024, 390×844 (touch, DPR 3) and 820×1180 (touch, DPR 2), each with and without reduced motion;
  - 1280×1024 and 1200×1000, which are new this round and sit on either side of the 5:4 line.
- **Routes:**
  - `/welcome`, `/sign-in`, `/create-account`, `/create-account?code=K7M2QX`, `/forgot-password`
  - `/verify?email=reader@example.test`, `/verify`
  - `/join/K7M2QX`, `/join/ABC`, `/c/sample-slug`
- **Measured on every render:**
  - horizontal and page scroll;
  - heading line counts;
  - the smallest visible text in the page's own pixels;
  - the hit height and width of every control, by `elementFromPoint` out from its centre, screen by screen on stacked pages;
  - affordances that wrap;
  - anything left below full opacity;
  - the family chips;
  - the lockup's rectangle and its clearance from the book;
  - console errors.

**Resize.**
- I loaded at one size, resized to another, and compared against a fresh load at the new size.
  - The 4 resizes from round 4: 1600→2560, 2560→1366, front door 2560→3840, 1920→2560×1440.
  - 8 more: 3840→1600, 1366→3840 (Create account), front door 3840→1366, front door 1600→2560, Verify 1920×1080→2560×1600, Join 2560→1920, 1366→800 (into the stacked layout) and 800→2560 (out of it).
  - The fit and zoom were sampled at 30, 80, 130, 200, 300, 500 and 1000 ms after each resize.
- Two drags: 31 sizes 16 ms apart, from 1500×950 to 2700×1550, on Sign in and the front door.
- A per-frame recording (`requestAnimationFrame`) of the fit, the zoom and the book's edges through five resizes.

**First loads at 3840×2000: 60.**
- 36 across six routes, mixing ritual played and skipped, and with and without reduced motion.
- 24 more on `/welcome` and `/create-account`, the two that failed in round 4.

**Bond.**
- **Slow-line runs: 28.** A sampler in the page recorded his box's opacity (through every ancestor), each pose's opacity and whether it had pixels, on every frame.
  - The poses were delayed on the wire by 1 s, 1.5 s, 2.5 s or 3 s, by pose or all together.
  - The runs covered: cold with the ritual played and skipped, warm (same context, cached), reduced motion, 390 touch, 2560, the front door, Verify, Join and Create account.
  - Three runs typed "abcdef" into the password and pressed Show while `cover` and `peek` were still on the wire.
- **The pose fetch.** On every route at 1920 and 390, I recorded every `/dog/*.webp` request, the `<img>`s mounted and the `srcset` file chosen.
- **Remounts.** A MutationObserver logged each pose `<img>` added to or removed from the page.
- **Join's success.** It needs a session, so I mounted `Companion.tsx` alone through Vite with Join's props (`poses={["curious","watch"]}`). I switched `rest` from `curious` to `watch` twice: once while `watch` was still delayed on the wire, and once after it had arrived.

**GSAP.** I patched `gsap.context` and `gsap.quickTo` on `window.__gsap` the moment it is set, to count them.
- The route: front door → Sign in, 20 pointer moves, 17 characters into the email, the password focused, then off to Forgot password with the prints still moving.
- Afterwards I inspected the old prints and head: `getTweensOf`, the global timeline and the inline transforms.

**View transitions.**
- I wrapped `document.startViewTransition` and listed every `::view-transition-*` animation (name, duration, delay) and every hidden snapshot. The page changes:
  - Sign in → Create account, Sign in → the front door (the lockup) and the front door → Sign in, with and without reduced motion;
  - a transition on the 404 and the shared wall (neither is `.auth` nor `.door`), plain and then with the signed-in shell's `top`, `cloth`, `sheet-page` and `tabbar` layers injected, both ways.
- I paused the turn back to the door at 0, 40, 80, 110, 125, 140, 160, 200, 260, 340 and 460 ms, then measured and shot it.

**Mechanical scans.**
- `impeccable detect`: 0 anti-patterns and 59 advisories, as in round 4.
- taste `lint.mjs`: 2 FAIL and 8 WARN, as in round 4.
  - The 2 FAIL are Contribute's running head, accepted since round 1.
  - The 8 WARN are outline buttons and the kind toggle, which are interface and fine.

### What holds

**Gap 1 (round 4's blocker) is fixed.** `useFit` now takes the zoom from `zoomFor(innerWidth, innerHeight)` and also refits on `astory:zoom`.

| Resize | After the resize | A fresh load |
| --- | --- | --- |
| Sign in, 1600×1000 → 2560×1300 | fit 1.1875, 2223 px | the same |
| Sign in, 2560×1300 → 1366×768 | fit 0.9000, 1296 px | the same |
| Front door, 2560 → 3840×2000 | fit 1.1590, 3616 px | the same |
| Sign in, 1920 → 2560×1440 | fit 1.1679, 2422 px | the same |

- The 8 other resizes and both drags also match the fresh load in fit, zoom, width and left edge.
- No resize ends in a scroll.
- All 60 first loads at 3840×2000 land on one fit per route: 1.1590 on the front door and 1.1875 on every book page. None overflows.
- The `astory:zoom` event fires only when the zoom actually changes (`apply()` returns early otherwise).

**Fit at a fixed size.**
- No horizontal scroll in any of the 180 renders.
- No book-layout render scrolls.
- 1366×641 keeps the spread.

**Headlines, type and targets.**
- **Headlines:** two lines or fewer everywhere.
- **Type:** nothing under 13 px, except the sample cover's printed date at 12 px on a phone (rule 22).
- **Targets:** every control's real hit is 44 px or more at every size. The one flag ("Read this page wraps") is a false positive: its play icon sits on its own line box at the same height (`shots/signed-out-r5-skills-1366x768-read-this-page.jpg`).
- **Console:** no errors.
- **Opacity:** nothing is left below full opacity.

**Round 4 gap 2 is fixed: each page fetches only the poses it draws.**

| Page | Mounted and fetched (all 420w) |
| --- | --- |
| Front door | watch |
| Sign in, Forgot password | watch, cover, peek |
| Create account (both) | curious, cover, peek |
| Verify (both) | sleep |
| Join (both) | curious, watch |
| Contribute's fallback | curious |

Verify, Join and Contribute no longer download `cover` and `peek`. That is 135 KB saved on each.

**Bond never blanks on Sign in.**
- In the three runs with `cover` and `peek` on the wire while the password was focused and Show pressed:
  - his lowest coverage was 0.56, the midpoint of a crossfade;
  - he was blank for 0 ms.
- **Round 4 gap 4, the first picture on a cold, slow line, now fades in** on Sign in, Forgot password, Verify, Contribute's fallback and the front door:
  - the first drawn frame is at opacity 0.31 (the 220 ms ease-out's first step);
  - he is at full opacity 115–120 ms later;
  - under reduced motion it is the 150 ms linear fade, 0.11 a frame.
- This holds cold at 1 s and 2.5 s, warm, at 390 and at 2560, and with the ritual played and skipped. Create account and Join are the exception (gap 1).

**GSAP cleanup holds.**
- The prints' and head's `quickTo`s: 16 before the pointer moved, 16 after 20 moves, and 16 after typing.
- On leaving:
  - `getTweensOf(oldPrints)` and `getTweensOf(oldHead)` are 0;
  - no tween on the global timeline targets the old prints, head, dog or board;
  - the old prints carry no inline transform.
- 8 contexts were made and 6 reverted. The 2 not reverted belong to the page still open.
- The same holds after the ritual has played.

**Reduced motion and the view transitions.**
- **Signed-in pages under reduced motion still get `animation: none`.**
  - With no `.auth` or `.door` in the page (the 404 and `/p/`), a view transition makes 0 animations under reduced motion. It makes 3 at normal motion.
  - With the shell's `top`, `cloth`, `sheet-page` and `tabbar` layers injected: 0 under reduced motion, 10 at normal motion (the 560 ms cloth and sheet groups, `vt-settle`, `vt-rise` and the rest).
  - So the scoped rule still reaches every signed-in layer.
  - No signed-in → signed-out link uses a view transition: sign-out uses a plain `navigate`, and the shared wall's links are plain. So no signed-in layer can be left animating under reduced motion on the way out.
- **Signed-out pages under reduced motion get their 150 ms crossfade:**
  - **Book → book:** the old `auth-book`, `auth-title`, `auth-plate` and `auth-line` are hidden. The book has no animation, the new words take 150 ms linear `vt-appear`, and the root crosses in 150 ms.
  - **To or from the front door:** both pages cross in 150 ms of opacity, with no bare frame. Luminance never falls under 112, against 127–139 at rest.
- **The turn back to the door now mirrors the forward one.** The old book fades out in 120 ms, then the bench appears over 320 ms from a 140 ms delay.
  - The double exposure in round 4's BAOS finding 1 is gone: at 40 ms nothing of either page is drawn but the cloth and the lockup (`shots/signed-out-r5-skills-vt-signin-to-door-*.jpg`).
- **The lockup holds still through every turn.** It is one `brand` layer with no animation, and its old snapshot is hidden.

**The lockup is one object.**
- **Same size and place on every page.** At each size the front door and every book page draw it at the same rectangle:
  - 41,29 and 114×36 at 1366×768;
  - 56,34 at 1920;
  - 73,44 and 148×47 at 2560 (zoomed);
  - 16,20 at 390;
  - 25,20 at 820.
- **Clear of the book.** At 1366×641 it is 89×28 at 41,14, 16 px clear of the book on every page (round 4's BAOS finding 4). At every other book size it is 15–62 px clear.

**The front door's families.**
- **800 and 820:** one row of three chips, each with its name and subtitle (166, 167 and 211 px wide).
- **390:** one under another, each as wide as its words.
- **The swatches** now share the families' left edge at 800, 820 and 390. That fixes round 4's gap 5 (`shots/signed-out-r5-skills-390x844-door-picks.jpg`). 1280×1024 is the exception: gap 3.

**The photo-remove button has a hover state** (round 4's gap 6). On hover the disc steps to `--paper-tone` and its border inks to chocolate, inside `(hover: hover) and (pointer: fine)`. It now has a press state too. This was checked in code, because an upload needs the server. See gap 5 for the press.

### Not verified

- Edge itself. Only Chromium was used.
- A real browser zoom (Ctrl −/+). The resizes stand in for it.
- Join's real signed-in success. It was checked through the harness above, with Join's own props, not through the page.
- Create account step 2 and the empty submits. Neither changed this round. The sweep shows no regression on their routes at rest.
- Screen-reader output and contrast. The tokens have not changed since round 2.

---

## Round 4, gap by gap

| # | Round 4 gap | Now |
| --- | --- | --- |
| 1 | The fit goes stale after a resize across the zoom step (blocker) | **Fixed.** 12 resizes and 2 drags match a fresh load. 60 of 60 first loads at 3840 are right. |
| 2 | Pages without a password field fetch the password poses | **Fixed.** |
| 3 | A change of rest pose unmounts the held pose (Join) | **Half fixed.** `held` is now added to `can`, but a second filter still drops it while the new rest pose is on the wire: gap 2. |
| 4 | Bond's first picture pops in on a cold, slow line | **Fixed on five pages, open on two.** On Create account and Join the rest pose's `<img>` is re-created when the other poses mount, so it pops on every visit: gap 1. |
| 5 | The front door's swatches hang alone at 800 and 820 | **Fixed.** |
| 6 | The photo-remove button has no hover state | **Fixed.** Its new press state has no transition: gap 5. |

Round 4's BAOS findings 1 to 5 were all addressed this round. Each fix I could check holds, as described above. The lockup's edge on stacked pages (gap 4) and the 5:4 edge case (gap 3) are new.

---

## Gaps

### Polish

**1. On Create account and Join, Bond pops in on every visit: his rest pose is torn down and rebuilt.**
- **Skills and rules:**
  - emil-design-eng: "nothing in the real world appears from nothing"; "unseen details compound".
  - BAOS 25.
  - It finishes round 4's gap 4.
- **Where:** `src/components/delight/Companion.tsx:181-202`. Each pose maps to an unkeyed array, `[<img key={p.name}>, blink | null]`.
  - React keys those inner arrays by their position in the outer list, not by pose.
  - When `more` turns true, the list grows. On Create account it goes from `[curious]` to `[cover, peek, curious]`; on Join, from `[curious]` to `[watch, curious]`.
  - So the slot that held `curious` now holds another pose. React removes the `curious` `<img>` and builds a new one, which already carries `data-mood="curious"`. A new element has no "before" style to transition from, so it is drawn at opacity 1 at once.
  - On Sign in, Forgot password and the front door the rest pose is first in `POSES`, so it keeps its slot. That is why those pages fade.
- **Measured:**
  - The MutationObserver shows `curious` removed and re-added at the same moment that `cover` and `peek` are added (Create account) or `watch` is added (Join).
  - Create account went 0 → 1.00 in one frame in all 5 runs:
    - a normal line (at 369 ms);
    - warm (369 ms);
    - 1 s;
    - 2.5 s with the ritual;
    - 1 s under reduced motion.
  - Join did the same in 3 runs (1 s, 2.5 s with the ritual, 1 s reduced). In the other 2 the lazy page mounted with him already at 1.
  - Sign in, run alongside as the control: 0.31 in the first frame, then full 117 ms later.
  - With the ritual on a normal line, the box is still at opacity 0 when this happens, so it can't be seen there. Every later visit (arriving from Sign in) shows it.
- **Change:** give the list flat, keyed children:

  ```tsx
  {POSES.filter(…).flatMap((p) => [<img key={p.name} … />, p.blink ? <img key={`${p.name}-blink`} … /> : null])}
  ```

  `<Fragment key={p.name}>` around the pair also works. Then re-run the Create account and Join cold and warm runs: the first frame should read about 0.31 and full about 120 ms later, as on Sign in.

**2. Join's success still blanks Bond while `watch` is on the wire.**
- **Skills and rules:** BAOS 25, and emil-design-eng ("handle edge cases invisibly"). This finishes round 4's gap 3.
- **Where:**
  - `Companion.tsx:98` now adds `held` to `can`, which was the intent.
  - But `:101` sets `more = loaded.has(rest)`, and `:181` keeps only `p.name === rest` while `more` is false.
  - When the join succeeds, `rest` becomes `watch`. If `watch` hasn't loaded, `more` is false, so `curious` (the pose being held, and the only one with pixels) is filtered out.
  - `data-mood` stays `curious`, with no `curious` `<img>` to show.
- **Measured** (Companion mounted alone with Join's props, `rest` switched at 0.6 s):
  - With `watch` delayed 3 s, the mounted list goes `[watch?, curious]` → `[watch?]`. Bond is blank for **2418 ms**, until `watch` lands.
  - With `watch` already loaded there is no blank.
  - On a normal line `watch` starts loading as soon as `curious` has arrived, so it is usually there before the join returns. The blank needs a slow line or a quick join.
- **Change:** keep the held pose through the filter: `const more = loaded.has(rest) || loaded.has(held);`, or `(more || p.name === rest || p.name === held)`. Gap 1's keys keep it from being rebuilt as the list changes.

**3. At exactly 5:4 (1280×1024) the stacked front door hides the families' subtitles.**
- **Skills and rules:** hallmark responsive (breakpoints follow the content), and BAOS rules 9 and 39, the reason round 4's BAOS finding 5 gave for showing the subtitles.
- **Where:** `src/styles/pages/signed-out.css:519`, `@media (min-width: 1181px) and (max-width: 1599px) and (min-aspect-ratio: 5/4)`.
  - `min-aspect-ratio` includes 5/4 exactly.
  - The stacked layout (`bookFit.ts` STACKED and `signed-out.css:616`) also includes it, through `max-aspect-ratio: 5/4`.
  - So a 1280×1024 window, a common office monitor, gets the stacked door with the names only.
- **Measured:**
  - 1280×1024: stacked, chips 166, 160 and 157 px, no subtitles.
  - 1200×1000 (stacked): the subtitles are shown.
  - Shot: `shots/signed-out-r5-skills-1280x1024-door-picks.jpg`.
- **Change:** make the rule the exact complement of STACKED, for example `@media (min-width: 1181px) and (max-width: 1599px) and (min-aspect-ratio: 5001/4000)`. Or move the subtitle hiding to `.door[data-layout="book"]` so it follows the layout itself.

**4. On stacked pages the lockup sits off the column's left edge.**
- **Skills and rules:**
  - taste-skill layout §3 and critique pass 4 (text blocks share two or three left edges);
  - BAOS 23a ("the bar holds"), the reason for this round's one lockup.
- **Where:** `signed-out.css:92`, `left: clamp(16px, 3vw, 56px)`, which is not reset in the stacked block (`:616`).
- **Measured** (the lockup's left against the book's or leaf's left, the same on the front door and every book page):

  | Width | Lockup | Column |
  | --- | --- | --- |
  | 800 | 24 | 40 |
  | 820 | 25 | 50 |
  | 1280×1024 | 38 | 280 |
  | 390 | 16 | 10 |

  At 820 the mark hangs 25 px left of the page under it (`shots/signed-out-r5-skills-820x1180-signin-top.jpg`). On the desktop spread the corner placement is deliberate, so this is only the stacked range.
- **Change:** in the stacked block, set `.auth.ritual .brand, .door .door-top .brand { left: max(16px, calc((100% - 720px) / 2)); }` so it starts on the 720 px column, and leave the phone at 16 px.

**5. The photo-remove press snaps and squeezes too far.**
- **Skills and rules:** emil-design-eng:
  - "Buttons must feel responsive": a 100–160 ms transform transition;
  - "the scale should be subtle (0.95–0.98)";
  - hover and colour changes eased.
- **Where:** `signed-out.css:410-411`. `.cb-thumb .x::before` has no `transition`, so the new hover fill and border snap. `:active::before { transform: scale(0.94) }` jumps 6% in one frame.
- **Checked:** in code; an upload needs the server.
- **Change:**
  - add `.cb-thumb .x::before { transition: transform 120ms var(--ease-out), background-color 160ms var(--ease-out), border-color 160ms var(--ease-out); }`;
  - use `scale(0.96)`.

### Notes for the lead (not counted)

- **Shrinking across the zoom step shows the old book for 4–5 frames.** For 60–95 ms after the resize event, before the 40 ms and 60 ms timers fire, the book is drawn at its old size. That includes one or two frames at the new fit under the old zoom (3840→1600: at 62 ms, fit 1.0556 at zoom 2, right edge at 3120 in a 1600 window). It always settles to the fresh-load geometry. Growing has no such frames. Running the zoom and the fit in one handler, with the zoom set first, would remove the mixed frames.
- **Both turns between the door and the book pass through bare cloth.** The cloth goes flat brown with only the lockup for about 100 ms (luminance 52–55 from 40 to 140 ms), because the linen weave is part of the root snapshot. The forward turn has done this since round 4, which BAOS accepted, and the backward turn now matches it. The call is the lead's (`shots/signed-out-r5-skills-vt-signin-to-door-125ms.jpg`).
- **`DESIGN.md` and the code disagree on reduced motion.** DESIGN.md says reduced motion "collapses to a 150 ms crossfade", but signed-in pages get no animation at all, as this brief asks. The doc needs the lead's ruling. The code does what was asked.

### Motion and interaction, in Emil's format

| Before | After | Why |
| --- | --- | --- |
| Each pose is an unkeyed `[img, blink]` pair, so a growing list rebuilds the rest pose | A flat list keyed by pose (`flatMap`, or a keyed Fragment) | A rebuilt `<img>` has no "before" style, so it pops at full opacity instead of the 220 ms fade (gap 1) |
| `more = loaded.has(rest)`; the filter keeps only `rest` until it loads | `more = loaded.has(rest) \|\| loaded.has(held)` | The held pose is filtered out exactly while the new one is on the wire (gap 2) |
| `.x:active::before { transform: scale(0.94) }`, with no transition | `transition: transform 120ms var(--ease-out), background-color 160ms, border-color 160ms`, and `scale(0.96)` | Press feedback is subtle and eased; the hover fill shouldn't snap (gap 5) |

### Scores (taste-skill critique; hallmark self-critique)

```
ROUND 5
Seen in one second: the family book open on the cloth, Bond with his paws on the bookplate.
Idea: the sign-in is the title page of the family's own book (the Ex Libris plate is the form). It passes the competitor test.
Live thing: Bond watching, covering his eyes and peeking; on the front door, the sample book in three families and seven covers.
Layout words: door=bench+leaf / sign-in=spread+plate / join=card+plate / contribute=person+leaf
Scores: design 8.5 · usability 8.5 · creativity 9 · content 8 → overall 8.6
Caps applied: none. The round 4 resize cap is lifted: the book holds through every resize and first load measured.
Top three: gap 1 (Bond pops in on Create account and Join), gap 2 (Join's success can still blank him on a slow line), gap 4 (the lockup off the column on stacked pages).
Hallmark reading: P5 H4 E4 S5 R4 V4. E stays at 4 for gaps 1 and 2. Every mechanical floor measured passes.
```
