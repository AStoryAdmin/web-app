# Bao's Standard: signed-out pages, round 4

**Verdict: FAIL.**

Round 3 is mostly closed, and Bond now passes rule 27:
- **One head position.** Pressing Show no longer moves his head. The nose holds within 1px of one point in every pose on Sign in and on Create account at 1920 (2px at 5120). Its width holds within 0.7%.
- **Planted paws.** He turns about the middle of his paws, at most 1.5°. The claws that meet the rule do not move at any tilt.
- **Other round 3 fixes.** The front door's Sign in button is whole. The phone captions have their own room. The plate links are clear of the flourishes. The ritual's gilt edge fades instead of popping.

What still fails is moving between pages:

- **Sign in to the front door.** Going back through the lockup double-exposes two whole pages: two dogs, two lockups, and the sign-in form over the sample cover.
- **Reduced motion.** The round 3 fault is still half open. The old words are drawn about 30px from where they were, onto the corner flourishes. And from the front door the screen goes to bare cloth for 75ms.
- **Smaller faults:**
  - the lockup changes size and place between the front door and the book;
  - at 1366×641 the lockup sits on the book's corner;
  - stacked, the front door's three family rows are 720px bars, each holding a 118px name.

## How this was checked

- **Browser:** headless Chromium through Playwright 1.63 (`09142026/node_modules/playwright`). Each size had a fresh context with no session and no sign-in. The dev server was http://localhost:5180. The founder's browser pane was not touched.
- **Sizes:** 1366×768, 1366×641, 1920×1000, 2560×1300, 800×1024, 390×844, 820×1180 and 5120×2560.
  - 390 and 820 ran as touch devices; 800×1024 ran as a narrow mouse window.
  - At 2560 the app set html zoom to 1.3, and at 5120 to 2.56 (lib/zoom), which stands in for a zoomed-out Edge.
- **Pages:** `/welcome`, `/sign-in`, `/create-account`, `/create-account?code=K7M2QX`, `/create-account?code=`, `/forgot-password`, `/verify`, `/verify?email=reader@example.com`, `/join/K7M2QX`, `/join/bad` and `/c/nobody`. That is 88 page-size pairs.
- **Measured with JavaScript on every pair:**
  - the scroll range (`scrollTo(1e6, 1e6)`), the layout, `--fit` and html zoom;
  - the smallest visible text in screen pixels (font-size × `currentCSSZoom`);
  - every target's hit area, by stepping `elementFromPoint` out from its centre, and nine sample points in its rect, to catch another control stealing it;
  - heading line counts, plate overflow and console errors.
- **Further measurements:**
  - the lockup and the book's rects;
  - the phone captions against the epigraph;
  - the plate links' inset from the plate's edges;
  - the front door's book and leaf.
- **Bond at true size, at all eight sizes:**
  - **States filmed:**
    - Sign in: rest, the pointer at the top centre, top-left, bottom-right and centre (mouse sizes), email focus, cover (password focus) and peek (I typed "abcdef" and pressed Show);
    - Create account: rest, the pointer, email focus and the name;
    - Verify: sleep;
    - the front door: rest and the pointer.
  - **The nose and paws.** The nose was computed from each pose's measured nose point (ART), the image's layout box and the head's live rotation matrix. The paws were checked two ways:
    - geometrically, at four art points;
    - by pixels: each state was shot with Bond and again with him hidden, and the difference gives the lowest painted row per column against the plate's rule.
  - **Sheets:** `r4-dog-poses-<size>.png` (eight files) and `r4-dog-paws-tilt-5120x2560-2x.png`.
- **The opening ritual, frame by frame:**
  - The live timelines were paused, then seeked:
    - desktop: 19 frames from 0 to 2.35s, at 1920×1000, 1366×641 and 5120×2560;
    - stacked: 15 frames from 0 to 1.35s, at 390×844, 820×1180 and 800×1024.
  - Each size also had a live, untouched run, recording every frame: the board against the title page, the dog's opacity and the gilt edge's opacity.
  - Reduced motion was run at 1920 and 390 (first frame and settled).
