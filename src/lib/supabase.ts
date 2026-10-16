/**
 * The one Supabase client. The same project as the phone app, so the same
 * account signs into both and sees the same stories; row-level security is
 * what keeps each family to its own.
 *
 * The session lives in localStorage under its own key, refreshes itself,
 * and is read back on every page load, which is what "stay signed in" means
 * in a browser. `detectSessionInUrl` stays on for the day Google and Apple
 * sign-in are switched on in the project (PKCE lands the code in the URL);
 * the emailed six-digit codes never touch the URL.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && key);

export const AUTH_STORAGE_KEY = "astory-app-auth";

let client: SupabaseClient | null = null;

/** Null when the environment has no keys; every caller must cope. */
export function getSupabase(): SupabaseClient | null {
  if (!isConfigured) return null;
  client ??= createClient(url!, key!, {
    auth: {
      storageKey: AUTH_STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
  return client;
}

/** Throws when unconfigured: for data code that cannot run without a server. */
export function supabase(): SupabaseClient {
  const c = getSupabase();
  if (!c) throw new Error("A Story is not connected to its server (missing VITE_SUPABASE_URL).");
  return c;
}

/**
 * Whether a session is stored, without loading supabase-js. An expired
 * token reads true, which costs one redirect to sign-in and nothing else.
 */
export function hasStoredSession(): boolean {
  try {
    return Boolean(window.localStorage.getItem(AUTH_STORAGE_KEY));
  } catch {
    return false;
  }
}
