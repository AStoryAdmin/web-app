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
- The writing desk (`src/pages/Write.tsx`, CSS §20): the question on the cloth, one wide page in the serif, starters while it is empty, focus mode (Esc), dictation where the browser can listen, a rail for when, chapter, photographs and Keep it.
