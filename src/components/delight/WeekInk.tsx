/**
 * Today's dot on the week strip. When a memory has been kept since the
 * strip was last seen (the count is remembered per day for the session),
 * the dot takes the ink: a soft pool spreads over the day and dries into
 * the dot, the way ink takes to paper. Otherwise it is simply the dot.
 * Nothing moves under reduced motion.
 */
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { OUT } from "../../lib/ease";

const KEY = "astory-ink";

function remembered(day: string): number | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    const v = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    return typeof v[day] === "number" ? v[day] : null;
  } catch {
    return null;
  }
}
function remember(day: string, count: number) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ [day]: count }));
  } catch {
    // the strip still works without it
  }
}

export default function WeekInk({ day, count }: { day: string; count: number }) {
  const dot = useRef<HTMLElement>(null);
  const pool = useRef<HTMLElement>(null);
  // what the strip last showed, read once per mount (so React's development double effect sees the same answer twice)
  const was = useRef<number | null | undefined>(undefined);

  useLayoutEffect(() => {
    // in development the ticker is reachable from the console (see AuthFrame), so the bloom can be stepped by hand
    if (import.meta.env.DEV) (window as unknown as { __gsap?: typeof gsap }).__gsap = gsap;
    if (was.current === undefined) was.current = remembered(day);
    remember(day, count);
    const d = dot.current;
    const p = pool.current;
    if (!d || !p || was.current == null || count <= was.current) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const host = d.parentElement;
    host?.classList.add("inking");
    const tl = gsap.timeline({ onComplete: () => host?.classList.remove("inking") });
    tl.fromTo(p, { scale: 0.5, opacity: 0.55 }, { scale: 1, opacity: 0, duration: 0.8, ease: OUT }, 0.1).fromTo(
      d,
      { scale: 0.95, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.45, ease: OUT, clearProps: "all" },
      0.18,
    );
    return () => {
      tl.kill();
      host?.classList.remove("inking");
    };
  }, [day, count]);

  if (!count) return null;
  return (
    <>
      <i ref={pool} className="ink bloom pool" aria-hidden="true" />
      <i ref={dot} className="ink" aria-hidden="true" />
    </>
  );
}
