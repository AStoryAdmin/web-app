# Bao's Standard: Family (/family) and Person (/family/:personId), round 6

**FAIL**

All eight round-5 findings are fixed, and so are R5-1 to R5-8 from the skills review, as far as I could check them by measuring or reading the code.

- The question links now open their questions. I opened `/write?with=<Ty>&about=child-house-rule` and only looked. The writer showed "A question about Ty" with "What rules did Ty have in their house?" as its title.
- Each arrow now sits 10px from its words.
- The section gap is back at 1366.
- The plate is centred and the leaf sits after the closing mark.
- No "·" is left at the end of a line.

The page still fails, on three findings:

- **The builder's stacked empty Person page does not hold at 1920 or 2560.** Everything on it sits in the left half of the column, and the right half is bare paper for the whole height of the empty state.
- **At 800×1024, the size new to this round, the portrait card is a full-width box.** The empty state, or the memories, start below the fold.
- **At 800, the tree leaves one person alone on a row.**

## Round 5 (Bao's Standard), item by item

| # | Round-5 finding | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | Questions don't carry their question | **Fixed** | Ty's rows link to `/write?with=36cfd520…&about=open-born-where`, `…&about=child-house-rule` and `…&about=work-journey`. "Write a memory with Ty →" keeps `/write?with=…`, so there are no longer four links to one URL. I opened one, view only: the writer's h1 is "What rules did Ty have in their house?" under the kicker "A question about Ty". In the sample, all four links are inert (`aria-disabled`), which also clears the round-5 note about the preview treating them differently. |
| 2 | Section gap lost at 1280–1599 | **Fixed** | At 1366 on Ty's page, the last question's rule ends at y 646, the empty state ends at 654, and "Ty's family" starts at 718: a gap of 64–72px, against 22px inside the empty state. The override is gone from the stacked layout. |
| 3 | Plate alone at the left of its row | **Fixed** | `margin-inline: auto`. On Bao's page the plate is 615–1108 in a 448–1275 column at 1366, and 883–1593 in 607–1869 at 2560 (centred to the pixel). On Rose's page at 1920 it is 652–1198 in 465–1385. The line is 32px at 1366 and 36px from 1600 up. |
| 4 | Arrows far from their words | **Fixed** | The list is capped at 560px. Each arrow sits 10px after its question at 1366, 1920 and 2560 (for example, the text ends at 878 and the arrow is at 888 at 1920). |
| 5 | Phone dating task past the column | **Fixed** | At 390 on Bao's page, the task is 24–345 and the archive link 24–258, both inside the 24–370 column, aligned and one line each. |
| 6 | Leaf inside the quotation | **Fixed** | The markup now ends `…opportunity.”<svg class="pp-leaf">`. |
| 7 | Dangling "·" | **Fixed** | **Phone heroes:** each part sits on its own line with no dots ("A sample family" / "Rose's niece" / "Born 1972", and "A sample family, for looking" / "Four generations, so far" / "16 people, 1 not placed yet"). **Tree:** at size `l` the state reads "invited · waiting for them" on one line (Ty at 1920 and 2560). At sizes `n` and `t` it sits on two lines without the dot (1366, 800, and the sample at 2560). |
| 8 | Questions that don't fit the person | **Fixed** | `fitsPerson` drops `faith-house-had` and the parents' questions, old prices and grandparents unless born by 1975, working-life questions for people born after 1998, and present-tense questions for the dead. Maya (1998) now gets "What did the family call Maya that nobody else did?", "What was Maya good at outdoors as a kid?" and "What work did Maya do the longest?". The tense of that last one is a note, not counted. |

## Skills R5-1 to R5-8, re-checked

