/**
 * The family tree as an engraved plate (plateModel): one tier per
 * generation down a terracotta rail, the generation’s name and decade in
 * the margin, and in every tier three parts: the storyteller’s own line on
 * the axis (the storyteller the largest face, their parents straight above
 * them, their children below), everyone else to the left or the right on
 * the side of whoever they are joined to. Couples are joined by an
 * ampersand, and a fine gold thread runs from each couple to each of their
 * children. Under every face only three things: the name, what they are to
 * the storyteller, and their state in the product’s three words; their
 * years and how many memories they are in come up on hover or focus. At
 * most one dashed ring per tier, where somebody is missing. A small family
 * is drawn large; the faces step down only when a generation no longer
 * fits on one line.
 *
 * Pointing at someone (or tabbing to them) lights their threads and the
 * people at the other end. The threads are measured from layout offsets,
 * so the page zoom and the arrival tweens never move them; below 1100px
 * they are left out and the words under each face carry the relation.
 */
import { createContext, Fragment, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Link } from "react-router-dom";
import type { Family, Person } from "../../../data/family";
import type { Story } from "../../../data/stories";
import { buildIndex } from "../../../app-core/lib/familyGraph.js";
import { Button } from "../../ui";
import { pageZoom } from "../../../lib/zoom";
import Portrait from "../Portrait";
import { firstName, memoriesBy, memoriesWith, personName, realPeople, shownState, stateWords, type Index } from "../familyView";
import { PLACE_KINDS, placeWord, treePeople, yearsOf, type GhostKind } from "./treeModel";
import { buildPlate, type PlateGhost, type PlateLink, type PlateNode, type Zone } from "./plateModel";
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
  /** People a live family code was made for (useMyCodes): they are "invited · waiting for them".
      "unknown" while the codes are loading or couldn’t be reached: then nobody is called "not on A Story yet". */
  coded?: Set<string> | null | "unknown";
};

/** The live codes, for every face in the plate without threading a prop through each one. */
const Coded = createContext<Set<string> | null | "unknown">(null);

const isReal = (p: Person | null | undefined): p is Person => !!p && !p.id.startsWith("story:");
const count = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;
const DOT: Record<string, string> = { you: "on", joined: "on", invited: "waiting", remembered: "off", listed: "off" };
/** The face sizes, largest first; a family of six or fewer starts large, of ten or fewer at the middle size. */
const SIZES = ["l", "m", "n", "t"] as const;

/** The plus in a ring, drawn rather than typed. */
const Plus = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

/** The state in the product’s exact words with its dot, never broken inside a phrase: "invited ·" may end a line, nothing else does. */
function StateWords({ words }: { words: string }) {
  const parts = words.split(" · ");
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={p}>
          {/* the space between phrases sits outside them: the only place the line may break */}
          {i > 0 && " "}
          <span className="nw">
            {i === 0 && <i aria-hidden="true" />}
            {p}
            {i < parts.length - 1 && <span className="tp-sep"> ·</span>}
          </span>
        </Fragment>
      ))}
    </>
  );
}

/**
 * On a laptop or a tablet (761–1099px) a generation wraps onto rows under its name. The rows are balanced, so five
 * faces split 3 and 2, never 4 and 1: the narrowest width that still needs as many rows is found, and the row is
 * held to it (--tp-row-w, centred). Elsewhere nothing is held.
 */
