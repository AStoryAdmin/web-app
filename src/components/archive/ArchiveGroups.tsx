/**
 * The groups the Archive lists: a year with its memories, the calls A Story
 * is still writing up, and the memories nobody has dated yet.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MemoryCard from "../MemoryCard";
import PrintCard from "../PrintCard";
import { listContributions, type Contribution } from "../../data/contributions";
import { groupSides } from "../../lib/seenSides";
import { useAuth } from "../../state/authContext";
import { MicIcon } from "../icons";
import { usePhotoUrl } from "../../lib/photoUrls";
import { ageAt } from "../../app-core/lib/timeline.js";
import type { Memory, Story } from "../../data/stories";

export type YearGroupT = { key: string; year: number | null; label: string; ageLabel: string | null; undated?: boolean; items: Memory[] };

/** How the Archive shows a group's memories: as a mosaic of prints, or as the rows down the rail. */
export type ArchiveView = "prints" | "list";

function Cards({ items, story }: { items: Memory[]; story: Story }) {
  return (
    <div className="arc-cards">
      {items.map((m) => (
        <MemoryCard key={m.id} memory={m} story={story} rise={false} />
      ))}
    </div>
  );
}

/**
 * The years the Archive still lacks, as one small task with the time it
 * takes (Bao's Standard rule 34), never "No date yet" on every card: it
 * opens the first undated memory at its "when" step.
 */
export function DateTask({ items }: { items: Memory[] }) {
  if (!items.length) return null;
  const n = items.length;
  const minutes = Math.max(1, Math.round((n * 15) / 60));
  return (
    <Link className="arc-task" to={`/write?edit=${items[0].id}&details=1`}>
      Give {n === 1 ? "it" : `${num(n)} memories`} a year
      {" · "}
      {/* the time and the arrow are one piece that never breaks: "about 2 minutes →" moves to the next line whole */}
      <span className="arc-task-t">
        about {minutes} {minutes === 1 ? "minute" : "minutes"}
        <span className="arc-task-arrow" aria-hidden="true">
          →
        </span>
      </span>
    </Link>
  );
}

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

export function YearGroup({ group, story, decade }: { group: YearGroupT; story: Story; decade: number | null }) {
  const note = yearNote(group, story);
  return (
    <section aria-labelledby={`y${group.key}-h`}>
      <div className="arc-year" id={`y${group.key}`} data-decade={decade ?? undefined} data-arrive>
        <h2 id={`y${group.key}-h`}>{group.label}</h2>
        {group.ageLabel && <span>{group.ageLabel}</span>}
      </div>
      {note && (
        <p className="arc-yearnote" data-arrive>
          {note}
        </p>
      )}
      <Cards items={group.items} story={story} />
    </section>
  );
}

export function UndatedGroup({ items, story }: { items: Memory[]; story: Story }) {
  return (
    <section aria-labelledby="yundated-h">
      <div className="arc-year" id="yundated" data-arrive>
        <h2 id="yundated-h">Not dated yet</h2>
        <DateTask items={items} />
      </div>
      <Cards items={items} story={story} />
    </section>
  );
}

function InProgressRow({ memory, story }: { memory: Memory; story: Story }) {
  const photo = usePhotoUrl(memory.cover || memory.photos[0]);
  const when = memory.period ? `${memory.period} · ` : "";
  return (
    <Link className="arc-rec" to={`/archive/${memory.id}`}>
      {photo ? (
        <img className="pic" src={photo} alt="" loading="lazy" />
      ) : (
        <span className="pic nopic" aria-hidden="true">
          <MicIcon />
        </span>
      )}
      <div>
        <span className="dot">{story.name}’s call</span>
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

/**
 * The Prints view as one sheet: the prints of the whole archive in one
 * grid, each year opening with a heading row across it (the year in
 * terracotta, as the book's chapter openers set it, how old they were, and
 * the year's own line when it has three memories or more). "Not dated yet"
 * comes last, with the one task that dates them.
 */
export function PrintsFlow({ groups, story }: { groups: (YearGroupT & { decade: number | null })[]; story: Story }) {
  const { user } = useAuth();
  const [sides, setSides] = useState<Map<string, Contribution[]>>(() => new Map());
  const email = user?.email;
  const firstName = user?.firstName;
  useEffect(() => {
    let live = true;
    listContributions(story.id, "approved")
      .then((rows) => live && setSides(groupSides(rows, { email, firstName })))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [story.id, email, firstName]);

  let index = 0;
  return (
    <div className="arc-prints">
      <div className="mosaic arc-flow">
        {groups.flatMap((g) => {
          const note = yearNote(g, story);
          // the year as a heading row across the sheet, the book's chapter opener in small
          const tile = (
            <div key={`t-${g.key}`} className={`arc-year arc-yrow${g.undated ? " undated" : ""}`} id={`y${g.key}`} data-decade={g.decade ?? undefined} data-arrive>
              <h2 id={`y${g.key}-h`}>{g.undated ? "Not dated yet" : g.label}</h2>
              {g.ageLabel && <span>{g.ageLabel}</span>}
              {g.undated ? <DateTask items={g.items} /> : note ? <span className="arc-yrow-note">{note}</span> : null}
            </div>
          );
          const prints = g.items.map((m) => (
            <div key={m.id} className="cell tall">
              <PrintCard memory={m} story={story} size="tall" sides={sides.get(m.id) || []} index={index++} rise={false} />
            </div>
          ));
          return [tile, ...prints];
        })}
      </div>
    </div>
  );
}
