/**
 * The keyboard layer (Bao's Standard rule 43): W to write, / to search the
 * memories, ? for the list of shortcuts, from any signed-in page, whenever the focus is not in a field.
 * The writer handles W itself (it puts the pen on the page), so on /write
 * this layer leaves W alone. Never with a modifier key, never while typing.
 */
import { useEffect } from "react";
import type { NavigateFunction } from "react-router-dom";
import { markTransition } from "./pageTransition";

const typing = (el: Element | null): boolean => {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (el as HTMLElement).isContentEditable;
};

export function useKeyLayer(navigate: NavigateFunction, onHelp?: () => void): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || typing(document.activeElement)) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      const path = window.location.pathname;
      const go = (to: string) => {
        e.preventDefault();
        const vt = "startViewTransition" in document && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (vt) markTransition();
        navigate(to, { viewTransition: vt });
      };
      if (e.key === "?" && onHelp) {
        e.preventDefault();
        onHelp();
      } else if ((e.key === "w" || e.key === "W") && !e.shiftKey && !path.startsWith("/write")) go("/write");
      else if (e.key === "/" && !path.startsWith("/archive")) go("/archive?focus=search");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, onHelp]);
}
