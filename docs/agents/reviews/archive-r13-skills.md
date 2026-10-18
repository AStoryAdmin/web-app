# Skills Steward: the Archive, the memory page, and PrintCard, MemoryCard and Mosaic on Home, round 13

**Verdict: NOT APPLIED.** No blockers, five ugly gaps, three polish gaps.

What passes:
- The suite passes: `vitest run src/components/archive src/lib` runs 9 files and 417 tests. `tsc --noEmit -p tsconfig.app.json` exits 0.
- On all eight live memories, every cut is on the list, and every page shows exactly `cleanTranscript`.
- Most r12 items are closed:
  - r12 skills gaps 1, 2, 4, 5 and 8 are closed in full. Gaps 6 and 7 are closed except for the edge cases in gaps 6 and 7 below.
  - r12 BAOS defects 1, 3, 6 and 7 are closed. The rest of BAOS 2 is gap 5 below.
- The 320 fixes do what they say. The typed prints are no longer clamped. The running head is whole at 320, and the ribbon days are 46.7px.

What does not pass:
- **The 320 print fix breaks the row beside it.**
  - On Home at 320, a photo print next to a typed print grows to 186px wide and runs 31px off the screen, and its title is cut off.
  - On the Archive at 320, two typed prints in one row get frames of different heights.
- **The running head is still cut off at 360 to 389px**, including 375. The fix starts below 360.
- **The "New from …" cue** covers the first line of a typed print's words at every size. On phones it is cut off.
- **Two cuts the list forbids:**
  - (b) still takes a hedging "like" before "fifteen", "nineteen seventy-five", "an hour" or "a year".
  - A "Yeah," that answers a question in single quotes is cut.
- **25 of 115 mutants pass the whole suite.** Five of them are from r12: R29, N21, N26, N27 and N31. Four of those failed last round; the round-13 rulings took away the inputs that caught them.

## How this was checked

- **Skills read:**
  - taste-skill: the house rules.
  - hallmark: responsive ("render flawlessly at 320, 375, 414 and 768"; single-line affordances), interaction states, slop test.
  - emil-design-eng: easing, duration and frequency.
  - impeccable: craft-floor ("Run the real copy at every breakpoint and fix what overflows"), harden.
  - GSAP skills: no motion changed, so I checked for regressions only.
- **Standards read:** BAOS-STANDARD.md 17a, read fresh:
  - (a) with the list comma and "Yeah, right";
  - (b) with the be/go/say and amount exceptions;
  - (c);
  - (e) "never inside quotation marks";
  - where a speaker label counts;
  - the yes-or-no "We asked";
  - the kept line's joint.

  I judged the tidy against that list only.
- **Reviews read:** archive-r12-skills.md and archive-r12-baos.md.
- **Code read:** commit 57c3d46:
  - all of `transcript.ts` (617 lines);
  - the round-13 part of `transcript.test.ts` (the updated `breaksRule`, `R13_*`, the contract);
  - the `archive-reading.css` and `astory.css` hunks, and the PrintCard cue CSS (`astory.css`:2404–2507).

  The working tree is clean for these files. Other agents' uncommitted edits are in `src/pages/auth/bookFit.ts` and `signed-out.css`.
- **Mutation testing:**
  - **Setup:** I copied `transcript.ts`, its test and the fixtures to my scratchpad and ran the real vitest there through a junction to `node_modules`. The suite has 381 tests.
  - **Mutants:** 115 in all.
    - R1–R30 and N1–N35 from archive-r12-skills.md, rewritten for 57c3d46. N35 is now the r12 opening rule.
    - T1–T49, new against the updated rulings.
    - T50, the unchanged code, as a control.
- **Direct probes:** I ran 57c3d46's `transcript.ts` under Node 24.18 on about 60 strings: `cleanSpeech` with explain, `explainTranscript`, `keptLine`, `takeaway` and `ownWords`.
- **Live words:** I used my own tab (tab-190) and imported the page's `transcript.ts` through Vite. For each memory with a toggle, I:
  - pressed "Read it word for word" and then "Read it tidied";
  - ran `cleanTranscript`/`explainTranscript` on the exact words;
  - compared the result word for word with the rendered `.mv-para`.
- **Rendered:**
  - **The Archive in Prints at 320×700:** I pressed the page's own Prints button and then List.
  - **The running head on all eight memories:** at 320, scrolled from the top to the end in 200px steps; and f9b0 at 360, 375, 390 and 414.
  - **Home:** at 320, 390 and 1366.
  - **Screenshots:** at 320 and 375 to confirm.

