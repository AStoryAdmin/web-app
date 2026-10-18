# Skills Steward: writer, round 9

**Verdict: GAPS (0 blockers, 0 ugly, 1 polish).** All five carried items are fixed: my A1 and A2 from round 8, and the BAOS reviewer's three findings. The layout holds at every size I measured, phones and tablet included. One small thing is left, and it's one line:
- **P1 (polish).** On a question about Ty, the last row, "Or something else, in your own words", links to a plain `/write` and drops Ty. The person came from Ty's page to write about Ty. One click later the page has forgotten him: it says "In your own words", not "In your own words · with Ty", and a Keep wouldn't attach him.

Once that link carries `with=`, I'd call the writer APPLIED. Nothing else I found stands in the way.

**Scope:**
- `src/pages/Write.tsx` (01:12): the deck is now decided in the TSX; analytics send `draftQid`.
- `src/lib/aboutPrompt.ts` and `aboutPrompt.test.ts` (03:32): no hint; the question goes through `smarten`.
- `src/styles/pages/writer.css` (01:12): the `max-height: 900px` "4th row" rule is deleted.
- `src/pages/Person.tsx` (01:11), for BAOS finding 2.
- `src/styles/astory.css` also changed at 03:32. That's outside this brief, so I didn't review it.

**Skills loaded:**
- taste-skill: SKILL.md (house rules and laws), plus the critique, layout and copy references.
- hallmark: SKILL.md, the slop test (58 gates and the six axes), interaction-and-states, responsive.
- emil-design-eng: the frequency, easing, duration, press and hover rules, and the review format.
- impeccable: SKILL.md, craft-floor, polish, layout and critique.
- GSAP: react, timeline, performance and scrolltrigger.
- humanizer: checked, because the round touches copy.
- I read `docs/BAOS-STANDARD.md` and `DESIGN.md` at the start.

**How it was checked:**
- **The code:**
  - I read the changed parts of every file.
  - `npx vitest run src/lib/aboutPrompt.test.ts src/components/person/personRail.test.ts`: 15 of 15 pass.
  - `npx tsc --noEmit`: clean.
  - `writer.css` has balanced braces, with no negative depth.
- **The browser:** my own tab (tab-115, now closed, viewport reset).
  - After every resize I reloaded the page, waited for it to load, and stepped `__gsap.ticker` with real delays until the positions stopped changing. One early 375px reading and one early `?q=` reading came mid-arrival, so I took both again.
  - **Pages:** `/write?with=<Ty>&about=roots-helped-out`, `…&about=roots-father-hands`, `/write?q=voice-advice-phrase`, `/write`, `/write?with=<Ty>`, and `/write?edit=59632e67…`.
  - **Sizes:** 1366×768, 1366×641, 1920×1000, 800×1024, 390×844, 375×812 and 320×700.

## Carried items, re-checked

| # | Item | Now |
|---|---|---|
| Skills A1 | The storyteller's hint under a question about someone | **Fixed.** `aboutPrompt.ts:24` sets `hint: undefined`, and a new test covers it for `roots-father-hands` and `roots-helped-out`. On the page, `.w-sub` is absent at every size: under "What was Ty made to help with too young?" there is nothing. The sensitive-question note (`noteFor`, `Write.tsx:918`) still applies to an about question. It says "Leave it for another day if today isn't the day", which speaks to the writer's choice, not their life, so it reads right. `promptsAbout` already filters sensitive questions off the person's page. |
| Skills A2 | "Or another of today's questions" over a question that isn't one of today's | **Fixed.** `Write.tsx:960` tests `question && !aboutQ`. On an about page the list reads "Or one of today's questions" at every size. `?q=` still reads "Or another of today's questions". |
| BAOS 1 | The hint in the bank speaks to the storyteller | **Fixed.** This is the same change as A1. |
| BAOS 2 | Ty's page links dropped `&about=` | **Fixed.** `Person.tsx:206` `writeTo(about?)` adds `&about=<id>`, and `:536` uses `writeTo(q.id)` for each question. |
| BAOS 3 | The about page's list was the wrong list, with "own words" hidden by a height query | **Fixed.** `Write.tsx:742–746` decides the list in the TSX. A blank page offers three of today's. `?q=`, an about page and an edit page each offer two, plus "own words". So every list is three rows. The 900px `:has(li:nth-child(4))` rule is gone from `writer.css`. At 1366×768 "own words" now shows on the about page and on the edit page, which the old rule hid. The ≤740px rule (`writer.css:205`), which drops "own words" on every page of a short laptop, stays. BAOS accepted it, and so do I. |
| BAOS aside | `question_answered` counted an about-question as the storyteller's own | **Fixed.** Both `question_shown` (`:614`) and `question_answered` (`:834`) send `draftQid`, for example `roots-father-hands@36cfd520…`. |

## Fresh pass: what holds

- **The first screen on a laptop.**

  | Page | 1366×768: book | 1366×768: bar | 1366×641: book | 1366×641: bar |
  |---|---|---|---|---|
  | About | 166–649.4 | 663.4–753.7 | 158–533.4 | 537.4–627.7 |
  | `?q=` | 166–649.4 | 663.4–753.7 | not re-run | not re-run |
  | `/write` | 166–656.1 | 670.1–760.5 | not re-run | not re-run |

  - The about page now sits exactly where `?q=` does: 14.3px clear at 768 and 13.3px at 641. The ribbon ends 2px above the bar.
  - The running head to the kicker is 18px at 768 (228.4→246.4) and 12px at 641, against 8px and 6px from the kicker to the question.
  - Without the sub line, the question sits 22px above the list heading (351.1→373.1), so the head still reads as one group.
