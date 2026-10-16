import { createContext, useContext } from "react";
import type { User } from "../data/auth";
import type { SignInEffects } from "../data/session";

export type AuthState = {
  /** undefined while the stored session is being read; null when signed out. */
  user: User | null | undefined;
  /** Re-reads the profile row (after an edit, a purchase, a plan change). */
  refresh: () => Promise<User | null>;
  signOut: () => Promise<void>;
  /** What the last sign-in linked: invites accepted, places in a tree claimed. */
  effects: SignInEffects | null;
};

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth needs an AuthProvider above it");
  return ctx;
}
