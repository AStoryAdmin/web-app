/**
 * GSAP moves on requestAnimationFrame. In an embedded or background
 * browser view the frame clock can stop while the page stays visible,
 * and then every entrance freezes half way: a page at half opacity, a
 * section below the fold that never rises. The content must never
 * depend on the clock, so this watches the ticker four times a second
 * and, when no frame has come, ticks it by hand in real time (lag
 * smoothing off, so a 0.6 s entrance takes 0.6 s, not ten capped ticks).
 * When frames come back, the normal smoothing returns. On a healthy page
 * it does nothing.
 */
import gsap from "gsap";

let last = -1;
let timer: number | undefined;
let frozen = false;

export function startMotionWatchdog(): void {
  if (timer !== undefined || typeof window === "undefined") return;
  timer = window.setInterval(() => {
    const frame = gsap.ticker.frame;
    const busy = gsap.globalTimeline.getChildren(true, true, true).length > 0;
    if (frame === last && busy) {
      if (!frozen) {
        frozen = true;
        gsap.ticker.lagSmoothing(0);
      }
      gsap.ticker.tick();
    } else if (frozen && frame !== last) {
      // frames are flowing again on their own
      frozen = false;
      gsap.ticker.lagSmoothing(500, 33);
    }
    last = gsap.ticker.frame;
  }, 250);
}
