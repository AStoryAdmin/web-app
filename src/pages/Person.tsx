/**
 * One person in the family. On the cloth, the way the founder's draft
 * names it: "{Name} & {storyteller}" (their own name when they are the
 * storyteller), what they are to them, their years and the span of their
 * memories. On the sheet, which takes the whole window (Shell wide), two
 * columns: on the left, held in view, their portrait as a round print (or
 * their monogram seal), where they stand in the product's exact words
 * ("not on A Story yet", "invited · waiting for them", "on A Story") with
 * the one thing to do about it, and the people closest to them in the
 * tree; on the right, their memories on a terracotta rail (oldest first,
 * the newest last), three related memories, and what they wrote for the
 * family. Their details can be changed by whoever may change them.
 */
import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Shell from "../components/Shell";
import { Button, Field, Problem } from "../components/ui";
import { MailIcon, UserIcon } from "../components/icons";
import { CodeCard } from "../components/family/InviteSheet";
import Portrait from "../components/family/Portrait";
import MemoryRail from "../components/person/MemoryRail";
import RelatedRow from "../components/person/RelatedRow";
import FamilyNotes from "../components/person/FamilyNotes";
import Kin from "../components/person/Kin";
import { WhereNext } from "../components/family/Ornaments";
import { quoteFor } from "../app-core/lib/memoryCard.js";
import { opening } from "../lib/resurface";
import { smarten } from "../lib/typography";
import { railFor, relatedFor, spanLine, type Found } from "../components/person/personRail";
import { sampleFamily } from "../components/family/tree/sampleFamily";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { track } from "../lib/analytics";
import { familyCodeFor, householdFor, invitePerson, removePerson, savePerson, sendInviteEmail } from "../data/familyWrites";
import { buildIndex } from "../app-core/lib/familyGraph.js";
import { lifeLine, personMemories } from "../app-core/lib/personMemories.js";
import { canEdit, linkState, personName, relationTo, stateWords, storytellerOf, type Index } from "../components/family/familyView";
import type { Person as PersonType } from "../data/family";
import type { Story } from "../data/stories";

type Res = { own: Story | null; told: Found[]; tagged: Found[]; mentions: Found[]; total: number };

const RAIL_MAX = 12;

