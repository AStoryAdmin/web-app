# Bao's Standard: signed-out pages, round 3

**Verdict: FAIL.**

Round 2 is mostly closed. The drawn-on catchlights and lid discs are gone, and Bond no longer blinks, as the lead ruled. His head now holds one size in every pose and one place in four of them. A 1366×641 laptop window gets the book again, with no scroll. The stacked ritual covers the whole title page and never shows a lockup over the form. The ritual's endpaper keeps one pattern size. Every target is 44px or more, and none of them collide on the plate.

What fails now:

- **Peek.** Press Show and his head jumps 43px up at 1920. That breaks the new ruling that every pose keeps one head position.
- **The tilt.** He "turns his head" by tilting the whole painting, paws included, so his paws rock on the plate's rule.
- **Reduced motion.** A page change blinks the whole book out to bare cloth, and its first frame shifts the old words.
- **Smaller faults:**
  - an invisible page that swallows part of the front door's Sign in button at 1366;
  - a caption over the epigraph's rule on phones;
  - the plate's links on the corner flourishes at 1366×641;
  - three carry-overs.

## How this was checked

- **Browser:** headless Chromium through Playwright 1.63 (`09142026/node_modules/playwright`). Each size had a fresh context with no session and no sign-in. The dev server was http://localhost:5180. The founder's browser pane was not touched.
- **Sizes:** 1366×768, 1366×641, 1920×1000, 2560×1300, 390×844, 820×1180 and 5120×2560.
  - 390 and 820 ran as touch devices.
  - 5120 ran with html zoom 2.56, which stands in for a zoomed-out Edge on a large display.
