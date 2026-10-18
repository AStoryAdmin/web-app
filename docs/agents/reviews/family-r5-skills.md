# Skills Steward: Family and Person, round 5

**Verdict: GAPS (0 blocker, 2 ugly, 6 polish).** All eight round-4 gaps are fixed, and the ones I could trigger behave as asked. R4-1, R4-2, R4-3 and R4-8 measure fixed. R4-4, R4-5 and R4-6 are fixed in code. R4-7 is mostly fixed: a smaller hole remains. The two ugly gaps are both new, from the fresh pass:
- **R5-1:** the three questions on an empty person page open a blank writer, and the question the person tapped is lost.
- **R5-2:** "Take back" kills a code that is already out with one tap, and nothing can undo it.

**Scope:**
- `pages/Family.tsx` and `pages/Person.tsx`.
- `components/family/*`: the new `HeldLine.tsx`; `useHold.ts` with its sending state and its focus return through `data-undo-to`; plus `ReviewQueue`, `Waiting`, `Duplicates`, `Storyteller`, `Keepers`, `useMyCodes` and `tree/FamilyTree.tsx`.
- `components/person/personRail.ts` (`promptsAbout`) and `styles/pages/family-people.css`.
- Shared pieces, read only where these pages use them: `lib/arrive.ts`, `components/ui.tsx` Button, and `Write.tsx`'s `q`/`with` params.

**Skills loaded:**
- taste-skill: SKILL, type, layout, critique.
- hallmark: SKILL disciplines, slop-test gates 1–57, interaction-and-states (including "Undo over confirm"), responsive, the anti-patterns index, microinteractions (toast, undo and optimistic rollback).
- emil-design-eng (whole).
- impeccable: SKILL, craft-floor, polish, layout, critique.
- gsap-react, gsap-timeline, gsap-performance, gsap-scrolltrigger.

I also read BAOS-STANDARD.md and DESIGN.md. No other installed skill applies.

**How it was checked:**
- I read every file in scope.
- I rendered the pages in my own tab, force-reloaded, and measured with JS after stepping `__gsap.ticker`:
  - `/family` at 1920×1000, 390×844 and 2560×1300 (html zoom 1.3).
  - Ty Ngo (no memories, one live code) at 1920, 1366, 390 and 2560 at zoom 1.3.
  - Bao Vo at 1920 and 390.
- **Failure states, simulated in my tab only.** I wrapped `window.fetch` in my tab so that GETs to `/rest/v1/{family_codes, story_join_requests, contributions, story_managers}` rejected, then remounted the page through the router. The app's dev Supabase client calls the global `fetch` per request, so no second client was made. Only reads were refused; nothing was written. Afterwards I emptied the set and counted requests on one load.
- Tests: the vitest suites under `components/family` and `components/person` pass, 4 files and 41 of 41 tests. `tsc --noEmit` prints nothing. No test covers `useHold`, `HeldLine` or `promptsAbout`.
- taste-skill `lint.mjs` shows the same sanctioned FAILs as rounds 2–4, all book material or the brand's hairlines: shadow, hairline, gradient (the glint mask) and outlined-box. The one WARN is the `padStart` in a sample date. There are no stock phrases, no monospace and no eyebrows.
- My tab is closed and its viewport is reset. I never signed out and never touched `astory-app-auth`.

**Not verified:**
- **Held "Not this one" and "Decline", live, with focus.** The founder's family has nothing pending and I would not create anything. I reviewed them from code only.
- **Hover** on a real pointer.
- **3840 wide.**
- `.pp-more` on Bao's page rose this time, within 1.2s of being scrolled into view. `arrive.ts:170–172` still hides "later" items ahead of time, which is not this round's scope, so it isn't graded.

## Round-4 gaps, re-checked

