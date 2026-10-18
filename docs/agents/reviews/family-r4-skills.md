# Skills Steward: Family and Person, round 4

**Verdict: GAPS (0 blocker, 4 ugly, 4 polish).** Seven of the ten round-3 gaps are fixed and measure fixed: R3-3, R3-6, R3-7, R3-8 and R3-10 fully, R3-2 and R3-5 with small residuals. R3-1, R3-4 and R3-9 are partly fixed. The data layer now throws and no caller leaves a rejection unhandled. But two callers still turn a failure into a false state, and inside the keeping section every error line renders as grey small print. Worst one left: if the codes don't load, Ty Ngo reads "not on A Story yet" and his page offers "Make a code" (R4-1).

**Scope:**
- `pages/Family.tsx` and `pages/Person.tsx`.
- `components/family/*`: the new `useHold.ts`, plus `useMyCodes.ts`, `ReviewQueue.tsx`, `Waiting.tsx`, `Keepers.tsx`, `Storyteller.tsx`, `Duplicates.tsx`, `InviteSheet.tsx` and `tree/FamilyTree.tsx`.
- `components/person/*` and `styles/pages/family-people.css`.
- The list functions in `data/family.ts`, `data/familyWrites.ts` and `data/contributions.ts`.
- The shared pieces these pages pull in: WhereNext (book-account.css:55–71), `.btn.sm` (astory.css:329, 1560, 1757), `lib/arrive.ts` and `.arc-task` (archive-reading.css:405).

**Skills loaded:**
- taste-skill: SKILL, type, layout, critique.
- hallmark: SKILL disciplines, slop-test gates 30–57, interaction-and-states (including "Undo over confirm"), responsive, the anti-patterns index, microinteractions (toast and undo).
- emil-design-eng (whole).
- impeccable: SKILL, craft-floor, polish, layout, critique.
- gsap-react, gsap-timeline, gsap-performance, gsap-scrolltrigger.

I also read BAOS-STANDARD.md and DESIGN.md. No other installed skill applies.

**How it was checked:**
- I read every file in scope.
- I rendered the pages in my own tab, force-reloaded, and measured with JS after stepping `__gsap.ticker`:
  - `/family` at 1920×1000, 1366×768, 1024×768 and 390×844.
  - `/family?preview=tree` at 2560×1300 (html zoom 1.3).
  - Ty Ngo (no memories) at 1920.
  - Bao Vo at 1366 and 390.
- **Failure states, simulated in my tab only.** I wrapped the page's own Supabase client so that GETs to chosen tables reject, then remounted the page through the router:
  - first `story_join_requests` and `person_suggestions`;
  - then `contributions`, `family_codes` and `story_managers`.

  Reads failed; nothing was written.
- Tests: the vitest suites under `components/family` and `components/person` pass, 4 files and 41 of 41 tests. `tsc --noEmit` is clean.
- taste-skill `lint.mjs`: the same sanctioned FAILs as rounds 2 and 3: shadow, hairline and gradient, which are the portrait rings, the floating caption and menu, the book's rules and the glint mask. WARNs are the plates' keylines and one `padStart` in a sample date. There are no stock phrases, no monospace and no eyebrows.
- My tab is closed and its viewport is reset. I never signed out and never read or wrote `astory-app-auth`.
  - **One disclosure:** my first attempt to reach the client imported `/src/lib/supabase.ts` without Vite's `?t=` stamp. That made a second, unused client in my tab, which reads the stored session on start. I then used the app's own instance. The tab has since been reloaded and closed.

**Not verified:**
- **Live states:** the review queue, a held "Not this one" or "Decline", join requests, suggestions and duplicates. The founder's family has none pending, and I would not create any. I reviewed them from code.
- **Hover** on a real pointer.
- **3840 wide.**
- **The person page's below-the-fold rise.** In two of four runs in my background tab, `.pp-more` (and once the "What Bao has told" heading at 390) stayed at opacity 0 for 3 seconds after being scrolled into view, with its inline `opacity: 0; translate(0, 14px)` from `arrive.ts:171` and no tween pending. In the other two runs it rose within a second. I can't tell a real race from my tab's timers, so it isn't graded. It's worth one look:
  - `lib/arrive.ts:170–172` hides the "later" items ahead of time.
  - `railMotion.ts` deliberately doesn't ("Nothing is hidden ahead of time"). BAOS 25 says the same.

## Round-3 gaps, re-checked

