# Signed-out pages, round 2: skills review

**Verdict: GAPS.** 17 gaps: 0 blockers, 4 ugly, 13 polish. Of round 1's 21 gaps, 16 are fixed and 5 are only partly fixed. Those 5 are carried into the list below.

**Scope.**
- `src/pages/auth/*`: AuthFrame, bookFit, PlateSay (new), SignIn, CreateAccount, ForgotPassword, Verify, Welcome.
- `src/pages/Join.tsx` and `src/pages/Contribute.tsx`.
- `src/components/delight/{Companion,Prints,ClothStamp}.tsx`.
- `src/styles/pages/signed-out.css`, plus the rules in `src/styles/astory.css` that it sits on.

**Skills loaded.**
- taste-skill: SKILL, layout, type, critique.
- hallmark: SKILL, slop-test, interaction-and-states, responsive.
- emil-design-eng.
- impeccable: SKILL, craft-floor, polish, layout, critique.
- gsap-react, gsap-performance, gsap-core (matchMedia), gsap-timeline. gsap-scrolltrigger has nothing to check: these pages use no ScrollTrigger.
- `docs/BAOS-STANDARD.md` and `DESIGN.md`. DESIGN.md now carries the book-material exemption and declares Caveat.

No other installed skill applies.

## How it was checked

**Headless renders: 132.** Playwright 1.63 with chromium-1243, against `http://localhost:5180`.
- **Sizes:** 1366×768, 1366×641, 1920×1000, 2560×1300 (html zoom 1.3), 390×844 and 820×1180. Each was run with and without `reducedMotion: 'reduce'`. The two narrow sizes were run as touch.
- **Routes:**
  - `/welcome`, `/sign-in`, `/create-account`, `/create-account?code=K7M2QX`, `/forgot-password`
  - `/verify?email=reader@example.test`, `/verify`
  - `/join/K7M2QX`, `/join/ABC`
  - `/c/sample-slug`, once as the server returned it and once with the read-only `get_contribute_info` RPC stubbed

**Network guard.** Every non-GET request to Supabase was aborted and logged. None was attempted.

**Measured on every render:**
- horizontal scroll, the fit and the canvas rectangle
- headline line counts and affordances that wrap
- text under 12.5px
- the real hit height of every control, probed with `elementFromPoint` so that overlapping hit areas count
- placeholder and small-print contrast
- anything still hidden after arrival
- console errors

**Behaviour probes (fake values only):**
- GSAP tween counts on Bond's glints, head and lids, while typing 14 characters, across the moods, and after leaving the page.
- Blinks sampled for 12 s on touch and under reduced motion.
- The book's width before and after an empty submit. This was on Sign in, Create account and Verify at 1366, and on Join at 1920. These are caught on the page and send nothing.
- Create account's second step, reached with "Test Reader" and `reader@example.test`. That step change is local only.
- Tab pressed during the opening ritual.
- Pixel columns sampled across the contribute leaf's ruling.

**Mechanical scans:**
- `impeccable detect`: 0 blocking findings and 63 advisories. In round 1 there were 72 advisories and a font finding; the font finding is gone.
- taste `lint.mjs`: 43 FAIL and 9 WARN (see gap 13).

### What holds

**Fit.**
- No horizontal scroll in any of the 132 renders.
- Every desktop book is one screen.
- An error never changes the book's size. Sign in, Create account and Verify stayed at 1296 px wide; Join stayed at 1710.

**Headlines and type.**
- Two lines or fewer everywhere. "Every life holds a / story worth keeping." is two lines at 390.
- Nothing under 12px.
- Placeholders measure 5.62:1. Small print is 5.6 to 7.6:1.

**Motion and states.**
- Nothing is left hidden.
- No console errors.
- Reduced-motion renders match the full-motion ones.
- Welcome's arrival is in `gsap.matchMedia()`.
- The ritual is inside `gsap.context` and reverts: no inline styles are left on the foil.
- The contribute ruling is now one-pixel rules on an even pitch: 31 px at 1366, 40 at 1920, 52 at 2560 and 34 at 390. The first rule sits a full line under the title's rule.

