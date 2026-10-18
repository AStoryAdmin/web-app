# Archive tidy, round 21 (Bao's Standard)

**PASS.**

Round 21 (aaf7b34) adds four lines to `transcript.test.ts`: the checker's forbidden cuts now cover billions and guillemets (H9, M6). No app code changed since round 20's PASS (862fac7): `git diff 862fac7 HEAD -- src` touches only the test file. The working tree matches HEAD for the archive files.

## Checked

- **Tests.** `vitest run src/components/archive src/lib` passes: 9 files, 654 tests. The new cases sit inside existing test tables, so the count is unchanged.
- **Types.** `tsc --noEmit -p tsconfig.app.json` exits 0.
- **Live memories.** In my own tab (tab-226), I loaded the account read-only with `loadAccount`. Each of Bao's eight memories went through MemoryPage's path (`paragraphsOf`, then `wasSpoken`/`soundsSpoken`, then `explainTranscript`).
  - Every cut is on 17a's list. The cuts are the same as in round 20:
    - 342e: "Wait, were you?" and "Yeah." (e).
    - f6a7: the opening "Yeah, ", the later "Yeah, " and "So yeah, " (a), and "That's awesome." (e).
    - 5963: the later "Yeah, " (a), and "Yeah, right?" and "Wow, that's amazing." (e).
    - 0ced, c21c, 4592 and f9b0: nothing is cut.
    - beee: typed, so it is not tidied.
  - On every piece, the said text less the cuts equals the shown text.
  - The rendered `.mv-para` text equals `cleanTranscript` on all eight memory pages at 1366×768.
  - The takeaways are unchanged.

Round 20's string checks against 17a still apply in full, since `transcript.ts` is unchanged. So do its two lead notes: the curly foot mark between digits, and the possessive ’ before punctuation inside an open single quote.

## Shared state

- **Archive view.** The stored view (`astory.archiveView`) was "list" at the start and is "list" now. I pressed nothing.
- **Sign-in.** `astory-app-auth` is present and untouched. I did not sign out and wrote no data.
- **My tab.** My frames are removed and tab-226 is closed. I set no viewport.
- **Nhi's memory** was not opened.
