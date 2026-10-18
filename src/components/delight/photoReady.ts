/**
 * Photographs that are never drawn grey. A page that can turn into another
 * decodes the next page's pictures while the visitor reads (`decodeAll`),
 * and waits for them, at most 400 ms, before it turns (`turnReady`). If a
 * picture still is not decoded when its page appears, its print waits at
 * opacity 0 and fades in when the picture can be drawn (`holdUntilDecoded`,
 * `[data-wait]` in signed-out.css §1), instead of standing as a grey box.
 */

const pending = new Map<string, Promise<void>>();
const done = new Set<string>();

/** Fetch and decode these pictures (once each per visit); resolves when all are ready or have failed. */
export function decodeAll(srcs: readonly string[]): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  return Promise.all(
    srcs.map((src) => {
      let p = pending.get(src);
      if (!p) {
        const img = new Image();
        img.src = src;
        p = img.decode().then(
          () => void done.add(src),
          () => undefined,
        );
        pending.set(src, p);
      }
      return p;
    }),
  ).then(() => undefined);
}

/** True when every one of these pictures has been decoded. */
export const allDecoded = (srcs: readonly string[]) => srcs.every((src) => done.has(src));

/** At most `ms`: these pictures decoded, or the time is up. */
export const turnReady = (srcs: readonly string[], ms = 400) =>
  Promise.race([decodeAll(srcs), new Promise<void>((ok) => setTimeout(ok, ms))]);

/**
 * For an <img>'s ref: if its picture cannot be drawn yet, the holder (the print around it) waits at opacity 0 and
 * fades in once it can. A picture already in hand is left alone, so nothing fades that was there from the start.
 */
export function holdUntilDecoded(img: HTMLImageElement | null, holder: HTMLElement | null = img) {
  if (!img || !holder || (img.complete && img.naturalWidth > 0)) return;
  holder.dataset.wait = "";
  const show = () => {
    delete holder.dataset.wait;
  };
  img.decode().then(show, show);
}

/** The front door's loose prints. */
export const DOOR_PRINTS = ["/photos/30-1200.webp", "/photos/12-1200.webp", "/photos/33-1200.webp"] as const;
/** The sign-in book's album and its two bookplates (blank, and lettered on Create account). */
export const BOOK_PICTURES = ["/photos/27-1200.webp", "/photos/02-1200.webp", "/photos/18-1200.webp", "/book/bookplate-blank.webp", "/book/bookplate.webp"] as const;

const BOOK_PAGES = ["/sign-in", "/create-account", "/forgot-password", "/reset-password", "/verify"];
/** The pictures a signed-out page needs at its first frame, by its path. */
export function picturesFor(pathname: string): readonly string[] {
  if (pathname === "/welcome") return DOOR_PRINTS;
  if (BOOK_PAGES.includes(pathname)) return BOOK_PICTURES;
  return [];
}
