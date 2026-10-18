/**
 * An in-place swap keeps the keyboard's place: the control that opens a form,
 * a question or a card `arm`s the key of what should take focus next, and
 * that element's ref (`at(key)`) takes it as it mounts. `pick` chooses a
 * child (a form's first field).
 */
import { useCallback, useRef } from "react";

export function useFocusNext() {
  const want = useRef<string | null>(null);
  const arm = useCallback((key: string) => {
    want.current = key;
  }, []);
  const at = useCallback(
    (key: string, pick?: (el: HTMLElement) => HTMLElement | null) => (el: HTMLElement | null) => {
      if (!el || want.current !== key) return;
      want.current = null;
      (pick?.(el) || el).focus();
    },
    [],
  );
  return { arm, at };
}
