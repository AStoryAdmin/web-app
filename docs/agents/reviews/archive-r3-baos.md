# Archive, memory page and Home cards, round 3 (Bao's Standard)

**FAIL**

Scope: `/archive`, `/archive/:id` (the router has no `/memory/:id`; `src/App.tsx` line 59 sends memories to `/archive/:id`, and `/memory/...` falls through to "This page isn't here"), and Home's prints (`Mosaic` → `PrintCard`; the Archive's List view uses `MemoryCard`).

How I checked: I used my own tab in the Claude pane, with the founder signed in. I did a fresh load at each size (1366×768, 1920×1000, 2560×1300 with html zoom 1.3, and 390×844), stepped GSAP and ScrollTrigger, and measured with getBoundingClientRect, scrollHeight against clientHeight, and computed styles. I read the text of every memory page in its tidied form, and the word-for-word form for 342e4b40 and f9b0e6e9. I pressed only "Read it word for word" and the Prints/List view switch, then put both back. No writing control was touched.

Earlier archive reports: there are none in `docs/agents/reviews/`. It holds only signed-out-r1 and writer-r2. So the first check below is against the builder's own list of fixes for this round.

## The builder's claims, checked

| Claim | Result |
|---|---|
| Long spoken transcripts split into paragraphs | **Partly.** 342e4b40 is now 9 paragraphs (longest 501 chars). c21cf4d4 is still one 661-char block (11 lines at 1366), and f6a734be one 646-char block (10 lines). See 8. |
| Only the teller's own words on cards and quotes | Holds. No "You:" or "AI:" on any card. "Ending the chat" shows only "How to end chay". |
| "Anything else" gone everywhere | **False.** The Archive's chapter chip reads "Anything else · 7" at all four sizes, and the hero counts it as a chapter. See 2. |
| Print titles no longer clipped | Holds at 1366, 1920 and 2560. **False at 390**. See 3. |
| Plain drop cap | Holds. Chocolate, `initial-letter: 3` on desktop and 2 on the phone, skipped for paragraphs opening on "And" or "No". |
| Words start higher | Holds. Words start at 480px at 1366 without a plate, 508px with one, and 432px at 390. |
| Kept line refuses filler | Holds. No kept line opens on So, Like or Yeah. But the lines it does pick are plain facts. See 6. |
| "Told by … in conversation" | **Partly.** Shown on 342e, 5963, 4592 and f6a7. "Written by Bao" on c21c and 0ced, which come from the same interview. The cards and Home also still say "Written by". See 7. |
| 44px targets | Holds on the memory page: every control measured 44px or more (the back link, "Add when it was", Treasure, Public, Share, the tidy toggle, tools, •••, the page turn and "Add what you remember"). Archive chips measure 44. |
| Other speakers' questions lifted to "We asked" | Holds, but one lifted line is a reaction, not a question. See 9. |
| Wide-screen layout | Holds. At 1920 the head is a 440px sticky column, the words 584px and the margin 340px, all inside 1640. At 2560 the page scales to 2132px under zoom 1.3. |

## Defects, worst first

1. **The tidied reading of a long call is still unreadable: run-on sentences with no punctuation, false starts and filler "like" are left in.**
   - Where: `/archive/342e4b40…`; `cleanTranscript` and `splitRunOn` in `src/components/archive/transcript.ts`.
   - Sizes: all.
   - Evidence: the first paragraph in the tidied view is 411 characters with one full stop: "My dad so I started my career as a middle school teacher so I taught like teenagers which is a five and then my so my mom did that my dad was an entrepreneur and so I learned…". Further on: "So not today, but like, so I was working…", "So we did like a, we built…", "And so I got to like, and so they ended up…", "That's how we got, that's how we built the company." The drop cap sits on "My dad so I started". f9b0e6e9's tidied text, "How to end chay", has no full stop.
   - Rule: 17a (reading comes first); reading-2026 §3.5 ("Punctuate by sense and use sentence case"; remove false starts).
   - Fix: run the existing `/api/memory/help` "tidy" pass, constrained to punctuation, sentence case, filler and false starts with no rephrasing, once per memory. Store the result beside the raw text and show it as the tidied view, keeping the local cleaner only as the offline fallback.

