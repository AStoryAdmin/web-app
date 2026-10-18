/**
 * The signed-out frame: the family book, open on the cloth. Two square
 * pages side by side, drawn at 1440 by 720 and grown to fill a larger window, with the chocolate cloth
 * (the lamp, a pressed leaf, the binder's deboss) showing either side on a
 * wide display. The left page is the inside of the front board: the
 * endpaper with the mark repeated, and three prints held by photo corners
 * (delight/Prints). The right page is the title page: the mark, the
 * promise in Cormorant, a gold rule, and the sign-in pasted on as an Ex
 * Libris bookplate, with the family dog's chin on the plate's top edge
 * (delight/Companion). On a very wide display the closed keepsake book lies
 * on the cloth beside the spread. On a phone the pages stack, title page first.
 *
 * Arrival, once per session (sessionStorage): the book lies closed, the
 * front board over the right page; the foil title tools itself on, a gold
 * rule draws, the cloth breathes under the lamp; then the board swings
 * open on the spine (0.9 s) and lands as the left page, the prints settle
 * onto it, the dog looks up: 2.4 s in all, and any press skips to the end.
 * Under reduced motion the book is simply open; on a phone the board is a
 * half-second beat and a fade.
 */
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { Lockup } from "../../components/Brand";
import ClothStamp from "../../components/delight/ClothStamp";
import Companion, { type CompanionRest, type CompanionState } from "../../components/delight/Companion";
import Leaf from "../../components/delight/Leaf";
import Prints from "../../components/delight/Prints";
import { useLight } from "../../components/delight/Light";
import { MARK_MASK } from "../../components/book/markMask";

const KEY = "astory-opened";

gsap.registerPlugin(CustomEase);
/** The house easings (DESIGN.md, the craft rules): entrances and feedback, and movement on screen. */
const OUT = CustomEase.create("house-out", "0.23,1,0.32,1");
const MOVE = CustomEase.create("house-move", "0.77,0,0.175,1");

type Props = {
  children: ReactNode;
  /** Kept for the pages that still pass it; the frame now says one thing. */
  line?: number;
  /** What the dog should know: which field is focused, whether the password is shown. */
  companion?: CompanionState;
};

const seen = () => {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
};
const markSeen = () => {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    // then it plays again next time; no harm
  }
};

