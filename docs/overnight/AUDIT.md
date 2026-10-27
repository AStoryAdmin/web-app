> **Live check (26 Oct 2026, signed-out pages only, no accounts created)**
> - astoryapp.com home shows prices ("from $39", "from $19.99 a month") and says "Print it at home for free". Both break the launch rules.
> - app.astoryapp.com `/` opens Sign in, not Welcome. `/create-account` works. `/join/<bad code>` explains the code format. `/gift` returns **404 in production**.
> - Production deploys `main`. The local `web-app` is on `elder-link`, which is **10 commits ahead of `main` and not merged** (gift, promo codes, light `/a/` entry). Milestone branches need a base: `main` or `elder-link`.

# A Story web: gap audit, flow breaks, book ordering, milestones

This was a read-only pass. Nothing was edited, run or called over the network. I spot-checked these claims against the code and they hold:

- `state/RequireAuth.tsx:19` sends signed-out visitors to `/sign-in`.
- `create-book-checkout/index.ts:91,501-502` reads `BOOK_ORDERING_OPEN` and returns to `astory://` URLs.
- `Plans.tsx:35-74` shows prices and promises a hardcover.
- `data/auth.ts:21` sets `MIN_PASSWORD = 6`.
- `Write.tsx:313` shows "$119".
- `Book.tsx:223` and `Welcome.tsx:126` call the book free.
- `Home.tsx:70` ends in `&& false`.
- `Editions.tsx:120-122` lets the Digital Edition be ordered and keeps the "included" branches.
- `question_text` appears 0 times in `web-app/src`.
- `familyView.ts:253` prints "N days left".
- `afterSignIn`'s result is never used outside `AuthProvider.tsx:58`.
- `Start.tsx` never calls `ensureMyStory` or `link_person_story` (both exist only at `AccountProvider.tsx:179-194`, `Join.tsx:178` and `Write.tsx:494`).
- There is no root `playwright.config` (only `e2e/answer.*` and `e2e/gift.*`).

**Corrections to auditor claims**
- The claim "the web never calls touch_active" is wrong. `data/session.ts:45` calls it, at most once a day, from `afterSignIn` (`session.ts:53`).
- `BOOK_ORDERING_OPEN` is a server secret (`create-book-checkout/index.ts:91`). `phone-app/src/data/book.js:102` only has a comment about it.
- The Join flow sits at `Join.tsx:136-184`, not `:432-485`.
- `DESIGN.md:84-85` confirms the rules: "No countdowns" and "Body text at least 16px, targets at least 44px".

---

## 1. Gap table