- **Page changes, frame by frame:**
  - I wrapped `document.startViewTransition`, paused every `::view-transition-*` animation on `ready`, and set `currentTime` to 0, 40, 75, 80, 110, 130, 160, 200, 240, 280, 320, 380 and 460ms, plus the end.
  - **Normal motion:**
    - at 1920×1000: Sign in → Create account, Sign in → Forgot password, Create account → Sign in, Welcome → Sign in, Sign in → Welcome (the lockup), Verify "Change" and Join → Create account;
    - at 390×844: Sign in → Create account and Welcome → Sign in;
    - also Sign in → Forgot password at 1366×641 and Sign in → Create account at 5120×2560.
  - **Reduced motion:** Sign in → Create account at 1920 and 390, and Welcome → Sign in at 1920, at 0, 20, 40, 60, 74, 76, 100, 120, 149 and 151ms.
- **Keyboard:** the Tab order and focus rings on eight pages.
- **No form was submitted.**
  - Typing went only into the Sign in password field ("abcdef").
  - The only things I clicked were Show and navigation links: Create an account, Forgot password?, I already have an account, the front door's Sign in, Change, Join's Create an account, and the lockup.
- **Screenshots:** in `web-app/docs/agents/reviews/shots/`, all prefixed `r4-`. There are 186 of them:
  - every page at every size, with `-full` for scrolling pages;
  - the dog sheets, the ritual contact sheets, the transition contact sheets (`r4-vt-*-contact.png`) and the evidence crops named below.

## Round 3, finding by finding

| # | Round 3 finding | Now | Evidence |
| --- | --- | --- | --- |
| 1 | Show makes Bond's head jump 43px | **Fixed.** Peek's nose is within 0.8px of watch's at 1920 (rise −0.8, x +0.2). It is within 1px at every size up to 2560, and 2.0px at 5120. Size holds: nose 20.49px against 20.40. | `r4-dog-poses-1920x1000.png`, `r4-dog-poses-5120x2560.png` |
| 2 | The whole painting tilts and the paws rock | **Fixed to the lead's ruling.** The tilt is clamped to ±1.5° (measured −1.5 to +1.5 on every awake pose). The pivot is the middle of the paws on the rule (`transform-origin` 61.7% 100% for watch). By pixels, the claw columns that touch the rule (art x 420 and 540) do not move at any tilt at any size. Only the paws' rounded outer ends move, by 1px at 1920 and 2–3px at 5120. That is the geometry the ruling allows, and they never leave the rule. | `r4-dog-paws-tilt-5120x2560-2x.png` |
| 3 | Reduced motion blinks the book and shifts the old words | **Half fixed.** The book and title page no longer blink out: they cut at 75ms, invisibly. **The old words still move** (finding 2). | `r4-vt-signin-to-create-reduced-contact-1920x1000.png` |
| 4 | Invisible page swallows the front door's Sign in | **Fixed.** Hit area 96×44 at 1366×768 and 92×44 at 1366×641, no point stolen. | probe |
| 5 | Phone caption over the epigraph's rule | **Fixed.** The epigraph is now in flow. At 390 on Sign in the last caption ends at 1536 and the line starts at 1583. Create account, Verify and `/c/nobody` all keep 45px or more. | `r4-sign-in-390x844-full.png` |
| 6 | 1366×641 plate links on the flourishes | **Fixed.** The links sit 15.7% in from each side of the plate and 19% above its foot, the same proportions as at 1920. | `r4-sign-in-1366x641.png` |
| 7 | Phone "Read this page" alone | **Fixed.** On a phone, "Open the book" and "Read this page" are both full-width 44px buttons. At 800 and 820 they share one row with "Front cover". | `r4-welcome-390x844-full.png` |
| 8 | Front door's book small | **Mostly fixed.** The cover is 624px square at 1920 (was 559), 443 at 1366×768 (was 397) and 402 at 1366×641 (was 377). The leaf still rests about 100px between its paper swatches (foot at 675) and the buttons (top 775). That is within "one deliberate rest per page", so I have not counted it. | `r4-welcome-1920x1000.png` |
| 9 | Board's gilt edge pops at 2.0s | **Fixed.** The gilt and drop are now `.board-edge`, which fades with the back: opacity 1 at 1.75s, 0.075 at 1.85, 0.0015 at 1.95 and 0 at 2.0, when the board is hidden. | `r4-ritual-leftpage-1750-2050-1920x1000.png` |

