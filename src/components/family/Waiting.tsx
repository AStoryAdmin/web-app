/**
 * What is waiting for a yes, both ways.
 *
 * `<Asked>`: what others asked of you. A relative asked to join a story you
 * keep (story_join_requests; yes makes them a keeper), or suggested a
 * change to somebody whose details you look after (person_suggestions; yes
 * writes the field). Accept and Decline, nothing else.
 *
 * `<WaitingOnOthers>`: what you asked and are still waiting on, so a
 * request never disappears into silence: "asked to join Rose's story ·
 * waiting", "you suggested born 1946 for Linh · waiting".
 */
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { answerJoinRequest, listJoinRequests, listMyJoinRequests, listPendingSuggestions, resolveSuggestion, storyCard, type Family, type JoinRequest, type Person, type Suggestion } from "../../data/family";
import { savePerson } from "../../data/familyWrites";
import type { Story } from "../../data/stories";
import { suggestionLine, suggestionPatch } from "../../app-core/lib/personRights.js";
import { Button } from "../ui";
import Portrait from "./Portrait";
import { canEdit, personName, whenLabel } from "./familyView";
import { useHold } from "./useHold";

type Shape = { joins: JoinRequest[]; suggestions: Suggestion[] };

const line = (s: Suggestion) => (suggestionLine(s) as string) || `${s.field}: ${s.value}`;
// The app's helper is plain JS with a `= null` default; its type needs saying here.
const patchFor = suggestionPatch as unknown as (s: Suggestion, person: Person | null) => Partial<Person> | null;

