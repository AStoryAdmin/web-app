# Product decisions for the web version

What the web does differently from the phone app, and why. The founder gave
the web full freedom to redesign; this is the list of what that freedom was
used for, so nothing is a surprise. The brand, the accounts and the data are
the app's. Everything else was open.

Sources: `docs/PRD.md` (the requirements), `phone-app/docs/product/flows.md`
(where the app leaks), `phone-app/docs/next-session-prompt.md` (the lead's
rules), `docs/PORTING-MANIFEST.md` (what the backend can do today).

## 1. One idea on every screen

The app grew screen by screen; the web has four places and one button.

| Place | What it is for | Nothing else |
|---|---|---|
| Home | Today: one question, one write box, what the family added this week | no settings, no counts, no stats |
| Archive | Everything, by chapter or by year, searchable | no progress bar (that is the Book's) |
| Family | Who is in it, who has arrived, add someone, review what they sent | no friends, no circles |
| Book | The whole book as pages, print at home, the editions and their prices | no design wizard in v1 |
| + | Write · Add a photo · Talk | — |

Account lives behind the avatar. The storyteller switcher ("Rose ▾") is the
one control that appears everywhere, because every place is about one person.

Dropped from the Figma for v1: Memoir tab (renamed Book; "memoir" and
"legacy" are banned words in this product), Friend Requests, Trusted Circle,
friend suggestions, phone-contact scanning, Face ID, language switching,
Memory Milestones. Each is either a social-network feature this product has
decided not to be (family-tab.md), or a phone-only capability.

## 2. The first two minutes

No intro slides. Welcome → create account (name, email, password, optional
family code) → six-digit code → "Whose story is this?" → Home with today's
question and the write box already open. A first memory in under two minutes
is a measured target (`analytics.first_week_summary`).

Somebody arriving with a family code or an invitation skips "Whose story is
this?" and lands on the story they were invited to; a "Myself" story is made
for them quietly, so they have somewhere for what they remember.

## 3. Write first; Talk hands off to the phone until v1.5

The browser cannot ring anyone. In v1 the Talk button opens a small sheet:
"To talk, open A Story on your phone - it rings at the hour you chose.
Talking here in the browser is coming." The write box is the primary action.
In v1.5 the sheet becomes the live conversation (WebRTC in the browser),
and Talk becomes primary.

## 4. The write box is a real editor

The phone's composer is a phone's. On the web: a wide page, the question at
the top, autosaved drafts (this browser, keyed by story), paste or drag a
photograph, "Help me write" (tidy, a title, what the memory doesn't say yet),
the date as one row of decade chips bounded to the storyteller's life, and
chapter chosen for them from the date and the question (changeable). Save
confirms in place and offers the next question; it never dumps the person in
the Archive.

## 5. Every memory shows more than one voice

A memory page shows the storyteller's words, the voice if there is one, the
photographs, who is in it, and under it every other version the family sent
("Linh, her daughter: …"), each attributed, never merged. Below that, one
line: "What do you remember about this?" with a box. This is the product's
position (one moment does not need one official version) made into the
page's shape rather than a feature.

## 6. Invitations join the family, not the story

The lead's decision of 13 October stands: a code or an invitation puts
somebody in the family tree, where they can read the memories marked public
and add their own version. Keepers (people who can edit the story) are a
separate, deliberate choice from "Who can edit". The web never promises
story access from a code.

A relative without an account who sends a memory through `/c/:slug` is
offered their place in the family afterwards, by email, and told when the
family keeps what they sent.

## 7. Walls that sell

Three walls, one shape: keep the person's work on screen, say what is
included, name the price in full ("$119 a year"), offer the free path.
Never a wall on reading, writing, inviting, or a relative contributing.
There is no trial, and the web never mentions one.

## 8. The book is a web object

The Book page shows every page of the book, not one memory and "12 more".
Print at home is free and is a button, not a plan. The editions and their
prices come from the server (`create-book-checkout`, `BOOK_PRICES_JSON`), so
a price change needs no deploy. Printed ordering stays off until a printer
exists; the page says "Tell me when printing opens" and records the interest.

## 9. What the web adds that the app does not have

- **This week in the family** on Home: what relatives added, who arrived,
  what is waiting for review. The Sunday email links here. The web is the
  return path for the nineteen people in a family of twenty who are not the
  storyteller.
- **Ask the family**: from any memory, "Ask Dan what he remembers" sends one
  question to one person (family_questions.sql), and Home shows the
  questions waiting for *you*.
- **Keyboard and clipboard**: paste a photo, drag a folder of photos, type.
- **A hidden `/debug` page** that says which backend features the server has
  (the manifest's probe), so a tester never guesses.
- **Memory paper colours** (the Figma's pastel cards) are kept as a display
  feature: a card takes its chapter's tint unless the family chose one.

## 10. Things deliberately left alone

- The phone app's data shapes, column names, chapter names, date parsing,
  question deck and book progress: copied, not rewritten (`src/app-core`).
- Prices and product facts: from the server and `landing-page-publish/src/lib`.
- Nothing simulates anybody. No voice clone, no "ask Grandma" bot.

## 11. Design decisions confirmed by the founder (16 Oct 2026)

- Desktop: the chocolate left rail (the book's spine); phone: the Figma's curved top bar and bottom tabs.
- Type: Montserrat for interface, Source Serif 4 only for what a person said.
- The Book page in v1: the teal book with progress, then every chapter as page spreads in the print book's type, print at home, editions and prices.
- Memory papers: a card takes its chapter's tint unless the family chose a paper; no mood chips.
- Create account: email only (no phone sign-in exists); the code field is a family or referral code and promises nothing.
