# Signed-out pages, round 4: skills review

**Verdict: GAPS.** 6 gaps: 1 blocker, 0 ugly, 5 polish. All 8 of round 3's gaps are fixed. The blocker is new this round: it only shows when the window changes size, and round 3 never resized a window.

**The brief's question: does Bond ever blank? No, not once his first picture is in.**
- I delayed `cover` and `peek` on the wire by 1.5 s, 2.5 s and 3 s, at 1366, 2560, 390 and 820, with and without reduced motion.
- He holds his last loaded pose until the new one arrives, then crossfades.
- In 12 runs his lowest coverage during a pose change was 0.75 desktop, 0.51 phone (the midpoint of the crossfade), with 0 ms of blank.
- The screen samples (his fur pixels, every ~35 ms) agree with that.
- What is left is the very first picture on a cold, slow line: it pops in without a fade (gap 4). One case was not measurable, Join's success state (gap 3).

**Scope.**
- `src/pages/auth/*`: AuthFrame, bookFit, PlateSay, useCodeAria, SignIn, CreateAccount, ForgotPassword, Verify, Welcome.
- `src/pages/Join.tsx` and `src/pages/Contribute.tsx`.
- `src/components/delight/{Companion,ClothStamp,Prints}.tsx`.
- `src/styles/pages/signed-out.css`, plus `src/lib/zoom.ts`, which the fit depends on.

**Skills loaded.**
- taste-skill: SKILL, layout, type, critique.
- hallmark: SKILL, anti-patterns, slop-test, interaction-and-states, responsive.
- emil-design-eng.
- impeccable: SKILL, craft-floor, polish, layout, critique.
- gsap-react, gsap-performance, gsap-core (matchMedia), gsap-timeline. gsap-scrolltrigger has nothing to check: these pages use no ScrollTrigger.
- `docs/BAOS-STANDARD.md` (rule 27's new lead ruling on Bond's head is checked below) and `DESIGN.md`.

No other installed skill applies.

## How it was checked

