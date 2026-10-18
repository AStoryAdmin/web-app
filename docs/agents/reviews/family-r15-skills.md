# Skills Steward: Family and Person, round 15

**Verdict: GAPS (0 blocker, 1 ugly, 2 polish).**

R14-1 is fixed. R14-2 is fixed for the second and later visits in a session, but not for the first one. The session cache also brought in a new bug that shows a wrong fact on screen:
- **R14-1, fixed:** owner phrases are now bound with no-break spaces. At 320 and 390, with one to six owners, every wrapped line starts with "and". The one-owner label is unchanged.
- **R14-2, fixed from the second visit on:** Home → Family pill and person page → Family pill draw once at the fresh-load size, with no refit, at 1366, 1920 and 800.
- **R15-1 (polish), R14-2 still open on the first visit:** the first Family visit of a session (fresh Home, then the Family pill) still draws without the state lines and refits about 0.4s later, at all three widths. `last` is only filled when Family or a person page fetches, and Home doesn't. This is the founder's usual way in.
- **R15-2 (ugly), new in 242612c:** an in-app visit now shows cached codes before `now` is set, so a code's days are counted from 1970. Ty's page reads "Invited with a code, 20773 days left" for about 0.35s, in view, on every in-app visit. If the refetch fails, that wording stays.
- **R15-3 (polish):** a code made on the person page doesn't reach `last`, so the cache is stale on the next visit. I checked this by reading the code only.

This isn't the passing round. R15-2 needs a three-line fix in `useMyCodes.ts`. R15-1 and R15-3 need one call each.

**Scope:**
- **242612c:**
  - `FamilyTree.tsx:569`: `.tp-also` renders `tier.also.split(/ (?=and )/).map((x) => x.replace(/ /g, "\u00a0")).join(" ")`. The NBSP is a literal character in the source; I checked with `od -c`.
  - `useMyCodes.ts:11–26`: a module-level `last`, `clearCodesCache()`, a `setCodes` wrapper that writes `last` in the updater, and `setCodes` in the effect's dependencies (46).
  - `AuthProvider.tsx:42` and `:75`: `clearCodesCache()` in the `!session` branch of `onAuthStateChange` and in `signOut`, next to `clearPhotoCache()`.
- **Read alongside them:**
  - `Family.tsx` 51–118 (MyCodes), 139, 189–192 (`afterWrite`) and 248.
  - `Person.tsx` 78, 165–168, 207, 211–254 (`sendCode`) and 338–399.
  - `familyWrites.ts` 125–160 (`familyCodeFor`, `listMyCodes`) and 284–300 (`inviteManager`).
  - `familyView.ts:225` (`expiresLabel`).
  - `Keepers.tsx` 45–56.
  - `AccountProvider.tsx` 38–51.

**Skills loaded:**
- taste-skill: SKILL (house rules), and type §8, "Mistakes the inspector cannot see".
- hallmark: slop-test gates 33, 34 and 49–51, plus responsive, and interaction-and-states (loading and empty).
- emil-design-eng: the frequency table and the review checklist.
- impeccable: craft-floor (Verify: Type, States), typeset (Stress), optimize (CLS) and harden (stale data, network failure, date/time).
- gsap-react, gsap-performance, gsap-scrolltrigger and gsap-timeline. None of them is touched by this commit.

I also read BAOS-STANDARD.md (rule 29) and DESIGN.md. No other installed skill applies.

**How it was checked:**
- **Tests:**
  - vitest on `components/family` and `components/person` passes: 5 files, 47 of 47 tests.
  - `tsc --noEmit` prints nothing.
  - eslint on the three changed files prints nothing.
- **Live, in my own tab (tab-171):**
  - **Logging:** a MutationObserver logged `data-size`, plate height, the number of `.tp-state` lines, the first thread's start and the Invitations text, timed from the click. Resource Timing gave the `family_codes` requests.
  - **Frames:** I took a screenshot after each step to force frames.
  - **Fresh baselines:** force-reloaded `/family` at 1366, 1920 and 800.
  - **First visit:** a force-reloaded `/`, then the Family pill.
  - **Later visits:** Home pill → Family pill, and a person page → Family pill.
  - **Person page:** Family → Ty Ngo's page, in-app, at 1366.
- **R14-1 probes:** on `/family?preview=tree` at 320 and 390, I swapped `.tp-also` for longer lists, transformed exactly as line 569 does. I read the line breaks from per-character client rects, then put the original back. A check after each run confirmed it was restored.
- **Sweep:** sample tree at 320, 390, 800, 1100, 1366 and 2560×1440, and `sample-rose` at 320.
- **Clean-up:**
  - I reset the viewport to desktop and closed my tab. The founder's tabs (9, 73, 158, 165, 167) are untouched.
  - I never signed out, never touched `astory-app-auth` and wrote no data.
  - My only clicks were on nav pills and face links.
