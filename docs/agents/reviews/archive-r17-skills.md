# Skills Steward: the Archive's tidy, round 17

**Verdict: GAPS.** One ugly gap and two polish gaps.

**What passes:**
- **Tests and types.** `vitest run src/components/archive src/lib` passes: 9 files, 624 tests. `tsc --noEmit -p tsconfig.app.json` exits 0.
- **The new (e) works as 17a now words it.** A paragraph with any quotation mark keeps every reaction, and so does every paragraph after one that leaves a mark open, until a paragraph closes it. My r16 cases now come out right:
  - the stray straight " in one paragraph followed by a quotation in the next;
  - the possessive before a comma or a full stop;
  - a middle paragraph with no closing mark.
- **The new (b) list holds on its own words.** These all keep "like": "every year", "in Hue", "a lot", "maybe ten", "1,000 dollars", "midnight", "a half bowl" and "the whole way".
- **A test that is now simple** removes a whole class of edge cases. The mutation run backs this: 52 of 68 fresh mutants fail.

**What does not pass:**
1. **Ugly: a hyphenated number loses its hedge.** "for, like, twenty-five years" → "for twenty-five years". The checker shares the blind spot.
2. **Polish: a curly inch or foot mark after a digit (5’6”, a 6’ well) counts as a closing mark,** so a quotation open from an earlier paragraph is treated as closed, and a reaction inside it is cut. 17a says an inch mark after a digit is not a quotation mark.
3. **Polish: 12 of the fresh mutants survive** (9 in the code, 2 in the checker, and Q23). Each needs one input.

## Scope and method

- **What I reviewed.** Commit 3d16eea. I compared my copies of `transcript.ts` with `git show 3d16eea`, and they match.
- **Uncommitted edits (not reviewed).** While I worked, someone else left edits in the working tree to `transcript.ts` and its test:
  - `quoteMarks` now counts double and single marks apart;
  - "never" is added to the hedge list.

  I did not review them. They change neither gap 1 nor gap 2: the regex's lookahead still refuses a hyphen, and a ” after a digit still counts as a closing mark.
- **Strings:** I ran 3d16eea's `transcript.ts` under Node 24.18 on about 35 new strings against `quoteMarks`, `reactionsAllowed` and `LIKE_HEDGES_NEXT`.
- **Mutants:** 68 fresh ones, run against a copy of the real suite in `scratchpad/mut17`, using a junction to `node_modules` that I removed afterwards. The runner can mutate the code or the test file's checker:
  - Q1–Q23: `quoteMarks`;
  - A1–A9: `reactionsAllowed` and where `quoted` is used;
  - L1–L23: `LIKE_HEDGES_NEXT` and the like rules;
  - M1–M12: the checker's mirrors (`marksIn`, `reactionsMayGo`, the b-like next-word list);
  - one control with the code unchanged.

  A checker mutant that survives means the contract would accept that forbidden cut and no test would notice.
- **Layout:** none. This round changed only the tidy.

## The mutation harness: 68 run, 52 fail, 16 survive (12 counted)

**Every one of these fails:**
- **`quoteMarks`:** Q1, Q3, Q5, Q7, Q8, Q10, Q11, Q13, Q14, Q17, Q20, Q21 and Q22.
- **`reactionsAllowed`:** A1–A4 and A7–A9.
- **`LIKE_HEDGES_NEXT`:** L1–L3, L5–L19 and L21–L23.
- **The checker:** M1–M3 and M5–M11.

**Survivors that allow a forbidden cut (counted, 12):**

