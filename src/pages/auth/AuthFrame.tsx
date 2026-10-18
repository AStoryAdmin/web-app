/**
 * The signed-out frame: the family book, open on the cloth. Two square
 * pages side by side, drawn at 1440 by 720 and scaled to fill the window,
 * up or down, so the whole spread is on one screen and the page never
 * scrolls on a desktop. The left page is the inside of the front board:
 * the endpaper with the mark repeated, and an album of prints held by
 * photo corners (delight/Prints), or whatever the page puts there (the
 * invitation card on /join, the person on /c). The right page is the
 * title page: the promise in Cormorant, a gold rule, and the page's form
 * pasted on as an Ex Libris bookplate, with the family dog lying over the
 * plate's top-left corner, its paws on the printed rule (delight/Companion).
 * A page that is not a form (/c) takes the whole right page instead.
 * On a phone the pages stack, title page first, and scroll.
 *
 * Between the sign-in pages the book holds still and only the plate
 * changes (a View Transition: the spread is one named layer, the plate
 * another). The scale is remembered across pages and applied before the
 * first paint, so nothing jumps.
 *
 * Arrival, once per session (sessionStorage): the book lies closed, the
 * front board over the right page; the foil title tools itself on, a gold
 * rule draws, the cloth breathes under the lamp; then the board swings
 * open on the spine (0.9 s) and lands as the left page, the prints settle
 * onto it, the dog looks up: 2.5 s in all, and any press, key or focus skips
 * to the end.
 * Under reduced motion the book is simply open. Stacked (a phone, a tablet)
 * the closed cover lies over the whole title page: the title tools on and
 * leaves, then the cover fades, in about a second.
 */
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import gsap from "gsap";
import { Lockup } from "../../components/Brand";
import ClothStamp from "../../components/delight/ClothStamp";
import Companion, { type CompanionRest, type CompanionState, type PoseName } from "../../components/delight/Companion";
import Leaf from "../../components/delight/Leaf";
import Prints from "../../components/delight/Prints";
import { useLight } from "../../components/delight/Light";
import { MARK_MASK } from "../../components/book/markMask";
import { isStacked, markOpened, MOVE, OUT, seenOpening, useFit } from "./bookFit";

type Props = {
  /** The bookplate's content, or the whole right page's when `plate` is false. */
  children: ReactNode;
  /** What the dog should know: which field is focused, whether the password is shown. */
  companion?: CompanionState;
  /** What the dog does at rest; by default it follows the route (asleep on verify, curious on a new account). */
  rest?: CompanionRest;
  /** Bond's poses this page can show (the password poses only where there is a password field). */
  poses?: PoseName[];
  /** The endpaper's content instead of the album. */
  left?: ReactNode;
  /** The title page's line; the promise by default. */
  promise?: ReactNode;
  /** The page's own title on the title page, as its h1, instead of the promise (Create your account). */
  title?: ReactNode;
  /** The plate keeps its engraved "This book belongs to" (only where a name is written under it). */
  lettered?: boolean;
  /** False: no title line and no bookplate; the children take the right page (the contribute leaf). */
  plate?: boolean;
  /** What the left page is, for a screen reader. */
  leftLabel?: string;
};

