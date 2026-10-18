# Skills Steward: Book, Plans, Account, Talk, Start and Wall, round 5

**Verdict: GAPS (0 blockers, 0 ugly, 3 polish).** All three round-4 gaps are closed, and I measured each fix. The four round-4 notes are closed too. The new `useFill` hook on the wall cleans up everything it creates and settles; no loop showed at any of five sizes. The fresh pass found three small things, all about loading and copy:
- N8: the Book's loading skeleton has a shorter cloth than the page that arrives, so the page drops 44px on a laptop and 152px on a phone when it lands. Account's first skeleton row is also far shorter than the bookplate row it stands in for.
- N9: the wall and Start still load on bare cloth with only the mark, no sheet and no hairlines. The wall's link is what a relative opens first.
- N10: one voice, two apostrophes. "Today's question is waiting." on Account and "Today’s question is waiting." on Plans, plus about twenty more straight ones in visible copy.

## How this was checked

- **Skills read:**
  - taste-skill: SKILL.md and critique.md.
  - hallmark: slop-test (all 58 gates), interaction-and-states and responsive.
  - emil-design-eng: SKILL.md (frequency, easing, duration, press, hover, performance, review checklist).
  - impeccable: craft-floor, polish and layout, plus the critique outline.
  - GSAP: gsap-react, gsap-performance, and the cleanup and refresh rules in gsap-scrolltrigger and gsap-timeline.
  - Also BAOS-STANDARD.md (rules 1, 11, 12, 22, 25, 38 and 42) and DESIGN.md. humanizer applied to the copy. find-skills: nothing further applies.
- **Code read:**
  - `pages/{Book,Plans,Account,Talk,Start,Wall,Placeholder}.tsx` in full.
  - `components/book/{BookSpread,Editions,WhereNext,CoverSwatches}.tsx` in full, and BookPage's class use.
  - `styles/pages/book-account.css` in full, including the new §7 skeletons.
  - In astory.css: the §19 Start block (703–708) and `.bk-dot` (1968–1971).
  - Also `lib/zoom.ts`, and Shell's busy, hero and title handling.
- **Rendered, in my own pane tab** (`tab-101`, now closed, viewport reset):
  - The pane was hidden, so no screenshots were taken. Every check is a measurement: `getBoundingClientRect`, computed styles, `__gsap.ticker` stepped, and values divided by the html zoom.
  - **1366×768:** Start step 1, Book, Talk, Plans, Account and `/no-such-page`.
  - **1920×1000:** Account, Talk and Plans.
  - **2560×1300, zoom 1.3:** Start, Book, Talk, Plans and Account.
  - **390×844:** Plans, Talk, Book, Account, Start and the placeholder.
- **Skeletons:** they only show on a cold load, and the account data was already loaded. So on the live page I hid the real content, inserted the skeleton's exact markup in its place (and for the Book, a `h1.hero-title` "The Book" in place of `.bkh`, as the loading Shell renders), measured, and removed it. Nothing was saved.
- **Headless Edge** (Playwright, `channel: msedge`) for the signed-out pages:
  - The wall `/p/RNm1vTr2Gyqu` at 1366, 1920, 2560 (zoom 1.3), 3840 (zoom 2.16) and 390.
  - On the wall, observers and image listeners were counted, attributed to `Wall.tsx` by stack.
  - I resized, opened and folded a leaf, then left the page in-app.
  - `/welcome` at 1366 and 1920.
- **Nothing written:** no Save, Change, Remove, Send, Order, Open it, Choose, story switch or printing-interest press. localStorage was not read or written, and `astory-app-auth` was never touched.
  - Opening /plans and /talk queues `plans_viewed` and `talk_wall_shown`.
  - On the public wall, headless, I pressed "Read the whole thing" and "Fold it away", which store nothing.
  - In the pane I set and at once removed a stray sessionStorage key `x` by mistake. Nothing else was stored.
- **Not verified:**
  - The skeletons in a real cold load, with the Shell's mark drawn over them.
  - Any visual look: no screenshots, so the taste critique passes are by measurement only.
  - The Book's empty state, the editions' loading, fallback and order-error states, and every Account form's error and success states.
  - A wall with family notes, and the gilt "your plan" column.
  - A zoomed-out Edge window.

## Round-4 gaps, checked

