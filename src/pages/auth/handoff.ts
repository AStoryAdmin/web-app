/**
 * What Sign in and Create account hand to Verify: the address the code went
 * to, and which kind of code it is. It travels in the router's state, never
 * in the URL (an address in the URL lands in history, logs and analytics),
 * with a copy in this tab's sessionStorage so a reload of /verify still
 * knows where the code went. Verify clears it once the code is accepted.
 */

export type CodeHandoff = {
  email: string;
  /** "signup": the confirm-your-email code after a password sign-up; "email": a code to sign in with, no password. */
  mode: "signup" | "email";
  /** A code that also makes the account (Create account's "Email me a code instead"), so a resend sends the same. */
  create?: { name: string; code?: string };
};

const KEY = "astory-verify";

function parse(v: unknown): CodeHandoff | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.email !== "string" || !o.email.trim()) return null;
  const mode = o.mode === "email" ? "email" : "signup";
  const c = o.create as Record<string, unknown> | undefined;
  const create = c && typeof c === "object" && typeof c.name === "string" ? { name: c.name, code: typeof c.code === "string" ? c.code : undefined } : undefined;
  return { email: o.email, mode, ...(create ? { create } : {}) };
}

/** Keeps a copy for a reload and returns the handoff, to pass as the router state. */
export function handOff(h: CodeHandoff): CodeHandoff {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(h));
  } catch {
    /* private windows may refuse storage: the router state still carries it */
  }
  return h;
}

/** The router's state first; the stored copy after a reload. */
export function readHandoff(state: unknown): CodeHandoff | null {
  const fromState = parse(state);
  if (fromState) return fromState;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? parse(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function clearHandoff() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* nothing stored */
  }
}

/** An address handed back to Sign in, Create account or Forgot password (router state, never the URL). */
export function carriedEmail(state: unknown): string {
  const e = (state as { email?: unknown } | null)?.email;
  return typeof e === "string" ? e : "";
}
