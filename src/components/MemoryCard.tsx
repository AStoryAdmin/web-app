/**
 * One memory as a card: the paper it was kept under (or its chapter's
 * tint), the chapter chip, a serif title, the date in the family's words,
 * two lines of the memory, and who told it.
 */
import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import { cardMeta } from "../app-core/lib/memoryCard.js";
import { CHAPTER_COLOR } from "../app-core/theme/index.js";
import { usePhotoUrl } from "../lib/photoUrls";
import { LeafIcon, MicIcon } from "./icons";
import type { Memory, Story } from "../data/stories";
import { paperFor, toldBy } from "../lib/memoryDisplay";


export default function MemoryCard({ memory, story, style }: { memory: Memory; story: Story; style?: CSSProperties }) {
  const meta = cardMeta(story, memory) as { title: string; chapter: string; date: string; quote: string; photo: string | null };
  const photo = usePhotoUrl(meta.photo);
  const chapterColour = (CHAPTER_COLOR as Record<string, string>)[memory.era];
  return (
    <Link className={`mem ${paperFor(memory)} rise`} to={`/archive/${memory.id}`} style={style}>
      {photo ? (
        <img className="pic" src={photo} alt="" loading="lazy" />
      ) : (
        <div className="pic nopic" aria-hidden="true">
          <span className="story-q">{meta.title.slice(0, 1)}</span>
        </div>
      )}
      <div className="body">
        <div className="chips">
          <span className="chip" style={chapterColour ? { color: chapterColour, background: `color-mix(in srgb, ${chapterColour} 12%, white)` } : undefined}>
            <LeafIcon />
            {meta.chapter}
          </span>
          {memory.audio?.length > 0 && (
            <span className="chip accent">
              <MicIcon /> Voice
            </span>
          )}
        </div>
        <h3>{meta.title}</h3>
        <p className="meta">{meta.date}</p>
        {meta.quote && <p className="excerpt">{meta.quote}</p>}
        <div className="foot">
          <span className="meta">{toldBy(memory, story)}</span>
        </div>
      </div>
    </Link>
  );
}
