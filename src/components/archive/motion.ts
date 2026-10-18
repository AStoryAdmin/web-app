/**
 * Arrivals for the Archive and the memory page, on GSAP. Everything rises
 * or fades; nothing slides sideways (docs/PRODUCT-DECISIONS.md §12), and
 * under prefers-reduced-motion nothing here runs at all - the CSS already
 * collapses the rest to a crossfade.
 */
import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { belowFold, onEnter, riseIn } from "../../lib/arrive";
import { OUT } from "../../lib/ease";

const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/**
 * `onEnter`, with a second witness. An IntersectionObserver may never fire
 * in an embedded view whose frames have stopped, and a card must never be
 * left hidden waiting for it (docs/BAOS-STANDARD.md §25). So a scroll and
 * resize listener measures the waiting items too, and whichever sees an
 * item in view first plays it, once.
 */
function onEnterSafe(items: HTMLElement[], play: (batch: HTMLElement[]) => void): () => void {
  const waiting = new Set(items);
  const playOnce = (batch: HTMLElement[]) => {
    const fresh = batch.filter((el) => waiting.delete(el));
    if (fresh.length) play(fresh);
  };
  const stopIo = onEnter(items, playOnce);
  let raf = 0;
  const check = () => {
    raf = 0;
    const h = window.innerHeight;
    playOnce([...waiting].filter((el) => el.getBoundingClientRect().top < h * 0.94));
    if (!waiting.size) stop();
  };
  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(check);
    // the frame may never come: measure on a timer as well
    window.setTimeout(check, 120);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  function stop() {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    if (raf) cancelAnimationFrame(raf);
  }
  return () => {
    stop();
    stopIo();
  };
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Elements marked `data-arrive` under `ref` and in view rise 10px into
 * place, staggered 60ms, whenever `key` changes (a new page or view).
 */
export function useArrive(ref: RefObject<HTMLElement | null>, key: unknown) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      // only what is in view now; what is below waits for useRiseOnScroll / useInkIn, so one hook owns each entrance
      const items = gsap.utils.toArray<HTMLElement>(root.querySelectorAll("[data-arrive]")).filter((el) => !belowFold(el));
      if (!items.length) return;
      gsap.fromTo(items, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: OUT, stagger: 0.06, clearProps: "transform,opacity" });
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
      gsap.fromTo(el, { opacity: 0, scale: 1.03 }, { opacity: 1, scale: 1, duration: 0.7, ease: "power3.out", clearProps: "transform,opacity" });
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
      gsap.fromTo(polaroids, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.08, delay: 0.2, clearProps: "transform,opacity" });
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
      const stop = onEnterSafe(items, riseIn);
      // whatever never came into view is put back as it was when the page changes
      return () => {
        stop();
        gsap.set(items, { clearProps: "transform,opacity" });
      };
    });
    return () => mm.revert();
  }, [ref, selector, key]);
}

/**
 * The year headings below the fold ink in as they enter: the words rise a
 * little into place and the rule beside them draws itself (CSS §35 `inked`).
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
      gsap.set(words, { opacity: 0, y: 8 });
      const stop = onEnterSafe(heads, (batch) => {
        batch.forEach((h) => {
          h.classList.remove("will-ink");
          h.classList.add("inked");
        });
        const inks = batch.flatMap((h) => Array.from(h.children) as HTMLElement[]);
        gsap.fromTo(inks, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.6, ease: OUT, stagger: 0.05, clearProps: "transform,opacity" });
      });
      return () => {
        stop();
        heads.forEach((h) => h.classList.remove("will-ink", "inked"));
      };
    });
    return () => mm.revert();
  }, [ref, key]);
}

/**
 * A filter changed: the list does not arrive all over again (seen tens of
 * times a visit), it crossfades in 150ms. Skips the first render, which
 * the arrival owns. Opacity only, from a visible 0.35, never from nothing.
 */
export function useCrossfade(ref: RefObject<HTMLElement | null>, key: unknown) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.fromTo(el, { opacity: 0.35 }, { opacity: 1, duration: 0.15, ease: OUT, clearProps: "opacity" });
    });
    return () => mm.revert();
  }, [ref, key]);
}
