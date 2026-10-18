# Bao's Standard: Family (/family) and Person (/family/:personId), round 7

**FAIL**

Round 6's three findings are fixed as written, and so are R6-1 to R6-6 from the skills review, as far as I could measure them or read them in the code.

- **Fixed:** the empty Person page now uses three columns from 1600px. At 800, a real person's card is a row. Nobody stands alone in a tree row at 800.
- **Fixed:** the page now sets five type sizes, and reduced motion takes the nudge and the press off the question rows.

The page is close, but it is not the passing round. Six findings remain:

- **The 800px tree still composes a generation wrongly.** The builder asked me to judge the sample's wrap, [Peggy & Jim] / [Frank & Rose & Tom] / [Arthur, +]. It keeps the letter of round 6 (nobody is alone), but it breaks the tree's own logic:
  - The storyteller's sister's couple sits above the storyteller.
  - In the founder's real family, the storyteller lands bottom-left, off the axis.
  - The phone already does this right.
- **Two relatives lists leave one person alone on the last row,** at 1366 and 800.
- **At 800 the sample people's portrait cards are wide boxes of bare paper.**
- **Three smaller faults:**
  - At 390, two state lines run together into one.
  - The quiet "Change … details" button is out of line at 800.
  - The "Add a photograph" link has a split underline.

## Round 6 (Bao's Standard), item by item

| # | Round-6 finding | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | Empty Person page bare on its right half at 1920/2560 | **Fixed** | **1920, Ty:** `.pp-main.bare` is a grid of 919.56px and 380px. The empty state is at 465–1385 and "Ty's family" at 1449–1829, both starting at y 319. **2560 (zoom 1.3), Ty:** the empty state is at 607–1869 and the family at 1952–2446. **2560, Mark:** 607–1884 and 1967–2461, with his four relatives stacked in the right column. Mark's and Maya's pages now fit one 1000px screen at 1920, "Where to next" included (docH 1000). |
| 2 | Portrait card a full-width box at 761–1099 | **Fixed for real people; residual for the samples (finding 3)** | **Ty at 800:** the card is 733×344, down from 552. The 167px seal is on the left and the body runs from 247 to 730. "Nothing with Ty in it yet." starts at y 678 (it was 886), and all three questions end by y 1010, inside the 1024 fold. **Bao at 800:** the card is 733×210, the kept line starts at 544 and the first memory at 850. |
| 3 | One person alone on a tree row at 800 | **Fixed as written; see finding 1** | **Sample:** Arthur now shares his row with the "+" (Arthur at 277–405, the ring at 423–538). **Real family:** the generation splits 2 and 3 (Nhi Tran and GBao Vo above; Bao Vo, Nhi and the "+" below). Nobody is alone. |

## Skills R6-1 to R6-6, re-checked

| # | Verdict | Evidence |
| --- | --- | --- |
| R6-1 the empty page bare on the right | **Fixed** | Measured. See row 1 above. Below 1600 the stacked layout keeps its gap: at 1366 the empty state ends at 658 and "Ty's family" starts at 722. |
| R6-2 the retry drops focus when it lands | Fixed (code) | `useRetryFocus.ts` now takes a `home` and an `again` selector. When the loading line leaves, it focuses the new Try again or `home` if the keyboard is lost. `.pp-state` keeps `tabIndex={-1}` in every state (Person.tsx:326). Not exercised. |
| R6-3 two holds with nowhere to hand focus | Fixed (code) | `Waiting` takes a `fallback` (Waiting.tsx:48, 62). MyCodes holds with `home` (Family.tsx:56), and `section.fp-invites` and `.fp-keep-review` are `tabIndex={-1}` (Family.tsx:256, 271). Not exercised: briefed not to write. |
| R6-4 in-place swaps drop focus; Keepers asks | Fixed (code) | `useFocusNext` is used in Person.tsx:86. Keepers' Remove goes through `useHold` with "Stopped {first} editing" (Keepers.tsx:58–70). Not exercised. |
| R6-5 six type sizes | **Fixed** | The sheet on Rose's page at 1366 sets 13, 18, 28 and 32, with the 58 title on the cloth: five sizes. The 16px arrows in the round "Where to next" buttons and the 17.28px monograms are glyphs that scale with their circles. On a phone, section and statement are both 24 (css:328). |
| R6-6 the arrow still moves under reduced motion | Fixed (code) | The reduced-motion block now sets `.pp-prompts a:hover .pp-q-a, .pp-prompts a:active { transform: none; }`. Not run under emulated reduced motion. |

