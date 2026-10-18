# Signed-out pages, round 7: skills review

**Verdict: GAPS. There is 1 gap, and it is polish** (0 blockers, 0 ugly).

My round 6 gap is fixed, and so are both BAOS round 6 findings. I measured each fix and each one holds. The weave holds in every frame of every turn, and 1280×1024 and 1200×1000 now open the book with no scroll. The one gap is new to this report, but the code dates from round 6 and I missed it then. `paint` in `bookFit.ts` decides whether the fit changed by comparing `"0.9000"` with the browser's `"0.9"`. At any size whose fit ends in a zero, it re-applies `.fitting` when the fonts arrive. That cancels Bond's fade in mid-flight, so he jumps to full opacity in one frame. This happens at 1366×768 on every book page, and on the front door at 1920×1000 and 3840×2000. The fix is one line. With it, this round passes.

**The brief's checks, in short:**
- **Round 6 gap (`vw` without `--zoom`, ddc912e):** fixed. The side padding is 2.5% of the window and the tooled frame 1.6%, under the zoom too. At 1866×1200 the book fits at 1.0555 (round 6 measured 1.0463), and its left edge is 9 px inside the lockup again.
- **BAOS round 6 finding 1 (the old root holds):** fixed. The old root has `animation: none`, in the reduced-motion block too.
  - **Desktop:** in 64 turn runs at 1920, 2560, 1280×1024 and 1866×1200, no frame falls below 0.975 of the weave at rest. That covers 2131 real frames, with 0 below 0.95. Round 6 measured lows of 0.69, and real flat frames at 2560.
  - **Phone and tablet:** 0.991 or more (30 runs).
- **BAOS round 6 finding 2 (portrait only):** fixed in `bookFit.ts` and in §7. At 1280×1024, 1200×1000, 1181×1000 and 1181×1180 every route opens the book: no scroll, nothing under 13 px, every target 44 px or more. 1366×1366 and narrower windows still stack.
- **Resize and first-load probes:** 30 resizes and 2 drags end exactly where a fresh load does.
  - That includes the new 5:4 pairs, both ways across the stacking line.
  - 0 frames mix the new fit and zoom with the old.
  - 88 first loads at five sizes land on one fit per page.
- **Reduced motion, per frame:** 0 wrong-scale frames in 4485 canvas-frames, over 81 page changes at six sizes, plus 1133 at normal motion.
- **Bond:** 23 cold and warm runs, 6 in-app arrivals, and Join's success.
  - The rest pose is never torn down, and Join's success is never blank.
  - But at 1366×768 his fade is cut short (gap 1).
- **GSAP cleanup:** holds, with the same counts as round 6.

**Scope.**
- **This round's commits:**
  - ddc912e: `signed-out.css` §1, the side padding and the tooled frame divided by `--zoom`;
  - e092062: `signed-out.css` §3, the old root held; `bookFit.ts` `STACKED` and §7, `(max-aspect-ratio: 1/1)`.
- **Also touching these pages since round 6:** `Leaf.tsx` (f059ffb, the leaf fades on words), and `Shell.tsx`/`arrive.ts`, which no signed-out route uses.
- **Not reviewed:** the working copy carries another builder's uncommitted Bond v2 (`Companion.tsx`, the §2 and §6 dog sizes, and `public/dog/*`). It landed at 12:21. Every Bond run below ran before it, against the committed art and code.

**Skills loaded:**
- taste-skill: SKILL, the house rules.
- hallmark: slop-test, responsive, interaction-and-states.
- emil-design-eng: easing, duration and reduced-motion rules.
- impeccable: craft-floor.
- gsap-react and gsap-performance.
- gsap-scrolltrigger and gsap-timeline were checked against the code: these pages use no ScrollTrigger, and no timeline changed.
- `docs/BAOS-STANDARD.md` and `DESIGN.md`.
- No other installed skill applies.

## How it was checked

**Setup:**
- Playwright (`09142026/node_modules/playwright`), chromium headless, against `http://localhost:5180`, with commits up to f059ffb.
- Every context was new, with no session.
- Only fake values were used: `reader@example.test`, K7M2QX and "abc".

