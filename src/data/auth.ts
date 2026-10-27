/**
 * Accounts.
 *
 * ONE ACCOUNT, TWO FRONT DOORS. This makes the same calls as the phone app's
 * src/data/auth.js, against the same project: sign-up with first and last
 * name in user_metadata (the handle_new_user() trigger makes the profiles
 * row and the referral code), a six-digit emailed code to confirm, password
 * sign-in, a six-digit code to sign in with no password (the app's default),
 * and a six-digit code to reset. The marketing site's src/lib/auth.ts
 * does the same; the three must never drift. When the app changes how it
 * signs people in, this changes too.
 *
 * The emailed codes need Supabase's "Confirm signup" and "Reset password"
 * templates to include {{ .Token }}. The app already requires that.
 */
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "../lib/supabase";
import { parseGiftYear, planSource, planWithGiftYear, resolveEffectivePlan, type GiftYear, type Plan, type PlanSource } from "../lib/plan";
import { sessionIsOver } from "../app-core/lib/sessionCheck.js";

/** The project's Email OTP length: the app's VerifyCodeStage CODE_LEN. */
export const CODE_LEN = 6;
/** The app's PASSWORD_MIN (lib/copy.js). */
export const MIN_PASSWORD = 8;

export type AuthResult = { ok: true } | { ok: false; error: string };

/** What supabase-js hands back as an error, as far as this file reads it. */
type SbError = { message?: string; code?: string; status?: number } | null | undefined;

const UNCONFIGURED: AuthResult = {
  ok: false,
  error: "A Story isn’t connected to its server here. Write to us and we’ll sort it out.",
};

const normEmail = (email: string) => email.toLowerCase().trim();

/**
 * The app's own sentences, so a person sees the same words on either side.
 * Network failures first: supabase-js hands them back as an ordinary error,
 * and without this the first thing anybody saw was "Failed to fetch".
 */
export function friendlyAuthError(message: string | undefined): string {
  const msg = (message || "").toLowerCase();
  if (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("load failed") ||
    msg.includes("fetch failed") ||
    msg.includes("timeout") ||
    msg.includes("timed out")
  ) {
    return "We couldn’t reach A Story. Check your connection and try again - nothing was lost.";
  }
  if (msg.includes("invalid login credentials")) return "That email and password don’t match.";
  if (msg.includes("email not confirmed")) return "Please confirm your email before signing in.";
  if (msg.includes("user already registered")) return "An account with this email already exists.";
  if (msg.includes("rate limit") || msg.includes("security purposes"))
    return "That was a lot of tries in a row. Wait a minute, then try again.";
  if (msg.includes("expired or is invalid"))
    return "That code isn’t right, or it has run out. Check it, or send another.";
  if (msg.includes("expired")) return "That code has expired. Please ask for a new one.";
  if (msg.includes("otp") || msg.includes("token")) return "That code isn’t right. Please check it and try again.";
  if (msg.includes("different from the old")) return "That’s the password you have now. Choose a new one.";
  if (msg.includes("reauthentication")) return "We need to check it’s you. Type the code we emailed.";
  if (msg.includes("password")) return `The password needs at least ${MIN_PASSWORD} characters.`;
  return message || "Something went wrong. Please try again.";
}

const fail = (message?: string): AuthResult => ({ ok: false, error: friendlyAuthError(message) });

/** The form asks for one "Name"; the account keeps first and last. */
export function splitName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] || "", lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] };
}

