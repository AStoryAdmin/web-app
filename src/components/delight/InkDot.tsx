/**
 * A faint dot of ink that trails the pointer over the paper and dries away
 * when the hand stops: the sheet's answer to the lamp on the cloth. One
 * element, moved by transform only, no pointer events, absent under
 * reduced motion and on touch. Experimental; see docs/DELIGHT.md.
 */
import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";

export default function InkDot({ ground }: { ground: RefObject<HTMLElement | null> }) {
  const dot = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ground.current;
    const node = dot.current;
    if (!el || !node) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover)").matches) return;
    const x = gsap.quickTo(node, "x", { duration: 0.45, ease: "power3.out" });
    const y = gsap.quickTo(node, "y", { duration: 0.45, ease: "power3.out" });
    let dry = 0;
    let seen = false;
    const fade = () => gsap.to(node, { opacity: 0, duration: 0.9, ease: "power1.in", overwrite: true });
    const move = (e: PointerEvent) => {
      if (!seen) {
        seen = true;
        gsap.set(node, { x: e.clientX, y: e.clientY });
      }
      x(e.clientX);
      y(e.clientY);
      // over something you can use the dot keeps off; the paper only
      const over = (e.target as HTMLElement).closest("a, button, input, textarea, select, label, [role=button]");
      gsap.to(node, { opacity: over ? 0 : 1, duration: 0.25, overwrite: true });
      window.clearTimeout(dry);
      dry = window.setTimeout(fade, 700);
    };
    el.addEventListener("pointermove", move, { passive: true });
    el.addEventListener("pointerleave", fade);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", fade);
      window.clearTimeout(dry);
    };
  }, [ground]);
  return <span ref={dot} className="inkdot" aria-hidden="true" />;
}