/** Loads both kinds for one story and its family; tells the parent how many so the heading can count them. */
export function Asked({
  story,
  family,
  meId,
  keeper,
  onCount,
  onChanged,
}: {
  story: Story;
  family: Family | null;
  meId: string | null | undefined;
  /** Whether this account keeps the story (owner or active manager): only keepers see join requests. */
  keeper: boolean;
  onCount?: (n: number) => void;
  onChanged?: () => Promise<void>;
}) {
  const [items, setItems] = useState<Shape | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(() => new Date(0));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onFail = useCallback((err: unknown) => setError(`That didn't go through (${(err as Error)?.message || "no connection"}). It's still here; try again.`), []);
  const { held, hold, undo } = useHold(onFail);
  const people = family?.people || [];
  const personOf = (id: string) => people.find((p) => p.id === id) || null;

  useEffect(() => {
    let live = true;
    Promise.all([keeper ? listJoinRequests(story.id) : Promise.resolve([] as JoinRequest[]), listPendingSuggestions()])
      .then(([joins, all]) => {
        if (!live) return;
        // Only the suggestions this account may answer, about people in this tree, and never its own.
        const suggestions = all.filter((s) => s.by !== meId && people.some((p) => p.id === s.personId) && canEdit(personOf(s.personId)!, family, meId));
        setItems({ joins, suggestions });
        setFailed(false);
        setNow(new Date());
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- people is derived from family
  }, [story.id, keeper, family, meId, attempt]);

  useEffect(() => {
    if (items) onCount?.(items.joins.length + items.suggestions.length);
  }, [items, onCount]);

  // A decline is held six seconds with an Undo before it is sent; an accept goes at once.
  const declineJoin = (r: JoinRequest, who: string) => {
    setError(null);
    hold(
      r.id,
      `Declined ${who}'s request`,
      async () => {
        const res = await answerJoinRequest(r.id, false);
        if (!res.ok) throw new Error(res.error);
      },
      () => setItems((prev) => (prev ? { ...prev, joins: prev.joins.filter((x) => x.id !== r.id) } : prev)),
    );
  };
  const declineSuggestion = (s: Suggestion) => {
    if (!meId) return;
    setError(null);
    hold(
      s.id,
      `Declined ${s.byName.split(" ")[0]}'s suggestion`,
      () => resolveSuggestion(s.id, false, meId),
      () => setItems((prev) => (prev ? { ...prev, suggestions: prev.suggestions.filter((x) => x.id !== s.id) } : prev)),
    );
  };
  const heldLine = (id: string) => (
    <p key={id} className="held" role="status">
      {held[id]} ·{" "}
      <button type="button" className="fp-retry" onClick={() => undo(id)}>
        Undo
      </button>
    </p>
  );

  const answerJoin = async (r: JoinRequest, yes: boolean) => {
    setBusy(r.id);
    setError(null);
    const res = await answerJoinRequest(r.id, yes);
    if (!res.ok) setError(res.error);
    else {
      setItems((prev) => (prev ? { ...prev, joins: prev.joins.filter((x) => x.id !== r.id) } : prev));
      if (yes) await onChanged?.();
    }
    setBusy(null);
  };

  const answerSuggestion = async (s: Suggestion, yes: boolean) => {
    if (!meId) return;
    setBusy(s.id);
    setError(null);
    try {
      if (yes) {
        const person = personOf(s.personId);
        const patch = person ? patchFor(s, person) : null;
        if (!person || !patch) throw new Error("that suggestion couldn't be read");
        await savePerson({ ...person, ...patch } as Person, person.householdId || s.householdId);
      }
      await resolveSuggestion(s.id, yes, meId);
      setItems((prev) => (prev ? { ...prev, suggestions: prev.suggestions.filter((x) => x.id !== s.id) } : prev));
      if (yes) await onChanged?.();
    } catch (err) {
      setError(`That didn't go through (${(err as Error)?.message || "no connection"}). It's still here; try again.`);
    } finally {
      setBusy(null);
    }
  };

  if (failed && !items)
    return (
      <p className="meta bad" role="alert">
        What the family asked couldn't be reached just now.{" "}
        <button
          type="button"
          className="fp-retry"
          onClick={() => {
            setFailed(false);
            setAttempt((n) => n + 1);
          }}
        >
          Try again
        </button>
      </p>
    );
  if (!items || (!items.joins.length && !items.suggestions.length)) return null;
  return (
    <div className="asked">
      {error && (
        <p className="meta bad" role="alert">
          {error}
        </p>
      )}
      {items.joins.map((r) => {
        const who = r.requesterName || people.find((p) => p.userId === r.requester)?.givenName || "Someone in the family";
        if (held[r.id]) return heldLine(r.id);
        return (
          <article key={r.id} className="askrow" aria-label={`${who} asked to join`}>
            <Portrait given={who} size={44} />
            <div>
              <p>
                <b>{who}</b> asked to join {story.name}'s story · {whenLabel(r.createdAt, now)}
              </p>
              <p className="meta">Yes makes them a keeper: they read everything, private memories too, and can edit. To let them add what they remember without that, send them the family code instead.</p>
              <div className="acts">
                <Button small loading={busy === r.id} onClick={() => void answerJoin(r, true)}>
                  Accept
                </Button>
                <Button variant="quiet" small disabled={busy === r.id} onClick={() => declineJoin(r, who)}>
                  Decline
                </Button>
              </div>
            </div>
          </article>
        );
      })}
      {items.suggestions.map((s) => {
        const person = personOf(s.personId);
        if (held[s.id]) return heldLine(s.id);
        return (
          <article key={s.id} className="askrow" aria-label={`${s.byName} suggested a change`}>
            <Portrait given={s.byName.split(" ")[0]} family={s.byName.split(" ").slice(1).join(" ")} size={44} />
            <div>
              <p>
                <b>{s.byName}</b> suggests <b>{line(s)}</b> for {person ? <Link to={`/family/${person.id}`}>{personName(person)}</Link> : "someone"} · {whenLabel(s.createdAt, now)}
              </p>
              {s.note && <p className="meta">“{s.note}”</p>}
              <div className="acts">
                <Button small loading={busy === s.id} onClick={() => void answerSuggestion(s, true)}>
                  Accept
                </Button>
                <Button variant="quiet" small disabled={busy === s.id} onClick={() => declineSuggestion(s)}>
                  Decline
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

type Mine = { joins: { id: string; label: string; at: string }[]; suggestions: Suggestion[] };

/** What this account asked of others and is still waiting on. Nothing when there is nothing. */
export function WaitingOnOthers({ meId, family }: { meId: string | null | undefined; family: Family | null }) {
  const [mine, setMine] = useState<Mine | null>(null);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState(() => new Date(0));
  const people = family?.people || [];

  useEffect(() => {
    if (!meId) return;
    let live = true;
    (async () => {
      const got = await Promise.all([listMyJoinRequests(meId), listPendingSuggestions()]).catch(() => null);
      if (!got) {
        if (live) setFailed(true);
        return;
      }
      const [joins, all] = got;
      const cards = await Promise.all(joins.map((r) => storyCard(r.storyId)));
      if (!live) return;
      setMine({
        joins: joins.map((r, i) => {
          const c = cards[i];
          const name = c?.name || people.find((p) => p.storyId === r.storyId)?.givenName || "a story";
          return { id: r.id, label: `${name}'s story${c?.keeperName ? `, kept by ${c.keeperName}` : ""}`, at: r.createdAt };
        }),
        suggestions: all.filter((s) => s.by === meId),
      });
      setNow(new Date());
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- people is derived from family
  }, [meId, family]);

  if (failed && !mine)
    return (
      <p className="meta bad" role="alert">
        What you asked of others couldn't be reached just now.
      </p>
    );
  if (!mine || (!mine.joins.length && !mine.suggestions.length)) return null;
  return (
    <section className="card waiting-on" aria-label="Waiting on others">
      <h2>Waiting on others</h2>
      <p className="meta">What you asked, until they answer.</p>
      <ul>
        {mine.joins.map((j) => (
          <li key={j.id}>
            <span>
              You asked to join <b>{j.label}</b>
            </span>
            <span className="meta">waiting · {whenLabel(j.at, now)}</span>
          </li>
        ))}
        {mine.suggestions.map((s) => {
          const person = people.find((p) => p.id === s.personId);
          return (
            <li key={s.id}>
              <span>
                You suggested <b>{line(s)}</b> for {person ? <Link to={`/family/${person.id}`}>{personName(person)}</Link> : "someone"}
              </span>
              <span className="meta">waiting · {whenLabel(s.createdAt, now)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