export default function AuthFrame({ children, companion }: Props) {
  const ground = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<"closed" | "open">(() => {
    if (seen()) return "open";
    // under reduced motion the book is simply open, and that counts as having seen it
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      markSeen();
      return "open";
    }
    return "closed";
  });
  useLight(ground);
  const wrapRef = useRef<HTMLDivElement>(null);
  const spreadRef = useRef<HTMLDivElement>(null);

  // The book is drawn at 1440 by 720. On a window larger than that it grows to fill the window
  // (CSS zoom on the spread, so the type, the plate and the prints grow together); it never shrinks
  // below its drawn size, where the fluid layout already fits. Measured in screen pixels so the
  // html zoom steps and the browser's own zoom both count.
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const spread = spreadRef.current;
    const root = ground.current;
    if (!wrap || !spread || !root) return;
    let fit = 1;
    let frame = 0;
    const measure = () => {
      window.clearTimeout(frame);
      frame = window.setTimeout(() => {
        if (matchMedia("(max-width: 760px)").matches) {
          fit = 1;
          root.style.removeProperty("--fit");
          spread.classList.remove("scaled");
          root.dataset.room = "";
          return;
        }
        const z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
        const cs = getComputedStyle(wrap);
        const padX = (parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)) * z;
        const padY = (parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)) * z;
        const w = wrap.getBoundingClientRect().width - padX;
        const h = window.innerHeight - padY;
        const r = spread.getBoundingClientRect();
        const scale = z * fit;
        const natW = r.width / scale;
        const natH = Math.max(720, (r.height / scale) * (1440 / Math.max(natW, 1)));
        const next = Math.max(1, Math.min(w / (1440 * z), h / (natH * z)));
        if (Math.abs(next - fit) > 0.01) {
          fit = next;
          if (fit > 1.01) {
            root.style.setProperty("--fit", fit.toFixed(3));
            spread.classList.add("scaled");
          } else {
            fit = 1;
            root.style.removeProperty("--fit");
            spread.classList.remove("scaled");
          }
        }
        // the keepsake book lies on the cloth only when there is room for it beside the spread
        const after = spread.getBoundingClientRect();
        const room = after.left - wrap.getBoundingClientRect().left;
        root.dataset.room = room >= 250 * z * fit ? "1" : "";
      }, 30);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(frame);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  const { pathname } = useLocation();
  // what the dog does when nothing is happening: asleep while a code is awaited, curious on a new account
  const rest: CompanionRest = pathname.startsWith("/verify") ? "sleep" : pathname.startsWith("/create-account") ? "curious" : "watch";
  const state: CompanionState = companion ?? { focus: null, shown: false };

  useLayoutEffect(() => {
    // in development the ticker is reachable from the console, so the ritual can be stepped through by hand
    if (import.meta.env.DEV) (window as unknown as { __gsap?: typeof gsap }).__gsap = gsap;
    const el = ground.current;
    if (!el || stage === "open") return;
    const board = el.querySelector<HTMLElement>(".board");
    const paths = gsap.utils.toArray<SVGPathElement>(el.querySelectorAll(".foil-title path"));
    const rule = el.querySelector<HTMLElement>(".board-rule");
    const spread = el.querySelector<HTMLElement>(".spread");
    if (!board || !spread) return;
    const prints = gsap.utils.toArray<HTMLElement>(spread.querySelectorAll(".print"));
    const how = spread.querySelector<HTMLElement>(".ep-how");
    const leafL = spread.querySelector<HTMLElement>(".leaf-l");
    const dog = spread.querySelector<HTMLElement>(".companion");
    const phone = matchMedia("(max-width: 760px)").matches;

    // the closed state, before the first paint: the prints and the dog wait, the pages lie under the board
    gsap.set([...prints, how, dog].filter(Boolean), { opacity: 0 });
    for (const p of paths) {
      const len = p.getTotalLength();
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, fillOpacity: 0 });
    }

    const tl = gsap.timeline({
      onComplete: () => {
        markSeen();
        setStage("open");
      },
    });
    let t0: number;
    if (phone) {
      tl.to(paths, { strokeDashoffset: 0, duration: 0.4, ease: MOVE }, 0)
        .to(paths, { fillOpacity: 1, duration: 0.2, ease: OUT }, 0.3)
        .to(board, { opacity: 0, duration: 0.3, ease: OUT }, 0.5);
      t0 = 0.55;
    } else {
      // the foil tools itself on, the rule draws, the cloth breathes under the lamp; then the board swings open on the spine
      tl.to(paths, { strokeDashoffset: 0, duration: 0.6, ease: MOVE, stagger: 0.01 }, 0)
        .to(paths, { fillOpacity: 1, duration: 0.35, ease: OUT, stagger: 0.006 }, 0.5)
        .fromTo(board, { "--breath": 0 }, { "--breath": 1, duration: 0.45, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0.05)
        .to(rule, { scaleX: 1, duration: 0.4, ease: OUT }, 0.55)
        .to(board, { rotateY: -180, duration: 0.9, ease: MOVE }, 0.9)
        .to(board, { opacity: 0, duration: 0.15 }, 1.75);
      t0 = 1.55;
    }
    // the left page is there once the board has passed the spine
    if (leafL) tl.set(leafL, { visibility: "visible" }, phone ? 0.5 : 1.35);
    // the prints settle onto the endpaper one after another, the line under them, and the dog looks up (2.4 s in all)
    tl.fromTo(prints, { y: -28, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: OUT, stagger: 0.08, clearProps: "scale,opacity" }, t0);
    if (how) tl.fromTo(how, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: OUT, clearProps: "all" }, t0 + 0.25);
    if (dog) tl.fromTo(dog, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: OUT, clearProps: "all" }, t0 + 0.2);
    // any press skips to the open book
    const skip = () => tl.progress(1);
    el.addEventListener("pointerdown", skip, { once: true });
    return () => {
      el.removeEventListener("pointerdown", skip);
      tl.kill();
    };
  }, [stage]);

  return (
    <div className="auth ritual on-dark" ref={ground} data-stage={stage} style={{ ["--bk-mark" as string]: MARK_MASK }}>
      <span className="lamp" aria-hidden="true" />
      <ClothStamp ground={ground} />
      <Leaf ground={ground} />
      <Link className="brand" to="/welcome" aria-label="A Story">
        <Lockup height={36} />
      </Link>

      <div className="spread-wrap" ref={wrapRef}>
        <div className="spread" ref={spreadRef}>
          <img className="keepsake" src="/book/keepsake-closed.webp" alt="" width="1200" height="1200" decoding="async" aria-hidden="true" />
          {/* the inside of the front board: the endpaper, three prints held by corners */}
          <section className="leaf-l endpaper" aria-label="Photographs">
            <span className="ep-pattern" aria-hidden="true" />
            <span className="ep-linen" aria-hidden="true" />
            <Prints active={stage === "open"} />
            <p className="ep-how">A question a day. Their words. A book that makes itself.</p>
          </section>

          {/* the title page, with the bookplate */}
          <section className="leaf-r titlepg">
            <span className="tp-gutter" aria-hidden="true" />
            <span className="tp-mark" aria-hidden="true" />
            <h2 className="promise-line">
              Every life holds a story <span className="keep">worth keeping.</span>
            </h2>
            <i className="tp-rule" aria-hidden="true" />
            <div className="plate-wrap">
              <Companion focus={state.focus} shown={state.shown} progress={state.progress} rest={rest} />
              {/* the engraved Ex Libris plate (public/book/bookplate.webp) is the frame; it carries "This book belongs to" */}
              <div className="plate">
                <main className="paper">{children}</main>
              </div>
            </div>
            <span className="tp-folio" aria-hidden="true">
              i
            </span>
          </section>

          {stage === "closed" && (
            <div className="board" aria-hidden="true">
              <div className="board-face board-front">
                <Lockup className="foil-title" height={120} />
                <i className="board-rule" />
              </div>
              <div className="board-face board-back">
                <span className="ep-pattern" aria-hidden="true" />
                <span className="ep-linen" aria-hidden="true" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
