# Skills Steward: the Archive's tidy, round 19 (with rounds 17 and 18 folded in)

**Verdict: GAPS.** One ugly gap and two polish gaps.

Rounds 17–19 fix the quotation logic in principle:
- (e) is now a closed test: no mark in the paragraph, and none left open;
- double and single marks are counted apart;
- marks are walked in order from the carried count, and every close clamps at zero;
- a possessive ’ is no longer a mark.

Every case in my r16, r17 and r18 reports that turned on how marks were counted now comes out right, except the curly inch mark. The suite, though, still does not hold most of what the cross-paragraph code does: 21 mutants that make a forbidden cut survive. And the hyphenated-number gap from round 17 is still open.

What passes:
- **Tests and types.** `vitest run src/components/archive src/lib` passes: 9 files, 629 tests. `tsc --noEmit -p tsconfig.app.json` exits 0. The working tree matches 7c5006a for these files.
- **These all keep their middle paragraph, or their "Wow.":**
  - `“…the boys’ house.` and `‘…the boys’ house.`, each across three paragraphs (the r18 lead item is now fixed);
  - `“We dug a 6’ well.`;
  - three-paragraph quotations in '…' and "…";
  - a four-paragraph “…” with two middle paragraphs;
  - `“It was ‘home’ to us.` and `‘It was “home” to us.`, each across paragraphs;
  - a stray ” or ’ before a later quotation: `["He said no.” Then left.", "She said, “We went.", "Wow.", "Then we left.”"]` and `["The kids’ toys…", "She said, ‘We went.", "Wow.", "Then we left.’"]`.
- **(b):** "never" stays, and every r17 list word stays.
- **The checker** mirrors the walk in order, the clamp and the possessive skip, line for line.

What does not pass:
1. **Ugly (since r17): a hyphenated number loses its hedge.** "for, like, twenty-five years" becomes "for twenty-five years". The same happens to "forty-five dollars", "thirty-two kids", "twenty-first of May" and "one-third". The checker shares the blind spot.
2. **Polish (since r17): a curly inch mark after a digit closes a double quotation.** The middle paragraph of `“He was 5’6” and thin. / Wow. That's amazing. / Then he left.”` is cut.
3. **Polish: 21 counted mutants survive,** across `quoteMarks`, `reactionsAllowed`, the (b) list and the checker. Eight inputs cover them all.

## Scope and method

- **Read:** 17a (e) as worded at 7c5006a, and the diffs of 3d16eea (r17), 7cbe288 (r18) and 7c5006a (r19).
- **Strings:** I ran each commit's `transcript.ts` under Node 24.18 on about 60 strings across the three rounds. Every example below was run on 7c5006a.
- **Mutants:** 91, run against a copy of the real suite at 7c5006a in `scratchpad/mut19`, using a junction to `node_modules` that I removed afterwards. The runner mutates the code or the test file's checker.
  - **Q1–Q23:** `quoteMarks`.
  - **A1–A9:** `reactionsAllowed`, and where `quoted` is used.
  - **S1–S11:** the double/single split.
  - **W1–W8:** the walk in order, the clamp and the possessive skip.
  - **L1–L23:** (b), `LIKE_HEDGES_NEXT`.
  - **M1–M17:** the checker's `marksIn`, `reactionsMayGo` and its b-like next-word list.
  - **One control,** with the code unchanged.

## The mutation harness: 91 run, 57 fail, 34 survive (21 counted)

**Counted: each lets a cut happen inside a quotation, or before a word on (b)'s list.**

| Mutants | What they break | Input that catches them |
|---|---|---|
| Q20 | “ counted as a close | `["She said, “We went.", "Wow.", "Then we left.”"]`: "Wow." kept. Today no test has a mark-free middle paragraph after a “. |
| Q15 | a straight ' opens only at the very start | `["He said, 'We went.", "Wow. That's amazing.", "Then we left.'"]`: middle paragraph kept |
| Q19 | a straight " only ever closes | the same with `"`: middle paragraph kept |
| A6, W5 | the double count restarts each paragraph | `["She said, “We went home.", "We ate.", "Wow. That's amazing.", "Then we left.”"]`: kept |
| S3 | the single count is never carried | `["She said, ‘We went.", "We ate.", "Wow.", "Then we left.’"]`: kept |
| S5, W7, W8 | a ’, " or ' close may take its count below zero | a stray close of each kind before a quotation of that kind, then a mark-free paragraph: `["He said no.’ Then left.", "She said, ‘We went.", "Wow.", "Then we left.’"]`, and the same with `"` and with `'` |
| Q22 | a ’ at a word's start counts as a close | `["She said, ‘We went. ’Twas cold.", "Wow.", "Then we left.’"]`: "Wow." kept |
| Q7 | ’ is not a mark at all | `He said no.’ Wow.` kept whole (its ’ is not after a letter before a space) |
| Q2 | « is not a mark | `She said, «Okay. Wow. That's amazing.» Then left.` kept whole |
| L4, L20 | hundreds… dropped; the list made case-sensitive | "We met, like, hundreds of people." and "We waited, like, Five hours.": both kept |
| M4, M5, M11, M14, M15, M17, M12 | the checker: ‘ or ’ not a mark; single ignored; ’ counted as double; no clamp; the clamp applied per paragraph; times of day dropped | forbidden-cut entries for the checker: "Wow." cut from `She said, ‘We went. Wow.`; from `He said no.’ Wow.`; after a paragraph that leaves ‘ open; after `“…boys’ house.`; after a stray ” and then an open “; and ", like," cut before "midnight". Each must be rejected. |

