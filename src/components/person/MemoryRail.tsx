/**
 * The rail on a person’s page: a vertical terracotta line down the left
 * with a dot for each memory, and the memories hanging off it, the
 * photograph as a small white-bordered print on the left, the title in the
 * book’s display face, the date and chapter, one line of the words.
 * Oldest at the top, the newest last. When the memories were told by
 * somebody else (`tellerOf`), each one carries its teller’s face and name,
 * and its date is never turned into an age: the age a story knows is its
 * own subject’s, not the person who sent the memory in (BAOS 17, 29). A
 * card with no date, or the fallback chapter, prints neither (the page
 * gathers the undated into one row); the memory the page quotes above
 * keeps to its title.
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

/** The chapter a memory falls into when nobody chose one; not worth printing on a card. */
const FALLBACK_CHAPTER = /^anything else$/i;

function RailCard({ story, memory, teller, preview, quoted }: Found & { teller: Teller | null; preview?: boolean; quoted?: boolean }) {
  const photo = usePhotoUrl(cover(memory));
  const paper = paperFor(memory);
  // the page’s plate already quotes this one: the card keeps to its title and date
  const words = quoted ? "" : oneLine(memory);
  // An account somebody else sent in is dated as they dated it, never as the subject’s age.
  const { dated, text } = memoryDate(memory) as { dated: boolean; text: string };
  const date = !dated ? "" : teller || memory.contributor ? text.trim() : (dateLine(story, memory) as string);
  const chapter = memory.era && !FALLBACK_CHAPTER.test(memory.era) ? memory.era : "";
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
          {(date || chapter) && (
            <span className="pp-date">
              {date && <span className="when dated">{date}</span>}
              {chapter && (
                <span className="chap">
                  {date ? " · " : ""}
                  {chapter}
                </span>
              )}
            </span>
          )}
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

export default function MemoryRail({ items, label, tellerOf, preview, quoted }: { items: Found[]; label: string; tellerOf?: (f: Found) => Teller | null; preview?: boolean; quoted?: string | null }) {
  const root = useRef<HTMLDivElement>(null);
  useRail(root, items.map((f) => f.memory.id).join("|"));
  if (!items.length) return null;
  return (
    <div className="pp-rail" ref={root} aria-label={label}>
      <span className="pp-line" aria-hidden="true" />
      <ol className="pp-list">
        {items.map((f) => (
          <RailCard key={f.memory.id} {...f} teller={tellerOf ? tellerOf(f) : null} preview={preview} quoted={!!quoted && f.memory.id === quoted} />
        ))}
      </ol>
    </div>
  );
}