| # | Round-4 gap | Now |
|---|---|---|
| N5 | Start 1px taller than 1366×768; head padding off the sheet's edges | **Fixed.** astory.css:705 is `.start-head { padding: 0 var(--s-12); }`, and the dead `.start-body` and `.choice*` rules are gone. **1366×768:** docH 768, clientWidth 1366 (no scrollbar). Lockup x=111 and the sheet's content edge (63 + 48) are the same; "Not now" ends at 1255 (1303 − 48). **2560×1300, zoom 1.3:** docH 1300 = clientHeight; lockup 292.6 = sheet 244.6 + 48. All six `[data-rise]` at opacity 1 with an empty `style`. |
| N6 | Account's paired fields wear an icon on one and not the other | **Fixed.** `Account.tsx:136–139`, `280–281`, `207` and `549` have no leading icons. At 1920 every input's text starts 17px inside its 48px box: First 834.4 and Phone 834.4; Last 1332.4; New password 1174.4 and Once more 1174.4. The mail and person glyphs remain only on the value lines (190, 535), which are not fields. |
| N7 | Book, Talk and Account loaded on an empty page | **Fixed in principle; the Book's frame is wrong (N8).** `Book.tsx:83–92`, `Talk.tsx:280–290` and `Account.tsx:797–817` draw hairlines (`book-account.css:836–857`), all `aria-hidden`, still, with no shimmer. Talk's matches the page that arrives almost exactly (below). |

**Round-4 notes:**
- `BookSpread.tsx:5` now says the dashes "only show where you are".
- `Placeholder.tsx:25` says "isn’t".
- `.bk-dot` no longer sets `cursor: pointer` (astory.css:1968).
- The door's controls hold 44 on screen. At 1366 (scale 0.845), "Open the book" is 52 in layout and 44.0 on screen; at 1920 (scale 1.19) it is 44 in layout and 52.3 on screen. The chapter chips aren't on screen at the front cover, so I didn't measure them.

**N7, skeleton → arrived** (CSS px; x, y, width, height):

| Page, size | Cloth height | First block | Verdict |
|---|---|---|---|
| Talk, 1920 | 182.2 → 182.2 | block 913/227/760×320 → card 911/232/763×320 | holds |
| Account, 1920 | bare → bare | index 61/149 → 61/149; body 389/149 → 389/149; first ruled row y 219 → 561 | edges hold; first row too short (N8) |
| Book, 1366 | 157.4 → 201.8 | block y 202 → spread y 235; rail lines y 202 → rows y 265 | drops 44px (N8) |
| Book, 390 | 145.2 → 297.3 | block y 183 → page y 323 | drops 152px (N8) |

## The wall's `useFill` hook, checked

`Wall.tsx:93–181`:
- **Cleanup is complete.**
  - On the wall, `Wall.tsx` had made 17 ResizeObservers. After an in-app move to /welcome, all 17 were disconnected.
  - Image `load` listeners from `Wall.tsx`: 28 live on the wall, 0 after leaving.
  - The cleanup also removes the fill from the shared set and clears the inline clamp.
  - The `fonts.ready` promise and a pending frame can't be withdrawn, but they only walk the (by then empty) set.
