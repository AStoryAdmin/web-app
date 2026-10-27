/**
 * The memories found in a file or a paste, before any is kept (the phone's
 * ImportReviewScreen): each with a box, ticked unless it is already in the
 * archive, its title, when, its chapter and the opening of its words. One
 * button keeps the ticked ones.
 */
import type { ImportEntry } from "../../data/imports";
import { Button } from "../ui";

const OPENING = 280;

const opening = (body: string) => (body.length > OPENING ? `${body.slice(0, OPENING).replace(/\s+\S*$/, "")}…` : body);

export default function ImportReview({
  entries,
  sourceName,
  truncated,
  memoir,
  busy,
  progress,
  onChange,
  onKeep,
  onBack,
}: {
  entries: ImportEntry[];
  sourceName: string;
  truncated: boolean;
  memoir: boolean;
  busy: boolean;
  /** "Keeping 12 of 40" while saving. */
  progress: string;
  onChange: (entries: ImportEntry[]) => void;
  onKeep: () => void;
  onBack: () => void;
}) {
  const chosen = entries.filter((e) => e.include).length;
  const undated = entries.filter((e) => e.include && e.year == null).length;
  const duplicates = entries.filter((e) => e.duplicate).length;
  const toggle = (id: string) => onChange(entries.map((e) => (e.id === id ? { ...e, include: !e.include } : e)));
  const all = (include: boolean) => onChange(entries.map((e) => ({ ...e, include: include && !e.duplicate })));
  const found = memoir ? `${entries.length} ${entries.length === 1 ? "chapter" : "chapters"}` : `${entries.length} ${entries.length === 1 ? "memory" : "memories"}`;

  return (
    <section className="im-review" aria-labelledby="im-review-title">
      <header className="im-review-head">
        <h2 id="im-review-title">{found} found</h2>
        <p className="im-lead">
          {memoir
            ? "Each chapter becomes a memory, in their own words. Untick any you’d rather leave out."
            : "Keep the ones worth preserving. You can fix a title, a year or a chapter on each memory’s page afterwards."}
        </p>
        <p className="im-help">
          From {sourceName}
          {truncated ? ". It’s a long one, so this is the first part of it" : ""}
          {duplicates ? `. ${duplicates === 1 ? "One is" : `${duplicates} are`} already in the archive, so left unticked` : ""}.
        </p>
        <div className="im-acts">
          <Button variant="quiet" small onClick={() => all(true)} disabled={busy}>
            Tick all
          </Button>
          <Button variant="quiet" small onClick={() => all(false)} disabled={busy || !chosen}>
            Untick all
          </Button>
        </div>
      </header>

      <ul className="im-list">
        {entries.map((e) => (
          <li key={e.id}>
            <label className="im-entry" data-on={e.include || undefined}>
              <input type="checkbox" checked={e.include} onChange={() => toggle(e.id)} disabled={busy} />
              <span className="im-entry-text">
                <span className="im-entry-title">{e.title || "Untitled memory"}</span>
                <span className="im-entry-meta">
                  {[e.duplicate ? "Already in the archive" : null, e.dateText || "No date yet", e.era].filter(Boolean).join(" · ")}
                </span>
                <span className="im-entry-words">{opening(e.body)}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      <footer className="im-foot">
        {undated > 0 && (
          <p className="im-help">
            {undated === 1
              ? "One of these has no year yet. It’ll sit at the end of the timeline until one is added."
              : `${undated} of these have no year yet. They’ll sit at the end of the timeline until one is added.`}
          </p>
        )}
        <div className="im-acts">
          <Button onClick={onKeep} disabled={!chosen} loading={busy}>
            {chosen === 1 ? "Keep this memory" : `Keep ${chosen} memories`}
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
