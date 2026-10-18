# Archive, memory page and Home's prints, round 6 (Bao's Standard)

**FAIL**

Scope: `/archive` in the Prints and List views, `/archive/:id` including a missing id, and Home's prints, the "From the book" quote and the empty invite.

How I checked: I used my own tab (tab-99) in the Claude pane, with the founder signed in. I loaded each size fresh: 1366×768, 1920×1000, 2560×1300 (html zoom 1.3), 800×1024 and 390×844. Inside a size I moved between pages client-side. At each one I stepped GSAP and ScrollTrigger, then measured with getBoundingClientRect, scrollWidth against clientWidth, scrollHeight against clientHeight on every hidden-overflow element, computed font sizes, target sizes and per-character line positions. I read all eight memories in the tidied view and pressed "Read it word for word" on each one that offers it, then put it back. I also ran `cleanSpeech` on 45 test sentences through Vite's module import, and ran `transcript.test.ts` (32 of 32 pass). For Home's empty invite I put the `InvitePrint` markup, copied from `Mosaic.tsx`, into Home's real `.home-mem .mosaic` in my own tab at every size. No data was touched. I pressed only the word-for-word toggle and the Prints/List switch. The stored view was "list" when I started and is "list" now. I reset my tab's viewport and closed it.

## Round 5 defects, checked

| # | Round 5 defect | Now |
|---|---|---|
| 1 | Home's empty invite broken | **Fixed.** The headline is 40px at 1366, 1920, 2560 and 800, and 30px at 390. The card is 760×425 at 1366 (no longer a square). Bond sits on his foil ledge above the words at every size and covers nothing: at 390 he is at y 972–1072 and the headline starts at 1090. |
| 2 | "faster and faster" became "faster" | **Fixed on 0ced, not in general.** 0ced now reads exactly as said; the tidy changes nothing in it. "More and more people, again and again, over and over" now survives. "X and X and…" still collapses through another rule. See 2. |
| 3 | "not only… but" cut into a fragment | **Fixed on c21c** (one sentence again). The same fault happens with "not just… but also". See 5. |
| 4 | Kept line met twice in a row at the opening | **Fixed for typed words and for the mark and coda.** beeedb62 has no head quote. c21c has no in-body mark and no coda. **Not fixed for the head quote on spoken memories.** See 4. |
| 5 | 5963's takeaway a plain fact | **Fixed.** "You always have to just look for every opportunity." is on the page head, the List card and the mark. There is no coda because the words end on it. |
| 6 | Middot starting line 2 on the phone | **Fixed.** At 390 the print reads "We live in a small / city · It’s in Vietnam". A no-break space before the dot (`JOIN`) keeps the dot on the first line. |
| 7 | Lone wax-seal row in List | **Fixed.** The seal sits on the card's corner (x 516, y −10 at 1366). Both titles in that row start 25px down. |
| 8 | List at 1920 and 2560 became a second prints grid | **Fixed.** List uses two columns of horizontal cards (754×201 and 754×143 at 1920), with 15px under the last line. Prints stays a 4-column grid. |
| 9 | Straight apostrophes in Home.tsx and Shell.tsx | **Fixed in those files.** Others remain on other pages. See 6. |
| 10 | "about 2 / minutes →" on the phone | **Fixed.** `.arc-task-t` is nowrap. The row reads "Give eight memories a year ·" then "about 2 minutes →". |
| 11 | Empty Archive asleep; not-found page top-heavy | **Fixed.** `LedgeNote` defaults to curious, and the empty Archive passes no pose (read in code). The not-found group is centred in the sheet: 176–539 within 76–768 at 1366, 292–655 within 76–1000 at 1920, 379–851 within 99–1300 at 2560. |

## Can the tidied reading be shown to a client, and did tidying change what anyone meant (rule 29)?

Overall the verdict is the same as round 5. The local cleaner cannot repair transcripts that are broken at the source, and the server tidy is off (known). But I found one real meaning change in the founder's own content (defect 1), and two classes of change that the current memories don't happen to trigger (defects 2 and 5). Memory by memory:

