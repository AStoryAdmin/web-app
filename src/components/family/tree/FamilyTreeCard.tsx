/**
 * The family tree card: the drawing on its sheet, and under it the people
 * not placed yet, each of whom can be dragged onto somebody in the tree or
 * placed with one click ("Add as Rose's sister"). With one person it shows
 * the storyteller with four ghosted places that invite; with two, the pair.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Family, Person } from "../../../data/family";
import type { Story } from "../../../data/stories";
import { buildIndex } from "../../../app-core/lib/familyGraph.js";
import { DESKTOP, PHONE, layoutFamily, type LayoutPerson } from "../../../lib/familyLayout";
import { usePhotoUrl } from "../../../lib/photoUrls";
import { Button } from "../../ui";
import { firstName, realPeople, type Index } from "../familyView";
import TreeCanvas from "./TreeCanvas";
import { ghostFamily, nodeInfos, PLACE_KINDS, placeWord, treePeople, treeTitle, type GhostKind, type NodeInfo } from "./treeModel";

type Props = {
  family: Family | null;
  story: Story;
  meId: string | null | undefined;
  own: boolean;
  /** The sample family is for looking: nothing on it writes. */
  preview?: boolean;
  onAdd: (anchor: Person | null, kind: GhostKind | null) => void;
  onPlace: (person: Person, anchor: Person, kind: GhostKind) => void;
  canPlace: (person: Person) => boolean;
};

function usePhone(): boolean {
  const [phone, setPhone] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const on = () => setPhone(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return phone;
}

function ShelfPrint({ info }: { info: NodeInfo }) {
  const photo = usePhotoUrl(info.photo);
  return (
    <span className={`ft-print small ${info.state}`} aria-hidden="true">
      <span className="ft-pic" style={{ background: info.tint }}>
        {photo ? <img src={photo} alt="" draggable={false} /> : <span className="ft-initial">{info.initial}</span>}
      </span>
    </span>
  );
}

function ShelfItem({ person, info, anchor, canPlace, onPlace }: { person: Person; info: NodeInfo; anchor: Person | null; canPlace: boolean; onPlace: (kind: GhostKind) => void }) {
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
  return (
    <div
      ref={box}
      className="ft-shelfitem"
      draggable={canPlace && !!anchor}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/ft-person", person.id);
        e.dataTransfer.effectAllowed = "link";
      }}
    >
      <ShelfPrint info={info} />
      <span className="ft-shelfwho">
        {info.href ? (
          <Link className="ft-name" to={info.href}>
            {info.name}
          </Link>
        ) : (
          <span className="ft-name">{info.name}</span>
        )}
        <span className="ft-state">{[info.years.replace(/ –$/, ""), info.stateWord].filter(Boolean).join(" · ")}</span>
      </span>
      {canPlace && anchor && (
        <Button variant="quiet" small aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          Place
        </Button>
      )}
      {open && anchor && (
        <div className="ft-menu shelf" role="menu" aria-label={`Place ${firstName(person)}`}>
          <p>Place {firstName(person)}</p>
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

export default function FamilyTreeCard({ family, story, meId, own, preview, onAdd, onPlace, canPlace }: Props) {
  const phone = usePhone();
  const index = useMemo(() => buildIndex(family || { people: [], edges: [] }) as Index, [family]);
  const people = useMemo(() => treePeople(realPeople(family), story), [family, story]);
  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const teller = people.find((p) => p.storyId === story.id) || null;
  const focusId = teller?.id || people.find((p) => p.userId === meId)?.id || people[0]?.id || null;

  const { layout, infos, placed } = useMemo(() => {
    const opts = phone ? PHONE : DESKTOP;
    const ctx = { story, index, tellerId: teller?.id || null, meId };
    const infos = nodeInfos(people, ctx);
    const persons: LayoutPerson[] = people.map((p) => ({ id: p.id, birthYear: p.birthYear, deathYear: p.deathYear, sex: p.sex }));
    let layout = layoutFamily(persons, family?.edges || [], focusId, opts);
    const placed = layout.nodes.length;
    if (placed === 1 && focusId) {
      // A lone storyteller: four places around them that invite.
      const focus = persons.find((p) => p.id === focusId)!;
      const ghosts = ghostFamily(focus);
      layout = { ...layoutFamily(ghosts.people, ghosts.edges, focusId, opts), unplaced: layout.unplaced };
      for (const [id, g] of ghosts.infos) infos.set(id, g);
    }
    return { layout, infos, placed };
  }, [people, family, focusId, phone, story, index, teller, meId]);

  const unplaced = layout.unplaced.map((id) => byId.get(id)).filter((p): p is Person => !!p && !p.id.startsWith("story:"));
  const anchor = focusId ? byId.get(focusId) || null : null;
  const realAnchor = anchor && !anchor.id.startsWith("story:") ? anchor : null;
  const title = treeTitle(placed, story, own, layout.rows.length);
  const firstNameOf = (id: string) => firstName(byId.get(id));

  return (
    <section className="card ftree" aria-label="Family tree">
      <div className="ft-head">
        <h2>{title}</h2>
        {preview && <p className="meta">A sample family, for looking</p>}
      </div>
      <TreeCanvas
        layout={layout}
        infos={infos}
        phone={phone}
        canAdd
        firstNameOf={firstNameOf}
        onAdd={(anchorId, kind) => onAdd(byId.get(anchorId) && !anchorId.startsWith("story:") ? byId.get(anchorId)! : null, kind)}
        onPlace={(personId, anchorId, kind) => {
          const p = byId.get(personId);
          const a = byId.get(anchorId);
          if (p && a && !a.id.startsWith("story:")) onPlace(p, a, kind);
        }}
      />
      {unplaced.length > 0 && (
        <div className="ft-shelf">
          <p className="label quiet">Not placed yet</p>
          <p className="meta">
            {realAnchor ? `Drag them onto someone in the tree, or place them beside ${firstName(realAnchor)}.` : "They are in the family, but nobody has said where yet."}
          </p>
          <div className="ft-shelfrow">
            {unplaced.map((p) => (
              <ShelfItem key={p.id} person={p} info={infos.get(p.id)!} anchor={realAnchor} canPlace={!preview && canPlace(p)} onPlace={(kind) => realAnchor && onPlace(p, realAnchor, kind)} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
