/**
 * Family photographs on the title page: white-bordered prints lying around
 * the words and the form at their own tilts, the way they lie on a kitchen
 * table when the box comes down from the wardrobe. The frame drops them
 * onto the page as it opens; once the page is open they drift a few
 * pixels with the pointer at different depths, straighten a little under
 * the hand, and one or two turn over to show what was written on the back.
 * Still on touch; under reduced motion they are simply there.
 */
import { useEffect, useRef } from "react";
import gsap from "gsap";

type Print = {
  src: string;
  caption: string;
  /** width / height */
  ratio: number;
  tilt: number;
  /** how far it moves with the pointer, 1 = the table */
  depth: number;
  /** turns over under the pointer */
  flips?: boolean;
  /** width as a multiple of the base print size */
  k: number;
  /** position on the page, desktop */
  at: { l?: string; r?: string; t?: string; b?: string };
};

const PRINTS: Print[] = [
  { src: "/photos/18-1200.webp", caption: "Rain on the porch, 1958", ratio: 3 / 2, tilt: 4, depth: 0.7, flips: true, k: 1.1, at: { l: "31%", b: "27%" } },
  { src: "/photos/02-1200.webp", caption: "Cutting the cake, 1961", ratio: 4 / 5, tilt: -6, depth: 1.3, k: 0.92, at: { l: "2.5%", b: "5%" } },
  { src: "/photos/31-1200.webp", caption: "Edith, 1962", ratio: 1, tilt: 5, depth: 1, k: 0.78, at: { l: "18%", b: "6%" } },
  { src: "/photos/12-1200.webp", caption: "The phone in the hall", ratio: 4 / 5, tilt: -4, depth: 0.85, k: 0.8, at: { l: "42%", t: "6%" } },
  { src: "/photos/27-1200.webp", caption: "Sunday dinner on Elm Street", ratio: 3 / 2, tilt: -5, depth: 1.15, flips: true, k: 0.95, at: { r: "1.5%", t: "3%" } },
  { src: "/photos/30-1200.webp", caption: "The lake, August 1974", ratio: 3 / 2, tilt: 6, depth: 1.4, k: 1, at: { r: "2%", b: "3%" } },
  { src: "/photos/33-1200.webp", caption: "The kitchen on Elm Street", ratio: 4 / 3, tilt: 3, depth: 0.6, k: 0.9, at: { l: "44%", b: "4%" } },
];

export default function Prints({ active = true }: { active?: boolean }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el || !active) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover)").matches) return;
    const prints = gsap.utils.toArray<HTMLElement>(el.querySelectorAll(".print"));
    // they drift a few pixels with the pointer, each at its own depth
    const movers = prints.map((p) => ({
      d: Number(p.dataset.depth || 1),
      x: gsap.quickTo(p, "x", { duration: 1.1, ease: "power2.out" }),
      y: gsap.quickTo(p, "y", { duration: 1.1, ease: "power2.out" }),
    }));
    const move = (e: PointerEvent) => {
      const dx = (e.clientX / window.innerWidth - 0.5) * 2;
      const dy = (e.clientY / window.innerHeight - 0.5) * 2;
      for (const m of movers) {
        m.x(gsap.utils.clamp(-16, 16, -dx * 9 * m.d));
        m.y(gsap.utils.clamp(-12, 12, -dy * 6 * m.d));
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
          className={`print${p.flips ? " flips" : ""}`}
          data-depth={p.depth}
          data-n={i + 1}
          style={{
            ["--tilt" as string]: `${p.tilt}deg`,
            ["--k" as string]: p.k,
            ["--ratio" as string]: p.ratio,
            ["--l" as string]: p.at.l ?? "auto",
            ["--r" as string]: p.at.r ?? "auto",
            ["--t" as string]: p.at.t ?? "auto",
            ["--b" as string]: p.at.b ?? "auto",
          }}
        >
          <div className="print-in">
            <div className="print-face">
              <img src={p.src} alt="" decoding="async" />
            </div>
            <figcaption className="print-back">
              <span>{p.caption}</span>
            </figcaption>
          </div>
        </figure>
      ))}
    </div>
  );
}
