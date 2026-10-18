/**
 * Who can edit a story: its keepers. A deliberate, separate choice from
 * the family tree (a code never makes a keeper). Only the story’s owner
 * sees this; they invite by email and the invitation links itself when
 * that address signs in.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { Person } from "../../data/family";
import type { Story } from "../../data/stories";
import { inviteManager, listManagers, removeManager, type Manager } from "../../data/familyWrites";
import { keeperName } from "../../app-core/lib/keeperName.js";
import { Button, Chip, Field } from "../ui";
import Portrait from "./Portrait";
import { useRetryFocus } from "./useRetryFocus";
import { useHold } from "./useHold";
import HeldLine from "./HeldLine";
import { MailIcon } from "../icons";

export default function Keepers({ story, people, senderName }: { story: Story; people: Person[]; senderName: string }) {
  const [list, setList] = useState<Manager[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const homeRef = useRef<HTMLElement>(null);
  const { line: retryLine, arm: armRetry } = useRetryFocus(homeRef, ".keeperlist > [role=alert] button");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
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
    setNote({ text: r.emailed ? `Sent to ${to}. They can edit once they sign in with that address.` : `Saved. The email didn’t go; tell ${to} to sign in with that address.` });
    setList(await listManagers(story.id).catch(() => list));
  };

  // Stopping a keeper is held six seconds with an Undo, like every other "no" on the page ("Stopped Nhi editing · Undo"),
  // and only then sent: undoing it afterwards would mean inviting them again.
  const onFail = useCallback(
    (err: unknown) => setNote({ text: `That didn’t go through (${(err as Error)?.message || "no connection"}). They can still edit; try again.`, bad: true }),
    [],
  );
  const { held, hold, undo, pause, resume, returnRef } = useHold(onFail, homeRef);
  const remove = (m: Manager) => {
    setNote(null);
    const first = nameFor(m).split(" ")[0];
    hold(
      m.id,
      `Stopped ${first} editing`,
      `Stopping ${first} editing…`,
      () => removeManager(m.id),
      () => setList((prev) => (prev || []).filter((x) => x.id !== m.id)),
    );
  };

  return (
    <section className="card keepers" aria-label={`Who can edit ${story.name}’s story`} ref={homeRef} tabIndex={-1}>
      <h2>Who can edit {story.name}’s story</h2>
      <p className="meta">Keepers can change the story; the family tree reads and adds.</p>
      <ul className="keeperlist">
        {list === null && !failed && (
          <li className="meta" aria-busy="true" tabIndex={-1} ref={retryLine}>
            Looking for keepers…
          </li>
        )}
        {failed && list === null && (
          <li className="meta bad" role="alert">
            The keepers couldn’t be reached just now.{" "}
            <button
              type="button"
              className="fp-retry"
              onClick={() => {
                armRetry();
                setFailed(false);
                setAttempt((a) => a + 1);
              }}
            >
              Try again
            </button>
          </li>
        )}
        {list?.map((m) =>
          held[m.id] ? (
            <HeldLine key={m.id} as="li" held={held[m.id]} onUndo={() => undo(m.id)} onPause={() => pause(m.id)} onResume={() => resume(m.id)} />
          ) : (
          <li key={m.id}>
            <Portrait given={nameFor(m).split(" ")[0]} family={nameFor(m).split(" ").slice(1).join(" ")} size={40} />
            <span>
              <strong>{nameFor(m)}</strong>
              <span className="meta">{m.invitedEmail}</span>
            </span>
            <Chip tone={m.status === "active" ? "green" : "gold"}>{m.status === "active" ? "editing" : "invited"}</Chip>
            <Button variant="quiet" small ref={returnRef(m.id)} onClick={() => remove(m)}>
              Remove
            </Button>
          </li>
          ),
        )}
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
