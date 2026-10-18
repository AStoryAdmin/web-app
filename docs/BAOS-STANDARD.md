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

14. **The family book on a bookbinder's bench.** The top of every page is the chocolate bookcloth (teal on the Book page only). The work is an ivory sheet set like the printed book: laid paper, a foil hairline frame, corner ornaments, a running head and folio, Cormorant Garamond headings on the sheet (the title on the cloth is bold Montserrat, as on the deck), EB Garamond text, Montserrat small-caps kickers, and plates with an inner foil rule.
15. **Premium, old money, warm, a luxury gift for a family.** Benchmarks: Bearplus (motion and transitions, not their look), CargoKite, Heron, Cask Exchange, apple.com, cluely.com, Duolingo for delight, and Shiori and Kiyo for small print.
15a. **Decorate, as luxury does.** "Feel free to add decoration elements to make it more eye appealing… make the website look luxury premium as much as possible." Use the book arts: foil, gilt edges, marbled endpapers, headbands, ribbons, wax seals, ex libris plates, photo corners, deckled prints, pressed leaves, corner flourishes and illuminated initials, from docs/research/decoration-2026.md. Make each one earned and placed with restraint, so a page is rich but never busy. The founder's own Shiori, Kiyo, gbaonvo.com and Project Reboot are the measure. Don't compare the web app to the phone app: improve on it ("still worse than the app, and can even further improve from there").
16. **The big elements are bold. The minor elements are quiet and eye-friendly.** Small print is sentence case, 13–14px, soft grey and one weight down, with hairlines and arrows. Uppercase is only for the book's own small-caps kickers (11px or more, tracked). Nothing is under 12px.
17. **Words and photographs lead.** A memory shows the person's own words, never a third-person summary ("The speaker…"). It shows the teller as a face, not a "WRITTEN BY" line. Photographs are white-bordered prints. A memory without a photograph is the person's words on paper, never a blank box.
18. **People are portraits, never boxes.** Show a round photograph, or their initials as a monogram seal. Never a tinted square with an initial, never a 600px empty card. The one featured portrait on a person's own page may be an arch, as on the founder's gbaonvo.com, Shiori and Kiyo. Everyone else is round.
19. **No scattered captions, disclaimers or over-explaining.** One disclosure where needed. No giant wordmark in a footer. Don't repeat the same promise or action twice on one page.
20. **Honest copy.** Never invent numbers, customers, quotes or reviews. Use the founder's real copy where it exists.
21. **Real assets.** Use the mascot, Bond, the founder's own dog, drawn in the soft watercolour style (`public/dog/*`; he replaces the cream samoyed, ruling of 2026-10-17; prompts and states in `docs/mascot/BOND.md`) and photographs from the locked master library, never cropped from contact sheets and never filtered. When imagery is missing, write prompts for the founder to generate in GPT; don't generate it. Never use the book slipcase image.
22. **The book preview is the samples page.** The reader and every book object match astoryapp.com/samples exactly ("printed exactly the way yours will be"). Its printed type therefore scales with the spread: about 11px at 1366×768, as on the samples page. That is a deliberate exception to the reading-size rules (16, 17a); "Read this page" is the way to read a page large. Reviewers do not reopen it.

