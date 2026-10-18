# Skills Steward: the Archive's tidy, round 16

**Verdict: GAPS.** Two polish gaps and no ugly ones.

What passes:
- **Tests and types.** `vitest run src/components/archive src/lib` passes: 9 files, 588 tests. `tsc --noEmit -p tsconfig.app.json` exits 0.
- **r15 gap 1 (a plural possessive closed a curly quotation) is closed.** "the boys’ room", "the Nguyens’ house" and "Rock ’n’ roll" inside ‘…’ keep their "Wow.".
- **r15 gap 2 (ten surviving mutants) is closed.** All ten now fail: T42, U20, U23, V2, V3, V5, V10, W2, X7 and X10.
- **17a as of 19759fb holds on its own strings.** An inch mark after a digit never counts, the carry needs a closing mark, and every unit, time and span on the list keeps its "like".
- **The layout spot-check is clean** (see below).

What does not pass (both polish):
1. **A stray straight " in one paragraph makes the next paragraph's opening " read as a closing mark,** so a reaction inside that quotation is cut.
2. **Three new mutants still pass the suite** (P9, P10 and P20). Each needs one input.

## How this was checked

- **Read:** 17a at 19759fb, and the whole diff of 972d81a (`transcript.ts` and its test). Against 972d81a, the working tree differs only in `book-account.css` and one other file, neither of them `transcript.ts`.
- **Strings:** I ran 972d81a's `transcript.ts` under Node 24.18 on about 30 new strings, aimed at the ’ rule, the inch mark, the carry, the new amounts and the new spacing in `applyCuts`.
- **Mutants:** 107, run against a copy of the real suite in `scratchpad/mut16`, using a junction to `node_modules` that I removed afterwards:
  - my full r15 set, rewritten where the code moved;
  - 19 new ones (P1–P18 and P20) on the ’ lookahead, the inch guard, the carry, the `closed` flag, the `applyCuts` spacing and the new amounts;
  - one control with the code unchanged.
- **Layout spot-check:** in my own tab (tab-216, mobile emulation), I loaded two pages in a same-origin frame:
  - Home at 360: `scrollWidth` 360; 6 prints, every row level (191/191, 208/208, 191/191); no words clamped; the rightmost print ends at 340.
  - 342e at 390: `scrollWidth` 390; 8 paragraphs render.

## The mutation harness: 107 run, 87 fail, 20 survive (3 counted)

- **Every new mutant fails except these:**
  - **Fail:** P1 (the r15 ’ rule), P2, P4 (inch guard dropped), P6 and P7 (carry always or never), P8, P11 and P12 (the `closed` flag), and P14–P18 (time, length, weight, container, and time-or-span amounts).
  - **Survive, counted (3):**
    - **P9:** a straight " closing never sets `closed`.
    - **P10:** a ’ closing never sets `closed`.

      With either one, a quotation in straight or curly single marks that runs across a paragraph break and closes in the next paragraph loses its carry, so a "Wow." inside the quotation is cut. The suite only tests the “…” form, so P8 fails and these two do not.
    - **P20:** "half" dropped after "a", so "We had, like, a half bowl of rice." would lose its "like".
  - **Survive, not counted:**
    - P3 (’ before a comma never closes) and P5 (an inch mark after any letter): both keep more.
    - P13 (`applyCuts` always leaves a space): the only effect is a space before a closing mark. No word changes.
- **Carried from r15:** all ten counted survivors now fail. These still survive and are not counted, as in r15:
  - U21 and U22;
  - V7, V8, V9 and V11 (each keeps more);
  - X1 and X2 (a comma stays);
  - Y3 (equivalent) and Y7 (keeps more);
  - Z3, Z4 and Z5 (17a forbids only a first-person opening word).
- **The control** survives, as it should.

## r15 and 17a, checked

