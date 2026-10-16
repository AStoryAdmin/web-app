/**
 * The family as a drawing: the storyteller in the middle, parents above,
 * partner beside, children and grandchildren below, joined by the elbowed
 * lines of a printed tree. Positions come from the app's layoutFamilyTree;
 * this draws them on a laptop, scales the whole drawing to the card, and
 * draws the lines in when the page arrives (GSAP, unless motion is reduced).
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import type { Family, Person } from "../../data/family";
import type { Story } from "../../data/stories";
import { buildIndex } from "../../app-core/lib/familyGraph.js";
import { layoutFamilyTree, PW, GAP, LAYOUT_MARGIN } from "../../app-core/lib/familyTreeLayout.js";
import { usePhotoUrl } from "../../lib/photoUrls";
import { PlusIcon } from "../icons";
import { personLine, personName, realPeople, type Index } from "./familyView";

type Card = { key: string; x: number; y: number; w: number; h: number; focus?: boolean; members: { personId: string | null }[] };
type Line = { x1: number; y1: number; x2: number; y2: number };
type Layout = { cards: Card[]; lines: Line[]; width: number; height: number; focus: { x: number; y: number } };

// The layout's units are a phone's; a laptop's node is wider (names on one
// line) but no taller, so the two axes scale apart. Lines stay straight.
const KX = 1.3;
const KY = 1;
const AV = 84; // the avatar, and where a couple's bar sits
const MIN_FIT = 0.56;

function NodeAvatar({ person, teller }: { person: Person; teller: boolean }) {
  const photo = usePhotoUrl(person.photo);
  const initial = (person.givenName || "?").trim()[0]?.toUpperCase() || "?";
  if (photo) return <img className={`av${teller ? " ring" : ""}`} src={photo} alt="" width={AV} height={AV} />;
  return (
    <span className={`av ph${teller ? " ring" : ""}${person.deathYear ? " gone" : ""}`} aria-hidden="true">
      {initial}
    </span>
  );
}

function Node({ person, teller, line, x, y, w }: { person: Person; teller: boolean; line: string; x: number; y: number; w: number }) {
  return (
    <Link className={`tnode${teller ? " teller" : ""}`} to={`/family/${person.id}`} style={{ left: x, top: y, width: w }} aria-label={`${personName(person)}, ${line}`}>
      {teller && <span className="tag">Storyteller</span>}
      <NodeAvatar person={person} teller={teller} />
      <strong>{personName(person)}</strong>
      <span>{line}</span>
    </Link>
  );
}

export default function FamilyTree({
  family,
  story,
  meId,
  organiser,
  onAdd,
}: {
  family: Family;
  story: Story;
  meId: string | null | undefined;
  organiser: boolean;
  onAdd: () => void;
}) {
  const index = useMemo(() => buildIndex(family) as Index, [family]);
  const people = useMemo(() => realPeople(family), [family]);

  const drawing = useMemo(() => {
    const tellerId = people.find((p) => p.storyId === story.id)?.id || null;
    const focusId = tellerId || people.find((p) => p.userId === meId)?.id || people[0]?.id || null;
    if (!focusId) return null;
    const lay = layoutFamilyTree(index, focusId, { ghosts: false }) as Layout;
    if (!lay.cards.length) return null;
    const focus = lay.cards.find((c) => c.focus) || lay.cards[0];
    const rowRight = Math.max(...lay.cards.filter((c) => c.y === focus.y).map((c) => c.x + c.w));
    const add = { x: rowRight + GAP, y: focus.y, w: PW };
    const width = Math.max(lay.width, add.x + PW + LAYOUT_MARGIN);
    const drawn = new Set(lay.cards.flatMap((c) => c.members.map((m) => m.personId)));
    // A couple's bar between the two halves of a card, and the stem down
    // from it when their children are drawn below.
    const extra: Line[] = [];
    for (const c of lay.cards) {
      if (c.members.length !== 2) continue;
      const cy = c.y + AV / 2 / KY;
      extra.push({ x1: c.x + PW / 2, y1: cy, x2: c.x + PW + PW / 2, y2: cy });
      const cx = c.x + c.w / 2;
      if (lay.lines.some((l) => Math.abs(l.x1 - cx) < 0.5 && Math.abs(l.y1 - (c.y + c.h)) < 0.5)) extra.push({ x1: cx, y1: cy, x2: cx, y2: c.y + c.h });
    }
    return { ...lay, width, add, drawn, lines: [...extra, ...lay.lines], tellerId };
  }, [index, people, story.id, meId]);

  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);

  // Scale the drawing to the card's width; below MIN_FIT it scrolls instead.
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el || !drawing) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) setFit(Math.max(MIN_FIT, Math.min(1, w / (drawing.width * KX))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [drawing]);

  // Draw the lines in, then the people rise, top row first.
  useEffect(() => {
    const el = canvas.current;
    if (!el || !drawing) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const lines = gsap.utils.toArray<SVGLineElement>(el.querySelectorAll("line"));
      for (const l of lines) {
        const len = Math.hypot(Number(l.getAttribute("x2")) - Number(l.getAttribute("x1")), Number(l.getAttribute("y2")) - Number(l.getAttribute("y1")));
        l.style.strokeDasharray = `${len}`;
        l.style.strokeDashoffset = `${len}`;
      }
      const nodes = gsap.utils.toArray<HTMLElement>(el.querySelectorAll(".tnode")).sort((a, b) => parseFloat(a.style.top) - parseFloat(b.style.top));
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(nodes, { opacity: 0, y: 10, duration: 0.5, stagger: 0.06 }, 0);
      tl.to(lines, { strokeDashoffset: 0, duration: 0.6, stagger: 0.05 }, 0.15);
    });
    return () => mm.revert();
  }, [drawing]);

  if (!drawing) return null;

  const { tellerId } = drawing;
  const lineFor = (p: Person) => personLine(p, { story, index, tellerId, meId, organiser });
  const others = people.filter((p) => !drawing.drawn.has(p.id));
  const W = drawing.width * KX;
  const H = drawing.height * KY;

  return (
    <>
      <div className="treewrap" ref={wrap} style={{ height: H * fit, overflowX: fit <= MIN_FIT ? "auto" : "hidden" }}>
        <div className="treecanvas" ref={canvas} style={{ width: W, height: H, transform: `scale(${fit})` }}>
          <svg className="tlines" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
            {drawing.lines.map((l, i) => (
              <line key={i} x1={l.x1 * KX} y1={l.y1 * KY} x2={l.x2 * KX} y2={l.y2 * KY} />
            ))}
          </svg>
          {drawing.cards.map((c) =>
            c.members.map((m, i) => {
              const p = m.personId ? (index.people.get(m.personId) as Person | undefined) : undefined;
              if (!p) return null;
              return <Node key={p.id} person={p} teller={p.id === tellerId} line={lineFor(p)} x={(c.x + i * PW) * KX} y={c.y * KY} w={PW * KX} />;
            }),
          )}
          <button type="button" className="tnode add" onClick={onAdd} style={{ left: drawing.add.x * KX, top: drawing.add.y * KY, width: PW * KX }}>
            <span className="av ph" aria-hidden="true">
              <PlusIcon />
            </span>
            <strong>Add a person</strong>
            <span>a sibling, a cousin, a friend</span>
          </button>
        </div>
      </div>
      {others.length > 0 && (
        <div className="also">
          <p className="label quiet">Also in the family</p>
          <div className="alsorow">
            {others.map((p) => (
              <Link key={p.id} className="alsonode" to={`/family/${p.id}`}>
                <NodeAvatar person={p} teller={false} />
                <strong>{personName(p)}</strong>
                <span>{lineFor(p)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
