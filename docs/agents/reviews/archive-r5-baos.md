# Archive, memory page and Home's prints, round 5 (Bao's Standard)

**FAIL**

Scope: `/archive` in the Prints and List views, `/archive/:id` including a missing id, and Home's prints and "From the book".

How I checked: I used my own tab (tab-86) in the Claude pane, with the founder signed in. I loaded each size fresh: 1366×768, 1920×1000, 2560×1300 (html zoom 1.3) and 390×844. At each one I stepped GSAP and ScrollTrigger, then measured with getBoundingClientRect, scrollWidth against clientWidth, scrollHeight against clientHeight on every clamped or hidden-overflow element, computed font sizes and target sizes. I read all eight memories in the tidied view and pressed "Read it word for word" on each spoken one to compare, then put it back. I could not see Home's empty invite with this account (it has eight memories), so I put the `InvitePrint` markup, copied from `Mosaic.tsx`, into Home's real `.home-mem .mosaic` in my own tab and measured it there. No data was touched. I pressed only the word-for-word toggle and the Prints/List switch. The stored view was "list" when I started and is "list" now. I closed my tab and cleared its viewport.

## Round 4 defects, checked

| # | Round 4 defect | Now |
|---|---|---|
| 1 | Tidied reading not readable enough | **Better locally, still not client-ready.** The exact repeated sentence is gone. So are "That's how we got, that's how we built" and "So we did like a, we built". Speech the cleaner cannot repair remains. The server tidy is blocked (known). See the verdict, and 2 and 3 below. |
| 2 | Three line pickers disagree | **Fixed.** One `takeaway()` is used everywhere. The page, the print, the List card and Home agree on all eight memories, for example 4592: "That's always been the dream because I love teaching." All eight pages now have a kept line, except f9b0, whose whole text is that line. |
| 3 | "Ispecifically" drop cap | **Fixed.** No drop cap on 4592 or 342e, whose first word is "I". |
| 4 | Asker's words given to the teller | **Fixed.** 5963 now reads "We asked: Do they open to non-students as well? Because our strategy right now is…" as one line, and "For sure. Yeah, definitely." is gone. |
| 5 | Clipped text on the phone and in List | **Fixed.** No element clamps at any size. On the phone the 342e print's line is 84/84 and the page-turn titles are unclamped. The f6a7 List excerpt at 2560 is 52/52. |
| 6 | Running head says "What the family remembers" | **Fixed.** It reads "ARCHIVE" at every scroll position from 0 to 2000 at 1366 and 1920. |
| 7 | Lopsided paragraphs | **Fixed for balance.** c21c is 321 + 326 characters, f6a7 314 + 338, 4592 408 + 398, and 342e has eight paragraphs of 201 to 405. The broken thought on c21c moved inside a paragraph. See 3. |
| 8 | Middot touching "about" | **Fixed.** The dot ends at x 1091 and "about" starts at 1096 at 1366. |
| 9 | Bond floating on the not-found page, page in the left third | **Fixed.** `LedgeNote` sits Bond on a foil hairline (his art overlaps it by 6px), centred on the sheet at every size. The apostrophe is curled and the full stop is foil. |
| 10 | Straight apostrophes | **Mostly fixed.** No straight apostrophe renders on the founder's pages. Still straight in source: `Home.tsx` 73, 166, 193 (`${story.name}'s`, shown on anyone else's story) and `Shell.tsx` 122 ("isn't", in the story menu). See 9. |
| 11 | Middot starting line 2 of the tidy note | **Fixed** on the tidy note at 390. **The same fault is on the typed prints.** See 6. |
| 12 | Kept line three times near the end | **Fixed** for the last-paragraph case: 342e has no coda. **The mirror case at the opening is not fixed.** See 4. |
| 13 | Loose ends | **Fixed.** List uses 4 columns at 1920 and 2560 (two even rows). The f9b0 Next title is balanced ("Childhood in a small / city in Vietnam"). The brand link is 89×44. |

## Can the tidied reading be shown to a client, and did tidying change what anyone meant (rule 29)?

Overall: **no, not for the long calls.** The cleaner cannot repair what was said or misheard, and it cannot fix the transcripts, so it has reached its limit. The server tidy is off until the AI server allows the web origin (docs/ai-server-cors.md). That is known and not the builder's fault. Memory by memory:

- **342e4b40, "Building Better Play Studios through bootstrapping": No.** The meaning is intact: everything dropped was filler, a repeat, or the other person's "Wait, were you?". But the result still reads as mangled. It opens "I started my career as a middle school teacher so I taught teenagers which is a five. And then my mom did that my dad was an entrepreneur. And so I learned from him and he's just very connected I did not grow up in Michigan I'm from Wisconsin." Further down: "So not today, but so I was working with…", "I got to like, and so they ended up winning…", "His manufacturing job got laid off.", "they want to hear that one person is for sure making the job right away."
- **c21cf4d4, "Losing grandparents and preserving a grandfather's story": No.** It has "because my dad was trying to. My grandfather was a police officer and he was a good man. Everyone's good. But he was trying to. He was a really good fan." The tidy also turned one sentence into a fragment. "because you're not only are you caring for them but then you're also not going to do this work" became "…caring for them. But then you're also not going to do this work…". The words are the same, but the "not only… but" thought is now cut in two (defect 3).
- **f6a734be, "Pausing a PhD to support startup ventures": Yes, passable.** It reads cleanly. "That's awesome." was the other person's and is correctly dropped. "business take" and "Miley Consulting" are mishearings, not tidying. The meaning is unchanged.
- **459228bd, "Choosing a startup over finance graduate study": No.** The tidy only removes "And yeah". The transcript itself is broken: "I specifically PhD of finance.", "People use this to solve my pain.", "And I know a lot of other people can subscribe.", "You wish I would have studied finance." The meaning is unchanged.
- **59632e67, "Funding a startup through pitch competitions": No.** It has "So that's how I paid. So winning pitch competition, non-dilutive funding. My dad wanted the tax. It's a job. Thank you, dad. So you have to think so." and "that was a free gift from I won a pitch competition". The asker's line is now correctly theirs. The meaning is unchanged.
- **0ced62a7, "Wanting to preserve grandparents' stories": Nearly passable, but tidying changed what was meant.** "as the pace is going faster and faster" became "as the pace is going faster" (defect 2). The rest matches the original, including the rough "But overseas traveling in the midst of them. You never see them. I mean FaceTime helps or whatever. It is."
- **f9b0e6e9, "Ending the chat": No.** "How to end chay." Founder test content, as known. Word for word it also shows the AI's reply ("AI: If you'd like to end the chat…") under "Told by Bao". It is labelled, so it is honest, but it is another reason to remove it before a demo.
- **beeedb62, "Childhood in a small city in Vietnam" (typed, never tidied): Not as content.** The layout is right: it is set line by line, "Written by Bao", Childhood kicker. But it ends "That's hard to answer em nhìn thấy dơ luôn testing testing about the city". That is test text.

One more rule 29 point for the founder, which is content and not the builder's: the speakers in 342e, 4592, 5963 and f6a7 are plainly not Bao. One says "my husband started working with University of Michigan students… I'm from Wisconsin". One says "My dad's an entrepreneurial finance professor and I'm from Milwaukee". One says "That's why it's good that you're studying finance". One says "You met me during the business take last year". Every one of these is labelled "Told by Bao in conversation". Shown to a client as Bao's memories, they read as someone writing as somebody else. For a demo, use f6a7 (if its speaker agrees), the typed memories once the test lines are removed, and fresh calls in the founder's own voice.

## Defects, worst first

1. **Home's empty invite is broken: its headline shrinks to 15px, the card becomes a 760px square of empty lines, and on the phone Bond covers the words.**
   - Where: `InvitePrint` in `src/components/Mosaic.tsx` 104–125. In `src/styles/astory.css`, `.home-mem .print-card .typed-in .said` (3482) and `.home-mem .print-card .frame { aspect-ratio: 1/1 }` (3476) come later than the `.print-card.invite` rules (2473–2478) with the same specificity, so they win. `.print-card.invite .invite-dog` is in `archive-reading.css` 636–637.
   - Sizes: all. Measured at 1366 and 390 with the real markup inside `.home-mem .mosaic`.
   - Evidence:
     - At 1366, "Nothing here yet." is 15px, not 40px. The card is 760×762, its frame forced square, and below the two sentences it holds only ruled lines.
     - At 390, Bond (x 264–352, y 249–319) sits over the invite line (x 40–350, from y 286). In the screenshot he covers "about" and "on the".
     - At both sizes he floats in the corner on the ruled lines, with no ledge under him.
   - Rules: 44 (never covers words), 41, 9, 21 (his placement), 16.
   - Fix: exclude the invite from the `.home-mem` print overrides (`.home-mem .print-card:not(.invite)`) so it keeps its own height and 40px headline. Set Bond on a foil ledge in the cap, or under the words, never in the text's top-right where the line runs.

2. **Tidying changes meaning: "faster and faster" becomes "faster".**
   - Where: the "false start across a joining word" rule in `cleanSpeech`, `src/components/archive/transcript.ts` (`/\b([\w'’]+)\s+(?:so|and|uh|um)\s+\1\b/`).
   - Sizes: all.
   - Evidence: 0ced62a7, raw "as the pace is going faster and faster", tidied "as the pace is going faster". Run on test strings, the same rule turns "more and more people, again and again, over and over" into "more people, again, over".
   - Rule: 29 (their words, never changed in meaning); reading-2026 §3.5 ("nothing is rephrased").
   - Fix: never collapse "X and X". Only collapse across "so", "uh" or "um", and only when X is a little word (my, the, a, I, we). Add these cases to `transcript.test.ts`.

3. **The run-on punctuation cuts a "not only… but" thought into a fragment.**
   - Where: `punctuateRunOn` in `transcript.ts`, which breaks before "but".
   - Sizes: all.
   - Evidence: c21c now reads "it's a lot of work because you're not only are you caring for them. But then you're also not going to do this work…".
   - Rule: 17a; 29 (punctuation by sense must follow the sense).
   - Fix: don't break before "but" when the clause before it holds "not only", and don't break before "but then", "and then" or "so then" when the piece before it ends on a pronoun or object with no verb after the "because".

4. **When the kept line is the opening of the words, the reader meets it twice in a row, and on c21c three times in one view.**
   - Where: `MemoryPage.tsx` (`kept`, `withMark`, `coda`, `keptHead`).
   - Sizes: all. Worst at 2560.
   - Evidence:
     - c21c at 2560: the head quote, the marked first sentence and the coda are all on one screen. The memory is only 647 characters.
     - beeedb62: the head quote "We live in a small city · It's in Vietnam" is followed about 70px lower by the same two lines as the first lines of the words.
   - Rule: 19, weighed against 32 (this is the mirror of round 4's item 12).
   - Fix: when the takeaway is the first sentence of the words, leave the in-body mark off, and skip the coda when the words are under about 700 characters. For typed line-by-line memories, don't use the opening lines as the head quote when the words start with them; pick a later line, or show none.

5. **5963's takeaway is a plain fact, while its real takeaway is rejected on a technicality.**
   - Where: `keptLine` and `takeaway` in `transcript.ts` (`OPENS_WEAK` includes "so" and "you").
   - Sizes: all. It is the line on the page head, the List card and the coda.
   - Evidence: the chosen line is "That paid for an engineer that got all of the licenses for our games on the Cozy platform." The memory closes on "So you always have to just look for every opportunity." That sentence holds a FEELING word ("opportunity") but is dropped for opening on "So" and then on "You".
   - Rule: 32 (the thing a skimming reader should remember, never a plain fact; round 4 item 6).
   - Fix: test `OPENS_WEAK` after stripping `OUT_OF_CONTEXT` ("So"), and allow a "You always/never…" generalisation when it carries a feeling word.

6. **On the phone, the typed prints start their second line with the middot.**
   - Where: the typed `.said` on Home and on the Archive's Prints view (the takeaway joins lines with " · ").
   - Size: 390.
   - Evidence: "We live in a small city" then "· It's in Vietnam", seen on Home's print and on the Archive print. This is the same fault as round 4's item 11, in another place (rule 1).
   - Rule: 16, 1.
   - Fix: join typed lines with a no-break space before the dot ("city · It's"), so the dot always ends the first line. Do the same in `ownWords`.

7. **On the List view the wax seal sits alone on its own row, so the treasured card's title drops 18px below its neighbour's.**
   - Where: `.mem .chips` holding `.mem-seal` in the List `MemoryCard`.
   - Size: 1366 (two-column rows). The phone has the same lone row.
   - Evidence: the "Funding a startup…" title top is 43px into its card. On "Wanting to preserve…" next to it, it is 25px. The seal row is 22px tall with nothing else in it.
   - Rule: 10 (no lone icon on a row; tops line up).
   - Fix: put the seal on the print's corner, as the Prints view does (`.print-seal`), or inline after the title. Never on its own row.

8. **At 1920 and 2560 the List view becomes a second prints grid of tall cards with empty bottoms.**
   - Where: `.arc-cards` at ≥1600px.
   - Sizes: 1920 and 2560.
   - Evidence:
     - At 1920 the cards are 367×459 and 367×441. Below the last line of text there are 55px on the photo cards and 93–145px on the words-only cards. "Ending the chat" is a 441px card for four words.
     - Prints and List at these sizes are the same 4-column grid of portrait cards, so the switch no longer offers a different view.
   - Rule: 9, 8.
   - Fix: keep List as the horizontal row card used at 1366 (print left, words right), in two or three columns at large sizes, so it stays compact and different from Prints.

9. **Straight apostrophes left in source (round 4 item 10, rule 1).**
   - Where: `Home.tsx` 73 (`${story.name}'s story`), 166 (`${story.name}'s book`) and 193; `Shell.tsx` 122 ("isn't on A Story yet").
   - Sizes: all. Only when viewing someone else's story, or with the Add/story menu open.
   - Rule: 14, 1.
   - Fix: curl them (’).

10. **On the phone, the Archive's task row breaks "about 2 / minutes →".**
    - Where: `.arc-task-t`.
    - Size: 390.
    - Evidence: the row is 53px tall and "minutes →" sits alone on line 2.
    - Rule: 10, 16.
    - Fix: `white-space: nowrap` on `.arc-task-t`, so "about 2 minutes →" moves down as one piece.

11. **Bond's pose on the empty Archive is asleep, where the guide says curious, and the not-found page leaves the lower sheet empty.**
    - Where:
      - `Archive.tsx` 366: `LedgeNote pose="sleep"` for "Your archive starts with one memory". docs/mascot/BOND.md assigns "curious" to empty and failure states, and "sleep" to verify, the empty book and Person.
      - `.ledge-note` margin on the not-found page.
    - Sizes: all. The empty space is worst at 2560.
    - Evidence: on the not-found page at 2560 the group ends at y 680 of 1300, leaving about 620px of plain cream (at 1366, about 330px).
    - Rules: 41 (the pose matches the moment), 42.
    - Fix: use the curious pose for the empty Archive, which invites the first memory, or record the founder's choice if sleep is intended. Centre the not-found group in the sheet's height on desktop.

## What holds

- No horizontal scroll at any size on any page in scope. scrollWidth equals clientWidth everywhere.
- No clamped or clipped text at any size.
- No text under 12px. Measured targets in `main` are 44px or more (the search field is 33px, but its label-wrapped form is 44px).
- Memory pages: reading type is 22px at 1366, 23px at 1920 and 2560, 20px on the phone. The kept line is 25, 26 and 21px. Three-column layout at 1920 and 2560, plate layout on 4592, and on the phone the photograph follows the first paragraph.
- The "We asked" line is set apart, small and italic.
- Previous and Next are balanced. "Where to next" ends every page in scope.
- The not-found page has the cloth bar, one sheet, Bond on his ledge, one headline with the foil stop, one line, and one action, at all four sizes.

## Not verified

- Home's empty invite was measured by placing its markup into Home's real grid in my own tab, not on a real empty account. The Archive's empty state was read in code and not rendered.
- Not exercised: reduced motion, hover, active and focus-visible states, the lightbox, View Transitions between memories, a zoomed-out Edge window, and a live resize.
- The pane was hidden for part of the run, so CSS transitions froze mid-fade until a screenshot forced a frame. For example, Home's running head showed "HOME" and "RECENT MEMORIES" crossfading at 0.90/0.10 for 5s and was correct after a frame. I count this as the pane, not the page.
- Photographs took 1.5–4s to appear after each load (signed URLs). The prints showed their cream-to-scrim ground in the meantime. I did not judge load speed.
- The view preference read "prints" once at 2560 when I had left it on "list", so another session shares it. I left it on "list", as I found it.
- Screenshots at 1920 and 2560 are scaled by the pane. Findings there are measured.