| Mutant | What it does | Input that would catch it |
|---|---|---|
| Q2 | « is not a mark | `She said, «Okay. Wow. That's amazing.» Then left.` kept whole |
| Q6, Q9, Q23 | ‘ is not a mark, or is read as an apostrophe before a letter, or never opens | `["She said, ‘We went.", "Wow. That’s amazing.", "Then we left.’"]`: the middle paragraph is kept |
| Q15 | a straight ' opens only at the very start | `["He said, 'We went.", "Wow. That's amazing.", "Then we left.'"]`: the middle paragraph is kept |
| Q19 | a straight " only ever closes | `["He said, \"We went.", "Wow. That's amazing.", "Then we left.\""]`: the middle paragraph is kept. The suite's two-paragraph form cannot catch it, because there the second paragraph holds the closing mark. |
| A5 | the open count may go below zero | `["He said no.” Then left.", "She said, “We went.", "Wow.", "Then we left.”"]`: "Wow." is kept |
| A6 | the open count is reset each paragraph | `["She said, “We went home.", "We ate.", "Wow. That's amazing.", "Then we left.”"]`: kept (two middle paragraphs) |
| L4 | hundreds, thousands, millions and dozens dropped | "We met, like, hundreds of people." kept |
| L20 | case-sensitive | "We waited, like, Five hours." kept |
| M4 | the checker counts no ‘ | a forbidden-cut entry: "Wow." cut from `She said, ‘We went. Wow.` must be rejected |
| M12 | the checker drops the times of day | a forbidden-cut entry: ", like," cut from "We left, like, midnight." must be rejected |

**Survivors that only keep more (not counted, 4):**
- Q4: » not a mark;
- Q12: an inch guard after any word character;
- Q16: a straight ' never closes;
- Q18: a straight " only ever opens.

**The control** survives, as it should.

## Gaps

### Ugly

1. **A hyphenated number loses its hedge, so a guess at an age, a sum or a count becomes a fact.**
   - **Rule:** 17a (b), "it stays before a number, a teen or an ordinal".
   - **Where:**
     - `LIKE_HEDGES_NEXT`, `transcript.ts`:68. It ends in `(?![\p{L}'’-])`, so "twenty" followed by "-five" fails, and nothing else in the list matches.
     - The checker's `nextWord` (`transcript.test.ts`:919) reads "twenty-five" as one word that is not on its list, so the contract accepts the cut.
   - **Evidence** (`cleanSpeech`, explain `b-like ", like,"`):
     - "We were there for, like, twenty-five years." → "We were there for twenty-five years."
     - "We paid, like, forty-five dollars." → "We paid forty-five dollars."
     - "We had, like, thirty-two kids." → "We had thirty-two kids."
     - "We left, like, twenty-first of May." → "We left twenty-first of May."
     - "We sold, like, one-third of it." → "We sold one-third of it."

     "I was, like, twenty-one." stays only because "was" comes first.
   - **Change:**
     - Let a number word take a hyphenated tail: `(?:twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|one|two|…)(?:-[\p{L}]+)?` before the lookahead. Simpler still: test only the part before a hyphen, `after.match(/^\s*([^\s-]+)/)`.
     - Add "billion" and "billions", which are numbers too.
     - Make the checker split `nextWord` at a hyphen in the same way.
     - Add the five strings to the keep list and to the checker's forbidden cuts.

### Polish

2. **A curly inch or foot mark after a digit counts as a closing mark and cancels an open quotation from an earlier paragraph.**
   - **Rule:** 17a (e): "an apostrophe inside a word and an inch mark after a digit are not quotation marks". Smart punctuation turns 5'6" into 5’6”, so the curly form is the common one in typed and dictated text.
   - **Where:**
     - `quoteMarks`, `transcript.ts`:99 (” and ») and :102 (‘ and ’). Only the straight " is skipped after a digit.
     - The checker's `marksIn` does the same.
   - **Evidence:**
     - `["She said, “He was 5’6” and thin.", "Wow. That's amazing.", "Then he left.”"]` → the middle paragraph is cut. The ’ and the ” after the digits count as two closes, so the open “ is treated as closed.
     - `["She said, “We dug a 6’ well.", "Wow. That's amazing.", "Then we left.”"]` → the middle paragraph is cut.

     Inside a single paragraph the mark still keeps every reaction, which is safe.
   - **Change:**
     - Skip ’ and ” (and ′ ″) when the character before them is a digit, in `quoteMarks` and in `marksIn`.
     - Add both strings to the keep list.

3. **Twelve counted mutants survive.** Each needs the one input in the table above.
   - **Rules:** the brief, "every mutant fails"; 17a, "the tests check every cut against its rule".
   - **What is missing, in short:**
     - three-paragraph quotations in ‘…’, '…' and "…", where the middle paragraph holds no mark;
     - a stray closing mark before a quotation opens;
     - a quotation that runs through two middle paragraphs;
     - « » on its own;
     - "hundreds" and a capitalised list word;
     - two forbidden-cut entries for the checker.

## For the lead (not counted)

- **The opening ’ is handled differently in the code and the checker.** A ’ after a space ("’twas", or a ’ used as an opening mark) marks the paragraph in both. The code counts it as neither opening nor closing, while the checker counts it as opening. A paragraph that only opens with ’ therefore carries in the checker but not in the code. Because 17a does not say which is right, I have not counted it.
- **"ages" and "forever-ish" are not on the closed list,** so "We waited, like, ages." loses its "like". This is what 17a's list says.

## Not verified

- **The working tree's uncommitted edits** to `transcript.ts` and its test (double and single marks counted apart, "never" added) were not reviewed.
- **No layout, and no live words.** This round changed only the tidy.

## Shared state

- **Browser.** None used this round. I wrote no data and did not touch `astory-app-auth`.
- **Scratchpad.**
  - The mutants and runner are in `scratchpad/mut17`, and the probes in `scratchpad/sk14/p5.mts` and `p6.mts`.
  - The `node_modules` junction is removed, and the project's `node_modules` is intact.
  - I did not touch the repo's working tree.
