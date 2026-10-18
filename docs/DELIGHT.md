# Delight: the interactions A Story owns

Founder brief (16 Oct 2026): "fun, interactive is fine, but build around the
concept and people 25 to 45." The test for every idea below: would a
well-made bound book, handled by someone who bought it for their parents,
behave like this? If an effect needs a mascot, a pet, confetti or a joke to
work, it is out.

## 1. What is out there (research, 16 Oct 2026)

Patterns surveyed, with the reference that defines each:

| Pattern | Reference | Verdict for A Story |
| --- | --- | --- |
| Character watches the cursor, covers eyes for the password | Darin Senneff's Yeti login (CodePen, 2017); Filip Vitas's puppy variant | **Out.** A face we never had, and cartoon for this customer. The *idea* (the page responds to what you are doing) stays. |
| Cursor pet that walks to the pointer, leaves paw prints | adryd's oneko.js; Hao Liu's portfolio | **Out.** Same reason. |
| Click leaves a mark that fades | Hao Liu's paw stamp; Lottie "approved" stamps | **In, translated:** the binder's blind deboss of the A-mark pressed into the cloth. |
| Pointer as a light source (satin sheen, glint on metal) | Luxury product viewers; Awwwards "Mouse Interaction" collection (Mirror, Exo Ape) | **In.** Sheen across the bookcloth; a glint across the foil-stamped mark. |
| 3D tilt toward the cursor | Bonnie Xu's 36 patterns; Framer "Polaroid on Scroll" | **In** for physical objects only: the closed book, a polaroid. Never for cards of text. |
| Magnetic buttons | Cuberto's cursor-magnetic demo | **Out.** Buttons should feel printed, not loose. |
| Shared-element page transition | View Transitions API write-ups | **In.** A photograph grows from the card into the memory page. |
| Polaroid "develops" from milky white | Island Pop app; Framer polaroid; Poladroid | **In.** Every uploaded photograph develops. |
| Flip to see the back of a photograph | Physical polaroids (caption written on the back) | **In.** Hover or tap a polaroid: it turns over and the caption is on the back, with the date and who added it. |
| SVG path draws itself | Signature/handwriting components; Bonnie Xu | **In** once: the A-mark's heart draws itself as the loading mark. |
| Ink bloom / fill | Library date stamps, inkwells | **In.** Saving a memory fills that day's dot on the week strip like ink taking to paper. |
| Page turn with weight | GSAP community threads on stiff flips; FlowPaper comparison | **In.** The Book reader turns a leaf (already built by the Book agent), 1.1s, slow in and out, a shadow that fades mid-turn. |
| Real-level waveform while recording | vp0.com recorder guide; kokonutui | **In.** Bars move with the microphone, never on a loop. |
| Count-up numbers | Bonnie Xu | **In, quiet:** pages in your book, memories kept. |
| Confetti, celebrations on every save | Bonnie Xu; every micro-interaction guide warns about it | **Out.** One quiet "Kept." and the dot of ink. |
| Konami codes, hidden games | Digg, YouTube, Wistia easter eggs | **Out.** |
| Error shake | Standard | **In, small:** a 4px shiver on a wrong code, then the field explains. |

