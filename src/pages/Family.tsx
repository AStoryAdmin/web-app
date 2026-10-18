/**
 * Family: the family as the front of the book draws it. The page takes the
 * whole window (Shell bare and wide): the family’s name and what it holds
 * at the top of the sheet with the one way to invite somebody; then the
 * storyteller’s column (their own words, the family’s lines) beside the
 * family tree (components/family/tree: one tier per generation, the
 * storyteller largest in the middle, couples joined by an ampersand,
 * children threaded to their parents, a dashed ring where somebody is
 * missing, the not-placed shelf). Under it, the keeping of the family:
 * what waits for your review, the codes you’ve sent and how an invitation
 * works, and who may edit. Each person is in one of three states, in the
 * product’s own words ("not on A Story yet", "invited · waiting for them",
 * "on A Story"), shown under their face in the tree; nobody is listed
 * twice (docs/PRD.md §3.3a), and when somebody is, one line says so and
 * offers the merge.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import Shell from "../components/Shell";
import { Button, Problem } from "../components/ui";
import { PlusIcon } from "../components/icons";
import FamilyTree from "../components/family/tree/FamilyTree";
import Storyteller from "../components/family/Storyteller";
import { Cartouche, Star } from "../components/family/Ornaments";
import WhereNext from "../components/book/WhereNext";
import { useMyCodes } from "../components/family/useMyCodes";
import { sampleFamily } from "../components/family/tree/sampleFamily";
import { placePerson } from "../components/family/tree/placePerson";
import { generationsLine, peopleLine } from "../components/family/album/albumModel";
import { buildPlate } from "../components/family/tree/plateModel";
import { treePeople } from "../components/family/tree/treeModel";
import type { GhostKind } from "../components/family/tree/treeModel";
import InviteSheet from "../components/family/InviteSheet";
import ReviewQueue from "../components/family/ReviewQueue";
import Keepers from "../components/family/Keepers";
import Duplicates from "../components/family/Duplicates";
import { Asked, WaitingOnOthers } from "../components/family/Waiting";
import { useHold } from "../components/family/useHold";
import HeldLine from "../components/family/HeldLine";
import { useRetryFocus } from "../components/family/useRetryFocus";
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { householdFor, revokeCode, type MyCode } from "../data/familyWrites";
import { buildIndex } from "../app-core/lib/familyGraph.js";
import { spacedCode } from "../app-core/lib/familyCode.js";
import { canEdit, expiresLabel, familyTitle, personName, realPeople, type Index } from "../components/family/familyView";
import type { Person } from "../data/family";

/** The codes this account has sent that still open a place, each with a way to take it back (held six seconds
    with an Undo first: the code may already be in a relative’s hands, and once taken back it is dead). */
function MyCodes({ people, mine }: { people: Person[]; mine: ReturnType<typeof useMyCodes> }) {
  const { codes, setCodes, failed, reload, now } = mine;
  const [notTaken, setNotTaken] = useState<string | null>(null);
  const onFail = useCallback((_err: unknown, code: string) => setNotTaken(code), []);
  const listRef = useRef<HTMLUListElement>(null);
  const { held, hold, undo, pause, resume, returnRef } = useHold(onFail, listRef);
  const { line: retryLine, arm: armRetry } = useRetryFocus();
  if (failed && codes === null)
    return (
      <p className="fp-quiet bad" role="alert">
        The codes you’ve sent couldn’t be reached just now.{" "}
        <button
          type="button"
          className="fp-retry"
          onClick={() => {
            armRetry();
            reload();
          }}
        >
          Try again
        </button>
      </p>
    );
  if (codes === null)
    return (
      <p className="fp-quiet" aria-busy="true" tabIndex={-1} ref={retryLine}>
        Looking for the codes you’ve sent…
      </p>
    );
  if (!codes.length) return <p className="fp-quiet">No codes out at the moment.</p>;
  const who = (c: MyCode) => (c.personId ? personName(people.find((p) => p.id === c.personId)) || "a place in the tree" : "the family");
  return (
    <ul className="fp-codes" aria-label="Codes you’ve sent" ref={listRef} tabIndex={-1}>
      {codes.map((c) =>
        held[c.code] ? (
          <HeldLine key={c.code} as="li" held={held[c.code]} onUndo={() => undo(c.code)} onPause={() => pause(c.code)} onResume={() => resume(c.code)} />
        ) : (
          <li key={c.code}>
            <b>{spacedCode(c.code) as string}</b>
            <span className="fp-quiet">
              <span className="nw">for {who(c)}</span> <span className="nw">{"· "}{expiresLabel(c.expiresAt, now)}</span>
            </span>
            {notTaken === c.code && (
              <span className="meta bad fp-codes-bad" role="alert">
                That code wasn’t taken back; check the connection and try again.
              </span>
            )}
            <Button
              variant="quiet"
              small
              ref={returnRef(c.code)}
              onClick={() => {
                setNotTaken(null);
                hold(
                  c.code,
                  `Took back ${spacedCode(c.code)} for ${who(c)}`,
                  `Taking back ${spacedCode(c.code)}…`,
                  () => revokeCode(c.code),
                  () => setCodes((prev) => (prev || []).filter((x) => x.code !== c.code)),
                );
              }}
            >
              {notTaken === c.code ? "Try again" : "Take back"}
            </Button>
          </li>
        ),
      )}
    </ul>
  );
}

