/**
 * Treasured: a small star on the memory page that marks a memory as one of
 * the ones that matter most (rating 5, the same column the phone app
 * reads). The card wears a "Treasured" chip, and the book can lead with
 * them later. One star, on or off; nothing to rate. Pressing it, the star
 * itself gives a little (a short ease-out, no bounce) and a few specks of
 * ink fly; the button stays put.
 */
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { OUT } from "../../lib/ease";
import { useAccount } from "../../state/accountContext";
import { TREASURED, isTreasured } from "../../lib/treasured";
import type { Memory, Story } from "../../data/stories";

export function StarIcon({ filled = false, ...p }: React.SVGProps<SVGSVGElement> & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8z" />
    </svg>
  );
}

export default function Treasure({ memory, story }: { memory: Memory; story: Story }) {
  const { saveMemory } = useAccount();
  const [busy, setBusy] = useState(false);
  const star = useRef<SVGSVGElement>(null);
  const ink = useRef<HTMLSpanElement>(null);
  const on = isTreasured(memory);
  // one GSAP context for this button: the press is added to it (context-safe), and it is reverted on unmount
  const ctx = useRef<gsap.Context | null>(null);
  useEffect(() => {
    ctx.current = gsap.context(() => {});
    return () => ctx.current?.revert();
  }, []);
  const press = () => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !star.current || !ctx.current) return;
    const el = star.current;
    const specks = !on && ink.current ? Array.from(ink.current.children) : [];
    ctx.current.add(() => {
      const tl = gsap.timeline();
      tl.fromTo(el, { scale: 1, transformOrigin: "50% 50%" }, { scale: 1.3, duration: 0.14, ease: OUT }).to(el, { scale: 1, duration: 0.32, ease: OUT, clearProps: "transform" });
      if (specks.length)
        tl.fromTo(specks, { x: 0, y: 0, scale: 0.5, opacity: 1 }, { x: () => gsap.utils.random(-18, 18), y: () => gsap.utils.random(-16, 16), scale: () => gsap.utils.random(0.6, 1.1), opacity: 0, duration: 0.6, ease: OUT, stagger: 0.015 }, 0.05);
    });
  };
  const flip = async () => {
    press();
    setBusy(true);
    try {
      await saveMemory({ ...memory, rating: on ? 0 : TREASURED }, story.id);
    } catch {
      /* the provider's saveFailure says so */
    } finally {
      setBusy(false);
    }
  };
  return (
    <button type="button" className={`mv-tool rd-treasure${on ? " on" : ""}`} onClick={flip} disabled={busy} aria-pressed={on} title={on ? "Not one of the treasured ones after all" : "Mark it as one of the treasured ones"}>
      <StarIcon filled={on} ref={star} />
      <span className="rd-treasure-ink" aria-hidden="true" ref={ink}>
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
      {on ? "Treasured" : "Treasure it"}
    </button>
  );
}