## What holds (fresh pass)

- **Scroll:**
  - no horizontal scroll on any of the 88 pairs;
  - no vertical scroll at any book-layout size (1366×768, 1366×641, 1920×1000, 2560×1300 and 5120×2560).
- **One scale:** `--fit` is identical across every AuthFrame page at each size: 0.9000, 0.7792 and 1.1875.
- **Text size:** the smallest text is 13px or more everywhere. The one exception is the sample cover's printed date at 12px on a phone (rule 22).
- **Targets:** every target hits 44px or more. Only the round cover swatches' corner sample points miss, which is their border-radius, not another control.
- **Headings** are two lines or fewer. There are no console errors.
- **Bond:**
  - **Moods:** watch on Sign in and Forgot, curious on Create account (all three) and Join (both), curious on `/c/nobody`, sleep on Verify (both), cover on the password, and peek on Show.
  - **One head position.** On Sign in, the nose stands 40.2px above the plate's rule at 1920 in watch, cover and peek (41.0 in peek). On Create account the same holds for curious at every pointer and focus. At 1366×768 the figure is 30.5px, and at 5120 it is 102.8px.
  - **Pointer and touch.** He follows the pointer on every mouse size, the front door included. On touch he holds still except toward the focused field.
  - **No added layers:** nothing is drawn over the painting.
- **The ritual is clean frame by frame at every size:**
  - **Desktop:** the foil tools on, the board swings (0.9–1.8s), the prints settle and the dog arrives. The stage ends "open", with every print, the plate, the dog and the line at opacity 1.
  - **Stacked:** the board is the title page's own height (786 of 786 at 390, 779 of 779 at 820 and 800). The title leaves by 0.7s, the board fades from 0.7 to 0.95s, and the dog arrives after it has gone.
  - **Reduced motion:** the book is simply open at the first frame.
- **Page changes between book pages with normal motion** are one clean turn:
  - the old words are gone by 110ms, the cut is at 120ms, and the new words rise from 130ms;
  - this holds at 1920, 1366×641, 390 and 5120, and on Verify's "Change", which now carries the address;
  - Welcome → Sign in clears the bench by 75ms, then the open book fades in whole, its album decoded.
- **Keyboard:**
  - the focus rings are brass on the cloth and ochre on the paper, and the field's ring wraps the whole line (`r4-focus-email-1920x1000.png`);
  - the Tab order is logical on all eight pages tested.

## Findings, worst first