- **Pages:** `/welcome`, `/sign-in`, `/create-account`, `/create-account?code=K7M2QX`, `/create-account?code=` (the front door's own link), `/forgot-password`, `/verify`, `/verify?email=reader@example.com`, `/join/K7M2QX`, `/join/bad` and `/c/nobody`. That is 77 page-size pairs.
- **Measured with JavaScript on every pair:**
  - scroll range (`scrollTo(1e6, 1e6)`), layout, `--fit` and html zoom;
  - the smallest visible text in screen pixels (font-size × `currentCSSZoom`);
  - every target's hit area, by stepping `elementFromPoint` out from its centre, and nine sample points in each target's rect, to catch another control stealing them;
  - heading line counts, plate and paper overflow, and console errors;
  - the dog's box, his rendered pose, and his nose position and width in screen pixels. The nose was located on the art itself with PIL: watch 106px wide centred at 543,424; cover 91 at 410,450; peek 82 at 336,392; curious 92 at 327,422; sleep 117 at 466,497. These match the builder's `ART` numbers.
- **Bond, every pose at true size (1×), at all seven sizes:**
  - watch, with the pointer at the top centre, the top-left and the bottom-right;
  - email focus, cover (password focus) and peek (Show pressed);
  - curious, with the pointer at the centre and the top-left;
  - sleep (verify) and the front door.
  - Each set is aligned on its plate's top, with a crosshair on watch's nose: `r3-dog-poses-<size>.png`.
  - The paws against the plate's rule were measured column by column from the screenshots.
- **The opening ritual, frame by frame:**
  - The live timeline was paused (all candidates, StrictMode-safe) and seeked through 0–2.35s in 16 steps on desktop, at 1920×1000, 1366×641 and 5120×2560.
  - The stacked timeline was seeked through 0–1.2s in 13 steps at 390×844 and 820×1180.
  - A live run recorded the board's height against the title page, and the stage and opacity at the end.
- **Page changes, frame by frame:**
  - I wrapped `document.startViewTransition`, paused every `::view-transition-*` animation on `ready`, and stepped `currentTime` through 0, 40, 80, 110, 130, 160, 200, 240, 280, 320, 380 and 460ms, plus the last frame.
  - Moves at 1920×1000: Sign in → Create account, Sign in → Forgot password, Create account → Sign in, Welcome → Sign in, Verify "Change", and Join → Create account.
  - At 390×844: Sign in → Create account and Welcome → Sign in.
  - Sign in → Create account again under `prefers-reduced-motion`, at 0, 40, 75, 110 and 149ms.
- **Keyboard:** the Tab order and focus rings on Sign in, Create account (with a code), Verify, Join and the front door.
- **No form was submitted.**
  - Typing went only into the password field ("abcdef"), and I pressed Show.
  - The only links I clicked were navigation links: Create an account, Forgot your password?, I already have an account, Sign in on the front door, Change, and Join's Create an account.
  - I never pressed Sign in, Continue, Send the code, Try this code or any submit.
- **Screenshots:** in `web-app/docs/agents/reviews/shots/`, all prefixed `r3-`. There are 130 of them: every page at every size, `-full` for scrolling pages, the dog sheets, the contact sheets and the zooms named below.

## Round 2, finding by finding

| # | Round 2 finding | Now | Evidence |
| --- | --- | --- | --- |
| 1 | Phone catchlights on fur, lids off the eyes | **Fixed.** There are no glints and no lids: the companion holds only `.head` and the pose images at every size. The box is exactly 802:640 (112×89.4 at 390). | `r3-dog-poses-390x844.png` |
| 2 | Blink as flat brown discs | **Fixed, per the lead's ruling.** No closed-eye frames exist, so `canBlink` is false and he does not blink. | `Companion.tsx` |
| 3 | Doubled catchlights; the eyes don't follow | **Fixed.** Only the painted catchlights remain. He follows by tilt, but see new finding 2 for how. | `r3-dog-poses-1920x1000.png` |
| 4 | Head size changes up to 30% between poses | **Mostly fixed.** The nose is 21.3–22.5px wide in every pose at 1920. Its centre is within 1.1px of watch's on cover, curious and email focus. **Peek still jumps** (new finding 1). | `r3-dog-poses-*.png` |
| 5 | 1366×641 gets the phone column | **Fixed.** Book layout at fit 0.7792 on all ten AuthFrame pages, with no scroll (scrollY 0). The plate's foot is at 608 in a 619 page. | `r3-sign-in-1366x641.png` |
| 6 | Stacked ritual: small board, ghost lockup | **Fixed.** Live, the board is 786px tall, the title page's own height, at 390. It is 791px at 820. The foil title is gone by 0.65s and the board fades from 0.7 to 0.95s. The dog arrives after the board has gone. No form shows before 0.8s. | `r3-ritual-contact-390x844.png`, `r3-ritual-contact-820x1180.png` |
| 7 | Board-back pattern twice the size | **Fixed.** The As are the same size at 1750 and 2050ms. A small pop remains (new finding 9). | `r3-ritual-leftpage-1600-2050-1920x1000.png` |
| 8 | Hit areas collide or fall short | **Fixed on the plate.** Every plate target hits 44px or more, and no sample point is stolen on any of the 77 pairs. The phone links are 44px rows. A new dead strip is on the front door (new finding 4). | probe log |
| 9 | Family-code line 2px above Continue | **Fixed.** It is now part of the plate's line: "Joining with the code K7M 2QX. Free to start." | `r3-create-account-code-1920x1000.png` |
| 10 | Front-door Bond lies on nothing | **Fixed.** The image bottom is at 927.1 and the leaf's inner rule at 926.4 (1920). His right edge is at 579 and the corner bracket starts at 605. The tilt still rocks him (new finding 2). | `r3-welcome-1920x1000.png` |
| 11 | Front-door rows misaligned, button alone | **Fixed on desktop.** "Open the book" and "Read this page" share top 866 at 1920 and 633 at 1366. "Begin a book" and "Sign in" share one row at 1366. **The phone still leaves "Read this page" alone** (new finding 7). | `r3-welcome-1366x768.png`, `r3-welcome-390x844-full.png` |
| 12 | Sample book small | **Partly fixed.** It grew from 505 to 559px square at 1920 and from 360 to 397 at 1366×768 (new finding 8). | `r3-welcome-1920x1000.png` |
| 13 | Reduced motion double-exposes | **Double exposure fixed, new faults introduced** (new finding 3). | `r3-vt-signin-to-create-reduced-contact-1920x1000.png` |
| 14 | Peek loses its resting paw | **Fixed for the paw** (sink 0), but that is the cause of new finding 1. | `r3-dog-poses-1920x1000.png` |
| 15 | Phone cake caption under a photo corner | **Fixed.** A new collision sits two prints down (new finding 5). The sample cover's script is BookPage's and not this builder's, per the lead. | `r3-sign-in-390x844-porch-caption-zoom.png` |
| 16 | Not verified in round 2 | No longer applicable. | |

## What holds (fresh pass)

- **No horizontal scroll** on any of the 77 pairs.
- **No vertical scroll** on any desktop size (1366×768, 1366×641, 1920×1000, 2560×1300, 5120×2560).
- **One scale:** `--fit` is identical across every AuthFrame page at each size: 0.9000, 0.7792 and 1.1875.
- **Text size:** the smallest text is 13px or more everywhere, except the sample cover's printed date at 12px on a phone, which is the book's own printing (rule 22).
- **Headings** are two lines or fewer.
- **No console errors.**
- **No added layers:** there is nothing drawn over the painting anywhere.
- **Bond's moods are right on every page:**
  - watch on Sign in and Forgot;
  - curious on Create account (all three variants), Join (both) and `/c/nobody`;
  - sleep on Verify (both);
  - cover on password focus, and peek on Show.
- **The desktop ritual** (1920, 1366×641 and 5120) is clean frame by frame:
  - the foil tools on, the board swings, the prints settle and the dog arrives;
  - the stage ends "open" with every print, the plate, the dog and the line at opacity 1.
- **Page changes with normal motion** are one clean turn:
  - the old words are gone by 110ms, the page cuts at 120ms and the new words rise from 130ms;
  - there are never two forms at once (`r3-vt-signin-to-create-80-160ms-1920x1000.png`);
  - Welcome → Sign in clears the bench by 80ms, then the open book fades in whole, its album decoded.
- **Focus rings:** brass on the lockup and on the cloth, ochre on the paper, and the field's ring wraps the whole line (`r3-focus-email-1920x1000.png`). The Tab order is logical on all five pages tested.

## Findings, worst first

1. **Pressing Show makes Bond's head jump up by two nose-widths.**
   - **What happens:**
     - Watch, email focus, cover and curious hold his nose within about 1px of one point.
     - Peek puts it 43px higher at 1920×1000: nose y 279.8 against watch's 323.2.
     - The head's size holds (a nose of 22.2px against 21.8), but its position doesn't.
     - The whole dog visibly rises over the plate when the password is shown, and drops back on Hide.
   - **Rise by size:**

     | Size | Rise |
     | --- | --- |
     | 1366×641 | 25px |
     | 390×844 | 30px |
     | 1366×768 | 33px |
     | 820×1180 | 37px |
     | 1920×1000 | 43px |
     | 2560×1300 | 56px |
     | 5120×2560 | 111px |

   - **Where:** `Companion.tsx` `POSES`. Peek has `sink: 0` "so its head rises a little". `signed-out.css` `--dogroom` leaves room for that rise.
   - **Evidence:** `r3-dog-poses-1920x1000.png` (peek, fourth panel, against the red crosshair on watch's nose), `r3-dog-poses-5120x2560.png`, `r3-dog-poses-390x844.png`.
   - **Rule:** 27 ("every pose keeps one head size and position", lead ruling of 2026-10-18).
   - **Fix:** Set peek's `sink` to about 0.337, so its nose lands on watch's, and let the resting paw go down behind the plate's top edge as cover's and curious's chests do. Then drop `--dogroom`'s extra allowance for peek.

2. **He "turns his head" by tilting the whole painting, so his paws rock on the plate's rule.**
   - **What happens:**
     - The `.head` wrapper holds the entire picture, paws and chest included. It rotates up to ±4° about the box's bottom centre (`transform-origin: 50% 100%`, `hr` clamp ±4, and −4° on email focus).
     - With the pointer at the bottom-right, his left paw rises 9px off the rule at 1920 and 23px at 5120, while the right paw sinks behind the plate's edge. With the pointer at the top-left it is the other way round.
     - At rest his left paw already hovers about 5–6px above the rule at 1920, about 4px at 1366, 6px at 390 and 17px at 5120. In the art the left paw ends about 27 art-pixels above the picture's foot.
     - The front door's Bond tilts the same way (−2.6° at rest).
     - A tilting dog with sliding paws reads as the plate being uneven, not as him turning to look.
   - **Where:** `Companion.tsx` (the `hr` quickTo on `.head`), `signed-out.css` §1 (`.companion .head { transform-origin: 50% 100% }`).
   - **Sizes:** every desktop size, since the pointer tilt needs a fine pointer. The resting float and the focus tilt also happen on phones and tablets.
   - **Evidence:** `r3-dog-paws-tilt-5120x2560.png` (pointer at centre, top-left and bottom-right, true size), `r3-dog-paws-tilt-1920x1000-4x.png`. Measured air under the left paw: 6, 5 and 9px at 1920, and 17, 14 and 23px at 5120.
   - **Rule:** 27 ("He follows by turning his head"; he lies with his paws on the plate's rule).
   - **Fix:**
     - Cut the head out of the same painting as its own layer, feathered at the ruff, and rotate only that layer about the neck. The body and paws stay still on the rule. Do this for watch and curious.
     - Lower watch by about 0.035 box-heights so the left paw meets the rule. The right paw's claw tips then tuck behind the plate's edge.
     - Until the head is cut, cap the tilt at 1.5°.

3. **Under reduced motion a page change blinks the whole book out and shifts the old words.**
   - **What happens:**
     - Sign in → Create account fades every layer (`auth-book`, `auth-title`, `auth-plate`, `auth-line`) out over 75ms, then in over the next 75ms. At 75ms the screen is bare cloth: the spread, album and all, vanishes and comes back, although it is identical on both sides.
     - The groups' duration is forced to 0s, so at frame 0 the old words are already drawn at the new plate's place inside the old frame. "Sign in." moves 34px down, and the links sit on the corner flourishes.
   - **Where:** `signed-out.css` §3, the `prefers-reduced-motion` block (`animation-duration: 0s !important` on the groups, and `vt-fade` and `vt-appear` on `auth-book` and `auth-title`).
   - **Size:** all sizes, under reduced motion (1920×1000 verified).
   - **Evidence:** `r3-vt-signin-to-create-reduced-contact-1920x1000.png` (0, 40, 75, 110 and 149ms), `r3-vt-reduced-frame0-vs-rest-1920x1000.png` (left: the page at rest; right: frame 0).
   - **Rules:** 23a ("nothing jumps or flashes"), 25.
   - **Fix:**
     - Keep the book and title page as a hard cut at 75ms (`vt-cut-out` and `vt-cut-in` with `steps(1, end)`), as normal motion does at 120ms.
     - Give the `auth-plate` and `auth-line` groups `75ms steps(1, end)` instead of 0s, so the old words leave from where they were.

4. **On the front door at 1366, an invisible page swallows the right end of "Sign in".**
   - **What happens:** The closed sample book's blank left page is transparent but still takes the pointer, and it reaches over the leaf:
     - at 1366×768 it covers from x 324, so the right 9px of the 96px "Sign in" button do nothing;
     - at 1366×641 it covers from x 342, so 17px of 94px do nothing.
   - **Where:** `.door .bk-reader.samples .bk-page.blank` (made transparent at astory.css line 1801; BookSpread's spread with the cover on the right).
   - **Sizes:** 1366×768 and 1366×641. It is clear at 1920 and above.
   - **Evidence:** the probe, where `elementFromPoint` returns `DIV.bk-page.left.blank` inside the button; `r3-welcome-signin-dead-edge-1366x768.png`.
   - **Rule:** checklist (no overlapping targets, every control fully pressable).
   - **Fix:** Add `.door .bk-reader.samples .bk-page.blank { pointer-events: none; }` in signed-out.css §6.

5. **On phones the third print's caption runs into the epigraph's rule and its first line.**
   - **What happens:**
     - At 390×844 on `/sign-in`, "Rain on the porch, 1961" spans y 1502–1521. The brass rule of the line below it is drawn at 1509, across the caption's own line, and the sentence starts at 1520.
     - The same happens on every phone page: Create account 1364–1383 against a rule at 1371 and text at 1382, Verify 1275–1293 against 1282 and 1292, and `/c/nobody` likewise.
   - **Where:** `signed-out.css` §7, `@media (max-width: 760px)`: `.auth .print[data-n="3"] { --t: 60% }` against `.auth .ep-how { bottom: 4% }`.
   - **Size:** 390×844 (every phone width). 820 is clear.
   - **Evidence:** `r3-sign-in-390x844-porch-caption-zoom.png`, `r3-create-account-code-390x844-full.png`.
   - **Rule:** checklist (no clipped or overlapping text).
   - **Fix:** Raise the third print to about `--t: 56%`, or set the line in flow after the album with 16px above its rule, so the caption, the rule and the sentence each have their own room.

6. **At 1366×641 the plate's two links sit on its corner flourishes.**
   - **What happens:** The short-window rule sets `.plate-links { padding: 0 }`. "Forgot your password?" starts on the left flourish's scroll, and "Create an account" ends against the right one. At 1366×768 the right link touches its flourish.
   - **Where:** `signed-out.css` §7, `@media (min-width: 1181px) and (max-height: 720px)`, `.auth.ritual .plate-links`.
   - **Evidence:** `r3-plate-foot-1366x641-1366x768.png` (left: Sign in at 641; middle: Join at 641, clear; right: Sign in at 768).
   - **Rules:** checklist (no overlapping), and the file's own rule that the plate's last line stays inside the flourishes.
   - **Fix:** Keep the 4% inset at every size. Make the room by taking 4–6px out of the plate's field gaps at this size instead of out of the links' inset.

7. **On a phone, "Read this page" still sits alone on its own row** (round 2 finding 11, phone part).
   - **What happens:** At 390×844 "Front cover · Open the book →" is one row (top 1521), and "Read this page" sits centred alone below it (top 1573).
   - **Where:** `signed-out.css` §6, `.door .bk-under` in the stacked range.
   - **Evidence:** `r3-welcome-390x844-full.png`.
   - **Rule:** 10.
   - **Fix:** On phones make the reader row a two-column grid ("Open the book", "Read this page"), with "Front cover" as the caption above, or make both full-width buttons.

8. **The front door's sample book is still small for the window** (round 2 finding 12).
   - **What happens:**
     - The book is 559×559 at 1920×1000 (16% of the window), 397 at 1366×768 and 377 at 1366×641.
     - The leaf beside it leaves about 95px of empty paper between the paper swatches (bottom 657) and the two buttons (top 751) at 1920.
     - The reader column is 1118px wide but holds a 559px book.
   - **Where:** `.door-bench .bk-reader { max-width: 940px }` and the bench's 690px design height.
   - **Rule:** 8.
   - **Fix:** Raise the reader's `max-width` and give the bench's height to the book: move the swatches into the family-picks row, as already planned, and let the book reach about 640px at 1920.

9. **The desktop ritual drops the board's gilt edge at once.**
   - **What happens:** While the opened board lies as the left page, its gilt fore-edge (`--edge-fore`, mirrored) shows as a cream-and-gold line down the left page's outer edge and along its foot. At 2.0s the board is set hidden, and the line disappears in one frame, after the prints have landed.
   - **Where:** `AuthFrame.tsx` (`tl.set(board, { visibility: "hidden" }, 2.0)`), `signed-out.css` `.auth .board { box-shadow: var(--edge-fore), … }`.
   - **Sizes:** 1920×1000, 1366×641 and 5120×2560.
   - **Evidence:** `r3-ritual-leftpage-1600-2050-1920x1000.png` (frames 1950 and 2050), `r3-ritual-contact-1920x1000.png`.
   - **Rule:** 25 (nothing pops).
   - **Fix:** Fade the board's shadow out with the back (0.25s from 1.75s), or move the gilt to a child that fades, so nothing is left to vanish at 2.0s.

## Notes for the lead (not counted)

- **Sleep lies lower than the others.** Measured against its plate, sleep's nose sits 21px lower than watch's at 1920 (54px at 5120), because his chin is on his paws and the paws stay on the rule. Its size holds. It is only ever seen after a page change, never as a swap in place, so I have not failed it. If "one head position" is meant across pages too, sleep would need its paws behind the plate. That is a call for the lead.
- **Verify's "Change"** goes to `/create-account?next=/` and drops the address. That is right after sign-up, but someone sent to Verify from Sign in (an unconfirmed account) lands on Create account. It is a product question, not a design defect.

## Not verified

- **Microsoft Edge itself, and a real touch device.** Everything ran in headless Chromium.
- **Anything behind a submit:**
  - errors after a submit;
  - Create account step 2 and Forgot password step 2;
  - a confirmed `/join` and a signed-in `/join`;
  - a `/c/:slug` with a real slug.
- **The reduced-motion ritual and the dog under reduced motion.** Only the reduced-motion page change was re-run.
- **The live 220ms crossfade between poses at full speed.** The peek jump (finding 1) is measured from the settled frames.
