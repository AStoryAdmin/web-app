/**
 * The family tree as an engraved plate (plateModel): one tier per
 * generation down a terracotta rail, the generation's name and decade in
 * the margin, the faces centred, the storyteller the largest in the middle
 * of their own tier, couples joined by an ampersand, and a fine gold thread
 * from each couple down to each of their children. Under every face their
 * name, what they are to the storyteller and their state in the product's
 * three words. A dashed ring where a relation is missing, a shelf for the
 * people nobody has placed yet.
 *
 * Pointing at someone (or tabbing to them) lights their threads and the
 * people at the other end, so who belongs to whom reads at a glance. The
 * threads are measured from the drawn faces, so they follow whatever the
 * window does; below 1100px they are left out and the words under each
 * face carry the relation.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Family, Person } from "../../../data/family";
import type { Story } from "../../../data/stories";
import { buildIndex } from "../../../app-core/lib/familyGraph.js";
import { Button } from "../../ui";
import Portrait from "../Portrait";
import { firstName, linkState, memoriesBy, memoriesWith, personName, realPeople, stateWords, type Index } from "../familyView";
import { PLACE_KINDS, placeWord, treePeople, yearsOf, type GhostKind } from "./treeModel";
import { buildPlate, type PlateGhost, type PlateLink, type PlateNode } from "./plateModel";
import { useTreeMotion } from "./treeMotion";

type Props = {
  family: Family | null;
  story: Story;
  meId: string | null | undefined;
  own: boolean;
  /** The sample family: nothing on it writes; its people open with ?preview=tree. */
  preview?: boolean;
  onAdd: (anchor: Person | null, kind: string | null) => void;
  onPlace: (person: Person, anchor: Person, kind: GhostKind) => void;
  canPlace: (person: Person) => boolean;
};

const isReal = (p: Person | null | undefined): p is Person => !!p && !p.id.startsWith("story:");
const count = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;
const DOT: Record<string, string> = { you: "on", joined: "on", invited: "waiting", remembered: "off", listed: "off" };

/* ── One face ──────────────────────────────────────────────────────────── */

function Face({ node, story, meId, preview, hot, onHot }: { node: PlateNode; story: Story; meId: string | null | undefined; preview?: boolean; hot: Set<string> | null; onHot: (id: string | null) => void }) {
  const p = node.person;
  const state = meId && p.userId === meId ? "you" : linkState(p, meId).key;
  const gone = !!p.deathYear;
  const stateLine = gone ? "" : state === "you" ? "you" : stateWords(state);
  const by = memoriesBy(p, story).length;
  const within = memoriesWith(p, story).length;
  const note = node.teller ? "" : by > 0 ? `remembers ${by}` : within > 0 ? `in ${count(within, "memory", "memories")}` : "";
  const name = personName(p);
  const years = p.deathYear ? yearsOf(p) : p.birthYear ? `born ${p.birthYear}` : "";
  const to = isReal(p) ? `/family/${p.id}${preview ? "?preview=tree" : ""}` : null;
  const lit = hot ? (hot.has(node.id) ? " lit" : " dim") : "";
  const cls = `tp-node${node.teller ? " teller" : ""}${gone ? " gone" : ""}${lit}`;
  const body = (
    <>
      <Portrait photo={p.photo} given={p.givenName} family={p.familyName} gone={gone} className="tp-por" />
      {node.teller && <span className="tp-kick">Storyteller</span>}
      <span className="tp-nm">{name}</span>
      {/* "brother-in-law" never breaks at its hyphens */}
      {node.rel && <span className="tp-rel">{node.rel.replace(/-/g, "‑")}</span>}
      {years && <span className="tp-yrs">{years}</span>}
      {stateLine && (
        <span className={`tp-state ${DOT[state] || "off"}`}>
          <i aria-hidden="true" />
          {stateLine}
        </span>
      )}
      {note && <span className="tp-note">{note}</span>}
    </>
  );
  const handlers = { onPointerEnter: () => onHot(node.id), onPointerLeave: () => onHot(null), onFocus: () => onHot(node.id), onBlur: () => onHot(null) };
  return to ? (
    <Link className={cls} to={to} data-node={node.id} data-tp-rise aria-label={[name, node.teller ? "the storyteller" : node.rel, stateLine].filter(Boolean).join(", ")} {...handlers}>
      {body}
    </Link>
  ) : (
    <span className={cls} data-node={node.id} data-tp-rise {...handlers}>
      {body}
    </span>
  );
}

function Ring({ ghost, anchor, onAdd, hot }: { ghost: PlateGhost; anchor: Person | null; onAdd: Props["onAdd"]; hot: Set<string> | null }) {
  return (
    <button type="button" className={`tp-ghost${hot ? (hot.has(ghost.node) ? " lit" : " dim") : ""}`} data-node={ghost.node} data-tp-rise onClick={() => onAdd(anchor, ghost.kind)} aria-label={`Add ${ghost.label}`}>
      <span className="tp-ring" aria-hidden="true">
        +
      </span>
      <span className="tp-gl">{ghost.label}</span>
    </button>
  );
}