export default function Person() {
  const { personId = "" } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const live = useAccount();
  const navigate = useNavigate();
  // Dev only: the sample family's people open here too, for judging the page with a full rail. Nothing writes.
  const preview = import.meta.env.DEV && params.get("preview") === "tree";
  const sample = useMemo(() => (preview ? sampleFamily() : null), [preview]);
  const { account, reload } = live;
  const story = sample ? sample.story : live.activeStory;
  const stories = useMemo(() => (sample ? [sample.story] : live.stories), [sample, live.stories]);
  const family = sample ? sample.family : live.family;
  const person = family?.people.find((p) => p.id === personId) || null;
  const index = useMemo(() => buildIndex(family || { people: [], edges: [] }) as Index, [family]);
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

  const rail = useMemo(() => (res ? railFor(res.told, res.tagged, res.own) : []), [res]);
  const related = useMemo(() => {
    if (!res) return [];
    const seen = new Set<string>();
    return [...res.mentions, ...relatedFor(rail, story)].filter((f) => !seen.has(f.memory.id) && seen.add(f.memory.id)).slice(0, 3);
  }, [res, rail, story]);

  const back = preview ? "/family?preview=tree" : "/family";
  if (account === undefined) return <Shell compact back={back}><div className="page" aria-busy="true" /></Shell>;
  if (!story) return <Navigate to="/start" replace />;
  if (!person || !res) {
    return (
      <Shell compact title="Family" back={back}>
        <div className="page pp-missing">
          <h2>This person isn't in the family tree.</h2>
          <p>They may have been merged into someone else, or taken out of the tree.</p>
          <Link className="pk-tree" to={back}>
            Back to the family <span aria-hidden="true">→</span>
          </Link>
        </div>
      </Shell>
    );
  }

  // The sample is looked at from outside: nobody in it is "you".
  const meId = sample ? null : user?.id;
  const first = person.givenName || "them";
  const teller = storytellerOf(family, story);
  const rel = teller ? relationTo(index, person.id, teller.id) : "";
  const isTeller = person.storyId === story.id;
  const state = linkState(person, meId);
  const editable = !preview && canEdit(person, family, meId);
  const senderName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const name = personName(person);
  const shown = rail.slice(-RAIL_MAX);
  const life = lifeLine(person) as string;
  const span = spanLine(rail);
  const whose = teller && teller.userId && teller.userId === meId ? "your" : `${story.name}'s`;
  // The kicker already says "Storyteller"; the line under the name says what they are to the storyteller, and their years.
  const subline = [preview ? "A sample family" : "", isTeller ? "Storyteller" : state.key === "you" ? "You" : rel ? `${whose === "your" ? "Your" : `${story.name}'s`} ${rel}` : "In the family", life].filter(Boolean).join(" · ");
  // Their own words, once on the page (decoration D22): the opening of the latest memory they told or kept, never a summary.
  const theirs = [...(res.own ? res.own.memories.filter((m) => m.status !== "in_progress").map((memory) => ({ story: res.own!, memory })) : []), ...res.told]
    .filter((f) => (f.memory.body || "").trim().length >= 20)
    .sort((a, b) => b.memory.createdAt.localeCompare(a.memory.createdAt))[0];
  const said = theirs ? smarten(quoteFor(opening(theirs.memory.body.trim()), 220) as string).replace(/^“|”$/g, "") : "";
  const words = person.deathYear ? "" : stateWords(state.key);
  const tone = person.deathYear ? "gone" : state.key === "you" || state.key === "joined" ? "on" : state.key === "invited" ? "waiting" : "off";
  const inviteable = !preview && state.key !== "you" && state.key !== "remembered" && !isTeller && !person.deathYear;

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
    <Shell
      back={back}
      wide
      hero={
        <div className="phero">
          <div className="phero-words">
            <h1 className="phero-title">
              {isTeller ? (
                name
              ) : (
                <>
                  {name} <span className="amp">&amp;</span> {story.name}
                </>
              )}
              <span className="stop">.</span>
            </h1>
            {subline && (
              <p className="phero-sub" data-rise>
                {subline}
              </p>
            )}
          </div>
        </div>
      }
    >
      <div className="page pp pp2">
        {error && <Problem message={error} onDismiss={() => setError(null)} />}

        <div className="pp-cols">
          <aside className="pp-side" aria-label={`About ${first}`}>
            <div className="pp-plate" data-rise>
              <Portrait photo={person.photo} given={person.givenName} family={person.familyName} gone={!!person.deathYear} className={`pp-por${isTeller ? " teller" : ""}`} />
              {!person.photo && !preview && (
                <Link className="pp-addphoto" to={`/write?photo=1&with=${encodeURIComponent(person.id)}`}>
                  Add a photograph of {first} <span aria-hidden="true">→</span>
                </Link>
              )}
              <p className={`pp-state ${tone}`}>
                {words ? (
                  <>
                    <i aria-hidden="true" />
                    {state.key === "you" ? "You · on A Story" : words}
                  </>
                ) : person.deathYear ? (
                  life
                ) : (
                  "In the family"
                )}
              </p>
              {span && <p className="pp-span">{span}</p>}

              {inviteable && !edit && (
                <div className="pp-invite">
                  {sent ? (
                    <CodeCard code={sent.code} who={first} story={story} senderName={senderName} emailed={sent.emailed} email={sent.email} />
                  ) : state.key === "joined" ? (
                    <p className="pp-why">They read what's shared and add what they remember, under their own name. Nobody writes as {story.name}.</p>
                  ) : (
                    <>
                      <p className="pp-why">{person.email ? `Invited at ${person.email}. Until they accept, nothing here reaches them.` : `A code puts ${first} in the family tree. Add an email and we'll send it, or pass it on yourself. Until they accept, nothing here reaches them.`}</p>
                      {!person.email && <Field label="Email, if you have it" icon={<MailIcon />} type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Optional" autoComplete="off" />}
                      <Button small variant={state.key === "invited" ? "outline" : "primary"} loading={busy === "code"} onClick={() => void sendCode(person.email || inviteEmail)}>
                        {state.key === "invited" ? "Send the code again" : inviteEmail.trim() || person.email ? "Send the code" : "Make a code"}
                      </Button>
                    </>
                  )}
                </div>
              )}

              {editable && !edit && (
                <Button
                  variant="quiet"
                  small
                  className="pp-edit"
                  onClick={() => setEdit({ given: person.givenName || "", last: person.familyName || "", birth: person.birthYear ? String(person.birthYear) : "", email: person.email || "" })}
                >
                  Change {first}'s details
                </Button>
              )}

              {editable && edit && (
                <section className="pp-editbox" aria-label={`Edit ${first}`}>
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
                      <Button type="submit" small loading={busy === "save"}>
                        Save
                      </Button>
                      <Button variant="quiet" small onClick={() => setEdit(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                  {!isTeller && state.key !== "you" && (
                    <div className="removebox">
                      {askRemove ? (
                        <>
                          <p className="pp-why">Take {first} out of the family tree? Their memories stay where they are.</p>
                          <div className="acts">
                            <Button variant="outline" small className="danger" loading={busy === "remove"} onClick={() => void remove()}>
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
            </div>
          </aside>

          <div className="pp-main">
            <div className="pp-story">
              {said && (
                <figure className="pp-words-plate" data-rise>
                  <blockquote>
                    <p>{said}</p>
                  </blockquote>
                  <figcaption>
                    {first}, in {preview ? <span>“{theirs!.memory.title?.trim() || "a memory"}”</span> : <Link to={`/archive/${theirs!.memory.id}`}>“{theirs!.memory.title?.trim() || "a memory"}”</Link>}
                  </figcaption>
                </figure>
              )}
              {shown.length > 0 ? (
                <>
                  <header className="pp-head" data-rise>
                    <h2>{isTeller ? `What ${first} has told` : `Memories with ${first}`}</h2>
                    {!preview && (
                      <Link className="pp-write" to={`/write?with=${encodeURIComponent(person.id)}`}>
                        Write one with {first} <span aria-hidden="true">→</span>
                      </Link>
                    )}
                  </header>
                  <MemoryRail items={shown} label={isTeller ? `What ${first} told` : `Memories with ${first}`} />
                  {rail.length > shown.length && (
                    <p className="pp-more" data-rise>
                      <Link className="pp-write" to="/archive">
                        Everything with {first}, in the archive <span aria-hidden="true">→</span>
                      </Link>
                    </p>
                  )}
                </>
              ) : (
                <div className="pp-none" data-rise>
                  <img className="pp-dog" src="/dog/sleep-paper.webp" alt="" aria-hidden="true" />
                  <div>
                    <h2>Nothing with {first} in it yet.</h2>
                    <p>When a memory names who was there, it shows up here. Writing one with {first} in it takes about five minutes.</p>
                    <Link className="pp-write" to={`/write?with=${encodeURIComponent(person.id)}`}>
                      Write a memory with {first} <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <div className="pp-extras">
              <Kin person={person} family={family} index={index} preview={preview} />
              <RelatedRow items={related} />
              <FamilyNotes person={person} story={story} preview={preview} />
            </div>
          </div>
        </div>

        <WhereNext
          items={[
            { to: preview ? "/family?preview=tree" : "/family", title: "The family", line: `Everyone in ${story.name}'s family, by generation.` },
            { to: `/write?with=${encodeURIComponent(person.id)}`, title: `A memory with ${first}`, line: "A few lines is plenty. It takes about five minutes." },
            { to: "/archive", title: "The archive", line: "Every memory, by year and by chapter." },
          ]}
        />
      </div>
    </Shell>
  );
}