17a. **Reading comes first.** "The paragraph is not eye friendly to read." Long text follows docs/research/reading-2026.md: a measured column, generous size and line height, full-strength ink on the paper, no ornament that gets in the way. No tinted bubbles, no heavy pill buttons, no clipped rounded photo frames: the founder called them "unacceptable". **Tidying a spoken memory never changes what was meant** (lead ruling, 2026-10-18): it may remove filler sounds, an exact adjacent stutter, a clause that is a true prefix of the next, and a false start the speaker restarts in their own next words (“we did like a, we built an app”); it never drops a clause only because it ends on a little word, never a sentence that repeats one said earlier for emphasis, never a question the teller asks themselves, never a clause only because it starts like the next one, never a word doubled for emphasis ("a big, big house"), never the quoting or feeling "like", never a hedge before an amount, never an answer. When in doubt it keeps the words. **The local tidy works from a closed list** (lead ruling, 2026-10-18, final form in round 12: small on purpose, because a heuristic that guesses at grammar changes meaning; the server's tidy is the path to smoother reading). It removes only:
(a) the filler sounds um, uh, er, erm, hmm, written in lower case as words of their own, with one comma that sets it off ("We were, uh, poor" → "We were poor"; between two commas the sound and one comma go, so "rice, um, beans" → "rice, beans"); the word yeah, well, okay or so as the very first word of the teller's first paragraph when a comma follows it; a sentence-opening "Yeah," or "So yeah," that does not follow a question;
(b) "like" with a comma on both sides (", like,"), except after a form of be, go or say, where it quotes ("I was, like, wow" stays);
(c) "I", "the", "and" or "that's" said twice in a row with a comma between, when the first copy opens the sentence or follows a comma ("I, I went"; "that's, that's kind of why");
(e) whole sentences from this set only, never inside quotation marks, which are the other person's reactions: "Wow." "Wow, that's amazing." "That's amazing." "That's awesome." "Wait, were you?" "Yeah, right?" and a "Yeah." straight after one of them.
A question is set as "We asked" only when the transcript names the speaker, or when it is followed by the asker going on and then a reply that is exactly "For sure." or "Yes.". The kept line lifted under a title may drop an opening "So," "And," or "But," only when a comma, a pronoun or "the" follows it ("So the best way…" → "The best way…"; "But for my mother…" and "So many…" keep it). Everything not on this list stays, word for word, including stutters the list does not name and broken-off clauses. Each cut the tidy makes is recorded with the rule that allowed it, and the tests check every cut against its rule. Reviewers test the list, not every possible sentence: a removal outside the list is a defect; a filler the list doesn't catch is not.

## 4. Motion and interaction

23. **The site moves.** Every signed-in page has arrival, scroll and transition effects in the house easings: entrances on `cubic-bezier(0.23, 1, 0.32, 1)`, movement on `cubic-bezier(0.77, 0, 0.175, 1)`. Transform and opacity only. Every effect has a reduced-motion fallback.
23a. **Moving between pages is smooth and premium.** "Make the transition smooth and give the premium feeling." Every in-app link is a View Transition: the bar holds, the cloth morphs to the next page's height, the old sheet settles away and the new one rises. Nothing jumps or flashes.
24. **The navigation follows you.** The top bar is fixed and condenses when you scroll. The cream sheet slides up over the brown, and the brown only shows when you are back at the top.
25. **Nothing is ever left hidden or half-faded** by an animation that didn't finish. Content never depends on the frame clock or on an observer firing.
26. **Pointer effects line up with the pointer** at any zoom. The pressed leaf follows the cursor over the whole page, cream included. The nav highlight sits under its own tab.
27. **Delight.** Bond on the sign-in plate follows the pointer, covers his eyes on the password and sleeps on verify. He follows by turning his head; no drawn-on catchlights or flat lid discs over the painting (the art carries its own light). A blink only from real closed-eye frames of the same drawing. Every pose on one page keeps one head size and position; the turn pivots where his paws meet the edge, at most 1.5°, so his paws never lift (lead ruling, 2026-10-18). Small, earned moments: Duolingo's level of delight, not a playground.
28. **An atmosphere that invites writing,** like the founder's journal: a letter already begun ("Dear family,"), a ribbon, a running head that knows where you are, the pen lying ready, the dog at the end. No streaks, no guilt and no mood scores.

## 5. Product truths that design must show

29. **The three ways to be in a story are never blurred.** You start a story for someone, you join someone's story, or you keep your own, and nobody ever writes as somebody else. People you add stay pending, "invited · waiting for them", until they accept on their side. The state words are exactly "not on A Story yet", "invited · waiting for them" and "on A Story".
30. **The family is not a chart.** It is a register of portraits, organised by generation relative to the storyteller, with their voices present.
31. **Public and private are always clear,** both per memory and for the wall.

## 7. What the founder's own sites teach (October 2026)

From docs/research/founder-sites-2026.md (Project Reboot, gbaonvo.com, Kiyo, Shiori, the marketing site).

**Hierarchy and words**

32. **Every page says what to remember.** Use four levels: the primary idea, the key takeaway, the explanation and the metadata. "LEVEL 2 — KEY TAKEAWAY … The thing a skimming visitor should remember." On a memory, the takeaway is one line of the person's own words, the kept line, set large, marked in gold, used as the card's excerpt and repeated as the closing coda. Never a summary.
33. **One emphasis per headline, on the human word.** "Each composition should usually have only 1–3 emphasized concepts." Display titles end with the house full stop in foil or terracotta, as on every site the founder has made.
34. **Missing information is a small task, never repeated noise.** Never print "No date yet" or a fallback chapter on card after card. Gather them into one row with the time it takes ("Give 8 memories a year · about 2 minutes").
35. **Numbers have a unit and a meaning, or they go.** Set the unit in serif italic beside the figure. "Don't invent metrics." Never a count that can be misread (a year labelled as a quantity).

**Structure**

36. **Each place is a different room.** No two signed-in pages open on the same composition. Each place gets its own object on the cloth, from real photographs or founder-generated art.
37. **Today answers "what next?"** Home leads with one thing to do, then a short numbered plan built from real data, with minutes on each row, then a ruled ledger in plain words. "Don't replace the ruled workspace with a grid of decorative statistic cards."
38. **Every page ends with "Where to next."** Three ruled rows: a title, one line, a round arrow. A memory also has named Previous and Next ("← *title* · Memory 8 of 9 · *title* →").
39. **Choices are big and carry a specimen.** Any choice between ways (Start, Join, the three ways to be in a story) is set as large cards, each with an object on the left, one or two lines, and the step ("Step 1 of 3").
40. **Change the ground once on a long page.** A long sheet takes one tipped-in leaf or plate for the family's voices, so the chapters can be felt. Keep one coloured plane per screen: "Allow one coloured plane per screen."

**States**

41. **Empty states have a pose, a sentence, the time it takes and one action.** "No lessons finished yet. Begin one from Today. The first takes about twelve minutes." The dog's pose matches the moment.
42. **Failure wears the house style.** Not found, not shared, expired, offline and storage errors each get the cloth, one sheet, the dog, one headline in the house voice, one line of cause and remedy, and one action. Loading draws the mark on the sheet over the page's hairline skeleton. Nothing stays on "Checking…".

**Interaction and delight**

43. **Teach an interaction once, in one quiet line.** "Use the controls, arrow keys, or swipe from a page edge." Give the keyboard a layer: `W` to write, `/` to search, `←/→` between memories and pages, `?` for the shortcuts, and "Press ? for shortcuts" in the footer of the sheet.
44. **The companion gives something real and never blocks.** The dog may return a real memory when pressed. It "never block[s] a click" and never covers words.
45. **Delight is a layer the person can turn off.** Seasonal and playful touches are "decoration over the real interface", with pointer events off. They are skipped under reduced motion and under the person's own "Quiet pages" switch in Account.
46. **Time and season are present, quietly.** The greeting knows the hour. The question and the open leaf know the season. Nothing ever counts days or scolds.

## 6. The checklist every page passes

- At all four sizes and when zoomed out: no horizontal scroll, no clipped or overlapping text, no empty screens, and the ratio holds.
- The main content is visible within about one screen below the hero on a desktop.
- No orphan elements, no duplicated content or actions, and aligned columns.
- Small print is at least 12px, quiet and legible.
- Motion is present, finishes, and can be reduced. The bar follows. Pointer effects line up.
- Empty, loading, error and success states are designed, not blank.
- Every interactive element has hover, focus-visible, active, disabled, loading, error and success states, and a touch target of at least 44px.
- Every page has a clear takeaway, ends with "Where to next", has designed empty and failure states (rules 32–46).
- The page could sit beside Kiyo, Shiori or the marketing site without embarrassment.