**Bond.**
- He renders in all five poses.
- The glints and lids hide while he sleeps. Verify's arrival blink is never seen.
- Under reduced motion he blinks once and never again (0 lid tweens over 10 s). His moves are instant.

### Not verified

- Edge (only Chromium was used), 3840 wide, and a zoomed-out window.
- The view-transition crossfade under reduced motion. It was checked in code (`signed-out.css:246-250`), not filmed.
- The second step of Forgot password, and Join's signed-in states. Both need a server call.
- Screen-reader output.

---

## Round 1, gap by gap

| # | Round 1 gap | Now |
| --- | --- | --- |
| 1 | Three-line phone headline | **Fixed.** Two lines at 390 (`max-width: 22ch`). |
| 2 | The book shrinks on an error | **Fixed.** `useFit` reads the window only, and `PlateSay` keeps its room. Gap 1 below is the side effect. |
| 3 | Placeholder contrast | **Fixed.** `--placeholder: var(--ink-soft)`, 5.62:1. |
| 4 | View transitions under reduced motion | **Fixed** in code (`:246-250`): no travel, 150 ms of opacity. |
| 5 | Focus on the contribute title and words | **Fixed** (`:333`, `:342`). |
| 6 | Borrowed "Nan" caption on Join | **Fixed.** The caption is gone, and there is one sample note. |
| 7 | Cover date under 12px | **Fixed.** `max(var(--floor), 1.9cqw)`, and 12px on the phone. |
| 8 | Tap targets | **Partly.** `--tap` is used everywhere, but hit areas now overlap. See gap 6. |
| 9 | `aria-invalid` / `aria-describedby` | **Partly.** Done for the fields. Not done for the code digits or the contribute words. See gap 7. |
| 10 | Join's busy link | **Fixed.** A disabled `Button loading`. |
| 11 | Ritual cleanup | **Fixed.** `gsap.context` with `ctx.revert()`. A keyboard press still doesn't skip it: gap 8. |
| 12 | `quickTo` rebuilt per keystroke | **Partly.** Created once, but not cleaned up. See gap 5. |
| 13 | Ungated swatch hover | **Fixed** (`:476-480`). |
| 14 | Stroke draw and `--breath` | **Fixed.** The stroke draw is accepted in the comment, and the breath is a child's opacity. Dead `--breath` CSS is left in astory.css: gap 10. |
| 15 | Endpaper measure on the phone | **Fixed** (`:633`). |
| 16 | Ruled lines at fractional fits | **Fixed** (measured). There is a new double line at the foot: gap 12. |
| 17 | Raw hex | **Partly.** The hex values are lifted into page tokens (`:35-50`). 57 raw `rgba()` values remain. See gap 14. |
| 18 | Book-material exemption | **Partly.** DESIGN.md is done, but the lint still fails 43 lines. See gap 13. |
| 19 | Kicker on the done state | **Fixed.** |
| 20 | The lamp on touch | **Fixed** (`:55`). `body.scrollWidth` is 390. |
| 21 | Hallmark stamp | **Fixed** (`:1-2`). |

---

## Gaps

### Ugly

**1. impeccable craft floor ("Run the real copy at every breakpoint and fix what overflows"), and BAOS rule 11.**
- **Where:**
  - `CreateAccount.tsx:271-289`, the code field on the password step
  - `signed-out.css:94-101`, the plate's dog room and padding
- **What happens:** the book is now a fixed 1440 by 720, so the plate can no longer grow it. At 1366×768, choose "Someone in the family gave me a code" on step 2. The plate's foot then runs about 29 px past the bottom of the page: the plate ends at 757 and the page at 728. The engraved bottom flourishes are cut off by the page edge. An error line on that step would add more.
- **Change:** make step 2 fit inside 720 with the code field open and an error showing.
  - Either: show the code field in place of the checkbox row at the same height, and move the legal line under the plate.
  - Or: on the password step only, reduce `--dogroom` and the plate's bottom padding.

  Re-check it at 1366×768 and 1920×1000.

