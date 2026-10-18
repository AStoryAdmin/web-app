# Signed-out pages, round 1: skills review

**Verdict: GAPS.** 21 gaps: 0 blockers, 7 ugly, 14 polish.

**Scope.** `src/pages/auth/*` (AuthFrame, bookFit, SignIn, CreateAccount, ForgotPassword, Verify, Welcome), `src/pages/Join.tsx`, `src/pages/Contribute.tsx`, `src/components/delight/{Prints,Companion,ClothStamp}.tsx`, `src/styles/pages/signed-out.css`, and the signed-out rules they lean on in `src/styles/astory.css` (§15, §18, §33, §40).

**Skills loaded.**
- taste-skill: SKILL, layout, type, critique.
- hallmark: SKILL, slop-test, interaction-and-states, responsive, anti-patterns.
- emil-design-eng.
- impeccable: SKILL, craft-floor, critique, polish, layout.
- gsap-react, gsap-scrolltrigger, gsap-timeline, gsap-performance and gsap-core (matchMedia).
- Also `docs/BAOS-STANDARD.md` and `DESIGN.md`.

No other installed skill applies. Humanizer was not needed: the copy reads in the house voice.

## How it was checked

**Headless rendering.** Playwright chromium-1243 against `http://localhost:5180`, at 1366×768, 1920×1000 and 390×844, each with and without `reducedMotion: 'reduce'`. The routes were:
- `/welcome`, `/sign-in`
- `/create-account`, `/create-account?code=K7M2QX`
- `/forgot-password`
- `/verify?email=…`, `/verify`
- `/join/K7M2QX`, `/join/ABC`
- `/c/sample-slug`, once as it came back from the server ("link isn't available") and once with the read-only `get_contribute_info` RPC stubbed, so the writing leaf could render.

**What was measured on every render:**
- horizontal scroll
- canvas fit against the window
- headline line counts
- wrapped affordances
- text under 12px
- tap targets
- placeholder and small-print contrast
- anything left at opacity 0
- console errors

**Mid-ritual frames.** Captured at 0.35 s and 1.2 s on the sign-in and the front door.

**Simulated error.** An error line was injected into the plate's DOM to see how the book responds. No form was submitted.

**Mechanical scans:**
- `impeccable detect`: 0 blocking findings. 72 advisories for colours, sizes and radii off DESIGN.md, and 1 font finding (Caveat).
- taste-skill `lint.mjs`: 37 FAIL and 8 WARN.
  - Most of these are the brand's own language, which DESIGN.md says wins: hairlines, foil rules, kickers, paper shadows.
  - The ones DESIGN.md does not exempt are gaps 18 and 19 below.

### What holds (no gap)

**Layout.**
- No horizontal scroll at any size or motion setting.
- Every desktop signed-out page is one screen: `scrollHeight` equals the window height. The book scales up to fill 1920×1000 (fit 1.16–1.19) and down at 1366×768 (0.88–0.90).

**Motion.**
- The opening ritual runs and finishes. The board swings, the prints settle and the dog arrives, and nothing is left hidden after about 2.4 s.
- Under reduced motion the book is simply open.
- Welcome's arrival is in `gsap.matchMedia()` with `mm.revert()`.
- The prints' drift uses `quickTo` and is gated on hover and reduced motion.
- Every button presses at 0.97, using the house ease-out.
- No `transition: all`, no animation from `scale(0)`, and no ScrollTrigger on these pages.

**States.** Errors are said once, in the house style. Loading uses the drawn mark. The disabled and busy states exist.

**Honesty.** The prints on the sign-in album are labelled as a sample family's, once.

**Headlines.** Two lines or fewer at both desktop sizes.

**Console.** No errors.

### Not verified

- **States behind a submit or a session.** The second steps of Create account and Forgot password, and the signed-in states of Join (joining, "You're in", "That didn't work"). Rendering them would have meant submitting a form or signing in.
- **Other sizes.** 2560×1300 and a zoomed-out window (BAOS rule 5). They were not in this brief's sizes.
- **Edge.** Only Chromium was used.

