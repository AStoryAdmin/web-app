# Skills Steward: the Archive, the memory page, and PrintCard, MemoryCard and Mosaic on Home, round 9

**Verdict: NOT APPLIED.** No blocker, three ugly, three polish. The photographs now pass: no frame is upscaled at density 1, 1.5 or 2 at any size I measured, the resize observer only ever steps up, and the clearPhotoCache generation guard holds in all three cases I tried. Five of the round-8 gaps are closed and one (gap 4) is half closed.

Three things keep this from passing:
- The tidy still drops or collapses spoken words that the reworded 17a now protects in so many words. It drops a comparing "like" before a bare noun, a hedge such as "like for a year", and refrains said twice. One live memory now shows a stutter that round 8 removed.
- The data-long title step is keyed on character count. Titles still run to three lines at 375 and 360 (three of them at 360), and at 320.
- The step-up only follows the frame's CSS size, so it misses a change in zoom or screen density alone.

## How this was checked

- **Skills read:**
  - taste-skill: SKILL.md (house rules and the headline rule).
  - hallmark: responsive (the 320, 375 and 414 floor), interaction-and-states and slop-test.
  - emil-design-eng: easing, durations and frequency.
  - impeccable: craft-floor and optimize (images: "proper sizing", responsive sources).
  - gsap-performance, gsap-react, gsap-scrolltrigger and gsap-timeline: no motion changed this round, so these were checked for regressions only.
  - Also read: BAOS-STANDARD.md 17a (reworded in 82a0462), archive-r8-skills.md and archive-r8-baos.md.
- **Code read:** the whole of commit 25673a2 under `src/`, and in full: `lib/photoUrls.ts`, `archive/develop.ts`, `lib/zoom.ts`, `AuthProvider.tsx` (the auth listener) and the changed parts of `transcript.ts`. That covers `liftQuestions`, `cleanSpeech`, `dropRestarts`, `isFillerLike`, `HEDGES_AMOUNT`, `meantTwice` and `leadFiller`.
- **Tools run:**
  - `vitest run src/components/archive src/lib/photoUrls.test.ts` passes: 4 files, 115 tests. `tsc --noEmit` exits 0.
  - taste-skill `lint.mjs` finds nothing new on the changed lines. Every flag there is a brand-exempt kicker, gradient or hairline.
  - Copies of the new `transcript.ts` and the round-8 one (`25673a2^`) were run under Node 24 in my scratchpad:
    - about 150 sentences: every example in both round-8 reports, plus new probes written against the reworded 17a;
    - the six spoken memories, read read-only through the app's own `loadAccount` and diffed old against new.
- **Rendered:** my own pane tab (tab-140), force-reloaded at 320×700, 360×800, 375×812, 390×844, 800×1024, 1366×768, 1600×1000, 1920×1000, 2400×1500 (zoom 1.5), 2560×1300 (zoom 1.3) and 3840×2160 (zoom 2.16). The pane's density was 1.5, and 2 at 375.
  - For every `img.pic` on Home, the Archive List and the Archive Prints, I measured the frame and its rect. I fetched the loaded file to get its real pixel size.
  - From those numbers I computed what the code asks for at density 1, 1.5 and 2 against what `object-fit: cover` needs.
  - I watched each `<img src>` with a MutationObserver while resizing and while changing the html zoom.
  - I counted signing requests with Resource Timing.
  - I imported `lib/photoUrls.ts` in my own tab to test the generation guard.
  - Line counts for the eight memory titles at 320, 360, 375 and 390.
- **Not verified:**
  - Real density-1 and density-2 screens: those columns are computed from measured frames and the code's formula. Only density 1.5 (and 2 at 375) was live.
  - A real monitor change: the density-only case in gap 5 is reasoned from the observer's contract and the zoom-only measurement.
  - Real sign-out: the guard was exercised by calling `clearPhotoCache()` in my tab only.
  - Reduced motion and keyboard order were not re-checked, because no motion or markup order changed.

## The three questions asked

**Is any frame upscaled at density 1, 1.5 or 2? No.** The four photographs are 0.80 (1122×1402) and 1.50 (1200×800). Worst ratio of pixels needed to pixels delivered (1.00 or more would be upscaled):

