/**
 * A print's photograph: the right size, and developing while it loads.
 * - The frame is measured once (box × page zoom × screen density) and the photograph is signed at that size, 400 or
 *   600 device pixels or the original (lib/photoUrls); nothing is signed before the frame is measured.
 * - A rendition that will not load is swapped, once, for the original, and transforms stop for the session.
 * - Until it has loaded the print is dark under its caption's veil (archive-reading.css); then CSS fades the
 *   photograph in (240ms). A photograph already in the cache is marked at once, so it never blinks.
 */
import { useCallback, useState, type SyntheticEvent } from "react";
import { originalAfterError, renditionWidth, usePhotoUrl } from "../../lib/photoUrls";
import { pageZoom } from "../../lib/zoom";

export const loadedRef = (img: HTMLImageElement | null) => {
  if (img && img.complete && img.naturalWidth > 0) img.dataset.loaded = "1";
};

export const onLoaded = (e: SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.dataset.loaded = "1";
};

/** The photograph for a print or a List thumbnail: `frameRef` goes on its frame, `src` and `onError` on the <img>. */
export function usePrintPhoto(url: string | null | undefined) {
  const [width, setWidth] = useState<number | undefined | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);
  const frameRef = useCallback((el: HTMLElement | null) => {
    if (el) setWidth(renditionWidth(el.offsetWidth, pageZoom(), window.devicePixelRatio || 1));
  }, []);
  const signed = usePhotoUrl(url, width);
  const onError = useCallback(() => {
    if (fallback) return;
    void originalAfterError(url).then((u) => u && setFallback(u));
  }, [url, fallback]);
  return { src: fallback ?? signed, frameRef, onError };
}
