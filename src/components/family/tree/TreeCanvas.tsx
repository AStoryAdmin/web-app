/**
 * The sheet the family is drawn on. On a laptop it pans by dragging and
 * with two-finger scroll, zooms with the buttons and ctrl+wheel, and opens
 * fitted so nothing starts clipped; the arrow keys walk from person to
 * person, Enter opens them, "+" adds someone beside them. On a phone it is
 * a plain scrolling sheet with the storyteller in view first.
 *
 * It arrives once: the ink lines draw themselves from the storyteller
 * outward and the prints settle in after them, 1.2 s in all, and nothing
 * at all under reduced motion. The sheet moves; the controls never do.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { neighbourOf, type TreeLayout } from "../../../lib/familyLayout";
import { ExpandIcon } from "../../icons";
import TreeNode from "./TreeNode";
import { ADD_WORDS, PLACE_KINDS, placeWord, type GhostKind, type NodeInfo } from "./treeModel";

export type TreeMenu = { kind: "add"; anchorId: string } | { kind: "place"; anchorId: string; personId: string };

type Props = {
  layout: TreeLayout;
  infos: Map<string, NodeInfo>;
  phone: boolean;
  /** Whether the "+" beside each person is offered. */
  canAdd: boolean;
  firstNameOf: (id: string) => string;
  onAdd: (anchorId: string, kind: GhostKind) => void;
  onPlace: (personId: string, anchorId: string, kind: GhostKind) => void;
};

const MIN_SCALE = 0.35;
const MAX_SCALE = 1.6;
const PAD = 28;
const DIRS: Record<string, "left" | "right" | "up" | "down"> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
const TILTS = [-1.6, 1.2, -0.9, 1.7];

function tiltFor(id: string, focus: boolean): number {
  if (focus) return 0;
  let h = 3;
  for (const ch of id) h = (h * 33 + ch.charCodeAt(0)) % 10007;
  return TILTS[h % TILTS.length];
}