## The things asked

### The mutation harness: 79 fail, 25 pass that should fail, 11 not counted

**Round 11 (R1–R30): 29 of 30 fail.** R29 passes (see gap 6).

**Round 12 (N1–N35): 29 of 35 fail.**
- N4, N8, N15, N17, N20, N28, N30 and N34 now fail on the inputs added this round. N35 fails as well: it is the r12 opening rule, now forbidden.
- N9 and N14 are equivalent, as before.
- N21, N26, N27 and N31 pass (see gap 6).

**Round 13 (T1–T50): 21 of 50 fail.** These fail:
- (b): T1 quoting and T2 amount exceptions removed; T7 amounts as digits only; T8 "a few"/"a couple" dropped; T11 currency dropped.
- (a): T12 both commas always go; T13 one comma always stays; T16 a capital not counted; T24 the r12 answer flag after a reaction question; T25 "Yeah, right" exception removed.
- (e): T20 the r12 quote stripping; T22 curly-quote stripping.
- "We asked": T27 the r12 wh-questions; T29 "why".
- Labels: T30 the r12 TURN; T31 Q/A anywhere.
- Kept line: T36, T37 and T38, each asked-line filter.
- Other: T39 the r12 `cap`; T40 sentences without the straight quote.

**Not counted (11):**
- **Equivalent:** N9 and N14, as before. T44, a "\n" left inside a named turn: it renders as a space.
- **Keep more than the list:**
  - T14 and T19 (a comma kept where both may go);
  - T46 and T47 (the guards without a word boundary);
  - T48 and T49 (the like exceptions read more loosely).

  A filler the list does not catch is not a defect.
- **For the lead:** T26, "So yeah, right" (see the end).
- **Control:** T50.

**The 25 that pass are gap 6.**

### The tidy against the list

**Live: every cut is on the list.**
- **342e:** cut "Wait, were you?" and the "Yeah." after it (e).
- **5963:** cut "Yeah, " after "So we did all these cool things." (a), and "Yeah, right?" and "Wow, that's amazing." (e). It has one "We asked", in the 5963 shape.
- **f6a7:** cut the opening "Yeah, " (a), a later "Yeah, " (a), a "So yeah, " (a) and "That's awesome." (e).
- **f9b0:** nothing cut. The AI turn is set as "We asked", which is accepted.
- **0ced, c21c, 4592:** spoken but nothing cut, so there is no toggle.
- **beee:** typed, so there is no toggle.
- **Joined words:** on 342e, 5963, f6a7 and f9b0 they equal `cleanTranscript` exactly. The page splits long paragraphs into more `.mv-para` elements; that changes no word.
- **The toggle:** the tidied view comes back identical every time.
- **Kept lines:** the same as r12:
  - 4592: "The best way…";
  - 5963: "You always have to…";
  - f6a7: "I want to help…";
  - 342e, c21c and 0ced: verbatim.

**Round-13 behaviour, by probe:**
- **(b):** "She goes, like, no way." / "He said, like, get out." / "I'm, like, so tired." / "We had, like, half a bowl" all stay. "We were poor, like, really poor." loses its "like", which the list allows.
- **(a):**
  - "Tuan, um, Minh and Long" → "Tuan, Minh and Long".
  - "We were, uh, poor for a long time and hungry." → both commas go ("and" is the fifth word).
  - "Yeah, right." stays after the first sentence.
- **(e):** "'Wow.' That was all." stays, and so do curly, straight and single quotes. A quoted "Wow." in the teller's named turn stays.
- **Labels:** "Me: We went there, A: the north road." stays whole. "AI: What did you eat\nMe: Rice…" splits at the line break.
- **The lift:** "Should they open…?" and "Do I need to apply?" are not lifted.
- **Kept line:** the asker's "We want people…" is no longer chosen.

### The 320 layout fixes

| r12 BAOS defect | Now |
|---|---|
| 4: typed print clamped | **Fixed as asked, with a new fault (gap 1).** Words whole: c21c 126/126px, 342e 105/105, beee "We live in a small city · It's in Vietnam" 63/63, f9b0 42/42. No clamp, no overlap with the caption, everything inside the frame. |
| 5: running head clipped | **Fixed at 320, still clipped at 360–389 (gap 2).** At 320, all eight memories: top state "The Vo book \| Archive"; in the family section, "What the family remembers" alone. Nothing clipped. |
| 7: ribbon days 40px | **Fixed.** 83 days at 46.7px (49.3px for one), 81px tall. `scrollWidth` 320. |