**Not counted (12):**
- **Keep more:**
  - Q4: » not a mark;
  - Q8: every ’ after a letter skipped;
  - Q12: inch guard after any word character;
  - Q16: a straight ' never closes;
  - Q18: a straight " only ever opens;
  - S8, S9: a straight ' counted on the double count;
  - S10: « counted as single;
  - W2, W3, W4: the possessive skip widened.
- **Equivalent:** W6. A paragraph with no mark has the same count before and after it.

**The control** survives, as it should.

## Rounds 17–19, item by item

| Item | Round raised | Now |
|---|---|---|
| A stray straight " flips a later quotation | r16 gap 1 | **Closed** by the r17 closed test |
| P9, P10 and P20 survive | r16 gap 2 | **Closed** (rewritten for the new code) |
| A hyphenated number loses its hedge | r17 gap 1 | **Open** (gap 1 below) |
| A curly inch or foot mark after a digit | r17 gap 2 | **Closed for the foot mark (6’), which is single since r18. Open for the inch mark ”** (gap 2) |
| 12 counted mutants | r17 gap 3 | **Partly.** Q6, Q9, Q23, A5, S1 and S6 now fail. The rest are in the table above. |
| A possessive ’ closes an open ‘ | r18 lead | **Closed** by the r19 skip |
| 20 counted mutants | r18 gap 3 | **Partly.** See the table above. |

## Gaps

### Ugly

1. **A hyphenated number loses its hedge, so a guess at an age, a sum or a count becomes a fact.**
   - **Rule:** 17a (b), "it stays before a number, a teen or an ordinal".
   - **Where:**
     - `LIKE_HEDGES_NEXT`, `transcript.ts`:68, ends in `(?![\p{L}'’-])`, so "twenty" followed by "-five" fails.
     - The checker's `nextWord` reads "twenty-five" as one word that is not on its list, so the contract accepts the cut.
   - **Evidence** (`cleanSpeech`, explain `b-like`):
     - "We were there for, like, twenty-five years." → "…for twenty-five years."
     - "We paid, like, forty-five dollars." → "We paid forty-five dollars."
     - "We sold, like, one-third of it." → "We sold one-third of it."
   - **Change:**
     - Decide on the part of the next word before a hyphen, in both the code and the checker.
     - Add "billion" and "billions".
     - Add the strings to the keep list and to the checker's forbidden cuts.

### Polish

2. **A curly inch mark after a digit closes a double quotation.**
   - **Rule:** 17a (e), "an inch mark after a digit [is] not [a] quotation mark". Smart punctuation writes 5'6" as 5’6”.
   - **Where:** `quoteMarks`, `transcript.ts`:101 (” and »). Only the straight " is skipped after a digit. The checker's `marksIn` does the same.
   - **Evidence:** `["She said, “He was 5’6” and thin.", "Wow. That's amazing.", "Then he left.”"]` → the middle paragraph is cut.
   - **Change:** skip ” (and ″) after a digit, in both places. Add the string.

3. **Twenty-one counted mutants survive.** The eight inputs in the table catch them all. Most of the cross-paragraph rules have only the three-paragraph “…” test, so the single-mark and straight-mark paths, the clamp and the four-paragraph carry can each be broken with the suite still green.

## For the lead (not counted)

- **The code and 17a's wording disagree about a possessive ’.**
  - 17a excludes from the marks only "an apostrophe inside a word", and says a ’ "never [closes] after a letter before a space". By that letter, the ’ in "kids’ " is still a quotation mark, so its paragraph should keep its reactions.
  - The code does not count it as a mark at all. "The kids’ toys were everywhere. Wow. That's amazing." loses both reactions, and so does "We went to the Nguyens’ house. Wow.".
  - The code's reading is the sensible one, since a possessive is not a quotation. I suggest changing 17a to say "a ’ after a letter before a space is an apostrophe, not a mark", rather than changing the code.
- **A real closing ’ after a word before a space is now ignored,** as in "She said, ‘We went home’ and smiled.". The ‘ then stays open, and (e) is off for the rest of the transcript. This keeps more, so it is safe. It is the reverse of the old "a stray mark switches the rule off" concern, for single quotation marks written with the closing mark inside the sentence.

## Not verified

- **Layout and live words.** Rounds 17–19 changed only the tidy.

## Shared state

- **Browser.** None used. I wrote no data and did not touch `astory-app-auth`.
- **Scratchpad.** The mutants are in `scratchpad/mut17`, `mut18` and `mut19`, and the probes in `scratchpad/sk14/p5`–`p9.mts`. Every `node_modules` junction is removed, and the project's `node_modules` is intact. I did not touch the repo's working tree.
