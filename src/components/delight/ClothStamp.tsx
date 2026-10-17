/**
 * Press the cloth and the A-mark is blind-stamped into it where you
 * pressed, the way a binder's brass die leaves its mark; it fades as the
 * cloth springs back. Pointer-downs on anything you can actually use (the
 * sheet, links, buttons) are left alone.
 */
import { useEffect, useState, type RefObject } from "react";
import { MARK_SVG } from "../brandArt";

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
      if (t.closest(".paper, .title-page, .print, a, button, input, label")) return;
      const r = el.getBoundingClientRect();
      const s = { id: ++seq, x: e.clientX - r.left, y: e.clientY - r.top, rot: 0 };
      setStamps((all) => [...all.slice(-11), s]);
      setTimeout(() => setStamps((all) => all.filter((k) => k.id !== s.id)), 2800);
    };
    el.addEventListener("pointerdown", press);
    return () => el.removeEventListener("pointerdown", press);
  }, [ground]);
  return (
    <div className="stamps" aria-hidden="true">
      {stamps.map((s) => (
        <span key={s.id} className="stamp" style={{ left: s.x, top: s.y, ["--rot" as string]: `${s.rot}deg` }} dangerouslySetInnerHTML={{ __html: MARK_SVG }} />
      ))}
    </div>
  );
}
