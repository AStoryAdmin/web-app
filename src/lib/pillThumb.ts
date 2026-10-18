/**
 * The cream pill behind the current place in the top bar. When the person
 * goes somewhere else, the pill glides to the new place instead of
 * appearing there: the bar is the one thing held still across a page
 * change, so the glide is what tells you where you went. The links
 * themselves never move. The last place is remembered here, outside React,
 * because the shell is remounted for every page.
 */
import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { MOVE } from "./ease";
import { pageZoom } from "./zoom";

let last: { x: number; w: number } | null = null;

export function usePillThumb(nav: RefObject<HTMLElement | null>, key: string) {
  useLayoutEffect(() => {
    const el = nav.current;
    if (!el) return;
    const thumb = el.querySelector<HTMLElement>(".pill-thumb");
    if (!thumb) return;
    const active = el.querySelector<HTMLElement>('a[aria-current="page"]');
    if (!active) {
      last = null;
      gsap.set(thumb, { opacity: 0 });
      return;
    }
    const measure = () => {
      const nr = el.getBoundingClientRect();
      const ar = active.getBoundingClientRect();
      const z = pageZoom();
      return { x: (ar.left - nr.left) / z - el.clientLeft, w: ar.width / z };
    };
    const to = measure();
    const from = last;
    last = to;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches || !from || to.w === 0 || (from.x === to.x && from.w === to.w);
    let tween: gsap.core.Tween | null = null;
    if (still) gsap.set(thumb, { x: to.x, width: to.w, opacity: 1 });
    else tween = gsap.fromTo(thumb, { x: from.x, width: from.w, opacity: 1 }, { x: to.x, width: to.w, duration: 0.5, ease: MOVE });

    // the bar's type can settle after first paint; keep the pill under its word
    const settle = () => {
      if (tween?.isActive()) return;
      const m = measure();
      if (m.w === 0) return;
      last = m;
      gsap.set(thumb, { x: m.x, width: m.w, opacity: 1 });
    };
    window.addEventListener("resize", settle);
    document.fonts?.ready.then(settle).catch(() => {});
    return () => {
      window.removeEventListener("resize", settle);
      tween?.kill();
    };
  }, [nav, key]);
}
