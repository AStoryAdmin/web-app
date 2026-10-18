# Signed-out pages, round 8: skills review

**Verdict: GAPS. There are 2 gaps, both polish** (0 blockers, 0 ugly).

Round 7's gap is fixed: `bookFit` now compares numbers, and Bond's fade runs to its end at every size where it was cut. `photoReady.ts` and `useTurn.ts` do what the brief says:
- each picture is decoded once;
- a press waits at most about 400 ms and never blocks the page;
- the keyboard works as the mouse does;
- an undecoded print waits at 0 and fades in;
- no frame in any run showed a grey photograph.

On Bond v2, rule 27 holds on every page at every size: one nose place to 0.1 px, and the lowest pose's paws on the plate's rule to 0.1 px. Two small things remain:
1. On a phone, the front door's Bond has his ear 4–6 px into the "Sign in" button's outline.
2. Under reduced motion, a held print pops in, while Bond and the turns cross in 150 ms.

**The brief's checks, in short:**
- **`photoReady.ts`:**
  - **One decode per picture:** `decodeAll` keeps one promise per address for the visit. The early decode at 250 ms, Welcome's `decodeAll` and every `turnReady` share it.
  - **A picture that fails:** it resolves the shared promise without being marked done, so the next press waits for it at once (30–59 ms measured) and is never held 400 ms again.