Sources: [Yeti login recreation](https://webflow.com/made-in-webflow/website/yeti-login), [puppy login](https://codemyui.com/cute-puppy-login-form-design/), [oneko.js](https://www.cssscript.com/cat-follow-cursor-oneko), [Bonnie Xu's 36 patterns](https://bonniexu.com/animation-playground-index), [Awwwards hovers and cursors](https://www.awwwards.com/awwwards/collections/hovers-cursors-and-cute-interactions/), [Cuberto magnetic demo](https://github.com/Cuberto/cursor-magnetic-demo), [Framer polaroid on scroll](https://www.framer.com/marketplace/components/polaroid-on-scroll), [stan.vision on micro-interactions](https://www.stan.vision/journal/micro-interactions-2025-in-web-design), [enstacked examples](https://enstacked.com/best-micro-interactions-examples/), [recorder waveform guide](https://vp0.com/blogs/audio-waveform-recorder-ui-react-native), [GSAP page-turn threads](https://gsap.com/community/tags/page%20turn/).

## 2. The house rules

1. **Materials move, interfaces don't.** Cloth, paper, foil, photographs and ink may react. Buttons, fields, cards of text and navigation stay still.
2. **The pointer is a lamp, not a hand.** It lights what it passes. It never drags objects around or is chased.
3. **One idea per moment.** A save gets the ink dot and the word "Kept." Nothing else.
4. **Everything respects `prefers-reduced-motion`** and does nothing on touch where there is no pointer. The product is complete without any of it.
5. **No sound.** Ever.
6. **Nothing lateral.** Pages rise and settle; a leaf turns on its spine; nothing slides in from the side.

## 3. What is built and where

| Moment | Effect | File |
| --- | --- | --- |
| Signed-out pages arrive (once per session) | The book lies closed on the cloth, the front board over the right page. The foil title tools itself on (stroke-dashoffset over the lockup's own paths, then the fill), a gold rule draws under it, the cloth breathes once under the lamp; then the board swings open on the spine (3D, 0.9 s, the house movement ease) and lands as the left page, its inside the endpaper; the prints and the dog settle. 2.4 s in all, every entrance on the house ease-out (`CustomEase`), and any press skips to the open book. Remembered in `sessionStorage` (`astory-opened`) so sign in, create account, verify and forgot-password do not replay it. Under reduced motion the book is simply open; on a phone the board is a half-second beat and a fade. | `src/pages/auth/AuthFrame.tsx`, CSS §33 |
| The open book | Two square pages side by side (2:1, max 1440px, the chocolate cloth tile `book/cloth-chocolate.webp` showing either side on a wide display, with the closed keepsake book `book/keepsake-closed.webp` lying on the cloth from 1944px up; the pages grow a little when a longer form needs it; on a phone they stack, title page first). Left: the endpaper, the mark repeated in the cover colour (`markMask.ts`) over a little of the cloth's weave, three prints of one family (`photos/family-02, -01, -08`) held by black-paper photo corners with a Caveat caption under each, and the line "A question a day. Their words. A book that makes itself." in EB Garamond. Right: the title page on the samples' paper with the gutter fold, the mark, "Every life holds a story *worth keeping.*" in Cormorant (two lines at every width), a gold rule, a folio, and the sign-in pasted on as the engraved Ex Libris plate (`book/bookplate.webp` as a nine-slice `border-image`, its blank centre holding the hairline fields and the round chocolate button). Inputs and the button carry their eight states (hover, focus-visible ring in ochre, active 0.97 in 120 ms, disabled, loading, error, success). | `AuthFrame.tsx`, CSS §33 |
| The prints on the endpaper | Drift 2–4 px with the pointer at their own depths (`quickTo`), lift and straighten under the hand; the porch print turns over to a note on its back. Still on touch; only there under reduced motion. | `src/components/delight/Prints.tsx`, CSS §33 |
| The family dog on the bookplate | The founder's watercolour puppy (`public/dog/watch|cover|peek|curious|sleep.png`, five states cut from one sheet, trimmed to the paws). Its chin rests on the plate's top edge, paws over the border (~200px, 170 on a phone). At rest it watches (sign in), looks up curious (create account) or sleeps (verify), by route. The states cross-fade in 220 ms on one bottom-anchored box; two soft paper-coloured highlight dots over the eyes (measured with PIL as the two darkest blobs: watch 48.2%/53.0% and 68.3%/55.7%, curious 46.6%/52.1% and 63.3%/53.7%) follow the pointer, clamped and lagged, so the gaze moves; the head tilts a few degrees toward the field being typed in; paper-coloured lids blink every 4–7 s while awake. Password → it covers its eyes; Show → it peeks; focus leaves → it rests again. Touch and reduced motion: a still dog with one blink, the states still answering the password. | `src/components/delight/Companion.tsx`, `ui.tsx` (`Field.onFocusChange`), CSS §33 |
| Signed-out pages | Sheen follows the pointer over the bookcloth; a pressed leaf drifts after it | `src/components/delight/Light.tsx`, `Leaf.tsx`, CSS §18b |
| Press the cloth | Blind deboss of the A-mark, fades over 3s (the book and its prints are left alone) | `src/components/delight/ClothStamp.tsx` |
| Reading a memory: the strip of small prints | Under the pointer a print turns over on its spine (640 ms) and the back carries the date in Caveat, or "No date yet". Pointer only; no turn under reduced motion. | `src/pages/MemoryPage.tsx` (`Thumb`), CSS §33 |
| Home: the week strip | When a memory has been kept since the strip was last seen this session, today's dot takes the ink: a soft pool spreads over the day and dries into the dot (GSAP, 0.8 s). The count per day is remembered in `sessionStorage` (`astory-ink`) and the dot is keyed on it. Nothing under reduced motion. | `src/components/delight/WeekInk.tsx`, `src/pages/Home.tsx`, CSS §33 |
| A page on its way | The heart of the A draws itself in one stroke (720 ms) and the gold bars inside appear, wherever a page shows an `aria-busy` placeholder: the lazy route fallback and the Shell's busy placeholder. CSS only, so it also draws under reduced motion. | `src/components/delight/LoadingMark.tsx`, `src/App.tsx`, `src/components/Shell.tsx`, CSS §33 |
| Book reader | Leaf turn on the spine with a shadow | `src/components/book/BookSpread.tsx` |
| Archive | Cards and polaroids rise into place, hero settles into focus | `src/components/archive/motion.ts` |
| Family tree | Lines draw in, people rise | `src/components/family/FamilyTree.tsx` |

Notes from building it (16 Oct):

- Caveat is loaded from the Google Fonts link in `index.html` (added for the captions and the print backs).
- The puppy's eye positions were measured with PIL as the two darkest blobs of the face; a stray black sliver in watch.png's top-left corner and its left-edge column were cleared to alpha.
- Craft score for the open-book sign-in (DESIGN.md, the craft rules): philosophy 4 (the page is the object it sells), hierarchy 4 (one headline, one plate, the dog as the only second focus), execution 4 (real materials, measured eyes, eight states; the 3D swing cannot be felt in a hidden pane), specificity 5 (nothing here could be another product's), restraint 3 (the endpaper pattern, the engraved plate and the dog are three ornaments on one screen, kept quiet by colour), variety 4 (the two pages differ in composition and material).
- In development `window.__gsap` is set by the frame (and by WeekInk) so the ritual and the ink can be stepped by hand (`__gsap.ticker.lagSmoothing(0); __gsap.ticker.tick()`), useful in a hidden pane where `requestAnimationFrame` never fires.

## 4. Next, in order

1. **Polaroid back elsewhere.** The same turn for the Archive's polaroids and the Write page's photograph card (the memory page's strip has it).
2. **Develop.** Uploaded photographs develop from milky white over 1.6s on the Write page.
3. **The Book item in the rail** turns a page once when a memory is kept (the ink dot on the week strip is done).
4. **The closed book** on the Book page and the Home aside tilts toward the pointer and its cloth takes the sheen.
5. **Shared-element transition** from a memory card's photograph to the memory page (View Transitions where supported, otherwise a cross-fade).
6. **Recording bars** from real microphone levels (v1.5, with the browser conversation).

## 5. The motion programme across the signed-in pages (16 Oct, agent)

The founder asked for "effects after logged in, on all the pages", naming
Bear Plus, Shiori and Kiyo, and the oneko cursor cat. The answer is one
programme, authored once per page in `lib/arrive.ts`, `Shell` and the
page's own files: each effect belongs to a material (cloth, paper,
photographs, ink, foil) and never to a control. Every tween is GSAP under
`matchMedia("(prefers-reduced-motion: no-preference)")`, cleaned up on
unmount, transform/opacity/clip-path only, nothing over 1.2 s on arrival,
and nothing moves a button, field or nav item while it can be clicked.

| Page | What moves | Why | Where |
| --- | --- | --- | --- |
| Every page | The lamp (sheen) and the pressed leaf drift after the pointer over the cloth | The pointer is a light and a hand brushed over a table; the cloth answers, the bar does not | `delight/Light.tsx`, `delight/Leaf.tsx` (mounted in `Shell`), CSS §35 |
| Every page | The cream pill in the top bar glides to the new place on navigation | The bar is held still across the page change; the glide is what tells you where you went. The links never move | `lib/pillThumb.ts`, CSS §35 |
| Every page | Hero lines rise, the sheet settles, `[data-rise]` in view follows; `[data-rise]` below the fold waits and rises as it enters, batched and staggered, once | One arrival per page, then the paper reveals itself as you read down, never on a loop | `lib/arrive.ts` (`onEnter`, `riseIn`) |
| Every page | Cards you can open lift 2 px and their shadow deepens; `.more` links nudge their arrow | One hover language, from the memory card's existing rule; cards of text stay still | CSS §9, §25, §35 |
| Home | The foil rule under the greeting is stamped left to right after the words | The foil is a material; it is stamped, not faded | `lib/arrive.ts` |
| Home | The opening quote mark of "From the book" inks in after the card | The serif is the person's words; ink takes to paper | `FromTheBook.tsx`, CSS §35 `ink-in` |
| Home | The week strip's dots of ink breathe once as the strip arrives | A glance at what was kept this week; the ink-fill on save (§33) is left alone | CSS §35 `dot-breathe` |
| Archive | The rail's marker glides to the decade in view as you scroll | A bookmark sliding down a timeline, not a jump | `archive/DecadeNav.tsx`, CSS §35 |
| Archive | Year headings ink in as they enter: the words sharpen out of a blur, the rule beside them draws itself | Each year is written as you reach it | `archive/motion.ts` `useInkIn`, CSS §35 |
| Archive | Memory cards below the fold rise as they enter | The paper reveals itself; nothing plays unseen | `archive/motion.ts` `useRiseOnScroll` |
| Archive | The search field's focus ring widens softly | The one field that is used often; a soft ring, not a jump | CSS §35 |
| Book | The closed cover leans toward the pointer, as the book object on the cloth does | A physical object catching the light, never a card of text | `lib/tilt.ts` (`useTilt`), `book/BookSpread.tsx` |
| Book | A newly chosen cover colour sweeps across the board from the swatch's side, under the title and the prints; the swatches stay still | Cloth being rebound, not a cut | `book/BookSpread.tsx` (GSAP clip-path), `book/CoverSwatches.tsx`, CSS §35 |
| Memory | Photographs develop as they come into view, and again when a new one loads into the frame | Every photograph is a print being developed (§20's keyframe) | `lib/arrive.ts` `developPhotographs`, CSS §35 |
| Memory | The Treasured star gives under the press and a few specks of ink fly; the button stays put | One idea per moment, the star is ink | `archive/Treasure.tsx`, CSS §35 |
| Plans, Account, Talk, Person | The arrival only (their cards carry `data-rise`), plus the hover language | Settings and reading pages are quiet | the pages |

Tried and removed: a faint dot of ink trailing the pointer over the paper
(`delight/InkDot.tsx`), the sheet's answer to the lamp on the cloth, in
the founder's oneko spirit. On the paper it read as a speck on the screen,
not as a companion, so it is not mounted; the file stays for a second
look. The pointer companion on the signed-in pages is the lamp and the
leaf on the cloth, nothing on the paper.

Items 2 and 4 of §4 are covered above; the cold load re-runs the
arrival when a page swaps its busy placeholder for its content (`Shell`).

## 6. Atmosphere on the sheet (17 Oct, agent)

The founder found the cream plain while scrolling and named their own journal as the bar. Research and rulings in `docs/research/atmosphere-2026.md`; the build, all on the paper and none on a control:

| Moment | Effect | File |
| --- | --- | --- |
| Every sheet | The running head is held at the top of the page and names the section in view; a foil hairline under it once the page moves | `components/Shell.tsx`, `lib/atmosphere.ts`, CSS §46 |
| Every sheet (1280px and up) | A short ribbon in the cloth's colour hangs from the running head in the outer margin, 72px at the top, 200px at the end | same |
| Every sheet | The ✦ rules draw themselves from the centre as they come up (CSS scroll timelines) | CSS §46 |
| Foot of the Archive (Home placed by the lead) | The open leaf: today's question, "Dear family,", ruled lines, a nib, a pencilled "A few lines is plenty.", "Write it", the sign-off; the dog asleep on its edge wakes at the end of the page | `components/delight/OpenLeaf.tsx`, `public/dog/*-paper.webp` |
| The writer | "Dear family," above the words, a ribbon tail between the leaves that swings once, a turned-down corner, the folio in small caps | `pages/Write.tsx` |

`public/dog/sleep-paper.webp` and `curious-paper.webp` are the watercolour states with the transparent fur inside the outline filled with the plate's paper white, so the cream does not show through as grey patches.
