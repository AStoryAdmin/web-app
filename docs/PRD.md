# A Story on the web — product requirements

Written 16 October 2026. For the founder, the designer and whoever builds the web version.

The web version is a signed-in web app at one address. It works first on a laptop or iPad, and also on a phone. It uses the phone app's Supabase project and accounts: a person who signs in on the web sees the same stories as in the app. It does not replace the phone app; the phone app still rings the storyteller. The web is where the family reads, writes, talks from a desk, invites, and buys.

Every product fact below names its source in brackets. Where two sources disagree, the disagreement is stated and one is chosen with a reason. Nothing here is a price, a feature or a number that is not in a source.

**Sources used.** `A-Story-Claude-Final-Brief-2026-09-23.md` (the brief), `A-Story-Investor-Scale-Direction-2026-09-23.md` (scale direction), `A_STORY_COMPETITIVE_LANDSCAPE_2026.txt` (landscape), `A_STORY_HOME_COMPARE_POSITIONING_GUIDE.txt` (positioning), `phone-app/README.md`, `phone-app/HANDOVER.md`, `phone-app/docs/product/flows.md` (flows), `phone-app/docs/interviewing-method.md` (method), `phone-app/docs/deploy-2026-10.md` (deploy), `phone-app/docs/next-session-prompt.md` (lead's rules), `phone-app/docs/product/family-tab.md` (family tab), `phone-app/docs/questions/audit.md` and `ideas.md`, `phone-app/content/questions.csv`, `phone-app/src/data/eras.js`, `landing-page-publish/src/lib/pricing.ts`, `product.ts`, `founding.ts`, `seo.ts`, `landing-page-publish/src/pages/site/faqData.ts`, `landing-page-publish/design.md`, `web-app/docs/figma/*.png` (Figma), `phone-app/docs/product/screenshots/*.png`.

---

## 1. Thesis

An adult child buys A Story as a gift for a willing parent or grandparent who will talk but will not write a memoir. The parent is the storyteller. Relatives take part: they read, add what they remember, correct a date, add a photograph. They are participants, not customers (scale direction, "Initial target customer"). The company earns money from guided interviews and from printed books; reading the archive, writing in your own words and family participation are free on every plan, including after a plan stops (pricing.ts `FOREVER`; scale direction, "Long-term ambition"). The product is not a memoir to finish. It is a family record built around the memory, where different people's versions of the same afternoon sit side by side and the original voice stays underneath the card (landscape §28; positioning §2). The web version exists because the buyer organises from a laptop, the storyteller reads and talks better on a big screen with a big font, a relative with a link should be in within one click and no app, and the book is a web object, not a phone object.

---

## 2. Personas and what each needs on the web

### 2.1 Rose, 75, the storyteller, on an iPad or a laptop

- Reads with glasses. Body text at 16px minimum on the web; the phone app's floor is 13px (lead's rules, "Accessibility") and the web can afford more. Every button at least 44px tall (design.md, "Ship rules").
- Opens one address, signs in once, and stays signed in. Email plus a six-digit code (Figma 10, "Verify Code") beats a password she forgets.
- Wants one question, and one big button to answer it by talking. The browser can hold a live conversation with the microphone; the phone app's live call is native-only (README, "Live calling is native-only"). On the web she sits down and presses Talk.
- Wants to read back what she said, and hear it. The memory page shows the card, the full transcript and the voice highlight (product.ts `MEMORY_LAYERS`; Figma 01 and 26).
- Never sees billing, moderation or settings unless she looks for them. Her plan is usually paid by someone else (scale direction, buyer vs storyteller).

### 2.2 Jamie, 42, the adult child, organising from a laptop

- Sets up Rose's story, invites the family, approves what relatives send, orders the book, pays. Today each of these is a different phone screen with a different mechanism, and the invite that is easiest to find grants nothing (flows, Flow 3).
- Needs one Family page that answers "who is in this family, who has arrived, who has not" (family tab, "The screens").
- Needs the book on a big screen: every page, not one memory and "and 12 more" (flows, Flow 5).
- Needs to pay with a card on the web without the App Store's 15% (brief, "Modeled economics": 3% web / 15% App Store).
- Needs to know the archive outlives her account and Rose's (flows, Flow 7).

### 2.3 Linh, 50, a relative who got a link or a code