## Round 12, checked

| # | r12 skills gap | Now |
|---|---|---|
| 1 | "Yeah," after a reaction question | **Done** (`afterQuestion = isQuestion(s)`; T24 fails) |
| 2 | Quoted reaction cut | **Done** (tested as written; T20 and T22 fail). Single quotes are untested (gap 6). |
| 3 | Nine mutants passed | **Eight closed** (N4, N8, N15, N17, N20, N28, N30, N34). N21's new fixture cannot reach it: "They were open…" never matches `ASK`. Four more now pass (gap 6). |
| 4 | Kept line could be the asker's going-on | **Done** (T36–T38 fail) |
| 5 | A "why" question lifted | **Done** (yes-or-no only; T27 and T29 fail) |
| 6 | First word before its double | **Done for So, Well and Okay.** "Yeah, yeah" still loses one, through (a)'s later rule (gap 8). |
| 7 | Straight closing quote | **Done in `sentencesOf`** (T40 fails). `isQuestion` and the other end-of-sentence patterns still lack it (gap 4); kept-line and takeaway are untested (gap 6). |
| 8 | "A:" inside a labelled sentence | **Done** (T30 and T31 fail) |
| 9 | `takeaway` comment; `cap` | **Done.** The file's header comment is now stale (gap 7). |

| # | r12 BAOS defect | Now |
|---|---|---|
| 1 | Quoting "like" | **Done** (T1 fails). Only "was" is tested (gap 6). |
| 2 | Hedge before an amount | **Partly.** The teens, spoken years and "an hour"/"a year" are still cut (gap 5). |
| 3 | List commas | **Done** (T12, T13 and T16 fail) |
| 4 | Typed print clamped at 320 | **Done, with gap 1** |
| 5 | Running head at 320 | **Done at 320; gap 2 at 360–389** |
| 6 | Quoted "Wow." | **Done** |
| 7 | Ribbon days 40px | **Done** |

## Gaps, skill by skill

### Ugly

1. **At 320, a typed print grows to fit its words, and the print beside it widens past the screen or is left with a short frame.**
   - **Rules:**
     - hallmark responsive: render flawlessly at 320;
     - impeccable craft-floor: "fix what overflows";
     - the checklist: no clipped text;
     - taste: one print size per row.
   - **Where:** `archive-reading.css`:658–665, the new `@media (max-width: 359.98px)` block. The typed frame becomes `height: auto`, so the row grows. A photo print in the same row has a 3:4 frame, so its width follows the taller row.
   - **Evidence:**
     - **Home, 320×700, row 2:**
       - The typed c21c print is 246px tall, and the photo print beside it is 165–351px wide. It runs 31px past the 320 edge, and its title reads "Choosing a startup ove…".
       - In row 3, the photo print is 20–166 and the typed print starts at 165. They overlap, and the gap between them is gone.
       - At 390 every Home print is 170×225.
     - **Archive Prints, 320×700:**
       - Typed prints share each row, so nothing overflows.
       - The frames are uneven: 232 against 214px, and 192 against 164px. That leaves 18 and 28px of bare mat under the shorter frame. See the screenshot: c21c/342e and beee/f9b0.
   - **Change:** keep every print at its 3:4 and fit the typed words to it. Two ways:
     - Measure, as the titles already do, stepping `.said` down to 13px.
     - Or, below 360px only, move the kicker into the caption line and allow 3 lines of words.

     If the frame must grow, give every frame in the mosaic below 360px `width: 100%; height: 100%`, with `aspect-ratio` as a minimum only. Then neighbours never widen, and the frames in a row stay level. Either way, check Home and the Archive at 320 with a typed print beside a photo print.

