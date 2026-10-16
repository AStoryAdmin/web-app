/**
 * Who is signed in, for the whole app.
 *
 * `user` is undefined while the stored session is being read (so a page can
 * wait rather than flash "signed out" first), null when nobody is signed in,
 * and the person otherwise. Supabase's own listener drives it: it fires
 * INITIAL_SESSION on subscribe, then SIGNED_IN / SIGNED_OUT / USER_UPDATED,
 * and keeps tabs in step (signing out in one tab signs out the others).
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getSupabase, hasStoredSession, isConfigured } from "../lib/supabase";
import { currentUser, signOut as signOutRequest, type User } from "../data/auth";
import { afterSignIn, type SignInEffects } from "../data/session";
import { AuthContext } from "./authContext";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(() =>
    isConfigured && hasStoredSession() ? undefined : null,
  );
  const [effects, setEffects] = useState<SignInEffects | null>(null);
  // Which account the sign-in effects have run for, so they run once per
  // sign-in and not on every token refresh.
  const effectsFor = useRef<string | null>(null);

  const load = useCallback(async () => {
    const u = await currentUser();
    setUser(u);
    return u;
  }, []);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let live = true;
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (!live) return;
      if (!session) {
        effectsFor.current = null;
        setEffects(null);
        setUser(null);
        return;
      }
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "USER_UPDATED") {
        // Deferred: supabase-js asks that its listener not call back into it.
        setTimeout(() => {
          if (!live) return;
          load().catch((err) => {
            console.warn("auth: load:", (err as Error)?.message || err);
            setUser(null);
          });
          if (effectsFor.current !== session.user.id) {
            effectsFor.current = session.user.id;
            afterSignIn()
              .then((e) => live && setEffects(e))
              .catch(() => {});
          }
        }, 0);
      }
    });
    return () => {
      live = false;
      sub.subscription.unsubscribe();
    };
  }, [load]);

  const signOut = useCallback(async () => {
    await signOutRequest();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, refresh: load, signOut, effects }), [user, load, signOut, effects]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