- **Noise:** another agent's edits to the archive files reloaded my tab through Vite several times. Every number below comes from a run with no reload in it. I checked `performance.timeOrigin` or `performance.now()` against the step.

**Not verified:**
- A production build.
- 3840.
- A real Edge zoom.
- What the 0.4s refit looks like with live frames. The pane was hidden.
- Revoking or adding a code live, because both would write. They were checked by reading the code, as asked.

## Round 14, item by item

| Item | Verdict | Evidence |
| --- | --- | --- |
| **R14-1** A wrapped owner list split "and" from its name | **Fixed** | The rendered sample label is `"and\u00a0Margaret’s"`. **320** (label edge 300): 1 owner on one line, h3 42.7, ends at 146.4, the same as round 14. 2 owners on one line. 3 owners: "and Margaret’s / and Arthur’s and Frank’s". 4 owners: "… and Arthur’s / and Frank’s and Jim’s". 5 owners: 2 lines. 6 owners: 3 lines, every line starting with "and". "and Nhi Tran’s and Margaret’s" stays on one line. `scrollWidth` 320 throughout. **390** (edge 370): 1 owner ends at 307.4. 3 owners on one line, ending at 306.7. 4 owners: 2 lines, ending at 187.7. 6 owners: 3 lines, ending at 250.1. All breaks come before "and", with `scrollWidth` 390. A single 50-character owner still breaks at its hyphen, inside the edge, through `overflow-wrap: anywhere`, so R13-1 can't come back. |
| **R14-2** An in-app visit drew without the state lines, then refit | **Fixed from the second visit; open on the first** (R15-1) | See the table below. |

## In-app visits (242612c)

The founder's family, with one code out (Ty Ngo, 29 days). The times are from the click, and "threads" is the first path's start.

| Width | Fresh load | First visit: fresh `/` → Family pill | Home → Family pill (second visit) | Person page → Family pill |
| --- | --- | --- | --- | --- |
| 1366 | `m`, plate 475.3, 5 state lines, threads 539/540,217 | **431ms: `m`, 438.2, 1 state line, threads 539,180, "Looking for the codes you’ve sent…"** → **798ms: 475.3, 5 lines, threads 539,217** (codes request 446ms + 368ms) | 96ms: `m`, 475.3, 5 lines, 539,217. Never refits. **Invitations "20773 days left" until 437ms** | 94ms: `m`, 475.3, 5 lines, 539,217. Never refits. "20773 days left" until 560ms |
| 1920 (zoom 1.08) | `m`, 513.2, 5 lines, threads 537,217 and 709.5,169 | **431ms: `m`, 473.2, 1 line, threads 537,180** → **842ms: 513.2, 5 lines, 537,217** (437 + 374ms) | 286ms: `m`, 513.2, 5 lines, 537,217. Never refits. "20773 days left" until 691ms | 84ms: `m`, 513.2, 5 lines, 537,217. Never refits. "20773 days left" until 443ms |
| 800 | `n`, 705.2, 5 lines, tier bottoms 528/984 | **386ms: `n`, 648.6, 1 line, tiers 212/436** → **799ms: 705.2, 5 lines, tiers 249/456** (420 + 293ms) | `n`, 705.2, 5 lines, tiers 249/456. Never refits. "20773 days left" for about 370ms | 87ms: `n`, 705.2, 5 lines, 249/456. Never refits. "20773 days left" until 498ms |

**Person page in-app (Family → Ty Ngo, 1366):** from 140ms to 486ms, `.pp-why` reads "Invited with a code, 20773 days left; nothing here reaches Ty until they accept." at y 667–737, inside the 900 fold. Then it reads "29 days left". The plate's children keep their heights (44/18/158/44), and the plate's 70px drift is the arrival rise, not the codes.

**Code reading, for `last`:**
- **Revoked, on Family:** `Family.tsx:109` calls `setCodes((prev) => …filter)` after the hold, through the wrapper. `last` updates.
- **Revoked, on the person page:** `Person.tsx:218`, `mine.setCodes(...)`, same path. `last` updates.
- **Added through the InviteSheet:** `onSaved={afterWrite}` (`Family.tsx:297`) → `mine.reload()` → a fresh `listMyCodes()` → `setCodes(list)`. `last` updates.
- **Added on the person page (`sendCode`, `Person.tsx:229–248`):** neither `mine.reload()` nor `mine.setCodes` is called. **`last` stays without the new code** (R15-3).
- **Added as a keeper invite (`Keepers.tsx:50` → `inviteManager` → `familyCodeFor({ storyId })`):** `last` stays without the story code. It doesn't affect the tree, since it has no `personId`. Before 242612c the Invitations list was already stale on the same page.
- **Sign-out:** both `AuthProvider` branches clear `last`. A fresh load starts at `null`.

