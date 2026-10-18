/**
 * The six digit boxes (CodeInput, in components/ui) take no ARIA props of their own, so this marks them from their
 * wrapper: while the code is wrong each box is aria-invalid and points at the plate's line ("plate-say").
 */
import { useEffect, type RefObject } from "react";

export function useCodeAria(wrap: RefObject<HTMLElement | null>, invalid: boolean) {
  useEffect(() => {
    const boxes = wrap.current?.querySelectorAll("input") ?? [];
    for (const box of boxes) {
      if (invalid) {
        box.setAttribute("aria-invalid", "true");
        box.setAttribute("aria-describedby", "plate-say");
      } else {
        box.removeAttribute("aria-invalid");
        box.removeAttribute("aria-describedby");
      }
    }
  }, [wrap, invalid]);
}
