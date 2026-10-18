# Skills Steward: the Archive's tidy, round 22

**Verdict: APPLIED (no gaps).**

## What I ran

- **Code:** at 9359858 the tidy code is byte-identical to 862fac7 (rounds 20 and 21). The test file adds the two M6 entries exactly as I wrote them in round 21.
- **Tests and types:** `vitest run src/components/archive src/lib` passes: 9 files, 654 tests. `tsc --noEmit -p tsconfig.app.json` exits 0.
- **Mutants:** the full round-20 set of 101, run against an exact copy of 9359858's suite in `scratchpad/mut20`, using a junction to `node_modules` that I removed afterwards. That is more than the three asked for.

| Mutant | Result |
|---|---|
| M6: the checker drops « as a mark | **fails** |
| H9: the checker drops "billion" and "billions" | **fails** |
| Control | survives (the suite is green) |
| **All 101** | **85 fail, 16 survive** |

- **The 15 survivors besides the control** are the ones I already classed as not counted. None of them allows a cut the list forbids.
  - **They keep more:**
    - Q4, Q8, Q12, Q16 and Q18;
    - S8, S9 and S10;
    - W2 and W3;
    - H3, H5 and H6.
  - **They make the checker stricter:** M6b.
  - **Equivalent:** W6.

## Closing note

- Every gap I raised from round 13 to round 21 is closed, or was settled by a lead ruling and written into 17a.
- Every mutant that would allow a forbidden cut now fails.
- Bao's Standard passed round 21 on this same code.

## Shared state

- **Browser.** None used. I wrote no data and did not touch `astory-app-auth`.
- **Repo.** I did not touch the working tree.
- **Scratchpad.** The `node_modules` junction is removed, and the project's `node_modules` is intact.