| # | Feature | Phone | Web | Needs phone? | Effort | Notes (file:line) |
|---|---|---|---|---|---|---|
| 1 | Front door (signed-out `/`) | shipped | partial | web-ok | XS | `RequireAuth.tsx:19` sends visitors to `/sign-in`. They should land on `/welcome` (`App.tsx:51`). |
| 2 | Email + password sign-up and code verify | shipped | done | web-ok | S | `CreateAccount.tsx`, `Verify.tsx:30-39`, `auth.ts:71-111`. Breaks: `MIN_PASSWORD=6` vs phone 8 (`auth.ts:21`, phone `lib/copy.js:24`). The email address goes into `/verify?email=` (`CreateAccount.tsx:78-80`, `SignIn.tsx:48,92`). After sign-in the page bounces through `/sign-in` while the profile loads (`AuthProvider.tsx:143-186`). |
| 3 | Email-code (passwordless) sign-in and sign-up | shipped (phone default) | missing | web-ok | M | The phone uses `signInWithOtp` (phone `data/auth.js:451-470`). The web has no OTP sign-in, so accounts made on the phone can only get in through Forgot password. Blocks "same account". |
| 4 | Apple / Google sign-in | shipped | missing | web-ok (needs Apple Services ID, provider config) | M | phone `lib/socialAuth.js:59-62`, `apple-token` function. Founder decision, because it changes production auth config. |
| 5 | Shared-data claims at sign-in | shipped | partial | web-ok | S | `afterSignIn` (`session.ts:48-55`) races the first account load (`AccountProvider.tsx:63-76`), and its result is never used. Invited keepers can land on `/start` instead. `claim_contributions` is never called (phone `AppContext.js:258`). |
| 6 | Create first story (`/start`) | shipped | done | web-ok | S | `Start.tsx:268-292`. Break: "My own story" does not run `link_person_story`; only `ensureMyStory` does (`AccountProvider.tsx:188-194`). The web can't pick an existing tree person and always saves `hasAccount: null`. |
| 7 | Guided first run (after first story or join) | shipped | missing | web-ok | S | phone `FirstRunGuideScreen.js:1-54`, `JoinFamilyScreen.js:406-452`. The web goes straight to `/` (`Start.tsx:286`, `Join.tsx` "Go to Home"). |
| 8 | Ask to join an existing story | shipped | done | web-ok | S | `Start.tsx:41-91`, `data/family.ts:197-245`. |
| 9 | Join with code (`/join/:code`, `?ref=`) | shipped | done | web-ok | S | `Join.tsx:136-184`, `familyWrites.ts:193`. Differs from the phone: the web makes an empty "Myself" story for every joiner (`Join.tsx:178`). |
| 10 | Invite relatives (code, QR, email) | shipped | done | web-ok | S | `InviteSheet.tsx:215-276`. Codes show "N days left" (`familyView.ts:249-253`, `Family.tsx:91`, `Person.tsx:419`), which breaks the no-countdown rule. |
| 11 | Standing family code for anyone | shipped | missing | web-ok | S | phone `InviteScreen.js:45,82` uses `familyCodeFor({storyId})`. The web only has per-person codes, yet `Start.tsx:96-97` points joiners to "the family code on their Family page". |
| 12 | Invite email lands on the web | shipped | partial (server) | web-ok | S | `send-invite-email/index.ts:44,205-206` reaches the web only if `INVITE_JOIN_URL` is set. The how-to text is app-only (`:209-211`). The second button is `astory://` (`:197,289-291`). `DEPLOY.md:53,61` is wrong about both. Changing it is a production deploy and changes what users are emailed. |
| 13 | Today's question on Home | shipped | partial | web-ok | S-M | `Home.tsx:81-82` builds its own deck, and skips are kept per browser (`lib/today.ts:23-41`). It never reads `daily_questions` or `story_rota`, so phone and web can show different questions. Relative wording is switched off (`Home.tsx:70`). |
| 14 | Question marked answered, `question_text` kept | shipped | broken | web-ok | S | `Write.tsx:883-896` saves no prompt or `questionId`. The web's `app-core/data/rows.js` is stale (0 hits for `question_text`; phone `rows.js:56-112`). The web `dailyQuestion.js:93-106` matches by title only, so the same question comes back. |
| 15 | Writer credit when a keeper writes in a relative's story | shipped | missing | web-ok | S | Write sets no contributor or `authorPersonId` (`Write.tsx:883-896`). The phone does (`lib/teller.js:106-110`). Without it, "From the family" on Home (`Home.tsx:164`) never shows these. |
| 16 | Answer by writing | shipped | done | web-ok | S | `Write.tsx:873-941` → `memories.ts:115-119`. Drafts and the 3-a-day meter are per browser only (`lib/usage.ts:2-17`). |
| 17 | Answer by voice, signed in (audio kept) | shipped | partial | web-ok | M | Only Web Speech dictation, which keeps no audio and does nothing in Firefox (`lib/dictation.ts:1-7`, `Write.tsx:644,1055`). `answer/recorder.ts` can be reused. `syncMemoryAudio` exists (`memories.ts:89-110`). `/talk` is a dead end (`Talk.tsx:112-131`). |
| 18 | Photo-first memory | shipped | partial | web-ok | M | Words are required first (`Write.tsx:875-878,995`). The phone starts from the photo (`PhotoMemoryScreen.js:142-188`). `Write.tsx:313` shows a price. The 5-a-week limit is browser-only. |
| 19 | Send today's question / `/a/` answer link to a relative | shipped | missing | web-ok | M | The web can answer a link (`AnswerPage.tsx`, `answerLink.ts:61`) but can't create one. It has no `daily_question_create` or `story_rota` (phone `dailyQuestions.js:136,162,213`). There is no "hear the answer" screen. |
| 20 | Ask about one memory (memory link, add their side) | shipped | missing | web-ok | M | phone `memoryLinks.js:112-272`. The closest web feature is `/c/:slug`, which works at story level (`Contribute.tsx:96`). |
| 21 | Ask a relative to add their side (memory request email) | shipped | missing | web-ok | S | No web UI for `contribution_requests`. The email links to `astory://` or the marketing site (`send-memory-request/index.ts:27-29,115-119`). |
| 22 | Family memory composer in a relative's story | shipped | partial | web-ok | M | `FamilyVoices.tsx:189` and `/c/:slug` exist. There is no standalone signed-in composer and no `answerRequestsFor`. |
| 23 | Archive and memory page | shipped | done | web-ok | S | `Archive.tsx:124-141`, `MemoryPage.tsx:164-419`. No realtime updates, no "not yet told", no taking a family side off, no lessons. |
| 24 | "Not yet told" prompts | shipped | missing | web-ok | S | The logic is already in `app-core/lib/bookProgress.js`. This helps fill the book. |
| 25 | Calendar and milestones | shipped | missing | web-ok | M | `story_milestones` is absent from the web. |
| 26 | Family tree view, merge duplicates | shipped | done | web-ok | S | `Family.tsx:22-46`. A relative with no story is redirected to `/start` (`Family.tsx:180`, `Person.tsx:172`). |
| 27 | Edit person facts (death, nickname, places, work, photo) | shipped | partial | web-ok | M | The web edits only name, birth year and email (`Person.tsx:288-299,477-480`). |
| 28 | Add a remembered person (has died, no code) | shipped | missing | web-ok | S | phone `AddSomeoneScreen.js:138-175`. `InviteSheet` always offers a code or email. |
| 29 | Profile picture upload and crop (self and people) | shipped | missing | web-ok | M | `Portrait.tsx` only displays. `avatar_url` is optional (`familyWrites.ts:71`). |
| 30 | Edit own profile: relation, life facts | shipped | partial | web-ok | S | `Account.tsx:92-156` edits names and phone only. |
| 31 | Tree admins, print tree | shipped | partial | web-ok | S | The web reads `household_admins` (`family.ts:40`) but can't set it. No tree print or PDF. |
| 32 | Story merge: answer or undo | shipped | partial | web-ok | S | The web can only propose (`family.ts:153`). Answer and undo are missing (phone `sameStory.js:149,176`). |
| 33 | Keepers (`story_managers`), review queue | shipped | done | web-ok | S | `Keepers.tsx:10`, `ReviewQueue.tsx`. Adding a keeper sends an email. |
| 34 | Family-link visitor (read and add without an account, claim later) | shipped | partial | web-ok | M | `family_link_read`, `family_link_add_memory` and `claim_contributions` are absent. `/join` forces an account. |
| 35 | Friend link (`/friend/:token`) | shipped | missing | web-ok | M | The phone already shares `https://astoryapp.com/friend/<token>` (`FriendLinkScreen.js:3`), so the web needs this route anyway. |
| 36 | Book preview and print at home | shipped | done | web-ok | S | `Book.tsx:79-311`. "Print at home, free" (`:223`). The progress gauge (`:250`) is a founder question. The web's QR uses the functions URL (`printBook.ts:26`); the phone uses `astoryapp.com/l` (`links.js:43`). |
| 37 | Book design (title, subtitle, dedication, cover style, paper, chapter order, hold back memories, retell) | shipped | partial | web-ok | L | The web saves cover colour only (`Book.tsx:204-219`). The phone has `BookDesignScreen.js:20-40` and `BookPagesScreen.js:69`. |
| 38 | Editions list | partial | broken | web-ok | M | Prices are shown even while closed (`Editions.tsx:142`); the phone hides them. Digital "Order" always fails (`:122`; server `:384-389`, `bookCatalog.js:139`). The "included" and credit branches are dead (`:84-86,120-127`; `bookAllowance.js:36-43`). The `credits` the server sends are ignored (`book.ts:14-24`). "I'd like a printed copy" only fires analytics (`:79-82`). |
| 39 | Printed-book order flow on the web | partial | partial | web-ok | L | Copies are fixed at 1. No `shipTo` or note (`book.ts:75-82`, `Editions.tsx:71`). Returns to `astory://` (`create-book-checkout:501-502`). No PDF upload. No order status. A gift-credit holder gets 400 `needs_address` (`:405-407`). |
| 40 | Digital Edition purchase | partial (IAP) | placeholder | web-ok | M | No server path sells it. The PRD calls it a web revenue line (`PRD.md:120`). Founder decision. |
| 41 | Plans and plan purchase | shipped (IAP) | placeholder | hybrid | L | `Plans.tsx:18,162` links out to `astoryapp.com/pricing`, where prices are hidden, so it dead-ends. Prices at `:35-74`. Hardcover promises at `:50,59,67` contradict `bookAllowance.js:11-13`. "Print at home, free" at `:37`. |
| 42 | Plan reads gift years | shipped | missing | web-ok | S | The web reads profile columns only (`auth.ts:276,305`). The phone uses `my_gift_year`. A gift recipient shows as Free on the web. |
| 43 | Manage or cancel plan | shipped | missing | hybrid | S | `CANCELABLE_PLANS` is unused (`plan.ts:20`). `PlanCard` has a link only (`Account.tsx:362-381`). No "cancel in the App Store" instructions. |
| 44 | Delete account | shipped | partial | web-ok | S | `Account.tsx:652-725`. No warning that a subscription keeps billing, no "account deleted" page, no optional reason. Testing it deletes production data. |
| 45 | Change email and password | shipped | done | web-ok | S | `changePassword` skips the reauthenticate nonce (`auth.ts:155`; no `reauthenticate` in web src). It breaks if Secure password change is on. |
| 46 | Gift, promo and access code | shipped | done | web-ok | S | `/gift/*`. There is no "Have a code?" entry in Account (`Account.tsx:735-740`). `redeem_access_code` is not called. |
| 47 | Help, FAQ, feedback, contact | shipped | missing | web-ok | S | No `/help` route and no `feedback` insert. |
| 48 | Notifications | shipped | partial | phone-only for push | S | Only the Sunday email switch (`Account.tsx:401`). `DIGEST_OPEN_URL` defaults to the marketing site (`weekly-digest/index.ts:40`). |
| 49 | Letters, weekly letter | shipped | missing | web-ok | M | No `/letters`. `letter-mail` `OPEN_URL` goes to the marketing site (`letter-mail/index.ts:22`). |
| 50 | Imports (writing, WhatsApp, memoir, social, GEDCOM) | shipped | missing | web-ok (better on desktop) | L | The parsers are already in `app-core/lib/{importers,memoir,whatsapp,gedcom}.js` but unused. |
| 51 | Bring in a recording, record in the room | shipped | missing | web-ok | L | Needs the AI transcription server (`data/ai.ts`). |
| 52 | Call transcript, translate, lessons | shipped | missing | web-ok | S/S/M | `family_calls.transcript`, the `translate` function, the `lessons` table. |
| 53 | Call schedule, voice, language preferences | shipped | missing | hybrid (ringing is phone-only; prefs editable on web) | S-M | `Talk.tsx:120-121`. `callStyle` is read with no editor (`stories.ts:169`). |
| 54 | Live talk, family, group and guest calls | shipped | placeholder | phone-only, or v1.5 (`PRD.md` 15b) | L | Keep on the phone for launch. The guest link (`family-call-guest`) is browser-based by design but has no web route. |
| 55 | Appearance (dark), language picker, block a user | shipped | missing | web-ok | S each | Low priority for the first memory or book. |
| 56 | E2E coverage of the main flow | n/a | missing | n/a | M | Only `e2e/answer.*` and `e2e/gift.*`. `npm run e2e` has no root config or webServer. |