**Headless renders: 176.** Playwright 1.63 with chromium-1243, against `http://localhost:5180`, with no session.
- **Sizes:** 1366×768, 1366×641, 1920×1000, 2560×1300 (html zoom 1.3), 800×1024, 390×844 (touch, DPR 3), 820×1180 (touch, DPR 2), and 3840×2000 (html zoom 2, added for the founder's display). Each was run with and without `reducedMotion: 'reduce'`.
- **Routes:**
  - `/welcome`, `/sign-in`, `/create-account`, `/create-account?code=K7M2QX`, `/forgot-password`
  - `/verify?email=reader@example.test`, `/verify`
  - `/join/K7M2QX`, `/join/ABC`
  - `/c/sample-slug`, once as the server returned it and once with the read-only `get_contribute_info` lookup stubbed as "Margaret Hale"

**Network guard.** Every other non-GET request to Supabase was aborted and logged. None was attempted in any run.

**Measured on every render:**
- horizontal and page scroll, the fit, the layout and the canvas rectangle
- the plate's spare room above the page's foot
- headline line counts and affordances that wrap
- text under 12.5 px (the printed sample book excepted, BAOS 22)
- the real hit height of every control, probed with `elementFromPoint` on every screen of a stacked page
- anything left below full opacity after arrival
- Bond's mood, the poses mounted, which loaded, and the `srcset` file chosen
- console errors

**Probes (fake values only):**
- **Bond on a slow line.** 13 runs, using the page's own DOM sampler at 20 ms plus screen samples of his box:
  - `cover` and `peek` delayed 1.5 s and 3 s, with the password focused at 0.2 s and Show pressed while the delayed picture was still on the wire
  - only `peek` delayed, then Show and Hide
  - every pose delayed, with focus, and once through the ritual
  - Create account's step 2 (it focuses the password itself)
- **Rule 27.** On each page I measured every pose's nose position and size (from the nose blobs in ART), the head's largest turn with the pointer at both window edges, and the box's foot against the plate's rule.
- **Resize.** I loaded at one size and resized to another across the html-zoom step (1600→2560, 2560→1366, 2560→3840, 1920→2560), then compared against a fresh load at the new size.
- **GSAP.** I patched the page's own `gsap.quickTo` and `gsap.context` to count them. I went from the front door to Sign in, moved the pointer 20 times, typed 17 characters and focused the password, then left for Forgot password with the prints moving. Then I inspected the old prints and head.
- **Create account, step 2.** "Test Reader" and `reader@example.test`, with the code field open:
  - a password error, then the code error "AB"
  - a two-line server-length message set into the plate's line in place, with nothing sent
  - at 1366×768, 1366×641, 1920×1000 and 2560×1300
- **Empty submits.** On Sign in, Verify, Join (bad code) and Forgot password, I measured the book's width, the spare room, the line count and the ARIA.
- **The stamp.** A press on the cloth on Sign in and the front door, with and without reduced motion, read at 50, 1500, 3100 and 3400 ms.
- **Tab** at 0.25 s into the ritual, at 1366 and at 390.
- **The front door.** The control row's centres, and which poses are mounted and fetched.
- **The endpaper.** Caption, rule and sentence clearance on four pages at seven sizes.

**Mechanical scans:**
- `impeccable detect`: 0 blocking findings and 59 advisories (60 in round 3).
- taste `lint.mjs`: 2 FAIL and 8 WARN (2 FAIL and 10 WARN in round 3).
  - The 2 FAIL are Contribute's running head, accepted since round 1.
  - The 8 WARN are outline buttons and the kind toggle, which are interface and fine.

### What holds

**Fit at a fixed size.**
- No horizontal scroll in any of the 176 renders, and no desktop render scrolls.
- 1366×641 keeps the spread: the book's fit is 0.78 and the bench's 0.75.
- An error never changes the book's size. Book widths stay at 1296, 1122, 1710 and 2223 px through every empty submit.

**Headlines and type.**
- Two lines or fewer everywhere.
- Nothing under 12.5 px.
- The family chips on the front door at 1920 and up are a name over a subtitle by design.

**Targets.** Every control's real hit height is 44 px or more at every size: 58 px at 2560 and 88 px at 3840.
- The probe flagged low hits at 800 and 390. Re-probed centred, each is 44–52 px: those controls were cut off at the viewport's edge mid-scroll.
- The Create account name line probes at 43 px at 820, which is within rounding.

**States and ARIA.**
- Every error sets `aria-invalid` on its field (all six digits on Verify) with `aria-describedby="plate-say"`.
- There is one live region per page and one `role=alert` while an error stands.

**Rule 27 holds.** On every page and size measured:
- Each pose's nose lands within 0.2 px in x and y, at the same size, as the others on that page.
- The head turns 1.50° at most.
- The box's foot is within 1 px of the plate's printed rule.
- He holds still on touch.

**Motion.**
- Tab at 0.25 s ends the ritual: the board is gone, the stage is open, and Bond and the prints are at full opacity.
- Nothing is left hidden (the door's rule is at 0.85 by design).
- There are no console errors.

**Gap 2 is fixed.** Every local error on step 2 is one line ("Check the code: it has six."). The plate's foot keeps:

| With the code field open | 1366×768 | 1366×641 | 1920×1000 | 2560×1300 |
| --- | --- | --- | --- | --- |
| No error | 25 px | 23 px | 45 px | 58 px |
| A two-line server-length error | 5 px | 8 px | 31 px | 41 px |

The plate's foot stays on the page in every case (shot: `shots/signed-out-r4-skills-1366x641-create-step2-2line.jpg`).

**Gap 3 is fixed.** On the phone endpaper the sentence follows the album in flow. "Rain on the porch, 1961" now ends 47 px above the brass rule on all four pages, and there is no overlap at any of the seven sizes (`shots/signed-out-r4-skills-390-endpaper.jpg`).

**Gap 4 is fixed.** On leaving with the prints moving:
- `gsap.getTweensOf(oldPrints)` returns 0.
- No old print tween is left on the timeline.
- The inline transforms are reverted.
- The head has 0 tweens.
- Typing and pointer moves made no new `quickTo` (16 before and 16 after).
- Each mount reverts its own context: 6 reverts for 8 contexts made, and the 2 not yet reverted belong to the page still open.

**Gap 5 is fixed.**
- `sizes` now picks the 420w file at every size, which is 52–72 KB. Bond is drawn 87–343 px wide, so 420w is never upscaled.
- The front door mounts and fetches `watch` only.

**Gap 6 is fixed.**
- Without reduced motion, the stamp fades to 0 at 3.1 s and is removed by 3.4 s.
- Under reduced motion, no stamp is made on either page.
- The two rule sets are now one.

**Gap 7 is fixed.** No interface `rgba()` is left outside the token block. The 24 that remain are all on "book material" lines.

**Gap 8 is fixed.** The two foil frames no longer count as WARN.

### Not verified

- Edge (only Chromium was used).
- A real browser zoom (Ctrl −/+). The resize test stands in for it, because a browser zoom changes `innerWidth` and fires the same `resize`.
- The view-transition crossfades. They were checked in code, not filmed.
- Join's signed-in states (including gap 3) and Forgot password's second step. Both need a server call.
- Screen-reader output.
- Contrast. The tokens are unchanged since round 2, and this round did not measure it again.

---

## Round 3, gap by gap

| # | Round 3 gap | Now |
| --- | --- | --- |
| 1 | Bond blanks while a pose loads | **Fixed** (measured: 0 ms blank in 12 runs). A cold first load still pops: gap 4. |
| 2 | Plate's foot runs off with a two-line error | **Fixed.** 5 px spare at 1366×768 and 8 px at 1366×641 with a two-line message. |
| 3 | Caption, rule and sentence collide on the phone endpaper | **Fixed.** 47 px clear. |
| 4 | Prints' `quickTo` outlive the page | **Fixed.** `gsap.context` and revert; 0 tweens after leaving. |
| 5 | `sizes` overstates the slot; the door mounts five poses | **Fixed** on both counts. The same idea is not yet carried to Verify, Join and Contribute: gap 2. |
| 6 | Reduced-motion stamp pops and the rules are duplicated | **Fixed.** |
| 7 | 22 interface `rgba()` | **Fixed.** |
| 8 | Foil frames unmarked for the lint | **Fixed.** |

---

## Gaps

### Blocker

**1. The book's fit goes stale after a resize that changes the html zoom.**
- **Skills and rules:** impeccable polish ("verify every supported viewport … zoom") and adapt; hallmark responsive (the ratio holds at every viewport). Also BAOS rule 12 ("The ratio must hold at every size and zoom") and rule 5 (the founder uses Edge on a large display, sometimes zoomed out).
- **Where:**
  - `src/pages/auth/bookFit.ts:300` reads the zoom from `getComputedStyle(document.documentElement).zoom`.
  - `bookFit.ts:310-314` recomputes 40 ms after a `resize`.
  - `src/lib/zoom.ts:40-43` applies the new html zoom 60 ms after the same `resize`.
  - So the fit is computed against the old zoom, and setting the zoom fires no event that would correct it.
- **What happens (measured, then compared against a fresh load at the new size):**

  | Page and resize | After the resize | A fresh load |
  | --- | --- | --- |
  | Sign in, 1600×1000 → 2560×1300 | fit 1.572; the book is 2943 px wide in a 2560 window and runs 446 px off the right and 295 px off the foot | fit 1.1875, 2223 px |
  | Sign in, 2560×1300 → 1366×768 | fit 0.654; the book is 941 px wide in the middle of the window | 1296 px |
  | Front door, 2560 → 3840 | the bench is 5684 px wide in a 3840 window | — |
  | Sign in, 1920 → 2560×1440 | fit 1.711 | 1.168 |

  - It also happened on first load in 2 of the 22 renders at 3840×2000: `rm-welcome` at fit 2.39 and `rm-create` at fit 2.58, with the canvas about 7450 px wide.
  - The page doesn't scroll, so the form's right half and the plate's foot are simply cut off until the next resize or a reload.
  - The screenshot is `shots/signed-out-r4-skills-resize-1600-to-2560.jpg`.
  - On a large display, a browser zoom (Ctrl −/+), a window snap or a move between monitors all cross the zoom step.
- **Change:**
  - Make the fit independent of timing. Export the zoom's own formula from `lib/zoom.ts` (for example `zoomFor(innerWidth, innerHeight)`) and use it in `useFit` instead of reading the computed style. The two then always agree.
  - Also, after `apply()` sets a new zoom, dispatch an event (`window.dispatchEvent(new Event("astory:zoom"))`) that `useFit` listens to, so any other reader of `--zoom` refreshes too.
  - Re-test the four resizes above and a first load at 3840×2000, 20 times.

### Polish

**2. Pages without a password field fetch the password poses.**
- **Skills:** impeccable optimize and hallmark responsive (download only what is drawn). This finishes round 3's gap 5.
- **Where:**
  - `src/pages/auth/AuthFrame.tsx:200` passes no `poses`, so `Companion.tsx:90` defaults to `[rest, "cover", "peek"]`.
  - Measured mounted and fetched: Verify (both states), Join (`/join/K7M2QX`, `/join/ABC`) and Contribute's fallback plate.
- **What happens:** none of those pages has a password field, yet each downloads `cover-420` and `peek-420` (135 KB) and never draws them. The brief's "mounts only a page's poses" is true only on the front door.
- **Change:** give AuthFrame a `poses` prop and pass it through. Verify passes `["sleep"]`, Join `["curious", "watch"]`, and Contribute's plate `["curious"]`. Sign in, Create account and Forgot password keep the default.

**3. A change of rest pose unmounts the pose being held.**
- **Skills and rules:** BAOS 25 and emil-design-eng (edge cases handled invisibly). It is the same class as round 3's gap 1.
- **Where:** `Companion.tsx:90` (`can` is derived from the current `rest`), `:178` (the filter), and `Join.tsx:293` (rest goes from `curious` to `watch` when the join succeeds).
- **What happens (from the code; not measurable without a session):**
  - On "You're in.", `rest` becomes `watch`.
  - `held` is still `curious`, so `mood` stays `curious` until `watch` loads.
  - But `curious` is no longer in `can`, so its `<img>` is removed.
  - Bond is gone for as long as `watch` takes to arrive, at the page's happiest moment.
- **Change:** keep the held pose mounted, for example `const can = [...new Set([...(poses ?? [rest, "cover", "peek"]), held])]`. Or have Join pass both rest poses (gap 2 already does).

**4. On a cold, slow line Bond's first picture pops in.**
- **Skills:** emil-design-eng ("nothing appears from nothing", never pop) and BAOS 25.
- **Where:**
  - `Companion.tsx:95` sets `mood` to `wanted` when nothing has loaded, so `data-mood` already selects an `<img>` with no pixels.
  - `AuthFrame.tsx:149` fades the dog's box in at 1.55 s whether or not his picture is there.
- **What happens (measured, every pose delayed 2.5 s, ritual left to play):**
  - The box fades in empty at 1.55 s.
  - Then `watch` appears at full opacity in a single frame at about 2.5 s: fur share goes 0.018 → 0.226 between two 33 ms samples.
  - With the ritual skipped, the same pop happens at about 1.5 s.
  - The screenshot is `shots/signed-out-r4-skills-1366-bond-cold.jpg`.
- **Change:** set `data-mood` only once that pose has loaded (`data-mood={loaded.has(mood) ? mood : undefined}`). The `<img>` then stays at opacity 0 and the existing 220 ms transition fades it in when it arrives.

**5. At 800 and 820 the front door's cover swatches hang alone at the right.**
- **Skills and rules:** taste-skill layout §3 (shared edges) and BAOS rule 10 (no orphans).
- **Where:** `signed-out.css:503`, where `.door-picks > .bk-swatches { align-self: flex-end }` is not reset in the stacked block (§7, `:645`).
- **What happens:** at 800×1024 the three family rows run full width on the left edge. Under them, "Cover colour · Cream" and the seven swatches sit flush right with an empty band to their left (`shots/signed-out-r4-skills-800-welcome.jpg`). At 390 they fill the row, so the phone is fine.
- **Change:** in §7, add `.door-picks > .bk-swatches { align-self: flex-start; }` (or `center`) so they share the families' left edge.

**6. The photo-remove button has no hover state.**
- **Skill:** hallmark's 8 states and the impeccable states checklist.
- **Where:** `signed-out.css:396`, where `.cb-thumb .x:hover::before { background: var(--card-ivory) }` is the same as its rest at `:395`.
- **What happens:** hovering the round × on an added photograph changes nothing. It was checked in code, because an upload needs the server.
- **Change:** on hover, ink the disc's border (`border-color: var(--chocolate)`) or step its fill to `var(--paper-tone)`, inside `@media (hover: hover)`.

### Motion and interaction, in Emil's format

| Before | After | Why |
| --- | --- | --- |
| `useFit` reads the html zoom 40 ms after `resize`; `zoom.ts` sets it at 60 ms | The fit computes the zoom from the same formula (or listens for an `astory:zoom` event) | The book is fitted to the old zoom and overflows or shrinks until the next resize (gap 1) |
| `data-mood` selects a pose before any picture has arrived | `data-mood` only for a loaded pose; the 220 ms fade brings it in | On a cold line the first picture pops in at full opacity (gap 4) |
| A new `rest` drops the held pose's `<img>` | The held pose stays mounted until the new one has loaded | Holding a pose that is no longer in the page is a blank (gap 3) |

### Scores (taste-skill critique; hallmark self-critique)

```
ROUND 4
Seen in one second: the family book open on the cloth, Bond with his paws on the bookplate.
Idea: the sign-in is the title page of the family's own book (the Ex Libris plate is the form). It passes the competitor test.
Live thing: Bond watching, covering his eyes and peeking (now without a blank on a slow line); on the front door, the sample book in three families and seven covers.
Layout words: door=bench+leaf / sign-in=spread+plate / join=card+plate / contribute=person+leaf
Scores: design 8.5 · usability 8 · creativity 9 · content 8 → overall 8.4
Caps applied: none at a fixed window size. After a resize across the zoom step the book is clipped off-screen, which would cap usability at 5 until gap 1 is fixed.
Top three: gap 1 (the fit goes stale after a resize or browser zoom), gap 2 (the password poses are fetched on pages without a password field), gap 3 (Join's success drops the pose Bond is holding).
Hallmark reading: P5 H4 E4 S5 R4 V4. E stays at 4 for gap 1 alone; every floor measured at a fixed size passes.
```
