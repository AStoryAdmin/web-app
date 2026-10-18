/**
 * The signed-out book's shared mechanics: the house easings, the opening
 * ritual's once-per-session flag, and useFit, which scales a canvas drawn
 * at a fixed design size to the window (AuthFrame's spread, the front
 * door's bench).
 *
 * The fit depends on the window only, never on the canvas's own height: a
 * plate with an error line, a longer form, a family switched on the front
 * door, none of them can change the size of the book. Every AuthFrame page
 * is fitted to the same 1440 by 720, so moving between them the book holds
 * still. It is computed before the first paint, on resize, and when the
 * faces arrive.
 *
 * On a phone, a narrow window or a portrait tablet the pages stack and
 * scroll instead, at their own size: `STACKED`, the same query the CSS uses.
 * A short desktop window keeps the spread, scaled down; the floors on small
 * print and controls keep it legible.
 */
import { useLayoutEffect, type RefObject } from "react";
import { ZOOM_EVENT, zoomFor } from "../../lib/zoom";

export { MOVE, OUT } from "../../lib/ease";

const KEY = "astory-opened";
/** The pages stack (and scroll) on a phone, a narrow window or a portrait screen; a short desktop window keeps the
 * spread and scales it (the floors keep its controls legible). Mirrored in signed-out.css §7. */
export const STACKED = "(max-width: 1180.98px), (max-aspect-ratio: 5/4)";
export const isStacked = () => typeof window !== "undefined" && window.matchMedia(STACKED).matches;

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

/** Write the layout and the scale on the frame (outside the hook, so the hook's arguments are only ever read). */
function paint(el: HTMLElement, art: HTMLElement, fit: number | null) {
  el.dataset.layout = fit === null ? "stacked" : "book";
  art.classList.toggle("scaled", fit !== null);
  if (fit === null) el.style.removeProperty("--fit");
  else el.style.setProperty("--fit", fit.toFixed(4));
}

/**
 * Scale a canvas drawn at `designW` × `designH` to fit the window, up or down. `root` carries `--fit` (the CSS uses
 * it for `zoom` on the canvas and for the floors on small print and controls); `wrap` is the box whose padding is
 * kept clear. Measured in screen pixels, so the html zoom steps (lib/zoom) and the browser's own zoom both count.
 */

export function useFit(root: RefObject<HTMLElement | null>, wrap: RefObject<HTMLElement | null>, canvas: RefObject<HTMLElement | null>, designW: number, designH: number) {
  useLayoutEffect(() => {
    const el = root.current;
    const box = wrap.current;
    const art = canvas.current;
    if (!el || !box || !art) return;
    let timer = 0;
    const apply = () => {
      if (isStacked()) return paint(el, art, null);
      // the zoom this window has (or is about to have: lib/zoom applies it on its own timer), from the same formula
      const z = zoomFor(window.innerWidth, window.innerHeight);
      const cs = getComputedStyle(box);
      const padX = (parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)) * z;
      const padY = (parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)) * z;
      const w = window.innerWidth - padX;
      const h = window.innerHeight - padY;
      const fit = Math.min(3, Math.max(0.5, Math.min(w / (designW * z), h / (designH * z))));
      paint(el, art, fit);
    };
    apply();
    const later = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(apply, 40);
    };
    window.addEventListener("resize", later);
    window.addEventListener(ZOOM_EVENT, apply);
    void document.fonts?.ready.then(later);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", later);
      window.removeEventListener(ZOOM_EVENT, apply);
    };
  }, [root, wrap, canvas, designW, designH]);
}
