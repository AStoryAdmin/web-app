# Morning test guide (27 Oct 2026)

Six milestones are built, stacked and committed on local branches. Each one passed typecheck, lint, the unit tests (1069) and the Playwright flow tests (110, at 360px and 1280px against a mocked Supabase). Nothing is merged into `main`. Nothing is deployed, emailed or charged, and no production data was touched.

## The branches

They are stacked, so each one contains everything before it:

| Order | Branch | What it adds |
|---|---|---|
| 1 | `web/m1-front-door` | Welcome page for signed-out visitors, email-code sign-in, 8-character passwords, no email in URLs, invited relatives land on their story, working reset links |
| 2 | `web/m2-first-memory` | The phone's daily question, answers that record their question and writer, voice recording with transcript, photo-first memories, "Not yet told", audio on memory pages |
| 3 | `web/m3-family-loop` | Standing family code, "works until" dates instead of countdowns, "Ask {name}" answer links, people who have passed, portraits, Joined page, family-link visitors |
| 4 | `web/m4-book-design` | `/book/design` (cover, paper, title, dedication, chapter order, memories in or out); the preview and print follow it; the editions page shows no prices while ordering is closed |
| 5 | `web/m6-account-help` | Plans with no prices or hardcover promises, gift plans shown correctly, how to cancel by plan source, safe account deletion, "Have a code?", `/help` with feedback |
| 6 | `web/m5-book-order` (**the tip: test this one**) | `/book/order`, `/book/thanks`, `/book/orders`, print PDFs. Unreachable while the server keeps ordering closed |
| 7 | `web/m7-extras` | Imports (writing, WhatsApp, memoir, GEDCOM), archive calendar, tree print and admins, story merges, `/friend` links, "ask for their side". Done and checked (1144 unit, 136 flow tests), in the worktree `../web-app-m7`. Test it after M1–M6 |

The server changes are on `web/server-for-web` in `phone-app-server`, a worktree of the phone-app repo cut from `design-sprint`. They cover the invite email's browser wording, the checkout `returnTo` allow-list, refunds, shipped/tracking SQL, and fulfilment email links. None of it is deployed.

The screenshots for every milestone are in `docs/overnight/shots/M1` through `M6`.

## Run it

```bash
cd "C:/Users/nguye/Desktop/phone app/web-app"
```
```bash
npm run dev -- --port 5180
```

Then open http://localhost:5180. This uses your real Supabase from `.env.local`, so sign in with your own account. Creating a new test account writes to production; that's your call.

To rerun all the checks:
```bash
npx tsc -b && npm run lint && npm test && npm run test:flow
```

## What to try (about 20 minutes)

1. **Signed out.** `/` opens Welcome, not Sign in. On Sign in, try "Email me a code instead" with an account you made on the phone.
2. **Home.** Is today's question the same one the phone shows? Answer it in writing. The next day it shouldn't come back. In Supabase, the memory row should have `question_text` set.
3. **Voice.** Go to `/record` from Home and say a sentence. Transcription needs `VITE_API_URL` and the AI server; without them you can still type the words.
4. **Photo.** In the writer, start from a photo with only a caption.
5. **Family.** Check the family code card and the "works until" date. On a relative's page, use "Ask {name}", copy the link and open it in a private window. Add someone who has passed, with the year they died.
6. **Book.** `/book/design`: change the title and hold back a memory, then check `/book` and "Print at home". The editions list should show no prices.
7. **Account.** `/plans` should show no prices. Check the plan card's cancel line, and `/help` (sending feedback writes one real row). Don't run the full delete account flow, since it really deletes.

## Defaults I took for you

These are in `DECISIONS.md`. The main ones:
- prices are hidden inside the app as well;
- `/plans` says plans are chosen in the iPhone app;
- a relative who joins gets no empty "Myself" story (as on the phone);
- AI retelling is left out.

## Only you can do these

- **Push**: `git push` hung on a credential prompt overnight, so nothing is on GitHub yet. Push the branches above, then open one PR per milestone, stacked: m1 into elder-link, m2 into m1, and so on. `gh` is not logged in either.
- **Supabase dashboard**:
  - The Magic Link email template must include `{{ .Token }}` for code sign-in.
  - Add `https://app.astoryapp.com/reset-password` to Redirect URLs.
- **Before web invites go out**: set `INVITE_JOIN_URL=https://app.astoryapp.com` and deploy `send-invite-email`. This changes the emails users receive.
- **Book ordering, when you're ready**:
  1. Run `book_fulfilment_2026_10_27.sql` and the earlier SQL in `AUDIT.md` §3.
  2. Deploy `create-book-checkout` and `stripe-webhook`.
  3. Add `charge.refunded` to the Stripe webhook events.
  4. Choose a printer, approve a proof and place one test order.
  5. Only then set `BOOK_ORDERING_OPEN=1`.
- **The marketing site** still shows "from $39", "from $19.99 a month" and "print it at home for free". I didn't touch that repo.
- **Production deploy**: Cloudflare deploys `main`, and `main` is still behind `elder-link`.

## Known gaps and decisions still open

- **Joining with a family code makes the person a keeper** (`story_managers` manager), which is what the phone does too. Decide whether that's right.
- **"Passed away" needs a year**, because the database has only `death_year`.
- **Firefox voice recordings** are WebM/Ogg, which may not play on iPhone.
- **Book PDFs are made in the browser**: pages are 300 ppi images, not vector type, and the PDF fails in Safari, so ordering from Safari is blocked. A server-side PDF is the sturdier fix before opening orders.
- **Not ported yet**:
  - family-plan covers, so someone covered by a sponsor's plan shows as Free;
  - access-code redemption;
  - claiming anonymous contributions (`submit_contribution` returns no id).
- **Phone only by design**: Apple and Google sign-in, live and group calls, push notifications.