---

## Gaps

### Ugly

**1. taste-skill, house rules: headlines are two lines or fewer at every width (DESIGN.md, Type).**
- **Where:** `src/styles/pages/signed-out.css:452`.
- **What happens:** at 390 the title line wraps to three lines on every phone signed-out page:
  - "Every life / holds a story / worth keeping."
  - "Your family's / book has a / place for you."

  The cause is `max-width: 15ch` at 30px Cormorant.
- **Change:** drop the `15ch` cap (or raise it to about 22ch) and keep `text-wrap: balance`, so it breaks "Every life holds a / story worth keeping." Check Join's line as well.

**2. impeccable craft floor (States, no layout shift) and hallmark gate 39 (an error must not push the page). BAOS rule 12 (the ratio holds).**
- **Where:** `src/pages/auth/bookFit.ts:287-289` (the ResizeObserver on the canvas), with every `plate-error` in SignIn, CreateAccount, ForgotPassword, Verify and Join.
- **What happens:** when an error line appears, the plate grows, `useFit` refits, and the whole book shrinks. With an injected error at 1366 the sign-in spread went from 1269 to 1145px wide, and Join went from 1296 to 1123px. Join at 1920 went from 1711 to 1397px.
- **Change:** keep the fit stable for a page's life.
  - Fit only on window resize, the fonts arriving, or a route change. Don't observe the art's own height.
  - Give the plate a reserved error slot (`min-height: 1lh`), so the error sits in space the plate already has.

  An error should change words, never the size of the book.

**3. impeccable craft floor (Contrast: placeholder text 4.5:1 or more) and hallmark (Forms: placeholders must read).**
- **Where (signed-out.css):**

  | Line | Field | Contrast now |
  | --- | --- | --- |
  | 95 | every field, `#9A8F85` | 2.98:1 |
  | 131 | the owner's name, "Your name" | 1.82:1 |
  | 204 | the hand-typed code | 1.68:1 |
  | 245 | the contribute title | about 2.2:1 |
  | 250 | the contribute words | about 2.5:1 |

- **Why it matters:** "Your name" is the only instruction on the lettered plate's line.
- **Change:** raise the placeholders to at least 4.5:1, for example `var(--ink-soft)`. Keep the italic on the words field.

**4. emil-design-eng (prefers-reduced-motion keeps opacity and drops movement) and hallmark gate 27 (every motion has a reduced-motion fallback). DESIGN.md: reduced motion collapses to a 150 ms crossfade.**
- **Where:** `src/styles/pages/signed-out.css:157-164`.
- **What happens:** the `auth-book`, `auth-title` and `auth-plate` view-transition groups morph for 420 ms, and `plate-rise` travels 6px, with no reduced-motion rule. The global `*` rule at `astory.css:503` does not reach `::view-transition-*`. Welcome to Sign in moves the leaf across the screen under reduced motion.
- **Change:** add `@media (prefers-reduced-motion: reduce) { ::view-transition-group(auth-book), ::view-transition-group(auth-title), ::view-transition-group(auth-plate) { animation-duration: 0s } ::view-transition-new(auth-plate), ::view-transition-new(auth-title), ::view-transition-old(auth-plate), ::view-transition-old(auth-title) { animation: 150ms linear both vt-fade-or-appear } }`. It must be opacity only.

**5. hallmark (Focus rings: visible, 2px, 3:1 or more, never `outline: none` without a replacement) and impeccable craft floor (keyboard focus).**
- **Where:** `src/styles/pages/signed-out.css:244`, `:247`, `:248` and `:251`, for `Contribute.tsx:255-264`.
- **What happens:**
  - The title line sets `outline: none`, and its focus is only a darker 1px rule.
  - The words area sets `outline: none`, and its focus only tints the ruled lines.

  A keyboard user can barely see where they are on the main field of the page.
