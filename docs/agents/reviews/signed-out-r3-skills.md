# Signed-out pages, round 3: skills review

**Verdict: GAPS.** 8 gaps: 0 blockers, 3 ugly, 5 polish. Of round 2's 17 gaps, 13 are fixed and 4 are partly fixed. The partly fixed ones are carried below as gaps 2, 4, 5 and 7.

**The brief's two questions:**
- **Bond's GSAP: yes.** It is created once, scoped and reverted (measured).
- **Lazy poses: no.** On a slow connection, the lazy pose loading shows a blank dog (gap 1).

**Scope.**
- `src/pages/auth/*`: AuthFrame, bookFit, PlateSay, useCodeAria (new), SignIn, CreateAccount, ForgotPassword, Verify, Welcome.
- `src/pages/Join.tsx` and `src/pages/Contribute.tsx`.
- `src/components/delight/{Companion,ClothStamp,Prints}.tsx`.
- `src/styles/pages/signed-out.css`, plus the rules in `src/styles/astory.css` that it sits on.

**Skills loaded.**
- taste-skill: SKILL, layout, type, critique.
- hallmark: SKILL, slop-test, interaction-and-states, responsive.
- emil-design-eng.
- impeccable: SKILL, craft-floor, polish, layout, critique.
- gsap-react, gsap-performance, gsap-core (matchMedia), gsap-timeline. gsap-scrolltrigger has nothing to check: these pages use no ScrollTrigger.
- `docs/BAOS-STANDARD.md` (rule 27, Bond's new art rules, is new since round 2) and `DESIGN.md`.

No other installed skill applies.

## How it was checked

**Headless renders: 132.** Playwright 1.63 with chromium-1243, against `http://localhost:5180`, with no session.
- **Sizes:** 1366×768, 1366×641, 1920×1000, 2560×1300 (html zoom 1.3), 390×844 (touch, DPR 3) and 820×1180 (touch, DPR 2). Each was run with and without `reducedMotion: 'reduce'`.
- **Routes:**
  - `/welcome`, `/sign-in`, `/create-account`, `/create-account?code=K7M2QX`, `/forgot-password`
  - `/verify?email=reader@example.test`, `/verify`
  - `/join/K7M2QX`, `/join/ABC`
  - `/c/sample-slug`, once as the server returned it (the read-only `get_contribute_info` lookup) and once with that lookup stubbed as "Margaret Hale"

**Network guard.** Every other non-GET request to Supabase was aborted and logged. None was attempted.

**Measured on every render:**
- horizontal scroll, page scroll, the fit, the layout and the canvas rectangle
- headline line counts and affordances that wrap
- text under 12.5px (the printed sample book excepted, per BAOS 22)
- the real hit height of every control, probed with `elementFromPoint`
- anything still hidden after arrival
- which of Bond's poses is visible, whether its picture has loaded, and which `srcset` file was chosen
- console errors

**Behaviour probes (fake values only):**
- **GSAP.** I patched the page's own `gsap.quickTo` and `gsap.context` to count them. I went from the front door to Sign in, typed 16 characters, moved the pointer, focused the password, then left for Forgot password while the head and the prints were still moving.
- **Lazy poses.** On Sign in, with `cover` and `peek` delayed 1.5 s on the wire (and once without delay), I focused the password 0.2 s after load, then pressed Show. Bond's visible coverage was sampled every 20 ms.
- **Create account, step 2.** I used "Test Reader" and `reader@example.test`, opened the code field, then caused a password error and a code error ("AB"), at 1366×768, 1366×641 and 1920×1000. Both errors are caught on the page and send nothing.
- **Empty submits.** On Sign in, Verify, Join (bad code) and Contribute (stubbed), I measured the book's width and the fields' ARIA.
- **Tab during the ritual.**
- **Reduced motion.** Bond's crossfade, and a press on the cloth on Sign in and on the front door.
- **The front door.** The control row's centres, "Read this page", the chapter chips, and which poses are mounted.
- **The phone endpaper.** The last print's caption against the sentence under it, at 390, on four pages.

**Mechanical scans:**
- `impeccable detect`: 0 blocking findings and 60 advisories (63 in round 2).
- taste `lint.mjs`: 2 FAIL and 10 WARN (43 FAIL in round 2). The 2 FAIL are Contribute's running head, accepted since round 1.

### What holds

**Fit.**
- No horizontal scroll in any of the 132 renders.
- Every desktop page is one screen. Not one desktop render scrolls.
- 1366×641 keeps the spread: the book's fit is 0.78 and the bench's 0.80.
- An error never changes the book's size. Sign in and Verify stay at 1296 px wide.

**Headlines and type.**
- Two lines or fewer everywhere.
- Nothing under 12.5px.
- The sample-family chips on the front door are a name over a subtitle by design. They are not a wrapping label.

**Targets and states.**
- Every control's real hit height is 44 px or more at every size: 58 px at 2560, and the phone links are full rows.
- The ARIA is complete:
  - the verify digits read `aria-invalid="true"` and `aria-describedby="plate-say"`, and keep it while the error stands
  - Join's code field and Contribute's textarea do the same
  - there are no nested live regions

**Motion.**
- Tab at 0.25 s ends the ritual: the board is gone, the focus is in the email field and Bond is at full opacity.
- Nothing is left hidden.
- There are no console errors.
- Under reduced motion, Bond's crossfade is `opacity 150ms linear`.

**The front door.**
- The control row is centred on one line: 672/672/672 at 1366, and 1173/1173/1173 at 2560.
- The chapter pills are gone.

**Bond's GSAP: created once, scoped, reverted.**
- One `gsap.context(…, box)` per mount, holding two `quickTo` (StrictMode makes one more pair and reverts it).
- 16 keystrokes and the pointer moves made no new tweens.
- After leaving: 0 tweens on the detached head, and its four `quickTo` tweens are killed and off the timeline.

**What changed for the better.**
- Bond's header, the dead companion rules and `--breath` are gone.
- The stamp now lives 3.25 s and its timers are cleared.
- Phones keep "You don't need an account to send it."
- The foot of the contribute leaf no longer ends in a double line.

### Not verified

- Edge (only Chromium was used), 3840 wide, and a zoomed-out window.
- The view-transition crossfades. They were checked in code, not filmed.
- The second step of Forgot password, and Join's signed-in states. Both need a server call.
- Screen-reader output.
- Contrast. The tokens are unchanged since round 2 (placeholder 5.62:1, small print 5.6–7.6:1), and this round did not measure it again.

---

## Round 2, gap by gap

| # | Round 2 gap | Now |
| --- | --- | --- |
| 1 | Plate runs off the page on step 2 | **Partly.** With the code field open it fits: 17 px spare at 1366×768, 3 px at 1366×641. A two-line error still pushes it past the page. See gap 2. |
| 2 | Cream chapter pills on the bench | **Fixed.** `.door .bk-chapters { display: none }`. |
| 3 | 1366×641 falls to the phone layout | **Fixed.** `STACKED` is width and aspect only. A short-window rule trims the bench. |
| 4 | "Read this page" sits high | **Fixed.** The row centres are equal at all four desktop sizes. |
| 5 | Bond's `quickTo` not cleaned up | **Fixed** for Bond (measured). Prints has the same pattern: gap 4. |
| 6 | Overlapping hit areas | **Fixed.** Every hit is 44 px or more. |
| 7 | ARIA on the digits and the contribute words | **Fixed.** `useCodeAria`, and the textarea's ARIA. |
| 8 | A keyboard press doesn't skip the ritual | **Fixed.** `pointerdown`, `keydown` and `focusin`. |
| 9 | Reduced-motion crossfade and blink | **Fixed.** 150 ms `!important`. There is no blink until closed-eye art exists. |
| 10 | Dead code | **Fixed.** |
| 11 | Pose image weight | **Partly.** There are 420w files, `fetchpriority` and lazy poses, but the lazy loading blanks Bond (gap 1) and `sizes` overstates the slot (gap 5). |
| 12 | Double line at the leaf's foot | **Fixed.** The foot has no `border-top` on the words step. |
| 13 | Lint exemption | **Fixed.** 43 FAIL down to 2, both the accepted running head. |
| 14 | Raw `rgba()` | **Partly.** Three line tokens were added, but 22 interface `rgba()` values remain. See gap 7. |
| 15 | Phone loses the reassurance | **Fixed.** |
| 16 | Double live regions | **Fixed.** |
| 17 | Stamp pops off | **Fixed.** A new reduced-motion inconsistency is gap 6. |

---

## Gaps

### Ugly

**1. BAOS rule 25 ("Nothing is ever left hidden or half-faded"), emil-design-eng (handle edge cases invisibly), and gsap-performance and impeccable optimize (lazy loading that never shows a hole). This is the brief's question.**
- **Where:**
  - `Companion.tsx:79-90`: the other poses mount only after 1.5 s, or the moment the mood needs them.
  - `Companion.tsx:162`: the filter.
  - `signed-out.css:117-120`: `data-mood` switches the visible pose at once.
- **What happens:** when the mood changes to a pose whose image isn't loaded yet, the old pose fades out in 220 ms over an `<img>` that has no pixels.
  - Measured on Sign in, with `cover` 1.5 s away (a slow phone), focusing the password 0.2 s after load: **Bond is gone for 820 ms**. Coverage reaches 0, shown as "watch:0.00 cover:1.00 (not loaded)".
  - Under reduced motion he is gone for 760 ms.
  - "Show" (peek) blanks him for 160 ms.
  - On localhost there is no blank, which is why it is easy to miss.
  - The screenshot is `shots/signed-out-r3-skills-1366-bond-blank.jpg`: an empty plate top.
  - A password manager that focuses the password field on load hits this every time.
- **Change:**
  - **Never switch to an unloaded pose.** Keep a `loaded` set filled by each `<img onLoad>` (and by `img.complete` on mount). Show `mood` when it is loaded, otherwise keep the last shown pose. Put the shown pose on `data-mood`.
  - **Load the poses earlier.** Start fetching the password poses (`cover`, `peek`) as soon as the rest pose has decoded, not on a 1.5 s timer: either `new Image().decode()`, or mount them at once with `fetchpriority="low"`. The timer only guesses at idle.

**2. impeccable craft floor ("Run the real copy at every breakpoint and fix what overflows"), and BAOS rule 11. Carried from round 2's gap 1.**
- **Where:**
  - `CreateAccount.tsx:172`: the code error.
  - `signed-out.css:97-104`: the plate's dog room and its bottom padding.
- **What happens:** on step 2, with the code field open, "A family code is six letters and numbers. Check you have them all." sets on two lines.
  - The plate's engraved foot then runs **5 px** past the page's edge at 1366×768 and **15 px** at 1366×641. The plate ends at 634 and the page at 619.
  - At 1920 there are 20 px to spare.
  - A server error of two lines would do the same on any step.
  - The screenshot is `shots/signed-out-r3-skills-1366x641-create-step2-code-error.jpg`.
- **Change:**
  - Keep the plate's line to one line on this step. The field's label already says "six letters and numbers", so the error can be "Check the code; it has six." Shorten any other local error that wraps here too.
  - Budget the room for a two-line server error at 1366×641. Either take about 16 px off `--dogroom` on `.plate:not(.lettered)`, or reduce `.plate .paper`'s `padding-bottom` on the password step.
  - Re-measure with the code open and a two-line error at 1366×641.

**3. taste-skill critique, pass 13, and layout §9 ("careless details such as colliding lines"). hallmark gate 35 (confirm a decorative stroke's position visually).**
- **Where:** `signed-out.css:645` (the third print at `--t: 60%`) and `:652` (`.ep-how` pinned at `bottom: 4%`), in the phone block.
- **What happens:** at 390, on Sign in, Create account, Forgot password and Verify:
  - The brass rule of the endpaper sentence sits on the same row as "Rain on the porch, 1961". The rule's top is 7 px below the caption's top.
  - The sentence starts 1 px above the caption's foot.
  - The caption, the rule and the sentence collide in one band.
  - The screenshot is `shots/signed-out-r3-skills-390-caption-collision.jpg`. The 820 layout is clean.
- **Change:** let the sentence follow the album in flow instead of pinning both ends of the page. For example, `.auth .ep-how { position: relative; top: auto; bottom: auto; margin-top: …; }` under the prints, with the page's height from content. Or lift print 3 to about `--t: 55%` and keep at least 24 px between the caption's foot and the rule.

### Polish

**4. gsap-react ("Skip cleanup … leaks and updates on detached nodes"), and BAOS rule 1 (apply a comment everywhere). Round 2's gap 5, on the next component.**
- **Where:** `Prints.tsx:103-130`. Six `quickTo`s are made in a bare effect and cleaned with `gsap.killTweensOf(els)`.
- **What happens:** measured after leaving `/sign-in` with the prints moving:
  - `gsap.getTweensOf(oldPrints)` still returns 6 tweens on the detached prints.
  - StrictMode's first set is never killed (3 still have a parent on the timeline).
  - `killTweensOf` misses a finished `quickTo`, exactly as it did for Bond.
- **Change:** build the movers inside `gsap.context(() => …, box)` and return `() => ctx.revert()`, as Companion now does. The `gsap.set(els, { x: 0, y: 0 })` then goes, because revert restores the inline style.

**5. impeccable optimize and hallmark responsive (`srcset`). Carried in part from round 2's gap 11.**
- **Where:**
  - `Companion.tsx:170`: `sizes="(min-width: 2400px) 480px, 240px"`.
  - `Companion.tsx:80-90` together with `Welcome.tsx:159`.
- **What happens:**
  - Bond is drawn 81–177 CSS px wide. The `sizes` value claims 240 and 480.
  - So 2560 (185–231 device px) and both touch sizes (DPR 2–3, 99–149 CSS px) download the full 690–800w file (107–148 KB) instead of the 420w one (52–72 KB).
  - The front door mounts all five poses after 1.5 s, but it only ever shows `watch` (measured: `watch,cover,peek,curious,sleep` mounted). That is about 250 KB it never draws.
- **Change:**
  - Set `sizes` to the real slot, for example `sizes="(max-width: 760px) 130px, 180px"`. The browser multiplies it by DPR and zoom.
  - Give Companion a `poses` prop (or derive it from whether the page has a password field). The door then mounts only `watch`, and the auth pages mount their rest pose plus `cover` and `peek`.

**6. BAOS rule 45 (delight is skipped under reduced motion) and emil-design-eng (reduced motion keeps opacity and drops movement; never pop).**
- **Where:**
  - `astory.css:701`: `.auth .stamp { animation: none; opacity: 0.5 }`.
  - `signed-out.css:424`: `.door .stamp`, a second copy of the stamp rule.
  - `ClothStamp.tsx:19-29`.
- **What happens:** under reduced motion, a press on the cloth leaves a still stamp at half opacity on the sign-in pages, which is then removed at 3.25 s with a pop. On the front door the same press makes an invisible node: the global 1 ms rule ends `deboss` at opacity 0.
- **Change:** return early in `press` under `prefers-reduced-motion`, so there is no stamp on either page. Then make the two stamp rule sets one rule (`.auth .stamp, .door .stamp`) in one file.

**7. hallmark gate 48 (locked tokens; `rgba()` counts). Carried from round 2's gap 14.**
- **Where (signed-out.css):** 22 interface `rgba()` values remain outside the token block.
  - The link underline `rgba(74,51,39,0.3)` four times: `:188`, `:369`, `:409`, `:469`.
  - The outline-button wash `rgba(74,51,39,0.04)`: `:179`, `:465`.
  - Field and box borders: `:207`, `:209`, `:223`, `:229`, `:230`, `:347`.
  - Cloth washes and lines: `:488`, `:495`, `:517`, `:521`, `:533`, `:534`.
- **Change:**
  - Add `--chocolate-underline`, `--chocolate-wash`, `--cream-wash` and `--field-line` to `:30-54` and reference them.
  - `:533`'s 0.32 is already `--cream-line`.

**8. taste-skill gate (`lint.mjs` WARN, "Treat each WARN as wrong unless you can defend it").**
- **Where:** `signed-out.css:278` (`.inv-card::before`) and `:442` (`.door-leaf::before`).
- **What happens:** both are the book's foil frame and are defensible, but they lack the `taste-skill-ignore: book material` note that the other book lines carry, so the lint still counts them. The other 8 WARN are outline buttons and the kind toggle, which are interface and fine.
- **Change:** add the note to those two lines.

### Motion and interaction, in Emil's format

| Before | After | Why |
| --- | --- | --- |
| `data-mood` switches to a pose whose image isn't loaded | Show the new pose only once its `<img>` has loaded; hold the last loaded pose until then | The old pose fades over an empty picture: 820 ms of no dog on a slow line (gap 1) |
| The password poses are fetched on a 1.5 s timer | Fetched (decoded) as soon as the rest pose has decoded, at low priority | The first password focus usually comes sooner than that (gap 1) |
| Prints' `quickTo` with `killTweensOf` on unmount | `gsap.context(…, box)` then `ctx.revert()` | A finished `quickTo` is off the timeline; 6 tweens outlive the page (gap 4) |
| Reduced motion: the stamp at 0.5 for 3.25 s, then gone | No stamp under reduced motion | The delight is skipped, never popped (gap 6) |

### Scores (taste-skill critique; hallmark self-critique)

```
ROUND 3
Seen in one second: the family book open on the cloth, Bond with his paws on the bookplate.
Idea: the sign-in is the title page of the family's own book (the Ex Libris plate is the form). It passes the competitor test.
Live thing: Bond watching, covering his eyes and peeking; on the front door, the sample book in three families and seven covers.
Layout words: door=bench+leaf / sign-in=spread+plate / join=card+plate / contribute=person+leaf
Scores: design 8.5 · usability 8 · creativity 9 · content 8 → overall 8.4
Caps applied: none (no three-line headline, nothing covering a headline, nothing left hidden on a normal connection).
Top three: gap 1 (Bond blanks while a pose loads), gap 2 (the plate's foot runs off the page with a two-line error at 1366), gap 3 (caption, rule and sentence collide on the phone endpaper).
Hallmark reading: P5 H4 E4 S5 R4 V4. E stays at 4: the measured floors all pass now, and the three ugly gaps are state and edge cases.
```