2. **At 360 to 389px, the running head still cuts off both names in the family section.**
   - **Rules:**
     - hallmark responsive: "320, 375, 414 and 768";
     - the checklist: no clipped text;
     - rule 28.
   - **Where:** `astory.css`:3365, `@media (max-width: 359.98px) { .running-head-sheet.in-section > span:first-child { display: none; } }`.
   - **Evidence:** on f9b0, at the end of the page:
     - At 360: "The Vo book" is 101px of text in 93px, and "What the family remembers" is 231px in 211px.
     - At 375: 101 in 97, and 231 in 222. The screenshot shows "THE VO BO…   WHAT THE FAMILY REMEMBE…".
     - At 390 and 414 both fit with no room to spare. A longer family name will clip there too.
   - **Change:**
     - Raise the query to about `max-width: 479.98px`, or hide the book's name whenever the two labels do not fit, measured once in Shell.
     - Test at 360, 375 and 414 with a longer book name.

3. **The "New from …" cue covers the typed words and is cut off on phones. Since this commit it also spills onto the next print at 320.**
   - **Rules:**
     - impeccable craft-floor: overlap and real copy;
     - hallmark states: the "new" state is part of the card;
     - the checklist: no clipped text.
   - **Where:**
     - `astory.css`:2404–2405: `.cues` absolute at the top left, `.cue` `white-space: nowrap`.
     - :2507: `.print-card.tall .cues { max-width: calc(100% - 88px) }`.
     - `archive-reading.css`:659 now sets the typed `.frame` to `overflow: visible` below 360.
   - **Evidence:** c21c on Home, with the live cue "New from Bao Ngo Gia Vo":
     - At 1366, the cue sits 8–32px from the frame's top, while the words start at 26. It covers the first line by 6px.
     - At 390, the cue is 193px wide in a 158px frame. It shows "New from Bao Ngo", cut off, over "My grandfather was a".
     - At 320, the cues box is 35px and the 193px cue runs across the neighbouring print.
   - **Change:**
     - When a cue shows, push the typed words below it: `.print-card.typed:has(.cues) .typed-in { padding-top: calc(var(--top) + 28px) }`.
     - On tall phone prints, let the cue wrap (`white-space: normal`), or show the dot plus the first name ("New from Bao"), with the full name in the accessible name. No ellipsis.
     - Keep `overflow: hidden` on the frame.

4. **A "Yeah," that answers a question in single quotes is cut.**
   - **Rules:**
     - 17a (a): "that does not follow a question";
     - "never an answer";
     - r12 gap 7, which asked for the straight quote in every end-of-sentence pattern.
   - **Where:** `transcript.ts`:54. `isQuestion` reads `/\?["”’)]*$/`, without `'`. The same pattern lacks it at:
     - :57 `TAG`;
     - :63 `TELLER_ANSWERS`;
     - :438 and :440 `DANGLES`/`ENDS_WHOLE`;
     - :562 the `takeaway` question test;
     - `breaksKeptLine` in the test (:910).
   - **Evidence:**
     - `He asked me, 'Were you there?' Yeah, I was there the whole time.` → `He asked me, 'Were you there?' I was there the whole time.` (a-later "Yeah, ").
     - The same happens across a paragraph break.
     - `breaksRule` already rejects this cut ("follows a question"), but no fixture holds the string.
   - **Change:**
     - Add `'` to those patterns.
     - Add both strings to `R13_TRANSCRIPT`, with the "Yeah," kept.

5. **(b) still takes a hedging "like" before many amounts, so a guess reads as a fact.**
   - **Rules:**
     - 17a (b): "before an amount, where it hedges … stays";
     - "never a hedge before an amount".
   - **Where:** `LIKE_AMOUNT_NEXT`, `transcript.ts`:41, mirrored in `breaksRule`'s (b). The number words run one to twelve, then the tens. They leave out thirteen to nineteen, "several", and "a"/"an" before a unit.
   - **Evidence:**
     - "We stayed there for, like, fifteen years." → "…for fifteen years."
     - "We left in, like, nineteen seventy-five." → "We left in nineteen seventy-five."
     - "We waited, like, an hour for the bus." → "We waited an hour…"
     - "We stayed, like, a year in the camp." → "We stayed a year…"
     - "We had, like, several hundred dollars." → "We had several hundred dollars."

     "There were, like, thirteen of us" stays only because "were" comes first.
   - **Change:**
     - Add `thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|several|once|twice`.
     - Add `an? (?:hour|day|week|month|year|minute|mile|kilo|pound|dollar)s?\b`.
     - Mirror the list in `breaksRule`.
     - Add the five strings to `R13_KEEP`.

### Polish