- **Change:** give both the house ring, `outline: 2px solid var(--ochre); outline-offset: 4px` on `:focus-visible`, as `.cb .input:has(input:focus-visible)` already does.

**6. taste-skill, imagery ("A found picture … is never presented as the client's own") and DESIGN.md ("Never a borrowed scene presented as the family's own"). BAOS rule 20.**
- **Where:** `src/pages/Join.tsx:42`.
- **What happens:** the invitation page captions a library photograph "Nan, the year she turned seventy". The person reading is an invited relative, looking at *their* family's invitation, and this page carries no sample disclosure. Unlike the sign-in album, it reads as their own Nan.
- **Change:** drop the caption, or add the one-line sample note the sign-in album has. Dropping it is better: the card already carries the page.

**7. BAOS rule 16 (nothing under 12px) and impeccable craft floor (Type).**
- **Where:** `src/styles/astory.css:3082` and `:3086`, as rendered on `/welcome`.
- **What happens:** the sample book's cover date ("APRIL 23, 2026", `.sb-cv-date`) renders at 10.7px at 1366 (12px design × fit 0.888). On a phone it is 11px.
- **Change:** inside `.door`, use `font-size: max(var(--floor, 12px), 1.9cqw)` (the floor the rest of the signed-out small print uses). Set 12px on the phone.

### Polish

**8. hallmark (Hit targets 44×44) and BAOS checklist (every touch target 44px or more).**
- **Where (signed-out.css):**

  | Line | Selector | Height now |
  | --- | --- | --- |
  | 97 | `.forgot` | 32px |
  | 138 | `.given .linkish` | 32px |
  | 355 | `.door-code a` | 32px |
  | 237 | `.cb-kind button` | 38px |

- **What happens:** these are below 44px before scaling. The book's fit then shrinks every target at 1366: the fields measure 39–40px, Show is 48×39, Forgot is 28px tall, the cover swatches are 39×39, and Open the book is 39px.
- **Change:** add a `--tap: max(44px, calc(44px / var(--fit, 1)))` beside `--floor` (line 18), and use it for `min-height` on every control on the book and the bench.

**9. hallmark (Forms: associate errors with `aria-describedby` and set `aria-invalid` on the field).**
- **Where:**
  - `SignIn.tsx:50-53`
  - `CreateAccount.tsx:183-186`, and `:206` (the email has no `aria-invalid`)
  - `ForgotPassword.tsx:63-66` and `:101-105`
  - `Verify.tsx:211-215`
  - `Join.tsx:105-109`
  - `Contribute.tsx:172-176`
- **What happens:** errors are a plate-level `<p role="alert">`, not tied to the field. `Field` in `src/components/ui.tsx:51` already takes `error`, and wires `aria-describedby` and `aria-invalid`.
- **Change:** for a field-specific message (an empty email, a short password, the code), pass it through `Field`'s `error` prop or point `aria-describedby` at the plate error. Keep the one plate line for server errors. Do this together with gap 2's reserved slot.

**10. hallmark (Disabled and Loading states: an in-flight action is not clickable).**
- **Where:** `Join.tsx:239-241`.
- **What happens:** "Making your page ready…" is a live link to `/` with `aria-busy`. Pressing it leaves before `ensureMyStory` finishes.
- **Change:** render a disabled `Button loading` until `phase === "ready"`, then the link.

**11. gsap-react ("Use `useGSAP()` or `gsap.context()` + `ctx.revert()`; don't skip cleanup") and gsap-core (`gsap.matchMedia()` for prefers-reduced-motion).**
- **Where:** `AuthFrame.tsx:82-139`.
- **What happens:** the ritual is a bare timeline. The `gsap.set` calls (opacity 0 on the prints and the dog, the stroke dashes) sit outside it and are never reverted when the cleanup kills the timeline. Reduced motion is read once, in `useState`.
- **Change:** wrap the body in `gsap.context(() => …, ground)` and return `() => ctx.revert()`. Or use `gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", …)`, as Welcome does. Keep the once-per-session flag.

