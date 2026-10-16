/**
 * Light on the materials. The pointer is treated as a soft lamp: the cloth
 * takes a broad, faint sheen where it passes, and the foil-stamped mark on
 * the sheet catches a glint as it crosses. Nothing moves; only the light
 * does, the way a bound book behaves on a table. Off under reduced motion
 * and on touch, where there is no pointer.
 */
import { useEffect, type RefObject } from "react";

export function useLight(ground: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ground.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover)").matches) return;
    let raf = 0;
    let last: PointerEvent | null = null;
    const paint = () => {
      raf = 0;
      if (!last) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--lx", `${last.clientX - r.left}px`);
      el.style.setProperty("--ly", `${last.clientY - r.top}px`);
      const mark = el.querySelector<HTMLElement>(".foil");
      if (mark) {
        const m = mark.getBoundingClientRect();
        // -1 … 1 across the mark, so the glint sweeps through as the pointer passes
        const t = Math.max(-1.4, Math.min(1.4, (last.clientX - (m.left + m.width / 2)) / 240));
        mark.style.setProperty("--glint", `${(t * 50 + 50).toFixed(1)}%`);
      }
      el.classList.add("lit");
    };
    const move = (e: PointerEvent) => {
      last = e;
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const leave = () => el.classList.remove("lit");
    el.addEventListener("pointermove", move, { passive: true });
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ground]);
}
