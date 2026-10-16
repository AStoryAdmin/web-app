# Porting manifest: the phone app's data layer, for the web app

Written 2026-10-16 from a read-only pass over `phone-app/` (Expo SDK 57, RN 0.86, supabase-js ^2.108) and `landing-page-publish/src/lib/auth.ts`. Every path below is relative to `phone-app/` unless it starts with `landing-page-publish/` or `web-app/`. Line numbers are from the files as they stood on this date; `grep` the quoted string if they have moved.

The web app talks to the **same Supabase project** (ref `naxvjujewggrwflkvvzc`, per `docs/LEAD-TODO-2026-10-12.md` section 5) with the **same anon key**, so one account signs into both and sees the same rows. Per `docs/LEAD-TODO-2026-10-12.md` ("14 October, evening: database done") and `web-app/README.md`, the live database has run `supabase/all.sql` (51 files, built 2026-10-14). Section 9 says what to probe anyway.

---

## 1. AUTH & SESSION

Source: `src/data/auth.js`, `src/lib/supabase.js`, `src/lib/sessionCheck.js`, `src/state/AppContext.js`, `supabase/schema.sql:729-761`, `landing-page-publish/src/lib/auth.ts`, `landing-page-publish/src/lib/authSession.ts`.

### 1.1 The client (`src/lib/supabase.js:16-25`)

```js
createClient(url, key, { auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } })
```

The marketing site's account client (`landing-page-publish/src/lib/auth.ts:45-53`) mirrors it for the browser:

```ts
createClient(url, key, { auth: { storageKey: AUTH_STORAGE_KEY /* 'astory-web-auth' */, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } })
```

- `AUTH_STORAGE_KEY = 'astory-web-auth'` (`authSession.ts:10`). `hasStoredSession()` reads `window.localStorage.getItem(AUTH_STORAGE_KEY)` so the first paint can choose "Sign in" vs "Your account" without loading supabase-js (`authSession.ts:16-22`).
- The site keeps a **second, anonymous** client (`landing-page-publish/src/lib/supabase.ts:30-32`, `persistSession: false`) for `/contribute/:slug` and `/p/:slug`, whose RPCs are written for `anon`. The two never share a storage key.
- **Web app decision:** use `storageKey: 'astory-web-auth'` so a person signed in on astoryapp.com's account pages and on app.astoryapp.com share nothing by accident unless they are on the same origin (localStorage is per origin; the shared key only matters if the two are ever served from one origin). Keep `detectSessionInUrl: false`: every step is a typed code, never a link. Keep `autoRefreshToken: true`; supabase-js v2 refreshes on focus/visibility in browsers by itself.
- Sign-out on the web must be `signOut({ scope: 'local' })` (`auth.ts:220-224`): the default `global` scope revokes every refresh token on the account and would sign the storyteller's family out of the phone app.

### 1.2 Sign-up (`auth.js createAccount`, lines ~233-300)

1. `supabase.auth.signUp({ email: norm, password, options: { data: { first_name, last_name, referral_code: refCode } } })` where `refCode = (referralCode||"").trim().toUpperCase()`. The site adds `signed_up_on: 'web'` to the metadata (`auth.ts:136`); the app never reads it. The web app should send `signed_up_on: 'web'` too.
2. The DB trigger `on_auth_user_created` → `public.handle_new_user()` (`schema.sql:729-761`) inserts `profiles (id, first_name, last_name, referral_code, referred_by)`: names from `raw_user_meta_data`, `referral_code` from `generate_referral_code()`, `referred_by` resolved from an existing profile's `referral_code` (blank/unknown code → null, never an error). **The client never creates the profile row**; `ensureProfile()` (`auth.js:~218`) is a best-effort upsert `{ id, first_name, last_name }` whose failure is swallowed.
3. The project requires email confirmation, so `data.session` is null and the UI goes to a 6-digit code screen. `verifySignupCode(email, token)` → `supabase.auth.verifyOtp({ email, token, type: "signup" })` signs them in. `resendSignupCode` → `supabase.auth.resend({ type: "signup", email })`.
4. **Template requirement:** Supabase → Authentication → Email templates must contain `{{ .Token }}` in **Confirm signup**, **Reset password** and **Change email** (`docs/LEAD-TODO-2026-10-12.md` section 3). Already done for the app; the web inherits it.
5. **Gotcha (already-registered):** with confirmation on, signUp for an address that already has a confirmed account returns a user with `identities: []` and no error (`auth.ts:144-152`). Treat that as "User already registered" or the page promises a code that never comes. The app does not check this; the web must.
6. **Gotcha (family code vs referral code):** since `family_codes.sql` the sign-up "code from family" field is a 6-char `[A-Z0-9]{6}` **family code**, and after the account exists the app calls `join_family(code)` (section 3.2). The same metadata field still gets passed to `handle_new_user` as `referral_code`, which only ever sets `profiles.referred_by` when it happens to match somebody's 6-letter referral code. The web must do both: pass it in metadata AND call `join_family` after `verifyOtp` succeeds (`SignUpScreen.js:44-56`, `src/lib/useFamilyCodeLinks.js` reads `?ref=` from `window.location.href`).

### 1.3 Sign-in (`auth.js verifyLogin`)

`supabase.auth.signInWithPassword({ email: norm, password })`, then `fetchProfile(userId)`:

```js
const PROFILE_COLUMNS =
  "first_name, last_name, avatar_url, referral_code, phone, gender, date_of_birth, " +
  "show_phone_number, show_birthday, discover_by_phone, discover_by_qr, " +
  "friend_suggestions, phone_contacts, biometric_login, language, " +
  "plan, express_expires_at, subscription_cancel_at, comp_access_at";
const NEWER_COLUMNS = ", share_usage, weekly_digest";   // analytics.sql, weekly_digest.sql
supabase.from("profiles").select(PROFILE_COLUMNS + NEWER_COLUMNS).eq("id", userId).maybeSingle()
// on error.code in ["42703","PGRST204"] → retry with PROFILE_COLUMNS alone
```

`mapUser()` (`auth.js:~84-120`) produces `currentUser = { id, email, firstName, lastName, avatarUri, referralCode, phone, gender, dateOfBirth, settings, plan, subscriptionCancelAt, createdAt, isDemo }`. `plan = resolveEffectivePlan(profile.plan, profile.express_expires_at, profile.comp_access_at)` (`src/lib/subscriptions.js:177-187`: `comp_access_at` set → `"complimentary"`; `express` past `express_expires_at` → `"free"`; else `plan || "free"`). `settings` keys ↔ columns: `SETTINGS_COLUMNS` (`auth.js:~72-83`): `showPhoneNumber→show_phone_number, showBirthday→show_birthday, discoverByPhone→discover_by_phone, discoverByQr→discover_by_qr, friendSuggestions→friend_suggestions, phoneContacts→phone_contacts, biometricLogin→biometric_login, language→language, shareUsage→share_usage, weeklyDigest→weekly_digest`. Defaults in `SETTINGS_DEFAULTS` (`auth.js:~38-52`): all true except `friendSuggestions`, `phoneContacts` false; `language: "United States"`.

### 1.4 Session restore at boot (`auth.js getSession`, `AppContext.js:~147-185`)

1. `supabase.auth.getSession()` (local token). If none → signed out.
2. `supabase.auth.getUser()` (server round trip). `sessionIsOver(error, user)` (`src/lib/sessionCheck.js:11-19`): only `AuthSessionMissingError`, or an `AuthApiError` with 4xx status, ends the session; a network error **keeps** the session (a grandmother on patchy Wi-Fi must not be signed out). Port this function verbatim.
3. `fetchProfile`, `mapUser`.

### 1.5 What runs at every sign-in and every boot (`AppContext.js loadForUser`, lines ~187-250, and the boot effect ~147-185)

In this order, before the first `loadState`:

1. `acceptInvites()` → `supabase.rpc("accept_story_invites")` (`src/data/collaborators.js:88-95`): links pending `story_managers` rows addressed to `auth.jwt()->>'email'` to this user, sets `status='active'`, and if any landed sets `profiles.onboarding_complete = true` and `active_story_id = coalesce(active_story_id, <first story invited to>)` (`collaborators.sql:132-179`). Returns an integer count.
2. `claimPeople()` → `supabase.rpc("claim_people")` (`src/data/family.js:298-305`): links `people` rows carrying this email to the account; since `family_join_merge.sql` also folds the person's own solo household into the family. Returns a count (0 on PGRST202/42883).
3. `loginPurchases(user.id)` — RevenueCat, **native only**; the web skips it (section 10 says how plan is read instead).
4. `loadState(user.id)` (section 2.2).
5. `mergeSelfRows(family, stories, userId)` (`src/lib/familyTree.js`) on a copy, so one account is one person in the tree; avatar ↔ tree photo filled in whichever way is empty.
6. `touchIfDue()` → `supabase.rpc("touch_active")` (`src/data/letters.js:213-217`) at most once per 24 h per user (device-local stamp `astory-active-stamp:<userId>`); it stamps `profiles.last_active_at`, which starts the six-month letter clock (`letters.sql:85`). The web should keep the same once-a-day rationing in `localStorage`.
7. On app foreground (`AppState` "active"): `persist()` if a save is pending, then `refreshShared()` at most once a minute, which re-runs `acceptInvites` + `claimPeople` and reloads only if either returned > 0 (or `{ force: true }` after joining with a code). Browser equivalent: `visibilitychange` + `focus`.
8. `refreshPlan()` (`AppContext.js:~700`) → `getCurrentPlan(userId)` (`subscriptions.js:193-214`): `select("plan, express_expires_at, subscription_cancel_at, comp_access_at")` from `profiles`. Called after purchases; the web can call it on boot and on focus.

### 1.6 Password reset (code, not link)

- `requestPasswordReset(email)` → `supabase.auth.resetPasswordForEmail(norm)`; always `{ ok: true }` on success so the UI can't probe which emails exist.
- `verifyPasswordResetCode(email, token)` → `verifyOtp({ email, token, type: "recovery" })` (opens a short recovery session), then `applyNewPassword(newPassword)` → `supabase.auth.updateUser({ password })`, then **the app signs out** so the person signs in fresh. The site (`auth.ts:206-213`) deliberately stays signed in. Either is correct for the web; the site's choice is the better one on a desktop.

### 1.7 Email and password change (signed in)

- Password: `verifyCurrentPassword(email, pw)` (a fresh `signInWithPassword`), `sendPasswordChangeCode()` → `supabase.auth.reauthenticate()`, `confirmPasswordChange(newPassword, code)` → `updateUser({ password, nonce: code })`. The nonce is enforced only if "Secure password change" is on in the dashboard.
- Email: `requestEmailChange(newEmail)` → `updateUser({ email })`; `confirmEmailChange(newEmail, code)` → `verifyOtp({ email: newEmail, token, type: "email_change" })`. With "Secure email change" on, Supabase also mails the OLD address a link that must be clicked separately; the app has no second code field.

### 1.8 Delete account

`supabase.functions.invoke("delete-account")` (`auth.js:~498`) — no body; the function reads the caller from the JWT (`supabase/functions/delete-account/index.ts:91-102`). Server: removes `avatars/<uid>/*`, then for every owned story with an active co-manager hands `stories.owner_id` to the longest-standing one and deletes that manager row (`index.ts:124-166`); deletes storage under `{storyId}/` in `memory-photos` and `memory-audio` for stories nobody else keeps; `admin.auth.admin.deleteUser(userId)`. Returns `{ success: true }` or `{ error }`. Client then `clearSession()` (local sign-out) and clears state. **Verify-JWT: yes** (default deploy).

