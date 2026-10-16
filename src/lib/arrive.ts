/**
 * How a page arrives: the words on the cloth rise line by line, the rest of
 * the hero follows, and the paper sheet slides up over the cloth and
 * settles. One authored moment, played once per page, never on scroll.
 * Under prefers-reduced-motion nothing here runs and the page is simply
 * there.
 *
 * Every tween states both ends (fromTo), so a run that is reverted half
 * way (React's development double-mount) never leaves a page faded: the
 * matchMedia context reverts what it created, and the next run starts from
 * the same stated values.
 */
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

const MOTION_OK = "(prefers-reduced-motion: no-preference)";

export function arrive(root: HTMLElement): () => void {
  const mm = gsap.matchMedia();
  mm.add(MOTION_OK, () => {
    const hero = root.querySelector<HTMLElement>(".hero");
    const sheet = root.querySelector<HTMLElement>(".sheet-page");
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    if (hero) {
      const title = hero.querySelector<HTMLElement>("h1");
      const rest = gsap.utils.toArray<HTMLElement>(hero.querySelectorAll("[data-rise]"));
      if (title) {
        const split = SplitText.create(title, { type: "lines", mask: "lines", linesClass: "line" });
        tl.fromTo(split.lines, { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.09 }, 0.05);
      }
      if (rest.length) tl.fromTo(rest, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.07 }, 0.25);
      const object = hero.querySelector<HTMLElement>(".object");
      if (object) tl.fromTo(object, { y: 40, opacity: 0, rotate: 2 }, { y: 0, opacity: 1, rotate: 0, duration: 1.1, ease: "power4.out" }, 0.2);
    }
    if (sheet) {
      tl.fromTo(sheet, { y: 56, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power4.out", clearProps: "transform" }, 0.3);
      const first = gsap.utils.toArray<HTMLElement>(sheet.querySelectorAll("[data-rise]")).slice(0, 8);
      if (first.length) tl.fromTo(first, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, clearProps: "transform" }, 0.55);
    }
  });
  return () => mm.revert();
}
