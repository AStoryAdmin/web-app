/**
 * Accounts.
 *
 * ONE ACCOUNT, TWO FRONT DOORS. This makes the same calls as the phone app's
 * src/data/auth.js, against the same project: sign-up with first and last
 * name in user_metadata (the handle_new_user() trigger makes the profiles
 * row and the referral code), a six-digit emailed code to confirm, password
 * sign-in, and a six-digit code to reset. The marketing site's src/lib/auth.ts
 * does the same; the three must never drift. When the app changes how it
 * signs people in, this changes too.
 *
 * The emailed codes need Supabase's "Confirm signup" and "Reset password"
 * templates to include {{ .Token }}. The app already requires that.
 */
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "../lib/supabase";
import { resolveEffectivePlan, type Plan } from "../lib/plan";
import { sessionIsOver } from "../app-core/lib/sessionCheck.js";

export const CODE_LEN = 6;
export const MIN_PASSWORD = 6;

export type AuthResult = { ok: true } | { ok: false; error: string };

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

/** Always succeeds for a well-formed address, so nobody can probe which emails exist. */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) return UNCONFIGURED;
  const { error } = await sb.auth.resetPasswordForEmail(normEmail(email));
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

export async function changePassword(newPassword: string): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) return UNCONFIGURED;
  const { error } = await sb.auth.updateUser({ password: newPassword });
  return error ? fail(error.message) : { ok: true };
}

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

function mapUser(session: Session, p: ProfileRow): User {
  const meta = (session.user.user_metadata || {}) as Record<string, string | undefined>;
  const s = (k: string) => (p?.[k] as string | undefined) || "";
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
    plan: resolveEffectivePlan(s("plan"), s("express_expires_at"), s("comp_access_at")),
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
  return mapUser(session, profile);
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