**Network guard:**
- Every non-GET request to Supabase was aborted and logged.
- The only one ever attempted was Contribute's read-only `POST rpc/get_contribute_info` on `/c/sample-slug`. It was aborted every time.
- Nothing was submitted.

**The weave.** For each turn, up to 12 bare-cloth patches were picked inside the page itself:
- **Picking a patch:** with the link already scrolled into view, `elementFromPoint` at the patch's corners had to return the page root or body. The same had to hold on the settled new page, and its rest reading had to agree within 15%.
- **Measuring a frame:** each frame's weave is the patch's luminance standard deviation as a share of its rest. The report takes the lowest patch in the lowest frame.
- **Paused frames:** every animation was paused on `ready` and seeked every 20 ms (10 ms under reduced motion).
- **Real frames:** a CDP screencast, 2 or 3 runs each.
- **The turns (8):** Sign in → door, door → Sign in, door → Create account, Verify → door, Sign in → Create account, Create account → Sign in, Join → Create account, and Verify's Change.
- **Motion:** each turn with normal and reduced motion.
- **Sizes:** 1920×1000, 2560×1300, 1280×1024 and 1866×1200, plus 390×844 at DPR 3 and 820×1180 at DPR 2.

**A trap for whoever measures the weave next.** Under Playwright's emulated DPR (`deviceScaleFactor` 2 or 3), Chromium paints the view transition's old snapshot soft. Paused frames then read 0.59–0.73 at 0 ms, even though nothing in the CSS dims anything.
- **Emulated DPR:** the same turn at 1600×900 reads 12.2 at 0 ms against 19.0 at rest.
- **A real device scale** (`--force-device-scale-factor=2`, no emulated metrics): it reads 18.9 against 19.0.

So the phone and tablet runs used a real scale factor without touch emulation. Some of round 6's low phone readings, mine and Bao's, will have been this.

**The other probes:**
- **Resize:**
  - **Pairs:** 30, each loaded at one size, resized, and compared with a fresh load at the new size. The comparison covers the fit, html zoom, layout, the book's width and left edge, and the scroll.
  - **New pairs this round:** 1600→1866×1200, 1866×1200→1700×1100, 1920→1700×1100, 2560→1866×1200, 1920→1280×1024, 1366→1280×1024 (door), 1280×1024→1200×1000, 1280×1024→1300×1024, 1280×1024↔1000×1100, 800×1024→1280×1024, 1280×1024→1920×1080, 1300×1000→1200×1000, 1200×1000→1866×1200, and 1280×1024↔1280×1290.
  - **Drags:** two, each of 31 sizes, 16 ms apart.
  - **Per frame:** a sampler through 12 of the resizes read html zoom, `--fit`, the canvas's computed zoom and the layout.
- **First loads:** 40 at 3840×2000, and 12 each at 1866×1200, 1700×1100, 1280×1024 and 1200×1000. They covered six routes, with the ritual played and skipped, and with and without reduced motion.
- **Reduced motion, per frame:** each canvas instance's computed zoom against its root's `--fit`, and against a fresh load's fit, through 9 page changes.
  - **Sizes with reduced motion:** 1920×1000, 1366×768, 2560×1300, 1280×1024, 1200×1000, 1866×1200 and 1700×1100.
  - **Sizes with normal motion:** 1920×1000, 1280×1024 and 1866×1200.
- **Bond:** a sampler on every frame read his box's opacity through its ancestors, and each pose's opacity and pixels. A MutationObserver watched the pose `<img>`s.
  - **Cold and warm runs:** Create account and Join, each cold, at 1 s, warm, with the ritual and with reduced motion. Sign in at 1 s as the control.
  - **The 5:4 sizes:** Sign in, Create account, Join, Verify and Forgot password, each at 1280×1024 and 1200×1000.
  - **In-app arrivals:** 6.
  - **Join's success:** `Companion.tsx` mounted alone with `watch` held 3 s on the wire.
  - **Where his fade was cut:** a second probe logged `transitionstart`, `transitioncancel` and `transitionend` on the poses, and the class and style mutations on the root.