6. **25 mutants pass the whole suite. Each is a cut or a lift the list forbids, and each needs one input.**
   - **Rules:**
     - the brief: every mutant fails;
     - 17a: "the tests check every cut against its rule";
     - impeccable harden.
   - **Where:** `R13_KEEP`, `R13_TRANSCRIPT` and `keepCorpus` in `transcript.test.ts`.
   - **What survives, and the input that would catch it:**

     | Mutant | Why it survives now | Add |
     |---|---|---|
     | R29 a first-person question lifted | its catcher was "Why did we leave Hue?", which `ASK` no longer reaches | `R13_TRANSCRIPT`: "Do I need to apply? Because our plan is to find a student. Yes. We did." kept |
     | N21 a tag question lifted | the new fixture opens "They were…", which `ASK` never matches | "Was it good, right? Because our school was small. Yes. It was." kept |
     | N26 a typed takeaway loses ", like," | the typed fixture's "like" now follows "was" and is kept anyway | a typed takeaway test: "We were poor, like, really poor. I loved my mother more than anything." keeps its "like" |
     | N27 labels found in unlabelled words | "plan A:" no longer splits under the new `TURN` | "I asked the AI: should we go? It said nothing." kept whole |
     | N31 the kept line may be one the tidy changes | no spoken fixture's best line holds a cut now | a spoken text whose best sentence holds ", um," must not give that sentence as the kept line |
     | T3 / T4 / T5 / T6 quoting after go / say / 's 'm 're / is are were be | only "was" is tested | "She goes, like, no way." "He said, like, get out." "I'm, like, so tired." "They are, like, the best." kept |
     | T9 / T10 hundreds, thousands, half, dozen; the tens | "twenty" is guarded by "were" before it | "We paid, like, thirty dollars." "We had, like, half a bowl." "We walked, like, a thousand miles." kept |
     | T15 / T17 / T18 the list window narrowed; a number; "or" | no input has "and" as the third word, a number, or "or" | "We had, um, rice beans and fish." → "We had, rice beans and fish."; "We had, um, 20 dollars." → "We had, 20 dollars."; "We had tea, um, coffee or milk." → "We had tea, coffee or milk." |
     | T21 single-quoted reaction cut | no single-quoted reaction | "'Wow.' That was all." kept |
     | T23 quoted reaction cut from the asker's line | none | `["Interviewer: 'Wow.' Really?"]` keeps "'Wow.'" |
     | T28 should / may lifted | none | "Should they open to everyone? Because our plan is to find a student. Yes." kept |
     | T32 You / Me as labels mid-sentence | none | `["AI: Tell Me: what happened?"]` keeps "Tell Me: what happened?" |
     | T33 / T45 no split at a line break | the only line-break fixture has "AI:", which splits anywhere | `["AI: What did you eat\nMe: Rice and fish every day."]` → asked "What did you eat", told "Rice and fish every day." |
     | T34 the other side's names not split mid-line | the f9b0 test now uses "\n" | `["You: Hi there AI: Hello. What do you remember?"]` → told "Hi there.", asked "Hello. What do you remember?" |
     | T35 a label after a comma | none | `["Me: We went there, Me: the north road."]` kept |
     | T41 / T42 / T43 the straight quote in `keptLine` / `takeaway` / `findTakeaway` | the r12 strings went to `cleanSpeech` only | `keptLine`/`takeaway`: "I remember she said, 'I will always love you, my dear little one.' Then she left." keeps its closing quote; `findTakeaway` finds it |

   - **Checker updates:** `breaksRule` needs the amount list from gap 5. `breaksKeptLine` needs `'` in its closers.

7. **The header comment of `transcript.ts` no longer states the list the code applies.**
   - **Rule:** impeccable harden. The file says it is "the closed list of rule 17a in its final, small form".
   - **Where:** `transcript.ts`:8–22, and the constant comments at :30, :34 and :36.
   - **What is out of date:**
     - (a) says "with a comma that sets one off". It omits the list-goes-on comma and "Yeah, right".
     - (b) gives no exceptions.
     - (e) omits "never inside quotation marks".
     - "We asked" is "the 5963 shape", without the yes-or-no limit or where labels count.
   - **Change:** rewrite the header from 17a as it now reads.

