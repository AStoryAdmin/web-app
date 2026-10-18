# Bao's Standard: Family (/family) and Person (/family/:personId), round 2

**FAIL**

## Before the findings

- **The round-1 report is missing.** `web-app/docs/agents/reviews/family-r1-baos.md` is not on disk. Only signed-out-r1 and writer-r2 reports are in the folder, and a search of the project and the scratchpad found no copy. OneDrive may have dropped it, or round 1 was never saved. So I could not check round 1 item by item. Instead I checked each fix the builder lists against the live pages:

| Builder's claim | Verdict | Evidence |
| --- | --- | --- |
| Storyteller centred, tiers in three parts | Holds | The `.tp-row` grid is left / centre / right. The storyteller sits in the centre zone at every width (1920: x 1119–1351 of 633–1836). |
| At most one ring per tier | Holds | The sample has 1, 0, 1, 1, 1 and 0 rings per tier. The real family has 1, 1 and 1. |
| Captions on hover only | Holds | `.tp-cap` has opacity 0 and appears on `:hover` (fine pointers) and on `:focus-visible`. |
| Faces sized by family size | Partly | Faces step down only by width (5 people → `l`, 16 → `n`). Height is never considered. See finding 5. |
| Tree first below 1500px | Holds | At 1366 the tree is at y 310 and the storyteller block at y 1038 (real) or 1519 (sample). |
| Two rail groups on Person | Holds | Rose: "What Rose has told" (4) and "Rose, as the family remembers" (3). |
| Shorter rail | Holds | RAIL_MAX 4 and OTHERS_MAX 3. "All N … in the archive" appears below. |
| Sticky right column at 1600+ | Holds | `.pp-extras` is `position: sticky` at 1920 and 2560, and stacked at 1366. |
| Where to next | Holds | Present on both pages. A second, different component exists, though: see finding 11. |
| Hairline loading sketch | Code only | `.fp-skel` and `.pp-skel` are in place, but I did not see a live loading state. |

- **How I checked.** I used my own pane tab (tab-46), stepping GSAP 300–600 ticks and `__st.update()` before each measurement. I measured with getBoundingClientRect, scrollWidth and computed styles at 1366×768, 1920×1000, 2560×1300 (fresh load, html zoom 1.3), 390×844 and 3840×2000 (zoom 2). Pages checked: the founder's real family `/family`, the sample `/family?preview=tree`, and on Person: Bao (storyteller), Ty Ngo (real, not on A Story), Rose (sample storyteller), Claire (sample niece). At every size and on every page: no horizontal scroll (scrollWidth = viewport minus scrollbar), no text under 12px, no stray uppercase, no element outside the viewport. Nothing was clicked that writes.
- **Not verified.** The loading sketch live, the hover caption and pointer thread lighting by real pointer (the pane was hidden, so hover could not run; I read the CSS), the error states, and the invite / place / merge flows (out of bounds).

## Findings, worst first

1. **On Ty Ngo, the page tells three different stories about whether he has been invited.** The Family page's Invitations column lists code **TTC JP2 "for Ty Ngo · 29 days left"**. The tree under his face says "not on A Story yet". His Person page says "not on A Story yet" and offers **"Make a code"** as if no code existed.
   - Where: `Family.tsx` MyCodes; `FamilyTree.tsx` Face; `Person.tsx` pp-invite (state from `linkState` / `linkStateOf`, which ignores live codes).
   - Sizes: all.
   - Evidence: `/family` text "TTC JP2 / for Ty Ngo · 29 days left / Take back"; `/family/36cfd520…` text "not on A Story yet … Make a code".
   - Rules: 29 (the state words must be true: a person with a live code is "invited · waiting for them"), 19 (the same action offered twice).
   - Fix: treat a person with a live code from `listMyCodes()` as "invited · waiting for them" in the tree and on Person. On Person, show that code with "Take back" and "Send the code again" instead of "Make a code".

2. **On Person, the same sentence is set twice in a row.** The words plate quotes the opening of the person's latest memory, and the rail card for that same memory repeats it as its excerpt.
   - Where: `Person.tsx` (`theirs`/`said` → `.pp-words-plate`) together with `MemoryRail` `oneLine()`.
   - Sizes: all.
   - Evidence: on Claire at 390 the plate reads "Aunt Rose taught me the waltz in her kitchen…" and the only card under "What Claire has told the family" reads the same words. On Rose at 1920 the plate reads "I'll tell you about the goat if you've got all afternoon." and the "Today" card reads the same line. The Family page's storyteller column quotes it a third time.
   - Rules: 19, checklist "no duplicated content", 32.
   - Fix: when the plate quotes a memory, leave that memory's excerpt off its rail card (title and date only), or quote a memory that is not in the rail.