2. **"Anything else" is still on the Archive as a chapter, and it is counted as one.**
   - Where: the chapter chips in `src/pages/Archive.tsx` (lines 89–92 and 373–383), and the hero stat from `archiveStats` in `src/app-core/lib/timeline.js` line 280.
   - Sizes: all four.
   - Evidence: the chips read "All · 8 | Childhood · 1 | Anything else · 7". The hero says "2 Chapters" when only Childhood is a chapter.
   - Rules: 34, 35; reading-2026 §3.6 ("Anything else", which isn't a chapter); rule 1.
   - Fix: pass both the chips and `archiveStats` through `realChapter`, drop the chip row when fewer than two real chapters remain, and grep the Book and the Write chapter list for the same label.

3. **The kept line and long titles are clipped on the prints.**
   - Where: `PrintCard` typed cards (`.print-card.typed .said`, `.cap .title`) on Home and the Archive.
   - Sizes:
     - 390: the kept line is clamped to 1 line of 3 on every typed card on Home and the Archive (clientHeight 22 against scrollHeight 66), so it shows only "My grandfather was a…". The title "Losing grandparents and preserving a grandfather's story" is clipped on Home (57 against 77) and on the Archive.
     - 1366, Archive: the kept line is clamped to 2 of 3 lines (50 against 75) for both "My grandfather was a police officer and he was a good man." and "My co-founder has never jumped full time to another company."
   - Rules: 32 (the kept line is the card's excerpt, so it must be readable whole); checklist ("no clipped text").
   - Fix: never clamp a kept line. Fit the card to it: let the typed card grow, or set `.said` to fit at 15px. At 390, give typed cards a taller ratio than photo prints, and lift the title clamp to its full length.

4. **The kept line under the title is smaller than the body text, and its gold band reads as a tinted bar.**
   - Where: `.mv-kept` and `.mv-kept span` in `src/styles/pages/archive-reading.css` lines 116–117.
   - Sizes:
     - 1366: 20px against a 22px body.
     - 1920 and 2560: 21px against a 23px body.
   - Evidence: the CSS paints the band from 38% to 88% of the line in 30% foil. That is a highlighter through the x-height. The marketing site's device (docs/research/founder-sites/astory-home-calls-1440.jpg) is a low marker underline under the baseline. The line also carries `-webkit-line-clamp: 2`. `keptLine` allows 170 characters, which is about 3 lines at 559px, so a long kept line would be cut.
   - Rules: 32 ("set large, marked in gold"); founder-sites §1 (EB Garamond italic 24–26px with the gold marker underline); 33.
   - Fix: set it at 25px (26 at ≥1680, 21 on the phone) and remove the clamp. Paint the marker as a low stroke, about `linear-gradient(transparent 70%, foil 45% 70%–92%, transparent 92%)`.
   - Open question 2: yes, as built the band reads as a tinted background.

5. **The phone has no takeaway on its first screen, and the desktop has no closing coda.**
   - Where: `src/styles/pages/archive-reading.css` lines 161–162 (`.mv-coda` hidden at ≥600px, `.mv-kept` hidden at ≤599px).
   - Sizes:
     - 390: the kept line first appears at y=2730, after 2266px of words.
     - 1366, 1920 and 2560: no coda.
   - Rule: 32 says the line is set under the title *and* repeated as the closing coda.
   - Fix: show `.mv-kept` under the title at every size, and the coda at every size when the body has more than one paragraph.
   - Open question 1: the sentence also appearing in the body is right, because the takeaway is a verbatim span. To make it read as the source and not a repeat, give that sentence in the body the same low gold marker, as the marketing site marks Rosa's phrase inside her quote.

6. **The suggested kept lines are plain facts, not what a skimming reader should remember.**
   - Where: `keptLine` in `src/components/archive/transcript.ts`.
   - Sizes: all.
   - Evidence:
     - 342e: "My co-founder has never jumped full time to another company." The sentence that carries the memory is "It's been challenging, but I think it's why we have the opportunity to get it."
     - 4592: "My dad's an entrepreneurial finance professor and I'm from Milwaukee, Wisconsin."
     - 5963: "I've taken just under $300,000 in non-delivered funding."
     - Home's "From the book" quotes the 4592 fact.
     - Causes: `OPENS_WEAK` rejects every sentence opening "It's", "That's" or "And". The feeling list is narrow, and the 1-to-3-point first-person score outweighs it.
   - Rule: 32 (the takeaway, "the thing a skimming visitor should remember").
   - Fix: allow the "It's/That's/And" openers when the sentence has a feeling or judgement word (challenging, dream, love, hard, proud, wish, never forget). Weight feeling above first person. Give the teller "Keep this line" on any sentence (founder-sites §1), so the suggestion is only a default.
   - Open question 3: yes, they are plain facts.

7. **The teller line contradicts itself between memories and between the page and the cards.**
   - Where: `MemoryPage.tsx` (`spoken` heuristic); `toldBy` in `src/lib/memoryDisplay.ts`, used by `MemoryCard` (sr-only text and title); Home's `FromTheBook`.
   - Sizes: all.
   - Evidence:
     - c21cf4d4 ("No, I just lost my grandparents…") and 0ced62a7 ("And I think Daniel's story is a very good idea…") are clearly speech but say "Written by Bao", because `soundsSpoken` counts too few markers.
     - 459228bd reads "Told by Bao in conversation" on its page but "Written by Bao" on Home's "From the book" and in the List card's label.
   - Rules: 1 (apply it everywhere); 20 and 29 (honest about who did what and how).
   - Fix: one shared `toldBy(memory, story)` that uses `familyCallId`, `source` or the transcript test, called by the page, `MemoryCard`, `PrintCard` and `FromTheBook`.

8. **Long spoken paragraphs are still unsplit on two memories.**
   - Where: `readableParagraphs` in `src/components/archive/photos.ts`.
   - Sizes: all. At 1366: c21cf4d4 is 661 chars (11 lines) and f6a734be is 646 chars (10 lines).
   - Cause: the loop only breaks after the running length passes 380, so a long last sentence is kept on the paragraph that already overshot.
   - Rule: 17a; reading-2026 §3.4 (paragraphs target about 380 characters).
   - Fix: break *before* a sentence that would take the run past about 1.45 × target, and apply the same splitting to typed prose over 560 characters.

9. **A reaction is lifted as a "We asked" question.**
   - Where: `liftQuestions` and `ASK` in `transcript.ts`.
   - Evidence: in 342e the line "We asked Wait, were you?" sits between "I was working a corporate job." and "So not today…". It asks nothing the teller answers.
   - Rule: reading-2026 §3.5 (set the other person's question only when the teller answers it, "otherwise drop the other person's lines").
   - Fix: drop questions under about five words or opening on "Wait,"; lift only those the next paragraph answers.

10. **On the phone, the tools row is misaligned and the tidy note leaves its separator dangling.**
    - Where: `.mv-tools` and `.mv-tidy` in `archive-reading.css`.
    - Size: 390.
    - Evidence: the "Add the first photograph" icon sits at x=20 and the wrapped "Add to the words" icon at x=32, because the −12px margin is on `:first-child` only. "Lightly tidied from the conversation ·" ends its line with a bare middot, and the link drops to the next line.
    - Rules: 10, 16.
    - Fix: on phones, stack the tools as a ruled list with one shared left inset. Hide the middot at ≤599px, or keep "· Read it word for word" together with `white-space: nowrap`.

11. **Print and card titles keep straight apostrophes while the memory page curls them.**
    - Where: `PrintCard` and `MemoryCard` (they render `meta.title` without `smarten`).
    - Sizes: all.
    - Evidence: "Wanting to preserve grandparents' stories" and "…a grandfather's story" on Home and the Archive. The page shows "grandparents’", "grandfather’s".
    - Rules: 14 (set like the printed book); 1.
    - Fix: `smarten(meta.title)` in both cards and in their aria-labels.

12. **On a big screen the Archive prints are small and leave a ragged second row.**
    - Where: `.arc-prints` grid.
    - Sizes:
      - 1920: six 247px prints across.
      - 2560: six 321px prints across (under zoom).
    - Evidence: the second row holds 2 of 6 with four empty slots, and the page ends at 1397px on a 1000px window.
    - Rules: 8, 10.
    - Fix: at ≥1600 cap the grid at 4 columns (about 395px prints at 1920), so 8 memories make two even rows of readable photographs and kept lines.

## Not verified

- Visual screenshots at 1920 and 2560: the pane scales them to about 0.2. Midway through the run the pane was hidden, so screenshots timed out and everything after that is measured, not seen.
- Emulated resizes did not fire `resize` in this pane, so html zoom stayed stale until reload. Every size above was measured after a fresh load. I did not test a live window resize in Edge.
- Not exercised: reduced motion, hover, focus-visible, active and loading states, View Transitions between memories, and the lightbox.
- Edge itself, and a zoomed-out window other than the 2560 zoom case.
