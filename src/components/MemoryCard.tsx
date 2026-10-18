/**
 * One memory as a card: compact and warm, in the printed book's language
 * (astoryapp.com/samples). The photograph as a white-bordered print on the
 * left; the chapter as a sage kicker (none for "Anything else", which is
 * not a chapter), a wax seal over the card's corner when it is treasured, and on the right "Live
 * conversation · 16 min" or a lock; the title in the book's display face;
 * the date in terracotta when there is one (undated memories say nothing
 * here; the Archive asks once); the person's kept line, their own words,
 * never the server's third-person summary; the faces of the people in it;
 * who told it as a small portrait. Every card is on the book's print paper
 * (--paper-print): the chapter tint was decided against, because a tinted
 * card on the sheet read as a coloured bubble (founder, 17 Oct).
 */
import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import { cardMeta } from "../app-core/lib/memoryCard.js";
import { usePhotoUrl } from "../lib/photoUrls";
import { useAccount } from "../state/accountContext";
import { Avatar } from "./ui";
import { LockIcon, MicIcon } from "./icons";
import WaxSeal from "./archive/WaxSeal";
import { takeaway } from "./archive/transcript";
import Face from "./archive/Face";
import { loadedRef, onLoaded } from "./archive/develop";
import { realChapter } from "./archive/photos";
import { isTreasured } from "../lib/treasured";
import { smarten } from "../lib/typography";
import type { Memory, Story } from "../data/stories";
import { toldBy } from "../lib/memoryDisplay";

const minutes = (memory: Memory) => {
  const s = (memory.audio || []).reduce((a, c) => a + (c.duration || 0), 0);
  return s >= 60 ? `${Math.round(s / 60)} min` : s > 0 ? `${Math.round(s)} sec` : "";
};

/** The person's own words for the card: the memory's one takeaway, whole (the page shows the same line); never the summary. */
function cardWords(memory: Memory): string {
  const line = takeaway(memory.body || "");
  if (line) return smarten(line);
  const ex = (memory.excerpt || "").trim();
  return /^the (speaker|narrator|storyteller)\b/i.test(ex) ? "" : smarten(ex.split(/(?<=[.!?])\s/)[0] || "");
}

export default function MemoryCard({ memory, story, style, rise = true }: { memory: Memory; story: Story; style?: CSSProperties; /** Its own CSS arrival; off where the page’s scroll hook owns the entrance. */ rise?: boolean }) {
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
  return (
    <Link className={`mem${meta.photo ? "" : " text"}${rise ? " rise" : ""}`} to={`/archive/${memory.id}`} style={style}>
      {/* the seal over the card's corner, as on the prints: never a row of its own above the title */}
      {isTreasured(memory) && <WaxSeal size={26} className="mem-seal" label="Treasured" />}
      {meta.photo && (
        <span className="print" aria-hidden="true">
          <img className="pic" src={photo ?? undefined} alt="" loading="lazy" ref={loadedRef} onLoad={onLoaded} />
          {meta.photoCount > 1 && <span className="n">+{meta.photoCount - 1}</span>}
        </span>
      )}
      <div className="body">
        <div className="chips">
          {realChapter(meta.chapter) && <span className="kicker">{meta.chapter}</span>}
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
        <h3>{smarten(meta.title)}</h3>
        {dated && <p className="date dated">{meta.date}</p>}
        {words && <p className="excerpt">{words}</p>}
        <div className="foot">
          {people.length > 0 ? (
            <span className="faces" aria-label={people.map((p) => p.givenName).join(", ")}>
              {people.slice(0, 3).map((p) => (
                <Face key={p.id} person={p} size={24} />
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