- **GSAP cleanup:**
  - **The patch:** I served the `gsap` dependency with a hook before its exports, so `context`, `quickTo` and `matchMedia` are counted from the first module evaluation, on the door too.
  - **The route:** the front door, 10 moves, Sign in, 20 moves, the email typed, the password focused, then Forgot password.
  - **Runs:** at 1920 with the ritual skipped and played, and at 1280×1024.
- **Fresh sweep, 280 renders:**
  - **Routes:** all 10.
  - **Sizes:** the round 6 set, plus 1181×1000, 1181×1180, 1366×1366, 1700×1100 and 1866×1200. With and without reduced motion at 1280×1024, 1200×1000, 1181×1000, 1181×1180 and 1366×1366.
  - **Measured:** scroll, heading lines, the smallest text in screen px, each control's real hit, wrapping affordances, part-faded objects and console errors.
- **Side padding, tooled frame and lockup:** at 1600×1000, 1700×1100, 1866×1200, 1920×1080, 2560×1300, 1280×1024 and 1200×1000.
- **Mechanical scans:**
  - `impeccable detect`: 0 anti-patterns and 59 advisories, as in rounds 4–6.
  - taste `lint.mjs`: 2 FAIL and 8 WARN, as in round 6. The 2 FAIL are Contribute's running head, accepted since round 1. The 8 WARN are outline buttons and the kind toggle.
- **Screenshots** are in `docs/agents/reviews/shots/`, named `signed-out-r7-skills-{1280x1024,1200x1000}-{signin,door,join,create,verify}.jpg`.

### What holds

**My round 6 gap is fixed (ddc912e).** Both lengths now follow the window under the html zoom. In screen px:

| Window (zoom) | Side padding | 2.5% of window | Tooled frame | 1.6% of window | Book left / lockup |
| --- | --- | --- | --- | --- | --- |
| 1600×1000 (1) | 40 | 40 | 25.6 | 25.6 | 40 / 48 |
| 1700×1100 (1.0625) | 42.5 | 42.5 | 27.2 | 27.2 | 43 / 51 |
| 1866×1200 (1.1663) | 46.7 | 46.65 | 29.9 | 29.9 | 47 / 56 |
| 1920×1080 (1.08) | 48 | 48 | 30.2 | 30.7 (capped at 28 CSS px = 30.2) | 48 / 57 |

- At 1866×1200 the book fits at 1.0555, essentially the 1.0556 of the window's width. Round 6 measured 1.0463 there.
- The book's left edge sits 9 px inside the lockup again, where round 6 measured 2.
- 2560 and 3840 are unchanged, because both lengths are at their caps.

**BAOS round 6 finding 1 is fixed: the weave holds through every turn (e092062).**
- **The code:** `:root:has(.door, .auth)::view-transition-old(root) { animation: none; }` is outside the reduced-motion block. Inside it, `display: block !important; animation: none !important`. The new root keeps its 260 ms fade (150 ms linear under reduced motion), so the old page shows only until the new one is opaque over it.
- **Paused frames:**

  | Size | Book ↔ door | Book → book |
  | --- | --- | --- |
  | 1920×1000 | 0.975 (reduced motion) to 0.978 | 0.994 or more |
  | 1280×1024 | 0.978 to 0.985 | 0.996 or more |
  | 2560×1300 and 1866×1200 | 0.997 or more | 0.997 or more |
  | 390×844 at DPR 3 | 0.994 | 0.999 |
  | 820×1180 at DPR 2 | 0.991 | 0.999 |

- **Real frames:** 2131 on the desktop sizes, lowest 0.977, 0 below 0.95. Round 6 had flat frames (0.07–0.13) at 2560.
- **Leaving the signed-out pages** (into the app after sign-in), the `:has` rule matches nothing and the house crossfade applies. Signing out to the front door holds the app page whole while the door fades in over it, which is also clean.
- **The §3 comment** describes this now.
- **No longer reproducible:** the round 6 dim at every turn, and the flash at 2560.