export default function AuthFrame({ children, companion, rest: restProp, poses, left, promise, title, lettered = false, plate = true, leftLabel }: Props) {
  const ground = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<"closed" | "open">(() => {
    if (seenOpening()) return "open";
    // under reduced motion the book is simply open, and that counts as having seen it
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      markOpened();
      return "open";
    }
    return "closed";
  });
  useLight(ground);
  const wrapRef = useRef<HTMLDivElement>(null);
  const spreadRef = useRef<HTMLDivElement>(null);
  // every AuthFrame page is fitted to the same 1440 by 720, so the book never changes size between them
  useFit(ground, wrapRef, spreadRef, 1440, 720);

  const { pathname } = useLocation();
  // what the dog does when nothing is happening: asleep while a code is awaited, curious on a new account
  const rest: CompanionRest = restProp ?? (pathname.startsWith("/verify") ? "sleep" : pathname.startsWith("/create-account") || pathname.startsWith("/join") ? "curious" : "watch");
  const state: CompanionState = companion ?? { focus: null, shown: false };

  useLayoutEffect(() => {
    // in development the ticker is reachable from the console, so the ritual can be stepped through by hand
    if (import.meta.env.DEV) (window as unknown as { __gsap?: typeof gsap }).__gsap = gsap;
    const el = ground.current;
    if (!el || stage === "open") return;
    let skip = () => {};
    // everything the ritual sets lives in one context, so leaving (or StrictMode's second run) reverts it whole
    const ctx = gsap.context(() => {
      const board = el.querySelector<HTMLElement>(".board");
      const front = el.querySelector<HTMLElement>(".board-front");
      const back = el.querySelector<HTMLElement>(".board-back");
      const breath = el.querySelector<HTMLElement>(".board-breath");
      const paths = gsap.utils.toArray<SVGPathElement>(el.querySelectorAll(".foil-title path"));
      const rule = el.querySelector<HTMLElement>(".board-rule");
      const spread = el.querySelector<HTMLElement>(".spread");
      if (!board || !spread) return;
      const settle = gsap.utils.toArray<HTMLElement>(spread.querySelectorAll(".leaf-l .print, .leaf-l .ep-arrive"));
      const leafL = spread.querySelector<HTMLElement>(".leaf-l");
      const dog = spread.querySelector<HTMLElement>(".companion");
      const phone = isStacked();

      // the closed state, before the first paint: the prints and the dog wait, the pages lie under the board
      gsap.set([...settle, dog].filter(Boolean), { opacity: 0 });
      // the one authored moment: the foil title tools itself on, stroke by stroke (a stroke draw, not transform or
      // opacity, accepted for this once-per-session arrival)
      for (const p of paths) {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, fillOpacity: 0 });
      }

      const tl = gsap.timeline({
        onComplete: () => {
          markOpened();
          setStage("open");
        },
      });
      let t0: number;
      if (phone) {
        // stacked, the board lies over the whole title page (it is the book's cover, closed over the form); the title
        // tools on, then leaves first, so no foil is ever over the form; then the cover fades (never the 3D parent)
        const page = spread.querySelector<HTMLElement>(".leaf-r");
        if (page) gsap.set(board, { height: page.offsetHeight, bottom: "auto", aspectRatio: "auto" });
        const title = el.querySelector<HTMLElement>(".foil-title");
        tl.to(paths, { strokeDashoffset: 0, duration: 0.4, ease: MOVE }, 0)
          .to(paths, { fillOpacity: 1, duration: 0.2, ease: OUT }, 0.3);
        if (title) tl.to(title, { opacity: 0, duration: 0.15, ease: OUT }, 0.55);
        if (rule) tl.to(rule, { opacity: 0, duration: 0.15, ease: OUT }, 0.55);
        tl.to([front, back, el.querySelector(".board-edge")].filter(Boolean), { opacity: 0, duration: 0.3, ease: OUT }, 0.7).set(board, { visibility: "hidden" }, 1.0);
        t0 = 0.75;
      } else {
        // the foil tools itself on, the rule draws, the lamp breathes over the board; then the board swings open on the
        // spine and lies as the left page, whose back (the endpaper) then gives way to the page under it
        tl.to(paths, { strokeDashoffset: 0, duration: 0.6, ease: MOVE, stagger: 0.01 }, 0).to(paths, { fillOpacity: 1, duration: 0.35, ease: OUT, stagger: 0.006 }, 0.5);
        if (breath) tl.fromTo(breath, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: MOVE, yoyo: true, repeat: 1 }, 0.05);
        tl.to(rule, { scaleX: 1, duration: 0.4, ease: OUT }, 0.55).to(board, { rotateY: -180, duration: 0.9, ease: MOVE }, 0.9);
        const edge = el.querySelector<HTMLElement>(".board-edge");
        if (back) tl.to([back, edge].filter(Boolean), { opacity: 0, duration: 0.25, ease: OUT }, 1.75);
        tl.set(board, { visibility: "hidden" }, 2.0);
        t0 = 1.75;
      }
      // the left page is there once the board has passed the spine
      if (leafL) tl.set(leafL, { visibility: "visible" }, phone ? 0.7 : 1.35);
      // the prints settle onto the endpaper one after another, and the dog looks up (2.5 s in all)
      if (settle.length) tl.fromTo(settle, { y: -20, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: OUT, stagger: 0.08, clearProps: "scale,opacity,y" }, t0);
      if (dog) tl.fromTo(dog, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: OUT, clearProps: "all" }, phone ? 0.95 : 1.55);
      // any press skips to the open book
      skip = () => {
        tl.progress(1);
      };
    }, el);
    // any press, key or focus (a keyboard user tabbing in) skips to the open book
    const events = ["pointerdown", "keydown", "focusin"] as const;
    for (const ev of events) el.addEventListener(ev, skip, { once: true });
    window.addEventListener("keydown", skip, { once: true });
    return () => {
      for (const ev of events) el.removeEventListener(ev, skip);
      window.removeEventListener("keydown", skip);
      ctx.revert();
    };
  }, [stage]);

  return (
    <div className="auth ritual on-dark" ref={ground} data-stage={stage} style={{ ["--bk-mark" as string]: MARK_MASK }}>
      <span className="lamp" aria-hidden="true" />
      <ClothStamp ground={ground} />
      <Leaf ground={ground} />
      <Link className="brand" to="/welcome" aria-label="A Story, the front door" viewTransition>
        <Lockup height={36} />
      </Link>

      <div className="spread-wrap" ref={wrapRef}>
        <div className={`spread${isStacked() ? "" : " scaled"}`} ref={spreadRef}>
          {/* the inside of the front board: the endpaper, and what the page lays on it */}
          <section className="leaf-l endpaper" aria-label={leftLabel || "Photographs from a family’s book"}>
            <span className="ep-pattern" aria-hidden="true" />
            <span className="ep-linen" aria-hidden="true" />
            {left ?? (
              <>
                <Prints active={stage === "open"} />
                <div className="ep-how ep-arrive">
                  <p>One small question a day, answered in their own words, and the family’s book grows page by page.</p>
                  <p className="ep-note">Photographs from a sample family’s book.</p>
                </div>
              </>
            )}
          </section>

          {/* the title page, with the bookplate */}
          <section className={`leaf-r titlepg${plate ? "" : " leaf-only"}`}>
            <span className="tp-gutter" aria-hidden="true" />
            {plate ? (
              <>
                {title ? <h1 className="promise-line">{title}</h1> : <p className="promise-line">{promise ?? <>Every life holds a story <span className="keep">worth keeping.</span></>}</p>}
                <i className="tp-rule" aria-hidden="true" />
                <div className="plate-wrap">
                  <Companion focus={state.focus} shown={state.shown} progress={state.progress} rest={rest} poses={poses} />
                  {/* the engraved Ex Libris plate is the frame: blank (public/book/bookplate-blank.webp), or lettered "This book belongs to" over a name */}
                  <div className={`plate${lettered ? " lettered" : ""}`}>
                    <main className="paper">{children}</main>
                  </div>
                </div>
              </>
            ) : (
              <main className="leaf-body">{children}</main>
            )}
          </section>

          <i className="spread-band" aria-hidden="true" />
          <i className="spread-ribbon" aria-hidden="true" />

          {stage === "closed" && (
            <div className="board" aria-hidden="true">
              <i className="board-edge" />
              <div className="board-face board-front">
                <span className="board-breath" aria-hidden="true" />
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