| # | Status | Evidence |
| --- | --- | --- |
| R3-1 failure reads as empty | **Partly** | Every list function now throws on a real failure and returns `[]` only for a missing table or function. Every caller catches (table below). The Review, Keepers, Codes and Storyteller "couldn't be reached" lines all rendered under simulation. Two callers still turn the failure into a false state: R4-1 and R4-2. |
| R3-2 thin column for a person with no memories | **Mostly** | Ty Ngo at 1920 is `pp-main bare`: the empty state sits in an 879px column with "Ty's family" as a 420px column beside it. A smaller hole remains: R4-7. |
| R3-3 review items were the old card | Fixed (code) | `.fp-keep .contrib` is now a ruled row (family-people.css:302–308). The photo is a white-bordered print with a 2px radius, the h3 is `--book-display` at `--fz-name`, the story text is `--book-body` at `--fz-words`, and `.who` is `--fz-small`. Not seen live. |
| R3-4 one tap throws away what the family sent | **Fixed, with residuals** | `useHold` holds "Not this one" and both kinds of Decline for 6s as one line with an Undo; leaving the page sends nothing. Residuals are in R4-5 (one more one-tap removal) and R4-6 (focus, and an Undo that can't undo). |
| R3-5 type scale | **Mostly** | WhereNext now reads `--fz-name` and `--fz-small`. On the Family sheet at 1920 the content sizes are 13 / 18 / 20 / 28 / 58, plus the 15px primary button and the 16px arrow glyph. Left over: `.btn.sm` at 13.5, and on the person page `.arc-task` at 14 (R4-8). |
| R3-6 big screen shrinks a large family | Fixed | At 2560×1300, zoom 1.3: size `n`, 92px faces, 20px names. The storyteller's tier ends at 909, above the 1000 fold, and the youngest tier takes the scroll. |
| R3-7 generation name touches "+ a child" | Fixed | 12px gap at 1024 and at 390 (family-people.css:247). |
| R3-8 inline danger, tinted duplicates box | Fixed | There is no `style={{` left in scope. Errors use `meta bad`. InviteSheet's margins are classes (family-people.css:282–286). `.fp .dupes` is one ruled line, and its hover is gated. The colour then loses inside `.fp-keep`, though: see R4-3. |
| R3-9 retries look dead; failed take-back silent | **Partly** | Codes, Keepers and Review show their "Looking…" line on Try again, and a failed take-back adds "That code wasn't taken back…" under the row (Family.tsx:71–75). The Storyteller's retry still shows the false empty state (R4-4). |
| R3-10 press and hover details | Fixed | The face's press is 120ms (`:186`). `.fp-retry` has a 120ms transition and a gated hover (`:271–275`). The menu hover is gated (`:237`). The dead transition is gone (`:432–434`). |

### Every caller of the functions that now throw

| Function | Caller | Handles it? |
| --- | --- | --- |
| `listJoinRequests`, `listPendingSuggestions` | `Waiting.tsx:60` (`Asked`) | `.catch` → `failed`, with Try again. But see R4-2. |
| `listMyJoinRequests`, `listPendingSuggestions` | `Waiting.tsx:232` (`WaitingOnOthers`) | `.catch(() => null)` → `failed`. No Try again (R4-2). |
| `listMyCodes` | `useMyCodes.ts:19` | `.catch` → `failed`. `MyCodes` shows it (Family.tsx:51). **The tree and the person page ignore it (R4-1).** |
| `listManagers` | `Keepers.tsx:28` and `:52` | `.catch` → `failed`, with Try again. After an invite, it keeps the old list. |
| `fetchContributions` | `ReviewQueue.tsx:92`, `Storyteller.tsx:46` | `.catch` → `failed`, with Try again (R4-4 for the retry). |
| `listContributions` (quiet wrapper) | Archive, Mosaic, Book, `FamilyNotes` | It swallows by design, returning `[]`. On the person page a failure just leaves "A note from Ty" out, which is acceptable for an additive section. |

No unhandled rejections are left.

## Gaps

### R4-1. UGLY: if the codes don't load, an invited person reads "not on A Story yet", and their page offers to make a second code
**Skill:** hallmark 8 states (error); impeccable polish triage #1 ("misleading state"); BAOS 29 (the exact state words) and 42.

**Where:**
- `useMyCodes` exposes `failed`, but only `MyCodes` reads it.
- `Family.tsx:223` passes `mine.coded` (an empty set on failure) to the tree.
- `Person.tsx:74` and `:142` compute `stateKey` from it.
- `Person.tsx:334–341` then renders the "Make a code" path.

**Measured, codes failing:**
- Ty Ngo has a live code (TTC JP2). In the tree he reads "Nhi Tran's parent · not on A Story yet".
- His page reads "not on A Story yet · A code puts Ty in the family tree… · Make a code".
- The same false state also shows for the moment before the codes arrive, while `codes` is still `null`.

**Change:**
1. On the person page, when `mine.codes === null`, don't decide between "not on A Story yet" and "invited":
   - **Loading:** show the plate's state line as "Checking for an invitation…" and hold back the invite block.
   - **On failure:** show one line, `<p className="meta bad" role="alert">Couldn't check for an invitation just now. <button className="fp-retry" onClick={mine.reload}>Try again</button></p>`, and no Make a code.
2. In the tree, pass `coded={mine.codes ? mine.coded : null}` plus a `codesUnknown` flag. With the flag set, a person with no account shows no state line, rather than "not on A Story yet", until the codes load.

### R4-2. UGLY: "Nothing waiting for your review" sits above "What the family asked couldn't be reached"
**Skill:** hallmark 8 states (error); impeccable polish triage #1; BAOS 42. This is the R3-1 pattern, moved from what the family sent to what they asked.

**Where:**
- `ReviewQueue.tsx:154` renders its none branch whenever its own `items` is `[]` and `askedCount` is 0.
- `Asked` (`Waiting.tsx:145–160`) only reports a count on success.

**Measured:** with the asks failing, the section reads "Nothing waiting for your review. What the family asks or sends lands here first." and then the red alert. Separately, `WaitingOnOthers`' failure line (`Waiting.tsx:256–261`) is the only one of the six with no Try again, and it never clears `failed`.

**Change:**
1. Give `Asked` an `onFailed?: (failed: boolean) => void` (or report `onCount(-1)`).
2. In `ReviewQueue`, take the none branch only when both loads succeeded. When the asks failed, render the heading-less section with just the asks' alert.
3. Give `WaitingOnOthers` an `attempt` state and the same `fp-retry` button. Clear `failed` on retry.

### R4-3. UGLY: inside the keeping section, every error line renders as grey small print
**Skill:** hallmark gate 40 and 8 states (an error must read as an error); impeccable craft floor ("errors name the problem and the recovery"); BAOS 1 (one ruling, everywhere).

**Where:** `family-people.css:292`, `.fp-keep :is(.meta, .fp-how) { color: var(--ink-soft) }`, is (0,2,0) and comes after `.meta.bad` at `:280`, also (0,2,0). So it wins. Measured `rgb(107, 98, 91)` on:
- the asks' alert;
- the waiting-on alert;
- the Keepers "couldn't be reached" line and its failed-invite note;
- the take-back error.

Two more alerts were never given the class:
- `Family.tsx:53`, the codes failure, is `fp-quiet`.
- `Storyteller.tsx:148` is `st-empty`.

Only `.review-none.bad` measured red (`rgb(176, 58, 46)`).

**Change:**
1. Move `.meta.bad { color: var(--danger); }` below line 292, or write it as `.fp-keep .meta.bad, .meta.bad`.
2. Add `bad` to the two alerts (`fp-quiet bad`, `st-empty bad`) with `:is(.fp-quiet, .st-empty).bad { color: var(--danger); }`.

### R4-4. POLISH: the storyteller's column says "Nobody has added their side yet" while it is still loading, and again after Try again
**Skill:** hallmark 8 states (loading); impeccable polish triage #2. This is the R3-9 residual.

**Where:** `Storyteller.tsx:40` starts `contributions` at `[]`, and its retry (`:154`) clears `failed`. The empty branch (`:163`) shows at once.

**Measured:** pressing Try again on "The family's lines couldn't be reached just now" immediately shows "Nobody has added their side yet. Sending someone a link takes a minute."

**Change:** use `useState<Contribution[] | null>(null)`, reset it to `null` on retry, and while it is `null` and no memory voices exist, show `<p className="st-empty" aria-busy="true">Looking for the family's lines…</p>`.

### R4-5. UGLY: "Remove the extra" next to "Merge into one" takes a person out of the tree in one tap, with no way back
**Skill:** hallmark interaction ("Undo over confirm", and a confirm for what can't be undone); impeccable polish triage #1 (data loss); BAOS 1 (R3-4's ruling applied everywhere).

**Where:** `Duplicates.tsx:137`. In the merge branch, removing the extra row drops its edges, tags and credits. Merge would have kept them. It fires on one click.

The `remove` branch at `:119` is safe: its copy says "removing the extra loses nothing" and it's true there.

**Change:** run the merge-branch removal through `useHold`: "Took the extra Nhi Tran out of the tree · Undo", held 6 seconds before `removePerson`. Or drop that button from the merge branch, since merging is the right way out there.

### R4-6. POLISH: the held line drops keyboard focus, and its Undo can't undo once the 6 seconds are up
**Skill:** hallmark 8 states and focus ("visible, always"); emil (handle edge cases invisibly); impeccable polish ("logical tab order").

**Where:**
- `useHold.ts:33–46`: after the timer fires, the line keeps showing Undo while `send()` is in flight. Undo then returns the item, and `done()` removes it a moment later.
- `ReviewQueue.tsx:181` and `Waiting.tsx:104`: pressing "Not this one" or "Decline" unmounts the focused button, so focus falls to `<body>`.

**Change:**
1. Keep a `sending` set in `useHold`. Once the timer fires, render the line without the Undo button: "Setting aside Claire's memory…".
2. Focus the Undo button when the line appears (a ref plus `useEffect`).
3. On Undo, return focus to the item's "Not this one".

### R4-7. POLISH: Ty Ngo's page still has a hole under the empty state
**Skill:** taste-skill §6 Fullness and layout §4 ("a hole usually sits beside a short column"); BAOS 9 and 28.

**Where:** `Person.tsx:471–482` and `family-people.css:516–520`.

**Measured at 1920:**
- The bare layout works: the empty state is 879px wide, and "Ty's family" is a 420px column beside it.
- But the main row is only 173px tall (it ends at y 492), while the side plate runs to y 943.
- That leaves blank paper about 1363 × 450 to the right of the plate, on the first screen.

**Change:** make the empty state a composition of the plate's height. Set the dog at about 200px, and below the sentence put the start of a letter (BAOS 28): one ruled leaf with "Dear Ty," and the one action. Or set `.pp-main.bare { min-height: <the plate's height> }` and centre the empty state in it. Don't add another card.

### R4-8. POLISH: two shared sizes still sit beside the page's 13
**Skill:** taste-skill type §2 ("If two sizes look almost the same, make them the same"); DESIGN.md (five sizes).

**Where and measured:**
- `.btn.sm` is 13.5px (astory.css:1560), on "Take back", "Invite", "Change Bao's details", "Send the code again" and the rest.
- `.arc-task` is 14px (archive-reading.css:405), on the person page's "Give eight memories a year · about 2 minutes →".

**Change:**
- `:is(.fp, .pp2) .btn.sm { font-size: var(--fz-small); }`
- `.arc-task { font: 600 var(--fz-small, 14px)/1.2 var(--font-ui); }`. This leaves the Archive itself unchanged.

## Emil's review table

| Before | After | Why |
| --- | --- | --- |
| Held line keeps "Undo" while the reject is in flight | "Setting aside…" with no button once the timer fires | An Undo that doesn't undo breaks trust in the next one |
| "Not this one" unmounts with focus on it | Focus moves to the held line's Undo | Keyboard users lose their place on every press |
| "Remove the extra" fires on one tap | 6s hold with Undo, as for "Not this one" | Undo over confirm, everywhere the family's work can be lost |
| `.arc-task` 14px beside 13px small print | `var(--fz-small, 14px)` | Near-pairs read as a mistake, not a step |

## Skill by skill

- **taste-skill:**
  - Gaps: R4-7 (fullness), R4-8 (sizes).
  - Passes:
    - h1 on one line: 58px at 1920, 40px at 390.
    - Every h2 is one line.
    - No horizontal scroll at 390, 1024, 1366, 1920 or 2560.
    - The one live thing holds: pointing at a face lights its line.
    - Running text is in full ink.
    - No eyebrows, monospace or index numbers.
- **hallmark:**
  - Gaps: R4-1, R4-2 and R4-4 (states), R4-3 (an error must read as one), R4-5 and R4-6 (undo over confirm, focus).
  - Passes:
    - No two-line buttons or links at 390.
    - Every control at 390, 1366 and 1920 is 44px or taller (`.btn.sm` is 44 via astory.css:1757).
    - No inline colours or styles (gate 48).
    - Image tracks are `minmax(0, 1fr)`.
    - Ornaments are `aria-hidden`.
    - Every `vh` and `vw` is divided by `--zoom`.
- **emil-design-eng:**
  - Gaps: R4-6.
  - Passes:
    - Presses are 120ms at scale 0.97 or 0.98.
    - Hovers are gated, including `.dupe` and the menu.
    - Only house curves.
    - The tooltip waits 450ms on hover, 0 on focus and 120ms on the next face.
    - The glint plays on entry only.
    - The reduced-motion lists cover the file's transitions.
- **impeccable:**
  - Gaps: R4-1 and R4-2 (misleading state), R4-5 (data loss), R4-3 and R4-4.
  - Passes:
    - The review queue is now the book's own row (R3-3).
    - Duplicates is one ruled line.
    - Retries show their loading line.
    - A failed take-back names the problem and the recovery.
    - Themed focus rings everywhere.
- **GSAP (react, timeline, performance, scrolltrigger):** no graded gaps.
  - `treeMotion` and `railMotion` run in `gsap.matchMedia()`, with `mm.revert()`, scoped to their root.
  - Every tween is `fromTo` with `clearProps`, on transform and opacity only.
  - No ScrollTrigger is used.
  - On `/family`, after stepping the ticker and scrolling the whole page, nothing is left below opacity 1 except the rail's designed 0.7.
  - See "Not verified" for the intermittent `.pp-more` on the person page.
