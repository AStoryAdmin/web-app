# Skills Steward: the Archive's tidy, round 18

**Verdict: GAPS.** One ugly gap and two polish gaps. This round fixes the problem it set out to fix. My two round-17 gaps (r17 gaps 1 and 2) are still open, and the separate counting of single marks has no tests yet.

What this round fixes:
- **Double and single marks are now counted apart,** in `quoteMarks` and `reactionsAllowed` and in the checker's `marksIn` and `reactionsMayGo`. A plural possessive no longer closes an open double quotation for the next paragraph.
  - `["She said, “We went to the boys’ house.", "Wow. That's amazing.", "Then we left.”"]` keeps the middle paragraph.
  - `“It was ‘home’ to us.` and `‘It was “home” to us.`, each across three paragraphs, keep the middle paragraph.
- **"never" is on (b)'s list.** "We had, like, never seen it." stays whole.
- **A foot mark (6’) can no longer close a double quotation.** `["She said, “We dug a 6’ well.", "Wow. That's amazing.", "Then we left.”"]` keeps the middle paragraph.
- **The suite passes on 7cbe288.** My control run of the real suite against an exact copy of the commit is green.

What does not pass:
1. **Ugly (r17 gap 1, still open): a hyphenated number loses its hedge.** "for, like, twenty-five years" becomes "for twenty-five years".
2. **Polish (r17 gap 2, open for the inch mark): a curly inch mark after a digit (”) still closes a double quotation.** The middle paragraph of `“He was 5’6” and thin. / Wow. … / …”` is cut.
3. **Polish: 20 mutants that would allow a forbidden cut still survive.** That is 5 more than round 17 had. Each needs one input, and seven inputs cover them all.

## Scope and method

- **What I reviewed.** Commit 7cbe288, read with `git show HEAD:…` into `scratchpad/mut18`.
- **Uncommitted edits (not reviewed).** The working tree again holds uncommitted edits to `transcript.ts` and its test from someone else: `quoteMarks` now takes a `from`, and two tests fail there. I did not review them.
- **Strings:** I ran 7cbe288's `transcript.ts` under Node 24.18 on 12 new cross-paragraph cases, plus the r17 gap strings.
- **Mutants:** 81, run against a copy of the real suite, using a junction to `node_modules` that I removed afterwards:
  - my r17 set, rewritten for the new counting;
  - S1–S11, new, on the split: the allowed test, each count's carry and floor, which kind each mark counts as, and "never";
  - M13–M15, new, on the checker's split;
  - one control with the code unchanged.

  The runner mutates the code or the test file's checker.

## The mutation harness: 81 run, 53 fail, 27 survive (20 counted)

**The new mutants:**
- **Fail:** S2 (allowed ignores double), S4 (double never carried), S7 (’ closing a double again), S11 ("never" dropped) and M13 (the checker ignores double).
- **Survive, counted:**
  - S1, S3, S5 and S6: single ignored, never carried, allowed below zero, or reset each paragraph;
  - M11, M14 and M15: the checker ignores single, merges the counts again, or has no floor.

  No test runs a single quotation across three or more paragraphs, and no test has a stray ’ before one. So the single-mark side of the split can be broken in any of these ways and the suite stays green.
- **Survive, not counted** (each keeps more):
  - S8: a straight ' counted as a double open;
  - S9: a straight ' close counted on the double count;
  - S10: « counted as single.

**From round 17:**
- **Still survive, counted:** Q2, Q6, Q9, Q15, Q19, Q23, A5, A6, L4, L20, M4 and M12.
- **Q22 now survives too, counted.** A ’ at the start of a word counted as a close can cancel an open ‘.
- **Still survive, not counted:** Q4, Q12, Q16 and Q18.
- **Fail:** everything else, including M2, M3, M5 and M6, which I rewrote for the new `marksIn`.

**The control** survives, as it should.

## Gaps

### Ugly

1. **A hyphenated number loses its hedge (r17 gap 1, unchanged).**
   - **Rule:** 17a (b), "it stays before a number, a teen or an ordinal".
   - **Where:** `LIKE_HEDGES_NEXT`, `transcript.ts`:68, ends in `(?![\p{L}'’-])`. The checker's `nextWord` at `transcript.test.ts`:919 reads "twenty-five" as one word that is not on its list.
   - **Evidence:**
     - "We were there for, like, twenty-five years." → "We were there for twenty-five years."
     - The same for "forty-five dollars", "thirty-two kids", "twenty-first of May" and "one-third".
   - **Change** (as in r17):
     - Test only the part of the next word before a hyphen, in both the code and the checker.
     - Add "billion" and "billions".
     - Add the five strings.

### Polish

2. **A curly inch mark after a digit closes a double quotation (r17 gap 2: fixed for the foot mark, open for the inch mark).**
   - **Rule:** 17a (e), "an inch mark after a digit [is] not [a] quotation mark".
   - **Where:** `quoteMarks`, `transcript.ts`:99. ” and » subtract from the double count with no digit check. The checker's `marksIn` (:834) does the same.
   - **Evidence:** `["She said, “He was 5’6” and thin.", "Wow. That's amazing.", "Then he left.”"]` → the middle paragraph is cut.
   - **Change:** skip ” (and ″) after a digit, as the straight " already is, in both places. Add the string.

3. **Twenty counted mutants survive. Seven inputs cover them all.**

   | Input | Catches |
   |---|---|
   | `["She said, ‘We went.", "Wow. That’s amazing.", "Then we left.’"]`: middle paragraph kept | Q6, Q9, Q23, S1, S3 |
   | `["He said, 'We went.", "Wow. That's amazing.", "Then we left.'"]` and the same with `"`: middle paragraph kept | Q15, Q19 |
   | `["She said, “We went home.", "We ate.", "Wow. That's amazing.", "Then we left.”"]` and the same in ‘…’: kept | A6, S6 |
   | `["He said no.” Then left.", "She said, “We went.", "Wow.", "Then we left.”"]` and `["The kids’ toys were everywhere.", "She said, ‘We went.", "Wow.", "Then we left.’"]`: "Wow." kept | A5, S5 |
   | `["She said, ‘We went. ’Twas cold.", "Wow.", "Then we left.’"]`: kept | Q22 |
   | `She said, «Okay. Wow. That's amazing.» Then left.`; "We met, like, hundreds of people."; "We waited, like, Five hours.": all kept | Q2, L4, L20 |
   | Checker forbidden-cut entries: "Wow." cut from a paragraph whose only mark is ‘; "Wow." cut after a paragraph that leaves ‘ open; "Wow." cut after `“We went to the boys’ house.`; "Wow." cut after a stray ” and an open “; ", like," cut before "midnight". | M4, M11, M14, M15, M12 |

## For the lead (not counted: each follows 17a's letter)

- **A plural possessive still closes an open single quotation.** 17a excludes only an apostrophe inside a word, so the ’ in "boys’ " is a mark, and here it closes. Example: `["She said, ‘We went to the boys’ house.", "Wow. That’s amazing.", "Then we left.’"]` → the middle paragraph is cut. Splitting the counts fixed this for double quotations, which are the common case. In ‘…’ it remains.

## Not verified

- **The working tree's uncommitted edits** (`quoteMarks(text, from)`, two failing tests) were not reviewed.
- **No layout and no live words.** This round changed only the tidy.

## Shared state

- **Browser.** None used. I wrote no data and did not touch `astory-app-auth`.
- **Scratchpad.** The mutants and runner are in `scratchpad/mut18`, and the probes in `scratchpad/sk14/p7.mts`. The `node_modules` junction is removed, and the project's `node_modules` is intact. I did not touch the repo's working tree.
