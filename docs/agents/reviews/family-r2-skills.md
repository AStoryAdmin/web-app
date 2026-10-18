# Skills Steward: Family and Person, round 2

**Verdict: GAPS (0 blocker, 7 ugly, 8 polish).** Nothing breaks the page, and the motion, focus and token work is mostly right. What is left is the type scale leaking past its tokens, three-line tier headings, holes in the wide person layout, and states that show a failure as if the list were empty.

**Scope:** `pages/Family.tsx`, `pages/Person.tsx`, `components/family/tree/{FamilyTree,plateModel,treeMotion}.ts(x)`, `components/family/{Storyteller,Ornaments,Keepers}.tsx`, `components/person/{MemoryRail,Kin,personRail,railMotion}.ts(x)`, `styles/pages/family-people.css`, and how they use `lib/arrive.ts`, `lib/ease.ts` and astory.css.

**Skills loaded:** taste-skill (SKILL, layout, type, critique), hallmark (disciplines, anti-patterns, slop test, interaction-and-states, responsive), emil-design-eng, impeccable (craft-floor, polish, layout, critique), gsap-react, gsap-timeline, gsap-performance and gsap-scrolltrigger. I also read BAOS-STANDARD.md and DESIGN.md. No other installed skill applies (humanizer and find-skills don't).

**How it was checked:**
- I read all 13 changed files and the astory.css rules they inherit.
- I rendered the pages in my own tab, now closed with its viewport reset, and measured with JS after reloads:
  - `/family` (the founder's real family of 5) at 1920×1000, 1366×768, 390×844 and 2560×1300.
  - `/family?preview=tree` (the 4-generation sample) at 1920.
  - `/family/:id` for Bao Vo (the storyteller) and Ty Ngo (not on A Story, no memories) at 1920.
  - `/family/sample-rose?preview=tree` (both rail groups) at 1920 and 390.
- I ran `plateModel.test.ts` and `personRail.test.ts`: 18 of 18 pass.
- I ran taste-skill `lint.mjs` on the changed files. Its only FAILs are shadow, hairline and gradient. All three are the brand's sanctioned exceptions: the portrait rings are spread "box-shadows" that draw a paper ring, the hairlines are the book's rules (DESIGN.md says the brand wins), and the gradients are the gilt glint's mask. There are no stock phrases, no monospace and no eyebrows.

**Not verified:**
- The "Say who they are" menu, Keepers and MyCodes in a live state. The real family has nobody unplaced, and in preview these are switched off. I reviewed them from code.
- Hover lighting on a real pointer.
- 3840 wide and a zoomed-out window.

Size measurements taken after an emulated resize *without* a reload were unreliable: `lib/zoom` and the size class went stale in the pane. I discarded them and used only post-reload numbers.

## Round-1 gaps, re-checked

`docs/agents/reviews/family-r1-skills.md` **does not exist on disk.** The folder holds only `signed-out-r1-*` and `writer-r2-*`, and no file anywhere in the project mentions "family-r1". Either it was never saved or OneDrive has not synced it. I could not check round-1 gaps one by one, so the fresh pass below is the whole review. If the builder has the round-1 list, put it beside this one. Any item not named below either passed or I did not see it.

## Gaps

### G1. UGLY: the type scale leaks past its tokens (9 sizes on the page, against a ceiling of 5)
**Skill:** taste-skill type ("Five sizes on a page is the ceiling… If two sizes look almost the same, make them the same"); DESIGN.md (the same rule); impeccable craft floor (obvious scale steps).

**Where:**
- `family-people.css:69` (`.sheet-page .fp .st-name`) and `:270` (`.sheet-page .wn-h`). Both are specificity (0,3,0).
- They lose to astory.css `.sheet-page .page h2:not(.bk-reader *, …)`. A `:not()` takes its most specific argument, which makes that rule (0,3,1), and it sets 34px.

**Measured at 1920:**
- "Rose Hartley" / "Bao Vo" in the storyteller plate and "Where to next." both render at **34px**, not `--fz-section` (28px). The same leak happens on the person page.
- Text sizes on the Family page: 12, 13, 15, 17, 19, 20, 28, 34 and 58.
- `--fz-words` (19) and `--fz-words-s` (17) are a near-pair. The file header claims "Five type sizes" but defines six tokens.

**Change:**
1. Raise both selectors above (0,3,1). For example `.sheet-page .page .st .st-name` and `.sheet-page .page .wn .wn-h`, or wrap them in `:is(.fp, .pp2)`.
2. Fold `--fz-words-s` into `--fz-words`, or into `--fz-name`.
3. Re-measure. The page should show display 58, section 28, name 20, words 19 and small 13, plus the shell's 12 and the shared button's 15.

### G2. UGLY: tier headings run to three lines
**Skill:** taste-skill house rule ("Headlines: two lines or fewer, at every width. Every h1–h6"); impeccable ("Run the real copy at every breakpoint").

**Where:** `family-people.css:140` (the label column is fixed at `148px`) and `:151` (`.tp-label h3` at 20px). The titles come from `plateModel.ts:201–203`.

**Measured at 1920 (sample):** "Rose's children, and Margaret's" sets in **3 lines** (69px). "Rose's grandparents", "Rose's generation" and "Rose's grandchildren" each take 2. In the real family, "Your parents, and Nhi Tran's" takes 2. Any "X's children, and Y's and Z's" will take 3 or more.

**Change:**
1. Widen the label column to about `minmax(148px, 184px)` above 1100px. Then let the title break at the comma instead of mid-phrase: render "and Margaret's" as its own `<span class="tp-and">` on a second line, in the 13px small size, under the 20px title. That gives one title line and one small line.
2. Or move the "and …'s" part out of the `<h3>` into the `.tp-dec` line.

### G3. UGLY: at 1366×768 a family of five takes more than a screen
**Skill:** impeccable layout ("Density matches use frequency…"); taste-skill critique pass 11 (fullness) and pass 12 (substance, "the visitor leaves knowing"); BAOS 9 ("main content reachable without long scrolling").

**Where:** `FamilyTree.tsx:283` (`start = drawn <= 6 ? 0 …` picks size `l` from the head count alone) and `:298–312`. `draw()` steps down only when a tier wraps, never for height.

**Measured at 1366×768, real family:**
- Size `l`: 156px seals, and the storyteller's 196px.
- The plate is **996px tall**. The storyteller's own tier is cut at the fold (their name sits at about y 780).
- The storyteller's words start at **y 1362**, and the page is 2459px tall for five people.
- At 1920×1000 the same family fits (plate 744px).

**Change:** in `draw()`, after the wrap loop, keep stepping down while the plate is taller than the room under the head. For example `el.offsetHeight > (innerHeight / zoom) - el.getBoundingClientRect().top / zoom - 40`, stopping at `m` for a family of six or fewer. At 1366×768 that gives `m` (120px), which puts the storyteller's tier and their name in the first screen.

### G4. UGLY: holes in the person page's wide layout
**Skill:** taste-skill (§6 Fullness: "A screen that is mostly empty ground is an underbuilt section"; layout §4, "a hole usually sits beside a short column"); BAOS 10 (no orphans).

**Where:** `family-people.css:361–367` (three columns at ≥1600px, with `.pp-extras` sticky in a 300–380px column) and `Person.tsx:411–415`.

**Measured at 1920:**
- **Bao Vo (storyteller):** the third column holds only "Bao's family / Nobody is placed beside Bao yet." It is **62px tall** beside an 823px rail, so a 380×760 hole sits at the top right of the first screen.
- **Ty Ngo (no memories):** side 611px, story 176px, extras 113px. Below y≈500 the first screen is mostly empty ground until "Where to next".

**Change:**
1. Use the third column only when it carries enough. For example, add `pp-main` class `three` only when `related.length + notes + kin.length >= 3`. Otherwise keep `.pp-extras` under the rail at full width, with `.pk-list` in its auto-fill grid.
2. When the rail is empty, put Kin and Related beside the empty state, not in a third column.
3. Hide `Kin` entirely when `kin.length === 0` (the component's own doc says "Nothing when the person stands alone"). The line "Nobody is placed beside Bao yet" is the orphan.

### G5. UGLY: a failure reads as an empty list
**Skill:** hallmark 8 states (error, loading); impeccable polish triage #1 ("misleading state") and craft floor ("errors name the problem and the recovery"); BAOS 42.

**Where:**
- `Family.tsx:58`: `.catch(() => live && setCodes([]))`. A failed fetch shows "No codes out at the moment."
- `Storyteller.tsx:43–45`: `.catch(() => {})`. A failed fetch shows "Nobody has added their side yet."
- `Keepers.tsx:30`: `listManagers(...).then(...)` has no catch. `listManagers` turns a server error into `[]` (`familyWrites.ts:263–266`), which shows "Only you, so far." A network rejection is unhandled and leaves `list === null`. That renders an empty `<ul>` with no loading line (MyCodes has "Looking for…", Keepers has nothing).

**Change:**
- Keep `error` state in each. On failure render the house `Problem` (or one quiet line, "Couldn't reach the codes just now." with a Try again link) instead of the empty sentence.
- In Keepers: render `<li class="meta" aria-busy="true">Looking for keepers…</li>` while `list === null`, `.catch` the promise, and have `listManagers` throw or return `{error}` rather than `[]`.

### G6. UGLY: Keepers' remove uses a browser confirm and has no pressed state
**Skill:** hallmark interaction ("Undo over confirm… for reversible actions, skip the confirm dialog"; loading state on every control); emil (state indication); BAOS 42 ("Failure wears the house style").

**Where:** `Keepers.tsx:46` (`window.confirm`) and `Keepers.tsx:72–74` (Remove has no `loading`). The note at `Keepers.tsx:94` uses an inline `style={{ color: "var(--danger)" }}`.

**Change:**
1. Do what Person.tsx already does for "Remove from the tree": an inline two-button confirm ("Stop Nhi editing? · Stop · Keep"), or remove at once with a 6-second "Undo" line.
2. Give Remove `loading={busy === m.id}`.
3. Move the danger colour into a class (`.keepers .meta.bad`).

### G7. UGLY: the shelf menu's keyboard focus is nearly invisible
**Skill:** hallmark focus rings ("2–3px, ≥ 3:1… never `outline: none` without a replacement"); impeccable craft floor (focus rings are a browser surface).

**Where:** `family-people.css:221` (`.tp-menu.ft-menu button:focus-visible { background: var(--paper-tone) }`) on top of astory.css:2161 (`outline: none`).

**What goes wrong:** the only signal on the arrow-key menu is #EDE3D2 on #FFFDF8, about 1.2:1.

**Change:** add `.tp-menu.ft-menu button:focus-visible { outline: 2px solid var(--kicker-terracotta); outline-offset: -2px; }` and keep the tone fill for hover only.

### G8. POLISH: "No date yet" on card after card
**Skill:** impeccable craft floor (copy: product language, no repeated noise); BAOS 34 ("Never print 'No date yet'… on card after card").

**Where:** `MemoryRail.tsx:36` and `:53`. For the storyteller's own cards the string comes from `dateLine`.

**Measured:** Bao Vo's rail prints "No date yet" on **all 4** cards.

**Change:** when there is no date, print only the chapter. Add one row under the rail, "Give 4 memories a year · about a minute", linking to the archive's dating flow.

### G9. POLISH: the rail's photographs "develop" in a filter keyframe
**Skill:** emil and GSAP performance ("Only animate transform and opacity"); DESIGN.md (transform and opacity only, arrival under 1.2s); BAOS 25 (never depend on the frame clock).

**Where:**
- `MemoryRail.tsx:44` adds `data-develop`, which opts the prints into `lib/arrive.ts:94–129` and astory.css:2424 (`develop 1.6s`, from `brightness(1.9) contrast(.4) saturate(.2); opacity: .6`).
- archive-reading.css:59 already ruled "fades in once loaded, no grey developing" for the memory page's plate.

**Measured:** in the pane, both rail prints sat at `opacity: 0.6`, washed out, while the frame clock was idle.

**Change:** drop `data-develop` here and let the card's `riseIn` carry the print, or give the rail its own 400ms opacity-only fade on `load`.

### G10. POLISH: the person page's relation disagrees with the tree
**Skill:** impeccable polish ("Keep terminology… consistent"; "Match neighboring mental models").

**Where:** `Person.tsx:125` and `:146` use `relationTo(index, person, teller)`, which returns "" for somebody related only through a friend. The tree uses `plateModel`'s `rel` (`plateModel.ts:115–121`).

**Measured:** Ty Ngo is "Nhi Tran's parent" under his face in the tree, and "In the family" on his own page.

**Change:** export a `relationOnPlate(person, plate)` helper, or compute `buildPlate(...).tiers…rel` for this person, and use it for the subline before falling back to "In the family".

### G11. POLISH: the tree's caption tooltip has no hover delay, and a face carries four hover effects
**Skill:** emil ("Tooltips should delay before appearing… skip delay on subsequent hovers"); hallmark gate 17 (hover delay ≠ focus delay) and gate 13 (more than one hover effect at once).

**Where:** `family-people.css:186–194`. On hover a face lifts 3px, gains a float shadow, shows `.tp-cap` at once, and lights or dims the whole plate.

**Change:**
1. Give `.tp-cap` a hover delay: `transition-delay: 450ms` on `.tp-node:hover .tp-cap` only, 0ms on `:focus-visible`, and `.tp[data-hot] .tp-node:hover .tp-cap { transition-delay: 0ms }` for neighbours.
2. Drop the `translateY(-3px)` lift. The lit threads and the dimming are the feedback, and two signals are enough.

### G12. POLISH: GSAP tweens opacity on elements that also carry a CSS opacity transition
**Skill:** gsap-performance (avoid fighting the tween; the GSAP docs say never put a CSS transition on a property GSAP animates); emil ("transition only what changes").

**Where:** `family-people.css:171` (`.tp-node { transition: opacity 220ms }`) and `:200` (`.tp-ghost`). Both are `[data-tp-rise]` and are tweened `opacity 0→1` in `treeMotion.ts:449`. Each GSAP frame restarts a 220ms CSS transition, so the faces lag and soften the stagger.

**Change:** move the dim transition onto a class that only exists while something is hot, for example `.tp[data-hot] :is(.tp-node, .tp-ghost) { transition: opacity 220ms var(--ease-out) }`. Also drop `stroke-width` from `.tp-threads path`'s transition (line 134); `stroke` and `opacity` are enough.

### G13. POLISH: the gilt glint sweeps back on mouse-out
**Skill:** emil (asymmetric enter/exit: "release should always be snappy"); DESIGN.md D2a ("light catches the gold **once**").

**Where:** `family-people.css:113–116`. The 900ms transition sits on the resting `::before`, so leaving the plate plays the sweep in reverse across the visible edge.

**Change:** put the transition on `.st.gilt:hover > .glint::before` only. Resting then has no transition, the glint snaps back unseen, and the sweep plays once per entry.

### G14. POLISH: presses and hovers on rail cards
**Skill:** emil ("Buttons must feel responsive… scale(0.97)", hover gated by `(hover: hover) and (pointer: fine)`); DESIGN.md ("Pressed: scale 0.97 in 120 ms").

**Where:**
- `family-people.css:391` replaces astory's transition with `background, border-color`, so `.pp-card:active { scale(0.99) }` (`:393`) snaps with no easing.
- astory.css:2734 `.pp-card:hover { translateY(-2px) }` is ungated. The override at `:392` is only inside the hover query, so a tap on a phone leaves a stuck 2px lift.

**Change:**
1. Add `transform 120ms var(--ease-out)` to `:391` and use `scale(0.98)`.
2. Add `.pp2 .pp-card:hover { transform: none }` outside the media query (or gate astory's rule).

### G15. POLISH: small copy and markup slips
**Skill:** taste-skill type §8 (no orphans, author the break); impeccable (content edge cases).

**Where and change:**
- `Family.tsx:191`: at 390 the sub-line breaks "5 / people". Wrap each part in `.nw`, as `MyCodes` does.
- `Kin.tsx:39`: with no given name the heading reads "Their's family". Use `person.givenName ? \`${first}'s family\` : "Their family"`.
- `family-people.css:405–408`: the D10 ribbon is keyed on `.pp-group:first-of-type`. When a person has told nothing, it marks the latest memory *somebody else* told as "the latest of what they told". Key it on a `pp-group.theirs` class instead.

## Emil's review table

| Before | After | Why |
| --- | --- | --- |
| `.tp-node { transition: opacity 220ms }` while GSAP tweens its opacity | the transition only under `.tp[data-hot]` | A CSS transition fights every GSAP frame |
| `.tp-cap` shows at 0ms on hover | 450ms on hover, 0ms on focus, 0ms for the next face | Tooltips delay once, then go instant |
| hover = lift + shadow + caption + lit threads | lit threads + caption | One idea per moment |
| glint `transition: 900ms` at rest | transition on `:hover` only | The light catches the gold once and doesn't sweep back |
| `.pp-card:active scale(.99)`, no transform transition | `scale(.98)` with `transform 120ms ease-out` | A press should feel heard |
| `img[data-develop]` 1.6s filter keyframe | 400ms opacity on load | Transform and opacity only, under 1.2s, no washed print on a stalled clock |
| `stroke-width` in the thread transition | `stroke, opacity` | Transition only what reads |

## Skill by skill

- **taste-skill:**
  - Gaps: G1 (sizes), G2 (three-line h3), G3 and G4 (fullness), G15.
  - Passes:
    - One live thing: pointing at a face lights its line through the family.
    - The idea is carried through: the engraved plate, the cartouche, the postmark, the arch portrait and the leaf.
    - The h1 is 1 line at all four sizes.
    - No horizontal scroll at 390, 1366, 1920 or 2560 (`scrollWidth` 390 at 390).
    - No eyebrows, no monospace, no index numbers.
    - Running text is in full ink.
- **hallmark:**
  - Gaps: G5 and G6 (states), G7 (focus), G11 (gates 13 and 17).
  - Passes:
    - No `transition: all`.
    - Every link and button measured is at least 44px (the one under 44 was the 41px storyteller name link inside an h2).
    - No two-line buttons at 390 or 1366.
    - Image-bearing tracks are `minmax(0, 1fr)`.
    - Tokens only, with no raw hex in family-people.css.
    - Every `vw` and `vh` is divided by `--zoom`.
    - `aria-hidden` on all ornaments and portraits.
    - The ring buttons and faces are labelled.
    - Every hover is gated.
- **emil-design-eng:**
  - Gaps: G11, G12, G13, G14 (see the table).
  - Passes:
    - House curves only (`lib/ease`), no ease-in.
    - Faces rise from 0.95, never 0.
    - The arrival lands by about 1.15s.
    - The menu opens without animation (fine for a keyboard-driven control).
    - The reduced-motion list covers every transition in the file.
- **impeccable:**
  - Gaps: G5 (misleading empty), G7, G8, G10, G3 and G4 (density).
  - Passes:
    - Themed focus rings on faces, rings, rows and kin.
    - The empty person has a pose, a sentence, the time it takes and one action.
    - The not-found person has the dog and one way back.
    - The hairline loading sketches are present.
- **GSAP (react, timeline, performance, scrolltrigger):**
  - Gaps: G12, and G9 (a filter animation from the shared develop path).
  - Passes:
    - `treeMotion` and `railMotion` run inside `gsap.matchMedia()` with `mm.revert()` on unmount, and are scoped to their root.
    - Every tween is `fromTo` with `clearProps`.
    - Nothing is hidden ahead of time: faces and cards only move inside a running tween, and `onEnter` has its scroll, resize and 700ms fallbacks.
    - Only transform and opacity are tweened.
    - No ScrollTrigger is used, so there is nothing to refresh.
    - `useEffect` with `matchMedia` and revert is an accepted alternative to `useGSAP`.
