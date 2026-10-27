/**
 * A family tree somebody already built (the phone's FamilyImportScreen).
 * Not drawn: a genealogy export is hundreds of names and almost nothing
 * anybody said, and the one thing in it this product can act on is who is
 * still here to be asked. So the page lists those people, oldest first, then
 * the recently gone whom somebody still remembers, each with a box to start
 * a story. Everyone in the file joins the family either way.
 */
import { useMemo } from "react";
import { buildIndex, relationshipBetween, fullName } from "../../app-core/lib/familyGraph.js";
import { findAnchor, treePriorities, type GedcomPerson, type ImportedTree } from "../../data/imports";
import type { Story } from "../../data/stories";
import { Button } from "../ui";

export default function TreeReview({
  tree,
  sourceName,
  story,
  chosen,
  busy,
  progress,
  onToggle,
  onKeep,
  onBack,
}: {
  tree: ImportedTree;
  sourceName: string;
  story: Story | null;
  chosen: Set<string>;
  busy: boolean;
  progress: string;
  onToggle: (id: string) => void;
  onKeep: () => void;
  onBack: () => void;
}) {
  const { living, remembered } = useMemo(() => treePriorities(tree), [tree]);
  const index = useMemo(() => buildIndex({ people: tree.people, edges: tree.edges }), [tree]);
  // the storyteller, found in the file by name: the "…is her granddaughter" lines are said from them
  const anchor = useMemo(() => findAnchor(tree, story), [tree, story]);
  const relation = (id: string) => (anchor && id !== anchor ? (relationshipBetween(index, id, anchor) as { label: string } | null)?.label || "" : "");
  const stats = tree.stats;

  const row = (p: GedcomPerson, detail: string) => {
    const name = fullName(p) || "Somebody unnamed";
    const r = relation(p.id);
    return (
      <li key={p.id}>
        <label className="im-person" data-on={chosen.has(p.id) || undefined}>
          <input type="checkbox" checked={chosen.has(p.id)} onChange={() => onToggle(p.id)} disabled={busy} />
          <span className="im-entry-text">
            <span className="im-entry-title">{name}</span>
            {(r || detail) && <span className="im-entry-meta">{[r, detail].filter(Boolean).join(" · ")}</span>}
          </span>
        </label>
      </li>
    );
  };

  return (
    <section className="im-review" aria-labelledby="im-tree-title">
      <header className="im-review-head">
        <h2 id="im-tree-title">{stats.living === 1 ? "One person in this tree can still be asked." : `${stats.living || 0} people in this tree can still be asked.`}</h2>
        <p className="im-lead">
          From {sourceName}. We read {stats.people} {stats.people === 1 ? "person" : "people"}
          {stats.families ? ` and ${stats.families} ${stats.families === 1 ? "family" : "families"}` : ""}.
          {stats.withoutDates ? ` ${stats.withoutDates} had no dates, so we can’t tell either way.` : ""} They’re all kept.
        </p>
        {tree.truncated && <p className="im-help">It’s a big tree, so we read the first {stats.people} and stopped.</p>}
      </header>

      {living.length ? (
        <div className="im-group">
          <h3>Still here</h3>
          <p className="im-help">Oldest first. Start a story for anyone you’d like to record.</p>
          <ul className="im-list">{living.map((p) => row(p, `${p.age} years old`))}</ul>
        </div>
      ) : (
        <p className="im-lead im-note">
          Everyone in this tree with a date on them has died. That happens with an older tree, and it doesn’t mean there’s nothing to record.
        </p>
      )}

      {remembered.length > 0 && (
        <div className="im-group">
          <h3>Within living memory</h3>
          <p className="im-help">Gone, but somebody still remembers them. Their story gets told by the family instead.</p>
          <ul className="im-list">{remembered.slice(0, 12).map((p) => row(p, `died ${p.deathYear}`))}</ul>
        </div>
      )}

      <footer className="im-foot">
        <p className="im-help">Everyone from the tree joins your family either way. Starting a story just means we begin asking.</p>
        <div className="im-acts">
          <Button onClick={onKeep} loading={busy}>
            {chosen.size ? `Start ${chosen.size} ${chosen.size === 1 ? "story" : "stories"}` : "Keep the family"}
          </Button>
          <Button variant="quiet" onClick={onBack} disabled={busy}>
            Choose something else
          </Button>
        </div>
        {busy && progress && (
          <p className="im-help" role="status">
            {progress}
          </p>
        )}
      </footer>
    </section>
  );
}
