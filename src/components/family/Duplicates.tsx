/**
 * One person listed twice: the same name, at most one of the rows on A
 * Story (the founder’s test family had "Nhi Tran" three times over). One
 * quiet line per name, with the way out that fits each extra row
 * (data/family duplicateFix): merge it into the one that stays
 * (merge_people keeps edges, tags and credits), merge the two stories
 * first when each row has one (propose_story_merge), or take the extra out
 * of the tree when both already point at one story. Only shown to somebody
 * who may edit the extra rows.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { duplicateFix, duplicateGroups, mergePeople, proposeStoryMerge, storyCard, type Family, type Person } from "../../data/family";
import { removePerson } from "../../data/familyWrites";
import type { Story } from "../../data/stories";
import { canEdit } from "./familyView";
import { Button } from "../ui";

export default function Duplicates({
  people,
  family,
  stories,
  meId,
  onChanged,
}: {
  people: Person[];
  family: Family | null;
  /** The stories this account keeps, so two stories about one person can be offered a merge. */
  stories: Story[];
  meId: string | null | undefined;
  onChanged: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  /** Stories an extra row points at that the account’s list lacks: kept by me (so merged away) or by somebody else. */
  const [orphans, setOrphans] = useState<Record<string, boolean>>({});
  const myStoryIds = stories.map((s) => s.id);
  const groups = duplicateGroups(people).filter((g) => g.extras.every((p) => canEdit(p, family, meId)));
  const unknown = groups.flatMap((g) => g.extras.filter((x) => x.storyId && g.keep.storyId && !myStoryIds.includes(x.storyId)).map((x) => x.storyId!));
  const unknownKey = unknown.join(",");
  useEffect(() => {
    if (!unknownKey) return;
    let live = true;
    Promise.all(unknownKey.split(",").map((sid) => storyCard(sid))).then((cards) => {
      if (live) setOrphans(Object.fromEntries(unknownKey.split(",").map((sid, i) => [sid, !!cards[i]?.isKeeper])));
    });
    return () => {
      live = false;
    };
  }, [unknownKey]);
  if (!groups.length) return null;

  const run = async (id: string, work: () => Promise<string | null>) => {
    setBusy(id);
    setNote(null);
    try {
      const problem = await work();
      if (problem) setNote(problem);
      else await onChanged();
    } catch (err) {
      setNote(`That didn’t go through (${(err as Error)?.message || "no connection"}).`);
    } finally {
      setBusy(null);
    }
  };
  const merge = (keep: Person, fold: Person) =>
    run(fold.id, async () => {
      const r = await mergePeople(keep.id, fold.id);
      return r.ok ? null : r.error;
    });
  const mergeStories = (keep: Person, fold: Person) =>
    run(fold.id, async () => {
      const r = await proposeStoryMerge(keep.storyId!, fold.storyId!);
      if (!r.ok) return r.error;
      return r.done ? null : "Asked the other keeper. The stories merge once they say yes.";
    });
  const remove = (fold: Person) =>
    run(fold.id, async () => {
      await removePerson(fold.id);
      return null;
    });

  const storyName = (id: string | undefined) => {
    const s = id ? stories.find((x) => x.id === id) : null;
    return s ? `${s.name} ${s.lastName}`.trim() : "";
  };

  return (
    <section className="card dupes" aria-label="Listed twice">
      {groups.map((g) => (
        <div key={g.keep.id} className="dupe">
          <p>
            Looks like <Link to={`/family/${g.keep.id}`}>{g.name}</Link> is listed {g.extras.length === 1 ? "twice" : `${g.extras.length + 1} times`}.
          </p>
          {g.extras.map((x) => {
            // A story I keep that my list lacks was merged into another already: the row is a leftover pointer.
            const merged = !!x.storyId && !!orphans[x.storyId];
            const fix = merged ? "remove" : duplicateFix(g.keep, x, myStoryIds);
            const seeLink = (
              <Link className="meta" to={`/family/${x.id}`}>
                see the extra
              </Link>
            );
            if (fix === "merge-stories")
              return (
                <div key={x.id} className="acts">
                  <span className="meta">Each has a story of their own ({storyName(g.keep.storyId) || "one"} and {storyName(x.storyId) || "another"}).</span>
                  <Button variant="outline" small loading={busy === x.id} onClick={() => void mergeStories(g.keep, x)}>
                    Merge the stories into one
                  </Button>
                  {seeLink}
                </div>
              );
            if (fix === "remove")
              return (
                <div key={x.id} className="acts">
                  <span className="meta">{merged ? "Its story was already merged into another; removing the extra loses nothing." : "Both point at the same story; removing the extra loses nothing."}</span>
                  <Button variant="outline" small loading={busy === x.id} onClick={() => void remove(x)}>
                    Remove the extra
                  </Button>
                  {seeLink}
                </div>
              );
            if (fix === "none")
              return (
                <div key={x.id} className="acts">
                  <span className="meta">Each has a story of their own, and one is kept by somebody else. Only they can merge it.</span>
                  {seeLink}
                </div>
              );
            return (
              <div key={x.id} className="acts">
                {/* merging keeps the extra’s ties, tags and credits; a one-tap remove beside it would throw them away */}
                <Button variant="outline" small loading={busy === x.id} onClick={() => void merge(g.keep, x)}>
                  Merge into one
                </Button>
                {seeLink}
              </div>
            );
          })}
        </div>
      ))}
      {note && (
        <p className="meta bad" role="alert">
          {note}
        </p>
      )}
    </section>
  );
}
