/**
 * Press the cloth and the A-mark is blind-stamped into it where you
 * pressed, the way a binder's brass die leaves its mark; it fades as the
 * cloth springs back. Pointer-downs on anything you can actually use (the
 * sheet, links, buttons) are left alone.
 */
import { useEffect, useState, type RefObject } from "react";
import { MARK_SVG } from "../brandArt";
import { pageZoom } from "../../lib/zoom";

type Stamp = { id: number; x: number; y: number; rot: number };
let seq = 0;

export default function ClothStamp({ ground }: { ground: RefObject<HTMLElement | null> }) {
  const [stamps, setStamps] = useState<Stamp[]>([]);
  useEffect(() => {
    const el = ground.current;
    if (!el) return;
    const press = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const t = e.target as HTMLElement;
      // only the cloth takes the stamp: the book, the leaf and anything you can use are left alone
      if (t.closest(".spread, .door-leaf, .door-book, .paper, .print, a, button, input, label, textarea")) return;
      const r = el.getBoundingClientRect();
      const z = pageZoom();
      const s = { id: ++seq, x: (e.clientX - r.left) / z, y: (e.clientY - r.top) / z, rot: 0 };
      setStamps((all) => [...all.slice(-11), s]);
      // gone when its deboss has finished fading (astory.css: 3.2 s), never popped off mid-fade
      timers.add(window.setTimeout(() => setStamps((all) => all.filter((k) => k.id !== s.id)), 3250));
    };
    const timers = new Set<number>();
    el.addEventListener("pointerdown", press);
    return () => {
      el.removeEventListener("pointerdown", press);
      for (const t of timers) window.clearTimeout(t);
    };
  }, [ground]);
  return (
    <div className="stamps" aria-hidden="true">
      {stamps.map((s) => (
        <span key={s.id} className="stamp" style={{ left: s.x, top: s.y, ["--rot" as string]: `${s.rot}deg` }} dangerouslySetInnerHTML={{ __html: MARK_SVG }} />
      ))}
    </div>
  );
}
