# Skills Steward: the Archive's tidy, round 21

**Verdict: GAPS (one line).** H9 is now killed. M6 still survives, and that is my error: the M6 input I named in round 20 cannot kill M6. With the corrected input below, M6 fails and the suite stays green.

## What I ran

- **Code:** at aaf7b34 the tidy code is byte-identical to 862fac7. Only the test file changed: two forbidden-cut entries were added.
- **Mutants:** H9, M6 and the control, run against an exact copy of aaf7b34's suite in `scratchpad/mut20`, using a junction to `node_modules` that I removed afterwards.

| Mutant | Result |
|---|---|
| H9: the checker drops "billion" and "billions" | **Fails.** The new entry (", like," cut before "billions") is rejected. |
| M6: the checker drops « as an opening mark | **Survives** |
| Control | survives, so the suite is green |

## Why M6 survives, and the fix

- **The mutant drops only «.** M6 removes « from the checker's opening marks, but » stays a closing mark.
- **The entry I named in round 20 is still caught.** That entry, `She said, «Okay. Wow.» Then left.`, still holds a mark (the ») under the mutant. So the checker still rejects the cut, and the mutant goes unnoticed. The entry should have been one whose only mark is the «.
- **The fix.** Add these two entries next to the round-21 ones in the round-20 checker test. The third element is the list of earlier paragraphs.

  ```ts
  ["Wow.", at("Wow.", "Wow.", "e-reaction"), ["She said, «We went."]],
  ["She said, «We went. Wow.", at("She said, «We went. Wow.", "Wow.", "e-reaction"), []],
  ```

- **Checked in my scratch copy:** with both entries added, M6 fails and the control still survives. I put the copy back to aaf7b34 afterwards.

## Lead rulings, noted

- **A ” after a digit stays an inch mark.** This keeps more. Accepted, and no longer flagged.
- **The possessive ’ is now in 17a (2786e4b):** "a ’ after a letter before a space ("the kids’ toys")" is not a quotation mark. The code and 17a now agree, so the r19/r20 lead note is closed.

## Standing state

- Every other mutant from round 20 is unchanged, because the code is the same.
- Bao's Standard passed round 20 on this code.
- With the one test line above, the Archive tidy has no counted mutant left.

## Shared state

- **Browser.** None used. I wrote no data and did not touch `astory-app-auth`.
- **Repo.** I did not touch the working tree.
- **Scratchpad.** The `node_modules` junction is removed, and the project's `node_modules` is intact.
