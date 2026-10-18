/**
 * Moving between pages (Bao's Standard rules 23–24; the founder, 17 Oct:
 * "per navigation, the layout page can change… make the transition smooth
 * and give the premium feeling").
 *
 * Every in-app link goes through the browser's View Transition: the bar
 * holds still, the brown cloth morphs to the next page's height, the old
 * sheet settles away and the new one rises in its place (CSS section 53).
 * One click listener in the capture phase catches plain left-clicks on
 * same-origin links before React Router's Link does, and navigates with
 * `viewTransition: true`; anything with a modifier key, a target, a
 * download, `data-no-transition`, or only a #hash goes the ordinary way.
 * Without View Transitions (older browsers) or under reduced motion,
 * links behave exactly as before.
 *
 * A page's own arrival (lib/arrive) asks `tookTransition()` so it does not
 * slide the sheet a second time when the transition already did.
 */
import { useEffect } from "react";
import type { NavigateFunction } from "react-router-dom";

let pending = false;

/** Called just before a view-transition navigation. */
export function markTransition(): void {
  pending = true;
}

/** True once after a view-transition navigation; the page's arrival then leaves the sheet where it is. */
export function tookTransition(): boolean {
  const p = pending;
  pending = false;
  return p;
}

export function useTransitionLinks(navigate: NavigateFunction): void {
  useEffect(() => {
    if (typeof document === "undefined" || !("startViewTransition" in document)) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      if ((a.target && a.target !== "_self") || a.hasAttribute("download") || a.dataset.noTransition !== undefined) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // the same page, or a jump within it, is not a page change
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      e.preventDefault();
      markTransition();
      navigate(url.pathname + url.search + url.hash, { viewTransition: true });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [navigate]);
}
