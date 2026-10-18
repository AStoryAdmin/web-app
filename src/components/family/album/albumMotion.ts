/**
 * How the album arrives: the terracotta rail draws itself down from the
 * storyteller's dot, and each card rises once as it comes into view, the
 * dot of its row inking at the same moment. Transform and opacity only,
 * nothing sideways, every tween stating both ends (fromTo, props cleared
 * after) so a frame clock that stops can never leave a card half faded.
 * Under prefers-reduced-motion none of it runs and the album is simply there.
 */
import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { MOTION_OK, onEnter, riseIn } from "../../../lib/arrive";

export function useAlbumMotion(ref: RefObject<HTMLElement | null>, key: unknown) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const line = root.querySelector<HTMLElement>(".fr-line");
      const items = gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-fa-rise]"));
      const dots = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(".fr-dot"));
      if (line) gsap.fromTo(line, { scaleY: 0, transformOrigin: "50% 0%" }, { scaleY: 1, duration: 1.1, ease: "power3.inOut", delay: 0.3, clearProps: "transform" });
      const stops: (() => void)[] = [];
      // Nothing is hidden ahead of time: a card is only ever moved by a tween that states both ends, so a tab in
      // the background (where the observer and the frame clock wait) still shows the whole family.
      if (items.length) stops.push(onEnter(items, (batch) => riseIn(batch)));
      if (dots.length) stops.push(onEnter(dots, (batch) => gsap.fromTo(batch, { scale: 0.5, opacity: 0, transformOrigin: "50% 50%" }, { scale: 1, opacity: 1, duration: 0.55, ease: "back.out(2.2)", stagger: 0.06, delay: 0.2, clearProps: "transform,opacity", overwrite: "auto" })));
      return () => stops.forEach((stop) => stop());
    });
    return () => mm.revert();
  }, [ref, key]);
}
