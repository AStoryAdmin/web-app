/**
 * Try again without losing the keyboard's place, through the whole round
 * trip. Pressing it swaps the failure line for a loading line, so the button
 * leaves the page: `arm()` in the handler and `line` (a ref callback) on the
 * loading line (tabIndex -1), which takes focus as it mounts. When the load
 * settles the loading line goes too: if the keyboard is then on nothing, it
 * goes to the new Try again (it failed again) or to `home`, a container that
 * stays through the swap (tabIndex -1).
 */
import { useCallback, useEffect, useRef, type RefObject } from "react";

const lost = () => {
  const a = document.activeElement;
  return !a || a === document.body || !a.isConnected;
};

/** `again` finds this load's own Try again inside `home` (not another part's, which may share the container). */
export function useRetryFocus(home?: RefObject<HTMLElement | null>, again = ":scope > [role=alert] button") {
  const want = useRef(false);
  const armed = useRef(false);
  const homeBox = useRef(home);
  const againAt = useRef(again);
  useEffect(() => {
    homeBox.current = home;
    againAt.current = again;
  }, [home, again]);
  const cur = useRef<HTMLElement | null>(null);
  const line = useCallback((el: HTMLElement | null) => {
    if (el) {
      cur.current = el;
      if (!want.current) return;
      want.current = false;
      el.focus();
      return;
    }
    if (!armed.current) return;
    // the loading line has left: once the new content is in, hand the keyboard on if it has nowhere to be (a
    // line that is only re-attached, as StrictMode does, is still on the page and keeps the wish)
    window.setTimeout(() => {
      if (cur.current?.isConnected) return;
      armed.current = false;
      if (!lost()) return;
      const box = homeBox.current?.current;
      const retry = box?.querySelector<HTMLElement>(againAt.current);
      (retry || box)?.focus();
    }, 0);
  }, []);
  const arm = useCallback(() => {
    want.current = true;
    armed.current = true;
  }, []);
  return { line, arm };
}
