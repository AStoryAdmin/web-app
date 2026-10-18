# Skills Steward: writer, round 5

**Verdict: GAPS (0 blockers, 0 ugly, 7 polish).** The round-4 ugly gap (B1) is fixed, and so are B2, B3, B6 and B7. B4 and B5 are better but not finished. The fresh pass found four small things: an orphaned way-to-begin pill on tablets, Bond 8px under the subtitle on tablets, error copy that says "try again" twice, and OpenLeaf, which is no longer mounted anywhere.

**Scope:**
- `src/pages/Write.tsx`
- `src/styles/pages/writer.css`
- `src/components/delight/OpenLeaf.tsx`
- The `.ol-dog` rules in `src/styles/astory.css` (lines 3474–3482, 3513, 3518–3519 at the time of reading)
- B6's fix in `src/lib/arrive.ts:155`

**Skills loaded:**
- taste-skill: SKILL.md (house rules, laws) and the critique reference.
- hallmark: the disciplines, the 58-gate slop test, the interaction-and-states and responsive references.
- emil-design-eng.
- impeccable: craft-floor, polish, layout; the critique headings.
- GSAP: react, timeline, performance, and the scrolltrigger refresh and cleanup rules.
- humanizer, for the error copy.

I also read `docs/BAOS-STANDARD.md` and `DESIGN.md`.

**How it was checked:** I read the code. Then I rendered the page in my own tab (`tab-79`, now closed, viewport reset) and measured it with JS after stepping the GSAP ticker.
- **Step 1 (`/write`):** 1366×768, 1366×700, 1920×1000, 2560×1300 (`--zoom` 1.3), 768×1024, 390×844 and 320×700.
- **Step 2 (`/write?edit=59632e67…&details=1`):** loaded at 390, then widened to 1366 and narrowed to 390 again, without changing anything.
- **The art:** I read each pose's real size from the files.
- **The pane doesn't fire resize or media-query events.** That is the emulator, not the app: `useMedia` kept the old layout until a reload. So I reloaded after every resize for the layout checks. For B6 I didn't reload, because the rewrap is plain CSS layout and needs no event.
- **Simulated in the DOM, then removed:** the phone keep error, for one measurement each, and one injected CSS rule (the 72px padding).
- **Swapped, then restored:** the 320 headline, for four sample questions.

I typed nothing, pressed nothing and saved nothing. I created no drafts and removed none.
- The `beeedb62…` draft was untouched.
- While I worked, another session put a story-level draft ("We had a dog.") in this browser, and it was gone again on a later load. It wasn't mine, and I didn't touch it.
- No console errors.

**Files changed while I worked:** `Write.tsx`, `arrive.ts`, `astory.css`, `Home.tsx` and `Archive.tsx` all carry an mtime of 00:05:58, during this review, and the dev page reloaded itself at that moment. I re-checked the lines this report cites after that time. The writer code I reviewed is the same.

**Not verified:**
- Reduced motion.
- Real Edge and a zoomed Edge window.
- 375 and 414 (320 and 390 were measured).
- A real failed Keep (simulated only).
- OpenLeaf in a page: it's not mounted anywhere now (N7), so B2 and B7 there are code-only.
- Desktop pixels at native resolution: the pane scales desktop sizes down, so the desktop dog was judged from measurements.

## Round-4 gaps, re-checked

| # | Gap | Now |
|---|---|---|
| B1 | Bond's head in the headband and the foil frame | **Fixed at 768 and up; tight at 700 (N1).** Padding is 80px on the spread (`writer.css:39`) and 64px when the window is short (`:163`). The frame line is at y 90. At 1366×768 his top is at 103 asleep and 105 awake, 13–15px clear, and the keep bar ends at 756 of 768. 1920×1000 measures the same. 2560×1300 (zoom 1.3) is in proportion. At 1366×700 he is only 6px (asleep) and 5px (awake) clear. |
| B2 | Poses not at one scale | **Fixed.** The art was re-cut: sleep is 781×622, cover 738×630 and curious 753×630. Every `<img>` now carries its real size (`Write.tsx:147–148`, `OpenLeaf.tsx:79–80`). Both boxes are `781 / 640`, and each pose is drawn at its own height share (`writer.css:103–105`, `astory.css:3478–3479`). Measured at 1366: sleep is drawn at 96/781 = 0.1229 and cover at 77.5/630 = 0.1230. OpenLeaf works out to 0.192 for both poses. |
| B3 | Cut-flat cover pose on the board | **Fixed.** `.w-dog .awake { clip-path: inset(0 0 13px 0) }`, with 10px on the phone (`writer.css:105`, `:469`). The awake pose now ends exactly at the book's top edge: bottom 179 at 1366 and 335 at 390, against the book's top at 166+13 and 335. OpenLeaf has the same rule at 12px. |
| B4 | Phone error spans one column | **Better, not finished (N2).** The seal row now has explicit columns (`264px 60px` at 390), and the error spans the full 324px. But "Try again" still drops to its own line. The error is 89px tall and the bar 173px, the same height as round 4. |
| B5 | Phone title outranks the question | **Fixed down to 338px wide (N4).** The phone title is 21px (`writer.css:461`). The question is larger at 390, 375 and 360 for every bank question. Below about 338px a mid question drops under 21px: 19.7px at 320. |
| B6 | Split lines frozen at the load width | **Fixed.** I loaded step 2 at 390 and stepped the arrival. The h1 went back to plain markup (`Kept in <span class="nw">…`, no `.line` divs). Widened to 1366, it set in one line at 56px. Narrowed to 390, it was back to two lines at 36px. No overflow (`scrollWidth` = viewport). The split is created inside the matchMedia context, so an unmount mid-arrival still reverts it. |
| B7 | OpenLeaf's arrow drawn, blanked, redrawn | **Fixed (code).** `start: "top bottom"` (`OpenLeaf.tsx:62`). The paused tween and its trigger are in the matchMedia context, which `mm.revert()` cleans up. |