| # | Verdict | Evidence |
| --- | --- | --- |
| R5-1 the questions drop the question | **Fixed** | Measured. See row 1 above. `firstNameOf` now returns `""`, so the fallback reads "this person" and never "them's". |
| R5-2 one-tap "Take back" | Fixed (code) | `Family.tsx:56,106–108` and `Person.tsx:81,199–201` run it through `useHold` ("Took back TTC JP2 for Ty" / "Taking back TTC JP2…"). Not exercised: briefed not to take back. |
| R5-3 the asks remount | Fixed (code) | One `<section className="review">` always, with `{asked}` in a fixed `.review-asked` slot (`display: contents`). "Nothing waiting" shows only when `items !== null && askedCount !== null`. |
| R5-4 silent retries, focus dropped | Fixed (code) | `useRetryFocus` is used in Family, Person, ReviewQueue, Keepers, Storyteller and Waiting (twice). Both `Waiting` components render "Looking again…". Not triggered. |
| R5-5 the held line's edge cases | Fixed (code) | `useHold.ts` has `lost()`, so focus comes back only if it is on nothing or on a node that has left the page. It pauses on `visibilitychange`, and `HeldLine` pauses on pointer enter. The count is `items.filter(i => !held[i.id])`. Not exercised. |
| R5-6 the statement size | Fixed | The token is `--fz-statement`: 32px, 36px from 1600 up, 24px on the phone. The long variant is the same size with a 38ch measure. Sizes on the sheet: 13, 18, 20, 28 and the statement. |
| R5-7 measure and press | Fixed | The list is capped at 560px. The press is `transform 120ms var(--ease-out)` at `scale(0.98)`. Its residual "hole" is now the layout question in finding 1. |
| R5-8 the plate says it twice | Fixed (code) | `Person.tsx`: when `codesUnknown && mine.failed`, the state line is not rendered and the alert is the one line. Not triggered. |

## Findings, worst first

1. **The stacked empty Person page puts everything in the left half of the column at 1920 and 2560, leaving the right half bare.**
   - Where: `family-people.css:559`, `.pp-main.bare { display: block }` at every width, with `.pp-none` content capped by the 560px list.
   - Sizes: 1920 and 2560 (html zoom 1.3). It holds at 1366, 800 and 390.
   - Evidence:
     - **1920, Ty:** the column is 465–1829 (1364px). Dog, words and questions span 465–1177, so 652px (48%) is bare to the right for the empty state's full 335px (y 319–654). Below it, "Ty's family" is one 211px portrait (465–676), with 1153px bare beside it.
     - **2560, Ty:** the column is 607–2446. The empty state's content ends at 1533, leaving 913px bare for 435px of height, and the one relative is at 607–892.
     - **2560, Mark Keller (sample):** the same 913px band. Four relatives fill only 607–1824 of the row.
     - **The contrast:** on Rose's page at 1920, a page with memories fills the screen in three columns. The plate and rail are at 465–1385, and "Rose's family" is in the right column at 1449–1829. The empty page drops that frame, so the same window looks half used.
     - The builder's gain is real: the column now ends near the card (831 against 892 at 1920; 1079 against 1158 at 2560). It does not outweigh a bare right half on the founder's display.
   - Rules: 8 (nothing in a narrow strip on a large window), 10 (no lone item in a row; columns line up), 13a (each page chooses the frame that uses the screen best).
   - Fix: from 1600px up, give the empty page the same frame as a page with memories. Put the empty state in the middle column and "{Name}'s family" in the right column, as on Rose's page. Keep the stacked layout below 1600px, where it works.

2. **At 761–1099px, the portrait card is a full-width box holding a centred monogram and a few short lines, and the page's own content starts below the fold.**
   - Where: `family-people.css:366`. `.pp-cols` only becomes two columns at `min-width: 1100px`, so below that `.pp-plate` stretches to the column.
   - Size: 800×1024 (any width from 761 to 1099).
   - Evidence:
     - **Ty:** the card is 733×552 (26–759, y 294–846). The 250px monogram is centred with bare paper either side. "Nothing with Ty in it yet." starts at y 886, and the questions and "Ty's family" fall below the 1024px fold.
     - **Bao:** the card is 733×413. The first screen is the card and the plate, and no memory shows until y ≈ 990.
   - Rules: 9 (no card huge for a small amount of information; main content within about one screen), 18 ("never a 600px empty card"), 8.
   - Fix: in the 761–1099 band, set the plate as a row, with the portrait (about 160px) on the left and the state, code and actions on the right. That makes a card about 240px tall, and the empty state or the memories rise into the first screen.

