# Bao's Standard: signed-out pages, round 1

**Verdict: FAIL.** These pages are not client-ready yet.

Each page at rest, at the founder's four sizes and when zoomed out, is close. The book fills large windows, nothing scrolls on a desktop, and the dog works. What fails is the moving between pages. The transitions double-expose two forms at once, the book changes size from page to page, and the opening ritual flashes a mirrored wordmark. On top of that, a real laptop viewport or a tablet shrinks the whole book until the Sign in button reads at 9–11px.

## How this was checked

- Headless Chromium 1243 through Playwright (`09142026/node_modules/playwright`), with no session. Dev server at http://localhost:5180.
- Sizes: 1366×768, 1920×1000, 2560×1300, 390×844, 1920×950 and 5120×2560 (the zoomed-out Edge). I also checked 1366×641, which is a 1366×768 laptop once Edge's own bars are taken off, plus 1366×600, 820×1180 and 1024×1366.
- Pages: `/welcome`, `/sign-in`, `/create-account`, `/forgot-password`, `/verify` with and without `?email=`, `/join/ABCD-EFGH`, `/join/bad`, `/join/K7M2QX` (a well-formed code, signed out) and `/c/nobody`.
- Measured with JavaScript at every size: scrollWidth and scrollHeight, the book's rect and `--fit`, html zoom, the smallest text in screen pixels (font-size × cumulative zoom), text that overlaps, things poking out of the pages, and targets under 44px.
- Interactions tested: the opening ritual (frames at 150, 700, 1300, 1700, 1850, 1900, 2000 and 3200ms), reduced motion, pointer drift, hovering prints 1 and 3 (the flip), focusing the email and password fields, typing, Show and Hide, blur, the keyboard Tab order and focus rings, and three moves: Sign in → Create account, Sign in → Forgot password and Welcome → Sign in. On the front door I also checked choosing a family, Open the book and the cloth stamp.
- **No form was submitted.** I never pressed Sign in, Continue, Send the code, Try this code or Create account.
- Screenshots are in `web-app/docs/agents/reviews/shots/`.

## What holds

- **No horizontal scroll at any size.** On phones html and body are `overflow-x: clip`; the lamp is 1100px wide on a 390px phone but stays clipped.
- **No vertical scroll on desktop.** At every desktop size the page height equals the window height.
- **The book scales to fill large windows.** It takes 82–94% of the width and about 85% of the height. At 5120×2560 the html zoom is 2.56, the fit is 1.159 and the shape holds.
- **The dog's five states are all correct.** It watches on Sign in, is curious on Create account and Join, sleeps on Verify, covers its eyes on the password and peeks on Show. The eye glint and the head follow the pointer and look along the line while typing.
- **The prints behave.** They drift up to 3px, lift on hover, and print 3 turns over to show its back.
- **The ritual finishes.** Afterwards nothing is left hidden or half-faded.
- **Reduced motion works.** The book is open at once, with no board, no drift and no glint following the pointer, and the dog still covers its eyes.
- **No console errors on any page.**

## Findings, worst first

1. **Every change between signed-out pages double-exposes two forms, and the front door's handoff loses the right page.**
   - **Where:** `signed-out.css` §3 (`::view-transition-old(auth-plate)` fades out over 160–360ms while `::view-transition-new(auth-plate)` rises over 0–260ms), and `.door-leaf`/`.leaf-r` sharing `auth-title`.
   - **Sizes:** all desktop sizes.
   - **Evidence:**
     - `shots/vt-signin-to-create-250ms-1920x1000.png`: "Sign in." sits over "Your name", there are two Email labels, and the old Sign in button and "New here?" spill below the plate's frame.
     - `shots/vt-signin-to-forgot-200ms-1920x1000.png`: the heading reads "Forgot Sign password?" and two primary buttons show at once.
     - `shots/vt-welcome-to-signin-60ms-1920x1000.png` and `-120ms`: the cream title page is missing, a ghost form floats on the cloth, and the three album prints are blank grey boxes.
   - **Rules:** 23a, 25.
   - **Fix:** Make the plate change sequential: old words out by 120ms, new words in from 120ms. Snapshot only the paper's contents, never the old paper's full height. Give the front door's leaf → title page morph a real old snapshot, and decode the album images (`img.decode()`) before calling `startViewTransition`.