export async function createAccount(input: {
  name: string;
  email: string;
  password: string;
  /** A referral code (profiles.referral_code) or a family code; both ride in metadata. */
  code?: string;
}): Promise<AuthResult & { needsCode?: boolean }> {
  const sb = getSupabase();
  if (!sb) return UNCONFIGURED;
  const { firstName, lastName } = splitName(input.name);
  const { data, error } = await sb.auth.signUp({
    email: normEmail(input.email),
    password: input.password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        // Resolved to a referrer server-side by handle_new_user(); a blank or
        // unknown code is ignored there, not an error.
        referral_code: (input.code || "").trim().toUpperCase(),
        signed_up_on: "web",
      },
    },
  });
  if (error) return fail(error.message);
  if (!data.user) return fail("Could not create the account. Please try again.");
  // With email confirmation on, Supabase answers a sign-up for an address
  // that already has a confirmed account with a user that has no identities,
  // rather than an error. Say plainly that the account exists.
  if (data.user.identities && data.user.identities.length === 0) return fail("User already registered");
  return { ok: true, needsCode: !data.session };
}

export async function verifySignupCode(email: string, code: string): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) return UNCONFIGURED;
  const { data, error } = await sb.auth.verifyOtp({ email: normEmail(email), token: code.trim(), type: "signup" });
  if (error) return fail(error.message);
  if (!data.user) return fail("That code didn’t work. Please try again.");
  return { ok: true };
}

export async function resendSignupCode(email: string): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) return UNCONFIGURED;
  const { error } = await sb.auth.resend({ type: "signup", email: normEmail(email) });
  return error ? fail(error.message) : { ok: true };
}

export async function signIn(email: string, password: string): Promise<AuthResult & { unconfirmed?: boolean }> {
  const sb = getSupabase();
  if (!sb) return UNCONFIGURED;
  const { error } = await sb.auth.signInWithPassword({ email: normEmail(email), password });
  if (error) {
    // Made an account, never typed the code: send a fresh one and let the
    // page ask for it, rather than a dead end that says "confirm first".
    const unconfirmed = (error.message || "").toLowerCase().includes("email not confirmed");
    return { ok: false, error: friendlyAuthError(error.message), unconfirmed };
  }
  return { ok: true };
}

/* ── Signing in with an emailed code ────────────────────────────────────
   The app's sendEmailCode / verifyEmailCode (phone src/data/auth.js). With
   createUser the code also makes the account when the email is new, with
   the name and any family code in user_metadata exactly as signUp() sends
   them; without it an unknown email is refused, rather than quietly made
   into a new, empty account by somebody who only mistyped.

   The "Magic Link" email template must carry {{ .Token }} for an existing
   account's code, and "Confirm signup" for a new one (a Supabase setting). */

export type CodeFor = { createUser: false } | { createUser: true; name: string; code?: string };

export async function sendEmailCode(email: string, how: CodeFor = { createUser: false }): Promise<AuthResult & { noAccount?: boolean }> {
  const sb = getSupabase();
  if (!sb) return UNCONFIGURED;
  let data: Record<string, string> | undefined;
  if (how.createUser) {
    const { firstName, lastName } = splitName(how.name);
    data = {
      first_name: firstName,
      last_name: lastName,
      referral_code: (how.code || "").trim().toUpperCase(),
      signed_up_on: "web",
    };
  }
  const { error } = await sb.auth.signInWithOtp({
    email: normEmail(email),
    options: { shouldCreateUser: how.createUser, ...(data ? { data } : {}) },
  });
  return error ? codeSendFailed(error) : { ok: true };
}

function codeSendFailed(error: NonNullable<SbError>): AuthResult & { noAccount?: boolean } {
  const msg = (error.message || "").toLowerCase();
  if (msg.includes("signups not allowed") || msg.includes("user not found")) {
    return { ok: false, error: "We don’t have an account with that email. Check it, or create one.", noAccount: true };
  }
  if (msg.includes("security purposes") || msg.includes("rate limit") || error.status === 429) {
    return { ok: false, error: "A code was sent a moment ago. Give it a minute to arrive, then ask again." };
  }
  return fail(error.message);
}

/** type "email" covers an existing account's code and a new account's first one; either way it signs them in. */
export async function verifyEmailCode(email: string, code: string): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) return UNCONFIGURED;
  const { data, error } = await sb.auth.verifyOtp({ email: normEmail(email), token: code.trim(), type: "email" });
  if (error) return fail(error.message);
  if (!data.session?.user) return fail("That code didn’t work. Please try again.");
  return { ok: true };
}

