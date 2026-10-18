# Skills Steward: writer, round 7

**Verdict: GAPS (0 blockers, 0 ugly, 2 polish).** Round 6's three gaps are fixed, and so is the BAOS reviewer's first finding (G2 there and finding 1 are the same fix). The deletions in §46 left nothing behind:
- No `keeprow` or `leaf-ribbon` is left anywhere in `src/`.
- `astory.css` and `writer.css` both have balanced braces.
- The browser parsed all of `astory.css`, through its last rule.
- Home, Archive, Family, Book and Account all render, with no console errors.

Two small things are left, and both come from this round's fix for BAOS finding 2:
- **N1.** At 1366×768 the keep bar now ends 0.4px above the window's bottom edge.
- **N2.** Four of the short-window rules never apply, because rules later in the file override them. One of them is the 6px under the kicker that would make the new step read clearly.

**Scope:**
- `src/pages/Write.tsx` (unchanged since 00:17)
- `src/styles/pages/writer.css` (00:36)
- §46 of `src/styles/astory.css`, lines 3354–3416

**Skills loaded:**
- taste-skill: SKILL.md (house rules and laws), plus the critique and layout references.
- hallmark: the slop test (all 58 gates), interaction-and-states, responsive.
- emil-design-eng: the frequency, easing, duration, press, hover, performance and reduced-motion rules.
- impeccable: SKILL.md, craft-floor, polish, and the critique and layout references.
- GSAP: react, timeline, performance, and scrolltrigger (refresh and cleanup).
- The other installed skills were checked. None adds anything here: there's no new copy for humanizer.

I also read `docs/BAOS-STANDARD.md`.

**How it was checked:** I read the code, then measured it in my own tab (tab-95, now closed, viewport reset).
- **Pages:** `/write?q=faith-pray-now`, at 1366×700, 1366×768, 1280×720, 1920×1000 (rail), 2560×1300 (`--zoom` 1.3), 3840×2000 (`--zoom` 2), 768×1024, 390×844 and 320×700.
- **Before measuring:** I reloaded after every resize. I stepped the GSAP ticker with real delays, so the arrival timeline had finished and cleared its props.
- **The served CSS:** it matched the file on disk.
- **A long page:** I simulated it by injecting `.wbody { min-height: 1600px }`, plus the `writing` class on the non-rail layouts. I removed both afterwards.
- **The sticky block:** I swept it in 10px scroll steps at 1366×700, 1366×768, 1920, 2560 and 3840.
- **Other pages:** I opened Home, Archive, Family, Book and Account in-app at 1366×768.

**What I did not touch:**
- I typed nothing, pressed nothing and created no drafts.
- The `beeedb62…` draft was 370 characters before and after.
- During the review, a story-level draft appeared ("This is a test page for the review. It will be removed…", 936 characters). It belongs to another reviewer's session; it isn't mine, and I didn't touch it.
- `astory-app-auth` was only checked for presence.

**Files changed while I worked:** `astory.css` was rewritten at 00:42, during the review. It lost 28 lines, outside §46: §46 is at the same lines with the same text. Afterwards I re-ran the checks:
- the brace check;
- the `keeprow` and `leaf-ribbon` grep;
- a check that every `var(--…)` the writer uses is still defined (`--w-pencil`, `--w-gilt-b`, `--terracotta-ink` and `--ink-stamp` all are).

All held. The browser measurements were taken before 00:42, but nothing the writer uses moved.

**Not verified:**
- **N2's fix.** The figures given for it below are worked out from the cascade, not injected.
- **Anything visual.** The pane rendered a scaled screenshot only once, at 1366×768; everything else is measured.
- **Real Edge, and reduced motion emulated.** For reduced motion, the CSS and the matchMedia guard were read instead.
- **Typing into the page, and a real failed Keep.**

## Round-6 gaps and the BAOS findings, re-checked

