# A Story — Web design system

Status: proposal for the founder's approval, 16 October 2026. Nothing here is
coded into a repo. The system is written as CSS tokens in
`docs/mockups/astory.css` and shown in six static mockups beside it.

**The one-line brief we designed to:** the web app is the Figma grown up onto a
laptop. Same paper, same chocolate, same pill buttons and pastel memory papers —
but with a desktop's room, used for the things a phone can't do: read a memory
like a book page, see the whole family at once, review what the family has
added, and watch the book fill up.

**Who it is for.** Storytellers of 65–90, mostly on an iPad or a laptop at a
kitchen table; organisers (their adult children) on a laptop in the evening.
That audience sets the floor on everything below: body text never under 16px,
anything tappable at least 44px, contrast at or above 4.5:1, no sideways motion.

Sources read: the 30 Figma frames and `figma/TOKENS.md` (the designer's ramps,
type scale, corners, shadow), `phone-app/src/theme/index.js` (brand tokens, dark
theme, memory papers, the live-call tokens), `landing-page-publish/design.md`
and `src/lib/brand.json` (the marketing site), the locked visual library, the
current app's screenshots and `flows.md` (what not to repeat).

---

## 1. How the web app relates to the brand's two voices

| | astoryapp.com (marketing) | Phone app / Figma | **Web app (this)** |
|---|---|---|---|
| Interface type | Figtree | Montserrat | **Montserrat** |
| The storyteller's words | Source Serif 4 | Montserrat | **Source Serif 4** |
| Page | Ivory #F3EBDD | Sand #F3EBDE | Sand #F3EBDE |
| Dark ground | Night | Chocolate #4A3327 | Chocolate #4A3327 |
| Accent | Terracotta / brass on dark | Terracotta | Terracotta / brass on dark |