| Item | Now |
|---|---|
| r15 gap 1: the curly ’ after a letter | **Closed.** `transcript.ts`:104 closes ’ after a letter only before punctuation or the end. These keep "Wow.": `‘Okay. The boys’ room was full. Wow. That’s amazing.’`, `‘We went to the Nguyens’ house. Wow…’` and `‘Rock ’n’ roll. Wow…’`. |
| r15 gap 2: ten mutants | **Closed.** All ten fail. |
| 17a: an inch mark after a digit | **Holds.** `["He was 5'6\" tall and thin.", "Wow. That's amazing. We loved it."]` → the reactions go, so the rule is not switched off. `"He was 6\" taller. Wow."` → "Wow." goes. `"I'm 5'6\". Wow."` inside a real quotation stays. |
| 17a: the carry needs a closing mark | **Holds.** `["Our TV was 32\" wide.", "He said, \"Wow. That's amazing.\" Then he left. Wow."]` cuts only the last "Wow.", which is outside the quotation. A “…” quotation carried across a break keeps its reactions. |
| 17a: any unit, times and spans | **Holds.** These keep their "like": "a half bowl", "all night", "the whole summer", "three o'clock", "midnight" and "a sack of rice". |
| The cut before a closing mark | **Holds.** "“We went, um,” and left." → "“We went,” and left."; "«Okay, um,» and left." → "«Okay,» and left." |

## Gaps

### Polish

1. **A stray straight " (not after a digit) in one paragraph makes the next paragraph's opening " read as a closing mark, and a reaction inside that quotation is cut.**
   - **Rules:**
     - 17a (e): "never inside quotation marks of any kind", and the carry exists so that "a stray inch mark never switches the rule" in either direction;
     - "when in doubt it keeps the words".
   - **Where:** `quotesAfter`, `transcript.ts`:107, toggles a straight " wherever it stands. The carry at :395 then takes the next paragraph's opening " as the "closing mark" it is waiting for.
   - **Evidence:**
     - `["He said \"hi and left.", "\"Okay. Wow. That's amazing.\" Then we left."]` → `"Okay. That's amazing." Then we left.` ("Wow." is cut inside the quotation.)
     - The same text in curly marks keeps it: `["He said “hi and left.", "“Okay. Wow. That's amazing.” Then we left."]`.
   - **Change:**
     - Let a straight " close only after a non-space: `/\S/.test(prev)`.
     - A " at the start of a paragraph, or after a space, and before a non-space, always opens. If one is already open, it stays open, which is the book's convention for a quotation reopened at a paragraph.
     - Only a closing-position " counts toward `closed`.
     - Mirror this in `breaksRule`, and add both strings to the keep list.

2. **Three counted mutants survive. Each needs one input.**

   | Mutant | Add |
   |---|---|
   | P9 | `["He said, \"We went.", "Wow. That's amazing. Then we left.\""]` keeps "Wow." in the second paragraph |
   | P10 | `["She said, ‘We went.", "Wow. That’s amazing. Then we left.’"]` keeps "Wow." in the second paragraph |
   | P20 | "We had, like, a half bowl of rice." kept |

## For the lead (not counted: each follows 17a's letter)

- **A plural possessive before punctuation still closes a curly quotation.** 17a lets ’ after a letter close "before punctuation":
  - `‘We cleaned the boys’, the girls’ rooms. Wow. That’s amazing.’` → "Wow." cut.
  - `‘It was the Nguyens’. Wow. That’s amazing.’` → "Wow." cut.
- **A middle paragraph with no closing mark is not carried.** In `["She said, “We went home.", "We ate. Wow. That's amazing.", "Then we slept.” Wow."]`, the second paragraph's "Wow." and "That's amazing." are cut, although the quotation runs through to the third paragraph. 17a carries only into a paragraph that holds a closing mark. Books reopen each paragraph with “, which this code handles.
- **"the whole way" and "all the way"** are not on the list of times and spans, so "We walked, like, the whole way." loses its "like". 17a's examples name only times.

## Not verified

- **Layout.** The tidy changed no layout. I spot-checked only Home at 360 and 342e at 390, and did not re-run the r15 sweep.
- **The live words** of the eight memories were not compared word for word.

## Shared state

- **Archive view.** `astory.archiveView` reads "list". I did not press Prints this round.
- **Sign-in.** `astory-app-auth` is present and untouched. I did not sign out and wrote no data.
- **My tab.** tab-216's frame is removed, its viewport is reset to desktop, and the tab is closed.
- **Scratchpad.** The mutants are in `scratchpad/mut16` and the probes in `scratchpad/sk14/p4.mts`. The `node_modules` junction is removed, and the project's `node_modules` is intact.