2. **The book is a different size on Sign in than on every other signed-out page, so it visibly grows or shrinks when you move between them.**
   - **Where:** `bookFit.ts` `useFit` measures each page's natural height (`natH`) separately; Sign in's plate is the tallest.
   - **Sizes:** all desktop sizes.
   - **Evidence:**
     - 1920×1000: fit 1.160 and the spread is 1670px wide on `/sign-in`, against fit 1.188 and 1711px on create-account, forgot, verify, join and `/c`.
     - 1366×768: 1266px against 1296px.
     - The size has already jumped by 120ms into the transition (interaction log). Mid-transition the book's foot shows a doubled edge (`vt-signin-to-forgot-200ms-1920x1000.png`, bottom of both pages).
     - AuthFrame's own comment promises "the book holds still".
   - **Rules:** 12, 23a.
   - **Fix:** Fit all AuthFrame pages to one shared design height, the tallest plate's (or a fixed 720 + plate allowance), so `--fit` is identical across `/sign-in`, `/create-account`, `/forgot-password`, `/verify`, `/join` and `/c`.

3. **On a real laptop viewport and on tablets the whole book scales down, controls included: the primary button drops to 9–11px text in a 28–34px button. On a portrait tablet the book is a strip with most of the screen empty cloth.**
   - **Where:** `bookFit.ts` (fit clamps to 0.5; `STACKED` is width-only, `max-width: 760px`) and `signed-out.css` §1–2 (`--floor` covers small print but not `.btn`, inputs or headings).
   - **Evidence:**

     | Window | Page | Sign in label | Button height | Other |
     | --- | --- | --- | --- | --- |
     | 1366×641 (a 1366×768 laptop in Edge) | Sign in | 10.9px | 34px | |
     | 1366×641 | Welcome | 11.6px ("Begin a book") | | "APRIL 23, 2026" at 8.7px |
     | 1366×600 | Sign in | 9.8px | | |
     | 820×1180 | Sign in | 8.9px | 28px | book 801×450 in a 1180-tall window; 62% empty cloth (`shots/sign-in-820x1180.png`) |
     | 820×1180 | Welcome | 8.6px (buttons) | | family names 9.6px |

     At 1366×768 itself, the fit of 0.88–0.90 already makes the fields 39px tall and the cover swatches 39×39.
   - **Rules:** 11, 12, 16, checklist (12px floor, 44px targets).
   - **Fix:**
     - Floor the controls in screen pixels the way small print already is: buttons, inputs, the Show control and plate headings ≥ 16px text and ≥ 44px tall at any `--fit`.
     - Switch to the stacked layout when the window is portrait or too short (for example `(max-aspect-ratio: 5/4)` or a fit below about 0.75), not only below 760px wide.

4. **The opening ritual flashes a mirrored, gold "AStory" lockup and its rule across the left page.** Seen at about 1.75–1.95s, while the prints settle.
   - **Where:** `AuthFrame.tsx` timeline `.to(board, { opacity: 0 … }, 1.75)` on `.board`, which is `transform-style: preserve-3d` (`astory.css` 2321). Opacity below 1 flattens the 3D context, so `backface-visibility: hidden` on `.board-front` stops working.
   - **Size:** 1920×1000 (first visit per session).
   - **Evidence:** `shots/ritual-ghost-1850ms-crop.png` and `shots/ritual-1900ms-1920x1000.png`.
   - **Rules:** 25 (craft); it is the first thing a new visitor sees.
   - **Fix:** Fade `.board-back` (or set the board to `visibility: hidden` at 1.75s) instead of tweening opacity on the preserve-3d parent.

5. **On every page whose plate is shorter than Sign in's, the plate stays pinned under the rule and the bottom of the title page is empty cream.**
   - **Where:** `signed-out.css` `.auth .titlepg` (`justify-content: flex-start`), `.tp-rule` (`margin-bottom: 80px`).
   - **Evidence at 1920×1000:**

     | Page | Empty cream below the plate |
     | --- | --- |
     | `/verify` with no email | 268px (31% of the page) |
     | `/c/nobody` | 198px (23%) |
     | `/forgot-password` | 158px (18%) |
     | `/verify?email=` | 152px (18%) |
     | `/join/bad` | 143px (17%) |
     | `/create-account` | 127px (15%) |
     | `/sign-in` (for comparison) | 33px (4%) |

     Shots: `verify-1920x1000.png`, `c-nobody-1920x1000.png`, `create-account-1920x1000.png`. The same at every desktop size.
   - **Rules:** 11, 12 ("it's a bit plain and the ratio is off").
   - **Fix:** Centre the plate (with the dog) in the space between the rule and the page foot, using `margin-block: auto` on `.plate-wrap`, so every plate sits on the page the way Sign in's does.

