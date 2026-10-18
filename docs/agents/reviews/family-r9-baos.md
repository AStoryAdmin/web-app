# Bao's Standard: Family (/family) and Person (/family/:personId), round 9

**FAIL** (one small finding)

Both round-8 findings are fixed, and so are both notes from the round-8 skills review. The fresh pass at 1366, 1920, 2560, 800 and 390 found one fault, and it is on the element this round added.

- **Fixed:** at 761–1099 the slim plate and the kept-line plate now share the column's left edge on Rose's and Claire's pages.
- **Fixed:** at 390 (and at 360) the sample tree no longer leaves "a child" alone on a row. The ring now stands by "Rose's children".
- **Still wrong, rule 10:** on a phone, a ring that wraps under its tier's name keeps a 12px left margin. That margin was written as the gap beside the heading, so the wrapped ring sits 12px inside the edge that "1960s", "1910s" and "Not placed yet" share. The new "a child" ring has the fault, and so does the older "Rose's grandparents" ask.

## Round 8, item by item

| # | Round-8 item | Verdict | Evidence |
| --- | --- | --- | --- |
| Baos 1 | At 761–1099 the slim plate sits flush left while the kept-line plate is centred | **Fixed** | `family-people.css:664–668`: in the band, `.pp-plate.slim { min-width: 0 }` and `.pp-words-plate { margin-inline: 0 }`. **Rose at 800:** the plate is at 26–409 (y 294–486) and the kept line at 26–519 (y 526–690). "What Rose has told" starts at 26. **Claire at 800:** the plate is at 26–404 and the kept line at 26–519. **Rose at 1000:** 32–415 and 32–525 on a 32–953 column. **At 1366, 1920 and 2560** the kept line is still centred in the main column (615–1108 in 448–1275; 883–1593 in 607–1869), as before. |
| Baos 2 | At 390 the "a child" ring is alone on a row | **Fixed** | `FamilyTree.tsx` `liftLoneRings()`. **At 390:** the tier carries `data-ghost-up`. "⊕ a child" (`.tp-ask-alt`, 44px tall, 13px Montserrat in the ask's grey) sits under the heading at y 1575. Anne & Mark take the first row and Daniel and Claire the second; nothing is alone. **At 360:** the same, with rows of 1 and 2. **Every other tier at 390 and 360 holds:** "Arthur" with "+", "Sam" with "+", and on the real family "Nhi" with "+". **In the band and on a desktop nothing is lifted:** 761, 800, 1000 and 1099 after a fresh load; 1366, 1920 and 2560 with threads on. At 800, Rose's children are 2/2 at 761 and one row of four at 800, 1000 and 1099. The hidden duplicates are `display: none`, so the keyboard and screen readers get one "+" per generation. |
| Skills note 1 | Drop the slim plate's 420px floor | **Done** | **Plates are now as wide as their words:** Rose 383px, Claire 378, Mark 346 (words end at 339) and Maya 295 (words end at 288). |
| Skills note 2 | Four across at 761–1099 for odd counts (7, 11) | **Unchanged; still not testable** | No family in the data has 7 or 11 relatives. The skills review called it the right trade; I agree and leave it. |

## Findings, worst first

1. **On a phone, a "+" ask that wraps under its tier's name keeps the 12px margin meant for sitting beside the heading. The dashed ring stands 12px inside the edge every other line of the label uses.**
   - **Where:** `family-people.css:250`, inside `@media (max-width: 1099px)`: `.tp-label h3 + .tp-ask, .tp-label .tp-ask + .tp-ask { margin-left: 12px; }`.
     - The new `.tp-ask-alt` follows the `h3`, so it takes the rule.
     - Wherever the ask wraps onto its own line, the margin turns from a gap into an indent.
   - **Size:** 390×844 (and 360). At 800 both asks fit beside their headings, and there the margin is a correct gap. Examples at 800: "Rose's grandparents" at x 211 on the heading's line, and on the real family "a child" at 178.
   - **Evidence, `/family?preview=tree` at 390:**
     - "1960s" starts at x 50. The lifted "a child" button and its ring start at x 62, with a computed `margin-left: 12px`.
     - "1910s" starts at 50 and "Rose's grandparents" at 62.
     - In the same column, "Not placed yet" and "Say who they are to Rose." start at 50.
     - It shows in the capture: the ⊕ visibly hangs in from the "1960s" above it.
   - **Rules:** 10 (columns align). This is the same class of fault as round 7's finding 5: a quiet control 17px inside its column, which was counted and fixed.
   - **Fix:** drop the margin and space the label with a flex `column-gap` instead (`.tp-label { display: flex; flex-wrap: wrap; align-items: baseline; column-gap: 12px }` at ≤1099). Then the ask keeps its 12px beside the heading and starts flush at 50 when it wraps.

## Notes, not counted

- **Rose's and Claire's first screen at 900–1099.**
  - **The cards are stacked.** The slim plate (383px) and the kept line (493px) are stacked at the column's left, with 428–538px of bare paper beside them.
  - **They would fit side by side.** Together they need about 900px, and the column at 1000 is 921px wide.
  - **On a desktop** they already sit side by side, with the plate in the side column and the kept line at the head of the main.
  - **At 800** stacking is right, because they need 876px in a 733px column.
  - **Why I didn't count it:** none of the five review sizes is affected, nothing breaks the checklist, and edges hold.
  - **If the builder wants the band to use its width:** set `.pp-side` and the kept line in one row once the column is 900px or wider.
- **Bao's page at 800.**
  - **His plate is still full width.** It is 733px wide for words that end at 430, because `slim` is still keyed on "no actions".
  - **The kept line has moved.** Under the plate it now starts at 26, where it used to be centred. The two framed cards share the left edge, and the right edges are 759 and 519. That holds under rule 10, and it is the same edge every section below uses.
  - **Round 8's note stands:** key `slim` on how much the body says, so real people and samples behave alike.
- **The same "& Margaret's" order question as before.** On the phone, Rose's children read "Anne & Mark", then "Daniel, Claire". At 800 and on a desktop they read "Claire, Daniel, Anne & Mark". The zone order is unchanged since round 7 and was accepted then.
- **Known:** the founder's test content (Ty Ngo as "Nhi Tran's parent", the two Nhis, friends in "Your generation", the "Ty Ngo & Bao." title) and Bond's painterly style.
- **Prints in a background tab.** Bao's two prints showed blank in the first capture at 800 and 1920. Both had loaded (`naturalWidth` 1122 and 1200, opacity 1); this is the same decode lag as rounds 6–8.
- **Live resize in a background tab.** My tab drew no frames (`requestAnimationFrame` never fired in 1s), so the tree's ResizeObserver did not run when I changed the viewport. A row then kept the balance it had at the previous width. After a fresh load at each width the tree was right every time, so every tree measurement above is from a fresh load. A real window redraws through the observer; I did not see that path run.
- **Scroll reveal.** `.pp-head` and `.pp-more` sit at opacity 0 below the fold until reached. Scrolled into view, they reached 1 (0.9999 and 1) within the 1s heartbeat in `lib/arrive.ts`.

## How I checked

- **My own pane tab (tab-136).** I reloaded it at each size. At the end I reset its viewport to desktop and closed it.
- **Code read:**
  - The aee55a5 diff: `FamilyTree.tsx` (`liftLoneRings`, the alt asks, the `draw()` change) and `family-people.css:657–668`.
  - The ≤1099 label rules (`family-people.css:244–256`).
  - `balance()`.
  - `lib/arrive.ts` (the reveal's fallbacks).
- **Served code confirmed:** Vite served `liftLoneRings` and the round-9 CSS block.
- **Sizes and pages:**
  - **390×844:** `/family`, `/family?preview=tree`, sample-rose and Bao.
  - **360×780:** the sample tree.
  - **800×1024:** `/family`, the sample tree, Rose, Claire, Mark, Maya, Bao and Ty.
  - **761, 1000 and 1099:** the sample tree; Rose also at 1000.
  - **1366×768:** `/family`, the sample tree, Rose, Mark and Ty.
  - **1920×1000:** `/family`, the sample tree, Bao and Claire.
  - **2560×1300:** `/family`, the sample tree and Rose (`--zoom` 1.3000, html zoom 1.3).
- **Measured on every page:**
  - getBoundingClientRect for every tree unit, node, ghost and ask, by tier and row.
  - The plate, its portrait and the line boxes of its body (Range rects), the kept-line plate, the main and side columns, and the section headings.
  - Computed margins, opacity and font sizes.
- **Results on every page and size:**
  - scrollWidth equals clientWidth.
  - No text under 12px. The 12s are the running head, the folio, "Press ? for shortcuts", the bar's seal and the phone's tab labels.
  - No link, button or input under 44px tall.
  - Every page ends with "Where to next".
  - Nothing in view stayed under opacity 0.99 except the hover-only captions (`.tp-cap`) and the sample's disabled "Invite someone" (`aria-disabled`, 0.65), both by design.
- **Animation:** I stepped `window.__gsap.ticker.tick()` 300 times and called `__st.update()` before each measurement.
- **What I touched:**
  - I clicked nothing and moved between pages by URL only.
  - I kept my measuring script in one `sessionStorage` key of my own and removed it.
  - I read only whether `astory-app-auth` exists, to confirm the sign-in was intact. I never wrote, removed or signed out.

**Not verified:**
- The tree's redraw on a live window resize (see the note above).
- Hover, focus-visible and active states on the new ring with a real pointer. In code they come from `.tp-ask`: a 2px terracotta outline, scale 0.97 and an accent hover.
- Reduced motion (nothing new moves).
- A 3840 pass.
- The failure states (unchanged this round).
- vitest and tsc (not run by me).

## Score (taste floor)

Philosophy 4, hierarchy 4, execution 4, specificity 4, restraint 4, variety 4.

The page fails only on finding 1, at 390 (rule 10): a single margin. With it fixed, Family and Person pass this standard at all five sizes as far as I measured them.
