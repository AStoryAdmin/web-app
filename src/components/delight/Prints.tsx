/**
 * Prints of one family on the endpaper, held by black-paper photo corners
 * the way an album keeps them, each with a line written under it. They are
 * placed by quarters of the page (left and top in percent of the page,
 * widths in the page's smaller side), so the album fills a square page and
 * a tall one alike and no print ever covers another's caption. Once the
 * page is open they drift a few pixels with the pointer at their own
 * depths, lift and straighten under the hand, and the one with a note
 * turns over to show what was written on the back. Still on touch; under
 * reduced motion they are simply there.
 *
 * The photographs are the master library's (public/photos/NN-1200.webp),
 * large enough for a 4K window; the captions are sample lines. They decode
 * with the page (decoding="sync") so a page change never shows a grey box.
 */
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { OUT } from "../../lib/ease";

export type Print = {
  src: string;
  caption: string;
  /** what is written on the back, for the one that turns */
  back?: string;
  /** the print's shape, as a CSS aspect ratio */
  ratio: string;
  /** the photograph's focus inside its frame */
  focus?: string;
  tilt: number;
  /** how far it moves with the pointer, 1 = the page */
  depth: number;
  /** left and top in percent of the page; width in percent of the page's smaller side */
  l: number;
  t: number;
  w: number;
};

/** The album on the sign-in's endpaper: dinner, the cake, the porch. */
const ALBUM: Print[] = [
  { src: "/photos/27-1200.webp", caption: "Sunday dinner, everyone talking at once", ratio: "3 / 2", focus: "50% 45%", tilt: -2.2, depth: 0.7, l: 6, t: 6.5, w: 51 },
  { src: "/photos/02-1200.webp", caption: "The cake, June 1957", ratio: "4 / 5", focus: "50% 30%", tilt: 2.2, depth: 1.2, l: 62, t: 9, w: 31 },
  {
    src: "/photos/18-1200.webp",
    caption: "Rain on the porch, 1961",
    back: "Grandpa watching the storm come in, the July it never stopped raining. Kept by Dan.",
    ratio: "3 / 2",
    tilt: -1.4,
    depth: 1,
    l: 8,
    t: 53,
    w: 47,
  },
];

export default function Prints({ active = true, prints = ALBUM }: { active?: boolean; prints?: Print[] }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el || !active) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    // the six movers live in one context, so leaving (or StrictMode's second run) reverts them whole, finished or not
    let move: ((e: PointerEvent) => void) | null = null;
    const ctx = gsap.context(() => {
      const els = gsap.utils.toArray<HTMLElement>(el.querySelectorAll(".print"));
      // The drift is a few pixels in the page's own coordinates: the page is scaled (html zoom, the book's fit),
      // so the movement scales with the prints and stays the same share of them at any window size.
      const movers = els.map((p) => ({
        d: Number(p.dataset.depth || 1),
        x: gsap.quickTo(p, "x", { duration: 1.1, ease: OUT }),
        y: gsap.quickTo(p, "y", { duration: 1.1, ease: OUT }),
      }));
      move = (e: PointerEvent) => {
        // clientX and innerWidth are both in screen pixels, so the ratio is the same at any zoom
        const dx = (e.clientX / window.innerWidth - 0.5) * 2;
        const dy = (e.clientY / window.innerHeight - 0.5) * 2;
        for (const m of movers) {
          m.x(gsap.utils.clamp(-4, 4, -dx * 3 * m.d));
          m.y(gsap.utils.clamp(-4, 4, -dy * 3 * m.d));
        }
      };
    }, el);
    const onMove = (e: PointerEvent) => move?.(e);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      ctx.revert();
    };
  }, [active]);

  return (
    <div className="prints" ref={box} aria-hidden="true">
      {prints.map((p, i) => (
        <figure
          key={p.src}
          className={`print${p.back ? " flips" : ""}`}
          data-depth={p.depth}
          data-n={i + 1}
          style={{ ["--tilt" as string]: `${p.tilt}deg`, ["--l" as string]: `${p.l}%`, ["--t" as string]: `${p.t}%`, ["--w" as string]: `${p.w}cqmin`, ["--ratio" as string]: p.ratio }}
        >
          <div className="print-in">
            <div className="print-face">
              <img src={p.src} alt="" decoding="sync" style={p.focus ? { objectPosition: p.focus } : undefined} />
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