**12. gsap-performance ("reuse a single tween … `quickTo`"; don't create tweens on every update).**
- **Where:** `Companion.tsx:177-202` and `:205-233`.
- **What happens:** the gaze and head effects depend on `progress` and `focus`, so every keystroke builds two new `quickTo` tweens and never kills the old ones.
- **Change:** create the four `quickTo`s once in a mount effect, stored in refs, and only call them from the dependent effects. Kill them in the mount effect's cleanup.

**13. emil-design-eng (hover animation behind `@media (hover: hover) and (pointer: fine)`).**
- **Where:** `src/styles/pages/signed-out.css:375`.
- **What happens:** `.door .bk-sw:hover::before { transform: scale(1.08) }` is not gated, so a tap on a phone leaves a stuck scaled swatch.
- **Change:** move it inside the hover media query.

**14. gsap-performance (prefer transform and opacity) and BAOS rule 23 (transform and opacity only).**
- **Where:** `AuthFrame.tsx:112-113`, `:118-120` and `:121`.
- **What happens:** the foil title animates `strokeDashoffset` and `fillOpacity` on every path of the lockup, and the cloth's breath tweens a custom property (`--breath`) that every child of the board inherits.
- **Change:**
  - Reveal the foil with a `clip-path: inset()` wipe on the `.foil-title` box (Emil's clip-path reveal), or accept the stroke draw as the one authored moment and say so in the comment.
  - Animate the opacity of a `.board-front` child (`.breath` span) directly instead of `--breath`.

**15. taste-skill, type ("Measure 45–75 characters").**
- **Where:** `src/styles/pages/signed-out.css:464`.
- **What happens:** on a phone the endpaper's sentence sits in a column from 7% to 58%: about 130px, about 16 characters a line, seven ragged lines.
- **Change:** on a phone, put `.ep-how` under the third print at full width (`left: 7%; right: 7%; top: auto; bottom: 4%`). Or move it above the album, and shift print 3 up to make room.

**16. impeccable craft floor (Execution: details in spec) and taste critique (careless details).**
- **Where:** `src/styles/pages/signed-out.css:248-251`.
- **What happens:** at fractional fits the contribute leaf's ruled lines draw at alternating weights. At 1366 every third rule is darker (sampled 216 against 229). On a phone the first rule sits 8px under the title's own rule, which reads as a double line.
- **Change:**
  - Draw the rule as a whole number of screen pixels, for example `calc(1px / var(--fit, 1))`.
  - Snap `--lh` so that `--lh × --fit` is a whole pixel.
  - Start the ruling (`background-position`) so the first rule is one full line below the title rule.

**17. hallmark gate 48 (locked tokens, no mid-render hex) and gate 7 (no pure `#fff`). DESIGN.md: "pages never write a raw hex".**
- **Where (signed-out.css):**
  - `:41`, `:95`, `:99`, `:115` (`#55745A` and `#fff`), `:123`, `:170`, `:172`, `:175`, `:176`, `:179`
  - `:212`, `:219`, `:223`, `:226`, `:255`, `:260` (`#fff`)
  - `:298`, `:330`, `:354`, `:404`, `:426`
- **Change:** lift these into astory.css §1 as named tokens (`--print-white`, `--photo-corner`, `--sage`, `--legal-ink`, `--paper-ivory`) and reference them. Replace `#fff` with the print white.
- **Also:**
  - `.legal` (`#7d7369`) measures 4.37:1 on Join's plate. Darken it to clear 4.5:1.
  - Caveat (`:175`, and `astory.css:2241-2242`) is a fourth face not declared in DESIGN.md. The detector flags it. Declare it in DESIGN.md as the hand for photo captions only, and use `var(--font-script)`, which exists at `astory.css:3099`.

**18. taste-skill house rules (no gradients; no shadows on things at rest), with DESIGN.md "No gradients except a scrim" and "Shadows only on what truly floats".**
- **Where:**
  - Gradients: `signed-out.css:70`, `:338`; `astory.css:2225` and `:2253`.
  - Shadows at rest: `signed-out.css:27`, `:171`, `:177`, `:212`, `:331`, `:405` and about 13 more.
- **What it is:** the gutter shades, the ribbon's weave, and the resting shadows on the prints, the leaf and the card. These are book materials BAOS rule 15a asks for, but DESIGN.md's craft rules don't exempt them, so the lint fails 25 lines.
- **Change:** either add the exemption to DESIGN.md ("the book's own materials: page gutter shade, prints and leaves lying on cloth"), or mark each line `/* taste-skill-ignore: book material */`. Then the gate measures what is actually off-brand.

**19. impeccable craft floor ("A kicker or eyebrow above a heading … is a ban"), taste-skill (no eyebrows) and BAOS rule 19 (don't repeat).**
- **Where:** `Contribute.tsx:213`.
- **What happens:** "Sent to Margaret's family" sits above "Thank you." The next sentence says it again ("It's with Margaret's family now.").
- **Change:** drop the kicker on the done state. On the writing steps (`:243`, `:302`), "A page for Margaret's book" shares the row with the kind toggle. That is a running head, which the brand allows, so leave it.

**20. hallmark gate 34 (`overflow-x: clip` on html and body, which holds) and the responsive bans.**
- **Where:** `signed-out.css:429` (`.door { overflow: visible }` on phones).
- **What happens:** the lamp (1100px) spills past the body, so `body.scrollWidth` is 1100 at 390. It is clipped by `html`, so it is not visible. But the lamp is a pointer effect on a touch screen.
- **Change:** `@media (hover: none) { .door .lamp, .auth .lamp { display: none } }`.

**21. hallmark discipline 1 (pre-emit self-critique stamp) and DESIGN.md ("score the page 1 to 5 on philosophy, hierarchy, execution, specificity, restraint, variety").**
- **Where:** the top of `src/styles/pages/signed-out.css` (no stamp).
- **Change:** add `/* Hallmark · pre-emit critique: P_ H_ E_ S_ R_ V_ */` with honest scores after this round's fixes. My reading today is P5 H4 E3 S5 R4 V4. Execution is the low axis, because of gaps 2, 3 and 16.

### Motion and interaction, in Emil's format

| Before | After | Why |
| --- | --- | --- |
| `::view-transition-group(auth-*)` 420 ms morph under reduced motion | `animation-duration: 0s` on the groups; old and new at a 150 ms opacity crossfade | Reduced motion keeps the fade and drops the travel (gap 4) |
| `.door .bk-sw:hover::before { scale(1.08) }` ungated | Inside `@media (hover: hover) and (pointer: fine)` | Touch taps leave a stuck hover (gap 13) |
| `quickTo` rebuilt on every keystroke | `quickTo` created once in refs | Reuse one tween for frequent updates (gap 12) |
| Error line resizes the plate, so the book refits | Reserved error slot; fit only on window resize | Feedback must not move the whole object (gap 2) |
| `strokeDashoffset` and `--breath` tweens | `clip-path` wipe, or a child's opacity | Stay on the compositor (gap 14) |

### A note on scores (taste-skill critique, one round)

```
ROUND 1
Seen in one second: the family book open on the cloth, the dog on the bookplate.
Idea: the sign-in is the title page of the family's own book (the Ex Libris plate is the form). It passes the competitor test.
Live thing: the dog that watches, covers its eyes for the password and sleeps on verify; on the front door, the sample book you can open and recolour.
Scores: design 8 · usability 7 · creativity 9 · content 8 → overall 8.0
Caps applied: a three-line headline on the phone caps the overall at 6.5 until gap 1 is fixed.
Top three: gap 1 (phone headline), gap 2 (the book shrinks on error), gap 3 (placeholder contrast).
```
