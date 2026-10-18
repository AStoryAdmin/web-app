# Skills Steward: writer, round 8

**Verdict: GAPS (0 blockers, 1 ugly, 1 polish).** All five carried items are fixed: N1 and N2 from my round 7, and the BAOS reviewer's three findings. The layout work is done; this round's CSS passes at every size I measured. Both gaps are in the new "question about someone" page (`?about=`), and both are copy:
- **A1 (ugly).** The line under the question is the hint written for the storyteller's own question, so it often doesn't fit the new wording. "What was Ty made to help with too young?" sits over "The job you were given too young."
- **A2 (polish).** The list under an about-question is headed "Or another of today's questions", but the question on the page isn't one of today's.

Each is a one-line fix. Once they're in, I'd call this round APPLIED.

**Scope:**
- `src/pages/Write.tsx` (00:53): the `about` param and the per-person draft key.
- `src/lib/aboutPrompt.ts` and `aboutPrompt.test.ts` (00:52–00:53).
- `src/styles/pages/writer.css` (00:55): the short-window blocks moved after the base rules.
- §63 of `src/styles/astory.css` (00:50), for BAOS finding 1.

**Skills loaded:**
- taste-skill: SKILL.md (house rules and laws) and the critique passes.
- hallmark: the slop test (58 gates and the six axes), interaction-and-states, responsive.
- emil-design-eng: the frequency, easing, duration, press and hover rules, and the review format.
- impeccable: craft-floor and polish.
- GSAP: react, timeline, performance and scrolltrigger.
- humanizer: checked, because this round adds copy.

**How it was checked:**
- **The code:** I read every changed file.
  - `npx vitest run src/lib/aboutPrompt.test.ts`: 3 of 3 pass.
  - `npx tsc --noEmit`: clean.
  - Both stylesheets have balanced braces, with no negative depth.
- **The browser:** my own tab (tab-105, now closed, viewport reset).
  - Before every measurement I reloaded and stepped `__gsap.ticker` ×600 with a real delay.
  - **Pages:** `/write?q=faith-pray-now` and `/write?with=<person>&about=<id>` (Bao, Ty and Nhi, with `roots-father-hands` and `roots-helped-out`), plus `/write?about=…` with no person.
  - **Sizes:** 1366×768, 1366×700, 1366×641, 768×1024, 390×844 and 1920×1000 (rail).

## Carried items, re-checked

| # | Item | Now |
|---|---|---|
| Skills N1 | The keep bar touched the window's foot at 1366×768 | **Fixed.** `writer.css:189` is 8px. On `?q=` the bar is 669.5–759.2, which leaves 8.8px. On an about page it is 670.1–760.5, leaving 7.5px. The step from the running head to the kicker is 18px (228.4→246.4), against 8px from the kicker to the question. The ribbon ends at 667.5, clear of the bar. |
| Skills N2 | Four short-window rules lost to later rules | **Fixed.** The `max-height: 740px` block (`:203`) now comes after the 900px block (`:187`) and the base rules. At 1366×700 these compute as written: gap 4px, `.w-qkick` margin-bottom 6px, `.w-kick` 2px, `.w-qhead` 0. The running head to the kicker is 12px (206.4→218.4) and the kicker to the question is 6px, so the step is 2×. The empty `.spread .leaf-left-in` selector and the repeated 14px are gone. Both pages' padding-bottom is 16px, and the folio ends 16px above the page's foot. |
| BAOS 1 | No main navigation between 761 and 900px | **Fixed.** `astory.css:3778–3783` (§63) keeps the pill nav at 761–900px, and the storyteller button drops its words. At 768×1024: the pill is `display: flex` at 158–484; Home, Archive, Family and Book are each 44px tall on one line; the right group starts at 525. No overlap, and scrollWidth is 753 (the scrollbar). |
| BAOS 2 | The seal bar fell off the first screen at 1366×641 | **Fixed.** On an about page, which has the longest list (4 rows), the book is 176–514.3 and the bar 542.3–632.6, which leaves 8.4px. At 1366×700 on `?q=` the bar is 537.4–627.7. |
| BAOS 3 | "Not now" was 43.5px | **Fixed.** `writer.css:255` uses `min-height: 44px` on an inline-flex with `margin: -12.25px 0`. It measures 44px, and the line doesn't grow. |

## The new about-page: what holds

- **Per-person drafts.** The key is `astory-draft-<story>-q-<promptId>@<personId>` (`Write.tsx:522–524`). I typed one line on Ty's page and it saved under `…-q-roots-helped-out@36cfd520…`. Nhi's page for the same question opened empty. Going back to Ty's page restored the line. When I cleared it, the app removed the key itself. The legacy story-level fallback in `questionDraft` can't collide, because no old draft has an `@` in its questionId.
- **The `Writer` key** includes `about` and `with` (`:488`), so moving between people remounts the page with fresh state.
- **Fallbacks.**
  - With no `with`, the page reads "A question about this person" and the question says "this person".
  - An unknown id, or a question the bank only asks of the storyteller, gives null and the usual page (covered by the test).
  - The family arrives with the account (`AccountProvider.tsx:41–43`), so the name never flashes from "this person" to the real name.
- **Fit.** The fourth row ("in your own words") is hidden at ≤900px tall (`writer.css:195`), so the bar still fits. At 1920 the rail shows all four rows. At 390 the question is 2 lines at 28.9px, Bond sits below the sub line (from 234), and there's no horizontal scroll.
- **The kicker** has no duplicated "· with Ty" suffix on an about page (`Write.tsx:917–920`).