| # | Gap | Now |
|---|---|---|
| G1 | The folio's descenders crossed the foil frame on a short window | **Fixed.** `writer.css:169` gives both pages `padding-bottom: 16px` under 740px tall. At 1366×700 and 1280×720 the folio's baseline is 7.6px above the hairline, so the descenders are about 5px clear. The left page's lowest text is 16.8px above its frame through the whole scroll. |
| G2 | On the rail, the left page and the margin pinned 24px apart | **Fixed.** `writer.css:57` pins `.leaf-left-in` at `--top-h + 40px` on the rail. Both pin at 104 at 1920, both at 135.2 device px at 2560, and both at 208 at 3840. The two blocks' tops are level. The first lines' boxes differ by 6px (the kicker at 114, the heading at 108), but by the fonts' metrics the cap tops land within about 2px of each other: 12px caps against a 21px Cormorant line. The block never reaches the bar or leaves the frame at any of the three sizes. |
| G3 | §46.7 styled the old writer | **Fixed.** `.leaf-ribbon`, `.keeprow` (everywhere in `src/`) and the `.leaf-one .folio` and `.leaf-one .dear` rules are gone. §46's header now says the writer's leaf keeps only the turned-down corner, and points to writer.css for the rest, which is true. The only `.dear` and `.folio` rules on the writer are writer.css's. The section's remaining numbers run 1, 2, 3, 6; that's harmless. |
| BAOS 1 | Same as G2 | Fixed, as above. |
| BAOS 2 | The running head sat on top of the kicker | **Fixed on a laptop:** at 1366×768 the step from the running head to the kicker is 22px, against 8px from the kicker to the question. **Weaker on a short window:** at 1366×700 and 1280×720 it is 12px against 8px, because the 6px meant for under the kicker never applies (N2). |

## Gaps

