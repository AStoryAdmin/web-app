# Skills Steward: the Archive, the memory page, and PrintCard, MemoryCard and Mosaic on Home, round 7

**Verdict: NOT APPLIED.** One blocker, two ugly, four polish. Of the 8 round-6 gaps, 7 are closed and 1 (gap 6, stacked CSS) is mostly closed. The fix for round-6 gap 7 (smaller photographs) brought in the blocker: the renditions crop the photographs, and the family's heads are cut off.

## How this was checked

- **Skills read:**
  - taste-skill: SKILL.md (house rules), plus the layout, type and critique references.
  - hallmark: SKILL.md, interaction-and-states, responsive, and the slop-test gates.
  - emil-design-eng.
  - impeccable: SKILL.md, plus craft-floor, polish, layout and optimize (images).
  - gsap-scrolltrigger, gsap-timeline, gsap-react and gsap-performance.
  - Also read: BAOS-STANDARD.md, DESIGN.md and archive-r6-skills.md.
- **Code read:**
  - `lib/photoUrls.ts` in full, and every call to `usePhotoUrl` in `src`.
  - `PrintCard.tsx`, `MemoryCard.tsx`, `Mosaic.tsx`, `archive/develop.ts`, `archive/ToolMenu.tsx` and `archive/motion.ts`.
  - In `archive/transcript.ts`: `HEDGES_AMOUNT`, `JOINED`, `cleanSpeech`, `dropRestarts`, `takeaway` and `opensOn`.
  - `pages/MemoryPage.tsx` from line 120 to 330.
  - All of `styles/pages/archive-reading.css`. In `astory.css`: §49 (`.home-mem`), the `.print-card` and `.mem .print` rules, and the small-print floor (lines 3690–3696).
- **Tools run:**
  - `vitest run src/components/archive` passes: 3 files, 48 tests. `tsc --noEmit` prints nothing.
  - taste-skill `lint.mjs` on the changed files reports 46 FAIL and 6 WARN, all brand-exempt (book material by DESIGN.md: kickers, hairlines, gradients, shadows, the ✦). The ✓ glyph is gone.
  - A copy of `transcript.ts` was run under Node 24 in my scratchpad against 19 spoken sentences (gap 2).
- **Rendered:** in my own pane tab (tab-117), force-reloaded, at 1366×768, 1920×1000, 2560×1300 (html zoom 1.3, after a dispatched resize) and 390×844. The bar was checked at 820 and 930. I stepped the frame clock with `__gsap.ticker.tick()`, measured with JavaScript, and took screenshots.
  - **Prints view (measured this round):** the Archive at all four sizes, and Home's prints at 390 and 1366.
  - **List view:** the Archive at 1366.
  - **The memory page:** all seven memories, opened through the router.
- **Not verified:**
  - The pane was hidden, so lazy images load only when a frame is drawn. Load timings are therefore not real. Bytes and pixel sizes were measured by fetching each print's own `src`.
  - I re-signed two photos with other transform options to test the fix in gap 1. Signing only reads storage; it writes no data.
  - Keyboard order, reduced motion, and the archival scalloped print were checked in code only.
  - The impeccable detector was not run.

## Round-6 gaps, checked

