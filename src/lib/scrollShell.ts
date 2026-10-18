/**
 * How the signed-in pages answer the scroll (the GSAP ScrollTrigger skill,
 * the design-engineering skill's easing rules):
 *
 * - The top bar follows you. It is fixed; once the page has moved it
 *   condenses into a solid strip of the cloth (CSS `.top.stuck`, 200 ms on
 *   the strong ease-out). Its links never animate: they are used all day.
 * - The cream sheet slides up over the brown. The hero's words drift up
 *   more slowly than the page and fade, scrubbed to the scroll so they move
 *   exactly with the hand, and the sheet's rounded top flattens as it
 *   reaches the bar, so the brown only shows when you are back at the top.
 *
 * Under prefers-reduced-motion the bar still condenses (a state, not a
 * motion) and nothing else moves. Pointer and layout values are not
 * converted here, so the page zoom (lib/zoom) needs no correction.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MOTION_OK } from "./arrive";

gsap.registerPlugin(ScrollTrigger);

export function scrollShell(root: HTMLElement): () => void {
  const bar = root.querySelector<HTMLElement>(".top");
  const cloth = root.querySelector<HTMLElement>(".cloth");
  const heroIn = root.querySelector<HTMLElement>(".hero-in");
  const sheet = root.querySelector<HTMLElement>(".sheet-page");

  const mark = () => bar?.classList.toggle("stuck", window.scrollY > 8);
  mark();
  window.addEventListener("scroll", mark, { passive: true });

  const mm = gsap.matchMedia();
  mm.add(MOTION_OK, () => {
    if (cloth && heroIn) {
      gsap.fromTo(
        heroIn,
        { y: 0, opacity: 1 },
        {
          y: () => cloth.offsetHeight * 0.32,
          opacity: 0.1,
          ease: "none",
          scrollTrigger: { trigger: cloth, start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true },
        },
      );
    }
    if (sheet) {
      gsap.fromTo(
        sheet,
        { borderTopLeftRadius: 22, borderTopRightRadius: 22 },
        {
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          ease: "none",
          // only in the last stretch, as the paper meets the bar: while the brown shows, the corners stay round
          scrollTrigger: { trigger: sheet, start: "top 150px", end: "top 64px", scrub: true },
        },
      );
    }
  });

  // images and fonts change the page height after the first measure
  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener("load", refresh);
  document.fonts?.ready.then(refresh).catch(() => {});

  return () => {
    window.removeEventListener("scroll", mark);
    window.removeEventListener("load", refresh);
    bar?.classList.remove("stuck");
    mm.revert();
  };
}