**Decision — two typefaces, each with one job.** Montserrat is the *interface*:
labels, buttons, navigation, dates, chips — exactly as the Figma sets it. Source
Serif 4 is reserved for *anything a person said*: today's question, a memory's
title and body, a family member's note, the pull-quotes after a call. This is
the same rule the marketing site already follows ("a serif voice for anything a
person says, a quiet sans for interface"), so astoryapp.com and the app read as
one company; and it is what the Figma's memory-detail frame is reaching for
with its serif-feeling title. For a 75-year-old reading a 400-word memory, a
20px serif with 1.6 leading is also simply easier to stay in than a geometric
sans. Figtree is not used in the app: the app is Montserrat's house, and two
sans faces side by side would read as a mistake.

Every other brand element is shared verbatim: the A-with-heart mark (the SVG in
`phone-app/design/brand/`), the wordmark artwork from the website, the chocolate
hero with the sound-wave band, the book's teal cloth.

---

## 2. Tokens

All values are CSS custom properties in `mockups/astory.css`. Pages never write
a raw hex; if a value is needed it is lifted into the token block first.

### 2.1 Colour — light

The ramps are the designer's (`figma/TOKENS.md`). Where the ramp and
`brand.json` differ by a unit (#B85327 vs #B85126, #4A3728 vs #4A3327) the
brand.json value is canonical and the ramp supplies its tints and shades.

| Token | Value | Figma ramp | Used for |
|---|---|---|---|
| `--page` | #F3EBDE | — (the sand the frames are painted on) | the page |
| `--sheet` | #FAF7F2 | — | raised sheets (the recent-memories panel, phone sheets) |
| `--card` | #FFFFFF | neutral-0 | cards, inputs |
| `--support` | #D5CDC6 | secondary-100 | the sliver that peeks above a sheet; avatar placeholders |
| `--support-soft` | #EEEBE8 | secondary-50 | neutral chips |
| `--field-border` | #E3E3E3 | — | input hairline |
| `--chocolate` | #4A3327 | secondary-800 | app bar, rail, primary buttons, the Live tile |
| `--chocolate-deep` | #3B291D | secondary-900 | hover on primary, the transcript sheet |
| `--chocolate-ink` | #2B2116 | — | the live-conversation room |
| `--on-chocolate` | #F1EADC | logo "A" | text on chocolate |
| `--on-chocolate-soft` | #DBD2C5 | slogan | secondary text on chocolate |
| `--ink` | #333333 | neutral-700 | body (11.4:1 on sand) |
| `--ink-soft` | #4D4D4D | neutral-500 | secondary text (8.2:1) |
| `--ink-faint` | #87715D | secondary-400 | placeholders only, ≥18px |
| `--heading` | #4A3327 | secondary-800 | headings, names |
| `--accent` | #B85126 | primary-900 | labels ("A little question for today,"), dates, the one coloured action |
| `--accent-deep` | #9A4220 | — | hover / pressed |
| `--accent-800` | #D25E2C | primary-800 | the Recording dot, small marks |
| `--accent-500` | #FA7337 | primary-500 | warm end of the book progress ramp |
| `--accent-soft` / `--accent-100` / `--accent-border` | #F9EBE9 / #FCD2C2 / #FBB69B | primary-50/100/200 | selected chip ground, soft tints |
| `--gold` / `--brass` / `--logo-gold` | #E0A03F / #EBC86A / #EAC668 | logo accent | the heart, the wordmark on chocolate, the contributions banner |
| `--teal` | #0F4A58 | — | links (never the same hue as a button), the book cloth |
| `--green` / `--green-soft` | #0E9154 / #EEFAF5 | success-700/50 | chapter chips, "+3 this month", saved |
| `--danger` | #B03A2E | — | remove / delete only |
| `--ring` | #50B7BE | focus | focus ring: 3px outside, 2px white inside |

Memory papers (the pastel cards; from the app's `MEMORY_COLORS`):
blush #FBEBEC · periwinkle #DEE6F7 · sage #DDECD7 · lilac #EBDDF5 · apricot
#FBEEDD · butter #FBF4D8 · sea #D9EDEB. A memory keeps its paper everywhere it
appears (home, archive, the book preview).

### 2.2 Colour — dark

`:root[data-theme="dark"]` (also what `prefers-color-scheme: dark` should map
to). From the app's DARK theme: page #241A14, sheet #2C201A, card #3A2A20,
ink #FAF7F2, secondary #D3C4B0, headings ivory, **accent becomes gold
#E0A03F** (terracotta goes muddy on brown), links #8FBFCB, chocolate surfaces
drop to #1B120D, the memory papers to their dark twins (#432C32, #2E3444,
#2C3A2E, #382E45, #463325, #443C25, #293A39). The live conversation is dark in
both themes on purpose (it is a room, not a page). Primary buttons flip to
ivory-on-dark so they stay the brightest thing on the screen.

### 2.3 Type

Montserrat (interface) and Source Serif 4 (the storyteller's words), both
loaded from Google Fonts. The designer's phone scale (10/12/14/18/24) is the
proportion; the web raises every size because of who reads it.

| Token | px / line | Face | Where |
|---|---|---|---|
| `--t-caption` | 14 / 20 | Montserrat 700, +0.08em, uppercase | labels: GOOD EVENING, RECENT MEMORIES, field labels. **The floor.** Never for a sentence. |
| `--t-small` | 16 / 24 | Montserrat 500–600 | meta lines, chips (big), hints, secondary buttons |
| `--t-body` | 18 / 27 | Montserrat 500 | interface body, buttons, nav |
| `--t-story` | 20 / 32 | Source Serif 4 400 | a memory's words, a family note, transcript lines |
| `--t-lead` | 22 / 28 | Montserrat 700 | card titles, section heads (uppercase +0.04em) |
| `--t-h3` | 24 / 28 | Montserrat 700 | profile name, memory card title (serif 26) |
| `--t-h2` | 30 / 34 | Montserrat 700 | page sub-titles, year headings (serif) |
| `--t-h1` | 38 / 42 | Montserrat 700 | page titles; a memory title is serif 44 |
| `--t-display` | 48 | Source Serif 4 500 | the question in the live call (38 on desktop, 26 on phone) |

Phone (≤760px): h1 32, h2 26, everything else unchanged — body never shrinks.

### 2.4 Spacing, radii, shadow

- Spacing: 4-pt scale `--s-1…--s-20` = 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80.
  Page gutter 40 (desktop) / 28 (tablet) / 16 (phone). Content column max 1160.
- Radii (the designer's corners): `--r-sm` 8 (chips), `--r-md` 12,
  `--r-field` 16, `--r-card` 16, `--r-sheet` 40 (the big sheets and the curved
  app-bar edge), `--r-pill` for every button and input.
- Shadow: `--shadow-xs` `1px 2px 4px rgba(16,24,40,.08)` (the Figma's) on
  cards; `--shadow-2` only on things that genuinely float (polaroids, the
  phone tab bar, the end-of-call sheet). Nothing else casts a shadow.
- Touch target: `--touch` 48px; nothing interactive under 44.

### 2.5 Motion

`--ease-out: cubic-bezier(.23,1,.32,1)` for anything entering;
`--ease-in-out: cubic-bezier(.77,0,.175,1)` for on-screen movement; never
`ease-in`, never a bounce. Durations: press 140ms (`scale(.97)` on every
button, `.95` on round ones), UI 200ms, sheets 320ms. Only `transform` and
`opacity` animate. Cards rise 10px on entry, staggered 60ms. The live call's
bars breathe at 1.1s (0.7s while listening). `prefers-reduced-motion` collapses
every animation to a 1ms crossfade. **No lateral motion anywhere** — nothing
slides in from the side, carousels don't auto-advance, chips scroll only when
the person scrolls them.

---

## 3. Layout model

### 3.1 Desktop 1440 — a persistent left rail, not a top bar

The rail is 248px of chocolate on the left; the page is sand. **Why a rail
for a 70-year-old:** the four destinations are always visible, in a vertical
list with 26px icons and 18px labels (a top bar would squeeze them into a row
or hide them behind a menu); the active one is a cream pill, the same device
as the Figma's tab bar; the storyteller switcher sits under the wordmark so
"whose story am I looking at" is answered before anything else; and "Add a
memory" is a real button in the rail, not a floating "+" to hunt for.
It also carries the idea of the whole product: the chocolate rail is the
book's spine, the sand is its page. Nothing in the rail scrolls away.

The content column is max 1160 with 40px gutters. Inside it, screens use a
two-column grid where the right column (320–420px) holds the things an
organiser glances at (next call, the book, family news, review queue) and the
left holds the thing they came to do.

### 3.2 Tablet 1024

Same shell. The rail narrows to 96px (icons only, labels become tooltips; the
storyteller avatar stays). Two-column screens keep two columns with tighter
gaps; the archive's decade list narrows to 150px.

### 3.3 Phone 390

The Figma, almost exactly: the chocolate top bar with the curved bottom edge
(a `::after` ellipse in the page colour), the greeting row, the week strip,
the question card, the two tiles, then the recent-memories sheet rising with
its two-tone edge; a translucent bottom tab bar (Home · Archive · Family ·
Book) with the chocolate "+" beside it. Desktop-only columns stack below.
Every mockup renders both from the same file; the breakpoints are 1100 and
760.

---

## 4. Component inventory (mapped to the Figma)

| Component | Figma frame | Web version | Notes |
|---|---|---|---|
| App bar, curved edge | 24, 23 | `.topbar` (phone) / `.rail` (desktop) | The curve is the phone's brand moment; on desktop the chocolate becomes the rail. |
| Wordmark / mark | 03, 04, 06 | `[data-lockup]`, `[data-mark]` | The website's lockup SVG recoloured by CSS vars; ivory + gold on chocolate, chocolate + terracotta on paper. |
| Sound-wave band | 03, 06, 10 | `.wave` | Decorative, 28% ivory, behind the mark on auth and splash. |
| Greeting row | 24 | `.pagehead` + `.teller-pick` | "GOOD EVENING, DAN" label + storyteller switcher. |
| Week strip | 24 | `.week` | 56px day discs, chocolate for today, terracotta dot = a memory that day. 46px on phone. |
| Question card | 24 | `.qcard` | Label in terracotta, question in serif 26, **Write it (primary) + Talk about it (secondary)**, "Ask me another". The sun-and-figures drawing is an inline SVG in the brand's line style. |
| Action tiles | 24 | `.tile.dark` / `.tile.light` | Write your Memory (chocolate) and Live Conversation (outlined). |
| Memory card | 24, 25, 30 | `.mem` + paper class | Square photo, chapter chip (green) + mood chip, serif title, terracotta date · chapter, two-line excerpt, "Told by Rose", avatar stack. |
| Memory stack card | 30 | `.stack` | Three tilted photos with a "42 photos" count. |
| Chapter chips | 05 | `.chip.big[aria-pressed]` | 48px tall on web, scrollable row on phone. |
| Profile card + stats | 05 | `.profile`, `.stats` | Photo, name, born, streak chip, three stats. |
| Book progress | 05 | `.progress` | Terracotta bar with the percentage inside, the marker, the grey comb to 100%; beside the real teal book. |
| Contributions banner | 05 | `.banner` | Butter paper with a gold edge. |
| Search | 05, 13 | `.search` | Pill field with the chocolate go-button inside, filter button beside. |
| Memory detail | 26 | `05-memory.html` | Phone: photo header, curved sheet, weather, chips, centred serif title. Desktop: a two-page spread. |
| Polaroid strip | 26 | `.polaroid` | Tilted, serif-italic caption. |
| Audio player | 01, 26 | `.player` | Round chocolate play, waveform bars, elapsed / total. Sticky dock on phone. |
| Create memory | 27, 28 | not mocked | Paper swatches, collaboration avatars, Copy link / Share / Permission / Save map 1:1; the tilted card becomes a centred sheet on desktop. |
| QR share card | 02 | `.qrwrap` | Family code, link, QR; Save / Print. |
| Person rows | 13, 19 | `.person` | 52px avatar, name, relation · role · count, chevron. |
| Invite & connect | 16 | `.invite` | Code in 34px tracked caps, copy, link, email/phone invite. |
| Forms, fields | 06–10 | `.field`, `.input` | Uppercase 14px label above a 58px pill field with icon · divider · placeholder; Show on passwords. |
| Code input | 10 | `.code` | Six 72px boxes, 30px digits, `inputmode=numeric`. |
| Buttons | all | `.btn.primary / .outline / .accent / .gold / .quiet` | 56px pills (44 for `.sm`). One chocolate primary per view. |
| Sheets / dialogs | 27 | `.sheet`, `.keep .sheet-card` | 40px radius, two-tone edge; dialogs centred, `transform-origin: center`. |
| Tab bar + add | 24 | `.tabbar` | White at 72% with blur, cream pill on the active tab, chocolate "+". |
| Live conversation | — (undefined) | `03-live-conversation.html` | See §6. |

---

## 5. Accessibility rules

1. Body text ≥16px; the storyteller's words 20px; captions 14px bold only for
   labels, never sentences. Line length ≤ 70 characters.
2. Contrast ≥ 4.5:1 for all text, ≥ 3:1 for icons and chip grounds. `--ink-faint`
   is for placeholders only and only at ≥18px. The Figma's #AEAEAE placeholder
   grey is not used (2.1:1).
3. Every interactive element ≥ 44×44 (most are 48–58). Rows are whole-row
   targets. Chips that filter are buttons with `aria-pressed`.
4. Focus is always visible: the designer's ring (#50B7BE 3px, white 2px
   inside), never animated, on every focusable element.
5. No lateral motion; no auto-playing anything; `prefers-reduced-motion`
   honoured globally. Hover effects only under `(hover:hover) and (pointer:fine)`.
6. Semantics: real `<nav>`, `<main>`, landmarks with labels, `aria-current="page"`,
   live regions on the call status, every photograph with alt text that says who
   is in it, not "image".
7. Colour never carries meaning alone: a "has memory" day has a dot *and* the
   count in its tooltip; a chip has its text.
8. Forms: one column, labels above, errors in words under the field in
   terracotta with an icon, never only a red border. The code screen accepts a
   pasted six-digit code into the first box.
9. Keyboard: tab order follows reading order; the storyteller switcher and
   every menu is a `<button>`; Escape closes sheets.
10. Zoom to 200% breaks nothing: layouts are `minmax(0, 1fr)` grids and stack
    at 760.

---

## 6. What the Figma leaves undefined — decided here

- **Desktop book view.** The Book is a destination of its own (rail item 4).
  It opens on the real teal book object with the progress bar beside it, then
  a chapter list (the app's eight chapters with their colours) where each
  chapter shows its memories as spreads; "Preview first edition" renders pages
  in the print book's own type (`BOOK_PRINT` tokens), not the app's. Order a
  printed copy lives here, never on Home. (Mocked as the book card on the
  Archive; the full spread view is the next mockup to make.)
- **Live conversation in the browser (v1.5).** A dark room (`--chocolate-ink`)
  in both themes with a warm glow rising from the floor; the mark in a ring with
  breathing bars (gold when A Story speaks, ivory when it listens); the question
  in 38px serif; Mute / Pause / Ask me another / End; the transcript on an
  opaque sheet to the right (below, on phone) with the newest line largest and
  a pulsing dot while Rose is speaking. Ending the call shows **What we'll
  keep**: a suggested title, chapter chips, three pull-quotes, Keep it / Listen
  back / Don't keep this one, and the promise that Rose can change anything
  later. Until v1.5 the Home question card leads with Write it.
- **Family tree.** Three generations as circles joined by a couple bar, a stem
  and a child arm — no genealogy software look. The storyteller is ringed in
  terracotta; people who have passed (Walt) are a lettered disc with dates;
  "Add a person" is a dashed node. Below it, the flat "Everyone" list from
  the Figma's People frame with roles (Storyteller · Organiser · Contributor).
- **Contributions review.** A queue on the Family page (and the banner on
  the Archive): each item is the photograph or memory, who added it, Add to
  the archive / Edit first / Not this one. Nothing a contributor adds appears
  in the archive until the organiser has seen it.
- **Empty states.** Home with no memories: the Figma's photo-stack card with
  "It starts with a conversation" and one button, "Ask Rose the first
  question"; Archive empty: the book object with 0% and "Three memories and
  the first chapter appears"; Family empty: the storyteller alone in the tree
  with the invite card beside.
- **Family news.** Not in the Figma; on the web the organiser's home gets a
  right column: Rose's next call (with Change time / Skip this week), the
  book's count, and a short feed of what the family added — the loop the
  current app closes on a dead end (`flows.md`, Flow 2).
- **The organiser's timeline.** Archive gets a decade list on the left (a
  real timeline by year, not just chapters), year headings in serif, and an
  "In progress" group for calls A Story is still writing up.

---

## 7. Copy rules

Plain, warm, short. Sentences a person would say at the table: "We'll ring
her landline." "Rose can take her time." Buttons are verbs for what happens
(Write it, Keep it, Add to the archive). Nouns the product uses: memory,
story, archive, book, chapter, call, the family. Never "Memoir", never
"legacy", never "content", never "upload". Dates are written out (Thursday,
12 June 1975); approximate ones say so ("About 1950"). The storyteller is
named, not "the user".

---

## 8. Files

- `docs/DESIGN-SYSTEM.md` — this document.
- `docs/mockups/astory.css` — the tokens and every component above.
- `docs/mockups/astory.js` — the recolourable brand SVGs and a 20-line state switcher (mockups only).
- `docs/mockups/01-sign-in.html` (sign in · create account · code), `02-home.html`,
  `03-live-conversation.html` (speaking · listening · ended), `04-archive.html`,
  `05-memory.html`, `06-family.html`. Photographs are the locked visual library
  via `landing-page-publish/public/mission/*.webp`; the family is fictional (the
  Hartleys: Rose, Walt, Dan, Sarah, Mia).
- `docs/mockups/shots/` — every page at 1440×900 and 390×844 (`*-full.png` is
  the whole page), produced by `shots/shoot.mjs`.
