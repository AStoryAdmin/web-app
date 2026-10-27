/**
 * Going on after the password or the code is accepted. Navigating straight
 * away raced AuthProvider, which was still reading the profile, so the
 * signed-in pages saw nobody and sent the person back through /sign-in.
 * arrive(to) holds the place instead and goes there once the person is
 * loaded; if that never comes (the profile read failed), it goes anyway
 * after a few seconds, and RequireAuth decides.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../state/authContext";

const GIVE_UP_MS = 8000;

export function useArrive() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [to, setTo] = useState<string | null>(null);

  useEffect(() => {
    if (to && user) navigate(to, { replace: true });
  }, [to, user, navigate]);

  useEffect(() => {
    if (!to) return;
    const t = setTimeout(() => navigate(to, { replace: true }), GIVE_UP_MS);
    return () => clearTimeout(t);
  }, [to, navigate]);

  /** arriving: a place is held, so a page keeps its button busy and doesn't redirect on its own. */
  return { arrive: setTo, arriving: to !== null };
}