## Gaps

### N1. POLISH: at 1366×700, Bond's ears are only 5–6px under the foil frame
**Skill:** impeccable craft floor ("tight groups, generous separation"); taste-skill critique pass 13 (collisions).

**Where:** `writer.css:163`, `.sheet-page .page.w-desk:has(.w-grid.spread) { padding-top: 64px; }` in `@media (max-height: 740px)`.

**Measured:** the frame line is at y 90. The sleeping dog's top is at 96 and the awake dog's at 95.3. At 768 the gap is 13–15px, so the short window reads cramped next to it.

**Change:** use 72px. Injected at 1366×700:
- The dog's top moves to 104, 14px clear, which matches 768.
- The keep bar's bottom moves from 634 to 641, still inside 700.

### N2. POLISH (B4 residual): on the phone, "Try again" still takes a line of its own
**Skill:** hallmark 8 states (error) and responsive; impeccable craft floor ("run the real copy at every breakpoint").

**Where:** `writer.css:239`. `.w-keep-error` is `display: flex; flex-wrap: wrap`. The message `<span>` is a flex item as wide as the text, so the button always wraps under it, even when the message's last line is short.

**Measured at 390:**
- The message sets in 2 lines (1091–1132).
- "Try again" sits on a third line (1136–1180).
- The bar is 173px tall.

**Change:** inside the 760px block, let the button run on after the text:
```css
.w-keep-seal .w-keep-error { display: block; }
.w-keep-seal .w-keep-error .w-retry { margin: -15px 0 -15px 10px; padding: 15px 2px; min-height: 0; vertical-align: baseline; }
```
I injected the same idea (with 12px padding) at 390. The error became 41px tall, with "Try again" at the end of line 2, and the bar went from 173 to 125px. With 15px padding the target is 44px tall.

### N3. POLISH: the keep error says "try again" twice
**Skill:** humanizer (redundant phrasing); impeccable craft floor ("errors name the problem and the recovery", once); BAOS rule 19 ("Don't repeat the same promise or action twice").

**Where:** `Write.tsx:850`. The message `` `${plainCause(err)} Your words are still here; try again.` `` is followed by the "Try again" button (`:1062–1065`). On screen it reads "…Your words are still here; try again. Try again".

**Change:** drop "; try again" from the message when there are words, so it reads "There's no connection just now. Your words are still here." The button is the recovery. The step-2 copy ("It isn't kept yet.") already does this.

### N4. POLISH (B5 residual): below about 338px, the title line still outranks a mid question
**Skill:** taste-skill type ("one size dominant"); DESIGN.md (the question is the display).

**Where:** `writer.css:461` sets `.wtitle` to 21px. `:447` sets mid questions to `clamp(19px, (100vw − 44px) / 14, 25px)`, which is 21px at 338px.

**Measured at 320:** the bank question is 26px (fine), and mid questions are 19.7px under a 21px title placeholder.

I counted the bank: 547 questions, 203 short and 344 mid, none over 65 characters. Round 4 said the 320 rule could go, and that was wrong for this case.

**Change:** add `@media (max-width: 340px) { .w-book .leaf-one .wtitle { font-size: 19px; } }`.

### N5. POLISH: on a tablet, one way-to-begin pill sits alone on the second row
**Skill:** BAOS rule 10 (no orphans); taste-skill critique pass 5 (holes); hallmark responsive (768).

**Where:**
- `writer.css:158` shows two pills on the spread.
- `:467` shows two pills on the phone.
- `:487` shows one pill under 380px.
- Nothing covers the single page from 761 to 1279px, so all four pills show.

**Measured at 768:** the row is 523px wide. "It was the year…", "We were living in…" and "I remember the smell of…" fill line 1. "The first thing I'd tell you is…" sits alone on line 2. At 1024 the row is about 580px (the grid stops at 760), so it is still three plus one.

**Change:** `.w-grid.single .w-begin-inpage button:nth-child(n + 4) { display: none; }`. Three pills take 489 of the 523px.

### N6. POLISH: on a tablet, Bond's head is 8px under the subtitle
**Skill:** impeccable craft floor (spacing) and layout (grouping); taste-skill critique pass 13.