Debug and retired items, no work needed: `CallDebugScreen`, `src/dev/*`, `CALL_DEBUG` (`ScheduleCallScreen.js:39`), the `apns-probe` spike, and the retired redirects (People, Requests, Contact, Contributions, Faq, AddMemory).

---

## 2. Flow break log (web, end to end)

| Step | Status | Exact break |
|---|---|---|
| 1. astoryapp.com → app | partial | The marketing redirect drops `?ref` on `/sign-up` and `?next` on `/sign-in` (`a-story-landing-main/index.html:84`). The marketing source contains prices (`faqData.ts:13`, `Pricing.tsx:779-783`, `Reserve.tsx:3-5`); I didn't check whether a runtime flag hides them. That repo is out of scope (`DEPLOY.md:9`). |
| 2. Land on app.astoryapp.com | broken (UX) | A signed-out visitor sees Sign in, not Welcome (`RequireAuth.tsx:19`). |
| 3. Sign up | partial | Password only, minimum 6 (`auth.ts:21`; the phone requires 8). The email goes into the URL (`CreateAccount.tsx:78-80`). |
| 4. Verify / sign in | partial | Bounce through `/sign-in` before the user loads (`AuthProvider.tsx:143-186`, `RequireAuth.tsx:19`). A phone OTP or Apple account gets "That email and password don't match" (`auth.ts:49`). `/reset-password` ignores recovery tokens (`App.tsx:56`, `auth.ts:134-139`). |
| 5. Create the family / storyteller | partial | Works (`Start.tsx:268-292`). "My own story" stays unlinked in the tree. No first-run guide. Invited keepers can land here wrongly because of the `afterSignIn` race (`AccountProvider.tsx:63-76`). |
| 6. Invite relatives | partial | Sheet works (`InviteSheet.tsx:215-276`). The email says "tap Get started… in A Story", with an `astory://` button (`send-invite-email/index.ts:197,209-211`), and reaches the web only if `INVITE_JOIN_URL` is set. No standing family code. "N days left" countdown (`familyView.ts:253`). |
| 7. Relative joins | partial | Works (`Join.tsx`). Every joiner gets a Myself story (phone differs). No `claim_contributions`. Nothing to read after joining. |
| 8. Today's question | partial | Local deck, so phone and web can disagree (`lib/today.ts`). Relative wording off (`Home.tsx:70`). The "Talk" button goes to a wall (`Home.tsx:209-211` → `Talk.tsx`). |
| 9a. Answer by writing | works, with data bug | Saved, but the question isn't recorded (`Write.tsx:883-896`; stale `rows.js`), so it returns. No writer credit for keepers. |
| 9b. Answer by voice | broken | Dictation only, no audio kept, nothing in Firefox (`dictation.ts:1-7`). The signed-in web has no recorder. |
| 9c. Answer with photo | partial | Words must come first (`Write.tsx:875-878`). The price line at `Write.tsx:313`. |
| 9d. Ask a relative to answer (`/a/`) | missing | The web can't create the link (no `daily_question_create`). |
| 10. Archive | works | No realtime. No calendar. |
| 11. Family tree | partial | Can't add a deceased relative, set a photo or set death facts (`Person.tsx:288-299`). Tree is hidden without a story (`Family.tsx:180`). |
| 12. Book preview | works, with copy break | "Print at home, free" (`Book.tsx:223`). Gauge at `:250`. Design is cover colour only. |
| 13. Choose an edition | broken | Prices shown while closed (`Editions.tsx:142`). Digital "Order" returns 409 or 400 (`:122`). Waitlist is analytics only (`:79-82`). Gift credits are ignored. Dead "included" copy (`:84-86`). |
| 14. Checkout | broken (closed) | Server gate off (`create-book-checkout:91`). If opened: return to `astory://` (`:501-502`), no `shipTo`, note, copies or PDF, gift credit gets 400 (`:405-407`), no status page. |
| 15. Account and plan changes | broken | No plan purchase. `/plans` dead-ends (`Plans.tsx:162`). Hardcover promises (`:50,59,67`). No manage or cancel. Gift years are not reflected (`auth.ts:276,305`). Delete has no subscription warning. "print at home free" (`Account.tsx:368`). |