- **Large window, 1920×1000.**
  - The about question sets at 44px on two lines, and the list has three rows with "own words".
  - The rail's bar is at 512.5–607.9.
  - Nothing is under 12px, no control is under 44px, and there's no horizontal scroll (1905 = 1905).
- **Tablet, 800×1024.**
  - The pill nav is at 165–491.
  - The about question sets at 32px on two lines (167.7–238.1).
  - The band from the question to the book (238→350) is set by Bond (258–363), not by the missing sub, so it reads as his place, not a hole.
  - The list (1192–1396) and the help (1194–1488) sit side by side.
  - scrollWidth 785 = clientWidth 785.
- **Phones.**

  | Size | Question | Bond clears the question by | Book starts at | scrollWidth |
  |---|---|---|---|---|
  | 390×844 | 28.86px, 2 lines (132.7–196.1) | 10.8px | 282 | 390 |
  | 375×812 | 27.75px, 2 lines (133.6–194.7) | — | — | 375 |
  | 320×700 | 26px, 2 lines (139.9–197.0) | 10.9px | 283 | 320 |

  - At every phone size there's no text under 12px and no control under 44px.
  - The only element past an edge is the 22px cursor-leaf SVG parked at the origin, as in round 8.
- **Copy.** "A question about Ty", "Or one of today's questions" and the bare question are plain, with no humanizer tells. The bank's straight apostrophes now arrive curly ("Ty's").

## Gap

### P1. POLISH: "in your own words" on an about page forgets the person
**Skill:** impeccable polish §4, Flow ("arrival, transition, empty and recovery paths connect instead of behaving as isolated screens"); hallmark axis C (execution).

**Where:** `Write.tsx:972`, `<Link className="w-q own" to="/write">`.

On `/write?with=<Ty>&about=…` the row links to `/write`, and the `with` is lost:
- The next page reads "In your own words" and "What would you like to keep today?".
- `/write?with=<Ty>` would read "In your own words · with Ty" (checked live).
- A Keep from there wouldn't set `personIds: [Ty]` (`:819`).

So someone who came to write about Ty, and wants to write it their own way, has to go back to Ty's page.

**Change:** carry the person through:
```tsx
<Link className="w-q own" to={withId ? `/write?with=${encodeURIComponent(withId)}` : "/write"}>
```
The links for today's questions (`/write?q=…`) can stay as they are. Those are the storyteller's own questions, and the heading says so.

## Before and after (emil's review format)

| Before | After | Why |
| --- | --- | --- |
| `to="/write"` on the "own words" row | `to={withId ? `/write?with=…` : "/write"}` | The page about Ty shouldn't drop Ty when the writer chooses their own words |

## Skill by skill

- **taste-skill:**
  - No gaps.
  - Every headline is 2 lines or fewer at every size.
  - One live thing: Bond.
  - No horizontal scroll from 320 to 1920.
  - The left page's spacing steps read as groups: 18/8 on a laptop, 12/6 on a short window.
  - Removing the sub left no hole. On phones and the tablet the band is Bond's.
- **hallmark:**
  - Gap: P1 (axis C).
  - Passes:
    - Gate 34: no horizontal scroll at 320, 375, 390, 800, 1366 or 1920.
    - Gate 49: no two-line links.
    - Gate 10: no `transition: all`.
    - The 44px floor holds everywhere.
    - The list's contents no longer depend on the window between 741 and 900px.
- **emil-design-eng:**
  - No gaps. No motion changed this round.
  - Passes:
    - The seal press is still 0.28s `OUT` inside a `gsap.context`.
    - No ease-in in `writer.css`.
- **impeccable:**
  - Gap: P1 (flow).
  - Passes:
    - The craft floor's Copy check passes now: the line under the question no longer contradicts it.
    - The deck rule is stated once, in the code, with a comment that says what ships.
    - Tests and types are clean.
- **GSAP:**
  - No gaps.
  - Passes:
    - The arrival timeline is unchanged: `gsap.matchMedia()` at `:714`, reverted at `:728`.
    - Every page settled at its CSS positions after arrival.
    - No ScrollTrigger.
- **humanizer:**
  - No gaps.

## Not verified

- **Visuals.** Scaled screenshots only: about at 1366×768, 1920×1000, 800×1024 and 390×844. Everything else is measured.
- **Edge at 2560 and 3840.** Not run. This round's changes are copy and list membership, not sizes.
- **Keep, the seal, help.** Not pressed, by instruction. So the analytics payloads and `personIds` were read in code, not seen firing.
- **`with=<storyteller>`.** Bao's own record would still read "A question about Bao". Not checked this round.
- **astory.css (03:32).** Not reviewed; it's outside this brief.

## Housekeeping

- **Typing.** I typed nothing and created no drafts.
- **Drafts.** The only draft is `beeedb62…`, 370 characters before and after; I never opened it.
- **What I didn't touch.** I didn't press Keep, the seal or any help button. I didn't sign out. I only checked that `astory-app-auth` was present.
- **My tab.** I reset its viewport to desktop and closed it (tab-115).

**Final verdict: APPLIED.** I checked P1 live after commit 8c95df1 (`Write.tsx:972`), in tab-119 at 1366×768:
- **The route.** Ty's page → "Where was Ty born?" (`…&about=open-born-where`) → "Or something else, in your own words" (`/write?with=36cfd520…`).
- **Where it lands.** "In your own words · with Ty" / "What would you like to keep today?".
- **One click didn't take.** My first click on the row came before the page had finished arriving, and nothing happened. The second worked.
- **Housekeeping.** I typed nothing and pressed nothing. The `beeedb62` draft is unchanged at 370 characters. I reset the tab's viewport and closed it.