### N1. POLISH: at 1366×768 the keep bar touches the bottom of the window
**Skill:** taste-skill critique pass 13 (collisions and the frame's edge); impeccable polish ("verify every supported viewport"). BAOS rule 5 and writer.css's own promise (`:155`): "the spread, the seal and its bar fit one screen at 1366×768 on arrival".

**Where:** `writer.css:187`, `.spread .leaf-left > .leaf-left-in { margin-top: 12px }` inside `@media (max-height: 900px)`. The left page is the taller of the two, so the 12px makes the whole book 4px taller than in round 6. The book now runs 166–662, and the bar 678.1–767.6 against a 768px window. In round 6 the bar ended at 764. The bar's rounded bottom edge now sits on the window's edge, so it reads as cut off. The ribbon's tail ends at 676, 2px above the bar, so the bar can't simply move up.

**Change:** use 8px at ≤900px tall. The step from the running head to the kicker becomes 18px (8 plus the 10px gap), still more than twice the 8px from the kicker to the question, and inside the 18–22px the BAOS reviewer asked for.
```css
@media (max-height: 900px) {
  .spread .leaf-left > .leaf-left-in { margin-top: 8px; } /* :187, was 12px */
}
```
Injected at 1366×768: the book ends 4px higher and the bar ends about 4.4px above the window's edge, as in round 6. The ribbon still clears the bar by 2px, and the step is 18px.

### N2. POLISH: four of the short-window rules lose to later rules, so the 740px block doesn't do what it says
**Skill:** impeccable polish ("code and asset cleanup", and fix the cause at the narrowest level); hallmark pre-emit axis C (execution); taste-skill critique pass 5 (space: the gap between groups larger than any gap inside one).

**Where (`writer.css`):** the `@media (max-height: 740px)` block (`:165–184`) comes *before* the `(max-height: 900px)` block (`:185–195`) and before the base left-page rules (`:199–215`). A window under 740px tall matches both blocks. So these four declarations lose, either to a later rule of the same specificity or to a stronger one. Computed at 1366×700:

| Line | Meant | Computed | Overridden by |
|---|---|---|---|
| `:169` `.spread .leaf-left-in { gap: 4px }` | 4px | **10px** | `:209` `.leaf-left > .leaf-left-in` (same specificity, later) |
| `:171` `.spread .leaf-left .w-qhead { margin-top: 4px }` | 4px | **0px** | `:186` (same specificity, later) |
| `:180` `.w-desk .spread .leaf-left .w-qkick { margin-bottom: 6px }` | 6px | **8px** | `:189` (stronger: it adds `.sheet-page`) |
| `:182` `… .leaf-left .w-kick { margin-bottom: 2px }` | 2px | **4px** | `:190` (same specificity, later) |

Two smaller leftovers in the same block:
- In `:169`, the `.spread .leaf-left-in` selector does nothing at all: its padding is reset by `:170` and its gap is lost to `:209`.
- `:181` restates the 14px that `:188` already sets.

**What it costs on screen:** at 700 and 720 the kicker sits 8px above the question rather than 6px. So the new step from the running head is 12px against 8px, only 1.5 times, where the code intends 12 against 6.

**Change:** move the whole `@media (max-height: 740px)` block below the `(max-height: 900px)` block and the base left-page rules (after `:215`), so that it wins as it was written. Then drop the `.spread .leaf-left-in` selector from `:169`, and the repeated `:181`.

What I expect at 1366×700 (worked out, not injected):
- The kicker sits 6px above the question.
- The step from the running head to the kicker stays 12px (8 plus the 4px gap), now twice the gap below.
- The list closes up by about 6px, so the book gets shorter and the keep bar moves up.

If the 740 values aren't wanted after all, the other fix is to delete the four declarations. Either way, the file should say what ships.

## §46 and the deletions

| Check | Result |
|---|---|
| `keeprow`, `leaf-ribbon` in `src/` (TSX, CSS, anything) | None. Outside `docs/agents/reviews` they appear nowhere in the project. |
| Brace balance (comments and strings stripped) | `astory.css` depth 0, with no negative point; `writer.css` the same. Re-checked after the 00:42 rewrite. |
| The parsed stylesheet | 2,706 style rules, including the file's last rule (`.hero-in:has(> .back) > .back ~ *`) and `.leaf-ear::after`. No `.leaf-one .folio` or `.leaf-one .dear` rule is left in `astory.css`. |
| The turned-down corner (§46.6) | Still live: `writer.css:132–133` only recolours it. |
| Other pages | Home, Archive, Family, Book and Account rendered in-app at 1366×768, with no horizontal scroll (scrollWidth 1351, the scrollbar) and no console errors. |
| Out of scope (noted, not counted) | §20 still holds rules for the first writer that nothing renders: `.starters`, `.focusbtn`, `.after-card`, `.after-head`, `.after-next`, `.after-state`, `.wq` and `.wmeta` (`astory.css` around `:715–815`, with overrides at `:1541–1544`, `:1693–1694`, `:1730–1739`). It's the same kind of leftover as `.keeprow`, and worth a separate cleanup pass. `.desk`, `.whero`, `.leaf-one`, `.wtitle` and `.wbody` are still used, so they stay. |

## Before and after (emil's review format)

| Before | After | Why |
| --- | --- | --- |
| `.leaf-left-in { margin-top: 12px }` at ≤900px tall | `8px` | The keep bar ends 4.4px above the window at 1366×768 instead of 0.4px; the step from the running head is still 18px against 8 |
| The `max-height: 740px` block placed before the 900px block and the base rules | Moved after them; the two empty selectors dropped | The short window gets the 6px under the kicker, the 4px gaps and the 2px under the margin heading that the code promises |

## Skill by skill

- **taste-skill:**
  - Gaps: N1 (pass 13, the frame's edge), N2 (pass 5, space).
  - Passes:
    - Every headline is two lines or fewer, including the question at 320 (2 lines).
    - One live thing: Bond wakes and covers his eyes.
    - No horizontal scroll at 320, 390, 768, 1280, 1366, 1920, 2560 or 3840.
    - Beside a long page, the left page carries its question and list down with the words.
    - On the rail, the two columns now pin level.
- **hallmark:**
  - Gate 56 passes at every size: the sticky block is offset by `--top-h` and never sits over the bar.
  - Gate 34: no horizontal scroll.
  - Gate 49: no wrapped labels. At 390 the only multi-line controls are the seal, the help row and the Where to next rows, which are built as two lines.
  - Gate 10: no `transition: all`.
  - Gate 27: reduced motion is covered by `writer.css:505–508` and the global rule.
  - Gate 48: every `var()` the writer uses is defined.
  - Gate 50: `minmax(0, 1fr)` throughout.
  - Gap: N2 is an execution miss (axis C).
- **emil-design-eng:**
  - No gaps. Nothing in the motion changed this round.
  - Passes:
    - Bond's cover arrives in 200ms after 60ms, leaves in 100ms, and sleep returns after 100ms.
    - Press is 0.97 in 120ms.
    - Hovers are gated behind `(hover: hover) and (pointer: fine)`.
    - No ease-in.
    - No animation on W, Esc or Ctrl+Enter.
- **impeccable:**
  - Gaps: N1 (verify every viewport), N2 (cleanup, and fix the cause).
  - Passes:
    - Round 6's obsolete §46.7 styles are gone.
    - Caret, selection and focus are themed.
    - No console errors.
    - No text under 12px at 320.
- **GSAP (react, timeline, performance, scrolltrigger):**
  - No gaps.
  - Passes:
    - The arrival timeline is inside `gsap.matchMedia()` and reverted on unmount (`Write.tsx:694–715`).
    - It moves only `y`, rotation, opacity and clip-path, with `clearProps`. After the timeline ran, `.leaf-left-in` had no inline transform and pinned at exactly 80.
    - No ScrollTrigger; the sticky block is plain CSS.
