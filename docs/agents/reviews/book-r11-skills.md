# Skills Steward: Book, Plans, Account, Talk, Start and Wall, round 11

**Verdict: GAPS (0 blockers, 3 ugly, 2 polish).** This is not the passing round.

What holds:
- N30's Home and Archive parts are fixed.
- N31 is fixed from 761 to 1599px.
- The Archive's wall-line memory is safe: both the read and the write are in try/catch, and a first visit holds the private line.
- The wall's arrival and the writer's book both arrive from their from-state at insertion.
- b69768c holds.

What is left:
- **N32 (ugly), a regression from N30's Person fix:** on a phone the loading hero now holds two subline rows. All six of the founder's people have one, so every person page on a phone now moves 23px up on arrival. In round 10 it moved 0. The two-row hold was my own round-10 advice ("relation and dates is the common case"), and the founder's data shows it was wrong.
- **N33 (ugly):** the Archive's held stats row is the dated variant. At 320 that variant wraps to a second row, and the founder's Photographs variant doesn't, so the sheet moves 58px up. At 360–375, a story whose memories are all dated to one year moves 58px down.
- **N34 (ugly):** with classic scrollbars, Talk's skeleton and arrived page fall on opposite sides of the window's height at every desktop size I measured, and Person does too at 1366×900. The scrollbar then appears or vanishes on arrival, and everything centred jogs 7.5px sideways.
- **N35 (polish):** from 1600px up, Talk's outline is 12px shorter than the card.
- **N36 (polish):** on a phone, a free user's last-of-three question arrives 33px shorter than the held free hero.

## How this was checked

- **Skills read:**
  - taste-skill: SKILL.md and critique.md (passes 1–14, caps).
  - hallmark: interaction-and-states (loading and skeletons), slop-test gates 1–52, responsive non-negotiables.
  - emil-design-eng: easing, duration, frequency, performance, preventing jarring changes.
  - impeccable: craft-floor and polish (§5, layout shift and runtime warnings).
  - gsap-react and gsap-performance. No ScrollTrigger is in scope, so gsap-scrolltrigger has nothing to check.
  - BAOS-STANDARD rules 23a and 42, and DESIGN.md's phone floor. find-skills: nothing else applies.
- **Code read:**
  - e3c7a42: Archive.tsx, Home.tsx, Person.tsx, Wall.tsx, Write.tsx and book-account.css.
  - b69768c: astory.css 1054 and 1286.
  - Home.tsx 30–175, Person.tsx 100–135, 180–200 and 300–320, Archive.tsx 260–425, Talk.tsx 45–125, Start.tsx 170–186, Write.tsx 740–770 and Wall.tsx 320–336.
  - book-account.css 500–560 and 895–925.
  - `today.ts`'s skip keys and `stories.ts`'s `familyReaderStoryIds`.
  - The bytes of Person.tsx:127: the held parts are U+00A0, so they don't collapse.
- **Static:** `tsc --noEmit -p tsconfig.app.json` and eslint on Archive, Home, Person, Wall and Write are both clean (working tree).
- **My own pane tab** (`tab-192`, now closed, viewport reset). It sat on `/book/closed-640.webp`.
  - **Setup:** each page was cold-loaded into a same-origin iframe at 0.01 opacity, with my round-10 harness extended:
    - a MutationObserver records each from-state at insertion;
    - a 4ms poll steps the frame's GSAP ticker and records the cloth's height, the sheet's top, dips and active tweens;
    - the poll also keeps a copy of the skeleton hero's markup;
    - an optional probe records the skeleton's boxes, `clientWidth` and `scrollHeight`.
  - **The variant method:**
    - I took the held hero's real markup from the skeleton and put it into the arrived frame's `.hero-in`. Then I measured the cloth with each state's variant put into the held markup and into the arrived markup.
    - That compares held and arrived in the same frame, at the same width, with the same fonts.
    - Every change was in my own iframe's DOM.
  - **The Archive's memory:** I measured it with the iframe's `Storage.prototype` stubbed for the `astory-archive-wall` key only, in four modes:
    - **absent:** a first visit;
    - **"public";**
    - **getItem and setItem throw;**
    - **setItem throws.**
    The stub swallowed the app's own writes to that key, so the stored value is unchanged ("public", as earlier visits left it).
