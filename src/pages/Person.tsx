/**
 * One person in the family. On the cloth, the way the founder’s draft
 * names it: "{Name} & {storyteller}" (their own name when they are the
 * storyteller), what they are to them, their years and the span of their
 * memories. On the sheet, which takes the whole window (Shell wide), two
 * columns: on the left, held in view, their portrait as a round print (or
 * their monogram seal), where they stand in the product’s exact words
 * ("not on A Story yet", "invited · waiting for them", "on A Story") with
 * the one thing to do about it, and the people closest to them in the
 * tree; on the right, their memories on a terracotta rail (oldest first,
 * the newest last), three related memories, and what they wrote for the
 * family. Their details can be changed by whoever may change them.
 */
import { useCallback, useMemo, useRef, useState, type MouseEvent } from "react";
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
import { DateTask } from "../components/archive/ArchiveGroups";
import { memoryDate } from "../app-core/lib/timeline.js";
import { Leaf } from "../components/family/Ornaments";
import WhereNext from "../components/book/WhereNext";
import { useMyCodes } from "../components/family/useMyCodes";
import { useHold } from "../components/family/useHold";
import HeldLine from "../components/family/HeldLine";
import { useRetryFocus } from "../components/family/useRetryFocus";
import { useFocusNext } from "../components/family/useFocusNext";
import { buildPlate } from "../components/family/tree/plateModel";
import { treePeople } from "../components/family/tree/treeModel";
import { kinOf, promptsAbout, railFor, relatedFor, saidLine, spanLine, splitRail, type Found } from "../components/person/personRail";
import type { Teller } from "../components/person/MemoryRail";
import { sampleFamily } from "../components/family/tree/sampleFamily";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { track } from "../lib/analytics";
import { familyCodeFor, householdFor, invitePerson, removePerson, revokeCode, savePerson, sendInviteEmail } from "../data/familyWrites";
import { spacedCode } from "../app-core/lib/familyCode.js";
import { buildIndex } from "../app-core/lib/familyGraph.js";
import { lifeLine, personMemories } from "../app-core/lib/personMemories.js";
import { canEdit, expiresLabel, personName, realPeople, relationTo, shownState, stateWords, storytellerOf, type Index } from "../components/family/familyView";
import type { Person as PersonType } from "../data/family";
import type { Story } from "../data/stories";

type Res = { own: Story | null; told: Found[]; tagged: Found[]; mentions: Found[]; total: number };

/** The latest few of each group (their own first, then the family’s); the rest are a link away, in the archive. */
const RAIL_MAX = 4;
const OTHERS_MAX = 3;

