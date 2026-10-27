# Overnight build: defaults chosen while the founder was away (26-27 Oct 2026)

The founder approved all seven milestones and asked for no stops. Where a decision was theirs, the safest reversible default was taken. Each one is listed here so it can be changed in the morning.

| Question | Default taken |
|---|---|
| Base branch | `elder-link` (10 commits ahead of `main`, unmerged). The milestones are stacked: m1 is cut from elder-link, m2 from m1, and so on. No branch is merged into `main`. |
| Prices in the signed-in app | Hidden while ordering is closed (`/plans`, editions, the writer's photo line). `/gift` is unchanged. |
| Web plan billing | None yet. `/plans` says plans are chosen in the A Story app on iPhone; no checkout is built. |
| Test account / production data | None created. Every e2e test and screenshot runs against a mocked Supabase (`https://*-test.supabase.co`). |
| Emails, secrets, function deploys, SQL | Code only. Nothing is deployed or run. Server changes are on a phone-app branch (`web/server-for-web`). |
| Book ordering | Stays closed. The M5 order flow is built and tested against mocks only. |
| Marketing site prices | Not touched (DEPLOY.md: separate project). Reported in AUDIT.md. |
| Joiner gets an empty "Myself" story | Matched to the phone (no auto story). |
| Book progress gauge | Kept, with no "N left" wording. |
| Web voice transcription | Built through the existing `data/ai.ts` server, with the phone's AI-consent wording. Costs per minute once deployed. |
| Apple/Google sign-in | Deferred. Email-code sign-in covers phone-made accounts. |
