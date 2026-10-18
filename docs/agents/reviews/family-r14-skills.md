# Skills Steward: Family and Person, round 14

**Verdict: GAPS (0 blocker, 0 ugly, 2 polish).**

Everything round 13 asked for is fixed, and I measured it live:
- **R13-1:** `.tp-also` is now `inline-block; max-width: 100%`, with no `nowrap`, in the band and the stack. With six owners, the list wraps inside its own box and ends inside the label's edge at 320 and 390. There is no horizontal scroll.
- **Note 1:** each tier's `<section>` now takes `aria-labelledby="tp-h-{tier.key}"` and points at its own h3. Chromium's accessibility tree names the children's region "Rose's children and Margaret's", the same words as its heading.
- **34684a8 (the coordinator's addition):** an in-app visit now ends with the same tree as a fresh load. I tested Home → Family pill and a person page → Family pill at 1366, 1920 and 800. The size, plate height, face positions and thread ends all match a fresh load.
- **d13b205:** Family and Person both arrive cleanly, fresh and in-app. Nothing is left hidden in view, and no skeleton is left behind.

Two small things keep this round from passing. Each fix is a few lines:
- **R14-1:** now that a long owner list can wrap, `text-wrap: balance` sometimes breaks it between "and" and the name: "and Margaret's and / Arthur's and Frank's".
- **R14-2:** an in-app visit draws the tree without the faces' state lines for about 0.3s, then refits. 34684a8 fixed the end state, but not that first draw.

R14-1 affects neither the sample tree nor the founder's family as they stand. R14-2 affects every in-app visit, for about 0.3s each time.

**Scope:**
- **5bfa37e:**
  - `FamilyTree.tsx:561` and `:567`: `aria-labelledby={`tp-h-${tier.key}`}` on the section, and the matching `id` on the h3.
  - `family-people.css:248` (band) and `:679` (stack): `.tp-also { display: inline-block; max-width: 100%; margin: 0; }`.
- **34684a8:** `FamilyTree.tsx:398` builds `codedKey` from `coded`, and `:482` adds it to `draw`'s dependencies.
- **d13b205, Family and Person only:**
  - `Shell.tsx`: on a bare page the arrival key is `b`, not the title.
  - `arrive.ts`: a foil kept from the skeleton isn't stamped again, and an `inside` arrival starts its `now` items at 0.08.
  - `Person.tsx`: the loading Shell now carries the arrived hero's frame.
- **Read alongside them:**
  - `plateModel.ts:207`, where `also` is built.
  - `useMyCodes.ts` 11–40 and `Family.tsx:139` and `:248`, which pass `coded` into the tree.
  - `family-people.css` 145–165 and 670–702.

**Skills loaded:**
- taste-skill: SKILL (house rules), critique, and type §8, "Mistakes the inspector cannot see".
- hallmark: responsive, and slop-test gates 33, 34 and 49–51.
- emil-design-eng: the review checklist and the frequency rule.
- impeccable: craft-floor, typeset (Stress), and optimize (CLS).
- gsap-react, gsap-performance, gsap-scrolltrigger.

I also read BAOS-STANDARD.md and DESIGN.md. No other installed skill applies.

**How it was checked:**
- **Tests:**
  - vitest on `components/family` and `components/person` passes: 5 files, 47 of 47 tests.
  - `tsc --noEmit` prints nothing.
- **Live, in my own tab (tab-164):**
  - **Sample tree:** I force-reloaded `/family?preview=tree` at 320, 340, 390, 800, 1100, 1366, 2560×1440 and 2560×1300.
  - **Frames:** I took screenshots to force frames at 320, 800, 1100, 1366 and 2560×1440, and on every in-app step.
  - **Real family:** fresh loads and in-app visits at 1366, 1920 and 800.
  - **Person page:** `/family/sample-rose?preview=tree` at 320 and 1366, and a real person page in-app at 1366, 1920 and 800.
- **Accessible names:**
  - The pane's `find` and `read_page` tools list the four tier regions with no name. They only read `aria-label`.
  - In the page, `section.ariaLabelledByElements` resolves to the tier's own h3.
  - To read the real accessibility tree, I loaded the exact tier markup from my tab into headless Chromium (Playwright with `Accessibility.getFullAXTree`). It gave region "Rose's children and Margaret's", with its name from `relatedElement aria-labelledby`.
  - The colon in `tp-h-tier:-1` is fine: IDREFs split only on spaces.
  - Signed out, headless `/family?preview=tree` redirects to sign-in, which is why I loaded the markup.
- **Probes:**
  - I swapped the `.tp-also` text in my tab for longer owner lists, then put it back. A check after each probe confirmed it was restored.
  - To test the R14-1 fix, I swapped in a version with no-break spaces, then put the original back.
- **Clean-up:**
  - I reset the viewport to desktop and closed my tab. The founder's tabs are untouched.
  - I never signed out, never touched `astory-app-auth` and wrote no data.
  - My only clicks were on nav and face links, to reach other pages in the app.

**Not verified:**
- A real screen reader's speech.
- A real Edge zoom.
- 3840.
- The add flow, because it would write.
- **How the 0.3s refit in R14-2 looks with live frames.** The pane was hidden, so frames ran only when I took a screenshot. I measured the pre-code state and the request times, but not what the founder sees frame by frame.
- **One frame at 320 on the Person page:** on my first fresh load of Rose's page, one screenshot showed "Rose / Hartley." on two lines, then one line. On two more fresh loads the title was on one line every time I sampled it, and the buffered layout-shift list was empty on one of them. I couldn't reproduce it, so I don't count it. It may have been a frame before the face finished loading on a slow dev load.

## Round 13, item by item

| Item | Verdict | Evidence |
| --- | --- | --- |
| **R13-1** A long owner list can't wrap and runs off a phone's edge | **Fixed** | **Computed style:** `display: inline-block`, `white-space: normal`, `max-width: 100%`, in the band at 320, 340, 390 and 800, and in the stack at 1100. **At 320** (label edge 300), with "and" at x 50 every time, the text ends at: 3 owners 178.7 (2 lines), 4 owners 229.6, 5 owners 254.7, 6 owners 254.7 (3 lines). **At 390** (label edge 370), it ends at: 3 owners 306.7 (1 line), 4 owners 229.6, 5 owners 254.7, 6 owners 352.8. `scrollWidth` equals the viewport at both widths. Round 13 measured 370.6 and 437.6, cut off at the screen edge; that's gone. |
| **Note 1** The region was named "Rose's children" while its heading said "… and Margaret's" | **Fixed** | All four tiers carry `aria-labelledby` pointing at their own h3, and no `aria-label`. Each id is unique on the page, and there are no duplicate ids at all. The AX tree gives the regions "Rose's parents", "Rose's generation", "Rose's children and Margaret's" and "Rose's grandchildren", all via `aria-labelledby`. Each `<header>` inside a section maps to `sectionheader`, not `banner`. "Not placed yet" keeps its `aria-label`, which matches its own h3 word for word, so it doesn't need the id. |

## The one-owner case, swept

| Width | Layout | Threads | Faces overlapping | Horizontal scroll | Label |
| --- | --- | --- | --- | --- | --- |
| 320 | phone, size `t` | none | 0 of 16 | none | "1960s Rose's children / and Margaret's". "and" is at x 50–146.4, and the h3 is 42.7 tall. Plate 2466.4. Same as round 13. |
| 340 | phone | none | 0 | none | One line, gap 8.05. Plate 2445.7. |
| 390 | phone | none | 0 | none | One line, gap 8.05, "and Margaret's" at 211–307.4. Plate 2152.5. |
| 800 | band | none | 0 | none | One line, gap 8.04. Plate 1257.8. |
| 1100 | stack | none | 0 | none | One line, gap 8.04. Plate 1257.8. |
| 1366 | grid | 11 | 0 | none | `.tp-also` is a block at x 73.7, under the title. The h3 is 40.2 tall and the `.tp-name`s are 37.7 / 37.7 / 57.2 / 37.7. Plate 818.2. |
| 2560×1440 | grid, zoom 1.44 | 11 | 0 | none | `.tp-name` 54.3, children h3 57.9. |
| 2560×1300 | snug, zoom 1.3, size `n` | 0 | 0 | none | `.tp-name` 49, children h3 52.3. The snug threads are ruled open. |

Every number round 13 reported matches. The inline-block changes nothing when the list fits on one line.

## In-app visits (34684a8)

Each visit had the founder's family cached. Each fresh load was a force-reload. Every in-app visit was measured after it settled.

| Width | Fresh load | Home → Family pill | Person page → Family pill |
| --- | --- | --- | --- |
| 1366 | size `n`, plate 419.3. Threads 562,189→203,221 and 711,141→201,201. Node heights 183/165/165/214/165. | identical | identical |
| 1920 (zoom 1.08) | size `m`, plate 513.2. Threads 537,217→231,249 and 709.5,169→229,229. Nodes 228/209/209/262/209. | identical | identical |
| 800 | size `n`, plate 705.2, no threads (band). Tier bottoms at 528 and 984, against a fold of 1012. Nodes 183/165/165/214/165. | identical | identical |

The face positions match within rounding (0.5px) in every row. Round 12's failures are gone:
- At 1366, Ty's node is 183 tall, with its state line, and his thread ends where a fresh load ends it.
- At 800 the home generation now ends at 984 against the 1012 fold. Bao's three friends were cut off before; now they aren't.

The person page arrives cleanly in-app at 1366, 1920 and 800: a skeleton, then "Ty Ngo & Bao.", with nothing left at opacity 0 in view.

## d13b205: arrival

- **Family:** after every fresh load and every in-app visit, nothing in view is below full opacity, and no `aria-busy` is left. The one exception is the sample tree's "Invite someone" button: it is `aria-disabled` at 0.65 opacity on purpose.
- **Person, Rose (fresh) at 320 and 1366:**
  - The title is "Rose Hartley.", 35px tall at 320.
  - Nothing in view is hidden, and the `.pp-skel` is gone.
  - There is no horizontal scroll.
  - The landmarks are Main, "Where to next" and Main.
- **The skeleton's hero frame:** neither the loading Shell nor the loaded one passes a title, so both have the key `h`, and swapping in the content doesn't re-key the arrival. After the swap, nothing in view was hidden and no word was stuck. With the pane hidden, I couldn't watch the swap frame by frame.

## Gaps

### R14-1. POLISH: a wrapped owner list can split "and" from its name
**Skill:**
- taste-skill type §8: "a break that splits a phrase … Author the break."
- impeccable typeset, Stress (long headings, narrow containers).

**Where:**
- `FamilyTree.tsx:569`: `<span className="tp-also">{tier.also}</span>`.
- `plateModel.ts:207`: `also` is `and ${owners.join(" and ")}`, with ordinary spaces throughout.

**Why:** the h3 is `text-wrap: balance`. Now that the list can wrap (R13-1), balance picks whichever space evens the lines, including the one inside "and Arthur's".

**Measured, sample tree, text swapped in my tab:**
- **320, three owners:** "and Margaret's and / Arthur's and Frank's"
- **390, six owners:** "and Margaret's and Arthur's and Frank's and / Jim's and Ann's and Bartholomew-Fitzwilliam's"
- The other runs broke before an "and".

**The fix, live:** bind each owner phrase with no-break spaces, so the only breaks are before each "and":
- **320, three owners:** "and Margaret's / and Arthur's and Frank's". It ends at 207, and the h3 is 57.2 tall.
- **320, six owners:** three lines, each starting with "and". It ends at 254.7.
- **One owner:** identical (146.4, h3 42.7).
- **"and Nhi Tran's and Margaret's":** stays on one line at 320.
- **A single 50-character owner:** still ends inside the label (280.2). The h3's `overflow-wrap: anywhere` breaks a no-break run when nothing else fits, so this can't bring back R13-1.

**Change:** do it at render, so the model and its two tests are unchanged.

```tsx
// FamilyTree.tsx:569
<span className="tp-also">{tier.also.split(/ (?=and )/).map((p) => p.replace(/ /g, "\u00a0")).join(" ")}</span>
```

A screen reader reads a no-break space as a space, so the heading's name still sounds the same. Its `textContent` will hold U+00A0 instead of U+0020.

### R14-2. POLISH: an in-app visit draws the tree without the state lines, then refits about 0.3s later
**Skill:**
- impeccable optimize, CLS: "Reserve space… Avoid animations that cause layout shifts".
- emil-design-eng: the frequency rule. This is the founder's most frequent way into Family.
- taste-skill critique, pass 1: "How to look", the first impression.

**Where:**
- `useMyCodes.ts:12–32`: the codes start as `null` on every mount and are fetched fresh.
- `Family.tsx:248`: `coded` is `"unknown"` until they arrive.
- `FamilyTree.tsx:398` and `:482`: 34684a8 redraws when they do.

**Why:** the family is cached on an in-app visit, so the plate draws at once. It draws with no state lines and fits for the shorter faces. When the codes come back, the state lines appear and the tree refits and rethreads. 34684a8 makes the second draw happen, and that's what fixed the end state. The first draw still shows on screen until the codes come back.

**Measured at 1366, Home → Family pill:**
- **Just after the route swapped:** size `m`, plate 438, nodes 165/165/165/230/165 (Ty's state line missing), and threads 539,180→194,212.
- **After the codes arrived:** size `n`, plate 419, nodes 183/165/165/214/165, matching the fresh load.
- **The codes request** (`family_codes`, from Resource Timing) took 297, 331, 356 and 341ms across two visits. It fires twice per visit.

So for about 0.3s the tree is fitted at size `m`, not `n`. Then it refits and the threads move, while the tree is still arriving. I couldn't watch it with live frames (see Not verified).

**Change:** remember the last list for the session, so an in-app visit draws with the codes it already has, and refits only if they changed:

```ts
// useMyCodes.ts
let last: MyCode[] | null = null; // the last list this session; an in-app visit starts from it
export function useMyCodes(enabled = true) {
  const [codes, setCodes] = useState<MyCode[] | null>(last);
  // …in .then: last = list; setCodes(list);
}
```

Also set `last` wherever `setCodes` is called from outside (a new or revoked code), so it never holds a stale list. A fresh load is unchanged, because it starts from `null` as now.

## Skill by skill

- **taste-skill:** applied, with R14-1 open.
  - No headline runs past two lines with one owner. With six owners at 320 the h3 runs to four lines, which is the content.
  - No face lies on another at any width (pass 13).
  - The wrapped list starts on the decade's edge, x 50 (pass 4).
  - On the founder's real paths, the in-app tree now matches the fresh one.
- **hallmark:** applied.
  - No horizontal scroll at any width I measured, nor with six owners at 320 and 390 (gate 34).
  - Each tier region's name now matches its heading.
  - No control label wraps.
- **emil-design-eng:** applied, with R14-2 open.
  - 5bfa37e and 34684a8 add no transition and no hover.
  - The refit after the codes arrive is a layout jump on a high-frequency path (R14-2).
- **impeccable:** applied, with R14-1 and R14-2 open.
  - craft-floor, Verify ("Run the real copy at every breakpoint and fix what overflows"): long copy now stays inside the label at 320 and 390.
  - Landmarks match their headings.
  - DOM order and focus order are unchanged.
- **GSAP (react, performance, scrolltrigger):** no gaps.
  - No tween touches `.tp-label`.
  - The redraw in 34684a8 is a React layout effect, not a GSAP refresh, and `scrollShell.ts` and `treeMotion.ts` are unchanged.
  - The `arrive.ts` change keeps the foil from being stamped twice (`dataset.risen`) and only shortens the `now` delay for an `inside` arrival. Both still end with `clearProps`, so nothing is left hidden.

## Notes, not counted

1. **The `eslint-disable-next-line react-hooks/exhaustive-deps` at `FamilyTree.tsx:481`** sits on the comment line above the dependency array, as it should. `codedKey` isn't read inside `draw`, so the rule would flag it. The disable is honest, and its comment says why.
2. **Two `family_codes` requests per visit.** This is likely React StrictMode's double effect in dev. Check it in a production build before assuming the duplicate is real.
3. **Hidden hover captions at 320** (`.tp-cap` at opacity 0): round 13 noted that they leave `body.scrollWidth` a few px wide. I didn't re-measure `body` this round. `documentElement.scrollWidth` read 320 at 320. They're invisible and don't scroll.
4. **The 2560 snug threads** are ruled open for the founder. Snug at zoom 1.3: 0 paths, no overlap.
