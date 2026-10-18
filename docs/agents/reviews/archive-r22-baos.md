# Archive tidy, round 22 (Bao's Standard)

**PASS.** This supersedes round 21.

Round 22 (9359858) adds seven lines to `transcript.test.ts`: the M6 checker inputs whose only quotation mark is «. No app code has changed since round 20's PASS (862fac7). `git diff 862fac7 HEAD -- src` touches only the test file, and the working tree matches HEAD for the archive files.

## Checked

- **Tests.** `vitest run src/components/archive src/lib` passes: 9 files, 654 tests. The new inputs sit inside existing tables, so the count is unchanged.
- **Types.** `tsc --noEmit -p tsconfig.app.json` exits 0.
- **Live memories.** In my own tab (tab-227), I loaded the account read-only with `loadAccount`. All eight memories in Bao's story went through MemoryPage's path (`paragraphsOf`, then `wasSpoken`/`soundsSpoken`, then `explainTranscript`).
  - Every cut is on 17a's list, and the cuts are the same as in rounds 20 and 21:
    - 342e: "Wait, were you?" and "Yeah." (e).
    - f6a7: the opening "Yeah, ", the later "Yeah, " and "So yeah, " (a), and "That's awesome." (e).
    - 5963: the later "Yeah, " (a), and "Yeah, right?" and "Wow, that's amazing." (e).
    - The other five: nothing is cut.
  - On all eight, the said text less the cuts equals the shown text.
  - The rendered `.mv-para` text equals `cleanTranscript` on the three memories that have cuts (342e, f6a7 and 5963), at 1366×768.

Round 20's string checks against 17a still apply in full, since `transcript.ts` is unchanged. So do its two lead notes: the curly foot mark between digits, and the possessive ’ before punctuation inside an open single quote.

## Shared state

- **Archive view.** The stored view (`astory.archiveView`) is "list", as found. I pressed nothing.
- **Sign-in.** `astory-app-auth` is present and untouched. I did not sign out and wrote no data.
- **My tab.** My frames are removed and tab-227 is closed. I set no viewport.
- **Nhi's memory** was not opened.