function balance(el: HTMLElement) {
  // the tablet band, or a wider window whose generations don't fit the plate's line even at the smallest faces
  const band = window.matchMedia("(min-width: 761px) and (max-width: 1099.98px)").matches || el.dataset.stack === "1";
  for (const row of el.querySelectorAll<HTMLElement>(".tp-row")) {
    row.style.removeProperty("--tp-row-w");
    if (!band) continue;
    const all = [...row.querySelectorAll<HTMLElement>(":scope > .tp-zone > *")].filter((n) => n.getBoundingClientRect().width > 0);
    // the storyteller's unit stands on a row of its own (flex-basis 100%): it only sets the narrowest the row may be
    const alone = all.filter((n) => getComputedStyle(n).flexBasis === "100%");
    const own = alone.map((n) => {
      const kids = [...n.children].map((k) => k.getBoundingClientRect());
      return kids.length ? (Math.max(...kids.map((k) => k.right)) - Math.min(...kids.map((k) => k.left))) / pageZoom() : 0;
    });
    const items = all
      .filter((n) => !alone.includes(n))
      .map((n, i) => ({ w: n.getBoundingClientRect().width / pageZoom(), order: parseFloat(getComputedStyle(n).order) || 0, i }))
      .sort((a, b) => a.order - b.order || a.i - b.i)
      .map((x) => x.w);
    if (items.length < 3) continue;
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    const rows = (w: number) => {
      let n = 1;
      let x = 0;
      for (const iw of items) {
        if (!x) x = iw;
        else if (x + gap + iw <= w) x += gap + iw;
        else {
          n++;
          x = iw;
        }
      }
      return n;
    };
    const need = rows(row.clientWidth);
    if (need < 2) continue;
    let lo = Math.max(...items, ...own);
    let hi = row.clientWidth;
    while (hi - lo > 1) {
      const mid = (lo + hi) / 2;
      if (rows(mid) <= need) hi = mid;
      else lo = mid;
    }
    // a pixel or two over the found width: the browser's own sub-pixel sums never tip it onto another row
    row.style.setProperty("--tp-row-w", `${Math.ceil(hi) + 2}px`);
  }
}

/** Marks each generation whose "+" stands alone on its last row (data-ghost-up); says whether any did. */
function liftLoneRings(el: HTMLElement): boolean {
  let any = false;
  for (const tier of el.querySelectorAll<HTMLElement>(".tp-tier:not(.tp-shelf)")) {
    const ghost = tier.querySelector<HTMLElement>(".tp-row .tp-ghost");
    if (!ghost || !tier.querySelector(".tp-ask-alt")) continue;
    const others = [...tier.querySelectorAll<HTMLElement>(".tp-row > .tp-zone > *")].filter((n) => n !== ghost && n.getBoundingClientRect().width > 0);
    if (!others.length) continue;
    const top = ghost.getBoundingClientRect().top;
    // a face in the storyteller's tier may sit a little lower on the centre line; a row apart is far more than that
    const alone = !others.some((n) => Math.abs(n.getBoundingClientRect().top - top) < 40);
    if (alone) {
      tier.dataset.ghostUp = "1";
      any = true;
    }
  }
  return any;
}

/* ── One face ──────────────────────────────────────────────────────────── */

function Face({ node, story, meId, preview, hot, onHot }: { node: PlateNode; story: Story; meId: string | null | undefined; preview?: boolean; hot: Set<string> | null; onHot: (id: string | null) => void }) {
  const p = node.person;
  const coded = useContext(Coded);
  const unknown = coded === "unknown";
  const state = shownState(p, meId, unknown ? null : coded);
  const gone = !!p.deathYear;
  // until the codes are known, a "listed" person might be invited: say nothing rather than the wrong thing
  const stateLine = gone || (unknown && state === "listed") ? "" : state === "you" ? "you" : stateWords(state);
  const by = memoriesBy(p, story).length;
  const within = memoriesWith(p, story).length;
  const name = personName(p);
  const years = p.deathYear ? yearsOf(p) : p.birthYear ? `born ${p.birthYear}` : "";
  const memories = node.teller ? "" : by > 0 ? `remembers ${by}` : within > 0 ? `in ${count(within, "memory", "memories")}` : "";
  const caption = [years, memories].filter(Boolean).join(" · ");
  const to = isReal(p) ? `/family/${p.id}${preview ? "?preview=tree" : ""}` : null;
  const lit = hot ? (hot.has(node.id) ? " lit" : " dim") : "";
  const cls = `tp-node${node.teller ? " teller" : ""}${gone ? " gone" : ""}${lit}`;
  const body = (
    <>
      <span className="tp-face">
        <Portrait photo={p.photo} given={p.givenName} family={p.familyName} gone={gone} className="tp-por" />
        {caption && (
          <span className="tp-cap" aria-hidden="true">
            {caption}
          </span>
        )}
      </span>
      <span className="tp-nm">{name}</span>
      {/* "brother-in-law" never breaks at its hyphens */}
      {node.teller ? <span className="tp-rel teller">Storyteller</span> : node.rel && <span className="tp-rel">{node.rel.replace(/-/g, "‑")}</span>}
      {stateLine && (
        <span className={`tp-state ${DOT[state] || "off"}`}>
          <StateWords words={stateLine} />
        </span>
      )}
    </>
  );
  const handlers = { onPointerEnter: () => onHot(node.id), onPointerLeave: () => onHot(null), onFocus: () => onHot(node.id), onBlur: () => onHot(null) };
  const label = [name, node.teller ? "the storyteller" : node.rel, stateLine, caption].filter(Boolean).join(", ");
  return to ? (
    <Link className={cls} to={to} data-node={node.id} data-tp-rise aria-label={label} {...handlers}>
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
      <span className="tp-ring">
        <Plus />
      </span>
      <span className="tp-gl">{ghost.label}</span>
    </button>
  );
}