/* ── Somebody not placed yet ───────────────────────────────────────────── */

function Unplaced({ person, anchor, story, meId, preview, canPlace, onPlace }: { person: Person; anchor: Person | null; story: Story; meId: string | null | undefined; preview?: boolean; canPlace: boolean; onPlace: (kind: GhostKind) => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    box.current?.querySelector<HTMLButtonElement>(".ft-menu button")?.focus();
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const node: PlateNode = { id: person.id, person, rel: "", teller: false };
  return (
    <div ref={box} className="tp-shelfitem">
      <Face node={node} story={story} meId={meId} preview={preview} hot={null} onHot={() => {}} />
      {canPlace && anchor && (
        <Button variant="quiet" small className="tp-place" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          Say who they are
        </Button>
      )}
      {open && anchor && (
        <div className="ft-menu shelf tp-menu" role="menu" aria-label={`Place ${firstName(person)}`}>
          {PLACE_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onPlace(k);
              }}
            >
              {placeWord(k, firstName(anchor))}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── The threads ───────────────────────────────────────────────────────── */

type Thread = { key: string; d: string; dashed: boolean; ends: string[] };

/** One thread per link: straight down out of the upper tier, a curve across the gap, straight down onto the face. */
function measure(plate: HTMLElement, links: PlateLink[]): Thread[] {
  // Layout boxes, not screen rectangles: offsets are in the plate's own CSS pixels whatever the page zoom
  // (lib/zoom) and whatever a face's arrival tween is doing to its transform at the moment of measuring.
  const at = (el: Element) => {
    let x = 0;
    let y = 0;
    let n: HTMLElement | null = el as HTMLElement;
    while (n && n !== plate) {
      x += n.offsetLeft;
      y += n.offsetTop;
      n = n.offsetParent as HTMLElement | null;
    }
    const h = el as HTMLElement;
    return { x, y, w: h.offsetWidth, h: h.offsetHeight };
  };
  const find = (id: string) => plate.querySelector<HTMLElement>(`[data-node="${CSS.escape(id)}"]`);
  const face = (el: HTMLElement) => el.querySelector(".por, .tp-ring") || el;
  const rowOf = (el: HTMLElement) => el.closest(".tp-tier")?.querySelector(".tp-row") || el;
  const out: Thread[] = [];
  for (const l of links) {
    const from = l.from.map(find).filter((x): x is HTMLElement => !!x);
    const to = find(l.to);
    if (!from.length || !to) continue;
    const faces = from.map((el) => at(face(el)));
    const x1 = faces.reduce((s, f) => s + f.x + f.w / 2, 0) / faces.length;
    const y1 = Math.max(...from.map((el) => at(el).y + at(el).h)) + 6;
    const upperRow = at(rowOf(from[0]));
    const yb = Math.max(y1, upperRow.y + upperRow.h + 4);
    const t = at(face(to));
    const x2 = t.x + t.w / 2;
    const y2 = t.y - 6;
    const lowerRow = at(rowOf(to));
    const yt = Math.min(y2, lowerRow.y - 2);
    if (yt <= yb) continue;
    const k = (yt - yb) * 0.6;
    const d = `M${x1.toFixed(1)} ${y1.toFixed(1)}V${yb.toFixed(1)}C${x1.toFixed(1)} ${(yb + k).toFixed(1)} ${x2.toFixed(1)} ${(yt - k).toFixed(1)} ${x2.toFixed(1)} ${yt.toFixed(1)}V${y2.toFixed(1)}`;
    out.push({ key: l.key, d, dashed: l.dashed, ends: [...l.from, l.to] });
  }
  return out;
}

/** True when a tier's faces no longer fit on one line. */
function wraps(plate: HTMLElement): boolean {
  return [...plate.querySelectorAll<HTMLElement>(".tp-row")].some((row) => {
    const kids = [...row.children] as HTMLElement[];
    // a face set lower to sit on the storyteller's centre line is not a second line
    return kids.length > 1 && kids.some((k) => k.offsetTop > kids[0].offsetTop + kids[0].offsetHeight * 0.6);
  });
}

/* ── The plate ─────────────────────────────────────────────────────────── */

export default function FamilyTree({ family, story, meId, own, preview, onAdd, onPlace, canPlace }: Props) {
  const plateRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const index = useMemo(() => buildIndex(family || { people: [], edges: [] }) as Index, [family]);
  const people = useMemo(() => treePeople(realPeople(family), story), [family, story]);
  const tellerRow = people.find((p) => p.storyId === story.id) || null;
  const plate = useMemo(() => buildPlate({ people, index, tellerId: tellerRow?.id || null, meId, own }), [people, index, tellerRow, meId, own]);
  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const teller = plate.teller;
  const realTeller = isReal(teller) ? teller : null;
  const [threads, setThreads] = useState<Thread[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hotId, setHotId] = useState<string | null>(null);

  // Who lights up with the person pointed at: them, and whoever their threads reach.
  const hot = useMemo(() => {
    if (!hotId) return null;
    const set = new Set([hotId]);
    for (const l of plate.links) if (l.from.includes(hotId) || l.to === hotId) [...l.from, l.to].forEach((x) => set.add(x));
    return set.size > 1 ? set : null;
  }, [hotId, plate.links]);
  const onHot = useCallback((id: string | null) => setHotId(id), []);

  const draw = useCallback(() => {
    const el = plateRef.current;
    const svg = svgRef.current;
    if (!el || !svg) return;
    // Tighter faces when a generation would not fit on one line; looser again when the window grows.
    el.dataset.tight = "";
    if (wraps(el)) el.dataset.tight = "1";
    if (getComputedStyle(svg).display === "none") {
      setThreads((prev) => (prev.length ? [] : prev));
      return;
    }
    setSize({ w: el.offsetWidth, h: el.offsetHeight });
    setThreads(measure(el, plate.links));
  }, [plate.links]);

  useLayoutEffect(() => {
    draw();
  }, [draw]);
  useEffect(() => {
    const el = plateRef.current;
    if (!el) return;
    let timer = 0;
    const later = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(draw, 40);
    };
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(later) : null;
    ro?.observe(el);
    window.addEventListener("resize", later);
    document.fonts?.ready.then(later).catch(() => {});
    return () => {
      window.clearTimeout(timer);
      ro?.disconnect();
      window.removeEventListener("resize", later);
    };
  }, [draw]);

  useTreeMotion(plateRef, `${story.id}:${people.length}`);

  return (
    <section className="tp-wrap" aria-label="The family tree">
      <div className="tp" ref={plateRef} data-hot={hot ? "1" : undefined}>
        <svg ref={svgRef} className="tp-threads" aria-hidden="true" width={size.w || undefined} height={size.h || undefined} viewBox={size.w ? `0 0 ${size.w} ${size.h}` : undefined}>
          {threads.map((t) => (
            <path key={t.key} d={t.d} className={`${t.dashed ? "dash" : ""}${hot ? (t.ends.every((x) => hot.has(x)) && t.ends.includes(hotId || "") ? " lit" : " dim") : ""}`} />
          ))}
        </svg>
        <span className="tp-rail" aria-hidden="true" />

        {plate.tiers.map((tier) => (
          <section key={tier.key} className={`tp-tier${tier.home ? " home" : ""}`} aria-label={tier.title}>
            <header className="tp-label">
              <span className="tp-dot" aria-hidden="true" />
              {tier.decade && <span className="tp-dec">{tier.decade}</span>}
              <h3>{tier.title}</h3>
            </header>
            <div className="tp-row">
              {tier.units.map((u) =>
                u.nodes.length > 1 ? (
                  <div className="tp-unit" key={u.key} role="group" aria-label={u.nodes.map((n) => firstName(n.person)).join(" & ")}>
                    {u.nodes.map((n, i) => (
                      <span className="tp-pair" key={n.id}>
                        {i > 0 && (
                          <span className={`tp-amp${u.nodes[i].teller || u.nodes[i - 1].teller ? " at-teller" : ""}`} aria-hidden="true">
                            &amp;
                          </span>
                        )}
                        <Face node={n} story={story} meId={meId} preview={preview} hot={hot} onHot={onHot} />
                      </span>
                    ))}
                  </div>
                ) : (
                  <Face key={u.key} node={u.nodes[0]} story={story} meId={meId} preview={preview} hot={hot} onHot={onHot} />
                ),
              )}
              {tier.ghosts.map((g) => {
                const anchor = g.anchorId ? byId.get(g.anchorId) || null : null;
                return <Ring key={g.key} ghost={g} anchor={isReal(anchor) ? anchor : null} onAdd={onAdd} hot={hot} />;
              })}
            </div>
          </section>
        ))}

        {plate.unplaced.length > 0 && (
          <section className="tp-tier tp-shelf" aria-label="Not placed yet">
            <header className="tp-label">
              <span className="tp-dot open" aria-hidden="true" />
              <h3>Not placed yet</h3>
              <p className="tp-hint">Say who they are to {own ? "you" : firstName(teller) || story.name}, and they take their place above.</p>
            </header>
            <div className="tp-row">
              {plate.unplaced.map((p) => (
                <Unplaced key={p.id} person={p} anchor={realTeller} story={story} meId={meId} preview={preview} canPlace={!preview && canPlace(p)} onPlace={(kind) => realTeller && onPlace(p, realTeller, kind)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
