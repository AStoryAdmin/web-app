# Skills Steward: Family and Person, round 6

**Verdict: GAPS (0 blocker, 1 ugly, 5 polish).**

Six of the eight round-5 gaps are fixed, and the two remaining ones are partly fixed:
- **Fixed:** R5-1, R5-2, R5-3, R5-5, R5-7 and R5-8. I measured R5-2, R5-3, R5-7 and R5-8 live.
- **Partly fixed:** R5-4 (focus is now kept while a retry loads, but is lost when the load lands) and R5-6 (still six sizes).

All eight of the BAOS round-5 findings are fixed in code, and I measured the ones I could. The one ugly gap is new:
- **R6-1:** the fix for the BAOS section gap took the grid off the empty person page at every width. On a large window the right half of the main column is now bare paper.

**Scope:**
- `pages/Family.tsx` and `pages/Person.tsx`.
- `components/family/*`: the new `useRetryFocus.ts` and `useHold.test.tsx`; `useHold.ts` with its pause on a hidden tab and on the pointer; `HeldLine`, `ReviewQueue`, `Waiting`, `Storyteller`, `Keepers`, `Duplicates` and `useMyCodes`.
- `components/person/personRail.ts` (`fitsPerson` and `promptsAbout`).
- `styles/pages/family-people.css` (the new `--fz-statement`).
- Shared code, read only where these pages use it: `lib/aboutPrompt.ts` and the `about` param in `Write.tsx` (lines 488–520).

**Skills loaded:**
- taste-skill: SKILL (house rules and laws), type, layout, critique.
- hallmark: interaction-and-states (the 8 states and "Undo over confirm"), slop-test gates 1–57, responsive, and microinteractions (toast, undo and optimistic rollback).
- emil-design-eng (whole).
- impeccable: craft-floor and polish.
- gsap-react, gsap-performance, gsap-scrolltrigger (refresh and cleanup) and gsap-timeline (best practices).

I also read BAOS-STANDARD.md and DESIGN.md. No other installed skill applies.

**How it was checked:**
- I read every file in scope.
- **Tests:** the vitest suites under `components/family` and `components/person` pass: 5 files, 47 of 47 tests (41 in round 5). The new tests cover the hold's Undo, its pointer and hidden-tab pauses, and focus left alone once the keyboard has moved on. `fitsPerson` and `promptsAbout` now have tests. `tsc --noEmit` prints nothing.
- **taste-skill `lint.mjs`,** run on the in-scope files only: the same sanctioned FAILs as rounds 2–5 (shadow, hairline, gradient) and the outlined-box WARN. All are book material or the brand's hairlines. The `padStart` WARN is gone.
- **Live, in my own tab (tab-113),** force-reloaded:
  - `/family` at 1920×1000 and 390×844.
  - Ty Ngo at 1920, 1366, 390, and 2560×1300 with html zoom 1.3 (`--zoom` read 1.3000).
  - Bao Vo at 390 and 1920.
  - `__gsap` isn't exposed on this build, so I waited 3–5s after each load.
- **"Take back" on Family, at 1920 and 390.** I pressed it, measured the held line, and pressed Undo within about 150ms, so the 6s hold never ran out and nothing was sent. For the screenshot at 1920 the line was held under a synthetic pointer pause, then undone. The code stayed live: "TTC JP2 / for Ty Ngo · 29 days left / Take back".
- **Failure states, in my tab only.** I wrapped `window.fetch` so that GETs to `/rest/v1/{family_codes, contributions, story_join_requests, story_managers, person_suggestions}` rejected, and remounted through the router. Only reads were refused. I then cleared the set and pressed each Try again.
- **Clean-up.** The fetch wrapper went with a reload, the zoom was removed, the viewport was reset to desktop, and the tab is closed. I never signed out, never touched `astory-app-auth`, never opened `/write` and wrote nothing.

