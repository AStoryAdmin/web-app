/**
 * The family dog, chin on the top edge of the sign-in page. Drawn here in
 * flat, rounded shapes in the brand's browns and cream, a brass tag on the
 * collar: a soft toy from a picture book, not a cartoon. It is two drawings
 * in one box: the head behind the paper's edge, the paws in front of it.
 *
 * It watches the pointer (the eyes follow, with a little lag), tilts its
 * head toward the field being typed in, brings its paws up over its eyes
 * when the password is being typed, lifts one to peek when "Show" is
 * pressed, and puts them down when focus leaves. It blinks every few
 * seconds. On touch and under reduced motion it is a still dog with one
 * blink: the paws still answer the password field, but nothing follows.
 *
 * Every part is posed by a small object GSAP tweens, written to the SVG
 * transform attribute with an explicit pivot (rotate(a cx cy)), so the
 * pivots are the drawing's own and never depend on a measured box.
 *
 * This is the fallback drawing: the founder's own puppy (public/dog/
 * source.png, when it arrives) replaces it.
 */
import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export type CompanionFocus = "email" | "password" | "other" | null;
export type CompanionState = {
  /** Which field has focus, if any. */
  focus: CompanionFocus;
  /** Whether the password is shown in clear. */
  shown: boolean;
  /** How far along the line the typing is, 0..1 (the eyes track it). */
  progress?: number;
};

const HEAD = "#9E7152";
const EAR = "#4A3327";
const CREAM = "#F3EBDD";
const INK = "#2A2320";
const BRASS = "#EFC75E";

type Part = "head" | "earL" | "earR" | "eyes" | "pawL" | "pawR" | "tag";
type Pose = { x: number; y: number; r: number };
/** Where each part turns from, in the drawing's own coordinates. */
const PIVOT: Record<Part, [number, number]> = {
  head: [120, 136],
  earL: [90, 50],
  earR: [150, 50],
  eyes: [120, 84],
  pawL: [86, 140],
  pawR: [154, 140],
  tag: [120, 128],
};
const LID_TOP = 70.5;

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const pointer = () => matchMedia("(hover: hover)").matches;