3. **Every one of Bao's rail cards prints "No date yet", and three of them print the fallback chapter "Anything else".**
   - Where: `MemoryRail.tsx` RailCard (`dateLine` → "No date yet", `memory.era`).
   - Sizes: all.
   - Evidence: `/family/5aa5a1cf…` `.pp-date` ×4: "No date yet · Anything else", "No date yet · Anything else", "No date yet · Childhood", "No date yet · Anything else".
   - Rule: 34 (never print "No date yet" or a fallback chapter card after card).
   - Fix: leave the date and the "Anything else" chapter off undated cards. Gather them into one quiet row above the rail ("Give 4 memories a year · about 2 minutes") that links to dating them.

4. **On Bao's page, the right-hand column holds one sentence, and that sentence contradicts the tree.** "Bao's family" says "Nobody is placed beside Bao yet." The Family tree shows three people in Bao's generation beside him (Nhi Tran, GBao Vo, Nhi, all "friend"). At 1920 that 380px sticky column is 62px tall next to an 823px story column: a column that is almost empty.
   - Where: `components/person/Kin.tsx` (counts only parents, partners, siblings and children); `.pp-extras`.
   - Sizes: 1920 and 2560 (third column); 1366 and 390 (stacked).
   - Evidence: `.pp-extras` [1457, 319, 380×62]; `.pk-none` text.
   - Rules: 10, 8, 20 (honest copy), 30.
   - Fix: include the other people the tree joins to this person (friends, in-laws) under their relation word, and say "No parents, partner or children placed yet" only when that is what is true. When Kin is this short at 1600+, let the story column take the width instead of keeping an empty third column.

5. **The tree picks its face size by width only, so even the five-person family runs past the fold, and at 1366 the storyteller's name falls below it.**
   - Where: `FamilyTree.tsx` `draw()`/`wraps()` (sizes `l`/`m`/`n`/`t`); tier padding in `family-people.css` lines 129–145.
   - Sizes: 1366×768, 1920×1000, 2560×1300.
   - Evidence:
     - Real family (5 people): at 1920 the plate is y 311–1055 against a 1000px window; at 2560 (zoom 1.3) it is 404–1371 against 1300. At 1366 the storyteller's node is y 561–814, so the name under the face is below 768.
     - Sample (16 people): at 1920 the plate is 1237px tall, with `t` faces it would be 1153, and with `l` 1724. Shrinking the faces saves only 84px, so the tier rhythm (44px tier gap, label padding, three text lines) is what makes it tall. At 1366 Rose's name is again below the fold.
   - Rules: 9, checklist "main content visible within about one screen below the hero".
   - Fix: make `draw()` also step down while the plate is taller than the window space below its top, and tighten the tier rhythm so a 16-person family fits about one 1000px screen at `n`. At minimum, the storyteller's tier must sit fully above the fold at 1366×768.