- **It can't run away.** `refill` dedupes on one animation frame and allows at most two follow-up passes, and only when a button appeared or went. Every trigger fires once: the mount, `fonts.ready` on each effect run, an image's load, or a change in the parent's width (not its height). Measured:
  - After settling, zero style writes on any `.wall-words` over 3s, at 1366, 1920, 2560, 3840 and 390.
  - Resized 1920 → 1500 → 1920: the layout came back identical (every leaf's height, button and clamp) and settled again.
  - Opened a leaf, resized, then folded it: the neighbours re-fill to the taller row (clamps 6 → 11 and 17 → 22) and return exactly to the first layout.
- **The fill does what it says.**
  - In a row beside photographs, a word leaf's button foot sits at 655 to 662 of an inner 663.
  - Photo leaves keep six lines.
  - Words that fit within two lines show whole, with no button (hidden 0).
  - No horizontal scroll at any size.

## Gaps

### N8. POLISH: the Book's skeleton stands on a shorter cloth, and Account's first row is a line where a bookplate arrives
**Skill:** hallmark interaction-and-states ("Skeleton screens over spinners for content that has a predictable shape", so the skeleton must be that shape); impeccable polish §5 ("console errors, layout shift"); BAOS 42; N7's own aim, "so the page doesn't jump when it arrives".

**Where:**
- `Book.tsx:81`: `<Shell compact wide tone="teal" title="The Book">` passes no `hero`. The cloth therefore sets a 28px `h1.hero-title` instead of `.bkh`: the 44px title, the line, and the first-edition rule (and on a phone, the 44px storyteller label).
- `book-account.css:837–838`: the rail lines are 18px tall with a 22px gap (a 40px pitch, off the 4px scale, hallmark gate 24). The real rows are 45px.
- `book-account.css:842`: `.bk-skel` pads `--s-6`, where the page pads `--s-3` and then the "Contents" label.
- `Account.tsx:806`: the first skeleton row is one 48px line. The profile row is the 300×372 bookplate beside the form.

**Measured:** see the table above. At 1366 the whole sheet lands 44px lower than its skeleton; at 390, 152px lower.

**Change:**

| Before | After | Why |
|---|---|---|
| `<Shell compact wide tone="teal" title="The Book">` | Pass the same frame as the arrived hero: `hero={<div className="bkh" aria-hidden="true"><div className="bkh-words"><p className="label mobile-only" /><h1 className="bkh-title">The Book<Stop /></h1><p className="bkh-line">&nbsp;</p></div><div className="bkh-edition"><p className="bkh-headline">&nbsp;</p><div className="bkh-rule" /><p className="bkh-end">First edition</p></div></div>}`, with the label slot held at 44px on a phone | The cloth is the biggest thing that moves; it must be its final height before the content comes |
| `.bka-sk-col { gap: 22px }` with `.bka-sk-line { height: 18px }` in `.bk-skel` | In `.bk-skel` only: `gap: 0`, lines `height: 44px` with the 1px rule, starting under a 13px label line | Five lines land where the five contents rows land, on the scale |
| `.bk-skel { padding-top: var(--s-6) }` | `var(--s-3)`, as `.book-page` | The rail and the spread start at the page's own top |
| Account's first `bka-sk-line tall w50` | A bookplate block (`max-width: 300px; aspect-ratio: 1130 / 1400`) beside two lines, in the `acct-sec` grid | The ruled sections start where they will |

Re-measure the skeleton's cloth at 1366 and 390 against 201.8 and 297.3 (±2), and the first ruled row on Account against 561 at 1920.

### N9. POLISH: the wall and Start still load on bare cloth, with the mark and no sheet
**Skill:** BAOS 42 ("Loading draws the mark on the sheet over the page's hairline skeleton"); BAOS 1 (N7 applies to every page); hallmark interaction-and-states, whose bans include "Spinners where a skeleton would show layout".

**Where:**
- `Wall.tsx:258–265`: `Bench` with `.wall-wait` and `LoadingMark` (`book-account.css:789`).
- `Start.tsx:182–187`: `.start[aria-busy]` with `LoadingMark` (`book-account.css:542`).

**Measured:** in headless Edge at 1920 on the dev server, the wall's wait state was on screen for about 1.4s (from 0.94s to 2.33s), mark only, with no sheet in the DOM. Then the cloth hero and the sheet arrive together. This is the first thing a relative sees from a shared link.

**Change:**
- **The wall:** wait on the wall's own frame.
  - On the cloth: the portrait ring as a 136px hairline circle (96px on a phone) and two lines.
  - Then the sheet: the 260px contents column of five ruled lines, and two leaf outlines (three from 1600px, one on a phone) in `.wall-leaves`' own grid, with the mark over them.
- **Start:** render `.start-head` and the `.start-sheet` with three way-row outlines under the mark. The sheet is static, so its frame can be exact.

### N10. POLISH: two apostrophes in one voice
**Skill:** impeccable polish §4 ("Keep terminology, capitalization, punctuation, and factual copy consistent"); humanizer (the house voice); BAOS 1 (round 4's Placeholder nit, applied everywhere).

**Where (copy a person sees):**
- **Talk.tsx:**
  - 116–117 "Today's question" (the card's kicker and its label).
  - 111 `${story.name}'s own words`.
  - 140 "Read what's kept".
  - 66 "We couldn't reach".
- **Account.tsx:**
  - 127 "the book's colophon".
  - 454 `${story.name}'s wall` (rendered: "Nhi's wall").
  - 532 "if I can't" and 736 "If you can't" (an index group).
  - 607, 699, 704 and 707 "…'s book" and "…'s story".
  - 924 "Today's question is waiting.", where `Plans.tsx:177` sets the same line with ’.
  - The errors at 305, 437, 520, 581, 662, 672 and 865.
- **Start.tsx:** 67 "you're in", 78 "you're already in this story", and 212.
- **Editions.tsx:** 95 and 126.
- **Book.tsx:** 99, 118 and 133.
- **aria-labels:** `BookSpread.tsx:367` and `390`, and `BookPage.tsx:85` and `342`.

**Change:** use ’ in every user-facing string in scope. The wall, the placeholder and Plans already do. A check for `[A-Za-z}]'[a-z]` inside JSX text and string literals finds them all; comments can stay as they are.

## Notes (not gaps)

- **One feedback path the hook doesn't guard:**
  - The ResizeObserver reacts to the parent's width, and Edge on Windows has a classic scrollbar (Account measured clientWidth 1905 at 1920).
  - A wall whose height sits within one button (56px) of the window could show and hide the page's scrollbar as buttons come and go. That changes the width by 15px, and each change restarts the two passes.
  - I did not reproduce it, since this wall is many screens long.
  - `html:has(.wall) { scrollbar-gutter: stable; }` closes it.
- **Hook details worth a line each:**
  - `fonts.ready.then(again)` runs on every effect run, so it is what re-fills the neighbours when a leaf opens or folds. Say so in the comment, since it reads like a one-time font hook.
  - Each leaf owns a ResizeObserver on the same `.wall-leaves`, and listens to every image in the chapter (n×m listeners). One observer per `.wall-leaves` would do. The refill's frame dedupe keeps the cost to one pass, so nothing visible comes of it.
  - The refill waits for an animation frame, so in a background tab it runs when the tab is shown. The CSS six-line clamp holds until then, which is right.
- **§19 leftovers:**
  - astory.css:704 `.start { min-height: 100vh }` is an undivided `vh` (BAOS 12). book-account.css:538 overrides it.
  - 706–708 (`.start h1`, `.start .sub` and the phone `.start h1`) are dead.
  - The live `.start-head` rule (705) now sits outside the file that owns Start. Move it into book-account.css §5 and delete §19.
- **Out of scope, for Shell/arrive:**
  - At 2560×1300 Plans measured docH 1301 mid-arrival and 1300 once settled. The rising sheet's transform adds scrollable overflow for a moment, so a page that fits exactly can flash a scrollbar on arrival.
  - Not seen, since the pane was hidden.

## Skill by skill

- **taste-skill:**
  - Gaps: none of its own (N8 and N9 are states).
  - Passes:
    - Every heading is two lines or fewer where I measured. The Book's title at 390 is 67.2px on 33.6px leading, two lines.
    - Start is one screen at 1366×768 and 2560×1300.
    - Plans fits 1920×1000 and 2560×1300 once settled.
    - One live thing per page: the book on Book, today's question on Talk, the three ways on Start.
    - Text edges are shared: Start's lockup sits on the sheet's content edge, and Talk's skeleton and page share 232.7 and 911–913.
    - No text under 12px outside the printed book, on every page at 390, 1366 and 2560.
- **hallmark:**
  - Gaps: N8 (the skeleton is not the page's shape; gate 24, off-scale 18px and 22px) and N9 (a spinner where a skeleton would show layout).
  - Passes:
    - Gate 34: scrollWidth equals clientWidth on every page at 390, 1366, 1920 and 2560, and on the wall at 3840.
    - Gate 49: no two-line buttons. The audit's flags were all icon, kbd or stacked-label rows, each checked at a single 44px line.
    - No target under 44px on any page at any of those sizes.
    - Gate 39: the inputs share one 48px height, and the text starts on one line (N6).
    - Gate 33: every skeleton piece is `aria-hidden`.
    - Gate 10: no `transition: all`.
    - Gate 27: the wall's rise sits behind `@supports` and `prefers-reduced-motion: no-preference`.
- **emil-design-eng:**
  - Passes:
    - No new motion. The skeletons are still (no shimmer on something seen once per cold load).
    - The wall's rise is scroll-linked and linear, as a scrubbed effect should be.
    - The clamp is set in `useLayoutEffect`, before paint, so no reflow flashes.
    - Presses and hovers are unchanged from round 4 and still behind `(hover: hover) and (pointer: fine)`.
  - Accepted as before: the 0.9s leaf turn, the 0.45s cover sweep and the 900ms gilt glint.
- **impeccable:**
  - Gaps: N10 (punctuation consistency). N8 and N9 are the craft floor's loading state and polish §5's layout shift.
  - Passes:
    - N5 and N6 were fixed at the narrowest level.
    - Failure still wears the house style.
    - No banned scaffolds.
    - The §19 leftovers are a cleanup note, not a defect.
- **GSAP (core, react, timeline, performance, scrolltrigger):**
  - Passes:
    - Nothing new on GSAP. Start's rise is in `gsap.matchMedia` with `clearProps` and `mm.revert()`.
    - BookSpread's fade is a ref-targeted `fromTo`, killed and cleared on cleanup, and the turn sits in a `gsap.context` that is reverted.
    - No ScrollTrigger in scope.
    - gsap-performance on `useFill`: reads and writes interleave (the step-down loop forces a layout per step). It is bounded to a few steps per leaf, once per trigger, and measured at zero ongoing writes, so it is acceptable for a measure-after-layout pass.
- **Other:** humanizer drove N10. find-skills: nothing further applies.