6. **`/join` says things that are not true.**
   - With a malformed code (`/join/ABCD-EFGH`, `/join/bad`), the title page reads "Your family's book has a place for you." directly above "This code doesn't look right."
   - With any well-formed code, checked or not (`/join/K7M2QX`), the plate says "A place is kept for you. Someone in your family saved it with this code." The code is only checked after the visitor has made an account.
   - **Where:** `Join.tsx` (the `promise` prop, and the `!user` plate).
   - **Evidence:** `join-abcd-1920x1000.png`, `join-valid-1366x768.png`.
   - **Rules:** 20, 42.
   - **Fix:** Use the default promise (or "Join your family's book.") when the code is malformed, and say "If this code is right, a place is kept for you" until the server has confirmed it.

7. **The invitation's second print is captioned "Nan, the year she turned seventy", a stranger presented as the family's own, and `/join` carries no sample label.** This is the page an invited relative sees first. The sign-in album has "Photographs from a sample family's book."; `/join` has nothing.
   - **Where:** `Join.tsx` `Invitation`, `figcaption`.
   - **Sizes:** all.
   - **Evidence:** `join-valid-1366x768.png`.
   - **Rules:** 20, 21; DESIGN.md: "Sample content is labelled as sample", "Never a borrowed scene presented as the family's own".
   - **Fix:** Drop the caption, or mark it as a sample in the one disclosure line used on the sign-in endpaper.

8. **Many targets are under 44px.** The same fault appears on every signed-out page.
   - **Sizes:** 1366×768, 390×844.

     | Where | Target | Size |
     | --- | --- | --- |
     | 1366×768 (the 0.88–0.90 fit) | Email and password fields | 39px tall |
     | 1366×768 | Show | 48×39 |
     | 1366×768 | "Forgot your password?" | 28px |
     | 1366×768 | "Create an account" | 16px tall |
     | 1366×768 | "Sign in" link on create-account | 16px |
     | 1366×768 | "Back to sign in" | 16px |
     | 1366×768 | "What is A Story?" | 16px |
     | 1366×768 | Welcome cover swatches | 39×39 |
     | 1366×768 | Welcome "Open the book" and "Read this page" | 39px tall |
     | 1366×768 | Welcome "Use it here" | 28px |
     | 390×844 | The same inline links | 19px tall |
     | 390×844 | Verify digit boxes | 36×41 |
     | 390×844 | "What joining means ↓" | 19px |
     | All sizes | The lockup link | 32px |

   - **Where:** `.auth.ritual .switch a`, `.legal a`, `.forgot`, `.door-code a`, `.brand`, `.code input`.
   - **Evidence:** the `smallTargets` measurements.
   - **Rule:** checklist (44px targets).
   - **Fix:** Give inline links a 44px hit area with `display: inline-flex; min-height: 44px`, or a padded `::before`, and floor the controls as in finding 3.

9. **The front door's two columns don't line up, and its hero (the sample book) is small for the window.**
   - At 1920×1000 the leaf runs from y=200 to 860, while the book column runs from 108 (the family picks) to 945 (the note): neither tops nor feet align.
   - The closed book, the page's one hero ornament, is about 515×512px, roughly 14% of the screen.
   - The "Front cover / Open the book / Read this page" row is centred about 85px right of the book's centre.
   - **Where:** `signed-out.css` §6, `.door-canvas` (`align-items: center`) and `.door-book`.
   - **Sizes:** all desktop sizes.
   - **Evidence:** `welcome-1920x1000.png`, `welcome-1366x768.png`.
   - **Rules:** 8, 10.
   - **Fix:** Align the leaf's top with the family picks (`align-items: start`, or stretch both), and let the book take the height the picks, swatches and dots currently waste. For example, put the swatches on one line beside the family picks so the book can grow by about 120px.

