/**
 * How the person page's rail arrives: the terracotta line draws itself
 * down from the top (height from nothing), and each card rises into
 * place as it comes into view, its dot filling at the same moment.
 * Transform and opacity only; nothing sideways; under
 * prefers-reduced-motion none of it runs and the rail is simply there.
 */
import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { MOTION_OK, onEnter, riseIn } from "../../lib/arrive";

export function useRail(ref: RefObject<HTMLElement | null>, key: unknown) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const line = root.querySelector<HTMLElement>(".pp-line");
      const items = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(".pp-item"));
      if (line) gsap.fromTo(line, { scaleY: 0, transformOrigin: "50% 0%" }, { scaleY: 1, duration: 1.1, ease: "power3.inOut", delay: 0.35, clearProps: "transform" });
      if (!items.length) return;
      const dots = items.map((it) => it.querySelector<HTMLElement>(".pp-dot")).filter((d): d is HTMLElement => !!d);
      gsap.set(items, { y: 16, opacity: 0 });
      gsap.set(dots, { scale: 0, transformOrigin: "50% 50%" });
      const stop = onEnter(items, (batch) => {
        riseIn(batch);
        const inked = batch.map((it) => it.querySelector<HTMLElement>(".pp-dot")).filter((d): d is HTMLElement => !!d);
        gsap.to(inked, { scale: 1, duration: 0.55, ease: "back.out(2.2)", stagger: 0.06, delay: 0.15, clearProps: "transform", overwrite: "auto" });
      });
      return () => stop();
    });
    return () => mm.revert();
  }, [ref, key]);
}