/** Always succeeds for a well-formed address, so nobody can probe which emails exist. */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) return UNCONFIGURED;
  // The email's code is what the page asks for; should the template carry the link too, it opens /reset-password here
  // (the address must be in the project's Redirect URLs, or Supabase falls back to the Site URL).
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
  const { error } = await sb.auth.resetPasswordForEmail(normEmail(email), redirectTo ? { redirectTo } : undefined);
  return error ? fail(error.message) : { ok: true };
}

/**
 * The code and the new password together. They stay signed in afterwards:
 * they have just proved they own the inbox, and asking for the password they
 * chose ten seconds ago buys nothing.
 */
export async function resetPassword(email: string, code: string, newPassword: string): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) return UNCONFIGURED;
  const verified = await sb.auth.verifyOtp({ email: normEmail(email), token: code.trim(), type: "recovery" });
  if (verified.error) return fail(verified.error.message);
  const updated = await sb.auth.updateUser({ password: newPassword });
  return updated.error ? fail(updated.error.message) : { ok: true };
}

/**
 * A new password for the signed-in person. With "Secure password change" on
 * in the project, Supabase refuses a change from a session that isn't fresh
 * until it carries the code reauthenticate() emails (the "nonce"), as the
 * app's ChangePasswordScreen asks for. So: try without it; when Supabase
 * says it needs one, email the code and answer needsCode, and the page
 * calls again with the code the person typed.
 */
export async function changePassword(newPassword: string, nonce?: string): Promise<AuthResult & { needsCode?: boolean }> {
  const sb = getSupabase();
  if (!sb) return UNCONFIGURED;
  const code = (nonce || "").trim();
  const { error } = await sb.auth.updateUser(code ? { password: newPassword, nonce: code } : { password: newPassword });
  if (!error) return { ok: true };
  if (!code && needsReauthentication(error)) {
    const sent = await sendPasswordChangeCode();
    if (!sent.ok) return sent;
    return { ok: false, needsCode: true, error: "To keep the account safe, we emailed you a code. Type it to save the new password." };
  }
  if (code && (error.code === "reauthentication_not_valid" || /nonce|reauthentication/i.test(error.message || ""))) {
    return { ok: false, needsCode: true, error: "That code isn’t right, or it has run out. Check it, or send another." };
  }
  return fail(error.message);
}

/** Supabase's answer when a password change needs the emailed code first. */
export function needsReauthentication(error: SbError): boolean {
  if (!error) return false;
  if (error.code === "reauthentication_needed" || error.code === "reauth_nonce_missing") return true;
  return /requires reauthentication|reauthentication (is )?needed/i.test(error.message || "");
}

/** Emails the signed-in person the code a password change asks for (Supabase's reauthenticate). */
export async function sendPasswordChangeCode(): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) return UNCONFIGURED;
  const { error } = await sb.auth.reauthenticate();
  return error ? fail(error.message) : { ok: true };
}

/* ── A reset link ───────────────────────────────────────────────────────
   The reset email carries a six-digit code, but a link (an older email
   template, or one sent from the app) lands on /reset-password with the
   recovery in the address: a PKCE ?code=, or #access_token=...&type=recovery.
   supabase-js turns it into a session and fires PASSWORD_RECOVERY;
   AuthProvider notes that here so the page can ask for the new password
   however late it mounts. The address is read once, as this module loads,
   before supabase-js clears it. */

export type RecoveryLink = "recovery" | "pending" | "expired" | null;

