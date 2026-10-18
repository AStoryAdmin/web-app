# Bao's Standard: Family (/family) and Person (/family/:personId), round 13

**PASS.**

- **R12-1 is fixed** (80cf925). There is now a real space before "and Margaret's", so the label breaks between its two phrases and the heading reads as words.
- **The heading text is right:** it reads "Rose's children and Margaret's" in `textContent` and in the accessibility tree.
- **The condensed bar's place links stay at 44px** after scrolling.
- **The fresh pass at the five sizes found nothing new.** Every checklist item holds on all eight pages at every size.
- **The 2560 snug threads** are ruled open for the founder, so they are not counted.

## R12-1: the label, width by width

**The space.** `.tp-sp` is a real word space with `word-spacing: 4px`. It measures 8.04px wide everywhere the label flows as one line, the same as the old 8px margin. Wherever the label wraps, `.tp-also` computes `display: inline; margin: 0; white-space: nowrap`.

**Where the lines fall** on the sample tree (`/family?preview=tree`), read character by character from the page:

| Width | Layout | "1960s Rose's children and Margaret's" | The other labels |
| --- | --- | --- | --- |
| 320 | Band, phone | **Two lines:** "1960s Rose's children" (x 50–203), then "and Margaret's" (x 50–146.4). The lines are 20 to 21px apart. The generation's name stays whole, and the wrapped "and" starts on the heading's own edge. | "Rose's grandparents" wraps to its 44px button at x 50. No decade is ever alone. |
| 340 | Band, phone | One line, x 50–307.4 | Each is one line. |
| 390 | Band, phone | One line, x 50–307.4, with "a child" under it at x 50 | "Rose's grandparents" sits beside the name on the same line. |
| 800 | Band | One line, x 55.6–313.0 | The plate is 1257.8, the same as in round 12. |
| 1100 | Stacked (`data-stack="1"`), 0 paths | One line, x 65.2–322.6 | The plate is 1257.8, the same as at 800. |
| 1366 | Grid, threaded, 11 paths | Three lines: "1960s", then "Rose's children" (667), then "and Margaret's" (691), all at x 73.7. `.tp-also` is a block here, so the space collapses to 0 wide and nothing moves. | The plate is 818.2, unchanged from round 12. |

**The real family at 320:**
- "Your parents and Nhi Tran's" is one line (x 50–237).
- "Your generation" has "a child" beside it.

**The heading text:**
- `h3.textContent` is "Rose's children and Margaret's" at 320, 1366 and 2560. Round 12 had "childrenand".
- The pane's accessibility tree names the heading "Rose's children and Margaret's" at 320 (wrapped inline) and at 2560 (grid, where the span is a block).

## The condensed bar after scrolling

I scrolled each page, took a capture so the tab drew real frames, then measured.

| Size | Page | Bar | Pill | Home, Archive, Family, Book | Other controls |
| --- | --- | --- | --- | --- | --- |
| 800×1024 | Sample tree, scrolled 700 | `top on-dark stuck`, 56.2 | transform `none`, 51.3 tall | 44.0 each | Wordmark, Storyteller, Add and Account: 44 each |
| 1366×768 | Sample tree, scrolled 600 | stuck, 56.0 | `none`, 51.3 | 44.0 each | 44 each |
| 1366×768 | Maya, scrolled 340 | stuck, 56.5 | `none` | 44.0 each | 44 each |
| 1920×1000 | Rose, scrolled 600 | stuck, 56.0 | `none`, 51.3 | 44.0 each | 44 each |
| 2560×1300 (zoom 1.3) | Rose, scrolled 700 | stuck, 72.8 | `none`, 66.3 | 57.2 each | 57.2 each |

At 390 the places are in the bottom tab bar, and every tab measured at least 44.

## Fresh pass

**Pages:**
- `/family` (the real family, "The Vos.") and `/family?preview=tree` ("The Hartleys.").
- Person pages:
  - Bao Vo (`5aa5a1cf…`);
  - Ty Ngo (`36cfd520…`);
  - `sample-rose`, `sample-claire`, `sample-mark` and `sample-maya`, each with `?preview=tree`.

**Sizes:** 1366×768, 1920×1000, 2560×1300 (`--zoom` 1.3000), 800×1024 and 390×844. Every page was checked at every size: 40 fresh loads.

