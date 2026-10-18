# Skills Steward: Book, Plans, Account, Talk, Start and Wall, round 7

**Verdict: GAPS (0 blockers, 0 ugly, 7 polish).** All four round-6 Bao findings are fixed. N11, N13 and the wall half of N12 are fixed too. The skeletons now land within 2px of the arrived page at every size I measured, and the running head stands over them.

What is left is mostly about the loading moment, plus two typesetting leftovers:
- N15: the heart lands off-screen or on a hairline on the Shell pages and on Start.
- N16: the new status line is silent on Start.
- N17: the running-head change also brought the folio and "Press ? for shortcuts" onto the skeleton, inside the first screen. They leave when the page arrives.
- N18: on a cold load of the Book, the cloth's words appear without their rise.
- N19: the printed book still sets the family's notes, the asked question and the dedication raw. The Print at home PDF sets everything raw.
- N20: Talk's phone skeleton card is 55px too tall.
- N21: on the wall, memory titles run to three lines between 761 and 850px, and again near 1180.

None of these is a fault in the arrived pages at 1366, 1920 or 2560. This is not the passing round, but it is close, and every fix is small.

## How this was checked

- **Skills read:**
  - taste-skill: SKILL.md (house rules, laws) and critique.md.
  - hallmark: slop-test (58 gates), interaction-and-states, responsive, and the minor anti-patterns.
  - emil-design-eng: SKILL.md.
  - impeccable: craft-floor, polish and layout.
  - GSAP: gsap-react, gsap-performance, gsap-timeline, and the cleanup and refresh rules in gsap-scrolltrigger.
  - Also BAOS-STANDARD.md and DESIGN.md. Humanizer applied to the copy. find-skills: nothing further applies.
- **Code read:**
  - `pages/{Book,Plans,Account,Talk,Start,Wall,Placeholder}.tsx`. Account in its render, skeleton and error paths; the rest in full.
  - `components/Shell.tsx`, `components/delight/LoadingMark.tsx`, `lib/arrive.ts` and `lib/typography.ts`.
  - `components/book/bookPages.ts` (the smarten pass), `BookPage.tsx` (what it prints), `printBook.ts` and `askedQuestions.ts`.
  - `components/ui.tsx` `Problem`, and the error strings in `data/stories.ts`, `data/family.ts` and `state/AccountProvider.tsx`.
  - book-account.css §7 (skeletons) and the line-41 `:where()` rule. In astory.css, the `.loading-mark`, `.folio-sheet` and `.keys-hint` rules.
- **My own pane tab** (`tab-131`, now closed, viewport reset). The pane was hidden for the whole run.
  - **Cold loads, measured.** I loaded each page into a same-origin iframe at the test size and polled it every 4ms while the skeleton was up. Then I measured the arrived page after stepping that frame's GSAP ticker. Positions are relative to the sheet's top, or the wall's top, because the sheet's rise is still running when the content arrives. For the heart I also worked out where it sits once the sheet has settled, and which skeleton rules cross its box.
  - **Audit sweep, every page.** I ran it on Book, Plans, Talk, Account, Start (`?another=1`, and `?another=1&join=1` at 1366), the wall, the not-shared wall and `/no-such-page`, at 1366×768, 1920×1000, 2560×1300 (zoom 1.3), 800×1024 and 390×844. It checks:
    - horizontal scroll;
    - headings over two lines;
    - controls under 44px;
    - two-line button labels (text-node line boxes);
    - text under 12px;
    - straight quotes in rendered text;
    - every element the line-41 rule matches, against inherited `nowrap` and inherited `balance`.
  - **One-word last lines.** I swept for them at 800, 390, 1366 and 2560, after proving the detector on a planted case.
  - **The Book's controls row**, measured at 770, 868, 900, 901, 960, 1000 and 1100.
  - **Wall leaf titles**, measured at 13 widths from 390 to 1366.
