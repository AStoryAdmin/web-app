/**
 * An ink stamp pressed where you pressed: one word at a slight tilt, a few
 * specks, and it dries away. Used once, when a memory is kept. Nothing under
 * reduced motion.
 */
import gsap from "gsap";

export function inkStamp(x: number, y: number, word = "Kept"): void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const el = document.createElement("div");
  el.className = "ink-stamp";
  el.setAttribute("aria-hidden", "true");
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.textContent = word;
  const specks = Array.from({ length: 6 }, () => el.appendChild(document.createElement("i")));
  document.body.appendChild(el);
  gsap
    .timeline({ onComplete: () => el.remove() })
    .fromTo(el, { xPercent: -50, yPercent: -50, scale: 2.2, rotation: gsap.utils.random(-26, -14), opacity: 0 }, { scale: 1, rotation: gsap.utils.random(-11, -4), opacity: 1, duration: 0.3, ease: "back.out(1.6)" })
    .fromTo(specks, { x: 0, y: 0, scale: 0 }, { x: () => gsap.utils.random(-44, 44), y: () => gsap.utils.random(-26, 26), scale: () => gsap.utils.random(0.5, 1.2), duration: 0.3, ease: "power3.out" }, "-=0.14")
    .to(el, { opacity: 0, y: "-=8", duration: 0.6, ease: "power1.in" }, "+=0.7");
}