---

## 3. Book ordering: what must happen to open it

Not to be switched on by an agent. Statuses below are as of the current code.

| # | Item | Status | Evidence |
|---|---|---|---|
| A1 | Gate, quote and Stripe session code | DONE | `create-book-checkout/index.ts:309-330,391-398,411-450,489-521`; `_shared/bookCatalog.js` |
| A2 | Webhook marks paid, canceled or expired | DONE (code) | `stripe-webhook/index.ts:89-226` |
| A3 | Redeploy `create-book-checkout` and `stripe-webhook` from HEAD | MISSING (owner) | The deployed function is about 13 Oct, older than `shipTo`, note and credits (`phone-app/docs/book-test-order.md:35-51`) |
| A4 | Run `book_gift_note_2026_10_22.sql`; confirm `book_design.sql` and `gift_2026_10_23.sql` | MISSING (owner SQL) | `all.sql:24`; `create-book-checkout:17-19` |
| A5 | Stripe live key, plus a webhook endpoint for the four `checkout.session.*` events | FOUNDER | `book-test-order.md:10-20`; `stripe-webhook:18-23` |
| A6 | Web return URL (`returnTo` allow-list or `BOOK_SITE_URL`) and a `/book/thanks` page that polls `book_orders` | MISSING | `create-book-checkout:501-502` |
| A7 | `charge.refunded` handler | MISSING | `stripe-webhook:228-230`; `all.sql:474` |
| A8 | Sales tax (`automatic_tax`) | FOUNDER | `create-book-checkout:489-503` |
| B9 | Print-vendor integration (Lulu Print API or a `fulfil-book-order` function) | MISSING | `book-fulfilment.md:28-48`; profiles in `legacyBook.js:555-577` |
| B10 | Printer choice and account: stage 1 manual, stage 2 API with sandbox key | FOUNDER | `book-fulfilment.md:10-48` |
| B11 | Set `BOOK_FULFILMENT_TO` (it sends email) | MISSING / FOUNDER | `stripe-webhook:38,154`; `book-test-order.md:34` |
| B12 | Approved physical proof, then one end-to-end test order, then close again | MISSING | `book-fulfilment.md:113-145`; `book-test-order.md:40-78` |
| B13 | Are Heirloom (linen and box) and Full-Service actually deliverable? | FOUNDER | `deploy-2026-10.md:83`; `all.sql:3231+` |
| B14 | Fulfilment state: `shipped` is not allowed by the status check; no tracking or carrier column; no family-facing status | MISSING (SQL) | `all.sql:473-474`; `book-fulfilment.md:26` |
| C15 | Address collection (Stripe or app `shipTo`), US and Canada only | DONE | `create-book-checkout:127-146,472-488`; `stripe-webhook:117-126` |
| C16 | Shipping cost (postage is currently inside the flat price), countries, delivery promise | FOUNDER | `create-book-checkout:44-46,461-468` |
| C17 | Web ship-to form, first-page note, copies picker, gift-credit use, order history | MISSING | `book.ts:75-82`; `Editions.tsx:71` |
| D18 | Phone renders and uploads `{id}.pdf` and `{id}-cover.pdf` | DONE (phone) | `bookOrderFlow.js:91-118`; storage RLS `all.sql:3154-3178` |
| D19 | Web PDF to print spec (6x9 bleed, even page count ≥ 24, spine table, embedded fonts), browser- or server-rendered and uploaded | MISSING | `book-fulfilment.md:57-111`; `printBook.ts` is print-at-home only |
| D20 | Fulfilment email points the printer at "the app" | MISSING | `stripe-webhook:177-178` |
| E21 | Final edition prices ($39 / $69 / $149 / $499; Digital $19 are proposals) | FOUNDER | `PRD.md:275`; `BOOK_PRICES_JSON` at `create-book-checkout:72-82` |
| E22 | Remove "plan includes a Classic Hardcover" copy and the dead "included" and credit branches | MISSING (bug) | `Plans.tsx:50,59,67`; `Editions.tsx:84-86,120-127` |
| E23 | Digital Edition on the web (SKU, delivery, entitlement) | FOUNDER | `bookCatalog.js:36-40,139` |
| E24 | Real waitlist storage, or drop the "announced in the app" promise | MISSING | `Editions.tsx:79-82,101` |
| E25 | Unify QR listen URLs on the `astoryapp.com/l` domain | MISSING | `printBook.ts:26` vs `links.js:43` |
| F26 | `supabase secrets set BOOK_ORDERING_OPEN=1` only after A3-A6, B10-B12, C16, and C17 + D19 for web orders | FOUNDER only | `create-book-checkout:88-91` |

