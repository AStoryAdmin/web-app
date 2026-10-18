# Bao's Standard

The founder's philosophy for A Story, collected from every ruling they have given (September to October 2026). Every page, every agent, every change is held to it. Where this file and an older document disagree, this file wins. When the founder gives a new ruling, add it here the same day, in their words, and apply it **to the whole site, not only where they pointed**.

The bar: the founder has designed Kiyo, Shiori, Project Reboot (journal.gbaonvo.com), their personal website and the A Story marketing site. The web app must be at least that good, "client ready". "Not a real website yet" is the verdict to beat.

---

## 1. How the work is done

1. **Apply a comment everywhere.** A note about one page is a rule for every page. Before reporting, search the whole site for the same fault. "Don't just apply my philosophy where I told you. The rest of the site is full of bugs and bad designs."
2. **Long runs, not short ones.** Keep going until the whole site passes this standard. Don't stop after the one fix that was asked for. "I hate it when you make a short run like this."
3. **Always consider the five design skills** on every UI change: taste-skill, hallmark, emil-design-eng, impeccable, and the GSAP skills (core, scrolltrigger, timeline, react, performance). Name the ones that shaped each change.
4. **Brainstorm before building.** "Give yourself more time when brainstorming the design to get better result." Sketch two or three options in words, choose, then build.
5. **See it where the founder sees it.** They use Microsoft Edge, often a private window, on a large display, sometimes zoomed out. Check every page at 1366×768, 1920×1000, 2560×1300 and 390×844, and at a zoomed-out window. Never say a page is fixed without measuring or seeing it at those sizes.
6. **Honest reports.** Say what was not verified. Never claim a check that did not run.
7. **Parallel agents** for research, flows, features and polish, with separate files, so the founder never has to catch small defects.

## 2. Screen and layout

8. **Use the screen.** On a large window nothing sits in a narrow strip with empty margins. "One big screen giving me such small elements is diabolical." Widen the column (up to about 1640px) and add columns. Don't just enlarge things.
9. **Compact, smart layouts.** The main content of a page is reachable without long scrolling. No card is huge for a small amount of information. "Do you see how much scrolling effort I need just to see this?" A summary view can come before the full view.
10. **No orphans.** No lone icon on a row, no single card alone in a row, no rule that spans only one of two columns. Columns align and tops line up.
11. **One screen when it should be one screen.** The sign-in and the other signed-out pages fit the window on a desktop and never scroll into empty cream. The book scales up and down to fit.
12. **The ratio must hold** at every size and zoom. Nothing stretches, squashes or collapses. Never use `vh` or `vw` without dividing by `--zoom`. Never size an element in its own `cqw`.
13a. **Each page chooses its own frame.** "Per navigation, the layout page can change to give you the best estate and layout to play with." The Shell offers a full hero, `compact` and `bare` heroes, and a `wide` column. Choose per page whatever uses the screen best.
13. **Don't squeeze things into one page** where a flow needs steps. For example, the writer puts the question on top, gives one page to the words, and asks when, chapter and photograph as a step after Keep.

## 3. The look

