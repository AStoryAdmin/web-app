/**
 * Read the archive again when the person comes back to the tab, so a memory kept on the phone a minute ago is
 * there without a reload. The account's own return (AccountProvider) waits a minute away; the archive is where
 * someone looks for what they just told, so it asks sooner: on focus or on the tab showing again, at most once in
 * `gap` ms, and never while a read is still under way.
 */
import { useEffect, useRef } from "react";

export const REFRESH_GAP_MS = 15 * 1000;

export function useRefreshOnReturn(refresh: () => Promise<unknown>, { enabled = true, gap = REFRESH_GAP_MS } = {}) {
  const last = useRef(0);
  const busy = useRef(false);
  const latest = useRef(refresh);
  useEffect(() => {
    latest.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return;
    // the page has just read the account (it opened with it): the first return counts from now
    last.current = Date.now();
    const onReturn = () => {
      if (document.visibilityState === "hidden" || busy.current) return;
      const now = Date.now();
      if (now - last.current < gap) return;
      last.current = now;
      busy.current = true;
      latest
        .current()
        .catch(() => {})
        .finally(() => {
          busy.current = false;
        });
    };
    window.addEventListener("focus", onReturn);
    document.addEventListener("visibilitychange", onReturn);
    return () => {
      window.removeEventListener("focus", onReturn);
      document.removeEventListener("visibilitychange", onReturn);
    };
  }, [enabled, gap]);
}
