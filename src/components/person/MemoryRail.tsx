/**
 * The rail on a person's page: a vertical terracotta line down the left
 * with a dot for each memory, and the memories hanging off it as cards,
 * the photograph as a small white-bordered print on the left, the title in
 * the book's display face, the dateline and chapter, one line of the
 * words. Oldest at the top, the newest last.
 */
import { useRef } from "react";
import { Link } from "react-router-dom";
import { dateLine } from "../../app-core/lib/memoryCard.js";
import { usePhotoUrl } from "../../lib/photoUrls";
import { paperFor } from "../../lib/memoryDisplay";
import { isTreasured } from "../../lib/treasured";
import { StarIcon } from "../archive/Treasure";
import { oneLine, type Found } from "./personRail";
import { useRail } from "./railMotion";
import type { Memory } from "../../data/stories";

function cover(m: Memory): string | null {
  const all = m.photos || [];
  return (m.cover && all.includes(m.cover) ? m.cover : all[0]) || null;
}

function RailCard({ story, memory }: Found) {
  const photo = usePhotoUrl(cover(memory));
  const paper = paperFor(memory);
  const words = oneLine(memory);
  const date = dateLine(story, memory) as string;
  return (
    <li className="pp-item">
      <span className="pp-dot" aria-hidden="true" />
      <Link className={`pp-card${cover(memory) ? "" : " text"}${paper ? ` ${paper}` : ""}`} to={`/archive/${memory.id}`}>
        {cover(memory) && (
          <span className="pp-print" aria-hidden="true">
            <img src={photo ?? undefined} alt="" loading="lazy" data-develop />
          </span>
        )}
        <span className="pp-body">
          <span className="pp-title">
            {memory.title?.trim() || "Untitled"}
            {isTreasured(memory) && <StarIcon filled width={14} height={14} />}
          </span>
          <span className="pp-date">
            <span className={date === "No date yet" ? "when" : "when dated"}>{date}</span>
            {memory.era && (
              <>
                <i aria-hidden="true">|</i>
                <span className="chap">{memory.era}</span>
              </>
            )}
          </span>
          {words && <span className="pp-words">{words}</span>}
        </span>
      </Link>
    </li>
  );
}

export default function MemoryRail({ items, label }: { items: Found[]; label: string }) {
  const root = useRef<HTMLDivElement>(null);
  useRail(root, items.map((f) => f.memory.id).join("|"));
  if (!items.length) return null;
  return (
    <div className="pp-rail" ref={root} aria-label={label}>
      <span className="pp-line" aria-hidden="true" />
      <ol className="pp-list">
        {items.map((f) => (
          <RailCard key={f.memory.id} {...f} />
        ))}
      </ol>
    </div>
  );
}
