# Decoration: the family book's ornaments, on the web

Research note and build spec, 17 October 2026. The founder asked for the web app to look "luxury premium as much as possible" and to "add decoration elements to make it more eye appealing", using what the five design skills and their own sites (Shiori, Kiyo, gbaonvo.com, Project Reboot) already know. This file is the answer: what the skills allow and forbid, what the founder's sites and the luxury trade do, and a catalogue of 22 ornaments for A Story with the build for each, then which page gets which, then what never to do.

BAOS-STANDARD.md §15a already points here. Builders read §4 and §5; reviewers check §6.

**The one rule above all the others.** Every ornament has one meaning, and appears only where that meaning is true. The founder's own marketing site arrived at this in Pass 11 ("Decoration had no semantics… Three ornaments, each with one meaning", `landing-page-publish/PASS-11-REPORT.md`), and Shiori's direction says the same in costume terms: "Jewellery-sized accents only" and "Allow one coloured plane per screen" (`Language Learning/SHIORI-DIRECTION.md` §4). A wax seal means treasured. A postmark means it arrived from someone else. A marbled band means the end of the page. If a builder cannot say what an ornament means on that spot, it does not go there.

---

## 1. What the five skills say

### taste-skill (`~/.claude/skills/taste-skill/`)

The skill is the strictest of the five against ornament, and it says so on the label: it is "Not for dashboards or app screens" (SKILL.md, description). Its house rules ban thin rules, gradients, shadows at rest, tracked small caps and the cream-with-terracotta palette. DESIGN.md already records that where these contradict the printed book's language, the brand wins. What A Story should take from it is the argument underneath the bans:

- "Taking the ornaments away is only half the job; a page that has lost its labels, rules and cards and gained nothing in their place reads as thin… The other half is substance: type set larger, whole fields of colour, real pictures of this subject's world (found or drawn)" (SKILL.md, intro). This is the founder's "the cream looks plain" complaint, stated by the skill.
- "Removing ornament leaves space. Never fill it with another ornament. Fill it with scale… with the full content, with a picture made for this subject, or with a field of flat colour" (SKILL.md, House rules). So an ornament may never be a filler for a hole in the layout.
- "If you cannot name what a drawing depicts in the subject's world, it is decoration" (references/imagery.md §8). Every ornament below names a real object of bookbinding or of a family archive.
- "Draw with three levels of detail. Jurors called simple drawings 'basic' every time… big shapes that read at a glance, middle shapes that describe the thing… and small details that reward a second look (the maker's mark…)" (imagery.md §8). The wax seal below has the blob, the brass ring and the debossed A: three levels.
- "A museum engraving enlarged until its line becomes texture, cropped tight and returning at different scales as the page's one motif" and "an engraving… on white paper set with `mix-blend-mode: multiply` on the page's colour field" (imagery.md §3). This is how the pressed botanicals sit on the paper.
- Among the 25 highest-scored sites in the skill's study: "Sarah & Matt Wedding… The site is the invitation: a letterpress-style card opens the page, and its ornaments and small typographic parts become the components for everything after it"; "Zara Webb… presented like a hand-made keepsake: a mascot rabbit, scalloped and flower-shaped cut-outs, candid film photographs"; "The Queue… the queue is the ornament… returns between chapters" (references/research.md §10). Three proofs that ornament drawn from the subject wins juries: A Story's subject is a bound keepsake book.
- What it forbids that still applies here: "Not treatments: colour washes over photographs, duotone overlays, blur, grain overlays, vignettes" on photographs (imagery.md §6). So the paper may have grain, the photographs never do. Also "No glass", "no gradient blobs, no decorative shapes", "no emoji" (SKILL.md, House rules).

### hallmark (`~/.claude/skills/hallmark/`)

- "Better nothing than bad something" (references/hero-enrichment.md, The bar).
- The editorial genre, the one A Story sits in, explicitly allows "Hairline rules, fleurons, drop caps, double rules" and forbids glass: "never; the medium is paper, not glass" (references/genres/editorial.md).
- Texture: "texture you can barely see — paper-quality, not decoration" (hero-enrichment.md E7), and the warning "Grain is a treatment, not a default… Don't double up" (Common mistakes). A Story's sheet already carries a laid texture; §4 D13 replaces it per page rather than stacking a second one.
- Numerals: "The numeral must carry information — issue, year, version, chapter, plate. If you can't name what the number is, drop it" (hero-enrichment.md HP4).
- Slop gate 45: "Decoration must be motivated: … a numeral that names an issue / year / version / chapter… a stamp that names an authorship or date. Random ornaments… are slop" (references/slop-test.md). This is the semantic rule above, in Hallmark's words.
- Quantity: "Don't layer 3+ kit pieces on one page. Restraint. One transparent object in the hero + one wash in a later section is the cap" (references/imagery-kit.md, Anti-patterns). And "Ornaments as inline SVG so they inherit `currentColor`" (Generation pipeline).
- Craft: "Asymmetric `transform: rotate()` for hand-drawn feel… Symmetry reads as algorithmic; controlled asymmetry reads as drawn" and "Opacity layering for pencil/secondary detail… The hierarchy of opacity is the hierarchy of attention" (references/custom-craft.md, Cross-recipe techniques). Recipe 4, the botanical leaf flourish, is the model for the drawn sprig (custom-craft.md §Recipe 4).
- Generated images: "Always post-process… Raw model output reads as AI 100 % of the time" (custom-craft.md, Tier E). Every prompt in §7 ends in a post-processing note.
- Hero discipline: "One polish pattern, max" and "One orchestrated reveal per page" (hero-enrichment.md).

### impeccable (`~/.claude/skills/impeccable/`)

- Bolder means more of the same brand: "Amplify what the system already owns… The bolder version should look more like the same brand, not less" and "If every element got louder, the section got flatter" (reference/bolder.md). The catalogue therefore grows from what the sheet already has (foil, ✦, plates, the ribbon, the dog) before it adds anything new.
- Delight: "Delight is not a layer of generic whimsy; it is product character revealed through a useful interaction" and "Make celebration intensity proportional to frequency and consequence" (reference/delight.md). Treasuring a memory earns a wax seal; opening the Archive earns nothing.
- Colour: "Let the strongest color own a deliberate region or role instead of scattering tiny accents" and "Decoration without a relationship to hierarchy, state, content, or the visual world is not a color strategy" (reference/colorize.md).
- Depth: "shadows carry an offset and a soft blur. A zero-offset colored halo is decoration" (reference/craft-floor.md, Verify). Foil never glows.
- Surfaces nobody draws: "Text selection, the caret, custom scrollbars, focus rings… Theme them from the palette" (craft-floor.md). D20 below.
- Refuse: "Geometric masks standing in for organic contours… reads worse than omitting it" (craft-floor.md). A deckled edge is drawn with noise, not a zigzag polygon.
- Overdrive's two tests apply to every ornament: "The removal test: Take it away. Does the experience feel diminished, or does nobody notice?" and NEVER "Layer multiple competing extraordinary moments. Focus creates impact, excess creates noise" (reference/overdrive.md).
- "Loaded symbols stay out of the decoration" (SKILL.md, How to design). No heraldic crests or coats of arms for families; a monogram is enough.

### emil-design-eng (`~/.claude/skills/emil-design-eng/SKILL.md`)

- The frequency table decides whether an ornament may move: "100+ times/day… No animation. Ever"; "Tens of times/day (hover effects, list navigation): Remove or drastically reduce"; "Rare/first-time… Can add delight" (The Animation Decision Framework). So the seal press and the headband sewing play once; the gilt glint on hover is small and short.
- "Nothing in the real world appears from nothing… Start from `scale(0.9)` or higher, combined with opacity." Seals and stamps arrive from 1.18 down to 1, never from 0.
- "Keep stagger delays short (30-80ms between items)."
- "Reduced motion means fewer and gentler animations, not zero. Keep opacity and color transitions that aid comprehension."
- "Unseen details compound": the case for the rib texture on a ribbon and the rim on a seal.

### GSAP skills (`~/.claude/skills/gsap-*`)

- `gsap.matchMedia()` with a `reduceMotion` condition, and `mm.revert()` on unmount (gsap-core, Accessibility and responsive). Every GSAP ornament below lives inside `mm.add({ ok: "(prefers-reduced-motion: no-preference)" }, …)`.
- DrawSVG for strokes that draw themselves ("Only affects stroke (not fill)… Prefer single-segment `<path>`", gsap-plugins §DrawSVG): corner flourishes and the versal's frame.
- "Animating transform… and opacity keeps work on the compositor"; `will-change` "only on elements that animate" (gsap-performance).
- House easings, as GSAP eases: register once with CustomEase, `CustomEase.create("house-out", "0.23,1,0.32,1")` and `CustomEase.create("house-move", "0.77,0,0.175,1")` (gsap-plugins §CustomEase). CSS uses `var(--ease-out)` and `var(--ease-in-out)` (astory.css line 95).

