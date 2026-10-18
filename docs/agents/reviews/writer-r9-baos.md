# Writer, round 9: Bao's Standard

**PASS.** All three round-8 findings are fixed, and so are Skills A1 and A2. A fresh pass at eight sizes, on all five pages and a scrolled long page, found nothing that breaks a checklist item. Two small observations are listed under "Also seen, not counted". Neither is a defect against the standard.

I checked in my own browser-pane tab (tab-114) at 1366×641, 1366×768, 1920×1000, 2560×1300 (the app's zoom is 1.3 there), 800×1024, 390×844, 375×812 and 320×700. I reloaded after every resize. Before measuring I stepped GSAP by hand (`__gsap.ticker.tick()` ×400) and waited for the page to render. I measured with getBoundingClientRect, computed styles and scrollWidth. On every page at every size, a script swept for three things: elements past the edge, visible text under 12px (zoom included), and controls under 44px.

Code read:
- `src/lib/aboutPrompt.ts` and its test (03:32): 5 of 5 pass in `npx vitest run`.
- `Write.tsx` around the deck, the kicker, the list heading and analytics (01:12).
- `Person.tsx` `writeTo` (01:11).
- `writer.css` §20, the 900px and 740px blocks (01:12).
- `sensitivity.js`, for the one line that can still show under an about-question.

Pages:
- **The about page, reached the real way.** On Ty Ngo's empty Person page (`/family/36cfd520…`, "Nhi Tran's parent", "invited · waiting for them") I clicked "How did Ty get to work?". The click opened `/write?with=36cfd520…&about=work-journey`. I also checked `about=turn-low-point` at 320. That one is one of the bank's longest about-questions, and it is marked sensitive.
- `/write?q=voice-advice-phrase`, from today's deck (`faith-where-quiet`, `voice-advice-phrase`, and "Who was running the country…").
- `/write`, empty, and with a typed test page of 167 words. I cleared it afterwards.
- `/write?edit=59632e67-1bf2-4bc9-b03a-1f9d6f1f628a` (293 words). This is the scrolled long page. I swept it from top to foot at 1366×641, 1366×768, 1920×1000, 2560×1300, 800×1024 and 390×844.
- Afterwards, at `…&details=1`, at every size except 1366×641 and 375.

## Round-8 items, re-checked

| Item | Now |
|---|---|
| Baos 1 / Skills A1. The storyteller's own hint sat under a question about someone else | **Fixed.** `aboutPrompt.ts` now returns `hint: undefined`, with a comment saying why. A new test asserts it for `roots-father-hands` and `roots-helped-out`. On the live page "How did Ty get to work?" has no line under it at any size: `.w-sub` is absent at 1366×768, 1920, 2560, 800, 390 and 375. The one line that can still show is the sensitivity note, for example "Touches on hard years. Leave it for another day if today isn't the day." under "What do you know about the hardest year of Ty's life?". It names the kind of question, not the writer, so it fits a question about someone. |
| Baos 2. Ty's page dropped the question from its links | **Fixed.** `Person.tsx:206`'s `writeTo(about)` appends `&about=`. The live hrefs: Ty has `open-born-where`, `child-house-rule` and `work-journey`. GBao has `family-door-greeting`, `else-best-gift` and `roots-nickname`. Clicking one opens the writer on that question, with "A question about Ty" as the kicker and "Work & making a living" as the right page's running head. Bao's own Person page offers no about-questions (only "Write one with Bao" and a photograph), so nobody is asked about himself in the third person. |
| Baos 3 / Skills A2. The about page listed the wrong list, under an untrue heading, and the "own words" row came and went with the window's height | **Fixed.** The list is now decided in TSX (`Write.tsx:739–746`). An about page, a `?q=` page and an edit each show two of today's questions plus "Or something else, in your own words". A blank page shows three of today's. The about page's heading reads "Or one of today's questions" (`:960`, `question && !aboutQ`). The `nth-child(4)` rule is gone from `writer.css`. At 1366×768 all three rows show on the about, `?q=` and edit pages. At 1366×641 the row is hidden on all of them by the ≤740px rule, which I accepted in round 8. |
| Round 8, also seen. Keeping an about page counted as the storyteller's own answer | **Fixed.** `question_shown` and `question_answered` now send `draftQid` (`roots-…@<personId>`), at `:614` and `:834`. |

## Fresh pass: what holds

- **No horizontal scroll** at any size: scrollWidth equals clientWidth everywhere (1351, 1905, 2545, 785, 390, 375, 320). Two things cross the edge, and neither causes scroll:
  - The pointer leaf parked at 0,0 (-15 to 15).
  - At 800 and below, the cloth's lamp span (0–1100). This is decoration under `overflow-x: clip`.
- **Small print.** No visible text under 12px on any page at any size, zoom included.
- **Targets.** No control under 44px. The photo's remove button on Afterwards draws at 25.2px (32.8px at 2560), but its `::before` makes it 44px to press.
- **Console.** No errors.
- **The first screen on a laptop** (book; seal bar):

  | Page | 1366×641 | 1366×768 |
  |---|---|---|
  | About (Ty) | 158–533.5; 537.5–627.8 | 166–649.4; 663.4–753.8 |
  | `?q=` | 158.6–533.9; 537.9–628.3 | 166–649.4; 663.4–753.7 |
  | `/write` | 158.5–538.8; 542.8–633.1 | 166–656.1; 670.1–760.5 |

  - The bar clears the window's foot by 7.5 to 14px everywhere.
  - Spacing: running head → kicker → question is 18/8px at 768 and 12/6px at 641.
  - At 768 the ribbon's tail (637.4–661.4) clears the bar by 2px. At 641 the ribbon is off, as designed.
- **The about page's composition.**
  - At 1366×768, without the hint, the left page reads: kicker, then the question (37px, one line), then the list from 333, then "A few lines is plenty." at 513–538. That leaves an 87px rest above the foot. The right page sets the book's height, so the pages stay level. See `shots/writer-r9-baos-1366x768-about.jpg`.
  - At 641 the rest is 106px (`shots/writer-r9-baos-1366x641-about.jpg`).
  - At 800 and on phones, the band between the question and the book is the dog's perch: 112px at 800 and 86px at 390. It is the same depth as on `?q=`, where the hint fills its left side (`shots/writer-r9-baos-800x1024-about.jpg`).
- **The scrolled long page.**
  - Editing at 1366×768: the left block pins at 80–329 from a scroll of 300 to 1200. It parks with the leaf at the 1260 foot (44–293).
  - At 641 it pins at 80–274 through 1100 (`shots/writer-r9-baos-1366x641-edit-scrolled.jpg`).
  - At 1920 the block and the rail pin level at 104, and at 2560 both pin at 135.
  - Typed `/write` at 1366×768: the bar follows at 666–756, and the pinned block (80–445) never meets it (`shots/writer-r9-baos-1366-write-long-scrolled.jpg`).
  - The top bar takes `.stuck` once scrolled.
- **Large windows.**
  - At 1920 every writer page puts the book and the rail (keep at 504–600) in the first screen. "Where to next" starts at 819 on the about page, 818 on `?q=` and 855 on `/write`.
  - At 2560 the book and the rail span 250–2278. "Where to next" is at 1066–1113 of 1300.
  - Afterwards at 1920 shows the kept page, all four choices and the top of "Where to next" in one screen (`shots/writer-r9-baos-1920x1000-afterwards.jpg`).
- **Tablet.**
  - At 800×1024 the pill nav sits at 166–492, between the logo and the account group.
  - The questions and the help sit side by side under the book (26–368 and 416–759).
  - Afterwards puts the kept page first (281–700) and the choices at 740, in two columns.
- **Phones.**
  - The about question sets at 28.9px (390) and 27.8px (375), on one line. At 320 the longest about-question sets at 19.7px on two lines.
  - With 167 typed words, the bar follows above the tab bar:

    | Width | Bar | Tab bar starts |
    |---|---|---|
    | 390 | 686–763 | 775 |
    | 375 | 654–731 | 743 |
    | 320 | 543–620 | 631 |

  - The textarea never overflows (scrollWidth equals clientWidth at 289 and 234).
  - Afterwards at 390 and 320 puts the choices first, then the kept page, then "Where to next".
- **Bond.** He wakes with words (`data-awake` present) and sleeps again when the page is cleared. On a laptop he sits on the board's edge (100–179 at 1366, 84px at 641). He covers no words at any size.
- **Drafts.** The about page keeps its own key, so the typed own-words page never appeared on Ty's page.

## Also seen, not counted

- **The ≤740px rule now hides a row that fits.** At 1366×641 the "own words" row is hidden on the about, `?q=` and edit pages. With the hint gone, there is room for it: the left page ends its text at 403 (about) or 425 (`?q=`), and its leaf runs to 509. I showed the row in my tab, as an inline style for inspection only. On `?q=` the book stayed at 533 and the bar at 628, with the row ending at 479. So the CSS comment "the seal needs the line" is no longer true for these pages. I accepted the rule in round 8 because it is consistent: every page at that height hides the row, and the way remains under Add. That still holds, so it is not ranked. When the writer is next touched, consider dropping `writer.css:205`, or scoping it to pages whose left leaf is the taller one.
- **"Or something else, in your own words" on an about page links to `/write`, not `/write?with=<Ty>`.** So it leaves Ty behind. That matches the other rows, which are the storyteller's own questions, so it is defensible. Carrying `with` would keep Ty attached if the person meant "something else about Ty".

## Not verified

- **Real-time motion.** The pane draws frames only for screenshots. In this session it was often hidden, so screenshots timed out between captures. The view transition from Ty's page into the writer stalled mid-fade while the pane was hidden. I take that to be the paused frame clock, not the app: the URL had changed, and a direct load rendered at once. I could not watch it run. The sticky block, the bar's condensing and Bond's states are therefore taken from computed CSS and the class at each scroll step.
- **Reduced motion.** Read in the CSS, not emulated.
- **Pressed controls.** By instruction I did not press Keep, the seal or any help button. So the failed-Keep state, a pencilled question in the travelling block, and an about-page Keep (`personIds: [withId]`) were not seen.
- **Hover and focus-visible.** Read in `writer.css`, not seen.
- **Large-window and phone screenshots.** At 1920 and 390 the pane's screenshots came back cropped and magnified, so those sizes rest on measurements.
- **Edge at 3840.** Not run, because these signed-in pages cannot be opened headless without touching auth.

## Housekeeping

- **The test page.** On `/write` (own words) at 390×844 I typed a test page of 167 words. I measured it at 390, 375, 320 and 1366×768. I cleared it at 1366×768 with Ctrl+A and Delete. The folio then read "0 words · Nothing written yet", its draft key was gone, and Bond slept.
- **The beeedb62 draft** was 370 characters before and after. I never opened its writer or its Afterwards.
- **The other pages.** I typed nothing on the about, `?q=`, editing or Afterwards pages, and no new draft key exists.
- **The helper.** I kept a measuring helper in two `sessionStorage` keys (`__baosM`, `__baosW`) and removed both before closing.
- **What I didn't touch.** I did not sign out. I did not touch `astory-app-auth`, beyond seeing that it is present.
- **My tab.** I reset its viewport to desktop and closed it (tab-114).
- **New pictures:**
  - `shots/writer-r9-baos-1366x768-about.jpg`
  - `shots/writer-r9-baos-1366x641-about.jpg`
  - `shots/writer-r9-baos-1366x641-edit-scrolled.jpg`
  - `shots/writer-r9-baos-1366-write-long-scrolled.jpg`
  - `shots/writer-r9-baos-1366x768-afterwards.jpg`
  - `shots/writer-r9-baos-1920x1000-afterwards.jpg`
  - `shots/writer-r9-baos-800x1024-about.jpg`