3. **At 800px, the tree wraps a generation so that one person stands alone on the last row, with the "+" placeholder set between people.**
   - Where: `family-people.css:252`, `.tp-row { display: flex; flex-wrap: wrap; justify-content: center }` at `max-width: 1099px`.
   - Size: 800 (the band from 761 to 1099, by the same rule).
   - Evidence:
     - **`/family`:** Nhi Tran, GBao Vo, Bao Vo and "+ a sister or brother" fill row 1 (y 572–752). Nhi stands alone, centred, on row 2 (y 786–929).
     - **`/family?preview=tree`:** in Rose's generation, Arthur Carey stands alone on a third row under Frank & Rose & Tom and the "+".
   - Rule: 10 (no single card alone in a row).
   - Fix: at 761–1099, end each generation with its "+" placeholder and step the faces down a size (`t` to `n`) when the row would leave one person alone. Or balance the wrap with a grid of `repeat(auto-fit, minmax(140px, 1fr))`, so five faces split 3 and 2, never 4 and 1.

## Notes, not counted

- **The founder's test content** ("How to end chay") and **Bond's painterly style** are known, so I did not judge them. Bond's placement is unchanged from round 5 and covers no text.
- **Question tense.** "What work did Maya do the longest?" (born 1998) and "How did Ty get to work?" ask about living people in the past tense, as if the working life were over. Consider the bank's present-perfect wording for the living ("What work has Maya done the longest?").
- **Sample ids without `?preview=tree`.** `/family/sample-mark` opens the designed "This person isn't in the family tree." state. That is correct, since samples live only in the preview. At 2560 it is a 400px block on a 1300px sheet, but rule 42 is met.
- **Blank prints on the first capture.** The prints on Bao's rail captured blank at first. Every image measured `complete`, with natural width 1122/1200 and opacity 1, and the prints showed on the next capture. This is the same background-tab paint deferral as in round 5.
- **Load time.** The Person page sometimes took 5–6s to mount after a cold navigation (the loading mark showed meanwhile). It was not reproducible enough to grade.

## How I checked

- My own pane tab (tab-112), force-reloaded at each size. At the end I reset its viewport to desktop and closed it.
  - This run resumed after a usage-limit stop. I could not tell which earlier tab was mine, so I left the existing tabs (tab-9, 73, 109, 110, 111) alone.
- Sizes: 1366×768, 1920×1000, 2560×1300 (html zoom 1.3, confirmed), 800×1024 and 390×844.
- Pages:
  - `/family` and `/family?preview=tree`.
  - Person, real family: Ty Ngo (invited, no memories) and Bao Vo (8 memories).
  - Person, sample family: `sample-rose`, `sample-claire`, `sample-mark` and `sample-maya`, each with `?preview=tree`.
  - `/write?with=<Ty>&about=child-house-rule`, view only.
- Measurements:
  - getBoundingClientRect and Range rects for text extents, arrow positions and line counts.
  - Computed font sizes, scrollWidth against clientWidth, tap targets, and image state.
  - One true-size view at 1920, made with a temporary `#root` transform and removed afterwards.
- `__gsap` was not exposed, so I waited for the page to mount, then 1.5–4s.
- At every size and page:
  - No horizontal scroll.
  - No text under 12px.
  - Every link, button and input at 390 and 800 is 44px or taller.
  - Both pages end with "Where to next".
- I also read `Person.tsx`, `personRail.ts`, `family-people.css` (round-5 and round-6 blocks), `ReviewQueue.tsx`, `useHold.ts` and `useRetryFocus.ts`.
- Nothing was clicked or typed. I moved between pages by URL only and did not touch `astory-app-auth`.

**Not verified:**

- Take back, the held lines and the retries, live. I judged them from code, as briefed.
- Hover, focus-visible and active states on a real pointer.
- Reduced motion.
- A 3840 zoom-2 pass.
- Failure states (I did not simulate fetch failures this round).

## Score (taste floor)

Philosophy 4, hierarchy 4, execution 3, specificity 4, restraint 4, variety 4.

The page fails on:

- finding 1 at 1920 and 2560 (rules 8, 10, 13a);
- finding 2 at 761–1099 (rules 9, 18);
- finding 3 at 800 (rule 10).

Everything else from rounds 4 and 5 now holds.