| Where | Frame (CSS px) | Density 1 | Density 1.5 | Density 2 |
|---|---|---|---|---|
| Archive Prints, 375 | 151×201 (3:4) | 400: 0.75 | 600: 0.75 | original |
| Archive Prints, 800 | 220×220 | 400: 0.83 | 600: 0.83 | original |
| Archive Prints, 1366 | 254×254 | 400: 0.95 | 600: 0.95 | original |
| Archive Prints, 1920 | 363×363 | 600: 0.91 | original | original |
| Archive Prints, 2560 (zoom 1.3) | 363 (rect 472) | original | original | original |
| Archive List, 375 | 104×105 | 400: 0.37 | 400: 0.55 | 400: 0.73 |
| Archive List, 1366 | 132×134 | 400: 0.47 | 400: 0.70 | 600: 0.62 |
| Archive List, 1600 | 168×170 | 400: 0.60 | 400: 0.91 | 600: 0.81 |
| Archive List, 2560 / 3840 | 168 (rect 210 / 348) | 400: 0.79 / 600: 0.87 | original | original |
| Home, 375 | 151×201 | 400: 0.75 | 600: 0.75 | original |
| Home, 1366 | 232×232 | 400: 0.87 | 600: 0.87 | original |
| Home, 2560 (zoom 1.3) | 334 (rect 434) | original | original | original |

- The round-8 phone print (158×211 at density 2, then 1.58×) now loads the original.
- `max(w, h × 1.5)` guarantees this for any photograph up to 3:2.
- The only place where the pixels run short is the original itself on a dense, very large print. At 2560 and density 2 a 1200px landscape needs 1416. Nothing larger exists to send.
- A List load still makes 4 signing requests for 4 photos. Switching to Prints at 1366 and density 1.5 signs 4 more, which is right: those frames need the 600 step.

**Does the ResizeObserver step up only? Yes.**
- At 1366 the Prints asked for 600. Resized to 1920, all four swapped to the original in place, with no remount.
- Resized back to 1366, they stayed on the original.
- `larger()` never returns a smaller step, and `undefined` (the original) is final.
- Gap 5 is the case it does not catch.

**Does the clearPhotoCache generation guard hold? Yes.** These are the results in my tab:
- A rendition signing in flight, then a clear: it resolves `null` and is not cached.
- A batch still pending in the same tick, then a clear: `pending` is dropped, it resolves `null` and is not cached.
- A batch already flushing over the network, then a clear: it resolves `null` and is not cached.
- A control with no clear: it resolves and is cached.
- `AuthProvider` now clears in the `!session` branch, so a sign-out in another tab clears it too.
- Two small leaks remain on the error path (gap 6).

## Round-8 gaps, checked

| # | Round-8 gap | Now |
|---|---|---|
| 1 | Landscapes upscaled in square and 3:4 prints | **Done.** See the table above. The tests include the 3:4 phone frame with a 3:2 photograph, and a test that the transform never carries a height. |
| 2 | The tidy goes beyond 17a in six ways | **Done for all six rows.** "We gave the flowers to, the old lady…", the refrain later, "Why did I leave Vietnam…", "Oh, how could I ever forget…", "Was it hard? Yes.", "a big, big house", "Run, run, run!" and "Very, very, very good" all stand. "So we did like a, we built" still restarts. New cases of the same rules are in gaps 1 and 2. |
| 3 | clearPhotoCache incomplete | **Done.** See the guard results above. |
| 4 | The frame measured once | **Half done.** It steps up when the frame's CSS box grows. It does not step up when only the zoom or the density changes (gap 5). |
| 5 | Stacked and sub-floor CSS and code | **Mostly done.** All of these are fixed: the cue is 12px, the phone overrides at :2504 and :2507 are gone, `.mem .print .n` is 12px, archive-reading.css :482 and :584 are gone, `cardWords` is one export in `memoryDisplay.ts`, and MemoryCard has `decoding="async"`. Two leftovers are in gap 6. |

The round-8 BAOS defects, re-run:
- 1 (the comparing "like a really…"): **fixed**. Live, c21c now reads "He was like a really good fan."
- 2 ("to" and "of"): **fixed**. All six strings stand.
- 3 (an answer to a short question): **fixed within a paragraph**. The case across paragraphs is gap 4.
- 4 ("like around", "like over", "like once", "like halfway"): **fixed**.
- 5 ("Never, never", "Very, very", "Long, long", "No, no", "So, so", "Yes, yes"): **fixed**. "So, so, so happy" is gap 2.
- 6 (title on a phone): **fixed at 390 only**. See gap 3.

