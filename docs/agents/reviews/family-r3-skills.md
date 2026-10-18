# Skills Steward: Family and Person, round 3

**Verdict: GAPS (0 blocker, 4 ugly, 6 polish).** Eleven of the fifteen round-2 gaps are fixed and measure fixed. G1, G4, G5 and G6 are only partly fixed. The worst one left is G5: the new "couldn't be reached" branches are dead code, because the data layer still turns every server or network failure into an empty list. A failure still reads as "nothing here".

**Scope:** `pages/Family.tsx`, `pages/Person.tsx`, `components/family/*` (with `useMyCodes.ts`, `familyView.ts`, `ReviewQueue.tsx`, `Keepers.tsx`, `Waiting.tsx`, `Duplicates.tsx`, `InviteSheet.tsx`, `Storyteller.tsx`, `tree/*`), `components/person/*` and `styles/pages/family-people.css`. I also read the shared rules they inherit: astory.css §22 and the `:where()` heading rules at 2873–2874, `WhereNext` and its CSS in book-account.css:52–68, `lib/arrive.ts` and `lib/ease.ts`, and the list functions in `data/familyWrites.ts`, `data/family.ts` and `data/contributions.ts`.

**Skills loaded:**
- taste-skill: SKILL, type, layout, critique.
- hallmark: SKILL disciplines, slop-test gates, interaction-and-states, responsive, the anti-patterns index.
- emil-design-eng (whole).
- impeccable: craft-floor, polish, layout, critique.
- gsap-react, gsap-timeline, gsap-performance, gsap-scrolltrigger.

I also read BAOS-STANDARD.md and DESIGN.md. No other installed skill applies.

**How it was checked:**
- I read every file in scope.
- I rendered the pages in my own tab, force-reloaded at each size, and measured with JS after stepping `__gsap.ticker`:
  - `/family`, the real family of five, at 1920×1000, 1366×768, 1024×768, 390×844 and 2560×1300 (html zoom 1.3).
  - `/family?preview=tree` at 2560.
  - `/family/:id` for Bao Vo (the storyteller) and Ty Ngo (no memories) at 1920.
  - Bao Vo at 390.
  - `/family/sample-rose?preview=tree` at 1920.
