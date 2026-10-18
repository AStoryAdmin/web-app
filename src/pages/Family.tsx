/**
 * Family: the family as the front of the book draws it. The page takes the
 * whole window (Shell bare and wide): the family's name and what it holds
 * at the top of the sheet with the one way to invite somebody; then the
 * storyteller's column (their own words, the family's lines) beside the
 * family tree (components/family/tree: one tier per generation, the
 * storyteller largest in the middle, couples joined by an ampersand,
 * children threaded to their parents, a dashed ring where somebody is
 * missing, the not-placed shelf). Under it, the keeping of the family:
 * what waits for your review, the codes you've sent and how an invitation
 * works, and who may edit. Each person is in one of three states, in the
 * product's own words ("not on A Story yet", "invited · waiting for them",
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
import { Cartouche, PressedFern, WhereNext } from "../components/family/Ornaments";
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
import { useAuth } from "../state/authContext";
import { useAccount } from "../state/accountContext";
import { householdFor, listMyCodes, revokeCode, type MyCode } from "../data/familyWrites";
import { buildIndex } from "../app-core/lib/familyGraph.js";
import { spacedCode } from "../app-core/lib/familyCode.js";
import { canEdit, expiresLabel, familyTitle, personName, realPeople, type Index } from "../components/family/familyView";
import type { Person } from "../data/family";

/** The codes this account has sent that still open a place, each with a way to take it back. */
function MyCodes({ people, version }: { people: Person[]; version: number }) {
  const [codes, setCodes] = useState<MyCode[] | null>(null);
  const [now, setNow] = useState(() => new Date(0));
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    listMyCodes()
      .then((list) => {
        if (!live) return;
        setCodes(list);
        setNow(new Date());
      })
      .catch(() => live && setCodes([]));
    return () => {
      live = false;
    };
  }, [version]);
  if (codes === null) return <p className="fp-quiet" aria-busy="true">Looking for the codes you've sent…</p>;
  if (!codes.length) return <p className="fp-quiet">No codes out at the moment.</p>;
  const who = (c: MyCode) => (c.personId ? personName(people.find((p) => p.id === c.personId)) || "a place in the tree" : "the family");
  return (
    <ul className="fp-codes" aria-label="Codes you've sent">
      {codes.map((c) => (
        <li key={c.code}>
          <b>{spacedCode(c.code) as string}</b>
          <span className="fp-quiet">
            for {who(c)} · {expiresLabel(c.expiresAt, now)}
          </span>
          <Button
            variant="quiet"
            small
            loading={busy === c.code}
            onClick={async () => {
              setBusy(c.code);
              setFailed(null);
              try {
                await revokeCode(c.code);
                setCodes((prev) => (prev || []).filter((x) => x.code !== c.code));
              } catch {
                setFailed(c.code);
              } finally {
                setBusy(null);
              }
            }}
          >
            {failed === c.code ? "Try again" : "Take back"}
          </Button>
        </li>
      ))}
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
  const [codesVersion, setCodesVersion] = useState(0);
  const [askedCount, setAskedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const reviewRef = useRef<HTMLDivElement>(null);
  const onAskedCount = useCallback((n: number) => setAskedCount(n), []);

  const shownFamily = sample ? sample.family : family;
  const shownStory = sample ? sample.story : story;
  const people = useMemo(() => realPeople(family), [family]);
  const summary = useMemo(() => {
    if (!shownStory) return "";
    const all = treePeople(realPeople(shownFamily), shownStory);
    const index = buildIndex(shownFamily || { people: [], edges: [] }) as Index;
    const teller = all.find((p) => p.storyId === shownStory.id);
    const plate = buildPlate({ people: all, index, tellerId: teller?.id || null });
    return plate.lone && !plate.unplaced.length ? "" : `${generationsLine(plate.generations)} · ${peopleLine(all.length, plate.unplaced.length)}`;
  }, [shownFamily, shownStory]);

  useEffect(() => {
    if (params.get("review") === "1") reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [params]);

  if (account === undefined) return <Shell bare wide><div className="page" aria-busy="true" /></Shell>;
  if (account === null && loadError) {
    return (
      <Shell bare wide>
        <div className="page fp">
          <Problem message={`We couldn't reach the family. ${loadError}`} onRetry={reload} />
        </div>
      </Shell>
    );
  }
  if (!story || !shownStory) return <Navigate to="/start" replace />;

  const meId = user?.id;
  const senderName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const own = story.relationship === "Myself" && (!story.ownerId || story.ownerId === meId);
  const joined = !!story.ownerId && story.ownerId !== meId;
  const whose = own ? "your" : `${story.name}'s`;
  const viewOwn = sample ? false : own;
  const context = sample ? "A sample family, for looking" : own ? "Your story" : joined ? `${story.name}'s story, which you've joined` : `${story.name}'s story, which you keep`;

  const afterWrite = async () => {
    await reload();
    setCodesVersion((v) => v + 1);
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
      setError(`${person.givenName} wasn't placed (${(err as Error)?.message || "no connection"}).`);
    }
  };

  return (
    <Shell bare wide>
      <div className="page fp">
        <header className="fp-head" data-rise>
          <div className="fp-name">
            <PressedFern />
            <Cartouche letter={(Array.from(String(shownStory.lastName || shownStory.name || "").trim())[0] || "A").toUpperCase()} />
            <div className="fp-title">
              <h1>
                {familyTitle(shownStory)}
                <span className="stop">.</span>
              </h1>
              <p className="fp-sub">{[context, summary].filter(Boolean).join(" · ")}</p>
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
          />
        </div>

        {!preview && (
          <section className="fp-keep" aria-label="Keeping the family">
            <div className="fp-keep-col" ref={reviewRef} id="review">
              <ReviewQueue story={story} askedCount={askedCount} asked={<Asked story={story} family={family} meId={meId} keeper onCount={onAskedCount} onChanged={afterWrite} />} />
              <WaitingOnOthers meId={meId} family={family} />
            </div>

            <section className="fp-keep-col fp-invites" id="invite" aria-labelledby="fp-invites-h">
              {/* someone new is coming: the family's dog, curious, chin on the plate's edge (decoration D11) */}
              <img className="fp-dog" src="/dog/curious-paper.webp" alt="" aria-hidden="true" />
              <h2 id="fp-invites-h">Invitations</h2>
              <p className="fp-how">
                Whoever you invite joins {whose} family tree with a code or a link. They read what's shared and add what they remember, under their own name. Nobody writes as {own ? "you" : story.name}.
              </p>
              <MyCodes people={people} version={codesVersion} />
            </section>

            {story.ownerId === meId && (
              <div className="fp-keep-col">
                <Keepers story={story} people={people} senderName={senderName} />
              </div>
            )}
          </section>
        )}

        <WhereNext
          items={[
            { to: "/write", title: own ? "Add a memory" : `Add something ${story.name} told you`, line: "A few lines is plenty. It takes about five minutes." },
            { to: "/archive", title: "The archive", line: `Everything ${own ? "you have" : `${story.name} has`} told, by year and by chapter.` },
            { to: "/book", title: "The book", line: "How the family's memories print, page by page." },
          ]}
        />
      </div>

      {invite && user && (
        <InviteSheet story={story} family={family} account={account} userId={user.id} senderName={senderName} anchor={invite.anchor} presetKind={invite.kind || ""} onClose={() => setInvite(null)} onSaved={afterWrite} />
      )}
    </Shell>
  );
}