---

## 4. Ranked milestones

Each milestone gets its own branch and PR and is never merged without the founder. Every one ends with the same gate:
- `npm run typecheck`
- `npm run lint`
- `npx vitest run`
- Playwright through the root config added in M1, with Supabase and edge functions mocked as in `e2e/answer.spec.ts`
- a browser walkthrough with screenshots at 360px and 1280px, checking 16px body text, 44px targets, no countdown, trial, "free" book or price strings, and they/them copy

Within a milestone, file ownership is split so no two agents edit the same file.

### M1: Front door and same account (goal: a visitor reaches sign-up and any phone account can get in)
Branch: `web/m1-front-door`. Ranks first: nothing else matters if people land on Sign in or can't get in.
- 1, 2: `/` to `/welcome` when signed out; `MIN_PASSWORD` 8; email passed in router state, not the URL; wait for the user before navigating after verify or sign-in.
- 3: "Email me a code" sign-in and sign-up (`signInWithOtp`).
- 5: wait for `afterSignIn` (capped at about 3s) before the first load, or reload when it reports anything; add `claim_contributions`.
- 6: "My own story" calls `link_person_story`.
- 45: `changePassword` with reauthenticate and the nonce.
- Add a root `playwright.config.ts` with a webServer, plus `e2e/onboard.spec.ts`.