const Minus = () => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
    <path d="M5 12h14" />
  </svg>
);
const Plus = () => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export default function TreeCanvas({ layout, infos, phone, canAdd, firstNameOf, onAdd, onPlace }: Props) {
  const view = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const t = useRef({ s: 1, x: 0, y: 0 });
  const moved = useRef(false);
  const arrived = useRef(false);
  const drag = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number; on: boolean } | null>(null);
  const suppress = useRef(false);
  const [menu, setMenu] = useState<(TreeMenu & { left: number; top: number }) | null>(null);
  const { nodeW, nodeH, printH } = layout.opts;
  const viewH = Math.max(360, Math.min(860, layout.height + 56));

  const apply = useCallback(() => {
    const el = stage.current;
    if (!el) return;
    const { s, x, y } = t.current;
    el.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
  }, []);

  const fit = useCallback(() => {
    const el = view.current;
    if (!el || !layout.width) return;
    const vw = el.clientWidth;
    const vh = el.clientHeight;
    const s = Math.min(1, (vw - PAD * 2) / layout.width, (vh - PAD * 2) / layout.height);
    t.current = { s, x: (vw - layout.width * s) / 2, y: (vh - layout.height * s) / 2 };
    moved.current = false;
    apply();
  }, [layout, apply]);

  const zoomAt = useCallback(
    (factor: number, px: number, py: number) => {
      const { s, x, y } = t.current;
      const ns = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * factor));
      t.current = { s: ns, x: px - (px - x) * (ns / s), y: py - (py - y) * (ns / s) };
      moved.current = true;
      apply();
    },
    [apply],
  );

  // Fitted on arrival and whenever the sheet is resized, unless the reader has moved it.
  useLayoutEffect(() => {
    const el = view.current;
    if (!el) return;
    if (phone) {
      const f = layout.nodes.find((n) => n.focus);
      if (f) {
        el.scrollLeft = f.x + nodeW / 2 - el.clientWidth / 2;
        el.scrollTop = Math.max(0, f.y - 20);
      }
      return;
    }
    if (!moved.current) fit();
    const ro = new ResizeObserver(() => {
      if (!moved.current) fit();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit, phone, layout, nodeW]);

  // Two-finger scroll pans, ctrl+wheel zooms around the pointer.
  useEffect(() => {
    const el = view.current;
    if (!el || phone) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * 0.008), e.clientX - r.left, e.clientY - r.top);
      else {
        t.current.x -= e.deltaX;
        t.current.y -= e.deltaY;
        moved.current = true;
        apply();
      }
      setMenu(null);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [phone, apply, zoomAt]);

  // The arrival, once: lines from the storyteller outward, then the prints settle.
  useEffect(() => {
    const el = stage.current;
    if (!el || arrived.current || !layout.nodes.length) return;
    arrived.current = true;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const paths = gsap.utils.toArray<SVGPathElement>(el.querySelectorAll(".ft-lines path"));
      const nodes = gsap.utils.toArray<HTMLElement>(el.querySelectorAll(".ft-node"));
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      for (const p of paths) {
        const depth = Number(p.dataset.depth || 0);
        if (p.classList.contains("second")) {
          tl.fromTo(p, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.3 + depth * 0.16);
          continue;
        }
        const len = p.getTotalLength ? p.getTotalLength() : 300;
        tl.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.45 }, 0.1 + depth * 0.16);
      }
      for (const n of nodes) {
        const depth = Number(n.dataset.depth || 0);
        tl.fromTo(n, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.55, clearProps: "transform,opacity" }, depth * 0.16);
      }
      tl.eventCallback("onComplete", () => gsap.set(paths, { clearProps: "strokeDasharray,strokeDashoffset,opacity" }));
    });
    return () => mm.revert();
  }, [layout]);

  // The menu closes on a click elsewhere or Escape; its first choice takes the focus.
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest(".ft-menu")) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    view.current?.querySelector<HTMLButtonElement>(".ft-menu button")?.focus();
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const nodeOf = (id: string) => layout.nodes.find((n) => n.id === id);

  /** Pans so a person is inside the sheet, if they were not. */
  const reveal = (id: string) => {
    const n = nodeOf(id);
    const el = view.current;
    if (!n || !el) return;
    if (phone) {
      document.getElementById(`ft-${id}`)?.scrollIntoView({ block: "nearest", inline: "center" });
      return;
    }
    const { s, x, y } = t.current;
    const left = n.x * s + x;
    const top = n.y * s + y;
    const right = left + nodeW * s;
    const bottom = top + nodeH * s;
    let nx = x;
    let ny = y;
    if (left < PAD) nx += PAD - left;
    else if (right > el.clientWidth - PAD) nx -= right - (el.clientWidth - PAD);
    if (top < PAD) ny += PAD - top;
    else if (bottom > el.clientHeight - PAD) ny -= bottom - (el.clientHeight - PAD);
    if (nx !== x || ny !== y) {
      t.current = { s, x: nx, y: ny };
      moved.current = true;
      apply();
    }
  };

  const focusNode = (id: string) => {
    document.getElementById(`ft-${id}`)?.focus({ preventScroll: true });
    reveal(id);
  };

  const openMenu = (m: TreeMenu) => {
    const n = nodeOf(m.anchorId);
    const el = view.current;
    if (!n || !el) return;
    let left: number;
    let top: number;
    if (phone) {
      left = n.x + nodeW + 6;
      top = n.y;
      if (left + 232 > layout.width) left = Math.max(4, n.x - 236);
    } else {
      const { s, x, y } = t.current;
      left = n.x * s + x + nodeW * s + 6;
      top = n.y * s + y;
      if (left + 232 > el.clientWidth) left = Math.max(8, n.x * s + x - 236);
      top = Math.max(8, Math.min(top, el.clientHeight - 236));
    }
    setMenu({ ...m, left, top });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-id]");
    if (!el) return;
    const id = el.dataset.id || "";
    if (e.key in DIRS) {
      const next = neighbourOf(layout, id, DIRS[e.key]);
      if (next) {
        e.preventDefault();
        focusNode(next);
      }
    } else if ((e.key === "+" || e.key === "=") && canAdd && infos.get(id)?.href) {
      e.preventDefault();
      openMenu({ kind: "add", anchorId: id });
    } else if (e.key === "Home" && layout.focusId) {
      e.preventDefault();
      focusNode(layout.focusId);
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    suppress.current = false;
    if (phone || e.button !== 0) return;
    if ((e.target as HTMLElement).closest(".ft-menu, .ft-ctl, .ft-plus")) return;
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: t.current.x, oy: t.current.y, on: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.on && Math.hypot(dx, dy) > 4) {
      d.on = true;
      view.current?.setPointerCapture(e.pointerId);
      view.current?.classList.add("dragging");
      setMenu(null);
    }
    if (d.on) {
      t.current.x = d.ox + dx;
      t.current.y = d.oy + dy;
      moved.current = true;
      apply();
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    if (d.on) {
      suppress.current = true;
      view.current?.classList.remove("dragging");
      if (view.current?.hasPointerCapture(e.pointerId)) view.current.releasePointerCapture(e.pointerId);
    }
  };
  const onClickCapture = (e: React.MouseEvent) => {
    if (!suppress.current) return;
    suppress.current = false;
    e.preventDefault();
    e.stopPropagation();
  };
  // Tabbing to a person must not scroll the clipped sheet; pan it instead.
  const onFocusCapture = (e: React.FocusEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-id]");
    if (!el || phone) return;
    const v = view.current;
    if (v) {
      v.scrollLeft = 0;
      v.scrollTop = 0;
    }
    reveal(el.dataset.id || "");
  };

  const centre = () => {
    const el = view.current;
    return el ? [el.clientWidth / 2, el.clientHeight / 2] : [0, 0];
  };

  return (
    <div
      ref={view}
      className={`ft-view${phone ? " phone" : ""}`}
      style={phone ? undefined : { height: viewH }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
      onKeyDown={onKeyDown}
      onFocusCapture={onFocusCapture}
    >
      <div ref={stage} className="ft-stage" style={{ width: layout.width, height: layout.height }}>
        <svg className="ft-lines" width={layout.width} height={layout.height} viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true">
          {layout.connectors.map((c) => (
            <path key={c.key} className={c.kind} d={c.d} data-depth={c.depth} />
          ))}
        </svg>
        {layout.nodes.map((n) => {
          const info = infos.get(n.id);
          if (!info) return null;
          return (
            <TreeNode
              key={n.id}
              node={n}
              info={info}
              nodeW={nodeW}
              printH={printH}
              tilt={tiltFor(n.id, n.focus)}
              canAdd={canAdd && !info.ghost && !!info.href}
              onAdd={(id) => openMenu({ kind: "add", anchorId: id })}
              onGhost={(anchorId, kind) => kind && onAdd(anchorId, kind)}
              onDropPerson={(personId, anchorId) => openMenu({ kind: "place", anchorId, personId })}
              focusId={layout.focusId}
            />
          );
        })}
      </div>

      {menu && (
        <div className="ft-menu" style={{ left: menu.left, top: menu.top }} role="menu" aria-label={menu.kind === "add" ? `Add someone related to ${firstNameOf(menu.anchorId)}` : `Place ${firstNameOf(menu.personId)}`}>
          <p>{menu.kind === "add" ? `Related to ${firstNameOf(menu.anchorId)}` : `Place ${firstNameOf(menu.personId)}`}</p>
          {PLACE_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              role="menuitem"
              onClick={() => {
                const m = menu;
                setMenu(null);
                if (m.kind === "add") onAdd(m.anchorId, k);
                else onPlace(m.personId, m.anchorId, k);
              }}
            >
              {menu.kind === "add" ? ADD_WORDS[k] : placeWord(k, firstNameOf(menu.anchorId))}
            </button>
          ))}
        </div>
      )}

      {!phone && (
        <div className="ft-ctl" role="group" aria-label="Zoom">
          <button type="button" aria-label="Zoom out" onClick={() => zoomAt(1 / 1.25, ...(centre() as [number, number]))}>
            <Minus />
          </button>
          <button type="button" aria-label="Zoom in" onClick={() => zoomAt(1.25, ...(centre() as [number, number]))}>
            <Plus />
          </button>
          <button type="button" aria-label="Fit the whole family" onClick={fit}>
            <ExpandIcon width={18} height={18} />
          </button>
        </div>
      )}
    </div>
  );
}
