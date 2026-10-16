/**
 * The printed book as an object on the cloth. It leans a few degrees
 * toward the pointer, the way a book picked up off a table catches the
 * light, and settles back when the pointer leaves. Still under reduced
 * motion and on touch.
 */
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function BookObject({ width = 300, className = "" }: { width?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover)").matches) return;
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.8, ease: "power3.out" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.8, ease: "power3.out" });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
      const dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
      ry(dx * 16);
      rx(-dy * 10);
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
    };
  }, []);
  return (
    <div className={`object ${className}`} style={{ width, perspective: 1200 }}>
      <div ref={ref} className="object-in" style={{ transformStyle: "preserve-3d" }}>
        <img src="/book/closed-1200.webp" srcSet="/book/closed-640.webp 640w, /book/closed-1200.webp 1200w" sizes={`${width}px`} alt="" width={width} />
      </div>
    </div>
  );
}
