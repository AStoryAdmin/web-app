/**
 * How the person page's rail arrives: the terracotta line draws itself
 * down from the top, and each card rises into place as it comes into
 * view, its dot inking at the same moment (from 0.6, never from nothing).
 * Transform and opacity only; nothing sideways; under
 * prefers-reduced-motion none of it runs and the rail is simply there.
 */
import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { MOTION_OK, onEnter, riseIn } from "../../lib/arrive";
import { MOVE, OUT } from "../../lib/ease";

export function useRail(ref: RefObject<HTMLElement | null>, key: unknown) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const line = root.querySelector<HTMLElement>(".pp-line");
      const items = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(".pp-item"));
      if (line) gsap.fromTo(line, { scaleY: 0, transformOrigin: "50% 0%" }, { scaleY: 1, duration: 0.9, ease: MOVE, delay: 0.15, clearProps: "transform" });
      if (!items.length) return;
      // Nothing is hidden ahead of time: a card only moves inside a tween that states both ends, once it is in view.
      const stop = onEnter(items, (batch) => {
        riseIn(batch);
        const inked = batch.map((it) => it.querySelector<HTMLElement>(".pp-dot")).filter((d): d is HTMLElement => !!d);
        if (inked.length) gsap.fromTo(inked, { scale: 0.6, opacity: 0, transformOrigin: "50% 50%" }, { scale: 1, opacity: 1, duration: 0.4, ease: OUT, stagger: 0.05, delay: 0.1, clearProps: "transform,opacity", overwrite: "auto" });
      });
      return () => stop();
    });
    return () => mm.revert();
  }, [ref, key]);
}
