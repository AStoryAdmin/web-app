/**
 * A pressed leaf, the chapter mark of the archive, that drifts after the
 * pointer across the cloth and settles when you stop, the way a leaf
 * follows a hand brushed over a table. It lags, sways with its speed, and
 * comes to rest flat. It is never in the way: it has no pointer events, it
 * fades when it comes to rest on words (on Home it settled over the "Last
 * kept…" line and hid it), and it is absent under reduced motion and on
 * touch. With `page`, it follows the pointer over the whole page, cloth and
 * cream alike, from a fixed layer.
 */
import { useEffect, useRef, type RefObject } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { pageZoom } from "../../lib/zoom";

export default function Leaf({ ground, page = false }: { ground?: RefObject<HTMLElement | null>; page?: boolean }) {
  const leaf = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const el: HTMLElement | Window | null = page ? window : (ground?.current ?? null);
    const node = leaf.current;
    if (!el || !node) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover)").matches) return;

    const pos = { x: -200, y: -200, vx: 0, vy: 0, seen: false };
    const target = { x: 0, y: 0 };
    let settled = 0;
    // at rest over words it fades away, and comes back the moment it moves
    let onWords = false;
    let shown = 0;
    // words, not the empty end of a line: the text the caret would land in, and whether its letters are within reach
    const wordsUnder = (x: number, y: number) => {
      const r = el instanceof Window ? { left: 0, top: 0 } : el.getBoundingClientRect();
      const z = pageZoom();
      const cx = x * z + r.left;
      const cy = y * z + r.top;
      const caret = document.caretRangeFromPoint?.(cx, cy);
      const node = caret?.startContainer;
      if (!caret || !node || node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) return false;
      const reach = 14 * z;
      const range = document.createRange();
      range.selectNodeContents(node);
      return [...range.getClientRects()].some((b) => cx >= b.left - reach && cx <= b.right + reach && cy >= b.top - reach && cy <= b.bottom + reach);
    };
    const setX = gsap.quickSetter(node, "x", "px");
    const setY = gsap.quickSetter(node, "y", "px");
    const setR = gsap.quickSetter(node, "rotation", "deg");
    const setO = gsap.quickSetter(node, "opacity");

    const move = (e: PointerEvent) => {
      const r = el instanceof Window ? { left: 0, top: 0 } : el.getBoundingClientRect();
      const z = pageZoom();
      // the leaf trails behind and a little below the pointer, like it is being drawn along
      target.x = (e.clientX - r.left) / z + 26;
      target.y = (e.clientY - r.top) / z + 30;
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
      if (settled === 0) onWords = false;
      // looked at once it has settled, then now and then (the page can scroll words under it)
      else if (settled % 30 === 12 && settled < 999) onWords = wordsUnder(pos.x, pos.y);
      // the stem points away from the direction of travel; at rest it lies flat at a slight tilt
      const heading = speed > 0.3 ? (Math.atan2(pos.vy, pos.vx) * 180) / Math.PI + 90 : 18;
      setX(pos.x);
      setY(pos.y);
      setR(heading + Math.sin(performance.now() / 420) * Math.min(10, speed * 2));
      const want = settled > 999 || onWords ? 0 : Math.min(1, speed * 0.6 + 0.78);
      shown += (want - shown) * (want < shown ? 0.12 : 0.35);
      setO(shown);
    };

    gsap.ticker.add(tick);
    const off = page ? document.documentElement : el;
    el.addEventListener("pointermove", move as EventListener, { passive: true });
    off.addEventListener("pointerleave", leave);
    return () => {
      gsap.ticker.remove(tick);
      el.removeEventListener("pointermove", move as EventListener);
      off.removeEventListener("pointerleave", leave);
    };
  }, [ground, page]);

  const svg = (
    <svg ref={leaf} className={page ? "leaf page-leaf" : "leaf"} viewBox="0 0 40 56" width="30" height="42" aria-hidden="true" focusable="false">
      <path className="blade" d="M20 2 C34 14 38 30 30 44 C27 49 23 52 20 54 C17 52 13 49 10 44 C2 30 6 14 20 2 Z" />
      <path className="vein" d="M20 8 L20 50 M20 20 C24 22 27 25 29 30 M20 20 C16 22 13 25 11 30 M20 30 C24 32 27 35 28 39 M20 30 C16 32 13 35 12 39" />
    </svg>
  );
  return page ? createPortal(svg, document.body) : svg;
}