### 1.9 Gotchas

- **"Failed to fetch" bug (fixed in `friendlyAuthError`, `auth.js:~580-610`).** supabase-js catches the fetch rejection and returns it as `error`, so screen-level `catch` blocks never ran and the raw string reached the UI (`docs/product/flows.md:87-95`). Keep the translation in the auth module, not the screen. The site's copy of the mapping (`auth.ts:71-96`) also handles `rate limit` / `security purposes` and `expired or is invalid`; use the site's list.
- `profiles` is **select-own / update-own** only (`schema.sql:412-421`). Reading anyone else goes through security-definer RPCs. A `before update` trigger `guard_profiles_billing()` (`schema.sql:161`, redefined by `access_codes.sql:58`) silently reverts client writes to `plan, express_expires_at, stripe_customer_id, stripe_subscription_id, subscription_cancel_at, revenuecat_original_transaction_id, comp_access_at, comp_access_code`. A web "update plan" would appear to succeed and change nothing.
- `profiles.active_story_id` has an FK to `stories(id)` (`schema.sql:292-296`). Write stories before profile (section 2.6).
- `isDemo` is `email === "demo@astory.com"`; `ensureDemoState` seeds a Walter Morrison story. The web does not need the demo account.

---

## 2. DATA MODEL & LOAD/SAVE

Sources: `src/data/store.js`, `src/data/rows.js`, `src/data/family.js`, `src/data/familyRows.js`, `src/lib/saveErrors.js`, `src/lib/saveOutbox.js`, `src/state/AppContext.js`, `supabase/schema.sql`, `supabase/collaborators.sql`, `supabase/family.sql`.

### 2.1 Tables and columns the web reads/writes

Base columns from `schema.sql`; added columns from the `alter table … add column if not exists` lines across `supabase/*.sql` (the file is named where it matters).

**profiles** (`schema.sql:12-20` + alters): `id, first_name, last_name, avatar_url, onboarding_complete, active_story_id, created_at, referral_code, referred_by, plan, express_expires_at, subscription_cancel_at, stripe_customer_id, stripe_subscription_id, revenuecat_original_transaction_id, call_seconds_used, call_period_start, comp_access_code, comp_access_at, phone, gender, date_of_birth, phone_digits, show_phone_number, show_birthday, discover_by_phone, discover_by_qr, friend_suggestions, phone_contacts, biometric_login, language, share_usage, weekly_digest, trusted_user_id, trusted_email, last_active_at, family_call_seconds_used`. Client writes: `onboarding_complete, active_story_id` (planSave), the Edit Profile/settings columns above, `avatar_url`, `call_seconds_used`/`call_period_start` (callUsage). Never the billing columns.

**stories** (`schema.sql:268-287` + alters): `id, owner_id, name, last_name, relationship, relationship_other, birth_day, birth_month, birth_year, has_account, connected_email, photo_url, intro, sessions_completed, streak_days, last_memory_date, done_topics_today, created_at, is_public, public_slug, contributions_open, contribute_slug, cover_url, nickname, directory, book_design, call_style, household_id, merged_into, merged_at, subject_person_id`.
`storyToRow` (`rows.js:7-43`) writes exactly: `id, owner_id, name, last_name, relationship, relationship_other, nickname, directory, birth_day, birth_month, birth_year, has_account, connected_email, photo_url, cover_url, intro, is_public, public_slug, contributions_open, contribute_slug, sessions_completed, streak_days, last_memory_date, done_topics_today, created_at`, plus `book_design` only when set, `call_style` only when set. **Never** `household_id`, `merged_into`, `subject_person_id` (read-only; `family.js:184-192` sets `household_id` via a separate update).
Values: `relationship` ∈ `RELATIONSHIPS` (`store.js:485-498`: Grandmother, Grandfather, Mother, Father, Spouse, Sibling, Aunt, Uncle, Relative, Friend, Myself, Other); `has_account` ∈ `null | "cannot" | …` (free text from NewStory; demo uses `"cannot"`); `directory` null or a key from `src/lib/social.js DIRECTORIES`; `done_topics_today` jsonb `{ date: "", eras: [] }`; birth fields are **text** (`"March"`, `"1945"`), not numbers.

**memories** (`schema.sql:299-312` + alters): `id, story_id, title, body, excerpt, era, period, rating, rating_note, privacy, status, created_at, cover_url, color, contributor, author_person_id, created_by, family_call_id, person_ids, source, merged_from`.
`memoryToRow` (`rows.js:45-74`) writes exactly: `id, story_id, title, body, excerpt, era (normaliseEra), period, rating, rating_note, privacy, status, cover_url, color, contributor, author_person_id, created_at`, plus `family_call_id` only when set, `person_ids` only when it is an array (absent ≠ empty: "never asked" vs "nobody"), `source` only when set. **Never** `created_by` (DB default `auth.uid()`, `analytics.sql`) or `merged_from`.
Values: `privacy` ∈ `"shared" | "private"`; `status` ∈ `"saved" | "in_progress"`; `color` text, `""` = never chosen (`memory_color.sql`); `source` has a check constraint `source is null or source in ('memoir')` (`memory_source.sql:14-16`) — **do not write `"call"` etc. into `source`** (see 8.9); `era` ∈ `ERAS` after `normaliseEra` (2.7); `period` is free text, `timeline.parseYear` reads a year out of it; `rating` 0-5 integer.

**memory_photos** (`schema.sql:317-325`): `id (bigint identity), memory_id, public_url, storage_path, sort_order, created_at`. Rewritten wholesale per memory: `delete().in("memory_id", ids)` then insert `{ memory_id, public_url, storage_path, sort_order }` (`store.js:208-235`). `storage_path` is `privatePhotoRef(url)?.path || url`, or `inline/<memoryId>/<i>` for a `data:` URL. The app stores the **public-form URL** (`…/storage/v1/object/public/memory-photos/<story>/<memory>/<uuid>.jpg`) as the photo's identity even though the bucket is private; it is re-signed at display time (section 4).

**memory_audio** (`memory_audio.sql:31-50`): `id, memory_id, bucket (default 'memory-audio'), storage_path, speaker ('narrator' | 'assistant'), duration_seconds numeric, transcript, sort_order, created_at`. Rewritten wholesale like photos (`store.js:240-273`); clips without a `path` are skipped.

**people** (`family.sql:43-73` + `person_facts.sql`, `people_permissions.sql`, `people_jobs_organizer.sql`): `id, household_id, user_id, given_name, family_name, email, phone, avatar_url, birth_year, death_year, story_id, status ('listed' | 'invited' | 'active'), source ('manual' | 'gedcom' | 'contribution' | 'invite' | 'placeholder'), external_ref, created_at, sex, invited_at, created_by, jobs`, plus `PERSON_FACT_COLUMNS` (`familyRows.js:21-38`): `birth_month, birth_day, birth_place, death_month, death_day, death_place, resting_place, grew_up, schools, work, jobs, known_for, faith, fact_sources, source_links`. Unique: `(household_id, user_id)`, `(household_id, lower(email))`, `(household_id, external_ref)`.
`personToRow` (`familyRows.js:88-109`) writes: `id, household_id, user_id (only ever carried from a loaded row), given_name, family_name, email (lowercased), avatar_url, birth_year, death_year, story_id, status (derived: userId→active, invitedAt→invited, else listed), source, external_ref, sex, invited_at`, plus each fact column only when the person object has that key. Never `created_by`.

**relationships** (`family.sql:115-130`): `id, household_id, from_person, to_person, kind ('parent' | 'spouse' | 'other'), label`. For `kind='parent'`, **from_person is the parent of to_person**. Upsert `onConflict: "from_person,to_person,kind", ignoreDuplicates: true` (`family.js:224-234`); deletes by the triple.

**households** (`family.sql:33-38`): `id, name, created_by, created_at`. Client inserts `{ name: lastName, created_by: userId }` once when no household is known (`family.js:97-115`). **household_admins** (`tree_admins.sql:26`): `household_id, user_id`; managed only via `add_tree_admin`/`remove_tree_admin`.

**story_managers** (`collaborators.sql:18-28` + alters): `id, story_id, user_id, invited_email, role ('manager'), status ('pending' | 'active'), created_at, invited_by, merged_from, person_id`. Client inserts `{ story_id, invited_email, role: "manager", status: "pending" }` (owner only, `story_managers_insert_owner`) and deletes by id (owner, or self).

**family_codes** (`family_codes.sql:31`): read `code, person_id, story_id, max_uses, uses, expires_at` (`familyCodes.js:39-43`), delete by `code`. Created only via `family_code_for` RPC.

**contributions** (`contributions.sql:25-56` + alters): `id, story_id, kind ('testimonial' | 'memory'), contributor_name, relationship, title, body, photos jsonb, status ('pending' | 'approved' | 'rejected'), created_at, reviewed_at, reviewed_by, memory_id, contributor_email, person_id, person_ids, via, created_by`. Insert (member or household relative) `{ story_id, kind, contributor_name, relationship, title, body, photos, memory_id, via, status: "pending", person_ids? }` with `writeDroppingMissing(..., ["person_ids","via"])` (`contributions.js:124-147`); `via` ∈ values of `contributions_via_known` (`contributions_via.sql:14`; the app sends `"app"`). Update `{ status, reviewed_at, reviewed_by }` and **check `data.length`**: RLS answers a refused update with no error and no rows (`contributions.js:223-235`).

**family_questions** (`family_questions.sql:18-32`): `id, household_id, person_id, asked_by, asker_name, question, status ('open' | 'answered' | 'dismissed'), memory_id, created_at, answered_at`. All access via RPCs (3.5).

**letters** (`letters.sql:33-48` + `letters_photos_mail.sql`): `id, owner_id, to_person_id, to_name, title, body, status ('sealed' | 'given' | 'released'), created_at, updated_at, photo_paths, to_email`. Owner-only RLS (`letters_own`). Client: `select("*").order("updated_at", desc)`; insert `{ to_person_id, to_name, to_email, title, body, photo_paths, updated_at, owner_id }` / update by id; on 42703/PGRST204 retry without `photo_paths` and `to_email` (`letters.js:78-114`). Received letters only via `my_received_letters()`.

**story_milestones** (`milestones.sql:17-32`): `id, story_id, kind ('anniversary' | 'remembrance' | 'other'), label, day, month, year (nullable), created_at`. `select("*").order("month").order("day")`; insert; delete by id (`milestones.js`).

**book_orders** (`schema.sql:366-384` + `book_membership.sql`, `book_editions.sql`): `id, user_id, story_id, status ('pending' | 'paid' | 'fulfilled' | 'canceled' | 'refunded'), stripe_checkout_session_id, stripe_payment_intent_id, amount_cents, currency, page_count_estimate, customer_email, shipping_name, shipping_phone, shipping_address, created_at, updated_at, paid_at, included, plan, pdf_path, design, edition, copies`. **Select-own only**; writes happen in Edge Functions.

**family_calls** (`family_calls.sql:17-50`, read-only for web v1): `id, household_id, caller_id, callee_id, caller_name, callee_name, story_id, status, listening, memory_id, memory_ids, transcript jsonb, guest_token, guest_name, created_at, answered_at, ended_at, kind ('pair' | 'group'), subject_person_id`. The web v1 only reads `transcript` for "Read the whole conversation" on a memory whose `family_call_id` is set (`store.js:62-64`).

### 2.2 The load (`store.js loadState`, lines 131-178)

