/**
 * The decade rail on a laptop, and the row of decade chips on a phone: a
 * real timeline, so an organiser can jump to the 1950s without scrolling
 * through the 1990s.
 */
import { useLayoutEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { pageZoom } from "../../lib/zoom";

export type Decade = { decade: number; label: string; count: number; year: number };

/**
 * The cream marker behind the decade in view glides to the next one as
 * the page scrolls, instead of jumping; the buttons never move. Placed
 * without motion the first time and under reduced motion.
 */
function useRailMarker(nav: RefObject<HTMLElement | null>, active: number | null, count: number) {
  const placed = useRef(false);
  useLayoutEffect(() => {
    const el = nav.current;
    const mark = el?.querySelector<HTMLElement>(".arc-decades-mark");
    if (!el || !mark) return;
    const btn = el.querySelector<HTMLElement>('button[aria-current="true"]');
    if (!btn) {
      gsap.set(mark, { opacity: 0 });
      placed.current = false;
      return;
    }
    const r = el.getBoundingClientRect();
    const b = btn.getBoundingClientRect();
    const z = pageZoom();
    const to = { y: (b.top - r.top) / z, height: b.height / z, opacity: 1 };
    const still = !placed.current || matchMedia("(prefers-reduced-motion: reduce)").matches;
    placed.current = true;
    if (still) gsap.set(mark, to);
    else gsap.to(mark, { ...to, duration: 0.5, ease: "power3.inOut", overwrite: true });
  }, [nav, active, count]);
}

export function DecadeRail({ decades, active, onPick }: { decades: Decade[]; active: number | null; onPick: (d: Decade) => void }) {
  const nav = useRef<HTMLElement>(null);
  useRailMarker(nav, active, decades.length);
  // one decade is nowhere to jump to: the rail would only take the width
  if (decades.length < 2) return null;
  return (
    <nav className="arc-decades" aria-label="By decade" ref={nav}>
      <span className="arc-decades-mark" aria-hidden="true" />
      <h3>By decade</h3>
      {decades.map((d) => (
        <button key={d.decade} type="button" aria-current={active === d.decade ? "true" : undefined} onClick={() => onPick(d)}>
          {d.label} <span>{d.count}</span>
        </button>
      ))}
    </nav>
  );
}

export function DecadeRow({ decades, active, onPick }: { decades: Decade[]; active: number | null; onPick: (d: Decade) => void }) {
  if (decades.length < 2) return null;
  return (
    <div className="chiprow scroll arc-decaderow" role="group" aria-label="Decades">
      {decades.map((d) => (
        <button key={d.decade} type="button" className="chip big" aria-pressed={active === d.decade} onClick={() => onPick(d)} style={{ minHeight: 40 }}>
          {d.label}
        </button>
      ))}
    </div>
  );
}
