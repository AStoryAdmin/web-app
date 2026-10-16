# A Story on the web — the two-minute demo

For the YC interview or a partner meeting. One presenter, one laptop, one browser with two windows open side by side. The brief caps the demo at about 45 seconds on a slide with a screenshot fallback (deck handoff, "Presentation rules"); this is the full two-minute version for a live product walk.

**Before you start**
- Demo data, clearly labelled on screen as demo data: the family is Rose (storyteller, grandmother), Jamie (her grandchild, the buyer, signed in), and Linh (Rose's daughter, no account). These are the names in the app's own fake data (`src/dev/fakeData.js`, README). They are not customers and must never be described as customers (deck handoff, "Product and asset rules").
- Rose's story already has 13 memories, so the book has pages and the depth ladder is past warm-ups.
- Window A: signed in as Jamie, on Home. Window B: an empty private window.
- Microphone allowed in Window A. One short answer rehearsed as Rose (the presenter plays Rose; say so out loud).
- The Talk feature depends on the AI server accepting a browser client (PRD §8, risk 1). If it is not live on the day, skip step 2 and use the written path; the script below marks the cut.
- Nothing is said about printed-book shipping unless `BOOK_ORDERING_OPEN` is on (deploy §3a).

Timings are what to aim for. Total: 2:00.

---

## 0:00 — Home (Window A)

**On screen:** Home. "Good evening, Jamie." Storyteller switcher reads "Rose — Grandmother". The week strip shows dots on three days. The card: "A little question for today, What did summer smell like where you grew up?" Two buttons: **Talk**, **Write it**.

**Say:** "This is A Story. Jamie bought it for her grandmother Rose. Every day there's one question, in Rose's voice, not Jamie's. Rose can talk or type. Today she talks."

**Click:** **Talk**.

## 0:15 — The conversation (Window A)

**On screen:** `/talk`. The question in large type. A waveform. A live transcript fills as the presenter speaks. After the answer, A Story asks one follow-up that uses a word from the answer: "You said cut grass. Who was cutting it?"

**Say (as Rose, about twenty seconds):** "Cut grass, and hot tarmac. And my father's tomatoes against the south wall."

**Say (as presenter):** "One question at a time. It follows what she said, not a list. The next question comes from her last answer. Nobody's fifth memory is 'what do you regret' — the questions get deeper only as the archive earns it."

**Click:** **That's enough for now**, then **Keep it**.

*(Cut if Talk is not live: click **Write it**, type the same two sentences, click **Save**, pick the "Childhood" decade chip. Say: "Typing is the same loop. Talking is the paid part; writing is free forever.")*

## 0:45 — Saved (Window A)

**On screen:** Back on Home. A green line: "Saved to Rose's story. There's time for another — 2 more questions waiting today." The new card, "Summer, cut grass and tomatoes", at the top of Recent memories, with a play button.

**Say:** "It's kept three ways: a short card, the whole transcript word for word, and her voice. The loop ends with a next step, not a filing cabinet."

**Click:** **Family** in the sidebar.

## 0:55 — Invite (Window A)

**On screen:** `/family`. A roster: Rose (storyteller), Jamie (arrived), Minh (invited). A six-letter family code. A **Share a link** button.

**Say:** "Here's the part the memoir products don't do. Rose's daughter Linh wasn't asked. She doesn't have the app. She gets a link."

**Click:** **Share a link**, copy it, paste into Window B.

## 1:05 — Linh, no account (Window B)

**On screen:** `/c/rose-nguyen`. "Contributing to Rose Nguyen's story." Rose's new card is shown at the top. Fields: Your name, How you knew them, a box, Add a photo, an optional email line "so we can tell you when the family adds this."

**Say:** "No app, no sign-in, one page."

**Type:** Linh · Daughter · "It wasn't tomatoes, it was beans. And it was my grandfather, not hers. We never agreed on that." Email: a demo address.

**Click:** **Send to the family**.

**On screen:** "Thank you. Your memory is waiting for Rose's family." Below it: "You're listed in the Nguyen family as Rose's daughter. Claim your place."

**Say:** "She's already in the family tree. Claiming her place is one click, not a sign-up."

## 1:25 — Approve, and the two versions (Window A)

**On screen:** Family now shows "1 waiting for you." Click it. Linh's note, with her name and "Daughter".

**Click:** **Add to the story**.

**Click:** the memory card. `/archive/:id`.

**On screen:** Rose's card and transcript. Underneath, a section "What others remember": Linh's version, attributed "Linh, Daughter". Nothing merged. Both stay.

**Say:** "One moment does not need one official version. Rose remembers tomatoes. Linh remembers beans. The archive keeps both, with names on them. That's the product: a documentary, not a diary."

## 1:40 — The book (Window A)

**Click:** **Book**.

**On screen:** `/book`. The cover, "Rose Nguyen, 1938–". Pages turn: a chapter page, a memory page with the card set large, Linh's line beneath it credited, a photograph. Prices on the right: Print at home, free. Digital Edition $19. Classic Hardcover $69 — "included with your plan, you pay shipping."

**Say:** "Every memory, every photo, every other voice, laid out as a book you can read page by page on a big screen. Printing it at home is free. A hardcover comes with the plan. The book is a chapter. The archive keeps going."

## 1:50 — What's paid (Window A)

**Click:** **Plans** (from the account menu).

**On screen:** `/plans`. Free: three questions a day, unlimited writing, unlimited family, $0. Individual: $119 a year, 90 minutes of calls a month. Family: $229 a year, three storytellers, 200 minutes pooled. A "Buy" button on each.

**Say:** "Reading, writing and the family are free, always. What's paid is A Story doing the asking — the calls — and the books. Jamie pays $119 a year on the web, by card. No app store in between."

## 2:00 — Close

**On screen:** back to Home.

**Say:** "Adult child buys. Parent talks. Family adds. Book prints. The archive stays open. That's A Story."

---

## If something breaks

- **Talk won't connect:** take the Write path at 0:15. The rest of the script is unchanged.
- **The contribute link 404s:** the domain is not decided (PRD §8, risk 6). Have Window B already open on the contribute page before you start.
- **Approval email doesn't arrive:** it is not needed on screen. Don't mention it.
- **Anything else:** the screenshot fallback deck, one screenshot per step above, in this order.

## What is not shown, on purpose

- No phone ringing. The web does not ring a phone; the app does (PRD §10).
- No family call, no group call, no letters. Those are v1.5 (PRD §4).
- No shipped book. Ordering opens when the printer is set up (deploy §3a).
- No numbers about customers, retention or revenue. There are none yet (deck handoff, "Evidence rules").
