/**
 * What the family sent, waiting for a keeper: a memory, a note, or a
 * photograph for one memory. "Add to the archive" saves the memory first
 * and marks the contribution approved only once it has landed, so a
 * dropped connection never leaves something approved and in nobody's
 * archive. Only keepers can read the queue; everyone else sees nothing.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Story } from "../../data/stories";
import { approveContribution, listContributions, memoryFromContribution, rejectContribution, type Contribution } from "../../data/contributions";
import { useAccount } from "../../state/accountContext";
import { usePhotoUrl } from "../../lib/photoUrls";
import { track } from "../../lib/analytics";
import { Avatar, Button } from "../ui";
import { whenLabel } from "./familyView";

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
      {item.photos[0] ? <Pic url={item.photos[0]} alt={`Photograph from ${who}`} /> : <Avatar name={who} size={56} className="pic-av" />}
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
          <Button variant="quiet" small disabled={busy} onClick={onSkip}>
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
}: {
  story: Story;
  onKept?: () => void;
  /** What the family asked (to join, to change a detail), shown above what they sent. */
  asked?: ReactNode;
  askedCount?: number;
}) {
  const { saveMemory } = useAccount();
  const [items, setItems] = useState<Contribution[] | null>(null);
  const [now, setNow] = useState(() => new Date(0));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    listContributions(story.id, "pending").then((list) => {
      if (!live) return;
      setItems(list);
      setNow(new Date());
    });
    return () => {
      live = false;
    };
  }, [story.id]);

  const act = async (item: Contribution, what: "keep" | "skip") => {
    setBusy(item.id);
    setError(null);
    try {
      if (what === "keep") {
        if (item.kind === "memory") await saveMemory(memoryFromContribution(item, story), story.id);
        await approveContribution(item.id);
        track("contribution_approved", { kind: item.kind, photos: item.photos.length });
        onKept?.();
      } else {
        await rejectContribution(item.id);
      }
      setItems((prev) => (prev || []).filter((i) => i.id !== item.id));
    } catch (err) {
      setError(`That didn't go through (${(err as Error)?.message || "no connection"}). It's still here; try again.`);
    } finally {
      setBusy(null);
    }
  };

  const sent = items?.length ?? 0;
  const count = sent + askedCount;
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
            : askedCount
              ? "What the family asks lands here first."
              : "Nothing waiting. What the family asks or sends lands here first."}
      </p>
      {asked}
      {error && (
        <p className="meta" role="alert" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
      {items?.map((item) => (
        <Item key={item.id} item={item} story={story} now={now} busy={busy === item.id} onKeep={() => void act(item, "keep")} onSkip={() => void act(item, "skip")} />
      ))}
    </section>
  );
}
