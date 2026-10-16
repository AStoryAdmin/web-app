/**
 * The groups the Archive lists: a year with its memories, the calls A Story
 * is still writing up, and the memories nobody has dated yet.
 */
import { Link } from "react-router-dom";
import MemoryCard from "../MemoryCard";
import { MicIcon } from "../icons";
import { usePhotoUrl } from "../../lib/photoUrls";
import type { Memory, Story } from "../../data/stories";

export type YearGroupT = { key: string; year: number | null; label: string; ageLabel: string | null; undated?: boolean; items: Memory[] };

const countOf = (n: number) => `${n} ${n === 1 ? "memory" : "memories"}`;

export function YearGroup({ group, story, decade }: { group: YearGroupT; story: Story; decade: number | null }) {
  return (
    <section aria-labelledby={`y${group.key}-h`}>
      <div className="arc-year" id={`y${group.key}`} data-decade={decade ?? undefined} data-arrive>
        <h2 id={`y${group.key}-h`}>{group.label}</h2>
        <span>{[group.ageLabel, countOf(group.items.length)].filter(Boolean).join(" · ")}</span>
      </div>
      <div className="arc-cards">
        {group.items.map((m, i) => (
          <MemoryCard key={m.id} memory={m} story={story} style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }} />
        ))}
      </div>
    </section>
  );
}

export function UndatedGroup({ items, story }: { items: Memory[]; story: Story }) {
  return (
    <section aria-labelledby="yundated-h">
      <div className="arc-year" id="yundated" data-arrive>
        <h2 id="yundated-h">Not dated yet</h2>
        <span>{countOf(items.length)}</span>
      </div>
      <p className="arc-hint">Open one to add a year.</p>
      <div className="arc-cards">
        {items.map((m, i) => (
          <MemoryCard key={m.id} memory={m} story={story} style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }} />
        ))}
      </div>
    </section>
  );
}

function InProgressRow({ memory, story }: { memory: Memory; story: Story }) {
  const photo = usePhotoUrl(memory.cover || memory.photos[0]);
  const when = memory.period ? `${memory.period} · ` : "";
  return (
    <Link className="arc-rec rise" to={`/archive/${memory.id}`}>
      {photo ? (
        <img className="pic" src={photo} alt="" loading="lazy" />
      ) : (
        <span className="pic nopic" aria-hidden="true">
          <MicIcon />
        </span>
      )}
      <div>
        <span className="dot">{story.name}'s call</span>
        <h3>{memory.title || "A conversation, still being written up"}</h3>
        <p className="meta">{when}A Story is still writing it up</p>
      </div>
    </Link>
  );
}

export function InProgressGroup({ items, story }: { items: Memory[]; story: Story }) {
  return (
    <section aria-labelledby="yprogress-h">
      <div className="arc-year" id="yprogress" data-arrive>
        <h2 id="yprogress-h">In progress</h2>
        <span>{items.length === 1 ? "1 call" : `${items.length} calls`}</span>
      </div>
      <div className="arc-cards">
        {items.map((m) => (
          <InProgressRow key={m.id} memory={m} story={story} />
        ))}
      </div>
    </section>
  );
}
