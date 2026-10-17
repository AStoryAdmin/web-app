/**
 * Three prints of one family (public/photos/family-*.webp) on the endpaper, held by black-paper photo corners
 * the way an album keeps them, arranged tidily and slightly overlapping,
 * each with a caption written under it. Once the page is open they drift
 * two to four pixels with the pointer at their own depths, lift and
 * straighten under the hand, and one turns over to show what was written
 * on the back. Still on touch; under reduced motion they are simply there.
 */
import { useEffect, useRef } from "react";
import gsap from "gsap";

type Print = {
  src: string;
  caption: string;
  /** what is written on the back, for the one that turns */
  back?: string;
  tilt: number;
  /** how far it moves with the pointer, 1 = the page */
  depth: number;
  /** position and width on the endpaper, in page widths (cqw) */
  l: number;
  t: number;
  w: number;
};

const PRINTS: Print[] = [
  { src: "/photos/family-02.webp", caption: "Sunday dinner on Elm Street", tilt: -2.5, depth: 0.7, l: 9, t: 6, w: 38 },
  { src: "/photos/family-01.webp", caption: "The one bicycle, 1949", tilt: 2, depth: 1.2, l: 52, t: 22, w: 38 },
  { src: "/photos/family-08.webp", caption: "Rain on the porch, 1958", back: "Nan reading to me on the porch, the July it never stopped raining. Kept by Dan.", tilt: -1.5, depth: 1, l: 14, t: 44, w: 38 },
];

export default function Prints({ active = true }: { active?: boolean }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el || !active) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover)").matches) return;
    const prints = gsap.utils.toArray<HTMLElement>(el.querySelectorAll(".print"));
    const movers = prints.map((p) => ({
      d: Number(p.dataset.depth || 1),
      x: gsap.quickTo(p, "x", { duration: 1.1, ease: "power2.out" }),
      y: gsap.quickTo(p, "y", { duration: 1.1, ease: "power2.out" }),
    }));
    const move = (e: PointerEvent) => {
      const dx = (e.clientX / window.innerWidth - 0.5) * 2;
      const dy = (e.clientY / window.innerHeight - 0.5) * 2;
      for (const m of movers) {
        m.x(gsap.utils.clamp(-4, 4, -dx * 3 * m.d));
        m.y(gsap.utils.clamp(-4, 4, -dy * 3 * m.d));
      }
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      gsap.killTweensOf(prints);
    };
  }, [active]);

  return (
    <div className="prints" ref={box} aria-hidden="true">
      {PRINTS.map((p, i) => (
        <figure
          key={p.src}
          className={`print${p.back ? " flips" : ""}`}
          data-depth={p.depth}
          data-n={i + 1}
          style={{ ["--tilt" as string]: `${p.tilt}deg`, ["--l" as string]: `${p.l}cqw`, ["--t" as string]: `${p.t}cqw`, ["--w" as string]: `${p.w}cqw` }}
        >
          <div className="print-in">
            <div className="print-face">
              <img src={p.src} alt="" decoding="async" />
              <i className="pc tl" />
              <i className="pc tr" />
              <i className="pc bl" />
              <i className="pc br" />
            </div>
            {p.back && (
              <div className="print-back">
                <span>{p.back}</span>
              </div>
            )}
          </div>
          <figcaption className="print-cap">{p.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}
