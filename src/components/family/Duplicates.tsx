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
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  answerStoryMerge,
  askedPairs,
  duplicateFix,
  duplicateGroups,
  mergePeople,
  mergeWords,
  pairKey,
  proposeStoryMerge,
  recentMerges,
  storyCard,
  storyPairs,
  undoStoryMerge,
  type Family,
  type Person,
  type RecentMerge,
  type StoryPair,
} from "../../data/family";
import { removePerson } from "../../data/familyWrites";
import type { Story } from "../../data/stories";
import { canEdit } from "./familyView";
import { Button } from "../ui";
import { useHold } from "./useHold";
import HeldLine from "./HeldLine";

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

/**
 * Two stories about one person, once somebody has asked to put them
 * together (the phone’s SamePersonCards, sameStory.js:149,176): the other
 * owner’s ask, answered yes ("Put them together") or no ("No, two
 * people"); this account’s own ask, waiting; and a merge from the last 30
 * days, which either owner can undo. Nothing shows when there is nothing
 * to settle, which is almost always. A no and an undo are held six seconds
 * with an Undo of their own, like every other no on the page.
 */
const fetchMerges = () => Promise.all([storyPairs(), recentMerges()]);

export function StoryMerges({ onChanged }: { onChanged: () => Promise<void> }) {
  const [pairs, setPairs] = useState<StoryPair[]>([]);
  const [merges, setMerges] = useState<RecentMerge[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ text: string; bad?: boolean } | null>(null);
  const homeRef = useRef<HTMLElement>(null);
  const onFail = useCallback((err: unknown) => setNote({ text: `That didn’t go through (${(err as Error)?.message || "no connection"}). Try once more.`, bad: true }), []);
  const { held, hold, undo, pause, resume, returnRef } = useHold(onFail, homeRef);

  const load = useCallback(async () => {
    const [p, m] = await fetchMerges();
    setPairs(askedPairs(p));
    setMerges(m);
  }, []);
  useEffect(() => {
    let live = true;
    fetchMerges()
      .then(([p, m]) => {
        if (!live) return;
        setPairs(askedPairs(p));
        setMerges(m);
      })
      .catch((err) => console.warn("story merges:", (err as Error)?.message || err));
    return () => {
      live = false;
    };
  }, []);

  if (!pairs.length && !merges.length && !note) return null;

  const yes = async (pair: StoryPair) => {
    setBusy(pairKey(pair));
    setNote(null);
    const r = await answerStoryMerge(pair.mergeId!, true);
    setBusy(null);
    if (!r.ok) return setNote({ text: r.error, bad: true });
    if (r.status === "done") {
      setNote({ text: `${pair.name ? `${pair.name}’s` : "Their"} stories are together now. Either of you can undo it here for 30 days.` });
      await onChanged();
    } else setNote({ text: "That ask was already settled." });
    await load().catch(() => {});
  };
  const no = (pair: StoryPair) => {
    setNote(null);
    const key = pairKey(pair);
    hold(
      key,
      `Kept ${pair.name || "them"} as two people`,
      "Saying so…",
      async () => {
        const r = await answerStoryMerge(pair.mergeId!, false);
        if (!r.ok) throw new Error(r.error);
      },
      () => setPairs((list) => list.filter((p) => pairKey(p) !== key)),
    );
  };
  const undoMerge = (m: RecentMerge) => {
    setNote(null);
    hold(
      m.id,
      `Put ${m.name ? `${m.name}’s` : "the"} stories back as two`,
      "Putting them back…",
      () => undoStoryMerge(m.id),
      () => {
        setMerges((list) => list.filter((x) => x.id !== m.id));
        void onChanged();
      },
    );
  };

  return (
    <section className="card dupes" aria-label="Two stories about one person" ref={homeRef} tabIndex={-1}>
      {pairs.map((pair) => {
        const key = pairKey(pair);
        const words = mergeWords(pair);
        if (held[key]) return <HeldLine key={key} held={held[key]} onUndo={() => undo(key)} onPause={() => pause(key)} onResume={() => resume(key)} />;
        return (
          <div key={key} className="dupe">
            <p>
              <strong>{words.title}</strong>
            </p>
            <p>{words.body}</p>
            {words.answer && (
              <div className="acts">
                <Button variant="outline" small loading={busy === key} onClick={() => void yes(pair)}>
                  Put them together
                </Button>
                <Button variant="quiet" small ref={returnRef(key)} disabled={busy === key} onClick={() => no(pair)}>
                  No, two people
                </Button>
              </div>
            )}
          </div>
        );
      })}
      {merges.map((m) =>
        held[m.id] ? (
          <HeldLine key={m.id} held={held[m.id]} onUndo={() => undo(m.id)} onPause={() => pause(m.id)} onResume={() => resume(m.id)} />
        ) : (
          <div key={m.id} className="dupe">
            <p>{`${m.name ? `${m.name}’s` : "Their"} stories are together now.`}</p>
            <div className="acts">
              <span className="meta">Undoing puts each story back with its own memories and keepers. Anything added since stays where it is.</span>
              <Button variant="quiet" small ref={returnRef(m.id)} onClick={() => undoMerge(m)}>
                Undo
              </Button>
            </div>
          </div>
        ),
      )}
      {note && (
        <p className={`meta${note.bad ? " bad" : ""}`} role={note.bad ? "alert" : "status"}>
          {note.text}
        </p>
      )}
    </section>
  );
}
