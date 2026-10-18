/**
 * The rail on a person's page: a vertical terracotta line down the left
 * with a dot for each memory, and the memories hanging off it, the
 * photograph as a small white-bordered print on the left, the title in the
 * book's display face, the date and chapter, one line of the words.
 * Oldest at the top, the newest last. When the memories were told by
 * somebody else (`tellerOf`), each one carries its teller's face and name,
 * and its date is never turned into an age: the age a story knows is its
 * own subject's, not the person who sent the memory in (BAOS 17, 29).
 */
import { useRef } from "react";
import { Link } from "react-router-dom";
import { dateLine } from "../../app-core/lib/memoryCard.js";
import { memoryDate } from "../../app-core/lib/timeline.js";
import { usePhotoUrl } from "../../lib/photoUrls";
import { paperFor } from "../../lib/memoryDisplay";
import { isTreasured } from "../../lib/treasured";
import { StarIcon } from "../archive/Treasure";
import Portrait from "../family/Portrait";
import { oneLine, type Found } from "./personRail";
import { useRail } from "./railMotion";
import type { Memory } from "../../data/stories";

export type Teller = { name: string; photo?: string | null; given?: string; family?: string };

function cover(m: Memory): string | null {
  const all = m.photos || [];
  return (m.cover && all.includes(m.cover) ? m.cover : all[0]) || null;
}

function RailCard({ story, memory, teller, preview }: Found & { teller: Teller | null; preview?: boolean }) {
  const photo = usePhotoUrl(cover(memory));
  const paper = paperFor(memory);
  const words = oneLine(memory);
  // An account somebody else sent in is dated as they dated it, never as the subject's age.
  const date = teller || memory.contributor ? ((memoryDate(memory) as { text: string }).text.trim() || "No date yet") : (dateLine(story, memory) as string);
  const to = preview ? "#" : `/archive/${memory.id}`;
  return (
    <li className="pp-item">
      <span className="pp-dot" aria-hidden="true" />
      <Link className={`pp-card${cover(memory) ? "" : " text"}${paper ? ` ${paper}` : ""}`} to={to} onClick={preview ? (e) => e.preventDefault() : undefined}>
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
            {memory.era && <span className="chap"> · {memory.era}</span>}
          </span>
          {words && <span className="pp-words">{words}</span>}
          {teller && (
            <span className="pp-teller">
              <Portrait photo={teller.photo} given={teller.given || teller.name} family={teller.family} size={28} />
              <span>Told by {teller.name}</span>
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}

export default function MemoryRail({ items, label, tellerOf, preview }: { items: Found[]; label: string; tellerOf?: (f: Found) => Teller | null; preview?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  useRail(root, items.map((f) => f.memory.id).join("|"));
  if (!items.length) return null;
  return (
    <div className="pp-rail" ref={root} aria-label={label}>
      <span className="pp-line" aria-hidden="true" />
      <ol className="pp-list">
        {items.map((f) => (
          <RailCard key={f.memory.id} {...f} teller={tellerOf ? tellerOf(f) : null} preview={preview} />
        ))}
      </ol>
    </div>
  );
}