**2. BAOS rule 17a ("no heavy pill buttons"), taste-skill fullness and edges, and hallmark gate 36.**
- **Where:** `.bk-chapters` (`BookSpread.tsx:393`) on the front door. `signed-out.css` §6 has no rule for it.
- **What happens:**
  - Two solid cream pills, "Where we come from" and "Love & family", render below the reading dots.
  - They sit outside the bench's 1520×660 design box. At 1366 the canvas ends at 688 and the pills sit at 703-740.
  - They are left-aligned under a centred row.
  - At 2560 they stop 5 px from the bottom of the window.

  It is the loudest thing on the bench, and it is not part of the composition.
- **Change:** `.door .bk-chapters { display: none; }`. The dots and "Turn page" already move through the book. Or restyle the pills as the cloth's outline chips inside `.bk-under`, centred, within the 660 box.

**3. BAOS rules 8 and 11, and taste-skill layout ("The phone is a second composition", not the desktop's fallback).**
- **Where:** `bookFit.ts:244`. `STACKED` includes `(max-height: 690px)`, and both canvases share it.
- **What happens:** at 1366×641 (a 1366×768 laptop with Edge's bars), every signed-out page drops to the phone layout:
  - a 720-px column with 323 px of empty cloth on either side
  - 2.2 to 2.5 screens of scroll
  - the album and the sample book below the fold

  For the front door this is needless. The bench would fit at 0.835, the same as 1366×768's 0.845.
- **Change:**
  - **Per-canvas stacking.** The door stacks only on width or a portrait screen, or when the computed fit falls below about 0.7.
  - **The book.** At short heights, trim `.spread-wrap` padding (`:58`, 80/40 down to about 56/24), so the fit is about 0.78 and the spread is kept. The `--floor`, `--ctl` and `--tap` floors already keep the controls legible.

**4. hallmark gate 36 (an interactive row is vertically centred).**
- **Where:** `signed-out.css:490`. The selector `.door .bk-reader.samples .bk-controls { margin-top: 18px }` (0,4,0) beats `.door .bk-under > .bk-controls { margin: 0 }` at `:520` (0,3,0).
- **What happens:** "Read this page" sits higher than "Front cover · Open the book →" on the same row. The offset is 7 px at 1366, 11 px at 1920 and 15 px at 2560 (row centres 650 against 657). It is the main control row under the book.
- **Change:** remove the margin at `:490` for the door, or raise `:520` to `.door .bk-reader.samples .bk-under > .bk-controls`.

### Polish

**5. gsap-react ("Skip cleanup … leaks and updates on detached nodes") and gsap-performance ("Ignore cleanup").** This is the brief's question about Bond's tweens.
- **Where:** `Companion.tsx:81-97`.
- **What happens:**
  - **Created once?** Yes: the four movers live in a ref and are only called after, and typing 14 characters added no tweens.
  - **Cleaned up?** No. The cleanup calls `gsap.killTweensOf([g, h])`, which only finds tweens still on the global timeline. A finished `quickTo` tween is auto-removed from that timeline but kept alive by its closure.
  - Measured in development: the glints hold two `x` and two `y` tweens, and the head two `rotation`. StrictMode's first pair is never killed.
  - After leaving `/sign-in`, `x`, `y` and `rotation` tweens are still registered on the detached glints and head.
- **Change:** create the movers inside `gsap.context(() => …, rootRef)` (or `useGSAP` with a scope), and return `() => ctx.revert()`. Alternatively keep the four functions and call `fn.tween.kill()` on each in cleanup.

  The blink effect is clean: its timers are cleared and its tweens are killed.

**6. hallmark hit targets (44 by 44) and BAOS checklist (44 px targets). Carried from round 1's gap 8.**
- **Where (signed-out.css):** `:177` and `:180` (the plate links and their `::before` hit areas), and `:502` (the dots).
- **What happens:** the enlarged hit areas now overlap their neighbours.

  | Size | Where | Problem |
  | --- | --- | --- |
  | 1366 | Sign in | The bottom 5 px of the Sign in button open "Forgot your password?". |
  | 390 | Sign in | The two stacked links are 32 px apart, so each really gets 31 px. |
  | 390 | Contribute | "Next: who it's from" gets 36 px. |
  | 1366×641 | Front door | "Use it here" gets 39 px. |
  | Desktop | Front door | The dots get 38 px, and their `-20px` hit area reaches into "Open the book". |

- **Change:**
  - Set `.plate-links { margin-top: calc((var(--tap) - 1.3em) / 2 + 2px) }`, so no hit area reaches the button.
  - On phones, centre the two links and stack them as full `--tap` rows with no gap. They are left-aligned under a centred form today.
  - Keep the dots' hit area inside their own row.

**7. hallmark forms ("Associate errors with `aria-describedby`. Set `aria-invalid`"). Carried from round 1's gap 9.**
- **Where:**
  - `Verify.tsx:237` and `ForgotPassword.tsx:119`: `aria-describedby` is set on a wrapping `<div>`, where it does nothing.
  - `CodeInput` in `ui.tsx` takes no ARIA props.
  - `Contribute.tsx:266-274`: the textarea, when the error is "Write what you remember…".
- **What happens:** measured on Verify after an empty submit, the digit boxes have no `aria-invalid` and no `aria-describedby`.
- **Change:**
  - Give `CodeInput` `invalid` and `describedBy` props, and spread them on every digit.
  - Give the textarea `aria-invalid` and `aria-describedby="cb-say"` while that error shows.

**8. emil-design-eng (handle edge cases invisibly), impeccable states (keyboard), and AuthFrame's own promise ("any press skips to the end").**
- **Where:** `AuthFrame.tsx:147`. Only `pointerdown` skips the ritual.
- **What happens:** pressing Tab twice at 0.25 s puts the focus in the email field under the closed board while the ritual keeps playing.
- **Change:** also skip on `keydown` and on `focusin` (once).

**9. DESIGN.md ("Reduced motion collapses to a 150 ms crossfade") and emil-design-eng (reduced motion keeps opacity and drops movement).**
- **Where:**
  - `astory.css:2339` sets Bond's state crossfade to 150 ms, but the global `*` rule at `astory.css:503-505` (`1ms !important`) wins. The cover, peek and watch swaps cut instantly.
  - `Companion.tsx:157`: the one reduced-motion blink is a `scaleY` tween.
- **Change:**
  - Use `transition-duration: 150ms !important` for `.auth .companion .state` and `.door .companion .state` inside the reduced-motion query.
  - Under reduced motion, make the single blink an opacity flick of the lids, or skip it.

**10. impeccable polish ("Remove … dead code … obsolete styles").**
- **Where:**
  - `Companion.tsx:1-20`: the header still says `*.png`, "paper-coloured lids", "the art is about to change", and "on touch … a still dog with one blink". Measured, Bond keeps blinking on touch (4 caught frames in 12 s), and that behaviour is fine.
  - `astory.css:631-640` and `:2288-2296`: two older companion rule sets, with `#F4EBDD` lids and a 1.1797 ratio, both overridden.
  - `astory.css:2303` and `:2307`: the `--breath` remnants.
  - `Welcome.tsx:38`: a stray duplicated comment.
  - `Welcome.tsx:143-160`: indentation.
- **Change:** bring the header up to date for Bond, and delete the overridden rules.

**11. gsap-performance and impeccable optimize (image loading).**
- **Where:** `Companion.tsx:177-188`.
- **What happens:** all five poses load eagerly on every signed-out page and on the front door, about 640 KB of webp at 689–802 px wide. They are drawn about 150 px wide, about 230 device pixels even at 2560.
- **Change:**
  - Export 400-px variants with `srcset`.
  - Give the poses that the page's rest mood doesn't show (cover, peek, and sleep or curious) `fetchpriority="low"`, or load them on the first focus.

**12. taste-skill critique ("careless details such as colliding lines").**
- **Where:** `signed-out.css:344`. The `.cb-foot` has `border-top`.
- **What happens:** the last ruled line and the foot's rule sit 16 px apart at 1366 and 9 px apart at 390. The ruled paper ends in a double line.
- **Change:** drop the foot's `border-top` on the words step, or end the ruling one line before the foot.

**13. taste-skill gate (`lint.mjs`), with DESIGN.md's book-material exemption. Carried from round 1's gap 18.**
- **What happens:** the lint still reports 43 FAIL, because `/* book material */` is not the lint's per-line ignore token. The real findings hide among them:
  - `:350`, `.cb-thumb .x::before`: a shadow on an interface button at rest.
  - `:120`: the lid's inset shadow.
  - `:117`: the glint's radial gradient, which is drawing. Mark it.
- **Change:**
  - Write `/* taste-skill-ignore: book material */` on the material lines.
  - Give `.x` a tone step instead of a shadow.
  - The Contribute running head (`:253`, `:312`) stays, as in round 1.

**14. hallmark gate 48 (locked tokens; `rgba()` counts). Carried from round 1's gap 17.**
- **Where (signed-out.css):** 57 raw `rgba()` values. Most are book-material shadows. The interface ones are:
  - the chocolate outline at `:169`, `:365` and `:446`
  - the cream outline on cloth at `:493`, `:513` and `:521`
  - the error rule at `:155` and `:385`
- **Change:** add `--chocolate-line`, `--cream-line` and `--danger-line` to the token block (`:30-51`) and reference them.

**15. taste-skill ("Write the full content"; the phone is a second composition, not a cut).**
- **Where:** `signed-out.css:643` sets `.cb-what { display: none }` on phones.
- **What happens:** phones lose "what happens to what you send", including "You don't need an account to send it." That is the one reassurance a stranger on this page needs.
- **Change:** keep the third line, at least, under the name on phones.

**16. hallmark a11y (one live region per message).**
- **Where:**
  - `Join.tsx:293`: an `aria-live` `<div>` wraps `PlateSay`, which is itself live.
  - `Contribute.tsx:337`: the same around `.cb-error`.
- **What happens:** an error can be announced twice.
- **Change:** drop the outer `aria-live`.

**17. emil-design-eng (handle edge cases invisibly).**
- **Where:** `ClothStamp.tsx:144` removes a stamp at 2800 ms, but `deboss` (`astory.css:693`) runs 3.2 s.
- **What happens:** the stamp is still at about a quarter opacity when it is removed, so it pops off. The timers are also not cleared on unmount.
- **Change:** remove the stamp at 3200 ms, and clear the timers in cleanup.

### Motion and interaction, in Emil's format

| Before | After | Why |
| --- | --- | --- |
| `killTweensOf([g, h])` on unmount | `gsap.context(…)` then `ctx.revert()`, or `fn.tween.kill()` for each | A finished `quickTo` is off the timeline; only the context or the tween itself reaches it (gap 5) |
| The ritual skips on `pointerdown` only | Also `keydown` and `focusin`, once | A keyboard user shouldn't type under a closed board (gap 8) |
| Bond's state swap at 1 ms under reduced motion | 150 ms opacity crossfade (`!important` in the reduced query) | Reduced motion keeps the fade (gap 9) |
| One `scaleY` blink under reduced motion | An opacity flick, or none | No movement under reduced motion (gap 9) |
| The stamp is removed at 2.8 s while it animates for 3.2 s | Removed at 3.2 s | The stamp never pops off (gap 17) |

### Scores (taste-skill critique; hallmark self-critique)

```
ROUND 2
Seen in one second: the family book open on the cloth, Bond with his paws on the bookplate.
Idea: the sign-in is the title page of the family's own book (the Ex Libris plate is the form). It passes the competitor test.
Live thing: Bond watching, covering his eyes and peeking; on the front door, the sample book in three families and seven covers.
Layout words: door=bench+leaf / sign-in=spread+plate / join=card+plate / contribute=person+leaf
Scores: design 8 · usability 7.5 · creativity 9 · content 8 → overall 8.2
Caps applied: none (no three-line headline, nothing covering a headline, nothing left hidden).
Top three: gap 1 (the plate runs off the page on step 2), gap 2 (cream pills spilling off the bench), gap 3 (1366×641 falls to the phone layout).
Hallmark reading: P5 H4 E4 S5 R4 V4. The stamp's E4 is fair once gaps 1, 2 and 4 are fixed; today it is E3.
```
