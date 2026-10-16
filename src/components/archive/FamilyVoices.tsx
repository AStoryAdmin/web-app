/**
 * "What the family remembers": every other version of this moment the
 * family sent, each under its sender's name, never merged. Keepers also
 * see what is still waiting and can keep it or not. Under it, one box:
 * what do you remember about this?
 */
import { useEffect, useState } from "react";
import { Avatar, Button, Problem } from "../ui";
import { CheckIcon } from "../icons";
import { approveContribution, listContributions, rejectContribution, sendContribution, type Contribution } from "../../data/contributions";
import { sidesFor } from "../../app-core/lib/memorySides.js";
import type { Memory, Story } from "../../data/stories";

function when(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return d.toLocaleDateString("en-GB", { weekday: "long" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: days > 300 ? "numeric" : undefined });
}

function Voice({ c, pending, onKeep, onDrop, busy }: { c: Contribution; pending?: boolean; onKeep?: () => void; onDrop?: () => void; busy?: boolean }) {
  const name = c.contributorName || "Someone in the family";
  const rel = (c.relationship || "").trim();
  return (
    <div className={`mp-voice${pending ? " pending" : ""}`}>
      <Avatar name={name} size={48} />
      <div>
        <p className="who">
          {name}
          <span>
            {[rel ? rel.toLowerCase() : "", pending ? "waiting for a look" : `added ${when(c.createdAt)}`].filter(Boolean).join(" · ")}
          </span>
        </p>
        <p className="story words">{c.body}</p>
        {pending && onKeep && onDrop && (
          <div className="acts">
            <Button small onClick={onKeep} loading={busy}>
              Keep it
            </Button>
            <Button small variant="quiet" onClick={onDrop} disabled={busy}>
              Not this one
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FamilyVoices({ memory, story, viewerName, isOwner }: { memory: Memory; story: Story; viewerName: string; isOwner: boolean }) {
  const [items, setItems] = useState<Contribution[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let live = true;
    listContributions(story.id, ["approved", "pending"])
      .then((rows) => {
        if (!live) return;
        setItems(rows.filter((c) => c.memoryId === memory.id && (c.kind || "testimonial") === "testimonial"));
        setLoaded(true);
      })
      .catch(() => live && setLoaded(true));
    return () => {
      live = false;
    };
  }, [story.id, memory.id, refresh]);

  const approved = sidesFor(items, memory.id) as Contribution[];
  const pending = items.filter((c) => c.status === "pending" && String(c.body || "").trim());

  const send = async () => {
    const body = text.trim();
    if (!body) {
      setError("Write a line or two first, even a short one.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      await sendContribution({ storyId: story.id, contributorName: viewerName, relationship: "", body, memoryId: memory.id });
      setText("");
      setSent(isOwner ? "Added. It shows here once a keeper has looked at it." : "Sent to the family.");
      setRefresh((n) => n + 1);
    } catch (err) {
      setError(`That didn't send (${(err as Error)?.message || "no connection"}). Your words are still here; try again.`);
    } finally {
      setSending(false);
    }
  };

  const decide = async (c: Contribution, keep: boolean) => {
    setBusyId(c.id);
    setError(null);
    try {
      if (keep) await approveContribution(c.id);
      else await rejectContribution(c.id);
      setItems((prev) => (keep ? prev.map((x) => (x.id === c.id ? { ...x, status: "approved" } : x)) : prev.filter((x) => x.id !== c.id)));
    } catch (err) {
      setError(`That didn't go through (${(err as Error)?.message || "no connection"}). Try again.`);
    } finally {
      setBusyId(null);
    }
  };

  const own = story.relationship === "Myself";
  return (
    <section className="mp-voices" aria-labelledby="voices-h">
      <h2 id="voices-h">What the family remembers</h2>
      {error && <Problem message={error} onDismiss={() => setError(null)} />}
      {approved.map((c) => (
        <Voice key={c.id} c={c} />
      ))}
      {pending.map((c) => (
        <Voice key={c.id} c={c} pending busy={busyId === c.id} onKeep={() => decide(c, true)} onDrop={() => decide(c, false)} />
      ))}
      {loaded && !approved.length && !pending.length && (
        <p className="meta">Nobody else has added their side of this one yet.</p>
      )}
      <form
        className="mp-addvoice"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <label htmlFor="voice-text">What do you remember about this?</label>
        <textarea
          id="voice-text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (sent) setSent(null);
          }}
          placeholder={own ? "Something that comes back to you now" : `Your side of it, in your own words`}
          rows={3}
        />
        <div className="row">
          <Button type="submit" loading={sending} disabled={!text.trim()}>
            Send
          </Button>
          {sent && (
            <span className="done" role="status">
              <CheckIcon /> {sent}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
