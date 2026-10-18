/**
 * The signed-out book's shared mechanics: the house easings, the opening
 * ritual's once-per-session flag, and useFit, which scales a canvas drawn
 * at a design size to the window (AuthFrame's spread, the front door's bench).
 */
import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

const KEY = "astory-opened";
/** Below this the pages stack and the page scrolls (CSS uses the same width). */
export const STACKED = "(max-width: 760px)";

gsap.registerPlugin(CustomEase);
/** The house easings (DESIGN.md, the craft rules): entrances and feedback, and movement on screen. */
export const OUT = CustomEase.create("house-out", "0.23,1,0.32,1");
export const MOVE = CustomEase.create("house-move", "0.77,0,0.175,1");

export const seenOpening = () => {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
};
export const markOpened = () => {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    // then it plays again next time; no harm
  }
};

/** The last scale, so the next page of the book starts at it instead of jumping from 1. */
const remembered: Record<string, number> = {};

/**
 * Scale a canvas drawn at `designW` wide to the window, up or down, so the whole of it is on one screen.
 * `root` carries `--fit` for the CSS (`zoom: var(--fit)` on the canvas, and the small print's floor);
 * `wrap` is the box it must fit inside (its padding is kept clear). Measured in screen pixels, so the
 * html zoom steps (lib/zoom) and the browser's own zoom both count. Runs before the first paint and
 * again on every resize; below `STACKED` the canvas is not scaled and the page scrolls.
 */
export function useFit(root: RefObject<HTMLElement | null>, wrap: RefObject<HTMLElement | null>, canvas: RefObject<HTMLElement | null>, key: string, designW: number, designH: number) {
  useLayoutEffect(() => {
    const el = root.current;
    const box = wrap.current;
    const art = canvas.current;
    if (!el || !box || !art) return;
    let fit = remembered[key] ?? 1;
    let timer = 0;
    const apply = () => {
      if (matchMedia(STACKED).matches) {
        el.style.removeProperty("--fit");
        art.classList.remove("scaled");
        return;
      }
      if (!art.classList.contains("scaled")) art.classList.add("scaled");
      el.style.setProperty("--fit", fit.toFixed(3));
      // twice: the small print has a floor in screen pixels, so the canvas's height depends a little on the scale
      for (let i = 0; i < 2; i++) {
        const z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
        const cs = getComputedStyle(box);
        const padX = (parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)) * z;
        const padY = (parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)) * z;
        const w = box.getBoundingClientRect().width - padX;
        const h = window.innerHeight - padY;
        const natH = Math.max(designH, art.getBoundingClientRect().height / (z * fit));
        const next = Math.min(3, Math.max(0.5, Math.min(w / (designW * z), h / (natH * z))));
        if (Math.abs(next - fit) < 0.004) break;
        fit = next;
        el.style.setProperty("--fit", fit.toFixed(3));
      }
      remembered[key] = fit;
    };
    apply();
    const later = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(apply, 40);
    };
    const ro = new ResizeObserver(later);
    ro.observe(box);
    ro.observe(art);
    window.addEventListener("resize", later);
    // the faces arrive after the first paint and change the plate's height a little
    void document.fonts?.ready.then(later);
    return () => {
      window.clearTimeout(timer);
      ro.disconnect();
      window.removeEventListener("resize", later);
    };
  }, [root, wrap, canvas, key, designW, designH]);
}