- Tests: the vitest suites under `components/family` and `components/person` pass, 4 files and 41 of 41 tests.
- taste-skill `lint.mjs`: its only FAILs are shadow, hairline and gradient. These are the same sanctioned brand exceptions as in round 2: the portrait rings, the floating caption and menu, the book's rules, and the gilt glint's mask. Its WARNs are outlined boxes (the plates' keylines) and one `padStart` in a sample date. There are no stock phrases, no monospace and no eyebrows.
- My tab is closed and its viewport is reset. Nothing was written, and I didn't touch auth.

**Not verified:**
- The review queue, join requests, suggestions, duplicates and the "Say who they are" menu in a live state. The founder's family has none of them pending, so I reviewed them from code.
- Hover on a real pointer.
- 3840 wide.
- Screenshots after the first person page. The pane was hidden partway through, so everything after that is JS measurement only.

## Round-2 gaps, re-checked

| # | Status | Evidence |
| --- | --- | --- |
| G1 type scale | **Partly** | The page's own scale holds: the storyteller's name and every h2 measure 28, and the tokens are 58 / 28 / 20 / 18 / 13 (`--fz-words-s` is folded in). Shared components still bring 12, 13.5, 14, 15 and 21. See R3-5. |
| G2 three-line tier titles | Fixed | The column is 184px, and "and Margaret's" sits on its own 13px line (`.tp-also`). At 2560: "Rose's children / and Margaret's" is one title line plus the small line. "Rose's grandchildren" takes 2 lines, which is within the rule. |
| G3 1366×768 too tall | Fixed | Size `n`. The plate is 422px tall and ends at y 714. The storyteller's name sits at y 673, above the fold. The page is 1814px tall (it was 2459). |
| G4 holes in the wide person layout | **Partly** | Bao: the third column is now 253px (three kin), sticky beside an 820px rail, which is fine. Ty Ngo: still thin. See R3-2. |
| G5 failure reads as empty | **Open** | The UI branches exist, but they can't fire. See R3-1. |
| G6 Keepers confirm | Fixed in Keepers | Inline "Stop Nhi editing? · Stop · Keep", `loading` on Stop, and the colour is in `.meta.bad`. The same inline danger style is still in four other files (R3-8). |
| G7 menu focus | Fixed | `family-people.css:237` has a 2px terracotta outline at -2px. |
| G8 "No date yet" | Fixed | Undated cards print only the chapter, and one row reads "Give 4 memories a year · about 2 minutes →". It links to `/archive`, not to the undated ones; that's a small note, not a gap. |
| G9 develop filter | Fixed | The shared develop is now a GSAP opacity fade, 0.35 → 1 in 0.6s (`arrive.ts:95–131`), and the CSS keyframe is gone. |
| G10 relation mismatch | Fixed | Ty Ngo is "Nhi Tran's parent" on the cloth and in the tree. |
| G11 tooltip delay, four hover effects | Fixed | The caption shows after 450ms on hover, 0ms on focus and 120ms on the next face. The lift is gone. |
| G12 CSS transition fighting GSAP | Fixed | The opacity transition applies only under `.tp[data-hot]`, and the threads transition only `stroke` and `opacity`. |
| G13 glint sweeps back | Fixed | The transition is only on `:hover`. |
| G14 card press and hover | Fixed | `transform 120ms`, `scale(0.98)`, and `:hover { transform: none }` outside the media query. `family-people.css:403`'s transition is now dead (R3-10). |
| G15 copy slips | Fixed | `.nw` on the sub-line ("5 people" moves to line 2 whole at 390), "Their family", and the ribbon is keyed on `.pp-group.theirs`. |

## The lead's question: the `:where()` change and WhereNext's sizes

**The astory rule is lighter, but it does not have zero weight.**
- `:where(.sheet-page .page) h2:not(.bk-reader *, …)` is still (0,1,1). `:where()` drops `.sheet-page .page`, but `:not()` keeps the weight of its heaviest argument (`.bk-reader *` = 0,1,0), plus the `h2`.
- It still beats a lone class on an h2.
- On these two pages every h2 is covered by family-people.css at (0,3,1) or more, and every one measured 28px. So it does no harm here.
- To make it truly weightless, put the `:not()` inside: `:where(.sheet-page .page h2:not(.bk-reader *, .leaf-one *, .mem *, .print-card *))`. Do the same for the h1 rule and the 760px copies (astory.css 2873–2874 and 3016–3018).

**WhereNext's sizes count against the ceiling.** The ceiling is about what a reader sees on the page (taste-skill type §2: "If two sizes look almost the same, make them the same"). Its 21px title beside the page's 20px names, and its 14px line beside the page's 13px small print, are exactly the near-pairs that rule targets.

Measured text sizes on the Family sheet at 1920:
- The page's own: 13, 18, 20, 28 and 58.
- From shared components: 12, 13.5, 14, 15 and 21.
- That is ten sizes. The person page shows the same pattern.

**What to do:**
1. **WhereNext:** read the page's scale, with today's values as fallbacks, in book-account.css:58–59: `.wn-words b { font-size: var(--fz-name, 21px) }` and `.wn-words span { font-size: var(--fz-small, 14px) }`. Pages without a scale don't change. On these pages it folds to 20 and 13. Apply it site-wide (BAOS 1).
2. **The 16px arrow:** it's a glyph in a 40px round button. Count it as an icon, not a type size.
3. **The shared Button:** let the small button take `--fz-small` where a page defines one (13.5 → 13; nobody can see the difference). Keep the primary button's 15px as the page's single control size.
4. **The book's furniture:** the 12px running head, folio and "Press ? for shortcuts" are the same on every page and sanctioned by DESIGN.md. Exempt them, like the bar.

Result: five content sizes (58 / 28 / 20 / 18 / 13), one control size (15), and the furniture.

## Gaps

### R3-1. UGLY: a failure still reads as an empty list (G5, still open)
**Skill:** hallmark 8 states (error); impeccable polish triage #1 ("misleading state") and craft floor ("errors name the problem and the recovery"); BAOS 42.

**Where:** every list the UI guards turns `{ error }` into `[]`:
- `data/familyWrites.ts:257–266` (`listManagers`) and `:143–152` (`listMyCodes`).
- `data/contributions.ts:62–72` (`listContributions`).
- `data/family.ts:197–203`, `:207–213` and `:285–291` (join requests and suggestions).

supabase-js returns network and server failures as `{ error }`; it doesn't reject. So these can never run:
- `.catch` in `useMyCodes.ts:26`, `Keepers.tsx:34` and `Storyteller.tsx:52`.

A dropped connection still shows:
- "No codes out at the moment."
- "Only you, so far."
- "Nobody has added their side yet."
- "Nothing waiting for your review."

`Waiting.tsx` (`Asked`, line 55; `WaitingOnOthers`, lines 172–185) has no catch at all. In `ReviewQueue.tsx:91–95`, a failure sets `items=[]`, so the subline at `:136–144` reads "Nothing waiting…" right above the red alert. It also says "Reload the page" instead of offering Try again.

**Change:**
1. Have these list functions throw, or return `{ rows, error }`. The cheapest version is `if (error) throw error;`, with the console warning kept.
2. In `ReviewQueue`, keep `items` `null` on failure, and render one line with a Try again button.
3. Add a `.catch` to both `Waiting` loaders that sets an error line.

### R3-2. UGLY: a person with no memories still sits in a thin, mostly blank column (G4 residual)
**Skill:** taste-skill §6 Fullness and layout §4 ("a hole usually sits beside a short column"); BAOS 9 and 10 (no single card alone in a row).

**Where:** `Person.tsx:172` (the `three` rule), `:459–475`, and `family-people.css:424–432`.

**Measured, Ty Ngo at 1920:**
- The main column is 1363px wide.
- The empty state uses about 530px of it (the dog, plus a 397px paragraph).
- "Ty's family" is one 211px kin card alone in an auto-fill row.
- The column ends at y 668. Right of the side plate, from y 668 to the fold at 1000, is blank ground about 1363 wide, and there is about 830px of blank beside the empty state itself.

**Change:** round 2's second step was not done. With `rail.length === 0` on a wide window, lay `.pp-story` and `.pp-extras` side by side: `.pp-main.bare { display: grid; grid-template-columns: minmax(0, 1fr) minmax(300px, 380px); gap: 64px }`. Kin then sits as a column beside the empty state rather than as one card under it.

### R3-3. UGLY: the review queue's items are the old card, not the book (not seen live)
**Skill:** DESIGN.md ("Source Serif is retired on the sheet"; surfaces separate by tone, never by a border); BAOS 17a (no clipped rounded photo frames); taste-skill type (five sizes).

**Where:** `ReviewQueue.tsx:32` renders `article.contrib`. Inside `.fp-keep` the only rule for it is `.fp-keep .contrib .pic-av` (family-people.css:281). Everything else comes from astory.css:1059–1068 and :1770:
- A 22px-radius cream card with a 1px border.
- An 88px photo with a 12px radius.
- A Source Serif 4 h3 at 22px, and the story text at 20px.
- `.who` at 15px.

That is a different face and three new sizes, inside the gilt "Keeping the family" plate.

**Change:** in family-people.css, restyle `.fp-keep .contrib` the way `.askrow` is:
- No card: transparent, `border-top: 1px solid var(--sheet-rule)`, padding 16px 0.
- `h3`: `var(--book-display)` at `--fz-name`.
- `p.story`: `var(--book-body)` at `--fz-words`.
- `.who`: `--fz-small`.
- `.pic`: the white-bordered print (`padding: 5px 5px 8px; background: var(--paper-print); border-radius: 2px`).

### R3-4. UGLY: one tap throws away what the family sent, with no way back
**Skill:** hallmark interaction ("Undo over confirm… show a toast with an Undo button for 5–10 seconds"); BAOS 29 (the family's own words).

**Where:** `ReviewQueue.tsx:56` and `:101` ("Not this one" rejects at once), and `Waiting.tsx:127` and `:149` ("Decline"). The item leaves the list, and no screen can bring it back.

**Change:** hold the item in place for 6 seconds as one line, "Set aside Claire's memory · Undo", and only then call `rejectContribution` or `answerJoinRequest(…, false)`. Accept stays immediate.

### R3-5. POLISH: shared components push the type scale past five sizes (G1 residual)
**Skill:** taste-skill type §2; DESIGN.md (five sizes ceiling).

**Where:** book-account.css:58–59 (WhereNext 21 and 14), the shared `.btn.sm` (13.5), and the primary `.btn` (15).

**Change:** as in the answer above. WhereNext reads `var(--fz-name, 21px)` and `var(--fz-small, 14px)`, small buttons take `--fz-small` where it is defined, and the furniture and glyphs are exempt.

### R3-6. POLISH: on a 2560 window a large family shrinks to the smallest faces
**Skill:** BAOS 8 ("One big screen giving me such small elements is diabolical"); impeccable layout (density matches use).

**Where:** `FamilyTree.tsx:324–329`. For more than six people, `floor` is the last size, so `tooTall()` keeps shrinking until the whole plate fits above the fold.

**Measured, sample family at 2560×1300 (zoom 1.3, fold 1000 CSS px):**
- It sets at `t`: 72px faces and 18px names.
- At `m`, the storyteller's tier ends at 928, above the fold, with 120px faces.
- At `n`, it ends at 699, and the youngest tier ends at 1096.

**Change:** for families over six, floor the fit-to-fold step at `n` (index 2). Use `t` only when a tier wraps or the storyteller's tier would fall below the fold. Let the youngest generation take the scroll instead of shrinking everybody.

### R3-7. POLISH: the generation's name touches its "+ a child" at tablet and phone widths
**Skill:** impeccable craft floor (spacing); taste-skill §8 (careless details).

**Where:** `family-people.css:240–252`. Below 1100px the h3 goes inline and `.tp-ask` has only a right margin.

**Measured:** at 1024 the gap between "Your generation" and the ring of "+ a child" is **0px**. The 390 render shows the same.

**Change:** add `.tp-label h3 + .tp-ask { margin-left: 12px; }` inside the `max-width: 1099px` block.

### R3-8. POLISH: the danger colour is still inline, and the duplicates box is a tinted bubble
**Skill:** hallmark gate 48 (token discipline); BAOS 1 (apply a ruling everywhere) and 17a (no tinted bubbles).

**Where:**
- `style={{ color: "var(--danger)" }}` remains in `ReviewQueue.tsx:147`, `Waiting.tsx:109`, `Duplicates.tsx:146` and `InviteSheet.tsx:396`. InviteSheet also has six inline margin styles, at lines 277–349.
- `.dupes` renders as a `--support-soft` box with 17px text (astory.css:1687–1689).
- `.dupe .acts a.meta:hover` (astory.css:1692) is ungated.

**Change:**
1. Use `className="meta bad"` everywhere, and move the margins into classes.
2. On these pages, set `.fp .dupes` as one ruled line like `.review-none`: `--fz-small`, no fill.
3. Gate the hover with `(hover: hover) and (pointer: fine)`.

### R3-9. POLISH: retries look dead, and a failed take-back says nothing
**Skill:** hallmark 8 states (loading, error); impeccable craft floor (errors name the problem and the recovery).

**Where:**
- The Try again buttons at `Family.tsx:55`, `Keepers.tsx:83` and `Storyteller.tsx:147`. `failed` stays true while the retry runs, so nothing changes on press. (They only become reachable once R3-1 lands.)
- `Family.tsx:88`: a failed "Take back" only relabels the button "Try again".

**Change:**
1. Clear `failed` when the retry starts, so the "Looking for…" line shows again.
2. On a failed take-back, add one `.meta.bad` line under the row: "That code wasn't taken back; check the connection and try again."

### R3-10. POLISH: press and hover details
**Skill:** emil (press feedback 100–160ms; hover gated; transition only what changes).

**Where and change:**
- `family-people.css:185`: the face's press `scale(0.97)` (`:206`) rides a 220ms transition. Use `transform 120ms var(--ease-out), box-shadow 220ms var(--ease-out)`.
- `:264–265`: `.fp-retry:active` scales with no transition. Add `transition: transform 120ms var(--ease-out)`, plus a hover underline colour inside the hover query.
- `:236`: `.tp-menu.ft-menu button:hover` is ungated. Move it into `(hover: hover) and (pointer: fine)`.
- `:403`: the `transition` there is dead (`:405` overrides it). Delete it from 403.

## Emil's review table

| Before | After | Why |
| --- | --- | --- |
| `.tp-node .por { transition: transform 220ms }` carries the press | `transform 120ms` | A press should answer in 100–160ms |
| `.fp-retry:active { scale(.97) }` with no transition | `transition: transform 120ms var(--ease-out)` | A press that snaps reads as a glitch |
| `.tp-menu button:hover` ungated | inside `(hover: hover) and (pointer: fine)` | A tap leaves a stuck tone on touch |
| Reject on "Not this one" at once | 6s "Set aside · Undo", then reject | Undo over confirm for reversible actions |
| `.pp2 .pp-card` transition declared twice | one declaration | Transition only what changes, once |

## Skill by skill

- **taste-skill:**
  - Gaps: R3-2 (fullness), R3-5 (sizes), R3-6 (scale on a big screen), R3-7.
  - Passes:
    - h1 one line at every size measured (58 at 1920, 57 at 1366, 40 and 34 at 390).
    - Every h2 is one line, and the tier h3s are two lines at most.
    - No horizontal scroll at 390, 1024, 1366, 1920 or 2560.
    - The one live thing holds: pointing at a face lights its line.
    - Running text is in full ink, and there are no eyebrows, monospace or index numbers.
- **hallmark:**
  - Gaps: R3-1 and R3-9 (states), R3-4 (undo over confirm), R3-8 (gate 48).
  - Passes:
    - No two-line buttons or links at 390. The "Give 4 memories a year…" link fits, ending at x 364.
    - No `transition: all`.
    - Image tracks are `minmax(0, 1fr)`.
    - The Keepers remove now confirms inline.
    - Menu focus is visible.
    - Every `vh` and `vw` is divided by `--zoom`.
    - Ornaments are `aria-hidden`.
- **emil-design-eng:**
  - Gaps: R3-10.
  - Passes:
    - House curves only.
    - Faces rise from 0.95, and dots from 0.6.
    - The tooltip delays 450ms on hover, 0 on focus and 120ms on the next face.
    - The glint plays only on entry.
    - The card press is `scale(0.98)` in 120ms.
    - The reduced-motion lists cover the file's transitions.
- **impeccable:**
  - Gaps: R3-1 (misleading state), R3-3 (off-system component on the sheet), R3-2 (density), R3-9.
  - Passes:
    - Missing dates are gathered into one row with the time it takes (BAOS 34).
    - The relation agrees between the tree and the page.
    - Themed focus rings everywhere.
    - The empty state has a pose, a sentence, the time and one action.
- **GSAP (react, timeline, performance, scrolltrigger):** no gaps.
  - `treeMotion` and `railMotion` run in `gsap.matchMedia()` with `mm.revert()` and are scoped to their root.
  - Every tween is `fromTo` with `clearProps`, tweening only transform and opacity.
  - The shared develop is now opacity-only and stepped by the watchdog.
  - No ScrollTrigger is used.
  - After stepping the ticker, no face or card was left below opacity 1. The only element at 0 was the below-fold `.pp-more`, waiting for `onEnter` as designed.