export default function Person() {
  const { personId = "" } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const live = useAccount();
  const navigate = useNavigate();
  // Dev only: the sample family’s people open here too, for judging the page with a full rail. Nothing writes.
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

  const mine = useMyCodes(!preview);
  // "Take back" is held six seconds with an Undo: the code may already be in their hands, and once taken back it is dead
  const onTakeFail = useCallback((err: unknown) => setError(`The code wasn’t taken back (${(err as Error)?.message || "no connection"}).`), []);
  const inviteRef = useRef<HTMLDivElement>(null);
  const taking = useHold(onTakeFail, inviteRef);
  const plateRef = useRef<HTMLDivElement>(null);
  const { line: retryLine, arm: armRetry } = useRetryFocus(plateRef, ".pp-invite > [role=alert] button");
  // the plate's in-place swaps (the form, the removal question, the code card) keep the keyboard's place
  const { arm: focusNext, at: focusAt } = useFocusNext();
  // What the plate calls this person ("Nhi Tran’s parent"), so the page and the tree never disagree.
  const plateRel = useMemo(() => {
    if (!person || !story) return "";
    const all = treePeople(realPeople(family), story);
    const t = all.find((p) => p.storyId === story.id);
    const plate = buildPlate({ people: all, index, tellerId: t?.id || null });
    return plate.tiers.flatMap((x) => x.units.flatMap((u) => u.nodes)).find((n) => n.id === person.id)?.rel || "";
  }, [person, story, family, index]);

  const res = useMemo<Res | null>(() => {
    if (!person) return null;
    const relationIn = (s: Story) => {
      const t = storytellerOf(family, s);
      return t ? relationTo(index, person.id, t.id) : "";
    };
    return personMemories(person, stories, { relationIn }) as Res;
  }, [person, stories, family, index]);

  const rail = useMemo(() => (res ? railFor(res.told, res.tagged, res.own) : []), [res]);
  const groups = useMemo(() => (res ? splitRail(res.told, res.tagged, res.own) : { theirs: [], others: [] }), [res]);
  const related = useMemo(() => {
    if (!res) return [];
    const seen = new Set<string>();
    return [...res.mentions, ...relatedFor(rail, story)].filter((f) => !seen.has(f.memory.id) && seen.add(f.memory.id)).slice(0, 3);
  }, [res, rail, story]);

  const back = preview ? "/family?preview=tree" : "/family";
  if (account === undefined)
    return (
      <Shell
        wide
        back={back}
        book={preview ? "A sample family" : undefined}
        hero={
          // the arrived hero's frame (same Shell key, so the sheet rises once): one title line held invisible
          <div className="phero" aria-hidden="true">
            <div className="phero-words">
              <p className="phero-title hold-words">&nbsp;</p>
            </div>
          </div>
        }
      >
        {/* the mark draws itself over a hairline sketch of the page to come */}
        <div className="page pp2 pp-skel" aria-busy="true">
          <span className="sk-plate" />
          <span className="sk-col">
            <span className="sk-line w40" />
            <span className="sk-line" />
            <span className="sk-line" />
            <span className="sk-line w70" />
          </span>
        </div>
      </Shell>
    );
  if (!story) return <Navigate to="/start" replace />;
  if (!person || !res) {
    return (
      <Shell compact title="Family" book={preview ? "A sample family" : undefined}>
        <div className="page pp-missing">
          <img className="pp-dog" src="/dog/sleep-paper.webp" alt="" aria-hidden="true" width={781} height={622} />
          <div>
            <h2>This person isn’t in the family tree.</h2>
            <p>They may have been merged into someone else, or taken out of the tree.</p>
            <Link className="pp-write" to={back}>
              Back to the family <span aria-hidden="true">→</span>
            </Link>
          </div>
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
  const stateKey = shownState(person, meId, preview ? null : mine.coded);
  // Until the codes are known, somebody not on A Story might be invited: say neither (BAOS 29).
  const codesUnknown = !preview && mine.codes === null && stateKey === "listed" && !person.deathYear;
  const liveCode = preview ? null : mine.codes?.find((c) => c.personId === person.id) || null;
  const editable = !preview && canEdit(person, family, meId);
  const senderName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const name = personName(person);
  const theirsAll = groups.theirs.slice(-RAIL_MAX);
  const othersShown = groups.others.slice(-(theirsAll.length ? OTHERS_MAX : RAIL_MAX));
  const more = rail.length - theirsAll.length - othersShown.length;
  // Who told a memory somebody else has: their tree row when we know it, else the name on the credit, else the story’s teller.
  const tellerOf = (f: Found): Teller => {
    const credit = String(f.memory.contributor || "").split(",")[0].trim();
    const row = (f.memory.authorPersonId && family?.people.find((p) => p.id === f.memory.authorPersonId)) || (!credit ? storytellerOf(family, f.story) : null);
    if (row) return { name: personName(row), photo: row.photo, given: row.givenName, family: row.familyName };
    const n = credit || `${f.story.name} ${f.story.lastName}`.trim();
    return { name: n, given: n.split(" ")[0], family: n.split(" ").slice(1).join(" ") };
  };
  // "Born 1972" never breaks between the word and the year
  const life = (lifeLine(person) as string).replace(/(Born|Passed away) (\d)/g, "$1\u00a0$2");
  const span = spanLine(rail);
  const whose = teller && teller.userId && teller.userId === meId ? "your" : `${story.name}’s`;
  // The kicker already says "Storyteller"; the line under the name says what they are to the storyteller, and their years.
  const relWords = rel ? `${whose === "your" ? "Your" : `${story.name}’s`} ${rel}` : plateRel ? plateRel.charAt(0).toUpperCase() + plateRel.slice(1) : "In the family";
  const subline = [preview ? "A sample family" : "", isTeller ? "Storyteller" : stateKey === "you" ? "You" : relWords, life].filter(Boolean);
  // Their own words, once on the page (decoration D22): the opening of the latest memory they told or kept, never a summary.
  const theirs = [...(res.own ? res.own.memories.filter((m) => m.status !== "in_progress" && !m.contributor).map((memory) => ({ story: res.own!, memory })) : []), ...res.told]
    .filter((f) => saidLine(f.memory).length >= 20)
    .sort((a, b) => b.memory.createdAt.localeCompare(a.memory.createdAt))[0];
  const said = theirs ? saidLine(theirs.memory, 160).replace(/^“|”$/g, "") : "";
  // The rail never repeats the sentence the plate above it quotes.
  const quoted = theirs?.memory.id || null;
  // every memory of theirs with no year yet, not only the ones shown: the same task the Archive sets
  const undated = rail.filter((f) => !(memoryDate(f.memory) as { dated: boolean }).dated).map((f) => f.memory);
  const kin = kinOf(person, family, index);
  const prompts = rail.length ? [] : promptsAbout(person);
  // A third column only when it carries enough; otherwise the people and lines flow under the memories.
  const three = kin.length + related.length >= 3;
  // a group whose only memory is the one the plate above quotes says nothing new: leave it out
  const theirsShown = theirsAll.length === 1 && theirsAll[0].memory.id === quoted ? [] : theirsAll;
  const words = person.deathYear ? "" : stateWords(stateKey);
  const tone = person.deathYear ? "gone" : stateKey === "you" || stateKey === "joined" ? "on" : stateKey === "invited" ? "waiting" : "off";
  const inviteable = !preview && stateKey !== "you" && stateKey !== "remembered" && !isTeller && !person.deathYear;

  const takeBack = () => {
    if (!liveCode) return;
    const code = liveCode.code;
    setError(null);
    taking.hold(
      code,
      `Took back ${spacedCode(code)}`,
      `Taking back ${spacedCode(code)}…`,
      () => revokeCode(code),
      () => mine.setCodes((prev) => (prev || []).filter((c) => c.code !== code)),
    );
  };
  // In the sample nothing writes: every way into the writer is inert there, alike.
  const writeTo = (about?: string) => (preview ? "#" : `/write?with=${encodeURIComponent(person.id)}${about ? `&about=${encodeURIComponent(about)}` : ""}`);
  const inert = preview ? { onClick: (e: MouseEvent) => e.preventDefault(), "aria-disabled": true as const } : {};

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
              ? "Codes aren’t switched on for this family yet."
              : "A code couldn’t be made just now. Try again in a moment.",
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
      setError(`That didn’t go (${(err as Error)?.message || "no connection"}).`);
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
      focusNext("change");
      setEdit(null);
    } catch (err) {
      setError(`That didn’t save (${(err as Error)?.message || "no connection"}).`);
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
      setError(`${first} wasn’t removed (${(err as Error)?.message || "no connection"}).`);
      setBusy("");
    }
  };

  return (
    <Shell
      back={back}
      wide
      book={preview ? "A sample family" : undefined}
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
            {subline.length > 0 && (
              <p className="phero-sub" data-rise>
                {/* each part whole; on a phone each takes its own line and the dots go, so none is left at a line’s end */}
                {subline.map((part, i) => (
                  <span className="sub-part" key={part}>
                    {i > 0 && <span className="sub-dot"> · </span>}
                    <span className="nw">{part}</span>
                  </span>
                ))}
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
            {/* slim: only a line or two beside the portrait (nothing to do here), so the tablet sets it small */}
            <div className={`pp-plate${!inviteable && !editable ? " slim" : ""}`} data-rise ref={plateRef} tabIndex={-1}>
              <Portrait photo={person.photo} given={person.givenName} family={person.familyName} gone={!!person.deathYear} className={`pp-por${isTeller ? " teller" : ""}`} />
              {/* on a tablet the portrait stands to the left of all this; elsewhere it runs under the portrait */}
              <div className="pp-plate-body">
              {!person.photo && !preview && (
                <Link className="pp-addphoto" to={`/write?photo=1&with=${encodeURIComponent(person.id)}`}>
                  Add a photograph of {first} <span aria-hidden="true">→</span>
                </Link>
              )}
              {/* when the codes can’t be reached the alert below says so, once; no state line above it */}
              {!(codesUnknown && mine.failed) && (
              <p className={`pp-state ${codesUnknown ? "off" : tone}`} aria-busy={codesUnknown ? true : undefined} tabIndex={-1} ref={codesUnknown ? retryLine : undefined}>
                {codesUnknown ? (
                  "Checking for an invitation…"
                ) : words ? (
                  <>
                    <i aria-hidden="true" />
                    {stateKey === "you" ? "You · on A Story" : words}
                  </>
                ) : person.deathYear ? (
                  life
                ) : (
                  "In the family"
                )}
              </p>
              )}
              {span && <p className="pp-span">{span}</p>}

              {codesUnknown && mine.failed && (
                <div className="pp-invite">
                  <p className="meta bad" role="alert">
                    Couldn’t check for an invitation just now.{" "}
                    <button
                      type="button"
                      className="fp-retry"
                      onClick={() => {
                        armRetry();
                        mine.reload();
                      }}
                    >
                      Try again
                    </button>
                  </p>
                </div>
              )}
              {inviteable && !edit && !codesUnknown && (
                <div className="pp-invite" ref={inviteRef} tabIndex={-1}>
                  {sent ? (
                    <CodeCard code={sent.code} who={first} story={story} senderName={senderName} emailed={sent.emailed} email={sent.email} focusFirst />
                  ) : stateKey === "joined" ? (
                    <p className="pp-why">They read what’s shared and add what they remember, under their own name. Nobody writes as {story.name}.</p>
                  ) : liveCode && !person.email ? (
                    <>
                      <p className="pp-why">
                        Invited with a code, {expiresLabel(liveCode.expiresAt, mine.now)}; nothing here reaches {first} until they accept.
                      </p>
                      <p className="pp-code">
                        <b>{spacedCode(liveCode.code) as string}</b>
                      </p>
                      {taking.held[liveCode.code] ? (
                        <HeldLine
                          held={taking.held[liveCode.code]}
                          onUndo={() => taking.undo(liveCode.code)}
                          onPause={() => taking.pause(liveCode.code)}
                          onResume={() => taking.resume(liveCode.code)}
                        />
                      ) : (
                        <div className="acts">
                          <Button small variant="outline" onClick={() => setSent({ code: liveCode.code, emailed: null, email: "" })}>
                            Send the code again
                          </Button>
                          <Button small variant="quiet" ref={taking.returnRef(liveCode.code)} onClick={takeBack}>
                            Take back
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="pp-why">{person.email ? `Invited at ${person.email}; nothing here reaches them until they accept.` : `A code puts ${first} in the family tree; nothing here reaches them until they accept.`}</p>
                      {!person.email && <Field label="Email, if you have it" icon={<MailIcon />} type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Optional" autoComplete="off" />}
                      <Button small variant={stateKey === "invited" ? "outline" : "primary"} loading={busy === "code"} onClick={() => void sendCode(person.email || inviteEmail)}>
                        {stateKey === "invited" ? "Send the code again" : inviteEmail.trim() || person.email ? "Send the code" : "Make a code"}
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
                  ref={focusAt("change")}
                  onClick={() => {
                    focusNext("form");
                    setEdit({ given: person.givenName || "", last: person.familyName || "", birth: person.birthYear ? String(person.birthYear) : "", email: person.email || "" });
                  }}
                >
                  Change {first}’s details
                </Button>
              )}

              {editable && edit && (
                <section className="pp-editbox" aria-label={`Edit ${first}`} ref={focusAt("form", (el) => el.querySelector("input"))}>
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
                      <Button
                        variant="quiet"
                        small
                        onClick={() => {
                          focusNext("change");
                          setEdit(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                  {!isTeller && stateKey !== "you" && (
                    <div className="removebox">
                      {askRemove ? (
                        <>
                          <p className="pp-why">Take {first} out of the family tree? Their memories stay where they are.</p>
                          <div className="acts">
                            <Button variant="outline" small className="danger" loading={busy === "remove"} onClick={() => void remove()}>
                              Remove {first}
                            </Button>
                            <Button
                              variant="quiet"
                              small
                              ref={focusAt("keep")}
                              onClick={() => {
                                focusNext("askRemove");
                                setAskRemove(false);
                              }}
                            >
                              Keep
                            </Button>
                          </div>
                        </>
                      ) : (
                        <Button
                          variant="quiet"
                          small
                          className="danger"
                          ref={focusAt("askRemove")}
                          onClick={() => {
                            focusNext("keep");
                            setAskRemove(true);
                          }}
                        >
                          Remove from the tree
                        </Button>
                      )}
                    </div>
                  )}
                </section>
              )}
              </div>
            </div>
          </aside>

          <div className={`pp-main${rail.length === 0 ? " bare" : three ? " three" : ""}`}>
            <div className="pp-story">
              {said && (
                <figure className={`pp-words-plate${said.length > 120 ? " long" : ""}`} data-rise>
                  <blockquote>
                    {/* the marks are set in the line, so the leaf comes after the closing one, never inside the quote */}
                    <p>
                      “{said}”<Leaf />
                    </p>
                  </blockquote>
                  <figcaption>
                    {first}, in {preview ? <span>“{theirs!.memory.title?.trim() || "a memory"}”</span> : <Link to={`/archive/${theirs!.memory.id}`}>“{theirs!.memory.title?.trim() || "a memory"}”</Link>}
                  </figcaption>
                </figure>
              )}
              {rail.length > 0 ? (
                <>
                  {theirsShown.length === 0 && othersShown.length === 0 && !preview && (
                    <p className="pp-head">
                      <Link className="pp-write" to={writeTo()} {...inert}>
                        Write one with {first} <span aria-hidden="true">→</span>
                      </Link>
                    </p>
                  )}
                  {theirsShown.length > 0 && (
                    <section className="pp-group theirs" aria-labelledby="pp-theirs-h">
                      <header className="pp-head" data-rise>
                        <h2 id="pp-theirs-h">{isTeller ? `What ${first} has told` : `What ${first} has told the family`}</h2>
                        {!preview && othersShown.length === 0 && (
                          <Link className="pp-write" to={writeTo()} {...inert}>
                            Write one with {first} <span aria-hidden="true">→</span>
                          </Link>
                        )}
                      </header>
                      <MemoryRail items={theirsShown} label={`What ${first} told`} preview={preview} quoted={quoted} />
                    </section>
                  )}
                  {othersShown.length > 0 && (
                    <section className="pp-group" aria-labelledby="pp-others-h">
                      <header className="pp-head" data-rise>
                        <h2 id="pp-others-h">{isTeller ? `${first}, as the family remembers` : `Memories with ${first}`}</h2>
                        {!preview && (
                          <Link className="pp-write" to={writeTo()} {...inert}>
                            Write one with {first} <span aria-hidden="true">→</span>
                          </Link>
                        )}
                      </header>
                      <MemoryRail items={othersShown} label={`Memories with ${first}, told by others`} tellerOf={tellerOf} preview={preview} quoted={quoted} />
                    </section>
                  )}
                  {/* the dates nobody has given yet, gathered into one quiet row instead of "No date yet" on every card */}
                  {/* the Archive’s own dating task (same words, minutes and target), and one way to the archive */}
                  {!preview && (undated.length > 0 || more > 0) && (
                    <div className="pp-more" data-rise>
                      <DateTask items={undated} />
                      {undated.length > 0 ? (
                        <Link className="pp-write" to="/archive#yundated">
                          The undated ones, in the archive <span aria-hidden="true">→</span>
                        </Link>
                      ) : (
                        <Link className="pp-write" to="/archive">
                          All {rail.length} with {first}, in the archive <span aria-hidden="true">→</span>
                        </Link>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="pp-none" data-rise>
                  <img className="pp-dog" src="/dog/sleep-paper.webp" alt="" aria-hidden="true" width={781} height={622} />
                  <div>
                    <h2>Nothing with {first} in it yet.</h2>
                    <p>When a memory names who was there, it shows up here. Writing one with {first} in it takes about five minutes.</p>
                    <Link className="pp-write" to={writeTo()} {...inert}>
                      Write a memory with {first} <span aria-hidden="true">→</span>
                    </Link>
                    {/* somewhere to start: three real questions from the bank, each opening the writer with them named */}
                    {prompts.length > 0 && (
                      <ul className="pp-prompts" aria-label={`Something to write about ${first}`}>
                        {prompts.map((q) => (
                          <li key={q.id}>
                            <Link to={writeTo(q.id)} {...inert}>
                              <span className="pp-q">{q.question}</span>
                              <span className="pp-q-a" aria-hidden="true">
                                →
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="pp-extras">
              <Kin person={person} kin={kin} preview={preview} />
              <RelatedRow items={related} />
              <FamilyNotes person={person} story={story} preview={preview} />
            </div>
          </div>
        </div>

        <WhereNext
          rows={[
            { to: "/", title: "Today’s question", line: "One question a day, for whoever is telling." },
            { to: "/talk", title: "Talk it through", line: "Tell a memory out loud and it is written down for you." },
            { to: "/book", title: "The book", line: "How the family’s memories print, page by page." },
          ]}
        />
      </div>
    </Shell>
  );
}