- **342e4b40, "Building Better Play Studios through bootstrapping": No, and the meaning is intact.** Everything dropped is filler, a repeat or "Wait, were you? Yeah." It still reads as mangled: "which is a five", "And then my mom did that my dad was an entrepreneur", "So not today, but so I was working with…", "I got to like, and so they ended up winning…", "His manufacturing job got laid off." One point for the founder: the raw "investing in Michigan is like not non-existent" becomes "is not non-existent". The words are the speaker's, but polished, the line reads as a deliberate double negative ("it exists"), the opposite of what was meant.
- **c21cf4d4, "Losing grandparents and preserving a grandfather’s story": No, and the meaning is intact.** The tidy only drops the opening "No," and two "like"s. The "not only… but then…" thought is one sentence again. Transcript faults remain: "because my dad was trying to.", "But he was trying to. He was a really good fan."
- **f6a734be, "Pausing a PhD to support startup ventures": Yes, passable.** It drops "Yeah", "So yeah" and the other person's "That’s awesome." The meaning is unchanged.
- **459228bd, "Choosing a startup over finance graduate study": No, and the meaning is unchanged.** The tidy only drops "And yeah,". The transcript itself is broken ("I specifically PhD of finance.", "People use this to solve my pain.").
- **59632e67, "Funding a startup through pitch competitions": No, and tidying changed what was meant once.** "She took home like hundreds of thousands of dollars" becomes "She took home hundreds of thousands of dollars". The speaker hedged a figure, and the tidy states it as fact (defect 1). Also for the founder: after the "We asked: Do they open to non-students as well?…" line, the teller's "For sure. Yeah, definitely." is dropped as back-channel. That was most likely the answer, so the page now shows a question with no answer. I accepted this in round 5; on a closer reading, I would keep a short yes/no reply directly after a "We asked" line.
- **0ced62a7, "Wanting to preserve grandparents’ stories": Nearly passable, and the meaning is unchanged.** The tidy now changes nothing, so "faster and faster" stands. "I mean FaceTime helps or whatever. It is." is as said.
- **f9b0e6e9 "Ending the chat" and beeedb62 "Childhood…": founder test content, as known.**

## Defects, worst first

1. **Tidying turns a hedged quantity into a stated fact: "like" before a number or amount is dropped as filler.**
   - Where: `dropFillerLike` and `isFillerLike` in `src/components/archive/transcript.ts`. The header comment even gives "she took home like hundreds" as the model case.
   - Sizes: all.
   - Evidence:
     - Live, 5963: raw "She took home like hundreds of thousands of dollars", tidied "She took home hundreds of thousands of dollars".
     - Test strings: "She was like ten years old" → "She was ten years old". "We had like three hundred dollars" → "We had three hundred dollars". "There were like twenty of us" → "There were twenty of us". "It cost like nothing back then" → "It cost nothing back then".
   - Rule: 29 (their words, never changed in meaning); reading-2026 §3.5.
   - Fix: keep "like" when the next word is a numeral, a number word (one…twenty, hundred(s), thousand(s), million), "a few", "half", "nothing" or "every". Add these cases to `transcript.test.ts`.

2. **"X and X and…" still collapses: "worse and worse and then she left" becomes "worse and then she left" (round 5 item 2, half fixed).**
   - Where: the stutter rule in `cleanSpeech`, `/\b((?:[\w'’]+\s+){0,2}[\w'’]+),?\s+\1\b/`. With x = "worse and", it matches "worse and worse and". `MEANT_TWICE` only tests single words, so it collapses.
   - Sizes: all. None of the current eight memories triggers it. Any new one with "faster and faster and…" will.
   - Evidence: "We went faster and faster and then we stopped" → "We went faster and then we stopped". "We tried again and again and finally it worked" → "We tried again and finally it worked". "More and more and more people came" → "More and more people came".
   - Rule: 29, 1.
   - Fix: never collapse a repeated phrase that ends in a conjunction ("and", "or", "after", "by"). Only collapse a repeat whose first word is the same as the word before it (true stutters such as "I, I" and "he was, he was"). Add the three strings above to the tests.

