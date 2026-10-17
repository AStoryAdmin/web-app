/**
 * A physical object leaning toward the pointer: the closed book on the
 * cloth, the keepsake cover on the Book page. Never a card of text.
 */
import { useEffect, type RefObject } from "react";
import gsap from "gsap";

/**
 * Leans the element under `ref` toward the pointer (rotationX/Y, in
 * degrees up to `max`), eased, and back to flat when the pointer leaves or
 * the lean is switched off. The parent needs `perspective`.
 */
export function useTilt(ref: RefObject<HTMLElement | null>, enabled = true, max: { x: number; y: number } = { x: 16, y: 10 }) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover)").matches) return;
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.8, ease: "power3.out" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.8, ease: "power3.out" });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
      const dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
      ry(dx * max.x);
      rx(-dy * max.y);
    };
    const leave = () => {
      rx(0);
      ry(0);
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      gsap.killTweensOf(el, "rotationX,rotationY");
      gsap.set(el, { rotationX: 0, rotationY: 0 });
    };
  }, [ref, enabled, max.x, max.y]);
}