6. **A tier that holds nothing but a dashed ring takes a whole row of the tree.** On the sample, the top of the tree is "Rose's grandparents": 146px for one 56px plus ring, which pushes the storyteller down. On the real family, "Your children" is a 124px tier holding only "a child". These rings are also 56px where the in-row rings are 68px.
   - Where: `FamilyTree.tsx` `.tp-tier.rings`; `family-people.css` lines 144–148 and 205.
   - Sizes: all (worst at 1366, where it costs the storyteller's name).
   - Evidence: tier boxes [465, 311, 1371×146] (sample) and [465, 931, 1371×124] (real).
   - Rules: 10 (lone icon on a row), 9.
   - Fix: when a generation has no one in it, set its invitation as one quiet line in the margin label of the nearest tier ("+ Rose's grandparents"), not as a tier of its own.

7. **The three keeping cards are each 270–289px tall for one line of content.** "Waiting for your review" holds one sentence, and the other two are mostly empty paper.
   - Where: `Family.tsx` `.fp-keep` / `.fp-keep-col`.
   - Sizes: 1920 (576×270 each), 1366 (397×289 each), 2560.
   - Evidence: `.fp-keep-col` heights 270 (1920) and 289 (1366). Screenshot `…/tool-results/mcp-Claude_Browser-blob-1792292930334-4vjfhh.jpg`.
   - Rule: 9 (no card huge for a small amount of information), checklist "aligned columns".
   - Fix: when nothing is waiting, collapse that part to one ruled row ("Nothing waiting for your review") across the top of the section, and let Invitations and Keepers share the row below at their natural height. No equal-height boxes.

8. **Below 1500px, the storyteller's voices run as full-width rows with their postmarks about 1000px from the words they date.**
   - Where: `components/family/Storyteller.tsx` `.st-voices .st-voice`.
   - Sizes: 1366 (and any width from 1100 to 1500).
   - Evidence: `.st-voice` 1176px wide. Text at x 133, the stamp SVG at x 1202. Screenshot `…/mcp-Claude_Browser-blob-1792292909450-bw7er8.jpg`.
   - Rules: 8, 10.
   - Fix: at this width, set the three voices as three columns (face, line, name, stamp together), or put the stamp right after the words.

9. **Rail photographs are left washed out (opacity 0.6, brightness 1.9) whenever the CSS clock stalls.** The `develop` keyframe is a CSS animation, which the motion watchdog cannot step.
   - Where: `src/lib/arrive.ts` `developPhotographs()` and `astory.css` line 2424 (`img[data-develop].developing { animation: develop … both }`). Used by `MemoryRail` and `RelatedRow`. Owner: lead.
   - Sizes: all, in the embedded pane.
   - Evidence: on Bao's rail at 1920, after 600 GSAP ticks and 2s, `getAnimations()` returned "develop running currentTime 0" with opacity 0.6. The prints looked like blank beige squares. Screenshot `…/mcp-Claude_Browser-blob-1792293046156-d4gtjw.jpg`.
   - Rule: 25 (content never depends on the frame clock).
   - Fix: run the develop as a GSAP `fromTo` with `clearProps`, so the watchdog finishes it, or give it a start state that is the finished photograph.

10. **A chat transcript appears as one of Bao's memories, with an "AI:" line as its excerpt.** The card "Ending the chat" reads "You: How to end chay AI: If you'd like to end the chat, you can simply stop replying…".
    - Where: `personRail.ts` `oneLine()` and the rail's selection.
    - Sizes: all.
    - Evidence: `/family/5aa5a1cf…` page text.
    - Rules: 17 (a memory shows the person's own words), 32.
    - Fix: never take an excerpt from transcript turns. Use the kept line, or the person's own turns with the "You:/AI:" labels stripped, and leave out memories with no words of the person's.

11. **The site has two different "Where to next" components.** Family and Person use `components/family/Ornaments` `WhereNext` (`.wn`: an h2 "Where to next." and three-column rows). Archive, Book, Account and Memory use `components/book/WhereNext` (`.where-next`: a small label with title and line stacked).
    - Where: those two files.
    - Sizes: all.
    - Evidence: grep of `src/pages/*.tsx`.
    - Rules: 1, 38.
    - Fix: keep one component (lead's call on which design) and use it on every page.

12. **On a phone, the storyteller's couple breaks into a lone face behind a dangling ampersand, and single faces sit alone on rows.**
    - Where: `family-people.css` lines 226–232 (phone `.tp-row` and `.tp-unit` flex-wrap).
    - Size: 390.
    - Evidence:
      - Sample: "Frank & Rose & Tom" puts Frank and Rose on line 1 (y 804) and "& Tom Whitfield" alone on line 2 (the `&` at x 139, y 1031).
      - Sample: Daniel Hartley sits alone on his row (y 1614).
      - Real family: "Nhi" sits alone on row 3 (y 1021).
    - Rule: 10.
    - Fix: on phones, set a three-person unit as a column (spouse, storyteller, spouse), with the ampersand between each. Lay out tier rows in pairs, centring an odd last face under the pair above with the thread, or start the row with the ring.

13. **Small target and empty-state gaps.**
    - The Keepers "Their email" input is 42px tall at every size. The Ty Ngo invite email field is 42px.
    - The Family storyteller column's empty state ("Nobody has added their side yet. Sending someone a link takes a minute.") has no action.
    - Where: `Keepers.tsx`, `Person.tsx` Field, `Storyteller.tsx`.
    - Rules: checklist 44px targets, 41.
    - Fix: make the fields 44px, and add the one quiet action "Send someone a link →" (it opens the invite sheet).

14. **On Ty Ngo's Person page, his line under the name says "In the family", where the tree says "Nhi Tran's parent".**
    - Where: `Person.tsx` `subline` (`relationTo` returns empty through a friend).
    - Sizes: all.
    - Evidence: hero text "Ty Ngo & Bao. / In the family".
    - Rules: 30, 19.
    - Fix: use the same relation words the plate computes (`buildPlate` `node.rel`) for the Person page subline.

## Notes, not counted against this round

- **The mascot.** The Family invitations column and the Person empty states still show the cream samoyed (`public/dog/curious-paper.webp` and `sleep-paper.webp`, checked by eye). Rule 21 says Bond replaces him. The prompts are in `docs/mascot/BOND.md` and the art is the founder's to generate, so this is blocked, not a builder defect. Swap the files as soon as the art exists.
- **The builder's admissions, judged.**
  - The sample not fitting at 1920 is a real defect: finding 5.
  - Keeping phone years and counts in accessible labels only is acceptable. The Person page carries the years one tap away, and the founder has ruled against scattered captions.
  - 2560 is checked above: no overflow; the fold overrun is in finding 5.
  - Person at 390 is checked above: no overflow, no small text, every target 44px or more; the duplicate sentence is finding 2.

## Score (taste floor)

Philosophy 4, hierarchy 3, execution 3, specificity 4, restraint 3, variety 4. No dimension is under 3. The page fails on findings 1–7, which break rules 9, 10, 19, 29 and 34 at the sizes listed.
