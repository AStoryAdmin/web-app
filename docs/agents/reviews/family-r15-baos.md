# Bao's Standard: Family (/family) and Person (/family/:personId), round 15

**PASS.**

Round 14's one failing item is fixed. The dot that floated 17px above a name with a "+" ask beside it now sits level with the name at every width (65c4e2b for the band, b9622c7 for the stack). Every checklist item holds at 1366×768, 1920×1000, 2560×1300, 800×1024 and 390×844, and on the extra widths the brief asked for (320 and 1100).

## This round's brief, item by item

| Item | Verdict | Evidence |
| --- | --- | --- |
| Dot vs title line, band layout (320, 390, 800) | **Fixed** | Every tier of both trees reads 0.0 or −0.3 (dot centre minus the centre of the title's first line). The worst case in round 14 was "Your generation" on the real family at 390 and 800, at −17.3. It now reads −0.3, with "+ a child" on its line. "1910s Rose's parents", with "+ Rose's grandparents" beside it, now reads −0.3 at 390 and 800 and 0.0 at 320. |
| Dot vs title line, stack (1100) | **Fixed by b9622c7** | On 65c4e2b the stack's new `align-items: center` was dead code. The `:is(.tp-label, .tp-tier.home .tp-label, …)` rule above it set `baseline` at higher specificity. So at 1100, 1200 and 1300 the sample's top tier read −2.0, with the label 22.7px tall instead of 21. I measured that before the coordinator's note arrived; Skills r16 found the same thing. After a force-reload on b9622c7, the computed `align-items` is `center`, and every tier reads 0.0 at 1100 and 1300 ("Not placed yet" reads −0.3). |
| Ask vs name (band and stack) | **Holds** | The centre of an ask on the name's line sits 0.0 to 0.3px from the line's centre at 390, 800, 1100 and 1300. The "1910s" decade sits on the name's baseline (difference 0) at every band and stack width. When a title wraps to two lines (the sample's "Rose's children and Margaret's" at 320), the decade stays on the first line. Where an ask wraps (the "+ a child" ask on that tier at 390, "+ Rose's grandparents" at 320), it starts on the heading's own edge, 19px below. |
| Dot, grid layout (1366, 1920, 2560) | **By design** | The grid places each dot level with its tier's portrait, not with the title. At 1366 the dot is −2.0px from the portrait's centre on all five sample tiers, and 2px from it on both real-family tiers at 1100. These widths are unaffected by the fix. |
| Ask hit areas (44px) | **Hold** | I scanned `elementFromPoint` down three columns of each visible ask, at every width. Each ask answers over exactly 44px: the `::after` gives that on the band and stack, where the ask's visible box is 18px, and the button's own `min-height` gives it on the grid. `elementsFromPoint` found nothing interactive under any hit area. No link or button rect intersects one, and that includes the faces 14px below the label. |
| In-app routes, no refit | **Holds** | See the routes table below. One size (`data-size`) is seen from first draw to settle, and the home generation's bottom equals a fresh load's. |
| No "20773 days left" | **Holds** | I watched every count shown, with a MutationObserver or a 20ms poll from load onward. Family's Invitations and Ty's page only ever said "29 days left". That held on fresh loads (Ty's page from load, at 1366, 1920 and 800), on Home → Family, on Ty → Family, and on Family → Ty in-app at 800. |
| The " " escape | **Holds** | The source now says `" "` (FamilyTree.tsx:569, no raw U+00A0 bytes in the file). The live owner phrase is `and·Nhi·Tran's` with real U+00A0 characters (code points 61 6e 64 a0 4e 68 69 a0 …), and no "00a0" text appears anywhere on the page. |
| 2560 snug threads | Ruled open | The sample at 2560 is `data-snug="1"`, size `n`, 0 paths. Not counted. |
| 1px thread start at 1920 | Noted | See note 1. |

## In-app routes against a fresh load

| Width | Route | Sizes seen | Home bottom (fresh) | Threads | Days |
| --- | --- | --- | --- | --- | --- |
| 1366 | Home (force-reloaded) → Family pill | `n` only | 712 (712) | ½px rounding, note 1 | 29 |
| 1366 | Ty → Family pill | `n` only | 712 (712) | ½px rounding, note 1 | 29 |
| 1920 | Home (force-reloaded) → Family pill | `l` only | 823 (823) | identical | 29 |
| 1920 | Ty → Family pill | `l` only | 823 (823) | identical | 29 |
| 800 | Home (force-reloaded) → Family pill | `n` only | 959 (959) | none at this size | 29 |
| 800 | Ty → Family pill | `n` only | 959 (959) | none at this size | 29 |

## Full pass

**Pages**, each on a fresh load at 1366×768, 1920×1000, 2560×1300 (`--zoom` 1.3), 800×1024 and 390×844, 40 loads in all:
- `/family` ("The Vos.") and `/family?preview=tree` ("The Hartleys.");
- Bao Vo (`5aa5a1cf…`) and Ty Ngo (`36cfd520…`);
- `sample-rose`, `sample-claire`, `sample-mark` and `sample-maya`, each with `?preview=tree`.

Both trees were also loaded at 320×700, 1100×900, 1200×900 and 1300×900.

| Check | Result |
| --- | --- |
| Horizontal scroll | None. `scrollWidth` equals `clientWidth` on every load. |
| Text under 12px (rendered, times the zoom) | None. |
| Targets under 44px (counting `::after` hit areas) | None. |
| Clipped text | None. |
| Overlapping text | None visible. At 390 the pair test flags Bao's, Rose's and Claire's memory excerpts against the next title. Each is a 2-line `-webkit-line-clamp` excerpt (`.pp-words`, overflow hidden) whose hidden third line is still laid out. The visible box ends 31px above the next title (Rose: 970 against 1001). Round 14 excluded these too. |
| Left half-faded after settling | None, except the sample's disabled "Invite someone" (`aria-disabled`), which is by design. |
| "Where to next" | Every page, every size. |
| Tree | **Real family:** `t` at 320 and 390; `n` with 0 paths at 800; `n` with 2 paths at 1100 and 1366; `l` with 2 at 1920 and 2560. **Sample:** `t` band at 320, 390 and 800; `t` stacked at 1100 to 1300; `t` with 11 paths at 1366 and 1920; snug `n` with 0 at 2560. |
| Person pages | At 1920 and 2560, Mark and Maya fit one screen (`scrollHeight` equals the window). Ty's state reads "invited · waiting for them", with "Invited with a code, 29 days left; nothing here reaches Ty until they accept." |

Rules 29 and 32–46 hold as in round 14: the three state words, the kept line, Bond's empty states, the cloth hero with its full stop, and "Where to next".

## Notes, not counted

1. **Half-pixel thread rounding on in-app visits.**
   - **What happens:** at 1366, on Home → Family and on Ty → Family, the two threads start at x 377 and 711. On a fresh load they start at 378 and 712. The true centres are 377.5 (the portrait) and 711.5 (the dotted ring), so both are 0.5px off, in opposite directions. At 1920 in-app, the paths now match a fresh load exactly.
   - **The cause:** this is round 14's note 1, the integer `offsetLeft` sum in `measure()`. It lands on different sides of the half-pixel depending on when the redraw falls during the arrival.
   - **Why it is not counted:** you can't see it.
   - **If you want it exact:** the same fix applies: use `getBoundingClientRect()` relative to the plate, divided by `pageZoom()`.
2. **How the pane affected my method.**
   - The shared pane was hidden all session, so no frame was ever drawn and screenshots failed after the first two.
   - Every check is a measurement. Before measuring, I walked each page with real 90ms waits between scroll steps and `__gsap.ticker.tick()`.
   - **Fast ticking alone leaves fades unfinished.** My first 1920 pass reported Rose's "Rose, as the family…" heading and two rows on Bao's page as faded. Those were scroll reveals that had not run in real time, not a product fault. With the timed walk they read opacity 1.
   - **View transitions wait for a frame.** With no frames, an in-app view transition waits too: one ran to its own timeout at about 10s. On the other in-app routes I called `skipTransition()` 1.2s after the click, which applies the same DOM update without the animation.
   - **The iframe runner was dropped.** I tried running the pass in same-origin iframes. Each time, the top page reloaded after one or two frames, so I dropped it and used top-level loads only.
   - **Twice the 800 emulation was cleared mid-load** (the page measured 1006 wide). I discarded those two results and reran them at 800.
3. **Work landed while I reviewed.**
   - b9622c7 (the stack fix), 925d874 (Book round 10, which touched the loading heroes), and three unrelated commits.
   - Uncommitted edits to Archive, Home, Person (the loading hero's held subline), Wall, Write and book-account.css were live in the dev server. I measured Person with them in place but did not review them as a change.
4. **Known:** the founder's test content (Ty Ngo as "Nhi Tran's parent", the two Nhis, friends in "Your generation") and Bond's painterly style.

## How I checked

- **Code read:**
  - the diffs of 65c4e2b, 2047f57 and b9622c7;
  - `useMyCodes.ts` (the prime, the generation guard, `lastAt`) and `expiresLabel`;
  - the `.tp-label`, `.tp-dot` and `.tp-ask` rules in both the band and stack blocks of `family-people.css`, including the specificity of the `:is()` rule.
- **My own pane tab (tab-180):**
  - I force-reloaded first and set the viewport for each width.
  - I measured on every load:
    - dot, title-line, decade and ask centres, and the decade and title baselines (with zero-size probes);
    - each ask's hit extent and what lies under it;
    - `data-size`, `data-stack` and `data-snug`, and the thread path `d` strings;
    - the home tier's bottom;
    - `scrollWidth`, font sizes, targets, clipping, opacity chains, pairwise text overlap and "Where to next";
    - the "days left" text.
- **In-app routes:** a MutationObserver on `data-size` and the page text, from the click to settle.
- **What I touched:**
  - I clicked only navigation links (the Family pill and Ty's node) and wrote no data.
  - My scripts lived in `sessionStorage` keys `bao-r15*`, and I removed them all.
  - I only read whether `astory-app-auth` exists (it does). I never signed out.
  - I reset the viewport to desktop and closed tab-180.

**Not verified:**
- Any visual capture (the pane was hidden).
- A real pointer's hover and press on the asks.
- Making a code on a person page and seeing the list refresh: that would write data. I read it in code only (`mine.reload()` after the code is made, Person.tsx).
- Reduced motion, 3840 wide, and a real Edge zoom.
- The failure and loading states.
- The other three real Person pages.
- The uncommitted edits in note 3.
- vitest and tsc.

## Score (taste floor)

Philosophy 4, hierarchy 4, execution 4, specificity 4, restraint 4, variety 4.

On a phone, a tablet and the stacked laptop band, each generation's dot now sits on its name's line, with the "+" ask level beside it and still a full 44px to touch. In-app visits draw once at the right size, and every invitation counts its days from today. Family and Person pass.
