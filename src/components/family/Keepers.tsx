/**
 * Who can edit a story: its keepers. A deliberate, separate choice from
 * the family tree (a code never makes a keeper). Only the story's owner
 * sees this; they invite by email and the invitation links itself when
 * that address signs in.
 */
import { useEffect, useState } from "react";
import type { Person } from "../../data/family";
import type { Story } from "../../data/stories";
import { inviteManager, listManagers, removeManager, type Manager } from "../../data/familyWrites";
import { keeperName } from "../../app-core/lib/keeperName.js";
import { Button, Chip, Field } from "../ui";
import Portrait from "./Portrait";
import { MailIcon } from "../icons";

export default function Keepers({ story, people, senderName }: { story: Story; people: Person[]; senderName: string }) {
  const [list, setList] = useState<Manager[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [note, setNote] = useState<{ text: string; bad?: boolean } | null>(null);

  useEffect(() => {
    let live = true;
    listManagers(story.id)
      .then((rows) => {
        if (!live) return;
        setList(rows);
        setFailed(false);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [story.id, attempt]);

  const nameFor = (m: Manager) => keeperName({ invited_email: m.invitedEmail, user_id: m.userId }, people) as string;

  const invite = async () => {
    const to = email.trim().toLowerCase();
    if (!to.includes("@")) return setNote({ text: "An email address, so the invitation can reach them.", bad: true });
    setBusy(true);
    setNote(null);
    const r = await inviteManager({ storyId: story.id, email: to, storyName: story.name, senderName });
    setBusy(false);
    if (!r.ok) return setNote({ text: r.error, bad: true });
    setEmail("");
    setNote({ text: r.emailed ? `Sent to ${to}. They can edit once they sign in with that address.` : `Saved. The email didn't go; tell ${to} to sign in with that address.` });
    setList(await listManagers(story.id).catch(() => list));
  };

  // Asked in place, never in a browser dialog: "Stop Nhi editing? Stop · Keep".
  const remove = async (m: Manager) => {
    setRemoving(m.id);
    setNote(null);
    try {
      await removeManager(m.id);
      setList((prev) => (prev || []).filter((x) => x.id !== m.id));
      setAsking(null);
    } catch (err) {
      setNote({ text: `That didn't go through (${(err as Error)?.message || "no connection"}).`, bad: true });
    } finally {
      setRemoving(null);
    }
  };

  return (
    <section className="card keepers" aria-label={`Who can edit ${story.name}'s story`}>
      <h2>Who can edit {story.name}'s story</h2>
      <p className="meta">Keepers can change the story; the family tree reads and adds.</p>
      <ul className="keeperlist">
        {list === null && !failed && (
          <li className="meta" aria-busy="true">
            Looking for keepers…
          </li>
        )}
        {failed && list === null && (
          <li className="meta bad" role="alert">
            The keepers couldn't be reached just now.{" "}
            <button type="button" className="fp-retry" onClick={() => setAttempt((a) => a + 1)}>
              Try again
            </button>
          </li>
        )}
        {list?.map((m) => (
          <li key={m.id}>
            <Portrait given={nameFor(m).split(" ")[0]} family={nameFor(m).split(" ").slice(1).join(" ")} size={40} />
            <span>
              <strong>{nameFor(m)}</strong>
              <span className="meta">{asking === m.id ? `Stop ${nameFor(m).split(" ")[0]} editing?` : m.invitedEmail}</span>
            </span>
            {asking === m.id ? (
              <span className="keeper-ask">
                <Button variant="outline" small className="danger" loading={removing === m.id} onClick={() => void remove(m)}>
                  Stop
                </Button>
                <Button variant="quiet" small disabled={removing === m.id} onClick={() => setAsking(null)}>
                  Keep
                </Button>
              </span>
            ) : (
              <>
                <Chip tone={m.status === "active" ? "green" : "gold"}>{m.status === "active" ? "editing" : "invited"}</Chip>
                <Button variant="quiet" small onClick={() => setAsking(m.id)}>
                  Remove
                </Button>
              </>
            )}
          </li>
        ))}
        {list && !list.length && <li className="meta">Only you, so far.</li>}
      </ul>
      <form
        className="keeperform"
        onSubmit={(e) => {
          e.preventDefault();
          void invite();
        }}
      >
        <Field label="Invite a keeper" icon={<MailIcon />} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Their email" autoComplete="off" />
        <Button variant="outline" small type="submit" loading={busy}>
          Invite
        </Button>
      </form>
      {note && (
        <p className={`meta${note.bad ? " bad" : ""}`} role={note.bad ? "alert" : undefined}>
          {note.text}
        </p>
      )}
    </section>
  );
}
