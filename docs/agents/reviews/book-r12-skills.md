# Skills Steward: Book, Plans, Account, Talk, Start and Wall, round 12

**Verdict: GAPS (0 blockers, 1 ugly, 4 polish).**

What 15487fc fixes:
- **N32–N36:** all five are fixed.
- **Bao's round-11 findings:** all seven are fixed.
- **Held → arrived, founder's state:** every page measured holds to 0.0px at 320, 360, 375, 390, 1366, 1600, 1920 and 2560, except Home at 320 (N41).
- **Scrollbar:** with classic scrollbars, `clientWidth` never changed during any of the 64 cold loads.

What the change itself introduced:
- **N37 (ugly):** the app-wide `:where(html) { overflow-y: scroll; scrollbar-gutter: stable }` also reaches the signed-out pages that lock their scroll.
  - On the sign-in book and the door's book layout it reserves a 15px gutter that the cloth doesn't cover, so a flat band runs down the right edge and the one-screen book sits 7.5px off centre.
  - This shows at every desktop size, and on the first page anyone sees.

Four polish items are left:
- **N38:** a white, disabled scrollbar track now shows on every one-screen page.
- **N39:** at 320, a dated person's inline subline wraps, leaving "·" at the end of the line.
- **N40:** Home no longer reads the plan from sign-in, so a paid user's first visit on a device holds the free note.
- **N41:** at 320, Home holds a two-line question where today's is three.

## How this was checked

- **Read:**
  - The diff of 15487fc (Archive, Home, Person, Talk, Wall and book-account.css).
  - `book-r11-baos.md`.
  - The lock rules: astory.css:3176–3181 and signed-out.css:476.
  - `arrive.ts`'s `inside` path.
  - The scrim and sheet code: Shell.tsx 83–209, InviteSheet.tsx:289, MemoryLead.tsx:244 and astory.css:576–581.
- **Skills:** as in round 11:
  - taste-skill critique;
  - hallmark states, gates 34, 49–51 and responsive;
  - emil (jarring changes);
  - impeccable craft-floor ("browser surfaces… custom scrollbars… theme them") and polish §5;
  - gsap-react and gsap-performance.
- **Static:** tsc and eslint (Home, Talk, Wall, Person, Archive) are clean.
- **My own pane tab** (`tab-201`, now closed, viewport reset). The iframes have classic 15px scrollbars.
  - **The poll:** the round-11 harness, rebuilt. It keeps the **first** skeleton sample, and it logs `documentElement.clientWidth` every time it changes.
    - Its sleep is now a MessageChannel loop, because a background tab clamps `setTimeout` to 1s. My first pass at that clamp missed half the skeletons, so I re-ran it.
  - **Storage:** `Storage.prototype` was stubbed in my frames so the app's writes to `astory-archive-wall` and `astory-home-paid` were swallowed. Reads were real or set per test. Both keys still read `public` and `1`.
- **Headless Edge** (Playwright, signed out):
  - Ten routes at 1366×768, 1920×1080, 2560×1440, 1280×1024 and 390×844, with computed `overflow`, `scrollbar-gutter`, `scrollWidth` and `clientWidth`.
  - A second run with real scrollbars (`ignoreDefaultArgs: ['--hide-scrollbars']`), with right-edge shots at 1366.
  - A blank-page test of `scrollbar-gutter` on the root.
  - The wall: 6 cold loads (two with the function held back 3s), with a requestAnimationFrame trace of the sheet.

## Round-11 gaps and Bao's findings, checked

| # | Round 11 | Now |
|---|---|---|
| N32 / Bao 1 | Person held two subline rows on a phone (23px) | **Fixed.** 5aa5 is 192.6 → 192.6 at 320, 360, 375 and 390; 256.3 at 1366; 257.6 at 1600 and 1920; 370.9 at 2560. A two-part subline still fits one line at 360+. **At 320 a dated person wraps: N39.** |
| N33 / Bao 5 | Archive's stats wrapped at 320 / 360–375 (58px) | **Fixed.** The held, Photographs, span, one-year and three-digit variants all measure 416.4 at 320, 360, 375 and 390. Nothing passes the edge. 1366, 1600 and 1920 are 384.1; 2560 is 553. |
| N34 / Bao 4 | The scrollbar appeared or vanished on arrival | **Fixed for the signed-in pages.** `clientWidth` is a single value through every cold load of Home, Archive, Person, Talk, Book, Account, Plans and Write at all eight sizes. **The rule's own cost: N37 and N38.** |
| N35 / Bao 7 | Talk's outline was 12px short from 1600 | **Fixed, and the words are now held exactly.** Held → arrived (top, height): <br>• **Words:** 81/403.8 at 800 and 1001; 81/372.8 at 1031; 81/434.8 at 1101; 81/403.8 at 1366; 81/408 at 1600 and 1920; 116.6/588.9 at 2560. All identical. <br>• **Outline against card:** 305.1/304.9 at 1101, 306/305.9 at 1366, 319.6/319.5 at 1600 and 1920, 460.3/460.6 at 2560. Lefts are equal. <br>• **The hairlines:** `.sk-ruled ::after` computes `visibility: visible` with the repeating rule. |
| N36 | A free user's last question (33px on a phone) | **Fixed.** Held → arrived, "3 of" and last-of-three: 624.1/624.1 and 591.1/591.1 at 390; 386/386 at 1366. Storage that throws holds the free shape with no error logged. **But see N40.** |
| Bao 2 | The wall's lone family note in half a grid | **Fixed.** One note takes the whole measure: 462px at 1366, 359px at 800, 335px at 390. It has hairlines above and below, square corners and no tint. Shot: `r12s/wall-notes-800.png` in my scratchpad. |
| Bao 3 | The wall's sheet vanished and rose a second time | **Fixed.** The trace reads `wait op1.00` → `real op1.00` on all 6 loads, two of them with the function held back 3s. The sheet never dips. |
| Bao 6 | Account and Home overran at 320 | **Fixed.** At 320, `scrollWidth` is 305/305/305 on Account and Home, and the cloth holds (96 → 96). |

