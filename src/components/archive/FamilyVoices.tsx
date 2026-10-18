/**
 * "What the family remembers": every other version of this moment the
 * family sent, set as text the way the book sets a note, never merged:
 * their words in quotation marks, then a small face and their name. Keepers
 * also see what is still waiting and can keep it or not. Under them, one
 * quiet link, "Add what you remember", opens the box to write in (the
 * page's only way to it); it stays open once anything has been typed.
 */
import { useEffect, useRef, useState } from "react";
import { Avatar, Button, Problem } from "../ui";
import { CheckIcon } from "../icons";
import { approveContribution, listContributions, rejectContribution, sendContribution, type Contribution } from "../../data/contributions";
import { sidesFor } from "../../app-core/lib/memorySides.js";
import { usePhotoUrl } from "../../lib/photoUrls";
import { smarten } from "../../lib/typography";
import type { Person } from "../../data/family";
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

const fold = (s: string) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** The tree row behind a contribution, for their face: their id on it, or their first name at the front of the credit. */
function faceFor(c: Contribution, people: Person[]): Person | null {
  if (c.personId) {
    const hit = people.find((p) => p.id === c.personId);
    if (hit) return hit;
  }
  const credit = fold(String(c.contributorName || "").split(",")[0]);
  if (!credit) return null;
  return people.find((p) => fold(p.givenName) && (credit === fold(p.givenName) || credit.startsWith(`${fold(p.givenName)} `) || credit === fold(`${p.givenName} ${p.familyName}`))) || null;
}

function Voice({ c, person, pending, onKeep, onDrop, busy }: { c: Contribution; person: Person | null; pending?: boolean; onKeep?: () => void; onDrop?: () => void; busy?: boolean }) {
  const name = c.contributorName || "Someone in the family";
  const rel = (c.relationship || "").trim();
  const photo = usePhotoUrl(person?.photo);
  return (
    <li className={`fv-row${pending ? " pending" : ""}`}>
      <q className="fv-words">{smarten(c.body)}</q>
      <p className="fv-who">
        <Avatar src={photo} name={name} size={24} />
        <span>
          <b>{name}</b>
          {[rel ? `, ${rel.toLowerCase()}` : "", pending ? "" : ` · ${when(c.createdAt)}`].join("")}
        </span>
      </p>
      {pending && onKeep && onDrop && (
        <div className="fv-acts">
          <span className="fv-wait">Waiting for you</span>
          <button type="button" className="mv-tool" onClick={onKeep} disabled={busy} aria-busy={busy || undefined}>
            <CheckIcon aria-hidden="true" />
            {busy ? "Keeping…" : "Keep it"}
          </button>
          <button type="button" className="mv-tool" onClick={onDrop} disabled={busy}>
            Not this one
          </button>
        </div>
      )}
    </li>
  );
}

export default function FamilyVoices({
  memory,
  story,
  viewerName,
  isOwner,
  people = [],
  open,
  onOpenChange,
}: {
  memory: Memory;
  story: Story;
  viewerName: string;
  isOwner: boolean;
  /** The family tree, for the faces beside the names. */
  people?: Person[];
  /** Whether the box to write in is open. Left out, it is always open. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [items, setItems] = useState<Contribution[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const box = useRef<HTMLTextAreaElement>(null);
  const isOpen = open === undefined ? true : open || !!text.trim();

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

  // opened from "Add what you remember": bring the box into view and put the caret in it
  useEffect(() => {
    if (!open || !box.current) return;
    const el = box.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    el.focus({ preventScroll: true });
  }, [open]);

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
      console.warn("contribution not sent", err);
      setError("That didn’t send. Your words are still here; check the connection and press Send again.");
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
      console.warn("contribution decision not saved", err);
      setError("That didn’t go through. Check the connection and try again.");
    } finally {
      setBusyId(null);
    }
  };

  const own = story.relationship === "Myself";
  return (
    <section className="fv" aria-labelledby="voices-h">
      <div className="fv-head">
        <h2 id="voices-h">What the family remembers</h2>
        {loaded && !approved.length && !pending.length && <p className="fv-empty">Nobody else has added their side yet.</p>}
      </div>
      {error && <Problem message={error} onDismiss={() => setError(null)} />}
      {(approved.length > 0 || pending.length > 0) && (
        <ul className="fv-rows">
          {approved.map((c) => (
            <Voice key={c.id} c={c} person={faceFor(c, people)} />
          ))}
          {pending.map((c) => (
            <Voice key={c.id} c={c} person={faceFor(c, people)} pending busy={busyId === c.id} onKeep={() => decide(c, true)} onDrop={() => decide(c, false)} />
          ))}
        </ul>
      )}
      {isOpen ? (
        <form
          className="fv-add"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <label htmlFor="voice-text">What do you remember about this?</label>
          <textarea
            id="voice-text"
            ref={box}
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
            {onOpenChange && !text.trim() && (
              <Button variant="quiet" onClick={() => onOpenChange(false)} disabled={sending}>
                Not now
              </Button>
            )}
            {sent && (
              <span className="done" role="status">
                <CheckIcon /> {sent}
              </span>
            )}
          </div>
        </form>
      ) : (
        <div className="fv-closed">
          <button type="button" className="fv-open" onClick={() => onOpenChange?.(true)}>
            Add what you remember <span aria-hidden="true">→</span>
          </button>
          {sent && (
            <span className="done" role="status">
              <CheckIcon /> {sent}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