- **Headless Edge** (Playwright, fresh signed-out contexts): the wall `/p/RNm1vTr2Gyqu`, with an insertion observer, 6 cold loads at 1366, 390, 2560, 375, 1366 and 390.

## N30, N31 and the round-10 notes, checked

| # | Round 10 | Now |
|---|---|---|
| N30 Home | A free account's note wasn't held (31px down) | **Fixed.** The held free hero against the arrived free hero ("3 of today’s three waiting."): 386.7 → 386.7 at 1366, 624.1 → 624.1 at 390, 394.8 → 394.8 at 1920. The paid state is unchanged: 355.7, 593.1, 363.8, all 0. **One free state is left: N36.** |
| N30 Archive | The phone held the shared line, so a private wall moved 42px up | **Fixed for the wall line.** <br>• **First visit (key absent):** the private line is held. 360.8 → 360.8 at 390, 384.1 → 384.1 at 1366. <br>• **"public":** 402.8 → 402.8 at 390. <br>• **The founder's real load** at 390 holds "public" and arrives at 402.8, with 0 drop and no dips. <br>• **Throwing storage:** with getItem and setItem both throwing, it holds the private line, logs no error and doesn't dip. When only setItem throws, the write fails silently. <br>**But at 320 the stats row decides the height: see N33.** |
| N30 Person | A dated person on a phone moved 23px down | **Over-corrected: see N32.** The held subline is now two rows on a phone (23px each). The founder's people have one. |
| N31 | Talk's outline was 5–9px taller than the card | **Fixed from 761 to 1599.** `offsetHeight` is 253 = 253 (800, 1001, 1030, 1031, 1100) and 301 = 301 (1101, 1366, 1440). Bounding boxes agree to 0.2px, and tops to 1.2px. At 390 the outline is 66/311 and the card 66/310.9. **From 1600 up: see N35.** |
| Note: two arrivals in `useEffect` | Wall and the writer's book | **Fixed, and measured at insertion.** <br>• **Writer** (Write.tsx:746, `useLayoutEffect`): `.w-book` was at opacity 0, `y 22`, `rotate(-0.5deg)` in the insertion callback on 4 of 4 cold loads (1366 ×2, 390, 1920). It ends at opacity 1 with no inline style, the textarea has focus, and the cloth is 104/96 with 0 dips. <br>• **Wall** (Wall.tsx:330): the sheet was at opacity 0, `y 56` in 6 of 6 headless cold loads. The name was already split, its line at `translateY(64px)` (1366, 2560) or `43px` (390, 375). |