| Agent | Files |
|---|---|
| auth | `state/RequireAuth.tsx`, `state/AuthProvider.tsx`, `data/auth.ts`, `pages/auth/{CreateAccount,Verify,SignIn,ForgotPassword}.tsx` |
| account-load | `state/AccountProvider.tsx`, `data/session.ts`, `pages/Start.tsx` |
| test | `playwright.config.ts`, `e2e/onboard.*`, `package.json` (e2e script only) |

Acceptance: the e2e test runs welcome → create account → verify (mocked) → start → Home. A phone OTP account signs in with a code. An invited keeper lands on their story, not on `/start`.
Founder flags: Apple and Google sign-in (item 4) is deferred and needs production provider config. The OTP email template is a Supabase production setting; check it before relying on it.

### M2: First kept memory (goal: write, voice or photo, saved correctly and shared with the phone)
Branch: `web/m2-first-memory`.
- 14: re-sync `app-core/data/rows.js` and `app-core/lib/dailyQuestion.js` from the phone; save prompt and `questionId`; map `question_text` in `stories.ts`.
- 15: writer credit (`tellerCredit`).
- 13: remove `&& false`; share skips through the shared deck where possible.
- 17: signed-in recorder (reuse `answer/recorder.ts`), upload to `memory-audio`, transcribe via `data/ai.ts`, save with `syncMemoryAudio`; `/talk` becomes "Record it here", with calls kept as a phone note.
- 18: photo-first memory; remove the price line at `Write.tsx:313`.
- 24: "Not yet told" prompts on the archive.