10. **Opening a dark-covered sample book on the front door shows a flat, edge-less dark rectangle.** Checked with Raymond Ortiz's book, Forest cover: its first spread is a forest endpaper with no page shadow, no page-block edge and no gutter.
    - **Where:** `Welcome.tsx` / `.door .bk-spread > .bk-page:not(.blank)`. The shadow skips the blank endpaper pages.
    - **Size:** 1920×1000.
    - **Evidence:** `welcome-open-book-1920x1000.png`.
    - **Rules:** 15a (decoration-2026 §5 Landing: the book gets D2b edges). This is the same "dark board on the brown cloth reads as a hole" ruling that Welcome.tsx's own comment cites.
    - **Fix:** Give the open spread, endpapers included, the same page shadow and gilt page-block edge as the closed book.

11. **The dog lies on a shelf that hangs in the air.** The ledge under its paws (the drawn strip at the foot of `watch.png`) runs about 115px left of the plate, over empty page.
    - **Where:** `signed-out.css` `.auth .companion` (`left: 0.5%`).
    - **Sizes:** all, on every AuthFrame page.
    - **Evidence:** `dog-ledge-zoom-1920x1000@2x.png`: dog box x 977–1158, plate left edge 1088.
    - **Rules:** 27, craft.
    - **Fix:** Move the dog right until its ledge starts at the plate's left edge, or mask the ledge so only the paws rest on the plate's rule.

12. **For the first 1.3s of the ritual the closed book is chocolate board on chocolate cloth, sitting in the right half of an otherwise empty screen.** Only a 1–2px gilt edge separates book from bench.
    - **Where:** `astory.css` `.auth .board-front`.
    - **Size:** 1920×1000.
    - **Evidence:** `ritual-700ms-1920x1000.png`.
    - **Rules:** 15 (the "something more wow" bar), and the founder's dark-board-on-brown ruling.
    - **Fix:** Give the closed board a tonal step from the bench (deeper, plus the debossed frame and the page-block edge stack visible on its foot and fore-edge), so the closed book reads as an object before it opens.

13. **On a phone the front door's three family names are centred while their subtitles are left-aligned.** The names start at x=43, 47 and 70 over subtitles all at x=43.
    - **Where:** `.door .sb-books button b` (`text-align: center`).
    - **Size:** 390×844.
    - **Evidence:** `welcome-390x844.png`; Range measurement.
    - **Rule:** 10.
    - **Fix:** `text-align: left` on the `b`.

14. **The lockup link's keyboard focus ring is the browser's blue (rgb(60, 143, 180)) on the brown cloth.** Every other control's ring is ochre. This happens on every signed-out page.
    - **Where:** `.auth .brand`, `.door-top .brand`.
    - **Sizes:** all.
    - **Evidence:** the Tab-order log.
    - **Rules:** decoration §6 (no teal on brown), checklist (focus-visible).
    - **Fix:** `outline: 2px solid var(--brass); outline-offset: 4px` on the brand link's `:focus-visible`.

15. **`/c/nobody` offers two actions, and its primary one ("Try the link again") cannot fix the cause the copy names** (a closed link, or a letter missing from the address).
    - **Where:** `Contribute.tsx` (the `info === null` branch).
    - **Sizes:** all.
    - **Evidence:** `c-nobody-1920x1000.png`.
    - **Rule:** 42 (one action).
    - **Fix:** Make "What is A Story?" the one action, or keep a quiet retry only when the request failed on the network.

16. **The emailed-code step of `/verify` has no way back.** There is no "Change" for a mistyped email and no route to Sign in until the 45s resend link appears. `/forgot-password`'s code step has "Change".
    - **Where:** `Verify.tsx`.
    - **Sizes:** all.
    - **Evidence:** `verify-email-1366x768.png`.
    - **Rule:** 1 (the same pattern, everywhere).
    - **Fix:** Add the same "The code went to *x* · Change" line used on Forgot password.

## Not verified

- **Anything behind a submit:** error states after submitting, Create account step 2, Forgot password step 2, and the signed-in states of `/join`. The brief said not to submit. The error styling was read in code only.
- **The `/c/:slug` contribute leaf with a real slug.** None was known; only the not-available state was seen.
- **A real touch device.**
- **Microsoft Edge itself.** Everything ran in headless Chromium, so findings 1 and 4 should be confirmed by eye in Edge. Both frames were captured at real timings, in two separate runs.

The decoration assets (`public/deco/`, D1 marbled band) don't exist yet. Per decoration-2026 §7 they are the founder's to generate, so I have not counted them as a defect.