**Modal sheets:** the scrim is `position: fixed; inset: 0`, and the sheets never locked scroll. With the track always present, the scrim stops at the track, as it did on any long page before, so there is no change. The lightbox is a top-layer `<dialog>`, and the forced track doesn't affect it.

## Gaps

### N37. UGLY: the app-wide scrollbar rule reserves a 15px gutter on the signed-out pages that lock their scroll, so a flat, untextured band runs down the right edge of the sign-in book and the door's book
**Skill:**
- impeccable polish ("preserve the incumbent visual world"; the change is a page-level side effect outside its scope);
- craft-floor (browser surfaces carry the design);
- taste-skill pass 13 (an element at the edge of the first screen);
- BAOS rule 1 (fix every page).

**Measured** (headless Edge, signed out):
- On these pages `html` computes `overflow: hidden/hidden`, because the lock rule wins as intended, but `scrollbar-gutter: stable` still applies, and stable reserves its gutter under `hidden` too.
- **Pages:** /welcome (the door's book layout), /sign-in, /create-account, /forgot-password, /verify, /join/…, and /c/….
- **`scrollWidth` against the window:** 1351/1366, 1905/1920, 2545/2560 and 1265/1280.
- **With real scrollbars:**
  - `.spread-wrap` ends 15px short of the window at 1366 and 1920.
  - The right-edge shots (`r12s/so-signin-1366.png`, `so-welcome-1366.png`) show the chocolate cloth stopping and a flat dark strip.
- These pages had no gutter before 15487fc. Phones are unaffected: the lock only applies at ≥761.

**Where:** `styles/pages/book-account.css:722`, against the lock rules at `astory.css:3178` and `signed-out.css:476`.

**Change:**

| Before | After | Why |
|---|---|---|
| The lock rules set only `overflow: hidden; height: 100%` | Add `scrollbar-gutter: auto` to `html:has(.auth.ritual)` (astory.css:3178) and `html:has(.door[data-layout="book"])` (signed-out.css:476) | A page that can't scroll has no scrollbar to keep room for |
| (or) | Scope the app-wide rule: `:where(html):not(:has(.auth.ritual, .door[data-layout="book"]))` | The same effect in one place |
| (check) | /welcome and /sign-in at 1366, 1920 and 2560: `scrollWidth` equals the window, and the cloth reaches the edge | |

### N38. POLISH: `overflow-y: scroll` draws a white, disabled classic track on every one-screen page, and the comment's reason for it is mistaken
**Skill:** impeccable craft-floor ("Browser surfaces… custom scrollbars… ship with browser defaults that belong to no design system. Theme them from the palette").

**Measured:**
- With real scrollbars, /p/nobody and the not-found page show a full-height white track with a grey arrow beside the chocolate cloth (`r12s/sb-pnobody-1366.png`).
- The same track now stands on Talk and Plans at 1600+, and on Start, all one-screen pages.
- **The comment says Chromium doesn't honour `scrollbar-gutter` on the root. It does:** on a blank page in Edge, `html { scrollbar-gutter: stable }` alone gives `clientWidth` 785 of 800.

**Where:** `book-account.css:719–722`.

**Change:**

| Before | After | Why |
|---|---|---|
| `:where(html) { overflow-y: scroll; scrollbar-gutter: stable; }` | `:where(html) { scrollbar-gutter: stable; scrollbar-color: <thumb from --ink-soft> <track from the cloth or paper token>; }`, and correct the comment | The gutter alone keeps the width constant, and a themed scrollbar matches the page |

### N39. POLISH: at 320 a dated person's inline subline wraps to a second line and leaves "·" at the end of the first (23px over the held line)
**Skill:** hallmark (the skeleton is the page's shape), taste-skill pass 6 (line breaks), and the reason the old phone rule existed: "so none is left at a line’s end".

**Measured** (arrived frame, 5aa5, cloth / dot):

| Width | One part | Relation + dates | Sample family, three parts (development only) |
|---|---|---|---|
| 320 | 192.6 | **215.9, "·" at line end** | 239.1, two dots at line end |
| 360, 375, 390 | 192.6 | 192.6 | 215.9, "·" at line end |

The held line is 192.6.

**Where:** `family-people.css:587–588` is overridden by `book-account.css` (the new phone rule), so `.sub-dot` is an inline " · " between nowrap parts. The break falls after the dot.

**Change:**

| Before | After | Why |
|---|---|---|
| The break opportunity sits after the dot | Glue each dot to the part it introduces, `<span class="nw"><span class="sub-dot">· </span>part</span>`, with the only space outside it, so a wrap carries "· 1931–2019" to the next line together | No dot is stranded at a line's end |
| The held line is one row at 320 | Optional: remember each person's row count at 320, as the wall line is remembered | Only 320, and only dated people |

### N40. POLISH: Home's held plan now comes only from memory, so a paid user's first visit on a device, or storage that is blocked, holds the free note, and the sheet moves 31px
**Skill:** the same rules as N32.

**Measured:**
- With `astory-home-paid` absent, throwing, or `0`, the founder's paid account holds the free note. Held → arrived: 624.1 → 593.1 at 390 and 386 → 355 at 1366. That is 31px up.
- With `1` it is exact.
- Round 11 held `!isPaid(user?.plan)` and measured exact, so the plan *is* known at sign-in.

**Where:** `pages/Home.tsx` (in the skeleton, `const heldUnlimited = heldPaid()`).

**Change:**

| Before | After | Why |
|---|---|---|
| `const heldUnlimited = heldPaid();` | `const heldUnlimited = user?.plan ? isPaid(user.plan) : heldPaid();` | Sign-in knows the plan. Memory is only the fallback. |

### N41. POLISH: at 320 Home holds a two-line question, but today's sets in three, so the sheet moves 32px down
**Skill:** the same rules as N32. 320 is a hallmark must-render width.

**Measured:**
- Cold load at 320×640: cloth 630.8 → 662.6.
- Held "Where did you go as a child to be alone?" is 63px. Today's "Where do you go when you need to be quiet?" is 95px (three lines).
- 360 and up hold exactly (593.1, 355, 363.8 and 523.8).

**Where:** `pages/Home.tsx`, the held `.story-q`.

**Change:**

| Before | After | Why |
|---|---|---|
| A fixed sample question | On arrival, store today's question text with `dayKey()` (try/catch). The skeleton holds it when the day matches, and the sample otherwise. | The same day's cold load then holds the exact words. Round 10 noted the question's length is otherwise unknowable. |

## Notes (not gaps)

- **Out of scope, a Person and Archive fault at 320:** on a person page, "Give eight memories a year · about 2 minutes →" (`.arc-task`, ArchiveGroups.tsx:42, `white-space: nowrap` at archive-reading.css:449) ends at 345 against 305. The arrow and the last words are cut off by `overflow-x: clip`. This is for the Person or Archive builder.
- **Talk's words for someone else's story** ("with Margaret…", "while Margaret talks", "in Margaret’s own words") are 25–28px taller at 320–360 than the held "you" words. On a phone the words sit under the card, so nothing above them moves.
- **Talk's phone words column** starts 8px lower in the skeleton (351 against 342.9). This is the round-9 note, still standing.
- **Person at 1600+:** `.pp-notes` is inserted in view at full opacity after the arrival (it loads late). That is page content, outside the loading frame.
- **Commits that landed while I measured:** 4881e2f, 679487e and 2fc7810 (Bond v2, signed-out round 8). None touches the scrollbar rule. The working tree served them.

## Skill by skill

- **taste-skill:**
  - Gaps: N37 (the first screen's edge) and N41.
  - Passes:
    - Every held hero is exact at 360+.
    - The wall's note reads as a callout, not a bubble.
- **hallmark:**
  - Gaps: N39, N40 and N41 (the skeleton isn't the page's shape).
  - Passes:
    - No horizontal scroll on the eight in-scope pages at 320.
    - The Archive's figures hold at every width.
    - No two-line buttons.
- **emil-design-eng:**
  - No gap.
  - Passes:
    - No sideways jog: `clientWidth` is constant on every load.
    - The wall rises once.
- **impeccable:**
  - Gaps: N37 (a side effect outside the change's scope) and N38 (an unthemed browser surface).
  - Passes:
    - Storage is wrapped, with safe defaults.
    - tsc and eslint are clean.
- **GSAP:**
  - No gap.
  - Passes:
    - The wall's `inside` arrival keeps one sheet.
    - Layout effects, `mm.revert()`, 0 dips and 0 active tweens throughout.

## Housekeeping

- **Pane:** I worked only in `tab-201`. I removed every iframe and deleted my helpers. I reset the viewport to desktop and closed the tab.
- **Nothing written:**
  - I didn't sign out, touch `astory-app-auth`, or press any control.
  - The app's own writes to `astory-archive-wall` and `astory-home-paid` were swallowed in my frames. Both keys are unchanged (`public`, `1`).
  - Loading /talk and /plans queued their usual view events.
- **Playwright:** headless, signed out, fresh contexts.
- **Scripts and shots:** in my scratchpad, `r12s/` (`so.mjs`, `so2.mjs`, `wall.mjs` and the right-edge and notes shots). Nothing was saved to `docs/agents/reviews/shots/`.