/** What a reset link's address says: a recovery, one still being exchanged, or one that has run out. */
export function readRecoveryLink(hash: string, search: string): RecoveryLink {
  const h = new URLSearchParams(hash.replace(/^#/, ""));
  const q = new URLSearchParams(search.replace(/^\?/, ""));
  const get = (k: string) => h.get(k) ?? q.get(k);
  if (get("error") || get("error_code") || get("error_description")) return "expired";
  if (get("type") === "recovery" && h.get("access_token")) return "recovery";
  if (q.get("code") || h.get("access_token")) return "pending";
  return null;
}

const LINK_AT_LOAD: RecoveryLink =
  typeof window !== "undefined" && window.location.pathname === "/reset-password"
    ? readRecoveryLink(window.location.hash, window.location.search)
    : null;

// an implicit-grant link's tokens, kept as the page loads: the client runs the PKCE flow, so supabase-js refuses this
// address ("Not a valid PKCE flow url.") and adoptRecoveryHash sets the session from them instead
const HASH_AT_LOAD =
  LINK_AT_LOAD === "recovery" ? new URLSearchParams(window.location.hash.replace(/^#/, "")) : null;

/** A #access_token=...&type=recovery reset link (an older email template, or one sent from the app) made into a
 * session, so it asks for the new password like a ?code= link does. Once, on load; a link the server refuses is
 * left to read as run out. */
let hashAdopted = false;
export async function adoptRecoveryHash(): Promise<void> {
  if (hashAdopted || !HASH_AT_LOAD) return;
  hashAdopted = true;
  const access_token = HASH_AT_LOAD.get("access_token");
  const refresh_token = HASH_AT_LOAD.get("refresh_token");
  const sb = getSupabase();
  if (!sb || !access_token || !refresh_token) return noteRecovery(false);
  const { error } = await sb.auth.setSession({ access_token, refresh_token });
  // the tokens leave the address either way
  if (window.location.hash) window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
  noteRecovery(!error);
}

let recovering = LINK_AT_LOAD === "recovery";
const recoveryListeners = new Set<() => void>();

/** On PASSWORD_RECOVERY; with false once the new password is saved, or on signing out. */
export function noteRecovery(on = true) {
  if (recovering === on) return;
  recovering = on;
  for (const l of recoveryListeners) l();
}

export const recoveryStore = {
  subscribe(l: () => void) {
    recoveryListeners.add(l);
    return () => void recoveryListeners.delete(l);
  },
  /** True while a reset link's session waits for its new password. */
  get: () => recovering,
  /** What the address said when the page first loaded. */
  linkAtLoad: () => LINK_AT_LOAD,
};

/** Starts an email change; Supabase emails a code to the new address. */
export async function requestEmailChange(newEmail: string): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) return UNCONFIGURED;
  const { error } = await sb.auth.updateUser({ email: normEmail(newEmail) });
  return error ? fail(error.message) : { ok: true };
}

export async function confirmEmailChange(newEmail: string, code: string): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) return UNCONFIGURED;
  const { error } = await sb.auth.verifyOtp({ email: normEmail(newEmail), token: code.trim(), type: "email_change" });
  return error ? fail(error.message) : { ok: true };
}

/**
 * This browser only. supabase-js defaults to scope "global", which revokes
 * every session the account has: signing out here would sign the family out
 * of the app on their phones too.
 */
export async function signOut(): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut({ scope: "local" });
}

/* ── The signed-in person ──────────────────────────────────────────────── */

/** The Privacy and General settings, as the app keeps them on profiles. */
export type Settings = {
  showPhoneNumber: boolean;
  showBirthday: boolean;
  discoverByPhone: boolean;
  discoverByQr: boolean;
  friendSuggestions: boolean;
  phoneContacts: boolean;
  biometricLogin: boolean;
  language: string;
  shareUsage: boolean;
  weeklyDigest: boolean;
};

export const SETTINGS_DEFAULTS: Settings = {
  showPhoneNumber: true,
  showBirthday: true,
  discoverByPhone: true,
  discoverByQr: true,
  friendSuggestions: false,
  phoneContacts: false,
  biometricLogin: true,
  language: "United States",
  shareUsage: true,
  weeklyDigest: true,
};