### Where the skills and the brand disagree

| Skill rule | A Story | Why |
| --- | --- | --- |
| taste: no thin rules, no tracked small caps, no cream with terracotta | Kept | They are the printed book's language (astoryapp.com/samples) and the founder's namecard; DESIGN.md already rules the brand wins |
| taste: no shadows at rest | Kept, with one exception: things that are physically raised (wax, a tipped-in plate, a book object) carry a 1px contact shadow | A seal with no shadow reads as a sticker |
| taste: no gradients | Kept for fills. Allowed: hard-stop repeating gradients used as patterns (paper laid lines, headband beads), gradients used only inside a `mask`, and the light on the cloth (D14), which is light, not paint, and stays under 12% | The lamp (§18b) set this precedent |
| taste: no grain overlays | Kept for photographs. The paper has grain because it is paper | Library rule: photographs are never filtered |

---

## 2. What the founder's own sites do

Screenshots: `docs/research/founder-sites/`. Source read, not edited.

### Project Reboot (journal.gbaonvo.com; `Project Reboot/src/styles.css`, `DESIGN.md`)

The richest of the four, and the closest to what A Story wants.

- **The journal as a luxury book**: "an oxblood leather cover with gold stitching, a cream spread with a soft spine, gilded page edges and a silk ribbon" (styles.css l.1339). The stitching is a `1.5px dashed` foil rule inset 6px on the leather.
- **Gilded page edges** built from stacked one-pixel shadows: `0 1px 0 #f1e8d4, 0 2px 0 #e6dac0, 0 3px 0 #dacbab, 0 4px 0 var(--foil), 0 5px 0 #8a6a33` (l.1342). Three paper edges then the gilt. D2 borrows it.
- **Printed page furniture**: frames with foil corner ornaments, running heads in small caps with a ✦, page numbers between em dashes, fine ruling on the writing area, an epigraph with a large foil open-quote, a blind-embossed watermark of the logo at 5.5% (l.1415–1432).
- **Wax seals**: "Completed squares get a ribbon-red wax seal with a honey ring, pressed on at an angle" (l.398): red disc, `outline: 1.5px solid var(--metal); outline-offset: -6px`, `rotate(12deg)`, an `inset 0 -3px 0` shadow for the raised rim, arriving with `scale(1.25)→1` in 280ms; a small wiggle on hover. Also seals on labelled Journey moments and on envelopes.
- **Postmarks** for streaks: a dashed outer circle, a solid inner one, the number in the serif, rotated -8° (l.674).
- **Ink stamps** and "paper confetti" for wins (l.1090).
- **A fountain-pen curve ending in a nib** on the Journey chart; tools as cursors (a pen over the journal page, a pencil over the line).
- **Characters**: the founder's 3D likeness in page heroes in four moods, a chibi for small moments, two dogs (shiba and samoyed) walking along the foot of the page, paw prints. Watercolour landscape scenes as hero plates.
- **The ribbon** sways forever (`ribbon-sway 6s infinite`). A Story should not copy the loop: a ribbon swings once.
- Restraint devices: "The Restrained Accent Rule. Use maize for small markers" (DESIGN.md l.170); "Flat by default: tonal surfaces, thin rules"; "Don't replace the ruled workspace with a grid of decorative statistic cards".

### Shiori (Japanese) and Kiyo (Chinese)

- Serif headlines (Cormorant), a short coloured rule under the page title, 13–14px grey sentence-case metadata, hairline tabs with a coloured underline, arrows instead of chevrons.
- **The character in an arch**: Violetto and Sayo stand inside a thin gold-hairline arch on a navy panel (shiori-today, kiyo-today). Kiyo's mascot leans on the wordmark; Shiori's writes it with a fountain pen (`shiori-signature-concept-v2/shiori-signature.png`).
- **Letters and wax**: Violetto holds an envelope sealed with red wax; the letterbox shows "FROM YUI" letters with a paper crane.
- **A few falling petals** near the headline on Shiori's Today (three small marks, nothing more).
- **The manuscript grid** (genkō-yōshi / 米字格) as the frame for the lesson glyph: the subject's own paper as ornament.
- The costume rule: "Navy coat = header… Ivory blouse = reading paper only. Jewellery-sized accents only: red ribbon (wax seals, errors), emerald brooch (correct answers), gold hair and brass (fine rules, postmark numerals)" and "Allow one coloured plane per screen" (SHIORI-DIRECTION.md §4).

### The personal website (`Personal Website/Final Ver/`)

- The GB monogram, woven and hand-drawn, with a brass period; the closing band traces it with a drawn stroke (DESIGN.md l.120, "The identity moves in one place only").
- "Section grounds that alternate cream and stone, with navy cloth bands; framed content on mounted plates" (DESIGN.md l.91).
- "Portraits use restrained cream mats and fine navy/brass edges… personal images have quieter print frames" (CREATIVE_DIRECTION.md l.23).
- A tactile Book: "cloth-cover opening, two-sided leaves, spine, paper edges, moving shadows" (l.19). "The mark itself is flat and solid… (the Book cover's gilt foil is the one material exception)" (DESIGN.md l.118).
- The A Story page on gbaonvo.com: a namecard-like plate with a quote in serif italic and a short gold rule.

### The A Story marketing site and the printed book

- Three ornaments with one meaning each: "the ivory mat (a physical print — archival photographs only; contemporary ones are bare), the gold keyline plate (a sentence the family should treat as precious — used once per page), and the rising cream edge" (PASS-11-REPORT.md). The archival-only rule for the mat is the model for D7.
- astoryapp.com/samples: square pages; endpapers in the cover colour with the mark repeated at 7.5% and a linen layer; a colophon; chapter openers with a giant italic numeral in the cover-print colour (`.opener .num`, 30cqw); a drop cap in the cover-print colour; the lesson box in the cover colour with a leaf mark at 12%; a sage chapter pill; the summary box; the QR strip.
- The Ex Libris plate (`public/book/bookplate.webp`): sepia engraved double border, acanthus corners with a small flower, a heart cartouche at the top, "THIS BOOK BELONGS TO".
- The watercolour samoyed puppy (`public/dog/source.png`): soft cream fur, sepia line, chin on a ledge, five states (watch, cover, peek, curious, sleep).

### What is already on the web app (do not rebuild, upgrade)

Laid paper turbulence and a faint vignette; a foil hairline frame with small foil corners; the mark as a 3% watermark; plates with an inner foil rule; ✦ rules that draw themselves (scroll timelines); the running head and folio; a chocolate ribbon in the margin; the open leaf with "Dear family," a nib, a pencilled note and the sleeping dog; the turned-down corner; the writer's leaf with board, foil corners and ribbon tail; the seal button; the "Kept" ink stamp; the Treasured star with ink specks; the lamp and the pressed leaf on the cloth; the blind deboss on press; the open-book sign-in with photo corners, the endpaper and the bookplate. (astory.css §18b, §33, §35, §39, §46; docs/DELIGHT.md.)

Seen live on 17 Oct at 1280×800 in a hidden pane: Home, Archive, Book, Plans and the writer render as described. The Family page once rendered half-styled (the name as an underlined link, a large ochre arch shape low on the page); not confirmed in a visible window, so it is flagged here, not diagnosed.

---

## 3. What luxury houses and the book arts do

### The houses