## Gaps, skill by skill

### Ugly

1. **The tidy still drops a "like" that compares or hedges, so a likeness becomes a fact, or a guess a certainty.**
   - **Rules:** BAOS 17a as reworded ("never changes what was meant… never a hedge before an amount… When in doubt it keeps the words"); taste substance (the words are the person's own).
   - **Where:**
     - transcript.ts:383–384. `isFillerLike` counts a comparison only before an article or a fixed list of pronouns ("this, that, it, my… home, family").
     - :362 `HEDGES_AMOUNT` counts a hedge only when the amount follows "like" directly.
   - **Evidence** (`cleanSpeech`). Not one live memory hits these.

     | Said | Shown |
     |---|---|
     | We were like brothers | We were brothers. |
     | It was like yesterday | It was yesterday. |
     | Our village was like paradise / It was like heaven / It was like war | …was paradise / was heaven / was war |
     | They were like children / We were like strangers / We were like ghosts | …were children / strangers / ghosts |
     | He was like Superman | He was Superman. |
     | They treated us like animals | They treated us animals. |
     | It smelled like jasmine / We fought like cats and dogs / She cooked like nobody else | It smelled jasmine. / We fought cats and dogs. / She cooked nobody else. |
     | We stayed like for a year / We walked like for hours | We stayed for a year. / We walked for hours. |
     | I was like in my twenties / He came home like at six / We left like in 1975 | I was in my twenties. / …at six. / …in 1975. |
     | We waited like until midnight / It happened like right after the war | …until midnight. / …right after the war. |

     "She was like family", "He was like my best friend", "It looked like rain" and "like ten years older" stand.
   - **Change:**
     - Turn the default around: drop "like" only when it is certainly filler. That means the next word is an intensifier or adverb (`really|so|very|super|totally|just|pretty|literally|actually|basically|kind|sort`, or a word ending in "-ly"), or a verb after a subject or a conjunction ("and like worked"), or the "like" is set off by commas on both sides ("It was, like, the hardest thing").
     - Otherwise keep it. "taught like teenagers" in 342e would then stay, which is safe under "when in doubt".
     - Let `HEDGES_AMOUNT` take a preposition before the amount: `(?:for|in|at|until|till|by|after|before|within|since|from|on)\s+` followed by a number, a/an + unit, "my twenties/thirties…", "hours|days|weeks|months|years|ages|a while|midnight|noon|dawn", or `right after|right before`.
     - Add every row above as a fixture.

2. **Doubled words and repeated sentences: emphasis still collapses, and one live stutter now stays.**
   - **Rules:** BAOS 17a ("never a sentence that repeats one said earlier for emphasis… never a word doubled for emphasis"; it may remove "an exact adjacent stutter"); reading-2026 §3.5 (stutters go).
   - **Where:**
     - transcript.ts:212 drops a sentence equal to the one just before it. My round-8 advice (adjacent and exact) is what the builder did, but the reworded 17a now forbids it for a refrain.
     - :153 `meantTwice` protects only a single word with a comma, so a repeated phrase collapses.
     - :19 and :155: `LEAD_FILLER` with `leadFiller` protects exactly two of a `MEANT_TWICE` word, not three, and never "okay".
     - :148 `SLIP_WORD` lacks the pronoun contractions.
   - **Evidence:**

     | Said | Shown |
     |---|---|
     | I miss her. I miss her. / I'm sorry. I'm sorry. / We were happy. We were happy. | I miss her. / I'm sorry. / We were happy. |
     | No. No. No. | No. |
     | I love you, I love you / Thank you, thank you | I love you. / Thank you. |
     | So, so, so happy | **Happy.** |
     | Okay, okay, I'll go | I'll go. |
     | **Live, 342e:** "So that's, that's kind of why we chose to do that." | Now kept as said. Round 8 showed "So that's kind of why…", which both reports accepted. |

   - **Change:**
     - At :212, keep an exact repeat of a whole sentence. Keep only the prefix case (`prev.includes(",") && n === prevClause`, the eSports sentence).
     - In `meantTwice`, treat a repeated phrase as emphasis when the second copy ends its clause, with nothing after it before the comma or full stop ("I love you, I love you"). A copy that the clause goes on from ("he was, he was a good man") stays a stutter.
     - In `leadFiller`, keep any run of two or more of the same `MEANT_TWICE` word, and "okay, okay".
     - Add `that's|it's|i'm|we're|they're|he's|she's|there's|i've|we've|i'd|you're|i'll|we'll|was|is` to `SLIP_WORD`, so "that's, that's" and "it was, was" collapse again.
     - Add each row as a fixture, with 342e's sentence among them.

3. **Memory titles still run to three lines on phones.**
   - **Rules:** taste-skill house rule ("Headlines: two lines or fewer, at every width"); hallmark responsive (320, 375 and 414 are non-negotiable); DESIGN.md craft rules.
   - **Where:** MemoryLead.tsx:64 sets `data-long` when `title.length > 52`. archive-reading.css:643 then sets 27px below 600px. A character count does not know the column width.
   - **Measured** (lines, in a 280, 320 or 335px column):

     | Title | 320 | 360 | 375 | 390 |
     |---|---|---|---|---|
     | Funding a startup through pitch competitions. (32px) | **3** | **3** | 2 | 2 |
     | Losing grandparents and preserving a grandfather's story. (27px, data-long) | **3** | **3** | 2 | 2 |
     | Building Better Play Studios through bootstrapping. (32px) | **3** | **3** | **3** | 2 |
     | Choosing a startup over finance graduate study. / Pausing a PhD to support startup ventures. | **3** / **3** | 2 / 2 | 2 / 2 | 2 / 2 |

     At 360 the balanced three-line block of c21c leaves the right fifth of the column empty (screenshot).
   - **Change:** fit by measurement, not by length.
     - After fonts load, and on resize below 600px, step `.mv-title` down 1px at a time from 32px until it holds two lines, with a floor of 24px. Count the lines from `Range.getClientRects()`, grouped by line.
     - Or set `font-size: clamp(24px, calc((100vw - 40px) / 10.5), 32px)` below 600px, where page zoom is always 1. Then re-measure the eight titles at 320, 360 and 375.
     - Remove the `data-long` attribute and its rule once one of these lands.

### Polish

4. **An answer in the paragraph after its question is still dropped.**
   - **Rules:** BAOS 17a ("never an answer").
   - **Where:** `cleanSpeech` (transcript.ts:174) starts `answering` from `answer`, per paragraph. A short question (under five words, so not lifted) that ends one paragraph does not carry over to the next.
   - **Evidence:**
     - `cleanTranscript(["Were you scared there?", "Yes. We had nothing."])` gives "Were you scared there?" and then "We had nothing."
     - The same text in one paragraph keeps "Yes."
   - **Change:** in `cleanTranscript`, pass `answer: true` to a paragraph whose previous paragraph (as shown) ends on a question that is not a tag. Add the fixture.

5. **The step-up misses a change in zoom or density alone, and a photograph wider than 3:2.**
   - **Rules:** impeccable optimize ("proper sizing"); BAOS 5 (the founder's large, zoomed window); the code's own comment at develop.ts:28 ("a page zoom steps the rendition up").
   - **Where:** develop.ts:41 observes the content box in CSS pixels. Under the page-fit zoom (`lib/zoom.ts`), the layout size depends only on the window's shape once the height binds the zoom. So a window resized to the same shape, or moved to a denser screen, changes the device pixels and leaves the box alone.
   - **Measured:**
     - The Archive List was loaded at 1600×1000 (zoom 1, 400 renditions), then resized to 2400×1500 (zoom 1.5).
     - The resize and `astory:zoom` events fired. The observer did not fire, and no `src` changed.
     - The landscape thumbnails were left at 400px for 544 device pixels needed: **1.36× upscaled**. A remount fixes it.
     - Separately, `max(w, h × 1.5)` assumes 3:2. A 16:9 phone photograph in a square print would be upscaled up to 1.19×. None of the four photographs is wider than 3:2 today.
   - **Change:**
     - Also step up on `ZOOM_EVENT` and on a `matchMedia(\`(resolution: ${devicePixelRatio}dppx)\`)` change. Or observe `{ box: "device-pixel-content-box" }` where it is supported, falling back to the content box.
     - In `onLoaded`, if `naturalWidth` is below what `cover` needs for this frame at the loaded image's own ratio, step up through the same `larger()` path. That covers any ratio.

6. **Small leftovers in the guard and the CSS.**
   - **Rules:** impeccable harden and polish (no duplication); BAOS 16 (nothing that reads under 12px).
   - **Where:**
     - photoUrls.ts:121–124. When a signing from before the clear fails, it sets `transformsOff = true` in the new session, then calls `original()`, which signs and caches the old path under the new generation.
     - :126's `inflight.delete(key)` can delete a newer request's entry for the same key. That costs only the shared call.
     - archive-reading.css:518 `.print-card .cue { font-size: 12px }` now repeats astory.css:2405.
     - astory.css:2399 `.print-card .cap .kicker` still declares 10.5px, which archive-reading.css:514 overrides everywhere. It is dead, but it reads as a floor violation.
   - **Change:**
     - In the `catch`, return `null` when `gen !== generation` before touching `transformsOff` or `original()`.
     - Delete only if `inflight.get(key) === job`.
     - Delete archive-reading.css:518, and make astory.css:2399 12px (or drop its size).

### Emil's review table

| Before | After | Why |
| --- | --- | --- |
| "like" dropped unless an article or pronoun follows | "like" kept unless certainly filler (intensifier, adverb, verb, or commas on both sides) | "We were like brothers" is not "We were brothers" |
| A hedge counted only when the amount follows "like" directly | A preposition then an amount counts too | "like for a year" is a guess |
| An exact adjacent repeat dropped; repeated phrases collapsed | Refrains kept; a phrase is a stutter only when the clause goes on from it | 17a: never a repeat said for emphasis |
| `data-long` when the title has more than 52 characters | Fit to two lines by measurement, from 32px down to 24px | Three lines at 320, 360 and 375 |
| Observe the CSS box only | Also on zoom, density and the loaded image's real ratio | 1.36× after a same-shape resize |

## Brand rulings applied (the brand wins over the skill)

- The kickers, hairlines, foil ✦, gilt glint, print lift, photo corners and the foil full stop are book material by DESIGN.md. Taste-lint's FAILs on them are not counted, and neither is impeccable's eyebrow ban.
- The cream and terracotta palette is the brand's own.

## Clean on this pass

- **Photographs:**
  - No upscaling at any measured size or density (see the table).
  - The step-up swaps in place, with no blink, because the old image holds until the new one decodes.
  - Every rendition keeps the original's ratio.
  - The cards are keyed by memory id, so a frame's state is never carried to another memory.
- **The tidy in the real calls:** the six spoken memories, diffed round 8 against round 9, changed in only two sentences.
  - c21c's likeness is restored.
  - 342e's "that's, that's" is the regression in gap 2.
  - All six takeaways are unchanged: 4592 "The best way to learn finance is to build a business.", 342e, 0ced, f6a7, 5963 and c21c.
- **Sizes:** cues, avatar initials and the "+n" badge compute 12px. Kicker 12px, dateline 13px.
- **Code:** `cardWords` is one function in `lib/memoryDisplay.ts`. Both cards import it, and Home's prints, the List and the page share the same line.
- **Motion:** nothing changed. The ResizeObserver disconnects on unmount, and setting the same step bails out of a render.

## Shared state

- When I opened my tab, the stored Archive view was "list".
  - I pressed Prints and List with the page's own buttons to measure both.
  - Between my loads it read "list" once while I had left it on "prints". Another tab sharing this storage set it. The page writes it only from its buttons.
  - It reads "list" now, as I found it.
- `astory-app-auth` is present and I did not touch it. I did not sign out and wrote no data.
- Done in my tab's memory only:
  - three `clearPhotoCache()` calls;
  - a few extra signing requests (widths 401 and 402);
  - html zoom set by hand to 1.2 and 1.4, then put back;
  - read-only fetches of the loaded photographs.
- To let the ResizeObserver run, I brought my tab to the front of the pane once. tab-73 was the active tab before that. When I closed tab-140, another tab (tab-142, not mine) was active, and I left the pane as it was.
- Tab-140's viewport was reset to desktop, and the tab is closed.
