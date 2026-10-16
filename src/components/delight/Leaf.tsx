/**
 * A pressed leaf, the chapter mark of the archive, that drifts after the
 * pointer across the cloth and settles when you stop, the way a leaf
 * follows a hand brushed over a table. It lags, sways with its speed, and
 * comes to rest flat. It is never in the way: it keeps off the sheet, has
 * no pointer events, and is absent under reduced motion and on touch.
 */
import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";

export default function Leaf({ ground }: { ground: RefObject<HTMLElement | null> }) {
  const leaf = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const el = ground.current;
    const node = leaf.current;
    if (!el || !node) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover)").matches) return;

    const pos = { x: -200, y: -200, vx: 0, vy: 0, seen: false };
    const target = { x: 0, y: 0 };
    let settled = 0;
    const setX = gsap.quickSetter(node, "x", "px");
    const setY = gsap.quickSetter(node, "y", "px");
    const setR = gsap.quickSetter(node, "rotation", "deg");
    const setO = gsap.quickSetter(node, "opacity");

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      // the leaf trails behind and a little below the pointer, like it is being drawn along
      target.x = e.clientX - r.left + 26;
      target.y = e.clientY - r.top + 30;
      if (!pos.seen) {
        pos.seen = true;
        pos.x = target.x;
        pos.y = target.y + 40;
      }
      settled = 0;
    };
    const leave = () => {
      settled = 999;
    };

    const tick = () => {
      if (!pos.seen) return;
      // spring toward the target, heavily damped: paper, not rubber
      const k = 0.045;
      const damp = 0.82;
      pos.vx = (pos.vx + (target.x - pos.x) * k) * damp;
      pos.vy = (pos.vy + (target.y - pos.y) * k) * damp;
      pos.x += pos.vx;
      pos.y += pos.vy;
      const speed = Math.hypot(pos.vx, pos.vy);
      settled = speed < 0.15 ? settled + 1 : 0;
      // the stem points away from the direction of travel; at rest it lies flat at a slight tilt
      const heading = speed > 0.3 ? (Math.atan2(pos.vy, pos.vx) * 180) / Math.PI + 90 : 18;
      setX(pos.x);
      setY(pos.y);
      setR(heading + Math.sin(performance.now() / 420) * Math.min(10, speed * 2));
      setO(settled > 999 ? 0 : Math.min(1, speed * 0.6 + 0.78));
    };

    gsap.ticker.add(tick);
    el.addEventListener("pointermove", move, { passive: true });
    el.addEventListener("pointerleave", leave);
    return () => {
      gsap.ticker.remove(tick);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [ground]);

  return (
    <svg ref={leaf} className="leaf" viewBox="0 0 40 56" width="30" height="42" aria-hidden="true" focusable="false">
      <path className="blade" d="M20 2 C34 14 38 30 30 44 C27 49 23 52 20 54 C17 52 13 49 10 44 C2 30 6 14 20 2 Z" />
      <path className="vein" d="M20 8 L20 50 M20 20 C24 22 27 25 29 30 M20 20 C16 22 13 25 11 30 M20 30 C24 32 27 35 28 39 M20 30 C16 32 13 35 12 39" />
    </svg>
  );
}
