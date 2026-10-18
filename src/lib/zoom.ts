/**
 * The page's scale on a large window. Up to 1600 by 1000 CSS pixels the
 * app is laid out at its own size. Beyond that in BOTH directions, the
 * whole page grows with the window, continuously, so the content keeps the same share of the screen
 * on a 2K, 4K or zoomed-out window instead of shrinking into a strip in
 * the middle. Set once before the first paint and again on resize, on the
 * html element, with --zoom published for CSS (viewport units are
 * multiplied by the zoom in Chromium, so full-height rules divide by it).
 *
 * Anything that turns a pointer or a measured rectangle into a CSS length
 * must divide by pageZoom(): getBoundingClientRect and clientX are in
 * screen pixels, while left, top and transforms are in the zoomed page's.
 */
const BASE_W = 1600;
const BASE_H = 1000;
const MAX = 3;

export function pageZoom(): number {
  if (typeof document === "undefined") return 1;
  return parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
}

/** The zoom step for a window of w by h CSS pixels, the one formula: anything that needs the zoom a window will have
 * (before the resize timer below has applied it) computes it here instead of reading the computed style. */
export function zoomFor(w: number, h: number): number {
  // the smaller of the two: a short window never scales up, so a screen keeps as much on it as at 1600 by 1000
  return +Math.min(MAX, Math.max(1, Math.min(w / BASE_W, h / BASE_H))).toFixed(4);
}

/** Fired on window after the html zoom has changed, for whatever measures against it. */
export const ZOOM_EVENT = "astory:zoom";

function apply(): void {
  const z = zoomFor(window.innerWidth, window.innerHeight);
  const root = document.documentElement;
  const value = z.toFixed(4);
  if (root.style.zoom === value) return;
  root.style.zoom = value;
  root.style.setProperty("--zoom", value);
  window.dispatchEvent(new Event(ZOOM_EVENT));
}

let started = false;
export function startPageFit(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  apply();
  // a timer, not an animation frame: some embedded browser views never draw frames, and the scale must still follow
  let timer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(apply, 60);
  });
}