**Not verified:**
- A held "Not this one" or "Decline", live. The founder's family has nothing pending.
- A send that lands or fails. That would need a write.
- Keepers' Remove (the founder has no other keepers).
- What `/write?with=…&about=…` shows. I read it from `Write.tsx` and `aboutPrompt.ts` only.
- 3840 wide, a real pointer's hover, and reduced motion.
- The request count per load (R5-3's 6 against 4). The client retries failed reads, so my failure-run log can't be compared.

## Round-5 gaps, re-checked

| # | Status | Evidence |
| --- | --- | --- |
| R5-1 the questions drop the question | **Fixed** | All three links carry the question: `/write?with=36cfd520…&about=open-born-where`, `…&about=child-house-rule` and `…&about=work-journey` (Person.tsx:206, 536). The writer resolves `about` through `aboutPrompt()` with the person's first name (Write.tsx:498–518). `firstNameOf` now passes `""`, so the bank says "this person" and never "them's" (personRail.ts:213), and a test covers it. I didn't open the writer. |
| R5-2 "Take back" kills a code in one tap | **Fixed** | **Live:** pressing it gave "Took back TTC JP2 for Ty Ngo · Undo", on one line at both 1920 and 390. Undo had focus, and after Undo focus was back on "Take back" with the code untouched. **Code:** the person page holds it the same way, and the plate keeps "invited · waiting for them" until the send lands, because `mine.codes` only changes in `done` (Person.tsx:193–204, 367–383). |
| R5-3 the asks remount and refetch | **Fixed** | There is one `section.review` with `{asked}` in a fixed `.review-asked` slot (`display: contents`), and "Nothing waiting" needs both loads (ReviewQueue.tsx, lines 181–224 of the component). With every read failing, all six alerts arrived together, where in round 5 the asks lagged by seconds. |
| R5-4 silent retries; focus to `<body>` | **Partly** | **While loading, fixed:** 60ms after each press, focus sat on the busy line in all six places ("Looking again…", "Looking…", "Looking for the codes you've sent…", "Looking for keepers…", "Looking for the family's lines…") and on Ty's "Checking for an invitation…". **When the load lands, not fixed:** focus falls to `<body>` on success and on a second failure. See R6-2. |
| R5-5 the held line's edge cases | **Mostly** | **Fixed:** focus is handed back only when the keyboard is lost (`lost()`, useHold.ts:26–29, 128–135), through a ref and not a `rAF`. The timer pauses on `visibilitychange` and on pointer-over, with tests (useHold.ts:51–75; useHold.test.tsx:60–88). Held items are left out of the heading's count. A landed send focuses the section in ReviewQueue, MyCodes and on the person page. **Residual:** `Asked` has no fallback, and MyCodes' fallback unmounts with the last code. See R6-3. |
| R5-6 the kept line is a sixth size | **Partly** | `--fz-statement` exists (32px, 36px at 1600 and up, 24px on a phone), and the long variant now widens rather than shrinking. But the page still sets six sizes, and on a phone two pairs are near-twins. See R6-5. |
| R5-7 the question rows overrun; the press snaps | **Fixed** | **Rows:** `.pp-prompts` is capped at 560px. The arrow sits 10px from its words at 1366 and 13 zoomed px at 2560 (it was 270–733px). **Press:** `:active` is 0.98 with `transform 120ms var(--ease-out)`. **Hole:** the hole under the column is 61px at 1920 (it was 238) and 79 zoomed px at 2560 (it was 309). But see R6-1, which this change caused. |
| R5-8 the plate says it twice | **Fixed** | With `family_codes` failing, Ty's plate read "Checking for an invitation…" at 400ms. After that, the state line is gone and there is one alert: "Couldn't check for an invitation just now. Try again" (Person.tsx:318, 336). |

**BAOS round 5:**
- Finding 1 (the questions don't carry their question) is fixed, as R5-1.
- Finding 2 (no gap after the empty state at 1280–1599) is fixed: at 1366 the empty state ends at 652 and "Ty's family" starts at 716, a 64px margin.
- Finding 3 (the words plate alone at the left) is fixed: the plate is centred, 652–1198 in a story column of 465–1385 on Bao's page at 1920.
- Finding 4 (the arrows far from their questions) is fixed, as R5-7.
- Finding 5 (the dating row past the column on the phone) is fixed in code: the negative margins go under 760px (css:565). I didn't measure it.
- Finding 6 (the leaf inside the quote) is fixed: the quotation marks are in the markup and the leaf follows the closing one (Person.tsx:461–463).
- Finding 7 (the dangling "·") is fixed:
  - At 390 the Family subline is three lines with no dots.
  - Ty's subline is one block.
  - The tree reads "invited" / "waiting for them" with no dot on a narrow face, and one line on a large one.
- Finding 8 (questions that don't fit the person) is fixed by `fitsPerson`, with tests.

## Gaps

### R6-1. UGLY: on a large window, the empty person page leaves the right half of its column bare
**Skill:** taste-skill layout §4 ("Empty space is placed, not left over") and the critique pass ("a hole usually sits beside a short column"); BAOS 8 ("use the screen") and 10; impeccable polish triage #3 (responsive drift).

**Where:** family-people.css:557–559. `.pp-main.bare { display: block; }` now applies at every width. The comment above it says the column "runs as long as the portrait card beside it", but nothing in the rule does that. To fix the gap at 1280–1599, the grid was dropped everywhere, instead of the zero margin being moved into the 1600px block as BAOS asked.

**Measured, Ty Ngo:**
- **1920:** the main column is 465–1829 (1364px). Its content ends at 1177: the question rows end there, and the paragraph and "Ty's family" end earlier. That leaves 652px of blank paper from y 319 to 830, beside the empty state and beside "Ty's family" below it.
- **2560 at zoom 1.3:** the main column runs 607–2446 and the content ends at 1533 (zoomed px), leaving about 700 CSS px bare.

**Change:** at `min-width: 1600px` only, give `.bare` the layout the `.three` page already uses:
- `.pp-main.bare { display: grid; grid-template-columns: minmax(0, 1fr) minmax(300px, 380px); gap: 64px; align-items: start; }`
- `.pp-main.bare .pp-extras > :first-child { margin-top: 0; }` inside that same block, so the stacked layout under 1600 keeps its 64px gap.

The empty state then takes the wide track, and the person's family sits beside it as a column, as on a page with memories.

Alternative, if one relative is too thin for a column: at 1600 and up, set the empty state's words in the left track and the three questions in a right track starting level with the heading. Either way, don't add a card.

### R6-2. POLISH: Try again keeps the keyboard's place while loading, then drops it when the load lands
**Skill:** impeccable polish ("Preserve visible keyboard focus, logical tab order"; triage #2, the loading and error states); hallmark 8 states (loading and error). This is the residual of R5-4.

**Where:**
- `useRetryFocus.ts:11–18` only focuses the loading line as it mounts. When the line unmounts (on success, the list or the empty line replaces it; on failure, the alert does), nothing takes focus. This affects `Family.tsx:58–80` (MyCodes), `Keepers.tsx:77–97`, `Storyteller.tsx:150–169`, `ReviewQueue.tsx` (the "Looking…" line gives way to the none line) and `Waiting.tsx:150–174` and `:272–294`.
- `Person.tsx:319` sets `tabIndex={codesUnknown ? -1 : undefined}`. When the codes arrive, the focused line stops being focusable and Chrome blurs it.

**Measured:** with reads restored, I pressed each of the six Family Try agains one at a time. Four seconds later focus was on `<body>` every time. On Ty's page it was also `<body>` once "invited · waiting for them" landed. With reads still failing, focus was on `<body>` after the second failure.

**Change:**
1. Give `useRetryFocus` a `home` ref for a container that persists across the swap: `section.fp-invites`, `section.keepers`, `section.st-voices`, the `fp-keep-review` div, and `.pp-plate`, each with `tabIndex={-1}`.
2. In a `useLayoutEffect` after the armed load settles, if the keyboard is lost (the same `lost()` as useHold), focus the alert's Try again on a second failure, or `home` on success.
3. On Person.tsx:319, keep `tabIndex={-1}` on `.pp-state` whatever the state, so the focused line never turns unfocusable.

### R6-3. POLISH: two holds have no place to hand focus once their send lands
**Skill:** impeccable polish (focus); emil Sonner principle 4 ("handle edge cases invisibly"). This is the residual of R5-5.2.

**Where:**
- `Waiting.tsx:59`: `useHold(onFail)` has no fallback. After a Decline lands, the line was focused (HeldLine moves focus to it while sending), so focus falls to `<body>`. When it was the last ask, `Asked` returns `null`.
- `Family.tsx:55, 80, 83`: MyCodes' fallback is the `ul`. When the last code is taken back the `ul` unmounts for "No codes out at the moment.", so the fallback is `null` and focus falls to `<body>`.

I read this in the code only: a landed send is a write.

**Change:**
- `Asked`: add a `fallback` prop. Family passes `reviewRef`, and the `.fp-keep-review` div at Family.tsx:255 gets `tabIndex={-1}`.
- MyCodes: pass a ref on `section.fp-invites` (Family.tsx:270, `tabIndex={-1}`) instead of the list.

### R6-4. POLISH: the in-place swaps on these pages drop focus, and Keepers still asks where the rest of the page holds
**Skill:** impeccable polish ("logical tab order"; "match neighbouring… optimistic or pessimistic patterns"); hallmark "Undo over confirm" (for a reversible action, do it, then offer Undo); BAOS 1 (the R5-2 ruling applied everywhere).

**Where:**
- Person.tsx:397–405 ("Change Ty's details" opens the form at 408), :424 (Cancel), :444 → 431–441 ("Remove from the tree" turns into the question, then "Keep") and :376 ("Send the code again" swaps in the CodeCard at :356).
- Keepers.tsx:117 → 105–113 ("Remove" turns into "Stop · Keep").

**Measured** on Ty at 2560 (nothing written; none of these sends a request): opening the form, asking to remove, Keep, Cancel and "Send the code again" each left focus on `<body>`.

**Change:**
1. Opening the form focuses "First name". Cancel returns focus to "Change Ty's details".
2. The removal question focuses its safe answer, "Keep". "Keep" returns focus to "Remove from the tree".
3. The CodeCard focuses its first Copy.
4. Use the same `returnRef` idea as useHold.
5. Keepers' Remove is reversible only by asking again, like a code, so run it through `useHold` ("Stopped Nhi editing · Undo", then `removeManager`). This replaces the in-place confirm.
6. Keep the confirm on Person's "Remove from the tree": hallmark keeps a confirm for the destructive one.

### R6-5. POLISH: still six type sizes, and two near-twin pairs on a phone
**Skill:** taste-skill type §2 ("Five is the ceiling… If two sizes look almost the same, make them the same"); DESIGN.md (five sizes). This is the residual of R5-6 ("Pick one; don't keep both").

**Where:**
- family-people.css:11 defines six tokens: display 58, statement 32 (36 at 1600 and up, :537–539), section 28, name 20, words 18 and small 13.
- :325 sets the phone's: display 40, statement 24, section 26, name 19, words 18.
- The header comment at :9 still says "Five type sizes".

**Measured:**
- Bao's page at 1920 sets 13, 18, 20, 28 and 36 on the sheet, plus the 58 title on the cloth: six sizes.
- At 390 it sets 34 (the cloth title), 26 against 24 (section and statement) and 19 against 18 (names and words).

**Change:**
- Retire `--fz-name` into `--fz-words`, so names are set as Cormorant at 18 and the weight carries them.
- On the phone, set `--fz-section` and `--fz-statement` to one value (24).
- The page then has five sizes: 58, 36 or 32, 28, 18 and 13.

### R6-6. POLISH: the question rows' arrow still moves under reduced motion
**Skill:** emil (Accessibility: "Remove movement and position animations"); DESIGN.md ("Reduced motion collapses to a 150 ms crossfade").

**Where:**
- family-people.css:555: `.pp-prompts a:hover .pp-q-a { transform: translateX(3px); }`.
- family-people.css:551: `.pp-prompts a:active { transform: scale(0.98) }`.

The reduced-motion block (`:570–572`) removes only the transitions, so the arrow still jumps 3px and the row still shrinks, just instantly.

**Change:** in the reduced-motion block, add `.pp-prompts a:hover .pp-q-a, .pp-prompts a:active { transform: none; }`. Keep the colour change.

## Emil's review table

| Before | After | Why |
| --- | --- | --- |
| Try again's loading line holds focus, but focus falls to `<body>` when the load lands | Hand focus to the section (or the new Try again) once it settles, if the keyboard is lost | Feedback stays where the hand is through the whole round trip |
| `.pp-state` drops `tabIndex` as the codes arrive | Keep `tabIndex={-1}` in every state | A focused element that turns unfocusable throws the keyboard to the top |
| Keepers: "Remove", then "Stop · Keep" | Hold: "Stopped Nhi editing · Undo" for 6s | The same "no" behaves the same way everywhere on the page |
| `translateX(3px)` arrow nudge kept under reduced motion | `transform: none` under `prefers-reduced-motion` | Reduced motion means no movement, not just no easing |

## Skill by skill

- **taste-skill:**
  - Gaps: R6-1 (left-over space beside a short column) and R6-5 (sizes).
  - Passes:
    - h1 on one line at every size checked ("The Vos.", "Ty Ngo & Bao.").
    - The statement is 36px or less on desktop and 24px on a phone.
    - No horizontal scroll at 390, 1366, 1920 or 2560 at zoom 1.3.
    - No eyebrows, monospace or index numbers.
    - Running text is in full ink.
    - The dangling dots are gone.
- **hallmark:**
  - Gaps: R6-2, R6-3 and R6-4 (focus, and "Undo over confirm" applied once more).
  - Passes:
    - The held line has default, focus-visible (a terracotta ring), active (0.97) and hover-gated states.
    - Undo is 44px tall.
    - The line is `role="status"` and `aria-busy` while sending.
    - Error lines are red `rgb(176, 58, 46)` with `role="alert"`, so the colour never carries them alone.
    - No two-line affordances at 390.
    - There's no pause on focus, deliberately: Undo takes focus as the line appears, so a pause on focus would hold it forever. I accept that.
- **emil-design-eng:**
  - Gap: R6-6.
  - Passes:
    - The hold swaps in place with no animation, which is right for a frequent action.
    - The six seconds now pause for a hidden tab and a resting pointer (Sonner principle 4).
    - The question rows press at 0.98 in 120ms on the house curve.
    - No `transition: all` and no ease-in.
- **impeccable:**
  - Gaps: R6-2, R6-3 and R6-4 (focus and tab order), and R6-1 (responsive drift).
  - Passes:
    - Copy names its action and recovery ("Couldn't check for an invitation just now. Try again").
    - The questions now open what they name.
    - There's one disclosure per failure.
- **GSAP (react, timeline, performance, scrolltrigger):** no graded gaps.
  - `treeMotion.ts` and `railMotion.ts` have not changed since round 5. They run in `gsap.matchMedia()` with `mm.revert()` and are scoped to their root.
  - Tweens are transform and opacity only, with `clearProps`.
  - No ScrollTrigger is used.
  - Nothing new in round 6 animates.
