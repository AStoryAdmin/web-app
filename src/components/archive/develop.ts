/**
 * A print's photograph: the right size, and developing while it loads.
 * - The frame is measured (box × page zoom × screen density) and the photograph is signed at that size, 400 or 600
 *   device pixels or the original (lib/photoUrls); nothing is signed before the frame is measured, and the size only
 *   ever steps up.
 * - A rendition that will not load is swapped, once, for the original, and transforms stop for the session.
 * - Until it has loaded the print is dark under its caption's veil (archive-reading.css); then CSS fades the
 *   photograph in (240ms). A photograph already in the cache is marked at once, so it never blinks.
 */
import { useCallback, useEffect, useState, type SyntheticEvent } from "react";
import { originalAfterError, renditionWidth, usePhotoUrl } from "../../lib/photoUrls";
import { pageZoom, ZOOM_EVENT } from "../../lib/zoom";

export const loadedRef = (img: HTMLImageElement | null) => {
  if (img && img.complete && img.naturalWidth > 0) img.dataset.loaded = "1";
};

/** The step a frame needs now; `undefined` (the original) is the largest. */
const need = (el: HTMLElement) => renditionWidth(el.offsetWidth, pageZoom(), window.devicePixelRatio || 1, el.offsetHeight);
/** Only ever up: a frame that grows (a maximised window, a zoom) gets a larger rendition, never a smaller one back. */
const larger = (a: number | undefined | null, b: number | undefined) => (a === null ? b : a === undefined || b === undefined ? undefined : Math.max(a, b));

/**
 * The photograph for a print or a List thumbnail: `frameRef` goes on its frame, `src`, `onLoad` and `onError` on the
 * <img>. The frame is measured with its height (a landscape fills a square print by its height) and watched while it
 * lives: a frame that grows, a page zoom (ZOOM_EVENT) or a move to a denser screen steps the rendition up, never down.
 * When a photograph has loaded, its real ratio is checked too: one wider than 3:2 that falls short of covering the
 * frame steps up as well.
 */
export function usePrintPhoto(url: string | null | undefined) {
  const [width, setWidth] = useState<number | undefined | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);
  const [frame, setFrame] = useState<HTMLElement | null>(null);
  const frameRef = useCallback((el: HTMLElement | null) => {
    setFrame(el);
    if (el) setWidth((w) => larger(w, need(el)));
  }, []);
  useEffect(() => {
    if (!frame) return;
    const step = () => setWidth((w) => larger(w, need(frame)));
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(step);
    ro?.observe(frame);
    window.addEventListener(ZOOM_EVENT, step);
    // a move to a screen of another density: the query for the current density stops matching
    let density: MediaQueryList | null = null;
    const watchDensity = () => {
      density?.removeEventListener("change", onDensity);
      density = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      density.addEventListener("change", onDensity);
    };
    const onDensity = () => {
      step();
      watchDensity();
    };
    watchDensity();
    return () => {
      ro?.disconnect();
      window.removeEventListener(ZOOM_EVENT, step);
      density?.removeEventListener("change", onDensity);
    };
  }, [frame]);
  const signed = usePhotoUrl(url, width);
  const onLoad = useCallback(
    (e: SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      img.dataset.loaded = "1";
      if (!frame || !img.naturalWidth || !img.naturalHeight) return;
      // cover at the photograph's own ratio: the width it must have to fill the frame's height as well as its width
      const ratio = img.naturalWidth / img.naturalHeight;
      const zoom = pageZoom();
      const density = window.devicePixelRatio || 1;
      const needed = Math.max(frame.offsetWidth, frame.offsetHeight * ratio) * zoom * density;
      if (img.naturalWidth + 1 < needed) setWidth((w) => larger(w, renditionWidth(Math.max(frame.offsetWidth, frame.offsetHeight * ratio), zoom, density)));
    },
    [frame],
  );
  const onError = useCallback(() => {
    if (fallback) return;
    void originalAfterError(url).then((u) => u && setFallback(u));
  }, [url, fallback]);
  return { src: fallback ?? signed, frameRef, onLoad, onError };
}
