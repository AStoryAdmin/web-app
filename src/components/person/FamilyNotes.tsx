/**
 * "A note from family": what this person sent for the story, each as a
 * card with a star, the words in the book's body face and, under them,
 * which memory it was for. Only what a keeper has kept; nothing pending.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listContributions, type Contribution } from "../../data/contributions";
import { isTreasured } from "../../lib/treasured";
import { smarten } from "../../lib/typography";
import { StarIcon } from "../archive/Treasure";
import { noteIsFrom } from "./personRail";
import type { Person } from "../../data/family";
import type { Story } from "../../data/stories";

export default function FamilyNotes({ person, story, preview }: { person: Person; story: Story; preview?: boolean }) {
  const [notes, setNotes] = useState<Contribution[]>([]);
  useEffect(() => {
    if (preview) return;
    let live = true;
    listContributions(story.id, "approved")
      .then((rows) => live && setNotes(rows.filter((c) => String(c.body || "").trim() && noteIsFrom(c, person))))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [story.id, person.id, person.givenName, person.familyName, person, preview]);

  if (!notes.length) return null;
  const first = person.givenName || "them";
  return (
    <section className="pp-notes" aria-labelledby="pp-notes-h" data-rise>
      <h2 id="pp-notes-h">A note from {first}</h2>
      <div className="pp-notegrid">
        {notes.slice(0, 4).map((c) => {
          const about = c.memoryId ? story.memories.find((m) => m.id === c.memoryId) : null;
          const starred = about ? isTreasured(about) : false;
          return (
            <article key={c.id} className="pp-note">
              <StarIcon filled={starred} className={starred ? "on" : undefined} />
              <p className="pp-note-words">{smarten(c.body)}</p>
              <p className="pp-note-for">
                {about ? (
                  <>
                    on <Link to={`/archive/${about.id}`}>{about.title?.trim() || "Untitled"}</Link>
                  </>
                ) : (
                  c.title?.trim() || "for the story"
                )}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
