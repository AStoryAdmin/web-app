/**
 * The atmosphere on the sheet (docs/research/atmosphere-2026.md, CSS §46).
 * While a page of the book is read down, two things answer the scroll:
 *
 * - The running head stays at the top of the page and names the section you
 *   are in ("Recent memories", "1962", "A page for today"), as a printed
 *   book's recto does, with a foil hairline under it once the page moves.
 * - A short silk ribbon, in the cloth's own colour, hangs from the running
 *   head in the outer margin and lengthens a little as the page is read
 *   (72px at the top, 200px at the end): a bookmark, never a progress bar.
 *
 * Nothing here hides anything. The ribbon's rest state is a short bookmark
 * (CSS), the running head's rest state is the page's name; transform and
 * opacity are the only properties touched. Under reduced motion the ribbon
 * stays at rest and the running head still changes its words.
 *
 * Measured rectangles are in screen pixels; transforms are in the zoomed
 * page's, so every length is divided by pageZoom() (lib/zoom).
 */
import gsap from "gsap";
import { OUT } from "./ease";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { pageZoom } from "./zoom";

gsap.registerPlugin(ScrollTrigger);

const MOTION_OK = "(prefers-reduced-motion: no-preference)";
/** The ribbon's length at the top of the page and at its end, in CSS px (the wrapper in CSS §46 is RIBBON_MAX tall). */
export const RIBBON_REST = 72;
export const RIBBON_MAX = 200;
/** The section headings the running head follows. A block can name itself with data-running. */
const SECTIONS = ".sechead h2, .arc-year h2, .fv-head h2, #pp-notes-h, #pp-related-h, [data-running]";

function sectionName(el: Element): string {
  const named = (el as HTMLElement).dataset?.running;
  return (named || el.textContent || "").replace(/\s+/g, " ").trim();
}

export function atmosphere(root: HTMLElement): () => void {
  const sheet = root.querySelector<HTMLElement>(".sheet-page");
  const head = sheet?.querySelector<HTMLElement>(".running-head-sheet");
  const sec = head?.querySelector<HTMLElement>(".rh-sec");
  if (!sheet || !head || !sec) return () => {};
  const ribbon = head.querySelector<HTMLElement>(".rh-ribbon i");
  // in development the triggers can be stepped by hand where the pane draws no frames (see WeekInk's __gsap)
  if (import.meta.env.DEV) Object.assign(window as unknown as { __st?: typeof ScrollTrigger; __gsap?: typeof gsap }, { __st: ScrollTrigger, __gsap: gsap });

  // the ribbon's tail, eased like silk with a little weight
  const toY = ribbon && window.matchMedia(MOTION_OK).matches ? gsap.quickTo(ribbon, "y", { duration: 0.6, ease: OUT }) : null;
  let shown = "";

  const update = () => {
    const z = pageZoom();
    const rect = sheet.getBoundingClientRect();
    const box = head.getBoundingClientRect();
    // the band is held at the top of the window: a foil hairline under it
    head.classList.toggle("stuck", box.top <= 0.5 && rect.top < -1);

    if (toY) {
      const travel = rect.height - window.innerHeight;
      const read = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0;
      toY(RIBBON_REST + read * (RIBBON_MAX - RIBBON_REST) - RIBBON_MAX);
    }

    // the reading line: a third of the way down the window, never above the band; at the very end, the last section
    const line = Math.max(box.bottom + 24 * z, window.innerHeight * 0.32);
    const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    let current = "";
    for (const el of sheet.querySelectorAll(SECTIONS)) {
      if (atEnd || el.getBoundingClientRect().top <= line) current = sectionName(el);
      else break;
    }
    if (current !== shown) {
      shown = current;
      if (current) sec.textContent = current;
      head.classList.toggle("in-section", Boolean(current));
    }
  };

  const st = ScrollTrigger.create({ trigger: sheet, start: "top bottom", end: "bottom top", onUpdate: update, onRefresh: update });
  update();
  return () => {
    st.kill();
    head.classList.remove("stuck", "in-section");
  };
}