## Findings, worst first

1. **At 761–1099px, the tree wraps a generation in zone order (left relatives first), so the storyteller is pushed off the axis. The phone already leads with the storyteller; this band does not.**
   - **Where:**
     - `family-people.css:255–256`: `.tp-row` is a flex wrap with `.tp-zone { display: contents }`.
     - `family-people.css:617–621`: the round-7 band only moves `.tp-ghost` last.
     - `FamilyTree.tsx:84–126` (`balance`) keeps that order.
     - The ≤760 block (`css:338–343`) already gives the storyteller's unit `order: -3/-4` and `flex-basis: 100%`.
   - **Size:** 800×1024 (the whole 761–1099 band).
   - **Evidence:**
     - **`/family?preview=tree`, Rose's generation:** three rows, which is the wrap the builder asked me to judge.
       - Margaret & Jim at 271–545 (y 603).
       - Frank & Rose & Tom at 187–629 (y 798).
       - Arthur and "+" at 277–538 (y 1010).
       - The held row is 445px wide inside a 703px column.
       - One generation takes y 603–1153, which is 550px of a 1024px screen.
       - **Judgement:** the wrap fails. Height means generation everywhere else on this tree. Here the sister's couple sits between Rose's parents ("father", "mother" at the top of the screen) and Rose, so it reads as a generation in between. The storyteller is demoted to row 2 of her own tier.
       - **Two rows would fit:**
         - Frank & Rose & Tom alone on the axis is 442px.
         - Margaret & Jim, Arthur and "+" are 274 + 128 + 115 + 2×18 = 553px.
         - Both are under 703px, nobody is alone, and the generation would be about 370px tall.
     - **`/family` (the founder's real family):** Nhi Tran and GBao Vo (friends) take row 1 at 263–553. Bao Vo, the storyteller, is bottom-left on row 2 at 172–348 (centre 260), while his parents' tier is centred on 407. **At 390** the same tree puts Bao first, centred, on a row of his own (50–370), and the sample puts Frank & Rose & Tom first. The two narrow sizes disagree about who leads.
   - **Rules:**
     - 30 (organised by generation relative to the storyteller).
     - 10 (columns align; the storyteller's line is the axis).
     - 9 (a three-row generation where two would do).
     - 1 (the phone's rule is not applied to the next band up).
   - **Fix:** in 761–1099, do what the phone does. The storyteller's unit goes first on its own centred row (`order: -4; flex-basis: 100%`), and `balance()` then splits the rest beneath it, with the "+" last:
     - Sample: [Frank & Rose & Tom] / [Margaret & Jim, Arthur, +].
     - Real: [Bao Vo] / [Nhi Tran, GBao Vo, Nhi, +], which is 585px wide.

2. **The relatives lists leave one person alone on the last row.**
   - **Where:** `.pp-extras .pk-list`, a three-column grid (262px tracks at 1366, 231px at 800), on any page where the stacked layout is used (below 1600px).
   - **Sizes:** 1366 and 800. At 1920 and 2560 the list is a single column, so it holds.
   - **Evidence:**
     - **Rose's family (10 people):** the rows are 3/3/3/1. Mark Keller is alone on row 4: 448–710 at y 1970 at 1366, and 26–257 at y 2264 at 800. The screenshot at 1366 shows him alone under the three columns.
     - **Mark's family (4 people):** the rows are 3/1. Rose Hartley is alone: 448–710 at y 841 at 1366, and 26–257 at y 1057 at 800.
   - **Rule:** 10 ("no single card alone in a row").
   - **Fix:** choose the column count from the number of people so the last row never holds one:
     - 4 people: two across (2/2).
     - 10 people: four across (4/4/2), or five across.
     - In general, avoid any count where `n % columns === 1`.

3. **At 800, a sample person's portrait card is a full-width box with one or two small lines parked in its top corner.**
   - **Where:** the round-7 band, `family-people.css:607–614`. `.pp-plate` is a grid of 160px and 1fr with `align-items: start`. The sample plate has no actions, so `.pp-plate-body` holds only the state, and sometimes a count.
   - **Size:** 800 (761–1099).
   - **Evidence:**
     - **Rose:** the card is 733×252 with a 160×200 arch. The body is 247–730 × 321–371, so 50px of text ("on A Story", "13 memories · 1952 to 2026") sits above about 480×150 of bare paper.
     - **Mark:** the card is 733×200, and the body is one 24px line ("not on A Story yet") at its top.
     - Claire and Maya are built the same way.
     - The sample is the family the founder shows people ("A sample family, for looking").
   - **Rules:** 9 (no card huge for a small amount of information), 18 ("never a … empty card").
   - **Fix:** in the band:
     - Centre the body against the portrait (`align-items: center`).
     - When the body has two lines or fewer, bring the portrait down to about 120px. The card is then about 170px tall, and its words sit beside the face.
     - Or let the plate be `width: fit-content` so it is no wider than what it says.

4. **At 390, two state lines in the tree run together into one.**
   - **Where:** `/family`, "Your generation", the Nhi Tran and GBao Vo row. `.tp-row { gap: 16px 6px }` at ≤760 (css:337), and "not on A Story yet" is set on one line.
   - **Size:** 390.
   - **Evidence:**
     - The two lines sit on one baseline (y 976) at 78–208 and 212–342: a 4px gap.
     - Nhi Tran's line also overruns its 128px face (79–207) by a pixel each side.
     - On screen it reads "● not on A Story yet ● not on A Story yet".
     - The sample tree at 390 has no pair closer than 14px.
   - **Rules:** 16 (small print legible and quiet), and the checklist's "no clipped or overlapping text".
   - **Fix:** at ≤760, let the state wrap inside its face (`max-width: 100%`, breaking to "not on" / "A Story yet" as "invited" / "waiting for them" already does), or raise the row's column gap to at least 16px.

5. **At 800, the quiet "Change {name}'s details" button's words hang 17px inside the column every other line starts on.**
   - **Where:** `.pp-plate-body .btn.quiet.sm.pp-edit` in the round-7 band.
   - **Size:** 800.
   - **Evidence:**
     - **Ty:** the body's text edge is 246 (the photo link, the state, the note, the code, and the outline button's box). "Change Ty's details" starts its text at 263.
     - **Bao:** the same. Three lines at 251 on screen, then "Change Bao's details" at 268, alone on its line.
   - **Rule:** 10 (columns align).
   - **Fix:** in the band, pull the quiet button's padding out of the column (`margin-left: -17px`), as `.arc-task` already does on the dating row.

6. **The "Add a photograph of {name} →" link draws two underlines, split by a flex gap. This is the fault round 5 removed from `.pp-write` and `.st-act`.**
   - **Where:** `.pp-addphoto` (`display: flex; gap: 6px`, with the arrow as a block `span`), on every real person's plate.
   - **Sizes:** all. I measured it at 390 and 800 (computed style), and it is visible in the 800 and 390 captures.
   - **Evidence:** `.pp-addphoto` computes to `flex`, gap 6px, `text-decoration: underline`, with the arrow span `display: block`. The other arrow links on these pages (`.pp-write`, `.st-act`) are `inline-block` with an inline arrow and one underline.
   - **Rules:** 1 (a fix is applied everywhere), 16.
   - **Fix:** give `.pp-addphoto` the same treatment: `display: inline-block`, with the arrow `span` inline.

## Notes, not counted

- **Known:** the founder's test content (Ty Ngo as "Nhi Tran's parent", the two Nhis, friends in "Your generation") and Bond's painterly style.
- **Where the sibling "+" sits.** From 1366 up, "a sister or brother" sits between the storyteller's unit and Arthur (sample) or Nhi (real), while the band and the phone put it last. Beside the storyteller it reads as the missing sibling's place, so I accept it. If finding 1 is fixed, check that the band and the desktop still read as the same tree.
- **A list of one.** "Ty's family" has one relative, at 448–710 at 1366 with bare paper beside it. That is the data, not the layout.
- **Ty at 1920.** Under the 340px empty state, y 659–889 is bare beside the 570px plate before "Where to next". This is the one rest on a page with nothing in it yet, so I did not count it.
- **Prints in a background tab.** On Bao's rail the prints stayed blank in my tab: `loading="lazy"`, `currentSrc` empty. A `new Image()` of the same signed URL loaded at 1122px wide. This is the same background-tab deferral as round 6. On Rose's and Claire's pages the prints loaded.
- **Scroll reveal.** On Rose's lower rail at 1920 the reveal was caught mid-fade in one capture. Three seconds later nothing on `.pp2` was under 0.99 opacity.
- **Load time.** Person pages mounted about 6.7s after navigation. Four `/auth/v1/user` calls took 2.0–2.9s each. That is the back end and the shell, not this page's design, but the founder will feel it.
- **Shell.** From 1366 up, the top bar shows a BV seal before "Bao Vo ⌄" and a second BV avatar after "Add". This is outside these pages.
- **Question copy.** "What rules did Maya have in their house?" uses the bank's neutral "their" for a known granddaughter. It is not wrong.
- **The faint "A" watermark** behind the last "Where to next" row ("The book") at 800 is the site-wide sheet mark. It is faint enough to read through.

## How I checked

- **My own pane tab (tab-123):** I force-reloaded it at each size. At the end I reset its viewport to desktop and closed it. It was the only tab listed in the pane, so the pane may have closed with it. The sign-in lives in the profile and was not touched.
- **Sizes:** 1366×768, 1920×1000, 2560×1300 (html zoom 1.3, confirmed), 800×1024 and 390×844.
- **Pages:**
  - `/family` at all five sizes.
  - `/family?preview=tree` at 800, 1366, 2560 and 390.
  - Ty Ngo at 800, 1366, 1920, 2560 and 390.
  - Bao Vo at 800, 1366 and 390.
  - `sample-rose` at 1920, 1366, 800 and 390.
  - `sample-claire` at 1920.
  - `sample-mark` at 1920, 2560, 1366, 800 and 390.
  - `sample-maya` at 1920.
- **Measurements:**
  - getBoundingClientRect for every tree unit, row and tier, the plate, the plate body, the portrait, the main grid, the empty state, the questions and each relative card.
  - Range rects for where text starts and for the gaps between state lines.
  - Computed styles: the grid tracks, the arrow links' display, gap and decoration, and font sizes.
  - scrollWidth against clientWidth on every page and size: no horizontal scroll anywhere.
  - No text under 12px. No link, button or input under 44px tall.
  - Every page ends with "Where to next".
  - No console errors.
- **Code read:**
  - `family-people.css` (rounds 5 to 7).
  - `FamilyTree.tsx` (`balance`).
  - `useRetryFocus.ts` and `useFocusNext.ts`.
  - The `useHold` call sites in `Family.tsx`, `Person.tsx`, `Keepers.tsx` and `Waiting.tsx`.
- `__gsap` is not exposed on this build, so I waited for the page to mount, then 2.5–4.5s.
- Nothing was clicked or typed: I moved between pages by URL only. I used three `sessionStorage` keys of my own for the measuring scripts and removed them. I never touched `astory-app-auth`.

**Not verified:**

- Take back, the held lines, the retries and the focus hand-offs, live. I judged them from code, as briefed.
- Hover, focus-visible and active states with a real pointer.
- Reduced motion (code only).
- A 3840 pass at zoom 2.
- The failure states.

## Score (taste floor)

Philosophy 4, hierarchy 4, execution 3, specificity 4, restraint 4, variety 4.

The page fails on:

- finding 1 at 761–1099 (rules 30, 10, 9);
- finding 2 at 1366 and 800 (rule 10);
- finding 3 at 800 (rules 9, 18);
- findings 4 to 6, which are polish at single sizes.

Everything from rounds 4 to 6 still holds at 1920 and 2560.
