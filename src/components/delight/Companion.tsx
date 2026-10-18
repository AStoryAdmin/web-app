/**
 * Bond, the family dog (docs/mascot/BOND.md), behind the top edge of the
 * bookplate. One picture per pose, cross-faded on one box: at rest he
 * watches (sign in), looks up curious (create account, join) or sleeps
 * (verify); on the password he covers his eyes, and on "Show" he peeks.
 * His head tilts a few degrees toward the field being typed in, and
 * otherwise a little toward the pointer; the drawing's own painted
 * catchlights are his eyes' light, so nothing is laid over them. He blinks
 * only where a pose has a drawn closed-eye frame (`blink` in ART), as a
 * 120 ms cross-fade; none is supplied yet, so today he does not blink. On
 * touch and under reduced motion he holds still and the poses still answer
 * the password field.
 *
 * Everything that depends on the drawing is in ART, measured from the art:
 * each picture's size, and a per-pose `scale` and `dx` that hold his face at
 * one size and in one place across poses (normalised by the nose's width
 * and its centre, against watch), and `sink`, how far a sitting pose goes
 * down behind the plate (its chest), so that lying poses keep their paws on
 * the plate's rule. A second set of drawings needs only new numbers here.
 */
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { OUT } from "../../lib/ease";

export type CompanionFocus = "email" | "password" | "other" | null;
export type CompanionRest = "watch" | "curious" | "sleep";
export type CompanionState = {
  /** Which field has focus, if any. */
  focus: CompanionFocus;
  /** Whether the password is shown in clear. */
  shown: boolean;
  /** How far along the line the typing is, 0..1 (kept for the callers; the head does not track it). */
  progress?: number;
  /** What it does when nothing is happening. */
  rest?: CompanionRest;
};

type Pose = {
  name: "watch" | "cover" | "peek" | "curious" | "sleep";
  /** the picture's size at the set's one scale (watch is 640 tall) */
  w: number;
  h: number;
  /** drawn at this multiple of that scale, so the face keeps watch's size (watch's nose width / this pose's) */
  scale: number;
  /** moved this share of the box's width, so the nose lands where watch's does */
  dx: number;
  /** lowered this share of the box's height behind the plate (a sitting pose's chest); 0 = the paws on the rule */
  sink: number;
  /** an optional closed-eye frame of the same pose, for a blink; none yet */
  blink?: string;
};

/**
 * Measured from public/dog/*.webp (nose blobs: watch 106 px wide centred at 543, 424; cover 91 at 410, 450; peek
 * 82 at 336, 392; curious 92 at 327, 422; sleep 117 at 466, 497). dx = (watch's nose x − 0.5) − (nose x − 0.5) ×
 * w × scale / 802; sink for a sitting pose = (1 − nose y) × h × scale / 640 − watch's 0.3375. Peek keeps its resting
 * paw on the rule (sink 0), so its head rises a little; the plate leaves room for it (signed-out.css --dogroom).
 */
const POSES: Pose[] = [
  { name: "watch", w: 802, h: 640, scale: 1, dx: 0, sink: 0 },
  { name: "cover", w: 738, h: 710, scale: 1.165, dx: 0.118, sink: 0.137 },
  { name: "peek", w: 689, h: 734, scale: 1.293, dx: 0.191, sink: 0 },
  { name: "curious", w: 765, h: 949, scale: 1.152, dx: 0.257, sink: 0.611 },
  { name: "sleep", w: 781, h: 622, scale: 0.906, dx: 0.093, sink: 0 },
];
const BOX_H = 640;

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const pointer = () => matchMedia("(hover: hover) and (pointer: fine)").matches;
type To = (v: number) => void;

export default function Companion({ focus, shown, rest = "watch" }: CompanionState) {
  const box = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  // the two movers, made once for the dog's life (inside a context, so leaving reverts them whole)
  const to = useRef<{ hr: To; hy: To } | null>(null);
  const mood: Pose["name"] = focus === "password" ? (shown ? "peek" : "cover") : rest;
  const awake = mood === "watch" || mood === "curious";
  // the poses this page rests in load at once; the others follow when the page is idle, or the moment they are needed
  const [all, setAll] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const latest = useRef(mood);
  useEffect(() => {
    latest.current = mood;
  });

  useEffect(() => {
    const t = window.setTimeout(() => setAll(true), 1500);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const h = head.current;
    if (!h) return;
    const ctx = gsap.context(() => {
      const still = reduced();
      to.current = {
        hr: gsap.quickTo(h, "rotation", { duration: still ? 0 : 0.6, ease: OUT }),
        hy: gsap.quickTo(h, "y", { duration: still ? 0 : 0.6, ease: OUT }),
      };
    }, box);
    return () => {
      to.current = null;
      ctx.revert();
    };
  }, []);

  // The head: a few degrees toward the line being typed, otherwise a little toward the pointer.
  useEffect(() => {
    const m = to.current;
    if (!m) return;
    if (!awake) {
      m.hr(mood === "peek" ? 2 : 0);
      m.hy(0);
      return;
    }
    if (focus) {
      m.hr(focus === "email" ? -4 : focus === "other" ? 3 : -2);
      m.hy(2);
      return;
    }
    m.hy(0);
    if (reduced() || !pointer()) {
      m.hr(0);
      return;
    }
    const h = head.current!;
    const move = (ev: PointerEvent) => {
      // clientX, the rect and innerWidth are all screen pixels, so the ratio holds at any zoom
      const r = h.getBoundingClientRect();
      m.hr(gsap.utils.clamp(-4, 4, ((ev.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)) * 5));
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [awake, mood, focus]);

  // The blink, only for a pose with a drawn closed-eye frame: every four to seven seconds, 120 ms each way.
  const canBlink = POSES.some((p) => p.blink);
  useEffect(() => {
    if (!canBlink || reduced()) return;
    let timer = 0;
    let open = 0;
    const next = () => {
      timer = window.setTimeout(() => {
        if (POSES.find((p) => p.name === latest.current)?.blink) {
          setBlinking(true);
          open = window.setTimeout(() => setBlinking(false), 160);
        }
        next();
      }, gsap.utils.random(4000, 7000));
    };
    next();
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(open);
    };
  }, [canBlink]);

  return (
    <div className="companion" ref={box} data-mood={mood} data-awake={awake || undefined} data-blinking={blinking || undefined} aria-hidden="true">
      <div className="head" ref={head}>
        {POSES.filter((p) => all || p.name === mood || p.name === rest).map((p) => {
          const style = { height: `${(p.h * p.scale * 100) / BOX_H}%`, bottom: `${-p.sink * 100}%`, left: `${50 + p.dx * 100}%` };
          return [
            <img
              key={p.name}
              className={`state ${p.name}`}
              src={`/dog/${p.name}.webp`}
              srcSet={`/dog/${p.name}-420.webp 420w, /dog/${p.name}.webp ${p.w}w`}
              sizes="(min-width: 2400px) 480px, 240px"
              alt=""
              width={p.w}
              height={p.h}
              decoding="async"
              fetchPriority={p.name === rest ? "high" : "low"}
              style={style}
            />,
            p.blink ? <img key={`${p.name}-blink`} className={`state-blink ${p.name}`} src={p.blink} alt="" decoding="async" style={style} /> : null,
          ];
        })}
      </div>
    </div>
  );
}