**b69768c (Account and the invite's name pairs):**
- **Account, measured:** at 761, 800, 837, 1101, 1161 and 1233, `.acct-two` is two equal `minmax(0, 1fr)` tracks (210.6–246.4px). Both inputs end inside the pair (at 800, Last name ends at 742.4 and the pair at 759.1). `body.scrollWidth` equals `clientWidth` at every width. 390 is one column.
- **The invite sheet (code only):** `.invite-sheet .two` has the same fix. I didn't open the sheet.

## Gaps

### N32. UGLY: the Person hero now holds two subline rows on a phone, but the founder's people have one, so every person page moves 23px up
**Skill:** hallmark interaction-and-states (a skeleton is the page's shape), impeccable polish §5 (layout shift), BAOS 23a and 42, and the ±2px aim of N27.

**Measured** (390×844, cloth skeleton → arrived, with the parts each person arrives with):

| Person | Parts | Cloth | Sheet |
|---|---|---|---|
| 5aa5 | "Storyteller" | 215.9 → 192.6 | **23 up** |
| 36cf | "Nhi Tran’s parent" | 215.9 → 192.6 | **23 up** |
| 517a | "Your friend" | 215.9 → 192.6 | **23 up** |
| ff96 | "Your friend" | 215.9 → 192.6 | **23 up** |
| ada1 | "In the family", two-line name | 215.9 → 228 | 12 down (the name's second line; see Notes) |

- At 1366 every part sits on one line, so 256.9 → 256.9.
- In arrived frames I put in 1, 2 and 3 parts: 192.6, 215.9 and 239.1 at 390. Each part adds a 23.3px row.
- Round 10 measured 192.6 → 192.6 for these people.

**Where:** `pages/Person.tsx:127`, `[" ", " "]` for a real person.

**Change:**

| Before | After | Why |
|---|---|---|
| A real person holds two parts | Hold one part by default. Remember each person's part count on arrival under one key: `{ [personId]: n }`, try/catch, a per-viewer convenience like the Archive's wall line. The skeleton holds that many. | Relation is always there, but dates are optional. Six of six of the founder's people have none, and a new tree starts without them. |
| The preview holds three parts | Keep it (development only, `import.meta.env.DEV`) | It's correct for the sample family |
| (check) | Re-measure 5aa5, 517a and a dated person at 390, on a first visit and on a second visit | ±2px |

### N33. UGLY: the Archive holds the dated stats row, so at 320 the founder's sheet moves 58px up, and a one-year story at 360–375 moves 58px down
**Skill:** the same rules as N32. Also hallmark responsive: 320 and 375 are must-render widths.

**Measured:**
- **The founder's real load at 320×640:** held 460.9 → arrived 402.8 (58 up). It is 439.9 → 402.8 (37 up) on a first visit, when the private line is held.
- **The cause:** the held stats are "8 Memories / 1949–2026 The years it reaches / 2 Chapters". At 320, the 132px middle stat pushes "Chapters" onto a second row. The founder's story has no dated memories, so it arrives with "4 Photographs" (86px), which fits on one row.
- **The second stat's variants, in the arrived frame:**

| Width | Photographs | Span ("The years it reaches") | One year ("The one year dated so far") | Held |
|---|---|---|---|---|
| 320 | 402.8 | 460.9 | 460.9 | 460.9 |
| 360 and 375 | 402.8 | 402.8 | **460.9** | 402.8 |
| 390, 414, 800 and 1366 | equal | equal | equal | equal |

**Where:** `pages/Archive.tsx:297–300` (the held middle stat) and `:395–405` (the arrived one has three variants).

**Change:**

| Before | After | Why |
|---|---|---|
| The held middle stat is always the dated span | Store the second stat's kind (`photos`, `span` or `one`) with the wall line, e.g. `{ wall, stat }` under `astory-archive-wall`, read in try/catch. Hold that variant. A first visit holds Photographs. | A new story has no dated memories, so it starts on Photographs |
| (or) | Keep the stats on one row from 320 to 375 in every variant | That removes the variable instead of remembering it |
| (check) | 320, 360, 375 and 390, first visit and second | ±2px |

### N34. UGLY: on arrival the classic scrollbar appears or vanishes, so every centred thing jogs 7.5px sideways (Talk at every desktop size, Person at 1366×900)
**Skill:** emil-design-eng (preventing jarring changes), impeccable polish §5 (layout shift), and hallmark (the skeleton is the page's shape). This is BAOS 23a's "nothing jumps".

**Measured:** the iframe has 15px classic scrollbars, as headless Edge does. I compared `clientWidth` and `scrollHeight`, skeleton → arrived:

| Page | Window | Skeleton | Arrived | Scrollbar on arrival |
|---|---|---|---|---|
| Talk | 1366×768 | 768 (no bar) | 893 | appears |
| Talk | 1366×900 | 907 (bar) | 900 | vanishes |
| Talk | 1920×1000 | 1001 (bar) | 1000 | vanishes |
| Talk | 1366×1300 | 1302 (bar) | 1300 | vanishes |
| Talk | 2560×1440 | 1443 (bar) | 1440 | vanishes |
| Person (5aa5) | 1366×900 | 900 (no bar) | 1808 | appears |

- At 1366×768, Talk's outline sits 7.7px right of the card and is 7.6px wider (705.6 / 585.8 against 697.9 / 578.1). At 1366×1100, with no scrollbar either way, it lands exactly (705.6 / 585.7). The scrollbar is the whole difference.
- Home, Archive, Book and Account keep their scrollbar state at 1366×768, 1366×900, 1920×1080 and 2560×1440.
- **Why Talk is short at 768:** from 1101 up, the skeleton's left column is held at 248px, but the words column arrives at 404–435px.
- **Why Talk is long at tall windows:** the skeleton runs 2–7px past the arrived page.

**Where:**
- `styles/pages/book-account.css:719`: only the wall has `scrollbar-gutter: stable`.
- `:901` and `:919`: Talk's skeleton column has a min-height only at 761–1100.

**Change:**

| Before | After | Why |
|---|---|---|
| `html:has(.wall) { scrollbar-gutter: stable; }` | `html { scrollbar-gutter: stable; }` for the whole app | No skeleton height can then move the page sideways. It costs nothing where scrollbars overlay (phones, macOS). |
| `.talk-skel > .bka-sk-col` has no height from 1101 up | Hold the real `.talk-words` copy with `hold-words` (the names come from `user`, as Home's greeting does), so the column is the words' own height at every width | 404, 435 and 408px at 1366, 1101 and 1920 can't be one number |

### N35. POLISH: from 1600px up, Talk's outline keeps the 1366 height, but the question's pitch steps up, so the card is 12px taller
**Skill:** hallmark (the skeleton is the page's shape) and N31's ±2px.

**Measured** (`offsetHeight`, outline → card): 301 → 301 at 1440. 301 → 313 at 1600, 1920 and 2560. At 2560 the bottoms are 578 → 596.1 on screen. Today's question is `mid`, 36px at 1440 and 42px from 1600.

**Where:** `book-account.css:543–547` raises `.talk-q` at `min-width: 1600px`. `:903` has no matching step for the outline.

**Change:**

| Before | After | Why |
|---|---|---|
| (none) | `@media (min-width: 1600px) { .talk-skel .bka-sk-block { min-height: 313px; } }` | The card's height at 1600+: two `mid` lines at the 50px pitch, against 44px below 1600 |

### N36. POLISH: on a phone, a free user's last question of the day arrives 33px shorter than the held free hero
**Skill:** the same rules as N32.

**Measured** in the arrived frame at 390:
- The held free hero is 624.1, and the arrived "3 of today’s three waiting." state is 624.1.
- The last-of-three state is 591.1: "Ask me another" goes, and the note is "The last of today’s three. Three new ones tomorrow." The sheet moves **33px up**.
- 1366 and 1920 are equal.

**Where:** `pages/Home.tsx:79–80`. The skip count is in localStorage (`today.ts`, `astory-skips-<story>-<day>`), but the skeleton doesn't know the story's id.

**Change:**

| Before | After | Why |
|---|---|---|
| The held free hero is always the "3 of" state | When `!unlimited`, read today's skip count (any `astory-skips-*-${dayKey()}` key, try/catch). At 2 or more, hold the last-of-three shape: no "Ask me another", and the longer note. | A free user who has skipped twice and reloads sees the same hero |

## Notes (not gaps)

- **Out of scope, landed mid-review:**
  - **f059ffb** (family readers) touched Book.tsx, Account.tsx, Person.tsx and Write.tsx while I was measuring, and the working tree served it. I checked only that it doesn't touch any skeleton, arrival or hero. It doesn't.
  - **A warning on every signed-in load:** "supabase 404: POST /rest/v1/rpc/family_reader_stories … PGRST202". `familyReaderStoryIds` treats PGRST202 as "not deployed", but the request logger still warns. Impeccable wants a clean console, so this is for the Family builder: deploy `family_readers.sql`, or quiet the logger for this code.
- **A two-line person name** (ada1, "Bao Ngo Gia Vo & Bao.") adds a row that the held `&nbsp;` title can't know. It is 12px at 390. It is like Home's question length: unknowable before the account, unless the per-person memory in N32 also keeps the title's line count.
- **The Archive's memory isn't per story.** A founder with one shared and one private story holds the last one he saw. Turning sharing off in Account and then cold-loading the Archive holds the old line once, after which it corrects itself.
- **Home with all three questions used** ("That’s today’s questions…") is another arrived shape. I didn't measure it.
- **Bare `1fr` tracks in the Book** (`.bk-spread`, `.sb-plate.many`, `.sb-lq-grid` and `.bk-controls`): their items carry `overflow: hidden` or `min-width: 0`, so the automatic minimum is already 0. Hallmark gate 50 holds in effect. `.bk-plate` is unused CSS.
- **Arrival durations of 0.6–1.1s** are the authored once-per-page moment, not a frequent interaction. Easing is ease-out, and only transform, opacity and clip-path move.
- **Round-9 notes still stand:**
  - the wall's phone foot;
  - Talk's phone words column (342.9 against the held 351);
  - "Monthly" close to its price at 1341–1360.

## Skill by skill

- **taste-skill:**
  - Gaps: N32, N33 and N34. Critique pass 13: the sheet moves under the reader during arrival.
  - Passes:
    - No headline over two lines.
    - The founder's state holds exactly on Home, the Archive (≥ 360), the Book, Account and Write.
- **hallmark:**
  - Gaps: N32, N33, N35 and N36 (the skeleton isn't the page's shape), and N33 at 320 (a must-render width).
  - Passes:
    - No horizontal scroll: Account at 761–1233, the wall at four widths, and the six pages at 1366 and 390.
    - No two-line button.
    - The held fields stay unreachable.
    - `minmax(0, 1fr)` on both name pairs.
- **emil-design-eng:**
  - Gap: N34 (a sideways jog on arrival).
  - Passes:
    - Every from-state is set before paint, the wall and the writer's book included.
    - The house ease-out.
    - Nothing new on a frequent action.
- **impeccable:**
  - Gaps: N32–N36 (polish §5, layout shift).
  - Passes:
    - Storage access is wrapped, with a safe default.
    - tsc and eslint are clean.
  - Out of scope: the family_reader_stories warning (Notes).
- **GSAP:**
  - No gap.
  - Passes:
    - Every arrival in scope is a layout effect with `mm.revert()` cleanup.
    - 0 active tweens after arrival on every load.
    - 0 dips on every cold load: Home, Archive, Person ×6, Write ×4, Book, Plans, Account and Talk, at 1366 and 390.
- **Other:** find-skills: nothing further applies. The new comments read plainly.

## Housekeeping

- **Pane:** I worked only in `tab-192`. I removed every iframe and deleted my window helpers. I reset the viewport to desktop and closed the tab.
- **Nothing written:**
  - I didn't sign out, read or touch `astory-app-auth`, or press any control.
  - I wrote no storage. The stub intercepted the app's own writes to `astory-archive-wall` in my iframes, and the key still reads "public".
  - Loading /talk and /plans queued their usual view events. Loading /archive, /family and /account read only.
  - The variant measurements changed only my own iframes' DOM.
- **Playwright:** headless, signed out, on the public wall only.
- **Scripts:** `r11s/p.js` and `r11s/wall.mjs` in my scratchpad. No screenshots were saved.