**BAOS round 6 finding 2 is fixed: a 5:4 desktop opens the book (e092062).**
- **The code:** `STACKED` and §7 both read `(max-width: 1180.98px), (max-aspect-ratio: 1/1)`. The §7 comment and `bookFit.ts`'s comments say the same thing.
- **At 1280×1024:**
  - **The fit:** the book is at 0.8444 (1216×608) and the door at 0.7713.
  - **The page:** no scroll on any route, and the smallest text is 13 px.
  - **Targets and words:** every target is at least 44 px both ways, no heading runs over two lines, and nothing is left part-faded.
  - **The door's chips** show the names only, the same rule as 1366×768: under 1600 CSS px the subtitles hide on the spread.
- **At 1200×1000 (book 0.7917, door 0.7231), 1181×1000 and 1181×1180:** the same results.
- **1366×1366 and 1000×1100** stack and scroll, as a square or portrait window should.
- **By eye** (`-1280x1024-signin`, `-door`; `-1200x1000-join`): the book sits whole on the cloth, with about 200 px of cloth above and below. That is the bench seen from further back, not an empty screen.

**Resizes hold across the new stacking line.**
- All 30 resizes and both drags end identical to a fresh load: fit, html zoom, layout, width, left edge and scroll. Examples:
  - 1920→1280×1024 lands on 0.8444, zoom 1, no scroll;
  - 1280×1024→1000×1100 lands on stacked, scroll 547, the same as fresh;
  - 1280×1024→1280×1290 stacks, and going back opens the book again.
- **Per frame:** 0 frames mix the old and new pairs, and the canvas's zoom equals `--fit` in every book frame. Each change lands in one step 90–170 ms after the resize.
- **First loads:** 88 of 88 land on one fit per page and size with nothing overflowing:

  | Window | Book | Door |
  | --- | --- | --- |
  | 3840×2000 | 1.1875 | 1.1590 |
  | 1866×1200 | 1.0555 | 0.9641 |
  | 1700×1100 | 1.0556 | 0.9641 |
  | 1280×1024 | 0.8444 | 0.7713 |
  | 1200×1000 | 0.7917 | 0.7231 |

**Reduced motion, per frame: no page change draws the book at the wrong scale.** There are 0 wrong canvas-frames, counted against both the canvas's own `--fit` and a fresh load's fit:

| Size | Reduced motion | Normal motion |
| --- | --- | --- |
| 1920×1000 | 522 | 379 |
| 1366×768 | 560 | |
| 2560×1300 | 391 | |
| 1280×1024 | 536 | 479 |
| 1200×1000 | 564 | |
| 1866×1200 | 474 | 275 |
| 1700×1100 | 475 | |

That is 4485 canvas-frames under reduced motion and 1133 at normal motion.

**Bond, apart from gap 1:**
- **No teardown:** no pose `<img>` is removed in any run.
- **Cold runs at 1 s, on every page and size,** including Sign in, Create account, Join, Verify and Forgot password at 1280×1024 and 1200×1000: he draws 0.31 on the first frame and is full 113–121 ms later (0.111 and +130 ms under reduced motion).
- **In-app arrivals** fade 0.31 → 0.56 → 0.74… as in round 6. Join → Create account, with the picture already decoded, arrives inside the turn, as accepted in round 6.
- **Join's success with `watch` 3 s on the wire:** blank for 0 ms. `curious` holds until `watch` lands at 3236 ms.

**GSAP cleanup holds, with the same counts as round 6.**
- **The door:** 2 contexts, 8 `quickTo` and 3 `matchMedia`.
- **At Sign in:** 6 contexts, 4 reverted, and 24 `quickTo`. It stays at 24 after 20 moves and after typing.
- **After Forgot password:**
  - nothing in GSAP targets the old prints, head or dog, and the old prints carry no inline transform;
  - 10 contexts made and 8 reverted, the 2 left belonging to the open page;
  - 3 `matchMedia` made and 2 reverted. The one left is ScrollTrigger's own (from its stack trace, `ScrollTrigger.register`).
- **Repeats:** the same with the ritual played, and at 1280×1024, where the prints' parallax now runs because the book is open.

