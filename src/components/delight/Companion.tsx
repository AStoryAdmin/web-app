/**
 * The family dog, the founder's own watercolour puppy, chin on the top edge
 * of the bookplate (public/dog/*.png: five states cut from one sheet,
 * trimmed to the paws' bottom edge). The states cross-fade on one box,
 * anchored at the bottom so the paws stay on the plate's border. At rest it
 * watches (sign in), looks up curious (create account) or sleeps (verify).
 * While it watches, a small catchlight sits in each eye and follows the
 * pointer, a pixel or two either way, so the gaze moves without the eyes
 * ever being washed over (they are dots of light, never discs over the
 * pupil); the offsets are in the dog's own coordinates, so they scale with
 * it under the page zoom and the book's fit; the head tilts a few
 * degrees toward the field being typed in; paper-coloured lids blink every
 * four to seven seconds. Password: it covers its eyes. "Show": it peeks.
 * Focus leaves: it rests again. On touch and under reduced motion it is a
 * still dog with one blink; the states still answer the password field.
 */
import { useEffect, useRef } from "react";
import gsap from "gsap";

export type CompanionFocus = "email" | "password" | "other" | null;
export type CompanionRest = "watch" | "curious" | "sleep";
export type CompanionState = {
  /** Which field has focus, if any. */
  focus: CompanionFocus;
  /** Whether the password is shown in clear. */
  shown: boolean;
  /** How far along the line the typing is, 0..1 (the gaze tracks it). */
  progress?: number;
  /** What it does when nothing is happening. */
  rest?: CompanionRest;
};

type Eye = { x: number; y: number };
/** The eyes in each state's image, measured as the two darkest blobs of the face (fractions of the image). */
const EYES: Partial<Record<string, { left: Eye; right: Eye }>> = {
  watch: { left: { x: 0.482, y: 0.53 }, right: { x: 0.683, y: 0.557 } },
  curious: { left: { x: 0.466, y: 0.521 }, right: { x: 0.633, y: 0.537 } },
};
/** Each image's width for a 640 height; the box keeps watch.png's shape and the others overflow it, centred. */
const STATES = [
  { name: "watch", w: 755 },
  { name: "cover", w: 849 },
  { name: "peek", w: 790 },
  { name: "curious", w: 762 },
  { name: "sleep", w: 762 },
] as const;

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const pointer = () => matchMedia("(hover: hover)").matches;

export default function Companion({ focus, shown, progress = 0, rest = "watch" }: CompanionState) {
  const head = useRef<HTMLDivElement>(null);
  const glints = useRef<HTMLDivElement>(null);
  const lids = useRef<HTMLDivElement>(null);
  const mood = focus === "password" ? (shown ? "peek" : "cover") : rest;
  const awake = mood === "watch" || mood === "curious";
  const latest = useRef(mood);
  useEffect(() => {
    latest.current = mood;
  });

  // The gaze: the highlight dots follow the pointer while resting, look down the line while it is typed.
  useEffect(() => {
    const g = glints.current;
    if (!g || !awake) return;
    const still = reduced();
    const toX = gsap.quickTo(g, "x", { duration: still ? 0 : 0.5, ease: "power3.out" });
    const toY = gsap.quickTo(g, "y", { duration: still ? 0 : 0.5, ease: "power3.out" });
    if (focus) {
      toX(gsap.utils.clamp(-1.6, 1.6, -1.6 + progress * 3.2));
      toY(1.2);
      return;
    }
    if (still || !pointer()) {
      toX(0);
      toY(0);
      return;
    }
    const move = (ev: PointerEvent) => {
      const r = g.getBoundingClientRect();
      const dx = (ev.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2);
      const dy = (ev.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2);
      toX(gsap.utils.clamp(-1.6, 1.6, dx * 2.4));
      toY(gsap.utils.clamp(-1.2, 1.4, dy * 2));
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [awake, focus, progress]);

  // The head: a few degrees toward the line being typed, otherwise a little toward the pointer.
  useEffect(() => {
    const h = head.current;
    if (!h) return;
    const still = reduced();
    const toR = gsap.quickTo(h, "rotation", { duration: still ? 0 : 0.6, ease: "power3.out" });
    const toY = gsap.quickTo(h, "y", { duration: still ? 0 : 0.6, ease: "power3.out" });
    if (!awake) {
      toR(mood === "peek" ? 2 : 0);
      toY(mood === "sleep" ? 0 : 2);
      return;
    }
    if (focus) {
      toR(focus === "email" ? -4 : focus === "other" ? 3 : -2);
      toY(2);
      return;
    }
    toY(0);
    if (still || !pointer()) {
      toR(0);
      return;
    }
    const move = (ev: PointerEvent) => {
      const r = h.getBoundingClientRect();
      const dx = (ev.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2);
      toR(gsap.utils.clamp(-4, 4, dx * 5));
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [awake, mood, focus]);

  // The blink: one on arrival, then every four to seven seconds while awake.
  useEffect(() => {
    const el = lids.current;
    if (!el) return;
    const still = reduced();
    const ovals = el.querySelectorAll(".lid");
    gsap.set(ovals, { scaleY: 0, transformOrigin: "50% 10%" });
    let timer = 0;
    const blink = (twice = false) => {
      const tl = gsap.timeline();
      tl.to(ovals, { scaleY: 1, duration: 0.07, ease: "power2.in" }).to(ovals, { scaleY: 0, duration: 0.14, ease: "power2.out" });
      if (twice) tl.to(ovals, { scaleY: 1, duration: 0.07, ease: "power2.in" }, "+=0.1").to(ovals, { scaleY: 0, duration: 0.14, ease: "power2.out" });
    };
    const next = () => {
      timer = window.setTimeout(() => {
        if (latest.current === "watch" || latest.current === "curious") blink(Math.random() < 0.18);
        next();
      }, gsap.utils.random(4000, 7000));
    };
    const first = window.setTimeout(() => blink(), 900);
    if (!still) next();
    return () => {
      clearTimeout(first);
      clearTimeout(timer);
      gsap.killTweensOf(ovals);
      gsap.set(ovals, { scaleY: 0 });
    };
  }, []);

  const eyes = EYES[mood] ?? EYES.watch!;
  const at = (e: Eye) => ({ left: `${e.x * 100}%`, top: `${e.y * 100}%` });
  return (
    <div className="companion" data-mood={mood} data-awake={awake || undefined} aria-hidden="true">
      <div className="head" ref={head}>
        {STATES.map((s) => (
          <img key={s.name} className={`state ${s.name}`} src={`/dog/${s.name}.png`} alt="" width={s.w} height={640} decoding="async" />
        ))}
        <div className="glints" ref={glints}>
          <span className="glint" style={at(eyes.left)} />
          <span className="glint" style={at(eyes.right)} />
        </div>
        <div className="lids" ref={lids}>
          <span className="lid" style={at(eyes.left)} />
          <span className="lid" style={at(eyes.right)} />
        </div>
      </div>
    </div>
  );
}