```js
supabase.from("profiles").select("onboarding_complete, active_story_id").eq("id", userId).maybeSingle()
supabase.from("stories").select(`
      *,
      memories (
        *,
        memory_photos (*),
        memory_audio (*)
      )
    `).order("created_at", { ascending: true })      // no owner filter: RLS returns owned + co-managed
```

Then `loadFamily()` (`family.js:20-49`), four selects in parallel:

```js
supabase.from("people").select("*").order("created_at", { ascending: true })
supabase.from("relationships").select("*")
supabase.from("households").select("id, created_by")
supabase.from("household_admins").select("household_id, user_id")
```

`loadFamily` returns `null` (not an error) when `people`/`relationships` fail with 42P01/PGRST205. `loadState` filters out `stories` with `merged_into` set, sorts memories by `created_at` ascending, and maps rows with `rowToStory`/`rowToMemory` (`store.js:15-129`; the camelCase shapes are in `CONVENTIONS.md`). Both profile and stories errors **throw**; the app shows a "couldn't load" screen, never an empty account (`store.js:140-147`).

Other selects the web needs verbatim:

- Managers: `from("story_managers").select("id, invited_email, role, status, user_id, created_at").eq("story_id", storyId).order("created_at")` (`collaborators.js:15-19`).
- Contributions: `from("contributions").select("*").eq("story_id", storyId).order("created_at", { ascending: false })` + `.in("status", …)`/`.eq("status", …)`; pending count `select("id", { count: "exact", head: true }).eq("story_id", id).eq("status", "pending")` (`contributions.js:66-73, 205-209`).
- Codes: `from("family_codes").select("code, person_id, story_id, max_uses, uses, expires_at").gt("expires_at", nowIso).order("created_at", { ascending: false })` (`familyCodes.js:39-43`).
- Ownership risk: `from("story_managers").select("story_id, invited_email, user_id, status, created_at").in("story_id", ownedIds).eq("status", "active").order("created_at")` (`ownership.js:41-46`).
- Join requests: `from("story_join_requests").select("id, story_id, requester, requester_name, created_at").in("story_id", ids).eq("status", "pending").order("created_at")` (`sameStory.js:77-82`).
- Recent merges: `from("story_merges").select("id, done_at, keep:keep_story(name), fold:fold_story(name, owner_id)").eq("status", "done").gte("done_at", since).order("done_at", { ascending: false })` (`sameStory.js:152-157`).
- Suggestions: `from("person_suggestions").select("*").eq("person_id", pid).eq("status", "pending").order("created_at", { ascending: false })` (`personSuggestions.js:31-36`).
- Their-side requests: `from("contribution_requests").select("id, story_id, memory_id, requester_name, created_at, memories(title)").ilike("invitee_email", exactly(me)).eq("status", "open").order("created_at", { ascending: false })` (`contributionRequests.js:133-138`).
- Call budget: `from("profiles").select("plan, express_expires_at, call_seconds_used, call_period_start, comp_access_at").eq("id", userId).maybeSingle()` (`callUsage.js:103-108`).

### 2.3 The "optional column missing → drop and retry" pattern (`src/lib/saveErrors.js`)

`classifySaveError(err)` (lines 22-34) buckets by Postgres/PostgREST code:

- `"behind"` (the database is a migration behind): `42703, PGRST204, 42P01, PGRST205, PGRST202, 42883`
- `"refused"`: `42501`, any `PGRST3xx`, HTTP 401/403, or message matching `/row-level security|permission denied|JWT expired/i`
- `"conflict"`: any `23xxx`
- `"offline"`: `PGRST000, PGRST001, PGRST002, 57014, 08006, 08001, 53300`, HTTP ≥500/408/429, or a `TypeError`/`AbortError`/network-shaped message with no code

`missingColumnName(err)` (lines 40-49) parses `could not find the '<col>' column`, `column "<col>" of relation "<t>" does not exist`, `column t.<col> does not exist`.

`writeDroppingMissing(rows, write, optional, limit = 4)` (lines 56-76): call `write(rows)`; if the error is `"behind"` and names a column that is in `optional` and present on the rows, strip it from every row and retry, up to `limit` times; returns the dropped names; otherwise rethrows.

Optional lists the app uses:
- stories: `OPTIONAL_STORY_COLUMNS = ["book_design", "call_style", "cover_url", "nickname", "directory"]` (`store.js:198`)
- memories: `OPTIONAL_MEMORY_COLUMNS = ["person_ids", "family_call_id", "color", "author_person_id", "cover_url", "contributor", "source"]` (`store.js:199`)
- people: `OPTIONAL_PEOPLE_COLUMNS = ["sex", "invited_at", "avatar_url", "external_ref", "source", "death_year", ...PERSON_FACT_COLUMNS]` with `limit = OPTIONAL_PEOPLE_COLUMNS.length` (`family.js:132-138`)
- contributions: `["person_ids", "via"]` (`contributions.js:146, 187`)
- letters: hand-rolled retry without `photo_paths`, `to_email` on 42703/PGRST204 (`letters.js:104-111`)
- profile read: `NEWER_COLUMNS` retry (1.3)
- "missing function" = `["PGRST202", "42883"]` everywhere (`family.js:81`, `familyCodes.js:8`); "missing table" = `["42P01", "PGRST205"]` (`family.js:16`).

Also: `summariseFailures(errors)` ranks `refused > behind > conflict > other > offline` and returns `{ kind, part, parts, groups, message }`; `saveBannerCopy(failure)` is the banner text; `syncedAfter(state, baseline, failedGroups)` is the new baseline after a partial save. All pure; `web-app/src/app-core/lib/saveErrors.js` already holds a verbatim copy.

### 2.4 How a save is planned (`rows.js planSave`, lines 88-134)

Given `state` and `baseline` (the tree as last loaded/saved), per story: if `storyToRow(story)` ≠ `storyToRow(old)` (JSON string compare) → `created` (no `old`), `owned` (ownerId is me), or `shared` (someone else's story: UPDATE only, never upsert, because an upsert's proposed row carries their `owner_id` and the owner-only insert policy refuses it). Per memory: `memories` if `memoryToRow` differs; `photos` if the `photos[]` array differs; `audio` if `audio[]` differs. `profile = { onboarding_complete, active_story_id }` only when changed. With no baseline, everything.

### 2.5 How a save is executed (`store.js saveState`, lines 281-360)

Parts, each tagged with `tagSaveError(err, part)` so one failure doesn't stop the rest:

1. **stories**: `created` rows one at a time via `insert(r)`; on `23505` fall back to `upsert(r, { onConflict: "id" })` (an upsert of a NEW story is checked against the update policy and refused, `store.js:300-313`; this broke every new account's first story on 2026-10-14). `owned` → `upsert(rows, { onConflict: "id" })` in one call. `shared` → `update(fields).eq("id", id)` with `id, owner_id, created_at` stripped. All through `writeDroppingMissing`.
2. **memories** (only if stories landed): chunks of 100, `upsert(rows, { onConflict: "id" })`.
3. **photos**: `syncMemoryPhotos` (delete-then-insert, chunked).
4. **audio**: `syncMemoryAudio` (same).
5. **family**: `saveFamily(userId, state, baseline)` (`family.js:167-259`): find/make household; `stories.update({ household_id }).in("id", loose).is("household_id", null)`; route people writes via `routePeopleWrites` (`familyRows.js:193-218`) + `canEditPerson` (`src/lib/personRights.js`) into direct upserts, `invite_person(pid, mail)`, `link_person_story(pid, sid)`, or refused; `23505` on people → retry one-by-one dropping `email`; relationships upsert/delete; people delete.
6. **profile** (only if stories landed, because of the FK): `profiles.update({ onboarding_complete, active_story_id })`.

Throws an `Error` with `.errors = [tagged errors]` if anything failed. Saves are serialised through `saveChain` (`AppContext.js:~113`) because two concurrent delete-then-inserts of the same memory's photos would leave both sets.

### 2.6 AppContext's `mutate()`, the outbox, and the retry loop (`AppContext.js`)

- `mutate(updater, { strict })` (lines ~608-628): `structuredClone(dataRef.current)` → `updater(draft)` → set state synchronously **from a ref, not inside `setState(prev => …)`** (under React 19 the updater runs late and `persist()` saw `undefined`) → `persist()`. `strict: true` throws `Error{ code: "SAVE_FAILED" }` when the save didn't land, for callers whose next step needs the row (approving a contribution, asking family about a memory).
- `persist()` (lines ~420-468): `saveState(user.id, state, syncedRef.current)`; on success `markSynced(state)`, clear `saveError`, remove the outbox. On failure: `summariseFailures`, `markSynced(syncedAfter(state, before, failure.groups))` so landed parts are never resent, write `outboxFrom(state, before, failure.groups)` to AsyncStorage key `saveOutbox:<userId>` (`src/lib/saveOutbox.js`), `setSaveError(failure)`.
- Retry: automatically after 30 s unless `kind` is `refused`/`conflict`; on foreground; `retrySave()` button; `discardUnsaved()` reloads the server copy ("Undo", offered only on `refused`). At boot `applyOutbox(loaded, box)` puts unsaved memories/people/edges back on top of the server copy and `persist()`s them; memories whose story is gone are kept aside under `saveOutbox:<uid>:left`.

**Minimal web equivalent** (what must exist regardless of architecture): (a) per-entity writes with the exact column whitelists above; (b) a visible, retryable save-error state with the `offline/refused/behind/conflict/other` classification; (c) an outbox in `localStorage`/IndexedDB keyed by user for writes that didn't land, replayed at next load; (d) never send a whole tree over someone else's changes (the diff is not an optimisation — it stopped a stale phone deleting a relative's new photos, `rows.js:78-87`).

**Recommended cleaner approach for the web:** per-record writes instead of whole-tree save. On "save memory": `upsert` that one `memories` row (whitelisted via `memoryToRow`), then its `memory_photos`/`memory_audio` rows (delete by `memory_id` + insert), in a small per-record mutation with its own retry; on "edit story": `upsert`/`update` that one `stories` row; on tree edit: that one `people`/`relationships` row through the same `routePeopleWrites` rules. Use TanStack Query mutations with `onError` → outbox entry + banner, and a `Promise` chain per memory id so two saves of the same memory serialise. This keeps every RLS and column rule identical while removing the baseline/diff machinery. Keep `planSave`/`storyToRow`/`memoryToRow`/`personToRow` from `rows.js`/`familyRows.js` as the single source of row shapes (they are pure; add `data/rows.js` and `data/familyRows.js` to `web-app/scripts/sync-from-app.mjs` FILES).

### 2.7 What must stay identical for cross-device compatibility

- **ids are client-generated UUID v4** (`src/lib/uuid.js`; `createStory`/`createMemory` in `store.js:410-481`) and `created_at` is set by the client as ISO (`new Date().toISOString()`); the DB defaults are only fallbacks. Approved contribution memories take the **contribution's id** so approving twice lands on the same row (`contributions.js:291`).
- `privacy` ∈ `shared | private`; `status` ∈ `saved | in_progress`; `speaker` ∈ `narrator | assistant`; `kind` ∈ `testimonial | memory`; contribution `status` ∈ `pending | approved | rejected`; manager `status` ∈ `pending | active`.
- `era` must be one of `ERAS` (`src/data/eras.js:17-52`, 11 chapters) and reads must pass through `normaliseEra`, which applies `RENAMED` (`eras.js:73-83`): `"Later years"→"Looking back", "What I've learned"→"Looking back", "School years"→"Growing up", "Early adulthood"→"Growing up", Career→"Work & making a living", Wisdom→"Looking back", Life→"Anything else", Other→"Anything else"`; anything else → `"Anything else"`. `CORE_CHAPTERS` excludes `"From the family"`, `"Anything else"`, `"Faith & what carried me"`. There is **no DB migration** behind the rename; `memories.era` still defaults to `'Life'` in the schema (`schema.sql:305`).
- `excerpt` defaults to `body.slice(0, 140)` (`store.js:464`); family-approved memories use `slice(0, 200)` and `era = FAMILY_CHAPTER`, `contributor = "Name, Relationship"`.
- Photo URL identity: store the public-form `getPublicUrl` string; never store a signed URL (section 4).
- `personIds` absent vs `[]` carries meaning (2.1).
- Device-local things that are NOT in the DB and therefore do not sync: daily/weekly free-tier meters (`src/lib/usage.js`, AsyncStorage keyed by email), compose drafts (`src/lib/draft.js`, key `draft:memory:<storyId>`), `talkedBefore` marks, the call draft, the active-stamp throttle, the outbox. The web gets its own copies; a person on Free who used 3 questions on the phone can use 3 more on the web (known, accept it, or move the meter to a column later).

---

## 3. RPCs

Every `supabase.rpc(...)` in `src/data` and `src/lib`, grouped. "Returns" is what the JS reads. "SQL" is the file that (last) defines it; where two files define the same name, the later one in `all.sql` order wins (listed second).

### 3.1 Invites / managers / ownership

| RPC | Args | Returns | SQL | JS |
|---|---|---|---|---|
| `accept_story_invites` | none | `integer` accepted | `collaborators.sql:132` | `collaborators.js:89` |
| `transfer_story_ownership` | `{ sid, to_user }` | `boolean`; raises if caller isn't owner | `ownership.sql:56` | `ownership.js:75` |
| `is_story_member` | `{ sid, uid }` | boolean (used server-side by `create-book-checkout`) | `collaborators.sql:37` | — |

### 3.2 Family codes / join / tree

| RPC | Args | Returns | SQL | JS |
|---|---|---|---|---|
| `family_code_for` | `{ pid, sid }` (either may be null) | `text` the code; error message `/already on A Story/` → "already" | `family_codes.sql:97` | `familyCodes.js:20` |
| `join_family` | `{ code }` | jsonb `{ ok: true, person_id, person_name, story_id, story_name, inviter_name, already, moved }` or `{ ok: false, reason: 'signed_out' \| 'too_many' \| 'not_found' \| 'expired' \| 'used' \| 'taken' }` | `family_codes.sql:157`, redefined `family_join_merge.sql:301` | `familyCodes.js:74` |
| `claim_people` | none | integer claimed | `family.sql:246`, redefined `family_join_merge.sql:463` | `family.js:299` |
| `invite_person` | `{ pid, mail }` | void | `people_permissions.sql:111` | `family.js:202` |
| `link_person_story` | `{ pid, sid }` | void | `people_permissions.sql:138` | `family.js:210` |
| `add_tree_admin` / `remove_tree_admin` | `{ hid, uid }` | boolean | `tree_admins.sql:101/120` | `family.js:72` |
| `set_household_organizer` | `{ hid, uid }` | boolean | `people_jobs_organizer.sql:53` | `family.js:268` |
| `my_duplicate_people` | none | rows `{ keep, fold, given_name, family_name, birth_year }` | `family_join_merge.sql:498` | `family.js:280` |
| `merge_people` | `{ keep, fold }` | boolean | `family_join_merge.sql:531` | `family.js:290` |
| `can_edit_person` | `{ pid, uid }` | boolean (DB-side guard; JS mirrors it in `lib/personRights.js`) | `people_permissions.sql:36`, redefined `tree_admins.sql:63` (self or tree admin) | — |

### 3.3 Contributions / their side

| RPC | Args | Returns | SQL | JS |
|---|---|---|---|---|
| `submit_contribution` | `{ slug, contributor_name, relationship, kind, title, body, photos, contributor_email }` (anon, web contribute page) | boolean | `contributions.sql:129` | landing page only |
| `get_contribute_info` | `{ slug }` | story card for the anon page | `contributions.sql:101` | `landing-page-publish/src/components/contribute.tsx:71` |
| `ask_for_their_side` | `{ mem, person_ids, requester }` | jsonb `{ ok, asked, inApp, emailed, reason }` | `their_side_family.sql:50` | `contributionRequests.js:99` |
| `my_their_side_requests` | none | rows | `their_side_family.sql:103` | not called in `src/data` (not found) |

In-app submissions are **direct inserts** under `contributions_insert_member` (member; forces `status='pending'`, `contributions.sql:76-81`) or `contributions_insert_household` (relative in the tree, `family_shared_tree.sql:70-76`). See 8.1.

### 3.4 Family reading / same-person / merge

| RPC | Args | Returns | SQL | JS |
|---|---|---|---|---|
| `family_story_read` | `{ sid }` | jsonb `{ id, name, last_name, memories: [{ id, title, body, era, period, created_at, contributor, source, shared, sides: [{ body, contributor_name, relationship, created_at }] }] }` or null | `family_reading.sql:27` | `familyReading.js:54` |
| `story_card` | `{ sid }` | `{ id, name, last_name, keeper_name, memories, is_keeper, asked }` | `same_person_stories.sql:85` | `sameStory.js:47` |
| `request_story_join` | `{ sid, my_name }` | text status | `same_person_stories.sql:116` | `sameStory.js:67` |
| `answer_story_join` | `{ rid, yes }` | boolean | `same_person_stories.sql:142` | `sameStory.js:97` |
| `my_duplicate_stories` | none | rows `{ mine, other, name, last_name, other_keeper, mine_memories, other_memories, … }` | `same_person_stories.sql:201` | `sameStory.js:106` |
| `propose_story_merge` | `{ keep, fold }` | text status | `same_person_stories.sql:293` | `sameStory.js:131` |
| `answer_story_merge` | `{ mid, yes }` | `'done' \| 'declined' \| 'gone'` | `same_person_stories.sql:349` | `sameStory.js:143` |
| `undo_story_merge` | `{ mid }` | boolean | `same_person_stories.sql:383` | `sameStory.js:170` |

### 3.5 Family questions / suggestions

| RPC | Args | Returns | SQL | JS |
|---|---|---|---|---|
| `ask_family_question` | `{ pid, q }` | uuid | `family_questions.sql:48` | `familyQuestions.js:17` |
| `my_family_questions` | none | rows `{ id, person_id, asker_name, question, created_at }` | `family_questions.sql:80` | `familyQuestions.js:28` |
| `answer_family_question` | `{ qid, how: 'answered' \| 'dismissed' }` | boolean | `family_questions.sql:115` | `familyQuestions.js:41` |
| `questions_i_asked` | none | rows | `family_questions.sql:97` | not called (not found) |

Person suggestions are direct table writes to `person_suggestions` (`people_permissions.sql:159`): insert `{ person_id, household_id, suggested_by, suggested_by_name, field, value, note }`; update `{ status: 'accepted' \| 'declined', resolved_by, resolved_at }` (`personSuggestions.js`).

### 3.6 Letters

| RPC | Args | Returns | SQL | JS |
|---|---|---|---|---|
| `touch_active` | none | void | `letters.sql:85` | `letters.js:215` |
| `set_trusted_person` | `{ uid, mail }` | void | `letters.sql:98` | `letters.js:172` |
| `my_letter_heir` | none | `{ user_id, name, email, how: 'trusted' \| 'invited' \| 'family' }` | `letters.sql:193` | `letters.js:155` |
| `give_letter` | `{ lid }` | `{ name, email }`; `22023` = nobody to give it to | `letters.sql:228`, redefined `letters_photos_mail.sql:125` | `letters.js:146` |
| `my_received_letters` | none | rows `{ id, title, body, photo_paths, to_name, from_name, how, written_at, received_at, opened_at }` (marks opened) | `letters.sql:307`, redefined `letters_photos_mail.sql:235` | `letters.js:184` |
| `count_received_letters` | none | integer | `letters.sql:344` | `letters.js:203` |
| `my_letter_destinations` | none | rows `{ letter_id, to: 'account' \| 'email' \| 'heir' \| 'nobody', email }` | `letters_photos_mail.sql:212` | `letters.js:121` |

### 3.7 Calls (web v1 reads only; listed for completeness)

`family_call_contacts()` (`family_calls.sql:180`), `family_call_listening({ cid, other_uid, sid })` → `{ allowed, reason: 'plan' \| 'free' \| 'used', remaining_seconds }` and `note_family_call_listened({ cid, p_seconds })` (`family_call_listening.sql:58/149`), `start_group_call({ hid, subject, sid, invitees, host_name })`, `invite_to_group_call({ cid, invitees })`, `join_group_call`, `leave_group_call`, `end_group_call({ cid })`, `group_call_link({ cid })` (`family_group_calls.sql:227-402`), `register_call_device`/`remove_call_device` (`call_devices.sql:197/244`, native push). Friends/circles/safety: `friend_list`, `find_people({ p_query, p_source })`, `request_friend({ p_person_id, p_source })` (`accounts.sql:186-314`, `safety.sql:101`), `circle_list({ p_story })`, `create_circle({ p_story, p_name, p_cover, p_members })` (`circles.sql`), `block_person({ p_person_id })` (`safety.sql:71`), `redeem_access_code` (`access_codes.sql:111`, `src/lib/accessCode.js:48` — web-only feature per LEAD-HANDOFF 9).

### 3.8 Milestones

No RPC; direct table (2.1). `src/lib/social.js milestonesFor/storedMilestones/milestonesOn` derive the calendar.

---

## 4. STORAGE

| Bucket | Public? | Defined | Path convention | Written by |
|---|---|---|---|---|
| `avatars` | **true** | `schema.sql:568` | `<userId>/avatar.<ext>` with `upsert: true`; return `getPublicUrl + "?t=" + Date.now()` to bust caches (`src/lib/avatarUpload.js:22-41`) | client |
| `memory-photos` | **false** (private since `private_photos_switch.sql`; `storage.sql:12` and `schema.sql:612`) | `<storyId>/<memoryId>/<uuid>.<ext>` (`src/lib/memoryPhotoUpload.js:102-120`). Insert/select/delete policies check `is_story_member((storage.foldername(name))[1]::uuid, auth.uid())` (`family_access_fixes.sql:41-61`, `private_photos.sql:39-47`). **The first path segment must be the story id.** | client |
| `memory-audio` | false | `memory_audio.sql:86` | `<storyId>/<memoryId>/<uuid>.<ext>` (`m4a` default, `mp3`), `contentType: audio/m4a | audio/mpeg` (`src/lib/memoryAudio.js:55-76`); member policies in `family_access_fixes.sql:68+` | client |
| `chat-audio` | false | `schema.sql:679` | written only by the AI server (service role); signed via `POST /api/audio/sign` | server |
| `family-photos` | false, 10 MB, image/* | `family_photos.sql:16` | `<householdId>/<personId>/<uuid>.<ext>` (`src/lib/personPhotoUpload.js:27-38`); household-member policies | client |
| `letter-photos` | false, 10 MB, jpeg/png/heic/webp | `letters_photos_mail.sql:50` | `<userId>/<letterId>/<uuid>.<ext>`, stored as **paths** in `letters.photo_paths`, signed with `createSignedUrls(paths, 3600)` (`src/lib/letterPhotos.js`) | client |
| `contribution-photos` | **true**, anon insert | `contributions.sql:252`, `contribution_uploads.sql:54` | `<storyId>/contrib-<uuid>/<uuid>.<ext>` (`memoryPhotoUpload.js:163-165`) | client + anon web page |
| `book-orders` | false | `schema.sql:705`, `book_membership.sql:42-55` | `<orderId>.pdf`, `<orderId>-cover.pdf`; orderer may upload | client (PDF) + webhook |

**Signing** (`src/lib/photoRefs.js`, `src/lib/photoUrls.js`): a stored photo URL is parsed with `/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/?#]+)\/([^?#]+)/`; if the bucket is in `PRIVATE_PHOTO_BUCKETS = ["memory-photos", "family-photos"]` the `{ bucket, path }` is signed with `createSignedUrls(paths, 3600)`, **batched per tick per bucket**, cached until 5 minutes before expiry, falling back to the stored URL on failure. Port `photoRefs.js` verbatim (it is already in app-core's sync list) and reimplement `photoUrls.js` as a hook/util over the browser client (it imports `lib/supabase` and React, so it is not synced). Audio: `signClip(clip)` (`memoryAudio.js:36-50`) → `createSignedUrl(path, 3600)` for `memory-audio`; for `bucket === "chat-audio"` call the AI server's `/api/audio/sign`.

**Uploads from a browser:** the app uploads `ArrayBuffer`/`Uint8Array` (never RN Blob). In a browser pass the `File`/`Blob` from `<input type=file>` directly to `.upload(path, file, { contentType })`. Content type mapping: `png→image/png`, `heic|heif→image/heic`, `webp→image/webp`, else `image/jpeg`; `jpeg` extension is normalised to `jpg`.

**Resizing on device:** the app does **no explicit resize**; it relies on `expo-image-picker` `quality: 0.8` (composer, `CreateMemoryScreen.js:360-365`, `AddMemoryScreen.js:402`), `0.85` with `allowsEditing` for covers/avatars (`CollaborateScreen.js:241-243`, `EditProfileScreen.js:73-75`), `0.8` for tree faces (`useFamilyTree.js:241-243`). `expo-image-manipulator` is a dependency but no call site was found in `src/` (grep `manipulateAsync`: not found). The browser should replicate "about quality 0.8 JPEG" with a canvas re-encode and cap the long edge (suggest 2048 px) before upload; HEIC from Safari should be re-encoded to JPEG since Chrome can't display HEIC. Keep `exif: true` only to read the taken date (`src/lib/photoDate.js photoTakenLabel`), then strip.

**Delete:** `delete-account` lists `{storyId}/<memoryId>/<file>` two levels deep (`delete-account/index.ts:43-70`); the web never deletes storage objects itself except `removeLetterPhotos`.

---

## 5. EDGE FUNCTIONS

`supabase/functions/*/index.ts`. "JWT" = deployed with the default verify-JWT (caller must be signed in; the function re-reads the user from the `Authorization` header). All answer CORS `OPTIONS`.

| Function | JWT | Request | Response | Web v1 |
|---|---|---|---|---|
| `send-invite-email` | yes | `POST { to, storyName?, referralCode (6 chars [A-Z0-9], the family code), senderName? }` | `{ ok }` / `{ error }` (400 on bad email/code, 500 if `RESEND_API_KEY` unset). Email links: `astory://signup?ref=CODE` and `${INVITE_JOIN_URL \|\| https://astoryapp.com}/?ref=CODE`. | **needed** (`collaborators.js:64-76`). Set `INVITE_JOIN_URL=https://app.astoryapp.com` so the email's button opens the web app. |
| `create-book-checkout` | yes | `POST { storyId, check: true }` → price check; `POST { storyId, edition ('home'\|'digital'\|'softcover'\|'hardcover'\|'heirloom'\|'legacy'), copies }` → checkout | check: `{ included, reason, member, plan, orderingOpen, priceCents, shippingCents, creditCents, editions: [{ id, priceCents, extraCents, sale }] }`; order: `{ checkoutUrl, orderId, included }`; errors `{ error, reason }` (body on `err.context.json()`, `book.js:13-23`). Refuses printed orders unless `BOOK_ORDERING_OPEN=1`. | **needed** |
| `stripe-webhook` | **no** (`--no-verify-jwt`; Stripe-Signature) | Stripe events `checkout.session.completed`, `async_payment_succeeded`, `async_payment_failed`, `expired` | updates `book_orders` | server-only; the web only needs the success/cancel return URLs it is given |
| `public-story` | **no** | `GET ?slug=` or `POST { slug }` | `get_public_story` output with `photo_url` and `memories[].photos[]` re-signed (`SIGN_TTL_SECONDS = 6 * 60 * 60`, `index.ts:26`) or dropped; 404 `{ error: "Not found" }` | needed if the web app hosts `/p/:slug` (the marketing site does today via the RPC directly, `publicStory.tsx:74`; LEAD-HANDOFF 6 says switch to this function) |
| `delete-account` | yes | `POST` (no body) | `{ success: true }` / `{ error }` | **needed** |
| `listen` | **no** | `GET ?m=<shortMemoryId>&k=<key>` | `302` to a signed `memory-audio` URL; text errors | the printed book's QR target; web only links to it (`src/lib/links.js LISTEN_URL`) |
| `family-call-guest` | **no** | `GET/POST { id, t, action: 'info'\|'join'\|'leave'…, name, pid }` | call info / participant row | v1.5 (browser join by link) |
| `send-memory-request` | yes | `POST { requestIds: [uuid] }` | emails invitees of `contribution_requests` | needed for "ask family for their side" by email (`contributionRequests.js:75,117`) |
| `ring-now` | yes | `POST { installId }` | `{ ok, at }` / error | native only |
| `revenuecat-webhook`, `ring-due`, `ring-family`, `weekly-digest`, `letter-mail`, `apns-probe` | no (secrets) | — | — | server-only |

Invoke from the web exactly as the app does: `supabase.functions.invoke(name, { body })`; a non-2xx body is on `error.context` (a `Response`), read with `await error.context.json()`.

---

## 6. AI SERVER CONTRACT (`EXPO_PUBLIC_API_URL`, Flask)

Sources: `src/data/api.js`, `src/data/realtime.js`, `src/lib/callStyle.js`, `src/lib/conversationContext.js`, `src/lib/teller.js`, `src/lib/callSummary.js`, `src/lib/writeHelper.js`, `src/screens/LiveTalkScreen.js`, `src/screens/MemorySummaryScreen.js`, `src/screens/createMemory/WriteCompanion.js`, `docs/*-for-server.md`, `docs/deploy-2026-10.md` section 4.

Auth on every call: `Authorization: Bearer <supabase access_token>` from `supabase.auth.getSession()` (`api.js:19-27`); `{}` when signed out (server soft-auth until `REQUIRE_AUTH=1`). The server is **stateless**: the whole conversation is sent each time. **The web needs CORS from the server for `https://app.astoryapp.com` and `http://localhost:5180`** — nothing in the repo shows CORS headers on the Flask side; treat it as "the server team's to add" (web-app README calls the live conversation "v1.5, once the AI server allows this origin").

### 6.1 Endpoints

| Endpoint | Body → Response | Status |
|---|---|---|
| `POST /api/chat` | `{ conversation: [{ role: 'user'\|'assistant', content }] }` → `{ reply, audio_url (signed, ~1h), audio_path, msg_id }`, or at the token limit `{ closing_reply, closing_audio_url, closing_audio_path, closing_msg_id, summary, session_ended }`. Also the vision path for photos shown during a call (`realtime.js:274-279`). | confirmed (in use) |
| `POST /api/summary` | `{ conversation, mode: 'talk'\|'family-call'\|'group'\|'room' }` → `{ summary: "<JSON string>" }` where the JSON is one object or an array of `{ title, summarization, exact_transcript, era, date_happened, links }`, possibly fenced in ```` ```json ````. Parsed by `parseSummary` (`callSummary.js:15-25`); drafted by `buildDrafts(summaries, conversation, story)`. A relative's lines arrive as `"Jamie (about Hưng): …"` (`teller.js conversationForTeller`). | confirmed; array-for-room/group is "server team's to add" (doc 1d) |
| `POST /api/transcribe` | multipart `audio` file → `{ transcript }` | confirmed |
| `POST /api/transcribe-conversation` | multipart `audio`, field `mode: 'room'` → `{ segments: [{ speaker, text, start, end }] }`; 404/405 → fall back to `/api/transcribe` | server team's to add |
| `POST /api/audio/sign` | `{ audio_path }` → `{ audio_url, audio_path }` | confirmed |
| `POST /api/realtime/session` | `sessionRequest()` body (6.2) → `{ client_secret, expires_at, model }` | confirmed (body fields: voice/pace/talk/tone read status unknown; "until the server reads them, calls stay as they are") |
| `POST /api/realtime/usage` | `{ usage, model }` (from `response.done`) → ignored | confirmed |
| `POST /api/realtime/transcription-session` | `{ purpose: 'family-call' \| 'group-call' }` → `{ client_secret, model }` | server team's to add |
| `POST /api/voice/preview` | `{ voice, language, pace, talk, tone, depth }` → `{ audio_url }` | server team's to add |
| `POST /api/memory/help` | `{ mode: 'tidy'\|'title'\|'questions', text, about }` → `{ text }` \| `{ title }` \| `{ questions: [] }`; app falls back to `src/lib/writeHelper.js` | server team's to add |
| `POST /api/import/read` | multipart `files[]` (PDF or images, ≤40) → `{ text, pages }`; 404/405 → `Error{ code: 'not_ready' }` | server team's to add |
| `POST /api/book/retell` | `{ name, pronoun: 'she'\|'he'\|'they', memories: [{ id, title, body }] }` → `{ memories: [{ id, body }] }`; app refuses partial results | server team's to add |

### 6.2 The session request (`callStyle.js sessionRequest`, lines 165-185)

```js
{ mode, story_id?, voice, language, pace, talk, tone, depth, call_name?, avoid?, names? }
```

- `mode` ∈ `talk | write | group | room`; `voice` ∈ `marin | coral | sage | cedar` (default marin); `language` ∈ `en es vi zh tl ko hi fr pt ar` (`src/data/languages.js`; default from `deviceLocales()` = `navigator.languages` on web); `pace` ∈ `natural | slower | brisker`; `talk` ∈ `listens | balanced | talks`; `tone` ∈ `warm | cheerful | calm | plain`; `depth` ∈ `curious | gentle`; `call_name` ≤40 chars, `avoid` ≤200 (both through `cleanText`); `names` ≤40 strings / 400 chars from `namesToHear(story, people)`. `DEFAULT_CALL_STYLE` also has `length` (5/10/15 min, applied client-side) and `useWritten` (never sent).
- Write companion adds `{ mode: "write", about, question, title, draft (≤ DRAFT_MAX chars) }` (`WriteCompanion.js:157-163`).
- The style lives in `stories.call_style` jsonb; `normaliseCallStyle` repairs anything stored.

### 6.3 How the phone does WebRTC to OpenAI Realtime (`realtime.js startLiveSession`, lines 69-322)

1. `mintSession(request)` → `{ client_secret, model }`.
2. `pc = new RTCPeerConnection()`; `mic = getUserMedia({ audio: true })`; `pc.addTrack(track, mic)` for each track; remote audio plays automatically on RN.
3. `dc = pc.createDataChannel("oai-events")`; message handler switches on `evt.type`:
   - `input_audio_buffer.speech_started` → status `user_speaking`, reset partial; `…speech_stopped` → `listening`
   - `conversation.item.input_audio_transcription.delta` → accumulate `heard += evt.delta` → `onUserPartial`
   - `…transcription.completed` → `onUserText(evt.transcript)`; `…transcription.failed` → clear partial
   - `response.output_audio.delta` / legacy `response.audio.delta` → `assistant_speaking`
   - `response.output_audio_transcript.done` / legacy `response.audio_transcript.done` → `onAssistantText`
   - `response.done` → `listening`, `onUsage(evt.response.usage, model)` → `POST /api/realtime/usage`
4. `offer = pc.createOffer()`; `setLocalDescription`; `POST https://api.openai.com/v1/realtime/calls?model=<model>` with headers `Authorization: Bearer <client_secret>`, `Content-Type: application/sdp`, body `offer.sdp`; answer SDP text → `setRemoteDescription({ type: "answer", sdp })`.
5. Handle: `stop()` (stop mic tracks, disable receiver tracks, close dc and pc), `setMuted(bool)`, `sendText(text)` (= `conversation.item.create` user `input_text` + `response.create`), `addSystemNote(text)` (`conversation.item.create` with `role: "system"`, **never `session.update` of instructions**, which would replace the server-baked persona), `respond()` (`response.create`), `seedAssistantLine(text)` (`conversation.item.create` role assistant `output_text`, no response), `getLevels()` (per-track `getStats()` audioLevel, 4×/s).

**Browser equivalent (prose):** identical API surface exists natively. `const pc = new RTCPeerConnection(); const mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); mic.getTracks().forEach(t => pc.addTrack(t, mic));` Add `pc.ontrack = e => { audioEl.srcObject = e.streams[0]; audioEl.play(); }` with a hidden `<audio autoplay playsinline>` (browsers play nothing without an element — see `peerMesh.web.js:11-37` for the same trick). Create the data channel **before** `createOffer`. The SDP POST is a plain `fetch` from the page to `api.openai.com` with the ephemeral secret (OpenAI allows this origin-agnostic; the secret is single-session). `getStats()` on `RTCRtpReceiver`/`RTCRtpSender` works the same; `src/lib/voiceLevel.js levelsFromStats` is pure. Start the call only from a click (autoplay policy). Leave-handling: `beforeunload` → `stop()`. Everything else in the handle is byte-for-byte the same JSON over the data channel. `realtime.js` imports only `react-native-webrtc` and `./api`, so a `realtime.browser.ts` is a ~100-line rewrite with `window.RTCPeerConnection`.

### 6.4 The notes a talk session receives (`LiveTalkScreen.js:546-630`)

Once status is live, in order: `contextNotes({ memories, style: depth, prompt, useWritten, name, returning, talk })` (`conversationContext.js:148-157`) = `returningNote` (picks up from `lastTold`, no "welcome back") → `brevityNote(talk)` → `toldSoFarNote(memories)` (≤40 lines, ≤4000 chars, memoir first) → `depthNote(count, style)` (`depthFor(memoryCount)` ladder 1–5) → `questionGuideNote(prompt)` (follow-up, hint, sensitive). Then `tellerNote(teller, { storytellerHere })` when a relative is talking (`teller.js:60-76`). Then the opener: daily call → `greetingNote` + `questionNote` + `respond()`; topic/question → `seedAssistantLine(question)`; relative → `seedAssistantLine(about-version)` or `addSystemNote(questionForTeller(...))` + `respond()`. `isReturning({ talkedBefore, memories })` (`talkedBefore.js`) uses a device mark plus memories with `source` in call-like values (see 8.9).

### 6.5 How a call becomes a memory

`LiveTalkScreen saveMemory` (lines ~1004-1055): stop session; `saveCallDraft({ storyId, conversation, clips })` to local storage first; `summarizeConversation(conversationForTeller(conv, teller))` → `parseSummary` → `navigation.replace("MemorySummary", { storyId, drafts: buildDrafts(summaries, conv, story), clips, conversation, photos, seed, credit: tellerCredit(teller), summaryConversation })`. `MemorySummaryScreen` (lines 350-445): per placed draft `createMemory({ title, body, excerpt, era, period, privacy: 'private'|'shared', status: 'saved', contributor?, authorPersonId?, familyCallId?, personIds? })`; first memory gets `photos = sharedPhotos`, cover via `uploadMemoryPhotos(storyId, mem.id, [cover])`, each clip via `uploadMemoryAudio(storyId, mem.id, clip.uri, { duration, transcript, speaker })` → `mem.audio = uploaded`; then one `mutate(d => story.memories.push(...))`; `attachCallMemory(familyCallId, ids)` if from a family call; `clearCallDraft()`; navigate to the memory. Regenerate = `summarizeConversation(summaryConversation)` again. On the web the recorder is `MediaRecorder` (webm/opus); upload with `contentType: "audio/webm"` and `path …/<uuid>.webm` — `memoryAudio.js:65` only maps `mp3`, so extend the content-type map; the DB column doesn't care, playback via `<audio src=signedUrl>` does.

### 6.6 Write companion (`WriteCompanion.js:140-193`)

Same `startLiveSession` with `session = { ...sessionRequest(style, storyId, "write", { names }), mode: "write", about, question, title, draft }`. On live: `addSystemNote(companionNote({ name, about, question, title, draft, writeAlong }))` (`writeHelper.js:119-137`) then `respond()`. `onUserText` appends the person's own words to the page when `writeAlong` is on; A Story's words are never written. "Ask me" → `addSystemNote('They asked for a question. Ask this, in your own words, and nothing else: "<followUps(...)[0]>"')` + `respond()`. "Tidy spelling" = `tidyText` locally. Consent gate: `ensureAiConsent(userId)` (`src/lib/aiConsent.js`, an `Alert` + AsyncStorage flag; the web needs its own modal + localStorage).

---

## 7. PURE LIB MODULES TO PORT VERBATIM

`web-app/scripts/sync-from-app.mjs` already copies 49 files into `web-app/src/app-core/` and refuses any import of `react-native|expo|@expo|@react-native|@react-navigation|@supabase`. Status below is against that list. Tests: `scripts/test-lib.mjs` (374 `test(` calls, run with esbuild bundle + node); "T" = the module is imported there.

| Module | Exports | Purpose | T | RN dep | In sync list |
|---|---|---|---|---|---|
| `lib/timeline.js` | `parseYear, parseMonth, memoryDate, ageAt, ageLabel, sortByDate, groupByYear, chapterMismatch, decadeOf, onThisMonth, archiveStats` | free-text `period` → year/month; archive ordering and stats | T | none (imports `data/eras.js`) | yes |
| `lib/spokenDate.js` | `yearFromText` | "summer of '68", "when she was twenty" → year | T | none | yes |
| `lib/memoryDateInput.js` | `MONTHS, yearMax, daysInMonth, parseDateParts, formatDateParts, validateDateParts, decadesForLife, formatDecade, fileUnderPeriod, yearForAge, suggestYearsForEra` | Day/Month/Year boxes → spoken `period` | T | none | yes |
| `lib/weekStrip.js` | `dayKeyOf, countsByDay, STRIP_MAX_BACK, stripDays, dotStrength, dayLabel` | Home week strip | T | none | yes |
| `lib/bookProgress.js` | `BOOK_MIN_MEMORIES, CORE_CHAPTERS, findDecadeGaps, findEmptyChapters, bookProgress, nextPrompts` | how far the book is; excludes `status === "in_progress"` (line 42) | T | none | yes |
| `lib/dailyQuestion.js` | `dayKey, hashUnit, dayNumber, depthFor, deckForDay, OPENERS, openerDeck, firstMemoryQuestion, questionAt` | the day's 3 questions, depth ceiling | T | none | yes |
| `lib/nextQuestion.js` | `pickNextQuestion(prompts, memories, current, random)` | next unanswered question | T | none | yes |
| `lib/sensitivity.js` | `SENSITIVE_LABEL, sensitiveNote` | gentle line for loss/hardship/rupture/private | T | none | yes |
| `lib/legacyBook.js` | `escapeHtml, datelineFor, attributionFor, bookStructure, buildCoverWrapHtml, buildLegacyHtml` | the printable book HTML | T | imports `theme/index.js`, `theme/logoPaths.js`, `lib/qr.js` (uses `qrcode-generator`), `lib/printFonts.js` — all synced | yes |
| `lib/bookDesign.js` | `DESIGN_VERSION, COVER_STYLES, PAPERS, KEEPSAKE_COLORS, PHOTO_TONES, NARRATIONS, PRONOUNS, BOOK_CHAPTER_ORDER, PRINTED_CHAPTER_NAMES, printedChapterName, ARRANGEMENTS, …MAX consts, normaliseDesign, makeListenKey, shortId, longId, listenUrl, hasVoice, effectiveArrangement, pronounFor, bodyHash, printedBody, needsRetelling, effectiveCoverStyle, chapterSequence, includesMemory, moveChapter, toggleMemory, coverPhotoChoices, keepsakePhotos, keepsakeWords` | `stories.book_design` shape | T | none | yes |
| `lib/importers.js` | `SOURCES, fixMojibake, detectFormat, guessTitle, guessEra, parseCsvRows, fingerprint, markDuplicates, parseImport, shapeEntries` | CSV/JSON/WhatsApp/X imports; `parseCsvRows` is also the question compiler's CSV parser | T | none | yes |
| `lib/familyCode.js` | `FAMILY_CODE_LENGTH, normaliseFamilyCode, looksLikeFamilyCode, spacedCode, codeFromLink, joinOutcome, joinPreviewLine, joinLink, CODE_HOW_TO, LINK_HOW_TO, inviteMessage` | codes, `?ref=` links, invite copy | T | none | yes |
| `lib/personRights.js` | `adminsFor, canEditPerson, whoLooksAfter, looksAfterLine, SUGGESTABLE, parseDateValue, cleanSuggestion, suggestionLine, factSuggestions, suggestionPatch` | mirrors `can_edit_person` | T | none | yes |
| `lib/memoryPeople.js` | `namedIn, whoSuggestions, togglePerson, peopleIn, whoLine` | `person_ids` tagging | T | none | yes |
| `lib/usage.js` | `FREE_WEEKLY_PHOTOS=5, FREE_IMPORT_TOTAL=50, FREE_DAILY_PROMPTS=3, hasUnlimitedWriting, dailyPromptsLeft, incrementDailyPrompts, weeklyPhotosLeft, incrementWeeklyPhotos` | free-tier meters | no | **`./asyncStore` (AsyncStorage)** → shim with localStorage | no — write a TS copy with the same constants |
| `lib/firstCall.js` | `FREE_FIRST_CALL_MINUTES=10, freeFirstCallBudget, isUntouchedFirstCall, firstCallLabel` | the free first conversation | T | none | yes |
| `lib/callUsage.js` | `CALL_MINUTES_BY_PLAN {free 0, individual 90, monthly 90, family 200, express 140}, getCallBudget, reportCallSeconds, formatResetDate` | minutes budget from `profiles.call_seconds_used/call_period_start`; lazily resets a stale monthly period | no | `./supabase`, `./demoMode`, `./subscriptions` (RevenueCat) | no — port the budget maths to TS over the web client (keep `currentPeriodStart` anchor-walk logic, lines 46-52) |
| `lib/subscriptions.js` | `COMPLIMENTARY_PLAN, PLAN_LABELS, CANCELABLE_PLANS, purchasesAvailable, getStorePrices, purchasePlan, restorePurchases, openManageSubscriptions, resolveEffectivePlan, getCurrentPlan` | plan resolution + RevenueCat | no | **`react-native-purchases`**, `./supabase` | no — port only `resolveEffectivePlan` (lines 177-187) and `getCurrentPlan` (193-214); the web cannot sell IAP; plans are read-only on web until a Stripe path exists |
| `lib/saveErrors.js` | (2.3) | save error classification | T | none | yes |
| `lib/photoDate.js` | `photoTakenLabel` | EXIF date → words | T | none | yes |
| `lib/links.js` | `WEB_BASE, SITE_URL, TERMS_URL, PRIVACY_URL, SUPPORT_EMAIL, storyUrl, LISTEN_URL, contributeUrl` | every URL; reads `process.env.EXPO_PUBLIC_*` | no | `process.env` (shim with `import.meta.env.VITE_*`) | no — rewrite as TS constants (astoryapp.com) |
| `lib/social.js` | `DIRECTORIES, directoryFor, groupByDirectory, relationshipLabel, storySubtitle, MONTHS, monthIndex, milestonesFor, storedMilestones, milestonesOn, formatLongDate` | People directories and calendar | T | none | yes |
| `lib/conversationContext.js` | `DEPTH_WORDS, depthToday, toldSoFarNote, depthNote, questionGuideNote, lastTold, returningOpening, returningNote, brevityNote, contextNotes, conversationStats` | session notes (6.4) | T | none (imports `dailyQuestion.js`) | **no — add** |
| `lib/teller.js` | `tellerFor, talkHeadline, tellerNote, questionForTeller, conversationForTeller, tellerCredit` | who is talking | T | none | yes |
| `lib/callStyle.js` | `VOICES, LANGUAGES, defaultLanguage, PACES, TONES, TALK, DEPTHS, LENGTHS, NAME_MAX, AVOID_MAX, DEFAULT_CALL_STYLE, cleanText, normaliseCallStyle, namesToHear, sessionRequest, callLengthSeconds, styleSummary` | the session body (6.2) | T | imports `data/languages.js` (synced) and `lib/deviceLocale.js` (pure, uses `navigator`/`Intl`) | **no — add both `lib/callStyle.js` and `lib/deviceLocale.js`** |
| `lib/demoMode.js` | `IS_DEMO, IS_SCREENSHOT, USES_FAKE_DATA, DEMO_PLAN, DEMO_BOOK, DEMO_INCOMING_CALL, DEMO_FRESH, DEMO_TEXT_SCALE, DEMO_GROUP_CALL_ON, DEMO_SAME_PERSON, DEMO_DUPES, DEMO_AS` | `?demo=1` flags read from `window.location` | no | none (browser-native) | no — the web doesn't need the fake-data seam; if a demo is wanted, copy it |
| `lib/draft.js` | `DRAFT_TTL_DAYS=30, draftKey, snapshot, worthKeeping, expired, restorable, whenSaved, restoredNotice, restore` | compose-draft snapshots (storage done by the screen) | T | none | **no — add** |
| `lib/callSummary.js` | `parseSummary, isPleasantry, fallbackTitle, hasSummary, buildDrafts` | `/api/summary` → drafts | T | none | **no — add** (needed for 6.5) |
| `lib/writeHelper.js` | `tidyText, titleFrom, followUps, changedEnough, DRAFT_MAX, companionNote` | local "help me write" + companion note | T | none | yes |
| `lib/sessionCheck.js` | `sessionIsOver` | 1.4 | T | none | yes |
| `lib/photoRefs.js` | `PRIVATE_PHOTO_BUCKETS, privatePhotoRef` | 4 | T | none | yes |
| `lib/saveOutbox.js` | `outboxFrom, applyOutbox, outboxKey` | 2.6 | T | none | **no — add** if the web keeps the whole-tree save; otherwise skip |
| `lib/talkedBefore.js` | `hasTalkedBefore, markTalked, isReturning` | returning detection | T (pure part) | `./asyncStore` | no — port `isReturning` + a localStorage mark |
| `lib/aiConsent.js` | `AI_CONSENT_TITLE, AI_CONSENT_MESSAGE, hasAiConsent, ensureAiConsent` | OpenAI consent gate (App Review 5.1.2) | no | **`react-native` Alert**, `./asyncStore` | no — reimplement as a modal; keep the two strings |
| `data/rows.js`, `data/familyRows.js` | `storyToRow, memoryToRow, planSave`; `PERSON_FACTS, PERSON_FACT_COLUMNS, rowToPerson, personToRow, rowToEdge, planFamilySave, mergeImportedTree, routePeopleWrites` | row shapes (2.1) | T | none | **no — add both** (they are the column whitelists) |
| `data/interview.js` | `getPrompts(personName, { era, tag })`, `getAboutPrompts(personName, { era, tag })`, `ALL_PROMPTS` (547 questions, 11 chapters; fields `id, chapter, topic, question, followUp, hint, tags, sensitive, depth, about`) | the question bank, **generated** from `content/questions.csv` by `scripts/build-questions.mjs` (`MAX_QUESTION_LENGTH = 64`, depth 1–5, sensitive only at depth ≥4, `{name}` only in "From the family") | T | none | yes (+ `content/questions.csv` and the compiler copied as `scripts/app-build-questions.mjs`) |
| `data/eras.js` | `ERAS, FAMILY_CHAPTER, CATCH_ALL_CHAPTER, FAITH_CHAPTER, CORE_CHAPTERS, normaliseEra, eraForAge, chapterDistance` + internal `RENAMED` | 2.7 | T | none | yes |
| `data/languages.js` | `LANGUAGES, languageFromLocale, languageName, suggestedLanguages, searchLanguages` | voice languages | T | none | yes |

Other pure modules already synced and worth keeping: `familyTree.js` (`mergeSelfRows`, `removeFromFamily`), `familyGraph.js`, `familyTreeLayout.js`, `familyStories.js` (`myOwnStory`), `memorySides.js`, `personFacts.js`, `personSources.js`, `gedcom.js`, `whatsapp.js`, `socialArchive.js`, `memoir.js` (`splitMemoir`), `keeperName.js`, `treasured.js`, `lifeSummary.js`, `questionVoice.js`, `memoryCard.js`, `fromFamily.js`, `personMemories.js`, `bookCase.js`, `qr.js`, `printFonts.js`. Pure and **not** synced but useful later: `familyCall.js`, `familyCallListening.js`, `groupCall.js`, `callQuestion.js`, `parentsLoop.js`, `factOffers.js`, `scheduledCall.js`, `trustedPerson.js`, `voiceLevel.js`, `homeStage.js`, `shareCard.js`, `tellAFriend.js`, `analyticsEvents.js`, `familyWeek.js`, `sceneCopy.js`, `scriptLines.js`, `notificationTime.js`, `birthYear.js`, `attempts.js`.

Shims needed once: `asyncStore` → `localStorage` JSON helpers with the same `getJSON/setJSON/removeItem/getString/setString` signatures; `uuid` → `crypto.randomUUID()`; `process.env.EXPO_PUBLIC_*` → `import.meta.env.VITE_*`.

---

## 8. KNOWN BUGS THE WEB MUST NOT INHERIT

From `docs/product/flows.md` (walk of 20 Sep 2026 + "What was fixed"), `HANDOVER.md`, `docs/LEAD-TODO-2026-10-12.md`. Several were fixed in the app since; the web must start from the fixed behaviour.

1. **In-app contribution inserted directly and RLS blocked it; `memory_id` column missing** (`flows.md:215-240`). Root cause then: `contributions.js submitContribution` direct `insert` with no INSERT policy and no `memory_id` column. **Fixed** by `contributions_insert_member` (`contributions.sql:76-81`, forces `status='pending'`), `contributions_insert_household` (`family_shared_tree.sql:70-76`, via `story_in_my_family()` security definer because the old policy read `stories` under the sender's RLS and could never pass), and `alter table contributions add column memory_id` (`contributions.sql:46-47`). Correct web behaviour: signed-in members and tree relatives insert directly as `pending` (never set `approved`); **anonymous** `/contribute/:slug` uses `submit_contribution(slug, …)` (3.3). Always `.select("*")` only when the sender can read it back (members); for household relatives insert without select (`contributions.js:159-197`), or the success turns into an error.
2. **Three different memory counts** (`flows.md:185-190, 777-778`; "not fixed, labelling"). Home strip counted all memories (15), the book counted `status !== "in_progress"` (`bookProgress.js:42` `savedMemories`) (14), the share link counted public/shared only (13). Correct: pick one definition per surface and **label it** ("14 in the book · 1 unfinished"); use `bookProgress()` for anything book-related, `archiveStats()` (`timeline.js`) for the archive, and never show two unlabelled totals on one screen.
3. **"Invite family members" granted nothing** (`flows.md:244-275`). Root cause: `InviteScreen` shared `profiles.referral_code`, which only sets `profiles.referred_by` in `handle_new_user`; `is_story_member()` (`collaborators.sql:37`) reads `stories.owner_id` and `story_managers`, so the invitee saw nothing. **Fixed:** the screen calls `inviteManager()` (`collaborators.js:29-59`, `story_managers` row + `send-invite-email`) and family codes replaced the referral code. Then **re-decided 2026-10-13** (`LEAD-TODO`, "what changed about invitations"): an invitation (email or code) now joins the **family tree**, never the story's keepers (Bao saw Daniel's private memories). Correct web behaviour: Invite → `family_code_for({ pid, sid })` + `send-invite-email`; keepers are added **only** from "Who can edit" via `inviteManager`. Never promise story access from a code.
4. **Co-manager landed on `NewStory`** (`flows.md:281-300`). Root cause: `accept_story_invites()` never set `profiles.onboarding_complete`; `RootNavigator.js:126-128` chose `NewStory` when false. **Fixed** in `collaborators.sql:160-171`. Correct web behaviour: route on `stories.length > 0 || onboardingComplete` after `acceptInvites`/`claimPeople` have run, and call `ensureMyStory()` (`AppContext.js:~640-672`: `createStory({ ownerId, name: firstName, lastName, relationship: "Myself" })`, bind `people.story_id`) for a joiner who has no story of their own.
5. **Delete account cascaded other people's archives** (`flows.md:499-523`). Root cause: `stories.owner_id … on delete cascade` (`schema.sql:270`) and `delete_account.sql` deleting `auth.users`. **Fixed** in `supabase/functions/delete-account/index.ts:124-166` (hand-over to the longest-standing active manager) and `ownership.sql transfer_story_ownership`. Correct web behaviour: before showing the delete button, run `storiesAtRisk` (`ownership.js:41-46`) and name who inherits; call the Edge Function, never a raw delete.
6. **The LiveTalk wall lost the question, named no price, no trial** (`flows.md:131-150, 445-447`). **Fixed** in `src/screens/liveTalk/CallBudgetWall.js`: the question stays on screen, "Write it instead" is the primary action carrying `{ question, storyId, era }` into the composer, then "See plans". Note the current rule (`CallBudgetWall.js:25-27`): **no price on the wall** (store prices vary per country) and **no trial** (there is none). The web's wall must keep the question and the write-instead path.
7. **Walls fire after the work** (`flows.md:449-452`, "not fixed"): daily-question and photo caps checked in the save handler. Correct web behaviour: check `dailyPromptsLeft` before opening a guided question and `weeklyPhotosLeft` when the picker opens, not at Save.
8. **Pricing hardcoded "3 days"** (`flows.md:466-467`). Root cause: `FREE_TRIAL_DAYS` constant duplicated as copy. **Moot:** the trial was removed 2026-09-28 (`usage.js:30-35`); there is no trial, and App Review forbids promising one the purchase sheet doesn't show. The web must not mention a trial anywhere; Free = unlimited writing, 3 guided questions/day, 5 photos/week, 50 imports, one 10-minute first conversation (`firstCall.js`).
9. **`isReturning` reads `memory.source` values the DB forbids.** `talkedBefore.js:37-39` checks `["call","family_call","room","group"].includes(m.source)`, but `memories_source_check` allows only `null | 'memoir'` (`memory_source.sql:14-16`) and `MemorySummaryScreen` never writes `source` on a call memory (it only `track()`s it). So the cross-device "returning" signal never fires; a new device gets the full introduction. Web: do not write `source: "call"` (the insert would fail the constraint); either accept the device mark only, or ask the lead to widen the constraint in a new SQL file first.
10. **Welcome copy addressed the storyteller, not the buyer** (`flows.md:80-85`); **"Begin your story" CTA leads to two more slides** (not fixed, in `design/onboarding`). The web PRD already sets the audience; keep the signed-out copy for the adult child.
11. **The daily call rings a notification instead of a call / web build 404 at `app.astoryapp.com`** (`LEAD-TODO` 13 Oct items 1, 3). Not web bugs, but the web app **is** the fix for item 3: host it at `https://app.astoryapp.com` and set `INVITE_JOIN_URL` and `EXPO_PUBLIC_JOIN_URL` to it so invitation emails and call links land on a page that exists. `?ref=CODE` and `?join=<callId>.<token>` must be handled on the root route.
12. **Whole-tree upsert refused a new account's first story** (`LEAD-TODO` 14 Oct; `store.js:300-313`). Root cause: `upsert` on `stories` is checked against `stories_update_member`, which can't see an uninserted row. Web: INSERT new stories, UPDATE shared ones, upsert only owned-and-existing.
13. **Two clients on one storage key** / global sign-out (`auth.ts:18-27, 220-224`): the site learnt both. Web: one auth client, `signOut({ scope: 'local' })`.

---

## 9. BACKEND STATE RISK

### 9.1 What the deploy doc says may not be live

`docs/deploy-2026-10.md` section 2 lists 20 numbered files "not run against the live database yet" as of its writing; `docs/LEAD-TODO-2026-10-12.md` then records: 12 Oct — files 1–18 live, 19 and 20 not; 14 Oct — files 1–21 plus `legacy_keeper.sql` (22) run; 14 Oct evening — 23 `people_avatar_sync.sql`, 24 `their_side_family.sql`, 25 `tree_admins.sql`, 26 `contributions_via.sql`, and 20 again, "run on the live project from Daniel's computer and checked". `web-app/README.md` records the decision "all of `all.sql` is live". Two files are deliberately **excluded** from `all.sql` (header lines 18-21): `call_cron.sql` (needs Vault secrets) and `private_photos_switch.sql` (run only when the signed-photo build and the `public-story` function are live). Nothing in the repo proves whether `private_photos_switch.sql` has been run, i.e. whether `memory-photos` is currently public or private — the web must behave correctly either way (section 4's signing does: it signs, and falls back to the stored URL).

Columns/tables that would be missing if a file had been skipped (the app's own optional lists are the ground truth): `stories.book_design, call_style, cover_url, nickname, directory`; `memories.person_ids, family_call_id, color, author_person_id, cover_url, contributor, source`; `people.sex, invited_at, avatar_url, external_ref, source, death_year, jobs` + the fact columns; `profiles.share_usage, weekly_digest`; `letters.photo_paths, to_email`; `contributions.person_ids, via, memory_id, contributor_email`; tables `people/relationships/households/household_admins`, `family_codes`, `letters`, `family_questions`, `story_milestones`, `person_suggestions`, `story_join_requests`, `story_merges`; functions in section 3.

### 9.2 Runtime probe strategy (one cheap request per optional feature, at boot, cached)

Do what the app does implicitly, but once and explicitly, in a `capabilities` query cached for the session (and in `localStorage` with a 24 h TTL so a reload doesn't re-probe):

```ts
// each probe: HEAD-style select of the optional columns, limit 0
probe("memories.optional", () => sb.from("memories").select("person_ids, family_call_id, color, author_person_id, cover_url, contributor, source").limit(0));
probe("stories.optional",  () => sb.from("stories").select("book_design, call_style, cover_url, nickname, directory, household_id").limit(0));
probe("profiles.newer",    () => sb.from("profiles").select("share_usage, weekly_digest, last_active_at, trusted_user_id").limit(0));
probe("family",            () => sb.from("people").select("id").limit(0));             // 42P01/PGRST205 → no tree
probe("tree_admins",       () => sb.from("household_admins").select("household_id").limit(0));
probe("family_codes",      () => sb.from("family_codes").select("code").limit(0));
probe("letters",           () => sb.from("letters").select("photo_paths, to_email").limit(0));
probe("milestones",        () => sb.from("story_milestones").select("id").limit(0));
probe("questions",         () => sb.rpc("my_family_questions"));                       // PGRST202/42883 → not ready
probe("reading",           () => sb.rpc("family_story_read", { sid: "00000000-0000-0000-0000-000000000000" }));
probe("letters.rpc",       () => sb.rpc("count_received_letters"));
```

Classify each error with `classifySaveError`: `"behind"` → feature off (hide the UI, drop the columns from writes exactly as the app's optional lists do), anything else → feature on but failing (show the save banner later, don't hide). Keep the `writeDroppingMissing` retry on every write anyway — a probe can be stale across a migration mid-session. Surface the probe result in a hidden `/debug` route so a tester can see "server is a migration behind: people.jobs" instead of guessing (the app relies on console + Sentry for this, `deploy-2026-10.md` 5a).

---

## 10. RECOMMENDED WEB STACK

Matches what `web-app/package.json` already has, with the gaps filled.

- **Vite 8 + React 19.2 + TypeScript 6**, `react-router-dom` 7 (routes: `/`, `/sign-in`, `/sign-up`, `/verify`, `/forgot`, `/home`, `/story/:storyId`, `/story/:storyId/memory/:memId`, `/story/:storyId/write`, `/story/:storyId/talk` (v1.5), `/family`, `/family/person/:personId`, `/book/:storyId`, `/letters`, `/account/*`, `/join?ref=`, `/p/:slug` (optional), `/l` (listen redirect, optional)).
- **`@supabase/supabase-js` ^2.112** — one browser client in `src/data/supabase.ts` with `storageKey: 'astory-web-auth'`, `persistSession`, `autoRefreshToken`, `detectSessionInUrl: false`.
- **State:** TanStack Query (`@tanstack/react-query` v5) for every read (`['stories', userId]`, `['family', userId]`, `['contributions', storyId]`, `['managers', storyId]`, `['codes']`, `['letters']`, `['milestones']`, `['plan', userId]`) and for per-record mutations with optimistic updates + the outbox described in 2.6; a tiny `zustand` store (or React context) only for `session`, `saveError`, `capabilities`. Avoid re-creating `AppContext`'s whole-tree `mutate`; keep `rows.js`/`familyRows.js` as the row-shape layer under the mutations.
- **Styling:** `styled-components` 6 (the marketing site and the existing scaffold use it; `src/app-core/theme/index.js` carries the brand tokens, so a `ThemeProvider` over those tokens keeps the two sites and the app identical). CSS Modules would also be fine; pick one and don't mix.
- **Testing:** `vitest` (jsdom) for `src/lib` and `src/data` with a mocked supabase client; keep `src/app-core/core.test.ts` as the drift smoke test; `@playwright/test` for the four journeys (sign up with code → verify → joined; write a memory with a photo; invite + accept on a second account; approve a contribution). Add a `test:sql`-style contract test later against a local Supabase if the ops repo's PGlite suite can be shared.
- **Question bank:** keep `scripts/sync-from-app.mjs` (copies `content/questions.csv` and the compiler as `scripts/app-build-questions.mjs`; `npm run check` fails on drift). Generate `src/app-core/data/interview.js` from the CSV in CI rather than committing a diverging copy. The compiler imports `../src/lib/importers.js` and `../src/data/eras.js` relative to its own location, so run it with the paths rewritten for `src/app-core/` or keep the synced `interview.js` as the artefact and only use the compiler for `--check`.
- **Sync list additions** (section 7): `data/rows.js`, `data/familyRows.js`, `lib/conversationContext.js`, `lib/callStyle.js`, `lib/deviceLocale.js`, `lib/callSummary.js`, `lib/draft.js`, `lib/saveOutbox.js` (if used), `lib/voiceLevel.js` (v1.5).
- **Media:** `MediaRecorder` for voice notes (webm/opus), `<audio>` with signed URLs, canvas re-encode for photo uploads, `window.print()` + `buildLegacyHtml` for print-at-home (replaces `expo-print`), `qrcode-generator` (already a dependency) for the book's QR codes.
- **Dependencies to add:** `@tanstack/react-query`, `zustand` (optional), `zod` (validate RPC/Edge/AI JSON at the boundary), `date-fns` (only if the UI needs formatting beyond `Intl`), `@sentry/react` (same "account id only, respects share_usage" rule as the app). Already present: `react`, `react-dom`, `react-router-dom`, `@supabase/supabase-js`, `styled-components`, `gsap`, `qrcode-generator`, `vitest`, `jsdom`, `@playwright/test`, `eslint` + `typescript-eslint`.
- **Env:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (same project as the app), `VITE_API_URL` (the Flask server), `VITE_WEB_URL=https://astoryapp.com`, `VITE_LISTEN_URL`. Never ship a service-role key.
- **Deploy:** static build to S3 + CloudFront at `app.astoryapp.com` (web-app README). Then set `INVITE_JOIN_URL` (Supabase secret) and `EXPO_PUBLIC_JOIN_URL` (eas.json) to it.

---

## The 5 highest-risk integration points for cross-device sync

1. **Writing the wrong thing to `stories`/`memories`.** A column outside `storyToRow`/`memoryToRow` is silently dropped or refused; `source` outside `null|'memoir'` fails a check constraint; an UPSERT of a new story or of someone else's story is refused by RLS; writing `owner_id`, `household_id`, `created_by`, `merged_into` corrupts ownership or the merge trail. Use `rows.js` verbatim and the INSERT/UPSERT/UPDATE split in 2.5.
2. **Photo identity and delete-then-insert.** Photos are identified by the public-form URL (never a signed one) and `memory_photos`/`memory_audio` are rewritten wholesale per memory. A web save that sends a stale `photos[]` deletes a relative's new photo; a web save that stores a signed URL breaks the phone's `privatePhotoRef` parsing and the public page. Save photo lists per memory, from the server's current row, only when the user changed that memory.
3. **The `era` namespace.** The phone writes only `ERAS` values after `normaliseEra`; old archives still hold `Career`, `Later years`, `Life`. A web app that writes a chapter name of its own, or skips `RENAMED` on read, splits one archive into two chapter sets on the two devices. Copy `eras.js` and run every read through `normaliseEra`.
4. **Sign-in side effects.** `accept_story_invites` and `claim_people` (plus the join-by-code `join_family` and `ensureMyStory`) are what make a second family member see the right story on the right device. If the web skips them at sign-in and on focus, an invitee who signs in on the web first sees an empty account, then the phone "fixes" it, and the two disagree about `active_story_id`/`onboarding_complete`. Run them in the same order before the first load, and reload after any returns > 0.
5. **Session semantics across the three fronts.** Same project, same accounts, three clients (app/AsyncStorage, site `astory-web-auth`, web app). A `signOut()` with the default `global` scope from any of them signs the family out everywhere; a web app that signs out on a network error (not following `sessionIsOver`) sends an 80-year-old to a password she doesn't remember; a web app that trusts `profiles.plan` without `resolveEffectivePlan` shows a lapsed Express as paid. Use `scope: 'local'`, `sessionIsOver`, and `resolveEffectivePlan` exactly as the app does.