/* ── Somebody not placed yet ───────────────────────────────────────────── */

function Unplaced({ person, anchor, story, meId, preview, canPlace, onPlace }: { person: Person; anchor: Person | null; story: Story; meId: string | null | undefined; preview?: boolean; canPlace: boolean; onPlace: (kind: GhostKind) => void }) {
  const [open, setOpen] = useState(false);
  const [flip, setFlip] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      box.current?.querySelector<HTMLButtonElement>(".tp-place")?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    // Open where it fits: above the button near the foot of the window, kept inside the window at either edge.
    const r = menu.current?.getBoundingClientRect();
    if (r) setFlip(`${r.bottom > window.innerHeight - 8 ? " up" : ""}${r.left < 8 ? " start" : r.right > window.innerWidth - 8 ? " end" : ""}`);
    menu.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  // Up and down move between the choices, Home and End jump to the ends.
  const onMenuKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const items = [...(menu.current?.querySelectorAll<HTMLButtonElement>("button") || [])];
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    const go = (i: number) => items[(i + items.length) % items.length]?.focus();
    if (e.key === "ArrowDown") go(at + 1);
    else if (e.key === "ArrowUp") go(at - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(items.length - 1);
    else return;
    e.preventDefault();
  };
  const node: PlateNode = { id: person.id, person, rel: "", teller: false };
  return (
    <div ref={box} className="tp-shelfitem">
      <Face node={node} story={story} meId={meId} preview={preview} hot={null} onHot={() => {}} />
      {canPlace && anchor && (
        <Button
          variant="quiet"
          small
          className="tp-place"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => {
            setFlip("");
            setOpen((v) => !v);
          }}
        >
          Say who they are
        </Button>
      )}
      {open && anchor && (
        <div ref={menu} className={`ft-menu shelf tp-menu${flip}`} role="menu" aria-label={`Place ${firstName(person)}`} onKeyDown={onMenuKey}>
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
  // Layout boxes, not screen rectangles: offsets are in the plate’s own CSS pixels whatever the page zoom
  // (lib/zoom) and whatever a face’s arrival tween is doing to its transform at the moment of measuring.
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
    const f = (n: number) => n.toFixed(1);
    const d = `M${f(x1)} ${f(y1)}V${f(yb)}C${f(x1)} ${f(yb + k)} ${f(x2)} ${f(yt - k)} ${f(x2)} ${f(yt)}V${f(y2)}`;
    out.push({ key: l.key, d, dashed: l.dashed, ends: [...l.from, l.to] });
  }
  return out;
}

/**
 * True when a generation no longer fits its line. On the plate’s grid the side zones are as wide as their faces,
 * so a tier that is too wide shows as a row wider than its track, or as sides of unequal width (which would push
 * the storyteller off the axis); on a narrower window, where the faces flow, as a face on a second line.
 */
function wraps(plate: HTMLElement): boolean {
  for (const row of plate.querySelectorAll<HTMLElement>(".tp-tier:not(.tp-shelf) .tp-row")) {
    if (getComputedStyle(row).display === "grid") {
      // a side whose faces need more room than its track (text running past a face’s box doesn’t count)
      for (const zone of row.querySelectorAll<HTMLElement>(".tp-zone")) {
        const kids = [...zone.children] as HTMLElement[];
        const gap = parseFloat(getComputedStyle(zone).columnGap) || 0;
        const need = kids.reduce((w, k) => w + k.offsetWidth, 0) + gap * Math.max(0, kids.length - 1);
        if (need > zone.clientWidth + 1) return true;
      }
      const left = row.querySelector<HTMLElement>(".tp-zone.left");
      const right = row.querySelector<HTMLElement>(".tp-zone.right");
      if (left && right && Math.abs(left.offsetWidth - right.offsetWidth) > 2) return true;
    }
  }
  return [...plate.querySelectorAll<HTMLElement>(".tp-tier:not(.tp-shelf) :is(.tp-zone, .tp-unit, .tp-row)")].some((zone) => {
    if (zone.classList.contains("tp-row") && getComputedStyle(zone).display === "grid") return false;
    const kids = [...zone.children].filter((k) => getComputedStyle(k).display !== "contents") as HTMLElement[];
    return kids.length > 1 && kids.some((k) => k.offsetTop > kids[0].offsetTop + kids[0].offsetHeight * 0.6);
  });
}

/**
 * True when, at the smallest faces, a generation on the plate's grid needs more room than its line: a side wider
 * than its track, or the three sides together wider than the row. The faces would run into each other, so the
 * plate stacks instead (data-stack: the tablet's layout, generation by generation, without threads).
 */
function collides(plate: HTMLElement): boolean {
  for (const row of plate.querySelectorAll<HTMLElement>(".tp-tier:not(.tp-shelf) .tp-row")) {
    if (getComputedStyle(row).display !== "grid") continue;
    const zones = [...row.querySelectorAll<HTMLElement>(":scope > .tp-zone")];
    let total = (parseFloat(getComputedStyle(row).columnGap) || 0) * Math.max(0, zones.length - 1);
    for (const zone of zones) {
      const kids = [...zone.children] as HTMLElement[];
      const gap = parseFloat(getComputedStyle(zone).columnGap) || 0;
      const need = kids.reduce((w, k) => w + k.offsetWidth, 0) + gap * Math.max(0, kids.length - 1);
      if (need > zone.clientWidth + 1) return true;
      total += need;
    }
    if (total > row.clientWidth + 1) return true;
  }
  return false;
}

/* ── The plate ─────────────────────────────────────────────────────────── */

export default function FamilyTree({ family, story, meId, own, preview, onAdd, onPlace, canPlace, coded = null }: Props) {
  const plateRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const index = useMemo(() => buildIndex(family || { people: [], edges: [] }) as Index, [family]);
  const people = useMemo(() => treePeople(realPeople(family), story), [family, story]);
  const tellerRow = people.find((p) => p.storyId === story.id) || null;
  const plate = useMemo(() => buildPlate({ people, index, tellerId: tellerRow?.id || null, meId, own }), [people, index, tellerRow, meId, own]);
  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const teller = plate.teller;
  const realTeller = isReal(teller) ? teller : null;
  const drawn = plate.tiers.reduce((n, t) => n + t.units.reduce((m, u) => m + u.nodes.length, 0), 0);
  const start = drawn <= 6 ? 0 : drawn <= 10 ? 1 : 2;
  const [threads, setThreads] = useState<Thread[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hotId, setHotId] = useState<string | null>(null);

  // Who lights up with the person pointed at: them, and whoever their real threads reach. With no real thread
  // (the storyteller alone, a friend), nobody is dimmed.
  const hot = useMemo(() => {
    if (!hotId) return null;
    const set = new Set([hotId]);
    for (const l of plate.links) if (!l.dashed && (l.from.includes(hotId) || l.to === hotId)) [...l.from, l.to].forEach((x) => set.add(x));
    return set.size > 1 ? set : null;
  }, [hotId, plate.links]);
  const onHot = useCallback((id: string | null) => setHotId(id), []);

  const draw = useCallback(() => {
    const el = plateRef.current;
    const svg = svgRef.current;
    if (!el || !svg) return;
    // The largest faces that let every generation sit on one line, and then the plate in the window: the
    // storyteller’s whole tier above the fold always, and the whole plate when it can be (a family of six or
    // fewer keeps its faces at the middle size or larger rather than shrinking to fit).
    let i = start;
    el.dataset.size = SIZES[i];
    delete el.dataset.snug;
    delete el.dataset.stack;
    while (i < SIZES.length - 1 && wraps(el)) el.dataset.size = SIZES[++i];
    // still too wide at the smallest faces: stack the generations as a tablet does, rather than let faces collide
    if (getComputedStyle(svg).display !== "none" && collides(el)) el.dataset.stack = "1";
    const docTop = (n: HTMLElement | null) => {
      let y = 0;
      for (; n; n = n.offsetParent as HTMLElement | null) y += n.offsetTop;
      return y;
    };
    const fold = window.innerHeight / pageZoom() - 12;
    // Fitting the whole plate in the window never takes a small family below the middle size. A large family
    // shrinks to fit on an ordinary screen, but on a big one (the page zoomed up, lib/zoom) it stays at the normal
    // size and lets its youngest generation take the scroll: small faces on a big screen read as a mistake.
    const floor = Math.max(i, drawn <= 6 ? 1 : pageZoom() > 1.15 ? 2 : SIZES.length - 1);
    const tiers = () => [...el.querySelectorAll<HTMLElement>(".tp-tier:not(.tp-shelf)")];
    const bottom = (t: HTMLElement | undefined) => (t ? docTop(t) + t.offsetHeight - parseFloat(getComputedStyle(t).paddingBottom || "0") : 0);
    const tooTall = () => bottom(tiers().pop()) > fold;
    const homeLow = () => bottom(el.querySelector<HTMLElement>(".tp-tier.home") || undefined) > fold;
    while (i < SIZES.length - 1 && ((i < floor && tooTall()) || homeLow())) el.dataset.size = SIZES[++i];
    // On a big screen a large family at its floor still reaching past the fold first gives up the air between
    // its generations, and only then a size, so its youngest generation ends above the fold (baos 7).
    if (pageZoom() > 1.15 && getComputedStyle(svg).display !== "none" && tooTall()) {
      el.dataset.snug = "1";
      if (drawn > 6 && i < SIZES.length - 1 && tooTall()) {
        el.dataset.size = SIZES[i + 1];
        if (!tooTall()) delete el.dataset.snug;
      }
    }
    // without threads (a laptop, a tablet, a phone) a "+" left alone on the last row of its generation moves up
    // beside the generation's name as the small ring, as an empty generation's asks do
    // a "+" that had the keyboard keeps it when it moves between the row and the heading (they are twins)
    const active = document.activeElement as HTMLElement | null;
    const had = active && el.contains(active) && active.matches(".tp-ghost, .tp-ask-alt") ? active : null;
    el.querySelectorAll<HTMLElement>(".tp-tier[data-ghost-up]").forEach((t) => delete t.dataset.ghostUp);
    balance(el);
    if (getComputedStyle(svg).display === "none" && liftLoneRings(el)) balance(el);
    if (had && !had.getClientRects().length) {
      const twin = had.closest(".tp-tier")?.querySelector<HTMLElement>(had.matches(".tp-ghost") ? ".tp-ask-alt" : ".tp-row .tp-ghost");
      twin?.focus({ preventScroll: true });
    }
    if (getComputedStyle(svg).display === "none") {
      setThreads((prev) => (prev.length ? [] : prev));
      return;
    }
    setSize({ w: el.offsetWidth, h: el.offsetHeight });
    setThreads(measure(el, plate.links));
  }, [plate.links, start, drawn]);

  useLayoutEffect(() => {
    draw();
  }, [draw]);
  useEffect(() => {
    const el = plateRef.current;
    if (!el) return;
    let timer = 0;
    let width = el.offsetWidth;
    const later = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(draw, 40);
    };
    // Redraw when the plate’s width changes (a new size class may fit) or the fonts arrive; height changes follow from those.
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            if (el.offsetWidth !== width) {
              width = el.offsetWidth;
              later();
            }
          })
        : null;
    ro?.observe(el);
    // a taller or shorter window changes what fits above the fold
    let tall = window.innerHeight;
    const onResize = () => {
      if (window.innerHeight !== tall) {
        tall = window.innerHeight;
        later();
      }
    };
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(later).catch(() => {});
    return () => {
      window.clearTimeout(timer);
      ro?.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [draw]);

  useTreeMotion(plateRef, `${story.id}:${people.length}`);

  const item = (x: { key: string; unit?: { key: string; nodes: PlateNode[] }; ghost?: PlateGhost }) => {
    if (x.ghost) {
      const anchor = x.ghost.anchorId ? byId.get(x.ghost.anchorId) || null : null;
      return <Ring key={x.key} ghost={x.ghost} anchor={isReal(anchor) ? anchor : null} onAdd={onAdd} hot={hot} />;
    }
    const u = x.unit!;
    if (u.nodes.length === 1) return <Face key={u.key} node={u.nodes[0]} story={story} meId={meId} preview={preview} hot={hot} onHot={onHot} />;
    return (
      <div className="tp-unit" key={u.key} role="group" aria-label={u.nodes.map((n) => firstName(n.person)).join(" & ")}>
        {u.nodes.map((n, i) => (
          <span className="tp-pair" key={n.id}>
            {i > 0 && (
              <span className="tp-amp" aria-hidden="true">
                &amp;
              </span>
            )}
            <Face node={n} story={story} meId={meId} preview={preview} hot={hot} onHot={onHot} />
          </span>
        ))}
      </div>
    );
  };

  return (
    <Coded.Provider value={coded}>
    <section className="tp-wrap" aria-label="The family tree">
      <div className="tp" ref={plateRef} data-size={SIZES[start]} data-hot={hot ? "1" : undefined}>
        <svg ref={svgRef} className="tp-threads" aria-hidden="true" width={size.w || undefined} height={size.h || undefined} viewBox={size.w ? `0 0 ${size.w} ${size.h}` : undefined}>
          {threads.map((t) => (
            <path key={t.key} d={t.d} className={`${t.dashed ? "dash" : ""}${hot ? (t.ends.every((x) => hot.has(x)) && t.ends.includes(hotId || "") ? " lit" : " dim") : ""}`} />
          ))}
        </svg>
        <span className="tp-rail" aria-hidden="true" />

        {plate.tiers.map((tier) => (
          <section key={tier.key} className={`tp-tier${tier.home ? " home" : ""}${tier.units.length ? "" : " rings"}`} aria-labelledby={`tp-h-${tier.key}`}>
            <header className="tp-label">
              <span className="tp-dot" aria-hidden="true" />
              {/* the decade and the generation's name flow together as one item; the asks wrap after them */}
              <div className="tp-name">
                {tier.decade && <span className="tp-dec">{tier.decade}</span>}
                <h3 id={`tp-h-${tier.key}`}>
                  {tier.title}
                  {tier.also && <><span className="tp-sp"> </span><span className="tp-also">{tier.also}</span></>}
                </h3>
              </div>
              {tier.asks.map((g) => {
                const anchor = g.anchorId ? byId.get(g.anchorId) || null : null;
                return (
                  <button key={g.key} type="button" className="tp-ask" aria-label={`Add ${g.label}`} onClick={() => onAdd(isReal(anchor) ? anchor : null, g.kind)}>
                    <Plus />
                    {g.label}
                  </button>
                );
              })}
              {/* the generation's "+" as the small ring by its name, shown only when the ring would stand alone on a row */}
              {(["left", "centre", "right"] as Zone[]).flatMap((z) => tier.zones[z].filter((x) => x.ghost)).map((x) => {
                const anchor = x.ghost!.anchorId ? byId.get(x.ghost!.anchorId) || null : null;
                return (
                  <button key={`alt-${x.key}`} type="button" className="tp-ask tp-ask-alt" aria-label={`Add ${x.ghost!.label}`} onClick={() => onAdd(isReal(anchor) ? anchor : null, x.ghost!.kind)}>
                    <Plus />
                    {x.ghost!.label}
                  </button>
                );
              })}
            </header>
            <div className="tp-row">
              {(["left", "centre", "right"] as Zone[]).map((z) => (
                <div key={z} className={`tp-zone ${z}`}>
                  {tier.zones[z].map(item)}
                </div>
              ))}
            </div>
          </section>
        ))}

        {plate.unplaced.length > 0 && (
          <section className="tp-tier tp-shelf" aria-label="Not placed yet">
            <header className="tp-label">
              <span className="tp-dot open" aria-hidden="true" />
              <h3>Not placed yet</h3>
              <p className="tp-hint">Say who they are to {own ? "you" : firstName(teller) || story.name}.</p>
            </header>
            <div className="tp-row">
              <div className="tp-zone centre">
                {plate.unplaced.map((p) => (
                  <Unplaced key={p.id} person={p} anchor={realTeller} story={story} meId={meId} preview={preview} canPlace={!preview && canPlace(p)} onPlace={(kind) => realTeller && onPlace(p, realTeller, kind)} />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </section>
    </Coded.Provider>
  );
}
