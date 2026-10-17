---
name: A Story web app
description: The bookbinder's bench, in the deck's language. The top of every page is the book's cloth; the work happens on a sheet of cream paper that rises over it.
colors:
  chocolate: "#4A3327"
  cloth-teal: "#0F4A58"
  cream: "#F3EBDD"
  card: "#FBF7EE"
  tint: "#EAE0CF"
  ink: "#2A2320"
  ink-soft: "#6B625B"
  ink-faint: "#9A8F85"
  terracotta: "#B85126"
  ochre: "#BF7F1A"
  gold: "#E0A03F"
  brass: "#EFC75E"
  pill-gold: "#F2D27A"
  teal-slate: "#2E566A"
  on-chocolate: "#F6F0E6"
  on-chocolate-soft: "#D9CFC2"
typography:
  display:
    fontFamily: "Montserrat"
    fontSize: "56px"
    fontWeight: 700
    letterSpacing: "-0.025em"
    lineHeight: 1.05
  headline:
    fontFamily: "Montserrat"
    fontSize: "40px"
    fontWeight: 700
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Montserrat"
    fontSize: "22px"
    fontWeight: 700
  body:
    fontFamily: "Montserrat"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Montserrat"
    fontSize: "13px"
    fontWeight: 700
  said:
    fontFamily: "Source Serif 4"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  pill: "999px"
  card: "22px"
  sheet: "28px"
  field: "14px"
---

# A Story, on the web

The tokens live in `src/styles/astory.css` (§1); pages never write a raw hex.

## The world

**The bookbinder's bench.** Every signed-in page is the book itself, opened on the bench. The top is the book's cloth, the real bookcloth tile (`public/book/bookcloth.jpg`) laid over the brand's chocolate; it carries the thin bar (lockup, the four places as a pill, whose story, Add, the account avatar) and the page's hero in cream. The work happens on a sheet of cream paper that rises over the cloth with a soft shadow. The Book page alone wears teal, because that is the book's own cloth. The signed-out pages are the same cloth with one sheet of paper on it.

**The deck's language on the sheet** (from the October 2026 pitch deck, which the founder named as the reference for "easier and eye-friendlier"): cream page, soft cream cards separated by tone and never by a border, bold Montserrat headlines two-toned with the key phrase in ochre (`.hl`), slate-teal callouts with cream text and brass highlights (`.card.teal`), yellow pills for tags (`.pill.gold`), warm photographs cropped into rounded cards. Terracotta stays for the lockup, the dot of ink on the week strip and the "Kept" stamp. The serif is only ever for what a person said.

## Rules

1. Materials move, interfaces don't. Cloth, paper, foil, photographs and ink may react; buttons, fields and navigation stay still.
2. Each page arrives once (`src/lib/arrive.ts`): the hero's words rise line by line, the rest follows, the sheet settles. Pages change through view transitions with the bar held still. Nothing moves sideways. Everything respects reduced motion and does nothing on touch where there is no pointer.
3. The pointer is a lamp over the cloth (`components/delight/Light.tsx`), never a hand.
4. One idea per moment. Keeping a memory gets the ink stamp and the word "Kept"; nothing else.
5. No sound. No confetti. No countdowns.
6. Body text at least 16px, targets at least 44px.

## Components