- **The hold (`useTurn.ts`):**
  - **Timing:** with the pictures 3 s on the wire, a press navigates after 410–450 ms. With them ready it goes at once (11–31 ms, the link's own path). With them 300 ms away, it goes when they land (354 ms).
  - **The page stays live:** the longest frame during a hold is 18–42 ms.
  - **Keyboard:** Enter on a focused link behaves the same, at 11 ms ready and 410 ms held.
  - **Back during a hold:** it wins. The held turn never fires afterwards.
  - **Cleanup:** the listener and timer are removed on unmount.
- **Undecoded prints:** 0 frames show a visible undecoded picture, over 8 runs:
  - sign-in, the door and Join cold with photographs 1.5 s late;
  - door → sign-in and sign-in → door with them 2.5 s late;
  - the phone;
  - reduced motion.

  Held prints fade in over 130–220 ms once decoded.
- **Gap 1 of round 7 (`bookFit`):** fixed. Of 14 runs, 13 measured end in `transitionend` with no `transitioncancel` (Create account and Sign in at 1366×768 cold and warm, Sign in at 1440×900, the door at 1920×1000 and 3840×2000); the 14th, a cold Create account, read back nothing. The warm Create account at 1366 now fades 0.31 → full in 117 ms (round 7: a pop).
- **Bond v2:**
  - **Rule 27, measured:** 7 pages at 7 sizes. On each page every pose's nose lands within 0.1 px of the others. The lowest pose's foot is on the plate's rule (−0.1 to +0.1 px). Sleep is on the rule on Verify. The door's Bond is on the leaf's foil rule at every size.
  - **Rule 27, by eye:** in each per-pose sheet the pose is drawn alone in its place: one head, the paws on the rule.
  - **Fades, slow lines and Join's success:** all clean. Bond fades 0.31 → full in about 117 ms in every run, and Join's success is blank for 0 ms.
- **Regressions:**
  - **Resize:** 30 resizes and 2 drags end where a fresh load does, with 0 mixed frames.
  - **First loads:** 88, one fit per page.
  - **Reduced motion, per frame:** 0 wrong frames in 2533 canvas-frames.
  - **The weave:** lowest 0.975 in 23 turn runs (one more run crashed).
  - **The sweep:** 280 renders, with nothing new found.
  - **GSAP cleanup:** the same counts as rounds 6 and 7.

**Scope.**
- **41260ae (Bond v2):**
  - the art, at one scale;
  - `Companion.tsx`: `POSES`, with `up` and a page `floor` in place of `sink`, and `happy`;
  - `signed-out.css`: the dog sizes in §2, §6 and §7.
- **679487e:**
  - `photoReady.ts` and `useTurn.ts` (new);
  - `Prints.tsx`, `Join.tsx`, `Contribute.tsx` and `Welcome.tsx` (`holdUntilDecoded`, `decodeAll`, `turnReady`);
  - `AuthFrame.tsx` (`useTurn`);
  - `Verify.tsx` (`data-turn="now"` on Change);
  - `bookFit.ts` (the numeric compare);
  - `signed-out.css`: the `[data-wait]` fade in §1, and the phone door's Bond in §7.
- **The working copy** has another builder's uncommitted changes in `PrintCard.tsx`, `transcript.ts`, `atmosphere.ts`, `astory.css` (the running head) and `archive-reading.css`. None of them reaches a signed-out route.

**Skills loaded:**
- emil-design-eng: response time, interruptibility, reduced motion, "Never use ease-in", "under 300ms".
- hallmark: interaction-and-states, slop-test (gates 26 and 27), responsive.
- gsap-performance: off-main-thread work, cleanup, transform and opacity only.
- gsap-react: context and cleanup.
- impeccable: craft-floor.
- taste-skill: the house rules.
- `docs/BAOS-STANDARD.md` (rules 23a and 27), `docs/mascot/BOND.md` and `DESIGN.md`.
- No other installed skill applies.

## How it was checked

**Setup:**
- Headless Playwright (`09142026/node_modules/playwright`) against `http://localhost:5180` at 2fc7810.
- Every context was new, with no session.
- Only fake values were used: `reader@example.test`, K7M2QX and "abc".
- **Network guard:** every non-GET request to Supabase was aborted. The only one ever attempted was `/c`'s read-only `get_contribute_info`, aborted or stubbed. Nothing was submitted.

**The hold:**
- **Delaying pictures:** `/photos/*` and `/book/*` were delayed 300 ms, 3 s or not at all, by route.
- **Timing:** `history.pushState` was wrapped to time each press → navigation, and a rAF loop recorded the longest frame.
- **Cases:**
  - the mouse;
  - Enter on a focused link;
  - typing during a hold;
  - two presses on different links 100 ms apart;
  - Back 80 ms after a press;
  - the lockup to the door with the door's prints slow;
  - one album picture aborted for the whole visit.

**Grey prints:**
- **The sampler:** on every frame it read, for each photograph (`.auth .print-face img`, `.loose img`, `.inv-print img`, `.cb-print img`), whether it was drawable (`complete && naturalWidth`), its opacity through every ancestor, and `[data-wait]`.
- **The count:** a "grey frame" is one where an undrawable picture is drawn above 0.02.
- **Waiting screenshots:** `shots/signed-out-r8-skills-photos-waiting-{signin,door,join}.jpg`, with the photographs 4 s late.

**Bond v2:**
- **The art itself:** I flood-filled each file's near-black, low-chroma blob from `Companion.tsx`'s stated nose. At the 50-luma threshold:

  | Pose | Blob width (px) | Stated (px) |
  | --- | --- | --- |
  | watch | 54 | 56.4 |
  | cover | 63 | 60.7 |
  | peek | 55 | 56.4 |
  | curious | 56 | 62.9 |

  - **Horizontal centres:** within 0.2–4.6 source px of the stated ones.
  - **Vertical centres:** the blobs' centroids sit 10–16 px below the stated centres, consistently. The stated point is the nose's centre and the centroid takes in the nostril shadow. The spread between poses (6 px) is at most 1.3 screen px at 1920 and 2.6 at 3840.
  - **The 420 files** keep the full files' proportions to 0.1%.
- **In the page:**
  - **Pages:** Sign in, Create account, Forgot password, Join, Verify and the door. The `/c` stub drew no companion, so it was not measured.
  - **Sizes:** 1920×1000, 1366×768, 2560×1300, 3840×2000, 1280×1024, 390×844 (DPR 3) and 820×1180 (DPR 2).
  - **Measured:** each mounted pose's nose (the stated point through its drawn rect), its nose width, its foot against the plate's rule (`plate top + 8.9% of its width`), and the drawn box against the file's ratio.
  - **The door:** the foot against `.door-leaf::before`, the foil rule 14 px in, scaled.
- **Per-pose sheets:** each pose drawn alone in its place at 1920 (`shots/signed-out-r8-skills-1920-{signin,create,join}-poses.png`, `-1920-verify-sleep.png`).
- **Fades:** the round 7 slow-line, warm, ritual, reduced-motion and in-app runs (`slow2`, `inapp`), the 5:4 sizes, and Join's success in the `Companion` harness, with `happy` held 3 s on the wire.
- **`transitioncancel`:** a logger on the poses, for gap 1.

**Regressions:** the round 7 probes, unchanged:
- `resize` (30 pairs and 2 drags);
- `frames7` (12 resizes, per frame);
- `first7` (88 first loads);
- `rmzoom`: 1920, 1366×768, 1280×1024 and 2560 under reduced motion, and 1920 in motion;
- `weave`: 4 turns × 2 motions × 3 sizes, 2 runs each;
- `sweep`: 280 renders;
- `gsap7`;
- `impeccable detect`: 0 anti-patterns and 59 advisories;
- taste `lint.mjs`: 2 FAIL and 8 WARN, the accepted Contribute running head and the outline buttons.

## What holds

**Round 7 gap 1 is fixed.**
- **The code:** `paint` now returns early when `el.dataset.fit === value`, the layout matches, and `parseFloat(art.style.zoom)` is within 1e-4 of the value.
- **The fades:** from `transitionstart` to `transitionend` with no cancel, every time:

  | Run | Fade |
  | --- | --- |
  | Create account at 1366×768, cold (2 of 3 runs; the 3rd read nothing back) | 283–316 ms |
  | Create account at 1366×768, warm (×2) | 284–299 ms |
  | Sign in at 1366×768 (×2) | 284–300 ms |
  | Sign in at 1440×900 (×2) | 282–298 ms |
  | The door at 1920×1000 (×2) | 224–250 ms |
  | The door at 3840×2000 | 312 ms |

- **In `slow2`,** the warm Create account at 1366 draws 0.309 on its first frame and is full 117 ms later. In round 7 it went 0 → 1 in one frame.

**`photoReady.ts`, against gsap-performance and emil.**
- **Decoding:** off the main thread (`new Image().decode()`, never attached), once per address per visit (`pending`), so the early pass, Welcome's pass and every press share the work.
- **The longest frames:** 18 ms during a held press with the pictures in flight, and 42 ms when they were ready (the navigation's own commit).
- **`holdUntilDecoded`** leaves a drawable picture alone, so nothing that was there from the start fades. On a cold, fast load the album still arrives through the 240 ms fade, under the ritual's own settle.
- **Only opacity changes,** on `.print-face` and `.print-cap`, the holder, never the `.print` that GSAP settles and the parallax moves. No GSAP tween and no CSS transition are on the same property of the same element.
- **No grey, ever:**

  | Run | Grey frames | Fade (first drawn → full) |
  | --- | --- | --- |
  | Sign in, cold, photographs 1.5 s late | 0 | 1836 → 1969 ms |
  | The same, reduced motion | 0 | instant (see gap 2) |
  | The door, cold, 1.5 s | 0 | 2158 → 2375 ms |
  | Join, cold, 1.5 s | 0 | 1807 → 1941 ms |
  | Door → Sign in, 2.5 s, pressed at 400 ms | 0 | album 2914 → 3048 ms |
  | Sign in → door by the lockup, 2.5 s | 0 | loose prints 3385 → 3601 ms |
  | Sign in at 390, 1.5 s | 0 | 1791 → 1923 ms |
  | Control, no delay | 0 | 429 → 558 ms |

- **While the pictures are late,** the album page is the bare endpaper with its line and note, the bench is bare cloth, and Join's leaf is its card (`-photos-waiting-*.jpg`). No grey boxes and no broken frames.

**`useTurn.ts`, against emil, hallmark and gsap-react.**
- **Never blocks input:** the press is taken in the capture phase, nothing synchronous runs, and the page keeps drawing at 60 fps through the hold.
- **The keyboard:** Enter on a focused link fires the same click, and is held or let through the same way. Modified clicks (ctrl, meta, shift, alt), other buttons, `target`, `download`, another origin and same-page hashes (Join's "What joining means ↓") all go untouched.
- **Router state:** Verify's Change, the one link that carries it, is marked `data-turn="now"` and goes at once with its state. No other signed-out link carries state or `replace`.
- **Focus:** stays on the pressed link through the hold, so a keyboard user's ring does not jump.
- **Cleanup:** the listener and the 250 ms timer are removed on unmount.
- **Back during a hold:** it wins. Pressed Forgot password, Back at 80 ms: the page stayed on `/welcome` a second later, and no stale turn fired.
- **Reduced motion:** the hold is the same (it is about pictures, not motion), and the turn that follows is the 150 ms crossfade.

**Bond v2 and rule 27.**

| Page | Poses on the page | Nose spread (x, y) | Nose width | Foot against the rule |
| --- | --- | --- | --- | --- |
| Sign in, Forgot password | watch, cover, peek | ≤0.1, ≤0.1 px | 12.4–13.3 px at 1920 | peek 0.0, cover +0.2, watch +6.5 |
| Create account | cover, peek, curious | ≤0.1, 0.0 | 12.4–13.8 | peek 0.0, cover +0.2, curious +2.8 |
| Join | curious, happy | 0.0, ≤0.1 | 13.8 (curious), 16.5 (happy) | happy 0.0, curious +1.3 |
| Verify | sleep | (alone) | 12.4 | sleep 0.0 |
| Front door | watch | (alone) | 10.1 | on the foil rule, 14 CSS px in, at every size |

In the foot column, + means below the rule, behind the plate.

- **The same at every size:** 1366×768, 2560×1300, 3840×2000, 1280×1024, 390×844 and 820×1180. The spreads stay ≤0.1 px, and the lowest pose sits on the rule to ±0.1 px.
- **The door:** measured from the leaf's bottom, the foot sits at 14 × fit × zoom: 14.0 px (390, 820), 11.5 (1366), 16.2 (1920) and 21.6 (2560). That is the foil rule each time (`-390x844-door-paws.png`).
- **The drawn boxes** match the files' ratios to 0.15% or better. Each page loads the 420 files at 1×.
- **By eye:**
  - one head per page, the nose in one place;
  - cover's paws over his eyes, with his chest going behind the plate;
  - peek's resting paw on the rule;
  - sleep's chin on his paws on the rule;
  - watch's paws half behind the plate on the bookplate pages, as `BOND.md` describes;
  - no paw floats above a rule on any page.
- **The tilt** is still clamped to ±1.5° about the stated pivot. The head is untilted at rest (`matrix(1, 0, 0, 1, 0, 0)`).
- **Happy's nose** is drawn 20% wider than curious's, because his snout comes toward you. `BOND.md` cuts him at 0.9 so the head's width matches, and by eye the two heads are one size. This is noted for Bao's rule 27 call, not counted.
- **The fades:**
  - **Cold at 1 s, on every page and both 5:4 sizes:** 0.31 on the first frame, full 113–121 ms later (0.112 and +135 ms under reduced motion).
  - **Arrivals:** in-app arrivals fade 0.31 → full in about 120 ms. Join → Create account, cached, now fades too.
  - **Pose `<img>`s:** none removed in 22 runs.
  - **Join's success:** `curious` holds until `happy` lands (3013 ms), with 0 ms blank.

**Regressions: none.**
- **Resize:** all 30 resizes and both drags match a fresh load. In 12 sampled resizes, 0 frames mix the old and new fit, and the canvas zoom equals `--fit` in every frame.
- **First loads:** 88 of 88 land on one fit per page, with the same fits as round 7.
- **Reduced motion, per frame:** 0 wrong frames:

  | Size | Reduced motion | Normal motion |
  | --- | --- | --- |
  | 1920×1000 | 545 | 412 |
  | 1366×768 | 598 | |
  | 1280×1024 | 576 | |
  | 2560×1300 | 402 | |

- **The weave:** across 23 turn runs at 1920, 1280×1024 and 2560, the lowest paused frame is 0.975 and the lowest real frame 0.979, with 0 frames below 0.95. One run (2560, Join → Create account, in motion) crashed in the harness; the same turn under reduced motion passed.
- **The sweep:**
  - no scroll in the book layout and no horizontal scroll;
  - headings two lines or fewer;
  - every target 44 px or more;
  - nothing under 13 px except the phone cover's date (rule 22);
  - no errors.

  Its 28 flags are all the known "Read this page" false positive (the play icon counted as a line). On the stacked door the lockup and column now read 33/33 at 800, because the page now shows a 15 px classic scrollbar headless. They still match.
- **GSAP:**
  - the door: 2 contexts and 8 `quickTo`;
  - Sign in: 24 `quickTo`, steady through moves and typing;
  - 10 contexts made and 8 reverted;
  - `matchMedia` 3 made and 2 reverted, the one left being ScrollTrigger's own;
  - nothing in GSAP targets the old prints or head.

  The same with the ritual played and at 1280×1024.

## Not verified

- Edge itself, a GPU compositor, real browser zoom and a real touch device.
- A real slow network. Route delays stand in for it.
- Join's real signed-in success (harness only) and Bond on `/c` (the stub did not draw the companion).
- The uncommitted working-copy changes listed under Scope. None reaches these routes.

---

## Round 7, gap by gap

| # | Round 7 gap | Now |
| --- | --- | --- |
| 1 | `paint` compares `"0.9000"` with `"0.9"`, so `.fitting` cancels Bond's fade at 1366×768, 1440×900 and the door at 1920/3840 | **Fixed** (679487e). Every fade measured runs to `transitionend`, with 0 cancels. |

---

## Gaps

### Polish

**1. On a phone, the front door's Bond has his ear 4–6 px inside the "Sign in" button's outline.**
- **Skills and rules:**
  - hallmark layout-safety: shapes that touch or overlap read as unbuilt;
  - impeccable craft-floor ("tight groups, generous separation");
  - taste-skill critique;
  - the Bond v2 brief in 4881e2f: a whole dog on a ledge, never a head over a line.
- **Where:**
  - `src/styles/pages/signed-out.css:511`, `.door-foot { … grid-template-columns: minmax(0, 1fr) auto; column-gap: 6px; align-items: end; }`. It has no row gap.
  - The phone block, `signed-out.css:752`: `.door .companion { --cw: 70px; margin-bottom: -16px; }`.
  - Bond (row 2, column 2) is 79.7 px tall, and the "Sign in" button (row 1, the full width) sits directly above him.
- **Measured:** the topmost opaque pixel of his ear, within the button's width, against the button's bottom edge:

  | Width | Overlap |
  | --- | --- |
  | 360 | 4.0 px |
  | 390 | 5.7 px |
  | 430 | 5.7 px |
  | 600 | 5.7 px |
  | 760 | 5.7 px |
  | 820 (the tablet rule) | clear |

  Screenshot: `shots/signed-out-r8-skills-390x844-door-ear.png`. His left ear's tip sits on the pill's bottom outline. Lowering him in this round put his paws on the rule, but left the top of his head in the row above.
- **Change:** give the phone's door foot a row gap, so the rows clear him: in the `≤760` block, `.door-foot { row-gap: 12px; }`. The leaf grows by 12 px, and the paws stay on the foil rule because the row is bottom-aligned. Alternatively, size him to `--cw: 64px`. Re-measure the ear against the button at 360–760. Expect at least 6 px clear.

**2. Under reduced motion, a held print pops in. Bond and every turn cross in 150 ms instead.**
- **Skills and rules:**
  - emil-design-eng ("Reduced motion means fewer and gentler animations, not zero. Keep opacity and color transitions that aid comprehension");
  - hallmark gate 27 (every motion has its reduced-motion alternative);
  - DESIGN.md §Motion (the signed-out pages cross in 150 ms under reduced motion);
  - BAOS 23a.
- **Where:**
  - `signed-out.css:116–118` gives `.auth .print-face, .auth .print-cap, .loose, .cb-print, .inv-print` `transition: opacity 240ms`.
  - The house rule `astory.css:515–516` turns every transition into 1 ms under reduced motion.
  - Bond is excepted at `signed-out.css:165` (`transition: opacity 150ms linear !important`). The prints are not.
- **Measured:** sign-in cold with photographs 1.5 s late under reduced motion. The album goes from 0 to full in one frame (1828 → 1828 ms). With motion it fades over about 130 ms, and Bond under reduced motion takes 0.111 per frame.
- **Change:** in the reduced-motion block at `signed-out.css:164`, beside Bond's rule, add:

  ```css
  .auth .print-face, .auth .print-cap, .loose, .cb-print, .inv-print { transition: opacity 150ms linear !important; }
  ```

  Re-run the held-print sampler under reduced motion. Expect 0 → full in about 150 ms, in steps of about 0.11.

## Notes for the lead (not counted)

- **No sign of a held press.** A press held 400 ms shows nothing for that time. It is rare (the pictures start decoding 250 ms after a page mounts), and the door's own `into` already did this in rounds 5–7. Emil's rule is feedback within about 100 ms. If it is ever seen on a slow line, `aria-busy="true"` on the pressed link with `cursor: progress` would answer the press.
- **A second press is swallowed.** A press on another link during a hold is taken and ignored (Forgot password, then Create account 100 ms later, lands on Forgot password). It is harmless at 400 ms. Letting the latest press win (remember `url` and navigate to the last one) would follow the visitor's correction.
- **A held turn always gets a view transition.** `/c`'s "About A Story" (`Contribute.tsx:344`) is a plain `Link`. If it is ever held, it turns with a View Transition, which it does not when it goes at once. It is the only signed-out link without `viewTransition`. Adding `viewTransition` to it makes the two paths the same.
- **The note under an empty endpaper.** While the album waits, "Photographs from a sample family's book." sits on an empty endpaper. It is visible only on a slow line, and only until the pictures land.

### Motion and interaction, in Emil's format

| Before | After | Why |
| --- | --- | --- |
| Held prints `opacity 240ms` → 1 ms under reduced motion | `opacity 150ms linear` under reduced motion, like Bond | Reduced motion keeps gentle opacity changes; a print that pops in is the one exception on these pages (gap 2). |
| Phone door: Bond's ear inside the "Sign in" outline | A 12 px row gap in `.door-foot` (≤760) | The two shapes touch (gap 1). |

Every other motion rule I checked passes:
- **Easing:** ease-out on every entrance, and no ease-in.
- **Durations:** the print fade is 240 ms, turns are 120–320 ms, and the press hold is a wait, not an animation.
- **Properties:** no `transition: all`, and only opacity and transform change.
- **GSAP and CSS:** no GSAP tween shares a property with a CSS transition on the same element.

### Scores (taste-skill critique; hallmark self-critique)

```
ROUND 8
Seen in one second: the family book open on the cloth, Bond (v2, a whole dog) with his paws on the bookplate's rule.
Idea: the sign-in is the title page of the family's own book. It passes the competitor test.
Live thing: Bond watching, covering, peeking, sleeping, and happy when the code works; the sample book on the door.
Layout words: door=bench+leaf / sign-in=spread+plate / join=card+plate / contribute=person+leaf
Scores: design 8.5 · usability 9 · creativity 9 · content 8 → overall 8.7
Caps applied: none.
Top three: gap 1 (Bond's ear in the phone door's Sign in outline); gap 2 (held prints pop under reduced motion); nothing else a stranger would notice.
Hallmark reading: P5 H4 E5 S5 R4 V4. No grey print in any frame; Bond's nose in one place to 0.1 px on every page; every probe from round 7 still clean.
```
