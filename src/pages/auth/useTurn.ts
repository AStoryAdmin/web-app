/**
 * A page of the signed-out book never turns into one whose photographs are
 * still grey. While the visitor reads, the pictures of every page this one
 * can turn into are fetched and decoded (the front door's loose prints, the
 * sign-in book's album and bookplates). A press on a link to such a page
 * whose pictures are not ready yet is held at most 400 ms for them, then the
 * page turns as a View Transition, as the link would have. A link marked
 * `data-turn="now"` (one that carries router state) always goes at once.
 */
import { useEffect, type RefObject } from "react";
import { useNavigate } from "react-router-dom";
import { allDecoded, BOOK_PICTURES, decodeAll, DOOR_PRINTS, picturesFor, turnReady } from "../../components/delight/photoReady";

export function useTurn(ground: RefObject<HTMLElement | null>) {
  const navigate = useNavigate();
  useEffect(() => {
    const el = ground.current;
    if (!el) return;
    // after this page's own pictures have had their turn on the wire
    const early = window.setTimeout(() => void decodeAll([...BOOK_PICTURES, ...DOOR_PRINTS]), 250);
    let holding = false;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || !el.contains(a) || a.dataset.turn === "now" || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || (url.pathname === window.location.pathname && url.search === window.location.search)) return;
      const need = picturesFor(url.pathname);
      if (allDecoded(need)) return; // ready: the link goes as it is
      // captured before React's handlers, so the router's Link sees the press already taken
      e.preventDefault();
      if (holding) return;
      holding = true;
      void turnReady(need).then(() => {
        holding = false;
        navigate(url.pathname + url.search + url.hash, { viewTransition: true });
      });
    };
    el.addEventListener("click", onClick, true);
    return () => {
      window.clearTimeout(early);
      el.removeEventListener("click", onClick, true);
    };
  }, [ground, navigate]);
}
