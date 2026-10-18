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
  /** where his weight meets the plate, as a share of the box's width: the head tilts about this point on the rule */
  pivot: number;
  /** an optional closed-eye frame of the same pose, for a blink; none yet */
  blink?: string;
};
export type PoseName = Pose["name"];

/**
 * Measured from public/dog/*.webp (nose blobs: watch 106 px wide centred at 543, 424; cover 91 at 410, 450; peek
 * 82 at 336, 392; curious 92 at 327, 422; sleep 117 at 466, 497). scale = 106 / nose width (sleep keeps its own
 * height, see below). dx = (watch's nose x − 0.5) − (nose x − 0.5) × w × scale / 802. The nose stands at one height
 * above the rule in every pose of a page: watch's (640 − 424) / 640 − watch's sink; a pose's sink = its nose's height
 * above its own foot, (h − nose y) × scale / 640, minus that. So cover's chest, curious's chest and peek's resting paw
 * go down behind the plate. Watch is lowered a little (sink 0.008) so both paws (the art's lowest rows at x 360–630:
 * 637 and 634 of 640) sit on the rule. Sleep lives alone on Verify, chin on paws, paws on the rule (sink 0).
 * pivot = the middle of the paws (watch 360–630 of 802), or the chest where it meets the plate.
 */
const WATCH_SINK = 0.008;
const NOSE_ABOVE_RULE = (640 - 424) / 640 - WATCH_SINK;
const sinkFor = (h: number, noseY: number, scale: number) => +(((h - noseY) * scale) / 640 - NOSE_ABOVE_RULE).toFixed(4);
const POSES: Pose[] = [
  { name: "watch", w: 802, h: 640, scale: 1, dx: 0, sink: WATCH_SINK, pivot: 0.617 },
  { name: "cover", w: 738, h: 710, scale: 1.165, dx: 0.118, sink: sinkFor(710, 450, 1.165), pivot: 0.62 },
  { name: "peek", w: 689, h: 734, scale: 1.293, dx: 0.191, sink: sinkFor(734, 392, 1.293), pivot: 0.66 },
  { name: "curious", w: 765, h: 949, scale: 1.152, dx: 0.257, sink: sinkFor(949, 422, 1.152), pivot: 0.72 },
  { name: "sleep", w: 781, h: 622, scale: 0.906, dx: 0.093, sink: 0, pivot: 0.6 },
];
/** The head turns toward the pointer by this much at most, about the paws, so they never lift off the rule. */
const TILT = 1.5;
const BOX_H = 640;

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const pointer = () => matchMedia("(hover: hover) and (pointer: fine)").matches;
type To = (v: number) => void;

export default function Companion({ focus, shown, rest = "watch", poses }: CompanionState & { poses?: PoseName[] }) {
  const box = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  // the two movers, made once for the dog's life (inside a context, so leaving reverts them whole)
  const to = useRef<{ hr: To; hy: To } | null>(null);
  // the poses this page can show: its rest pose, and the two the password field asks for (the front door: watch only)
  const asked = poses ?? [rest, "cover", "peek"];
  const wanted: PoseName = focus === "password" ? (shown ? "peek" : "cover") : rest;
  // never switch to a pose whose picture has not arrived: hold the last one that has, until it has
  const [loaded, setLoaded] = useState<Set<PoseName>>(() => new Set());
  const [held, setHeld] = useState<PoseName>(rest);
  const mood: PoseName = loaded.has(wanted) ? wanted : loaded.has(held) ? held : wanted;
  if (mood !== held && loaded.has(mood)) setHeld(mood);
  // the pose being held stays mounted until the new one has arrived (a new rest pose never leaves a blank)
  const can: PoseName[] = asked.includes(held) ? asked : [...asked, held];
  const awake = mood === "watch" || mood === "curious";
  // the rest pose loads at once; the others start the moment it, or the pose being held, has decoded (so the held
  // pose is never filtered out while a new rest pose is on the wire)
  const more = loaded.has(rest) || loaded.has(held);
  const arrived = (name: PoseName) => setLoaded((had) => (had.has(name) ? had : new Set(had).add(name)));
  const [blinking, setBlinking] = useState(false);
  const latest = useRef(mood);
  useEffect(() => {
    latest.current = mood;
  });


  useEffect(() => {
    const h = head.current;
    if (!h) return;
    const ctx = gsap.context(() => {
      const still = reduced();
      to.current = {
        hr: gsap.quickTo(h, "rotation", { duration: still ? 0 : 0.6, ease: OUT, modifiers: { rotation: gsap.utils.clamp(-TILT, TILT) } }),
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
      m.hr(0);
      m.hy(0);
      return;
    }
    if (focus) {
      m.hr(focus === "email" ? -TILT : focus === "other" ? TILT : -TILT / 2);
      m.hy(0);
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
      m.hr(gsap.utils.clamp(-TILT, TILT, ((ev.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)) * 2));
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
    // data-mood only once that pose has arrived, so the first picture fades in (220 ms) instead of popping
    <div className="companion" ref={box} data-mood={loaded.has(mood) ? mood : undefined} data-awake={awake || undefined} data-blinking={blinking || undefined} aria-hidden="true">
      <div className="head" ref={head} style={{ transformOrigin: `${((POSES.find((p) => p.name === mood)?.pivot ?? 0.6) * 100).toFixed(1)}% 100%` }}>
        {/* one flat list keyed by pose, so a pose keeps its element (and its fade) as the list grows around it */}
        {POSES.filter((p) => can.includes(p.name) && (more || p.name === rest)).flatMap((p) => {
          const style = { height: `${(p.h * p.scale * 100) / BOX_H}%`, bottom: `${-p.sink * 100}%`, left: `${50 + p.dx * 100}%` };
          return [
            <img
              key={p.name}
              className={`state ${p.name}`}
              src={`/dog/${p.name}.webp`}
              srcSet={`/dog/${p.name}-420.webp 420w, /dog/${p.name}.webp ${p.w}w`}
              sizes="(max-width: 760.98px) 130px, 180px"
              alt=""
              width={p.w}
              height={p.h}
              decoding="async"
              fetchPriority={p.name === rest ? "high" : "low"}
              style={style}
              ref={(img) => {
                if (img?.complete && img.naturalWidth) arrived(p.name);
              }}
              onLoad={() => arrived(p.name)}
            />,
            p.blink ? <img key={`${p.name}-blink`} className={`state-blink ${p.name}`} src={p.blink} alt="" decoding="async" style={style} /> : null,
          ];
        })}
      </div>
    </div>
  );
}