| # | Round-6 gap | Now |
|---|---|---|
| 1 | White caption on cream while a photograph loads | **Done.** While it waits, the frame computes `rgb(59, 41, 29)` (the album's black), with the veil at opacity 1 and the photograph at 0. On a cold load the white titles read at every size (screenshots at 1366, 1920 and 390). |
| 2 | The takeaway set twice in a row when the words open on it | **Done for an opening sentence.** On c21cf4d4 nothing is set under the title, and the first sentence carries the gold mark. 0ced62a7's line is now the "very tight bondings" sentence (`FEELING` gained "memorable" and "bond…"). **A near case remains:** the takeaway as the second sentence (gap 3). |
| 3 | Hover zoom snaps back | **Done.** A resting `.pic` computes `opacity 0.24s …, transform 0.6s …`. |
| 4 | 10px kicker and 11px dateline on Home | **Done.** astory.css's old 3427–3428 are deleted. A dead 11.5px rule is still at astory.css:3694 (gap 7). |
| 5 | Two "BV" seals at 761–900 | **Done.** The picker reads "Bao Vo" at 820 and 930. Every control is 44px, nothing wraps and there is no horizontal scroll. The pill sits with equal gaps to its neighbours (63px at 820, 118px at 930). It is evenly spaced but 63px off the page's centre, which reads as a choice. |
| 6 | Stacked and dead CSS, stale Mosaic comment | **Mostly done.** `.home-mem .mosaic` is now set once, plus its phone rule. The Mosaic comment matches what renders, and the "Round 3/4" patches are folded in. What remains is gap 7. |
| 7 | Full-size photographs | **Done, but it caused gap 1.** Prints ask for 600px and List thumbnails for 400px, and the files are 31–61KB against 70–119KB for the originals. Part of that saving is the crop. |
| 8 | The ✓ glyph in the Public/Private menu | **Done.** It is now `CheckIcon` at 16×16 in `rgb(154, 67, 32)` (`--mv-terra`) on the chosen item, with `aria-checked`. Opening and closing the menu changed nothing (the memory stayed Public). |

## Gaps, skill by skill

### Blocker

1. **The renditions crop the photographs, and heads are cut off.**
   - **Rules:** impeccable optimize ("proper sizing": resize, never re-crop) and polish (correct aspect ratios); taste critique pass 8 ("is anything … a stretched photo?"); BAOS 17 (photographs lead).
   - **Where:** photoUrls.ts:85 calls `createSignedUrl(path, TTL, { transform: { width } })`. Supabase's default `resize` is `cover`, and with no height the original height is kept. A 1122×1402 photograph comes back as **600×1402** (400×1402 for the List), and a 1200×800 one as **600×800** (400×800). Each is a centre strip of the picture, which the square print then crops again.
   - **Measured at 1366 and 2560:**
     - The wedding print ("Funding a startup…") shows the couple from the neck down.
     - On "Choosing a startup…", the woman on the phone loses her head.
     - With the original swapped into the same `<img>` (in my tab only), both faces are back in frame (screenshots).
     - In a square print the portrait is zoomed about 1.9×. A List thumbnail shows the middle third of a landscape photograph.
     - This affects all four photo prints on the Archive and on Home, in both views.
   - **Change:**
     - Use `transform: { width, resize: "contain" }`. I signed it both ways: contain gives 600×750 (48KB) and 600×400 (36KB), the whole photograph. Square prints could use `{ width: 600, height: 600, resize: "cover" }` (600×600, 40–43KB), but contain is safe for every frame shape.
     - Re-measure the byte savings in the photoUrls.ts:72–76 comment: it was measured on the cropped strips.
     - Add a check that a rendition keeps the original's aspect ratio.

### Ugly

2. **`JOINED` keeps a stammered conjunction, and can delete the clause before it.**
   - **Rules:** taste substance (the words are the person's own and must be whole); BAOS 17 and 20.
   - **Where:** transcript.ts:134 and :164. `JOINED` is meant for a phrase that ends on a conjunction ("worse and | worse and"), but it is also tested against a single word, and the single word *is* the conjunction. So "and, and", "but, but", "then then" and "by, by" now survive.
   - **What then happens:** with a comma, `dropRestarts` (transcript.ts:123, `brokeOff` on a short clause ending in "and") throws away everything before it.
   - **Run on a copy of the current file:**
     - "I went to the store and, and I bought bread." → **"And I bought bread."**
     - "We were poor but, but we were happy together." → unchanged, with the stammer.
     - "Then then we moved to Saigon…" → unchanged.
     - With the `JOINED` check removed, all three tidy correctly, but "worse and worse and then" collapses. So the condition needs narrowing, not deleting.
     - None of the seven memories hits this today (no doubled conjunction in any rendered text). It is latent until the next call.
   - **Change:** apply `JOINED` only to a phrase: `MEANT_TWICE.test(x) || (/\s/.test(x) && JOINED.test(x))`. Add tests for "and, and", "but, but" and "then then" (each collapses), and keep the existing tests for "worse and worse and then" and "again and again and finally".
3. **The takeaway is still set twice in a row when it is the second sentence.**
   - **Rules:** impeccable polish (no duplication); BAOS 19 and 32; round-6 gap 2 in a new place.
   - **Where:** MemoryPage.tsx:213 with `opensOn` (transcript.ts:483), which looks only at the first sentence.
   - **Measured at 1366 on 459228bd:**
     - The words open "I specifically PhD of finance. And that's always been the dream because I love teaching."
     - The kept line under the title ends at y=401. The same sentence, marked in gold, starts at y=494, 93px below and 31 characters into the words.
     - The coda then sets it a third time.
     - On the other memories the mark is at least 239 characters in (0ced62a7, f6a734be) or far down the page.
   - **Change:** let `opensOn` return true when the takeaway starts within the words' first two sentences and the first sentence is short (about 40 characters or fewer), or simply when the mark starts within the first 60 characters. The existing rule then sets nothing under the title. Add 459228bd's opening as a fixture.

### Polish

4. **Signing one photo at a time: bounded, but it multiplies requests.**
   - **Rules:** gsap-performance and impeccable optimize (request count); the brief's "can't hammer the API".
   - **What happens:**
     - Each print now makes its own `createSignedUrl` POST (photoUrls.ts:85), where before there was one batched call for the page.
     - This fires when the card mounts, not when it scrolls into view, so `loading="lazy"` defers only the download.
     - There is no in-flight de-duplication. On one load of the Archive I counted 8 signing calls for 4 photos (React StrictMode runs each effect twice in dev). In production a remount before the first call resolves does the same.
     - A failed sign is not remembered, so each later mount tries the transform again before falling back.
   - **Not a loop:** the cost is one call per photo per mount, and nothing retries on its own. But an archive of 100 photographed memories would fire 100 POSTs at once.
   - **Change:**
     - Keep a `Map<key, Promise>` of in-flight requests.
     - Cap concurrency (about 4–6), or sign a print when it first comes near the viewport.
     - Remember a failed transform for the session, so later requests go straight to the batched original.
5. **A rendition that fails to load leaves a print dark forever.**
   - **Rules:** hallmark (error is a designed state); impeccable harden.
   - **Where:** PrintCard.tsx:112 and MemoryCard.tsx:220 have `onLoad` but no `onError`. The fallback in photoUrls.ts:88–91 covers only a failed *signing*. If the render endpoint refuses the image (transforms switched off, a plan change, a quota), the print keeps the album-black ground with no photograph and no sign of trouble.
   - **Change:** on `error`, swap once to the original (`photoUrl(url)` without a width) and mark it in the cache. The comment's "If the transform cannot be signed, the original is used" will then be true for loading too.
6. **A fixed 600px ignores the zoom and the screen's density.**
   - **Rules:** impeccable optimize (responsive sources); hallmark responsive ("`srcset` with width descriptors").
   - **Measured:**
     - At 2560×1300 the page zoom is 1.3 and this pane's DPR is 1.5. A 363px print then needs **708** device pixels, and it gets 600.
     - At 1920 on a 2× screen it needs 726.
     - This is the founder's class of display (a large Edge window, zoomed).
   - **Where:** PrintCard.tsx:76 (`600`) and MemoryCard.tsx:204 (`400`).
   - **Change:** pick the width from the print's box × `pageZoom()` × `devicePixelRatio`, in steps (400, 600, original), or give the `<img>` a `srcset` of the 600 rendition and the original with `sizes`. The comment already notes that 800px is no smaller than the original, so "original" is the right top step.
7. **The rest of the stacked and dead CSS.**
   - **Rules:** impeccable polish (no obsolete styles or duplication); round-6 gap 6.
   - **Where:**
     - astory.css:3694–3695 set the print kicker to **11.5px** and the dateline to 12px. archive-reading.css:514–515 override both, so the rules are dead, and the kicker one is below the 12px floor.
     - astory.css:3422 sets `-webkit-line-clamp: 2` on Home's titles. It does nothing, because archive-reading.css:554 makes the title `display: block`: at 390 it computes "2/block" and the titles run whole on three lines.
     - archive-reading.css:420 sets `.arc-tools ~ .arc-prints` to `--s-6`, and :465 sets it again to `--s-8`.
     - `.mv-menu-item:focus-visible` is declared twice (:222 and :224).
     - :519–521 restate :451–452.
   - **Change:** delete astory.css:3694–3695, the line clamp at astory.css:3422, archive-reading.css:420's second selector, and :519–521, and merge :222 and :224.

### Also noted (not counted as gaps)

- **Leaks: none found.**
  - Signed URLs are not logged (only the error message is), and they are not placed in a route, a query or analytics.
  - The render tokens are scoped to one path and last an hour.
  - The module-level cache survives a sign-out, because `AuthProvider.signOut` does not reload the page. A later user in the same tab could only reach a cached URL by asking for that exact path. This was already true of the originals. Clearing `cache` on sign-out would close it.
- "I specifically PhD of finance." (459228bd) reads as if words were lost in tidying or in the call itself. It is worth a look against the raw transcript.
- In the hidden pane, Escape did not close the Public/Private menu, because the first item is focused in a `requestAnimationFrame` that never ran. In a visible window the focus moves into the menu and Escape works. Not counted.

### Emil's review table

| Before | After | Why |
| --- | --- | --- |
| `transform: { width }` (cover; keeps the original height) | `transform: { width, resize: "contain" }` | The rendition re-crops the photograph; the faces go |
| One `createSignedUrl` per mount, no de-duplication | An in-flight promise map, capped concurrency, failures remembered | Perceived speed and request count; 8 calls for 4 photos on one load |
| `<img onLoad>` only | `onError` → the original, once | A failed rendition must never leave a blank print |
| `usePhotoUrl(photo, 600)` | Width from box × zoom × DPR, or `srcset` | 708 device px needed at 2560, 600 given |

## Brand rulings applied (the brand wins over the skill)

- The small-caps kickers, the hairlines, the foil ✦, the gilt glint, the print lift and the photo corners are book material by DESIGN.md. Taste-lint's FAILs on them are not counted.
- The cream and terracotta palette is the brand's own.

## Clean on this pass

- **The Prints view, measured:**
  - **1366:** four across, 266px each. Titles run whole at 21px (one to three lines). Typed cards set their takeaway whole at 16px, with no line clipped.
  - **1920:** four across, 375px each. The typed words are at 22px, whole.
  - **2560 (zoom 1.3):** the same grid, scaled. No horizontal scroll.
  - **390:** two across, 158×211 (3:4). Titles are 16–17px. The words are whole at 15px and never meet the caption.
  - **Home:** three across at 1366 (244px) and two at 390, with the same rules.
  - At every size, the document is no wider than the window.
- **`HEDGES_AMOUNT`:** keeps "like" before an amount, a number or a negation ("like ten", "like a thousand", "like no money", "like, about midnight"). It leaves the verb ("I like all of…") and the comparison ("like every mother") alone, and still drops filler "like" ("I was so so happy"). When in doubt it keeps the word.
- **The developing print:** a dark ground, the veil and the white caption until `data-loaded`, then a 240ms fade. Opacity and transform only. Reduced motion sets `transition: none`.
- **Motion:** every hook in `archive/motion.ts` is inside `gsap.matchMedia` with a revert, and the tweens are `fromTo` with `clearProps`.
- **Small print:** every print kicker and dateline computed 12px or more (the kicker 12px, the dateline 13px).

## Shared state

- When I opened my tab the stored view was "list". I switched to Prints to measure it.
- When I came back to the Archive at the end it already read "list" again, set by another tab, so I made no click to restore it. It reads "list" now.
- `astory-app-auth` is still present and I did not touch it. I did not sign out and wrote no data. The original swapped into two prints and the two test signings were in my tab's memory only.
- Tab-117 is closed and its viewport reset.