## The sweep (sample tree unless noted)

| Width | Layout | Threads | Faces overlapping | Horizontal scroll | Label and names | Hidden in view |
| --- | --- | --- | --- | --- | --- | --- |
| 320 | phone, `t`, plate 2466.3 | 0 | 0 of 16 | none (320) | children h3 42.7, "and Margaret’s" ends at 146.4 | none |
| 390 | phone, `t`, plate 2152.5 | 0 | 0 | none | ends at 307.4, h3 22 | none |
| 800 | band, `t`, plate 1257.8 | 0 | 0 | none | one line | none |
| 1100 | stack, `t`, plate 1257.8 | 0 | 0 | none | one line | none |
| 1366 | grid, `t`, plate 818.2 | 11 | 0 | none | `.tp-also` a block at 73.7. h3 40.2, `.tp-name` 37.7/37.7/57.2/37.7 | thread paths at 0.95, by design |
| 2560×1440 | grid, zoom 1.44, plate 1178 | 11 | 0 | none | `.tp-name` 54.3/54.3/82.4/54.3, children h3 57.9 | thread paths at 0.62–0.75, by design |
| Person `sample-rose`, 320 | — | — | — | none | "Rose Hartley." on one line (35.4) | none, no `.pp-skel`, no `aria-busy` |

Every number matches round 14. Nothing regressed.

## Gaps

### R15-1. POLISH: the first Family visit of a session still draws without the state lines, then refits (R14-2, still open)
**Skill:**
- impeccable optimize, CLS: "Reserve space… Avoid animations that cause layout shifts".
- emil-design-eng, the frequency table: Home → Family is the founder's most frequent way in.
- taste-skill critique, pass 1: the first impression.

**Where:**
- `useMyCodes.ts:12`: `last` is filled only by a mounted `useMyCodes`, which runs on Family (`Family.tsx:139`) and Person (`Person.tsx:78`).
- `AccountProvider.tsx:41`: the family is loaded and cached at sign-in, but the codes aren't.

**Why:** the session starts on Home, which has no `useMyCodes`. So the first Family visit mounts with `last === null`, and `coded` is `"unknown"` (`Family.tsx:248`). The cached family draws at once without the state lines, and the tree refits when the codes come back. Measured above:
- **1366:** 438.2 → 475.3, threads y 180 → 217.
- **1920:** 473.2 → 513.2.
- **800:** 648.6 → 705.2. The home generation grows from 436 to 456.

Every refit lands 370–420ms after the plate is drawn.

**Change:** fetch the codes with the family, so the first visit finds them, as a fresh `/family` load does. Then make that fetch safe across a sign-out:

```ts
// useMyCodes.ts
let gen = 0;
export function clearCodesCache() { last = null; lastAt = null; gen++; }
/** Fetched with the family at sign-in, so the first Family visit already knows who is invited. */
export function primeCodes() {
  const g = gen;
  listMyCodes().then((list) => { if (g === gen && last === null) { last = list; lastAt = new Date(); } }).catch(() => {});
}

// AccountProvider.tsx, in reload(), beside loadFamily():
primeCodes();
```

A visit that starts before the prime lands is no worse than today, because its own fetch still runs.

### R15-2. UGLY: cached codes show "20773 days left" until the refetch lands, and keep showing it if the refetch fails
**Skill:**
- impeccable harden: "Date/time" and "Network failures"; never show stale or invented data as fact.
- impeccable craft-floor, Verify → States ("loading, error … real content").
- hallmark interaction-and-states, loading.
- BAOS rule 29: an invitation's state is told exactly.

**Where:**
- `useMyCodes.ts:29`: `const [now, setNow] = useState(() => new Date(0));`
- `useMyCodes.ts:19`: `codes` now starts from `last`.
- `Family.tsx:91` and `Person.tsx:382` call `expiresLabel(expiresAt, now)`. `familyView.ts:226` counts `ceil((expiresAt − now) / day)`.
- `Family.tsx:58` (`failed && codes === null`) and `Person.tsx:167` (`codesUnknown` needs `codes === null`).