| House | What signals luxury | What A Story takes |
| --- | --- | --- |
| **Hermès** | The 2026 site is hand-illustrated throughout by Linda Merad: drawings sit in the navigation, the transitions and the editorial moments, each category drawn with its products, with visible imperfection and texture, against the "interchangeable" look of luxury e-commerce ([Fast Company](https://fastcompany.com/91471305/hermes-hand-illustrated-website-is-the-u), [nss magazine](https://www.nssmag.com/en/fashion/46500/hermes-artist-website-illustration-ai), [Big Wall Decor](https://bigwalldecor.com/blogs/blog/hermes-hand-drawn-website-age-of-ai)) | Hand-made marks with imperfection beat perfect vectors: the seal's uneven rim, the deckle, the pencilled note. Drawings are woven into places of use, not scattered |
| **Aesop** | Restraint: a warm paper ground, small type, square corners, "no shadow, no gradient, no saturated accent"; warmth from the paper and the photographs ([Font Alternatives](https://fontalternatives.com/inspiration/aesop-suisse/), [shadcn design notes](https://www.shadcn.io/design/aesop)) | The paper itself is the luxury; ornament is rare and small |
| **Smythson** | Gilt-edged pale-blue featherweight paper; grained leather; gold-foil initials blocked in a fixed corner ([Harrods](https://www.harrods.com/en-ca/p/smythson-leather-soho-notebook-000000000007813013), [Selfridges](https://www.selfridges.com/NL/en/cat/smythson-swings-and-roundabouts-chelsea-grained-leather-notebook_R03853056/)) | Gilt edges on the few precious objects; the personal initial in foil in one corner (D17) |
| **Assouline** | Linen covers with embossed lettering, heavyweight paper, silk bindings in linen clamshells ([Clic](https://clic.com/blogs/news/assouline-the-art-of-luxury-publishing-at-clic)) | Blind embossing on the cloth (D6); cloth as the brand's material |
| **Penguin Clothbound Classics** | Coralie Bickford-Smith's repeating motif from each story, foil-stamped onto tactile cloth, "to hark back to the world of Victorian bindings"; coloured endpapers; a ribbon in every volume ([Penguin](https://www.penguin.co.uk/discover/articles/clothbound-classics-little-history-making-of), [beautifulbooks.info](https://beautifulbooks.info/penguin-clothbound-classics)) | A motif from the subject's own world, repeated in foil (the mark, the leaf, the ✦); a ribbon as standard |
| **Folio Society** | Foil blocking on cloth and leather, hand-marbled endpapers, grosgrain ribbon markers, slipcases ([LibraryThing forum](https://www.librarything.es/topic/330009), [John Atkinson Books](https://johnatkinsonbooks.co.uk/?p=116162)) | Marbled endpapers as the "inside" colour; grosgrain rib on the ribbon |
| **Diptyque** | The oval label as a paper shield carrying every name; black-and-white stippled drawings commissioned per scent, on the back of the label ([Diptyque](https://customerserviceeurope.diptyqueparis.com/hc/en-be/articles/4404564701847-Where-does-the-oval-on-your-labels-come-from), [Space NK](https://www.spacenk.com/us/inside-space/in-focus/the-story-behind-diptyque-fragrances.html)) | One container shape that always carries the name (the monogram seal for people); engraved, monochrome illustration |
| **Cartier** | The site reads nearly monochrome; the house red is declared but used in one fill; the red box is the physical icon; motion is saved for campaign microsites ([shadcn design notes](https://www.shadcn.io/design/cartier/raw), [Immersive Garden](https://immersive-g.com/projects/cartier-end-of-year-23)) | One signature object (the book) carries the colour; the interface stays quiet |
| **Le Labo** | A personal label typed with your name, the date and the city of the store ([madegooddesigns](https://madegooddesigns.com/le-labo-brand-guidelines/)) | The dateline as ornament: the Kept stamp carries the date; the postmark carries date and place |
| **Ralph Lauren Home**, **The Row** | Monochrome, image-led storytelling; "less is more", no ostentation ([DesignRush](https://www.designrush.com/best-designs/websites/ralph-lauren)) | Big warm photographs do the work; ornament never competes with a family photograph |

(Sources for Smythson, Assouline, The Row and Ralph Lauren describe products and brand, not their websites; nothing found describes those sites in detail. The table says only what the sources support.)

### The book arts: devices, and what they mean

- **Headband (endband)**: a band sewn to the head and tail of the spine; once structural, now usually "made of colored silk sewn to the book" ([Wikipedia: Endband](https://en.wikipedia.org/wiki/Endband), [CoOL](https://cool.culturalheritage.org/don/dt/dt1721.html)). Meaning: the top of a bound block of pages.
- **Gilt edges**: gold leaf on the trimmed page edges over a red bole ground, burnished; decorative and protective against dust, from Italy around 1470; gauffered (tooled) and gilt-marbled variants ([RIT Cary Collection](https://cary-exhibits.rit.edu/exhibits/show/edgesofbooks/gilt-edges), [CoOL](https://cool.culturalheritage.org/don/dt/dt1528.html)). Meaning: a book worth protecting.
- **Deckle edge**: the feathered edge of handmade paper, once trimmed away, then prized by collectors from the 17th century; now imitated by machine ([Wikipedia: Deckle edge](https://en.wikipedia.org/wiki/Deckle_edge), [Book Riot](https://bookriot.com/history-of-deckle-edges/)). Mid-century snapshot prints were also cut with a scalloped "deckle" edge by the photo lab, which is why the scallop reads as "an old family photograph".
- **Marbling (ebru)**: colours floated on size, combed, lifted onto paper; the classic endpaper. Real structure (combed veins, drops) is not reachable with SVG turbulence; it needs a canvas simulation or a real marbled image ([Lu and Jaffer via Marblizer](https://www.cs.umb.edu/~abakbal/ebru.htm), [Codrops on SVG filters](https://tympanus.net/codrops/2019/03/12/image-distortion-effects-with-svg-filters)). So D1 uses a generated image, not a filter.
- **Illuminated initials**: rubrication (initials in red), illumination (gold or silver leaf), historiated initials that carry a scene ([University of Nottingham](https://www.nottingham.ac.uk/manuscriptsandspecialcollections/researchguidance/medievalbooks/decorationandillumination.aspx)). On the web, `initial-letter` sizes and sinks the letter (Safari, Chrome 110+, Firefox pending), with `@supports` and a float fallback ([Chrome for Developers](https://developer.chrome.com/blog/control-your-drop-caps-with-css-initial-letter)).
- **Letterpress and blind embossing**: a pressed-in letter is darker inside with a thin shadow on the top inner edge and a highlight on the bottom one; text-shadow recipes need the text colour, the ground and the shadows tuned together ([Smashing Magazine](https://www.smashingmagazine.com/2012/07/20/letterpress-effect-fireworks-css/), [SitePoint](https://www.sitepoint.com/using-css-text-shadow-to-create-embossed-text)).
- **Wax seals, ex libris plates, photo corners, tissue guards over plates, ribbon markers, pressed flowers between pages**: the family-archive objects that the bench already owns.

### What their websites do digitally, in short

1. **Restraint at rest, material on approach.** Quiet type and paper; the material answers when you come near (Hermès' drawings on hover and in transitions, Cartier's motion saved for campaigns).
2. **Scale.** One big photograph or object per screen; small type around it.
3. **Material surfaces you can barely see**: paper tone, linen, a faint grain; never a visible texture fighting the words.
4. **Hand-made imperfection** as the anti-AI signal (Hermès 2026).
5. **Slow, deliberate motion** at long durations with gentle ease-outs, played once.
6. **One signature object** carrying the brand's colour and craft (the red box, the orange box, the oval label). For A Story it is the clothbound book.

---

## 4. The A Story decoration system

### 4.0 Tokens to add (CSS §55, one place, then reused)

```css
:root {
  --foil-deep: #8A6A33;          /* the burnished underside of gilt; page-edge stacks */
  --foil-light: #EFDCAB;         /* the glint that travels along gilt under the light */
  --wax: #9A4220;                /* = --accent-deep, named for its job */
  --wax-light: #B85126;          /* = --accent */
  --wax-shade: #6E2E16;
  --ink-stamp: #B85126;          /* rubber-stamp ink: terracotta */
  --headband-a: var(--foil);     /* silk bead colours; teal pages override b to #F3EBDD */
  --headband-b: #B85126;
  --headband-core: #3B291D;
  --edge-stack: 0 1px 0 #F7F0E2, 0 2px 0 #EADFCB, 0 3px 0 #DDCFB4, 0 4px 0 var(--foil), 0 5px 0 var(--foil-deep);
  --contact: 0 1px 1px rgba(42, 35, 32, 0.28);   /* raised wax and tipped-in plates only */
  --marble: url("/deco/marble-chocolate.webp");  /* D1; the Book page swaps to marble-teal */
}
```

Sizes below are at 1440px. Anything sized with `vw`/`vh` divides by `var(--zoom, 1)` (BAOS §12). Assets live in `public/deco/`. Every ornament is `aria-hidden="true"` and `pointer-events: none` unless it is a control.

### 4.1 The budget (how a page stays rich and never busy)

Each ornament has a class:

- **M, material**: the paper, the cloth, the light. Always present, one kind each, never counted.
- **H, hero ornament**: a large, single statement (marbled band, bookplate, illuminated initial, pressed botanical, the debossed mark). **At most one H in any viewport.**
- **J, jewellery**: small foil pieces (✦, numerals, corner flourishes, gilt glint, headband). **At most two J in a viewport**, not counting the frame's own corners.
- **S, state mark**: seal, stamp, postmark, ribbon marker. Only where the state is true. **At most three visible at once**; beyond that the list shows the 14px glyph version.
- **C, companion**: the puppy. **Once per page**, at an edge, never on a reading page.

Check: scroll any page at 1366×768 and 1920×1000; at no stop may you count two H or three J. Reviewers fail the page if you can.

### 4.2 The catalogue

#### D1. Marbled endpaper band (H) · new · asset

**What and where.** The inside of a cover is its endpaper; reaching it means the book has ended. Every signed-in sheet ends on a band of marbled endpaper: 36px tall (24px on phones), full width inside the frame inset, at the very foot of the sheet, a 1px `--foil` rule above it, the folio sitting just above that rule. Chocolate colourway on all pages; teal colourway on the Book page. Also once on the front door (`/welcome`), above its footer, at 56px.

**Build.**
```css
.sheet-page { padding-bottom: calc(var(--existing-bottom) + 36px); }
.sheet-page > .endpaper { position: absolute; left: calc(var(--frame-inset) + 1px); right: calc(var(--frame-inset) + 1px); bottom: 0;
  height: 36px; background: var(--chocolate) var(--marble) 0 50% / 640px auto repeat-x; border-top: 1px solid var(--foil); }
.shell:has(.cloth.teal) .sheet-page > .endpaper { --marble: url("/deco/marble-teal.webp"); background-color: var(--teal); }
.folio-sheet { bottom: 58px; }
@media (max-width: 760px) { .sheet-page > .endpaper { height: 24px; background-size: 420px auto; } }
```
The band is outside the vignette and the watermark (`z-index: 0`, the frame's `::before` stays above it). Asset: P1 in §7, 2048×512 seamless horizontally, WebP ≤120 KB per colourway. Not shown in writing focus.

**Motion.** A slow drift of the marbling with the scroll, as if the light moved across it: `animation: marble-drift linear both; animation-timeline: scroll(root); @keyframes marble-drift { to { background-position-x: -120px; } }` inside `@supports (animation-timeline: scroll())` and `prefers-reduced-motion: no-preference`. (Background-position is a paint property; the band is 36px tall, so it is cheap; if a profile shows jank, drop the drift.) Reduced motion: still.

**Restraint.** One per page, only at the foot, never behind words, never inside a card, never in the book reader (the printed endpaper is the samples' mark pattern and stays so).

#### D2. Gilt edges (J) · new

Two forms, one meaning: *this object is precious*.

**a. Gilt-edged plate** (Smythson's gilt-edged card). A memory card marked Treasured, the current plan card on Plans, the "Your book" plate on Home, the bookplate on Account.
```css
.gilt { border: 1.5px solid var(--foil); }           /* replaces the plate's 1px --sheet-rule border */
.gilt::before { border-color: var(--foil-soft); }   /* the plate's inner foil rule stays */
.gilt > .glint { position: absolute; inset: -1.5px; border-radius: inherit; padding: 1.5px; overflow: hidden; pointer-events: none;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; }
.gilt > .glint::before { content: ""; position: absolute; top: -20%; bottom: -20%; left: 0; width: 28%; background: var(--foil-light);
  -webkit-mask: linear-gradient(90deg, transparent, #000 45% 55%, transparent); mask: linear-gradient(90deg, transparent, #000 45% 55%, transparent);
  transform: translateX(-140%) skewX(-18deg); }
@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .gilt > .glint::before { transition: transform 900ms var(--ease-in-out); }
  .gilt:hover > .glint::before { transform: translateX(460%) skewX(-18deg); }
}
```
The glint is light catching the gold as the hand passes: once per hover, 900ms, flat colour shaped by a mask (no visible gradient fill). Builders add `<i class="glint" aria-hidden="true"></i>` inside the card.

**b. Gilt page-block** (Project Reboot's stacked edges). Only on objects that are books: the keepsake book thumbnail on Home and the Archive, the writer's leaf, the open leaf, the right-hand page of the sign-in book. `box-shadow: var(--edge-stack);` on the page element (replace, do not add to, the open leaf's existing two-step stack). The edges sit on the bottom and the fore-edge: for the fore-edge use `1px 0 0 …, 2px 0 0 …` with the same five colours.

**Restraint.** Gilt is earned: Treasured, the plan you are on, a book. Never on an ordinary card, button or field. At most two gilt objects in a viewport; in a grid of Treasured memories the third and later show the seal only.

#### D3. Headband at the sheet's top (J) · new

**What and where.** The sheet that rises over the cloth is the book block; its head carries a silk headband where it meets the cloth. A 5px band of slanted silk beads along the sheet's top edge, inset 24px from each side so it clears the 22px corner radius, sitting half over the seam (top: -2px). Every signed-in page. Also the sign-in book, at the head of its gutter (the true place of a headband), 64px long.

**Build.**
```css
.sheet-page > .headband { position: absolute; left: 24px; right: 24px; top: -2px; height: 5px; z-index: 2; pointer-events: none; border-radius: 2px;
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'><rect width='8' height='5' fill='%233B291D'/><rect x='1.1' y='.4' width='2.6' height='4.2' rx='1.3' transform='skewX(-16)' fill='%23C9A15A'/><rect x='5.1' y='.4' width='2.6' height='4.2' rx='1.3' transform='skewX(-16)' fill='%23B85126'/></svg>") 0 0 / 8px 5px repeat-x;
  box-shadow: 0 1px 0 rgba(42, 35, 32, 0.25); }
.shell:has(.cloth.teal) .sheet-page > .headband { /* swap the second bead to cream: a second data URI with fill='%23F3EBDD' */ }
```
Two colours, foil and terracotta, as on a classic hand-sewn band; foil and cream on the teal Book.

**Motion.** It is sewn on as the sheet settles: `clip-path: inset(0 100% 0 0)` to `inset(0 0 0 0)`, 700ms, `--ease-out`, starting 200ms after the sheet's arrival (lib/arrive.ts timeline, GSAP `house-out`). Once per route. Reduced motion: shown, no wipe.

**Restraint.** One per sheet. Not on cards, leaves or dialogs. Hidden in writing focus.

#### D4. Wax seal for "Treasured" (S) · upgrade of the star

**What and where.** Treasured is the family saying "this one matters". It is a wax seal pressed onto the memory: 34px on a memory card (top-right, overlapping the print's corner by a third), 56px beside the title on the memory page, 20px in list rows, 14px as a glyph in dense lists. The Treasure control on the memory page stays a button (it may keep the star icon inside the button); the seal is how the state shows everywhere else.

**Build** (inline SVG component `<WaxSeal size />`, 64×64 viewBox, three levels of detail):
```svg
<svg viewBox="0 0 64 64" aria-hidden="true" class="seal">
  <path class="wax" d="M58.8 27.3 Q61.3 32.0 59.3 36.8 Q59.8 42.1 56.0 45.8 Q55.5 51.7 49.4 52.7 Q46.6 57.4 41.2 57.2 Q37.1 61.0 32.0 59.5 Q26.8 61.2 22.8 57.3 Q17.8 56.6 14.6 52.7 Q9.5 50.9 8.5 45.6 Q4.0 42.2 5.6 36.7 Q1.7 32.0 5.0 27.2 Q5.5 22.4 8.3 18.3 Q9.9 13.5 14.0 10.6 Q17.9 7.6 22.6 6.1 Q26.7 2.1 32.0 4.3 Q37.2 2.5 41.4 6.2 Q46.0 7.7 49.8 10.8 Q55.6 12.2 55.8 18.3 Q60.9 21.5 58.8 27.3Z"/>
  <circle class="rim" cx="32" cy="32" r="21.5"/>
  <circle class="ring" cx="32" cy="32" r="19"/>
  <g class="mark" transform="translate(19.5 19) scale(0.05)"><!-- the A-mark paths from --sheet-mark --></g>
</svg>
```
```css
.seal { filter: drop-shadow(var(--contact)); transform: rotate(-8deg); }
.seal .wax { fill: var(--wax); }
.seal .rim { fill: var(--wax-light); opacity: 0.35; }                 /* the raised pool where the stamp pressed */
.seal .ring { fill: none; stroke: var(--brass); stroke-width: 1.2; }  /* Reboot's honey ring */
.seal .mark { fill: var(--wax-shade); }                                /* the A, pressed into the wax */
```
At 20px and below drop the rim and the ring (only the wax and the A).

**Motion.** Pressed when someone treasures: `scale(1.18) rotate(-14deg), opacity 0` to `scale(1) rotate(-8deg), opacity 1`, 280ms, `house-out`, then nothing. The existing ink specks from the Treasure button stay. Hover on a card: no motion (seen tens of times a day). Reduced motion: 150ms fade.

**Restraint.** Only on memories rated 5 (`lib/treasured.ts`). Three visible at most (§4.1); never decorative, never on people or plans.

#### D5. Ink stamp for "Kept" (S) · upgrade

**What and where.** A rubber stamp means *newly kept*, with the date, like Le Labo's label. It replaces the "Kept today" pill on the newest memory card for 24 hours (on Home and the Archive), and is the stamp that lands after Keep on the writer (existing `lib/stamp`, restyled). 76×30px on a card, top-left over the plate's edge, rotated -6°.

**Build.** A double-ruled rectangle in `--ink-stamp`, "KEPT · 17 OCT" in Montserrat 700 11px tracked 0.16em, mottled so it reads as ink and not as a label:
```css
.kept { border: 1.5px solid var(--ink-stamp); outline: 0.75px solid var(--ink-stamp); outline-offset: 2px; border-radius: 3px; color: var(--ink-stamp); opacity: 0.86;
  transform: rotate(-6deg);
  -webkit-mask: var(--ink-mottle) 0 0 / 120px 60px; mask: var(--ink-mottle) 0 0 / 120px 60px; }
:root { --ink-mottle: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='60'><filter id='m' color-interpolation-filters='sRGB'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' seed='7'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2.4 1.75'/></filter><rect width='100%' height='100%' filter='url(%23m)'/></svg>"); }
```
Tune the last matrix row until roughly one pixel in seven drops out: worn ink, not a broken label. Text stays legible (it is 11px uppercase, the book's small caps; contrast of terracotta on the plate is 4.9:1 before the mottle).

**Motion.** Lands once: `scale(1.25)→1`, `opacity 0→0.86`, 180ms, `house-out`. On the writer it follows the seal press (the seal is the act, the stamp is the result, DESIGN.md "One idea per moment" holds: one stamp, the word Kept). Reduced: fade.

**Restraint.** Only the memory kept in the last 24 hours; one on a screen.

#### D6. Blind deboss and tooled frame on the cloth (H for the mark, M for the frame) · new

**What and where.** The cloth is a book cover. Covers are blind-stamped. Two pieces on every cloth hero (full and compact):
- A **tooled double fillet**: two hairlines inset 12px and 16px from the cloth edges (the bottom edge is hidden under the sheet), pressed in, not printed.
- On full heroes only, the **A-mark blind-debossed** at 260px, set into the bottom-right of the cloth and cropped by the sheet's rising edge, so only its upper two-thirds shows.

**Build.**
```css
.cloth::after { content: ""; position: absolute; inset: 12px 12px auto 12px; height: calc(100% - 12px); pointer-events: none; border-radius: 10px;
  box-shadow: inset 0 1px 0 rgba(0,0,0,.30), inset 0 -1px 0 rgba(255,236,200,.07),   /* outer fillet: shadow on the top inner edge, light on the bottom */
              0 0 0 4px transparent, inset 0 0 0 4px transparent; }
.cloth .tool-2 { position: absolute; inset: 16px 16px auto 16px; height: calc(100% - 16px); border-radius: 7px; pointer-events: none;
  box-shadow: inset 0 1px 0 rgba(0,0,0,.22), inset 0 -1px 0 rgba(255,236,200,.05); }
.cloth .deboss { position: absolute; right: 6%; bottom: -90px; width: 260px; height: 286px; pointer-events: none;
  filter: drop-shadow(0 1px 0 rgba(255,236,200,.10)) drop-shadow(0 -1px 0 rgba(0,0,0,.30)); }
.cloth .deboss i { position: absolute; inset: 0; background: rgba(0,0,0,.16);
  -webkit-mask: var(--sheet-mark) center / contain no-repeat; mask: var(--sheet-mark) center / contain no-repeat; }
```
The filter sits on the parent so the two drop-shadows apply to the masked mark (the existing ClothStamp uses the same principle). On the teal Book cloth the same values work. Phones: the mark at 150px, the fillets at 8 and 11px.

**Motion.** None of its own. The lamp (§18b) already passes over the cloth with `soft-light`, so the pressed mark and the fillets catch it: that is the reward for moving the pointer. Reduced motion: unchanged.

**Restraint.** One mark per cloth. Never on the sheet (the sheet has its own 3% watermark). Never inked: blind only, so it never competes with the cream headline.

#### D7. Print edges: scalloped, deckled, bare (M for the set) · new

**What and where.** The library rule says the interface controls "crop, border, rotation, shadow, caption" and never filters a photograph (`AStory_Master_Visual_Library_UIUX_LOCKED/00_START_HERE`). So the edge belongs to the white print border, never to the picture. The era decides the edge, following the marketing site's "archival only" mat rule:
- **Before 1975**: the white border is **scalloped** (the lab's deckle cut of mid-century snapshots).
- **1975 to 1999**: a plain white border (the existing `.print`).
- **2000 and later**: bare, no border.
- **No date yet**: plain white border.

**Build** (scallop, after Temani Afif's mask; the photograph sits inside the padding and is untouched):
```css
.print[data-era="archival"] { --r: 2.5px; padding: 8px 8px 10px;
  -webkit-mask: radial-gradient(var(--r), #000 98%, #0000) round 0 0 / calc(2 * var(--r)) calc(2 * var(--r)),
                linear-gradient(#000 0 0) 50% / calc(100% - 2 * var(--r)) calc(100% - 2 * var(--r)) no-repeat;
          mask: radial-gradient(var(--r), #000 98%, #0000) round 0 0 / calc(2 * var(--r)) calc(2 * var(--r)),
                linear-gradient(#000 0 0) 50% / calc(100% - 2 * var(--r)) calc(100% - 2 * var(--r)) no-repeat; }
.print[data-era="archival"].large { --r: 4px; padding: 14px 14px 18px; }
```
The mask clips the print's own `box-shadow`, so move the shadow to a wrapper (`filter: drop-shadow(0 1px 2px rgba(42,35,32,.14)) drop-shadow(0 10px 20px rgba(42,35,32,.12))` on `.print-wrap`).

**Deckle for paper, not prints.** The leaves (the open leaf, the writer's leaf) get a soft deckle on their fore-edge only: an SVG filter applied to a background layer, so the words are never displaced. Mount once in Shell: `<svg width="0" height="0" aria-hidden="true"><filter id="deckle"><feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="5" xChannelSelector="R" yChannelSelector="G"/></filter></svg>`, then `.ol-page::after { content:""; position:absolute; top:0; bottom:0; right:-2px; width:10px; background: var(--paper-print); filter: url(#deckle); }` (the noise roughens the strip's edge against the sheet).

**Motion.** None. **Restraint.** One edge per print, decided by date, never chosen for looks; never on portraits of people (D17) or on interface screenshots.

#### D8. Photo corners (S: "mounted in the album") · extend

**What and where.** A print is either loose (on Home and in the Archive: tilted, with a shadow, edges per D7) or mounted (on the memory page and the person page: straight, flat, held by four corners, no tilt). Corners say "this photograph has been put in the family album". The memory page's lead photograph; the person page's album strip. The sign-in endpaper already has them.

**Build.** `<PhotoCorners />` renders four 22px SVGs in `--chocolate-deep` black-paper, covering 11px of the print:
```svg
<svg viewBox="0 0 22 22"><path d="M0 0H22L0 22Z" fill="#3B291D"/><path d="M22 0L0 22" stroke="rgba(255,255,255,.14)" stroke-width="1"/></svg>
```
Rotate per corner. Contact shadow `var(--contact)` on each corner only (they are paper on paper).

**Motion.** After the photograph develops (existing §35 develop), the corners slide in 4px along their diagonals with opacity, 360ms, `house-out`, staggered 40ms. Reduced: present from the start.

**Restraint.** Mounted prints never tilt and never get scallops (they are modern albums: plain border). One mounted lead photograph per screen.

#### D9. Foil-stamped ornaments and chapter numerals (J) · extend

**What and where.**
- **The ornament set**, three foil fleurons drawn as inline SVG (`currentColor`, `--foil`): the ✦ (existing), the **leaf** from the samples (`--leaf` mask), and the **heart** of the A-mark. The ✦ separates sections; the leaf closes a person's words (end of a quote, end of a memory); the heart is used once, at the end of the Book's last page in the web reader if the samples carry it, otherwise nowhere.
- **Chapter numerals**, Cormorant Garamond italic 400, in `--foil` on the cloth (where it reads at 3:1 against chocolate: #C9A15A on #4A3327 is 4.9:1) and in the cover-print colour on paper (as the samples' opener). Where: the memory page's compact cloth (the chapter's number, 96px, beside the chapter name in small caps); Book contents (existing list, the number at 22px); Archive chapter groups when grouped by chapter (72px, beside the chapter title).

**Build.** The numeral is real text with `aria-hidden` duplicates avoided: `<span class="ch-num" aria-hidden="true">II</span>` next to the visible chapter name. Use Roman numerals for chapters (I, II, III), Arabic for pages; never 01/02 (BAOS rule on index numbering).

**Motion.** Foil is stamped, not faded: `clip-path: inset(0 100% 0 0)` to `inset(0)` over 520ms `house-out`, then the D2 glint passes once across it (a `.glint` child, 900ms). Under reduced motion: present.

**Restraint.** One numeral per screen; at most two fleurons per screen; fleurons never inside a sentence; never in body text colour (always foil), never larger than 18px.

#### D10. Ribbon markers (S) · upgrade

**What and where.** The margin ribbon (existing) and the writer's ribbon tail stay. Upgrades:
- **Grosgrain rib** (Folio's ribbons): `background-image: repeating-linear-gradient(0deg, rgba(255,255,255,.06) 0 1px, transparent 1px 3px);` over the ribbon colour; and a 1px lighter centre line at 6% (`linear-gradient` in a mask is not needed; a `box-shadow: inset 5px 0 0 -4px rgba(255,255,255,.06)` gives it).
- **A second ribbon, terracotta**, marks *where you left off*: on the Archive, its tail hangs 44px from the top edge of the memory card you last read (from `sessionStorage`, existing "seen" logic in `lib/seenSides.ts` can hold it); in the Book reader, from the head of the page you last read. 10px wide, notched tail.

**Motion.** Swings once when it appears: `rotate(4deg)→rotate(0)` 900ms `house-out` around its top. Never an infinite sway (Project Reboot's 6s loop is the thing not to copy). Reduced: still.

**Restraint.** Two ribbons per page at most (the margin one plus one marker).

#### D11. The puppy (C) · map

The founder's watercolour samoyed is the only character. Rules from BAOS §27–28 and atmosphere-2026.md §4: it never follows the pointer on signed-in pages, it does one thing in one place, it lives at the edge.

| Page | State | Where | Asset |
| --- | --- | --- | --- |
| Home, Archive | asleep, wakes at the end | chin on the open leaf's top edge (existing) | `sleep-paper`, `curious-paper` |
| Writer | peeking | over the leaf's top edge (existing); hidden in Focus | `peek` |
| Family | curious | chin on the top edge of the "Invite someone" plate: someone new is coming | `curious-paper` |
| Family, after an invitation is sent | carrying an envelope | same spot, 2.4s, then back to curious | **new, P4b** |
| Book | asleep against the closed book | only in the empty state ("Your book starts with one memory") | **new, P4a** |
| Empty states (Archive with nothing, a search with no results) | watching the empty space | beside the empty-state line | `watch` |
| 404 | peek | from behind the page's lower edge | `peek` |
| Sign-in | watch / cover / peek / sleep | the bookplate (existing) | existing |
| Memory page, Person page, Account, Plans | none | reading and settings pages stay quiet | |

Sizes: 120–170px tall on desktop, 96–120px on phones. Motion: state crossfades of 220–520ms (existing), a 3px rise when waking. Reduced motion: still, states change by crossfade only.

#### D12. Corner flourishes (J) · new

**What and where.** The sheet frame keeps its small 26px foil corners. A larger engraved flourish (an acanthus scroll with a small five-petal flower, drawn to match the bookplate) marks a *plate of honour*: the open leaf, the Account bookplate (D16), the current plan card, the "From the book" keyline plate. Only two diagonally opposite corners (top-left and bottom-right), 44px: asymmetry reads as drawn (Hallmark).

**Build.** Inline SVG, single-stroke paths so DrawSVG can draw them, `stroke: var(--foil); stroke-width: 1; fill: none`, with the flower's centre a 1.6px foil dot. If the founder prefers the engraved look of the bookplate, P5 generates a matching corner as a transparent PNG; then it is an `<img>` at 52px with `mix-blend-mode: multiply`.

**Motion.** DrawSVG from 0 to 100% over 900ms `house-out` when the plate enters the viewport, once; the dot appears last (opacity, 200ms). Reduced: drawn.

**Restraint.** One flourished plate per viewport. Never on ordinary cards.

#### D13. A paper for each page (M) · replace the single laid texture

**What and where.** The founder found the cream plain while scrolling. Real books mix papers: a laid text stock, a smooth plate paper, a linen-finish for records. Each page names its paper with `<Shell paper="…">`, which sets `data-paper` on `.sheet-page`:

| Paper | Pages | Layers (all under the existing turbulence and vignette, alphas are the ceiling) |
| --- | --- | --- |
| **Laid** | Home, Archive | vertical chain lines `repeating-linear-gradient(90deg, rgba(74,51,39,.035) 0 1px, transparent 1px 26px)` + laid lines `repeating-linear-gradient(0deg, rgba(74,51,39,.016) 0 1px, transparent 1px 3px)` |
| **Linen finish** | Family, Person | `repeating-linear-gradient(0deg, rgba(74,51,39,.022) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(74,51,39,.022) 0 1px, transparent 1px 3px)` |
| **Plate (smooth)** | Memory page, Book | turbulence only at 0.03 alpha, no vignette (reading comes first, BAOS §17a) |
| **Bond** | Account, Plans | turbulence at 0.04, no lines |
| **Writing** | Writer | the leaf's ruled lines (existing); the sheet behind it is bond |

Within a page, a section may step to `--paper-tone` (the samples' summary-box colour) as a field: Home's "From the family", the Archive's year rail. A step in tone, never a border (DESIGN.md).

**Motion.** None. Paper does not move. **Restraint.** One paper per page; the patterns' hard stops make them patterns, not gradients; never under a photograph.

#### D14. The light on the cloth (M) · extend

**What and where.** The cloth hero gets the light of the hour, as if a window were beside the bench: morning light low from the left and cool-gold, midday high and neutral, evening low from the right and amber, night no window, only the lamp, and the cloth 5% darker. "Good evening, Bao." and the light now agree.

**Build.** `Shell` sets `data-hour` once on mount from `new Date().getHours()` (5–10 morning, 11–16 day, 17–20 evening, else night):
```css
.cloth { --lx: 18%; --ly: -10%; --lt: rgba(255, 236, 200, 0.10); }
.cloth[data-hour="day"] { --lx: 50%; --ly: -30%; --lt: rgba(255, 244, 228, 0.08); }
.cloth[data-hour="evening"] { --lx: 86%; --ly: 0%; --lt: rgba(255, 196, 120, 0.12); }
.cloth[data-hour="night"] { --lt: transparent; }
.cloth[data-hour="night"] .cloth-weave { filter: brightness(0.95); }
.cloth > .window { position: absolute; inset: 0; pointer-events: none; z-index: 0; mix-blend-mode: soft-light;
  background: radial-gradient(ellipse 70% 120% at var(--lx) var(--ly), var(--lt), transparent 70%); }
```
At 12% and under it is light, not a gradient fill (see §1's table). It sits beneath the lamp.

**Motion.** On the first arrival of the session the window light fades in over 1.2s (`opacity`, `house-out`); never animated afterwards. Reduced: present.

**Restraint.** One window, on the cloth only. Never on the paper (the sheet already has its vignette).

#### D15. The illuminated initial (H) · upgrade of the quiet drop cap

**What and where.** The first letter of a memory's words, on the memory page and on the public wall's open memory, when the words run to three paragraphs or more (shorter memories keep the quiet drop cap). One per page.

**Build.** A *versal* in a foil-ruled square, the letter itself in ink so it reads (foil on cream is 2.0:1 and fails as type):
```css
.rd-story > p:first-of-type::first-letter { initial-letter: 4 3; -webkit-initial-letter: 4 3;
  font-family: var(--book-display); font-weight: 600; color: var(--accent-deep); margin-right: 14px; }
.versal-frame { position: absolute; width: 1.32em; aspect-ratio: 1; /* placed by JS over the letter's box */ }
.versal-frame rect { fill: var(--paper-tone); stroke: var(--foil); stroke-width: 1; }
.versal-frame .sprig { stroke: var(--foil); fill: none; stroke-width: 0.9; }
@supports not (initial-letter: 1) { .rd-story > p:first-of-type::first-letter { float: left; font-size: 5.1em; line-height: 0.8; padding: 6px 12px 0 0; } }
```
The frame is a 4-line square with a 1px foil rule inset 3px and a two-leaf sprig (Hallmark Recipe 4, rotated +25°/-30°) growing from its lower-left corner, drawn behind the letter. The ink colour is `--accent-deep` (rubrication: initials in red), 5.6:1 on the paper.

**Motion.** The frame's rule and the sprig draw (DrawSVG, 800ms `house-out`), then the letter fades in (200ms). Once. Reduced: drawn.

**Restraint.** One per page, only on the first paragraph, never in cards, never in the book reader (the samples' drop cap rules there).

#### D16. Ex Libris (H) · extend

**What and where.** The bookplate (`public/book/bookplate.webp`) holds the sign-in form today. It also becomes the head of **Account**: "THIS BOOK BELONGS TO" over the person's name in Cormorant Garamond italic 40px, their story name in small caps beneath, at 420px wide (300px on phones), with the account's details below it on the paper. If the founder wants the family's own plate, P6 generates a variant with "EX LIBRIS" and a blank cartouche.

**Build.** The existing nine-slice: `border-image: url(/book/bookplate.webp) 260 180 180 180 fill / 130px 90px 90px 90px stretch;` (tune slices to the asset), name centred in the blank field. With D12 not used here (the plate has its own corners).

**Motion.** The name is written in: opacity and a 6px rise, 600ms, after the plate settles. Reduced: present.

**Restraint.** Account and sign-in only. One per page.

#### D17. Monogram seals for people (S: "a person") · upgrade

**What and where.** BAOS §18: people are portraits or a monogram, never a tinted square. The monogram becomes a foil-ringed seal like Smythson's blocked initials: initials in Cormorant Garamond 600 small caps on `--paper-tone`, a 1px `--foil` ring and a 0.5px inner ring inset 3px. Family register, Person hero, the faces on memory cards. On the Family cloth, the family's initial (V for the Vos) in a foil cartouche (an oval, Diptyque-like, 72×88, foil stroke, blind fill) beside "The Vos". No crests, no heraldry.

**Motion.** None at rest. On hover in the register, the D2 glint passes over the ring (pointer only, 900ms). Reduced: none.

**Restraint.** Monogram only when there is no photograph. One cartouche, Family page only.

#### D18. Postmark for what arrived (S) · new

**What and where.** A memory or a note that came from another family member (contribution links, "From the family", "the family's side" on a memory) carries a small postmark: it arrived. 48px circle, the date in the serif, "RECEIVED" in small caps, rotated -8°, `--ink-stamp` at 60%, with Project Reboot's dashed outer ring. Never on the user's own memories.

**Build.** Inline SVG: outer circle r=22 `stroke-dasharray: 3 3`, inner r=17 solid, both 1.2px; text on a path for "RECEIVED"; the day and month in the centre (Cormorant 600 13px). The D5 ink mottle mask.

**Motion.** None (it is already on the envelope when it reaches you). **Restraint.** Three visible at most; one per item.

#### D19. Pressed botanicals (H) · new · asset

**What and where.** A flower pressed between pages means *a moment kept*. One pressed specimen per decade opener in the Archive (beside the year numeral, partly behind it, 110–150px, rotated -12° to +9°), a fern frond beside the family's name on the Family page, and one small sprig at the Archive's empty state. The decade decides the specimen so the same decade always shows the same plant: 1940s forget-me-nots, 1950s fern, 1960s maple leaf, 1970s pansy, 1980s ginkgo, 1990s lavender, 2000s and later olive sprig.

**Build.** Seven transparent WebPs from P3, ≤60 KB each. `<img class="pressed" src="/deco/pressed-fern.webp" alt="" aria-hidden="true">`, `mix-blend-mode: multiply; opacity: 0.88; width: clamp(96px, calc(9vw / var(--zoom, 1)), 150px); transform: rotate(var(--tilt));` Positioned in the margin beside the year so it never sits under text. Hidden under 760px except on the Family page (smaller, 72px).

**Motion.** None at rest (pressed things are still). On entering, `opacity 0→.88` and `rotate(var(--tilt) + 3deg)→var(--tilt)` over 900ms `house-out`, once. Reduced: present.

**Restraint.** One per viewport (decade openers are at least a screen apart; if two land in one viewport on a sparse Archive, only the first shows). Never on cards, never over a photograph.

#### D20. The browser's own surfaces, in the book's materials (M) · extend

From impeccable's craft floor: selection is already pale foil. Add: the caret in the writer `caret-color: var(--accent)`; the scrollbar thumb in `--foil-soft` on a `--page` track (`scrollbar-color: var(--foil-soft) var(--page)`); link underlines with `text-underline-offset: 3px; text-decoration-thickness: 1px; text-decoration-color: var(--foil)`; the writer's cursor a fountain-pen nib (Project Reboot's pen cursor, redrawn in chocolate with a foil nib, 32px, hotspot at the tip). Motion: none.

#### D21. Tissue guard over the lead plate (S: "first viewing") · new, optional

**What and where.** Fine books protect a colour plate with a sheet of tissue. On the memory page, the first time a photograph is opened in a session, a tissue lies over the mounted print and lifts away. Only the lead photograph; later photographs use the existing develop.

**Build.** An overlay inside the print: `background: rgba(251, 247, 238, 0.74)` plus the paper turbulence at 0.06, a 1px top edge `rgba(42,35,32,.08)`. No blur (no glass).

**Motion.** `translateY(0) → translateY(-10px)`, `opacity 1 → 0`, with `transform-origin: top` and a 2° `rotateX`, 700ms `house-move`, 300ms after arrival; remembered in `sessionStorage` per memory. Reduced motion: no tissue at all.

**Restraint.** Once per memory per session. Replaces develop on that one print; never both.

#### D22. The gold keyline plate (J) · formalise

**What and where.** From the marketing site: "a sentence the family should treat as precious — used once per page". Home's "From the book", the Person page's "In their words", the Wall's opening line. A plate on `--paper-print` with a double foil keyline (1px at the edge, 0.5px inset 4px), the words in EB Garamond italic 22–26px, a leaf fleuron (D9) closing the quote. With D12's flourishes when it is the page's plate of honour.

**Restraint.** One per page. The existing `.card.gold` (yellow fill) is retired on the paper in favour of this.

---

## 5. Per page

The budget column counts the most crowded viewport.

| Page | Cloth | Sheet | Ornaments | Budget check |
| --- | --- | --- | --- | --- |
| **Home** | D14 light, D6 fillets and debossed A | D3 headband, D13 laid | Recent memories: loose prints with D7 edges, D5 Kept stamp on the newest, D4 seals on treasured; "Your book" plate with D2a gilt and the book's D2b edge; "From the book" as D22 keyline plate; D18 postmark on family items; the open leaf with D2b edge, D12 flourishes, D7 fore-edge deckle, D11 dog; D10 margin ribbon; D1 band at the foot | First screen: 0 H, 2 J (headband, gilt). Lower: open leaf counts as the H |
| **Archive** | D14, D6 | D3, D13 laid | D19 pressed specimen at each decade opener; year numerals stay terracotta (they are already the opener); D7 edges; D4 seals; D5 Kept; D10 terracotta marker on the last-read card; open leaf and dog at the end; D1 | One specimen per viewport; seals capped at three |
| **Memory page** | D14, D6 fillets only (compact), D9 chapter numeral in foil | D3, D13 plate | Lead photograph mounted with D8 corners and D21 tissue; D15 illuminated initial; D4 seal by the title if treasured; D9 leaf closing the words; D18 postmarks on the family's side; D1 | The initial is the H; corners are S; no dog |
| **Family** | D14, D6, D17 family cartouche | D3, D13 linen | D17 monogram seals; D19 fern beside "The Vos"; D11 curious dog on the Invite plate (envelope after sending); pending people show the exact words "invited · waiting for them" (no ornament replaces the words); D1 | Fern is the H; cartouche and headband the two J |
| **Person** | D14, D6 fillets | D3, D13 linen | Portrait or D17 monogram; album strip mounted with D8 corners; D22 keyline plate for their words; D10 marker at their latest memory; D1 | Keyline plate is the J; no H, no dog |
| **Book** | Teal cloth, D14, D6 | D3 (foil and cream), D13 plate | Reader untouched (samples rule); the keepsake book thumbnail with D2b edge; D10 terracotta marker at the last page read; D11 sleeping dog only in the empty state; D1 teal marbling | The book is the hero; nothing competes |
| **Writer** | D14, D6 fillets (compact) | D3, D13 bond behind the ruled leaf | The leaf (existing board, corners, ribbon, dog) gains D2b edge and D7 fore-edge deckle; the seal button becomes D4's seal (dashed outline before, pressed wax after); D5 Kept stamp after Keep; D20 caret and pen cursor; Focus hides all of it | No new H; the leaf is the page |
| **Account** | D14, D6 fillets | D3, D13 bond | D16 Ex Libris with the name; D17 monogram if no photo; D1 | Bookplate is the H |
| **Plans** | D14, D6 fillets | D3, D13 bond | The plan you are on gets D2a gilt and D12 flourishes; the plans that include a hardcover show a small keepsake book with D2b edge and a 6px strip of D1 marbling under it ("endpapers like these"); no seals, no dog | One flourished plate |
| **Sign-in** (`/sign-in`, `/create-account`, `/verify`, `/forgot-password`) | D14 light on the cloth around the book (lamp and leaf stay) | The open book: D3 headband at the head of the gutter (64px), D2b page-block edge on the right page's fore-edge and foot, D10 ribbon from the gutter (exists in spirit; add one 12px chocolate ribbon) | Bookplate, photo corners, dog: existing | Already at the limit: add only the headband, the edge and the ribbon, nothing else |
| **Landing** (`/welcome`, the front door) | D14, D6 fillets and debossed A | — | The sample book (samples-exact) gains D2b edges and a D3 headband on its object, not its pages; D1 band (56px) above the footer; D11 peeking dog beside the one call to action | One H (the book) |

Shared everywhere: D20 browser surfaces, the existing foil frame corners, the ✦ rules.

---

## 6. What to avoid

From the founder (BAOS-STANDARD.md, memory, PASS reports):
- **Scattered captions and disclaimers.** No labels explaining an ornament ("a wax seal means…"). If it needs a caption, it is the wrong ornament.
- **A giant wordmark** anywhere, especially closing a page. The A-mark appears debossed on the cloth and as the 3% watermark, nowhere larger.
- **Teal on brown**: no teal object on the chocolate cloth (the Book page alone is teal). The marbled band's chocolate colourway contains no teal; P1 says so.
- **Sage or muddy teal-ivory gradients**, **bar-chart "depth" graphics**.
- **Fast or large marquees**; nothing slides sideways (DELIGHT.md "Nothing lateral"). The marbling drift is under 120px over the whole scroll.
- **Fake chrome**: no fake phone or browser frames, no glossy chrome foil, no metallic gradients on text. Foil is flat colour plus a passing glint.
- **AI-generic gradients**: no aurora, mesh, purple, glow, or blob.
- **The slipcase image** (library 39), **crops from contact sheets**, **filters on photographs** (no sepia, no grain, no vignette, no duotone on any family photograph, ever).
- **The drawn man, the line-art dog**: the only character is the watercolour puppy.
- **Tinted bubbles, heavy pill buttons, clipped rounded photo frames** (BAOS §17a).
- **Streaks and guilt** ornaments: no postmarks counting days, no seals for "7 days in a row" (Project Reboot does this; A Story must not).

From the skills:
- Ornament as filler for an empty layout (taste SKILL.md); ornament without a meaning (Hallmark gate 45); three or more kit pieces on one page (Hallmark imagery-kit); a second grain over a paper that has one (Hallmark E7); shadows at rest except the named raised objects (taste, DESIGN.md); glows and zero-offset halos (impeccable craft-floor); infinite loops that mean nothing and bounce easing (taste tells §7, Hallmark); `transition: all`, `scale(0)` entrances, ease-in (Emil); animating layout properties (GSAP performance); heraldry and loaded symbols (impeccable).

---

## 7. Image prompts for the founder (GPT image)

Run each in ChatGPT's image tool. Post-process every result before it ships (Hallmark: "Always post-process"): trim, check the repeat, colour-check against the tokens, export WebP. Send the files back and they go in `public/deco/`.

**P1. Marbled endpaper, chocolate (and P1b, teal).**
> Use case: seamless texture for a website. Create a flat, straight-on scan of a sheet of traditional hand-marbled bookbinding endpaper, in the "Spanish wave" and "combed nonpareil" styles used in fine 19th-century English bindings. Colours only: deep chocolate brown #4A3327 as the ground, burnt terracotta #B85126, warm antique gold #C9A15A, cream #F3EBDD veins, and a little dark umber #2B2116. Fine combed veins with small floating drops, even density across the whole sheet, no single focal point. Matte paper with a faint fibre texture, lit evenly, no shadows, no paper edge visible, no text, no logos, no teal, no blue, no green. Wide format 4:1, 2048 × 512 pixels, the left and right edges must tile seamlessly when repeated horizontally. Make ONE image, not a montage.
>
> P1b: the same prompt with the colours changed to deep teal cloth #0F4A58 as the ground, cream #F3EBDD, warm antique gold #C9A15A and a little slate #2E566A; no brown, no red.

Post-process: cross-check the seam by tiling twice side by side; if it shows, offset by half and heal the middle. Export at 2048 × 512, WebP quality 78.

**P2.** (none: the wax seal, headband, stamps, postmark, corners and frames are drawn in SVG so the A-mark stays exact.)

**P3. Pressed botanicals, a set of seven.**
> Use case: website illustration assets with transparent backgrounds. Create seven separate pressed and dried botanical specimens, each flattened as if kept for decades between the pages of a family album, photographed straight down like a museum herbarium scan: (1) a small spray of forget-me-nots, (2) a fern frond, (3) a single maple leaf, (4) one pansy flower with a short stem, (5) a ginkgo leaf, (6) a sprig of lavender, (7) a small olive sprig with three leaves. Faded, natural pressed colours (muted ochre, dusty violet, sage, rust), thin and slightly translucent where the petals are thin, a few tiny imperfections and a little loss at the edges, no glue, no tape. Each specimen alone on a fully transparent background with true alpha, no paper, no shadow, no text, arranged in a row with wide empty gaps so each can be cut out cleanly. High resolution, 3000 × 1000. Make ONE image.

Post-process: cut each to its own file, trim to the specimen, 600px on the long side, WebP with alpha ≤60 KB. Check that no specimen has a white halo (it must multiply cleanly onto cream).

**P4a. The puppy asleep against the closed book.**
> Use case: character illustration, edit of an existing character. Use the attached sheet of the cream samoyed puppy (soft watercolour fur, warm sepia linework, dark eyes and nose, paws resting on a ledge) as the STRICT character reference: same puppy, same style, same proportions, same palette. New pose: the puppy is curled up asleep, chin resting on the top of a closed square clothbound book lying flat, eyes closed, one paw draped over the book's edge. The book is plain, deep teal cloth #0F4A58 with no title and no pattern, seen from the front at a low angle, only its top half visible. Transparent background with true alpha, no ground shadow, no text. Square 1:1, 1500 × 1500. Make ONE image.

**P4b. The puppy carrying an envelope.**
> Use case: character illustration, edit of an existing character. Use the attached puppy sheet as the STRICT character reference (same cream samoyed, soft watercolour fur, warm sepia line, same face). New pose: the puppy sits up proudly, looking at the viewer, holding a small cream envelope gently in its mouth; the envelope is closed with a small round terracotta wax seal #9A4220 with a gold rim. Only the head, chest and front paws, the paws resting on a ledge as in the reference. Transparent background with true alpha, no text, no extra props. 1500 × 1260. Make ONE image.

Post-process both: trim to the paws like the existing states (the bottom edge is where the puppy rests on the plate); fill the transparent fur inside the outline with `#FFFDF8` as was done for `sleep-paper.webp` (DELIGHT.md §6 note); 762px wide, WebP.

**P5 (optional). Engraved corner flourish.**
> Use case: website ornament with transparent background. A single engraved corner flourish in the exact style of the attached Ex Libris bookplate (sepia engraved line work, acanthus scroll, one small five-petal flower), designed to sit in the top-left corner of a rectangular frame: two scrolls growing along the top and left edges, about one fifth of the frame's width each. Sepia #6B4A2E line only, no fill colour, no frame lines, no text, transparent background with true alpha. 1200 × 1200. Make ONE image.

**P6 (optional). The family's own Ex Libris.**
> Use case: edit of the attached bookplate. Keep the plate exactly (sepia engraved double border, acanthus corners, the heart cartouche at the top, the cream paper). Replace the words "THIS BOOK BELONGS TO" with "EX LIBRIS" in the same engraved capitals, centred. Keep the large centre empty for a name to be set on top. Transparent outside the plate. 1122 × 1402. Make ONE image.

---

## 8. Build order (for the lead)

1. Tokens (§4.0), D13 papers, D20 surfaces: no assets, every page.
2. D3 headband, D6 fillets and deboss, D14 light: the top of every page.
3. D4 seal, D5 stamp, D18 postmark, D17 monograms: the state marks, with `lib/treasured.ts` and the contribution data.
4. D7 print edges and D8 corners: by date, with `lib/memoryDisplay.ts`.
5. D2 gilt, D12 flourishes, D22 keyline, D16 Ex Libris, D15 initial.
6. D9 numerals and fleurons, D10 ribbons, D21 tissue.
7. When the founder sends P1 and P3: D1 marbled band and D19 botanicals. When P4 arrives: the new dog states.

Each step goes through both reviewers (`.claude/agents/baos-standard.md`, `skills-steward.md`) with the §4.1 budget count at 1366×768, 1920×1000, 2560×1300 and 390×844.
