/**
 * One memory as a card: the memory's page as the samples print it
 * (astoryapp.com/samples). A tracked kicker for the chapter in the book's
 * sage, the title in the book's display face, the dateline in terracotta
 * ("1966 · age 6"), the words as the italic summary in a soft panel, the
 * photograph as a white-bordered print, and in the folio line who told
 * it, or "Live conversation · 16 min", and a lock when it is private.
 */
import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import { cardMeta } from "../app-core/lib/memoryCard.js";
import { usePhotoUrl } from "../lib/photoUrls";
import { LockIcon } from "./icons";
import { StarIcon } from "./archive/Treasure";
import { isTreasured } from "../lib/treasured";
import type { Memory, Story } from "../data/stories";
import { toldBy } from "../lib/memoryDisplay";

const minutes = (memory: Memory) => {
  const s = (memory.audio || []).reduce((a, c) => a + (c.duration || 0), 0);
  return s >= 60 ? `${Math.round(s / 60)} min` : s > 0 ? `${Math.round(s)} sec` : "";
};

export default function MemoryCard({ memory, story, style }: { memory: Memory; story: Story; style?: CSSProperties }) {
  const meta = cardMeta(story, memory) as { title: string; chapter: string; date: string; quote: string; photo: string | null };
  const photo = usePhotoUrl(meta.photo);
  const text = !meta.photo;
  const voice = memory.audio?.length > 0;
  const folio = voice ? `Live conversation${minutes(memory) ? ` · ${minutes(memory)}` : ""}` : toldBy(memory, story);
  return (
    <Link className={`mem${text ? " text" : ""} rise`} to={`/archive/${memory.id}`} style={style}>
      <div className="body">
        <div className="chips">
          <span className="kicker">{meta.chapter}</span>
          {isTreasured(memory) && (
            <span className="kicker treasured">
              <StarIcon filled width={11} height={11} /> Treasured
            </span>
          )}
        </div>
        <h3>{meta.title}</h3>
        <p className={`date${meta.date === "No date yet" ? "" : " dated"}`}>{meta.date}</p>
        {meta.quote && <p className="excerpt">{meta.quote}</p>}
        <div className="foot">
          <span>{folio}</span>
          {memory.privacy === "private" && (
            <span className="lock">
              <LockIcon /> Private
            </span>
          )}
        </div>
      </div>
      {!text && (
        <span className="print" aria-hidden="true">
          <img className="pic" src={photo ?? undefined} alt="" loading="lazy" />
        </span>
      )}
    </Link>
  );
}
