# Signed-out pages, round 11: skills review

**Verdict: APPLIED.** No gaps: 0 blockers, 0 ugly, 0 polish.

All three round 10 gaps are fixed, measured by the same probes. The code field now does what its slots show. Pasted text with no digits changes nothing. The codes are set in lining figures. With rounds 1–10 closed, the signed-out pages are done on the skills side.

**Scope.** Commit 3bc46e0:
- `PlateCode.tsx`: `onSelect` pins the caret to the end, but lets a whole selection through; a paste with no digits returns early.
- `signed-out.css`: `font-variant-numeric: lining-nums tabular-nums` on `.plate-code .slot` and on Join's `.codeseal`.

## Round 10, gap by gap

| # | Round 10 gap | Now |
| --- | --- | --- |
| 1 | The hidden caret moves, so a tap or an arrow key edits mid-code | **Fixed.** The caret stays at the end after a tap, a click and arrow keys. Backspace takes the last digit, and a typed digit lands at the end. |
| 2 | A paste with no digits erases the code | **Fixed.** Pasting "see email" leaves `1295` as it was. |
| 3 | Old-style figures in the code | **Fixed.** The slots compute `lining-nums tabular-nums`. 1, 3, 4, 7 and 9 sit on one baseline at one height. |

**Gap 1, measured.** The value started as `124` at 390 (touch, DPR 3) and at 1920 (mouse).

| Step | Round 10 (390) | Round 11 (390 and 1920) |
| --- | --- | --- |
| Tap or click on slot 1 | caret 2 | caret 3 (the end) |
| Backspace | `14` (the middle digit deleted) | `12` |
| Type 9 | `194` | `129` |
| End, ←, ←, then type 5 | `1529` (1920) | caret stays at 3, so `1295` |

The marked "next" slot matches the caret in every step.

**The whole-selection exception holds** (the harness, with six digits):
- select-all then Backspace clears the field;
- Backspace when full deletes the sixth digit;
- a seventh digit is ignored;
- "Your code: 123-456-78" pastes as `123456`;
- an OS one-time-code fill shows all six.

**Gap 2, measured.** Pasting "see email" over `1295` left `1295` at both 1920 and 390. "12 34" still pastes as `1234`.

**Gap 3, measured.** The slots now compute `font-variant-numeric: lining-nums tabular-nums` (`shots/signed-out-r11-skills-1920-code-figures.png`: 1 3 4 7 9, level, each centred in its slot). Join's seal "K7M 2QX" is set in lining figures at 1920 and 320 (`-1920-codeseal.png`), with no horizontal scroll at 320.

## Unchanged, re-checked

- **The field's name and error:** `textbox "6-digit code" [invalid]`, with `aria-describedby="plate-say"` on error. The line has `role="alert"`, and the slots turn `--danger`.
- **The basics:** the focus ring appears instantly and the field is focused on arrival. It has `inputMode="numeric"`, `autocomplete="one-time-code"`, and 16 px input text.
- **Network:** 0 requests attempted. On Verify I typed at most five digits; every six-digit case ran in the harness.

## Notes for the lead (not counted)

- **`.codeseal`'s rule names its figures twice.** It now starts with `font-variant-numeric: lining-nums tabular-nums;`, but it still ends with the older `font-variant-numeric: lining-nums;` (`signed-out.css:365`), which wins, so the seal computes `lining-nums` only. That is harmless: lining is what matters for one letter-spaced code. Dropping the older declaration would tidy it.

**How it was checked.**
- **Setup:** headless Playwright (`09142026/node_modules/playwright`) against `http://localhost:5180` at 3bc46e0. Every context was new, with no session.
- **Network:** every non-GET request to Supabase was aborted, and nothing was submitted.
- **Probes:** round 10's field probe on Verify (`plate.mjs`), the six-digit harness (`harness.mjs`), the figures check (`nums.mjs`) and a seal check at 1920 and 320.

### Scores (taste-skill critique; hallmark self-critique)

```
ROUND 11
Seen in one second: the family book open on the cloth; the code as six level figures in six slots.
Idea: the sign-in is the title page of the family's own book. It passes the competitor test.
Scores: design 8.5 · usability 9 · creativity 9 · content 8 → overall 8.7
Caps applied: none.
Top three: none open.
Hallmark reading: P5 H4 E5 S5 R4 V4. Every gap from rounds 1–10 is closed and measured.
```