/** The column each setting writes to (the app's SETTINGS_COLUMNS). */
export const SETTINGS_COLUMNS: Record<keyof Settings, string> = {
  showPhoneNumber: "show_phone_number",
  showBirthday: "show_birthday",
  discoverByPhone: "discover_by_phone",
  discoverByQr: "discover_by_qr",
  friendSuggestions: "friend_suggestions",
  phoneContacts: "phone_contacts",
  biometricLogin: "biometric_login",
  language: "language",
  shareUsage: "share_usage",
  weeklyDigest: "weekly_digest",
};

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  referralCode: string | null;
  phone: string;
  gender: string;
  dateOfBirth: string;
  settings: Settings;
  plan: Plan;
  /** Where the plan came from: the App Store, a gift year, a promo or access code, or nothing. */
  planSource: PlanSource;
  /** The gift year or promo month giving this plan, while it runs; null when the plan is their own. */
  giftYear: GiftYear | null;
  subscriptionCancelAt: string | null;
  /** Seconds of the free first conversation used (deploy §3a). */
  callSecondsUsed: number;
  createdAt: string | null;
};

type ProfileRow = Record<string, unknown> | null;

const bool = (v: unknown, fallback: boolean) => (v == null ? fallback : Boolean(v));

function settingsFromProfile(p: ProfileRow): Settings {
  if (!p) return { ...SETTINGS_DEFAULTS };
  return {
    showPhoneNumber: bool(p.show_phone_number, SETTINGS_DEFAULTS.showPhoneNumber),
    showBirthday: bool(p.show_birthday, SETTINGS_DEFAULTS.showBirthday),
    discoverByPhone: bool(p.discover_by_phone, SETTINGS_DEFAULTS.discoverByPhone),
    discoverByQr: bool(p.discover_by_qr, SETTINGS_DEFAULTS.discoverByQr),
    friendSuggestions: bool(p.friend_suggestions, SETTINGS_DEFAULTS.friendSuggestions),
    phoneContacts: bool(p.phone_contacts, SETTINGS_DEFAULTS.phoneContacts),
    biometricLogin: bool(p.biometric_login, SETTINGS_DEFAULTS.biometricLogin),
    language: (p.language as string) || SETTINGS_DEFAULTS.language,
    shareUsage: bool(p.share_usage, SETTINGS_DEFAULTS.shareUsage),
    weeklyDigest: bool(p.weekly_digest, SETTINGS_DEFAULTS.weeklyDigest),
  };
}

// The app's PROFILE_COLUMNS, then the columns added by later SQL files. A
// database a migration behind answers 42703/PGRST204 for an unknown column;
// then the read is retried without them rather than failing sign-in.
const PROFILE_COLUMNS =
  "first_name, last_name, avatar_url, referral_code, phone, gender, date_of_birth, " +
  "show_phone_number, show_birthday, discover_by_phone, discover_by_qr, " +
  "friend_suggestions, phone_contacts, biometric_login, language, " +
  "plan, express_expires_at, subscription_cancel_at, comp_access_at";
const NEWER_COLUMNS = ", share_usage, weekly_digest, call_seconds_used";

const MISSING_COLUMN = new Set(["42703", "PGRST204"]);

async function fetchProfile(userId: string): Promise<ProfileRow> {
  const sb = getSupabase();
  if (!sb) return null;
  const read = (cols: string) => sb.from("profiles").select(cols).eq("id", userId).maybeSingle();
  let { data, error } = await read(PROFILE_COLUMNS + NEWER_COLUMNS);
  if (error && MISSING_COLUMN.has(error.code)) ({ data, error } = await read(PROFILE_COLUMNS));
  if (error) throw error;
  return data as ProfileRow;
}

/**
 * The gift year or promo month running on this account, or null (none, or a
 * server without gift_2026_10_23.sql). Never throws: it gates words on a
 * page, not access, and the server honours the year either way.
 */
