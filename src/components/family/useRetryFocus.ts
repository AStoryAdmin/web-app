/**
 * Try again without losing the keyboard’s place: pressing it swaps the
 * failure line for a loading line, so the button leaves the page. `arm()` in
 * the handler, and `line` (a ref callback) on the loading line (tabIndex -1): the line takes
 * focus as it mounts, then lets go of the wish.
 */
import { useCallback, useRef } from "react";

export function useRetryFocus() {
  const want = useRef(false);
  const line = useCallback((el: HTMLElement | null) => {
    if (!el || !want.current) return;
    want.current = false;
    el.focus();
  }, []);
  const arm = useCallback(() => {
    want.current = true;
  }, []);
  return { line, arm };
}