8. **"Yeah, yeah" loses its first word through (a)'s later rule. The r12 gap-6 guard covers only the opening rule.**
   - **Rules:** "never a word doubled for emphasis"; the brief: a cut on the letter that changes meaning.
   - **Where:** `LATER_YEAH`, `transcript.ts`:35. The opening guard at :33 refuses the opening cut, and then :202 takes the same words as a-later.
   - **Evidence:**
     - "Yeah, yeah, yeah, we know." (the teller's first words) → "Yeah, yeah, we know."
     - "Yeah, yeah, I remember." → "Yeah, I remember."

     The dismissive double becomes plain agreement.
   - **Change:**
     - Write `/^(?:[Yy]eah|[Ss]o yeah),(?!\s*(?:[Rr]ight|[Yy]eah)\b)\s*/`.
     - Mirror it in `breaksRule` (a-later).
     - Add both strings, kept.

### For the lead, not counted

- **The lift takes "Does".** "Does your school open to everyone? Because our plan… Yes." is set as "We asked". 17a's parenthesis lists do and did, but not does.
- **The opening rule still turns "Yeah, right." into "Right."** when those are the teller's first words. The "Yeah, right" exception is written only on the later rule.
- **"So yeah, right." stays** in the code. 17a names only "Yeah, right" (T26).
- **The list-goes-on test leaves a stray comma after a verb:**
  - "We were, uh, poor and hungry." → "We were, poor and hungry."
  - "We had, um, 20 dollars." → "We had, 20 dollars."
- **(b) takes a quoting "like" after "was all", "was just" or "thought":**
  - "She was all, like, no." → "She was all no."
  - "She was just, like, get out." → "She was just get out."

  The exception is written for a form of be, go or say directly before the "like".

### Emil's review table

| Before | After | Why |
|---|---|---|
| `/\?["”’)]*$/` (isQuestion, TAG, takeaway) | `/\?["”’)']*$/` | "'Were you there?' Yeah, I was" is an answer |
| `…eleven\|twelve\|twenty…` | add thirteen–nineteen, several, once, twice, `an? <unit>` | "for, like, fifteen years" is a guess |
| `(max-width: 359.98px)` for the running head | about `(max-width: 479.98px)`, or measured | it clips at 360 and 375 |
| `.print-card.typed .frame { height: auto; overflow: visible }` | keep 3:4 and `overflow: hidden`; fit the words | the neighbour runs 31px off at 320; the cue spills |
| `.cue { white-space: nowrap }` on tall phone prints | wrap, or the first name only; words pushed below | "New from Bao Ngo…" is cut off and covers the words |

## Brand rulings applied (the brand wins over the skill)

- The kickers, foil stop, wax seal and print veil are book material by DESIGN.md. They are not counted under impeccable's eyebrow ban.
- f9b0's AI reply set as "We asked" is accepted.
- The kept line's joint before a comma, a pronoun or "the" is allowed by 17a.

## Clean on this pass

- **Motion:** the commit changes none. There is no `transition: all` and no ease-in. The ribbon keeps its reduced-motion rule. The running head's labels still cross on opacity and transform at 240ms.
- **Sizes and edges:** 320 had no horizontal scroll (`scrollWidth` 320 on Home and the Archive) and no text under 12px. The exceptions are the overflow in gap 1, which a parent clips, and gap 3.
- **The ribbon at 320:** every day is 46.7px or more wide and 81px tall, in a 280px track.
- **Typed words:** whole at 320 on Home (c21c 84/84px, beee 63/63) and on the Archive.

## Not verified

- **Pressing:** a real Share press, the privacy menu, and a print press. A print press would mark its "new" cue as seen, so I left them alone.
- **Sizes not run this round:** 2560 and 3840 zoomed, 768 and 414 on the Archive Prints view, and cold font loads.
- **Nhi's memory:** not opened.
- **The running head:** on memories other than f9b0, I saw only the top state at 320 with my 200px steps. f9b0 and beee reached the family section.

## Shared state

- **Archive view:** the stored view (`astory.archiveView`) was "list" when I opened my tab. I pressed Prints, then List, with the page's own buttons, and it reads "list" now.
- **Sign-in:** `astory-app-auth` is present and untouched. I did not sign out and wrote no data.
- **My writes:** all in my tab only:
  - the word-for-word toggle, pressed and pressed back on 5963, 342e, f6a7 and f9b0;
  - same-origin measuring frames, all removed;
  - `window.__r13`, deleted.
- **My tab:** tab-190's viewport was reset to desktop, and the tab is closed.
- **Scratchpad:** the mutation harness is in `scratchpad/mut13` and the probes are in `scratchpad/r13`. I removed the `node_modules` junction with `rmdir`, and the project's `node_modules` is intact.
