/**
 * A print's photograph is hidden, with the dark veil under its caption, until it has loaded; then CSS fades both in
 * (240ms). Without this a print reads as a grey tile under a brown scrim for the second or two a signed photograph
 * takes. A photograph already in the cache is marked at once, so it never blinks.
 */
import type { SyntheticEvent } from "react";

export const loadedRef = (img: HTMLImageElement | null) => {
  if (img && img.complete && img.naturalWidth > 0) img.dataset.loaded = "1";
};

export const onLoaded = (e: SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.dataset.loaded = "1";
};