- **Headless Edge** (Playwright 1.63, `channel: msedge`, fresh signed-out contexts): the front door's book controls at 770, 800, 900, 1000, 1100, 1180 and 1366.
- **Nothing written:**
  - No Save, Change, Remove, Send, Order, Open it, Choose, story switch or printing-interest press. No sign-out. `astory-app-auth` was never read or touched.
  - Loading /plans and /talk again queued more `plans_viewed` and `talk_wall_shown` events.
  - On the wall I opened three leaves with "Read the whole thing" and folded them again. That is local state only.
  - My helper scripts lived in that tab's sessionStorage (`__r7*`). I removed them before closing the tab.
- **Not verified:**
  - Real frames on the signed-in pages, because the pane was hidden. N18 is proven by the tween count at the moment of arrival (none on the hero's words), not by watching it.
  - A screen reader (N16).
  - The printed pages with family notes, an asked question or a dedication on screen. N19 is from the code.
  - A zoomed-out Edge window.
- **Files changed mid-review:** `Shell.tsx` (04:35) and `astory.css` (04:36) changed while I was measuring. I re-read the lines this report cites afterwards, and they are as quoted.

## Round-6 skills gaps, checked

| # | Round 6 | Now |
|---|---|---|
| N11 | Shell pages dropped 39px on arrival; the Book's phone rail sat 124px high | **Fixed.** The running head stands over every skeleton (Shell.tsx:273, book name `visibility: hidden` while busy). `.bk-skel-under` holds the controls row's place below 1100px. Measured below. |
| N12 | People's words not typeset; the load-error line doubled | **Fixed on the wall, in the error line and in the data strings. Not finished in the printed book (N19).** On the wall, the title, paragraphs, intro, alt text and family notes all go through `smarten` (Wall.tsx:36, 217, 221, 384, 477), and the audit finds no straight quote on the wall at any size. `Problem` now prints `loadError` alone and smartens it (ui.tsx:186). The `data/*` messages read "We couldn’t load the account: …". bookPages.ts smartens memory titles and paragraphs (363, 370, 377). |
| N13 | The wall's mark sat on a hairline; the phone chapter head was too tall | **Fixed on the wall** (the mark sits inside the first leaf outline; no rule crosses it at 1366, 1920, 2560 or 390). The phone head is 32px (book-account.css:931). The same fault remains on the Shell pages and Start (N15). |
| N14 | No loading state spoke to a screen reader | **Fixed on Book, Talk and Account** (LoadingMark.tsx:12, outside any `aria-busy` or `aria-hidden`). **Not on Start** (N16). |

**Skeleton → arrived** (CSS px, from the sheet's top; the wall from its top):

| Page, size | Running head | First blocks | Verdict |
|---|---|---|---|
| Book 1366 | 10/39 → 10/39 | contents label 61 → 61; rows 91/136/181/226/271 → 91.2/135.9/180.5/225.2/269.9; spread block 391.7, 61, 883×441.5 → stage, the same | holds |
| Book 390 | 4/38 → 4/38 | block 54, 330.7² → the same; controls row 388.7 ×98 → the same; label 518.7 → 518.7; 5th row 728.7 → 726.9 | holds |
| Book 800 | 10/39 → 10/39 | block top 61 and height 640 → the same; row 713 ×116 → the same; label 861 → 861 | holds |
| Book 2560 (zoom 1.3) | 13/50.7 → 13/50.7 | label 79.3 → 79.3; rows 58.5 → 57.9 pitch; block 889.2 tall → 889.2 | holds (block 133px narrower, as round 6 noted) |
| Talk 1366 | 10/39 → 10/39 | words 81 → 81; block 699.2, 81, 575.5×320 → card 697.9, 78.5, 578.1×305.9 | holds within 2.5 |
| Talk 390 | 4/38 → 4/38 | card 66 → 66, but 300 → 244.9 tall; words 406 → 342.9 | **63px (N20)** |
| Account 1920 / 1366 | 10/39 → 10/39 | index 73 → 73; bookplate 389.4, 81, 300×371.7 → the same (285×353.1 at 1366, the same) | holds |
| Account 390 | 4/38 → 4/38 | "Go to" 58 → 58; bookplate 130 → 130 | holds |
| Wall 1366 / 1920 / 2560 / 390 | – | cloth 302 → 301.7, 392.6 → 392.2 and 406 → 406.2; ring, contents and main as round 6; chapter head to first leaf: 72 → 72.2 at 390 | holds |
| Start 1366 / 390 | – | sheet, title and first way the same; at 390 "My own story" arrives 51px shorter (the founder already has one) | holds, apart from that one card |

The skeletons showed for 0.25 to 0.6s on Shell pages and 2.1 to 2.3s on the wall, on the dev server.

## Round-6 Bao findings, checked

| # | Finding | Now |
|---|---|---|
| 1 | "Open the book" overlapped "Read this page", 761 to 868px; the door's pills touched | **Fixed.** The Book stacks the row up to 900px (book-account.css:228). Overlap is 0 at 770, 868, 900, 901, 960, 1000 and 1100, and at 901 the gap is 13px. The door, headless: 0 at every width from 770 to 1366, with a 16px gap between the pills. |
| 2 | Plans, 761 to 900px: Monthly alone in a near-empty full-width card | **Fixed.** At 800 the card is 734×168: head left, rows in two columns, words reaching 714px, no "—" rows. I looked at it in a screenshot. |
| 3 | "Keep someone else’s / story" on Account at 800 | **Fixed.** `strong, a, dt, dd, h2, h3` joined the line-41 rule. No one-word last line on Book, Plans, Talk, Account or Start at 800, 390, 1366 or 2560. The wall flags three, all hidden under a leaf's clamp. With those leaves opened, there are none. |
| 4 | The wall's mark placed by the window | **Fixed** (see N13). |

**The wider line-41 rule:**
- I checked all of 57 to 154 matched elements per page at 1366, 1920, 2560, 800 and 390.
- None of them is an element that would inherit `nowrap` but now wraps.
- None loses an inherited `balance`, apart from the `.stop` span inside balanced titles. That span is inline, so it makes no difference.

## Gaps

### N15. POLISH: on the Shell pages and on Start, the heart lands below the fold or on a hairline
**Skill:** taste-skill critique pass 13 ("Is anything lying on top of…"); impeccable polish ("optical as well as mathematical alignment"); hallmark interaction-and-states (Loading); BAOS 42 ("Loading draws the mark on the sheet over the page's hairline skeleton"). This is N13's fault, still present on the other pages.

**Where:**
- `Shell.tsx:375` renders `<LoadingMark />` after the page.
- `astory.css:2294` and `astory.css:3732` (`.page[aria-busy] + .loading-mark { margin-top: -40vh }`) pull a 40vh box up over the skeleton's last 40vh. So the heart sits 20vh above the skeleton's foot, wherever that falls.
- `book-account.css:908`: `.start-sk-mark` centres the heart on the whole Start sheet.

**Measured** (where the heart's top lands once the sheet settles, and the rules crossing its 56px box):

| Page, size | Heart top / window | Crosses |
|---|---|---|
| Book 1366, 1920, 2560 | 591/768, 787/1000, on screen | nothing (inside the spread's outline) |
| Book 390 | 974/844 | **below the fold**, on a contents rule |
| Book 800 | 1199/1024 | **below the fold**, on two contents rules |
| Talk 1366 | 421/768 | **the card outline's left edge runs through it** |
| Talk 390 | 639/844 | a ruled line |
| Talk 1920 | 375/1000 | nothing |
| Account 1366 | 824/768 | **below the fold**: no mark on screen at all |
| Account 1920 / 2560 | 797/1000, 1090/1300 | a section's ruled line |
| Start 1366 | 382/768 | **the bottom edge of "Someone in my family" and the top edge of "My own story"**: it sits in the 12px gap between the two frames |
| Start 390 | 618/844 | nothing |
| Wall 390 | 809/844 | nothing, but the heart's lower 21px is below the fold |

**Change:**

| Before | After | Why |
|---|---|---|
| Shell draws the mark after the page, 20vh above its foot | Each skeleton puts `<LoadingMark />` in its first block: the Book's spread outline (Book.tsx:118), Talk's card (Talk.tsx:58) and Account's bookplate (Account.tsx:810). Shell draws its own mark only when the busy page has none. Add `.bka-sk-block { display: grid; place-items: center }` and `.bka-sk-block .loading-mark { min-height: 0 }`, and drop the `aria-hidden` from those three (empty) blocks so the status line inside stays readable, as the wall's outlines already do | The heart draws where the first thing will land, inside one outline, on screen, at every size (the bookplate is 81 to 434 at 1366; the phone blocks start at 54 to 130) |
| `.start-sk-mark` centred on the sheet | Put the mark in the first way's specimen slot: `.start-skel .way-other .start-spec`, centred there | It lands on clear paper where "Their story" will be drawn, not across two frames |
| Wall phone leaf: heart centred in a 360px outline | At ≤760px: `.wall-sk-leaf:first-child { place-items: start center; padding-top: var(--s-16) }` | The heart sits in the first screen on a 390×844 phone |

### N16. POLISH: Start's status line is hidden, and the wall's sits inside `aria-busy`
**Skill:** hallmark interaction-and-states (Loading: "label stays readable"); impeccable craft-floor (States, semantics). This is N14, applied unevenly.

**Where:**
- `Start.tsx:194`: `<main className="start-sheet" aria-hidden="true">` contains `.start-sk-mark` (218–220), so the `role="status"` line is removed from the accessibility tree. A screen reader on Start hears nothing while it loads (measured: `closest('[aria-hidden="true"]')` is the main).
- `Wall.tsx:262`: the status line sits under `.wall.wall-skel[aria-busy="true"]`. ARIA lets assistive technology hold back what is inside a busy region until it is done. The Shell pages keep the line outside the busy placeholder, and that is the safe pattern.

**Change:**

| Before | After | Why |
|---|---|---|
| Start's mark inside the `aria-hidden` main | Move `aria-hidden` from `main.start-sheet` to its `<section>`, or render the mark beside the main. Together with N15 this means: in the first specimen, outside anything hidden | Every wait announces itself once |
| `aria-busy` on the wall's root | Put `aria-busy` on `.wall-sheet` or `.wall-page` only, and leave the status line (in the first outline) outside it. Or drop `aria-busy`, since the status line already says it | The status line is not inside a region a reader may mute |

Note: a `role="status"` node that is inserted already holding its text is announced unreliably by some screen readers. I couldn't test one here. If the founder's reader stays silent, mount the span empty and set its text one tick later.

### N17. POLISH: the folio and "Press ? for shortcuts" now sit under the skeleton, in the first screen, then leave
**Skill:** BAOS 23a ("Nothing jumps or flashes"); impeccable polish §5 (layout shift); taste-skill pass 5 (holes and accidents). This came in with this round's Shell change.

**Where:** `Shell.tsx:376–385`. `runningHead` now drops `!busy` (273), and the folio and the keys hint use the same flag. Both sit at the foot of a sheet that is still short. Their top, once settled, while the skeleton shows:

| Page, size | Keys hint / folio / window |
|---|---|
| Book 1366 | 708 / 732 / 768 |
| Talk 1366 | 702 / 726 / 768 |
| Talk 1920 | 934 / 958 / 1000 |
| Account 1920 | 958 / 982 / 1000 |

When the page arrives, both are pushed a screen or more down. The small print at the bottom of the window comes and goes.

**Change:**

| Before | After | Why |
|---|---|---|
| `{runningHead && <p className="folio-sheet">…}` and `{runningHead && <button className="keys-hint">…}` | `{runningHead && !busy && …}` for those two only; the running head keeps standing | The head is the page's frame; the folio and the hint belong to the page's foot, which isn't there yet |

### N18. POLISH: on a cold load of the Book, the cloth's words appear without their rise
**Skill:** emil-design-eng ("Preventing jarring changes: elements appearing… without transition feel broken"); gsap-react (create the tween in the run that owns the nodes); DESIGN.md Rules 2 ("the hero's words rise line by line"); BAOS 23.

**Where:**
- Book.tsx:79–106 passes the same `compact`, `hero` and no title in its skeleton as in the page. This is deliberate, so the sheet doesn't dip twice.
- Shell's `ready` key therefore doesn't change (Shell.tsx:289), and `arrive()` (303) runs only once, over the skeleton.
- The arrived `h1.bkh-title`, `.bkh-line` and `.bkh-edition` are new nodes that no tween touches. Measured at the moment of arrival: 0 tweens on each, no split lines, while the sheet is still at opacity 0.73 and rising.
- The same is true in code for Talk's `[data-rise]` words and card on a cold load. Talk's title is in its skeleton, so it does rise.
- Navigating in from another page is unaffected, because the account is already loaded and there is no skeleton.

**Change:**

| Before | After | Why |
|---|---|---|
| Shell re-runs `arrive` only when `ready` changes | A second effect on `busy`: when it turns false with the same `ready`, run arrive's inside-only path (the one it already takes after a view transition, arrive.ts: "only what is inside it rises"). That path splits and rises the hero's h1 and the `[data-rise]` items. It never tweens the sheet, and it is reverted on cleanup | The page's words arrive once, in the house rise, and the sheet still never dips |

### N19. POLISH: the printed book still sets three kinds of family words raw, and the Print at home PDF sets everything raw
**Skill:** impeccable polish §4 (punctuation consistency); hallmark anti-patterns, minor ("Straight quotes"); humanizer; the rest of N12. A correction to round 6: I said the PDF "is built from the same pages". It isn't. printBook.ts:57–59 hands the story to app-core's `buildLegacyHtml`, which smartens nothing.

**Where:**
- **The family's notes on a memory's last page.** `bookPages.ts:197–202` (`sidesFor`, `body: c.body.trim()`), printed at `BookPage.tsx:359` `{s.body}`. The wall (Wall.tsx:477) and the archive's FamilyVoices smarten the same contribution, so one note is set two ways.
- **The question a relative asked.** `askedQuestions.ts` keeps `r.question.trim()`, printed at `BookPage.tsx:336` `quoted(page.asked.q)`. MemoryPage.tsx:381 smartens the same question.
- **The dedication.** `bookPages.ts:357` (`text: design.dedication`). The cover and title page use `w.title`, which is the person's own book title when they set one.
- **Print at home.** Every title and paragraph in the PDF is set as typed.

**Change:**

| Before | After | Why |
|---|---|---|
| `body: c.body.trim()` (bookPages.ts:201) | `body: smarten(c.body.trim())`, and `who` as is | The family's note looks the same in the book, on the wall and in the archive |
| `asked: asked[m.id] \|\| null` (bookPages.ts:374) | `{ ...a, q: smarten(a.q) }` when present | It matches the memory page |
| `text: design.dedication`; `w.title` | `smarten(design.dedication)`; `smarten(w.title)` for the cover, colophon and title page | Nothing a person typed reaches the printed page straight |
| `printableHtml` passes the story through unchanged | In `signStoryPhotos` (or a sibling step), map `title` and `body` of each memory and the book design's title and dedication through `smarten` before `buildLegacyHtml` | The PDF is the printed book; it must not set straight quotes where the screen sets curly ones |

### N20. POLISH: Talk's phone skeleton card is 55px too tall, so the words land 63px above their lines
**Skill:** hallmark interaction-and-states ("Skeleton screens… predictable shape"); impeccable polish §5; N11's own aim of ±2.

**Where:**
- `book-account.css:900`: `.talk-skel .bka-sk-block { min-height: 300px }` at ≤760px. The arrived card is 244.9 tall at 390. The skeleton's six lines therefore start at 406, and the words arrive at 342.9.
- At 1366 the block (`book-account.css:874`, `min-height: 320px`) is 14px taller than the card (305.9), and it sits 2.5px low (81 against 78.5). Nothing follows it there.

**Change:**

| Before | After | Why |
|---|---|---|
| `min-height: 300px` at ≤760px | `min-height: 245px` (the card is set to two lines at every length, so its height is steady) | The words land on their lines |
| `min-height: 320px`, top 81 | `min-height: 306px`, `margin-top: -2.5px` (or align the card's own top to the words' 81) | Within 2px, as on every other page |

### N21. POLISH: on the wall, memory titles run to three lines between 761 and 850px, and near 1180px
**Skill:** taste-skill house rule ("Headlines: two lines or fewer, at every width. Every h1–h6"); hallmark gate 51 spirit; BAOS 12.

**Where:** `book-account.css:757` sets `.sheet-page .wall-leaf h3` at 28px everywhere above 760px. Two-up leaves are only 339 to 381px wide at 761 to 850, and 373px at 1180, where the contents column returns beside them. Titles of 44 to 56 characters set three lines:

| Width | Lines per title, in order |
|---|---|
| 761 | 1 3 2 3 3 2 2 1 |
| 800 | 1 2 2 3 3 2 2 1 |
| 850 | 1 2 2 3 2 2 2 1 |
| 900 to 1100 | at most 2 |
| 1180 | 1 2 2 3 2 2 2 1 |
| 1280, 1366 | at most 2 |

The two at 800 are "Losing grandparents and preserving a grandfather’s story" and "Building Better Play Studios through bootstrapping". The phone already steps the title to 24px (847), and its 338px leaves set every title in two lines.

**Change:**

| Before | After | Why |
|---|---|---|
| 28px wherever the leaves are two-up and narrow | `@media (min-width: 761px) and (max-width: 900px), (min-width: 1101px) and (max-width: 1240px) { .sheet-page .wall-leaf h3 { font-size: 24px; } }` | The same step the phone takes, where the leaf is phone-wide |

## Notes (not gaps)

- **Start at 390** draws "My own story" as a full card in the skeleton. It arrives 51px shorter, because the founder already has their own story. The skeleton can't know that before the stories load, so the third card moves up once. At 1366 the difference is 4px.
- **The Book's skeleton block** is still a strict 2:1, so it is 133px narrower than the arrived stage at 2560 (93px at 800). Its height, top and the rail hold, so nothing moves.
- **The skeleton comment** at book-account.css:865 says "the rail's rows on its own 44px pitch". The rule is 45px, and the rows measure 44.7.
- **Rule 1, outside this scope:** two straight apostrophes are still in user-visible strings. `lib/dictation.ts:93` ("Dictation couldn't start.") is the writer's. `data/familyWrites.ts:215` ("the email service isn't deployed…") is a family invite's error detail.
- **Cosmetic:** the `<main>` children in Placeholder.tsx:168–172 and Wall.tsx:344–349 are indented one level short. So is the `wall-counts` conditional at Wall.tsx:388–394.
- `Problem` smartens every message it shows (ui.tsx:186). Raw server causes are therefore set in the house punctuation too.

## Skill by skill

- **taste-skill:**
  - Gaps: N15 (the mark lies on hairlines), N21 (three-line titles).
  - Passes:
    - No heading over two lines on any page at 1366, 1920, 2560 or 390. Start is one screen at 1366, 1920 and 2560. Plans and Talk fit at 1920 and 2560.
    - One live thing per page.
    - No text under 12px outside the printed book. No straight quote in rendered text on any page, the wall included.
- **hallmark:**
  - Gaps: N16 (loading label), N20 (skeleton shape), N17 (the foot moves).
  - Passes:
    - Gate 34: scrollWidth equals clientWidth on every page at every size.
    - Gate 49: no two-line button labels. The multi-line ones are the Start way cards and the Account toggle rows, which are large card controls by design.
    - No control under 44px.
    - Gate 33 holds on every skeleton.
    - The line-41 rule breaks no `nowrap` affordance.
    - Round-6 Bao findings 1 and 2 are gone at every width I tried, and so is the door's.
- **emil-design-eng:**
  - Gap: N18 (the hero's words appear without their transition on a cold load).
  - Passes:
    - No new motion. The mark is unchanged at 720ms ease-out.
    - The keys hint presses at 0.97 and its hover sits behind `(hover: hover) and (pointer: fine)`.
- **impeccable:**
  - Gaps: N19 (polish §4), N15 (optical placement), N16 (states and semantics), N17 and N20 (layout shift).
  - Passes:
    - N11 was fixed at the narrowest level: one flag in Shell and one placeholder for the controls row.
    - Failure still wears the house style (not-shared and `/no-such-page` are one screen at 390 and 1366).
- **GSAP:**
  - Gap: N18. The fix is an inside-only path in `arrive`, reverted on cleanup, not a page-level tween.
  - Passes:
    - Start's rise is still in `gsap.matchMedia` with `clearProps` and `mm.revert()`.
    - No ScrollTrigger in scope.
    - `useFill` is unchanged, with zero ongoing writes as in round 6.
- **Other:**
  - humanizer drove N19.
  - find-skills: nothing further applies.
