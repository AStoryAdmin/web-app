# Skills Steward: the Archive, the memory page, and PrintCard, MemoryCard and Mosaic on Home, round 8

**Verdict: NOT APPLIED.** No blocker, two ugly, three polish. Of the 7 round-7 gaps, 6 are closed and 1 (gap 7, stacked CSS) is mostly closed. The photographs are whole again, and one Archive load now makes 4 signing requests for 4 photos. Two problems remain. First, a landscape photograph in a square or 3:4 print gets a rendition that is too small, so it is upscaled and soft. Second, the rewritten tidy still does six things that BAOS 17a does not allow. None of the seven memories triggers them today.

## How this was checked

- **Skills read:**
  - taste-skill: SKILL.md (house rules), plus the critique, layout and type references.
  - hallmark: SKILL.md, anti-patterns, slop-test, interaction-and-states and responsive.
  - emil-design-eng.
  - impeccable: SKILL.md, plus craft-floor, polish, layout, optimize (images) and harden (network errors).
  - gsap-performance, gsap-react, gsap-scrolltrigger and gsap-timeline.
  - Also read: BAOS-STANDARD.md (17a in full), DESIGN.md and archive-r7-skills.md.
- **Code read:**
  - In full: `lib/photoUrls.ts` and its new test, `archive/develop.ts`, `PrintCard.tsx`, `MemoryCard.tsx`, `Mosaic.tsx`, `archive/transcript.ts` and `state/AuthProvider.tsx`.
  - In part: `archive/transcript.test.ts` (RULING_FIXTURES and the round-5 to round-8 cases), `MemoryLead.tsx` (`MemoryHead`), `pages/MemoryPage.tsx` lines 120–330, and `archive/motion.ts` (matchMedia, revert, clearProps).
  - CSS: `archive-reading.css` from line 380 to the end, plus its focus and title rules. In `astory.css`: the `.print-card`, `.mem` and `.home-mem` rules, and the small-print floor.
- **Tools run:**
  - `vitest run src/components/archive src/lib/photoUrls.test.ts` passes: 4 files, 74 tests. `tsc --noEmit` exits 0.
  - taste-skill `lint.mjs` on the changed files reports 46 FAIL and 6 WARN, the same as round 7 and all brand-exempt (kickers, hairlines, gradients, shadows and the ✦).
  - A copy of `transcript.ts` was run under Node 24 in my scratchpad against 28 spoken sentences (gap 2).
- **Rendered:** in my own pane tab (tab-128), force-reloaded, at 1366×768, 1920×1000, 2560×1300 (html zoom 1.3) and 390×844. The pane's density is 1.5, and 2 at 390. I stepped the frame clock with `__gsap.ticker.tick()`, measured with JavaScript and the Resource Timing list, and took screenshots.
  - The Archive in both views, Home's prints, and all seven memory pages (opened through the router).
  - For all six spoken memories I diffed the words as said against the tidied words, using the page's own "exact words" toggle.
- **Not verified:**
  - The founder's real screen density. The upscale figures in gap 1 are computed for density 1, 1.5 and 2. Softness was judged by eye only at 390@2x, by swapping in the original.
  - Keyboard order and reduced motion were checked in code only. The impeccable detector was not run, and 3840 was not checked.
  - The server tidy pass is off (`VITE_TIDY_FROM_SERVER`), so only the local cleaner was reviewed.

## Round-7 gaps, checked

