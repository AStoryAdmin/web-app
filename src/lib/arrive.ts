/**
 * How a page arrives: the words on the cloth rise line by line, the gold
 * foil rule draws itself, the rest of the hero follows, and the paper
 * sheet slides up over the cloth and settles. One authored moment, played
 * once per page. What sits below the fold waits, and rises as it comes
 * into view, once, a few things together. Under prefers-reduced-motion
 * nothing here runs and the page is simply there.
 *
 * Every tween states both ends (fromTo), so a run that is reverted half
 * way (React's development double-mount) never leaves a page faded: the
 * matchMedia context reverts what it created, and the next run starts from
 * the same stated values.
 */
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { tookTransition } from "./pageTransition";

gsap.registerPlugin(SplitText);

export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/** Below the fold, with a little slack, at the moment a page is measured. */
export function belowFold(el: HTMLElement): boolean {
  return el.getBoundingClientRect().top > window.innerHeight * 0.96;
}

/**
 * Hands `items` to `play` as they enter the viewport, once each. Items
 * that enter together come as one batch, so neighbours stagger together
 * instead of each starting alone. Returns a disconnect.
 */
export function onEnter(items: HTMLElement[], play: (batch: HTMLElement[]) => void, rootMargin = "0px 0px -6% 0px"): () => void {
  if (!items.length) return () => {};
  if (typeof IntersectionObserver === "undefined") {
    play(items);
    return () => {};
  }
  // Each item plays once, whichever witness sees it first: the observer, or a measure on scroll, resize and a timer.
  // An observer may never fire in an embedded view whose frames have stopped, and nothing may be left hidden waiting
  // for it (docs/BAOS-STANDARD.md rule 25).
  const waiting = new Set(items);
  const playOnce = (batch: HTMLElement[]) => {
    const fresh = batch.filter((el) => waiting.delete(el));
    if (fresh.length) play(fresh);
    if (!waiting.size) stop();
  };
  const io = new IntersectionObserver(
    (entries) => {
      const batch: HTMLElement[] = [];
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        batch.push(e.target as HTMLElement);
      }
      if (batch.length) playOnce(batch);
    },
    { rootMargin, threshold: 0.01 },
  );
  items.forEach((el) => io.observe(el));
  let timer = 0;
  const check = () => {
    timer = 0;
    const h = window.innerHeight;
    playOnce([...waiting].filter((el) => el.getBoundingClientRect().top < h * 0.94));
  };
  const soon = () => {
    if (!timer) timer = window.setTimeout(check, 120);
  };
  window.addEventListener("scroll", soon, { passive: true });
  window.addEventListener("resize", soon);
  const first = window.setTimeout(check, 700);
  function stop() {
    io.disconnect();
    window.removeEventListener("scroll", soon);
    window.removeEventListener("resize", soon);
    window.clearTimeout(timer);
    window.clearTimeout(first);
  }
  return stop;
}

/** The rise every page uses for what arrives later: 14px up and in, a short stagger, props cleared after. */
export function riseIn(batch: HTMLElement[]): void {
  gsap.fromTo(batch, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.06, clearProps: "transform,opacity", overwrite: "auto" });
}

/**
 * Photographs develop as they come into view, and again whenever a new one
 * loads into the same frame (the memory page's large print changes when a
 * thumbnail is picked). The `develop` keyframe lives in CSS §20; the
 * class only starts it.
 */
function developPhotographs(root: HTMLElement): () => void {
  const photos = gsap.utils.toArray<HTMLImageElement>(root.querySelectorAll("img.rd-hero, .rd-strip img, img[data-develop]"));
  if (!photos.length) return () => {};
  const inView = new Set<HTMLImageElement>();
  const develop = (img: HTMLImageElement) => {
    img.classList.remove("developing");
    void img.offsetWidth; // restart the keyframe
    img.classList.add("developing");
  };
  const onLoad = (e: Event) => {
    const img = e.currentTarget as HTMLImageElement;
    if (inView.has(img)) develop(img);
  };
  photos.forEach((p) => p.addEventListener("load", onLoad));
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const img = e.target as HTMLImageElement;
        if (e.isIntersecting) {
          const first = !inView.has(img);
          inView.add(img);
          if (first && img.complete && img.naturalWidth) develop(img);
        } else inView.delete(img);
      }
    },
    { threshold: 0.2 },
  );
  photos.forEach((p) => io.observe(p));
  return () => {
    io.disconnect();
    photos.forEach((p) => {
      p.removeEventListener("load", onLoad);
      p.classList.remove("developing");
    });
  };
}

export function arrive(root: HTMLElement): () => void {
  // after a view transition the sheet is already in place (lib/pageTransition): only what is inside it rises
  const viaTransition = tookTransition();
  const mm = gsap.matchMedia();
  mm.add(MOTION_OK, () => {
    const hero = root.querySelector<HTMLElement>(".hero");
    const sheet = root.querySelector<HTMLElement>(".sheet-page");
    const stops: (() => void)[] = [];

    // measured before anything is moved
    const all = sheet ? gsap.utils.toArray<HTMLElement>(sheet.querySelectorAll("[data-rise]")) : [];
    const now = all.filter((el) => !belowFold(el)).slice(0, 8);
    const later = all.filter((el) => !now.includes(el));

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    if (hero) {
      const title = hero.querySelector<HTMLElement>("h1");
      const rest = gsap.utils.toArray<HTMLElement>(hero.querySelectorAll("[data-rise]"));
      if (title) {
        const split = SplitText.create(title, { type: "lines", mask: "lines", linesClass: "line" });
        tl.fromTo(split.lines, { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.09 }, 0.05);
      }
      // the gold foil rule is stamped left to right, after the words
      const foil = hero.querySelector<HTMLElement>(".foil:not([data-rise])");
      if (foil) tl.fromTo(foil, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.8, ease: "power3.inOut", clearProps: "transform" }, 0.45);
      if (rest.length) tl.fromTo(rest, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.07 }, 0.25);
      const object = hero.querySelector<HTMLElement>(".object");
      if (object) tl.fromTo(object, { y: 40, opacity: 0, rotate: 2 }, { y: 0, opacity: 1, rotate: 0, duration: 1.1, ease: "power4.out" }, 0.2);
    }
    if (sheet) {
      if (!viaTransition) tl.fromTo(sheet, { y: 56, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power4.out", clearProps: "transform" }, 0.3);
      // the headband is sewn on as the sheet settles (decoration D3)
      const band = sheet.querySelector<HTMLElement>(":scope > .headband");
      if (band) tl.fromTo(band, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.7, ease: "power3.out", clearProps: "clipPath" }, viaTransition ? 0.15 : 0.5);
      if (now.length) tl.fromTo(now, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, clearProps: "transform" }, 0.55);
      if (later.length) {
        gsap.set(later, { y: 14, opacity: 0 });
        stops.push(onEnter(later, riseIn));
      }
      stops.push(developPhotographs(root));
    }
    return () => stops.forEach((stop) => stop());
  });
  return () => mm.revert();
}
