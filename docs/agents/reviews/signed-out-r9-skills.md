# Signed-out pages, round 9: skills review

**Verdict: APPLIED.** No gaps: 0 blockers, 0 ugly, 0 polish.

Both round 8 gaps are fixed, by my own measurements, and the spot checks found no regression. With Bao's Standard passed in round 8, the signed-out pages are done on the skills side.

**Scope.** Commit 240c7aa changes only two places in `src/styles/pages/signed-out.css`:
- the reduced-motion block (§1) gives the held prints `transition: opacity 150ms linear !important`;
- the ≤760 block (§7) gives the phone door `.door-foot { row-gap: 12px; }`.

## Round 8, gap by gap

| # | Round 8 gap | Now |
| --- | --- | --- |
| 1 | On a phone, Bond's ear sits 4–6 px inside the "Sign in" outline | **Fixed.** His ear now clears the outline by 6.3–8 px. |
| 2 | Under reduced motion, a held print pops in | **Fixed.** It crosses in about 133 ms, in steps of 0.11, the same as Bond. |

**Gap 1: the ear.** I measured the topmost opaque pixel of the art the page loads (`watch-420.webp`) across the button's width, against the pill's bottom edge. The lead measured Bond's box; this measures his ear.

| Width | Round 8 | Round 9 |
| --- | --- | --- |
| 360 | 4.0 px inside | 8.0 px clear |
| 390 | 5.7 px inside | 6.3 px clear |
| 430 | 5.7 px inside | 6.3 px clear |
| 600 | 5.7 px inside | 6.3 px clear |
| 760 | 5.7 px inside | 6.3 px clear |

- His box no longer intersects the button at 360, 390, 430 or 600, and 820 was already clear.
- His paws are still on the leaf's foil rule: 14.0 px above the leaf's bottom at 390 and 820, and 11.5, 16.2 and 21.6 px (14 × fit × zoom) at 1366, 1920 and 2560.
- By eye, there is a clear band of paper between the pill and his ears (`shots/signed-out-r9-skills-390x844-door-ear.png`).

**Gap 2: reduced motion.** With the photographs 1.5 s late and reduced motion on, every frame read the picture's opacity through all of its ancestors.

| Page | Fade | Steps per frame |
| --- | --- | --- |
| Sign in's album | 0.111 → full in 134 ms | ≤0.112 |
| The door's loose prints | 134 ms | ≤0.112 |
| Join's prints | 132 ms | ≤0.112 |

- 0 frames showed an undecoded picture.
- Bond under reduced motion steps the same way (0.111 per frame).
- With motion, the fade is unchanged: 0.286 → 0.524 → 0.699… and full in 132 ms.

## Spot checks: no regression

- **Rule 27:** at 390×844 (DPR 3), 1920×1000 and 1366×768, on every page with Bond:
  - every pose's nose is within 0.1 px of the others;
  - the lowest pose stands on the plate's rule (±0.1 px), and sleep stands on it on Verify;
  - the door's Bond is on its foil rule.

  One 1366 pass mounted no companion on Sign in. Two reruns drew him normally with the same numbers, so it was a headless flake.
- **Fit under reduced motion:** 0 wrong canvas-frames in 606 page-change frames at 1366×768.
- **The weave:** lowest paused frame 0.975, lowest real frame 0.977, 0 frames below 0.95. That is Sign in → door in motion and door → Sign in under reduced motion, at 1920.
- **The hold (`useTurn`):**
  - **Pictures slow:** a press navigates in 452 ms.
  - **Pictures ready:** it navigates in 40 ms.
  - **Pictures landing within 300 ms:** it navigates in 377 ms.
  - **The page stays live:** the longest frame during a hold is 32 ms.
- **GSAP cleanup:** the same counts as rounds 6–8.
  - **The door:** 2 contexts and 8 `quickTo`.
  - **Sign in:** 24 `quickTo`, steady through moves and typing.
  - **Old elements:** nothing in GSAP targets the old prints or head.
- **The sweep (280 renders):**
  - **Scroll:** no horizontal scroll, and no vertical scroll in the book layout.
  - **Headings and targets:** headings run two lines or fewer, and every target is 44 px or more.
  - **Text:** nothing is under 13 px, except the phone cover's date (rule 22).
  - **Console:** no errors.
  - **Flags:** the 27 flagged renders are all the known "Read this page" false positive, where the probe counts the play icon as a line.

**How it was checked.**
- **Setup:** headless Playwright (`09142026/node_modules/playwright`) against `http://localhost:5180` at 240c7aa. Every context was new, with no session.
- **Network:** every non-GET request to Supabase was aborted, and nothing was submitted.
- **Fake values only:** `reader@example.test`, K7M2QX and "abc".
- **Probes:** the round 8 ones, unchanged: `ear`, `door`, `door2`, `rmfade` (the reduced-motion sampler), `bondsheet`, `rmzoom`, `weave`, `turn`, `gsap7` and `sweep`.

**Not verified.**
- Edge itself, a GPU compositor, real browser zoom, and a real touch device or a real slow network.
- Join's real signed-in success (harness only, in round 8).

### Scores (taste-skill critique; hallmark self-critique)

```
ROUND 9
Seen in one second: the family book open on the cloth, Bond with his paws on the bookplate's rule.
Idea: the sign-in is the title page of the family's own book. It passes the competitor test.
Live thing: Bond watching, covering, peeking, sleeping, happy; the sample book on the door.
Scores: design 8.5 · usability 9 · creativity 9 · content 8 → overall 8.7
Caps applied: none.
Top three: none open.
Hallmark reading: P5 H4 E5 S5 R4 V4. Every gap from rounds 1–8 is closed and measured; every mechanical floor passes.
```
