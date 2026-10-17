/**
 * The printed book as an object on the cloth. It leans a few degrees
 * toward the pointer, the way a book picked up off a table catches the
 * light, and settles back when the pointer leaves. Still under reduced
 * motion and on touch. The lean itself is `lib/tilt`, which the Book page's
 * closed cover borrows.
 */
import { useRef } from "react";
import { useTilt } from "../lib/tilt";

export default function BookObject({ width = 300, className = "" }: { width?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useTilt(ref);
  return (
    <div className={`object ${className}`} style={{ width, perspective: 1200 }}>
      <div ref={ref} className="object-in" style={{ transformStyle: "preserve-3d" }}>
        <img src="/book/closed-1200.webp" srcSet="/book/closed-640.webp 640w, /book/closed-1200.webp 1200w" sizes={`${width}px`} alt="" width={width} />
      </div>
    </div>
  );
}
