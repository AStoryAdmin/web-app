/**
 * Who can edit a story: its keepers. A deliberate, separate choice from
 * the family tree (a code never makes a keeper). Only the story’s owner
 * sees this; they invite by email and the invitation links itself when
 * that address signs in. Below it, TreeAdmins: who looks after the tree
 * itself (household_admins), which is not the same as keeping a story.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { canRemoveAdmin, setTreeAdmin, treeAdmins, type Family, type Person } from "../../data/family";
import type { Story } from "../../data/stories";
import { inviteManager, listManagers, removeManager, type Manager } from "../../data/familyWrites";
import { keeperName } from "../../app-core/lib/keeperName.js";
import { Button, Chip, Field } from "../ui";
import Portrait from "./Portrait";
import { useRetryFocus } from "./useRetryFocus";
import { useHold } from "./useHold";
import HeldLine from "./HeldLine";
import { MailIcon } from "../icons";
import { personName } from "./familyView";

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

/**
 * Who looks after the tree (household_admins, tree_admins.sql), as the
 * phone’s TreeKeepers has it: whoever started it, and anyone they make an
 * admin. Admins change anybody’s details and say yes or no to suggestions;
 * they never see private memories. Everyone in the tree sees who they are;
 * only an admin adds one or takes one off, never whoever started the tree
 * and never the last. Taking one off is held six seconds with an Undo.
 */
export function TreeAdmins({ family, meId, onChanged }: { family: Family | null; meId: string | null | undefined; onChanged: () => Promise<void> }) {
  const view = treeAdmins(family, meId);
  // what this page has changed, until the reload brings the family back with it
  const [local, setLocal] = useState<{ from: Family | null; ids: string[] } | null>(null);
  const adminIds = local && local.from === family ? local.ids : view.adminIds;
  const shown = { ...view, adminIds, iAmAdmin: !!meId && adminIds.includes(meId) };
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ text: string; bad?: boolean } | null>(null);
  const homeRef = useRef<HTMLElement>(null);
  const onFail = useCallback((err: unknown) => setNote({ text: `${(err as Error)?.message || "That didn’t go through."} They’re still an admin.`, bad: true }), []);
  const { held, hold, undo, pause, resume, returnRef } = useHold(onFail, homeRef);
  if (!view.householdId) return null;

  const people = (family?.people || []).filter((p) => p.userId);
  const nameOf = (uid: string) => (uid === meId ? "You" : personName(people.find((p) => p.userId === uid)) || "Someone in the family");
  const candidates = view.candidates.filter((p) => !adminIds.includes(p.userId!));

  const make = async (p: Person) => {
    setBusy(p.id);
    setNote(null);
    const r = await setTreeAdmin(view.householdId, p.userId!, true);
    setBusy(null);
    if (!r.ok) return setNote({ text: r.error, bad: true });
    setLocal({ from: family, ids: [...adminIds, p.userId!] });
    setPicking(false);
    setNote({ text: `${personName(p)} is an admin of the tree now.` });
    void onChanged();
  };
  const remove = (uid: string) => {
    setNote(null);
    const self = uid === meId;
    const first = nameOf(uid).split(" ")[0];
    hold(
      uid,
      self ? "You stopped being an admin" : `Took ${first} off the admins`,
      self ? "Stepping down…" : `Taking ${first} off…`,
      async () => {
        const r = await setTreeAdmin(view.householdId, uid, false);
        if (!r.ok) throw new Error(r.error);
      },
      () => {
        setLocal({ from: family, ids: adminIds.filter((x) => x !== uid) });
        void onChanged();
      },
    );
  };

  return (
    <section className="card keepers" aria-labelledby="tree-admins-h" ref={homeRef} tabIndex={-1}>
      <h2 id="tree-admins-h">Who looks after the tree</h2>
      <p className="meta">Admins change anyone’s details and say yes or no to suggestions. They don’t see private memories.</p>
      <ul className="keeperlist" aria-label="The tree’s admins">
        {adminIds.map((uid) =>
          held[uid] ? (
            <HeldLine key={uid} as="li" held={held[uid]} onUndo={() => undo(uid)} onPause={() => pause(uid)} onResume={() => resume(uid)} />
          ) : (
            <li key={uid}>
              <Portrait given={nameOf(uid).split(" ")[0]} family={nameOf(uid).split(" ").slice(1).join(" ")} size={40} />
              <span>
                <strong>{nameOf(uid)}</strong>
                {uid === view.organizerId && <span className="meta">Started the tree</span>}
              </span>
              {canRemoveAdmin(shown, uid) && (
                <Button variant="quiet" small ref={returnRef(uid)} onClick={() => remove(uid)} aria-label={uid === meId ? "Stop being an admin" : `Take ${nameOf(uid)} off the admins`}>
                  {uid === meId ? "Step down" : "Take off"}
                </Button>
              )}
            </li>
          ),
        )}
        {!adminIds.length && <li className="meta">Nobody yet.</li>}
      </ul>
      {shown.iAmAdmin &&
        (picking ? (
          <div className="tree-admin-pick">
            <h3 className="fp-codes-h">Make an admin</h3>
            {candidates.length ? (
              <ul className="keeperlist" aria-label="People who could be admins">
                {candidates.map((p) => (
                  <li key={p.id}>
                    <Portrait photo={p.photo} given={p.givenName} family={p.familyName} size={40} />
                    <span>
                      <strong>{personName(p)}</strong>
                    </span>
                    <Button variant="outline" small loading={busy === p.id} onClick={() => void make(p)} aria-label={`Make ${personName(p)} an admin`}>
                      Make admin
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="meta">Everyone in the family with an account is an admin already, or nobody else has joined yet.</p>
            )}
            <Button variant="quiet" small onClick={() => setPicking(false)}>
              Not now
            </Button>
          </div>
        ) : (
          <Button variant="outline" small onClick={() => setPicking(true)}>
            Add an admin
          </Button>
        ))}
      {note && (
        <p className={`meta${note.bad ? " bad" : ""}`} role={note.bad ? "alert" : "status"}>
          {note.text}
        </p>
      )}
    </section>
  );
}