**Where:** `writer.css:77`, `.w-grid.single .w-qhead { margin: 0 0 100px }`, with the 128px dog (`:100`). He is 105px tall and set 13px into the board, so he stands 92px above it, and the gap is 100 − 92 = 8px at every single-page width from 761 to 1279.

**Measured at 768:**
- The subtitle ends at y 256, and its line runs to x 637.
- The dog's top is at 264, across x 544–672.

So his ears sit right under "…on the radio." On the phone the gap is 11px or more (86px margin, 104px dog).

**Change:** `.w-grid.single .w-qhead { margin-bottom: 112px }`. The phone rule at `:445` still wins below 761. That gives a 20px gap (computed, not injected). Alternatively, make the tablet dog 112px.

### N7. POLISH: OpenLeaf isn't mounted anywhere, and its code and CSS are left behind
**Skill:** impeccable polish ("remove dead code, obsolete styles"); GSAP performance (no stray triggers). It is harmless at runtime, but the round-4 fixes in it can't be seen.

**Where:**
- No file under `src/` imports `components/delight/OpenLeaf`. Home renders `home-mem` and `fromthebook`, but no `.open-leaf`.
- Its comment (`OpenLeaf.tsx:2`) and `writer.css:501` still say "Home and the Archive".
- About 46 `.open-leaf`/`.ol-*` rules remain in `astory.css`, plus `writer.css:501–506`.
- `Home.tsx` and `Archive.tsx` changed during this review (00:05:58), so this may be a removal still in progress.

**Change:** if the removal is intended, delete `OpenLeaf.tsx`, the `.open-leaf`/`.ol-*` rules in `astory.css`, and `writer.css:501–506`. If it isn't, mount it again at the foot of Home and the Archive.

## Before and after (emil's review format)

| Before | After | Why |
| --- | --- | --- |
| `padding-top: 64px` on the short spread | `72px` | Bond's ears clear the foil frame by 14px, as at 768; the seal still ends at 641 of 700 |
| `.w-keep-error { display: flex; flex-wrap: wrap }` on the phone | `display: block`, retry inline, 15px padding | The error is 2 lines instead of 3; the bar is 125px instead of 173px |
| "Your words are still here; try again." + **Try again** | "Your words are still here." + **Try again** | One recovery, stated once |
| Phone title 21px at every width | 19px at 340px and below | The mid question stays the largest line at 320 |
| Four pills on the single page (761–1279) | Three pills | No pill alone on a row |
| `.w-grid.single .w-qhead { margin-bottom: 100px }` | `112px` | 20px between the subtitle and Bond's ears instead of 8px |
| OpenLeaf and `.ol-*` CSS with no page using them | Deleted, or mounted again | No dead code; the dog-on-the-leaf fixes either ship or go |

## Skill by skill

- **taste-skill:**
  - Gaps: N4 (one dominant size), N5 (orphan), N1 and N6 (collision and spacing).
  - Passes:
    - Two-line headlines at 320 for every bank length.
    - The step-2 hero now rewraps at every width (B6).
    - Imagery at one scale and one treatment (B2 and B3).
    - One live thing: Bond covers his eyes when the words start.
    - No horizontal scroll at any width measured.
- **hallmark:**
  - Gap: N2 (the error state on the phone).
  - Passes:
    - Gate 10: no `transition: all`.
    - Gate 27: every transform transition has a reduced-motion override (`writer.css:489–492`; `astory.css:3518–3519` for the open leaf).
    - Gate 49: no two-line buttons.
    - Gate 50: `minmax(0, 1fr)` on the grids.
    - Focus-visible, active and disabled on every control; 44px targets.
    - Tokens: the writer's raw rgba values live in its `.w-desk` token block.
- **emil-design-eng:**
  - No gaps.
  - Passes:
    - Press at 0.97 in 120ms.
    - The seal settles in 280ms on `OUT`.
    - The poses change without a double exposure on waking: sleep goes in 120ms, then cover comes in over 200ms from 0.96 with a 60ms delay. These are material, not UI (DESIGN.md rule 1).
    - Hovers are gated.
    - No ease-in.
    - No animation on W, Esc or Ctrl+Enter.
  - One note, not a gap: on the way back to sleep there is no delay, so the two poses overlap for about 120ms. It's rare (the page has to be emptied) and hardly visible.
- **impeccable:**
  - Gaps: N1 and N6 (spacing), N2 (real copy at a breakpoint), N7 (dead code).
  - Passes:
    - Image sizes match the files.
    - Caret, selection and focus are themed.
    - No console errors.
- **GSAP (react, timeline, performance, scrolltrigger):**
  - No gaps.
  - Passes:
    - SplitText is reverted on completion, inside the matchMedia context (B6).
    - The writer's book timeline uses `fromTo` and `clearProps`, and is reverted on unmount.
    - The press tween is in a reverted context.
    - The OpenLeaf trigger is fixed (B7), with `st.kill()` and `mm.revert()`.
- **humanizer:** N3. The rest reads plainly: "Something went wrong on our side." and "It isn't kept yet."
