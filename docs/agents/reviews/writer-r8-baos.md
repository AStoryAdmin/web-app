# Writer, round 8: Bao's Standard

**FAIL, on three findings, all from the new question-about-someone page.** All three round-7 findings are fixed, and so are Skills N1 and N2. The writer's layout now holds at every size I measured. What stops the pass is the new `/write?with=<personId>&about=<promptId>` page:
- It prints the storyteller's own hint under a question about someone else.
- Nothing in the app links to it yet.
- Its list of other questions is the wrong list. The "own words" row hiding at laptop heights is a symptom of that, and I judge the hiding as it stands a defect (finding 3).

I checked in my own browser-pane tab (tab-104) at 1366×641, 1366×768, 1920×1000, 2560×1300 (the app's own zoom, 1.3), 800×1024, 768×1024, 390×844, 375×812 and 320×700. I reloaded after every resize. Before measuring I stepped GSAP by hand (`__gsap.ticker.tick()` ×400). I measured with getBoundingClientRect, computed styles and scrollWidth. On every page at every size I swept for three things: elements past the edge, visible text under 12px, and controls under 44px. I read writer.css in full (520 lines, mtime 00:55), Write.tsx around the new route (00:53), `lib/aboutPrompt.ts`, `getAboutPrompts` in the interview bank, §63 of astory.css (00:50), and `Person.tsx` and `personRail.ts` (where these questions come from).

Pages:
- `/write?with=36cfd520-c499-4771-b0e2-ffc64cabefb1&about=roots-father-hands` (Ty Ngo), plus `/write?about=roots-father-hands` with no person.
- `/write?q=voice-advice-phrase`. Today's deck changed overnight, so `faith-pray-now` is no longer on it.
- `/write`, empty, and with a typed test page of 186 words. I cleared it afterwards.
- `/write?edit=59632e67-1bf2-4bc9-b03a-1f9d6f1f628a` (293 words). This is the scrolled long page. I swept it from the top to the foot at 1366×641, 1366×768, 1920×1000 and 2560×1300.
- Afterwards, via `…&details=1`, at 1366×768, 1920×1000, 2560×1300, 800×1024 and 390×844.

## Round-7 items, re-checked

| Item | Now |
|---|---|
| Baos 1. Between 761 and 900px wide there was no main navigation | **Fixed.** `astory.css:3779–3784` (§63) keeps the pill nav from 761 to 900px. At 768×1024 the pill is at 150–476, between the logo (28–117) and the account group (509–725), 33px clear on each side. At 800×1024 it is at 165–491, and each of its four links is 44px tall. The tab bar stays off, so there is no double navigation. |
| Baos 2. The seal bar ran off a short laptop's first screen | **Fixed.** At 1366×641 the bar ends at 627.7 on `?q=`, 631.3 on `/write` and 632.6 on the about page, so 8–13px clear of the window's foot. At 1366×768 it ends at 753.7, 760.5 and 760.5. The ribbon's tail (644.1–668.1) still clears the bar (670.1) by 2px. See `shots/writer-r8-baos-1366x641-about.jpg` and `shots/writer-r8-baos-1366x768-about.jpg`. |
| Baos 3. "Not now" was 43.5px | **Fixed.** `writer.css:255` makes it an inline-flex of `min-height: 44px` with `margin: -12.25px 0`. It measures exactly 44.0px tall at every size (for example 719.7–763.7 at 1366×768, 1011.3–1055.3 at 390), and the line beside it did not grow. |
| Skills N1. The bar touched the window's foot at 1366×768 | **Fixed.** This is the same line as Baos 2. `writer.css:189` is now 8px. The step from the running head to the kicker is 18px (228.4→246.4), and from the kicker to the question 8px. |
| Skills N2. The 740px block lost to later rules | **Fixed.** The `max-height: 740px` block (`:203–220`) now comes after the 900px block, and it wins. At 1366×641 the kicker sits 6px above the question (234→240), and the running head 12px above the kicker (206.4→218.4). The empty `.spread .leaf-left-in` selector and the repeated 14px are gone. |

## Findings

1. **A question about someone carries the storyteller's own hint, written for a different question and addressed to the wrong person.** Under "What kind of work did Ty's father do?" the page prints "Scars, dirt, missing fingers. What they smelled like." That hint belongs to "What did your father's hands look like?", so its "they" means hands, which this question never mentions. The fault is in the whole bank, not in this one question:
   - `getAboutPrompts` (`app-core/data/interview.js:6653`) copies `hint: p.hint` from the storyteller's wording.
   - `aboutPrompt` (`lib/aboutPrompt.ts`) passes it through.
   - The writer then sets it as `.w-sub` (`Write.tsx:915`).
   - At least 80 of the 260 "about" questions have a hint that speaks to the writer as the subject. For example, "What was Ty made to help with too young?" over "The job you were given too young.", and "What was Ty good at that people didn't notice?" over "Something you were quietly better at than anyone knew."

   This is the writer telling Bao that he is the one being asked about.
   - Where: the about page, `.w-qhead .w-sub`.
   - Sizes: wherever the sub shows: 1366×768, 1920×1000, 2560×1300, 800×1024 and all three phones. At ≤740px tall the spread hides the sub, so 1366×641 is clean by accident.
   - Evidence: `shots/writer-r8-baos-390-about-hint.jpg`, and `shots/writer-r8-baos-1366x768-about.jpg` (the line under the question). At 390 the sub is at 197–223.
   - Rules: 29 (the three ways are never blurred; nobody writes as somebody else, and here the page puts the writer in Ty's place), 20 (honest copy), 32 (the line under the headline must support the takeaway, not contradict it).
   - Fix: have `aboutPrompt` return no hint (`hint: undefined`), so an about page shows the question alone, until the bank has a hint written for each "about" wording.

2. **The new page can't be reached: Ty's own page offers these questions, but its links drop them.** On `/family/36cfd520…`, "Where was Ty born?", "What rules did Ty have in their house?" and "How did Ty get to work?" all link to `/write?with=36cfd520…`, with no `&about=`. A click therefore opens "In your own words · with Ty" / "What would you like to keep today?", and the question the person chose is gone. `promptsAbout` (`personRail.ts:184`) even says each question "carries the bank's id, so its link opens the writer on that question"; the link never uses that id.
   - Where: `src/pages/Person.tsx:506`.
   - Sizes: all. It is a link, not a layout.
   - Evidence: the hrefs read from the live page at 1366×768.
   - Rules: rule 1 (the route was built, but the page that should use it was not touched), rule 13 (the flow: the question on top), and the checklist (no promised action that doesn't happen).
   - Fix: `to={preview ? "#" : `/write?with=${encodeURIComponent(person.id)}&about=${encodeURIComponent(q.id)}`}`.

3. **On an about page the left-hand list is the wrong list, and the "own words" row is hidden to make room for it.** My judgment on the hiding: as built, it is a defect.
   - The about page's deck adds all three of today's questions (`Write.tsx:742`, where `aboutQ` skips the swap that `?q=` makes). So under "A question about Ty" the left page offers three of Bao's own questions: "Where do you go when you need to be quiet?" and two more.
   - The heading over them reads "Or another of today's questions", but the page's question is not one of today's.
   - The fourth row then trips `writer.css:195` (`ul:has(> li:nth-child(4)) > li:has(> .w-q.own) { display: none }`). At ≤900px tall the only way to a blank page goes, so it depends on the window's height whether "Or something else, in your own words" is there at all. It shows at 1920×1000 and 2560×1300, and is hidden at 1366×768.
   - The same rule also fires on the editing page (three of today's plus "own words" makes four), where it buys nothing: that book is 1,400px tall, so its bar is never in the first screen anyway. Measured at 1366×768: `display: none` on the edit page's fourth row.
   - The ≤740px rule (`:207`), which drops the row on every page of a short laptop, is the older, consistent decision, and I accept it.
   - Where: `Write.tsx:739–743` and `:937`; `writer.css:194–195`.
   - Sizes: every height from 741 to 900 (1366×768 measured). The wrong list and the heading show at every size.
   - Rules: 10 (what a list holds must not depend on the window), 29 (the list should not switch from Ty's story to the storyteller's own questions without a word), 19 (the heading says something untrue).
   - Fix: decide the list in the TSX, not with a height query. On an about page show two of today's (`three.slice(0, 2)`), as `?q=` does, under "Or one of today's questions". That gives three rows with "own words", the same height as `?q=` (bar at about 754–760 of 768). Then delete `writer.css:194–195`.

## Also seen, not counted

- Keeping an about page sends `question_answered` with `question_id: "roots-father-hands"` (`Write.tsx:832`). That is the id of Bao's own question about his own father's hands, so analytics will count it as answered by the storyteller. Consider sending `draftQid` (`roots-father-hands@<personId>`) instead. It is not a design defect, so it is not ranked.
- `/write?about=roots-father-hands` with no `with` reads "A question about this person" / "What kind of work did this person's father do?". The bank's fallback works, and only a broken link reaches it.
- The about page itself is well made apart from the three findings:
  - Ty's first name in the kicker ("A question about Ty").
  - The chapter is set from the question ("Where we come from" on the right page's running head).
  - Ty is attached to the memory on Keep (`personIds: [withId]`, `Write.tsx:819`).
  - It has its own draft key (`roots-father-hands@36cfd520…`), so it never overwrites the storyteller's draft for the same question.

## Fresh pass: what holds

- **No horizontal scroll** at any size. scrollWidth equals clientWidth everywhere: 1351 at 1366, 1905 at 1920, 2545 at 2560, 785 at 800, 753 at 768, and 390, 375 and 320 on phones. No element in the sheet, the bar or the tab bar crosses the edge, on step 1 or on Afterwards. (A 30px pointer SVG sits at the origin at -15 to 15. It is the cursor leaf parked at 0,0, and it causes no scroll.)
- **Small print.** No visible text under 12px on any page at any size.
- **Targets.** No control under 44px. The photo's remove button on Afterwards draws at 25px (32.8 at 2560), but its `::before` makes it 45px to press, as before.
- **The first screen on a laptop.**

  | Page | 1366×641: book | 1366×641: bar | 1366×768: book | 1366×768: bar |
  |---|---|---|---|---|
  | About | 158–538 | 542–633 | 166–656 | 670–760.5 |
  | `?q=` | 158–533 | 537–628 | 166–649 | 663–754 |
  | `/write` | 158–538 | 542–631 | 166–656 | 670–760.5 |

  The running head, kicker and question stay 18/8px apart at 768 and 12/6px apart at 641.
- **The scrolled long page.**
  - Editing, at 1366×768: the left block pins at 80–329 from a scroll of 300 to 1200, and parks with the leaf (44–293 at the 1260 foot). At 641 it pins at 80–319 through 1100.
  - At 1920 the left block and the rail pin level: both at 104, the kicker at 114, the rail heading at 108.
  - At 2560 both pin at 135.2.
  - With 186 typed words on `/write` at 1366×768, the bar follows at 666–756. The block (80–445, with the note "Take all the time you need." at 421–445) never meets it. See `shots/writer-r8-baos-1366-write-long-scrolled.jpg`.
  - The top bar takes `.stuck` once scrolled.
- **Large windows.**
  - At 1920 every page puts the book, the rail (166–600) and the top of "Where to next" in the first screen. "Where to next" starts at 903 on the about page, 818 on `?q=` and 854 on `/write`.
  - At 2560 the book and the rail span 250–2278, so the screen is used.
  - The about question sets at 44px on two lines. The `?q=` question is mid-length and sets at 28px.
- **Tablet.**
  - At 800×1024 the question sets at 32px: two lines on the about page, one line on `?q=`.
  - The dog clears the sub by 20px.
  - The questions (26–369) and the help (417–759) sit side by side under the book.
  - Afterwards puts the kept page first (281–700) and the choices at 740, inside the first screen, in two columns of 347px.
- **Phones.**
  - The about question sets at 28.9px (390), 27.8px (375) and 26px (320), always on two lines. `?q=` (mid) sets at 24.7, 23.7 and 19.7.
  - The title line is 21px, and 19px at 320.
  - Two ways to begin at 390; one at 375 and 320.
  - The dog clears the sub by 11px at 390, 10.7 at 375 and 10.8 at 320.
  - With words, the bar follows above the tab bar: 686–763 against 775 at 390, 654–731 against 743 at 375, and 542–619 against 631 at 320.
  - Afterwards at 390 puts the choices first (224–1452), then the kept page, then "Where to next".
- **Bond.** He wakes with words (`data-awake` set at 186 words) and sleeps again when the page is cleared. At 1366 he is at 100–179, on the board's edge. At 641 he is 84px (102–171). At 2560 he is 130–233. He covers no words anywhere.

## Not verified

- **Real-time motion.** The pane draws frames only for screenshots, so Bond's fades, the sticky block and the bar's condensing are taken from computed CSS and the class at each scroll step.
- **Reduced motion.** Read in the CSS (`writer.css:510–513` and the global rule), not emulated.
- **Pressed controls.** By instruction I did not press Keep, the seal or any help button. So the failed-Keep state, a pencilled help question in the travelling block, and Afterwards for a page just kept from the about route were not seen.
- **Hover and focus-visible.** Read in writer.css, not seen.
- **Phone screenshots with words.** The pane's screenshots at 390 with the typed page came back cropped and magnified, though `visualViewport.scale` was 1 and the textarea measured 304px with no overflow. So the phone checks with words rest on measurements only.
- **Edge at 3840.** Not run, because these signed-in pages cannot be opened headless without touching auth.

## Housekeeping

- **The test page.** On `/write` (own words) at 390×844 I typed a test page of 186 words. I measured it at 390, 375, 320 and 1366×768, and cleared it at 1366×768 with Ctrl+A and Delete. The folio then read "0 words · Nothing written yet", and its draft key was gone.
- **The beeedb62 draft** was 370 characters before and after. I did not open its writer or its Afterwards.
- **The about page, the editing page and Afterwards.** I typed nothing on any of them, and no draft key was created for them.
- **Other actions.** I did not press Keep, the seal or any help button. I did not sign out or touch `astory-app-auth`, beyond seeing that it is present.
- **My tab.** I reset its viewport to desktop and closed it (tab-104).
- **New pictures:**
  - `shots/writer-r8-baos-1366x641-about.jpg`
  - `shots/writer-r8-baos-1366x768-about.jpg`
  - `shots/writer-r8-baos-390-about-hint.jpg`
  - `shots/writer-r8-baos-1366-write-long-scrolled.jpg`