- `Shell` (`src/components/Shell.tsx`): `hero` puts a page's title and what belongs beside it on the cloth; `compact` gives a short band for reading, writing and settings; `tone="teal"` for the Book; `back` adds the chevron.
- `.card`, `.card.teal`, `.card.gold`, `.pill.gold|teal|cream`, `.hl`, `.more` (a link that acts, ochre with a chevron), `.hero-grid`, `.hero-stats`, `.foil`.
- The writer (`src/pages/Write.tsx`, CSS §20), in two steps that never share a screen: the question on the cloth, large; one leaf of the family book below (printed gold frame, running head, title line, ruled lines, sign-off, folio); the wax seal under the page keeps it. Afterwards, when it was, the chapter and a photograph as their own card, each kept the moment it is chosen; then the next question.
- Reading a memory (`src/pages/MemoryPage.tsx`, CSS §24): title on the cloth with chapter, date and who told it; one reading column, photographs first, a quiet drop cap, the family's side, and a footer with Public/Private, edit, share, remove.
- The memory card (CSS §9) is the printed page in small (astoryapp.com/samples): the photograph as a white-bordered print on the left, the chapter as a tracked sage kicker, the title in Cormorant, the dateline in terracotta, two lines of the person's own words in EB Garamond italic (never the server's third-person summary), the faces of the people in it, who told it in the folio line; paper tinted by the memory's colour or its chapter.
- The wall (`src/pages/Wall.tsx`, `/p/:slug`) and the front door (`src/pages/auth/Welcome.tsx`): the same cloth and sheet; the front door turns a sample book built with the real functions and shows the five covers and three papers.
- The minor elements (CSS §25) are quiet: small type in sentence case and a soft grey, one weight down, hairlines not fills, arrows not chevrons. Shiori and Kiyo are the reference for small print; the deck for the big pieces. One exception, since the sheet became the book's paper (§39): the printed book's own small caps (kickers, running head, folio, "Open the book →") are allowed at 11px or more with 0.14em or more of tracking, in grey, terracotta or sage. Never uppercase for a sentence, a label on a control, or anything a person must read as words.

## The craft rules (from the taste, Hallmark and design-engineering skills, reconciled with the brand)

Where a skill's house style contradicts the brand (its ban on cream-and-terracotta, on tracked small caps, on hairlines, on a styled accent word), the brand wins: those are the printed book's own language and the founder's deck. Everything else below is binding on every page.

**Type**
- Two faces on the paper: Cormorant Garamond for display and titles, EB Garamond for what people said and running text. Montserrat only for controls, navigation and small caps. Source Serif is retired on the sheet.
- Headlines two lines or fewer at every width. A statement set large is a paragraph, 25 words at most.
- Running text in the full ink, never grey. Grey is for secondary notes only.
- Two or three sizes do the visible work: one very large, one small. Five sizes on a page is the ceiling.
- No italic headings. Italic lives in body emphasis and in the book's captions only.
- No monospace. No index numbering (01 / 02) outside the book's own chapter openers.

**Space and surfaces**
- Surfaces separate by a step in tone, never by a drop shadow at rest. Shadows only on what truly floats (a menu, a print lifted on hover).
- No gradients except a scrim under text on a photograph. No glass, no blur panels.
- The gap between sections is clearly larger than any gap inside one.
- Each section has a different composition from its neighbours. No rows of identical icon-topped cards.
- One deliberate rest per page at most; a screen that is mostly empty ground is an underbuilt section.
- Buttons flat, one fill, fully round (decided once). Pressed: scale 0.97 in 120 ms.

**Imagery**
- One dominant picture beats six small ones. At least four real pictures on a page that has them to show.
- Same crop ratio and treatment within a set. The white-bordered print is the treatment for family photographs.
- Never a borrowed scene presented as the family's own. A memory without a photograph is the person's words on paper.
- No redrawn chrome (fake phone frames, fake browser bars).

**Motion (Emil's framework)**
- Ask how often it is seen: a hundred times a day, no animation; tens of times, barely; occasional, standard; first-time, delight.
- Easings: entering and feedback use a strong ease-out `cubic-bezier(0.23, 1, 0.32, 1)`; on-screen movement `cubic-bezier(0.77, 0, 0.175, 1)`; never ease-in on UI. UI animation under 300 ms; arrival under 1.2 s.
- Nothing appears from nothing: scale from 0.95 with opacity, never from 0.
- Transform and opacity only. Reduced motion collapses to a 150 ms crossfade.

**Honesty and the floor**
- No invented numbers, quotes, logos or reviews. Sample content is labelled as sample.
- Every control has eight states: default, hover, focus-visible, active, disabled, loading, error, success.
- Phones: no horizontal scroll (`overflow-x: clip` on html and body), no two-line buttons, grid tracks `minmax(0, 1fr)`, long words wrap.
- Before shipping, score the page 1 to 5 on philosophy, hierarchy, execution, specificity, restraint, variety; anything under 3 goes back.
