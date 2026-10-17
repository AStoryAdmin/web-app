/**
 * One person on the tree: a white-bordered print, tilted a degree or two
 * and straightening under the pointer; the photograph, or their initial on
 * chapter-tinted paper; the name in the book's face; the years; the state
 * in the product's words with its ring (dashed, dotted with an envelope,
 * solid). The storyteller wears a terracotta ribbon. A quiet caption and a
 * "+" appear under the pointer (or on keyboard focus). A ghost is one of
 * the four places that invite around a lone storyteller.
 */
import { Link } from "react-router-dom";
import { usePhotoUrl } from "../../../lib/photoUrls";
import { MailIcon, PlusIcon } from "../../icons";
import type { TreeNode as Placed } from "../../../lib/familyLayout";
import type { NodeInfo } from "./treeModel";

type Props = {
  node: Placed;
  info: NodeInfo;
  nodeW: number;
  printH: number;
  tilt: number;
  canAdd: boolean;
  onAdd: (anchorId: string) => void;
  onGhost: (anchorId: string, kind: NodeInfo["ghost"]) => void;
  onDropPerson: (personId: string, anchorId: string) => void;
  focusId: string | null;
};

function Picture({ info }: { info: NodeInfo }) {
  const photo = usePhotoUrl(info.photo);
  return (
    <span className="ft-pic" style={{ background: info.tint }}>
      {photo ? <img src={photo} alt="" draggable={false} /> : <span className="ft-initial" aria-hidden="true">{info.initial}</span>}
      {info.teller && <span className="ft-ribbon">Storyteller</span>}
    </span>
  );
}

export default function TreeNode({ node, info, nodeW, printH, tilt, canAdd, onAdd, onGhost, onDropPerson, focusId }: Props) {
  const style = { left: node.x, top: node.y, width: nodeW, "--tilt": `${tilt}deg`, "--print": `${printH}px` } as React.CSSProperties;
  const line = [info.years, info.stateWord].filter(Boolean).join(", ");

  if (info.ghost) {
    return (
      <div className="ft-node ghost" style={style} data-id={info.id} data-depth={node.depth}>
        <button type="button" className="ft-print" id={`ft-${info.id}`} onClick={() => onGhost(focusId || "", info.ghost)} aria-label={info.caption}>
          <span className="ft-pic">
            <PlusIcon />
          </span>
        </button>
        <span className="ft-name">{info.name}</span>
      </div>
    );
  }

  const print = (
    <>
      <Picture info={info} />
      {info.state === "invited" && (
        <span className="ft-env" aria-hidden="true">
          <MailIcon />
        </span>
      )}
    </>
  );
  const dnd = {
    onDragOver: (e: React.DragEvent) => {
      if (e.dataTransfer.types.includes("text/ft-person")) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "link";
      }
    },
    onDrop: (e: React.DragEvent) => {
      const id = e.dataTransfer.getData("text/ft-person");
      if (!id) return;
      e.preventDefault();
      onDropPerson(id, info.id);
    },
  };

  return (
    <div className={`ft-node ${info.state}${info.teller ? " teller" : ""}${node.focus ? " focus" : ""}`} style={style} data-id={info.id} data-depth={node.depth}>
      {info.href ? (
        <Link className="ft-print" id={`ft-${info.id}`} to={info.href} aria-label={`${info.name}${line ? `, ${line}` : ""}`} draggable={false} {...dnd}>
          {print}
        </Link>
      ) : (
        <span className="ft-print" id={`ft-${info.id}`} tabIndex={0} aria-label={`${info.name}${line ? `, ${line}` : ""}`} {...dnd}>
          {print}
        </span>
      )}
      <span className="ft-name">{info.name}</span>
      {info.years && <span className="ft-years">{info.years}</span>}
      {info.stateWord && <span className="ft-state">{info.stateWord}</span>}
      {info.caption && (
        <span className="ft-caption" role="note">
          {info.caption}
        </span>
      )}
      {canAdd && (
        <button type="button" className="ft-plus" aria-label={`Add someone related to ${info.name}`} onClick={() => onAdd(info.id)}>
          <span>
            <PlusIcon />
          </span>
        </button>
      )}
    </div>
  );
}