14. **The family book on a bookbinder's bench.** The top of every page is the chocolate bookcloth (teal on the Book page only). The work is an ivory sheet set like the printed book: laid paper, a foil hairline frame, corner ornaments, a running head and folio, Cormorant Garamond headings, EB Garamond text, Montserrat small-caps kickers, and plates with an inner foil rule.
15. **Premium, old money, warm, a luxury gift for a family.** Benchmarks: Bearplus (motion and transitions, not their look), CargoKite, Heron, Cask Exchange, apple.com, cluely.com, Duolingo for delight, and Shiori and Kiyo for small print.
16. **The big elements are bold. The minor elements are quiet and eye-friendly.** Small print is sentence case, 13–14px, soft grey and one weight down, with hairlines and arrows. Uppercase is only for the book's own small-caps kickers (11px or more, tracked). Nothing is under 12px.
17. **Words and photographs lead.** A memory shows the person's own words, never a third-person summary ("The speaker…"). It shows the teller as a face, not a "WRITTEN BY" line. Photographs are white-bordered prints. A memory without a photograph is the person's words on paper, never a blank box.
18. **People are portraits, never boxes.** Show a round photograph, or their initials as a monogram seal. Never a tinted square with an initial, never a 600px empty card.
19. **No scattered captions, disclaimers or over-explaining.** One disclosure where needed. No giant wordmark in a footer. Don't repeat the same promise or action twice on one page.
20. **Honest copy.** Never invent numbers, customers, quotes or reviews. Use the founder's real copy where it exists.
21. **Real assets.** Use the founder's watercolour puppy (`public/dog/*`) and photographs from the locked master library, never cropped from contact sheets and never filtered. When imagery is missing, write prompts for the founder to generate in GPT; don't generate it. Never use the book slipcase image.
22. **The book preview is the samples page.** The reader and every book object match astoryapp.com/samples exactly ("printed exactly the way yours will be").

17a. **Reading comes first.** "The paragraph is not eye friendly to read." Long text follows docs/research/reading-2026.md: a measured column, generous size and line height, full-strength ink on the paper, no ornament that gets in the way. No tinted bubbles, no heavy pill buttons, no clipped rounded photo frames: the founder called them "unacceptable".

## 4. Motion and interaction

23. **The site moves.** Every signed-in page has arrival, scroll and transition effects in the house easings: entrances on `cubic-bezier(0.23, 1, 0.32, 1)`, movement on `cubic-bezier(0.77, 0, 0.175, 1)`. Transform and opacity only. Every effect has a reduced-motion fallback.
23a. **Moving between pages is smooth and premium.** "Make the transition smooth and give the premium feeling." Every in-app link is a View Transition: the bar holds, the cloth morphs to the next page's height, the old sheet settles away and the new one rises. Nothing jumps or flashes.
24. **The navigation follows you.** The top bar is fixed and condenses when you scroll. The cream sheet slides up over the brown, and the brown only shows when you are back at the top.
25. **Nothing is ever left hidden or half-faded** by an animation that didn't finish. Content never depends on the frame clock or on an observer firing.
26. **Pointer effects line up with the pointer** at any zoom. The pressed leaf follows the cursor over the whole page, cream included. The nav highlight sits under its own tab.
27. **Delight.** The puppy on the sign-in plate follows the pointer, covers its eyes on the password and sleeps on verify. Small, earned moments: Duolingo's level of delight, not a playground.
28. **An atmosphere that invites writing,** like the founder's journal: a letter already begun ("Dear family,"), a ribbon, a running head that knows where you are, the pen lying ready, the dog at the end. No streaks, no guilt and no mood scores.

## 5. Product truths that design must show

29. **The three ways to be in a story are never blurred.** You start a story for someone, you join someone's story, or you keep your own, and nobody ever writes as somebody else. People you add stay pending, "invited · waiting for them", until they accept on their side. The state words are exactly "not on A Story yet", "invited · waiting for them" and "on A Story".
30. **The family is not a chart.** It is a register of portraits, organised by generation relative to the storyteller, with their voices present.
31. **Public and private are always clear,** both per memory and for the wall.

## 6. The checklist every page passes

- At all four sizes and when zoomed out: no horizontal scroll, no clipped or overlapping text, no empty screens, and the ratio holds.
- The main content is visible within about one screen below the hero on a desktop.
- No orphan elements, no duplicated content or actions, and aligned columns.
- Small print is at least 12px, quiet and legible.
- Motion is present, finishes, and can be reduced. The bar follows. Pointer effects line up.
- Empty, loading, error and success states are designed, not blank.
- Every interactive element has hover, focus-visible, active, disabled, loading, error and success states, and a touch target of at least 44px.
- The page could sit beside Kiyo, Shiori or the marketing site without embarrassment.