| Agent | Files |
|---|---|
| data | `app-core/data/rows.js`, `app-core/lib/dailyQuestion.js`, `data/memories.ts`, `data/stories.ts`, `data/ai.ts`, `lib/today.ts` |
| composer | `pages/Write.tsx`, `pages/Home.tsx` |
| voice | new `pages/Record.tsx`, `components/record/*`, `pages/Talk.tsx`, `App.tsx` (route only) |
| archive | `pages/Archive.tsx`, `components/archive/NotYetTold.tsx` |
| test | `e2e/memory.spec.ts` |

Acceptance: an answered question doesn't come back the next day. The memory row has `question_text`. Recorded audio plays on the memory page. A photo-only memory saves. The page works in Firefox (recorder, not dictation).
Founder flags: AI transcription consent wording (the phone has `ensureAiConsent`) and the per-minute transcription cost.

### M3: Family loop (goal: relatives arrive, join and answer)
Branch: `web/m3-family-loop`.
- 11: standing family-code card.
- 19: "Ask {name}" sheet with `daily_question_create`, link, QR and copy.
- 10: replace "N days left" with an expiry date.
- 28: "They've passed" person.
- 27, 29, 30: person facts, photo upload, own profile picture and relation.
- 26: `/family` renders without a story.
- 7: light first-run and joined page that shows the inviter's newest memory.
- 34: family-link visitor read and add.

| Agent | Files |
|---|---|
| tree | `pages/Family.tsx`, `pages/Person.tsx`, `components/family/familyView.ts`, `components/family/InviteSheet.tsx` |
| ask | new `components/ask/*`, `data/dailyQuestions.ts` |
| media | new `components/family/PortraitUpload.tsx`, `data/portraits.ts`, `pages/Account.tsx` (Profile section only) |
| onboarding | `pages/Join.tsx`, new `pages/FirstRun.tsx`, `pages/FamilyLink.tsx`, `App.tsx` routes |
| server (separate PR in phone-app) | `send-invite-email/index.ts`: browser wording when `JOIN_URL` is set; hide `astory://`. Fix `DEPLOY.md:53,61`. |

Acceptance: e2e for invite → join → answer link created (mocked). The walkthrough shows no countdown text.
Founder flags: setting `INVITE_JOIN_URL=https://app.astoryapp.com` (a production secret) and deploying `send-invite-email` both change emails that go to users. No real invite email is sent in testing without approval.

### M4: A book worth ordering (goal: the family shapes the book; honest editions page)
Branch: `web/m4-book-design`.
- 37: `/book/design` (title, subtitle, dedication, chapter order, hold back or let back memories, cover style and paper) saved to `stories.book_design` via app-core `bookDesign.js`.
- 36: "Print at home" with no "free"; QR to the `/l` domain.
- 38: hide prices and Order while `orderingOpen` is false; hide Digital Order; remove the "included" and credit dead code; add `credits` to `BookOffer`.
- E24: drop the waitlist promise, or store it once the founder decides.

| Agent | Files |
|---|---|
| design | new `pages/BookDesign.tsx`, `components/book/design/*` |
| book | `pages/Book.tsx`, `components/book/printBook.ts` |
| editions | `components/book/Editions.tsx`, `data/book.ts` |
| test | `e2e/book.spec.ts` |

Acceptance: a held-back memory disappears from the preview and the print PDF. With ordering closed, the editions page shows no prices and no Order button.
Founder flags: the gauge at `Book.tsx:250`, AI retelling (cost), and whether a waitlist table is created (production schema).

