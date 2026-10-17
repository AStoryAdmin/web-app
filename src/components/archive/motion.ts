/**
 * Arrivals for the Archive and the memory page, on GSAP. Everything rises
 * or fades; nothing slides sideways (docs/PRODUCT-DECISIONS.md §12), and
 * under prefers-reduced-motion nothing here runs at all - the CSS already
 * collapses the rest to a crossfade.
 */
import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { belowFold, onEnter, riseIn } from "../../lib/arrive";

const MOTION_OK = "(prefers-reduced-motion: no-preference)";

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Elements marked `data-arrive` under `ref` rise 10px into place, staggered
 * 60ms, whenever `key` changes (a new filter, a new page).
 */
export function useArrive(ref: RefObject<HTMLElement | null>, key: unknown) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const items = gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-arrive]"));
      if (!items.length) return;
      gsap.from(items, { opacity: 0, y: 10, duration: 0.5, ease: "power3.out", stagger: 0.06, clearProps: "transform,opacity" });
    });
    return () => mm.revert();
  }, [ref, key]);
}

/** The large photograph settles into focus whenever a new one is shown. */
export function useHeroArrival(ref: RefObject<HTMLElement | null>, key: unknown) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !key) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.from(el, { opacity: 0, scale: 1.03, duration: 0.7, ease: "power3.out", clearProps: "transform,opacity" });
    });
    return () => mm.revert();
  }, [ref, key]);
}

/** The polaroids under `ref` drop onto the page and take their tilt, one after another. */
export function usePolaroidArrival(ref: RefObject<HTMLElement | null>, key: unknown) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const polaroids = gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-polaroid]"));
      if (!polaroids.length) return;
      gsap.from(polaroids, { opacity: 0, y: 16, rotate: 0, duration: 0.6, ease: "power3.out", stagger: 0.08, delay: 0.2, clearProps: "transform,opacity" });
    });
    return () => mm.revert();
  }, [ref, key]);
}

/**
 * The memory cards below the fold wait, and rise into place as they come
 * into view, a few together, once; whatever is already in view is left to
 * `useArrive` and the cards' own rise. Re-measured whenever `key` changes.
 */
export function useRiseOnScroll(ref: RefObject<HTMLElement | null>, selector: string, key: unknown) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const items = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(selector)).filter(belowFold);
      if (!items.length) return;
      gsap.set(items, { y: 16, opacity: 0 });
      return onEnter(items, riseIn);
    });
    return () => mm.revert();
  }, [ref, selector, key]);
}

/**
 * The year headings below the fold ink in as they enter: the words sharpen
 * out of a blur and the rule beside them draws itself (CSS §35 `inked`).
 */
export function useInkIn(ref: RefObject<HTMLElement | null>, key: unknown) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const heads = gsap.utils.toArray<HTMLElement>(root.querySelectorAll(".arc-year")).filter(belowFold);
      if (!heads.length) return;
      heads.forEach((h) => h.classList.add("will-ink"));
      const words = heads.flatMap((h) => Array.from(h.children) as HTMLElement[]);
      gsap.set(words, { opacity: 0, filter: "blur(4px)" });
      const stop = onEnter(heads, (batch) => {
        batch.forEach((h) => {
          h.classList.remove("will-ink");
          h.classList.add("inked");
        });
        const inks = batch.flatMap((h) => Array.from(h.children) as HTMLElement[]);
        gsap.fromTo(inks, { opacity: 0, filter: "blur(4px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.7, ease: "power2.out", stagger: 0.05, clearProps: "filter,opacity" });
      });
      return () => {
        stop();
        heads.forEach((h) => h.classList.remove("will-ink", "inked"));
      };
    });
    return () => mm.revert();
  }, [ref, key]);
}