**The fresh sweep, 280 renders:**
- **Scroll:** no horizontal scroll anywhere, and no vertical scroll in any book layout.
- **Headings:** none runs over two lines.
- **Targets:** every hit is at least 44 px both ways.
- **Text:** nothing is under 13 px, except the sample cover's date at 12 px on the phone (rule 22, as in rounds 4–6).
- **Opacity:** nothing is part-faded except the designed 0.90 captions.
- **Console:** no errors except the guard's own aborted request on `/c`.
- **One probe flag:** "Read this page" was flagged as wrapping on the door. It is the probe counting the play icon's box as a second line: the label is one line, `white-space: nowrap`, 44 px or more tall.

**Emil, hallmark and impeccable on the change itself:**
- **Easing and duration:** no new duration and no ease-in.
- **Properties:** only opacity and transform animate.
- **Reduced motion:** the change has its own branch, and the new root's 150 ms linear fade keeps comprehension.
- **Breakpoints:** the content (the book's aspect), not a device.

### Not verified

- Microsoft Edge itself, a GPU compositor, a real browser zoom (Ctrl −/+) and a real touch device. The real-scale-factor runs and the resizes stand in for them.
- The phone and tablet weave ran without touch emulation, because touch needs emulated metrics, which soften the snapshot. Touch doesn't change the cloth or the turns, only the lamp and Bond's attention.
- Two of the 32 phone and tablet weave runs timed out (820×1180: Create account → Sign in under reduced motion, and Join → Create account in motion). Both turns passed at every other size.
- Join's real signed-in success (harness only), Create account step 2, server errors, and the photo-remove × (unchanged since round 6).
- Screen-reader output and contrast. The tokens have not changed.
- The uncommitted Bond v2 in the working copy.

---

## Round 6, gap by gap

| # | Round 6 gap or BAOS finding | Now |
| --- | --- | --- |
| Skills 1 | `astory.css` side padding and tooled frame in `vw` without `--zoom` | **Fixed** (ddc912e, overridden in `signed-out.css` §1). 2.5% and 1.6% of the window at every zoom. The fit at 1866×1200 is 1.0555. |
| BAOS 1 | The weave dims to about 70% on every turn, and goes flat at 2560 | **Fixed** (e092062). Lowest 0.975 in any desktop frame, 0.991 on phone and tablet. 0 real frames below 0.95. |
| BAOS 2 | 1280×1024 stacks and scrolls | **Fixed** (e092062). The book opens at 1280×1024, 1200×1000 and 1181×1000–1180 with no scroll, 13 px text and 44 px targets. |

---

## Gaps

### Polish

**1. `paint` mistakes an unchanged fit for a new one whenever the fit ends in a zero. `.fitting` then cancels Bond's fade, so he jumps to full opacity in one frame.**
- **Skills and rules:**
  - emil-design-eng: motion runs its course or is interrupted by the person, never by bookkeeping. A fade that an unrelated style pass cuts short reads as a pop;
  - hallmark microinteractions;
  - BAOS 23a ("Nothing jumps or flashes"), the rule behind round 5's gap 1;
  - impeccable polish ("fix the cause at the narrowest correct level").
- **Where:** `src/pages/auth/bookFit.ts:67`:

  ```ts
  if (el.style.getPropertyValue("--fit") === value && art.style.zoom === value && el.dataset.layout === layout) return;
  ```

  - `value` is `fit.toFixed(4)`. A custom property keeps that text, but the browser normalises `art.style.zoom`: `"0.9000"` is read back as `"0.9"`, and `"1.1590"` as `"1.159"`.
  - The early return therefore never fires at those sizes. Every `apply()` with an unchanged fit runs `paint` in full.
  - The `document.fonts.ready` call (`bookFit.ts:113`) and any `RESIZED_EVENT` that keeps the fit both add `.fitting` (`transition: none !important` on everything in `.auth` or `.door`), then remove it. Any transition running at that moment is cancelled and jumps to its end.
- **Where it happens:**
  - every book page at 1366×768 (fit 0.9000) and 1440×900 (0.9500);
  - the front door at 1920×1000 and 3840×2000 (1.1590), the founder's display.

  Of 15 common sizes checked, these four have a mismatch. 1920×1000's book (1.1875), 1280×1024, 2560 and the rest match.
- **Measured** (transition events on the pose `<img>`):
  - **Create account at 1366×768, cold:** `transitionstart curious opacity` at 486 ms, then `.fitting` toggled and `transitioncancel` at 636–641 ms. The opacity went 0.31 → 1.00 in one frame, in 2 of 3 runs. The third was cut at 0.56.
  - **The same page, warm reload:** the cancel came 120 ms into the fade, and he went 0.00 → 1.00 in one frame. That is a plain pop, in 2 of 2 runs. Round 6 measured 0.31 → full in 167 ms here.
  - **Sign in at 1366×768:** cancelled at about 0.85.
  - **The front door at 1920×1000:** cancelled at 0.85–0.9.
  - **The control, Create account at 1920×1000 (1.1875):** `transitionend` at the full 220 ms, with no cancel.
  - **Which call it is:** the root's class and `data-layout` mutate at `fonts.ready` (602 ms and 701 ms in two runs), with no change to `--fit`.
- **My round 6 report was wrong** to say "paint returns early when nothing changed, so the fonts arriving doesn't toggle `.fitting`". That holds only for fits with no trailing zero, which is where I tested it.
- **Change:** compare numbers, not strings. For example:

  ```ts
  const same = el.dataset.layout === layout && (fit === null
    ? !el.style.getPropertyValue("--fit") && !art.style.zoom
    : el.style.getPropertyValue("--fit") === value && Math.abs(parseFloat(art.style.zoom) - +value) < 1e-4);
  if (same) return;
  ```

  Alternatively, keep the last painted value in `el.dataset.fit` and compare with that. Then re-run Create account and Sign in at 1366×768 (cold and warm), and the front door at 1920×1000. Expect `transitionend` with no `transitioncancel`, and 0.31 → full in about 120 ms.
  - The uncommitted Bond v2 keeps the same 220 ms fade, so it needs this fix too.

### Notes for the lead (not counted)

- **The leaf's new fade on words (`Leaf.tsx`, f059ffb) is uneven on the signed-out pages.**
  - **What I saw:** with the pointer at rest on the title line, the leaf faded to 0 at 1920 and 1600. With it at rest on the bookplate's subtitle or "Forgot password?", the leaf stayed at 0.78 at every size. At 1366×768 and 1280×1024 it stayed at 0.78 even on the title line.
  - **The likely causes:** the leaf is drawn about 26 px right of and 30 px below the point `wordsUnder` tests. The ranges' client rects inside the `zoom`-scaled spread may also disagree with `caretRangeFromPoint`.
  - **Why it isn't counted:** these pages are no worse than before, when the leaf never faded. It belongs to the Family builder's change.
- **For Bao's weave sampler:** use a real scale factor for phone and tablet sizes. Emulated DPR softens the old snapshot by 27–41% on its own.

### Motion and interaction, in Emil's format

| Before | After | Why |
| --- | --- | --- |
| `art.style.zoom === value` (string, `"0.9"` vs `"0.9000"`) | Compare as numbers (or against `dataset.fit`) | An unchanged fit re-applies `.fitting`, which cancels Bond's 220 ms fade in mid-flight (gap 1). |

Every other motion rule I checked passes:
- **Easing:** house ease-out for entrances; no ease-in.
- **Durations:** 120–320 ms on the turns, and the new root's fade is unchanged.
- **Properties:** no `transition: all`, and only transform and opacity are animated.
- **Reduced motion:** every turn has its 150 ms crossfade, and the old root is held there too.

### Scores (taste-skill critique; hallmark self-critique)

```
ROUND 7
Seen in one second: the family book open on the cloth, Bond with his paws on the bookplate (now on a 5:4 desktop too).
Idea: the sign-in is the title page of the family's own book (the Ex Libris plate is the form). It passes the competitor test.
Live thing: Bond watching, covering his eyes and peeking; on the front door, the sample book in three families and seven covers.
Layout words: door=bench+leaf / sign-in=spread+plate / join=card+plate / contribute=person+leaf
Scores: design 8.5 · usability 9 · creativity 9 · content 8 → overall 8.7
Caps applied: none.
Top three: gap 1 (Bond's fade cut short at 1366×768 and on the door at 1920); nothing else a stranger would notice.
Hallmark reading: P5 H4 E5 S5 R4 V4. The weave, the fit and the 5:4 book are each measured clean frame by frame. Every mechanical floor measured passes.
```
