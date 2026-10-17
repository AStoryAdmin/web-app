/**
 * The groups the Archive lists: a year with its memories, the calls A Story
 * is still writing up, and the memories nobody has dated yet.
 */
import { Link } from "react-router-dom";
import MemoryCard from "../MemoryCard";
import Mosaic from "../Mosaic";
import { MicIcon } from "../icons";
import { usePhotoUrl } from "../../lib/photoUrls";
import { ageAt } from "../../app-core/lib/timeline.js";
import type { Memory, Story } from "../../data/stories";

export type YearGroupT = { key: string; year: number | null; label: string; ageLabel: string | null; undated?: boolean; items: Memory[] };

/** How the Archive shows a group's memories: as a mosaic of prints, or as the rows down the rail. */
export type ArchiveView = "prints" | "list";

function Cards({ items, story, view }: { items: Memory[]; story: Story; view: ArchiveView }) {
  if (view === "prints") return <Mosaic memories={items} story={story} lead={false} rise={false} />;
  return (
    <div className="arc-cards">
      {items.map((m, i) => (
        <MemoryCard key={m.id} memory={m} story={story} style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }} />
      ))}
    </div>
  );
}

const countOf = (n: number) => `${n} ${n === 1 ? "memory" : "memories"}`;

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const num = (n: number) => WORDS[n] ?? String(n);
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

/**
 * A year with three or more memories gets a line about itself: how old they
 * were, which chapters it touched, what it carries. The year as a chapter of
 * its own, read before its memories.
 */
function yearNote(group: YearGroupT, story: Story): string | null {
  const items = group.items;
  if (items.length < 3 || group.year == null) return null;
  const own = story.relationship === "Myself";
  const who = own ? "You" : story.name;
  const age = ageAt(story, group.year) as number | null;
  const parts: string[] = [];
  if (age != null) parts.push(age === 0 ? `${who} ${own ? "were" : "was"} born that year.` : `${who} ${own ? "were" : "was"} ${age} that year.`);
  const chapters = [...new Set(items.map((m) => m.era).filter(Boolean))];
  const photos = items.filter((m) => m.photos?.length).length;
  const calls = items.filter((m) => m.audio?.length).length;
  let line = `${num(items.length)[0].toUpperCase()}${num(items.length).slice(1)} memories ${chapters.length === 1 ? `in ${chapters[0]}` : `across ${list(chapters)}`}`;
  const extras: string[] = [];
  if (photos) extras.push(photos === 1 ? "one with a photograph" : `${num(photos)} with photographs`);
  if (calls) extras.push(calls === 1 ? "one told on a call" : `${num(calls)} told on calls`);
  if (extras.length) line += `; ${list(extras)}`;
  parts.push(`${line}.`);
  return parts.join(" ");
}

export function YearGroup({ group, story, decade, view = "list" }: { group: YearGroupT; story: Story; decade: number | null; view?: ArchiveView }) {
  const note = yearNote(group, story);
  return (
    <section aria-labelledby={`y${group.key}-h`}>
      <div className="arc-year" id={`y${group.key}`} data-decade={decade ?? undefined} data-arrive>
        <h2 id={`y${group.key}-h`}>{group.label}</h2>
        <span>{[group.ageLabel, countOf(group.items.length)].filter(Boolean).join(" · ")}</span>
      </div>
      {note && (
        <p className="arc-yearnote" data-arrive>
          {note}
        </p>
      )}
      <Cards items={group.items} story={story} view={view} />
    </section>
  );
}

export function UndatedGroup({ items, story, view = "list" }: { items: Memory[]; story: Story; view?: ArchiveView }) {
  return (
    <section aria-labelledby="yundated-h">
      <div className="arc-year" id="yundated" data-arrive>
        <h2 id="yundated-h">Not dated yet</h2>
        <span>{countOf(items.length)}</span>
      </div>
      <p className="arc-hint">Open one to add a year.</p>
      <Cards items={items} story={story} view={view} />
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
