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
 * Everything that depends on the drawing is in POSES, measured from the art
 * (v2, 2026-10-18): each picture's size, cut at one shared scale (watch is
 * 640 tall, so the head is one size in every ledge pose without a per-pose
 * scale), a `dx` that puts the nose where watch's is, and `up`, how high the
 * nose stands above the pose's own foot. On a page every pose is lowered
 * behind the plate by its `up` less the lowest `up` among that page's poses,
 * so the nose keeps one height and no paw ever floats above the rule. A
 * second set of drawings needs only new numbers here.
 */
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { OUT } from "../../lib/ease";

export type CompanionFocus = "email" | "password" | "other" | null;
export type CompanionRest = "watch" | "curious" | "sleep" | "happy";
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
  name: "watch" | "cover" | "peek" | "curious" | "happy" | "sleep";
  /** the picture's size at the set's one scale (watch is 640 tall) */
  w: number;
  h: number;
  /** drawn at this multiple of that scale (1 for the ledge poses; sleep's head is drawn larger, so it comes down to watch's) */
  scale: number;
  /** moved this share of the box's width, so the nose lands where watch's does */
  dx: number;
  /** the nose's height above the pose's foot, as a share of the box's height; none for a pose that is always alone */
  up?: number;
  /** where his weight meets the plate, as a share of the box's width: the head tilts about this point on the rule */
  pivot: number;
  /** an optional closed-eye frame of the same pose, for a blink; none yet */
  blink?: string;
};
export type PoseName = Pose["name"];

/**
 * Measured from public/dog/*.webp (v2), in the files' own pixels. Noses (the dark, low-chroma blob): watch 56.4 wide
 * centred at 197.0, 253.2; cover 60.7 at 256.2, 277.9; peek 56.4 at 204.5, 290.8; curious 62.9 at 148.9, 267.0; happy
 * 75.2 at 135.9, 254.6 (his snout comes toward you, so the nose is drawn larger; the head is cut 0.9 of the set's scale
 * to keep its width); sleep 93.7 at 398.5, 430.3. The box is watch's shape, 562 by 640.
 * dx = (watch's nose x − this nose x + w / 2 − 281) / 562. up = (h − nose y) / 640. pivot = the middle of what rests on
 * the rule in the lowest 3% of the picture (watch's two paws 102–348, cover's chest, peek's resting paw, curious's and
 * happy's paws), in the box. Sleep lives alone on Verify, drawn at 0.602 so his nose is watch's width, paws on the rule.
 */
const POSES: Pose[] = [
  { name: "watch", w: 562, h: 640, scale: 1, dx: 0, up: 0.6043, pivot: 0.4 },
  { name: "cover", w: 621, h: 636, scale: 1, dx: -0.0527, up: 0.5596, pivot: 0.49 },
  { name: "peek", w: 588, h: 648, scale: 1, dx: 0.0099, up: 0.5582, pivot: 0.545 },
  { name: "curious", w: 488, h: 637, scale: 1, dx: 0.0198, up: 0.5781, pivot: 0.491 },
  { name: "happy", w: 520, h: 619, scale: 1, dx: 0.0713, up: 0.5694, pivot: 0.544 },
  { name: "sleep", w: 781, h: 622, scale: 0.602, dx: -0.158, pivot: 0.5 },
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
  // the lowest nose among this page's poses: every other pose goes down behind the plate to it (rule 27)
  const ups = POSES.filter((p) => asked.includes(p.name) && p.up !== undefined).map((p) => p.up!);
  const floor = ups.length ? Math.min(...ups) : 0;
  const awake = mood === "watch" || mood === "curious" || mood === "happy";
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
          const sink = p.up === undefined ? 0 : p.up - floor;
          const style = { height: `${(p.h * p.scale * 100) / BOX_H}%`, bottom: `${-sink * 100}%`, left: `${50 + p.dx * 100}%` };
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
