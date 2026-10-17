/**
 * GSAP moves on requestAnimationFrame. In an embedded or background
 * browser view the frame clock can stop while the page stays visible,
 * and then every entrance freezes half way: a page at half opacity, a
 * section below the fold that never rises. The content must never
 * depend on the clock, so this watches the ticker four times a second
 * and, when no frame has come, ticks it by hand. On a healthy page it
 * does nothing.
 */
import gsap from "gsap";

let last = -1;
let timer: number | undefined;

export function startMotionWatchdog(): void {
  if (timer !== undefined || typeof window === "undefined") return;
  timer = window.setInterval(() => {
    const frame = gsap.ticker.frame;
    if (frame === last && gsap.globalTimeline.getChildren(true, true, true).length) gsap.ticker.tick();
    last = frame;
  }, 250);
}
