# Skills Steward: Family and Person, round 7

**Verdict: GAPS (0 blocker, 0 ugly, 3 polish).**

All six round-6 gaps are fixed, and so are the three BAOS round-6 findings. I measured every one I could reach live.

One fix is only partly right:
- **R6-2 (Try again keeps the keyboard's place):** it works on success in all six places, and on a second failure in ReviewQueue, Keepers and the person page.
- **But:** in Storyteller, Asked, WaitingOnOthers and MyCodes a second failure still drops focus to `<body>`. The loading line and the failure line are the same `<p>` in the same slot, so React patches one into the other. The hook then never sees the line leave (R7-1).

The other two gaps are small and new: one is an edge on the new tablet plate, the other is the Keepers held row's spacing.

This is close to the passing round. None of the three is visible to a pointer user at the founder's sizes.

**Scope:**
- `pages/Family.tsx` and `pages/Person.tsx`.
- `components/family/*`: the new `useFocusNext.ts`; `useRetryFocus.ts` (now with `home` and `again`); Keepers with Remove run through `useHold`; the `fallback` on `Asked`; MyCodes' `home`; `FamilyTree.tsx`'s `balance()`; `useHold`, `HeldLine`, `ReviewQueue`, `Waiting` and `Storyteller`.
- `components/person/personRail.ts` and its test (`WORK_PAST`).
- `styles/pages/family-people.css`, the round-7 block and the token header.

**Skills loaded:**
- taste-skill: SKILL (house rules and laws), layout, type, critique.
- hallmark: interaction-and-states, responsive, slop-test gates 1–57, and microinteractions (undo and optimistic rollback).
- emil-design-eng (whole).
- impeccable: craft-floor, polish, layout.
- gsap-react, gsap-performance, gsap-timeline and gsap-scrolltrigger (cleanup and refresh rules).

I also read BAOS-STANDARD.md and DESIGN.md. No other installed skill applies.

**How it was checked:**
- I read every file in scope.
- **Tests:** vitest on `components/family` and `components/person` passes, 5 files and 47 of 47 tests. `tsc --noEmit` prints nothing. Nothing tests `useRetryFocus` or `useFocusNext`.
- **taste-skill `lint.mjs`** on the in-scope files: the same sanctioned categories as rounds 2–6 (shadow, hairline, gradient as book material, outlined-box WARN). Nothing new.
- **Live, in my own tab (tab-125),** force-reloaded at each size:
  - `/family` at 1920×1000, 800×1024 and 390×844, and `/family?preview=tree` at 800.
  - Ty Ngo at 1920, 2560×1300 (html zoom 1.3, `--zoom` read 1.3000), 1366×768, 800 and 390.
  - Bao Vo at 390.
- **In-place swaps on Ty (none sends a request).** Change Ty's details, Cancel, Remove from the tree, Keep, Send the code again.
- **Failure states, in my tab only.** I wrapped `window.fetch` so GETs to `/rest/v1/{family_codes, contributions, story_join_requests, story_managers, person_suggestions}` rejected, and remounted through the router. Then, one section at a time, I pressed each Try again while reads still failed, and again after I restored them. I logged every `focus()` call.
- **Clean-up.** The wrapper and the focus log went with a full navigation. The viewport is reset to desktop and the tab is closed. I never signed out, never touched `astory-app-auth`, never opened `/write` and wrote nothing.

**Not verified:**
- Keepers' held Remove, live: the founder has no other keepers. I read it from the code.
- A held send that lands or fails (that needs a write), and "Not this one" or "Decline" live (nothing is pending).
- MyCodes' success path when no codes are left ("No codes out at the moment."). The founder has one code, so the list rendered.
- 3840 wide, a real pointer's hover, and reduced motion. I read the reduced-motion rule from the CSS only.

## Round-6 gaps, re-checked

| # | Status | Evidence |
| --- | --- | --- |
| R6-1 the empty person page leaves the right half bare | **Fixed** | `.pp-main.bare` is a grid from 1600px up (css:565–570) and stacked below it. **1920:** the columns are `919.562px 380px`. The empty state is at 465–1385 and "Ty's family" is a right column at 1449–1829, level with the heading (y 319). **2560 at zoom 1.3:** the empty state is at 607–1869 and the family at 1952–2446. **1366:** stacked, with the empty state ending at 658 and "Ty's family" starting at 722 (a 64px section gap). |
| R6-2 Try again drops the keyboard when the load lands | **Partly** | **Success, fixed in all six:** focus went to `section.st-voices`, `section.review`, `div.fp-keep-review` (twice), `section.fp-invites` and `section.keepers`. Ty's `.pp-state` keeps `tabIndex={-1}`, so focus stayed on it as it changed to "invited · waiting for them". **Second failure, fixed in three:** ReviewQueue, Keepers and Ty's plate land on the new Try again. **Still broken in four:** see R7-1. |
| R6-3 two holds with no place to hand focus | **Fixed (code)** | `Asked` takes `fallback={reviewRef}` (Family.tsx:261) and `.fp-keep-review` has `tabIndex={-1}`. MyCodes' hold falls back to `section.fp-invites` (`home`, Family.tsx:56 and 271), which outlives the list. A landed send is a write, so I didn't run it. |
| R6-4 in-place swaps drop focus; Keepers asks | **Fixed** | **Live, on Ty at 1366:** opening the form focused "First name", and Cancel returned focus to "Change Ty's details". "Remove from the tree" focused "Keep", and Keep returned focus to "Remove from the tree". "Send the code again" focused the CodeCard's first Copy. **Code:** Keepers' Remove is now held ("Stopped Nhi editing · Undo", Keepers.tsx:58–75), with `returnRef` and the section as fallback. The destructive "Remove {first}" keeps its confirm, as hallmark allows. |
| R6-5 six type sizes | **Fixed** | `--fz-name` is now `var(--fz-words)` and the header says five. **`/family` at 1920:** the sheet sets 13, 18, 28 and 58, plus the shared button's 15 (the monograms are seal art). **Bao at 390:** the sheet sets 13, 18 and 24 (section and statement are now one size), with the cloth's 34 title and 15 subline. |
| R6-6 the arrow moves under reduced motion | **Fixed (code)** | css:584: `.pp-prompts a:hover .pp-q-a, .pp-prompts a:active { transform: none; }` inside `prefers-reduced-motion`. The colour change stays. |

**BAOS round 6:**
- **Finding 1 (the empty page's bare right half)** is fixed, as R6-1.
- **Finding 2 (a full-width portrait card at 761–1099)** is fixed. On Ty at 800 the plate is a row:
  - The portrait is at 45–212 and the state, code and actions run beside it from x 246.
  - The card is 343px tall (it was 552).
  - "Nothing with Ty in it yet." starts at y 677, inside the first screen.
  - No horizontal scroll, and every control is 44px tall on one line.
- **Finding 3 (one person alone on a row at 800)** is fixed. `balance()` holds each wrapping row to the narrowest width that keeps its row count.
  - **On `/family`:** "Your generation" splits as Nhi Tran and GBao Vo on the first row, then Bao, Nhi and "+" on the second (row held to 473px).
  - **On the sample:** Rose's generation is the Doyles, then Frank & Rose & Tom, then Arthur Carey with the "+" beside him. Arthur used to stand alone.
  - **On the phone:** the "+" comes last in each generation.

## Gaps

### R7-1. POLISH: in four places a second failure still drops the keyboard to `<body>`
**Skill:** impeccable polish ("Preserve visible keyboard focus"; triage #2, error states); hallmark 8 states (error). This is the residual of R6-2.

**Where:** the loading line and the failure line are both `<p>`, in the same slot, with no `key`. React reuses the DOM node instead of replacing it:
- Storyteller.tsx:152 and :168.
- Waiting.tsx:155 and :173 (`Asked`).
- Waiting.tsx:277 and :294 (`WaitingOnOthers`).
- Family.tsx:60 and :76 (MyCodes). Family.tsx:80, "No codes out at the moment.", is a third `<p>` in the same slot, so success with no codes left will drop focus the same way.

When the ref comes off, `useRetryFocus` (lines 62–63) sees `cur.current.isConnected` still true. It reads that as a StrictMode re-attach and hands nothing on. Meanwhile the node has lost `tabIndex`, so Chrome blurs it.

**Measured:** with reads still failing, the Try again in "The family's lines", "What the family asked", "What you asked of others" and "The codes you've sent" each ended on `<body>`. My focus log shows the loading line focused, then nothing that could hold focus. The same test ended on the new Try again in ReviewQueue and Keepers, whose lines are different elements or slots, and on Ty's plate.

**Change:** either change is enough. Do the first.
1. In `useRetryFocus.ts:63`, treat a node that is still connected but no longer focusable as gone: `if (cur.current?.isConnected && cur.current.getAttribute("tabindex") === "-1") return;`. That covers every caller, now and later.
2. Or give each pair distinct keys (`key="looking"` on the loading line, and `key="failed"` and `key="none"` on the others), so React remounts them.

### R7-2. POLISH: on the tablet plate, "Change Ty's details" starts 17px right of the column
**Skill:** taste-skill critique pass 4 ("Edges… two or three [x positions], reused on purpose"); impeccable polish ("fix optical as well as mathematical alignment").

**Where:** family-people.css:612–614. In the new 761–1099 plate row, the body's text runs from x 246:
- "Add a photograph", the state line, the "Invited with a code…" paragraph and the code all start at 246.
- The pill "Send the code again" has its border at 246, which reads as aligned.
- The borderless quiet `.pp-edit` has its box at 246 but its words at 263, because of the button's 16px padding. In a left-aligned column that reads as an indent. In the centred desktop and phone plates it doesn't show.

**Change:** inside the 761–1099 block, add `.pp-plate-body .pp-edit { margin-inline-start: -16px; }`, or give it the existing `is-flush` (`padding-left: 0`). Keep the 44px target.

### R7-3. POLISH: Keepers' held line takes the list's 12px flex gap, not the sentence spacing the codes' held line has
**Skill:** impeccable polish ("Keep same-role typography consistent"; "match neighbouring… patterns"); emil, "Cohesion matters".

**Where:**
- astory.css:1029: `.keeperlist li { display: flex; gap: var(--s-3); padding: var(--s-2) 0; min-height: 56px }` outranks `.held` (family-people.css:280).
- So "Stopped Nhi editing ·" sits 12px from its Undo, where the same line in the codes list is set as one sentence (`.fp-codes li.held`, column-gap 0.3em, css:597).

I read this in the code only, because the founder has no other keepers.

**Change:** add `.keeperlist li.held { flex-wrap: wrap; column-gap: 0.3em; }` beside the round-6 rule at css:597. The two held lines in the keeping row will then read alike.

## Emil's review table

| Before | After | Why |
| --- | --- | --- |
| Loading `<p>` and failure `<p>` share a slot, so the node is patched and the hook thinks it never left | Count a connected node without `tabindex="-1"` as gone (or key the pair) | The keyboard's place must survive the second failure as it does the first |
| Quiet "Change Ty's details" words 17px in from the plate body's edge on a tablet | `margin-inline-start: -16px` (or flush) in that band only | A borderless control's words are its edge |
| Keepers' held line: text, then 12px gap, then Undo | `column-gap: 0.3em`, as the codes' held line has | The same "no" reads the same way in both lists |

## Skill by skill

- **taste-skill:**
  - Gap: R7-2 (edges).
  - Passes:
    - The empty page uses the window at 1920 and 2560, and leaves no lone face at 800.
    - The tablet plate is a compact row.
    - Five sizes on the sheet.
    - h1 on one line at every size checked.
    - The statement is 36px or less (24px on a phone).
    - No horizontal scroll at 390, 800, 1366, 1920 or 2560 at zoom 1.3.
    - No eyebrows, monospace or index numbers.
- **hallmark:**
  - Gap: R7-1 (the error state's focus).
  - Passes:
    - "Undo over confirm" now covers every reversible "no" on both pages, Keepers included. The destructive removal keeps its confirm.
    - Focus-visible rings on the controls. Handed-to containers show no ring for a pointer (css:617).
    - Error lines are red with `role="alert"`.
    - Every target at 390 and 800 is 44px or taller.
    - No two-line buttons (the "+" rings' italic labels are a designed two-line caption under a ring).
- **emil-design-eng:**
  - Gap: R7-3 (cohesion).
  - Passes:
    - Nothing new animates, which is right for the swaps: they are keyboard-initiated and frequent.
    - Reduced motion now removes the arrow's nudge and the row's press.
    - No `transition: all` and no ease-in.
- **impeccable:**
  - Gaps: R7-1 (focus), R7-2 (optical alignment) and R7-3 (consistency).
  - Passes:
    - The responsive drift from R6-1 is gone.
    - Every swap keeps the keyboard's place.
    - Copy names its action and recovery.
    - No craft-floor ban.
- **GSAP (react, timeline, performance, scrolltrigger):** no graded gaps.
  - `treeMotion.ts` and `railMotion.ts` are unchanged since round 6: `gsap.matchMedia()` with `mm.revert()`, scoped, transform and opacity only, with `clearProps`.
  - No ScrollTrigger is used.
  - `balance()` is layout code, not animation. It runs only inside `draw()` (on resize, a width change or fonts loading, debounced 40ms), so its per-row read after a write isn't worth grading.