3. **While a photograph loads, its print title is white on cream, about 1.3:1, for one to four seconds on every visit.**
   - Where: `src/components/archive/develop.ts` with `archive-reading.css` 469–470. The veil is hidden until `data-loaded` (`.pic:not([data-loaded]) ~ .veil { opacity: 0 }`). The `.title` stays `#fff` on the frame's `rgb(234, 224, 207)`. This affects every photo print on Home and on the Archive's Prints view.
   - Sizes: all.
   - Evidence: Home at 1366 right after load. The four photo prints show their titles ("Funding a startup through pitch competitions"…) as faint white on cream, nearly invisible. Screenshot: `C:\Users\vngia\.claude\projects\C--Users-vngia-OneDrive---Umich-Desktop-My-startups-A-Story---W-Daniel-Web-App-Ver-Daniel-09212026\04cff20b-3776-4df6-bd0d-d6b89954a7b3\tool-results\mcp-Claude_Browser-blob-1792299452416-uou4yf.jpg`. Computed: title `rgb(255,255,255)`, shadow `rgba(0,0,0,.35) 0 1px 2px`, frame `rgb(234,224,207)`.
   - Rule: 16 (legible), 25 (nothing half-faded), 42 (loading is designed), checklist.
   - Fix: until the photograph is loaded, set the caption in ink (`.pic:not([data-loaded]) ~ .cap .title { color: var(--ink) }`), or hide the caption with the photograph and fade both in together.

4. **On a spoken memory whose words open on the kept line, the head quote and the first sentence are the same words, one after the other.**
   - Where: `MemoryPage.tsx` 212–215. `keptHead` is dropped only when the memory is typed (`opens && !spoken`).
   - Sizes: all.
   - Evidence:
     - c21c and 0ced at 1366: the head quote ("I just lost my grandparents, both on my dad’s side, my grandparents this year." / "I think Daniel’s story is a very good idea…") is at y 366–435, and the same sentence opens the words at y 525.
     - At 1920 and 2560 they sit side by side: the head in the left column, the same words at the top of the middle column.
     - At 390 the head is at y 346 and the words start at 538.
   - Rule: 19 (never the same thing twice on a page), 32. The code comment's own promise, "never twice in a row", is broken.
   - Fix: when the words open on the takeaway, treat spoken words like typed ones. Either use the next-best kept line for the head, or set no head quote and let the first sentence carry the gold mark.

5. **"not just… but also" is still cut into a fragment (round 5 item 3, rule 1).**
   - Where: `punctuateRunOn` in `transcript.ts`. Its guard only knows "not only".
   - Sizes: all. No current memory triggers it.
   - Evidence: "…it was not just about cooking and cleaning for her but also about teaching us how to read…" becomes "…cleaning for her. But also about teaching us how to read and write when nobody else would." That second sentence has no verb.
   - Rule: 29, 17a, 1.
   - Fix: extend the guard to "not just", "not merely" and "not simply", and never break before "but also".

6. **Straight apostrophes in shown copy on other pages (round 5 item 9, rule 1).**
   - Where:
     - `src/components/family/InviteSheet.tsx` 69 (`{who}'s family code`);
     - `src/components/book/Editions.tsx` 74 and 95 ("couldn't");
     - `src/components/family/Duplicates.tsx` 61 ("didn't").
   - Sizes: all, on Family and Book.
   - Rule: 14, 1.
   - Fix: curl them (’) or pass them through `smarten`.

7. **Some controls are smaller than 44px.**
   - Where:
     - the pill nav `.pillnav a` (Shell) is 67–83×38 at 1366 and 1920, with no extended hit area (44 at 800, 49 at 2560 under zoom);
     - Home's `.ribbon-step` arrows are 36×36 at 1366, 1920 and 800;
     - the phone's `.teller-pick` is 161×20, and its `::before` hit area is 42px tall at 390.
   - Sizes: as listed.
   - Rule: checklist (touch target at least 44px), 1.
   - Fix: give the pills a 44px height (or a `::before` hit area), give the ribbon steps a 44px hit area, and make the teller-pick's hit area 44px (`inset: -12px -6px`).

