/**
 * The family dog, chin on the top edge of the bookplate (public/dog/*.png:
 * one image per state, trimmed to the ledge under its paws). The states
 * cross-fade on one box, anchored at the bottom so the paws stay on the
 * plate's border. At rest it watches (sign in), looks up curious (create
 * account, join) or sleeps (verify). While it watches, a small catchlight
 * sits in each eye and follows the pointer a pixel or two either way, so
 * the gaze moves without the eyes ever being washed over; the offsets are in
 * the dog's own coordinates, so they scale with it under the page zoom and
 * the book's fit. The head tilts a few degrees toward the field being typed
 * in; paper-coloured lids blink every four to seven seconds. Password: it
 * covers its eyes. "Show": it peeks. Focus leaves: it rests again. On touch
 * and under reduced motion it is a still dog with one blink; the states
 * still answer the password field.
 *
 * The art is about to change (docs/mascot/BOND.md: Bond replaces the
 * samoyed). Everything that depends on the drawing is in `ART` below: the
 * file widths and the eye positions. Re-measure the eyes there when the new
 * images land; the state names stay the same.
 */
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { OUT, MOVE } from "../../lib/ease";

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
type Art = { name: string; w: number; h: number; sink: number };
/**
 * The drawing, in one place (Bond, docs/mascot/BOND.md; public/dog/*.webp, all five at one scale, watch 640 tall).
 * `w` and `h` are each image's size at that scale; the box keeps watch's shape (802 / 640), and every state is drawn
 * at its own height against it (h / 640 of the box), bottom-anchored and centred, so his head keeps one size.
 * `sink` (a fraction of the box's height) lowers a sitting pose so its chest goes behind the plate and his head stays
 * where it was when he lay down: watch and sleep lie with the paws on the edge (0). `eyes` are the pupils' centres
 * as fractions of each image, for the states whose eyes are open; the catchlights and the lids sit there.
 */
const ART: { states: Art[]; eyes: Partial<Record<string, { left: Eye; right: Eye }>> } = {
  states: [
    { name: "watch", w: 802, h: 640, sink: 0 },
    { name: "cover", w: 738, h: 710, sink: 0.08 },
    { name: "peek", w: 689, h: 734, sink: 0.13 },
    { name: "curious", w: 765, h: 949, sink: 0.4 },
    { name: "sleep", w: 781, h: 622, sink: 0 },
  ],
  eyes: {
    watch: { left: { x: 0.449, y: 0.484 }, right: { x: 0.686, y: 0.38 } },
    curious: { left: { x: 0.468, y: 0.272 }, right: { x: 0.642, y: 0.408 } },
  },
};
const BOX_W = 802;
const BOX_H = 640;

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const pointer = () => matchMedia("(hover: hover) and (pointer: fine)").matches;
type To = (v: number) => void;

export default function Companion({ focus, shown, progress = 0, rest = "watch" }: CompanionState) {
  const head = useRef<HTMLDivElement>(null);
  const glints = useRef<HTMLDivElement>(null);
  const lids = useRef<HTMLDivElement>(null);
  // the four movers, made once for the dog's life and only called after (never rebuilt per keystroke)
  const to = useRef<{ gx: To; gy: To; hr: To; hy: To } | null>(null);
  const mood = focus === "password" ? (shown ? "peek" : "cover") : rest;
  const awake = mood === "watch" || mood === "curious";
  const latest = useRef(mood);
  useEffect(() => {
    latest.current = mood;
  });

  useEffect(() => {
    const g = glints.current;
    const h = head.current;
    if (!g || !h) return;
    const still = reduced();
    to.current = {
      gx: gsap.quickTo(g, "x", { duration: still ? 0 : 0.5, ease: OUT }),
      gy: gsap.quickTo(g, "y", { duration: still ? 0 : 0.5, ease: OUT }),
      hr: gsap.quickTo(h, "rotation", { duration: still ? 0 : 0.6, ease: OUT }),
      hy: gsap.quickTo(h, "y", { duration: still ? 0 : 0.6, ease: OUT }),
    };
    return () => {
      to.current = null;
      gsap.killTweensOf([g, h]);
      gsap.set([g, h], { clearProps: "transform" });
    };
  }, []);

  // The gaze and the head: toward the line being typed, otherwise a little toward the pointer.
  useEffect(() => {
    const m = to.current;
    if (!m) return;
    if (!awake) {
      m.gx(0);
      m.gy(0);
      m.hr(mood === "peek" ? 2 : 0);
      m.hy(mood === "sleep" ? 0 : 2);
      return;
    }
    if (focus) {
      m.gx(gsap.utils.clamp(-1.6, 1.6, -1.6 + progress * 3.2));
      m.gy(1.2);
      m.hr(focus === "email" ? -4 : focus === "other" ? 3 : -2);
      m.hy(2);
      return;
    }
    m.hy(0);
    if (reduced() || !pointer()) {
      m.gx(0);
      m.gy(0);
      m.hr(0);
      return;
    }
    const g = glints.current!;
    const move = (ev: PointerEvent) => {
      // clientX, the rect and innerWidth are all screen pixels, so the ratios hold at any zoom
      const r = g.getBoundingClientRect();
      const dx = (ev.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2);
      const dy = (ev.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2);
      m.gx(gsap.utils.clamp(-1.6, 1.6, dx * 2.4));
      m.gy(gsap.utils.clamp(-1.2, 1.4, dy * 2));
      m.hr(gsap.utils.clamp(-4, 4, dx * 5));
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [awake, mood, focus, progress]);

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
      tl.to(ovals, { scaleY: 1, duration: 0.08, ease: MOVE }).to(ovals, { scaleY: 0, duration: 0.14, ease: OUT });
      if (twice) tl.to(ovals, { scaleY: 1, duration: 0.08, ease: MOVE }, "+=0.1").to(ovals, { scaleY: 0, duration: 0.14, ease: OUT });
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

  const drawn = ART.states.find((a) => a.name === mood && ART.eyes[a.name]) ?? ART.states[0];
  const eyes = ART.eyes[drawn.name]!;
  // an eye's place in the box, from its place in its own image (drawn h / 640 of the box tall, centred, sunk)
  const at = (e: Eye) => ({
    left: `${50 + ((e.x - 0.5) * drawn.w * 100) / BOX_W}%`,
    top: `${100 + drawn.sink * 100 - ((1 - e.y) * drawn.h * 100) / BOX_H}%`,
  });
  return (
    <div className="companion" data-mood={mood} data-awake={awake || undefined} aria-hidden="true">
      <div className="head" ref={head}>
        {ART.states.map((s) => (
          <img
            key={s.name}
            className={`state ${s.name}`}
            src={`/dog/${s.name}.webp`}
            alt=""
            width={s.w}
            height={s.h}
            decoding="async"
            style={{ height: `${(s.h * 100) / BOX_H}%`, bottom: `${-s.sink * 100}%` }}
          />
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
