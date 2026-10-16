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
| Signed-out pages | Sheen follows the pointer over the bookcloth; glint crosses the foil A-mark on the sheet | `src/components/delight/Light.tsx`, CSS §18b |
| Press the cloth | Blind deboss of the A-mark, fades over 3s | `src/components/delight/ClothStamp.tsx` |
| Sheet arrives | Rises 18px and settles, quote fades in after | CSS §18 `settle`/`rise` |
| Book reader | Leaf turn on the spine with a shadow | `src/components/book/BookSpread.tsx` |
| Archive | Cards and polaroids rise into place, hero settles into focus | `src/components/archive/motion.ts` |
| Family tree | Lines draw in, people rise | `src/components/family/FamilyTree.tsx` |

## 4. Next, in order

1. **Polaroid back.** Hover (tap on phone) turns a polaroid over: caption, date, who added it, on the paper back. Archive, memory page, Write.
2. **Develop.** Uploaded photographs develop from milky white over 1.6s on the Write page.
3. **Ink dot.** Saving fills today's dot on the week strip with an ink bloom; the Book item in the rail turns a page once.
4. **The closed book** on the Book page and the Home aside tilts toward the pointer and its cloth takes the sheen.
5. **Shared-element transition** from a memory card's photograph to the memory page (View Transitions where supported, otherwise a cross-fade).
6. **Loading mark:** the heart of the A draws itself.
7. **Recording bars** from real microphone levels (v1.5, with the browser conversation).
