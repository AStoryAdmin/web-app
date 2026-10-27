/**
 * Who is signed in, for the whole app.
 *
 * `user` is undefined while the stored session is being read (so a page can
 * wait rather than flash "signed out" first), null when nobody is signed in,
 * and the person otherwise. Supabase's own listener drives it: it fires
 * INITIAL_SESSION on subscribe, then SIGNED_IN / SIGNED_OUT / USER_UPDATED,
 * and keeps tabs in step (signing out in one tab signs out the others).
 *
 * Signing in, the person is undefined again until their profile is read,
 * not null: a page that navigates the moment the password or the code is
 * accepted then waits on RequireAuth’s blank page instead of bouncing
 * through /sign-in. A reset link’s PASSWORD_RECOVERY is noted for
 * /reset-password, which asks for the new password.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getSupabase, hasStoredSession, isConfigured } from "../lib/supabase";
import { adoptRecoveryHash, currentUser, noteRecovery, signOut as signOutRequest, type User } from "../data/auth";
import { clearPhotoCache } from "../lib/photoUrls";
import { clearCodesCache } from "../components/family/useMyCodes";
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
        // signed out here or in another tab: no signed photograph survives into the next person's session
        clearPhotoCache();
        clearCodesCache();
        effectsFor.current = null;
        noteRecovery(false);
        setEffects(null);
        setUser(null);
        return;
      }
      if (event === "PASSWORD_RECOVERY") noteRecovery();
      // a fresh sign-in reads as "still loading" until the profile is in; someone already here stays
      if (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY") setUser((u) => u ?? undefined);
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "USER_UPDATED" || event === "PASSWORD_RECOVERY") {
        // Deferred: supabase-js asks that its listener not call back into it.
        setTimeout(() => {
          if (!live) return;
          load().catch((err) => {
            console.warn("auth: load:", (err as Error)?.message || err);
            setUser(null);
          });
          if (effectsFor.current !== session.user.id) {
            effectsFor.current = session.user.id;
            afterSignIn(session.user.id, session.user.email)
              .then((e) => live && setEffects(e))
              .catch(() => {});
          }
        }, 0);
      }
    });
    void adoptRecoveryHash();
    return () => {
      live = false;
      sub.subscription.unsubscribe();
    };
  }, [load]);

  const signOut = useCallback(async () => {
    await signOutRequest();
    // signed photo addresses belong to this person: none survives into the next sign-in in this tab
    clearPhotoCache();
    clearCodesCache();
    noteRecovery(false);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, refresh: load, signOut, effects }), [user, load, signOut, effects]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
