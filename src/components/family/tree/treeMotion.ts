/**
 * How the family plate arrives, landing by 1.1s: the terracotta rail draws
 * itself down on the house move curve, the faces of each generation come
 * up from 0.95 as their tier comes into view (oldest first, a short
 * stagger across the tier), and the gold threads fade in as the last faces
 * settle. House easings only (lib/ease), transform and opacity only, every
 * tween states both ends and clears what it set, and nothing is hidden
 * ahead of time: a face is only moved by a tween that is already running,
 * so a frame clock that stops can never leave the family half drawn. Under
 * prefers-reduced-motion none of it runs.
 */
import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { MOTION_OK, onEnter } from "../../../lib/arrive";
import { MOVE, OUT } from "../../../lib/ease";

export function useTreeMotion(ref: RefObject<HTMLElement | null>, key: unknown) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const rail = root.querySelector<HTMLElement>(".tp-rail");
      const threads = root.querySelector<SVGElement>(".tp-threads");
      const tiers = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(".tp-tier"));
      if (rail) gsap.fromTo(rail, { scaleY: 0, transformOrigin: "50% 0%" }, { scaleY: 1, duration: 0.9, ease: MOVE, delay: 0.1, clearProps: "transform" });
      if (threads) gsap.fromTo(threads, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: OUT, delay: 0.6, clearProps: "opacity" });
      const stop = onEnter(tiers, (batch) => {
        batch.forEach((tier, i) => {
          const faces = tier.querySelectorAll<HTMLElement>("[data-tp-rise]");
          const amps = tier.querySelectorAll<HTMLElement>(".tp-amp");
          const dot = tier.querySelector<HTMLElement>(".tp-dot");
          const at = 0.08 + Math.min(i, 4) * 0.08;
          if (faces.length) gsap.fromTo(faces, { y: 12, scale: 0.95, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.6, ease: OUT, stagger: Math.min(0.04, 0.15 / faces.length), delay: at, clearProps: "transform,opacity", overwrite: "auto" });
          if (amps.length) gsap.fromTo(amps, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: OUT, delay: at + 0.2, clearProps: "opacity" });
          if (dot) gsap.fromTo(dot, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: OUT, delay: at, clearProps: "transform,opacity" });
        });
      });
      return () => stop();
    });
    return () => mm.revert();
  }, [ref, key]);
}
