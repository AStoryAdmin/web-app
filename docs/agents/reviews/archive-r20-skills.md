# Skills Steward: the Archive's tidy, round 20

**Verdict: GAPS. One polish gap: two checker-only mutants survive. The tidy itself has no gap left.**

- **The builder's claim holds.** All 21 counted r19 mutants fail in my own harness, against an exact copy of 862fac7.
- **Both r19 code gaps are closed:**
  - hyphenated numbers keep their hedge;
  - the curly inch mark after a digit is no longer a quotation mark.
- **I found no new over-cut** in about 15 new strings on this round's code.
- **What survives** are two mutants of the checker in the test file (H9 and M6). The contract would accept a cut before "billions" and a cut inside «…», and no test notices. The code itself makes neither cut. Each needs one forbidden-cut entry.

## How this was checked

- **Code:** the diff of 862fac7. `LIKE_HEDGES_NEXT`'s number group now allows a hyphen after it, and "billion"/"billions" are added. `quoteMarks` skips a ” after a digit, and the checker mirrors both.
- **Tests and types:** `vitest run src/components/archive src/lib` passes: 9 files, 654 tests. `tsc --noEmit -p tsconfig.app.json` exits 0. The working tree matches 862fac7.
- **Mutants:** 101, run against a copy of the real suite at 862fac7 in `scratchpad/mut20`, using a junction to `node_modules` that I removed afterwards:
  - my r19 set of 90, rewritten where this round moved the code;
  - 11 new: H1–H9 on the hyphen, billions and the curly inch mark, and M6b on the checker's »;
  - one control.

  The runner mutates the code or the test file's checker.
- **Strings:** I ran 862fac7's `transcript.ts` under Node 24.18 on the r19 gap strings and about 15 new ones.

## The r19 counted mutants, re-run

| Mutant | Result |
|---|---|
| Q2, Q7, Q15, Q19, Q20, Q22 | fail |
| A6, S3, S5, W5, W7, W8 | fail |
| L4 (rewritten for "billions"), L20 | fail |
| M4, M5, M11, M12, M14, M15, M17 | fail (the round-20 forbidden-cut test) |

All 21 fail. The three inputs the builder changed (Q2, Q20 and M14) now kill their mutants.

## The full harness: 101 run, 83 fail, 18 survive (2 counted)

**The new mutants:**
- **Fail:**
  - H1: the hyphen refused after a number again;
  - H2: billions dropped;
  - H4: the curly inch skip dropped;
  - H7: the checker decides on the whole word instead of the part before the hyphen;
  - H8: the checker's curly inch skip dropped.
- **Survive, counted:**
  - **H9:** the checker drops "billion" and "billions". The code test keeps "billions of ants", but the checker's forbidden-cut list has no entry before "billions", so a weaker checker passes.
  - **M6:** the checker drops « as a mark. The code test kills Q2, but no forbidden-cut entry is a «…» paragraph.
- **Survive, not counted:**
  - H3: the number lookahead dropped. It keeps more ("like, tender" matches "ten").
  - H5: the inch skip after any word character. It keeps more: a real ” after a letter stops closing.
  - H6: the inch skip extended to ». It keeps more.
  - M6b: the checker's » not a close. The checker becomes stricter.

**Carried, not counted** (as in r19):
- Q4, Q8, Q12, Q16, Q18, S8, S9, S10, W2 and W3 each keep more.
- W6 is equivalent.

**The control** survives, as it should.

## r19 gaps, checked

| r19 gap | Now |
|---|---|
| 1. A hyphenated number lost its hedge | **Closed.** "for, like, twenty-five years", "forty-five dollars", "twenty-first of May", "one-third of it" and "billions of ants" all keep their "like". "a-ok" still loses it: "a" before a hyphen is not "a". |
| 2. A curly inch mark after a digit closed a double quotation | **Closed.** `["She said, “He was 5’6” and thin.", "Wow. That's amazing.", "Then he left.”"]` keeps the middle paragraph. |
| 3. 21 counted mutants | **Closed.** All fail (see above). |

## Gap (polish)

1. **Two checker mutants survive.** Add two forbidden-cut entries to the round-20 checker test:
   - ", like," cut from "We had, like, billions of ants." must be rejected (H9);
   - "Wow." cut from `She said, «Okay. Wow.» Then left.` must be rejected (M6).

## For the lead (not counted)

- **A real closing ” after a digit is now skipped.** In "“I was 25” and left." and "“It was 1975”, she said.", the quotation stays open, and (e) is off for every later paragraph until a ” closes it. This keeps more, so it is safe, and 17a's wording ("an inch mark after a digit") allows it. A quotation that ends on a year is common in a life story, though. If the lead wants it closed, count a ” after a digit as an inch mark only when the paragraph has no open “.
- **The r19 note on 17a's wording for a possessive ’** still stands. The code treats "kids’ " as no mark, while 17a's letter would count it as one.

## Shared state

- **Browser.** None used. I wrote no data and did not touch `astory-app-auth`.
- **Scratchpad.** The mutants are in `scratchpad/mut20`, and the probes in `scratchpad/sk14/p10.mts`. The `node_modules` junction is removed, and the project's `node_modules` is intact. I did not touch the repo's working tree.