1. **Going back to the front door double-exposes two whole pages.**
   - **What happens:**
     - Pressing the lockup on any book page starts a cross-dissolve of the open book and the front door, both partly visible from 0 to about 160ms.
     - At 40ms the screen shows two dogs, two "A Story" lockups, the sign-in form over the sample cover, and the album's prints over the leaf's text.
     - The forward direction (Welcome → Sign in) clears the bench before the book comes. This direction does not.
   - **Cause:**
     - The old `auth-*` layers fade over 160ms as `:only-child`.
     - Meanwhile `::view-transition-new(root)`, the front door, fades in at once over 260ms (astory.css §3512–3513).
   - **Where:** `signed-out.css` §3, the `:only-child` rules, with the root animation from astory.css.
   - **Size:** all sizes; 1920×1000 is shown.
   - **Evidence:** `r4-vt-signin-to-welcome-040ms-1920x1000.png`, `r4-vt-signin-welcome-1920x1000-contact.png`.
   - **Rules:** 23a ("Nothing jumps or flashes"), and the file's own rule "never two forms at once".
   - **Fix:** Mirror the forward turn when arriving at the door:
     - fade the old book out in 120ms: `::view-transition-old(auth-*):only-child`;
     - hold the door until the book has gone: `:root:has(.door)::view-transition-new(root) { animation: 320ms var(--ease-out) 140ms both vt-appear; }` and `:root:has(.door)::view-transition-old(root) { animation: 120ms var(--ease-out) both vt-fade; }`.

2. **Under reduced motion the old words still move onto the flourishes, and the front door blanks to bare cloth** (round 3 finding 3, second half).
   - **The words:**
     - Sign in → Create account at 1920: at 20–74ms the old "Sign in." is drawn about 30px below where it was. "Forgot password?" and "Create an account" sit on the plate's corner flourishes.
     - At 0ms they are about 17px above where they were.
     - At 390 the old "Sign in." is drawn over the plate's top frame and its heart.
     - **Cause:** astory.css line 3527 sets `::view-transition-group(*) { animation: none !important }` under reduced motion. That removes the group's animation-name. The `animation-duration: 75ms !important` and `steps(1, end)` that `signed-out.css` §3 adds are longhands and cannot bring it back. The pause log shows the `auth-plate` and `auth-line` groups have no animation at all, so the old words are drawn at the new paper's geometry from the first frame.
   - **The front door:**
     - Welcome → Sign in under reduced motion shows bare cloth from 0 to 75ms.
     - **Cause:** the root has no animation (the same astory.css rule), so the door goes at once. The `!important` reduced rule `vt-cut-in 75ms steps(1, end)` overrides the `:only-child` appear on the new book.
   - **Where:** `signed-out.css` §3, the `prefers-reduced-motion` block, against astory.css line 3527.
   - **Sizes:** every page change under reduced motion. Measured at 1920×1000 and 390×844.
   - **Evidence:**
     - `r4-vt-reduced-frames-vs-rest-1920x1000.png` (at rest, 0, 20 and 40ms, with a red line at the resting heading);
     - `r4-vt-signin-to-create-reduced-contact-1920x1000.png`, `r4-vt-signin-create-390x844-reduced-contact.png`;
     - `r4-vt-welcome-signin-reduced-contact-1920x1000.png`.
   - **Rules:** 23a, 25, and DESIGN.md "Reduced motion collapses to a 150 ms crossfade".
   - **Fix:**
     - **The words:** under reduced motion, never draw the old words: `::view-transition-old(auth-plate), ::view-transition-old(auth-line) { display: none !important; }`. The plate is then empty for 75ms before the new words appear in the next 75ms. Alternatively, ask the lead to exempt the `auth-*` groups from line 3527.
     - **Into or out of the book:** give the `:only-child` layers and the root a 150ms linear crossfade (`vt-appear` and `vt-fade`, `!important`), so the cloth never shows bare.

3. **The lockup changes size and place between the front door and every book page.**
   - **Measured:**

     | Size | Front door | Book pages |
     | --- | --- | --- |
     | 1920 | 114×36 at x 56, y 34 | 134×42 at x 72, y 35 |
     | 1366 | 114×36 at x 41 | 101×32 at x 55 |
     | 390 | 114×36 at x 16 | 101×32 at x 32 |

   - **What happens:**
     - The mark jumps 14–16px sideways and resizes by 12–18% on every move between the door and the book, in both directions.
     - It is not a named view-transition layer, so it also ghosts during finding 1.
   - **Where:** `.door-top` padding and `.door-top .brand`, against `.auth .brand`. Welcome renders `Lockup height={36}`, and AuthFrame the same, but the book pages scale it with the page.
   - **Sizes:** all.
   - **Evidence:** `r4-welcome-1920x1000.png` against `r4-sign-in-1920x1000.png`, and the doubled lockup in `r4-vt-signin-to-welcome-040ms-1920x1000.png`.
   - **Rule:** 23a ("the bar holds").
   - **Fix:** Draw the lockup at one size and one place on both pages, and give it one `view-transition-name` (for example `brand`) on both, so it holds still through the turn.

