# Skills Steward: Family and Person, round 8

**Verdict: APPLIED.**

All three round-7 gaps are fixed. So are the six round-7 BAOS findings, as far as the skills reach them. I measured every one I could reach live. The fresh pass found nothing to grade. There are two notes for Bao's eye below, and I didn't count either one.

**Scope:**
- `components/family/tree/FamilyTree.tsx`: `balance()` now skips the storyteller's own row.
- `components/family/useRetryFocus.ts`: a reused node that has lost `tabindex` counts as gone.
- `components/person/Kin.tsx`: the column count now comes from the number of people.
- `pages/Person.tsx`: the `slim` plate.
- `styles/pages/family-people.css`: the round-8 block (lines 624–656), read against rounds 6 and 7.

**Skills loaded:**
- taste-skill: SKILL (house rules and laws), layout, type, critique.
- hallmark: interaction-and-states, responsive, slop-test gates 1–57, microinteractions (undo and optimistic rollback).
- emil-design-eng (whole).
- impeccable: craft-floor, polish, layout, critique.
- gsap-react, gsap-performance, gsap-timeline, gsap-scrolltrigger (cleanup and refresh).

I also read BAOS-STANDARD.md and DESIGN.md, and the built-in-browser skill for the pane. No other installed skill applies.

**How it was checked:**
- I read every file in scope.
- **Tests:** vitest on `components/family` and `components/person` passes: 5 files, 47 of 47 tests. `tsc --noEmit` prints nothing.
- **taste-skill `lint.mjs`** on the five files: the same sanctioned categories as rounds 2–7 (shadow, hairline, gradient as book material, outlined-box WARN), all above line 300. The round-7 and round-8 blocks add nothing. Their only matches are two arch `border-radius` values.
- **Live, in my own tab (tab-133).** I force-reloaded it at each size.
  - `/family?preview=tree` at 800×1024.
  - `/family` at 800 and 390×844.
  - Ty Ngo at 390, 800, 1366×768 and 1920×1000.
  - `sample-rose` at 800, 1366 and 2560×1300 (html zoom 1.3, `--zoom` 1.3000).
  - `sample-mark` at 800.
- **Failure states, in my tab only.** I wrapped `window.fetch` so GETs to `/rest/v1/{family_codes, contributions, story_join_requests, story_managers, person_suggestions}` rejected. Then I remounted `/family` through the router and logged every `focus()` call. In each section I focused Try again and pressed it, first with reads still failing and then with reads restored. I polled until the loading line left, because a failing load takes about 7.1s to come back. I ran the same test on Ty's plate.
- **Clean-up.** A full navigation removed the wrapper and the focus log; I confirmed both were gone before the next checks. I reset the viewport to desktop and closed the tab. I never signed out, never touched `astory-app-auth`, never opened `/write`, and wrote no data. The only things I pressed were Try again (reads only), "Change Ty's details" and Cancel.

**Not verified:**
- Keepers' held line, live: the founder has no other keepers, so I read R7-3 from the code.
- A held send that lands or fails (that needs a write).
- MyCodes when no codes are left: the founder has one code.
- 3840 wide, a real pointer's hover, and reduced motion (nothing new moves this round).

## Round-7 gaps, re-checked

| # | Status | Evidence |
| --- | --- | --- |
| R7-1 a second failure drops the keyboard to `<body>` in four places | **Fixed** | `useRetryFocus.ts:42` now returns early only for a connected node that still has `tabindex="-1"`. **Second failure, live, all six sections:** "The family's lines", "What the family sent", "What the family asked", "What you asked of others", "The codes you've sent" and "The keepers" each ended on their own section's new Try again (`ownRetry: true`). The focus log reads: loading line, then Try again. **Success:** each section ended on its container (`section.st-voices`, `section.review`, `div.fp-keep-review` twice, `section.fp-invites`, `section.keepers`). **Ty's plate:** a second failure ended on its Try again. Success ended on `p.pp-state`, which reads "invited · waiting for them". |
| R7-2 the quiet "Change Ty's details" sits 17px in on the tablet plate | **Fixed** | css:655 sets `margin-inline-start: -16px` in the 761–1099 band. **Ty at 800:** the body column's text starts at 247 (the photo link, the state, the note, the code and the pill's border). The button's words start at 248, and the button is still 44px tall. |
| R7-3 Keepers' held line takes a 12px gap | **Fixed (code)** | css:637: `.keeperlist li.held { flex-wrap: wrap; gap: 0 0.3em; }` (0,2,1) outranks astory.css:1029 `.keeperlist li` (0,1,1). It now matches the codes' held line (css:597): 0.3em between words, a 56px row. |

**BAOS round 7:**
- **Finding 1, the 800px tree wraps in zone order.** Fixed. css:641–644 put the storyteller's unit first, alone and centred. `balance()` (FamilyTree.tsx:97–103) leaves that row out and balances the rest under it.
  - **Sample:** Frank & Rose & Tom on the axis (y 603), then Margaret & Jim at 131–405, Arthur at 423–551 and "+" at 569–684 (y 797). The second row is centred on 407.5 and the axis is at 407. The generation takes 355px, where it used to take 550.
  - **Real family:** Bao Vo alone on the axis (y 594), then Nhi Tran, GBao Vo, Nhi and "+" at 115–700 (y 825).
  - The sibling "+" is in a side zone, so its `order: 2` still puts it last.