export default function Family() {
  const { user } = useAuth();
  const { account, activeStory: story, stories, family, loadError, reload, saveFailure, clearSaveFailure } = useAccount();
  const [params] = useSearchParams();
  const [invite, setInvite] = useState<{ anchor: Person | null; kind?: string | null } | null>(null);
  // Dev only: a fictional family, for judging the page with four generations. Nothing on it writes.
  const preview = import.meta.env.DEV && params.get("preview") === "tree";
  const sample = useMemo(() => (preview ? sampleFamily() : null), [preview]);
  // null until the asks have loaded: "Nothing waiting" waits for both
  const [askedCount, setAskedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reviewRef = useRef<HTMLDivElement>(null);
  const onAskedCount = useCallback((n: number) => setAskedCount(n), []);
  const [askedFailed, setAskedFailed] = useState(false);
  const onAskedFailed = useCallback((f: boolean) => setAskedFailed(f), []);

  const mine = useMyCodes(!preview);
  const shownFamily = sample ? sample.family : family;
  const shownStory = sample ? sample.story : story;
  const people = useMemo(() => realPeople(family), [family]);
  const summary = useMemo(() => {
    if (!shownStory) return "";
    const all = treePeople(realPeople(shownFamily), shownStory);
    const index = buildIndex(shownFamily || { people: [], edges: [] }) as Index;
    const teller = all.find((p) => p.storyId === shownStory.id);
    const plate = buildPlate({ people: all, index, tellerId: teller?.id || null });
    return plate.lone && !plate.unplaced.length ? [] : [generationsLine(plate.generations), peopleLine(all.length, plate.unplaced.length)];
  }, [shownFamily, shownStory]);

  useEffect(() => {
    if (params.get("review") === "1") reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [params]);

  if (account === undefined)
    return (
      <Shell bare wide book={preview ? "A sample family" : undefined}>
        {/* the mark draws itself over a hairline sketch of the page to come: the name, the plate, three generations */}
        <div className="page fp fp-skel" aria-busy="true">
          <span className="sk-line w30 tall" />
          <span className="sk-line w50" />
          <span className="sk-tiers">
            <span className="sk-ring" />
            <span className="sk-ring big" />
            <span className="sk-ring" />
          </span>
        </div>
      </Shell>
    );
  if (account === null && loadError) {
    return (
      <Shell bare wide>
        <div className="page fp">
          <Problem message={`We couldn’t reach the family. ${loadError}`} onRetry={reload} />
        </div>
      </Shell>
    );
  }
  if (!story || !shownStory) return <Navigate to="/start" replace />;

  const meId = user?.id;
  const senderName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const own = story.relationship === "Myself" && (!story.ownerId || story.ownerId === meId);
  const joined = !!story.ownerId && story.ownerId !== meId;
  const viewOwn = sample ? false : own;
  const context = sample ? "A sample family, for looking" : own ? "Your story" : joined ? `${story.name}’s story, which you’ve joined` : `${story.name}’s story, which you keep`;

  const afterWrite = async () => {
    await reload();
    mine.reload();
  };

  /** Somebody already in the family, put into the tree beside somebody else (one or two edges). */
  const place = async (person: Person, anchor: Person, kind: GhostKind) => {
    if (preview || !user || !family) return;
    setError(null);
    try {
      const householdId = anchor.householdId || person.householdId || (await householdFor(user.id, account, family));
      await placePerson({ family, person, anchor, kind, householdId });
      await reload();
    } catch (err) {
      setError(`${person.givenName} wasn’t placed (${(err as Error)?.message || "no connection"}).`);
    }
  };

  return (
    <Shell bare wide book={preview ? "A sample family" : undefined}>
      <div className="page fp">
        <header className="fp-head" data-rise>
          <div className="fp-name">
            <Cartouche letter={(Array.from(String(shownStory.lastName || shownStory.name || "").trim())[0] || "A").toUpperCase()} />
            <div className="fp-title">
              <h1>
                {familyTitle(shownStory)}
                <span className="stop">.</span>
              </h1>
              <p className="fp-sub">
                {[context, ...(summary || [])].map((part, i) => (
                  <span className="sub-part" key={part}>
                    {i > 0 && <span className="sub-dot"> · </span>}
                    <span className="nw">{part}</span>
                  </span>
                ))}
              </p>
            </div>
          </div>
          <Button icon={<PlusIcon />} onClick={() => !preview && setInvite({ anchor: null })} aria-disabled={preview || undefined}>
            Invite someone
          </Button>
        </header>

        {saveFailure && <Problem message={saveFailure.message} onRetry={() => saveFailure.retry().catch(() => {})} onDismiss={clearSaveFailure} />}
        {error && <Problem message={error} onDismiss={() => setError(null)} />}
        {!preview && <Duplicates people={people} family={family} stories={stories} meId={meId} onChanged={afterWrite} />}

        <div className="fp-grid">
          <Storyteller family={shownFamily} story={shownStory} meId={sample ? null : meId} own={viewOwn} preview={preview} onInvite={() => !preview && setInvite({ anchor: null })} />
          <FamilyTree
            family={shownFamily}
            story={shownStory}
            meId={sample ? null : meId}
            own={viewOwn}
            preview={preview}
            onAdd={(anchor, kind) => !preview && setInvite({ anchor, kind })}
            onPlace={place}
            canPlace={(p) => !preview && canEdit(p, family, meId)}
            coded={sample ? null : mine.codes === null ? "unknown" : mine.coded}
          />
        </div>

        {!preview && (
          <section className="fp-keep" aria-label="Keeping the family">
            <Star />
            {/* what waits for a yes runs across the top; with nothing waiting it is one ruled line */}
            <div className="fp-keep-review" ref={reviewRef} id="review">
              <ReviewQueue
                story={story}
                askedCount={askedCount}
                askedFailed={askedFailed}
                asked={<Asked story={story} family={family} meId={meId} keeper onCount={onAskedCount} onFailed={onAskedFailed} onChanged={afterWrite} />}
              />
              <WaitingOnOthers meId={meId} family={family} />
            </div>

            {/* the two plates fill the row at one height; the family’s dog sits behind the Invitations plate’s top
                edge, only head and paws above it, in clear space of his own (he never touches a word) */}
            <div className="fp-keep-cards">
              <div className="fp-invite-wrap">
                <img className="fp-dog" src="/dog/curious-paper.webp" alt="" aria-hidden="true" width={753} height={630} />
                <section className="fp-keep-col fp-invites" id="invite" aria-labelledby="fp-invites-h">
                  <h2 id="fp-invites-h">Invitations</h2>
                  <p className="fp-how">They join with a code or a link, and add what they remember under their own name.</p>
                  <MyCodes people={people} mine={mine} />
                </section>
              </div>

              {story.ownerId === meId && (
                <div className="fp-keep-col">
                  <Keepers story={story} people={people} senderName={senderName} />
                </div>
              )}
            </div>
          </section>
        )}

        <WhereNext
          rows={[
            { to: "/", title: "Today’s question", line: "One question a day, for whoever is telling." },
            { to: "/archive", title: "The archive", line: `Everything ${own ? "you have" : `${story.name} has`} told, by year and by chapter.` },
            { to: "/book", title: "The book", line: "How the family’s memories print, page by page." },
          ]}
        />
      </div>

      {invite && user && (
        <InviteSheet story={story} family={family} account={account} userId={user.id} senderName={senderName} anchor={invite.anchor} presetKind={invite.kind || ""} onClose={() => setInvite(null)} onSaved={afterWrite} />
      )}
    </Shell>
  );
}
