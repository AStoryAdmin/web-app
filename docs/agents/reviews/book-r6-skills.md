# Skills Steward: Book, Plans, Account, Talk, Start and Wall, round 6

**Verdict: GAPS (0 blockers, 0 ugly, 4 polish).** N8, N9 and N10 are fixed where they were written. The cloth now holds its height at every size, the bookplate row is the right size, the wall and Start wait on their own frames, and every string in the seven pages uses ’. The new `:where()` text-wrap default is safe: I checked it against every nowrap control on every page. Four small things are left:
- N11: the running head is held back while a Shell page loads, so the Book, Talk and Account still drop 39px when they arrive. On a phone the Book's rail lines also sit 124px above where the rail lands.
- N12: people's own words are not typeset. On the wall, "grandfather's story" (straight) sits under "Bao’s own words" (curly) on one screen. The load-error line mixes ’ and ' in one sentence, and can say the same thing twice.
- N13: the wall's loading mark lands on a hairline at 1366 and on a phone. The phone chapter-head line is also 16px too tall.
- N14: no loading state says anything to a screen reader.

## How this was checked

- **Skills read:**
  - taste-skill: SKILL.md and critique.md.
  - hallmark: slop-test (all 58 gates), anti-patterns, interaction-and-states and responsive.
  - emil-design-eng: SKILL.md.
  - impeccable: craft-floor, polish, layout and the critique outline.
  - GSAP: gsap-react, gsap-performance and gsap-timeline, plus the cleanup and refresh rules in gsap-scrolltrigger.
  - Also BAOS-STANDARD.md and DESIGN.md. I applied humanizer to the copy. find-skills: nothing further applies.
- **Code read:**
  - `pages/{Book,Plans,Account,Talk,Start,Wall,Placeholder}.tsx` in full.
  - `styles/pages/book-account.css`: the shared block, §4 to §7, and the new `:where()` rule at line 41.
  - In astory.css: `.btn`, `.loading-mark`, the running head and the old §19.
  - `Shell.tsx`'s busy and running-head logic, `lib/arrive.ts`, `components/delight/LoadingMark.tsx`, `lib/typography.ts`, `state/AccountProvider.tsx`, and the error strings in `data/stories.ts` and `data/family.ts`.
  - Every user-facing string in `components/book/*.tsx`.
- **Rendered in my own pane tab** (`tab-118`, now closed, viewport reset):
  - The pane was hidden, so the browser drew no frames. Screenshots worked only after I stepped `__gsap.ticker` (I took them at 1366 of the Book, Account and Talk).
  - **Skeletons, measured on real cold loads.** I loaded each page into a same-origin iframe sized to the test window, polled it every 4ms while the skeleton was on screen, then measured the arrived page after stepping that frame's GSAP ticker. Positions on Shell pages are relative to the sheet's top, because the sheet's own rise is frozen in a hidden pane. This catches what round 5's injected markup could not: the running head is missing while the page is busy.
  - **Audit pass** at 390×844, 1366×768, 1920×1000 and 2560×1300 (zoom 1.3) on Book, Plans, Talk, Account, Start, the wall (also at 3840, zoom 2), the not-shared wall and `/no-such-page`. It checked horizontal scroll, headings over two lines, controls under 44px, two-line buttons and text under 12px.
- **Headless Edge** (Playwright, `channel: msedge`) for the wall at 1366, 1920, 2560, 3840 and 390:
  - Real frames: I photographed the wait state and the arrived page.
  - I counted style writes on `.wall-words` for 3s after settling.
  - I read each leaf's size, clamp and button.
- **Nothing written:**
  - No Save, Change, Remove, Send, Order, Open it, Choose, story switch or printing-interest press. No sign-out.
  - `astory-app-auth` was never read or written. I read only the number of localStorage keys, once.
  - Loading /plans and /talk again (in the tab and the iframes) queued more `plans_viewed` and `talk_wall_shown` events.