| # | Status | Evidence |
| --- | --- | --- |
| R4-1 codes failing reads "not on A Story yet" | **Fixed** | With `family_codes` failing, Ty's plate read "Checking for an invitation…" at 400ms, then the red alert "Couldn't check for an invitation just now. Try again", with no Make a code. In the tree, Ty, Nhi Tran, GBao Vo and Nhi carried no state line until the codes were known. On success they read "invited · waiting for them" and "not on A Story yet". The residual is R5-8. |
| R4-2 "Nothing waiting" above the asks' failure | **Fixed** | With the asks failing, no "Nothing waiting" line rendered (`ReviewQueue.tsx:162`). `WaitingOnOthers` has a Try again (`Waiting.tsx:260–275`). The residuals are R5-3 and R5-4. |
| R4-3 errors grey in the keeping row | **Fixed** | All six failure lines measured `rgb(176, 58, 46)`: `st-empty bad`, `review-none bad`, the asks, the waiting-on line, `fp-quiet bad` and the keepers (family-people.css:525). |
| R4-4 storyteller "Nobody has added" while loading | Fixed (code) | `contributions` starts `null`, the retry resets it to `null`, and "Looking for the family's lines…" shows with `aria-busy` (`Storyteller.tsx:41, 156, 163`). |
| R4-5 one-tap "Remove the extra" beside Merge | Fixed (code) | The merge branch now offers only "Merge into one" (`Duplicates.tsx:131–139`). |
| R4-6 Undo while sending; focus dropped | Fixed (code) | `sending` swaps the line to "Setting aside…" with no button (`HeldLine.tsx:21–30`). Undo is focused on mount (`:12–14`). Undo hands focus back through `data-undo-to`, and Button forwards the attribute (`ui.tsx:30`). The residuals are in R5-5. |
| R4-7 hole under Ty's empty state | **Mostly** | The three questions fill the empty state. The plate still outruns the main row: by 238px at 1920 (891 against 653), 125px at 1366 and 309px at 2560 zoom 1.3. See R5-7. |
| R4-8 13.5 and 14 beside 13 | **Fixed** | `.btn.sm` measures 13px ("Take back", "Invite") and `.arc-task` measures 13px (family-people.css:529–530). |

## Gaps

