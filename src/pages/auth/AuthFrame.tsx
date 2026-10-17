/**
 * The signed-out frame, as a ritual in the book's world rather than a form
 * on a wall. On arrival the viewport is the closed clothbound book: for a
 * second the foil title tools itself onto the chocolate cloth, a thin gold
 * rule draws under it and the cloth breathes once under the lamp. Then the
 * cover swings open on its hinge and the title page is there: cream paper
 * filling the viewport, the promise set as a title page sets it, the form
 * set into the page, family prints falling onto it one after another, and
 * the family dog with its chin on the page's top edge (delight/Companion),
 * watching the pointer, looking at the line being typed, covering its eyes
 * for the password. The cloth stays visible at the edges and the lamp
 * (Light) plays over it; pressing it leaves the binder's deboss (ClothStamp).
 *
 * The opening plays once per session (sessionStorage): sign in, create
 * account, verify and forgot-password share this frame and moving between
 * them does not replay it. Under reduced motion the page is simply open. On
 * a phone the cover is a half-second beat, then the page, in one column.
 */
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { Lockup } from "../../components/Brand";
import ClothStamp from "../../components/delight/ClothStamp";
import Companion, { type CompanionState } from "../../components/delight/Companion";
import Prints from "../../components/delight/Prints";
import { useLight } from "../../components/delight/Light";

const KEY = "astory-opened";

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
  const state: CompanionState = companion ?? { focus: null, shown: false };

  useLayoutEffect(() => {
    // in development the ticker is reachable from the console, so the ritual can be stepped through by hand
    if (import.meta.env.DEV) (window as unknown as { __gsap?: typeof gsap }).__gsap = gsap;
    const el = ground.current;
    if (!el || stage === "open") return;
    const cover = el.querySelector<HTMLElement>(".cover");
    const paths = gsap.utils.toArray<SVGPathElement>(el.querySelectorAll(".foil-title path"));
    const rule = el.querySelector<HTMLElement>(".cover-rule");
    const page = el.querySelector<HTMLElement>(".title-page");
    if (!cover || !page) return;
    const prints = gsap.utils.toArray<HTMLElement>(page.querySelectorAll(".print"));
    const promise = page.querySelector<HTMLElement>(".promise");
    const paper = page.querySelector<HTMLElement>(".paper");
    const dog = page.querySelector<HTMLElement>(".companion");
    const phone = matchMedia("(max-width: 760px)").matches;

    // the closed state, before the first paint
    gsap.set([promise, paper, dog].filter(Boolean), { opacity: 0 });
    gsap.set(prints, { opacity: 0 });
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
      // a beat of the cover, then the page
      tl.to(paths, { strokeDashoffset: 0, duration: 0.45, ease: "power2.inOut" }, 0)
        .to(paths, { fillOpacity: 1, duration: 0.25, ease: "power2.out" }, 0.3)
        .to(cover, { opacity: 0, duration: 0.5, ease: "power2.inOut" }, 0.55);
      t0 = 0.7;
    } else {
      // the foil tools itself on, the rule draws, the cloth breathes under the lamp, then the cover opens
      tl.to(paths, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", stagger: 0.015 }, 0)
        .to(paths, { fillOpacity: 1, duration: 0.5, ease: "power2.out", stagger: 0.01 }, 0.7)
        .fromTo(cover, { "--breath": 0 }, { "--breath": 1, duration: 0.65, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0.1)
        .to(rule, { scaleX: 1, duration: 0.5, ease: "power3.out" }, 0.8)
        .to(cover, { rotateY: -150, duration: 1.1, ease: "power3.inOut" }, 1.25)
        .to(cover, { opacity: 0, duration: 0.2 }, 2.2);
      t0 = 1.8;
    }
    // the prints fall onto the page one after another, the title and the form settle, the dog looks up
    tl.fromTo(prints, { y: -70, opacity: 0, scale: 1.06, rotation: 7 }, { y: 0, opacity: 1, scale: 1, rotation: 0, duration: 0.7, ease: "power3.out", stagger: 0.07, clearProps: "scale,rotation,opacity" }, t0);
    if (promise) tl.fromTo(promise, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", clearProps: "all" }, t0 + 0.2);
    if (paper) tl.fromTo(paper, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", clearProps: "all" }, t0 + 0.4);
    if (dog) tl.fromTo(dog, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", clearProps: "all" }, t0 + 0.6);
    return () => {
      tl.kill();
    };
  }, [stage]);

  return (
    <div className="auth ritual on-dark" ref={ground} data-stage={stage}>
      <span className="lamp" aria-hidden="true" />
      <ClothStamp ground={ground} />
      <Link className="brand" to="/welcome" aria-label="A Story">
        <Lockup height={36} />
      </Link>

      <div className="title-page">
        <Prints active={stage === "open"} />
        <div className="promise">
          <h2 className="promise-line">
            Every life holds a story <span className="keep">worth keeping.</span>
          </h2>
          <p className="promise-how">A question a day. Their words. A book that makes itself.</p>
        </div>
        <Companion focus={state.focus} shown={state.shown} progress={state.progress} />
        <div className="sheet-wrap">
          <main className="paper">{children}</main>
        </div>
      </div>

      {stage === "closed" && (
        <div className="cover" aria-hidden="true">
          <div className="cover-face cover-front">
            <Lockup className="foil-title" height={120} />
            <i className="cover-rule" />
          </div>
          <div className="cover-face cover-back" />
        </div>
      )}
    </div>
  );
}