- **Not verified:**
  - Timing with real frames on the signed-in pages. The pane was hidden, so I can't say how much of a skeleton shows while the sheet is still fading in. The sheet's rise starts at 0.3s, and the skeletons lasted 0.3–0.55s here.
  - The Book's printed pages with a memory open. N12's book half is from reading the code.
  - Every Account form's error and success states.
  - A zoomed-out Edge window.

## Round-5 gaps, checked

| # | Round-5 gap | Now |
|---|---|---|
| N8 | The Book's skeleton cloth was short; Account's first row was a line where the bookplate arrives | **Fixed as written; one cause left (N11).** The cloth is held by `.bkh-skel` (Book.tsx:86–104, book-account.css:849). The rail is on a 45px pitch, and the bookplate block sits in the real `acct-sec` grid (Account.tsx:808–816). |
| N9 | The wall and Start loaded on bare cloth, with the mark only | **Fixed.** `WallWait` (Wall.tsx:257–306) and the Start frame (Start.tsx:182–223) land within 0.3px on the cloth and within 2px on the sheet. The mark's placement on the wall is N13. |
| N10 | Two apostrophes in one voice | **Fixed in the seven pages and `components/book`.** A search for `[A-Za-z}]'[a-z]` finds only comments. A scan of rendered text and of the aria-label, alt, title and placeholder attributes on all eight routes finds none. The wall's own memory text is the exception (N12). |

**N8 and N9, skeleton → arrived** (CSS px):