### M5: Web book ordering, built closed (goal: the web order path ready end to end in Stripe test mode)
Branch: `web/m5-book-order`, plus a phone-app server PR.
- 39 and C17: `/book/order` (edition, copies, ship-to with family addresses, first-page note, gift credit).
- D19: print-spec PDF rendered and uploaded to `book-orders/{id}.pdf` and `-cover.pdf`.
- A6: `/book/orders` status page and `/book/thanks` polling.
- Server: `returnTo` allow-list (A6), `charge.refunded` (A7), `shipped`/tracking SQL (B14), fulfilment email with a PDF link (D20).

| Agent | Files |
|---|---|
| order-ui | new `pages/BookOrder.tsx`, `pages/BookOrders.tsx`, `App.tsx` routes |
| pdf | new `components/book/printPdf.ts`, `data/bookOrders.ts` |
| server (separate) | `phone-app/supabase/functions/create-book-checkout/index.ts`, `stripe-webhook/index.ts`, a new SQL migration |

Acceptance: Playwright with a mocked checkout. One Stripe test-mode order on a test account only, with the founder's OK.
Founder flags: everything here touches money and production. Deploying the functions, running the SQL, the Stripe mode, `BOOK_FULFILMENT_TO` and `BOOK_ORDERING_OPEN` are all the founder's to do.

### M6: Plans, account and support (goal: the account page tells the truth and a web user can get help)
Branch: `web/m6-account`.
- 41: Plans with no prices and no hardcover promises until billing is chosen; say plans are bought in the iPhone app (or via web billing once decided).
- 42: gift-aware plan via `my_gift_year` or `own_plan`.
- 43: manage or cancel instructions by source.
- 44: subscription warning on delete and an "account deleted" page.
- 46: "Have a code?" row.
- 47: `/help` with FAQ and a feedback form (`feedback` insert).
- 48: a line saying push settings live on the phone; `DIGEST_OPEN_URL` noted.

| Agent | Files |
|---|---|
| plans | `pages/Plans.tsx`, `lib/plan.ts`, `data/auth.ts` (plan read only; M1 is merged by then) |
| account | `pages/Account.tsx`, new `pages/AccountDeleted.tsx` |
| help | new `pages/Help.tsx`, `data/feedback.ts`, `App.tsx` routes |

Founder flags: web plan checkout (RevenueCat Web Billing is recommended, so `revenuecat-webhook` stays the only writer); whether any prices show in the signed-in app before launch; `DIGEST_OPEN_URL` and `letter-mail` `OPEN_URL` (they email users).

### M7: Desktop-native extras, after the first book
Branch: `web/m7-extras`; can split into several PRs.
- 50: imports, using the existing app-core parsers.
- 51: bring in a recording.
- 49: letters.
- 52: call transcript, translate, lessons.
- 25: calendar and milestones.
- 20, 21, 22: memory links and contribution requests.
- 31, 32: tree admins, tree print, merge answer and undo.
- 35: friend link.
- 53: call-schedule editor.
- 55: language and block.

Keep on the phone: live, family and group calls, push and ringing (54).

---

## 5. Open questions for the founder

1. **Web plan billing:** RevenueCat Web Billing (one writer, recommended), Stripe subscriptions, or "plans are bought in the iPhone app" until launch?
2. **Prices inside the signed-in app** (`/plans`, editions, `/gift` "$99", the photo cap): hidden too until launch, or only on the marketing site?
3. **Production secrets and emails:** may we set `INVITE_JOIN_URL`, `DIGEST_OPEN_URL` and `letter-mail` `OPEN_URL` to `https://app.astoryapp.com`, and deploy the reworded `send-invite-email`?
4. **Printer:** Lulu manual (stage 1) or the API (stage 2)? Who receives `BOOK_FULFILMENT_TO`? Are Heirloom and Full-Service sold at launch?
5. **Book commerce:** final edition prices, shipping (built into the price or a separate line), countries beyond the US and Canada, sales tax, Stripe live vs test.
6. **Digital Edition:** sell it on the web (price, delivery), or hide it until it's ready?
7. **Apple and Google sign-in on the web:** set up the Apple Services ID and Google OAuth now, or rely on email-code sign-in for phone-made accounts?
8. **AI on the web:** approve signed-in voice transcription and AI retelling (consent copy and running cost)?
9. **Should a relative who joins get an empty "Myself" story right away?** The web does today (`Join.tsx:178`); the phone doesn't.
10. **Is the book-progress gauge ("N% of the way to a first edition", `Book.tsx:250`) acceptable under "no countdowns"?**
11. **The marketing repo** (`a-story-landing-main`) drops `?ref` (`index.html:84`), and its source contains prices. May we change it, given that `DEPLOY.md:9` says not to touch it?