async function fetchGiftYear(): Promise<GiftYear | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb.rpc("my_gift_year");
    return error ? null : parseGiftYear(data);
  } catch {
    return null;
  }
}

const paidPlan = (p: ProfileRow): Plan =>
  resolveEffectivePlan(p?.plan as string | undefined, p?.express_expires_at as string | undefined, p?.comp_access_at as string | undefined);

function mapUser(session: Session, p: ProfileRow, giftYear: GiftYear | null = null): User {
  const meta = (session.user.user_metadata || {}) as Record<string, string | undefined>;
  const s = (k: string) => (p?.[k] as string | undefined) || "";
  // A redeemed gift year counts only when nothing is paid for, as on the
  // phone (getCurrentPlan); without it a recipient showed as Free here.
  const paid = paidPlan(p);
  const plan = planWithGiftYear(paid, giftYear);
  const applied = plan === paid ? null : giftYear;
  return {
    id: session.user.id,
    email: (session.user.email || "").toLowerCase(),
    firstName: s("first_name") || meta.first_name || "",
    lastName: s("last_name") || meta.last_name || "",
    avatarUrl: s("avatar_url") || null,
    referralCode: s("referral_code") || null,
    phone: s("phone"),
    gender: s("gender"),
    dateOfBirth: s("date_of_birth"),
    settings: settingsFromProfile(p),
    plan,
    planSource: planSource(plan, applied),
    giftYear: applied,
    subscriptionCancelAt: s("subscription_cancel_at") || null,
    callSecondsUsed: Number(p?.call_seconds_used) || 0,
    createdAt: session.user.created_at || null,
  };
}

/**
 * The signed-in person, or null. getSession() reads the stored token;
 * getUser() asks the server, which is how an account deleted on another
 * device gets signed out here. A network failure must not sign anyone out
 * (sessionCheck.js, copied from the app).
 */
export async function currentUser(): Promise<User | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.user) return null;
  const { data: userData, error: userErr } = await sb.auth.getUser();
  if (userErr && !sessionIsOver(userErr, null)) {
    console.warn("currentUser: couldn't reach Auth, keeping the session:", userErr.message);
  } else if (sessionIsOver(userErr, userData?.user)) {
    try {
      await sb.auth.signOut({ scope: "local" });
    } catch {
      /* local storage may already be stale */
    }
    return null;
  }
  let profile: ProfileRow = null;
  try {
    profile = await fetchProfile(session.user.id);
  } catch (err) {
    console.warn("currentUser: profile:", (err as Error)?.message || err);
  }
  const giftYear = paidPlan(profile) === "free" ? await fetchGiftYear() : null;
  return mapUser(session, profile, giftYear);
}

/** Re-reads the profile row for a signed-in session (after an edit or a purchase). */
export async function refreshUser(): Promise<User | null> {
  return currentUser();
}

export async function updateProfile(userId: string, patch: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
}): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) return UNCONFIGURED;
  const row: Record<string, string> = {};
  if (patch.firstName != null) row.first_name = patch.firstName.trim();
  if (patch.lastName != null) row.last_name = patch.lastName.trim();
  if (patch.phone != null) row.phone = patch.phone.trim();
  if (patch.gender != null) row.gender = patch.gender;
  if (patch.dateOfBirth != null) row.date_of_birth = patch.dateOfBirth;
  const { error } = await sb.from("profiles").update(row).eq("id", userId);
  return error ? fail(error.message) : { ok: true };
}

export async function updateSettings(userId: string, patch: Partial<Settings>): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) return UNCONFIGURED;
  const row: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) row[SETTINGS_COLUMNS[k as keyof Settings]] = v;
  const { error } = await sb.from("profiles").update(row).eq("id", userId);
  return error ? fail(error.message) : { ok: true };
}

/**
 * Only same-site paths survive as a place to go after signing in; anything
 * else (a full URL, "//evil.example") falls back to Home.
 */
export const safeNext = (next: string | null): string =>
  next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