4. **At 1366×641 the lockup sits on the book's top-left corner.**
   - **What happens:**
     - The short-window rule sets `.auth .spread-wrap { padding-top: 58px }`.
     - The left page starts at x 122, y 58. The lockup's drawn mark runs to x 156, y 65.
     - So the "ory" of "Story" and the descender of the "y" overlap the page by about 7px.
     - Every AuthFrame page is affected at this size. 1366×768 is clear by 9px; the front door is clear.
   - **Where:** `signed-out.css` §7, `@media (min-width: 1181px) and (max-height: 720px)`.
   - **Size:** 1366×641, and by the same rule any short desktop window.
   - **Evidence:** `r4-lockup-on-book-1366x641.png` (left: 641; right: 768 for comparison).
   - **Rule:** checklist (no overlapping), rule 10.
   - **Fix:** Keep 8px between the lockup and the book. Either raise this rule's top padding to about 72px, or set the lockup at 28px tall and 14px from the top at this size.

5. **Stacked, the front door's three family rows are 720px bars holding a 118px name each.**
   - **What happens:**
     - At 800×1024 and 820×1180 each family button is 720×52px. "Carolyn Bennett" is 118px of it, and the chosen one wears a full-width pill border.
     - At 390 each is 366×52.
     - The subtitles that say what each book is ("A family memoir", "A founder's ledger", "A veteran's homecoming") are hidden. The laptop rule `@media (max-width: 1599px) { .door .sb-books button small { display: none; } }` also catches the stacked range, where there is room for them.
   - **Where:** `signed-out.css` §6 (the max-width 1599 rule) and §7 (`.door .sb-books { grid-template-columns: minmax(0, 1fr) }`).
   - **Sizes:** 800×1024, 820×1180 and 390×844.
   - **Evidence:** `r4-welcome-800x1024-full.png`, `r4-welcome-390x844-full.png`.
   - **Rules:** 9 (no card huge for a small amount of information), 39 (choices carry a specimen).
   - **Fix:**
     - Limit the subtitle-hiding rule to the book layout: `(min-width: 1181px) and (max-width: 1599px) and (min-aspect-ratio: 5/4)`.
     - At 800 and 820, set the three families as a three-column row of cover chip, name and subtitle.

## Notes for the lead (not counted)

- **Sleep still lies lower than the others.** Its nose is 22.6px above the rule at 1920, against watch's 40.2. Its size holds (20.46px). It is the only pose on Verify and is only ever reached by a page change, so under rule 27's "every pose on one page" it passes. It is the same call as round 3.
- **The sample cover's printed date is 12px on a phone.** That is the book's own printing (rule 22). The CSS comment in §6 still says "never under 13px", so the comment is wrong, not the page.
- **Verify's "Change"** now keeps the address on Create account.

## Not verified

- **Microsoft Edge itself, and a real touch device.** Everything ran in headless Chromium.
- **Anything behind a submit:**
  - errors after a submit;
  - Create account step 2 (the password step, so cover and peek were filmed on Sign in only);
  - Forgot password step 2;
  - a confirmed or signed-in `/join`;
  - a `/c/:slug` with a real slug.
- **The 220ms crossfade between poses at full speed.** Head positions are measured from settled frames.
- **Reduced-motion page changes at sizes other than 1920 and 390.** The cause in finding 2 is size-independent.
