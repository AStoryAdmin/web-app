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
 * still. It is computed before the first paint, after each resize (in the
 * same task as the page zoom, after it: lib/zoom's RESIZED_EVENT), and when
 * the faces arrive. The last fit of each design size is kept for the next
 * page's first render (`seedFit`), and the scale is written inline on the
 * canvas, so a page that mounts is drawn at its size from its first frame.
 *
 * On a phone, a narrow window or a portrait tablet the pages stack and
 * scroll instead, at their own size: `STACKED`, the same query the CSS uses.
 * A short desktop window keeps the spread, scaled down; the floors on small
 * print and controls keep it legible.
 */
import { useLayoutEffect, type RefObject } from "react";
import { RESIZED_EVENT, startPageFit, zoomFor } from "../../lib/zoom";

export { MOVE, OUT } from "../../lib/ease";

const KEY = "astory-opened";
/** The pages stack (and scroll) on a phone, a narrow window or a portrait screen; a short desktop window keeps the
 * spread and scales it (the floors keep its controls legible). Mirrored in signed-out.css §7. */
export const STACKED = "(max-width: 1180.98px), (max-aspect-ratio: 1/1)";
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

/** The last fit drawn for each design size: it depends on the window only, so the next page of the same size starts
 * from it (`seedFit`) and is never drawn unscaled while its own measure is pending. */
const lastFit = new Map<string, number>();

/** For the first render: the scale this canvas will have, if a page of its size has been fitted to this window. The
 * frame puts it inline (`--fit` on the root, `zoom` on the canvas) so it is there before any effect runs. */
export function seedFit(designW: number, designH: number): number | null {
  if (isStacked()) return null;
  return lastFit.get(`${designW}x${designH}`) ?? null;
}

/** Write the layout and the scale on the frame (outside the hook, so the hook's arguments are only ever read). The
 * zoom goes inline on the canvas too, so it never waits on the custom property. A new scale is never eased: under
 * reduced motion the house gives every element a 1 ms transition of everything, which would draw the zoom, the
 * floors and the canvas's width at their old values for a frame or two; `.fitting` (signed-out.css §0) holds all
 * transitions off while the scale is written and the style is settled. */
function paint(el: HTMLElement, art: HTMLElement, fit: number | null, key: string) {
  const value = fit === null ? "" : fit.toFixed(4);
  const layout = fit === null ? "stacked" : "book";
  if (el.style.getPropertyValue("--fit") === value && art.style.zoom === value && el.dataset.layout === layout) return;
  el.classList.add("fitting");
  el.dataset.layout = layout;
  art.classList.toggle("scaled", fit !== null);
  if (fit === null) {
    el.style.removeProperty("--fit");
    art.style.removeProperty("zoom");
  } else {
    el.style.setProperty("--fit", value);
    art.style.zoom = value;
    lastFit.set(key, +value);
  }
  void art.offsetWidth; // the new style, settled with no transition
  el.classList.remove("fitting");
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
    const key = `${designW}x${designH}`;
    const apply = () => {
      if (isStacked()) return paint(el, art, null, key);
      // the zoom this window has (lib/zoom has applied it before RESIZED_EVENT), from the one formula
      const z = zoomFor(window.innerWidth, window.innerHeight);
      const cs = getComputedStyle(box);
      const padX = (parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)) * z;
      const padY = (parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)) * z;
      const w = window.innerWidth - padX;
      const h = window.innerHeight - padY;
      const fit = Math.min(3, Math.max(0.5, Math.min(w / (designW * z), h / (designH * z))));
      paint(el, art, fit, key);
    };
    apply();
    // one handler for the zoom and the fit, the zoom first (idempotent: main.tsx has normally started it)
    startPageFit();
    let live = true;
    window.addEventListener(RESIZED_EVENT, apply);
    void document.fonts?.ready.then(() => live && apply());
    return () => {
      live = false;
      window.removeEventListener(RESIZED_EVENT, apply);
    };
  }, [root, wrap, canvas, designW, designH]);
}