export default function Companion({ focus, shown, progress = 0 }: CompanionState) {
  const head = useRef<SVGGElement>(null);
  const earL = useRef<SVGGElement>(null);
  const earR = useRef<SVGGElement>(null);
  const eyes = useRef<SVGGElement>(null);
  const pawL = useRef<SVGGElement>(null);
  const pawR = useRef<SVGGElement>(null);
  const tag = useRef<SVGGElement>(null);
  const lids = useRef<SVGGElement>(null);
  const refs = { head, earL, earR, eyes, pawL, pawR, tag };
  const pose = useRef<Record<Part, Pose> & { lid: { s: number } }>({
    head: { x: 0, y: 0, r: 0 },
    earL: { x: 0, y: 0, r: 0 },
    earR: { x: 0, y: 0, r: 0 },
    eyes: { x: 0, y: 0, r: 0 },
    pawL: { x: 0, y: 0, r: 0 },
    pawR: { x: 0, y: 0, r: 0 },
    tag: { x: 0, y: 0, r: 0 },
    lid: { s: 0 },
  });
  const mood = focus === "password" ? (shown ? "peek" : "cover") : "watch";
  const latest = useRef({ mood, focus, progress });
  useEffect(() => {
    latest.current = { mood, focus, progress };
  });

  const write = (part: Part) => {
    const el = refs[part].current;
    const p = pose.current[part];
    const [cx, cy] = PIVOT[part];
    el?.setAttribute("transform", `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${p.r.toFixed(2)} ${cx} ${cy})`);
  };
  const writeLids = () => {
    lids.current?.setAttribute("transform", `translate(0 ${LID_TOP}) scale(1 ${pose.current.lid.s.toFixed(3)}) translate(0 ${-LID_TOP})`);
  };
  const to = (part: Part, vars: Partial<Pose>, duration: number, ease: string, delay = 0) =>
    gsap.to(pose.current[part], { ...vars, duration, ease, delay, overwrite: "auto", onUpdate: () => write(part) });

  // The eyes closed at first paint, so the first blink opens them.
  useLayoutEffect(() => {
    writeLids();
  }, []);

  // The eyes: follow the pointer while resting, look down at the line while it is being typed.
  useEffect(() => {
    const still = reduced();
    const look = pose.current.eyes;
    const vars = { duration: still ? 0 : 0.45, ease: "power3.out", onUpdate: () => write("eyes") };
    const toX = gsap.quickTo(look, "x", vars);
    const toY = gsap.quickTo(look, "y", vars);
    if (mood !== "watch") {
      toX(0);
      toY(1);
      return;
    }
    if (focus) {
      // the line being written runs left to right below the dog
      toX(gsap.utils.clamp(-5, 5, -5 + progress * 10));
      toY(4);
      return;
    }
    if (still || !pointer()) {
      toX(0);
      toY(0);
      return;
    }
    const move = (ev: PointerEvent) => {
      const el = eyes.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = (ev.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2);
      const dy = (ev.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2);
      toX(gsap.utils.clamp(-5, 5, dx * 7));
      toY(gsap.utils.clamp(-3, 4, dy * 5));
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood, focus, progress]);

  // The head and the paws answer the field: a tilt toward the line, paws up for the password.
  useEffect(() => {
    const still = reduced();
    const d = (n: number) => (still ? 0 : n);
    if (mood === "cover") {
      to("head", { r: 0, y: 3 }, d(0.4), "power3.out");
      to("pawL", { x: 10, y: -58, r: -16 }, d(0.5), "back.out(1.7)");
      to("pawR", { x: -10, y: -58, r: 16 }, d(0.5), "back.out(1.7)", d(0.04));
      to("tag", { y: 2 }, d(0.4), "power3.out");
    } else if (mood === "peek") {
      to("head", { r: 3, y: 2 }, d(0.4), "power3.out");
      to("pawL", { x: 10, y: -58, r: -16 }, d(0.5), "back.out(1.7)");
      to("pawR", { x: -2, y: -34, r: 34 }, d(0.5), "back.out(1.5)");
      to("tag", { y: 2 }, d(0.4), "power3.out");
    } else {
      const tilt = focus === "email" ? -4 : focus === "other" ? 3 : 0;
      to("head", { r: tilt, y: focus ? 2 : 0 }, d(0.5), "power3.out");
      to("pawL", { x: 0, y: 0, r: 0 }, d(0.55), "back.out(1.3)");
      to("pawR", { x: 0, y: 0, r: 0 }, d(0.55), "back.out(1.3)");
      to("tag", { y: 0 }, d(0.4), "power3.out");
    }
    // the ears swing a little with every change of mind and settle
    if (!still) {
      pose.current.earL.r = -4;
      pose.current.earR.r = 4;
      to("earL", { r: 0 }, 1.1, "elastic.out(1, 0.45)");
      to("earR", { r: 0 }, 1.1, "elastic.out(1, 0.45)");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood, focus]);

  // The blink: one on arrival, then every four to seven seconds while watching.
  useEffect(() => {
    const still = reduced();
    const lid = pose.current.lid;
    let timer = 0;
    const blink = (twice = false) => {
      const tl = gsap.timeline({ onUpdate: writeLids });
      tl.to(lid, { s: 1, duration: 0.07, ease: "power2.in" }).to(lid, { s: 0, duration: 0.14, ease: "power2.out" });
      if (twice) tl.to(lid, { s: 1, duration: 0.07, ease: "power2.in" }, "+=0.1").to(lid, { s: 0, duration: 0.14, ease: "power2.out" });
    };
    const next = () => {
      timer = window.setTimeout(() => {
        if (latest.current.mood === "watch") blink(Math.random() < 0.18);
        next();
      }, gsap.utils.random(4000, 7000));
    };
    const first = window.setTimeout(() => blink(), 900);
    if (!still) next();
    return () => {
      clearTimeout(first);
      clearTimeout(timer);
      gsap.killTweensOf(lid);
      lid.s = 0;
      writeLids();
    };
  }, []);

  return (
    <div className="companion" data-mood={mood} aria-hidden="true">
      {/* the head, behind the paper's top edge */}
      <svg className="companion-head" viewBox="0 0 240 160" focusable="false">
        <g ref={head}>
          <ellipse cx="120" cy="90" rx="58" ry="52" fill={HEAD} />
          <g ref={earL}>
            <path d="M90 48 C68 48 54 76 55 110 C56 134 64 148 77 144 C89 140 95 120 93 98 C92 78 96 58 90 48 Z" fill={EAR} />
          </g>
          <g ref={earR}>
            <path d="M150 48 C172 48 186 76 185 110 C184 134 176 148 163 144 C151 140 145 120 147 98 C148 78 144 58 150 48 Z" fill={EAR} />
          </g>
          <ellipse cx="120" cy="116" rx="34" ry="26" fill={CREAM} />
          <g ref={eyes}>
            <circle cx="94" cy="84" r="11" fill={INK} />
            <circle cx="146" cy="84" r="11" fill={INK} />
            <circle cx="89.5" cy="79.5" r="3.6" fill="#FFFFFF" />
            <circle cx="141.5" cy="79.5" r="3.6" fill="#FFFFFF" />
            <circle cx="98" cy="89" r="1.6" fill="#FFFFFF" opacity="0.7" />
            <circle cx="150" cy="89" r="1.6" fill="#FFFFFF" opacity="0.7" />
          </g>
          <g ref={lids}>
            <circle cx="94" cy="84" r="13.5" fill={HEAD} />
            <circle cx="146" cy="84" r="13.5" fill={HEAD} />
          </g>
          <ellipse cx="120" cy="108" rx="10.5" ry="8.5" fill={EAR} />
          <circle cx="116.5" cy="105" r="2.4" fill="#FFFFFF" opacity="0.4" />
          <path d="M120 116 L120 122" stroke={EAR} strokeWidth="2" strokeLinecap="round" opacity="0.3" />
        </g>
      </svg>
      {/* the paws and the tag, over the paper's edge */}
      <svg className="companion-paws" viewBox="0 0 240 160" focusable="false">
        <ellipse cx="86" cy="150" rx="22" ry="5" fill="rgba(42,35,32,0.10)" />
        <ellipse cx="154" cy="150" rx="22" ry="5" fill="rgba(42,35,32,0.10)" />
        <g ref={tag}>
          <rect x="116" y="124" width="8" height="16" rx="3" fill={EAR} />
          <circle cx="120" cy="143" r="7.5" fill={BRASS} />
          <circle cx="120" cy="139.5" r="1.4" fill={EAR} opacity="0.5" />
        </g>
        <g ref={pawL}>
          <path d="M68 154 L68 136 C68 124 76 118 81 125 C83 117 91 117 93 125 C98 118 106 124 106 136 L106 154 Z" fill={HEAD} />
          <path d="M80 126 L80 133 M93 126 L93 133" stroke={CREAM} strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
        </g>
        <g ref={pawR}>
          <path d="M134 154 L134 136 C134 124 142 118 147 125 C149 117 157 117 159 125 C164 118 172 124 172 136 L172 154 Z" fill={HEAD} />
          <path d="M147 126 L147 133 M160 126 L160 133" stroke={CREAM} strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
        </g>
      </svg>
    </div>
  );
}