8. **On the tablet, Home's "From the book" quote is half as tall as the card beside it, leaving 241px of empty sheet under it.**
   - Where: Home's lower row at 761–1100px: `.home-quote` next to `.card.glance`.
   - Size: 800×1024.
   - Evidence: `.home-quote` is at 28,1379 and 355×252. `.card.glance` is at 401,1379 and 355×493.
   - Rule: 10 (columns align), 9.
   - Fix: at tablet widths, set the quote full width above "Your book…", or stretch the quote card to the row's height with its words centred.

9. **On the tablet, the memory's tools fall onto their own right-aligned row by 3px.**
   - Where: `.mv-by` / `.mv-state` in the memory head.
   - Size: 800 (all memories).
   - Evidence:
     - `.mv-by` is 541px wide. "Told by Bao in conversation" (237px) and the three tools (307px) need 544px.
     - "Treasure it · Public · Share" wraps to a second line at x 368–675, pushed right by an automatic 246px margin. Its right edge is 12px past the 663px column edge.
   - Rule: 10.
   - Fix: at 761–1100px, put the tools on their own row, left-aligned under the teller as at 1920, or close the gaps so the row fits.

10. **In List, a card with a chapter kicker has its title lower than its neighbour's.**
    - Where: the List `MemoryCard` kicker (`.kicker`, "Childhood").
    - Sizes: 1366, 1920 and 2560 (two-column rows).
    - Evidence: the "Childhood in a small city in Vietnam" title starts 47px into its card, "Ending the chat" beside it at 25px (60 against 32 at 2560).
    - Rule: 10 (tops line up).
    - Fix: move the chapter chip into the card's bottom meta row next to the teller, or onto the print's corner, so every title starts at the same height.

11. **On the phone, the not-found line ends on a two-word widow, "it was."**
    - Where: `.ledge-text`, which is `text-wrap: pretty`.
    - Size: 390.
    - Rule: 16.
    - Fix: `text-wrap: balance` on the centred `.ledge-text`, and on `.invite .line` for the same reason.

## What holds

- No horizontal scroll on any page in scope at any of the five sizes. The only clipped content is the cloth's decorative lamp and deboss (`aria-hidden`).
- No clamped or clipped text, and no text under 12px, at any size. Every `.said` on the typed prints fits: at 390 the lines are 84/84, 84/84, 42/42 and 21/21.
- Memory pages: reading type is 22px at 1366, 23px at 1920 and 2560, 21px at 800 and 20px at 390. The kept line is 25–26px, or 21px on the phone. There are three columns at 1920 and 2560, a plate layout on 4592 and 5963, and the photograph follows the first paragraph on the phone and the tablet.
- The running head names the section you are in ("NOT DATED YET", "CHILDHOOD", "WHAT THE FAMILY REMEMBERS" on the phone) and reads "ARCHIVE" at the top of a memory.
- Previous and Next, "Memory n of 8" and "Where to next" end every memory. The not-found page has the cloth bar, one sheet, Bond on his ledge, the foil stop, one line and one action at every size.
- Prints at 800 are three columns of 232px. List at 800 and 390 is one column of horizontal cards with the seal on the corner. The pill nav stays in the bar at 800, with all four places and Add visible.
- The empty invite injected into Home's grid holds at all five sizes. No text under 14px, and Bond never overlaps the words.

## Not verified

- Home's empty invite was measured by placing its markup into Home's real grid in my own tab, not on a real empty account. The Archive's empty state was read in code, not rendered.
- Not exercised: reduced motion, hover, active and focus-visible states, the lightbox, View Transitions between memories, a zoomed-out Edge window, and a live resize.
- On my first Archive load, Vite showed an error overlay for `src/pages/Write.tsx` ("Identifier `asked` has already been declared", line 541). That was another builder's edit in progress; the file compiled later in the run. It is not counted against these pages.
- One client-side move from a long memory to the not-found page caught the pane mid-View-Transition, with the content offset and cream below. A fresh load was correct. I count this as the hidden pane, as in round 5.
- Screenshots at 1920 and 2560 are scaled by the pane, so those findings are measured. Tab-99 was the only tab in the pane, so closing it closed the pane.