| Page, size | Cloth height | First block | Verdict |
|---|---|---|---|
| Book, 1366 | 201.8 → 201.8 | spread block 883×441.6 → stage 883×441.6; rail label 10 → 49 from the sheet top | size holds; drops 39px (N11) |
| Book, 390 | 297.3 → 297.3 | block 330.7² → 330.7²; rail 394.7 → 518.7 from the sheet top | drops 38px; rail 124px (N11) |
| Book, 2560 (zoom 1.3) | 262.3 → 262.3 | block height 889.2 → 889.2 | holds, apart from N11 |
| Talk, 1366 | 182.2 → 182.2 | card 42 → 78.5, words 42 → 81 from the sheet top | drops 39px (N11) |
| Account, 1920 | bare | bookplate 300×371.7 → 300×371.7; profile row 411.7 → 411.7; index x 61.4 → 61.4; body x 389.4 → 389.4 | shapes hold; drops 39px (N11) |
| Start, 1366 | – | sheet 96.4 → 98.4; ways 251.5/392.8/534.2 → 253.5/394.9/532.2 | holds (the founder's disabled way is 4px shorter) |
| Start, 2560 (zoom 1.3) | – | every box identical | holds |
| Wall, 1920 | 302 → 301.7 | portrait 97 → 96.9; contents rows 354/398 → 353.9/398.6; multi-leaf chapter's leaves 108.7 → 112 from the chapter top | holds |
| Wall, 1366 / 2560 | 302 → 301.7 / 392.6 → 392.2 | portrait, contents and main within 0.4 | holds |
| Wall, 390 | 406 → 406.2 | contents 406 → 406.2; first leaf 672.7 → 658 | 15px low (N13) |

On the wall, the wait showed for 1.3s (1366, 1920, 390) and 2.1s (2560) on the dev server.

**Round-5 notes:**
- `html:has(.wall) { scrollbar-gutter: stable; }` is in (book-account.css:689).
- The `fonts.ready` comment is in (Wall.tsx:189–190).
- `.start { min-height }` is divided by `--zoom` (astory.css:3152), `.start-head` lives in book-account.css §5, and the dead §19 rules are gone. The §19 heading at astory.css:703 now sits over three unrelated rules (`.mem .pic.nopic`, `.week`). Retitle it or fold them into their sections.
- Plans at 2560×1300: docH 1300 once settled.

## The new pieces, checked

**The `:where()` text-wrap default** (book-account.css:41):
- In Chrome 152 `text-wrap` is a shorthand, so `text-wrap: pretty` also sets `text-wrap-mode: wrap`. I confirmed this: a span with it inside a `white-space: nowrap` parent computes `wrap`. That could let a label inside a nowrap control break, so I checked every element the rule matches against every nowrap rule in every stylesheet, own and inherited. The result is 0 on Book (48 elements), Plans (125), Talk (13), Account (112) and Start (32).
- No block element lost a `balance` it used to inherit.
- Zero specificity, so every class rule that balances still wins.
- One note: `.bk-reader *` excludes the whole desk, not only the printed pages (`section.bk-reader.bk-desk` holds the rail, the swatch label and "To print, or to keep as a PDF."). Nothing there runs to two lines today, so this is not a gap.

**`useFill`'s 18–22px step** (Wall.tsx:156–169), in headless Edge:
- Only a leaf of words that fits whole is stepped up. At 1920, 2560 and 3840, "Losing grandparents…" sets at 22px with no button, beside two photo leaves at 18px. It reads as a letter filling its leaf, as intended.
- Nothing goes past 22px. The 1366 and 390 layouts keep 18px.
- Zero style writes on any `.wall-words` over 3s at all five sizes. No horizontal scroll at any size.

## Gaps

### N11. POLISH: Shell pages still drop 39px when they arrive, because the running head is held back while they load
**Skill:** hallmark interaction-and-states ("Skeleton screens over spinners for content that has a predictable shape"); impeccable polish §5 ("layout shift"); BAOS 42 and 23a ("Nothing jumps or flashes"); N8's own aim.

**Where:**
- `components/Shell.tsx:270`: `const runningHead = !busy && !path.startsWith("/write") && pageName !== "";`. The 39px `.running-head-sheet` (sticky and in the flow, astory.css:2788) is missing over every skeleton and appears with the content. The rule was written when the busy placeholder was empty.
- `book-account.css:865–875`: below 1100px the Book's skeleton puts the rail lines straight under the block. The page puts the 56px `.bk-under` controls row there first, so on a phone the rail lands 124px lower than its lines (38 of that is the running head).

**Measured:** Book 1366 +39, Book 390 +38, Talk 1366 +36.5 to +39, Account 1920 +39 (sheet-relative, every block). At 2560, zoom 1.3, the gap is 50.7 screen px.

**Change:**

| Before | After | Why |
|---|---|---|
| `runningHead = !busy && …` | `runningHead = !path.startsWith("/write") && pageName !== ""`, and while `busy` render the book name as `&nbsp;`, or with `visibility: hidden` (the story isn't known yet, so "A Story" would flip to "The Vo book") | The head is part of the page's frame; the skeleton must stand under it |
| Book skeleton at ≤1100px: block, then rail | Add `<i className="bka-sk-line bk-skel-under" />` after the block: 56px, no rule, shown only at ≤1100px, with the page's own gap | The rail lines start where the contents rows land |

Re-measure the first block against the sheet's top on Book (1366, 390), Talk (1366) and Account (1920). Each should be within ±2.

### N12. POLISH: people's own words are not typeset, and the load-error line mixes ’ and '
**Skill:** impeccable polish §4 ("Keep terminology, capitalization, punctuation, and factual copy consistent"); hallmark anti-patterns, minor ("Straight quotes… A sign nothing was proof-read"); humanizer; BAOS 1 (N10, applied everywhere). `lib/typography.ts` already says how the house sets what people wrote: "Done when the words are read".

**Where:**
- **The wall:**
  - Wall.tsx:220 `{m.title || "Untitled"}`, 224 `{p}`, 386 `{story.intro || …}` and 473 `{t.body}` all render raw text.
  - On screen at 1920: "preserving a grandfather's story", "grandparents' stories", "I've won", "Daniel's story" and "dad's side". These sit under "A life, in Bao’s own words." on the same screen.
  - The archive's MemoryCard and PrintCard, FamilyNotes and FamilyVoices all call `smarten()` on the same words, so one memory is set two ways depending on the page.
- **The Book's printed pages:** bookPages.ts:369 (`title: (m.title || "").trim()`) and 376 (`paragraphsOf(printedBody(…))`) pass the text through untouched, and BookPage renders it as is. The PDF from Print at home is built from the same pages. This half is from reading the code; I didn't render it.
- **The load-error line:**
  - Book.tsx:125, Talk.tsx:66 and Account.tsx:875 print "We couldn’t reach your stories. " plus `loadError`.
  - `loadError` comes from `data/stories.ts:197` and `203` ("Couldn't load the account: …"), or from the fallback `AccountProvider.tsx:46` ("Couldn't reach your stories.").
  - So the line reads "We couldn’t reach your stories. Couldn't load the account: …", or "We couldn’t reach your stories. Couldn't reach your stories."
- **Start's "Ask to join":** Start.tsx:78 shows `data/family.ts:234` ("Asking isn't switched on…") and `236` ("That didn't send…") in its meta line.

**Change:**

| Before | After | Why |
|---|---|---|
| Wall.tsx `{m.title}`, `{p}`, `{story.intro}`, `{t.body}` | `smarten(…)` on each, as MemoryCard and FamilyNotes do (the measurement in `useFill` is unaffected; the length barely changes) | The family's words look the same on every page |
| bookPages.ts:369 and 376 | `smarten()` on the title and each paragraph as the pages are built | A printed book never sets straight quotes |
| `data/stories.ts:197/203/215`, `data/family.ts:155–236`, `AccountProvider.tsx:46` | ’ in every message a person can see | One voice |
| `` `We couldn’t reach your stories. ${loadError}` `` | Show `loadError` alone, with the data messages worded to stand alone ("We couldn’t load the account: …"), or keep the prefix and pass only the cause | The line never says the same thing twice |

### N13. POLISH: the wall's loading mark lands on a hairline, and the phone chapter head is too tall
**Skill:** impeccable polish ("fix optical as well as mathematical alignment"); taste-skill critique pass 13 ("Is anything lying on top of…"); BAOS 12 (`vh` not divided by `--zoom`).

**Where:**
- `book-account.css:893`: `.wall-sk-mark { position: absolute; left: 0; right: 0; top: 0; }` over `.wall-page`, with the default `.loading-mark { min-height: 40vh }` (astory.css:2293), so the heart centres on the page, 20vh down.
  - At 1366 the first leaf outline's top edge runs through the heart (photographed: it sits on the line at y≈433).
  - At 390 two contents rules and the chapter's foil line run through it.
  - At 1920 it sits near the top-left corner of the middle leaf, so it reads as that card's icon.
  - Under zoom 1.3 the 40vh box grows to 52% of the window.
- `book-account.css:889`: `.wall-sk-head` is the 48px `tall` line at every size. A phone sets the chapter's h2 at 28px (32px box), so the leaf outline sits 15px below where the first leaf lands (672.7 against 658).

**Change:**

| Before | After | Why |
|---|---|---|
| `.wall-sk-mark` over the whole `.wall-page`, 40vh box | Put `<LoadingMark />` inside the first `.wall-sk-leaf` and centre it there (`.wall-sk-leaf:first-child { display: grid; place-items: center; }`, `.wall-sk-leaf .loading-mark { min-height: 0; }`) | The heart draws where the first words will land, inside one outline, and no line crosses it at any width |
| `.wall-sk-head` 48px everywhere | At ≤760px: `height: 32px` | The leaf outline lands where the first leaf does |

### N14. POLISH: no loading state says anything to a screen reader
**Skill:** hallmark interaction-and-states (Loading: "label stays readable"); impeccable craft-floor (States, "keyboard focus" and semantics); BAOS 42.

**Where:**
- `LoadingMark.tsx:10` is `aria-hidden="true"`.
- `WallWait` (Wall.tsx:261) and the Start frame (Start.tsx:185) put `aria-busy` on the root and hide everything else.
- The Shell skeletons do the same. A relative opening the wall's link with a screen reader hears "A Story, link" and then nothing for 1.3s.

**Change:**

| Before | After | Why |
|---|---|---|
| `<div className="loading-mark" aria-hidden="true">` | Keep the drawing hidden and add `<span className="sr-only" role="status">Opening the book…</span>` beside it in LoadingMark | Every wait announces itself once, in the house voice |

## Notes (not gaps)

- **Gate 24 on the new skeleton values:** the 45px rows, the 58, 36 and 39px hairline heights and the 32px phone head (N13) are off the 4px scale. Each one copies a real line box, so the frame lands true, which is the point.
- **The Book plays its arrival twice on a cold load.** The skeleton passes `title="The Book"` and the arrived page passes none, so Shell's `ready` key changes and `arrive()` runs again. That re-splits the new hero, as Shell's comment intends, but it also restarts the sheet from `y: 56, opacity: 0`. Talk and Account keep the same key, so they don't. I couldn't see it with real frames (hidden pane). Watch for a sheet that dips and rises again on the Book's first load. If it does, the fix belongs in `arrive` (skip the sheet tween when the sheet is already settled), not on the page.
- **One observer per leaf** (round 5's note) is unchanged. It is still harmless: zero ongoing writes.
- **Placeholder.tsx:277–286:** the `<main>` children are indented one level short. Cosmetic.

## Skill by skill

- **taste-skill:**
  - Gaps: N13 (the mark lies on a line).
  - Passes:
    - No heading runs past two lines on any page at 390, 1366, 1920 or 2560.
    - Start is one screen at 1366×768 and at 2560×1300. Plans and Talk fit at 1920 and 2560.
    - One live thing per page (the book, today's question, the three ways, the wall's leaves).
    - The wait frames share the page's edges to the pixel (portrait 61/43.2, contents 324, main 385/367.2).
    - No text under 12px outside the printed book anywhere.
- **hallmark:**
  - Gaps: N11 (the skeleton is not the page's shape, by 39px), N12 (straight quotes, a minor anti-pattern) and N14 (the loading label).
  - Passes:
    - Gate 34: scrollWidth equals clientWidth on every page at every size, and on the wall at 3840.
    - Gate 49: no two-line buttons.
    - No target under 44px.
    - Gate 33: every skeleton piece is `aria-hidden`.
    - Gate 10: no `transition: all`.
    - Gate 27: the wall's rise is still behind `@supports` and `no-preference`.
    - The `:where()` default breaks no nowrap affordance (measured above).
- **emil-design-eng:**
  - No new motion. The skeletons are still (no shimmer on something seen once per cold load). The mark is unchanged at 720ms with ease-out.
  - `useFill` sets type in `useLayoutEffect`, before paint.
  - Hovers are still behind `(hover: hover) and (pointer: fine)`.
  - Accepted as before: the 0.9s leaf turn, the 0.45s cover sweep and the 900ms gilt glint.
- **impeccable:**
  - Gaps: N12 (polish §4 punctuation consistency), N11 (polish §5 layout shift), N13 (optical alignment) and N14 (craft-floor states and semantics).
  - Passes:
    - N8, N9 and N10 were fixed at the narrowest level.
    - The new default has zero specificity, so it never fights a rule.
    - Failure still wears the house style (the not-shared wall and `/no-such-page` are one screen at 390 and 1366).
- **GSAP (core, react, timeline, performance, scrolltrigger):**
  - Start's rise is in `gsap.matchMedia` with `clearProps` and `mm.revert()`. Its deps `[who, loaded]` mean the skeleton (no `data-rise`) is a no-op and the arrived step rises once.
  - Nothing new besides that. No ScrollTrigger in scope.
  - gsap-performance on the 18–22px step: it reads and writes in turn, at most four steps on one leaf per pass, with zero writes once settled. Acceptable.
- **Other:** humanizer drove N12. find-skills: nothing further applies.
