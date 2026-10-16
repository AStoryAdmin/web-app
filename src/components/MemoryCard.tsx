/**
 * One memory as a card, in the deck's language: the photograph warm and
 * large, the chapter as a yellow pill, a serif title, the date in ochre,
 * two lines of the words, who told it, and a small lock when it is
 * private. Without a photograph the card is the words alone, opened by a
 * large quotation mark.
 */
import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import { cardMeta } from "../app-core/lib/memoryCard.js";
import { usePhotoUrl } from "../lib/photoUrls";
import { LockIcon, MicIcon } from "./icons";
import type { Memory, Story } from "../data/stories";
import { toldBy } from "../lib/memoryDisplay";

export default function MemoryCard({ memory, story, style }: { memory: Memory; story: Story; style?: CSSProperties }) {
  const meta = cardMeta(story, memory) as { title: string; chapter: string; date: string; quote: string; photo: string | null };
  const photo = usePhotoUrl(meta.photo);
  const text = !meta.photo;
  return (
    <Link className={`mem${text ? " text" : ""} rise`} to={`/archive/${memory.id}`} style={style}>
      {text ? (
        <span className="glyph" aria-hidden="true">
          “
        </span>
      ) : (
        <img className="pic" src={photo ?? undefined} alt="" loading="lazy" />
      )}
      <div className="body">
        <div className="chips">
          <span className="pill gold">{meta.chapter}</span>
          {memory.audio?.length > 0 && (
            <span className="pill cream">
              <MicIcon /> Voice
            </span>
          )}
        </div>
        <h3>{meta.title}</h3>
        <p className="date">{meta.date}</p>
        {meta.quote && <p className="excerpt">{meta.quote}</p>}
        <div className="foot">
          <span>{toldBy(memory, story)}</span>
          {memory.privacy === "private" && (
            <span className="lock">
              <LockIcon /> Private
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