- Has no app and may never install one. Taps a link in a text or an email, sees something Rose said, and can add her own version in under a minute with no account (flows, Flow 4: the contribute page is "real and good").
- If she gives an email, she is told when her memory is accepted, and offered her place in the family (flows, "What was fixed" #5; family tab, "Does a contributor without an account ever get pulled into the graph?").
- If she has a six-letter family code, she is in the family whatever email she signs up with (deploy §2, file 9: `family_codes.sql`).
- When she does make an account, she lands on Rose's story, not on a blank "start a new story" form (flows, fix #4).

---

## 3. The core loops and how the web closes them

The phone audit found the loops leak at exact points (flows). The web is a chance to build each loop closed from the first day.

### 3.1 First run → first saved memory in under two minutes

Phone today: about 30 taps and 90–150 seconds, 34 seconds of which is an intro that can only be tapped through, and the Welcome screen is addressed to the storyteller when the buyer is holding the phone (flows, Flow 1).

Web:
1. Welcome page: one headline, "Get started", "I already have an account" (Figma 04 buttons; the Figma headline is replaced, see §6).
2. Create account: name, email, password, optional code (Figma 07–09). Google and Apple sign-in beside it (Figma 06). A six-digit code by email confirms the address (Figma 10).
3. One question: "Whose story is this?" — "My own" or "Someone in my family", then their name and how they are related (phone `NewStory`, flows Flow 1). If the person arrived with a family code, this step is skipped and they land on the story they were invited to (deploy, file 9; flows fix #4).
4. Home opens on today's question with a write box already on the page. Typing is faster than the phone and the date sheet is one row of decade chips (flows, Flow 2: "Excellent"). In v1 the Talk button beside it points at the phone app (§4, item 6); from v1.5 it opens the conversation in the browser.

Target: a first memory saved in under two minutes from the Welcome page, measured as `analytics.first_week_summary` "median minutes to a first memory" (deploy §5). No intro slides. The intro's writing (flows, Flow 1: "the best writing in the product") moves to the Welcome page and the marketing site.

### 3.2 The daily question loop ends with a next step

Phone today, after the fix: saving returns to Home with "Saved to Rose's story. There's time for another — 3 more questions waiting today." (flows, fixes #6 and #7). The streak was hidden in the Archive header (flows, Flow 2).

Web: same closing beat, and Home shows the week strip and the streak at the top (Figma 05 shows "12 | Streak" in the Archive; the web puts it on Home). Three guided questions a day on Free, chosen by the deck with a depth ceiling that rises with the archive (HANDOVER, "depth 1–5"; product.ts `DEPTHS`). The faith chapter is open to everyone, unmetered (HANDOVER, "Free tier"). Sensitive questions carry the line "Leave it for another day if today isn't the day." (product.ts `SENSITIVE_LINE`).

The web adds one thing the phone cannot: the weekly digest email (deploy §2 file 4) links straight to the web memory page. Clicking the Sunday email opens the memory in the browser with no app. This is the return path for relatives.

### 3.3 The invite loop actually grants access

Phone today, after the fix: "Invite family members" writes a `story_managers` row; the person is opened on the story they were invited to; family codes exist (flows, fixes #3 and #4; deploy file 9).

Web: one Family page with one "Add someone" action (family tab, "The screens"). Adding someone takes a name, their relation to the storyteller, and optionally an email. If an email is given, an invite is sent and a `story_managers` row is written (keeper of the story) or a `people` row with status invited (reads the family's public memories) — the family chooses which with one toggle, "Can they edit Rose's story?" (collaborators.sql via deploy; `family_reading.sql`, deploy file 15). The page also shows the family code and a link (`?ref=CODE`, deploy §5b). The roster shows three states per person, in these words: "not on A Story yet" (listed), "invited · waiting for them" (invited), "on A Story" (active) (family tab, "A family of two versus a family of twenty").

At n=2 the Family page is a single card: "It's you and Rose so far. Who else was there?" (family tab).

**Every way an invitation leaves the product, and where each stands (checked 16 Oct 2026, one real send from the founder's account).**

| Path | What the web does | What the server does | What the recipient gets | Status today |
|---|---|---|---|---|
| **Invite by email** (Family → Invite someone, with an email; Person page → Send the code) | Writes the `people` row and edges, `invite_person(pid, mail)` (status `invited`, email recorded), `family_code_for(pid)` for a one-use 30-day code, then `functions.invoke("send-invite-email", { to, storyName, referralCode: CODE, senderName })`. Shows the code, the web join link, a QR and "Sent to …", or "The email didn't send: <reason>. The code still works: ABC 123". | Edge Function `send-invite-email` (phone app) sends through Resend from `A Story <invites@astoryapp.com>`. Subject: `<Sender> invited you to <Story>'s memories on A Story`. Body: the code in a box, button 1 → `${INVITE_JOIN_URL \|\| https://astoryapp.com}/?ref=CODE` ("Join in your browser →" when the secret is set, else "Download the app →"), button 2 → `astory://signup?ref=CODE`. | The email with the code. | **Works** (function answered 200 in the test). **The email's button is dead until deployment**: `INVITE_JOIN_URL` is unset or points at `app.astoryapp.com`, which is not live, and the fallback `astoryapp.com/?ref=` is the marketing site, which cannot sign anyone in. The code in the email works regardless. |
| **The family code** (same sheet, no email; Family → Codes you've sent) | `family_code_for(pid)`: six letters, no I/L/O/0/1, one use, 30 days; the same code comes back while it has a week left. Listed under "Codes you've sent" with days left; **Revoke** deletes it. A story code (`sid`, 10 uses) is only made for keeper invites. | `family_codes` table, RLS: only the maker sees or deletes theirs. `join_family(code)` redeems it; ten wrong guesses an hour and it refuses for an hour. | Six letters, by text, on paper, read out. | **Works.** |
| **The join link** `/join/:code` | Built by `joinUrl()` from `siteUrl()`: the dev server's own address in dev, `VITE_SITE_URL` when a build sets it, else the address the page is served from. Signed out: shows the code and "Create an account" (`/create-account?code=`) / "Sign in" (back to the link). Signed in: `join_family` at once and says what happened; wrong, run-out or used codes offer "Type a different code" (`/start?another=1&join=1`). | `join_family`. | A page with their code on it. | **Works** on whatever host serves the app. Was hard-wired to `https://app.astoryapp.com`, a dead link; now follows the host. |
| **The `?ref=CODE` link** (the email button, the phone app's `joinLink()`) | Nothing. `/` is behind sign-in; `RequireAuth` carries `?ref=` through sign-in and Home ignores it. Only `/create-account?ref=` reads it. | — | Signed out: the sign-in page. Signed in: Home, code dropped. | **Not wired on the web.** Needs one redirect in `App.tsx`: `/?ref=CODE` → `/join/CODE` (and `/create-account?ref=` already works). |
| **The contribute link** `/c/:slug` | The page works: `get_contribute_info(slug)`, `submit_contribution(...)`, photos to `contribution-photos`. `contributeUrl(slug)` exists in `familyView.ts`. **No web page shows or copies the link** (`stories.contribute_slug`); the MANUAL's "Share a link" button is not on Family. | `submit_contribution` lands a pending row; `contributor_email` is stored, nothing is sent on approval. | A page to send a memory, no account. | **Page works, link not surfaced.** No approval email exists (the page's hint no longer promises one). |
| **The keeper invite** (Family → Who can edit → Invite a keeper) | `story_managers` insert (pending), then `send-invite-email` with the story's family code (`family_code_for(sid)`); before this fix it sent `referralCode: ""`, which the function refuses with 400 "Invalid code", so the keeper email **never went** from the web. `inviteManager` now returns `{ emailed, code, reason }`. | `accept_story_invites()` at sign-in links the row by email and makes it active. | The same invitation email (subject as above). | **Works after the fix**, same dead-button caveat. The keeper also gets a place in the tree from the code. |
| **The story join request** (`/start?another=1&join=1` → Ask to join) | `request_story_join(sid, my_name)`; the keeper answers on `/family` under Waiting for your review (`answer_story_join`). | Refuses anyone outside the household. No email either way. | Nothing by email; they see it in the app. | **Works, in-app only.** |

**What the Edge Functions need (phone app's code, not changed here):** `supabase secrets set INVITE_JOIN_URL=<the web app's address>` the day the web app is hosted (the function already builds `${INVITE_JOIN_URL}/?ref=CODE` and relabels the button "Join in your browser"); then the web's `/?ref=` redirect above, or change the function to build `/join/CODE`, which the web answers today. `send-invite-email` could also return the Resend id so the sheet can say "sent" with more than a 200. Nothing sends on contribution approval; that is new work (§4).

### 3.3a Three ways to be in a story. Read this twice.

This is the part the phone app gets wrong, and it is a critical bug there (seen on 17 Oct 2026 in the founder's test account: "Nhi Tran" exists as a story the founder keeps *about* her, as a person in the tree three times over, and as her own account; the founder was writing memories "as told by Nhi" into a story Nhi cannot see). The web must never let that happen. There are exactly three relationships between a person and a story, and the words on screen name which one is happening.

| | What it is | Database | What you can do | What you can never do |
|---|---|---|---|---|
| **Your story** | The story about you. `relationship = Myself`, `owner_id = you`. One per account, made on first need. | `stories` | Everything. | — |
| **A story you keep for someone** | A story *about* a person who is **not on A Story** (or who would rather you did the typing): a grandparent, a late parent. `relationship = Mother/…`, `owner_id = you`. You are the keeper; what you write is kept in their name, "as told to you". | `stories`, later `story_handovers` | Write what they tell you, in their voice. Invite keepers. Hand the story to them if they ever join (`story_handovers`). | Create one for a person who already has an account. The web asks first ("Someone who is already on A Story" on `/start`) and sends you to join theirs instead. |
| **Joining someone's story** | A person who **has an account** and their own story. You join it with their family code or link (`/join/:code`), or ask (`story_join_requests`, pending until they accept). | `story_managers` (keeper, can edit, pending → active), `people` + household (family, reads what is public), `story_join_requests`, `contributions` | Read what they chose to share. Add what *you* remember, under your own name; they approve it (`contributions`, pending → approved) and it prints with your name. A keeper can also edit. | Write *as* them. Nothing on the web ever signs your words with their name. |

The Whose-story switcher (the storyteller button) lists all three, in three groups with the headings "Your story", "Stories you keep for someone", "Stories you've joined", never mixed, one line of meaning under each. A story is "joined" when its `owner_id` is not you: the `stories` select policy only shows a story to its owner and its active keepers, so every story you can see and do not own is one you keep for its owner. "Keep someone else's story" on that sheet (sub-line: "for someone who isn't on A Story yet") goes to `/start?another=1`, where the first question is the one above. "Join someone's story" goes to `/start?another=1&join=1`, which opens the join branch: their family code, or "Ask to join" for a story already kept in your household (`request_story_join`; the function refuses anyone outside the household, so everyone else needs the code). A join request is answered by a keeper on `/family` under "Waiting for your review" (Accept makes the asker an active keeper, `answer_story_join`), and the asker sees it under "Waiting on others" until then.

**Adding someone to the family tree, and when they appear on the other side.** Adding a person on `/family` creates a `people` row with `status = listed`: a name you know, visible only inside your household, marked "not on A Story yet". Sending them an invite makes it `invited`. When they accept (sign in with the code or the link), `claim_people()` sets `people.user_id` and the status becomes `active`; only then do they see your family, and you see theirs, because you are now in the same household. Until they accept, nothing you added appears on their side, and nothing about them is sent anywhere. Suggesting a change to someone else's person (a birth year, a spelling) is a `person_suggestions` row, pending until someone who may edit that person accepts it; it waits on `/family` under "Waiting for your review" for them, and under "Waiting on others" for whoever suggested it. Adding by email must match an existing `people` row with that email before creating a new one, so a person is never listed twice (the duplicates in the screenshot are this rule not being applied). The match has to happen on the client, before the insert: the database keeps one email per household (`people_household_email_key`), but the save answers the clash by dropping the email from the new row rather than failing, which is exactly how a silent second copy is made. A name already listed and not yet on A Story asks "Is this the same person?" before a second row is written. People already listed twice are shown once on `/family` ("Looks like X is listed twice") with the way out that fits: `merge_people(keep, fold)` when at most one row has a story (it refuses two accounts and two stories); when each row has a story of its own, the stories merge first (`propose_story_merge`, done at once when one account owns both, which re-points both rows at the story that stays), after which the extra row can be removed without loss. The founder's three "Nhi Tran"s were three stories about her, which is why they could not simply be merged as people.

**What can be seen, by whom.** Every memory is Public or Private (`memories.privacy`: `shared` is the default and means Public; `private` means you and the story's keepers). Public means the family on A Story (the household and the keepers), and the wall if it is on. The wall (`/p/:slug`, `stories.is_public` + `public_slug`, `get_public_story`) is one page anyone with the link can read: only Public memories, never anything still being written up, plus the approved family additions. It is off until the owner turns it on in Account → The wall, and the link can be copied from there or from the Archive. Turning it off makes the link show nothing. The switch on a memory is on the memory page; the switch for the wall is on Account; the Archive says in one line whether the wall is on.

### 3.4 Contributor → account

Web route `/c/:slug` is the existing contribute page, moved into the web app (flows, Flow 4: today it lives in `a-story-landing`). Fields: name, how you knew them, a memory or a note, up to a few photos, and an optional email "so we can tell you when the family adds this" (flows fix #5). After "Send to the family" the page shows the memory in place beside Rose's, marked "waiting for the family", and one line: "You're listed in the Nguyen family as Rose's daughter. Claim your place" (family tab, three steps). Claiming creates an account and sets `people.user_id` on the row that already exists (`claim_people()`, family tab "Update").

When Jamie approves it, the memory keeps the contributor's name on the card and in the book (`memories.contributor`, flows fix #5), and Linh gets an email with a link to the web memory page. The email send on approval is new work (see §4).

### 3.5 Archive → book

Phone today: the preview shows one memory; "20 memories makes a first edition" is printed and not enforced; the price appears once at the bottom (flows, Flow 5).

Web: `/book` shows the whole book as pages, every memory, on a big screen. Print at home is free, always (pricing.ts `BOOK_EDITIONS`). Each printed edition shows its price on the same page: Digital Edition $19, Softcover $39, Classic Hardcover $69, Heirloom Edition $149, Full-Service Edition $499 (pricing.ts; deploy §3a says these are proposals to confirm before launch). On the name: pricing.ts says "Full-Service Legacy Edition"; deploy §3a says it was renamed "Full-Service Edition" on 2026-10-09 and the order's `edition` value stays `legacy`. The web uses the later name, which also keeps a banned word off the screen. A member's Classic Hardcover is included each year and shown as "included with your plan — you pay shipping" (pricing.ts `BOOK.members`). The "20 memories" line is dropped as a requirement and shown as a suggestion: "Most families print their first edition at around 20 memories" (flows, item 11: a product decision; this is the decision).

The Digital Edition cannot be sold through Stripe on the phone (deploy §3a, App Store 3.1.1). On the web it can. That is a web-only revenue line.

### 3.6 Free → paid, with the price visible at every wall

Phone today: four walls; the best one names the limit and what stays free; the live-call wall was fixed to keep the question, name a price and offer "Write it instead" (flows, Flow 6 and fix #6).

The web has three walls and each follows the same shape: keep what the person was doing on screen, say what is included, name the price, offer the free path (see §7).

On the "trial": flows.md and the phone pricing screenshot (`f6-01-pricing.png`) describe a 3-day trial with daily calls. pricing.ts says the trial was removed on 2026-09-28 and that "Everyone starts on Free, with no card and no clock" (pricing.ts, note 3). deploy §3a adds that "Free accounts now get one 10-minute conversation with A Story". **Decision:** the web follows pricing.ts and deploy: no 3-day trial; every free account gets one 10-minute conversation, and that is what the wall offers first. Reason: pricing.ts is the later source and is marked as the one Stripe actually charges.

### 3.7 Account death and handoff

Phone today, after the fix: deleting an account hands a shared story to its longest-standing co-manager, and the delete screen names who will inherit (flows fix #1, `ownership.sql`). A trusted person can be set and letters release after six months of inactivity (deploy file 16, `letters.sql`: `profiles.trusted_user_id`, `last_active_at`).

Web v1: the Account page has a "Who looks after this if I can't" row that sets the trusted person (`set_trusted_person`, deploy file 16) and a Delete flow that shows the transfer before the decision, in the same words as the phone (flows fix #1). The inactivity cron is already in `letters.sql`; the web reads its result. Nothing on the web may say "legacy" or "before it's too late" on these screens (lead's rules, "Copy").

---

## 4. Scope

A focused v1 beats a port of the app's 36 screens (HANDOVER: `capture-screens.mjs` photographs 36). The Figma has 30 frames (Figma 01–30); v1 ships the ones on the loops above and leaves the social-network frames out (see §8, risk 5).

Each line: feature — why — what it depends on (backend) — status of that backend.

### v1 — ship for the YC demo and the first paying families

| # | Feature | Why | Depends on | Backend status |
|---|---|---|---|---|
| 1 | Sign in, create account, email code, forgot password, Google and Apple sign-in | Rose must get in without a password she forgets; the phone has no OTP or social sign-in yet (HANDOVER "Auth screens"; Figma 06–10, 20–21) | Supabase Auth | Exists (README) |
| 2 | Family code and `?ref=` link on sign-up and sign-in | The one invite that works for people whose email you don't have (deploy file 9; §5b) | `family_codes.sql`, `join_family` | Written, on `review-fixes`, not yet run live (deploy §2) |
| 3 | First run: "Whose story is this?" then Home | Under two minutes to a first memory (§3.1) | `stories`, `profiles.onboarding_complete` | Exists |
| 4 | Home: week strip, streak, question of the day, Talk and Write, "saved" confirmation with the next step | The loop closes (§3.2); Figma 24–25 | `dailyQuestion.js` ported to the web, `usage.js` | Exists in the app as pure JS (HANDOVER, "src/lib") |
| 5 | Write a memory: question or own words, photos, date sheet with decade chips, chapter, "Help me write" | Typing is the web's advantage; Figma 27–28 | `memories`, `memory_photos`, `/api/memory/help` | Tables exist; `/api/memory/help` has a phone fallback until the server adds it (deploy §4) |
| 6 | Talk, on the web, points at the phone: the Home card's Talk button opens a short sheet — "To talk, open A Story on your phone; it rings at the hour you chose. Talking here in the browser is coming." — and the written path stays primary | **Founder's decision, 16 Oct 2026: the live conversation in the browser is v1.5, not v1.** Write, the archive, the family and the book ship first; the browser call follows once the AI server accepts this origin (§8, risk 1) | nothing new | — |
| 7 | Archive: by chapter and by year, search, memory page with card, transcript, voice highlight, photos, who's in it | Figma 05, 26, 30; product.ts `MEMORY_LAYERS` | `memories`, `memory_audio.sql`, `memory_people.sql`, `timeline.js` | Exist (deploy files 7 and 4 note) |
| 8 | Family page: roster with three states, "Add someone" (name, relation, optional email), invite by email, code, link, review what was sent | The invite loop is the flow that decides whether the product works (flows, "Which single flow") | `family.sql`, `collaborators.sql`, `family_codes.sql`, `contributions.sql`, `send-invite-email` | Exist; `family.sql` had no app screen writing to it on `brand-refresh` (family tab, "Update") |
| 9 | Contribute without an account at `/c/:slug`, with optional email and "Claim your place" | The cheapest second account in the business (flows, Flow 4) | `submit_contribution()`, `contributions.contributor_email`, `claim_people()` | Exist. The approval email is **new**: one Edge Function through Resend, which is already set up for invites (deploy §3) |
| 10 | Another version of the same memory: a relative with access adds "what I remember" under Rose's card, attributed, never merged | The competitive position: "one moment does not need one official version" (positioning §4) | `contributions` with `memory_id` (flows fix #2), `memories.contributor` | Exist |
| 11 | Book: full preview as pages, print at home free, Digital Edition by Stripe, printed editions by Stripe when ordering opens | §3.5; the web sells what the phone cannot | `create-book-checkout`, `book_editions.sql`, `BOOK_ORDERING_OPEN`, `BOOK_PRICES_JSON` | Exist; ordering is off until a print company is set up (deploy §3a; pricing.ts `BOOK.opens`) |
| 12 | Plans and Stripe Checkout for Individual, Family, Express and Monthly; three walls | §7 | The app's Stripe Edge Functions (flows, Flow 5: "all six Edge Functions exist") and a Stripe customer portal link for renewals | Exist for the app; the web needs the same functions called from a browser session |
| 13 | Account: profile, storytellers, plan and billing, privacy switches ("Help improve A Story", weekly email), export, trusted person, delete with transfer | Figma 11–12, 17–18; flows fix #1; deploy file 16 | `profiles`, `ownership.sql`, `letters.sql` (trusted person), delete-account function | Exist |
| 14 | Weekly digest links open the web memory page | Return path for relatives with no app (§3.2) | `weekly_digest.sql`, `DIGEST_OPEN_URL` | Exists; set `DIGEST_OPEN_URL` to the web app |
| 15 | Analytics events from the web, numbers only, never words | The pitch's milestones are measured in these views (§9) | `analytics.sql`, `analytics_growth.sql` | Exist |

Out of v1 on purpose: the onboarding slideshow; Friend Requests, Trusted Circle, friend suggestions and phone-contact scanning (Figma 13–14, 17); Memory Milestones calendar (Figma 15); Face ID; language switching; memory colour and mood tags (Figma 27–28; the brief lists nothing like them and they do not serve a loop); a pan-and-zoom family tree.

### v1.5 — after the first families are in

| # | Feature | Why | Depends on | Backend status |
|---|---|---|---|---|
| 15b | Talk in the browser: a live conversation with microphone, live transcript, "Keep it" produces a card; the free first 10 minutes, then the Talk wall (§7) | The demo centrepiece once it works; the phone's call is native-only (README). The method's rules apply unchanged (method §1) | `/api/realtime/session` accepting a browser client (CORS for app.astoryapp.com), `/api/summary`, `api_usage`, `profiles.call_seconds_used` (deploy §3a) | Server endpoint exists for the app; browser support is unverified (§8, risk 1). First item of v1.5 |
| 16 | Letters: a sealed chapter for one person, given now or released later | Built in the backend, nothing on the web reads it; this is the handoff feature families ask for (deploy files 16, 18) | `letters.sql`, `letters_photos_mail.sql`, `letter-mail` function | Written, not run live |
| 17 | A family call in the browser, two people, A Story listening, a link for the second person | The founder's insight: one relative's account changes the next question (scale direction, "Founder insight"); a browser call needs no app on either side | `family_calls.sql`, `family-call-guest`, `/api/realtime/transcription-session`, TURN relay, `family_call_listening.sql` | Written; the transcription endpoint and TURN are server work not yet done (deploy §4, §7) |
| 18 | Photo first: upload a photo, say who is in it, then talk or write about it | Old photos unlock memory faster than any question (ideas #3); the flow is written but not wired on the phone (lead's rules, "Written but NOT wired") | `photoMemory.js`, `memory_people.sql` | Exists in the app, unwired |
| 19 | Import a memoir (Word, text, PDF, photographed pages) and a family tree (`.ged`) | Populates the archive and the roster on day one (family tab "Update"; `family-tree-import.md`) | `/api/import/read`, `importers.js`, `memory_source.sql` | PDF and photo reading waits on the server (deploy §4) |
| 20 | Person page with details (born, grew up, schools, work, faith) and suggestions from relatives | The roster becomes a reason to open the tab (family tab, "Person") | `person_facts.sql`, `people_permissions.sql`, `person_suggestions` | Written |
| 21 | Questions for the witness: "Minh, what do you remember about your grandmother's kitchen?" | Gives nineteen of a family of twenty a reason to come back (family tab, "What does a family member without their own story do on a Tuesday?") | A witness-voice set in `questions.csv` and the `{asker}` placeholder (ideas #8; audit "step 5") | Content work, not built |
| 22 | Memory Milestones: birthdays and anniversaries from the tree, opt-in | Figma 15; dates matter to this audience (ideas #9) | `people` birth and death dates (`person_facts.sql`) | Written. Must be opt-in and marked sensitive (ideas #9) |
| 23 | Facebook sign-in | Figma 06 shows it; lower priority than Google and Apple for this audience | Supabase Auth provider | Config |

### v2 — the family record at scale

| # | Feature | Why | Depends on | Backend status |
|---|---|---|---|---|
| 24 | Group calls in the browser, up to four, with video; A Story listens to whoever has consented | "Two relatives on one call, asking each other" (ideas #5) | `family_group_calls.sql`, LiveKit or TURN, the mesh in `peerMesh` | Written for native; web mesh checked in Chromium only (lead's rules) |
| 25 | Several accounts of one memory as first-class objects, with the family choosing which leads in the book | The documentary position in full (landscape §8; family tab, "Who owns a memory") | `author_person_id`, a memory-accounts table | Not built |
| 26 | Same-person story merge and "ask to join a story" | Two grandchildren each started Grandpa's story (deploy file 11) | `same_person_stories.sql` | Written |
| 27 | Scheduled calls that ring a telephone from the web | The storyteller without a computer; before launch only an iPhone rings (founding.ts, call delivery) | Telephony the company has not chosen (brief lists Twilio rates as model inputs only) | Not built |
| 28 | Answer in the language it happened in; UI languages | ideas #10; a language programme touches every string (family tab, "Face ID + language") | Per-memory language field, translation pass before print | Not built |
| 29 | Full-Service Edition workflow for the team; care communities and organisations | Expansion tests, not v1 (brief, "Business-model rules") | `book_orders.edition = 'legacy'` | Orders table exists; the work is human |

---

## 5. Information architecture and navigation

What a 70-year-old can hold in their head: four places and one button.

**Desktop:** a left sidebar with four items and the storyteller switcher at the top ("Rose — Mother ▾", Figma 24). The "Add" button sits in the sidebar under the four items. Account is the avatar at the bottom of the sidebar.

**Phone web:** a bottom bar with the same four items and a round "+" (Figma 24–25 show Home · Archive · Memoir · +; the web renames "Memoir" to "Book", see §8 risk 4, and adds Family because the invite loop needs a home of its own; family tab, "The screens").

| Nav item | Route | What it shows |
|---|---|---|
| Home | `/` | Greeting, storyteller switcher, week strip with the streak, today's question with Talk and Write, "this month, N years ago" card, recent memories (Figma 24–25; `cur-00-home.png`) |
| Archive | `/archive` | Every memory, by chapter or by year, search, "waiting for your review" strip when there is something to review (Figma 05) |
| Family | `/family` | Roster, this week's additions, add someone, code and link, review what was sent (family tab) |
| Book | `/book` | The whole book as pages, editions and prices, order (§3.5) |
| + | opens a sheet | Talk, Write, Add a photo (lead's rules, item 1: "Add a photo" first) |

Other routes:

| Route | Who | What |
|---|---|---|
| `/welcome` | signed out | Headline, Get started, I already have an account |
| `/sign-in`, `/create-account`, `/verify`, `/forgot-password`, `/reset-password` | signed out | Figma 06–10, 20–21 |
| `/join/:code` and `/?ref=CODE` | anyone | Shows the code large and the family it opens; sign up or sign in with the code filled in (deploy §5b) |
| `/start` | new account with no story | "Whose story is this?" |
| `/archive/:id` | member | Memory page: card, transcript, voice, photos, people, other versions, edit, share (Figma 26) |
| `/write` and `/write?question=ID` | member | The composer (Figma 27–28) |
| `/talk` and `/talk?question=ID` | member | The live conversation |
| `/family/:personId` | member | A person: how they are related, what they added, how to reach them, their story if they have one |
| `/c/:slug` | anyone, no account | Contribute to a story (§3.4) |
| `/p/:slug` | anyone | The public page of a story, if the family turned it on (flows, Flow 4 mentions `/p/:slug` exists) |
| `/plans` | member | Plans and prices; Stripe Checkout |
| `/account` | member | Profile, storytellers, plan and billing, privacy, export, trusted person, delete |
| `/call/:token` | anyone (v1.5) | Join a family call by link |

Nothing is more than two clicks from Home. Settings are inside Account, not in the nav.

---

## 6. Copy principles and the words on the five most important screens

Rules (lead's rules, "Copy"; method §1 rule 10):
- Warm, plain, short. One idea per sentence.
- Never frame anything around finishing, deadlines, legacy, or what cancelling costs. The words "legacy", "deadline" and "before it's too late" do not appear anywhere in the web app. The Figma frames that use them (04 "Leave a Legacy", 11 "Get Legacy Book") are rewritten.
- Never say "immigrant". The audience is not one community.
- They/them for anyone whose pronouns are unknown.
- Every question addresses the storyteller as "you"; a relative is asked about the storyteller in the third person (HANDOVER, "One voice"; method rule 8).
- Lead with what is included, never with what free does not include (flows, Flow 6).
- Never a tally of what has been used up; say what is still waiting (flows, fix #7).
- Prices are written in full the first time on any screen: "$119 a year".
- Headings wrap naturally; no forced line breaks unless the second line reverses the first (positioning §11).

The five screens:

| Screen | Headline | Primary button | Secondary |
|---|---|---|---|
| Welcome (`/welcome`) | **Ask the people you love about their lives.** Below: "A Story asks, listens, and keeps what they say — their voice, their words, and what the rest of the family remembers." | **Get started** | I already have an account |
| First run (`/start`) | **Whose story is this?** | **Someone in my family** (then: their name, and "They are my… Mother / Father / Grandmother / Grandfather / Aunt / Uncle / Partner / Someone else") | My own story |
| Home (`/`), the question card | **A little question for today,** then the question in the storyteller's voice, e.g. "What did summer smell like where you grew up?" | **Write it** (v1) — **Talk** becomes primary in v1.5 | Talk (opens the "on your phone" sheet in v1) · Ask me another |
| Home after a save | **Saved to Rose's story.** "There's time for another — 2 more questions waiting today." Or, when the day is done: "That's today. Three new questions in the morning." (flows fix #7) | **Answer another** | Read it in the Archive |
| Family (`/family`), adding the second person | **Who else was there?** "Add anyone who remembers Rose. They can read what she said and add their own version. It's free for them." | **Add someone** | Share the family code: K7M2QX |
| The Talk wall (Free, first 10 minutes used) | **Talking out loud is on the paid plans.** "Plans start at $119 a year — about $9.92 a month. Writing stays free and unlimited." The question stays on screen below. | **See plans — from $119 a year** | Write it instead · Go back |

(That is six rows because the wall is a screen the brief asked to be treated with care; the first five are the five.)

Welcome headline note: the Figma's "Share Your Life Story. Leave a Legacy." addresses the storyteller when the buyer is usually the one signing up, and uses a banned word (flows, Flow 1; lead's rules). The headline above addresses whoever is reading.

---

## 7. Monetisation on the web

### What is sold, at what price

All prices from pricing.ts, which is marked as the file that mirrors what Stripe charges. The phone pricing screenshot (`f6-01-pricing.png`) shows $154 and $319 bundles; pricing.ts says those were removed on 2026-10-01. The web uses pricing.ts.

| Plan | Price | What it buys | Book |
|---|---|---|---|
| Free | $0, no card, no clock | 3 guided questions a day, unlimited writing, unlimited family, 5 photos a week, print at home free, one 10-minute conversation (deploy §3a) | Print at home |
| Individual | $119 a year (≈ $9.92 a month) | 90 minutes of guided calls a month, one storyteller, all questions, unlimited photos | A Classic Hardcover each year, or its $69 toward a finer edition, plus the Digital Edition |
| Family | $229 a year (≈ $19.08 a month) | 200 minutes a month pooled, up to three storytellers | A Classic Hardcover for each storyteller each year |
| Express | $79 one time, about 30 days | 140 minutes, one storyteller, nothing renews | A Classic Hardcover with the pass |
| Monthly | $19.99 a month | No yearly commitment; Digital Edition included; printed books from $39 | — |

Book editions: print at home free; Digital Edition $19; Softcover $39 ($29 each further copy); Classic Hardcover $69 ($49); Heirloom Edition $149 ($119); Full-Service Edition $499 (pricing.ts `BOOK_EDITIONS`; name per deploy §3a, see §3.5). Printed ordering stays off until a print company is set up (deploy §3a). Deploy §3a says the prices are proposals to confirm before launch.

Pre-launch offers stay on the marketing site, not in the web app: Reserve $1 (15% off the first year if reserved by 2 November) and Founding Family $29 (25 places, 50% off the first year); the discount is a Stripe coupon on an annual plan bought on the web (founding.ts). The web app's checkout must accept that coupon.

The investor model assumes 80% Individual and 20% Family, or $141 per paying account per year; that is a model input, not a target the product shows anyone (scale direction, "$100M").

### Where the walls are and what they say

Three walls. Each keeps the person's work on screen, leads with what is included, names the price, and offers the free path (flows, Flow 6: the model is wall 2; fix #6).

| Wall | When | Headline and body | Buttons |
|---|---|---|---|
| Talk | Free account presses Talk; first 10 minutes unused | **Your first conversation is free.** "Ten minutes, no card. After that, plans start at $119 a year." | **Start talking** · Write it instead |
| Talk | Free account, 10 minutes used; or a paid account out of minutes this month | **Talking out loud is on the paid plans.** "Plans start at $119 a year — about $9.92 a month. Writing stays free and unlimited." For a paid account: "Your 90 minutes come back on the 1st. Writing is always open." | **See plans — from $119 a year** · Write it instead |
| Questions | Free account has used today's three | **That's today's questions.** "Free includes three a day — three new ones tomorrow. Writing in your own words, and the whole faith chapter, are always open." (flows, wall 2, verbatim shape) | **Write in my own words** · See plans — from $119 a year |
| Photos | Free account attaching a sixth photo this week, checked at attach time, never at save (flows, item 12) | **Five photos a week on Free.** "This one makes six. Plans include unlimited photos, from $119 a year." | **See plans** · Keep five |

Never a wall on reading, on writing, on inviting, or on a relative contributing (pricing.ts, note 5).

### Checkout

Stripe Checkout in the browser, through the app's existing Edge Functions (flows, Flow 5 names `create-book-checkout` and the webhook flow; the subscription functions are among the six). After payment the web returns to the page the person was on, with the wall gone. Renewals, card changes and cancellation go through the Stripe customer portal from `/account`. A cancelled plan returns the account to Free and the page says so in the pricing.ts `FOREVER` words: "The app is yours. It does not stop being yours."

The App Store takes 15% on the phone and a card on the web costs about 3% (brief, "Modeled economics" model inputs). The web therefore sells every plan and every edition at the same price as the app and keeps more of it. The brief names "web sales mix" as one of the levers toward a better margin (scale direction, "Margin ambition").

---

## 8. Risks and open questions for the founder

1. **Does the AI server's realtime session accept a browser client?** The phone talks to `/api/realtime/session` through react-native-webrtc and the web build stubs the call (README; deploy §4). **Decided 16 Oct 2026:** v1 ships Write, the archive, the family and the book; the browser conversation is the first item of v1.5, once the Flask server allows the `app.astoryapp.com` origin. The exact server change will be written up for whoever runs it.
2. **The trial.** flows.md and the phone pricing screen show a 3-day trial; pricing.ts says it was removed on 2026-09-28 and deploy §3a replaces it with one free 10-minute conversation. This PRD follows pricing.ts and deploy. Confirm.
3. **Book prices and the print company.** deploy §3a calls the six edition prices proposals, and printed ordering is off until a printer is set up. The web shows the prices from the server (`BOOK_PRICES_JSON`), so nothing is hardcoded, but the demo should not promise a shipped book until ordering is on.
4. **Figma words vs the copy rules.** "Leave a Legacy" (Figma 04), "Get Legacy Book" (Figma 11) and the "Memoir" tab (Figma 23–25) break the lead's rules (never legacy; never frame around finishing a memoir). This PRD keeps the Figma layouts and changes the words: "Book", not "Memoir". Confirm the designer agrees.
5. **Figma's social network vs the family decision.** Figma 13–14 and 17 show Friend Requests, a Trusted Circle of 33 friends, friend suggestions and phone-contact scanning. family-tab.md decided "claim/confirm only; don't build friend requests", and the lead rejected a redesign round and asked for mockups before big UX changes. This PRD leaves those frames out of v1. Confirm, or say which to keep.
6. **One domain.** `astoryapp.com`, `astoryus.com` and `app.astoryapp.com` are all in use (flows, item 15); Figma 16 shows `sharing.astoryus…`; seo.ts says `astoryapp.com`; the digest already points at `astoryapp.com` (deploy §3). **Decided 16 Oct 2026: `app.astoryapp.com`**, its own repository and deploy, which deploy §3b already suggests for call links. The marketing site's Sign in and account pages hand over to it.
7. **What "three storytellers" means on Family.** Three subjects in one household, or three households? family-tab.md could not answer it from the repo. The web's storyteller switcher and the Family page both depend on the answer.
8. **How many questions to say.** product.ts and pricing.ts say 504. `content/questions.csv` on disk has 547 rows after the 8 October audit edits. Re-count before the number is printed anywhere on the web.
9. **The storyteller without a computer.** The web cannot ring a telephone. Before launch only an iPhone rings (founding.ts). A storyteller on the web must sit at a laptop or iPad and press Talk. Is that the storyteller we expect for the first families, or is the web mostly for Jamie and Linh with Rose on the phone? v1 assumes both are true and designs Home for Rose; confirm.
10. **Can the web and the app share one Stripe customer?** A family that buys on the web and later opens the app must see the plan there, and the reverse. The webhook that flips `profiles` must be the same for both channels; App Store purchases can't carry the founding coupon (founding.ts). Confirm the billing table is one source of truth before the first web sale.

---

## 9. Metrics and events

The pitch's milestones are paid activation, repeat calls, actual call cost, channel CAC and renewal when eligible (brief, slide 14). The deploy doc already defines the views. The web must feed them.

### Metrics, each with its source view

| Metric | Definition | Where it is read | Target or note |
|---|---|---|---|
| Activation | Sign-ups that save a first memory; median minutes from sign-up to first memory | `analytics.activation`, `analytics.first_week_summary` (deploy §5) | Under 2 minutes from Welcome on the web (§3.1). The phone floor was 90–150 seconds (flows) |
| First memory by mode | Talk vs Write for the first memory | `memory_saved` with a mode number | No target; it tells us whether Talk in the browser works |
| Second person in 7 days | Share of families with a second person in the first week | `analytics.first_week_summary`, `analytics.household_summary` | The flow that decides the product (flows) |
| Invite → join | Invited, joined, added a memory, joins per inviter, by method | `analytics.invite_funnel` (deploy file 14) | No viral loop may be claimed until this is measured (scale direction, "Retention") |
| Contributor → account | Contributions sent with an email; accepted; claimed | New columns already exist (`contributions.contributor_email`, `created_by`) | — |
| Storyteller back in week 2 | A memory saved in their story in days 7–13 | `analytics.storyteller_return` | — |
| Conversation quality | `wordsPerAnswer`, `talkShare` above 0.7, `followUps/questions` above 0.5, `longestAnswer`, "Could be better" under 10% | `conversation_depth`, `conversation_feedback` (method §3) | Compare before and after any change to the server's instructions |
| Calls | Started, failed, finished; the out-of-minutes wall shown; pricing page; subscription started | `analytics.conversion` | — |
| Actual cost per minute | `audio_seconds` and `cost_usd` per call | `api_usage` (HANDOVER, "Pricing") | HANDOVER says nobody has run this query. Run it in the first week of web calls |
| Paid activation | Free account → paid plan, by wall | `subscription_started` with a wall number | — |
| Book | Full preview opened; PDF downloaded; checkout started; ordered, by edition | New events below | — |
| Renewal | Repeat calls month over month; Monthly renewals; annual renewal from Q4 2027 for an October 2026 cohort | Stripe + `profiles` | 70% annual renewal is an aspiration, not a forecast (scale direction, "Retention") |

### Events the web emits

Rule: numbers and ids only, never words (method §3). Honour the "Help improve A Story" switch (deploy §4a).

Existing names, reused: `memory_saved`, `call_started`, `call_failed`, `call_wall_shown`, `subscription_started`, `conversation_depth`, `conversation_feedback` (deploy file 14; method §3).

New, with `source = web` on every one:

| Event | Properties |
|---|---|
| `account_created` | method (email, google, apple), had_code |
| `first_run_completed` | subject (self, other), seconds_from_welcome |
| `question_shown` | question_id, depth, mode_offered (talk, write) |
| `question_answered` | question_id, mode |
| `talk_wall_shown` | reason (free_used, out_of_minutes), free_minutes_left |
| `invite_sent` | method (email, code, link), role (keeper, reader) |
| `join_completed` | method, landed_on_story |
| `contribution_sent` | has_email, kind, photos |
| `contribution_approved` | days_waiting |
| `claim_completed` | days_since_contribution |
| `book_preview_opened` | memories, pages |
| `book_pdf_downloaded` | edition (home, digital) |
| `book_checkout_started`, `book_ordered` | edition, copies, included_in_plan |
| `plans_viewed` | from (wall, nav, account) |
| `checkout_started` | plan, coupon |
| `digest_link_opened` | days_since_send |
| `export_requested` | kind (pdf, audio) |

---

## 10. What the web does not do

- It does not ring a phone (§8, risk 9).
- It does not simulate anyone: no cloned voice, no "ask Grandma" chatbot. Preservation, not simulation (landscape §9).
- It does not merge two people's versions into one story. It shows both, attributed (positioning §8).
- It does not charge per family member, for reading, or for writing (pricing.ts, note 5).
- It does not show a countdown, a "before it's too late", or a tally of what is used up (founding.ts "URGENCY HERE IS ONLY EVER TRUE"; lead's rules).
