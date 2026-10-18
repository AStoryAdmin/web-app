/**
 * The rubber stamp that lands beside the seal when a memory is kept: a
 * double-ruled rectangle of terracotta ink, "KEPT · 17 OCT", slightly
 * worn, at a small tilt (docs/research/decoration-2026.md D5). The seal is
 * the act, the stamp is the result. It lands once and dries away. Under
 * reduced motion it simply appears and fades.
 *
 * `x` and `y` are a point on the screen (getBoundingClientRect), converted
 * to the zoomed page's CSS pixels (lib/zoom); `offsetX` is added after that,
 * in CSS pixels, so the stamp sits the same distance from the seal at any zoom.
 */
import gsap from "gsap";
import { pageZoom } from "./zoom";
import { OUT } from "./ease";

export function inkStamp(x: number, y: number, word = "Kept", offsetX = 0): void {
  const quiet = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = document.createElement("div");
  el.className = "ink-stamp";
  el.setAttribute("aria-hidden", "true");
  const z = pageZoom();
  el.style.left = `${x / z + offsetX}px`;
  el.style.top = `${y / z}px`;
  el.textContent = `${word} · ${new Date().toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
  document.body.appendChild(el);
  const tl = gsap.timeline({ onComplete: () => el.remove() });
  if (quiet) {
    tl.fromTo(el, { xPercent: -50, yPercent: -50, rotation: -6, opacity: 0 }, { opacity: 0.86, duration: 0.15, ease: "none" }).to(el, { opacity: 0, duration: 0.15, ease: "none" }, "+=1");
    return;
  }
  tl.fromTo(el, { xPercent: -50, yPercent: -50, scale: 1.25, rotation: gsap.utils.random(-9, -4), opacity: 0 }, { scale: 1, opacity: 0.86, duration: 0.18, ease: OUT }).to(
    el,
    { opacity: 0, y: "-=6", duration: 0.6, ease: OUT },
    "+=0.8",
  );
}