| Check | Result |
| --- | --- |
| Horizontal scroll | None. `scrollWidth` equals `clientWidth` on all 40 loads. |
| Text under 12px | None. |
| Targets under 44px | None, at rest or condensed. |
| Clipped text | None. |
| Overlapping text | None that shows. The pairwise check flagged two kinds of hit, and both are by design. Some were on the phone tab bar, which is fixed, sitting over the content at scroll 0. The rest were the hidden third line of the two-line clamped excerpts (`.pp-words`) on Rose and Claire at 390. Round 11 recorded the same. |
| Left half-faded | Nothing once it settles. I scrolled the 390 tree to its foot and waited 1.5s: all 16 names were at opacity 1. The rest are by design: the sample's disabled "Invite someone" (0.65, `aria-disabled`), and rows still rising while the page arrives. |
| "Where to next" | Every page ends with it, at every size. |
| Tree, 1366 and 1920 | Sample: threaded, size `t`, 11 paths, plate 818.2. Real family: 2 paths, size `n` at 1366 and `l` at 1920. |
| Tree, 2560 | Sample: snug, size `n`, 0 paths, plate 1070.9 (ruled open). Real family: size `l`, 2 paths. |
| Tree, 800 and 390 | Band, 0 paths. |
| Person pages, 1920 and 2560 | Mark and Maya fit one screen (`scrollHeight` equals the window). At 1920 the plate is in the side column, the memories are in the main column, and the family list is on the right. |
| Rules 32–46 | They hold as in round 11: the kept line is the takeaway; Bond's empty state on Mark, Maya and Ty gives the minutes and one action; every page ends with "Where to next"; the cloth hero ends on its brass full stop. |

## Notes, not counted

1. **The titles on the cloth are bold Montserrat.** That is the lead's ruling, written at `family-people.css:400` and used on the Wall, Plans and the Book too. Rule 14 asks for Cormorant headings, which this ruling departs from. The ruling is not yet in BAOS-STANDARD.md. Add it there, so a later reviewer doesn't count it as a fault.
2. **This tab drew no frames between captures.** The first capture after each load was blank cream, as in round 11. On `/family` the real family was still on "Opening the book…" 4.4s after the load, while the backend fetch ran. I could not see the loading mark draw in this tab, so the loading state is not verified this round. It is unchanged code.
3. **Known:** the founder's test content (Ty Ngo as "Nhi Tran's parent", the two Nhis, friends in "Your generation", "Ty Ngo & Bao.") and Bond's painterly style.

## How I checked

- **Code read:**
  - the 80cf925 diff (`FamilyTree.tsx:566`; `family-people.css:248`, `679` and `698`);
  - round 12's Skills report and my own round-11 report.
- **My own pane tab (tab-159):**
  - Each width was loaded fresh, with a capture to force frames.
  - Before measuring, I waited for the load to finish and the fonts to be ready. Then I stepped `__gsap.ticker.tick()`, called `__st.update()`, scrolled through the page with dispatched scroll events, and came back to the top.
- **Measured:**
  - The label's lines, character by character, with Range `getClientRects`.
  - The `.tp-sp` width and the `.tp-also` computed styles.
  - The bar, pill and link rects, at rest and condensed.
  - On every load: `scrollWidth`, font sizes, target sizes (including `::after` hit areas), overflow clipping, opacity chains, and a pairwise overlap check of text ranges.
- **Correction to my own script:** at 2560 my first target check multiplied rects by the zoom, though `getBoundingClientRect` already includes it. I fixed it and re-ran all eight 2560 pages. None has a target under 44.
- **What I touched:**
  - I moved by URL only and clicked nothing.
  - I kept my audit script in one `sessionStorage` key of my own (`bao-r13`) and removed it.
  - I only read whether `astory-app-auth` exists (it does). I never signed out.
  - I reset the viewport to desktop and closed tab-159.

**Not verified:**
- A real pointer's hover and press.
- Reduced motion (nothing new moves).
- 3840 wide.
- A real Edge zoom, as opposed to emulated widths.
- The loading and failure states (see note 2).
- The other three real Person pages (the Nhis and the second Bao Vo).
- vitest and tsc (I did not run them).

## Score (taste floor)

Philosophy 4, hierarchy 4, execution 4, specificity 4, restraint 4, variety 4.

R12-1 is closed. The heading reads as words and breaks between its two phrases. The condensed bar keeps its 44px links. The five-size pass is clean on all eight pages, so this is the passing round for Family and Person.
