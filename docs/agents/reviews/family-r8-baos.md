# Bao's Standard: Family (/family) and Person (/family/:personId), round 8

**FAIL**

All six round-7 findings are fixed, and so are R7-1 to R7-3 from the skills review, as far as I could measure them or read them in the code.

- **Fixed:** at 800 the tree now leads with the storyteller on the axis, on both the sample and the real family. The phone and the tablet now agree about who leads.
- **Fixed:** no relatives list leaves one person alone, at any size.
- **Fixed:** the sample people's portrait cards at 800 are now small, and their words sit level with the face.
- **Fixed:** the three smaller faults (the state lines at 390, the quiet button's edge, the split underline).

This is not the passing round. Two findings remain, both rule 10:

- **At 800, the round-8 slim portrait card sits flush left while the kept-line plate under it is centred.** On Rose's and Claire's pages, the first two framed things on the sheet stand on two different axes.
- **At 390, the sample tree leaves the "a child" ring alone on its own row.** I missed this in round 7; it is the phone's half of the round-6 orphan rule.

## Round 7 (Bao's Standard), item by item

| # | Round-7 finding | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | The 800 tree wraps a generation in zone order and pushes the storyteller off the axis | **Fixed** | **Sample at 800:** Frank & Rose & Tom have a row of their own (the unit centred in 56–759, y 603). Margaret & Jim (131–405), Arthur (423–551) and "+" (569–684) follow at y 797. The generation now takes y 603–958, 355px (it was 550). **Real family at 800:** Bao Vo leads alone on the axis (y 594). Nhi Tran, GBao Vo, Nhi and "+" follow at 115–700, y 825. That row is centred on 407.5, and so is the parents' tier (Ty Ngo and "+", 269–546). **At 1366** the storyteller's unit is centred on 755, the same as his parents' unit. The band, the desktop and the phone now read as one tree. |
| 2 | Relatives lists leave one person alone | **Fixed** | `Kin.tsx` picks the column count. **Rose (10):** four across at 1366, rows 4/4/2 on 192px tracks. Every name fits on one 20px line and none is clipped. At 800 the list is two across, 5 rows on 357px tracks. **Mark (4):** 2/2 at 1366 (448–1275) and at 800. **Claire and Maya (2):** one row. At 1920 and 2560 the list is still a single 380px column, and on a phone it is a single column. |
| 3 | Sample portrait cards at 800 are wide boxes of bare paper | **Fixed; see finding 1** | **Rose:** the plate is `slim`, 420×192, with a 120×150 arch. Her two lines sit at y 369–413, level with the portrait's middle (316–466). **Mark:** 420×154, with one line beside the seal. **Claire:** 420×192. |
| 4 | Two state lines run together at 390 | **Fixed as written** | At ≤760, `.tp-row` now has a `column-gap` of 16px. On `/family` at 390, Nhi Tran's and GBao Vo's "not on A Story yet" sit at 73–203 and 217–347, a 14px gap (it was 4px). The gap is 14px, not 16px, because each 130px line still runs 1px past its 128px node on each side. 14px is the sample tree's own floor at 390, and on screen they read as two lines. |
| 5 | The quiet "Change … details" button 17px inside the column at 800 | **Fixed** | **Ty:** the column's text edge is 247 and "Change Ty's details" now starts at 248. **Bao:** 247 and 248 (`margin-inline-start: -16px` in the band). The button is still 44px tall. |
| 6 | "Add a photograph" draws two underlines | **Fixed** | `.pp-addphoto` computes to one underline (`underline`, gold at 35%, 4px offset), with the arrow `span` inline and undecorated. At 800 the link's display computes to `block`, because the plate body is a flex column; it is still one line box with one underline. Seen at 800 and 390. |

## Skills R7-1 to R7-3, re-checked

| # | Verdict | Evidence |
| --- | --- | --- |
| R7-1 a second failure drops focus to `<body>` in four places | **Fixed (code, plus a browser check)** | `useRetryFocus.ts:63` now counts a connected node without `tabindex="-1"` as gone. I tested the timing this depends on in this Chromium: I focused a `<p tabindex=-1>`, removed its tabindex as React's patch does, and read `document.activeElement` in a `setTimeout(0)`. It was already `BODY`, so `lost()` is true and the hand-off runs. **Not run live:** my GET-rejecting `fetch` wrapper caught 0 requests (the client keeps its own `fetch`), and two Vite full reloads interrupted the attempt (see Notes). |
| R7-2 "Change Ty's details" 17px right of the column | **Fixed** | Same as row 5 above. |
| R7-3 the Keepers held line takes the list's 12px gap | **Fixed (code)** | `family-people.css:639`: `.keeperlist li.held { flex-wrap: wrap; gap: 0 0.3em; }` (specificity 0,2,1) outranks `astory.css:1029` (0,1,1). `Keepers.tsx:105` renders `HeldLine as="li"`. Not exercised: the founder has no other keepers. |

## Findings, worst first

1. **At 761–1099px, the new slim portrait card stands flush left, while the kept-line plate under it is centred. The page's first two framed objects sit on two different axes.**
   - **Where:** `family-people.css`, the round-8 band:
     - `.pp-plate.slim { width: fit-content; min-width: min(100%, 420px) }` with no inline margin, so the plate sits at the column's left edge.
     - `.pp-words-plate` keeps its centring.
     - This affects the person pages with a kept line (`.pp-main.three`) whose plate is slim: the samples Rose and Claire.
   - **Size:** 800×1024 (the whole 761–1099 band).
   - **Evidence:**
     - **Rose:** the plate is at 26–446 (y 294–485). The kept-line plate is at 146–639 (y 525–688), centred on the 26–759 column. The left edges are 120px apart and the right edges 193px apart, 40px apart vertically. Below them, "What Rose has told" goes back to 26.
     - **Claire:** the plate is at 26–446 and the kept line at 146–639.
     - In the captures, a small card hugs the left with about 310px of bare paper beside it. A centred card under it belongs to neither edge.
     - On the bare pages (Mark, Maya) the slim plate and the empty state both start at 26. Those hold.
   - **Rules:** 10 (columns align), and the craft rule that edges are reused on purpose.
   - **Fix:** in the band, put the two plates on one axis. On a page with a kept line, centre the slim plate (`margin-inline: auto` when `.pp-side` is followed by `.pp-main.three`). The other way is to start the kept-line plate at the column's left edge in the band.

2. **At 390, the sample tree leaves the "a child" ring alone on its own row under Rose's children.**
   - **Where:** `/family?preview=tree`, the "Rose's children" tier. At ≤760, `.tp-ghost` goes last, and nothing balances the rows on a phone (`balance()` only runs in 761–1099).
   - **Size:** 390×844.
   - **Evidence:**
     - Anne & Mark take the first row (50–370, y 1587).
     - Daniel and Claire take the second (74–202 and 218–346, y 1764).
     - The "+" with "a child" stands alone on a third row (158–262, y 1923–2036). It is 113px of height for one dashed ring.
     - Three items of 128 + 128 + 104px plus two 16px gaps need 408px in a 320px column, so it cannot join them.
     - Every other phone tier holds: Rose's generation ends Arthur and "+", the grandchildren end Sam and "+", and the real family ends Nhi and "+".
   - **Rules:** 10 ("no lone icon on a row"), and 1 (the round-6 orphan rule was applied to the tablet band, not to the phone).
   - **Fix:** at ≤760, when the "+" would fall alone on the last row, set it as the small inline ring beside the tier's heading ("⊕ a child"). The page already does this beside "Your generation" on the real family.

## Notes, not counted

- **Known:** the founder's test content (Ty Ngo as "Nhi Tran's parent" in "Your parents", the two Nhis, friends in "Your generation", the "Ty Ngo & Bao." title) and Bond's painterly style.
- **Bao's plate at 800** is still 733×210 for words that run from 247 to 430. `slim` is keyed on "no actions here", and Bao's plate has one ("Change Bao's details"). Round 7 accepted this card and I do too. If the fix for finding 1 changes how the band sizes plates, key `slim` on how much the body says rather than on whether it has an action, so that real people and samples behave alike.
- **The state lines at 390** still run 1px past their faces. Letting the state wrap inside its face would remove that pixel and the 14px question for good.
- **Claire's and Maya's family (2 people)** use three tracks with two filled. That is one row with nothing alone, so it holds.
- **Scroll reveal.** `.pp-more` on Bao's page and `.pp-head` on Rose's sat at opacity 0 below the fold until scrolled to. Then they reached 1 and nothing on the page stayed under 0.99.
- **Prints in a background tab.** At 1920, Bao's two prints showed blank in the first capture. Both had loaded moments later (`naturalWidth` 1122 and 1200), the same background-tab decode lag as rounds 6 and 7.
- **Load time.** Mark's page at 1366 was still on "Opening the book…" 7s after the reload. This is the back end and the shell, as in round 7.
- **A moving dev server.** At 04:31 another agent edited `src/components/archive/transcript.ts`, and Vite reloaded my tab twice. The family files (`family-people.css`, `Kin.tsx`, `FamilyTree.tsx`, `Person.tsx`) were last written at 04:16–04:18, before my pass, so every measurement above is of the round-8 code.

## How I checked

- **My own pane tab (tab-132):** I force-reloaded it at each size. At the end I reset its viewport to desktop and closed it. The sign-in lives in the profile and was not touched.
- **Sizes:** 1366×768, 1920×1000, 2560×1300 (`--zoom` 1.3000, html zoom 1.3, confirmed), 800×1024 and 390×844.
- **Pages:**
  - `/family` at all five sizes.
  - `/family?preview=tree` at all five sizes.
  - Ty Ngo at 800 and 390.
  - Bao Vo at 800, 1920 and 2560.
  - `sample-rose` at 800, 1366, 1920, 2560 and 390.
  - `sample-mark` at 800, 1366 and 1920.
  - `sample-claire` at 800 and 1920.
  - `sample-maya` at 1920.
- **Measurements:**
  - getBoundingClientRect for every tree unit, node and ghost by row and tier, the plate, its portrait and body, the kept-line plate, the main grid and each relative.
  - Range rects for where each line of the plate body starts, and for the state lines on a shared baseline.
  - Computed styles: grid tracks, the photo link's display and decoration, the row gap, opacity and font sizes.
- **Results at every page and size measured:**
  - scrollWidth equals clientWidth: no horizontal scroll.
  - No text under 12px; the 12px is only the running head, the folio and "Press ? for shortcuts".
  - No link, button or input under 44px tall.
  - The sheet sets 13, 18 and 28, plus the kept line at 32 or 36.
  - Every page ends with "Where to next".
- **Code read:**
  - `family-people.css`, rounds 6 to 8.
  - `Kin.tsx`, `useRetryFocus.ts` and `HeldLine.tsx`.
  - The `Keepers.tsx` held row.
  - `Person.tsx`'s `slim` condition.
- **Animation:** I stepped `window.__gsap.ticker.tick()` 200–300 times and called `__st.update()` before each measurement and capture.
- **What I touched:**
  - I clicked nothing that writes.
  - I moved between pages by URL. The one exception was the failure test, where a script clicked two in-app nav links (Archive, then Family); the test never took effect.
  - I wrapped `fetch` (GET only) and `focus` in my tab for that test; the reloads cleared both.
  - I added one test `<p>` to the body and removed it.
  - I used two `sessionStorage` keys of my own for the measuring scripts and removed them.
  - I never touched `astory-app-auth`.

**Not verified:**

- The retry hand-offs and the held lines, live; I judged them from code and the one timing test.
- Hover, focus-visible and active states with a real pointer.
- Reduced motion (code only).
- A 3840 pass at zoom 2.
- The failure states.

## Score (taste floor)

Philosophy 4, hierarchy 4, execution 4, specificity 4, restraint 4, variety 4.

The page fails on:

- finding 1 at 761–1099 (rule 10);
- finding 2 at 390 (rules 10 and 1).

Both are single-rule alignment faults. Everything from rounds 4 to 7 still holds at 1366, 1920 and 2560.