**Why:** before 242612c, `codes` and `now` were both set in the same `.then`, so `Date(0)` was never on screen. Now `codes` arrives from the cache on mount, but `now` stays at 1970 until the fetch resolves.

**Measured:**
- "for Ty Ngo · 20773 days left" in Invitations, for 340–405ms on every second visit, at 1366, 1920 and 800. At 1366 the list starts at y 1479, below the fold, so it shows to anyone who scrolls or uses a screen reader.
- "Invited with a code, 20773 days left" on Ty's page, for about 350ms, at y 667 inside the fold at 1366.

**If the refetch fails** (offline, a timeout): `failed` is true but `codes` isn't `null`. So neither failure line shows, and "20773 days left" stays on Family and on the person page with nothing to say it's stale.

**Change:** keep the time the cached list was fetched, and start `now` from it:

```ts
// useMyCodes.ts
let lastAt: Date | null = null; // when `last` was fetched: a cached list counts its days from here
const [now, setNow] = useState(() => lastAt ?? new Date(0));
// in .then:
setCodes(list); lastAt = new Date(); setNow(lastAt); setFailed(false);
```

Clear `lastAt` in `clearCodesCache` too. "29 days left" is then right from the first frame, and a failed refetch shows the last good count.

### R15-3. POLISH: a code made on the person page never reaches `last`
**Skill:**
- impeccable harden ("Optimistic updates", keep state consistent).
- BAOS rule 29, through hallmark interaction-and-states.

**Where:** `Person.tsx:247–248`. After `familyCodeFor({ personId })` it sets `sent` and reloads the account only `if (to)`. It never calls `mine.reload()`.

**Why** (code reading only): `last` keeps the list from before the code. On the next in-app visit, two things go wrong:
- **Family** draws that person without "invited · waiting for them" and refits when the fetch lands. That's R14-2's mechanism, back for this path.
- **The person's own page, for a code-only invite** (no email, so no `invitedAt`): `codes` is non-null, so `codesUnknown` is false. `liveCode` is null, and the page shows "not on A Story yet" and the send-a-code controls until the fetch corrects them. Before 242612c, `codesUnknown` hid that block until the codes were known.

**Change:**
- In `sendCode`, after `setSent(...)`, add `mine.reload();`. This also fixes the page's own state line, which today stays "not on A Story yet" beside the new CodeCard.
- Optional: give `Keepers` an `onChanged={mine.reload}` so a keeper's story code joins Invitations at once.

## Skill by skill

- **taste-skill:** applied, with R15-1 open.
  - Type §8: R14-1's breaks are now authored. Every wrapped owner line starts with "and".
  - No face lies on another at any width.
  - The first impression on the Home → Family path is still a tree that settles twice (R15-1).
- **hallmark:** applied, with R15-2 open.
  - No horizontal scroll from 320 to 2560 (gate 34).
  - No new control wraps.
  - The loading state on a cached visit shows invented content, "20773 days left", where the loading state should be (interaction-and-states).
- **emil-design-eng:** applied, with R15-1 open.
  - 242612c adds no transition, hover or easing.
  - The first-visit refit is a layout jump on the highest-frequency path into Family.
- **impeccable:** applied, with R15-1, R15-2 and R15-3 open.
  - typeset Stress: long owner lists hold at 320 and 390.
  - optimize CLS: fixed for later visits, open for the first (R15-1).
  - harden, date/time and network failure: R15-2.
  - harden, state consistency: R15-3.
- **GSAP (react, performance, scrolltrigger, timeline):** no gaps. `treeMotion.ts`, `scrollShell.ts` and `arrive.ts` are unchanged. The arrival still ends with every face at full opacity (no hidden element in view at any sweep width).

## Notes, not counted

1. **The no-break space at `FamilyTree.tsx:569` is a literal U+00A0 in the source.** It's invisible in an editor and in a diff (the commit shows it as a plain space). If a later edit retypes it as a space, R14-1 comes back silently, and no test covers it. Write it as `"\u00a0"`, or add a test on the rendered `.tp-also`.
2. **Two `family_codes` requests per visit**, as in round 14. This is likely StrictMode in dev.
3. **`.tp-ask` "Rose’s grandparents" sits on two lines in the 1366 grid rail** (176px wide; "Rose’s" / "grandparents" inside its 44px box). This hasn't changed since round 10 and isn't touched by 242612c. Hallmark gate 49 would read it as a two-line control, so the founder may want to rule on it.
4. **`.tp-gl` ghost captions** ("a sister or / brother") wrap under their circles at 390. They're `text-wrap: balance` captions by design.
5. **The 2560 snug threads are ruled open for the founder.**
