/**
 * One person in the family: their face, what they are to the storyteller,
 * the memories they told and the ones they're in, whether they've arrived
 * on A Story (and the code to send again), and, for whoever may, their
 * details and the way out of the tree.
 */
import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import Shell from "../components/Shell";
import MemoryCard from "../components/MemoryCard";
import { Avatar, Button, Chip, Field, Problem } from "../components/ui";
import { MailIcon, UserIcon } from "../components/icons";
import { CodeCard } from "../components/family/InviteSheet";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { usePhotoUrl } from "../lib/photoUrls";
import { track } from "../lib/analytics";
import { familyCodeFor, householdFor, invitePerson, removePerson, savePerson, sendInviteEmail } from "../data/familyWrites";
import { buildIndex } from "../app-core/lib/familyGraph.js";
import { lifeLine, personMemories } from "../app-core/lib/personMemories.js";
import { canEdit, linkState, personName, relationTo, storytellerOf, type Index } from "../components/family/familyView";
import type { Person as PersonType } from "../data/family";
import type { Memory, Story } from "../data/stories";

type Found = { story: Story; memory: Memory };
type Res = { own: Story | null; told: Found[]; tagged: Found[]; mentions: Found[]; total: number };

function Group({ title, note, items }: { title: string; note?: string; items: Found[] }) {
  if (!items.length) return null;
  return (
    <section className="pgroup" aria-label={title}>
      <div className="sechead">
        <h2>{title}</h2>
      </div>
      {note && <p className="meta" style={{ marginBottom: "var(--s-4)" }}>{note}</p>}
      <div className="recent">
        {items.map(({ story, memory }, i) => (
          <MemoryCard key={memory.id} memory={memory} story={story} style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </section>
  );
}

export default function Person() {
  const { personId = "" } = useParams();
  const { user } = useAuth();
  const { account, activeStory: story, stories, family, reload } = useAccount();
  const navigate = useNavigate();
  const person = family?.people.find((p) => p.id === personId) || null;
  const index = useMemo(() => buildIndex(family || { people: [], edges: [] }) as Index, [family]);
  const photo = usePhotoUrl(person?.photo);
  const [edit, setEdit] = useState<{ given: string; last: string; birth: string; email: string } | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [busy, setBusy] = useState<"" | "save" | "remove" | "code">("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ code: string; emailed: boolean | null; email: string } | null>(null);
  const [askRemove, setAskRemove] = useState(false);

  const res = useMemo<Res | null>(() => {
    if (!person) return null;
    const relationIn = (s: Story) => {
      const t = storytellerOf(family, s);
      return t ? relationTo(index, person.id, t.id) : "";
    };
    return personMemories(person, stories, { relationIn }) as Res;
  }, [person, stories, family, index]);

  if (account === undefined) return <Shell compact back="/family"><div className="page" aria-busy="true" /></Shell>;
  if (!story) return <Navigate to="/start" replace />;
  if (!person || !res) {
    return (
      <Shell compact title="Family" back="/family">
        <div className="page">
          <div className="card empty">
            <h2 className="story-title">This person isn't in the family tree.</h2>
            <p>
              <Link to="/family">Back to the family</Link>
            </p>
          </div>
        </div>
      </Shell>
    );
  }

  const meId = user?.id;
  const first = person.givenName || "them";
  const teller = storytellerOf(family, story);
  const rel = teller ? relationTo(index, person.id, teller.id) : "";
  const isTeller = person.storyId === story.id;
  const state = linkState(person, meId);
  const editable = canEdit(person, family, meId);
  const senderName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const line = [isTeller ? "Storyteller" : rel ? `${story.name}'s ${rel}` : "", lifeLine(person) as string].filter(Boolean).join(" · ");
  const name = personName(person);

  const sendCode = async (email: string) => {
    setBusy("code");
    setError(null);
    try {
      const r = await familyCodeFor({ personId: person.id });
      if ("error" in r) {
        setError(
          r.error === "already"
            ? `${first} is already on A Story.`
            : r.error === "not_ready"
              ? "Codes aren't switched on for this family yet."
              : "A code couldn't be made just now. Try again in a moment.",
        );
        return;
      }
      let emailed: boolean | null = null;
      const to = email.trim().toLowerCase();
      if (to) {
        await invitePerson(person.id, to);
        emailed = await sendInviteEmail({ to, code: r.code, storyName: story.name, senderName });
      }
      track("invite_sent", { method: to ? "email" : "code", again: !!person.invitedAt });
      setSent({ code: r.code, emailed, email: to });
      if (to) await reload();
    } catch (err) {
      setError(`That didn't go (${(err as Error)?.message || "no connection"}).`);
    } finally {
      setBusy("");
    }
  };

  const save = async () => {
    if (!edit || !user) return;
    if (!edit.given.trim()) return setError("A first name, at least.");
    setBusy("save");
    setError(null);
    try {
      const householdId = person.householdId || (await householdFor(user.id, account, family));
      const year = parseInt(edit.birth, 10);
      const next = { ...person, givenName: edit.given.trim(), familyName: edit.last.trim(), birthYear: Number.isFinite(year) && year > 0 ? year : undefined, email: edit.email.trim().toLowerCase() || undefined } as PersonType;
      await savePerson(next, householdId);
      await reload();
      setEdit(null);
    } catch (err) {
      setError(`That didn't save (${(err as Error)?.message || "no connection"}).`);
    } finally {
      setBusy("");
    }
  };

  const remove = async () => {
    setBusy("remove");
    setError(null);
    try {
      await removePerson(person.id);
      await reload();
      navigate("/family", { replace: true });
    } catch (err) {
      setError(`${first} wasn't removed (${(err as Error)?.message || "no connection"}).`);
      setBusy("");
    }
  };

  return (
    <Shell compact title={name} back="/family">
      <div className="page person-page">
        {error && <Problem message={error} onDismiss={() => setError(null)} />}

        <section className="card person-hero" aria-label={name}>
          <Avatar src={photo} name={person.givenName} size={120} className={person.deathYear ? "gone" : ""} />
          <div className="grow">
            <p className="label">{isTeller ? "Storyteller" : state.key === "you" ? "You" : "In the family"}</p>
            <h1>{name}</h1>
            {line && <p className="meta big">{line}</p>}
            <div className="chiprow" style={{ marginTop: "var(--s-3)" }}>
              {state.key === "joined" && <Chip tone="green">on A Story</Chip>}
              {state.key === "you" && <Chip tone="green">you</Chip>}
              {state.key === "invited" && <Chip tone="gold">invited · waiting for them</Chip>}
              {state.key === "listed" && <Chip tone="outline">not on A Story yet</Chip>}
              {res.total > 0 && <Chip>{res.total} {res.total === 1 ? "memory" : "memories"}</Chip>}
            </div>
          </div>
          {editable && !edit && (
            <div className="tools">
              <Button variant="outline" small onClick={() => setEdit({ given: person.givenName || "", last: person.familyName || "", birth: person.birthYear ? String(person.birthYear) : "", email: person.email || "" })}>
                Edit
              </Button>
            </div>
          )}
        </section>

        <div className="person-grid">
          <div className="col">
            {isTeller && res.own && (
              <p className="meta" style={{ marginBottom: "var(--s-4)" }}>
                Everything {first} told is in <Link to="/archive">the archive</Link>.
              </p>
            )}
            <Group title={`Memories ${first} told`} items={res.told} />
            <Group title={`Memories ${first} is in`} items={res.tagged} />
            <Group title={`Might be about ${first}`} note="A guess from the words; nobody has said who's in these yet." items={res.mentions} />
            {res.told.length + res.tagged.length + res.mentions.length === 0 && !isTeller && (
              <div className="card empty">
                <h2 className="story-title">No memories with {first} in them yet.</h2>
                <p>When a memory names who was there, it shows up here.</p>
              </div>
            )}
          </div>

          <aside className="col">
            {state.key !== "you" && state.key !== "remembered" && !isTeller && (
              <section className="card pad invitebox" aria-label="Invitation">
                {sent ? (
                  <CodeCard code={sent.code} who={first} story={story} senderName={senderName} emailed={sent.emailed} email={sent.email} />
                ) : state.key === "joined" ? (
                  <>
                    <h3>{first} is on A Story</h3>
                    <p className="meta">They read what's shared and add what they remember, under their own name. Nobody writes as {story.name}.</p>
                  </>
                ) : (
                  <>
                    <h3>{state.key === "invited" ? `${first} is invited · waiting for them` : `${first} isn't on A Story yet`}</h3>
                    <p className="meta">{person.email ? `Invited at ${person.email}. Until they accept, nothing here reaches them.` : "A code puts them in the family tree. Add an email and we'll send it; or pass it on yourself. Until they accept, nothing here reaches them."}</p>
                    {!person.email && <Field label="Email, if you have it" icon={<MailIcon />} type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Optional" autoComplete="off" />}
                    <Button small loading={busy === "code"} onClick={() => void sendCode(person.email || inviteEmail)}>
                      {state.key === "invited" ? "Send the code again" : inviteEmail.trim() || person.email ? "Send the code" : "Make a code"}
                    </Button>
                  </>
                )}
              </section>
            )}

            {editable && edit && (
              <section className="card pad editbox" aria-label={`Edit ${first}`}>
                <h3>About {first}</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void save();
                  }}
                >
                  <Field label="First name" icon={<UserIcon />} value={edit.given} onChange={(e) => setEdit({ ...edit, given: e.target.value })} autoComplete="off" />
                  <Field label="Last name" value={edit.last} onChange={(e) => setEdit({ ...edit, last: e.target.value })} autoComplete="off" />
                  <Field label="Year born" inputMode="numeric" value={edit.birth} onChange={(e) => setEdit({ ...edit, birth: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="1938" autoComplete="off" />
                  {!person.userId && <Field label="Email" icon={<MailIcon />} type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} autoComplete="off" />}
                  <div className="acts">
                    <Button type="submit" loading={busy === "save"}>
                      Save
                    </Button>
                    <Button variant="quiet" onClick={() => setEdit(null)}>
                      Cancel
                    </Button>
                  </div>
                </form>
                {!isTeller && state.key !== "you" && (
                  <div className="removebox">
                    {askRemove ? (
                      <>
                        <p className="meta">Take {first} out of the family tree? Their memories stay where they are.</p>
                        <div className="acts">
                          <Button variant="accent" small loading={busy === "remove"} onClick={() => void remove()}>
                            Remove {first}
                          </Button>
                          <Button variant="quiet" small onClick={() => setAskRemove(false)}>
                            Keep
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Button variant="quiet" small className="danger" onClick={() => setAskRemove(true)}>
                        Remove from the tree
                      </Button>
                    )}
                  </div>
                )}
              </section>
            )}
          </aside>
        </div>
      </div>
    </Shell>
  );
}
