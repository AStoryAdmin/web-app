/**
 * The code's input (PlateCode) is marked from its wrapper: while the code is wrong it is aria-invalid and points at
 * the plate's line ("plate-say").
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