- **Finding 2, one relative alone on the last row.** Fixed. `Kin.tsx:74` picks the columns: 4 people go two by two, and 10 go four across.
  - **Rose at 1366:** `c4 even`, four 192px tracks, rows of 4/4/2, every name and relation on one line.
  - **Rose at 800:** two by two, five rows (css:653).
  - **Mark at 800:** `c2`, 2/2.
  - **At 2560:** the right column stays a single track (380px), because the existing desktop rule outranks the `.cN` classes.
  - **At 390:** one column (css:631).
- **Finding 3, the sample plate is a wide box of bare paper at 800.** Fixed as Bao offered. `.pp-plate.slim` has a 120px arch, `fit-content`, a 420px floor, and its words centred against the portrait.
  - **Rose:** 26–446 × 294–486, with the words at 367–412 beside a 315–465 portrait.
  - **Mark:** 26–446 × 294–448. See the first note.
- **Finding 4, two state lines run together at 390.** Fixed. css:633 sets the `.tp-row` column gap to 16px. "not on A Story yet" × 2 now sits at 73–203 and 217–347: 14px apart, the same as the sample's closest pair. No horizontal scroll (scrollWidth 390).
- **Finding 5:** fixed, as R7-2.
- **Finding 6, the split underline on "Add a photograph of {name} →".** Fixed. css:635–636 make the arrow `span` inline. At 390 and 800 the link computes to block, with `line-height: 44px` and `underline` over one line of inline text, so it draws one underline. The target is 44px.

**Also checked, unchanged:**
- Ty's in-place swaps still hand focus: "Change Ty's details" goes to First name, and Cancel comes back to "Change Ty's details".
- Ty at 1920 keeps round 7's empty-page frame: the main grid is 919.2px and 380px, the empty state is at 465–1385, and the family column is at 1449–1829.
- No horizontal scroll at 390, 800, 1366, 1920 or 2560.

## Gaps

None.

## Notes, not counted

1. **On a sample person at 761–1099, the slim plate stands at the left with bare paper to its right.**
   - **Rose at 800:** the plate is 26–446 and the sheet's column runs to 759, so 313×192px of paper stays empty at the top. The kept-line plate under it is centred at about 150–650, which adds a third x position (taste critique pass 4).
   - **Mark:** the plate's text ends near 345 while the 420px floor carries the card to 446.
   - It holds as a left-aligned card. It shares the column edge with "What Rose has told", the empty state and the family list, and the centred quote is the page's one centred moment. So I didn't grade it.
   - **If Bao counts it, the smaller change is:** drop the 420px floor (`min-width: 0`), so the card is no wider than its words. Centring the plate would break the left edge it shares with everything below it.
2. **Four across at 761–1099 for an odd count (7, 11 people).** Kin falls back to `c4` and the band only halves even counts. That leaves tracks of about 168px with 100px for the words. "Margaret Doyle" set at 93px wide, so longer names would wrap inside their card. No family in the data has such a count, so I read this from the code only. With 7 people, every other count leaves one alone (3 and 2 columns both leave 1 over), so this is the right trade.

Also seen, and harmless: on a second failure the focus log shows `focus()` reaching the reused failure `<p>` once before the Try again. A `<p>` with no tabindex can't take focus, so nothing moves.

## Emil's review table

| Before | After | Why |
| --- | --- | --- |
| A connected node counted as "only re-attached" even after React reused it for the failure line | It counts as re-attached only while it still has `tabindex="-1"` | The keyboard's place now survives the second failure in all six sections |
| The tablet tree wrapped in zone order, so the sister's couple sat above the storyteller | The storyteller's unit stands alone on the axis and the rest are balanced under it | Height means generation; the phone's rule now reaches the next band up |
| The quiet edit button's words sat 17px inside the column | `margin-inline-start: -16px` in the band, with its 44px target kept | A borderless control's words are its edge |
| Keepers' held line had a 12px gap | `gap: 0 0.3em`, as the codes' held line has | The same "no" reads the same way in both lists |

## Skill by skill

- **taste-skill:** applied.
  - Edges hold in the tablet band (247 and 248).
  - The tree's tiers read top to bottom by generation at every size checked.
  - No lone face, and no lone relative on a last row.
  - h1 on one line ("Rose Hartley.", "Ty Ngo & Bao.", "Mark Keller & Rose.").
  - No eyebrows, monospace, index numbers or new ornament.
  - Note 1 is the only edge question, and I left it to Bao.
- **hallmark:** applied.
  - The error state holds focus through the whole round trip (the 8 states).
  - Every new or changed target is 44px or taller.
  - No two-line buttons. "a sister or brother" is the ghost's caption, not a button label.
  - Grid tracks are `minmax(0, 1fr)` (css:626–629).
  - No horizontal scroll from 390 to 2560.
- **emil-design-eng:** applied.
  - Nothing new animates. That is right for keyboard swaps and retries, which are frequent and keyboard-initiated.
  - The two held lines now agree.
  - No `transition: all` and no ease-in.
- **impeccable:** applied.
  - Visible focus is kept across every swap and every retry.
  - Optical alignment is fixed in the band.
  - Same-role spacing matches between the two lists.
  - The responsive structure now reorders by importance (the storyteller first) and not by DOM order.
  - No craft-floor ban.
- **GSAP (react, timeline, performance, scrolltrigger):** no gaps.
  - `treeMotion.ts` and `railMotion.ts` are unchanged: `gsap.matchMedia()` with `mm.revert()`, scoped, transform and opacity only, with `clearProps`.
  - No ScrollTrigger is used.
  - `balance()` is layout code and runs only inside the debounced `draw()`. Its per-row style reads are not worth grading.