| # | Round-7 gap | Now |
|---|---|---|
| 1 | The renditions crop the photographs | **Done.** photoUrls.ts:111 now asks for `{ width, resize: "contain" }`. The renditions come back 400×500 and 400×267 (600×400 at 1920), the same ratios as the originals (1122×1402 is 0.800 and 1200×800 is 1.5). The wedding couple and the woman on the phone keep their heads at 1366, 1920 and 390. **Still missing:** a test that a rendition keeps the original's ratio. The new test checks only the width steps. |
| 2 | `JOINED` keeps a stammered conjunction | **Done.** "and, and", "but, but" and "then then" collapse, and nothing before them is lost. "worse and worse and then" and "again and again and finally" stay. Each is a fixture in RULING_FIXTURES. |
| 3 | The takeaway set twice in a row when it is the second sentence | **Done.** 459228bd's line is now "The best way to learn finance is to build a business." Its mark starts at character 461, and the title has its kept line. `opensOn` now counts the first two sentences or 200 characters, with 4592's opening as a fixture. c21cf4d4 and beeedb62 set nothing under the title and mark at character 0. |
| 4 | Signing one photo at a time multiplies requests | **Done.** One Archive load makes **4** signing requests for 4 photos, in List and in Prints alike, and none is doubled under StrictMode (round 7 counted 8). Switching from List to Prints signs nothing new, because both ask for the 400 rendition. Home also makes 4. There is now an in-flight map, a cap of 4, and a failed transform is remembered for the session. |
| 5 | A rendition that fails leaves the print dark | **Done.** In my tab I broke one print's rendition URL. `onError` swapped it to the original, which loaded (1200×800). |
| 6 | A fixed 600px ignores zoom and density | **Done.** `renditionWidth` multiplies box × `pageZoom()` × density. At 2560, `offsetWidth` is the unzoomed 363 while the rect is 472, so the arithmetic is right: 708 device pixels, so the originals load. Gap 1 is the case this formula misses. |
| 7 | Stacked and dead CSS | **Mostly done.** These are all gone: astory.css's old 3694–3695, the clamp on Home's titles, the doubled `.arc-tools ~ .arc-prints`, and the doubled `.mv-menu-item:focus-visible`. What remains is gap 5. |

## Gaps, skill by skill

### Ugly

1. **Landscape photographs are upscaled in every square or 3:4 print.**
   - **Rules:** impeccable optimize ("proper sizing") and polish ("responsive sources"); hallmark responsive (`srcset` by need); BAOS 17 (photographs lead).
   - **Where:**
     - develop.ts:26 sizes the rendition from the frame's **width** only (`renditionWidth(el.offsetWidth, …)`).
     - photoUrls.ts:111 then asks for that width, with `contain`.
     - The frame shows the picture with `object-fit: cover`. A 3:2 landscape therefore has to fill the frame's **height**, and that needs a width of frame height × 1.5.
   - **Measured:**

     | Where | Print (CSS px) | Height needed | Rendition | Upscale |
     |---|---|---|---|---|
     | Archive at 390, density 2 | 158×211 (3:4) | 422 device px | 400×267 | **1.58×** |
     | Archive at 1366, density 1.5 | 254×254 | 381 | 400×267 | **1.43×** |
     | Home at 1366, density 1.5 | 232×232 | 348 | 400×267 | 1.30× |
     | Home at 1920, density 1.5 | 334×334 | 501 | 600×400 | 1.25× |
     | 2560 with zoom 1.3, density 1 | 363×363 | 472 | 600×400 | 1.18× |

     - The portraits are fine, because a portrait fills by width.
     - At 390 I swapped the original into the dinner-table print. The hair, the dress pattern and the picture frame on the wall are visibly sharper. The rendition is soft.
     - It affects 2 of the 4 photo prints on the Archive and on Home. The List thumbnail is fine (132px square, so 198 device px needed against 267).
   - **Change:** pick one of these.
     - (a) Sign the frame's own box with `transform: { width: Wdev, height: Hdev, resize: "cover" }`, where W and H are the frame's offset size × zoom × density, in steps. This is the same centre crop that `object-fit: cover` already shows, so nothing is lost, and the ratio is the frame's.
     - (b) Keep `contain`, and step on `max(boxW, boxH × 1.5)`, which covers photographs up to 3:2.
     - Either way, add a test with the 3:4 phone frame and a 3:2 photograph.

