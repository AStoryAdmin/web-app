/**
 * One memory as a card: compact and warm, the way the app's own designs
 * draw it, in the printed book's language (astoryapp.com/samples). The
 * photograph as a white-bordered print on the left; the chapter as a sage
 * kicker and, on the right, "Live conversation · 16 min" or a lock; the
 * title in the book's display face; the dateline in terracotta; two lines
 * of the person's OWN words (never the server's third-person summary); the
 * faces of the people in it; who told it as a small portrait, not a sentence. The paper is
 * the memory's chosen colour, else its chapter's tint.
 */
import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import { cardMeta, quoteFor } from "../app-core/lib/memoryCard.js";
import { usePhotoUrl } from "../lib/photoUrls";
import { useAccount } from "../state/accountContext";
import { Avatar } from "./ui";
import { LockIcon, MicIcon } from "./icons";
import { StarIcon } from "./archive/Treasure";
import { isTreasured } from "../lib/treasured";
import { opening } from "../lib/resurface";
import { smarten } from "../lib/typography";
import type { Memory, Story } from "../data/stories";
import { paperFor, toldBy } from "../lib/memoryDisplay";

const minutes = (memory: Memory) => {
  const s = (memory.audio || []).reduce((a, c) => a + (c.duration || 0), 0);
  return s >= 60 ? `${Math.round(s / 60)} min` : s > 0 ? `${Math.round(s)} sec` : "";
};

/** The person's own words for the card: the first real sentence of what they said, never the summary. */
function cardWords(memory: Memory): string {
  const body = (memory.body || "").trim();
  if (body) return smarten(quoteFor(opening(body) || body, 150) as string);
  const ex = (memory.excerpt || "").trim();
  if (/^the (speaker|narrator|storyteller)\b/i.test(ex)) return "";
  return smarten(quoteFor(ex, 150) as string);
}

export default function MemoryCard({ memory, story, style }: { memory: Memory; story: Story; style?: CSSProperties }) {
  const { family } = useAccount();
  const meta = cardMeta(story, memory) as { title: string; chapter: string; date: string; photo: string | null; photoCount: number };
  const photo = usePhotoUrl(meta.photo);
  const tellerPhoto = usePhotoUrl(memory.contributor ? null : story.photo);
  const teller = memory.contributor ? memory.contributor.split(",")[0].trim() : story.name;
  const words = cardWords(memory);
  const voice = memory.audio?.length > 0;
  const dated = meta.date !== "No date yet";
  const people = (memory.personIds || [])
    .map((id) => family?.people.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .slice(0, 4);
  const paper = paperFor(memory);
  return (
    <Link className={`mem${meta.photo ? "" : " text"}${paper ? ` ${paper}` : ""} rise`} to={`/archive/${memory.id}`} style={style}>
      {meta.photo && (
        <span className="print" aria-hidden="true">
          <img className="pic" src={photo ?? undefined} alt="" loading="lazy" />
          {meta.photoCount > 1 && <span className="n">+{meta.photoCount - 1}</span>}
        </span>
      )}
      <div className="body">
        <div className="chips">
          <span className="kicker">{meta.chapter}</span>
          {isTreasured(memory) && (
            <span className="kicker treasured">
              <StarIcon filled width={11} height={11} /> Treasured
            </span>
          )}
          <span className="grow" />
          {voice && (
            <span className="kicker quiet">
              <MicIcon /> Live conversation{minutes(memory) ? ` · ${minutes(memory)}` : ""}
            </span>
          )}
          {memory.privacy === "private" && (
            <span className="kicker quiet">
              <LockIcon /> Private
            </span>
          )}
        </div>
        <h3>{meta.title}</h3>
        <p className={`date${dated ? " dated" : ""}`}>{meta.date}</p>
        {words && <p className="excerpt">{words}</p>}
        <div className="foot">
          {people.length > 0 ? (
            <span className="faces" aria-label={people.map((p) => p.givenName).join(", ")}>
              {people.slice(0, 3).map((p) => (
                <Avatar key={p.id} name={p.givenName || "?"} size={24} />
              ))}
              {people.length > 3 && <span className="more-n">+{people.length - 3}</span>}
            </span>
          ) : (
            <span />
          )}
          <span className="told" title={toldBy(memory, story)}>
            <Avatar src={tellerPhoto} name={teller} size={26} />
            <span className="sr-only">{toldBy(memory, story)}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