### R5-1. UGLY: the three questions on an empty person page drop the question
**Skill:** impeccable craft floor ("controls name their action"); hallmark copy (a link says what it does) and gate 45 (no element without purpose); BAOS 19 (the same action shouldn't appear twice) and 28 (a letter already begun).

**Where:** `Person.tsx:506`. Each question links to `/write?with={id}`, the same URL as "Write a memory with Ty" just above it (`:498`). The writer only reads a question from `q`, resolved against `todaysDeck` (`Write.tsx:496–509`).

**Measured:** Ty's three rows ("What does Ty always have in the fridge?" and two more) all have href `/write?with=36cfd520…`. Tapping one opens an empty writer with no question, so the page shows four links that do one thing.

**Change:** carry the question:
1. Link to `/write?with={id}&about={q.id}`.
2. In `Writer`, when `about` is set, resolve the prompt from `getAboutPrompts(firstName(person))`, which uses the same ids as the storyteller's bank (`interview.js:6653`), and use it as `question`.

Or, if the writer can't take it this round, drop the three rows rather than ship links that lie. Also, `firstNameOf` falls back to "them" (`personRail.ts:166`), which yields "them's". Pass `""` and let `getAboutPrompts` say "this person".

### R5-2. UGLY: "Take back" kills a live code in one tap, with no way back
**Skill:** hallmark interaction ("Undo over confirm"); impeccable polish triage #1. This is BAOS 1, the R3-4 and R4-5 ruling applied everywhere: a mis-tap must never undo what the family has started.

**Where:** `Family.tsx:76–94` (MyCodes) and `Person.tsx:186–198, 350`. One click calls `revokeCode` at once. The code may already be in a relative's hands. Once revoked it is dead, and the only way back is a new code sent again.

**Change:** run both through `useHold`:
- the line "Took back TTC JP2 for Ty · Undo", held 6s, then `revokeCode`;
- on failure, keep the existing "That code wasn't taken back…" line.
- On the person page, the plate's state stays "invited · waiting for them" until the send lands.

### R5-3. POLISH: the asks unmount and refetch whenever the review section changes shape
**Skill:** hallmark 8 states (loading); impeccable polish triage #1 (misleading state) and "Optimism" (no flash of a wrong state); gsap-react, by analogy (state that belongs to a child mustn't be torn down by its parent's re-render).

**Where:** `ReviewQueue.tsx:137–191` renders `{asked}` in three branches. It is the second child in the failure and none branches (`:153, :163`), but the third child in the main one (`:178`). So `<Asked>` remounts every time the queue moves between them, losing its items, its error and any held decline, and fetching again.

**Measured:**
- With the asks failing, their alert arrived seconds after the others, because they were fetched once in the "Looking…" branch and again after the switch.
- On one normal load: 6 GETs to `story_join_requests` and 6 to `person_suggestions`, against 4 expected under StrictMode.
- Code path: a keeper with a pending join sees "Nothing waiting for your review" between the contributions landing and the asks landing.

**Change:** render one `<section className="review">` always, with `{asked}` at a fixed position (for example, always first in a `.review-asked` slot), and switch only the heading, the "Looking…" line and the none line around it. Show the none line only when both loads have finished (`items !== null && askedLoaded`).

### R5-4. POLISH: two retries go silent, and every Try again drops focus to the page
**Skill:** hallmark 8 states (loading); impeccable polish ("visible keyboard focus, logical tab order"). This is the R3-9 and R4-4 pattern on the two places it wasn't fixed.

**Where:**
- `Waiting.tsx:147–163` (`Asked`) and `:260–276` (`WaitingOnOthers`) return `null` while a retry is loading.
- Every Try again button unmounts when pressed (`Family.tsx:55`, `ReviewQueue.tsx:142`, `Keepers.tsx:84`, `Storyteller.tsx:151`, `Person.tsx:326`).

**Measured:** pressing Try again on "What you asked of others couldn't be reached just now":
- At 50ms the line was gone, with nothing in its place and focus on `<body>`.
- At 8s it came back.

**Change:**
1. While retrying, render `<p className="meta" aria-busy="true" tabIndex={-1}>Looking again…</p>` in both components.
2. In each retry handler, move focus to that line, or keep the button mounted with `aria-busy` and the label "Looking…", so the keyboard keeps its place.

### R5-5. POLISH: the held line's edge cases
**Skill:** emil-design-eng Sonner principle 4 ("Pause toast timers when the tab is hidden… handle edge cases invisibly"); hallmark microinteractions (pause the toast on hover); impeccable polish (focus).

**Where:**
- `useHold.ts:54`: on a failed send, `focusBack(id)` pulls focus to "Not this one" six seconds after the press, wherever the person has gone since (another field, the invite sheet). The `rAF` also races React's commit outside an event handler, so the button may not be there yet.
- `HeldLine.tsx:15–18` keeps focus on the line while it sends. When the send lands the line unmounts and focus falls to `<body>`.
- `useHold.ts:44–58`: the 6s runs while the tab is hidden or the pointer rests on the line.
- `ReviewQueue.tsx:157` counts held items in the heading's number ("2 Waiting for your review" with one set aside).

**Change:**
1. Only hand focus back if it is still on the held line or on `<body>`. Do it from the item's own `useLayoutEffect` (a `focusOnMount` flag) rather than from `rAF` plus `querySelector`.
2. After a send lands, focus the next item's first button, or the section's heading (`tabIndex={-1}`).
3. Pause the timer on `visibilitychange` (hidden) and on `pointerenter` over the line, and resume on the way back.
4. Count `items.filter((i) => !held[i.id])`.

### R5-6. POLISH: the kept line on a person's page is a sixth size, and over the statement limit on a phone
**Skill:** taste-skill type §2 ("five sizes is the ceiling… if two sizes look almost the same, make them the same") and its house rule on statements (24px or less on a phone); DESIGN.md (five sizes).

**Where:** family-people.css:539–540 and 567–568. `.pp-words-plate p` is 31px, or 26px when long, against the page's 13 / 18 / 20 / 28 / 58.

**Measured:** Bao's page at 1920 has text at 13, 18, 20, 28 and 31, plus the 58 title on the cloth: six sizes. The long variant's 26 sits beside the 28 section size. At 390 the plate is 25px.

**Change:**
- Add `--fz-statement` to the token line at :11: 32px on desktop, 24px under 760px.
- Set the plate to `font-size: var(--fz-statement)`, and the long variant to the same size with a wider `max-width` (38ch) rather than a near-twin 26.
- Either retire 31 in favour of it, or count it as the page's fifth size and fold 20 into 18 for names. Pick one; don't keep both.

### R5-7. POLISH: the question rows run past their words, and their press snaps
**Skill:** taste-skill layout §3 (text hangs from one measure) and pass 5 ("a hole usually sits beside a short column"); emil (press 0.95–0.98 with a transition); DESIGN.md (pressed 0.97 in 120ms).

**Where:** family-people.css:545–552.
- `.pp-prompts` takes the empty state's full width.
- `a:active { transform: scale(0.99) }` has no transform in its transition (`:548`, color only), so the press jumps.

**Measured:** at 2560 zoom 1.3 the row is 1064px wide. The question is 475px, and the arrow sits 565px to its right, under a 517px paragraph. The R4-7 hole remains as 238px of blank paper at 1920 and 309px at 2560, below the empty state and beside the plate.

**Change:**
- Cap the list at the paragraph's measure: `.pp-prompts { max-width: 46ch }` in `--fz-words` terms, about 560px. The arrow then sits by its words.
- Set `transition: color 160ms var(--ease-out), transform 120ms var(--ease-out)` and `:active { transform: scale(0.98) }`.
- For the hole, set `.pp-main.bare .pp-story { min-height: <the plate's height> }`, or give the dog more scale (about 180px). Don't add another card.

### R5-8. POLISH: when the codes fail, the plate says it twice
**Skill:** BAOS 19 (one disclosure); impeccable craft floor ("errors name the problem and the recovery"); hallmark copy (no vague state words).

**Where:** `Person.tsx:302–331`. The state line reads "Not known just now", and under it the alert reads "Couldn't check for an invitation just now. Try again". The first line names nothing; the second says it properly.

**Measured:** Ty with `family_codes` failing: "Not known just now", then the alert.

**Change:** on failure, leave the state line out (render nothing at `:302`) and let the alert be the one line. For a person who can't be invited (not `inviteable`), keep the alert itself, so the failure is still said once.

## Emil's review table

| Before | After | Why |
| --- | --- | --- |
| Hold timer runs while the tab is hidden | Pause on `visibilitychange`, resume on return | The six seconds belong to the person, not to the clock |
| Failed send pulls focus back after 6s from anywhere | Return focus only if it is still on the line or `<body>` | Never move a keyboard user who has moved on |
| `.pp-prompts a:active { scale(0.99) }`, no transform transition | `scale(0.98)`, `transform 120ms var(--ease-out)` | The press should be felt, and should ease rather than jump |
| Try again unmounts itself; focus falls to `<body>` | The button stays as "Looking…" with `aria-busy`, or focus moves to the loading line | Feedback where the hand is |

## Skill by skill

- **taste-skill:**
  - Gaps: R5-6 (sizes, phone statement), R5-7 (measure, residual hole).
  - Passes:
    - h1 on one line: "The Vos." at 58px; "Ty Ngo & Bao." at 58px on the cloth.
    - No horizontal scroll at 390, 1366, 1920 or 2560 on either page.
    - The one live thing holds: pointing at a face lights its line.
    - Running text is in full ink.
    - No eyebrows, monospace or index numbers.
- **hallmark:**
  - Gaps: R5-1 (a link that doesn't do what it says), R5-2 (undo over confirm), R5-3 and R5-4 (loading states), R5-5 (focus).
  - Passes:
    - No two-line buttons or links at 390.
    - Every control at 390 is 44px or taller.
    - No inline styles (gate 48).
    - Error lines are red and carry `role="alert"`, so they aren't colour alone.
    - `minmax(0, 1fr)` tracks.
    - Ornaments are `aria-hidden`.
    - The tooltip waits 450ms on hover and 0 on focus. This is shorter than hallmark's 800ms; it was ruled in earlier rounds and is not regraded.
- **emil-design-eng:**
  - Gaps: R5-5 and R5-7 (press).
  - Passes:
    - The held line swaps in place with no animation, which is right for a frequent action.
    - House curves only.
    - Presses elsewhere are 120ms at scale 0.97 or 0.98.
    - Hovers are gated.
    - Reduced motion covers the new `.pp-prompts` transitions (`:571–573`).
- **impeccable:**
  - Gaps: R5-1 and R5-2 (triage #1), R5-3, R5-4 and R5-8.
  - Passes:
    - The failure lines name the problem and the recovery.
    - Themed focus ring (`astory.css:159`) on the held line's `tabIndex={-1}`.
    - The "invited" state agrees between the tree and the person page.
- **GSAP (react, timeline, performance, scrolltrigger):** no graded gaps.
  - `treeMotion` and `railMotion` run in `gsap.matchMedia()`, with `mm.revert()`, scoped to their root.
  - Every tween is `fromTo` with `clearProps`, on transform and opacity only.
  - No ScrollTrigger is used.
  - After stepping the ticker, nothing in view sat below opacity 1 except the running head's designed `rh-sec` and the plate's designed 0.7 and 0.75 rules.
  - `.pp-more` rose from 0 to 1 within 1.2s of being scrolled into view.
