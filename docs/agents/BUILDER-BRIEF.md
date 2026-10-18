# Builder brief: every creative agent on the A Story web app

You are one of several builder agents redesigning the A Story web app to the founder's standard. Repo: `web-app/` (React 19, Vite, TypeScript, plain CSS; GSAP with ScrollTrigger; Supabase shared with the phone app). Dev server: http://localhost:5180.

## Read before anything else

1. `docs/BAOS-STANDARD.md`, all of it. This is the bar. Rule 1: a fault you find on your pages is a fault everywhere you own.
2. The five design skills under `C:\Users\vngia\.claude\skills\`:
   - **taste-skill**: SKILL.md, plus `references/layout.md`, `type.md` and `critique.md`.
   - **hallmark**: SKILL.md, plus `references/anti-patterns.md`, `slop-test.md`, `interaction-and-states.md` and `responsive.md`.
   - **emil-design-eng**: SKILL.md.
   - **impeccable**: SKILL.md, plus `reference/craft-floor.md`, `layout.md` and `polish.md`.
   - **The GSAP skills**: gsap-scrolltrigger, gsap-timeline, gsap-react and gsap-performance.
   - Check that folder for any other skill that fits your pages.
3. `DESIGN.md`, especially "The craft rules" at the end.
4. The research: `docs/research/journaling-apps-2026.md`, `docs/research/atmosphere-2026.md` and `docs/research/family-tree-2026.md`. Also the audit `docs/audit/AUDIT-2026-10-17.md` when it exists (another agent is writing it now), and `docs/mockups/tree/`.
5. The code of your pages and of `src/components/Shell.tsx`, `src/lib/arrive.ts`, `src/lib/zoom.ts`, `src/lib/scrollShell.ts` and `src/lib/atmosphere.ts`, so you build on what exists.

## How to work

1. **Brainstorm first.** For each page you own, write down two or three distinct layout ideas in a scratch note. Judge them against the standard (screen use, compactness, words and photographs first, motion) and the skills. Pick one and say why.
2. **Build it fully.** Not a sketch: real data, every state (empty, loading, error, success), and every size.
3. **Your files only.**
   - Edit only the files your assignment lists.
   - CSS goes only in your own stylesheet under `src/styles/pages/`, which loads after `astory.css`. Override there with selectors specific enough to win. Do not edit `src/styles/astory.css`.
   - Do not touch `Shell.tsx`, `Home.tsx`, `lib/zoom.ts`, `lib/scrollShell.ts`, `lib/motionWatchdog.ts` or `main.tsx`.
   - If you need a change in a file you don't own, write it in your report and the lead will make it.
4. **The platform rules:**
   - **Large windows.** The page is scaled with `html { zoom }` from `lib/zoom.ts`. Divide every `vh`/`vw` in CSS by `var(--zoom)`. When code turns a pointer position or a measured rectangle into a CSS length, divide by `pageZoom()`. Never size an element in its own `cqw`.
   - **Motion.** GSAP inside `gsap.matchMedia()` with `prefers-reduced-motion`, transform and opacity only, `fromTo` with `clearProps`, cleanup on unmount, house easings. Never leave content hidden until an observer or a frame fires: a watchdog ticks GSAP when frames stop, but IntersectionObserver may never fire in an embedded view.
   - **Interaction.** Every interactive element has hover, focus-visible, active, disabled, loading, error and success states, and a target of at least 44px.
5. **Check in the browser.**
   - Create your OWN tab with `tabs_create` and pass its `tabId` to every call. Close it when you finish.
   - The founder is signed in there: never sign out, never touch `localStorage['astory-app-auth']`, and never create, change or delete real data. The one exception is a test item you name "Agent test" and remove yourself.
   - The pane's frame clock is often frozen. Step it with `window.__gsap.ticker.tick()` and `window.__st && window.__st.update()` before you measure.
   - Check at 1366×768, 1920×1000, 2560×1300 and 390×844, measuring with JavaScript. Take screenshots one call at a time.
   - For signed-out pages, headless Playwright from `../09142026/node_modules/playwright` (chromium-1243) gives true full-size screenshots.
6. **Review yourself before handing back.** Go through the checklist in section 6 of the standard for every page you own and fix what fails. Then run `npm run check`; it must be green. Do not commit.

## What you hand back

- For each page: the options you considered and the one you chose, and why.
- What you changed, file by file.
- Screenshot paths at the four sizes.
- The checklist from section 6, ticked, with any item not met and why.
- Changes you need in files you don't own.

The lead will send your work to two reviewers, **Bao's Standard** and the **Skills Steward**. Expect findings back for another round. Treat their findings as required.