2. **The tidy still goes beyond 17a in six ways.** All are latent (no current memory hits them), but each one changes or removes what was said.
   - **Rules:** BAOS 17a, the lead ruling of 2026-10-18. It may remove only filler sounds, an exact adjacent stutter, and a clause that is a true prefix of the next. It never drops an answer, and when in doubt it keeps the words. Also taste substance (the words are the person's own).
   - **Run on a copy of the current file:**

     | Said | Shown | Where |
     |---|---|---|
     | "We gave the flowers to, the old lady next door." | **"The old lady next door."** | transcript.ts:122 `brokeOff` drops any clause of six words or fewer that ends on a little word. 17a has no such permission. The test file's comment (line 260) widened the ruling to "or breaks off on a little word"; the standard did not. |
     | "Why did I leave Vietnam that year? Because my father was sick." | Set as **"We asked: Why did I leave… Because my father was sick."** The cards' words lose both. | :23 `ASK` lifts a teller's own question as the asker's, then :216 `ASKER_GOES_ON` hands the teller's answer to the asker. |
     | "Oh, how could I ever forget that day? It was the day my son was born." | "It was the day my son was born." | :206 `REACTION_Q` drops any question that opens on "Oh", "Really", "Wait" or "Seriously", including the teller's own. |
     | "Was it hard? Yes. It was very hard." | "Was it hard? It was very hard." | :15 `yes` in `BACKCHANNEL_WORD`: an answer goes. |
     | "We were happy. We had a garden and a dog. We were happy." / "I loved her more than anything in the world. I loved her." | The second "We were happy." and "I loved her." go | :183 drops a sentence equal to *any* earlier one, or one that the previous sentence starts with. A refrain is not an adjacent stutter. |
     | "We had a big, big house" / "Run, run, run!" / "Very, very, very good." / "a long, long, long road" | "a big house" / "Run!" / "Very, very good." / "a long, long road" | :134 `MEANT_TWICE` is a closed list, so emphasis on any other word collapses. :121's prefix rule also takes one word from a protected triple ("very" is a "prefix" of "very good"), which bypasses `MEANT_TWICE`. |

   - **In the real calls**, all six spoken memories diffed, nothing like the cases above happens. The one `brokeOff` hit is the intended case: "So we did like a, we built a psychometric app" on 342e4b40.
   - **Change:**
     - Narrow `brokeOff` to a restart: the next clause opens on the clause's own first word, after "so" or "and" ("we did a, we built"). Otherwise keep it. Or have the lead add "breaks off" to 17a in words.
     - Never lift a question that holds "I", "my", "me" or "we"; never apply `ASKER_GOES_ON` after one.
     - Drop a `REACTION_Q` question only when it is three words or fewer ("Really?", "Wait, were you?").
     - Remove "yes" and "yeah" from the sentence-level back-channel when the sentence before ends in "?".
     - Limit :183 to the adjacent sentence and to an exact match (the eSports case in the round-5 test stays).
     - Treat a doubled word with a comma as emphasis unless it is a pronoun, article or conjunction (`I, I`, `the the`, `and, and`), and skip the prefix rule when the clause is a single word.
     - Add each row above as a fixture.

### Polish

3. **Clearing the photo cache on sign-out is incomplete.**
   - **Rules:** impeccable harden; round-7 "Also noted".
   - **Where:**
     - `clearPhotoCache` (photoUrls.ts:141) empties `cache` and `inflight`. A signing already in flight still resolves afterwards and writes the last person's URL back in (photoUrls.ts:113, and `flush` at :48). A batch still waiting in `pending` is not dropped.
     - AuthProvider.tsx:70 clears it only on this tab's own sign-out. The `!session` branch (lines 38–42), which runs when another tab signs out, does not.
   - **Change:** keep a generation counter that `clearPhotoCache` bumps, and write to the cache only when the generation is unchanged. Also call it in the `!session` branch.
4. **The frame is measured once.**
   - **Rules:** impeccable optimize; BAOS 5 (the founder's large, zoomed window).
   - **Where:** develop.ts:25–27. A print measured at 1366 keeps its 400 rendition after the window is maximised to 2560 or the page zoom changes, until it remounts.
   - **Change:** use a `ResizeObserver` (or the page-fit resize) that only ever steps the rendition **up**.
5. **The rest of the stacked, duplicated and sub-floor CSS and code.**
   - **Rules:** impeccable polish (no obsolete styles or duplication); BAOS 16 (nothing under 12px).
   - **Where:**
     - astory.css:2405 (cue 11.5px), :2504 (dateline 11.5px) and :2507 (cue 11px) are dead, overridden by archive-reading.css:518–519, but they read as floor violations.
     - astory.css:436 `.mem .print .n` is **live at 11px**. It is the "+2" on a List card with two or more photographs; no current memory has one.
     - archive-reading.css:482 and :514 both set `.print-card.treasured .marks { right: 30px }`.
     - archive-reading.css:584 is a comment with no rule under it.
     - `words()` (PrintCard.tsx:36) and `cardWords()` (MemoryCard.tsx:38) are the same function.
     - MemoryCard.tsx:64's `<img>` lacks `decoding="async"`, which PrintCard has.
   - **Change:**
     - Delete astory.css:2405's and :2504/:2507's font sizes, and set `.mem .print .n` to 12px.
     - Delete archive-reading.css:482 and :584.
     - Move the card words into one export.
     - Add `decoding="async"`.

### Emil's review table

| Before | After | Why |
| --- | --- | --- |
| `renditionWidth(el.offsetWidth, …)` with `contain` | Sign the frame's W×H with `cover`, or step on `max(w, h × 1.5)` | A 3:2 photograph in a square print is upscaled 1.3–1.6× |
| `brokeOff`, `REACTION_Q`, `ASK` + `ASKER_GOES_ON`, "yes" as back-channel, any-earlier-sentence dedupe | Each narrowed as in gap 2 | 17a: never change what was meant, never an answer |
| `clearPhotoCache()` on this tab's sign-out only | A generation guard, and also on `SIGNED_OUT` from another tab | No signed URL survives into the next person's session |
| Measure the frame once | A resize observer that only steps up | The founder resizes and zooms large windows |

## Brand rulings applied (the brand wins over the skill)

- The small-caps kickers, the hairlines, the foil ✦, the gilt glint, the print lift, the photo corners and the foil full stop are book material by DESIGN.md. Taste-lint's FAILs on them are not counted.
- The cream and terracotta palette is the brand's own.

## Clean on this pass

- **The title's full stop (MemoryLead.tsx:68):**
  - All seven memory titles end in the foil stop (`rgb(201, 161, 90)`), `aria-hidden`, attached to the last word.
  - A title that already ends on its own punctuation gets none.
  - On the treasured memory the seal sits on the same line after it, at 1366 and at 390.
  - Every title runs to 2 lines at 1366.
- **Photographs:**
  - Every rendition keeps the original's ratio.
  - The developing print is dark under the veil until loaded, then fades in over 240ms, opacity only.
  - At 2560 (zoom 1.3, density 1.5) the originals load.
- **Requests:** 4 signing requests on one Archive load (List or Prints) for 4 photos, and 4 on Home. None is duplicated, and there is no batch call for them.
- **List view:** the excerpts are the takeaway, whole, at 18px, with no clamp (`-webkit-line-clamp: none`). The kickers are 12px.
- **Prints:** cues, kickers and datelines compute 12px or more (cue 12, kicker 12, dateline 13).
- **Page width:** no horizontal scroll at 390, 1366, 1920 or 2560 (the document is never wider than the window).
- **Motion:** every hook in `archive/motion.ts` is inside `gsap.matchMedia` with a revert, and the tweens use `fromTo` and `clearProps`. Nothing animates besides transform and opacity.
- **The tidy in the real calls:** the only removals are filler sounds, the other person's back-channel ("Wow, that's amazing", "Wait, were you?"), filler "like", exact stutters, one sanctioned restart, and the opening "No," (tested by the lead). Hedges before amounts ("like ten", "like hundreds of thousands") and the quoting or feeling "like" stay.
- **"I specifically PhD of finance."** (459228bd) is the stored words as they are. The page offers no tidy toggle for this memory, so the tidy removed nothing. The gap is in the transcription, not in the cleaner.

## Shared state

- When I opened my tab, the stored Archive view was "list".
  - I switched to Prints to measure it, then back with the List button. It reads "list" now.
- `astory-app-auth` is present and I did not touch it. I did not sign out and wrote no data.
- Done in my tab's memory only, with nothing saved:
  - the two broken rendition URLs (the `onError` test);
  - the "exact words" toggles;
  - one session's `transformsOff`, cleared by the reloads.
- Tab-128 is closed, and its viewport was reset to desktop first. It was the only tab listed, so closing it may have closed the pane.
