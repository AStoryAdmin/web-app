# app-core

Copied verbatim from `phone-app/src` by `scripts/sync-from-app.mjs`. Do not
edit anything in here; change it in the phone app and run the sync. `npm run
check` fails if the two drift apart.

These are the pure modules both products must agree on: how a free-text date
becomes a year, what the chapters are, how far a book is from ready, which
question is asked on which day, how family codes and invites read, how a
save error is classified. Typed wrappers for the web live in `src/lib/`.