## Gaps

### A1. UGLY: the hint under an about-question is the storyteller's hint, and often reads wrong
**Skill:** impeccable craft-floor, Copy ("the product's own language"), and polish §4, Content ("keep factual copy consistent"); taste-skill copy; humanizer (a line that contradicts the line above it).

**Where:**
- `src/lib/aboutPrompt.ts:20` passes `hint: found.hint` through.
- `Write.tsx:915` and `:930` print that hint as the `.w-sub` line under the question.

The bank's `about` wording is a different question, but `getAboutPrompts` reuses the hint written for the storyteller's question. Seen on the page:
- At 1366×768: "What kind of work did Bao's father do?" over "Scars, dirt, missing fingers. What they smelled like." That hint belongs to the hands question.
- At 390 and 1920: "What was Ty made to help with too young?" over "The job you were given too young." Here "you" is the writer, not Ty.
- 80 of the bank's 260 about-hints say "you" or "your". Some still fit ("Names and ages, as best you remember"). Many don't, for example "Height, hands, voice, walk, the look she gave you" and "The arrangement, and whether you minded".

The line is the second thing on the page. Under 740px tall it's hidden, but it shows on every taller laptop and on phones.

**Change:** don't carry the storyteller's hint onto the about-question. In `aboutPrompt.ts:20`, set `hint: undefined`, and add `expect(p?.hint).toBeUndefined()` to the first test. The page then shows the kicker and the question with no sub line, as an editing page does. If a hint is wanted later, it needs its own `aboutHint` in the bank, written for the relative. That's a content task, not this round's.

### A2. POLISH: "Or another of today's questions" under a question that isn't one of today's
**Skill:** impeccable polish §4, Content (terminology); taste-skill copy; hallmark axis C (execution).

**Where:** `Write.tsx:957` picks the heading by `question ? …`. On an about page `question` is set, so the list reads "Or another of today's questions". But the deck leaves the about-question out (`:742`), and it was never one of today's.

**Change:** test `question && !aboutQ` so that an about page falls through to "Or one of today's questions":
```tsx
<h2 className="w-kick">{question && !aboutQ ? "Or another of today’s questions" : own ? "Or one of today’s questions" : `Or one of today’s questions for ${story.name}`}</h2>
```

## Before and after (emil's review format)

| Before | After | Why |
| --- | --- | --- |
| `hint: found.hint` in `aboutPrompt` | `hint: undefined` | The storyteller's hint contradicts the relative's question ("…made to help with too young?" / "The job you were given too young.") |
| `question ? "Or another of today’s questions"` | `question && !aboutQ ? …` | A question about someone isn't one of today's, so "another" is wrong |

## Skill by skill

- **taste-skill:**
  - Gaps: A1 and A2 (copy).
  - Passes:
    - Every headline is 2 lines or fewer, the about-question included (2 lines at 390).
    - One live thing: Bond.
    - No horizontal scroll at any size I measured.
    - The left page's spacing steps now read as groups: 18 against 8 on a laptop, 12 against 6 on a short window.
- **hallmark:**
  - Gaps: A2 (axis C).
  - Passes:
    - Gate 34: no horizontal scroll.
    - Gate 49: the pill links are one line at 768.
    - Gate 56: the sticky block is offset by `--top-h`.
    - Gate 10: no `transition: all`.
    - The 44px floor now holds for "Not now".
    - The navigation hole at 761–900 is closed.
- **emil-design-eng:**
  - No gaps. No motion changed this round.
  - Passes:
    - Press is 0.97 in 120ms.
    - No ease-in in `writer.css`.
    - No animation on keyboard actions.
- **impeccable:**
  - Gaps: A1 (copy), A2 (terminology).
  - Passes:
    - The short-window CSS now says what ships, so round 7's cleanup item is done.
    - Drafts save, restore and clear per person.
    - No console errors.
    - Types and tests are clean.
- **GSAP:**
  - No gaps.
  - Passes:
    - The arrival timeline is unchanged: inside `gsap.matchMedia()`, reverted on unmount.
    - After it ran, the pages measured at their CSS positions.
    - No ScrollTrigger.
- **humanizer:**
  - A1 is the only copy problem.
  - The new strings ("A question about Ty", "this person") are plain.

## Not verified

- **Visuals.** Only scaled screenshots in the pane (1366×768, plus one blank frame during a slow load). Everything else is measured.
- **Edge at 2560 and 3840.** Not run this round. The changed rules are height queries, which don't depend on zoom.
- **Reduced motion.** Read in the CSS, not emulated.
- **Keep.** Not pressed, by instruction, so `personIds: [withId]` on an about-page keep (`Write.tsx:819`) was read, not run.
- **Entry points.** No page links to `?about=` yet. When the person page does, it should leave out the storyteller's own record: `with=<Bao>` on Bao's own book reads "A question about Bao".

## Housekeeping

- **My test draft.** I typed "Steward test line." on Ty's about page to test the per-person key, then cleared it in the page. The app removed its own key, `…-q-roots-helped-out@36cfd520…`.
- **Other drafts.** The only draft left is `beeedb62…`, 370 characters before and after; I never opened it.
- **What I didn't touch.** I didn't press Keep, the seal or any help button. I didn't sign out. I only checked that `astory-app-auth` was present.
- **My tab.** I reset its viewport to desktop and closed it (tab-105).
