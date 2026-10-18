/**
 * What the family sent, waiting for a keeper: a memory, a note, or a
 * photograph for one memory. "Add to the archive" saves the memory first
 * and marks the contribution approved only once it has landed, so a
 * dropped connection never leaves something approved and in nobody's
 * archive. "Not this one" waits six seconds with an Undo before it is sent.
 * A failure to load says so, with a Try again; it never reads as "nothing
 * waiting". Only keepers can read the queue; everyone else sees nothing.
 */
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Story } from "../../data/stories";
import { approveContribution, fetchContributions, memoryFromContribution, rejectContribution, type Contribution } from "../../data/contributions";
import { useAccount } from "../../state/accountContext";
import { usePhotoUrl } from "../../lib/photoUrls";
import { track } from "../../lib/analytics";
import { Button } from "../ui";
import Portrait from "./Portrait";
import { whenLabel } from "./familyView";
import { useHold } from "./useHold";
import HeldLine from "./HeldLine";

function Pic({ url, alt }: { url: string; alt: string }) {
  const src = usePhotoUrl(url);
  return src ? <img className="pic" src={src} alt={alt} loading="lazy" /> : <span className="pic ph" aria-hidden="true" />;
}

function Item({ item, story, now, busy, onKeep, onSkip }: { item: Contribution; story: Story; now: Date; busy: boolean; onKeep: () => void; onSkip: () => void }) {
  const [open, setOpen] = useState(false);
  const who = item.contributorName || "Someone";
  const did = item.kind === "memory" ? "wrote a memory" : item.memoryId ? "added to a memory" : "sent a note";
  const target = item.memoryId ? story.memories.find((m) => m.id === item.memoryId) : null;
  const long = item.body.length > 320;
  const text = open || !long ? item.body : `${item.body.slice(0, 300).trimEnd()}…`;
  return (
    <article className="contrib rise" aria-label={`${who} ${did}`}>
      {item.photos[0] ? <Pic url={item.photos[0]} alt={`Photograph from ${who}`} /> : <Portrait given={who.split(" ")[0]} family={who.split(" ").slice(1).join(" ")} size={56} className="pic-av" />}
      <div>
        <p className="who">
          <b>{who}</b> {did}
          {item.relationship ? ` · ${item.relationship}` : ""} · {whenLabel(item.createdAt, now)}
        </p>
        {item.title && <h3>{item.title}</h3>}
        {target && (
          <p className="meta">
            To <Link to={`/archive/${target.id}`}>“{target.title || "a memory"}”</Link>
          </p>
        )}
        {text && <p className="story">{text}</p>}
        {long && (
          <button type="button" className="more" onClick={() => setOpen((v) => !v)}>
            {open ? "Less" : "Read the rest"}
          </button>
        )}
        {item.photos.length > 1 && <p className="meta">{item.photos.length} photographs</p>}
        <div className="acts">
          <Button small loading={busy} onClick={onKeep}>
            {item.kind === "memory" ? "Add to the archive" : item.memoryId ? "Add to the memory" : "Keep it"}
          </Button>
          <Button variant="quiet" small disabled={busy} onClick={onSkip} data-undo-to={item.id}>
            Not this one
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function ReviewQueue({
  story,
  onKept,
  asked,
  askedCount = 0,
  askedFailed = false,
}: {
  story: Story;
  onKept?: () => void;
  /** What the family asked (to join, to change a detail), shown above what they sent. */
  asked?: ReactNode;
  askedCount?: number;
  /** The asks couldn't be reached: then "nothing waiting" can't be said; their own line says what went wrong. */
  askedFailed?: boolean;
}) {
  const { saveMemory } = useAccount();
  const [items, setItems] = useState<Contribution[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(() => new Date(0));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onFail = useCallback((err: unknown) => setError(`That didn't go through (${(err as Error)?.message || "no connection"}). It's still here; try again.`), []);
  const { held, hold, undo } = useHold(onFail);

  useEffect(() => {
    let live = true;
    fetchContributions(story.id, "pending")
      .then((list) => {
        if (!live) return;
        setItems(list);
        setFailed(false);
        setNow(new Date());
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [story.id, attempt]);

  const keep = async (item: Contribution) => {
    setBusy(item.id);
    setError(null);
    try {
      if (item.kind === "memory") await saveMemory(memoryFromContribution(item, story), story.id);
      await approveContribution(item.id);
      track("contribution_approved", { kind: item.kind, photos: item.photos.length });
      onKept?.();
      setItems((prev) => (prev || []).filter((i) => i.id !== item.id));
    } catch (err) {
      onFail(err);
    } finally {
      setBusy(null);
    }
  };
  // "Not this one" is held for six seconds with an Undo before anything is sent.
  const skip = (item: Contribution) => {
    setError(null);
    const who = (item.contributorName || "Someone").split(" ")[0];
    hold(
      item.id,
      `Set aside ${who}'s ${item.kind === "memory" ? "memory" : "note"}`,
      `Setting aside ${who}'s ${item.kind === "memory" ? "memory" : "note"}…`,
      () => rejectContribution(item.id),
      () => setItems((prev) => (prev || []).filter((i) => i.id !== item.id)),
    );
  };

  if (failed && items === null)
    return (
      <section className="review none" aria-label="Waiting for your review">
        <p className="review-none bad" role="alert">
          What the family sent couldn't be reached just now.{" "}
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
        {asked}
      </section>
    );
  const sent = items?.length ?? 0;
  const count = sent + askedCount;
  // Nothing waiting: one ruled line, not a box (the asks still mount, so they can say when one arrives).
  if (items !== null && count === 0 && !error)
    return (
      <section className="review none" aria-label="Waiting for your review">
        {!askedFailed && <p className="review-none">Nothing waiting for your review. What the family asks or sends lands here first.</p>}
        {asked}
      </section>
    );
  return (
    <section className="review" aria-label="Waiting for your review">
      <h2>
        {count > 0 && <span className="n">{count}</span>} Waiting for your review
      </h2>
      <p className="meta">
        {items === null
          ? "Looking…"
          : sent
            ? `What the family adds goes into ${story.name}'s archive under their own name once you've had a look.`
            : "What the family asks lands here first."}
      </p>
      {asked}
      {error && (
        <p className="meta bad" role="alert">
          {error}
        </p>
      )}
      {items?.map((item) =>
        held[item.id] ? (
          <HeldLine key={item.id} held={held[item.id]} onUndo={() => undo(item.id)} />
        ) : (
          <Item key={item.id} item={item} story={story} now={now} busy={busy === item.id} onKeep={() => void keep(item)} onSkip={() => skip(item)} />
        ),
      )}
    </section>
  );
}
